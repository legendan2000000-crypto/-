# KYSS 영업 대시보드

국양로지텍 **KYSS**(`www.kyss.co.kr`) API를 이용해, **영업사원을 선택하면 그 사원의 실적·통계**를 보여주는 로컬 대시보드입니다.
로그인은 `.env` 계정으로 처리하고, 로컬 서버가 KYSS를 대신 호출하므로 **CORS 문제가 없습니다.**

> ⚠️ **조회(select) API만** 호출합니다. 저장/삭제 같은 쓰기 API는 절대 부르지 않습니다.
> 실서버·실데이터이므로 대량 반복 호출은 피하세요.

---

## 1. 준비 (한 번만)

Node.js 18 이상이면 됩니다. **설치할 패키지 없음**(내장 모듈만 사용).

```bash
cd kyss
cp .env.example .env
# .env 를 열어 KYSS_ID / KYSS_PW 를 채우세요
```

`.env`는 `.gitignore`에 등록돼 있어 커밋되지 않습니다.

## 2. 실행

```bash
node server.mjs
```

콘솔에 `http://localhost:8787` 이 뜨면 브라우저로 접속하세요.

1. 상단 상태 배지가 **로그인됨**으로 바뀌는지 확인
2. **영업사원** 드롭다운에서 대상 선택 (20명+ 목록이 로그인 후 자동 로딩)
3. **연도** 선택 후 **조회**
4. KPI 카드 · 월별 매출/이익 차트 · 업체별 · 미수 현황 표시

---

## 3. 첫 실행 시 "진단" 패널을 꼭 보세요

이 도구는 문서에 **완전히 검증된 엔드포인트가 1개**(`selectPointByPFMStList`)뿐이라,
나머지(로그인 필드명, 영업사원 목록, 사원별 실적 조회)는 **가장 유력한 후보로 호출**하도록 만들어졌습니다.

화면 맨 아래 **진단 패널**에 각 API의 실제 응답(상태·건수·샘플 필드)이 그대로 표시됩니다.
첫 실행 결과의 진단 내용을 알려주시면, 실제 필드명에 맞춰 **정확히 고정**해 드립니다.

특히 확인이 필요한 지점:
- **로그인 요청 필드명** — 안 맞으면 `.env`의 `KYSS_LOGIN_ID_FIELD`/`KYSS_LOGIN_PW_FIELD`로 지정 (예: `USER_ID`/`PASSWORD`)
- **영업사원 목록 엔드포인트** — `picList` / `code/selectUserCode` / `cms/popup/selectCommonPopupPic` 중 실제로 되는 것
- **사원별 실적 SEARCH 파라미터** — `OP_PIC` 필터가 먹는지, 월/금액 필드명

---

## 4. 스키마 발굴용 임의 조회 (개발자용)

로그인된 상태에서 아무 조회 API나 직접 찔러 응답 구조를 볼 수 있습니다:

```
http://localhost:8787/api/raw?path=outputs/statssales/selectManSalesList&search={"OP_PIC":"legendan200","DATE_FM":"2026-01-01","DATE_TO":"2026-12-01"}
```

- `path` : `/api/` 이하 경로
- `search` : `SEARCH`에 넣을 JSON (URL 인코딩)

응답의 `data`, `listCount`, 필드 이름을 보고 다른 화면도 붙일 수 있습니다.

---

## 5. 구조

| 파일 | 역할 |
|---|---|
| `server.mjs` | 제로 설치 Node 서버. 로그인·쿠키 유지·KYSS 프록시·집계 |
| `dashboard.html` | 대시보드 화면 (드롭다운/KPI/차트/표, 외부 라이브러리 없음) |
| `.env` | 계정정보 (커밋 안 됨) |
| `.env.example` | 설정 예시 |

### 지금 붙어 있는 API (영업사원 관점)

| 화면 | 엔드포인트 | 상태 |
|---|---|---|
| 내 월별 매출 | `outputs/statssales/selectManSalesList` | 후보 |
| 내 월별 실적 | `outputs/statssales/selectManOutsList` | 후보 |
| 업체별 | `outputs/statssales/selectMonCorpSalesList` | 후보 |
| 청구처별 미수 | `outputs/statssales/selectCorpUnpaidList` | 후보 |
| 오더 접수현황 | `outputs/management/selectOrdersList` | 후보 |
| 점소별 영업이익 | `outputs/statssales/selectPointByPFMStList` | ✅ 문서 검증됨 |

"후보"는 첫 실행 진단으로 확정 후 고정 예정입니다.

---

## 6. 다음에 추가할 수 있는 것
- 전년 동월 대비(YoY) 카드 — 이미 서버가 전년 범위를 함께 조회하도록 준비돼 있음
- 영업사원 간 순위 비교(`opPicPFMSt` 계열)
- 엑셀(xlsx) 내보내기
- 특정 거래처 상세 드릴다운
