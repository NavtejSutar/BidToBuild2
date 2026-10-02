package edu.campus.maintenance.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationHotspotDto {
    private Long locationId;
    private String locationName;
    private String building;
    private long openComplaints;
    private long totalComplaints;
    private boolean recurringDetected;
}
