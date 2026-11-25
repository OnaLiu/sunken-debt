import * as THREE from 'three';
import { LOW_H, WATER } from '../config.js';
import { WRECK } from '../world/layout.js';
import { seabedY } from '../world/terrain.js';
import { MeshBVH } from '../util/bvh.js';

// 玩家此刻看得见什么：在画面里、在低分辨率画面上不小于两三个像素、隔着这段水还认得出、
// 没被沉船、自己的船、海底的坡、趴在上面的蟹挡住，也没埋在泥里。
// 界面上的标记和自动演示的机器人都用这一份判断：机器人不比玩家多知道，标记也不标玩家看不见的东西。
// 和画面对不对得上，用 tools/seecheck.mjs 量（每件东西画一张有它、一张没它的画面比）。
const _v = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _a = new THREE.Vector3();
const ray = new THREE.Raycaster();
const _wc = new THREE.Vector3(WRECK.x, -9, WRECK.z);

export function canSee(g, p, r, margin = 0.92, self = null) {
  return !hiddenWhy(g, p, r, margin, self);
}

// 挡住视线的东西：只算看得见的、不透明的（水槽里的水、网口的线不算）
const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
function blocked(cam, p, dist, objs) {
  _dir.copy(p).sub(cam.position).normalize();
  ray.set(cam.position, _dir);
  ray.far = dist - 0.1;
  for (const h of ray.intersectObjects(objs, true)) {
    const m = h.object;
    if (!m.isMesh || (m.material && m.material.transparent) || !shown(m)) continue;
    return true;
  }
  return false;
}

// 沉船（连同断桅、残帆、索具、舱盖）不会动：每个网格建一棵包围盒树（util/bvh.js），一条视线零点零几毫秒。
// 以前用 THREE.Raycaster 把几万个三角形一个个试，一件东西五六毫秒，机器人一次看十几件就让画面顿上一两百毫秒。
// 判断的结果和以前一样（同样的三角形、同样的正反面取舍、同样只算看得见的不透明网格）
export function prepareSight(g) {
  let L = g.world._sightStatic;
  if (L) return L;
  L = [];
  // 换了素材的几样（船身、断桅、横桁、舱盖）：画面上是模型，挡视线照旧用代码画的那一份（不画出来，形状照同一组数），见 wreck.js。
  // 网的碰撞也是它：机器人、界面标记和网一个说法，和换素材以前一样
  for (const m of Object.values(g.world.wreck.meshes)) m.traverse((o) => { if (o.isMesh && !o.userData.look) L.push(o); });
  g.world.extras.group.traverse((o) => { if (o.isMesh && !o.userData.look) L.push(o); });
  for (const m of L) {
    m.updateMatrixWorld(true);
    if (!m.userData.bvh) m.userData.bvh = new MeshBVH(m);
  }
  g.world._sightStatic = L;
  return L;
}
// 自查用（tools/sightbvh.mjs）：同一条视线，老办法（THREE.Raycaster 逐个三角形）和包围盒树各说挡没挡住
export function compareWreckRay(g, eye, p) {
  const cam = { position: eye };
  const dist = eye.distanceTo(p);
  const t0 = performance.now();
  const a = blocked(cam, p, dist, [...Object.values(g.world.wreck.meshes), g.world.extras.group]);
  const t1 = performance.now();
  const b = blockedWreck(g, cam, p, dist);
  const t2 = performance.now();
  return { old: a, bvh: b, oldMs: t1 - t0, bvhMs: t2 - t1 };
}
function blockedWreck(g, cam, p, dist) {
  _dir.copy(p).sub(cam.position).normalize();
  const far = dist - 0.1;
  for (const m of prepareSight(g)) {
    if ((m.material && m.material.transparent) || !shown(m)) continue;
    if (m.userData.bvh.hits(cam.position, _dir, far)) return true;
  }
  return false;
}

// 打捞镜头找角度用：从眼睛 e 到水下这一点 p，中途有没有穿过沉船（连同断桅这些散件；最后 0.3 米不算，免得算上 p 底下贴着的那块板）
const _e = new THREE.Vector3();
export function wreckBlocksSeg(g, ex, ey, ez, p) {
  const cam = { position: _e.set(ex, ey, ez) };
  const dist = _e.distanceTo(p);
  if (dist < 0.5 || segDist(_e, p, _wc) > 16) return false;
  return blockedWreck(g, cam, p, dist - 0.2);
}

// 线段（眼睛 → p）离某点最近多远
function segDist(a, b, c) {
  _a.copy(b).sub(a);
  const t = Math.max(0, Math.min(1, _v.copy(c).sub(a).dot(_a) / Math.max(_a.lengthSq(), 1e-6)));
  return _v.copy(a).addScaledVector(_a, t).distanceTo(c);
}

// 视线在水下那一段有没有钻进海底（坡顶、深槽的沟沿挡住坡下的东西）：每米查一次地形，最后半米不算
function underTerrain(cam, p) {
  const e = cam.position;
  if (e.y <= 0) return false;
  const t0 = e.y / (e.y - p.y);
  const sx = e.x + (p.x - e.x) * t0, sz = e.z + (p.z - e.z) * t0;
  const L = Math.hypot(p.x - sx, p.y, p.z - sz);
  const n = Math.floor((L - 0.5) / 1.0);
  for (let i = 1; i <= n; i++) {
    const f = i / (L || 1);
    const x = sx + (p.x - sx) * f, y = p.y * f, z = sz + (p.z - sz) * f;
    if (seabedY(x, z) > y + 0.08) return true;
  }
  return false;
}

// 看不见的原因（看得见时是 null）：frame 不在画面里，small 太小，deep 隔的水太多，terrain 被海底的坡挡住，
// wreck 被沉船（连同倒在海底的断桅、残帆、索具、舱盖）挡住，boat 被自己的船（船身、驾驶室、吊臂、船员）挡住，crab 被趴在上面的蟹挡住。self：量的是这只蟹自己
export function hiddenWhy(g, p, r, margin = 0.92, self = null) {
  const cam = g.cam.cam;
  _v.copy(p).project(cam);
  if (_v.z > 1 || Math.abs(_v.x) > margin || Math.abs(_v.y) > margin - 0.02) return 'frame';
  const dist = cam.position.distanceTo(p);
  const pxPerM = LOW_H / (2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  // 低分辨率画面上不到两个像素的不算（描了轮廓以后，盖住一两个像素的东西就成了一个认得出的小点）
  if (r * 2 * pxPerM < 1.8) return 'small';
  if (p.y < 0) {
    const depth = -p.y;
    const frac = depth / Math.max(cam.position.y - p.y, 0.01);
    const path = dist * frac;
    const vis = Math.exp(-(path * WATER.kView + depth * WATER.kDown) * 1.15);
    if (vis < 0.085) return 'deep';
  }
  // 挡没挡住：先看中心；中心被挡了，再看四周（屏幕上的左右上下各偏 0.7 个半径），露出两处也算看得见——
  // 钻在沉船肋骨后面、身子露一半的蟹，玩家是看得见它在动的
  const why = blockedWhy(g, cam, p, dist, self);
  if (!why) return null;
  _right.setFromMatrixColumn(cam.matrixWorld, 0);
  _up.setFromMatrixColumn(cam.matrixWorld, 1);
  let clear = 0;
  for (const [a, b] of OFFS) {
    _q.copy(p).addScaledVector(_right, a * r * 0.7).addScaledVector(_up, b * r * 0.7);
    if (!blockedWhy(g, cam, _q, cam.position.distanceTo(_q), self) && ++clear >= 2) return null;
  }
  return why;
}

const OFFS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _q = new THREE.Vector3();
function blockedWhy(g, cam, p, dist, self) {
  if (p.y < 0 && underTerrain(cam, p)) return 'terrain';
  // 视线从沉船旁边经过才查（东西本身离沉船远，视线也可能从沉船后面穿过来）
  if (segDist(cam.position, p, _wc) < 16 && blockedWreck(g, cam, p, dist)) return 'wreck';
  const bp = g.boatCtl.pos;
  // 正从船上挖开的口子里看（cutout.js）：船身挡不住，吊臂照挡
  if (segDist(cam.position, p, bp) < 8 && blocked(cam, p, dist, [g.cutout.opens(p) ? g.boat.crane.root : g.boat.body])) return 'boat';
  for (const c of g.crabLife.list) {
    if (c === self || !c.catchable || Math.hypot(c.pos.x - p.x, c.pos.z - p.z) > c.r + 0.6) continue;
    if (blocked(cam, p, dist, [c.group])) return 'crab';
  }
  return null;
}

// 海底一件东西露在外面的那一截：埋得只剩不到几厘米的，等于看不见
export function exposedOf(it) {
  return it.h * (1 - it.bury);
}

// 实际露出泥面多少：模型每个顶点比那里的泥面（海底、舱底、四周拱起的泥包）高多少，取最高的。
// 只在埋深、位置变了时重算。p 是露出来那一截的中间（视线朝这里看）
const _w = new THREE.Vector3();
function coverAt(it, x, z) {
  let c = it.inHold ? it.y : seabedY(x, z);
  const m = it.mound;
  if (m) {
    const dx = x - m.position.x, dz = z - m.position.z, co = Math.cos(m.rotation.y), si = Math.sin(m.rotation.y);
    const lx = (dx * co - dz * si) / m.scale.x, lz = (dx * si + dz * co) / m.scale.z;
    const d = Math.hypot(lx, lz) / m.userData.R;
    // 海底的泥包跟着海底起伏，舱里的是东西底下平的一圈
    if (d < 1) c = Math.max(c, (m.userData.fit ? c + 0.01 : m.position.y) + m.userData.peak * (1 - d));
  }
  return c;
}
export function showingOf(it) {
  const key = `${it.bury}|${it.x}|${it.y}|${it.z}|${it.mound ? 1 : 0}`;
  if (it._showKey === key) return it._show;
  const grp = it.model.group;
  grp.updateMatrixWorld(true);
  let best = -1, bx = it.x, by = it.y, bz = it.z;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  grp.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      _w.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const s = _w.y - coverAt(it, _w.x, _w.z);
      if (s > best) { best = s; bx = _w.x; by = _w.y; bz = _w.z; }
      // 露在泥外的部分有多大（有的东西模型比它的「网口半径」小得多，比如铜印）
      if (s > 0.01) { x0 = Math.min(x0, _w.x); x1 = Math.max(x1, _w.x); z0 = Math.min(z0, _w.z); z1 = Math.max(z1, _w.z); }
    }
  });
  it._showKey = key;
  it._show = best;
  it._showR = x1 > x0 ? Math.min(it.r, Math.hypot(x1 - x0, z1 - z0) / 2) : 0;
  it._showP = new THREE.Vector3(bx, by - Math.max(0, best) * 0.5, bz);
  return best;
}

export function seeItem(g, it, margin) {
  return !itemHiddenWhy(g, it, margin);
}

export function itemHiddenWhy(g, it, margin) {
  if (showingOf(it) < 0.035) return 'buried';
  return hiddenWhy(g, it._showP, it._showR, margin);
}
