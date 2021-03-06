'use strict';

/**
 * @ngdoc function
 * @name shaibaApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the shaibaApp
 */
angular.module('shaibaApp')
  .controller('MainCtrl', ['$scope', 'parse', '$q', '$timeout', 'Facebook', 'AppAlert', 'Title', '$rootScope', 'SharedData',
        function ($scope, parse, $q, $timeout, Facebook, AppAlert, Title, $rootScope, SharedData) {
        Title.setTitle('מחולל שייבה');

        // $scope objects
        $scope.nation = '';
        $scope.dish = '';
        $scope.adj = '';

        $scope.getSentence = function(){

            var dishPromise = parse.getRandom('dishes');
            var nationPromise = parse.getRandom('nations');
            var adjPromise = parse.getRandom('adj');

            $q.all([dishPromise, nationPromise, adjPromise])
                .then(function(data) {
                    $rootScope.favStarCss = 'glyphicon glyphicon-star favstar pull-left';
                    var newDish = data[0];
                    var newNation = data[1];
                    var newAdj = data[2];
                    var suffix = '';
                    var adj = newAdj.name;
                    if (newNation.name[newNation.name.length-1] === 'י') {
                        if (newDish.isMale) {
                            if (newDish.isPlural) {
                                suffix = 'ם';
                            } else {
                                suffix = '';
                            }
                        } else if (newDish.isPlural) {
                            suffix = 'ות';
                        } else {
                            suffix = 'ת';
                        }
                    }
                    if (!newAdj.isSame) {
                        if (newDish.isMale) {
                            if (newDish.isPlural) {
                                adj = newAdj.versions[SharedData.hebrewOptionsEnum.PLURAL_MALE];
                            } else {
                                adj = newAdj.versions[SharedData.hebrewOptionsEnum.SINGLE_MALE];
                            }
                        } else if (newDish.isPlural) {
                            adj = newAdj.versions[SharedData.hebrewOptionsEnum.PLURAL_FEMALE];
                        } else {
                            adj = newAdj.versions[SharedData.hebrewOptionsEnum.SINGLE_FEMALE];
                        }
                    }
                    $scope.dish = newDish.name;
                    $scope.nation = newNation.name + suffix;
                    $scope.adj = adj;
                    console.log(data);
                }, function(result) {
                    console.log('Failed to get one of them: ' + result);
                });
        };

        $scope.addToHall = function(){
            if (!$rootScope.isLoggedIn) {
                AppAlert.add(SharedData.appAlertTypes.WARNING, 'אהבת את המשפט? רוצה להצביע? יאללה תתחבר לפייסבוק נשמה.', 4000);
            } else if ($scope.nation !== '' && $scope.dish !== '' && $scope.adj !== '') {
                parse.getTable('best', false)
                    .then(function (best) {
                        var checksentence = $scope.dish + ' ' + $scope.nation + ' ' + $scope.adj;
                        var exists = false;
                        for (var i = 0; i < best.length && !exists; i++) {
                            if (best[i].name === checksentence) {
                                exists = true;
                                $rootScope.favStarCss = 'glyphicon glyphicon-star favstar-disabled pull-left';
                                AppAlert.add(SharedData.appAlertTypes.WARNING, 'המשפט כבר חוגג בהיכל התהילה, נשמה, נסה שוב');
                            }
                        }
                        if (!exists) {
                                parse.postToParse('best', {
                                    name: $scope.dish +
                                        ' ' + $scope.nation +
                                        ' ' + $scope.adj,
                                    grade: 2,
                                    usersNumber: 1,
                                    user: Facebook.userDetails.userId,
                                    userName: Facebook.userDetails.userName,
                                    usersVoted: {'__op': 'AddUnique', 'objects': [Facebook.userDetails.userId]}
                                }).then(function() {
                                        $rootScope.favStarCss = 'glyphicon glyphicon-star favstar-disabled pull-left';
                                        parse.getTable('best', true);
                                    },
                                    function() {
                                        AppAlert.add(SharedData.appAlertTypes.DANGER, 'התרחשה בעיה בשרת');
                                    }
                                );
                                AppAlert.add(SharedData.appAlertTypes.SUCCESS, 'המשפט התווסף להיכל התהילה', 4000);
                        }
                    },
                    function (error) {
                        AppAlert.add(SharedData.appAlertTypes.DANGER, 'וואלה הפארס לא מגיב, נשמה ' + error);
                    });
            } else {
                AppAlert.add(SharedData.appAlertTypes.WARNING, 'שייבה לא אמר כלום יא פלופ! טיפ: לחץ על הראש.', 4000);
            }
        };
    }]);
