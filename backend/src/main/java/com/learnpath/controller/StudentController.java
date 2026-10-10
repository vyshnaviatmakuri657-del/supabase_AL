package com.learnpath.controller;

import com.learnpath.dto.ApiDtos.*;
import com.learnpath.entity.Concept;
import com.learnpath.entity.QuizSession;
import com.learnpath.entity.Student;
import com.learnpath.service.MasteryService;
import com.learnpath.service.RecommendationService;
import com.learnpath.repository.ConceptRepository;
import com.learnpath.repository.QuizAttemptRepository;
import com.learnpath.repository.QuizSessionRepository;
import com.learnpath.repository.StudentRepository;
import org.springframework.web.bind.annotation.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
public class StudentController {
    private final StudentRepository studentRepository;
    private final MasteryService masteryService;
    private final RecommendationService recommendationService;
    private final QuizAttemptRepository attemptRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final ConceptRepository conceptRepository;

    public StudentController(StudentRepository studentRepository, MasteryService masteryService,
                             RecommendationService recommendationService, QuizAttemptRepository attemptRepository,
                             QuizSessionRepository quizSessionRepository, ConceptRepository conceptRepository) {
        this.studentRepository = studentRepository;
        this.masteryService = masteryService;
        this.recommendationService = recommendationService;
        this.attemptRepository = attemptRepository;
        this.quizSessionRepository = quizSessionRepository;
        this.conceptRepository = conceptRepository;
    }

    @GetMapping("/students")
    public List<StudentDTO> getStudents() {
        return studentRepository.findAll().stream()
                .map(s -> new StudentDTO(s.id, s.name, s.email, s.role))
                .toList();
    }

    @GetMapping("/students/{studentId}/mastery")
    public List<MasteryDTO> getMastery(@PathVariable Integer studentId, @RequestParam Integer subjectId) {
        return masteryService.getMasteryForSubject(studentId, subjectId);
    }

    @GetMapping("/students/{studentId}/recommendations")
    public RecommendationDTO getRecommendation(@PathVariable Integer studentId, @RequestParam Integer subjectId) {
        return recommendationService.getNextRecommendation(studentId, subjectId);
    }

    @GetMapping("/students/{studentId}/progress")
    public ProgressDTO getProgress(@PathVariable Integer studentId, @RequestParam Integer subjectId) {
        List<MasteryDTO> rows = masteryService.getMasteryForSubject(studentId, subjectId);
        List<MasteryDTO> assessed = rows.stream().filter(m -> m.totalAttempts() > 0).toList();
        double average = assessed.isEmpty() ? 0 : Math.round(assessed.stream().mapToDouble(MasteryDTO::masteryScore).average().orElse(0) * 10) / 10.0;
        int mastered = (int) rows.stream().filter(m -> "MASTERED".equals(m.status())).count();
        int totalAttempts = rows.stream().mapToInt(MasteryDTO::totalAttempts).sum();
        int correctAnswers = rows.stream().mapToInt(MasteryDTO::correctAnswers).sum();
        return new ProgressDTO(rows.size(), mastered, average, totalAttempts, correctAnswers);
    }

    @GetMapping("/students/{studentId}/visual-progress")
    public StudentVisualProgressDTO getVisualProgress(@PathVariable Integer studentId, @RequestParam(defaultValue = "1") Integer subjectId) {
        List<MasteryDTO> masteryList = masteryService.getMasteryForSubject(studentId, subjectId);
        List<QuizSession> sessions = quizSessionRepository.findByStudentIdOrderByCompletedAtAsc(studentId);
        Map<Integer, Concept> conceptMap = new HashMap<>();
        conceptRepository.findAll().forEach(c -> conceptMap.put(c.id, c));

        int totalTestsTaken = sessions.size();
        int retestCount = (int) sessions.stream().filter(s -> s.attemptNumber != null && s.attemptNumber > 1).count();
        int masteredCount = (int) masteryList.stream().filter(m -> "MASTERED".equals(m.status())).count();
        int totalConcepts = masteryList.size();

        double avgMastery = masteryList.isEmpty() ? 0.0 :
                Math.round(masteryList.stream().mapToDouble(MasteryDTO::masteryScore).average().orElse(0.0) * 10) / 10.0;

        int totalQuestions = sessions.stream().mapToInt(s -> s.totalQuestions).sum();
        int totalCorrect = sessions.stream().mapToInt(s -> s.correctAnswers).sum();
        double accuracy = totalQuestions == 0 ? 0.0 : Math.round((totalCorrect * 1000.0) / totalQuestions) / 10.0;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, HH:mm");
        List<StudentTestHistoryDTO> history = sessions.stream().map(s -> {
            String cName = conceptMap.containsKey(s.conceptId) ? conceptMap.get(s.conceptId).name : "Concept #" + s.conceptId;
            String dateStr = s.completedAt != null ? s.completedAt.format(dtf) : "Recent";
            return new StudentTestHistoryDTO(s.id, s.conceptId, cName, s.attemptNumber != null ? s.attemptNumber : 1,
                    s.scorePercent, s.correctAnswers, s.totalQuestions, Boolean.TRUE.equals(s.passed), dateStr);
        }).toList();

        List<ConceptMasteryBriefDTO> briefList = masteryList.stream().map(m -> {
            int testsForConcept = (int) sessions.stream().filter(s -> Objects.equals(s.conceptId, m.conceptId())).count();
            return new ConceptMasteryBriefDTO(m.conceptId(), m.conceptName(), m.masteryScore(), m.status(), testsForConcept);
        }).toList();

        return new StudentVisualProgressDTO(totalTestsTaken, retestCount, masteredCount, totalConcepts,
                avgMastery, accuracy, briefList, history);
    }
}
