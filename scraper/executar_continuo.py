"""Executa o Agente Buscador em loop contínuo (Daemon).

Ideal para deixar rodando em segundo plano e manter o arquivo 'partidas.json'
sempre atualizado automaticamente a cada X minutos.
"""

import time
import sys
import logging
from search_live_football import main

INTERVALO_SEGUNDOS = 15 * 60  # 15 minutos

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Loop]: %(message)s",
    datefmt="%H:%M:%S",
)

if __name__ == "__main__":
    logging.info("Iniciando Agente em modo contínuo (intervalo de %d minutos)...", INTERVALO_SEGUNDOS // 60)
    while True:
        try:
            main()
        except KeyboardInterrupt:
            logging.info("Execução interrompida pelo usuário.")
            sys.exit(0)
        except Exception as e:
            logging.error("Ocorreu um erro na rodada: %s", e)
        
        logging.info("Aguardando próximo ciclo...")
        time.sleep(INTERVALO_SEGUNDOS)
