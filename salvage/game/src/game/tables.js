// 读表：玩家看得到的字和要调的数都在 配表.md，biao.py gen 生成到 表/生成/*.js（globalThis.GAME_TABLES，页面上在 build/game.js 之前载入）。
// 游戏只从这里拿字和数，代码里不另写一份。全游戏一份：小样、三小段起都从这里读，以后切片也往表里加行。

const G = globalThis.GAME_TABLES || {};
const rows = (id) => (G[id] ? G[id].rows : []);
const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

// —— 文案：表里那一句，{n} 这类换成这一刻的数 ——
const textRows = {};
for (const r of rows('sd-wenan')) textRows[r.id] = r.字;
export function T(id, vars) {
  let s = textRows[id];
  if (s === undefined) return id;
  if (vars) s = s.replace(/[{｛]([^:：{}｛｝\n]{1,8})[}｝]/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  return s;
}

// —— 捞获：名字、价值、说明、珍贵、重（揭晓那一刻给玩家看的）——
export const LOOT = {};
for (const r of rows('sd-laohuo')) {
  LOOT[r.id] = { name: r.名字, value: num(r.价值) || 0, desc: r.说明 || '', precious: r.珍贵 === '是', heavy: r.重 === '是' };
}

// —— 只给游戏读的数：小样的数、一局的数（一个名字只在一张表里）——
const nums = {};
for (const id of ['sd-xiaoyang-shu', 'sd-yiju-shu']) for (const r of rows(id)) nums[r.项] = num(r.值);
export function N(key, fallback) {
  const v = nums[key];
  if (v === undefined || v === null || Number.isNaN(v)) {
    if (fallback === undefined) throw new Error('配表里没有这个数：' + key); // 不是玩家看的
    return fallback;
  }
  return v;
}

// —— 设备：船坞里每一样每一级（kind 是 net / tank / deck / pump）——
export const GEAR = rows('sd-shebei').map((r) => ({ id: r.id, kind: r.设备, level: num(r.级), price: num(r.价钱) || 0, value: num(r.数) || 0 }));

// —— 债：一页一页（还清以后开放哪一片海；最后一页空着）——
export const DEBT = rows('sd-zhai').map((r) => ({ page: num(r.页), amount: num(r.要还) || 0, unlock: r.还清以后 || '' }));

// —— 名词：会接到别的规则上的词，处处同一个颜色（界面上 .kw 加颜色类）——
const KW_CLASS = { 白: 'w', 泥: 'm', 青: 'c', 金: 'g', 红: 'r' }; // 不是玩家看的：颜色名对 CSS 类
const kwList = rows('sd-mingci').map((r) => ({ w: r.词, c: KW_CLASS[r.颜色] || 'g', say: r.意思 })).sort((a, b) => b.w.length - a.w.length);
export const GLOSSARY = kwList;
const kwRe = kwList.length ? new RegExp(kwList.map((k) => k.w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g') : null;
// 一句字里的名词标出来（给 innerHTML 用；字里不带尖括号）：<em class="kw c">冲洗</em>
export function KW(s) {
  if (!kwRe || !s) return s;
  return s.replace(kwRe, (m) => `<em class="kw ${kwList.find((k) => k.w === m).c}">${m}</em>`);
}
// 表里的字直接标好名词
export const TK = (id, vars) => KW(T(id, vars));

export const TABLES_LOADED = !!G['sd-wenan'];
