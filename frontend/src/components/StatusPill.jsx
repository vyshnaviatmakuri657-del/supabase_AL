import React from 'react';

const labels = {
  MASTERED: 'Mastered',
  NEEDS_PRACTICE: 'Needs practice',
  WEAK: 'Weak concept',
  NOT_ASSESSED: 'Not assessed',
  NOT_CONFIGURED: 'Not configured',
  BLOCKED: 'Prerequisite blocked',
  LOCKED: '🔒 Locked'
};

export default function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status || 'not_assessed').toLowerCase()}`}>{labels[status] || status || 'Not assessed'}</span>;
}
