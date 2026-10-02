package edu.campus.maintenance.assignment.dto;

import edu.campus.maintenance.assignment.Assignment;
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
public class AssignmentDto {
    private Long id;
    private Long complaintId;
    private UserDto technician;
    private UserDto assignedBy;
    private Instant assignedAt;
    private Instant unassignedAt;
    private boolean active;
    private String note;

    public static AssignmentDto from(Assignment a) {
        if (a == null) return null;
        return AssignmentDto.builder()
                .id(a.getId())
                .complaintId(a.getComplaint().getId())
                .technician(UserDto.from(a.getTechnician()))
                .assignedBy(UserDto.from(a.getAssignedBy()))
                .assignedAt(a.getAssignedAt())
                .unassignedAt(a.getUnassignedAt())
                .active(a.isActive())
                .note(a.getNote())
                .build();
    }
}
