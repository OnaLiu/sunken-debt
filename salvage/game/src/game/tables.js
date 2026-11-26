// 读表：玩家看得到的字和要调的数都在 配表.md，biao.py gen 生成到 表/生成/*.js（globalThis.GAME_TABLES，页面上在 build/game.js 之前载入）。
// 游戏只从这里拿字和数，代码里不另写一份。全游戏一份：以后三小段、切片都从这里读，往表里加行。

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

// —— 小样的数（三小段的数往这张表里接着加）——
const nums = {};
for (const r of rows('sd-xiaoyang-shu')) nums[r.项] = num(r.值);

// —— 设备：船坞里升的每一样、每一级（第 0 级是起步就有的那一级，没有价钱）——
export const GEAR = {};
for (const r of rows('sd-shebei')) {
  const d = (GEAR[r.id] = GEAR[r.id] || { id: r.id, name: r.设备, unit: r.单位 || '', what: r.管什么 || '', levels: [] });
  d.levels[num(r.级) || 0] = { lv: num(r.级) || 0, price: num(r.价钱) || 0, val: num(r.值), adds: r.船上多了什么 || '' };
}

// —— 债本：一页一页（要还多少、还清以后开哪一片海）——
export const DEBT = rows('sd-zhaiben').map((r) => ({ page: num(r.页), due: num(r.要还) || 0, sea: r.还清以后 || '' }));
export function N(key, fallback) {
  const v = nums[key];
  if (v === undefined || v === null || Number.isNaN(v)) {
    if (fallback === undefined) throw new Error('配表里没有这个数：' + key); // 不是玩家看的
    return fallback;
  }
  return v;
}

export const TABLES_LOADED = !!G['sd-wenan'];
