package edu.campus.maintenance.user;

public enum Role {
    USER,
    TECHNICIAN,
    ADMIN;

    public String withPrefix() {
        return "ROLE_" + this.name();
    }
}
