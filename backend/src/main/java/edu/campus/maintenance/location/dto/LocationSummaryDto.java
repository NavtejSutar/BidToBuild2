package edu.campus.maintenance.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationSummaryDto {
    private LocationDto location;
    private long totalComplaints;
    private long openComplaints;
    private long recurringComplaints;
    private boolean hasActiveRecurring;
    private Map<String, Long> complaintsByCategory;
}
