const fs = require('fs');
const path = require('path');

function writeBackendFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

function writeBackendTest(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'test', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote test: ' + relPath);
}

// 1. MatrixCellDto
writeBackendFile('analytics/dto/MatrixCellDto.java', `package edu.campus.maintenance.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatrixCellDto {
    private String status;
    private String priority;
    private long count;
}
`);

// 2. MatrixRowDto
writeBackendFile('analytics/dto/MatrixRowDto.java', `package edu.campus.maintenance.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatrixRowDto {
    private String status;
    private long critical;
    private long high;
    private long medium;
    private long low;
    private long total;
}
`);

// 3. StatusPriorityMatrixDto
writeBackendFile('analytics/dto/StatusPriorityMatrixDto.java', `package edu.campus.maintenance.analytics.dto;

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
public class StatusPriorityMatrixDto {
    private List<MatrixRowDto> rows;
    private Map<String, Long> columnTotals;
    private long grandTotal;
}
`);

// 4. LocationHotspotDto
writeBackendFile('analytics/dto/LocationHotspotDto.java', `package edu.campus.maintenance.analytics.dto;

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
`);

// 5. DashboardSummaryDto
writeBackendFile('analytics/dto/DashboardSummaryDto.java', `package edu.campus.maintenance.analytics.dto;

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
`);

// 6. AnalyticsService
writeBackendFile('analytics/AnalyticsService.java', `package edu.campus.maintenance.analytics;

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
                        .locationName(loc.getName())
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
`);

// 7. AnalyticsController
writeBackendFile('analytics/AnalyticsController.java', `package edu.campus.maintenance.analytics;

import edu.campus.maintenance.analytics.dto.DashboardSummaryDto;
import edu.campus.maintenance.analytics.dto.MatrixCellDto;
import edu.campus.maintenance.analytics.dto.StatusPriorityMatrixDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'TECHNICIAN')")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }

    @GetMapping("/matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'TECHNICIAN')")
    public ResponseEntity<StatusPriorityMatrixDto> getStatusPriorityMatrix() {
        return ResponseEntity.ok(analyticsService.getStatusPriorityMatrix());
    }

    @GetMapping("/matrix/cells")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'TECHNICIAN')")
    public ResponseEntity<List<MatrixCellDto>> getMatrixCells() {
        return ResponseEntity.ok(analyticsService.getMatrixCells());
    }
}
`);

// 8. MaintenanceScheduler
writeBackendFile('scheduler/MaintenanceScheduler.java', `package edu.campus.maintenance.scheduler;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.priority.PriorityScoringService;
import edu.campus.maintenance.recurrence.RecurrenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MaintenanceScheduler {

    private final ComplaintRepository complaintRepository;
    private final PriorityScoringService priorityScoringService;
    private final RecurrenceService recurrenceService;

    /**
     * Recalculates dynamic priority scores for all active (unresolved) complaints
     * Runs every 10 minutes (600,000 ms).
     */
    @Scheduled(fixedRate = 600000)
    @Transactional
    public void recalculateOpenComplaintPriorities() {
        log.info("Running scheduled priority score refresh for open complaints...");
        List<Complaint> openComplaints = complaintRepository.findUnresolvedComplaints();
        Instant now = Instant.now();
        int count = 0;

        for (Complaint complaint : openComplaints) {
            priorityScoringService.recalculateAndApply(complaint, now);
            complaintRepository.save(complaint);
            count++;
        }

        log.info("Finished scheduled priority score refresh for {} open complaints.", count);
    }

    /**
     * Automatic escalation check: runs every 5 minutes.
     * Escalates CRITICAL complaints that have been in REPORTED status for more than 2 hours.
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void checkAndEscalateStaleComplaints() {
        log.info("Checking for unassigned critical complaints needing escalation...");
        Instant twoHoursAgo = Instant.now().minus(2, ChronoUnit.HOURS);
        List<Complaint> staleCriticals = complaintRepository.findUnassignedCriticalOlderThan(twoHoursAgo);

        for (Complaint complaint : staleCriticals) {
            if (complaint.getEscalationLevel() == 0) {
                complaint.setEscalationLevel(1);
                complaintRepository.save(complaint);
                log.warn("Auto-escalated complaint ID {} (CRITICAL unassigned for > 2 hours)", complaint.getId());
            }
        }
    }

    /**
     * Nightly recurrence index table rebuild at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void nightlyRecurrenceRebuild() {
        log.info("Running nightly recurrence index rebuild task...");
        recurrenceService.rebuildAllRecurrenceIndexes();
        log.info("Nightly recurrence index rebuild completed.");
    }
}
`);

// 9. AnalyticsServiceTest
writeBackendTest('analytics/AnalyticsServiceTest.java', `package edu.campus.maintenance.analytics;

import edu.campus.maintenance.analytics.dto.DashboardSummaryDto;
import edu.campus.maintenance.analytics.dto.StatusPriorityMatrixDto;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.complaint.PriorityLevel;
import edu.campus.maintenance.location.LocationRepository;
import edu.campus.maintenance.recurrence.RecurrenceIndexRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private RecurrenceIndexRepository recurrenceIndexRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    @DisplayName("Should return accurate dashboard summary metrics")
    void shouldReturnDashboardSummary() {
        when(complaintRepository.count()).thenReturn(15L);
        when(complaintRepository.countOpenComplaints()).thenReturn(8L);
        when(complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS)).thenReturn(3L);
        when(complaintRepository.countByStatus(ComplaintStatus.RESOLVED)).thenReturn(7L);
        when(complaintRepository.countCriticalOpenComplaints()).thenReturn(2L);
        when(recurrenceIndexRepository.count()).thenReturn(1L);
        when(complaintRepository.findAverageResolutionTimeSeconds()).thenReturn(7200.0);
        when(locationRepository.findAll()).thenReturn(List.of());

        DashboardSummaryDto summary = analyticsService.getDashboardSummary();

        assertThat(summary.getTotalComplaints()).isEqualTo(15L);
        assertThat(summary.getOpenComplaints()).isEqualTo(8L);
        assertThat(summary.getInProgressComplaints()).isEqualTo(3L);
        assertThat(summary.getResolvedComplaints()).isEqualTo(7L);
        assertThat(summary.getCriticalComplaints()).isEqualTo(2L);
        assertThat(summary.getAvgResolutionTimeHours()).isEqualTo(2.0);
        assertThat(summary.getStatusBreakdown()).containsKey("REPORTED");
        assertThat(summary.getPriorityBreakdown()).containsKey("CRITICAL");
    }

    @Test
    @DisplayName("Should build 2D status-by-priority matrix")
    void shouldReturnStatusPriorityMatrix() {
        when(complaintRepository.countByStatusAndPriorityLevel(ComplaintStatus.REPORTED, PriorityLevel.CRITICAL))
                .thenReturn(2L);
        when(complaintRepository.countByStatusAndPriorityLevel(ComplaintStatus.REPORTED, PriorityLevel.HIGH))
                .thenReturn(3L);

        StatusPriorityMatrixDto matrix = analyticsService.getStatusPriorityMatrix();

        assertThat(matrix.getRows()).isNotEmpty();
        assertThat(matrix.getColumnTotals()).containsKey("CRITICAL");
        assertThat(matrix.getColumnTotals().get("CRITICAL")).isGreaterThanOrEqualTo(2L);
    }
}
`);

// 10. MaintenanceSchedulerTest
writeBackendTest('scheduler/MaintenanceSchedulerTest.java', `package edu.campus.maintenance.scheduler;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.complaint.PriorityLevel;
import edu.campus.maintenance.priority.PriorityScoringService;
import edu.campus.maintenance.recurrence.RecurrenceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceSchedulerTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private PriorityScoringService priorityScoringService;

    @Mock
    private RecurrenceService recurrenceService;

    @InjectMocks
    private MaintenanceScheduler maintenanceScheduler;

    @Test
    @DisplayName("Should recalculate priorities for unresolved complaints")
    void shouldRecalculatePriorities() {
        Complaint c1 = Complaint.builder().id(1L).status(ComplaintStatus.REPORTED).build();
        Complaint c2 = Complaint.builder().id(2L).status(ComplaintStatus.IN_PROGRESS).build();

        when(complaintRepository.findUnresolvedComplaints()).thenReturn(List.of(c1, c2));

        maintenanceScheduler.recalculateOpenComplaintPriorities();

        verify(priorityScoringService, times(1)).recalculateAndApply(eq(c1), any(Instant.class));
        verify(priorityScoringService, times(1)).recalculateAndApply(eq(c2), any(Instant.class));
        verify(complaintRepository, times(1)).save(c1);
        verify(complaintRepository, times(1)).save(c2);
    }

    @Test
    @DisplayName("Should auto-escalate stale critical complaints")
    void shouldEscalateStaleCriticalComplaints() {
        Complaint stale = Complaint.builder()
                .id(10L)
                .status(ComplaintStatus.REPORTED)
                .priorityLevel(PriorityLevel.CRITICAL)
                .escalationLevel(0)
                .build();

        when(complaintRepository.findUnassignedCriticalOlderThan(any(Instant.class)))
                .thenReturn(List.of(stale));

        maintenanceScheduler.checkAndEscalateStaleComplaints();

        verify(complaintRepository, times(1)).save(stale);
        org.assertj.core.api.Assertions.assertThat(stale.getEscalationLevel()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should invoke nightly recurrence rebuild")
    void shouldRebuildRecurrenceNightly() {
        maintenanceScheduler.nightlyRecurrenceRebuild();
        verify(recurrenceService, times(1)).rebuildAllRecurrenceIndexes();
    }
}
`);
