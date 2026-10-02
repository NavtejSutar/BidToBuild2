package edu.campus.maintenance.workflow;

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
