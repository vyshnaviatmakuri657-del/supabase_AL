package com.learnpath.controller;

import com.learnpath.dto.ApiDtos.GraphDTO;
import com.learnpath.entity.Concept;
import com.learnpath.repository.ConceptRepository;
import com.learnpath.service.GraphService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ConceptController {
    private final ConceptRepository conceptRepository;
    private final GraphService graphService;
    public ConceptController(ConceptRepository conceptRepository, GraphService graphService) {
        this.conceptRepository = conceptRepository; this.graphService = graphService;
    }

    @GetMapping("/concepts")
    public List<Concept> getConcepts(@RequestParam Integer subjectId) {
        return conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(subjectId);
    }

    @GetMapping("/subjects/{subjectId}/graph")
    public GraphDTO getGraph(@PathVariable Integer subjectId, @RequestParam Integer studentId) {
        return graphService.getGraph(subjectId, studentId);
    }
}
