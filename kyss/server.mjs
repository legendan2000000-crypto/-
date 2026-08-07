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
async function post(path, bodyObj, timeoutMs = 20000) {
  const url = BASE + path.replace(/^\//, '');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs); // 응답 무한대기 방지
  try {
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
      signal: ctl.signal,
    });
    storeCookies(res);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* HTML 등 */ }
    return { status: res.status, ok: res.ok, json, text };
  } catch (e) {
    const timedOut = e && e.name === 'AbortError';
    return { status: 0, ok: false, json: null, text: timedOut ? `timeout ${timeoutMs}ms` : String(e), error: true };
  } finally {
    clearTimeout(timer);
  }
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
  const id = ENV.KYSS_ID, pw = ENV.KYSS_PW || '';
  const lang = ENV.KYSS_LANG || 'ko';
  // KYSS 실제 로그인 형식(네트워크 캡처로 확인):
  //   { p: 아이디, c: 비밀번호, lang: "ko" }
  //   비밀번호 앞에는 "!!" 접두어가 붙는다.
  const prefix = (ENV.KYSS_PW_PREFIX !== undefined ? ENV.KYSS_PW_PREFIX : '!!');
  const withPrefix = pw.startsWith(prefix) ? pw : prefix + pw; // 중복 방지
  return [
    { p: id, c: withPrefix, lang },   // 1순위: !! 접두어 포함 (확인된 형식)
    { p: id, c: pw, lang },           // 2순위: 접두어 없이 원문
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
    const failMsg = r.json && r.json.message && /등록되지|않은|틀|실패|invalid|fail|error|unauthor/i.test(String(r.json.message));
    const okShape = r.status === 200 && !failMsg;
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
function normalizeReps(list) {
  if (!list.length) return [];
  const codeK = findKey(list[0], [/^OP_PIC$/i, /PIC.*CD/i, /USER.*CD/i, /EMP.*NO/i, /^CD$/i, /CODE/i, /_ID$/i]);
  const nameK = findKey(list[0], [/PIC.*NM/i, /USER.*NM/i, /EMP.*NM/i, /^NM$/i, /NAME/i, /명$/]);
  const deptK = findKey(list[0], [/DEPT.*NM/i, /DEPT/i, /부서/]);
  const brK = findKey(list[0], [/BRANCH.*NM/i, /BRANCH/i, /영업소/]);
  const reps = list.map((r0) => ({
    code: r0[codeK] ?? '', name: r0[nameK] ?? (r0[codeK] ?? ''),
    dept: deptK ? r0[deptK] : '', branch: brK ? r0[brK] : '', _raw: r0,
  })).filter((x) => x.code || x.name);
  const seen = new Set(); const uniq = [];
  for (const x of reps) { const k = String(x.code || x.name); if (seen.has(k)) continue; seen.add(k); uniq.push(x); }
  return uniq;
}

// 전 직원 목록: 여러 후보를 모두 호출해서 "가장 많이" 반환한 것을 채택
async function getReps() {
  const attempts = [
    ['cms/popup/selectCommonPopupPic', { POP_TP: 'PIC' }],
    ['cms/popup/selectCommonPopupPic', {}],
    ['cms/comm/selectCmsUserMgt', {}],
    ['cms/comm/selectCmsUserMgt', { USE_YN: 'Y' }],
    ['code/selectUserCode', {}],
    ['cms/popup/selectCommonPopupCorpUser', {}],
    ['picList', {}],
    ['picList', undefined],
  ];
  const diag = [];
  let best = { reps: [], source: null };
  for (const [path, search] of attempts) {
    try {
      const r = await apiSelect(path, search);
      const list = pickList(r.data);
      const reps = normalizeReps(list);
      diag.push({ path, status: r.status, count: list.length, usable: reps.length, sample: list[0] || null });
      if (reps.length > best.reps.length) best = { reps, source: path };
    } catch (e) { diag.push({ path, error: String(e).slice(0, 200) }); }
  }
  // 이름 가나다 정렬
  best.reps.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));
  return { reps: best.reps, source: best.source, diag };
}

/* ───────────────────────── 선택 사원 실적 리포트 ───────────────────────── */
const ym1 = (y, m) => `${y}-${String(m).padStart(2, '0')}-01`;

// 날짜 정규화 + 기간 버킷 키
function normDate(v) {
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{4})(\d{2})$/); if (m) return `${m[1]}-${m[2]}`;
  return s.replace(/[.\/]/g, '-');
}
function bucketKey(dateStr, period) {
  const s = String(dateStr || '');
  if (period === 'D') return s.slice(0, 10);
  if (period === 'W') {
    const d = new Date(s.slice(0, 10));
    if (isNaN(d)) return s.slice(0, 7);
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = (dt.getUTCDay() + 6) % 7; dt.setUTCDate(dt.getUTCDate() - day + 3);
    const firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((dt - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
    return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  return s.slice(0, 7); // 'M'
}
function findDateKey(row) {
  let best = null, bestLen = 0;
  for (const k of Object.keys(row || {})) {
    const m = String(row[k] ?? '').match(/^(\d{4})[-.\/]?(\d{2})([-.\/]?\d{2})?/);
    if (m) { const len = m[3] ? 10 : 7; if (len > bestLen) { best = k; bestLen = len; } }
  }
  return best;
}

async function getReport(pic, year, branch, period = 'M', month = '') {
  const Y = Number(year) || new Date().getFullYear();
  const MM = /^\d{1,2}$/.test(String(month)) ? String(month).padStart(2, '0') : ''; // 특정 월(빈값=연간)
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

  // 주력 데이터: 월별·업체별 매출 (실측 검증됨). 나머지는 진단용으로 함께 시도.
  const [monCorp, manSales, manOuts, unpaid, orders] = await Promise.all([
    tryCall('월별·업체별(주력)', 'outputs/statssales/selectMonCorpSalesList'),
    tryCall('내 월별 매출', 'outputs/statssales/selectManSalesList'),
    tryCall('내 월별 실적', 'outputs/statssales/selectManOutsList'),
    tryCall('청구처별 미수', 'outputs/statssales/selectCorpUnpaidList'),
    tryCall('오더 접수현황', 'outputs/management/selectOrdersList'),
  ]);

  // selectMonCorpSalesList 행 스키마(실측):
  //   YYYYMM, B_PRICE(매출/청구), P_PRICE(하불), PROFIT(이익),
  //   CORP_LOC_NM(업체), BILL_CORP(청구처코드), *_CNTR(컨테이너 수량들)
  const cntrSum = (r) => Object.keys(r).filter((k) => /_CNTR$/.test(k)).reduce((s, k) => s + toNum(r[k]), 0);

  // 선택 연도 우선(응답에 전년 데이터가 섞여 오므로). 없으면 전체.
  let rows = monCorp;
  const inYear = monCorp.filter((r) => String(r.YYYYMM || '').startsWith(String(Y)));
  if (inYear.length) rows = inYear;
  // 특정 월 선택 시 그 달만
  if (MM) rows = rows.filter((r) => String(r.YYYYMM || '').slice(0, 7) === `${Y}-${MM}`);

  // 기간(월/주/일) 집계 — 주력 데이터는 월 단위이므로 주/일은 월로 수렴
  const acc = {};
  for (const r of rows) {
    const key = bucketKey(normDate(r.YYYYMM), period) || '?';
    const a = acc[key] || (acc[key] = { month: key, bill: 0, pay: 0, profit: 0, cnt: 0 });
    a.bill += toNum(r.B_PRICE); a.pay += toNum(r.P_PRICE); a.profit += toNum(r.PROFIT); a.cnt += cntrSum(r);
  }
  const mon = Object.values(acc).sort((x, y) => x.month.localeCompare(y.month)).map((a) => ({
    month: a.month, bill: a.bill, pay: a.pay, profit: a.profit || (a.bill - a.pay),
    per: a.bill ? +(((a.profit || a.bill - a.pay) / a.bill) * 100).toFixed(1) : 0, cnt: a.cnt,
  }));

  const sum = mon.reduce((s, m) => ({ bill: s.bill + m.bill, pay: s.pay + m.pay, profit: s.profit + m.profit, cnt: s.cnt + m.cnt }), { bill: 0, pay: 0, profit: 0, cnt: 0 });
  const kpi = {
    bill: sum.bill, pay: sum.pay, profit: sum.profit, cnt: sum.cnt,
    per: sum.bill ? +((sum.profit / sum.bill) * 100).toFixed(1) : 0,
    latestMonth: mon.length ? mon[mon.length - 1] : null,
  };

  // 업체별 랭킹 (매출 큰 순)
  const cacc = {};
  for (const r of rows) {
    const nm = r.CORP_LOC_NM || r.BILL_CORP || '(미상)';
    const a = cacc[nm] || (cacc[nm] = { corp: nm, bill: 0, pay: 0, profit: 0, cnt: 0 });
    a.bill += toNum(r.B_PRICE); a.pay += toNum(r.P_PRICE); a.profit += toNum(r.PROFIT); a.cnt += cntrSum(r);
  }
  const byCorp = Object.values(cacc)
    .sort((x, y) => y.bill - x.bill)
    .slice(0, 300)
    .map((a) => ({ 업체: a.corp, 매출: a.bill, 하불: a.pay, 이익: a.profit, '이익율': a.bill ? +((a.profit / a.bill) * 100).toFixed(1) : 0, 물동량: a.cnt }));

  const note = monCorp.length ? undefined
    : '주력 데이터(월별·업체별) 조회 실패 - 아래 진단을 확인하세요.';

  return {
    ok: mon.length > 0, pic, year: Y, month: MM, period, kpi, monthly: mon, byCorp,
    unpaid: unpaid.slice(0, 200),
    orders: orders.slice(0, 200),
    note, diag,
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
      const period = (u.searchParams.get('period') || 'M').toUpperCase();
      const month = u.searchParams.get('month') || '';
      return sendJson(res, 200, await getReport(pic, year, branch, period, month));
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
  console.log(`\n  KYSS Sales Dashboard  ->  http://localhost:${PORT}\n`);
  console.log(`  BASE : ${BASE}`);
  console.log(`  ID   : ${ENV.KYSS_ID ? ENV.KYSS_ID : '(no KYSS_ID in .env !)'}`);
  console.log(`  Open the address above in your browser. Do NOT close this window.\n`);
});
