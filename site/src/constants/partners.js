/**
 * Estrutura opcional para links futuros (canal do Telegram ou parceiros/afiliados esportivos oficiais).
 * Deixe vazio ('') enquanto não houver links configurados. Nenhum anúncio ou cobrança é exibido.
 */
export const COMMUNITY_LINKS = {
  telegramUrl: import.meta.env.VITE_TELEGRAM_URL || '',
  telegramLabel: 'Entrar no Canal do Telegram',
};

export const OFFICIAL_PARTNERS = [
  // Exemplo de uso futuro:
  // { id: 'cazetv', label: 'Apoie / Streaming Oficial', url: 'https://...', note: 'Parceiro oficial' },
];
