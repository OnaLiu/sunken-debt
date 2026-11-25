// 第一次进入作业（F3）：按键面板照常滑进来，这一次多三样——
//   右上角一枚“新”字章盖下来（从大到小砸下去、外面一圈光推开），随后再闪两下；
//   几行一行一行进来，每行的键帽挨个亮一下（告诉你先看哪个键）；
//   用过的键当场打勾、键帽变绿，那一行的字淡一点（“这个会了”）。
// 只在玩家自己第一次进作业时（演示里机器人在开，面板本来就不出）；以后再进作业，面板和原来一样。
import { FIRSTS } from '../game/firsts.js';
import { fxTag } from '../fx/tags.js';

export class KeysFirst {
  constructor() { this.on = false; this.t0 = 0; }
  // 面板要飞进来的那一刻（hud 判断过：第一次到这个地方、不是演示）
  enter(place, g) {
    this.on = place === 'work' && FIRSTS.take('F3', g);
    if (!this.on) return;
    this.t0 = g.time;
    if (g.firsts) g.firsts.used = {};
    g.audio && g.audio.play('firstKeys');
    fxTag('F3', '第一次进入作业');
  }
  decorate(html) { return this.on ? html + '<b class="knew"><i>新</i></b>' : html; }
  update(el, g, shown) {
    if (this.on && !shown && g.time - this.t0 > 0.3) this.on = false;
    if (el.classList.contains('kfirst') !== (this.on && shown)) el.classList.toggle('kfirst', this.on && shown);
    if (!this.on) return;
    const used = (g.firsts && g.firsts.used) || {};
    for (const r of el.querySelectorAll('.krow[data-a]')) {
      if (r.classList.contains('kdone') || used[r.dataset.a] == null) continue;
      r.classList.add('kdone');
      g.audio && g.audio.play('keyTick');
    }
  }
}
