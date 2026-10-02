const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. ComplaintService
writeFile('complaint/ComplaintService.java', `package edu.campus.maintenance.complaint;

import edu.campus.maintenance.assignment.Assignment;
import edu.campus.maintenance.assignment.AssignmentRepository;
import edu.campus.maintenance.assignment.dto.AssignmentDto;
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

        Complaint complaint = Complaint.builder()
                .reporter(reporter)
                .location(location)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .imagePath(imagePath)
                .status(ComplaintStatus.REPORTED)
                .classificationStatus(ClassificationStatus.PENDING)
                .priorityScore(0)
                .priorityLevel(PriorityLevel.LOW)
                .priorityBreakdownJson("{\"urgencyBase\":0,\"agingBonus\":0,\"recurrenceBonus\":0}")
                .isRecurring(false)
                .recurrenceIndex(0)
                .escalationLevel(0)
                .build();

        complaint = complaintRepository.save(complaint);

        // Record history
        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .actor(reporter)
                .eventType("CREATED")
                .toStatus(ComplaintStatus.REPORTED)
                .note("Complaint submitted by " + reporter.getName())
                .build();
        historyRepository.save(history);

        // Publish event for Async Classification and Priority Scoring
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

        // Enforce ownership:
        // USER can only read own complaint
        if (currentUser.getRole() == Role.USER && !complaint.getReporter().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to view this complaint.");
        }

        return enrichWithAssignment(ComplaintDto.from(complaint), complaint);
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

        // If TECHNICIAN, check that they are currently assigned to this complaint
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

        // Enforce state transition
        workflowService.transition(complaint, request.getStatus(), actor, note);
        complaint = complaintRepository.save(complaint);

        ComplaintDto dto = enrichWithAssignment(ComplaintDto.from(complaint), complaint);

        // Broadcast status update to SSE clients
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
`);

// 2. ComplaintController
writeFile('complaint/ComplaintController.java', `package edu.campus.maintenance.complaint;

import edu.campus.maintenance.common.dto.ApiResponse;
import edu.campus.maintenance.common.dto.PageResponse;
import edu.campus.maintenance.complaint.dto.ComplaintDto;
import edu.campus.maintenance.complaint.dto.CreateComplaintRequest;
import edu.campus.maintenance.complaint.dto.UpdateComplaintStatusRequest;
import edu.campus.maintenance.history.dto.ComplaintHistoryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Complaint lifecycle, creation, status and real-time events")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final ComplaintEventService eventService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Submit a new complaint with optional image proof")
    public ResponseEntity<ApiResponse<ComplaintDto>> createComplaint(
            @Valid @ModelAttribute CreateComplaintRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails) {
        ComplaintDto response = complaintService.createComplaint(request, image, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Complaint submitted successfully", response));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get paginated complaints submitted by logged-in user")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintDto>>> getMyComplaints(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getMyComplaints(userDetails.getUsername(), pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Get complaint details by ID")
    public ResponseEntity<ApiResponse<ComplaintDto>> getComplaintById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getComplaintById(id, userDetails.getUsername())));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Get audit history for a complaint")
    public ResponseEntity<ApiResponse<List<ComplaintHistoryDto>>> getComplaintHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getComplaintHistory(id, userDetails.getUsername())));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search and filter all complaints (Admin only)")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintDto>>> getAllComplaints(
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) PriorityLevel level,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Boolean recurring,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20, sort = "priorityScore", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                complaintService.searchComplaints(status, category, level, locationId, recurring, search, fromDate, toDate, pageable)));
    }

    @PatchMapping(value = "/{id}/status", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Transition complaint status (Technician or Admin)")
    public ResponseEntity<ApiResponse<ComplaintDto>> updateStatus(
            @PathVariable Long id,
            @Valid @ModelAttribute UpdateComplaintStatusRequest request,
            @RequestPart(value = "proofImage", required = false) MultipartFile proofImage,
            @AuthenticationPrincipal UserDetails userDetails) {
        ComplaintDto result = complaintService.updateComplaintStatus(id, request, proofImage, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Complaint status updated", result));
    }

    @GetMapping(value = "/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Server-Sent Events for real-time complaint status updates")
    public SseEmitter subscribeToComplaintEvents(@PathVariable Long id) {
        return eventService.subscribe(id);
    }
}
`);

console.log('Phase 3 complaint service and controller written.');