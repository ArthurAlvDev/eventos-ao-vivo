"""Despachante de Eventos Multi-Agente (Inter-Agent Communication Bus).

Acionado sempre que novas partidas ao vivo ou agendadas são catalogadas.
Notifica todos os outros agentes relacionados:
1. Agente de Alertas e Notificações (Telegram / Discord / WhatsApp)
2. Agente de Monitoramento de Qualidade de Stream
3. Agente de Mídias Sociais / Feed RSS / APIs Externas
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Dispatcher]: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("AgentDispatcher")


class AgentDispatcher:
    """Distribui atualizações de partidas para outros agentes conectados."""

    def __init__(self, config_path: str = "agentes_config.json"):
        self.config_path = Path(config_path)
        self.inbox_dir = Path("agentes/inbox")
        self.inbox_dir.mkdir(parents=True, exist_ok=True)
        self.config = self._carregar_config()

    def _carregar_config(self) -> Dict[str, Any]:
        if not self.config_path.exists():
            return {}
        try:
            with self.config_path.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error("Erro ao carregar agentes_config.json: %s", e)
            return {}

    def notificar_todos(self, partidas: List[Dict[str, Any]]) -> None:
        """Dispara evento de sincronização para todos os agentes registrados."""
        total = len(partidas)
        ao_vivo = sum(1 for p in partidas if p.get("status") == "ao_vivo")
        agendadas = total - ao_vivo

        payload = {
            "evento": "PARTIDAS_ATUALIZADAS",
            "timestamp": int(datetime.now().timestamp()),
            "data_hora": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "estatisticas": {
                "total": total,
                "ao_vivo": ao_vivo,
                "agendadas": agendadas,
            },
            "partidas": partidas,
        }

        logger.info(
            "🔔 Notificando agentes parceiros: %d partidas (%d ao vivo, %d agendadas)...",
            total,
            ao_vivo,
            agendadas,
        )

        # 1. Envia payload para a caixa de entrada dos agentes (File Queue)
        self._depositar_no_inbox(payload)

        # 2. Notifica agentes registrados na configuração
        agentes = self.config.get("agentes_habilitados", {})
        for nome_agente, dados in agentes.items():
            if not dados.get("ativo", True):
                continue

            tipo = dados.get("tipo")
            logger.info("👉 Acionando agente: '%s' (tipo: %s)", nome_agente, tipo)

            if tipo == "webhook" and dados.get("webhook_url"):
                self._disparar_webhook(dados["webhook_url"], payload)
            elif tipo == "script_local" and dados.get("comando"):
                self._executar_agente_local(dados["comando"])

        # 3. Registra no log de auditoria de eventos
        self._registrar_log_auditoria(payload)

    def _depositar_no_inbox(self, payload: Dict[str, Any]) -> None:
        """Grava o evento no inbox compartilhado para que qualquer agente possa ler."""
        evento_file = self.inbox_dir / "ultimo_evento_partidas.json"
        tmp_file = evento_file.with_suffix(".tmp")
        with tmp_file.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        tmp_file.replace(evento_file)

    def _disparar_webhook(self, url: str, payload: Dict[str, Any]) -> None:
        try:
            import requests
            resp = requests.post(url, json=payload, timeout=6)
            logger.info("Webhook enviado com sucesso (HTTP %d)", resp.status_code)
        except Exception as e:
            logger.warning("Falha ao entregar webhook para %s: %s", url, e)

    def _executar_agente_local(self, comando: str) -> None:
        try:
            # Executa agente em subprocesso desacoplado para não travar o scraper
            subprocess.Popen(
                comando,
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            logger.info("Script do agente '%s' disparado em background.", comando)
        except Exception as e:
            logger.warning("Erro ao disparar agente local: %s", e)

    def _registrar_log_auditoria(self, payload: Dict[str, Any]) -> None:
        log_file = Path("agentes/historico_disparos.log")
        with log_file.open("a", encoding="utf-8") as f:
            f.write(
                f"[{payload['data_hora']}] EVENTO DISPARADO: {payload['estatisticas']['total']} partidas "
                f"({payload['estatisticas']['ao_vivo']} ao vivo, {payload['estatisticas']['agendadas']} agendadas).\n"
            )


# Função auxiliar de chamada rápida
def notificar_agentes_partidas_atualizadas(partidas_dict: List[Dict[str, Any]]) -> None:
    dispatcher = AgentDispatcher()
    dispatcher.notificar_todos(partidas_dict)


if __name__ == "__main__":
    # Teste de execução direta
    partidas_file = Path("partidas.json")
    if partidas_file.exists():
        with partidas_file.open("r", encoding="utf-8") as f:
            dados = json.load(f)
            notificar_agentes_partidas_atualizadas(dados)
    else:
        print("Arquivo partidas.json não encontrado.")
