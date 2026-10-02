package edu.campus.maintenance.assignment;

import edu.campus.maintenance.assignment.dto.AssignComplaintRequest;
import edu.campus.maintenance.assignment.dto.AssignmentDto;
import edu.campus.maintenance.assignment.dto.TechnicianSuggestionDto;
import edu.campus.maintenance.common.dto.ApiResponse;
import edu.campus.maintenance.common.dto.PageResponse;
import edu.campus.maintenance.complaint.ComplaintService;
import edu.campus.maintenance.complaint.dto.ComplaintDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
    private final ComplaintService complaintService;

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

    @GetMapping("/technicians/assigned")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Get active assigned complaints for logged-in technician")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintDto>>> getAssignedComplaints(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getAssignedComplaintsForTechnician(userDetails.getUsername(), pageable)));
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
