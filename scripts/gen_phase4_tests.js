const fs = require('fs');
const path = require('path');

function writeTestFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'test', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote Test: ' + relPath);
}

writeTestFile('classification/FallbackClassifierTest.java', `package edu.campus.maintenance.classification;

import edu.campus.maintenance.classification.dto.ClassificationResult;
import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Urgency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FallbackClassifierTest {

    private FallbackClassifier fallbackClassifier;

    @BeforeEach
    void setUp() {
        fallbackClassifier = new FallbackClassifier();
    }

    @Test
    @DisplayName("Should classify live wire as ELECTRICAL and CRITICAL")
    void classify_electricalCritical() {
        ClassificationResult result = fallbackClassifier.classify(
                "Sparking socket in lab",
                "Live wire is exposed and sparks are flying near student desks"
        );

        assertEquals(Category.ELECTRICAL, result.getCategory());
        assertEquals(Urgency.CRITICAL, result.getUrgency());
        assertFalse(result.getTags().isEmpty());
        assertTrue(result.getReasoning().contains("ELECTRICAL"));
    }

    @Test
    @DisplayName("Should classify pipe leakage as PLUMBING")
    void classify_plumbingLeak() {
        ClassificationResult result = fallbackClassifier.classify(
                "Water tap leaking",
                "Sink faucet is dripping continuously in floor 2 washroom"
        );

        assertEquals(Category.PLUMBING, result.getCategory());
        assertTrue(result.getUrgency() == Urgency.LOW || result.getUrgency() == Urgency.MEDIUM);
    }

    @Test
    @DisplayName("Should classify AC cooling issues as HVAC")
    void classify_hvac() {
        ClassificationResult result = fallbackClassifier.classify(
                "AC not cooling",
                "Air conditioning unit in computer lab 204 is making noise and not cooling"
        );

        assertEquals(Category.HVAC, result.getCategory());
    }

    @Test
    @DisplayName("Should classify wifi and router issues as IT")
    void classify_it() {
        ClassificationResult result = fallbackClassifier.classify(
                "Wifi not connecting",
                "Ethernet router and internet network down in engineering block"
        );

        assertEquals(Category.IT, result.getCategory());
    }

    @Test
    @DisplayName("Should classify broken desks and chairs as FURNITURE")
    void classify_furniture() {
        ClassificationResult result = fallbackClassifier.classify(
                "Broken chair leg",
                "Study table drawer is stuck and wooden chair is damaged"
        );

        assertEquals(Category.FURNITURE, result.getCategory());
    }

    @Test
    @DisplayName("Should fallback to OTHER when no keywords match")
    void classify_other() {
        ClassificationResult result = fallbackClassifier.classify(
                "Random generic issue",
                "Something strange happened here"
        );

        assertEquals(Category.OTHER, result.getCategory());
        assertEquals(Urgency.LOW, result.getUrgency());
    }
}
`);

writeTestFile('classification/GroqResponseParserTest.java', `package edu.campus.maintenance.classification;

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
`);

console.log('Phase 4 unit tests written.');