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
 * The controller for the home page.
 */
angular.module('home').controller('homeController', ['$scope', '$injector', 'userHelperService', 
        function homeController($scope, $injector, userHelperService) { // 'userHelperService' is now available

    // Get required types
    var ConnectionGroup  = $injector.get('ConnectionGroup');
    var GroupListItem    = $injector.get('GroupListItem');
            
    // Get required services
    var authenticationService  = $injector.get('authenticationService');
    var connectionGroupService = $injector.get('connectionGroupService');
    var dataSourceService      = $injector.get('dataSourceService');
    var requestService         = $injector.get('requestService');

    var User = $injector.get('User');
    var userService = $injector.get('userService');

    /**
     * The username of the current user.
     *
     * @type String
     */
    $scope.username = authenticationService.getCurrentUsername();

    /**
      * The role that the user has at the organization, company, group,
      * etc. they belong to. If not yet available, or if not defined,
      * this will be null.
      *
      * @type String
      */
     $scope.role = null;

    /**
      * User who is logged.
      */
    var user = null;
    
    /** 
     * Variable used to save temporarily connection groups before being assigned
     * till verify that user does not have organizational_role field with value
     * 'Finalizar-Sesiones'.
     */
     var rootConnectionGroupsObtained = null; 

    /**
     * The identifiers of all data sources accessible by the current
     * user.
     *
     * @type String[]
     */
    var dataSources = authenticationService.getAvailableDataSources();

    /**
     * Map of data source identifier to the root connection group of that data
     * source, or null if the connection group hierarchy has not yet been
     * loaded.
     *
     * @type Object.<String, ConnectionGroup>
     */
    $scope.rootConnectionGroups = null;

     var obtainUserRole = function obtainUserRole() {
         if (!user || !rootConnectionGroupsObtained) {
             return;
         }

         var dataSource = userHelperService.getDataSourceForUser(user, dataSources);
         if (user[dataSource] && user[dataSource].attributes
              && user[dataSource].attributes[User.Attributes.ORGANIZATIONAL_ROLE]) {
             $scope.role = user[dataSource].attributes[User.Attributes.ORGANIZATIONAL_ROLE];
         }
         if (!$scope.role || ($scope.role && $scope.role != 'Finalizar-Sesiones')) {
             $scope.rootConnectionGroups = rootConnectionGroupsObtained;
         }
     }

    /**
     * Array of all connection properties that are filterable.
     *
     * @type String[]
     */
    $scope.filteredConnectionProperties = [
        'name'
    ];

    /**
     * Array of all connection group properties that are filterable.
     *
     * @type String[]
     */
    $scope.filteredConnectionGroupProperties = [
        'name'
    ];

    /**
     * Returns whether critical data has completed being loaded.
     *
     * @returns {Boolean}
     *     true if enough data has been loaded for the user interface to be
     *     useful, false otherwise.
     */
    $scope.isLoaded = function isLoaded() {

        if (!user) {
            return;
        }
        var dataSource = userHelperService.getDataSourceForUser(user, dataSources);
        var localRole = null;
        if (user[dataSource] && user[dataSource].attributes
              && user[dataSource].attributes[User.Attributes.ORGANIZATIONAL_ROLE]) {
            localRole = user[dataSource].attributes[User.Attributes.ORGANIZATIONAL_ROLE];
        }
        if (!localRole || !$scope.username.includes("Finalizar", 0)) {
            return $scope.rootConnectionGroups !== null;
        } else if (localRole == 'Finalizar-Sesiones') {
            return true;
        }
    };

    dataSourceService.apply(
        userService.getUser,
        authenticationService.getAvailableDataSources(),
        authenticationService.getCurrentUsername()
    )
    // Resolving user logged if possible
    .then(function userRetrieved(retrievedUser) {
        user = retrievedUser;
        obtainUserRole();
    }, requestService.DIE);

    // Retrieve root groups and all descendants
    dataSourceService.apply(
        connectionGroupService.getConnectionGroupTree,
        authenticationService.getAvailableDataSources(),
        ConnectionGroup.ROOT_IDENTIFIER
    )
    .then(function rootGroupsRetrieved(rootConnectionGroups) {
        rootConnectionGroupsObtained = rootConnectionGroups;
        obtainUserRole();
    }, requestService.DIE);

}]);
