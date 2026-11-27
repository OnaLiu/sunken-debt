import * as THREE from 'three';
import { GeoBuilder } from '../util/builder.js';
import { toon } from '../render/materials.js';
import { seabedY } from '../world/terrain.js';
import { BOAT } from '../world/boat.js';
import { HAND_SEAT, HAND_FACE } from '../life/crew.js';
import { VIEW_W, VIEW_H } from '../config.js';
import { clamp, damp, lerp, smoothstep, mulberry32, easeOutBack } from '../util/math.js';

// 船坞（设计第 6 节）：一趟结束、开完舱，船停进港外航路西头的码头。镜头慢慢绕着船转；点船上哪一处，就看哪一样设备，
// 买下以后船员当场把它装上（代码画的人、代码算的动作），船上马上多一样、换一样。
// 全游戏一份：后面的海回港也停这里；以后加的设备（吊臂、声呐、灯、第二台吊机、船员、船队的船）往 GEAR 里加一样、在船上加一处。
//
// 这一份管码头的样子、船上看得见的设备部件、镜头和船员装设备；买卖、钱、存档在 run.js，屏幕上的牌子在 run.js 的界面里。

// 码头在港外航路西头（浮标从 x -214 起往东排）：船靠在码头南边，船头朝东，出港就是航路
export const PIER = { x: -238, z: -40, heading: 0 };
const DECK_Y = 1.15; // 码头面离水面多高

// 船上每一样设备在哪（船自己的坐标：x 朝船头，z 朝右舷）：镜头绕着转时牌子钉在这一点上，船员装设备走到 at 那儿
export const GEAR_SPOTS = {
  net: { p: new THREE.Vector3(4.3, 3.9, 0), at: [3.6, 0.0], face: 0 },
  tank: { p: new THREE.Vector3(-4.3, 4.2, 0.0), at: [-3.0, -1.5], face: Math.PI },
  deck: { p: new THREE.Vector3(3.3, 1.5, 3.0), at: [3.2, 1.5], face: -Math.PI / 2 },
  pump: { p: new THREE.Vector3(1.0, 1.6, -1.9), at: [1.0, -1.35], face: Math.PI / 2 },
  // 吊机手：牌子钉在吊机前扳手柄的那个船员头上（雇了以后是他坐的座子顶上）
  hand: { p: new THREE.Vector3(HAND_SEAT[0], BOAT.deckY + 2.25, HAND_SEAT[1]), at: HAND_SEAT, face: HAND_FACE },
};

const C = {
  plank: new THREE.Color(0.62, 0.48, 0.33),
  plank2: new THREE.Color(0.55, 0.42, 0.28),
  pile: new THREE.Color(0.34, 0.26, 0.19),
  stone: new THREE.Color(0.55, 0.56, 0.54),
  stone2: new THREE.Color(0.47, 0.48, 0.47),
  iron: new THREE.Color(0.2, 0.21, 0.22),
  rope: new THREE.Color(0.7, 0.6, 0.42),
  red: new THREE.Color(0.72, 0.24, 0.17),
  crate: new THREE.Color(0.6, 0.45, 0.28),
  roof: new THREE.Color(0.45, 0.2, 0.15),
  white: new THREE.Color(0.9, 0.88, 0.82),
  lamp: new THREE.Color(1.0, 0.86, 0.5),
};

export class Dock {
  constructor(g) {
    this.g = g;
    this.group = new THREE.Group();
    this.group.name = 'dock';
    g.scene.add(this.group);
    this.buildPier();
    this.parts = buildGearParts(g.boat);
    this.on = false;
    this.yaw = 0;
    this.sel = null;
    this.installs = [];
  }

  // —— 码头：木栈桥、桩、系缆桩、石砌的堤（往北伸出画面）、一间小棚、几只箱桶、两根灯杆 ——
  buildPier() {
    const b = new GeoBuilder();
    const R = mulberry32(31);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const X = (s) => V(s, 0, 0), Y = (s) => V(0, s, 0), Z = (s) => V(0, 0, s);
    const px = PIER.x, pz = PIER.z;
    // 栈桥：沿船的北边（左舷）一条，船头船尾各多出几米
    const z0 = pz - 4.0, z1 = pz - 7.2; // 北边那一条栈桥的南沿、北沿
    const x0 = px - 13, x1 = px + 11;
    for (let x = x0; x < x1; x += 0.42) {
      const k = 0.9 + R() * 0.18;
      b.box(V(x + 0.21, DECK_Y, (z0 + z1) / 2), X(0.2), Y(0.07), Z((z0 - z1) / 2), (R() < 0.5 ? C.plank : C.plank2).clone().multiplyScalar(k));
    }
    // 栈桥两边的纵梁和桩（桩一直扎到海底）
    for (const z of [z0 + 0.12, z1 - 0.12]) {
      b.box(V((x0 + x1) / 2, DECK_Y - 0.2, z), X((x1 - x0) / 2), Y(0.12), Z(0.1), C.pile);
      for (let x = x0 + 0.4; x <= x1; x += 3.0) {
        const bot = seabedY(x, z) - 0.5;
        b.cylinder(V(x, bot, z), V(x, DECK_Y + 0.35, z), 0.2, 0.2, 7, C.pile, true);
      }
    }
    // 系缆桩：铁的，两只，船头船尾各一
    for (const x of [px - 5.5, px + 5.0]) {
      b.cylinder(V(x, DECK_Y + 0.07, z0 - 0.5), V(x, DECK_Y + 0.5, z0 - 0.5), 0.17, 0.15, 8, C.iron, true);
      b.cylinder(V(x, DECK_Y + 0.5, z0 - 0.5), V(x, DECK_Y + 0.6, z0 - 0.5), 0.24, 0.24, 8, C.iron, true);
    }
    // 石堤：从栈桥中段往北伸出去（伸出画面，港口在那边）
    const qx0 = px - 3.5, qx1 = px + 3.5;
    for (let z = z1; z > pz - 80; z -= 1.1) {
      for (let x = qx0; x < qx1; x += 1.4) {
        const k = 0.88 + R() * 0.22;
        b.box(V(x + 0.7, DECK_Y - 0.15, z - 0.55), X(0.68), Y(0.3), Z(0.53), (R() < 0.5 ? C.stone : C.stone2).clone().multiplyScalar(k));
      }
      // 两边往下砌到海底
      for (const x of [qx0 - 0.3, qx1 + 0.3]) {
        const bot = seabedY(x, z) - 0.5;
        b.box(V(x, (bot + DECK_Y) / 2, z - 0.55), X(0.32), Y((DECK_Y - bot) / 2), Z(0.55), C.stone2.clone().multiplyScalar(0.85 + R() * 0.1));
      }
    }
    // 小棚：堤上靠栈桥那头，木墙红瓦
    const sx = px - 0.2, sz = pz - 12.5;
    b.box(V(sx, DECK_Y + 1.25, sz), X(2.0), Y(1.25), Z(1.6), C.plank2);
    b.box(V(sx + 0.9, DECK_Y + 0.9, sz + 1.62), X(0.45), Y(0.9), Z(0.03), C.pile);
    b.quad(V(sx - 2.3, DECK_Y + 2.5, sz + 1.9), V(sx + 2.3, DECK_Y + 2.5, sz + 1.9), V(sx + 2.3, DECK_Y + 3.6, sz), V(sx - 2.3, DECK_Y + 3.6, sz), C.roof);
    b.quad(V(sx + 2.3, DECK_Y + 2.5, sz - 1.9), V(sx - 2.3, DECK_Y + 2.5, sz - 1.9), V(sx - 2.3, DECK_Y + 3.6, sz), V(sx + 2.3, DECK_Y + 3.6, sz), C.roof.clone().multiplyScalar(0.85));
    // 箱子、桶、一盘缆：码头上干活的样子
    const crate = (x, z, s, rot) => {
      const ax = V(Math.cos(rot), 0, -Math.sin(rot)).multiplyScalar(s), az = V(Math.sin(rot), 0, Math.cos(rot)).multiplyScalar(s);
      b.box(V(x, DECK_Y + 0.07 + s, z), ax, Y(s), az, C.crate);
      b.box(V(x, DECK_Y + 0.07 + s, z), ax.clone().multiplyScalar(1.04), Y(s * 0.12), az.clone().multiplyScalar(1.04), C.pile);
    };
    crate(px - 9.5, z1 + 1.0, 0.42, 0.2);
    crate(px - 8.6, z1 + 0.9, 0.35, -0.3);
    crate(px - 9.2, z1 + 1.05, 0.3, 0.5);
    for (const [x, z] of [[px + 7.8, z1 + 0.9], [px + 8.6, z1 + 1.1]]) b.cylinder(V(x, DECK_Y + 0.07, z), V(x, DECK_Y + 0.95, z), 0.33, 0.33, 9, C.red.clone().multiplyScalar(0.8), true);
    for (let i = 0; i < 4; i++) b.cylinder(V(px - 2.6, DECK_Y + 0.08 + i * 0.07, z0 - 1.3), V(px - 2.6, DECK_Y + 0.14 + i * 0.07, z0 - 1.3), 0.48 - i * 0.07, 0.48 - i * 0.07, 10, C.rope, true);
    // 灯杆
    for (const x of [px - 11, px + 9.5]) {
      b.cylinder(V(x, DECK_Y, z1 + 0.4), V(x, DECK_Y + 3.4, z1 + 0.4), 0.07, 0.07, 6, C.iron, true);
      b.box(V(x, DECK_Y + 3.55, z1 + 0.4), X(0.18), Y(0.2), Z(0.18), C.lamp);
    }
    const mesh = new THREE.Mesh(b.build(), toon({ vertexColors: true, spec: 0.05 }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    // 系船的两根缆：从船头船尾的缆桩斜到码头的系缆桩
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x7a6a4a });
    this.lines = [];
    for (const [bx, px2] of [[5.2, px + 5.0], [-5.4, px - 5.5]]) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(10 * 3), 3));
      const L = new THREE.Line(geo, ropeMat);
      L.frustumCulled = false;
      L.visible = false;
      this.group.add(L);
      this.lines.push({ L, bx, to: V(px2, DECK_Y + 0.55, z0 - 0.5) });
    }
  }

  // 船靠上码头：船停在码头南边、船头朝东；系上缆
  moor() {
    const g = this.g, bc = g.boatCtl;
    bc.reset(PIER.x, PIER.z, PIER.heading);
    bc.update(0.016, { throttle: 0, brake: 0, steer: 0 }, 1, g.time);
    g.boat.root.updateMatrixWorld(true);
    this.on = true;
    for (const l of this.lines) l.L.visible = true;
    this.yaw = -Math.PI / 2 + 0.55;
    const cam = g.cam;
    cam.yawT = this.yaw;
    cam.pitchT = 0.5;
    cam.distT = 21;
    cam.pivotT.set(PIER.x + 0.5, 1.2, PIER.z);
    cam.snapTo();
  }

  leave() {
    this.on = false;
    for (const l of this.lines) l.L.visible = false;
    for (const I of this.installs) {
      if (I.hire) { this.parts.set('hand', 2); this.g.crew.seatHand(true); continue; }
      if (I.s) { I.s.task = null; I.s.pose = 'stand'; }
    }
    this.installs = [];
  }

  // 船坞的镜头：绕着船慢慢转；选中一样时转过去对着它、靠近一点
  camera(dt) {
    const g = this.g, cam = g.cam;
    const sel = this.sel && GEAR_SPOTS[this.sel];
    const bp = g.boatCtl.pos;
    if (sel) {
      const w = g.boat.body.localToWorld(sel.p.clone());
      // 对着那一处：从船外侧斜着看过去（那一处在船的哪一舷就从哪一舷看）
      const side = sel.p.z >= 0 ? 1 : -1;
      const want = Math.atan2((w.x - bp.x) + side * 0, (w.z - bp.z) + side * 6) ;
      this.yaw = dampAngleTo(this.yaw, want, 1.6, dt);
      cam.pivotT.set(lerp(bp.x, w.x, 0.55), lerp(1.2, w.y, 0.4), lerp(bp.z, w.z, 0.55));
      cam.distT = damp(cam.distT, 16, 2, dt);
      cam.pitchT = damp(cam.pitchT, 0.55, 2, dt);
    } else {
      this.yaw += dt * 0.07;
      cam.pivotT.set(bp.x + 0.5, 1.2, bp.z);
      cam.distT = damp(cam.distT, 21, 1.5, dt);
      cam.pitchT = damp(cam.pitchT, 0.5, 1.5, dt);
    }
    cam.yawT = this.yaw;
  }

  // 每帧：缆跟着船晃、船员装设备、新装上的部件「咚」地落定
  update(dt) {
    const g = this.g;
    if (!this.on) return;
    for (const l of this.lines) {
      const a = g.boat.body.localToWorld(new THREE.Vector3(l.bx, BOAT.deckY + 0.3, -1.6));
      const p = l.L.geometry.attributes.position.array;
      for (let i = 0; i < 10; i++) {
        const t = i / 9;
        p[i * 3] = lerp(a.x, l.to.x, t);
        p[i * 3 + 1] = lerp(a.y, l.to.y, t) - Math.sin(t * Math.PI) * 0.35;
        p[i * 3 + 2] = lerp(a.z, l.to.z, t);
      }
      l.L.geometry.attributes.position.needsUpdate = true;
    }
    for (const I of this.installs) this.installStep(I, dt);
    this.installs = this.installs.filter((I) => !I.done);
    this.parts.update(dt);
  }

  // 买下一样：一个空着的船员走过去，蹲下摆弄（拧、敲），部件跟着一下一下装上，最后站起来点个头
  install(kind, level, onSet) {
    const g = this.g;
    if (kind === 'hand') return this.hire(onSet);
    const busy = new Set(this.installs.map((I) => I.s));
    const s = g.crew.sailors.find((q) => !busy.has(q) && !q.task) || g.crew.sailors.find((q) => !busy.has(q)) || g.crew.sailors[0];
    const spot = GEAR_SPOTS[kind];
    s.task = { kind: 'install' };
    s.goTo(spot.at[0], spot.at[1]);
    s.pose = 'stand';
    this.installs.push({ s, kind, level, spot, t: 0, step: 'go', onSet });
  }

  // 雇吊机手：扳吊机的那个船员（老周）走到吊机前，戴上手套；吊机前立起一张带顶棚的座子（从上面落下来、一顿），
  // 他坐上去握住手柄，冲镜头点一下头
  hire(onSet) {
    const g = this.g, s = g.crew.sailors[0];
    for (const I of this.installs) if (I.s === s) I.done = true;
    s.task = { kind: 'install' };
    s.goTo(HAND_SEAT[0] - 0.55, HAND_SEAT[1] + 0.15);
    s.pose = 'stand';
    this.installs.push({ s, kind: 'hand', level: 2, t: 0, step: 'go', onSet, hire: true });
  }

  hireStep(I, dt) {
    const g = this.g, s = I.s;
    I.t += dt;
    if (I.step === 'go') {
      if (!s.moving || I.t > 6) { I.step = 'gloves'; I.t = 0; s.faceT = HAND_FACE - 0.9; s.pose = 'stand'; s.gesture('gloves'); g.audio.play('stow'); }
      return;
    }
    if (I.step === 'gloves') {
      if (I.t > 1.7) {
        I.step = 'seat'; I.t = 0;
        this.parts.set('hand', 2, true);
        g.audio.play('stow');
        if (I.onSet) I.onSet();
      }
      return;
    }
    if (I.step === 'seat') {
      // 座子落定以后他坐上去
      if (I.t > 0.75) { I.step = 'sit'; I.t = 0; g.crew.seatHand(true, true); }
      return;
    }
    if (I.step === 'sit') {
      if (!s.moving && s.p.sit > 0.8 && I.t > 0.6) { I.step = 'nod'; I.t = 0; s.gesture('nod'); g.audio.play('castLock'); }
      else if (I.t > 4) { I.step = 'nod'; I.t = 0; }
      return;
    }
    if (I.t > 1.2) I.done = true;
  }

  installStep(I, dt) {
    if (I.hire) return this.hireStep(I, dt);
    const s = I.s;
    I.t += dt;
    if (I.step === 'go') {
      if (!s.moving || I.t > 6) { I.step = 'work'; I.t = 0; s.faceT = I.spot.face; s.pose = 'check'; }
      return;
    }
    if (I.step === 'work') {
      // 摆弄一会儿：每 0.45 秒一下（扳一下、敲一下），第三下时部件装上
      const n = Math.floor(I.t / 0.45);
      if (n !== I.n) {
        I.n = n;
        if (n < 4) { s.gesture('heave', { dur: 0.42 }); this.g.audio.play('stow'); }
        if (n === 2) { this.parts.set(I.kind, I.level, true); if (I.onSet) I.onSet(); }
      }
      if (I.t > 1.9) { I.step = 'nod'; I.t = 0; s.pose = 'stand'; s.gesture('nod'); }
      return;
    }
    if (I.t > 1.2) { s.task = null; I.done = true; }
  }

  // 这一处在画面上哪一点（牌子钉在这里）
  screenAt(kind) {
    const g = this.g;
    const q = GEAR_SPOTS[kind].p.clone();
    // 吊机手：牌子顶在扳吊机的那个船员头上（他走到哪跟到哪），比别的牌子高一截，不和水泵那块挤在一起
    const s = kind === 'hand' && g.crew.sailors[0];
    if (s) q.set(s.x, q.y + 0.9, s.z);
    const w = g.boat.body.localToWorld(q);
    const p = g.project(w);
    return { x: p.x, y: p.y, on: p.z < 1 && p.x > 40 && p.x < VIEW_W - 40 && p.y > 40 && p.y < VIEW_H - 40 };
  }
}

function dampAngleTo(a, b, rate, dt) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * (1 - Math.exp(-rate * dt));
}

// —— 船上看得见的设备部件（代码画的）：油箱多两只、四只；水泵一台、两台；网（网圈在 boat.js 的 setR）；甲板加宽（deck.js 的平台）——
// 新装上的那一样从上面落下来、一顿、弹一下站稳
function buildGearParts(boat) {
  const parts = { tank: [], pump: [], hand: [] };
  const shell = new THREE.Color(0.88, 0.88, 0.82);
  const mkTank = (x, z) => {
    const b = new GeoBuilder();
    const V = (dy) => new THREE.Vector3(0, dy, 0);
    b.cylinder(V(0), V(0.82), 0.27, 0.27, 10, shell, false);
    b.cylinder(V(0.82), V(0.88), 0.27, 0.19, 10, shell, true);
    b.cylinder(new THREE.Vector3(0.05, 0.87, -0.04), new THREE.Vector3(0.05, 0.94, -0.04), 0.06, 0.06, 6, C.red, true);
    // 透出来的油：一圈琥珀色
    b.cylinder(V(0.04), V(0.62), 0.277, 0.277, 10, new THREE.Color(0.86, 0.62, 0.22), false);
    b.box(V(0.03), new THREE.Vector3(0.31, 0, 0), new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0, 0.05), C.pile);
    const m = new THREE.Mesh(b.build(), toon({ vertexColors: true, spec: 0.3, shin: 20 }));
    m.castShadow = true;
    m.position.set(x, 3.23, z);
    m.visible = false;
    boat.body.add(m);
    return m;
  };
  // 第 2 级：驾驶室顶上左舷那一边再立两只；第 3 级：往前再两只
  parts.tank.push([mkTank(-4.5, -0.25), mkTank(-4.36, -0.84)], [mkTank(-3.7, 0.4), mkTank(-3.6, -0.5)]);
  const mkPump = (z) => {
    const b = new GeoBuilder();
    const V = (x, y, zz) => new THREE.Vector3(x, y, zz);
    const s = Math.sign(z);
    // 底座、机身（红漆）、飞轮、出水口和一卷水管
    b.box(V(0, 0.05, 0), V(0.42, 0, 0), V(0, 0.05, 0), V(0, 0, 0.26), C.pile);
    b.box(V(0, 0.33, 0), V(0.3, 0, 0), V(0, 0.23, 0), V(0, 0, 0.2), C.red);
    b.cylinder(V(0.34, 0.33, 0), V(0.4, 0.33, 0), 0.2, 0.2, 10, C.iron, true);
    b.cylinder(V(-0.3, 0.45, 0), V(-0.48, 0.45, 0), 0.06, 0.06, 6, C.iron, true);
    b.cylinder(V(-0.05, 0.6, 0), V(-0.05, 0.75, 0), 0.06, 0.06, 6, C.iron, true);
    for (let i = 0; i < 3; i++) b.cylinder(V(-0.1, 0.1, -s * 0.48), V(0.1, 0.1, -s * 0.48), 0.3 - i * 0.06, 0.3 - i * 0.06, 10, new THREE.Color(0.2, 0.3, 0.24), true);
    const m = new THREE.Mesh(b.build(), toon({ vertexColors: true, spec: 0.25 }));
    m.castShadow = true;
    m.position.set(1.0, BOAT.deckY, z);
    m.visible = false;
    boat.body.add(m);
    return [m];
  };
  parts.pump.push(mkPump(-1.72), mkPump(1.72));
  // 吊机手的座子：一张矮木凳，四根细柱撑一块帆布顶棚（红白条），立在吊机前他原来扳手柄的那一处，背靠吊机立柱
  const mkSeat = () => {
    const b = new GeoBuilder();
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const wood = new THREE.Color(0.5, 0.36, 0.22), wood2 = new THREE.Color(0.42, 0.3, 0.19);
    const canvasW = new THREE.Color(0.9, 0.86, 0.76), canvasR = new THREE.Color(0.72, 0.26, 0.18);
    // 凳面（他背后那一侧，坐上去胯落在这里）和四条腿
    b.box(V(0, 0.4, 0.12), V(0.24, 0, 0), V(0, 0.035, 0), V(0, 0, 0.2), wood);
    for (const [x, z] of [[-0.19, -0.04], [0.19, -0.04], [-0.19, 0.28], [0.19, 0.28]]) b.box(V(x, 0.19, z), V(0.025, 0, 0), V(0, 0.19, 0), V(0, 0, 0.025), wood2);
    // 靠背
    b.box(V(0, 0.68, 0.33), V(0.22, 0, 0), V(0, 0.2, 0), V(0, 0, 0.02), wood);
    // 顶棚的四根柱子
    for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.38], [0.42, 0.38]]) b.cylinder(V(x, 0, z), V(x, z < 0 ? 1.82 : 1.95, z), 0.022, 0.022, 5, C.iron, true);
    // 帆布顶：前低后高，一条红一条白
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x0 = -0.48 + (0.96 * i) / n, x1 = -0.48 + (0.96 * (i + 1)) / n;
      const c = i % 2 ? canvasR : canvasW;
      b.quad(V(x0, 1.84, -0.5), V(x1, 1.84, -0.5), V(x1, 1.97, 0.44), V(x0, 1.97, 0.44), c);
      b.quad(V(x1, 1.84, -0.5), V(x0, 1.84, -0.5), V(x0, 1.97, 0.44), V(x1, 1.97, 0.44), c.clone().multiplyScalar(0.85));
      // 前沿垂下来一小截
      b.quad(V(x0, 1.84, -0.5), V(x0, 1.74, -0.52), V(x1, 1.74, -0.52), V(x1, 1.84, -0.5), c.clone().multiplyScalar(0.92));
    }
    const m = new THREE.Mesh(b.build(), toon({ vertexColors: true, spec: 0.1, side: THREE.DoubleSide }));
    m.castShadow = true;
    // 船局部：x 往船头、z 往右舷；凳子的「前」是 -z（他脸朝左舷）
    m.position.set(HAND_SEAT[0], BOAT.deckY, HAND_SEAT[1]);
    m.visible = false;
    boat.body.add(m);
    return [m];
  };
  parts.hand = [mkSeat()];
  const pops = [];
  return {
    // level：这一样现在几级（1 是原来就有的）；pop：刚装上，落下来一顿
    set(kind, level, pop = false) {
      const list = parts[kind];
      if (!list) return;
      list.forEach((group, i) => {
        const on = level >= i + 2;
        for (const m of group) {
          const was = m.visible;
          m.visible = on;
          if (on && !was && pop) pops.push({ m, y: m.position.y, t: 0 });
        }
      });
    },
    update(dt) {
      for (const P of pops) {
        P.t += dt;
        const u = clamp(P.t / 0.5, 0, 1);
        P.m.position.y = P.y + (1 - easeOutBack(u)) * 0.9;
        const k = 1 + Math.sin(smoothstep(0.35, 0.6, P.t) * Math.PI) * 0.08;
        P.m.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
        if (u >= 1 && P.t > 0.6) { P.m.position.y = P.y; P.m.scale.set(1, 1, 1); P.done = true; }
      }
      for (let i = pops.length - 1; i >= 0; i--) if (pops[i].done) pops.splice(i, 1);
    },
  };
}
