#!/usr/bin/env node
// 用例核对：照一段的用例表，逐句核它管的设计有没有漏、出自的那一句在不在、该是里指的配表格子在不在。
// 不开游戏，不判过没过（过没过是关口上脚本在真游戏里走、读、比）；这里只核用例表本身写全了、写对了地方。
//
//   node tools/yongli-check.mjs <用例表.md>            核一遍：几条、哪几种、漏的句子、指不到的出自和配表
//   node tools/yongli-check.mjs <用例表.md> --list     列出管的设计里每一句（写用例时对着它写）
//   node tools/yongli-check.mjs <用例表.md> --json     结果打成一行 JSON
//
// 用例表的写法（表本身开头也写着）：
//   「管的设计」一节每一行 `- 文件.md「节名」`：这一节（连同它下面的小节）的每一句都要有着落。
//   用例表每一行：| 编号 | 出自 | 从哪一刻 | 做什么 | 看什么 | 该是 | 怎么判 |
//   出自写 `文件.md「节名」『原句里的一截』『另一截』`，几处用「；」隔开；一截要一字不差地在那一节某一句里（** 和 ` 不算）。
//   「没写成用例的」表每一行：| 出自 | 为什么没有 |，出自同上写法。
//   该是里指配表写 〔表/行/列〕，比如 〔设备/hand-2/价钱〕、〔文案/模式·吊机手/字〕：脚本照这一格的值判，表改了答案跟着变。
//   怎么判：脚本、看图、手柄（真手柄才验得出）、待定（设计里还挂着待定，定了再写走法）。
// 一句有着落：用例或「没写成用例的」里有一截出自落在这一句里。
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(0);
}
const file = path.resolve(args[0]);
const LIST = args.includes('--list');
const JSONOUT = args.includes('--json');
const text = fs.readFileSync(file, 'utf8');

// 设计文件在用例表的上一级（handoff/Tasks/<游戏>/用例/<段>.md → handoff/Tasks/<游戏>/）；配表在 「配表」一行写的路径
const designDir = path.resolve(path.dirname(file), '..');
const repo = (() => { let d = designDir; while (d !== path.dirname(d)) { if (fs.existsSync(path.join(d, '.git'))) return d; d = path.dirname(d); } return designDir; })();
const tableLine = text.match(/^配表：`([^`]+)`/m);
const tablePath = tableLine ? path.join(repo, tableLine[1]) : null;

// 表里一格用 \| 写一条竖线（出自里引的是设计里一张表的一行时）
const splitRow = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
const norm = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

// —— 设计：一节里的每一句 ——
const docs = new Map();
function doc(name) {
  if (!docs.has(name)) {
    const p = path.join(designDir, name);
    docs.set(name, fs.existsSync(p) ? fs.readFileSync(p, 'utf8').split('\n') : null);
  }
  return docs.get(name);
}
function sectionLines(name, title) {
  const L = doc(name);
  if (!L) return null;
  let start = -1, level = 0;
  for (let i = 0; i < L.length; i++) {
    const m = L[i].match(/^(#+)\s+(.*)$/);
    if (m && norm(m[2]) === norm(title)) { start = i; level = m[1].length; break; }
  }
  if (start < 0) return null;
  const out = [];
  for (let i = start + 1; i < L.length; i++) {
    const m = L[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) break;
    out.push({ n: i + 1, s: L[i] });
  }
  return out;
}
function sentences(name, title) {
  const lines = sectionLines(name, title);
  if (!lines) return null;
  const out = [];
  let inTable = false;
  for (const { n, s } of lines) {
    const t = s.trim();
    if (!t || /^#+\s/.test(t) || /^-{3,}$/.test(t)) { inTable = false; continue; }
    if (t.startsWith('|')) {
      const cells = t.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      if (!inTable) { inTable = true; continue; } // 表头
      out.push({ n, s: norm(cells.join(' | ')) });
      continue;
    }
    inTable = false;
    const body = norm(t.replace(/^(\d+\.|-)\s+/, ''));
    for (const part of body.split(/(?<=[。！？][」』）]?)(?![」』）])/)) {
      const p = part.trim();
      if (p.replace(/[\s。；！？：:、，,（）()「」]/g, '').length >= 2) out.push({ n, s: p });
    }
  }
  return out;
}

// —— 用例表 ——
const T = text.split('\n');
const scope = [];
const problems = [];
{
  let i = T.findIndex((l) => /^##\s+管的设计/.test(l));
  if (i < 0) problems.push('没有「管的设计」一节');
  else for (i++; i < T.length && !/^##\s/.test(T[i]); i++) {
    const m = T[i].match(/^-\s+(\S+\.md)「([^」]+)」/);
    if (m) scope.push({ doc: m[1], sec: m[2] });
  }
}
const SRC = /([^\s；;，『』「」|]+?\.md)「([^」]+)」((?:『[^』]+』)+)/g;
function parseFrom(cell, where) {
  const out = [];
  let m;
  SRC.lastIndex = 0;
  while ((m = SRC.exec(cell))) {
    for (const q of m[3].match(/『[^』]+』/g)) out.push({ doc: m[1], sec: m[2], q: norm(q.slice(1, -1)), where });
  }
  if (!out.length) problems.push(`${where}：出自写不出是哪一句（${cell.slice(0, 40)}）`);
  return out;
}
const cases = [];
const nocase = [];
{
  let mode = null, head = null, part = '';
  for (let i = 0; i < T.length; i++) {
    const l = T[i];
    const h = l.match(/^##\s+(.*)$/);
    if (h) { part = h[1].trim(); mode = /没写成用例/.test(part) ? 'no' : /管的设计|不在这一份|怎么写|写法/.test(part) ? null : 'case'; head = null; continue; }
    if (!mode || !l.trim().startsWith('|')) { if (!l.trim().startsWith('|')) head = null; continue; }
    const cells = splitRow(l);
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    if (!head) { head = cells; continue; }
    const row = Object.fromEntries(head.map((k, j) => [k, cells[j] ?? '']));
    if (mode === 'case') {
      const where = `第 ${i + 1} 行 ${row['编号']}`;
      for (const k of ['编号', '出自', '从哪一刻', '做什么', '看什么', '该是', '怎么判']) if (!row[k]) problems.push(`${where}：「${k}」空着`);
      cases.push({ ...row, part, line: i + 1, from: parseFrom(row['出自'] || '', where) });
    } else {
      nocase.push({ ...row, line: i + 1, from: parseFrom(row['出自'] || '', `第 ${i + 1} 行（没写成用例的）`) });
    }
  }
}

// —— 配表 ——
const tables = new Map();
if (tablePath && fs.existsSync(tablePath)) {
  const L = fs.readFileSync(tablePath, 'utf8').split('\n');
  let name = null, head = null;
  for (const l of L) {
    const h = l.match(/^##\s+(.*)$/);
    if (h) { name = h[1].trim(); head = null; continue; }
    if (!name || !l.startsWith('|')) { head = null; continue; }
    const cells = l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    if (!head) { head = cells; if (!tables.has(name)) tables.set(name, new Map()); continue; }
    tables.get(name).set(cells[0], Object.fromEntries(head.map((k, j) => [k, cells[j] ?? ''])));
  }
} else problems.push(`配表找不到：${tablePath || '用例表开头没写「配表：`路径`」'}`);
const REF = /〔([^/〕]+)\/([^/〕]+)\/([^/〕]+)〕/g;
let refs = 0;
for (const c of cases) {
  for (const k of ['该是', '从哪一刻', '做什么', '看什么']) {
    let m;
    REF.lastIndex = 0;
    while ((m = REF.exec(c[k] || ''))) {
      refs++;
      const t = tables.get(m[1]);
      const r = t && t.get(m[2]);
      if (!t) problems.push(`第 ${c.line} 行 ${c['编号']}：配表没有「${m[1]}」这张表`);
      else if (!r) problems.push(`第 ${c.line} 行 ${c['编号']}：「${m[1]}」没有「${m[2]}」这一行`);
      else if (!(m[3] in r)) problems.push(`第 ${c.line} 行 ${c['编号']}：「${m[1]}」没有「${m[3]}」这一列`);
    }
  }
}

// —— 编号、怎么判 ——
const KINDS = ['脚本', '看图', '手柄', '待定'];
const seen = new Set();
for (const c of cases) {
  if (seen.has(c['编号'])) problems.push(`第 ${c.line} 行：编号 ${c['编号']} 重了`);
  seen.add(c['编号']);
  if (!KINDS.includes(c['怎么判'])) problems.push(`第 ${c.line} 行 ${c['编号']}：怎么判写的是「${c['怎么判']}」，只能是 ${KINDS.join('、')}`);
}

// —— 出自在不在、每一句有没有着落 ——
const allFrom = [...cases.flatMap((c) => c.from), ...nocase.flatMap((c) => c.from)];
const secCache = new Map();
const sents = (d, s) => { const k = d + '「' + s + '」'; if (!secCache.has(k)) secCache.set(k, sentences(d, s)); return secCache.get(k); };
for (const f of allFrom) {
  const ss = sents(f.doc, f.sec);
  if (!ss) { problems.push(`${f.where}：${f.doc}「${f.sec}」找不到这一节`); continue; }
  if (!ss.some((x) => x.s.includes(f.q))) problems.push(`${f.where}：${f.doc}「${f.sec}」里没有『${f.q}』`);
  if (!scope.some((s) => s.doc === f.doc && (s.sec === f.sec || (sents(s.doc, s.sec) || []).some((x) => x.s.includes(f.q)))))
    problems.push(`${f.where}：${f.doc}「${f.sec}」不在「管的设计」里`);
}
const left = [];
let total = 0;
const listOut = [];
for (const s of scope) {
  const ss = sents(s.doc, s.sec);
  if (!ss) { problems.push(`管的设计：${s.doc}「${s.sec}」找不到这一节`); continue; }
  for (const x of ss) {
    total++;
    const hit = allFrom.filter((f) => f.doc === s.doc && x.s.includes(f.q));
    if (LIST) listOut.push(`${s.doc}:${x.n}\t${hit.length ? '✓' : '·'}\t${x.s}`);
    if (!hit.length) left.push({ doc: s.doc, sec: s.sec, n: x.n, s: x.s });
  }
}

const count = (k) => cases.filter((c) => c['怎么判'] === k).length;
const summary = { 用例: cases.length, ...Object.fromEntries(KINDS.map((k) => [k, count(k)])), 没写成用例的: nocase.length, 管的句子: total, 漏的: left.length, 指配表: refs, 写得不对的: problems.length };
if (LIST) { console.log(listOut.join('\n')); process.exit(0); }
if (JSONOUT) { console.log(JSON.stringify({ ...summary, left, problems })); process.exit(left.length || problems.length ? 1 : 0); }
console.log(`${cases.length} 条：${KINDS.map((k) => `${k} ${count(k)}`).join('，')}；没写成用例的 ${nocase.length} 处；管的设计 ${total} 句，漏的 ${left.length} 句；指配表 ${refs} 格；写得不对的 ${problems.length} 处`);
for (const x of left) console.log(`漏：${x.doc}「${x.sec}」第 ${x.n} 行：${x.s}`);
for (const p of problems) console.log(`不对：${p}`);
process.exit(left.length || problems.length ? 1 : 0);
