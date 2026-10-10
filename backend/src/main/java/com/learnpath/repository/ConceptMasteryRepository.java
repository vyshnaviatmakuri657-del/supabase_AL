package com.learnpath.repository;

import com.learnpath.entity.ConceptMastery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ConceptMasteryRepository extends JpaRepository<ConceptMastery, Integer> {
    java.util.Optional<ConceptMastery> findByStudentIdAndConceptId(Integer studentId, Integer conceptId);
    java.util.List<ConceptMastery> findByStudentId(Integer studentId);
    java.util.List<ConceptMastery> findByConceptId(Integer conceptId);
}
