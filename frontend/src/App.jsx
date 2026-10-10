import React, { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from './services/api.js';
import DashboardPage from './pages/DashboardPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import LessonPage from './pages/LessonPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import VisualProgressPage from './pages/VisualProgressPage.jsx';
import AuthModal from './components/AuthModal.jsx';
import Dropdown from './components/Dropdown.jsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('learnpath_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [activeTab, setActiveTab] = useState(() => isAdmin ? 'admin' : 'dashboard');
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [mastery, setMastery] = useState([]);
  const [progress, setProgress] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [graph, setGraph] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonEditMode, setLessonEditMode] = useState(false);
  const [quizToken, setQuizToken] = useState(0);
  const [booting, setBooting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appError, setAppError] = useState('');
  const [toast, setToast] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const studentId = currentUser ? String(currentUser.id) : '';

  const navItems = isAdmin ? [
    { id: 'admin', label: 'Admin Reports & Charts', icon: '👑' },
    { id: 'curriculum', label: 'Curriculum Studio', icon: '🛠️' },
    { id: 'dashboard', label: 'Curriculum Graph', icon: '◫' },
    { id: 'lesson', label: 'Learning Lesson', icon: '▤' }
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: '◫' },
    { id: 'analytics', label: 'My Visual Progress', icon: '📊' },
    { id: 'quiz', label: 'Concept Quiz', icon: '◎' },
    { id: 'lesson', label: 'Learning Lesson', icon: '▤' }
  ];

  // Load initial subjects
  useEffect(() => {
    let active = true;
    api.get('/subjects')
      .then((subjectResponse) => {
        if (!active) return;
        setSubjects(subjectResponse.data);
        if (subjectResponse.data.length) setSubjectId(String(subjectResponse.data[0].id));
      })
      .catch((error) => {
        if (active) setAppError(errorMessage(error));
      })
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => { active = false; };
  }, []);

  // Refresh learning data for active student and subject
  const refreshData = useCallback(async () => {
    if (!studentId || !subjectId) return;
    setRefreshing(true);
    try {
      const [masteryRes, progressRes, recommendationRes, graphRes, lessonsRes] = await Promise.all([
        api.get(`/students/${studentId}/mastery`, { params: { subjectId } }),
        api.get(`/students/${studentId}/progress`, { params: { subjectId } }),
        api.get(`/students/${studentId}/recommendations`, { params: { subjectId } }),
        api.get(`/subjects/${subjectId}/graph`, { params: { studentId } }),
        api.get('/lessons', { params: { subjectId } })
      ]);
      setMastery(masteryRes.data);
      setProgress(progressRes.data);
      setRecommendation(recommendationRes.data);
      setGraph(graphRes.data);
      setLessons(lessonsRes.data || []);
      setAppError('');
    } catch (error) {
      setAppError(errorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [studentId, subjectId]);

  useEffect(() => {
    refreshData();
  }, [refreshData, refreshKey]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    localStorage.setItem('learnpath_user', JSON.stringify(user));
    setShowAuthModal(false);
    if (user.role === 'ADMIN') {
      setActiveTab('admin');
      setToast(`Welcome, Administrator ${user.name}! Platform analytics loaded.`);
    } else {
      setActiveTab('dashboard');
      setToast(`Welcome back, ${user.name}! Continuing your learning.`);
    }
    setRefreshKey(k => k + 1);
  }

  function handleLogout() {
    localStorage.removeItem('learnpath_user');
    setCurrentUser(null);
    setMastery([]);
    setProgress(null);
    setRecommendation(null);
    setGraph(null);
    setLesson(null);
    setActiveTab('dashboard');
  }

  async function openLesson(lessonId, editMode = false) {
    if (!lessonId) return;
    try {
      const { data } = await api.get(`/lessons/${lessonId}`);
      setLesson(data);
      setLessonEditMode(Boolean(editMode));
      setActiveTab('lesson');
    } catch (error) {
      setToast(`Could not load lesson: ${errorMessage(error)}`);
    }
  }

  function handleLessonUpdated(updatedLesson) {
    setLesson(updatedLesson);
    setLessons(prev => prev.map(l => l.id === updatedLesson.id ? { ...l, ...updatedLesson } : l));
    setToast('✓ Lesson notes updated and saved to curriculum!');
  }

  async function openLessonByConcept(conceptId, classType = null) {
    if (!conceptId) return;
    try {
      const params = {};
      if (classType) params.classType = classType;
      else if (studentId) params.studentId = studentId;
      const { data } = await api.get(`/lessons/by-concept/${conceptId}`, { params });
      setLesson(data);
      setActiveTab('lesson');
    } catch (error) {
      setToast(`Could not load lesson: ${errorMessage(error)}`);
    }
  }

  async function handleSwitchClassTrack(conceptId, classType) {
    if (!studentId || !conceptId) return;
    try {
      await api.post(`/lessons/students/${studentId}/concepts/${conceptId}/track`, null, {
        params: { classType }
      });
      setRefreshKey(k => k + 1);
      setToast(`Switched active track to ${classType === 'ALTERNATIVE' ? 'Class 2 (Alternative Remedial Track)' : 'Class 1 (Primary Core Track)'}!`);
    } catch (error) {
      setToast(`Could not switch track: ${errorMessage(error)}`);
    }
  }

  function handleStartQuiz(conceptId = null) {
    if (conceptId) {
      setSelectedConceptId(conceptId);
    }
    setQuizToken(t => t + 1);
    setActiveTab('quiz');
  }

  async function handleQuizSubmitted(result) {
    setRefreshKey((key) => key + 1);
    if (result.switchedToAlternativeClass) {
      setToast(`🔄 Score ${result.scorePercent}% (< 75%). Switched to Class 2 (Alternative Remedial Track)!`);
    } else if (result.conceptMastered && result.nextUnlockedConcept) {
      setToast(`🎉 Concept mastered! Next topic unlocked: "${result.nextUnlockedConcept}"!`);
    } else if (result.conceptMastered) {
      setToast(`🎉 75%+ mastery achieved! Great progress!`);
    } else {
      setToast(`Score: ${result.scorePercent}%. Score 75%+ to unlock the next concept.`);
    }
  }

  if (booting) {
    return (
      <div className="app-loading">
        <div className="brand-mark">L</div>
        <p>Preparing your learning space…</p>
      </div>
    );
  }

  // If user is not logged in, render the login/signup screen
  if (!currentUser) {
    return (
      <AuthModal
        onLoginSuccess={handleLoginSuccess}
        isModal={false}
      />
    );
  }

  const currentSubject = subjects.find(s => String(s.id) === String(subjectId));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">L</div>
          <div>
            <strong>LearnPath<span> AI</span></strong>
            <small>ADAPTIVE LEARNING</small>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-button ${activeTab === item.id ? 'nav-active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === 'quiz' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sequential-pill-card">
            <span className="seq-badge">🔒 SEQUENTIAL UNLOCK</span>
            <p>Score 75%+ on each concept to unlock the next quest.</p>
          </div>

          <div className="profile-row">
            <div className="profile-user-info">
              <div className="avatar" style={isAdmin ? { background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.4)' } : {}}>
                {isAdmin ? '👑' : (currentUser?.name || 'S').slice(0, 1).toUpperCase()}
              </div>
              <div className="profile-copy">
                <strong>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.name}
                  </span>
                  {isAdmin && <span className="admin-badge" style={{ display: 'inline-flex', padding: '2px 7px', fontSize: '10px', marginLeft: '4px' }}>ADMIN</span>}
                </strong>
                <span>{currentUser?.email}</span>
              </div>
            </div>
            <button
              className="profile-signout-btn"
              title="Sign Out or Switch Account"
              onClick={handleLogout}
            >
              Sign out ➔
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-sep">/</span>
            <strong>{navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}</strong>
          </div>

          <div className="topbar-actions">
            <Dropdown
              label="SUBJECT"
              variant="topbar"
              icon="📚"
              value={subjectId}
              options={subjects.map(s => ({
                value: String(s.id),
                label: s.name,
                icon: '☕',
                subtitle: s.description ? s.description.slice(0, 48) + '…' : null
              }))}
              onChange={val => {
                setSubjectId(val);
                setLesson(null);
              }}
              aria-label="Choose subject"
            />

            <div
              className="learner-header-chip"
              onClick={() => setShowAuthModal(true)}
              title="Click to switch account"
              style={isAdmin ? { borderColor: 'rgba(236, 72, 153, 0.4)', background: 'rgba(236, 72, 153, 0.1)' } : {}}
            >
              <div
                className="topbar-avatar"
                style={isAdmin ? { background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' } : {}}
              >
                {isAdmin ? '👑' : (currentUser?.name || 'S').slice(0, 1).toUpperCase()}
              </div>
              <div className="learner-chip-meta">
                <span
                  className="learner-chip-label"
                  style={isAdmin ? { color: '#f472b6' } : {}}
                >
                  {isAdmin ? 'ADMINISTRATOR' : 'ACTIVE LEARNER'}
                </span>
                <span className="learner-chip-name">{currentUser?.name}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-container">
          {appError && (
            <div className="connection-banner">
              <div>
                <strong>Backend connection issue</strong>
                <p>{appError}</p>
                <small>Check that MySQL is running and Spring Boot is active on port 8081.</small>
              </div>
              <button
                className="button button-secondary"
                onClick={() => { setAppError(''); setRefreshKey(k => k + 1); }}
              >
                Retry
              </button>
            </div>
          )}

          {!appError && refreshing && (
            <div className="sync-note">
              <span className="sync-spinner" /> Syncing your learning data…
            </div>
          )}

          {isAdmin && activeTab === 'admin' && (
            <AdminDashboardPage
              key="admin-reports"
              viewMode="analytics"
              onSwitchToStudentView={() => setActiveTab('dashboard')}
            />
          )}

          {isAdmin && activeTab === 'curriculum' && (
            <AdminDashboardPage
              key="admin-curriculum"
              viewMode="curriculum"
              onSwitchToStudentView={() => setActiveTab('dashboard')}
            />
          )}

          {!isAdmin && activeTab === 'analytics' && studentId && (
            <VisualProgressPage
              studentId={studentId}
              subjectId={subjectId}
              onTakeQuiz={handleStartQuiz}
              onOpenLesson={openLessonByConcept}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              subject={currentSubject}
              progress={progress}
              mastery={mastery}
              recommendation={recommendation}
              graph={graph}
              lessons={lessons}
              isAdmin={isAdmin}
              currentUser={currentUser}
              onTakeQuiz={handleStartQuiz}
              onLearn={openLesson}
              onOpenLessonByConcept={openLessonByConcept}
              onSwitchTrack={handleSwitchClassTrack}
              onViewVisualProgress={() => setActiveTab(isAdmin ? 'admin' : 'analytics')}
              onRefreshData={refreshData}
              onNavigateToStudio={() => setActiveTab('curriculum')}
            />
          )}

          {!isAdmin && activeTab === 'quiz' && studentId && subjectId && (
            <QuizPage
              key={`${studentId}-${subjectId}-${selectedConceptId}-${quizToken}`}
              studentId={studentId}
              subjectId={subjectId}
              mastery={mastery}
              initialConceptId={selectedConceptId}
              onSubmitted={handleQuizSubmitted}
              onBackToDashboard={() => { setActiveTab('dashboard'); setRefreshKey(k => k + 1); }}
              onOpenLesson={openLessonByConcept}
            />
          )}

          {activeTab === 'lesson' && (
            <LessonPage
              lesson={lesson}
              allLessons={lessons}
              mastery={mastery}
              initialEditMode={lessonEditMode}
              onSelectLesson={openLesson}
              onOpenLessonByConcept={openLessonByConcept}
              onSwitchTrack={handleSwitchClassTrack}
              onBack={() => setActiveTab('dashboard')}
              onBackToLibrary={() => { setLesson(null); setLessonEditMode(false); }}
              onLessonUpdated={handleLessonUpdated}
            />
          )}

          <footer className="app-footer">
            <span>LearnPath AI · Adaptive prerequisite mastery graph & visual analytics</span>
            <span>Concepts unlock progressively as you achieve 75%+ mastery.</span>
          </footer>
        </div>
      </main>

      {/* Account Switch Modal */}
      {showAuthModal && (
        <AuthModal
          isModal={true}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {toast && (
        <div className="toast-message" role="status">
          <span>✓</span>
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>×</button>
        </div>
      )}
    </div>
  );
}
