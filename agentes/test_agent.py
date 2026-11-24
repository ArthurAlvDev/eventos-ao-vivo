"""Testes de integridade do modelo, crivo de pontuação e regras anti-fake."""

from dataclasses import asdict
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scraper"))

from search_live_football import PartidaAoVivo, SistemaPontuacaoPartida, BlocklistManager


def testar_modelo_e_json():
    p = PartidaAoVivo(
        id_video="test1234",
        titulo="Paulistão Sub-20: Santos x São Paulo - Ao Vivo",
        canal="Paulistão Oficial",
        liga="Paulistão Sub-20",
        modalidade="Futebol de Campo",
        categoria="Sub-20",
        idioma="Português",
        status="ao_vivo",
        horario="AO VIVO",
        timestamp_inicio=1731250000,
        thumbnail="https://example.com/thumb.jpg",
        permite_embed=True,
        link_direto="https://www.youtube.com/watch?v=test1234",
        pontuacao=100,
        classificacao="JOGO",
        verificado_gabaritado=True,
        fonte_confirmacao="Canal Oficial",
        flag_canal="VIP",
    )
    d = asdict(p)
    assert d["status"] == "ao_vivo"
    assert d["modalidade"] == "Futebol de Campo"
    assert d["permite_embed"] is True
    print("✓ Modelo de dados testado com sucesso!")


def testar_sistema_pontuacao():
    s = SistemaPontuacaoPartida()

    # 1. Rejeita simuladores
    _, _, d1 = s.calcular_pontuacao("JOGO COMPLETO EAFC 24 FLAMENGO X PALMEIRAS", "Gameplay Channel", "Jogo ps5")
    assert d1["classificacao"] != "JOGO"

    # 2. Rejeita rádio / placar / live score update
    _, _, d2 = s.calcular_pontuacao("CORINTHIANS X SANTOS AO VIVO - NARRAÇÃO SEM IMAGENS", "Radio Web", "Somente áudio")
    assert d2["classificacao"] != "JOGO"

    _, _, d3 = s.calcular_pontuacao("Congo vs Central Africa | International Friendly | Live Score Update", "Sports Updates", "")
    assert d3["classificacao"] != "JOGO"

    # 3. Rejeita talk show / debate mesmo com times no título
    _, _, d4 = s.calcular_pontuacao(
        "AO VIVO: QUAL É A FORMAÇÃO IDEAL DA SELEÇÃO? GIGANTE EUROPEU DEMITE TREINADOR; ITÁLIA X FRANÇA E +",
        "TNT Sports Brasil",
        "",
    )
    assert d4["classificacao"] != "JOGO"

    # 4. Rejeita pirataria de jogo de seleção em canal não oficial
    _, _, d5 = s.calcular_pontuacao(
        "SINGAPUR vs BRASIL [EN VIVO] - AMISTOSO INTERNACIONAL",
        "Deportes Al Taco",
        "",
    )
    assert d5["classificacao"] != "JOGO"

    # 5. Aceita jogo de categoria de base em federação oficial
    _, _, d6 = s.calcular_pontuacao(
        "CAMPEONATO CEARENSE SUB-20: CEARÁ X FERROVIÁRIO",
        "FCF TV",
        "Transmissão ao vivo oficial",
    )
    assert d6["classificacao"] == "JOGO"
    assert d6["categoria"] == "Sub-20"
    assert d6["modalidade"] == "Futebol de Campo"

    # 6. Separa Futsal corretamente
    _, _, d7 = s.calcular_pontuacao(
        "Taça Brasil Sub 11 | Guritibanos x AFC Moto Clube | Ao Vivo",
        "Confederação Brasileira de Futebol de Salão (CBFS)",
        "Futsal ao vivo",
    )
    assert d7["classificacao"] == "JOGO"
    assert d7["modalidade"] == "Futsal"

    print("✓ Sistema de pontuação e anti-fake testados com sucesso!")


if __name__ == "__main__":
    testar_modelo_e_json()
    testar_sistema_pontuacao()
    print("\nTodos os testes passaram!")
