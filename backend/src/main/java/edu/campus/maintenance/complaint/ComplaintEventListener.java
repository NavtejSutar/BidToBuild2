package edu.campus.maintenance.complaint;

import edu.campus.maintenance.classification.ClassificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ComplaintEventListener {

    private final ClassificationService classificationService;

    @EventListener
    public void onComplaintCreated(Complaint complaint) {
        log.info("Handling Complaint created event for ID: {}", complaint.getId());
        classificationService.classifyComplaintAsync(complaint.getId());
    }
}
