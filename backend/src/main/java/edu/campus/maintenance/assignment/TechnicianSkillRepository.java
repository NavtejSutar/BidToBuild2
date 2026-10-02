package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianSkillRepository extends JpaRepository<TechnicianSkill, TechnicianSkillId> {
    List<TechnicianSkill> findByTechnicianId(Long technicianId);
    List<TechnicianSkill> findByCategory(Category category);
    boolean existsByTechnicianIdAndCategory(Long technicianId, Category category);
}
