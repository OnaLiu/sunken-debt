import * as THREE from 'three';
import { buildItemModel, setItemGlint } from '../world/items.js';
import { NET_SPOTS, SHOAL, WRECK } from '../world/layout.js';
import { Crab } from '../life/crab.js';
import { toon, U } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { buildRays, poseRays } from './reveal.js';
import { VIEW_W, VIEW_H } from '../config.js';
import { clamp, smoothstep, easeOut, easeInOut, easeOutBack, lerp, damp, mulberry32 } from '../util/math.js';

// C15 收获单：开舱清点。
// 收工时镜头从甲板舱口扎下去（C14 的后半），黑一下，到了舱里：帆布一块块摆好了，舱口那束光照在最前面那块红布上。
// 这一趟搬进舱的东西一件件落到帆布上——落一件「咚」一声、挂上它的签（名字、价值、从哪儿捞的），价值飞进上面的总数；
// 越往后越值钱、越落越快；最值钱的那一件（银币匣）压轴：光先亮起来、四下暗下去，它从光里落到红布上，盖子弹开、
// 光束、号角——和揭晓那一下一样郑重；它的价值飞进去，总数一路滚上去，落定时「啪」地盖上入舱章，底下写出这一趟做到的事。
// 屏幕上的总数始终等于已经落下、挂着签的那几件加起来。
// C16 再来一趟：舱盖拉上，影子从一边扫过整舱，黑下来，浪声，回到港外。

// 舱放在哪：离这片海远远的高处（水下的颜色、光柱、雾都不沾），四周一圈黑
const HOLD_AT = new THREE.Vector3(0, 60, -340);
// 一排的进深、压轴那块红布在最前面
const ROW_D = 1.42;
// 舱里镜头的视角（取景按它算，摆镜头也用它）
const FOV = 45;
// 舱里摆出来的东西放大一点（甲板上是真大小，这里是摆给人看的）
const SHOW_K = 1.45;
// 整舱的镜头俯角（低一点看得见东西的侧面，不只是顶）
const WIDE_PITCH = 0.78;
const STAR_Z = 1.25;
const CLOTH = new THREE.Color(0.6, 0.5, 0.34);
// 光从哪边照进来（舱里的方向：左前上方），舱按这个转：太阳在世界里的方向不变
const LIGHT_LOCAL = new THREE.Vector2(-0.62, 0.78).normalize();
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

// 这件东西是从哪儿捞上来的（签上第二行）
const PLACE_OF = {};
for (const [k, ids] of Object.entries(NET_SPOTS)) {
  const p = { shoal: '浅滩', anchor: '浅滩', hold: '沉船·断舱', jars: '沉船·船边', pots: '沉船·船边', dig: '沉船·船边', slope: '坡下', trench: '深槽' }[k];
  for (const id of ids) PLACE_OF[id] = p;
}
export function placeOf(id, at) {
  if (id && PLACE_OF[id]) return PLACE_OF[id];
  if (id && id.startsWith('trail')) return '航路';
  if (at) {
    if (Math.hypot(at.x - SHOAL.x, at.z - SHOAL.z) < 30) return '浅滩';
    if (Math.hypot(at.x - WRECK.x, at.z - WRECK.z) < 26) return '沉船·船边';
  }
  return '';
}

export class Tally {
  constructor(g) {
    this.g = g;
    this.active = false;
    this.set = null;
  }

  // —— 舱：地板、两舷的肋骨和船板、后面的隔舱壁，角上堆着的木箱、缆绳、一盏挂灯 ——
  build() {
    const root = new THREE.Group();
    root.name = 'hold';
    const sd = U.uSunDir.value;
    // 舱转到让光从左前上方照进来
    const yaw = Math.atan2(sd.x, sd.z) - Math.atan2(LIGHT_LOCAL.x, LIGHT_LOCAL.y);
    root.rotation.y = yaw;
    root.position.copy(HOLD_AT);
    this.g.scene.add(root);
    // 效果页快进时不画画面、矩阵不会自己更新：这里先算好（镜头、投影都按它算）
    root.updateMatrixWorld(true);
    const content = new THREE.Group();
    root.add(content);
    root.visible = false;
    this.root = root;
    this.content = content;
    this.yaw = yaw;
    // 舱口那束光：斜着从左前上方照到红布上的一道光柱（加色），里面飘着灰
    this.shaft = buildShaft();
    root.add(this.shaft);
    // 红布上那一圈亮
    this.pool = buildPool();
    root.add(this.pool);
    // 压轴落下那一下的光束
    this.rays = buildRays();
    this.g.scene.add(this.rays);
    // 舱盖拉上时扫过去的影子（只投影子，看不见它本身）
    const lidMat = toon({ color: 0x000000 });
    lidMat.colorWrite = false;
    lidMat.depthWrite = false;
    this.lid = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 30), lidMat);
    this.lid.castShadow = true;
    this.lid.visible = false;
    root.add(this.lid);
  }

  // 舱的样子跟着这一趟的货多少变宽变深
  buildRoom(W, D, zBack) {
    if (this.room) { this.room.parent.remove(this.room); disposeTree(this.room); }
    const room = new THREE.Group();
    const R = mulberry32(77);
    const b = new GeoBuilder();
    const wood = (k) => new THREE.Color(0.36 * k, 0.25 * k, 0.16 * k);
    const x0 = -W / 2 - 1.2, x1 = W / 2 + 1.2;
    const z0 = zBack - 1.3, z1 = STAR_Z + 2.6;
    // 地板：一条条顺着舱长的板，深浅错开，板缝一道暗线
    const pw = 0.3;
    for (let x = x0; x < x1; x += pw) {
      const k = 0.82 + R() * 0.3;
      let z = z0;
      while (z < z1) {
        const len = 1.6 + R() * 2.2;
        const ze = Math.min(z1, z + len);
        b.box(new THREE.Vector3(x + pw / 2, -0.03, (z + ze) / 2), new THREE.Vector3(pw / 2 - 0.012, 0, 0), new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0, (ze - z) / 2 - 0.01), wood(k * (0.92 + R() * 0.12)));
        z = ze;
      }
    }
    b.box(new THREE.Vector3((x0 + x1) / 2, -0.07, (z0 + z1) / 2), new THREE.Vector3((x1 - x0) / 2, 0, 0), new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0, (z1 - z0) / 2), new THREE.Color(0.08, 0.055, 0.04));
    // 两舷：往外斜上去的船板，一道道肋骨
    for (const s of [-1, 1]) {
      const xe = s < 0 ? x0 : x1;
      for (let z = z0; z < z1; z += 0.34) {
        const k = 0.7 + R() * 0.2;
        b.box(new THREE.Vector3(xe + s * 0.55, 0.75, z + 0.17), new THREE.Vector3(s * 0.55, 0.75, 0).multiplyScalar(1), new THREE.Vector3(0, 0, 0.16), new THREE.Vector3(-0.05, 0.04 * s, 0), wood(k * 0.8));
      }
      for (let z = z0 + 0.4; z < z1; z += 0.95) {
        b.beam(new THREE.Vector3(xe - s * 0.05, 0.0, z), new THREE.Vector3(xe + s * 0.75, 1.9, z), new THREE.Vector3(0, 0, 1), 0.16, 0.2, wood(0.62));
      }
    }
    // 后面的隔舱壁和一道横梁
    for (let x = x0; x < x1; x += 0.28) b.box(new THREE.Vector3(x + 0.14, 1.1, z0 - 0.05), new THREE.Vector3(0.13, 0, 0), new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0, 0, 0.05), wood(0.66 + R() * 0.16));
    b.box(new THREE.Vector3(0, 2.15, z0 + 0.12), new THREE.Vector3((x1 - x0) / 2, 0, 0), new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(0, 0, 0.14), wood(0.5));
    // 角上：摞着的木箱、一只桶、一盘缆绳
    const crate = (x, y, z, s, rot) => {
      const ax = new THREE.Vector3(Math.cos(rot), 0, -Math.sin(rot)).multiplyScalar(s);
      const az = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)).multiplyScalar(s);
      b.box(new THREE.Vector3(x, y + s, z), ax, new THREE.Vector3(0, s, 0), az, new THREE.Color(0.55, 0.4, 0.24));
      b.box(new THREE.Vector3(x, y + s, z), ax.clone().multiplyScalar(1.03), new THREE.Vector3(0, s * 0.12, 0), az.clone().multiplyScalar(1.03), new THREE.Color(0.32, 0.22, 0.13));
    };
    crate(x0 + 0.75, 0, z0 + 0.6, 0.38, 0.2);
    crate(x0 + 0.72, 0.76, z0 + 0.58, 0.3, -0.15);
    crate(x0 + 1.5, 0, z0 + 0.45, 0.3, 0.5);
    crate(x1 - 0.7, 0, z0 + 0.55, 0.36, -0.3);
    b.cylinder(new THREE.Vector3(x1 - 1.45, 0, z0 + 0.5), new THREE.Vector3(x1 - 1.45, 0.9, z0 + 0.5), 0.34, 0.34, 9, new THREE.Color(0.46, 0.3, 0.18));
    for (let i = 0; i < 4; i++) b.cylinder(new THREE.Vector3(x0 + 0.85, 0.02 + i * 0.07, z1 - 1.3), new THREE.Vector3(x0 + 0.85, 0.08 + i * 0.07, z1 - 1.3), 0.42 - i * 0.04, 0.42 - i * 0.04, 12, new THREE.Color(0.66, 0.56, 0.38));
    // 四周外面一圈黑（镜头的边上看不到舱外）
    const dark = new THREE.Color(0.02, 0.018, 0.016);
    b.box(new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(40, 0, 0), new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0, 0, 40), dark);
    const mesh = new THREE.Mesh(b.build(), toon({ vertexColors: true }));
    mesh.castShadow = true;
    room.add(mesh);
    // 挂灯：右后角一盏，暖光一团
    const lamp = new THREE.Group();
    const lb = new GeoBuilder();
    lb.box(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.09, 0, 0), new THREE.Vector3(0, 0.13, 0), new THREE.Vector3(0, 0, 0.09), new THREE.Color(1.0, 0.82, 0.45));
    lb.box(new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0.11, 0, 0), new THREE.Vector3(0, 0.025, 0), new THREE.Vector3(0, 0, 0.11), new THREE.Color(0.2, 0.16, 0.12));
    lb.beam(new THREE.Vector3(0, 0.17, 0), new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(1, 0, 0), 0.015, 0.015, new THREE.Color(0.15, 0.12, 0.1));
    const lm = toon({ vertexColors: true, emissive: 0x6a4a1a });
    lamp.add(new THREE.Mesh(lb.build(), lm));
    lamp.position.set(x1 - 0.85, 1.45, z0 + 1.2);
    room.add(lamp);
    const glow = buildPool(0.9, [1.0, 0.7, 0.35]);
    glow.position.set(x1 - 0.85, 0.012, z0 + 1.35);
    glow.material.uniforms.uA.value = 0.55;
    room.add(glow);
    this.lamp = lamp;
    this.room = room;
    this.root.add(room);
    this.bounds = { x0, x1, z0, z1 };
  }

  // —— 开始：按这一趟的收获排好帆布，镜头在舱口下面 ——
  // o：{ why（游戏替你收工的原因）, deeds（这一趟做到的事） }
  begin(trip, o = {}) {
    const g = this.g;
    if (!this.root) this.build();
    this.clearContent();
    this.active = true;
    this.t = 0;
    this.speed = 1;
    this.done = false;
    this.shut = null;
    this.root.visible = true;
    this.root.updateMatrixWorld(true);
    this.lid.visible = false;
    this.why = o.why || '';
    this.deeds = o.deeds || [];
    const list = trip.haul.map((h, i) => ({ ...h, i }));
    // 压轴：珍贵的那一件；没有就最值钱的那件（至少两件才单独压轴）
    let star = list.find((h) => h.precious) || null;
    if (!star && list.length >= 2) star = list.slice().sort((a, b) => b.value - a.value)[0];
    const rest = list.filter((h) => h !== star);
    // 越往后越值钱；同名的挨着落（后一只落下来靠上前一只）
    const key = {};
    for (const h of rest) key[h.name] = Math.min(key[h.name] ?? 1e9, h.value);
    rest.sort((a, b) => (key[a.name] - key[b.name]) || a.name.localeCompare(b.name) || (a.value - b.value) || (a.i - b.i));
    // 东西：干净的样子（揭晓以后的样子），长的那一边横着摆
    const mk = (h) => {
      let group, model = null, crab = null;
      if (h.kind === 'crab') {
        crab = new Crab({ scale: 1.6 });
        crab.makeCaptive();
        crab.setMode('deck');
        group = crab.group;
      } else {
        model = buildItemModel(h.kind, { seed: 0.4 + (h.i % 5) * 0.11, mud: 0 });
        group = model.group;
        group.scale.multiplyScalar(SHOW_K);
        if (model.lid) model.lid.rotation.x = 0;
      }
      const wrap = new THREE.Group();
      wrap.add(group);
      const box = new THREE.Box3().setFromObject(group);
      const sx = box.max.x - box.min.x, sz = box.max.z - box.min.z;
      if (sz > sx * 1.15) group.rotation.y += Math.PI / 2;
      const b2 = new THREE.Box3().setFromObject(wrap);
      const c = b2.getCenter(new THREE.Vector3());
      group.position.x -= c.x;
      group.position.z -= c.z;
      group.position.y -= b2.min.y;
      const size = b2.getSize(new THREE.Vector3());
      return { h, wrap, group, model, crab, w: size.x, d: size.z, ht: size.y };
    };
    const slots = rest.map(mk);
    const starSlot = star ? mk(star) : null;
    // 一排排：后面先摆、越往前越值钱；每排的宽按货的大小，整排居中
    const widths = slots.map((s) => clamp(s.w + 0.5, 1.2, 3.0));
    const sum = widths.reduce((a, b) => a + b, 0);
    // 排几排：哪种排法在画面上东西最大（宽占 1640 像素、纵深占 640 像素，镜头俯角 WIDE_PITCH）
    let rows = 0, best = 1e9;
    for (let r = 1; r <= Math.min(4, slots.length); r++) {
      const W = sum / r + 0.6, D = (r - 1) * ROW_D + 1.0 + (star ? 2.3 : 0.6);
      const cost = Math.max(W / 1640, (D * Math.sin(WIDE_PITCH) + 0.7 * Math.cos(WIDE_PITCH)) / 640);
      if (cost < best) { best = cost; rows = r; }
    }
    const per = rows ? Math.ceil(slots.length / rows) : 0;
    // 每排从哪儿断开：同名的一对不拆到两排（断点往后挪一个，挪不了就往前挪一个）
    const cuts = [0];
    for (let r = 1; r < rows; r++) {
      let c = Math.max(cuts[r - 1] + 1, Math.min(slots.length - 1, r * per));
      const same = (i) => i > 0 && i < slots.length && slots[i - 1].h.name === slots[i].h.name;
      if (same(c)) c = c + 1 - cuts[r - 1] <= per + 1 && c + 1 < slots.length ? c + 1 : c - 1 > cuts[r - 1] ? c - 1 : c;
      cuts.push(c);
    }
    cuts.push(slots.length);
    // 蛇形：后排从左往右落，下一排从右往左接着落——下一件总落在上一件旁边
    const rowsOf = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let i = cuts[r]; i < cuts[r + 1]; i++) row.push({ s: slots[i], w: widths[i] });
      if (r % 2) row.reverse();
      rowsOf.push(row);
    }
    const zFront = STAR_Z - (starSlot ? Math.max(1.3, starSlot.d * 0.5 + 0.9) : 1.2);
    let W = starSlot ? 2.4 : 2.0;
    rowsOf.forEach((row, r) => {
      const z = zFront - (rows - 1 - r) * ROW_D;
      const rw = row.reduce((a, q) => a + q.w, 0);
      W = Math.max(W, rw);
      let x = -rw / 2;
      for (const q of row) {
        q.s.x = x + q.w / 2;
        q.s.z = z;
        x += q.w;
      }
    });
    const zBack = rows ? zFront - (rows - 1) * ROW_D - 0.8 : STAR_Z - 1.6;
    this.buildRoom(W, 0, zBack);
    if (starSlot) { starSlot.x = 0; starSlot.z = STAR_Z; starSlot.star = true; }
    this.slots = slots;
    this.star = starSlot;
    this.all = starSlot ? [...slots, starSlot] : slots.slice();
    // 帆布：先摆好（空着的位置看得见还有几件没落下来）；压轴那块是红布，比别的大一圈
    const R = mulberry32(5);
    for (const s of this.all) {
      const cw = s.star ? Math.max(1.3, s.w + 0.55) : clamp(s.w + 0.32, 0.86, 2.6);
      const cd = s.star ? Math.max(1.15, s.d + 0.5) : clamp(s.d + 0.32, 0.72, 1.2);
      const cloth = buildCloth(cw, cd, s.star ? new THREE.Color(0.44, 0.08, 0.06) : CLOTH.clone().multiplyScalar(0.92 + R() * 0.12), R);
      cloth.position.set(s.x, 0, s.z);
      cloth.rotation.y = (R() - 0.5) * 0.09;
      this.content.add(cloth);
      s.cloth = cloth;
      s.wrap.position.set(s.x, 0.035, s.z);
      s.wrap.rotation.y = (R() - 0.5) * 0.14;
      s.wrap.visible = false;
      this.content.add(s.wrap);
      s.landed = false;
      s.tag = null;
    }
    // 舱口的光：照在红布上（没有压轴的时候照在正中间）
    const spot = starSlot ? new THREE.Vector3(0, 0, STAR_Z) : new THREE.Vector3(0, 0, zFront);
    this.spotAt = spot;
    this.pool.position.set(spot.x, 0.05, spot.z);
    this.shaft.position.copy(spot);
    this.shaft.material.uniforms.uA.value = 0;
    this.pool.material.uniforms.uA.value = 0;
    // 节拍：第一件 1.0 秒落下，越落越快；货多的时候整串压在六秒多一点
    let t = 1.15;
    const n = slots.length;
    const k = n > 1 ? Math.min(1, 6.2 / slots.reduce((a, _, i) => a + lerp(0.6, 0.36, i / (n - 1)), 0)) : 1;
    slots.forEach((s, i) => {
      s.at = t;
      t += lerp(0.6, 0.36, n > 1 ? i / (n - 1) : 0) * k;
    });
    // 压轴：最后一件落定、价值进账以后，光先亮起来（0.8 秒），再落下
    this.preAt = n ? slots[n - 1].at + 0.62 : 1.0;
    if (starSlot) starSlot.at = this.preAt + 0.85;
    this.slamAt = starSlot ? starSlot.at + (starSlot.h.precious ? 2.45 : 1.55) : n ? slots[n - 1].at + 1.0 : 1.4;
    this.total = 0;
    this.shown = 0;
    this.flying = [];
    this.coins = [];
    this.framing();
    // 镜头：从舱口正下方（几乎垂直往下看那块红布）退开到看得见整舱
    const cam = g.cam;
    cam.alt.w = 1;
    cam.altFrom = cam.altTo = 1;
    cam.altT = cam.altDur;
    this.camK = 0;
    this.poseCam(0, 0);
    // 舱里的光：太阳从舱口斜照进来，四下压暗、偏暖
    const pc = g.pipe.compositeUniforms;
    this.saved = { sun: U.uSunCol.value.clone(), sky: U.uAmbSky.value.clone(), gnd: U.uAmbGround.value.clone(), vig: pc.uVignette.value, shafts: pc.uShafts.value };
    U.uSunCol.value.setRGB(1.12, 0.94, 0.7);
    U.uAmbSky.value.setRGB(0.34, 0.3, 0.27);
    U.uAmbGround.value.setRGB(0.2, 0.16, 0.12);
    pc.uVignette.value = 0.62;
    pc.uShafts.value = 0;
    pc.uDim.value = 0;
    pc.uFocus.value.z = 0;
    pc.uFlash.value = 0;
    g.menus.showSummary(trip, { why: this.why, deeds: this.deeds, n: this.all.length, empty: !this.all.length });
    g.cue('C15');
  }

  // 镜头的两头：近（舱口正下方看红布）和远（整舱都在画面里、上面留给总数、下面留给按钮）
  framing() {
    const g = this.g;
    const pts = [];
    for (const s of this.all) {
      pts.push(new THREE.Vector3(s.x - s.w / 2 - 0.25, 0, s.z - s.d / 2 - 0.2), new THREE.Vector3(s.x + s.w / 2 + 0.25, 0, s.z + s.d / 2 + 0.55));
      pts.push(new THREE.Vector3(s.x, s.ht + 0.15, s.z - s.d / 2));
    }
    if (!pts.length) pts.push(new THREE.Vector3(-1.5, 0, -1), new THREE.Vector3(1.5, 0, 1.5));
    const box = new THREE.Box3().setFromPoints(pts);
    const c = box.getCenter(new THREE.Vector3());
    const pitch = WIDE_PITCH;
    const cam = new THREE.PerspectiveCamera(FOV, VIEW_W / VIEW_H, 0.5, 900);
    const look = new THREE.Vector3(c.x, 0, c.z);
    // 画面里留给东西的那一块：左右 140—1780，上 230（总数）下 870（压轴的签挂在下面，再下面是这一趟做到的事、按钮）
    const fit = (d, ly) => {
      const lk = look.clone().setY(ly);
      cam.position.set(lk.x, lk.y + Math.sin(pitch) * d, lk.z + Math.cos(pitch) * d);
      cam.lookAt(lk);
      cam.updateMatrixWorld(true);
      cam.updateProjectionMatrix();
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const q of pts) {
        _v.copy(q).project(cam);
        const sx = (_v.x + 1) * 0.5 * VIEW_W, sy = (1 - _v.y) * 0.5 * VIEW_H;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
      return { x0, x1, y0, y1 };
    };
    // 先定远近（大小对上），再上下平移（中间对上）：镜头整个往下挪，东西在画面里往上走
    const span = 2 * Math.tan(((FOV / 2) * Math.PI) / 180);
    let d = 8, ly = 0;
    for (let it = 0; it < 32; it++) {
      const f = fit(d, ly);
      const sw = (f.x1 - f.x0) / 1640, sh = (f.y1 - f.y0) / 640;
      d = clamp(d * Math.pow(Math.max(sw, sh), 0.7), 3, 40);
      const mid = (f.y0 + f.y1) / 2;
      ly = clamp(ly - (((mid - 550) / VIEW_H) * span * d) / Math.cos(pitch) * 0.7, -8, 8);
    }
    this.wide = { look: look.clone().setY(ly), pitch, d: Math.max(4.6, d) };
    const sp = this.spotAt;
    this.near = { look: new THREE.Vector3(sp.x, 0.2, sp.z), pitch: 1.36, d: 3.4 };
    // 压轴：低下来、从正面看红布上那一件（像摆在柜台上），后面几排虚着
    const st = this.star;
    this.push = st
      ? { look: new THREE.Vector3(sp.x, st.ht * 0.45, sp.z - 0.05), pitch: 0.6, d: clamp(Math.max(st.w, st.ht * 1.4) * 3.3, 2.0, 3.4) }
      : { look: new THREE.Vector3(sp.x, 0.35, sp.z - 0.1), pitch: 1.08, d: Math.max(3.6, this.wide.d * 0.6) };
  }

  // 镜头：k 从近（0）到远（1）；p 是压轴时往红布推近多少
  poseCam(dt, p) {
    const cam = this.g.cam;
    const A = cam.alt;
    const N = this.near, Wd = this.wide, P = this.push;
    const k = this.camK;
    const look = N.look.clone().lerp(Wd.look, k);
    let pitch = lerp(N.pitch, Wd.pitch, k), d = Math.exp(lerp(Math.log(N.d), Math.log(Wd.d), k));
    if (p > 0) {
      look.lerp(P.look, p);
      pitch = lerp(pitch, P.pitch, p);
      d = lerp(d, P.d, p);
    }
    // 慢慢地漂一点（停着不动的画面像截图）
    const yaw = this.yaw + 0.05 * Math.sin(this.t * 0.21) + 0.012 * this.t;
    _v.copy(look);
    this.root.localToWorld(_v);
    A.look.copy(_v);
    A.pos.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d).add(_v);
    A.fov = FOV;
    A.w = 1;
  }

  update(dt, inp) {
    const g = this.g;
    if (!this.active) return null;
    const A = g.audio;
    // 跳过：按 A 时剩下的照样一件件落，只是快三倍半
    const sp = this.speed;
    this.t += dt * sp;
    const t = this.t;
    if (this.shut) this.shutUpdate(dt);
    // 镜头：0.15 秒起退开，1.2 秒退到整舱
    const kBack = easeInOut(smoothstep(0.12, 1.25, t));
    // 压轴：光亮起来时往红布推近，落定、价值进了总数以后退回整舱
    let push = 0;
    if (this.star) {
      const s = this.star;
      push = smoothstep(this.preAt, this.preAt + 0.8, t) * (1 - smoothstep(this.slamAt - 0.55, this.slamAt + 0.35, t));
      if (!s.h.precious) push *= 0.6;
    }
    this.camK = kBack;
    this.poseCam(dt, easeInOut(push));
    // 推近的时候别的价签退下去，只留红布上那一件
    const dim = push > 0.2;
    if (dim !== !!this.dimmed) { this.dimmed = dim; g.menus.tallyDim(dim); }
    // 进舱：黑场退开，舱里一股闷的木头味儿
    if (!this.said) {
      this.said = true;
      g.ui.fade(false);
      A.play('holdIn');
    }
    // 光：舱口那束光先亮着，压轴时更亮，盖上舱盖时灭
    const lightUp = smoothstep(0.0, 0.7, t);
    const pre = this.star ? smoothstep(this.preAt, this.preAt + 0.6, t) : 0;
    const shutK = this.shut ? this.shut.k : 0;
    this.shaft.material.uniforms.uA.value = (0.55 + 0.6 * pre) * lightUp * (1 - shutK);
    this.shaft.material.uniforms.uT.value = g.clock;
    this.pool.material.uniforms.uA.value = (0.55 + 0.75 * pre) * lightUp * (1 - shutK);
    // 光里飘着的灰
    if (!g.noDraw && Math.random() < dt * 9 * lightUp * (1 - shutK)) {
      const h = Math.random() * 2.6;
      const sd = this.shaftDir();
      _v.set(this.spotAt.x + sd.x * h + (Math.random() - 0.5) * 0.7, h, this.spotAt.z + sd.z * h + (Math.random() - 0.5) * 0.7);
      this.root.localToWorld(_v);
      g.fx.emit('mote', _v.x, _v.y, _v.z, (Math.random() - 0.5) * 0.04, -0.02 + Math.random() * 0.05, (Math.random() - 0.5) * 0.04);
    }
    // 压轴之前：四下暗下去，只留红布那一圈
    const pc = g.pipe.compositeUniforms;
    if (this.star) {
      const dimTo = this.star.h.precious ? 0.62 : 0.4;
      const dk = pre * (1 - smoothstep(this.slamAt - 0.3, this.slamAt + 0.5, t));
      pc.uDim.value = dimTo * dk;
      if (dk > 0.001) {
        const sc = g.project(this.root.localToWorld(_v.set(this.spotAt.x, 0.3, this.spotAt.z)));
        pc.uFocus.value.set(sc.x / VIEW_W, 1 - sc.y / VIEW_H, 0.2, 0.3);
      } else pc.uFocus.value.z = 0;
      if (!this.preSaid && t >= this.preAt) {
        this.preSaid = true;
        A.play('tallyRise', { heavy: !!this.star.h.precious });
        A.duck(0.35, 0.4, 2.0, 1.4);
      }
    }
    // 一件件落下来
    for (const s of this.all) this.slotUpdate(s, t, dt);
    // 价值飞进总数
    this.flyUpdate(dt);
    // 总数落定：章盖下去，「这一趟做到的事」一条条出来，再出「再来一趟」
    if (!this.slammed && t >= this.slamAt && !this.flying.length) {
      this.slammed = true;
      this.slamT = t;
      this.total = this.shown = this.all.reduce((a, s) => a + s.h.value, 0);
      g.menus.tallySet(this.shown, true);
      g.menus.tallySlam(this.all.length > 0);
      A.play(this.all.length ? 'tallyTotal' : 'tallyEmpty', { big: this.star && this.star.h.precious });
      if (this.all.length) g.cam.shake(0.012 * g.wobbleK);
      this.speed = 1;
    }
    if (this.slammed && !this.deedsSaid && t >= this.slamT + 0.55) {
      this.deedsSaid = true;
      g.menus.tallyDeeds();
      this.deeds.forEach((_, i) => g.later(0.08 + i * 0.26, () => { if (this.active && !this.shut) A.play('deed', { i }); }));
    }
    if (this.slammed && !this.done && t >= this.slamT + 0.55 + this.deeds.length * 0.26 + 0.35) {
      this.done = true;
      this.doneT = t;
      g.menus.tallyAgain();
    }
    // 舱里的蟹接着动
    for (const s of this.all) if (s.crab && s.landed) s.crab.update(dt, g.clock, null);
    // 压轴的光束
    if (this.rays.visible) {
      this.raysT += dt;
      poseRays(this.rays, this.raysT, g.clock, g.cam.cam);
      if (this.raysT > 3.9) this.rays.visible = false;
    }
    this.tagsUpdate();
    // 按键：还在落的时候按 A 快进；「再来一趟」出来以后按 A 再来
    if (this.shut) return null;
    if (this.done) {
      if (t - this.doneT > 0.25 && (inp.a || inp.start || g.menus.takePending())) return 'again';
      return null;
    }
    if ((inp.a || inp.start || g.menus.takePending()) && t > 0.5) this.speed = 3.5;
    return null;
  }

  // 光柱的方向（舱里，从地面往上走向舱口）
  shaftDir() {
    const sd = U.uSunDir.value;
    _w.set(sd.x, sd.y, sd.z);
    _w.applyAxisAngle(_v.set(0, 1, 0), -this.yaw);
    return _w.clone().multiplyScalar(1 / _w.y);
  }

  slotUpdate(s, t, dt) {
    const g = this.g;
    const A = g.audio;
    if (s.at === undefined) return;
    const star = !!s.star;
    const precious = star && s.h.precious;
    const fall = star ? (precious ? 0.4 : 0.32) : 0.24;
    const H = star ? (precious ? 2.6 : 1.9) : 1.25;
    const u = (t - (s.at - fall)) / fall;
    if (u < -0.6) return;
    if (u < 0) return;
    if (!s.landed) {
      s.wrap.visible = true;
      const k = Math.min(1, u);
      s.wrap.position.y = 0.035 + H * (1 - k * k);
      // 落下来时转正一点
      s.group.rotation.z = (1 - k) * 0.12 * (s.h.i % 2 ? 1 : -1);
      if (u >= 1) this.land(s);
      return;
    }
    // 落地以后：一压、一弹
    const lt = t - s.at;
    const sq = Math.exp(-lt * 9) * Math.sin(lt * 26) * (precious ? 0.1 : 0.07);
    s.wrap.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    s.wrap.position.y = 0.035;
    s.group.rotation.z = 0;
    s.cloth.scale.setScalar(1 + Math.exp(-lt * 7) * Math.sin(lt * 20) * 0.02);
    // 刚落下那一下亮一下（暖光），慢慢退
    if (s.model) {
      const e = Math.max(0, 1 - lt / 0.5);
      const glow = precious ? 0 : e * e;
      for (const m of s.model.mats) if (!precious) m.uniforms.uEmissive.value.setRGB(0.32, 0.27, 0.18).multiplyScalar(glow);
    }
    // 压轴：盖子弹开、光束、号角、撒币；价值挂上；船员在上面叫好
    if (star) this.starFx(s, lt, dt);
    // 普通的：签 0.06 秒挂上，价值 0.16 秒起飞
    if (!star) {
      if (!s.tagged && lt >= 0.06) this.hangTag(s);
      if (!s.paid && lt >= 0.16) this.pay(s);
      if (s.tag && !s.mini && ((s.miniReq && t >= s.keep) || lt >= 1.3)) this.shrinkTag(s);
    }
  }

  land(s) {
    const g = this.g;
    const A = g.audio;
    s.landed = true;
    s.wrap.position.y = 0.035;
    const star = !!s.star;
    const precious = star && s.h.precious;
    const p = this.root.localToWorld(_v.set(s.x, 0.05, s.z));
    // 灰从帆布四边扬起来
    const nd = precious ? 18 : star ? 12 : 6;
    for (let i = 0; i < nd; i++) {
      const a = (i / nd) * Math.PI * 2 + Math.random() * 0.4;
      const r = Math.max(0.3, s.w * 0.45);
      g.fx.emit('dust', p.x + Math.cos(a) * r, p.y + 0.02, p.z + Math.sin(a) * r, Math.cos(a) * 0.7, 0.25 + Math.random() * 0.25, Math.sin(a) * 0.7, { life: 1.1 });
    }
    const mass = clamp((s.w * s.d * s.ht) * 6 + 0.2, 0.25, 1.6);
    if (precious) {
      g.hit(0.11);
      A.play('heavyLand');
      g.cam.thump(0.08 * g.wobbleK);
      g.cam.shake(0.03 * g.wobbleK);
    } else if (star) {
      g.hit(0.06);
      A.play('land', { mass: 1.1, gain: 1.1 });
      g.cam.thump(0.04 * g.wobbleK);
    } else {
      // 一件比一件高的那一声「叮」，叠在落地的「咚」上：越落越亮
      const idx = this.slots.indexOf(s);
      A.play('tallyLand', { mass, i: idx, n: this.slots.length });
      if (mass > 0.9) g.cam.thump(0.025 * g.wobbleK);
      // 同名的第二只：靠上前一只「叮」，两只一起一闪（F09 同款对上）
      const prev = this.slots[idx - 1];
      if (prev && prev.h.name === s.h.name) {
        g.later(0.22 / this.speed, () => {
          if (!this.active) return;
          A.play('match', { k: 0.6 });
          for (const q of [prev, s]) if (q.model) setItemGlint(q.model, 1.2);
          g.later(0.5, () => { for (const q of [prev, s]) if (q.model) setItemGlint(q.model, 0); });
          if (prev.tag) prev.tag.classList.add('pair');
          if (s.tag) s.tag.classList.add('pair');
          // 两张整签一起多挂一会儿，看得清是哪两只对上了
          prev.keep = s.keep = this.t + 0.9;
          prev.pair = s.pair = true;
          g.cue('F09');
        });
      }
    }
  }

  starFx(s, lt, dt) {
    const g = this.g;
    const A = g.audio;
    const F = s.F || (s.F = {});
    const precious = s.h.precious;
    const top = this.root.localToWorld(new THREE.Vector3(s.x, s.ht * 0.85, s.z));
    if (precious) {
      // 盖子 0.12 秒弹开（回弹的弧）
      if (s.model && s.model.lid) {
        const k = clamp((lt - 0.12) / 0.55, 0, 1);
        s.model.lid.rotation.set(-easeOutBack(k) * 1.95, 0, 0);
        if (!F.pop && lt >= 0.12) { F.pop = true; A.play('lidPop'); setItemGlint(s.model, 1); }
      }
      const glow = lt < 0.3 ? smoothstep(0.1, 0.28, lt) : Math.max(0, 1 - (lt - 0.3) / 2.4);
      if (s.model) for (const m of s.model.mats) m.uniforms.uEmissive.value.setRGB(0.1, 0.11, 0.13).multiplyScalar(glow * (0.55 + 0.45 * g.wobbleK));
      if (lt > 0.15 && lt < 2.2 && Math.random() < dt * 12) {
        const a = Math.random() * Math.PI * 2;
        g.fx.emit('shine', top.x + Math.cos(a) * 0.1, top.y + 0.12, top.z + Math.sin(a) * 0.07, 0, 1.0 + Math.random() * 0.5, 0, { life: 0.8, size: 0.16 });
      }
      // 0.25 秒：光束张开，银币溅出来落在帆布上，号角
      if (!F.rays && lt >= 0.25) {
        F.rays = true;
        this.rays.visible = true;
        this.raysT = 0;
        this.rays.position.copy(top);
        const floorY = this.root.position.y + 0.05;
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 0.9 + Math.random() * 1.2;
          g.fx.emit('coin', top.x, top.y + 0.05, top.z, Math.cos(a) * v, 2.0 + Math.random() * 1.4, Math.sin(a) * v, { floorY });
        }
        A.play('fanfare', { k: 0.7 });
        A.play('coins', { n: 14, dur: 0.9, at: 0.35 });
      }
      if (!F.cheer && lt >= 1.05) { F.cheer = true; A.play('cheer', { far: true }); }
      // 匣里银币一闪一闪
      if (lt > 1.0 && (F.glimT = (F.glimT ?? 0.3) - dt) <= 0) {
        F.glimT = 0.45 + Math.random() * 0.5;
        const info = s.model && s.model.info;
        if (info) {
          const Wl = info.lid ? info.lid.W : 0.25, Dl = info.lid ? info.lid.D : 0.17;
          const q = s.model.group.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 2 * (Wl - 0.05), info.h - 0.03, (Math.random() - 0.5) * 2 * (Dl - 0.04)));
          g.fx.emit('glint', q.x, q.y, q.z, 0, 0.05, 0, { life: 0.3, size: 0.13 });
        }
      }
    } else if (!F.chord && lt >= 0.12) {
      F.chord = true;
      A.play('reveal', { n: 4, best: s.h.value });
      if (s.model) setItemGlint(s.model, 0.8);
    }
    if (!s.tagged && lt >= (precious ? 0.45 : 0.3)) this.hangTag(s);
    if (!s.paid && lt >= (precious ? 0.72 : 0.45)) this.pay(s);
  }

  hangTag(s) {
    const g = this.g;
    s.tagged = true;
    s.tag = g.menus.tallyTag(s.h, !!s.star);
    s.keep = 0;
    // 前面那几张收成小价签：一次只挂一张整签（同名的前一只等对上了再收）
    const prev = this.slots[this.slots.indexOf(s) - 1];
    for (const q of this.slots) if (q !== s && q.tag && !q.mini && !(q === prev && prev.h.name === s.h.name)) q.miniReq = true;
    if (!s.star) g.audio.play('card', { i: this.slots.indexOf(s) % 6 });
    else g.audio.play('ribbon', { heavy: !!s.h.precious });
  }

  // 整签收成一枚小价签：只剩价值，贴在帆布前沿
  shrinkTag(s) {
    s.mini = true;
    this.g.menus.tallyMini(s.tag);
  }

  // 价值从签上飞进总数（到了才加，屏幕上的总数等于已经落下来的那几件）
  pay(s) {
    const g = this.g;
    s.paid = true;
    const el = g.menus.tallyCoin(s.h.value, !!s.star && !!s.h.precious);
    const from = this.tagPos(s);
    const to = g.menus.tallyTotalAt();
    this.flying.push({ s, el, t: 0, dur: s.star ? 0.55 : 0.42, from, to });
  }

  flyUpdate(dt) {
    const g = this.g;
    const A = g.audio;
    for (const f of this.flying) {
      f.t += dt * this.speed;
      const k = clamp(f.t / f.dur, 0, 1);
      const e = k * k * (3 - 2 * k);
      const x = lerp(f.from.x, f.to.x, e), y = lerp(f.from.y, f.to.y, e) - Math.sin(k * Math.PI) * 120;
      g.menus.tallyCoinAt(f.el, x, y, k);
      if (k >= 1) {
        f.done = true;
        f.el.remove();
        // 进账：总数滚上去
        this.total += f.s.h.value;
        this.rollFrom = this.shown;
        this.rollT = 0;
        this.rollDur = f.s.star ? (f.s.h.precious ? 1.05 : 0.6) : 0.28;
        this.beadUnit = Math.max(1, (this.total - this.shown) / (f.s.star ? 18 : 4));
        this.beadStep = 0;
        A.play('coinIn', { big: !!f.s.star, i: this.slots.indexOf(f.s) });
        g.menus.tallyPulse(!!f.s.star);
      }
    }
    this.flying = this.flying.filter((f) => !f.done);
    if (this.shown < this.total) {
      this.rollT += dt * this.speed;
      const k = clamp(this.rollT / this.rollDur, 0, 1);
      const v = Math.round(lerp(this.rollFrom, this.total, 1 - Math.pow(1 - k, 3)));
      const step = Math.floor((v - this.rollFrom) / this.beadUnit);
      if (step > this.beadStep) { this.beadStep = step; A.play('bead', { i: step }); }
      this.shown = v;
      g.menus.tallySet(v);
    }
  }

  // 签挂在东西前面（画面上在东西下面），跟着镜头走
  tagPos(s) {
    const g = this.g;
    const p = g.project(this.root.localToWorld(_v.set(s.x, 0.02, s.z + s.d * 0.5 + 0.12)));
    const q = g.project(this.root.localToWorld(_w.set(s.x, s.ht, s.z)));
    return { x: p.x, y: p.y + 6, top: q.y };
  }

  tagsUpdate() {
    // 压轴那一件（连红布）在画面上占的那块：后排的价签落进这块就挂到东西上面去，不压着它
    let R = null;
    const st = this.star;
    if (st && st.landed) {
      R = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
      const cw = st.cloth ? st.w * 0.5 + 0.3 : 0.5;
      for (const [x, y, z] of [[-cw, 0, -st.d / 2 - 0.2], [cw, 0, -st.d / 2 - 0.2], [-cw, st.ht + 0.35, -st.d / 2], [cw, st.ht + 0.35, -st.d / 2], [-cw, 0, st.d / 2 + 0.25], [cw, 0, st.d / 2 + 0.25]]) {
        const q = this.g.project(this.root.localToWorld(_v.set(st.x + x, y, st.z + z)));
        R.x0 = Math.min(R.x0, q.x); R.x1 = Math.max(R.x1, q.x); R.y0 = Math.min(R.y0, q.y); R.y1 = Math.max(R.y1, q.y);
      }
    }
    // 整签互相压着的时候，后挂的那张往下让（按落下的先后）
    const full = [];
    for (const s of this.all) {
      if (!s.tag) continue;
      const p = this.tagPos(s);
      let y = p.y;
      let x = p.x;
      if (R && s !== st && p.x > R.x0 - 40 && p.x < R.x1 + 40 && p.y > R.y0 - 30 && p.y < R.y1) {
        // 挂到东西外侧那一头（离红布远的那边），和东西一样高
        const sg = s.x < (st ? st.x : 0) ? -1 : 1;
        const q = this.g.project(this.root.localToWorld(_v.set(s.x + sg * (s.w * 0.5 + 0.12), 0.02, s.z)));
        x = q.x + (sg * s.tag.offsetWidth) / 2;
        y = q.y - s.tag.offsetHeight / 2;
      }
      if (!s.mini) {
        const w = s.tag.offsetWidth, h = s.tag.offsetHeight;
        for (const q of full) if (Math.abs(q.x - x) < (q.w + w) / 2 + 4 && y < q.y + q.h + 4 && y + h > q.y - 4) y = q.y + q.h + 6;
        full.push({ x, y, w, h });
      }
      this.g.menus.tallyTagAt(s.tag, x, y);
    }
  }

  // C16 再来一趟：舱盖拉上——影子从一边扫过整舱，光灭，黑下来
  close() {
    const g = this.g;
    if (!this.active || this.shut) return;
    this.shut = { t: 0, k: 0 };
    this.lid.visible = true;
    this.speed = 1;
    g.audio.play('hatchShut');
    g.menus.tallyOut();
  }

  shutUpdate(dt) {
    const S = this.shut;
    S.t += dt;
    // 舱盖从光进来的那一边往另一边拉过去：影子扫过所有东西
    const k = easeInOut(clamp(S.t / 0.75, 0, 1));
    S.k = k;
    const sd = this.shaftDir();
    const h = 3.2;
    const span = 34;
    // 舱盖在 h 高处，往光照进来的反方向推，影子边从近处扫到远处
    const off = lerp(-span / 2 - 6, 0, k);
    this.lid.position.set(this.spotAt.x + sd.x * h + off, h, this.spotAt.z + sd.z * h);
  }

  // 收拾：回到港外以前
  end() {
    const g = this.g;
    if (!this.root) return;
    this.active = false;
    this.root.visible = false;
    this.rays.visible = false;
    this.lid.visible = false;
    this.clearContent();
    if (this.saved) {
      const pc = g.pipe.compositeUniforms;
      U.uSunCol.value.copy(this.saved.sun);
      U.uAmbSky.value.copy(this.saved.sky);
      U.uAmbGround.value.copy(this.saved.gnd);
      pc.uVignette.value = this.saved.vig;
      pc.uShafts.value = this.saved.shafts;
      pc.uDim.value = 0;
      pc.uFocus.value.z = 0;
      this.saved = null;
    }
  }

  clearContent() {
    if (!this.content) return;
    for (const c of [...this.content.children]) { this.content.remove(c); disposeTree(c); }
    this.all = [];
    this.slots = [];
    this.star = null;
    this.flying = [];
    this.said = this.preSaid = this.slammed = this.deedsSaid = false;
    this.done = false;
  }
}

function disposeTree(o) {
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
  });
}

// 一块帆布：四角往下垂一点、边上一道深色缝线
function buildCloth(w, d, color, R) {
  const b = new GeoBuilder();
  const nx = 6, nz = 5;
  const P = (i, j) => {
    const u = i / nx - 0.5, v = j / nz - 0.5;
    const edge = Math.max(Math.abs(u), Math.abs(v)) * 2;
    return new THREE.Vector3(u * w, 0.012 + 0.012 * (1 - edge) + (R() - 0.5) * 0.008, v * d);
  };
  const pts = [];
  for (let i = 0; i <= nx; i++) { pts[i] = []; for (let j = 0; j <= nz; j++) pts[i][j] = P(i, j); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const k = 0.94 + R() * 0.1;
    const c = color.clone().multiplyScalar(k);
    b.quad(pts[i][j + 1], pts[i + 1][j + 1], pts[i + 1][j], pts[i][j], c);
  }
  // 缝线
  const seam = color.clone().multiplyScalar(0.55);
  const t = 0.02;
  b.box(new THREE.Vector3(0, 0.018, -d / 2 + 0.05), new THREE.Vector3(w / 2 - 0.05, 0, 0), new THREE.Vector3(0, 0.004, 0), new THREE.Vector3(0, 0, t / 2), seam);
  b.box(new THREE.Vector3(0, 0.018, d / 2 - 0.05), new THREE.Vector3(w / 2 - 0.05, 0, 0), new THREE.Vector3(0, 0.004, 0), new THREE.Vector3(0, 0, t / 2), seam);
  b.box(new THREE.Vector3(-w / 2 + 0.05, 0.018, 0), new THREE.Vector3(t / 2, 0, 0), new THREE.Vector3(0, 0.004, 0), new THREE.Vector3(0, 0, d / 2 - 0.05), seam);
  b.box(new THREE.Vector3(w / 2 - 0.05, 0.018, 0), new THREE.Vector3(t / 2, 0, 0), new THREE.Vector3(0, 0.004, 0), new THREE.Vector3(0, 0, d / 2 - 0.05), seam);
  const m = new THREE.Mesh(b.build(), toon({ vertexColors: true }));
  const g = new THREE.Group();
  g.add(m);
  return g;
}

// 舱口照进来的那束光：一根斜着的方光柱，上亮下淡，边上软
function buildShaft() {
  const geo = new THREE.BoxGeometry(1.25, 1, 1.05, 1, 1, 1);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uT: { value: 0 }, uDir: { value: new THREE.Vector3(0, 1, 0) } },
    vertexShader: /* glsl */ `
      uniform vec3 uDir; varying vec3 vP;
      void main(){
        vP = position;
        // 顺着光的方向斜过去：高 h 处平移 uDir.xz * h
        vec3 p = position;
        float h = p.y * 4.2;
        p = vec3(p.x + uDir.x * h, h, p.z + uDir.z * h);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uA; uniform float uT; varying vec3 vP;
      void main(){
        float edge = smoothstep(0.62, 0.3, abs(vP.x)) * smoothstep(0.52, 0.25, abs(vP.z));
        float along = smoothstep(0.0, 0.12, vP.y) * (0.45 + 0.55 * smoothstep(1.0, 0.2, vP.y));
        float flick = 0.9 + 0.1 * sin(uT * 1.3 + vP.y * 6.0);
        float a = edge * along * uA * 0.32 * flick;
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * a, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 24;
  m.frustumCulled = false;
  m.onBeforeRender = () => {
    const sd = U.uSunDir.value;
    const root = m.parent;
    if (!root) return;
    _w.set(sd.x, sd.y, sd.z).applyAxisAngle(_v.set(0, 1, 0), -root.rotation.y);
    mat.uniforms.uDir.value.set(_w.x / _w.y, 1, _w.z / _w.y);
  };
  return m;
}

// 地上一圈暖光（加色）
function buildPool(r = 0.95, col = [1.0, 0.86, 0.58]) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uC: { value: new THREE.Vector3(...col) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main(){
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p * vec2(1.0, 1.08));
        float a = smoothstep(1.0, 0.45, r) * uA * 0.42;
        gl_FragColor = vec4(uC * a, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.4, r * 2.4), mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 23;
  return m;
}
