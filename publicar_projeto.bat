@echo off
title Publicador Automatico - GitHub e Vercel
color 0A
echo ================================================================
echo         PUBLICADOR AUTOMATICO: GITHUB + VERCEL
echo ================================================================
echo.
echo Passos que serao realizados:
echo   1. Abrir a pagina do GitHub para criar o repositorio 'eventos-ao-vivo'
echo   2. Enviar todos os arquivos (partidas, site, CI/CD) para o GitHub
echo   3. Abrir a Vercel para publicar o site online em 1 clique
echo.
echo ================================================================
echo.
echo [1/3] Abrindo o GitHub para criar o repositorio vazio...
start https://github.com/new?name=eventos-ao-vivo
echo.
echo Crie o repositorio no GitHub (basta clicar no botao verde 'Create repository').
echo.
pause
echo.
echo [2/3] Enviando arquivos para o GitHub...
git branch -M main
git push -u origin main
echo.
if %errorlevel% neq 0 (
    echo [AVISO] Se o Git pediu login, confirme a janela do GitHub no seu navegador.
    echo Tentando novamente...
    git push -u origin main
)
echo.
echo ================================================================
echo [3/3] Sucesso! Codigo enviado para o GitHub.
echo Abrindo a Vercel para o Deploy final...
echo ================================================================
start https://vercel.com/new/import?s=https://github.com/ArthurAlvDev/eventos-ao-vivo
echo.
echo Na pagina da Vercel que abriu, basta clicar em 'Deploy'.
echo.
pause
