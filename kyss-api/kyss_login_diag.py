# -*- coding: utf-8 -*-
"""KYSS 로그인 실패 원인 진단.

Playwright 창을 띄우고 /login 으로 이동한 뒤, 사용자가 직접 로그인하는 동안
로그인 관련 네트워크 요청/응답과 콘솔 에러를 기록한다.
★ 비밀번호는 기록하지 않는다 (요청 본문에서 마스킹).

사용법: python kyss_login_diag.py
결과:   diag/login_trace.log
"""
import sys, os, time, json, re

sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

TOOL = os.path.dirname(os.path.abspath(__file__))
PROFILE = os.path.join(TOOL, '.kyss_diag_profile')
DIAG = os.path.join(TOOL, 'diag')
os.makedirs(DIAG, exist_ok=True)
LOG = os.path.join(DIAG, 'login_trace.log')
WAIT = 1800

lines = []


def w(s):
    print(s, flush=True)
    lines.append(str(s))
    with open(LOG, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def mask(body):
    """비밀번호 값만 가린다."""
    if not body:
        return body
    try:
        s = body if isinstance(body, str) else body.decode('utf-8', 'replace')
    except Exception:
        return '<binary>'
    s = re.sub(r'("(?:PW|PASSWORD|USER_PW|PASSWD|pw|password)"\s*:\s*)"[^"]*"', r'\1"***"', s)
    s = re.sub(r'((?:pw|password|passwd)=)[^&]*', r'\1***', s, flags=re.I)
    return s[:1500]


def main():
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            PROFILE, headless=False, args=['--start-maximized'], no_viewport=True)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        INTEREST = re.compile(r'/api/(login|auth|sso|session|menuMap|openOnlyPage)', re.I)

        def on_request(req):
            if INTEREST.search(req.url):
                w(f"[REQ ] {req.method} {req.url}")
                w(f"       body: {mask(req.post_data)}")

        def on_response(res):
            if INTEREST.search(res.url):
                w(f"[RES ] {res.status} {res.url}")
                for h in ('content-type', 'set-cookie', 'location', 'www-authenticate'):
                    v = res.headers.get(h)
                    if v:
                        w(f"       {h}: {v[:300]}")
                try:
                    w(f"       body: {mask(res.text())[:800]}")
                except Exception as e:
                    w(f"       body 읽기 실패: {e}")

        def on_failed(req):
            if INTEREST.search(req.url):
                w(f"[FAIL] {req.method} {req.url} — {req.failure}")

        page.on('request', on_request)
        page.on('response', on_response)
        page.on('requestfailed', on_failed)
        page.on('console', lambda m: w(f"[CON ] {m.type}: {m.text[:300]}")
                if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: w(f"[ERR ] {e}"))
        page.on('dialog', lambda d: (w(f"[DLG ] {d.type}: {d.message}"), d.dismiss()))

        w(f"=== 진단 시작 (UA={page.evaluate('navigator.userAgent')[:120]})")
        w(f"    webdriver 플래그: {page.evaluate('navigator.webdriver')}")
        page.goto('https://www.kyss.co.kr/login', wait_until='networkidle', timeout=60000)
        w(f"    현재 URL: {page.url}")

        print('=' * 62)
        print(' 열린 창에서 KYSS에 로그인해 주세요. (창을 닫지 마세요)')
        print(' 로그인 버튼을 누르면 그때 오가는 요청/응답이 기록됩니다.')
        print(f' 기록 파일: {LOG}')
        print('=' * 62, flush=True)

        deadline = time.time() + WAIT
        ok = False
        while time.time() < deadline:
            alive = [q for q in ctx.pages if not q.is_closed()]
            if not alive:
                w('[END ] 창이 모두 닫힘')
                break
            try:
                r = alive[0].evaluate("""async () => {
                  const r = await fetch('/api/menuMap',{method:'POST',
                    headers:{'Content-Type':'application/json'},body:'{}',credentials:'include'});
                  return {s:r.status, ct:r.headers.get('content-type')||''};
                }""")
                if r['s'] == 200 and 'json' in r['ct']:
                    w('[OK  ] 로그인 성공 — menuMap 응답 확인됨')
                    ok = True
                    break
            except Exception:
                pass
            time.sleep(3)

        w(f"=== 종료 (로그인성공={ok})")
        if ok:
            print('\n로그인이 됐습니다. 창을 열어둔 채 30분 대기합니다.', flush=True)
            time.sleep(min(1800, max(0, deadline - time.time())))
        ctx.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
