// 收获单（C11，标志时刻 S4）。按游戏时间一拍一拍放：慢放跟着慢，暂停时停住；每一拍的声音也在这里放（晚了 0.2 秒以上的不补）。
// 预兆在船上（game/settle.js：船员停下手里的事、一个接一个转身看镜头，镜头退到告别的位置，船在画面右边）。之后：
//   暗幕从上往下落（左边更暗，收获单在左边，船和人在右边还看得见）
//   憋住：单子升起，一行一行滑进来，每行“嗒”一下、越往下越高；珍品那一行前停半拍，进来时一道金光扫过
//   爆发：总价从 0 滚上去（咔哒越来越慢），滚到头盖一个朱红的章——满载 / 油尽 / 收工，单子往下一顿，溅几点印泥
//   余波：珍品那行的金菱形再亮一次
//   余韵：“再来一次”慢慢亮起，不跳不催。亮起来以前按 Ⓐ（或点单子）= 直接跳到盖章；亮了以后再按才是再来一次
const fmt = (n) => Math.round(n).toLocaleString('zh-CN');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 拍子（游戏秒）。veil：船上那一下（C12）做完以后暗幕才落下——捞完、没油都要先看完船上的事，中途收工很快
export const HAUL = {
  veil: { done: 1.35, fuel: 1.5, quit: 0.7 },
  veilDur: 0.5, rise: 0.3, riseDur: 0.45,
  row: 0.17, rowDur: 0.32, goldWait: 0.32, preRoll: 0.24,
  gleam: 0.45, again: 0.9, againDur: 1.2, ready: 0.35,
  late: 0.2,        // 补放时晚了这么多秒以上的声音就不放了
};
const SEAL = { done: '满载', fuel: '油尽', quit: '收工' };
const WHY = { done: '这一处能下的网都下过了', fuel: '油不够再下一网了', quit: '提前收工' };

// 同名的合并：铜信筒 ×2（价值相加）；超过 9 组时 8 行加一行“+N”
export function haulRows(items) {
  const m = new Map();
  for (const it of items) {
    const k = it.name + (it.live ? '#live' : '');
    let gp = m.get(k);
    if (!gp) { gp = { name: it.name, live: it.live, precious: it.precious, n: 0, value: 0 }; m.set(k, gp); }
    gp.n++; gp.value += it.value; if (it.precious) gp.precious = true;
  }
  const gs = [...m.values()];
  if (gs.length <= 9) return gs;
  const rest = gs.slice(8);
  return gs.slice(0, 8).concat([{ name: '+' + rest.reduce((a, g) => a + g.n, 0), rest: true, n: 1, value: rest.reduce((a, g) => a + g.value, 0) }]);
}

// 这一张单子的拍子：每一行什么时候进来、总价什么时候开始滚、什么时候盖章、“再来一次”什么时候亮、什么时候能按
export function haulPlan(why, items, total) {
  const rows = haulRows(items), H = HAUL;
  const veil = H.veil[why] ?? H.veil.quit, sheet = veil + H.rise;
  let t = sheet + H.riseDur - 0.12;
  const at = (rows.length ? rows : [{ none: true }]).map((r) => { if (r.precious) t += H.goldWait; const a = t; t += H.row; return a; });
  const roll = at[at.length - 1] + H.rowDur + H.preRoll;
  const rollDur = total > 0 ? clamp(0.75 + Math.log10(total + 1) * 0.11, 0.8, 1.25) : 0.3;
  const stamp = roll + rollDur;
  return { why, veil, sheet, rows: at, tot: at[at.length - 1] + H.rowDur * 0.6, roll, rollDur, stamp, gleam: rows.some((r) => r.precious) ? stamp + H.gleam : null, again: stamp + H.again, ready: stamp + H.again + H.ready };
}
// 按了跳过：直接到盖章前一点（章照样砸下来、有声音），之后的几拍收紧
export function skipPlan(P) {
  return { ...P, skipped: true, gleam: P.gleam != null ? P.stamp + 0.3 : null, again: P.stamp + 0.4, ready: P.stamp + 0.55 };
}

export class HaulSheet {
  constructor(root) { this.root = root; this.P = null; }
  // r：{ why, items, total }；P：haulPlan；o：{ coin（金币图标）, key（Ⓐ 的键帽） }
  show(r, P, o) {
    P = P || haulPlan(r.why, r.items, r.total);
    const rows = haulRows(r.items);
    const li = rows.map((g, i) => `<li class="${g.precious ? 'p' : ''}${g.rest ? ' none' : ''}" data-i="${i}"><span class="nm">${g.name}${g.n > 1 ? ` <em>×${g.n}</em>` : ''}</span><i>${fmt(g.value)}</i></li>`).join('')
      || '<li class="none" data-i="0"><span class="nm">这一趟什么也没捞上</span></li>';
    this.root.className = 'modal haul ' + (r.why || 'quit');
    this.root.innerHTML = `<div class="hveil"></div><div class="pcard">
      <div class="mh">收获单</div>
      <div class="hwhy">${WHY[r.why] || ''}</div>
      <ul class="plist">${li}</ul>
      <div class="pl tot">${o.coin}<b>0</b></div>
      <div class="hseal"><span>${SEAL[r.why] || SEAL.quit}</span><i></i><i></i><i></i><i></i></div>
      <button class="pbtn sel" data-a="again">${o.key} 再来一次</button></div>`;
    this.P = P; this.total = r.total; this.done = new Set(); this.shown = -1; this.u = -1;
    this.lis = [...this.root.querySelectorAll('.plist li')];
    this.num = this.root.querySelector('.pl.tot b');
  }
  hide() { this.P = null; }
  // 这一拍到了没有：到了就做一次（late：这一拍已经过去多久——补放时太晚的声音不放）
  beat(k, t, u, fn) { if (t == null || u < t || this.done.has(k)) return; this.done.add(k); fn(u - t); }
  update(u, P, audio) {
    if (!this.P) return;
    P = this.P = P || this.P;
    const R = this.root, H = HAUL, snd = (late, name, o) => { if (audio && late < H.late) audio.play(name, o); };
    const on = (c) => R.classList.add(c);
    this.beat('veil', P.veil, u, () => on('v'));
    this.beat('sheet', P.sheet, u, (l) => { on('s'); snd(l, 'haulSheet'); });
    P.rows.forEach((t, i) => this.beat('r' + i, t, u, (l) => {
      const el = this.lis[i]; if (!el) return;
      el.classList.add('in');
      snd(l, el.classList.contains('p') ? 'haulRowGold' : 'haulRow', { i });
    }));
    this.beat('tot', P.tot, u, () => on('t'));
    this.beat('roll', P.roll, u, (l) => { on('roll'); if (this.total > 0) snd(l, 'haulRoll', { dur: P.rollDur - l, n: clamp(Math.round(8 + Math.log10(this.total + 1) * 3), 10, 22) }); });
    this.beat('stamp', P.stamp, u, (l) => { R.classList.remove('roll'); on('stamped'); snd(l, 'haulStamp', { why: P.why }); });
    this.beat('gleam', P.gleam, u, (l) => { on('gleam'); snd(l, 'haulGleam'); });
    this.beat('again', P.again, u, () => on('lit'));
    this.beat('ready', P.ready, u, () => on('ready'));
    if (P.skipped) on('skip');
    // 总价：盖章以前从 0 往上滚（开头快、越滚越慢），盖章那一刻落在总数上
    const k = u >= P.stamp ? 1 : u <= P.roll ? 0 : (u - P.roll) / P.rollDur;
    const v = Math.round(this.total * (1 - Math.pow(1 - k, 3)));
    if (v !== this.shown) { this.shown = v; this.num.textContent = fmt(v); }
    this.u = u;
  }
}
