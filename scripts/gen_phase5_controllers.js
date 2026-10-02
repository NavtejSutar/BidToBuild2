const fs = require('fs');
const path = require('path');

function getPath(rel) {
    return path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', rel);
}

// 1. Rewrite ComplaintService.java with PS-07 synchronous rule & recurrence history
const compServicePath = getPath('complaint/ComplaintService.java');
const compServiceContent = `package edu.campus.maintenance.complaint;

import edu.campus.maintenance.assignment.Assignment;
import edu.campus.maintenance.assignment.AssignmentRepository;
import edu.campus.maintenance.assignment.dto.AssignmentDto;
import edu.campus.maintenance.classification.FallbackClassifier;
import edu.campus.maintenance.common.dto.PageResponse;
import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import edu.campus.maintenance.common.exceptions.UnauthorizedException;
import edu.campus.maintenance.complaint.dto.ComplaintDto;
import edu.campus.maintenance.complaint.dto.CreateComplaintRequest;
import edu.campus.maintenance.complaint.dto.UpdateComplaintStatusRequest;
import edu.campus.maintenance.history.ComplaintHistory;
import edu.campus.maintenance.history.ComplaintHistoryRepository;
import edu.campus.maintenance.history.dto.ComplaintHistoryDto;
import edu.campus.maintenance.location.Location;
import edu.campus.maintenance.location.LocationRepository;
import edu.campus.maintenance.priority.PriorityScoringService;
import edu.campus.maintenance.recurrence.RecurrenceService;
import edu.campus.maintenance.storage.FileStorageService;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import edu.campus.maintenance.user.UserRepository;
import edu.campus.maintenance.workflow.WorkflowService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final ComplaintHistoryRepository historyRepository;
    private final FileStorageService fileStorageService;
    private final WorkflowService workflowService;
    private final ComplaintEventService eventService;
    private final FallbackClassifier fallbackClassifier;
    private final RecurrenceService recurrenceService;
    private final PriorityScoringService priorityScoringService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ComplaintDto createComplaint(CreateComplaintRequest request, MultipartFile image, String userEmail) {
        User reporter = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new BadRequestException("Location not found with ID: " + request.getLocationId()));

        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            imagePath = fileStorageService.storeFile(image);
        }

        // PS-07 rule: Check immediate synchronous keyword rules (e.g., sparking, live wire)
        boolean isImmediateCritical = fallbackClassifier.isImmediateCritical(request.getTitle(), request.getDescription());
        Urgency initialUrgency = isImmediateCritical ? Urgency.CRITICAL : Urgency.LOW;

        Complaint complaint = Complaint.builder()
                .reporter(reporter)
                .location(location)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory()) // PS-07 rule: user-selected category is default
                .suggestedCategory(null)
                .imagePath(imagePath)
                .urgency(initialUrgency)
                .status(ComplaintStatus.REPORTED)
                .classificationStatus(ClassificationStatus.PENDING)
                .isRecurring(false)
                .recurrenceIndex(0)
                .escalationLevel(0)
                .build();

        // Evaluate initial recurrence and priority score synchronously
        recurrenceService.evaluateRecurrenceForComplaint(complaint);
        priorityScoringService.recalculateAndApply(complaint, Instant.now());

        complaint = complaintRepository.save(complaint);

        // Record creation history
        String initialNote = "Complaint submitted by " + reporter.getName() + " with category " + request.getCategory()
                + (isImmediateCritical ? " [Keyword Rule Triggered Immediate CRITICAL Urgency]" : "");

        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .actor(reporter)
                .eventType("CREATED")
                .toStatus(ComplaintStatus.REPORTED)
                .note(initialNote)
                .build();
        historyRepository.save(history);

        // Publish event for Async Classification (Groq)
        eventPublisher.publishEvent(complaint);

        return enrichWithAssignment(ComplaintDto.from(complaint), complaint);
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintDto> getMyComplaints(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));

        Page<ComplaintDto> page = complaintRepository.findByReporterOrderByCreatedAtDesc(user, pageable)
                .map(c -> enrichWithAssignment(ComplaintDto.from(c), c));

        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public ComplaintDto getComplaintById(Long id, String currentUserEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));

        if (currentUser.getRole() == Role.USER && !complaint.getReporter().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to view this complaint.");
        }

        return enrichWithAssignment(ComplaintDto.from(complaint), complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> getRecurrenceHistory(Long complaintId, String currentUserEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + complaintId));

        return recurrenceService.findEarlierComplaintsInSameLocationAndCategory(complaint)
                .stream()
                .map(c -> enrichWithAssignment(ComplaintDto.from(c), c))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintDto> searchComplaints(
            ComplaintStatus status,
            Category category,
            PriorityLevel priorityLevel,
            Long locationId,
            Boolean recurring,
            String query,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Specification<Complaint> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (priorityLevel != null) {
                predicates.add(cb.equal(root.get("priorityLevel"), priorityLevel));
            }
            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }
            if (recurring != null) {
                predicates.add(cb.equal(root.get("isRecurring"), recurring));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ComplaintDto> page = complaintRepository.findAll(spec, pageable)
                .map(c -> enrichWithAssignment(ComplaintDto.from(c), c));

        return PageResponse.from(page);
    }

    @Transactional
    public ComplaintDto updateComplaintStatus(
            Long id,
            UpdateComplaintStatusRequest request,
            MultipartFile proofImage,
            String userEmail) {

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));

        if (actor.getRole() == Role.TECHNICIAN) {
            Optional<Assignment> activeAssignment = assignmentRepository.findByComplaintAndActiveTrue(complaint);
            if (activeAssignment.isEmpty() || !activeAssignment.get().getTechnician().getId().equals(actor.getId())) {
                throw new UnauthorizedException("Technicians can only act on complaints currently assigned to them.");
            }
        }

        String note = request.getNote();
        if (proofImage != null && !proofImage.isEmpty()) {
            String proofPath = fileStorageService.storeFile(proofImage);
            note = (note != null ? note + " " : "") + "[Proof uploaded: " + proofPath + "]";
        }

        workflowService.transition(complaint, request.getStatus(), actor, note);

        // Recalculate priority if status changed
        priorityScoringService.recalculateAndApply(complaint, Instant.now());
        complaint = complaintRepository.save(complaint);

        ComplaintDto dto = enrichWithAssignment(ComplaintDto.from(complaint), complaint);
        eventService.broadcastStatusUpdate(id, dto);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<ComplaintHistoryDto> getComplaintHistory(Long complaintId, String currentUserEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + complaintId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));

        if (currentUser.getRole() == Role.USER && !complaint.getReporter().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to view this complaint's history.");
        }

        return historyRepository.findByComplaintOrderByCreatedAtDesc(complaint)
                .stream()
                .map(ComplaintHistoryDto::from)
                .toList();
    }

    private ComplaintDto enrichWithAssignment(ComplaintDto dto, Complaint complaint) {
        assignmentRepository.findByComplaintAndActiveTrue(complaint)
                .ifPresent(a -> dto.setActiveAssignment(AssignmentDto.from(a)));
        return dto;
    }
}
`;
fs.writeFileSync(compServicePath, compServiceContent, 'utf8');
console.log('Rewrote ComplaintService.java with PS-07 synchronous rules and recurrence history');

// 2. Add recurrence-history endpoint to ComplaintController.java
const compCtrlPath = getPath('complaint/ComplaintController.java');
let compCtrlContent = fs.readFileSync(compCtrlPath, 'utf8');
if (!compCtrlContent.includes('getRecurrenceHistory')) {
    compCtrlContent = compCtrlContent.replace(
        '@GetMapping("/{id}/history")',
        `@GetMapping("/{id}/recurrence-history")
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Get recurrence history of earlier complaints in same location and category")
    public ResponseEntity<ApiResponse<List<ComplaintDto>>> getRecurrenceHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getRecurrenceHistory(id, userDetails.getUsername())));
    }

    @GetMapping("/{id}/history")`
    );
    fs.writeFileSync(compCtrlPath, compCtrlContent, 'utf8');
    console.log('Updated ComplaintController.java with getRecurrenceHistory endpoint');
}

// 3. Add Worker Workload endpoint in UserController.java
const userCtrlPath = getPath('user/UserController.java');
let userCtrlContent = fs.readFileSync(userCtrlPath, 'utf8');
if (!userCtrlContent.includes('getTechnicianWorkload')) {
    userCtrlContent = userCtrlContent.replace(
        'private final UserService userService;',
        `private final UserService userService;
    private final edu.campus.maintenance.assignment.AssignmentRepository assignmentRepository;`
    );
    userCtrlContent = userCtrlContent.replace(
        '@GetMapping("/technicians")',
        `@GetMapping("/technicians/workload")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Operation(summary = "Get worker workload view: open complaints by status and priority")
    public ResponseEntity<ApiResponse<List<edu.campus.maintenance.user.dto.TechnicianWorkloadDto>>> getTechnicianWorkload() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getTechniciansWorkload()));
    }

    @GetMapping("/technicians")`
    );
    fs.writeFileSync(userCtrlPath, userCtrlContent, 'utf8');
    console.log('Updated UserController.java with getTechnicianWorkload endpoint');
}

// 4. Add getTechniciansWorkload method in UserService.java
const userServicePath = getPath('user/UserService.java');
let userServiceContent = fs.readFileSync(userServicePath, 'utf8');
if (!userServiceContent.includes('getTechniciansWorkload')) {
    userServiceContent = userServiceContent.replace(
        'private final PasswordEncoder passwordEncoder;',
        `private final PasswordEncoder passwordEncoder;
    private final edu.campus.maintenance.assignment.AssignmentRepository assignmentRepository;`
    );
    userServiceContent = userServiceContent.replace(
        'public List<UserDto> getActiveTechnicians() {',
        `@Transactional(readOnly = true)
    public List<edu.campus.maintenance.user.dto.TechnicianWorkloadDto> getTechniciansWorkload() {
        List<User> technicians = userRepository.findByRoleAndActiveTrue(Role.TECHNICIAN);
        List<edu.campus.maintenance.user.dto.TechnicianWorkloadDto> workloadList = new java.util.ArrayList<>();

        for (User tech : technicians) {
            List<edu.campus.maintenance.assignment.Assignment> assignments =
                    assignmentRepository.findByTechnicianAndActiveTrueOrderByAssignedAtDesc(tech);

            long assignedCount = 0;
            long inProgressCount = 0;
            java.util.Map<String, Long> priorityDist = new java.util.HashMap<>();
            priorityDist.put("CRITICAL", 0L);
            priorityDist.put("HIGH", 0L);
            priorityDist.put("MEDIUM", 0L);
            priorityDist.put("LOW", 0L);

            List<edu.campus.maintenance.complaint.dto.ComplaintDto> activeComplaints = new java.util.ArrayList<>();

            for (edu.campus.maintenance.assignment.Assignment a : assignments) {
                edu.campus.maintenance.complaint.Complaint c = a.getComplaint();
                if (c.getStatus() == edu.campus.maintenance.complaint.ComplaintStatus.ASSIGNED) assignedCount++;
                if (c.getStatus() == edu.campus.maintenance.complaint.ComplaintStatus.IN_PROGRESS) inProgressCount++;

                String pLevel = c.getPriorityLevel() != null ? c.getPriorityLevel().name() : "LOW";
                priorityDist.put(pLevel, priorityDist.getOrDefault(pLevel, 0L) + 1);

                activeComplaints.add(edu.campus.maintenance.complaint.dto.ComplaintDto.from(c));
            }

            workloadList.add(edu.campus.maintenance.user.dto.TechnicianWorkloadDto.builder()
                    .technician(UserDto.from(tech))
                    .totalActiveTasks(assignments.size())
                    .assignedCount(assignedCount)
                    .inProgressCount(inProgressCount)
                    .priorityDistribution(priorityDist)
                    .activeComplaints(activeComplaints)
                    .build());
        }
        return workloadList;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getActiveTechnicians() {`
    );
    fs.writeFileSync(userServicePath, userServiceContent, 'utf8');
    console.log('Updated UserService.java with getTechniciansWorkload');
}

// 5. Add Location Summary endpoint in LocationController.java & LocationService.java
const locServicePath = getPath('location/LocationService.java');
let locServiceContent = fs.readFileSync(locServicePath, 'utf8');
if (!locServiceContent.includes('getLocationSummaries')) {
    locServiceContent = locServiceContent.replace(
        'private final LocationRepository locationRepository;',
        `private final LocationRepository locationRepository;
    private final edu.campus.maintenance.complaint.ComplaintRepository complaintRepository;
    private final edu.campus.maintenance.recurrence.RecurrenceIndexRepository recurrenceIndexRepository;`
    );
    locServiceContent = locServiceContent.replace(
        'public List<LocationDto> getAllLocations() {',
        `@Transactional(readOnly = true)
    public List<edu.campus.maintenance.location.dto.LocationSummaryDto> getLocationSummaries() {
        List<Location> locations = locationRepository.findAllByOrderByBuildingAscFloorAscRoomAsc();
        List<edu.campus.maintenance.location.dto.LocationSummaryDto> summaries = new java.util.ArrayList<>();

        for (Location loc : locations) {
            long total = 0;
            long open = 0;
            long recurring = 0;
            boolean hasActiveRecurring = false;
            java.util.Map<String, Long> catCounts = new java.util.HashMap<>();

            for (edu.campus.maintenance.complaint.Category cat : edu.campus.maintenance.complaint.Category.values()) {
                int c30d = complaintRepository.countRecurringComplaints(loc.getId(), cat, -1L, java.time.Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS));
                if (c30d > 0) {
                    catCounts.put(cat.name(), (long) c30d);
                    total += c30d;
                    if (c30d >= 2) {
                        hasActiveRecurring = true;
                        recurring += c30d;
                    }
                }
            }

            summaries.add(edu.campus.maintenance.location.dto.LocationSummaryDto.builder()
                    .location(LocationDto.from(loc))
                    .totalComplaints(total)
                    .openComplaints(open)
                    .recurringComplaints(recurring)
                    .hasActiveRecurring(hasActiveRecurring)
                    .complaintsByCategory(catCounts)
                    .build());
        }
        return summaries;
    }

    @Transactional(readOnly = true)
    public List<LocationDto> getAllLocations() {`
    );
    fs.writeFileSync(locServicePath, locServiceContent, 'utf8');
    console.log('Updated LocationService.java with getLocationSummaries');
}

const locCtrlPath = getPath('location/LocationController.java');
let locCtrlContent = fs.readFileSync(locCtrlPath, 'utf8');
if (!locCtrlContent.includes('getLocationSummaries')) {
    locCtrlContent = locCtrlContent.replace(
        '@GetMapping\n    @Operation(summary = "Get all campus locations")',
        `@GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Operation(summary = "Get location-wise summary with complaint counts, category breakdown and recurring flags")
    public ResponseEntity<ApiResponse<List<edu.campus.maintenance.location.dto.LocationSummaryDto>>> getLocationSummaries() {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getLocationSummaries()));
    }

    @GetMapping
    @Operation(summary = "Get all campus locations")`
    );
    fs.writeFileSync(locCtrlPath, locCtrlContent, 'utf8');
    console.log('Updated LocationController.java with /summary endpoint');
}

console.log('Phase 5 PS-07 service and controller updates complete.');