package org.apache.guacamole.auth.tacacs.utils;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.regex.Pattern;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;

public class Utils {
    /**
     * Logger for this class.
     */
    private static final Logger logger = LoggerFactory.getLogger(Utils.class);
	
    /**
     * Regular expression which matches any IPv4 address.
     */
    private static final String IPV4_ADDRESS_REGEX = "([0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3})";

    /**
     * Regular expression which matches any IPv6 address.
     */
    private static final String IPV6_ADDRESS_REGEX = "([0-9a-fA-F]*(:[0-9a-fA-F]*){0,7})";

    /**
     * Regular expression which matches any IP address, regardless of version.
     */
    private static final String IP_ADDRESS_REGEX = "(" + IPV4_ADDRESS_REGEX + "|" + IPV6_ADDRESS_REGEX + ")";
    

    /**
     * Pattern which matches valid values of the de-facto standard
     * "X-Forwarded-For" header.
     */
    private static final Pattern X_FORWARDED_FOR = Pattern.compile("^" + IP_ADDRESS_REGEX + "(, " + IP_ADDRESS_REGEX + ")*$");

    public enum InOutErr{ERROR, INPUT};

    private static void releaseProcessStreams(InOutErr inOutErr, Process p) throws IOException {
        switch (inOutErr) {
            case ERROR :
                if (p.getErrorStream() != null) {
                    p.getErrorStream().close();
                }
                break;
            default :
                if (p.getInputStream() != null) {
                    p.getInputStream().close();
                }
        }
    }

    private static String closeProcessStreams(InOutErr inOutErr, Process p) {
        if (p != null) {
            try {
                Utils.releaseProcessStreams(inOutErr, p);
            } catch (IOException e) {
                return Utils.getStackTrace(e);
            }
        }
        return "";
    }

    public static String getCommandInput(InOutErr inOutErr, Process p) {
        String inputLine = "";
        boolean releaseStreams = false;
        try {
            InputStream in = (inOutErr == InOutErr.ERROR) ? p.getErrorStream() : p.getInputStream();
            InputStreamReader inReader = new InputStreamReader(in);
            BufferedReader reader = new BufferedReader(inReader);
            if(reader.ready()) {
                    inputLine = reader.readLine();
            }
            Utils.releaseProcessStreams(inOutErr, p);
            releaseStreams = true;
        } catch (Exception e) {
            logger.info(Utils.getStackTrace(e));
        } finally {
            if (!releaseStreams) {
                inputLine += Utils.closeProcessStreams(inOutErr, p);
            }
        }
        return inputLine;
    }
    
    /**
     * Returns a formatted string containing an IP address, or list of IP
     * addresses, which represent the HTTP client and any involved proxies. As
     * the headers used to determine proxies can easily be forged, this data is
     * superficially validated to ensure that it at least looks like a list of
     * IPs.
     *
     * @param request
     *     The HTTP request to format.
     *
     * @return
     *     A formatted string containing one or more IP addresses.
     */
    public static String getLoggableAddress(HttpServletRequest request) {

        // Log X-Forwarded-For, if present and valid
        String header = request.getHeader("X-Forwarded-For");
        if (header != null && X_FORWARDED_FOR.matcher(header).matches())
            return "[" + header + ", " + request.getRemoteAddr() + "]";

        // If header absent or invalid, just use source IP
        return request.getRemoteAddr();

    }
	
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
