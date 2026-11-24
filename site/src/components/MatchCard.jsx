import React, { memo, useState } from 'react';
import {
  PlayIcon,
  ClockIcon,
  TvIcon,
  YoutubeIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
} from './Icons';
import {
  FALLBACK_THUMBNAIL,
  getCategoryBadgeClass,
  isFeaturedMatch,
} from '../utils/matchHelpers';

export const MatchCard = memo(function MatchCard({ match, onPlay }) {
  const [imgSrc, setImgSrc] = useState(match.thumbnail || FALLBACK_THUMBNAIL);

  const isLive = match.status === 'ao_vivo';
  const isFeatured = isFeaturedMatch(match);
  const badgeClass = getCategoryBadgeClass(match.categoria);
  const isFutsal = match.modalidade === 'Futsal';
  const watchUrl = match.link_direto || `https://www.youtube.com/watch?v=${match.id_video}`;

  return (
    <article className={`glass match-card ${isFeatured ? 'featured' : ''}`}>
      <div className="card-thumb-wrap">
        <img
          src={imgSrc}
          alt={match.titulo}
          loading="lazy"
          className="card-thumb"
          onError={() => {
            if (imgSrc !== FALLBACK_THUMBNAIL) setImgSrc(FALLBACK_THUMBNAIL);
          }}
        />
        <div className="card-thumb-gradient" />

        <div className="card-overlay-top">
          <div className="badge-group">
            <span className={`badge ${badgeClass}`} style={{ border: '1px solid' }}>
              {isFutsal ? '⚡ Futsal' : match.categoria || 'Profissional'}
            </span>
            {match.pontuacao ? (
              <span className="badge badge-pts" title="Pontuação do Crivo Oficial">
                {match.pontuacao} pts
              </span>
            ) : null}
          </div>

          {isLive ? (
            <span className="badge badge-live">
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '999px',
                  background: '#fff',
                }}
              />
              AO VIVO
            </span>
          ) : (
            <span className="badge badge-time">
              <ClockIcon size={11} />
              <span>{match.horario || 'Em breve'}</span>
            </span>
          )}
        </div>

        <div className="card-overlay-bottom">
          <span className="league-pill" title={match.liga}>
            🏆 {match.liga || 'Torneio Local'}
          </span>
          <span className="lang-tag">{match.idioma || 'PT'}</span>
        </div>
      </div>

      <div className="card-body">
        <div>
          <div className="card-tags">
            {isFeatured && <span className="badge tag-featured">🔥 DESTAQUE</span>}
            {match.flag_canal === 'VIP' && <span className="badge tag-vip">⭐ VIP</span>}
            <span className="badge tag-verified">
              <ShieldCheckIcon size={11} />
              <span>{match.fonte_confirmacao || 'Confirmado'}</span>
            </span>
          </div>

          <h3 className="card-title" title={match.titulo}>
            {match.titulo}
          </h3>

          <p className="card-channel">
            <TvIcon size={13} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.canal || 'Canal Oficial'}
            </span>
          </p>
        </div>

        <div className="card-actions">
          {match.permite_embed !== false ? (
            <button
              type="button"
              onClick={() => onPlay(match)}
              className="btn-watch"
            >
              <PlayIcon size={13} fill="currentColor" />
              <span>Assistir Aqui</span>
            </button>
          ) : (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-watch-alt"
            >
              <ExternalLinkIcon size={13} />
              <span>No YouTube</span>
            </a>
          )}

          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir no YouTube"
            aria-label={`Abrir ${match.titulo} no YouTube`}
            className="btn-yt-icon"
          >
            <YoutubeIcon size={16} />
          </a>
        </div>
      </div>
    </article>
  );
});
