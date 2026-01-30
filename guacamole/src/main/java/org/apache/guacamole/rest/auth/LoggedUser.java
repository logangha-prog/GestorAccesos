package org.apache.guacamole.rest.auth;

public class LoggedUser {
	String username;
	String fullname;
	String management;
	String accesstype;
	
	LoggedUser(String pUsername, String pFullname,
                   String pManagement, String pAccesstype) {
		this.username = pUsername;
		this.fullname = pFullname;
		this.management = pManagement;
                this.accesstype = pAccesstype;
	}
	/**
	 * @return the username
	 */
	public String getUsername() {
		return username;
	}
	/**
	 * @param username the username to set
	 */
	public void setUsername(String username) {
		this.username = username;
	}
	/**
	 * @return the fullname
	 */
	public String getFullname() {
		return fullname;
	}
	/**
	 * @param fullname the fullname to set
	 */
	public void setFullname(String fullname) {
		this.fullname = fullname;
	}
	/**
	 * @return the management
	 */
	public String getManagement() {
		return management;
	}
	/**
	 * @param management the management to set
	 */
	public void setManagement(String management) {
		this.management = management;
	}
	/**
	 * @return the user access type
	 */
	public String getAccesstype() {
		return accesstype;
	}
	/**
	 * @param accesstype the user access type to set
	 */
	public void setAccesstype(String accesstype) {
		this.accesstype = accesstype;
	}
}

