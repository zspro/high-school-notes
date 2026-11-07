"""修复笔记中的公式格式问题。
用法: python fixmd.py src dst
"""
import re, sys

CMD_NESTED = re.compile(r'\$(\\[A-Za-z]+|\^\{\d+\})\$')


def odd(line):
    return line.replace('\\$', '').count('$') % 2 == 1


def fix_nested(line):
    """公式内部被错误包了一层 $：$a $\\cdot$ b$ -> $a \\cdot b$"""
    while True:
        for m in CMD_NESTED.finditer(line):
            if odd(line[:m.start()]):  # 处于公式内部
                line = line[:m.start()] + m.group(1) + line[m.end():]
                break
        else:
            return line


def split_math(line):
    """把一行切成 [(is_math, 片段)]，按顺序配对 $，跳过 `code` 与转义的 \\$"""
    parts, buf, i, inmath = [], '', 0, False
    while i < len(line):
        ch = line[i]
        if ch == '\\' and i + 1 < len(line):
            buf += line[i:i + 2]; i += 2; continue
        if ch == '`' and not inmath:
            j = line.find('`', i + 1)
            if j != -1:
                buf += line[i:j + 1]; i = j + 1; continue
        if ch == '$':
            n = 2 if line.startswith('$$', i) else 1
            parts.append((inmath, buf)); buf = ''
            inmath = not inmath; i += n
            continue
        buf += ch; i += 1
    if inmath:  # 未闭合：原样退回
        last = parts.pop() if parts else (False, '')
        parts.append((False, last[1] + '$' + buf))
    else:
        parts.append((False, buf))
    return parts


def normalize_inline(line, in_table):
    """行内公式规范化：去掉定界符内侧空白、表格里的 | 换成 \\vert、行中的 $$x$$ 改为 $x$"""
    if line.replace('\\$', '').count('$') < 2 and '\\ce{' not in line:
        return line
    if re.fullmatch(r'\s*\$\$.*\$\$\s*', line) and not in_table:
        return line  # 整行行间公式
    out = []
    for is_math, s in split_math(line):
        if is_math:
            if in_table:
                s = re.sub(r'(?<!\\)\|', r'\\vert ', s)
            s = s.strip()
            out.append('$' + s + '$')
        else:
            # 公式外裸露的 \ce{...}
            s = re.sub(r'\\ce\{((?:[^{}]|\{[^{}]*\})*)\}', r'$\\ce{\1}$', s)
            out.append(s)
    return ''.join(out)


def fix(text):
    text = text.replace('\r\n', '\n')
    # 统一一级标题：去掉"——深度笔记""（深度笔记）""详细笔记"等后缀
    text = re.sub(r'\A(# .+?)\s*(?:[—–-]+\s*)?[（(]?(?:深度学术|深度|详细)笔记[)）]?\s*$', r'\1',
                  text, count=1, flags=re.M)
    text = re.sub(r'\A(# 第[一二三四五六七八九十]+章)：', r'\1 ', text)
    # 整篇被二次转义（\\Delta、\\[ ...）：反斜杠减半，但保留换行用的 \\
    if len(re.findall(r'\\\\[A-Za-z(\[\])]', text)) > 20:
        text = re.sub(r'\\\\(?=[A-Za-z()\[\]{}|,;:!])', r'\\', text)
        text = text.replace('\\\\\\\\', '\\\\')
    # 公式命令前多了一个反斜杠：\\xrightarrow → \xrightarrow（否则渲染成"换行 + 字母"）
    text = re.sub(r'(?<!\\)\\\\(?=[A-Za-z]{2,})', r'\\', text)
    # 100\\% → 100\%（\\ 是换行，% 之后会被当作注释吞掉）
    text = re.sub(r'(?<!\\)\\\\%', r'\\%', text)
    # 单独成行的 "$" 包裹的多行公式块 → $$\begin{gathered}...\end{gathered}$$
    text = re.sub(r'(?m)^\$\n((?:.*\\\\\n)+.*)\n\$$',
                  lambda m: '$$\n\\begin{gathered}\n' + m.group(1) + '\n\\end{gathered}\n$$', text)
    # "$^{15}" 换行 "{N}$"、"$(" 换行 "{C_6H_{10}O_5})_n$"：被吃掉了 \mathrm / \ce
    text = re.sub(r'\$([^$\n]*)\n(\{[^$\n]*\$)', r'$\1\\mathrm\2', text)
    # \text \times 等命令中的 \t 被转义成了制表符
    text = re.sub(r'\t(?=ext\{|imes|heta|au\b|o\b|riangle)', r'\\t', text)
    # \[ ... \] 和 \( ... \) 定界符 VitePress 不识别，改为 $$ / $
    text = re.sub(r'(?m)^(\s*)\\\[\s*$', r'\1$$', text)
    text = re.sub(r'(?m)^(\s*)\\\]\s*$', r'\1$$', text)
    text = re.sub(r'(?<!\\)\\\[(.+?)\\\]', r'$$\1$$', text)
    text = re.sub(r'(?<!\\)\\\((.+?)\\\)', lambda m: '$' + m.group(1).strip() + '$', text)
    # 公式内部又嵌了 $..$，会把公式截断：
    # \text{（$m$、$T$不变）} → \text{（}m\text{、}T\text{不变）}
    text = re.sub(r'\\text\{([^{}\n]*\$[^{}\n]*)\}',
                  lambda t: '\\text{' + re.sub(r'\$([^$]+)\$', r'}\1\\text{', t.group(1)) + '}', text)
    # \ce{M - $n$e- -> ...} → \ce{M - ne- -> ...}
    text = re.sub(r'\$([a-z])\$e-', r'\1e-', text)

    lines = text.split('\n')
    out = []
    i = 0
    incode = indisp = False
    while i < len(lines):
        l = lines[i]
        s = l.strip()
        if s.startswith('```'):
            incode = not incode
            out.append(l); i += 1; continue
        if incode:
            out.append(l); i += 1; continue
        if s == '$$' or (s.startswith('$$') and s.count('$$') == 1):
            indisp = not indisp
            out.append(l); i += 1; continue
        if indisp:
            if s.endswith('$$'):
                indisp = False
            out.append(l); i += 1; continue
        # 公式被断行：行尾留下未闭合的 $，下一行接续公式内容
        while odd(l) and i + 1 < len(lines):
            nxt = lines[i + 1]
            if nxt.strip() == '$':  # "$\ce{...}" 换行 "$"
                l = l + '$'; i += 1
                continue
            if nxt.strip() == '' and i + 2 < len(lines) and lines[i + 2].strip() == '$':
                l = l + '$'; i += 2  # 中间多一个空行
                continue
            if not l.endswith('$'):
                break
            if nxt.strip() == '':
                # 断行处多出一个空行，且下一行明显是公式续行
                if i + 2 < len(lines) and re.match(r'\\|\t', lines[i + 2]):
                    i += 1
                    nxt = lines[i + 1]
                else:
                    break
            if re.match(r'ight|ho\b', nxt):
                nxt = '\\r' + nxt  # \r 被当作回车吃掉
            elif nxt.startswith('{'):
                nxt = '\\mathrm' + nxt  # 命令名丢失，只剩 {...}
            l = l + nxt
            i += 1
        l = fix_nested(l)
        l = normalize_inline(l, l.lstrip().startswith('|'))
        # 整行只有一个公式（原本是独立成段的方程式）→ 行间公式
        m = re.fullmatch(r'\$([^$]+)\$', l)
        if m:
            l = '$$' + m.group(1) + '$$'
        out.append(l)
        i += 1
    text = '\n'.join(out)
    # 行首 "$$X$$ 后接文字"：会被当作未闭合的行间公式块，吞掉后文直到下一个 $$ → 改为行内公式
    text = re.sub(r'(?m)^\$\$([^$\n]+)\$\$(?=[^$\n]*\S)(?!\s*$)', r'$\1$', text)
    # \hat{a}} 多余右括号
    text = text.replace('\\hat{a}}', '\\hat{a}')
    # 哈伯法 "\\\rightleftharpoons^{上}_{下}" 写法
    text = re.sub(r'\\rightleftharpoons\^\{([^}]*)\}_\{([^}]*)\}',
                  r'\\xrightleftharpoons[\2]{\1}', text)
    return text


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    t = open(src, encoding='utf-8').read()
    open(dst, 'w', encoding='utf-8', newline='\n').write(fix(t))
