package edu.campus.maintenance.assignment.dto;

import edu.campus.maintenance.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianSuggestionDto {
    private UserDto technician;
    private boolean skillMatch;
    private List<String> matchingSkills;
    private long activeAssignmentsCount;
    private int matchScore; // Higher is better
}
