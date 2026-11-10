# ⚽ Futebol Ao Vivo - SPA de Alta Performance

Aplicação SPA minimalista desenvolvida em **React 18 + Vite**, projetada com foco em **performance extrema**, **Core Web Vitals perfeitos** e **custo zero permanente** de hospedagem na [Vercel](https://vercel.com).

---

## ⚡ Destaques de Performance & Engenharia

- **Peso-Pena (~52 KB gzip total)**: Sem bibliotecas de UI pesadas (Tailwind/Material-UI/Chakra dispensadas). Estilização 100% em **CSS puro moderno** com Custom Properties (Variáveis CSS) e Dark Theme esportivo nativo.
- **Lazy Loading Real de Embeds**:
  - `permite_embed: true`: Iframe carregado com `loading="lazy"`, domínio seguro `youtube-nocookie.com` e container com `aspect-ratio: 16 / 9` para eliminar **CLS (Cumulative Layout Shift)**.
  - `permite_embed: false`: Botão de alto impacto e conversão **"Abrir no YouTube"**, economizando 100% de CPU/RAM em jogos sem permissão de embed.
- **Resource Hints**: `preconnect` e `dns-prefetch` para os domínios do YouTube diretamente no `index.html`.
- **Zero Processamento em Servidor**: Renderização 100% client-side (SPA), estática, servida direto das CDNs globais da Vercel.

---

## 📁 Estrutura de Componentes

```text
├── public/
│   ├── favicon.svg          # Favicon vetorial leve
│   └── partidas.json        # Mock local de demonstração e fallback
├── src/
│   ├── components/
│   │   ├── Header.jsx           # Topbar com indicador ao vivo e botão de atualização
│   │   ├── CategorySection.jsx  # Agrupamento e cabeçalho por Categoria
│   │   ├── MatchCard.jsx        # Card da partida (dados, status pulsante, canal)
│   │   ├── VideoPlayer.jsx      # Iframe lazy load ou botão "Abrir no YouTube"
│   │   └── MatchSkeleton.jsx    # Skeletons CSS sem layout shift durante fetch
│   ├── constants/
│   │   └── config.js            # URL do partidas.json e intervalos de polling
│   ├── hooks/
│   │   └── usePartidas.js       # Hook customizado de fetch com fallback resiliente
│   ├── styles/
│   │   └── index.css            # CSS puro modular e responsivo (Mobile-first)
│   ├── App.jsx                  # Orquestrador, busca em tempo real e categorias
│   └── main.jsx                 # Entrypoint React
├── vercel.json              # Configurações de cache e rotas SPA na Vercel
├── vite.config.js           # Build ultra-otimizado com manualChunks
└── package.json
```

---

## 📄 Contrato de Dados (`partidas.json`)

O app aceita tanto um arquivo hospedado em um bucket S3, Cloudflare R2, GitHub Raw ou Gist público. Exemplo de item:

```json
[
  {
    "id": "match-01",
    "titulo": "Flamengo x Fluminense",
    "detalhes": "Clássico Fla-Flu - Rodada 30",
    "campeonato": "Brasileirão Série A",
    "categoria": "Brasileirão Série A",
    "horario": "16:00",
    "status": "AO VIVO",
    "placar": "2 x 1",
    "canal": "CazéTV",
    "youtube_id": "jfKfPfyJRdk",
    "url": "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    "permite_embed": true
  },
  {
    "id": "match-02",
    "titulo": "Palmeiras x São Paulo",
    "detalhes": "Choque-Rei Decisivo",
    "campeonato": "Brasileirão Série A",
    "categoria": "Brasileirão Série A",
    "horario": "16:00",
    "status": "AO VIVO",
    "placar": "0 x 0",
    "canal": "Premiere / Globo Esporte",
    "youtube_id": "M7lc1UVf-VE",
    "url": "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    "permite_embed": false
  }
]
```

---

## 🚀 Como Executar

### 1. Rodar localmente
```bash
npm install
npm run dev
```

### 2. Gerar build de produção
```bash
npm run build
npm run preview
```

### 3. Deploy na Vercel
1. Suba este repositório no GitHub.
2. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório.
3. A Vercel detectará o framework **Vite** automaticamente.
4. Adicione a variável de ambiente (opcional):
   - `VITE_PARTIDAS_URL`: Link da sua URL pública externa do `partidas.json`.
5. Clique em **Deploy**. Zero custo e deploy contínuo em cada `git push`.
