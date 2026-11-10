@echo off
chcp 65001 > nul
title Agente Buscador Continuo (Daemon)

echo ========================================================
echo   ⚽ AGENTE CONTÍNUO DE FUTEBOL AO VIVO ATIVO
echo   Atualizando 'partidas.json' a cada 15 minutos.
echo   (Deixe esta janela aberta minimizada)
echo ========================================================
echo.

python executar_continuo.py
pause
