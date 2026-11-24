// src/constants/config.js

// URL remota do arquivo partidas.json (GitHub Raw ou CDN jsDelivr)
// Pode ser customizada via variável de ambiente EXPO_PUBLIC_PARTIDAS_URL
export const PARTIDAS_JSON_URL =
  process.env.EXPO_PUBLIC_PARTIDAS_URL ||
  'https://raw.githubusercontent.com/SEU_USUARIO/Eventos-Ao-Vivo/main/partidas.json';

// Paleta Dark Mode AMOLED Minimalista de Alto Contraste
export const THEME = {
  background: '#0B0E14',
  surface: '#151C28',
  surfaceBorder: '#222E42',
  accentGreen: '#00E676',
  accentRed: '#FF3B30',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  badgeBg: '#1E293B',
  youtubeRed: '#FF0000',
};

// Categorias padrão de futebol
export const DEFAULT_CATEGORIES = [
  'Todos',
  'Profissional',
  'Sub-20',
  'Sub-17',
  'Feminino',
  'Ligas Menores',
  'Várzea/Amador'
];
