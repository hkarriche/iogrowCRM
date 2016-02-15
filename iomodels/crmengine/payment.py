import datetime
from functools import wraps

import endpoints
from endpoints.api_exceptions import PreconditionFailedException
from google.appengine.ext import ndb

import stripe
from iomodels.crmengine import config
from profilehooks import timecall


def _created_record_count_after(entity, organization, start_date):
    return ndb.Query(kind=entity).filter(ndb.GenericProperty("organization") == organization,
                                         ndb.GenericProperty('created_at') > start_date).count()


stripe.api_key = config.STRIPE_API_KEY


@timecall
def created_record_sum(entities, organization, start_date):
    sum1 = sum(
        [_created_record_count_after(entity.partition('_')[2].capitalize(), organization, start_date) for entity in
         entities])
    return sum1


def payment_required():
    def payment_r(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            rate_limit_message = "Your free plan rich it's limit."
            organization = _get_organization(kwargs)
            subscription = organization.get().get_subscription()
            if subscription.plan.get().name != config.PREMIUM:
                limit = subscription.get_records_limit()
                if limit is not None:
                    entities = subscription.get_activated_plan().kinds_to_limit
                    count = created_record_sum(entities, organization, subscription.start_date)
                    if count > limit:
                        raise PreconditionFailedException(rate_limit_message)
            return f(*args, **kwargs)

        def _get_organization(kwargs):
            endpoint_user = endpoints.get_current_user()
            can_not_verify = "Can not verify licence detail."
            if 'user_from_email' in kwargs:
                user = kwargs['user_from_email']
            else:
                for name, value in kwargs.iteritems():
                    # TODO : change type checking using isinstance method (i can not create a dependency to model.py)
                    if 'email' in value and value.email == endpoint_user.email():
                        user = value
                        break
            if not user:
                raise PreconditionFailedException(can_not_verify)
            organization = user.organization
            return organization

        return decorated_function

    return payment_r


FEATURES = []


class BaseModel(ndb.Model):
    created = ndb.DateTimeProperty(auto_now_add=True)
    updated = ndb.DateTimeProperty(auto_now=True)


class Plan(BaseModel):
    name = ndb.StringProperty(required=True, choices=config.PLANS_NAMES)
    price = ndb.IntegerProperty(required=True)
    interval = ndb.StringProperty(choices=config.PLANS_INTERVALS)
    description = ndb.TextProperty()
    kinds_to_limit = ndb.StringProperty(repeated=True)
    limit = ndb.IntegerProperty()

    @classmethod
    def get_freemium_plan(cls):
        return cls.get_by_name_and_interval(config.FREEMIUM)

    @classmethod
    def get_premium_plan(cls, interval):
        return cls.get_by_name_and_interval(config.PREMIUM, interval)

    @classmethod
    def get_life_free_plan(cls):
        return cls.get_by_name_and_interval(config.LIFE_FREE)

    @classmethod
    def get_by_name_and_interval(cls, name, interval=None):
        plan = cls.query(cls.name == name and cls.interval == interval).get()
        if plan is None:
            plan = cls(name=name, interval=interval)
            plan.price = plan.calculate_price()
            if name == config.FREEMIUM:
                plan = cls(name=name, kinds_to_limit=config.ALL_KINDS, limit=config.ALL_KINDS_LIMIT, interval=interval,
                           price=plan.price)
            elif name not in config.PLANS_NAMES:
                raise AttributeError('This name is not supported')
            plan.put()
            if plan.name == config.PREMIUM:
                stripe.Plan.create(
                    amount=plan.price,
                    interval=interval[:-2],
                    name='{} {}'.format(interval.capitalize(), config.PREMIUM),
                    currency='usd',
                    id='{}_{}'.format(config.PREMIUM, interval))
        return plan

    def calculate_price(self):
        if self.name == config.PREMIUM:
            if self.interval == config.YEARLY:
                return config.PREMIUM_YEARLY_PRICE
            elif self.interval == config.MONTHLY:
                return config.PREMIUM_MONTHLY_PRICE
            else:
                raise AttributeError('This cycle name is not supported')
        if self.name == config.FREEMIUM or self.name == config.LIFE_FREE:
            return 0


# class Licence(BaseModel):
#     plan = ndb.KeyProperty(kind=Plan, required=True)
#     cycle = ndb.StringProperty(choices=config.PLANES_CYCLES)
#     price = ndb.FloatProperty()
#     description = ndb.StringProperty()
#
#     @classmethod
#     def get_freemium_licence(cls):
#         return cls.get_by_cycle_and_name(config.FREEMIUM)
#
#     @classmethod
#     def get_premium_licence(cls, cycle):
#         return cls.get_by_cycle_and_name(config.PREMIUM, cycle)
#
#     @classmethod
#     def get_life_free_licence(cls):
#         return cls.get_by_cycle_and_name(config.LIFE_FREE)
#
#     @classmethod
#     def get_by_cycle_and_name(cls, name, cycle=None):
#         plan = Plan.get_by_name(name)
#         licence = cls.query(cls.cycle == cycle, cls.plan == plan.key).get()
#         if not licence:
#             if cycle and cycle not in config.PLANES_CYCLES:
#                 raise AttributeError('This cycle name is not supported')
#             licence = cls(plan=plan.key, cycle=cycle)
#             licence.price = licence.calculate_price()
#             licence.put()
#         return licence
#
#     def calculate_price(self):
#         if self.plan.get().name == config.PREMIUM:
#             if self.cycle == config.ANNUAL:
#                 return config.PREMIUM_ANNUAL_PRICE
#             elif self.cycle == config.MONTHLY:
#                 return config.PREMIUM_MONTHLY_PRICE
#             else:
#                 raise AttributeError('This cycle name is not supported')
#         return 0


class Subscription(BaseModel):
    plan = ndb.KeyProperty(kind=Plan)
    start_date = ndb.DateTimeProperty(required=True)
    expiration_date = ndb.DateTimeProperty()
    description = ndb.StringProperty()

    @classmethod
    def create_freemium_subscription(cls):
        plan = Plan.get_freemium_plan().key
        subscription = Subscription(plan=plan, start_date=datetime.datetime.now(),
                                    description='Default Subscription')
        subscription.put()
        return subscription

    @classmethod
    def create_premium_subscription(cls, interval):
        plan = Plan.get_premium_plan(interval).key
        subscription = Subscription(plan=plan, start_date=datetime.datetime.now(),
                                    expiration_date=cls._calculate_expiration_date(interval),
                                    description='{} Premium Subscription'.format(interval))
        subscription.put()
        return subscription

    @classmethod
    def create_life_free_subscription(cls):
        plan = Plan.get_life_free_plan().key
        subscription = Subscription(plan=plan, start_date=datetime.datetime.now(),
                                    description='Life Free Subscription')
        subscription.put()
        return subscription

    @classmethod
    def _calculate_expiration_date(cls, interval):
        if interval == config.MONTHLY:
            return datetime.datetime.now() + datetime.timedelta(days=30)
        elif interval == config.YEARLY:
            return datetime.datetime.now() + datetime.timedelta(days=356)
        else:
            raise AttributeError('This cycle name is not supported')

    def get_records_limit(self):
        return self.get_activated_plan().limit

    def get_activated_plan(self):
        return self.plan.get()
