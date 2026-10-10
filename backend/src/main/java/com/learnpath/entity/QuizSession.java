package com.learnpath.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_sessions")
public class QuizSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;

    @Column(name = "student_id", nullable = false)
    public Integer studentId;

    @Column(name = "subject_id", nullable = false)
    public Integer subjectId;

    @Column(name = "concept_id", nullable = false)
    public Integer conceptId;

    @Column(name = "total_questions", nullable = false)
    public Integer totalQuestions;

    @Column(name = "correct_answers", nullable = false)
    public Integer correctAnswers;

    @Column(name = "score_percent", nullable = false)
    public Double scorePercent;

    @Column(nullable = false)
    public Boolean passed;

    @Column(name = "attempt_number", nullable = false)
    public Integer attemptNumber;

    @Column(name = "completed_at", nullable = false)
    public LocalDateTime completedAt;

    public QuizSession() {}

    public QuizSession(Integer studentId, Integer subjectId, Integer conceptId,
                       Integer totalQuestions, Integer correctAnswers, Double scorePercent,
                       Boolean passed, Integer attemptNumber) {
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.conceptId = conceptId;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.scorePercent = scorePercent;
        this.passed = passed;
        this.attemptNumber = attemptNumber;
        this.completedAt = LocalDateTime.now();
    }
}
