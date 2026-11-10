@echo off
title Git Push Automatico - Eventos Ao Vivo
echo ========================================================
echo   Enviando alteracoes para o GitHub
echo ========================================================
echo.

git add .
git commit -m "feat(devops): infraestrutura de CI/CD e automacao via telegram"
git branch -M main
git push origin main

echo.
echo ========================================================
echo   Concluido! Repositorio atualizado no GitHub.
echo ========================================================
pause
