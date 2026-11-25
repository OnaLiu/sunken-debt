// 世界布局：归潮沙湾一片海。海岸在北（-z），港外航路向东通到沉船。
// 地形 = 海岸基底 + 海域按“地形与海流 → 事件 → 残骸”顺序叠加的塑形特征
import { fbm, ridge, smooth, clamp, lerp } from '../core/noise.js';

export const TYPE_NAME = { sandbay: '归潮沙湾' };
// 方位词：世界里的方向（海岸在北，-z）
export function compassWord(dx, dz) {
  const a = Math.atan2(dx, -dz); // 0 = 北，顺时针
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
}

// 水体参数：消光（每米 rgb）与散射色、焦散强度
export const WATER = {
  base: { ext: [0.17, 0.058, 0.046], col: [0.018, 0.1, 0.13], caustic: 0.9 },
  port: { ext: [0.2, 0.08, 0.07], col: [0.03, 0.1, 0.105], caustic: 0.7 },
  sandbay: { ext: [0.15, 0.048, 0.034], col: [0.025, 0.15, 0.18], caustic: 1.05 },
};

// 出发的港口（只是开局身后的码头景，不能靠泊）
export const HOME = { x: 0, z: -40 };
// 海岸上的港湾：岸线贴到港湾北侧、港外航道略挖深（只是地形，保持原来的岸线形状）
const BAYS = [HOME, { x: 470, z: -122 }, { x: 1000, z: -128 }];

// —— 海域：只有一片 ——
const REGION = { id: 'r1', idx: 0, type: 'sandbay', cx: 290, cz: 30, heading: 0, mirror: 1 };
export const REGION_R = 125;
const NONE = [];
let _one = null;
export function regionsNear(x, maxDist = 220) {
  const d = getRegion();
  const xc = Math.floor(x / 16) * 16 + 8;
  if (Math.abs(d.cx - xc) >= maxDist + 8) return NONE;
  return _one || (_one = [d]);
}
export function getRegion() {
  if (!REGION.features) REGION.features = buildFeatures(REGION);
  return REGION;
}

// 局部坐标：以海域中心为原点、heading 旋转、mirror 镜像（变体用）
export function toWorld(reg, lx, lz) {
  const c = Math.cos(reg.heading), s = Math.sin(reg.heading);
  const mz = lz * reg.mirror;
  return [reg.cx + lx * c - mz * s, reg.cz + lx * s + mz * c];
}
export function toLocal(reg, x, z) {
  const c = Math.cos(reg.heading), s = Math.sin(reg.heading);
  const dx = x - reg.cx, dz = z - reg.cz;
  return [dx * c + dz * s, (-dx * s + dz * c) * reg.mirror];
}
// 不分配数组的版本（地形高度每秒要算几万次）
function localX(reg, x, z) { return (x - reg.cx) * Math.cos(reg.heading) + (z - reg.cz) * Math.sin(reg.heading); }
function localZ(reg, x, z) { return (-(x - reg.cx) * Math.sin(reg.heading) + (z - reg.cz) * Math.cos(reg.heading)) * reg.mirror; }
function segD(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const L2 = dx * dx + dz * dz || 1e-6;
  let t = ((px - ax) * dx + (pz - az) * dz) / L2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
function segT(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1e-6);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

// 塑形特征（局部坐标下给出，构建时转为世界坐标）
function buildFeatures(reg) {
  const F = [];
  const W = (lx, lz) => toWorld(reg, lx, lz);
  const ell = (lx, lz, rx, rz, edge, h, mode = 'set', rot = 0) => { const [x, z] = W(lx, lz); F.push({ t: 'ell', x, z, rx, rz, rot: rot + reg.heading * (reg.mirror), edge, h, mode }); };
  const seg = (ax, az, bx, bz, w, edge, h, mode = 'set') => { const [x1, z1] = W(ax, az); const [x2, z2] = W(bx, bz); F.push({ t: 'seg', ax: x1, az: z1, bx: x2, bz: z2, w, edge, h, mode }); };
  const n = (x, z, f, a) => fbm(x * f + reg.idx * 17.1, z * f - reg.idx * 9.3, 3) * a;
  // 局部坐标（heading=0，局部=相对中心 (290,30)）；先大后小
  // 沙洲到沉船：缓坡与草床
  seg(-76, -16, -10, -4, 16, 30, (x, z) => { const lx = localX(reg, x, z); return lerp(-6.0, -9.6, clamp((lx + 76) / 66, 0, 1)) + n(x, z, 0.06, 0.6); });
  // 沉船所在台地：向下坡方向倾斜
  ell(2, 2, 40, 34, 30, (x, z) => { const lx = localX(reg, x, z), lz = localZ(reg, x, z); return -9.8 - 0.07 * ((lx - 2) * 0.35 + (lz - 2) * 0.95) + n(x, z, 0.05, 0.4); });
  // 深槽：船尾方向没入蓝暗
  seg(44, 86, 102, 138, 10, 24, (x, z) => -31 + n(x, z, 0.05, 1.2));
  // 下坡：货物顺坡滚落的方向
  seg(8, 24, 34, 62, 12, 20, (x, z) => { const lx = localX(reg, x, z), lz = localZ(reg, x, z); return lerp(-12.0, -19.0, segT(lx, lz, 8, 24, 34, 62)) + n(x, z, 0.09, 0.35); });
  // 沉船低舷一侧堆起的沙
  seg(-0.9, 12.5, 6.1, -10.6, 1.6, 3.5, 0.7, 'add');
  // 浅滩沙洲：航路上第一处浅水线索
  ell(-104, -22, 40, 24, 24, (x, z) => { const lx = localX(reg, x, z), lz = localZ(reg, x, z); return -3.2 + n(x, z, 0.08, 0.45) - 1.4 * smooth(12, 40, Math.hypot(lx + 104, lz + 22)); }, 'set', 0.25);
  return F;
}

function evalFeat(f, x, z, h) {
  let dOut;
  if (f.t === 'ell') {
    const c = Math.cos(f.rot), s = Math.sin(f.rot);
    const dx = x - f.x, dz = z - f.z;
    const u = (dx * c + dz * s) / f.rx, v = (-dx * s + dz * c) / f.rz;
    const r = Math.hypot(u, v);
    if (r <= 1) dOut = 0;
    else dOut = (r - 1) * Math.min(f.rx, f.rz);
  } else {
    dOut = Math.max(0, segD(x, z, f.ax, f.az, f.bx, f.bz) - f.w);
  }
  if (dOut >= f.edge) return h;
  const m = 1 - smooth(0, f.edge, dOut);
  const tgt = typeof f.h === 'function' ? f.h(x, z) : f.h;
  if (f.mode === 'add') return h + tgt * m;
  return lerp(h, tgt, m);
}

// —— 海岸 ——
export function coastZ(x) {
  let c = -150 + 34 * Math.sin(x / 210 + 0.4) + 17 * Math.sin(x / 83 + 1.7) + 9 * fbm(x / 60, 3.3, 3);
  // 港湾：海岸线贴到港湾北侧
  for (const p of BAYS) {
    const dx = (x - p.x) / 70;
    if (Math.abs(dx) < 4) c = lerp(c, p.z - 5, Math.exp(-dx * dx));
  }
  return c;
}

const _coastCache = new Map();
function coastCached(x) {
  const k = Math.round(x * 2);
  let v = _coastCache.get(k);
  if (v === undefined) { v = coastZ(k / 2); if (_coastCache.size > 20000) _coastCache.clear(); _coastCache.set(k, v); }
  return v;
}

export function baseHeight(x, z) {
  const cz = coastCached(x);
  const dc = z - cz; // >0 离岸
  if (dc < 0) {
    // 陆地：海滩→草坡→丘陵
    const land = -dc;
    const hill = 4 + 16 * fbm(x * 0.012, z * 0.012, 4) + 10 * smooth(20, 120, land);
    return Math.min(1.2 + land * 0.22, hill) + 0.6;
  }
  let d = dc < 30 ? 0.8 + dc * 0.17 : 5.9 + (dc - 30) * 0.042;
  d = Math.min(d, 26);
  d += fbm(x * 0.011, z * 0.011, 4) * 2.2 + fbm(x * 0.05, z * 0.05, 2) * 0.5;
  return -d;
}

export function heightAt(x, z) {
  let h = baseHeight(x, z);
  if (h > -0.5) return h;
  const regs = regionsNear(x, 200);
  for (const r of regs) {
    if (Math.abs(r.cz - z) > 220) continue;
    for (const f of r.features) h = evalFeat(f, x, z, h);
  }
  // 港外航道略挖深，避免搁浅
  for (const p of BAYS) {
    if (Math.abs(p.x - x) > 60) continue;
    const d = Math.hypot(x - p.x, z - (p.z + 18));
    if (d < 45) h = Math.min(h, lerp(h, -4.5, 1 - smooth(18, 45, d)));
  }
  return h;
}

// 底质：沙 / 泥 / 礁石 / 草床 权重
export function biomeAt(x, z, h) {
  let sand = 0.7, mud = 0.1 + smooth(-14, -26, h) * 0.5, rock = 0, grass = 0;
  const g = fbm(x * 0.018 + 4, z * 0.018 - 2, 3);
  grass = smooth(0.05, 0.3, g) * (1 - smooth(-12, -18, h)) * 0.8;
  rock = smooth(0.86, 0.97, ridge(x * 0.02, z * 0.02, 3)) * 0.6;
  const regs = regionsNear(x, 200);
  for (const r of regs) {
    const d = Math.hypot(x - r.cx, z - r.cz);
    const w = 1 - smooth(70, 150, d);
    if (w <= 0) continue;
    const lx = localX(r, x, z), lz = localZ(r, x, z);
    sand += w * 0.6; grass *= 1 - w * 0.3; rock *= 1 - w * 0.5;
    { const ds = Math.hypot(lx + 104, lz + 22); grass = Math.max(grass, (1 - smooth(14, 30, ds)) * smooth(0.0, 0.4, fbm(x * 0.12, z * 0.12, 2) + 0.15) * 0.9); }
  }
  const s = sand + mud + rock + grass;
  return [sand / s, mud / s, rock / s, grass / s];
}

export function waterKindAt(x, z) {
  const r = getRegion();
  return Math.hypot(x - r.cx, z - r.cz) < 140 ? r.type : 'base';
}
