#!/usr/bin/env python3
"""用例按句核：设计里范围管到的每一句，都有一条用例出自它，或者在「没有用例的」里写明为什么没有。

    python3 salvage/game/tools/用例覆盖.py [段名]        默认 第一段·归潮沙湾
    python3 salvage/game/tools/用例覆盖.py --list        每一句是哪几条用例管的（核对时看）

读 `handoff/Tasks/salvage-focus/用例.md` 里这一段那一节：
- 一条用例的「出自」一行：`- 出自：<文件>.md「<节>」〖原句里的一截〗〖…〗`，可以接着写第二个文件。
- 「没有用例的」里一行：`- <文件>.md「<节>」〖一截〗…：为什么` 只管这几截所在的句子；
  `- <文件>.md「<节>」整节：为什么` 管这一节（连它下面的小节）每一句。
- 一截以「…」结尾：管以它开头的那一整行（行里每一句）。
句子：正文一行按 。！？｜ 切开；表格一行（表头、分隔线不算）算一句。
每一截都要原样在那个文件、那一节里找得到，找不到就是用例指错了（设计改过、引错了）。
"""
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DESIGN = os.path.join(ROOT, 'handoff', 'Tasks', 'salvage-focus')
CASES = os.path.join(DESIGN, '用例.md')
FILES = ['总览.md', '玩法.md', '世界和内容.md', '信息.md', '美术和声音.md', '时刻和效果.md', '节奏和难度.md', '上手.md', '平台和发行.md', '切片.md']

SEG = '第一段·归潮沙湾'
LIST = False
for a in sys.argv[1:]:
    if a == '--list':
        LIST = True
    elif not a.startswith('-'):
        SEG = a


def parse_design(name):
    """[(heading path list, line text, [(start,end) sentence spans])]"""
    out = []
    path = []
    lines = open(os.path.join(DESIGN, name), encoding='utf-8').read().split('\n')
    for i, l in enumerate(lines):
        m = re.match(r'^(#+)\s+(.*)$', l)
        if m:
            lv = len(m.group(1))
            path = [p for p in path if p[0] < lv] + [(lv, m.group(2).strip())]
            continue
        s = l.strip()
        if not s or s == '---':
            continue
        if s.startswith('|'):
            if re.match(r'^\|[\s:|-]+\|$', s):
                continue
            nxt = lines[i + 1].strip() if i + 1 < len(lines) else ''
            if re.match(r'^\|[\s:|-]+\|$', nxt):
                continue  # 表头
            out.append(([p[1] for p in path], l, [(0, len(l))]))
            continue
        spans = []
        st = 0
        for m2 in re.finditer(r'[。！？｜]', l):
            if l[st:m2.end()].strip(' -*>|｜」）)'):
                spans.append((st, m2.end()))
            st = m2.end()
        if l[st:].strip(' -*>|｜」）)'):
            spans.append((st, len(l)))
        out.append(([p[1] for p in path], l, spans))
    return out


DOC = {f: parse_design(f) for f in FILES}
# 每一句一个格子：(文件, 行号, 句号) -> 管它的
COVER = {}
for f, rows in DOC.items():
    for li, (_, _, spans) in enumerate(rows):
        for si in range(len(spans)):
            COVER[(f, li, si)] = []


def in_sec(path, sec):
    return any(sec == p or sec in p for p in path)


errors = []


def apply(f, sec, quote, who):
    rows = DOC[f]
    whole = quote.endswith('…')
    q = quote[:-1] if whole else quote
    hit = False
    for li, (path, line, spans) in enumerate(rows):
        if sec and not in_sec(path, sec):
            continue
        if whole:
            body = line.strip().lstrip('-*0123456789. ').strip()
            if not (body.startswith(q) or line.strip().startswith(q) or line.find(q) == line.strip().find(q) == 0 or body.replace('**', '').startswith(q.replace('**', ''))):
                continue
            hit = True
            for si in range(len(spans)):
                COVER[(f, li, si)].append(who)
            continue
        k = line.find(q)
        while k >= 0:
            hit = True
            for si, (a, b) in enumerate(spans):
                if a < k + len(q) and k < b:
                    COVER[(f, li, si)].append(who)
            k = line.find(q, k + 1)
    if not hit:
        errors.append(f'{who}：{f}「{sec}」里找不到〖{quote}〗')


def apply_sec(f, sec, who):
    hit = False
    for li, (path, line, spans) in enumerate(DOC[f]):
        if in_sec(path, sec):
            hit = True
            for si in range(len(spans)):
                COVER[(f, li, si)].append(who)
    if not hit:
        errors.append(f'{who}：{f} 里没有「{sec}」这一节')


text = open(CASES, encoding='utf-8').read()
m = re.search(r'^## ' + re.escape(SEG) + r'\s*$(.*?)(?=^## |\Z)', text, re.S | re.M)
if not m:
    sys.exit(f'用例.md 里没有「## {SEG}」这一节')
body = m.group(1)

REF = re.compile(r'([^\s「」〖〗：；，]+\.md)「([^」]*)」((?:\s*〖[^〗]*〗)*|\s*整节)')
cur = None
ncase = 0
in_none = False
for line in body.split('\n'):
    h = re.match(r'^(#+)\s+(.*)$', line)
    if h:
        t = h.group(2).strip()
        mm = re.match(r'^(SW-\S+)', t)
        if mm:
            cur = mm.group(1)
            ncase += 1
        in_none = t.startswith('没有用例的')
        continue
    s = line.strip()
    if s.startswith('- 出自：') or (in_none and s.startswith('- ')):
        who = cur if s.startswith('- 出自：') else '没有用例：' + s[2:40]
        if s.startswith('- 出自：') and not cur:
            errors.append('出自写在一条用例外面：' + s[:40])
        found = False
        for r in REF.finditer(s):
            found = True
            f, sec, qs = r.group(1), r.group(2), r.group(3)
            if f not in DOC:
                errors.append(f'{who}：不认得 {f}')
                continue
            if qs.strip() == '整节':
                apply_sec(f, sec, who)
                continue
            quotes = re.findall(r'〖([^〗]*)〗', qs)
            if not quotes:
                errors.append(f'{who}：{f}「{sec}」后面没有〖原句〗')
            for q in quotes:
                apply(f, sec, q, who)
        if not found:
            errors.append(f'{who}：这一行没写出自哪一份：{s[:50]}')

miss = []
for (f, li, si), whos in COVER.items():
    if not whos:
        path, line, spans = DOC[f][li]
        a, b = spans[si]
        miss.append((f, '「' + (path[-1] if path else '') + '」', line[a:b].strip()))

if LIST:
    for (f, li, si), whos in sorted(COVER.items()):
        path, line, spans = DOC[f][li]
        a, b = spans[si]
        print(f'{f}「{path[-1] if path else ""}」 {line[a:b].strip()[:40]}  ← {", ".join(sorted(set(whos))) or "（没有）"}')

total = len(COVER)
n_case = sum(1 for w in COVER.values() if any(x.startswith('SW-') for x in w))
n_none = sum(1 for w in COVER.values() if w and not any(x.startswith('SW-') for x in w))
print(f'{SEG}：用例 {ncase} 条；设计 {total} 句，有用例的 {n_case} 句，写明没有用例的 {n_none} 句，漏的 {len(miss)} 句；引错的 {len(errors)} 处')
for e in errors:
    print('引错：' + e)
for f, sec, s in miss:
    print(f'漏了：{f}{sec} {s}')
sys.exit(1 if (miss or errors) else 0)
