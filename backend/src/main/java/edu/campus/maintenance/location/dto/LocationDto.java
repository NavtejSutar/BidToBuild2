package edu.campus.maintenance.location.dto;

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
