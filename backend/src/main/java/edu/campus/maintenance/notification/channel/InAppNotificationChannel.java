package edu.campus.maintenance.notification.channel;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.notification.Notification;
import edu.campus.maintenance.notification.NotificationRepository;
import edu.campus.maintenance.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InAppNotificationChannel implements NotificationChannel {

    private final NotificationRepository notificationRepository;

    @Override
    public String getChannelName() {
        return "IN_APP";
    }

    @Override
    public void sendNotification(User recipient, String type, String message, Complaint complaint) {
        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .complaint(complaint)
                .message(message)
                .build();
        notificationRepository.save(notification);
        log.debug("Saved in-app notification for user {}: {}", recipient.getEmail(), message);
    }
}
