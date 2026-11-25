// 效果页（effects.html）：按编号列出《效果清单》里的每一个效果，每条都在真实的游戏场景里单独放。
// 放一条 = 把游戏整个重置 → 按这一条的摆法快进到它开始前一点点（只算不画）→ 从那儿起正常放（可以慢放）。
// effects.html?fx=<编号> 打开就放那一条。录像（tools/fxrec.mjs）用 ?fx=<编号>&rec=1：由外面一帧一帧推。
import { FX, FX_IDS, FX_GROUPS, FX_RITUAL, fxName, fxTier } from './registry.js';
import { FX_TEXT } from './fxtext.js';
import { RECIPES, SHOW, Stager } from './recipes.js';
import { renderLog, toWav } from '../audio/audio.js';
import { CssClock } from '../ui/cssclock.js';

const DT = 1 / 30;
let rngState = 1;
function rnd() {
  rngState = (rngState + 0x6d2b79f5) >>> 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

const SEE = { F03: 'C03', F04: 'C07', F08: 'C10', F10: 'C15' };

export class EffectsPage {
  static seed(s) {
    rngState = s >>> 0;
    Math.random = rnd;
  }

  constructor(game, q) {
    this.g = game;
    this.rec = q.get('rec') === '1';
    this.external = this.rec;
    this.speed = 1;
    this.muted = false;
    this.cur = null;
    this.css = new CssClock();
    this.want = q.get('fx');
    if (!this.rec) this.buildSide();
    else { document.body.classList.add('fxrec'); if (window.__fit) window.__fit(); }
  }

  // —— 侧栏 ——
  buildSide() {
    const side = document.getElementById('fxside');
    const groups = FX_GROUPS.map(([k, t]) => {
      const ids = FX_IDS.filter((id) => id[0] === k);
      const rows = ids.map((id) => {
        const T = FX_TEXT[id] || {};
        const look = T.look || (SEE[id] ? `见 ${SEE[id]}` : '');
        const rit = FX_RITUAL.includes(id);
        return `<li data-id="${id}"${rit ? ' class="rit"' : ''}><span class="id">${id}</span><span class="nm">${fxName(id)}${T.star ? ' <i class="st">★</i>' : ''}${rit ? ' <i class="rt" title="仪式感：得到、揭开、进入、结束、第一次">仪式感</i>' : ''}</span><span class="tier t${{ 轻: 1, 中: 2, 重: 3, 最重: 4 }[fxTier(id)]}">${fxTier(id)}</span><span class="lk">${look}</span></li>`;
      }).join('');
      return `<h3>${k} · ${t}</h3><ul>${rows}</ul>`;
    }).join('');
    side.innerHTML = `
      <div class="hd"><b>沉债 · 效果单</b><span>${FX_IDS.length} 个效果，每条在真实场景里单独放；标「仪式感」的 ${FX_RITUAL.length} 条是得到、揭开、进入、结束、第一次那一刻</span></div>
      <div class="ctl">
        <button class="pl" title="放 / 重播（R）">⟲ 重播</button>
        <span class="sp"><button data-s="1" class="on">1×</button><button data-s="0.5">½×</button><button data-s="0.25">¼×</button></span>
        <button class="snd on" title="声音（M）">声音 开</button>
        <button class="rf" title="只列出标了仪式感的（地址加 ?ritual=1 也行）">只看仪式感</button>
      </div>
      <div class="now"><div class="ti">点左边任意一条开始</div><div class="wh"></div><div class="tl"></div></div>
      <div class="list">${groups}</div>`;
    side.querySelectorAll('li').forEach((li) => li.addEventListener('click', () => this.play(li.dataset.id, true)));
    side.querySelector('.pl').addEventListener('click', () => this.cur && this.play(this.cur.id, true));
    side.querySelectorAll('.sp button').forEach((b) => b.addEventListener('click', () => {
      this.speed = Number(b.dataset.s);
      side.querySelectorAll('.sp button').forEach((x) => x.classList.toggle('on', x === b));
    }));
    const rf = side.querySelector('.rf');
    const ritOnly = (on) => { side.classList.toggle('ritonly', on); rf.classList.toggle('on', on); };
    rf.addEventListener('click', () => ritOnly(!side.classList.contains('ritonly')));
    if (new URLSearchParams(location.search).get('ritual')) ritOnly(true);
    const snd = side.querySelector('.snd');
    snd.addEventListener('click', () => this.setMuted(!this.muted));
    this.sndBtn = snd;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' && this.cur) this.play(this.cur.id, true);
      if (e.code === 'KeyM') this.setMuted(!this.muted);
    });
    this.side = side;
  }

  setMuted(m) {
    this.muted = m;
    this.g.audio.unlock();
    this.g.audio.setMuted(m);
    if (this.sndBtn) { this.sndBtn.textContent = m ? '声音 关' : '声音 开'; this.sndBtn.classList.toggle('on', !m); }
  }

  boot() {
    if (this.want && RECIPES[this.want]) this.play(this.want, false);
    else if (!this.rec) this.play('G01', false);
  }

  // —— 放一条 ——
  play(id, user) {
    const g = this.g;
    const R = RECIPES[id];
    if (!R) return;
    if (user) g.audio.unlock();
    rngState = hash(id) ^ 20261016;
    g.resetAll();
    g.camAt = null;
    g.cam.minDist = 13;
    g.audio.setMuted(this.muted);
    const S = new Stager(g, this);
    const gen = R(S);
    // 快进到效果开始前：只算不画
    g.noDraw = true;
    g.audio.silent = true;
    S.dt = DT;
    S.fast = true;
    let guard = 0;
    for (;;) {
      const r = gen.next();
      if (r.done || r.value === SHOW) { if (r.done) S.ended = true; break; }
      g.frame(DT);
      // 界面上的 CSS 动画在快进时也按游戏时间走：正片开头每个动画正好停在它该在的地方（走完的走完，走到一半的接着走）
      this.tickAnims(DT);
      if (++guard > 30 * 300) break;
    }
    g.noDraw = false;
    g.audio.silent = false;
    S.fast = false;
    this.cur = { id, gen, S, t: 0, phase: S.ended ? 'done' : 'show', cues: [] };
    g.onCue = (cid) => { if (this.cur) this.cur.cues.push({ id: cid, t: +this.cur.t.toFixed(2) }); };
    if (this.rec) g.audio.startRec();
    this.showNow(id);
  }

  showNow(id) {
    if (!this.side) return;
    this.side.querySelectorAll('li').forEach((li) => li.classList.toggle('on', li.dataset.id === id));
    const li = this.side.querySelector(`li[data-id="${id}"]`);
    if (li) li.scrollIntoView({ block: 'nearest' });
    const T = FX_TEXT[id] || {};
    this.side.querySelector('.now .ti').innerHTML = `<b>${id}</b> ${fxName(id)} <span class="tier t${{ 轻: 1, 中: 2, 重: 3, 最重: 4 }[fxTier(id)]}">${fxTier(id)}</span>`;
    this.side.querySelector('.now .wh').textContent = T.when ? `什么时候：${T.when}` : (SEE[id] ? `见 ${SEE[id]}（第一次就是它）` : '');
    history.replaceState(null, '', `?fx=${id}`);
  }

  // 一帧
  step(dt) {
    const C = this.cur;
    const g = this.g;
    if (C && C.phase === 'show') {
      C.S.dt = dt;
      const r = C.gen.next();
      if (r.done) { C.phase = 'done'; C.S.release(); }
    }
    g.frame(dt);
    if (C) C.t += dt;
    this.tickAnims(dt);
    if (this.side && C && (!this.tlT || C.t - this.tlT > 0.1)) {
      this.tlT = C.t;
      this.side.querySelector('.now .tl').textContent = `${C.t.toFixed(1)} 秒${C.phase === 'done' ? ' · 放完了（可以接着自己玩，R 重播）' : ''}`;
    }
    return { done: !C || C.phase === 'done', t: C ? C.t : 0 };
  }

  tick(dt) {
    this.step(dt * this.speed);
  }

  // 界面上的 CSS 动画跟着游戏时间走（慢放、逐帧录像时不会自己跑快）：和试跑的快钟同一份
  tickAnims(dt) {
    this.css.tick(dt);
  }

  // —— 录像用 ——
  cues() {
    return this.cur ? this.cur.cues : [];
  }

  async wav() {
    const log = this.g.audio.stopRec() || [];
    const dur = Math.max(0.5, this.cur ? this.cur.t : 1);
    const buf = await renderLog(log, dur);
    const bytes = new Uint8Array(toWav(buf));
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return { b64: btoa(s), n: log.length };
  }
}

export { FX };
