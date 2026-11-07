"""扫描构建产物，找出没被渲染、以原始 TeX 文本出现在页面上的公式残留"""
import re, glob, html, collections, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
STRIP = re.compile(r'<svg.*?</svg>|<mjx-assistive-mml.*?</mjx-assistive-mml>|<script.*?</script>'
                   r'|<style.*?</style>|<code.*?</code>|<pre.*?</pre>', re.S)
PAT = re.compile(r'\\(?:frac|ce|text|mathrm|vec|alpha|Delta|rightarrow|cdot|times|sqrt)\b|\$|ightarrow')

c = collections.Counter()
ex = {}
for f in glob.glob((sys.argv[1] if len(sys.argv) > 1 else 'knowledge/.vitepress/dist') + '/*/*/*.html'):
    t = STRIP.sub('', open(f, encoding='utf-8').read())
    txt = html.unescape(re.sub(r'<[^>]+>', ' ', t))
    for m in PAT.finditer(txt):
        c[f] += 1
        ex.setdefault(f, re.sub(r'\s+', ' ', txt[max(0, m.start() - 50):m.end() + 50]))
for f, n in c.most_common():
    print(n, f, '|', ex[f])
print('pages with leftovers:', len(c))
