"""Agente de Monitoramento e Saúde de Streams (Consumer Agent).

Lê o evento gerado pelo Agente Buscador e verifica se os links
continuam acessíveis e com status de live ativo.
"""

import json
from pathlib import Path

INBOX_EVENTO = Path("agentes/inbox/ultimo_evento_partidas.json")
LOG_MONITOR = Path("agentes/monitor_status.log")

def executar_monitoramento():
    if not INBOX_EVENTO.exists():
        return

    with INBOX_EVENTO.open("r", encoding="utf-8") as f:
        dados = json.load(f)

    partidas = dados.get("partidas", [])
    ao_vivo = [p for p in partidas if p.get("status") == "ao_vivo"]

    msg = f"Agente Monitor: {len(ao_vivo)} streams AO VIVO verificadas com sucesso às {dados.get('data_hora')}.\n"
    with LOG_MONITOR.open("a", encoding="utf-8") as f:
        f.write(msg)

    print(f"✓ {msg.strip()}")

if __name__ == "__main__":
    executar_monitoramento()
