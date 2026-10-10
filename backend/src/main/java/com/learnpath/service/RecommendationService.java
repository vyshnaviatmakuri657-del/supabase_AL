package com.learnpath.service;

import com.learnpath.dto.ApiDtos.RecommendationDTO;
import com.learnpath.entity.*;
import com.learnpath.repository.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    private final ConceptRepository conceptRepository;
    private final DependencyRepository dependencyRepository;
    private final ConceptMasteryRepository masteryRepository;
    private final LessonRepository lessonRepository;

    public RecommendationService(ConceptRepository conceptRepository, DependencyRepository dependencyRepository,
                                 ConceptMasteryRepository masteryRepository, LessonRepository lessonRepository) {
        this.conceptRepository = conceptRepository;
        this.dependencyRepository = dependencyRepository;
        this.masteryRepository = masteryRepository;
        this.lessonRepository = lessonRepository;
    }

    public RecommendationDTO getNextRecommendation(Integer studentId, Integer subjectId) {
        List<Concept> concepts = conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(subjectId);
        if (concepts.isEmpty()) {
            return new RecommendationDTO(studentId, subjectId, null, null, 0, "NOT_CONFIGURED",
                    "NONE", null, null, "PRIMARY", "No concepts have been configured for this subject.",
                    "Add concepts and lessons before generating recommendations.", false);
        }
        Set<Integer> conceptIds = concepts.stream().map(c -> c.id).collect(Collectors.toSet());
        Map<Integer, ConceptMastery> masteryMap = masteryRepository.findByStudentId(studentId).stream()
                .filter(m -> conceptIds.contains(m.conceptId))
                .collect(Collectors.toMap(m -> m.conceptId, m -> m, (a, b) -> a));
        Map<Integer, List<Integer>> prerequisites = new HashMap<>();
        for (Dependency d : dependencyRepository.findAll()) {
            if (conceptIds.contains(d.prerequisiteConceptId) && conceptIds.contains(d.dependentConceptId)) {
                prerequisites.computeIfAbsent(d.dependentConceptId, k -> new ArrayList<>()).add(d.prerequisiteConceptId);
            }
        }

        // Topological/display order: choose the first unfinished concept whose prerequisites are mastered.
        for (Concept concept : concepts) {
            ConceptMastery mastery = masteryMap.get(concept.id);
            double score = mastery == null ? 0.0 : mastery.masteryScore;
            int attempts = mastery == null ? 0 : mastery.totalAttempts;
            if (attempts > 0 && score >= 75) continue;
            boolean prerequisitesReady = prerequisites.getOrDefault(concept.id, List.of()).stream().allMatch(id -> {
                ConceptMastery prerequisiteMastery = masteryMap.get(id);
                return prerequisiteMastery != null && prerequisiteMastery.totalAttempts > 0 && prerequisiteMastery.masteryScore >= 75;
            });
            if (!prerequisitesReady) continue;

            Lesson lesson;
            String assignedClassType;
            String action;
            String reason;
            String nextStep;
            if (attempts == 0) {
                assignedClassType = "PRIMARY";
                lesson = lessonRepository.findByConceptIdAndClassType(concept.id, "PRIMARY")
                        .or(() -> lessonRepository.findFirstByConceptIdOrderByClassTypeAsc(concept.id))
                        .orElse(null);
                action = "START";
                reason = "This is the next concept in the learning path whose prerequisites are ready. Begin with Class 1 (Core Track) to establish a baseline.";
                nextStep = "Read Class 1 lessons, understand core syntax, and take the 75% mastery test.";
            } else {
                // attempts > 0 and score < 75: switch to Alternative Remedial Track!
                assignedClassType = "ALTERNATIVE";
                lesson = lessonRepository.findByConceptIdAndClassType(concept.id, "ALTERNATIVE")
                        .or(() -> lessonRepository.findFirstByConceptIdOrderByClassTypeAsc(concept.id))
                        .orElse(null);
                action = "ALTERNATIVE_CLASS";
                reason = "Your recent test score was " + score + "% (under the 75% pass threshold). You have been switched to Class 2 (Alternative Track) with visual analogies and error walkthroughs.";
                nextStep = "Review Class 2 remedial lesson, then retake the test to demonstrate 75%+ mastery.";
            }
            return new RecommendationDTO(studentId, subjectId, concept.id, concept.name, score,
                    MasteryService.status(score, attempts), action, lesson == null ? null : lesson.id,
                    lesson == null ? "Practice " + concept.name : lesson.title, assignedClassType, reason, nextStep, false);
        }

        boolean allMastered = concepts.stream().allMatch(c -> {
            ConceptMastery m = masteryMap.get(c.id);
            return m != null && m.totalAttempts > 0 && m.masteryScore >= 75;
        });
        if (allMastered) {
            return new RecommendationDTO(studentId, subjectId, null, "All concepts", 100,
                    "MASTERED", "COMPLETE", null, "Learning path completed", "PRIMARY",
                    "You have reached the mastery threshold for every concept in this subject.",
                    "Choose another subject or revisit any concept to strengthen retention.", true);
        }
        return new RecommendationDTO(studentId, subjectId, null, null, 0, "BLOCKED",
                "CHECK_PREREQUISITES", null, "Review prerequisite concepts", "PRIMARY",
                "No unfinished concept is currently eligible because one or more prerequisites are not mastered.",
                "Review the graph and master the earliest unmet prerequisite first.", false);
    }
}
