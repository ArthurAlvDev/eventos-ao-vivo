import React, { useEffect } from 'react';
import { XIcon, TvIcon, ExternalLinkIcon } from './Icons';
import { getYouTubeId } from '../utils/matchHelpers';

export function VideoPlayerModal({ match, onClose }) {
  useEffect(() => {
    if (!match) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [match, onClose]);

  if (!match) return null;

  const videoId = getYouTubeId(match.id_video || match.link_direto);
  const watchUrl = match.link_direto || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Player: ${match.titulo}`}
      onClick={onClose}
    >
      <div className="modal-player-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-player-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
            <span className="pulse-dot" aria-hidden="true" />
            <h4
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {match.titulo}
            </h4>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar player"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="video-aspect">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={match.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="modal-player-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <TvIcon size={15} />
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{match.canal}</span>
            <span>•</span>
            <span>{match.liga || 'Torneio'}</span>
          </div>

          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-yt-cta"
          >
            <ExternalLinkIcon size={14} />
            <span>Abrir no YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
}
