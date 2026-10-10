# LearnPath AI Architecture

## Request flow

1. React requests the student, subject, question bank, mastery, graph, and recommendation data from the REST API.
2. `QuizController` returns public question DTOs that do not contain correct answers.
3. `QuizService` validates submitted options and saves a `QuizAttempt` per answer.
4. `MasteryService` recalculates cumulative correctness for each concept attempted.
5. `RecommendationService` uses mastery and prerequisite edges to choose the next eligible lesson.
6. `GraphService` returns nodes with mastery statuses plus the prerequisite edges; React Flow renders the graph.

## Core rules

- `MASTERED`: at least 80% after at least one recorded attempt.
- `NEEDS_PRACTICE`: 50% to less than 80% after at least one attempt.
- `WEAK`: below 50% after at least one attempt.
- `NOT_ASSESSED`: no attempts recorded.
- A concept is eligible for recommendation when every direct prerequisite has at least one attempt and mastery >= 80%.
- Recommendation order uses `Concept.displayOrder`, which should be aligned with a valid prerequisite/topological ordering by the curriculum designer.

## Data ownership

Curriculum concepts, lessons, questions, and dependency edges are shared data. Quiz attempts and concept mastery are per student. The dependency edges are directional: `prerequisiteConceptId` must be mastered before `dependentConceptId` becomes eligible.

## Graph seed

Variables -> Operators -> Conditions -> Loops -> Arrays, plus Variables -> Arrays. This is sample curriculum data for the demonstration; a real course's prerequisite links should be reviewed by a subject expert.
