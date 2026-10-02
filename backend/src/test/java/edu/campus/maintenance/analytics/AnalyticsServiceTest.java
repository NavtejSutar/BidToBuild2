package edu.campus.maintenance.analytics;

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
