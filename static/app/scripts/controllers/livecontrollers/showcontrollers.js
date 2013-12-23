app.controller('ShowListCtrl', ['$scope','$filter','Auth','Show',
    function($scope,$filter,Auth,Show) {
     $("#id_Shows").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.accounts = [];
     
     

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7};
          Show.list($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Show.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Account.list($scope,params);
     }
      $scope.scheduleShow = function(ioevent){
      
        $('#newShowModal').modal('hide');
        var params ={}

        console.log('adding a new show');
        var tagsplit = ioevent.tags.split(' ');

        var tags = [];
        for (i=0; i<tagsplit.length; i++){
        
            tags.push(tagsplit[i]);
      
        }
        console.log('# hastags');
        console.log(tags);
        console.log($filter);
        
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              var starts_at = $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']);
              var ends_at = $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']);
              params ={'name': ioevent.name,
                      'starts_at': starts_at,
                      'ends_at':ends_at ,
                      'is_published': true,
                      'tags': tags
              }

            }else{
              params ={'name': ioevent.name,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'tags': tags
              }
            }
            console.log('inserting the event');
            console.log(params);
            Show.insert($scope,params);

            
        }
     }
     

     $scope.showModal = function(){
        console.log('button clicked');
        $('#newShowModal').modal('show');

      };
      
    $scope.save = function(account){
      Account.insert(account);
    };
     
     
   // Google+ Authentication 
    Auth.init($scope);

    
}]);

app.controller('ShowShowCtrl', ['$scope','$filter', '$route','Auth','Show', 'Topic','Note','Task','Event','WhoHasAccess','User','Leadstatus','Lead',
    function($scope,$filter,$route,Auth,Show,Topic,Note,Task,Event,WhoHasAccess,User,Leadstatus,Lead) {
      
      $("#id_Shows").addClass("active");
      var tab = $route.current.params.accountTab;
      switch (tab)
        {
        case 'notes':
         $scope.selectedTab = 1;
          break;
        case 'about':
         $scope.selectedTab = 2;
          break;
        case 'contacts':
         $scope.selectedTab = 3;
          break;
        case 'opportunities':
         $scope.selectedTab = 4;
          break;
        case 'cases':
         $scope.selectedTab = 5;
          break;
        default:
        $scope.selectedTab = 1;

        }

     
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
    //HKA 22.12.2013 Var topic to manage Next & Prev
      $scope.topicCurrentPage=01;
      $scope.topicpagination={};
      $scope.topicpages = [];
      $scope.stage_selected={};
      $scope.leadpagination = {};
     
      $scope.pages = [];
     
     $scope.accounts = [];
     
     
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'id':$route.current.params.showId};
          Show.get($scope,params);
           Leadstatus.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };

     $scope.createYoutubePicker = function() {
          console.log('ok should create youtube picker');
          var picker = new google.picker.PickerBuilder().
          addView(google.picker.ViewId.YOUTUBE).
         
          build();
          picker.setVisible(true);
      };
     
     $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        var params ={}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {/*'about_kind':'Account',
                      'about_item':$scope.account.id,*/
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     }
     $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}

        console.log('adding a new event');
        
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where
              }

            }else{
              params ={'title': task.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);

            
        };
     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     }
     $scope.listEvents = function(){
        var params = {/*'about_kind':'Account',
                      'about_item':$scope.account.id,*/
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     }

     
     $scope.TopiclistNextPageItems = function(){
        
        
       var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
           if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;  
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
         
     }
     
     $scope.listTopics = function(show){
        var params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
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

    
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      
    $scope.addNote = function(note){
      console.log('debug addNote');
      
      var params ={
                  'about_kind': 'Show',
                  'about_item': $scope.show.id,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };
      



    $scope.editaccount = function() {
       $('#EditShowModal').modal('show');
    };
    $scope.saveshow = function(show){
      var params = {'id':show.id,
    'name':show.name};
     Show.update($scope,params);
   $('#EditShowModal').modal('hide');
    };

 $scope.editdescription = function(){
  $('#EditShowDescription').modal('show');
}
  
 $scope.updateDescription = function(show){
  var params = {'id':show.id,
    'description':show.description};
    Show.update($scope,params);
   $('#EditShowDescription').modal('hide');
 };

//HKA 23.12.2013 Add a new lead to the Show
 $scope.AddleadModal = function(){
  $('#addLeadShow').modal('show');
 };

$scope.save = function(lead){
        var params ={'firstname':lead.firstname,
                      'lastname':lead.lastname,
                      'company':lead.company,
                      'title':lead.title,
                      'show':$scope.show.entityKey,
                      'show_name':$scope.show.name,
                      'status':$scope.stage_selected.status};
        Lead.insert($scope,params);
        $('#addLeadShow').modal('hide')
      };
$scope.addLeadOnKey = function(lead){
        if(event.keyCode == 13 && lead){
            $scope.save(lead);
        }
      };
$scope.listLead = function(){
  var params = {'show':$scope.show.entityKey,
                 'limit':5};
  Lead.list($scope,params);
};


      
// Google+ Authentication 
    Auth.init($scope);


}]);