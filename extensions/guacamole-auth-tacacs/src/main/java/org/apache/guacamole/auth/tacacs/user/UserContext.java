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
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.net.auth.simple.SimpleUser;
import org.apache.guacamole.net.auth.AbstractUserContext;
import org.apache.guacamole.net.auth.AuthenticationProvider;
import org.apache.guacamole.net.auth.User;
import org.apache.guacamole.auth.tacacs.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * An implementation of UserContext specific to the TacacsAuthenticationProvider
 * which obtains all data from the encrypted tacacs provided during
 * authentication.
 */
public class UserContext extends AbstractUserContext {
    /**
     * Logger for this class.
     */
    private static final Logger logger = LoggerFactory.getLogger(UserContext.class);

    /**
     * The SimpleUser object associated with the user to whom this UserContext
     * belongs.
     */
    private SimpleUser simpleUser;

    /**
     * Initializes this UserContext using the data associated with the provided
     * UserData object.
     *
     * @param simpleUser
     *     The UserData object derived from the JSON data received when the
     *     user authenticated.
     */
    public void init(SimpleUser simpleUser) {
        this.simpleUser = simpleUser;
    }

    @Override
    public User self() {
       return simpleUser;
    }

    /**
     * Reference to the AuthenticationProvider associated with this
     * UserContext.
     */
    @Inject
    private AuthenticationProvider authProvider;

    @Override
    public AuthenticationProvider getAuthenticationProvider() {
        return authProvider;
    }

    @Override
    public void invalidate() {
        String line;
        boolean result = false;
        Process process = null;
        try {
            String command = "/home/admin-cns/Scripts/client.pl "
                                  + "1 " + simpleUser.getIdentifier();
            process = Runtime.getRuntime().exec(command);
            process.waitFor();        
            if ((line = Utils.getCommandInput(Utils.InOutErr.INPUT, process)) != "") {
                if (line != null && line.length() == 0) {
                    result = true;
                } else {
                    throw new GuacamoleException(line);
                }
                if (!result) {
                    if ((line = Utils.getCommandInput(Utils.InOutErr.ERROR, process)) != "") {
                        throw new GuacamoleException(line);
                    }
                }
            }
        } catch (Exception e) {
            logger.info(Utils.getStackTrace(e));
        } finally {
            if (process != null) {
                process.destroy();
                process = null;
            }
        }
    }

}
