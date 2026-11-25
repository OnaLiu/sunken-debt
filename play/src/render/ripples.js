// 水面上推出去的一圈圈波纹（后期里的水面着色读 uRipple：圆心 x、z，半径，高低）。
// 按游戏时间推（慢放跟着慢）；同时最多 4 圈，再多就挤掉最早的一圈。现在给船钟用（C9：“当——”，再两声海底回响）。
export class Ripples {
  constructor(uniform) {
    this.u = uniform; this.list = [];
    for (const v of this.u.value) v.set(0, 0, 0, 0); // 新开一趟：上一趟留着的圈清掉
  }
  // r0：从多大的圈开始（船壳边上起）；speed：每秒往外推几米，越推越慢；life：几秒淡完
  add(x, z, { amp = 1, speed = 5, life = 6, r0 = 3 } = {}) {
    this.list.push({ x, z, amp, speed, life, r0, t: 0 });
    while (this.list.length > this.u.value.length) this.list.shift();
  }
  update(dt) {
    for (const r of this.list) r.t += dt;
    this.list = this.list.filter((r) => r.t < r.life);
    this.u.value.forEach((v, i) => {
      const r = this.list[i];
      if (!r) { v.w = 0; return; }
      const k = r.t / r.life;
      v.set(r.x, r.z, r.r0 + r.speed * r.t * (1 - 0.35 * k), r.amp * (1 - Math.exp(-r.t * 9)) * Math.pow(1 - k, 1.6));
    });
  }
}
