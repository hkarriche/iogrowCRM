app.controller('OpportunityListCtrl', ['$scope','Auth','Account','Opportunity','Opportunitystage','Search',
    function($scope,Auth,Account,Opportunity,Opportunitystage,Search) {
      
     $("#id_Opportunities").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     //HKA 11.12.2013 var Opportunity to manage Next & Prev
     $scope.opppagination = {};
     $scope.oppCurrentPage=01;
     $scope.opppages=[];

     $scope.opportunities = [];
     $scope.stage_selected={};
     $scope.opportunity = {};
     $scope.opportunity.access ='public';
     $scope.order = '-updated_at';

      // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {'order' : $scope.order,'limit':7};
          Opportunity.list($scope,params);
          Opportunitystage.list($scope,{'order':'probability'});
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.listNextPageItems = function(){
        
        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'order' : $scope.order,
                      'limit':7,
                      'pageToken':$scope.opppages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ; 
          Opportunity.list($scope,params);
     }
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.oppCurrentPage - 1;
       var params = {};
          if ($scope.opppages[prevPage]){
            params = {'order' : $scope.order,'limit':7,
                      'pageToken':$scope.opppages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          $scope.oppCurrentPage = $scope.oppCurrentPage - 1 ;
          Opportunity.list($scope,params);
     }
    

     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addOpportunityModal').modal('show');

      };
      
    $scope.save = function(opportunity){
      var params = {};
      console.log('I am here on this method');
          console.log($scope.stage_selected.name);
          console.log($scope.stage_selected.probability);

       opportunity.stagename= $scope.stage_selected.name;
       opportunity.stage_probability= $scope.stage_selected.probability;
        
        if (typeof(opportunity.account)=='object'){
          opportunity.account_name = opportunity.account.name;
          opportunity.account_id = opportunity.account.id;
          opportunity.account = opportunity.account.entityKey;
          
           
          
          Opportunity.insert($scope,opportunity);

        }else if($scope.searchAccountQuery.length>0){
            // create a new account with this account name
            var params = {'name': $scope.searchAccountQuery,
                          'access': opportunity.access
            };
            $scope.opportunity = opportunity;
            Account.insert($scope,params);


        };

     
    };
    $scope.addOpportunityOnKey = function(opportunity){
      if(event.keyCode == 13 && opportunity.amount){
          $scope.save(opportunity);
      }
      
      
    };
    $scope.accountInserted = function(resp){
          $scope.opportunity.account = resp;
          $scope.save($scope.opportunity);
      };
      
    var params_search_account ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
      $scope.$watch('searchAccountQuery', function() {
         params_search_account['q'] = $scope.searchAccountQuery;
         if ($scope.searchAccountQuery){
         gapi.client.crmengine.accounts.search(params_search_account).execute(function(resp) {
            console.log("in accouts.search api");
            console.log(params_search_account);

            console.log(resp);
            if (resp.items){
              $scope.results = resp.items;
              console.log($scope.accountsResults);
              $scope.$apply();
            };
            
          });
         };
      });
      $scope.selectAccount = function(){
        $scope.opportunity.account = $scope.searchAccountQuery;

     };
     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Opportunity.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/opportunities/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Opportunity ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/opportunities/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.$apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':7};
        $scope.order = order;
        Opportunity.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order, 
                         'limit':7}
        }
        else{
          var params = {
              'order': $scope.order, 
              
              'limit':7}
        };
        console.log('Filtering by');
        console.log(params);
        Opportunity.list($scope,params);
     };
     $scope.filterByStage = function(filter){
        if (filter){
          var params = { 'stagename': filter,
                         'order': $scope.order, 
                         'limit':7}
        }
        else{
          var params = {
              'order': $scope.order, 
              
              'limit':7}
        };
        
        Opportunity.list($scope,params);
     };

     // Google+ Authentication 
     Auth.init($scope);
     
}]);

app.controller('OpportunityShowCtrl', ['$scope','$filter','$route','Auth','Task','Event','Topic','Note','Opportunity','Permission','User','Opportunitystage',
    function($scope,$filter,$route,Auth,Task,Event,Topic,Note,Opportunity,Permission,User,Opportunitystage) {
 
      $("#id_Opportunities").addClass("active");
      
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.pagination = {};
     //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.opportunities = [];
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
      $scope.stage_selected={};

      // What to do after authentication
       $scope.runTheProcess = function(){
          var opportunityid = {'id':$route.current.params.opportunityId};
          Opportunity.get($scope,opportunityid);
          User.list($scope,{});
          //HKA 13.12.2013 to retrieve the opportunities's stages
          Opportunitystage.list($scope,{});
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     //HKA 09.11.2013 Add a new Task
     $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        var params ={}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about_kind':'Opportunity',
                     'about_item':$scope.opportunity.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     }
     $scope.editOpp = function(){
      $('#EditOpportunityModal').modal('show')
     }

     $scope.TopiclistNextPageItems = function(){
        
        
        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          console.log('in listNextPageItems');
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ; 
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          
     }
    
     $scope.listTopics = function(opportunity){
        var params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Topic.list($scope,params);

     }
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }


     
     $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.opportunity.access, function() {
         var body = {'access':$scope.opportunity.access};
         var id = $scope.opportunity.id;
         var params ={'id':id,
                      'access':$scope.opportunity.access}
         Opportunity.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Opportunity',
                        'about_item': $scope.opportunity.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };
     
     $scope.updateCollaborators = function(){
          var opportunityid = {'id':$scope.opportunity.id};
          Opportunity.get($scope,opportunityid);

     };

//HKA 11.11.2013 Add new Event
 $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}       
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);

            
        };
     };
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     };
     $scope.listEvents = function(){
        var params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     };


 //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.opportunity.id,
                  'about_kind':'Opportunity' };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  };
// 26.11.2013 Update Opportunity
 $scope.UpdateOpportunity = function(opportunity){
  var params = {'id':$scope.opportunity.id,
                'name':opportunity.name,
                 'stagename':$scope.stage_selected.name,
                 'stage_probability':$scope.stage_selected.probability,
                'amount':opportunity.amount,
                'description':opportunity.description};
  $scope.$watch(opportunity.amount, function() {
      var paramsNote = {
                  'about_kind': 'Opportunity',
                  'about_item': $scope.opportunity.id,
                  'title': 'stage updated to '+ opportunity.amount
                  
      };
      console.log('inserting a new note');
      console.log(paramsNote);
      
      Note.insert($scope,paramsNote);
   });              
  Opportunity.patch($scope,params);
  $('#EditOpportunityModal').modal('hide');
 }
    
     // Google+ Authentication 
     Auth.init($scope);

}]);





