package edu.campus.maintenance.classification;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.campus.maintenance.classification.dto.ClassificationResult;
import edu.campus.maintenance.complaint.*;
import edu.campus.maintenance.complaint.dto.ComplaintDto;
import edu.campus.maintenance.history.ComplaintHistory;
import edu.campus.maintenance.history.ComplaintHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassificationService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository historyRepository;
    private final GroqClient groqClient;
    private final ClassificationPromptBuilder promptBuilder;
    private final FallbackClassifier fallbackClassifier;
    private final ComplaintEventService eventService;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Async("classificationExecutor")
    @Transactional
    public void classifyComplaintAsync(Long complaintId) {
        log.info("Starting async classification for complaint ID: {}", complaintId);

        Complaint complaint = complaintRepository.findById(complaintId).orElse(null);
        if (complaint == null) {
            log.warn("Complaint not found for classification ID: {}", complaintId);
            return;
        }

        ClassificationResult result = null;
        ClassificationSource source = ClassificationSource.GROQ;

        try {
            String systemPrompt = promptBuilder.getSystemPrompt();
            String userPrompt = promptBuilder.buildUserPrompt(
                    complaint.getTitle(),
                    complaint.getDescription(),
                    complaint.getLocation().getDisplayName()
            );

            result = groqClient.callClassification(systemPrompt, userPrompt);
            log.info("Groq classification succeeded for complaint ID {}: {}", complaintId, result.getCategory());

        } catch (Exception ex) {
            log.warn("Groq classification failed for complaint ID {}: {}. Triggering fallback classifier.",
                    complaintId, ex.getMessage());
            source = ClassificationSource.FALLBACK;
            result = fallbackClassifier.classify(complaint.getTitle(), complaint.getDescription());
        }

        // Apply classification results
        complaint.setCategory(result.getCategory());
        complaint.setUrgency(result.getUrgency());
        complaint.setClassificationSource(source);
        complaint.setClassificationStatus(ClassificationStatus.COMPLETED);

        try {
            complaint.setTagsJson(objectMapper.writeValueAsString(result.getTags()));
        } catch (Exception e) {
            complaint.setTagsJson("[]");
        }

        complaint = complaintRepository.save(complaint);

        // Record history
        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .eventType("CLASSIFIED")
                .note("Classified as " + result.getCategory() + " (" + result.getUrgency() + ") via " + source + ": " + result.getReasoning())
                .metadata("{\"confidence\":" + result.getConfidence() + ",\"source\":\"" + source.name() + "\"}")
                .build();
        historyRepository.save(history);

        // Notify client via SSE
        eventService.broadcastStatusUpdate(complaint.getId(), ComplaintDto.from(complaint));

        // Publish event for priority re-scoring and recurrence detection (Phases 5 & 6)
        eventPublisher.publishEvent(new ComplaintClassifiedEvent(complaint.getId()));
    }
}
