package com.learnpath.controller;

import com.learnpath.dto.ApiDtos.*;
import com.learnpath.entity.*;
import com.learnpath.repository.*;
import com.learnpath.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {
    private final ConceptRepository conceptRepository;
    private final QuestionRepository questionRepository;
    private final QuizService quizService;
    private final com.learnpath.service.MasteryService masteryService;

    public QuizController(ConceptRepository conceptRepository, QuestionRepository questionRepository,
                          QuizService quizService, com.learnpath.service.MasteryService masteryService) {
        this.conceptRepository = conceptRepository;
        this.questionRepository = questionRepository;
        this.quizService = quizService;
        this.masteryService = masteryService;
    }

    @GetMapping("/concept/{conceptId}")
    public List<QuestionDTO> getConceptQuestions(@PathVariable Integer conceptId,
                                                @RequestParam(required = false) Integer studentId) {
        Concept concept = conceptRepository.findById(conceptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Concept not found."));
        if (studentId != null && !masteryService.isConceptUnlocked(studentId, conceptId)) {
            List<String> prereqs = masteryService.getPrerequisiteNames(conceptId);
            String prereqMsg = prereqs.isEmpty() ? "" : " (Prerequisites: " + String.join(", ", prereqs) + ")";
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Concept \"" + concept.name + "\" is locked! You must completely learn the prerequisite concept(s) with at least 75% mastery before taking this quiz." + prereqMsg);
        }

        // Random question sampling utilizing Spring Data Paging Repository
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 4);
        org.springframework.data.domain.Page<Question> randomPage = questionRepository.findRandomByConceptId(conceptId, pageable);
        List<Question> selected = randomPage.getContent();
        if (selected.isEmpty()) {
            long total = questionRepository.countByConceptId(conceptId);
            int totalPages = (int) Math.max(1, Math.ceil((double) total / 4));
            int randomPageNum = new Random().nextInt(totalPages);
            selected = questionRepository.findByConceptId(conceptId, org.springframework.data.domain.PageRequest.of(randomPageNum, 4)).getContent();
        }

        return selected.stream()
                .map(q -> new QuestionDTO(q.id, q.conceptId, concept.name, q.questionText,
                        q.optionA, q.optionB, q.optionC, q.optionD)).toList();
    }

    @GetMapping("/diagnostic")
    public List<QuestionDTO> getDiagnostic(@RequestParam Integer subjectId,
                                           @RequestParam(required = false) Integer conceptId,
                                           @RequestParam(required = false) Integer studentId) {
        if (conceptId != null) {
            return getConceptQuestions(conceptId, studentId);
        }
        List<Concept> concepts = conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(subjectId);
        if (concepts.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No concepts found for this subject.");
        Map<Integer, String> names = concepts.stream().collect(Collectors.toMap(c -> c.id, c -> c.name));
        return questionRepository.findByConceptIdIn(names.keySet()).stream()
                .sorted(Comparator.comparingInt(q -> q.id))
                .map(q -> new QuestionDTO(q.id, q.conceptId, names.get(q.conceptId), q.questionText,
                        q.optionA, q.optionB, q.optionC, q.optionD)).toList();
    }

    @PostMapping("/submit")
    public QuizResultDTO submit(@RequestBody QuizSubmissionDTO submission) { return quizService.submit(submission); }

    @PostMapping("/retest")
    public QuizResultDTO retest(@RequestBody QuizSubmissionDTO submission) { return quizService.submit(submission); }
}
