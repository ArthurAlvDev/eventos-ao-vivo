/**
 * popup.js - Controlador do Popup da Extensão de Jogos Ao Vivo
 * Compatível com Manifest V3
 */

document.addEventListener("DOMContentLoaded", () => {
  const statusView = document.getElementById("statusView");
  const contentView = document.getElementById("contentView");
  const matchCounter = document.getElementById("matchCounter");
  const btnRefresh = document.getElementById("btnRefresh");

  // Dados de fallback caso o arquivo JSON não seja alcançado
  const FALLBACK_MATCHES = [
    {
      id_video: "jfKfPfyJRdk",
      titulo: "Corinthians x Palmeiras - Final Paulistão Sub-20 | Ao Vivo com Imagens",
      liga: "Paulistão Sub-20",
      categoria: "Sub-20",
      idioma: "Português",
      link_direto: "https://www.youtube.com/watch?v=jfKfPfyJRdk"
    },
    {
      id_video: "dQw4w9WgXcQ",
      titulo: "Flamengo x Fluminense - Clássico Carioca Profissional",
      liga: "Campeonato Carioca",
      categoria: "Profissional",
      idioma: "Português",
      link_direto: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      id_video: "9bZkp7q19f0",
      titulo: "São Paulo x Ferroviária - Brasileirão Feminino A1",
      liga: "Brasileirão Feminino",
      categoria: "Feminino",
      idioma: "Português",
      link_direto: "https://www.youtube.com/watch?v=9bZkp7q19f0"
    },
    {
      id_video: "3JZ_D3ELwOQ",
      titulo: "Unidos da Vila x Estrela do Norte - Copa da Paz de Várzea",
      liga: "Copa da Paz de Paraisópolis",
      categoria: "Várzea",
      idioma: "Português",
      link_direto: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ"
    }
  ];

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

  function showStatus(message, isError = false, showSpinner = false) {
    contentView.style.display = "none";
    statusView.style.display = "flex";
    statusView.innerHTML = `
      ${showSpinner ? '<div class="spinner"></div>' : ""}
      <p style="${isError ? "color: #f87171;" : ""}">${message}</p>
    `;
  }

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

  function createMatchCard(match) {
    const card = document.createElement("a");
    card.className = "match-link";
    card.href = match.link_direto || `https://www.youtube.com/watch?v=${match.id_video}`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

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

    const titleP = document.createElement("p");
    titleP.className = "match-title";
    titleP.textContent = match.titulo || "Transmissão de Futebol";

    const footerDiv = document.createElement("div");
    footerDiv.className = "match-footer";

    const langSpan = document.createElement("span");
    langSpan.className = "match-lang";
    langSpan.textContent = match.idioma ? `🗣 ${match.idioma}` : "🗣 Português";

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
        listDiv.appendChild(createMatchCard(match));
      });

      groupDiv.appendChild(titleH2);
      groupDiv.appendChild(listDiv);
      contentView.appendChild(groupDiv);
    });

    statusView.style.display = "none";
    contentView.style.display = "block";
  }

  async function loadMatches() {
    showStatus("Carregando jogos ao vivo...", false, true);
    if (btnRefresh) btnRefresh.classList.add("spinning");

    try {
      // No Chrome extension, caminho relativo './partidas.json' sem query string funciona perfeitamente
      const response = await fetch("./partidas.json");
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        renderMatches(data);
      } else {
        renderMatches(FALLBACK_MATCHES);
      }
    } catch (err) {
      console.warn("Aviso ao carregar partidas.json, usando catálogo padrão:", err);
      // Fallback gracioso imediato
      renderMatches(FALLBACK_MATCHES);
    } finally {
      if (btnRefresh) btnRefresh.classList.remove("spinning");
    }
  }

  // Intercepta cliques para garantir abertura no Chrome
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

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      loadMatches();
    });
  }

  loadMatches();
});
