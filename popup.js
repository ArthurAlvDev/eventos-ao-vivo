/**
 * popup.js - Controlador do Popup da Extensão de Jogos Ao Vivo
 * Compatível com Manifest V3
 */

document.addEventListener("DOMContentLoaded", () => {
  const statusView = document.getElementById("statusView");
  const contentView = document.getElementById("contentView");
  const matchCounter = document.getElementById("matchCounter");
  const btnRefresh = document.getElementById("btnRefresh");

  // Ordem de exibição preferencial das categorias
  const CATEGORY_PRIORITY = [
    "Profissional",
    "Sub-20",
    "Sub-17",
    "Sub-15",
    "Feminino",
    "Ligas Menores",
    "Várzea",
    "Outros"
  ];

  /**
   * Obtém o caminho do arquivo partidas.json.
   * Suporta tanto o contexto da extensão do Chrome quanto ambientes de teste local.
   */
  function getDataUrl() {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL("partidas.json");
    }
    return "partidas.json";
  }

  /**
   * Exibe mensagens de feedback e status (carregamento, vazio ou erro).
   */
  function showStatus(message, isError = false, showSpinner = false) {
    contentView.style.display = "none";
    statusView.style.display = "flex";
    statusView.innerHTML = `
      ${showSpinner ? '<div class="spinner"></div>' : ""}
      <p style="${isError ? "color: #f87171;" : ""}">${message}</p>
    `;
  }

  /**
   * Agrupa as partidas por categoria.
   */
  function groupByCategory(matches) {
    const groups = {};

    matches.forEach((match) => {
      const cat = (match.categoria || "Outros").trim();
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(match);
    });

    return groups;
  }

  /**
   * Constrói o elemento <a> para uma partida individual.
   */
  function createMatchCard(match) {
    const card = document.createElement("a");
    card.className = "match-link";
    card.href = match.link_direto || `https://www.youtube.com/watch?v=${match.id_video}`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    // Header do card (Liga e Badge Ao Vivo)
    const metaDiv = document.createElement("div");
    metaDiv.className = "match-meta";

    const leagueSpan = document.createElement("span");
    leagueSpan.className = "badge-league";
    leagueSpan.textContent = match.liga || "Partida";

    const liveBadge = document.createElement("span");
    liveBadge.className = "badge-live";
    liveBadge.textContent = "● AO VIVO";

    metaDiv.appendChild(leagueSpan);
    metaDiv.appendChild(liveBadge);

    // Título do jogo
    const titleP = document.createElement("p");
    titleP.className = "match-title";
    titleP.textContent = match.titulo || "Transmissão de Futebol";

    // Rodapé do card (Idioma e CTA Assistir)
    const footerDiv = document.createElement("div");
    footerDiv.className = "match-footer";

    const langSpan = document.createElement("span");
    langSpan.className = "match-lang";
    langSpan.textContent = match.idioma ? `🗣 ${match.idioma}` : "";

    const ctaSpan = document.createElement("span");
    ctaSpan.className = "watch-cta";
    ctaSpan.innerHTML = `
      <span>Assistir</span>
      <svg viewBox="0 0 24 24">
        <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z"/>
      </svg>
    `;

    footerDiv.appendChild(langSpan);
    footerDiv.appendChild(ctaSpan);

    card.appendChild(metaDiv);
    card.appendChild(titleP);
    card.appendChild(footerDiv);

    return card;
  }

  /**
   * Renderiza a lista categorizada na interface.
   */
  function renderMatches(matches) {
    if (!Array.isArray(matches) || matches.length === 0) {
      matchCounter.style.display = "none";
      showStatus("Nenhuma transmissão ao vivo encontrada no momento.");
      return;
    }

    matchCounter.textContent = `${matches.length} jogo${matches.length > 1 ? "s" : ""}`;
    matchCounter.style.display = "inline-block";

    const grouped = groupByCategory(matches);
    contentView.innerHTML = "";

    // Ordenar categorias colocando as mais comuns primeiro
    const categories = Object.keys(grouped).sort((a, b) => {
      const idxA = CATEGORY_PRIORITY.indexOf(a);
      const idxB = CATEGORY_PRIORITY.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    categories.forEach((category) => {
      const groupDiv = document.createElement("section");
      groupDiv.className = "category-group";

      const titleH2 = document.createElement("h2");
      titleH2.className = "category-title";
      titleH2.textContent = category;

      const listDiv = document.createElement("div");
      listDiv.className = "match-list";

      grouped[category].forEach((match) => {
        const matchCard = createMatchCard(match);
        listDiv.appendChild(matchCard);
      });

      groupDiv.appendChild(titleH2);
      groupDiv.appendChild(listDiv);
      contentView.appendChild(groupDiv);
    });

    statusView.style.display = "none";
    contentView.style.display = "block";
  }

  /**
   * Busca os dados de partidas.json.
   */
  async function loadMatches() {
    showStatus("Carregando jogos ao vivo...", false, true);
    btnRefresh.classList.add("spinning");

    try {
      const url = `${getDataUrl()}?_t=${Date.now()}`;
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: não foi possível carregar partidas.json`);
      }

      const data = await response.json();
      renderMatches(data);
    } catch (err) {
      console.error("Falha ao carregar partidas:", err);
      showStatus(
        "Não foi possível carregar as partidas ao vivo.<br><small>Verifique se o arquivo partidas.json está gerado.</small>",
        true
      );
    } finally {
      btnRefresh.classList.remove("spinning");
    }
  }

  /**
   * Abre links em uma nova aba usando chrome.tabs se disponível,
   * garantindo compatibilidade total no popup do Chrome Manifest V3.
   */
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a.match-link");
    if (link && link.href) {
      e.preventDefault();
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: link.href });
      } else {
        window.open(link.href, "_blank", "noopener,noreferrer");
      }
    }
  });

  // Ação do botão atualizar
  btnRefresh.addEventListener("click", () => {
    loadMatches();
  });

  // Inicialização
  loadMatches();
});
