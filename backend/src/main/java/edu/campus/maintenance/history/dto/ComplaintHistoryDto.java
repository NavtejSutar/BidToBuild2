package edu.campus.maintenance.history.dto;

import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.history.ComplaintHistory;
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
public class ComplaintHistoryDto {
    private Long id;
    private Long complaintId;
    private UserDto actor;
    private String eventType;
    private ComplaintStatus fromStatus;
    private ComplaintStatus toStatus;
    private String note;
    private String metadata;
    private Instant createdAt;

    public static ComplaintHistoryDto from(ComplaintHistory h) {
        if (h == null) return null;
        return ComplaintHistoryDto.builder()
                .id(h.getId())
                .complaintId(h.getComplaint().getId())
                .actor(h.getActor() != null ? UserDto.from(h.getActor()) : null)
                .eventType(h.getEventType())
                .fromStatus(h.getFromStatus())
                .toStatus(h.getToStatus())
                .note(h.getNote())
                .metadata(h.getMetadata())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
