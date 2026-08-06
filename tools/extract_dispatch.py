# -*- coding: utf-8 -*-
"""배차일보 정리본 엑셀 → app/data.js 생성.

`26년배차일보_정리.xlsx`의 `전체` 시트에서 2026년 행만 뽑아
app/data.js (window.__DISPATCH__) 로 저장한다. data.js 는 실제 운영 데이터
(전화번호·금액 포함)라 git 에 올리지 않는다(.gitignore). 필요할 때 이 스크립트로 재생성.

사용법: python tools/extract_dispatch.py <배차일보_정리.xlsx>
"""
import sys, json, datetime
import openpyxl

COLS = ['date','io','vno','chassis','billto','shipper','time','addr','tel','line',
        'load','spec','bl','do','cntr','seal','tare','unload','memo','etc','km',
        'charge','pay','bonded','div','size','type']

def conv(v):
    if v is None: return None
    if isinstance(v, datetime.datetime): return v.strftime('%Y-%m-%d')
    if isinstance(v, datetime.time): return v.strftime('%H:%M')
    return v

def main(src, out='app/data.js', year=2026):
    wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
    ws = wb['전체']
    it = ws.iter_rows(values_only=True)
    labels = list(next(it))[:27]
    rows = []
    for r in it:
        d = r[0]
        if isinstance(d, datetime.datetime):
            if d.year != year: continue
        elif d is None:
            continue
        rows.append([conv(x) for x in r[:27]])
    payload = {'columns': COLS, 'labels': labels, 'rows': rows}
    js = 'window.__DISPATCH__=' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';'
    with open(out, 'w', encoding='utf-8') as f:
        f.write(js)
    print(f'{len(rows)} rows ({year}) -> {out}')

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else '26년배차일보_정리.xlsx'
    main(src)
