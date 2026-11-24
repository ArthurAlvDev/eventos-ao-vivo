import React, { memo } from 'react';

/**
 * Utilitário para extrair com segurança o ID do vídeo do YouTube
 */
function getYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/|.*[?&]v=))([\w-]{11})/);
  return match ? match[1] : urlOrId;
}

/**
 * Componente VideoPlayer com foco em performance:
 * - Se permite_embed === true: Iframe nativo com loading="lazy" no domínio youtube-nocookie.
 * - Se permite_embed === false: Botão de alto destaque "Abrir no YouTube" (zero JavaScript bloat).
 */
export const VideoPlayer = memo(function VideoPlayer({ match }) {
  const { permite_embed, id_video, youtube_id, link_direto, url, titulo } = match;

  const rawId = id_video || youtube_id;
  const rawUrl = link_direto || url;
  const videoId = getYouTubeId(rawId || rawUrl);
  const targetUrl = rawUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#');

  // Caso 1: Embed permitido - Iframe direto otimizado com lazy loading
  if (permite_embed && videoId) {
    return (
      <div className="video-wrapper">
        <iframe
          className="yt-iframe"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`}
          title={`Transmissão: ${titulo}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Caso 2: Embed falso/desativado - Botão grande direto
  return (
    <div className="video-wrapper">
      <div className="no-embed-fallback">
        <p className="no-embed-notice">
          Transmissão disponível diretamente no aplicativo do YouTube
        </p>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-open-youtube"
          aria-label={`Abrir ${titulo} diretamente no YouTube`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Abrir no YouTube
        </a>
      </div>
    </div>
  );
});
