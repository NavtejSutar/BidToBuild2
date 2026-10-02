const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. common/dto
writeFile('common/dto/ApiResponse.java', `package edu.campus.maintenance.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    @Builder.Default
    private Instant timestamp = Instant.now();
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
`);

writeFile('common/dto/FieldErrorDto.java', `package edu.campus.maintenance.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldErrorDto {
    private String field;
    private String message;
}
`);

writeFile('common/dto/ErrorResponse.java', `package edu.campus.maintenance.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    @Builder.Default
    private Instant timestamp = Instant.now();
    private int status;
    private String code;
    private String message;
    private List<FieldErrorDto> fieldErrors;
    private String traceId;
}
`);

writeFile('common/dto/PageResponse.java', `package edu.campus.maintenance.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
`);

// 2. common/exceptions
writeFile('common/exceptions/ResourceNotFoundException.java', `package edu.campus.maintenance.common.exceptions;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
`);

writeFile('common/exceptions/InvalidTransitionException.java', `package edu.campus.maintenance.common.exceptions;

public class InvalidTransitionException extends RuntimeException {
    public InvalidTransitionException(String message) {
        super(message);
    }
}
`);

writeFile('common/exceptions/UnauthorizedException.java', `package edu.campus.maintenance.common.exceptions;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
`);

writeFile('common/exceptions/RateLimitExceededException.java', `package edu.campus.maintenance.common.exceptions;

public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
`);

writeFile('common/exceptions/BadRequestException.java', `package edu.campus.maintenance.common.exceptions;

public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
`);

// 3. User & Role
writeFile('user/Role.java', `package edu.campus.maintenance.user;

public enum Role {
    USER,
    TECHNICIAN,
    ADMIN;

    public String withPrefix() {
        return "ROLE_" + this.name();
    }
}
`);

writeFile('user/User.java', `package edu.campus.maintenance.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Role role;

    @Column(length = 100)
    private String department;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
`);

writeFile('user/UserRepository.java', `package edu.campus.maintenance.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleAndActiveTrue(Role role);
    Page<User> findAll(Pageable pageable);
}
`);

writeFile('user/dto/UserDto.java', `package edu.campus.maintenance.user.dto;

import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String department;
    private boolean active;
    private Instant createdAt;

    public static UserDto from(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
`);

writeFile('user/dto/CreateUserRequest.java', `package edu.campus.maintenance.user.dto;

import edu.campus.maintenance.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    private String department;
    private List<String> skills;
}
`);

writeFile('user/dto/UpdateUserRequest.java', `package edu.campus.maintenance.user.dto;

import edu.campus.maintenance.user.Role;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private Role role;
    private String department;
    private Boolean active;
}
`);

writeFile('user/UserService.java', `package edu.campus.maintenance.user;

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
`);

writeFile('user/UserController.java', `package edu.campus.maintenance.user;

import edu.campus.maintenance.common.dto.ApiResponse;
import edu.campus.maintenance.common.dto.PageResponse;
import edu.campus.maintenance.user.dto.CreateUserRequest;
import edu.campus.maintenance.user.dto.UpdateUserRequest;
import edu.campus.maintenance.user.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Users & Technicians", description = "User administration and technician endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users (Admin only)")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers(pageable)));
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by ID (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(id)));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create user (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User created successfully", userService.createUser(request)));
    }

    @PatchMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", userService.updateUser(id, request)));
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Operation(summary = "List active technicians")
    public ResponseEntity<ApiResponse<List<UserDto>>> getActiveTechnicians() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getActiveTechnicians()));
    }
}
`);

// 4. Location module
writeFile('location/Location.java', `package edu.campus.maintenance.location;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "locations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_location_bfr", columnNames = {"building", "floor", "room"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campus_zone", nullable = false, length = 100)
    private String campusZone;

    @Column(nullable = false, length = 100)
    private String building;

    @Column(nullable = false, length = 50)
    private String floor;

    @Column(nullable = false, length = 100)
    private String room;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
`);

writeFile('location/LocationRepository.java', `package edu.campus.maintenance.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByBuildingAndFloorAndRoom(String building, String floor, String room);
    List<Location> findAllByOrderByBuildingAscFloorAscRoomAsc();
}
`);

writeFile('location/dto/LocationDto.java', `package edu.campus.maintenance.location.dto;

import edu.campus.maintenance.location.Location;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDto {
    private Long id;
    private String campusZone;
    private String building;
    private String floor;
    private String room;
    private String displayName;
    private Instant createdAt;

    public static LocationDto from(Location loc) {
        if (loc == null) return null;
        return LocationDto.builder()
                .id(loc.getId())
                .campusZone(loc.getCampusZone())
                .building(loc.getBuilding())
                .floor(loc.getFloor())
                .room(loc.getRoom())
                .displayName(loc.getDisplayName())
                .createdAt(loc.getCreatedAt())
                .build();
    }
}
`);

writeFile('location/dto/CreateLocationRequest.java', `package edu.campus.maintenance.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLocationRequest {
    @NotBlank(message = "Campus zone is required")
    @Size(max = 100)
    private String campusZone;

    @NotBlank(message = "Building is required")
    @Size(max = 100)
    private String building;

    @NotBlank(message = "Floor is required")
    @Size(max = 50)
    private String floor;

    @NotBlank(message = "Room is required")
    @Size(max = 100)
    private String room;

    private String displayName;
}
`);

writeFile('location/dto/UpdateLocationRequest.java', `package edu.campus.maintenance.location.dto;

import lombok.Data;

@Data
public class UpdateLocationRequest {
    private String campusZone;
    private String building;
    private String floor;
    private String room;
    private String displayName;
}
`);

writeFile('location/LocationService.java', `package edu.campus.maintenance.location;

import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.ResourceNotFoundException;
import edu.campus.maintenance.location.dto.CreateLocationRequest;
import edu.campus.maintenance.location.dto.LocationDto;
import edu.campus.maintenance.location.dto.UpdateLocationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    @Transactional(readOnly = true)
    public List<LocationDto> getAllLocations() {
        return locationRepository.findAllByOrderByBuildingAscFloorAscRoomAsc()
                .stream()
                .map(LocationDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationDto getLocationById(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        return LocationDto.from(location);
    }

    @Transactional
    public LocationDto createLocation(CreateLocationRequest request) {
        String building = request.getBuilding().trim();
        String floor = request.getFloor().trim();
        String room = request.getRoom().trim();

        if (locationRepository.findByBuildingAndFloorAndRoom(building, floor, room).isPresent()) {
            throw new BadRequestException("Location already exists for building: " + building + ", floor: " + floor + ", room: " + room);
        }

        String displayName = request.getDisplayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = building + " - " + floor + " (" + room + ")";
        }

        Location location = Location.builder()
                .campusZone(request.getCampusZone().trim())
                .building(building)
                .floor(floor)
                .room(room)
                .displayName(displayName.trim())
                .build();

        location = locationRepository.save(location);
        return LocationDto.from(location);
    }

    @Transactional
    public LocationDto updateLocation(Long id, UpdateLocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));

        if (request.getCampusZone() != null && !request.getCampusZone().isBlank()) {
            location.setCampusZone(request.getCampusZone().trim());
        }
        if (request.getBuilding() != null && !request.getBuilding().isBlank()) {
            location.setBuilding(request.getBuilding().trim());
        }
        if (request.getFloor() != null && !request.getFloor().isBlank()) {
            location.setFloor(request.getFloor().trim());
        }
        if (request.getRoom() != null && !request.getRoom().isBlank()) {
            location.setRoom(request.getRoom().trim());
        }
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            location.setDisplayName(request.getDisplayName().trim());
        }

        location = locationRepository.save(location);
        return LocationDto.from(location);
    }
}
`);

writeFile('location/LocationController.java', `package edu.campus.maintenance.location;

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
`);

console.log('Phase 2 core domain classes generated.');