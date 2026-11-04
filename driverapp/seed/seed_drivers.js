// 기사/관리자 계정 일괄 생성 스크립트 (로컬에서 1회 실행)
// 사용법:
//   1) Firebase 콘솔 → 프로젝트설정 → 서비스계정 → "새 비공개 키 생성" → serviceAccountKey.json 저장(이 폴더에)
//   2) npm i firebase-admin
//   3) drivers.json 을 회사 차량 명단으로 채운다 (아래 형식)
//   4) node seed_drivers.js
//
// drivers.json 형식:
// {
//   "admins": [ { "phone": "01011112222", "pin": "0000", "name": "배차담당" } ],
//   "drivers": [ { "phone": "01033334444", "pin": "1234", "name": "홍길동", "vno": "부산80바1234" } ]
// }
//
// 로그인은 '전화번호 + PIN'. 내부적으로 {phone}@kukyang.driver 이메일로 저장된다.

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

initializeApp({ credential: cert(require('./serviceAccountKey.json')) });
const auth = getAuth();
const db = getFirestore();

const emailOf = (phone) => `${String(phone).replace(/\D/g, '')}@kukyang.driver`;
const pwOf = (pin) => 'kk-' + String(pin); // Firebase 비번 최소 6자 충족(앱 로그인과 동일 규칙)

async function upsert(person, role) {
  const email = emailOf(person.phone);
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password: pwOf(person.pin) });
  } catch (e) {
    user = await auth.createUser({ email, password: pwOf(person.pin), displayName: person.name });
  }
  await db.collection('users').doc(user.uid).set(
    { role, name: person.name || '', phone: String(person.phone), vno: person.vno || '' },
    { merge: true }
  );
  console.log(`${role} 준비완료: ${person.name || ''} ${person.phone} ${person.vno || ''}`);
}

(async () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'drivers.json'), 'utf8'));
  for (const a of data.admins || []) await upsert(a, 'admin');
  for (const d of data.drivers || []) await upsert(d, 'driver');
  console.log('완료.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
