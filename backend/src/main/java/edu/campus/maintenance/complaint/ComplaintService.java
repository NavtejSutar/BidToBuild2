package edu.campus.maintenance.complaint;

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

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.TECHNICIAN && !complaint.getReporter().getId().equals(currentUser.getId())) {
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

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.TECHNICIAN && !complaint.getReporter().getId().equals(currentUser.getId())) {
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
