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

package org.apache.guacamole.rest.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.Iterator;
import java.util.Map;
import java.util.HashMap;
import java.util.TreeMap;
import org.apache.guacamole.net.auth.User;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.environment.Environment;
import org.apache.guacamole.GuacamoleSession;
import org.apache.guacamole.properties.IntegerGuacamoleProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A HashMap-based implementation of the TokenSessionMap with support for
 * session timeouts.
 */
public class HashTokenSessionMap implements TokenSessionMap, AutoCloseable {

    /**
     * Logger for this class.
     */
    private static final Logger logger = LoggerFactory.getLogger(HashTokenSessionMap.class);

    private static final String USER_KILL_SESSION = "Usuario para terminar conexiones";

    private static final String AUTH_PROVIDER_DB = "mysql";

    /**
     * Executor service which runs the period session eviction task.
     */
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
    
    /**
     * Keeps track of the authToken to GuacamoleSession mapping.
     */
    private final ConcurrentMap<String, GuacamoleSession> sessionMap =
            new ConcurrentHashMap<String, GuacamoleSession>();

    /**
     * The session timeout for the Guacamole REST API, in minutes.
     */
    private final IntegerGuacamoleProperty API_SESSION_TIMEOUT =
            new IntegerGuacamoleProperty() {

        @Override
        public String getName() { return "api-session-timeout"; }

    };

    /**
     * Create a new HashTokenSessionMap configured using the given environment.
     *
     * @param environment
     *     The environment to use when configuring the token session map.
     */
    public HashTokenSessionMap(Environment environment) {
        
        int sessionTimeoutValue;

        // Read session timeout from guacamole.properties
        try {
            sessionTimeoutValue = environment.getProperty(API_SESSION_TIMEOUT, 60);
        }
        catch (GuacamoleException e) {
            logger.error("Unable to read guacamole.properties: {}", e.getMessage());
            logger.debug("Error while reading session timeout value.", e);
            sessionTimeoutValue = 60;
        }
        
        // Check for expired sessions every minute
        logger.info("Sessions will expire after {} minutes of inactivity.", sessionTimeoutValue);
        executor.scheduleAtFixedRate(new SessionEvictionTask(sessionTimeoutValue * 60000l), 1, 1, TimeUnit.MINUTES);
        
    }

    /**
     * Task which iterates through all active sessions, evicting those sessions
     * which are beyond the session timeout.
     */
    private class SessionEvictionTask implements Runnable {

        /**
         * The maximum allowed age of any session, in milliseconds.
         */
        private final long sessionTimeout;

        /**
         * Creates a new task which automatically evicts sessions which are
         * older than the specified timeout.
         * 
         * @param sessionTimeout The maximum age of any session, in
         *                       milliseconds.
         */
        public SessionEvictionTask(long sessionTimeout) {
            this.sessionTimeout = sessionTimeout;
        }

        /**
         * Iterates through all active sessions, evicting those sessions which
         * are beyond the session timeout. Internal errors which would
         * otherwise stop the session eviction process are caught, logged, and
         * the process is allowed to proceed.
         */
        private void evictExpiredSessions() {

            // Get start time of session check time
            long sessionCheckStart = System.currentTimeMillis();

            logger.debug("Checking for expired sessions...");

            // For each session, remove sesions which have expired
            Iterator<Map.Entry<String, GuacamoleSession>> entries = sessionMap.entrySet().iterator();
            while (entries.hasNext()) {

                Map.Entry<String, GuacamoleSession> entry = entries.next();
                GuacamoleSession session = entry.getValue();

                try {

                    // Do not expire sessions which are active
                    if (session.hasTunnels())
                        continue;

                    // Get elapsed time since last access
                    long age = sessionCheckStart - session.getLastAccessedTime();

                    // If session is too old, evict it and check the next one
                    if (age >= sessionTimeout) {
                        logger.debug("Session \"{}\" has timed out.", entry.getKey());
                        entries.remove();
                        session.invalidate();
                    }

                }
                catch (Throwable t) {
                    logger.error("An unexpected internal error prevented a "
                            + "session from being invalidated. This should "
                            + "NOT happen and is likely a bug. Depending on "
                            + "the nature of the failure, the session may "
                            + "still be valid.", t);
                }

            }

            // Log completion and duration
            logger.debug("Session check completed in {} ms.",
                    System.currentTimeMillis() - sessionCheckStart);
            
        }

        @Override
        public void run() {

            // The evictExpiredSessions() function should already
            // automatically handle and log all unexpected internal errors,
            // but wrap the entire call in a try/catch plus additional logging
            // to ensure that absolutely no errors can result in the entire
            // thread dying
            try {
                evictExpiredSessions();
            }
            catch (Throwable t) {
                logger.error("An unexpected internal error prevented the "
                        + "session eviction task from completing "
                        + "successfully. This should NOT happen and is likely "
                        + "a bug. Sessions that should have expired may "
                        + "remain valid.", t);
            }

        }

    }

    @Override
    public GuacamoleSession get(String authToken) {
        
        // There are no null auth tokens
        if (authToken == null)
            return null;

        // Update the last access time and return the GuacamoleSession
        GuacamoleSession session = sessionMap.get(authToken);
        if (session != null)
            session.access();

        return session;

    }

    @Override
    public void put(String authToken, GuacamoleSession session) {
        sessionMap.put(authToken, session);
    }

    @Override
    public GuacamoleSession remove(String authToken) {

        // There are no null auth tokens
        if (authToken == null)
            return null;

        // Attempt to retrieve only if non-null
        return sessionMap.remove(authToken);

    }

    @Override
    public void shutdown() {
        try {
            this.close();
        } catch (Exception e) {
            logger.error(e.getMessage());
        }
        executor.shutdownNow();
    }

    @Override
    public Map<String, String> getAllTokens() throws GuacamoleException {
        final Map<String, String> tokens = new HashMap<String, String>();
        for (Map.Entry<String, GuacamoleSession> entry : this.sessionMap.entrySet()) {
	    tokens.put(entry.getValue().getAuthenticatedUser()
		.getCredentials().getUsername(), entry.getKey());
	}
	return tokens;
    }

    @Override
    public Map<String, String> getAllTokens(String organization) throws GuacamoleException {
	final Map<String, String> tokens = new HashMap<String, String>();
	for (Map.Entry<String, GuacamoleSession> entry : this.sessionMap.entrySet()) {
	    GuacamoleSession session = entry.getValue();
	    Map<String, String> attr = session.getUserContext(AUTH_PROVIDER_DB).self().getAttributes();
	    if (attr != null && attr.get(User.Attribute.ORGANIZATION).equals(organization)
		    && !attr.get(User.Attribute.FULL_NAME).equals(USER_KILL_SESSION)) {
		tokens.put(entry.getValue().getAuthenticatedUser()
		    .getCredentials().getUsername(), entry.getKey());
	    }
	}
	return tokens;
    }

    @Override
    public Map<String, String> getUserToken(String user) throws GuacamoleException {
	final Map<String, String> tokens = new HashMap<String, String>();
	for (Map.Entry<String, GuacamoleSession> entry : this.sessionMap.entrySet()) {
	    if (entry.getValue().getAuthenticatedUser()
			.getCredentials().getUsername().equals(user)) {
		tokens.put(entry.getValue().getAuthenticatedUser()
				.getCredentials().getUsername(), entry.getKey());
	    }
	}
        return tokens;
    }

    @Override
    public Map<String, Map<String, List<String>>> getAllUsers() throws Exception {
    	Map<String, Map<String, List<String>>> usersMap = null;
    	try {
    	    usersMap = new TreeMap<String, Map<String, List<String>>>();
    	    for (Map.Entry<String, GuacamoleSession> entry : this.sessionMap.entrySet()) {
    		GuacamoleSession session = entry.getValue();
    		Map<String, String> attr = session.getUserContext(AUTH_PROVIDER_DB).self().getAttributes();
    		if (!attr.get(User.Attribute.FULL_NAME).equals(USER_KILL_SESSION)) {
    		    String org = attr.get(User.Attribute.ORGANIZATION);
    		    String identifier = session.getAuthenticatedUser().getAuthenticationProvider().getIdentifier();
    		    Map<String, List<String>> mapOrgs = usersMap.get(identifier);
    		    if (mapOrgs == null) {
    			Map<String, List<String>> orgs = new TreeMap<String, List<String>>();
    			List<String> users = new ArrayList<String>();
    			users.add(session.getAuthenticatedUser()
    				      .getCredentials().getUsername());
    			orgs.put(org, users);
    			usersMap.put(identifier, orgs);
    		    } else {
    			 List<String> users = mapOrgs.get(org);
    			 if (users == null) {
    			     List<String> lUsers = new ArrayList<String>();
    			     lUsers.add(session.getAuthenticatedUser()
    					    .getCredentials().getUsername());
    						mapOrgs.put(org, lUsers);
    			 } else {
    			     users.add(session.getAuthenticatedUser()
    					   .getCredentials().getUsername());
    			 }
    		    }
    		}
       	    }
    	} catch (Exception e) {
    	    logger.error(Utils.getStackTrace(e));
    	    throw e;
    	}
        return usersMap;
    }

    @Override
    public void close() throws Exception {
        for (Map.Entry<String, GuacamoleSession> entry : this.sessionMap.entrySet()) {
            GuacamoleSession session = this.remove(entry.getKey());
            if (session != null) {
       	        session.invalidate();
            }
        }
    }

    @Override
    public Map<String, LoggedUser> getLoggedUsers()  throws GuacamoleException {
        final Map<String, LoggedUser> tokens = new HashMap<String, LoggedUser>();
        for (Map.Entry<String, GuacamoleSession> entry : this.sessionMap.entrySet()) {
			GuacamoleSession session = entry.getValue();
			Map<String, String> attr = session.getUserContext(AUTH_PROVIDER_DB).self().getAttributes();
            tokens.put(entry.getKey(), new LoggedUser(entry.getValue().getAuthenticatedUser()
                                                          .getCredentials().getUsername(),
                                                      attr.get(User.Attribute.FULL_NAME),
                                                      attr.get(User.Attribute.ORGANIZATION),
                                                      session.getAuthenticatedUser()
							  .getAuthenticationProvider().getIdentifier()));
        }
        return tokens;
    }
}
