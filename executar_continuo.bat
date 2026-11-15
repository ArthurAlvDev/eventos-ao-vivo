@echo off
chcp 65001 > nul
title Agente Continuo de Futebol (Web Scraping - Zero Keys)

echo ===================================================================
echo   ⚽ AGENTE CONTÍNUO DE FUTEBOL AO VIVO ATIVO
echo   Status: Web Scraping - Zero Chaves de API
echo   Atualizando 'partidas.json' a cada 15 minutos em segundo plano.
echo   (Deixe esta janela minimizada)
echo ===================================================================
echo.

python executar_continuo.py
pause
