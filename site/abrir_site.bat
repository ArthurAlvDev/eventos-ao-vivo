@echo off
chcp 65001 > nul
title Radar da Bola - Servidor Web

echo ===================================================================
echo   ⚽ INICIANDO SITE DO RADAR DA BOLA
echo   Acessível em: http://localhost:8000
echo ===================================================================
echo.

echo Abrindo o navegador...
start http://localhost:8000

echo.
echo Servidor ativo. Mantenha esta janela aberta para navegar no site.
echo Pressione Ctrl + C para encerrar o servidor.
echo.

python -m http.server 8000
pause
