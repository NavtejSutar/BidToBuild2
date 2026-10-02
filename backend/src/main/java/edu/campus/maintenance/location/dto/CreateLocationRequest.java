package edu.campus.maintenance.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLocationRequest {
    @NotBlank(message = "Campus zone is required")
    @Size(max = 100)
    private String campusZone;

    @NotBlank(message = "Building is required")
    @Size(max = 100)
    private String building;

    @NotBlank(message = "Floor is required")
    @Size(max = 50)
    private String floor;

    @NotBlank(message = "Room is required")
    @Size(max = 100)
    private String room;

    private String displayName;
}
