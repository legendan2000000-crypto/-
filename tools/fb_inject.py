# 배차일보(대시보드) HTML에 Firebase '기사 전송' 기능을 주입한다.
#  - 각 배차 줄의 '복제' 버튼을 '🔔 기사전송' 버튼으로 교체(줄에서 바로 전송)
#  - 우하단 플로팅 버튼: 관리자 로그인/로그아웃/상태 표시
#  - 전송 시 확정/선배차 선택 → Firebase dispatches 문서 생성 → 기사 푸시
# 기존 배차/견적/선박 탭·데이터는 건드리지 않음.
# 사용: python tools/fb_inject.py <입력.html> <출력.html>
import sys

# --- 줄 버튼 치환: '복제' → '🔔 기사전송' (데스크탑/모바일 동일 substring, 전부 교체) ---
DUP_BTN = '<button class="btn sm" data-dup="${r._id}">복제</button>'
SEND_BTN = '<button class="btn sm fbsend" data-fbsend="${r._id}" style="background:#2563eb;color:#fff;border-color:#2563eb">🔔 기사전송</button>'

INJECT = r'''
<!-- ===== 기사앱 연동(기사 전송) — 배차일보 배차탭 → Firebase → 기사 푸시 ===== -->
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script>
(function(){
  var CFG={apiKey:"AIzaSyCm50tqmzElMrVZT90js1e1tRQI7E9gTNs",authDomain:"kukyang-dispatch.firebaseapp.com",projectId:"kukyang-dispatch",storageBucket:"kukyang-dispatch.firebasestorage.app",messagingSenderId:"1004468642041",appId:"1:1004468642041:web:d9cd78e2d04106880a4228"};
  var FB_OK=!!(window.firebase && firebase.initializeApp), auth=null, db=null;
  if(FB_OK){ try{ firebase.initializeApp(CFG); }catch(e){} auth=firebase.auth(); db=firebase.firestore(); }
  else { console.warn('[기사전송] Firebase 미로딩 — 인터넷 연결/파일 실행 확인'); }

  var emailOf=function(p){return String(p).replace(/\D/g,'')+'@kukyang.driver';};
  var pwOf=function(p){return 'kk-'+String(p);};
  var E=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  var toast=function(m,bad){var t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:'+(bad?'#c0392b':'#2563eb')+';color:#fff;padding:10px 16px;border-radius:10px;z-index:100010;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.3);max-width:90vw';document.body.appendChild(t);setTimeout(function(){t.remove();},3800);};

  // ---- 플로팅 버튼(로그인/상태) ----
  var btn=document.createElement('button');
  btn.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99999;color:#fff;border:0;border-radius:24px;padding:12px 18px;font-weight:800;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer';
  var panel=document.createElement('div');
  panel.style.cssText='position:fixed;right:16px;bottom:70px;z-index:99999;width:340px;max-width:92vw;max-height:72vh;overflow:auto;background:#fff;color:#141413;border:1px solid #ddd;border-radius:14px;box-shadow:0 12px 44px rgba(0,0,0,.3);padding:14px;display:none;font:14px -apple-system,BlinkMacSystemFont,sans-serif';
  function ready(){document.body.appendChild(btn);document.body.appendChild(panel);paintBtn();}
  if(document.body)ready(); else document.addEventListener('DOMContentLoaded',ready);

  function loggedIn(){ return !!(auth && auth.currentUser); }
  function paintBtn(){
    if(!FB_OK){ btn.textContent='🔔 기사전송(오프라인)'; btn.style.background='#888'; return; }
    if(loggedIn()){ btn.textContent='🔔 전송 준비됨'; btn.style.background='#16a34a'; }
    else { btn.textContent='🔔 관리자 로그인'; btn.style.background='#2563eb'; }
  }
  btn.onclick=function(){ panel.style.display=(panel.style.display==='none'?'block':'none'); if(panel.style.display==='block')renderPanel(); };
  if(auth) auth.onAuthStateChanged(function(){ paintBtn(); if(panel.style.display==='block')renderPanel(); });

  function renderPanel(){
    if(!FB_OK){ panel.innerHTML='<div style="font-weight:800;margin-bottom:6px">🔔 기사 전송</div><div style="color:#c00;font-size:13px">Firebase가 로드되지 않았습니다. 인터넷 연결 상태에서 파일을 다시 열어주세요.</div>'; return; }
    if(!loggedIn()){ panel.innerHTML=loginHTML(); wireLogin(); return; }
    panel.innerHTML='<div style="font-weight:800;margin-bottom:6px">🔔 전송 준비됨</div>'+
      '<div style="font-size:13px;color:#555;line-height:1.6">각 배차 줄의 <b style="color:#2563eb">🔔 기사전송</b> 버튼을 눌러 그 건을 기사에게 보냅니다.<br>차량이 지정된 건만 전송할 수 있어요.</div>'+
      '<div style="margin-top:10px;text-align:right"><a href="#" id="fbLogout" style="font-size:12px;color:#888">로그아웃</a></div>';
    var lo=panel.querySelector('#fbLogout'); if(lo)lo.onclick=function(e){e.preventDefault();auth.signOut();toast('로그아웃됨');};
  }
  function loginHTML(){
    return '<div style="font-weight:800;margin-bottom:8px">🔔 기사 전송 — 관리자 로그인</div>'+
      '<div style="font-size:12px;color:#888;margin-bottom:8px">기사앱 관리자(배차담당) 전화번호+PIN</div>'+
      '<input id="fbPhone" placeholder="전화번호(예: 01000000000)" style="width:100%;box-sizing:border-box;padding:9px;border:1px solid #ccc;border-radius:8px;margin-bottom:6px">'+
      '<input id="fbPin" type="password" placeholder="PIN" style="width:100%;box-sizing:border-box;padding:9px;border:1px solid #ccc;border-radius:8px;margin-bottom:8px">'+
      '<button id="fbLogin" style="width:100%;background:#2563eb;color:#fff;border:0;border-radius:8px;padding:10px;font-weight:800;cursor:pointer">로그인</button>'+
      '<div id="fbErr" style="color:#c00;font-size:12px;margin-top:6px"></div>';
  }
  function wireLogin(){
    var b=panel.querySelector('#fbLogin'); if(!b)return;
    var go=function(){
      var ph=panel.querySelector('#fbPhone').value.trim(), pin=panel.querySelector('#fbPin').value;
      panel.querySelector('#fbErr').textContent='로그인 중…';
      auth.signInWithEmailAndPassword(emailOf(ph), pwOf(pin))
        .then(function(){ renderPanel(); toast('로그인 완료'); })
        .catch(function(e){ panel.querySelector('#fbErr').textContent='로그인 실패 — 전화/PIN 확인 ('+e.code+')'; });
    };
    b.onclick=go;
    panel.querySelector('#fbPin').onkeydown=function(e){ if(e.key==='Enter')go(); };
  }

  // ---- 확정/선배차 선택 팝업 ----
  function chooseAndSend(r, anchor){
    var pop=document.createElement('div');
    pop.style.cssText='position:fixed;z-index:100005;background:#fff;border:1px solid #ddd;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.28);padding:12px;width:230px;font:13px -apple-system,sans-serif';
    var route=[r.load,r.unload||r.addr].filter(Boolean).map(E).join(' → ');
    pop.innerHTML='<div style="font-weight:800;margin-bottom:4px">'+E(r.shipper||'(화주미정)')+' <span style="color:#888;font-size:12px">'+E(r.vno||'')+'</span></div>'+
      '<div style="color:#666;margin-bottom:8px">'+(r.time?('🕐 '+E(r.time)+' · '):'')+(route||'')+'</div>'+
      '<div style="display:flex;gap:6px"><button id="pC" style="flex:1;background:#2563eb;color:#fff;border:0;border-radius:8px;padding:9px;font-weight:800;cursor:pointer">확정 전송</button>'+
      '<button id="pP" style="flex:1;background:#e0a75a;color:#111;border:0;border-radius:8px;padding:9px;font-weight:800;cursor:pointer">선배차</button></div>'+
      '<div style="text-align:right;margin-top:6px"><a href="#" id="pX" style="color:#888;font-size:12px">취소</a></div>';
    document.body.appendChild(pop);
    var rc=anchor.getBoundingClientRect();
    var top=Math.min(rc.bottom+6, window.innerHeight-150), left=Math.min(rc.left, window.innerWidth-244);
    pop.style.top=Math.max(8,top)+'px'; pop.style.left=Math.max(8,left)+'px';
    var close=function(){ pop.remove(); document.removeEventListener('click',out,true); };
    var out=function(e){ if(!pop.contains(e.target) && e.target!==anchor) close(); };
    setTimeout(function(){document.addEventListener('click',out,true);},0);
    pop.querySelector('#pC').onclick=function(){ close(); sendOne(r,'확정'); };
    pop.querySelector('#pP').onclick=function(){ close(); sendOne(r,'선배차'); };
    pop.querySelector('#pX').onclick=function(e){ e.preventDefault(); close(); };
  }
  function sendOne(r, st){
    if(!r){return;}
    var vno=r.vno?String(r.vno):''; if(!vno){ toast('차량이 지정되지 않은 배차입니다 — 먼저 차량 배정',true); return; }
    db.collection('dispatches').add({
      vno:vno, date:r.date||'', time:r.time||'', shipper:r.shipper||'',
      load:r.load||'', unload:r.unload||r.addr||'', cntr:(r.cntr==null?'':String(r.cntr)),
      memo:(r.memo||r.etc||''), status:(st||'확정'), read:false, done:false,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(), createdBy:auth.currentUser.uid, source:'배차일보'
    }).then(function(){ toast((st==='선배차'?'선배차':'배차')+' 전송됨 → '+vno+' 기사 알림'); })
      .catch(function(e){ toast('전송 실패: '+e.message,true); });
  }

  // ---- 줄의 '🔔 기사전송' 버튼(재렌더돼도 유지되도록 위임) ----
  document.addEventListener('click', function(e){
    var b=e.target.closest ? e.target.closest('[data-fbsend]') : null;
    if(!b) return;
    e.preventDefault(); e.stopPropagation();
    if(!FB_OK){ toast('Firebase 미로딩 — 인터넷 연결 후 다시 열기',true); return; }
    if(!loggedIn()){ toast('먼저 우하단 버튼에서 관리자 로그인',true); panel.style.display='block'; renderPanel(); return; }
    var id=b.getAttribute('data-fbsend');
    var r=null; try{ r=(typeof ALL!=='undefined'?ALL:[]).find(function(x){return x._id===id;}); }catch(err){}
    if(!r){ toast('배차 정보를 찾을 수 없습니다',true); return; }
    chooseAndSend(r, b);
  }, true);
})();
</script>
'''

def main(inp, out):
    html = open(inp, encoding='utf-8').read()
    # 1) 줄의 '복제' 버튼 → '기사전송' 버튼
    n = html.count(DUP_BTN)
    html = html.replace(DUP_BTN, SEND_BTN)
    # 2) </body> 앞에 Firebase 스크립트 주입
    i = html.rfind('</body>')
    if i < 0: i = len(html)
    html = html[:i] + INJECT + html[i:]
    open(out, 'w', encoding='utf-8').write(html)
    print('복제→기사전송 버튼 교체:', n, '곳')
    print('주입 완료 ->', out, round(len(html)/1024/1024, 2), 'MB')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
