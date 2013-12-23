from google.appengine.ext import ndb
from google.appengine.api import search
from endpoints_proto_datastore.ndb import EndpointsModel
from model import User
import pprint


import model

class Show(EndpointsModel):
    _message_fields_schema = ('id','entityKey', 'name','starts_at','ends_at','description','tags','youtube_url','is_published','status')
    author = ndb.StructuredProperty(User)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    name = ndb.StringProperty()
    starts_at = ndb.DateTimeProperty()
    ends_at = ndb.DateTimeProperty()
    description = ndb.TextProperty()
    youtube_url = ndb.StringProperty()
    is_published = ndb.BooleanProperty()
    tags = ndb.StringProperty(repeated=True)
    status = ndb.StringProperty(default='scheduled')

    # a key reference to the account's organization
    # Should be required
    organization = ndb.KeyProperty()
    organization_name = ndb.StringProperty()

    # public or private
    access = ndb.StringProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Account',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()


    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Show'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='title', value = empty_string(self.name)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.TextField(name='status', value = empty_string(self.status)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)