package edu.campus.maintenance.classification.dto;

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
