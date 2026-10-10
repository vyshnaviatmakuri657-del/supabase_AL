package com.learnpath.entity;

import jakarta.persistence.*;

@Entity @Table(name = "questions")
public class Question {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Integer id;
    @Column(nullable = false) public Integer conceptId;
    @Column(nullable = false, length = 1000) public String questionText;
    @Column(nullable = false, length = 500) public String optionA;
    @Column(nullable = false, length = 500) public String optionB;
    @Column(nullable = false, length = 500) public String optionC;
    @Column(nullable = false, length = 500) public String optionD;
    @Column(nullable = false, length = 1) public String correctOption;
    @Column(length = 1500) public String explanation;
    public Question() {}
    public Question(Integer conceptId, String questionText, String optionA, String optionB, String optionC, String optionD, String correctOption, String explanation) {
        this.conceptId = conceptId; this.questionText = questionText; this.optionA = optionA; this.optionB = optionB;
        this.optionC = optionC; this.optionD = optionD; this.correctOption = correctOption; this.explanation = explanation;
    }
}
