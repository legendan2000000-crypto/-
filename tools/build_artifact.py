# -*- coding: utf-8 -*-
"""app/index.html → claude.ai 아티팩트용 본문 HTML.

아티팩트는 <head><body> 골격으로 감싸주므로 문서 래퍼 없이 본문만 낸다.
data.js는 인라인, pdf.js는 제외(CSP/용량), body.amt-hide는 스크립트로 부여.

사용법: python tools/build_artifact.py [출력경로]
"""
import sys, os, re
APP = os.path.join(os.path.dirname(__file__), '..', 'app')

def main(out=None):
    html = open(os.path.join(APP, 'index.html'), encoding='utf-8').read()
    data = open(os.path.join(APP, 'data.js'), encoding='utf-8').read()
    style = re.search(r'<style>.*?</style>', html, re.S).group(0)
    body = re.search(r'<body[^>]*>(.*?)</body>', html, re.S).group(1)
    # data.js 인라인
    body = body.replace('<script src="data.js"></script>', '<script>' + data + '</script>')
    # pdf.js 블록 제거
    body = re.sub(r'<!-- PDF 판독기.*?onerror="window\.__nopdf=1"></script>\s*<script>try\{if\(window\.pdfjsLib\)pdfjsLib\.GlobalWorkerOptions\.workerSrc=\'vendor/pdf\.worker\.min\.js\';\}catch\(e\)\{\}</script>', '', body, flags=re.S)
    # body.amt-hide 부여 + 아티팩트 안내
    init = '<script>document.body.classList.add("amt-hide");window.__nopdf=1;</script>'
    content = style + '\n' + body + '\n' + init
    out = out or os.path.join(APP, '..', '배차일보_artifact.html')
    open(out, 'w', encoding='utf-8').write(content)
    print(f'아티팩트 본문: {round(os.path.getsize(out)/1024/1024,2)} MB -> {out}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
