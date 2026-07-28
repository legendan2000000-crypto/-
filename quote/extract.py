#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract.py — 원본 엑셀에서 data/rates.json, rates_rt.json 을 재생성한다.
운임 요율표가 갱신됐을 때만 실행하면 된다.

필요 패키지:  pip install openpyxl
사용법:      python extract.py  ->  data/rates.json, data/rates_rt.json 갱신

[왕복]  data/왕복_14항만_원본.xlsx  (14개 항만, 전국 3,480 지역)
        시트=항만명. 열: 시도,시군구,행정동,거리,40FT(위탁/사간/안전),20FT(위탁/사간/안전)
        -> rates.json = {ports:[...], locs:[[시도,시군구,행정동],...],
                         data:{항만:{dist:[...], rates:[[6개운임],...]}}}

[편도]  data/편도_3항만_원본.xlsx  (부산신항/부산북항/광양항, 수도권 1,213 지역)
        시트=항만명↔의왕ICD. 열: 시도,시군구,행정동,구간거리,적컨,공컨,40FT(3),20FT(3)
        -> rates_rt.json = {routes:[짧은항만명...], locs:[...],
                            data:{항만:{laden:[적컨], empty:[공컨], total:[구간], rates:[[6],...]}}}

주의: 화면 라벨은 '왕복'(14항만) / '편도'(3항만) 이지만,
      template.html 내부 변수명은 각각 DB_OW / DB_RT 이다 (초기 개발 명칭).
"""
import os, json, openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")

def rows(ws):
    return [r for r in ws.iter_rows(min_row=3, values_only=True) if r[2] is not None]

def extract_oneway(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheets = wb.sheetnames
    locs = [[r[0], r[1], r[2]] for r in rows(wb[sheets[0]])]
    data = {}
    for name in sheets:
        d = rows(wb[name])
        data[name] = {
            "dist":  [r[3] for r in d],
            "rates": [[r[4], r[5], r[6], r[7], r[8], r[9]] for r in d],
        }
    return {"ports": sheets, "locs": locs, "data": data}

def extract_roundtrip(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheets = wb.sheetnames
    short = lambda n: n.split("↔")[0]          # "부산신항↔의왕ICD" -> "부산신항"
    locs = [[r[0], r[1], r[2]] for r in rows(wb[sheets[0]])]
    data = {}
    for name in sheets:
        d = rows(wb[name])
        data[short(name)] = {
            "laden": [r[4] for r in d],          # 적컨
            "empty": [r[5] for r in d],          # 공컨
            "total": [r[3] for r in d],          # 구간거리
            "rates": [[r[6], r[7], r[8], r[9], r[10], r[11]] for r in d],
        }
    return {"routes": [short(s) for s in sheets], "locs": locs, "data": data}

def dump(obj, name):
    p = os.path.join(DATA, name)
    json.dump(obj, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"OK -> {name} ({os.path.getsize(p)/1024:.0f} KB)")

if __name__ == "__main__":
    dump(extract_oneway(os.path.join(DATA, "왕복_14항만_원본.xlsx")), "rates.json")
    dump(extract_roundtrip(os.path.join(DATA, "편도_3항만_원본.xlsx")), "rates_rt.json")
