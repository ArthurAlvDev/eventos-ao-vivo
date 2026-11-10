"""Testes unitários e de integração para o Agente Buscador de Futebol Ao Vivo."""

import json
from pathlib import Path
from search_live_football import (
    BlocklistManager,
    FakeDetectorAndCategorizer,
    MatchItem,
)


def test_blocklist():
    test_file = Path("test_blocklist.txt")
    test_file.write_text("# Comentario\nUC123456789\n\nUC987654321\n", encoding="utf-8")
    
    manager = BlocklistManager(str(test_file))
    assert manager.is_blocked("UC123456789") is True
    assert manager.is_blocked("UC987654321") is True
    assert manager.is_blocked("UC000000000") is False
    
    test_file.unlink()
    print("✓ Teste de Blocklist passou com sucesso!")


def test_fake_detector_heuristics():
    detector = FakeDetectorAndCategorizer(gemini_api_key=None)
    
    # 1. Deve rejeitar simulações e games
    game_title = "AO VIVO: FLAMENGO X PALMEIRAS - EAFC 24 GAMEPLAY PS5"
    assert detector.fast_heuristic_reject(game_title, "Melhor jogo do ano") is not None
    
    pes_title = "LIVERPOOL VS REAL MADRID | PES 2021 SIMULAÇÃO MASTER LEAGUE"
    assert detector.fast_heuristic_reject(pes_title, "") is not None

    # 2. Deve rejeitar narrações sem imagem ou placar estático
    radio_title = "CORINTHIANS X SÃO PAULO AO VIVO COM IMAGENS? NÃO, NARRAÇÃO SEM IMAGENS"
    assert detector.fast_heuristic_reject(radio_title, "Acompanhe só o áudio e placar") is not None

    # 3. Não deve rejeitar jogo real de categorias inferiores ou base
    real_match_title = "CAMPEONATO PAULISTA SUB-20: SANTOS X SÃO PAULO - AO VIVO COM IMAGENS"
    assert detector.fast_heuristic_reject(real_match_title, "Transmissão oficial ao vivo") is None
    
    res = detector.fallback_heuristic_categorization(real_match_title, "Ao vivo")
    assert res["is_real_football"] is True
    assert res["categoria"] == "Sub-20"
    print("✓ Testes de heurística anti-fake e categorização passaram!")


def test_match_item_schema():
    item = MatchItem(
        id_video="abc123xyz",
        titulo="Paulistão Sub-15: Guarani x Ponte Preta",
        liga="Paulistão Sub-15",
        categoria="Sub-15",
        idioma="Português",
        permite_embed=True,
        link_direto="https://www.youtube.com/watch?v=abc123xyz"
    )
    from dataclasses import asdict
    data = asdict(item)
    expected_keys = {"id_video", "titulo", "liga", "categoria", "idioma", "permite_embed", "link_direto"}
    assert set(data.keys()) == expected_keys
    assert data["permite_embed"] is True
    print("✓ Teste do Schema JSON passou com sucesso!")


if __name__ == "__main__":
    test_blocklist()
    test_fake_detector_heuristics()
    test_match_item_schema()
    print("\nTodos os testes unitários passaram com 100% de sucesso!")
