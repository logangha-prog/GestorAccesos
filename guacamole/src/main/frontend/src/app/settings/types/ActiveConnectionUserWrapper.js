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
 * A service for defining the ActiveConnectionUserWrapper class.
 */
angular.module('settings').factory('ActiveConnectionUserWrapper', [
    function defineActiveConnectionUserWrapper() {

    /**
     * Wrapper for ActiveConnection which adds display-specific
     * properties, such as a checked option.
     * 
     * @constructor
     * @param {ActiveConnectionUserWrapper|Object} template
     *     The object whose properties should be copied within the new
     *     ActiveConnectionUserWrapper.
     */
    var ActiveConnectionUserWrapper = function ActiveConnectionUserWrapper(template) {

        /**
         * The identifier of the data source associated with the
         * ActiveConnection wrapped by this ActiveConnectionUserWrapper.
         *
         * @type String
         */
        this.dataSource = template.dataSource;

        /**
         * The display name of this connection.
         *
         * @type String
         */
        this.name = template.name;

        /**
         * The user's full name.
         *
         * @type String
         */
        this.fullName = template.fullName

	/**
         * The organization, company, group, etc. that the user belongs to.
         *
         * @type String
         */
        this.organization = template.organization;

        /**
         * The date and time this session began, pre-formatted for display.
         *
         * @type String
         */
        this.startDate = template.startDate;

        /**
         * The wrapped ActiveConnection.
         *
         * @type ActiveConnection
         */
        this.activeConnection = template.activeConnection;

    };

    return ActiveConnectionUserWrapper;

}]);
