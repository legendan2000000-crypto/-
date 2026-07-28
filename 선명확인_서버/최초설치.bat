@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 전국 컨테이너 선박검색 - 최초 설치
echo ================================================================
echo   전국 컨테이너 선박검색 - 최초 설치 (새 PC에서 딱 1번만)
echo ================================================================
echo.

echo [확인] 파이썬 버전...
python --version
if errorlevel 1 (
  echo.
  echo  [!] 파이썬이 없습니다. 먼저 https://www.python.org 에서 설치하세요.
  echo      설치 화면에서 "Add python.exe to PATH" 를 반드시 체크하세요.
  echo      설치 후 이 파일(최초설치.bat)을 다시 실행하세요.
  pause
  exit /b
)
echo.

echo [1/2] Playwright 설치 중... (PNC 신항1부두 조회에 필요)
python -m pip install --upgrade pip
python -m pip install playwright
echo.

echo [2/2] 브라우저(Chromium) 내려받는 중... (약 150MB, 몇 분 걸립니다)
python -m playwright install chromium
echo.

echo ================================================================
echo   설치 완료! 이제 "실행.bat" 을 더블클릭해서 사용하세요.
echo   (Playwright 설치를 건너뛰어도 PNC 빼고 나머지 전 터미널은 됩니다.)
echo ================================================================
pause
