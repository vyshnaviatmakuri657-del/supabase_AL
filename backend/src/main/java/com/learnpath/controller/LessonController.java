package com.learnpath.controller;

import com.learnpath.dto.ApiDtos.LessonSummaryDTO;
import com.learnpath.dto.ApiDtos.UpdateLessonDTO;
import com.learnpath.entity.Concept;
import com.learnpath.entity.Lesson;
import com.learnpath.repository.ConceptRepository;
import com.learnpath.repository.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {
    private final LessonRepository lessonRepository;
    private final ConceptRepository conceptRepository;
    private final com.learnpath.service.MasteryService masteryService;
    private final com.learnpath.repository.ConceptMasteryRepository masteryRepository;

    public LessonController(LessonRepository lessonRepository, ConceptRepository conceptRepository,
                            com.learnpath.service.MasteryService masteryService,
                            com.learnpath.repository.ConceptMasteryRepository masteryRepository) {
        this.lessonRepository = lessonRepository;
        this.conceptRepository = conceptRepository;
        this.masteryService = masteryService;
        this.masteryRepository = masteryRepository;
    }

    @GetMapping
    public List<LessonSummaryDTO> getLessons(@RequestParam(required = false) Integer subjectId) {
        List<Concept> concepts;
        if (subjectId != null) {
            concepts = conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(subjectId);
        } else {
            concepts = conceptRepository.findAll();
        }
        Map<Integer, String> conceptNames = concepts.stream().collect(Collectors.toMap(c -> c.id, c -> c.name));
        List<Lesson> lessons = lessonRepository.findAll();
        return lessons.stream()
                .filter(l -> conceptNames.containsKey(l.conceptId))
                .map(l -> new LessonSummaryDTO(l.id, l.conceptId, conceptNames.get(l.conceptId), l.title, l.classType, l.tagline, l.content, l.exampleCode))
                .sorted(Comparator.comparingInt(LessonSummaryDTO::conceptId).thenComparing(LessonSummaryDTO::classType))
                .toList();
    }

    @GetMapping("/{lessonId}")
    public Lesson getLesson(@PathVariable Integer lessonId) {
        return lessonRepository.findById(lessonId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found."));
    }

    @PutMapping("/{lessonId}")
    public Lesson updateLesson(@PathVariable Integer lessonId, @RequestBody UpdateLessonDTO req) {
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found."));
        if (req.title() != null && !req.title().trim().isEmpty()) {
            lesson.title = req.title().trim();
        }
        if (req.tagline() != null) {
            lesson.tagline = req.tagline().trim();
        }
        if (req.content() != null && !req.content().trim().isEmpty()) {
            lesson.content = req.content();
        }
        if (req.exampleCode() != null) {
            lesson.exampleCode = req.exampleCode();
        }
        return lessonRepository.save(lesson);
    }

    @GetMapping("/by-concept/{conceptId}")
    public Lesson getLessonByConceptId(@PathVariable Integer conceptId,
                                       @RequestParam(required = false) String classType,
                                       @RequestParam(required = false) Integer studentId) {
        String targetType = classType;
        if (targetType == null && studentId != null) {
            targetType = masteryRepository.findByStudentIdAndConceptId(studentId, conceptId)
                    .map(m -> m.assignedClassType)
                    .orElse("PRIMARY");
        }
        if (targetType != null && !targetType.trim().isEmpty()) {
            return lessonRepository.findByConceptIdAndClassType(conceptId, targetType.trim().toUpperCase(Locale.ROOT))
                    .or(() -> lessonRepository.findFirstByConceptIdOrderByClassTypeAsc(conceptId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found for this concept and class track."));
        }
        return lessonRepository.findByConceptIdAndClassType(conceptId, "PRIMARY")
                .or(() -> lessonRepository.findFirstByConceptIdOrderByClassTypeAsc(conceptId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found for this concept."));
    }

    @GetMapping("/by-concept/{conceptId}/all")
    public List<Lesson> getAllLessonsForConcept(@PathVariable Integer conceptId) {
        return lessonRepository.findByConceptIdOrderByClassTypeAsc(conceptId);
    }

    @PostMapping("/students/{studentId}/concepts/{conceptId}/track")
    public Map<String, Object> switchClassTrack(@PathVariable Integer studentId,
                                                @PathVariable Integer conceptId,
                                                @RequestParam(defaultValue = "PRIMARY") String classType) {
        masteryService.setAssignedClassType(studentId, conceptId, classType);
        return Map.of("success", true, "studentId", studentId, "conceptId", conceptId, "assignedClassType", classType.toUpperCase(Locale.ROOT));
    }
}
