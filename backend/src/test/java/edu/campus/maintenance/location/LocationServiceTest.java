package edu.campus.maintenance.location;

import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.location.dto.CreateLocationRequest;
import edu.campus.maintenance.location.dto.LocationDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @InjectMocks
    private LocationService locationService;

    private Location sampleLocation;

    @BeforeEach
    void setUp() {
        sampleLocation = Location.builder()
                .id(1L)
                .campusZone("North Zone")
                .building("Science Block A")
                .floor("Floor 1")
                .room("Room 101")
                .displayName("Science Block A - Room 101 (Physics Lab)")
                .build();
    }

    @Test
    @DisplayName("Should successfully create a new location")
    void createLocation_success() {
        CreateLocationRequest request = new CreateLocationRequest();
        request.setCampusZone("North Zone");
        request.setBuilding("Science Block A");
        request.setFloor("Floor 1");
        request.setRoom("Room 101");
        request.setDisplayName("Science Block A - Room 101 (Physics Lab)");

        when(locationRepository.findByBuildingAndFloorAndRoom("Science Block A", "Floor 1", "Room 101"))
                .thenReturn(Optional.empty());
        when(locationRepository.save(any(Location.class))).thenReturn(sampleLocation);

        LocationDto result = locationService.createLocation(request);

        assertNotNull(result);
        assertEquals("Science Block A", result.getBuilding());
        assertEquals("Room 101", result.getRoom());
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    @DisplayName("Should reject duplicate location in same building, floor, room")
    void createLocation_duplicate_throwsBadRequest() {
        CreateLocationRequest request = new CreateLocationRequest();
        request.setCampusZone("North Zone");
        request.setBuilding("Science Block A");
        request.setFloor("Floor 1");
        request.setRoom("Room 101");

        when(locationRepository.findByBuildingAndFloorAndRoom("Science Block A", "Floor 1", "Room 101"))
                .thenReturn(Optional.of(sampleLocation));

        assertThrows(BadRequestException.class, () -> locationService.createLocation(request));
        verify(locationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should list all locations ordered")
    void getAllLocations_success() {
        when(locationRepository.findAllByOrderByBuildingAscFloorAscRoomAsc())
                .thenReturn(List.of(sampleLocation));

        List<LocationDto> results = locationService.getAllLocations();

        assertEquals(1, results.size());
        assertEquals("Science Block A", results.get(0).getBuilding());
    }
}
