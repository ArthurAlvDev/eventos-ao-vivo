import React, { useEffect } from 'react';
import { XIcon } from './Icons';
import { MatchCard } from './MatchCard';

export function MatchDetailModal({ match, onClose, onPlay }) {
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

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={match.titulo}
      onClick={onClose}
    >
      <div
        style={{ position: 'relative', width: '100%', maxWidth: '28rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="modal-close"
          style={{
            position: 'absolute',
            top: '-0.75rem',
            right: '-0.75rem',
            zIndex: 10,
            borderRadius: '999px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          }}
        >
          <XIcon size={15} />
        </button>
        <MatchCard
          match={match}
          onPlay={(m) => {
            onClose();
            onPlay(m);
          }}
        />
      </div>
    </div>
  );
}
