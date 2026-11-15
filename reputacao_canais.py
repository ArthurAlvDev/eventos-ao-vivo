"""Motor de Aprendizado e Classificação de Reputação de Canais.

Aprende continuamente com:
- Canais na lista VIP / Aprovação Direta (canais_monitorados.txt)
- Canais na Blocklist (blocklist.txt)
- Histórico de acertos vs infrações durante as varreduras

Identifica automaticamente novos canais que merecem entrar na Aprovação Direta (VIP)
ou na Blocklist, salvando o aprendizado em 'reputacao_canais.json' e 'sugestoes_canais.json'.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Set

logger = logging.getLogger("ReputacaoCanais")


class ClassificadorReputacaoCanais:
    """Aprende padrões de canais relevantes (VIP) vs canais bloqueáveis (Blocklist)."""

    PADROES_RELEVANTE_ESPORTE = re.compile(
        r"\b(?:tv|sports?|esportes?|futebol|futsal|oficial|confedera[cç][aã]o|federa[cç][aã]o|liga|paulist[aã]o|cbf|cbfs|fpf|lnf|uefa|conmebol|fifa)\b",
        re.IGNORECASE,
    )
    PADROES_BLOQUEAVEL = re.compile(
        r"\b(?:full\s*match|cortes|c@rtes|gaming|gamer|zod|sahil|shorya|yt$|score|news\s*sports|live\s*nepal|highlights)\b",
        re.IGNORECASE,
    )

    def __init__(
        self,
        reputacao_path: str = "reputacao_canais.json",
        sugestoes_path: str = "sugestoes_canais.json",
    ) -> None:
        self.reputacao_path = Path(reputacao_path)
        self.sugestoes_path = Path(sugestoes_path)
        self.dados: Dict[str, Dict[str, Any]] = self._carregar_json(self.reputacao_path, {})
        self.vips_conhecidos: Set[str] = set()
        self.bloqueados_conhecidos: Set[str] = set()

    def _carregar_json(self, path: Path, default: Any) -> Any:
        if path.exists():
            try:
                with path.open("r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return default
        return default

    def _chave_canal(self, canal_id: str, canal_nome: str) -> str:
        if canal_id and canal_id.strip():
            return canal_id.strip()
        return re.sub(r"\s+", " ", canal_nome.lower().strip())

    def sincronizar_listas_base(
        self,
        vips: List[str],
        bloqueados: Set[str],
    ) -> None:
        """Sincroniza com as listas explícitas do usuário para aprender o perfil de cada grupo."""
        self.vips_conhecidos = {v.lower().strip() for v in vips if v.strip()}
        self.bloqueados_conhecidos = {b.lower().strip() for b in bloqueados if b.strip()}

    def registrar_evento(
        self,
        canal_id: str,
        canal_nome: str,
        aprovado: bool,
        pontos_partida: int,
        motivo: str,
        flag_canal: str = "DESCONHECIDO",
        eh_pirataria_elite: bool = False,
        eh_infracao_grave: bool = False,
    ) -> None:
        """Registra o comportamento de um canal e recalcula seu score de reputação."""
        if not canal_nome:
            return

        chave = self._chave_canal(canal_id, canal_nome)
        agora = datetime.now().strftime("%Y-%m-%d %H:%M")

        registro = self.dados.get(
            chave,
            {
                "canal_id": canal_id,
                "nome": canal_nome,
                "flag_atual": flag_canal,
                "jogos_aprovados": 0,
                "rejeicoes": 0,
                "score_reputacao": 0,
                "motivos_recentes": [],
                "ultima_atualizacao": agora,
            },
        )

        registro["nome"] = canal_nome
        if flag_canal in ("VIP", "PADRAO", "BLOQUEADO"):
            registro["flag_atual"] = flag_canal
        registro["ultima_atualizacao"] = agora

        if aprovado and pontos_partida >= 80:
            registro["jogos_aprovados"] += 1
            bonus = 20
            if self.PADROES_RELEVANTE_ESPORTE.search(canal_nome):
                bonus += 10
            registro["score_reputacao"] += bonus
            registro["motivos_recentes"] = (
                [f"+{bonus} Jogo válido ({pontos_partida} pts)"] + registro["motivos_recentes"]
            )[:5]
        elif not aprovado:
            penalidade = 0
            if eh_pirataria_elite:
                penalidade = 60
            elif eh_infracao_grave or self.PADROES_BLOQUEAVEL.search(canal_nome):
                penalidade = 40
            elif pontos_partida <= -40:
                penalidade = 25

            if penalidade > 0:
                registro["rejeicoes"] += 1
                registro["score_reputacao"] -= penalidade
                registro["motivos_recentes"] = (
                    [f"-{penalidade} {motivo[:60]}"] + registro["motivos_recentes"]
                )[:5]

        self.dados[chave] = registro

    def deve_auto_bloquear(self, canal_id: str, canal_nome: str) -> bool:
        """Retorna True se o sistema já aprendeu com segurança que o canal é spam/pirata."""
        chave = self._chave_canal(canal_id, canal_nome)
        reg = self.dados.get(chave)
        if not reg:
            return False
        if reg.get("flag_atual") in ("VIP", "PADRAO"):
            return False
        return reg.get("score_reputacao", 0) <= -60

    def salvar_e_gerar_sugestoes(self) -> Dict[str, List[Dict[str, Any]]]:
        """Persiste o histórico aprendido e gera recomendações de VIP e Blocklist."""
        with self.reputacao_path.open("w", encoding="utf-8") as f:
            json.dump(self.dados, f, ensure_ascii=False, indent=2)

        candidatos_vip: List[Dict[str, Any]] = []
        candidatos_block: List[Dict[str, Any]] = []

        for chave, reg in self.dados.items():
            nome_low = reg["nome"].lower().strip()
            flag = reg.get("flag_atual", "DESCONHECIDO")
            score = reg.get("score_reputacao", 0)

            if flag in ("VIP", "BLOQUEADO") or nome_low in self.vips_conhecidos:
                continue

            if score >= 45 and reg.get("jogos_aprovados", 0) >= 2 and reg.get("rejeicoes", 0) == 0:
                candidatos_vip.append(
                    {
                        "canal": reg["nome"],
                        "canal_id": reg.get("canal_id", ""),
                        "score_reputacao": score,
                        "jogos_aprovados": reg["jogos_aprovados"],
                        "motivo": "Múltiplas transmissões legítimas de alta pontuação sem infrações",
                    }
                )
            elif score <= -40:
                candidatos_block.append(
                    {
                        "canal": reg["nome"],
                        "canal_id": reg.get("canal_id", ""),
                        "score_reputacao": score,
                        "rejeicoes": reg["rejeicoes"],
                        "motivo": " | ".join(reg.get("motivos_recentes", [])[:2]),
                    }
                )

        candidatos_vip.sort(key=lambda x: x["score_reputacao"], reverse=True)
        candidatos_block.sort(key=lambda x: x["score_reputacao"])

        sugestoes = {
            "atualizado_em": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "candidatos_aprovacao_direta_vip": candidatos_vip,
            "candidatos_blocklist": candidatos_block,
        }

        with self.sugestoes_path.open("w", encoding="utf-8") as f:
            json.dump(sugestoes, f, ensure_ascii=False, indent=2)

        if candidatos_vip:
            logger.info(
                "💡 Aprendizado: %d canal(is) sugerido(s) para Aprovação Direta (VIP) em 'sugestoes_canais.json': %s",
                len(candidatos_vip),
                ", ".join(c["canal"] for c in candidatos_vip[:5]),
            )
        if candidatos_block:
            logger.info(
                "🚫 Aprendizado: %d canal(is) com perfil de Blocklist identificados em 'sugestoes_canais.json'.",
                len(candidatos_block),
            )

        return sugestoes
