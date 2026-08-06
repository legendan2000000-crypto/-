# 국양로지텍 배차 알림앱 (MVP) — 셋업 가이드

**무엇**: 사무실에서 배차하면 → **해당 기사 폰에 푸시 알림 + 배차 내용**이 가는 설치형 웹앱(PWA).
앱스토어 없이 **링크로 설치**. 선배차(서류 준비중)도 알림 표시.

- 로그인: **전화번호 + PIN** (관리자가 발급)
- 관리자 모드: 배차 입력 → 차량 선택 → 확정/선배차 → 보내기(알림 발송)
- 기사 모드: 알림 허용 1회 → **본인 배차만** 실시간 목록 + 새 배차 푸시

---

## 준비물
- 회사 **구글 계정** (Firebase 프로젝트 소유)
- PC에 **Node.js 18+** 설치
- 결제카드 1장 (Functions용 Blaze 요금제 — **소규모는 사실상 무료**, 아래 8번 참고)

---

## 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com → **프로젝트 추가** → 이름(예: `kukyang-dispatch`)
2. 좌측 **빌드 > Authentication > 시작하기 > 이메일/비밀번호 > 사용 설정**
3. **빌드 > Firestore Database > 데이터베이스 만들기** → 위치 **asia-northeast3(서울)** → 프로덕션 모드
4. **빌드 > Cloud Messaging** 활성화

## 2. 웹앱 등록 + 설정값 받기
1. 프로젝트 개요 옆 **⚙️ > 프로젝트 설정 > 일반 > 내 앱 > 웹(</>) 추가**
2. 나오는 `firebaseConfig` 값을 복사
3. **클라우드 메시징 탭 > 웹 구성 > 웹 푸시 인증서 > 키 쌍 생성** → 그 **키(VAPID 공개키)** 복사
4. `public/config.js` 를 열어 위 값들로 채우기 (apiKey…appId, 그리고 FB_VAPID_KEY)

## 3. Firebase CLI 설치 & 로그인
```bash
npm install -g firebase-tools
firebase login
cd driverapp
firebase use --add        # 방금 만든 프로젝트 선택 (별칭 default)
```

## 4. Functions 의존성 설치
```bash
cd functions && npm install && cd ..
```

## 5. Blaze 요금제 (Functions 필수)
- 콘솔 좌측 하단 **요금제 업그레이드 > Blaze(사용한 만큼)** → 카드 등록
- ⚠️ 걱정 안 해도 됨: 매월 **무료 한도**(함수 200만 호출/월 등)가 커서, 차량 수십~백 대 규모는 **거의 0원**. 예산 알림도 걸 수 있음.

## 6. 배포
```bash
firebase deploy        # Firestore 규칙 + 색인 + Functions + Hosting 한 번에
```
끝나면 **Hosting URL**(예: `https://kukyang-dispatch.web.app`)이 나옵니다 → 이게 **설치 링크**.

## 7. 계정 만들기 (기사/관리자)
1. **프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성** → `seed/serviceAccountKey.json` 로 저장
2. `seed/drivers.sample.json` 을 복사해 `seed/drivers.json` 만들고 회사 명단 입력
   (admins = 배차담당, drivers = 각 차량: 전화번호·PIN·이름·**차량번호(vno)**)
3. 실행:
```bash
cd seed && npm init -y && npm install firebase-admin && node seed_drivers.js
```
> 차량번호(vno)는 배차가 **어느 기사에게 갈지**를 정하는 열쇠입니다. 관리자 배차 화면의 차량 목록과 정확히 일치해야 알림이 갑니다.

## 8. 테스트 (실제 확인)
1. **기사 폰**: Hosting 링크 열기 → 전화번호+PIN 로그인 → **홈 화면에 추가**(설치) → **알림 켜기** 허용
2. **관리자 PC/폰**: 같은 링크 → 관리자 로그인 → 배차 입력 → 차량 선택 → **보내기**
3. 기사 폰에 **푸시 알림** 도착 확인. 앱을 꺼둔 상태에서도 오는지 확인.
4. **선배차** 버튼으로 보내면 알림에 "⚠️ 선배차(서류 준비중)"로 표시.

---

## 비용 요약 (소규모)
| 항목 | 대략 |
|---|---|
| Firestore / Auth / Hosting / 푸시(FCM) | 무료 한도 내(대부분 0원) |
| Cloud Functions | Blaze 필요(카드), 무료 한도 커서 사실상 0원 |
| 도메인(선택) | 연 1~2만원 (기본 .web.app 무료) |

## 자주 막히는 곳
- **알림이 안 와요**: 기사 폰에서 알림 허용했는지 / iOS는 반드시 **홈 화면에 추가한 상태**에서 열어야 푸시가 옵니다(사파리 탭에선 X). iOS 16.4+ 필요.
- **로그인 실패**: seed 로 계정 생성했는지, 전화번호 숫자만/PIN 일치 확인.
- **배차했는데 특정 기사만 안 옴**: 그 기사 `vno` 와 배차의 차량 선택값이 같은지 확인.

## 다음 단계(로드맵)
1. (지금) 배차→기사 알림 + 선배차 ✅
2. 월배차·매출·월현황 리포트
3. 전자세금계산서 연동(팝빌 등)
4. GPS (동의·법 검토 후)
