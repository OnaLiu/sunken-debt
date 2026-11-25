// F6 第一件珍品：S1 一整套照旧（C4–C9）；余波快走完时，下面那条宽黑边里升起一条“收获单”——
// 这一趟已经捞上来的几样暗暗地排在前面，最后一格是空着的金框，一亮一亮地等着；
// 名字牌上落下一枚金签，划一道弧掉进去，这一格才亮成金色、写上它的名字和价钱（叮当一声，火星溅开）。
// 第一件才有这一条：展示多停 0.9 秒给它；以后的珍品照常（收获单上它照样是金色的那一行）。
// 时间全按揭晓的游戏时间走（慢放、暂停跟着），黑边收起时它跟着沉下去。
import { fxTag } from '../fx/tags.js';

const T = { up: 1.45, upDur: 0.42, open: 1.72, fly: 2.3, flyDur: 0.66, extra: 0.9 };
const ease = (u) => 1 - Math.pow(1 - u, 3);
const back = (u) => { const c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const fmt = (v) => Math.round(v).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export class GoldSlot {
  constructor(g, L) { this.g = g; this.L = L; this.R = null; this.skip = null; this.el = null; }
  update() {
    const g = this.g, R = g.reveal.active;
    if (this.R && R !== this.R) { this.end(); return; }
    if (!this.R) {
      if (!R || !R.precious || R.phase !== 'show' || R === this.skip) return;
      if (!this.L.notes || !g.hud || !this.L.first('F6')) { this.skip = R; return; }
      this.start(R);
    }
    this.tick();
  }
  start(R) {
    const g = this.g;
    this.R = R; this.st = {};
    R.showDur += T.extra;
    // 这一网以前捞上来的（同名的并成一格），最多摆四格，多的写“+n”
    const now = new Set((R.entries || []).map((e) => e.rec && e.rec.id).filter(Boolean));
    const m = new Map();
    for (const it of g.trip.items) { if (now.has(it.id)) continue; const k = it.name; const o = m.get(k) || { name: k, n: 0, precious: it.precious }; o.n++; m.set(k, o); }
    const gs = [...m.values()], show = gs.slice(0, 4), more = gs.slice(4).reduce((a, o) => a + o.n, 0);
    const chips = show.map((o) => `<span class="gs-c">${esc(o.name)}${o.n > 1 ? `<em>×${o.n}</em>` : ''}</span>`).join('') + (more ? `<span class="gs-c more">+${more}</span>` : '');
    const main = R.main, it = main && main.it;
    this.name = it ? it.name : (main && main.cr && main.cr.name) || '';
    this.value = main && main.rec ? main.rec.value : it ? it.value : 0;
    const el = this.el = document.createElement('div');
    el.className = 'goldslot';
    el.innerHTML = `<div class="gs-row"><span class="gs-h">收获单</span>${chips || '<span class="gs-c none">还空着</span>'}<span class="gs-slot"><i class="gs-d"></i><span class="gs-nm">${esc(this.name)}</span><span class="gs-v">${fmt(this.value)}</span></span></div>`;
    this.L.notes.el.appendChild(el);
    this.slot = el.querySelector('.gs-slot');
    this.tok = document.createElement('div');
    this.tok.className = 'gs-tok'; this.tok.textContent = this.name; this.tok.style.opacity = '0';
    this.L.notes.el.appendChild(this.tok);
    this.tick();
  }
  end() {
    if (this.el) this.el.remove();
    if (this.tok) this.tok.remove();
    this.el = this.tok = this.R = null;
  }
  tick() {
    const g = this.g, R = this.R, S = this.st, H = g.hud;
    const t = R.phase === 'show' ? R.t : R.phase === 'pull' ? R.showDur + R.t : 0;
    // 升起来（跟着黑边那条边），拉回时沉下去
    const up = ease(Math.min(1, Math.max(0, (t - T.up) / T.upDur)));
    const down = R.phase === 'pull' ? ease(Math.min(1, R.t / 0.45)) : 0;
    this.el.style.transform = `translate(-50%, ${((1 - back(up) + down) * 104).toFixed(1)}px)`;
    this.el.style.opacity = (Math.min(1, up * 3) * (1 - down)).toFixed(3);
    // 空位亮起来：金色的虚框一亮一亮
    if (t >= T.open && !S.open) {
      S.open = true; this.slot.classList.add('open');
      g.audio && g.audio.play('slotOpen');
      fxTag('F6', '第一件珍品·收获单上亮出金色空位', 'F6');
    }
    if (S.open && !S.filled) this.slot.style.setProperty('--glow', (0.55 + 0.45 * Math.sin((t - T.open) * 7.5)).toFixed(3));
    // 金签：从名字牌上落下，划一道弧掉进空位
    const u = (t - T.fly) / T.flyDur;
    if (u >= 0 && u < 1 && !S.filled) {
      if (!S.from) {
        const nm = H.el.reveal && H.el.reveal.querySelector('.name');
        const r = nm ? H.stageRect(nm) : { x: 1300, y: 470, w: 300, h: 60 };
        S.from = { x: r.x + Math.min(r.w, 300) / 2, y: r.y + r.h / 2 };
      }
      const r2 = H.stageRect(this.slot), to = { x: r2.x + r2.w / 2, y: r2.y + r2.h / 2 };
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const cx = (S.from.x + to.x) / 2 + 60, cy = Math.min(S.from.y, to.y) - 120;
      const w = 1 - e, x = w * w * S.from.x + 2 * w * e * cx + e * e * to.x, y = w * w * S.from.y + 2 * w * e * cy + e * e * to.y;
      const sc = u < 0.15 ? 0.7 + u / 0.15 * 0.5 : 1.2 - (u - 0.15) / 0.85 * 0.3;
      this.tok.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${sc.toFixed(3)}) rotate(${((1 - u) * -8).toFixed(1)}deg)`;
      this.tok.style.opacity = Math.min(1, u / 0.1).toFixed(3);
    } else this.tok.style.opacity = '0';
    // 落进去：这一格亮成金色，写上名字和价钱
    if (u >= 1 && !S.filled) {
      S.filled = true;
      this.slot.classList.add('filled'); this.slot.style.removeProperty('--glow');
      const r2 = H.stageRect(this.slot);
      H.sparks && H.sparks(r2.x + r2.w / 2, r2.y + r2.h / 2, 14);
      g.audio && g.audio.play('slotGold');
      fxTag('F6', '第一件珍品·金签落进空位', 'F6');
    }
    if (S.filled) this.slot.style.setProperty('--land', Math.max(0, 1 - (t - T.fly - T.flyDur) / 0.5).toFixed(3));
  }
}
