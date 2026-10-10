package com.learnpath.service;

import com.learnpath.dto.ApiDtos.*;
import com.learnpath.entity.*;
import com.learnpath.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@Service
public class QuizService {
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final ConceptRepository conceptRepository;
    private final QuizAttemptRepository attemptRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final MasteryService masteryService;
    private final LessonRepository lessonRepository;

    public QuizService(StudentRepository studentRepository, SubjectRepository subjectRepository,
                       QuestionRepository questionRepository, ConceptRepository conceptRepository,
                       QuizAttemptRepository attemptRepository, QuizSessionRepository quizSessionRepository,
                       MasteryService masteryService, LessonRepository lessonRepository) {
        this.studentRepository = studentRepository;
        this.subjectRepository = subjectRepository;
        this.questionRepository = questionRepository;
        this.conceptRepository = conceptRepository;
        this.attemptRepository = attemptRepository;
        this.quizSessionRepository = quizSessionRepository;
        this.masteryService = masteryService;
        this.lessonRepository = lessonRepository;
    }

    @Transactional
    public QuizResultDTO submit(QuizSubmissionDTO submission) {
        if (submission == null || submission.studentId() == null || submission.subjectId() == null ||
                submission.answers() == null || submission.answers().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId, subjectId and at least one answer are required.");
        }
        if (!studentRepository.existsById(submission.studentId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found.");
        }
        if (!subjectRepository.existsById(submission.subjectId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject was not found.");
        }

        Set<Integer> touchedConcepts = new LinkedHashSet<>();
        int correctCount = 0;
        for (AnswerDTO answer : submission.answers()) {
            if (answer == null || answer.questionId() == null || answer.selectedOption() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each answer requires questionId and selectedOption.");
            }
            String selected = answer.selectedOption().trim().toUpperCase(Locale.ROOT);
            if (!Set.of("A", "B", "C", "D").contains(selected)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "selectedOption must be A, B, C or D.");
            }
            Question q = questionRepository.findById(answer.questionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question " + answer.questionId() + " was not found."));
            Concept c = conceptRepository.findById(q.conceptId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question is linked to an unknown concept."));
            if (!Objects.equals(c.subjectId, submission.subjectId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A question does not belong to the selected subject.");
            }
            if (!masteryService.isConceptUnlocked(submission.studentId(), q.conceptId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Concept \"" + c.name + "\" is locked! You must completely learn its prerequisite concept(s) with at least 75% mastery first.");
            }
            boolean correct = selected.equalsIgnoreCase(q.correctOption);
            attemptRepository.save(new QuizAttempt(submission.studentId(), q.conceptId, q.id, selected, correct));
            touchedConcepts.add(q.conceptId);
            if (correct) correctCount++;
        }
        touchedConcepts.forEach(id -> masteryService.recalculate(submission.studentId(), id));
        List<MasteryDTO> allMastery = masteryService.getMasteryForSubject(submission.studentId(), submission.subjectId());
        List<ConceptResultDTO> results = allMastery.stream()
                .filter(m -> touchedConcepts.contains(m.conceptId()))
                .map(m -> new ConceptResultDTO(m.conceptId(), m.conceptName(), m.masteryScore(),
                        m.correctAnswers(), m.totalAttempts(), m.status())).toList();
        double percent = Math.round((correctCount * 1000.0) / submission.answers().size()) / 10.0;

        // Record persistent QuizSession
        Integer primaryConceptId = touchedConcepts.isEmpty() ? null : touchedConcepts.iterator().next();
        if (primaryConceptId != null) {
            int attemptNumber = quizSessionRepository.countByStudentIdAndConceptId(submission.studentId(), primaryConceptId) + 1;
            quizSessionRepository.save(new QuizSession(
                    submission.studentId(),
                    submission.subjectId(),
                    primaryConceptId,
                    submission.answers().size(),
                    correctCount,
                    percent,
                    percent >= 75.0,
                    attemptNumber
            ));
        }

        boolean conceptMastered = results.stream().anyMatch(r -> r.masteryScore() >= 75.0);
        String nextConceptName = null;
        Integer nextConceptId = null;

        for (MasteryDTO m : allMastery) {
            if (m.unlocked() && m.masteryScore() < 75.0) {
                nextConceptName = m.conceptName();
                nextConceptId = m.conceptId();
                break;
            }
        }

        boolean switchedToAlternativeClass = percent < 75.0;
        String assignedClassType = switchedToAlternativeClass ? "ALTERNATIVE" : "PRIMARY";
        Lesson assignedLesson = null;
        if (primaryConceptId != null) {
            assignedLesson = lessonRepository.findByConceptIdAndClassType(primaryConceptId, assignedClassType)
                    .or(() -> lessonRepository.findFirstByConceptIdOrderByClassTypeAsc(primaryConceptId))
                    .orElse(null);
        }
        Integer assignedLessonId = assignedLesson != null ? assignedLesson.id : null;
        String assignedLessonTitle = assignedLesson != null ? assignedLesson.title : null;
        String adaptiveMessage;
        if (switchedToAlternativeClass) {
            adaptiveMessage = "Your test score was " + percent + "% (< 75% threshold). The adaptive learning engine has automatically switched your track to Class 2 (Alternative Track) with visual analogies and error walkthroughs to reinforce your understanding before retrying!";
        } else {
            adaptiveMessage = "Outstanding! You scored " + percent + "% and achieved the 75% mastery requirement! You are now cleared to advance.";
        }

        return new QuizResultDTO(submission.studentId(), submission.answers().size(), correctCount, percent, results,
                conceptMastered, nextConceptName, nextConceptId,
                switchedToAlternativeClass, assignedClassType, assignedLessonId, assignedLessonTitle, adaptiveMessage);
    }
}
