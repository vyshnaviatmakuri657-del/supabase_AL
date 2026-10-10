package com.learnpath.repository;

import com.learnpath.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Integer> {
    java.util.List<QuizAttempt> findByStudentIdAndConceptId(Integer studentId, Integer conceptId);
}
