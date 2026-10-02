package edu.campus.maintenance.location;

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
