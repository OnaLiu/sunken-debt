// 船员干活（A5 船上有人在干活，档：轻）：闲下来不光站着、靠着，还有几样远远就看得出在干什么的活，各做各的、分散在甲板上：
//   擦甲板：弓步、长柄刷一下一下往前推，刷头那里溅起一点水
//   蹲着检修：一只手扶着设备，一只手抡小锤敲，敲上去那一下迸两颗火星、“叮”一声
//   收缆：站在舷边，两只手一上一下倒着把缆绳拉上来，缆绳从栏杆外面垂到水里，滴着水
// 挑活的时候离别人远的优先（不挤在一处）。都是表现，不碰任何玩法；有活要干（搬运、冲洗）时照样被叫走。
// crew.js 管派活（choreOptions、pickSpread、choreFx），crewlook.js 的姿势里调 poseChore、choreProps。
import * as THREE from 'three';
import { Builder, cyl, box, col, M } from '../core/geo.js';
import { worldMat } from '../render/materials.js';
import { fxTag } from '../fx/tags.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const _Z = new THREE.Vector3(0, 0, 1), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _w = new THREE.Vector3();

export const CHORE_ANIM = { scrub: 'scrub', hammer: 'hammer', haul: 'haul' };
const NAMES = { scrub: '擦甲板', hammer: '蹲着敲敲检修', haul: '倒手收缆' };
// 甲板局部坐标：站哪儿、朝哪儿（刷子往前推要留出 1.6 米；敲的是吊臂底座、舱尾的设备；收缆站在栏杆里面 0.6 米）
const SPOTS = {
  scrub: [[2.05, -0.6, 2.05, 3.0], [-2.1, -1.6, -2.1, 2.0], [0.95, -4.75, 0.95, -8.0]],
  hammer: [[1.05, 0.05, 0.25, -0.55], [-1.15, -4.62, -1.15, -5.6]],
  haul: [[2.08, -3.4, 5, -3.4], [-2.12, -0.2, -5, -0.2]],
};

export function choreOptions(crew) {
  const o = [];
  for (const [x, z, fx, fz] of SPOTS.scrub) o.push({ type: 'scrub', x, z, face: [fx, fz], dur: 7 + Math.random() * 5 });
  if (!crew.opActive) for (const [x, z, fx, fz] of SPOTS.hammer) o.push({ type: 'hammer', x, z, face: [fx, fz], dur: 6 + Math.random() * 4 });
  for (const [x, z, fx, fz] of SPOTS.haul) o.push({ type: 'haul', x, z, face: [fx, fz], dur: 7 + Math.random() * 4 });
  return o;
}
// 离别人远的优先：别挤在一处（别人正去的地方、站的地方都算）
export function pickSpread(choices, hands, s) {
  const others = hands.filter((o) => o !== s).map((o) => (o.task && o.task.x != null ? [o.task.x, o.task.z] : [o.x, o.z]));
  const far = choices.filter((c) => { const cx = c.x ?? s.x, cz = c.z ?? s.z; return others.every((p) => Math.hypot(p[0] - cx, p[1] - cz) > 2.4); });
  const pool = far.length ? far : choices;
  return pool[Math.floor(Math.random() * pool.length)];
}

// —— 道具（挂在人身上，身体坐标：脚下为原点、+z 朝前）——
let MAT = null;
function propMesh(fn) { const b = new Builder(); fn(b); const m = new THREE.Mesh(b.build(), MAT); m.castShadow = true; return m; }
function props(rig) {
  const s = rig.s;
  if (s.chore) return s.chore;
  if (!MAT) MAT = worldMat({ key: 'crew', flat: true });
  // 长柄刷：柄沿 +z，刷头在 1.5 米处
  const brush = propMesh((b) => {
    b.add(cyl(0.017, 0.017, 1.5, 6), col(0xb08850), M(0, 0, 0.75, Math.PI / 2, 0, 0));
    b.add(box(0.44, 0.06, 0.12), col(0x7a4a2a), M(0, 0.0, 1.5));
    b.add(box(0.42, 0.05, 0.1), col(0xd8c890), M(0, -0.05, 1.5));
  });
  // 小锤：握把在原点，锤头在 0.3 米处（锤头横着）
  const hammer = propMesh((b) => {
    b.add(cyl(0.015, 0.015, 0.36, 6), col(0x8a6238), M(0, 0, 0.13, Math.PI / 2, 0, 0));
    b.add(box(0.05, 0.13, 0.05), col(0x3a3e44), M(0, 0, 0.31));
  });
  // 缆绳：三段单位长的细圆柱（每帧拉到两点之间）
  const seg = () => propMesh((b) => b.add(cyl(0.02, 0.02, 1, 5), col(0xc8b88a), M(0, 0, 0.5, Math.PI / 2, 0, 0)));
  const rope = [seg(), seg(), seg()];
  for (const m of [brush, hammer, ...rope]) { m.visible = false; s.g.add(m); }
  s.chore = { brush, hammer, rope };
  return s.chore;
}
// 把一段（沿 +z、长 1）摆到 a → b
function span(m, a, b) { _d.subVectors(b, a); const L = _d.length(); m.position.copy(a); m.quaternion.setFromUnitVectors(_Z, _d.multiplyScalar(1 / Math.max(L, 1e-4))); m.scale.set(1, 1, L); }
// 每帧（姿势之前）：不是这几样活的时候把道具收起来
export function choreProps(rig) {
  const s = rig.s;
  if (!s.chore) return;
  const a = rig.anim; // 和这一帧摆的姿势是同一个（s.anim 可能在派活时刚改，姿势下一帧才跟上）
  s.chore.brush.visible = a === 'scrub'; s.chore.hammer.visible = a === 'hammer';
  for (const r of s.chore.rope) r.visible = a === 'haul';
}

// 姿势（crewlook 的 pose 里调）：是这几样活就摆好、返回 true
export function poseChore(rig, a, dt, E) {
  if (!CHORE_ANIM[a]) return false;
  const fresh = !rig.s.chore, T = rig.T, D = rig.D, ta = rig.ta, P = props(rig);
  if (fresh) choreProps(rig); // 头一回干活这一帧才做出道具：马上拿在手里（不空一帧）
  rig.kB = 10; rig.kH = 7; rig.kA = 18; rig.glanceW = 0.2; rig.wsW = 0;
  const fx = rig.choreFx || (rig.choreFx = { hit: false, head: new THREE.Vector3(), kind: null, n: -1 });
  if (fx.kind !== a) { fx.kind = a; fx.n = -1; fx.hit = false; }
  if (a === 'scrub') {
    // 弓步往前推：刷头贴着甲板一前一后，身子跟着送
    const th = TAU * ta / 1.15, sN = Math.sin(th);
    rig.stance(0.24, -0.22, D.FX + 0.05, 0, 0.25);
    T.py = -0.1 + 0.02 * sN; T.pp = 0.12; T.cp = 0.3 + 0.07 * sN; T.pz = 0.05 * sN; T.hp = -0.18;
    _a.set(0.08, 0.95, 0.2 + 0.24 * sN); _b.set(-0.04, 0.06, 1.3 + 0.34 * sN);
    _w.lerpVectors(_a, _b, 0.3);
    rig.ikG(1, _a.x, _a.y, _a.z, 1, -0.4, -0.6, 0.2, 0.95);
    rig.ikG(0, _w.x, _w.y, _w.z, -1, -0.3, -0.5, 0.2, 0.95);
    _d.subVectors(_b, _a).normalize();
    P.brush.position.copy(_a).addScaledVector(_d, -0.12);
    P.brush.quaternion.setFromUnitVectors(_Z, _d);
    P.brush.scale.set(1, 1, (_a.distanceTo(_b) + 0.12) / 1.5);
    // 推到头、拉回来的那一下：刷头溅水
    const k = Math.floor(ta / 0.575 + 0.25);
    if (k !== fx.n) { if (fx.n >= 0) fx.hit = true; fx.n = k; fx.head.copy(_b); }
  } else if (a === 'hammer') {
    // 蹲着：左手扶着设备，右手慢慢抡起来、猛地敲下去，停一下，再抡
    rig.stance(0.1, -0.05, D.FX + 0.035, 0, 0.35);
    T.py = -0.48; T.pz = -0.08; T.pp = 0.24; T.cp = 0.36; T.hp = -0.32;
    const cyc = 0.85, n = Math.floor(ta / cyc), u = (ta % cyc) / cyc;
    // 每敲三下歇一下、凑近看看
    const rest = n % 4 === 3;
    const k = rest ? 0 : u < 0.55 ? sstep(0, 0.55, u) : u < 0.66 ? 1 - sstep(0.55, 0.66, u) : 0;
    _a.set(lerp(0.14, 0.2, k), lerp(0.47, 0.95, k), lerp(0.42, 0.18, k));
    const phi = lerp(0.75, -1.0, k);
    _d.set(0, -Math.sin(phi), Math.cos(phi));
    rig.ikG(1, _a.x, _a.y, _a.z, 1, -0.3, -0.6, 0.3, 0.95);
    rig.ikG(0, -0.14, 0.44, 0.55, -1, 0, -0.5, 0.4, 0.55);
    if (rest) { T.hp = -0.5 + 0.08 * Math.sin(ta * 3); T.cp = 0.46; }
    P.hammer.position.copy(_a); P.hammer.quaternion.setFromUnitVectors(_Z, _d);
    if (!rest && u >= 0.66 && fx.n !== n) { fx.n = n; fx.hit = true; fx.head.copy(_a).addScaledVector(_d, 0.31); }
  } else if (a === 'haul') {
    // 舷边倒手收缆：两只手一上一下轮着往下拉，身子一下下往后坐
    const cyc = 1.5, th = TAU * ta / cyc;
    rig.stance(0.16, -0.14, D.FX + 0.04, 0, 0.15);
    T.py = -0.06 - 0.03 * Math.abs(Math.sin(th)); T.cp = 0.08 - 0.06 * Math.sin(th * 2); T.hp = -0.22; T.pp = 0.03;
    let hiY = -1, hi = null;
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, ph = th + i * Math.PI, up = 0.5 + 0.5 * Math.cos(ph), pulling = Math.sin(ph) > 0;
      const x = sd * 0.07, y = lerp(0.74, 1.3, up), z = lerp(0.22, 0.5, up);
      rig.ikG(i, x, y, z, sd, -0.4, -0.5, 0.1, pulling ? 0.95 : 0.45);
      if (y > hiY) { hiY = y; hi = [x, y, z]; }
    }
    // 缆绳：栏杆外面垂到水里 → 栏杆 → 上面那只手 → 下面那只手 → 脚边的一卷
    _a.set(0, 0.98, 0.62); _b.set(hi[0], hi[1], hi[2]);
    span(P.rope[0], _w.set(0, -1.6, 0.92), _a);
    span(P.rope[1], _a, _b);
    span(P.rope[2], _b, _d.set(0.22, 0.03, 0.08));
    const k = Math.floor(ta / (cyc / 2));
    if (k !== fx.n) { fx.n = k; fx.hit = true; fx.head.set(0, 0.98, 0.66); }
  }
  return true;
}

// 每帧（姿势之后，crew.js 调）：溅水、火星、“叮”、滴水；刚开始干一样活时挂一下标签
export function choreFx(crew, s) {
  const T = s.task, fx = s.rig.choreFx;
  // 刚开始干一样活、或者有人一直在干（隔 6 秒）：挂标签（摆场面不记标签的时候不算数）
  if (window.__fxTagMute || crew.t < (crew._choreTag ?? -9)) crew._choreTag = -9;
  if (!window.__fxTagMute && T && CHORE_ANIM[T.type] && T.phase === 'do' && (!T.told || crew.t - (crew._choreTag ?? -9) > 6) && crew.t - (crew._choreTag ?? -9) > 2.5) {
    T.told = true; crew._choreTag = crew.t;
    fxTag('A5', '船员干活·' + s.name + NAMES[T.type], 'A5');
  }
  if (!fx || !fx.hit) return;
  fx.hit = false;
  if (!CHORE_ANIM[s.anim]) return;
  const p = s.g.localToWorld(_w.copy(fx.head));
  const P = crew.particles, A = crew.audio;
  if (fx.kind === 'scrub') { P.splat(p.x, p.y + 0.04, p.z, 2); if (A && Math.random() < 0.7) A.play('scrub', { v: 0.6 + Math.random() * 0.4 }); }
  else if (fx.kind === 'hammer') { P.sparkle(p.x, p.y + 0.02, p.z, 0.04, 3, false); if (A) A.play('tink', { v: 0.7 + Math.random() * 0.3 }); }
  else if (fx.kind === 'haul' && Math.random() < 0.6) P.drips(p.x, p.y, p.z, 0.05, 2, [0.75, 0.86, 0.9]);
}
