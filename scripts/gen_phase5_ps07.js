const fs = require('fs');
const path = require('path');

function getPath(rel) {
    return path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', rel);
}

function writeFile(relPath, content) {
    const fullPath = getPath(relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. TechnicianWorkloadDto
writeFile('user/dto/TechnicianWorkloadDto.java', `package edu.campus.maintenance.user.dto;

import edu.campus.maintenance.complaint.dto.ComplaintDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianWorkloadDto {
    private UserDto technician;
    private long totalActiveTasks;
    private long assignedCount;
    private long inProgressCount;
    private Map<String, Long> priorityDistribution;
    private List<ComplaintDto> activeComplaints;
}
`);

// 2. LocationSummaryDto
writeFile('location/dto/LocationSummaryDto.java', `package edu.campus.maintenance.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationSummaryDto {
    private LocationDto location;
    private long totalComplaints;
    private long openComplaints;
    private long recurringComplaints;
    private boolean hasActiveRecurring;
    private Map<String, Long> complaintsByCategory;
}
`);

// 3. Update RecurrenceService to provide findEarlierComplaints
const recPath = getPath('recurrence/RecurrenceService.java');
let recContent = fs.readFileSync(recPath, 'utf8');
if (!recContent.includes('findEarlierComplaintsInSameLocationAndCategory')) {
    recContent = recContent.replace(
        'public void rebuildAllRecurrenceIndexes() {',
        `@Transactional(readOnly = true)
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

    public void rebuildAllRecurrenceIndexes() {`
    );
    fs.writeFileSync(recPath, recContent, 'utf8');
    console.log('Updated RecurrenceService with findEarlierComplaintsInSameLocationAndCategory');
}

// 4. Update ComplaintRepository to add findEarlierComplaints query
const compRepoPath = getPath('complaint/ComplaintRepository.java');
let compRepoContent = fs.readFileSync(compRepoPath, 'utf8');
if (!compRepoContent.includes('findEarlierComplaints')) {
    compRepoContent = compRepoContent.replace(
        'List<Complaint> findByClassificationStatusIn(List<ClassificationStatus> statuses);',
        `@Query("SELECT c FROM Complaint c WHERE c.location.id = :locationId AND c.category = :category AND c.id != :excludeId AND c.createdAt >= :since ORDER BY c.createdAt DESC")
    List<Complaint> findEarlierComplaints(
            @Param("locationId") Long locationId,
            @Param("category") Category category,
            @Param("excludeId") Long excludeId,
            @Param("since") Instant since);

    List<Complaint> findByClassificationStatusIn(List<ClassificationStatus> statuses);`
    );
    fs.writeFileSync(compRepoPath, compRepoContent, 'utf8');
    console.log('Updated ComplaintRepository with findEarlierComplaints query');
}

console.log('Phase 5 PS-07 DTOs and repository updates written.');