package com.learnpath.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name = "quiz_attempts")
public class QuizAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Integer id;
    @Column(nullable = false) public Integer studentId;
    @Column(nullable = false) public Integer conceptId;
    @Column(nullable = false) public Integer questionId;
    @Column(nullable = false, length = 1) public String selectedOption;
    @Column(name = "is_correct", nullable = false) public boolean correct;
    @Column(nullable = false) public LocalDateTime attemptedAt;
    public QuizAttempt() {}
    public QuizAttempt(Integer studentId, Integer conceptId, Integer questionId, String selectedOption, boolean correct) {
        this.studentId = studentId; this.conceptId = conceptId; this.questionId = questionId;
        this.selectedOption = selectedOption; this.correct = correct; this.attemptedAt = LocalDateTime.now();
    }
}
