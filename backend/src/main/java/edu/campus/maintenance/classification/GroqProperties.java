package edu.campus.maintenance.classification;

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
