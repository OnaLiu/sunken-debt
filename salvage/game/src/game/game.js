import * as THREE from 'three';
import { Pipeline } from '../render/pipeline.js';
import { U, PRESS, toon } from '../render/materials.js';
import { World } from '../world/world.js';
import { followWater, waveHeight } from '../world/water.js';
import { buildBoat, BOAT, solveCrane, poseCrane } from '../world/boat.js';
import { BoatController } from './boatCtl.js';
import { Chase } from './chase.js';
import { Cutout } from './cutout.js';
import { Peek } from './peek.js';
import { CameraRig } from './camera.js';
import { Input } from './input.js';
import { Particles, projScaleFor } from '../fx/particles.js';
import { ItemSystem } from './itemsys.js';
import { Arm } from './arm.js';
import { NetOp } from './netop.js';
import { Reveal } from './reveal.js';
import { Tally } from './tally.js';
import { Crew } from '../life/crew.js';
import { CrabLife } from '../life/crab.js';
import { FishLife } from '../life/fish.js';
import { Leviathan } from '../life/leviathan.js';
import { Threat } from './threat.js';
import { Audio } from '../audio/audio.js';
import { UI, KEYS, key, keepOut } from '../ui/hud.js';
import { ICON } from '../ui/icons.js';
import { Menus, WOBBLE_LEVELS, VOLUME_LEVELS, LOOK_LEVELS, INVERT_LEVELS } from '../ui/menus.js';
import { Thumbs } from '../ui/thumbs.js';
import { Events, Trip, MIN_NET_COST } from './trip.js';
import { Bot } from './bot.js';
import { SEA } from '../world/seas.js';
import { Forecast } from './forecast.js';
import { Feel } from './feel.js';
import { START, SHOAL, SHOAL_MARK, WRECK, TRAIL, HIDDEN_TIMBER, LOOSE_ITEMS, SEAL_SPOT, NET_SPOTS, SPOTS_TO_END, trenchZ, wreckToWorld } from '../world/layout.js';
import { seeItem, prepareSight, wreckBlocksSeg } from './sight.js';
import { hull2, segDist, polyDist } from '../util/screen2d.js';
import { ARM_TIP_H, NET_R, VIEW_W, VIEW_H, MAX_WORK_DEPTH, LOW_W, LOW_H, BOAT_ACCEL, BOAT_MAX_SPEED } from '../config.js';
import { damp, clamp, smoothstep, lerp, wrapAngle } from '../util/math.js';
import { seabedY } from '../world/terrain.js';
import { TAG } from '../world/collide.js';
import { floorPoint } from '../world/wreck.js';
import { setItemGlint, setItemMark, buildItemModel } from '../world/items.js';
import { Bundle } from './bundle.js';
import { FX, FX_RITUAL, fxName, fxTier } from '../fx/registry.js';
import { DeckStack } from './deck.js';
import { SnapAim } from './snap.js';
import { BatchWash } from './batch.js';
import { Moment } from './moment.js';
import { MomentBot } from './momentbot.js';
import { Gear } from './gear.js';
import { Harbor } from './harbor.js';
import { model } from '../assets/assets.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { KeyShow } from '../ui/keyshow.js';
import { T } from './tables.js';
window.__floorPoint = floorPoint;

// 开船（照载具求生）：W 油门、S 刹车和倒船、A/D 打舵；手柄左摇杆推过四成就当那个方向按着（载具求生的 0.38）
const NO_DRIVE = { throttle: 0, brake: 0, steer: 0 };
const driveOf = (inp) => ({ throttle: inp.my > 0.38 ? 1 : 0, brake: inp.my < -0.38 ? 1 : 0, steer: inp.mx > 0.38 ? 1 : inp.mx < -0.38 ? -1 : 0 });
const QUIT_HOLD_T = 1.0; // 开船时按住 B 多久算收工
const HIT_EASE = 0.1; // 砸下去「一顿」以后多久缓回原速（秒）
// 收网回甲板时镜头预先绕过去：最快每秒多少弧度、起步收住的加速度
const PRE_TURN_V = 0.36;
const PRE_TURN_A = 0.5;
// 打捞镜头：白圈挪得比这快（米/秒）就是正扫过去，先不算被挡住
const TIP_SETTLE = 1.5;
const LOCK_MODES = ['sail', 'arm', 'net', 'reveal', 'ending', 'batch']; // 这些时候鼠标锁在画面里
const STOW_TIP = new THREE.Vector3(4.3, 5.6, 0);
const BATCH_TIP = new THREE.Vector3(-1.8, 5.8, 0);
const AIM_DEAD = 2.5; // 打捞镜头：白圈离「看的地方」多远以内挪动时镜头不跟（米）
// 收工（C14）：镜头先在船上停一拍（看船员擦手、吊臂收回去），从这一秒起往舱口扎下去；END_DUR 秒时已经扎进舱口的黑里，接开舱清点（C15）
const END_DIVE = 1.3;
const END_DUR = 2.75;
// 坡下：船尾和滚落的货指向的方向（只给方向，不给落点）
const SLOPE_LEAD = { x: WRECK.x + 8, z: WRECK.z + 17 };
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _v2 = new THREE.Vector3();

// 方向箭头挪开时试的位置（顺着箭头往外 t、往两边 u），挪得少的在前
let LEAD_TRIES = null;
// 量镜头走多快时看的那几点（画面坐标 -1…1）：四角往里一点、中间
const MOTION_PTS = [[0, 0], [-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]];

export class Game {
  constructor(canvas, uiRoot, opts = {}) {
    this.demo = !!opts.demo;
    this.pipe = new Pipeline(canvas);
    this.world = new World();
    this.scene = this.world.scene;
    this.events = new Events();
    this.audio = new Audio();
    this.trip = new Trip();
    this.time = 0;
    this.clock = 0; // 全部经过的游戏时间（标题、暂停也算）：效果标签、录像对时用
    this.tags = !!opts.tags;
    this.fxLog = [];
    this.fxLast = {};

    this.boat = buildBoat();
    this.scene.add(this.boat.root);
    this.boatCtl = new BoatController(this.boat);
    this.chase = new Chase();
    this.cutout = new Cutout(this);
    this.peek = new Peek(this);
    this.cam = new CameraRig();
    this.input = new Input(document.getElementById('stage'));
    this.fx = new Particles(6000);
    this.scene.add(this.fx.points, this.fx.above);
    this.items = new ItemSystem(this.world);
    this.arm = new Arm(this.world, this.boatCtl);
    this.netop = new NetOp(this);
    this.forecast = new Forecast(this);
    this.crew = new Crew(this.boat, this);
    this.crabLife = new CrabLife(this);
    this.fish = new FishLife(this);
    this.leviathan = new Leviathan(this);
    this.feel = new Feel(this);
    this.threat = new Threat(this);
    // 鱼群一下散开：船压过来、网扎下来是一声「唰」（网的那下更响）；大轮廓来之前是一片一片的「呼——」
    this.fish.onScatter = (S, cause) => {
      const d = Math.hypot(S.home.x - this.cam.pivot.x, S.home.z - this.cam.pivot.z);
      if (d > 42) return;
      const sp = this.project(S.home);
      const pan = clamp((sp.x / VIEW_W) * 2 - 1, -0.8, 0.8);
      const gain = clamp(1.25 - d / 38, 0.25, 1);
      if (cause === 'lev') { this.audio.play('fishFlee', { pan, gain }); this.cue('C11', 4); }
      else if (cause === 'burst') this.audio.play('fishScatter', { pan, gain });
      else { this.audio.play('fishScatter', { pan, gain: gain * (cause === 'net' ? 1 : 0.7) }); this.pulse('A08', 1.5); }
    };
    this.ui = new UI(uiRoot, this);
    this.menus = new Menus(uiRoot, this);
    this.reveal = new Reveal(this);
    // 甲板码包、吸到点上、一甲板一起冲、第一段小样的这一刻（全游戏一份）
    this.deck = new DeckStack(this);
    this.snap = new SnapAim(this);
    this.batch = new BatchWash(this);
    this.moment = new Moment(this);
    this.keyShow = new KeyShow(this, uiRoot);
    this.tally = new Tally(this);
    // 钱、设备、债本，回港的债本和船坞两屏（全游戏一份，第一段三小段第一次做）
    this.gear = new Gear(this);
    this.harbor = new Harbor(this);
    this.thumbs = new Thumbs(this);
    this.pressIdx = 0;
    this.pressList = [];
    this.craneTip = STOW_TIP.clone();
    this.wake = [];
    this.wakeT = 0;
    this.mode = 'title';
    this.prevMode = 'sail';
    this.flags = {};
    this.firsts = {}; // 「第一次」：这一局里第一次落空、兜到蟹、刮到硬东西……
    this.seenIds = new Set(); // 这一趟玩家看见过的东西（收工只等看见过的）
    this.seenT = 0;
    this.seenIdx = 0;
    this.seenRound = 0;
    this.endAt = null;
    this.quitHold = null; // 开船时按住 B 收工：按了多久
    this.castQ = null; // 按了下网、吊臂还在路上（或船还在刹）：走到了再下
    this.denyT = 0;
    this.bot = null;
    this.timberShown = false;
    this.applySettings();
    this.bindEvents();
    this.resetTrip();
    this.warmup();
    this.enterTitle();
  }

  // 开局前把之后才出现的材质组合（网包外壳、近景光束、蟹、水槽……）先编译一遍，第一次出现时不卡帧
  warmup() {
    const r = this.pipe.renderer;
    // 声音图和收获单的小图也在这里备好：点开始、出收获单那一帧都不再现做
    this.audio.prepare();
    this.thumbs.get();
    const src = this.items.items.find((i) => i.kind === 'chest') || this.items.items[0];
    const model = buildItemModel(src.kind, { seed: 0.5, mud: 1, inflate: 0.045 });
    const b = new Bundle([{ kind: src.kind, def: src.def, model, r: src.r, h: model.info.h, tilt: 0, bury: 0 }]);
    this.scene.add(b.group);
    const hidden = [];
    this.scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
    r.setRenderTarget(this.pipe.low);
    r.compile(this.scene, this.cam.cam);
    const swap = [];
    this.scene.traverse((o) => {
      const sm = o.material && o.material.userData && o.material.userData.shadowMat;
      if (o.castShadow && sm) { swap.push([o, o.material]); o.material = sm; }
    });
    r.setRenderTarget(this.pipe.shadowRT);
    r.compile(this.scene, this.pipe.shadowCam);
    for (const [o, m] of swap) o.material = m;
    r.setRenderTarget(null);
    this.pipe.warm();
    for (const o of hidden) o.visible = false;
    this.scene.remove(b.group);
    // 船的外轮廓点也先取好（方向箭头第一次出来那一帧不现算）
    this.boatOnScreen();
    // 「看得见」对着沉船打视线用的包围盒树：开局前建好
    prepareSight(this);
  }

  get crabs() {
    return this.crabLife.catchables;
  }

  // 「晃动和折射」：震屏、闪光跟着它走；关了也留一点点，空间关系不变
  get wobbleK() {
    return 0.15 + 0.85 * (this.wobbleScale ?? 1);
  }

  // 水面上一圈慢慢扩开的涟漪（网入水、出水）
  ripple(x, z, r0, k = 1) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xeaf7f4, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(this.rippleGeo || (this.rippleGeo = new THREE.RingGeometry(0.93, 1, 48)), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 12;
    this.scene.add(mesh);
    (this.ripples = this.ripples || []).push({ mesh, x, z, r0, k, t: 0 });
  }

  rippleUpdate(dt) {
    if (!this.ripples) return;
    for (const R of this.ripples) {
      R.t += dt;
      const u = R.t / 2.8;
      const r = R.r0 + 6.5 * R.k * (1 - Math.pow(1 - Math.min(1, u), 2.2));
      R.mesh.scale.set(r, r, 1);
      R.mesh.position.set(R.x, waveHeight(R.x, R.z, this.time) + 0.06, R.z);
      R.mesh.material.opacity = 0.7 * R.k * Math.min(1, R.t * 8) * Math.max(0, 1 - u) * (1 - u);
    }
    this.ripples = this.ripples.filter((R) => {
      if (R.t < 2.8) return true;
      this.scene.remove(R.mesh);
      R.mesh.material.dispose();
      return false;
    });
  }

  applySettings() {
    const s = this.menus.settings;
    U.uWobble.value = WOBBLE_LEVELS[s.wobble].v;
    this.wobbleScale = WOBBLE_LEVELS[s.wobble].v;
    this.audio.setVolume(VOLUME_LEVELS[s.volume] * 0.9);
    // 镜头快慢、上下反转（存过旧设置、没有这两项的按默认）
    this.cam.lookK = (LOOK_LEVELS[s.look] || LOOK_LEVELS[2]).v;
    this.cam.invertY = !!(INVERT_LEVELS[s.invert] || INVERT_LEVELS[0]).v;
  }

  // look：只摆样子（回弹），不改记下的臂端
  setCraneTip(v, look = false) {
    if (!look) this.craneTip.copy(v);
    const sol = solveCrane(v);
    poseCrane(this.boat.crane, sol.yaw, sol.len, sol.elev);
  }

  // —— 一趟重新开始：海底、生物、船员、收获都从头来过 ——
  resetTrip() {
    this.introRest = null;
    this.resetTok = (this.resetTok || 0) + 1;
    this.trip.reset();
    this.items.reset();
    this.crabLife.reset();
    this.fish.reset();
    this.leviathan.reset();
    if (this.threat) this.threat.reset();
    this.crew.reset();
    this.reveal.reset();
    this.deck.reset();
    this.deck.enable(false);
    this.snap.reset();
    this.batch.reset();
    this.batch.close();
    this.chase.reset();
    this.cutout.reset();
    this.peek.reset();
    this.boatCtl.reset(START.x, START.z, START.heading);
    this.boatCtl.update(0.016, { x: 0, z: 0 }, 1, this.time);
    this.netop.phase = 'idle';
    this.netop.cable = 1.35;
    this.boat.net.state.close = 0;
    this.boat.net.updateSkirt();
    this.setCraneTip(STOW_TIP);
    this.arm.sync(STOW_TIP);
    this.castQ = null;
    this.netop.netPos.copy(this.netop.hookWorld()).y -= 2.8;
    this.wake = [];
    for (const p of PRESS.uPress.value) p.set(0, 0, 0, 0);
    this.pressList = [];
    this.flags = { trailIdx: 0, wreckNets: 0 };
    this.seenIds = new Set();
    this.seenT = 0;
    this.seenIdx = 0;
    this.seenRound = 0;
    this.endAt = null;
    this.quitHold = null;
    this.ui.quitShow(0, true);
    this.forecast.reset();
    this.feel.reset();
    this.timberShown = false;
    this.timberRise = null;
    this.glance = null;
    this.leadS = null;
    this.lookTo = null;
    this.beam = null;
    this.ending = null;
    this.igniteT = 0;
    this.startT = null;
    this.audio.hush(1, 1.0);
    if (this.pipe) this.pipe.compositeUniforms.uBeam.value.w = 0;
    if (this.timberMesh) { this.scene.remove(this.timberMesh); this.timberMesh = null; }
    this.placeTimberCorner();
    if (this.pings) for (const p of this.pings) this.scene.remove(p.mesh);
    this.pings = [];
    if (this.ripples) for (const R of this.ripples) this.scene.remove(R.mesh);
    this.ripples = [];
    this.ui.resetTally();
    this.fx.n = 0;
    this.cam.yawT = -Math.PI / 2 + 0.35;
    this.cam.pitchT = 0.62;
    this.cam.distT = 26;
    this.cam.pivotT.set(START.x + 3, 0, START.z);
    this.cam.snapTo();
    this.cam.alt.w = 0;
    this.cam.altT = this.cam.altDur;
    this.cam.alt.fov = 30;
    const pc = this.pipe.compositeUniforms;
    pc.uFlash.value = 0;
    pc.uDim.value = 0;
    pc.uFocus.value.z = 0;
    this.cam.thY = 0;
    this.cam.thV = 0;
    this.hitStop = 0;
  }

  // 效果页：每放一条之前把整个游戏回到「刚出港、什么都没发生」
  resetAll() {
    if (this.bot) this.bot.stop();
    this.bot = null;
    this.input.botDriven = false;
    this.input.virtual = null;
    this.menus.hidePause();
    this.menus.hideSummary();
    this.menus.hideTitle(true);
    this.ui.setPaused(false);
    this.timers = [];
    this.tally.end();
    this.resetTrip();
    this.ui.resetAll();
    this.ui.learned = { sail: true, arm: true, reveal: true };
    this.handedOver = false;
    this.firsts = {};
    this.mode = 'sail';
    this.ui.setHud(true);
    this.ui.setMode('sail');
    this.ui.demoBadge(false);
    this.ui.fade(false);
    const A = this.audio;
    A.loop('hose', false);
    A.setDread(0);
    A.duck(1, 0.01, 0, 0.01);
    A.setAmbience({ waves: 1, wind: 1, deep: 0, echo: 0, gate: 1 }, 0.01);
    A.engine(true);
    this.trip.time = 0;
    this.cam.yawT = -Math.PI / 2;
    this.cam.pitchT = 0.68;
    this.cam.distT = 27;
    this.cam.snapTo();
  }

  enterTitle() {
    this.mode = 'title';
    this.ui.setHud(false);
    this.ui.demoBadge(false);
    this.menus.hidePause();
    this.menus.hideSummary();
    this.menus.showTitle(this.demo);
    this.titleT = 0;
    // G01 开场：镜头先停在沉船上方看水底那片暗影，再升高、越过浅滩飞回港外的船上；
    // 快落定时「沉债」压着锚线砸下来，选项一项项亮起（任何键都能让它快一点）
    const bc = this.boatCtl, cam = this.cam;
    const dx = bc.pos.x - WRECK.x, dz = bc.pos.z - WRECK.z;
    this.titleIntro = { t: 0, dur: 6.4, yaw0: Math.atan2(-dx, -dz), yaw1: -Math.PI / 2 - 0.35 };
    this.crew.titlePose();
    cam.pivotT.set(WRECK.x, -5, WRECK.z);
    cam.pitchT = 1.3;
    cam.distT = 13;
    cam.yawT = this.titleIntro.yaw0;
    cam.snapTo();
  }

  titleIntroUpdate(dt, inp) {
    const I = this.titleIntro;
    if (inp.any) this.audio.unlock();
    if (!I || I.done) return;
    if (!I.cued) { I.cued = true; this.cue(this.demo || this.menus.titleDemo ? 'G02' : 'G01'); }
    if (inp.any && I.t < 4.2) I.fast = true;
    I.t += dt * (I.fast ? 2 : 1);
    I.yaw1 += dt * 0.045;
    if (!I.drop && I.t >= 4.2) { I.drop = true; this.menus.titleDrop(); this.audio.play('titleDrop'); }
    if (!I.lit && I.t >= 5.2) { I.lit = true; this.menus.titleLight(); }
    if (I.t >= I.dur) I.done = true;
  }

  // G03 出发：标题字沉进水里，镜头从标题机位滑到船后，起动机「咔咔咔」、着火「突」一下、烟囱一口黑烟，界面从边上滑进来，地名画出来
  startPlay(withBot) {
    this.audio.unlock();
    this.audio.play('menuGo');
    this.audio.play('titleSink');
    this.menus.sinkTitle();
    // 开场镜头还没飞完就点了开始：接着沿开场那条路飞回船后（快一点），不从沉船上方一下甩到船上。
    // 一帧标题都没显示就开始的（地址里带 autostart，自查工具用）：镜头直接摆在船后
    const I = this.titleIntro;
    this.introRest = I && !I.done && I.t > 0 && I.t < 5.8 ? { t: Math.max(I.t, 1.2), yaw0: I.yaw0 } : null;
    const atOnce = !!I && I.t === 0;
    this.titleIntro = null;
    this.ui.setHud(true);
    this.ui.hudEnter();
    this.crew.toPosts();
    this.igniteT = 0.95;
    this.startT = 0;
    this.later(0.25, () => this.audio.play('ignite'));
    for (const [t, k] of [[0.41, 0.28], [0.59, 0.32], [0.77, 0.36]]) this.later(t, () => this.feel.puff(1, k));
    this.later(0.95, () => { this.audio.engine(true); this.feel.puff(2, 0.85); });
    this.cue('G03');
    this.mode = 'sail';
    this.ui.setMode('sail');
    this.trip.time = 0;
    this.cam.yawT = -Math.PI / 2;
    this.cam.pitchT = 0.68;
    this.cam.distT = 27;
    if (atOnce) {
      const bc = this.boatCtl, f = bc.forward;
      this.cam.pivotT.set(bc.pos.x + f.x * 3, 0, bc.pos.z + f.z * 3);
      this.cam.snapTo();
    }
    if (withBot) {
      this.bot = new Bot(this);
      this.input.botDriven = true;
      this.ui.demoBadge(true);
    } else {
      // 自己玩：鼠标锁进画面（点「开始打捞」那一下就是要的那次点击）
      this.input.wantLock = true;
      this.input.lock();
    }
    this.later(1.1, () => this.ui.place(T('地名·港外航路')));
  }

  // 这一刻的自动演示：机器人照玩家的样子挑一处、按一下、开冲（只通过虚拟手柄）
  startMomentDemo() {
    this.bot = new MomentBot(this);
    this.input.botDriven = true;
    this.ui.demoBadge(true);
    this.ui.learned = { sail: true, arm: true, reveal: true };
  }

  // 接管：演示徽标收起，模式条旁边出现这里能按的键——这就是按了 Esc 的结果
  takeOver() {
    if (!this.bot) return;
    this.bot.stop();
    this.bot = null;
    this.input.botDriven = false;
    this.input.virtual = null;
    this.ui.demoBadge(false, true);
    this.ui.hintKey = null;
    this.handedOver = true;
    // D04 现在归我了：演示牌往上收起，模式牌旁滑出这里能按的键，一声轻的确认
    this.audio.duck(0.6, 0.04, 0.35, 0.6);
    this.audio.play('takeover');
    this.cue('D04');
  }

  bindEvents() {
    const E = this.events;
    E.on('netTouch', (e) => {
      this.crabLife.disturb(e.x, e.z, NET_R, 5);
    });
    // 在沉船这儿下过几网：之后开船时箭头指向坡下
    E.on('netStart', (ev) => {
      if (Math.hypot(ev.tip.x - WRECK.x, ev.tip.z - WRECK.z) < 16) this.flags.wreckNets++;
    });
    E.on('netEnter', (e) => {
      this.crabLife.disturb(e.x, e.z, 0, 0);
    });
    E.on('netSurface', () => {
      // 甲板码包：这一包不当场冲，船员不拿水管
      if (this.deck.on) return;
      this.crew.setMode('wash');
      const phi = this.reveal.plan();
      if (!this.crew.washer) this.crew.startWash({ x: BOAT.wash.x, z: BOAT.wash.z }, phi);
    });
    // 出了岔子才说一句
    E.on('hitHard', (e) => {
      this.ui.toast(T('提示·碰到硬东西'), 2.6);  // 表的 id，不是玩家看的
      const end = this.showTimberCorner(e.x, e.z);
      this.cue('B23');
      this.firsts = this.firsts || {};
      if (!this.firsts.hard && end) {
        // 第一次刮到硬东西：镜头往那根船材偏半秒——原来那一角是这个
        this.firsts.hard = true;
        this.glance = { x: end.x, y: seabedY(end.x, end.z), z: end.z, t: 0, dur: 1.1 };
        this.cue('F07');
      }
    });
    E.on('crabExposed', () => {
      this.flags.crabExposed = true;
    });
    // 甲板码包：网一收回（这一包落到它的位子上），就回到打捞模式挑下一处
    E.on('netDone', () => {
      if (this.deck.on && this.mode === 'net') {
        this.mode = 'arm';
        this.ui.setMode('arm');
        this.castQ = null;
        if (this.snap) this.snap.refresh(true);
      }
    });
    // 冲洗完：回到打捞模式，白圈还在刚才那一网的地方（接着下、或者右键回去开船）
    E.on('revealDone', () => {
      // 一甲板一起冲的压轴揭完：接着出这一甲板的结算，不回打捞模式
      if (this.moment.on && this.batch.phase === 'finale') { this.batch.finaleDone(this.moment.finaleEntries); return; }
      this.mode = 'arm';
      this.ui.setMode('arm');
      this.ui.learn('reveal');
      this.castQ = null;
    });
  }

  later(t, fn) {
    (this.timers = this.timers || []).push({ t, fn });
  }

  // 放了一个效果：记下来（效果页、录像核对用）；打开标签时角上写出编号和名字。
  // every：持续的效果同一编号隔这么久才算新的一次
  // 一阵一阵的事（不是一直在的）：离上一次记下超过 gap 秒才再记一次
  pulse(id, gap) {
    const l = this.fxLast[id];
    if (l !== undefined && this.clock - l < gap) return;
    this.cue(id);
  }

  cue(id, every = 0) {
    if (!FX[id]) return;
    const last = this.fxLast[id];
    if (every && last !== undefined && this.clock - last < every) { if (this.tags) this.ui.tag(id, fxName(id), fxTier(id), true); this.fxLast[id] = this.clock; return; }
    this.fxLast[id] = this.clock;
    this.fxLog.push({ id, t: +this.clock.toFixed(3) });
    if (this.fxLog.length > 600) this.fxLog.splice(0, 200);
    if (this.tags) this.ui.tag(id, fxName(id), fxTier(id), false, FX_RITUAL.includes(id));
    if (this.onCue) this.onCue(id);
  }

  // 埋着的船材：一开始就有一角黑木头戳出泥面（看不清是什么，但露过面）；
  // 网刮到它以后，刮开的那一端露得更多
  timberEnds() {
    const T = HIDDEN_TIMBER;
    const dx = Math.cos(T.rot), dz = -Math.sin(T.rot);
    return [{ x: T.x - dx * T.len * 0.5, z: T.z - dz * T.len * 0.5 }, { x: T.x + dx * T.len * 0.5, z: T.z + dz * T.len * 0.5 }];
  }

  placeTimberCorner() {
    const [a, b] = this.timberEnds();
    // 坡上那一端（浅一点）露出来
    const e = seabedY(a.x, a.z) > seabedY(b.x, b.z) ? a : b;
    this.timberMesh = this.timberPiece(e, 0.7, 0.07);
  }

  timberPiece(e, len, rise, color = 0x3e2f20) {
    const T = HIDDEN_TIMBER;
    const M = model('沉船-埋着的船材'); // 不是玩家看的：素材的文件名
    if (M) {
      // 素材是整根（3.4 米，原点在中间，+X 那头是劈茬）：劈茬那头朝外，露出来的这一截（len）和原来那一块一样大、在一样的位置
      // （中心在这一端上），其余比坡再往下斜 0.18 弧度扎进泥里。刮开以后是新鲜的浅色木头：贴图乘上浅木色和黑木色的比
      const [a, b] = this.timberEnds();
      const o = e === a ? b : a;
      const d = Math.hypot(e.x - o.x, e.z - o.z);
      const ux = (e.x - o.x) / d, uz = (e.z - o.z) / d;
      const slope = (seabedY(e.x, e.z) - seabedY(o.x, o.z)) / d;
      const mat = toon({ map: M.parts[0].map, spec: 0.1 });
      const c = new THREE.Color(color), base = new THREE.Color(0x3e2f20);
      mat.uniforms.uColor.value.setRGB(c.r / base.r, c.g / base.g, c.b / base.b);
      const wood = new THREE.Mesh(mergeGeometries(M.parts.map((p) => p.geometry)), mat);
      wood.rotation.set(0.25, Math.atan2(-uz, ux), Math.atan(slope) + 0.18, 'YXZ');
      wood.updateMatrix();
      const at = new THREE.Vector3(T.len / 2 - len / 2, 0, 0).applyEuler(wood.rotation);
      wood.position.set(e.x, seabedY(e.x, e.z) - 0.13 + rise, e.z).sub(at);
      wood.castShadow = true;
      this.scene.add(wood);
      return wood;
    }
    const wood = new THREE.Mesh(new THREE.BoxGeometry(len, 0.26, 0.34), toon({ color, spec: 0.1 }));
    wood.position.set(e.x, seabedY(e.x, e.z) - 0.13 + rise, e.z);
    wood.rotation.set(0.25, T.rot, 0.18, 'YXZ');
    wood.castShadow = true;
    this.scene.add(wood);
    return wood;
  }

  showTimberCorner(x, z) {
    if (this.timberShown) return null;
    this.timberShown = true;
    const [a, b] = this.timberEnds();
    // 离网口最近的那一端
    const e = Math.hypot(a.x - x, a.z - z) < Math.hypot(b.x - x, b.z - z) ? a : b;
    if (this.timberMesh) this.scene.remove(this.timberMesh);
    // 被网刮开的那一端从泥里翘起来、多露出一截（0.5 秒顶上来）
    // 网刮掉了泥皮：露出来的那截是新鲜的浅色木头，深处也分得出来
    this.timberMesh = this.timberPiece(e, 1.3, 0.2, 0x9a7650);
    this.timberRise = { t: 0, y1: this.timberMesh.position.y };
    this.timberMesh.position.y -= 0.22;
    const y = seabedY(e.x, e.z);
    // 翻起来的泥：亮的一团往上冒、越冒越高（深处也看得见），沙粒溅开
    for (let i = 0; i < 26; i++) {
      const ang = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.0;
      const up = i < 12 ? 2.2 + Math.random() * 1.6 : 0.8 + Math.random() * 0.8;
      this.fx.emit('cloud', e.x + Math.cos(ang) * 0.3, y + 0.25, e.z + Math.sin(ang) * 0.3, Math.cos(ang) * sp, up, Math.sin(ang) * sp, { color: [0.86, 0.8, 0.66], size: 1.2, life: 5 });
    }
    this.fx.burst('sand', e.x, y + 0.15, e.z, 30, 2.2, 0.8, { up: 1.2 });
    // 泥里憋着的气一串串跑出来，浮到水面上鼓一下
    for (let i = 0; i < 26; i++) this.fx.emit('bubble', e.x + (Math.random() - 0.5) * 0.8, y + 0.3 + Math.random() * 0.6, e.z + (Math.random() - 0.5) * 0.8, 0, 1.4 + Math.random() * 1.6, 0, { size: 0.1 + Math.random() * 0.08, life: 9 });
    const tok = this.resetTok;
    this.later(Math.min(3.2, -y / 7.5), () => {
      if (tok !== this.resetTok) return;
      this.ripple(e.x, e.z, 0.5, 0.75);
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        this.fx.emit('foam', e.x + Math.cos(a) * 0.4, 0.05, e.z + Math.sin(a) * 0.4, Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8, { life: 2.2, size: 0.26 });
      }
    });
    return e;
  }

  // 一圈往外扩的亮环：世界里刚发生了值得看一眼的事（蟹翻出了东西）
  // C04 蟹翻泥翻出了印章：翻开的泥上一圈亮环扩开三次，印章那一点亮一下，远处很轻一声「叮」。
  // 常常在船壳另一侧：隔着船壳也画出来，告诉玩家「那边刚动过」，转过去看
  ping(x, y, z) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 }, uA: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uK; uniform float uA;
        void main(){
          float r = length(vUv);
          if (r > 1.0) discard;
          float band = exp(-pow((r - uK) / 0.05, 2.0));
          float halo = exp(-pow((r - uK) / 0.17, 2.0)) * 0.32;
          float core = exp(-r * r / 0.01) * (1.0 - uK) * 1.2;
          float a = (band + halo + core) * uA * smoothstep(1.0, 0.85, r);
          gl_FragColor = vec4(vec3(1.0, 0.84, 0.42) * a, 1.0);
        }`,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y + 0.12, z);
    mesh.renderOrder = 28;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.pings.push({ mesh, t: 0, n: -1, x, y, z });
    const s = this.project(mesh.position);
    this.audio.play('pingFar', { pan: clamp((s.x / VIEW_W) * 2 - 1, -0.8, 0.8) });
    this.cue('C04');
  }

  pingUpdate(dt) {
    const P = 1.25, N = 3;
    for (const p of this.pings) {
      p.t += dt;
      const n = Math.floor(p.t / P);
      const k = (p.t % P) / P;
      const u = p.mesh.material.uniforms;
      u.uK.value = 0.06 + 0.94 * (1 - (1 - k) * (1 - k));
      // 亮着的时候镜头推到甲板近景：跟着淡掉（不隔着甲板画）
      u.uA.value = (n < N ? Math.pow(1 - k, 0.8) * Math.min(1, k * 12) * (n === N - 1 ? 0.75 : 1) : 0) * (1 - Math.min(1, this.cam.alt.w * 3));
      // 每一圈出来时，印章那一点闪一下
      if (n !== p.n && n < N) {
        p.n = n;
        this.fx.emit('flick', p.x, p.y + 0.15, p.z, 0, 0, 0, { size: 1.3 - n * 0.2, life: 0.5 });
        const seal = this.items.seal;
        if (seal && seal.state === 'seabed') {
          setItemGlint(seal.model, 2.0);
          this.later(0.25, () => { if (seal.state === 'seabed') setItemGlint(seal.model, 0.3); });
        }
      }
    }
    this.pings = this.pings.filter((p) => {
      if (p.t < P * N) return true;
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      return false;
    });
  }

  project(p) {
    _v.copy(p).project(this.cam.cam);
    return { x: (_v.x + 1) * 0.5 * VIEW_W, y: (1 - _v.y) * 0.5 * VIEW_H, z: _v.z };
  }

  // —— 每帧 ——
  // 砸下去、崩开那一下的「一顿」：世界慢到两成走几帧，再一下接上（真实时间 t 秒）
  hit(t) {
    this.hitStop = Math.max(this.hitStop || 0, t);
  }

  frame(dt) {
    // 镜头照真实时间走：世界慢下来那一下镜头不跟着一卡（一顿的是砸下来的东西，不是画面）
    this.camDt = dt;
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      this.hitEase = HIT_EASE;
      dt *= 0.2;
    } else if (this.hitEase > 0) {
      // 一顿完了不一下弹回原速：十分之一秒里缓缓接上
      const k = 1 - this.hitEase / HIT_EASE;
      this.hitEase -= dt;
      dt *= 0.2 + 0.8 * k * k * (3 - 2 * k);
    }
    this.clock += dt;
    if (this.leadHold > 0) this.leadHold -= dt;
    this.audio.tick(dt);
    if (this.tags) this.ui.tagTick(dt);
    // 鼠标锁：玩的时候锁在画面里，菜单、标题、收获单放开（看得见指针）
    const wasLock = this.input.wantLock;
    // 这一刻（小样）指针一直看得见、指哪捞哪，不锁
    this.input.wantLock = !this.bot && LOCK_MODES.includes(this.mode) && !this.moment.on;
    if (this.input.wantLock && !wasLock) this.input.lock();
    const inp = this.bot ? (this.bot.update(dt), this.input.poll()) : this.input.poll();
    this.peek.aim(inp);
    this.ui.setDevice(this.input.device);
    // 游戏时钟上的延时：暂停时一起停
    if (this.timers && this.mode !== 'pause') {
      for (const t of this.timers) t.t -= dt;
      const due = this.timers.filter((t) => t.t <= 0);
      this.timers = this.timers.filter((t) => t.t > 0);
      for (const t of due) t.fn();
    }

    // 全局：Esc
    if (this.mode === 'title') {
      this.titleT += dt;
      this.titleIntroUpdate(dt, inp);
      const act = this.menus.titleInput(inp, dt);
      if (act === 'play') this.startPlay(false);
      else if (act === 'demo') this.startPlay(true);
      else if (act === 'settings') { this.audio.unlock(); this.mode = 'settings'; this.menus.showPause(true); }
      this.simulate(dt, { mx: 0, my: 0, lx: 0, ly: 0, zoom: 0, a: false, aHeld: false, b: false }, true);
      this.cam.yawT += dt * 0.045;
      this.render(dt);
      return;
    }
    if (this.mode === 'settings') {
      const act = this.menus.pauseInput(inp, dt);
      if (act === 'back') { this.menus.hidePause(); this.mode = 'title'; }
      this.simulate(dt, { mx: 0, my: 0, lx: 0, ly: 0, zoom: 0 }, true);
      this.cam.yawT += dt * 0.045;
      this.render(dt);
      return;
    }
    if (inp.esc && this.bot) {
      this.takeOver();
      inp.esc = false;
    }
    if (this.mode === 'pause') {
      const act = this.menus.pauseInput(inp, dt);
      if (act === 'resume') { this.hidePause(true); this.mode = this.prevMode; }
      else if (act === 'end') { this.audio.play('menuGo'); this.hidePause(true); this.mode = this.prevMode; this.endTrip(null); }
      else if (act === 'restart') { this.hidePause(true); this.mode = this.prevMode; this.moment.restart(); }
      else if (act === 'title') { this.audio.play('menuGo'); this.hidePause(); this.bot = null; this.input.botDriven = false; this.resetTrip(); this.enterTitle(); }
      // 停在「晃动和折射」上：别的都停着，只有水面接着晃，调的时候看得见变成什么样
      if (this.menus.peek) U.uTime.value += dt;
      this.render(0);
      return;
    }
    if (this.mode === 'result') {
      this.moment.resultInput(dt, inp);
      // 按了接着捞、回港开舱：下一帧照新的模式走
      if (this.mode !== 'result') { this.render(dt); return; }
      this.trip.time += dt;
      this.simulate(dt, { mx: 0, my: 0, lx: 0, ly: 0, px: 0, py: 0, zoom: 0 }, false);
      this.render(dt);
      return;
    }
    if (this.mode === 'summary') {
      const act = this.tally.update(dt, inp);
      // 三小段：开完舱翻开债本；原来那一整趟（trip=1）照旧再来一趟
      if (act === 'again') { if (this.moment.on) this.moment.afterTally(); else this.restart(); }
      this.simulate(dt, { mx: 0, my: 0, lx: 0, ly: 0, zoom: 0 }, false);
      this.render(dt);
      return;
    }
    // 回港以后：债本、船坞（世界照常走，镜头绕着船慢慢转）
    if (this.mode === 'debt' || this.mode === 'dock') {
      this.harbor.update(dt, inp);
      if (this.mode === 'debt' && this.tally.active) this.tally.update(dt, {});
      this.simulate(dt, { mx: 0, my: 0, lx: 0, ly: 0, px: 0, py: 0, zoom: 0 }, true);
      this.render(dt);
      return;
    }
    // 暂停（机器人也用菜单结束这一趟）。打捞模式里 Esc 是退出打捞（在 simulate 里），不是暂停
    if ((inp.esc && (this.mode !== 'arm' || this.moment.on) && this.mode !== 'fading' || inp.start) && !this.bot || inp.start && this.bot) {
      this.prevMode = this.mode;
      this.mode = 'pause';
      this.ui.setPaused(true);
      this.ui.update(0, this.hudState());
      this.menus.showPause(false);
      // D01 世界停住：一声闷的「咔」，海浪和引擎退到后面
      this.pauseHush = this.audio.st ? this.audio.st.hush ?? 1 : 1;
      this.audio.hush(Math.min(this.pauseHush, 0.35), 0.25);
      this.audio.play('pauseOn');
      this.cue('D01');
      this.render(0);
      return;
    }
    // 再来一趟：舱盖拉上那几下还在舱里演
    if (this.mode === 'fading' && this.tally.active) this.tally.update(dt, {});
    this.trip.time += dt;
    this.simulate(dt, inp, false);
    this.render(dt);
  }

  // C16 再来一趟：「再来一趟」按下去，舱盖拉上——影子从光进来的那一边扫过整舱，光灭；
  // 黑下来，黑场里一道浪涌上来又退下（别的声音让开），亮起来时船已在港外
  restart() {
    // 「再来一趟」先按下去（D05 自动演示里是走满的条替人按的）
    this.menus.pressAgain();
    this.audio.play('press');
    if (this.bot) this.cue('D05');
    this.mode = 'fading';
    this.cue('C16');
    this.later(0.14, () => this.tally.close());
    this.later(0.95, () => {
      this.ui.fade(true);
      this.audio.hush(0.2, 0.5);
      this.audio.play('waveSwell');
    });
    this.later(1.85, () => {
      this.tally.end();
      this.menus.hideSummary();
      this.resetTrip();
      this.ui.setHud(true);
      this.mode = 'sail';
      this.ui.setMode('sail');
      this.ui.fade(false);
      this.ui.place(T('地名·港外航路'));
      if (this.bot) this.bot.restart();
    });
  }

  // slide：继续 / 结束这一趟时反着收起来，声音回来
  hidePause(slide = false) {
    this.menus.hidePause(slide);
    if (slide) {
      this.audio.play('pauseOff');
      this.audio.hush(this.pauseHush ?? 1, 0.3);
    }
    this.ui.setPaused(false);
  }

  // C14 收工：吊臂收回原位（不在调臂了，吊臂自己回去），船员停下手里的活擦擦手；两个往下落的音，界面淡下去。
  // 镜头先在船上停一拍看他们，再往甲板中间那个开着的舱口扎下去——舱口越来越大、里面是黑的，黑透了就到了舱里（C15 开舱清点）
  startEnding() {
    const cam = this.cam;
    this.ending = { t: 0, dur: END_DUR, pitch0: cam.pitchT, dist0: cam.distT, yaw0: cam.yawT };
    // 收工镜头停在船上那一拍（看船员擦手）大概在哪儿：船员挑站位时躲开从那儿看过去被吊臂、网圈、驾驶舱挡着的地方
    const E = this.ending, v = new THREE.Vector3();
    this.boat.body.updateMatrixWorld(true);
    const eyeAt = (t) => { const P = this.endPose(t); return this.boat.body.worldToLocal(P.pos.clone()); };
    const eyes = { wipe: [0.5, 0.95, 1.35].map(eyeAt), rail: [1.6, 2.0].map(eyeAt) };
    const wasArm = this.mode === 'arm';
    this.mode = 'ending';
    this.castQ = null;
    this.lookTo = null;
    if (wasArm) this.audio.play('craneStow');
    const free = this.crew.wipeHands(eyes);
    // 镜头先停在船员那儿：没在搬货的那几个人要站过去的地方中间
    let cx = 0, cz = 0;
    for (const s of free) {
      v.set(s.wipeX, BOAT.deckY, s.wipeZ);
      this.boat.body.localToWorld(v);
      cx += v.x; cz += v.z;
    }
    if (free.length) { E.cx = cx / free.length; E.cz = cz / free.length; }
    this.cue('C14');
  }

  // 收工镜头在第 t 秒：视点、俯角、远近、朝向（相机位置也算出来，给船员挑站位用）
  endPose(t) {
    const E = this.ending, bc = this.boatCtl;
    const hp = this.boat.body.localToWorld(_v2.set(BOAT.hatch.x, BOAT.deckY, BOAT.hatch.z));
    const k0 = smoothstep(0, 1.15, t);
    const k1 = smoothstep(END_DIVE, END_DUR - 0.15, t);
    // 扎下去越来越快
    const kd = k1 * k1;
    const cx = E.cx ?? bc.pos.x, cz = E.cz ?? bc.pos.z;
    // 先看甲板：船员擦手的地方和舱口之间
    const ax = lerp(bc.pos.x, lerp(cx, hp.x, 0.45), 0.7 * k0), az = lerp(bc.pos.z, lerp(cz, hp.z, 0.45), 0.7 * k0);
    // 视点先对正舱口（先快后慢），远近再越扎越快：黑下来之前舱口已经在画面正中
    const kp = 1 - (1 - k1) * (1 - k1);
    const pivot = new THREE.Vector3(lerp(ax, hp.x, kp), lerp(0.9 * k0, hp.y - 0.6, kd), lerp(az, hp.z, kp));
    const pitch = lerp(lerp(E.pitch0, 1.0, k0), 1.5, kd);
    const near = Math.min(E.dist0, 13);
    const d0 = lerp(E.dist0, near, k0);
    const dist = Math.exp(lerp(Math.log(d0), Math.log(1.25), kd));
    const yaw = E.yaw0 + 0.22 * kd;
    const pos = new THREE.Vector3(pivot.x + Math.sin(yaw) * Math.cos(pitch) * dist, pivot.y + Math.sin(pitch) * dist, pivot.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    return { pivot, pitch, dist, yaw, pos };
  }

  // 这一趟做到的事（收获单底下一行）：只说这一趟真发生过的，数得清的就是舱里摆着的那几件
  tripDeeds() {
    const TR = this.trip, d = [];
    // 三小段：沉船不用找（一出海就停在它旁边），这一趟说的是冲了几甲板
    if (this.moment.on) { if (this.moment.decks > 1) d.push(T('开舱·冲了几甲板', { n: this.moment.decks })); }
    else if (TR.sawWreck) d.push(T('开舱·找到沉船'));
    const crabs = TR.haul.filter((h) => h.kind === 'crab').length;
    if (crabs) d.push(T('开舱·活蟹', { n: ['', '一', '两', '三', '四'][crabs] || crabs }));
    const by = {};
    for (const h of TR.haul) (by[h.name] = by[h.name] || []).push(h);
    for (const [n, l] of Object.entries(by)) {
      const from = [...new Set(l.map((h) => h.from).filter(Boolean))];
      if (l.length >= 2 && from.length >= 2) d.push(T('开舱·对上了', { a: from[0], b: from[1], n }));
    }
    if (TR.sawLev) d.push(T('开舱·见过它'));
    return d;
  }

  // reason：只有游戏替玩家收工时才有（油不够、都捞完了），玩家自己收工不用解释
  endTrip(reason) {
    if (this.trip.ended) return;
    this.trip.ended = true;
    this.trip.endReason = reason;
  }

  stickPushed(inp) {
    return Math.hypot(inp.mx, inp.my) > 0.6 && !this.stickWas;
  }

  // 网在水里、船员在冲洗时推摇杆、动鼠标：说一句为什么不行（一阵一阵地动只说一次）
  busyPoke(inp, dt) {
    // 鼠标慢慢挪也算：最近一小会儿挪过的路程攒起来
    this.pokeAcc = (this.pokeAcc || 0) * Math.exp(-dt * 6) + Math.hypot(inp.px, inp.py);
    const moved = Math.hypot(inp.lx, inp.ly) > 0.5 || this.pokeAcc > 40 || Math.hypot(inp.mx, inp.my) > 0.6;
    this.denyT = Math.max(0, this.denyT - dt);
    const fresh = moved && !this.pokeWas && this.denyT <= 0;
    this.pokeWas = moved || (this.pokeWas && this.denyT > 0);
    if (!moved) this.pokeWas = false;
    if (fresh) this.denyT = 1.4;
    return fresh;
  }

  // 进打捞模式：白圈出现在镜头看过去的那一侧，吊臂自己转过去；船照样能开
  enterSalvage() {
    this.mode = 'arm';
    this.ui.setMode('arm');
    this.ui.learn('sail');
    this.castQ = null;
    // 打捞镜头有自己的远近（滚轮调过就记着），回去开船时还原开船的远近
    this.sailDist = this.lookTo ? this.lookTo.d0 : this.cam.distT;
    this.lookTo = null;
    this.chase.stop(this.cam);
    this.cam.distT = this.salvDist ?? 25;
    const fwd = this.cam.stickToWorld(0, 1);
    this.arm.aimToward(fwd);
    this.arm.pushOut = 0;
    this.reachWasOut = false;
    this.audio.play('armOn');
    this.cue('A14');
  }

  exitSalvage() {
    this.mode = 'sail';
    this.ui.setMode('sail');
    this.castQ = null;
    this.arm.lead = this.arm.wish = null;
    this.salvDist = this.cam.distT;
    // 开船的俯角、远近不一下设过去（一下设过去镜头起步就是每秒一百多度）：目标自己慢慢滑回去，玩家一动镜头那一项就停（见 updateCamera）
    this.sailGlide = { pitch: this.cam.pitchT > 0.8 ? 0.72 : null, dist: this.sailDist || null };
    this.audio.play('armOff');
    this.cue('A15');
  }

  // 打捞模式里挪白圈：鼠标挪多少、白圈在画面上就往那边走多少；右摇杆是速度。
  // 按这一刻的镜头精确换算：从镜头穿过「白圈在画面上挪过去的那一点」的视线，和白圈那一层（落点深浅）的水平面交在哪，
  // 白圈就挪到哪——斜着看、白圈不在画面正中时也不走歪（以前按镜头朝向近似，横推、斜推偏 6—12°）
  moveAim(inp, dt) {
    const c = this.cam.cam;
    const A = this.arm;
    const ev = A.eval;
    const gy = ev && ev.restY > -100 ? ev.restY : this.world.surfaceAt(A.aim.x, A.aim.z).y;
    const k = 1 / this.input.scale;
    // 摇杆：推满一秒走大半个画面高；轻推慢、好对准
    const stick = (v) => Math.sign(v) * Math.pow(Math.abs(v), 1.6);
    const sp = 0.55 * VIEW_H;
    // 这一帧白圈在画面上要走多少（逻辑画面像素，往右、往下为正）
    const sx = inp.px * k + stick(inp.lx) * sp * dt;
    const sy = inp.py * k - stick(inp.ly) * sp * dt;
    if (Math.abs(sx) + Math.abs(sy) < 1e-4) { this.reachWasOut = false; return; }
    const P = _v.set(A.aim.x, gy, A.aim.z);
    const n = _w.copy(P).project(c);
    let dx, dz;
    const ray = _v2.set(n.x + (sx / VIEW_W) * 2, n.y - (sy / VIEW_H) * 2, 0.5).unproject(c).sub(c.position).normalize();
    if (n.z < 1 && ray.y < -0.08) {
      // 挪过去那儿的落点可能深一点、浅一点（坡上）：按那儿的深浅再交一次，白圈在画面上正好落到推到的地方
      let y = gy, hx = 0, hz = 0;
      for (let it = 0; it < 3; it++) {
        const tHit = (y - c.position.y) / ray.y;
        hx = c.position.x + ray.x * tHit;
        hz = c.position.z + ray.z * tHit;
        if (it < 2) y = A.restYAt(hx, hz);
      }
      dx = hx - P.x;
      dz = hz - P.z;
    } else {
      // 白圈不在画面里（镜头正在切）：按镜头朝向近似
      const D = Math.max(4, c.position.distanceTo(P));
      const wpp = (2 * D * Math.tan(THREE.MathUtils.degToRad(c.fov / 2))) / VIEW_H;
      const sinE = clamp((c.position.y - gy) / D, 0.45, 1);
      const yaw = this.cam.yaw;
      const dr = sx * wpp, df = (-sy * wpp) / sinE;
      dx = Math.cos(yaw) * dr - Math.sin(yaw) * df;
      dz = -Math.sin(yaw) * dr - Math.cos(yaw) * df;
    }
    const len = Math.hypot(dx, dz);
    // 记下这一帧往哪推：镜头这一帧只顺着这个方向跟（见 aimFrame、updateCamera），白圈在画面上不被带歪
    const push = this.aimPush = { t: this.time, ux: dx / (len || 1), uz: dz / (len || 1), len, dy: 0 };
    const out = A.nudge(dx, dz);
    // 落点深浅跟着变了多少（坡上）
    push.dy = A.restYAt(A.aim.x, A.aim.z) - gy;
    this.aimFrame();
    // 镜头不跟着白圈绕船转：挪白圈只让镜头平移着跟（转镜头最容易晕）；白圈真被挡住时 salvageView 才慢慢转过去
    // 白圈顶到够不着的地方：外面那一圈亮一下，一声软的「嘣」
    if (out && !this.reachWasOut && !(this.reachBumpT > 0)) {
      this.reachBumpT = 0.5;
      this.audio.play('reachBump');
      this.cue('A19');
    }
    this.reachWasOut = out;
  }

  // 打捞镜头看的地方：跟着白圈，但白圈在它周围 AIM_DEAD 米以内挪时不动（对准时画面是稳的，白圈挪多少就是多少，
  // 停手就停）；白圈挪出去了才被带着走，只走到白圈又落在边上为止。玩家正推着的时候只顺着推的方向走
  // （镜头往别的方向挪一下，白圈在画面上就走歪了）。y 是那儿的落点深浅（镜头往下沉多少、俯角）
  aimFrame() {
    const A = this.arm;
    const F = this.aimF || (this.aimF = new THREE.Vector3(A.aim.x, -8, A.aim.z));
    const ev = A.eval;
    const ry = ev && ev.restY > -100 ? ev.restY : -8;
    if (this.aimJumps !== A.jumps) {
      this.aimJumps = A.jumps;
      F.set(A.aim.x, ry, A.aim.z);
      this.aimInHold = !!(ev && ev.inHold);
      return F;
    }
    const at = A.aim;
    const dx = at.x - F.x, dz = at.z - F.z, d = Math.hypot(dx, dz);
    if (d > AIM_DEAD) {
      const P = this.aimPush;
      let moved = false;
      if (P && P.t === this.time) {
        const al = dx * P.ux + dz * P.uz;
        const px = dx - al * P.ux, pz = dz - al * P.uz;
        const q = AIM_DEAD * AIM_DEAD - (px * px + pz * pz);
        if (q > 0 && al > 0) {
          const s = al - Math.sqrt(q);
          F.x += P.ux * s;
          F.z += P.uz * s;
          moved = true;
        }
      }
      if (!moved) {
        const k = 1 - AIM_DEAD / d;
        F.x += dx * k;
        F.z += dz * k;
      }
      F.y = ry;
      this.aimInHold = !!(ev && ev.inHold);
    }
    return F;
  }

  // 跟船的镜头什么时候进来、让出去：打捞这一屏（停着、开着、下网）从头到尾都是它；揭宝、开冲、收工一开始就让出去
  // （回到那边的远近）。原来那一整趟（trip=1）按开船键才进来，下网让出去
  chaseInput(drive, inp, idle) {
    const C = this.chase, bc = this.boatCtl, moving = Math.abs(bc.speed) > 0.3, mom = this.moment.on;
    const can = !idle && !this.introRest && (this.mode === 'sail' || (this.mode === 'arm' && (mom || (!this.castQ && !this.netop.busy))) || (mom && this.mode === 'net'));
    if (!can) {
      // 跟船的远近只在跟船时：换到冲洗照那边的
      if (C.on) C.stop(this.cam, this.mode === 'arm' || this.mode === 'net' || this.mode === 'batch' || this.mode === 'reveal' ? (this.salvDist ?? 25) : C.keepDist);
      return;
    }
    if (!C.on && (mom || drive.throttle || drive.brake || drive.steer)) C.start(this.cam);
    if (!C.on) return;
    if (inp.zoom) C.wheel(inp.zoom);
    // 按了开船的键：停着时拖着看四周偏开的那一点收回来
    const go = drive.throttle || drive.brake || moving;
    if (go || drive.steer) C.drive(!!go, drive.steer);
    if (this.mode !== 'sail') return;
    // 原来那一整趟：停着时挪鼠标、推右摇杆转着看看，镜头先归玩家，再开船又跟上
    if (!go && !drive.steer && (Math.hypot(inp.lx, inp.ly) > 0.25 || Math.hypot(inp.px, inp.py) > 6)) C.stop(this.cam);
  }

  // 停着时按住右键拖：在跟船的镜头上偏开（左右绕、上下换俯角）看四周，松手就停在那儿
  dragLook(inp) {
    // 开着船、正转着船头时镜头只跟船（和载具求生一样，鼠标不管镜头）
    const C = this.chase;
    if (!inp.drag || !C.on || (this.mode !== 'arm' && this.mode !== 'net') || Math.abs(this.boatCtl.speed) > 0.3 || C.ret) return;
    if (this.mode === 'arm' && !this.castQ) { const d = driveOf(inp); if (d.throttle || d.brake || d.steer) return; }
    const q = this.cam.mouseTurn(inp.px, inp.py);
    C.drag(this.cam, q.yaw, q.pitch);
    this.dragged = (this.dragged || 0) + Math.abs(inp.px) + Math.abs(inp.py);
    if (this.dragged > 60) this.ui.learn('turn');
  }

  // 按了下网：先看这里下不下得去、油够不够；够了就记下，吊臂走到、船停稳再下
  tryCast(forced = false) {
    // 小样：没指着打捞点、白圈不在够得着的打捞点上，说一句为什么
    const why = this.moment.on ? this.moment.castBlock(forced) : null;
    if (why) {
      this.audio.play('denyBlocked');
      this.moment.deny(why);
      this.cue('A21');
      return;
    }
    const ev = this.arm.evaluate();
    if (!ev.ok) {
      // 下不了网：标签灰着打叉，按了才说原因；三种原因三种声音
      this.audio.play(ev.depth > MAX_WORK_DEPTH && !ev.blockTag && !ev.onBoat ? 'denyDeep' : 'denyBlocked');
      this.ui.tipDeny(ev.reason);
      this.cue('A21');
      return;
    }
    if (ev.cost > this.trip.fuel) {
      this.audio.play('denyFuel');
      this.ui.tipDeny(T('拒·油不够'));  // 表的 id，不是玩家看的
      this.cue('A21');
      return;
    }
    this.castQ = { t: 0, settle: 0, cost: ev.cost };
    // 点下去了：记着下的是哪一处（镜头照旧跟船，不转、不拉近）
    if (this.moment.on) { this.snap.cast = this.snap.cur; this.snap.heading = null; }
    // 船要自动刹停了：白圈就定在眼下想去的那一点，不再按「滑停在哪」往前算
    this.arm.freeze();
    this.audio.play('castLock');
    // 船还在走：自动刹停，挂倒挡、倒转的桨把船尾的水搅得哗哗响（进打捞模式时船不刹，没有这一声）
    const v = Math.abs(this.boatCtl.speed);
    if (v > 0.35) {
      this.audio.play('castBrake', { k: v / BOAT_MAX_SPEED, dur: v / (BOAT_ACCEL * 1.6) });
      this.cue('A25');
    }
    this.castStep(0);
  }

  // 等吊臂走到白圈正上方、船刹住停稳、网架不晃了，就下；中途把白圈挪到下不去的地方就作罢
  castStep(dt) {
    const Q = this.castQ;
    const bc = this.boatCtl;
    Q.t += dt;
    const ev = this.arm.evaluate();
    if (!ev.ok || ev.cost > this.trip.fuel || Q.t > 10) {
      this.castQ = null;
      if (!ev.ok) { this.audio.play('denyBlocked'); this.ui.tipDeny(ev.reason); this.cue('A21'); }
      else if (ev.cost > this.trip.fuel) { this.audio.play('denyFuel'); this.ui.tipDeny(T('拒·油不够')); this.cue('A21'); }  // 表的 id，不是玩家看的
      return;
    }
    const still = Math.abs(bc.speed) < 0.06 && Math.abs(bc.turnRate) < 0.03;
    if (still && this.arm.arrived) Q.settle += dt; else Q.settle = 0;
    if (Q.settle > 0 && (this.netop.swingSpeed < 0.15 || Q.settle > 0.4)) {
      this.castQ = null;
      bc.speed = 0;
      bc.turnRate = 0;
      this.arm.snapMech();
      this.setCraneTip(_v.set(this.arm.target.x, ARM_TIP_H, this.arm.target.y));
      this.netop.start(ev);
      this.mode = 'net';
      this.ui.setMode('net');
      this.ui.learn('arm');
    }
  }

  simulate(dt, inp, idle) {
    const g = this;
    this.time += dt;
    this.frameN = (this.frameN || 0) + 1;
    U.uTime.value += dt;
    const bc = this.boatCtl;
    let drive = NO_DRIVE;
    let tipShow = false;

    if (!idle && this.mode !== 'fading') {
      // 镜头：开船时鼠标、右摇杆转；打捞时跟着白圈自己走（滚轮、扳机照样拉近拉远）；冲洗近景时不动
      if (this.mode === 'sail' && this.chase.on) {
        // 跟着船走的时候鼠标、右摇杆不转镜头
      } else if (this.mode === 'sail') {
        const SG = this.sailGlide;
        if (SG && (Math.abs(inp.ly) > 0.05 || Math.abs(inp.py) > 0.5)) SG.pitch = null;
        if (SG && inp.zoom) SG.dist = null;
        this.cam.lookMouse(inp.px, inp.py);
        this.cam.look(inp.lx, inp.ly, inp.zoom, dt);
      } else if (!this.reveal.locked) {
        if (!this.chase.on) this.cam.zoom(inp.zoom, dt);
        if (this.moment.on) this.dragLook(inp);
      }
      // 镜头自己偏过去看沉船的那一眼：玩家一动鼠标、推右摇杆（或缩放）就还给玩家
      if (this.lookTo && (Math.hypot(inp.lx, inp.ly) > 0.25 || Math.hypot(inp.px, inp.py) > 6 || inp.zoom)) this.lookTo.release = true;
      switch (this.mode) {
        case 'sail': {
          drive = driveOf(inp);
          bc.brake = false;
          if (inp.click || inp.a) this.enterSalvage();
          else if (inp.b && !this.trip.ended) this.quitHold = 0;
          // 按住 B 收工（设计第 2 节「继续：下一网，或结束这一趟」）：开船时按下 B、按住一秒，中途松手不算。
          // 从打捞按 B 回到开船的那一下不算，要在开船时重新按下
          if (this.quitHold !== null) {
            if (!inp.bHeld || this.mode !== 'sail') this.quitHold = null;
            else if ((this.quitHold += dt) >= QUIT_HOLD_T) {
              this.quitHold = null;
              this.audio.play('menuGo');
              this.endTrip(null);
            }
          }
          break;
        }
        // 打捞模式：键盘（左摇杆）照样开船；鼠标（右摇杆）挪白圈，吊臂自己追过去
        case 'arm': {
          const busy = this.netop.busy;
          this.arm.track(dt);
          // 小样：白圈吸在打捞点上，挪鼠标、推右摇杆是换一处（全游戏的打捞以后都用这一份）
          if (this.moment.on) { if (!busy || this.input.device === 'kb') this.snap.input(inp, dt); }
          else if (!busy) this.moveAim(inp, dt);
          // 按了下网在等：船自己刹住，开船的键先不管
          bc.brake = !!this.castQ;
          if (!this.castQ) drive = driveOf(inp);
          tipShow = !this.moment.on || this.snap.lit;
          if (this.moment.on) {
            if (inp.click || inp.a) this.moment.press(inp);
            else if (this.castQ) this.castStep(dt);
            else this.moment.castNext();
            if (this.mode === 'arm') this.moment.update(dt, inp);
          } else if (inp.rclick || inp.b || inp.esc) {
            this.exitSalvage();
            // 浏览器里按 Esc 会先把鼠标锁放开：马上再要一次（浏览器不给就等玩家点一下画面）
            if (inp.esc) this.input.lock();
          }
          else if ((inp.click || inp.a) && busy) {
            this.audio.play('busy');
            this.ui.deny(T('拒·网没收回'));  // 表的 id，不是玩家看的
            this.cue('A22');
          } else if ((inp.click || inp.a) && !this.castQ) this.tryCast();
          else if (this.castQ) this.castStep(dt);
          break;
        }
        // 网在水里、船员在冲洗：船保持位置、吊臂锁着；这时按别的键、推摇杆、动鼠标，模式条抖一下说原因
        case 'net':
          bc.brake = true;
          if (this.reveal.locked) { this.mode = 'reveal'; this.ui.setMode('reveal'); }
          // 小样：网在水里按开冲，开冲键下面说一句为什么还不能冲
          else if (this.moment.on && inp.go) { this.audio.play('busy'); this.ui.deckDeny(T('拒·网没收回')); this.cue('A22'); }  // 表的 id，不是玩家看的
          // 小样：网在水里，鼠标照样指、左键点好下一处；只有想开船时说一句为什么不动
          else if (this.moment.on) {
            this.snap.mouse = this.input.device === 'kb' && inp.ptr.ok;
            if (this.snap.mouse) this.snap.hover(inp); else this.snap.refresh(false);
            if (inp.click || inp.a) this.moment.press(inp);
            else if (this.stickPushed(inp)) { this.audio.play('busy'); this.ui.deny(T('拒·网没收回')); this.cue('A22'); }  // 表的 id，不是玩家看的
          }
          else if (inp.a || inp.click || inp.b || inp.rclick || this.stickPushed(inp) || this.busyPoke(inp, dt)) { this.audio.play('busy'); this.ui.deny(T('拒·网没收回')); this.cue('A22'); }  // 表的 id，不是玩家看的
          break;
        case 'batch':
          bc.brake = true;
          break;
        case 'reveal':
          bc.brake = true;
          if (inp.b || inp.rclick || this.stickPushed(inp) || this.busyPoke(inp, dt)) { this.audio.play('busy'); this.ui.deny(T('拒·在冲洗')); this.cue('A22'); }  // 表的 id，不是玩家看的
          break;
      }
      this.stickWas = Math.hypot(inp.mx, inp.my) > 0.6;
    }
    if (this.igniteT > 0 || (this.mode !== 'sail' && this.mode !== 'arm')) drive = NO_DRIVE;
    // 船坞里按了出海：解缆往前开出一截（harbor.sail）
    if (this.castOff) drive = this.castOff;
    // 引擎出力没有：给油、或停住了接着踩（倒船）；往前滑着踩刹车不算
    this.stickMag = Math.max(drive.throttle, bc.speed < 0.2 ? drive.brake : 0);
    this.chaseInput(drive, inp, idle);
    if (this.reachBumpT > 0) this.reachBumpT -= dt;
    // 船：观察、调臂、作业时保持船位
    // 刚出发：引擎还没着火，船不走
    if (this.igniteT > 0) this.igniteT -= dt;
    // G04 开局后船第一次起步
    if (this.startT != null) {
      this.startT += dt;
      if (bc.speed > 0.4) { this.startT = null; this.cue('G04'); }
      else if (this.startT > 12) this.startT = null;
    }
    const burn = bc.update(dt, drive, this.trip.fuel, this.time);
    // 按了下网的那一下可能还按着方向键：这一网的油先留着（刹停的那几米本来就不扣）
    if (!idle) this.trip.burn(this.castQ ? Math.min(burn, Math.max(0, this.trip.fuel - this.castQ.cost)) : burn);
    this.boat.root.updateMatrixWorld(true);

    // 吊机：作业时由下网流程驱动（转回甲板那一段也是这台机器自己转）；其余时候吊臂照机械的样子自己往白圈上方（或收回原位）走
    if (!this.netop.busy || this.netop.phase === 'release') {
      const work = (this.mode === 'arm' || this.mode === 'reveal' || this.mode === 'net') && !idle;
      // 一甲板一起冲时吊臂转到船尾上方，网圈不挡着甲板
      const want = work ? _w.set(this.arm.target.x, ARM_TIP_H, this.arm.target.y) : this.batch.on ? BATCH_TIP : STOW_TIP;
      this.setCraneTip(this.arm.drive(dt, want, _v));
    } else if (this.netop.phase !== 'swing' && this.netop.phase !== 'set') this.arm.sync(this.craneTip);
    this.netop.update(dt, this.time);
    this.boat.root.updateMatrixWorld(true);
    this.netop.updateNetBody(dt);

    // 臂端评估和足迹
    let ev = null;
    if (this.mode === 'arm' && !this.netop.busy) ev = this.arm.evaluate();
    else if (this.mode === 'net' && this.netop.ev) ev = this.netop.ev;
    this.arm.footprint.update(dt, ev || this.arm.eval, this.world, tipShow && !!ev, 0.5 + 0.5 * Math.sin(this.time * 6), !!this.castQ, this.mode === 'arm' && !this.netop.busy ? this.netop.netPos : null);
    this.tipEval = ev;
    // 网口落点：调臂时一直在；挪到被挡的地方那一刻也算一次
    if (tipShow && ev) {
      const bad = !ev.ok;
      if (bad !== this.blockWas) this.pulse('A16', 0.6);
      else this.pulse('A16', 5);
      this.blockWas = bad;
    }
    this.forecast.update(dt, this.moment.on && !this.snap.lit ? null : ev, idle ? 'idle' : this.mode);
    // 够得着的范围：调臂时清楚；开船慢下来时淡淡地出现
    const armOn = this.mode === 'arm' && !this.netop.busy;
    const reachShow = idle ? 0 : armOn ? 1 : this.mode === 'sail' ? 0.8 * clamp(1 - Math.abs(bc.speed) / 1.8, 0, 1) : 0;
    this.arm.reachRing.update(dt, bc.localToWorld(new THREE.Vector3(BOAT.crane.x, 0, BOAT.crane.z), _v), this.world, reachShow, armOn && this.arm.pushOut > 0);

    // 生物和船员
    this.crabLife.update(dt, this.time);
    this.fish.update(dt, this.time);
    this.leviathan.update(dt, this.time);
    this.threat.update(dt, idle);
    this.crew.setMode(this.reveal.active || (this.batch.on && this.batch.phase === 'wash') ? 'wash' : this.mode === 'net' ? 'net' : 'sail');
    this.crew.update(dt);
    this.boat.fuel.update(dt, this.trip.fuel, this.threat.netsLeft, this.time);
    this.reveal.update(dt, this.time, !!inp.aHeld, !!inp.a);
    this.deck.update(dt, this.time);
    if (this.deck.on) this.snap.update(dt);
    this.batch.update(dt, !!inp.aHeld);
    this.fxUpdate(dt);
    this.glintUpdate(dt);
    // 离上一次甲板近景（冲洗、揭晓、拉回）、第一眼看见沉船（镜头偏过去、光扫过）过去多久：
    // 拉回之后的「留下」（收获飞进格子、船员搬货）和看沉船那几秒，不和世界里的新事抢
    this.quietT = this.reveal.active || this.batch.on || this.cam.alt.w > 0.05 || this.lookTo || this.beam ? 0 : (this.quietT || 0) + dt;
    this.pingUpdate(dt);
    this.rippleUpdate(dt);
    this.storyUpdate(dt);
    this.feel.update(dt, idle);
    // 「再来一趟」淡出那一下旧的这一趟还是已结束，别再弹一次收获单
    // 三小段里回港（按住 Q、油用完）也走这一段：收工、扎进舱口、开舱
    if (!idle && this.mode !== 'fading' && (!this.moment.on || this.trip.ended)) this.checkEnd(dt);

    // 镜头
    this.updateCamera(dt, idle);
    this.updateBeam(dt);
    this.audio.update(dt, { throttle: bc.throttle, slew: idle ? 0 : this.arm.motion });
  }

  // 金属在阳光下偶尔闪一下（真实的反光）：离得近、没埋太深的才看得到；网口罩着时更明显
  glintUpdate(dt) {
    this.glintT = (this.glintT || 0) - dt;
    if (this.glintT > 0) return;
    this.glintT = 0.2;
    const piv = this.cam.pivot;
    const tip = this.mode === 'arm' ? this.arm.tipWorld() : null;
    for (const it of this.items.items) {
      if (it.state !== 'seabed') continue;
      if (it.metal === undefined) it.metal = it.model.mats.some((m) => m.uniforms.uGlint);
      if (!it.metal) continue;
      let gv = 0;
      if (it.bury < 0.7 && it.y > -22 && Math.hypot(it.x - piv.x, it.z - piv.z) < 30) gv = 0.3;
      if (tip && Math.hypot(it.x - tip.x, it.z - tip.z) < NET_R) gv = 0.85;
      setItemGlint(it.model, gv);
      // 阳光扫过时金属边偶尔一闪；网口罩着时闪得勤一点：整块金属亮一下，边上一颗十字星
      if (gv > 0 && Math.random() < (gv > 0.5 ? 0.22 : 0.035)) {
        const h = (it.model.info && it.model.info.h) || 0.3;
        this.fx.emit('flick', it.x + (Math.random() - 0.5) * 0.3, it.y + h * (0.6 + Math.random() * 0.5) + 0.06, it.z + (Math.random() - 0.5) * 0.3, 0, 0, 0, { size: gv > 0.5 ? 1.5 : 1.0 });
        setItemGlint(it.model, gv > 0.5 ? 2.0 : 1.6);
        this.later(0.13, () => { if (it.state === 'seabed') setItemGlint(it.model, gv); });
        this.pulse('A07', 2.5);
      }
    }
  }

  // 沉船缝里冒一串气泡：一颗接一颗，大小不一，晃着往上
  // 沉船在某处朝上的那块板子有多高（从水面往下打一条线）
  wreckTop(x, z) {
    const W = this.world.wreck.meshes;
    this._ray = this._ray || new THREE.Raycaster();
    this._ray.set(new THREE.Vector3(x, 0, z), new THREE.Vector3(0, -1, 0));
    this._ray.far = 40;
    const hit = this._ray.intersectObjects([W.hull, W.deck, W.castle, W.rib, W.coaming].filter(Boolean), false)[0];
    return hit ? hit.point.y : null;
  }

  wreckBubbles(gap = 3) {
    const p = wreckToWorld(0.6 + (Math.random() - 0.5) * 3, -0.5);
    // 从船板的缝里冒出来（不是从船肚子里，免得前几秒被船壳挡住）
    const top = this.wreckTop(p.x, p.z);
    const y = top !== null ? top + 0.1 : seabedY(p.x, p.z) + 2.5;
    const n = 7 + Math.floor(Math.random() * 4);
    // 一串泡一路升到水面（约 1 米/秒），到顶一个个破成小白点
    const up = -y / 1.0;
    let at = 0;
    for (let i = 0; i < n; i++) {
      at += 0.07 + Math.random() * 0.07;
      const t0 = at;
      const big = i < 3 ? 1.35 : 1;
      this.later(t0, () => {
        this.fx.emit('wbub', p.x + (Math.random() - 0.5) * 0.2, y, p.z + (Math.random() - 0.5) * 0.2, 0, 0.7 + Math.random() * 0.3, 0, { size: (0.12 + Math.random() * 0.09) * big, life: up + 0.6 });
      });
      if (i % 2 === 0) {
        this.later(t0 + up, () => {
          this.fx.emit('foam', p.x + (Math.random() - 0.5) * 0.5, 0.05, p.z + (Math.random() - 0.5) * 0.5, 0, 0, 0, { size: 0.14 + Math.random() * 0.1, life: 1.3 });
          if (Math.random() < 0.5) this.fx.emit('spray', p.x, 0.05, p.z, (Math.random() - 0.5) * 0.4, 0.8, (Math.random() - 0.5) * 0.4);
        });
      }
    }
    if (Math.hypot(p.x - this.cam.pivot.x, p.z - this.cam.pivot.z) < 32) this.pulse('A10', gap);
  }

  fxUpdate(dt) {
    const bc = this.boatCtl;
    const fx = this.fx;
    // 尾浪
    this.wakeT -= dt;
    const sp = Math.abs(bc.speed);
    if (sp > 0.6 && this.wakeT <= 0) {
      this.wakeT = 0.16;
      const f = bc.forward;
      const side = new THREE.Vector3(-f.z, 0, f.x);
      for (const s of [-1, 1]) {
        this.wake.push({ x: bc.pos.x - f.x * 5.4 + side.x * s * 1.1, z: bc.pos.z - f.z * 5.4 + side.z * s * 1.1, age: 0, k: Math.min(1, sp / 5) });
      }
      // 船头劈开的浪
      for (const s of [-1, 1]) {
        if (Math.random() < sp / 7) fx.emit('spray', bc.pos.x + f.x * 5.6 + side.x * s * 0.8, 0.3, bc.pos.z + f.z * 5.6 + side.z * s * 0.8, side.x * s * 2 + f.x * sp * 0.5, 1.5 + Math.random() * 1.5, side.z * s * 2 + f.z * sp * 0.5);
      }
    }
    this.wake = this.wake.filter((w) => (w.age += dt) < 4.5);
    while (this.wake.length > 24) this.wake.shift();
    const U2 = this.world.water.material.uniforms;
    for (let i = 0; i < 24; i++) {
      const w = this.wake[i];
      if (w) U2.uWake.value[i].set(w.x, w.z, 0.9 + w.age * 1.25, w.k * (1 - w.age / 4.5));
      else U2.uWake.value[i].set(0, 0, 0, 0);
    }
    U2.uBoat.value.set(bc.pos.x, bc.pos.z, bc.heading, Math.min(1, sp / 6));
    // 烟囱冒烟
    if (Math.random() < dt * (3 + bc.throttle * 10)) {
      const p = this.boat.body.localToWorld(new THREE.Vector3(-4.55, 4.35, -0.75));
      fx.emit('smoke', p.x, p.y, p.z, 0, 0.8, 0, { size: 0.35 + bc.throttle * 0.3 });
    }
    // 海雪：慢慢往下飘的细屑，深处更显眼
    const piv = this.cam.pivot;
    for (let i = 0; i < 2; i++) {
      if (Math.random() < dt * 16) {
        const x = piv.x + (Math.random() - 0.5) * 50, z = piv.z + (Math.random() - 0.5) * 50;
        const fl = seabedY(x, z);
        const y = fl + Math.random() * Math.max(0.5, -fl - 0.5);
        fx.emit('snow', x, y, z, 0, -0.05, 0, { floorY: fl });
      }
    }
    // 沉船里偶尔冒出一串气泡
    if (Math.random() < dt * 0.35) this.wreckBubbles();
    // 刮开的船材顶上来
    if (this.timberRise && this.timberMesh) {
      const R = this.timberRise;
      R.t += dt;
      const k = Math.min(1, R.t / 0.5);
      this.timberMesh.position.y = R.y1 - 0.22 * Math.pow(1 - k, 3);
      if (k >= 1) this.timberRise = null;
    }
    // 草被压倒后慢慢恢复
    for (const p of this.pressList) {
      p.t += dt;
      p.v.w = 1 - smoothstep(2.5, 10, p.t);
    }
    this.pressList = this.pressList.filter((p) => p.t < 10);
    fx.update(dt);
  }

  updateCamera(dt, idle) {
    const cam = this.cam;
    // 视点上下跟得慢一点的时候：网在水里（视点跟着网往下沉、往上提）
    cam.pivotWy = this.mode === 'net' ? 3.2 : 0;
    // 偏过去看沉船的那一眼只在开船时：换了模式就收掉（镜头距离还回去）
    if (this.lookTo && this.mode !== 'sail') {
      if (this.lookTo.relT === undefined) cam.distT = this.lookTo.d0;
      this.lookTo = null;
    }
    // 刚从打捞模式回到开船：俯角、远近的目标慢慢滑回开船的样子（目标缓、镜头再跟目标，起步停下都缓）
    const SG = this.sailGlide;
    if (SG && this.mode !== 'sail') this.sailGlide = null;
    else if (SG) {
      if (SG.pitch !== null) cam.pitchT = damp(cam.pitchT, SG.pitch, 1.6, dt);
      if (SG.dist !== null) cam.distT = damp(cam.distT, SG.dist, 1.6, dt);
      if ((SG.pitch === null || Math.abs(cam.pitchT - SG.pitch) < 0.003) && (SG.dist === null || Math.abs(cam.distT - SG.dist) < 0.05)) this.sailGlide = null;
    }
    // 打捞镜头自己转的那一下还没转完就离开了打捞模式：就地慢慢刹住，不留到下一次
    if (this.viewTurn && this.mode !== 'arm') this.settleView(dt);
    const bc = this.boatCtl;
    const f = bc.forward;
    if (this.chase.on) {
      this.settleView(dt);
      this.chase.aim(cam, bc, dt, BOAT_MAX_SPEED);
      this.seeWreck(dt);
    } else if (this.mode === 'arm' || (this.mode === 'reveal' && this.cam.alt.w < 1) ) {
      // 原来那一整趟（trip=1）的打捞模式：镜头随着白圈自己移动、转向、对焦。视点在船和白圈之间、偏白圈那头（船、吊臂、白圈和它周围的海底都在画面里），
      // 跟着落点往下沉一点，但最多 6 米：白圈扫过深处时镜头不会一下子降低、贴到船上
      const ev = this.tipEval || this.arm.eval;
      const tip = this.arm.tipWorld();
      const ry = ev && ev.restY > -100 ? ev.restY : -8;
      // 视点跟的是「看的地方」（见 aimFrame）：白圈在落点附近细挪时镜头不动
      const F = this.aimFrame();
      const wx = lerp(bc.pos.x, F.x, 0.68), wy = Math.max(-6, F.y * 0.42), wz = lerp(bc.pos.z, F.z, 0.68);
      cam.pivotT.set(wx, wy, wz);
      if (this.mode === 'arm') {
        // 镜头平移着跟「看的地方」（视点弹簧跟过去，起步、停下都是缓的）；俯角越深越往下看，落进舱里时再陡一点，
        // 跟「看的地方」、慢慢调（细挪白圈时不变）
        const want = clamp(0.92 + Math.max(0, -F.y) * 0.006 + (this.aimInHold ? 0.1 : 0), 0.9, 1.12);
        cam.pitchT = damp(cam.pitchT, want, 1.2, dt);
        // 白圈压在自己船上（正从船身上挪过去）时不找角度：那儿本来就下不了网
        if (!(ev && ev.onBoat)) this.salvageView(dt, tip, ry);
        else this.settleView(dt);
      }
    } else if (this.mode === 'net') {
      const no = this.netop;
      // 网刚离开海底：镜头先在原地停一拍，看那块空出来的地方，再跟着网走
      const n = no.liftHold > 0 && no.scarAt ? no.scarAt : no.netPos;
      const ry = no.ev ? no.ev.restY : -8;
      // 跟着网往下看一点、慢慢地（镜头上下大起大落最晕）
      cam.pivotT.set(lerp(bc.pos.x, n.x, 0.7), clamp(Math.min(n.y, 0) * 0.35, ry * 0.32, 0), lerp(bc.pos.z, n.z, 0.7));
      this.preTurn(dt);
      // 往刮到的船材那儿偏一下
      const G = this.glance;
      if (G) {
        G.t += dt;
        const k = Math.sin(Math.min(1, G.t / G.dur) * Math.PI);
        cam.pivotT.x = lerp(cam.pivotT.x, G.x, 0.6 * k);
        cam.pivotT.z = lerp(cam.pivotT.z, G.z, 0.6 * k);
        cam.pivotT.y = lerp(cam.pivotT.y, G.y * 0.5, 0.4 * k);
        if (G.t >= G.dur) this.glance = null;
      }
    } else if (this.mode === 'ending' && this.ending) {
      // 收工：先在船上停一拍（看船员擦手、吊臂收回去），再往舱口扎下去
      const P = this.endPose(this.ending.t);
      cam.pivotT.copy(P.pivot);
      cam.pitchT = P.pitch;
      cam.distT = P.dist;
      cam.yawT = P.yaw;
    } else {
      const lead = 3 + Math.max(0, bc.speed) * 0.9;
      cam.pivotT.set(bc.pos.x + f.x * lead, 0, bc.pos.z + f.z * lead);
      this.seeWreck(dt);
    }
    // 开场镜头没飞完就开始了：从沉船上方升起、越过浅滩落到船后（和开场同一条路，快一倍半多），飞完以后才归玩家（机器人）转
    const R = this.introRest;
    if (R) {
      R.t += dt * 1.7;
      const u = smoothstep(1.2, 5.8, R.t);
      cam.pivotT.set(lerp(WRECK.x, cam.pivotT.x, u), lerp(-5, cam.pivotT.y, u), lerp(WRECK.z, cam.pivotT.z, u));
      cam.distT = lerp(13, 27, u) + 29 * Math.sin(Math.PI * u);
      cam.pitchT = u < 0.5 ? lerp(1.3, 1.02, smoothstep(0, 0.5, u)) : lerp(1.02, 0.68, smoothstep(0.5, 1, u));
      // 转身摊在整段路上（开场原样是后六成里转完）：快放时也不一边俯看一边打转
      cam.yawT = R.yaw0 + wrapAngle(-Math.PI / 2 - R.yaw0) * smoothstep(0.1, 1, u);
      if (u >= 1 || this.mode !== 'sail') this.introRest = null;
    }
    // 效果页：镜头钉在一处看（蟹、鱼群这种小东西）；游戏里不设
    if (this.camAt) cam.pivotT.set(this.camAt.x, this.camAt.y || 0, this.camAt.z);
    else if (this.chase.on && !this.introRest) this.chase.commit(cam);
    this.chase.relax(cam, dt);
    if (idle && this.mode === 'title') {
      const I = this.titleIntro;
      if (I && !I.done) {
        // 从沉船上方升起来、越过浅滩飞回船上：中途升得最高，落定时转到标题机位
        const u = smoothstep(1.2, 5.8, I.t);
        cam.pivotT.set(lerp(WRECK.x, bc.pos.x + 1, u), lerp(-5, 1, u), lerp(WRECK.z, bc.pos.z, u));
        cam.distT = lerp(13, 27, u) + 29 * Math.sin(Math.PI * u);
        cam.pitchT = u < 0.5 ? lerp(1.3, 1.02, smoothstep(0, 0.5, u)) : lerp(1.02, 0.68, smoothstep(0.5, 1, u));
        let dy = I.yaw1 - I.yaw0;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        cam.yawT = I.yaw0 + dy * smoothstep(0.4, 1, u);
        // 一开始水是浑的，沉船只是底下一片暗影；升起来水才清
        const pc = this.pipe.compositeUniforms;
        pc.uMurk.value = Math.max(pc.uMurk.value, 0.62 * (1 - smoothstep(0.3, 2.6, I.t)));
      } else cam.pivotT.set(bc.pos.x + 1, 1, bc.pos.z);
    }
    cam.update(this.camDt ?? dt);
    this.peek.update(this.camDt ?? dt);
    this.cutout.update(dt);
    this.motionUpdate(dt);
  }

  // 第一眼看见沉船：视点慢慢挪到船和沉船之间、往水里看，镜头退开一点把两样都框进来；几秒后回来（推右摇杆马上回来）
  seeWreck(dt) {
    const cam = this.cam, L = this.lookTo;
    if (!L) return;
    L.t += dt;
    if (L.release && L.relT === undefined) L.relT = L.t;
    const kin = smoothstep(0, 1.8, L.t);
    const kout = L.relT !== undefined ? 1 - smoothstep(L.relT, L.relT + 0.7, L.t) : 1 - smoothstep(L.dur - 1.8, L.dur, L.t);
    const k = kin * kout;
    cam.pivotT.x = lerp(cam.pivotT.x, L.x, 0.5 * k);
    cam.pivotT.z = lerp(cam.pivotT.z, L.z, 0.5 * k);
    cam.pivotT.y = L.y * 0.55 * k;
    if (L.relT === undefined) cam.distT = L.d0 + 6 * k;
    if (L.t >= L.dur || (L.relT !== undefined && L.t > L.relT + 0.7)) this.lookTo = null;
  }

  // 冲洗近景是从船的哪一侧看（reveal.planPhi，船上的方向）换成镜头的 yaw
  closeYaw(phi) {
    const root = this.boat.root;
    const a = root.localToWorld(_w.set(BOAT.wash.x, 0, BOAT.wash.z));
    const b = root.localToWorld(_v.set(BOAT.wash.x + Math.cos(phi), 0, BOAT.wash.z + Math.sin(phi)));
    return Math.atan2(b.x - a.x, b.z - a.z);
  }

  // 网出了水、往甲板上转回来的这一路：镜头先慢慢绕到冲洗近景那一侧（每秒最多二十来度，起步、收住都缓），
  // 到推近时就只剩往前推，不再一边推一边猛转
  preTurn(dt) {
    const no = this.netop, phi = this.reveal.planPhi;
    if (phi == null || !no.surfaced || (no.phase !== 'lift' && no.phase !== 'swing')) { this.preT = null; return; }
    const P = this.preT || (this.preT = { v: 0 });
    const rem = wrapAngle(this.closeYaw(phi) - this.cam.yawT);
    const vmax = Math.min(PRE_TURN_V, Math.sqrt(2 * PRE_TURN_A * Math.abs(rem)));
    P.v = Math.min(vmax, P.v + PRE_TURN_A * dt);
    this.cam.yawT += Math.sign(rem) * Math.min(Math.abs(rem), P.v * dt);
  }

  // 打捞镜头：白圈真被挡住时才慢慢转过去。从镜头到白圈（中心和四边）的视线被自己的船身、沉船或坡挡住——
  // 中心挡住了、或者四边挡住了三处以上——而且白圈没在快快地扫过去、挡了 0.4 秒以上，才往左右找最近一个挡不住的朝向，
  // 定下来以后慢慢转过去（起步、停下都缓，每秒最多 0.42 弧度），转到了就停；没挡住、只挡了一点就不转，镜头只平移着跟白圈。
  // 一圈都挡着（白圈贴着船身、落在深坑里）就慢慢往正上方多抬一点
  salvageView(dt, tip, ry) {
    const cam = this.cam;
    const r = NET_R * 0.7;
    const pts = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]];
    const blockedAt = (yaw, pitch) => {
      const cp = Math.cos(pitch), sp = Math.sin(pitch), d = cam.distT;
      const ex = cam.pivotT.x + Math.sin(yaw) * cp * d, ey = cam.pivotT.y + sp * d, ez = cam.pivotT.z + Math.cos(yaw) * cp * d;
      let n = 0;
      for (let k = 0; k < pts.length; k++) {
        const [ox, oz] = pts[k];
        const x = tip.x + ox, z = tip.z + oz;
        const y = (k ? Math.max(ry, this.world.surfaceAt(x, z).y) : ry) + 0.12;
        if (this.boatBlocks(ex, ey, ez, x, y, z) || this.groundBlocks(x, y, z, ex, ey, ez) || wreckBlocksSeg(this, ex, ey, ez, _w.set(x, y, z))) {
          if (!k) return 9; // 中心挡住了不行
          n++;
        }
      }
      return n;
    };
    const V = this.viewTurn || (this.viewTurn = { blockT: 0, to: null, v: 0, side: 0, spd: 0, tx: tip.x, tz: tip.z });
    const P = cam.pitchT;
    // 白圈挪得多快（米/秒，平滑过）
    if (dt > 0) {
      V.spd = damp(V.spd, Math.hypot(tip.x - V.tx, tip.z - V.tz) / dt, 6, dt);
      V.tx = tip.x; V.tz = tip.z;
    }
    // 正在转：转到定好的朝向为止（中途不往回转，免得左右来回）；白圈半路又看得见了（挪开了），就慢慢刹住、停在这儿
    if (V.to !== null) {
      if (!V.braking) {
        V.clearT = blockedAt(cam.yawT, P) <= 1 ? (V.clearT || 0) + dt : 0;
        if (V.clearT > 0.25) this.viewTurnBrake(V);
      }
      this.viewTurnStep(V, dt);
      return;
    }
    const b = blockedAt(cam.yawT, P);
    if (b <= 2) { V.blockT = 0; V.lift = false; return; }
    // 白圈正快快地扫过去：先不算，等它慢下来、还停在被挡的地方才算「真被挡住」（不然按半路的位置定了朝向，
    // 转到了白圈已经挪走、又被挡住，只好再往回转）
    if (V.spd > TIP_SETTLE) return;
    V.blockT += dt;
    if (V.blockT < 0.4) return;
    let best = null;
    for (let k = 1; k <= 12 && best === null; k++) {
      for (const sgn of V.side ? [V.side, -V.side] : [1, -1]) {
        if (blockedAt(cam.yawT + sgn * k * 0.16, P) <= 1) { best = sgn * k * 0.16; break; }
      }
    }
    if (best === null) { cam.pitchT = Math.min(1.3, cam.pitchT + dt * 0.25); return; }
    V.side = Math.sign(best);
    V.to = cam.yawT + best;
    V.v = 0;
  }

  // 镜头自己转的那一下往前走一帧：起步、停下都缓（每秒最多 0.42 弧度），转到了就停
  viewTurnStep(V, dt) {
    const cam = this.cam;
    const rem = wrapAngle(V.to - cam.yawT);
    const vmax = Math.min(0.42, Math.sqrt(2 * 0.9 * Math.abs(rem)));
    V.v = Math.min(vmax, V.v + 0.9 * dt);
    cam.yawT += Math.sign(rem) * Math.min(Math.abs(rem), V.v * dt);
    if (Math.abs(rem) < 0.01) { V.to = null; V.v = 0; V.blockT = 0; V.braking = false; V.clearT = 0; }
  }

  // 不转到原定的朝向了：按现在的速度就地慢慢刹住
  viewTurnBrake(V) {
    V.braking = true;
    V.to = this.cam.yawT + Math.sign(wrapAngle(V.to - this.cam.yawT)) * (V.v * V.v) / (2 * 0.9);
  }

  // 离开打捞模式、白圈压到自己船上时还在转：就地慢慢刹住，刹完就忘了这一下（下次从头看挡没挡）
  settleView(dt) {
    const V = this.viewTurn;
    if (!V) return;
    if (V.to !== null) {
      if (!V.braking) this.viewTurnBrake(V);
      this.viewTurnStep(V, dt);
      if (V.to !== null) return;
    }
    this.viewTurn = null;
  }

  // 从水下这一点往镜头看过去，中途有没有穿到海底或沉船（最上面那层面）底下：离这一点 0.7 米以外才算
  groundBlocks(x, y, z, ex, ey, ez) {
    const dx = ex - x, dy = ey - y, dz = ez - z;
    const h = Math.hypot(dx, dz) || 1;
    // 只查水下那一段（水面以上没有东西挡）
    const tEnd = dy > 0 ? Math.min(1, -y / dy) : 1;
    const t0 = 0.7 / h;
    if (t0 >= tEnd) return false;
    for (let i = 0; i < 14; i++) {
      const t = t0 + (tEnd - t0) * (i / 13);
      const sx = x + dx * t, sy = y + dy * t, sz = z + dz * t;
      if (sy < this.world.surfaceAt(sx, sz).y - 0.05) return true;
    }
    return false;
  }

  // 这条线段（世界里）从自己的船身（船壳到驾驶室顶，算上水下的船底）里穿过去吗
  boatBlocks(ax, ay, az, bx, by, bz) {
    const bc = this.boatCtl;
    const c = Math.cos(bc.heading), s = Math.sin(bc.heading);
    const L = (x, z) => [(x - bc.pos.x) * c - (z - bc.pos.z) * s, (x - bc.pos.x) * s + (z - bc.pos.z) * c];
    const [x0, z0] = L(ax, az), [x1, z1] = L(bx, bz);
    let t0 = 0, t1 = 1;
    for (const [p, q, lo, hi] of [[x0, x1, -6.2, 6.2], [ay, by, -1.0, 3.3], [z0, z1, -2.25, 2.25]]) {
      const d = q - p;
      if (Math.abs(d) < 1e-6) { if (p < lo || p > hi) return false; continue; }
      let u0 = (lo - p) / d, u1 = (hi - p) / d;
      if (u0 > u1) [u0, u1] = [u1, u0];
      t0 = Math.max(t0, u0); t1 = Math.min(t1, u1);
      if (t0 > t1) return false;
    }
    return true;
  }

  // 镜头离水面近（平常开船的高度以下）、又在画面上走得快的时候：画面四角和中间对着的那几点海底，
  // 这一帧比上一帧在低分辨率画面上挪了几格（换算成每 1/60 秒）。贴近水面时海底在画面上走得最快、焦散纹又粗又亮，
  // 一帧跳几格时细线和海雪的细点在格子之间一帧一变，最闪：不到一格不管，两格多以上整个换成平均亮度（像动态模糊）。
  // 平常开船的高度上焦散照样清清楚楚。切镜头（一帧跳很远）不算。快起来当帧就跟上，慢下来四分之一秒回去
  motionUpdate(dt) {
    if (!(dt > 0)) return;
    const c = this.cam.cam;
    c.updateMatrixWorld();
    const M = this.camMotion || (this.camMotion = { vp: new THREE.Matrix4(), k: 0, ok: false });
    const piv = this.cam.pivot;
    const fy = clamp(seabedY(piv.x, piv.z), -30, -1);
    let most = 0;
    if (M.ok) {
      for (const [sx, sy] of MOTION_PTS) {
        _v.set(sx, sy, 0.5).unproject(c).sub(c.position);
        if (_v.y > -1e-4) continue;
        _w.copy(c.position).addScaledVector(_v, (fy - c.position.y) / _v.y);
        const q = _v.copy(_w).applyMatrix4(M.vp);
        _w.project(c);
        most = Math.max(most, Math.hypot(((_w.x - q.x) * LOW_W) / 2, ((_w.y - q.y) * LOW_H) / 2));
      }
    }
    M.vp.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse);
    M.ok = true;
    const px = most > 40 ? 0 : most / dt / 60;
    const near = 1 - smoothstep(18.5, 20, c.position.y);
    const want = smoothstep(0.8, 2.2, px) * near;
    M.k = want > M.k ? want : M.k + (want - M.k) * Math.min(1, dt * 4);
    U.uMotion.value = M.k;
  }

  // —— 地点、下一处线索的方向、蟹翻出来的东西、大轮廓 ——
  // 不再用字幕讲：到了新地方名字飞进来一下；方向用船边的箭头；看得见的东西靠画面自己说
  storyUpdate(dt) {
    if (this.mode === 'title' || this.mode === 'settings') return;
    const F = this.flags;
    const bp = this.boatCtl.pos;
    const ui = this.ui;
    const dShoal = Math.hypot(bp.x - SHOAL.x, bp.z - SHOAL.z);
    const dWreck = Math.hypot(bp.x - WRECK.x, bp.z - WRECK.z);
    if (!F.shoal && dShoal < 24) {
      F.shoal = true;
      this.arrive(T('地名·通透浅滩'), 784);
    }
    // 第一眼看见沉船：42 米内、它进了画面（再近到 30 米就不等了）
    if (!F.wreck && (dWreck < 30 || (dWreck < 42 && this.inView(WRECK.x, -5, WRECK.z, 0.08)))) {
      F.wreck = true;
      this.sightWreck();
    }
    // 蟹翻过的泥里露出硬边：在那儿亮一圈（看得见的时候）
    if (F.crabExposed && !F.crabSaid) {
      const sp = wreckToWorld(SEAL_SPOT.along, SEAL_SPOT.side);
      const sy = seabedY(sp.x, sp.z);
      const s = this.project(new THREE.Vector3(sp.x, sy, sp.z));
      // 甲板近景（冲洗、揭晓）时不亮：那时看的是甲板，亮环会隔着甲板画出来、和揭晓抢；拉回大视野、收获落进格子以后再亮
      if (this.quietT > 2.4 && s.z < 1 && s.x > 100 && s.x < 1820 && s.y > 80 && s.y < 1000 && Math.hypot(this.cam.pivot.x - sp.x, this.cam.pivot.z - sp.z) < 30) {
        F.crabSaid = true;
        this.ping(sp.x, sy, sp.z);
      }
    }
    // C12 在沉船下过两网、回去开船：箭头第一次指向坡下的那一刻，远处深槽里冒上来一大串泡
    if (!F.slopeSaid && this.mode === 'sail' && this.leadTarget() === SLOPE_LEAD) {
      F.slopeSaid = true;
      this.trenchBurp();
    }
    const trenchNear = this.nearTrench(bp);
    if (!F.slope && trenchNear) {
      F.slope = true;
      this.arrive(T('地名·深槽'), 392);
    }
    // 线索一段段往东南：经过一块船板，箭头就指向下一块
    while (F.trailIdx < TRAIL.length && Math.hypot(bp.x - TRAIL[F.trailIdx].x, bp.z - TRAIL[F.trailIdx].z) < 12) F.trailIdx++;
    // 大轮廓：看懂普通生物以后才出现。离深槽近了，或者在沉船这儿下过几网
    const lev = this.leviathan;
    if (!lev.active && !lev.done && this.trip.time > 55) {
      if (trenchNear || (F.wreck && this.trip.nets >= 3)) this.threat.armed = true;
    }
  }

  // C01 到了一处新地方：左上海图比例尺一节节画出、地名滑进来，远远一声钟（浅滩亮、深槽低）
  arrive(name, bell) {
    this.ui.place(name);
    this.audio.play('bell', { f: bell, gain: 1 });
    this.cue('C01');
  }

  // C03 第一眼看见沉船：地名大一号，低音弦乐一个短动机、远处木头吱嘎；镜头缓缓偏过去看它一眼（推右摇杆就还给玩家）；
  // 一道光从船尾扫到船头，光扫过那一截，鱼从船肋里炸开、往上冒
  sightWreck() {
    this.trip.sawWreck = true;
    this.ui.place(T('地名·沉船'), { big: true });
    this.audio.play('wreckMotif');
    // 浪和发动机让开，弦乐出来
    this.audio.duck(0.45, 0.5, 2.6, 2.2);
    this.cue('C03');
    this.cue('F03');
    this.lookTo = { x: WRECK.x, y: -6, z: WRECK.z, t: 0, dur: 6.5, d0: this.cam.distT };
    this.beam = { t: -0.5, dur: 3.2 };
    this.later(1.9, () => {
      const S = this.fish.schools[2];
      if (S) this.fish.burst(S.home.x, S.home.y - 0.5, S.home.z);
    });
  }

  updateBeam(dt) {
    const B = this.beam;
    if (!B) return;
    B.t += dt;
    const u = clamp(B.t / B.dur, 0, 1);
    const k = B.t > 0 ? Math.sin(u * Math.PI) : 0;
    const v = this.pipe.compositeUniforms.uBeam.value;
    v.set(WRECK.x, WRECK.z, -15 + 30 * (u * u * (3 - 2 * u)), Math.pow(k, 0.7));
    this.pipe.compositeUniforms.uBeamDir.value.set(-0.32, -0.95);
    if (B.t >= B.dur) { this.beam = null; v.w = 0; }
  }

  // 远处深槽里冒上来一大团气：近水面那段一串大泡往上翻，到了水面一下翻白、一圈圈波纹，闷闷一声「咕嘟」
  trenchBurp() {
    const p = { x: SLOPE_LEAD.x + 3, z: SLOPE_LEAD.z + 8 };
    for (let i = 0; i < 46; i++) {
      this.later(i * 0.05 + Math.random() * 0.05, () => {
        this.fx.emit('wbub', p.x + (Math.random() - 0.5) * 1.6, -7 + Math.random() * 2.5, p.z + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.3, 2.2 + Math.random() * 1.4, (Math.random() - 0.5) * 0.3, { size: 0.16 + Math.random() * 0.16, life: 3.2 });
      });
    }
    for (let k = 0; k < 4; k++) {
      this.later(1.9 + k * 0.42, () => {
        this.ripple(p.x + (Math.random() - 0.5), p.z + (Math.random() - 0.5), 0.5, 1 - k * 0.18);
        for (let i = 0; i < 10; i++) this.fx.emit('foam', p.x + (Math.random() - 0.5) * 2.4, 0.06, p.z + (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2, { size: 0.3 + Math.random() * 0.3, life: 2.4 });
        for (let i = 0; i < 4; i++) this.fx.emit('spray', p.x + (Math.random() - 0.5), 0.1, p.z + (Math.random() - 0.5), (Math.random() - 0.5) * 1.4, 1.4 + Math.random() * 1.2, (Math.random() - 0.5) * 1.4);
      });
    }
    const sp = this.project(new THREE.Vector3(p.x, 0, p.z));
    this.audio.play('glugFar', { pan: clamp((sp.x / VIEW_W) * 2 - 1, -0.8, 0.8) });
    this.cue('C12');
  }

  // 世界里这一点在不在画面里（四边各留 m 的边）
  inView(x, y, z, m = 0.1) {
    const p = this.project(new THREE.Vector3(x, y, z));
    return p.z < 1 && p.x > VIEW_W * m && p.x < VIEW_W * (1 - m) && p.y > VIEW_H * m && p.y < VIEW_H * (1 - m);
  }

  nearTrench(bp) {
    return bp.z > 14 && bp.x > -16 && bp.x < 40;
  }

  // 下一处线索在哪：起步指向浅滩的标杆；浅滩下过一网（或者开离浅滩）以后，顺着散落的船板往东南；
  // 认出沉船就先不指；在沉船这儿下过两网以后，顺着船尾和滚落的货指向坡下，到了深槽不再指。只给方向，不给落点。
  leadTarget() {
    const F = this.flags;
    if (F.wreck) return !F.slope && F.wreckNets >= 2 ? SLOPE_LEAD : null;
    if (!F.shoal) return SHOAL_MARK;
    const bp = this.boatCtl.pos;
    if (this.trip.nets < 1 && Math.hypot(bp.x - SHOAL.x, bp.z - SHOAL.z) < 30) return null;
    if (F.trailIdx < TRAIL.length) return TRAIL[F.trailIdx];
    return WRECK;
  }

  // 箭头指着的这一处之后还有下一处吗（顺着船板一块接一块；最后一块之后是沉船）：快到这一处时箭头先转过去
  leadNext(L) {
    const i = TRAIL.indexOf(L);
    if (i < 0) return null;
    return i + 1 < TRAIL.length ? TRAIL[i + 1] : WRECK;
  }

  // 这里叫什么（暂停页的标题）
  placeName() {
    return SEA.place(this.boatCtl.pos, this);
  }

  // 暂停页右边：这一屏上每个图标代表什么，这里能按的键。随地方和模式变。
  // 一个图标一句话；同一块东西上的、同一类的并成一行（油和还够几网、白圈红圈、金圈灰圈橙圈），不写屏幕上已经写着的（模式牌）
  pauseInfo() {
    const K = KEYS[this.ui.device];
    const m = this.prevMode;
    const rows = [];
    const row = (...cells) => rows.push(cells.map(([ic, t, color]) => ({ ic, t, color })));
    // 图例的字从文案表来（T 的参数是表的 id，不是玩家看的）
    row([ICON.fuel, T('图例·燃油')], [ICON.net, T('图例·还够几网'), '#cfe3df']);
    row([ICON.depth, T('图例·水深'), '#7fd8d0']);
    if (m === 'sail' && this.leadTarget()) row([ICON.arrow, T('图例·线索'), '#ffd36a']);
    if (m === 'arm') row([ICON.ring, T('图例·能下网'), '#e8f4f0'], [ICON.ring, T('图例·被挡住'), '#ff5c47']);
    if (m === 'sail' || m === 'arm') row([ICON.reach, T('图例·网罩得到'), '#e8f4f0']);
    if (m === 'arm') {
      const marks = [[ICON.yes, T('图例·带得上来'), '#ffd36a'], [ICON.miss, T('图例·带不上来'), '#e2ecea']];
      if (this.forecast.marks.some((k) => k.k === 'hard')) marks.push([ICON.hard, T('图例·硬东西'), '#ff9a4a']);
      row(...marks);
      row([ICON.crate, T('图例·几件')], [ICON.fuel, T('图例·这一网的油')]);
    }
    if (m === 'net' || m === 'reveal') row(['<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.2" fill="#09161a" stroke="#c99a48" stroke-width="2"/><circle cx="12" cy="12" r="6.4" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3.6"/><path d="M12 5.6a6.4 6.4 0 0 1 6.4 6.4" fill="none" stroke="currentColor" stroke-width="3.6"/></svg>', T('图例·收网圈'), '#e8f4f0']);
    if (this.trip.haul.length) row([ICON.crate + ICON.coin, T('图例·船上'), '#ffd36a']);
    const keys = [];
    const pad = this.ui.device === 'pad';
    // 键盘上还能按的另一个键（空格也能进打捞、下网；Esc 也能退出打捞）
    const alt = (k, a, cls) => key(k, cls) + (!pad && a ? key(a, cls) : '');
    if (m === 'sail') keys.push([key(K.move), '开船'], [key(K.look), '转镜头'], [alt(K.a, K.aAlt, 'a'), '进打捞'], [key(K.zoom), '拉近拉远'], [key(K.quit, 'b'), '按住收工']);
    if (this.moment.on) {
      rows.push([{ ic: ICON.bundle, t: T('暂停·甲板'), color: '#b8936a' }]);
      if (m === 'arm') keys.push(...this.moment.pauseKeys(K, alt));
    } else if (m === 'arm') keys.push([key(K.aim), '挪白圈'], [alt(K.a, K.aAlt, 'a'), '下网'], [alt(K.b, K.bAlt, 'b'), '退出打捞'], [key(K.move), '照样开船'], [key(K.zoom), '拉近拉远']);
    if (m === 'net') keys.push([key(K.zoom), T('暂停·键·拉近')]);
    if (m === 'net' && this.moment.on && !pad) keys.push([key(T('键名·左Shift')), T('键·看海底')]);  // 表的 id，不是玩家看的
    if (m === 'reveal' || m === 'batch') keys.push([alt(K.wash, K.aAlt, 'a'), T('暂停·键·冲洗加快')]);
    return { place: this.moment.on ? T('地名·沉船') : this.placeName(), rows, keys };
  }

  // 玩家这一趟看见过哪些值得捞的东西（和界面上的标记、机器人用同一份「看得见」）。看见过一次就记住。
  // 一次只看一件、轮着看（还没看见过的每件一秒左右看一次）：「看得见」要对着沉船打几条射线
  // （第 17 次起沉船用包围盒树，一件零点几毫秒；以前一件五六毫秒，一帧里看十几件会卡一下）
  trackSeen(dt) {
    if ((this.seenT -= dt) > 0) return;
    this.seenT = 0.07;
    const list = this.items.items;
    for (let k = 0; k < list.length; k++) {
      if (++this.seenIdx >= list.length) { this.seenIdx = 0; this.seenRound++; }
      const it = list[this.seenIdx];
      if (it.state !== 'seabed' || it.def.value < 12 || this.seenIds.has(it.id)) continue;
      if (seeItem(this, it)) this.seenIds.add(it.id);
      return;
    }
  }

  // 已经捞过几个网位：那一处至少有一件上了网
  spotsFished() {
    let n = 0;
    for (const ids of Object.values(NET_SPOTS)) if (this.items.items.some((i) => ids.includes(i.id) && i.state !== 'seabed')) n++;
    return n;
  }

  // 网位都捞过（设计第 2 节收尾：6—8 个网位都捞过，或油不够再下一网）：出收获单。
  // 只等玩家看见过的：没看见过的（还埋着的、没往那边看过的）不拦着收工；
  // 捞过 6 处以上才替玩家收工，刚捞完浅滩、还没找到沉船时不会提前收
  checkEnd(dt) {
    if (['sail', 'arm', 'net', 'reveal'].includes(this.mode)) this.trackSeen(dt);
    if (!this.trip.ended && !this.netop.busy && !this.reveal.active) {
      if (this.trip.fuel < MIN_NET_COST) this.endTrip('油不够下一网了');
      else {
        const left = this.items.onSeabed().filter((i) => i.def.value >= 12 && this.seenIds.has(i.id));
        // 收之前把还没看见过的再轮着看完一遍：刚出现在画面上的也算看见了（多等零点几秒）
        if (left.length || this.spotsFished() < SPOTS_TO_END) this.endAt = null;
        else if (this.endAt == null) this.endAt = this.seenRound + 2;
        else if (this.seenRound >= this.endAt) this.endTrip('看得见的都捞上来了');
      }
    }
    // 开完舱已经翻开债本、进了船坞（三小段）：这一趟收完了
    if (this.trip.ended && this.mode !== 'summary' && this.mode !== 'debt' && this.mode !== 'dock' && !this.netop.busy && !this.reveal.active) {
      if (!this.ending) this.startEnding();
      const E = this.ending;
      E.t += dt;
      // 两个往下落的音：这一趟到头了；界面淡下去，海浪、风、引擎慢慢退到后面
      if (!E.cad && E.t > 0.3) { E.cad = true; this.audio.play('endCadence'); }
      if (!E.fade && E.t > 0.35) { E.fade = true; this.ui.fadeHud(true); }
      if (!E.hush && E.t > 0.6) { E.hush = true; this.audio.hush(0.42, 1.4); }
      // 往舱口扎下去：木头一声闷响、风声一收
      if (!E.dive && E.t > END_DIVE) { E.dive = true; this.audio.play('hatchDive'); }
      if (!E.black && E.t > END_DUR - 0.6) { E.black = true; this.ui.fade(true); }
      if (E.t >= E.dur) {
        this.mode = 'summary';
        this.ui.setHud(false);
        this.ui.fadeHud(false);
        this.audio.hush(0.3, 0.8);
        this.tally.begin(this.trip, { why: this.trip.endReason, deeds: this.tripDeeds() });
        if (!this.firsts.summary) { this.firsts.summary = true; this.cue('F10'); }
      }
    }
  }

  render(dt) {
    const cam = this.cam;
    this.sky = this.world.sky;
    this.world.sky.position.copy(cam.cam.position);
    followWater(this.world.water, cam.cam.position.x, cam.cam.position.z);
    this.fx.setScale(projScaleFor(cam.cam.fov));
    this.fx.eye = cam.cam.position;
    this.pipe.setCamera(cam.cam, cam.focusDist);
    // 船上的口子在哪：不画的帧也算（「看得见」的判断用它，跳不跳画面一个样）
    const holes = this.cutout.holes(this.pipe);
    // 效果页快进到效果开始前：只算不画
    if (!this.noDraw) {
      // 海底能捞的东西、在外面活动的蟹：合成时描一圈轮廓
      for (const it of this.items.items) setItemMark(it.model, it.state === 'seabed');
      for (const c of this.crabLife.list) c.mark(c.catchable);
      const focus = cam.lookAtPt.clone();
      this.pipe.updateShadow(focus, cam.focusDist);
      this.pipe.renderShadow(this.scene);
      this.pipe.render(this.scene, holes ? { holes, parts: [...this.cutout.parts()], bare: (on) => this.cutout.bare(on) } : null);
    }
    if (dt > 0 && this.mode !== 'title') this.hudUpdate(dt);
    if (this.keyShow) this.keyShow.update(dt);
    else this.ui.update(dt, this.hudState());
  }

  hudState() {
    const ev = this.tipEval;
    const s = {
      fuel: this.trip.fuel,
      cost: this.mode === 'arm' && ev && !this.netop.busy && (!this.moment.on || this.snap.lit) ? ev.cost : null,
      spots: null,
      haulCount: this.trip.haul.length,
      haulTotal: this.trip.total,
      tip: null,
      sonarDepth: null,
      lead: null,
      prog: null,
      marks: null,
      netsLeft: 0,
      // 收工：按住 B 走了多少；这一趟已经结束（自己收的、游戏替你收的）时牌子停在「收工」
      quit: this.trip.ended ? 1 : this.quitHold !== null ? clamp(this.quitHold / QUIT_HOLD_T, 0, 1) : 0,
      // 场景的像素格这一帧在屏幕上偏了多少（低分辨率像素的零头，见 pipeline.setCamera）：圈、进度圈跟着这套格子走
      grid: this.pipe.offset,
    };
    const m = this.mode === 'pause' ? this.prevMode : this.mode;
    // 一甲板一起冲：还有泥包在冲（按住左键冲得快，模式条旁边给这个键）
    s.batchWash = m === 'batch' && this.batch.on && this.batch.phase === 'wash' ? { fast: !!this.input.state.aHeld } : null;
    // 油还够下几网：按上一网真正用掉的油算，只有真花了油才少（船开到深水上不跳）
    s.netsLeft = this.threat.netsLeft;
    // 调臂对准的这一网下完就不够再下一网了：油量条上要扣的那一截是红的
    s.costLast = s.cost != null && this.trip.fuel - s.cost < MIN_NET_COST;
    // 拉回大视野的头一秒：只有镜头在动，臂端的标签和预告圈等镜头落定再出
    const pulling = this.reveal.cur && this.reveal.cur.phase === 'pull' && this.reveal.cur.t < 1.0;
    if (this.moment.on && (m === 'arm' || m === 'net')) this.moment.spotHud(s, m);
    if (m === 'arm' && ev && !this.netop.busy && !pulling && (!this.moment.on || this.snap.lit)) {
      // 底下没有能落网的面时 restY 是个极小的数：标签就贴着臂端正下方的表面
      const ry = ev.restY > -100 ? ev.restY : this.world.surfaceAt(ev.tip.x, ev.tip.z).y;
      const p = this.project(new THREE.Vector3(ev.tip.x, ry, ev.tip.z));
      // 标签放在网口圈外面，不盖住这一网要兜的东西
      const px = this.project(new THREE.Vector3(ev.tip.x + NET_R, ry, ev.tip.z));
      const pz = this.project(new THREE.Vector3(ev.tip.x, ry, ev.tip.z + NET_R));
      const r = Math.max(Math.hypot(px.x - p.x, px.y - p.y), Math.hypot(pz.x - p.x, pz.y - p.y));
      s.tip = { show: true, x: p.x, y: p.y, r, cost: ev.cost, bad: !ev.ok, poor: ev.ok && ev.cost > this.trip.fuel, n: this.forecast.yes, wait: !!this.castQ };
      // 这一处这会儿压在自己船底下：预告的圈看不见、数不出来，照打捞点记着的件数
      if (this.moment.on && this.snap.cur && this.snap.cur.under) s.tip.n = Math.max(s.tip.n, this.snap.cur.n);
      // 小样：这一处按哪个键、按了是什么，写在这一处的小牌上（按了下网、等吊臂到的那一会儿收起）
      if (this.moment.on) s.tip.act = s.tip.bad || s.tip.poor || this.castQ ? null : 'cast';
      s.tip.reason = ev.ok ? (s.tip.poor ? T('拒·油不够') : null) : ev.reason;  // 表的 id，不是玩家看的
      // 小牌子不压自己的船（白圈穿过船身也画出来，牌子挪到旁边不压船的地方）
      s.tip.boat = this.boatOnScreen();
      // 小牌不压别处打捞点的箭头
      if (this.moment.on) s.tip.arrows = this.moment.arrows(s);
      // 预告的圈：套在看得见的东西上。蟹的金圈画在网落到底时它会在的地方，从蟹身上牵一道虚线过去；
      // 打叉的灰圈套在蟹身上（这一只兜不到）
      const cam = this.cam.cam;
      const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      s.marks = [];
      for (const mk of this.forecast.marks) {
        const w = mk.at ? _w.copy(mk.at) : mk.crab ? _w.copy(mk.crab.pos).setY(mk.crab.pos.y + 0.1) : _w.copy(mk.p);
        const q = this.project(w);
        if (q.z > 1) continue;
        const px = VIEW_H / (2 * cam.position.distanceTo(w) * tanH);
        const d = clamp(mk.r * 2 * px + 18, 30, 130);
        // 打叉的小牌贴在圈上背着网口中心的那一侧：压边的东西往外探，那边不会有金圈
        const ang = Math.hypot(q.x - p.x, q.y - p.y) > 4 ? Math.atan2(q.y - p.y, q.x - p.x) : -Math.PI / 4;
        const m = { key: mk.crab ? 'crab' + mk.crab.id : mk.id || mk.k, k: mk.k, x: q.x, y: q.y, d, ang };
        if (mk.at) {
          const c = this.project(_w.copy(mk.crab.pos).setY(mk.crab.pos.y + 0.1));
          const len = Math.hypot(c.x - q.x, c.y - q.y);
          if (len > d * 0.5 + 6) m.trail = { len, ang: Math.atan2(c.y - q.y, c.x - q.x) };
        }
        s.marks.push(m);
      }
    }
    // 方向箭头：放在船旁边、朝下一处线索的那一侧水面上。
    // 方向和位置都平滑地跟（以前离目标近了，船一动方向就大幅摆、摆放的位置在几处之间跳，一直在抖）：
    // - 方向按世界里的朝向慢慢转过去；快到这一块船板时就先慢慢转向下一块（到了正好指着下一块，不再在跟前来回摆）；
    // - 摆放的位置（离船多远、往哪边让开船身）用弹簧跟过去，跟着船走、不跳；
    // - 到了这一串线索的终点附近（标杆、沉船、坡下），箭头缩小、淡掉收起来
    // 拉回大视野后方向箭头最后才出（拉回完 1.5 秒），不和拉回、收获飞进格子抢
    const L = m === 'sail' && !(this.leadHold > 0) ? this.leadTarget() : null;
    const LS = this.leadS || (this.leadS = { a: null, k: 0, off: null, v: { x: 0, y: 0 } });
    const ldt = clamp(this.clock - (LS.clock ?? this.clock), 0, 0.1);
    LS.clock = this.clock;
    const bp = this.boatCtl.pos;
    let kWant = 0;
    if (L) {
      const N = this.leadNext(L);
      const dL = Math.hypot(L.x - bp.x, L.z - bp.z);
      let ax = (L.x - bp.x) / (dL || 1), az = (L.z - bp.z) / (dL || 1);
      if (N) {
        const dN = Math.hypot(N.x - bp.x, N.z - bp.z) || 1;
        const w = smoothstep(12, 19, dL);
        ax = ax * w + ((N.x - bp.x) / dN) * (1 - w);
        az = az * w + ((N.z - bp.z) / dN) * (1 - w);
      }
      const aw = Math.atan2(az, ax);
      kWant = N ? 1 : smoothstep(9, 14, dL);
      if (LS.a == null || LS.k < 0.02) LS.a = aw;
      else {
        // 转得快一点但不跳：照剩下的角度按比例转，每秒最多 2.6 弧度
        const da = wrapAngle(aw - LS.a);
        LS.a = wrapAngle(LS.a + clamp(da * (1 - Math.exp(-7 * ldt)), -2.6 * ldt, 2.6 * ldt));
      }
    }
    LS.k = kWant > LS.k ? Math.min(kWant, LS.k + ldt * 3) : Math.max(kWant, LS.k - ldt * 3);
    if (LS.k > 0.01 && LS.a != null) {
      const R = 13 * (0.82 + 0.18 * LS.k);
      const a = this.project(_v.set(bp.x, 0.3, bp.z));
      const b = this.project(_w.set(bp.x + Math.cos(LS.a) * R, 0.3, bp.z + Math.sin(LS.a) * R));
      if (a.z < 1 && b.z < 1) {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        // 镜头在船尾往前看时，那一点正落在吊臂和挂着的网上：挪到船外头（先顺着箭头往外，不行再往两边）
        const at = this.leadSpot(b.x, b.y, ang);
        // 相对船在画面上的那一点记位置，用临界阻尼的弹簧跟：换到另一处让开船身时滑过去，镜头转、船走时箭头跟着船不拖
        const ox = at.x - a.x, oy = at.y - a.y;
        if (!LS.off) { LS.off = { x: ox, y: oy }; LS.v.x = LS.v.y = 0; }
        else {
          const W = 9;
          const n = Math.max(1, Math.ceil(ldt / (1 / 120)));
          for (let i = 0; i < n; i++) {
            const h = ldt / n;
            LS.v.x += (W * W * (ox - LS.off.x) - 2 * W * LS.v.x) * h;
            LS.v.y += (W * W * (oy - LS.off.y) - 2 * W * LS.v.y) * h;
            LS.off.x += LS.v.x * h;
            LS.off.y += LS.v.y * h;
          }
        }
        s.lead = { x: a.x + LS.off.x, y: a.y + LS.off.y, ang, k: LS.k };
      } else LS.off = null;
    } else { LS.off = null; LS.a = LS.k > 0.01 ? LS.a : null; }
    if (!s.lead) this.leadTU = null;
    // 进度圈：网在走的时候跟着网，冲洗时在网包上方
    const no = this.netop;
    let netRing = false;
    if (no.busy && no.phase !== 'release' && no.ev) {
      // 放在网的旁边，不压网口的水花和泥环（入水时水花半径一百多像素）
      const p = this.project(no.netPos);
      const pr = this.project(_w.copy(no.netPos).add(this.cam.cam.getWorldDirection(_v).cross(THREE.Object3D.DEFAULT_UP).normalize().multiplyScalar(NET_R)));
      const r = Math.hypot(pr.x - p.x, pr.y - p.y);
      const off = Math.max(130, r * 2.1 + 70);
      if (p.z < 1) {
        const at = this.progSpot(p, off, no.netPos);
        s.prog = { x: at.x, y: at.y, p: no.progress() };
        netRing = true;
      }
    } else if (this.reveal.cur && (this.reveal.cur.phase === 'land' || this.reveal.cur.phase === 'wash')) {
      const c = this.reveal.cur;
      const w = this.reveal.washSpotWorld(new THREE.Vector3());
      w.y += c.bundle.R * 1.6 + 0.55;
      const p = this.project(w);
      if (p.z < 1) s.prog = { x: clamp(p.x, 60, VIEW_W - 60), y: clamp(p.y, 140, VIEW_H - 170), p: c.w, fast: !!c.fast };
    }
    if (!netRing) this.progAng = null;
    return s;
  }

  // 自己的船在画面上占的地方：船壳和驾驶室（几何体上一圈最外面的点，投到画面上再包起来）、吊臂（一根粗线）、挂着的网（一个圆）
  boatOnScreen() {
    if (!this.boatPts) {
      // 往四面八方各取最远的那个顶点：投影以后包起来，就是船身在画面上的外轮廓
      const dirs = [];
      for (let i = 0; i < 60; i++) {
        const y = 1 - (2 * (i + 0.5)) / 60, r = Math.sqrt(1 - y * y), t = i * 2.39996;
        dirs.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
      }
      const best = dirs.map(() => ({ d: -1e9, p: null }));
      for (const m of [this.boat.hull, this.boat.deck]) {
        m.updateMatrix();
        const a = m.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) {
          _v.fromBufferAttribute(a, i).applyMatrix4(m.matrix);
          dirs.forEach((d, k) => { const dd = _v.dot(d); if (dd > best[k].d) { best[k].d = dd; best[k].p = _v.clone(); } });
        }
      }
      this.boatPts = best.map((b) => b.p).filter(Boolean);
    }
    const body = this.boat.body;
    const poly = hull2(this.boatPts.map((p) => this.project(_w.copy(p).applyMatrix4(body.matrixWorld))));
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.cam.cam.fov / 2));
    const px = (w, m) => (m * VIEW_H) / (2 * this.cam.cam.position.distanceTo(w) * tanH);
    const C = this.boat.crane;
    const c0 = C.turret.getWorldPosition(new THREE.Vector3()), c1 = C.head.getWorldPosition(new THREE.Vector3());
    const crane = { a: this.project(c0), b: this.project(c1), r: px(c1, 0.45) };
    const n = this.boat.net.root.getWorldPosition(new THREE.Vector3());
    const net = { ...this.project(n), r: px(n, NET_R + 0.2) };
    return { poly, crane, net };
  }

  // 方向箭头摆在哪：那一点压着自己的船时挪开，挪得越少越好——先顺着箭头往外，外头没地方（顶到屏幕边、常驻的牌子）就往两边
  leadSpot(x0, y0, ang) {
    const R = 40, M = 18;
    const B = this.boatOnScreen();
    const cs = Math.cos(ang), sn = Math.sin(ang);
    const at = (t, u) => {
      const [x, y] = keepOut(clamp(x0 + cs * t - sn * u, 60, VIEW_W - 60) - 60, clamp(y0 + sn * t + cs * u, 140, VIEW_H - 170) - 60, 120, 120);
      return { x: x + 60, y: y + 60 };
    };
    const clear = (p) => {
      if (B.poly.length > 2 && polyDist(B.poly, p) < R + M) return false;
      if (segDist(B.crane.a, B.crane.b, p) < R + M + B.crane.r) return false;
      if (B.net.z < 1 && Math.hypot(B.net.x - p.x, B.net.y - p.y) < R + M + B.net.r) return false;
      return true;
    };
    if (!LEAD_TRIES) {
      LEAD_TRIES = [];
      for (let t = 0; t <= 600; t += 12) for (let u = -264; u <= 264; u += 16) LEAD_TRIES.push([t, u, t + Math.abs(u) * 1.4]);
      LEAD_TRIES.sort((a, b) => a[2] - b[2]);
    }
    // 上一帧挪到的那一边还行、也没比最好的多挪多少，就待着不动：镜头一转箭头不左右来回跳
    let best = null;
    for (const tu of LEAD_TRIES) {
      if (clear(at(tu[0], tu[1]))) { best = tu; break; }
    }
    const was = this.leadTU;
    if (best && was && was !== best && was[2] <= best[2] + 48 && clear(at(was[0], was[1]))) best = was;
    this.leadTU = best;
    return best ? at(best[0], best[1]) : at(0, 0);
  }

  // 网在走时进度圈放在网的哪一边：默认右边（靠右边缘时左边）。网口附近的蟹（受惊举螯、往外逃的那几秒正是要看的）
  // 被它压着时，绕到网的另一边去（也不绕到入水那圈水花上）——转过去，不是跳过去；换过去以后就待在那边，不来回晃
  progSpot(p, off, netPos) {
    const R = 46, M = 12;
    const raw = (a) => ({ x: p.x + Math.cos(a) * off, y: p.y - 10 + Math.sin(a) * off });
    const spot = (a) => {
      const q = raw(a);
      const [x, y] = keepOut(clamp(q.x, 60, VIEW_W - 60) - R, clamp(q.y, 140, VIEW_H - 170) - R, R * 2, R * 2);
      return { x: x + R, y: y + R };
    };
    // 网口附近看得见的蟹在画面上占的圆（腿伸开、螯举起来算在里面）
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.cam.cam.fov / 2));
    const keep = [];
    for (const c of this.crabLife.list) {
      if (c.mode !== 'sea' || c.hidden || Math.hypot(c.pos.x - netPos.x, c.pos.z - netPos.z) > 14) continue;
      const w = _w.set(c.pos.x, c.pos.y + 0.12 * c.scale, c.pos.z);
      const q = this.project(w);
      if (q.z > 1) continue;
      keep.push({ x: q.x, y: q.y, r: ((c.r * 2.4 + 0.12) * VIEW_H) / (2 * this.cam.cam.position.distanceTo(w) * tanH), crab: true });
    }
    // 让开蟹的时候也别挪到别的要看的东西上：网沉下去以后入水那一圈水花还在水面上（画面上在网的上方），还有自己的船和吊臂
    const B = keep.length ? this.boatOnScreen() : null;
    if (keep.length && netPos.y < 0) {
      const q = this.project(_w.set(netPos.x, 0, netPos.z));
      if (q.z < 1) keep.push({ x: q.x, y: q.y, r: off - R - M - 16 });
    }
    // 这一边还空出多少（负数就是压着了）；出了屏幕边的那一边（会被推回来贴到网上）不行。
    // 要不要挪只看蟹（crabOnly），挪到哪一边才连水花和船一起算
    const room = (a, crabOnly) => {
      const q = raw(a);
      if (q.x > VIEW_W - 80 || q.x < 80 || (Math.abs(Math.sin(a)) > 0.1 && (q.y < 140 || q.y > VIEW_H - 170))) return -1e9;
      const c0 = spot(a);
      let m = 1e9;
      for (const c of keep) if (c.crab || !crabOnly) m = Math.min(m, Math.hypot(c.x - c0.x, c.y - c0.y) - (R + c.r + M));
      if (B && !crabOnly) {
        if (B.poly.length > 2) m = Math.min(m, polyDist(B.poly, c0) - (R + M));
        m = Math.min(m, segDist(B.crane.a, B.crane.b, c0) - (R + M + B.crane.r));
      }
      return m;
    };
    const SIDES = [0, Math.PI, -0.7, Math.PI + 0.7, -Math.PI / 2, 0.7, Math.PI - 0.7];
    const dt = Math.max(0, this.clock - (this.progClock ?? this.clock));
    this.progClock = this.clock;
    const fresh = this.progAng == null;
    if (fresh) this.progAng = this.progAngT = room(0, true) < 0 && room(Math.PI, true) >= 0 ? Math.PI : 0;
    if (room(this.progAngT, true) < 0) {
      // 换到离蟹最远的那一边（蟹会接着走，镜头也跟着网往下沉：刚好让开的那一边过一会儿又压上）；同样远时转得少的优先
      const turn = (a) => Math.abs(Math.atan2(Math.sin(a - this.progAng), Math.cos(a - this.progAng)));
      const best = SIDES.map((a) => ({ a, v: Math.min(room(a), 160) - turn(a) * 12 })).sort((x, y) => y.v - x.v)[0];
      if (room(best.a) > room(this.progAngT)) this.progAngT = best.a;
    }
    if (fresh) this.progAng = this.progAngT;
    const d = Math.atan2(Math.sin(this.progAngT - this.progAng), Math.cos(this.progAngT - this.progAng));
    this.progAng += d * (1 - Math.exp(-dt * 9));
    return spot(this.progAng);
  }

  hudUpdate(dt) {
    const s = this.hudState();
    // 测深：调臂时测臂端下面，其余时候测船底下
    const p = this.mode === 'arm' || this.mode === 'net' ? this.arm.tipWorld() : this.boatCtl.pos;
    const surf = this.world.surfaceAt(p.x, p.z);
    const depth = -surf.y;
    s.sonarDepth = depth;
    const targets = [];
    // 声呐是一个锥：越深照得越宽（鱼被船惊开几米也还在里面）
    const cone = 3 + depth * 0.7;
    for (const S of this.fish.schools) {
      if (Math.hypot(S.home.x - p.x, S.home.z - p.z) < S.r + cone) {
        for (let i = 0; i < S.fish.length; i += 2) {
          const f = S.fish[i];
          if (Math.hypot(f.p.x - p.x, f.p.z - p.z) < cone) targets.push({ d: -f.p.y, s: 0.45 });
        }
      }
    }
    const lev = this.leviathan;
    let far = null;
    if (lev.active) {
      let best = 1e9, by = 0;
      for (const sg of lev.segs) {
        const d = Math.hypot(sg.m.position.x - p.x, sg.m.position.z - p.z);
        if (d < 6) targets.push({ d: -sg.m.position.y, s: sg.r * 0.9, big: true });
        if (d < best) { best = d; by = -sg.m.position.y; }
      }
      // 55 米内：测深图边上一道黄的长回波；40 米内：红的
      if (best < 55) far = { dist: best, depth: by };
    }
    this.ui.sonar.push({ depth, hard: surf.tag !== TAG.NONE ? 1 : 0, targets, lev: far }, dt);
    const dm = this.mode === 'pause' ? this.prevMode : this.mode;
    this.ui.deckBar(this.deckCells(dm), this.moment.canGo, dm === 'batch');
    this.ui.update(dt, s);
  }

  // 甲板那一排格子这一刻每格是什么（界面照着画）：码包时一个位子一格；开冲时照冲的先后一包一格，冲开的换成冲出来的那件
  deckCells(dm) {
    const D = this.deck;
    if (!D.on) return null;
    if (dm === 'arm' || dm === 'net') {
      const cells = [];
      for (let i = 0; i < D.slots.length; i++) cells.push({ s: i < D.filled ? 'mud' : i < D.used ? 'coming' : 'empty' });
      return cells;
    }
    const B = this.batch;
    if (dm !== 'batch' || !B.on) return null;
    const R = this.reveal.cur;
    const finaleOut = B.phase === 'end' || (B.phase === 'finale' && R && (R.phase === 'show' || R.phase === 'pull'));
    return B.list.concat(B.finale ? [B.finale] : []).map((e) => {
      const star = e === B.finale;
      if (!(star ? finaleOut : e.state === 'done')) return { s: 'mud', star };
      if (e.empty) return { s: 'dud', star };
      let best = null;
      for (const it of e.b.items) if (!best || (it.def.value || 0) > (best.def.value || 0)) best = it;
      return { s: 'done', kind: best ? best.kind : 'crab', star };
    });
  }
}
