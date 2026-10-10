package com.learnpath.repository;

import com.learnpath.entity.Concept;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ConceptRepository extends JpaRepository<Concept, Integer> {
    java.util.List<Concept> findBySubjectIdOrderByDisplayOrderAsc(Integer subjectId);
}
