import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { usePartidas } from './hooks/usePartidas';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { FilterBar } from './components/FilterBar';
import { MatchCard } from './components/MatchCard';
import { TimelineView } from './components/TimelineView';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { MatchDetailModal } from './components/MatchDetailModal';
import { ClockIcon, SearchIcon, ExternalLinkIcon } from './components/Icons';
import { isFeaturedMatch, sortMatches } from './utils/matchHelpers';
import { COMMUNITY_LINKS, OFFICIAL_PARTNERS } from './constants/partners';

export function App() {
  const { partidas, loading, refreshing, errorNotice, lastUpdated, refresh } = usePartidas();

  const [statusFilter, setStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('cards');
  const [modalityFilter, setModalityFilter] = useState('todas');
  const [leagueFilter, setLeagueFilter] = useState('todas');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const [playingMatch, setPlayingMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const base = 'Radar da Bola - Partidas Reais Ao Vivo & Cronograma';
    if (leagueFilter !== 'todas') {
      document.title = `${leagueFilter} Ao Vivo | Radar da Bola`;
    } else if (categoryFilter !== 'todas') {
      document.title = `${categoryFilter} Ao Vivo | Radar da Bola`;
    } else if (modalityFilter !== 'todas') {
      document.title = `${modalityFilter} Ao Vivo | Radar da Bola`;
    } else {
      document.title = base;
    }
  }, [leagueFilter, categoryFilter, modalityFilter]);

  const stats = useMemo(() => {
    let aoVivo = 0;
    let campo = 0;
    let futsal = 0;
    const ligas = new Set();

    partidas.forEach((p) => {
      if (p.status === 'ao_vivo') aoVivo += 1;
      if (p.modalidade === 'Futsal' || p.categoria === 'Futsal') futsal += 1;
      else if (p.modalidade === 'Futebol de Campo' || !p.modalidade) campo += 1;
      if (p.liga) ligas.add(p.liga);
    });

    return { aoVivo, campo, futsal, ligas: ligas.size };
  }, [partidas]);

  const leagues = useMemo(
    () => [...new Set(partidas.map((p) => p.liga).filter(Boolean))].sort(),
    [partidas]
  );

  const hasOtherSports = useMemo(
    () => partidas.some((p) => p.modalidade === 'Outros Esportes'),
    [partidas]
  );

  const categories = useMemo(() => {
    const counts = new Map();
    partidas.forEach((p) => {
      const cat = p.categoria || 'Profissional';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [partidas]);

  const filteredMatches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return partidas.filter((p) => {
      if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
      if (modalityFilter !== 'todas') {
        const mod = p.modalidade || (p.categoria === 'Futsal' ? 'Futsal' : 'Futebol de Campo');
        if (mod !== modalityFilter) return false;
      }
      if (categoryFilter !== 'todas' && (p.categoria || 'Profissional') !== categoryFilter) {
        return false;
      }
      if (leagueFilter !== 'todas' && p.liga !== leagueFilter) return false;

      if (term) {
        const haystack = `${p.titulo || ''} ${p.liga || ''} ${p.canal || ''} ${p.categoria || ''} ${p.modalidade || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [partidas, statusFilter, modalityFilter, categoryFilter, leagueFilter, searchTerm]);

  const { liveMatches, featuredScheduled, otherScheduled } = useMemo(() => {
    const live = sortMatches(filteredMatches.filter((p) => p.status === 'ao_vivo'));
    const scheduled = filteredMatches.filter((p) => p.status !== 'ao_vivo');
    return {
      liveMatches: live,
      featuredScheduled: scheduled.filter((p) => isFeaturedMatch(p)),
      otherScheduled: scheduled.filter((p) => !isFeaturedMatch(p)),
    };
  }, [filteredMatches]);

  const hasActiveFilters =
    statusFilter !== 'todos' ||
    modalityFilter !== 'todas' ||
    leagueFilter !== 'todas' ||
    categoryFilter !== 'todas' ||
    searchTerm.trim() !== '';

  const clearFilters = useCallback(() => {
    setStatusFilter('todos');
    setModalityFilter('todas');
    setLeagueFilter('todas');
    setCategoryFilter('todas');
    setSearchTerm('');
  }, []);

  const toggleLive = useCallback(() => {
    setStatusFilter((prev) => (prev === 'ao_vivo' ? 'todos' : 'ao_vivo'));
  }, []);

  const toggleModality = useCallback((mod) => {
    setModalityFilter((prev) => (prev === mod ? 'todas' : mod));
  }, []);

  return (
    <div className="app-shell">
      <Header onRefresh={refresh} isRefreshing={refreshing} lastUpdated={lastUpdated} />

      <main className="container main-content">
        <MetricsBar
          stats={stats}
          statusFilter={statusFilter}
          modalityFilter={modalityFilter}
          onToggleLive={toggleLive}
          onToggleModality={toggleModality}
          onResetFilters={clearFilters}
        />

        {errorNotice && (
          <div className="glass notice-banner" role="status">
            <span>{errorNotice}</span>
            <button
              type="button"
              onClick={refresh}
              style={{
                background: 'none',
                border: 'none',
                color: '#fda4af',
                fontWeight: 700,
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <FilterBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          modalityFilter={modalityFilter}
          setModalityFilter={setModalityFilter}
          leagueFilter={leagueFilter}
          setLeagueFilter={setLeagueFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          leagues={leagues}
          categories={categories}
          hasOtherSports={hasOtherSports}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {loading ? (
          <div className="matches-grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="glass skeleton-card" />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="glass empty-box">
            <SearchIcon size={36} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              Nenhum jogo encontrado com esses filtros
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '26rem' }}>
              Ajuste os termos de busca ou limpe os filtros para visualizar todas as transmissões disponíveis.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-watch"
                style={{ flex: 'none', marginTop: '0.4rem' }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : viewMode === 'timeline' ? (
          <TimelineView matches={filteredMatches} onSelectMatch={setSelectedMatch} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {liveMatches.length > 0 ? (
              <section className="section-block">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <span className="pulse-dot rose" aria-hidden="true" />
                    <h2 className="section-title rose">Ao Vivo Agora</h2>
                    <span className="section-count rose">{liveMatches.length}</span>
                  </div>
                </div>
                <div className="matches-grid">
                  {liveMatches.map((m) => (
                    <MatchCard key={m.id_video} match={m} onPlay={setPlayingMatch} />
                  ))}
                </div>
              </section>
            ) : (
              statusFilter !== 'agendado' && (
                <div className="glass notice-banner">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        background: '#475569',
                      }}
                    />
                    Nenhuma transmissão ao vivo neste exato instante com os filtros atuais.
                  </span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>
                    Confira os jogos agendados abaixo ↓
                  </span>
                </div>
              )
            )}

            {featuredScheduled.length > 0 && (
              <section className="section-block">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <span style={{ fontSize: '1.1rem' }}>🔥</span>
                    <h2 className="section-title amber">Destaques Principais</h2>
                    <span className="section-count amber">{featuredScheduled.length}</span>
                  </div>
                  <span className="section-note">
                    Brasileirão A/B/C/D • Champions • Europa • Conference • Libertadores • Sul-Americana
                  </span>
                </div>
                <div className="matches-grid">
                  {featuredScheduled.map((m) => (
                    <MatchCard key={m.id_video} match={m} onPlay={setPlayingMatch} />
                  ))}
                </div>
              </section>
            )}

            {otherScheduled.length > 0 && (
              <section className="section-block">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <ClockIcon size={16} />
                    <h2 className="section-title emerald">Demais Jogos e Eventos Agendados</h2>
                    <span className="section-count emerald">{otherScheduled.length}</span>
                  </div>
                </div>
                <div className="matches-grid">
                  {otherScheduled.map((m) => (
                    <MatchCard key={m.id_video} match={m} onPlay={setPlayingMatch} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {(COMMUNITY_LINKS.telegramUrl || OFFICIAL_PARTNERS.length > 0) && (
        <footer className="container" style={{ paddingBottom: '2rem' }}>
          <div
            className="glass"
            style={{
              padding: '0.9rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            {COMMUNITY_LINKS.telegramUrl && (
              <a
                href={COMMUNITY_LINKS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-watch-alt"
                style={{ flex: 'none' }}
              >
                <ExternalLinkIcon size={13} />
                <span>{COMMUNITY_LINKS.telegramLabel}</span>
              </a>
            )}
            {OFFICIAL_PARTNERS.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {OFFICIAL_PARTNERS.map((p) => (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="btn-watch-alt"
                    style={{ flex: 'none' }}
                  >
                    <ExternalLinkIcon size={13} />
                    <span>{p.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}

      <MatchDetailModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onPlay={setPlayingMatch}
      />

      <VideoPlayerModal
        match={playingMatch}
        onClose={() => setPlayingMatch(null)}
      />
    </div>
  );
}
