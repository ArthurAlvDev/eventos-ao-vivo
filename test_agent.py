"""Testes de integridade do modelo e scraping."""

import json
from pathlib import Path
from search_live_football import PartidaAoVivo, DetectorAntiFake, BlocklistManager


def testar_modelo_e_json():
    p = PartidaAoVivo(
        id_video="test1234",
        titulo="Paulistão Sub-20: Santos x São Paulo - Ao Vivo",
        canal="Paulistão Oficial",
        liga="Paulistão Sub-20",
        categoria="Sub-20",
        idioma="Português",
        status="ao_vivo",
        horario="AO VIVO",
        timestamp_inicio=1731250000,
        thumbnail="https://example.com/thumb.jpg",
        permite_embed=True,
        link_direto="https://www.youtube.com/watch?v=test1234"
    )
    from dataclasses import asdict
    d = asdict(p)
    assert d["status"] == "ao_vivo"
    assert d["horario"] == "AO VIVO"
    assert d["permite_embed"] is True
    print("✓ Modelo de dados testado com sucesso!")


def testar_detector_fakes():
    d = DetectorAntiFake()
    
    # 1. Rejeita simuladores
    res1 = d.analisar("JOGO COMPLETO EAFC 24 FLAMENGO X PALMEIRAS", "Gameplay Channel", "Jogo ps5")
    assert res1["real"] is False
    
    # 2. Rejeita rádio
    res2 = d.analisar("CORINTHIANS X SANTOS AO VIVO - NARRAÇÃO SEM IMAGENS", "Radio Web", "Somente áudio")
    assert res2["real"] is False

    # 3. Aceita jogo de categoria de base
    res3 = d.analisar("CAMPEONATO CEARENSE SUB-20: CEARÁ X FERROVIÁRIO", "FCF TV", "Transmissão ao vivo oficial")
    assert res3["real"] is True
    assert res3["categoria"] == "Sub-20"
    print("✓ Detector anti-fake testado com sucesso!")


if __name__ == "__main__":
    testar_modelo_e_json()
    testar_detector_fakes()
    print("\nTodos os testes passaram!")
