/**
 * Configurações globais da aplicação.
 * Zero custo, zero servidor: dados obtidos diretamente via CDN/S3/GitHub Raw/Gist.
 */

// Substitua pela URL final do seu CDN, GitHub Raw, S3 ou Cloudflare R2:
export const DEFAULT_PARTIDAS_URL = 
  import.meta.env.VITE_PARTIDAS_URL || 
  'https://raw.githubusercontent.com/usuario/eventos-ao-vivo/main/partidas.json';

// Fallback local caso o endpoint externo não esteja configurado ou sofra bloqueio de CORS
export const LOCAL_FALLBACK_URL = '/partidas.json';

// Intervalo de checagem automática (em ms) - Opcional (ex: 60 segundos)
export const AUTO_REFRESH_INTERVAL = 60000;
