package edu.campus.maintenance.user;

import edu.campus.maintenance.common.dto.PageResponse;
import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import edu.campus.maintenance.user.dto.CreateUserRequest;
import edu.campus.maintenance.user.dto.UpdateUserRequest;
import edu.campus.maintenance.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final edu.campus.maintenance.assignment.AssignmentRepository assignmentRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserDto> getAllUsers(Pageable pageable) {
        Page<UserDto> page = userRepository.findAll(pageable).map(UserDto::from);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDto.from(user);
    }

    @Transactional(readOnly = true)
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
    public List<UserDto> getActiveTechnicians() {
        return userRepository.findByRoleAndActiveTrue(Role.TECHNICIAN)
                .stream()
                .map(UserDto::from)
                .toList();
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new BadRequestException("Email already in use: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .active(true)
                .build();

        user = userRepository.save(user);
        return UserDto.from(user);
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment().trim());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        user = userRepository.save(user);
        return UserDto.from(user);
    }
}
