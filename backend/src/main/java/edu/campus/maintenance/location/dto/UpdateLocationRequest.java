package edu.campus.maintenance.location.dto;

import lombok.Data;

@Data
public class UpdateLocationRequest {
    private String campusZone;
    private String building;
    private String floor;
    private String room;
    private String displayName;
}
