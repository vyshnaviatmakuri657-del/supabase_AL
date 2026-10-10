# API Notes

Base URL: `http://localhost:8080/api`

All request and response bodies use JSON. `POST /quiz/submit` and `POST /quiz/retest` accept a `QuizSubmissionDTO`; selected options are A, B, C, or D. The server checks each question's subject before grading it.

Questions are returned without the `correctOption` field. Do not add the correct answer to the client-side diagnostic response.

For a full diagnostic, submit all question IDs returned by `GET /quiz/diagnostic?subjectId={subjectId}`. The MVP endpoint accepts partial submissions too, which can be useful for practice quizzes.
