// ⚠️ Firebase 콘솔에서 받은 값으로 채우세요 (SETUP.md 3번 참고).
// 웹앱 등록 시 나오는 firebaseConfig 를 그대로, vapidKey 는 클라우드 메시징 > 웹 푸시 인증서 값.
window.FB_CONFIG = {
  apiKey: "여기에_apiKey",
  authDomain: "여기에_PROJECT.firebaseapp.com",
  projectId: "여기에_PROJECT_ID",
  storageBucket: "여기에_PROJECT.appspot.com",
  messagingSenderId: "여기에_SENDER_ID",
  appId: "여기에_APP_ID"
};
window.FB_VAPID_KEY = "여기에_웹푸시_VAPID_공개키";
