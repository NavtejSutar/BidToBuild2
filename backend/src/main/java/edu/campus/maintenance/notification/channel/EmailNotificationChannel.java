package edu.campus.maintenance.notification.channel;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EmailNotificationChannel implements NotificationChannel {

    @Override
    public String getChannelName() {
        return "EMAIL";
    }

    @Override
    public void sendNotification(User recipient, String type, String message, Complaint complaint) {
        // Log email notification (can be wired with JavaMailSender if SMTP server is active)
        log.info("[EMAIL DISPATCH] To: {} | Subject: [{}] Campus Maintenance Notification | Body: {}",
                recipient.getEmail(), type, message);
    }
}
