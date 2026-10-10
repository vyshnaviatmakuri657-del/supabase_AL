import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function ConceptNode({ data, selected }) {
  const {
    id,
    name,
    masteryScore = 0,
    isLocked,
    isMastered,
    isAdmin
  } = data;

  const isClickable = isAdmin || !isLocked;

  return (
    <div
      className={`flow-node-compact ${isLocked && !isAdmin ? 'node-locked' : 'node-active'} ${isMastered ? 'node-mastered' : ''} ${selected ? 'node-selected' : ''}`}
      style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
    >
      <Handle type="target" position={Position.Top} className="clean-handle" />

      {/* Top Node Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        {/* Left Glowing Icon Circle */}
        <div className={`node-icon-circle ${isMastered ? 'icon-mastered' : isLocked && !isAdmin ? 'icon-locked' : 'icon-active'}`}>
          {isMastered ? '✓' : isLocked && !isAdmin ? '🔒' : `#${id}`}
        </div>

        {/* Text Block */}
        <div className="node-text-block">
          <div className="node-title">{name}</div>
          <div className="node-subtitle">
            {isAdmin ? (
              <span style={{ color: '#f59e0b', fontWeight: '700' }}>Topic #{id}</span>
            ) : isMastered ? (
              <span style={{ color: '#34d399', fontWeight: '700' }}>{masteryScore}% Mastered</span>
            ) : isLocked ? (
              <span style={{ color: '#64748b' }}>Prereq locked</span>
            ) : (
              <span style={{ color: '#38bdf8', fontWeight: '700' }}>Ready to learn ⚡</span>
            )}
          </div>
        </div>

        {/* Right status/edit badge */}
        {isAdmin && (
          <span className="node-edit-badge" title="Click to inspect & edit topic">
            ✏️
          </span>
        )}
      </div>

      {/* Mini Progress Bar inside the Node Card */}
      {!isAdmin && (
        <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, masteryScore))}%`,
              height: '100%',
              background: isMastered
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #6366f1, #38bdf8)',
              boxShadow: isMastered
                ? '0 0 8px rgba(16, 185, 129, 0.8)'
                : '0 0 8px rgba(56, 189, 248, 0.8)',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="clean-handle" />
    </div>
  );
}

const nodeTypes = {
  conceptNode: ConceptNode
};

/**
 * Computes a clean hierarchical topological layout with generous spacing
 * so nodes never collide vertically or horizontally.
 */
function computeTopologicalLayout(rawNodes = [], rawEdges = []) {
  if (!rawNodes || !rawNodes.length) return new Map();

  const rank = new Map();
  rawNodes.forEach(n => rank.set(String(n.id), 0));

  // Relax ranks along directed edges so each node is strictly below its prerequisites
  for (let i = 0; i < rawNodes.length + 1; i++) {
    rawEdges.forEach(e => {
      const src = String(e.source);
      const tgt = String(e.target);
      const srcRank = rank.get(src) ?? 0;
      const tgtRank = rank.get(tgt) ?? 0;
      if (srcRank + 1 > tgtRank) {
        rank.set(tgt, srcRank + 1);
      }
    });
  }

  // Group by level
  const levels = new Map();
  rawNodes.forEach(n => {
    const r = rank.get(String(n.id)) ?? 0;
    if (!levels.has(r)) levels.set(r, []);
    levels.get(r).push(n);
  });

  const sortedRanks = Array.from(levels.keys()).sort((a, b) => a - b);

  const CARD_WIDTH = 220;
  const LEVEL_Y_GAP = 115; // Clean vertical gap
  const NODE_X_GAP = 75;
  const START_Y = 30;
  const CENTER_X = 300;

  const resultMap = new Map();

  sortedRanks.forEach(r => {
    const nodesInLevel = levels.get(r);
    const count = nodesInLevel.length;
    const totalWidth = count * CARD_WIDTH + (count - 1) * NODE_X_GAP;
    const startX = CENTER_X - totalWidth / 2;

    nodesInLevel.forEach((n, idx) => {
      const x = startX + idx * (CARD_WIDTH + NODE_X_GAP);
      const y = START_Y + r * LEVEL_Y_GAP;
      resultMap.set(String(n.id), { x, y });
    });
  });

  return resultMap;
}

export default function ConceptGraph({
  graph,
  onChooseConcept,
  isAdmin = false,
  selectedConceptId = null,
  onSelectConcept = null
}) {
  const [animatedFlow, setAnimatedFlow] = useState(true);

  // Calculate clean, collision-free positions
  const layoutPositions = useMemo(() => {
    return computeTopologicalLayout(graph?.nodes || [], graph?.edges || []);
  }, [graph?.nodes, graph?.edges]);

  const nodes = useMemo(() => (graph?.nodes || []).map((node) => {
    const isLocked = node.locked || node.status === 'LOCKED';
    const isMastered = node.status === 'MASTERED' || Number(node.masteryScore) >= 75;
    const isSelected = selectedConceptId && String(node.id) === String(selectedConceptId);
    const pos = layoutPositions.get(String(node.id)) || { x: node.x, y: node.y };

    return {
      id: String(node.id),
      type: 'conceptNode',
      position: pos,
      selected: isSelected,
      data: {
        id: node.id,
        name: node.name,
        description: node.description,
        masteryScore: Math.round(Number(node.masteryScore || 0)),
        status: node.status,
        isLocked,
        isMastered,
        isAdmin
      }
    };
  }), [graph, isAdmin, selectedConceptId, layoutPositions]);

  const edges = useMemo(() => (graph?.edges || []).map((edge) => {
    const sourceNode = (graph?.nodes || []).find(n => String(n.id) === String(edge.source));
    const targetNode = (graph?.nodes || []).find(n => String(n.id) === String(edge.target));
    const isSourceMastered = sourceNode?.status === 'MASTERED' || Number(sourceNode?.masteryScore) >= 75;
    const isTargetLocked = (targetNode?.locked || targetNode?.status === 'LOCKED') && !isAdmin;

    let strokeColor = '#38bdf8';
    let isAnimated = animatedFlow;
    let strokeWidth = 2.2;
    let filter = 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))';

    if (isSourceMastered) {
      strokeColor = '#10b981';
      strokeWidth = 2.2;
      filter = 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))';
    } else if (isTargetLocked) {
      strokeColor = 'rgba(255, 255, 255, 0.16)';
      isAnimated = false;
      strokeWidth = 1.8;
      filter = 'none';
    }

    return {
      id: edge.id,
      source: String(edge.source),
      target: String(edge.target),
      type: 'smoothstep',
      pathOptions: { borderRadius: 14 },
      animated: isAnimated,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
        width: 15,
        height: 15
      },
      style: {
        stroke: strokeColor,
        strokeWidth,
        filter,
        strokeDasharray: isTargetLocked ? '5 4' : undefined
      }
    };
  }), [graph, animatedFlow, isAdmin]);

  if (!nodes.length) {
    return <div className="empty-state">The concept graph will appear when the backend is connected.</div>;
  }

  return (
    <div className="graph-canvas">
      {/* Floating Canvas Top Overlay / Controls */}
      <div className="graph-floating-hud">
        <div className="graph-hud-pill-group">
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#818cf8', letterSpacing: '0.8px' }}>
            PREREQUISITE FLOWCHART
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
          <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '700' }}>
            {nodes.length} Topics
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          <button
            type="button"
            className={`graph-hud-btn ${animatedFlow ? 'active' : ''}`}
            onClick={() => setAnimatedFlow(prev => !prev)}
            title="Toggle animated knowledge pulse along dependency paths"
          >
            <span>⚡</span> Energy Pulse: {animatedFlow ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        nodesDraggable={isAdmin}
        nodesConnectable={false}
        elementsSelectable={true}
        onNodeClick={(_, node) => {
          if (isAdmin) {
            const rawNode = (graph?.nodes || []).find(n => String(n.id) === String(node.id));
            if (rawNode) onSelectConcept?.(rawNode);
          } else {
            const rawNode = (graph?.nodes || []).find(n => String(n.id) === String(node.id));
            const isLocked = rawNode?.locked || rawNode?.status === 'LOCKED';
            if (!isLocked) {
              onChooseConcept?.(Number(node.id));
            }
          }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" color="rgba(99, 102, 241, 0.22)" gap={22} size={1.4} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
