package edu.campus.maintenance.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByBuildingAndFloorAndRoom(String building, String floor, String room);
    List<Location> findAllByOrderByBuildingAscFloorAscRoomAsc();
}
