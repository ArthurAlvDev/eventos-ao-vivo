import React, { useState, useMemo } from 'react';
import { usePartidas } from './hooks/usePartidas';
import { Header } from './components/Header';
import { CategorySection } from './components/CategorySection';
import { MatchSkeletonList } from './components/MatchSkeleton';

export function App() {
  const { partidas, loading, refreshing, errorNotice, lastUpdated, refresh } = usePartidas();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de partidas ultra-rápido em memória
  const filteredMatches = useMemo(() => {
    if (!searchTerm.trim()) return partidas;
    const term = searchTerm.toLowerCase();

    return partidas.filter((match) => {
      const matchText = `${match.titulo} ${match.campeonato || ''} ${match.canal || ''} ${match.categoria || ''}`.toLowerCase();
      return matchText.includes(term);
    });
  }, [partidas, searchTerm]);

  // Agrupamento por Categoria com ordenação estável
  const categoriesGroup = useMemo(() => {
    const groups = {};

    filteredMatches.forEach((match) => {
      const cat = match.categoria || 'Outras Transmissões';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(match);
    });

    return groups;
  }, [filteredMatches]);

  const categoryKeys = Object.keys(categoriesGroup);

  return (
    <div className="app-container">
      {/* Topbar com contador de ao vivo e botão refresh */}
      <Header
        liveCount={partidas.length}
        onRefresh={refresh}
        isRefreshing={refreshing}
        lastUpdated={lastUpdated}
      />

      {/* Aviso de fallback ou erro temporário */}
      {errorNotice && (
        <div className="error-banner" role="status">
          <span>{errorNotice}</span>
          <button
            type="button"
            onClick={refresh}
            style={{ background: 'none', border: 'none', color: '#fca5a5', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Barra de Busca em tempo real */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Filtrar por time, campeonato ou canal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Filtrar partidas de futebol"
          />
        </div>
      </div>

      {/* Estado 1: Loading Inicial */}
      {loading ? (
        <MatchSkeletonList count={6} />
      ) : categoryKeys.length > 0 ? (
        /* Estado 2: Lista agrupada por categoria */
        <main>
          {categoryKeys.map((cat) => (
            <CategorySection
              key={cat}
              categoria={cat}
              matches={categoriesGroup[cat]}
            />
          ))}
        </main>
      ) : (
        /* Estado 3: Lista Vazia */
        <div className="empty-state">
          <h2 className="empty-title">Nenhuma partida encontrada</h2>
          <p className="empty-text">
            {searchTerm
              ? `Não foram encontrados jogos para o termo "${searchTerm}". Verifique o filtro.`
              : 'Não há transmissões cadastradas no momento. Clique em Atualizar para sincronizar.'}
          </p>
        </div>
      )}

      <footer className="footer">
        <p>Transmissões de futebol ao vivo • SPA otimizada para alta performance e zero custo de servidor.</p>
      </footer>
    </div>
  );
}

export default App;
