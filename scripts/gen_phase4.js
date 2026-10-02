const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. ClassificationResult DTO
writeFile('classification/dto/ClassificationResult.java', `package edu.campus.maintenance.classification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Urgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ClassificationResult {
    private Category category;
    private Urgency urgency;
    private List<String> tags;
    private String reasoning;
    private double confidence;
}
`);

// 2. LlmCall entity & repo
writeFile('classification/llm/LlmCall.java', `package edu.campus.maintenance.classification.llm;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "llm_calls")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LlmCall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String purpose;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "prompt_version", length = 50)
    private String promptVersion;

    @Column(name = "latency_ms", nullable = false)
    private long latencyMs;

    @Column(name = "prompt_tokens", nullable = false)
    @Builder.Default
    private int promptTokens = 0;

    @Column(name = "completion_tokens", nullable = false)
    @Builder.Default
    private int completionTokens = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean success = true;

    @Column(columnDefinition = "TEXT")
    private String error;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
`);

writeFile('classification/llm/LlmCallRepository.java', `package edu.campus.maintenance.classification.llm;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LlmCallRepository extends JpaRepository<LlmCall, Long> {
}
`);

// 3. AsyncConfig
writeFile('config/AsyncConfig.java', `package edu.campus.maintenance.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "classificationExecutor")
    public Executor classificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("GroqClassifier-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
`);

// 4. GroqProperties
writeFile('classification/GroqProperties.java', `package edu.campus.maintenance.classification;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.groq")
public class GroqProperties {
    private String endpoint = "https://api.groq.com/openai/v1/chat/completions";
    private String apiKey;
    private String model = "openai/gpt-oss-120b";
    private int timeoutMs = 15000;
    private int maxRetries = 2;
}
`);

// 5. ClassificationPromptBuilder
writeFile('classification/ClassificationPromptBuilder.java', `package edu.campus.maintenance.classification;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class ClassificationPromptBuilder {

    public static final String PROMPT_VERSION = "v1.0";

    @Getter
    private String systemPrompt;

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("prompts/classification-system-v1.txt");
            this.systemPrompt = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8).trim();
            log.info("Loaded Groq classification system prompt version {}", PROMPT_VERSION);
        } catch (IOException e) {
            log.error("Failed to load classification prompt template, using default inline prompt", e);
            this.systemPrompt = "You classify maintenance complaints for a college campus. Return only a JSON object matching schema.";
        }
    }

    public String buildUserPrompt(String title, String description, String locationName) {
        return """
               Complaint Details:
               - Title: %s
               - Description: %s
               - Location: %s
               
               Respond strictly with the required JSON object.
               """.formatted(
                cleanInput(title),
                cleanInput(description),
                cleanInput(locationName)
        );
    }

    private String cleanInput(String input) {
        if (input == null) return "";
        // Sanitize to prevent prompt manipulation
        return input.replace("\r", " ").replace("\n", " ").trim();
    }
}
`);

// 6. FallbackClassifier
writeFile('classification/FallbackClassifier.java', `package edu.campus.maintenance.classification;

import edu.campus.maintenance.classification.dto.ClassificationResult;
import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Urgency;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component
public class FallbackClassifier {

    public ClassificationResult classify(String title, String description) {
        String text = (title + " " + description).toLowerCase(Locale.ROOT);

        Category category = determineCategory(text);
        Urgency urgency = determineUrgency(text);
        List<String> tags = generateTags(text, category);

        String reasoning = "Deterministic fallback classified as " + category + " with urgency " + urgency + " based on keywords.";

        log.info("Fallback classifier result: category={}, urgency={}", category, urgency);

        return ClassificationResult.builder()
                .category(category)
                .urgency(urgency)
                .tags(tags)
                .reasoning(reasoning)
                .confidence(0.70)
                .build();
    }

    private Category determineCategory(String text) {
        if (containsAny(text, "spark", "wire", "power", "shock", "socket", "switch", "light", "fuse", "blackout", "current", "voltage", "breaker", "trip")) {
            return Category.ELECTRICAL;
        }
        if (containsAny(text, "leak", "pipe", "water", "tap", "toilet", "flush", "drain", "sewage", "faucet", "sink", "overflow", "plumbing")) {
            return Category.PLUMBING;
        }
        if (containsAny(text, "ac", "air condition", "air-condition", "hvac", "cooling", "heat", "heater", "ventilation", "thermostat", "filter")) {
            return Category.HVAC;
        }
        if (containsAny(text, "wifi", "internet", "network", "ethernet", "computer", "projector", "printer", "router", "lan", "cable", "monitor", "screen")) {
            return Category.IT;
        }
        if (containsAny(text, "wall", "ceiling", "floor", "crack", "tile", "plaster", "door", "window", "glass", "roof", "civil", "structural", "concrete")) {
            return Category.CIVIL;
        }
        if (containsAny(text, "desk", "chair", "table", "bench", "drawer", "cupboard", "board", "bed", "furniture", "lock", "handle")) {
            return Category.FURNITURE;
        }
        if (containsAny(text, "garbage", "trash", "smell", "dirty", "clean", "cleaning", "pest", "dust", "waste", "stain", "washroom")) {
            return Category.CLEANING;
        }
        if (containsAny(text, "fire", "smoke", "gas", "alarm", "extinguisher", "hazard", "emergency", "danger")) {
            return Category.SAFETY;
        }
        return Category.OTHER;
    }

    private Urgency determineUrgency(String text) {
        if (containsAny(text, "fire", "smoke", "gas", "shock", "live wire", "flooding", "collapse", "danger to life", "explosion", "emergency")) {
            return Urgency.CRITICAL;
        }
        if (containsAny(text, "blackout", "no water", "overflow", "burst", "unusable", "server", "lab", "entire floor", "broken glass")) {
            return Urgency.HIGH;
        }
        if (containsAny(text, "not working", "slow", "noise", "dripping", "jammed", "stuck", "faulty")) {
            return Urgency.MEDIUM;
        }
        return Urgency.LOW;
    }

    private List<String> generateTags(String text, Category category) {
        List<String> tags = new ArrayList<>();
        tags.add(category.name().toLowerCase(Locale.ROOT));

        if (text.contains("water") || text.contains("leak")) tags.add("leakage");
        if (text.contains("power") || text.contains("light")) tags.add("power issue");
        if (text.contains("ac") || text.contains("cool")) tags.add("air cooling");
        if (text.contains("network") || text.contains("wifi")) tags.add("connectivity");
        if (text.contains("broken") || text.contains("damaged")) tags.add("hardware damage");

        if (tags.size() < 2) {
            tags.add("maintenance");
        }
        return tags;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }
}
`);

// 7. GroqClient
writeFile('classification/GroqClient.java', `package edu.campus.maintenance.classification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.campus.maintenance.classification.dto.ClassificationResult;
import edu.campus.maintenance.classification.llm.LlmCall;
import edu.campus.maintenance.classification.llm.LlmCallRepository;
import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Urgency;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class GroqClient {

    private final GroqProperties groqProperties;
    private final LlmCallRepository llmCallRepository;
    private final ObjectMapper objectMapper;

    @CircuitBreaker(name = "groqClient", fallbackMethod = "circuitBreakerFallback")
    public ClassificationResult callClassification(String systemPrompt, String userPrompt) throws Exception {
        String apiKey = groqProperties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Groq API key is not configured.");
        }

        long startTime = System.currentTimeMillis();
        RestClient restClient = RestClient.builder()
                .baseUrl(groqProperties.getEndpoint())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey.trim())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> requestBody = Map.of(
                "model", groqProperties.getModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.1,
                "response_format", Map.of("type", "json_object")
        );

        String jsonRequest = objectMapper.writeValueAsString(requestBody);

        int maxRetries = Math.max(1, groqProperties.getMaxRetries());
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String responseBody = restClient.post()
                        .body(jsonRequest)
                        .retrieve()
                        .body(String.class);

                long latency = System.currentTimeMillis() - startTime;
                return processResponse(responseBody, latency);

            } catch (Exception ex) {
                lastException = ex;
                log.warn("Groq API attempt {}/{} failed: {}", attempt, maxRetries, ex.getMessage());

                // Backoff before retry
                if (attempt < maxRetries) {
                    long backoffMs = (long) Math.pow(2, attempt) * 500L;
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        long latency = System.currentTimeMillis() - startTime;
        recordLlmCall("CLASSIFICATION", groqProperties.getModel(), latency, 0, 0, false,
                lastException != null ? lastException.getMessage() : "Unknown failure");

        throw Objects.requireNonNull(lastException != null ? lastException : new RuntimeException("Groq classification failed"));
    }

    public ClassificationResult circuitBreakerFallback(String systemPrompt, String userPrompt, Throwable t) throws Exception {
        log.warn("Groq circuit breaker open or call failed: {}", t.getMessage());
        throw new RuntimeException("Circuit breaker fallback activated", t);
    }

    private ClassificationResult processResponse(String responseBody, long latency) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode choices = root.path("choices");
        if (choices.isEmpty()) {
            throw new RuntimeException("Empty choices in Groq response");
        }

        String content = choices.get(0).path("message").path("content").asText();
        JsonNode usage = root.path("usage");
        int promptTokens = usage.path("prompt_tokens").asInt(0);
        int completionTokens = usage.path("completion_tokens").asInt(0);

        // Record successful call
        recordLlmCall("CLASSIFICATION", groqProperties.getModel(), latency, promptTokens, completionTokens, true, null);

        // Parse content JSON
        return parseAndValidateJson(content);
    }

    public ClassificationResult parseAndValidateJson(String content) throws Exception {
        JsonNode json = objectMapper.readTree(content);

        String categoryStr = json.path("category").asText("OTHER").toUpperCase(Locale.ROOT);
        String urgencyStr = json.path("urgency").asText("LOW").toUpperCase(Locale.ROOT);
        String reasoning = json.path("reasoning").asText("Classified by Groq LLM");
        double confidence = json.path("confidence").asDouble(0.90);

        List<String> tags = new ArrayList<>();
        JsonNode tagsNode = json.path("tags");
        if (tagsNode.isArray()) {
            tagsNode.forEach(t -> tags.add(t.asText().toLowerCase(Locale.ROOT)));
        }

        Category category;
        try {
            category = Category.valueOf(categoryStr);
        } catch (IllegalArgumentException e) {
            category = Category.OTHER;
        }

        Urgency urgency;
        try {
            urgency = Urgency.valueOf(urgencyStr);
        } catch (IllegalArgumentException e) {
            urgency = Urgency.LOW;
        }

        return ClassificationResult.builder()
                .category(category)
                .urgency(urgency)
                .tags(tags)
                .reasoning(reasoning)
                .confidence(confidence)
                .build();
    }

    private void recordLlmCall(String purpose, String model, long latency, int promptTokens, int completionTokens, boolean success, String error) {
        try {
            LlmCall call = LlmCall.builder()
                    .purpose(purpose)
                    .model(model)
                    .promptVersion(ClassificationPromptBuilder.PROMPT_VERSION)
                    .latencyMs(latency)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .success(success)
                    .error(error)
                    .build();
            llmCallRepository.save(call);
        } catch (Exception e) {
            log.error("Failed to audit LLM call in database", e);
        }
    }
}
`);

// 8. ClassificationService
writeFile('classification/ClassificationService.java', `package edu.campus.maintenance.classification;

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
`);

writeFile('classification/ComplaintClassifiedEvent.java', `package edu.campus.maintenance.classification;

public record ComplaintClassifiedEvent(Long complaintId) {
}
`);

// 9. ComplaintEventListener
writeFile('complaint/ComplaintEventListener.java', `package edu.campus.maintenance.complaint;

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
`);

console.log('Phase 4 Groq AI & fallback classifier generated.');