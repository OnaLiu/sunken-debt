import { SOUNDS } from './audio-precious.js';
import { SOUNDS as SETTLE } from './audio-settle.js';
import { SOUNDS as UI } from './audio-ui.js';
import { buildAmbient, snapAmbient, updateAmbient, AMBIENT } from './audio-ambient.js';
import './audio-firsts.js'; // 第一次（F1–F5）的几声，并进 SOUNDS
import { OPENING } from './audio-opening.js';
// 声音全部程序生成：海浪底噪、引擎、吊臂电机、入水、放绳、测深“嘀”、触底闷响、缆绳绷直、绞车、出水泄水、冲洗、甲板落包、揭宝和弦、收获单
// “环境底”（海浪、发动机、吊臂、配乐、冲洗和绞车的循环、心跳）走 bed 一条总线：珍品确认前能把它整条抽空（hush），
// 只剩一滴水；签名声、和弦这些一下一下的声音不走它。
// 珍品一串（起吊吃力、露头、欢呼、船钟）的声音在 audio-precious.js，play 先查那里。
// rate：慢放（效果单里 0.25×）时一下一下的声音按比例拉长，音高不变——画面和声音照样对得上。
// 锯齿波过一道很窄的门：只在最高的那一点点出一个脉冲（绞车卡爪一下下的“咔”）
const PULSE = (() => { const a = new Float32Array(256); for (let i = 0; i < 256; i++) a[i] = i / 255 * 2 - 1 > 0.82 ? 1 : 0; return a; })();

export class Audio {
  constructor() {
    this.ctx = null; this.vol = 0.8; this.loops = {}; this.paused = false; this.rate = 1;
    // 配乐的节拍不等声音开起来：没开声音时和弦照样按时“吹过”（画面上的风跟着它，A3），只是听不见
    this.music = { next: 2, i: 0, chordN: 0, chordI: 0 };
  }
  // 慢放：只拉长时值（起音、衰减、延迟），不改音高
  setRate(r) { this.rate = Math.max(0.05, r || 1); }
  T(s) { return s / this.rate; }
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.vol; this.master.connect(c.destination);
    this.comp = c.createDynamicsCompressor(); this.comp.connect(this.master);
    this.out = c.createGain();
    // 暂停（D2）：所有声音过一道低通，暂停时它往下一关、整个世界闷下去再停住；继续时再打开。界面自己的几声走 dry，不被闷住
    this.hold = c.createBiquadFilter(); this.hold.type = 'lowpass'; this.hold.frequency.value = 20000; this.hold.Q.value = 0.5;
    this.holdG = c.createGain(); this.out.connect(this.hold); this.hold.connect(this.holdG); this.holdG.connect(this.comp);
    this.dry = c.createGain(); this.dry.connect(this.comp);
    this.bed = c.createGain(); this.bed.connect(this.out);
    // 白噪与褐噪缓冲
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    let last = 0;
    this.brown = c.createBuffer(1, len, c.sampleRate);
    const bd = this.brown.getChannelData(0);
    for (let i = 0; i < len; i++) { d[i] = Math.random() * 2 - 1; last = (last + 0.02 * d[i]) / 1.02; bd[i] = last * 3.5; }
    // 海浪、引擎、吊臂电机、配乐总线（第十一批 A2、A3，audio-ambient.js）
    buildAmbient(this);
  }
  // 抽声：环境底在 fade 秒内收到几乎听不见（珍品确认前 0.4 秒）
  hush(fade = 0.14) {
    if (!this.ctx) return;
    const g = this.bed.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t); g.exponentialRampToValueAtTime(0.02, t + this.T(fade));
  }
  // 放回来：delay 秒后，环境底用 dur 秒慢慢回到原样（余波里世界的声音一点点回来）
  unhush(delay = 0, dur = 1.2) {
    if (!this.ctx) return;
    const g = this.bed.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.setValueAtTime(Math.max(0.0001, g.value), t + this.T(delay)); g.exponentialRampToValueAtTime(1, t + this.T(delay + dur));
  }
  src(buf, loop) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = !!loop; return s; }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }
  setMusic(v) { this.musicVol = v; if (this.music.bus) this.music.bus.gain.value = 0.55 * v; }
  // 暂停（D2）：先响一声“嗒”，世界的声音 0.4 秒里闷下去（低通往下关、音量收到听不见），然后整个停住（挂起）；
  // 继续：接上，“嗒”一声，世界的声音从闷着的地方 0.35 秒里回来。设置开着时不挂起（拖音量要听得见，见 setAwake）
  setPaused(p) {
    if (!this.ctx) { this.paused = p; return; }
    clearTimeout(this.holdT);
    if (p) {
      if (!this.paused) this.play('pause');
      this.paused = true; this.muffle(true);
      this.holdT = setTimeout(() => { if (this.paused && !this.awake && this.ctx) this.ctx.suspend(); }, 450);
    } else {
      const was = this.paused;
      this.paused = false;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.muffle(false);
      if (was) this.play('resume');
    }
  }
  // 闷住 / 放开世界的声音（暂停用；instant：一下子回到原样，不要过渡）
  muffle(on, instant = false) {
    if (!this.ctx || !this.hold) return;
    const t = this.ctx.currentTime, f = this.hold.frequency, g = this.holdG.gain;
    f.cancelScheduledValues(t); g.cancelScheduledValues(t);
    if (instant) { f.setValueAtTime(on ? 320 : 20000, t); g.setValueAtTime(on ? 0.0001 : 1, t); return; }
    f.setValueAtTime(Math.max(40, f.value), t); g.setValueAtTime(Math.max(0.0001, g.value), t);
    if (on) { f.exponentialRampToValueAtTime(320, t + this.T(0.32)); g.exponentialRampToValueAtTime(0.0001, t + this.T(0.42)); }
    else { f.exponentialRampToValueAtTime(20000, t + this.T(0.38)); g.exponentialRampToValueAtTime(1, t + this.T(0.3)); }
  }
  // 设置开着（D3）：暂停中也不挂起，让拖音量、配乐时那一下听得见（世界的声音照样闷着）
  setAwake(on) {
    this.awake = !!on;
    if (!this.ctx) return;
    clearTimeout(this.holdT);
    if (on) { if (this.ctx.state === 'suspended') this.ctx.resume(); }
    else if (this.paused) this.holdT = setTimeout(() => { if (this.paused && !this.awake && this.ctx) this.ctx.suspend(); }, 300);
  }
  // 每帧：先记下这一帧的状态（离线重放时传进来的就是记下的那个），再按它发声（audio-ambient.js：机声、海声、电机、和弦）
  update(dt, g) {
    if (this.paused || !g) return;
    const s = g.__snap ? g : snapAmbient(this, dt, g);
    this.lastSnap = s;
    if (!this.ctx) return;
    updateAmbient(this, dt, s);
  }
  env(g, a, d, peak, t0) { const t = t0 ?? this.ctx.currentTime; a = this.T(a); d = this.T(d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  noiseBurst(freq, q, dur, peak, type = 'bandpass', delay = 0, dest = null) {
    const c = this.ctx, s = this.src(this.noise), f = c.createBiquadFilter(), g = c.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f); f.connect(g); g.connect(dest || this.out);
    const t = c.currentTime + this.T(delay);
    this.env(g, 0.01, dur, peak, t); s.start(t, Math.random()); s.stop(t + this.T(dur + 0.01) + 0.1);
    return f;
  }
  tone(freq, dur, peak, type = 'sine', delay = 0, slide = 0, dest = null) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    const t = c.currentTime + this.T(delay);
    if (slide) { o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + this.T(dur)); }
    o.connect(g); g.connect(dest || this.out);
    this.env(g, 0.015, dur, peak, t); o.start(t); o.stop(t + this.T(dur + 0.015) + 0.1);
  }
  // 一个滤波器接到总线上（不算发声体）：几声一起过它，听起来像隔着水、隔着舱板
  filt(type, freq, q = 0.7) { const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; f.connect(this.out); return f; }
  toneF(freq, dur, peak, type, delay, slide, ftype, ffreq, q = 0.7) { this.tone(freq, dur, peak, type, delay, slide, this.filt(ftype, ffreq, q)); }
  // 摆左右（-1 左 … 1 右；浏览器不支持就不摆）：几声一起过它，听得出在哪一边（不算发声体）
  pan(p = 0) { const c = this.ctx; if (!c.createStereoPanner) return this.out; const n = c.createStereoPanner(); n.pan.value = Math.max(-1, Math.min(1, p || 0)); n.connect(this.out); return n; }
  // 噪声扫过一段频率（“唰”）
  sweep(f0, f1, dur, peak, delay = 0, q = 1.6) {
    const f = this.noiseBurst(f0, q, dur, peak, 'bandpass', delay);
    const t = this.ctx.currentTime + this.T(delay);
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + this.T(dur));
  }
  // 发动机咳一声（没油收工）
  cough(delay) {
    const f = this.noiseBurst(260, 0.9, 0.16, 0.17, 'lowpass', delay);
    const t = this.ctx.currentTime + this.T(delay); f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(140, t + this.T(0.16));
    this.toneF(52, 0.14, 0.12, 'square', delay, 0.7, 'lowpass', 200);
  }
  // 船上的汽笛：两支低音一起，慢起慢收
  horn(delay, dur, peak) {
    const c = this.ctx, lp = this.filt('lowpass', 900);
    for (const f of [146.83, 220.0]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f;
      o.connect(g); g.connect(lp);
      const t = c.currentTime + this.T(delay), D = this.T(dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + this.T(0.14)); g.gain.setValueAtTime(peak, t + D - this.T(0.35)); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
      o.start(t); o.stop(t + D + 0.05);
    }
  }
  // 一阵气泡嘶嘶：高处的噪声被一个十几赫兹的颤一下下掐开
  fizz(delay, dur, peak, rate = 19, freq = 3000) {
    const c = this.ctx, s = this.src(this.noise), f = c.createBiquadFilter(), am = c.createGain(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    f.type = 'highpass'; f.frequency.value = freq; lfo.frequency.value = rate * (0.85 + Math.random() * 0.3); lg.gain.value = 0.5; am.gain.value = 0.5;
    lfo.connect(lg); lg.connect(am.gain); s.connect(f); f.connect(am); am.connect(g); g.connect(this.out);
    const t = c.currentTime + this.T(delay);
    this.env(g, 0.03, dur, peak, t); s.start(t, Math.random()); lfo.start(t);
    const end = t + this.T(dur + 0.05) + 0.1; s.stop(end); lfo.stop(end);
    return f;
  }
  // 一条按时间排好的曲线（游戏时间每 dt 秒一个值）放到参数上；慢放时一起拉长
  curve(param, vals, t, dt) {
    if (vals.length < 2) { param.setValueAtTime(vals[0] ?? param.value, t); return; }
    param.setValueCurveAtTime(Float32Array.from(vals), t, Math.max(0.02, this.T(dt * (vals.length - 1))));
  }
  // 循环声都过一个自己的总闸（out，上面不排曲线），收的时候只拉这一个闸
  loopOut() { const g = this.ctx.createGain(); g.connect(this.bed); return g; }
  stopLoop(k, tc = 0.08) {
    const w = this.loops[k]; if (!w || !this.ctx) return;
    const t = this.ctx.currentTime, g = w.out.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.setTargetAtTime(0.0001, t, this.T(tc));
    for (const s of w.srcs) { try { s.stop(t + this.T(tc) * 6 + 0.05); } catch (e) { /* 已经停了 */ } }
    this.loops[k] = null;
  }
  play(name, o = {}) {
    if (!this.ctx || (this.paused && !(UI[name] && UI[name].always))) return;
    const c = this.ctx;
    if (SOUNDS[name]) { SOUNDS[name](this, o || {}); return; } // 珍品一串的声音（audio-precious.js）
    if (SETTLE[name]) { SETTLE[name](this, o || {}); return; } // 结算的声音：空网、收工、收获单、再来一次（audio-settle.js）
    if (UI[name]) { UI[name](this, o || {}); return; }         // 界面的声音（第十批，audio-ui.js）
    if (AMBIENT[name]) { AMBIENT[name](this, o || {}); return; } // 船员干活的小声音（A5，audio-ambient.js）
    if (OPENING[name]) { OPENING[name](this, o || {}); return; } // 开场的声音（audio-opening.js，第十四批）
    switch (name) {
      case 'ui': this.tone(660, 0.08, 0.05, 'square'); this.tone(990, 0.08, 0.04, 'square', 0.06); break;
      case 'ui2': this.tone(520, 0.08, 0.05, 'square'); this.tone(390, 0.1, 0.04, 'square', 0.06); break;
      // 原来的 ui2 拆成三声：切回航行、收起结果卡（第十批挪到 audio-ui.js，偏在右边）、标题上下选（收工换成收获单自己的声音）
      case 'sail': this.noiseBurst(1700, 2.5, 0.03, 0.06, 'bandpass'); this.tone(150, 0.22, 0.05, 'triangle', 0.03, 1.5); break; // 车钟手柄“咔”地推上去，机器起一口气
      case 'nav': this.tone(1320, 0.035, 0.028, 'triangle'); this.noiseBurst(4200, 3, 0.012, 0.02, 'bandpass'); break;            // 轻轻一“嗒”
      // 原来的 deny 一声当四种用：按原因分开（按错最轻；网在忙、落点不行、油不够、前方浅滩各有各的样子）
      case 'deny': this.tone(190, 0.07, 0.06, 'triangle', 0, 0.7); this.noiseBurst(900, 1.4, 0.03, 0.03, 'lowpass'); break;     // 按了这时用不上的键：一下闷闷的“嗒”
      case 'denyBusy': this.noiseBurst(2600, 6, 0.025, 0.07); this.noiseBurst(2300, 6, 0.025, 0.06, 'bandpass', 0.09); this.tone(120, 0.12, 0.04, 'triangle'); break; // 网还在水下：绞车棘轮“咔哒、咔哒”
      case 'denyReach': this.tone(96, 0.16, 0.12, 'sine', 0, 0.8); this.noiseBurst(2200, 3, 0.05, 0.06); this.toneF(210, 0.22, 0.03, 'sawtooth', 0.02, 0.85, 'lowpass', 700); break; // 落点不行：吊臂顶到头“哐”，液压憋一下
      case 'denyFuel': this.noiseBurst(620, 9, 0.16, 0.12, 'bandpass'); this.noiseBurst(470, 9, 0.2, 0.12, 'bandpass', 0.14); this.tone(150, 0.2, 0.06, 'sine', 0, 0.7); break; // 油不够：空油桶敲两下，一声比一声空
      case 'denyShoal': this.tone(1480, 0.1, 0.05, 'sine', 0, 0.82); this.tone(1240, 0.14, 0.05, 'sine', 0.16, 0.8); this.tone(74, 0.3, 0.06, 'sine', 0.16); break; // 前方浅滩：测深仪报警“嘀——嘀”往下掉
      // 按下网（B4）：一声短哨“放！”→ 棘爪弹开“咔啷”→ 放缆：绞盘越转越快，咔哒由疏到密，网入水那一刻停（o.fall 秒后）
      case 'drop': {
        const F = Math.max(0.35, o.fall || 1.2);
        this.tone(2150, 0.1, 0.022, 'sine', 0, 1.18); this.tone(2540, 0.16, 0.02, 'sine', 0.1, 0.96);
        this.noiseBurst(2900, 6, 0.03, 0.07, 'bandpass', 0.06); this.noiseBurst(1900, 5, 0.05, 0.05, 'bandpass', 0.1); this.tone(96, 0.2, 0.08, 'sine', 0.06, 0.7);
        const t0 = c.currentTime + this.T(0.1), t1 = c.currentTime + this.T(F), up = Math.min(this.T(0.15), (t1 - t0) * 0.3);
        // 放缆的咔哒：噪声过一道往上扫的带通，被方波一开一关（慢放时咔哒也跟着变稀）
        const ns = this.src(this.noise, true), bp = c.createBiquadFilter(), am = c.createGain(), g = c.createGain();
        bp.type = 'bandpass'; bp.Q.value = 2; bp.frequency.setValueAtTime(700, t0); bp.frequency.exponentialRampToValueAtTime(1900, t1);
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'square';
        lfo.frequency.setValueAtTime(9 * this.rate, t0); lfo.frequency.exponentialRampToValueAtTime(26 * this.rate, t1);
        am.gain.value = 0.5; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
        ns.connect(bp); bp.connect(am); am.connect(g); g.connect(this.out);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.065, t0 + up); g.gain.setValueAtTime(0.065, t1 - 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.04);
        // 绞盘越转越快的嗡声
        const hm = c.createOscillator(), hf = c.createBiquadFilter(), hg = c.createGain(); hm.type = 'sawtooth';
        hm.frequency.setValueAtTime(80, t0); hm.frequency.exponentialRampToValueAtTime(170, t1);
        hf.type = 'lowpass'; hf.frequency.value = 480; hm.connect(hf); hf.connect(hg); hg.connect(this.out);
        hg.gain.setValueAtTime(0.0001, t0); hg.gain.exponentialRampToValueAtTime(0.035, t0 + up); hg.gain.setValueAtTime(0.035, t1 - 0.03); hg.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.05);
        ns.start(t0, Math.random()); ns.stop(t1 + 0.12); lfo.start(t0); lfo.stop(t1 + 0.12); hm.start(t0); hm.stop(t1 + 0.12);
        break;
      }
      // 停船、进入作业（B2）：车钟铜手柄拉到“停”——“咔、哒”；开着船时机器声往下一落、船底翻水；最后液压泵起来
      case 'work': {
        const s = Math.min(1, (o.speed || 0) / 7);
        this.noiseBurst(2500, 5, 0.025, 0.07); this.tone(1480, 0.06, 0.025, 'triangle');
        this.noiseBurst(1800, 5, 0.03, 0.06, 'bandpass', 0.1); this.tone(990, 0.14, 0.03, 'triangle', 0.1);
        if (s > 0.1) { this.toneF(70 + 50 * s, 0.6, 0.012 + 0.05 * s, 'sawtooth', 0.06, 0.5, 'lowpass', 320); this.noiseBurst(520, 0.7, 0.8, 0.075 * s, 'lowpass', 0.12); }
        this.toneF(150, 0.45, 0.022, 'sawtooth', 0.32, 1.3, 'lowpass', 800);
        break;
      }
      // 移动落点（B3）：测深绳过一格“嗒”（越深越低，很轻）；整件进了网口一下亮“叮”；红点出来闷闷一下；吊臂到位液压阀一关“咔”
      case 'aimTick': { const d = Math.min(1, (o.depth || 8) / 24); this.tone(1500 - d * 700, 0.035, 0.016, 'triangle'); this.noiseBurst(3800 - d * 1200, 4, 0.012, 0.012, 'bandpass'); break; }
      case 'aimCatch': this.tone(2093, 0.18, 0.022, 'sine'); this.tone(3136, 0.14, 0.012, 'sine', 0.035); break;
      case 'aimLow': this.tone(150, 0.16, 0.05, 'sine', 0, 0.7); this.noiseBurst(500, 1.2, 0.06, 0.025, 'lowpass'); break;
      case 'aimLock': this.noiseBurst(2900, 6, 0.022, 0.05); this.tone(420, 0.07, 0.03, 'triangle', 0.005, 0.8); break;
      // 网入水（B5）：网圈拍在水面上一下亮的“啪”，往下沉成闷的一团；水合上去“咕咚”；兜里的空气往上冒，一阵嘶嘶；溅起的水点落回来“嗒、嗒”
      case 'splash': {
        const f = this.noiseBurst(2300, 0.7, 0.55, 0.27, 'bandpass'), t = c.currentTime;
        f.frequency.setValueAtTime(2300, t); f.frequency.exponentialRampToValueAtTime(360, t + this.T(0.38));
        this.tone(240, 0.26, 0.13, 'sine', 0.07, 0.36);
        this.fizz(0.14, 1.15, 0.05);
        this.tone(1650 + Math.random() * 250, 0.05, 0.024, 'sine', 0.42, 0.55); this.tone(2150 + Math.random() * 250, 0.045, 0.017, 'sine', 0.63, 0.55);
        break;
      }
      // 网破水而出（B11）：水被网圈顶开“哗”地翻上来（越沉越闷越长），底下一声沉的“噗”；接着网眼里的水哗哗往下浇，最后几颗水点砸回水面
      case 'surface': {
        const h = o.heft ?? 0.4, t = c.currentTime;
        const f = this.noiseBurst(420, 0.6, 0.85 + 0.35 * h, 0.22, 'lowpass');
        f.frequency.setValueAtTime(380, t); f.frequency.exponentialRampToValueAtTime(2700 - 700 * h, t + this.T(0.16)); f.frequency.exponentialRampToValueAtTime(800, t + this.T(0.85 + 0.35 * h));
        this.tone(118 - 32 * h, 0.34, 0.09 + 0.07 * h, 'sine', 0, 0.6);
        const p = this.fizz(0.12, 1.0 + 0.9 * h, 0.075 + 0.035 * h, 11, 900);
        p.type = 'bandpass'; p.Q.value = 0.8; p.frequency.value = 1500 - 400 * h;
        this.tone(1400 + Math.random() * 200, 0.05, 0.02, 'sine', 0.5 + 0.5 * h, 0.6); this.tone(1900 + Math.random() * 200, 0.045, 0.015, 'sine', 0.72 + 0.6 * h, 0.6);
        break;
      }
      // 放绳（B6）：钢缆从臂端滑轮上往下走的“嗞——”，跟着网下沉的快慢（o.v：每 o.dt 秒一个速度，按下网那一刻就排好）
      case 'payout':
        if (o.on) {
          this.stopLoop('payout', 0.03);
          const v = o.v && o.v.length ? o.v : [1.2, 1.2], dt = o.dt || 0.05, t = c.currentTime;
          const out = this.loopOut(), s = this.src(this.noise, true), f = c.createBiquadFilter(), g = c.createGain(), hm = c.createOscillator(), hg = c.createGain();
          f.type = 'bandpass'; f.Q.value = 2.4; hm.type = 'triangle';
          s.connect(f); f.connect(g); g.connect(out); hm.connect(hg); hg.connect(out);
          this.curve(g.gain, v.map((x) => 0.003 + 0.016 * Math.min(1, x / 5.6)), t, dt);
          this.curve(f.frequency, v.map((x) => 520 + x * 230), t, dt);
          this.curve(hm.frequency, v.map((x) => 36 + x * 11), t, dt);
          this.curve(hg.gain, v.map((x) => 0.006 + 0.022 * Math.min(1, x / 5.6)), t, dt);
          s.start(t, Math.random()); hm.start(t);
          this.loops.payout = { out, srcs: [s, hm] };
        } else this.stopLoop('payout', 0.04);
        break;
      // 秒结（B6）：每过一个秒结，测深仪“嘀”一声，海底回一声；网离底越近，回声来得越快（o.gap），音也一下比一下高
      case 'sinkTick': {
        const n = Math.min(4, o.n || 1), hi = 1 + (4 - n) * 0.055, gap = o.gap ?? 0.15;
        this.tone(1320 * hi, 0.07, 0.042, 'sine', 0, 0.97);
        this.toneF(1320 * hi, 0.1, 0.024, 'sine', gap, 0.97, 'lowpass', 1700);
        this.noiseBurst(3400, 5, 0.012, 0.025, 'bandpass');
        break;
      }
      // 最后一下之前（B6）：网推着一团水往底下压，一股低低的水压声往上顶，触底那一下（B7）把它收掉
      case 'sinkSwell': {
        const D = this.T(Math.max(0.15, o.dur || 0.6)), t = c.currentTime;
        const s = this.src(this.brown), f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'lowpass'; f.frequency.setValueAtTime(160, t); f.frequency.exponentialRampToValueAtTime(460, t + D);
        s.connect(f); f.connect(g); g.connect(this.out);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + D); g.gain.exponentialRampToValueAtTime(0.0001, t + D + this.T(0.05));
        s.start(t, Math.random()); s.stop(t + D + this.T(0.08) + 0.05);
        break;
      }
      // 收紧（B9）：钢缆一下绷直“铮”（越沉越低），卡爪咬住“咔”，过半拍网兜离开泥，隔着水一声“啵”
      case 'taut': {
        const h = o.heft ?? 0.4, f0 = 150 - 42 * h;
        this.tone(f0, 0.42, 0.075, 'triangle', 0, 1.12); this.tone(f0 * 3.01, 0.22, 0.03, 'sine', 0, 1.06);
        this.noiseBurst(1900 - 300 * h, 5, 0.03, 0.075, 'bandpass', 0.025);
        this.toneF(80 + 20 * (1 - h), 0.2, 0.09 + 0.05 * h, 'sine', 0.3 + 0.2 * h, 1.8, 'lowpass', 320);
        break;
      }
      // 网触底：碰到的那一下（短促的闷击）+ 往下坠的身子（越深越低）+ 一点沙被挤开的沙沙声；整个隔着水，越深越闷
      case 'thump': {
        const d = Math.min(1, (o.depth || 10) / 25);
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 - d * 520; lp.Q.value = 0.7; lp.connect(this.out);
        this.noiseBurst(1100 - d * 400, 1.1, 0.045, 0.16, 'bandpass', 0, lp);
        this.tone(150 - d * 55, 0.32, 0.3, 'sine', 0, 0.42, lp);
        this.tone(62 - d * 18, 0.7, 0.26, 'sine', 0, 0.7, lp);
        this.noiseBurst(520 - d * 160, 0.9, 0.75, 0.05, 'bandpass', 0.05, lp);
        break;
      }
      // 心跳（燃油逼近）：很轻的“咚—咚”，走环境底；fast 是油不够这一网时（更紧、更亮一点）
      case 'heart': {
        const v = o.vol ?? 1, hi = o.fast ? 1 : 0;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240 + hi * 80; lp.connect(this.bed);
        const gap = o.fast ? 0.15 : 0.19;
        this.tone(78 + hi * 6, 0.13, 0.15 * v, 'sine', 0, 0.62, lp); this.tone(156 + hi * 12, 0.07, 0.045 * v, 'triangle', 0, 0.6, lp);
        this.tone(70 + hi * 6, 0.16, 0.1 * v, 'sine', gap, 0.62, lp); this.tone(140 + hi * 12, 0.08, 0.03 * v, 'triangle', gap, 0.6, lp);
        break;
      }
      // 抽空以后那一滴水：落在格栅上，“嘀”一声往下滑
      case 'drip': {
        const oc = c.createOscillator(), g2 = c.createGain(), t = c.currentTime;
        oc.type = 'sine'; oc.frequency.setValueAtTime(1650, t); oc.frequency.exponentialRampToValueAtTime(720, t + this.T(0.07));
        g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.07, t + this.T(0.006)); g2.gain.exponentialRampToValueAtTime(0.0001, t + this.T(0.16));
        oc.connect(g2); g2.connect(this.out); oc.start(t); oc.stop(t + this.T(0.2) + 0.05);
        this.noiseBurst(4200, 2.5, 0.02, 0.012, 'bandpass', 0.004);
        break;
      }
      // 绞车（B9、B10）：电机声跟着提网的快慢升起来；卡爪“咔咔咔”越转越密；网越沉，电机越低、底下那层吃力的嗡越响、抖得越厉害，咔得越慢
      // o.v：起吊时每 o.dt 秒一个速度（开始收网那一刻就排好），o.vtop：这一网最快多快
      case 'winch':
        if (o.on) {
          this.stopLoop('winch', 0.03);
          const h = o.heft ?? 0.35, v = o.v && o.v.length ? o.v : [0.8, 4.8], dt = o.dt || 0.05, top = o.vtop || 4.8, t = c.currentTime;
          const out = this.loopOut(), m = c.createOscillator(), m2 = c.createOscillator(), vib = c.createOscillator(), vg = c.createGain(), lp = c.createBiquadFilter(), mg = c.createGain(), m2g = c.createGain();
          m.type = 'sawtooth'; m2.type = 'square'; vib.frequency.value = 6.5 - 2.5 * h; vg.gain.value = 1.5 + 6 * h;
          lp.type = 'lowpass'; lp.frequency.value = 560 - 170 * h; mg.gain.value = 0.045; m2g.gain.value = 0.01 + 0.032 * h;
          vib.connect(vg); vg.connect(m.frequency); vg.connect(m2.frequency);
          const load = c.createConstantSource(); load.offset.value = 0; load.connect(m.frequency); load.connect(m2.frequency);
          m.connect(lp); m2.connect(m2g); m2g.connect(lp); lp.connect(mg); mg.connect(out);
          const ns = this.src(this.noise, true), bp = c.createBiquadFilter(), gate = c.createGain(), pulse = c.createOscillator(), shp = c.createWaveShaper(), cg = c.createGain();
          bp.type = 'bandpass'; bp.frequency.value = 2700 - 800 * h; bp.Q.value = 4; gate.gain.value = 0; pulse.type = 'sawtooth'; shp.curve = PULSE; cg.gain.value = 0.07;
          pulse.connect(shp); shp.connect(gate.gain); ns.connect(bp); bp.connect(gate); gate.connect(cg); cg.connect(out);
          const f0 = 92 - 32 * h;
          this.curve(m.frequency, v.map((x) => f0 * (1 + 0.55 * Math.min(1, x / top))), t, dt);
          this.curve(m2.frequency, v.map((x) => 0.5 * f0 * (1 + 0.55 * Math.min(1, x / top))), t, dt);
          this.curve(pulse.frequency, v.map((x) => (5 + 17 * Math.min(1, x / top)) * (1 - 0.3 * h)), t, dt);
          for (const n of [m, m2, vib, pulse, load]) n.start(t);
          ns.start(t, Math.random());
          // motor：电机的两层，珍品那一网的吃力（omenStrain，audio-precious.js）用 detune 把它们往下拖
          this.loops.winch = { out, groan: m2g, srcs: [m, m2, vib, pulse, load, ns], load, f0, motor: [m, m2] };
        } else this.stopLoop('winch', 0.1);
        break;
      // 网出了水（B11）：一兜水的分量一下吊上来，电机往下一沉、吃力的那层嗡响一下，再慢慢缓过来
      case 'winchLoad': {
        const w = this.loops.winch; if (!w) break;
        const t = c.currentTime, k = o.k ?? 0.5;
        w.load.offset.cancelScheduledValues(t); w.load.offset.setValueAtTime(w.load.offset.value, t);
        w.load.offset.setTargetAtTime(-w.f0 * (0.1 + 0.16 * k), t, this.T(0.04)); w.load.offset.setTargetAtTime(0, t + this.T(0.35), this.T(0.45));
        const g2 = w.groan.gain; g2.cancelScheduledValues(t); g2.setValueAtTime(g2.value, t); g2.setTargetAtTime(g2.value * 1.9, t, this.T(0.03)); g2.setTargetAtTime(g2.value, t + this.T(0.35), this.T(0.45));
        break;
      }
      // 冲洗的水声（循环）：嘶嘶的水柱 + 一层按材质变调的共鸣（B15：水打到铁上发亮、打到木头上发闷）
      // + 加快时才起来的一层低吼和一阵阵的水压（B16）。改调、加快用 hoseTone，不另起一条
      case 'hose':
        if (o.on) {
          if (this.loops.hose) break;
          const s = this.src(this.noise, true), f = c.createBiquadFilter(), pk = c.createBiquadFilter(), g = c.createGain(), pg = c.createGain();
          f.type = 'highpass'; f.frequency.value = 1800; pk.type = 'peaking'; pk.frequency.value = 2400; pk.Q.value = 1; pk.gain.value = 0;
          s.connect(f); f.connect(pk); pk.connect(g); g.connect(pg); pg.connect(this.bed); g.gain.value = 0; g.gain.setTargetAtTime(0.09, c.currentTime, 0.1); pg.gain.value = 1;
          const r = this.src(this.brown, true), rf = c.createBiquadFilter(), rg = c.createGain();
          rf.type = 'lowpass'; rf.frequency.value = 420; r.connect(rf); rf.connect(rg); rg.connect(this.bed); rg.gain.value = 0;
          const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 2.2; lg.gain.value = 0; lfo.connect(lg); lg.connect(pg.gain);
          s.start(); r.start(); lfo.start();
          this.loops.hose = { s, g, f, pk, r, rg, lfo, lg };
        } else if (this.loops.hose) {
          const w = this.loops.hose, t = c.currentTime;
          for (const n of [w.g, w.rg]) n.gain.setTargetAtTime(0.0001, t, 0.08);
          w.s.stop(t + 0.4); w.r.stop(t + 0.4); w.lfo.stop(t + 0.4); this.loops.hose = null;
        }
        break;
      case 'hoseTone': {
        const w = this.loops.hose; if (!w) break;
        const t = c.currentTime;
        if (o.mat) {
          // 水柱打到实物以后：铁“铮铮”地亮、瓷和玻璃更尖、木头和石头发闷、布包吸水变哑
          const P = { metal: [2900, 9, 6], ceramic: [3800, 7, 5], glass: [4600, 8, 8], wood: [760, 6, 1.4], stone: [1500, 5, 2], cloth: [1100, -7, 0.9], live: [1300, 3, 1.5] }[o.mat] || [2400, 0, 1];
          w.pk.frequency.setTargetAtTime(P[0], t, 0.05); w.pk.gain.setTargetAtTime(P[1], t, 0.05); w.pk.Q.setTargetAtTime(P[2], t, 0.05);
          if (o.mat === 'wood' || o.mat === 'stone') w.f.frequency.setTargetAtTime(1250, t, 0.08);
        }
        if (o.fast) {
          // 加快：水声一下子顶上去、低处起一层吼声，水压一阵阵地顶（急）
          w.g.gain.setTargetAtTime(0.15, t, 0.04); w.f.frequency.setTargetAtTime(1150, t, 0.05);
          w.rg.gain.setTargetAtTime(0.07, t, 0.06);
          w.lfo.frequency.setTargetAtTime(7.5, t, 0.05); w.lg.gain.setTargetAtTime(0.28, t, 0.05);
        }
        break;
      }
      // 按 A 加快（B16）：水泵一口气顶上来——低低的“轰”、阀门一响、水压的嘶声往上冲；再按是一下小的
      case 'pump': {
        const sm = o.small ? 0.45 : 1;
        this.tone(78, 0.34, 0.16 * sm, 'sine', 0, 0.55);
        this.noiseBurst(2400, 2.5, 0.03, 0.05 * sm, 'bandpass');
        if (!o.small) this.sweep(1200, 4200, 0.3, 0.06, 0.03, 1.1);
        break;
      }
      // 网口松开（B12）：铁扣“咔”地弹开，链子哗地滑开——泥包随即往下掉
      case 'release': {
        this.noiseBurst(3400, 4, 0.025, 0.08, 'bandpass');
        this.toneF(430, 0.07, 0.035, 'square', 0, 0.62, 'bandpass', 950, 2.2);
        this.sweep(5600, 2300, 0.24, 0.035, 0.03, 3);
        break;
      }
      // 泥壳裂下一整块（B14）：湿泥撕开的“嘶啦”（很轻）；落到格栅上是一声“噗”，块越大越闷
      case 'slab': { const s = o.size ?? 0.5; this.sweep(1300 - s * 400, 420, 0.12, 0.022 + s * 0.012, 0, 1.4); break; }
      case 'slabLand': {
        const s = o.size ?? 0.5, f = this.noiseBurst(650 - s * 200, 0.8, 0.17, 0.07 + s * 0.05, 'lowpass');
        const t = c.currentTime; f.frequency.setValueAtTime(700 - s * 200, t); f.frequency.exponentialRampToValueAtTime(160, t + this.T(0.15));
        this.tone(118 - s * 42, 0.13, 0.05 + s * 0.04, 'sine', 0, 0.6);
        break;
      }
      // 确认那一拍（B17）：一道反光扫过湿亮的物件，很轻的一声往上滑（只有硬东西）
      case 'sheen': this.tone(2350, 0.42, 0.011, 'sine', 0.04, 1.5); break;
      // 泥包砸到甲板（B12）：沉的一声“咚”（越重越低），底下一层湿泥“啪”地摊开
      case 'thud': {
        const m = o.mass || 0.5;
        this.tone(90 - m * 30, 0.35, 0.2 + m * 0.2, 'sine', 0, 0.5); this.noiseBurst(300, 0.6, 0.35, 0.18, 'lowpass'); this.noiseBurst(1200, 1.2, 0.25, 0.06, 'bandpass', 0.05);
        const f = this.noiseBurst(1500, 0.9, 0.2, 0.06 + m * 0.05, 'lowpass', 0.01), t = c.currentTime + this.T(0.01);
        f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(240, t + this.T(0.18));
        break;
      }
      // 船身一沉（落包之后半拍）：木船壳低低“吱”一声，船边的水拍一下
      case 'hullDip': { const k = o.k ?? 1; this.toneF(66, 0.42, 0.04 * k, 'sawtooth', 0, 0.86, 'bandpass', 420, 5); this.noiseBurst(600, 0.8, 0.32, 0.05 * k, 'lowpass', 0.12); break; }
      // 网口收紧时咬到埋着的硬物：隔着水一声闷闷的金属“咣”，缆绳跟着一抖
      case 'snag': {
        const lp = this.filt('lowpass', 900);
        for (const [f, d, p] of [[205, 0.5, 0.09], [566, 0.32, 0.05], [1107, 0.18, 0.025]]) this.tone(f, d, p, 'sine', 0, 0, lp);
        this.noiseBurst(260, 0.8, 0.25, 0.14, 'lowpass');
        this.toneF(58, 0.5, 0.05, 'sawtooth', 0.08, 1.25, 'lowpass', 380);
        break;
      }
      // 碰了硬物收回来的空网架落回甲板：铁架子“哐啷”几下，没有泥水
      case 'netBack': [0, 0.07, 0.16].forEach((d, i) => this.noiseBurst(3100 - i * 400, 5, 0.03, 0.06 - i * 0.012, 'bandpass', d)); this.tone(140, 0.12, 0.06, 'triangle', 0, 0.8); break;
      // 普通揭晓：水停后半拍一声确认音，按材质（一共 3 个发声体：两声材质 + 一声暖的“哦”）
      case 'reveal': {
        this.tone(784, 0.9, 0.028, 'sine', 0.02);
        switch (o.mat) {
          case 'ceramic': this.tone(1760, 0.14, 0.045, 'triangle'); this.tone(2640, 0.1, 0.02, 'sine', 0.01); break;
          case 'wood': this.tone(330, 0.16, 0.07, 'triangle', 0, 0.75); this.noiseBurst(700, 1.2, 0.05, 0.05, 'lowpass'); break;
          case 'glass': this.tone(2637, 0.45, 0.035, 'sine'); this.tone(3951, 0.25, 0.018, 'sine', 0.005); break;
          case 'stone': this.noiseBurst(900, 2, 0.08, 0.07); this.tone(196, 0.12, 0.05, 'triangle'); break;
          case 'cloth': this.noiseBurst(480, 0.8, 0.12, 0.06, 'lowpass'); this.tone(1046.5, 0.7, 0.018, 'sine', 0.06); break;
          case 'live': this.noiseBurst(700, 0.9, 0.16, 0.08); this.tone(160, 0.12, 0.04, 'sine', 0, 0.6); break;
          default: this.tone(1320, 0.6, 0.05, 'sine'); this.tone(3643, 0.25, 0.014, 'sine'); break; // 金属：一声“叮”，带一点不谐和的泛音
        }
        break;
      }
      // 船员把东西放进舱里那一堆（B21）：一声空空的木头“咚”——舱板先闷闷一下（越重越低），舱里那口空气跟着嗡一下（窄带共鸣），
      // 硬的再带一点碰响。一共三四个发声体
      case 'stow': {
        const m = o.mass ?? 0.5, d = o.delay || 0;
        this.tone(105 - m * 40, 0.3, 0.1 + m * 0.08, 'sine', d, 0.7);
        this.noiseBurst(205 - m * 45, 9, 0.32 + m * 0.12, 0.16 + m * 0.1, 'bandpass', d);
        if (o.mat === 'metal') this.noiseBurst(1400, 6, 0.06, 0.04, 'bandpass', d + 0.01);
        else if (o.mat === 'ceramic' || o.mat === 'glass') this.tone(o.mat === 'glass' ? 2500 : 1700, 0.07, 0.018, 'sine', d + 0.01);
        else this.noiseBurst(600, 3, 0.07, 0.04, 'bandpass', d + 0.01);
        if (o.precious) this.tone(2093, 0.6, 0.012, 'sine', d + 0.05);
        break;
      }
      // 拉回大视野（B19）：镜头一口气退出去，一阵轻轻的风声从高往低滑过去
      case 'pullOut': { const k = o.k ?? 1; this.sweep(1500, 380, 0.95, 0.03 * k, 0, 0.9); this.noiseBurst(260, 0.7, 0.7, 0.018 * k, 'lowpass', 0.1); break; }
      // 签落进结果卡（B20）：一声小小的“叮”，接着金额往上滚的四下细碎的“嗒”，越来越慢；珍贵的亮一点
      case 'tally': {
        const p = o.precious ? 1.4 : 1;
        this.tone(2637, 0.22, 0.026 * p, 'sine'); this.tone(3951, 0.12, 0.01 * p, 'sine', 0.008);
        [0.16, 0.3, 0.47, 0.68].forEach((d, i) => this.noiseBurst(4300 - i * 300, 8, 0.02, 0.016 * p, 'bandpass', d));
        if (o.precious) this.tone(3136, 0.5, 0.012, 'sine', 0.7);
        break;
      }
      // 一枚小币从卡上跳进这一趟的合计（B20）：轻轻一磕
      case 'tallyChip': this.tone(1976, 0.12, 0.02, 'sine'); this.tone(2960, 0.08, 0.008, 'sine', 0.01); this.noiseBurst(5200, 6, 0.015, 0.01, 'bandpass'); break;
      // 珍品举在舱口上方停半拍（C8 憋住）：一缕很轻的亮音慢慢涨起来，下面垫一声低低的嗡
      case 'goldHold': {
        const c = this.ctx, D = this.T(o.dur || 0.6), t = c.currentTime;
        for (const [f, pk] of [[1046.5, 0.014], [1568, 0.008]]) {
          const os = c.createOscillator(), gg = c.createGain(); os.type = 'sine'; os.frequency.value = f; os.connect(gg); gg.connect(this.out);
          gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(pk, t + D); gg.gain.exponentialRampToValueAtTime(0.0001, t + D + this.T(0.12));
          os.start(t); os.stop(t + D + this.T(0.12) + 0.05);
        }
        this.toneF(58, (o.dur || 0.6) + 0.1, 0.05, 'triangle', 0, 1.15, 'lowpass', 160);
        break;
      }
      // 珍品落进舱里（C8 爆发）：一声沉沉的“咚”（舱板 + 舱里那口空气嗡很久），接着金色的几个泛音亮起来慢慢散，最上面一层细细的沙沙
      // 七个发声体：比普通进舱重得多，比珍品确认（S1）轻
      case 'stowGold': {
        const sv = o.silver;
        this.tone(64, 0.55, 0.32, 'sine', 0, 0.55);
        this.noiseBurst(230, 0.8, 0.4, 0.16, 'lowpass');
        this.noiseBurst(150, 11, 0.9, 0.2, 'bandpass', 0.01);
        (sv ? [1174.7, 1760, 2349.3] : [1046.5, 1568, 2093]).forEach((f, i) => this.tone(f, 1.7 - i * 0.3, 0.022 - i * 0.005, 'sine', 0.05 + i * 0.07));
        this.noiseBurst(7200, 3, 0.9, 0.012, 'bandpass', 0.08);
        break;
      }
      // 活蟹捏在手里（C10）：螯一张一合“咔嗒”两下
      case 'crabClick': { const q = o.soft ? 0.5 : 1; this.noiseBurst(3300, 9, 0.025, 0.05 * q, 'bandpass'); this.noiseBurst(2700, 9, 0.025, 0.04 * q, 'bandpass', 0.07); break; }
      // 蟹掉进水槽（C10）：“扑通”——一声往上翘的水泡音、一下溅水，跟着两滴
      case 'plunk': {
        const k = o.k ?? 1;
        this.tone(330, 0.13, 0.07 * k, 'sine', 0, 2.2);
        this.noiseBurst(1700, 0.9, 0.2, 0.06 * k, 'bandpass');
        this.tone(1450, 0.06, 0.014, 'sine', 0.14, 1.4); this.tone(1900, 0.05, 0.01, 'sine', 0.26, 1.4);
        break;
      }
      // 水柱打到实物：材质先从声音露出来（金属叮、陶器嗒、木头笃、玻璃脆、石头闷、布包噗、活物扑腾）
      case 'strike': {
        const q = o.quiet ? 0.5 : 1, sz = o.size ?? 0.5;
        switch (o.mat) {
          case 'metal': { const f = 1500 - sz * 760; this.tone(f, 0.55, 0.06 * q, 'sine'); this.tone(f * 2.76, 0.28, 0.025 * q, 'sine'); this.noiseBurst(5000, 2, 0.03, 0.04 * q); break; }
          case 'ceramic': { const f = 1900 - sz * 600; this.tone(f, 0.12, 0.05 * q, 'triangle'); this.tone(f * 1.52, 0.09, 0.03 * q, 'sine', 0.01); this.noiseBurst(3200, 3, 0.03, 0.04 * q); break; }
          case 'wood': this.tone(320 - sz * 120, 0.14, 0.08 * q, 'triangle', 0, 0.7); this.noiseBurst(700, 1.2, 0.06, 0.06 * q, 'lowpass'); break;
          case 'glass': this.tone(2600, 0.4, 0.045 * q, 'sine'); this.tone(3900, 0.22, 0.025 * q, 'sine', 0.005); break;
          case 'stone': this.noiseBurst(900, 2, 0.08, 0.09 * q); this.tone(170, 0.1, 0.05 * q, 'triangle'); break;
          case 'cloth': this.noiseBurst(420, 0.8, 0.12, 0.08 * q, 'lowpass'); break;
          case 'live': this.noiseBurst(700, 0.9, 0.16, 0.1 * q); this.tone(160, 0.12, 0.05 * q, 'sine', 0, 0.6); break;
          default: this.noiseBurst(2500, 3, 0.04, 0.06 * q); this.tone(1200, 0.05, 0.03 * q, 'sine'); break;
        }
        // 珍贵物：那一声后面拖着一串颤音
        if (o.gold || o.silver) {
          const fs = o.silver ? [2093, 2637, 3136, 4186] : [1568, 2093, 2637, 3136];
          fs.forEach((f, i) => {
            const oc = c.createOscillator(), g2 = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
            oc.type = 'sine'; oc.frequency.value = f * (1 + (i % 2 ? 0.004 : -0.004));
            lfo.frequency.value = 8 + i * 1.3; lg.gain.value = 0.012; lfo.connect(lg); lg.connect(g2.gain);
            oc.connect(g2); g2.connect(this.out);
            const t = c.currentTime + 0.04 + i * 0.05;
            g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.022, t + 0.08); g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
            oc.start(t); lfo.start(t); oc.stop(t + 1.4); lfo.stop(t + 1.4);
          });
        }
        break;
      }
      // 珍贵物各自的那一下
      case 'gems': [1568, 1760, 2093, 2637].forEach((f, i) => { this.tone(f, 0.7, 0.045, 'sine', 0.06 + i * 0.2); this.tone(f * 2.01, 0.3, 0.015, 'sine', 0.06 + i * 0.2); }); break;
      // 银币哗啦倒出来：先一把砸下（最响），后面越来越稀、越来越轻，底下一层币滑动的沙沙声
      case 'coins': {
        this.noiseBurst(5200, 0.9, 0.85, 0.05, 'bandpass', 0.01);
        for (let i = 0; i < 12; i++) { const d = i < 3 ? i * 0.025 : 0.06 + Math.pow((i - 3) / 9, 1.5) * 0.85; this.tone(2500 + Math.random() * 1900, 0.11 + Math.random() * 0.06, 0.05 * (1 - i / 16), 'triangle', d); }
        break;
      }
      case 'revealBig': {
        // 珍品确认的主和弦（签名声之后 0.15 秒才进来）：一下低沉的落地 + 一口气打开的和弦 + 三道钟声泛音，长长地收
        this.tone(55, 1.6, 0.34, 'sine', 0, 0.6);
        const chord = [261.63, 329.63, 392.0, 523.25, 659.25];
        const T = (s) => this.T(s);
        chord.forEach((f, i) => { const oc = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); oc.type = 'sawtooth'; oc.frequency.value = f * (1 + (i % 2 ? 0.003 : -0.003)); fl.type = 'lowpass'; fl.frequency.value = 500; fl.frequency.linearRampToValueAtTime(3000, c.currentTime + T(0.9)); oc.connect(fl); fl.connect(g); g.connect(this.out); const t = c.currentTime + T(0.02); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.032, t + T(0.35)); g.gain.exponentialRampToValueAtTime(0.0001, t + T(3.6)); oc.start(t); oc.stop(t + T(3.8)); });
        [1046.5, 1568, 2093].forEach((f, i) => this.tone(f, 2.6, 0.045 - i * 0.01, 'sine', 0.08 + i * 0.05));
        break;
      }
      // 憋住：一道往上走的声音，在抽声那一刻被一起抽走（走环境底）；dur 是到抽声还有几秒
      case 'rise': {
        const oc = c.createOscillator(), g2 = c.createGain(), f = c.createBiquadFilter();
        const D = this.T(o.dur || 1.4);
        oc.type = 'sawtooth'; oc.frequency.value = 110; f.type = 'lowpass'; f.frequency.value = 300;
        oc.connect(f); f.connect(g2); g2.connect(this.bed);
        const t = c.currentTime;
        oc.frequency.exponentialRampToValueAtTime(230, t + D); f.frequency.exponentialRampToValueAtTime(2000, t + D);
        g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.055, t + D); g2.gain.exponentialRampToValueAtTime(0.0001, t + D + this.T(0.5));
        oc.start(t); oc.stop(t + D + this.T(0.6));
        break;
      }
      case 'haul': [392, 494, 587].forEach((f, i) => this.tone(f, 0.6, 0.06, 'triangle', i * 0.12)); break;
      // 看清一处现场或线索（B1）：水下先“咕”一声（下面的东西应了一声），再轻轻“叮”往上走——现场是五度，线索是四度、低一点
      // （还没到）；带一点水光的颤；偏向它那一边
      case 'find': {
        const P = this.pan(o.pan), [f1, f2] = o.kind === 'clue' ? [880, 1174.66] : [1046.5, 1568];
        this.tone(250, 0.09, 0.05, 'sine', 0, 3.2, P);
        this.tone(f1, 0.45, 0.042, 'sine', 0.08, 0, P); this.tone(f2, 0.7, 0.03, 'sine', 0.17, 0, P);
        this.noiseBurst(7000, 1.5, 0.25, 0.011, 'highpass', 0.12, P);
        break;
      }
      // 远处更深的残骸（C1）：远远地“叮”一声（闷一点，底下一点低音），后面两道回声越来越远；偏向它那一边
      case 'beckon': {
        const P = this.pan(o.pan), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(P);
        [[0, 1], [0.36, 0.36], [0.72, 0.14]].forEach(([d, k], i) => {
          this.tone(659.25, 1.3 - i * 0.25, 0.045 * k, 'sine', d, 0, lp);
          if (!i) { this.tone(659.25 * 2.76, 0.4, 0.009, 'sine', d, 0, lp); this.tone(164.81, 0.9, 0.035, 'triangle', d, 0, lp); }
        });
        break;
      }
      // 蟹翻出埋着的东西（C2）：沙沙几下越刨越急 → 0.9 秒碰到硬东西闷闷一“笃”（金属的再带一点“叮”）→ 露出来，一声暖的小三度往上；
      // 偏向它那一边，远了轻
      case 'unearth': {
        const v = o.vol ?? 1, P = this.pan(o.pan), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(P);
        [0, 0.3, 0.52, 0.68, 0.8].forEach((d, i) => this.noiseBurst(1500 + i * 260, 1.3, 0.08, (0.02 + i * 0.011) * v, 'bandpass', d, lp));
        this.tone(170, 0.16, 0.09 * v, 'sine', 0.9, 0.6, lp); this.noiseBurst(700, 1.5, 0.06, 0.06 * v, 'bandpass', 0.9, lp);
        if (o.mat === 'metal') this.tone(1240, 0.35, 0.03 * v, 'sine', 0.92, 0, lp);
        this.tone(587.33, 0.7, 0.032 * v, 'sine', 1.15, 0, P); this.tone(698.46, 0.9, 0.028 * v, 'sine', 1.27, 0, P);
        break;
      }
      // —— 逼近的威胁（第七批）——
      // 前方浅滩逼近（W2）：测深仪一下一下地“嘀”，水越浅音越低、越急越亮（k：0 刚进黄，1 快撞上）；带一声更轻的回声
      case 'shoalPing': {
        const k = Math.max(0, Math.min(1, o.k ?? 0)), f = 1250 + k * 520;
        this.tone(f, 0.07, 0.03 + k * 0.025, 'sine', 0, 0.9);
        this.tone(f * 0.5, 0.09, 0.012 + k * 0.012, 'sine', 0.085, 0.9);
        break;
      }
      // 船员喊“浅了！”（W2 再近）：一长一短两声（不念字，字写在画面上），隔着风、有点哑
      case 'shout': {
        const lp = this.filt('lowpass', 2600);
        const voice = (f0, f1, f2, dur, delay, peak, forms) => {
          const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'sawtooth';
          const t = c.currentTime + this.T(delay), D = this.T(dur);
          o2.frequency.setValueAtTime(f0, t); o2.frequency.linearRampToValueAtTime(f1, t + D * 0.35); o2.frequency.linearRampToValueAtTime(f2, t + D);
          g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(peak, t + this.T(0.03)); g2.gain.setValueAtTime(peak, t + D * 0.6); g2.gain.exponentialRampToValueAtTime(0.0001, t + D);
          o2.connect(g2);
          for (const [ff, q, a] of forms) { const bp = c.createBiquadFilter(), ga = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q; ga.gain.value = a; g2.connect(bp); bp.connect(ga); ga.connect(lp); }
          o2.start(t); o2.stop(t + D + 0.05);
        };
        this.noiseBurst(3200, 1.2, 0.06, 0.03, 'bandpass', 0, lp);                                   // 起头的气声（“q”）
        voice(205, 250, 195, 0.3, 0.03, 0.22, [[780, 5, 1], [1900, 7, 0.55]]);                     // 长的一声
        voice(185, 175, 140, 0.15, 0.32, 0.17, [[560, 5, 1], [1450, 6, 0.5]]);                      // 短的一声
        break;
      }
      // 撞上浅滩（W3）：一下闷闷的船底撞沙，接着长长的“嘎——”（沙粒刮着船底，越刮越低、越刮越慢），木船壳吱一声，船头的水涌上来
      // k：撞的狠不狠（0.3 慢慢顶上去 … 1 全速）
      case 'ground': {
        const k = Math.max(0.25, Math.min(1, o.k ?? 1)), D = 0.7 + 0.6 * k;
        this.tone(68, 0.5, 0.22 * k + 0.05, 'sine', 0, 0.55);
        this.noiseBurst(170, 0.9, 0.32, 0.2 * k + 0.04, 'lowpass');
        // 刮沙：带通噪声往下扫，音量被一个越来越慢的“颗粒”调制
        {
          const s = this.src(this.noise), bp = c.createBiquadFilter(), am = c.createGain(), g2 = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
          bp.type = 'bandpass'; bp.Q.value = 1.6; s.connect(bp); bp.connect(am); am.connect(g2); g2.connect(this.out);
          const t = c.currentTime + this.T(0.02), TD = this.T(D);
          bp.frequency.setValueAtTime(950, t); bp.frequency.exponentialRampToValueAtTime(260, t + TD);
          am.gain.value = 0.55; lfo.type = 'square'; lfo.frequency.setValueAtTime(34, t); lfo.frequency.exponentialRampToValueAtTime(11, t + TD); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(am.gain);
          g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.16 * k + 0.03, t + this.T(0.04)); g2.gain.setValueAtTime(0.16 * k + 0.03, t + TD * 0.45); g2.gain.exponentialRampToValueAtTime(0.0001, t + TD);
          s.start(t, Math.random()); s.stop(t + TD + 0.1); lfo.start(t); lfo.stop(t + TD + 0.1);
        }
        this.toneF(94, 0.75 * D, 0.05 * k + 0.01, 'sawtooth', 0.06, 0.62, 'bandpass', 470, 6);   // 木船壳吱——
        this.noiseBurst(520, 0.7, 0.55, 0.07 * k, 'lowpass', 0.12);                                  // 船头的水涌上来
        break;
      }
      // 落点压到埋着的硬物（W4）：near 只是轻轻一“嗒”；压上去（on）再加一声低低的“咚”
      case 'hazTick':
        this.noiseBurst(2300, 4, 0.025, o.hit ? 0.05 : 0.03, 'bandpass'); this.tone(o.hit ? 640 : 900, 0.04, o.hit ? 0.03 : 0.018, 'triangle', 0, 0.85);
        if (o.hit) this.tone(196, 0.16, 0.05, 'sine', 0.03, 0.8);
        break;
      // 咬到硬物时缆绳一抖（W5）：钢缆绷紧以后“嗡”地颤，慢慢停
      case 'twang': {
        const o2 = c.createOscillator(), g2 = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), lp = this.filt('lowpass', 420);
        o2.type = 'sawtooth'; o2.frequency.value = 74; lfo.frequency.value = 9; lg.gain.value = 5; lfo.connect(lg); lg.connect(o2.frequency);
        o2.connect(g2); g2.connect(lp);
        const t = c.currentTime + this.T(0.02);
        g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.07, t + this.T(0.015)); g2.gain.exponentialRampToValueAtTime(0.0001, t + this.T(1.3));
        o2.start(t); lfo.start(t); o2.stop(t + this.T(1.35) + 0.05); lfo.stop(t + this.T(1.35) + 0.05);
        this.tone(148, 0.5, 0.025, 'triangle', 0.02, 0.97);
        break;
      }
    }
  }
}
