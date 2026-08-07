@echo off
cd /d "%~dp0"
title KYSS Sales Dashboard

where node >nul 2>nul
if errorlevel 1 goto NONODE
where curl >nul 2>nul
if errorlevel 1 goto NOCURL

set "RAW=https://raw.githubusercontent.com/legendan2000000-crypto/-/claude/site-api-analysis-73vz52/kyss"

echo   Getting the latest version...
curl -s -L -o "server.mjs"     "%RAW%/server.mjs"
curl -s -L -o "dashboard.html" "%RAW%/dashboard.html"

if not exist "server.mjs" goto DLFAIL
if not exist "dashboard.html" goto DLFAIL

if not exist ".env" goto MAKEENV
goto RUN

:MAKEENV
curl -s -L -o ".env" "%RAW%/.env.example"
echo.
echo   Notepad will open. Type your KYSS ID and PW after the = signs,
echo   then press Ctrl+S to save and close.
echo.
pause
notepad ".env"
goto RUN

:RUN
echo   Starting server...  Do NOT close the black "KYSS Server" window.
start "KYSS Server - do not close" cmd /k node server.mjs
timeout /t 3 >nul
start "" http://localhost:8787
echo.
echo   Done. Browser is opening:  http://localhost:8787
timeout /t 3 >nul
exit /b

:DLFAIL
echo.
echo   [!] Download failed. Check your internet connection and run again.
echo.
pause
exit /b

:NOCURL
echo.
echo   [!] This Windows is too old (no curl). Please update Windows 10/11.
echo.
pause
exit /b

:NONODE
echo.
echo   [!] Node.js is NOT installed.
echo       1. Open  https://nodejs.org   and install the green LTS version
echo       2. Then double-click this file again
echo.
pause
exit /b
