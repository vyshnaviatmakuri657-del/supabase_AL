package com.learnpath.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lessons", uniqueConstraints = @UniqueConstraint(columnNames = {"concept_id", "class_type"}))
public class Lesson {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;

    @Column(name = "concept_id", nullable = false)
    public Integer conceptId;

    @Column(nullable = false, length = 160)
    public String title;

    @Column(name = "class_type", nullable = false, length = 30)
    public String classType = "PRIMARY"; // "PRIMARY" (Standard Class) or "ALTERNATIVE" (Alternative Remedial Class)

    @Column(length = 200)
    public String tagline;

    @Column(columnDefinition = "TEXT", nullable = false)
    public String content;

    @Column(columnDefinition = "TEXT")
    public String exampleCode;

    public Lesson() {}

    public Lesson(Integer conceptId, String title, String content, String exampleCode) {
        this(conceptId, title, "PRIMARY", null, content, exampleCode);
    }

    public Lesson(Integer conceptId, String title, String classType, String tagline, String content, String exampleCode) {
        this.conceptId = conceptId;
        this.title = title;
        this.classType = (classType == null || classType.trim().isEmpty()) ? "PRIMARY" : classType.toUpperCase();
        this.tagline = tagline;
        this.content = content;
        this.exampleCode = exampleCode;
    }
}
