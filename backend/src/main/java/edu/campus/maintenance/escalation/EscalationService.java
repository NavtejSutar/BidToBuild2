package edu.campus.maintenance.escalation;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.complaint.PriorityLevel;
import edu.campus.maintenance.history.ComplaintHistory;
import edu.campus.maintenance.history.ComplaintHistoryRepository;
import edu.campus.maintenance.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EscalationService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository historyRepository;
    private final NotificationService notificationService;

    @Value("${app.escalation.critical-unassigned-minutes:30}")
    private int criticalUnassignedMinutes = 30;

    @Transactional
    public void runEscalationChecks() {
        Instant now = Instant.now();
        log.debug("Running SLA and escalation checks at {}", now);

        // 1. Unassigned CRITICAL check: if not ASSIGNED within 30m, notify admins (escalationLevel == 0)
        checkUnassignedCritical(now);

        // 2. SLA breach check by priority level:
        // CRITICAL 4h, HIGH 24h, MEDIUM 72h, LOW 168h (7d)
        checkSlaBreaches(now);
    }

    private void checkUnassignedCritical(Instant now) {
        Instant threshold = now.minus(Duration.ofMinutes(criticalUnassignedMinutes));
        List<Complaint> unassignedCritical = complaintRepository.findUnassignedCriticalOlderThan(threshold);

        for (Complaint complaint : unassignedCritical) {
            if (complaint.getEscalationLevel() == 0) {
                log.warn("Escalating unassigned CRITICAL complaint ID: {}", complaint.getId());
                complaint.setEscalationLevel(1);
                complaintRepository.save(complaint);

                recordHistory(complaint, "ESCALATION_UNASSIGNED",
                        "CRITICAL complaint remained unassigned for over " + criticalUnassignedMinutes + " minutes.");

                notificationService.notifyAdmins(
                        "CRITICAL_UNASSIGNED",
                        "CRITICAL Complaint #" + complaint.getId() + " (" + complaint.getTitle() + ") is unassigned after " + criticalUnassignedMinutes + " minutes!",
                        complaint
                );
            }
        }
    }

    private void checkSlaBreaches(Instant now) {
        List<Complaint> openComplaints = complaintRepository.findUnresolvedComplaints();

        for (Complaint complaint : openComplaints) {
            long hoursOpen = Duration.between(complaint.getCreatedAt(), now).toHours();
            long maxSlaHours = getSlaHours(complaint.getPriorityLevel());

            if (hoursOpen >= maxSlaHours && complaint.getEscalationLevel() < 2) {
                int newLevel = complaint.getEscalationLevel() + 1;
                log.warn("SLA breached for complaint ID: {} (Level: {}, Open: {}h, SLA: {}h)",
                        complaint.getId(), complaint.getPriorityLevel(), hoursOpen, maxSlaHours);

                complaint.setEscalationLevel(newLevel);
                complaintRepository.save(complaint);

                String msg = "SLA breached: Complaint has been open for " + hoursOpen + " hours (SLA: " + maxSlaHours + "h). Escalated to level " + newLevel + ".";
                recordHistory(complaint, "SLA_BREACH", msg);

                notificationService.notifyAdmins(
                        "SLA_BREACH",
                        "SLA Breached: Complaint #" + complaint.getId() + " (" + complaint.getTitle() + ") exceeded " + maxSlaHours + "h SLA window!",
                        complaint
                );
            }
        }
    }

    private long getSlaHours(PriorityLevel level) {
        if (level == null) return 72;
        return switch (level) {
            case CRITICAL -> 4;
            case HIGH -> 24;
            case MEDIUM -> 72;
            case LOW -> 168;
        };
    }

    private void recordHistory(Complaint complaint, String eventType, String note) {
        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .eventType(eventType)
                .note(note)
                .build();
        historyRepository.save(history);
    }
}
