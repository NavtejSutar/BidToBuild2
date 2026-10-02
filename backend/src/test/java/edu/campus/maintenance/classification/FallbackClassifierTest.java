package edu.campus.maintenance.classification;

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
