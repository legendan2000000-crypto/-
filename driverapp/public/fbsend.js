/* ===== 배차일보 '기사전송' 로더 (fbsend.js) =====
 * 배차일보 HTML 맨 아래에 아래 한 줄만 한 번 넣어두면 자동 적용됩니다.
 *   <script src="fbsend.js"></script>        (같은 폴더에 fbsend.js 둘 때)
 * 또는 배포본:
 *   <script src="https://kukyang-dispatch.web.app/fbsend.js"></script>
 *
 * 하는 일:
 *  - Firebase(compat) SDK 자동 로드
 *  - 각 배차 줄의 '복제' 버튼을 '🔔 기사전송' 버튼으로 실시간 변환(재렌더돼도 유지)
 *  - 우하단 플로팅 버튼: 관리자 로그인/상태
 *  - 전송 전 승인기사 실조회, 전송 후 실제 도달결과 표시
 * 기존 배차/견적/선박 탭·데이터는 건드리지 않습니다.
 */
(function(){
  if(window.__FBSEND_LOADED) return; window.__FBSEND_LOADED = true;
  var CFG={apiKey:"AIzaSyCm50tqmzElMrVZT90js1e1tRQI7E9gTNs",authDomain:"kukyang-dispatch.firebaseapp.com",projectId:"kukyang-dispatch",storageBucket:"kukyang-dispatch.firebasestorage.app",messagingSenderId:"1004468642041",appId:"1:1004468642041:web:d9cd78e2d04106880a4228"};
  var SDK='https://www.gstatic.com/firebasejs/10.12.2/';

  function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('load fail '+src));};document.head.appendChild(s);});}
  function boot(){
    if(window.firebase && firebase.apps) return Promise.resolve(true);
    return loadScript(SDK+'firebase-app-compat.js')
      .then(function(){return loadScript(SDK+'firebase-auth-compat.js');})
      .then(function(){return loadScript(SDK+'firebase-firestore-compat.js');})
      .then(function(){return true;}).catch(function(e){console.warn('[기사전송] Firebase 로드 실패',e);return false;});
  }

  boot().then(function(ok){
    var FB_OK=!!(ok && window.firebase && firebase.initializeApp), auth=null, db=null;
    if(FB_OK){ try{ firebase.initializeApp(CFG); }catch(e){} auth=firebase.auth(); db=firebase.firestore(); }

    var E=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
    // 값이 문자열/객체{v|text|addr}/배열 무엇이든 순수 문자열로
    function asText(a){ if(a==null) return ''; if(typeof a==='string') return a; if(Array.isArray(a)) return a.map(asText).filter(Boolean).join(' '); if(typeof a==='object') return String(a.v!=null?a.v:(a.text!=null?a.text:(a.addr!=null?a.addr:(a.name!=null?a.name:'')))); return String(a); }
    var toast=function(m,bad,persist){var t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:'+(bad?'#c0392b':'#2563eb')+';color:#fff;padding:10px 16px;border-radius:10px;z-index:100010;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.3);max-width:90vw';document.body.appendChild(t);if(!persist)setTimeout(function(){t.remove();},4200);return t;};

    // ---- 복제 버튼 → 기사전송 버튼 실시간 변환 ----
    function convert(root){
      var list=(root||document).querySelectorAll ? (root||document).querySelectorAll('[data-dup]') : [];
      for(var i=0;i<list.length;i++){
        var b=list[i]; if(b.getAttribute('data-fbsend')) continue;
        var id=b.getAttribute('data-dup');
        b.removeAttribute('data-dup');
        b.setAttribute('data-fbsend', id);
        b.onclick=null;                       // 대시보드가 걸어둔 복제 동작 제거
        b.textContent='🔔 기사전송';
        b.style.background='#2563eb'; b.style.color='#fff'; b.style.borderColor='#2563eb';
      }
    }
    function scan(){ convert(document); }
    if(document.body) scan(); else document.addEventListener('DOMContentLoaded',scan);
    try{
      var mo=new MutationObserver(function(muts){ for(var i=0;i<muts.length;i++){ if(muts[i].addedNodes && muts[i].addedNodes.length){ scan(); break; } } });
      mo.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){ setInterval(scan, 1500); } // 옵저버 불가 환경 폴백

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

    var emailOf=function(p){return String(p).replace(/\D/g,'')+'@kukyang.driver';};
    var pwOf=function(p){return 'kk-'+String(p);};
    function renderPanel(){
      if(!FB_OK){ panel.innerHTML='<div style="font-weight:800;margin-bottom:6px">🔔 기사 전송</div><div style="color:#c00;font-size:13px">Firebase가 로드되지 않았습니다. 인터넷 연결 상태에서 다시 열어주세요.</div>'; return; }
      if(!loggedIn()){ panel.innerHTML=loginHTML(); wireLogin(); return; }
      panel.innerHTML='<div style="font-weight:800;margin-bottom:6px">🔔 전송 준비됨</div>'+
        '<div style="font-size:13px;color:#555;line-height:1.6">각 배차 줄의 <b style="color:#2563eb">🔔 기사전송</b> 버튼으로 그 건을 기사에게 보냅니다.<br>차량이 지정된 건만 전송됩니다.</div>'+
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
      var chk=toast('🔎 기사 확인 중… ('+vno+')',false,true);
      db.collection('users').where('vno','==',vno).get().then(function(qs){
        chk.remove();
        var drivers=[]; qs.forEach(function(x){ var u=x.data(); if(u.role==='driver') drivers.push(u.name||u.phone||''); });
        if(!drivers.length){
          if(!confirm('⚠️ 차량 '+vno+' 으로 가입·승인된 기사가 없습니다.\n지금 보내도 기사폰(기사앱)으로는 알림이 가지 않습니다.\n\n그래도 배차 문서만 저장할까요?')){ toast('전송 취소',true); return; }
        }
        doSend(r, st, vno, drivers);
      }).catch(function(e){
        chk.remove();
        if(confirm('기사 조회 실패('+(e.code||e.message)+').\n관리자 계정인지 확인하세요. 그래도 전송을 시도할까요?')) doSend(r, st, vno, []);
      });
    }
    function doSend(r, st, vno, drivers){
      var sending=toast('📡 전송 중… 기사 도달 확인 중 ('+vno+')',false,true);
      db.collection('dispatches').add({
        vno:vno, date:r.date||'', time:r.time||'', shipper:r.shipper||'',
        load:r.load||'', unload:r.unload||r.addr||'', cntr:(r.cntr==null?'':String(r.cntr)),
        memo:(r.memo||r.etc||''), pay:(r.pay==null?0:(Number(r.pay)||0)),
        io:(r.io==='I'?'수입':r.io==='O'?'수출':(r.io||'')), spec:(r.spec||''), size:(r.size||''),
        tel:(r.tel||''), bl:(r.bl||''), line:(r.line||''), addr:asText(r.addr!=null?r.addr:r.addrs),
        status:(st||'확정'), read:false, done:false,
        createdAt:firebase.firestore.FieldValue.serverTimestamp(), createdBy:auth.currentUser.uid, source:'배차일보'
      }).then(function(ref){ watchDelivery(ref, vno, drivers, st, sending); })
        .catch(function(e){ sending.remove(); toast('저장 실패: '+e.message,true); });
    }
    function watchDelivery(ref, vno, drivers, st, sending){
      var settled=false, who=(drivers&&drivers.length)?drivers.join(', '):vno;
      var unsub=ref.onSnapshot(function(s){
        var d=s.data()||{}; if(!d.delivery) return;
        settled=true; try{unsub();}catch(e){} sending.remove();
        var w=(d.deliveredTo&&d.deliveredTo.length)?d.deliveredTo.join(', '):who;
        if(d.delivery==='sent') toast('✅ '+w+' 기사에게 실제 발송됨'+(d.deliveryCount?(' ('+d.deliveryCount+'대 수신)'):''));
        else if(d.delivery==='no_driver') toast('⚠️ 차량 '+vno+': 가입·승인된 기사 없음 — 알림 미발송',true);
        else if(d.delivery==='no_token') toast('⚠️ '+w+' 기사가 알림을 안 켬 — 기사앱에서 알림 허용 필요',true);
        else toast('⚠️ 발송 실패(토큰 만료 등) — 기사앱 재실행/알림 재허용 필요',true);
      }, function(){});
      setTimeout(function(){ if(settled)return; try{unsub();}catch(e){} sending.remove();
        if(drivers&&drivers.length) toast('💾 저장됨('+(st==='선배차'?'선배차':'확정')+') → '+who+'. 도달 결과 확인 지연(함수 상태 확인)',true);
        else toast('💾 저장만 됨 — 이 차량 승인 기사 없음(기사폰 알림 미발송)',true);
      }, 12000);
    }

    // ---- 줄의 '🔔 기사전송' 클릭(위임) ----
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
  });
})();
