const fs = require('fs');
const path = require('path');

function writeTestFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'test', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote Test: ' + relPath);
}

writeTestFile('workflow/WorkflowServiceTest.java', `package edu.campus.maintenance.workflow;

import edu.campus.maintenance.common.exceptions.InvalidTransitionException;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintStatus;
import edu.campus.maintenance.history.ComplaintHistory;
import edu.campus.maintenance.history.ComplaintHistoryRepository;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock
    private ComplaintHistoryRepository historyRepository;

    @InjectMocks
    private WorkflowService workflowService;

    private User admin;
    private User technician;
    private User regularUser;
    private Complaint complaint;

    @BeforeEach
    void setUp() {
        admin = User.builder().id(1L).email("admin@campus.edu").role(Role.ADMIN).build();
        technician = User.builder().id(2L).email("tech@campus.edu").role(Role.TECHNICIAN).build();
        regularUser = User.builder().id(3L).email("user@campus.edu").role(Role.USER).build();

        complaint = Complaint.builder()
                .id(100L)
                .status(ComplaintStatus.REPORTED)
                .build();
    }

    @Test
    @DisplayName("Admin can transition REPORTED to ASSIGNED")
    void transition_reportedToAssigned_byAdmin_success() {
        workflowService.transition(complaint, ComplaintStatus.ASSIGNED, admin, "Assigned to tech");

        assertEquals(ComplaintStatus.ASSIGNED, complaint.getStatus());
        verify(historyRepository).save(any(ComplaintHistory.class));
    }

    @Test
    @DisplayName("Non-admin cannot transition REPORTED to ASSIGNED")
    void transition_reportedToAssigned_byNonAdmin_throwsInvalidTransition() {
        assertThrows(InvalidTransitionException.class, () ->
                workflowService.transition(complaint, ComplaintStatus.ASSIGNED, regularUser, "note"));
        assertThrows(InvalidTransitionException.class, () ->
                workflowService.transition(complaint, ComplaintStatus.ASSIGNED, technician, "note"));
    }

    @Test
    @DisplayName("Technician can transition ASSIGNED to IN_PROGRESS")
    void transition_assignedToInProgress_byTechnician_success() {
        complaint.setStatus(ComplaintStatus.ASSIGNED);

        workflowService.transition(complaint, ComplaintStatus.IN_PROGRESS, technician, "Starting work");

        assertEquals(ComplaintStatus.IN_PROGRESS, complaint.getStatus());
        verify(historyRepository).save(any(ComplaintHistory.class));
    }

    @Test
    @DisplayName("Regular user cannot transition ASSIGNED to IN_PROGRESS")
    void transition_assignedToInProgress_byUser_throwsInvalidTransition() {
        complaint.setStatus(ComplaintStatus.ASSIGNED);

        assertThrows(InvalidTransitionException.class, () ->
                workflowService.transition(complaint, ComplaintStatus.IN_PROGRESS, regularUser, "note"));
    }

    @Test
    @DisplayName("Technician or Admin can transition IN_PROGRESS to RESOLVED")
    void transition_inProgressToResolved_success() {
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);

        workflowService.transition(complaint, ComplaintStatus.RESOLVED, technician, "Work completed");

        assertEquals(ComplaintStatus.RESOLVED, complaint.getStatus());
        assertNotNull(complaint.getResolvedAt());
        verify(historyRepository).save(any(ComplaintHistory.class));
    }

    @Test
    @DisplayName("Admin can reassign complaint (ASSIGNED to ASSIGNED)")
    void transition_reassignment_byAdmin_success() {
        complaint.setStatus(ComplaintStatus.ASSIGNED);

        workflowService.transition(complaint, ComplaintStatus.ASSIGNED, admin, "Reassigned to another tech");

        assertEquals(ComplaintStatus.ASSIGNED, complaint.getStatus());
        verify(historyRepository).save(any(ComplaintHistory.class));
    }

    @Test
    @DisplayName("Direct transition REPORTED to RESOLVED is forbidden")
    void transition_reportedToResolved_throwsInvalidTransition() {
        assertThrows(InvalidTransitionException.class, () ->
                workflowService.transition(complaint, ComplaintStatus.RESOLVED, admin, "Direct close"));
    }

    @Test
    @DisplayName("Transition from RESOLVED is forbidden (immutable)")
    void transition_fromResolved_throwsInvalidTransition() {
        complaint.setStatus(ComplaintStatus.RESOLVED);

        assertThrows(InvalidTransitionException.class, () ->
                workflowService.transition(complaint, ComplaintStatus.REPORTED, admin, "Reopen"));
    }
}
`);

console.log('Phase 3 workflow test written.');