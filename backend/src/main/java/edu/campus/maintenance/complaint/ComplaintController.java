package edu.campus.maintenance.complaint;

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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Complaint lifecycle, creation, status and real-time events")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final ComplaintEventService eventService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER', 'STUDENT', 'STAFF', 'ADMIN')")
    @Operation(summary = "Submit a new complaint with optional image proof")
    public ResponseEntity<ApiResponse<ComplaintDto>> createComplaint(
            @Valid @ModelAttribute CreateComplaintRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails) {
        ComplaintDto response = complaintService.createComplaint(request, image, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Complaint submitted successfully", response));
    }

    @GetMapping({"/mine", "/my"})
    @PreAuthorize("hasAnyRole('USER', 'STUDENT', 'STAFF', 'ADMIN')")
    @Operation(summary = "Get paginated complaints submitted by logged-in user")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintDto>>> getMyComplaints(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getMyComplaints(userDetails.getUsername(), pageable)));
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Operation(summary = "Get open complaints sorted by dynamic priority score")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintDto>>> getPriorityQueue(
            @PageableDefault(size = 50, sort = "priorityScore", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                complaintService.searchComplaints(null, null, null, null, null, null, null, null, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'STUDENT', 'STAFF', 'TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Get complaint details by ID")
    public ResponseEntity<ApiResponse<ComplaintDto>> getComplaintById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getComplaintById(id, userDetails.getUsername())));
    }

    @GetMapping("/{id}/recurrence-history")
    @PreAuthorize("hasAnyRole('USER', 'STUDENT', 'STAFF', 'TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Get recurrence history of earlier complaints in same location and category")
    public ResponseEntity<ApiResponse<List<ComplaintDto>>> getRecurrenceHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getRecurrenceHistory(id, userDetails.getUsername())));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('USER', 'STUDENT', 'STAFF', 'TECHNICIAN', 'ADMIN')")
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

    @PostMapping("/{id}/start-progress")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Start progress on complaint")
    public ResponseEntity<ApiResponse<ComplaintDto>> startProgress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UpdateComplaintStatusRequest req = new UpdateComplaintStatusRequest();
        req.setStatus(ComplaintStatus.IN_PROGRESS);
        req.setNote("Technician started work on complaint");
        ComplaintDto result = complaintService.updateComplaintStatus(id, req, null, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Progress started", result));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Resolve complaint")
    public ResponseEntity<ApiResponse<ComplaintDto>> resolveComplaint(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        UpdateComplaintStatusRequest req = new UpdateComplaintStatusRequest();
        req.setStatus(ComplaintStatus.RESOLVED);
        String note = (body != null && body.containsKey("note")) ? body.get("note") : "Complaint resolved";
        req.setNote(note);
        ComplaintDto result = complaintService.updateComplaintStatus(id, req, null, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Complaint marked as resolved", result));
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
