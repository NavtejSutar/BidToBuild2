package edu.campus.maintenance.priority;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "app.priority")
public class PriorityProperties {
    private Map<String, Integer> urgencyBase = Map.of(
            "low", 10,
            "medium", 30,
            "high", 55,
            "critical", 80
    );
    private int agingDivisor = 6;
    private int maxAgingBonus = 20;
    private int recurrenceMultiplier = 5;
    private int maxRecurrenceBonus = 15;
}
