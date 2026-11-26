import { LOOT } from './tables.js';
import { ITEM_SHAPES } from '../sea/index.js';

// 捞得到的每一样东西（全游戏一份）：这片海给尺寸和长什么样（sea/<海>/layout.js 的 ITEM_SHAPES），
// 名字、价值、说明、珍贵、重在配表「捞获」。不在表里的照旧给个名字、价值 0。
export const ITEM_DEFS = {};
for (const [k, shape] of Object.entries(ITEM_SHAPES)) {
  const L = LOOT[k] || { name: k, value: 0, desc: '', precious: false, heavy: false };
  ITEM_DEFS[k] = { name: L.name, value: L.value, desc: L.desc, ...shape, ...(L.precious ? { precious: true } : {}), ...(L.heavy ? { heavy: true } : {}) };
}
