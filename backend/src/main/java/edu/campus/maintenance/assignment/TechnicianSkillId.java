package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Category;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianSkillId implements Serializable {
    private Long technicianId;
    private Category category;
}
