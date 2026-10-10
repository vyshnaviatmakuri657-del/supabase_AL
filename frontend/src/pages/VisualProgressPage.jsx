import React, { useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api.js';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

export default function VisualProgressPage({ studentId, subjectId = 1, onTakeQuiz, onOpenLesson }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    loadVisualProgress();
  }, [studentId, subjectId]);

  async function loadVisualProgress() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/students/${studentId}/visual-progress`, {
        params: { subjectId }
      });
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <span className="sync-spinner" />
        <p>Loading your visual learning progress…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card admin-error-card">
        <h3>Could not load visual progress</h3>
        <p>{error}</p>
        <button className="button button-primary" onClick={loadVisualProgress}>Retry</button>
      </div>
    );
  }

  const {
    totalTestsTaken = 0,
    retestCount = 0,
    conceptsMastered = 0,
    totalConcepts = 5,
    averageMastery = 0,
    accuracyPercent = 0,
    conceptMastery = [],
    testHistory = []
  } = data || {};

  // Radar data
  const radarData = conceptMastery.map(cm => ({
    concept: cm.conceptName,
    score: cm.masteryScore,
    benchmark: 75
  }));

  // Bar data: tests taken per concept
  const attemptsPerConceptData = conceptMastery.map(cm => ({
    name: cm.conceptName,
    testsTaken: cm.testsTaken,
    score: cm.masteryScore,
    status: cm.status
  }));

  // Pie data: Mastered vs In-Progress
  const pieData = [
    { name: 'Mastered (≥75%)', value: conceptsMastered, color: '#10b981' },
    { name: 'In Progress / Locked', value: Math.max(0, totalConcepts - conceptsMastered), color: 'rgba(255, 255, 255, 0.14)' }
  ];

  const COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="visual-progress-container">
      {/* Header */}
      <div className="visual-header-row">
        <div>
          <span className="visual-badge">📊 PERSONAL LEARNING ANALYTICS</span>
          <h2>My Visual Progress &amp; Performance Report</h2>
          <p className="muted">
            Track your concept mastery curves, test &amp; retest attempt history, and score progression over time.
          </p>
        </div>
        <div>
          <button className="button button-secondary" onClick={loadVisualProgress}>
            ↻ Refresh Analytics
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL TESTS TAKEN</span>
          <div className="kpi-value text-indigo">{totalTestsTaken}</div>
          <span className="kpi-sub">Total quiz submissions</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">PRACTICE RETESTS</span>
          <div className="kpi-value text-amber">{retestCount}</div>
          <span className="kpi-sub">Retakes beyond first attempt</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">CONCEPTS MASTERED</span>
          <div className="kpi-value text-emerald">{conceptsMastered} / {totalConcepts}</div>
          <span className="kpi-sub">Achieved &ge; 75% mastery</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">OVERALL ACCURACY</span>
          <div className="kpi-value text-cyan">{accuracyPercent}%</div>
          <span className="kpi-sub">Correct questions answered</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">AVERAGE MASTERY</span>
          <div className="kpi-value">{averageMastery}%</div>
          <span className="kpi-sub">Across curriculum concepts</span>
        </div>
      </div>

      {/* Visual Graphs Grid */}
      <div className="chart-grid">
        {/* CHART 1: Concept Mastery Radar */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>My Mastery Radar Profile</h3>
              <p className="muted small">Visual mastery comparison across all 5 programming topics.</p>
            </div>
            <span className="chart-tag">RADAR</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                <PolarAngleAxis dataKey="concept" stroke="#a5b4fc" fontSize={13.5} tick={{ fill: '#a5b4fc' }} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tick={{ fill: '#64748b' }} />
                <Radar name="My Mastery" dataKey="score" stroke="#818cf8" fill="#6366f1" fillOpacity={0.45} />
                <Radar name="Unlock Benchmark (75%)" dataKey="benchmark" stroke="#10b981" strokeDasharray="3 3" fill="none" />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '8px', color: '#858ca5' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <strong>{payload[0].payload.concept}</strong>
                          <p>Score: <strong style={{ color: '#818cf8' }}>{payload[0].payload.score}%</strong></p>
                          <p>Benchmark: <strong style={{ color: '#34d399' }}>75%</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Tests & Retests per Concept */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Tests Taken per Concept</h3>
              <p className="muted small">How many times you attempted each concept quiz.</p>
            </div>
            <span className="chart-tag">ATTEMPTS</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attemptsPerConceptData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="name" stroke="#858ca5" fontSize={13.5} tickLine={false} tick={{ fill: '#858ca5' }} />
                <YAxis stroke="#858ca5" fontSize={13.5} allowDecimals={false} tick={{ fill: '#858ca5' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <strong>{d.name}</strong>
                          <p>Tests Taken: <strong>{d.testsTaken}</strong></p>
                          <p>Current Score: <strong>{d.score}%</strong></p>
                          <p>Status: <strong>{d.status}</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="testsTaken" radius={[6, 6, 0, 0]} name="Tests Taken">
                  {attemptsPerConceptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Score Progression Timeline */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Test Score Progression Timeline</h3>
              <p className="muted small">Your quiz performance evolution over consecutive tests and retests.</p>
            </div>
            <span className="chart-tag">TIMELINE</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            {testHistory.length === 0 ? (
              <div className="chart-empty">Take your first concept quiz to view score progression!</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={testHistory} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="completedAt" stroke="#858ca5" fontSize={13} tick={{ fill: '#858ca5' }} />
                  <YAxis domain={[0, 100]} stroke="#858ca5" fontSize={13.5} unit="%" tick={{ fill: '#858ca5' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="custom-tooltip">
                            <strong>{d.conceptName} ({d.attemptNumber === 1 ? 'Initial' : `Retest #${d.attemptNumber}`})</strong>
                            <p>Score: <strong>{d.scorePercent}%</strong></p>
                            <p>Correct: <strong>{d.correctAnswers} / {d.totalQuestions}</strong></p>
                            <p>Result: <strong>{d.passed ? '✓ Passed (≥75%)' : '⚠ Retest Needed'}</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scorePercent"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                    name="Score (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: Curriculum Completion Donut */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Curriculum Mastery Completion</h3>
              <p className="muted small">Concepts mastered (&ge; 75%) vs remaining curriculum topics.</p>
            </div>
            <span className="chart-tag">COMPLETION</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  stroke="rgba(11, 17, 40, 0.8)"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="custom-tooltip">
                          <strong>{item.name}</strong>
                          <p>Count: <strong style={{ color: '#38bdf8' }}>{item.value} concepts</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '8px', color: '#858ca5' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chronological Test History Table */}
      <div className="card table-card" style={{ marginTop: '24px' }}>
        <div className="table-header-row">
          <div>
            <h3>Chronological Quiz & Retest History</h3>
            <p className="muted small">Every test session completed with exact score breakdown and pass outcome.</p>
          </div>
          <span className="badge badge-neutral">{testHistory.length} Test Submissions</span>
        </div>

        {testHistory.length === 0 ? (
          <div className="empty-history-box">
            <p>You haven't completed any quizzes yet.</p>
            {onTakeQuiz && (
              <button className="button button-primary" onClick={() => onTakeQuiz(1)}>
                Take First Concept Quiz →
              </button>
            )}
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session Date</th>
                  <th>Topic / Concept</th>
                  <th>Attempt Type</th>
                  <th>Correct / Total</th>
                  <th>Score (%)</th>
                  <th>Mastery Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {testHistory.map((h) => (
                  <tr key={h.id}>
                    <td className="muted small">{h.completedAt}</td>
                    <td><strong>{h.conceptName}</strong></td>
                    <td>
                      <span className={`pill ${h.attemptNumber > 1 ? 'pill-retest' : 'pill-initial'}`}>
                        {h.attemptNumber === 1 ? 'Initial Test' : `Retest #${h.attemptNumber}`}
                      </span>
                    </td>
                    <td>{h.correctAnswers} / {h.totalQuestions} questions</td>
                    <td>
                      <span className="score-badge">
                        {h.scorePercent}%
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${h.passed ? 'pill-mastered' : 'pill-weak'}`}>
                        {h.passed ? '✓ PASSED (≥75%)' : '⚠ RETEST RECOMMENDED'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="button button-small button-outline"
                        onClick={() => onTakeQuiz && onTakeQuiz(h.conceptId)}
                        title="Retest or practice this concept"
                      >
                        {h.passed ? 'Practice Again ↺' : 'Retake Quiz ↻'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
