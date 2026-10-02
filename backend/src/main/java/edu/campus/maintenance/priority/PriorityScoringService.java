package edu.campus.maintenance.priority;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.complaint.PriorityLevel;
import edu.campus.maintenance.complaint.Urgency;
import edu.campus.maintenance.priority.dto.PriorityCalculationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriorityScoringService {

    private final PriorityProperties properties;

    public PriorityCalculationResult calculateScore(
            Urgency urgency,
            ComplaintStatus status,
            Instant createdAt,
            int recurrenceIndex,
            Instant now) {

        int urgencyBase = getUrgencyBase(urgency);

        // Aging bonus: min(20, hoursOpen / 6) only while status != RESOLVED
        long hoursOpen = 0;
        int agingBonus = 0;
        if (status != ComplaintStatus.RESOLVED && createdAt != null) {
            hoursOpen = Math.max(0, Duration.between(createdAt, now).toHours());
            agingBonus = (int) Math.min(properties.getMaxAgingBonus(), hoursOpen / properties.getAgingDivisor());
        }

        // Recurrence bonus: min(15, recurrenceIndex * 5)
        int recurrenceBonus = Math.min(
                properties.getMaxRecurrenceBonus(),
                Math.max(0, recurrenceIndex * properties.getRecurrenceMultiplier())
        );

        int totalScore = Math.min(100, urgencyBase + agingBonus + recurrenceBonus);
        PriorityLevel level = determineLevel(totalScore);

        return PriorityCalculationResult.builder()
                .score(totalScore)
                .level(level)
                .urgencyBase(urgencyBase)
                .agingBonus(agingBonus)
                .recurrenceBonus(recurrenceBonus)
                .hoursOpen(hoursOpen)
                .recurrenceIndex(recurrenceIndex)
                .build();
    }

    public void recalculateAndApply(Complaint complaint, Instant now) {
        PriorityCalculationResult result = calculateScore(
                complaint.getUrgency(),
                complaint.getStatus(),
                complaint.getCreatedAt(),
                complaint.getRecurrenceIndex(),
                now
        );

        complaint.setPriorityScore(result.getScore());
        complaint.setPriorityLevel(result.getLevel());
        complaint.setPriorityBreakdownJson(result.toJson());
    }

    private int getUrgencyBase(Urgency urgency) {
        if (urgency == null) return properties.getUrgencyBase().getOrDefault("low", 10);
        return properties.getUrgencyBase().getOrDefault(urgency.name().toLowerCase(Locale.ROOT), 10);
    }

    public static PriorityLevel determineLevel(int score) {
        if (score >= 75) return PriorityLevel.CRITICAL;
        if (score >= 50) return PriorityLevel.HIGH;
        if (score >= 25) return PriorityLevel.MEDIUM;
        return PriorityLevel.LOW;
    }
}
