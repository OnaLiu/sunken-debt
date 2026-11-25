// 界面上的 CSS 动画、过渡跟着游戏时间走（全游戏一份）。
// 真时间玩的时候用不着它（CSS 自己按真时间走，暂停另有 animationPlayState）；
// 快钟（试跑 __advance、效果页逐帧录像）时由它一帧一帧推：截出来的那一帧，界面停在和真玩到这一秒一样的样子。
export class CssClock {
  constructor() {
    this.anims = new Map();
  }

  inStage(a) {
    const t = a.effect && a.effect.target;
    return !!(t && t.closest && t.closest('#stage'));
  }

  tick(dt) {
    const next = new Map();
    for (const a of document.getAnimations()) {
      if (!this.inStage(a)) continue;
      let t = this.anims.get(a);
      if (t === undefined) { t = 0; try { a.pause(); } catch (e) { /* */ } }
      // CSS 里写着停住的（还没轮到它出场、暂停时停住的那几样）：不往前推
      else if (!(a.animationName && getComputedStyle(a.effect.target).animationPlayState.includes('paused'))) t += dt * 1000;
      try { a.currentTime = t; } catch (e) { /* */ }
      next.set(a, t);
    }
    this.anims = next;
  }

  // 回到真时间：交给浏览器自己走
  release() {
    for (const a of this.anims.keys()) { try { a.play(); } catch (e) { /* */ } }
    this.anims = new Map();
  }
}
