import * as THREE from 'three';
import { NET_R, ARM_MAX } from '../config.js';
import { BOAT } from '../world/boat.js';
import { canSee, seeItem, exposedOf } from './sight.js';

// 网口的规则：闭网那一刻（netop.capture）和调臂时的预告用同一份。
// 'yes' 带得上来；'edge' 压在网口边上；'deep' 埋得太深；'away' 不在这一网落的那一面（舱里/舱外）；null 网口碰不到。
// margin：预告时留的余量。网落下去会偏几厘米，贴着网口边的不打包票说带得上来。
export function netVerdict(it, x, z, restY, inHold, hitHard = false, margin = 0) {
  const d = Math.hypot(it.x - x, it.z - z);
  if (d - it.r > NET_R) return null;
  if (Math.abs(it.y - restY) > 1.1 || it.inHold !== !!inHold) return 'away';
  if (d + it.r * 0.6 > NET_R - margin) return 'edge';
  // 刮到硬东西：扎得深的会被震掉（grip 是只给这条规则用的扎进去多深，没给就按埋得多深）
  if (hitHard ? (it.grip ?? it.bury) > 0.3 : it.bury * it.h > 0.45) return 'deep';
  return 'yes';
}

// 活物：闭网这一刻真正在网口里的才算
export function crabInNet(x, z, y, cx, cz, restY) {
  return Math.hypot(x - cx, z - cz) < NET_R - 0.15 && Math.abs(y - restY) < 1.0;
}

// 蟹的去留在网落到底那一下定（crab.startle）：那时在这一圈里的出不去、会被兜上来；圈外的、正在逃的跑回窝
// 网口大小跟着设备变：每次现取
const crabTrap = () => NET_R - 0.1;
// 预告蟹的时候：落到底的时刻前后各算一点（按 A 的早晚、落网快慢都有出入），三个时刻都稳稳在圈里才给金圈，
// 都稳稳在外面（或已经钻回窝）才打叉；卡在边上说不准的，不预告
const CRAB_WINDOW = 0.35;
const CRAB_MARGIN = 0.22;

// 按 A 到网落到底要多久（实测：空中约半秒，水下每米约 0.16 秒，最后一段放慢）
export const touchTime = (depth) => 0.66 + depth * 0.164;

// 调臂时的预告：这一网会兜到什么。只看玩家看得见的东西（和机器人同一份「看得见」）；
// 看不见的（全埋着的船材、埋得只剩一点的东西）不预告，那是选择的风险。
//   yes  金圈：这一网带得上来（蟹：网落到底时它稳稳在网口里；圈画在它那时会在的地方）
//   no   灰圈打叉：碰得到、带不上来（压在边上、埋得太深、不在这一面；蟹：落到底时已经走出网口或钻回窝）
//   near 淡圈：看得见、臂够得着，这一网没罩着
//   hard 橙圈：露出来的那一角船材在网口里，这一网会刮到硬东西，埋着的东西会掉
export class Forecast {
  constructor(g) {
    this.g = g;
    this.marks = [];
    this.yes = 0;
    this.yesIds = new Set();
    this.t = 0;
  }

  reset() {
    this.marks = [];
    this.yes = 0;
    this.yesIds.clear();
  }

  update(dt, ev, mode) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.1;
    this.reset();
    const g = this.g;
    if (mode !== 'arm' || !ev || g.netop.busy) return;
    const crane = g.boatCtl.localToWorld(new THREE.Vector3(BOAT.crane.x, 0, BOAT.crane.z), new THREE.Vector3());
    let hard = false;
    const corner = g.timberMesh;
    if (ev.ok && corner && !ev.inHold) {
      const p = corner.position;
      if (Math.hypot(p.x - ev.tip.x, p.z - ev.tip.z) < NET_R + 0.25 && canSee(g, p, 0.35)) {
        hard = true;
        this.marks.push({ k: 'hard', p: p.clone(), r: 0.4 });
      }
    }
    for (const it of g.items.items) {
      if (it.state !== 'seabed') continue;
      if (Math.hypot(it.x - crane.x, it.z - crane.z) > ARM_MAX + NET_R - it.r * 0.6) continue;
      if (!seeItem(g, it)) continue;
      const v = ev.ok ? netVerdict(it, ev.tip.x, ev.tip.z, ev.restY, ev.inHold, hard, 0.05) : null;
      const k = v === 'yes' ? 'yes' : v ? 'no' : 'near';
      this.marks.push({ k, p: new THREE.Vector3(it.x, it.y + exposedOf(it) * 0.5, it.z), r: it.r, id: it.id });
      if (k === 'yes') { this.yes++; this.yesIds.add(it.id); }
    }
    if (!ev.ok) return;
    const T = touchTime(ev.depth);
    for (const c of g.crabLife.list) {
      if (!c.catchable) continue;
      const d0 = Math.hypot(c.pos.x - ev.tip.x, c.pos.z - ev.tip.z);
      if (d0 > NET_R + 2.5) continue;
      if (!canSee(g, c.pos.clone().setY(c.pos.y + 0.1), c.r, 0.92, c)) continue;
      // 和网落的不是一层（舱里 / 舱外、甲板上 / 海底）：兜不到
      const level = Math.abs(c.pos.y - ev.restY) < 1.0;
      const fs = [T - CRAB_WINDOW, T, T + CRAB_WINDOW].map((t) => c.predict(t));
      const gone = (f) => f.hidden || f.st === 'flee' || f.st === 'hide';
      const dist = (f) => Math.hypot(f.x - ev.tip.x, f.z - ev.tip.z);
      if (level && fs.every((f) => !gone(f) && dist(f) < crabTrap() - CRAB_MARGIN)) {
        // 金圈画在它落网那一刻会在的地方（不是套在蟹身上跟着走，免得看成「锁定」），从蟹身上牵一道虚线过去
        const f = fs[1];
        this.marks.push({ k: 'yes', crab: c, r: c.r * 1.6, at: new THREE.Vector3(f.x, c.pos.y + 0.1, f.z) });
        this.yes++;
        this.yesIds.add('crab' + c.id);
      } else if (d0 - c.r < NET_R && (!level || fs.every((f) => gone(f) || dist(f) > crabTrap() + 0.1))) {
        this.marks.push({ k: 'no', crab: c, r: c.r * 1.6 });
      }
    }
  }
}
