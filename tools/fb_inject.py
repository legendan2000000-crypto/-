# 배차일보(대시보드) HTML에 Firebase '기사 전송' 기능을 주입한다.
# 기존 코드/탭은 건드리지 않고 </body> 앞에 스크립트만 삽입.
# 사용: python tools/fb_inject.py <입력.html> <출력.html>
import sys

INJECT = r'''
<!-- ===== 기사앱 연동(기사 전송) — 배차일보 배차탭 → Firebase → 기사 푸시 ===== -->
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script>
(function(){
  if(!window.firebase || !firebase.initializeApp){ console.warn('[기사전송] Firebase 미로딩 — 인터넷/파일실행 확인'); return; }
  var CFG={apiKey:"AIzaSyCm50tqmzElMrVZT90js1e1tRQI7E9gTNs",authDomain:"kukyang-dispatch.firebaseapp.com",projectId:"kukyang-dispatch",storageBucket:"kukyang-dispatch.firebasestorage.app",messagingSenderId:"1004468642041",appId:"1:1004468642041:web:d9cd78e2d04106880a4228"};
  try{ firebase.initializeApp(CFG); }catch(e){}
  var auth=firebase.auth(), db=firebase.firestore();
  var emailOf=function(p){return String(p).replace(/\D/g,'')+'@kukyang.driver';};
  var pwOf=function(p){return 'kk-'+String(p);};
  var E=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  var toast=function(m){var t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#2563eb;color:#fff;padding:10px 16px;border-radius:10px;z-index:100000;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.3)';document.body.appendChild(t);setTimeout(function(){t.remove();},3500);};

  var btn=document.createElement('button');
  btn.textContent='🔔 기사전송';
  btn.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99999;background:#2563eb;color:#fff;border:0;border-radius:24px;padding:12px 18px;font-weight:800;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer';
  var panel=document.createElement('div');
  panel.style.cssText='position:fixed;right:16px;bottom:70px;z-index:99999;width:360px;max-width:92vw;max-height:72vh;overflow:auto;background:#fff;color:#141413;border:1px solid #ddd;border-radius:14px;box-shadow:0 12px 44px rgba(0,0,0,.3);padding:14px;display:none;font:14px -apple-system,BlinkMacSystemFont,sans-serif';
  function ready(){document.body.appendChild(btn);document.body.appendChild(panel);}
  if(document.body)ready(); else document.addEventListener('DOMContentLoaded',ready);
  btn.onclick=function(){panel.style.display=(panel.style.display==='none'?'block':'none');if(panel.style.display==='block')render();};

  auth.onAuthStateChanged(function(){ if(panel.style.display==='block')render(); });

  function render(){
    if(!auth.currentUser){ panel.innerHTML=loginHTML(); wireLogin(); return; }
    var day=''; try{ day=(typeof selDate!=='undefined')?selDate:''; }catch(e){}
    var rows=[]; try{ rows=(typeof ALL!=='undefined'?ALL:[]).filter(function(r){return r.date===day;}); }catch(e){}
    var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>🔔 기사에게 전송</b><span style="font-size:12px;color:#888">'+E(day)+'</span></div>';
    h+='<div style="font-size:12px;color:#888;margin-bottom:8px">이 날짜 배차 '+rows.length+'건. 차량 지정된 건만 보낼 수 있어요.</div>';
    h+=rows.map(function(r){return card(r);}).join('') || '<div style="color:#888;padding:10px 0">이 날짜 배차가 없습니다.</div>';
    h+='<div style="margin-top:10px;text-align:right"><a href="#" id="fbLogout" style="font-size:12px;color:#888">로그아웃</a></div>';
    panel.innerHTML=h;
    panel.querySelectorAll('[data-send]').forEach(function(b){ b.onclick=function(){ var i=+b.getAttribute('data-send'); sendOne(rows[i], b.getAttribute('data-st')); }; });
    var lo=panel.querySelector('#fbLogout'); if(lo)lo.onclick=function(e){e.preventDefault();auth.signOut();};
  }
  function card(r){
    var route=[r.load,r.unload].filter(Boolean).map(E).join(' → ');
    var vno=r.vno?String(r.vno):'';
    var idx=(typeof ALL!=='undefined')?ALL.indexOf(r):-1;
    var btns=vno? ('<button data-send="'+idx+'" data-st="확정" style="flex:1;background:#2563eb;color:#fff;border:0;border-radius:8px;padding:8px;font-weight:700;cursor:pointer">확정 전송</button>'+
                   '<button data-send="'+idx+'" data-st="선배차" style="flex:1;background:#e0a75a;color:#111;border:0;border-radius:8px;padding:8px;font-weight:700;cursor:pointer">선배차</button>')
                : '<span style="color:#c00;font-size:12px">차량 미지정 — 배차일보에서 차량 배정 후</span>';
    return '<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px">'+
      '<div style="font-weight:800">'+E(r.shipper||'(화주미정)')+' <span style="font-size:12px;color:#888">'+E(vno)+'</span></div>'+
      '<div style="font-size:12.5px;color:#555;margin:3px 0">'+(r.time?('🕐 '+E(r.time)+' · '):'')+(route||'')+'</div>'+
      (r.cntr?('<div style="font-size:12px;color:#777">🔢 '+E(r.cntr)+'</div>'):'')+
      '<div style="display:flex;gap:6px;margin-top:6px">'+btns+'</div></div>';
  }
  function sendOne(r, st){
    if(!r){return;}
    var vno=r.vno?String(r.vno):''; if(!vno){alert('차량이 지정되지 않은 배차입니다.');return;}
    db.collection('dispatches').add({
      vno:vno, date:r.date||'', time:r.time||'', shipper:r.shipper||'',
      load:r.load||'', unload:r.unload||r.addr||'', cntr:(r.cntr==null?'':String(r.cntr)),
      memo:(r.memo||r.etc||''), status:(st||'확정'), read:false, done:false,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(), createdBy:auth.currentUser.uid, source:'배차일보'
    }).then(function(){ toast((st==='선배차'?'선배차':'배차')+' 전송됨 → 기사 알림'); })
      .catch(function(e){ alert('전송 실패: '+e.message+'\n(관리자 계정으로 로그인했는지 확인)'); });
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
    b.onclick=function(){
      var ph=panel.querySelector('#fbPhone').value.trim(), pin=panel.querySelector('#fbPin').value;
      panel.querySelector('#fbErr').textContent='로그인 중…';
      auth.signInWithEmailAndPassword(emailOf(ph), pwOf(pin))
        .then(function(){ render(); })
        .catch(function(e){ panel.querySelector('#fbErr').textContent='로그인 실패 — 전화/PIN 확인 ('+e.code+')'; });
    };
  }
})();
</script>
'''

def main(inp, out):
    html = open(inp, encoding='utf-8').read()
    i = html.rfind('</body>')
    if i < 0: i = len(html)
    html = html[:i] + INJECT + html[i:]
    open(out, 'w', encoding='utf-8').write(html)
    print('주입 완료 ->', out, round(len(html)/1024/1024, 2), 'MB')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
