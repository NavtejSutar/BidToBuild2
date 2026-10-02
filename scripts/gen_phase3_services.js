const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. TechnicianSkill entity & repo
writeFile('assignment/TechnicianSkillId.java', `package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Category;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianSkillId implements Serializable {
    private Long technicianId;
    private Category category;
}
`);

writeFile('assignment/TechnicianSkill.java', `package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Category;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "technician_skills")
@IdClass(TechnicianSkillId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianSkill {

    @Id
    @Column(name = "technician_id")
    private Long technicianId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Category category;
}
`);

writeFile('assignment/TechnicianSkillRepository.java', `package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianSkillRepository extends JpaRepository<TechnicianSkill, TechnicianSkillId> {
    List<TechnicianSkill> findByTechnicianId(Long technicianId);
    List<TechnicianSkill> findByCategory(Category category);
    boolean existsByTechnicianIdAndCategory(Long technicianId, Category category);
}
`);

// 2. DTOs
writeFile('assignment/dto/AssignmentDto.java', `package edu.campus.maintenance.assignment.dto;

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
`);

writeFile('assignment/dto/AssignComplaintRequest.java', `package edu.campus.maintenance.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignComplaintRequest {
    @NotNull(message = "Technician ID is required")
    private Long technicianId;
    private String note;
}
`);

writeFile('assignment/dto/TechnicianSuggestionDto.java', `package edu.campus.maintenance.assignment.dto;

import edu.campus.maintenance.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianSuggestionDto {
    private UserDto technician;
    private boolean skillMatch;
    private List<String> matchingSkills;
    private long activeAssignmentsCount;
    private int matchScore; // Higher is better
}
`);

writeFile('history/dto/ComplaintHistoryDto.java', `package edu.campus.maintenance.history.dto;

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
`);

writeFile('complaint/dto/ComplaintDto.java', `package edu.campus.maintenance.complaint.dto;

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
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }
}
`);

writeFile('complaint/dto/CreateComplaintRequest.java', `package edu.campus.maintenance.complaint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateComplaintRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Location ID is required")
    private Long locationId;
}
`);

writeFile('complaint/dto/UpdateComplaintStatusRequest.java', `package edu.campus.maintenance.complaint.dto;

import edu.campus.maintenance.complaint.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateComplaintStatusRequest {
    @NotNull(message = "Target status is required")
    private ComplaintStatus status;
    private String note;
}
`);

// 3. AssignmentService
writeFile('assignment/AssignmentService.java', `package edu.campus.maintenance.assignment;

import edu.campus.maintenance.assignment.dto.AssignComplaintRequest;
import edu.campus.maintenance.assignment.dto.AssignmentDto;
import edu.campus.maintenance.assignment.dto.TechnicianSuggestionDto;
import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintEventService;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import edu.campus.maintenance.user.UserRepository;
import edu.campus.maintenance.user.dto.UserDto;
import edu.campus.maintenance.workflow.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final TechnicianSkillRepository skillRepository;
    private final WorkflowService workflowService;
    private final ComplaintEventService eventService;

    @Transactional
    public AssignmentDto assignComplaint(Long complaintId, AssignComplaintRequest request, String adminEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + complaintId));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id: " + request.getTechnicianId()));

        if (technician.getRole() != Role.TECHNICIAN || !technician.isActive()) {
            throw new BadRequestException("Assigned user must be an active technician.");
        }

        // Close any currently active assignment (for reassignment)
        assignmentRepository.findByComplaintAndActiveTrue(complaint).ifPresent(prevAssignment -> {
            prevAssignment.setActive(false);
            prevAssignment.setUnassignedAt(Instant.now());
            assignmentRepository.save(prevAssignment);
        });

        // Trigger workflow transition (validates allowed state transition)
        workflowService.transition(complaint, ComplaintStatus.ASSIGNED, admin,
                "Assigned to technician " + technician.getName() + (request.getNote() != null ? ": " + request.getNote() : ""));

        Assignment assignment = Assignment.builder()
                .complaint(complaint)
                .technician(technician)
                .assignedBy(admin)
                .note(request.getNote())
                .active(true)
                .build();

        assignment = assignmentRepository.save(assignment);
        complaintRepository.save(complaint);

        // Notify via SSE
        eventService.broadcastStatusUpdate(complaintId, ComplaintDto.from(complaint));

        return AssignmentDto.from(assignment);
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> getTechnicianActiveAssignments(String techEmail) {
        User technician = userRepository.findByEmail(techEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        return assignmentRepository.findByTechnicianAndActiveTrueOrderByAssignedAtDesc(technician)
                .stream()
                .map(AssignmentDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> getComplaintAssignments(Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        return assignmentRepository.findByComplaintOrderByAssignedAtDesc(complaint)
                .stream()
                .map(AssignmentDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TechnicianSuggestionDto> getTechnicianSuggestions(Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        List<User> technicians = userRepository.findByRoleAndActiveTrue(Role.TECHNICIAN);
        List<TechnicianSuggestionDto> suggestions = new ArrayList<>();

        for (User tech : technicians) {
            long activeTasks = assignmentRepository.countActiveAssignmentsByTechnician(tech.getId());
            boolean matchesSkill = false;
            List<String> matchingSkills = new ArrayList<>();

            if (complaint.getCategory() != null) {
                matchesSkill = skillRepository.existsByTechnicianIdAndCategory(tech.getId(), complaint.getCategory());
                if (matchesSkill) {
                    matchingSkills.add(complaint.getCategory().name());
                }
            }

            // Scoring formula: +100 points for skill match, -10 points per existing active task
            int matchScore = (matchesSkill ? 100 : 20) - (int) (activeTasks * 10);

            suggestions.add(TechnicianSuggestionDto.builder()
                    .technician(UserDto.from(tech))
                    .skillMatch(matchesSkill)
                    .matchingSkills(matchingSkills)
                    .activeAssignmentsCount(activeTasks)
                    .matchScore(matchScore)
                    .build());
        }

        // Rank by matchScore descending
        suggestions.sort(Comparator.comparingInt(TechnicianSuggestionDto::getMatchScore).reversed());
        return suggestions;
    }
}
`);

// 4. AssignmentController
writeFile('assignment/AssignmentController.java', `package edu.campus.maintenance.assignment;

import edu.campus.maintenance.assignment.dto.AssignComplaintRequest;
import edu.campus.maintenance.assignment.dto.AssignmentDto;
import edu.campus.maintenance.assignment.dto.TechnicianSuggestionDto;
import edu.campus.maintenance.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Assignments", description = "Complaint assignment and technician queue management")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping("/complaints/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign or reassign complaint to technician (Admin only)")
    public ResponseEntity<ApiResponse<AssignmentDto>> assignComplaint(
            @PathVariable Long id,
            @Valid @RequestBody AssignComplaintRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AssignmentDto result = assignmentService.assignComplaint(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Complaint assigned successfully", result));
    }

    @GetMapping("/technicians/me/assignments")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Get active assigned work queue for logged in technician")
    public ResponseEntity<ApiResponse<List<AssignmentDto>>> getMyAssignments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getTechnicianActiveAssignments(userDetails.getUsername())));
    }

    @GetMapping("/complaints/{id}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Operation(summary = "Get assignment history for a complaint")
    public ResponseEntity<ApiResponse<List<AssignmentDto>>> getComplaintAssignments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getComplaintAssignments(id)));
    }

    @GetMapping("/technicians/suggestions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get technician suggestions ranked by skill match and workload")
    public ResponseEntity<ApiResponse<List<TechnicianSuggestionDto>>> getTechnicianSuggestions(
            @RequestParam Long complaintId) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getTechnicianSuggestions(complaintId)));
    }
}
`);

console.log('Assignment service and controller written.');