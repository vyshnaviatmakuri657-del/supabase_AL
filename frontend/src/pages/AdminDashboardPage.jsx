import React, { useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api.js';
import Dropdown from '../components/Dropdown.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';

export default function AdminDashboardPage({ onSwitchToStudentView, viewMode = 'analytics' }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [adminTab, setAdminTab] = useState(viewMode);

  useEffect(() => {
    setAdminTab(viewMode);
  }, [viewMode]);

  // Curriculum Management state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [concepts, setConcepts] = useState([]);
  const [selectedConceptId, setSelectedConceptId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Subject Form
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  // Class / Concept Form
  const [conceptName, setConceptName] = useState('');
  const [conceptDesc, setConceptDesc] = useState('');
  const [conceptDisplayOrder, setConceptDisplayOrder] = useState('');
  const [conceptPrereqId, setConceptPrereqId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [exampleCode, setExampleCode] = useState('');
  const [creatingConcept, setCreatingConcept] = useState(false);

  // Question Form
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('A');
  const [qExplanation, setQExplanation] = useState('');
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  // Lesson Track Form for existing concept
  const [newLessonConceptId, setNewLessonConceptId] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonTrack, setNewLessonTrack] = useState('ALTERNATIVE');
  const [newLessonTagline, setNewLessonTagline] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonCode, setNewLessonCode] = useState('');
  const [creatingLesson, setCreatingLesson] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    try {
      const res = await api.get('/subjects');
      const list = res.data || [];
      setSubjects(list);
      if (list.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(String(list[0].id));
      }
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  }

  async function loadConcepts(subjId) {
    if (!subjId) return;
    try {
      const res = await api.get('/concepts', { params: { subjectId: subjId } });
      const list = res.data || [];
      setConcepts(list);
      if (list.length > 0) {
        setSelectedConceptId(String(list[0].id));
      } else {
        setSelectedConceptId('');
        setQuestions([]);
      }
    } catch (err) {
      console.error('Failed to load concepts', err);
    }
  }

  async function loadQuestions(conId) {
    if (!conId) {
      setQuestions([]);
      return;
    }
    try {
      const res = await api.get('/admin/questions', { params: { conceptId: conId } });
      setQuestions(res.data || []);
    } catch (err) {
      console.error('Failed to load questions', err);
    }
  }

  useEffect(() => {
    if (adminTab === 'curriculum') {
      loadSubjects();
    }
  }, [adminTab]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadConcepts(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedConceptId) {
      loadQuestions(selectedConceptId);
    }
  }, [selectedConceptId]);

  async function handleSelectStudent(student) {
    setSelectedStudent(student);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/admin/students/${student.studentId}/history`);
      setStudentHistory(res.data);
    } catch (err) {
      console.error('Failed to load student history', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleCreateSubject(e) {
    e.preventDefault();
    if (!subjectName.trim()) {
      setFeedback({ type: 'error', text: 'Subject name is required.' });
      return;
    }
    setCreatingSubject(true);
    setFeedback(null);
    try {
      const res = await api.post('/admin/subjects', {
        name: subjectName.trim(),
        description: subjectDesc.trim()
      });
      setSubjectName('');
      setSubjectDesc('');
      setFeedback({ type: 'success', text: `Subject "${res.data.name}" created successfully!` });
      await loadSubjects();
      setSelectedSubjectId(String(res.data.id));
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to create subject: ${errorMessage(err)}` });
    } finally {
      setCreatingSubject(false);
    }
  }

  async function handleCreateConcept(e) {
    e.preventDefault();
    if (!selectedSubjectId) {
      setFeedback({ type: 'error', text: 'Please select or create a subject first.' });
      return;
    }
    if (!conceptName.trim()) {
      setFeedback({ type: 'error', text: 'Class/Concept name is required.' });
      return;
    }
    setCreatingConcept(true);
    setFeedback(null);
    try {
      const res = await api.post('/admin/concepts', {
        subjectId: Number(selectedSubjectId),
        name: conceptName.trim(),
        description: conceptDesc.trim(),
        displayOrder: conceptDisplayOrder ? Number(conceptDisplayOrder) : null,
        prerequisiteConceptId: conceptPrereqId ? Number(conceptPrereqId) : null,
        lessonTitle: lessonTitle.trim() || `Class: ${conceptName.trim()}`,
        lessonContent: lessonContent.trim() || `Comprehensive learning guide and concepts for ${conceptName.trim()}.`,
        exampleCode: exampleCode.trim()
      });
      setConceptName('');
      setConceptDesc('');
      setConceptDisplayOrder('');
      setConceptPrereqId('');
      setLessonTitle('');
      setLessonContent('');
      setExampleCode('');
      setFeedback({ type: 'success', text: `Class/Concept "${res.data.name}" created successfully!` });
      await loadConcepts(selectedSubjectId);
      setSelectedConceptId(String(res.data.id));
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to create class/concept: ${errorMessage(err)}` });
    } finally {
      setCreatingConcept(false);
    }
  }

  async function handleCreateLesson(e) {
    e.preventDefault();
    const cId = newLessonConceptId || selectedConceptId;
    if (!cId) {
      setFeedback({ type: 'error', text: 'Please select a Class/Concept first.' });
      return;
    }
    if (!newLessonTitle.trim()) {
      setFeedback({ type: 'error', text: 'Class title is required.' });
      return;
    }
    setCreatingLesson(true);
    setFeedback(null);
    try {
      await api.post('/admin/lessons', {
        conceptId: Number(cId),
        title: newLessonTitle.trim(),
        classType: newLessonTrack,
        tagline: newLessonTagline.trim(),
        content: newLessonContent.trim() || `Class material for ${newLessonTitle.trim()}`,
        exampleCode: newLessonCode.trim()
      });
      setNewLessonTitle('');
      setNewLessonTagline('');
      setNewLessonContent('');
      setNewLessonCode('');
      setFeedback({ type: 'success', text: `Class "${newLessonTitle.trim()}" (${newLessonTrack} track) added successfully!` });
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to add class: ${errorMessage(err)}` });
    } finally {
      setCreatingLesson(false);
    }
  }

  async function handleCreateQuestion(e) {
    e.preventDefault();
    if (!selectedConceptId) {
      setFeedback({ type: 'error', text: 'Please select a Class/Concept first.' });
      return;
    }
    if (!qText.trim() || !qOptA.trim() || !qOptB.trim() || !qOptC.trim() || !qOptD.trim()) {
      setFeedback({ type: 'error', text: 'Question text and all four options (A, B, C, D) are required.' });
      return;
    }
    setCreatingQuestion(true);
    setFeedback(null);
    try {
      await api.post('/admin/questions', {
        conceptId: Number(selectedConceptId),
        questionText: qText.trim(),
        optionA: qOptA.trim(),
        optionB: qOptB.trim(),
        optionC: qOptC.trim(),
        optionD: qOptD.trim(),
        correctOption: qCorrect,
        explanation: qExplanation.trim()
      });
      setQText('');
      setQOptA('');
      setQOptB('');
      setQOptC('');
      setQOptD('');
      setQExplanation('');
      setFeedback({ type: 'success', text: 'Question added successfully to the question bank!' });
      await loadQuestions(selectedConceptId);
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to create question: ${errorMessage(err)}` });
    } finally {
      setCreatingQuestion(false);
    }
  }

  async function handleDeleteQuestion(id) {
    if (!window.confirm('Delete this question from the question bank?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setFeedback({ type: 'success', text: 'Question deleted successfully.' });
      await loadQuestions(selectedConceptId);
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to delete question: ${errorMessage(err)}` });
    }
  }

  if (adminTab === 'analytics' && loading) {
    return (
      <div className="analytics-loading">
        <span className="sync-spinner" />
        <p>Generating real-time visual analytics report…</p>
      </div>
    );
  }

  if (adminTab === 'analytics' && error) {
    return (
      <div className="card admin-error-card">
        <h3>Could not load analytics report</h3>
        <p>{error}</p>
        <button className="button button-primary" onClick={loadAnalytics}>Retry</button>
      </div>
    );
  }

  const {
    totalStudents = 0,
    totalTestsTaken = 0,
    overallAverageScore = 0,
    overallPassRate = 0,
    conceptStats = [],
    studentStats = []
  } = analytics || {};

  // Data for Chart 1: Test Attempts by User
  const userAttemptData = studentStats.map(s => ({
    name: s.studentName.length > 12 ? s.studentName.slice(0, 10) + '…' : s.studentName,
    fullName: s.studentName,
    testsTaken: s.totalTestsTaken,
    avgScore: s.averageScore,
    mastered: s.conceptsMastered,
    id: s.studentId
  }));

  // Data for Chart 2 & 3: Concept Difficulty & Pass/Fail Distribution
  const conceptChartData = conceptStats.map(c => ({
    name: c.conceptName,
    testsTaken: c.totalTestsTaken,
    avgScore: c.averageScore,
    passCount: c.passCount,
    failCount: c.failCount,
    passRate: c.passRate
  }));

  // Colors
  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="admin-dashboard-container">
      {/* Top Banner */}
      <div className="admin-header-row">
        <div>
          <div className="admin-badge">👑 ADMINISTRATIVE OVERSIGHT</div>
          <h2>
            {adminTab === 'curriculum'
              ? 'Curriculum Management Studio'
              : 'Platform Progress & Visual Reporting Dashboard'}
          </h2>
          <p className="muted">
            {adminTab === 'curriculum'
              ? 'Create new subjects, define classes & concepts, configure learning tracks, and author quiz questions.'
              : 'Inspect platform-wide learner participation, test & retest attempt frequencies, and concept mastery curves.'}
          </p>
        </div>
        <div className="admin-header-actions">
          {adminTab === 'analytics' ? (
            <button className="button button-secondary" onClick={loadAnalytics} title="Refresh live analytics">
              ↻ Refresh Data
            </button>
          ) : (
            <button className="button button-secondary" onClick={loadSubjects} title="Refresh curriculum">
              ↻ Refresh Curriculum
            </button>
          )}
          {onSwitchToStudentView && (
            <button className="button button-primary" onClick={onSwitchToStudentView}>
              Switch to Learner View →
            </button>
          )}
        </div>
      </div>

      {adminTab === 'analytics' && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL LEARNERS</span>
          <div className="kpi-value">{totalStudents}</div>
          <span className="kpi-sub">Active registered learners</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">TOTAL TESTS & RETESTS</span>
          <div className="kpi-value text-indigo">{totalTestsTaken}</div>
          <span className="kpi-sub">Quiz sessions evaluated</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">OVERALL AVERAGE SCORE</span>
          <div className="kpi-value text-emerald">{overallAverageScore}%</div>
          <span className="kpi-sub">Across all student submissions</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">OVERALL PASS RATE</span>
          <div className="kpi-value text-amber">{overallPassRate}%</div>
          <span className="kpi-sub">Scores achieving &ge; 75% mastery</span>
        </div>
      </div>

      {/* Graph Visualizations Grid */}
      <div className="chart-grid">
        {/* CHART 1: Tests Taken per User */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Test & Retest Attempts by Learner</h3>
              <p className="muted small">Visualizing how many times each student took quizzes/retests.</p>
            </div>
            <span className="chart-tag">ENGAGEMENT</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            {userAttemptData.length === 0 ? (
              <div className="chart-empty">No quiz attempt data recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userAttemptData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="name" stroke="#858ca5" fontSize={13.5} tickLine={false} tick={{ fill: '#858ca5' }} />
                  <YAxis stroke="#858ca5" fontSize={13.5} allowDecimals={false} tick={{ fill: '#858ca5' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="custom-tooltip">
                            <strong>{data.fullName}</strong>
                            <p>Tests Taken: <strong>{data.testsTaken}</strong></p>
                            <p>Average Score: <strong>{data.avgScore}%</strong></p>
                            <p>Concepts Mastered: <strong>{data.mastered} / 5</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="testsTaken" radius={[6, 6, 0, 0]} name="Total Tests Taken">
                    {userAttemptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 2: Concept Pass vs Retest Required */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Pass vs Retest Required per Concept</h3>
              <p className="muted small">Green = Passed (&ge;75%), Coral = Failed/Retest Required (&lt;75%).</p>
            </div>
            <span className="chart-tag">MASTERY</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            {conceptChartData.length === 0 ? (
              <div className="chart-empty">No concept tests recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conceptChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="name" stroke="#858ca5" fontSize={13.5} tickLine={false} tick={{ fill: '#858ca5' }} />
                  <YAxis stroke="#858ca5" fontSize={13.5} allowDecimals={false} tick={{ fill: '#858ca5' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="custom-tooltip">
                            <strong>{data.name}</strong>
                            <p>Passed (≥75%): <strong style={{ color: '#34d399' }}>{data.passCount}</strong></p>
                            <p>Retest Required: <strong style={{ color: '#fb7185' }}>{data.failCount}</strong></p>
                            <p>Pass Rate: <strong>{data.passRate}%</strong></p>
                            <p>Avg Score: <strong>{data.avgScore}%</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '8px', color: '#858ca5' }} />
                  <Bar dataKey="passCount" fill="#10b981" name="Passed (≥75%)" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failCount" fill="#f43f5e" name="Retest Required (<75%)" stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 3: Concept Difficulty & Attempt Volume */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Concept Attempt Volume & Difficulty</h3>
              <p className="muted small">Total tests taken vs average demonstrated score across all students.</p>
            </div>
            <span className="chart-tag">DIFFICULTY</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conceptChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="name" stroke="#858ca5" fontSize={13.5} tickLine={false} tick={{ fill: '#858ca5' }} />
                <YAxis yAxisId="left" stroke="#858ca5" fontSize={13.5} allowDecimals={false} tick={{ fill: '#858ca5' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#818cf8" fontSize={13.5} unit="%" tick={{ fill: '#818cf8' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <strong>{label}</strong>
                          {payload.map((p, i) => (
                            <p key={i} style={{ color: p.color }}>
                              {p.name}: <strong>{p.value}{p.unit || ''}</strong>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '8px', color: '#858ca5' }} />
                <Bar yAxisId="left" dataKey="testsTaken" fill="#6366f1" name="Tests Taken" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgScore" fill="#38bdf8" name="Avg Score (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Average Mastery Radar Across Concepts */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Curriculum Mastery Profile (All Students)</h3>
              <p className="muted small">Platform average score distribution with 75% unlock threshold.</p>
            </div>
            <span className="chart-tag">RADAR</span>
          </div>

          <div className="chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={conceptChartData.map(c => ({ concept: c.name, score: c.avgScore, benchmark: 75 }))}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                <PolarAngleAxis dataKey="concept" stroke="#a5b4fc" fontSize={13} tick={{ fill: '#a5b4fc' }} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tick={{ fill: '#64748b' }} />
                <Radar name="Platform Average" dataKey="score" stroke="#818cf8" fill="#6366f1" fillOpacity={0.45} />
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
      </div>

      {/* Student Drill-Down Table */}
      <div className="card table-card" style={{ marginTop: '24px' }}>
        <div className="table-header-row">
          <div>
            <h3>All Registered Learners & Activity Metrics</h3>
            <p className="muted small">Click any student to view their individual progress charts and test timeline.</p>
          </div>
          <span className="badge badge-neutral">{studentStats.length} Learners</span>
        </div>

        <div className="responsive-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Email</th>
                <th>Total Tests Taken</th>
                <th>Concepts Mastered</th>
                <th>Avg Score</th>
                <th>Last Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map((s) => (
                <tr
                  key={s.studentId}
                  className={selectedStudent?.studentId === s.studentId ? 'selected-row' : ''}
                >
                  <td>
                    <div className="table-user-cell">
                      <div className="avatar-small">
                        {s.studentName.slice(0, 1).toUpperCase()}
                      </div>
                      <strong>{s.studentName}</strong>
                    </div>
                  </td>
                  <td className="muted">{s.studentEmail}</td>
                  <td>
                    <span className="pill pill-tests">
                      {s.totalTestsTaken} {s.totalTestsTaken === 1 ? 'test' : 'tests'}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${s.conceptsMastered > 0 ? 'pill-mastered' : 'pill-neutral'}`}>
                      {s.conceptsMastered} / 5 Mastered
                    </span>
                  </td>
                  <td>
                    <span className="score-badge">
                      {s.averageScore}%
                    </span>
                  </td>
                  <td className="muted small">{s.lastActive}</td>
                  <td>
                    <button
                      className="button button-small button-outline"
                      onClick={() => handleSelectStudent(s)}
                    >
                      {selectedStudent?.studentId === s.studentId ? 'Viewing ↓' : 'Inspect Details 🔍'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Student Drilldown Panel */}
      {selectedStudent && (
        <div className="card student-drilldown-card" style={{ marginTop: '24px' }}>
          <div className="drilldown-header">
            <div>
              <span className="drilldown-badge">INDIVIDUAL DRILLDOWN</span>
              <h3>Performance History: {selectedStudent.studentName} ({selectedStudent.studentEmail})</h3>
              <p className="muted small">
                {selectedStudent.totalTestsTaken} tests recorded · {selectedStudent.conceptsMastered} of 5 concepts mastered · Average score: {selectedStudent.averageScore}%
              </p>
            </div>
            <button
              className="button button-secondary button-small"
              onClick={() => setSelectedStudent(null)}
            >
              Close Drilldown ✕
            </button>
          </div>

          <div className="drilldown-grid">
            {/* Concept Status Breakdown */}
            <div className="drilldown-subcard">
              <h4>Concept Mastery Status & Retest Counts</h4>
              <div className="concept-brief-list">
                {selectedStudent.conceptMastery.map((cm) => (
                  <div key={cm.conceptId} className="concept-brief-item">
                    <div>
                      <strong>{cm.conceptName}</strong>
                      <div className="muted small">
                        Tests Taken: <strong>{cm.testsTaken}</strong> · Score: <strong>{cm.masteryScore}%</strong>
                      </div>
                    </div>
                    <span className={`pill pill-${cm.status.toLowerCase()}`}>
                      {cm.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test History Timeline Chart */}
            <div className="drilldown-subcard">
              <h4>Test Score Progression Timeline</h4>
              {studentHistory.length === 0 ? (
                <div className="chart-empty">No chronological test history available for this student.</div>
              ) : (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                      <XAxis dataKey="completedAt" stroke="#858ca5" fontSize={13} tick={{ fill: '#858ca5' }} />
                      <YAxis domain={[0, 100]} stroke="#858ca5" fontSize={13} unit="%" tick={{ fill: '#858ca5' }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="custom-tooltip">
                                <strong>{label}</strong>
                                <p>Score: <strong style={{ color: '#818cf8' }}>{payload[0].value}%</strong></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="scorePercent"
                        stroke="#818cf8"
                        strokeWidth={3}
                        name="Score (%)"
                        dot={{ r: 5, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#6366f1', stroke: '#38bdf8', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Chronological Test History Table */}
          <div style={{ marginTop: '20px' }}>
            <h4>Detailed Quiz Sessions Log</h4>
            {loadingHistory ? (
              <p className="muted">Loading test timeline…</p>
            ) : studentHistory.length === 0 ? (
              <p className="muted">No test submissions found for this user.</p>
            ) : (
              <div className="responsive-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Concept</th>
                      <th>Attempt Type</th>
                      <th>Correct / Total</th>
                      <th>Score</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map((h) => (
                      <tr key={h.id}>
                        <td className="muted small">{h.completedAt}</td>
                        <td><strong>{h.conceptName}</strong></td>
                        <td>
                          <span className={`pill ${h.attemptNumber > 1 ? 'pill-retest' : 'pill-initial'}`}>
                            {h.attemptNumber === 1 ? 'Initial Test' : `Retest #${h.attemptNumber}`}
                          </span>
                        </td>
                        <td>{h.correctAnswers} / {h.totalQuestions} correct</td>
                        <td><strong>{h.scorePercent}%</strong></td>
                        <td>
                          <span className={`pill ${h.passed ? 'pill-mastered' : 'pill-weak'}`}>
                            {h.passed ? '✓ PASSED (≥75%)' : '⚠ RETEST NEEDED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )}

  {adminTab === 'curriculum' && (
    <div className="curriculum-management-view">
      {feedback && (
        <div className={feedback.type === 'error' ? 'curriculum-feedback-error' : 'curriculum-feedback-success'}>
          <span>{feedback.type === 'error' ? '⚠️' : '✓'} {feedback.text}</span>
          <button
            className="button button-quiet button-small"
            onClick={() => setFeedback(null)}
            style={{ color: 'inherit', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Active Subject & Class Selector Header */}
      <div className="curriculum-pod-card" style={{ padding: '22px 28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className="eyebrow" style={{ color: '#818cf8', letterSpacing: '1.4px' }}>CURRICULUM ARCHITECTURE CONTEXT</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '20px' }}>Select Subject &amp; Class to Manage</h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ minWidth: '220px' }}>
              <Dropdown
                label="ACTIVE SUBJECT"
                variant="form"
                icon="📚"
                value={selectedSubjectId}
                options={subjects.map(s => ({
                  value: String(s.id),
                  label: s.name,
                  icon: '☕'
                }))}
                onChange={(val) => setSelectedSubjectId(val)}
                aria-label="Active subject"
              />
            </div>

            <div style={{ minWidth: '240px' }}>
              <Dropdown
                label="ACTIVE CLASS / CONCEPT"
                variant="form"
                icon="🎓"
                value={selectedConceptId}
                options={concepts.map(c => ({
                  value: String(c.id),
                  label: `#${c.displayOrder} ${c.name}`,
                  icon: '📌'
                }))}
                onChange={(val) => setSelectedConceptId(val)}
                aria-label="Active class or concept"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Grid: Add Subject, Add Class, Add Class Track, Add Question */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '24px' }}>
        {/* Card 1: Add Subject */}
        <div className="curriculum-pod-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="curriculum-pod-icon">📚</div>
            <div>
              <h3>Add New Subject</h3>
              <small className="muted">Create an entire curriculum track</small>
            </div>
          </div>

          <form onSubmit={handleCreateSubject} style={{ display: 'grid', gap: '14px' }}>
            <div className="curriculum-form-group">
              <label>Subject Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Python Fundamentals"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>

            <div className="curriculum-form-group">
              <label>Subject Description</label>
              <textarea
                rows={2}
                placeholder="Brief curriculum overview"
                value={subjectDesc}
                onChange={(e) => setSubjectDesc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={creatingSubject || !subjectName.trim()}
              style={{ marginTop: '4px' }}
            >
              {creatingSubject ? 'Creating…' : '+ Create Subject'}
            </button>
          </form>

          <div style={{ marginTop: '22px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
            <span className="eyebrow" style={{ color: '#818cf8', fontSize: '11px' }}>EXISTING SUBJECTS ({subjects.length})</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {subjects.map(s => (
                <span
                  key={s.id}
                  onClick={() => setSelectedSubjectId(String(s.id))}
                  className={`pill ${String(s.id) === String(selectedSubjectId) ? 'pill-mastered' : 'pill-neutral'}`}
                  style={{ cursor: 'pointer' }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Add Class / Concept */}
        <div className="curriculum-pod-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="curriculum-pod-icon">🎓</div>
            <div>
              <h3>Add Class / Concept</h3>
              <small className="muted">Add a module to selected subject</small>
            </div>
          </div>

          <form onSubmit={handleCreateConcept} style={{ display: 'grid', gap: '14px' }}>
            <div className="curriculum-form-group">
              <label>Class / Concept Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Object-Oriented Programming"
                value={conceptName}
                onChange={(e) => setConceptName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="curriculum-form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  placeholder="Auto (next)"
                  value={conceptDisplayOrder}
                  onChange={(e) => setConceptDisplayOrder(e.target.value)}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <Dropdown
                  label="Prerequisite Class"
                  variant="form"
                  value={conceptPrereqId}
                  options={[
                    { value: '', label: 'None (Entry class)', icon: '🔓' },
                    ...concepts.map(c => ({
                      value: String(c.id),
                      label: `#${c.displayOrder} ${c.name}`,
                      icon: '📌'
                    }))
                  ]}
                  onChange={(val) => setConceptPrereqId(val)}
                  placeholder="None (Entry class)"
                  aria-label="Prerequisite class"
                />
              </div>
            </div>

            <div className="curriculum-form-group">
              <label>Class Description</label>
              <textarea
                rows={2}
                placeholder="What will learners discover in this class?"
                value={conceptDesc}
                onChange={(e) => setConceptDesc(e.target.value)}
              />
            </div>

            <details style={{ fontSize: '13.5px', color: '#9aa4bf' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '700', color: '#818cf8', outline: 'none' }}>
                + Optional Lesson Text &amp; Code Example
              </summary>
              <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                <div className="curriculum-form-group">
                  <input
                    type="text"
                    placeholder="Lesson Title"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                  />
                </div>
                <div className="curriculum-form-group">
                  <textarea
                    rows={3}
                    placeholder="Comprehensive lesson content and theory…"
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                  />
                </div>
                <div className="curriculum-form-group">
                  <textarea
                    rows={2}
                    className="curriculum-code-input"
                    placeholder="Code example (e.g. public class Demo...)"
                    value={exampleCode}
                    onChange={(e) => setExampleCode(e.target.value)}
                  />
                </div>
              </div>
            </details>

            <button
              type="submit"
              className="button button-primary"
              disabled={creatingConcept || !conceptName.trim()}
              style={{ marginTop: '4px' }}
            >
              {creatingConcept ? 'Adding Class…' : '+ Create Class / Concept'}
            </button>
          </form>

          <div style={{ marginTop: '22px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
            <span className="eyebrow" style={{ color: '#818cf8', fontSize: '11px' }}>CLASSES IN THIS SUBJECT ({concepts.length})</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {concepts.map(c => (
                <span
                  key={c.id}
                  onClick={() => setSelectedConceptId(String(c.id))}
                  className={`pill ${String(c.id) === String(selectedConceptId) ? 'pill-mastered' : 'pill-neutral'}`}
                  style={{ cursor: 'pointer' }}
                >
                  #{c.displayOrder} {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2.5: Add Class Track (Primary / Alternative) */}
        <div className="curriculum-pod-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="curriculum-pod-icon">🔄</div>
            <div>
              <h3>Add Class Track / Lesson</h3>
              <small className="muted">Add Class 1 (Core) or Class 2 (Alternative Remedial) to a Concept</small>
            </div>
          </div>

          <form onSubmit={handleCreateLesson} style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ minWidth: 0 }}>
                <Dropdown
                  label="Select Concept *"
                  variant="form"
                  icon="📌"
                  value={newLessonConceptId || selectedConceptId}
                  options={concepts.map(c => ({
                    value: String(c.id),
                    label: c.name
                  }))}
                  onChange={(val) => setNewLessonConceptId(val)}
                  aria-label="Select Concept"
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <Dropdown
                  label="Pedagogical Track Type *"
                  variant="form"
                  value={newLessonTrack}
                  options={[
                    { value: 'PRIMARY', label: 'Class 1: Primary Core Track', icon: '📘' },
                    { value: 'ALTERNATIVE', label: 'Class 2: Alternative Remedial Track (<75%)', icon: '🔄' }
                  ]}
                  onChange={(val) => setNewLessonTrack(val)}
                  aria-label="Pedagogical Track Type"
                />
              </div>
            </div>

            <div className="curriculum-form-group">
              <label>Class Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Class 2: Visual Analogies, Storage Jars & Type Traps"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
              />
            </div>

            <div className="curriculum-form-group">
              <label>Track Tagline / Summary</label>
              <input
                type="text"
                placeholder="e.g. Remedial Track: Visual analogies, memory diagrams, and pitfall walkthroughs."
                value={newLessonTagline}
                onChange={(e) => setNewLessonTagline(e.target.value)}
              />
            </div>

            <div className="curriculum-form-group">
              <label>Class Content (Markdown)</label>
              <textarea
                rows={3}
                placeholder="Comprehensive pedagogical material, theory, and explanations…"
                value={newLessonContent}
                onChange={(e) => setNewLessonContent(e.target.value)}
              />
            </div>

            <div className="curriculum-form-group">
              <label>Example Java Code</label>
              <textarea
                rows={2}
                className="curriculum-code-input"
                placeholder="public class Example { ... }"
                value={newLessonCode}
                onChange={(e) => setNewLessonCode(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={creatingLesson || !newLessonTitle.trim()}
              style={{ marginTop: '4px' }}
            >
              {creatingLesson ? 'Adding Class…' : '+ Add Class Track to Concept'}
            </button>
          </form>
        </div>

        {/* Card 3: Add Question */}
        <div className="curriculum-pod-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="curriculum-pod-icon">❓</div>
            <div>
              <h3>Add Question to Bank</h3>
              <small className="muted">Deliver randomized tests for this class</small>
            </div>
          </div>

          <form onSubmit={handleCreateQuestion} style={{ display: 'grid', gap: '12px' }}>
            <div className="curriculum-form-group">
              <label>Question Text *</label>
              <textarea
                rows={2}
                required
                placeholder="Enter question prompt..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="curriculum-form-group">
                <input
                  type="text"
                  required
                  placeholder="Option A *"
                  value={qOptA}
                  onChange={(e) => setQOptA(e.target.value)}
                />
              </div>
              <div className="curriculum-form-group">
                <input
                  type="text"
                  required
                  placeholder="Option B *"
                  value={qOptB}
                  onChange={(e) => setQOptB(e.target.value)}
                />
              </div>
              <div className="curriculum-form-group">
                <input
                  type="text"
                  required
                  placeholder="Option C *"
                  value={qOptC}
                  onChange={(e) => setQOptC(e.target.value)}
                />
              </div>
              <div className="curriculum-form-group">
                <input
                  type="text"
                  required
                  placeholder="Option D *"
                  value={qOptD}
                  onChange={(e) => setQOptD(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Dropdown
                label="Correct Option *"
                variant="accent"
                value={qCorrect}
                options={[
                  { value: 'A', label: 'Option A (A)', icon: '🟢' },
                  { value: 'B', label: 'Option B (B)', icon: '🟢' },
                  { value: 'C', label: 'Option C (C)', icon: '🟢' },
                  { value: 'D', label: 'Option D (D)', icon: '🟢' }
                ]}
                onChange={(val) => setQCorrect(val)}
                style={{ maxWidth: '240px' }}
                aria-label="Correct Option"
              />
            </div>

            <div className="curriculum-form-group">
              <textarea
                rows={2}
                placeholder="Explanation / educational rationale (optional)"
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={creatingQuestion || !qText.trim()}
              style={{ marginTop: '4px' }}
            >
              {creatingQuestion ? 'Adding Question…' : '+ Add Question to Bank'}
            </button>
          </form>
        </div>
      </div>

      {/* Question Bank Explorer Table */}
      <div className="curriculum-pod-card" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#818cf8', letterSpacing: '1.4px' }}>QUESTION BANK EXPLORER</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '20px' }}>
              Questions in {concepts.find(c => String(c.id) === String(selectedConceptId))?.name || 'Selected Class'}
            </h3>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Randomized quizzes will sample 4 questions from this pool using Spring Data Paging Repository.
            </p>
          </div>
          <span className="badge badge-primary" style={{ padding: '6px 14px', borderRadius: '12px' }}>
            {questions.length} Questions in Pool
          </span>
        </div>

        {questions.length === 0 ? (
          <div className="chart-empty" style={{ padding: '36px', color: '#717a94' }}>
            No questions found in this class/concept. Use the form above to add questions!
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Question</th>
                  <th style={{ width: '35%' }}>Options</th>
                  <th style={{ width: '10%' }}>Correct</th>
                  <th style={{ width: '10%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>{q.questionText}</strong>
                      {q.explanation && (
                        <p className="muted small" style={{ margin: 0, color: '#9aa4bf' }}>💡 {q.explanation}</p>
                      )}
                    </td>
                    <td style={{ fontSize: '13.5px' }}>
                      <div style={{ marginBottom: '2px' }}><strong style={{ color: '#818cf8' }}>A:</strong> {q.optionA}</div>
                      <div style={{ marginBottom: '2px' }}><strong style={{ color: '#38bdf8' }}>B:</strong> {q.optionB}</div>
                      <div style={{ marginBottom: '2px' }}><strong style={{ color: '#34d399' }}>C:</strong> {q.optionC}</div>
                      <div><strong style={{ color: '#fbbf24' }}>D:</strong> {q.optionD}</div>
                    </td>
                    <td>
                      <span className="pill pill-mastered" style={{ fontWeight: '800', fontSize: '13px' }}>
                        Option {q.correctOption}
                      </span>
                    </td>
                    <td>
                      <button
                        className="button button-quiet button-small"
                        onClick={() => handleDeleteQuestion(q.id)}
                        style={{
                          color: '#fb7185',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          background: 'rgba(244, 63, 94, 0.12)',
                          borderRadius: '8px',
                          padding: '6px 12px'
                        }}
                        title="Delete question"
                      >
                        🗑️ Delete
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
  )}
</div>
  );
}
