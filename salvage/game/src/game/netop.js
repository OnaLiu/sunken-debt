import * as THREE from 'three';
import { NET_R, NET_R0, NET_DROP_AIR, NET_SINK, NET_LIFT, NET_CLOSE_T, NET_SET_T, ARM_TIP_H } from '../config.js';
import { BOAT, solveCrane, poseCrane, halfB, railY } from '../world/boat.js';
import { Bundle } from './bundle.js';
import { easeInOut, easeOut, clamp, lerp, wrapAngle } from '../util/math.js';
import { seabedY } from '../world/terrain.js';
import { PRESS } from '../render/materials.js';
import { netVerdict, crabInNet } from './forecast.js';

const HANG = 1.35; // 挂着时钩到网环的距离
const DROP_H = 0.55; // 网包悬在甲板上方多高松闸
const LIFT_UP = 0.9; // 转回甲板的路上绞车比挂着时多收的那一截（网包吊高、过得了船舷、到了好往下砸）
const SWING_Y = 0.0; // 网环出水多高吊臂就开始往回转（绞车接着收）
const HOME_EXT = { v: 5.2, a: 8.5 }; // 收网回转时吊臂伸缩最快多快（和 arm.js 的 HOME.ext 一致）：估网包多久被带到船边
const HOME_LIFT_V = 2.2; // 收网回转时臂头升降最快多快（arm.js 的 HOME.lift）
const NET_DEPTH = 0.95, NET_DEPTH_EMPTY = 0.4; // 网兜垂多深（boat.js 的网）；松闸倒空后收拢到多深
const SET_EARLY = 0.9; // 臂头离甲板正上方还差这么远（米）、刹车的最后一段，就开始往甲板放网
const SWING_FREE_R = 7.7; // 臂伸到这么长，绕吊机转一圈网包也碰不到船身（网包还低时只在这么长的时候先转）
// 网架挂在臂头下面：一根钢缆吊着的短摆，阻尼很大（像有防摇的吊机）。臂头往哪边加速，网架就往反方向让一点，
// 刹车时往前送一点；钢缆和网架一起斜过去，吊链始终对着臂头。吊臂一停一下就稳住，不来回晃、不被甩出去。
// w 摆的快慢，z 阻尼（1 = 刚好不回摆），g 臂头加速度有几成传到网架上
const SWING_AIR = { w: 3.4, z: 0.9, g: 0.35 };
const SWING_WATER = { w: 4.0, z: 2.2, g: 0.08 };
const SWING_MAX = 0.6;
const _sw = new THREE.Vector3();
const _v = new THREE.Vector3();
const _tip = new THREE.Vector3();
const _u = new THREE.Vector3();
const _a = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

// 一次下网：按 A 之后一气呵成。位置锁定，船不动，自动回收。
export class NetOp {
  constructor(game) {
    this.g = game;
    this.phase = 'idle';
    this.t = 0;
    this.home = BOAT.stowTip;
    this.slot = null;
    this.cable = HANG;
    this.netPos = new THREE.Vector3();
    this.bundle = null;
    this.pressIdx = 0;
    this.lastEntry = 0;
    this.dripT = 0;
  }

  get busy() {
    return this.phase !== 'idle';
  }

  start(ev) {
    const g = this.g;
    this.ev = ev;
    // 网口升大以后下到沉船舱里：网口收到起步那么大从舱口下去（arm.evaluate 也是照这么大算的），收回来再张开
    if (ev.inHold && NET_R > NET_R0) g.boat.net.resize(NET_R0);
    this.phase = 'air';
    this.t = 0;
    // 吊臂已经停在白圈正上方：网就从这儿直上直下
    this.tipLocal = g.arm.target.clone();
    // 网包放回哪儿：一网一揭放到洗台上方（收起时的臂端）；甲板码包时放到这一包的空位上方
    this.slot = g.deck && g.deck.on ? g.deck.reserve(g.arm.tipWorld(new THREE.Vector3())) : null;
    this.home = this.slot ? g.deck.tipFor(this.slot) : BOAT.stowTip;
    this.hitHard = false;
    this.capturedCrab = null;
    this.elapsed = 0;
    this.prog = 0;
    this.sway = 1; // 松闸那一下网架晃一晃
    this.liftHold = 0;
    // 油表上预告的那一截「咔」地扣掉（先记下扣之前在哪）
    const f0 = g.trip.fuel;
    g.trip.spendFuel(ev.cost);
    g.threat.spent(ev.cost);
    g.trip.nets++;
    g.ui.fuelSnap(f0, ev.cost);
    g.audio.play('netDrop');
    g.cue('B01');
    g.events.emit('netStart', ev);
  }

  // 臂端（船局部）
  craneTo(local3) {
    this.g.setCraneTip(local3);
  }

  hookWorld(out = new THREE.Vector3()) {
    this.g.boat.crane.head.getWorldPosition(out);
    return out;
  }

  update(dt, t) {
    const g = this.g;
    const net = g.boat.net;
    const ev = this.ev;
    this.t += dt;
    const ringY = () => this.netPos.y;
    if (this.phase !== 'idle') this.elapsed += dt;
    switch (this.phase) {
      case 'idle':
        return;
      case 'air': {
        this.craneTo(new THREE.Vector3(this.tipLocal.x, ARM_TIP_H, this.tipLocal.y));
        this.cable += NET_DROP_AIR * dt;
        if (ringY() <= 0.05) {
          this.phase = 'sink';
          this.t = 0;
          const p = this.netPos;
          g.fx.burst('splash', p.x, 0.1, p.z, 34, 4.2, NET_R, { up: 1.1 });
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            g.fx.emit('foam', p.x + Math.cos(a) * NET_R, 0.05, p.z + Math.sin(a) * NET_R, Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2);
          }
          g.audio.play('splash', { gain: 0.9 });
          g.ripple(p.x, p.z, NET_R, 1);
          g.later(0.35, () => g.ripple(p.x, p.z, NET_R * 0.8, 0.6));
          g.cue('B02');
          g.events.emit('netEnter', { x: p.x, z: p.z });
        }
        break;
      }
      case 'sink': {
        const remain = ringY() - ev.restY;
        const sp = NET_SINK * clamp(remain / 2.2 + 0.25, 0.25, 1);
        this.cable += sp * dt;
        if (!this.sinkCued) { this.sinkCued = true; g.cue('B03'); g.audio.play('sink'); }
        // 网架带着一串气泡往下走：网口一圈冒，钢缆边上也冒
        for (let k = 0; k < 2; k++) {
          if (Math.random() < 0.75) {
            const a = Math.random() * Math.PI * 2;
            g.fx.emit('bubble', this.netPos.x + Math.cos(a) * NET_R * 0.9, ringY() + 0.2, this.netPos.z + Math.sin(a) * NET_R * 0.9, 0, 0.7 + Math.random() * 0.5, 0, { size: 0.09 + Math.random() * 0.06 });
          }
        }
        if (Math.random() < 0.35) g.fx.emit('bubble', this.netPos.x + (Math.random() - 0.5) * 0.3, ringY() + 1.2 + Math.random() * Math.min(6, -ringY()), this.netPos.z + (Math.random() - 0.5) * 0.3, 0, 0.9, 0, { size: 0.07 });
        g.events.emit('netMoving', { x: this.netPos.x, y: ringY(), z: this.netPos.z });
        if (ringY() <= ev.restY + 0.02) {
          this.cable -= (ev.restY - ringY());
          this.phase = 'touch';
          this.t = 0;
          this.onTouch();
        }
        break;
      }
      case 'touch':
        if (this.t > 0.32) { this.phase = 'close'; this.t = 0; g.audio.play('creak'); g.cue('B05'); }
        break;
      case 'close': {
        const lim = this.hitHard ? 0.55 : 1;
        const k = clamp(this.t / NET_CLOSE_T, 0, 1);
        net.state.close = easeInOut(k) * lim;
        // 网裙收拢时把里面的泥水挤出来：一股从网口中间往上冒
        if (k > 0.55 && !this.squeezed && !this.hitHard) {
          this.squeezed = true;
          for (let i = 0; i < 9; i++) g.fx.emit('cloud', this.netPos.x + (Math.random() - 0.5) * 0.8, ev.restY + 0.6, this.netPos.z + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.5, 0.7 + Math.random() * 0.5, (Math.random() - 0.5) * 0.5, { size: 0.8, life: 3.2 });
        }
        if (!this.hitHard && k > 0.35 && !this.checkedHard) {
          this.checkedHard = true;
          if (g.items.hitsHiddenTimber(this.netPos.x, this.netPos.z, NET_R - 0.1) && !ev.inHold) {
            this.hitHard = true;
            this.jolt = 1;
            g.audio.play('clank');
            g.cam.shake(0.08 * g.wobbleK);
            g.events.emit('hitHard', { x: this.netPos.x, z: this.netPos.z, y: ev.restY });
          }
        }
        if (k >= 1 || (this.hitHard && this.t > NET_CLOSE_T * 0.6)) {
          this.capture();
          this.phase = 'lift';
          this.t = 0;
          // 兜得越多越慢、越重越慢：按眼下的速度算出要拉多久，绞车声就响多久
          const n = this.bundle.items.length + (this.bundle.crab ? 1 : 0);
          this.liftK = (1 - 0.07 * Math.min(4, n)) * (this.bundle.heavy ? 0.78 : 1);
          const dist = this.cable - HANG;
          const T = (Math.max(0, dist - 1.5) / NET_LIFT + Math.min(dist, 1.5) / (NET_LIFT * 0.6)) / this.liftK + 0.5;
          g.audio.play('lift', { dur: T, heavy: this.bundle.heavy });
          // 网离开海底那一下：原地留下网痕和空位，镜头先在这儿停一拍
          this.liftHold = 0.75;
          this.scarAt = { x: this.netPos.x, y: ev.restY, z: this.netPos.z };
          for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * NET_R;
            g.fx.emit('silt', this.netPos.x + Math.cos(a) * r, ev.restY + 0.15 + Math.random() * 0.5, this.netPos.z + Math.sin(a) * r, Math.cos(a) * 0.2, -0.05, Math.sin(a) * 0.2, { life: 5, size: 0.7 });
          }
          g.cue('B06');
          g.cue('B07');
        }
        break;
      }
      case 'lift': {
        const wasUnder = ringY() < 0;
        this.liftHold = Math.max(0, this.liftHold - dt);
        // 起步那一下吃劲：先慢后快
        const ramp = clamp(this.t / 0.5, 0.25, 1);
        this.cable = Math.max(HANG, this.cable - NET_LIFT * this.liftK * ramp * dt * (ringY() > -1.5 ? 0.6 : 1));
        // 网包底下拖着一缕泥
        if (ringY() < -0.5 && Math.random() < 0.8) g.fx.emit('cloud', this.netPos.x + (Math.random() - 0.5) * 0.9, ringY() - 0.9 - Math.random() * 0.4, this.netPos.z + (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.2, -0.35, (Math.random() - 0.5) * 0.2, { size: 0.55, life: 3.0, color: [0.5, 0.42, 0.3] });
        this.crabSound(dt);
        if (wasUnder && ringY() >= -0.6 && !this.surfaced) {
          this.surfaced = true;
          this.pourT = 0.9;
          g.fx.burst('splash', this.netPos.x, 0.1, this.netPos.z, 30, 3.4, 1.2, { up: 0.9 });
          g.ripple(this.netPos.x, this.netPos.z, 1.0, 0.8);
          g.audio.play('surface');
          g.cue('B08');
          if (this.bundle && this.bundle.crab) g.cue('B16');
          g.events.emit('netSurface', { bundle: this.bundle });
        }
        this.pour(dt);
        if (ringY() > 0) this.drip(dt, 1);
        // 网环一出水，吊臂就开始往回转（绞车接着收）：起吊、回转一气呵成，不等吊到顶再转
        if (this.cable <= HANG + 0.001 || (this.surfaced && ringY() > SWING_Y)) {
          this.phase = 'swing';
          this.t = 0;
          this.homeGo = false;
          this.crossY = null;
          g.arm.sync(g.craneTip);
          this.swingT = g.arm.eta(this.home, true) + 0.3;
          g.audio.play('drip', { dur: this.swingT + NET_SET_T });
          g.cue('B09');
        }
        break;
      }
      case 'swing': {
        // 吊臂照它自己的机械样子转回甲板上方（同一台机器的起步、匀速、刹车，放开了转，见 arm.js 的 HOME），网包吊在下面跟着走；
        // 离甲板还远时臂头抬高一点（转过去的路上拱起来），快到时边刹车边放低，不等转到了再放
        const arm = g.arm;
        const M = arm.mech;
        const aStow = Math.atan2(this.home.z - BOAT.crane.z, this.home.x - BOAT.crane.x);
        const far = Math.abs(wrapAngle(M.a - aStow));
        // 绞车接着按起网的速度收，一直收到比挂着时多收一截（网包吊得比甲板高出半米多，到了甲板上方松闸才砸得下去）
        this.cable = Math.max(HANG - LIFT_UP, this.cable - NET_LIFT * (this.liftK || 1) * 0.6 * dt);
        // 网包底还没高过船舷：先不往里收臂。臂伸得够长（转一圈也碰不到船身）就先转着，不够长就停着等绞车
        const deckY = g.boat.body.position.y;
        const bagR = this.bundle ? this.bundle.R : 0.5;
        const bagW = this.bundle ? this.bundle.group.getWorldPosition(_v) : _v.copy(this.netPos).setY(this.netPos.y - 2 + bagR);
        const bagLow = bagW.y - bagR;
        const bl = g.boat.body.worldToLocal(_a.copy(bagW));
        // 网包从哪儿越过船舷（按吊臂转角、伸距一起往回走估），那儿的船舷多高（船头那段翘得高）
        if (this.crossY == null) this.crossY = this.railAt(M.a, M.r, bagR);
        const need = deckY + this.crossY + 0.06;
        const over = g.deck && g.deck.on ? g.deck.overDeck(bl.x, bl.z) : Math.abs(bl.x) < BOAT.halfLen && Math.abs(bl.z) < halfB(bl.x) - 0.3;
        // 吊到顶时网包底比臂头低多少（臂头到吊钩、绞车收到头剩的那截缆、网环到网包底）：照这个把臂头抬到网包过得了船舷的高度（最多比平常高 1.2 米）
        const floor = HANG - LIFT_UP;
        const hookDrop = deckY + M.y - this.hookWorld(_u).y + g.boat.net.hookY + (this.netPos.y - bagLow);
        const sag = hookDrop + floor;
        const archY = clamp(need - deckY + sag, this.home.y, this.home.y + 1.2);
        // 网包高过船舷了，或者照绞车收的速度、臂头往上抬的速度，等吊臂把它带到船边时就高过了：现在就往里收（起吊、回转一气呵成）。
        // 算到船边多远按网包离船身最近的那一边，吊臂按它能走的最快速度带过去（实际走弧线、起步要吃劲，只会更慢）
        if (!this.homeGo) {
          const reel = NET_LIFT * (this.liftK || 1) * 0.6;
          const d = Math.max(0, Math.max(Math.abs(bl.x) - BOAT.halfLen, Math.abs(bl.z) - halfB(clamp(bl.x, -BOAT.halfLen, BOAT.halfLen))) - bagR * 0.8 - 0.2);
          const E = HOME_EXT;
          const tHull = d < (E.v * E.v) / (2 * E.a) ? Math.sqrt((2 * d) / E.a) : d / E.v + E.v / (2 * E.a);
          const rise = Math.max(0, archY - M.y);
          let tc = 0;
          while (tc < 3 && deckY + M.y + Math.min(rise, HOME_LIFT_V * Math.max(0, tc - 0.15)) - hookDrop - Math.max(floor, this.cable - reel * tc) < need) tc += 0.05;
          this.homeGo = tHull > tc + 0.15 || bagLow > need;
        }
        const clear = this.homeGo;
        // 还在舷外的时候臂头抬着（网包过得了船舷，离得远时转过去的路上也拱起来一点）；进了甲板上方再边刹车边放低
        const upY = over ? this.home.y + (far > 0.8 ? 0.6 : 0) : Math.max(archY, this.home.y + (far > 0.8 ? 0.6 : 0));
        const want = _sw;
        if (clear) want.set(this.home.x, upY, this.home.z);
        else if (M.r >= SWING_FREE_R) want.set(BOAT.crane.x + Math.cos(aStow) * M.r, upY, BOAT.crane.z + Math.sin(aStow) * M.r);
        else want.set(BOAT.crane.x + Math.cos(M.a) * M.r, upY, BOAT.crane.z + Math.sin(M.a) * M.r);
        this.craneTo(arm.drive(dt, want, _tip, true));
        const k = clamp(this.t / Math.max(0.5, this.swingT), 0, 1);
        // 吊臂已经在往回转了，网包里的水还在往下泻、蟹还在里面挣
        this.pour(dt);
        this.crabSound(dt);
        this.drip(dt, 1 - k * 0.5);
        // 快到了（刹车的最后一小段、网包已经在甲板上方）就开始往甲板放网，剩下的边放边走完（不在甲板上方慢慢蹭）
        const dTip = Math.hypot(_tip.x - this.home.x, _tip.z - this.home.z);
        const there = (dTip < 0.12 && Math.abs(_tip.y - this.home.y) < 0.1 && arm.motion < 0.15)
          || (clear && over && dTip < SET_EARLY && far < 0.8);
        if (there || this.t > 8) {
          if (!there) { arm.sync(this.home); this.craneTo(this.home); }
          this.phase = 'set';
          this.t = 0;
          this.setFrom = this.cable;
          g.events.emit('bagOverDeck', { bundle: this.bundle });
          if (!this.slot) {
            g.reveal.clearSpot();
            // 网包吊到甲板上方：镜头这时就往冲洗近景推，网包砸下去那一下正好在近处看见
            g.reveal.approach(this.bundle);
          }
        }
        break;
      }
      case 'set': {
        this.craneTo(g.arm.drive(dt, this.home, _tip, true));
        // 网兜放到离甲板还有半米多的地方停住，悬一下；松闸，整包自己砸下去（B10 那一下的分量从这儿来）
        // 按网包底现在离甲板多高，收放到正好高出 DROP_H（只在刚到时定一次，不跟着船晃来回调）
        if (this.setTo == null) {
          const deckWorldY = g.boat.body.position.y + BOAT.deckY;
          // 臂头还差几厘米没降到位的，按降到位以后的网包高度算
          const bagY = (this.bundle ? this.bundle.group.getWorldPosition(_v).y : deckWorldY) - (g.arm.mech.y - this.home.y);
          this.setTo = clamp(this.cable - (deckWorldY + DROP_H - bagY), HANG - LIFT_UP - 0.2, HANG + 2);
        }
        const k = easeOut(clamp(this.t / NET_SET_T, 0, 1));
        this.cable = lerp(this.setFrom, this.setTo, k);
        this.drip(dt, 0.3);
        const hold = this.bundle && this.bundle.heavy ? 0.3 : 0.12;
        // 松闸要等吊臂停到甲板正上方（边刹车边放网的那一小段走完）
        const dTip = Math.hypot(_tip.x - this.home.x, _tip.z - this.home.z);
        const settled = dTip < 0.06 && Math.abs(g.arm.mech.y - this.home.y) < 0.06;
        if (this.t >= NET_SET_T + hold && (settled || this.t > NET_SET_T + hold + 1)) {
          this.phase = 'release';
          this.t = 0;
          this.setTo = null;
          // 砸到甲板那一下（声音、震、船身一沉）在 reveal 里网包真碰到甲板的那一帧
          if (this.slot) g.deck.land(this.bundle, this.slot, this.capturedCrab);
          else g.reveal.begin(this.bundle, this.ev, this.capturedCrab);
          this.slot = null;
          this.bundle = null;
          this.bulge0 = net.state.bulge;
        }
        break;
      }
      case 'release': {
        const k = clamp(this.t / 0.6, 0, 1);
        net.state.close = Math.max(0, (this.hitHard ? 0.55 : 1) * (1 - k));
        // 网兜空了：鼓着的那一兜瘪下去、往上收拢成一圈短短的网边（不垂在往下砸的网包上面）
        const kk = clamp(this.t / 0.18, 0, 1);
        net.state.bulge = lerp(this.bulge0 ?? net.state.bulge, 0.05, kk);
        net.state.depth = lerp(NET_DEPTH, NET_DEPTH_EMPTY, Math.min(kk, clamp((1.9 - this.t) / 0.8, 0, 1)));
        // 闸一松，网兜一下轻了：「嗖」地弹到吊臂头底下（出了近景的画面，不挡着底下砸甲板的那一下），镜头推到了再慢慢落回挂着的高度
        const up = this.t < 0.7;
        this.cable = lerp(this.cable, up ? HANG - 0.95 : HANG, Math.min(1, dt * (up ? 12 : 3)));
        if (k >= 1 && !up && Math.abs(this.cable - HANG) < 0.05) {
          this.cable = HANG;
          net.state.depth = NET_DEPTH;
          this.phase = 'idle';
          net.resize(NET_R);
          this.checkedHard = false;
          this.surfaced = false;
          this.squeezed = false;
          this.sinkCued = false;
          g.events.emit('netDone', {});
        }
        break;
      }
    }
    net.updateSkirt();
  }

  // 转回甲板还差多远（臂头离甲板正上方，米）：效果页按它挑开始的时刻
  get toDeck() {
    const M = this.g.arm.mech;
    return Math.hypot(BOAT.crane.x + Math.cos(M.a) * M.r - this.home.x, BOAT.crane.z + Math.sin(M.a) * M.r - this.home.z);
  }

  // 吊臂从转角 a、伸距 r 往甲板上方（stowTip）转回来，网包（半径 bagR）在哪儿越过船舷、那儿的船舷顶多高（船局部 y）
  railAt(a, r, bagR) {
    const aS = Math.atan2(this.home.z - BOAT.crane.z, this.home.x - BOAT.crane.x);
    const rS = Math.hypot(this.home.x - BOAT.crane.x, this.home.z - BOAT.crane.z);
    const da = wrapAngle(aS - a);
    let y = railY(0);
    for (let i = 0; i <= 40; i++) {
      const k = i / 40, aa = a + da * k, rr = r + (rS - r) * k;
      const x = BOAT.crane.x + Math.cos(aa) * rr, z = BOAT.crane.z + Math.sin(aa) * rr;
      if (Math.abs(x) < BOAT.halfLen + bagR && Math.abs(z) < halfB(clamp(x, -BOAT.halfLen, BOAT.halfLen)) + bagR) {
        // 网包有半径：越过船舷的那一截按它前后两边里高的那边算
        y = Math.max(railY(x - bagR), railY(x), railY(x + bagR));
        break;
      }
    }
    return y;
  }

  // 出水：网包里的水哗地泻下来（起吊、往回转的路上都接着泻，泻完为止）
  pour(dt) {
    const g = this.g;
    const y = this.netPos.y;
    if (!(this.pourT > 0) || y <= -0.2) return;
    this.pourT -= dt;
    const k = this.pourT / 0.9;
    for (let i = 0; i < 4 * k + 1; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.75;
      g.fx.emit('splash', this.netPos.x + Math.cos(a) * r, y - 0.7 - Math.random() * 0.4, this.netPos.z + Math.sin(a) * r, Math.cos(a) * 0.4, -1.2 - Math.random(), Math.sin(a) * 0.4, { size: 0.12 + k * 0.08, life: 0.7 });
    }
  }

  // 网里兜着蟹：一路上隔一会儿挣一下（第一只活物那一网另有更响的挣法）
  crabSound(dt) {
    if (!this.bundle || !this.bundle.crab || this.bundle.loud) return;
    if ((this.crabT = (this.crabT || 0) - dt) > 0) return;
    this.crabT = 0.7 + Math.random() * 0.5;
    this.g.audio.play('crabNet', { gain: this.netPos.y < 0 ? 0.5 : 1 });
  }

  // 这一网还要多久落到甲板上：已经走过的时间 ÷（走过的 + 按眼下位置估的剩余），只往前走
  progress() {
    if (this.phase === 'idle' || this.phase === 'release') return 1;
    const ev = this.ev;
    const depth = Math.max(0.5, -ev.restY);
    const y = this.netPos.y;
    const lift = (depth + 4) / NET_LIFT * 1.15;
    // 转回甲板要多久：吊臂照眼下的位置和速度估
    const tail = this.g.arm.eta(this.home, true) + NET_SET_T;
    let rem;
    switch (this.phase) {
      case 'air': rem = Math.max(0, y) / NET_DROP_AIR + depth / NET_SINK * 1.25 + 0.32 + NET_CLOSE_T + lift + tail; break;
      case 'sink': rem = Math.max(0, y - ev.restY) / NET_SINK * 1.25 + 0.32 + NET_CLOSE_T + lift + tail; break;
      case 'touch': rem = Math.max(0, 0.32 - this.t) + NET_CLOSE_T + lift + tail; break;
      case 'close': rem = Math.max(0, NET_CLOSE_T - this.t) + lift + tail; break;
      case 'lift': rem = Math.max(0, this.cable - HANG) / NET_LIFT * 1.15 + tail; break;
      case 'swing': rem = tail; break;
      case 'set': rem = Math.max(0, NET_SET_T + 0.12 - this.t); break;
      default: rem = 0;
    }
    this.prog = Math.max(this.prog, this.elapsed / Math.max(1e-3, this.elapsed + rem));
    return this.prog;
  }

  drip(dt, amt) {
    this.dripT += dt * 30 * amt;
    while (this.dripT > 1) {
      this.dripT -= 1;
      const p = this.netPos;
      this.g.fx.emit('drip', p.x + (Math.random() - 0.5) * 1.4, p.y - 0.9 - Math.random() * 0.4, p.z + (Math.random() - 0.5) * 1.4, 0, -0.5, 0, Math.random() < 0.5 ? { color: [0.85, 0.92, 0.95] } : {});
    }
  }

  onTouch() {
    const g = this.g;
    const p = this.netPos;
    const y = this.ev.restY;
    // 网口周围扬起泥沙，草被压倒
    const sandy = y > -7;
    // 网口一圈泥沙鼓起来往外翻：一圈大的泥云（比海底亮，深处也看得出），一圈沙粒溅起来
    const col = sandy ? [0.86, 0.8, 0.64] : [0.72, 0.64, 0.5];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + Math.random() * 0.2;
      const sp = 1.3 + Math.random() * 0.8;
      g.fx.emit('cloud', p.x + Math.cos(a) * NET_R, y + 0.2, p.z + Math.sin(a) * NET_R, Math.cos(a) * sp, 0.45 + Math.random() * 0.45, Math.sin(a) * sp, { color: col, size: 1.0 + Math.random() * 0.5 });
    }
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      g.fx.emit('cloud', p.x + Math.cos(a) * NET_R * 0.5, y + 0.3, p.z + Math.sin(a) * NET_R * 0.5, Math.cos(a) * 0.4, 0.9 + Math.random() * 0.6, Math.sin(a) * 0.4, { color: col, size: 0.9, life: 4.5 });
    }
    g.fx.burst('sand', p.x, y + 0.1, p.z, 30, 1.8, NET_R, { up: 0.9 });
    g.cue('B04');
    const pr = PRESS.uPress.value[this.g.pressIdx++ % 8];
    pr.set(p.x, p.z, NET_R + 1.4, 1);
    this.g.pressList.push({ v: pr, t: 0 });
    g.audio.play('touch');
    g.events.emit('netTouch', { x: p.x, y, z: p.z });
    g.items.addScar(p.x, p.z, NET_R, (x, z) => (this.ev.inHold ? y : seabedY(x, z)));
  }

  capture() {
    const g = this.g;
    const p = this.netPos;
    const ev = this.ev;
    const got = [];
    // 和调臂时的预告同一套规则（forecast.js）
    for (const it of g.items.onSeabed()) {
      if (netVerdict(it, p.x, p.z, ev.restY, ev.inHold, this.hitHard) === 'yes') got.push(it);
    }
    for (const it of got) g.items.removeFromSeabed(it);
    // 活物：闭网这一刻真正在网口里的才算
    let crab = null;
    for (const c of g.crabs) {
      if (!c.catchable) continue;
      if (crabInNet(c.pos.x, c.pos.z, c.pos.y, p.x, p.z, ev.restY)) { crab = c; break; }
    }
    if (crab) { crab.capture(); this.capturedCrab = crab; }
    this.bundle = new Bundle(got, { crab: crab ? crab.makeCaptive() : null });
    // 这一趟第一只活物：网包挣得更明显，每猛顶一下网里一声、出水后甩出几滴水
    if (crab && !g.firsts.crab) {
      const b = this.bundle;
      b.loud = true;
      b.onJab = () => {
        if (this.bundle !== b) return;
        const q = b.group.getWorldPosition(new THREE.Vector3());
        const wet = q.y > -0.3;
        g.audio.play('crabNet', { gain: wet ? 1 : 0.55 });
        if (wet) for (let i = 0; i < 6; i++) g.fx.emit('spray', q.x, q.y, q.z, (Math.random() - 0.5) * 2.2, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 2.2);
        else g.fx.emit('cloud', q.x, q.y, q.z, 0, 0.2, 0, { size: 0.9, life: 2.2 });
      };
    }
    g.boat.net.bag.add(this.bundle.group);
    this.bundle.group.position.set(0, -0.35 - this.bundle.R * 0.6, 0);
    g.boat.net.state.bulge = 0.1 + this.bundle.R * 0.25;
    g.events.emit('netClosed', { got, crab, hitHard: this.hitHard, x: p.x, z: p.z });
  }

  // 网架现在晃得多快（相对臂头，米/秒）：按了下网时等它稳一点再放
  get swingSpeed() {
    return this.swV ? Math.hypot(this.swV.x, this.swV.z) : 0;
  }

  // 网架的位置：钢缆吊在臂头下面。挂着的时候是一个阻尼很大的短摆（见 SWING_AIR），
  // 往下放、收网、落甲板时直上直下；网架和钢缆一起朝着臂头斜，吊链始终对着臂头
  updateNetBody(dt) {
    const g = this.g;
    const hook = this.hookWorld();
    if (!this.hookVel) {
      this.hookVel = new THREE.Vector3();
      this.hookAcc = new THREE.Vector3();
      this.hookPrev = hook.clone();
      this.sw = new THREE.Vector3();
      this.swV = new THREE.Vector3();
    }
    if (dt > 0) {
      const vx = (hook.x - this.hookPrev.x) / dt, vz = (hook.z - this.hookPrev.z) / dt;
      if (Math.hypot(vx, vz) > 30) {
        // 一帧跳太远（重来一趟、效果页摆场景）：不算速度，网架跟着到位、不晃
        this.hookVel.set(0, 0, 0);
        this.hookAcc.set(0, 0, 0);
        this.sw.set(0, 0, 0);
        this.swV.set(0, 0, 0);
      } else {
        // 臂头的加速度（水平）：轻轻滤一下，船随浪起伏的细碎抖动不传过去
        const f = 1 - Math.exp(-dt * 20);
        this.hookAcc.x += (clamp((vx - this.hookVel.x) / dt, -30, 30) - this.hookAcc.x) * f;
        this.hookAcc.z += (clamp((vz - this.hookVel.z) / dt, -30, 30) - this.hookAcc.z) * f;
        this.hookVel.set(vx, 0, vz);
      }
      this.hookPrev.copy(hook);
    }
    const L = this.cable + g.boat.net.hookY;
    const target = _a.copy(hook);
    target.y -= L;
    // 松闸时网架晃一晃，越晃越小
    if (this.sway > 0.01) {
      this.sway *= Math.exp(-dt * 2.6);
      const sw = Math.sin(this.elapsed * 8.5) * 0.32 * this.sway;
      const h = g.boatCtl.heading;
      target.x += Math.sin(h) * sw;
      target.z += Math.cos(h) * sw;
    }
    // 刮到硬东西：网架一震
    if (this.jolt > 0.01) {
      this.jolt *= Math.exp(-dt * 6);
      target.y += Math.sin(this.elapsed * 40) * 0.12 * this.jolt;
    }
    const S = this.sw, SV = this.swV;
    if (this.phase === 'sink' || this.phase === 'touch' || this.phase === 'close' || this.phase === 'set' || this.phase === 'release' || this.phase === 'air') {
      // 下放和收网时直上直下
      this.netPos.lerp(target, Math.min(1, dt * (this.phase === 'air' ? 12 : 20)));
      S.set(this.netPos.x - target.x, 0, this.netPos.z - target.z);
      SV.set(0, 0, 0);
    } else if (dt > 0) {
      // 吊着的短摆：臂头往哪边加速，网架往反方向让；阻尼大，一停就稳。水里拖得更死
      const P = this.netPos.y < 0 ? SWING_WATER : SWING_AIR;
      const A = this.hookAcc;
      SV.x += (-P.w * P.w * S.x - 2 * P.z * P.w * SV.x - P.g * A.x) * dt;
      SV.z += (-P.w * P.w * S.z - 2 * P.z * P.w * SV.z - P.g * A.z) * dt;
      S.x += SV.x * dt;
      S.z += SV.z * dt;
      const m = Math.hypot(S.x, S.z);
      if (m > SWING_MAX) { S.multiplyScalar(SWING_MAX / m); SV.multiplyScalar(0.5); }
      // 摆出去时网架顺着圆弧抬起一点（钢缆长度不变）
      const rise = L - Math.sqrt(Math.max(0, L * L - S.x * S.x - S.z * S.z));
      this.netPos.set(target.x + S.x, target.y + rise, target.z + S.z);
    }
    const root = g.boat.root;
    const local = root.worldToLocal(_tip.copy(this.netPos));
    g.boat.net.root.position.copy(local);
    // 网架朝着臂头斜：吊链的顶（吊钩）落在网架到臂头的那条线上，钢缆从吊钩拉直到臂头
    _u.subVectors(hook, this.netPos);
    const len = _u.length();
    if (len > 1e-3) _u.divideScalar(len); else _u.set(0, 1, 0);
    _q.copy(root.quaternion).invert();
    const uLocal = _u.applyQuaternion(_q);
    g.boat.net.root.quaternion.setFromUnitVectors(_up, uLocal);
    const top = _sw.copy(uLocal).multiplyScalar(g.boat.net.hookY).add(local);
    g.boat.hoist.set(top, root.worldToLocal(hook));
    if (this.bundle) this.bundle.update(dt, g.time);
  }
}

export { HANG };
