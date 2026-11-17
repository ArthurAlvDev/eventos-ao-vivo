import React, { useMemo } from 'react';
import {
  RadioIcon,
  CalendarIcon,
  TvIcon,
  ChevronRightIcon,
} from './Icons';
import { getCategoryBadgeClass, getDateGroup } from '../utils/matchHelpers';

export function TimelineView({ matches, onSelectMatch }) {
  const groups = useMemo(() => {
    const map = new Map();
    matches.forEach((m) => {
      const info = getDateGroup(m);
      if (!map.has(info.key)) {
        map.set(info.key, { ...info, items: [] });
      }
      map.get(info.key).items.push(m);
    });
    return Array.from(map.values());
  }, [matches]);

  return (
    <div className="timeline-list">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="timeline-group-header">
            <div className={`timeline-node ${group.isLive ? 'live' : ''}`}>
              {group.isLive ? <RadioIcon size={14} /> : <CalendarIcon size={14} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: group.isLive ? '#fb7185' : '#ffffff',
                }}
              >
                {group.isLive ? '🔴 ' : ''}
                {group.label}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {group.sub}
              </span>
              <span
                className="badge"
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {group.items.length} evento(s)
              </span>
            </div>
          </div>

          <div className="timeline-items">
            {group.items.map((m) => {
              const hora =
                m.status === 'ao_vivo'
                  ? 'AO VIVO'
                  : m.timestamp_inicio
                  ? new Date(m.timestamp_inicio * 1000).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : m.horario || 'Em breve';

              return (
                <button
                  key={m.id_video}
                  type="button"
                  onClick={() => onSelectMatch(m)}
                  className="glass timeline-row"
                >
                  <div className="timeline-row-left">
                    <span className={`timeline-time ${m.status === 'ao_vivo' ? 'live' : ''}`}>
                      {hora}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.titulo}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '0.45rem',
                          marginTop: '0.2rem',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          <TvIcon size={12} />
                          {m.canal}
                        </span>
                        <span>•</span>
                        <span>🏆 {m.liga || 'Torneio'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {m.flag_canal === 'VIP' && <span className="badge tag-vip">⭐ VIP</span>}
                    <span
                      className={`badge ${getCategoryBadgeClass(m.categoria)}`}
                      style={{ border: '1px solid' }}
                    >
                      {m.categoria || 'Profissional'}
                    </span>
                    <ChevronRightIcon size={16} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
