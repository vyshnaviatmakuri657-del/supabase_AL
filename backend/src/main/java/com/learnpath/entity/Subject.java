package com.learnpath.entity;

import jakarta.persistence.*;

@Entity @Table(name = "subjects")
public class Subject {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Integer id;
    @Column(nullable = false, unique = true, length = 80) public String name;
    @Column(length = 500) public String description;
    public Subject() {}
    public Subject(String name, String description) { this.name = name; this.description = description; }
}
