/**
 * Configurações globais da aplicação.
 * Zero custo, zero servidor: dados obtidos diretamente via CDN/S3/GitHub Raw/Gist ou localmente.
 */

// URL padrão para obtenção dos dados de partidas:
export const DEFAULT_PARTIDAS_URL = 
  import.meta.env.VITE_PARTIDAS_URL || 
  '/partidas.json';

// Fallback local caso o endpoint externo sofra bloqueio ou timeout
export const LOCAL_FALLBACK_URL = '/partidas.json';

// Intervalo de checagem automática (em ms)
export const AUTO_REFRESH_INTERVAL = 60000;
