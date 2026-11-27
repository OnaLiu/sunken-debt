import * as THREE from 'three';
import { toon } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { BOAT, halfB } from '../world/boat.js';
import { clamp, damp, dampAngle, wrapAngle, lerp, mulberry32 } from '../util/math.js';

const _sv = new THREE.Vector3();
const _hv = new THREE.Vector3();
const _hw = new THREE.Vector3();

// 船员：值守、整理缆绳、巡视、检查设备；下网时有人操纵吊机、有人趴在舷边看；
// 冲洗时一人拿水管；揭晓后几个人同时各搬一件进舱。搬运只是动画，不影响任何玩法。

const NODES = [
  [5.15, 0], [4.55, -1.0], [4.55, 1.0], [3.0, -1.45], [3.0, 1.45],
  [1.4, -1.6], [1.4, 1.6], [-0.55, 0], [-0.6, -1.5], [-0.6, 0.98],
  [-1.3, 1.0], [-3.75, -1.72], [-3.75, 1.74], [-5.45, -0.72], [-5.45, 0.72],
  [4.2, 0], [0.55, -0.98],
];
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 4], [1, 15], [2, 15], [3, 15], [4, 15], [3, 5], [4, 6], [5, 16], [16, 8], [5, 8], [6, 9], [8, 7], [9, 7], [9, 10], [8, 11], [10, 12], [11, 13], [12, 14], [13, 14], [5, 7], [6, 7], [10, 7]];
const ADJ = NODES.map(() => []);
for (const [a, b] of EDGES) {
  const d = Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]);
  ADJ[a].push([b, d]);
  ADJ[b].push([a, d]);
}
function nearestNode(x, z) {
  let best = 0, bd = 1e9;
  for (let i = 0; i < NODES.length; i++) {
    const d = Math.hypot(NODES[i][0] - x, NODES[i][1] - z);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function route(fx, fz, tx, tz) {
  const s = nearestNode(fx, fz), t = nearestNode(tx, tz);
  const dist = NODES.map(() => Infinity), prev = NODES.map(() => -1), done = NODES.map(() => false);
  dist[s] = 0;
  for (;;) {
    let u = -1, bd = Infinity;
    for (let i = 0; i < NODES.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
    if (u < 0 || u === t) break;
    done[u] = true;
    for (const [v, w] of ADJ[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  const path = [];
  for (let u = t; u !== -1; u = prev[u]) path.unshift(NODES[u]);
  // 起点离第一个节点很近就跳过
  if (path.length && Math.hypot(path[0][0] - fx, path[0][1] - fz) < 0.4) path.shift();
  path.push([tx, tz]);
  return path;
}

// 绕开一片地方的走法（avoid(x, z) 为真就是那片）：那片里的节点、穿过它的路段都不走；extra 是临时加进来的几个落脚点。
// 起点本来就在那片里的，第一段不管（先走出来）。走不通返回 null
function routeAvoid(fx, fz, tx, tz, avoid, extra = []) {
  const P = NODES.concat(extra);
  const clean = (ax, az, bx2, bz) => {
    const n = Math.max(2, Math.ceil(Math.hypot(bx2 - ax, bz - az) / 0.15));
    for (let k = 1; k < n; k++) if (avoid(ax + ((bx2 - ax) * k) / n, az + ((bz - az) * k) / n)) return false;
    return true;
  };
  const ok = P.map((q) => !avoid(q[0], q[1]));
  const adj = P.map(() => []);
  const link = (a, b) => {
    if (!ok[a] || !ok[b] || !clean(P[a][0], P[a][1], P[b][0], P[b][1])) return;
    const d = Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
    adj[a].push([b, d]); adj[b].push([a, d]);
  };
  for (const [a, b] of EDGES) link(a, b);
  // 临时落脚点：和附近两米以内的点连起来
  for (let i = NODES.length; i < P.length; i++) for (let j = 0; j < i; j++) if (Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]) < 2.0) link(i, j);
  const inside = avoid(fx, fz);
  const dist = P.map(() => Infinity), prev = P.map(() => -1), done = P.map(() => false);
  for (let i = 0; i < P.length; i++) {
    const d = Math.hypot(P[i][0] - fx, P[i][1] - fz);
    if (ok[i] && d < 3.2 && (inside || clean(fx, fz, P[i][0], P[i][1]))) dist[i] = d;
  }
  for (;;) {
    let u = -1, bd = Infinity;
    for (let i = 0; i < P.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
    if (u < 0) break;
    done[u] = true;
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  let end = -1, be = Infinity;
  for (let i = 0; i < P.length; i++) {
    const d = Math.hypot(P[i][0] - tx, P[i][1] - tz);
    if (dist[i] < Infinity && d < 3.2 && dist[i] + d < be && clean(P[i][0], P[i][1], tx, tz)) { be = dist[i] + d; end = i; }
  }
  // 直着走过去就行（不穿过那片，也离得近）
  if ((inside || clean(fx, fz, tx, tz)) && Math.hypot(tx - fx, tz - fz) < 2.4 && Math.hypot(tx - fx, tz - fz) <= be) return [[tx, tz]];
  if (end < 0) return null;
  const path = [];
  for (let u = end; u !== -1; u = prev[u]) path.unshift(P[u]);
  if (path.length && Math.hypot(path[0][0] - fx, path[0][1] - fz) < 0.4) path.shift();
  path.push([tx, tz]);
  return path;
}

const LOOKS = [
  // 黄雨衣、雨帽、灰胡子、橙色胶手套
  { coat: 0xe8b830, pants: 0x3a4250, hat: 0xe8b830, skin: 0xd8a888, name: '老周', hair: 0x9c968c, beard: 0xb4aea4, glove: 0xd8742a, boot: 0x2a2826, cuff: 0xd8d2c4, kind: 'souwester', scale: 1.0 },
  // 藏青外套、红毛线帽、袖口一道白
  { coat: 0x34507a, pants: 0x2d2e33, hat: 0xb83a30, skin: 0xc89878, name: '阿岚', hair: 0x1e1a18, glove: 0x3a3c40, boot: 0x26292e, cuff: 0x4a4e56, kind: 'beanie', stripe: 0xd8d4c8, scale: 0.97 },
  // 橄榄背心套格子衬衫、卷袖子、鸭舌帽、络腮胡
  { coat: 0x6b7a4a, shirt: 0x6e6252, pants: 0x4a3c30, hat: 0x2e3238, skin: 0xe0b090, name: '大山', hair: 0x2a2018, beard: 0x3a2c20, boot: 0x3a2c22, cuff: 0x5a4434, kind: 'cap', vest: true, scale: 1.06 },
  // 灰毛衣（一道道针织纹）、蓝色短线帽
  { coat: 0xb8b4a8, pants: 0x34404a, hat: 0x3a5a7a, skin: 0xb08068, name: '小满', hair: 0x2c2220, boot: 0x24262a, cuff: 0x3a5a7a, kind: 'watch', knit: true, scale: 0.95 },
];

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (h) => new THREE.Color(h);
const shade = (h, k) => new THREE.Color(h).multiplyScalar(k);
// 轴对齐的方块（中心 + 半边长）
function bx(b, cx, cy, cz, hx, hy, hz, c) {
  b.box(V(cx, cy, cz), V(hx, 0, 0), V(0, hy, 0), V(0, 0, hz), c);
}
// 上下大小不同的方块：y0 处半宽 (ax, az)，y1 处半宽 (bx2, bz)，顶面可以前后错开 shift
function taper(b, cx, cz, y0, y1, ax, az, bx2, bz, c, shift = 0) {
  const b00 = V(cx - ax, y0, cz - az), b10 = V(cx + ax, y0, cz - az), b11 = V(cx + ax, y0, cz + az), b01 = V(cx - ax, y0, cz + az);
  const t00 = V(cx - bx2 + shift, y1, cz - bz), t10 = V(cx + bx2 + shift, y1, cz - bz), t11 = V(cx + bx2 + shift, y1, cz + bz), t01 = V(cx - bx2 + shift, y1, cz + bz);
  b.quad(b00, b10, b11, b01, c);
  b.quad(t00, t01, t11, t10, c);
  b.quad(b10, t10, t11, b11, c);
  b.quad(b00, b01, t01, t00, c);
  b.quad(b01, b11, t11, t01, c);
  b.quad(b00, t00, t10, b10, c);
}

let crewMat = null;
// 待机小动作的随机数单独一路：不打乱游戏里别的随机（固定种子的试跑前后对得上）
const fidgetRnd = mulberry32(5150);
function boneMesh(b) {
  if (!crewMat) crewMat = toon({ vertexColors: true, spec: 0.12, shin: 16 });
  const m = new THREE.Mesh(b.build(), crewMat);
  m.castShadow = true;
  return m;
}

// 收工时从镜头看过去会挡住人的东西（船局部坐标）：收起来的吊臂、挂在臂端的网圈和网、吊机立柱、驾驶舱、船头两根灯柱；
// 吊臂还没收回来时，它从现在的位置转回去扫过的那一片也算（tip：现在的臂端）
const STOWED_TIP = [4.3, 5.6, 0];
function endBlockers(tip) {
  const list = [
    { cyl: [0.6, 0], r: 0.55, y0: BOAT.deckY, y1: 2.6 },
    { box: [-5.0, -2.5, BOAT.deckY, 3.7, -1.4, 1.4] },
    // 灯柱很细，加上人自己的半个身宽
    { cyl: [2.4, -1.55], r: 0.24, y0: BOAT.deckY, y1: BOAT.deckY + 1.85 },
    { cyl: [2.4, 1.55], r: 0.24, y0: BOAT.deckY, y1: BOAT.deckY + 1.85 },
  ];
  const tips = [STOWED_TIP];
  if (tip && Math.hypot(tip.x - STOWED_TIP[0], tip.z - STOWED_TIP[2]) > 1) {
    const a0 = Math.atan2(tip.z, tip.x - 0.6), a1 = 0, r0 = Math.hypot(tip.x - 0.6, tip.z), r1 = STOWED_TIP[0] - 0.6;
    for (const k of [0, 0.33, 0.67]) {
      const a = a0 + (a1 - a0) * k, r = r0 + (r1 - r0) * k;
      tips.push([0.6 + Math.cos(a) * r, tip.y + (STOWED_TIP[1] - tip.y) * k, Math.sin(a) * r]);
    }
  }
  for (const [x, y, z] of tips) {
    // 吊臂本身半宽两分米，再加上人自己的半个身宽：画面上人和吊臂之间留出一道缝
    list.push({ seg: [0.6, 2.3, 0, x, y, z], r: 0.6 });
    list.push({ cyl: [x - 0.05, z], r: 1.5, y0: BOAT.deckY + 0.1, y1: Math.min(y - 0.4, BOAT.deckY + 2.8) });
  }
  return list;
}
function endBlocked(list, e, px, py, pz) {
  const dx = e.x - px, dy = e.y - py, dz = e.z - pz, L = Math.hypot(dx, dy, dz);
  // 从人往镜头走，一步一步查到船上方七米
  for (let t = 0.25; t < Math.min(L, 16); t += 0.15) {
    const x = px + (dx / L) * t, y = py + (dy / L) * t, z = pz + (dz / L) * t;
    if (y > 7) break;
    for (const b of list) {
      if (b.seg) {
        const [ax, ay, az, bx2, by, bz] = b.seg;
        const vx = bx2 - ax, vy = by - ay, vz = bz - az;
        const k = clamp(((x - ax) * vx + (y - ay) * vy + (z - az) * vz) / (vx * vx + vy * vy + vz * vz), 0, 1);
        if (Math.hypot(x - ax - vx * k, y - ay - vy * k, z - az - vz * k) < b.r) return true;
      } else if (b.cyl) {
        if (y > b.y0 && y < b.y1 && Math.hypot(x - b.cyl[0], z - b.cyl[1]) < b.r) return true;
      } else {
        const [x0, x1, y0, y1, z0, z1] = b.box;
        if (x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1) return true;
      }
    }
  }
  return false;
}
// 站在 (x, z) 的人，头、胸、手（手在身前 hx、往 hz 偏）从这几处镜头看过去有几成露着
function endVisible(list, eyes, x, z, hx, hz) {
  let vis = 0, n = 0;
  for (const e of eyes) {
    for (const [ox, y, oz] of [[0, 1.68, 0], [0, 1.25, 0], [hx, 0.98, hz]]) {
      n++;
      if (!endBlocked(list, e, x + ox, BOAT.deckY + y, z + oz)) vis++;
    }
  }
  return n ? vis / n : 1;
}
// 甲板上站得下人的地方：不在吊机立柱、舱口盖、水箱、木箱上，也不在收起来的网底下
function deckFree(x, z) {
  if (x < -2.3 || x > 4.7 || Math.abs(z) > halfB(x) - 0.38) return false;
  if (Math.hypot(x - 0.6, z) < 0.75) return false;
  if (Math.abs(x - BOAT.hatch.x) < BOAT.hatch.hx + 0.15 && Math.abs(z - BOAT.hatch.z) < BOAT.hatch.hz + 0.15) return false;
  if (Math.abs(x - BOAT.tank.x) < BOAT.tank.hx + 0.2 && Math.abs(z - BOAT.tank.z) < BOAT.tank.hz + 0.25) return false;
  if (x > -1.4 && x < 0.2 && z < -1.05) return false;
  return Math.hypot(x - 4.25, z) > 1.6;
}

// 身体各段的尺寸（米）
const HIP_Y = 0.88, THIGH = 0.44, SHIN = 0.38, UPPER = 0.29, FORE = 0.25;

// 冲洗时拿水管的人站在哪：从网包看过去，和近景镜头方向差多少（弧度）、离网包多远（米）
const WASH_ANG = 2.6;
const WASH_R = 1.75;
// 吊机手的座子（船局部）：原来扳手柄的那一处，脸朝左舷；让开时退到座子后面一步
export const HAND_SEAT = [0.55, -0.98];
export const HAND_FACE = Math.PI / 2;
const HAND_AWAY = [-0.15, -0.72];

export class Sailor {
  constructor(i, home) {
    const L = LOOKS[i];
    this.i = i;
    this.name = L.name;
    this.look = L;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); // 按个头缩放
    this.body.scale.setScalar(L.scale);
    this.root.add(this.body);
    this.hips = new THREE.Group();
    this.body.add(this.hips);
    this.buildHips(L);
    // 腿：髋 → 膝 → 踝
    this.legL = new THREE.Group(); this.legR = new THREE.Group();
    this.legL.position.set(0, HIP_Y, -0.1); this.legR.position.set(0, HIP_Y, 0.1);
    this.kneeL = new THREE.Group(); this.kneeR = new THREE.Group();
    this.ankleL = new THREE.Group(); this.ankleR = new THREE.Group();
    for (const [leg, knee, ankle] of [[this.legL, this.kneeL, this.ankleL], [this.legR, this.kneeR, this.ankleR]]) {
      leg.add(this.thighMesh(L));
      knee.position.y = -THIGH;
      leg.add(knee);
      knee.add(this.shinMesh(L));
      ankle.position.y = -SHIN;
      knee.add(ankle);
      ankle.add(this.footMesh(L));
    }
    this.hips.add(this.legL, this.legR);
    // 躯干（腰为原点，向上）
    this.torso = new THREE.Group();
    this.torso.position.y = HIP_Y;
    this.hips.add(this.torso);
    this.torso.add(this.chestMesh(L));
    // 头（脖子为原点）
    this.head = new THREE.Group();
    this.head.position.y = 0.62;
    this.torso.add(this.head);
    this.head.add(this.headMesh(L));
    this.eyes = this.eyeMesh(L);
    this.head.add(this.eyes);
    // 胳膊：肩 → 肘 → 手
    this.armL = new THREE.Group(); this.armR = new THREE.Group();
    this.armL.position.set(0, 0.53, -0.255); this.armR.position.set(0, 0.53, 0.255);
    this.elbowL = new THREE.Group(); this.elbowR = new THREE.Group();
    for (const [arm, elbow, side] of [[this.armL, this.elbowL, -1], [this.armR, this.elbowR, 1]]) {
      arm.add(this.upperMesh(L, side));
      elbow.position.y = -UPPER;
      arm.add(elbow);
      elbow.add(this.foreMesh(L, side));
    }
    this.torso.add(this.armL, this.armR);
    // 右手里的水管喷嘴
    this.nozzle = new THREE.Group();
    {
      const b = new GeoBuilder();
      b.cylinder(V(0, -0.29, 0), V(0.2, -0.27, 0), 0.028, 0.022, 6, col(0x2a2c2e));
      b.cylinder(V(0.2, -0.27, 0), V(0.27, -0.265, 0), 0.032, 0.026, 6, col(0xb08a3a));
      b.box(V(0.03, -0.33, 0), V(0.012, 0, 0), V(0, 0.04, 0), V(0, 0, 0.012), col(0x2a2c2e));
      this.nozzle.add(boneMesh(b));
    }
    this.nozzle.visible = false;
    this.elbowR.add(this.nozzle);
    // 搬东西时挂在这里
    this.hold = new THREE.Group();
    this.hold.position.set(0.42, 1.12, 0);
    this.root.add(this.hold);

    this.x = home[0]; this.z = home[1];
    this.face = 0;
    this.faceT = 0;
    this.path = [];
    this.speed = 0;
    this.walkPh = Math.random() * 6;
    this.pose = 'stand';
    this.poseT = 0;
    this.task = null;
    this.busy = false;
    this.p = { crouch: 0, armF: 0, armUp: 0, lean: 0, brow: 0, coil: 0, cheer: 0, hose: 0, lever: 0, carry: 0, look: 0, rail: 0, check: 0, watch: 0, shrug: 0, peer: 0, wipe: 0, sit: 0 };
    this.gest = null; // 一下就完的小动作：点头、耸肩、凑近看、退半步、伸手扶
    this.backX = 0; this.backZ = 0;
    this.t = Math.random() * 10;
    // 待机的小动作：换重心、东张西望、眨眼、伸懒腰
    this.still = 0;
    this.shift = 0; this.shiftT = 0; this.shiftAt = 2 + fidgetRnd() * 3;
    this.gaze = 0; this.gazeT = 0; this.gazeAt = 1 + fidgetRnd() * 3;
    this.blinkAt = 1 + fidgetRnd() * 3; this.blink = 0;
    this.fidget = null; this.fidgetT = 0; this.fidgetAt = 5 + fidgetRnd() * 6;
    // 受击（被落下的网包吓一跳）、船加减速时站稳
    this.flinch = 0; this.flinchDir = 1;
    // 惯性：船上坐标里的一根弹簧（x 往船头、z 往右舷），各人快慢不一
    this.brace = 0; this.braceS = 0;
    this.bx = 0; this.bz = 0; this.bvx = 0; this.bvz = 0;
    this.bw = 5.4 + ((i * 7) % 5) * 0.35;
  }

  buildHips(L) {
    const b = new GeoBuilder();
    // 胯、腰带和扣
    taper(b, 0, 0, HIP_Y - 0.12, HIP_Y + 0.04, 0.125, 0.175, 0.135, 0.18, col(L.pants));
    bx(b, 0, HIP_Y + 0.025, 0, 0.142, 0.03, 0.187, col(0x3a2a1e));
    bx(b, 0.142, HIP_Y + 0.025, 0, 0.008, 0.026, 0.03, col(0xc8a040));
    // 外套的下摆：雨衣长一些
    if (!L.vest) {
      const hem = L.kind === 'souwester' ? 0.2 : 0.1;
      taper(b, 0, 0, HIP_Y - hem, HIP_Y + 0.06, 0.16, 0.215, 0.15, 0.205, shade(L.coat, 0.92));
      bx(b, 0.155, HIP_Y - hem * 0.5, 0, 0.012, hem * 0.5 + 0.03, 0.012, shade(L.coat, 0.6));
    }
    this.hips.add(boneMesh(b));
  }

  thighMesh(L) {
    const b = new GeoBuilder();
    taper(b, 0, 0, -THIGH - 0.02, 0.02, 0.07, 0.07, 0.088, 0.088, col(L.pants));
    // 裤子膝盖上一块磨亮的补丁
    bx(b, 0.072, -THIGH + 0.06, 0, 0.006, 0.05, 0.05, shade(L.pants, 1.18));
    return boneMesh(b);
  }

  shinMesh(L) {
    const b = new GeoBuilder();
    taper(b, 0, 0, -0.18, 0.02, 0.068, 0.068, 0.072, 0.072, col(L.pants));
    // 胶靴筒和翻边
    taper(b, 0, 0, -SHIN, -0.14, 0.078, 0.076, 0.082, 0.08, col(L.boot));
    bx(b, 0, -0.13, 0, 0.088, 0.03, 0.086, col(L.cuff));
    return boneMesh(b);
  }

  footMesh(L) {
    const b = new GeoBuilder();
    // 脚掌朝前（+x），鞋头圆一点
    bx(b, 0.04, -0.035, 0, 0.115, 0.035, 0.078, col(L.boot));
    taper(b, 0.17, 0, -0.07, -0.01, 0.03, 0.07, 0.02, 0.06, col(L.boot));
    bx(b, 0.05, -0.064, 0, 0.15, 0.008, 0.08, col(0x141312));
    return boneMesh(b);
  }

  chestMesh(L) {
    const b = new GeoBuilder();
    const body = L.vest ? L.shirt : L.coat;
    // 腰到胸，肩膀宽一些
    taper(b, 0, 0, 0.0, 0.3, 0.145, 0.19, 0.155, 0.215, col(body));
    taper(b, 0, 0, 0.3, 0.58, 0.155, 0.215, 0.13, 0.235, col(body));
    if (L.vest) {
      // 格子衬衫：两道深色横纹；背心前后两片 + 口袋
      for (const y of [0.14, 0.36]) bx(b, 0, y, 0, 0.157, 0.012, 0.222, shade(L.shirt, 0.7));
      for (const z of [-1, 1]) {
        taper(b, 0.02, z * 0.13, -0.02, 0.56, 0.135, 0.085, 0.118, 0.07, col(L.coat));
        bx(b, 0.147, 0.24, z * 0.12, 0.006, 0.05, 0.05, shade(L.coat, 0.82));
        bx(b, 0.15, 0.29, z * 0.12, 0.004, 0.01, 0.052, shade(L.coat, 0.65));
      }
      taper(b, -0.075, 0, -0.02, 0.56, 0.08, 0.205, 0.065, 0.2, col(L.coat));
    } else {
      // 拉链 + 两个下口袋 + 肩上一道（雨衣的肩、毛衣的针织纹）
      bx(b, 0.152, 0.28, 0, 0.006, 0.28, 0.012, shade(L.coat, 0.62));
      for (const z of [-1, 1]) {
        bx(b, 0.15, 0.1, z * 0.1, 0.007, 0.055, 0.06, shade(L.coat, 0.86));
        bx(b, 0.153, 0.15, z * 0.1, 0.005, 0.01, 0.062, shade(L.coat, 0.7));
      }
      if (L.knit) for (let y = 0.05; y < 0.56; y += 0.085) bx(b, 0, y, 0, 0.158, 0.01, 0.228 - (y > 0.3 ? (y - 0.3) * 0.05 : 0), shade(L.coat, 0.84));
      if (L.kind === 'souwester') taper(b, 0, 0, 0.44, 0.58, 0.158, 0.222, 0.134, 0.238, shade(L.coat, 0.88));
      if (L.stripe) bx(b, 0, 0.42, 0, 0.158, 0.014, 0.232, col(L.stripe));
    }
    // 领子、脖子
    taper(b, 0, 0, 0.54, 0.64, 0.11, 0.13, 0.1, 0.12, L.kind === 'watch' ? shade(L.coat, 0.9) : shade(L.coat, 0.78));
    bx(b, 0, 0.62, 0, 0.06, 0.04, 0.06, col(L.skin));
    return boneMesh(b);
  }

  headMesh(L) {
    const b = new GeoBuilder();
    const skin = col(L.skin);
    // 脸：下巴窄一点
    taper(b, 0, 0, 0.02, 0.12, 0.1, 0.1, 0.115, 0.118, skin);
    taper(b, 0, 0, 0.12, 0.27, 0.115, 0.118, 0.11, 0.112, skin);
    // 鼻子、耳朵、眉毛、嘴
    taper(b, 0.122, 0, 0.1, 0.16, 0.018, 0.022, 0.008, 0.015, shade(L.skin, 0.9), -0.01);
    for (const z of [-1, 1]) {
      bx(b, -0.01, 0.135, z * 0.12, 0.025, 0.035, 0.01, shade(L.skin, 0.9));
      bx(b, 0.113, 0.2, z * 0.052, 0.006, 0.009, 0.026, col(L.hair));
    }
    bx(b, 0.112, 0.065, 0, 0.005, 0.006, 0.03, shade(L.skin, 0.62));
    // 脸颊一点红
    for (const z of [-1, 1]) bx(b, 0.112, 0.1, z * 0.07, 0.004, 0.02, 0.022, new THREE.Color(L.skin).lerp(col(0xd06050), 0.25));
    // 后脑和鬓角的头发
    bx(b, -0.085, 0.17, 0, 0.035, 0.09, 0.118, col(L.hair));
    for (const z of [-1, 1]) bx(b, 0.03, 0.19, z * 0.116, 0.06, 0.05, 0.006, col(L.hair));
    if (L.beard) {
      // 胡子：下巴和两腮
      taper(b, 0.045, 0, -0.005, 0.085, 0.075, 0.105, 0.075, 0.12, col(L.beard));
      bx(b, 0.118, 0.085, 0, 0.007, 0.012, 0.04, col(L.beard));
    }
    // 帽子
    const h = col(L.hat), hd = shade(L.hat, 0.78);
    if (L.kind === 'souwester') {
      // 雨帽：圆顶，帽檐后面长，往下耷拉
      taper(b, -0.01, 0, 0.24, 0.36, 0.13, 0.13, 0.09, 0.09, h);
      taper(b, -0.03, 0, 0.225, 0.255, 0.2, 0.19, 0.19, 0.18, hd, 0.0);
      taper(b, -0.2, 0, 0.17, 0.235, 0.06, 0.17, 0.04, 0.18, hd, 0.02);
      bx(b, 0.12, 0.236, 0, 0.012, 0.012, 0.13, shade(L.hat, 0.6));
    } else if (L.kind === 'beanie') {
      taper(b, 0, 0, 0.21, 0.37, 0.125, 0.125, 0.085, 0.085, h);
      taper(b, 0, 0, 0.2, 0.27, 0.13, 0.13, 0.13, 0.13, hd);
      bx(b, 0, 0.395, 0, 0.035, 0.03, 0.035, shade(L.hat, 1.1));
    } else if (L.kind === 'cap') {
      taper(b, -0.005, 0, 0.22, 0.34, 0.122, 0.123, 0.095, 0.1, h);
      taper(b, 0.18, 0, 0.225, 0.245, 0.08, 0.1, 0.07, 0.095, hd, 0.01);
      bx(b, 0.119, 0.29, 0, 0.004, 0.025, 0.035, col(0xc8b070));
    } else {
      taper(b, 0, 0, 0.22, 0.33, 0.124, 0.124, 0.105, 0.105, h);
      taper(b, 0, 0, 0.21, 0.26, 0.128, 0.128, 0.128, 0.128, hd);
    }
    return boneMesh(b);
  }

  eyeMesh() {
    const b = new GeoBuilder();
    for (const z of [-1, 1]) bx(b, 0.117, 0, z * 0.05, 0.006, 0.017, 0.015, col(0x1b1a1a));
    const m = boneMesh(b);
    m.position.y = 0.165;
    return m;
  }

  upperMesh(L, side) {
    const b = new GeoBuilder();
    const c = L.vest ? L.shirt : L.coat;
    // 肩头圆一点，往下细
    taper(b, 0, 0, -UPPER - 0.02, 0.0, 0.058, 0.058, 0.07, 0.07, col(c));
    bx(b, 0, -0.02, side * 0.005, 0.075, 0.05, 0.072, col(c));
    if (L.vest) bx(b, 0, -0.075, 0, 0.061, 0.012, 0.061, shade(L.shirt, 0.7));
    if (L.kind === 'souwester') bx(b, 0, -0.02, side * 0.005, 0.077, 0.052, 0.074, shade(L.coat, 0.88));
    return boneMesh(b);
  }

  foreMesh(L, side) {
    const b = new GeoBuilder();
    if (L.vest) {
      // 卷起来的袖子，露出小臂
      taper(b, 0, 0, -0.08, 0.02, 0.064, 0.064, 0.066, 0.066, shade(L.shirt, 0.85));
      taper(b, 0, 0, -FORE, -0.08, 0.046, 0.046, 0.054, 0.054, col(L.skin));
    } else {
      taper(b, 0, 0, -FORE, 0.02, 0.054, 0.054, 0.06, 0.06, col(L.coat));
      bx(b, 0, -FORE + 0.025, 0, 0.058, 0.025, 0.058, L.stripe ? col(L.stripe) : shade(L.coat, 0.78));
    }
    // 手：手掌 + 大拇指
    const hand = L.glove ? col(L.glove) : col(L.skin);
    taper(b, 0.005, 0, -FORE - 0.11, -FORE + 0.0, 0.035, 0.04, 0.045, 0.045, hand);
    bx(b, 0.04, -FORE - 0.035, -side * 0.0, 0.016, 0.03, 0.018, L.glove ? shade(L.glove, 0.9) : shade(L.skin, 0.92));
    void side;
    return boneMesh(b);
  }

  goTo(x, z) {
    this.path = route(this.x, this.z, x, z);
  }

  get moving() {
    return this.path.length > 0;
  }

  // 吓一跳：dir = 惊吓来自哪边（+1 前 / -1 后），k = 多大
  startle(k = 1, dir = 1) {
    if (k > this.flinch) { this.flinch = Math.min(1.2, k); this.flinchDir = dir; }
  }

  // 一下就完的小动作。kind：'nod' 点头，'shrug' 耸肩摊手，'peer' 凑近看，'back' 退半步（dx, dz 往哪退），'steady' 伸手扶一下，'heave' 扳闸（握住、往后一拽）。
  // tx, tz（甲板坐标）：凑近看、伸手扶时转过去对着那一点、往那儿迈一步
  // 动作都做大：默认镜头距离下头和手挪得比一个人还宽（和点头、擦手一样看得出来）
  gesture(kind, o = {}) {
    this.gest = { kind, t: 0, dur: o.dur ?? { nod: 1.15, shrug: 1.7, peer: 2.2, back: 1.9, steady: 1.4, wipe: 2.6, heave: 1.5, gloves: 1.6 }[kind], dx: o.dx || 0, dz: o.dz || 0, tx: o.tx, tz: o.tz, delay: o.delay || 0 };
  }

  // 甩水那一下：从两只手上甩出一串亮水珠，往前、往外飞，划个弧落下去（默认镜头距离下也看得见一蓬）
  shakeDrops(g) {
    if (!g || !g.fx) return;
    this.root.updateMatrixWorld(true);
    for (const [elbow, side] of [[this.elbowL, -1], [this.elbowR, 1]]) {
      elbow.localToWorld(_hw.set(0.01, -FORE - 0.07, 0));
      this.root.localToWorld(_hv.set(1, 0, side * 0.45));
      this.root.localToWorld(_sv.set(0, 0, 0));
      _hv.sub(_sv);
      for (let i = 0; i < 7; i++) {
        const r = fidgetRnd();
        g.fx.emit('splash', _hw.x, _hw.y, _hw.z, _hv.x * (1.1 + r * 1.4) + (fidgetRnd() - 0.5) * 0.7, -0.4 + fidgetRnd() * 1.3, _hv.z * (1.1 + r * 1.4) + (fidgetRnd() - 0.5) * 0.7, { size: 0.1 + fidgetRnd() * 0.05, life: 0.55 });
      }
    }
  }

  update(dt, ctx) {
    this.t += dt;
    let v = 0;
    if (this.path.length) {
      const [tx, tz] = this.path[0];
      const dx = tx - this.x, dz = tz - this.z;
      const d = Math.hypot(dx, dz);
      const sp = (this.p.carry > 0.5 ? 1.25 : 1.6) * (this.slowK || 1);
      if (d < 0.08) this.path.shift();
      else {
        const step = Math.min(d, sp * dt);
        this.x += (dx / d) * step;
        this.z += (dz / d) * step;
        this.faceT = Math.atan2(-dz, dx);
        v = sp;
      }
    }
    if (this.inPlace) v = this.inPlace; // 效果页里原地走
    this.speed = damp(this.speed, v, 10, dt);
    this.face = dampAngle(this.face, this.faceT, 9, dt);
    // 姿势目标
    const P = this.p;
    const target = { crouch: 0, armF: 0, armUp: 0, lean: 0, brow: 0, coil: 0, cheer: 0, hose: 0, lever: 0, carry: 0, look: 0, rail: 0, check: 0, watch: 0, shrug: 0, peer: 0, wipe: 0, sit: 0 };
    const pose = this.moving || this.inPlace ? (P.carry > 0.5 || this.pose === 'carryWalk' ? 'carryWalk' : 'walk') : this.pose;
    switch (pose) {
      case 'crouch': target.crouch = 1; target.armF = 0.9; target.lean = 0.5; break;
      case 'carry': case 'carryWalk': target.carry = 1; break;
      case 'lookout': target.brow = 1; target.look = 1; break;
      case 'coil': target.crouch = 0.6; target.coil = 1; target.lean = 0.35; break;
      case 'lever': target.lever = 1; target.lean = 0.1; break;
      // 吊机手坐在吊机前的座子上，右手握着手柄
      case 'sit': target.sit = 1; target.lever = 1; break;
      case 'rail': target.rail = 1; target.lean = 0.55; break;
      case 'hose': target.hose = 1; break;
      case 'watch': target.watch = 1; target.look = 0.35; break;
      case 'cheer': target.cheer = 1; target.armUp = 1; break;
      case 'check': target.check = 1; target.crouch = 0.45; target.lean = 0.45; break;
      default: break;
    }
    // 小动作：叠在姿势上
    let nod = 0, bow = 0, brim = 0, brimOff = 0, backK = 0, stepK = 0, guard = 0, reach = 0, shrugUp = 0, headShake = 0, heaveR = 0, heaveP = 0;
    this.shakeK = 0; this.shakeR = 0; this.wipeSt = 0; this.gloveK = 0; this.gloveTug = 0;
    const G = this.gest;
    if (G) {
      if (G.delay > 0) G.delay -= dt;
      else {
        G.t += dt;
        const u = G.t / G.dur;
        const env = Math.sin(Math.min(1, u) * Math.PI);
        if (G.kind === 'shrug') {
          // 耸肩摊手：肩膀猛地一提、两只小臂往外摊开手心朝上、身子往后一仰，脑袋一歪摇两下（「唉，没有」），再一下落回来
          target.shrug = u < 0.74 ? 1 : 0;
          // 拿着水管的先把水管垂下来，两只手都摊开
          if (u < 0.8) target.hose = 0;
          shrugUp = u < 0.12 ? Math.sin((u / 0.12) * Math.PI * 0.5) : u < 0.62 ? 1 - 0.25 * Math.sin(((u - 0.12) / 0.5) * Math.PI) : u < 0.78 ? Math.cos(((u - 0.62) / 0.16) * Math.PI * 0.5) : 0;
          headShake = u > 0.22 && u < 0.7 ? Math.sin(((u - 0.22) / 0.48) * Math.PI * 4) * Math.sin(((u - 0.22) / 0.48) * Math.PI) : 0;
        }
        if (G.kind === 'peer') {
          // 凑近看：转过去对着那一点、往前迈一步，弯下腰两手撑着膝盖，脑袋往前探、左右看两眼
          target.peer = u < 0.78 ? 1 : 0;
          stepK = u < 0.16 ? Math.sin((u / 0.16) * Math.PI * 0.5) : u < 0.78 ? 1 : 0.5 + 0.5 * Math.cos(((u - 0.78) / 0.22) * Math.PI);
          headShake = u > 0.3 && u < 0.72 ? Math.sin(((u - 0.3) / 0.42) * Math.PI * 2) * 0.6 : 0;
        }
        if (G.kind === 'steady') {
          // 伸手扶：转过去对着滑过来的货、跨一步弓下身，两只手往前往下一伸按住，再站回来
          reach = u < 0.22 ? Math.sin((u / 0.22) * Math.PI * 0.5) : u < 0.62 ? 1 : 0.5 + 0.5 * Math.cos(((u - 0.62) / 0.38) * Math.PI);
          stepK = reach;
          target.crouch = Math.max(target.crouch, 0.55 * reach);
        }
        if (G.kind === 'wipe') {
          // 两手顺着大腿往下抹两把（身子跟着一弯一弯），再把两手抬到胸前、猛地往下甩两下水
          // （甩到底那一下手上飞出一串水珠）。动作做大：默认镜头距离下也看得出是在擦手、甩水
          target.wipe = u < 0.5 ? 1 : 0;
          this.wipeSt = u < 0.5 ? 0.5 - 0.5 * Math.cos((u / 0.5) * Math.PI * 4) : 0;
          if (u > 0.52 && u < 0.94) {
            // 每一下：六成时间抬起来，四成时间甩下去
            const f = (((u - 0.52) / 0.42) * 2) % 1;
            this.shakeK = 1;
            this.shakeR = f < 0.6 ? Math.sin((f / 0.6) * Math.PI * 0.5) : Math.cos(((f - 0.6) / 0.4) * Math.PI * 0.5);
          }
          for (const fu of [0.52 + 0.21 * 0.85, 0.52 + 0.21 * 1.85]) {
            if (u >= fu && (G.fl ?? 0) < fu) { G.fl = fu; this.shakeDrops(ctx); }
          }
        }
        if (G.kind === 'nod') {
          // 点头：往下点一大下、再小一下，身子跟着欠一欠；手空着就抬手碰一下帽檐、再往外一挥放下
          const d1 = u < 0.55 ? Math.sin((u / 0.55) * Math.PI) : 0;
          const d2 = u >= 0.55 && u < 0.85 ? Math.sin(((u - 0.55) / 0.3) * Math.PI) * 0.45 : 0;
          nod = (d1 + d2) * 0.5;
          bow = (d1 + d2) * 0.2;
          if (P.hose < 0.3 && P.carry < 0.3) {
            const up = u < 0.25 ? u / 0.25 : u < 0.62 ? 1 : Math.max(0, 1 - (u - 0.62) / 0.33);
            brim = up * up * (3 - 2 * up);
            brimOff = u > 0.62 && u < 0.86 ? Math.sin(((u - 0.62) / 0.24) * Math.PI) : 0;
          }
        }
        if (G.kind === 'heave') {
          // 扳闸：跨上去弓身两手握住闸杆（起势）→ 身子猛往后一仰、两手往怀里一拽、膝盖一沉（发力）→ 停一拍，站回来（收势）
          heaveR = u < 0.28 ? Math.sin((u / 0.28) * Math.PI * 0.5) : u < 0.44 ? 1 : u < 0.56 ? 1 - (u - 0.44) / 0.12 : 0;
          heaveP = u < 0.4 ? 0 : u < 0.52 ? Math.sin(((u - 0.4) / 0.12) * Math.PI * 0.5) : u < 0.74 ? 1 : 0.5 + 0.5 * Math.cos(((u - 0.74) / 0.26) * Math.PI);
          stepK = heaveR * 0.8;
          target.crouch = Math.max(target.crouch, 0.25 * heaveR + 0.5 * heaveP);
        }
        if (G.kind === 'gloves') {
          // 戴手套：两只手在胸前碰到一起，左手拽右手的手套口、右手拽左手的，一下一下往上提，最后两手一合、搓一下
          const k = u < 0.15 ? Math.sin((u / 0.15) * Math.PI * 0.5) : u < 0.85 ? 1 : Math.cos(((u - 0.85) / 0.15) * Math.PI * 0.5);
          this.gloveK = k;
          this.gloveTug = u > 0.15 && u < 0.85 ? Math.sin(((u - 0.15) / 0.7) * Math.PI * 4) : 0;
          bow = Math.max(bow, 0.12 * k);
        }
        if (G.kind === 'back') {
          // 退半步：往后一跳（一大步），两手抬起来挡在胸前、身子往后仰、膝盖一弯，停一拍再走回来
          backK = u < 0.14 ? Math.sin((u / 0.14) * Math.PI * 0.5) : u < 0.58 ? 1 : 0.5 + 0.5 * Math.cos(((u - 0.58) / 0.42) * Math.PI);
          guard = u < 0.1 ? u / 0.1 : u < 0.5 ? 1 : Math.max(0, 1 - (u - 0.5) / 0.3);
        }
        // 对着那一点转过去
        if ((G.kind === 'peer' || G.kind === 'steady' || G.kind === 'heave') && G.tx !== undefined && u < 0.85) this.faceT = Math.atan2(-(G.tz - this.z), G.tx - this.x);
        if (u >= 1) this.gest = null;
      }
    }
    // 根挪开：退半步往 dx, dz 退；凑近看、伸手扶往前迈一步（对着那一点，没给就朝脸的方向）。不迈出舷墙
    let ox = 0, oz = 0;
    if (G && G.kind === 'back') { ox = G.dx * backK; oz = G.dz * backK; }
    else if (G && stepK > 0) {
      const L = G.kind === 'peer' ? 0.32 : 0.38;
      let fx = Math.cos(this.face), fz = -Math.sin(this.face);
      if (G.tx !== undefined) { const ddx = G.tx - this.x, ddz = G.tz - this.z, dd = Math.hypot(ddx, ddz); if (dd > 0.05) { fx = ddx / dd; fz = ddz / dd; } }
      const far = G.tx !== undefined ? Math.max(0, Math.hypot(G.tx - this.x, G.tz - this.z) - 0.55) : L;
      ox = fx * Math.min(L, far) * stepK; oz = fz * Math.min(L, far) * stepK;
    }
    if (ox || oz) {
      const nx = clamp(this.x + ox, -5.0, 5.2);
      const lim = Math.max(0.2, halfB(nx) - 0.32);
      this.backX = nx - this.x;
      this.backZ = clamp(this.z + oz, -lim, lim) - this.z;
    } else { this.backX = damp(this.backX, 0, 6, dt); this.backZ = damp(this.backZ, 0, 6, dt); }
    this.guardK = guard; this.reachK = reach; this.shrugUp = shrugUp; this.headShake = headShake; this.heaveR = heaveR; this.heaveP = heaveP;
    for (const k in P) P[k] = damp(P[k], target[k], 8, dt);

    // —— 待机小动作 ——
    const standing = !this.moving && !this.inPlace && (pose === 'stand' || pose === 'watch');
    this.still = standing ? this.still + dt : 0;
    this.shiftAt -= dt;
    if (this.shiftAt <= 0) { this.shiftT = this.shiftT > 0 ? -1 : 1; this.shiftAt = 3 + fidgetRnd() * 4; }
    this.shift = damp(this.shift, standing ? this.shiftT : 0, 2.2, dt);
    this.gazeAt -= dt;
    if (this.gazeAt <= 0) { this.gazeT = (fidgetRnd() * 2 - 1) * 0.8; this.gazeAt = 1.2 + fidgetRnd() * 2.8; }
    this.gaze = damp(this.gaze, this.gazeT, 7, dt);
    this.blinkAt -= dt;
    if (this.blinkAt <= 0) { this.blink = 0.14; this.blinkAt = 1.8 + fidgetRnd() * 3.5; }
    this.blink = Math.max(0, this.blink - dt);
    this.fidgetAt -= dt;
    if (standing && pose === 'stand' && this.still > 2 && this.fidgetAt <= 0 && !this.fidget) {
      this.fidget = ['stretch', 'shoulders', 'neck'][Math.floor(fidgetRnd() * 3)];
      this.fidgetT = 0;
    }
    let fs = 0; // 小动作的进度曲线 0→1→0
    if (this.fidget) {
      this.fidgetT += dt;
      const dur = this.fidget === 'stretch' ? 2.4 : 1.6;
      const u = this.fidgetT / dur;
      fs = Math.sin(Math.min(1, u) * Math.PI);
      fs = fs * fs * (3 - 2 * fs);
      if (u >= 1 || !standing) { this.fidget = null; this.fidgetAt = 6 + fidgetRnd() * 7; fs = 0; }
    }
    const fStretch = this.fidget === 'stretch' ? fs : 0;
    const fShoulder = this.fidget === 'shoulders' ? fs : 0;
    const fNeck = this.fidget === 'neck' ? fs : 0;
    this.flinch = Math.max(0, this.flinch - dt * 1.6);
    const fl = Math.sin(Math.min(1, this.flinch) * Math.PI * 0.5);
    const fq = fl * fl;
    const br = clamp(this.brace, -1, 1);
    const brs = clamp(this.braceS, -1, 1);
    // 扶栏杆的人：船一晃，手一紧、身子往下沉一点
    const grip = Math.min(1, (Math.abs(br) + Math.abs(brs)) * 1.6) * P.rail;

    // —— 走路 ——
    const walkAmt = clamp(this.speed / 1.5, 0, 1);
    this.walkPh += dt * this.speed * 4.2;
    const ph = this.walkPh;
    const sL = Math.sin(ph), sR = -sL;
    const stride = (P.carry > 0.5 ? 0.38 : 0.5) * walkAmt;
    const swingL = Math.max(0, Math.cos(ph)), swingR = Math.max(0, -Math.cos(ph));
    const bob = (Math.abs(Math.cos(ph)) - 0.6) * 0.045 * walkAmt;
    const breath = Math.sin(this.t * 1.7 + this.i);

    // 根
    this.root.position.set(this.x + this.backX, BOAT.deckY, this.z + this.backZ);
    this.root.rotation.y = this.face;
    // 蹲：大腿往前、小腿往回、脚掌放平，胯放低
    const gu = this.guardK || 0, rc = this.reachK || 0, su = this.shrugUp || 0, hs = this.headShake || 0;
    const hvR = this.heaveR || 0, hvP = this.heaveP || 0;
    const crouchA = P.crouch * 1.0 + P.rail * 0.12 + P.hose * 0.18 + fq * 0.25 + Math.abs(br) * 0.12 + Math.abs(brs) * 0.08 + grip * 0.1 + P.wipe * 0.12 * this.wipeSt + bow * 0.3 + P.peer * 0.32 + gu * 0.22 + hvP * 0.15;
    const drop = HIP_Y * (1 - Math.cos(crouchA));
    const jump = P.cheer * Math.max(0, Math.sin(this.t * 9)) * 0.12;
    const lateral = this.shift * 0.035;
    // 耸肩那一下整个人往上一提（踮一下脚）
    // 坐着：胯落到座面上（大腿放平、小腿垂下来，脚踩着甲板）
    this.hips.position.set(-P.hose * 0.03 - fq * 0.05 * this.flinchDir - P.sit * 0.12, -drop + bob + jump + breath * 0.004 + su * 0.06 - P.sit * 0.46, lateral);
    this.hips.rotation.y = -sL * 0.07 * walkAmt;
    this.hips.rotation.x = -lateral * 1.2;
    // 腿
    const legLat = lateral / HIP_Y;
    const hoseStance = P.hose * 0.22 + P.lever * 0.12;
    const tL = sL * stride + crouchA + hoseStance + br * 0.15 + P.sit * 1.42;
    const tR = sR * stride + crouchA - hoseStance * 0.6 + br * 0.15 + P.sit * 1.32;
    const kneeRest = 0.06 + (this.shift > 0 ? 0 : 0.1) * Math.abs(this.shift);
    const kneeRestR = 0.06 + (this.shift < 0 ? 0 : 0.1) * Math.abs(this.shift);
    const kL = -(2 * crouchA + walkAmt * (0.12 + 0.85 * Math.pow(swingL, 1.6)) + kneeRest * (1 - walkAmt) + hoseStance * 0.4 + P.sit * 1.42);
    const kR = -(2 * crouchA + walkAmt * (0.12 + 0.85 * Math.pow(swingR, 1.6)) + kneeRestR * (1 - walkAmt) + P.sit * 1.22);
    this.legL.rotation.set(legLat + 0.03, 0, tL);
    this.legR.rotation.set(legLat - 0.03, 0, tR);
    this.kneeL.rotation.z = kL;
    this.kneeR.rotation.z = kR;
    // 脚掌贴地；走路时后脚蹬地翘起脚跟
    this.ankleL.rotation.z = -(tL + kL) + walkAmt * 0.25 * Math.max(0, -sL) * (1 - swingL);
    this.ankleR.rotation.z = -(tR + kR) + walkAmt * 0.25 * Math.max(0, -sR) * (1 - swingR);
    this.ankleL.rotation.x = -legLat; this.ankleR.rotation.x = -legLat;
    // 躯干：前倾 + 呼吸 + 走路时肩膀反着拧
    const sk = this.shakeK || 0, skR = this.shakeR || 0;
    const lean = P.lean * 0.6 + P.peer * 0.95 + P.crouch * 0.25 - P.hose * 0.08 + P.check * 0.1 + P.watch * 0.08 - fStretch * 0.22 - fq * 0.3 * this.flinchDir + br * 0.25 + walkAmt * 0.08
      + P.wipe * (0.1 + 0.38 * this.wipeSt) + sk * 0.14 * (1 - skR) + bow - gu * 0.32 + rc * 0.55 - su * 0.24 + hvR * 0.42 - hvP * 0.55;
    this.torso.rotation.set(lateral * 1.5 + brs * 0.24, sL * 0.12 * walkAmt + P.hose * 0.25, -lean - breath * 0.012);
    // 胳膊（rotation.z 往前抬，rotation.x 往外张，肘 rotation.z 往前弯）
    const swing = sL * 0.45 * walkAmt * (1 - P.carry) * (1 - P.hose);
    let aL = -swing + P.armF * 0.9, aR = swing + P.armF * 0.9;
    let eL = 0.18 + walkAmt * 0.25 * (1 + sL) * 0.5 + P.armF * 0.3, eR = 0.18 + walkAmt * 0.25 * (1 - sL) * 0.5 + P.armF * 0.3;
    let xL = 0.08, xR = -0.08; // 自然下垂时稍微离开身子
    let yL = 0, yR = 0; // 绕竖轴：小臂往胸前收
    // 搬：两手在胸前托着
    aL += P.carry * 0.55; aR += P.carry * 0.55; eL += P.carry * 0.75; eR += P.carry * 0.75; xL += P.carry * 0.12; xR -= P.carry * 0.12; yL -= P.carry * 0.3; yR += P.carry * 0.3;
    // 水管：两手一前一后握着喷嘴，手被水压顶得一抖一抖
    const kick = Math.sin(this.t * 23) * 0.025 + Math.sin(this.t * 7.3) * 0.02;
    aR += P.hose * (0.95 + kick); eR += P.hose * 0.35; xR += P.hose * 0.3;
    aL += P.hose * (0.75 + kick); eL += P.hose * 0.95; xL -= P.hose * 0.05; yL -= P.hose * 0.55; yR += P.hose * 0.15;
    // 操纵杆：右手推拉，左手叉着
    aR += P.lever * (0.75 + Math.sin(this.t * 2.2) * 0.14); eR += P.lever * 0.35;
    aL += P.lever * 0.1; eL += P.lever * 0.5; xL += P.lever * 0.3;
    // 理缆：一只手绕圈，一只手抓着缆
    aR += P.coil * (0.7 + Math.sin(this.t * 5) * 0.32); eR += P.coil * (0.55 + Math.cos(this.t * 5) * 0.3);
    aL += P.coil * 0.55; eL += P.coil * 0.9; xL += P.coil * 0.05;
    // 瞭望：手搭凉棚
    aR += P.brow * 1.6; eR += P.brow * 1.85; xR -= P.brow * 0.55;
    // 趴舷边：两手往前撑
    aL += P.rail * 0.75; aR += P.rail * 0.75; eL += P.rail * 0.15; eR += P.rail * 0.15; xL += P.rail * 0.1; xR -= P.rail * 0.1;
    // 检查：一只手伸出去敲敲摸摸
    aR += P.check * (0.75 + Math.sin(this.t * 6) * 0.08); eR += P.check * 0.35;
    // 看热闹：双手抱在胸前
    aL += P.watch * 0.3; aR += P.watch * 0.36; eL += P.watch * 1.75; eR += P.watch * 1.7; yL -= P.watch * 0.95; yR += P.watch * 0.85;
    // 欢呼：两手举过头，挥
    if (P.cheer > 0.01) {
      const w = Math.sin(this.t * 9) * 0.3 * P.cheer;
      aL += P.armUp * 2.55 + w; aR += P.armUp * 2.55 - w; eL += P.cheer * 0.25; eR += P.cheer * 0.25;
      xL -= P.cheer * 0.3; xR += P.cheer * 0.3;
    }
    // 耸肩摊手：肩膀一提，两只胳膊往外张开、小臂往前往上摊开、手心朝上
    aL += P.shrug * 0.3; aR += P.shrug * 0.3; eL += P.shrug * 1.6; eR += P.shrug * 1.6; xL += P.shrug * 1.4; xR -= P.shrug * 1.4;
    // 退半步：两手抬到胸前挡着
    aL += gu * 1.15; aR += gu * 1.05; eL += gu * 1.45; eR += gu * 1.5; xL += gu * 0.2; xR -= gu * 0.2;
    // 伸手扶：两只胳膊往前往下伸直按住
    aL += rc * 1.0; aR += rc * 1.2; eL += rc * 0.12; eR += rc * 0.05; xL += rc * 0.12; xR -= rc * 0.12;
    // 扳闸：握住时两只胳膊往前往上伸直，拽的那一下胳膊收到胸前、肘往后一弯
    aL += hvR * 1.45 + hvP * 0.55; aR += hvR * 1.55 + hvP * 0.6; eL += hvR * 0.15 + hvP * 1.25; eR += hvR * 0.1 + hvP * 1.3;
    xL += hvR * 0.08; xR -= hvR * 0.08;
    // 收工擦手：两手从肚子前顺着大腿往下抹到膝盖上面（wipeSt 0 → 1），再收回来
    if (P.wipe > 0.01) {
      const st = this.wipeSt || 0;
      aL += P.wipe * (0.3 - 0.9 * st); aR += P.wipe * (0.3 - 0.9 * st);
      eL += P.wipe * (0.9 - 0.85 * st); eR += P.wipe * (0.9 - 0.85 * st);
      xL += P.wipe * 0.1; xR -= P.wipe * 0.1;
      yL -= P.wipe * 0.25 * (1 - st); yR += P.wipe * 0.25 * (1 - st);
    }
    // 甩水：两手抬到胸前（skR = 1），再猛地往下、往外甩
    if (sk > 0.01) {
      aL += sk * skR * 1.15; aR += sk * skR * 1.15; eL += sk * skR * 1.25; eR += sk * skR * 1.25;
      xL += sk * (0.12 + 0.25 * skR); xR -= sk * (0.12 + 0.25 * skR);
    }
    // 碰帽檐：手抬到额头前（和手搭凉棚同一个位置），放下时小臂往外一挥
    aR += brim * 1.6; eR += brim * 1.85 - brimOff * 0.7; xR -= brim * 0.55 + brimOff * 0.25;
    // 凑近看：手撑在膝盖上
    aL += P.peer * 0.85; aR += P.peer * 0.85; eL += P.peer * 0.25; eR += P.peer * 0.25; xL += P.peer * 0.1; xR -= P.peer * 0.1;
    // 伸懒腰、活动肩膀
    aL += fStretch * 2.7; aR += fStretch * 2.7; eL += fStretch * 0.1; eR += fStretch * 0.1; xL -= fStretch * 0.12; xR += fStretch * 0.12;
    const roll = Math.sin(this.fidgetT * 7) * fShoulder;
    // 吓一跳：手抬起来挡，往后缩
    aL += fq * 1.25; aR += fq * 1.1; eL += fq * 1.3; eR += fq * 1.4; xL += fq * 0.15; xR -= fq * 0.15;
    // 船晃时手往外张一点保持平衡
    const sway = Math.min(1, Math.abs(br) + Math.abs(brs)) * (1 - P.rail);
    xL += sway * 0.3 + Math.max(0, -brs) * 0.25; xR -= sway * 0.3 + Math.max(0, brs) * 0.25;
    aL -= grip * 0.2; aR -= grip * 0.2; eL += grip * 0.5; eR += grip * 0.5;
    // 戴手套：两只手抬到胸前凑在一起，一下一下往上拽手套口
    const gk = this.gloveK || 0, gt = this.gloveTug || 0;
    if (gk > 0.01) {
      aL += gk * (1.0 + gt * 0.12); aR += gk * (1.0 - gt * 0.12); eL += gk * (1.5 - gt * 0.2); eR += gk * (1.5 + gt * 0.2);
      yL -= gk * 0.6; yR += gk * 0.6; xL += gk * 0.05; xR -= gk * 0.05;
    }
    this.armL.rotation.set(xL, yL, aL);
    this.armR.rotation.set(xR, yR, aR);
    this.armL.position.y = 0.53 + breath * 0.004 + roll * 0.04 + fShoulder * 0.02 + su * 0.15;
    this.armR.position.y = 0.53 + breath * 0.004 - roll * 0.04 + fShoulder * 0.02 + su * 0.15;
    this.elbowL.rotation.z = eL;
    this.elbowR.rotation.z = eR;
    this.nozzle.visible = P.hose > 0.5;
    // 头：值守时左右看，待机时东张西望，吓到时扭开脸
    const lookSweep = P.look * Math.sin(this.t * 0.5 + this.i) * 0.7;
    const idleGaze = (1 - P.look) * this.gaze * (standing ? 1 : 0.3) * (1 - P.hose);
    this.head.rotation.set(fNeck * Math.sin(this.fidgetT * 4) * 0.25 - lateral * 1.5 + P.shrug * 0.38, lookSweep + idleGaze + (this.headTurn || 0) - sL * 0.12 * walkAmt - fq * 0.35 + hs * 0.45, P.lean * 0.3 + P.peer * 0.45 - P.crouch * 0.1 + fStretch * 0.35 + fq * 0.2 - P.brow * 0.1 - nod - P.wipe * 0.3 - sk * 0.15 - brim * 0.1 + gu * 0.25 + rc * 0.2);
    this.eyes.scale.y = this.blink > 0 || fq > 0.5 ? 0.15 : 1;
  }
}

export class Crew {
  constructor(boat, game) {
    this.boat = boat;
    this.g = game;
    this.group = new THREE.Group();
    this.group.name = 'crew';
    boat.body.add(this.group);
    const homes = [[5.1, 0.35], [-5.45, -0.72], [1.4, 1.6], [-0.6, -1.5]];
    this.sailors = homes.map((h, i) => new Sailor(i, h));
    for (const s of this.sailors) this.group.add(s.root);
    this.queue = []; // 等着搬的货
    this.mode = 'sail';
    this.idleT = 0;
    // 水管：从舱口旁的水龙头到喷嘴
    const hoseGeo = new THREE.BufferGeometry();
    hoseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3));
    this.hose = new THREE.Line(hoseGeo, new THREE.LineBasicMaterial({ color: 0x2a3a2e }));
    this.hose.frustumCulled = false;
    this.hose.visible = false;
    this.group.add(this.hose);
    this.washer = null;
    // 一甲板一起冲：几个人各拿一根水管（从两舷的水龙头拉过来）
    this.hoses = [];
    this.batch = [];
  }

  reset() {
    const homes = [[5.1, 0.35], [-5.45, -0.72], [1.4, 1.6], [-0.6, -1.5]];
    const hired = this.hired;
    this.sailors.forEach((s, i) => {
      s.x = homes[i][0]; s.z = homes[i][1]; s.path = []; s.task = null; s.busy = false; s.pose = 'stand';
      s.role = ['lookout', 'coil', 'check', 'patrol'][i]; s.roleT = 9 + i * 3.5; s.pairWith = null; s.stareSide = 0; s.endSide = 0;
      for (const c of [...s.hold.children]) s.hold.remove(c);
    });
    this.queue = [];
    this.stare = null;
    this.washer = null;
    this.ending = false;
    this.endEyes = null;
    this.endTaken = [];
    this.wipeTaken = [];
    this.atTitle = false;
    this.hose.visible = false;
    this.batch = [];
    for (const H of this.hoses) { H.line.visible = false; H.s = null; }
    if (hired) this.seatHand(true);
  }

  // —— 吊机手（雇了以后）：吊机前扳手柄的那个船员（老周）坐到带顶棚的座子上，一直在 ——
  // 座子在哪（船局部）：他原来扳手柄站的那一处，脸朝左舷
  get hand() {
    const s = this.sailors[0];
    return s.task && s.task.kind === 'crane' ? s : null;
  }

  seatHand(on, walk = false) {
    const s = this.sailors[0];
    this.hired = on;
    if (!on) { if (s.task && s.task.kind === 'crane') { s.task = null; s.pose = 'stand'; } return; }
    s.task = { kind: 'crane', st: 'sit', look: 0, lookT: 0 };
    s.path = [];
    if (walk) s.goTo(HAND_SEAT[0], HAND_SEAT[1]);
    else { s.x = HAND_SEAT[0]; s.z = HAND_SEAT[1]; s.face = s.faceT = HAND_FACE; s.p.sit = 1; s.p.lever = 1; }
    s.pose = walk ? 'stand' : 'sit';
    s.headTurn = 0;
  }

  // 吊机手每帧：坐着握手柄；让开时站到座子后面；头转向 task.lookAt（船局部的一点，没有就看前面）
  updateHand(s, T, dt) {
    if (T.st === 'sit') {
      if (s.moving) { s.pose = 'stand'; }
      else if (Math.hypot(s.x - HAND_SEAT[0], s.z - HAND_SEAT[1]) > 0.16) { s.goTo(HAND_SEAT[0], HAND_SEAT[1]); s.pose = 'stand'; }
      else {
        // 到了座子跟前：挪正坐下去
        s.x += (HAND_SEAT[0] - s.x) * Math.min(1, dt * 6);
        s.z += (HAND_SEAT[1] - s.z) * Math.min(1, dt * 6);
        s.faceT = HAND_FACE;
        s.pose = 'sit';
      }
    } else if (T.st === 'away') {
      // 让开：松开手柄站起来，往后退一步，侧过身看着你下这一网
      if (!s.moving && Math.hypot(s.x - HAND_AWAY[0], s.z - HAND_AWAY[1]) > 0.16) s.goTo(HAND_AWAY[0], HAND_AWAY[1]);
      if (!s.moving) { s.faceT = HAND_FACE + 0.5; s.pose = 'stand'; }
    }
    // 头：转向他挑的那一处、回头看镜头；别的时候慢慢转回来
    let want = 0;
    if (T.lookAt && !s.moving) {
      const a = Math.atan2(-(T.lookAt.z - s.z), T.lookAt.x - s.x);
      want = clamp(wrapAngle(a - s.face), -1.25, 1.25);
    }
    s.headTurn = damp(s.headTurn || 0, want, 7, dt);
  }

  // G01 标题画面：活还没开始，船员散在甲板上歇着（两个趴舷边看海、一个抱着胳膊、一个蹲在船头摆弄东西）
  titlePose() {
    this.atTitle = true;
    const spots = [[2.6, 1.45, -Math.PI / 2, 'rail'], [-1.2, -1.5, Math.PI / 2, 'rail'], [0.3, 0.8, 2.4, 'watch'], [4.2, -0.5, Math.PI, 'crouch']];
    this.sailors.forEach((s, i) => {
      const p = spots[i];
      s.x = p[0]; s.z = p[1]; s.path = []; s.task = null;
      s.face = s.faceT = p[2];
      s.pose = p[3];
    });
  }

  // G04 出发：一个接一个直起身、点个头，各去各的岗位（瞭望到船头、理缆到船尾……）
  toPosts() {
    this.atTitle = false;
    this.sailors.forEach((s, i) => {
      s.pose = 'stand';
      s.gesture('nod', { delay: 0.45 + i * 0.22 });
      // 点完头、手放下来再走
      s.idleT = 1.4 + i * 0.25;
      s.roleT = 9 + i * 3.5;
    });
  }

  // C14 收工：手上的活都停下，一个接一个就近站到镜头看得见的地方、侧身对着镜头擦擦手、甩两下水，
  // 再走到舷边手撑着栏杆看海。eyes：{ wipe, rail } 收工镜头在擦手那几秒、看海那几秒大概在哪儿（船局部坐标）
  wipeHands(eyes = null) {
    this.ending = true;
    this.endEyes = eyes;
    this.endBlock = endBlockers(this.g && this.g.craneTip);
    this.endTaken = [];
    this.wipeTaken = [];
    // 还没弯腰拿起货的就不去拿了（货留在甲板上），已经抱着的放进舱再来
    // 吊机手坐在座子上不动（他一直在吊机前）
    const free = this.sailors.filter((s) => !(s.task && s.task.kind === 'carry' && s.task.step !== 'go') && !(s.task && s.task.kind === 'crane'));
    free.forEach((s, i) => {
      s.task = null;
      s.path = [];
      s.pose = 'stand';
      this.pickEndSpot(s);
      s.endGo = false;
      s.endWiped = false;
      s.endRail = false;
      s.endDelay = 0.05 + i * 0.12;
    });
    return free;
  }

  // 收工站哪儿。擦手：自己附近一米多以内、头胸手都不被挡的地方（离得越近越好，彼此隔开一米）；
  // 看海：舷边一排位置里不被挡的、朝着镜头那一舷的（面朝海也就面朝镜头）、离擦手的地方近的，同一舷彼此让开一米
  pickEndSpot(s) {
    const E = this.endEyes || {}, list = this.endBlock || endBlockers(null);
    let best = null, bs = -Infinity;
    const others = this.sailors.filter((o) => o !== s && !o.endSide).map((o) => [o.x, o.z]);
    for (let k = 0; k < 17; k++) {
      const r = k === 0 ? 0 : k < 9 ? 0.7 : 1.4, a = ((k - 1) % 8) * (Math.PI / 4) + (k >= 9 ? Math.PI / 8 : 0);
      const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
      if (!deckFree(x, z)) continue;
      // 直着走过去不穿过吊机立柱
      if (r > 0 && !deckFree((s.x + x) / 2, (s.z + z) / 2)) continue;
      if (this.wipeTaken.some((q) => Math.hypot(q[0] - x, q[1] - z) < 1.0)) continue;
      let score = -r * 1.1 - others.reduce((m, q) => m + Math.max(0, 0.8 - Math.hypot(q[0] - x, q[1] - z)), 0);
      if (E.wipe) score += endVisible(list, E.wipe, x, z, 0, 0) * 4;
      if (score > bs) { bs = score; best = [x, z]; }
    }
    if (!best) best = [s.x, s.z];
    s.wipeX = best[0]; s.wipeZ = best[1];
    this.wipeTaken.push(best);
    // 擦手时侧身对着镜头（错开一点角度，四个人不一般齐）
    if (E.wipe) {
      const e = E.wipe[0];
      s.wipeFace = Math.atan2(-(e.z - s.wipeZ), e.x - s.wipeX) + (s.i % 2 ? 0.45 : -0.45);
    } else s.wipeFace = s.face;
    best = null; bs = -Infinity;
    for (const side of [-1, 1]) {
      for (let x = -2.2; x <= 4.61; x += 0.4) {
        // 右舷水箱、左舷木箱那一段站不下人；船头灯柱旁边让开
        if (side > 0 && Math.abs(x - BOAT.tank.x) < BOAT.tank.hx + 0.35) continue;
        if (side < 0 && x > -1.5 && x < 0.3) continue;
        if (Math.abs(x - 2.4) < 0.25) continue;
        if (this.endTaken.some((q) => q[2] === side && Math.abs(q[0] - x) < 1.0)) continue;
        const z = side * Math.max(0.3, halfB(x) - 0.34);
        // 收起来的网底下（网兜和刚倒出来的货在那儿）不去
        if (Math.hypot(x - 4.25, z) < 1.7) continue;
        let score = -Math.hypot(x - s.wipeX, z - s.wipeZ) * 0.3;
        if (E.rail) {
          let face = 0;
          for (const e of E.rail) face += (e.z * side) / Math.max(1, Math.hypot(e.x, e.z));
          score += endVisible(list, E.rail, x, z, 0.1, side * 0.3) * 4 + (face / E.rail.length) * 1.2;
        } else if (x > 3.4 || side !== (s.z >= 0 ? 1 : -1)) score -= 2;
        if (score > bs) { bs = score; best = [x, z, side]; }
      }
    }
    s.endSide = best[2];
    s.endX = best[0];
    this.endTaken.push(best);
  }

  // —— 外部调用 ——
  setMode(mode) {
    this.mode = mode; // 'sail' | 'arm' | 'net' | 'wash'
  }

  // phi：近景镜头在洗台的哪个方向（船局部，atan2(z, x)）。拿水管的人站在侧面，看热闹的站到网包后面，不挡镜头
  startWash(spot, phi = 0.9) {
    const deckClamp = (x, z) => {
      x = Math.max(1.7, Math.min(5.3, x));
      const lim = Math.max(0.2, halfB(x) - 0.34);
      return [x, Math.max(-lim, Math.min(lim, z))];
    };
    const at = (ang, r) => deckClamp(spot.x + Math.cos(ang) * r, spot.z + Math.sin(ang) * r);
    // 站到网包另一边、偏一点（离近景镜头比网包远，在画面上沿一角，不占一大块、不挡壳崩开）：选甲板上更宽的那一边
    const sideA = at(phi + WASH_ANG, WASH_R), sideB = at(phi - WASH_ANG, WASH_R);
    const aWide = Math.hypot(sideA[0] - spot.x, sideA[1] - spot.z) >= Math.hypot(sideB[0] - spot.x, sideB[1] - spot.z);
    const wpos = aWide ? sideA : sideB;
    const free = this.sailors.filter((s) => !s.task || s.task.kind === 'idle' || s.task.kind === 'watch');
    if (!free.length) return null;
    const w = free.sort((a, b) => Math.hypot(a.x - wpos[0], a.z - wpos[1]) - Math.hypot(b.x - wpos[0], b.z - wpos[1]))[0];
    w.task = { kind: 'wash' };
    this.washPhi = phi;
    this.washSpot = spot;
    this.washGo(w, wpos[0], wpos[1]);
    w.pose = 'hose';
    this.washer = w;
    this.washSpot = spot;
    this.hose.visible = true;
    // 其他人站到网包两边稍后一点看：近景里在画面左右，不挡网包。谁都不站到网包正后面
    // （镜头从高处往下看，站在后面的人正好叠在网包上），彼此也不挤在一处
    const cands = [];
    for (const r of [2.2, 2.7, 3.2]) for (const a of [1.55, 1.85, 2.15, 2.45]) for (const sg of [-1, 1]) {
      const p = at(phi + sg * a, r);
      const ang = Math.abs(Math.atan2(Math.sin(Math.atan2(p[1] - spot.z, p[0] - spot.x) - phi), Math.cos(Math.atan2(p[1] - spot.z, p[0] - spot.x) - phi)));
      if (ang > 1.3 && Math.hypot(p[0] - spot.x, p[1] - spot.z) > 1.7) cands.push(p);
    }
    const taken = [wpos];
    const spots = [];
    for (let k = 0; k < 3; k++) {
      let best = null, bd = -1;
      for (const c of cands) {
        const d = Math.min(...taken.map((q) => Math.hypot(q[0] - c[0], q[1] - c[1])));
        if (d > bd + 0.05) { bd = d; best = c; }
      }
      if (!best) best = at(phi + Math.PI / 2, 2.4);
      taken.push(best);
      spots.push(best);
    }
    let k = 0;
    for (const s of this.sailors) {
      if (s === w || (s.task && s.task.kind === 'carry')) continue;
      const p = spots[k++ % spots.length];
      s.task = { kind: 'watch', x: spot.x, z: spot.z };
      this.washGo(s, p[0], p[1]);
      s.pose = 'watch';
    }
    return w;
  }

  // 冲洗时走位：不踩着网包走，也不从网包和近景镜头之间穿过（镜头在网包的 phi 方向三米、高处往下看）。
  // 绕到网包两边、背着镜头的那一侧过去；网包四周临时加一圈落脚点，船头窄的地方也绕得过去
  washGo(s, x, z) {
    const sp = this.washSpot, phi = this.washPhi ?? 0.9;
    const avoid = (px, pz) => {
      const r = Math.hypot(px - sp.x, pz - sp.z);
      if (r < 1.25) return true;
      const a = Math.atan2(pz - sp.z, px - sp.x) - phi;
      return r < 3.3 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.95;
    };
    const ring = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      let px = Math.min(5.35, sp.x + Math.cos(a) * 1.45), pz = sp.z + Math.sin(a) * 1.45;
      const lim = Math.max(0.2, halfB(px) - 0.32);
      pz = Math.max(-lim, Math.min(lim, pz));
      if (!avoid(px, pz)) ring.push([px, pz]);
    }
    s.path = routeAvoid(s.x, s.z, x, z, avoid, ring) || route(s.x, s.z, x, z);
  }

  nozzle() {
    // 喷嘴的世界坐标和方向
    const w = this.washer;
    if (!w) return null;
    const local = new THREE.Vector3(w.x + Math.cos(w.face) * 0.62, BOAT.deckY + 1.05, w.z - Math.sin(w.face) * 0.62);
    const world = local.clone();
    this.boat.body.localToWorld(world);
    const dirL = new THREE.Vector3(this.washSpot.x - local.x, BOAT.deckY + 0.45 - local.y, this.washSpot.z - local.z).normalize();
    const dir = dirL.clone().transformDirection(this.boat.body.matrixWorld);
    return { world, dir, local };
  }

  // 揭晓以后拿水管的人往后让一步（离网包远一点、再往镜头背后偏一点）：近景里把地方让给东西，人不占半边画面
  washMakeRoom(d = 0.6, turn = 0.35) {
    const w = this.washer, sp = this.washSpot;
    if (!w || !sp) return;
    const phi = this.washPhi ?? 0.9;
    const r = Math.hypot(w.x - sp.x, w.z - sp.z);
    let a = Math.atan2(w.z - sp.z, w.x - sp.x);
    const off = Math.atan2(Math.sin(a - phi), Math.cos(a - phi));
    a += Math.sign(off || 1) * turn;
    const x = Math.max(1.7, Math.min(5.3, sp.x + Math.cos(a) * (r + d)));
    const lim = Math.max(0.2, halfB(x) - 0.34);
    const z = Math.max(-lim, Math.min(lim, sp.z + Math.sin(a) * (r + d)));
    w.path = route(w.x, w.z, x, z);
  }

  // —— 一甲板一起冲：几个人各拿一根水管，各冲各的那一包 ——
  // 挑 n 个手上没在搬货的（离前甲板近的先），别的人站到一边看。
  // o.near：挑离这一点近的（船局部 [x, z]）；o.hoses === false：不拿水管（去扳泵闸这类）；o.watch：看的人各站哪儿（[[x, z]…]，不给就都站到船尾正中）
  startBatch(n, o = {}) {
    const free = this.sailors.filter((s) => !(s.task && (s.task.kind === 'carry' || s.task.kind === 'crane')));
    const nx = o.near ? o.near[0] : 3.4, nz = o.near ? o.near[1] : 0;
    free.sort((a, b) => Math.hypot(a.x - nx, a.z - nz) - Math.hypot(b.x - nx, b.z - nz));
    const picked = free.slice(0, n);
    this.batch = picked;
    picked.forEach((s, i) => {
      s.task = { kind: 'bwash', on: false, x: 3.4, z: 0, k: i };
      s.pose = 'stand';
      s.gesture('nod', { delay: 0.1 + i * 0.15 });
      if (o.hoses === false) return;
      let H = this.hoses[i];
      if (!H) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2a3a2e }));
        line.frustumCulled = false;
        line.visible = false;
        this.group.add(line);
        H = this.hoses[i] = { line, s: null };
      }
      H.s = s;
    });
    // 看的人：给了站位的，各去离自己最近的那一处
    const left = o.watch ? o.watch.slice() : null;
    for (const s of this.sailors) {
      if (picked.includes(s) || (s.task && (s.task.kind === 'carry' || s.task.kind === 'crane'))) continue;
      s.task = { kind: 'watch', x: 3.4, z: 0 };
      s.pose = 'watch';
      let p = [-0.55, 0];
      if (left) {
        left.sort((a, b) => Math.hypot(a[0] - s.x, a[1] - s.z) - Math.hypot(b[0] - s.x, b[1] - s.z));
        p = left.shift() || o.watch[0];
      }
      s.goTo(p[0], p[1]);
    }
    return picked;
  }

  // 走到 (sx, sz) 站好，水管对着 (tx, tz)（船局部）
  batchGo(s, sx, sz, tx, tz) {
    if (!s.task || s.task.kind !== 'bwash') return;
    s.task.x = tx;
    s.task.z = tz;
    s.task.on = false;
    s.goTo(sx, sz);
  }

  batchSpray(s, on) {
    if (s.task && s.task.kind === 'bwash') s.task.on = on;
  }

  // 这个人到位了没有
  batchReady(s) {
    return !!s.task && s.task.kind === 'bwash' && !s.moving && Math.abs(wrapAngle(s.face - s.faceT)) < 0.35;
  }

  // 这个人的喷嘴（世界）和它对着的那一点
  batchNozzle(s) {
    const local = new THREE.Vector3(s.x + Math.cos(s.face) * 0.62, BOAT.deckY + 1.05, s.z - Math.sin(s.face) * 0.62);
    const world = this.boat.body.localToWorld(local.clone());
    return { world, local };
  }

  endBatch() {
    for (const s of this.batch) { if (s.task && s.task.kind === 'bwash') { s.task = null; s.pose = 'stand'; } }
    for (const s of this.sailors) if (s.task && s.task.kind === 'watch') { s.task = null; s.pose = 'stand'; }
    this.batch = [];
    for (const H of this.hoses) { H.line.visible = false; H.s = null; }
  }

  endWash() {
    if (this.washer) { this.washer.task = null; this.washer.pose = 'stand'; }
    this.washer = null;
    this.hose.visible = false;
  }

  // 东西砸到甲板上（lx, lz 船局部）：附近的人吓一跳，离得越近越厉害
  flinch(lx, lz, k = 1) {
    for (const s of this.sailors) {
      const d = Math.hypot(s.x - lx, s.z - lz);
      if (d > 4.5) continue;
      const toward = Math.cos(s.face) * (lx - s.x) - Math.sin(s.face) * (lz - s.z);
      s.startle(k * (1 - d / 4.5) * 1.3, toward >= 0 ? 1 : -1);
    }
  }

  cheer(all = true) {
    for (const s of this.sailors) {
      if (s.task && s.task.kind === 'carry') continue;
      s.pose = 'cheer';
      s.cheerUntil = s.t + 1.6;
      if (!all) break;
    }
  }

  // 收获揭晓后：每件货排队，船员各搬一件
  enqueue(entries) {
    for (const e of entries) this.queue.push(e);
  }

  update(dt) {
    const g = this.g;
    // 船加速、减速、转弯时：人往反方向晃一下再站稳
    const bc = g && g.boatCtl;
    if (bc) {
      const acc = dt > 0 ? (bc.speed - (this.lastSpeed ?? bc.speed)) / dt : 0;
      this.lastSpeed = bc.speed;
      // 减速人往船头冲，加速往船尾仰；往左舷转（turnRate>0）人往右舷甩。
      // 人会适应：一直在减速、一直在转，身子就站回来，只剩一点点（只对「变」起反应）
      const lat = bc.speed * bc.turnRate;
      this.accA = damp(this.accA ?? acc, acc, 1.8, dt);
      this.latA = damp(this.latA ?? lat, lat, 1.5, dt);
      this.pushX = clamp(-(acc - this.accA) * 0.36 - acc * 0.06, -1, 1);
      this.pushZ = clamp((lat - this.latA) * 0.22 + lat * 0.04, -0.9, 0.9);
      // 晃起来那一下（不是一直晃）记一次
      const br = Math.hypot(this.pushX, this.pushZ) > 0.22;
      if (br && !this.braceWas && g.pulse) g.pulse('A03', 1.5);
      this.braceWas = br;
    }
    // 分派搬运（收工了就不再派）
    for (const s of this.sailors) {
      if (!this.queue.length || this.ending) break;
      if (s === this.washer) continue;
      if (s.task && (s.task.kind === 'carry' || s.task.kind === 'bwash' || s.task.kind === 'crane')) continue;
      const e = this.queue.shift();
      s.task = { kind: 'carry', e, step: 'go' };
      const p = e.pickLocal();
      s.goTo(p.x, p.z);
      s.pose = 'stand';
    }
    for (const s of this.sailors) {
      if (s.cheerUntil && s.t > s.cheerUntil) { s.cheerUntil = 0; if (s.pose === 'cheer') s.pose = s.task && s.task.kind === 'watch' ? 'watch' : 'stand'; }
      const T = s.task;
      if (T && T.kind === 'carry') this.updateCarry(s, T, dt);
      // 船坞里装设备：走过去、蹲下、拧几下，由 game/dock.js 一步步带着，这里不管
      else if (T && T.kind === 'install') { /* dock.js */ }
      // 吊机手：坐在吊机前（雇了以后一直在）；挑一处、回头、让开、点头由 game/hand.js 带着
      else if (T && T.kind === 'crane') this.updateHand(s, T, dt);
      else if (T && T.kind === 'wash') {
        if (!s.moving) {
          s.faceT = Math.atan2(-(this.washSpot.z - s.z), this.washSpot.x - s.x);
          s.pose = 'hose';
        }
      } else if (T && T.kind === 'bwash') {
        if (!s.moving) {
          s.faceT = Math.atan2(-(T.z - s.z), T.x - s.x);
          s.pose = T.on ? 'hose' : 'stand';
        }
      } else if (T && T.kind === 'watch') {
        if (!s.moving) {
          s.faceT = Math.atan2(-(T.z - s.z), T.x - s.x);
          if (s.pose !== 'cheer') s.pose = 'watch';
        }
        // 网出水时就站好位看；回到开船、调臂才散（一甲板一起冲时一直看到冲完）
        if (this.mode !== 'wash' && this.mode !== 'net' && !this.batch.length) s.task = null;
      } else if (this.ending) {
        // 收工：不再找活，各自走到舷边，面朝海擦擦手、甩两下水，然后手撑着栏杆看海（搬货的人放下货再去）
        if (!s.endSide) { this.pickEndSpot(s); s.endGo = false; s.endWiped = false; s.endRail = false; s.endDelay = 0.2; s.pose = 'stand'; }
        if (s.endDelay > 0) s.endDelay -= dt;
        else if (!s.endGo) {
          // 先就近站过去（一米多以内，直着走）
          s.endGo = true;
          if (Math.hypot(s.wipeX - s.x, s.wipeZ - s.z) > 0.1) s.path = [[s.wipeX, s.wipeZ]];
        } else if (!s.moving && !s.endWiped) {
          s.endWiped = true;
          s.faceT = s.wipeFace;
          s.gesture('wipe', { delay: 0.15 });
        } else if (s.endWiped && !s.endRail && !(s.gest && s.gest.kind === 'wipe')) {
          // 擦完转身走到舷边
          s.endRail = true;
          s.goTo(s.endX, s.endSide * Math.max(0.3, halfB(s.endX) - 0.34));
        } else if (s.endRail && !s.moving) {
          s.faceT = -s.endSide * Math.PI / 2;
          s.pose = 'rail';
        }
      } else if (this.stare && this.mode === 'sail') {
        this.updateStare(s, dt);
      } else {
        if (s.stareSide) { s.stareSide = 0; s.idleT = 0.4 + s.i * 0.5; s.pose = 'stand'; }
        this.updateIdle(s, dt);
      }
      // 弹簧：被甩过去，回来时多摆一点再站稳
      if (dt > 0) {
        const w = s.bw, z2 = 2 * 0.4 * w;
        s.bvx += ((this.pushX || 0) - s.bx) * w * w * dt - z2 * s.bvx * dt;
        s.bvz += ((this.pushZ || 0) - s.bz) * w * w * dt - z2 * s.bvz * dt;
        s.bx += s.bvx * dt; s.bz += s.bvz * dt;
      }
      const cf = Math.cos(s.face), sf = Math.sin(s.face);
      s.brace = s.bx * cf - s.bz * sf;
      s.braceS = s.bx * sf + s.bz * cf;
      s.update(dt, g);
    }
    if (this.hoses.length) this.updateBatchHoses();
    // 水管
    if (this.washer) {
      const w = this.washer;
      const pos = this.hose.geometry.attributes.position.array;
      const tap = new THREE.Vector3(1.0, BOAT.deckY + 0.05, -1.95);
      const hand = new THREE.Vector3(w.x + Math.cos(w.face) * 0.45, BOAT.deckY + 1.0, w.z - Math.sin(w.face) * 0.45);
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        const p = tap.clone().lerp(hand, t);
        p.y = lerp(tap.y, hand.y, t * t) - Math.sin(t * Math.PI) * 0.1;
        if (t < 0.7) p.y = Math.min(p.y, BOAT.deckY + 0.04 + t * 0.2);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      }
      this.hose.geometry.attributes.position.needsUpdate = true;
    }
  }

  // 一甲板一起冲的水管：从同一舷的水龙头拉到手上
  updateBatchHoses() {
    for (const H of this.hoses) {
      const s = H.s;
      if (!s || !s.task || s.task.kind !== 'bwash') { H.line.visible = false; continue; }
      H.line.visible = true;
      const pos = H.line.geometry.attributes.position.array;
      const side = s.z >= 0 ? 1 : -1;
      const tap = new THREE.Vector3(1.0, BOAT.deckY + 0.05, side * 1.95);
      const hand = new THREE.Vector3(s.x + Math.cos(s.face) * 0.45, BOAT.deckY + 1.0, s.z - Math.sin(s.face) * 0.45);
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        const p = tap.clone().lerp(hand, t);
        p.y = lerp(tap.y, hand.y, t * t) - Math.sin(t * Math.PI) * 0.1;
        if (t < 0.7) p.y = Math.min(p.y, BOAT.deckY + 0.04 + t * 0.2);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      }
      H.line.geometry.attributes.position.needsUpdate = true;
    }
  }

  // W02 / C10 大轮廓经过最近那几秒：四个人一个接一个停下手里的活，走到它那一侧的舷边看水
  updateStare(s, dt) {
    const L = this.boat.body.worldToLocal(_sv.copy(this.stare));
    const side = L.z >= 0 ? 1 : -1;
    if (s.stareSide !== side) {
      s.stareSide = side;
      s.stareT = 0.2 + [0, 0.9, 0.45, 1.3][s.i % 4];
      s.stareGo = false;
    }
    if (s.stareT > 0) { s.stareT -= dt; return; }
    if (!s.stareGo) {
      const x = [-2.9, -0.9, 1.1, 3.0][s.i % 4];
      s.goTo(x, side * Math.max(0.3, halfB(x) - 0.34));
      s.pose = 'stand';
      s.stareGo = true;
    }
    if (!s.moving) {
      s.pose = s.i % 2 ? 'lookout' : 'rail';
      s.faceT = Math.atan2(-(L.z - s.z), L.x - s.x);
    }
  }

  updateCarry(s, T, dt) {
    const e = T.e;
    if (T.step === 'go' && !s.moving) {
      const it = e.worldPos();
      s.faceT = Math.atan2(-(it.z - s.z), it.x - s.x);
      s.pose = 'crouch';
      T.step = 'pick';
      T.t = 0;
    } else if (T.step === 'pick') {
      T.t += dt;
      if (T.t > 0.45) {
        e.attachTo(s.hold);
        s.p.carry = 0.6;
        // 抱银币匣的人走得慢一点
        s.slowK = e.it && e.it.def.precious ? 0.82 : 1;
        s.pose = 'carry';
        T.step = 'walk';
        const d = e.dest();
        s.goTo(d.x, d.z);
      }
    } else if (T.step === 'walk' && !s.moving) {
      const d = e.dest();
      s.faceT = d.face;
      s.pose = 'crouch';
      T.step = 'drop';
      T.t = 0;
    } else if (T.step === 'drop') {
      T.t += dt;
      e.lower(T.t / 0.7);
      if (T.t > 0.7) {
        e.finish();
        s.task = null;
        s.pose = 'stand';
        s.p.carry = 0;
        s.slowK = 1;
      }
    }
  }

  switchRole(s) {
    s.roleT = 11 + Math.random() * 8;
    if (s.pairWith) {
      // 一起看完水，各回各的
      const m = s.pairWith;
      s.pairWith = m.pairWith = null;
      if (m.role === 'pair') { m.role = null; m.roleT = 0.5; }
    }
    const roles = ['lookout', 'coil', 'check', 'patrol'];
    const taken = this.sailors.filter((o) => o !== s).map((o) => o.role);
    const mate = Math.random() < 0.3 && this.sailors.find((o) => o !== s && !o.task && !o.moving && o.role !== 'pair' && !o.pairWith);
    if (mate && !taken.includes('pair')) {
      s.role = mate.role = 'pair';
      s.pairWith = mate; mate.pairWith = s;
      s.pairSlot = 0; mate.pairSlot = 1;
      mate.roleT = s.roleT;
      mate.idleT = 0.3;
    } else {
      const free = roles.filter((r) => r !== s.role && !taken.includes(r));
      s.role = free.length ? free[Math.floor(Math.random() * free.length)] : roles[(roles.indexOf(s.role) + 1) % 4];
    }
    s.idleT = 0;
    if (this.g && this.g.pulse) this.g.pulse('A04', 2);
  }

  updateIdle(s, dt) {
    // 开船、停船时都有事做：值守、理缆、查吊机、巡舷
    if (s.moving) return;
    if (this.atTitle) return;
    // 冲洗近景里：没活的人原地看着，不从镜头前横穿
    if (this.mode === 'wash') return;
    // 开船、停着：每人隔十几秒换一件活；偶尔叫上一个人一起到舷边看水
    if (this.mode !== 'net') {
      s.roleT = (s.roleT ?? 10) - dt;
      if (s.roleT <= 0) this.switchRole(s);
    }
    s.idleT = (s.idleT || 0) - dt;
    if (s.idleT > 0) return;
    const roles = this.mode === 'net' ? ['lever', 'rail', 'rail', 'lookout'] : null;
    const role = roles ? roles[s.i] : s.role || ['lookout', 'coil', 'check', 'patrol'][s.i];
    const net = this.g.netop;
    switch (role) {
      case 'pair': {
        // 两人并排趴在右舷，一个指着水里
        const k = s.pairSlot || 0;
        s.goTo(1.2 + k * 0.75, 1.5);
        s.pose = k ? 'lookout' : 'rail';
        s.faceT = -Math.PI / 2 + (k ? 0.35 : -0.1);
        s.idleT = 5;
        break;
      }
      case 'lookout': s.goTo(5.05, s.i % 2 ? -0.45 : 0.4); s.pose = 'lookout'; s.faceT = (s.i % 2 ? 0.5 : -0.5); s.idleT = 4 + Math.random() * 3; break;
      case 'coil': s.goTo(-5.45, s.i % 2 ? 0.72 : -0.72); s.pose = 'coil'; s.faceT = Math.PI; s.idleT = 5 + Math.random() * 4; break;
      case 'check': {
        const spots = [[1.4, 1.6, 2.6], [-1.3, 1.0, -1.6], [-3.75, 1.74, Math.PI / 2]];
        const p = spots[Math.floor(Math.random() * spots.length)];
        s.goTo(p[0], p[1]); s.pose = 'check'; s.faceT = p[2]; s.idleT = 4 + Math.random() * 3; break;
      }
      case 'patrol': {
        const pts = [[3.0, -1.45, 0.4], [-0.6, -1.5, -0.4], [-3.75, -1.72, Math.PI / 2], [1.4, -1.6, 1.4]];
        const p = pts[Math.floor(Math.random() * pts.length)];
        s.goTo(p[0], p[1]); s.pose = 'stand'; s.faceT = p[2]; s.idleT = 2.5 + Math.random() * 2.5; break;
      }
      case 'lever': s.goTo(0.55, -0.98); s.pose = 'lever'; s.faceT = Math.PI / 2; s.idleT = 2; break;
      case 'rail': {
        // 趴到网那一侧的舷边看
        const side = net && net.tipLocal ? Math.sign(net.tipLocal.y || 1) : 1;
        const x = s.i === 1 ? 3.0 : 1.4;
        s.goTo(x, side * (x > 2 ? 1.45 : 1.6));
        s.pose = 'rail';
        s.faceT = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        s.idleT = 3;
        break;
      }
    }
  }
}
