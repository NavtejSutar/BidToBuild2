package edu.campus.maintenance.assignment;

import edu.campus.maintenance.complaint.Complaint;
import edu.campus.maintenance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    Optional<Assignment> findByComplaintAndActiveTrue(Complaint complaint);

    List<Assignment> findByTechnicianAndActiveTrueOrderByAssignedAtDesc(User technician);

    List<Assignment> findByComplaintOrderByAssignedAtDesc(Complaint complaint);

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.technician.id = :techId AND a.active = true")
    long countActiveAssignmentsByTechnician(@Param("techId") Long techId);
}
