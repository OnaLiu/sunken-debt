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

// —— 小样的数 ——
const nums = {};
for (const r of rows('sd-xiaoyang-shu')) nums[r.项] = num(r.值);
export function N(key, fallback) {
  const v = nums[key];
  if (v === undefined || v === null || Number.isNaN(v)) {
    if (fallback === undefined) throw new Error('配表里没有这个数：' + key); // 不是玩家看的
    return fallback;
  }
  return v;
}

export const TABLES_LOADED = !!G['sd-wenan'];
