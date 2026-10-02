package edu.campus.maintenance.recurrence;

import edu.campus.maintenance.complaint.Category;
import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.complaint.ComplaintRepository;
import edu.campus.maintenance.location.Location;
import edu.campus.maintenance.location.LocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecurrenceService {

    private final ComplaintRepository complaintRepository;
    private final RecurrenceIndexRepository recurrenceIndexRepository;
    private final LocationRepository locationRepository;

    @Value("${app.recurrence.window-days:30}")
    private int windowDays = 30;

    @Value("${app.recurrence.threshold:2}")
    private int recurringThreshold = 2;

    @Transactional
    public void evaluateRecurrenceForComplaint(Complaint complaint) {
        if (complaint.getLocation() == null || complaint.getCategory() == null) {
            return;
        }

        Location location = complaint.getLocation();
        Category category = complaint.getCategory();
        Instant now = Instant.now();
        Instant windowStart = now.minus(windowDays, ChronoUnit.DAYS);

        // Count other complaints in window for same location and category
        int recurrenceIndex = complaintRepository.countRecurringComplaints(
                location.getId(), category, complaint.getId(), windowStart);

        complaint.setRecurrenceIndex(recurrenceIndex);
        complaint.setRecurring(recurrenceIndex >= recurringThreshold);

        log.info("Complaint ID {}: recurrenceIndex={}, isRecurring={}",
                complaint.getId(), recurrenceIndex, complaint.isRecurring());

        // Update recurrence_index rolling table incrementally
        updateRecurrenceIndexRow(location, category, now);
    }

    @Transactional
    public void updateRecurrenceIndexRow(Location location, Category category, Instant now) {
        RecurrenceIndex record = recurrenceIndexRepository.findByLocationAndCategory(location, category)
                .orElse(RecurrenceIndex.builder()
                        .location(location)
                        .category(category)
                        .firstSeen(now)
                        .build());

        int count7d = complaintRepository.countRecurringComplaints(location.getId(), category, -1L, now.minus(7, ChronoUnit.DAYS));
        int count30d = complaintRepository.countRecurringComplaints(location.getId(), category, -1L, now.minus(30, ChronoUnit.DAYS));
        int count90d = complaintRepository.countRecurringComplaints(location.getId(), category, -1L, now.minus(90, ChronoUnit.DAYS));

        // Trend calculation
        String trend = "STABLE";
        if (count7d * 4 > count30d + 1) {
            trend = "RISING";
        } else if (count7d * 4 < count30d - 1) {
            trend = "FALLING";
        }

        record.setCount7d(count7d);
        record.setCount30d(count30d);
        record.setCount90d(count90d);
        record.setLastSeen(now);
        record.setTrend(trend);

        recurrenceIndexRepository.save(record);
    }

    @Transactional(readOnly = true)
    public List<Complaint> findEarlierComplaintsInSameLocationAndCategory(Complaint complaint) {
        if (complaint.getLocation() == null || complaint.getCategory() == null) {
            return List.of();
        }
        Instant windowStart = complaint.getCreatedAt() != null
                ? complaint.getCreatedAt().minus(windowDays, ChronoUnit.DAYS)
                : Instant.now().minus(windowDays, ChronoUnit.DAYS);

        return complaintRepository.findEarlierComplaints(
                complaint.getLocation().getId(),
                complaint.getCategory(),
                complaint.getId() != null ? complaint.getId() : -1L,
                windowStart
        );
    }

    public void rebuildAllRecurrenceIndexes() {
        log.info("Starting nightly full rebuild of recurrence_index table...");
        Instant now = Instant.now();

        List<Location> locations = locationRepository.findAll();
        for (Location loc : locations) {
            for (Category cat : Category.values()) {
                int count90d = complaintRepository.countRecurringComplaints(loc.getId(), cat, -1L, now.minus(90, ChronoUnit.DAYS));
                if (count90d > 0) {
                    updateRecurrenceIndexRow(loc, cat, now);
                }
            }
        }
        log.info("Nightly recurrence_index table rebuild completed.");
    }
}
