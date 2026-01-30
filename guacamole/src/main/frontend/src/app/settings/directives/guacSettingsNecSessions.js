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
angular.module('settings').directive('guacSettingsNecSessions', [function guacSettingsNecSessions() {
    
    return {
        // Element only
        restrict: 'E',
        replace: true,

        scope: {
        },

        templateUrl: 'app/settings/templates/settingsNecSessions.html',
        controller: ['$scope', '$injector', function settingsNecSessionsController($scope, $injector) {

            // Required types
            var ActiveConnectionUserWrapper = $injector.get('ActiveConnectionUserWrapper');
            var ConnectionGroup             = $injector.get('ConnectionGroup');
            var SortOrder                   = $injector.get('SortOrder');

            // Required services
            var $filter                     = $injector.get('$filter');
            var $translate                  = $injector.get('$translate');
            var $q                          = $injector.get('$q');
            var activeConnectionService     = $injector.get('activeConnectionService');
            var authenticationService       = $injector.get('authenticationService');
            var connectionGroupService      = $injector.get('connectionGroupService');
            var dataSourceService           = $injector.get('dataSourceService');
            var requestService              = $injector.get('requestService');
            var User                        = $injector.get('User');
            var userService                 = $injector.get('userService');

            /**
             * The identifiers of all data sources accessible by the current
             * user.
             *
             * @type String[]
             */
            var dataSources = authenticationService.getAvailableDataSources();

            /**
             * The ActiveConnectionUserWrappers of all active sessions accessible
             * by the current user, or null if the active sessions have not yet
             * been loaded.
             *
             * @type ActiveConnectionUserWrapper[]
             */
            $scope.wrappers = null;

            /**
             * SortOrder instance which maintains the sort order of the visible
             * connection wrappers.
             *
             * @type SortOrder
             */
            $scope.wrapperOrder = new SortOrder([
                'activeConnection.username',
                'startDate',
                'activeConnection.remoteHost',
                'name',
                'fullName',
                'organization'
            ]);

            /**
             * Array of all wrapper properties that are filterable.
             *
             * @type String[]
             */
            $scope.filteredWrapperProperties = [
                'activeConnection.username',
                'startDate',
                'activeConnection.remoteHost',
                'name',
                'fullName',
                'organization'
            ];

            /**
             * All active connections, if known, grouped by corresponding data
             * source identifier, or null if active connections have not yet
             * been loaded.
             *
             * @type Object.<String, Object.<String, ActiveConnection>>
             */
            var allActiveConnections = null;

            /**
             * Map of all visible connections by data source identifier and
             * object identifier, or null if visible connections have not yet
             * been loaded.
             *
             * @type Object.<String, Object.<String, Connection>>
             */
            var allConnections = null;

            /**
             * User who is logged.
             */
            var user = null;

            /**
             * Array with all users loaded into system.
             */
            var addedUsers = null;

            /**
             * The date format for use for session-related dates.
             *
             * @type String
             */
            var sessionDateFormat = null;

            /**
             * Map of all currently-selected active connection wrappers by
             * data source and identifier.
             * 
             * @type Object.<String, Object.<String, ActiveConnectionUserWrapper>>
             */
            var allSelectedWrappers = {};

            /**
             * Adds the given connection to the internal set of visible
             * connections.
             *
             * @param {String} dataSource
             *     The identifier of the data source associated with the given
             *     connection.
             *
             * @param {Connection} connection
             *     The connection to add to the internal set of visible
             *     connections.
             */
            var addConnection = function addConnection(dataSource, connection) {

                // Add given connection to set of visible connections
                allConnections[dataSource][connection.identifier] = connection;

            };

            /**
             * Adds all descendant connections of the given connection group to
             * the internal set of connections.
             * 
             * @param {String} dataSource
             *     The identifier of the data source associated with the given
             *     connection group.
             *
             * @param {ConnectionGroup} connectionGroup
             *     The connection group whose descendant connections should be
             *     added to the internal set of connections.
             */
            var addDescendantConnections = function addDescendantConnections(dataSource, connectionGroup) {

                // Add all child connections
                angular.forEach(connectionGroup.childConnections, function addConnectionForDataSource(connection) {
                    addConnection(dataSource, connection);
                });

                // Add all child connection groups
                angular.forEach(connectionGroup.childConnectionGroups, function addConnectionGroupForDataSource(connectionGroup) {
                    addDescendantConnections(dataSource, connectionGroup);
                });

            };

            /**
             * Wraps all loaded active connections, storing the resulting array
             * within the scope. If required data has not yet finished loading,
             * this function has no effect.
             */
           var wrapAllActiveConnections = function wrapAllActiveConnections() {

                // Abort if not all required data is available
               if (!allActiveConnections || !allConnections || !sessionDateFormat || !user || !addedUsers)
                   return;

               var dataSource = authenticationService.getDataSource();
               console.log("Here A " + dataSource);
               console.log(user);
               if (user[dataSource].attributes === undefined
                   || user[dataSource].attributes[User.Attributes.ORGANIZATION] === undefined) {
                   var lenghtList = dataSources.length;
                   for (i = 0; i < lenghtList; i++) {
                       var ds = dataSources[i];
                       console.log(ds);
                       if (user[ds] !== undefined
                           && user[ds].attributes
                           && user[ds].attributes[User.Attributes.ORGANIZATION] !== null) {
                           dataSource = ds;
                           console.log(user[ds]);
                           break;
                       }
                   }
               }
       	       var role = null;
       	       var organization = null;
               console.log("Out " + dataSource);
               console.log(user);
       	       if (user[dataSource] && user[dataSource].attributes) {
       	    	  role = user[dataSource].attributes[User.Attributes.ORGANIZATIONAL_ROLE];
       	          organization = user[dataSource].attributes[User.Attributes.ORGANIZATION];
       	       }

    	       var userObtained = null;

               // Wrap all active connections for sake of display
               $scope.wrappers = [];
               angular.forEach(allActiveConnections, function wrapActiveConnections(activeConnections, dataSource) {
                   angular.forEach(activeConnections, function wrapActiveConnection(activeConnection, identifier) {

                       // Retrieve corresponding connection
                       var connection = allConnections[dataSource][activeConnection.connectionIdentifier];

                       // Add wrapper                       
                       if (activeConnection.username !== null) {
                           console.log(connection.name);
                           var result = connection.name.match(/NEC.+qclient/);
                           if (result) {
                               console.log("Enter: " + connection.name);
		               if (addedUsers[activeConnection.username]) {
          		           userObtained = addedUsers[activeConnection.username];
          	               }
                               console.log(userObtained);
                               $scope.wrappers.push(new ActiveConnectionUserWrapper({
                                   dataSource       : dataSource,
                                   name             : connection.name,
                                   fullName         : userObtained.attributes[User.Attributes.FULL_NAME],
                                   organization     : userObtained.attributes[User.Attributes.ORGANIZATION],
                                   startDate        : $filter('date')(activeConnection.startDate, sessionDateFormat),
                                   activeConnection : activeConnection
                               }));
                           }
                       }
                   });
               });
            };

            // Retrieve all connections 
            dataSourceService.apply(
                connectionGroupService.getConnectionGroupTree,
                dataSources,
                ConnectionGroup.ROOT_IDENTIFIER
            )
            .then(function connectionGroupsReceived(rootGroups) {

                allConnections = {};

                // Load connections from each received root group
                angular.forEach(rootGroups, function connectionGroupReceived(rootGroup, dataSource) {
                    allConnections[dataSource] = {};
                    addDescendantConnections(dataSource, rootGroup);
                });

                // Attempt to produce wrapped list of active connections
                wrapAllActiveConnections();

            }, requestService.DIE);
            
            // Query active sessions
            dataSourceService.apply(
                activeConnectionService.getActiveConnections,
                dataSources
            )
            .then(function sessionsRetrieved(retrievedActiveConnections) {

                // Store received map of active connections
                allActiveConnections = retrievedActiveConnections;

                // Attempt to produce wrapped list of active connections
                wrapAllActiveConnections();

            }, requestService.DIE);

            dataSourceService.apply(
           	userService.getUser,
            	authenticationService.getAvailableDataSources(),
                authenticationService.getCurrentUsername()
            )

            // Resolving user logged if possible
            .then(function userRetrieved(retrievedUser) {
                user = retrievedUser;
                wrapAllActiveConnections();
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
                wrapAllActiveConnections();
            }, requestService.DIE); 

            // Get session date format
            $translate('SETTINGS_SESSIONS.FORMAT_STARTDATE').then(function sessionDateFormatReceived(retrievedSessionDateFormat) {

                // Store received date format
                sessionDateFormat = retrievedSessionDateFormat;

                // Attempt to produce wrapped list of active connections
                wrapAllActiveConnections();

            }, angular.noop);

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

        }]
    };
    
}]);
