package edu.campus.maintenance.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private long totalComplaints;
    private long openComplaints;
    private long inProgressComplaints;
    private long resolvedComplaints;
    private long criticalComplaints;
    private long recurringClustersCount;
    private double avgResolutionTimeHours;
    private Map<String, Long> statusBreakdown;
    private Map<String, Long> priorityBreakdown;
    private Map<String, Long> categoryBreakdown;
    private Map<String, Long> urgencyBreakdown;
    private List<LocationHotspotDto> topLocations;
}
