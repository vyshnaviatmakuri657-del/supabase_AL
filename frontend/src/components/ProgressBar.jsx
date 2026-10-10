import React from 'react';

export default function ProgressBar({ value = 0, compact = false }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className={`progress-track ${compact ? 'compact' : ''}`} aria-label={`Mastery ${safe}%`}>
    <div className="progress-value" style={{ width: `${safe}%` }} />
  </div>;
}
