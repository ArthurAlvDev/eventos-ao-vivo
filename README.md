# ⚽ Buscador de Futebol Ao Vivo - Infraestrutura CI/CD

Pipeline DevOps 100% automatizado no GitHub Actions para catalogar transmissões de futebol ao vivo e atualizar o arquivo `partidas.json` no repositório `main`.

---

## ⏰ Agendamento Automático (Horário de Brasília)

O workflow [`.github/workflows/buscador.yml`](.github/workflows/buscador.yml) executa nos três horários programados:

| Horário Brasília (BRT) | Horário UTC | Expressão Cron |
| :--- | :--- | :--- |
| **08:00** | 11:00 UTC | `0 11 * * *` |
| **14:00** | 17:00 UTC | `0 17 * * *` |
| **19:00** | 22:00 UTC | `0 22 * * *` |

> Configuração combinada no Actions: `0 11,17,22 * * *`

---

## 🚀 Como Operar 100% pelo GitHub (Sem Abrir Código)

### 1. Forçar Atualização Imediata (Manual)
1. Acesse seu repositório no GitHub.
2. Vá até a aba **Actions**.
3. Na lista à esquerda, clique em **Buscador de Futebol Ao Vivo**.
4. Clique no botão **Run workflow** à direita e confirme.
5. Em cerca de 1 a 2 minutos, o script terminará e o arquivo `partidas.json` estará atualizado na branch `main`.

### 2. Bloquear Canal Fake Persistente
1. No repositório, abra o arquivo [`blocklist.txt`](blocklist.txt).
2. Clique no ícone de **Lápis ✏️ (Edit this file)** no canto superior direito.
3. Adicione o ID do canal fake em uma nova linha (ex: `UC_x5XG1OV2P6uZZ5FSM9Ttw`).
4. Clique em **Commit changes...** e confirme na branch `main`.
5. A partir desse momento, o scraper nunca mais listará transmissões desse canal.

---

## ⚙️ Permissões Necessárias no Repositório

Para o GitHub Actions conseguir salvar o `partidas.json` automaticamente:
1. No repositório, vá em **Settings** > **Actions** > **General**.
2. Role até **Workflow permissions** e marque:
   - ✅ **Read and write permissions**.
   - ✅ **Allow GitHub Actions to create and approve pull requests**.
3. Clique em **Save**.
