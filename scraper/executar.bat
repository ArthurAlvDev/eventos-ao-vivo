@echo off
chcp 65001 > nul
title Agente Buscador de Futebol Ao Vivo (Web Scraping - Zero Keys)

echo ===================================================================
echo   ⚽ AGENTE BUSCADOR DE FUTEBOL AO VIVO NO YOUTUBE (WEB SCRAPING)
echo   Status: 100%% LIVRE DE CHAVES DE API (Sem YouTube API, Sem Gemini)
echo ===================================================================
echo.

echo [1/2] Verificando biblioteca 'requests'...
python -m pip install -q -r requirements.txt

echo.
echo [2/2] Buscando partidas reais ao vivo no YouTube...
echo.
python search_live_football.py

echo.
echo ===================================================================
echo   Processo concluído! Verifique o arquivo 'partidas.json'.
echo ===================================================================
pause
