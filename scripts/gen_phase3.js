const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. Storage
writeFile('storage/FileStorageService.java', `package edu.campus.maintenance.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(MultipartFile file);
    Resource loadFileAsResource(String filename);
    void deleteFile(String filename);
}
`);

writeFile('storage/LocalStorageServiceImpl.java', `package edu.campus.maintenance.storage;

import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;

@Slf4j
@Service
public class LocalStorageServiceImpl implements FileStorageService {

    private final Path fileStorageLocation;
    private final long maxSizeBytes;

    public LocalStorageServiceImpl(
            @Value("\${app.storage.upload-dir:uploads}") String uploadDir,
            @Value("\${app.storage.max-file-size-bytes:10485760}") long maxSizeBytes) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxSizeBytes = maxSizeBytes;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Initialized file storage at {}", this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > maxSizeBytes) {
            throw new BadRequestException("File size exceeds maximum allowable limit of " + (maxSizeBytes / (1024 * 1024)) + "MB");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");
        String extension = getFileExtension(originalFilename);

        validateMagicBytes(file, extension);

        String uniqueFilename = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }
            return uniqueFilename;
        } catch (IOException ex) {
            log.error("Could not store file {}", uniqueFilename, ex);
            throw new RuntimeException("Could not store file. Please try again.", ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String filename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found: " + filename);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found: " + filename);
        }
    }

    @Override
    public void deleteFile(String filename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.warn("Failed to delete file: {}", filename);
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex + 1).toLowerCase();
    }

    private void validateMagicBytes(MultipartFile file, String extension) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[12];
            int read = is.read(header);
            if (read < 4) {
                throw new BadRequestException("Invalid file format");
            }

            // JPEG: FF D8 FF
            boolean isJpeg = (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
            // PNG: 89 50 4E 47
            boolean isPng = (header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50 && (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47;
            // WEBP: RIFF....WEBP (header[0..3] == "RIFF", header[8..11] == "WEBP")
            boolean isWebp = read >= 12 &&
                    header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F' &&
                    header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            // GIF: GIF8
            boolean isGif = header[0] == 'G' && header[1] == 'I' && header[2] == 'F' && header[3] == '8';

            if (!isJpeg && !isPng && !isWebp && !isGif) {
                throw new BadRequestException("Uploaded file is not a supported image (JPEG, PNG, WEBP, GIF allowed)");
            }
        } catch (IOException e) {
            throw new BadRequestException("Could not read file header for verification");
        }
    }
}
`);

// 2. Complaint Enums
writeFile('complaint/Category.java', `package edu.campus.maintenance.complaint;

public enum Category {
    ELECTRICAL,
    PLUMBING,
    IT,
    HVAC,
    CIVIL,
    FURNITURE,
    CLEANING,
    SAFETY,
    OTHER
}
`);

writeFile('complaint/Urgency.java', `package edu.campus.maintenance.complaint;

public enum Urgency {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
`);

writeFile('complaint/ComplaintStatus.java', `package edu.campus.maintenance.complaint;

public enum ComplaintStatus {
    REPORTED,
    ASSIGNED,
    IN_PROGRESS,
    RESOLVED
}
`);

writeFile('complaint/ClassificationStatus.java', `package edu.campus.maintenance.complaint;

public enum ClassificationStatus {
    PENDING,
    COMPLETED,
    FAILED
}
`);

writeFile('complaint/ClassificationSource.java', `package edu.campus.maintenance.complaint;

public enum ClassificationSource {
    GROQ,
    FALLBACK
}
`);

writeFile('complaint/PriorityLevel.java', `package edu.campus.maintenance.complaint;

public enum PriorityLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
`);

// 3. Complaint Entities
writeFile('complaint/Complaint.java', `package edu.campus.maintenance.complaint;

import edu.campus.maintenance.location.Location;
import edu.campus.maintenance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "complaints")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Urgency urgency;

    @Column(name = "tags", columnDefinition = "JSON")
    private String tagsJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification_status", nullable = false, length = 50)
    @Builder.Default
    private ClassificationStatus classificationStatus = ClassificationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification_source", length = 50)
    private ClassificationSource classificationSource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.REPORTED;

    @Column(name = "priority_score", nullable = false)
    @Builder.Default
    private int priorityScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", nullable = false, length = 50)
    @Builder.Default
    private PriorityLevel priorityLevel = PriorityLevel.LOW;

    @Column(name = "priority_breakdown", columnDefinition = "JSON")
    private String priorityBreakdownJson;

    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private boolean isRecurring = false;

    @Column(name = "recurrence_index", nullable = false)
    @Builder.Default
    private int recurrenceIndex = 0;

    @Column(name = "escalation_level", nullable = false)
    @Builder.Default
    private int escalationLevel = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;
}
`);

writeFile('assignment/Assignment.java', `package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;

    @Column(name = "unassigned_at")
    private Instant unassignedAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String note;
}
`);

writeFile('history/ComplaintHistory.java', `package edu.campus.maintenance.history;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "complaint_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 50)
    private ComplaintStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 50)
    private ComplaintStatus toStatus;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(columnDefinition = "JSON")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
`);

// 4. Repositories
writeFile('complaint/ComplaintRepository.java', `package edu.campus.maintenance.complaint;

import edu.campus.maintenance.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    Page<Complaint> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.status != 'RESOLVED'")
    List<Complaint> findUnresolvedComplaints();

    @Query("SELECT c FROM Complaint c WHERE c.status != 'RESOLVED' AND c.priorityLevel = 'CRITICAL' AND c.status = 'REPORTED' AND c.createdAt <= :thresholdTime")
    List<Complaint> findUnassignedCriticalOlderThan(@Param("thresholdTime") Instant thresholdTime);

    @Query("SELECT c FROM Complaint c WHERE c.status != 'RESOLVED' AND c.createdAt <= :slaDeadline AND c.escalationLevel = 0")
    List<Complaint> findUnresolvedBreachedSla(@Param("slaDeadline") Instant slaDeadline);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.location.id = :locationId AND c.category = :category AND c.id != :excludeId AND c.createdAt >= :since")
    int countRecurringComplaints(
            @Param("locationId") Long locationId,
            @Param("category") Category category,
            @Param("excludeId") Long excludeId,
            @Param("since") Instant since);

    List<Complaint> findByClassificationStatusIn(List<ClassificationStatus> statuses);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status != 'RESOLVED'")
    long countOpenComplaints();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status != 'RESOLVED' AND c.priorityLevel = 'CRITICAL'")
    long countCriticalOpenComplaints();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = 'REPORTED'")
    long countUnassignedComplaints();
}
`);

writeFile('assignment/AssignmentRepository.java', `package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    Optional<Assignment> findByComplaintAndActiveTrue(Complaint complaint);

    List<Assignment> findByTechnicianAndActiveTrueOrderByAssignedAtDesc(User technician);

    List<Assignment> findByComplaintOrderByAssignedAtDesc(Complaint complaint);

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.technician.id = :techId AND a.active = true")
    long countActiveAssignmentsByTechnician(@Param("techId") Long techId);
}
`);

writeFile('history/ComplaintHistoryRepository.java', `package edu.campus.maintenance.history;

import edu.campus.maintenance.complaint.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintHistoryRepository extends JpaRepository<ComplaintHistory, Long> {
    List<ComplaintHistory> findByComplaintOrderByCreatedAtDesc(Complaint complaint);
}
`);

// 5. Workflow State Machine
writeFile('workflow/WorkflowService.java', `package edu.campus.maintenance.workflow;

import edu.campus.maintenance.common.exceptions.InvalidTransitionException;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.history.ComplaintHistory;
import edu.campus.maintenance.history.ComplaintHistoryRepository;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final ComplaintHistoryRepository historyRepository;

    @Transactional
    public void transition(Complaint complaint, ComplaintStatus targetStatus, User actor, String note) {
        ComplaintStatus currentStatus = complaint.getStatus();

        // Check if transition is allowed
        validateTransition(currentStatus, targetStatus, actor);

        log.info("Transitioning complaint {} from {} to {} by actor {}",
                complaint.getId(), currentStatus, targetStatus, actor.getEmail());

        complaint.setStatus(targetStatus);
        if (targetStatus == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(Instant.now());
        }

        // Record history entry in same transaction
        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .actor(actor)
                .eventType("STATUS_CHANGE")
                .fromStatus(currentStatus)
                .toStatus(targetStatus)
                .note(note)
                .build();

        historyRepository.save(history);
    }

    public void validateTransition(ComplaintStatus from, ComplaintStatus to, User actor) {
        if (from == ComplaintStatus.RESOLVED) {
            throw new InvalidTransitionException("Resolved complaints are immutable and cannot be transitioned.");
        }

        boolean isAdmin = actor.getRole() == Role.ADMIN;
        boolean isTechnician = actor.getRole() == Role.TECHNICIAN;

        // Allowed transitions:
        // 1. REPORTED -> ASSIGNED (admin)
        if (from == ComplaintStatus.REPORTED && to == ComplaintStatus.ASSIGNED) {
            if (!isAdmin) {
                throw new InvalidTransitionException("Only administrators can transition complaints from REPORTED to ASSIGNED.");
            }
            return;
        }

        // 2. ASSIGNED -> IN_PROGRESS (assigned technician)
        if (from == ComplaintStatus.ASSIGNED && to == ComplaintStatus.IN_PROGRESS) {
            if (!isTechnician && !isAdmin) {
                throw new InvalidTransitionException("Only technicians can start progress on assigned complaints.");
            }
            return;
        }

        // 3. IN_PROGRESS -> RESOLVED (assigned technician or admin)
        if (from == ComplaintStatus.IN_PROGRESS && to == ComplaintStatus.RESOLVED) {
            if (!isTechnician && !isAdmin) {
                throw new InvalidTransitionException("Only assigned technicians or administrators can resolve complaints.");
            }
            return;
        }

        // 4. ASSIGNED -> ASSIGNED (reassignment by admin)
        if (from == ComplaintStatus.ASSIGNED && to == ComplaintStatus.ASSIGNED) {
            if (!isAdmin) {
                throw new InvalidTransitionException("Only administrators can reassign complaints.");
            }
            return;
        }

        throw new InvalidTransitionException("Invalid state transition from " + from + " to " + to);
    }
}
`);

// 6. SSE Event Service
writeFile('complaint/ComplaintEventService.java', `package edu.campus.maintenance.complaint;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class ComplaintEventService {

    private final Map<Long, List<SseEmitter>> emitterMap = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long complaintId) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout
        List<SseEmitter> emitters = emitterMap.computeIfAbsent(complaintId, k -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);

        emitter.onCompletion(() -> removeEmitter(complaintId, emitter));
        emitter.onTimeout(() -> removeEmitter(complaintId, emitter));
        emitter.onError(e -> removeEmitter(complaintId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected to complaint updates for ID: " + complaintId));
        } catch (IOException e) {
            removeEmitter(complaintId, emitter);
        }

        return emitter;
    }

    public void broadcastStatusUpdate(Long complaintId, Object updateData) {
        List<SseEmitter> emitters = emitterMap.get(complaintId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("STATUS_UPDATE")
                        .data(updateData));
            } catch (IOException e) {
                removeEmitter(complaintId, emitter);
            }
        }
    }

    private void removeEmitter(Long complaintId, SseEmitter emitter) {
        List<SseEmitter> emitters = emitterMap.get(complaintId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emitterMap.remove(complaintId);
            }
        }
    }

    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        emitterMap.forEach((complaintId, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (IOException e) {
                    removeEmitter(complaintId, emitter);
                }
            }
        });
    }
}
`);

console.log('Phase 3 foundational domain and workflow generated.');