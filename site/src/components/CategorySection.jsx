import React, { memo } from 'react';
import { MatchCard } from './MatchCard';

export const CategorySection = memo(function CategorySection({ categoria, matches }) {
  if (!matches || matches.length === 0) return null;

  return (
    <section className="category-group" aria-labelledby={`cat-${categoria}`}>
      <div className="category-header">
        <div className="category-title-wrap">
          <span className="category-badge-pill" aria-hidden="true" />
          <h2 id={`cat-${categoria}`} className="category-title">
            {categoria}
          </h2>
        </div>
        <span className="category-count">
          {matches.length} {matches.length === 1 ? 'jogo' : 'jogos'}
        </span>
      </div>

      <div className="matches-grid">
        {matches.map((match) => (
          <MatchCard key={match.id || match.youtube_id || match.url} match={match} />
        ))}
      </div>
    </section>
  );
});
