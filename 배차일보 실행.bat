@echo off
title 배차일보 실행
cd /d "%~dp0"
echo ==================================================
echo     물류허브  ( 배차일보 / 내륙운송견적 / 선명확인 )
echo ==================================================
echo.
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY where python >nul 2>nul && set "PY=python"

if defined PY (
  echo [1/2] 선명확인 데이터 서버를 시작합니다...  ^(%PY%^)
  start "선명확인 데이터 서버 - 닫지 마세요" %PY% "선명확인_서버\ship_search.py" --server-only
  echo       검은 창이 새로 뜹니다. 선명확인 탭을 쓰는 동안 켜 두세요.
) else (
  echo [1/2] 파이썬이 없어 데이터 서버를 건너뜁니다.
  echo       선명확인 탭 데이터를 보려면 python.org 에서 파이썬 설치 후
  echo       선명확인_서버\최초설치.bat 을 한 번 실행하세요.
)
echo.
echo [2/2] 물류허브를 브라우저로 엽니다...
timeout /t 2 >nul
start "" "index.html"
echo.
echo 열렸습니다. 이 검은 창은 닫아도 됩니다.
echo (선명확인을 쓰려면 '데이터 서버' 검은 창만 켜 두세요.)
timeout /t 5 >nul
