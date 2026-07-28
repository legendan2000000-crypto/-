/* 백그라운드 푸시 수신용 서비스워커 (앱이 꺼져 있어도 알림 표시) */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('/config.js');

firebase.initializeApp(self.FB_CONFIG);
const messaging = firebase.messaging();

// data-only 메시지가 올 때 알림 직접 표시(중복 방지 위해 notification 없이 온 경우만)
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return; // notification 페이로드는 브라우저가 자동 표시
  const t = (payload.data && payload.data.title) || '새 배차';
  const b = (payload.data && payload.data.body) || '';
  self.registration.showNotification(t, { body: b, icon: '/icon-192.png', badge: '/icon-192.png' });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then((cl) => {
    for (const c of cl) if ('focus' in c) return c.focus();
    if (clients.openWindow) return clients.openWindow('/');
  }));
});
