"""Gera um 'partidas.json' instantaneamente para testes e validação da estrutura."""

import json
from pathlib import Path

amostras = [
    {
        "id_video": "v_sp_sub20_01",
        "titulo": "Campeonato Paulista Sub-20: Santos x Palmeiras - AO VIVO",
        "liga": "Campeonato Paulista Sub-20",
        "categoria": "Sub-20",
        "idioma": "Português",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_sp_sub20_01"
    },
    {
        "id_video": "v_copa_rs_02",
        "titulo": "Copa FGF Sub-17: Caxias x Brasil de Farroupilha - Transmissão Oficial",
        "liga": "Copa FGF Sub-17",
        "categoria": "Sub-17",
        "idioma": "Português",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_copa_rs_02"
    },
    {
        "id_video": "v_fem_brasil_03",
        "titulo": "Brasileirão Feminino A2: Fortaleza x Minas Brasília - Ao Vivo",
        "liga": "Brasileirão Feminino A2",
        "categoria": "Feminino",
        "idioma": "Português",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_fem_brasil_03"
    },
    {
        "id_video": "v_varzea_sp_04",
        "titulo": "Copa da Paz de Paraisópolis: Pioneer x Napoli - Futebol de Várzea",
        "liga": "Copa da Paz de Paraisópolis",
        "categoria": "Várzea/Amador",
        "idioma": "Português",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_varzea_sp_04"
    },
    {
        "id_video": "v_liga_escocesa_05",
        "titulo": "Scottish League One: Falkirk vs Kelty Hearts - Live Stream",
        "liga": "Scottish League One",
        "categoria": "Ligas Menores",
        "idioma": "Inglês",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_liga_escocesa_05"
    }
]

Path("partidas.json").write_text(
    json.dumps(amostras, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

print("✓ 'partidas.json' de demonstração gerado com 5 partidas categorizadas!")
