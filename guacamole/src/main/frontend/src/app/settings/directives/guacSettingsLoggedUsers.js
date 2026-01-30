/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * A directive for managing all active Guacamole sessions.
 */
angular.module('settings').directive('guacSettingsLoggedUsers', [function guacSettingsLoggedUsers() {
    
    return {
        // Element only
        restrict: 'E',
        replace: true,

        scope: {
        },

        templateUrl: 'app/settings/templates/settingsLoggedUsers.html',
        controller: ['$scope', '$injector', function settingsLoggedUsersController($scope, $injector) {

            // Required types
            var LoggedUserWrapper       = $injector.get('LoggedUserWrapper');
            var SortOrder               = $injector.get('SortOrder');

            // Required services
            var $filter               = $injector.get('$filter');
            var $translate            = $injector.get('$translate');
            var $q                    = $injector.get('$q');
            var loggedUserService     = $injector.get('loggedUserService');
            var authenticationService = $injector.get('authenticationService');
            var dataSourceService     = $injector.get('dataSourceService');
            var guacNotification      = $injector.get('guacNotification');
            var requestService        = $injector.get('requestService');
            var User                  = $injector.get('User');
            var userService           = $injector.get('userService');

            /**
             * The identifiers of all data sources accessible by the current
             * user.
             *
             * @type String[]
             */
            var dataSources = authenticationService.getAvailableDataSources();

            var dataSource = null;

            /**
             * The LoggedUserWrappers of all active user or null if the active
             * users have not yet been loaded.
             *
             * @type LoggedUserWrapper[]
             */
            $scope.wrappers = null;

            $scope.enableAll = false;

            /**
             * SortOrder instance which maintains the sort order of the visible
             * connection wrappers.
             *
             * @type SortOrder
             */
            $scope.wrapperOrder = new SortOrder([
                'loggedUser.username',
                'loggedUser.fullname',
                'loggedUser.management'
            ]);

            /**
             * Array of all wrapper properties that are filterable.
             *
             * @type String[]
             */
            $scope.filteredWrapperProperties = [
                'loggedUser.username',
                'loggedUser.fullname',
                'loggedUser.management'
            ];

            /**
             * All connected user, if known, grouped by corresponding 
             * token identifier, or null if connected users have not yet
             * been loaded.
             *
             * @type Object.<String, LoggedUser>
             */
            var allLoggedUsers = null;

            /**
             * User who is logged.
             */
            var user = null;

            /**
             * Array with all users loaded into system.
             */
            var addedUsers = null;

            /**
             * Map of all currently-selected connected users wrappers by
             * identifier (token).
             * 
             * @type Object.<String, LoggedUserWrapper>
             */
            var allSelectedWrappers = {};


            /**
             * Wraps all loaded active connections, storing the resulting array
             * within the scope. If required data has not yet finished loading,
             * this function has no effect.
             */
           var wrapAllLoggedUsers = function wrapAllLoggedUsers() {

                // Abort if not all required data is available
               if (!allLoggedUsers || !addedUsers || !user)
                   return;
               var lenghtList = dataSources.length;
               for (i = 0; i < lenghtList; i++) {
                   var ds = dataSources[i];
                   if (user[ds] !== undefined && user[ds].attributes) {
                       dataSource = ds;
                       break;
                   }
               }
       	       var role = null;
       	       if (user[dataSource] && user[dataSource].attributes) {
       	    	  role = user[dataSource].attributes[User.Attributes.ORGANIZATIONAL_ROLE];
       	       }
               if (role && role == 'Finalizar-Sesiones' && !addedUsers) {
                   return;
               }

       	       var organization = user[dataSource].attributes[User.Attributes.ORGANIZATION];
    	       var userObtained = null;
               var currentToken = authenticationService.getCurrentToken();

               // Wrap all logged users for sake of display
               $scope.wrappers = [];
               angular.forEach(allLoggedUsers, function wrapLoggedUsers(loggedUser, identifier) {
                   // Add wrapper                       
                   if (identifier !== currentToken && loggedUser.username !== user[dataSource].username) {
                       if (!role || (role && role != 'Finalizar-Sesiones')) {
                           $scope.wrappers.push(new LoggedUserWrapper({
                               dataSource : dataSource,
                               identifier : identifier,
                               loggedUser : loggedUser
                           }));
                       } else {
		           if (addedUsers[loggedUser.username]) {
          	               userObtained = addedUsers[loggedUser.username];
          	           }
          	           if (organization && userObtained 
          	                && organization == 
                                       userObtained.attributes[User.Attributes.ORGANIZATION]) {
          	               $scope.wrappers.push(new LoggedUserWrapper({
                                   dataSource : dataSource,
                                   identifier : identifier,
          	                   loggedUser : loggedUser
          	               }));
          	           }
          	       }
                   }
               });
           };

           // Query active users
           dataSourceService.apply(
               loggedUserService.getLoggedUsers
           )
           .then(function sessionsRetrieved(retrievedLoggedUsers) {

                // Store received map of active connections
                allLoggedUsers = retrievedLoggedUsers;

                // Attempt to produce wrapped list of connected users
                wrapAllLoggedUsers();

           }, requestService.DIE);

           dataSourceService.apply(
       	       userService.getUsers, 
               dataSources
       	   )
       	   .then(function usersReceived(allUsers) {
       	       addedUsers = {};
               angular.forEach(dataSources, function addUserList(dataSource) {
                   angular.forEach(allUsers[dataSource], function addUser(user) {

            		   // Do not add the same user twice
              		   if (addedUsers[user.username])
       		 	       return;
              		   // Add user to overall list
              		   addedUsers[user.username] = user;
                   });
               });
               wrapAllLoggedUsers();
           }, requestService.DIE); 

           dataSourceService.apply(
               userService.getUser,
               authenticationService.getAvailableDataSources(),
               authenticationService.getCurrentUsername()
           )

           // Resolving user logged if possible
           .then(function userRetrieved(retrievedUser) {
               user = retrievedUser;
               wrapAllLoggedUsers();
           }, requestService.DIE); 


           /**
            * Returns whether critical data has completed being loaded.
            *
            * @returns {Boolean}
            *     true if enough data has been loaded for the user interface
            *     to be useful, false otherwise.
            */
           $scope.isLoaded = function isLoaded() {
               return $scope.wrappers !== null;
           };

           /**
            * An action to be provided along with the object sent to
            * showStatus which closes the currently-shown status dialog.
            */
           var CANCEL_ACTION = {
               name        : "SETTINGS_LOGGED.ACTION_CANCEL",
               // Handle action
               callback    : function cancelCallback() {
                   guacNotification.showStatus(false);
               }
           };
            
           /**
            * An action to be provided along with the object sent to
            * showStatus which immediately deletes the currently selected
            * sessions.
            */
           var DELETE_ACTION = {
               name        : "SETTINGS_LOGGED.ACTION_DELETE",
               className   : "danger",
               // Handle action
               callback    : function deleteCallback() {
                   deleteAllUserSessionsImmediately();
                   guacNotification.showStatus(false);
               }
           };
            
           /**
            * Immediately deletes the selected sessions, without prompting the
            * user for confirmation.
            */
           var deleteAllUserSessionsImmediately = function deleteAllUserSessionsImmediately() {

               var deletionRequests = [];
               // Perform deletion for each relevant data source
               angular.forEach(allSelectedWrappers, function deleteUserSessionsImmediately(selectedWrappers, dataSource) {

                   // Delete sessions, if any are selected
                   var identifiers = Object.keys(selectedWrappers);
                   if (identifiers.length)
                       deletionRequests.push(loggedUserService.deleteLoggedSessions(identifiers));

               });

               // Update interface
               $q.all(deletionRequests)
               .then(function connectedUserDeleted() {

                   // Remove deleted connected users from wrapper array
                   $scope.wrappers = $scope.wrappers.filter(function connectedUserStillExists(wrapper) {
                       return !(wrapper.identifier in (allSelectedWrappers[wrapper.dataSource] || {}));
                   });

                   // Clear selection
                   allSelectedWrappers = {};
                   if ($scope.selectAll) {
                       $scope.selectAll = $scope.enableAll = false;
                   }

               }, guacNotification.SHOW_REQUEST_ERROR);

           }; 
            
           /**
            * Delete all selected sessions, prompting the user first to
            * confirm that deletion is desired.
            */
           $scope.deleteLoggedUsers = function deleteLoggedUsers() {
               // Confirm deletion request
               guacNotification.showStatus({
                   'title'      : 'SETTINGS_LOGGED.DIALOG_HEADER_CONFIRM_DELETE',
                   'text'       : {
                       'key' : 'SETTINGS_LOGGED.TEXT_CONFIRM_DELETE'
                   },
                   'actions'    : [ DELETE_ACTION, CANCEL_ACTION]
               });
           };

           /**
            * Returns whether the selected sessions can be deleted.
            * 
            * @returns {Boolean}
            *     true if selected sessions can be deleted, false otherwise.
            */
           $scope.canDeleteLoggedUser = function canDeleteLoggedUser() {
               // We can delete sessions if at least one is selected
                for (var dataSource in allSelectedWrappers) {
                    for (var identifier in allSelectedWrappers[dataSource])
                        return true;
                }
               return false;
           };
            
           $scope.canEnableAllLoggedUsers = function canEnableAllLoggedUsers() {
               if (typeof $scope.wrappers !== 'undefined' && $scope.wrappers !== null) {
                   if (Object.keys($scope.wrappers).length === 0) {
                       return false;
                   }
               }
               return true;
           }

           /**
            * Called whenever an connected user wrapper changes selected
            * status.
            * 
            * @param {LoggedUserWrapper} wrapper
            *     The wrapper whose selected status has changed.
            */
           $scope.wrapperSelectionChange = function wrapperSelectionChange(wrapper) {
               if (dataSource !== null) {
                    // Get selection map for associated data source, creating if necessary
                    var selectedWrappers = allSelectedWrappers[wrapper.dataSource];
                    if (!selectedWrappers)
                        selectedWrappers = allSelectedWrappers[wrapper.dataSource] = {};
     
                    // Add wrapper to map if selected
                    if (wrapper.checked)
                        selectedWrappers[wrapper.identifier] = wrapper;

                    // Otherwise, remove wrapper from map
                    else
                        delete selectedWrappers[wrapper.identifier];
               }

           };

           $scope.checkAll = function() {
               if (typeof $scope.selectAll === 'undefined' || $scope.selectAll === null
                   || !$scope.enableAll) {
                   $scope.enableAll = true;
               } else {
                   $scope.enableAll = false;
               }
               $scope.selectAll = $scope.enableAll;
               allSelectedWrappers = {};
               angular.forEach($scope.wrappers, function(user) {
                    user.checked = $scope.selectAll;
                    if (user.checked)
                        $scope.wrapperSelectionChange(user);
               });
           };
       }]
   };
   
}]);
