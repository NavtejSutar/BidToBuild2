package edu.campus.maintenance.analytics;

import edu.campus.maintenance.analytics.dto.DashboardSummaryDto;
import edu.campus.maintenance.analytics.dto.MatrixCellDto;
import edu.campus.maintenance.analytics.dto.StatusPriorityMatrixDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'TECHNICIAN')")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }

    @GetMapping("/matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'TECHNICIAN')")
    public ResponseEntity<StatusPriorityMatrixDto> getStatusPriorityMatrix() {
        return ResponseEntity.ok(analyticsService.getStatusPriorityMatrix());
    }

    @GetMapping("/matrix/cells")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'TECHNICIAN')")
    public ResponseEntity<List<MatrixCellDto>> getMatrixCells() {
        return ResponseEntity.ok(analyticsService.getMatrixCells());
    }
}
