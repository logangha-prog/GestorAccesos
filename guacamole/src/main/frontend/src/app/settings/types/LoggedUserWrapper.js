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
 * A service for defining the LoggedUserWrapper class.
 */
angular.module('settings').factory('LoggedUserWrapper', [
    function defineLoggedUserWrapper() {

    /**
     * Wrapper for LoggedUser which adds display-specific
     * properties, such as a checked option.
     * 
     * @constructor
     * @param {LoggedUserWrapper|Object} template
     *     The object whose properties should be copied within the new
     *     LoggedUserWrapper.
     */
    var LoggedUserWrapper = function LoggedUserWrapper(template) {

        this.dataSource = template.dataSource;

        /**
         * The identifier which uniquely identifies this specific connected
         * user.
         *
         * @type String
         */
        this.identifier = template.identifier;

        /**
         * The wrapped LoggedUser.
         *
         * @type LoggedUser
         */
        this.loggedUser = template.loggedUser;

        /**
         * A flag indicating that the connected user has been selected.
         *
         * @type Boolean
         */
        this.checked = template.checked || false;

    };

    return LoggedUserWrapper;

}]);
