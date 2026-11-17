const FEATURED_REGEX = /\b(brasileir[aã]o|s[eé]rie\s*[abcd]|copa\s*do\s*brasil|champions\s*league|europa\s*league|conference\s*league|libertadores|sul-?americana|sudamericana)\b/i;

export const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60';

export function isFeaturedMatch(match) {
  return FEATURED_REGEX.test(`${match.titulo || ''} ${match.liga || ''}`);
}

export function sortMatches(list) {
  return [...list].sort((a, b) => {
    const featA = isFeaturedMatch(a) ? 0 : 1;
    const featB = isFeaturedMatch(b) ? 0 : 1;
    if (featA !== featB) return featA - featB;
    return (a.timestamp_inicio || 9999999999) - (b.timestamp_inicio || 9999999999);
  });
}

export function getCategoryBadgeClass(categoria) {
  switch (categoria) {
    case 'Futsal':
      return 'cat-badge-futsal';
    case 'Feminino':
      return 'cat-badge-feminino';
    case 'Sub-20':
      return 'cat-badge-sub20';
    case 'Sub-17':
      return 'cat-badge-sub17';
    case 'Sub-15':
      return 'cat-badge-sub15';
    case 'Esportes Olímpicos':
      return 'cat-badge-olimpico';
    case 'NBA':
    case 'Basquete':
      return 'cat-badge-nba';
    case 'NFL':
      return 'cat-badge-nfl';
    case 'Vôlei':
      return 'cat-badge-volei';
    default:
      return 'cat-badge-default';
  }
}

export function getYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const match = urlOrId.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/|.*[?&]v=))([\w-]{11})/
  );
  return match ? match[1] : urlOrId;
}

export function getDateGroup(match) {
  if (match.status === 'ao_vivo') {
    return { key: 'AO_VIVO', label: 'Ao Vivo Agora', sub: 'Transmissões em andamento', isLive: true };
  }
  if (!match.timestamp_inicio) {
    return { key: 'SEM_DATA', label: 'A Confirmar', sub: 'Horário pendente', isLive: false };
  }
  const d = new Date(match.timestamp_inicio * 1000);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const weekday = weekdays[d.getDay()];

  let label = `${dd}/${mm}`;
  if (d.toDateString() === today.toDateString()) label = `${dd}/${mm} • Hoje`;
  else if (d.toDateString() === tomorrow.toDateString()) label = `${dd}/${mm} • Amanhã`;

  return {
    key: `${d.getFullYear()}-${mm}-${dd}`,
    label,
    sub: weekday,
    isLive: false,
  };
}
