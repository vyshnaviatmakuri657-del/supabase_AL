package com.learnpath.controller;

import com.learnpath.dto.ApiDtos.*;
import com.learnpath.entity.Concept;
import com.learnpath.entity.Dependency;
import com.learnpath.entity.Lesson;
import com.learnpath.entity.Question;
import com.learnpath.entity.QuizSession;
import com.learnpath.entity.Student;
import com.learnpath.entity.Subject;
import com.learnpath.repository.*;
import com.learnpath.service.MasteryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final StudentRepository studentRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final ConceptRepository conceptRepository;
    private final MasteryService masteryService;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final DependencyRepository dependencyRepository;
    private final LessonRepository lessonRepository;
    private final ConceptMasteryRepository masteryRepository;

    public AdminController(StudentRepository studentRepository, QuizSessionRepository quizSessionRepository,
                           ConceptRepository conceptRepository, MasteryService masteryService,
                           SubjectRepository subjectRepository, QuestionRepository questionRepository,
                           DependencyRepository dependencyRepository, LessonRepository lessonRepository,
                           ConceptMasteryRepository masteryRepository) {
        this.studentRepository = studentRepository;
        this.quizSessionRepository = quizSessionRepository;
        this.conceptRepository = conceptRepository;
        this.masteryService = masteryService;
        this.subjectRepository = subjectRepository;
        this.questionRepository = questionRepository;
        this.dependencyRepository = dependencyRepository;
        this.lessonRepository = lessonRepository;
        this.masteryRepository = masteryRepository;
    }

    @GetMapping("/analytics")
    public AdminAnalyticsDTO getAnalytics(@RequestParam(defaultValue = "1") Integer subjectId) {
        List<Student> allStudents = studentRepository.findAll().stream()
                .filter(s -> !"ADMIN".equalsIgnoreCase(s.role))
                .toList();
        List<QuizSession> allSessions = quizSessionRepository.findAllByOrderByCompletedAtDesc();
        List<Concept> concepts = conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(subjectId);
        Map<Integer, Concept> conceptMap = new HashMap<>();
        concepts.forEach(c -> conceptMap.put(c.id, c));

        int totalStudents = allStudents.size();
        int totalTestsTaken = allSessions.size();
        double overallAvgScore = allSessions.isEmpty() ? 0.0 :
                Math.round(allSessions.stream().mapToDouble(s -> s.scorePercent).average().orElse(0.0) * 10) / 10.0;
        long passedCount = allSessions.stream().filter(s -> Boolean.TRUE.equals(s.passed)).count();
        double overallPassRate = allSessions.isEmpty() ? 0.0 :
                Math.round((passedCount * 1000.0) / totalTestsTaken) / 10.0;

        // Concept stats
        List<AdminConceptStatDTO> conceptStats = concepts.stream().map(c -> {
            List<QuizSession> cSessions = allSessions.stream().filter(s -> Objects.equals(s.conceptId, c.id)).toList();
            int cTests = cSessions.size();
            double cAvgScore = cSessions.isEmpty() ? 0.0 :
                    Math.round(cSessions.stream().mapToDouble(s -> s.scorePercent).average().orElse(0.0) * 10) / 10.0;
            int cPass = (int) cSessions.stream().filter(s -> Boolean.TRUE.equals(s.passed)).count();
            int cFail = cTests - cPass;
            double cPassRate = cTests == 0 ? 0.0 : Math.round((cPass * 1000.0) / cTests) / 10.0;
            return new AdminConceptStatDTO(c.id, c.name, cTests, cAvgScore, cPass, cFail, cPassRate);
        }).toList();

        // Student stats
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        List<AdminStudentStatDTO> studentStats = allStudents.stream().map(student -> {
            List<QuizSession> sSessions = allSessions.stream().filter(s -> Objects.equals(s.studentId, student.id)).toList();
            int sTests = sSessions.size();
            double sAvgScore = sSessions.isEmpty() ? 0.0 :
                    Math.round(sSessions.stream().mapToDouble(s -> s.scorePercent).average().orElse(0.0) * 10) / 10.0;
            String lastActive = sSessions.isEmpty() ? "No tests yet" :
                    sSessions.get(0).completedAt.format(dtf);

            List<MasteryDTO> mastery = masteryService.getMasteryForSubject(student.id, subjectId);
            int masteredCount = (int) mastery.stream().filter(m -> "MASTERED".equals(m.status())).count();

            List<ConceptMasteryBriefDTO> conceptBriefs = mastery.stream().map(m -> {
                int testsForConcept = (int) sSessions.stream().filter(s -> Objects.equals(s.conceptId, m.conceptId())).count();
                return new ConceptMasteryBriefDTO(m.conceptId(), m.conceptName(), m.masteryScore(), m.status(), testsForConcept);
            }).toList();

            return new AdminStudentStatDTO(student.id, student.name, student.email, sTests,
                    masteredCount, sAvgScore, lastActive, conceptBriefs);
        }).toList();

        return new AdminAnalyticsDTO(totalStudents, totalTestsTaken, overallAvgScore, overallPassRate,
                conceptStats, studentStats);
    }

    @GetMapping("/students/{studentId}/history")
    public List<StudentTestHistoryDTO> getStudentHistory(@PathVariable Integer studentId) {
        List<QuizSession> sessions = quizSessionRepository.findByStudentIdOrderByCompletedAtAsc(studentId);
        Map<Integer, Concept> conceptMap = new HashMap<>();
        conceptRepository.findAll().forEach(c -> conceptMap.put(c.id, c));
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");

        return sessions.stream().map(s -> {
            String cName = conceptMap.containsKey(s.conceptId) ? conceptMap.get(s.conceptId).name : "Concept #" + s.conceptId;
            String dateStr = s.completedAt != null ? s.completedAt.format(dtf) : "Recent";
            return new StudentTestHistoryDTO(s.id, s.conceptId, cName, s.attemptNumber != null ? s.attemptNumber : 1,
                    s.scorePercent, s.correctAnswers, s.totalQuestions, Boolean.TRUE.equals(s.passed), dateStr);
        }).toList();
    }

    // --- CURRICULUM MANAGEMENT: SUBJECTS, CLASSES/CONCEPTS, QUESTIONS ---

    @PostMapping("/subjects")
    public Subject createSubject(@RequestBody CreateSubjectDTO dto) {
        if (dto.name() == null || dto.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject name is required.");
        }
        if (subjectRepository.findByName(dto.name().trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subject with name '" + dto.name() + "' already exists.");
        }
        return subjectRepository.save(new Subject(dto.name().trim(), dto.description()));
    }

    @PostMapping({"/concepts", "/classes"})
    public Concept createConceptOrClass(@RequestBody CreateConceptDTO dto) {
        if (dto.subjectId() == null || !subjectRepository.existsById(dto.subjectId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid subject ID is required.");
        }
        if (dto.name() == null || dto.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class/Concept name is required.");
        }
        int order = dto.displayOrder() != null ? dto.displayOrder() :
                conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(dto.subjectId()).size() + 1;
        Concept saved = conceptRepository.save(new Concept(dto.subjectId(), dto.name().trim(), dto.description(), order));

        // Optional Prerequisite Dependency
        if (dto.prerequisiteConceptId() != null && dto.prerequisiteConceptId() > 0) {
            if (conceptRepository.existsById(dto.prerequisiteConceptId())) {
                dependencyRepository.save(new Dependency(dto.prerequisiteConceptId(), saved.id));
            }
        }

        // Optional Lesson Content
        if (dto.lessonTitle() != null && !dto.lessonTitle().trim().isEmpty() &&
                dto.lessonContent() != null && !dto.lessonContent().trim().isEmpty()) {
            lessonRepository.save(new Lesson(saved.id, dto.lessonTitle().trim(), "PRIMARY", "Core curriculum class", dto.lessonContent().trim(), dto.exampleCode()));
        }

        return saved;
    }

    @PutMapping("/concepts/{id}")
    @org.springframework.transaction.annotation.Transactional
    public Concept updateConcept(@PathVariable Integer id, @RequestBody UpdateConceptDTO dto) {
        Concept concept = conceptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Concept not found."));
        if (dto.name() != null && !dto.name().trim().isEmpty()) {
            concept.name = dto.name().trim();
        }
        if (dto.description() != null) {
            concept.description = dto.description().trim();
        }
        if (dto.displayOrder() != null && dto.displayOrder() > 0) {
            concept.displayOrder = dto.displayOrder();
        }
        Concept saved = conceptRepository.save(concept);

        // Update prerequisite dependency if provided
        if (dto.prerequisiteConceptId() != null) {
            dependencyRepository.deleteAll(dependencyRepository.findByDependentConceptId(id));
            if (dto.prerequisiteConceptId() > 0 && !dto.prerequisiteConceptId().equals(id)) {
                if (conceptRepository.existsById(dto.prerequisiteConceptId())) {
                    dependencyRepository.save(new Dependency(dto.prerequisiteConceptId(), id));
                }
            }
        }
        return saved;
    }

    @DeleteMapping("/concepts/{id}")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> deleteConcept(@PathVariable Integer id) {
        if (!conceptRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Concept not found.");
        }
        dependencyRepository.deleteAll(dependencyRepository.findByDependentConceptId(id));
        dependencyRepository.deleteAll(dependencyRepository.findByPrerequisiteConceptId(id));
        lessonRepository.deleteAll(lessonRepository.findByConceptId(id));
        questionRepository.deleteAll(questionRepository.findByConceptId(id));
        masteryRepository.deleteAll(masteryRepository.findByConceptId(id));
        conceptRepository.deleteById(id);
        return Map.of("success", true, "deletedId", id);
    }

    @GetMapping("/dependencies")
    public List<DependencyDetailDTO> getDependencies(@RequestParam(required = false) Integer subjectId) {
        Map<Integer, Concept> conceptMap = new HashMap<>();
        conceptRepository.findAll().forEach(c -> conceptMap.put(c.id, c));
        return dependencyRepository.findAll().stream()
                .filter(d -> {
                    if (subjectId == null) return true;
                    Concept prereq = conceptMap.get(d.prerequisiteConceptId);
                    Concept dep = conceptMap.get(d.dependentConceptId);
                    return (prereq != null && Objects.equals(prereq.subjectId, subjectId)) ||
                           (dep != null && Objects.equals(dep.subjectId, subjectId));
                })
                .map(d -> new DependencyDetailDTO(
                        d.id,
                        d.prerequisiteConceptId,
                        conceptMap.containsKey(d.prerequisiteConceptId) ? conceptMap.get(d.prerequisiteConceptId).name : "Topic #" + d.prerequisiteConceptId,
                        d.dependentConceptId,
                        conceptMap.containsKey(d.dependentConceptId) ? conceptMap.get(d.dependentConceptId).name : "Topic #" + d.dependentConceptId
                ))
                .toList();
    }

    @PostMapping("/dependencies")
    public Dependency createDependency(@RequestBody CreateDependencyDTO dto) {
        if (dto.prerequisiteConceptId() == null || dto.dependentConceptId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both prerequisite and dependent concept IDs are required.");
        }
        if (dto.prerequisiteConceptId().equals(dto.dependentConceptId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A topic cannot depend on itself.");
        }
        if (!conceptRepository.existsById(dto.prerequisiteConceptId()) || !conceptRepository.existsById(dto.dependentConceptId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both concepts must exist.");
        }
        boolean exists = dependencyRepository.findByDependentConceptId(dto.dependentConceptId()).stream()
                .anyMatch(d -> d.prerequisiteConceptId.equals(dto.prerequisiteConceptId()));
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dependency already exists.");
        }
        return dependencyRepository.save(new Dependency(dto.prerequisiteConceptId(), dto.dependentConceptId()));
    }

    @DeleteMapping("/dependencies")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> deleteDependency(@RequestParam Integer prerequisiteId, @RequestParam Integer dependentId) {
        List<Dependency> deps = dependencyRepository.findByDependentConceptId(dependentId).stream()
                .filter(d -> d.prerequisiteConceptId.equals(prerequisiteId))
                .toList();
        dependencyRepository.deleteAll(deps);
        return Map.of("success", true, "deletedCount", deps.size());
    }

    @PostMapping("/lessons")
    public Lesson createLesson(@RequestBody CreateLessonDTO dto) {
        if (dto.conceptId() == null || !conceptRepository.existsById(dto.conceptId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid concept/class ID is required.");
        }
        if (dto.title() == null || dto.title().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class/Lesson title is required.");
        }
        String classType = (dto.classType() != null && "ALTERNATIVE".equalsIgnoreCase(dto.classType().trim())) ? "ALTERNATIVE" : "PRIMARY";
        String tagline = dto.tagline() != null && !dto.tagline().trim().isEmpty() ? dto.tagline().trim() :
                ("ALTERNATIVE".equals(classType) ? "Alternative remedial class" : "Core primary track class");
        return lessonRepository.save(new Lesson(
                dto.conceptId(),
                dto.title().trim(),
                classType,
                tagline,
                dto.content(),
                dto.exampleCode()
        ));
    }

    @PostMapping("/questions")
    public Question createQuestion(@RequestBody CreateQuestionDTO dto) {
        if (dto.conceptId() == null || !conceptRepository.existsById(dto.conceptId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid concept/class ID is required.");
        }
        if (dto.questionText() == null || dto.questionText().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question text is required.");
        }
        if (dto.optionA() == null || dto.optionB() == null || dto.optionC() == null || dto.optionD() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All four options (A, B, C, D) are required.");
        }
        String correct = dto.correctOption() == null ? "" : dto.correctOption().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("A", "B", "C", "D").contains(correct)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct option must be A, B, C, or D.");
        }
        return questionRepository.save(new Question(
                dto.conceptId(),
                dto.questionText().trim(),
                dto.optionA().trim(),
                dto.optionB().trim(),
                dto.optionC().trim(),
                dto.optionD().trim(),
                correct,
                dto.explanation()
        ));
    }

    @GetMapping("/questions")
    public List<Question> getQuestions(@RequestParam(required = false) Integer conceptId) {
        if (conceptId != null) {
            return questionRepository.findByConceptId(conceptId);
        }
        return questionRepository.findAll();
    }

    @DeleteMapping("/questions/{id}")
    public Map<String, Object> deleteQuestion(@PathVariable Integer id) {
        if (!questionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found.");
        }
        questionRepository.deleteById(id);
        return Map.of("success", true, "deletedId", id);
    }
}
