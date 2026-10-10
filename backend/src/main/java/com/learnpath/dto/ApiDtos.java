package com.learnpath.dto;

import java.util.List;

public final class ApiDtos {
    private ApiDtos() {}

    public record StudentDTO(Integer id, String name, String email, String role) {}
    public record LoginRequestDTO(String email, String password) {}
    public record RegisterRequestDTO(String name, String email, String password) {}
    public record AuthResponseDTO(Integer id, String name, String email, String role, String message) {}

    public record QuestionDTO(Integer id, Integer conceptId, String conceptName, String questionText,
                              String optionA, String optionB, String optionC, String optionD) {}
    public record AnswerDTO(Integer questionId, String selectedOption) {}
    public record QuizSubmissionDTO(Integer studentId, Integer subjectId, List<AnswerDTO> answers) {}
    public record ConceptResultDTO(Integer conceptId, String conceptName, double masteryScore,
                                   int correctAnswers, int totalAttempts, String status) {}
    public record QuizResultDTO(Integer studentId, int totalQuestions, int correctAnswers,
                                double scorePercent, List<ConceptResultDTO> conceptResults,
                                boolean conceptMastered, String nextUnlockedConcept, Integer nextConceptId,
                                boolean switchedToAlternativeClass, String assignedClassType,
                                Integer assignedLessonId, String assignedLessonTitle,
                                String adaptiveMessage) {}
    public record MasteryDTO(Integer conceptId, String conceptName, double masteryScore,
                             int correctAnswers, int totalAttempts, String status,
                             boolean unlocked, List<String> prerequisiteNames,
                             String assignedClassType) {}
    public record RecommendationDTO(Integer studentId, Integer subjectId, Integer conceptId,
                                    String conceptName, double masteryScore, String status,
                                    String action, Integer lessonId, String lessonTitle,
                                    String assignedClassType, String reason, String nextStep,
                                    boolean complete) {}
    public record GraphNodeDTO(String id, String name, String description, double masteryScore,
                               String status, boolean locked, int x, int y) {}
    public record GraphEdgeDTO(String id, String source, String target) {}
    public record GraphDTO(List<GraphNodeDTO> nodes, List<GraphEdgeDTO> edges) {}
    public record ProgressDTO(int conceptCount, int masteredCount, double averageMastery,
                              int attemptedQuestions, int correctAnswers) {}

    // Admin & Visual Reporting DTOs
    public record ConceptMasteryBriefDTO(Integer conceptId, String conceptName, double masteryScore,
                                         String status, int testsTaken) {}
    public record AdminConceptStatDTO(Integer conceptId, String conceptName, int totalTestsTaken,
                                      double averageScore, int passCount, int failCount, double passRate) {}
    public record AdminStudentStatDTO(Integer studentId, String studentName, String studentEmail,
                                      int totalTestsTaken, int conceptsMastered, double averageScore,
                                      String lastActive, List<ConceptMasteryBriefDTO> conceptMastery) {}
    public record AdminAnalyticsDTO(int totalStudents, int totalTestsTaken, double overallAverageScore,
                                    double overallPassRate, List<AdminConceptStatDTO> conceptStats,
                                    List<AdminStudentStatDTO> studentStats) {}
    public record StudentTestHistoryDTO(Integer id, Integer conceptId, String conceptName,
                                        int attemptNumber, double scorePercent, int correctAnswers,
                                        int totalQuestions, boolean passed, String completedAt) {}
    public record StudentVisualProgressDTO(int totalTestsTaken, int retestCount, int conceptsMastered,
                                           int totalConcepts, double averageMastery, double accuracyPercent,
                                           List<ConceptMasteryBriefDTO> conceptMastery,
                                           List<StudentTestHistoryDTO> testHistory) {}

    // Admin Curriculum Creation DTOs
    public record CreateSubjectDTO(String name, String description) {}
    public record CreateConceptDTO(Integer subjectId, String name, String description,
                                  Integer displayOrder, Integer prerequisiteConceptId,
                                  String lessonTitle, String lessonContent, String exampleCode) {}
    public record CreateQuestionDTO(Integer conceptId, String questionText,
                                   String optionA, String optionB, String optionC, String optionD,
                                   String correctOption, String explanation) {}
    public record LessonSummaryDTO(Integer id, Integer conceptId, String conceptName,
                                  String title, String classType, String tagline,
                                  String content, String exampleCode) {}
    public record CreateLessonDTO(Integer conceptId, String title, String classType,
                                 String tagline, String content, String exampleCode) {}
    public record UpdateLessonDTO(String title, String tagline, String content, String exampleCode) {}

    public record UpdateConceptDTO(String name, String description, Integer displayOrder, Integer prerequisiteConceptId) {}
    public record CreateDependencyDTO(Integer prerequisiteConceptId, Integer dependentConceptId) {}
    public record DependencyDetailDTO(Integer id, Integer prerequisiteConceptId, String prerequisiteName,
                                      Integer dependentConceptId, String dependentName) {}

    public record ApiErrorDTO(String error) {}
}
