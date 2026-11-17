import React from 'react';
import {
  CalendarIcon,
  GridIcon,
  SearchIcon,
  XIcon,
  ChevronDownIcon,
  FilterIcon,
} from './Icons';

export function FilterBar({
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  modalityFilter,
  setModalityFilter,
  leagueFilter,
  setLeagueFilter,
  categoryFilter,
  setCategoryFilter,
  searchTerm,
  setSearchTerm,
  leagues,
  categories,
  hasOtherSports,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <section className="glass filter-panel" aria-label="Filtros e busca">
      <div className="filter-row-top">
        <div className="filter-groups">
          {/* Status */}
          <div className="segmented" role="group" aria-label="Status da partida">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`seg-btn ${statusFilter === 'todos' ? 'active' : ''}`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ao_vivo')}
              className={`seg-btn ${statusFilter === 'ao_vivo' ? 'active' : ''}`}
            >
              <span className="pulse-dot rose" aria-hidden="true" />
              <span>Ao Vivo</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('agendado')}
              className={`seg-btn ${statusFilter === 'agendado' ? 'active' : ''}`}
            >
              <CalendarIcon size={13} />
              <span>Agendadas</span>
            </button>
          </div>

          {/* View Mode */}
          <div className="segmented" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`seg-btn ${viewMode === 'cards' ? 'active' : ''}`}
            >
              <GridIcon size={13} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`seg-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            >
              <CalendarIcon size={13} />
              <span>Linha do Tempo</span>
            </button>
          </div>

          {/* Modality */}
          <div className="segmented" role="group" aria-label="Modalidade">
            <button
              type="button"
              onClick={() => setModalityFilter('todas')}
              className={`seg-btn ${modalityFilter === 'todas' ? 'active-slate' : ''}`}
            >
              Todos Esportes
            </button>
            <button
              type="button"
              onClick={() => setModalityFilter('Futebol de Campo')}
              className={`seg-btn ${modalityFilter === 'Futebol de Campo' ? 'active' : ''}`}
            >
              ⚽ Campo
            </button>
            <button
              type="button"
              onClick={() => setModalityFilter('Futsal')}
              className={`seg-btn ${modalityFilter === 'Futsal' ? 'active' : ''}`}
            >
              ⚡ Futsal
            </button>
            {hasOtherSports && (
              <button
                type="button"
                onClick={() => setModalityFilter('Outros Esportes')}
                className={`seg-btn ${modalityFilter === 'Outros Esportes' ? 'active' : ''}`}
              >
                🏅 Outros
              </button>
            )}
          </div>
        </div>

        {/* League & Search */}
        <div className="filter-inputs">
          <div className="select-wrap">
            <select
              aria-label="Filtrar por torneio"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="league-select"
            >
              <option value="todas">🌍 Todos os Torneios</option>
              {leagues.map((liga) => (
                <option key={liga} value={liga}>
                  {liga}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={14} className="select-chevron" />
          </div>

          <div className="search-wrap">
            <SearchIcon size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar time, liga ou canal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar time, liga ou canal"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Limpar busca"
              >
                <XIcon size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Categories */}
      {categories.length > 0 && (
        <div className="filter-row-cats">
          <span className="cats-label">
            <FilterIcon size={11} />
            Categoria:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('todas')}
            className={`cat-chip ${categoryFilter === 'todas' ? 'active' : ''}`}
          >
            Todas
          </button>
          {categories.map(({ name, count }) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategoryFilter(name)}
              className={`cat-chip ${categoryFilter === name ? 'active' : ''}`}
            >
              <span>{name}</span>
              <span className="cat-count">{count}</span>
            </button>
          ))}

          {hasActiveFilters && (
            <button type="button" onClick={onClearFilters} className="btn-clear-filters">
              <XIcon size={12} />
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </section>
  );
}
