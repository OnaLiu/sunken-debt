import * as THREE from 'three';
import { BOAT } from '../world/boat.js';
import { setItemMud, setItemGlint } from '../world/items.js';
import { ITEM_DEFS } from './itemdefs.js';
import { clamp, smoothstep, easeOut } from '../util/math.js';
import { ICON } from '../ui/icons.js';
import { placeOf } from '../sea/index.js';
import { T, N } from './tables.js';

// 一甲板一起冲（设计第 5 节招牌）·甲「齐冲」：
// 甲板码满（或玩家按开冲），几个船员各拿一根水管，镜头拉到看得见整个甲板，泥包从便宜到贵一包接一包崩开、越崩越快，
// 每崩一包上方的总数牌加一次；最贵的那一包留到最后（压轴），别的都揭完了停一拍，镜头推近，走一遍一网一揭的那一整套揭晓。
// 全游戏一份：以后三小段、切片里的「一甲板一起冲」都是这一份，只往表里加数。
// 招牌是用户 2026-11-23 从三套里挑的甲「齐冲」；另外两套（乙「一舷大水」、丙「连环崩」）从游戏里拿掉了，在 Git 历史里。

const WASHERS = 3; // 最多几个人同时冲（甲板上站得下）
const SPEEDUP = 1.8; // 按住下网键：冲得快多少
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

// 一包值多少：里面每件的价值加起来（蟹也算），珍贵的永远排最后
export function bundleWorth(b) {
  let v = 0;
  for (const it of b.items) v += it.def.value || 0;
  if (b.crab) v += ITEM_DEFS.crab.value || 0;
  return v;
}

export class BatchWash {
  constructor(g) {
    this.g = g;
    this.on = false;
    this.el = document.createElement('div');
    this.el.id = 'batchsum';
    this.el.className = 'panel';
    this.el.innerHTML = `<span class="t"></span><span class="it">${ICON.coin}<b>0</b></span><span class="n"></span>`;
    g.ui.hud.append(this.el);
  }

  reset() {
    this.tagged = false;
    this.on = false;
    this.list = [];
    this.husks = [];
    this.got = [];
    this.finale = null;
    this.phase = null;
    this.el.classList.remove('on');
    this.result = null;
  }

  get active() {
    return this.on;
  }

  // 开冲：甲板上码着的每一包排好先后，人拿水管就位，镜头拉高
  start() {
    const g = this.g;
    const slots = g.deck.slots.filter((S) => S.bundle && !S.fall);
    if (!slots.length) return false;
    this.reset();
    this.on = true;
    this.clock = 0;
    this.total = 0;
    this.shown = 0;
    this.count = 0;
    this.entriesAll = [];
    this.fuel0 = g.trip.fuel;
    this.plan(slots);
    const L = this.list;
    this.nextAt = 0.9;
    this.phase = L.length ? 'wash' : 'tag';
    this.phaseT = 0;
    // 镜头：拉到看得见整个甲板（从玩家这会儿看过来的那一侧）
    const cl = g.boat.root.worldToLocal(_v.copy(g.cam.cam.position));
    this.side = cl.z >= 0 ? 1 : -1;
    // 拿水管的人，人数不超过要冲的包数
    const n = Math.min(WASHERS, Math.max(1, L.length));
    this.washers = L.length ? g.crew.startBatch(n).map((s) => ({ s, e: null })) : [];
    // 先把前几包分给人，让他们先走过去站好
    for (const W of this.washers) this.assignNext(W);
    this.overview(0);
    g.cam.alt.fov = 34;
    g.cam.blendTo(1, 1.3);
    g.crew.setMode('wash');
    // 总数牌落下来
    this.el.querySelector('.t').textContent = T('冲·这一甲板');
    this.el.querySelector('b').textContent = '0';
    this.el.querySelector('.n').textContent = '';
    this.el.classList.add('on');
    g.audio.play('armOff');
    g.cue('B25');
    return true;
  }

  // —— 规则 ——
  // 谁先谁后：从便宜到贵，珍贵的永远在最后；压轴是最贵的那一包（落空的不算）；一包冲多久：第一包最慢，后面一包比一包快
  plan(slots) {
    const L = slots.map((S) => ({ S, b: S.bundle, crab: S.crab, value: bundleWorth(S.bundle), precious: S.bundle.precious, empty: S.bundle.empty, state: 'wait', w: 0 }));
    L.sort((a, b) => (a.precious - b.precious) || (a.value - b.value));
    const last = L[L.length - 1];
    if (last && !last.empty && last.value > 0) this.finale = L.pop();
    this.list = L;
    let D = N('齐冲第一包', 2.4);
    for (const e of L) {
      e.D = Math.max(N('齐冲最短', 0.85), D);
      D *= N('齐冲每包快多少', 0.78);
    }
  }

  // 看整个甲板的机位（船局部算，跟着船晃）
  overview(dt) {
    const g = this.g;
    const root = g.boat.root;
    const look = _v.set(3.1, BOAT.deckY, 0);
    const pos = _w.set(3.1 - 6.8, BOAT.deckY + 14.5, this.side * 8.2);
    g.cam.alt.pos.copy(root.localToWorld(pos));
    g.cam.alt.look.copy(root.localToWorld(look));
  }

  // 站在哪儿冲这一包：在它和船中线之间，离泥包一臂远（船局部）
  standFor(e) {
    const S = e.S, R = e.b.R;
    if (S.centre) return { x: S.x - R - 0.75, z: this.side * 0.35 };
    return { x: S.x, z: S.z - Math.sign(S.z) * (R + 0.8) };
  }

  assignNext(W) {
    const e = this.list.find((q) => q.state === 'wait' && !q.washer);
    if (!e) { W.e = null; return; }
    W.e = e;
    e.washer = W;
    const st = this.standFor(e);
    this.g.crew.batchGo(W.s, st.x, st.z, e.S.x, e.S.z);
  }

  update(dt, aHeld) {
    if (!this.on) return;
    const g = this.g;
    const speed = aHeld ? SPEEDUP : 1;
    // 水泵升过级：冲得快几倍（船坞里的「水泵」）
    const pump = g.washK || 1;
    this.clock += dt * speed * pump;
    this.phaseT += dt;
    // 压轴以前镜头在看整个甲板的机位上；压轴那一段归揭晓的近景管
    if (g.cam.alt.w > 0 && (this.phase === 'wash' || this.phase === 'tag')) this.overview(dt);
    let washing = 0, mud = 0, fast = false;

    if (this.phase === 'wash') {
      // 轮到下一包：前一包冲到几成了、这一包的人站好了，就开冲
      for (const e of this.list) {
        if (e.state !== 'wait' || !e.washer) continue;
        if (this.clock < this.nextAt) break;
        const ready = g.crew.batchReady(e.washer.s) || (e.waitT = (e.waitT || 0) + dt) > 2.5;
        if (!ready) break;
        this.startOne(e);
        this.nextAt = this.clock + e.D * N('齐冲接下一包', 0.55);  // 表的 id，不是玩家看的
        break;
      }
      for (const e of this.list) {
        if (e.state !== 'wash') continue;
        e.w = Math.min(1, e.w + (dt / e.D) * speed * pump);
        this.washOne(e, dt, speed);
        washing++;
        mud = Math.max(mud, 1 - 0.6 * smoothstep(0.4, 0.85, e.w));
        fast = fast || speed > 1;
        const lp = e.b.lastPlate;
        if ((lp && lp.state !== 'on' && lp.t >= 0.06) || e.w >= 1) this.burstOne(e);
      }
      if (this.list.every((e) => e.state === 'done')) {
        this.phase = 'tag';
        this.phaseT = 0;
        g.crew.endBatch();
      }
    }

    if (this.phase === 'tag') {
      // 别的都揭完：停一拍，压轴那一包上方挂一块「压轴」的牌，镜头再推过去
      if (!this.finale) {
        if (this.phaseT > 1.2) this.finish();
      } else {
        if (!this.tagged && this.phaseT > 0.3) {
          this.tagAt = this.phaseT;
          this.tagged = true;
          const F = this.finale;
          this.g.reveal.addLabel(F.b.group, F.b.R + 0.1, { name: T('冲·压轴') }, 0, N('压轴前停多久', 0.9) + 0.4, { i: 6 });
          F.b.group.userData.pulse = 0;
          g.audio.play('peek');
        }
        if (this.tagged && this.phaseT > this.tagAt + N('压轴前停多久', 0.9)) this.startFinale();
      }
    }

    // 压轴那一包上方挂牌时，泥包自己鼓一下（里面最贵的东西在等）
    if (this.finale && this.finale.b.group.userData.pulse != null && this.phase === 'tag') {
      const u = (this.finale.b.group.userData.pulse += dt);
      const k = Math.sin(u * 9) * Math.exp(-u * 2.2) * 0.05;
      this.finale.b.group.scale.set(1 + k, 1 - k, 1 + k);
    }

    // 冲洗声：有人在冲就开着
    if (washing && !this.hoseOn) { this.hoseOn = true; g.audio.loop('hose', true); }
    if (!washing && this.hoseOn) { this.hoseOn = false; g.audio.loop('hose', false, { cut: true }); }
    if (washing) g.audio.setHose({ mud, fast });

    // 崩飞的泥壳：飞出去、摔在甲板上化掉
    for (const H of this.husks) {
      H.t += dt;
      H.b.washPlates(1, dt, () => {});
      if (H.t > 1.8 || H.b.plates.every((p) => p.state === 'gone')) { H.b.group.parent && H.b.group.parent.remove(H.b.group); H.dead = true; }
    }
    this.husks = this.husks.filter((H) => !H.dead);
    // 刚揭出来的东西：泥一下没了、往上一弹、亮一下
    for (const G of this.got) {
      G.t += dt;
      const k = clamp(G.t / 0.14, 0, 1);
      setItemMud(G.it.model, 1 - easeOut(k), 0);
      const u = clamp(G.t / 0.34, 0, 1);
      G.it.model.group.position.y = G.y0 + Math.sin(u * Math.PI) * G.hop * (1 - u * 0.3);
      const f = Math.max(0, 1 - G.t / 0.6);
      for (const m of G.it.model.mats) m.uniforms.uEmissive.value.setRGB(0.36, 0.32, 0.24).multiplyScalar(f * f);
      if (G.t >= 0.6) {
        setItemMud(G.it.model, 0, 0);
        G.it.model.group.position.y = G.y0;
        for (const m of G.it.model.mats) m.uniforms.uEmissive.value.setRGB(0, 0, 0);
        G.dead = true;
      }
    }
    this.got = this.got.filter((G) => !G.dead);
  }

  startOne(e) {
    const g = this.g;
    e.state = 'wash';
    e.w = 0;
    e.sprayT = 0;
    e.splatT = 0;
    // 按看整个甲板的机位排好泥壳哪块先崩
    e.b.group.updateMatrixWorld(true);
    e.b.schedule(g.cam.alt.pos.clone(), 0.04, e.empty ? 0.6 : 0.8);
    g.crew.batchSpray(e.washer.s, true);
    g.cue('B12', 0.4);
  }

  washOne(e, dt, speed) {
    const g = this.g;
    const b = e.b;
    const next = b.washPlates(e.w, dt, (p, wp, landed) => this.onPlate(e, p, wp, landed));
    b.setDebris(smoothstep(0.04, 0.5, e.w));
    const infl = 0.045 * (1 - smoothstep(0.0, 0.12, e.w));
    for (const it of b.items) setItemMud(it.model, 1, infl);
    const noz = g.crew.batchNozzle(e.washer.s);
    const spot = b.group.getWorldPosition(new THREE.Vector3());
    const target = spot.clone();
    if (next) next.pivot.getWorldPosition(target);
    else target.y += 0.35 + (1 - e.w) * b.R * 0.4;
    e.aim = e.aim ? e.aim.lerp(target, Math.min(1, dt * 7)) : target.clone();
    const aim = e.aim;
    // 水柱：一串水点从喷嘴打到泥上（几根水管同时打，粒子比一网一揭的少一点）
    e.sprayT += dt * 46 * Math.min(1.6, speed);
    while (e.sprayT > 1) {
      e.sprayT -= 1;
      const sp = 7.5 + Math.random() * 2;
      const dir = aim.clone().sub(noz.world);
      const dist = dir.length();
      dir.normalize();
      const tt = dist / sp;
      g.fx.emit('spray', noz.world.x, noz.world.y, noz.world.z,
        dir.x * sp + (Math.random() - 0.5) * 0.6, dir.y * sp + 9.8 * tt * 0.5 + (Math.random() - 0.5) * 0.4, dir.z * sp + (Math.random() - 0.5) * 0.6,
        { life: tt * 1.05, size: (0.04 + Math.random() * 0.02) * (speed > 1 ? 1.4 : 1) });
    }
    const muddy = 1 - 0.55 * smoothstep(0.45, 0.85, e.w);
    e.splatT += dt * 18 * Math.min(1.6, speed) * (0.35 + (1 - e.w));
    while (e.splatT > 1) {
      e.splatT -= 1;
      const a = Math.random() * Math.PI * 2;
      const brown = Math.random() < 0.75 * muddy + 0.1;
      g.fx.emit(brown ? 'mudsplat' : 'spray', aim.x + Math.cos(a) * 0.12, aim.y - Math.random() * 0.1, aim.z + Math.sin(a) * 0.12,
        Math.cos(a) * (1.2 + Math.random() * 1.6), 1.2 + Math.random() * 2.2, Math.sin(a) * (1.2 + Math.random() * 1.6),
        { floorY: spot.y + 0.02, size: brown ? 0.05 + Math.random() * 0.06 : 0.04 });
    }
  }

  onPlate(e, p, wp, landed) {
    const g = this.g;
    const fy = e.b.group.getWorldPosition(_v).y + 0.02;
    if (!landed) {
      if (Math.random() < 0.6) g.audio.play('mudChunk', { gain: 0.35 + Math.random() * 0.4 });
      for (let i = 0; i < 3; i++) g.fx.emit('chunk', wp.x + (Math.random() - 0.5) * 0.15, wp.y, wp.z + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 1.2, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2, { floorY: fy, size: 0.12 + Math.random() * 0.12 });
    } else {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.2;
        g.fx.emit(i < 2 ? 'chunk' : 'mudsplat', wp.x, fy + 0.06, wp.z, Math.cos(a) * sp, 0.6 + Math.random() * 0.9, Math.sin(a) * sp, { floorY: fy, size: 0.06 + Math.random() * 0.08 });
      }
    }
  }

  // 这一包看得清了：剩下的壳一下崩飞，东西留在甲板上，上方挂一张签，总数牌加上去
  burstOne(e) {
    const g = this.g;
    const b = e.b;
    e.state = 'done';
    const idx = this.count++;
    if (e.washer) {
      g.crew.batchSpray(e.washer.s, false);
      const W = e.washer;
      // 这个人接着去冲下一包
      this.assignNext(W);
    }
    b.burst();
    b.setDebris(1);
    this.husks.push({ b, t: 0 });
    this.burstFx(e);
    g.deck.take(e.S);
    const entries = [];
    for (const it of b.items) {
      g.reveal.addCargo(it);
      entries.push({ kind: it.kind, def: it.def, it, from: it.from || placeOf(it.id) });
      this.got.push({ it, t: 0, y0: it.model.group.position.y, hop: clamp(0.11 - it.r * 0.06, 0.04, 0.09) });
    }
    if (b.crab) {
      g.reveal.addCrabCargo(b.crab);
      entries.push({ kind: 'crab', def: ITEM_DEFS.crab, it: null, from: placeOf(null, g.boatCtl.pos) });
    }
    const rec = g.trip.record(entries);
    this.entriesAll.push(...entries);
    g.events.emit('revealed', { entries, precious: false, empty: e.empty, rec, batch: true });
    // 越往后崩得越响、顿得越久（压轴前那几包最带劲）
    const k = this.list.length > 1 ? idx / (this.list.length - 1) : 1;
    g.audio.play('burst', { heavy: false, empty: e.empty });
    if (e.empty) {
      g.hit(0.03);
      g.audio.play('dud', { at: 0.12 });
      g.reveal.addLabel(b.group, b.R * 0.6, { name: T('冲·空网') }, 0.12, 1.3, {});
      if (e.washer) e.washer.s.gesture('shrug', { delay: 0.2 });
      return;
    }
    g.hit(0.05 + 0.04 * k);
    g.cam.shake((0.016 + 0.016 * k) * g.wobbleK);
    g.audio.play('reveal', { n: Math.min(4, entries.length + 1), best: 0, up: Math.round(k * 7) });
    // 签：这一包最值钱的那一件（名字、价值）；别的几件在结算牌上
    const main = entries.slice().sort((x, y) => (y.def.value || 0) - (x.def.value || 0))[0];
    const gr = main.it ? main.it.model.group : b.crab.group;
    g.reveal.addLabel(gr, main.it ? main.it.h : 0.2, main.def, 0.14, 1.5, { it: main.it, i: Math.min(5, idx) });
    if (main.it) setItemGlint(main.it.model, 0.5);
    // 总数牌加上这一包：签挂上的同时，一枚铜钱带着这一整包的价从这一包在甲板上的地方（东西脚下，不压着签）飞进总数牌，落进去才加
    this.total += e.value;
    const from = g.boat.root.localToWorld(new THREE.Vector3(e.S.x, BOAT.deckY, e.S.z));
    g.later(0.16, () => { if (this.on) this.coinIn(from, e.value, false); });
    // 值钱的：旁边看的人叫一声好
    if (e.value >= 140) {
      const o = g.crew.sailors.find((s) => s.task && s.task.kind === 'watch');
      if (o) { o.pose = 'cheer'; o.cheerUntil = o.t + 1.1; }
      g.audio.play('cheer', { n: 1 });
    } else if (e.washer) e.washer.s.gesture('nod', { delay: 0.15 });
  }

  burstFx(e) {
    const g = this.g;
    const b = e.b;
    const spot = b.group.getWorldPosition(new THREE.Vector3());
    const fy = spot.y + 0.02;
    for (const it of b.items) {
      const gp = it.model.group.getWorldPosition(new THREE.Vector3());
      const n = Math.round(6 + it.r * 12);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = it.r * (0.3 + Math.random() * 0.6), sp = 1.4 + Math.random() * 1.8;
        g.fx.emit(i % 3 ? 'chunk' : 'mudsplat', gp.x + Math.cos(a) * r, gp.y + it.h * (0.3 + Math.random() * 0.6), gp.z + Math.sin(a) * r, Math.cos(a) * sp, 1.0 + Math.random() * 1.6, Math.sin(a) * sp, { floorY: fy, size: i % 3 ? 0.08 + Math.random() * 0.1 : 0.05 + Math.random() * 0.05 });
      }
    }
    const ns = 18;
    for (let i = 0; i < ns; i++) {
      const a = (i / ns) * Math.PI * 2 + Math.random() * 0.2;
      g.fx.emit('splash', spot.x + Math.cos(a) * b.R * 0.6, spot.y + 0.25 + Math.random() * 0.3, spot.z + Math.sin(a) * b.R * 0.6, Math.cos(a) * (2.4 + Math.random() * 1.6), 1.6 + Math.random() * 1.4, Math.sin(a) * (2.4 + Math.random() * 1.6), { size: 0.09 + Math.random() * 0.07, life: 0.7 });
    }
    // 一线光扫过揭出来的每一件
    for (const it of b.items) {
      const gp = it.model.group.getWorldPosition(new THREE.Vector3());
      gp.y += it.h * 0.85;
      g.reveal.glintLine(gp, Math.max(0.24, it.r * 1.1), 6);
    }
  }

  // 压轴：这一包在自己的位子上，走一遍一网一揭的整套揭晓；镜头从看整个甲板的机位推过去
  startFinale() {
    const g = this.g;
    const F = this.finale;
    this.phase = 'finale';
    this.phaseT = 0;
    F.b.group.scale.set(1, 1, 1);
    F.b.group.userData.pulse = null;
    // 「压轴」牌说完了：开始冲压轴这一刻收起，不和冲洗的进度圈叠在一起
    for (const l of g.reveal.labels) if (l.group === F.b.group) l.fadeAt = Math.min(l.fadeAt, Math.max(0, l.t));
    g.crew.endBatch();
    g.deck.take(F.S);
    const from = this.finaleFrom();
    this.el.classList.add('dim');
    g.reveal.beginAt(F.b, F.S.x, F.S.z, from, {});
    g.cam.alt.fov = 30;
    g.cue('B26');
  }

  // 压轴的近景从哪儿推过去：镜头这会儿（看整个甲板的机位）相对压轴那一包在哪（船局部）
  finaleFrom() {
    const g = this.g;
    const F = this.finale;
    const root = g.boat.root;
    const cl = root.worldToLocal(g.cam.alt.pos.clone());
    const ll = root.worldToLocal(g.cam.alt.look.clone());
    const from = { d: Math.hypot(cl.x - F.S.x, cl.z - F.S.z), h: cl.y - BOAT.deckY, phi: Math.atan2(cl.z - F.S.z, cl.x - F.S.x), look: ll };
    // 近景的方向：从看整个甲板的那一侧，但别太斜（镜头绕得少、推过去顺）
    from.phi = clamp(from.phi, -2.2, 2.2);
    return from;
  }

  // 压轴揭完（revealDone）：把它加进总数，记下这一甲板
  finaleDone(entries) {
    if (!this.on) return;
    const F = this.finale;
    if (entries) this.entriesAll.push(...entries);
    if (F) {
      this.total += F.value;
      // 拉回大视野：总数牌回来，压轴这一包的价飞进去（大一号的铜钱）
      this.el.classList.remove('dim');
      // 从压轴里最值钱的那件东西身上起飞（泥包本身崩开以后已经不在甲板上了）
      const main = (entries || []).filter((e) => e.it && e.it.model).sort((x, y) => (y.def.value || 0) - (x.def.value || 0))[0];
      const from = main ? main.it.model.group.getWorldPosition(new THREE.Vector3()) : this.g.boat.root.localToWorld(new THREE.Vector3(F.S.x, BOAT.deckY, F.S.z));
      from.y += main ? main.it.h * 0.6 : 0.4;
      this.g.later(0.05, () => { if (this.on) this.coinIn(from, F.value, true); });
    }
    this.finish();
  }

  // 铜钱飞进总数牌：from 是世界里那件东西的位置；落进去时总数加上 v、牌子一跳
  coinIn(from, v, big) {
    const g = this.g;
    const p = g.project(from);
    const at = p.z < 1 ? { x: clamp(p.x, 40, 1880), y: clamp(p.y, 60, 1040) } : { x: 960, y: 600 };
    // 铜钱冒出来的地方不压着货签（签上的名字和价要读得到）：压着就挪到签的正下方
    const st = document.getElementById('stage').getBoundingClientRect();
    const k = st.width / 1920;
    for (let n = 0; n < 3; n++) {
      const hit = g.reveal.labels.map((l) => l.el.getBoundingClientRect()).filter((r) => r.width > 0)
        .map((r) => ({ l: (r.left - st.left) / k, r: (r.right - st.left) / k, t: (r.top - st.top) / k, b: (r.bottom - st.top) / k }))
        .find((r) => at.x + 70 > r.l && at.x - 70 < r.r && at.y + 30 > r.t && at.y - 30 < r.b);
      if (!hit) break;
      at.y = Math.min(1040, hit.b + 34);
    }
    g.ui.coinFly(at, this.el.querySelector('.it .ic') || this.el.querySelector('.it'), v, big, () => {
      if (!this.on) return;
      this.shown += v;
      this.el.querySelector('b').textContent = String(this.shown);
      this.el.classList.remove('bump', 'bump2');
      void this.el.offsetWidth;
      this.el.classList.add(big ? 'bump2' : 'bump');
      g.audio.play('ribbon');
    });
  }

  finish() {
    const g = this.g;
    if (this.phase === 'end') return;
    this.phase = 'end';
    g.crew.endBatch();
    if (g.cam.alt.w > 0.5 && !g.reveal.active) g.cam.blendTo(0, 1.4);
    if (this.hoseOn) { this.hoseOn = false; g.audio.loop('hose', false, { cut: true }); }
    const best = this.entriesAll.slice().sort((x, y) => (y.def.value || 0) - (x.def.value || 0))[0] || null;
    this.result = { total: this.total, n: this.entriesAll.length, best, entries: this.entriesAll.slice(), fuel: g.trip.fuel, fuel0: this.fuel0, finale: this.finale ? this.finale.value : 0 };
    g.events.emit('batchDone', this.result);
  }

  // 总数牌在画面上占的那一块：揭出来的签不往这儿挂
  zone() {
    if (!this.on || !this.el.classList.contains('on') || this.el.classList.contains('dim')) return null;
    const st = document.getElementById('stage').getBoundingClientRect();
    const r = this.el.getBoundingClientRect();
    const k = st.width / 1920;
    return [(r.left - st.left) / k - 12, (r.top - st.top) / k - 12, (r.right - st.left) / k + 12, (r.bottom - st.top) / k + 12];
  }

  // 结算出来以后：总数牌收起（结算牌接着说）
  close() {
    this.on = false;
    this.el.classList.remove('on', 'dim');
  }
}
