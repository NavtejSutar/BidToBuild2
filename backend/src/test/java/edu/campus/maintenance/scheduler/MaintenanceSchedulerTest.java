package edu.campus.maintenance.scheduler;

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
