import React from 'react';
import { RadioIcon, ShieldIcon, ZapIcon, GlobeIcon } from './Icons';

export function MetricsBar({
  stats,
  statusFilter,
  modalityFilter,
  onToggleLive,
  onToggleModality,
  onResetFilters,
}) {
  const cards = [
    {
      key: 'live',
      label: 'Ao Vivo Agora',
      value: stats.aoVivo,
      color: 'rose',
      icon: <RadioIcon size={18} />,
      active: statusFilter === 'ao_vivo',
      onClick: onToggleLive,
      pulse: true,
    },
    {
      key: 'campo',
      label: 'Futebol de Campo',
      value: stats.campo,
      color: 'emerald',
      icon: <ShieldIcon size={18} />,
      active: modalityFilter === 'Futebol de Campo',
      onClick: () => onToggleModality('Futebol de Campo'),
    },
    {
      key: 'futsal',
      label: 'Futsal',
      value: stats.futsal,
      color: 'amber',
      icon: <ZapIcon size={18} />,
      active: modalityFilter === 'Futsal',
      onClick: () => onToggleModality('Futsal'),
    },
    {
      key: 'ligas',
      label: 'Ligas / Torneios',
      value: stats.ligas,
      color: 'blue',
      icon: <GlobeIcon size={18} />,
      active: false,
      onClick: onResetFilters,
    },
  ];

  return (
    <section className="metrics-grid" aria-label="Resumo de transmissões">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onClick}
          className={`glass metric-card ${c.color} ${c.active ? 'active' : ''}`}
        >
          <div>
            <p className={`metric-label ${c.color}`}>
              {c.pulse && <span className="pulse-dot rose" aria-hidden="true" />}
              <span>{c.label}</span>
            </p>
            <div className="metric-value">{c.value}</div>
          </div>
          <div className={`metric-icon ${c.color}`}>{c.icon}</div>
        </button>
      ))}
    </section>
  );
}
