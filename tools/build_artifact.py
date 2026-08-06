# -*- coding: utf-8 -*-
"""app/index.html → claude.ai 아티팩트용 본문 HTML.

아티팩트는 <head><body> 골격으로 감싸주므로 문서 래퍼 없이 본문만 낸다.
data.js는 인라인, pdf.js는 제외(CSP/용량), body.amt-hide는 스크립트로 부여.

사용법: python tools/build_artifact.py [출력경로]
"""
import sys, os, re, json
APP = os.path.join(os.path.dirname(__file__), '..', 'app')

# 반복 많은 문자열 컬럼을 사전 인코딩해 용량을 줄인다(모바일 로딩 부담↓).
# 앱(index.html)이 D.dicts를 보고 원본 rows로 복원한다.
DICT_COLS = ['io','vno','chassis','billto','shipper','addr','tel','line',
             'load','spec','unload','div','size','type','bonded']

def encode(data_js):
    i = data_js.index('{'); obj = json.loads(data_js[i:data_js.rindex('}') + 1])
    cols, rows = obj['columns'], obj['rows']
    ci = {c: cols.index(c) for c in DICT_COLS if c in cols}
    dicts = {}
    for c, j in ci.items():
        seen = {}
        for r in rows:
            v = r[j]
            if v is not None and v not in seen:
                seen[v] = len(seen)
        dicts[c] = list(seen.keys())
    di = {c: {v: k for k, v in enumerate(dicts[c])} for c in ci}
    enc = []
    for r in rows:
        nr = list(r)
        for c, j in ci.items():
            v = r[j]
            nr[j] = (di[c][v] if v is not None else None)
        while nr and nr[-1] is None:  # 뒤쪽 null 제거
            nr.pop()
        enc.append(nr)
    out = {'columns': cols, 'labels': obj['labels'],
           'dictCols': list(ci.keys()), 'dicts': dicts, 'rows': enc}
    return 'window.__DISPATCH__=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';'

def main(out=None):
    html = open(os.path.join(APP, 'index.html'), encoding='utf-8').read()
    data = open(os.path.join(APP, 'data.js'), encoding='utf-8').read()
    data = encode(data)  # 사전 인코딩(경량화)
    style = re.search(r'<style>.*?</style>', html, re.S).group(0)
    body = re.search(r'<body[^>]*>(.*?)</body>', html, re.S).group(1)
    # data.js 인라인
    body = body.replace('<script src="data.js"></script>', '<script>' + data + '</script>')
    # pdf.js 인라인: pdf.min.js + worker를 메인스레드에 인라인(globalThis.pdfjsWorker 정의).
    # workerSrc를 안 걸면 v3가 스크립트 주입 없이 fake-worker로 동작 → 아티팩트 CSP 통과.
    pdfmin = open(os.path.join(APP, 'vendor', 'pdf.min.js'), encoding='utf-8', errors='replace').read()
    worker = open(os.path.join(APP, 'vendor', 'pdf.worker.min.js'), encoding='utf-8', errors='replace').read()
    body = re.sub(r'<!-- PDF 판독기.*?workerSrc=\'vendor/pdf\.worker\.min\.js\';\}catch\(e\)\{\}</script>',
                  '@@PDFJS@@', body, flags=re.S)
    body = body.replace('@@PDFJS@@', '<script>' + pdfmin + '</script>\n<script>' + worker + '</script>')
    # 아티팩트는 <head>를 떼므로 viewport 메타를 런타임에 주입(모바일 필수) + body 클래스
    init = ('<script>(function(){'
            'try{if(!document.querySelector("meta[name=viewport]")){'
            'var m=document.createElement("meta");m.name="viewport";'
            'm.content="width=device-width, initial-scale=1, viewport-fit=cover";'
            'document.head.appendChild(m);}}catch(e){}'
            'document.body.classList.add("amt-hide");'
            '})();</script>')
    # 상단 앱탭: 배차일보 | 내륙운송 견적(견적툴을 iframe으로 격리 — 변수/CSS 충돌 방지, 탭 클릭 시 지연로딩)
    qpath = os.path.join(APP, '..', 'quote', 'index.html')
    apptab_css = ('<style>'
        '#apptabs{position:sticky;top:0;z-index:100;display:flex;gap:4px;background:var(--panel);'
        'border-bottom:2px solid var(--line);padding:5px 10px;box-shadow:var(--shadow)}'
        '.apptab{border:0;background:transparent;color:var(--muted);font-weight:800;font-size:15px;'
        'padding:8px 16px;border-radius:9px;cursor:pointer}'
        '.apptab.on{background:var(--accent);color:#fff}'
        '#app-dispatch header{top:44px}'
        '#quoteframe{width:100%;border:0;display:block;height:calc(100vh - 46px)}'
        '@media(max-width:600px){.apptab{font-size:14px;padding:7px 11px}}'
        '</style>')
    apptab_bar = ('<div id="apptabs">'
        '<button class="apptab on" data-app="dispatch">🚚 배차일보</button>'
        '<button class="apptab" data-app="quote">🧮 내륙운송 견적</button></div>')
    if os.path.exists(qpath):
        # </script>는 text/plain 컨테이너를 조기 종료시키므로 플레이스홀더로 치환 → srcdoc 넣을 때 원복
        qhtml = open(qpath, encoding='utf-8').read().replace('</script>', '@@ENDSCRIPT@@')
        quote_block = ('<div id="app-quote" style="display:none"><iframe id="quoteframe" title="내륙운송 견적"></iframe></div>'
            '<script type="text/plain" id="quotesrc">' + qhtml + '</script>')
    else:
        quote_block = '<div id="app-quote" style="display:none"></div>'
    switch_js = ('<script>(function(){var qf=document.getElementById("quoteframe"),loaded=false;'
        'document.querySelectorAll(".apptab").forEach(function(b){b.onclick=function(){'
        'document.querySelectorAll(".apptab").forEach(function(x){x.classList.toggle("on",x===b);});'
        'var q=b.dataset.app==="quote";'
        'document.getElementById("app-dispatch").style.display=q?"none":"";'
        'document.getElementById("app-quote").style.display=q?"block":"none";'
        'if(q&&qf&&!loaded){loaded=true;qf.srcdoc=document.getElementById("quotesrc").textContent.split("@@ENDSCRIPT@@").join("</scr"+"ipt>");}'
        '};});})();</script>')
    content = (style + apptab_css + '\n' + apptab_bar
               + '<div id="app-dispatch">' + body + '</div>'
               + quote_block + '\n' + init + switch_js)
    out = out or os.path.join(APP, '..', '배차일보_artifact.html')
    open(out, 'w', encoding='utf-8').write(content)
    print(f'아티팩트 본문: {round(os.path.getsize(out)/1024/1024,2)} MB -> {out}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
