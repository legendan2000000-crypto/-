# 배차일보(대시보드) HTML에 '기사전송' 로더 한 줄을 주입한다.
#  - 실제 기능은 인터넷에 올라간 fbsend.js가 담당(복제→기사전송 변환/로그인/전송/도달결과).
#  - 그래서 주입은 <script src=".../fbsend.js"></script> 한 줄이면 끝이고,
#    이후 기능 개선은 fbsend.js만 교체하면 이 파일을 다시 안 만져도 자동 반영된다.
# 사용: python tools/fb_inject.py <입력.html> <출력.html> [--local]
#   기본: 호스팅 URL 로더(권장, 자동 업데이트)
#   --local: 같은 폴더의 fbsend.js를 참조(오프라인/로컬 배포용)
import sys

REMOTE = '<script src="https://kukyang-dispatch.web.app/fbsend.js"></script>\n'
LOCAL  = '<script src="fbsend.js"></script>\n'
MARK   = 'kukyang-dispatch.web.app/fbsend.js'  # 이미 주입됐는지 표식(원격)

def main(inp, out, local=False):
    html = open(inp, encoding='utf-8').read()
    line = LOCAL if local else REMOTE
    already = ('fbsend.js"></script>' in html)
    if already:
        print('이미 기사전송 로더가 있음 — 그대로 둠')
    else:
        i = html.rfind('</body>')
        if i < 0: i = len(html)
        html = html[:i] + line + html[i:]
    open(out, 'w', encoding='utf-8').write(html)
    print('주입 완료 ->', out, '(', 'LOCAL' if local else 'REMOTE', ')', round(len(html)/1024/1024, 2), 'MB')

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--local']
    local = '--local' in sys.argv
    main(args[0], args[1], local)
