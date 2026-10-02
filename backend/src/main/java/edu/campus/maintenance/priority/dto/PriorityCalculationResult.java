package edu.campus.maintenance.priority.dto;

import edu.campus.maintenance.complaint.PriorityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityCalculationResult {
    private int score;
    private PriorityLevel level;
    private int urgencyBase;
    private int agingBonus;
    private int recurrenceBonus;
    private int reportBonus;
    private long hoursOpen;
    private int recurrenceIndex;

    public String toJson() {
        return """
               {"score":%d,"level":"%s","urgencyBase":%d,"agingBonus":%d,"recurrenceBonus":%d,"reportBonus":%d,"hoursOpen":%d,"recurrenceIndex":%d}
               """.formatted(score, level.name(), urgencyBase, agingBonus, recurrenceBonus, reportBonus, hoursOpen, recurrenceIndex).trim();
    }
}
