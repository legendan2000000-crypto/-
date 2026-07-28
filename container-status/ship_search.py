# -*- coding: utf-8 -*-
"""
전국 컨테이너 터미널 · 선박명 통합 검색 (실시간 자동갱신)
- 로그인 없이 각 터미널의 '공개 선박 스케줄'을 PC가 직접 조회 → 합쳐서 한 화면에
- 작은 로컬 서버가 계속 돌면서 화면을 몇 분마다 자동 갱신(실시간)
- 선박명을 입력하면 어느 항/터미널/선석에 언제 접안(예정)인지 바로 검색

현재 커버(항 · 터미널):
  [부산] PNC(신항1,Playwright)·PNIT(신항2)·HJNC(신항3)·HPNT(신항4)·BNCT(신항5)·DGT(서컨)·BPT(북항 신선대·감만)
  [평택] PCTC
  [인천] iCON 통합(선광·한진·E1·ICT 등 전 터미널)
  [광양] GWCT(서부)·KITL(허치슨)
  [울산] UNCT(울산신항)
추가 예정: 울산 JUCT(정일, 접근 차단)

사용: 실행.bat 더블클릭 → 브라우저가 자동으로 열림. 검은 창은 열어두세요(닫으면 갱신 멈춤).
"""
import os, sys, re, json, time, threading, datetime, webbrowser, ssl
import urllib.request, urllib.parse, http.cookiejar
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    from playwright.sync_api import sync_playwright
    HAS_PW = True
except Exception:
    HAS_PW = False

PORT = 8737
REFRESH_SEC = 120          # 화면 자동갱신 주기(초)
CACHE_TTL = 90             # 서버 재조회 최소 간격(초)

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
COLS = ["항", "터미널", "선사", "선명", "선석", "접안예정", "출항예정", "상태", "모선항차", "ROUTE"]

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def date_range():
    today = datetime.date.today()
    return ((today - datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
            (today + datetime.timedelta(days=14)).strftime("%Y-%m-%d"))


def new_session():
    cj = http.cookiejar.CookieJar()
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cj),
        urllib.request.HTTPSHandler(context=_SSL_CTX))


def http_req(opener, url, data=None, headers=None, encoding="utf-8", timeout=30):
    h = {"User-Agent": UA, "Accept-Encoding": "identity", "Accept-Language": "ko,en;q=0.8"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, headers=h)
    op = opener or urllib.request.build_opener(urllib.request.HTTPSHandler(context=_SSL_CTX))
    with op.open(req, timeout=timeout) as r:
        return r.read().decode(encoding, errors="replace")


def first(*vals):
    for v in vals:
        if v is not None and str(v).strip() != "":
            return str(v).strip()
    return ""


# ------------------------- HTML 표 파서 -------------------------
class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self._tbl, self._row, self._cell = [], None, None, None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self._tbl = []
        elif tag == "tr" and self._tbl is not None:
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None:
            self._row.append(re.sub(r"\s+", " ", "".join(self._cell)).strip())
            self._cell = None
        elif tag == "tr" and self._row is not None:
            self._tbl.append(self._row); self._row = None
        elif tag == "table" and self._tbl is not None:
            self.tables.append(self._tbl); self._tbl = None


def parse_tables(html):
    p = TableParser(); p.feed(html); return p.tables


def pick_table(tables, must_have):
    for tbl in tables:
        for i, row in enumerate(tbl[:3]):
            if all(any(k in c for c in row) for k in must_have):
                return i, tbl
    return None, None


def cidx(header, *keys):
    for i, h in enumerate(header):        # 정확 일치 우선 (예: '선사' vs '선사항차')
        if h.strip() in keys:
            return i
    for i, h in enumerate(header):        # 부분 일치
        for k in keys:
            if k in h:
                return i
    return -1


# ------------------------- 터미널별 조회기 -------------------------
def _fetch_psa(base, tname):
    """PSA 계열(PNIT·HPNT) 공통: infoservice/vessel/vslScheduleList.jsp HTML 표."""
    d0, d1 = date_range()
    url = base + "/infoservice/vessel/vslScheduleList.jsp?isSearch=Y&strdStDate=%s&strdEdDate=%s" % (d0, d1)
    html = http_req(None, url)
    hidx, tbl = pick_table(parse_tables(html), ["선명", "접안", "선석"])
    if not tbl:
        raise RuntimeError("%s 표 없음" % tname)
    hdr = tbl[hidx]
    ix = {k: cidx(hdr, *v) for k, v in {
        "선석": ["선석"], "선사": ["선사"], "선명": ["선명"], "접안예정": ["접안"],
        "출항예정": ["출항"], "상태": ["상태"], "모선항차": ["모선항차", "모선"], "ROUTE": ["ROUTE"]}.items()}
    rows = []
    for r in tbl[hidx + 1:]:
        if ix["선명"] < 0 or len(r) <= ix["선명"]:
            continue
        nm = r[ix["선명"]].strip()
        if not nm or nm.upper() == "ROUTE":
            continue
        g = lambda k: (r[ix[k]].strip() if 0 <= ix[k] < len(r) else "")
        rec = {"터미널": tname, "선사": g("선사"), "선명": nm, "선석": g("선석"),
               "접안예정": g("접안예정"), "출항예정": g("출항예정"), "상태": g("상태"),
               "모선항차": g("모선항차"), "ROUTE": g("ROUTE")}
        if rec["접안예정"] or rec["선석"]:
            rows.append(rec)
    return rows


def fetch_pnit():
    return _fetch_psa("https://www.pnitl.com", "PNIT(신항2)")


def fetch_hpnt():
    return _fetch_psa("https://www.hpnt.co.kr", "HPNT(신항4)")


def fetch_bnct():
    """부산 신항 5부두 BNCT — /esvc GET list(JSON). 도메인 info.bnctkorea.com."""
    d0, d1 = date_range()
    op = new_session()
    base = "http://info.bnctkorea.com"
    http_req(op, base + "/esvc/vessel/berthScheduleT")  # 세션 초기화
    url = base + "/esvc/vessel/berthScheduleT/list?VVD=&StrDate=%s&EndDate=%s" % (d0, d1)
    data = json.loads(http_req(op, url, headers={"X-Requested-With": "XMLHttpRequest",
                                                 "Referer": base + "/esvc/vessel/berthScheduleT"}))
    if isinstance(data, dict):
        data = data.get("list") or data.get("data") or data.get("rows") or []
    rows = []
    for v in data:
        nm = first(v.get("VSLNAME"))
        if not nm:
            continue
        rows.append({"터미널": "BNCT(신항5)", "선사": first(v.get("OPERATOR")), "선명": nm,
                     "선석": first(v.get("BERTHNO")) + (("/" + first(v.get("BERTHSIDE"))) if v.get("BERTHSIDE") else ""),
                     "접안예정": first(v.get("ETBDATE"), v.get("ATBDATE"), v.get("ETADATE"), v.get("ATADATE")),
                     "출항예정": first(v.get("ETDDATE"), v.get("ATDDATE")),
                     "상태": first(v.get("VSLSTATE")), "모선항차": first(v.get("VVD")),
                     "ROUTE": first(v.get("ROUTE"))})
    return rows


def _fetch_esvc_data(base, tname):
    """eXVantage /esvc berthScheduleT/data 계열(HJNC·PCTC 등) 공통."""
    d0, d1 = date_range()
    op = new_session()
    http_req(op, base + "/esvc/vessel/berthScheduleT")
    url = (base + "/esvc/vessel/berthScheduleT/data"
           "?startDate=%s&endDate=%s&sort=&dateType=&route=&oper=&amount=2000&page=1" % (d0, d1))
    js = json.loads(http_req(op, url, headers={"X-Requested-With": "XMLHttpRequest",
                                               "Referer": base + "/esvc/vessel/berthScheduleT"}))
    sc = js.get("stringContent")
    data = json.loads(sc) if isinstance(sc, str) else (sc or js.get("content") or [])
    rows = []
    for v in data:
        nm = first(v.get("VSL_NM"))
        if not nm:
            continue
        rows.append({"터미널": tname, "선사": first(v.get("PTNR_CODE")), "선명": nm,
                     "선석": first(v.get("BERTH_NO")) + (("/" + first(v.get("ALONGSIDE"))) if v.get("ALONGSIDE") else ""),
                     "접안예정": first(v.get("ETB"), v.get("ATB"), v.get("ATA")),
                     "출항예정": first(v.get("ETD"), v.get("ATD")),
                     "상태": first(v.get("STATUS"), v.get("ALTER_STATUS")),
                     "모선항차": first(v.get("VOY_NO")), "ROUTE": first(v.get("OUT_LANE"))})
    return rows


def fetch_hjnc():
    return _fetch_esvc_data("https://www.hjnc.co.kr", "HJNC(신항3)")


def fetch_pctc():
    return _fetch_esvc_data("http://www.pctc21.com", "PCTC(평택한진)")


def fetch_pnct():
    """평택 동방아이포트 PNCT — Nexacro 앱. 로그인 없이 selectVslList.do XML POST(STR_DATE/END_DATE yyyyMMdd)."""
    from html import unescape
    d0, d1 = date_range()
    body = ('<?xml version="1.0" encoding="UTF-8"?>'
            '<Root xmlns="http://www.nexacroplatform.com/platform/dataset"><Parameters/>'
            '<Dataset id="ds_cond"><ColumnInfo>'
            '<Column id="STR_DATE" type="STRING" size="256"/><Column id="END_DATE" type="STRING" size="256"/>'
            '</ColumnInfo><Rows><Row>'
            '<Col id="STR_DATE">%s</Col><Col id="END_DATE">%s</Col>'
            '</Row></Rows></Dataset></Root>' % (d0.replace("-", ""), d1.replace("-", ""))).encode("utf-8")
    xml = http_req(None, "http://www.pnct.co.kr/c001/m002Ctr/selectVslList.do", data=body,
                   headers={"Content-Type": "text/xml; charset=UTF-8",
                            "Referer": "http://www.pnct.co.kr/infoservice/index.html"})
    i = xml.find('id="ds_list"'); seg = xml[i:] if i >= 0 else xml
    rows = []
    for rw in re.findall(r'<Row>(.*?)</Row>', seg, re.S):
        c = {m[0]: unescape(re.sub(r'\s+', ' ', m[1]).strip())
             for m in re.findall(r'<Col id="([^"]+)">(.*?)</Col>', rw, re.S)}
        nm = first(c.get("VSL_NAME"))
        if not nm:
            continue
        rows.append({"터미널": "PNCT(동방아이포트)", "선사": first(c.get("OPERATOR")), "선명": nm,
                     "선석": first(c.get("BERTH"), c.get("BERTH_NO")),
                     "접안예정": first(c.get("ETB_DATE"), c.get("ATB_DATE"), c.get("ETA_DATE")),
                     "출항예정": first(c.get("ETD_DATE"), c.get("ATD_DATE")),
                     "상태": first(c.get("VSL_STATE"), c.get("STATUS")),
                     "모선항차": first(c.get("VVD")), "ROUTE": first(c.get("ROUTE"))})
    return rows


def fetch_dgt():
    d0, d1 = date_range()
    op = new_session()
    base = "https://info.dgtbusan.com"
    page = http_req(op, base + "/DGT/esvc/vessel/berthScheduleT")
    m = re.search(r'name="_csrf"\s+content="([0-9a-fA-F-]{36})"', page)
    if not m:
        raise RuntimeError("DGT CSRF 없음")
    body = json.dumps({"fromDate": d0.replace("-", ""), "toDate": d1.replace("-", ""),
                       "vessel": "", "voyage": ""}).encode("utf-8")
    js = json.loads(http_req(op, base + "/DGT/esvc/vessel/vesselSchedule", data=body,
                             headers={"Content-Type": "application/json",
                                      "X-Requested-With": "XMLHttpRequest", "X-CSRF-TOKEN": m.group(1),
                                      "Referer": base + "/DGT/esvc/vessel/berthScheduleT"}))
    rows = []
    for v in js.get("vesselSchedules", []):
        nm = first(v.get("vesselName"))
        if not nm:
            continue
        rows.append({"터미널": "DGT(신항서컨)", "선사": first(v.get("carrier")), "선명": nm,
                     "선석": first(v.get("berthNo")) + (("/" + first(v.get("alongSide"))) if v.get("alongSide") else ""),
                     "접안예정": first(v.get("etb"), v.get("atb"), v.get("eta"), v.get("ata")),
                     "출항예정": first(v.get("etd"), v.get("atd")), "상태": first(v.get("status")),
                     "모선항차": first(v.get("inVoyage"), v.get("voyageSeq")), "ROUTE": first(v.get("serviceLane"))})
    return rows


def fetch_bpt():
    """북항 BPT(신선대+감만) — 선석현황 텍스트 servlet(POST, EUC-KR)."""
    d0, d1 = date_range()
    y1, m1, day1 = d0.split("-"); y2, m2, day2 = d1.split("-")
    body = urllib.parse.urlencode({"v_time": "term", "YEAR1": y1, "MONTH1": m1, "DAY1": day1,
                                   "YEAR2": y2, "MONTH2": m2, "DAY2": day2, "ROCD": "ALL",
                                   "v_oper_cd": "", "ORDER": "item1", "v_gu": "A"}).encode("euc-kr")
    html = http_req(None, "https://info.bptc.co.kr/Berth_status_text_servlet_sw_kr", data=body,
                    headers={"Content-Type": "application/x-www-form-urlencoded",
                             "Referer": "https://info.bptc.co.kr/content/sw/jsp/berth_status_text_sw_kr.jsp?p_id=BETX_SH_KR"},
                    encoding="euc-kr")
    hidx, tbl = pick_table(parse_tables(html), ["선박명", "선석"])
    if not tbl:
        raise RuntimeError("BPT 표 없음")
    hdr = tbl[hidx]
    ix = {"구분": cidx(hdr, "구분"), "선석": cidx(hdr, "선석"), "모선항차": cidx(hdr, "모선항차", "모선"),
          "선명": cidx(hdr, "선박명", "선명"), "접안": cidx(hdr, "접안"), "선사": cidx(hdr, "선사"),
          "입항예정": cidx(hdr, "입항 예정", "입항예정"), "입항": cidx(hdr, "입항일시"),
          "출항": cidx(hdr, "출항"), "항로": cidx(hdr, "항로")}
    rows = []
    for r in tbl[hidx + 1:]:
        if ix["선명"] < 0 or len(r) <= ix["선명"]:
            continue
        nm = r[ix["선명"]].strip()
        if not nm or nm in ("선박명",):
            continue
        g = lambda k: (r[ix[k]].strip() if 0 <= ix[k] < len(r) else "")
        gubun = g("구분") or "북항"
        rows.append({"터미널": "BPT " + gubun, "선사": g("선사"), "선명": nm,
                     "선석": g("선석") + ("/" + g("접안") if g("접안") else ""),
                     "접안예정": first(g("입항예정"), g("입항")), "출항예정": g("출항"),
                     "상태": "", "모선항차": g("모선항차"), "ROUTE": g("항로")})
    return rows


def fetch_gwct():
    """광양 서부 GWCT — Spring CSRF + POST(HTML 조각 표)."""
    d0, d1 = date_range()
    y1, m1, dd1 = d0.split("-"); y2, m2, dd2 = d1.split("-")
    op = new_session()
    page = http_req(op, "http://www.gwct.co.kr/sub/sub_B2")
    mm = re.search(r'name="_csrf" content="([^"]+)"', page)
    csrf = mm.group(1) if mm else ""
    body = urllib.parse.urlencode({"_csrf": csrf, "page": "1", "pageSize": "500", "v_time": "term",
                                   "range": "ETB", "fromY": y1, "fromM": m1, "fromD": dd1,
                                   "toY": y2, "toM": m2, "toD": dd2}).encode("utf-8")
    html = http_req(op, "http://www.gwct.co.kr/sub/sub_B2/search", data=body,
                    headers={"Content-Type": "application/x-www-form-urlencoded",
                             "X-Requested-With": "XMLHttpRequest", "X-CSRF-TOKEN": csrf,
                             "Referer": "http://www.gwct.co.kr/sub/sub_B2"})
    hidx, tbl = pick_table(parse_tables(html), ["선박명", "선석"])
    if not tbl:
        raise RuntimeError("GWCT 표 없음")
    hdr = tbl[hidx]
    ix = {"선석": cidx(hdr, "선석"), "모선항차": cidx(hdr, "모선항차", "모선"),
          "선명": cidx(hdr, "선박명", "선명"), "접안": cidx(hdr, "입항 일시", "입항"),
          "출항": cidx(hdr, "출항 일시", "출항"), "선사": cidx(hdr, "선사"), "그룹": cidx(hdr, "그룹", "항로")}
    rows = []
    for r in tbl[hidx + 1:]:
        if ix["선명"] < 0 or len(r) <= ix["선명"]:
            continue
        g = lambda k: (r[ix[k]].strip() if 0 <= ix[k] < len(r) else "")
        nm = g("선명")
        if not nm or nm == "선박명":
            continue
        rows.append({"터미널": "GWCT(서부)", "선사": g("선사"), "선명": nm, "선석": g("선석"),
                     "접안예정": g("접안"), "출항예정": g("출항"), "상태": "",
                     "모선항차": g("모선항차"), "ROUTE": g("그룹")})
    return rows


def fetch_kitl():
    """광양 허치슨 KITL — 본선작업표(그래픽) 안의 'Vessel Detail Information' 툴팁 표에서 추출."""
    html = http_req(None, "https://info.kitl.com/jsp/T03/bonsun.jsp?mainType=T03&subType=01",
                    encoding="euc-kr")
    rows = []
    for blk in html.split("Vessel Detail Information")[1:]:
        seg = blk.split("</table>")[0]
        tds = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', seg, re.S)
        tds = [re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t)).strip() for t in tds]
        tds = [t for t in tds if t]
        vals = tds[1::2]      # 라벨=짝수, 값=홀수 → 값만
        if len(vals) < 6:
            continue
        nm = vals[0]
        if not nm:
            continue
        combo = vals[2].split("/")   # "9A/P/SPT" = 선석/접안현/ROUTE
        rows.append({"터미널": "KITL(허치슨)", "선사": "", "선명": nm,
                     "선석": combo[0].strip() if combo else "",
                     "접안예정": vals[3], "출항예정": vals[5], "상태": "",
                     "모선항차": vals[1], "ROUTE": combo[2].strip() if len(combo) > 2 else ""})
    return rows


def fetch_unct():
    """울산신항 UNCT — eservice 선석배정현황(표) JSON GET."""
    d0, d1 = date_range()
    url = ("http://www.unct.co.kr/json/comm/commonSelect.do"
           "?sqlId=es010_100Qry.selectBerthScheduleList&from=%s&to=%s"
           % (d0.replace("-", ""), d1.replace("-", "")))
    js = json.loads(http_req(None, url, headers={"X-Requested-With": "XMLHttpRequest",
                                                 "Referer": "http://www.unct.co.kr/eservice/"}))
    data = js.get("queryResult", []) if isinstance(js, dict) else js
    rows = []
    for v in data:
        nm = first(v.get("cdvVslName"))
        if not nm:
            continue
        rows.append({"터미널": "UNCT(울산신항)", "선사": first(v.get("cdvVslOperator")), "선명": nm,
                     "선석": first(v.get("vsbVoyBerthno")) + (("/" + first(v.get("vsbVoyBerthside"))) if v.get("vsbVoyBerthside") else ""),
                     "접안예정": first(v.get("etb")), "출항예정": first(v.get("etd")),
                     "상태": first(v.get("vsbVoyStatus")), "모선항차": first(v.get("vsbVoy")),
                     "ROUTE": first(v.get("vsbVoyOutservice"))})
    return rows


def fetch_incheon():
    """인천 iCON 통합(선광·한진·E1·ICT 등 전 터미널) — list.do POST, 서버렌더 표."""
    d0, d1 = date_range()
    body = urllib.parse.urlencode({"menuKey": "19", "searchTermCd": "", "searchStartDt": d0,
                                   "searchEndDt": d1, "currentPageNo": "1",
                                   "recordCountPerPage": "500"}).encode("utf-8")
    html = http_req(None, "https://scon.icpa.or.kr/vescall/list.do", data=body,
                    headers={"Content-Type": "application/x-www-form-urlencoded",
                             "Referer": "https://scon.icpa.or.kr/vescall/list.do?menuKey=19"})
    hidx, tbl = pick_table(parse_tables(html), ["선석", "접안"])
    if not tbl:
        raise RuntimeError("인천 iCON 표 없음")
    hdr = tbl[hidx]
    ix = {"터미널": cidx(hdr, "터미널"), "선석": cidx(hdr, "선석"),
          "모선항차": cidx(hdr, "모선항차", "항차"), "선명": cidx(hdr, "호출부호", "Bitt", "선명"),
          "접안예정": cidx(hdr, "접안"), "출항예정": cidx(hdr, "출항"), "선사": cidx(hdr, "선사")}
    rows = []
    for r in tbl[hidx + 1:]:
        if ix["선명"] < 0 or len(r) <= ix["선명"]:
            continue
        g = lambda k: (r[ix[k]].strip() if 0 <= ix[k] < len(r) else "")
        nm = re.sub(r"\s*\(.*$", "", g("선명")).strip()  # "STAR FRONTIER5(..)" → 이름만
        if not nm or "데이터가 없" in nm:
            continue
        rows.append({"터미널": g("터미널") or "인천", "선사": g("선사"), "선명": nm,
                     "선석": g("선석"), "접안예정": g("접안예정"), "출항예정": g("출항예정"),
                     "상태": "", "모선항차": g("모선항차"), "ROUTE": ""})
    return rows


# --- PNC(신항1): Cloudflare 뒤 SPA → Playwright(진짜 브라우저)로 조회 ---
PNC_MAIN = "https://svc.pncport.com/info/Main.do"
PNC_BERTH = "https://svc.pncport.com/info/CMS/Ship/ShipBerthCNew.pnc?mCode=MN105"


def fetch_pnc_pw(page):
    """PNC 선석배정현황 그래픽 페이지의 선박 블록(data-*)에서 입항예정 추출."""
    page.goto(PNC_BERTH, wait_until="networkidle", timeout=45000)
    page.wait_for_timeout(2500)
    raw = page.evaluate("""()=>Array.from(document.querySelectorAll('[data-aa]')).map(function(el){
        return {name:el.getAttribute('data-aa'), voy:el.getAttribute('data-vslcode'),
                oper:el.getAttribute('data-operoutservice'), ebt:el.getAttribute('data-ebt'),
                dpt:el.getAttribute('data-dpt'), berth:el.getAttribute('data-berth')};})""")
    rows = []
    for v in raw:
        nm = first(v.get("name"))
        if not nm:
            continue
        oper = first(v.get("oper"))
        carrier = oper.split("/")[0].strip() if oper else ""
        rows.append({"터미널": "PNC(신항1)", "선사": carrier, "선명": nm,
                     "선석": re.sub(r"\s*\(.*", "", first(v.get("berth"))),
                     "접안예정": first(v.get("ebt")), "출항예정": first(v.get("dpt")),
                     "상태": "", "모선항차": first(v.get("voy")), "ROUTE": oper})
    return rows


# HTTP(urllib)로 되는 터미널: (항, 표시명, 함수)
HTTP_TERMINALS = [
    ("부산", "PNIT (신항 2부두)", fetch_pnit),
    ("부산", "HJNC (신항 3부두)", fetch_hjnc),
    ("부산", "HPNT (신항 4부두)", fetch_hpnt),
    ("부산", "BNCT (신항 5부두)", fetch_bnct),
    ("부산", "DGT (신항 서컨)", fetch_dgt),
    ("부산", "BPT (북항 신선대·감만)", fetch_bpt),
    ("평택", "PCTC (평택 한진)", fetch_pctc),
    ("평택", "PNCT (동방아이포트)", fetch_pnct),
    ("인천", "iCON 통합 (선광·한진·E1·ICT 등)", fetch_incheon),
    ("광양", "GWCT (서부컨테이너)", fetch_gwct),
    ("광양", "KITL (허치슨)", fetch_kitl),
    ("울산", "UNCT (울산신항)", fetch_unct),
]
PNC_PORT = "부산"
PENDING = ["울산 JUCT(정일, 접근차단 확인중)"]
if not HAS_PW:   # 브라우저 엔진 없는 경량 exe: PNC(신항1) 미포함 안내
    PENDING = ["부산 PNC(신항1) — 경량판 미포함"] + PENDING


# ------------------------- 캐시 + 백그라운드 수집 -------------------------
_cache = {"ts": 0, "rows": [], "status": [], "updated": "", "period": ""}
_lock = threading.Lock()
_wake = threading.Event()


def collect_all(pnc_page):
    rows, status = [], []
    for port, name, fn in HTTP_TERMINALS:
        try:
            r = fn()
            for row in r:
                row["항"] = port
            rows.extend(r)
            status.append({"name": "%s · %s" % (port, name), "ok": True, "count": len(r), "msg": ""})
        except Exception as e:
            status.append({"name": "%s · %s" % (port, name), "ok": False, "count": 0, "msg": str(e)[:120]})
    # PNC (Playwright) — 브라우저 엔진 없으면(exe 경량판) 조용히 건너뜀(PENDING에 표시)
    if pnc_page is not None:
        try:
            r = fetch_pnc_pw(pnc_page)
            for row in r:
                row["항"] = PNC_PORT
            rows.extend(r)
            status.append({"name": "%s · PNC (신항 1부두)" % PNC_PORT, "ok": True, "count": len(r), "msg": ""})
        except Exception as e:
            status.append({"name": "%s · PNC (신항 1부두)" % PNC_PORT, "ok": False, "count": 0, "msg": str(e)[:120]})
    elif HAS_PW:
        status.append({"name": "%s · PNC (신항 1부두)" % PNC_PORT, "ok": False, "count": 0, "msg": "브라우저 시작 실패"})
    # HAS_PW=False(경량 exe)면 PNC status를 넣지 않음 → PENDING에서 안내
    return rows, status


def _store(rows, status):
    d0, d1 = date_range()
    with _lock:
        _cache.update({"ts": time.time(), "rows": rows, "status": status,
                       "updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                       "period": "%s ~ %s" % (d0, d1)})


def refresher():
    """백그라운드: 브라우저(PNC용)를 유지하며 주기적으로 전 터미널 수집."""
    pw = browser = page = None
    if HAS_PW:
        try:
            pw = sync_playwright().start()
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(PNC_MAIN, wait_until="domcontentloaded", timeout=45000)  # Cloudflare 통과 워밍업
        except Exception as e:
            print(" (PNC 브라우저 시작 실패, PNC 제외:", str(e)[:80], ")")
            page = None
    while True:
        try:
            rows, status = collect_all(page)
            _store(rows, status)
        except Exception as e:
            print(" (수집 오류:", str(e)[:80], ")")
        _wake.wait(REFRESH_SEC)
        _wake.clear()


def get_data():
    with _lock:
        return dict(_cache)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        # CORS: 배차일보 웹앱(다른 origin/HTTPS)에서 이 로컬 서버의 /api/schedule 를 읽을 수 있게 허용
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self.wfile.write(body if isinstance(body, bytes) else body.encode("utf-8"))

    def do_OPTIONS(self):
        # CORS 프리플라이트 대응(단순 GET엔 불필요하나 안전하게 처리)
        self._send(204, b"", "text/plain; charset=utf-8")

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/", "/index.html"):
            self._send(200, PAGE, "text/html; charset=utf-8")
        elif path == "/api/schedule":
            if "force" in urllib.parse.urlparse(self.path).query:
                _wake.set()   # 백그라운드 즉시 재수집 요청
            c = get_data()
            payload = {"rows": c.get("rows", []), "status": c.get("status", []),
                       "updated": c.get("updated", ""), "period": c.get("period", ""),
                       "cols": COLS, "pending": PENDING, "refresh": REFRESH_SEC}
            self._send(200, json.dumps(payload, ensure_ascii=False), "application/json; charset=utf-8")
        else:
            self._send(404, "not found", "text/plain; charset=utf-8")


def main():
    print("=" * 56)
    print(" 부산 컨테이너 터미널 · 선박명 통합 검색 (실시간)")
    print("=" * 56)
    print(" 첫 조회 중... (PNC 브라우저 준비로 10~20초 걸릴 수 있어요)")
    t = threading.Thread(target=refresher, daemon=True)
    t.start()
    for _ in range(40):            # 첫 데이터가 채워질 때까지 최대 ~20초 대기
        if _cache.get("rows") or _cache.get("status"):
            break
        time.sleep(0.5)
    url = "http://localhost:%d/" % PORT
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(" 준비 완료 →", url)
    print(" 화면은 %d초마다 자동 갱신됩니다." % REFRESH_SEC)
    print(" ※ 이 검은 창은 열어두세요. 닫으면 갱신이 멈춥니다. (종료: Ctrl+C)")
    # 배차일보 런처에서 띄울 때는 자체 페이지를 열지 않는다(--server-only / SHIP_SERVER_ONLY=1).
    # 단독 실행 시에는 기존처럼 자체 검색 페이지를 자동으로 연다.
    server_only = ("--server-only" in sys.argv) or os.environ.get("SHIP_SERVER_ONLY") == "1"
    if server_only:
        print(" (서버 전용 모드 — 배차일보 '전국컨테이너 현황' 탭에서 사용하세요)")
    else:
        print(" 브라우저가 자동으로 열립니다.")
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n 종료합니다.")
        srv.shutdown()


PAGE = r"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>전국 컨테이너 터미널 · 선박명 검색 (실시간)</title>
<style>
  :root{--bg:#f4f6fb;--panel:#fff;--line:#dfe4ee;--txt:#1f2a3a;--mut:#6b7686;--accent:#1d6fe0;--soft:#e8f1fd;--hit:#ffe08a;--head:#f0f3f9;--ok:#16a34a;--bad:#dc2626;}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Segoe UI','Malgun Gothic','맑은 고딕',sans-serif;background:var(--bg);color:var(--txt);}
  header{background:var(--panel);border-bottom:1px solid var(--line);padding:14px 20px;position:sticky;top:0;z-index:10;box-shadow:0 1px 3px rgba(0,0,0,.05)}
  h1{margin:0;font-size:17px}
  .sub{color:var(--mut);font-size:12px;margin-top:4px;line-height:1.6}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:11px}
  input[type=search],select{background:#fff;border:1px solid var(--line);color:var(--txt);padding:9px 12px;border-radius:8px;font-size:14px;outline:none}
  input#q{width:280px}
  input#q:focus,select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--soft)}
  .btn{background:#fff;color:var(--txt);border:1px solid var(--line);padding:9px 13px;border-radius:8px;font-size:13px;cursor:pointer}
  .btn:hover{background:var(--soft)}
  .cnt{color:var(--accent);font-weight:700}
  .pbar{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:11px}
  .pbar .lbl{color:var(--mut);font-size:12px;font-weight:600;margin-right:3px}
  .pbtn{background:#fff;border:1px solid var(--line);color:var(--txt);padding:8px 17px;border-radius:20px;font-size:14px;cursor:pointer;font-weight:700}
  .pbtn:hover{background:var(--soft)}
  .pbtn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
  .live{display:inline-flex;align-items:center;gap:6px;color:var(--ok);font-weight:600;font-size:12px}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--ok);animation:pulse 1.6s infinite}
  @keyframes pulse{0%{opacity:.35}50%{opacity:1}100%{opacity:.35}}
  .wrap{padding:0 20px 40px;overflow:auto}
  table{border-collapse:collapse;width:100%;font-size:13px;background:var(--panel)}
  th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;white-space:nowrap}
  th{background:var(--head);position:sticky;top:0;cursor:pointer;user-select:none}
  th:hover{color:var(--accent)}
  tr:nth-child(even) td{background:#fafbfe}
  tr:hover td{background:var(--soft)}
  mark{background:var(--hit);padding:0 1px;border-radius:2px}
  .empty{padding:50px;text-align:center;color:var(--mut)}
  .flash td{animation:fl 1.2s ease}
  @keyframes fl{from{background:#fff7cc}to{background:transparent}}
</style>
</head>
<body>
<header>
  <h1>🚢 전국 컨테이너 터미널 · 선박명 검색 <span class="live"><span class="dot"></span>실시간</span></h1>
  <div class="sub" id="meta">불러오는 중...</div>
  <div class="pbar" id="pbar"></div>
  <div class="row">
    <input type="search" id="q" placeholder="선박명 입력 (실시간 검색)" autofocus autocomplete="off">
    <label class="sub">검색대상 <select id="field"><option value="선명">선명</option><option value="">전체</option></select></label>
    <label class="sub">지역 <select id="fPort"><option value="">전체</option></select></label>
    <label class="sub">터미널 <select id="fTml"><option value="">전체</option></select></label>
    <button class="btn" id="reset">초기화</button>
    <button class="btn" id="refresh">지금 새로고침</button>
    <button class="btn" id="csv">CSV 저장</button>
    <span class="sub">표시 <span class="cnt" id="shown">0</span> / 전체 <span class="cnt" id="total">0</span>건</span>
  </div>
</header>
<div class="wrap">
  <table id="tbl"><thead><tr id="head"></tr></thead><tbody id="body"></tbody></table>
  <div class="empty" id="empty" style="display:none">일치하는 선박이 없습니다. (검색어·커버 터미널을 확인하세요)</div>
</div>
<script>
var DATA=[], COLS=[], PENDING=[], REFRESH=120000, sortCol=null, sortAsc=true, prevKeys={}, headBuilt=false;
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[m];});}
function hl(s,t){s=esc(s);if(!t)return s;var q=t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{return s.replace(new RegExp('('+q+')','gi'),'<mark>$1</mark>');}catch(e){return s;}}
function rowKey(r){return r['터미널']+'|'+r['선명']+'|'+r['모선항차'];}

function buildHead(){
  var tr=$('head'); tr.innerHTML='';
  COLS.forEach(function(c){var th=document.createElement('th');th.textContent=c;
    th.onclick=function(){if(sortCol===c){sortAsc=!sortAsc;}else{sortCol=c;sortAsc=true;}render();};tr.appendChild(th);});
  headBuilt=true;
}
function fillSel(id, col){
  var cur=$(id).value, set={}; DATA.forEach(function(r){if(r[col])set[r[col]]=1;});
  var sel=$(id); sel.innerHTML='<option value="">전체</option>';
  Object.keys(set).sort().forEach(function(v){var o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);});
  sel.value=cur;
}
var PORT_ORDER=['부산','평택','인천','광양','울산'];
function setPort(p){
  $('fPort').value=p;
  var btns=$('pbar').querySelectorAll('.pbtn');
  for(var i=0;i<btns.length;i++){ btns[i].classList.toggle('on',(btns[i].getAttribute('data-p')||'')===p); }
  render();
}
function renderPortBar(){
  var bar=$('pbar'); if(!bar) return;
  var set={}; DATA.forEach(function(r){ if(r['항'])set[r['항']]=1; });
  var ports=Object.keys(set).sort(function(a,b){return PORT_ORDER.indexOf(a)-PORT_ORDER.indexOf(b);});
  var cur=$('fPort').value;
  bar.innerHTML='<span class="lbl">지역별 보기</span>';
  ['',].concat(ports).forEach(function(p){
    var b=document.createElement('button'); b.className='pbtn'+(cur===p?' on':'');
    b.setAttribute('data-p',p); b.textContent=(p||'전체');
    b.onclick=function(){ setPort(p); };
    bar.appendChild(b);
  });
}
function fillTerminals(){ fillSel('fPort','항'); fillSel('fTml','터미널'); renderPortBar(); }
function rowsNow(){
  var t=$('q').value.trim().toLowerCase(), field=$('field').value, fT=$('fTml').value, fP=$('fPort').value;
  var rs=DATA.filter(function(r){
    if(fP&&r['항']!==fP)return false;
    if(fT&&r['터미널']!==fT)return false;
    if(!t)return true;
    if(field)return String(r[field]||'').toLowerCase().indexOf(t)>=0;
    return COLS.some(function(c){return String(r[c]||'').toLowerCase().indexOf(t)>=0;});
  });
  if(sortCol){rs=rs.slice().sort(function(a,b){var x=(a[sortCol]||'')+'',y=(b[sortCol]||'')+'';return sortAsc?x.localeCompare(y,'ko'):y.localeCompare(x,'ko');});}
  return rs;
}
function render(){
  if(!headBuilt)buildHead();
  var rs=rowsNow(), t=$('q').value.trim(), field=$('field').value;
  var b=$('body'); b.innerHTML='';
  var fr=document.createDocumentFragment();
  rs.forEach(function(r){var tr=document.createElement('tr');
    if(prevKeys.__ready && !prevKeys[rowKey(r)])tr.className='flash';
    COLS.forEach(function(c){var td=document.createElement('td');
      var doHl=t&&(field===''||field===c);
      td.innerHTML=doHl?hl(r[c],t):esc(r[c]);tr.appendChild(td);});
    fr.appendChild(tr);});
  b.appendChild(fr);
  $('shown').textContent=rs.length;
  $('empty').style.display=rs.length?'none':'block';
  $('tbl').style.display=rs.length?'':'none';
}
function setMeta(d){
  var st=d.status.map(function(s){return s.name+' <b style="color:'+(s.ok?'var(--ok)':'var(--bad)')+'">'+(s.ok?('정상 '+s.count):'실패')+'</b>';}).join(' · ');
  var pend = PENDING.length
    ? '<br><span style="color:#b45309">추가 예정: '+PENDING.join(', ')+'</span>'
    : '';
  $('meta').innerHTML='조회기간 <b>'+esc(d.period)+'</b> · 마지막 갱신 <b>'+esc(d.updated)+'</b> (자동 '+(REFRESH/1000)+'초)<br>커버: '+st+pend;
}
function apply(d){
  COLS=d.cols; PENDING=d.pending||[]; REFRESH=(d.refresh||120)*1000;
  var newData=d.rows||[];
  DATA=newData; $('total').textContent=DATA.length;
  fillTerminals(); setMeta(d); render();
  var nk={__ready:true}; newData.forEach(function(r){nk[rowKey(r)]=1;}); prevKeys=nk;
}
function load(force){
  fetch('/api/schedule'+(force?'?force=1':'')).then(function(r){return r.json();}).then(apply)
    .catch(function(e){$('meta').innerHTML='<span style="color:var(--bad)">데이터를 불러오지 못했습니다. 검은 창(서버)이 켜져 있는지 확인하세요.</span>';});
}
function csvCell(v){v=(v==null?'':''+v);if(/[",\r\n]/.test(v))v='"'+v.replace(/"/g,'""')+'"';return v;}
$('csv').onclick=function(){var rs=rowsNow();if(!rs.length){alert('저장할 데이터가 없습니다.');return;}
  var L=[COLS.map(csvCell).join(',')];rs.forEach(function(r){L.push(COLS.map(function(c){return csvCell(r[c]);}).join(','));});
  var blob=new Blob(['﻿'+L.join('\r\n')],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='전국터미널_선박검색.csv';a.click();};
$('reset').onclick=function(){$('q').value='';$('field').value='선명';$('fTml').value='';sortCol=null;setPort('');};
$('refresh').onclick=function(){$('meta').innerHTML='새로고침 중...';load(true);};
['q','field','fTml'].forEach(function(id){$(id).addEventListener('input',render);$(id).addEventListener('change',render);});
$('fPort').addEventListener('change',function(){setPort($('fPort').value);});
load(false);
setInterval(function(){load(false);}, 30000);   // 30초마다 서버 확인(서버는 최대 90초 캐시)
</script>
</body>
</html>
"""

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("오류:", e)
        if os.name == "nt":
            input("\n엔터를 누르면 닫힙니다...")
