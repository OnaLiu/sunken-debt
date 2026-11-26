import { fbm, vnoise, smoothstep, segDist, clamp } from '../../util/math.js';
import { SHOAL, WEED_BED, RIDGE, WRECK, DRAG_GROOVE, KEEL_SCRAPE, trenchZ } from './layout.js';

// 归潮沙湾的海底：多高（seabedY）、什么颜色和底质（seabedColor）、地形铺多大、沉船场地图盖哪一块。
// 网格怎么铺、贴图怎么接、法线怎么算是全游戏一份（world/terrain.js），它照这里的形状铺。

// 海底高度：返回 y（负数，水面为 0）
// 船头方向 = 把 +x 绕 y 转 yaw：(cos, -sin)
const BX = Math.cos(WRECK.yaw), BZ = -Math.sin(WRECK.yaw);
const SX = Math.sin(WRECK.yaw), SZ = Math.cos(WRECK.yaw); // 右舷方向

export const WRECK_AXES = { bx: BX, bz: BZ, sx: SX, sz: SZ };

function polyDist(px, pz, pts) {
  let d = 1e9, along = 0, best = 0, acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const sd = segDist(px, pz, ax, az, bx, bz);
    const len = Math.hypot(bx - ax, bz - az);
    if (sd < d) {
      d = sd;
      const t = clamp(((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / (len * len), 0, 1);
      best = acc + t * len;
    }
    acc += len;
  }
  along = best / acc;
  return { d, t: along };
}

function ridgeHeight(x, z) {
  const R = RIDGE;
  const sd = segDist(x, z, R.ax, R.az, R.bx, R.bz);
  if (sd > 9) return 0;
  // 沿脊方向的位置（用 z 近似）
  let h = (1 - smoothstep(1.5, 8.5, sd + fbm(x * 0.15, z * 0.15, 3, 9) * 3)) * 3.2;
  h *= 0.75 + 0.5 * vnoise(z * 0.12, x * 0.1, 5);
  // 豁口
  const gap = smoothstep(R.gapA - 3, R.gapA, z) * (1 - smoothstep(R.gapB, R.gapB + 3, z));
  h *= 1 - gap * 0.92;
  return h;
}

export function seabedY(x, z) {
  let d = 10.0;
  d += fbm(x * 0.018, z * 0.018, 3, 3) * 1.4;
  d += Math.max(0, z + 10) * 0.15 - Math.max(0, z - 20) * 0.05;
  // 浅滩
  const sdx = x - SHOAL.x, sdz = (z - SHOAL.z) * 1.15;
  d -= 6.1 * Math.exp(-(sdx * sdx + sdz * sdz) / (2 * 15 * 15));
  // 草床略高
  // 深槽
  const tz = trenchZ(x);
  const td = Math.abs(z - tz);
  const tfade = smoothstep(-95, -40, x);
  const tk = 1 - smoothstep(3.0, 21.0, td + fbm(x * 0.08, z * 0.08, 2, 4) * 2.5);
  d += 14.0 * tk * tk * (3 - 2 * tk) * tfade;
  // 东边更深一点，海湾外
  d += smoothstep(40, 130, x) * 6;
  // 边缘往下沉，免得看见地形的边
  d += smoothstep(-200, -250, x) * 10 + smoothstep(100, 140, x) * 10 + smoothstep(-90, -125, z) * 3 + smoothstep(85, 115, z) * 12;
  // 礁脊
  d -= ridgeHeight(x, z);
  // 拖锚沟
  const g = polyDist(x, z, DRAG_GROOVE);
  if (g.d < 1.4) {
    const fade = smoothstep(0.0, 0.25, g.t);
    d += (1 - smoothstep(0.1, 0.42, g.d)) * 0.26 * fade;
    d -= (smoothstep(0.3, 0.55, g.d) * (1 - smoothstep(0.55, 1.3, g.d))) * 0.09 * fade;
  }
  const k = polyDist(x, z, KEEL_SCRAPE);
  if (k.d < 2.2) {
    d += (1 - smoothstep(0.2, 1.6, k.d)) * 0.16 * (1 - k.t);
  }
  // 沉船压出的沙堆：右舷（低的一侧）堆得高
  {
    const rx = x - WRECK.x, rz = z - WRECK.z;
    const along = rx * BX + rz * BZ;
    const side = rx * SX + rz * SZ;
    const al = clamp(along, -10.5, 10.5);
    const dx = along - al;
    const sideC = side - 2.6;
    const dist = Math.sqrt(dx * dx + sideC * sideC);
    d -= (1 - smoothstep(0.5, 5.2, dist)) * 1.25;
    // 左舷一侧被水流掏出浅坑
    const sideP = side + 3.4;
    const distP = Math.sqrt(dx * dx + sideP * sideP * 1.5);
    d += (1 - smoothstep(0.5, 3.5, distP)) * 0.35;
  }
  // 细节起伏
  d += fbm(x * 0.21, z * 0.21, 2, 11) * 0.18;
  return -d;
}

// 底质：返回 [r,g,b,ripple,泥]（泥：0 是沙底、1 是泥底，挑铺哪一张颗粒贴图）
const C = {
  sandShallow: [0.9, 0.82, 0.62],
  sand: [0.76, 0.71, 0.58],
  silt: [0.56, 0.54, 0.47],
  mud: [0.47, 0.43, 0.36],
  weed: [0.52, 0.55, 0.38],
  rock: [0.5, 0.52, 0.5],
  deep: [0.38, 0.4, 0.4],
  groove: [0.58, 0.52, 0.42],
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function seabedColor(x, z, y) {
  const depth = -y;
  let c = mix3(C.sandShallow, C.sand, smoothstep(4, 11, depth));
  let ripple = 1;
  // 深处泥沙
  const silt = smoothstep(13, 22, depth);
  c = mix3(c, C.silt, silt);
  ripple *= 1 - silt * 0.6;
  // 草床底质
  const wx = (x - WEED_BED.x) / WEED_BED.rx, wz = (z - WEED_BED.z) / WEED_BED.rz;
  const wb = (1 - smoothstep(0.6, 1.3, Math.sqrt(wx * wx + wz * wz) + fbm(x * 0.1, z * 0.1, 2, 2) * 0.4));
  c = mix3(c, C.weed, wb * 0.8);
  ripple *= 1 - wb * 0.7;
  // 礁脊石面
  const rh = ridgeHeight(x, z);
  const rk = smoothstep(0.7, 1.8, rh);
  c = mix3(c, C.rock, rk);
  ripple *= 1 - rk;
  // 沉船周围的泥
  const rx = x - WRECK.x, rz = z - WRECK.z;
  const md = Math.hypot(rx * 0.9, rz * 0.75);
  const mudK = (1 - smoothstep(9, 22, md + fbm(x * 0.12, z * 0.12, 2, 7) * 5)) * 0.85;
  c = mix3(c, C.mud, mudK);
  ripple *= 1 - mudK * 0.6;
  // 深槽
  const td = Math.abs(z - trenchZ(x));
  const tk = (1 - smoothstep(6, 14, td)) * smoothstep(-80, -40, x);
  c = mix3(c, C.deep, tk);
  // 拖锚沟里翻出来的湿沙
  const g = polyDist(x, z, DRAG_GROOVE);
  if (g.d < 0.6) c = mix3(c, C.groove, (1 - smoothstep(0.15, 0.6, g.d)) * 0.8);
  const k = polyDist(x, z, KEEL_SCRAPE);
  if (k.d < 1.8) c = mix3(c, C.groove, (1 - smoothstep(0.3, 1.8, k.d)) * 0.45 * (1 - k.t));
  // 斑驳
  const n = vnoise(x * 0.5, z * 0.5, 31);
  c = c.map((v) => v * (0.94 + n * 0.1));
  const mudW = Math.max(silt, mudK / 0.85, tk, rk);
  return [c[0], c[1], c[2], ripple, mudW];
}

export const TERRAIN_BOUNDS = { x0: -250, x1: 140, z0: -125, z1: 115 };
export const GROUND_SITE = { x0: -14, z0: -8, size: 48 }; // 沉船场地图盖住哪一块（素材单子定的）
