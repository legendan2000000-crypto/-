@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 전국 컨테이너 선박검색 (닫지 마세요)
python ship_search.py
if errorlevel 1 (
  echo.
  echo ============================================================
  echo  [문제 발생] 파이썬 실행에 실패했습니다.
  echo   1) 파이썬이 설치돼 있나요?  명령창에서  python --version
  echo      없다면 https://www.python.org 에서 설치
  echo      (설치 화면에서 "Add python.exe to PATH" 반드시 체크)
  echo   2) 처음 쓰는 PC라면 "최초설치.bat"을 한 번 실행하세요.
  echo ============================================================
  pause
)
