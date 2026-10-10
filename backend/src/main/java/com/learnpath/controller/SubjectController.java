package com.learnpath.controller;

import com.learnpath.entity.Subject;
import com.learnpath.repository.SubjectRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    private final SubjectRepository subjectRepository;
    public SubjectController(SubjectRepository subjectRepository) { this.subjectRepository = subjectRepository; }

    @GetMapping
    public List<Subject> getSubjects() { return subjectRepository.findAll(); }
}
