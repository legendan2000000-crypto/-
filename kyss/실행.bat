@echo off
chcp 65001 >nul
cd /d "%~dp0"
title KYSS 영업 대시보드

echo.
echo  ===== KYSS 영업 대시보드 =====
echo.

rem --- Node.js 설치 여부 확인 ---
where node >nul 2>nul
if errorlevel 1 (
  echo  [!] Node.js 가 설치되어 있지 않습니다.
  echo.
  echo      1) https://nodejs.org  접속
  echo      2) 왼쪽의 "LTS" 초록 버튼을 눌러 다운로드
  echo      3) 받은 파일 실행 후 "다음/Next" 만 계속 눌러 설치
  echo      4) 설치가 끝나면 이 파일(실행.bat)을 다시 더블클릭
  echo.
  pause
  exit /b
)

rem --- 계정 파일(.env) 준비 ---
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo  [i] 계정 입력 파일(.env) 을 새로 만들었습니다.
  echo      곧 메모장이 열립니다. KYSS_ID 와 KYSS_PW 에
  echo      아이디/비밀번호를 적고 저장(Ctrl+S) 후 창을 닫으세요.
  echo.
  pause
  notepad ".env"
)

rem --- 서버 시작 + 브라우저 열기 ---
echo  서버를 시작합니다. (새로 뜨는 검은 창은 닫지 마세요)
start "KYSS 서버 - 닫지 마세요" cmd /k node server.mjs
timeout /t 3 >nul
start "" http://localhost:8787

echo.
echo  브라우저가 열렸습니다.  주소: http://localhost:8787
echo  끝낼 때는 "KYSS 서버" 라고 적힌 검은 창을 닫으면 됩니다.
echo.
timeout /t 4 >nul
