@echo off
title Bot Telegram - Eventos Ao Vivo
echo ========================================================
echo   Iniciando Bot do Telegram (Zero Dependencias)
echo ========================================================
echo.

if not exist "bot\.env" (
    echo [AVISO] O arquivo 'bot\.env' nao foi encontrado!
    echo Criando a partir de 'bot\.env.example'...
    copy "bot\.env.example" "bot\.env"
    echo.
    echo Por favor, abra o arquivo 'bot\.env' e preencha suas chaves:
    echo   - TELEGRAM_BOT_TOKEN
    echo   - GITHUB_OWNER
    echo   - GITHUB_REPO
    echo   - GITHUB_TOKEN
    echo.
    notepad "bot\.env"
    pause
    exit /b
)

cd bot
node index.js
pause
