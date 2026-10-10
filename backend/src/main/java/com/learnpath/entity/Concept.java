package com.learnpath.entity;

import jakarta.persistence.*;

@Entity @Table(name = "concepts")
public class Concept {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Integer id;
    @Column(nullable = false) public Integer subjectId;
    @Column(nullable = false, length = 100) public String name;
    @Column(length = 1000) public String description;
    @Column(nullable = false) public Integer displayOrder;
    public Concept() {}
    public Concept(Integer subjectId, String name, String description, Integer displayOrder) {
        this.subjectId = subjectId; this.name = name; this.description = description; this.displayOrder = displayOrder;
    }
}
