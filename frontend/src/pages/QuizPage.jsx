import React, { useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../services/api.js';
import StatusPill from '../components/StatusPill.jsx';

const optionKeys = ['A', 'B', 'C', 'D'];

export default function QuizPage({
  studentId,
  subjectId,
  mastery = [],
  initialConceptId = null,
  onSubmitted,
  onBackToDashboard,
  onOpenLesson
}) {
  // Determine default concept: prioritize initialConceptId if unlocked,
  // otherwise find the earliest unlocked concept that is not yet mastered.
  const defaultConceptId = useMemo(() => {
    if (!mastery || !mastery.length) return null;
    if (initialConceptId) {
      const match = mastery.find(m => m.conceptId === Number(initialConceptId));
      if (match && match.unlocked) return match.conceptId;
    }
    const firstUnfinished = mastery.find(m => m.unlocked && m.masteryScore < 75);
    if (firstUnfinished) return firstUnfinished.conceptId;
    const firstUnlocked = mastery.find(m => m.unlocked);
    return firstUnlocked ? firstUnlocked.conceptId : mastery[0].conceptId;
  }, [mastery, initialConceptId]);

  const [selectedConceptId, setSelectedConceptId] = useState(defaultConceptId);
  const [attemptKey, setAttemptKey] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockedNotice, setLockedNotice] = useState('');

  // Update selectedConceptId if defaultConceptId changes and no selection exists
  useEffect(() => {
    if (defaultConceptId && !selectedConceptId) {
      setSelectedConceptId(defaultConceptId);
    }
  }, [defaultConceptId, selectedConceptId]);

  // Load questions for the selected concept (refetches random questions on concept change or retake)
  useEffect(() => {
    if (!selectedConceptId || !studentId) return;
    let active = true;
    setLoading(true);
    setError('');
    setLockedNotice('');
    setResult(null);
    setAnswers({});

    api.get(`/quiz/concept/${selectedConceptId}`, {
      params: { studentId, _t: Date.now() }
    })
      .then(({ data }) => {
        if (active) setQuestions(data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [selectedConceptId, studentId, attemptKey]);

  const currentConceptInfo = useMemo(() => {
    return mastery.find(m => m.conceptId === selectedConceptId) || null;
  }, [mastery, selectedConceptId]);

  function handleSelectConcept(concept) {
    if (!concept.unlocked) {
      const prereqs = (concept.prerequisiteNames || []).join(', ') || 'previous concepts';
      setLockedNotice(`🔒 "${concept.conceptName}" is locked! You must completely learn and score at least 75% on ${prereqs} first.`);
      return;
    }
    setLockedNotice('');
    setSelectedConceptId(concept.conceptId);
    setResult(null);
    setAnswers({});
  }

  async function submitQuiz(event) {
    event.preventDefault();
    if (Object.keys(answers).length !== questions.length) {
      setError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        studentId: Number(studentId),
        subjectId: Number(subjectId),
        answers: questions.map(q => ({ questionId: q.id, selectedOption: answers[q.id] }))
      };
      const { data } = await api.post('/quiz/submit', payload);
      setResult(data);
      await onSubmitted?.(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function retake() {
    setAnswers({});
    setResult(null);
    setError('');
    setAttemptKey(k => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueToNext(nextConceptId) {
    if (!nextConceptId) {
      onBackToDashboard();
      return;
    }
    setSelectedConceptId(nextConceptId);
    setResult(null);
    setAnswers({});
    setAttemptKey(k => k + 1);
  }

  return (
    <div className="page-stack quiz-layout">
      {/* Concept Stepper / Selector Bar */}
      <section className="panel concept-stepper-panel">
        <div className="stepper-header">
          <p className="eyebrow">STEP-BY-STEP LEARNING PATH</p>
          <h2>Sequential Concept Progress</h2>
          <p className="muted small">
            Master each concept with 75%+ quiz score to unlock the next concept in the dependency path.
          </p>
        </div>
        <div className="concept-stepper-list">
          {mastery.map((concept, idx) => {
            const isSelected = concept.conceptId === selectedConceptId;
            const isMastered = concept.masteryScore >= 75;
            const isLocked = !concept.unlocked;

            let pillClass = 'step-pill';
            if (isSelected) pillClass += ' step-selected';
            if (isMastered) pillClass += ' step-mastered';
            else if (isLocked) pillClass += ' step-locked';
            else pillClass += ' step-active';

            return (
              <button
                key={concept.conceptId}
                type="button"
                className={pillClass}
                onClick={() => handleSelectConcept(concept)}
                title={isLocked ? `Locked: Prerequisites (${(concept.prerequisiteNames || []).join(', ')}) required` : `Select ${concept.conceptName}`}
              >
                <span className="step-idx">{idx + 1}</span>
                <span className="step-name">{concept.conceptName}</span>
                <span className="step-status">
                  {isMastered ? '✓ 75%+' : isLocked ? '🔒 Locked' : isSelected ? 'Active' : 'Ready'}
                </span>
              </button>
            );
          })}
        </div>
        {lockedNotice && (
          <div className="inline-notice locked-banner" role="alert">
            {lockedNotice}
          </div>
        )}
      </section>

      {/* Quiz Submission Results */}
      {result && (
        <section className="panel result-panel">
          <div className={`result-burst ${result.conceptMastered ? 'burst-success' : 'burst-warn'}`}>
            {result.conceptMastered ? '🎉' : '⚠️'}
          </div>
          <p className="eyebrow">CONCEPT QUIZ EVALUATION</p>
          <h1>
            {result.conceptMastered
              ? `Concept Completely Learned! (${result.scorePercent}%)`
              : `Needs More Practice (${result.scorePercent}%)`}
          </h1>

          <div className="big-score">
            {result.scorePercent}<span>%</span>
          </div>

          <p className="muted">
            You answered {result.correctAnswers} of {result.totalQuestions} questions correctly for{' '}
            <strong>{currentConceptInfo?.conceptName || 'this concept'}</strong>.
            {result.conceptMastered
              ? ' You have met the 75% mastery threshold to unlock subsequent concepts!'
              : ' You need at least 75% mastery before the next concept unlocks.'}
          </p>

          {/* Newly Unlocked Concept Callout */}
          {result.conceptMastered && result.nextUnlockedConcept && (
            <div className="unlock-celebration-card">
              <div className="unlock-icon">🔓</div>
              <div>
                <strong>Next Concept Unlocked: {result.nextUnlockedConcept}!</strong>
                <p>Great job! You have satisfied the prerequisites for this next topic.</p>
              </div>
              <button
                className="button button-primary"
                onClick={() => continueToNext(result.nextConceptId)}
              >
                Continue to {result.nextUnlockedConcept} Quiz →
              </button>
            </div>
          )}

          {result.conceptMastered && !result.nextUnlockedConcept && (
            <div className="unlock-celebration-card">
              <div className="unlock-icon">🏆</div>
              <div>
                <strong>Learning Path Completed!</strong>
                <p>You have completely mastered all concepts in this curriculum!</p>
              </div>
            </div>
          )}

          {/* Adaptive Switch to Alternative Class Callout */}
          {result.switchedToAlternativeClass && (
            <div
              className="adaptive-remedial-card"
              style={{
                margin: '20px 0',
                padding: '22px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 0 24px rgba(245, 158, 11, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>🔄</span>
                <div>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>
                    Switched to Class 2: Alternative Remedial Track
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#fbbf24', fontWeight: '700' }}>
                    Score &lt; 75% Requirement Triggered Adaptive Remediation
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, color: '#fde68a', fontSize: '14.5px', lineHeight: 1.6 }}>
                {result.adaptiveMessage || `Your test score was ${result.scorePercent}% (< 75% passing mark). The adaptive learning engine has automatically switched your curriculum path to Class 2 (Alternative Track) for visual analogies, intuitive mental models, and step-by-step error walkthroughs.`}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                <button
                  className="button button-primary"
                  onClick={() => onOpenLesson && onOpenLesson(selectedConceptId, 'ALTERNATIVE')}
                >
                  📖 Study Alternative Class: {result.assignedLessonTitle || 'Class 2'} →
                </button>
                <button className="button button-secondary" onClick={retake}>
                  Retake Test Now (New Questions)
                </button>
              </div>
            </div>
          )}

          <div className="result-concepts">
            {(result.conceptResults || []).map((item) => (
              <div className="result-concept-row" key={item.conceptId}>
                <div>
                  <strong>{item.conceptName}</strong>
                  <p className="muted small">
                    {item.correctAnswers}/{item.totalAttempts} correct across attempts
                  </p>
                </div>
                <div className="result-score">
                  <strong>{item.masteryScore}%</strong>
                  <StatusPill status={item.status} />
                </div>
              </div>
            ))}
          </div>

          <div className="inline-actions">
            {result.nextConceptId && result.conceptMastered ? (
              <button
                className="button button-primary"
                onClick={() => continueToNext(result.nextConceptId)}
              >
                Go to Next Concept Quiz →
              </button>
            ) : null}
            <button
              className="button button-secondary"
              onClick={() => onOpenLesson && onOpenLesson(selectedConceptId, result.assignedClassType || 'PRIMARY')}
            >
              📖 Review {result.assignedClassType === 'ALTERNATIVE' ? 'Class 2 (Alternative)' : 'Class 1 (Core)'} Lesson
            </button>
            <button className="button button-secondary" onClick={retake}>
              Retake This Quiz
            </button>
            <button className="button button-quiet" onClick={onBackToDashboard}>
              Back to Dashboard
            </button>
          </div>
        </section>
      )}

      {/* Active Quiz Form */}
      {!result && (
        <>
          <section className="quiz-intro">
            <div className="concept-quiz-tag">
              <span>ACTIVE CONCEPT CHECK</span>
              <strong>{currentConceptInfo?.conceptName || 'Concept Quiz'}</strong>
            </div>
            <h1>Test your understanding of {currentConceptInfo?.conceptName}</h1>
            <p className="muted">
              Answer the questions below. Once you achieve 75%+ mastery, the subsequent concept in your learning path will unlock automatically.
            </p>
            <div className="quiz-progress-line">
              <span>{Object.keys(answers).length} of {questions.length} answered</span>
              <div className="progress-track">
                <div
                  className="progress-value"
                  style={{ width: `${questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </section>

          {loading && <div className="panel loading-panel">Loading questions for this concept…</div>}
          {error && <div className="inline-error" role="alert">{error}</div>}

          {!loading && questions.length > 0 && (
            <form onSubmit={submitQuiz} className="question-groups">
              <section className="panel question-group">
                <div className="question-group-heading">
                  <div className="concept-number">✦</div>
                  <div>
                    <p className="eyebrow">ASSESSMENT</p>
                    <h2>{currentConceptInfo?.conceptName} Questions</h2>
                  </div>
                  <span className="question-count">{questions.length} questions</span>
                </div>

                {questions.map((q, qIndex) => (
                  <div className="question-item" key={q.id}>
                    <p className="question-text">
                      <span>{qIndex + 1}.</span> {q.questionText}
                    </p>
                    <div className="options-grid">
                      {optionKeys.map((key) => (
                        <label
                          key={key}
                          className={`option-card ${answers[q.id] === key ? 'option-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={key}
                            checked={answers[q.id] === key}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: key }))}
                          />
                          <span className="option-key">{key}</span>
                          <span>{q[`option${key}`]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              <div className="submit-row">
                <span className="muted small">
                  Target: 75%+ mastery to unlock next concept. Attempts are recorded to calculate overall concept mastery.
                </span>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={submitting || !questions.length}
                >
                  {submitting ? 'Evaluating…' : 'Submit Concept Answers →'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
