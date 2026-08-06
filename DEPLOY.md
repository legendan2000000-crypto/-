# 배포 가이드 (배차일보)

## 먼저: 데이터(개인정보)와 배포의 관계

`app/data.js`에는 **실제 화주·연락처·금액**이 들어갑니다. 그래서 이 파일은
`.gitignore`에 있고 **깃(리포)에 올라가지 않습니다.**

즉, **Git 자동배포(Vercel·GitHub Pages)에는 데이터가 안 실립니다.**
데이터를 넣으려면 아래 중 하나를 골라야 합니다.

| 방법 | 데이터 포함 | 공개 범위 | 만료 | 추천 |
|---|---|---|---|---|
| **① claude.ai 비공개 아티팩트** | O | 본인만 | 없음 | ★ 지금 바로 |
| **② Vercel + 비공개 리포 + 접근암호** | O(리포에 data.js 커밋 필요) | 암호 아는 사람 | 없음 | 팀 공유용 |
| **③ GitHub Pages** | △ | **공개** | 없음 | 개인정보엔 부적합 |

> GitHub Pages는 비공개 리포라도 페이지 자체는 **공개 URL**입니다.
> 실데이터엔 쓰지 마세요.

---

## ① claude.ai 비공개 아티팩트 (지금 사용 중, 권장)

이미 게시돼 있습니다. 만료 없음, 본인만 접근, 입력값은 브라우저에 저장됩니다.
데이터가 이미 claude.ai 세션에 있으므로 추가 노출이 없습니다.

- 갱신: 이 대화에서 `app/index.html` 수정 → 다시 게시하면 **같은 링크** 유지.
- 아티팩트 본문은 `python3 tools/build_artifact.py` 로 만들어집니다
  (문서 래퍼 제거 + `data.js` 인라인, PDF 판독기는 제외).

## ② Vercel (팀에 공유하고 싶을 때)

정적 앱이라 빌드가 없습니다. `app/` 폴더만 올리면 됩니다.

1. 데이터를 포함하려면 `data.js`가 있는 **로컬**에서 CLI로 올립니다
   (리포에 data.js를 커밋하지 않아도 됨):
   ```bash
   npm i -g vercel
   cd app
   vercel            # 최초 1회 로그인·프로젝트 생성
   vercel --prod     # 이후 배포
   ```
2. **접근 보호**: Vercel 프로젝트 → Settings → Deployment Protection →
   Password/Vercel Authentication 켜기 (개인정보 보호 필수).
3. `vercel.json`은 이 리포에 포함돼 있어 `app/`을 정적 서빙합니다.

> 리포 연동(Git 자동배포)로 하려면 `data.js`를 커밋해야 하는데, 그럴 경우
> **반드시 비공개 리포 + Deployment Protection**을 함께 쓰세요.

## ③ GitHub Pages (비권장 — 공개)

개인정보가 없는 데모용으로만. 리포 Settings → Pages → Source를 `app/`
(또는 Actions)으로 지정. 데이터를 넣으려면 `data.js`를 커밋해야 하고
그 순간 **공개**됩니다. 실데이터엔 쓰지 마세요.

---

## 파일 구조

- `app/index.html` — 앱 본체(단일 파일, 오프라인 동작)
- `app/data.js` — 데이터(gitignore, 배포 시 직접 제공)
- `tools/extract_dispatch.py` — 엑셀/원장 → `data.js` 생성
- `tools/build_artifact.py` — claude.ai 아티팩트 본문 생성
