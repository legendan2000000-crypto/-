# -*- coding: utf-8 -*-
"""app/ 멀티파일 → 단일 HTML 파일로 번들.

data.js·pdf.min.js를 인라인하고, PDF 워커는 파일 참조 대신 Blob URL로 만들어
파일을 직접 더블클릭(file://)해도 PDF 판독이 되게 한다.

사용법: python tools/build_singlefile.py [출력경로]
"""
import sys, os

APP = os.path.join(os.path.dirname(__file__), '..', 'app')

def read(p):
    return open(os.path.join(APP, p), encoding='utf-8').read()

def main(out=None):
    html = read('index.html')
    data = read('data.js')
    pdfjs = read('vendor/pdf.min.js')
    worker = read('vendor/pdf.worker.min.js').replace('</script', '<\\/script')

    # 1) 데이터 인라인
    html = html.replace('<script src="data.js"></script>', '<script>' + data + '</script>')

    # 2) pdf.js 인라인 + Blob 워커
    pdf_block = (
        '<script>' + pdfjs + '</script>\n'
        '<script id="__pdfworker" type="javascript/worker">' + worker + '</script>\n'
        '<script>try{if(window.pdfjsLib){'
        'var _w=new Blob([document.getElementById("__pdfworker").textContent],{type:"application/javascript"});'
        'pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(_w);}}catch(e){window.__nopdf=1;}</script>'
    )
    html = html.replace(
        '<!-- PDF 판독기 (로컬 번들). 단일파일 빌드에서는 인라인 + Blob 워커로 대체됨 -->\n'
        '<script src="vendor/pdf.min.js" onerror="window.__nopdf=1"></script>\n'
        '<script>try{if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc=\'vendor/pdf.worker.min.js\';}catch(e){}</script>',
        pdf_block)

    out = out or os.path.join(APP, '..', '배차일보.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'단일 파일: {round(os.path.getsize(out)/1024/1024,2)} MB -> {out}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
