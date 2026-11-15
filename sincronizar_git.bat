@echo off
title Git Push Automatico - Eventos Ao Vivo
echo ========================================================
echo   Enviando alteracoes para o GitHub
echo ========================================================
echo.

git add -A
git commit -m "feat: atualizacao do buscador de futebol e partidas"
git branch -M main
git push -u origin main

echo.
echo ========================================================
echo   Concluido! Repositorio atualizado no GitHub.
echo ========================================================
pause
