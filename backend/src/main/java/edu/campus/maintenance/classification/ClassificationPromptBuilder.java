package edu.campus.maintenance.classification;

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
        return input.replaceAll("\r", " ").replaceAll("\n", " ").trim();
    }
}
