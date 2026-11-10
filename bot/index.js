import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carregador leve de variáveis de ambiente do .env (Zero dependências externas)
 */
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // Remove aspas simples ou duplas se existirem
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const {
  TELEGRAM_BOT_TOKEN,
  ALLOWED_TELEGRAM_USER_ID,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = 'main',
  GITHUB_TOKEN,
  GITHUB_WORKFLOW_FILE = 'buscador.yml'
} = process.env;

// Validação de variáveis obrigatórias
const requiredVars = ['TELEGRAM_BOT_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_TOKEN'];
const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error('❌ [ERRO] Configure as seguintes variáveis no arquivo bot/.env:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\nConsulte o arquivo bot/.env.example para o modelo.');
  process.exit(1);
}

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const githubHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'TelegramBot-DevOps-Buscador'
};

/**
 * Envia mensagem para o Telegram
 */
async function sendTelegramMessage(chatId, text, extraOptions = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        ...extraOptions
      })
    });
    return await res.json();
  } catch (err) {
    console.error(`❌ Erro ao enviar mensagem para o chat ${chatId}:`, err.message);
  }
}

/**
 * Adiciona channel_id à blocklist.txt no GitHub via API
 */
async function addChannelToBlocklist(channelId) {
  const filePath = 'blocklist.txt';
  const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;

  let currentContent = '';
  let fileSha = null;

  const getRes = await fetch(fileUrl, { method: 'GET', headers: githubHeaders });

  if (getRes.status === 200) {
    const data = await getRes.json();
    fileSha = data.sha;
    currentContent = Buffer.from(data.content, 'base64').toString('utf-8');
  } else if (getRes.status !== 404) {
    const errText = await getRes.text();
    throw new Error(`Falha ao ler blocklist.txt (${getRes.status}): ${errText}`);
  }

  const lines = currentContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.includes(channelId)) {
    return { alreadyBlocked: true };
  }

  const updatedContent = currentContent.trim().length > 0
    ? `${currentContent.trim()}\n${channelId}\n`
    : `# Blocklist de Canais Fake\n${channelId}\n`;

  const updatedBase64 = Buffer.from(updatedContent, 'utf-8').toString('base64');

  const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: { ...githubHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `chore(blocklist): bloqueia canal ${channelId} [via telegram bot]`,
      content: updatedBase64,
      branch: GITHUB_BRANCH,
      ...(fileSha && { sha: fileSha })
    })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Erro ao salvar blocklist.txt (${putRes.status}): ${errText}`);
  }

  const resData = await putRes.json();
  return {
    alreadyBlocked: false,
    commitSha: resData.commit?.sha?.substring(0, 7) || 'ok'
  };
}

/**
 * Dispara o workflow do GitHub Actions
 */
async function triggerWorkflowDispatch() {
  const dispatchUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_FILE}/dispatches`;

  const res = await fetch(dispatchUrl, {
    method: 'POST',
    headers: { ...githubHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: GITHUB_BRANCH })
  });

  if (res.status === 204) {
    return true;
  }

  const errText = await res.text();
  throw new Error(`GitHub API dispatch status ${res.status}: ${errText}`);
}

/**
 * Processa mensagens recebidas
 */
async function handleMessage(message) {
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const userId = String(message.from?.id);
  const text = message.text.trim();

  // Controle de autorização
  if (ALLOWED_TELEGRAM_USER_ID && userId !== String(ALLOWED_TELEGRAM_USER_ID).trim()) {
    console.warn(`⛔ [Acesso Negado] Usuário não autorizado: ${userId} (${message.from?.username || 'anônimo'})`);
    return sendTelegramMessage(chatId, '⛔ *Acesso negado:* Seu ID de usuário do Telegram não está autorizado.');
  }

  // Comando /start ou /help
  if (text === '/start' || text === '/help') {
    const msg = `👋 *DevOps Control Panel - Buscador Ao Vivo*

Comandos para gerenciar o buscador sem abrir código:

📌 \`/block [channel_id]\`
Adiciona um canal de live fake à \`blocklist.txt\` no GitHub.

🚀 \`/update\`
Força o GitHub Actions a rodar o \`buscador.py\` imediatamente.

⚙️ *Repositório Vinculado:*
\`${GITHUB_OWNER}/${GITHUB_REPO}\` (Branch: \`${GITHUB_BRANCH}\`)`;
    return sendTelegramMessage(chatId, msg);
  }

  // Comando /block [channel_id]
  if (text.startsWith('/block')) {
    const parts = text.split(/\s+/);
    const channelId = parts[1]?.trim();

    if (!channelId) {
      return sendTelegramMessage(
        chatId,
        '⚠️ *Uso incorreto!*\nEnvie: `/block [channel_id]`\n\n_Exemplo:_ `/block UC1234567890abcdef`'
      );
    }

    await sendTelegramMessage(chatId, `⏳ Bloqueando canal \`${channelId}\` no repositório...`);

    try {
      const res = await addChannelToBlocklist(channelId);
      if (res.alreadyBlocked) {
        return sendTelegramMessage(chatId, `ℹ️ O canal \`${channelId}\` já estava na *blocklist.txt*!`);
      }
      return sendTelegramMessage(
        chatId,
        `✅ *Canal Bloqueado com Sucesso!*\n\n• Canal: \`${channelId}\`\n• Commit: \`${res.commitSha}\`\n• Arquivo: \`blocklist.txt\` atualizado na branch \`${GITHUB_BRANCH}\`.`
      );
    } catch (err) {
      console.error('Erro em /block:', err);
      return sendTelegramMessage(chatId, `❌ *Falha ao atualizar blocklist:*\n\`${err.message}\``);
    }
  }

  // Comando /update
  if (text === '/update') {
    await sendTelegramMessage(chatId, '⏳ Disparando workflow `buscador.yml` no GitHub Actions...');
    try {
      await triggerWorkflowDispatch();
      const actionsUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`;
      return sendTelegramMessage(
        chatId,
        `🚀 *Workflow iniciado com sucesso!*\n\nO \`buscador.py\` está sendo executado no GitHub Actions e atualizará o \`partidas.json\` em instantes.\n\n🔗 [Ver execução no GitHub](${actionsUrl})`,
        { disable_web_page_preview: true }
      );
    } catch (err) {
      console.error('Erro em /update:', err);
      return sendTelegramMessage(chatId, `❌ *Erro ao disparar workflow:*\n\`${err.message}\``);
    }
  }
}

/**
 * Loop Long Polling para escutar o Telegram de forma contínua
 */
async function startPolling() {
  console.log(`🤖 Bot iniciado com sucesso! Escutando comandos do Telegram...`);
  console.log(`📌 Repositório: ${GITHUB_OWNER}/${GITHUB_REPO} (Branch: ${GITHUB_BRANCH})`);

  let offset = 0;

  while (true) {
    try {
      const url = `${TELEGRAM_API_BASE}/getUpdates?offset=${offset}&timeout=25`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            if (update.message) {
              await handleMessage(update.message);
            }
          }
        }
      } else {
        const errText = await res.text();
        console.error(`⚠️ Erro ao buscar updates (${res.status}):`, errText);
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error('⚠️ Falha na conexão com Telegram:', err.message);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

startPolling();
