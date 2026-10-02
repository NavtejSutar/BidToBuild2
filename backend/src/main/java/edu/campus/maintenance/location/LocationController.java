package edu.campus.maintenance.location;

import edu.campus.maintenance.common.dto.ApiResponse;
import edu.campus.maintenance.location.dto.CreateLocationRequest;
import edu.campus.maintenance.location.dto.LocationDto;
import edu.campus.maintenance.location.dto.UpdateLocationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
@Tag(name = "Locations", description = "Campus location endpoints")
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    @Operation(summary = "Get all campus locations")
    public ResponseEntity<ApiResponse<List<LocationDto>>> getAllLocations() {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getAllLocations()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get location by ID")
    public ResponseEntity<ApiResponse<LocationDto>> getLocationById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getLocationById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create location (Admin only)")
    public ResponseEntity<ApiResponse<LocationDto>> createLocation(@Valid @RequestBody CreateLocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Location created successfully", locationService.createLocation(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update location (Admin only)")
    public ResponseEntity<ApiResponse<LocationDto>> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLocationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Location updated successfully", locationService.updateLocation(id, request)));
    }
}
