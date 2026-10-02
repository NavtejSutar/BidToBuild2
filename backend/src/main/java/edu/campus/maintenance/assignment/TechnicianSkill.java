package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Category;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "technician_skills")
@IdClass(TechnicianSkillId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianSkill {

    @Id
    @Column(name = "technician_id")
    private Long technicianId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Category category;
}
