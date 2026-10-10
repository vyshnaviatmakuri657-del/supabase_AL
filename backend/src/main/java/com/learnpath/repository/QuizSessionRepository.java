package com.learnpath.repository;

import com.learnpath.entity.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizSessionRepository extends JpaRepository<QuizSession, Integer> {
    List<QuizSession> findByStudentIdOrderByCompletedAtAsc(Integer studentId);
    List<QuizSession> findByStudentIdAndConceptIdOrderByCompletedAtAsc(Integer studentId, Integer conceptId);
    int countByStudentIdAndConceptId(Integer studentId, Integer conceptId);
    int countByStudentId(Integer studentId);
    List<QuizSession> findAllByOrderByCompletedAtDesc();
}
