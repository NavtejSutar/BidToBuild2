package edu.campus.maintenance.notification.channel;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.user.User;

public interface NotificationChannel {
    String getChannelName();
    void sendNotification(User recipient, String type, String message, Complaint complaint);
}
