package edu.campus.maintenance.classification.llm;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LlmCallRepository extends JpaRepository<LlmCall, Long> {
}
