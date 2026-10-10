import React, { useState, useEffect } from 'react';
import ConceptGraph from '../components/ConceptGraph.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusPill from '../components/StatusPill.jsx';
import Dropdown from '../components/Dropdown.jsx';
import api, { errorMessage } from '../services/api.js';

function Metric({ label, value, detail, accent = 'blue' }) {
  return (
    <div className={`metric-card metric-${accent}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

export default function DashboardPage({
  subject,
  progress,
  mastery,
  recommendation,
  graph,
  lessons = [],
  isAdmin = false,
  currentUser = null,
  onTakeQuiz,
  onLearn,
  onOpenLessonByConcept,
  onSwitchTrack,
  onViewVisualProgress,
  onRefreshData,
  onNavigateToStudio
}) {
  const overall = Number(progress?.averageMastery || 0);
  const mastered = Number(progress?.masteredCount || 0);
  const concepts = mastery || [];

  // Graph Inspection & Editing State
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Add Topic Form State
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicPrereq, setNewTopicPrereq] = useState('');
  const [newTopicLessonTitle, setNewTopicLessonTitle] = useState('');
  const [newTopicLessonContent, setNewTopicLessonContent] = useState('');
  const [newTopicCode, setNewTopicCode] = useState('');
  const [submittingTopic, setSubmittingTopic] = useState(false);

  // Edit Topic Form State
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicDesc, setEditTopicDesc] = useState('');
  const [editTopicPrereq, setEditTopicPrereq] = useState('');
  const [editTopicOrder, setEditTopicOrder] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);

  // Dependency Management State
  const [dependencyList, setDependencyList] = useState([]);
  const [depPrereqId, setDepPrereqId] = useState('');
  const [depTargetId, setDepTargetId] = useState('');
  const [loadingDeps, setLoadingDeps] = useState(false);

  // Determine active selected concept for inspector
  const activeSelectedConcept = concepts.find(c => String(c.conceptId) === String(selectedConceptId)) ||
    (graph?.nodes || []).find(n => String(n.id) === String(selectedConceptId)) ||
    (concepts.length > 0 ? concepts[0] : null);

  // Load dependencies when modal opens or subject changes
  const loadDependencies = async () => {
    if (!subject?.id) return;
    setLoadingDeps(true);
    try {
      const res = await api.get('/admin/dependencies', { params: { subjectId: subject.id } });
      setDependencyList(res.data || []);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    } finally {
      setLoadingDeps(false);
    }
  };

  useEffect(() => {
    if (showDependencyModal) {
      loadDependencies();
    }
  }, [showDependencyModal, subject?.id]);

  // Handle Create Topic
  async function handleAddTopic(e) {
    e.preventDefault();
    if (!newTopicName.trim()) {
      setFeedback({ type: 'error', text: 'Topic title is required.' });
      return;
    }
    setSubmittingTopic(true);
    setFeedback(null);
    try {
      const payload = {
        subjectId: subject?.id,
        name: newTopicName.trim(),
        description: newTopicDesc.trim(),
        displayOrder: concepts.length + 1,
        prerequisiteConceptId: newTopicPrereq ? Number(newTopicPrereq) : null,
        lessonTitle: newTopicLessonTitle.trim() || `Class 1: ${newTopicName.trim()}`,
        lessonContent: newTopicLessonContent.trim() || `Foundational overview for ${newTopicName.trim()}.`,
        exampleCode: newTopicCode.trim() || `// Java code example for ${newTopicName.trim()}\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`
      };
      const res = await api.post('/admin/concepts', payload);
      setFeedback({ type: 'success', text: `Topic "${res.data.name}" added to graph successfully!` });
      setNewTopicName('');
      setNewTopicDesc('');
      setNewTopicPrereq('');
      setNewTopicLessonTitle('');
      setNewTopicLessonContent('');
      setNewTopicCode('');
      setShowAddTopicModal(false);
      setSelectedConceptId(res.data.id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to add topic: ${errorMessage(err)}` });
    } finally {
      setSubmittingTopic(false);
    }
  }

  // Open Edit Modal
  function handleOpenEditModal() {
    if (!activeSelectedConcept) return;
    const cid = activeSelectedConcept.conceptId || activeSelectedConcept.id;
    setEditTopicName(activeSelectedConcept.name || activeSelectedConcept.conceptName || '');
    setEditTopicDesc(activeSelectedConcept.description || '');
    setEditTopicOrder(String(activeSelectedConcept.displayOrder || ''));
    
    // Find current incoming prerequisite
    const incomingEdge = (graph?.edges || []).find(e => String(e.target) === String(cid));
    setEditTopicPrereq(incomingEdge ? incomingEdge.source : '');
    setShowEditTopicModal(true);
  }

  // Handle Save Edit Topic
  async function handleSaveEditTopic(e) {
    e.preventDefault();
    const cid = activeSelectedConcept?.conceptId || activeSelectedConcept?.id;
    if (!cid) return;
    setSavingTopic(true);
    setFeedback(null);
    try {
      await api.put(`/admin/concepts/${cid}`, {
        name: editTopicName.trim(),
        description: editTopicDesc.trim(),
        displayOrder: editTopicOrder ? Number(editTopicOrder) : null,
        prerequisiteConceptId: editTopicPrereq !== '' ? Number(editTopicPrereq) : 0
      });
      setFeedback({ type: 'success', text: `Topic "${editTopicName}" updated successfully!` });
      setShowEditTopicModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to update topic: ${errorMessage(err)}` });
    } finally {
      setSavingTopic(false);
    }
  }

  // Handle Delete Topic
  async function handleDeleteTopic() {
    const cid = activeSelectedConcept?.conceptId || activeSelectedConcept?.id;
    const cname = activeSelectedConcept?.name || activeSelectedConcept?.conceptName || `Topic #${cid}`;
    if (!cid) return;
    if (!window.confirm(`Are you sure you want to delete topic "${cname}" from the dependency graph?\n\nThis will remove its prerequisite connections, lessons, and authored questions.`)) {
      return;
    }
    setFeedback(null);
    try {
      await api.delete(`/admin/concepts/${cid}`);
      setFeedback({ type: 'success', text: `Topic "${cname}" removed from graph.` });
      setSelectedConceptId(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to delete topic: ${errorMessage(err)}` });
    }
  }

  // Handle Add Dependency
  async function handleAddDependency(e) {
    e.preventDefault();
    if (!depPrereqId || !depTargetId) return;
    if (depPrereqId === depTargetId) {
      alert('A topic cannot depend on itself.');
      return;
    }
    try {
      await api.post('/admin/dependencies', {
        prerequisiteConceptId: Number(depPrereqId),
        dependentConceptId: Number(depTargetId)
      });
      setDepPrereqId('');
      setDepTargetId('');
      await loadDependencies();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Could not create prerequisite rule: ${errorMessage(err)}`);
    }
  }

  // Handle Remove Dependency
  async function handleRemoveDependency(prereqId, targetId) {
    try {
      await api.delete('/admin/dependencies', {
        params: { prerequisiteId: prereqId, dependentId: targetId }
      });
      await loadDependencies();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Could not remove prerequisite rule: ${errorMessage(err)}`);
    }
  }

  // Find incoming and outgoing connections for active concept
  const activeCid = activeSelectedConcept?.conceptId || activeSelectedConcept?.id;
  const incomingEdges = (graph?.edges || []).filter(e => String(e.target) === String(activeCid));
  const outgoingEdges = (graph?.edges || []).filter(e => String(e.source) === String(activeCid));
  const topicLessons = lessons.filter(l => String(l.conceptId) === String(activeCid));

  return (
    <div className="page-stack">
      {/* Feedback Banner */}
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

      {/* Welcome Banner in Cosmic Glassmorphism */}
      <section className="welcome-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p className="eyebrow" style={{ color: '#818cf8', fontWeight: 800, margin: '0 0 6px', letterSpacing: '1.2px' }}>
              {isAdmin ? 'ADMINISTRATIVE CURRICULUM ARCHITECTURE' : 'PERSONALIZED ADAPTIVE LEARNING'}
            </p>
            <h1 style={{ margin: '0 0 8px', fontSize: '30px', fontWeight: 800, color: '#ffffff' }}>
              {isAdmin
                ? `${subject?.name || 'Java Programming'} Dependency Graph & Curriculum`
                : `Master ${subject?.name || 'Java Programming'}, Step by Step`}
            </h1>
            <p style={{ margin: 0, color: '#9aa4bf', fontSize: '15px' }}>
              {isAdmin
                ? 'Visualize, add, edit, and connect curriculum topics and prerequisite rules directly in the interactive graph.'
                : 'Topics unlock sequentially. Complete each concept with 75%+ mastery to unlock subsequent concepts in the knowledge graph.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {isAdmin ? (
              <>
                <button
                  className="button button-primary"
                  onClick={() => setShowAddTopicModal(true)}
                >
                  <span>➕</span> Add Topic to Graph
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => setShowDependencyModal(true)}
                >
                  <span>🔗</span> Manage Dependencies
                </button>
              </>
            ) : (
              <>
                {onViewVisualProgress && (
                  <button
                    className="button button-secondary"
                    onClick={onViewVisualProgress}
                  >
                    <span>📊</span> Visual Analytics
                  </button>
                )}
                <button
                  className="button button-primary"
                  onClick={() => onTakeQuiz(recommendation?.conceptId)}
                >
                  <span>✦</span> {recommendation?.conceptName ? `Quiz: ${recommendation.conceptName}` : 'Start active quiz'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Real Statistics in Sleek Cosmic Glass Cards */}
      <section className="metric-grid">
        <Metric
          label={isAdmin ? 'Total Topics' : 'Overall Mastery'}
          value={isAdmin ? (concepts.length || (graph?.nodes || []).length || 0) : `${overall}%`}
          detail={isAdmin ? 'Nodes in curriculum graph' : 'Average of assessed concepts'}
          accent="blue"
        />
        <Metric
          label={isAdmin ? 'Curriculum Classes' : 'Concepts Mastered'}
          value={isAdmin ? lessons.length : `${mastered} / ${progress?.conceptCount || concepts.length || 0}`}
          detail={isAdmin ? 'Core & Remedial lesson tracks' : '75% mastery threshold required'}
          accent="green"
        />
        <Metric
          label={isAdmin ? 'Dependency Rules' : 'Questions Attempted'}
          value={isAdmin ? (graph?.edges || []).length : (progress?.attemptedQuestions || 0)}
          detail={isAdmin ? 'Prerequisite flow connections' : `${progress?.correctAnswers || 0} correct answers recorded`}
          accent="purple"
        />
        <Metric
          label={isAdmin ? 'Admin Mode' : 'Active & Unlocked'}
          value={isAdmin ? 'Editable' : concepts.filter(c => c.unlocked && c.masteryScore < 75).length}
          detail={isAdmin ? 'Drag & click nodes to edit' : `${concepts.filter(c => !c.unlocked).length} locked until prerequisites met`}
          accent="amber"
        />
      </section>

      {/* Graph and Inspector Grid */}
      <section className="content-grid">
        <div className="panel graph-panel">
          <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p className="eyebrow" style={{ margin: 0 }}>KNOWLEDGE MAP</p>
                {isAdmin && (
                  <span className="pill" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)', fontSize: '12px', fontWeight: 'bold' }}>
                    ✏️ ADMIN EDITABLE GRAPH
                  </span>
                )}
              </div>
              <h2 style={{ margin: '4px 0 0' }}>{subject?.name || 'Learning'} dependency graph</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {isAdmin && (
                <button
                  className="button button-primary button-small"
                  onClick={() => setShowAddTopicModal(true)}
                  title="Add new topic to this dependency graph"
                >
                  <span>➕</span> Add Topic
                </button>
              )}
              <div className="legend">
                <span><i className="dot dot-mastered" /> Mastered (75%+)</span>
                <span><i className="dot dot-practice" /> Ready / Practice</span>
                <span><i className="dot dot-locked" /> 🔒 Locked</span>
              </div>
            </div>
          </div>

          <p className="panel-subtitle">
            {isAdmin
              ? 'Admin Mode: Click "+ Add Topic" to add concepts to the graph, or click any topic node to edit its name, description, and prerequisite links. You can also drag nodes to arrange them.'
              : 'Arrows indicate prerequisite rules. Concepts with a lock 🔒 will unlock once their prerequisites reach 75%+ mastery. Click an unlocked concept to start!'}
          </p>

          <ConceptGraph
            graph={graph}
            isAdmin={isAdmin}
            selectedConceptId={activeCid}
            onSelectConcept={(node) => setSelectedConceptId(node.id)}
            onChooseConcept={(conceptId) => onTakeQuiz(conceptId)}
          />
        </div>

        {/* Right Sidebar: Admin Topic Inspector OR Student Recommendation */}
        {isAdmin ? (
          <aside className="panel recommendation-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow" style={{ margin: 0 }}>TOPIC INSPECTOR &amp; CONTROLS</span>
              <span className="pill pill-primary" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>
                Topic #{activeCid || '?'}
              </span>
            </div>

            {activeSelectedConcept ? (
              <>
                <div>
                  <h2 style={{ margin: '0 0 6px' }}>
                    {activeSelectedConcept.name || activeSelectedConcept.conceptName}
                  </h2>
                  <p className="muted small" style={{ margin: 0 }}>
                    {activeSelectedConcept.description || 'No topic description provided.'}
                  </p>
                </div>

                {/* Prerequisite & Connection Info */}
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.09)', fontSize: '13.5px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Prerequisite (Depends on):</span>
                    <strong style={{ color: '#ffffff' }}>
                      {incomingEdges.length > 0
                        ? incomingEdges.map(e => {
                            const pNode = (graph?.nodes || []).find(n => String(n.id) === String(e.source));
                            return pNode ? pNode.name : `#${e.source}`;
                          }).join(', ')
                        : 'None (Root Topic)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Unlocks (Dependents):</span>
                    <strong style={{ color: '#ffffff' }}>
                      {outgoingEdges.length > 0
                        ? outgoingEdges.map(e => {
                            const dNode = (graph?.nodes || []).find(n => String(n.id) === String(e.target));
                            return dNode ? dNode.name : `#${e.target}`;
                          }).join(', ')
                        : 'End of current branch'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Associated Classes:</span>
                    <strong style={{ color: '#38bdf8' }}>{topicLessons.length} lessons available</strong>
                  </div>
                </div>

                {/* Action Buttons for Selected Topic */}
                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    className="button button-primary button-full"
                    onClick={handleOpenEditModal}
                  >
                    ✏️ Edit Topic &amp; Prerequisites
                  </button>

                  {onNavigateToStudio && (
                    <button
                      className="button button-secondary button-full"
                      onClick={onNavigateToStudio}
                    >
                      🛠️ Open in Curriculum Studio
                    </button>
                  )}

                  <button
                    className="button button-quiet button-full"
                    onClick={handleDeleteTopic}
                    style={{ color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.35)', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '9px' }}
                  >
                    🗑️ Delete Topic from Graph
                  </button>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '6px 0' }} />

                <button
                  className="button button-secondary button-full"
                  onClick={() => setShowAddTopicModal(true)}
                  style={{ borderStyle: 'dashed' }}
                >
                  ➕ Add Another Topic to Graph
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <p className="muted">Select a topic node on the dependency graph to inspect or edit.</p>
                <button
                  className="button button-primary"
                  onClick={() => setShowAddTopicModal(true)}
                  style={{ marginTop: '10px' }}
                >
                  ➕ Add New Topic
                </button>
              </div>
            )}
          </aside>
        ) : (
          <aside className="panel recommendation-panel">
            <div className="recommendation-icon">{recommendation?.assignedClassType === 'ALTERNATIVE' ? '🔄' : '✦'}</div>
            <p className="eyebrow">YOUR NEXT BEST STEP</p>
            <h2>{recommendation?.complete ? 'Learning path completed!' : recommendation?.conceptName || 'Finding your next lesson'}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
              {recommendation && <StatusPill status={recommendation.status} />}
              {recommendation?.assignedClassType === 'ALTERNATIVE' && (
                <span className="pill pill-warning" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 'bold' }}>
                  🔄 Class 2: Remedial Track Active
                </span>
              )}
            </div>
            <p className="recommendation-reason">
              {recommendation?.reason || 'Start with the first concept (Variables) and score 75%+ to unlock the subsequent concept!'}
            </p>

            {recommendation?.conceptId && (
              <div className="recommendation-score">
                <div className="score-line">
                  <span>Current concept mastery</span>
                  <strong>{recommendation.masteryScore}%</strong>
                </div>
                <ProgressBar value={recommendation.masteryScore} />
              </div>
            )}

            <div className="next-step-box">
              <strong>Recommended action</strong>
              <p>{recommendation?.nextStep || 'Study the lesson and complete its 3-question quiz to establish mastery.'}</p>
            </div>

            <button
              className="button button-primary button-full"
              disabled={!recommendation?.lessonId}
              onClick={() => onLearn(recommendation.lessonId)}
            >
              {recommendation?.complete
                ? 'Review learning path'
                : recommendation?.assignedClassType === 'ALTERNATIVE'
                  ? 'Study Alternative Class (Class 2) →'
                  : 'Study Lesson →'}
            </button>

            <button
              className="button button-secondary button-full"
              style={{ marginTop: '8px' }}
              disabled={!recommendation?.conceptId}
              onClick={() => onTakeQuiz(recommendation?.conceptId)}
            >
              Take {recommendation?.conceptName || 'Concept'} Quiz
            </button>
          </aside>
        )}
      </section>

      {/* CURRICULUM LESSONS SECTION */}
      <section className="panel lessons-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CURRICULUM LESSONS</p>
            <h2>Learning Lessons &amp; Study Guides</h2>
          </div>
          <span className="badge badge-primary">{lessons.length} Lessons Available</span>
        </div>
        <p className="panel-subtitle">
          Study the comprehensive topic explanations, memory layout diagrams, and real-world code examples to master each concept before testing.
        </p>

        {lessons.length === 0 ? (
          <div className="card-empty-note">
            <p className="muted">No lessons loaded for this subject yet. Choose a concept to begin learning!</p>
          </div>
        ) : (
          <div className="lessons-grid">
            {lessons.map((les, idx) => {
              const conceptInfo = concepts.find(c => c.conceptId === les.conceptId);
              const isUnlocked = conceptInfo ? conceptInfo.unlocked : true;
              const isAssigned = conceptInfo ? (conceptInfo.assignedClassType || 'PRIMARY') === les.classType : les.classType === 'PRIMARY';
              const isAlt = les.classType === 'ALTERNATIVE';

              return (
                <div className={`lesson-card ${!isUnlocked ? 'lesson-card-locked' : ''} ${isAssigned ? 'lesson-card-assigned' : ''}`} key={les.id}>
                  <div className="lesson-card-header">
                    <span className="lesson-num-badge">Class {idx + 1}</span>
                    <span className="lesson-concept-tag">{les.conceptName || `Concept #${les.conceptId}`}</span>
                    <span className={`pill ${isAlt ? 'pill-warning' : 'pill-neutral'}`} style={{ fontSize: '12.5px', fontWeight: '700' }}>
                      {isAlt ? 'Class 2: Alternative' : 'Class 1: Core'}
                    </span>
                    {isAssigned && (
                      <span className="pill pill-mastered" style={{ fontSize: '12.5px', fontWeight: '700' }}>
                        🎯 Active Track
                      </span>
                    )}
                  </div>

                  <h3 className="lesson-card-title">{les.title}</h3>
                  <p className="lesson-card-tagline">{les.tagline || 'Essential conceptual foundation'}</p>

                  <div className="lesson-card-footer">
                    <button
                      className="button button-primary button-small"
                      onClick={() => onLearn(les.id)}
                    >
                      Read Class →
                    </button>
                    {isUnlocked && onTakeQuiz && (
                      <button
                        className="button button-secondary button-small"
                        onClick={() => onTakeQuiz(les.conceptId)}
                      >
                        Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CONCEPTS MASTERY LIST */}
      <section className="panel concepts-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CURRICULUM BREAKDOWN</p>
            <h2>Concepts Mastery Overview</h2>
          </div>
          <span className="badge badge-neutral">{concepts.length} Concepts Tracked</span>
        </div>
        <p className="panel-subtitle">
          Sequential unlock path: score 75% or higher on each concept quiz to unlock the next concept in the progression.
        </p>

        <div className="concept-list-grid">
          {concepts.map((concept, idx) => {
            const isLocked = !concept.unlocked;
            const isAlt = concept.assignedClassType === 'ALTERNATIVE';

            return (
              <div
                className={`concept-dialog-card ${isLocked ? 'concept-card-locked' : 'concept-card-unlocked'}`}
                key={concept.conceptId}
              >
                {/* Header Row */}
                <div className="concept-card-top">
                  <div className="concept-card-title-group">
                    <span className="concept-card-order-tag">Topic {idx + 1}</span>
                    <h3 className="concept-card-name">{concept.conceptName}</h3>
                  </div>
                  <div className="concept-card-badges">
                    <StatusPill status={concept.status} />
                    {isAlt && (
                      <span className="pill pill-warning" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>
                        Class 2 Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Mastery Progress Bar */}
                <div className="concept-card-progress-section">
                  <div className="concept-card-progress-labels">
                    <span className="concept-card-progress-sub">Demonstrated Mastery</span>
                    <strong className="concept-card-score-value">
                      {isLocked ? '🔒 Locked' : `${concept.masteryScore}%`}
                    </strong>
                  </div>
                  <ProgressBar value={concept.masteryScore} compact />
                </div>

                {/* Footer / Dialogue Message Box */}
                <div className="concept-card-footer">
                  {isLocked ? (
                    <div className="concept-prereq-alert-box">
                      <span className="concept-prereq-alert-icon">🔒</span>
                      <div className="concept-prereq-alert-text">
                        <strong>Prerequisite Required:</strong>{' '}
                        <span>
                          Requires 75%+ mastery in{' '}
                          <strong>{(concept.prerequisiteNames || []).join(', ') || 'previous topic'}</strong>{' '}
                          to unlock.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="concept-card-action-row">
                      <span className="concept-card-stats-text">
                        {concept.totalAttempts} attempts · {concept.correctAnswers} correct
                      </span>
                      <div className="concept-card-btn-group">
                        <button
                          className="button button-secondary button-small"
                          onClick={() => onOpenLessonByConcept ? onOpenLessonByConcept(concept.conceptId, concept.assignedClassType) : onTakeQuiz(concept.conceptId)}
                          title="Read assigned class lesson"
                        >
                          📖 Read {isAlt ? 'Class 2' : 'Class 1'}
                        </button>
                        <button
                          className="button button-primary button-small"
                          onClick={() => onTakeQuiz(concept.conceptId)}
                        >
                          Take Quiz →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL 1: ADD TOPIC TO GRAPH */}
      {showAddTopicModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 4, 11, 0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '20px'
        }}>
          <div className="card modal-card" style={{
            background: 'rgba(12, 18, 42, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#ffffff',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#818cf8' }}>GRAPH ARCHITECTURE</span>
                <h3 style={{ margin: '4px 0 0', color: '#ffffff' }}>Add Topic to {subject?.name || 'Curriculum'}</h3>
              </div>
              <button
                className="button button-quiet"
                onClick={() => setShowAddTopicModal(false)}
                style={{ fontSize: '22px', lineHeight: 1, color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTopic} style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#aeb5ca' }}>
                Topic / Concept Title *
                <input
                  type="text"
                  required
                  placeholder="e.g. Methods & Functions"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '15px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#aeb5ca' }}>
                Topic Description
                <textarea
                  rows={2}
                  placeholder="Define key concepts, rules, and scope for this topic"
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '15px', resize: 'vertical' }}
                />
              </label>

              <div>
                <Dropdown
                  label="PREREQUISITE TOPIC (DEPENDENCY ARROW)"
                  variant="form"
                  icon="🔗"
                  value={newTopicPrereq}
                  options={[
                    { value: '', label: 'None (Root Topic / Starts First)', icon: '🌱' },
                    ...concepts.map(c => ({
                      value: String(c.conceptId),
                      label: `#${c.conceptId} ${c.conceptName}`,
                      icon: '📌'
                    }))
                  ]}
                  onChange={(val) => setNewTopicPrereq(val)}
                  aria-label="Choose prerequisite concept"
                />
                <small className="muted" style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: '#858ca5' }}>
                  An arrow will connect from the prerequisite topic to this new topic in the graph.
                </small>
              </div>

              <details style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#a5b4fc' }}>
                  + Optional Initial Lesson Details
                </summary>
                <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '13.5px', fontWeight: '600', color: '#aeb5ca' }}>
                    Lesson Title
                    <input
                      type="text"
                      placeholder="e.g. Class 1: Methods Architecture"
                      value={newTopicLessonTitle}
                      onChange={(e) => setNewTopicLessonTitle(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '13.5px', fontWeight: '600', color: '#aeb5ca' }}>
                    Lesson Content
                    <textarea
                      rows={2}
                      placeholder="Detailed explanation"
                      value={newTopicLessonContent}
                      onChange={(e) => setNewTopicLessonContent(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '14px', resize: 'vertical' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '13.5px', fontWeight: '600', color: '#aeb5ca' }}>
                    Code Example
                    <textarea
                      rows={2}
                      placeholder="// Java code snippet"
                      value={newTopicCode}
                      onChange={(e) => setNewTopicCode(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '13.5px', fontFamily: 'monospace' }}
                    />
                  </label>
                </div>
              </details>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddTopicModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={submittingTopic}
                >
                  {submittingTopic ? 'Adding to Graph…' : '✓ Add Topic to Graph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TOPIC */}
      {showEditTopicModal && activeSelectedConcept && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 4, 11, 0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '20px'
        }}>
          <div className="card modal-card" style={{
            background: 'rgba(12, 18, 42, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#ffffff',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#818cf8' }}>EDIT TOPIC</span>
                <h3 style={{ margin: '4px 0 0', color: '#ffffff' }}>Update Topic Details</h3>
              </div>
              <button
                className="button button-quiet"
                onClick={() => setShowEditTopicModal(false)}
                style={{ fontSize: '22px', lineHeight: 1, color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditTopic} style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#aeb5ca' }}>
                Topic Name *
                <input
                  type="text"
                  required
                  value={editTopicName}
                  onChange={(e) => setEditTopicName(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '15px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#aeb5ca' }}>
                Topic Description
                <textarea
                  rows={3}
                  value={editTopicDesc}
                  onChange={(e) => setEditTopicDesc(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', fontSize: '15px', resize: 'vertical' }}
                />
              </label>

              <div>
                <Dropdown
                  label="PREREQUISITE TOPIC"
                  variant="form"
                  icon="🔗"
                  value={editTopicPrereq}
                  options={[
                    { value: '', label: 'None (Root Topic)', icon: '🌱' },
                    ...concepts
                      .filter(c => String(c.conceptId) !== String(activeCid))
                      .map(c => ({
                        value: String(c.conceptId),
                        label: `#${c.conceptId} ${c.conceptName}`,
                        icon: '📌'
                      }))
                  ]}
                  onChange={(val) => setEditTopicPrereq(val)}
                  aria-label="Edit prerequisite concept"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowEditTopicModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={savingTopic}
                >
                  {savingTopic ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE DEPENDENCIES */}
      {showDependencyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 4, 11, 0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '20px'
        }}>
          <div className="card modal-card" style={{
            background: 'rgba(12, 18, 42, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#ffffff',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#818cf8' }}>DEPENDENCY GRAPH ARCHITECTURE</span>
                <h3 style={{ margin: '4px 0 0', color: '#ffffff' }}>Prerequisite Connection Rules</h3>
              </div>
              <button
                className="button button-quiet"
                onClick={() => setShowDependencyModal(false)}
                style={{ fontSize: '22px', lineHeight: 1, color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <p className="muted small" style={{ marginBottom: '18px', color: '#9aa4bf' }}>
              Arrows flow from the <strong>Prerequisite topic</strong> to the <strong>Dependent topic</strong>. Students must score 75%+ on the prerequisite topic before the dependent topic unlocks.
            </p>

            {/* Existing Rules List */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#858ca5', marginBottom: '10px' }}>
                Current Graph Connections ({dependencyList.length})
              </h4>
              {loadingDeps ? (
                <p className="muted small" style={{ color: '#858ca5' }}>Loading connections…</p>
              ) : dependencyList.length === 0 ? (
                <p className="muted small" style={{ color: '#858ca5' }}>No prerequisite rules defined for this subject.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {dependencyList.map(dep => (
                    <div
                      key={dep.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#ffffff' }}>{dep.prerequisiteName}</span>
                        <span style={{ color: '#818cf8' }}>➔</span>
                        <span style={{ fontWeight: '600', color: '#ffffff' }}>{dep.dependentName}</span>
                      </div>
                      <button
                        className="button button-quiet button-small"
                        onClick={() => handleRemoveDependency(dep.prerequisiteConceptId, dep.dependentConceptId)}
                        style={{ color: '#f43f5e' }}
                        title="Remove prerequisite connection"
                      >
                        Disconnect ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Rule Form */}
            <form onSubmit={handleAddDependency} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '18px', borderRadius: '12px', display: 'grid', gap: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '14.5px', color: '#818cf8', fontWeight: 800 }}>Connect a New Prerequisite Arrow</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Dropdown
                  label="PREREQUISITE (SOURCE)"
                  variant="form"
                  icon="🌱"
                  value={depPrereqId}
                  options={[
                    { value: '', label: 'Select Source…' },
                    ...concepts.map(c => ({
                      value: String(c.conceptId),
                      label: c.conceptName
                    }))
                  ]}
                  onChange={(val) => setDepPrereqId(val)}
                  aria-label="Select source concept"
                />

                <Dropdown
                  label="DEPENDENT (TARGET)"
                  variant="form"
                  icon="🎯"
                  value={depTargetId}
                  options={[
                    { value: '', label: 'Select Target…' },
                    ...concepts.map(c => ({
                      value: String(c.conceptId),
                      label: c.conceptName
                    }))
                  ]}
                  onChange={(val) => setDepTargetId(val)}
                  aria-label="Select target concept"
                />
              </div>

              <button
                type="submit"
                className="button button-primary"
                disabled={!depPrereqId || !depTargetId || depPrereqId === depTargetId}
                style={{ justifySelf: 'flex-end' }}
              >
                Connect Dependency Arrow ➔
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowDependencyModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
