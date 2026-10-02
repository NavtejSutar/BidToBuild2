package edu.campus.maintenance.scheduler;

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
