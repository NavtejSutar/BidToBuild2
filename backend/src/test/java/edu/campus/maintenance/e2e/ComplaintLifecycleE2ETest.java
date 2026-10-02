package edu.campus.maintenance.e2e;

import edu.campus.maintenance.assignment.Assignment;
import edu.campus.maintenance.assignment.AssignmentRepository;
import edu.campus.maintenance.assignment.AssignmentService;
import edu.campus.maintenance.assignment.dto.AssignComplaintRequest;
import edu.campus.maintenance.assignment.dto.AssignmentDto;
import edu.campus.maintenance.classification.FallbackClassifier;
import edu.campus.maintenance.complaint.*;
import edu.campus.maintenance.complaint.dto.ComplaintDto;
import edu.campus.maintenance.complaint.dto.CreateComplaintRequest;
import edu.campus.maintenance.complaint.dto.UpdateComplaintStatusRequest;
import edu.campus.maintenance.history.ComplaintHistory;
import edu.campus.maintenance.history.ComplaintHistoryRepository;
import edu.campus.maintenance.location.Location;
import edu.campus.maintenance.location.LocationRepository;
import edu.campus.maintenance.priority.PriorityProperties;
import edu.campus.maintenance.priority.PriorityScoringService;
import edu.campus.maintenance.recurrence.RecurrenceService;
import edu.campus.maintenance.storage.FileStorageService;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import edu.campus.maintenance.user.UserRepository;
import edu.campus.maintenance.workflow.WorkflowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintLifecycleE2ETest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AssignmentRepository assignmentRepository;

    @Mock
    private ComplaintHistoryRepository historyRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private ComplaintEventService eventService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private FallbackClassifier fallbackClassifier;
    private PriorityScoringService priorityScoringService;
    private WorkflowService workflowService;
    private ComplaintService complaintService;
    private AssignmentService assignmentService;

    @Mock
    private RecurrenceService recurrenceService;

    private User student;
    private User admin;
    private User technician;
    private Location lab204;

    @BeforeEach
    void setUp() {
        // Real keyword classifier
        fallbackClassifier = new FallbackClassifier();
        fallbackClassifier.init();

        // Real priority scoring service with default properties
        PriorityProperties priorityProperties = new PriorityProperties();
        priorityScoringService = new PriorityScoringService(priorityProperties);

        // Real workflow service with mocked history repo
        workflowService = new WorkflowService(historyRepository);

        // Real ComplaintService
        complaintService = new ComplaintService(
                complaintRepository,
                locationRepository,
                userRepository,
                assignmentRepository,
                historyRepository,
                fileStorageService,
                workflowService,
                eventService,
                fallbackClassifier,
                recurrenceService,
                priorityScoringService,
                eventPublisher
        );

        // Real AssignmentService
        assignmentService = new AssignmentService(
                assignmentRepository,
                complaintRepository,
                userRepository,
                null,
                workflowService,
                eventService
        );

        // Fixtures
        student = User.builder()
                .id(1L)
                .email("student1@campus.edu")
                .name("Alex Student")
                .role(Role.USER)
                .active(true)
                .build();

        admin = User.builder()
                .id(2L)
                .email("admin@campus.edu")
                .name("Campus Facility Admin")
                .role(Role.ADMIN)
                .active(true)
                .build();

        technician = User.builder()
                .id(3L)
                .email("tech1@campus.edu")
                .name("Sam Tech")
                .role(Role.TECHNICIAN)
                .active(true)
                .build();

        lab204 = Location.builder()
                .id(10L)
                .building("Engineering Hall")
                .floor("2nd Floor")
                .room("Lab 204")
                .displayName("Engineering Hall - 2nd Floor - Lab 204")
                .campusZone("Academic")
                .build();
    }

    @Test
    @DisplayName("End-to-end Lifecycle: Sparking wire keyword rule -> Critical Urgency & Priority -> Assignment -> In Progress -> Resolution")
    void shouldExecuteSparkingWireFullLifecycle() {
        // Step 1: Student submits sparking wire complaint in Lab 204
        CreateComplaintRequest createRequest = new CreateComplaintRequest();
        createRequest.setTitle("Sparking wire near breaker box in Lab 204");
        createRequest.setDescription("Observed electrical sparking and buzzing from wall conduit near workstation 6.");
        createRequest.setCategory(Category.ELECTRICAL);
        createRequest.setLocationId(10L);

        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(locationRepository.findById(10L)).thenReturn(Optional.of(lab204));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> {
            Complaint c = invocation.getArgument(0);
            if (c.getId() == null) c.setId(101L);
            if (c.getCreatedAt() == null) c.setCreatedAt(Instant.now());
            return c;
        });

        // Mock recurrence evaluation: 4 prior issues detected in Lab 204
        doAnswer(invocation -> {
            Complaint c = invocation.getArgument(0);
            c.setRecurrenceIndex(4);
            c.setRecurring(true);
            return null;
        }).when(recurrenceService).evaluateRecurrenceForComplaint(any(Complaint.class));

        ComplaintDto createdDto = complaintService.createComplaint(createRequest, null, student.getEmail());

        // Assert Step 1: Keyword rule set Urgency to CRITICAL synchronously
        assertThat(createdDto.getUrgency()).isEqualTo(Urgency.CRITICAL);
        // Assert Step 1: Category preserved from user selection
        assertThat(createdDto.getCategory()).isEqualTo(Category.ELECTRICAL);
        // Assert Step 1: Status is REPORTED
        assertThat(createdDto.getStatus()).isEqualTo(ComplaintStatus.REPORTED);
        // Assert Step 1: Priority Score >= 75 (CRITICAL) due to Urgency (80) + Recurrence Bonus (15)
        assertThat(createdDto.getPriorityLevel()).isEqualTo(PriorityLevel.CRITICAL);
        assertThat(createdDto.getPriorityScore()).isGreaterThanOrEqualTo(75);
        assertThat(createdDto.isRecurring()).isTrue();
        assertThat(createdDto.getRecurrenceIndex()).isEqualTo(4);

        // Verification of initial history creation
        verify(historyRepository, times(1)).save(argThat(h ->
                h.getEventType().equals("CREATED") &&
                h.getToStatus() == ComplaintStatus.REPORTED
        ));

        // Step 2: Admin views complaint and assigns to Technician 1
        Complaint complaintEntity = Complaint.builder()
                .id(101L)
                .reporter(student)
                .location(lab204)
                .title(createdDto.getTitle())
                .description(createRequest.getDescription())
                .category(Category.ELECTRICAL)
                .urgency(Urgency.CRITICAL)
                .priorityLevel(PriorityLevel.CRITICAL)
                .priorityScore(createdDto.getPriorityScore())
                .status(ComplaintStatus.REPORTED)
                .createdAt(Instant.now())
                .isRecurring(true)
                .recurrenceIndex(4)
                .build();

        when(complaintRepository.findById(101L)).thenReturn(Optional.of(complaintEntity));
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(technician.getId())).thenReturn(Optional.of(technician));
        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(i -> i.getArgument(0));

        AssignComplaintRequest assignRequest = new AssignComplaintRequest();
        assignRequest.setTechnicianId(technician.getId());
        assignRequest.setNote("Urgent: check Lab 204 electrical line immediately.");

        AssignmentDto assignmentDto = assignmentService.assignComplaint(101L, assignRequest, admin.getEmail());

        // Assert Step 2: Status transitioned to ASSIGNED
        assertThat(assignmentDto).isNotNull();
        assertThat(complaintEntity.getStatus()).isEqualTo(ComplaintStatus.ASSIGNED);

        // Step 3: Technician starts progress
        when(userRepository.findByEmail(technician.getEmail())).thenReturn(Optional.of(technician));
        Assignment activeAssignment = Assignment.builder()
                .id(501L)
                .complaint(complaintEntity)
                .technician(technician)
                .active(true)
                .build();
        when(assignmentRepository.findByComplaintAndActiveTrue(complaintEntity)).thenReturn(Optional.of(activeAssignment));

        UpdateComplaintStatusRequest startWorkRequest = new UpdateComplaintStatusRequest();
        startWorkRequest.setStatus(ComplaintStatus.IN_PROGRESS);
        startWorkRequest.setNote("On site at Lab 204, isolating circuit breaker.");

        ComplaintDto inProgressDto = complaintService.updateComplaintStatus(101L, startWorkRequest, null, technician.getEmail());

        // Assert Step 3: Status transitioned to IN_PROGRESS
        assertThat(inProgressDto.getStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);
        assertThat(complaintEntity.getStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);

        // Step 4: Technician marks resolved with completion notes
        UpdateComplaintStatusRequest resolveRequest = new UpdateComplaintStatusRequest();
        resolveRequest.setStatus(ComplaintStatus.RESOLVED);
        resolveRequest.setNote("Replaced degraded wiring and 20A circuit breaker. Voltage verified at 120V.");

        ComplaintDto resolvedDto = complaintService.updateComplaintStatus(101L, resolveRequest, null, technician.getEmail());

        // Assert Step 4: Status transitioned to RESOLVED
        assertThat(resolvedDto.getStatus()).isEqualTo(ComplaintStatus.RESOLVED);
        assertThat(complaintEntity.getStatus()).isEqualTo(ComplaintStatus.RESOLVED);
        assertThat(complaintEntity.getResolvedAt()).isNotNull();

        // Verification: Workflow transitions logged in history repository
        verify(historyRepository, atLeast(4)).save(any(ComplaintHistory.class));
    }
}
