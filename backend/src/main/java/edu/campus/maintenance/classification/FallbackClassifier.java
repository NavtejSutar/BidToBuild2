package edu.campus.maintenance.classification;

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
