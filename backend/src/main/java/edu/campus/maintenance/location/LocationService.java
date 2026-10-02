package edu.campus.maintenance.location;

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
    private final edu.campus.maintenance.complaint.ComplaintRepository complaintRepository;
    private final edu.campus.maintenance.recurrence.RecurrenceIndexRepository recurrenceIndexRepository;

    @Transactional(readOnly = true)
    public List<edu.campus.maintenance.location.dto.LocationSummaryDto> getLocationSummaries() {
        List<Location> locations = locationRepository.findAllByOrderByBuildingAscFloorAscRoomAsc();
        List<edu.campus.maintenance.location.dto.LocationSummaryDto> summaries = new java.util.ArrayList<>();

        for (Location loc : locations) {
            long total = 0;
            long open = 0;
            long recurring = 0;
            boolean hasActiveRecurring = false;
            java.util.Map<String, Long> catCounts = new java.util.HashMap<>();

            for (edu.campus.maintenance.complaint.Category cat : edu.campus.maintenance.complaint.Category.values()) {
                int c30d = complaintRepository.countRecurringComplaints(loc.getId(), cat, -1L, java.time.Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS));
                if (c30d > 0) {
                    catCounts.put(cat.name(), (long) c30d);
                    total += c30d;
                    if (c30d >= 2) {
                        hasActiveRecurring = true;
                        recurring += c30d;
                    }
                }
            }

            summaries.add(edu.campus.maintenance.location.dto.LocationSummaryDto.builder()
                    .location(LocationDto.from(loc))
                    .totalComplaints(total)
                    .openComplaints(open)
                    .recurringComplaints(recurring)
                    .hasActiveRecurring(hasActiveRecurring)
                    .complaintsByCategory(catCounts)
                    .build());
        }
        return summaries;
    }

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
