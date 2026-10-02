package edu.campus.maintenance.recurrence;

import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.location.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecurrenceIndexRepository extends JpaRepository<RecurrenceIndex, Long> {
    Optional<RecurrenceIndex> findByLocationAndCategory(Location location, Category category);

    @Query("SELECT r FROM RecurrenceIndex r WHERE r.count30d >= 2 ORDER BY r.count30d DESC")
    List<RecurrenceIndex> findTopRecurringIssues();
}
