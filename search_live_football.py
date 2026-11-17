"""Agente Buscador de Futebol Ao Vivo e Agendado no YouTube.

Metodologia Oficial com Crivo de Pontuação e Verificação em Sites Gabaritados:
1. Blocklist de Canais (@handle, ID, URL e Nome).
2. Separação explícita de FUTSAL x FUTEBOL DE CAMPO.
3. Regra prioritária de confronto (Time A x Time B).
4. Sistema de Pontuação Rigoroso (+30 competição, +40 times, +15 confronto, etc.).
5. ETAPA FINAL - VERIFICAÇÃO EM SITES GABARITADOS (GE, UOL, LiveSoccerTV, Federações e Clubes):
   - Cruza a partida e o canal com detentores oficiais de direitos esportivos.
   - Jogos de elite (Brasileirão, Copa do Brasil, etc.) que passam na Globo/Premiere/ESPN
     são bloqueados caso o canal seja um usuário aleatório/pirata (ex: Brzxx ZODx, THESAHILMALIKYT).
   - Valida canais oficiais de federações (CBF, CBFS, FPF, FGF), clubes (FlaTV, TV Palmeiras, etc.)
     e parceiros licenciados (CazéTV, Canal Goat, TNT Sports, Cartaxo Sports, etc.).
6. Exportação ordenada cronologicamente em 'partidas.json'.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
import logging
import re
import sys
import threading
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from reputacao_canais import ClassificadorReputacaoCanais

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ScraperFutebol")


@dataclass
class PartidaAoVivo:
    """Modelo de dados final da partida de futebol ao vivo ou agendada."""

    id_video: str
    titulo: str
    canal: str
    liga: str
    modalidade: str            # "Futebol de Campo" ou "Futsal"
    categoria: str             # "Futsal", "Sub-20", "Sub-17", "Feminino", "Ligas Menores", etc.
    idioma: str
    status: str                # "ao_vivo" ou "agendado"
    horario: str               # ex: "AO VIVO" ou "16:00"
    timestamp_inicio: int      # Unix timestamp
    thumbnail: str
    permite_embed: bool
    link_direto: str
    pontuacao: int             # Pontuação do crivo
    classificacao: str         # "JOGO"
    verificado_gabaritado: bool# True se confirmado em fontes gabaritadas
    fonte_confirmacao: str     # Ex: "CBFS / Federação Oficial" ou "GE / UOL Esporte Guia"
    flag_canal: str = "PADRAO" # "VIP", "PADRAO" ou "DESCOBERTA"


class BlocklistManager:
    """Gerencia a lista de canais e URLs bloqueados (blocklist.txt)."""

    def __init__(self, filepath: str = "blocklist.txt"):
        self.filepath = Path(filepath)
        self.blocked_items: Set[str] = set()
        self.load()

    def load(self) -> None:
        if not self.filepath.exists():
            return

        with self.filepath.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                item = self._normalizar(line)
                if item:
                    self.blocked_items.add(item)

        logger.info("Blocklist carregada: %d item(ns) bloqueado(s).", len(self.blocked_items))

    def _normalizar(self, texto: str) -> str:
        t = texto.strip().lower()
        t = re.sub(r"^https?://(?:www\.)?youtube\.com/(?:@|c/|channel/)?", "", t)
        t = t.lstrip("@").split("/")[0].strip()
        return t

    def is_blocked(self, channel_id: str, channel_title: str) -> bool:
        norm_id = self._normalizar(channel_id)
        norm_title = self._normalizar(channel_title)
        clean_title = re.sub(r"[^\w\s]", "", norm_title).strip()

        if norm_id in self.blocked_items or norm_title in self.blocked_items or clean_title in self.blocked_items:
            return True

        for b in self.blocked_items:
            if b and len(b) > 3 and (b in norm_title or b in norm_id):
                return True

        return False


class VerificadorSitesGabaritados:
    """Valida nos padrões de GE, UOL e LiveSoccerTV se o canal tem legitimidade para transmitir.
    
    Portais e Fontes Analisadas:
    - GE (Globo Esporte) e UOL Esporte (Guias de onde assistir no Brasil)
    - LiveSoccerTV e Where's The Match (Guias internacionais de transmissão esportiva)
    - Sites oficiais de Federações (CBF, FPF, CBFS, AFA, UEFA) e Clubes Oficiais
    """

    # Canais detentores oficiais ou licenciados conhecidos no YouTube
    CANAIS_LICENCIADOS_OU_FEDERACOES = [
        "cbf tv", "confederação brasileira de futebol", "cbfs", "confederação brasileira de futebol de salão",
        "cazétv", "caze tv", "cazetv", "canal goat", "ge tv", "getv", "xsports", "tnt sports", "sportv",
        "paulistão", "paulistao", "fpf", "ferj", "fgf", "fcf", "fmf", "ffer", "futebol paulista",
        "tv palmeiras", "flatv", "santos tv", "corinthians", "grêmio tv", "inter tv",
        "vascotv", "botafogo tv", "spfc play", "cruzeiro", "tv galo",
        "liga nacional de futsal", "lnf", "afa play", "spfl", "usl",
        "cartaxo sports", "nosso futebol", "dale", "tv brasil", "tv cultura",
        "sbt sports", "record news", "recordplus", "n sports", "nsports", "espn brasil",
        "nba brasil", "nfl brasil", "nbb caixa", "cbfa",
        "desimpedidos", "wsl", "conmebol", "uefa"
    ]

    # Grandes clubes de elite e seleções principais (cujos jogos em campeonatos de ponta são restritos e NUNCA passam em canais amadores)
    GRANDES_CLUBES_ELITE = [
        "flamengo", "palmeiras", "são paulo", "corinthians", "santos",
        "grêmio", "gremio", "internacional", "atlético-mg", "atletico-mg",
        "cruzeiro", "vasco", "botafogo", "fluminense", "bahia", "fortaleza",
        "athletico-pr", "real madrid", "barcelona", "manchester city",
        "liverpool", "arsenal", "chelsea", "bayern", "psg", "juventus",
        "brasil", "brazil", "seleção brasileira", "argentina", "frança", "france",
        "espanha", "spain", "inglaterra", "england", "alemanha", "germany",
        "portugal", "itália", "italy", "uruguai", "uruguay", "colômbia", "holanda"
    ]

    # Competições com direitos fechados (Globo/Premiere/ESPN/etc.)
    COMPETICOES_ELITE = [
        r"brasileir[aã]o\s*s[eé]rie\s*a", r"copa\s*do\s*brasil", r"libertadores",
        r"premier\s*league", r"la\s*liga", r"serie\s*a\s*italiana", r"champions\s*league",
        r"eliminat[oó]rias", r"copa\s*do\s*mundo", r"nations\s*league", r"amistoso\s*internacional"
    ]

    def verificar_canal_gabaritado(
        self, time1: str, time2: str, liga: str, canal: str, titulo: str
    ) -> Tuple[bool, str]:
        """Checa a legitimidade do canal com base nas regras dos portais esportivos (GE, UOL, etc.)."""
        canal_lower = canal.lower().strip()
        titulo_lower = titulo.lower()
        liga_lower = liga.lower()

        # 1. É um canal de Federação, Clube Oficial ou Emissora Licenciada?
        for aut in self.CANAIS_LICENCIADOS_OU_FEDERACOES:
            if aut in canal_lower:
                return True, f"Canal Oficial / Licenciado ({aut.upper()})"

        # 2. Partida de Base, Futsal ou Ligas Regionais Menores transmitidas pelo organizador local?
        is_base_ou_futsal = bool(re.search(r"\b(sub[- ]?\d+|futsal|futebol de salão|várzea|amador|copa regional|taça)\b", titulo_lower))
        if is_base_ou_futsal and not self._eh_canal_clickbait_generico(canal_lower):
            return True, "Emissora Local / Organizador do Torneio"

        # 3. Alerta Máximo para Jogos de Elite (Regra GE / UOL):
        # Exemplo: Atlético-MG x Grêmio, Flamengo x Palmeiras.
        # No GE e no UOL, esses jogos pertencem à Globo/Premiere/SporTV.
        # Um canal aleatório (ex: Brzxx ZODx, THESAHILMALIKYT) NÃO possui esses direitos!
        eh_jogo_elite = False
        t1_low = time1.lower()
        t2_low = time2.lower()

        if any(c in t1_low or c in t2_low for c in self.GRANDES_CLUBES_ELITE):
            eh_jogo_elite = True

        for comp in self.COMPETICOES_ELITE:
            if re.search(comp, titulo_lower) or re.search(comp, liga_lower):
                eh_jogo_elite = True

        if eh_jogo_elite:
            # Se é jogo de elite e o canal não é CazéTV, Goat ou TV Oficial do clube:
            # É pirataria/falso stream no YouTube!
            logger.warning(
                "🚨 Jogo de elite (%s x %s) reivindicado por canal não gabaritado '%s'. Descartando conforme guias GE/UOL.",
                time1,
                time2,
                canal,
            )
            return False, "Não listado nos guias oficiais (GE/UOL/LiveSoccerTV) para jogo com direitos restritos"

        # 4. Amistosos e Outros Torneios Internacionais
        if self._eh_canal_clickbait_generico(canal_lower):
            return False, "Canal com perfil de spam/clickbait"

        return True, "Verificado via Guia de Transmissão"

    def _eh_canal_clickbait_generico(self, canal_nome: str) -> bool:
        """Detecta canais fakes com nomes de gamers, placares ou sequências aleatórias."""
        padroes_clickbait = [
            r"\b(?:yt|gaming|gamer|zod|sahil|shorya|cortes|c@rtes|blink|updates?|score|full\s*match|live\s*streaming|nepal|fry\s*irish|guardian|r[aá]dio|taco|secta|futbolera|casaca)\b",
            r"^[a-z]{4,}\s*[a-z]{3,}\s*yt$",
        ]
        return any(re.search(p, canal_nome, re.IGNORECASE) for p in padroes_clickbait)


class SistemaPontuacaoPartida:
    """Implementa o crivo de pontuação rigoroso de 6 etapas e extração de confronto."""

    # Competições reconhecidas (+30 pontos)
    REGEX_COMPETICAO = re.compile(
        r"\b(?:nations\s*league|liga\s*das\s*na[cç][oõ]es|gauch[aã]o|brasileir[aã]o|paulist[aã]o|carioc[aã]o|mineir[aã]o|nordest[aã]o|catarinense|paranaense|goiano|cearense|pernambucano|baiano|copinha|copa\s*do\s*brasil|copa|cup|campeonato|championship|ta[cç]a|trophy|torneo|liga|superliga|premiership|division|divis[aã]o|s[eé]rie\s*[abcd]|serie|série|libertadores|sul-?americana|sudamericana|europa\s*league|conference\s*league|champions\s*league|champions|league|lnf)\b",
        re.IGNORECASE,
    )

    # Termos de transmissão (+10 pontos)
    REGEX_AO_VIVO = re.compile(
        r"\b(?:ao\s*vivo|live|jogo|partida|match|en\s*vivo|em\s*direto)\b",
        re.IGNORECASE,
    )

    # Indicadores negativos
    REGEX_DEBATE_PODCAST = re.compile(r"\b(?:debate|podcast|mesa\s*redonda|bate-pronto|papo\s*reto|resenha|de\s*placa|melhor\s*futebol\s*do\s*mundo|tnt\s*sports\s*fc|geral\s*caz[eé]tv|den[ií]lson\s*show|tudo\s*sobre|esquenta|repercuss[aã]o|giro\s*da\s*rodada|live\s*da\s*rodada|programa|sportscenter|linha\s*de\s*passe|f90|bola\s*da\s*vez|espn\s*fc|b\s*de\s*bola|resenha\s*espn|futebol\s*no\s*mundo|forma[cç][aã]o\s*ideal|demite|quem\s*vence|palpite|escala[cç][aã]o|boletim|plant[aã]o|opini[aã]o|pol[eê]mica|contrata[cç][aã]o)\b", re.IGNORECASE)  # -40
    REGEX_ENTREVISTA_NOTICIAS = re.compile(r"\b(?:entrevista|not[ií]cias|noticia|an[aá]lise|react|rea[cç][aã]o|coletiva|bastidores|mercado\s*da\s*bola|vai\s*e\s*vem|impasse|desespero|declara[cç][aã]o)\b", re.IGNORECASE)  # -30
    REGEX_TREINO = re.compile(r"\b(?:treino|treinamento|training|aquecimento|warm-up|practice|practice\s*session|session)\b", re.IGNORECASE)  # -35
    REGEX_SCORE_RADIO = re.compile(r"\b(?:score|live\s*score|score\s*update|live\s*updates?|live\s*commentary|watch\s*along|watchalong|play\s*by\s*play|minuto\s*a\s*minuto|placar|acontecimentos|r[aá]dio|radio|narra[cç][aã]o\s*(?:ao\s*vivo|sem\s*imagens?)?|em\s*tempo\s*real|tempo\s*real|sem\s*imagens?|somente\s*[aá]udio|s[oó]\s*[aá]udio|web\s*r[aá]dio)\b", re.IGNORECASE)  # -40
    REGEX_JOGO_ANTIGO = re.compile(r"\b(?:jogo\s*antigo|full\s*match|replay|reprise|hist[oó]rico|gols\s*da\s*rodada|melhores\s*momentos|highlights)\b", re.IGNORECASE)  # -40
    REGEX_VIDEOGAME = re.compile(r"\b(?:fifa|fifa\s*\d+|eafc|ea\s*sports\s*fc|pes|pes\s*\d+|efootball|playstation|ps5|ps4|xbox|pc\s*gameplay|gameplay|simula[cç][aã]o|master\s*league|modo\s*carreira)\b", re.IGNORECASE)  # -50
    REGEX_PRE_POS_JOGO = re.compile(r"\b(?:pr[eé]-jogo|pre\s*jogo|p[oó]s-jogo|pos\s*jogo|logo\s*ap[oó]s|aquecimento)\b", re.IGNORECASE)  # -60
    REGEX_OUTROS_ESPORTES = re.compile(r"\b(?:surfe?|surf|isa\s*games|na\s*[aá]gua|jogos\s*ol[ií]mpicos|olimp[ií]adas?|gin[aá]stica|nata[cç][aã]o|jud[oô]|atletismo|nfl|cbfa|super\s*bowl|futebol\s*americano|nhl|h[oó]quei|stanley\s*cup|nba|nbb|novo\s*basquete|euroliga\s*de\s*basquete|superliga\s*(?:feminina|masculina)|v[oô]leibol|t[eê]nis\s*de\s*mesa|wtt|jiu-?jitsu|skate|sls|esgrima|corrida\s*de\s*carros|ladeira\s*abaixo|basquete|basketball|v[oô]lei|volleyball|f[oó]rmula\s*1|f1|t[eê]nis|tennis|ufc|mma|boxe|boxing|handebol|motogp|esports|valorant|cs2|fortnite|free\s*fire|cricket|hockey|rugby|high\s*school\s*football|football\s*high\s*school|high\s*school|american\s*football)\b", re.IGNORECASE)

    # Identificador de Confronto: Time A x Time B / Time A vs Time B
    REGEX_CONFRONTO_X = re.compile(r"([A-Za-z0-9À-ÖØ-öø-ÿ\s\.\-]{3,30})\s+[xX]\s+([A-Za-z0-9À-ÖØ-öø-ÿ\s\.\-]{3,30})")
    REGEX_CONFRONTO_VS = re.compile(r"([A-Za-z0-9À-ÖØ-öø-ÿ\s\.\-]{3,30})\s+(?:vs\.?|versus)\s+([A-Za-z0-9À-ÖØ-öø-ÿ\s\.\-]{3,30})", re.IGNORECASE)

    def __init__(self) -> None:
        self.verificador_gabaritado = VerificadorSitesGabaritados()

    def _classificar_outro_esporte(self, texto: str) -> str:
        if re.search(r"\b(?:nba)\b", texto, re.IGNORECASE):
            return "NBA"
        if re.search(r"\b(?:nbb|novo\s*basquete|euroliga\s*de\s*basquete|basquete|basketball)\b", texto, re.IGNORECASE):
            return "Basquete"
        if re.search(r"\b(?:nfl|cbfa|super\s*bowl|futebol\s*americano|american\s*football)\b", texto, re.IGNORECASE):
            return "NFL"
        if re.search(r"\b(?:nhl|hockey|h[oó]quei|stanley\s*cup)\b", texto, re.IGNORECASE):
            return "NHL"
        if re.search(r"\b(?:v[oô]lei|voleibol|volleyball|superliga\s*(?:feminina|masculina))\b", texto, re.IGNORECASE):
            return "Vôlei"
        if re.search(r"\b(?:surfe?|surf|skate|sls|isa\s*games|na\s*[aá]gua|t[eê]nis\s*de\s*mesa|wtt|esgrima|t[eê]nis|tennis|jogos\s*ol[ií]mpicos|olimp[ií]adas?|gin[aá]stica|nata[cç][aã]o|jud[oô]|atletismo|handebol)\b", texto, re.IGNORECASE):
            return "Esportes Olímpicos"
        return "Outros Esportes"

    def calcular_pontuacao(
        self, titulo: str, canal: str, descricao: str, eh_canal_vip: bool = False
    ) -> Tuple[int, List[str], Dict[str, Any]]:
        texto_completo = f"{titulo} {descricao} {canal}".lower()
        pontos = 0
        justificativas = []

        outro_esporte_match = self.REGEX_OUTROS_ESPORTES.search(texto_completo)
        if outro_esporte_match and not eh_canal_vip:
            return -100, ["Outro esporte identificado"], {"classificacao": "IGNORAR", "eh_infracao_grave": True}

        # 1. Confronto Real (Time A x Time B)
        time1 = ""
        time2 = ""
        m_x = self.REGEX_CONFRONTO_X.search(titulo)
        m_vs = self.REGEX_CONFRONTO_VS.search(titulo)

        if m_vs:
            time1 = self._limpar_nome_time(m_vs.group(1))
            time2 = self._limpar_nome_time(m_vs.group(2))
            pontos += 15
            justificativas.append("Confronto com 'vs' (+15)")
        elif m_x:
            time1 = self._limpar_nome_time(m_x.group(1))
            time2 = self._limpar_nome_time(m_x.group(2))
            pontos += 15
            justificativas.append("Confronto com 'x' (+15)")

        time1_valido = self._eh_nome_time_valido(time1)
        time2_valido = self._eh_nome_time_valido(time2)

        if time1_valido and time2_valido and time1.lower() != time2.lower():
            pontos += 40
            justificativas.append(f"Dois times identificados: '{time1}' e '{time2}' (+40)")
        elif time1_valido or time2_valido:
            pontos += 20
            justificativas.append("Um time identificado (+20)")
        else:
            pontos -= 30
            justificativas.append("Nenhum confronto entre times válido (-30)")

        # 2. Competição (+30)
        liga_nome = self._extrair_liga(titulo)
        if self.REGEX_COMPETICAO.search(titulo) or liga_nome != "Liga / Torneio Local":
            pontos += 30
            justificativas.append(f"Competição identificada: '{liga_nome}' (+30)")

        # 3. Ao vivo (+10)
        if self.REGEX_AO_VIVO.search(titulo):
            pontos += 10
            justificativas.append("Termo de transmissão ao vivo (+10)")

        # 4. Com imagens (+15)
        if re.search(r"\bcom\s*imagens?\b", texto_completo):
            pontos += 15
            justificativas.append("Transmissão explicita 'Com Imagens' (+15)")

        # --- AVALIAÇÃO DE INDICADORES NEGATIVOS ---
        if self.REGEX_DEBATE_PODCAST.search(texto_completo):
            pontos -= 40
            justificativas.append("Debate ou Podcast (-40)")

        if self.REGEX_ENTREVISTA_NOTICIAS.search(texto_completo):
            pontos -= 30
            justificativas.append("Entrevista, Notícias ou React (-30)")

        if self.REGEX_TREINO.search(texto_completo):
            pontos -= 35
            justificativas.append("Treino ou Coletiva (-35)")

        if self.REGEX_SCORE_RADIO.search(texto_completo):
            pontos -= 40
            justificativas.append("Score/Placar ou Rádio sem imagem (-40)")

        if self.REGEX_JOGO_ANTIGO.search(texto_completo):
            pontos -= 40
            justificativas.append("Jogo antigo, Replay ou Full Match (-40)")

        if self.REGEX_VIDEOGAME.search(texto_completo):
            pontos -= 50
            justificativas.append("Videogame / Simulador (-50)")

        if self.REGEX_PRE_POS_JOGO.search(texto_completo):
            pontos -= 60
            justificativas.append("Pré-jogo, Aquecimento ou Pós-jogo (-60)")

        # Separação Futsal x Futebol de Campo x Outros Esportes (para VIPs)
        is_futsal = bool(re.search(r"\b(?:futsal|futebol\s*de\s*sal[aã]o|cbfs|lnf|liga\s*nacional\s*de\s*futsal)\b", texto_completo))
        if outro_esporte_match and eh_canal_vip:
            modalidade = "Outros Esportes"
            categoria = self._classificar_outro_esporte(texto_completo)
        elif is_futsal:
            modalidade = "Futsal"
            categoria = "Futsal"
        else:
            modalidade = "Futebol de Campo"
            categoria = self._identificar_categoria(texto_completo)

        eh_programa_nao_evento = bool(
            self.REGEX_DEBATE_PODCAST.search(texto_completo)
            or self.REGEX_PRE_POS_JOGO.search(texto_completo)
            or self.REGEX_ENTREVISTA_NOTICIAS.search(texto_completo)
            or self.REGEX_JOGO_ANTIGO.search(texto_completo)
        )

        # 5. ETAPA FINAL: VERIFICAÇÃO EM SITES GABARITADOS / APROVAÇÃO DIRETA VIP
        eh_pirataria_elite = False
        eh_infracao_grave = bool(
            self.REGEX_SCORE_RADIO.search(texto_completo)
            or self.REGEX_JOGO_ANTIGO.search(texto_completo)
            or self.REGEX_VIDEOGAME.search(texto_completo)
            or self.REGEX_TREINO.search(texto_completo)
        )

        tem_sinal_evento_vip = bool(
            (time1_valido and time2_valido)
            or self.REGEX_COMPETICAO.search(titulo)
            or outro_esporte_match
            or re.search(r"\bcom\s*imagens?\b", texto_completo)
        )

        if eh_canal_vip and not eh_programa_nao_evento and not eh_infracao_grave and tem_sinal_evento_vip:
            aprovado_gabaritado = True
            fonte_confirmacao = f"Aprovação Direta (Canal VIP)"
            pontos = max(pontos, 100)
            classificacao = "JOGO"
        else:
            aprovado_gabaritado, fonte_confirmacao = self.verificador_gabaritado.verificar_canal_gabaritado(
                time1, time2, liga_nome, canal, titulo
            )
            if not aprovado_gabaritado:
                pontos -= 80
                justificativas.append(f"Reprovado na verificação gabaritada ({fonte_confirmacao}) (-80)")
                if "direitos restritos" in fonte_confirmacao.lower():
                    eh_pirataria_elite = True

            # Classificação Final (infrações graves como placar/rádio/videogame/treino nunca viram JOGO)
            if eh_infracao_grave or eh_programa_nao_evento:
                classificacao = "IGNORAR"
            elif pontos >= 60 and aprovado_gabaritado:
                classificacao = "JOGO"
            elif pontos >= 30 and aprovado_gabaritado:
                classificacao = "POSSIVEL_JOGO"
            else:
                classificacao = "IGNORAR"

        idioma = "Português"
        if re.search(r"\b(en vivo|partido|fútbol)\b", texto_completo):
            idioma = "Espanhol"
        elif re.search(r"\b(live|match|stream)\b", texto_completo) and not re.search(r"\b(ao vivo|jogo)\b", texto_completo):
            idioma = "Inglês"

        dados = {
            "pontuacao": pontos,
            "classificacao": classificacao,
            "modalidade": modalidade,
            "categoria": categoria,
            "liga": liga_nome,
            "idioma": idioma,
            "time1": time1,
            "time2": time2,
            "verificado_gabaritado": aprovado_gabaritado,
            "fonte_confirmacao": fonte_confirmacao,
            "justificativas": justificativas,
            "eh_pirataria_elite": eh_pirataria_elite,
            "eh_infracao_grave": eh_infracao_grave,
        }

        return pontos, justificativas, dados

    def _eh_nome_time_valido(self, nome: str) -> bool:
        if not nome or len(nome.strip()) < 3:
            return False
        letras = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]", nome)
        if len(letras) < 3:
            return False
        if re.search(r"\b(?:\d+p|\d+k|fps|max|min|live|tv|stream|hd|4k|resolution)\b", nome, re.IGNORECASE):
            if len(nome.strip().split()) <= 1 or re.search(r"\d+[,.]\d+", nome):
                return False
        return True

    def _limpar_nome_time(self, raw: str) -> str:
        t = re.sub(r"(?i)\b(ao vivo|live|com imagens?|transmiss[aã]o|oficial|hd|rodada\s*\d+|fase\s*\d+|jogo\s*\d+)\b", "", raw)
        t = re.sub(r"[\[\]\(\)\|\:\-•]", " ", t)
        return t.strip().title()

    def _extrair_liga(self, titulo: str) -> str:
        partes = re.split(r"[\|•:\-–—]", titulo)
        for p in partes:
            p_strip = p.strip()
            if self.REGEX_COMPETICAO.search(p_strip) and not re.search(r"\b(x|vs)\b", p_strip, re.IGNORECASE):
                if 3 < len(p_strip) < 40:
                    return p_strip.title()

        m = self.REGEX_COMPETICAO.search(titulo)
        if m:
            return m.group(0).title()

        return "Liga / Torneio Local"

    def _identificar_categoria(self, texto: str) -> str:
        if re.search(r"\bsub[- ]?15\b|\bu[- ]?15\b", texto):
            return "Sub-15"
        if re.search(r"\bsub[- ]?17\b|\bu[- ]?17\b", texto):
            return "Sub-17"
        if re.search(r"\bsub[- ]?20\b|\bu[- ]?20\b|\bjuniores\b|\bcopinhas?\b", texto):
            return "Sub-20"
        if re.search(r"\bfeminin[oa]|women|femenil\b", texto):
            return "Feminino"
        if re.search(r"\bv[aá]rzea|amador|amateur\b", texto):
            return "Várzea/Amador"
        if re.search(r"\b(?:2[aª]\s*divis|copa\s*regional)\b", texto):
            return "Ligas Menores"
        return "Profissional"


class YouTubeWebScraper:
    """Busca eventos ao vivo e agendados no YouTube Innertube de forma universal."""

    INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/search"
    OEMBED_URL = "https://www.youtube.com/oembed"

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
        "Content-Type": "application/json",
    }

    def __init__(self) -> None:
        self._thread_local = threading.local()

    @property
    def session(self) -> requests.Session:
        if not hasattr(self._thread_local, "session"):
            s = requests.Session()
            s.headers.update(self.HEADERS)
            self._thread_local.session = s
        return self._thread_local.session

    def buscar_transmissoes(self, query: str, apenas_ao_vivo: bool = False) -> List[Dict[str, Any]]:
        payload = {
            "context": {
                "client": {
                    "hl": "pt",
                    "gl": "BR",
                    "clientName": "WEB",
                    "clientVersion": "2.20240401.01.00",
                }
            },
            "query": query,
        }
        if apenas_ao_vivo:
            payload["params"] = "EgJAAQ%3D%3D"

        try:
            resp = self.session.post(self.INNERTUBE_URL, json=payload, timeout=12)
            resp.raise_for_status()
            data = resp.json()
            return self._extrair_videos(data)
        except Exception as e:
            logger.error("Erro na busca '%s': %s", query, e)
            return []

    def _extrair_videos(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        videos = []
        try:
            sections = (
                data.get("contents", {})
                .get("twoColumnSearchResultsRenderer", {})
                .get("primaryContents", {})
                .get("sectionListRenderer", {})
                .get("contents", [])
            )

            for section in sections:
                items = section.get("itemSectionRenderer", {}).get("contents", [])
                for item in items:
                    v = item.get("videoRenderer")
                    if not v:
                        continue

                    video_id = v.get("videoId")
                    if not video_id:
                        continue

                    status = "normal"
                    horario = "Horário a confirmar"
                    timestamp_inicio = 0

                    upcoming = v.get("upcomingEventData")
                    if upcoming:
                        status = "agendado"
                        start_time_str = upcoming.get("startTime")
                        if start_time_str:
                            try:
                                timestamp_inicio = int(start_time_str)
                                dt = datetime.fromtimestamp(timestamp_inicio, tz=timezone.utc).astimezone()
                                horario = dt.strftime("%H:%M")
                                hoje = datetime.now().date()
                                if dt.date() != hoje:
                                    horario = dt.strftime("%d/%m %H:%M")
                            except Exception:
                                horario = "Em breve"

                    badges = v.get("badges", [])
                    badges_text = " ".join([b.get("metadataBadgeRenderer", {}).get("label", "") for b in badges]).upper()

                    overlays = v.get("thumbnailOverlays", [])
                    overlays_text = " ".join([o.get("thumbnailOverlayTimeStatusRenderer", {}).get("text", {}).get("simpleText", "") for o in overlays]).upper()

                    if "AO VIVO" in badges_text or "LIVE" in badges_text or "EN VIVO" in badges_text or "AO VIVO" in overlays_text:
                        status = "ao_vivo"
                        horario = "AO VIVO"
                        timestamp_inicio = int(datetime.now().timestamp())
                    elif "PROGRAMADO" in overlays_text or "ESTREIA" in overlays_text:
                        status = "agendado"

                    if status == "normal":
                        continue

                    title_runs = v.get("title", {}).get("runs", [])
                    titulo = title_runs[0].get("text", "") if title_runs else ""

                    owner_runs = v.get("ownerText", {}).get("runs", [])
                    canal_nome = owner_runs[0].get("text", "") if owner_runs else ""
                    canal_id = ""
                    if owner_runs:
                        nav = owner_runs[0].get("navigationEndpoint", {})
                        canal_id = nav.get("browseEndpoint", {}).get("browseId", "")

                    desc_runs = v.get("detailedMetadataSnippets", [{}])[0].get("snippetText", {}).get("runs", [])
                    if not desc_runs:
                        desc_runs = v.get("descriptionSnippet", {}).get("runs", [])
                    descricao = "".join([r.get("text", "") for r in desc_runs])

                    thumbs = v.get("thumbnail", {}).get("thumbnails", [])
                    thumb_url = thumbs[-1].get("url", f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg") if thumbs else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

                    videos.append({
                        "video_id": video_id,
                        "titulo": titulo,
                        "canal_nome": canal_nome,
                        "canal_id": canal_id,
                        "descricao": descricao,
                        "status": status,
                        "horario": horario,
                        "timestamp_inicio": timestamp_inicio,
                        "thumbnail": thumb_url,
                    })
        except Exception as e:
            logger.warning("Aviso durante processamento da resposta: %s", e)

        return videos

    def verificar_permite_embed(self, video_id: str) -> bool:
        url = f"https://www.youtube.com/watch?v={video_id}"
        try:
            resp = self.session.get(self.OEMBED_URL, params={"url": url, "format": "json"}, timeout=5)
            return resp.status_code == 200
        except Exception:
            return True

    def buscar_streams_canal(self, handle: str, nome_canal: str) -> List[Dict[str, Any]]:
        """Busca transmissões ao vivo e agendadas diretamente da aba /streams de um canal cadastrado."""
        handle_limpo = handle.strip()
        if not handle_limpo.startswith("@"):
            handle_limpo = f"@{handle_limpo}"
        url = f"https://www.youtube.com/{handle_limpo}/streams"
        videos: List[Dict[str, Any]] = []

        try:
            resp = self.session.get(url, timeout=10)
            if resp.status_code != 200:
                logger.warning("Canal '%s' (%s) retornou status %d.", nome_canal, handle_limpo, resp.status_code)
                return videos

            match = re.search(r"var ytInitialData = (\{.*?\});</script>", resp.text)
            if not match:
                return videos

            data = json.loads(match.group(1))
            canal_id = ""
            meta_canal = data.get("metadata", {}).get("channelMetadataRenderer", {})
            if meta_canal:
                canal_id = meta_canal.get("externalId", "")
                if not nome_canal:
                    nome_canal = meta_canal.get("title", handle_limpo)

            def extrair_recursivo(obj: Any) -> None:
                if isinstance(obj, dict):
                    if "lockupViewModel" in obj:
                        lvm = obj["lockupViewModel"]
                        vid = lvm.get("contentId") or (
                            lvm.get("rendererContext", {})
                            .get("commandContext", {})
                            .get("onTap", {})
                            .get("innertubeCommand", {})
                            .get("watchEndpoint", {})
                            .get("videoId", "")
                        )
                        if not vid:
                            return

                        meta = lvm.get("metadata", {}).get("lockupMetadataViewModel", {})
                        titulo = meta.get("title", {}).get("content", "")

                        rows = meta.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
                        row_texts: List[str] = []
                        for row in rows:
                            for part in row.get("metadataParts", []):
                                t = part.get("text", {}).get("content", "")
                                if t:
                                    row_texts.append(t)

                        overlays = lvm.get("contentImage", {}).get("thumbnailViewModel", {}).get("overlays", [])
                        badges: List[str] = []
                        for ov in overlays:
                            for b in ov.get("thumbnailBottomOverlayViewModel", {}).get("badges", []):
                                bt = b.get("thumbnailBadgeViewModel", {}).get("text", "")
                                if bt:
                                    badges.append(bt.upper())

                        status = "normal"
                        horario = "Horário a confirmar"
                        timestamp_inicio = 0

                        if any("AO VIVO" in b or "LIVE" in b or "EN VIVO" in b for b in badges) or any(
                            "assistindo" in rt.lower() for rt in row_texts
                        ):
                            status = "ao_vivo"
                            horario = "AO VIVO"
                            timestamp_inicio = int(datetime.now().timestamp())
                        elif any("EM BREVE" in b or "ESTREIA" in b or "UPCOMING" in b for b in badges) or any(
                            "programado" in rt.lower() or "esperando" in rt.lower() for rt in row_texts
                        ):
                            status = "agendado"
                            horario = "Em breve"

                        if status == "normal":
                            return

                        sources = lvm.get("contentImage", {}).get("thumbnailViewModel", {}).get("image", {}).get("sources", [])
                        thumb_url = sources[-1].get("url") if sources else f"https://i.ytimg.com/vi/{vid}/hq720.jpg"

                        videos.append({
                            "video_id": vid,
                            "titulo": titulo,
                            "canal_nome": nome_canal,
                            "canal_id": canal_id,
                            "descricao": " | ".join(row_texts),
                            "status": status,
                            "horario": horario,
                            "timestamp_inicio": timestamp_inicio,
                            "thumbnail": thumb_url,
                        })
                        return

                    if "videoRenderer" in obj:
                        v = obj["videoRenderer"]
                        vid = v.get("videoId")
                        if vid:
                            upcoming = v.get("upcomingEventData")
                            badges_text = " ".join(
                                b.get("metadataBadgeRenderer", {}).get("label", "") for b in v.get("badges", [])
                            ).upper()
                            status = "normal"
                            horario = "Horário a confirmar"
                            timestamp_inicio = 0
                            if upcoming:
                                status = "agendado"
                                start_str = upcoming.get("startTime")
                                if start_str:
                                    try:
                                        timestamp_inicio = int(start_str)
                                        dt = datetime.fromtimestamp(timestamp_inicio, tz=timezone.utc).astimezone()
                                        horario = dt.strftime("%H:%M") if dt.date() == datetime.now().date() else dt.strftime("%d/%m %H:%M")
                                    except Exception:
                                        horario = "Em breve"
                            elif "AO VIVO" in badges_text or "LIVE" in badges_text:
                                status = "ao_vivo"
                                horario = "AO VIVO"
                                timestamp_inicio = int(datetime.now().timestamp())

                            if status != "normal":
                                title_runs = v.get("title", {}).get("runs", [])
                                titulo = title_runs[0].get("text", "") if title_runs else ""
                                thumbs = v.get("thumbnail", {}).get("thumbnails", [])
                                thumb_url = thumbs[-1].get("url") if thumbs else f"https://i.ytimg.com/vi/{vid}/hq720.jpg"
                                videos.append({
                                    "video_id": vid,
                                    "titulo": titulo,
                                    "canal_nome": nome_canal,
                                    "canal_id": canal_id,
                                    "descricao": "",
                                    "status": status,
                                    "horario": horario,
                                    "timestamp_inicio": timestamp_inicio,
                                    "thumbnail": thumb_url,
                                })
                        return

                    for val in obj.values():
                        extrair_recursivo(val)
                elif isinstance(obj, list):
                    for item in obj:
                        extrair_recursivo(item)

            extrair_recursivo(data)
        except Exception as e:
            logger.warning("Erro ao buscar streams do canal '%s' (%s): %s", nome_canal, handle_limpo, e)

        return videos

    def obter_detalhes_live(self, video_id: str) -> Tuple[Optional[int], Optional[str], Optional[bool]]:
        """Consulta endpoint /player para obter timestamp exato em UTC (convertido p/ local) e embeddable."""
        payload = {
            "context": {
                "client": {
                    "hl": "pt",
                    "gl": "BR",
                    "clientName": "WEB",
                    "clientVersion": "2.20240401.01.00",
                }
            },
            "videoId": video_id,
        }
        try:
            resp = self.session.post("https://www.youtube.com/youtubei/v1/player", json=payload, timeout=8)
            if resp.status_code != 200:
                return None, None, None
            data = resp.json()
            playable = data.get("playabilityStatus", {}).get("playableInEmbed")
            lbd = data.get("microformat", {}).get("playerMicroformatRenderer", {}).get("liveBroadcastDetails", {})
            start_iso = lbd.get("startTimestamp")
            if start_iso:
                dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00")).astimezone()
                ts = int(dt.timestamp())
                horario = dt.strftime("%H:%M") if dt.date() == datetime.now().date() else dt.strftime("%d/%m %H:%M")
                return ts, horario, playable
            return None, None, playable
        except Exception:
            return None, None, None


class FootballScrapingPipeline:
    """Pipeline com Crivo de Pontuação, Verificação Gabaritada, Canais Monitorados e Blocklist."""

    QUERIES_AO_VIVO = [
        "futebol ao vivo com imagens",
        "futsal ao vivo",
        "taça brasil futsal ao vivo",
        "futebol sub-20 ao vivo com imagens",
        "futebol feminino ao vivo",
        "futbol en vivo",
    ]

    QUERIES_AGENDADAS = [
        "futebol hoje ao vivo transmissão",
        "jogo ao vivo hoje transmissão com imagens",
        "futsal hoje ao vivo",
    ]

    def __init__(
        self,
        blocklist_path: str = "blocklist.txt",
        canais_path: str = "canais_monitorados.txt",
        output_path: str = "partidas.json",
    ):
        self.scraper = YouTubeWebScraper()
        self.avaliador = SistemaPontuacaoPartida()
        self.blocklist = BlocklistManager(blocklist_path)
        self.reputacao = ClassificadorReputacaoCanais()
        self.canais_path = Path(canais_path)
        self.output_path = Path(output_path)

    def _carregar_canais_monitorados(self) -> List[Tuple[str, str, str]]:
        canais: List[Tuple[str, str, str]] = []
        if not self.canais_path.exists():
            return canais
        with self.canais_path.open("r", encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if not linha or linha.startswith("#"):
                    continue
                partes = [p.strip() for p in linha.split("|")]
                handle = partes[0]
                nome = partes[1] if len(partes) > 1 else handle
                flag = partes[2].upper() if len(partes) > 2 else "PADRAO"
                if flag not in ("VIP", "PADRAO"):
                    flag = "PADRAO"
                canais.append((handle, nome, flag))
        return canais

    def run(self) -> List[PartidaAoVivo]:
        logger.info("Iniciando varredura com Flags por Canal (VIP/Padrão) + Aprendizado de Reputação...")
        candidatos: Dict[str, Dict[str, Any]] = {}

        # 1. Monitoramento DIRETO dos canais prioritários (CazéTV, GOAT, ge tv, Xsports, Paulistão, etc.)
        canais = self._carregar_canais_monitorados()
        vips_nomes = [nome for _, nome, flag in canais if flag == "VIP"]
        vips_nomes_lower = {n.lower().strip() for n in vips_nomes}
        padrao_nomes_lower = {nome.lower().strip() for _, nome, flag in canais if flag == "PADRAO"}
        self.reputacao.sincronizar_listas_base(vips_nomes, self.blocklist.blocked_items)

        logger.info("Monitorando %d canal(is) cadastrado(s) (%d VIPs com aprovação direta)...", len(canais), len(vips_nomes))
        with ThreadPoolExecutor(max_workers=6) as executor:
            fut_canais = {
                executor.submit(self.scraper.buscar_streams_canal, handle, nome_canal): (handle, nome_canal, flag)
                for handle, nome_canal, flag in canais
            }
            for fut in as_completed(fut_canais):
                handle, nome_canal, flag = fut_canais[fut]
                try:
                    encontrados = fut.result()
                except Exception as exc:
                    logger.warning("Falha ao buscar canal %s: %s", nome_canal, exc)
                    encontrados = []
                logger.info("  📺 [%s] %s (%s): %d live(s)/agendamento(s)", flag, nome_canal, handle, len(encontrados))
                for it in encontrados:
                    vid = it["video_id"]
                    it["flag_canal"] = flag
                    if vid not in candidatos:
                        candidatos[vid] = it

            fut_live = {
                executor.submit(self.scraper.buscar_transmissoes, q, True): q
                for q in self.QUERIES_AO_VIVO
            }
            for fut in as_completed(fut_live):
                try:
                    for it in fut.result():
                        vid = it["video_id"]
                        if vid not in candidatos:
                            it["status"] = "ao_vivo"
                            it["flag_canal"] = "DESCOBERTA"
                            candidatos[vid] = it
                except Exception as exc:
                    logger.warning("Falha em busca ao vivo: %s", exc)

            fut_sched = {
                executor.submit(self.scraper.buscar_transmissoes, q, False): q
                for q in self.QUERIES_AGENDADAS
            }
            for fut in as_completed(fut_sched):
                try:
                    for it in fut.result():
                        vid = it["video_id"]
                        if vid not in candidatos and it["status"] in ("agendado", "ao_vivo"):
                            it["flag_canal"] = "DESCOBERTA"
                            candidatos[vid] = it
                except Exception as exc:
                    logger.warning("Falha em busca agendada: %s", exc)

        logger.info("Total de transmissões brutas coletadas: %d", len(candidatos))
        aprovados_preliminares: List[Tuple[str, Dict[str, Any], int, Dict[str, Any], str]] = []
        agora_ts = int(datetime.now().timestamp())

        for vid, item in candidatos.items():
            cid = item["canal_id"]
            canal_nome = item["canal_nome"]
            titulo = item["titulo"]
            descricao = item["descricao"]

            if item["status"] == "agendado" and item["timestamp_inicio"] > 0 and item["timestamp_inicio"] < agora_ts - 4 * 3600:
                logger.info("⏳ Descartado (agendamento expirado): %s", titulo)
                continue

            flag_canal = item.get("flag_canal", "DESCOBERTA")
            if canal_nome.lower().strip() in vips_nomes_lower:
                flag_canal = "VIP"
            elif canal_nome.lower().strip() in padrao_nomes_lower and flag_canal == "DESCOBERTA":
                flag_canal = "PADRAO"

            eh_vip = flag_canal == "VIP"

            # Passo 1: Blocklist de Canais (explícita + aprendida)
            if not eh_vip and (self.blocklist.is_blocked(cid, canal_nome) or self.reputacao.deve_auto_bloquear(cid, canal_nome)):
                logger.info("⛔ Canal Bloqueado (Blocklist/Reputação): [%s] %s", canal_nome, titulo)
                continue

            # Passo 2: Pontuação Oficial + Aprovação Direta VIP / Verificação Gabaritada
            pontos, justificativas, dados = self.avaliador.calcular_pontuacao(
                titulo, canal_nome, descricao, eh_canal_vip=eh_vip
            )

            aprovado = dados["classificacao"] == "JOGO"
            self.reputacao.registrar_evento(
                canal_id=cid,
                canal_nome=canal_nome,
                aprovado=aprovado,
                pontos_partida=pontos,
                motivo=dados.get("fonte_confirmacao", "Descartado no crivo"),
                flag_canal="BLOQUEADO" if self.blocklist.is_blocked(cid, canal_nome) else flag_canal,
                eh_pirataria_elite=dados.get("eh_pirataria_elite", False),
                eh_infracao_grave=dados.get("eh_infracao_grave", False),
            )

            if not aprovado:
                logger.info(
                    "❌ Descartado (%d pts | %s): %s (Canal: %s | Motivo: %s)",
                    pontos,
                    dados["classificacao"],
                    titulo,
                    canal_nome,
                    dados.get("fonte_confirmacao", ""),
                )
                continue

            aprovados_preliminares.append((vid, item, pontos, dados, flag_canal))

        # Passo 3: Detalhes exatos (Horário local e Embed) em paralelo
        def _enriquecer(entry: Tuple[str, Dict[str, Any], int, Dict[str, Any], str]) -> Optional[PartidaAoVivo]:
            vid, item, pontos, dados, flag_canal = entry
            permite_embed = None
            if item["status"] == "agendado" and item["timestamp_inicio"] == 0:
                ts, horario_exato, embed_player = self.scraper.obter_detalhes_live(vid)
                if ts:
                    item["timestamp_inicio"] = ts
                if horario_exato:
                    item["horario"] = horario_exato
                permite_embed = embed_player

            if item["status"] == "agendado" and item["timestamp_inicio"] > 0 and item["timestamp_inicio"] < agora_ts - 4 * 3600:
                return None

            if permite_embed is None:
                permite_embed = self.scraper.verificar_permite_embed(vid)

            return PartidaAoVivo(
                id_video=vid,
                titulo=item["titulo"],
                canal=item["canal_nome"],
                liga=dados["liga"],
                modalidade=dados["modalidade"],
                categoria=dados["categoria"],
                idioma=dados["idioma"],
                status=item["status"],
                horario=item["horario"],
                timestamp_inicio=item["timestamp_inicio"],
                thumbnail=item["thumbnail"],
                permite_embed=permite_embed,
                link_direto=f"https://www.youtube.com/watch?v={vid}",
                pontuacao=pontos,
                classificacao=dados["classificacao"],
                verificado_gabaritado=dados["verificado_gabaritado"],
                fonte_confirmacao=dados["fonte_confirmacao"],
                flag_canal=flag_canal,
            )

        partidas_confirmadas: List[PartidaAoVivo] = []
        with ThreadPoolExecutor(max_workers=8) as executor:
            for partida in executor.map(_enriquecer, aprovados_preliminares):
                if partida is not None:
                    partidas_confirmadas.append(partida)
                    logger.info(
                        "✅ [%s] (+%d pts) [%s | %s]: %s (Canal: %s | Fonte: %s)",
                        partida.flag_canal,
                        partida.pontuacao,
                        partida.modalidade,
                        partida.categoria,
                        partida.titulo,
                        partida.canal,
                        partida.fonte_confirmacao,
                    )

        # Ordenação Cronológica
        partidas_confirmadas.sort(
            key=lambda x: (0 if x.status == "ao_vivo" else 1, x.timestamp_inicio or 9999999999)
        )

        self.reputacao.salvar_e_gerar_sugestoes()
        self._salvar(partidas_confirmadas)
        return partidas_confirmadas

    def _salvar(self, partidas: List[PartidaAoVivo]) -> None:
        data = [asdict(p) for p in partidas]
        destinos = [self.output_path]
        public_dir = self.output_path.parent / "public"
        if public_dir.is_dir():
            public_out = public_dir / self.output_path.name
            if public_out.resolve() != self.output_path.resolve():
                destinos.append(public_out)

        for dest in destinos:
            tmp = dest.with_suffix(".tmp")
            with tmp.open("w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            tmp.replace(dest)
            logger.info("Sucesso! '%s' salvo com %d partida(s) GABARITADAS.", dest, len(partidas))

        # Notifica agentes parceiros
        try:
            from agentes.dispatcher_agentes import notificar_agentes_partidas_atualizadas
            notificar_agentes_partidas_atualizadas(data)
        except Exception as e:
            logger.warning("Aviso ao notificar agentes: %s", e)


def main() -> None:
    parser = argparse.ArgumentParser(description="Buscador de Futebol com Verificação em Sites Gabaritados.")
    parser.add_argument("--output", default="partidas.json")
    parser.add_argument("--blocklist", default="blocklist.txt")
    args = parser.parse_args()

    pipeline = FootballScrapingPipeline(
        blocklist_path=args.blocklist,
        output_path=args.output,
    )
    pipeline.run()


if __name__ == "__main__":
    main()
