package edu.campus.maintenance.complaint.dto;

import edu.campus.maintenance.assignment.dto.AssignmentDto;
import edu.campus.maintenance.complaint.*;
import edu.campus.maintenance.location.dto.LocationDto;
import edu.campus.maintenance.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintDto {
    private Long id;
    private UserDto reporter;
    private LocationDto location;
    private String title;
    private String description;
    private String imagePath;
    private Category category;
    private Category suggestedCategory;
    private Urgency urgency;
    private String tagsJson;
    private ClassificationStatus classificationStatus;
    private ClassificationSource classificationSource;
    private ComplaintStatus status;
    private int priorityScore;
    private PriorityLevel priorityLevel;
    private String priorityBreakdownJson;
    private boolean isRecurring;
    private int recurrenceIndex;
    private int escalationLevel;
    private int reportCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;
    private AssignmentDto activeAssignment;

    public static ComplaintDto from(Complaint c) {
        if (c == null) return null;
        return ComplaintDto.builder()
                .id(c.getId())
                .reporter(UserDto.from(c.getReporter()))
                .location(LocationDto.from(c.getLocation()))
                .title(c.getTitle())
                .description(c.getDescription())
                .imagePath(c.getImagePath())
                .category(c.getCategory())
                .suggestedCategory(c.getSuggestedCategory())
                .urgency(c.getUrgency())
                .tagsJson(c.getTagsJson())
                .classificationStatus(c.getClassificationStatus())
                .classificationSource(c.getClassificationSource())
                .status(c.getStatus())
                .priorityScore(c.getPriorityScore())
                .priorityLevel(c.getPriorityLevel())
                .priorityBreakdownJson(c.getPriorityBreakdownJson())
                .isRecurring(c.isRecurring())
                .recurrenceIndex(c.getRecurrenceIndex())
                .escalationLevel(c.getEscalationLevel())
                .reportCount(c.getReportCount() > 0 ? c.getReportCount() : 1)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }
}
