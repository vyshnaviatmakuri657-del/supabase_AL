package com.learnpath.service;

import com.learnpath.dto.ApiDtos.*;
import com.learnpath.entity.Concept;
import com.learnpath.entity.ConceptMastery;
import com.learnpath.entity.QuizAttempt;
import com.learnpath.repository.ConceptMasteryRepository;
import com.learnpath.repository.ConceptRepository;
import com.learnpath.repository.QuizAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MasteryService {
    private final ConceptMasteryRepository masteryRepository;
    private final QuizAttemptRepository attemptRepository;
    private final ConceptRepository conceptRepository;
    private final com.learnpath.repository.DependencyRepository dependencyRepository;

    public MasteryService(ConceptMasteryRepository masteryRepository, QuizAttemptRepository attemptRepository,
                         ConceptRepository conceptRepository, com.learnpath.repository.DependencyRepository dependencyRepository) {
        this.masteryRepository = masteryRepository;
        this.attemptRepository = attemptRepository;
        this.conceptRepository = conceptRepository;
        this.dependencyRepository = dependencyRepository;
    }

    @Transactional
    public ConceptMastery recalculate(Integer studentId, Integer conceptId) {
        List<QuizAttempt> attempts = attemptRepository.findByStudentIdAndConceptId(studentId, conceptId);
        ConceptMastery mastery = masteryRepository.findByStudentIdAndConceptId(studentId, conceptId)
                .orElseGet(() -> new ConceptMastery(studentId, conceptId));
        int total = attempts.size();

        // Calculate latest demonstrated mastery per question so retaking after learning successfully masters the concept
        Map<Integer, QuizAttempt> latestPerQuestion = new HashMap<>();
        for (QuizAttempt a : attempts) {
            latestPerQuestion.put(a.questionId, a);
        }
        int uniqueQuestions = latestPerQuestion.size();
        int latestCorrect = (int) latestPerQuestion.values().stream().filter(a -> a.correct).count();
        double latestScore = uniqueQuestions == 0 ? 0.0 : Math.round((latestCorrect * 1000.0) / uniqueQuestions) / 10.0;

        int totalCorrect = (int) attempts.stream().filter(a -> a.correct).count();
        double cumulativeScore = total == 0 ? 0.0 : Math.round((totalCorrect * 1000.0) / total) / 10.0;

        mastery.totalAttempts = total;
        mastery.correctAnswers = latestCorrect;
        mastery.masteryScore = Math.max(latestScore, cumulativeScore);
        if (total > 0 && mastery.masteryScore < 75.0) {
            mastery.assignedClassType = "ALTERNATIVE";
        } else if (mastery.assignedClassType == null) {
            mastery.assignedClassType = "PRIMARY";
        }
        mastery.updatedAt = java.time.LocalDateTime.now();
        return masteryRepository.save(mastery);
    }

    @Transactional
    public ConceptMastery setAssignedClassType(Integer studentId, Integer conceptId, String classType) {
        ConceptMastery mastery = masteryRepository.findByStudentIdAndConceptId(studentId, conceptId)
                .orElseGet(() -> new ConceptMastery(studentId, conceptId));
        mastery.assignedClassType = "ALTERNATIVE".equalsIgnoreCase(classType) ? "ALTERNATIVE" : "PRIMARY";
        mastery.updatedAt = java.time.LocalDateTime.now();
        return masteryRepository.save(mastery);
    }

    public boolean isConceptUnlocked(Integer studentId, Integer conceptId) {
        if (studentId == null || conceptId == null) return false;
        List<com.learnpath.entity.Dependency> deps = dependencyRepository.findByDependentConceptId(conceptId);
        if (deps.isEmpty()) return true; // root concepts have no prerequisites
        for (com.learnpath.entity.Dependency dep : deps) {
            Optional<ConceptMastery> opt = masteryRepository.findByStudentIdAndConceptId(studentId, dep.prerequisiteConceptId);
            if (opt.isEmpty() || opt.get().totalAttempts == 0 || opt.get().masteryScore < 75.0) {
                return false;
            }
        }
        return true;
    }

    public List<String> getPrerequisiteNames(Integer conceptId) {
        List<com.learnpath.entity.Dependency> deps = dependencyRepository.findByDependentConceptId(conceptId);
        return deps.stream()
                .map(d -> conceptRepository.findById(d.prerequisiteConceptId).map(c -> c.name).orElse("Prerequisite"))
                .toList();
    }

    public List<MasteryDTO> getMasteryForSubject(Integer studentId, Integer subjectId) {
        List<Concept> concepts = conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(subjectId);
        Map<Integer, ConceptMastery> masteryMap = masteryRepository.findByStudentId(studentId).stream()
                .collect(Collectors.toMap(m -> m.conceptId, m -> m, (a, b) -> a));
        return concepts.stream().map(c -> {
            ConceptMastery m = masteryMap.get(c.id);
            double score = m == null ? 0.0 : m.masteryScore;
            int correct = m == null ? 0 : m.correctAnswers;
            int attempts = m == null ? 0 : m.totalAttempts;
            boolean unlocked = isConceptUnlocked(studentId, c.id);
            List<String> prereqs = getPrerequisiteNames(c.id);
            String stat = (!unlocked && attempts == 0) ? "LOCKED" : status(score, attempts);
            String assignedClass = (m == null || m.assignedClassType == null) ? "PRIMARY" : m.assignedClassType;
            return new MasteryDTO(c.id, c.name, score, correct, attempts, stat, unlocked, prereqs, assignedClass);
        }).toList();
    }

    public static String status(double score, int attempts) {
        if (attempts == 0) return "NOT_ASSESSED";
        if (score >= 75) return "MASTERED";
        if (score >= 50) return "NEEDS_PRACTICE";
        return "WEAK";
    }
}
