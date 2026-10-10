import React, { useState, useEffect, useMemo } from 'react';
import api, { errorMessage } from '../services/api.js';

function formatInline(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderLessonLine(line, index) {
  const trimmed = line.trim();
  if (!trimmed) return <div className="lesson-spacer" key={index} />;
  if (trimmed.startsWith('### ')) {
    return <h3 className="lesson-section-title" key={index}>{trimmed.replace('### ', '')}</h3>;
  }
  if (trimmed.startsWith('- ')) {
    return (
      <div className="lesson-bullet-item" key={index}>
        <span className="bullet-marker">✦</span>
        <div className="bullet-text">{formatInline(trimmed.substring(2))}</div>
      </div>
    );
  }
  return <p className="lesson-paragraph" key={index}>{formatInline(trimmed)}</p>;
}

export default function LessonPage({
  lesson,
  allLessons = [],
  mastery = [],
  initialEditMode = false,
  onSelectLesson,
  onOpenLessonByConcept,
  onSwitchTrack,
  onBack,
  onBackToLibrary,
  onLessonUpdated
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('ALL'); // 'ALL' | 'PRIMARY' | 'ALTERNATIVE'

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editTitle, setEditTitle] = useState(lesson?.title || '');
  const [editTagline, setEditTagline] = useState(lesson?.tagline || '');
  const [editContent, setEditContent] = useState(lesson?.content || '');
  const [editExampleCode, setEditExampleCode] = useState(lesson?.exampleCode || '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [savedSuccessBanner, setSavedSuccessBanner] = useState(false);

  useEffect(() => {
    setIsEditing(initialEditMode);
  }, [initialEditMode]);

  useEffect(() => {
    if (lesson) {
      setEditTitle(lesson.title || '');
      setEditTagline(lesson.tagline || '');
      setEditContent(lesson.content || '');
      setEditExampleCode(lesson.exampleCode || '');
      setEditError('');
    }
  }, [lesson?.id]);

  // Group all lessons by concept
  const conceptGroups = useMemo(() => {
    const map = new Map();
    allLessons.forEach((les) => {
      if (!map.has(les.conceptId)) {
        map.set(les.conceptId, {
          conceptId: les.conceptId,
          conceptName: les.conceptName || `Concept #${les.conceptId}`,
          primaryLesson: null,
          alternativeLesson: null,
          all: []
        });
      }
      const entry = map.get(les.conceptId);
      entry.all.push(les);
      if (les.classType === 'PRIMARY') {
        entry.primaryLesson = les;
      } else if (les.classType === 'ALTERNATIVE') {
        entry.alternativeLesson = les;
      }
    });
    return Array.from(map.values());
  }, [allLessons]);

  // Filter groups according to search input and track selector
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conceptGroups
      .map((group) => {
        const matchesConcept = !query || group.conceptName.toLowerCase().includes(query);
        const matchesPrimary = group.primaryLesson && (!query ||
          group.primaryLesson.title.toLowerCase().includes(query) ||
          (group.primaryLesson.tagline && group.primaryLesson.tagline.toLowerCase().includes(query)) ||
          group.primaryLesson.content.toLowerCase().includes(query)
        );
        const matchesAlt = group.alternativeLesson && (!query ||
          group.alternativeLesson.title.toLowerCase().includes(query) ||
          (group.alternativeLesson.tagline && group.alternativeLesson.tagline.toLowerCase().includes(query)) ||
          group.alternativeLesson.content.toLowerCase().includes(query)
        );

        if (!matchesConcept && !matchesPrimary && !matchesAlt) {
          return null;
        }

        let showPrimary = !!group.primaryLesson;
        let showAlt = !!group.alternativeLesson;

        if (trackFilter === 'PRIMARY') {
          showAlt = false;
        } else if (trackFilter === 'ALTERNATIVE') {
          showPrimary = false;
        }

        if (query && !matchesConcept) {
          if (!matchesPrimary) showPrimary = false;
          if (!matchesAlt) showAlt = false;
        }

        if (!showPrimary && !showAlt) return null;

        return {
          ...group,
          showPrimary,
          showAlt
        };
      })
      .filter(Boolean);
  }, [conceptGroups, searchQuery, trackFilter]);

  // Total summary metrics
  const totalConcepts = conceptGroups.length;
  const primaryCount = allLessons.filter(l => l.classType === 'PRIMARY').length;
  const altCount = allLessons.filter(l => l.classType === 'ALTERNATIVE').length;

  const handleSaveLesson = async (e) => {
    if (e) e.preventDefault();
    if (!lesson) return;
    setSaving(true);
    setEditError('');
    try {
      const { data } = await api.put(`/lessons/${lesson.id}`, {
        title: editTitle.trim(),
        tagline: editTagline.trim(),
        content: editContent,
        exampleCode: editExampleCode
      });
      if (onLessonUpdated) {
        onLessonUpdated(data);
      }
      setIsEditing(false);
      setSavedSuccessBanner(true);
      setTimeout(() => setSavedSuccessBanner(false), 4000);
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Render Library / Directory View when no active lesson is selected
  if (!lesson) {
    return (
      <div className="classes-library-container">
        {/* Navigation & Header Bar */}
        <div className="lesson-top-bar">
          <button className="button button-quiet button-small" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <span className="lesson-badge">CURRICULUM NOTES & LESSONS DIRECTORY</span>
        </div>

        {/* Hero Banner with Stats */}
        <section className="library-hero-card">
          <div className="library-hero-header">
            <div className="library-hero-title-group">
              <span className="eyebrow" style={{ color: '#6366f1' }}>ACADEMIC PEDAGOGY STUDIO</span>
              <h1>📚 Learning Classes & Notes Library</h1>
              <p className="library-hero-desc">
                Browse, read, and <strong>edit notes</strong> for every Java topic. Each concept offers two parallel pedagogical modules: <strong>Class 1 (Core Foundation)</strong> for rigorous syntax and architecture, and <strong>Class 2 (Visual Remedial)</strong> for intuitive analogies. Click <em>Edit Notes</em> on any class to update curriculum content directly.
              </p>
            </div>
          </div>

          <div className="library-stats-bar">
            <div className="library-stat-card">
              <span className="library-stat-num">{totalConcepts}</span>
              <span className="library-stat-label">Core Concepts</span>
            </div>
            <div className="library-stat-card">
              <span className="library-stat-num" style={{ color: '#818cf8' }}>{primaryCount}</span>
              <span className="library-stat-label">📘 Class 1 Modules</span>
            </div>
            <div className="library-stat-card">
              <span className="library-stat-num" style={{ color: '#fbbf24' }}>{altCount}</span>
              <span className="library-stat-label">🔄 Class 2 Modules</span>
            </div>
            <div className="library-stat-card">
              <span className="library-stat-num" style={{ color: '#34d399' }}>
                {allLessons.length}
              </span>
              <span className="library-stat-label">Editable Lesson Notes</span>
            </div>
          </div>
        </section>

        {/* Toolbar: Search & Filter Pills */}
        <div className="library-toolbar">
          <div className="library-search-box">
            <span className="library-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by topic, lesson title, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="library-filter-group">
            <button
              className={`library-filter-btn ${trackFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setTrackFilter('ALL')}
            >
              All Modules ({allLessons.length})
            </button>
            <button
              className={`library-filter-btn ${trackFilter === 'PRIMARY' ? 'active' : ''}`}
              onClick={() => setTrackFilter('PRIMARY')}
            >
              📘 Class 1: Core Track ({primaryCount})
            </button>
            <button
              className={`library-filter-btn ${trackFilter === 'ALTERNATIVE' ? 'active' : ''}`}
              onClick={() => setTrackFilter('ALTERNATIVE')}
            >
              🔄 Class 2: Remedial Track ({altCount})
            </button>
          </div>
        </div>

        {/* Concept Groups List */}
        {filteredGroups.length === 0 ? (
          <div className="panel empty-state" style={{ textAlign: 'center', padding: '40px' }}>
            <span style={{ fontSize: '32px' }}>🔍</span>
            <h3 style={{ marginTop: '12px' }}>No classes match your search</h3>
            <p className="muted">Try adjusting your search terms or clearing track filters.</p>
            <button
              className="button button-secondary"
              style={{ marginTop: '12px' }}
              onClick={() => { setSearchQuery(''); setTrackFilter('ALL'); }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredGroups.map((group, idx) => {
            const conceptInfo = mastery.find(m => m.conceptId === group.conceptId);
            const assignedType = conceptInfo?.assignedClassType || 'PRIMARY';
            const score = conceptInfo?.score || 0;
            const isMastered = conceptInfo?.mastered || false;

            return (
              <section key={group.conceptId} className="library-concept-section">
                {/* Concept Header */}
                <div className="library-concept-header">
                  <div className="library-concept-title-group">
                    <span className="lesson-num-badge" style={{ fontSize: '13px', padding: '3px 9px' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h2 className="library-concept-title">{group.conceptName}</h2>
                    {isMastered ? (
                      <span className="pill pill-mastered">✓ Mastered ({score}%)</span>
                    ) : score > 0 ? (
                      <span className="pill pill-in-progress">In Progress ({score}%)</span>
                    ) : null}
                    {assignedType === 'ALTERNATIVE' ? (
                      <span className="pill pill-warning" title="Assigned learning track">
                        🔄 Active: Class 2
                      </span>
                    ) : (
                      <span className="pill pill-neutral" title="Assigned learning track">
                        📘 Active: Class 1
                      </span>
                    )}
                  </div>
                </div>

                {/* Dual-Track Cards Grid */}
                <div className="library-dual-grid">
                  {/* Class 1 (Primary Core Track) */}
                  {group.showPrimary && group.primaryLesson && (
                    <div className="library-class-card card-class-core">
                      <div>
                        <div className="library-card-top">
                          <span className="track-tag-core">📘 CLASS 1 · CORE FOUNDATION</span>
                          <span className="track-focus-label">Theory & Memory Model</span>
                        </div>
                        <h3 className="library-card-title">{group.primaryLesson.title}</h3>
                        <p className="library-card-tagline">
                          {group.primaryLesson.tagline || 'In-depth exploration of syntax, memory stack/heap rules, and standard Java execution specifications.'}
                        </p>
                        <div className="library-card-features">
                          <span className="feature-pill-core">✦ Memory Architecture</span>
                          <span className="feature-pill-core">✦ Java Grammar & Types</span>
                          <span className="feature-pill-core">✦ Production Syntax</span>
                        </div>
                      </div>

                      <div className="library-card-footer">
                        {assignedType === 'PRIMARY' ? (
                          <span className="assigned-badge">⭐ Active Track</span>
                        ) : (
                          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Core Track</span>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="button button-secondary button-small"
                            onClick={() => onSelectLesson ? onSelectLesson(group.primaryLesson.id, true) : null}
                            title="Edit this note directly"
                          >
                            ✏️ Edit Notes
                          </button>
                          <button
                            className="button button-primary button-small"
                            onClick={() => onSelectLesson ? onSelectLesson(group.primaryLesson.id, false) : null}
                          >
                            Read Notes →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Class 2 (Alternative Remedial Track) */}
                  {group.showAlt && group.alternativeLesson && (
                    <div className="library-class-card card-class-remedial">
                      <div>
                        <div className="library-card-top">
                          <span className="track-tag-remedial">🔄 CLASS 2 · VISUAL REMEDIAL</span>
                          <span className="track-focus-label">Analogies & Bug Prevention</span>
                        </div>
                        <h3 className="library-card-title">{group.alternativeLesson.title}</h3>
                        <p className="library-card-tagline">
                          {group.alternativeLesson.tagline || 'Intuitive mental models, storage jar analogies, and step-by-step breakdowns of common developer pitfalls.'}
                        </p>
                        <div className="library-card-features">
                          <span className="feature-pill-remedial">✦ Visual Mental Models</span>
                          <span className="feature-pill-remedial">✦ Storage Jar Analogy</span>
                          <span className="feature-pill-remedial">✦ Pitfall Avoidance</span>
                        </div>
                      </div>

                      <div className="library-card-footer">
                        {assignedType === 'ALTERNATIVE' ? (
                          <span className="assigned-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                            ⭐ Active Track
                          </span>
                        ) : (
                          <span style={{ fontSize: '12.5px', color: '#858ca5' }}>Alternative Remedial</span>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="button button-secondary button-small"
                            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)' }}
                            onClick={() => onSelectLesson ? onSelectLesson(group.alternativeLesson.id, true) : null}
                            title="Edit this note directly"
                          >
                            ✏️ Edit Notes
                          </button>
                          <button
                            className="button button-primary button-small"
                            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', borderColor: 'rgba(245, 158, 11, 0.5)', boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)' }}
                            onClick={() => onSelectLesson ? onSelectLesson(group.alternativeLesson.id, false) : null}
                          >
                            Read Notes →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>
    );
  }

  // Active Lesson Reading / Editing View
  const isAlt = lesson.classType === 'ALTERNATIVE';
  const conceptClasses = allLessons.filter(l => l.conceptId === lesson.conceptId);
  const conceptInfo = mastery.find(m => m.conceptId === lesson.conceptId);
  const isAssigned = conceptInfo ? (conceptInfo.assignedClassType || 'PRIMARY') === (lesson.classType || 'PRIMARY') : false;

  return (
    <div className="lesson-read-container">
      {/* Top Navigation */}
      <div className="lesson-top-bar" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="button button-secondary button-small"
            onClick={onBackToLibrary || onBack}
          >
            ← Back to Classes Library
          </button>
          <button
            className="button button-quiet button-small"
            onClick={onBack}
          >
            Dashboard
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!isEditing ? (
            <button
              className="button button-primary button-small"
              style={{ fontWeight: '800' }}
              onClick={() => {
                setEditTitle(lesson.title || '');
                setEditTagline(lesson.tagline || '');
                setEditContent(lesson.content || '');
                setEditExampleCode(lesson.exampleCode || '');
                setIsEditing(true);
              }}
            >
              ✏️ Edit Notes
            </button>
          ) : (
            <button
              className="button button-secondary button-small"
              onClick={() => setIsEditing(false)}
            >
              ✕ Cancel Editing
            </button>
          )}

          <span className={`pill ${isAlt ? 'pill-warning' : 'pill-neutral'}`} style={{ fontSize: '12.5px', fontWeight: '800' }}>
            {isAlt ? '🔄 CLASS 2: ALTERNATIVE TRACK' : '📘 CLASS 1: PRIMARY CORE TRACK'}
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccessBanner && (
        <div
          style={{
            padding: '14px 18px',
            marginBottom: '18px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.16)',
            border: '1.5px solid rgba(16, 185, 129, 0.45)',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '700',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
          }}
        >
          <span>✓</span> Lesson notes saved and updated in curriculum!
        </div>
      )}

      {/* Dual Class Track Switcher */}
      {conceptClasses.length > 1 && !isEditing && (
        <div
          className="card"
          style={{
            padding: '16px 22px',
            marginBottom: '20px',
            borderRadius: '16px',
            background: 'rgba(11, 17, 40, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⇄</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#a5b4fc', letterSpacing: '0.6px' }}>
              SWITCH TRACK FOR THIS CONCEPT:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {conceptClasses.map((cl) => {
              const active = cl.id === lesson.id || cl.classType === lesson.classType;
              const clAlt = cl.classType === 'ALTERNATIVE';
              return (
                <button
                  key={cl.id}
                  className={`button button-small ${active ? 'button-primary' : 'button-secondary'}`}
                  style={{
                    fontSize: '13.5px',
                    fontWeight: active ? '700' : '600',
                    ...(active && clAlt ? { background: 'linear-gradient(135deg, #d97706, #b45309)', borderColor: 'rgba(245, 158, 11, 0.5)' } : {})
                  }}
                  onClick={() => onSelectLesson ? onSelectLesson(cl.id, false) : onOpenLessonByConcept(cl.conceptId, cl.classType)}
                >
                  {clAlt ? '🔄 Class 2: Remedial Track' : '📘 Class 1: Core Track'}
                  {active && ' (Viewing)'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* EDITING MODE PANEL */}
      {isEditing ? (
        <article className="panel" style={{ borderRadius: '22px', padding: '34px', background: 'rgba(11, 17, 40, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(18px)', boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.09)', paddingBottom: '18px' }}>
            <div>
              <span className="eyebrow" style={{ color: '#818cf8', letterSpacing: '1.4px' }}>CURRICULUM CONTENT STUDIO</span>
              <h1 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: '800', color: '#ffffff' }}>
                ✏️ Edit Notes: {lesson.title}
              </h1>
            </div>
            <span className={`pill ${isAlt ? 'pill-warning' : 'pill-neutral'}`} style={{ fontSize: '13px', fontWeight: '800' }}>
              {isAlt ? '🔄 Class 2: Alternative Track' : '📘 Class 1: Core Track'}
            </span>
          </div>

          {editError && (
            <div className="inline-error" style={{ marginBottom: '18px' }}>
              {editError}
            </div>
          )}

          <form onSubmit={handleSaveLesson} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#858ca5', marginBottom: '6px', display: 'block' }}>
                Lesson Note Title:
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '15px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#858ca5', marginBottom: '6px', display: 'block' }}>
                Tagline / Summary Subtitle:
              </label>
              <input
                type="text"
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                placeholder="Pedagogical focus or summary..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '15px' }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#858ca5' }}>
                  Notes Content (Full Text):
                </label>
                <span style={{ fontSize: '12.5px', color: '#858ca5' }}>
                  Formatting tips: <code>### Heading</code>, <code>- Bullet point</code>, <code>`code`</code>
                </span>
              </div>
              <textarea
                rows={16}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontFamily: 'Consolas, monospace',
                  lineHeight: '1.65',
                  resize: 'vertical'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#858ca5', marginBottom: '6px', display: 'block' }}>
                Java Code Demonstration:
              </label>
              <textarea
                rows={11}
                value={editExampleCode}
                onChange={(e) => setEditExampleCode(e.target.value)}
                placeholder="public class Example { ... }"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  fontSize: '13.5px',
                  fontFamily: 'Consolas, monospace',
                  background: '#040714',
                  color: '#f8fafc',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
              <button
                type="submit"
                className="button button-primary"
                disabled={saving}
                style={{ minWidth: '160px', padding: '12px 24px', fontWeight: '800' }}
              >
                {saving ? 'Saving Changes...' : '💾 Save Changes'}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </article>
      ) : (
        /* READING MODE ARTICLE */
        <article className="panel lesson-article">
          <div className="lesson-header-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <p className="eyebrow" style={{ color: isAlt ? '#fbbf24' : '#818cf8' }}>
                  {isAlt ? 'INTUITIVE ANALOGIES & PITFALL AVOIDANCE' : 'TOPIC THEORY & MEMORY ARCHITECTURE'}
                </p>
                <h1 style={{ margin: '6px 0 10px', fontSize: '32px' }}>{lesson.title}</h1>
                {lesson.tagline && (
                  <p style={{ fontSize: '16px', color: isAlt ? '#fbbf24' : '#a5b4fc', fontStyle: 'italic', margin: '4px 0 0' }}>
                    {lesson.tagline}
                  </p>
                )}
              </div>

              <button
                className="button button-primary button-small"
                style={{ fontWeight: '800', flexShrink: 0 }}
                onClick={() => {
                  setEditTitle(lesson.title || '');
                  setEditTagline(lesson.tagline || '');
                  setEditContent(lesson.content || '');
                  setEditExampleCode(lesson.exampleCode || '');
                  setIsEditing(true);
                }}
              >
                ✏️ Edit Notes
              </button>
            </div>
          </div>

          <div className="lesson-body" style={{ fontSize: '16px', lineHeight: 1.85 }}>
            {lesson.content.split('\n').map((line, index) => renderLessonLine(line, index))}
          </div>

          {lesson.exampleCode && (
            <div className="code-example" style={{ marginTop: '28px', borderRadius: '12px' }}>
              <div className="code-example-header">
                <span>{isAlt ? 'STEP-BY-STEP TRACE & PITFALL DEMO' : 'PRODUCTION JAVA CODE EXAMPLE'}</span>
                <span>● ● ●</span>
              </div>
              <pre><code>{lesson.exampleCode}</code></pre>
            </div>
          )}

          {/* Action Row - Edit Notes is the Primary Action */}
          <div className="lesson-action-row" style={{ marginTop: '28px', flexWrap: 'wrap', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              className="button button-primary"
              style={{ fontWeight: '800', padding: '12px 24px' }}
              onClick={() => {
                setEditTitle(lesson.title || '');
                setEditTagline(lesson.tagline || '');
                setEditContent(lesson.content || '');
                setEditExampleCode(lesson.exampleCode || '');
                setIsEditing(true);
              }}
            >
              ✏️ Edit Notes
            </button>
            {onSwitchTrack && !isAssigned && (
              <button
                className="button button-secondary"
                onClick={() => onSwitchTrack(lesson.conceptId, lesson.classType || 'PRIMARY')}
              >
                Set this Class as My Active Track
              </button>
            )}
            <button
              className="button button-secondary"
              onClick={onBackToLibrary || onBack}
            >
              ← Back to Classes Library
            </button>
            <button className="button button-quiet" onClick={onBack}>
              Return to Dashboard
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
