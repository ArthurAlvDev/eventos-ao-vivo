"""Gera amostras de campeonatos diversos do mundo todo (Ao Vivo e Agendados)."""

import json
from pathlib import Path

amostras = [
    {
        "id_video": "v_sp_sub20_01",
        "titulo": "Campeonato Paulista Sub-20: Santos x Palmeiras - Final",
        "canal": "Paulistão Oficial",
        "liga": "Campeonato Paulista Sub-20",
        "categoria": "Sub-20",
        "idioma": "Português",
        "status": "ao_vivo",
        "horario": "AO VIVO",
        "timestamp_inicio": 1731250000,
        "thumbnail": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_sp_sub20_01"
    },
    {
        "id_video": "v_copa_rs_02",
        "titulo": "Copa FGF: Caxias x Brasil de Farroupilha - Ao Vivo",
        "canal": "FGF TV",
        "liga": "Copa FGF",
        "categoria": "Ligas Menores",
        "idioma": "Português",
        "status": "ao_vivo",
        "horario": "AO VIVO",
        "timestamp_inicio": 1731251000,
        "thumbnail": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_copa_rs_02"
    },
    {
        "id_video": "v_liga_arg_03",
        "titulo": "Primera B Nacional: Chacarita Juniors vs All Boys - En Vivo",
        "canal": "AFA Play Oficial",
        "liga": "Primera B Nacional",
        "categoria": "Ligas Menores",
        "idioma": "Espanhol",
        "status": "ao_vivo",
        "horario": "AO VIVO",
        "timestamp_inicio": 1731252000,
        "thumbnail": "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_liga_arg_03"
    },
    {
        "id_video": "v_fem_brasil_04",
        "titulo": "Brasileirão Feminino: Fortaleza x Minas Brasília - Semifinal",
        "canal": "CBF TV",
        "liga": "Brasileirão Feminino",
        "categoria": "Feminino",
        "idioma": "Português",
        "status": "agendado",
        "horario": "Hoje às 15:00",
        "timestamp_inicio": 1731261600,
        "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_fem_brasil_04"
    },
    {
        "id_video": "v_varzea_sp_05",
        "titulo": "Copa da Paz de Paraisópolis: Pioneer x Napoli - Futebol Amador",
        "canal": "Várzea Ao Vivo TV",
        "liga": "Copa da Paz de Paraisópolis",
        "categoria": "Várzea/Amador",
        "idioma": "Português",
        "status": "agendado",
        "horario": "Hoje às 16:30",
        "timestamp_inicio": 1731267000,
        "thumbnail": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_varzea_sp_05"
    },
    {
        "id_video": "v_usl_06",
        "titulo": "USL Championship: Tampa Bay Rowdies vs Phoenix Rising - Live",
        "canal": "USL Official",
        "liga": "USL Championship",
        "categoria": "Profissional",
        "idioma": "Inglês",
        "status": "agendado",
        "horario": "Hoje às 19:30",
        "timestamp_inicio": 1731277800,
        "thumbnail": "https://images.unsplash.com/photo-1489944445391-11dd35574549?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_usl_06"
    },
    {
        "id_video": "v_liga_escocesa_07",
        "titulo": "Scottish League One: Falkirk vs Kelty Hearts - Matchday Live",
        "canal": "SPFL Matchday Live",
        "liga": "Scottish League One",
        "categoria": "Ligas Menores",
        "idioma": "Inglês",
        "status": "agendado",
        "horario": "Hoje às 19:45",
        "timestamp_inicio": 1731278700,
        "thumbnail": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_liga_escocesa_07"
    },
    {
        "id_video": "v_polonia_08",
        "titulo": "Polish II Liga: Kotwica Kołobrzeg vs Stomil Olsztyn - Na Żywo",
        "canal": "Łączy Nas Piłka TV",
        "liga": "Polish II Liga",
        "categoria": "Ligas Menores",
        "idioma": "Polonês",
        "status": "agendado",
        "horario": "Amanhã às 11:00",
        "timestamp_inicio": 1731333600,
        "thumbnail": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60",
        "permite_embed": True,
        "link_direto": "https://www.youtube.com/watch?v=v_polonia_08"
    }
]

Path("partidas.json").write_text(
    json.dumps(amostras, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

print("✓ 'partidas.json' atualizado com campeonatos globais!")
