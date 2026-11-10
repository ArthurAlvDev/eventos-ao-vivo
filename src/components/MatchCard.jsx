import React, { memo } from 'react';
import { VideoPlayer } from './VideoPlayer';

export const MatchCard = memo(function MatchCard({ match }) {
  const { titulo, detalhes, campeonato, canal, placar, status } = match;

  return (
    <article className="match-card">
      <header className="match-header">
        <span className="championship-tag" title={campeonato}>
          {campeonato || 'Futebol'}
        </span>
        <div className="match-status-wrap">
          <span className="pulse-dot" aria-hidden="true" />
          <span>{status || 'AO VIVO'}</span>
        </div>
      </header>

      {/* Player com lazy loading nativo ou botão "Abrir no YouTube" */}
      <VideoPlayer match={match} />

      <footer className="match-info">
        <h3 className="match-title">{titulo}</h3>
        {detalhes && <p className="brand-subtitle">{detalhes}</p>}

        <div className="match-meta">
          <span className="channel-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
            {canal || 'Transmissão Ao Vivo'}
          </span>

          {placar && <span className="score-badge">{placar}</span>}
        </div>
      </footer>
    </article>
  );
});
