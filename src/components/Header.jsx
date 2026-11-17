import React, { useState, useEffect } from 'react';
import { PlayIcon, ClockIcon, RefreshIcon } from './Icons';

export function Header({ onRefresh, isRefreshing, lastUpdated }) {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="site-header glass">
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-logo" aria-hidden="true">
            <PlayIcon size={20} fill="currentColor" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 className="brand-title">Radar da Bola</h1>
            <p className="brand-sub">
              <span className="pulse-dot" aria-hidden="true" />
              <span>
                Partidas Reais com Imagens • Crivo Oficial
                {lastUpdated ? ` • Atualizado ${lastUpdated}` : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="clock-pill" title="Horário local">
            <ClockIcon size={14} />
            <span>{clock}</span>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar lista de partidas"
          >
            <RefreshIcon size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
