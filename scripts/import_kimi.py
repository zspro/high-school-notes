"""把 Kimi 导出的笔记（<学科>/<册>/第X章_xxx.md）导入站点目录，并修复公式格式。

用法:
    python scripts/import_kimi.py <解压后的 Kimi 目录> [knowledge]

导入后的路径形如 knowledge/数学/数学必修二笔记/07-第七章_复数.md，
文件名前的序号决定侧边栏里的章节顺序。导入后建议运行:
    node scripts/mjcheck.mjs knowledge/*/*/*.md     # 检查 TeX 语法
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fixmd import fix  # noqa: E402

CN = '一二三四五六七八九十'


def chapter_num(filename):
    """第十一章_xxx.md → 11"""
    m = filename.split('_')[0][1:-1]
    if '十' in m:
        a, b = m.split('十')
        return (CN.index(a) + 1 if a else 1) * 10 + (CN.index(b) + 1 if b else 0)
    return CN.index(m) + 1


def main(src, dst):
    count = 0
    for subj in ['数学', '物理', '化学']:
        base = os.path.join(src, subj)
        if not os.path.isdir(base):
            continue
        for vol in os.listdir(base):
            for f in os.listdir(os.path.join(base, vol)):
                if not f.endswith('.md'):
                    continue
                out = os.path.join(dst, subj, f'{subj}{vol}笔记', f'{chapter_num(f):02d}-{f}')
                os.makedirs(os.path.dirname(out), exist_ok=True)
                text = open(os.path.join(base, vol, f), encoding='utf-8').read()
                open(out, 'w', encoding='utf-8', newline='\n').write(fix(text))
                count += 1
    print(f'imported {count} files into {dst}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'knowledge')
