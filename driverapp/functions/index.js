// 배차 문서가 생기면(dispatches/{id}) 해당 차량번호(vno) 기사에게 푸시 알림 발송.
// 선배차(status='선배차')면 알림 제목/본문에 '서류 준비중' 표시.
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

exports.notifyDriverOnDispatch = onDocumentCreated(
  { document: 'dispatches/{id}', region: 'asia-northeast3' },
  async (event) => {
    const d = event.data && event.data.data();
    if (!d || !d.vno) return;

    // 이 차량번호(vno)에 해당하는 기사 계정들 찾기
    const usersSnap = await db.collection('users').where('vno', '==', d.vno).get();
    if (usersSnap.empty) { console.log('해당 차량 기사 없음:', d.vno); return; }

    // 각 기사의 FCM 토큰 모으기
    const tokens = [];
    for (const u of usersSnap.docs) {
      const t = await db.collection('fcmTokens').doc(u.id).get();
      if (t.exists && Array.isArray(t.data().tokens)) tokens.push(...t.data().tokens);
    }
    if (!tokens.length) { console.log('토큰 없음(기사 알림 미허용):', d.vno); return; }

    const pre = d.status === '선배차';
    const route = [d.load, d.unload].filter(Boolean).join(' → ');
    const title = (pre ? '⚠️ 선배차(서류 준비중) · ' : '🚚 새 배차 · ') + (d.date || '');
    const body = [
      d.shipper && ('화주 ' + d.shipper),
      route,
      d.time && ('시간 ' + d.time),
      d.cntr && ('컨 ' + d.cntr),
    ].filter(Boolean).join(' / ');

    const message = {
      tokens: [...new Set(tokens)],
      notification: { title, body: body || '배차가 등록되었습니다.' },
      data: { dispatchId: event.params.id, vno: String(d.vno), status: d.status || '확정' },
      webpush: {
        fcmOptions: { link: '/' },
        notification: { icon: '/icon-192.png', badge: '/icon-192.png', requireInteraction: true },
      },
    };

    await sendAndClean(message, usersSnap);
    console.log(`푸시 발송 (vno=${d.vno}, 선배차=${pre})`);
  }
);

// 배차 회수(취소) 시 기사에게 알림
exports.notifyDriverOnRecall = onDocumentUpdated(
  { document: 'dispatches/{id}', region: 'asia-northeast3' },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!after || !after.vno) return;
    if (before.status === '회수' || after.status !== '회수') return; // 회수로 '바뀐' 순간만

    const usersSnap = await db.collection('users').where('vno', '==', after.vno).get();
    if (usersSnap.empty) return;
    const tokens = [];
    for (const u of usersSnap.docs) {
      const t = await db.collection('fcmTokens').doc(u.id).get();
      if (t.exists && Array.isArray(t.data().tokens)) tokens.push(...t.data().tokens);
    }
    if (!tokens.length) return;

    const route = [after.load, after.unload].filter(Boolean).join(' → ');
    const message = {
      tokens: [...new Set(tokens)],
      notification: {
        title: '❌ 배차 취소 · ' + (after.date || ''),
        body: [after.shipper && ('화주 ' + after.shipper), route].filter(Boolean).join(' / ') || '배차가 취소되었습니다.',
      },
      data: { dispatchId: event.params.id, vno: String(after.vno), status: '회수' },
      webpush: { fcmOptions: { link: '/' }, notification: { icon: '/icon-192.png', badge: '/icon-192.png', requireInteraction: true } },
    };
    await sendAndClean(message, usersSnap);
    console.log(`회수 알림 발송 (vno=${after.vno})`);
  }
);

// 공통: 발송 + 죽은 토큰 정리
async function sendAndClean(message, usersSnap) {
  const res = await getMessaging().sendEachForMulticast(message);
  if (res.failureCount > 0) {
    const dead = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error && r.error.code;
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token') dead.push(message.tokens[i]);
      }
    });
    if (dead.length) {
      for (const u of usersSnap.docs) {
        const ref = db.collection('fcmTokens').doc(u.id);
        const snap = await ref.get();
        if (snap.exists) {
          const keep = (snap.data().tokens || []).filter((t) => !dead.includes(t));
          await ref.set({ tokens: keep }, { merge: true });
        }
      }
    }
  }
  return res;
}
