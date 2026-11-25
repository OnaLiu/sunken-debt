// 瞄准时落点下有埋着的硬物（W4，档：轻，界面反馈）。
// 按“网口边离硬物还差几米”分两级（和闭网时咬不咬得到同一个判定：网口半径 + 硬物半径 × 0.4）：
//   靠近（网口边离它不到 2.2 米）：硬物上那枚红三角醒过来，变大一点、轻轻跳一下，很轻的“嗒”。
//   压上（网口已经罩到它）：三角猛地跳起来、放大再落回，网口圈朝它那一段变红、圈边上也挂一枚红三角，
//     “嗒”加一声低音；压着不动时三角慢慢一胀一缩。
// 挪开就退回去（不响）。只在作业瞄准、硬物看得见时算。画在 ui/overlay.js 和 game/aimviz.js 里，这里只记状态。
import { NET_R } from './net.js';
import { fxTag } from '../fx/tags.js';
import { clamp } from '../core/noise.js';

export const HAZ_NEAR = 2.2;

// 硬物看得见吗（和世界标记层画红三角同一个规则：水越深越要靠近）
export function hazardSeen(g, o) {
  const gy = g.world.surfaceTop(o.x, o.z);
  const range = clamp(50 - Math.max(0, -gy) * 1.25, 15, 50);
  return Math.hypot(o.x - g.boat.x, o.z - g.boat.z) <= range;
}

export class HazardAim {
  constructor(g) {
    this.g = g;
    this.o = null;     // 离网口最近的那件硬物
    this.d = 9;        // 网口边离它还差几米（≤ 0 = 压上了）
    this.level = 0;    // 0 远 / 1 靠近 / 2 压上
    this.t = -9;       // 这一级从什么时候开始（三角按它跳）
    this.sndT = -9;
  }
  update() {
    const g = this.g;
    const active = g.mode === 'work' && !g.op && !g.ended && !(g.reveal.busy && g.reveal.active.phase !== 'pull');
    let best = null, bd = 9;
    if (active && g.world.obstaclesNear) {
      for (const o of g.world.obstaclesNear(g.aim.x, g.aim.z, NET_R + HAZ_NEAR + 1)) {
        const d = Math.hypot(o.x - g.aim.x, o.z - g.aim.z) - (NET_R + o.r * 0.4);
        if (d < bd && hazardSeen(g, o)) { bd = d; best = o; }
      }
    }
    // 往回退要多退一点（停在边上不会一跳一跳）
    const L = this.level;
    let lv = !best ? 0 : bd <= (L === 2 ? 0.12 : 0) ? 2 : bd <= HAZ_NEAR + (L >= 1 ? 0.3 : 0) ? 1 : 0;
    this.o = best; this.d = bd;
    if (lv === L) return;
    this.level = lv;
    if (lv < L) { if (lv) this.t = g.time - 1; return; } // 退回：不再跳、不出声
    this.t = g.time;
    if (g.time - this.sndT > 0.2) { this.sndT = g.time; g.audio && g.audio.play('hazTick', { hit: lv === 2 }); }
    if (lv === 2) fxTag('W4', '网口压到埋着的硬物', 'W4');
    else fxTag('W4', '网口靠近埋着的硬物', 'W4');
  }
}
