import * as THREE from 'three';
import { NET_R } from '../config.js';
import { BOAT } from '../world/boat.js';
import { MIN_NET_COST } from './trip.js';
import { netVerdict } from './forecast.js';
import { canSee } from './sight.js';
import { N } from './tables.js';

// 吊机手（全游戏一份，`玩法.md`「自动打捞和船队」）：雇来以后，吊机前扳手柄的那个船员自己下网。
// 他怎么挑就是自动演示的机器人那一套：只看屏幕上看得见的打捞点（和鼠标指的同一份 snap.spots），只按玩家能按的那一下（白圈跳过去、下网），
// 不知道藏着的东西在哪。
//   什么时候下：船停稳、你没在按 W A S D、网不在水里、没在冲、甲板没满；他停一拍（转头看向挑好的那一处，箭头上顶着他的小头像），
//              白圈跳过去、吊臂转过去、网落下去。网收回来船还停着、你也没点下一处，他再停一拍接着挑。
//   怎么挑：只挑金圈的那几处（这一网带得上来、不会刮到硬东西），白圈罩得住看得见的件数最多的那一处，一样多挑离船近的。
//   橙圈他不下：够得着的只剩橙圈、灰圈时他坐着等（模式牌「吊机手无处下网」），你把船开到别处他才接着下。
//   你接过吊机：任何时候指着一处左键，这一网就是你的——他正在那一拍里就松开手柄往后让一步；他的网在水里，你点的那一处排在下一网。
//              你的网收回来以后你没再点，他坐回去接着挑。你一开船他就松手。开冲、揭宝、开舱时他也停手。
//   最后一网：油只够再下一网时，他挑好以后先回头看你一眼、停得比平时长一拍；你不点，他就下他挑的那一处。
// 他下的网和你下的是同一份（tryCast → netop）：一样的吊臂、一样的分量、一样扣这一网的油，捞上来的一样码在甲板上。

const _v = new THREE.Vector3();

export class CraneHand {
  constructor(g) {
    this.g = g;
    this.reset();
  }

  reset() {
    this.st = 'idle'; // idle 没在干 | beat 挑好了、停一拍 | cast 他的网（按了到收回来） | away 让开（你的网） | wait 无处下网
    this.pick = null;
    this.t = 0;
    this.beatDur = 0;
    this.last = false;
    this.netBy = null;
    this.casting = false;
    this.tried = new Set();
    this.stillT = 0;
    this.again = false;
    this.nodAfter = false;
    this.lookBack = false;
  }

  // 雇了没有、这会儿在不在一趟里
  get hired() {
    const g = this.g;
    return !!(g.run.on && g.run.level('hand') >= 2);
  }

  get sailor() {
    return this.g.crew.hand;
  }

  // 油只够再下一网：够最浅的一网、不够两网（`玩法.md`「一趟什么时候结束」）
  get lastNet() {
    const f = this.g.trip.fuel;
    return f >= MIN_NET_COST && f < MIN_NET_COST * 2;
  }

  // 一处打捞点是什么圈：'gold' 这一网带得上来（几件）、'hard' 会刮到埋着的硬东西、'no' 一件也带不上来；够不着的不算
  verdict(s) {
    const g = this.g;
    if (s.far) return { k: 'far', n: 0 };
    const ev = g.snap.evalAt(s.x, s.z);
    if (!ev || !ev.ok) return { k: 'no', n: 0 };
    const corner = g.timberMesh;
    if (corner && !ev.inHold) {
      const p = corner.position;
      if (Math.hypot(p.x - s.x, p.z - s.z) < (ev.r || NET_R) + 0.25 && canSee(g, p, 0.35)) return { k: 'hard', n: 0, ev };
    }
    let n = 0;
    for (const id of s.ids) {
      // 蟹翻过泥的那块地：泥里还埋着那枚印章才算一件（捞走以后那块泥还看得见，下下去是一网空泥）
      const it = id === 'dig' ? g.items.seal : g.items.items.find((i) => i.id === id);
      if (id === 'dig' && s.ids.includes(it && it.id)) continue;
      if (it && it.state === 'seabed' && netVerdict(it, s.x, s.z, ev.restY, ev.inHold, false, 0.05, ev.r, ev.drop) === 'yes') n++;
    }
    return { k: n ? 'gold' : 'no', n, ev };
  }

  // 挑一处：金圈里件数最多的，一样多挑离船近的
  choose() {
    const g = this.g, bp = g.boatCtl.pos;
    let best = null, bn = 0, bd = Infinity, any = false;
    for (const s of g.snap.spots) {
      if (s.far || g.snap.taken(s) || this.tried.has(s.key)) continue;
      any = true;
      const v = this.verdict(s);
      if (v.k !== 'gold') continue;
      const d = Math.hypot(s.x - bp.x, s.z - bp.z);
      if (v.n > bn || (v.n === bn && d < bd - 1e-6)) { best = s; bn = v.n; bd = d; }
    }
    return { best, any };
  }

  // 他这会儿能不能动手：一趟里、打捞那一屏、网不在水里、没在冲、甲板没满、船停稳、你没在开船、没点好下一处、油够一网
  ready(drive) {
    const g = this.g;
    if (g.mode !== 'arm' || g.trip.ended || g.netop.busy || g.castQ || g.reveal.active || g.batch.on || g.deck.busy || g.deck.full) return false;
    if (g.run.quitHold !== null || g.run.endAfterBatch) return false;
    if (drive.throttle || drive.brake || drive.steer) return false;
    if (g.snap.next) return false;
    if (g.trip.fuel < MIN_NET_COST) return false;
    const bc = g.boatCtl;
    return Math.abs(bc.speed) < 0.06 && Math.abs(bc.turnRate) < 0.03;
  }

  // 船局部的一点：他头要转向的地方
  local(x, z) {
    return this.g.boat.body.worldToLocal(_v.set(x, 0, z));
  }

  look(at) {
    const s = this.sailor;
    if (!s) return;
    s.task.lookAt = at ? { x: at.x, z: at.z } : null;
  }

  // 镜头在船局部哪儿（回头看你）
  camLocal() {
    const p = this.g.cam.cam.position;
    return this.local(p.x, p.z);
  }

  // 每帧（打捞那一屏）。drive：这一帧玩家按着的开船键
  update(dt, drive) {
    const g = this.g, s = this.sailor;
    if (!this.hired || !s || !g.deck.on || g.run.phase !== 'trip') { if (this.st !== 'idle') this.drop(); return; }
    const T = s.task;
    // 你的网（按了、在水里）：他让开；收回来你没再点，他坐回去、停一拍接着挑
    if (this.netBy === 'you' && (g.castQ || g.netop.busy)) {
      if (this.st !== 'away') { this.st = 'away'; this.pick = null; this.look(null); T.st = 'away'; }
      return;
    }
    if (this.st === 'away' && !g.castQ && !g.netop.busy) {
      T.st = 'sit';
      this.st = 'idle';
      this.again = true;
    }
    // 他的网：按了到收回来
    if (this.st === 'cast') {
      if (g.castQ || g.netop.busy) { this.look(null); return; }
      this.st = 'idle';
      this.again = true;
      this.tried.clear();
    }
    // 开冲、揭宝：停手；冲完以后最后一网那一包是他让给你的，他冲你点一下头
    if (g.batch.on || g.reveal.active) { this.cancel(); this.again = true; return; }
    if (this.nodAfter && !g.batch.on && g.mode === 'arm') {
      this.nodAfter = false;
      this.look(this.camLocal());
      s.gesture('nod', { delay: 0.2 });
      g.later(1.6, () => { if (this.sailor) this.look(null); });
    }
    if (!this.ready(drive)) {
      // 开船、点好下一处：他松手
      if (this.st === 'beat' || this.st === 'wait') this.cancel();
      if (drive.throttle || drive.brake || drive.steer) { this.again = false; this.tried.clear(); }
      this.stillT = 0;
      return;
    }
    this.stillT += dt;
    if (this.st === 'idle' || this.st === 'wait') {
      g.snap.refresh(false);
      const { best } = this.choose();
      if (!best) {
        // 够得着的只剩橙圈、灰圈（或者一处都没有）：他坐着等你挪船
        if (this.st !== 'wait' && this.stillT > 0.4) { this.st = 'wait'; this.look(null); }
        return;
      }
      this.st = 'beat';
      this.pick = best;
      this.last = this.lastNet;
      this.beatDur = (this.again ? N('吊机手·再挑停多久', 0.9) : N('吊机手·挑之前停多久', 0.9)) + (this.last ? N('吊机手·最后一网多停多久', 1.6) : 0);
      this.t = 0;
      this.lookBack = false;
      const p = this.local(best.x, best.z);
      this.look(p);
      g.cue('A26');
      return;
    }
    if (this.st === 'beat') {
      // 挑的那一处还在不在（捞走了、看不见了）：重挑
      const cur = g.snap.same(this.pick);
      if (!cur || cur.far) { this.st = 'idle'; this.pick = null; return; }
      this.pick = cur;
      this.t += dt;
      // 最后一网：看一眼那一处，回头看你（停得比平时长一拍），再转回去
      if (this.last) {
        const a = 0.55, b = a + N('吊机手·最后一网多停多久', 1.6);
        const back = this.t > a && this.t < b;
        if (back !== this.lookBack) { this.lookBack = back; this.look(back ? this.camLocal() : this.local(cur.x, cur.z)); }
        if (back) this.look(this.camLocal());
      }
      if (this.t >= this.beatDur) this.castAt(cur);
    }
  }

  // 他下网：白圈跳过去，吊臂转过去，网落下去（和玩家按下网是同一下）
  castAt(s) {
    const g = this.g;
    this.look(this.local(s.x, s.z));
    g.snap.go(s, true);
    this.casting = true;
    g.tryCast(true);
    this.casting = false;
    if (g.castQ) {
      this.st = 'cast';
      this.netBy = 'hand';
    } else {
      // 下不去（被挡住、油不够）：这一处这一次不再试
      this.tried.add(s.key);
      this.st = 'idle';
    }
    this.pick = null;
    this.again = true;
  }

  // 你按了下网（不是他）：记下这一网是你的
  onCast() {
    if (this.casting) return;
    this.netBy = 'you';
    if (!this.hired) return;
    // 自己点过一处（看见他让开）：画面下方「自己下这一网」那一行收起
    this.g.ui.learn('takeover');
    // 最后一网是你下的：这一甲板冲完，他冲你点一下头
    if (this.lastNet) this.nodAfter = true;
  }

  // 他松手：不下了，头转回来
  cancel() {
    if (this.st === 'beat' || this.st === 'wait') { this.st = 'idle'; this.pick = null; this.look(null); }
  }

  drop() {
    this.st = 'idle';
    this.pick = null;
    this.netBy = null;
  }

  // 模式牌上这会儿写什么：'last' 油只够一网（网还没下）、'hand' 吊机手作业、'handWait' 吊机手无处下网；没有就照平常
  plate() {
    const g = this.g;
    if (!g.run.on || g.run.phase !== 'trip') return null;
    const down = g.netop.busy || g.mode === 'net';
    if (!down && g.mode === 'arm' && this.lastNet && !g.trip.ended) return 'last';
    if (!this.hired) return null;
    if (this.st === 'beat' || (this.st === 'cast' && (g.castQ || g.netop.busy))) return 'hand';
    if (this.st === 'wait') return 'handWait';
    return null;
  }

  // 箭头上顶着他小头像的那一处（他挑好了、网还没下）
  get marked() {
    return this.st === 'beat' && this.pick ? this.pick.key : null;
  }
}

export { BOAT };
