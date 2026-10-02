package edu.campus.maintenance.complaint;

import edu.campus.maintenance.location.Location;
import edu.campus.maintenance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "complaints")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "suggested_category", length = 50)
    private Category suggestedCategory;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Urgency urgency;

    @Column(name = "tags", columnDefinition = "JSON")
    private String tagsJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification_status", nullable = false, length = 50)
    @Builder.Default
    private ClassificationStatus classificationStatus = ClassificationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification_source", length = 50)
    private ClassificationSource classificationSource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.REPORTED;

    @Column(name = "priority_score", nullable = false)
    @Builder.Default
    private int priorityScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", nullable = false, length = 50)
    @Builder.Default
    private PriorityLevel priorityLevel = PriorityLevel.LOW;

    @Column(name = "priority_breakdown", columnDefinition = "JSON")
    private String priorityBreakdownJson;

    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private boolean isRecurring = false;

    @Column(name = "recurrence_index", nullable = false)
    @Builder.Default
    private int recurrenceIndex = 0;

    @Column(name = "escalation_level", nullable = false)
    @Builder.Default
    private int escalationLevel = 0;

    @Column(name = "report_count", nullable = false)
    @Builder.Default
    private int reportCount = 1;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;
}
