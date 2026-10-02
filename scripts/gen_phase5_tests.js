const fs = require('fs');
const path = require('path');

function writeTestFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'test', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote Test: ' + relPath);
}

writeTestFile('priority/PriorityScoringServiceTest.java', `package edu.campus.maintenance.priority;

import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.complaint.PriorityLevel;
import edu.campus.maintenance.complaint.Urgency;
import edu.campus.maintenance.priority.dto.PriorityCalculationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

class PriorityScoringServiceTest {

    private PriorityScoringService priorityScoringService;

    @BeforeEach
    void setUp() {
        priorityScoringService = new PriorityScoringService(new PriorityProperties());
    }

    @Test
    @DisplayName("Fresh LOW urgency complaint should have base 10 and LOW level")
    void calculate_freshLow() {
        Instant now = Instant.now();
        PriorityCalculationResult result = priorityScoringService.calculateScore(
                Urgency.LOW, ComplaintStatus.REPORTED, now, 0, now);

        assertEquals(10, result.getScore());
        assertEquals(PriorityLevel.LOW, result.getLevel());
        assertEquals(10, result.getUrgencyBase());
        assertEquals(0, result.getAgingBonus());
        assertEquals(0, result.getRecurrenceBonus());
    }

    @Test
    @DisplayName("Fresh CRITICAL urgency complaint should have base 80 and CRITICAL level")
    void calculate_freshCritical() {
        Instant now = Instant.now();
        PriorityCalculationResult result = priorityScoringService.calculateScore(
                Urgency.CRITICAL, ComplaintStatus.REPORTED, now, 0, now);

        assertEquals(80, result.getScore());
        assertEquals(PriorityLevel.CRITICAL, result.getLevel());
        assertEquals(80, result.getUrgencyBase());
    }

    @Test
    @DisplayName("Aging bonus should increase by 1 every 6 hours, capped at 20")
    void calculate_agingBonusCap() {
        Instant now = Instant.now();
        // 72 hours open -> 72 / 6 = 12 bonus
        Instant created72hAgo = now.minus(72, ChronoUnit.HOURS);
        PriorityCalculationResult r1 = priorityScoringService.calculateScore(
                Urgency.MEDIUM, ComplaintStatus.IN_PROGRESS, created72hAgo, 0, now);

        assertEquals(30, r1.getUrgencyBase());
        assertEquals(12, r1.getAgingBonus());
        assertEquals(42, r1.getScore());
        assertEquals(PriorityLevel.MEDIUM, r1.getLevel());

        // 300 hours open -> 300 / 6 = 50, but capped at 20
        Instant created300hAgo = now.minus(300, ChronoUnit.HOURS);
        PriorityCalculationResult r2 = priorityScoringService.calculateScore(
                Urgency.MEDIUM, ComplaintStatus.IN_PROGRESS, created300hAgo, 0, now);

        assertEquals(20, r2.getAgingBonus());
        assertEquals(50, r2.getScore());
        assertEquals(PriorityLevel.HIGH, r2.getLevel());
    }

    @Test
    @DisplayName("Resolved complaints should NOT receive aging bonus")
    void calculate_resolvedNoAgingBonus() {
        Instant now = Instant.now();
        Instant created100hAgo = now.minus(100, ChronoUnit.HOURS);

        PriorityCalculationResult result = priorityScoringService.calculateScore(
                Urgency.HIGH, ComplaintStatus.RESOLVED, created100hAgo, 0, now);

        assertEquals(55, result.getUrgencyBase());
        assertEquals(0, result.getAgingBonus());
        assertEquals(55, result.getScore());
        assertEquals(PriorityLevel.HIGH, result.getLevel());
    }

    @Test
    @DisplayName("Recurrence bonus should be min(15, index * 5)")
    void calculate_recurrenceBonusCap() {
        Instant now = Instant.now();

        // 2 prior occurrences -> 2 * 5 = 10 bonus
        PriorityCalculationResult r1 = priorityScoringService.calculateScore(
                Urgency.LOW, ComplaintStatus.REPORTED, now, 2, now);
        assertEquals(10, r1.getRecurrenceBonus());
        assertEquals(20, r1.getScore());

        // 5 prior occurrences -> 5 * 5 = 25, capped at 15
        PriorityCalculationResult r2 = priorityScoringService.calculateScore(
                Urgency.LOW, ComplaintStatus.REPORTED, now, 5, now);
        assertEquals(15, r2.getRecurrenceBonus());
        assertEquals(25, r2.getScore());
        assertEquals(PriorityLevel.MEDIUM, r2.getLevel());
    }

    @Test
    @DisplayName("Total score should be clamped at 100")
    void calculate_clampedAt100() {
        Instant now = Instant.now();
        Instant created200hAgo = now.minus(200, ChronoUnit.HOURS);

        // CRITICAL (80) + aging (20) + recurrence (15) = 115 -> clamped to 100
        PriorityCalculationResult result = priorityScoringService.calculateScore(
                Urgency.CRITICAL, ComplaintStatus.ASSIGNED, created200hAgo, 4, now);

        assertEquals(100, result.getScore());
        assertEquals(PriorityLevel.CRITICAL, result.getLevel());
    }
}
`);

writeTestFile('recurrence/RecurrenceServiceTest.java', `package edu.campus.maintenance.recurrence;

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
`);

console.log('Phase 5 tests generated.');