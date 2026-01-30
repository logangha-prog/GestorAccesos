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
 * Service which defines the LoggedUser class.
 */
angular.module('rest').factory('LoggedUser', [function defineLoggedUser() {
            
    /**
     * The object returned by REST API calls when representing the data
     * associated with an active connection. Each active connection is
     * effectively a pairing of a connection and the user currently using it,
     * along with other information.
     * 
     * @constructor
     * @param {LoggedUser|Object} [template={}]
     *     The object whose properties should be copied within the new
     *     LoggedUser.
     */
    var LoggedUser = function LoggedUser(template) {

        // Use empty object by default
        template = template || {};

        /**
         * The identifier which uniquely identifies this specific token
         * 
         * @type String
         */
        this.identifier = template.identifier;

        /**
         * The user's id name.
         *
         * @type String 
         */
        this.username = template.username;

        /**
         * The user's full name.
         *
         * @type String
         */
        this.fullname = template.fullname;

        /**
         * The organization, company, group, etc. that the user belongs to.
         * 
         * @type String
         */
        this.management = template.management;

        /**
         * The user access type.
         * 
         * @type String
         */
        this.accesstype = template.accesstype;

    };

    return LoggedUser;

}]);
