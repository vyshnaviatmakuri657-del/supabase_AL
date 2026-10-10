package com.learnpath.repository;

import com.learnpath.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface QuestionRepository extends JpaRepository<Question, Integer>, PagingAndSortingRepository<Question, Integer> {
    List<Question> findByConceptIdIn(Collection<Integer> conceptIds);
    List<Question> findByConceptId(Integer conceptId);
    Page<Question> findByConceptId(Integer conceptId, Pageable pageable);
    long countByConceptId(Integer conceptId);

    @Query(value = "SELECT * FROM questions WHERE concept_id = :conceptId ORDER BY RANDOM()", nativeQuery = true)
    Page<Question> findRandomByConceptId(@Param("conceptId") Integer conceptId, Pageable pageable);
}
