// 标题这一侧的开场（第十四批）：G1 打开游戏、G2 标题上下选、G3 按“开始航程”（海面那一侧在 src/game/opening.js）。
// main.js 建好 .title 以后调 build()，标题的每一帧调 frame()；全部按标题这一帧的 dt 推（效果单慢放时跟着慢）。
//   G1：从黑里起来。镜头先贴着水面看远处（海、岛、岬角废塔），4.4 秒里慢慢升高、低下头，水下的船影从水面的反光底下浮出来；
//       “沉”“债”一个接一个从水里浮上来：带着水波的扭动往上浮、越浮越清楚，字距收紧；落稳那一下一道光扫过字面，
//       下面一道金线画出去，“归潮沙湾”亮起来；按钮一个接一个滑进来；沉船那里的水面推出一圈波纹。
//       声音：字开始浮起来时一个慢慢打开的低和弦（opening）。浏览器还不让出声时，等第一下按键——那时和弦才起，字跟着亮一下、光再扫一遍（openingLate）。
//       开场还没放完就按了键：剩下的加快放完（不跳）。
//   G2：一枚铜箭头在按钮之间跳：起跳拉长、落下压扁一下；从最后一个绕回第一个时，从下面出去、从上面进来。
//       选中的按钮往右让一点、一道光扫过；鼠标滑到哪个按钮，箭头就跳到哪个（声音是 B22 的“嗒”，不在这里）。
//   G3：按下“开始航程”：按钮压下去再弹起、亮一下金光，箭头像车钟手柄一样往右推出去，别的按钮往左落下，字往上散开；
//       镜头朝水面扎下去；车钟“叮叮”、汽笛长鸣（depart），环境声收下去，黑场就在汽笛声里过去。
import { fxTag } from '../fx/tags.js';

const CHARS = ['沉', '债'];
const INTRO = 2.8;   // 字、线、按钮放完（镜头还要再走一会儿）
const CAM_T = 4.4;   // 镜头从贴着水面到平常的高度
const CX = 296, CZ = 26, A0 = 0.3; // 沉船湾（标题背景绕着它转）
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease3 = (u) => 1 - Math.pow(1 - u, 3);
const smooth = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const backOut = (u, s = 1.5) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);

export class TitleFx {
  constructor(audio) { this.audio = audio; this.el = null; }

  // —— G1：换上开场用的字、金线、箭头，从头放 ——
  build(el) {
    this.el = el;
    el.classList.add('g14');
    el.insertAdjacentHTML('afterbegin', `<svg class="t-svg" width="0" height="0" aria-hidden="true"><filter id="g1surf" x="-25%" y="-35%" width="150%" height="170%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.06" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg><div class="t-veil"></div>`);
    const h1 = el.querySelector('h1');
    h1.setAttribute('aria-label', h1.textContent);
    h1.innerHTML = CHARS.map((c) => `<span class="tc">${c}</span>`).join('');
    h1.insertAdjacentHTML('afterend', '<div class="t-sub"><i class="t-rule"></i><span>归潮沙湾</span></div>');
    const menu = el.querySelector('.title-menu');
    menu.insertAdjacentHTML('afterbegin', '<i class="t-ptr"><b></b></i>');
    this.r = {
      veil: el.querySelector('.t-veil'), h1, chars: [...h1.querySelectorAll('.tc')], rule: el.querySelector('.t-rule'), sub: el.querySelector('.t-sub span'),
      menu, btns: [...menu.querySelectorAll('button')], ptr: menu.querySelector('.t-ptr'),
      turb: el.querySelector('feTurbulence'), disp: el.querySelector('feDisplacementMap'),
    };
    this.T = 0; this.rate = 1; this.age = 0;
    this.chord = 'wait'; this.breath = -9; this.sheens = [1.75]; this.lock = false; this.force = false;
    this.dep = null; this.ptrAt = null; this.ripples = [0.55, 1.5];
    // 鼠标滑到哪个按钮，就选中哪个（main.js 接 onHover：和键盘选的是同一个“选中”）
    menu.addEventListener('pointerover', (e) => {
      const b = e.target.closest && e.target.closest('button'); if (!b || this.dep) return;
      const i = this.r.btns.indexOf(b);
      if (i >= 0 && i !== Number(el.dataset.sel || 0) && this.onHover) this.onHover(i);
    });
    // 能出声就先把声音开起来（浏览器不让就挂着，等第一下按键）：开场的和弦和海浪声能和画面一起起
    try { this.audio.start(); } catch (e) { /* 没有声音也能玩 */ }
    this.paint();
    fxTag('G1', '标题亮相', 'G1');
  }
  // 标题上按了键（main.js 每次有输入都调）：浏览器从这一下起肯出声了；开场还没放完的话，剩下的 5 倍速放完
  skip() { this.lock = false; if (this.el && !this.dep && this.T < INTRO) this.rate = 5; }

  // 标题的每一帧（main.js 的 titleFrame）
  frame(dt, g, view) {
    if (!this.el) return;
    this.age += dt;
    this.T += dt * this.rate;
    if (this.T >= INTRO + 1.6) this.rate = 1;
    this.cueChord();
    // 沉船那里的水面推出一圈波纹（字浮起来的时候）
    while (this.ripples.length && this.T >= this.ripples[0]) { this.ripples.shift(); g && g.ripples && g.ripples.add(CX, CZ, { amp: 0.85, speed: 3.6, life: 7, r0: 5 }); }
    if (g && g.ripples) g.ripples.update(dt);
    if (this.dep) this.dep.t += dt;
    this.paint();
    this.camera(view);
  }
  // 和弦：字开始浮起时起；那时浏览器还不让出声，就等到能出声（第一下按键）再起，字跟着亮一下
  cueChord() {
    if (this.chord === 'done' || this.dep) return;
    // lock：当作浏览器还不让出声（效果单演示“第一下按键时和弦才起”用），有一下输入就解开
    // force：效果单里照时起（声音还没开就先不响，点“开声音”以后从头重放）
    const A = this.audio, on = !this.lock && !!(A.ctx && (this.force || A.ctx.state === 'running') && !A.paused);
    if (this.chord === 'wait' && this.T >= 0.45) {
      if (on) { this.playChord('opening'); return; }
      this.chord = 'late';
    }
    if (this.chord === 'late' && on) { this.playChord('openingLate'); this.breath = this.T; this.sheens.push(this.T + 0.15); }
  }
  playChord(name) {
    this.chord = 'done';
    this.audio.play(name);
    // 配乐的下一个和弦让开这一个（约 8 秒）
    if (this.audio.music) this.audio.music.next = Math.max(this.audio.music.next, 8.5);
    fxTag('G1', name === 'opening' ? '标题亮相·起头的低和弦' : '标题亮相·第一下按键，和弦才起', 'G1');
  }

  // 镜头：一开始贴着水面看远处，慢慢升起来、低下头（沉船从反光底下浮出来）；按了“开始航程”朝水面扎下去
  camera(view) {
    const k = smooth(clamp((this.T - 0.15) / CAM_T, 0, 1));
    let r = 70 + (46 - 70) * k, h = 9 + (22 - 9) * k, ly = 2 + (-8 - 2) * k;
    if (this.dep) { const d = Math.pow(clamp(this.dep.t / 0.62, 0, 1), 2.2); r *= 1 - 0.42 * d; h -= 9 * d; ly -= 5 * d; }
    const a = A0 + this.age * 0.05; // 从看得见岛和废塔的那一边起，慢慢绕着沉船湾转
    view.camera.position.set(CX + Math.sin(a) * r, h, CZ + Math.cos(a) * r);
    view.camera.lookAt(CX, ly, CZ);
    view.focus.set(CX, -8, CZ);
  }

  // 每一帧把开场（和按下“开始航程”以后）的样子写到字、线、按钮上
  paint() {
    const R = this.r, T = this.T;
    if (!R) return;
    // 黑场退开
    R.veil.style.opacity = (1 - ease3(clamp(T / 1.1, 0, 1))).toFixed(3);
    // 字：从水里浮上来（位移、透明、水波的扭动），字距收紧
    const dep = this.dep ? this.dep.t : -1;
    let wob = 0;
    R.chars.forEach((c, i) => {
      const u = clamp((T - 0.5 - i * 0.22) / 1.15, 0, 1), e = ease3(u);
      wob = Math.max(wob, Math.pow(1 - e, 1.4));
      let y = 46 * (1 - e), op = clamp(u * 1.7, 0, 1);
      if (dep >= 0) { const v = clamp((dep - 0.05 - i * 0.06) / 0.42, 0, 1), ev = v * v; y -= 38 * ev; op *= 1 - v; }
      c.style.transform = `translateY(${y.toFixed(1)}px)`;
      c.style.opacity = op.toFixed(3);
      // 光扫过字面
      let sh = 160;
      for (const s0 of this.sheens) { const q = (T - s0 - i * 0.12) / 0.62; if (q > 0 && q < 1) sh = 160 - 220 * ease3(q); }
      c.style.backgroundPosition = `${sh.toFixed(1)}% 0, 0 0`;
      // 第一下按键才起和弦：字亮一下
      const b = T - this.breath, br = b > 0 && b < 1.6 ? Math.sin(Math.min(1, b / 0.25) * Math.PI / 2) * Math.exp(-Math.max(0, b - 0.25) * 2.4) : 0;
      const glow = `drop-shadow(6px 6px 0 #0a1416) drop-shadow(0 0 ${(30 + 36 * br).toFixed(0)}px rgba(${br > 0 ? '255,214,120' : '120,200,190'},${(0.22 + 0.5 * br).toFixed(2)}))`;
      c.style.filter = (u < 1 ? 'url(#g1surf) ' : '') + glow;
    });
    // 水波的扭动：越浮越小，花纹一直在流
    if (wob > 0.002) {
      R.disp.setAttribute('scale', (34 * wob).toFixed(2));
      R.turb.setAttribute('baseFrequency', `${(0.011 + 0.004 * Math.sin(T * 2.1)).toFixed(4)} ${(0.06 + 0.02 * Math.sin(T * 1.3 + 1)).toFixed(4)}`);
    }
    const ls = 40 + 50 * Math.pow(1 - ease3(clamp((T - 0.5) / 1.4, 0, 1)), 1.2) + (dep >= 0 ? 34 * clamp(dep / 0.45, 0, 1) : 0);
    R.h1.style.letterSpacing = ls.toFixed(1) + 'px';
    // 金线画出去，“归潮沙湾”亮起来
    const lu = ease3(clamp((T - 1.55) / 0.7, 0, 1)), fadeOut = dep >= 0 ? 1 - clamp(dep / 0.3, 0, 1) : 1;
    R.rule.style.transform = `scaleX(${lu.toFixed(3)})`;
    R.rule.style.opacity = fadeOut.toFixed(3);
    const su = ease3(clamp((T - 1.95) / 0.75, 0, 1));
    R.sub.style.opacity = (0.86 * su * fadeOut).toFixed(3);
    R.sub.style.letterSpacing = (12 + 10 * (1 - su)).toFixed(1) + 'px';
    // 按钮一个接一个滑进来（按下“开始航程”以后：别的往左落下，它自己最后往右走掉）
    const sel = Number(this.el.dataset.sel || 0);
    R.btns.forEach((b, i) => {
      const u = clamp((T - 1.2 - i * 0.1) / 0.5, 0, 1);
      let x = -70 * (1 - backOut(u)), op = clamp(u * 2, 0, 1);
      if (dep >= 0) {
        if (b === this.dep.btn) { const v = clamp((dep - 0.34) / 0.26, 0, 1); x += 60 * v * v; op *= 1 - v; }
        else { const order = Math.abs(i - R.btns.indexOf(this.dep.btn)) - 1, v = clamp((dep - 0.06 - order * 0.045) / 0.3, 0, 1); x -= 90 * v * v; op *= 1 - v; }
      }
      b.style.transform = x ? `translateX(${x.toFixed(1)}px)` : '';
      b.style.opacity = op.toFixed(3);
    });
    // 箭头跟着选中的那个按钮进来
    const pu = clamp((T - 1.2 - sel * 0.1) / 0.5, 0, 1);
    if (!this.dep) {
      R.ptr.style.opacity = clamp(pu * 2 - 0.4, 0, 1).toFixed(3);
      R.ptr.style.translate = `${(-70 * (1 - backOut(pu))).toFixed(1)}px 0`;
    }
    if (this.ptrAt == null && R.btns[sel] && R.btns[sel].offsetHeight) this.placePtr(sel);
  }

  // —— G2：箭头跳到第 i 个按钮 ——
  ptrY(i) { const b = this.r.btns[i]; return b.offsetTop + b.offsetHeight / 2 - 12; }
  placePtr(i) { this.ptrAt = i; this.r.ptr.style.transform = `translateY(${this.ptrY(i)}px)`; }
  // how：'key' 键盘/手柄、'mouse' 鼠标滑过（main.js 的 menuSel 调）
  select(i, how = 'key') {
    if (!this.el || !this.r) return;
    const R = this.r, from = this.ptrAt;
    const b = R.btns[i]; if (!b || !b.offsetHeight) return;
    // 选中的按钮：往右让一点（CSS），一道光扫过
    b.classList.remove('g2glint'); void b.offsetWidth; b.classList.add('g2glint');
    if (from == null || from === i) { this.placePtr(i); return; }
    const p = R.ptr, y1 = this.ptrY(i);
    // 从现在的位置起跳（上一跳还没落地也接得上）
    const m = new DOMMatrixReadOnly(getComputedStyle(p).transform);
    const y0 = m.f;
    const n = R.btns.length, wrap = Math.abs(i - from) > 1 && (i === 0 || i === n - 1) && (from === 0 || from === n - 1);
    if (this.ptrAnim) this.ptrAnim.cancel();
    let frames;
    if (wrap) {
      // 绕一圈：顺着走的方向出去，从另一头进来
      const dir = from === n - 1 ? 1 : -1;
      frames = [
        { transform: `translateY(${y0}px) scale(1, 1)`, opacity: 1 },
        { transform: `translateY(${y0 + dir * 34}px) scale(0.8, 1.3)`, opacity: 0, offset: 0.38 },
        { transform: `translateY(${y1 - dir * 34}px) scale(0.8, 1.3)`, opacity: 0, offset: 0.42 },
        { transform: `translateY(${y1}px) scale(1.3, 0.75)`, opacity: 1, offset: 0.82 },
        { transform: `translateY(${y1}px) scale(1, 1)`, opacity: 1 },
      ];
    } else {
      frames = [
        { transform: `translateY(${y0}px) translateX(0px) scale(1, 1)` },
        { transform: `translateY(${(y0 + y1) / 2}px) translateX(-9px) scale(0.78, 1.32)`, offset: 0.45 },
        { transform: `translateY(${y1}px) translateX(0px) scale(1.32, 0.74)`, offset: 0.78 },
        { transform: `translateY(${y1}px) translateX(0px) scale(1, 1)` },
      ];
    }
    this.ptrAnim = p.animate(frames, { duration: wrap ? 230 : 175, easing: 'cubic-bezier(.25,.8,.3,1)' });
    p.style.transform = `translateY(${y1}px)`;
    this.ptrAt = i;
    fxTag('G2', how === 'mouse' ? '标题选择·箭头跟着鼠标跳' : wrap ? '标题上下选·箭头绕回来' : '标题上下选·箭头跟着跳', 'G2');
  }

  // —— G3：按下“开始航程” ——
  depart(btn) {
    if (!this.el || this.dep) return false;
    this.dep = { t: 0, btn };
    this.rate = this.T < INTRO ? 8 : 1; // 开场还没放完就按了：剩下的一下子放完
    btn.classList.add('g3go');
    // 箭头像车钟手柄一样往右推出去
    const p = this.r.ptr;
    if (this.ptrAnim) this.ptrAnim.cancel();
    const y = this.ptrAt != null ? this.ptrY(this.ptrAt) : 0;
    this.ptrAnim = p.animate([
      { transform: `translateY(${y}px) translateX(0px) scale(1, 1)`, opacity: 1 },
      { transform: `translateY(${y}px) translateX(-14px) scale(1.25, 0.8)`, opacity: 1, offset: 0.25 },
      { transform: `translateY(${y}px) translateX(640px) scale(1.6, 0.6)`, opacity: 0 },
    ], { duration: 520, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
    // 声音：车钟“叮叮”、汽笛；环境声收下去（海面亮起时再起来，见 opening.js）
    const A = this.audio;
    try { A.start(); } catch (e) { /* 没有声音也能玩 */ }
    A.play('depart');
    A.hush && A.hush(0.5);
    fxTag('G3', '开始航程·车钟、汽笛', 'G3|go');
    return true;
  }
  get departing() { return !!this.dep; }
  clear() { if (this.ptrAnim) this.ptrAnim.cancel(); this.el = null; this.r = null; this.dep = null; }
}
