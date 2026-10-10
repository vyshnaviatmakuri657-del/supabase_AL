package com.learnpath.entity;

import jakarta.persistence.*;

@Entity @Table(name = "students")
public class Student {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Integer id;
    @Column(nullable = false, length = 100) public String name;
    @Column(nullable = false, unique = true, length = 150) public String email;
    @Column(nullable = false, length = 100) public String password;
    @Column(nullable = false, length = 30) public String role = "STUDENT";
    public Student() {}
    public Student(String name, String email) { this.name = name; this.email = email; this.password = "password"; this.role = "STUDENT"; }
    public Student(String name, String email, String password) { this.name = name; this.email = email; this.password = password; this.role = "STUDENT"; }
    public Student(String name, String email, String password, String role) { this.name = name; this.email = email; this.password = password; this.role = role != null ? role : "STUDENT"; }
}
