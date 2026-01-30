package org.apache.guacamole.rest.auth;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;

public class Utils {
	
	/**
	 * Return exception as an String variable
	 * @param aThrowable Exception thrown.
	 * @return Exception into String if some error occurs.
	 */	
    public static String getStackTrace(final Throwable aThrowable) {
        final Writer result = new StringWriter();
        final PrintWriter printWriter = new PrintWriter(result);
        aThrowable.printStackTrace(printWriter);
        return result.toString();
    } 
}
