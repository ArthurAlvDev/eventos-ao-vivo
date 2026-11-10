import React from 'react';

export function Header({ liveCount, onRefresh, isRefreshing, lastUpdated }) {
  return (
    <header className="header">
      <div className="brand-wrapper">
        <div className="brand-icon" aria-hidden="true">
          {/* Bola de Futebol Vetorial Leve */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 6 7.5 9.5 9 15 15 15 16.5 9.5 12 6" />
          </svg>
        </div>
        <div>
          <h1 className="brand-title">Futebol Ao Vivo</h1>
          <p className="brand-subtitle">
            Transmissões oficiais em tempo real • {lastUpdated ? `Atualizado às ${lastUpdated}` : 'Sincronizado'}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div className="live-badge">
          <span className="pulse-dot" aria-hidden="true" />
          <span>{liveCount} {liveCount === 1 ? 'partida ao vivo' : 'partidas ao vivo'}</span>
        </div>

        <button
          type="button"
          className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Atualizar lista de jogos"
          title="Buscar novas transmissões"
        >
          <svg className="refresh-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
    </header>
  );
}
