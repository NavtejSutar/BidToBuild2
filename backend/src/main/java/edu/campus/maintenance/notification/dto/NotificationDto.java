package edu.campus.maintenance.notification.dto;

import edu.campus.maintenance.notification.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String type;
    private Long complaintId;
    private String message;
    private Instant readAt;
    private Instant createdAt;

    public static NotificationDto from(Notification n) {
        if (n == null) return null;
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .complaintId(n.getComplaint() != null ? n.getComplaint().getId() : null)
                .message(n.getMessage())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
