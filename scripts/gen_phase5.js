const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. Priority
writeFile('priority/PriorityProperties.java', `package edu.campus.maintenance.priority;

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
`);

writeFile('priority/dto/PriorityCalculationResult.java', `package edu.campus.maintenance.priority.dto;

import edu.campus.maintenance.complaint.PriorityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityCalculationResult {
    private int score;
    private PriorityLevel level;
    private int urgencyBase;
    private int agingBonus;
    private int recurrenceBonus;
    private long hoursOpen;
    private int recurrenceIndex;

    public String toJson() {
        return """
               {"score":%d,"level":"%s","urgencyBase":%d,"agingBonus":%d,"recurrenceBonus":%d,"hoursOpen":%d,"recurrenceIndex":%d}
               """.formatted(score, level.name(), urgencyBase, agingBonus, recurrenceBonus, hoursOpen, recurrenceIndex).trim();
    }
}
`);

writeFile('priority/PriorityScoringService.java', `package edu.campus.maintenance.priority;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.complaint.PriorityLevel;
import edu.campus.maintenance.complaint.Urgency;
import edu.campus.maintenance.priority.dto.PriorityCalculationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriorityScoringService {

    private final PriorityProperties properties;

    public PriorityCalculationResult calculateScore(
            Urgency urgency,
            ComplaintStatus status,
            Instant createdAt,
            int recurrenceIndex,
            Instant now) {

        int urgencyBase = getUrgencyBase(urgency);

        // Aging bonus: min(20, hoursOpen / 6) only while status != RESOLVED
        long hoursOpen = 0;
        int agingBonus = 0;
        if (status != ComplaintStatus.RESOLVED && createdAt != null) {
            hoursOpen = Math.max(0, Duration.between(createdAt, now).toHours());
            agingBonus = (int) Math.min(properties.getMaxAgingBonus(), hoursOpen / properties.getAgingDivisor());
        }

        // Recurrence bonus: min(15, recurrenceIndex * 5)
        int recurrenceBonus = Math.min(
                properties.getMaxRecurrenceBonus(),
                Math.max(0, recurrenceIndex * properties.getRecurrenceMultiplier())
        );

        int totalScore = Math.min(100, urgencyBase + agingBonus + recurrenceBonus);
        PriorityLevel level = determineLevel(totalScore);

        return PriorityCalculationResult.builder()
                .score(totalScore)
                .level(level)
                .urgencyBase(urgencyBase)
                .agingBonus(agingBonus)
                .recurrenceBonus(recurrenceBonus)
                .hoursOpen(hoursOpen)
                .recurrenceIndex(recurrenceIndex)
                .build();
    }

    public void recalculateAndApply(Complaint complaint, Instant now) {
        PriorityCalculationResult result = calculateScore(
                complaint.getUrgency(),
                complaint.getStatus(),
                complaint.getCreatedAt(),
                complaint.getRecurrenceIndex(),
                now
        );

        complaint.setPriorityScore(result.getScore());
        complaint.setPriorityLevel(result.getLevel());
        complaint.setPriorityBreakdownJson(result.toJson());
    }

    private int getUrgencyBase(Urgency urgency) {
        if (urgency == null) return properties.getUrgencyBase().getOrDefault("low", 10);
        return properties.getUrgencyBase().getOrDefault(urgency.name().toLowerCase(Locale.ROOT), 10);
    }

    public static PriorityLevel determineLevel(int score) {
        if (score >= 75) return PriorityLevel.CRITICAL;
        if (score >= 50) return PriorityLevel.HIGH;
        if (score >= 25) return PriorityLevel.MEDIUM;
        return PriorityLevel.LOW;
    }
}
`);

// 2. Recurrence
writeFile('recurrence/RecurrenceIndex.java', `package edu.campus.maintenance.recurrence;

import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.location.Location;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "recurrence_index", uniqueConstraints = {
    @UniqueConstraint(name = "uk_recurrence_loc_cat", columnNames = {"location_id", "category"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurrenceIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Category category;

    @Column(name = "count_7d", nullable = false)
    @Builder.Default
    private int count7d = 0;

    @Column(name = "count_30d", nullable = false)
    @Builder.Default
    private int count30d = 0;

    @Column(name = "count_90d", nullable = false)
    @Builder.Default
    private int count90d = 0;

    @Column(name = "first_seen")
    private Instant firstSeen;

    @Column(name = "last_seen")
    private Instant lastSeen;

    @Column(length = 50)
    @Builder.Default
    private String trend = "STABLE";

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
`);

writeFile('recurrence/RecurrenceIndexRepository.java', `package edu.campus.maintenance.recurrence;

import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.location.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecurrenceIndexRepository extends JpaRepository<RecurrenceIndex, Long> {
    Optional<RecurrenceIndex> findByLocationAndCategory(Location location, Category category);

    @Query("SELECT r FROM RecurrenceIndex r WHERE r.count30d >= 2 ORDER BY r.count30d DESC")
    List<RecurrenceIndex> findTopRecurringIssues();
}
`);

writeFile('recurrence/RecurrenceService.java', `package edu.campus.maintenance.recurrence;

import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.location.Location;
import edu.campus.maintenance.location.LocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecurrenceService {

    private final ComplaintRepository complaintRepository;
    private final RecurrenceIndexRepository recurrenceIndexRepository;
    private final LocationRepository locationRepository;

    @Value("\${app.recurrence.window-days:30}")
    private int windowDays = 30;

    @Value("\${app.recurrence.threshold:2}")
    private int recurringThreshold = 2;

    @Transactional
    public void evaluateRecurrenceForComplaint(Complaint complaint) {
        if (complaint.getLocation() == null || complaint.getCategory() == null) {
            return;
        }

        Location location = complaint.getLocation();
        Category category = complaint.getCategory();
        Instant now = Instant.now();
        Instant windowStart = now.minus(windowDays, ChronoUnit.DAYS);

        // Count other complaints in window for same location and category
        int recurrenceIndex = complaintRepository.countRecurringComplaints(
                location.getId(), category, complaint.getId(), windowStart);

        complaint.setRecurrenceIndex(recurrenceIndex);
        complaint.setRecurring(recurrenceIndex >= recurringThreshold);

        log.info("Complaint ID {}: recurrenceIndex={}, isRecurring={}",
                complaint.getId(), recurrenceIndex, complaint.isRecurring());

        // Update recurrence_index rolling table incrementally
        updateRecurrenceIndexRow(location, category, now);
    }

    @Transactional
    public void updateRecurrenceIndexRow(Location location, Category category, Instant now) {
        RecurrenceIndex record = recurrenceIndexRepository.findByLocationAndCategory(location, category)
                .orElse(RecurrenceIndex.builder()
                        .location(location)
                        .category(category)
                        .firstSeen(now)
                        .build());

        int count7d = complaintRepository.countRecurringComplaints(location.getId(), category, -1L, now.minus(7, ChronoUnit.DAYS));
        int count30d = complaintRepository.countRecurringComplaints(location.getId(), category, -1L, now.minus(30, ChronoUnit.DAYS));
        int count90d = complaintRepository.countRecurringComplaints(location.getId(), category, -1L, now.minus(90, ChronoUnit.DAYS));

        // Trend calculation
        String trend = "STABLE";
        if (count7d * 4 > count30d + 1) {
            trend = "RISING";
        } else if (count7d * 4 < count30d - 1) {
            trend = "FALLING";
        }

        record.setCount7d(count7d);
        record.setCount30d(count30d);
        record.setCount90d(count90d);
        record.setLastSeen(now);
        record.setTrend(trend);

        recurrenceIndexRepository.save(record);
    }

    @Transactional
    public void rebuildAllRecurrenceIndexes() {
        log.info("Starting nightly full rebuild of recurrence_index table...");
        Instant now = Instant.now();

        List<Location> locations = locationRepository.findAll();
        for (Location loc : locations) {
            for (Category cat : Category.values()) {
                int count90d = complaintRepository.countRecurringComplaints(loc.getId(), cat, -1L, now.minus(90, ChronoUnit.DAYS));
                if (count90d > 0) {
                    updateRecurrenceIndexRow(loc, cat, now);
                }
            }
        }
        log.info("Nightly recurrence_index table rebuild completed.");
    }
}
`);

// 3. Notification & Escalation
writeFile('notification/Notification.java', `package edu.campus.maintenance.notification;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private Complaint complaint;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "read_at")
    private Instant readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
`);

writeFile('notification/NotificationRepository.java', `package edu.campus.maintenance.notification;

import edu.campus.maintenance.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    List<Notification> findByUserAndReadAtIsNullOrderByCreatedAtDesc(User user);
    long countByUserAndReadAtIsNull(User user);
}
`);

writeFile('notification/dto/NotificationDto.java', `package edu.campus.maintenance.notification.dto;

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
`);

writeFile('notification/channel/NotificationChannel.java', `package edu.campus.maintenance.notification.channel;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.user.User;

public interface NotificationChannel {
    String getChannelName();
    void sendNotification(User recipient, String type, String message, Complaint complaint);
}
`);

writeFile('notification/channel/InAppNotificationChannel.java', `package edu.campus.maintenance.notification.channel;

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
`);

writeFile('notification/channel/EmailNotificationChannel.java', `package edu.campus.maintenance.notification.channel;

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
`);

writeFile('notification/NotificationService.java', `package edu.campus.maintenance.notification;

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
`);

writeFile('notification/NotificationController.java', `package edu.campus.maintenance.notification;

import edu.campus.maintenance.common.dto.ApiResponse;
import edu.campus.maintenance.common.dto.PageResponse;
import edu.campus.maintenance.notification.dto.NotificationDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications and alerts")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get current user notifications")
    public ResponseEntity<ApiResponse<PageResponse<NotificationDto>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUserNotifications(userDetails.getUsername(), pageable)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read",
                notificationService.markAsRead(id, userDetails.getUsername())));
    }
}
`);

// 4. EscalationService
writeFile('escalation/EscalationService.java', `package edu.campus.maintenance.escalation;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.complaint.PriorityLevel;
import edu.campus.maintenance.history.ComplaintHistory;
import edu.campus.maintenance.history.ComplaintHistoryRepository;
import edu.campus.maintenance.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EscalationService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository historyRepository;
    private final NotificationService notificationService;

    @Value("\${app.escalation.critical-unassigned-minutes:30}")
    private int criticalUnassignedMinutes = 30;

    @Transactional
    public void runEscalationChecks() {
        Instant now = Instant.now();
        log.debug("Running SLA and escalation checks at {}", now);

        // 1. Unassigned CRITICAL check: if not ASSIGNED within 30m, notify admins (escalationLevel == 0)
        checkUnassignedCritical(now);

        // 2. SLA breach check by priority level:
        // CRITICAL 4h, HIGH 24h, MEDIUM 72h, LOW 168h (7d)
        checkSlaBreaches(now);
    }

    private void checkUnassignedCritical(Instant now) {
        Instant threshold = now.minus(Duration.ofMinutes(criticalUnassignedMinutes));
        List<Complaint> unassignedCritical = complaintRepository.findUnassignedCriticalOlderThan(threshold);

        for (Complaint complaint : unassignedCritical) {
            if (complaint.getEscalationLevel() == 0) {
                log.warn("Escalating unassigned CRITICAL complaint ID: {}", complaint.getId());
                complaint.setEscalationLevel(1);
                complaintRepository.save(complaint);

                recordHistory(complaint, "ESCALATION_UNASSIGNED",
                        "CRITICAL complaint remained unassigned for over " + criticalUnassignedMinutes + " minutes.");

                notificationService.notifyAdmins(
                        "CRITICAL_UNASSIGNED",
                        "CRITICAL Complaint #" + complaint.getId() + " (" + complaint.getTitle() + ") is unassigned after " + criticalUnassignedMinutes + " minutes!",
                        complaint
                );
            }
        }
    }

    private void checkSlaBreaches(Instant now) {
        List<Complaint> openComplaints = complaintRepository.findUnresolvedComplaints();

        for (Complaint complaint : openComplaints) {
            long hoursOpen = Duration.between(complaint.getCreatedAt(), now).toHours();
            long maxSlaHours = getSlaHours(complaint.getPriorityLevel());

            if (hoursOpen >= maxSlaHours && complaint.getEscalationLevel() < 2) {
                int newLevel = complaint.getEscalationLevel() + 1;
                log.warn("SLA breached for complaint ID: {} (Level: {}, Open: {}h, SLA: {}h)",
                        complaint.getId(), complaint.getPriorityLevel(), hoursOpen, maxSlaHours);

                complaint.setEscalationLevel(newLevel);
                complaintRepository.save(complaint);

                String msg = "SLA breached: Complaint has been open for " + hoursOpen + " hours (SLA: " + maxSlaHours + "h). Escalated to level " + newLevel + ".";
                recordHistory(complaint, "SLA_BREACH", msg);

                notificationService.notifyAdmins(
                        "SLA_BREACH",
                        "SLA Breached: Complaint #" + complaint.getId() + " (" + complaint.getTitle() + ") exceeded " + maxSlaHours + "h SLA window!",
                        complaint
                );
            }
        }
    }

    private long getSlaHours(PriorityLevel level) {
        if (level == null) return 72;
        return switch (level) {
            case CRITICAL -> 4;
            case HIGH -> 24;
            case MEDIUM -> 72;
            case LOW -> 168;
        };
    }

    private void recordHistory(Complaint complaint, String eventType, String note) {
        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .eventType(eventType)
                .note(note)
                .build();
        historyRepository.save(history);
    }
}
`);

// 5. Connect classification event to priority and recurrence
writeFile('complaint/ComplaintPostClassificationListener.java', `package edu.campus.maintenance.complaint;

import edu.campus.maintenance.classification.ComplaintClassifiedEvent;
import edu.campus.maintenance.priority.PriorityScoringService;
import edu.campus.maintenance.recurrence.RecurrenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class ComplaintPostClassificationListener {

    private final ComplaintRepository complaintRepository;
    private final RecurrenceService recurrenceService;
    private final PriorityScoringService priorityScoringService;
    private final ComplaintEventService eventService;

    @EventListener
    @Transactional
    public void onComplaintClassified(ComplaintClassifiedEvent event) {
        Complaint complaint = complaintRepository.findById(event.complaintId()).orElse(null);
        if (complaint == null) return;

        log.info("Processing post-classification priority scoring and recurrence for complaint {}", complaint.getId());

        // 1. Evaluate recurrence
        recurrenceService.evaluateRecurrenceForComplaint(complaint);

        // 2. Score priority
        priorityScoringService.recalculateAndApply(complaint, Instant.now());

        complaint = complaintRepository.save(complaint);

        // 3. Broadcast updated score and recurrence via SSE
        eventService.broadcastStatusUpdate(complaint.getId(), edu.campus.maintenance.complaint.dto.ComplaintDto.from(complaint));
    }
}
`);

console.log('Phase 5 Priority, Recurrence and Escalation generated.');