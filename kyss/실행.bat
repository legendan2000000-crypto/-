@echo off
cd /d "%~dp0"
title KYSS Sales Dashboard

where node >nul 2>nul
if errorlevel 1 goto NONODE

if not exist ".env" goto MAKEENV
goto RUN

:MAKEENV
copy ".env.example" ".env" >nul
echo.
echo   Created the account file (.env).
echo   Notepad will open now.
echo   Type your KYSS ID and PW after the = signs,
echo   then press Ctrl+S to save and close Notepad.
echo.
pause
notepad ".env"
goto RUN

:RUN
echo.
echo   Starting server...  Do NOT close the new black window.
start "KYSS Server - do not close" cmd /k node server.mjs
timeout /t 3 >nul
start "" http://localhost:8787
echo.
echo   Browser is opening:  http://localhost:8787
echo   To stop later, just close the "KYSS Server" window.
echo.
timeout /t 5 >nul
exit /b

:NONODE
echo.
echo   [!] Node.js is NOT installed.
echo.
echo       1. Open  https://nodejs.org
echo       2. Click the green LTS button and install it
echo          (just keep clicking Next / Finish)
echo       3. Then double-click this file again
echo.
pause
exit /b
