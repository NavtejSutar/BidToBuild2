package edu.campus.maintenance.recurrence;

import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.location.Location;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecurrenceServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private RecurrenceIndexRepository recurrenceIndexRepository;

    @InjectMocks
    private RecurrenceService recurrenceService;

    private Location location;
    private Complaint complaint;

    @BeforeEach
    void setUp() {
        location = Location.builder().id(2L).displayName("Science Block A - Lab 204").build();
        complaint = Complaint.builder()
                .id(10L)
                .location(location)
                .category(Category.ELECTRICAL)
                .build();
    }

    @Test
    @DisplayName("Should flag is_recurring=true when recurrence_index >= 2")
    void evaluate_recurringTrue() {
        when(complaintRepository.countRecurringComplaints(eq(2L), eq(Category.ELECTRICAL), eq(10L), any(Instant.class)))
                .thenReturn(3);
        when(recurrenceIndexRepository.findByLocationAndCategory(location, Category.ELECTRICAL))
                .thenReturn(Optional.empty());

        recurrenceService.evaluateRecurrenceForComplaint(complaint);

        assertEquals(3, complaint.getRecurrenceIndex());
        assertTrue(complaint.isRecurring());
        verify(recurrenceIndexRepository).save(any(RecurrenceIndex.class));
    }

    @Test
    @DisplayName("Should flag is_recurring=false when recurrence_index < 2")
    void evaluate_recurringFalse() {
        when(complaintRepository.countRecurringComplaints(eq(2L), eq(Category.ELECTRICAL), eq(10L), any(Instant.class)))
                .thenReturn(1);
        when(recurrenceIndexRepository.findByLocationAndCategory(location, Category.ELECTRICAL))
                .thenReturn(Optional.empty());

        recurrenceService.evaluateRecurrenceForComplaint(complaint);

        assertEquals(1, complaint.getRecurrenceIndex());
        assertFalse(complaint.isRecurring());
    }
}
