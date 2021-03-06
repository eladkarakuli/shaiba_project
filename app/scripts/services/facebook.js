'use strict';

/**
 * @ngdoc service
 * @name shaibaApp.Facebook
 * @description
 * # Facebook
 * Factory in the shaibaApp.
 */
angular.module('shaibaApp')
  .factory('Facebook', ['$facebook', '$q', '$rootScope', 'ngProgress', 'parse', 'SharedData', 'AppAlert',
        function ($facebook, $q, $rootScope, ngProgress, parse, SharedData, AppAlert) {
    // Service logic
    // ...
        $rootScope.isLoggedIn = false;
        $rootScope.isAdmin = false;
        $rootScope.fbUserName = null;
        $rootScope.showFbLogin = false;

    var facebookService = {

        // Vars to return
        userDetails: {
            userName: '',
            userEmail: '',
            userId: ''
        },

/*        // Test facebook connection
        testFacebook: function() {
            $facebook.api('/me').then(
                function (response) {
                    console.log('Welcome ' + response.name);
                },
                function () {
                    console.log('Please log in');
                });
        },*/

        refresh: function() {
            var deferred = $q.defer();
            ngProgress.start();
            $facebook.api('/me').then(
                function(response) {
                    $rootScope.welcomeMsg = 'Welcome ' + response.name;
                    facebookService.userDetails.userName = response.name;
                    facebookService.userDetails.userEmail = response.email;
                    facebookService.userDetails.userId = response.id;
                    if($rootScope.admins.indexOf(response.id) >= 0) {
                        $rootScope.isAdmin = true;
                    }
                    $rootScope.showFbLogin = false;
                    $rootScope.isLoggedIn = true;
                    ngProgress.complete();
                    deferred.resolve(response);
                },
                function() {
                    $rootScope.welcomeMsg = 'Please log in';
                    $rootScope.showFbLogin = true;
                    ngProgress.complete();
                    deferred.reject(null);
                });
            return deferred.promise;
        },
        getUserId: function(){
            if ($rootScope.isLoggedIn === true){
                return facebookService.userDetails.userId;
            } else {
                return '';
            }
        },
        login:  function() {
            $facebook.login().then(function() {
                console.log(facebookService);
                facebookService.refresh()
                    .then(function(response){
                       parse.getTable('users', false)
                           .then(function(users){
                               var boolean = false;
                               angular.forEach(users, function(user){
                                   console.log(user);
                                   if(user.fbId === response.id){
                                       boolean = true;
                                   }
                               });
                               if (!boolean){
                                   parse.postToParse('users', {fbId: response.id, fbUserName: response.name,
                                       fbEmail: response.email, isAdmin: false});
                                   console.log('New user!!' + response.id);
                                   AppAlert.add(SharedData.appAlertTypes.INFO, 'אני רואה שזאת פעם ראשונה שלך. ברוך הבא צעירו!');
                               }
                           });
                    });
            });
        }
        /*logout: function() {
            $facebook.logout().then(function(){
                $rootScope.fbUserName = null;
                facebookService.refresh();
            });
        }*/



    };
        return facebookService;
  }]);
