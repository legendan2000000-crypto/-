#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py — source/template.html 에 data/*.json 을 주입해서
완성본 index.html 을 생성한다.

사용법:
    python build.py

수정 흐름:
    1) source/template.html 에서 UI/로직/계산식을 수정
    2) (데이터가 바뀌면) extract.py 로 data/rates.json, rates_rt.json 재생성
    3) python build.py  ->  index.html 갱신
    4) index.html 을 브라우저로 열어 확인 / git push 로 배포
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

def main():
    tpl = open(os.path.join(HERE, "source", "template.html"), encoding="utf-8").read()
    ow  = open(os.path.join(HERE, "data", "rates.json"),    encoding="utf-8").read()
    rt  = open(os.path.join(HERE, "data", "rates_rt.json"), encoding="utf-8").read()

    body = tpl.replace("__DATA_OW__", ow).replace("__DATA_RT__", rt)

    # 반드시 완전한 HTML 문서로 감싼다 (charset 없으면 모바일에서 한글 깨짐)
    full = (
        '<!DOCTYPE html>\n<html lang="ko">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="color-scheme" content="light dark">\n'
        + body +
        '\n</body>\n</html>'
    )

    out = os.path.join(HERE, "index.html")
    open(out, "w", encoding="utf-8").write(full)

    left = full.count("__DATA_OW__") + full.count("__DATA_RT__")
    assert left == 0, "데이터 플레이스홀더가 남아있음"
    assert full.count("</script>") == 1, "</script> 닫는 태그 확인 필요"
    print(f"OK -> index.html ({os.path.getsize(out)/1e6:.2f} MB)")

if __name__ == "__main__":
    main()
