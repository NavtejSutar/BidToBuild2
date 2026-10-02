package edu.campus.maintenance.complaint;

import edu.campus.maintenance.classification.ComplaintClassifiedEvent;
import edu.campus.maintenance.priority.PriorityScoringService;
import edu.campus.maintenance.recurrence.RecurrenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class ComplaintPostClassificationListener {

    private final ComplaintRepository complaintRepository;
    private final RecurrenceService recurrenceService;
    private final PriorityScoringService priorityScoringService;
    private final ComplaintEventService eventService;

    @EventListener
    @Transactional
    public void onComplaintClassified(ComplaintClassifiedEvent event) {
        Complaint complaint = complaintRepository.findById(event.complaintId()).orElse(null);
        if (complaint == null) return;

        log.info("Processing post-classification priority scoring and recurrence for complaint {}", complaint.getId());

        // 1. Evaluate recurrence
        recurrenceService.evaluateRecurrenceForComplaint(complaint);

        // 2. Score priority
        priorityScoringService.recalculateAndApply(complaint, Instant.now());

        complaint = complaintRepository.save(complaint);

        // 3. Broadcast updated score and recurrence via SSE
        eventService.broadcastStatusUpdate(complaint.getId(), edu.campus.maintenance.complaint.dto.ComplaintDto.from(complaint));
    }
}
