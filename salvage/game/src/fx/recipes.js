// 每个效果在真实场景里怎么摆：一个生成器，每 yield 一次 = 游戏走一帧。
// 先快进（只算不画）到效果开始前一点点，yield SHOW，之后正常放到这个效果演完。
// 操作全走游戏自己的虚拟手柄（和自动演示的机器人同一个口子），不直接改游戏状态；
// 只有「把船摆到某处」这种开场摆位是直接设的（和 tools/stage.mjs 一样）。
import { pilot } from '../game/pilot.js';
import * as THREE from 'three';
import { WRECK, SHOAL, SHOAL_MARK, TRAIL, HIDDEN_TIMBER, wreckToWorld, SEAL_SPOT, LEVIATHAN_PATH, START, trenchZ } from '../sea/index.js';
import { ITEM_DEFS } from '../game/itemdefs.js';
import { seabedY } from '../world/terrain.js';
import { VIEW_W, VIEW_H, PULLBACK_T } from '../config.js';
import { Bot } from '../game/bot.js';
import { placeOf } from '../sea/index.js';
import { DEMO_SUMMARY_WAIT } from '../ui/menus.js';

export const SHOW = Symbol('show');

export class Stager {
  constructor(g, page) {
    this.g = g;
    this.page = page;
    this.v = { lx: 0, ly: 0, rx: 0, ry: 0, zoom: 0, a: false, aHeld: false, b: false, start: false };
    this.dt = 1 / 30;
    g.input.botDriven = true;
    g.input.virtual = this.v;
  }

  release() {
    this.g.input.botDriven = false;
    this.g.input.virtual = null;
  }

  *wait(t) {
    while (t > 1e-6) { t -= this.dt; yield; }
  }

  *until(fn, max = 60) {
    let t = 0;
    while (!fn() && t < max) { t += this.dt; yield; }
  }

  press(k) { this.v[k] = true; }
  // 键盘上的一下（Esc 之类虚拟手柄上没有的键）
  key(code) { this.g.input.edges.add(code); }
  // 摇杆拨一下就回中（菜单挪一格）
  *tap(x, y) {
    this.v.lx = x; this.v.ly = y;
    yield; yield;
    this.v.lx = 0; this.v.ly = 0;
    yield;
  }
  stick(x, y) { this.v.lx = x; this.v.ly = y; }
  look(x, y = 0) { this.v.rx = x; this.v.ry = y; }
  hold(on) { this.v.aHeld = on; }
  clear() { Object.assign(this.v, { lx: 0, ly: 0, rx: 0, ry: 0, zoom: 0, aHeld: false }); }

  item(id) { return this.g.items.items.find((i) => i.id === id); }

  // 把船停到目标点的某一方向 R 米处，船身横对目标（目标在右舷）；镜头从 yawOff 偏一点看过去
  place(tx, tz, ang, R, o = {}) {
    const g = this.g;
    // 摆过去的地方算「已经到过」：别的效果的地名横幅不来凑热闹（要演到站的效果传 story: true）
    if (!o.story) Object.assign(g.flags, { shoal: true, wreck: true, slope: true, trailIdx: TRAIL.length });
    const x = tx + Math.cos(ang) * R, z = tz + Math.sin(ang) * R;
    const dx = tx - x, dz = tz - z;
    const toT = Math.atan2(-dz, dx);
    const side = o.side ?? 1;
    const h = o.heading ?? toT + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
    g.boatCtl.reset(x, z, h);
    g.boatCtl.update(0.016, {}, 1, g.time);
    g.cam.yawT = o.yaw ?? Math.atan2(-dx, -dz) + (o.yawOff || 0);
    g.cam.pitchT = o.pitch ?? 0.8;
    if (o.dist) g.cam.distT = o.dist;
    g.cam.pivotT.set(x, 0, z);
    g.cam.snapTo();
    if (o.arm) {
      g.mode = 'arm';
      g.ui.setMode('arm');
      const c = Math.cos(h), s = Math.sin(h);
      g.arm.setLocal(dx * c - dz * s, dx * s + dz * c);
    }
    g.boat.root.updateMatrixWorld(true);
    const n = g.netop;
    if (n.phase === 'idle') { n.netPos.copy(n.hookWorld()); n.netPos.y -= 2.8; }
    return { x, z, h };
  }

  // 镜头跟着船身走、不往前领（看船上的人）
  followBoat(dx = 0, dz = 0) {
    const bc = this.g.boatCtl;
    this.g.camAt = { get x() { return bc.pos.x + dx; }, y: 0, get z() { return bc.pos.z + dz; } };
  }

  // 开船：朝世界里的某个方向开（照载具求生的开法按 W、S、A、D）
  steer(wx, wz, m = 1) {
    const q = pilot(this.g.boatCtl, wx, wz, m);
    this.v.lx = q.mx;
    this.v.ly = q.my;
  }

  *steerFor(t, wx, wz, m = 1) {
    while (t > 1e-6) { this.steer(wx, wz, m); t -= this.dt; yield; }
    this.stick(0, 0);
  }

  // 白圈往世界里的某个方向挪（打捞模式里玩家用鼠标挪的那样，每秒 5.2 米），吊臂自己追过去
  *armFor(t, wx, wz, m = 1) {
    const l = Math.hypot(wx, wz) || 1;
    while (t > 1e-6) {
      const out = this.g.arm.nudge((wx / l) * 5.2 * m * this.dt, (wz / l) * 5.2 * m * this.dt);
      if (out && !this.outWas) { this.g.audio.play('reachBump'); this.g.cue('A19'); }
      this.outWas = out;
      t -= this.dt;
      yield;
    }
    this.outWas = false;
  }

  aim(x, z) {
    const g = this.g;
    const bc = g.boatCtl;
    const c = Math.cos(bc.heading), s = Math.sin(bc.heading);
    const dx = x - bc.pos.x, dz = z - bc.pos.z;
    g.arm.setLocal(dx * c - dz * s, dx * s + dz * c);
  }

  // —— 常用的开场 ——
  // 浅滩：臂端对着半埋的铜信筒（第一网的地方）
  *shoalArm(o = {}) {
    const it = this.item('tube');
    this.place(it.x + 0.3, it.z + 0.2, o.ang ?? 2.4, o.R ?? 8.2, { arm: true, pitch: o.pitch ?? 0.95, yawOff: o.yawOff ?? 0.75, dist: o.dist ?? 26 });
    yield* this.wait(1.2);
  }

  // 沉船舱里：臂端对着银币匣
  *holdArm(o = {}) {
    const ch = this.item('chest');
    this.place(ch.x - 0.55, ch.z + 0.45, Math.PI * 0.97, 8.0, { arm: true, pitch: o.pitch ?? 1.1, yawOff: o.yawOff ?? 0.95, dist: o.dist ?? 30 });
    yield* this.wait(1.2);
  }

  // 沉船外侧：两只陶罐和缆绳卷
  *outerArm(o = {}) {
    const a = this.item('jar'), b = this.item('jar2');
    const x = (a.x + b.x) / 2, z = (a.z + b.z) / 2;
    this.place(x, z, o.ang ?? 0.35, 8.4, { arm: true, pitch: o.pitch ?? 0.95, yawOff: o.yawOff ?? 0.8, dist: o.dist ?? 28 });
    yield* this.wait(1.2);
  }

  // 下网：按 A，等到某个阶段
  *drop(untilFn, max = 40) {
    this.press('a');
    yield;
    // 按了下网要等吊臂走到、船停稳才真的落：落下去以后再看后面的条件
    yield* this.until(() => !this.g.castQ, 12);
    if (untilFn) yield* this.until(untilFn, max);
  }

  // 一整网：从按 A 到冲洗开始/揭晓/展示……（phase 是 reveal 的阶段名）
  *toReveal(phase, extra = 0, hold = false) {
    const g = this.g;
    this.press('a');
    yield;
    yield* this.until(() => g.reveal.cur && (phase === 'land' || g.reveal.cur.phase === phase || (phase === 'wash' && g.reveal.cur.phase !== 'land')), 60);
    if (hold) this.hold(true);
    if (extra) yield* this.until(() => g.reveal.cur && g.reveal.cur.w >= extra, 20);
  }
}

const near = (g, x, z, r) => Math.hypot(g.boatCtl.pos.x - x, g.boatCtl.pos.z - z) < r;

// ===================== 每个编号的摆法 =====================
export const RECIPES = {};
const R = RECIPES;

// —— B 每一网 ——
R.B01 = function* (S) {
  yield* S.shoalArm();
  yield* S.wait(0.6);
  yield SHOW;
  yield* S.wait(0.4);
  S.press('a');
  yield;
  yield* S.wait(2.2);
};

R.B02 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => g.netop.netPos.y < 2.2);
  yield SHOW;
  yield* S.until(() => g.netop.phase === 'sink');
  yield* S.wait(2.4);
};

// 等网走到某个阶段（netop 的 phase）
const netIs = (g, ph) => g.netop.phase === ph;
const rv = (g) => g.reveal.cur;
const rvIs = (g, ph) => !!g.reveal.cur && g.reveal.cur.phase === ph;

// 开阔海底上的一网（什么都兜不到）
function* emptyArm(S) {
  const x = -38, z = 2;
  S.place(x, z, 2.0, 8.6, { arm: true, pitch: 1.0, dist: 26, yawOff: 0.4 });
  yield* S.wait(1.2);
}

// 坡下：网口罩在埋着的船材上
function* hardArm(S) {
  S.place(11.7, 22.3, -1.75, 8.6, { arm: true, pitch: 1.1, dist: 22, yawOff: 1.4 });
  yield* S.wait(1.2);
}

// 沉船舷边：等蟹走进网口、套上金圈再下网
function* crabArm(S) {
  const g = S.g;
  yield* S.until(() => g.trip.time >= 10.6, 20);
  const P = wreckToWorld(-0.6, 7.05);
  S.place(P.x, P.z, 0.2, 8.6, { arm: true, pitch: 1.0, dist: 24, yawOff: -0.8 });
  yield* S.until(() => g.forecast.marks.some((k) => k.crab && k.k === 'yes'), 40);
}

R.B03 = function* (S) {
  const g = S.g;
  yield* S.holdArm();
  yield* S.drop(() => g.netop.netPos.y < 1.4);
  yield SHOW;
  yield* S.until(() => netIs(g, 'touch'));
  yield* S.wait(0.5);
};

R.B04 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => netIs(g, 'sink') && g.netop.netPos.y < g.netop.ev.restY + 2.2);
  yield SHOW;
  yield* S.until(() => netIs(g, 'close'));
  yield* S.wait(2.6);
};

R.B05 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => netIs(g, 'touch'));
  yield SHOW;
  yield* S.until(() => netIs(g, 'lift'));
  yield* S.wait(0.4);
};

R.B06 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => netIs(g, 'close') && g.netop.t > 0.45);
  yield SHOW;
  yield* S.until(() => netIs(g, 'lift'));
  yield* S.wait(2.6);
};

R.B07 = function* (S) {
  const g = S.g;
  yield* S.outerArm();
  yield* S.drop(() => netIs(g, 'close') && g.netop.t > 0.5);
  yield SHOW;
  yield* S.until(() => netIs(g, 'swing'));
  yield* S.wait(0.3);
};

R.B08 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => netIs(g, 'lift') && g.netop.netPos.y > -2.6);
  yield SHOW;
  yield* S.until(() => netIs(g, 'swing'));
  yield* S.wait(0.6);
};

R.B09 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  // 网环快出水（出水那一刻吊臂就开始往回转）
  yield* S.drop(() => netIs(g, 'lift') && g.netop.netPos.y > -0.4);
  yield SHOW;
  yield* S.until(() => !!rv(g));
  yield* S.wait(0.2);
};

R.B10 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => netIs(g, 'set'));
  yield SHOW;
  yield* S.until(() => rvIs(g, 'wash'));
  yield* S.wait(0.4);
};

R.B11 = function* (S) {
  const g = S.g;
  yield* S.outerArm();
  // 网包快吊到甲板上方（镜头这时开始往近景推）的前一点开始；先停在看得见网包砸下来的地方，砸完接着推到冲洗近景
  yield* S.drop(() => netIs(g, 'swing') && g.netop.homeGo && g.netop.toDeck < 2.4, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'wash'), 20);
  yield* S.wait(0.9);
};

R.B12 = function* (S) {
  const g = S.g;
  yield* S.outerArm();
  yield* S.drop(() => rvIs(g, 'land') && rv(g).t > 0.25, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'show'), 20);
  yield* S.wait(0.7);
};

R.B13 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => rvIs(g, 'wash') && rv(g).w > 0.05, 60);
  yield SHOW;
  yield* S.wait(0.5);
  S.hold(true);
  yield* S.until(() => rvIs(g, 'show'), 20);
  S.hold(false);
  yield* S.wait(0.4);
};

R.B14 = function* (S) {
  const g = S.g;
  yield* S.outerArm();
  // 从看清是什么的前一点（排好的最后一块快崩时）开始，一直到拉回
  yield* S.drop(() => rvIs(g, 'wash') && rv(g).w > (rv(g).bundle.revealAt ?? 0.82) - 0.1, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'pull') && rv(g).t > 0.3, 20);
};

R.B15 = function* (S) {
  const g = S.g;
  g.firsts.empty = true;
  yield* emptyArm(S);
  yield* S.drop(() => rvIs(g, 'wash') && rv(g).w > 0.35, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'pull'), 20);
  yield* S.wait(0.3);
};

R.F06 = function* (S) {
  const g = S.g;
  yield* emptyArm(S);
  yield* S.drop(() => rvIs(g, 'wash') && rv(g).w > 0.35, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'pull'), 20);
  yield* S.wait(0.3);
};

R.B16 = function* (S) {
  const g = S.g;
  g.firsts.crab = true;
  yield* crabArm(S);
  yield* S.drop(() => netIs(g, 'lift') && g.netop.netPos.y > -3.2);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'show') && rv(g).t > 1.4, 40);
};

R.F05 = function* (S) {
  const g = S.g;
  yield* crabArm(S);
  // 从网包吊过船舷起：在空中、落上甲板、冲洗前都挣得比以后明显
  yield* S.drop(() => netIs(g, 'swing'), 60);
  yield* S.wait(0.6);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'show') && rv(g).t > 1.8, 40);
};

R.B21 = function* (S) {
  const g = S.g;
  g.firsts.crab = true;
  yield* crabArm(S);
  yield* S.drop(() => rvIs(g, 'pull'), 60);
  // 这一条换个机位：收臂开船，从右舷这边看水槽（左舷看过去水槽正好被吊机挡住），拉近一点
  // 抱蟹的人离水槽还有几步时开始
  yield* S.wait(0.3);
  S.press('b');
  yield;
  g.cam.yawT += Math.PI;
  g.cam.distT = 16;
  g.cam.pitchT = 0.78;
  const carrier = () => g.crew.sailors.find((s) => s.task && s.task.kind === 'carry' && s.task.e.crab);
  yield* S.until(() => {
    const s = carrier();
    if (!s || s.task.step !== 'walk') return false;
    const d = s.task.e.dest();
    return Math.hypot(s.x - d.x, s.z - d.z) < 2.2;
  }, 20);
  yield SHOW;
  yield* S.until(() => g.reveal.tankCrabs.length > 0, 20);
  yield* S.wait(2.6);
};

R.B17 = function* (S) {
  const g = S.g;
  yield* S.outerArm();
  yield* S.drop(() => rvIs(g, 'show') && rv(g).t > 0.25, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'pull'), 20);
  yield* S.wait(0.2);
};

R.B18 = function* (S) {
  const g = S.g;
  yield* S.outerArm();
  yield* S.drop(() => rvIs(g, 'show') && rv(g).t > rv(g).showT - 0.35, 60);
  yield SHOW;
  yield* S.until(() => !rv(g), 20);
  yield* S.wait(0.25);
  S.press('b');
  yield* S.wait(2.4);
};

R.B19 = function* (S) {
  const g = S.g;
  g.trip.record([{ kind: 'rope', def: { value: 12, name: '旧缆绳卷' } }]);
  yield* S.outerArm();
  yield* S.drop(() => rvIs(g, 'pull') && rv(g).t > 0.35, 60);
  yield SHOW;
  yield* S.wait(2.2);
};

R.F02 = function* (S) {
  const g = S.g;
  yield* S.shoalArm();
  yield* S.drop(() => rvIs(g, 'pull') && rv(g).t > 0.35, 60);
  yield SHOW;
  yield* S.wait(6.4);
};

R.B20 = function* (S) {
  const g = S.g;
  yield* S.outerArm({ yawOff: 1.1, dist: 30 });
  yield* S.drop(() => !rv(g) && g.netop.phase === 'idle', 60);
  yield* S.wait(0.3);
  S.press('b');
  yield;
  // 拉近一点看舱口（玩家自己也能滚轮拉近）
  g.cam.distT = 17;
  g.cam.pitchT = 0.82;
  yield* S.until(() => g.reveal.cargo.some((c) => c.taken && c.localPos().x < 0.4), 12);
  yield SHOW;
  yield* S.until(() => g.reveal.cargo.every((c) => c.done || c.crab), 20);
  yield* S.wait(1.0);
};

R.B22 = function* (S) {
  const g = S.g;
  const enq = g.crew.enqueue;
  g.crew.enqueue = () => {};
  yield* S.shoalArm();
  yield* S.drop(() => !rv(g) && g.netop.phase === 'idle', 60);
  const it = S.item('pulley') || S.item('hinge');
  if (it) S.aim(it.x, it.z);
  yield* S.wait(0.6);
  // 拉近一点看甲板（玩家自己也能滚轮拉近）
  yield* S.drop(() => netIs(g, 'swing'), 60);
  g.cam.distT = 13;
  yield* S.until(() => netIs(g, 'swing') && g.netop.t > 0.35, 60);
  g.crew.enqueue = enq;
  yield SHOW;
  yield* S.until(() => rvIs(g, 'wash'), 10);
  yield* S.wait(0.6);
};

R.B23 = function* (S) {
  const g = S.g;
  g.firsts.hard = true;
  yield* hardArm(S);
  yield* S.drop(() => netIs(g, 'touch'), 40);
  yield SHOW;
  yield* S.until(() => netIs(g, 'lift'), 10);
  yield* S.wait(2.4);
};

R.F07 = function* (S) {
  const g = S.g;
  yield* hardArm(S);
  yield* S.drop(() => netIs(g, 'touch'), 40);
  yield SHOW;
  yield* S.until(() => netIs(g, 'lift'), 10);
  yield* S.wait(2.4);
};

// —— 银币匣：预兆、露头、确认、展开、留下 ——
// —— 出发、找、到达 ——
R.C01 = function* (S) {
  const g = S.g;
  // 从港外航路往浅滩开：进浅滩 24 米那一刻，左上比例尺一节节画出来、「通透浅滩」滑进来，远远一声钟
  const ang = Math.PI + 0.42;
  S.place(SHOAL.x, SHOAL.z, ang, 50, { story: true, heading: Math.atan2(Math.sin(ang), -Math.cos(ang)), pitch: 0.8, dist: 30, yawOff: 0.35 });
  Object.assign(g.flags, { shoal: false, wreck: false, slope: false, trailIdx: 0, wreckNets: 0 });
  const f = fwdOf(g).clone();
  yield* S.until(() => { S.steer(f.x, f.z, 0.8); return Math.hypot(g.boatCtl.pos.x - SHOAL.x, g.boatCtl.pos.z - SHOAL.z) < 26.5; }, 20);
  yield SHOW;
  yield* S.steerFor(4.6, f.x, f.z, 0.8);
};

R.C02 = function* (S) {
  const g = S.g;
  // 顺着船板往东南：船从这块船板旁边开过去——船板被压下来的水波掀一下，一边翘起、翻两下落回去，扬起一点沙，
  // 翘起时湿木头亮一下；箭头「咔」地转向下一块
  const a = TRAIL[1], b = TRAIL[2];
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
  const ux = dx / d, uz = dz / d, px = -uz, pz = ux;
  // 船道偏开船板 5 米，船身不挡着它
  const x0 = b.x - ux * 26 + px * 5, z0 = b.z - uz * 26 + pz * 5;
  S.place(b.x, b.z, Math.atan2(-dz, -dx), 24, { story: true, pitch: 0.85, dist: 28 });
  g.boatCtl.reset(x0, z0, Math.atan2(-dz, dx));
  Object.assign(g.flags, { shoal: true, wreck: false, slope: false, trailIdx: 2, wreckNets: 0 });
  g.trip.nets = 1;
  g.feel.lastTrail = 2;
  // 镜头在船板另一侧、隔着它往船道看：船板在画面中间，船从后面水面上开过
  g.cam.minDist = 9;
  const y0 = seabedY(b.x, b.z);
  g.camAt = { x: b.x + px * 1.5, y: y0 + 0.2, z: b.z + pz * 1.5 };
  g.cam.yawT = Math.atan2(-px, -pz) - 0.35;
  g.cam.pitchT = 0.88;
  g.cam.distT = 11;
  g.cam.pivotT.set(g.camAt.x, g.camAt.y, g.camAt.z);
  g.cam.snapTo();
  yield* S.until(() => { S.steer(dx, dz, 0.7); return Math.hypot(g.boatCtl.pos.x - b.x, g.boatCtl.pos.z - b.z) < 14.5; }, 20);
  yield SHOW;
  yield* S.until(() => { S.steer(dx, dz, 0.7); return g.flags.trailIdx > 2; }, 10);
  yield* S.steerFor(1.0, dx, dz, 0.6);
  yield* S.wait(1.8);
};

R.C03 = function* (S) {
  const g = S.g;
  // 顺着船板线索从西边开过来：沉船一进画面——地名大一号、低音弦乐和远处木头吱嘎，镜头慢慢偏过去往水里看，
  // 一道光从船尾扫到船头，光扫过那一截鱼从船肋里炸开；几秒后镜头自己回到船上
  const ang = Math.PI - 0.12;
  S.place(WRECK.x, WRECK.z, ang, 58, { story: true, heading: Math.atan2(Math.sin(ang), -Math.cos(ang)), pitch: 0.82, dist: 30, yawOff: 0.3 });
  Object.assign(g.flags, { shoal: true, wreck: false, slope: false, trailIdx: TRAIL.length, wreckNets: 0 });
  g.trip.nets = 2;
  const f = fwdOf(g).clone();
  // 离 42 米还差一点就开拍
  yield* S.until(() => { S.steer(f.x, f.z, 0.7); return Math.hypot(g.boatCtl.pos.x - WRECK.x, g.boatCtl.pos.z - WRECK.z) < 44.5; }, 30);
  yield SHOW;
  yield* S.steerFor(3.0, f.x, f.z, 0.7);
  // 收一点油门，慢慢漂过去，看完镜头自己回来
  yield* S.steerFor(5.0, f.x, f.z, 0.35);
};

R.C04 = function* (S) {
  const g = S.g;
  // 沉船外侧：那只蟹在印章那块翻泥。翻到印章露出一点——泥上一圈亮环扩开三次、印章那一点亮一下，远处很轻一声「叮」
  const sp = wreckToWorld(SEAL_SPOT.along, SEAL_SPOT.side);
  // 船停在印章外侧（离开船壳那一边），镜头从外往船壳看：印章那块在船壳前面，不被挡
  const ang = Math.atan2(sp.z - WRECK.z, sp.x - WRECK.x);
  S.place(sp.x, sp.z, ang, 15, { pitch: 0.95, dist: 22, yawOff: 0.55 });
  g.camAt = { x: sp.x, y: seabedY(sp.x, sp.z) * 0.5, z: sp.z };
  g.cam.pivotT.set(g.camAt.x, g.camAt.y, g.camAt.z);
  g.cam.snapTo();
  // 翻到一半印章就露出来了（crab.js 的 onDig）：差一点点的时候开拍
  yield* S.until(() => g.crabLife.digDone > 0.42, 120);
  yield SHOW;
  yield* S.until(() => g.flags.crabSaid, 8);
  yield* S.wait(4.2);
};

R.C12 = function* (S) {
  const g = S.g;
  // 在沉船这儿下过两网，按 B 回去开船：箭头第一次指向坡下（船尾、滚落的货那边），
  // 远处深槽上冒上来一大串泡，水面一下翻白、一圈圈波纹，闷闷一声「咕嘟」
  const T = { x: WRECK.x + 11, z: WRECK.z + 25 };
  const ang = Math.atan2(WRECK.z - T.z, WRECK.x - T.x);
  const B = S.place(T.x, T.z, ang, 24, { arm: true, pitch: 0.72, dist: 30, yawOff: 0.2 });
  Object.assign(g.flags, { shoal: true, wreck: true, slope: false, slopeSaid: false, trailIdx: TRAIL.length, wreckNets: 2 });
  g.trip.nets = 3;
  g.camAt = { x: B.x + (T.x - B.x) * 0.42, y: 0, z: B.z + (T.z - B.z) * 0.42 };
  g.cam.pivotT.set(g.camAt.x, 0, g.camAt.z);
  g.cam.snapTo();
  yield* S.wait(1.2);
  yield SHOW;
  yield* S.wait(0.3);
  S.press('b');
  yield;
  yield* S.wait(4.6);
};

R.C13 = function* (S) {
  const g = S.g;
  // 从沉船往深槽开：水色一点点变暗变蓝；浪头的「哗」和风退下去，深水的嗡起来，引擎「突突」带一点从远处回来的回声
  const T = { x: 16, z: 47 };
  const ang = Math.atan2(-0.96, -0.29);
  S.place(T.x, T.z, ang, 42, { heading: Math.atan2(Math.sin(ang), -Math.cos(ang)), pitch: 0.8, dist: 30, yawOff: 0.45 });
  const f = fwdOf(g).clone();
  yield* S.steerFor(1.5, f.x, f.z, 1);
  yield SHOW;
  yield* S.steerFor(5.2, f.x, f.z, 1);
  yield* S.steerFor(1.6, f.x, f.z, 0.3);
};

R.C05 = function* (S) {
  const g = S.g;
  yield* S.holdArm();
  yield* S.drop(() => netIs(g, 'set'), 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'wash'), 10);
  yield* S.wait(1.0);
};

R.C06 = function* (S) {
  const g = S.g;
  yield* S.holdArm();
  // 从露头那一拍的前一点开始，到露头那一下的银光扫完
  yield* S.drop(() => rvIs(g, 'wash') && rv(g).w > (rv(g).bundle.peekAt ?? 0.4) - 0.1, 60);
  yield SHOW;
  yield* S.until(() => (rvIs(g, 'wash') && rv(g).peeked && rv(g).peekT == null) || rvIs(g, 'show'), 10);
  yield* S.wait(0.2);
};

R.C07 = function* (S) {
  const g = S.g;
  yield* S.holdArm();
  // 从看清是银币匣的前一点开始（排好的最后一块快崩时）
  yield* S.drop(() => rvIs(g, 'wash') && rv(g).w > (rv(g).bundle.revealAt ?? 0.86) - 0.05, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'show') && rv(g).t > 2.0, 10);
};

R.C08 = function* (S) {
  const g = S.g;
  yield* S.holdArm();
  yield* S.drop(() => rvIs(g, 'show') && rv(g).t > 0.85, 60);
  yield SHOW;
  yield* S.until(() => rvIs(g, 'pull'), 10);
  yield* S.wait(0.2);
};

R.C09 = function* (S) {
  const g = S.g;
  yield* S.holdArm({ yawOff: 1.15, dist: 32 });
  yield* S.drop(() => rvIs(g, 'show') && rv(g).t > rv(g).showT - 0.2, 60);
  yield* S.until(() => !rv(g), 10);
  yield* S.wait(0.2);
  S.press('b');
  yield;
  // 拉回本身和 B18 一样（B18 那条录了）；这里快进到抱银币匣的人离舱口还有三四步，
  // 拉近一点看他慢慢走过去、匣子沉进舱口、冒出那缕银光
  g.cam.distT = 14;
  g.cam.pitchT = 0.86;
  const chest = () => g.reveal.cargo.find((c) => c.it && c.it.def.precious && !c.done);
  const carrier = () => g.crew.sailors.find((s) => s.task && s.task.kind === 'carry' && s.task.e === chest());
  yield* S.until(() => {
    const s = carrier();
    if (!s || s.task.step !== 'walk') return false;
    const d = chest().dest();
    return Math.hypot(s.x - d.x, s.z - d.z) < 3.4;
  }, 20);
  yield SHOW;
  yield* S.until(() => !chest(), 12);
  yield* S.wait(1.8);
};


// ———————————————— A 开船、调臂、海里一直在的事 ————————————————
// 港外起点：开船模式，船朝东
function* harbor(S, o = {}) {
  const g = S.g;
  g.cam.distT = o.dist ?? 26;
  g.cam.pitchT = o.pitch ?? 0.78;
  // side：镜头转到左舷后方斜看（看得见船身侧面、烟囱和尾迹）
  if (o.side) {
    const f = g.boatCtl.forward;
    const q = o.quarter ?? -0.55;
    const dx = f.z * o.side + f.x * q, dz = -f.x * o.side + f.z * q;
    g.cam.yawT = Math.atan2(dx, dz);
  }
  g.cam.snapTo();
  yield* S.wait(o.wait ?? 1.0);
}
const fwdOf = (g) => g.boatCtl.forward;

R.A01 = function* (S) {
  const g = S.g;
  yield* harbor(S, { dist: 24, pitch: 0.82, side: 1, quarter: 0.35 });
  yield SHOW;
  yield* S.wait(0.5);
  const f = fwdOf(g);
  yield* S.steerFor(2.4, f.x, f.z, 0.75);
  yield* S.wait(2.4);
};

R.A02 = function* (S) {
  const g = S.g;
  // 镜头在右舷稍后、高处：船往画面右边开，往左舷急转后船头朝画面上方
  yield* harbor(S, { dist: 34, pitch: 1.0, side: -1, quarter: -0.3 });
  const f = fwdOf(g).clone();
  const l = new THREE.Vector3(f.z, 0, -f.x);
  yield* S.steerFor(4.2, f.x, f.z, 1);
  // 镜头钉在要急转的那片水上：船从画面里划一道弧，尾迹和外侧那道白都留在画面里
  const p = g.boatCtl.pos;
  g.camAt = { x: p.x + f.x * 11 + l.x * 7, y: 0, z: p.z + f.z * 11 + l.z * 7 };
  g.cam.pivotT.set(g.camAt.x, 0, g.camAt.z);
  g.cam.snapTo();
  yield SHOW;
  yield* S.steerFor(0.9, f.x, f.z, 1);
  // 一个急转：往左舷打满
  yield* S.steerFor(2.4, l.x, l.z, 1);
  yield* S.steerFor(1.2, l.x + f.x * 0.2, l.z + f.z * 0.2, 1);
};

R.A03 = function* (S) {
  const g = S.g;
  // 镜头在左舷前方往后看前甲板（驾驶室在船尾，不挡人），跟着船身（不往前领）
  yield* harbor(S, { dist: 12, pitch: 0.74, side: 1, quarter: 0.55 });
  const f = fwdOf(g).clone();
  S.followBoat(f.x * 1.5, f.z * 1.5);
  g.cam.pivotT.set(g.camAt.x, 0, g.camAt.z);
  g.cam.snapTo();
  yield* S.steerFor(2.8, f.x, f.z, 0.8);
  yield* S.steerFor(0.3, f.x, f.z, 0.8);
  yield SHOW;
  yield* S.steerFor(0.3, f.x, f.z, 0.8);
  // 松开：船一沉减速，人往船头冲一下、回摆一点再站稳
  yield* S.wait(1.6);
  // 往右舷猛打一把：人往船尾仰、往左舷甩，扶栏杆的手一紧
  const r = new THREE.Vector3(-f.z, 0, f.x);
  yield* S.steerFor(1.4, r.x + f.x * 0.3, r.z + f.z * 0.3, 1);
  yield* S.wait(1.2);
};

R.A04 = function* (S) {
  const g = S.g;
  yield* harbor(S, { dist: 15, pitch: 0.78 });
  // 停着看：等有人到点换活前一会儿
  yield* S.until(() => g.crew.sailors.some((s) => !s.task && s.roleT !== undefined && s.roleT < 1.0), 40);
  yield SHOW;
  yield* S.wait(6.5);
};

R.A05 = function* (S) {
  const g = S.g;
  // 浅滩下过一网、顺着船板往东南：船在第 2、3 块船板之间，朝第 3 块开
  const a = TRAIL[1], b = TRAIL[2];
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
  const x0 = b.x - (dx / d) * 24, z0 = b.z - (dz / d) * 24;
  S.place(b.x, b.z, Math.atan2(-dz, -dx), 24, { story: true, pitch: 0.85, dist: 28, yawOff: 0.5 });
  g.boatCtl.reset(x0, z0, Math.atan2(-dz, dx));
  Object.assign(g.flags, { shoal: true, wreck: false, slope: false, trailIdx: 2, wreckNets: 0 });
  g.trip.nets = 1;
  g.feel.lastTrail = 2;
  yield* S.wait(0.5);
  yield* S.until(() => { S.steer(dx, dz, 0.75); return Math.hypot(g.boatCtl.pos.x - b.x, g.boatCtl.pos.z - b.z) < 17; }, 20);
  yield SHOW;
  yield* S.until(() => { S.steer(dx, dz, 0.75); return g.flags.trailIdx > 2; }, 10);
  yield* S.steerFor(1.2, dx, dz, 0.6);
  yield* S.wait(1.4);
};

R.A06 = function* (S) {
  const g = S.g;
  yield* harbor(S, { dist: 28, pitch: 0.9 });
  const f = fwdOf(g).clone();
  yield* S.steerFor(4, f.x, f.z, 1);
  yield SHOW;
  yield* S.wait(4.2);
};

R.A07 = function* (S) {
  const g = S.g;
  yield* S.shoalArm({ dist: 20, pitch: 1.0 });
  // 臂端先往镜头右边挪开，再推回去罩住铜信筒：远时偶尔一闪，罩着时闪得勤
  const rx = Math.cos(g.cam.yaw), rz = -Math.sin(g.cam.yaw);
  yield* S.armFor(0.9, rx, rz, 1);
  yield SHOW;
  yield* S.wait(1.8);
  yield* S.armFor(0.9, -rx, -rz, 1);
  yield* S.wait(3.0);
};

R.A08 = function* (S) {
  const g = S.g;
  // 船开近浅滩的草床：鱼群成片让开、钻进草里，停稳后一条两条游回来。
  // 镜头钉在鱼群上方；船擦着鱼群边上开进画面、停下（不压在鱼群正上方）
  const sc = g.fish.schools[0];
  const ang = -2.6;
  const ax = -Math.cos(ang), az = -Math.sin(ang); // 船开过来的方向
  const T = { x: sc.home.x - az * 7, z: sc.home.z + ax * 7 };
  S.place(T.x, T.z, ang, 26, { pitch: 0.95, dist: 15, yawOff: 1.0 });
  g.camAt = { x: sc.home.x + az * 3, y: seabedY(sc.home.x, sc.home.z) * 0.5, z: sc.home.z - ax * 3 };
  g.cam.pivotT.set(g.camAt.x, g.camAt.y, g.camAt.z);
  g.cam.snapTo();
  yield* S.until(() => { S.steer(ax, az, 0.75); return Math.hypot(g.boatCtl.pos.x - T.x, g.boatCtl.pos.z - T.z) < 15; }, 20);
  yield SHOW;
  yield* S.steerFor(1.6, ax, az, 0.75);
  // 停稳以后：鱼一条两条游回草床
  yield* S.wait(7.5);
};

R.A09 = function* (S) {
  const g = S.g;
  // 浅滩的小蟹：走到一处、两螯轮流扒泥
  const c = g.crabLife.list[1];
  // 船停远一点（画面边上露一角），镜头钉在蟹要去翻泥的那块地上
  const st = c.route.find((r) => r.dig) || c.route[0];
  S.place(st.x, st.z, 2.2, 13, { pitch: 0.9, dist: 7, yawOff: 0.5 });
  g.camAt = { x: (c.pos.x + st.x) / 2, y: seabedY(st.x, st.z) * 0.6, z: (c.pos.z + st.z) / 2 };
  g.cam.pivotT.set(g.camAt.x, g.camAt.y, g.camAt.z);
  g.cam.snapTo();
  yield* S.until(() => c.state === 'walk' && !c.homeBound && c.route[c.stop] === st && Math.hypot(st.x - c.pos.x, st.z - c.pos.z) < 1.3, 60);
  yield SHOW;
  // 走到、停下、两螯轮流扒泥，泥团一股股飘起
  yield* S.until(() => c.state === 'dig', 6);
  yield* S.wait(3.6);
};

R.A10 = function* (S) {
  const g = S.g;
  const p = wreckToWorld(0.6, -0.5);
  const y0 = seabedY(p.x, p.z);
  // 船停开一点，镜头钉在沉船那道缝上方、斜着看：泡从缝里一路升到水面
  S.place(p.x, p.z, 1.2, 15, { pitch: 0.66, dist: 15, yawOff: 0.9 });
  g.camAt = { x: p.x, y: (y0 + 2.5) * 0.5, z: p.z };
  g.cam.pivotT.set(g.camAt.x, g.camAt.y, g.camAt.z);
  g.cam.snapTo();
  yield* S.wait(1.0);
  yield SHOW;
  yield* S.wait(0.5);
  // 沉船缝里冒一串泡（游戏里隔几秒自己冒的就是这一下）
  g.wreckBubbles(0);
  // 录到这串泡升过半程（升到水面要十来秒，破在水面那一下放在页面上自己看）
  yield* S.wait(Math.min(5.5, -(y0 + 2.5) / 1.0 + 1.6));
};

R.A11 = function* (S) {
  const g = S.g;
  yield* harbor(S, { dist: 24, pitch: 0.7 });
  yield SHOW;
  yield* S.wait(0.6);
  // 港外：一只海鸥从画面一边飞过去，叫两三声
  g.feel.gullCall(true);
  yield* S.until(() => !g.feel.gull.on, 10);
  yield* S.wait(0.5);
};

R.A12 = function* (S) {
  const g = S.g;
  // 顺着沉船的长轴从船头那边开过去：测深图先滚满一屏（海底慢慢变浅），
  // 开拍后海底剖面爬上船壳、硬底一道黄，上面那群鱼一串青点
  const ax = -0.32, az = -0.95; // 沉船船头的方向
  const c = wreckToWorld(0, 0);
  S.place(c.x, c.z, Math.atan2(az, ax), 62, { heading: Math.atan2(az, -ax), pitch: 0.9, dist: 22 });
  yield* S.steerFor(11.5, -ax, -az, 0.65);
  yield SHOW;
  yield* S.steerFor(6.5, -ax, -az, 0.65);
};

R.A13 = function* (S) {
  const g = S.g;
  yield* harbor(S, { dist: 26, pitch: 0.8 });
  const f = fwdOf(g).clone();
  yield* S.steerFor(2.5, f.x, f.z, 1);
  yield SHOW;
  yield* S.steerFor(5, f.x, f.z, 1);
};

R.A14 = function* (S) {
  const g = S.g;
  // 镜头在左舷侧面：按 A 后吊臂从船头「嗡」地甩向画面里面那一侧（右舷）
  yield* harbor(S, { dist: 24, pitch: 0.8, side: 1, quarter: -0.25 });
  const f = fwdOf(g).clone();
  yield* S.steerFor(2.0, f.x, f.z, 0.6);
  yield SHOW;
  yield* S.steerFor(0.6, f.x, f.z, 0.6);
  S.press('a');
  yield;
  yield* S.wait(3.0);
};

R.A25 = function* (S) {
  const g = S.g;
  // 船在浅滩上全速开着、打捞模式里照样开（白圈在船头前方）；不松油门就按下网：自动刹停——挂倒挡、船尾的水被倒转的桨搅起来
  const it = S.item('tube');
  const ang = 2.4, R = 30;
  const x = it.x + Math.cos(ang) * R, z = it.z + Math.sin(ang) * R;
  S.place(it.x, it.z, ang, R, { heading: Math.atan2(-(it.z - z), it.x - x), yawOff: 1.25, pitch: 0.82, dist: 26 });
  S.followBoat();
  yield* S.wait(0.5);
  const f = fwdOf(g).clone();
  yield* S.steerFor(2.0, f.x, f.z, 1);
  S.press('a');
  yield;
  yield* S.steerFor(0.9, f.x, f.z, 1);
  yield SHOW;
  yield* S.steerFor(0.4, f.x, f.z, 1);
  S.press('a');
  yield;
  yield* S.wait(3.0);
};

R.A15 = function* (S) {
  const g = S.g;
  yield* S.shoalArm({ dist: 24 });
  yield SHOW;
  yield* S.wait(0.6);
  S.press('b');
  yield;
  yield* S.wait(2.0);
};

R.A16 = function* (S) {
  const g = S.g;
  // 沉船外：臂端从空沙地挪到船壳上，网口那一圈被挡住的一段变红
  const p = wreckToWorld(-2, 7.5);
  const q = wreckToWorld(-2, 3.2);
  S.place(p.x, p.z, -0.3, 8, { arm: true, pitch: 1.0, dist: 22, yawOff: 0.6 });
  yield* S.wait(1.0);
  yield SHOW;
  yield* S.wait(0.8);
  yield* S.armFor(1.4, q.x - p.x, q.z - p.z, 1);
  yield* S.wait(1.6);
};

R.A17 = function* (S) {
  const g = S.g;
  yield* S.shoalArm({ dist: 20, pitch: 1.0 });
  const it = S.item('tube');
  const tip = g.arm.tipWorld();
  const ox = tip.x - it.x, oz = tip.z - it.z;
  yield* S.armFor(0.8, -oz, ox, 1);
  yield* S.wait(0.6);
  yield SHOW;
  yield* S.wait(0.5);
  yield* S.armFor(0.8, oz, -ox, 1);
  yield* S.wait(2.0);
};

R.A18 = function* (S) {
  const g = S.g;
  yield* crabArm(S);
  // 金圈套着蟹，等它自己走开：圈慢慢褪成灰、叉画上去
  yield SHOW;
  yield* S.until(() => g.forecast.marks.some((k) => k.crab && k.k === 'no'), 14);
  yield* S.wait(1.6);
};

R.A19 = function* (S) {
  const g = S.g;
  yield* S.shoalArm({ dist: 30, pitch: 1.0 });
  const c = g.boatCtl.localToWorld(new THREE.Vector3(0.6, 0, 0));
  const tip = g.arm.tipWorld();
  const ox = tip.x - c.x, oz = tip.z - c.z;
  yield* S.armFor(0.5, ox, oz, 1);
  yield SHOW;
  yield* S.wait(0.3);
  yield* S.armFor(1.2, ox, oz, 1);
  yield* S.wait(0.5);
  yield* S.armFor(0.9, ox, oz, 1);
  yield* S.wait(0.8);
};

R.A20 = function* (S) {
  const g = S.g;
  yield* S.shoalArm({ dist: 22, pitch: 1.0 });
  const it = S.item('tube');
  const tip = g.arm.tipWorld();
  const ox = tip.x - it.x, oz = tip.z - it.z;
  yield* S.armFor(1.0, -oz, ox, 1);
  yield SHOW;
  yield* S.wait(0.4);
  yield* S.armFor(2.0, oz, -ox, 0.8);
  yield* S.wait(1.2);
};

R.A21 = function* (S) {
  const g = S.g;
  // 臂端压在沉船船壳上按 A：闷的木头「咚」；挪到沙地上、油不够这一网再按：空油管「咕」
  const p = wreckToWorld(-2, 3.2);
  S.place(p.x, p.z, -0.3, 8, { arm: true, pitch: 1.0, dist: 22, yawOff: 0.6 });
  yield* S.wait(1.0);
  yield SHOW;
  yield* S.wait(0.4);
  S.press('a');
  yield;
  yield* S.wait(1.6);
  const q = wreckToWorld(-2, 7.6);
  yield* S.armFor(1.1, q.x - p.x, q.z - p.z, 1);
  // 油还够浅处下一网（不收尾），但不够这一网
  g.trip.fuel = Math.min(g.trip.fuel, 7);
  yield* S.wait(0.4);
  S.press('a');
  yield;
  yield* S.wait(1.8);
};

R.A22 = function* (S) {
  const g = S.g;
  yield* S.shoalArm({ dist: 24 });
  S.press('a');
  yield;
  yield* S.until(() => netIs(g, 'sink'), 10);
  yield SHOW;
  yield* S.wait(0.4);
  S.press('b');
  yield;
  yield* S.wait(1.2);
  S.stick(0.9, 0);
  yield* S.wait(0.3);
  S.stick(0, 0);
  yield* S.wait(1.4);
};

R.A23 = function* (S) {
  const g = S.g;
  // 浅滩的小蟹（亮、看得清）：等它走到离窝几米的一处停下，网落在它外侧三米、不罩着它。
  // 触底那一下惊到它：原地举螯「咔咔」两下，横着溜回窝、钻进沙里；过两三秒眼柄先冒出来张望，再整只拱出来照原路走。
  const c = g.crabLife.list[1];
  const H = c.home;
  const far = () => Math.hypot(c.pos.x - H.x, c.pos.z - H.z);
  yield* S.until(() => (c.state === 'dig' || c.state === 'pause') && far() > 2.4, 60);
  c.timer = Math.max(c.timer, 8);
  const d = far(), ux = (c.pos.x - H.x) / d, uz = (c.pos.z - H.z) / d;
  const N = { x: c.pos.x + ux * 3, z: c.pos.z + uz * 3 };
  // 镜头斜着看「窝—蟹—网」这条线：网在右上、窝在左下，蟹斜着跑下来（网旁的进度圈压不到它）；船在镜头底下，看不见
  const ca = Math.cos(0.55), sa = Math.sin(0.55);
  const vx = uz * ca + ux * sa, vz = -ux * ca + uz * sa;
  // 小蟹只有半米宽：效果页把镜头放近到 9 米（游戏里最近 13 米）
  g.cam.minDist = 9;
  S.place(N.x, N.z, Math.atan2(-vz, -vx), 8.6, { arm: true, pitch: 0.95, dist: 9.5 });
  S.aim(N.x, N.z);
  const y0 = seabedY(c.pos.x, c.pos.z);
  g.camAt = { x: H.x + (N.x - H.x) * 0.32, y: y0 * 0.55, z: H.z + (N.z - H.z) * 0.32 };
  g.cam.yawT = Math.atan2(-vx, -vz);
  g.cam.pivotT.set(g.camAt.x, g.camAt.y, g.camAt.z);
  g.cam.snapTo();
  yield* S.wait(0.3);
  S.press('a');
  yield;
  yield* S.until(() => netIs(g, 'sink') && g.netop.netPos.y < seabedAt(g) + 1.6, 20);
  yield SHOW;
  // 游戏里网触底就自己收、镜头跟着网上去；这里让网在底上多躺一会儿，镜头一直看着蟹演完
  const hold = function* (gen) { for (const _ of gen) { if (netIs(g, 'touch')) g.netop.t = 0; yield _; } };
  yield* hold(S.until(() => c.state === 'flee', 4));
  yield* hold(S.until(() => c.state === 'hide', 8));
  // 钻进去、眼柄冒头张望、拱出来、照原路走开几步
  yield* hold(S.until(() => c.state !== 'hide', 8));
  yield* hold(S.wait(2.0));
};
const seabedAt = (g) => g.netop.ev ? g.netop.ev.restY : -10;

R.A24 = function* (S) {
  const g = S.g;
  // 停在浅滩什么都不按：每隔十来秒总有一件小事
  const sc = g.fish.schools[0];
  S.place(sc.home.x, sc.home.z, -2.4, 12, { pitch: 0.95, dist: 24, yawOff: 0.6 });
  yield* S.until(() => g.feel.stillT > 4 && g.feel.idleT < 0.6, 40);
  yield SHOW;
  yield* S.wait(7);
};

// —— 逼近的威胁：油还够几网（W01）——
R.W01 = function* (S) {
  const g = S.g;
  // 往浅滩的铜信筒开：油只剩「还够 2 网」——数字和油位管的玻璃橙红、管子慢慢闪、低音心跳 70；
  // 开着开着真烧掉的油跨过一网：新数字「1」从上面落下来、转红、管子闪得急、心跳 95；
  // 停船调臂对准信筒：这一网会用掉最后一网，油量条上要扣的那一截是红的
  const it = S.item('tube');
  const ang = 2.75;
  S.place(it.x, it.z, ang, 19, { heading: Math.atan2(Math.sin(ang), -Math.cos(ang)), pitch: 0.82, dist: 24, yawOff: -0.55 });
  g.trip.fuel = 13.6;
  const f = fwdOf(g).clone();
  // 刚好跨过 12（两网 → 一网）前一点开始
  yield* S.until(() => { S.steer(f.x, f.z, 1); return g.trip.fuel < 12.45; }, 6);
  yield SHOW;
  yield* S.steerFor(2.4, f.x, f.z, 1);
  yield* S.wait(0.5);
  S.press('a');
  yield;
  S.aim(it.x, it.z);
  yield* S.wait(3.2);
};

// —— 逼近的威胁：深槽里那个东西（W02、C10、C11）——
// 船停在沉船南边、船头朝东；镜头从船北边往南看，深槽上沿在画面上半，它从画面左边（东）游进来往右走
function* levStage(S, o = {}) {
  const g = S.g;
  const bc = g.boatCtl;
  Object.assign(g.flags, { shoal: true, wreck: true, slope: true, trailIdx: TRAIL.length });
  const B = o.boat || { x: 6, z: 10 };
  bc.reset(B.x, B.z, o.heading ?? 0);
  bc.update(0.016, {}, 1, g.time);
  g.boat.root.updateMatrixWorld(true);
  g.cam.yawT = o.yaw ?? Math.PI + 0.85;
  g.cam.pitchT = o.pitch ?? 0.74;
  g.cam.distT = o.dist ?? 36;
  g.camAt = o.at || { x: B.x + 7, y: -4, z: B.z + 6.5 };
  g.cam.pivotT.set(g.camAt.x, g.camAt.y, g.camAt.z);
  g.cam.snapTo();
  // 先静静停几秒：测深图滚满一屏（不然开头左半边是空的）
  yield* S.wait(6);
  // 游戏里：在沉船下过三网、回到开船、手上没活 1.5 秒后才出发；这里直接放它出来（hold：先别放，录的人自己放）
  if (!o.hold) levGo(g, o);
}

function levGo(g, o = {}) {
  g.leviathan.start(o.focus || g.boatCtl.pos);
  g.threat.cued = {};
}

R.W02 = function* (S) {
  const g = S.g;
  yield* levStage(S);
  // 55 米外一切平常 → 55 米内测深图边上黄的长回波、风声退下去、很低的心跳 → 40 米内红的长回波、水色微暗、船员停下看水、心跳加快
  yield* S.until(() => g.threat.levD < 58, 60);
  yield SHOW;
  yield* S.until(() => g.threat.levD < 22, 30);
  yield* S.wait(0.5);
};

R.C10 = function* (S) {
  const g = S.g;
  // 船停在沉船南边；镜头在深槽那一侧往北看：它从镜头和船之间横着游过去，背后是亮一点的坡——
  // 一条比海底更暗的长影从右（东）游到左（西），身子一波一波地摆；最近那几秒光柱被它遮暗、水色压暗，船员趴到舷边看
  yield* levStage(S, { yaw: 0.2, pitch: 0.8, dist: 34, at: { x: 7, y: -8, z: 24.5 } });
  // 从它离画面右下角还差一点点时开始
  yield* S.until(() => { const p = g.project(g.leviathan.head); return g.threat.levD < 45 && p.z < 1 && p.x < VIEW_W * 1.12 && p.y < VIEW_H * 1.12; }, 60);
  yield SHOW;
  // 游进画面、头从船前经过、身子一节节跟过去
  yield* S.until(() => g.leviathan.head.x < g.boatCtl.pos.x - 3, 30);
  yield* S.wait(1.0);
};

R.C11 = function* (S) {
  const g = S.g;
  // 鱼群先逃：镜头看深槽上沿那群鱼。它还在四十多米外的深槽底下、画面里什么都没有，那群鱼一齐转身、侧身一片银光，
  // 整片往同一个方向（背着深槽）冲出去，比被船惊散快、远，很久不回来
  const sc = g.fish.schools[3];
  // 镜头从东往西看、横对着鱼逃的方向（鱼往画面右边跑），跟着这群鱼走；船停在沉船另一头，不进画面。
  // 它按停在沉船那儿的船出发（和 W02 一样的路线）
  g.cam.minDist = 11;
  const LO = { boat: { x: -30, z: -10 }, focus: { x: 6, z: 10 }, heading: 0.4, yaw: 1.87, pitch: 1.0, dist: 17, at: { x: sc.home.x - 1, y: -8, z: sc.home.z - 3 }, hold: true };
  yield* levStage(S, LO);
  const c = { x: 0, y: 0, z: 0 };
  const track = () => {
    let x = 0, z = 0;
    for (const f of sc.fish) { x += f.p.x; z += f.p.z; }
    c.x += (x / sc.fish.length - 1.5 - c.x) * 0.06;
    c.z += (z / sc.fish.length - 2 - c.z) * 0.06;
  };
  c.x = sc.home.x - 1.5; c.z = sc.home.z - 2;
  g.camAt = { get x() { return c.x; }, y: -8, get z() { return c.z; } };
  // 它一出发（还在深槽底下、四十多米外）这群鱼就逃：从出发前一秒开始录
  yield SHOW;
  const go = function* (gen) { for (const _ of gen) { track(); yield _; } };
  yield* go(S.wait(1.0));
  levGo(g, LO);
  yield* go(S.until(() => sc.bolt > 0, 10));
  yield* go(S.wait(5.0));
};

// —— 一趟到头（C14 收工 → C15 收获单 → C16 再来一趟）——
// 这一趟前面几网（和自动演示一圈捞到的一样）：断舱里的银币匣和货袋、船边蟹翻出来的印章和那只蟹、两只陶罐和缆绳、坡下的信筒。
// 直接记进这一趟、东西从海底收走（开场摆位，和把船摆到某处一样）；最后一网在浅滩真的下
function stageHaul(S) {
  const g = S.g;
  for (const net of [['chest', 'sack'], ['seal', 'crab'], ['jar', 'jar2', 'rope'], ['tube2']]) {
    g.trip.nets++;
    const entries = [];
    for (const id of net) {
      if (id === 'crab') { entries.push({ kind: 'crab', def: ITEM_DEFS.crab, from: '沉船·船边' }); continue; }
      const it = S.item(id);
      it.state = 'hold';
      if (it.model.group.parent) it.model.group.parent.remove(it.model.group);
      entries.push({ kind: it.kind, def: it.def, from: placeOf(it.id) });
    }
    g.trip.record(entries);
  }
  g.trip.sawWreck = true;
  g.trip.sawLev = true;
}

// 浅滩上最后一网：油只够这一网。网拉回、揭晓收起那一刻油不够下一网，这一趟就到头了
function* lastNet(S) {
  const g = S.g;
  stageHaul(S);
  yield* S.shoalArm({ yawOff: 0.95, dist: 24 });
  g.trip.fuel = 10.5;
  yield* S.drop(() => rvIs(g, 'pull') && rv(g).t > PULLBACK_T - 0.6, 60);
}

R.C14 = function* (S) {
  const g = S.g;
  // 船员停下擦手、吊臂收回原位，镜头在船上停一拍，再往甲板中间的舱口扎下去，黑透了就到了舱里
  yield* lastNet(S);
  yield SHOW;
  yield* S.until(() => g.mode === 'summary', 12);
  yield* S.wait(1.3);
};

R.C15 = function* (S) {
  const g = S.g;
  // 开舱清点：帆布一块块摆好，东西一件件落下来、挂签、价值飞进总数；银币匣压轴落在光里；总数落定、盖入舱章、写出这一趟做到的事
  yield* lastNet(S);
  yield* S.until(() => g.ending && g.ending.t > g.ending.dur - 0.45, 12);
  yield SHOW;
  yield* S.until(() => g.tally.done, 20);
  yield* S.wait(1.2);
};

R.C16 = function* (S) {
  const g = S.g;
  // 「再来一趟」按下去，舱盖拉上——影子扫过整舱、光灭，黑场里一道浪，亮起来时船已在港外、地名「港外航路」画出来
  yield* lastNet(S);
  yield* S.until(() => g.mode === 'summary' && g.tally.done && g.tally.t - g.tally.doneT > 0.6, 24);
  yield SHOW;
  yield* S.wait(0.4);
  S.press('a');
  yield;
  yield* S.until(() => g.mode === 'sail', 6);
  yield* S.wait(2.6);
};

// —— 局外：暂停、菜单、设置、接管 ——
R.D01 = function* (S) {
  const g = S.g;
  // 开着船按暂停：世界停住，背景压暗、两块铁皮板从下面浮上来，一声闷的「咔」，海浪退到后面；再按一下反着收回去，声音回来
  yield* harbor(S, { dist: 26, pitch: 0.8, side: 1, quarter: 0.3 });
  const f = fwdOf(g).clone();
  yield* S.steerFor(1.6, f.x, f.z, 0.8);
  yield SHOW;
  yield* S.steerFor(0.6, f.x, f.z, 0.8);
  S.press('start');
  yield* S.steerFor(1.9, f.x, f.z, 0.8);
  S.press('start');
  yield* S.steerFor(1.2, f.x, f.z, 0.8);
};

R.D02 = function* (S) {
  // 暂停菜单里上下挪：选中的铜牌一亮、往里一顶，小箭头点着，一声木头「嗒」
  yield* harbor(S, { dist: 26, pitch: 0.8 });
  S.press('start');
  yield* S.wait(0.6);
  yield SHOW;
  yield* S.wait(0.3);
  for (const dy of [-1, -1, -1, 1]) {
    yield* S.tap(0, dy);
    yield* S.wait(0.42);
  }
  yield* S.wait(0.3);
};

R.D03 = function* (S) {
  const g = S.g;
  // 设置：挪到「晃动和折射」上，压暗退开看得见背后的水；往左调到关，水面的折射当场变平，再调回来；
  // 挪到「音量」，调小一格放一声海浪试听（小了），再调回来（又大了）
  // 在浅滩上：水浅、底下沙和草看得清，折射有没有一眼就看得出
  S.place(SHOAL.x + 2, SHOAL.z - 3, 2.2, 9, { pitch: 0.92, dist: 21, yawOff: 0.6 });
  yield* S.wait(1.0);
  S.press('start');
  yield* S.wait(0.5);
  yield* S.tap(0, -1);
  yield* S.wait(0.3);
  yield SHOW;
  yield* S.wait(0.2);
  yield* S.tap(0, -1);
  yield* S.wait(0.6);
  const w0 = g.menus.settings.wobble;
  for (let i = 0; i < w0; i++) { yield* S.tap(-1, 0); yield* S.wait(0.32); }
  yield* S.wait(0.5);
  for (let i = 0; i < w0; i++) { yield* S.tap(1, 0); yield* S.wait(0.32); }
  yield* S.wait(0.3);
  yield* S.tap(0, -1);
  yield* S.wait(0.4);
  yield* S.tap(-1, 0);
  yield* S.wait(1.0);
  yield* S.tap(1, 0);
  yield* S.wait(1.1);
};

R.D04 = function* (S) {
  const g = S.g;
  // 自动演示开着船，按 Esc 接管：「自动演示」牌往上收起，模式牌旁滑出这里能按的键，一声轻的确认
  g.startPlay(true);
  g.ui.learned = {};
  yield* S.wait(3.0);
  yield SHOW;
  yield* S.wait(0.7);
  S.key('Escape');
  yield;
  yield* S.wait(2.6);
};

R.D05 = function* (S) {
  const g = S.g;
  // 自动演示的收获单：清点完、「再来一趟」出来，底下的条走满，按钮按下去，舱盖拉上
  yield* lastNet(S);
  yield* S.until(() => g.mode === 'ending', 10);
  g.bot = new Bot(g);
  g.bot.co = (function* () { for (;;) yield; })();
  g.input.botDriven = true;
  g.ui.demoBadge(true);
  yield* S.until(() => g.mode === 'summary' && g.bot && g.bot.summaryT > DEMO_SUMMARY_WAIT - 1.6, 20);
  yield SHOW;
  yield* S.until(() => g.mode === 'sail', 6);
  yield* S.wait(0.4);
};

// —— 「第一次」——
R.F01 = function* (S) {
  const g = S.g;
  // 自己玩、第一次开船：模式牌旁滑出这里要按的键；按 A 停船调臂时「A」那一格亮一下按下去，这一排收进模式牌，换成调臂的那一排滑出来；
  // 推一推臂端、按 A 下网，这一排也收起来
  yield* harbor(S, { dist: 24, pitch: 0.8 });
  yield SHOW;
  yield* S.wait(0.3);
  g.ui.learned = {};
  g.ui.hintKey = null;
  yield* S.wait(1.6);
  S.press('a');
  yield* S.wait(1.6);
  const f = fwdOf(g).clone();
  yield* S.armFor(0.5, -f.z, f.x, 0.6);
  yield* S.wait(0.4);
  S.press('a');
  yield* S.wait(1.4);
};

// F03 第一次看见沉船 = C03；F04 第一次珍贵物 = C07；F08 第一次大轮廓 = C10；F10 第一次收获单 = C15（同一刻一起报）
R.F03 = R.C03;
R.F04 = R.C07;
R.F08 = R.C10;
R.F10 = R.C15;

R.F09 = function* (S) {
  const g = S.g;
  // 这一趟兜上来两只黄铜信筒（浅滩那只、坡下这只）、两只双耳陶罐：开舱清点时同名的挨着落，
  // 后一只落下来靠上前一只「叮」，两只一起一闪，签上各挂一个「同款」（不写 ×2）
  // 再加一枚铜印落在信筒后面：第二对对上以后还有一件落下来，压轴的光不会马上亮
  const from = { tube: '浅滩', pulley: '浅滩', jar: '沉船·船边', jar2: '沉船·船边', tube2: '坡下', seal: '沉船·船边', chest: '沉船·断舱' };
  g.trip.record(['tube', 'jar', 'pulley', 'tube2', 'jar2', 'seal', 'chest'].map((k) => ({ kind: k, def: ITEM_DEFS[k], from: from[k] })));
  yield* S.wait(0.3);
  g.endTrip('看得见的都捞上来了');
  yield* S.until(() => g.mode === 'summary', 12);
  // 从前一只信筒落下来之前一点点开始
  const first = () => g.tally.slots.find((s) => s.h.kind === 'tube');
  yield* S.until(() => first() && g.tally.t > first().at - 0.5, 12);
  yield SHOW;
  // 第二对（两只信筒）对上、两张「同款」挂出来以后再看一会儿
  const second = () => g.tally.slots.find((s) => s.h.kind === 'tube2');
  yield* S.until(() => second() && second().pair, 12);
  yield* S.wait(0.8);
};

// —— 开场 ——
R.G01 = function* (S) {
  const g = S.g;
  // 打开标题：镜头停在沉船上方看水底那片暗影，升高、越过浅滩飞回港外的船上；快落定时「沉债」压着锚线砸下来，选项一项项亮起
  g.enterTitle();
  yield SHOW;
  yield* S.wait(7.4);
};

R.G02 = function* (S) {
  const g = S.g;
  // demo.html：同 G01，最后亮起的是下方一行「自动演示」，随浪轻轻起伏
  g.demo = true;
  g.enterTitle();
  g.demo = false;
  yield SHOW;
  yield* S.wait(9.0);
};

R.G03 = function* (S) {
  const g = S.g;
  // 标题上按「开始打捞」：字沉进水里，镜头滑到船后，起动机咔咔咔、着火「突」一下、烟囱一口黑烟，界面从边上滑进来，地名「港外航路」画出来
  g.enterTitle();
  yield* S.until(() => g.titleIntro && g.titleIntro.done, 12);
  yield* S.wait(0.6);
  yield SHOW;
  yield* S.wait(0.4);
  S.press('a');
  yield;
  yield* S.wait(3.4);
};

R.G04 = function* (S) {
  const g = S.g;
  // 开局后第一秒：船员一个接一个直起身、点个头，各去各的岗位；船起步，船头开始分水
  g.enterTitle();
  yield* S.until(() => g.titleIntro && g.titleIntro.done, 12);
  S.press('a');
  yield;
  yield* S.wait(0.3);
  yield SHOW;
  yield* S.wait(0.8);
  const f = fwdOf(g).clone();
  yield* S.steerFor(3.2, f.x, f.z, 0.7);
  yield* S.wait(0.6);
};
