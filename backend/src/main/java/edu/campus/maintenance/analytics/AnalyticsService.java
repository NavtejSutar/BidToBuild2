package edu.campus.maintenance.analytics;

import edu.campus.maintenance.analytics.dto.*;
import edu.campus.maintenance.complaint.*;
import edu.campus.maintenance.location.Location;
import edu.campus.maintenance.location.LocationRepository;
import edu.campus.maintenance.recurrence.RecurrenceIndexRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;
    private final LocationRepository locationRepository;
    private final RecurrenceIndexRepository recurrenceIndexRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary() {
        long totalComplaints = complaintRepository.count();
        long openComplaints = complaintRepository.countOpenComplaints();
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long critical = complaintRepository.countCriticalOpenComplaints();
        long recurringClustersCount = recurrenceIndexRepository.count();

        Double avgSecs = complaintRepository.findAverageResolutionTimeSeconds();
        double avgHours = avgSecs != null ? Math.round((avgSecs / 3600.0) * 10.0) / 10.0 : 0.0;

        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        for (ComplaintStatus status : ComplaintStatus.values()) {
            statusBreakdown.put(status.name(), complaintRepository.countByStatus(status));
        }

        Map<String, Long> priorityBreakdown = new LinkedHashMap<>();
        for (PriorityLevel level : PriorityLevel.values()) {
            priorityBreakdown.put(level.name(), complaintRepository.countByPriorityLevel(level));
        }

        Map<String, Long> categoryBreakdown = new LinkedHashMap<>();
        for (Category cat : Category.values()) {
            categoryBreakdown.put(cat.name(), complaintRepository.countByCategory(cat));
        }

        Map<String, Long> urgencyBreakdown = new LinkedHashMap<>();
        for (Urgency u : Urgency.values()) {
            urgencyBreakdown.put(u.name(), complaintRepository.countByUrgency(u));
        }

        List<LocationHotspotDto> topLocations = getTopLocationHotspots();

        return DashboardSummaryDto.builder()
                .totalComplaints(totalComplaints)
                .openComplaints(openComplaints)
                .inProgressComplaints(inProgress)
                .resolvedComplaints(resolved)
                .criticalComplaints(critical)
                .recurringClustersCount(recurringClustersCount)
                .avgResolutionTimeHours(avgHours)
                .statusBreakdown(statusBreakdown)
                .priorityBreakdown(priorityBreakdown)
                .categoryBreakdown(categoryBreakdown)
                .urgencyBreakdown(urgencyBreakdown)
                .topLocations(topLocations)
                .build();
    }

    @Transactional(readOnly = true)
    public StatusPriorityMatrixDto getStatusPriorityMatrix() {
        List<MatrixRowDto> rows = new ArrayList<>();
        Map<String, Long> columnTotals = new LinkedHashMap<>();
        for (PriorityLevel p : PriorityLevel.values()) {
            columnTotals.put(p.name(), 0L);
        }
        long grandTotal = 0;

        for (ComplaintStatus s : ComplaintStatus.values()) {
            long crit = complaintRepository.countByStatusAndPriorityLevel(s, PriorityLevel.CRITICAL);
            long high = complaintRepository.countByStatusAndPriorityLevel(s, PriorityLevel.HIGH);
            long med = complaintRepository.countByStatusAndPriorityLevel(s, PriorityLevel.MEDIUM);
            long low = complaintRepository.countByStatusAndPriorityLevel(s, PriorityLevel.LOW);
            long rowTotal = crit + high + med + low;

            columnTotals.put("CRITICAL", columnTotals.get("CRITICAL") + crit);
            columnTotals.put("HIGH", columnTotals.get("HIGH") + high);
            columnTotals.put("MEDIUM", columnTotals.get("MEDIUM") + med);
            columnTotals.put("LOW", columnTotals.get("LOW") + low);
            grandTotal += rowTotal;

            rows.add(MatrixRowDto.builder()
                    .status(s.name())
                    .critical(crit)
                    .high(high)
                    .medium(med)
                    .low(low)
                    .total(rowTotal)
                    .build());
        }

        return StatusPriorityMatrixDto.builder()
                .rows(rows)
                .columnTotals(columnTotals)
                .grandTotal(grandTotal)
                .build();
    }

    @Transactional(readOnly = true)
    public List<MatrixCellDto> getMatrixCells() {
        List<MatrixCellDto> cells = new ArrayList<>();
        for (ComplaintStatus s : ComplaintStatus.values()) {
            for (PriorityLevel p : PriorityLevel.values()) {
                long count = complaintRepository.countByStatusAndPriorityLevel(s, p);
                cells.add(new MatrixCellDto(s.name(), p.name(), count));
            }
        }
        return cells;
    }

    private List<LocationHotspotDto> getTopLocationHotspots() {
        List<Location> locations = locationRepository.findAll();
        List<LocationHotspotDto> hotspots = new ArrayList<>();

        for (Location loc : locations) {
            long openCount = complaintRepository.count((root, query, cb) ->
                    cb.and(
                            cb.equal(root.get("location").get("id"), loc.getId()),
                            cb.notEqual(root.get("status"), ComplaintStatus.RESOLVED)
                    )
            );
            long totalCount = complaintRepository.count((root, query, cb) ->
                    cb.equal(root.get("location").get("id"), loc.getId())
            );

            if (totalCount > 0) {
                hotspots.add(LocationHotspotDto.builder()
                        .locationId(loc.getId())
                        .locationName(loc.getDisplayName())
                        .building(loc.getBuilding())
                        .openComplaints(openCount)
                        .totalComplaints(totalCount)
                        .recurringDetected(openCount >= 2)
                        .build());
            }
        }

        hotspots.sort((a, b) -> Long.compare(b.getOpenComplaints(), a.getOpenComplaints()));
        return hotspots.size() > 5 ? hotspots.subList(0, 5) : hotspots;
    }
}
