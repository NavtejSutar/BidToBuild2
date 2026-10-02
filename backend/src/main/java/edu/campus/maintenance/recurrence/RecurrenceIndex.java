package edu.campus.maintenance.recurrence;

import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.location.Location;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "recurrence_index", uniqueConstraints = {
    @UniqueConstraint(name = "uk_recurrence_loc_cat", columnNames = {"location_id", "category"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurrenceIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Category category;

    @Column(name = "count_7d", nullable = false)
    @Builder.Default
    private int count7d = 0;

    @Column(name = "count_30d", nullable = false)
    @Builder.Default
    private int count30d = 0;

    @Column(name = "count_90d", nullable = false)
    @Builder.Default
    private int count90d = 0;

    @Column(name = "first_seen")
    private Instant firstSeen;

    @Column(name = "last_seen")
    private Instant lastSeen;

    @Column(length = 50)
    @Builder.Default
    private String trend = "STABLE";

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
