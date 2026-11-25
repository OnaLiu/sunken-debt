// 现场模板：归潮沙湾 = 一处事件（侧卧的木帆商船）+ 有因果的散落 + 线索 + 生物栖息。
// 全部用海域局部坐标描述，由 heading / mirror 变换到世界；每一趟都是同一片海、同样的东西。

export const SHIPS = {
  // 宽腹木帆商船（克拉克式）：沙湾侧卧
  carrack: { L: 24, B: 7.4, D: 4.4, sternLen: 0.16, transom: 0.62, bowStart: 0.62, bowExp: 1.7, forefoot: 0.35, sheerAft: 1.4, sheerFore: 1.3, keelW: 0.1, bilge: 0.42, secExp: 0.75, tumble: 0.2, deckFrac: 0.84,
    castleCol: 0x8b6d4a, wood: 0x5e4630, wood2: 0x75593b, aft: { len: 0.22, h: 2.0 }, fore: { len: 0.15, h: 1.4 }, masts: [{ s: 0.5, h: 2.6, r: 0.32 }, { s: 0.82, h: 1.3, r: 0.24 }], bowsprit: true, bowspritLen: 1.4 },
};

export function regionTemplate(reg) {
  const T = sandbay();
  // 线索链：从港外航路那边通向沉船
  addTrail(T);
  for (const it of T.items) it.id = reg.id + ':' + it.id;
  for (const c of T.creatures) c.id = reg.id + ':' + c.id;
  T.regionId = reg.id;
  return T;
}

// —— 线索链 ——
// 沿航路驶来时先碰到的东西：只指方向，不带奖励。沙湾是一路船板（模板里已有）。
// 线索点 { clue: true, to } 记着这条线通向哪里；发现时的方位词按世界方向现算。
const TRAIL_TEXT = { label: '沙底零星散着船板，一路往{dir}', short: '船板一路往{dir}' };
function addTrail(T) {
  const txt = TRAIL_TEXT;
  const main = T.sites[0];
  // 沙湾：模板里从浅滩通向沉船的一路船板就是线索链；线索点放在离船最远的那块船板
  const wreck = T.sites.find((s) => s.id === 'wreck') || main;
  const bar = T.sites.find((s) => s.id === 'sandbar') || main;
  const span = Math.hypot(bar.x - wreck.x, bar.z - wreck.z);
  const planks = T.debris.filter((d) => (d.kind === 'plank' || d.kind === 'spar') && d.x != null && Math.hypot(d.x - wreck.x, d.z - wreck.z) > 15 && Math.hypot(d.x - wreck.x, d.z - wreck.z) < 100 && Math.hypot(d.x - bar.x, d.z - bar.z) < span);
  if (planks.length < 2) return;
  planks.sort((a, b) => Math.hypot(b.x - wreck.x, b.z - wreck.z) - Math.hypot(a.x - wreck.x, a.z - wreck.z));
  const p0 = planks[0], pn = planks[planks.length - 1];
  T.sites.push({ id: 'trail', x: p0.x, z: p0.z, r: 12, near: 24, clue: true, to: [pn.x, pn.z], target: 'wreck', label: txt.label, short: txt.short });
}

// ———————————————————— 归潮沙湾：宽腹木帆商船侧卧缓坡 ————————————————————
function sandbay() {
  const psi = Math.atan2(0.3, -1); // 船首朝岸（北偏东）
  const wrecks = [{
    id: 'w1', ship: 'carrack', seed: 3,
    params: {
      hatches: [{ s: 0.42, w: 1.8, l: 2.2, open: 1 }],
      deckHoles: [{ s0: 0.53, s1: 0.8, x0: -0.05, x1: 0.86, ragged: 0.2 }],
      breaches: [{ s0: 0.07, s1: 0.24, v0: 0.55, v1: 1.6, side: 1 }, { s0: 0.72, s1: 0.84, v0: 0.02, v1: 0.2, side: -1 }, { s0: 0.81, s1: 0.92, v0: 0.3, v1: 0.78, side: 1 }, { s0: 0.55, s1: 0.78, v0: 0.85, v1: 1.3, side: 1 }],
      roofHoles: [{ s0: 0.0, s1: 0.23, u0: 0.0, u1: 1.0 }],
      missing: 0.06,
    },
    pose: { x: 0, z: 0, yaw: psi, pitch: -0.08, roll: 0.66, embed: 0.7 },
    weather: { growthAmt: 0.32, sandAmt: 0.55, growth: 0x5d6b3e },
    // 断下来的上桅与横桁：躺在高舷一侧的沙上
    parts: [{ kind: 'mastTop', x: -9.5, z: -4.0, yaw: 0.35, len: 8.5, r: 0.24 }],
  }];
  const items = [
    // 浅滩：搁浅时丢下的锚与一组小物（同一条船）
    { id: 'tube1', key: 'letterTube', x: -105.4, z: -23.8, burial: 0.45, rotY: 0.4, attach: 'mud' },
    { id: 'sheave', key: 'sheave', x: -104.0, z: -22.9, burial: 0.12, rotY: 1.2, attach: 'mud' },
    { id: 'anchor', key: 'anchor', x: -110.5, z: -17.6, burial: 0.25, rotY: -0.18, attach: 'mud' },
    // 外侧散落区：低舷破口漏出的货
    { id: 'jug1', key: 'jug', x: 8.2, z: -3.2, burial: 0.28, rotY: 0.3, tilt: 1.35, attach: 'mud' },
    { id: 'jug2', key: 'jug', x: 9.3, z: -2.2, burial: 0.2, rotY: 2.2, attach: 'mud' },
    { id: 'plates', key: 'plates', x: 8.7, z: -1.75, burial: 0.35, rotY: 0.1, attach: 'mud', tilt: 0.2 },
    // 开放货舱（甲板破口内）
    { id: 'bag', key: 'cargoBag', ship: 'w1', s: 0.665, side: -1, v: 0.45, inward: 1.3, layer: 'hold', attach: 'mud', pairWith: 'casket' },
    { id: 'casket', key: 'casket', ship: 'w1', s: 0.69, side: -1, v: 0.42, inward: 1.3, layer: 'hold', attach: 'mud', silver: true },
    // 前舱：完整甲板下的存货，侧面破口看得见、重网下不去
    { id: 'fcask1', key: 'cask', ship: 'w1', s: 0.86, side: -1, inward: 0.6, v: 0.15, layer: 'under', sealed: true, attach: 'mud' },
    { id: 'fcask2', key: 'cask', ship: 'w1', s: 0.89, side: -1, inward: 0.9, v: 0.15, layer: 'under', sealed: true, attach: 'mud' },
    // 尾楼高舷破口：船钟落在尾舱里
    { id: 'bell', key: 'bell', ship: 'w1', s: 0.12, side: -1, v: 0.84, inward: 0.9, layer: 'hold', attach: 'mud' },
    // 蟹会翻开的埋藏小物
    { id: 'seal', key: 'seal', x: 5.2, z: -16.4, burial: 0.92, rotY: 0.6, attach: 'mud' },
    // 下坡：顺坡滚落的同款信筒，再往下是半埋的主件
    { id: 'tube2', key: 'letterTube', x: 13.5, z: 31.0, burial: 0.18, rotY: 1.0, attach: 'mud' },
    { id: 'rel', key: 'reliquary', x: 26.8, z: 49.5, burial: 0.55, rotY: -0.5, tilt: 0.25, attach: 'mud', precious: true },
  ];
  const creatures = [
    { id: 'c1', kind: 'crab', shelter: [3.9, -12.6], route: [{ x: 5.2, z: -16.4, dwell: 11, dig: 'seal' }, { x: 8.2, z: -15.2, dwell: 9 }], hide: 10, phase: 0, catchable: true },
    { id: 'c2', kind: 'crab', shelter: [5.4, 1.6], route: [{ x: 8.0, z: 0.6, dwell: 10 }, { x: 10.2, z: 1.4, dwell: 9, dig: null }], hide: 12, phase: 14, catchable: true },
    { id: 'f1', kind: 'school', home: [-90, -8], radius: 8, count: 34, depthOff: 1.2 },
    { id: 'f2', kind: 'school', home: [-6, 4], radius: 10, count: 40, depthOff: 2.5 },
    { id: 'f3', kind: 'school', home: [-60, -10], radius: 12, count: 26, depthOff: 1.5 },
  ];
  const debris = [
    // 沙洲上的拖痕方向：锚缆断头指向东
    { kind: 'plank', x: -84, z: -16, yaw: 0.2, len: 4.2 }, { kind: 'plank', x: -66, z: -11, yaw: 1.4, len: 3.9 },
    { kind: 'spar', x: -50, z: -9, yaw: 0.1, len: 7.0 }, { kind: 'plank', x: -34, z: -6, yaw: 2.4, len: 4.0 },
    { kind: 'plank', x: -20, z: -4.5, yaw: 0.7, len: 4.4 },
    // 下坡区：与船相连的木构件，露出一端（主件旁的硬边）
    { kind: 'timber', x: 28.6, z: 47.9, yaw: 2.3, len: 3.0, tilt: 0.45 },
    { kind: 'plank', x: 18, z: 38, yaw: 1.9, len: 4.0 },
  ];
  const obstacles = [{ x: 28.0, z: 48.6, r: 0.8, note: '埋在泥里的船材' }];
  const marks = [
    { kind: 'furrow', ax: -124, az: -20.5, bx: -111.4, bz: -17.7, w: 0.9 },
    { kind: 'drag', ax: 9, az: 6, bx: 20, bz: 36, w: 1.4 },
    { kind: 'drag', ax: 15, az: 33, bx: 25, bz: 47, w: 1.0 },
  ];
  const sites = [
    { id: 'sandbar', x: -104, z: -22, r: 22, label: '浅滩上的散落物', near: 26 },
    { id: 'wreck', x: 0, z: 0, r: 16, labelFar: '水下的大块暗影', label: '侧卧的木帆商船', farDist: 60, near: 34, note: '船首朝岸，低舷向下坡' },
    { id: 'downslope', x: 20, z: 40, r: 16, label: '顺坡散落的东西', near: 24 },
  ];
  const landmarks = [
    { kind: 'buoy', x: -122, z: -40, color: 0xb03a2a, label: '浅滩浮标' },
    { kind: 'tower', x: 18, z: -186, label: '岬角废塔' },
    { kind: 'stack', x: -170, z: -60 },
  ];
  // 自动演示与测试用的作业机会（只用于机器人选点；玩家界面不显示）
  const opps = [
    { id: 'o_tube', items: ['tube1', 'sheave'], tip: [-104.7, -23.35], ship: [-99.5, -31.5] },
    { id: 'o_anchor', items: ['anchor'], tip: [-110.3, -17.6], ship: [-112.0, -26.8] },
    { id: 'o_outer', items: ['jug1', 'jug2', 'plates'], tip: [8.7, -2.4], ship: [16.8, -6.8] },
    { id: 'o_hold', items: ['bag', 'casket'], tip: 'items', ship: 'auto' },
    { id: 'o_bell', items: ['bell'], tip: 'items', ship: 'auto' },
    { id: 'o_seal', items: ['seal'], tip: [5.2, -16.4], ship: [10.5, -23.5], crab: 'c1', needReveal: 'seal' },
    { id: 'o_tube2', items: ['tube2'], tip: [13.5, 31.0], ship: [20.0, 26.0] },
    { id: 'o_rel', items: ['rel'], tip: [26.4, 50.1], ship: [20.5, 56.5] },
  ];
  return { wrecks, items, creatures, debris, obstacles, marks, sites, landmarks, opps, cover: [] };
}
