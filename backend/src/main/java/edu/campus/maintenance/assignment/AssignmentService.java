package edu.campus.maintenance.assignment;

import edu.campus.maintenance.assignment.dto.AssignComplaintRequest;
import edu.campus.maintenance.assignment.dto.AssignmentDto;
import edu.campus.maintenance.assignment.dto.TechnicianSuggestionDto;
import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.dto.ComplaintDto;
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
