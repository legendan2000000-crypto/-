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

/* ───────────────────────── 직원(영업사원) 목록 ───────────────────────── */
// 영업소 코드→명 (알려진 것만; 나머지는 코드 그대로)
const BRANCH_MAP = { B1: '본사', B4: '울산사무소', B6: '평택사무소', B11: '영남지사' };
// 회사명/거래처처럼 보이는 값은 직원 이름이 아님 → 제외
function isPersonName(s) {
  const v = String(s || '').trim();
  return v && !/\(주\)|\(유\)|㈜|주식회사|유한회사|담당자\s*$/.test(v);
}
function dedupSortReps(reps) {
  const seen = new Set(), out = [];
  for (const x of reps) {
    if (!x.code || !x.name) continue;
    const k = String(x.code); if (seen.has(k)) continue; seen.add(k); out.push(x);
  }
  out.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));
  return out;
}

let repsCache = null;
const monCorpCache = new Map(); // key: `${pic}|${year}` → 원본 행 배열
// 내부 직원 목록. code/selectUserCode(216, 가볍고 정확)를 1순위로.
async function getReps(force) {
  if (repsCache && !force) return repsCache;
  const diag = [];

  // 1순위: 내부 사용자 코드목록 { CODE, NAME, BRANCH, DEPT }
  try {
    const r = await apiSelect('code/selectUserCode', {});
    const list = pickList(r.data);
    diag.push({ path: 'code/selectUserCode', status: r.status, count: list.length, sample: list[0] || null });
    const reps = dedupSortReps(list.map((x) => ({
      code: x.CODE ?? x.USER_ID ?? '',
      name: x.NAME ?? x.USER_LOC_NM ?? '',
      dept: x.DEPT_NM ?? x.DEPT ?? '',
      branch: x.BRANCH_NM ?? BRANCH_MAP[x.BRANCH] ?? x.BRANCH ?? '',
      _raw: x,
    })).filter((x) => isPersonName(x.name)));
    if (reps.length >= 10) { repsCache = { reps, source: 'code/selectUserCode', diag }; return repsCache; }
  } catch (e) { diag.push({ path: 'code/selectUserCode', error: String(e).slice(0, 200) }); }

  // 2순위: 직원관리 전체에서 직원/영업만 (무겁지만 이름·부서 상세)
  try {
    const r = await apiSelect('cms/comm/selectCmsUserMgt', { USE_YN: 'Y' });
    const list = pickList(r.data).filter((x) => x.EMP_YN === 'Y' || x.SALES_YN === 'Y');
    diag.push({ path: 'cms/comm/selectCmsUserMgt', status: r.status, count: list.length, sample: list[0] || null });
    const reps = dedupSortReps(list.map((x) => ({
      code: x.USER_ID ?? x.EMP_NO ?? '',
      name: x.USER_LOC_NM ?? x.USER_ENG_NM ?? '',
      dept: x.DEPT_NM ?? '', branch: x.BRANCH_NM ?? BRANCH_MAP[x.BRANCH] ?? x.BRANCH ?? '',
      _raw: x,
    })).filter((x) => isPersonName(x.name)));
    if (reps.length) { repsCache = { reps, source: 'cms/comm/selectCmsUserMgt', diag }; return repsCache; }
  } catch (e) { diag.push({ path: 'cms/comm/selectCmsUserMgt', error: String(e).slice(0, 200) }); }

  return { reps: [], source: null, diag };
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

async function getReport(pic, year, branch, period = 'M', month = '', name = '') {
  const Y = Number(year) || new Date().getFullYear();
  const MM = /^\d{1,2}$/.test(String(month)) ? String(month).padStart(2, '0') : ''; // 특정 월(빈값=연간)
  const diag = [];

  // selectManSalesList = "영업담당자별 매출현황" (실측 캡처):
  //   필수 SEARCH: SCH_DT="BILL_DT", DATE_FM/DATE_TO="YYYY-MM-01"(단일월), OP_PIC=담당자코드, OP_PIC_NM=이름
  // 연간(12개월)을 월별로 조회해 담당자·연도 기준으로 캐시 → 월 전환 즉시.
  const ckey = `${pic || ''}|${Y}`;
  let all = monCorpCache.get(ckey);
  if (all) {
    diag.push({ label: '담당자 매출(캐시)', cached: true, count: all.length });
  } else {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const perMonth = []; let sample = null;
    const results = await Promise.all(months.map(async (mm) => {
      const d = `${Y}-${mm}-01`;
      const r = await apiSelect('outputs/statssales/selectManSalesList', {
        SCH_DT: 'BILL_DT', DATE_FM: d, DATE_TO: d, OP_PIC: pic || null, OP_PIC_NM: name || null,
      });
      const list = pickList(r.data);
      perMonth.push({ mm, status: r.status, count: list.length, message: r.message });
      if (!sample && list.length) sample = list[0];
      return list.map((x) => ({ ...x, __MM: `${Y}-${mm}` }));
    }));
    all = results.flat();
    monCorpCache.set(ckey, all);
    perMonth.sort((a, b) => a.mm.localeCompare(b.mm));
    diag.push({ label: '담당자 매출(월별)', path: 'outputs/statssales/selectManSalesList', perMonth, sample });
  }

  // 금액·업체 필드 자동 감지 (스키마 미검증 대비 - 확인되면 고정)
  const s0 = all[0] || {};
  const K = (known, pats) => (s0[known] != null ? known : findKey(s0, pats));
  const billK = K('B_PRICE', [/B_PRICE/i, /BILL.*(AMT|PRICE|AMOUNT)/i, /SALE.*AMT/i, /매출/, /청구/]);
  const payK = K('P_PRICE', [/P_PRICE/i, /PAY.*(AMT|PRICE|AMOUNT)/i, /하불/]);
  const profK = K('PROFIT', [/PROFIT/i, /이익(?!율)/]);
  const corpK = K('CORP_LOC_NM', [/CORP.*NM/i, /SHIPPER.*NM/i, /거래처/, /업체/, /화주/]);
  const val = (r, k) => (k ? toNum(r[k]) : 0);
  const cntrSum = (r) => Object.keys(r).filter((k) => /_CNTR$/.test(k)).reduce((s, k) => s + toNum(r[k]), 0);

  // 월 필터
  let rows = all;
  if (MM) rows = all.filter((r) => r.__MM === `${Y}-${MM}`);

  // 월별 집계
  const acc = {};
  for (const r of rows) {
    const key = bucketKey(r.__MM, period) || r.__MM;
    const a = acc[key] || (acc[key] = { month: key, bill: 0, pay: 0, profit: 0, cnt: 0 });
    a.bill += val(r, billK); a.pay += val(r, payK); a.profit += val(r, profK); a.cnt += cntrSum(r);
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
    const nm = (corpK && r[corpK]) || r.BILL_CORP || '(미상)';
    const a = cacc[nm] || (cacc[nm] = { corp: nm, bill: 0, pay: 0, profit: 0, cnt: 0 });
    a.bill += val(r, billK); a.pay += val(r, payK); a.profit += val(r, profK); a.cnt += cntrSum(r);
  }
  const byCorp = Object.values(cacc)
    .sort((x, y) => y.bill - x.bill).slice(0, 300)
    .map((a) => ({ 업체: a.corp, 매출: a.bill, 하불: a.pay, 이익: a.profit, '이익율': a.bill ? +((a.profit / a.bill) * 100).toFixed(1) : 0, 물동량: a.cnt }));

  const note = all.length ? undefined
    : '이 담당자·연도의 매출이 없습니다 (또는 담당자코드 불일치). 아래 진단을 확인하세요.';

  return {
    ok: mon.length > 0, pic, name, year: Y, month: MM, period, kpi, monthly: mon, byCorp,
    unpaid: [], orders: [], note, diag,
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
      return sendJson(res, 200, await getReps(u.searchParams.get('fresh') === '1'));
    }

    if (u.pathname === '/api/report') {
      if (!(await ensureLogin())) return sendJson(res, 401, { error: '로그인 필요', login: loginDiag });
      const pic = u.searchParams.get('pic') || '';
      const year = u.searchParams.get('year') || new Date().getFullYear();
      const branch = u.searchParams.get('branch') || '';
      const period = (u.searchParams.get('period') || 'M').toUpperCase();
      const month = u.searchParams.get('month') || '';
      const name = u.searchParams.get('name') || '';
      return sendJson(res, 200, await getReport(pic, year, branch, period, month, name));
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
