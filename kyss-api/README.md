# KYSS 전체 메뉴 · API 구조 맵

https://www.kyss.co.kr/ (국양로지텍 KYSS)의 전 메뉴/하위메뉴와 화면별 서버 API를 전수 조사한 결과.

## 조사 방법

1. **프론트 소스 전량 확보** — Vue SPA의 webpack 청크 1153개(18.8MB)를 `bundle/chunks/`로 다운로드.
   `main.js`의 청크 해시맵과 `chunk-common.js`의 `require.context` 맵을 파싱해
   `화면경로 → 청크파일` 대응을 복원.
2. **화면별 API 추출** — KYSS는 화면 폴더마다 `req2svr.js`(그 화면의 서버 호출 정의)를
   별도 청크로 분리해 둔다. 528개 전부에서 `함수명 → METHOD → 엔드포인트`를 파싱.
3. **메뉴 트리** — 로그인 세션에서 `POST /api/menuMap` 호출(181개 메뉴).
   `MENU_PATH`가 화면경로와 같아 1·2와 정확히 결합됨(146개 화면 메뉴 중 145개 매칭).

조회 계열 API만 호출했고 저장/삭제 API는 호출하지 않았다.

## 결과 문서

| 파일 | 내용 |
|---|---|
| `KYSS_전체맵.md` | **메뉴 트리 전체** + 각 메뉴 화면의 API 표 (주 산출물) |
| `KYSS_API_인덱스.md` | API 엔드포인트 1335개 전수 인덱스 + 사용 화면 역참조 |
| `KYSS_메뉴외화면.md` | 메뉴에 안 뜨는 화면 383개(팝업·비노출·타권한)와 그 API |
| `out/menu_api_lookup.json` | 메뉴명 → 화면경로 → API 목록 (기계 조회용) |
| `out/menu_tree.tsv` | 메뉴 트리 원본 (MENU_ID / 레벨 / 이름 / 화면경로) |
| `out/screen_api_calls.json` | 화면 528개 × 함수/메서드/엔드포인트 |
| `out/api_per_chunk.json` | 청크별 등장 엔드포인트 |
| `bundle/chunks/` | 프론트 소스 청크 원본 (추가 조사용, 18.8MB) |

## 규모

- 최상위 메뉴 6: TMS / CFS / 공통 기준정보 / 시스템 / 법제도이행관리 / 고객서비스관리
- 메뉴 181개 (그룹 포함), 화면 연결 메뉴 146개
- 화면 모듈 528개, API 엔드포인트 1335개, 호출 정의 1770개

## 주의

- `menuMap`은 **로그인 계정(안계문/국양로지텍(주))에 보이는 메뉴만** 반환한다.
  다른 권한 계정에는 더 많은 메뉴가 보일 수 있고, 그런 화면들도 소스에는 존재하므로
  `KYSS_메뉴외화면.md`에서 찾을 수 있다.
- 청크 해시는 KYSS 배포 시 바뀐다. 재조사 시 `main.js`부터 다시 받아야 한다.
- `db/containerInfo`(컨테이너 정보)만 `req2svr.js`가 없는 정적 화면.

## 재조사 방법

```bash
# 1) 최신 번들 해시 확인 후 bundle/ 재다운로드
# 2) menuMap은 KYSS 로그인된 브라우저 탭에서:
#    fetch('/api/menuMap',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
```
