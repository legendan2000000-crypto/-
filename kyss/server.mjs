// KYSS 영업 대시보드 - 로컬 프록시 서버 (제로 설치, Node 18+ 필요)
//
// 하는 일:
//   1) .env 의 계정으로 KYSS(POST /api/login) 로그인 → 쿠키 유지
//   2) 브라우저(대시보드)의 요청을 받아 KYSS API 를 대신 호출 (CORS 없음)
//   3) 영업사원 목록 / 선택한 사원의 실적을 집계해서 돌려줌
//
// 실행:  node server.mjs   →  http://localhost:8787
//
// ⚠️ 조회(select)만 호출합니다. 저장/삭제 API 는 절대 부르지 않습니다.

import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

/* ───────────────────────── .env 로드 ───────────────────────── */
function loadEnv() {
  const p = join(__dir, '.env');
  const env = { ...process.env };
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m || line.trim().startsWith('#')) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  }
  return env;
}
const ENV = loadEnv();
const BASE = (ENV.KYSS_BASE || 'https://www.kyss.co.kr/api/').replace(/\/?$/, '/');
const PORT = Number(ENV.PORT || 8787);

/* ───────────────────────── 쿠키 저장소(jar) ───────────────────────── */
const jar = new Map(); // name -> value
function storeCookies(res) {
  let list = [];
  if (typeof res.headers.getSetCookie === 'function') list = res.headers.getSetCookie();
  else { const sc = res.headers.get('set-cookie'); if (sc) list = [sc]; }
  for (const c of list) {
    const first = c.split(';')[0];
    const eq = first.indexOf('=');
    if (eq > 0) jar.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}
function csrfHeader() {
  // XSRF/CSRF 토큰 쿠키가 있으면 헤더로 되돌려줌 (있을 때만)
  for (const [k, v] of jar) {
    if (/xsrf|csrf/i.test(k)) return { 'X-XSRF-TOKEN': decodeURIComponent(v) };
  }
  return {};
}

/* ───────────────────────── 저수준 호출 ───────────────────────── */
async function post(path, bodyObj) {
  const url = BASE + path.replace(/^\//, '');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(cookieHeader() ? { Cookie: cookieHeader() } : {}),
      ...csrfHeader(),
    },
    body: JSON.stringify(bodyObj ?? {}),
    redirect: 'manual',
  });
  storeCookies(res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML 등 */ }
  return { status: res.status, ok: res.ok, json, text };
}

// 업무 조회 표준: { SEARCH: {...} } → data 반환
async function apiSelect(path, search) {
  const r = await post(path, search !== undefined ? { SEARCH: search } : {});
  return { ...r, data: r.json ? r.json.data : null, message: r.json ? r.json.message : null };
}

/* ───────────────────────── 로그인 ───────────────────────── */
let loggedIn = false;
let loginDiag = null;

function loginBodies() {
  const id = ENV.KYSS_ID, pw = ENV.KYSS_PW;
  const f = (ENV.KYSS_LOGIN_ID_FIELD || '').trim();
  const g = (ENV.KYSS_LOGIN_PW_FIELD || '').trim();
  if (f && g) return [{ [f]: id, [g]: pw }];
  // 흔한 조합들을 순서대로 시도
  return [
    { ID: id, PW: pw },
    { USER_ID: id, PASSWORD: pw },
    { userId: id, password: pw },
    { USER_ID: id, USER_PW: pw },
    { id, pw },
    { loginId: id, loginPw: pw },
    // 위 어느 것도 안 맞으면 서버가 무시할 여분 필드까지 합쳐 한 번 더
    { ID: id, PW: pw, USER_ID: id, PASSWORD: pw, userId: id, password: pw },
  ];
}

async function ensureLogin() {
  if (loggedIn) return true;
  if (!ENV.KYSS_ID || !ENV.KYSS_PW) {
    loginDiag = { ok: false, reason: '.env 에 KYSS_ID / KYSS_PW 가 없습니다.' };
    return false;
  }
  const tried = [];
  for (const body of loginBodies()) {
    jar.clear();
    const r = await post('login', body);
    const okShape = r.ok && r.json && (r.json.message == null || /success|성공/i.test(String(r.json.message)));
    const gotCookie = jar.size > 0;
    tried.push({ fields: Object.keys(body).join(','), status: r.status, cookie: gotCookie, message: r.json ? r.json.message : (r.text || '').slice(0, 120) });
    if (okShape && gotCookie) {
      // 세션 확인
      const s = await post('session', {});
      loggedIn = true;
      loginDiag = { ok: true, usedFields: Object.keys(body).join(','), cookies: [...jar.keys()], session: s.json ? (s.json.data || s.json) : null };
      return true;
    }
  }
  loginDiag = { ok: false, reason: '로그인 실패 - 아래 시도 로그와 실제 요청 스키마를 확인하세요.', tried };
  return false;
}

/* ───────────────────────── 유틸: 리스트/필드 추출 ───────────────────────── */
function pickList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object') return [];
  const prefer = ['GRID_LIST', 'DATA', 'LIST', 'ROWS'];
  for (const k of prefer) if (Array.isArray(data[k])) return data[k];
  for (const k of Object.keys(data)) if (Array.isArray(data[k]) && data[k].length && typeof data[k][0] === 'object') return data[k];
  for (const k of Object.keys(data)) if (Array.isArray(data[k])) return data[k];
  return [];
}
const toNum = (v) => { const n = Number(String(v ?? '').replace(/[,\s]/g, '')); return isFinite(n) ? n : 0; };
function findKey(row, patterns) {
  const keys = Object.keys(row || {});
  for (const p of patterns) { const k = keys.find((x) => p.test(x)); if (k) return k; }
  return null;
}

/* ───────────────────────── 영업사원 목록 ───────────────────────── */
// 여러 후보 엔드포인트를 시도해서 처음으로 이름+코드가 담긴 목록을 반환
async function getReps() {
  const attempts = [
    ['picList', undefined],
    ['code/selectUserCode', {}],
    ['cms/popup/selectCommonPopupPic', { POP_TP: 'PIC', title: '담당자' }],
    ['cms/popup/selectCommonPopupPic', {}],
  ];
  const diag = [];
  for (const [path, search] of attempts) {
    try {
      const r = await apiSelect(path, search);
      const list = pickList(r.data);
      diag.push({ path, status: r.status, count: list.length, sample: list[0] || null });
      if (list.length) {
        const codeK = findKey(list[0], [/^OP_PIC$/i, /PIC.*CD/i, /USER.*CD/i, /^CD$/i, /CODE/i, /_ID$/i]);
        const nameK = findKey(list[0], [/PIC.*NM/i, /USER.*NM/i, /^NM$/i, /NAME/i, /명$/]);
        const deptK = findKey(list[0], [/DEPT.*NM/i, /DEPT/i, /부서/]);
        const brK = findKey(list[0], [/BRANCH.*NM/i, /BRANCH/i, /영업소/]);
        const reps = list.map((r0) => ({
          code: r0[codeK] ?? '',
          name: r0[nameK] ?? (r0[codeK] ?? ''),
          dept: deptK ? r0[deptK] : '',
          branch: brK ? r0[brK] : '',
          _raw: r0,
        })).filter((x) => x.code || x.name);
        // 코드 기준 중복 제거
        const seen = new Set(); const uniq = [];
        for (const x of reps) { const key = String(x.code || x.name); if (seen.has(key)) continue; seen.add(key); uniq.push(x); }
        return { reps: uniq, source: path, diag };
      }
    } catch (e) { diag.push({ path, error: String(e).slice(0, 200) }); }
  }
  return { reps: [], source: null, diag };
}

/* ───────────────────────── 선택 사원 실적 리포트 ───────────────────────── */
const ym1 = (y, m) => `${y}-${String(m).padStart(2, '0')}-01`;

async function getReport(pic, year, branch) {
  const Y = Number(year) || new Date().getFullYear();
  const diag = [];
  const search = {
    DATE_FM: ym1(Y, 1), DATE_TO: ym1(Y, 12),
    BF_DATE_FM: ym1(Y - 1, 1), BF_DATE_TO: ym1(Y - 1, 12),
    OP_PIC: pic || null,
    BRANCH: branch || null,
    OP_DEPT: null,
    PAY_ZERO: 'Y',
  };

  // 여러 통계 엔드포인트를 병렬로 호출 (실패해도 대시보드는 뜨도록 개별 try)
  async function tryCall(label, path, extra) {
    try {
      const r = await apiSelect(path, { ...search, ...(extra || {}) });
      const list = pickList(r.data);
      diag.push({ label, path, status: r.status, message: r.message, count: list.length, sample: list[0] || null });
      return list;
    } catch (e) { diag.push({ label, path, error: String(e).slice(0, 200) }); return []; }
  }

  const [manSales, manOuts, byCorp, unpaid, orders] = await Promise.all([
    tryCall('내 월별 매출', 'outputs/statssales/selectManSalesList'),
    tryCall('내 월별 실적', 'outputs/statssales/selectManOutsList'),
    tryCall('업체별', 'outputs/statssales/selectMonCorpSalesList'),
    tryCall('청구처별 미수', 'outputs/statssales/selectCorpUnpaidList'),
    tryCall('오더 접수현황', 'outputs/management/selectOrdersList'),
  ]);

  // 월별 집계: 매출/실적 목록에서 월·금액 필드를 자동 감지해 합산
  function monthly(list) {
    if (!list.length) return [];
    const mK = findKey(list[0], [/^MONTH$/i, /YM/i, /연월/, /DATE/i]);
    const billK = findKey(list[0], [/BILL.*AMOUNT/i, /SALE.*AMT/i, /매출/, /청구/]);
    const payK = findKey(list[0], [/PAY.*AMOUNT/i, /하불/]);
    const profK = findKey(list[0], [/PROFIT(?!_PER)/i, /이익(?!율)/]);
    const perK = findKey(list[0], [/PROFIT_PER/i, /이익율/]);
    const cntK = findKey(list[0], [/ALLO_CNT/i, /CNT/i, /건수/]);
    const acc = {};
    for (const r of list) {
      const mo = String(r[mK] ?? '').slice(0, 7) || '?';
      const a = acc[mo] || (acc[mo] = { month: mo, bill: 0, pay: 0, profit: 0, cnt: 0, _per: [] });
      a.bill += toNum(r[billK]); a.pay += toNum(r[payK]); a.profit += toNum(r[profK]);
      a.cnt += toNum(r[cntK]); if (perK) a._per.push(toNum(r[perK]));
    }
    return Object.values(acc).sort((x, y) => x.month.localeCompare(y.month)).map((a) => ({
      month: a.month, bill: a.bill, pay: a.pay,
      profit: a.profit || (a.bill - a.pay),
      per: a.bill ? +(( (a.profit || a.bill - a.pay) / a.bill) * 100).toFixed(1) : 0,
      cnt: a.cnt,
    }));
  }

  const mon = monthly(manSales.length ? manSales : manOuts);
  const sum = mon.reduce((s, m) => ({ bill: s.bill + m.bill, pay: s.pay + m.pay, profit: s.profit + m.profit, cnt: s.cnt + m.cnt }), { bill: 0, pay: 0, profit: 0, cnt: 0 });
  const kpi = {
    bill: sum.bill, pay: sum.pay, profit: sum.profit, cnt: sum.cnt,
    per: sum.bill ? +((sum.profit / sum.bill) * 100).toFixed(1) : 0,
    latestMonth: mon.length ? mon[mon.length - 1] : null,
  };

  return {
    ok: mon.length > 0 || byCorp.length > 0,
    pic, year: Y, kpi, monthly: mon,
    byCorp: byCorp.slice(0, 200),
    unpaid: unpaid.slice(0, 200),
    orders: orders.slice(0, 200),
    diag,
  };
}

/* ───────────────────────── HTTP 서버 ───────────────────────── */
function sendJson(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length });
  res.end(b);
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (u.pathname === '/' || u.pathname === '/index.html') {
      const html = readFileSync(join(__dir, 'dashboard.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (u.pathname === '/api/status') {
      const ok = await ensureLogin();
      return sendJson(res, 200, { loggedIn: ok, base: BASE, defaults: { branch: ENV.DEFAULT_BRANCH || '', pic: ENV.DEFAULT_OP_PIC || '' }, login: loginDiag });
    }

    if (u.pathname === '/api/reps') {
      if (!(await ensureLogin())) return sendJson(res, 401, { error: '로그인 필요', login: loginDiag });
      return sendJson(res, 200, await getReps());
    }

    if (u.pathname === '/api/report') {
      if (!(await ensureLogin())) return sendJson(res, 401, { error: '로그인 필요', login: loginDiag });
      const pic = u.searchParams.get('pic') || '';
      const year = u.searchParams.get('year') || new Date().getFullYear();
      const branch = u.searchParams.get('branch') || '';
      return sendJson(res, 200, await getReport(pic, year, branch));
    }

    // 스키마 발굴용 임의 조회 (개발/디버그)  /api/raw?path=...&search={"...":".."}
    if (u.pathname === '/api/raw') {
      if (!(await ensureLogin())) return sendJson(res, 401, { error: '로그인 필요', login: loginDiag });
      const path = u.searchParams.get('path');
      let search; try { const s = u.searchParams.get('search'); search = s ? JSON.parse(s) : undefined; } catch { search = undefined; }
      if (!path) return sendJson(res, 400, { error: 'path 파라미터 필요' });
      const r = await apiSelect(path, search);
      return sendJson(res, 200, { status: r.status, message: r.message, data: r.data, listCount: pickList(r.data).length });
    }

    sendJson(res, 404, { error: 'not found' });
  } catch (e) {
    sendJson(res, 500, { error: String(e && e.stack || e) });
  }
});

server.listen(PORT, () => {
  console.log(`\n  KYSS 영업 대시보드  →  http://localhost:${PORT}\n`);
  console.log(`  BASE   : ${BASE}`);
  console.log(`  계정   : ${ENV.KYSS_ID ? ENV.KYSS_ID : '(.env 에 KYSS_ID 없음!)'}`);
  console.log(`  브라우저에서 위 주소를 열어 영업사원을 선택하세요.\n`);
});
