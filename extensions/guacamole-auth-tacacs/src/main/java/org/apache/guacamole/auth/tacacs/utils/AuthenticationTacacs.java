/**
 * 
 */
package org.apache.guacamole.auth.tacacs.utils;

import org.apache.guacamole.net.auth.Credentials;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.net.auth.credentials.CredentialsInfo;
import org.apache.guacamole.auth.tacacs.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author TELMEX
 */
public class AuthenticationTacacs {
    /**
     * Logger for this class.
     */
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationTacacs.class);

    /**
     * Method executes perl script 'accessTacacs.pl' to get TACACS's authentication
     * @param user 
     * @param password
     * @param ipAddress LoggableAddress
     * @return true - When script execution result returns string 'Granted'
     * @throws Exception 
     */
    public static boolean authenticate(Credentials credentials) throws Exception {
	boolean result = false;
	if (credentials.getUsername().length() > 0 && credentials.getPassword().length() > 0) {
	    String line;
	    Process process = null;
	    try {
                String command = "/home/admin-cns/Scripts/accessTacacs.pl "
                                 + "-u " + credentials.getUsername() + " -p " + credentials.getPassword()
                                 + " -a " + credentials.getRemoteAddress() + ":"
                                 + credentials.getRequest().getAttribute("token");
		process = Runtime.getRuntime().exec(command);
                process.waitFor(); 
		if ((line = Utils.getCommandInput(Utils.InOutErr.INPUT, process)) != "") {
		    if (line != null && line.indexOf("Granted") != -1) {
		        result = true;
		    } else {
			throw new GuacamoleException(line);
		    }
                } 
                if (!result) {
                    if ((line = Utils.getCommandInput(Utils.InOutErr.ERROR, process)) != "") {
		        throw new GuacamoleException(line);
                    }
		}
	    } catch (Exception e) {
                    throw e;
	    } finally {
		if (process != null) {
		    process.destroy();
                    process = null;
		}
	    }
	} else {
	    throw new GuacamoleException("Tacacs authentication attempt cannot be done with a missing user.");
	}
	return result;
    }
}
