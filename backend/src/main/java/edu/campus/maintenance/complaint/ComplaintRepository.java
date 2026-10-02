package edu.campus.maintenance.complaint;

import edu.campus.maintenance.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    Page<Complaint> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.status != 'RESOLVED'")
    List<Complaint> findUnresolvedComplaints();

    @Query("SELECT c FROM Complaint c WHERE c.status != 'RESOLVED' AND c.priorityLevel = 'CRITICAL' AND c.status = 'REPORTED' AND c.createdAt <= :thresholdTime")
    List<Complaint> findUnassignedCriticalOlderThan(@Param("thresholdTime") Instant thresholdTime);

    @Query("SELECT c FROM Complaint c WHERE c.status != 'RESOLVED' AND c.createdAt <= :slaDeadline AND c.escalationLevel = 0")
    List<Complaint> findUnresolvedBreachedSla(@Param("slaDeadline") Instant slaDeadline);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.location.id = :locationId AND c.category = :category AND c.id != :excludeId AND c.createdAt >= :since")
    int countRecurringComplaints(
            @Param("locationId") Long locationId,
            @Param("category") Category category,
            @Param("excludeId") Long excludeId,
            @Param("since") Instant since);

    @Query("SELECT c FROM Complaint c WHERE c.location.id = :locationId AND c.category = :category AND c.id != :excludeId AND c.createdAt >= :since ORDER BY c.createdAt DESC")
    List<Complaint> findEarlierComplaints(
            @Param("locationId") Long locationId,
            @Param("category") Category category,
            @Param("excludeId") Long excludeId,
            @Param("since") Instant since);

    List<Complaint> findByClassificationStatusIn(List<ClassificationStatus> statuses);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status != 'RESOLVED'")
    long countOpenComplaints();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status != 'RESOLVED' AND c.priorityLevel = 'CRITICAL'")
    long countCriticalOpenComplaints();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = 'REPORTED'")
    long countUnassignedComplaints();

    long countByStatus(ComplaintStatus status);

    long countByPriorityLevel(PriorityLevel priorityLevel);

    long countByCategory(Category category);

    long countByUrgency(Urgency urgency);

    long countByStatusAndPriorityLevel(ComplaintStatus status, PriorityLevel priorityLevel);

    @Query(value = "SELECT AVG(TIMESTAMPDIFF(SECOND, created_at, resolved_at)) FROM complaints WHERE status = 'RESOLVED' AND resolved_at IS NOT NULL", nativeQuery = true)
    Double findAverageResolutionTimeSeconds();
}
