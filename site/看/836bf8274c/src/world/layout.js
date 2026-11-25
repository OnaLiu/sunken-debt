import { LOOT } from '../game/tables.js';

// 归潮沙湾这一片海的摆放。顺序照设计文档 4.5：
// 地形和海流 → 一场事故 → 主要残骸和货堆 → 有限的散落和掩埋 → 线索 → 生物利用这些空间。
//
// 事故：一条中世纪木帆商船夜里擦上浅滩，船腹撞破，掉了几件东西和船板；
// 下锚想稳住，锚在沙里拖出一道沟，缆绳崩断；船被风浪推下缓坡，侧卧沉在坡上，
// 船头仍朝着岸。货从翻开的舱口和船腹破口散出，重的留在船边，滚的顺坡往下到了深槽边。

export const START = { x: -152, z: -40, heading: 0 }; // heading 0 = 朝东(+x)

// 港外航路的浮标（成对）
export const LANE_BUOYS = [];
for (let x = -214; x <= -118; x += 24) {
  LANE_BUOYS.push({ x, z: -48.5, color: 'red' });
  LANE_BUOYS.push({ x: x + 8, z: -31.5, color: 'green' });
}

export const SHOAL = { x: -82, z: -30 };
export const SHOAL_MARK = { x: -91, z: -38.5 }; // 浅滩标杆，从航路就看得见
// 浅滩两只小蟹的窝：窝口一小块沙地不长草，钻进去、探出眼柄都看得见
export const SHOAL_CRABS = [{ x: -86.5, z: -33.5 }, { x: -76, z: -31 }];

// 浅滩：铜筒半埋，旁边两个零件；几米外一副锚，锚后是拖出来的沟，断缆朝东南
export const TUBE_SPOT = { x: -80.4, z: -27.2 };
export const ANCHOR_SPOT = { x: -74.6, z: -22.9, rot: -0.62 };
export const DRAG_GROOVE = [
  [-93.5, -36.0],
  [-87.0, -31.4],
  [-80.8, -26.6], // 经过铜筒旁：铜筒是锚链拖动时从泥里翻出来的一截
  [-76.0, -24.0],
];
export const KEEL_SCRAPE = [
  [-70.0, -19.0],
  [-61.0, -13.0],
  [-52.0, -8.0],
];

// 浅滩到沉船之间的船板、桶板、绳头：都来自同一条船，指向东南
export const TRAIL = [
  { kind: 'plank', x: -67.5, z: -16.8, rot: 0.5 },
  { kind: 'stave', x: -59.4, z: -12.1, rot: 1.9 },
  { kind: 'plank', x: -49.8, z: -6.4, rot: 2.6 },
  { kind: 'ropebit', x: -40.2, z: -2.6, rot: 0.3 },
  { kind: 'plank', x: -30.5, z: 0.6, rot: 1.2 },
  { kind: 'shards', x: -21.0, z: 3.0, rot: 0.0 },
];

// 礁脊：南北向一道石脊，中间有一个豁口，船当年从豁口漂过去
export const RIDGE = { ax: -50, az: -54, bx: -43, bz: 30, gapA: -11.5, gapB: -0.5 };
export const WEED_BED = { x: -114, z: -37, rx: 16, rz: 11 };

// 沉船：船头朝西北偏北（岸的方向），向右舷侧卧，甲板朝东上方，左舷船腹朝西上方
export const WRECK = {
  x: 2.0,
  z: 8.0,
  yaw: 1.897, // 船头指向 (-0.32, -0.95)
  heel: 0.8, // 约 46°，向右舷
  pitch: 0.13, // 船尾顺坡低
  length: 22,
  beam: 7.2,
};

// 深槽：沿东西走向，西浅东深
export function trenchZ(x) {
  return 36.5 + 0.14 * x + 3.0 * Math.sin(x * 0.05);
}

// 道具定义：尺寸、长什么样在这里（不是玩家看的）；名字、价值、说明、珍贵、重在配表「捞获」（表/生成/捞获.js），价值只在揭晓那一刻才给玩家看。
const ITEM_SHAPES = {
  tube: { r: 0.42, look: 'metal-tube' },
  pulley: { r: 0.22, look: 'part' },
  hinge: { r: 0.18, look: 'part' },
  anchor: { r: 0.95, look: 'anchor' },
  jar: { r: 0.34, look: 'jar' },
  jar2: { r: 0.34, look: 'jar' },
  copperset: { r: 0.42, look: 'metal-round' },
  rope: { r: 0.36, look: 'rope' },
  barrel: { r: 0.42, look: 'barrel' },
  sack: { r: 0.36, look: 'sack' },
  chest: { r: 0.36, look: 'box-iron' },
  seal: { r: 0.2, look: 'small-hard' },
  crab: { r: 0.24, look: 'crab', alive: true },
  tube2: { r: 0.42, look: 'metal-edge' },
  lantern: { r: 0.4, look: 'lantern' },
  plank: { r: 0.95, look: 'plank' },
  stave: { r: 0.45, look: 'plank' },
  ropebit: { r: 0.4, look: 'rope' },
  shards: { r: 0.4, look: 'shards' },
};
export const ITEM_DEFS = {};
for (const [k, shape] of Object.entries(ITEM_SHAPES)) {
  const L = LOOT[k] || { name: k, value: 0, desc: '', precious: false, heavy: false };
  ITEM_DEFS[k] = { name: L.name, value: L.value, desc: L.desc, ...shape, ...(L.precious ? { precious: true } : {}), ...(L.heavy ? { heavy: true } : {}) };
}

// 不在沉船里的打捞物（世界坐标；bury=埋深比例 0..1）
export const LOOSE_ITEMS = [
  { id: 'tube', kind: 'tube', x: -80.6, z: -27.3, rot: 0.55, tilt: 0.22, bury: 0.42 },
  { id: 'pulley', kind: 'pulley', x: -79.7, z: -26.6, rot: 1.2, bury: 0.12 },
  { id: 'hinge', kind: 'hinge', x: -81.35, z: -27.9, rot: 2.2, bury: 0.1 },
  { id: 'anchor', kind: 'anchor', x: -74.6, z: -22.9, rot: -0.62, bury: 0.18 },
  // 坡下掩埋区：信筒顺坡滚下来，横在坡上（筒身顺着等高线，从坡上看过来整根都在画面上），筒尾扎进泥里、
  // 带盖的那一头翘出泥面（泥包堆在扎进去的那一头）；旁边一截船材全埋着（看不见的硬物）。
  // 看上去露出大半截（bury 0.2，15 米水下也看得出是个铜筒，铜色单独少吸一点：clear），筒尾扎得和浅滩那只一样牢（grip 0.42）：
  // 网刮到船材时照样会掉
  { id: 'tube2', kind: 'tube2', x: 11.6, z: 23.4, rot: 3.1, tilt: 0.12, bury: 0.2, grip: 0.42, moundAt: -0.5, mud: 0.24, clear: 0.2 },
  // 深槽上壁：船尾铜灯
  { id: 'lantern', kind: 'lantern', x: 8.2, z: 29.6, rot: 0.8, tilt: 0.5, bury: 0.2 },
];
export const HIDDEN_TIMBER = { x: 13.2, z: 22.2, len: 3.4, rot: 2.5, r: 0.32 }; // 只露出一个角

// 沉船坐标：along 沿船头方向，side 往右舷（甲板朝的那一侧，东边）
const BX = Math.cos(WRECK.yaw), BZ = -Math.sin(WRECK.yaw);
const SX = Math.sin(WRECK.yaw), SZ = Math.cos(WRECK.yaw);
export function wreckToWorld(along, side) {
  return { x: WRECK.x + BX * along + SX * side, z: WRECK.z + BZ * along + SZ * side };
}

// 沉船外侧散落区：货从两道舱口翻出来，落在甲板那一侧的海底
export const OUTER_ITEMS = [
  { id: 'jar', kind: 'jar', along: 3.0, side: 7.7, rot: 0.4, tilt: 1.35, bury: 0.15 },
  { id: 'jar2', kind: 'jar2', along: 3.95, side: 8.35, rot: 2.1, tilt: 1.5, bury: 0.12 },
  { id: 'rope', kind: 'rope', along: 2.35, side: 8.05, rot: 0.0, bury: 0.05 },
  { id: 'copperset', kind: 'copperset', along: -2.55, side: 7.55, rot: 1.0, tilt: 0.25, bury: 0.2 },
  { id: 'barrel', kind: 'barrel', along: -3.75, side: 8.45, rot: 0.3, tilt: 1.57, bury: 0.15 },
];

// 蟹翻泥会翻出来的印章（事先就埋着）；蟹的窝在一块斜靠着的舱盖底下
export const SEAL_SPOT = { along: 0.35, side: 7.25, bury: 0.95 };
export const CRAB_HOME = { along: 1.0, side: 6.25 };
export const HATCH_COVER = { along: 1.05, side: 6.55, rot: 0.35 };
export const CRAB_STOPS = [
  { along: 0.35, side: 7.25, dig: true, t: 7.5 },
  { along: 2.7, side: 7.15, t: 5.5 },
  { along: -2.0, side: 6.95, t: 6.0 },
];

// 网位：这一片海里值得下网的地方（设计第 0 节「一共 6—8 个能下网的地方」），每处是哪几件东西。
// 收工按网位算：捞过 6 处以上、看见过的都捞上来了，游戏替玩家收工（设计第 2 节「6—8 个网位都捞过」）
export const NET_SPOTS = {
  shoal: ['tube', 'pulley', 'hinge'], // 浅滩那一小组：半埋的铜筒和旁边的零件
  anchor: ['anchor'], // 几米外那副锚
  hold: ['chest', 'sack'], // 断舱里
  jars: ['jar', 'jar2', 'rope'], // 外侧：两只陶罐和缆绳
  pots: ['copperset', 'barrel'], // 外侧：铜锅和箍桶
  dig: ['seal'], // 蟹翻出来的那一处
  slope: ['tube2'], // 坡下掩埋区
  trench: ['lantern'], // 深槽上壁
};
export const SPOTS_TO_END = 6;

export const LEVIATHAN_PATH = { fromX: 70, toX: -95 };
