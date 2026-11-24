import React from 'react';

export function MatchSkeletonList({ count = 4 }) {
  return (
    <div className="matches-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card" aria-hidden="true">
          <div className="skeleton-video" />
          <div className="skeleton-text-line" style={{ width: '40%', marginTop: '1rem' }} />
          <div className="skeleton-text-line" style={{ width: '80%' }} />
          <div className="skeleton-text-line" style={{ width: '60%', marginBottom: '1.2rem' }} />
        </div>
      ))}
    </div>
  );
}
