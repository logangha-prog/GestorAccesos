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
 * Service for operating on connected users via the REST API.
 */
angular.module('rest').factory('loggedUserService', ['$injector',
        function loggedUserService($injector) {

    // Required services
    var authenticationService = $injector.get('authenticationService');

    var service = {};

    /**
     * Makes a request to the REST API to get the list of connected users,
     * returning a promise that provides a map of @link{LoggedUser}
     * objects if successful.
     *
     * @param {String[]} [permissionTypes]
     *     The set of permissions to filter with. A user must have one or more
     *     of these permissions for a connected user to appear in the
     *     result.  If null, no filtering will be performed. Valid values are
     *     listed within PermissionSet.ObjectType.
     *                          
     * @returns {Promise.<Object.<String, LoggedUser>>}
     *     A promise which will resolve with a map of @link{LoggedUser}
     *     objects, where each key is the identifier of the corresponding
     *     token associated to an user access.
     */
    service.getLoggedUsers = function getLoggedUsers(permissionTypes) {

        // Add permission filter if specified
        var httpParameters = {};
        if (permissionTypes)
            httpParameters.permission = permissionTypes;

        // Retrieve tunnels
        return authenticationService.request({
            method  : 'GET',
            url     : 'api/tokens/loggedusers',
            params  : httpParameters
        });

    };

    /**
     * Makes a request to the REST API to delete the connected users having
     * the given identifiers, effectively disconnecting them, returning a
     * promise that can be used for processing the results of the call.
     *
     * @param {String[]} identifiers
     *     The identifiers of the connected users to delete.
     *
     * @returns {Promise}
     *     A promise for the HTTP call which will succeed if and only if the
     *     delete operation is successful.
     */
    service.deleteLoggedSessions = function deleteLoggedSessions(identifiers) {
        authenticationService.revokeTokens(identifiers);
    };

    return service;

}]);
