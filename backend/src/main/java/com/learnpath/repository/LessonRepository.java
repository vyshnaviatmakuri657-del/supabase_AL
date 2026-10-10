package com.learnpath.repository;

import com.learnpath.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface LessonRepository extends JpaRepository<Lesson, Integer> {
    List<Lesson> findByConceptId(Integer conceptId);
    List<Lesson> findByConceptIdOrderByClassTypeAsc(Integer conceptId);
    Optional<Lesson> findByConceptIdAndClassType(Integer conceptId, String classType);
    Optional<Lesson> findFirstByConceptIdOrderByClassTypeAsc(Integer conceptId);
    List<Lesson> findByConceptIdIn(Collection<Integer> conceptIds);
    List<Lesson> findByConceptIdInOrderByConceptIdAscClassTypeAsc(Collection<Integer> conceptIds);
}
