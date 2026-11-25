import { wrapAngle, clamp } from '../util/math.js';

// 机器人怎么开船（和玩家一样只按 W、S、A、D）：想往世界里 (dx, dz) 那边开，这一刻该按哪几个键。
// 朝那边差得多就一边走一边打满舵，已经对准就松开舵；mag 小就点着给油。
// 返回 { mx, my }：mx 右正（D），my 前正（W），负的是 S。
export function pilot(bc, dx, dz, mag = 1) {
  const L = Math.hypot(dx, dz);
  if (L < 1e-3 || mag < 0.05) return { mx: 0, my: 0 };
  const want = Math.atan2(-dz, dx);
  // 照眼下转得多快往前看一点：转到位时松开舵，船头稳稳停住
  const err = wrapAngle(want - bc.heading - bc.turnRate * 0.25);
  const vmax = bc.cruise;
  const goal = vmax * clamp(mag, 0.15, 1) * (Math.abs(err) > 1.2 ? 0.42 : Math.abs(err) > 0.5 ? 0.65 : 1);
  const my = bc.speed < goal - 0.1 ? 1 : bc.speed > goal + 0.7 ? -1 : 0;
  const mx = Math.abs(err) < 0.06 ? 0 : err > 0 ? -1 : 1;
  return { mx, my };
}

// 停船：往前滑着就踩住 S，停稳松开
export function pilotStop(bc) {
  return { mx: 0, my: bc.speed > 0.25 ? -1 : bc.speed < -0.25 ? 1 : 0 };
}
