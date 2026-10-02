package edu.campus.maintenance.classification;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.campus.maintenance.classification.dto.ClassificationResult;
import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Urgency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GroqResponseParserTest {

    private GroqClient groqClient;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        groqClient = new GroqClient(new GroqProperties(), null, objectMapper);
    }

    @Test
    @DisplayName("Should parse valid JSON matching expected schema")
    void parse_validJson() throws Exception {
        String json = """
                {
                  "category": "PLUMBING",
                  "urgency": "HIGH",
                  "tags": ["pipe leak", "water flood"],
                  "reasoning": "Major pipe burst causing flooding in basement.",
                  "confidence": 0.95
                }
                """;

        ClassificationResult result = groqClient.parseAndValidateJson(json);

        assertNotNull(result);
        assertEquals(Category.PLUMBING, result.getCategory());
        assertEquals(Urgency.HIGH, result.getUrgency());
        assertEquals(2, result.getTags().size());
        assertEquals(0.95, result.getConfidence());
        assertTrue(result.getReasoning().contains("pipe burst"));
    }

    @Test
    @DisplayName("Should handle unknown category and urgency by falling back to safe defaults")
    void parse_unknownEnums_safeDefaults() throws Exception {
        String json = """
                {
                  "category": "ALIEN_INVASION",
                  "urgency": "SUPER_MAX",
                  "tags": ["unknown"],
                  "reasoning": "Unrecognized category test."
                }
                """;

        ClassificationResult result = groqClient.parseAndValidateJson(json);

        assertNotNull(result);
        assertEquals(Category.OTHER, result.getCategory());
        assertEquals(Urgency.LOW, result.getUrgency());
    }
}
