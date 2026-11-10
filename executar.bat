@echo off
chcp 65001 > nul
title Agente Buscador de Futebol Ao Vivo

echo ========================================================
echo   ⚽ INICIANDO AGENTE BUSCADOR DE FUTEBOL AO VIVO
echo ========================================================
echo.

if not exist .env (
    echo [AVISO] Arquivo .env não encontrado. Criando modelo...
    echo YOUTUBE_API_KEY=> .env
    echo GEMINI_API_KEY=> .env
)

echo [1/2] Verificando dependências Python...
python -m pip install -q -r requirements.txt

echo.
echo [2/2] Executando busca de transmissões ao vivo...
echo.
python search_live_football.py

echo.
echo ========================================================
echo   Processo concluído! Verifique o arquivo 'partidas.json'.
echo ========================================================
pause
