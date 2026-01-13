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

package org.apache.guacamole.auth.tacacs;

import com.google.inject.Inject;
import com.google.inject.Provider;

import java.util.Arrays;

import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.net.auth.Credentials;
import org.apache.guacamole.net.auth.credentials.CredentialsInfo;
import org.apache.guacamole.net.auth.credentials.GuacamoleInvalidCredentialsException;
import org.apache.guacamole.auth.tacacs.user.UserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.guacamole.auth.tacacs.user.AuthenticatedUser;
import org.apache.guacamole.auth.tacacs.utils.AuthenticationTacacs;
import org.apache.guacamole.auth.tacacs.utils.Utils;

/**
 * Service providing convenience functions for the Tacacs
 * AuthenticationProvider implementation.
 */
public class AuthenticationProviderService {
    /**
     * Logger for this class.
     */
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationProviderService.class);

    /**
     * Guacamole's administrator user.
     */
    private static final String GUACAMOLE_ADMINISTRATOR = "guacadmin";
    
    /**
     * Provider for AuthenticatedUser objects.
     */
    @Inject
    private Provider<AuthenticatedUser> authenticatedUserProvider;

    /**
     * Returns an AuthenticatedUser representing the user authenticated by the
     * given credentials.
     *
     * @param credentials
     *     The credentials to use for authentication.
     *
     * @return
     *     An AuthenticatedUser representing the user authenticated by the
     *     given credentials.
     *
     * @throws GuacamoleException
     *     If an error occurs while authenticating the user, or if access is
     *     denied.
     */
    public AuthenticatedUser authenticateUser(Credentials credentials)
            throws GuacamoleException {
        if (credentials.getUsername() != null &&  credentials.getPassword() != null) {
    	    validateTacacsAuthentication(credentials);
            AuthenticatedUser authenticatedUser = authenticatedUserProvider.get();
            if (authenticatedUser != null && credentials.getUsername() != null
        	    && credentials.getUsername().indexOf(GUACAMOLE_ADMINISTRATOR) == -1) {
        	    authenticatedUser.init(credentials.getUsername(), credentials);
        	    return authenticatedUser;
            }
            // Authentication not provided via Tacacs, yet, so we request it.
            throw new GuacamoleInvalidCredentialsException("Invalid login.", CredentialsInfo.USERNAME_PASSWORD);
        } 
        return null;
    }
    
    private void validateTacacsAuthentication(Credentials credentials) throws GuacamoleException {
    	if (credentials.getUsername() != null
    		&& credentials.getUsername().indexOf(GUACAMOLE_ADMINISTRATOR) == -1) {
	    if (!AuthenticationTacacs.authenticate(credentials.getUsername(),
                    credentials.getPassword(),
                    credentials.getRemoteAddress())) {
    			logger.warn("Tacacs authentication attempt from {} for user \"{}\" failed.",
    					credentials.getRemoteAddress(), credentials.getUsername());
    			throw new GuacamoleInvalidCredentialsException(
    					"Tacacs authentication attempt from " + credentials.getRemoteAddress()
    					+ " for user \"" + credentials.getUsername() + "\" failed.",
    					CredentialsInfo.USERNAME_PASSWORD);
            } else {
                if (logger.isInfoEnabled())
                    logger.info("User \"{}\" successfully authenticated with Tacacs from {}.",
                            credentials.getUsername(),
                            Utils.getLoggableAddress(credentials.getRequest()));

            }
        }
    }

    /**
     * Returns a UserContext object initialized with data accessible to the
     * given AuthenticatedUser.
     *
     * @param authenticatedUser
     *     The AuthenticatedUser to retrieve data for.
     *
     * @return
     *     A UserContext object initialized with data accessible to the given
     *     AuthenticatedUser.
     *
     * @throws GuacamoleException
     *     If the UserContext cannot be created due to an error.
     */
    public UserContext getUserContext(org.apache.guacamole.net.auth.AuthenticatedUser authenticatedUser)
            throws GuacamoleException {

        // The TacacsAuthenticationProvider only provides data for users it has
        // authenticated itself
        if (!(authenticatedUser instanceof AuthenticatedUser))
            return null;

        // Return UserContext containing data from the authenticated user's
        // associated UserData object
        UserContext userContext = userContextProvider.get();
        userContext.init(((AuthenticatedUser) authenticatedUser).getUserData());
        return userContext;

    }
}
