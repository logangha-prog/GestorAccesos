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

package org.apache.guacamole.auth.tacacs.user;

import com.google.inject.Inject;
import org.apache.guacamole.net.auth.simple.SimpleUser;
import org.apache.guacamole.net.auth.AbstractAuthenticatedUser;
import org.apache.guacamole.net.auth.AuthenticationProvider;
import org.apache.guacamole.net.auth.Credentials;

/**
 * An HTTP header implementation of AuthenticatedUser, associating a
 * username and particular set of credentials with the HTTP authentication
 * provider.
 */
public class AuthenticatedUser extends AbstractAuthenticatedUser {

    /**
     * Reference to the authentication provider associated with this
     * authenticated user.
     */
    @Inject
    private AuthenticationProvider authProvider;

    /**
     * The credentials provided when this user was authenticated.
     */
    private Credentials credentials;

    /**
     * The SimpleUser object derived from the data submitted when this user was
     * authenticated.
     */
    private SimpleUser simpleUser;

    /**
     * Initializes this AuthenticatedUser using the given credentials and
     * UserData object. The provided UserData object MUST have been derived
     * from the data submitted when the user authenticated.
     *
     * @param credentials
     *     The credentials provided when this user was authenticated.
     *
     * @param userData
     *     The UserData object derived from the data submitted when this user
     *     was authenticated.
     */
    public void init(Credentials credentials) {
        this.credentials = credentials;
        this.simpleUser = new SimpleUser(credentials.getUsername());
        setIdentifier(simpleUser.getIdentifier());
    }


    @Override
    public AuthenticationProvider getAuthenticationProvider() {
        return authProvider;
    }

    @Override
    public Credentials getCredentials() {
        return this.credentials;
    }

    /**
     * Returns the SimpleUser object derived from the data submitted when this
     * user was authenticated.
     *
     * @return
     *     The SimpleUser object derived from the data submitted when this user
     *     was authenticated.
     */
    public SimpleUser getSimpleUser() {
        return this.simpleUser;
    }


}
