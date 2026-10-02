package edu.campus.maintenance.user.dto;

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
