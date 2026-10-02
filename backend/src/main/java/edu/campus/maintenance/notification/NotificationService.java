package edu.campus.maintenance.notification;

import edu.campus.maintenance.common.dto.PageResponse;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import edu.campus.maintenance.common.exceptions.UnauthorizedException;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.notification.channel.NotificationChannel;
import edu.campus.maintenance.notification.dto.NotificationDto;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import edu.campus.maintenance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final List<NotificationChannel> channels;

    @Transactional
    public void notifyAdmins(String type, String message, Complaint complaint) {
        List<User> admins = userRepository.findByRoleAndActiveTrue(Role.ADMIN);
        for (User admin : admins) {
            for (NotificationChannel channel : channels) {
                try {
                    channel.sendNotification(admin, type, message, complaint);
                } catch (Exception e) {
                    log.error("Failed to dispatch notification via channel {}", channel.getChannelName(), e);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getUserNotifications(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));

        return PageResponse.from(notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(NotificationDto::from));
    }

    @Transactional
    public NotificationDto markAsRead(Long id, String userEmail) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You cannot mark another user's notification as read.");
        }

        notification.setReadAt(Instant.now());
        notification = notificationRepository.save(notification);
        return NotificationDto.from(notification);
    }
}
