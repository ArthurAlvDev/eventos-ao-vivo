@echo off
chcp 65001 > nul
title Abrir Jogos Ao Vivo no Google Chrome

set EXTENSION_DIR=%~dp0extensao

:: Procurar o executável do Google Chrome
set CHROME_PATH=
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not defined CHROME_PATH (
    if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME_PATH (
    if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_PATH (
    echo [ERRO] Google Chrome não foi localizado nos caminhos padrão.
    pause
    exit /b 1
)

echo Iniciando o Google Chrome com a Extensão de Jogos Ao Vivo carregada...
start "" "%CHROME_PATH%" --load-extension="%EXTENSION_DIR%" "chrome://extensions"

exit /b 0
