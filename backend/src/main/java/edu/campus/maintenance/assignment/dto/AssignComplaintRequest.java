package edu.campus.maintenance.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignComplaintRequest {
    @NotNull(message = "Technician ID is required")
    private Long technicianId;
    private String note;
}
