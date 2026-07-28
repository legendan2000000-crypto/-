/* 배차일보 파서 (자동 추출) — 마스터 없이 동작(실데이터 미포함, 공개앱 안전) */
window.M = { shp:new Map(), veh:new Map(), loads:new Map(), unloads:new Map(), lines:new Map(), bills:new Map() };
var M = window.M;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

const CV={A:10,B:12,C:13,D:14,E:15,F:16,G:17,H:18,I:19,J:20,K:21,L:23,M:24,N:25,O:26,P:27,Q:28,R:29,S:30,T:31,U:32,V:34,W:35,X:36,Y:37,Z:38};

function cntrState(s){ // '' na warn ok bad
  s=(s||'').toString().toUpperCase().replace(/\s+/g,'');
  if(s.length===0)return {st:'',msg:''};
  if(s.length<=10)return {st:'na',msg:'입력 중…'};
  if(!/^[A-Z]{4}[0-9]{7}$/.test(s))return {st:'warn',msg:'형식: 영문4 + 숫자7'};
  let sum=0;for(let i=0;i<10;i++){const c=s[i];const v=i<4?CV[c]:+c;sum+=v*Math.pow(2,i);}
  let cd=sum%11;if(cd===10)cd=0;
  return cd===+s[10]?{st:'ok',msg:'✓ 정상'}:{st:'bad',msg:'✕ 번호를 다시 확인하세요'};
}

function canonShipper(name){
  if(!name)return null;if(M.shp.has(name))return name;
  const n=name.toLowerCase().replace(/\s/g,'');
  for(const k of M.shp.keys()){if(k.toLowerCase().replace(/\s/g,'')===n)return k;}
  if(name.length>=5)for(const k of M.shp.keys()){if(k.length===name.length){let d=0;for(let i=0;i<k.length;i++)if(k[i]!==name[i]){if(++d>1)break;}if(d===1)return k;}} // 짧은 이름 오교정 방지(5자+)
  return null;
}

function parseText(text){
  const res={};const info=[];
  const cntrs=[...new Set([...text.matchAll(/\b([A-Z]{4}\d{7})\b/g)].map(m=>m[1]))];
  if(cntrs.length){const allok=cntrs.every(c=>cntrState(c).st==='ok');
    res.cntr={v:cntrs.join(', '),c:allok?1:0.5};info.push(`컨번호 ${cntrs.length}${allok?'':' (검증 필요)'}`);}
  const tel=text.match(/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/);if(tel){res.tel={v:tel[0],c:1};info.push('연락처');}
  const bt=text.match(/청구처\s*[:\-]?\s*([가-힣A-Za-z0-9()·&]{2,})/);if(bt){res.billto={v:bt[1],c:.85};info.push('청구처');}
  const cg=text.match(/청구\s*[가액]\s*[:\-]?\s*([\d,]{4,})\s*원?/);if(cg){res.charge={v:cg[1].replace(/,/g,''),c:.8};info.push('청구가');}
  const REGION=/(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|경상[남북]도|전라[남북]도|충청[남북]도|경기도|강원도|제주도)\s*[가-힣]{1,4}(시|군|구)\s*[가-힣0-9\s\-()]{2,40}/;
  // '도착지/하차지/납품처' 라벨 옆 주소를 최우선(공급받는자·공급자 주소보다 우선)
  const dz=text.match(/(도착지|하차지|납품처|인도지|배송지|납품지|하치장)\s*[:\-]?\s*([^\n]{0,90})/);
  const am=(dz&&dz[2].match(REGION))||text.match(REGION);
  if(am){let a=am[0].replace(/\s+/g,' ').trim();
    a=a.split(/\s0?1[016789][-.\s]?\d/)[0].trim();   // 전화번호 앞에서 자름
    a=a.replace(/\s+[A-Za-z].*$/,'').trim();          // 뒤쪽 영문코드(DWS 등) 제거
    a=a.split(/\s*(특이사항|비고|담당|연락처|청구|출하|도착|품명|수량|현장|송장|주소|시간)/)[0].trim(); // 뒤 항목 앞에서 자름
    res.addr={v:a,c:.6};info.push('주소');}
  // ── 날짜: 명시(YYYY-M-D / M월D일 / M.D) → 상대(오늘·내일·모레·다음주 화요일 …)
  // 오더는 항상 '오늘'을 기준으로 상대날짜 계산(붙여넣은 대화의 날짜 헤더는 무시)
  const refD=new Date();
  const fmtD=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
  const hasRel=/다음주|담주|다담주|이번주|금주|내일|모레|글피|오늘|요일/.test(text); // '차주'(車主)는 제외
  let dateVal=null,dateConf=1,dateNote='';
  const yr=(text.match(/(20\d{2})\s*년/)||[])[1]||new Date().getFullYear();
  const pad2=x=>String(x).padStart(2,'0');
  // ⬆ 현장 도착/납품일 우선: 'M/D일' 형태 또는 도착·납품·상차·현장·하차 키워드 근처 날짜(발행일보다 우선)
  let deliv=null;
  const sd=text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*일/);
  if(sd)deliv=[+sd[1],+sd[2]];
  if(!deliv){const kb=text.match(/(도착|납품|상차|현장|하차|입고|배송|납기)[^\d]{0,12}(\d{1,2})\s*[월\/\.]\s*(\d{1,2})/);if(kb)deliv=[+kb[2],+kb[3]];}
  if(!deliv){const ka=text.match(/(\d{1,2})\s*[월\/\.]\s*(\d{1,2})\s*일?[^\d]{0,8}(도착|납품|상차|하차|입고|현장)/);if(ka)deliv=[+ka[1],+ka[2]];}
  const dm=text.match(/(20\d{2})[-.\/](\d{1,2})[-.\/](\d{1,2})/);
  const mdk=text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if(deliv&&!hasRel&&deliv[0]>=1&&deliv[0]<=12&&deliv[1]>=1&&deliv[1]<=31){dateVal=`${yr}-${pad2(deliv[0])}-${pad2(deliv[1])}`;dateConf=.7;dateNote=' (현장/납품일)';}
  else if(dm&&!hasRel){dateVal=`${dm[1]}-${pad2(dm[2])}-${pad2(dm[3])}`;}
  else if(mdk&&!hasRel){dateVal=`${yr}-${pad2(mdk[1])}-${pad2(mdk[2])}`;}
  else if(!hasRel){const m2=text.match(/\b(\d{1,2})[.\/](\d{1,2})\b/);
    if(m2)dateVal=`${yr}-${pad2(m2[1])}-${pad2(m2[2])}`;}
  if(hasRel){
    const DK={'일':0,'월':1,'화':2,'수':3,'목':4,'금':5,'토':6};let rd=null;
    if(/모레/.test(text))rd=addD(refD,2);
    else if(/내일/.test(text))rd=addD(refD,1);
    else if(/글피/.test(text))rd=addD(refD,3);
    else if(/오늘/.test(text))rd=new Date(refD);
    const relText=text.replace(/\d{1,2}\s*월\s*\d{1,2}\s*일\s*[월화수목금토일]\s*요일/g,' '); // 날짜헤더 제거
    const wk=relText.match(/(이번주|금주|다음주|담주|다담주)\s*([월화수목금토일])\s*요일/); // 주+요일 우선
    const bare=relText.match(/([월화수목금토일])\s*요일/);
    const wm=wk?{word:wk[1],dow:wk[2]}:(bare?{word:'',dow:bare[1]}:null);
    if(wm){const tdow=DK[wm.dow],cur=refD.getDay();
      if(wm.word){const mon=addD(refD,-(cur===0?6:cur-1));              // 이번주 월요일
        const wkn=/다담주/.test(wm.word)?14:(/다음주|담주/.test(wm.word)?7:0);
        rd=addD(mon,wkn+(tdow===0?6:tdow-1));
      }else{let g=(tdow-cur+7)%7;if(g===0)g=7;rd=addD(refD,g);}          // 주 지정 없으면 다음 해당요일
    }
    if(rd){dateVal=fmtD(rd);dateConf=0.55;dateNote=` (오늘 ${refD.getMonth()+1}/${refD.getDate()} 기준)`;}
  }
  if(dateVal){res.date={v:dateVal,c:dateConf};info.push('날짜'+(dateConf<0.75?' ⚠확인'+dateNote:''));}
  // ── 시간: 오전/오후 N시(반/N분) 우선, 없으면 HH:MM
  const kt=text.match(/(오전|오후|아침|저녁|밤|새벽|낮)?\s*(\d{1,2})\s*시\s*(반|(\d{1,2})\s*분)?/);
  if(kt){let h=+kt[2];const ap=kt[1]||'';
    if(/오후|저녁|밤|낮/.test(ap)&&h<12)h+=12;
    if(/오전|아침|새벽/.test(ap)&&h===12)h=0;
    const mn=kt[3]==='반'?30:(kt[4]?+kt[4]:0);
    res.time={v:String(h).padStart(2,'0')+':'+String(mn).padStart(2,'0'),c:ap?0.85:0.6};info.push('시간');
  }else{const tm=text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);if(tm){res.time={v:tm[0].padStart(5,'0'),c:1};info.push('시간');}}
  // ── 수출입: 키워드 확장(들어온/입항 → 수입, 나가는/출항 → 수출)
  if(/수입|import|반입|들어온|들어옴|입항|양하/i.test(text)){res.io={v:'I',c:/수입|반입/.test(text)?1:0.7};}
  else if(/수출|export|반출|나가는|출항|선적/i.test(text)){res.io={v:'O',c:/수출|반출/.test(text)?1:0.7};}
  // ── 수량: "컨테이너 2대", "2대", "2개"
  const qm=text.match(/컨테이너\s*(\d{1,2})\s*대?/)||text.match(/(\d{1,2})\s*대(?!리)/)||text.match(/(\d{1,2})\s*개/);
  if(qm){const q=+qm[1];if(q>=1&&q<=30){res._qty=q;if(q>1)info.push(`수량 ${q}대`);}}
  const sz=text.match(/\b(20|40|45)\b/);if(sz){res.size={v:sz[1],c:.6};}
  const tp=text.match(/\b(RF|RH|HC|OT|FR|DV|GP)\b/i)||text.match(/(리퍼|오픈탑|플랫)/);
  if(tp){const map={RF:'RE',RH:'RE',리퍼:'RE',OT:'OT',오픈탑:'OT',FR:'FR',플랫:'FR'};res.type={v:map[tp[1].toUpperCase?tp[1].toUpperCase():tp[1]]||(sz&&sz[1]?'':'H'),c:.5};}
  // 차량 뒷4자리: 마스터에 있는 4자리
  const nums=[...text.matchAll(/\b(\d{4})\b/g)].map(m=>m[1]).filter(n=>M.veh.has(n));
  if(nums.length){res.vno={v:nums[0],c:.7};info.push('차량후보');}
  // ① 명시 라벨 "화주 XXX" / "화주:XXX" / "화주명 XXX" 최우선 (마스터로 정규화)
  const shLabel=text.match(/화주(?:명)?\s*[:\-]?\s*([가-힣A-Za-z0-9()·&]{2,})/);
  if(shLabel){const c=canonShipper(shLabel[1]);res.shipper={v:c||shLabel[1],c:c?.9:.8};}
  // ② 마스터 매칭 (라벨 없을 때, 대소문자 무시·긴 이름 우선)
  if(!res.shipper){const T=text.toUpperCase();
    for(const s of [...M.shp.keys()].sort((a,b)=>b.length-a.length)){if(s&&s.length>=2&&T.includes(s.toUpperCase())){res.shipper={v:s,c:.8};break;}}}
  // ③ 마스터에 없는 새 화주: 짧은 오더면 앞쪽 명사를 후보로 (단, 터미널·경로·잡토큰 제외)
  if(!res.shipper){
    const STOP=/^(내일|모레|오늘|글피|이번주|금주|다음주|담주|차주|다담주|오전|오후|아침|저녁|밤|새벽|낮|수입|수출|반입|반출|들어온|들어옴|들어온거|입항|출항|선적|도착|출발|컨테이너|컨|박스|피트|기준|담당|화주|화주명|안녕하세요|안녕하세용|있어요|있음)$/;
    const isTerm=t=>t.split(/[-→~>]/).some(x=>x&&(M.loads.has(x)||M.unloads.has(x)));
    const toks=text.replace(/[()\[\]:·,\/\n]/g,' ').split(/\s+/).filter(Boolean);
    if(toks.length<=6){
      for(const t of toks){
        if(t.length<2||STOP.test(t))continue;
        if(/^\d/.test(t)||/\d(대|개|시|분|피트|월|일|톤)/.test(t))continue; // 수량/시간/날짜 제외
        if(/^[A-Z]{4}\d{7}$/.test(t)||/요일$/.test(t))continue;               // 컨번호/요일 제외
        if(/입니다$|건$|도착|출발/.test(t)||isTerm(t))continue;               // 서술어·터미널·경로 제외
        const c=canonShipper(t);res.shipper={v:c||t,c:c?.7:.45};break;
      }
    }
  }
  // 상차/하차: 라벨(상차/하차) 뒤에 오는 터미널 우선, 없으면 첫 매칭
  const findTerm=(map,labels,useFallback)=>{
    for(const lb of labels){const gi=text.indexOf(lb);if(gi>=0){const seg=text.slice(gi,gi+18);
      for(const t of map.keys()){if(t&&t.length>=2&&seg.includes(t))return t;}}}
    if(useFallback){for(const t of map.keys()){if(t&&t.length>=2&&text.includes(t))return t;}}
    return null;
  };
  const ld=findTerm(M.loads,['상차','상차지','싣','출발'],true);
  if(ld)res.load={v:ld,c:.6};
  const ul=findTerm(M.unloads,['하차','하차지','하치','도착','→'],false); // 하차 라벨 있을 때만(없으면 주소=하차지)
  if(ul)res.unload={v:ul,c:.5};
  const bl=text.match(/\b[A-Z]{3,4}[A-Z0-9]{6,}\b/);if(bl&&!cntrs.includes(bl[0])){res.bl={v:bl[0],c:.5};}
  return {res,info};
}

async function readDocx(buf){
  const dv=new DataView(buf),u8=new Uint8Array(buf),td=new TextDecoder();
  let eocd=-1;
  for(let i=u8.length-22;i>=0&&i>u8.length-22-65536;i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw new Error('ZIP 형식 아님');
  let cd=dv.getUint32(eocd+16,true);const n=dv.getUint16(eocd+10,true);
  let off=-1,csize=0,method=8;
  for(let e=0;e<n&&dv.getUint32(cd,true)===0x02014b50;e++){
    const m=dv.getUint16(cd+10,true),cs=dv.getUint32(cd+20,true);
    const fnl=dv.getUint16(cd+28,true),efl=dv.getUint16(cd+30,true),cml=dv.getUint16(cd+32,true);
    const lo=dv.getUint32(cd+42,true),name=td.decode(u8.subarray(cd+46,cd+46+fnl));
    if(name==='word/document.xml'){off=lo;csize=cs;method=m;}
    cd+=46+fnl+efl+cml;
  }
  if(off<0)throw new Error('document.xml 없음');
  const lfnl=dv.getUint16(off+26,true),lefl=dv.getUint16(off+28,true);
  const start=off+30+lfnl+lefl,comp=u8.subarray(start,start+csize);
  let bytes=comp;
  if(method===8){const ds=new DecompressionStream('deflate-raw');
    bytes=new Uint8Array(await new Response(new Blob([comp]).stream().pipeThrough(ds)).arrayBuffer());}
  let xml=td.decode(bytes).replace(/<\/w:p>/g,'\n').replace(/<w:tab\/>/g,'\t').replace(/<w:br\s*\/?>/g,'\n');
  return xml.replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&#(\d+);/g,(m,d)=>String.fromCharCode(+d)).replace(/&amp;/g,'&');
}
window.BCM = { parseText: parseText, readDocx: readDocx, cntrState: cntrState };
