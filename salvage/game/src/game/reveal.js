import * as THREE from 'three';
import { WASH_NORMAL, WASH_PRECIOUS, SHOW_NORMAL, SHOW_PRECIOUS, PULLBACK_T, WASH_EMPTY, WASH_SPEEDUP } from '../config.js';
import { BOAT } from '../world/boat.js';
import { setItemMud, setItemGlint } from '../world/items.js';
import { ITEM_DEFS } from '../world/layout.js';
import { clamp, smoothstep, easeOut, easeInOut, easeOutBack, lerp, damp, wrapAngle } from '../util/math.js';
import { toon } from '../render/materials.js';
import { keepOut } from '../ui/hud.js';
import { placeOf } from './tally.js';
import { T } from './tables.js';

// 揭宝：网包落上甲板 → 船员拿水管冲 → 泥壳从上往下化开 → 物件逐件露出 → 那一刻记入收获 →
// 稳稳展示 → 拉回大视野、立刻恢复操作；船员各搬一件进舱（只是动画）。

// 网包砸下来那一拍镜头停在哪（离洗台多远、比甲板高多少）：放得低一点、平一点（约 30°），网架和网兜在网包上方、出了画面上沿，不挡往下砸的那一包
const LAND_DIST = 5.0;
const LAND_H = 3.0;
const HATCH_SLOTS = [
  { x: -0.72, z: 0, face: Math.PI },
  { x: -1.6, z: -1.02, face: -Math.PI / 2 },
  { x: -1.6, z: 1.02, face: Math.PI / 2 },
];
const TANK_SLOT = { x: 0.5, z: 1.45, face: Math.PI };
const STAGE_SLOTS = [[2.9, -1.05], [2.9, 1.05], [3.5, -0.95], [3.5, 0.95], [2.25, -1.2], [2.25, 1.2]];
// 名牌：快轮到的签提前这么久占上地方（旁边的签先让开）；刚挂上去那一摆（CSS 的 hang）多久
const LABEL_LEAD = 0.25;
const HANG_T = 0.62;
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
// 有正面的东西揭晓时正面偏开镜头方向多少（弧度）：斜着看，印面和柄都看得见
const FACE_OFF = 0.5;

// 甲板上等着搬的一件货
export class Cargo {
  constructor(rv, it, group, opts = {}) {
    this.rv = rv;
    this.it = it;
    this.g = group;
    this.crab = opts.crab || null;
    this.taken = false;
    this.done = false;
    this.slide = null;
  }
  localPos(out = new THREE.Vector3()) {
    this.g.getWorldPosition(out);
    return this.rv.g.boat.body.worldToLocal(out);
  }
  pickLocal() {
    const p = this.localPos();
    // 站在货的船尾一侧，弯腰去拿
    return { x: p.x - 0.62, z: p.z + (p.z >= 0 ? 0.12 : -0.12) };
  }
  worldPos() {
    return this.g.getWorldPosition(new THREE.Vector3());
  }
  attachTo(hold) {
    this.taken = true;
    hold.attach(this.g);
    // 搬的时候摆正一点，抱在胸前
    this.g.position.set(0, -0.05, 0);
    const e = new THREE.Euler().setFromQuaternion(this.g.quaternion, 'YXZ');
    this.g.rotation.set(e.x * 0.3, e.y, e.z * 0.3, 'YXZ');
    if (this.crab) this.crab.setMode('held');
  }
  dest() {
    if (this.crab) return TANK_SLOT;
    if (!this.slot) {
      const used = this.rv.cargo.filter((c) => c !== this && c.slot && !c.done).map((c) => c.slot);
      this.slot = HATCH_SLOTS.find((s) => !used.includes(s)) || HATCH_SLOTS[0];
    }
    return this.slot;
  }
  lower(k) {
    const body = this.rv.g.boat.body;
    if (!this.lowering) {
      this.lowering = true;
      body.attach(this.g);
      this.from = this.g.position.clone();
    }
    const top = this.crab ? new THREE.Vector3(BOAT.tank.x, BOAT.deckY + 0.75, BOAT.tank.z) : new THREE.Vector3(BOAT.hatch.x, BOAT.deckY + 0.6, BOAT.hatch.z);
    const bottom = this.crab ? new THREE.Vector3(BOAT.tank.x, BOAT.deckY + 0.08, BOAT.tank.z) : new THREE.Vector3(BOAT.hatch.x, BOAT.deckY - 0.95, BOAT.hatch.z);
    k = clamp(k, 0, 1);
    if (k < 0.45) this.g.position.lerpVectors(this.from, top, easeInOut(k / 0.45));
    else this.g.position.lerpVectors(top, bottom, easeInOut((k - 0.45) / 0.55));
  }
  finish() {
    this.done = true;
    const g = this.rv.g;
    if (this.crab) {
      // 蟹放进水槽「扑通」：溅起一点水，在槽里转一圈、吐个泡
      this.crab.setMode('tank');
      this.rv.tankCrabs.push(this.crab);
      const p = g.boat.body.localToWorld(new THREE.Vector3(BOAT.tank.x, BOAT.deckY + 0.95, BOAT.tank.z));
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.6 + Math.random() * 0.7;
        g.fx.emit('spray', p.x + Math.cos(a) * 0.15, p.y, p.z + Math.sin(a) * 0.15, Math.cos(a) * sp, 1.8 + Math.random() * 1.5, Math.sin(a) * sp);
      }
      for (let i = 0; i < 8; i++) g.fx.emit('foam', p.x + (Math.random() - 0.5) * 0.5, p.y - 0.18, p.z + (Math.random() - 0.5) * 0.5, 0, 0.1, 0, { life: 0.9 });
      const tok = this.rv.tok, cr = this.crab;
      g.later(1.4, () => {
        if (tok !== this.rv.tok) return;
        const q = cr.group.getWorldPosition(new THREE.Vector3());
        for (let i = 0; i < 4; i++) g.fx.emit('tbub', q.x + 0.05, q.y + 0.08 + i * 0.03, q.z, 0, 0.35 + i * 0.06, 0, { life: 0.9 });
      });
      g.audio.play('tank');
      g.cue('B21');
      return;
    }
    this.g.parent && this.g.parent.remove(this.g);
    g.trip.stowed++;
    // 沉进舱口「咚」，舱口扬一点灰；银币匣更沉，舱口冒一缕银光
    const p = g.boat.body.localToWorld(new THREE.Vector3(BOAT.hatch.x, BOAT.deckY + 0.15, BOAT.hatch.z));
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      g.fx.emit('dust', p.x + Math.cos(a) * 0.35, p.y, p.z + Math.sin(a) * 0.35, Math.cos(a) * 0.5, 0.35 + Math.random() * 0.3, Math.sin(a) * 0.5);
    }
    if (this.it && this.it.def.precious) {
      g.audio.play('stowHeavy');
      // 一缕银光从舱口升起：光柱 + 打着旋往上飘的银点，舱口边一亮
      const pl = this.rv.plume;
      pl.visible = true;
      pl.userData.t = 0;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = 0.18 + Math.random() * 0.2;
        g.fx.emit('shine', p.x + Math.cos(a) * r, p.y + Math.random() * 0.4, p.z + Math.sin(a) * r, -Math.sin(a) * 0.35, 1.1 + Math.random() * 0.9, Math.cos(a) * 0.35, { life: 1.5, size: 0.32 });
      }
      for (let i = 0; i < 6; i++) g.fx.emit('glint', p.x + (Math.random() - 0.5) * 0.5, p.y + 0.3 + Math.random() * 1.2, p.z + (Math.random() - 0.5) * 0.5, 0, 0.6, 0, { life: 0.7 + Math.random() * 0.5 });
      g.later(0.15, () => this.rv.glintLine(p.clone().setY(p.y + 0.25), 0.9, 7));
      g.cue('C09');
    } else {
      g.audio.play('stow');
    }
    g.cue('B20', 0.3);
  }
}

export class Reveal {
  constructor(g) {
    this.g = g;
    // 在甲板上哪儿揭（船局部）：一网一揭在前甲板正中的洗台；一甲板一起冲的压轴那一包在它自己的位子上揭
    this.at = new THREE.Vector3(BOAT.wash.x, BOAT.deckY, BOAT.wash.z);
    this.cur = null;
    this.cargo = [];
    this.tankCrabs = [];
    this.deck = new THREE.Group();
    this.deck.name = 'deckcargo';
    g.boat.body.add(this.deck);
    this.rays = buildRays();
    g.world.scene.add(this.rays);
    // 银币匣入舱：舱口冒一缕银光
    this.plume = buildPlume();
    this.plume.position.set(BOAT.hatch.x, BOAT.deckY + 0.02, BOAT.hatch.z);
    g.boat.body.add(this.plume);
    this.puddle = buildPuddle();
    g.boat.body.add(this.puddle.mesh);
    this.jet = buildJet();
    g.world.scene.add(this.jet.mesh);
    // 揭晓时打在东西上的一束暖光（甲板上一圈亮 + 从上往下一道光），背景压暗时东西还亮着
    this.spot = buildSpot();
    this.spot.group.position.set(this.at.x, BOAT.deckY + 0.01, this.at.z);
    g.boat.body.add(this.spot.group);
    this.phi = 0.9;
    this.labels = [];
  }

  // 换揭宝的地方（船局部 x, z）：泥水、那一束光跟过去
  setAt(x, z) {
    this.at.set(x, BOAT.deckY, z);
    this.spot.group.position.set(x, BOAT.deckY + 0.01, z);
    this.puddle.mesh.position.set(x - 0.2, BOAT.deckY + 0.012, z);
  }

  get active() {
    return !!this.cur;
  }

  // 冲洗和展示期间不接受操作；拉回大视野一开始就交还
  get locked() {
    return !!this.cur && this.cur.phase !== 'pull';
  }

  reset() {
    this.tok = (this.tok || 0) + 1;
    this.setAt(BOAT.wash.x, BOAT.wash.z);
    for (const c of this.cargo) c.g.parent && c.g.parent.remove(c.g);
    for (const c of this.tankCrabs) c.group.parent && c.group.parent.remove(c.group);
    this.cargo = [];
    this.tankCrabs = [];
    if (this.cur) {
      this.cur.bundle.group.parent && this.cur.bundle.group.parent.remove(this.cur.bundle.group);
      this.cur = null;
    }
    this.rays.visible = false;
    this.plume.visible = false;
    this.jet.mesh.visible = false;
    this.puddle.set(0, 0);
    this.spot.set(0, true);
    if (this.husk) { this.husk.group.parent && this.husk.group.parent.remove(this.husk.group); this.husk = null; }
    this.approached = null;
    this.lookFrom = null;
    this.clearLabels();
  }

  // 一甲板一起冲揭出来的一件：留在甲板上等人搬（和一网一揭揭出来的同一种货）
  addCargo(it) {
    this.deck.attach(it.model.group);
    it.state = 'deck';
    const cg = new Cargo(this, it, it.model.group);
    this.cargo.push(cg);
    return cg;
  }

  addCrabCargo(crab) {
    this.deck.attach(crab.group);
    crab.setMode('deck');
    crab.threat = 1.5;
    const cg = new Cargo(this, null, crab.group, { crab });
    this.cargo.push(cg);
    return cg;
  }

  washSpotWorld(out = new THREE.Vector3()) {
    return this.g.boat.body.localToWorld(out.set(this.at.x, BOAT.deckY, this.at.z));
  }

  // 上一网还没搬走的货：网包一吊到甲板上方，就往两边滑开，给它腾地方；离得最近的人顺手扶一下
  clearSpot() {
    const g = this.g;
    let si = 0;
    const used = this.cargo.filter((c) => !c.taken && !c.done).map((c) => c.localPos());
    for (const c of this.cargo) {
      if (c.taken || c.done || c.slide) continue;
      const p = c.localPos();
      if (Math.hypot(p.x - this.at.x, p.z - this.at.z) >= 1.6) continue;
      // 挑一个离这件近、又没别的货占着的位置
      const free = STAGE_SLOTS.filter((s) => !used.some((u) => Math.hypot(u.x - s[0], u.z - s[1]) < 0.5));
      const s = (free.length ? free : STAGE_SLOTS).slice().sort((a, b) => Math.hypot(a[0] - p.x, a[1] - p.z) - Math.hypot(b[0] - p.x, b[1] - p.z))[0];
      used.push(new THREE.Vector3(s[0], 0, s[1]));
      this.deck.attach(c.g);
      c.slide = { from: c.g.position.clone(), to: new THREE.Vector3(s[0], c.g.position.y, s[1]), t: -0.1 - si * 0.09, rz: (p.z < 0 ? 1 : -1), rx0: c.g.rotation.x };
      si++;
    }
    if (si) {
      g.audio.play('slide', { at: 0.1 });
      g.cue('B22');
      const s = g.crew.sailors.filter((x) => !x.task || x.task.kind !== 'carry').sort((a, b) => Math.hypot(a.x - this.at.x, a.z - this.at.z) - Math.hypot(b.x - this.at.x, b.z - this.at.z))[0];
      if (s) s.gesture('steady', { delay: 0.05, tx: this.at.x, tz: this.at.z });
    }
    return si;
  }

  // 网包吊到甲板上方（netop 的 set 一开始）：镜头这时就往冲洗近景推（B11），推到的时候网包正好砸下去
  approach(bundle) {
    const g = this.g;
    const phi = this.planPhi ?? this.choosePhi();
    this.planPhi = phi;
    this.phi = phi;
    this.phiDir = phi > 0 ? 1 : -1;
    // 先停在看得见网包砸下来的地方：低一点、侧一点（约 45°），网兜在画面上沿、网包从里面掉出来、砸扁、溅开一圈都看得见；
    // 砸完再接着推到冲洗近景（从高处斜着往下看，约 60°）。空网不凑那么近：退半步的中景
    const empty = bundle.empty;
    this.setWashView(empty);
    this.closeDist = empty ? 4.4 : LAND_DIST;
    this.closeH = empty ? 7.4 : LAND_H;
    this.cd = this.closeDist;
    this.ch = this.closeH;
    this.camSpring = null;
    this.lookAt = this.lookLast = null;
    this.lookK = 0;
    g.cam.alt.fov = 30;
    this.updateCloseUp(0);
    // 推近：起止都缓，比以前慢一点（重网包再慢半拍）；还要绕着转的角度大就再慢一点（每弧度多 0.45 秒）
    g.cam.blendTo(1, (bundle.heavy ? 1.3 : empty ? 0.9 : 1.1) + this.turnLeft() * 0.45);
    g.cue('B11');
    this.approached = bundle;
  }

  // 推近要绕着转多少（弧度）：大视野镜头的方向和近景的方向差多少
  turnLeft() {
    const A = this.g.cam.alt;
    return Math.abs(wrapAngle(Math.atan2(A.pos.x - A.look.x, A.pos.z - A.look.z) - this.g.cam.yaw));
  }

  // 冲洗近景的远近、高低：从高处斜着往下看网包（约 60°），围在两边的船员只在画面边上
  setWashView(empty) {
    this.washDist = empty ? 4.4 : 3.0;
    this.washH = empty ? 7.4 : 5.8;
  }

  // 近景镜头最后停在哪（世界坐标）：排冲洗时按这个位置看网包
  closeCam(out = new THREE.Vector3()) {
    return this.g.boat.root.localToWorld(out.set(this.at.x + Math.cos(this.phi) * this.closeDist, BOAT.deckY + this.closeH, this.at.z + Math.sin(this.phi) * this.closeDist));
  }

  // o.placed：这一包已经在甲板上了（一甲板一起冲的压轴），不砸，直接冲
  begin(bundle, ev, crab, o = {}) {
    const g = this.g;
    this.phiTo = null;
    // 网包从网里移到甲板上（保持世界位置）：松闸，整包砸下去
    this.deck.attach(bundle.group);
    const from = bundle.group.position.clone();
    const fromQ = bundle.group.quaternion.clone();
    // 没来得及在网包吊进来时让开的（一般已经让开了）
    this.clearSpot();
    const precious = bundle.precious;
    const empty = bundle.empty;
    const T = empty ? WASH_EMPTY : precious ? WASH_PRECIOUS : WASH_NORMAL;
    this.cur = { bundle, ev, crab, phase: 'land', t: 0, w: 0, T, from, fromQ, vy: 0, precious, empty, heavy: bundle.heavy, revealed: false, peeked: false, showT: precious ? SHOW_PRECIOUS : SHOW_NORMAL, sprayT: 0, splatT: 0, pushed: this.approached === bundle || !!o.placed, finale: !!o.finale, crowd: !!o.crowd, self: !!o.self };
    if (o.placed) { this.cur.thud = true; this.cur.thudAt = -0.5; }
    else g.audio.play('release', { heavy: bundle.heavy });
    // 第一只活物在甲板上接着挣：猛顶一下，泥壳那边甩出几块泥、网里一声
    if (bundle.loud) {
      bundle.onJab = (a) => {
        if (!this.cur || this.cur.bundle !== bundle || !this.cur.thud) return;
        const q = bundle.group.getWorldPosition(new THREE.Vector3());
        const d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(bundle.group.getWorldQuaternion(_q));
        const spot = this.washSpotWorld();
        const R = bundle.R;
        g.audio.play('crabNet');
        for (let i = 0; i < 5; i++) {
          g.fx.emit('chunk', q.x + d.x * R * 0.8, q.y + R * (0.5 + Math.random() * 0.4), q.z + d.z * R * 0.8,
            d.x * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.8, 1.4 + Math.random() * 1.2, d.z * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.8,
            { floorY: spot.y + 0.02, size: 0.09 + Math.random() * 0.09 });
        }
      };
    }
    g.crew.setMode('wash');
    if (this.approached !== bundle) {
      // 没经过吊到甲板上方那一步（效果页直接摆到这儿）：这时再定近景
      const phi = this.planPhi ?? this.choosePhi();
      this.phi = phi;
      this.phiDir = phi > 0 ? 1 : -1;
      this.setWashView(empty);
      this.closeDist = this.washDist;
      this.closeH = this.washH;
      this.cd = this.closeDist;
      this.ch = this.closeH;
      this.camSpring = null;
      this.lookAt = this.lookLast = null;
      this.lookK = 0;
      g.cam.alt.fov = 30;
    }
    this.approached = null;
    const phi = this.phi;
    this.planPhi = null;
    // 有「正面」的东西（铜印的印面）：还裹在泥里的时候就转一下，让正面斜对着近景镜头（壳崩开时一眼看见红蜡印面和铜柄）
    for (const it of bundle.items || []) {
      const F = it.model && it.model.info.face;
      if (!F) continue;
      // 镜头展示时大约在洗台往 phi 方向两米多：按东西自己到那儿的方向转
      const gp = it.model.group.position;
      const to = Math.atan2(Math.sin(phi) * 2.2 - gp.z, Math.cos(phi) * 2.2 - gp.x);
      const gq = it.model.group.quaternion;
      const f = _v.set(F[0], F[1], F[2]).applyQuaternion(gq);
      _q.setFromAxisAngle(_up, Math.atan2(f.z, f.x) - (to + FACE_OFF));
      gq.premultiply(_q);
    }
    // 一甲板一起冲的压轴：乙是全船的人围着冲（水管由那一套管），丙没人冲、它自己裂开；别的照旧一个人拿水管
    if (!g.crew.washer && !o.crowd && !o.self) g.crew.startWash({ x: this.at.x, z: this.at.z }, phi);
    this.updateCloseUp(0);
    this.puddle.set(0, 0);
    if (bundle.heavy) g.events.emit('heavyLanded', { precious });
  }

  // 一甲板一起冲的压轴：这一包在甲板上它自己的位子（船局部 x, z）上，直接从冲洗开始。
  // from：镜头这会儿（看整个甲板的那个机位）相对这一包在哪（d 水平远近、h 高、phi 方向、look 看的那一点，都是船局部），近景从那儿慢慢推过去，不跳
  // o.crowd：几个人围着一起冲（水管和水由一甲板一起冲那一套画）；o.self：没人冲，泥壳自己一块块裂开掉下来
  beginAt(bundle, x, z, from, o = {}) {
    this.setAt(x, z);
    // 近景方向照一网一揭的规矩（不从船尾隔着吊机、人看），再避开同一包里别的东西挡在镜头和压轴之间；
    // 镜头在推近的路上顺势绕过去（从看整个甲板的方向转到近景方向），不跳
    const target = this.finalePhi(bundle, from ? from.phi : this.choosePhi());
    this.planPhi = target;
    this.begin(bundle, null, null, { placed: true, finale: true, crowd: o.crowd, self: o.self });
    if (from) {
      this.cd = from.d;
      this.ch = from.h;
      this.camSpring = null;
      this.lookFrom = from.look.clone();
      this.lookFromK = 1;
      this.phi = from.phi;
      this.phiTo = target;
      this.phiV = 0;
      this.phiDir = target > 0 ? 1 : -1;
    }
  }

  // 压轴近景的方向：先照 choosePhi 的限制，再让伴随物不在镜头前面（离镜头方向至少 110°），挑离原方向最近的那一个
  finalePhi(bundle, phi0) {
    const lim = (p) => {
      p = clamp(wrapAngle(p), -1.75, 1.75);
      if (Math.abs(p) < 0.45) p = 0.45 * (p < 0 ? -1 : 1);
      return p;
    };
    const root = this.g.boat.root;
    const items = (bundle.items || []).filter((i) => i.model);
    const main = items.find((i) => i.def && i.def.precious) || items[0];
    const dirs = [];
    if (main) {
      const mp = root.worldToLocal(main.model.group.getWorldPosition(new THREE.Vector3()));
      for (const it of items) {
        if (it === main) continue;
        const p = root.worldToLocal(it.model.group.getWorldPosition(new THREE.Vector3()));
        if (Math.hypot(p.x - mp.x, p.z - mp.z) > 0.05) dirs.push(Math.atan2(p.z - mp.z, p.x - mp.x));
      }
    }
    const blocked = (p) => dirs.some((d) => Math.abs(wrapAngle(d - p)) < 1.9);
    const start = lim(phi0);
    if (!blocked(start)) return start;
    let best = start, bestD = Infinity;
    for (let k = -1.75; k <= 1.75 + 1e-6; k += 0.05) {
      if (Math.abs(k) < 0.45 || blocked(k)) continue;
      const d = Math.abs(wrapAngle(k - phi0));
      if (d < bestD) { bestD = d; best = k; }
    }
    return best;
  }

  // 近景方向：沿用当前的观察方向，只是别从船尾隔着吊机看
  choosePhi() {
    const g = this.g;
    const cl = g.boat.root.worldToLocal(g.cam.cam.position.clone());
    let phi = Math.atan2(cl.z - this.at.z, cl.x - this.at.x);
    phi = clamp(phi, -1.75, 1.75);
    if (Math.abs(phi) < 0.45) phi = 0.45 * (phi < 0 ? -1 : 1);
    return phi;
  }

  // 网出水时就定下近景方向，让拿水管的人提前站好位
  plan() {
    this.planPhi = this.choosePhi();
    return this.planPhi;
  }

  updateCloseUp(dt) {
    const g = this.g;
    const c = this.cur;
    const root = g.boat.root;
    // 推近时平滑地推，不跳：远近、高低各用一个临界阻尼的弹簧跟（起步是缓的，不在砸下去那一刻猛地一推）
    const S = this.camSpring || (this.camSpring = { vd: 0, vh: 0, vk: 0 });
    const W = 4.6;
    S.vd += (W * W * (this.closeDist - this.cd) - 2 * W * S.vd) * dt;
    this.cd += S.vd * dt;
    S.vh += (W * W * (this.closeH - this.ch) - 2 * W * S.vh) * dt;
    this.ch += S.vh * dt;
    // 压轴：镜头方向从看整个甲板的方向绕到近景方向（和远近、高低一样的弹簧）
    if (this.phiTo != null) {
      const e = wrapAngle(this.phiTo - this.phi);
      this.phiV += (3.4 * 3.4 * e - 2 * 3.4 * this.phiV) * dt;
      this.phi += this.phiV * dt;
      if (Math.abs(e) < 0.004 && Math.abs(this.phiV) < 0.01) { this.phi = this.phiTo; this.phiTo = null; }
    }
    const d = this.cd, h = this.ch;
    const local = new THREE.Vector3(this.at.x + Math.cos(this.phi) * d, BOAT.deckY + h, this.at.z + Math.sin(this.phi) * d);
    const look = new THREE.Vector3(this.at.x, BOAT.deckY + 0.42, this.at.z);
    // 揭晓：镜头往主物那边凑（lookAt 是船局部的一点）
    this.lookK = this.lookK || 0;
    S.vk += (5.5 * 5.5 * ((this.lookAt ? 1 : 0) - this.lookK) - 2 * 5.5 * S.vk) * dt;
    this.lookK = clamp(this.lookK + S.vk * dt, 0, 1.05);
    // 不凑了（拉回时 lookAt 清掉）：从刚才凑的那一点慢慢退回来，不一下跳回甲板中间
    if (this.lookAt) this.lookLast = this.lookAt;
    const L = this.lookAt || this.lookLast;
    if (L && this.lookK > 0.001) look.lerp(L, this.lookK * 0.7);
    // 第一次兜到蟹：揭晓那一下镜头在蟹身上停半拍
    if (c && c.lookCrab > 0 && c.bundle.crab) {
      const cp = root.worldToLocal(c.bundle.crab.group.getWorldPosition(new THREE.Vector3()));
      const k = Math.sin(clamp(c.lookCrab / 0.9, 0, 1) * Math.PI);
      look.lerp(cp, 0.75 * k);
    }
    // 从别的机位推过来（一甲板一起冲的压轴）：看的那一点从原来那儿慢慢挪到这一包上
    if (this.lookFrom) {
      this.lookFromK = Math.max(0, this.lookFromK - dt / 1.1);
      const k = this.lookFromK * this.lookFromK * (3 - 2 * this.lookFromK);
      look.lerp(this.lookFrom, k);
      if (this.lookFromK <= 0) this.lookFrom = null;
    }
    g.cam.alt.pos.copy(root.localToWorld(local));
    g.cam.alt.look.copy(root.localToWorld(look));
  }

  update(dt, t, aHeld, aPressed) {
    const g = this.g;
    // 甲板上的货：被挤开的滑一下；网包砸下来时跳一下；水槽里的蟹活动
    for (const c of this.cargo) {
      if (c.slide) {
        // 推开：先一顿，再滑出去，压着甲板晃一下才停
        const S = c.slide;
        S.t += dt / 0.5;
        const k = clamp(S.t, 0, 1);
        c.g.position.lerpVectors(S.from, S.to, easeOut(k));
        c.g.position.y = S.from.y + Math.sin(k * Math.PI) * 0.03;
        c.g.rotation.x = S.rx0 + S.rz * Math.sin(k * Math.PI) * 0.12 * (1 - k * 0.6);
        if (S.t >= 1) { c.g.rotation.x = S.rx0; c.slide = null; }
      }
      if (c.hop && !c.taken) {
        // 甲板一震：旁边的货往上一跳、歪一下再落回去
        const H = c.hop;
        H.t += dt;
        const u = clamp(H.t / 0.34, 0, 1);
        c.g.position.y = H.y0 + Math.sin(u * Math.PI) * H.a;
        c.g.rotation.z = H.rz0 + Math.sin(u * Math.PI) * H.r;
        if (u >= 1) { c.g.position.y = H.y0; c.g.rotation.z = H.rz0; c.hop = null; }
      }
      if (c.crab && !c.done) c.crab.update(dt, t);
    }
    for (const cr of this.tankCrabs) cr.update(dt, t);
    this.cargo = this.cargo.filter((c) => !c.done || c.crab);
    this.updateLabels(dt);
    this.updateRays(dt, t);
    this.updatePlume(dt);
    this.puddle.update(dt);
    this.spot.update(dt);
    this.jet.mesh.visible = false; // 冲洗那几秒里由 washVisuals 打开
    // 揭晓时崩飞的泥壳：飞出去、摔在甲板上化掉，化完了再把空壳拿走
    if (this.husk) {
      const H = this.husk;
      H.t += dt;
      H.b.washPlates(1, dt, (p, wp, landed) => { if (landed) this.onPlate(p, wp, true); });
      if (H.t > 1.8 || H.b.plates.every((p) => p.state === 'gone')) { H.group.parent && H.group.parent.remove(H.group); this.husk = null; }
    }

    const c = this.cur;
    if (!c) { if (this.approached) this.updateCloseUp(dt); return; }
    c.t += dt;
    const b = c.bundle;
    b.update(dt, t);
    if (c.lookCrab > 0) c.lookCrab -= dt;
    this.updateCloseUp(dt);

    if (c.phase === 'land') {
      // 没经过「吊到甲板上方」的（效果页直接从这儿开始）：这时再往近景推
      if (!c.pushed) {
        c.pushed = true;
        g.cam.blendTo(1, (c.heavy ? 1.3 : c.empty ? 0.9 : 1.05) + this.turnLeft() * 0.45);
        g.cue('B11');
      }
      const to = new THREE.Vector3(this.at.x, BOAT.deckY, this.at.z);
      if (!c.thud) {
        // 松了闸：整包自己往下掉（比重力还急一点），掉的时候摆正、对准洗台
        c.vy -= 14 * dt;
        const y = b.group.position.y + c.vy * dt;
        const k = clamp((c.from.y - y) / Math.max(0.05, c.from.y - to.y), 0, 1);
        b.group.position.set(lerp(c.from.x, to.x, easeOut(k)), Math.max(to.y, y), lerp(c.from.z, to.z, easeOut(k)));
        _q.identity();
        b.group.quaternion.slerpQuaternions(c.fromQ, _q, easeOut(k));
        // 下落时网包往竖里抻一点
        const st = Math.min(0.08, -c.vy * 0.018);
        b.group.scale.set(1 - st * 0.4, 1 + st, 1 - st * 0.4);
        if (y <= to.y) { b.group.position.copy(to); b.group.quaternion.identity(); this.thud(); }
        return;
      }
      // 砸扁：最扁的那一下顿两帧，再弹回来、回弹一下停住
      const u = c.t - c.thudAt;
      const S = c.heavy ? 0.3 : 0.22;
      const sq = u < 0.05 ? S : S * Math.cos((u - 0.05) * 15) * Math.exp(-(u - 0.05) * 7.5);
      b.group.scale.set(1 + sq * 0.55, 1 - sq, 1 + sq * 0.55);
      // 砸完：镜头接着推到冲洗近景
      if (u >= 0.18 && this.closeDist !== this.washDist) { this.closeDist = this.washDist; this.closeH = this.washH; }
      if (u >= 0.5) {
        b.group.scale.set(1, 1, 1);
        c.phase = 'wash';
        c.t = 0;
        // 按近景镜头看过去，排好泥壳哪块先崩、哪块最后崩（崩到看得清是什么就揭晓）
        const to = c.empty ? 0.6 : c.precious ? 0.86 : 0.82;
        b.schedule(this.closeCam(), 0.04, to);
        c.exp0 = b.exposure();
        // 拍子少就冲得短：两拍之间不超过 0.7 秒（一直有新的一角露出来，不干等）
        const nb = b.beats ? b.beats.length : 6;
        if (nb > 1) c.T = Math.min(c.T, Math.max(c.empty ? 1.6 : c.precious ? 3.4 : 2.2, (0.7 * (nb - 1)) / (to - 0.04)));
        if (!c.self) g.audio.loop('hose', true);
      }
      return;
    }

    if (c.phase === 'wash') {
      const speed = aHeld ? WASH_SPEEDUP : 1;
      if (aHeld && !c.fast) g.cue('B13', 1.5);
      c.fast = aHeld;
      c.w = Math.min(1, c.w + (dt / c.T) * speed);
      const w = c.w;
      if (w > 0.02 && !c.cued) { c.cued = true; g.cue('B12'); }
      this.washVisuals(dt, w, speed);
      // 露头：匣子顶上那一角先露出来——铁箍一角和一线银光，不出名字
      if (c.precious && !c.peeked && ((b.peekAt != null && w >= b.peekAt + 0.02) || (b.peekAt == null && w > 0.4))) this.peek();
      if (c.peekT != null) this.peekSweep(dt);
      // 看得清是什么了（排好的最后一块崩开了）：马上揭晓，剩下的壳和泥一下崩飞，不等冲干净
      const lp = b.lastPlate;
      if ((lp && lp.state !== 'on' && lp.t >= 0.08) || w >= 1) this.onRevealed();
      return;
    }

    if (c.phase === 'show') {
      // 展开：稳定的观看时间，镜头慢慢绕一点
      this.phi += dt * 0.11 * this.phiDir;
      if (Math.abs(this.phi) > 2.0) this.phiDir *= -1;
      this.revealFx(c.t, dt);
      if (c.precious) this.confirmFx(c.t, dt);
      if (!c.empty && c.t > 0.5 && !c.cued17) { c.cued17 = true; g.cue('B17'); }
      const minShow = c.precious ? 2.0 : c.empty ? 0.5 : 1.4;
      if (aPressed && c.t > minShow) c.t = Math.max(c.t, c.showT - 0.25);
      if (c.t >= c.showT) this.startPull();
      return;
    }

    if (c.phase === 'pull') {
      this.revealFx(c.t + c.showT, dt);
      if (c.precious) this.confirmFx(c.t + c.showT, dt);
      if (c.t >= PULLBACK_T) {
        this.cur = null;
        g.ui.bigTitle(null);
        const pc = g.pipe.compositeUniforms;
        pc.uDim.value = 0;
        pc.uFocus.value.z = 0;
      }
    }
  }

  // 网包砸上甲板那一下：画面一顿、船身一沉、甲板上的东西一跳、泥水一圈、旁边的人往后缩
  thud() {
    const c = this.cur;
    c.thud = true;
    c.thudAt = c.t;
    this.slam(c.bundle, { heavy: c.heavy, empty: c.empty, x: this.at.x, z: this.at.z, puddle: true });
  }

  // 一包泥砸到甲板上（船局部 o.x, o.z）的那一下：一网一揭砸在洗台上、甲板码包砸在自己的位子上，都是这一下
  slam(b, o) {
    const g = this.g;
    const c = { heavy: !!o.heavy, empty: !!o.empty };
    const lx = o.x, lz = o.z;
    const spot = g.boat.body.localToWorld(new THREE.Vector3(lx, BOAT.deckY, lz));
    const n = b.items.length + (b.crab ? 1 : 0);
    // 兜得越多、网包越大越沉
    const mass = c.empty ? 0.45 : clamp(0.55 + n * 0.12 + b.R * 0.35, 0.6, 1.25);
    const wk = g.wobbleK;
    // 砸上去那一下画面顿一顿（重的顿得久）
    g.hit(c.heavy ? 0.12 : c.empty ? 0.04 : 0.07);
    if (c.heavy) {
      // 预兆：整条船一沉、甲板一震，旁边的人退半步
      g.audio.play('heavyLand');
      g.cam.thump(0.2 * wk);
      g.cam.shake(0.07 * wk);
      g.boatCtl.kick(0.36);
      // 船身往下一沉，两舷挤出一圈白沫，水面荡开一圈
      const bc = g.boatCtl;
      g.ripple(bc.pos.x, bc.pos.z, 4.2, 1);
      const f = bc.forward, sd = new THREE.Vector3(-f.z, 0, f.x);
      for (let i = 0; i < 28; i++) {
        const u = (Math.random() - 0.5) * 9, side = i % 2 ? 1 : -1;
        const px = bc.pos.x + f.x * u + sd.x * side * 2.0, pz = bc.pos.z + f.z * u + sd.z * side * 2.0;
        g.fx.emit('foam', px, 0.05, pz, sd.x * side * 1.4, 0, sd.z * side * 1.4, { life: 2.0, size: 0.3 });
        if (i % 3 === 0) g.fx.emit('spray', px, 0.2, pz, sd.x * side * 1.2, 1.6 + Math.random(), sd.z * side * 1.2);
      }
      g.crew.flinch(lx, lz, 1);
      for (const s of g.crew.sailors) {
        const dx = s.x - lx, dz = s.z - lz, d = Math.hypot(dx, dz);
        if (d < 3.2 && (!s.task || s.task.kind !== 'carry')) s.gesture('back', { dx: (dx / (d || 1)) * 0.72, dz: (dz / (d || 1)) * 0.72, delay: 0.05 });
      }
      g.cue('C05');
    } else {
      // 每一网都砸得出分量：「咚」一声闷响带湿泥的「啪」，画面一顿、船身一沉，旁边的人往后缩
      g.audio.play('land', { gain: c.empty ? 0.65 : 0.8 + mass * 0.25, mass });
      g.cam.thump((0.07 + 0.06 * mass) * wk);
      g.cam.shake((0.018 + 0.02 * mass) * wk);
      g.boatCtl.kick(0.1 + 0.09 * mass);
      g.ripple(g.boatCtl.pos.x, g.boatCtl.pos.z, 3.6, 0.45 * mass);
      g.crew.flinch(lx, lz, c.empty ? 0.45 : 0.75);
      g.cue('B10');
    }
    // 甲板上还没搬走的货跟着一跳
    for (const cg of this.cargo) {
      if (cg.taken || cg.done || cg.crab) continue;
      cg.hop = { t: -0.02, y0: cg.g.position.y, rz0: cg.g.rotation.z, a: (c.heavy ? 0.09 : 0.035 + 0.025 * mass) * (0.8 + Math.random() * 0.4), r: (Math.random() - 0.5) * (c.heavy ? 0.22 : 0.12) };
    }
    // 甲板上码着的泥包也跟着一跳
    if (g.deck) g.deck.hopAll(b, c.heavy, mass);
    // 湿泥贴着甲板溅开一圈，水花一圈往外冲，顶上甩下几块泥
    const k = c.heavy ? 1.5 : mass;
    const nm = Math.round(16 + 14 * k);
    for (let i = 0; i < nm; i++) {
      const a = (i / nm) * Math.PI * 2 + Math.random() * 0.3;
      const sp = 1.6 + Math.random() * 2.0 * k;
      g.fx.emit('mudsplat', spot.x + Math.cos(a) * b.R * 0.85, spot.y + 0.08, spot.z + Math.sin(a) * b.R * 0.85, Math.cos(a) * sp, 0.9 + Math.random() * 1.4, Math.sin(a) * sp, { floorY: spot.y + 0.02, size: 0.06 + Math.random() * 0.08 });
    }
    const ns = Math.round(10 + 10 * k);
    for (let i = 0; i < ns; i++) {
      const a = (i / ns) * Math.PI * 2 + Math.random() * 0.4;
      g.fx.emit('splash', spot.x + Math.cos(a) * b.R * 1.02, spot.y + 0.06, spot.z + Math.sin(a) * b.R * 1.02, Math.cos(a) * (2.2 + Math.random() * 1.4), 0.7 + Math.random() * 0.9, Math.sin(a) * (2.2 + Math.random() * 1.4), { size: 0.1 + Math.random() * 0.06, life: 0.6 });
    }
    for (let i = 0; i < Math.round(3 + 3 * k); i++) {
      const a = Math.random() * Math.PI * 2;
      g.fx.emit('chunk', spot.x + Math.cos(a) * b.R * 0.5, spot.y + b.R * 1.1, spot.z + Math.sin(a) * b.R * 0.5, Math.cos(a) * (1.2 + Math.random()), 1.6 + Math.random() * 1.2, Math.sin(a) * (1.2 + Math.random()), { floorY: spot.y + 0.02, size: 0.1 + Math.random() * 0.1 });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fx.emit('dust', spot.x + Math.cos(a) * b.R, spot.y + 0.1, spot.z + Math.sin(a) * b.R, Math.cos(a) * 1.4, 0.25, Math.sin(a) * 1.4, { color: [0.5, 0.44, 0.34] });
    }
    if (o.puddle) this.puddle.set(b.R + 0.35, 0.6);
  }

  // 泥壳的一块崩下来（landed：摔到甲板上）
  onPlate(p, wp, landed) {
    const g = this.g;
    const spot = this.washSpotWorld();
    if (!landed && p.burst) return;
    if (!landed) {
      g.audio.play('mudChunk', { gain: 0.55 + Math.random() * 0.55 });
      this.hint(p);
      for (let i = 0; i < 4; i++) g.fx.emit('chunk', wp.x + (Math.random() - 0.5) * 0.15, wp.y, wp.z + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 1.2, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2, { floorY: spot.y + 0.02, size: 0.12 + Math.random() * 0.12 });
    } else {
      // 摔在甲板上碎成几块
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.5 + Math.random() * 1.2;
        g.fx.emit(i < 4 ? 'chunk' : 'mudsplat', wp.x, spot.y + 0.08, wp.z, Math.cos(a) * sp, 0.6 + Math.random() * 0.9, Math.sin(a) * sp, { floorY: spot.y + 0.02, size: i < 4 ? 0.1 + Math.random() * 0.1 : 0.05 + Math.random() * 0.05 });
      }
    }
  }

  // 崩下来的这一块后面露出了什么：那一角上亮一下——金属一线反光，陶、木头湿湿地一闪（不出名字）
  hint(p) {
    const c = this.cur;
    const b = c && c.bundle;
    if (!b || !b.expPts) return;
    const by = new Map();
    for (const P of b.expPts) {
      if (!P.by.includes(p) || !P.by.every((q) => q === p || q.state !== 'on')) continue;
      (by.get(P.ti) || by.set(P.ti, []).get(P.ti)).push(P.p);
    }
    const things = b.items;
    for (const [ti, list] of by) {
      if (list.length < 2) continue;
      const it = things[ti];
      const cen = list.reduce((a, q) => a.add(q), new THREE.Vector3()).divideScalar(list.length);
      cen.y += 0.03;
      const metal = it && it.model.mats.some((m) => m.uniforms.uGlint);
      if (metal) this.glintLine(cen, 0.2, 5);
      else for (let i = 0; i < 2; i++) this.g.fx.emit('glint', cen.x + (Math.random() - 0.5) * 0.12, cen.y, cen.z + (Math.random() - 0.5) * 0.12, 0, 0.05, 0, { life: 0.3, size: 0.07 });
      c.hints = (c.hints || 0) + 1;
    }
  }

  washVisuals(dt, w, speed) {
    const g = this.g;
    const c = this.cur;
    const b = c.bundle;
    const crew = g.crew;
    // 泥壳一整段都在崩：先崩背面、边上挡得少的，再一块块崩挡着东西的（bundle.schedule 排好的），
    // 每崩一块就多露出一角——局部的轮廓、一线金属、陶罐的弧面；网绳一根根松开
    const shellW = w;
    const next = b.washPlates(w, dt, (p, wp, landed) => this.onPlate(p, wp, landed));
    b.setDebris(smoothstep(0.04, 0.5, w));
    // 东西身上一直糊着泥（看得出轮廓、看不清是什么），揭晓那一下才和剩下的壳一起崩掉
    const mud = 1;
    // 泥鼓起来的那层只在壳里时有：露出来以后鼓包会把面和面撑出缝
    const infl = 0.045 * (1 - smoothstep(0.0, 0.12, w));
    const bias = 0.3 * smoothstep(0.3, 0.8, w);
    const noz = crew.nozzle();
    const spot = this.washSpotWorld();
    for (const it of b.items) {
      setItemMud(it.model, mud, infl);
      // 正对水管的一面先干净；珍贵物的顶角更早露出
      const gp = it.model.group.getWorldPosition(new THREE.Vector3());
      const toHose = noz ? noz.world.clone().sub(gp).normalize() : new THREE.Vector3(0, 1, 0);
      toHose.y += it.def.precious ? 1.4 : 0.5;
      toHose.normalize();
      it.model.group.getWorldQuaternion(_q).invert();
      toHose.applyQuaternion(_q);
      for (const m of it.model.mats) {
        if (!m.uniforms.uWashDir) continue;
        m.uniforms.uWashDir.value.copy(toHose);
        m.uniforms.uWashBias.value = it.def.precious && w < 0.4 ? 0.45 * smoothstep(0.1, 0.36, w) : bias;
      }
    }
    // 水管喷水：外壳阶段打在下一块要崩的泥上，之后打在东西身上
    if (noz) {
      const target = spot.clone();
      if (next) {
        next.pivot.getWorldPosition(target);
      } else target.y += 0.35 + (1 - w) * b.R * 0.4;
      c.aim = c.aim ? c.aim.lerp(target, Math.min(1, dt * 7)) : target.clone();
      const aim = c.aim;
      c.sprayT += dt * 70 * Math.min(1.6, speed);
      while (c.sprayT > 1) {
        c.sprayT -= 1;
        const sp = 7.5 + Math.random() * 2;
        const dir = aim.clone().sub(noz.world);
        const dist = dir.length();
        dir.normalize();
        const tt = dist / sp;
        g.fx.emit('spray', noz.world.x, noz.world.y, noz.world.z,
          dir.x * sp + (Math.random() - 0.5) * 0.6, dir.y * sp + 9.8 * tt * 0.5 + (Math.random() - 0.5) * 0.4, dir.z * sp + (Math.random() - 0.5) * 0.6,
          { life: tt * 1.05, size: (0.035 + Math.random() * 0.02) * (speed > 1 ? 1.4 : 1) });
      }
      this.jet.set(noz.world, aim, dt, Math.min(1.6, speed), speed > 1 ? 1.7 : 1);
      // 打在泥上溅起泥点和水花：厚泥时多是泥，冲到硬面上多是水
      const muddy = 1 - 0.55 * smoothstep(0.45, 0.85, w);
      c.splatT += dt * 26 * Math.min(1.6, speed) * (0.35 + (1 - w));
      while (c.splatT > 1) {
        c.splatT -= 1;
        const a = Math.random() * Math.PI * 2;
        const brown = Math.random() < 0.75 * muddy + 0.1;
        g.fx.emit(brown ? 'mudsplat' : 'spray', aim.x + Math.cos(a) * 0.12, aim.y - Math.random() * 0.1, aim.z + Math.sin(a) * 0.12,
          Math.cos(a) * (1.2 + Math.random() * 1.6), 1.2 + Math.random() * 2.2, Math.sin(a) * (1.2 + Math.random() * 1.6),
          { floorY: spot.y + 0.02, size: brown ? 0.045 + Math.random() * 0.06 : 0.035 });
      }
    }
    // 水声：打在厚泥上闷，冲到东西身上亮；按住 A 时急
    if (!c.self) g.audio.setHose({ mud: 1 - 0.6 * smoothstep(0.4, 0.85, w), fast: speed > 1 });
    // 自己裂开（丙的压轴）：没有水，整包一阵阵发抖，越到后面抖得越急；裂开的缝里透出一线光
    if (c.self) this.selfCrack(dt, w);
    // 泥水在甲板上摊开
    this.puddle.set(b.R + 0.4 + Math.min(1, shellW / 0.42) * 0.7 + w * 0.3, Math.min(1, w * 3));
  }

  // 没人冲、自己裂开：泥包一阵一阵地抖（越往后越急），下一块要掉的那一处先冒一缕土、闪一线光
  selfCrack(dt, w) {
    const g = this.g;
    const c = this.cur;
    const b = c.bundle;
    c.selfT = (c.selfT || 0) + dt;
    const f = 7 + w * 16;
    const a = 0.012 + 0.02 * w;
    b.group.rotation.z = Math.sin(c.selfT * f) * a;
    b.group.rotation.x = Math.sin(c.selfT * f * 0.83 + 1.3) * a * 0.7;
    c.dustT = (c.dustT || 0) + dt * (5 + w * 12);
    if (c.dustT > 1) {
      c.dustT = 0;
      const next = b.plates.find((p) => p.state === 'on' && p.at != null && p.at >= w) || null;
      if (next) {
        const wp = next.pivot.getWorldPosition(new THREE.Vector3());
        const fy = b.group.getWorldPosition(_v).y + 0.02;
        g.fx.emit('chunk', wp.x, wp.y, wp.z, (Math.random() - 0.5) * 0.5, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.5, { floorY: fy, size: 0.05 + Math.random() * 0.04 });
        if (Math.random() < 0.5) this.glintLine(wp, 0.18, 3);
      }
    }
  }

  // 一线反光：一排很细的白点，从一头扫到另一头（不是十字星）
  glintLine(p, len, n, dir) {
    const g = this.g;
    const cam = g.cam.cam;
    const r = dir || new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    for (let i = 0; i < n; i++) {
      const k = i / Math.max(1, n - 1) - 0.5;
      g.fx.emit('glint', p.x + r.x * k * len, p.y + r.y * k * len + 0.02, p.z + r.z * k * len, 0, 0, 0, { life: 0.22 + i * 0.05 });
    }
  }

  // C06 珍贵物露头（冲洗约 36%）：水冲开顶上一块，铁箍一角、一线银光扫过去，「叮」，镜头再凑近一点
  peek() {
    const g = this.g;
    const c = this.cur;
    c.peeked = true;
    c.peekT = 0;
    g.audio.play('peek');
    this.closeDist = 2.6;
    this.closeH = 5.0;
    const it = c.bundle.items.find((i) => i.def.precious);
    this.peekIt = it;
    if (it) setItemGlint(it.model, 0.9);
    g.cue('C06');
  }

  peekSweep(dt) {
    const c = this.cur;
    const it = this.peekIt;
    const was = c.peekT;
    c.peekT += dt;
    if (!it) return;
    // 顶上那道铁箍的前沿：从左扫到右
    const info = it.model.info;
    const W = info.lid ? info.lid.W : 0.25, D = info.lid ? info.lid.D : 0.17, H = info.h;
    const step = 0.04;
    for (let s = Math.ceil(was / step); s * step < Math.min(c.peekT, 0.36); s++) {
      const u = (s * step) / 0.36;
      const p = it.model.group.localToWorld(new THREE.Vector3(-W + u * 2 * W, H + 0.005, D + 0.02));
      this.g.fx.emit('glint', p.x, p.y, p.z, 0, 0.02, 0, { life: 0.35 });
    }
    if (c.peekT > 1.2) { c.peekT = null; setItemGlint(it.model, 0.4); }
  }

  // 揭晓那一下的「实物」：剩下的泥壳崩飞，东西身上的泥一起甩出去（一圈泥块往外飞、水花往外冲）
  burstFx(b, precious) {
    const g = this.g;
    const spot = this.washSpotWorld();
    for (const it of b.items) {
      const gp = it.model.group.getWorldPosition(new THREE.Vector3());
      const n = Math.round(8 + it.r * 16);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = it.r * (0.3 + Math.random() * 0.6);
        const sp = 1.4 + Math.random() * 1.8;
        g.fx.emit(i % 3 ? 'chunk' : 'mudsplat', gp.x + Math.cos(a) * r, gp.y + it.h * (0.3 + Math.random() * 0.6), gp.z + Math.sin(a) * r, Math.cos(a) * sp, 1.0 + Math.random() * 1.6, Math.sin(a) * sp, { floorY: spot.y + 0.02, size: i % 3 ? 0.08 + Math.random() * 0.1 : 0.05 + Math.random() * 0.05 });
      }
    }
    // 每块崩飞的壳碎成几块泥，顺着它飞的方向甩出去
    const bq = b.group.getWorldQuaternion(new THREE.Quaternion());
    for (const p of b.plates) {
      if (!p.burst || p.t > 0) continue;
      const wp = p.pivot.getWorldPosition(new THREE.Vector3());
      const v = p.v.clone().applyQuaternion(bq);
      for (let i = 0; i < 4; i++) {
        g.fx.emit(i % 2 ? 'chunk' : 'mudsplat', wp.x + (Math.random() - 0.5) * 0.2, wp.y + (Math.random() - 0.5) * 0.15, wp.z + (Math.random() - 0.5) * 0.2,
          v.x * (0.6 + Math.random() * 0.6) + (Math.random() - 0.5), v.y + Math.random() * 1.2, v.z * (0.6 + Math.random() * 0.6) + (Math.random() - 0.5),
          { floorY: spot.y + 0.02, size: i % 2 ? 0.1 + Math.random() * 0.1 : 0.06 + Math.random() * 0.05 });
      }
    }
    const ns = precious ? 34 : 22;
    for (let i = 0; i < ns; i++) {
      const a = (i / ns) * Math.PI * 2 + Math.random() * 0.2;
      g.fx.emit('splash', spot.x + Math.cos(a) * b.R * 0.6, spot.y + 0.25 + Math.random() * 0.3, spot.z + Math.sin(a) * b.R * 0.6, Math.cos(a) * (2.4 + Math.random() * 1.6), 1.6 + Math.random() * 1.4, Math.sin(a) * (2.4 + Math.random() * 1.6), { size: 0.09 + Math.random() * 0.07, life: 0.7 });
    }
    this.puddle.set(b.R + 0.9, 0.8);
  }

  onRevealed() {
    const g = this.g;
    const c = this.cur;
    const b = c.bundle;
    c.phase = 'show';
    c.t = 0;
    c.revealed = true;
    c.R = {};
    // 冲洗声一刀切断：揭晓这一下压过一切
    g.audio.loop('hose', false, { cut: true });
    // 实物（0 ms）：剩下的泥壳一下崩飞，东西身上的泥一起甩掉——看清是什么的同一拍就揭晓，不等冲干净。崩开那一下画面顿一顿
    if (!c.empty) g.hit(c.precious ? 0.13 : 0.08);
    b.burst();
    b.setDebris(1);
    this.husk = { b, group: b.group, t: 0 };
    this.burstFx(b, c.precious);
    for (const it of b.items) for (const m of it.model.mats) if (m.uniforms.uWashBias) m.uniforms.uWashBias.value = 0;
    // 货移到甲板上
    const entries = [];
    c.got = [];
    for (const it of b.items) {
      this.deck.attach(it.model.group);
      it.state = 'deck';
      const cg = new Cargo(this, it, it.model.group);
      this.cargo.push(cg);
      entries.push({ kind: it.kind, def: it.def, it, from: placeOf(it.id) });
      // 泥一甩掉，东西往上一弹（越轻弹得越高）
      c.got.push({ it, y0: it.model.group.position.y, hop: clamp(0.11 - it.r * 0.06, 0.04, 0.09) });
    }
    if (b.crab) {
      this.deck.attach(b.crab.group);
      b.crab.setMode('deck');
      b.crab.threat = 1.5;
      this.cargo.push(new Cargo(this, null, b.crab.group, { crab: b.crab }));
      entries.push({ kind: 'crab', def: ITEM_DEFS.crab, it: null, from: placeOf(null, g.boatCtl.pos) });
    }
    // 那一刻一次记入收获
    const rec = g.trip.record(entries);
    c.entries = entries;
    g.events.emit('revealed', { entries, precious: c.precious, empty: c.empty, rec });
    g.audio.play('burst', { heavy: c.precious, empty: c.empty });
    const washer = g.crew.washer;
    if (c.empty) {
      // 只兜上来泥沙：壳一崩，里面只有一摊泥和碎壳；拿水管的人把水管一垂、耸耸肩，「空网」两个字落下来
      c.showT = 1.3;
      const spot = this.washSpotWorld(new THREE.Vector3());
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.4;
        g.fx.emit('chunk', spot.x + Math.cos(a) * r, spot.y + 0.15, spot.z + Math.sin(a) * r, Math.cos(a) * 0.6, 0.8, Math.sin(a) * 0.6, { floorY: spot.y + 0.02, size: 0.07, color: [0.86, 0.82, 0.72] });
      }
      g.later(0.25, () => { if (this.cur === c) g.ui.bigTitle({ name: T('冲·空网'), desc: T('冲·空网说明'), size: 'dud' }); });
      g.audio.play('dud', { at: 0.22 });
      if (washer) washer.gesture('shrug', { delay: 0.3 });
      g.cue('B15');
      g.firsts = g.firsts || {};
      if (!g.firsts.empty) {
        // 第一次落空：旁边看的人也耸一下肩
        g.firsts.empty = true;
        const o = g.crew.sailors.find((s) => s !== washer && s.task && s.task.kind === 'watch');
        if (o) o.gesture('shrug', { delay: 0.55 });
        g.cue('F06');
      }
      return;
    }
    // 主物：最值钱的那一件（银币匣、或者这一网里最值钱的）；只兜到一只蟹时就是蟹
    const main = entries.slice().sort((x, y) => ((y.def.precious ? 1e6 : 0) + (y.def.value || 0)) - ((x.def.precious ? 1e6 : 0) + (x.def.value || 0)))[0];
    c.main = main;
    c.best = Math.max(...entries.map((e) => e.def.value || 0));
    // 蟹：崩开那一下（泥块挡着这一下）往主物旁边一窜——站到主物的左边或右边（对镜头来说），
    // 不挡在主物前面、也不压在它身上；两边挑离别的东西远、又不出洗台那一圈的一边
    if (b.crab && main.it) {
      const cp = b.crab.group.position, mp = main.it.model.group.position;
      const px = -Math.sin(this.phi), pz = Math.cos(this.phi);
      const want = main.it.r + 0.72;
      let best = null, bs = -1e9;
      for (const sd of [1, -1]) {
        const x = mp.x + px * sd * want, z = mp.z + pz * sd * want;
        let near = 9;
        for (const e of entries) if (e.it && e !== main) near = Math.min(near, Math.hypot(e.it.model.group.position.x - x, e.it.model.group.position.z - z) - e.it.r);
        const sc = Math.min(near, 0.8) - Math.max(0, Math.hypot(x - this.at.x, z - this.at.z) - 1.1) * 2 + ((cp.x - mp.x) * px * sd + (cp.z - mp.z) * pz * sd > 0 ? 0.05 : 0);
        if (sc > bs) { bs = sc; best = [x, z]; }
      }
      cp.x = best[0];
      cp.z = best[1];
    }
    if (c.precious) this.confirmStart();
    else g.cue('B14');
    if (b.crab) {
      g.firsts = g.firsts || {};
      if (!g.firsts.crab) {
        // 第一次兜到活物：镜头在蟹举螯那一下停半拍
        g.firsts.crab = true;
        c.lookCrab = 0.9;
        g.cue('F05');
      }
    }
    // 名字和价值到这时才出现：主物的名字是大字，伴随物一件一件挂签，同一时刻只有一张在动。
    // 主物先站稳（名字落下、价值挂上、人反应过）再挂伴随物的签
    const rest = entries.filter((e) => e !== main);
    const t0 = c.precious ? 1.35 : 1.05;
    const per = c.precious ? Math.max(0.42, Math.min(0.7, (c.showT - t0 - 0.2) / Math.max(1, rest.length))) : 0.42;
    if (!c.precious) c.showT = Math.max(SHOW_NORMAL, t0 + per * rest.length + 0.85);
    rest.forEach((e, i) => {
      const gr = e.it ? e.it.model.group : b.crab.group;
      const h = e.it ? e.it.h : 0.2;
      const last = i === rest.length - 1;
      this.addLabel(gr, h, e.def, t0 + i * per, last ? 99 : Math.max(per, 1.2), { it: e.it, i, side: true });
    });
  }

  // 每一网的揭晓（B14）：实物 → 光 → 声 → 字 → 人，一拍一拍错开；银币匣在这上面再加 confirmFx 那一套
  revealFx(t, dt) {
    const g = this.g;
    const c = this.cur;
    if (!c) return;
    const R = c.R || (c.R = {});
    const pull = c.phase === 'pull';
    // 实物 0—0.14 秒：泥一下没了（东西干净了），亮一下、往上一弹
    const k = clamp(t / 0.14, 0, 1);
    if (!R.clean) {
      for (const e of c.got || []) {
        setItemMud(e.it.model, 1 - easeOut(k), 0);
        const u = clamp(t / 0.34, 0, 1);
        e.it.model.group.position.y = e.y0 + Math.sin(u * Math.PI) * e.hop * (1 - u * 0.3);
        if (!(c.precious && e.it.def.precious)) {
          const f = Math.max(0, 1 - t / 0.6);
          for (const m of e.it.model.mats) m.uniforms.uEmissive.value.setRGB(0.36, 0.32, 0.24).multiplyScalar(f * f);
        }
      }
      if (t >= 0.6) {
        R.clean = true;
        for (const e of c.got || []) {
          setItemMud(e.it.model, 0, 0);
          e.it.model.group.position.y = e.y0;
          if (!(c.precious && e.it.def.precious)) for (const m of e.it.model.mats) m.uniforms.uEmissive.value.setRGB(0, 0, 0);
        }
      }
    }
    if (c.empty) return;
    // 一下顿：画面跟着那一下崩开轻轻一震
    if (!R.punch && t >= 0.03) { R.punch = true; g.cam.shake((c.precious ? 0.03 : 0.022) * g.wobbleK); }
    // 光 0.08 秒：背景压暗、东西那一圈留亮；一束暖光从上面打到东西上
    const pc = g.pipe.compositeUniforms;
    const dimTo = pull ? 0 : t < 0.08 ? 0 : c.precious ? 1.0 : 0.72;
    pc.uDim.value = damp(pc.uDim.value, dimTo, dimTo > pc.uDim.value ? 14 : 5, dt);
    if (!pull) this.aimFocus(pc.uFocus.value, dt);
    else if (pc.uDim.value < 0.01) pc.uFocus.value.z = 0;
    if (!R.spot && t >= 0.08) { R.spot = true; this.spot.set(c.precious ? 1.25 : 1); }
    // 一线光扫过每一件
    if (!R.glint && t >= 0.12) {
      R.glint = true;
      for (const e of c.got || []) {
        const gp = e.it.model.group.getWorldPosition(new THREE.Vector3());
        gp.y += e.it.h * 0.85;
        this.glintLine(gp, Math.max(0.24, e.it.r * 1.1), 7);
      }
    }
    // 声 0.16 秒：揭晓的一声——低低一记鼓，跟着按件数往上走的和弦（银币匣有自己的号角，不在这儿）
    if (!R.snd && t >= 0.16 && !c.precious) { R.snd = true; g.audio.play('reveal', { n: c.entries.length, best: c.best }); }
    // 镜头 0.3 秒：往主物那边凑近、放低一点
    if (!R.push && t >= 0.3) {
      R.push = true;
      // 东西小、件数少就凑得更近（一枚铜印也看得清）；件数多留着看得见旁边几件
      if (!c.precious) {
        const r = c.main.def.r || 0.3;
        // 一枚铜印那么小的：凑到一米多，让它在画面上有拳头大
        this.closeDist = c.entries.length <= 2 ? clamp(1.0 + r * 3.5, 1.4, 2.5) : 2.35;
        // 兜到蟹：蟹站在主物旁边，退一点、往蟹那边偏一点，两样都整个在画面里
        if (c.bundle.crab) this.closeDist = Math.max(this.closeDist, 2.0);
        this.closeH = this.closeDist * 1.85;
      }
      const mg = c.main.it ? c.main.it.model.group : c.bundle.crab ? c.bundle.crab.group : null;
      // 看的那一点抬高一点：东西落在画面中间偏下，上面留给大标题（银币匣的标题大，抬得更多）
      if (mg) this.lookAt = g.boat.root.worldToLocal(mg.getWorldPosition(new THREE.Vector3())).setY(BOAT.deckY + (c.precious ? 1.0 : 0.6 * clamp(this.closeDist / 2.2, 0.6, 1)));
      if (mg && c.main.it && c.bundle.crab) {
        const cp = g.boat.root.worldToLocal(c.bundle.crab.group.getWorldPosition(new THREE.Vector3()));
        this.lookAt.x += (cp.x - this.lookAt.x) * 0.25;
        this.lookAt.z += (cp.z - this.lookAt.z) * 0.25;
      }
    }
    // 人 0.5 秒：拿水管的人收了水、往后让一步，把近景让给东西
    if (!R.room && t >= 0.5) { R.room = true; g.crew.washMakeRoom(); }
    if (c.precious) return;
    // 字 0.45 秒：主物的名字大字落下（比银币匣小一号），0.72 秒价值的红绸挂上；底下一行它的来历
    if (!R.title && t >= 0.45) {
      R.title = true;
      g.ui.bigTitle({ name: c.main.def.name, value: c.main.def.value, desc: c.main.def.desc, later: true, size: 'mid' });
      if (c.main.it) { setItemGlint(c.main.it.model, 0.6); }
    }
    if (!R.value && t >= 0.72) { R.value = true; g.ui.bigValue(); g.audio.play('ribbon'); }
    // 人 0.8 秒：拿水管的人点头，旁边的人凑过来看；值钱的（一百四以上）有人举手叫好
    if (!R.crew && t >= 0.8) {
      R.crew = true;
      const washer = g.crew.washer;
      if (washer) washer.gesture('nod');
      const o = g.crew.sailors.find((s) => s !== washer && s.task && s.task.kind === 'watch');
      if (c.best >= 140 && o) {
        o.pose = 'cheer';
        o.cheerUntil = o.t + 1.4;
        g.audio.play('cheer', { n: 2 });
      } else if (o) o.gesture('peer', { delay: 0.1, tx: this.at.x, tz: this.at.z });
    }
  }

  // 一件东西在画面上（1920×1080）占的那一块 [x0, y0, x1, y1]
  projBox(o, out = [1e9, 1e9, -1e9, -1e9]) {
    const box = new THREE.Box3().setFromObject(o);
    for (let i = 0; i < 8; i++) {
      const p = this.g.project(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
      out[0] = Math.min(out[0], p.x); out[1] = Math.min(out[1], p.y); out[2] = Math.max(out[2], p.x); out[3] = Math.max(out[3], p.y);
    }
    return out;
  }

  // 压暗时留亮的那一圈：跟着这一网的东西在画面上的位置走
  aimFocus(F, dt) {
    const c = this.cur;
    const B = [1e9, 1e9, -1e9, -1e9];
    for (const e of c.got || []) this.projBox(e.it.model.group, B);
    if (c.bundle.crab) this.projBox(c.bundle.crab.group, B);
    const [x0, y0, x1, y1] = B;
    if (x1 < x0) return;
    const cx = (x0 + x1) / 2 / 1920, cy = 1 - (y0 + y1) / 2 / 1080;
    // 留亮的一圈：盖住东西的大半就够（边上一点也压暗，东西才「跳」出来）；往外 0.26 慢慢暗下去
    const r = Math.max(x1 - x0, y1 - y0) / 2 / 1080 * 0.8;
    const kk = F.z > 0 ? Math.min(1, dt * 8) : 1;
    F.x += (cx - F.x) * kk;
    F.y += (cy - F.y) * kk;
    F.z += (clamp(r, 0.1, 0.36) - F.z) * kk;
    F.w = 0.26;
  }

  // —— C07 银币匣确认：实物 → 光 → 声 → 字 → 人，一拍一拍错开 ——
  confirmStart() {
    const g = this.g;
    const c = this.cur;
    const main = c.bundle.items.find((i) => i.def.precious);
    this.mainIt = main;
    this.cf = {};
    // 0 ms：冲洗声断，盖子弹开；所有环境声压到三成
    g.audio.play('lidPop');
    g.audio.duck(0.3, 0.04, 2.6, 1.8);
    g.cue('C07');
    g.cue('F04');
    if (main) setItemGlint(main.model, 1);
  }

  confirmFx(t, dt) {
    const g = this.g;
    const main = this.mainIt;
    if (!main) return;
    const F = this.cf;
    const c = this.cur;
    const top = main.model.group.localToWorld(new THREE.Vector3(0, main.h * 0.78, 0));
    // 盖子：回弹的弧，0.55 秒开到底
    if (main.model.lid) {
      const k = clamp(t / 0.55, 0, 1);
      main.model.lid.rotation.set(-easeOutBack(k) * 1.95, 0, 0);
    }
    // 0—150 ms：银光从匣里往上冒，背景压暗（不全屏闪白；亮的只有匣子自己）；一下很低的底鼓
    if (!F.kick && t >= 0.06) { F.kick = true; g.audio.play('kick'); }
    // 银光是从匣口往上飘走的一缕，不糊在匣子上
    if (t > 0.05 && t < 1.6 && Math.random() < dt * 12) {
      const a = Math.random() * Math.PI * 2;
      g.fx.emit('shine', top.x + Math.cos(a) * 0.1, top.y + 0.12, top.z + Math.sin(a) * 0.07, 0, 1.0 + Math.random() * 0.5, 0, { life: 0.8, size: 0.16 });
    }
    g.pipe.compositeUniforms.uFlash.value = 0;
    const glow = t < 0.15 ? smoothstep(0, 0.12, t) : Math.max(0, 1 - (t - 0.15) / 2.6);
    for (const m of main.model.mats) m.uniforms.uEmissive.value.setRGB(0.1, 0.11, 0.13).multiplyScalar(glow * (0.55 + 0.45 * g.wobbleK));
    // 250 ms：光束张开，几枚银币溅出来落在甲板上；号角和弦打开，撒币声跟着落地
    if (!F.rays && t >= 0.25) {
      F.rays = true;
      this.rays.visible = true;
      this.raysT = 0;
      this.rays.position.copy(top);
      const deckY = this.washSpotWorld().y;
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.0 + Math.random() * 1.1;
        g.fx.emit('coin', top.x, top.y + 0.05, top.z, Math.cos(a) * sp, 2.2 + Math.random() * 1.4, Math.sin(a) * sp, { floorY: deckY + 0.015 });
      }
      g.audio.play('fanfare');
      g.audio.play('coins', { n: 14, dur: 0.9, at: 0.35 });
      g.cam.shake(0.035 * g.wobbleK);
    }
    // 400—700 ms：镜头微微推近；「银币匣」落下，卷草伸出；700 ms 红绸挂上价值
    if (!F.title && t >= 0.4) {
      F.title = true;
      this.closeDist = 2.0;
      this.closeH = 3.7;
      g.ui.bigTitle({ name: main.def.name, value: main.def.value, desc: main.def.desc, later: true });
    }
    if (!F.value && t >= 0.7) { F.value = true; g.ui.bigValue(); g.audio.play('ribbon', { heavy: true }); }
    // 视角跟着走（按 A 跳过一段展示时时间往前跳，视角不跟着跳）
    g.cam.alt.fov = damp(g.cam.alt.fov, 30 - 6 * smoothstep(0.4, 1.3, t) * (1 - smoothstep(2.6, 3.6, t)), 8, dt);
    // 700 ms 后：船员这时才欢呼
    if (!F.cheer && t >= 0.75) { F.cheer = true; g.crew.cheer(true); g.audio.play('cheer'); }
    // 展开（3.2 秒）：匣里银币一闪一闪
    if (!F.open && t >= 1.1) { F.open = true; g.cue('C08'); }
    if (t > 1.0 && t < c.showT && (F.glimT = (F.glimT ?? 0.3) - dt) <= 0) {
      F.glimT = 0.4 + Math.random() * 0.45;
      const info = main.model.info;
      const W = info.lid ? info.lid.W : 0.25, D = info.lid ? info.lid.D : 0.17;
      const p = main.model.group.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 2 * (W - 0.05), info.h - 0.03, (Math.random() - 0.5) * 2 * (D - 0.04)));
      g.fx.emit('glint', p.x, p.y, p.z, 0, 0.05, 0, { life: 0.3, size: 0.13 });
      g.audio.play('glimmer');
    }
  }

  startPull() {
    const g = this.g;
    const c = this.cur;
    c.phase = 'pull';
    c.t = 0;
    g.cam.blendTo(0, PULLBACK_T);
    g.crew.endWash();
    g.crew.setMode('sail');
    g.cue('B18');
    if (c.precious) g.cue('C09');
    // 拉回 0—0.6 秒：只有镜头在动，名牌收起
    for (const l of this.labels) {
      if (l.t <= 0) { l.el.remove(); l.dead = true; } else l.fadeAt = Math.min(l.fadeAt, l.t);
    }
    this.labels = this.labels.filter((l) => !l.dead);
    if (this.mainIt) {
      for (const m of this.mainIt.model.mats) m.uniforms.uEmissive.value.setRGB(0, 0, 0);
      setItemGlint(this.mainIt.model, 0.35);
    }
    // 压暗、那一束光、镜头凑近都在拉回时慢慢退掉（不一下子跳亮）
    g.pipe.compositeUniforms.uFlash.value = 0;
    this.spot.set(0);
    this.lookAt = null;
    if (c.main && c.main.it && !c.main.def.precious) setItemGlint(c.main.it.model, 0);
    this.mainIt = null;
    g.ui.bigTitle(null);
    const tok = this.tok;
    const entries = c.entries || [];
    // 0.6—1.6 秒：收获一件件飞进右上的格子
    // 一甲板一起冲的压轴：它的价飞进上方「这一甲板」的总数牌（batch.finaleDone），不进右上的货格（货格只管一网一揭）
    if (!(g.batch && g.batch.on)) g.later(0.6, () => { if (tok === this.tok) g.ui.haulFeed(entries, g.trip); });
    // 拉回完 0.55 秒：船员同时动身，各抱一件走向舱口
    g.later(PULLBACK_T + 0.55, () => { if (tok === this.tok) g.crew.enqueue(this.cargo.filter((cg) => !cg.taken && !cg.done)); });
    // 方向箭头最后出：拉回完 1.5 秒以后
    g.leadHold = PULLBACK_T + 1.5;
    g.events.emit('revealDone', { precious: c.precious, empty: c.empty });
  }

  // —— 名牌：到点挂上去（那件东西同时亮一下），过一会儿让给下一件 ——
  addLabel(group, h, def, delay, dur, o = {}) {
    const el = this.g.ui.itemCard(def);
    this.labels.push({ group, h, el, t: -delay, fadeAt: dur, it: o.it || null, i: o.i ?? 0, flash: o.i !== undefined, anchor: o.anchor || null, side: !!o.side });
  }

  // 名牌挂上去的那一刻：「嗒」一声，一张比一张高；那件东西亮一下（不再爆火花）
  flashItem(l) {
    const g = this.g;
    if (l.it && l.it.model.mats.some((m) => m.uniforms.uGlint)) setItemGlint(l.it.model, 0.6);
    if (l.it) l.pulse = 0;
    g.audio.play('card', { i: l.i });
  }

  updateLabels(dt) {
    const g = this.g;
    const placed = [];
    // 揭晓展开时：主物（银币匣、或者这一网最值钱的那件）在屏幕上占的那一块谁都不许压
    let chestBox = null;
    const main = this.cur && this.cur.main && this.cur.main.it;
    if (main && this.cur.phase !== 'land' && this.cur.phase !== 'wash') {
      const [x0, y0, x1, y1] = this.projBox(main.model.group);
      chestBox = [x0 - 24, y0 - 24, x1 + 24, y1 + 24];
    }
    const order = this.labels.map((l) => {
      const p = l.anchor ? l.anchor.clone() : l.group.getWorldPosition(new THREE.Vector3());
      p.y += l.h + 0.45;
      const s = g.project(p);
      s.y -= 22; // 名牌浮在物件上方，不压住物件
      // 伴随物的签挂在伴随物旁边、紧贴着它在画面上那一块的外沿，不压在它身上，也不压在别的东西身上：
      // 先试离主物远的那一侧，再试它正下方、另一侧、正上方，挑第一个哪件东西都不压的地方（都压就用第一个）
      if (l.side && chestBox && l.group) {
        const q = this.projBox(l.group);
        const cx = (chestBox[0] + chestBox[2]) / 2;
        const away = (q[0] + q[2]) / 2 < cx ? -1 : 1;
        const w = l.el.offsetWidth || 200, hc = l.el.offsetHeight || 44;
        const mx = (q[0] + q[2]) / 2, my = (q[1] + q[3]) / 2;
        const side = (d) => [d < 0 ? q[0] - 12 - w / 2 : q[2] + 12 + w / 2, my + hc / 2];
        const cands = [side(away), [mx, q[3] + 10 + hc], side(-away), [mx, q[1] - 10]];
        // 上面的大字（名字、价值）也不压：签挂在大字底下时，价值那条红绸会盖住签
        const big = g.ui.bigBox();
        const others = [chestBox, ...(big ? [big] : []), ...this.labels.filter((o) => o !== l && o.side && o.group).map((o) => this.projBox(o.group))];
        const free = (c) => {
          const b = [c[0] - w / 2, c[1] - hc, c[0] + w / 2, c[1]];
          if (b[0] < 40 || b[2] > 1880 || b[1] < 90 || b[3] > 1000) return false;
          return !others.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
        };
        const c = cands.find(free) || cands[0];
        s.x = c[0];
        s.y = c[1];
        s.q = q;
      }
      // 谁摞在谁上面：快轮到时按那一刻离画面下沿的远近定下来，之后不再换（镜头拉回时两张签不从对方身上穿过去）
      if (l.key === undefined && l.t + dt > -LABEL_LEAD) l.key = s.y;
      return { l, s };
    }).sort((a, b) => (b.l.key ?? b.s.y) - (a.l.key ?? a.s.y));
    // 珍贵物的大标题占着上方正中：别的名牌不压上去
    // 大标题淡出的那一下也还看得见：淡完以前照样让开
    const bigOn = g.ui.bigEl && (g.ui.bigEl.classList.contains('on') || Number(getComputedStyle(g.ui.bigEl).opacity) > 0.02);
    const big = bigOn ? [960 - 380, 0, 960 + 380, g.ui.bigEl.offsetTop + g.ui.bigEl.offsetHeight + 12] : null;
    for (const { l, s } of order) {
      const was = l.t;
      l.t += dt;
      if (was <= 0 && l.t > 0 && l.flash) this.flashItem(l);
      if (l.pulse != null && l.it) {
        l.pulse += dt;
        const k = Math.max(0, 1 - l.pulse / 0.3);
        for (const m of l.it.model.mats) m.uniforms.uEmissive.value.setRGB(0.22, 0.2, 0.15).multiplyScalar(k);
        if (k <= 0) l.pulse = null;
      }
      // 名牌互相让开：重叠就往上摞
      const w = l.el.offsetWidth || 200, hgt = (l.el.offsetHeight || 44) + 8;
      // 刚挂上去的签绕签孔摆几下（CSS 的 hang，最大 8°，转轴就是左边的签孔），右端会抬起、落下：摆的这一下上下各多留一点地方，
      // 旁边的签先让一让、摆停了再靠回来，不让签角扫进别的签
      const pad = l.t > -LABEL_LEAD && l.t < HANG_T ? (w - 18) * Math.sin(0.15) * Math.min(1, 1.15 * (1 - Math.max(0, l.t) / HANG_T)) : 0;
      const zones = [big, chestBox, g.batch ? g.batch.zone() : null].filter(Boolean);
      // 一张签占的地方（底边中点 x, y）：上下连摆出去的那一截
      const box = (x, y) => [x - w / 2, y - hgt - pad, x + w / 2, y + pad];
      const hits = (b) => placed.find((q) => b[0] < q.b[2] + 6 && b[2] > q.b[0] - 6 && b[1] < q.b[3] && b[3] > q.b[1]);
      let x = s.x;
      let y = s.y;
      // 先往上摞开压着的签，再躲开屏幕边、常驻的面板、大标题和银币匣；躲完又压上别的签就接着摞，直到哪儿都不压
      for (let k = 0; k < 10; k++) {
        const hit = hits(box(x, y));
        if (hit) { y = hit.b[1] - pad; continue; }
        const b = box(x, y);
        const [x0, y0] = keepOut(b[0], b[1], w, b[3] - b[1], zones);
        if (Math.abs(x0 - b[0]) < 0.5 && Math.abs(y0 - b[1]) < 0.5) break;
        x = x0 + w / 2;
        y = y0 + hgt + pad;
        // 躲开面板以后又压上了一张：从它下面绕不过去就摞到它上面
        const h2 = hits(box(x, y));
        if (!h2) break;
        y = h2.b[1] - pad;
      }
      // 还没轮到的签不占地方（不然先把亮着的那张挤走）；快轮到时先占上，旁边的签好提前让开
      if (l.t > -LABEL_LEAD) placed.push({ b: box(x, y) });
      // 挪的时候滑过去，不跳
      const snap = l.y === undefined || l.t <= 0;
      const kk = Math.min(1, dt * 14);
      l.x = snap ? x : l.x + (x - l.x) * kk;
      l.y = snap ? y : l.y + (y - l.y) * kk;
      const vis = l.t > 0 && l.t < l.fadeAt + 0.3;
      // 用 translate 属性摆位置（不用 transform）：CSS 的 rotate（hang 那一摆）才是绕签自己的签孔转，不是绕画面左上角
      l.el.style.translate = `calc(${l.x.toFixed(0)}px - 50%) calc(${l.y.toFixed(0)}px - 100%)`;
      l.el.classList.toggle('on', vis && l.t < l.fadeAt);
      // 淡出时原地淡掉（不往下掉那 18 像素压到下面那张）
      l.el.classList.toggle('out', l.t >= l.fadeAt);
      // 伴随物的签用一根细麻绳拴在它那件东西上：签被别的签、主物挤开了，也一眼看得出是哪一件的
      if (s.q) this.tieCord(l, s.q, w, hgt - 8, vis && l.t < l.fadeAt);
      if (l.t > l.fadeAt + 0.5) { l.el.remove(); if (l.cord) l.cord.remove(); l.dead = true; }
    }
    this.labels = this.labels.filter((l) => !l.dead);
  }

  // 绳子从签靠那件东西的一边拉出去，另一头钉在那件东西身上（靠近它在画面上那一块的中心），钉头一个铜点
  tieCord(l, q, w, hc, on) {
    if (!l.cord) {
      l.cord = document.createElement('div');
      l.cord.className = 'cord';
      l.el.parentNode && l.el.parentNode.insertBefore(l.cord, l.el);
    }
    const cx = (q[0] + q[2]) / 2, cy = (q[1] + q[3]) / 2;
    const x0 = l.x - w / 2, x1 = l.x + w / 2, ym = l.y - hc / 2;
    const sx = cx > x1 ? x1 - 4 : cx < x0 ? x0 + 4 : clamp(cx, x0 + 20, x1 - 20);
    const sy = cx > x1 || cx < x0 ? ym : cy > l.y ? l.y - 2 : l.y - hc + 2;
    const dx = sx - cx, dy = sy - cy;
    const hx = Math.max(8, (q[2] - q[0]) / 2), hy = Math.max(8, (q[3] - q[1]) / 2);
    const te = Math.min(dx ? hx / Math.abs(dx) : 9, dy ? hy / Math.abs(dy) : 9, 1);
    const ex = cx + dx * te * 0.2, ey = cy + dy * te * 0.2;
    const L = Math.hypot(sx - ex, sy - ey);
    l.cord.style.width = `${L.toFixed(0)}px`;
    l.cord.style.translate = `${sx.toFixed(0)}px ${sy.toFixed(0)}px`;
    l.cord.style.rotate = `${Math.atan2(ey - sy, ex - sx).toFixed(3)}rad`;
    l.cord.classList.toggle('on', on && L > 14);
  }

  clearLabels() {
    for (const l of this.labels) { l.el.remove(); if (l.cord) l.cord.remove(); }
    this.labels = [];
  }

  updatePlume(dt) {
    const m = this.plume;
    if (!m.visible) return;
    const k = (m.userData.t += dt);
    const U = m.material.uniforms;
    U.uK.value = k;
    U.uA.value = smoothstep(0, 0.12, k) * (1 - smoothstep(0.7, 2.1, k));
    const h = 0.25 + easeOut(clamp(k / 0.55, 0, 1)) * 0.75;
    const w = 1 + smoothstep(0.3, 2.1, k) * 0.35;
    m.scale.set(w, h, w);
    if (k > 2.1) m.visible = false;
  }

  updateRays(dt, t) {
    if (!this.rays.visible) return;
    this.raysT += dt;
    poseRays(this.rays, this.raysT, t, this.g.cam.cam);
    if (this.raysT > 3.9) this.rays.visible = false;
  }
}

// 光束：一圈从中心放出的细三角，正对镜头
// 光束随时间：快速张开、慢慢转、淡出（游戏和效果页共用）
export function poseRays(rays, k, t, cam) {
  const a = smoothstep(0, 0.25, k) * (1 - smoothstep(2.4, 3.8, k));
  rays.material.opacity = a * 0.26;
  rays.quaternion.copy(cam.quaternion);
  rays.rotateZ(t * 0.25);
  const s = 0.45 + easeOut(clamp(k / 0.7, 0, 1)) * 0.5;
  rays.scale.set(s, s, s);
}

export function buildRays() {
  const pos = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.1;
    const w = i % 2 ? 0.03 : 0.055;
    const L = i % 2 ? 1.0 : 1.55;
    pos.push(0, 0, 0, Math.cos(a - w) * L, Math.sin(a - w) * L, 0, Math.cos(a + w) * L, Math.sin(a + w) * L, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, side: THREE.DoubleSide }));
  m.renderOrder = 25;
  m.visible = false;
  m.frustumCulled = false;
  return m;
}

// 一缕银光：开口的细锥筒，加色混合；竖着有几道往上走的光丝，上下两头淡掉
function buildPlume() {
  const geo = new THREE.CylinderGeometry(0.16, 0.42, 2.6, 18, 1, true);
  geo.translate(0, 1.3, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uK: { value: 0 }, uA: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uK; uniform float uA; varying vec2 vUv;
      void main(){
        float y = vUv.y;
        float a = smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.35, 1.0, y));
        float s = 0.55 + 0.45 * sin(vUv.x * 6.2831 * 5.0 + y * 3.0 - uK * 1.5);
        float st = 0.6 + 0.4 * sin(y * 16.0 - uK * 9.0 + vUv.x * 12.566);
        a *= s * st;
        vec3 c = mix(vec3(0.78, 0.86, 0.96), vec3(1.0, 0.99, 0.94), s);
        gl_FragColor = vec4(c * a * uA * 0.9, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 24;
  m.visible = false;
  m.frustumCulled = false;
  m.userData.t = 0;
  return m;
}

// 甲板上的泥水：不规则的一摊，冲洗时摊开，之后慢慢淡掉
// 水管喷出来的一束水：从喷嘴到泥上的一道弧，水流一节一节往前走，末端散开
export function buildJet() {
  const N = 22, R = 5;
  const pos = new Float32Array(N * R * 3);
  const uv = new Float32Array(N * R * 2);
  const idx = [];
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < R; k++) {
      uv[(i * R + k) * 2] = k / R;
      uv[(i * R + k) * 2 + 1] = i / (N - 1);
      if (i < N - 1) {
        const a = i * R + k, b = i * R + ((k + 1) % R), c = a + R, d = b + R;
        idx.push(a, c, b, b, c, d);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uT;
      varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){
        float v = vUv.y;
        // 一节一节往前冲的水
        float pulse = fract(v * 7.0 - uT * 9.0);
        // 末端碎成一串水珠
        float cell = floor(v * 40.0 - uT * 22.0);
        if (v > 0.7 && h(vec2(cell, floor(vUv.x * 5.0))) < (v - 0.7) * 2.6) discard;
        vec3 c = mix(vec3(0.62, 0.8, 0.92), vec3(0.95, 0.99, 1.0), smoothstep(0.55, 0.95, pulse));
        c = mix(c, vec3(1.0), step(0.4, abs(fract(vUv.x + 0.1) - 0.5)) * 0.25);
        gl_FragColor = vec4(c, 0.88);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.renderOrder = 21;
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _p = new THREE.Vector3();
  const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _m = new THREE.Vector3();
  return {
    mesh,
    set(from, to, dt, speed, thick = 1) {
      mesh.visible = true;
      mat.uniforms.uT.value += dt * speed;
      _a.copy(from);
      _b.copy(to);
      const dist = _a.distanceTo(_b);
      // 控制点比中点高：水柱先往上拱一点再落下去
      _c.lerpVectors(_a, _b, 0.45);
      _c.y += dist * 0.16;
      const T = mat.uniforms.uT.value;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const u = 1 - t;
        _p.set(0, 0, 0).addScaledVector(_a, u * u).addScaledVector(_c, 2 * u * t).addScaledVector(_b, t * t);
        // 切线、两条法线
        _t.set(0, 0, 0).addScaledVector(_a, -2 * u).addScaledVector(_c, 2 * (u - t)).addScaledVector(_b, 2 * t).normalize();
        _n.set(0, 1, 0).cross(_t).normalize();
        _m.copy(_t).cross(_n).normalize();
        const r = (0.014 + t * 0.022 + Math.sin(T * 31 + i * 1.7) * 0.004 * t) * thick;
        for (let k = 0; k < R; k++) {
          const ang = (k / R) * Math.PI * 2;
          const j = (i * R + k) * 3;
          pos[j] = _p.x + (_n.x * Math.cos(ang) + _m.x * Math.sin(ang)) * r;
          pos[j + 1] = _p.y + (_n.y * Math.cos(ang) + _m.y * Math.sin(ang)) * r;
          pos[j + 2] = _p.z + (_n.z * Math.cos(ang) + _m.z * Math.sin(ang)) * r;
        }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

function buildPuddle() {
  const n = 28;
  const geo = new THREE.CircleGeometry(1, n);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 1; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const r = 1 + Math.sin(a * 3 + 1.1) * 0.16 + Math.sin(a * 5 + 0.3) * 0.1 + Math.sin(a * 9) * 0.05;
    p.setX(i, p.getX(i) * r * 1.25);
    p.setZ(i, p.getZ(i) * r);
  }
  const mat = toon({ color: 0x5a4a34, transparent: true, opacity: 0, spec: 0.6, shin: 30 });
  mat.depthWrite = false;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(BOAT.wash.x - 0.2, BOAT.deckY + 0.012, BOAT.wash.z);
  mesh.renderOrder = 2;
  mesh.visible = false;
  let size = 0, op = 0, sizeT = 0, opT = 0;
  return {
    mesh,
    set(s, o) { sizeT = s; opT = o; if (o > op) op = o; },
    update(dt) {
      size += (sizeT - size) * Math.min(1, dt * 3);
      if (opT === 0 || op > opT) op = Math.max(0, op - dt * 0.12);
      if (opT > 0 && op < opT) op = opT;
      opT = 0;
      mesh.visible = op > 0.01 && size > 0.05;
      mesh.scale.set(Math.max(0.01, size), 1, Math.max(0.01, size));
      mat.uniforms.uOpacity.value = op * 0.72;
    },
  };
}

// 揭晓时打在东西上的一束暖光：甲板上一摊柔亮的暖光（加色、不写深度），四周压暗（合成里的 uFocus）时东西这一圈还亮着
function buildSpot() {
  const group = new THREE.Group();
  group.visible = false;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uA; varying vec2 vUv;
      void main(){
        float r = length(vUv - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.2, 1.0, r)) * 0.32;
        gl_FragColor = vec4(vec3(1.0, 0.84, 0.56) * a * uA, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  disc.renderOrder = 3;
  disc.position.y = 0.006;
  group.add(disc);
  let k = 0, to = 0;
  return {
    group,
    set(v, snap) { to = v; if (snap) k = v; },
    update(dt) {
      // 亮起来快（一下打上去），收起来慢
      k += (to - k) * Math.min(1, dt * (to > k ? 10 : 3));
      if (Math.abs(to - k) < 0.002) k = to;
      group.visible = k > 0.01;
      disc.material.uniforms.uA.value = k;
      const s = 0.8 + 0.2 * Math.min(1, k);
      disc.scale.set(s, 1, s);
    },
  };
}
