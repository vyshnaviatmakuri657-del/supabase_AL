package com.learnpath.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "concept_mastery", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "concept_id"}))
public class ConceptMastery {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Integer id;
    @Column(name = "student_id", nullable = false) public Integer studentId;
    @Column(name = "concept_id", nullable = false) public Integer conceptId;
    @Column(nullable = false) public Double masteryScore;
    @Column(nullable = false) public Integer correctAnswers;
    @Column(nullable = false) public Integer totalAttempts;
    @Column(name = "assigned_class_type", length = 30) public String assignedClassType = "PRIMARY";
    @Column(nullable = false) public LocalDateTime updatedAt;
    public ConceptMastery() {}
    public ConceptMastery(Integer studentId, Integer conceptId) {
        this.studentId = studentId; this.conceptId = conceptId;
        this.masteryScore = 0.0; this.correctAnswers = 0; this.totalAttempts = 0;
        this.assignedClassType = "PRIMARY";
        this.updatedAt = LocalDateTime.now();
    }
}
