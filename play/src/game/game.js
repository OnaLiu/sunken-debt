// 游戏主体：航行 / 作业两种操作模式；作业循环；揭宝；船员；发现；这一趟的收尾（收获单）；自动演示接口
import { tag } from '../core/perf.js';
import * as THREE from 'three';
import { World } from '../world/world.js';
import { Boat, BOAT, opFuelFor } from './boat.js';
import { NetRig, NET_R, estimateDrop, sinkPlan, MAX_DEPTH } from './net.js';
import { SalvageOp } from './salvage.js';
import { RevealDirector, SLOTS } from './reveal.js';
import { Crew } from './crew.js';
import { TouchFx } from './touchfx.js';
import { FuelWatch } from './fuelwatch.js';
import { NetFx } from './netfx.js';
import { Keep } from './keep.js';
import { ShoalWatch, SHOAL_NEAR } from './shoalwatch.js';
import { HazardAim } from './hazardaim.js';
import { FindFx } from './findfx.js';
import { EcoDirector } from '../eco/director.js';
import { Particles } from '../render/particles.js';
import { Smoke } from '../render/smoke.js';
import { SHARED } from '../render/materials.js';
import { heightAt } from '../world/layout.js';
import { itemSeen } from '../ui/overlay.js';
import { Builder, col, M } from '../core/geo.js';
import { worldMat } from '../render/materials.js';
import { clamp, angDiff, lerp } from '../core/noise.js';
import { fxTag } from '../fx/tags.js';
import { Omen } from './omen.js';
import { Ripples } from '../render/ripples.js';
import { Settle } from './settle.js';
import { ShipWake } from './wake.js';
import { Breeze } from './breeze.js';
import { FirstFx, FIRSTS } from './firsts.js';
import { Lessons } from './lessons.js';
import { Guide } from './guide.js';

// 平滑跟随（与常见的 SmoothDamp 相同）：cur 以速度 vel 追 target，约 smoothTime 秒到位
function springTo(cur, vel, target, smoothTime, dt) {
  if (dt <= 0) return;
  const w = 2 / smoothTime, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  for (const k of ['x', 'y', 'z']) {
    const ch = cur[k] - target[k], tmp = (vel[k] + w * ch) * dt;
    vel[k] = (vel[k] - w * tmp) * e;
    cur[k] = target[k] + (ch + tmp) * e;
  }
}

const _lk = new THREE.Vector3();

export class Game {
  constructor(opts) {
    this.view = opts.view; this.hud = opts.hud; this.audio = opts.audio;
    this.seed = opts.seed;
    this.demo = !!opts.demo;
    this.piloted = false; // 由自动演示的机器人操作（机器人只产生输入；游戏规则与手动完全相同）
    const scene = this.view.scene;
    this.particles = new Particles(scene);
    this.particles.setScale(this.view.renderer.domElement.height, this.view.camera.fov);
    this.smoke = new Smoke(scene, this.particles.mud.uniforms.uScale); // 与粒子共用同一个尺寸换算（换像素颗粒时一起变）
    this.world = new World(scene, this.seed);
    this.world.prepareRender = (obj) => this.view.prepare(obj);
    this.boat = new Boat();
    scene.add(this.boat.root);
    this.boat.surfaceAt = (x, z) => this.world.surfaceTop(x, z);
    this.boat.x = 16; this.boat.z = -14; this.boat.heading = Math.PI / 2 + 0.12;
    this.net = new NetRig(scene);
    this.touchFx = new TouchFx(scene, this.world);   // 网触底：影子、沙浪、草倒伏（B7）
    this.crew = new Crew(this.boat, this.particles);
    this.reveal = new RevealDirector(this);
    this.fuelWatch = new FuelWatch(this);             // 燃油逼近：黄、红、心跳（W1）
    this.netFx = new NetFx(this);                     // 一网的前半：入水、下沉、收紧、分量、出水（B5、B6、B9、B10、B11）
    this.omen = new Omen(this);                       // 珍品那一网起吊到落甲板：吊臂弯、船歪、出水带金、落下更沉（C4）
    this.ripples = new Ripples(this.view.post.uniforms.uRipple); // 水面上推出去的一圈圈波纹（船钟 C9）
    this.wake = new ShipWake(this);                   // 船推水：机器转速、航迹、船头浪花、一口口的烟（A1）
    this.breeze = new Breeze(this);                   // 风吹过的和弦：每个和弦海面上扫过一阵风（A3）
    this.crew.audio = this.audio;                     // 船员欢呼时拍手、击掌、口哨（C7）
    this.keep = new Keep(this);                       // 获得和留下：拉回、进舱、珍品进舱、活蟹、舱里越攒越多（B19 B21 C8 C10 A6）
    this.shoalWatch = new ShoalWatch(this);           // 浅滩逼近：黄、红、“浅了！”（W2）；撞上浅滩（W3）
    this.hazAim = new HazardAim(this);                // 网口压到硬物：红三角跳起来（W4）
    this.findFx = new FindFx(this);                   // 进入作业、移动落点、下网的表现（B2、B3、B4）
    this.settle = new Settle(this);                   // 结算：空网的一摊泥水、三种收工、收获单的拍子和告别镜头、再来一次（C3 C12 C11 D1）
    this.firsts = new FirstFx(this);                  // 第一次：推油门、发现、进作业、触底、揭晓（F1–F5）
    this.lessons = new Lessons(this);                 // 第一次（下）：第一件珍品、被拒、搁浅、空网、看清沉船（F6–F10）
    this.mode = 'sail';
    this.cam = { yaw: -Math.PI / 2 - 0.5, pitch: 0.62, dist: 38, distSail: 38, distWork: 24, pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false, shake: 0, override: null, blend: 0 };
    this.cam.yaw = this.boat.heading + Math.PI + 0.5;
    this.aim = { x: 0, z: 0, set: false };
    this.est = null;
    this.op = null;
    // 这一趟：捞上来的每一件（揭晓时一次记入，每件只记一次）、合计价值、下了几网
    this.trip = { items: [], total: 0, drops: 0, committed: {} };
    // 已知：地点（远看 far / 看清 near）、看见过的物件
    this.known = { sites: {}, seen: {} };
    this.pings = [];     // 刚发现的地点：水面上亮一圈，画面外时边上有箭头（几秒后消失）
    this.deckCargo = [];
    this.time = 0;
    this.paused = false;
    this.ended = null;   // 这一趟结束了：{ why, t }（收获单开着，按 Ⓐ 再来一次）
    this.distSlots = 0;
    this.events = [];
    this.netLoadMesh = null;
    this.raycaster = new THREE.Raycaster();
    this.stats = { drops: 0, catches: 0 };
    this.hudHidden = false;
    this.cards = [];     // 结果卡：每一网一张，玩家点了（或按 C / Ⓑ）才收起
    this.cardSeq = 0;
    this.shoal = null;   // 预兆：照现在的航向和速度，前方会搁浅的位置
    this.world.update(this.boat.x, this.boat.z, 60);
    if (!this.demo) this.introT = 2.5;
    this.boat.targetYaw = this.boat.parkYaw; this.boat.targetReach = this.boat.parkReach;
    this.boat.craneYaw = this.boat.parkYaw; this.boat.craneReach = this.boat.parkReach;
    const tip = this.boat.tipWorld(new THREE.Vector3());
    this.net.pos.set(tip.x, this.boat.tipHeight() - 2.3, tip.z);
    this.aim.x = tip.x; this.aim.z = tip.z;
  }

  // —————————————————— 主更新 ——————————————————
  update(dt, inp) {
    // 暂停（演示中的 Esc 由入口处理：停止机器人并接管）
    const H = this.hud;
    // 摇杆/方向键只有“刚推下去”的那一下算按了键：一直按着油门时收工、揭晓，不会每 2.5 秒响一声“不行”
    const mv = Math.abs(inp.move.x) > 0.5 || Math.abs(inp.move.y) > 0.5;
    this.moveEdge = mv && !this.moveHeld; this.moveHeld = mv;
    if (inp.start) this.setPaused(!this.paused);
    if (inp.hud) { this.hudHidden = !this.hudHidden; H && H.setHidden(this.hudHidden); }
    if (this.paused) { if (inp.C || inp.Y || inp.click) H && H.pauseWhy && H.pauseWhy(); return; }
    this.time += dt; this.dtLast = dt;
    SHARED.uTime.value = this.time;
    const boat = this.boat;
    let ctl = { throttle: 0, steer: 0, brake: false };
    const revealing = this.reveal.busy && this.reveal.active.phase !== 'pull';
    // C / Ⓑ：先收起最新一张结果卡（C 只管收卡；Ⓑ 没有卡时是“返回”）
    if ((inp.B || inp.C) && this.cards.length && !revealing) { this.dismissCard(); inp = { ...inp, B: false, C: false }; }
    else if (inp.C && !revealing) this.blockedInput({ Y: true, move: { x: 0, y: 0 } }, '');
    // 收获单开着、冲洗、揭晓时按了用不上的键：响一声“不行”（要等的事上已经挂着秒数、能按的键）
    // 收获单：Ⓐ 先是跳到盖章，“再来一次”亮起来以后才是再来一次（刚收工的一小会儿不算，免得下网连按的那一下把它直接按掉）
    if (this.ended) { if (inp.A) this.settle.press(); this.blockedInput(inp, '', true); }
    else if (revealing) {
      const washing = this.reveal.active.phase !== 'show';
      if (inp.A && washing) this.reveal.speedUp();
      this.blockedInput(inp, '', washing);
    } else {
      // 模式切换
      if (inp.Y || (inp.B && this.mode === 'work')) this.setMode(this.mode === 'sail' ? 'work' : 'sail');
      if (this.mode === 'sail' && this.op && Math.abs(inp.move.y) > 0.3) this.blockedInput({ move: inp.move, A: false, Y: false, B: false }, '网在水下，开不了船');
      if (this.mode === 'sail') {
        ctl.throttle = inp.move.y; ctl.steer = -inp.move.x;
        if (inp.A) this.setMode('work');
      } else {
        ctl.brake = true;
        // 先改落点（摇杆、左键点），吊臂目标当场跟上，再看能不能下网：同一帧里点了新落点又按 A，也不会落在旧位置
        const moved = this.updateAimInput(dt, inp);
        if (inp.click) this.clickAim(inp.click);
        // 按了下网还在等吊臂：小幅修正（摇杆回中时的余量、补一下位置）照样到位后下网，落在最后的落点；挪开 0.3 米以上算改主意，取消
        if (moved || inp.click) { if (this.pendingDrop && (inp.click || Math.hypot(this.aim.x - this.pendingAt.x, this.aim.z - this.pendingAt.z) > 0.3)) this.pendingDrop = false; this.syncCraneTarget(); }
        if (inp.A) this.pressDrop();
        else if (this.pendingDrop && this.canDrop().ok) { this.pendingDrop = false; this.tryDrop(); }
      }
      if (inp.click && this.mode === 'sail') this.blockedInput({ Y: true, move: { x: 0, y: 0 } }, '{Y} 停船后才能点落点');
    }
    boat.locked = !!this.op || revealing || !!this.ended || this.mode === 'work';
    boat.parked = this.mode === 'sail' && !this.op && !this.netReturning;
    boat.update(dt, ctl);
    // 撞上浅滩（W3）：船自己记下撞上那一刻的船速
    if (boat.impact) { this.shoalWatch.impact(boat.impact); boat.impact = 0; }
    this.breeze.update(dt);
    this.wake.update(dt, ctl);                        // 船推水（A1）：机器、航迹、浪花、烟囱（原来的 exhaust 和航迹粒子搬到 wake.js）
    this.firsts.update(dt, inp, ctl);                 // 第一次推油门那一大口烟、船尾那团白水叠在 A1 上面（F1）
    // 吊臂目标
    if (!this.op || this.op.state === 'done') {
      if (this.mode === 'work') this.syncCraneTarget();
      else if (this.mode === 'sail' && !this.netReturning) { boat.targetYaw = boat.parkYaw; boat.targetReach = boat.parkReach; }
    }
    // 网包放下以后（B12）：近景里整根吊臂仰起来，网先往上提 0.6 秒再往回转，从镜头上方过去，不再横扫过近景；拉回大视野时臂放下来
    // 近景里吊臂仰起来（网高高地吊着不挡镜头）；看完前 0.65 秒先往回放，拉回结束时正好到位、能马上下下一网
    { const R = this.reveal.active; boat.luffHi = this.reveal.busy && R.phase !== 'pull' && !(R.phase === 'show' && R.t > R.showDur - 0.65) ? 1.0 : 0; }
    if (this.netHoistUntil > this.time) { boat.targetYaw = boat.craneYaw; boat.targetReach = boat.craneReach; }
    if (this.netReturning && boat.craneSettled()) this.netReturning = false;
    this.updateOmens(dt);
    this.findFx.update(dt);
    // 网
    if (this.op) this.op.update(dt);
    else this.hangNet(dt);
    this.netFx.update(dt);
    this.omen.update(dt);
    this.updateCable(dt);
    this.reveal.update(dt);
    // 船员
    const tipW = boat.tipWorld(new THREE.Vector3());
    const tl = boat.worldToLocal2(tipW.x, tipW.z);
    this.crew.opActive = !!this.op;
    this.crew.update(dt, { spraying: this.reveal.busy && this.reveal.active.phase === 'wash', tipLocal: tl, tipSide: Math.sign(tl[0]) || 1 });
    this.updateDeckCargo(dt);
    this.keep.update(dt);
    this.settle.update(dt);
    // 世界与生态
    const fx = this.cam.look.x || boat.x, fz = this.cam.look.z || boat.z;
    this.world.update(boat.x, boat.z, 2);
    this.updateCreatures(dt);
    this.particles.update(dt, SHARED.uCurrent.value);
    this.ripples.update(dt);
    this.touchFx.update(dt);
    this.smoke.update(dt);
    this.decayDisturb(dt);
    this.updateDiscovery(dt);
    this.updateEnd(dt);
    this.fuelWatch.update(dt);
    this.shoalWatch.update(dt);
    this.hazAim.update(dt);
    this.lessons.update(dt);
    // 估计（作业模式）：按落点算——吊臂到位后网就落在这里
    if (this.mode === 'work' && !this.op) this.est = estimateDrop(this.world, boat, this.aim.x, this.aim.z);
    else if (!this.op) this.est = null;
    this.updateSink();
    if (this.introT > 0) { this.introT -= dt; if (this.introT <= 0) this.guideArrow(); }
    if (this.guide) { this.guide.update(dt); if (this.guide.done) this.guide = null; } // 开局的指向虚线（G4）
    this.updateLamp(dt);
    this.updateCamera(dt, inp);
    boat.updateVisual(this.time, { washing: this.reveal.busy && this.reveal.active.phase === 'wash' });
    this.findFx.visual();
    this.firsts.visual();
    this.updateNetVisual();
    // 按“开始航程”进来的这一趟：开头几秒海面亮起、镜头从船尾升起来（G3，src/game/opening.js；只改画出来的那一帧）
    if (this.opening) { this.opening.update(dt); if (this.opening.done) this.opening = null; }
  }

  // 这时候按了用不上的键：响一声“不行”；玩家要自己动手解决的才说一句（同一句 2.5 秒内不重复）
  blockedInput(inp, why, allowA = false) {
    const pressed = inp.Y || inp.B || inp.C || (inp.A && !allowA) || ((Math.abs(inp.move.x) > 0.5 || Math.abs(inp.move.y) > 0.5) && this.moveEdge !== false) || !!inp.click;
    if (!pressed) return;
    if (this.lastWhy === why && this.time - this.lastWhyT < 2.5) return;
    this.lastWhy = why; this.lastWhyT = this.time;
    if (why) this.say(why, 'info');
    else { this.audio && this.audio.play('deny'); fxTag('F7', '被拒·按错键'); this.lessons.deny('key'); }
  }
  // 开局第一次：水面上一道虚线从船头指向红浮标那边的浅滩（不说话）；描出去、浮标的铃、朝它开了就收起（G4，src/game/guide.js）
  guideArrow() {
    this.guide = new Guide(this);
  }
  // 出手前的预兆：前方浅水（会搁浅）。照现在的航向和船速往前找第一处浅水，算出还有几秒撞上（ttg）；
  // 只在 SHOAL_NEAR 秒以内才算“前方有浅滩”（远了不提示）。怎么提示见 shoalwatch.js（W2）
  updateOmens(dt) {
    const boat = this.boat;
    this.omenT = (this.omenT || 0) - dt;
    const v = Math.abs(boat.speed);
    if (this.omenT <= 0) {
      this.omenT = 0.1;
      this.shoalAt = null;
      if (!boat.locked && v > 0.6 && !boat.grounded) {
        const dir = Math.sign(boat.speed);
        const hx = Math.sin(boat.heading) * dir, hz = Math.cos(boat.heading) * dir;
        const look = Math.max(6, v * (SHOAL_NEAR + 0.6));
        for (let d = 0; d <= look; d += 0.5) {
          const px = boat.x + hx * (7.5 + d), pz = boat.z + hz * (7.5 + d);
          if (this.world.surfaceTop(px, pz) > -1.7) { this.shoalAt = { x: px, z: pz, dir }; break; }
        }
      }
    }
    // 每帧按船现在的位置重算还有几秒：倒车、减速时它变长，提示跟着退回去
    const a = this.shoalAt;
    this.shoal = null;
    if (a && !boat.locked && v > 0.6 && Math.sign(boat.speed) === a.dir) {
      const hx = Math.sin(boat.heading) * a.dir, hz = Math.cos(boat.heading) * a.dir;
      const dist = Math.max(0, (a.x - boat.x) * hx + (a.z - boat.z) * hz - 7.5);
      const ttg = dist / v;
      if (ttg <= SHOAL_NEAR) this.shoal = { x: a.x, z: a.z, dist, ttg, hx, hz, t: this.time };
    }
  }
  // 要等的事（给世界标记层画计时）：计时挂在那件事本身上
  waits() {
    const out = [];
    const boat = this.boat;
    if (this.op && this.op.state !== 'done') {
      out.push({ kind: 'net', remain: this.op.eta(), total: this.op.etaTotal, at: new THREE.Vector3(this.net.pos.x, this.net.pos.y + 2.4, this.net.pos.z) });
    } else if (this.pendingDrop && this.mode === 'work' && !this.reveal.busy) {
      const e = boat.craneEta();
      if (!this.pendTotal || e > this.pendTotal) this.pendTotal = Math.max(e, 0.3);
      const tw = boat.tipWorld(new THREE.Vector3());
      out.push({ kind: 'crane', remain: e, total: this.pendTotal, at: tw.setY(boat.tipHeight() + 0.6) });
    }
    if (!this.pendingDrop) this.pendTotal = 0;
    const R = this.reveal.active;
    if (R && (R.phase === 'land' || R.phase === 'wash')) {
      const at = new THREE.Vector3(); R.bundle.getWorldPosition(at); at.y += R.R * 1.1 + 0.1;
      // 加快（B16）：按下以后几秒、按下前还剩几秒（界面上数字一下子滚下去、圈亮一下）、再催一把以后几秒
      out.push({ kind: 'wash', remain: this.reveal.washRemain(), total: (R.washDur + (R.landDur || 0.45)), at, fast: !!R.fast, fastT: R.fast ? this.time - R.fastAt : -1, jump: R.fastFrom, pulseT: R.pulseAt != null ? this.time - R.pulseAt : 9 });
    }
    return out;
  }
  // —— 结果卡 ——
  addCard(c) {
    c.id = ++this.cardSeq; c.t = this.time;
    this.cards.push(c);
    this.hud && this.hud.setCards && this.hud.setCards(this.cards);
    this.logEvent({ type: 'card', id: c.id, kind: c.kind });
  }
  dismissCard(id) {
    if (!this.cards.length) return false;
    if (id === 'all') this.cards = [];
    else { const i = id == null ? this.cards.length - 1 : this.cards.findIndex((c) => c.id === id); if (i < 0) return false; this.cards.splice(i, 1); }
    this.hud && this.hud.setCards && this.hud.setCards(this.cards);
    this.audio && this.audio.play('dismiss');
    fxTag('B22', '收起结果卡：往右一弹，下面的补上来');
    return true;
  }
  // quiet：收工时顺手切回航行，不另响一声（收获单有自己的声音）
  setMode(m, quiet = false) {
    if (m === this.mode) return;
    tag('mode:' + m);
    this.mode = m;
    this.pendingDrop = false;
    if (m === 'work') {
      // 臂端默认伸向镜头看着的一侧
      const fwd = new THREE.Vector3(); this.view.camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      if (!this.aim.set || Math.hypot(this.aim.x - this.boat.x, this.aim.z - this.boat.z) > 16) {
        const side = this.boat.solveTarget(this.boat.x + fwd.x * 8, this.boat.z + fwd.z * 8);
        const tw = this.boat.tipWorld(new THREE.Vector3(), side.yaw, Math.max(7, side.reach));
        this.aim.x = tw.x; this.aim.z = tw.z; this.aim.set = true;
      }
      this.aimWant = { x: this.aim.x, z: this.aim.z };
      // 镜头转到“船—落点”连线的侧面，船身不挡水下作业点
      this.frameWork();
      // 车钟两下、船头一栽、船尾翻白水（B2；徽章翻面在 hud）
      this.findFx.workStart();
    } else if (!quiet) { this.audio && this.audio.play('sail'); fxTag('B22', '一声拆开·切回航行'); }
  }
  updateLamp(dt) {
    const L = SHARED.uLamp.value;
    let want = 0, x = L.x, y = L.y, z = L.z;
    if (this.op && this.op.state !== 'swing' && this.op.state !== 'land' && this.op.state !== 'done') { x = this.op.x; z = this.op.z; y = Math.min(-0.3, this.net.pos.y - 1.2); want = 9; }
    else if (this.mode === 'work') { const tw = this.boat.tipWorld(new THREE.Vector3()); x = tw.x; z = tw.z; y = -0.3; want = 5; }
    L.x = x; L.y = y; L.z = z;
    L.w += (want - L.w) * Math.min(1, dt * 3);
  }
  frameWork() {
    const brg = Math.atan2(this.aim.x - this.boat.x, this.aim.z - this.boat.z);
    const a1 = brg + Math.PI / 2, a2 = brg - Math.PI / 2;
    // 平滑转过去（不是一下跳到侧面）；玩家一动视角就交还给玩家。
    // 侧面再往落点那边偏一点：落点在近处、船在后面，驾驶室和吊臂不会挡住水下的网口
    this.cam.ease = { yaw: Math.abs(angDiff(this.cam.yaw, a1)) < Math.abs(angDiff(this.cam.yaw, a2)) ? a1 - 0.35 : a2 + 0.35, pitch: Math.max(this.cam.pitch, 0.9) };
  }
  // 摇杆推的是“想放网的点”，可以越过驾驶室前方那片转不过去的扇区；网口圆圈停在离它最近、臂够得着的位置，
  // 推过船头另一侧时吊臂从船尾绕过去（以前圆圈会卡在扇区边上，怎么推都过不去）
  updateAimInput(dt, inp) {
    if (Math.abs(inp.move.x) + Math.abs(inp.move.y) < 0.01) return false;
    const cam = this.view.camera;
    const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize();
    const r = new THREE.Vector3(-f.z, 0, f.x);
    const sp = 5.0;
    const base = this.aimWant || this.aim;
    let nx = base.x + (f.x * inp.move.y + r.x * inp.move.x) * sp * dt;
    let nz = base.z + (f.z * inp.move.y + r.z * inp.move.x) * sp * dt;
    // 想放的点只限制在臂展环内（不让它跑远），扇区里也可以停留
    const [lx, lz] = this.boat.worldToLocal2(nx, nz);
    const cx = lx - BOAT.craneLocal.x, cz = lz - BOAT.craneLocal.z, R = Math.hypot(cx, cz) || 1e-6;
    const Rc = clamp(R, BOAT.reachMin, BOAT.reachMax);
    if (Rc !== R) [nx, nz] = this.boat.localToWorld2(BOAT.craneLocal.x + cx / R * Rc, BOAT.craneLocal.z + cz / R * Rc);
    this.aimWant = { x: nx, z: nz };
    const s = this.boat.solveTarget(nx, nz);
    // 想放的点穿过船头扇区时，圆圈先留在原来那一舷，等它从另一边出来再换舷（不在两舷之间来回跳）
    if (s.limit === 'cabin' && this.aimSide && Math.sign(s.yaw) !== this.aimSide) s.yaw = this.aimSide * Math.abs(s.yaw);
    else if (s.limit !== 'cabin') this.aimSide = Math.sign(angDiff(0, s.yaw)) || 1;
    // 推不动了：臂伸到头、收到底，或被驾驶室挡着——记下来，网口旁画出臂够得着的边、作业栏说一句原因
    const push = R > BOAT.reachMax + 1e-3 ? 'max' : R < BOAT.reachMin - 1e-3 ? 'min' : s.limit === 'cabin' ? 'cabin' : null;
    if (push) this.limitPush = { kind: push, t: this.time };
    const tw = this.boat.tipWorld(new THREE.Vector3(), s.yaw, s.reach);
    this.aim.x = tw.x; this.aim.z = tw.z; this.aim.set = true;
    this.aimLimit = s.limit;
    return true;
  }
  // 作业时吊臂目标就是落点（网在水下、网架正在回位时不动）
  syncCraneTarget() {
    if (this.mode !== 'work' || this.netReturning || (this.op && this.op.state !== 'done')) return;
    const s = this.boat.solveTarget(this.aim.x, this.aim.z);
    this.boat.targetYaw = s.yaw; this.boat.targetReach = s.reach;
  }
  setAimWorld(x, z) {
    const s = this.boat.solveTarget(x, z);
    this.aimSide = Math.sign(angDiff(0, s.yaw)) || 1;
    const tw = this.boat.tipWorld(new THREE.Vector3(), s.yaw, s.reach);
    this.aim.x = tw.x; this.aim.z = tw.z; this.aim.set = true; this.aimLimit = s.limit;
    this.aimWant = { x: tw.x, z: tw.z };
    this.syncCraneTarget();
    return s;
  }
  clickAim(c) {
    const ndc = new THREE.Vector2(c.x * 2 - 1, -(c.y * 2 - 1));
    this.raycaster.setFromCamera(ndc, this.view.camera);
    const targets = [];
    for (const ch of this.world.terrain.chunks.values()) targets.push(ch.mesh);
    for (const r of this.world.regions.values()) if (r.group.visible) targets.push(...r.wreckMeshes);
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length) this.setAimWorld(hits[0].point.x, hits[0].point.z);
  }
  canDrop() {
    if (this.op || this.reveal.busy || this.ended || this.mode !== 'work') return { ok: false, why: '' };
    // 油见底先说：等船停、等吊臂都没用
    if (this.boat.fuel <= 0) return { ok: false, why: '油尽，绞车转不动' };
    if (Math.abs(this.boat.speed) > 0.4) return { ok: false, why: '船还在滑行' };
    if (this.netReturning) return { ok: false, why: '网架正在回位' };
    // 吊臂到位：按现在的落点实时判断（落点刚换、吊臂还没开始转的那一帧也算没到位）
    this.syncCraneTarget();
    if (!this.boat.craneSettled()) return { ok: false, why: '吊臂还在转' };
    const e = this.est;
    if (!e) return { ok: false, why: '' };
    if (!e.ok) return { ok: false, why: e.issues[0] };
    if (this.boat.fuel < e.fuel) return { ok: false, why: '油不够这一网' };
    return { ok: true };
  }
  // 按下网（A 键，或点作业栏的“下网”）：能下就下；吊臂还在转、船还在滑就记住，到位后自动下；别的原因写出来
  pressDrop() {
    if (this.mode !== 'work' || this.ended || (this.reveal.busy && this.reveal.active.phase !== 'pull')) return false;
    if (this.op) { this.audio && this.audio.play('denyBusy'); fxTag('F7', '被拒·网还在水下'); this.lessons.deny('busy'); return false; }
    const c = this.canDrop();
    if (c.ok) return this.tryDrop();
    // 吊臂还在转、船还在滑：记住，到位后自动下（臂端挂着到位的计时圈）
    if (c.why === '吊臂还在转' || c.why === '船还在滑行' || c.why === '网架正在回位') { this.pendingDrop = true; this.pendingAt = { x: this.aim.x, z: this.aim.z }; return false; }
    return this.tryDrop();
  }
  tryDrop() {
    const c = this.canDrop();
    // 油不够：心跳停一拍、油表抖一下（W1）
    if (!c.ok && /油/.test(c.why || '')) this.fuelWatch.deny();
    // 下不了：响一声，作业栏的“下网”抖一下（为什么写在它上面那一行）
    if (!c.ok) {
      if (c.why) {
        // 按原因响不同的一声：油不够是空油桶，落点不行是吊臂顶到头
        const fuel = /油/.test(c.why);
        this.audio && this.audio.play(fuel ? 'denyFuel' : 'denyReach');
        fxTag('F7', fuel ? '被拒·油不够' : '被拒·落点不行');
        this.lessons.deny(fuel ? 'fuel' : 'reach', c);
        this.hud && this.hud.denyDrop && this.hud.denyDrop();
      }
      return false;
    }
    // 吊臂已按落点到位（canDrop 刚查过，差不到 1 毫弧度）：网就从落点正上方下去，和画出来的网口圈、估计触底一致
    const tw = { x: this.aim.x, z: this.aim.z };
    const est = estimateDrop(this.world, this.boat, tw.x, tw.z);
    this.hud && this.hud.fuelSpend && this.hud.fuelSpend(est.fuel);
    this.boat.fuel -= est.fuel;
    this.trip.drops++;
    this.stats.drops++;
    this.op = new SalvageOp(this, tw.x, tw.z, est);
    this.lastDrop = { x: tw.x, z: tw.z, t: this.time };
    // 船长一指、吊臂一沉、绞盘松开（B4）
    this.findFx.drop(this.op);
    this.firsts.drop(this.op);
    return true;
  }
  // 测深绳的秒结：现在按 A，网几秒触底、离触底还剩 1、2、3……秒时网兜底在哪；网下去以后按它现在的高度和速度往下推
  updateSink() {
    const sk = this.sink || (this.sink = { t: 0, knots: [] });
    let p = null;
    if (this.op && this.op.state === 'lowering') p = sinkPlan(this.op.y, this.op.T, this.op.v);
    else if (!this.op && this.mode === 'work' && this.est) {
      // 网悬在臂端下方（和 hangNet 同一个高度）；吊臂还在转时按到位后的臂长算
      const s = this.boat.solveTarget(this.aim.x, this.aim.z);
      const hy = Math.max(1.6, this.boat.tipHeightAt(s.reach) - 3.4) + 1.15;
      p = sinkPlan(this.boat.craneSettled() && Math.abs(this.net.pos.y - hy) < 0.3 ? this.net.pos.y : hy, this.est.T);
    }
    sk.t = p ? p.t : 0;
    sk.knots.length = 0;
    if (p) for (const k of p.knots) sk.knots.push(k);
  }
  hangNet(dt) {
    const tip = this.boat.tipWorld(new THREE.Vector3());
    // 作业：网悬在水面上方；航行：收在后甲板上空、高过船员头顶
    const hy = this.mode === 'work' ? Math.max(1.6, this.boat.tipHeight() - 3.4) + 1.15 : Math.min(this.boat.tipHeight() - 2.05, BOAT.deckY + 3.4);
    const p = this.net.pos;
    p.x = tip.x; p.z = tip.z;
    // 刚放下网包：网收紧往上提（快），跟着仰起来的臂走
    // 整个近景（冲洗、看清）里都吊在高处，到拉回才放下来
    const R = this.reveal.active;
    const hoist = this.reveal.busy && (this.netHoistUntil > this.time - 1.5 || (R && R.landed && R.phase !== 'pull'));
    p.y += ((hoist ? Math.max(hy, this.boat.tipHeight() - 2.15) : hy) - p.y) * Math.min(1, dt * (hoist ? 5 : 3));
    if (this.net.closure > 0) this.net.setClosure(Math.max(0, this.net.closure - dt * 1.2));
  }
  // 吊索：臂端滑轮 → 网架顶（网身晃的那一点也算上）；松、绷、抖在 cable.js
  updateCable(dt) {
    const tip = this.boat.tipWorld(new THREE.Vector3());
    const a = this._ca || (this._ca = new THREE.Vector3()), b = this._cb || (this._cb = new THREE.Vector3());
    a.set(tip.x, this.boat.tipHeightVis() - 0.25, tip.z); // 看得见的臂端：吊着珍品时臂更弯、船更歪（C4）
    const sw = this.netFx ? this.netFx.sway : null;
    b.set(this.net.pos.x + (sw ? sw.hx : 0), this.net.pos.y + 1.75, this.net.pos.z + (sw ? sw.hz : 0));
    this.net.cable.update(dt, a, b, SHARED.uCurrent.value);
  }
  updateNetVisual() {
    this.net.group.position.copy(this.net.pos);
    // 吊着的网身随吊臂转、随船晃有一点摆（越沉摆得越小越慢，B10）
    const sw = this.netFx.sway;
    this.net.group.position.x += sw.x; this.net.group.position.z += sw.z;
    this.net.group.rotation.set(sw.rx, 0, sw.rz);
    if (this.netLoadMesh) { this.netLoadMesh.position.set(0, -0.62 - 0.2 * this.net.heft * this.net.closure, 0); if (this.netLoadLive) this.netLoadMesh.rotation.z = Math.sin(this.time * 9) * 0.08; }
  }
  setNetLoad(size, live) {
    if (this.netLoadMesh) { this.net.group.remove(this.netLoadMesh); this.netLoadMesh.geometry.dispose(); this.netLoadMesh = null; }
    if (size <= 0) return;
    const b = new Builder();
    b.add(new THREE.IcosahedronGeometry(size * 0.85, 1), col(0x5a4a34), M(0, 0, 0, 0, 0, 0, 1, 0.7, 1));
    this.netLoadMesh = new THREE.Mesh(b.build(), worldMat({ key: 'netload' }));
    this.netLoadLive = live;
    this.net.group.add(this.netLoadMesh);
  }
  beginSwing() {
    const wl = BOAT.washLocal;
    const [wx, wz] = this.boat.localToWorld2(wl.x, wl.z);
    const s = this.boat.solveTarget(wx, wz);
    this.boat.targetYaw = s.yaw; this.boat.targetReach = s.reach;
  }
  onNetLanded(op) {
    const load = op.load;
    this.setNetLoad(0);
    this.net.setClosure(0);
    this.op = null;
    this.netReturning = true;
    if (load && load.entries.length) {
      this.netHoistUntil = this.time + 0.6;
      this.stats.catches++;
      this.pendingLoad = load;
      this.reveal.begin(load);
    } else {
      // 空网：倒出来只有泥水，不进近景；结果卡一句为什么空（碰到硬物的那一下当时已经说过，卡上只画红三角）
      const notes = (op.result && op.result.notes) || [];
      const hazard = !!(op.result && op.result.obstacle);
      // 空网浇下一摊泥水（C3，settle.js）；碰了硬物收回来的是空网架，没有泥，铁架子哐啷几下
      if (hazard) { this.audio && this.audio.play('netBack'); fxTag('W5', '碰硬物·空网架落回甲板'); }
      else this.settle.emptyNet(op);
      const why = hazard ? '' : notes.includes('buried') ? '埋得太深，提不动' : notes.includes('edge') ? '压在网口边上，没兜进来' : '网口里没有东西';
      this.addCard({ kind: 'empty', title: '空网', note: why, hazard });
    }
  }
  onRevealPullBack() { this.pendingLoad = null; this.keep.onPull(this.reveal.active); }
  // 揭晓那一刻一次记入这一趟（每件只记一次；之后船员搬运只是动画，不再增减）
  commitCatch(load) {
    const T = this.trip;
    for (const e of load.entries) {
      const id = e.kind === 'item' ? e.it.id : e.cr.id;
      if (T.committed[id]) continue;
      T.committed[id] = 1;
      const rec = e.kind === 'item'
        ? { id, key: e.it.key, name: e.it.name, value: e.it.value, precious: e.it.precious, live: false }
        : { id, key: e.cr.kind, name: e.cr.name, value: e.cr.value, live: true };
      if (e.kind === 'item') e.it.state = 'aboard';
      T.items.push(rec); T.total += rec.value;
      e.rec = rec;
    }
  }
  notifyItemTaken(it) { this.logEvent({ type: 'taken', id: it.id }); }
  // 事件记录（只供检查与测试读取；只留最近一段）
  logEvent(e) { tag('ev:' + e.type); e.t = +this.time.toFixed(2); this.events.push(e); if (this.events.length > 600) this.events.splice(0, 100); }

  // 甲板货物：只是表现，等待船员搬入舱
  freeSlots(n) {
    const used = new Set(this.deckCargo.map((c) => c.slot));
    const out = [];
    SLOTS.forEach((s, i) => { if (!used.has(i) && out.length < n) out.push(s); });
    while (out.length < n) out.push([0.3 + (out.length % 3) * 0.5, -6.9]);
    return out;
  }
  addDeckCargo(e, mesh) {
    let slot = -1;
    let best = 1e9;
    SLOTS.forEach((s, i) => { const d = Math.hypot(s[0] - mesh.position.x, s[1] - mesh.position.z); if (d < best && !this.deckCargo.some((c) => c.slot === i)) { best = d; slot = i; } });
    const entry = { mesh, slot, kind: e.kind === 'live' ? 'live' : 'item', e };
    this.deckCargo.push(entry);
    this.crew.enqueueCarry({
      mesh, x: mesh.position.x, z: mesh.position.z, kind: entry.kind, e,
      onPicked: (s) => { entry.picked = true; this.keep.onPicked(entry, s); },
      onStowed: () => {
        this.deckCargo = this.deckCargo.filter((c) => c !== entry);
        // 捞上来的蟹由船员放进甲板上的水槽（只作画面）
        if (entry.kind === 'live') { this.tank = this.tank || []; const t = { mesh, e }; this.tank.push(t); this.keep.onTank(t); }
        else this.stowFx(entry);
      },
    });
  }
  // 东西进舱（B21；珍贵的那件是 C8）：见 keep.js
  stowFx(entry) { this.keep.stow(entry); }
  // 甲板上的活蟹在格栅上挣动、窜一截，捏在手里乱蹬，水槽里的走来走去（C10、A6）：见 keep.js
  updateDeckCargo(dt) {
    for (const c of this.deckCargo) if (c.kind === 'live') { if (!c.picked) this.keep.deckCrab(c, dt); else this.keep.heldCrab(c, dt); }
    if (this.tank) this.keep.updateTank(dt, this.tank);
  }
  // —————————————————— 生态 ——————————————————
  // 每只生物知道什么（船、网、有没有人在看、哪里刚翻过泥）由生态调度交给它们；见 src/eco/director.js
  updateCreatures(dt) {
    if (!this.eco) this.eco = new EcoDirector(this);
    this.eco.update(dt);
  }
  creaturesNear(x, z, rad) {
    const out = [];
    for (const r of this.world.regions.values()) { if (Math.hypot(r.reg.cx - x, r.reg.cz - z) > 200) continue; for (const c of r.creatures) if (c.catchable && !c.captured) { const p = c.position(); if (Math.hypot(p.x - x, p.z - z) < rad) out.push(c); } }
    return out;
  }
  // pinned：网架触底时压在网口里的活物（逃不出去，闭网时收入）
  disturb(x, z, r, s, y, pinned = null, kind = 'bottom') {
    const D = SHARED.uDist.value[this.distSlots++ % 6];
    D.set(x, z, kind === 'surface' ? 0 : s, r * 0.6);
    D.life = 3.5;
    // 网底沿落在海底泥上（不是船体、舱里）才算翻开了一片泥，成为觅食地（入水那一下不算）
    if (kind === 'bottom' && y != null && Math.abs(y - heightAt(x, z)) < 0.6) { if (!this.eco) this.eco = new EcoDirector(this); this.eco.addScar(x, z, NET_R); }
    for (const reg of this.world.regions.values()) {
      if (Math.hypot(reg.reg.cx - x, reg.reg.cz - z) > 200) continue;
      for (const c of reg.creatures) {
        if (pinned && pinned.has(c)) { c.trapped = true; continue; }
        if (c.kind === 'school') c.disturb(x, z, r * 1.2, s);
        else if (kind === 'surface') continue; // 入水只惊动鱼群，底栖生物不读按键
        else if (c.disturb) c.disturb(x, z, 3.6);
      }
    }
  }
  decayDisturb(dt) {
    for (const D of SHARED.uDist.value) { if (D.life > 0) { D.life -= dt; D.z = Math.max(0, D.z * Math.exp(-dt * 1.2)); } else D.z = 0; }
  }
  onEcoEvent(type, cr, it) {
    const d = Math.hypot(cr.x - this.boat.x, cr.z - this.boat.z);
    this.logEvent({ type, cr: cr.id, it: it && it.id });
    // 生物开始翻一件埋着的东西：沙沙越刨越急、碰到硬东西一下、露出来一声（声音偏向它那一边，远了轻）（C2）
    if (type === 'digStart' && it) {
      const sc = this.screenOf(it.x, it.z);
      this.audio && this.audio.play('unearth', { pan: sc.pan, vol: clamp(1.25 - d / 40, 0.35, 1), mat: it.mat });
      fxTag('C2', '蟹翻出埋着的东西');
    }
    // 翻出来了：那件东西（按翻出来以后的埋深）在这个水深、这个距离看得见时，水面上它那里一圈沙色的涟漪（不说话；菱形标记随后就挂上）
    if (type === 'dig' && it && d < 45 && itemSeen({ state: it.state, burial: Math.min(it.burial, 0.42), baseY: it.baseY, x: it.x, z: it.z }, this.boat.x, this.boat.z)) this.ping({ x: it.x, z: it.z, r: 2.6, y: it.baseY + 0.05 }, 'near', true);
  }

  // —————————————————— 发现 ——————————————————
  updateDiscovery(dt) {
    this.discT = (this.discT || 0) + dt;
    if (this.discT < 0.25) return;
    this.discT = 0;
    const bx = this.boat.x, bz = this.boat.z;
    const fx = this.cam.look.x, fz = this.cam.look.z;
    const K = this.known;
    for (const r of this.world.regions.values()) {
      if (Math.hypot(r.reg.cx - bx, r.reg.cz - bz) > 220) continue;
      // 看见过的物件
      for (const it of r.items.values()) if (!K.seen[it.id] && itemSeen(it, bx, bz)) K.seen[it.id] = 1;
      for (const s of r.sites) {
        const key = r.id + ':' + s.id;
        const d = Math.min(Math.hypot(s.x - bx, s.z - bz), Math.hypot(s.x - fx, s.z - fz) + 6);
        const cur = K.sites[key];
        if (cur !== 'near' && d < s.near) {
          K.sites[key] = 'near';
          this.logEvent({ type: 'site', key, stage: 'near' });
          // 看清了：水面上涟漪扩开、描出这处现场，名字从那里浮起来；现场不在画面里才在底部说一句（线索只画它指的方向，不说话）
          const sc = this.screenOf(s.x, s.z), p = this.ping(s, 'near');
          this.findFx.site(s);
          this.firsts.find(s, p, sc);
          if (!s.clue && !sc.on) { this.say(s.label, 'find'); p.said = true; }
          // 涟漪扩开的同时，水下“咕”一声再轻轻“叮”（两处同时看清只响一声）
          if (this.time - (this.findSndT ?? -9) > 0.6) { this.findSndT = this.time; this.audio && this.audio.play('find', { kind: s.clue ? 'clue' : 'site', pan: sc.pan }); }
          fxTag('B1', s.clue ? '发现线索' : '看清一处现场');
        } else if (!cur && s.labelFar && d < (s.farDist || 60)) {
          K.sites[key] = 'far';
          this.logEvent({ type: 'site', key, stage: 'far' });
          // 离得远：水面上弹出一个虚线小圈、一下一下推声呐波纹（不在画面里就在屏幕边给指向牌，一下一下往外探）；
          // 远远地“叮”一声带回声，偏向它那一边；不说话（C1）
          this.ping(s, 'far');
          this.audio && this.audio.play('beckon', { pan: this.screenOf(s.x, s.z).pan });
          fxTag('C1', '远方在招手');
        }
      }
    }
    this.pings = this.pings.filter((p) => this.time - p.t < (p.life || 7));
  }
  ping(s, stage, dig = false) {
    const p = { x: s.x, z: s.z, y: s.y ?? 0.2, r: s.r, t: this.time, stage, clue: !!s.clue, to: s.to || null, dig, label: stage === 'near' && !s.clue && !dig ? s.label : null };
    this.pings.push(p);
    if (this.pings.length > 6) this.pings.shift();
    return p;
  }
  // 水面上这一点在画面里吗、偏左还是偏右（声音按它摆左右）
  screenOf(x, z) {
    const cam = this.view.camera, v = new THREE.Vector3(x, 0.2, z).project(cam);
    const e = cam.matrixWorld.elements, rl = Math.hypot(e[0], e[2]) || 1; // 镜头的右手方向（水平那一份）
    const dx = x - cam.position.x, dz = z - cam.position.z, L = Math.hypot(dx, dz) || 1;
    return { on: v.z > -1 && v.z < 1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.9, pan: clamp((dx * e[0] + dz * e[2]) / L / rl * 1.2, -1, 1) * 0.7 };
  }
  // —————————————————— 这一趟的收尾 ——————————————————
  // 还能下网的地方：海底上、网够得着（不在完整甲板下、不太深、埋得不太深）的东西，和其中最省油的那一网要多少作业油
  netsLeft() {
    let n = 0, minFuel = Infinity;
    for (const r of this.world.regions.values()) for (const it of r.items.values()) {
      if (it.state !== 'seabed' || it.sealed || it.baseY < -MAX_DEPTH || it.burial > 0.7) continue;
      n++; minFuel = Math.min(minFuel, opFuelFor(-it.baseY));
    }
    return { n, minFuel };
  }
  // 网位都捞过、油不够再下一网、或者玩家在暂停里选了“结束这一趟”：等这一网揭晓完、船员搬上一会儿，出收获单
  updateEnd(dt) {
    if (this.ended) return;
    if (this.op || this.reveal.busy || !this.world.regions.size) { this.endT = 0; return; }
    const L = this.netsLeft();
    const why = this.endReq ? 'quit' : !L.n ? 'done' : this.boat.fuel < L.minFuel ? 'fuel' : null;
    if (!why) { this.endT = 0; return; }
    this.endT = (this.endT || 0) + dt;
    if (this.endT < (why === 'quit' ? 0 : 2.2)) return;
    this.endTrip(why);
  }
  endTrip(why) {
    this.ended = { why, t: this.time };
    if (this.mode === 'work') this.setMode('sail', true);
    this.pendingDrop = false;
    this.logEvent({ type: 'end', why });
    // 三种收工各有各的声音和船上那一下（C12）；收获单按 settle 定下的拍子一拍一拍放（C11）
    this.settle.endTrip(why);
    this.hud && this.hud.showHaul({ why, items: this.trip.items.slice(), total: this.trip.total, drops: this.trip.drops, fuel: this.boat.fuel, plan: this.ended.plan });
    this.audio && this.audio.play({ done: 'haulDone', fuel: 'haulFuel' }[why] || 'haulQuit');
  }
  // —————————————————— 镜头 ——————————————————
  updateCamera(dt, inp) {
    const c = this.cam, boat = this.boat;
    c.yaw -= inp.look.x * dt * 1.6;
    c.pitch = clamp(c.pitch + inp.look.y * dt * 0.9, 0.22, 1.35);
    // 缩放：滚轮按格跳一档，按住键/肩键按时间连续（与帧率无关）
    const dz = inp.zoom * 1.2 + (inp.zoomHold || 0) * dt * 26;
    if (this.mode === 'work') c.distWork = clamp(c.distWork + dz, 12, 60); else c.distSail = clamp(c.distSail + dz, 14, 80);
    if (c.ease) {
      if (Math.abs(inp.look.x) + Math.abs(inp.look.y) > 0.05) c.ease = null;
      else {
        const k = 1 - Math.exp(-dt * 3.2);
        c.yaw += angDiff(c.yaw, c.ease.yaw) * k; c.pitch += (c.ease.pitch - c.pitch) * k;
        if (Math.abs(angDiff(c.yaw, c.ease.yaw)) < 0.004 && Math.abs(c.ease.pitch - c.pitch) < 0.004) c.ease = null;
      }
    }
    const dist = this.mode === 'work' ? c.distWork : c.distSail;
    const focus = new THREE.Vector3();
    if (this.mode === 'work' || this.op) {
      const ax = this.op ? this.op.x : this.aim.x, az = this.op ? this.op.z : this.aim.z;
      const depth = this.est ? this.est.T : (this.op ? this.op.T : -8);
      focus.set(lerp(boat.x, ax, 0.78), Math.max(depth * 0.55, -13), lerp(boat.z, az, 0.78));
    } else {
      // 前方有浅滩（W2）：镜头往船头前面多带几米，把那道弧和岸放进画面
      c.lead = (c.lead ?? 6) + ((this.shoalWatch.level ? 12 : 6) - (c.lead ?? 6)) * Math.min(1, dt * 2.2);
      focus.set(boat.x + Math.sin(boat.heading) * c.lead, -2.5, boat.z + Math.cos(boat.heading) * c.lead);
    }
    const cp = Math.cos(c.pitch);
    const want = new THREE.Vector3(focus.x + Math.sin(c.yaw) * cp * dist, focus.y + Math.sin(c.pitch) * dist, focus.z + Math.cos(c.yaw) * cp * dist);
    let wantLook = focus;
    // 第一网：镜头凑近看它触底（F4）
    if (this.firsts.camK > 0 && (this.mode === 'work' || this.op)) wantLook = this.firsts.camera(want, wantLook, c, dist);
    // 珍品那一网起吊：镜头凑过去从侧面看吊臂和网（C4）
    if (this.omen.camK > 0 && (this.mode === 'work' || this.op)) wantLook = this.omen.camera(want, wantLook, c, dist);
    // 揭宝近景（同侧）
    const R = this.reveal.active;
    // 网带着东西转回甲板上空时，镜头先走到清洗位的近景：网包落下那一下镜头已经到位，看得清
    const pre = R ? null : this.reveal.preApproach();
    if ((R && R.phase !== 'pull') || pre) {
      const p = new THREE.Vector3(), l = new THREE.Vector3();
      this.reveal.cameraPose(p, l);
      want.copy(p); wantLook = l;
      c.blend = Math.min(1, c.blend + dt / 0.5);
    } else if (R && R.phase === 'pull') c.blend = Math.max(0, c.blend - dt / 1.25);
    else c.blend = 0;
    // 拉回以后镜头偏向舱口（珍品：跟着抱它的人），玩家一动就让回去（B19、C8）
    if (!this.debugCam && (!R || R.phase === 'pull') && !pre) this.keep.frame(want, wantLook, dt, inp);
    // 第一次看清沉船（F10）：憋住时往前探，爆发时拉高把船和沉船一起框进来
    if (!this.debugCam && !R && !pre) this.lessons.frame(want, wantLook, dt, inp);
    // 收工以后：镜头缓缓退到告别的位置（C11 预兆）
    if (!this.debugCam) this.settle.frame(want, wantLook, dt);
    if (this.debugCam) { want.copy(this.debugCam.pos); wantLook = this.debugCam.look; c.pos.copy(want); c.look.copy(wantLook); }
    if (want.y < 2) want.y = 2;
    if (!c.init) { c.pos.copy(want); c.look.copy(wantLook); c.init = true; c.vel = new THREE.Vector3(); c.lvel = new THREE.Vector3(); }
    // 临界阻尼弹簧跟随：从静止起步也是慢慢加速，不会一帧之内突然飞起来；不过冲
    const st = (R && R.phase !== 'pull') || pre ? this.reveal.camSmooth || 0.42 : R ? 0.46 : 0.3;
    // 拉回那 1.25 秒走一道弧（绕着船升起来、退出去），到位后交回给弹簧（B19）
    if (this.debugCam || !this.keep.arc(c, want, wantLook, dt)) { springTo(c.pos, c.vel, want, st, dt); springTo(c.look, c.lvel, wantLook, st, dt); }
    const cam = this.view.camera;
    cam.position.copy(c.pos);
    if (c.shake > 0) { c.shake = Math.max(0, c.shake - dt); cam.position.x += (Math.random() - 0.5) * c.shake * 0.4; cam.position.y += (Math.random() - 0.5) * c.shake * 0.4; }
    // 顿一下：镜头往下一沉再弹回（按画面上的像素给，离得远近都一样大）
    if (c.kick) {
      const K = c.kick; K.t += dt;
      const m = K.px / 1080 * 2 * cam.position.distanceTo(c.look) * Math.tan(cam.fov * Math.PI / 360);
      cam.position.y -= m * Math.exp(-K.t * 8) * Math.cos(K.t * 24);
      if (K.t > 0.7) c.kick = null;
    }
    // 撞上浅滩那一顿（W3）：镜头顺着船撞上去的方向往前一冲、弹回（不往下沉，和珍品确认那一下分开）
    if (c.jolt) {
      const J = c.jolt; J.t += dt;
      const m = J.px / 1080 * 2 * cam.position.distanceTo(c.look) * Math.tan(cam.fov * Math.PI / 360);
      const e = m * Math.exp(-J.t * 9) * Math.sin(J.t * 26) * (J.t < 0.03 ? J.t / 0.03 : 1);
      cam.position.x += J.dx * e; cam.position.z += J.dz * e;
      _lk.copy(c.look); _lk.x += J.dx * e * 0.4; _lk.z += J.dz * e * 0.4;
      if (J.t > 0.6) c.jolt = null;
      cam.lookAt(_lk);
    } else cam.lookAt(c.look);
    this.view.focus.set(c.look.x, Math.max(c.look.y, -14), c.look.z);
  }
  shake(a) { this.cam.shake = Math.max(this.cam.shake, a); }
  // 一下有方向的顿挫（珍品确认那一下，全清单唯一的大震）：px 是 1080 高画面上沉下去几像素
  kick(px) { this.cam.kick = { t: 0, px }; }
  // 撞上浅滩的一顿（W3）：px 是 1080 高画面上往前冲几像素（不超过 15），(dx, dz) 是船撞上去的方向
  jolt(px, dx, dz) { this.cam.jolt = { t: 0, px: Math.min(15, px), dx, dz }; }

  // —————————————————— 暂停 / 接管 ——————————————————
  setPaused(p) {
    this.paused = p;
    this.hud && (p ? this.hud.showPause(this) : this.hud.hidePause());
    this.audio && this.audio.setPaused(p);
  }
  // 演示中按 Esc：机器人停下，船位、油量、收获、海底与船员都保持原样，接着由玩家操作
  takeOver() {
    if (!this.piloted) return;
    this.piloted = false;
    this.demo = false;
    FIRSTS.carry(this);
    this.hud && this.hud.setDemo(false);
    this.hud && this.hud.keysFresh && this.hud.keysFresh();
  }
  // 底部那一行提示（同一时刻只有一句）；{Y} 这样的写法由界面换成玩家正在用的设备的键帽
  say(msg, type) { this.hud && this.hud.say && this.hud.say(msg, type); }
}
