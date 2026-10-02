package edu.campus.maintenance.complaint.dto;

import edu.campus.maintenance.complaint.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateComplaintStatusRequest {
    @NotNull(message = "Target status is required")
    private ComplaintStatus status;
    private String note;
}
