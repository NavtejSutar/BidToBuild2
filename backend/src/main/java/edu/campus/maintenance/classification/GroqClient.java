package edu.campus.maintenance.classification;

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
