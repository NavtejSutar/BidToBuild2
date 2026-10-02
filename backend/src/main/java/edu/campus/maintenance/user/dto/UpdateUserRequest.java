package edu.campus.maintenance.user.dto;

import edu.campus.maintenance.user.Role;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private Role role;
    private String department;
    private Boolean active;
}
