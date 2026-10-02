const fs = require('fs');
const path = require('path');

function getPath(rel) {
    return path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', rel);
}

// 1. Complaint.java -> add suggestedCategory field
const complaintPath = getPath('complaint/Complaint.java');
let complaintContent = fs.readFileSync(complaintPath, 'utf8');
if (!complaintContent.includes('suggestedCategory')) {
    complaintContent = complaintContent.replace(
        '@Enumerated(EnumType.STRING)\n    @Column(length = 50)\n    private Category category;',
        `@Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "suggested_category", length = 50)
    private Category suggestedCategory;`
    );
    fs.writeFileSync(complaintPath, complaintContent, 'utf8');
    console.log('Updated Complaint.java with suggestedCategory');
}

// 2. ComplaintDto.java -> add suggestedCategory field
const dtoPath = getPath('complaint/dto/ComplaintDto.java');
let dtoContent = fs.readFileSync(dtoPath, 'utf8');
if (!dtoContent.includes('suggestedCategory')) {
    dtoContent = dtoContent.replace(
        'private Category category;',
        'private Category category;\n    private Category suggestedCategory;'
    );
    dtoContent = dtoContent.replace(
        '.category(c.getCategory())',
        '.category(c.getCategory())\n                .suggestedCategory(c.getSuggestedCategory())'
    );
    fs.writeFileSync(dtoPath, dtoContent, 'utf8');
    console.log('Updated ComplaintDto.java with suggestedCategory');
}

// 3. CreateComplaintRequest.java -> add mandatory category
const reqPath = getPath('complaint/dto/CreateComplaintRequest.java');
let reqContent = `package edu.campus.maintenance.complaint.dto;

import edu.campus.maintenance.complaint.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateComplaintRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Location ID is required")
    private Long locationId;

    @NotNull(message = "Category is required")
    private Category category;
}
`;
fs.writeFileSync(reqPath, reqContent, 'utf8');
console.log('Updated CreateComplaintRequest.java with mandatory category');

// 4. FallbackClassifier.java -> add synchronous checkImmediateUrgency loading from critical-keywords.txt
const fbPath = getPath('classification/FallbackClassifier.java');
let fbContent = `package edu.campus.maintenance.classification;

import edu.campus.maintenance.classification.dto.ClassificationResult;
import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Urgency;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component
public class FallbackClassifier {

    private final List<String> criticalKeywords = new ArrayList<>();

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("critical-keywords.txt");
            if (resource.exists()) {
                String text = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
                Arrays.stream(text.split("\\r?\\n"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && !s.startsWith("#"))
                        .forEach(s -> criticalKeywords.add(s.toLowerCase(Locale.ROOT)));
                log.info("Loaded {} critical keywords from critical-keywords.txt: {}", criticalKeywords.size(), criticalKeywords);
            }
        } catch (IOException e) {
            log.warn("Could not load critical-keywords.txt, using built-in defaults", e);
        }

        if (criticalKeywords.isEmpty()) {
            criticalKeywords.addAll(List.of("sparking", "exposed wire", "short circuit", "flooding", "fire", "gas leak", "live wire", "danger to life"));
        }
    }

    public boolean isImmediateCritical(String title, String description) {
        String text = (title + " " + (description != null ? description : "")).toLowerCase(Locale.ROOT);
        for (String kw : criticalKeywords) {
            if (text.contains(kw)) {
                log.warn("Immediate critical keyword match found: '{}'", kw);
                return true;
            }
        }
        return false;
    }

    public ClassificationResult classify(String title, String description) {
        String text = (title + " " + description).toLowerCase(Locale.ROOT);

        Category category = determineCategory(text);
        Urgency urgency = isImmediateCritical(title, description) ? Urgency.CRITICAL : determineUrgency(text);
        List<String> tags = generateTags(text, category);

        String reasoning = "Deterministic keyword classifier identified category " + category + " and urgency " + urgency + ".";

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
        if (text.contains("power") || text.contains("light") || text.contains("wire")) tags.add("power issue");
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
`;
fs.writeFileSync(fbPath, fbContent, 'utf8');
console.log('Updated FallbackClassifier.java with synchronous critical keyword detection');

// 5. ClassificationService.java -> preserve CRITICAL urgency, set suggestedCategory
const clsPath = getPath('classification/ClassificationService.java');
let clsContent = fs.readFileSync(clsPath, 'utf8');
clsContent = clsContent.replace(
    'complaint.setCategory(result.getCategory());\n        complaint.setUrgency(result.getUrgency());',
    `// PS-07 rule: Groq may suggest a different category, stored as suggested_category. User's category remains authoritative.
        complaint.setSuggestedCategory(result.getCategory());

        // PS-07 rule: Groq must NEVER lower a keyword-triggered CRITICAL urgency
        if (complaint.getUrgency() != Urgency.CRITICAL) {
            complaint.setUrgency(result.getUrgency());
        }`
);
fs.writeFileSync(clsPath, clsContent, 'utf8');
console.log('Updated ClassificationService.java with PS-07 suggestedCategory and critical preservation rule');

console.log('PS-07 backend adjustments applied successfully.');