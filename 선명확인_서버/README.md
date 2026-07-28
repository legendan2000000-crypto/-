# 선명확인 — 데이터 서버 (ship_search)

배차일보(물류허브)의 **선명확인** 탭에 실시간 선석(접안)스케줄을 공급하는 로컬 서버입니다.

## 왜 별도 서버가 필요한가

각 컨테이너 터미널 사이트는 **CORS 차단·EUC-KR 인코딩·CSRF 토큰·POST 폼·Nexacro/Playwright** 등이
섞여 있어 **브라우저(웹앱)에서 직접 조회가 불가능**합니다. 그래서 이 파이썬 서버가 사용자 PC에서
각 터미널을 대신 수집·병합해 `http://localhost:8737/api/schedule` 로 JSON을 제공하고,
배차일보 탭은 그 JSON을 30초마다 폴링합니다.

> HTTPS로 배포된 배차일보(Vercel 등)에서도 `http://localhost` 는 브라우저의 mixed-content 예외라 접속됩니다.
> 서버 응답에는 `Access-Control-Allow-Origin: *` 가 붙어 있어 어느 origin에서도 읽을 수 있습니다.

## 실행 방법

### A. 파이썬 (권장 — PNC 신항1까지 포함)
```bash
python -m pip install playwright        # PNC(신항1)용, 선택
python -m playwright install chromium   # 선택
python ship_search.py                   # → http://localhost:8737 자동 오픈
```
Windows에서는 `최초설치.bat`(최초 1회) → `실행.bat` 순으로 더블클릭해도 됩니다.

### B. exe (설치 불필요, PNC 제외 경량판)
원본 배포물의 `전국컨테이너_선박검색.exe` 를 더블클릭하면 검은 창이 뜨고 서버가 켜집니다.
(용량 문제로 저장소에는 exe를 넣지 않습니다. 아래로 재빌드하세요.)
```bash
python -m pip install pyinstaller
python -m PyInstaller --onefile --name "ShipSearch" \
  --exclude-module playwright --exclude-module greenlet --exclude-module pyee \
  --exclude-module numpy --exclude-module openpyxl --exclude-module PIL \
  ship_search.py
# → dist/ShipSearch.exe
```

**검은 창(서버)은 켜 둬야 합니다.** 닫으면 자동 갱신이 멈춥니다.

## 웹앱과 연결

1. 이 서버를 실행한다 (검은 창 유지).
2. 배차일보에서 **선명확인** 탭을 연다.
3. 자동으로 `http://localhost:8737` 에 연결된다.
   - 서버를 다른 주소/포트에서 돌린다면 탭의 **⚙ 서버** 버튼으로 주소를 바꾼다(브라우저에 저장됨).

## 배차일보 연동 로직

- 탭 표에서 **선사(선사 컬럼)** 가 배차일보의 선사(`line`)와 매칭되는 배는 `내 선사` 배지로 강조됩니다.
- **내 배차 선사만** 체크 시, 내 배차일보에 있는 선사가 운항하는 배만 필터링됩니다.
- 매칭은 대소문자·공백 무시 + 부분일치(양방향)로 느슨하게 잡습니다.

## 커버 범위 (2026-07 기준)

- **5개 항 · 13개 터미널** — 부산(PNIT·HJNC·HPNT·BNCT·DGT·BPT·PNC) · 평택(PCTC·PNCT) ·
  인천(iCON 통합) · 광양(GWCT·KITL) · 울산(UNCT).
- exe 경량판은 **PNC(신항1) 제외**. 울산 JUCT(정일)은 미완.
- 조회기간: 자동 `오늘-2 ~ 오늘+14`.

## 아키텍처 / 터미널 추가

`ship_search.py` 한 파일이 전체 소스입니다.

- `fetch_XXX()` 각 터미널 수집 함수 → 공통 dict 반환
  `{"터미널","선사","선명","선석","접안예정","출항예정","상태","모선항차","ROUTE"}`.
- `HTTP_TERMINALS` 리스트에 `(항, 표시명, fetch_XXX)` 추가하면 자동 반영.
- `refresher()` 백그라운드 스레드가 `REFRESH_SEC`(120초)마다 수집해 `_cache` 갱신.
- `Handler` 가 포트 8737에서 `/api/schedule` (병합 JSON)을 서빙 (CORS 허용).

> 개발환경 주의: 해외/샌드박스 IP에서는 일부 터미널이 403/000으로 막힐 수 있습니다(정상).
> 실제 한국 PC에서 실행하면 정상 수집됩니다.
