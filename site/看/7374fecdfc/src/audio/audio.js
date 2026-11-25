// 全部用 WebAudio 现场合成。一个意思一个声音（效果清单 第 1 节 总规矩 1）。
//
// 结构：每一声都排在 now() 上（实时游戏里就是 ctx.currentTime）。录像时把每一次调用连同游戏里的时刻记下来，
// 录完在 OfflineAudioContext 里按同样的时刻重放一遍，得到和画面逐帧对齐的声音（Audio.renderLog）。
//
// 总线：sfx 音效 / amb 海浪风海鸥 / eng 引擎 / mus 动机、号角、心跳、低音 → master → 压缩 → 出口；
// 远处的声音（钟、远处的叮、沉船的弦）另外送一份进混响。

// 声音自己的随机数：不动游戏的 Math.random（固定种子的自动演示前后对得上）
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PUBLIC = ['play', 'loop', 'setHose', 'setAmbience', 'duck', 'hush', 'setDread', 'engine', 'setVolume', 'update'];

export class Audio {
  constructor() {
    this.ctx = null;
    this.vol = 0.8;
    this.loops = {};
    this.ready = false;
    this.tOff = 0;
    this.simT = 0;
    this.rec = null;
    this.R = rng(9127);
    this.st = { engineOn: false, throttle: 0, amb: { waves: 1, wind: 1, deep: 0, echo: 0, gate: 1 }, hose: null, dread: 0, hush: 1 };
  }

  now() {
    return this.ctx.currentTime + this.tOff;
  }

  // 游戏时钟（录像用）：每帧 game.frame 推一下
  tick(dt) {
    this.simT += dt;
  }

  startRec() {
    this.recT0 = this.simT;
    this.rec = [{ t: 0, m: 'restore', a: [JSON.parse(JSON.stringify({ ...this.st, vol: this.vol }))] }];
  }

  stopRec() {
    const r = this.rec;
    this.rec = null;
    return r;
  }

  _r(m, a) {
    if (this.rec) this.rec.push({ t: +(this.simT - this.recT0).toFixed(4), m, a: JSON.parse(JSON.stringify(a)) });
  }

  // 加载时就把声音图和噪声都备好（这时还没点过画面，AudioContext 是挂起的），点开始那一下只 resume
  prepare(given) {
    if (this.ctx) return;
    let ctx = given;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { ctx = new AC(); } catch (e) { return; }
    }
    this.ctx = ctx;
    const c = ctx;
    this.master = c.createGain();
    this.master.gain.value = this.vol;
    this.mute = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    this.master.connect(comp).connect(this.mute).connect(c.destination);
    const bus = () => { const g = c.createGain(); g.connect(this.master); return g; };
    this.sfx = bus();
    this.amb = bus();
    this.eng = bus();
    this.mus = bus();
    // 让路：环境声和引擎在大时刻被压下去（duck）
    this.duckG = c.createGain();
    this.amb.disconnect();
    this.eng.disconnect();
    this.amb.connect(this.duckG);
    this.eng.connect(this.duckG);
    // 收工到再来一趟：世界的声音一直退在后面（hush），不自己回来
    this.hushG = c.createGain();
    this.duckG.connect(this.hushG).connect(this.master);
    // 噪声
    const R = this.R;
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = R() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099;
      b1 = 0.963 * b1 + w * 0.2965;
      b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18; // 粉噪声
    }
    this.noise = buf;
    const wb = c.createBuffer(1, len, c.sampleRate);
    const wd = wb.getChannelData(0);
    for (let i = 0; i < len; i++) wd[i] = R() * 2 - 1;
    this.white = wb;
    // 混响：一段往下衰减、越来越暗的噪声
    const rl = Math.floor(c.sampleRate * 2.6);
    const ir = c.createBuffer(2, rl, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const o = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < rl; i++) {
        const k = i / rl;
        const a = 0.25 + 0.7 * k;
        lp = lp * a + (R() * 2 - 1) * (1 - a);
        o[i] = lp * Math.pow(1 - k, 2.6) * 1.6;
      }
    }
    this.rev = c.createConvolver();
    this.rev.buffer = ir;
    const rg = c.createGain();
    rg.gain.value = 0.55;
    this.rev.connect(rg).connect(this.master);
    this.ready = true;
    this.startAmbient();
    this.startEngine();
  }

  unlock() {
    if (!this.ctx) this.prepare();
    if (this.ctx && this.ctx.state === 'suspended' && this.ctx.resume) this.ctx.resume();
  }

  get running() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  setVolume(v) {
    this._r('setVolume', [v]);
    this.vol = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.now(), 0.05);
  }

  // 效果页的声音开关：不进录像
  setMuted(m) {
    if (this.mute) this.mute.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.03);
  }

  // 录像那一刻的持续状态（引擎、环境、水管、低音）
  restore(s) {
    this.st = JSON.parse(JSON.stringify({ engineOn: s.engineOn, throttle: s.throttle, slew: s.slew || 0, amb: s.amb, hose: null, dread: 0, hush: 1 }));
    if (s.hush !== undefined && s.hush !== 1) this.hush(s.hush, 0.01);
    if (s.vol !== undefined) { this.vol = s.vol; this.master.gain.setValueAtTime(s.vol, this.now()); }
    this._engineLevel(true);
    this._slewLevel(true);
    this._ambApply(0.01);
    if (s.hose) { this.loop('hose', true, s.hose); }
    if (s.dread) this.setDread(s.dread);
  }

  // —— 基本件 ——
  _noise(white = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = white ? this.white : this.noise;
    s.loop = true;
    s.loopStart = this.R() * 1.5;
    return s;
  }

  _env(g, t, a, peak, dec, end = 0.0001) {
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.00011, peak), t + a);
    g.gain.exponentialRampToValueAtTime(end, t + a + dec);
  }

  // 出口：可以左右摆、可以送混响
  _out(o = {}) {
    const c = this.ctx;
    let node = o.dest || this.sfx;
    if (o.pan) {
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, o.pan));
      p.connect(node);
      node = p;
    }
    if (o.rev) {
      const s = c.createGain();
      s.gain.value = o.rev;
      s.connect(this.rev);
      const split = c.createGain();
      split.connect(node);
      split.connect(s);
      node = split;
    }
    return node;
  }

  _tone(type, f0, f1, t0, dur, peak, o = {}) {
    const c = this.ctx;
    const os = c.createOscillator();
    os.type = type;
    os.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) os.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    if (o.detune) os.detune.value = o.detune;
    const g = c.createGain();
    this._env(g, t0, o.a ?? 0.005, peak, dur);
    let n = os;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; n.connect(f); n = f; }
    n.connect(g).connect(this._out(o));
    os.start(t0);
    os.stop(t0 + (o.a ?? 0.005) + dur + 0.05);
    return os;
  }

  _hit(t0, dur, peak, type, f0, f1, q = 1, o = {}) {
    const c = this.ctx;
    const n = this._noise(o.white);
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    fl.Q.value = q;
    const g = c.createGain();
    this._env(g, t0, o.a ?? 0.01, peak, dur);
    n.connect(fl).connect(g).connect(this._out(o));
    n.start(t0);
    n.stop(t0 + (o.a ?? 0.01) + dur + 0.1);
  }

  // 木头块的「嗒」
  _wood(t, f, peak, o = {}) {
    this._tone('sine', f, f * 0.82, t, 0.05, peak, o);
    this._tone('triangle', f * 2.6, f * 2.4, t, 0.018, peak * 0.35, o);
    this._hit(t, 0.012, peak * 0.4, 'bandpass', f * 3, f * 3, 6, { ...o, white: true, a: 0.001 });
  }

  // 一个小气泡
  _blip(t, f, peak, o = {}) {
    this._tone('sine', f, f * 1.9, t, 0.045, peak, o);
  }

  // —— 环境：海浪、风、深水的嗡 ——
  startAmbient() {
    const c = this.ctx;
    const mk = (white, type, f, q, base) => {
      const n = this._noise(white);
      const fl = c.createBiquadFilter();
      fl.type = type;
      fl.frequency.value = f;
      fl.Q.value = q;
      const g = c.createGain();
      g.gain.value = base;
      n.connect(fl).connect(g).connect(this.amb);
      n.start(0);
      return { g, fl };
    };
    // 海浪低处的涌、浪头的「哗」、高处的风；每样各有一个慢慢起伏的音量
    const lfo = (f, depth, target, ph = 0) => {
      const o = c.createOscillator();
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.value = depth;
      o.connect(g).connect(target);
      o.start(ph);
    };
    this.wLow = mk(false, 'lowpass', 380, 0.7, 0.2);
    lfo(0.085, 0.085, this.wLow.g.gain);
    this.wWash = mk(false, 'bandpass', 900, 0.7, 0.05);
    lfo(0.13, 0.04, this.wWash.g.gain, 0.0);
    this.wind = mk(true, 'bandpass', 1500, 0.5, 0.018);
    lfo(0.05, 0.012, this.wind.g.gain);
    // 深水：很低的一层嗡（往深槽开时才起来）
    const o = c.createOscillator();
    o.frequency.value = 49;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 90;
    this.deepG = c.createGain();
    this.deepG.gain.value = 0;
    o.connect(lp).connect(this.deepG).connect(this.amb);
    o.start(0);
    const dn = this._noise();
    const dl = c.createBiquadFilter();
    dl.type = 'lowpass';
    dl.frequency.value = 120;
    dn.connect(dl).connect(this.deepG);
    dn.start(0);
    // 环境总闸（标题前、黑场里用）
    this.ambGate = c.createGain();
    this.amb.disconnect();
    this.amb.connect(this.ambGate).connect(this.duckG);
    this._ambApply(0.01);
  }

  _ambApply(tau) {
    const t = this.now();
    const A = this.st.amb;
    this.wLow.g.gain.setTargetAtTime(0.2 * A.waves, t, tau);
    this.wWash.g.gain.setTargetAtTime(0.05 * A.waves, t, tau);
    this.wind.g.gain.setTargetAtTime(0.018 * A.wind, t, tau);
    this.deepG.gain.setTargetAtTime(0.11 * A.deep, t, tau);
    if (this.engEcho) this.engEcho.gain.setTargetAtTime(0.75 * (A.echo || 0), t, tau);
    this.ambGate.gain.setTargetAtTime(A.gate, t, tau);
  }

  // waves / wind / deep：0..1 的目标；gate：整体开关（淡入淡出）
  setAmbience(o, tau = 1.2) {
    this._r('setAmbience', [o, tau]);
    if (!this.ready) return;
    Object.assign(this.st.amb, o);
    this._ambApply(tau);
  }

  // 大时刻让路：环境和引擎压到 level，hold 秒后慢慢回来
  duck(level, attack = 0.05, hold = 1, release = 1.2) {
    this._r('duck', [level, attack, hold, release]);
    if (!this.ready) return;
    const t = this.now();
    const p = this.duckG.gain;
    p.cancelScheduledValues(t);
    p.setTargetAtTime(level, t, attack / 3);
    p.setTargetAtTime(1, t + attack + hold, release / 3);
  }

  // C14—C16：环境和引擎退到 level 并一直停在那儿（tau 秒到位），直到再叫一次 hush(1)
  hush(level, tau = 1) {
    this._r('hush', [level, tau]);
    if (!this.ready) return;
    this.st.hush = level;
    const t = this.now();
    const p = this.hushG.gain;
    p.cancelScheduledValues(t);
    p.setTargetAtTime(level, t, tau / 3);
  }

  // —— 引擎 ——
  startEngine() {
    const c = this.ctx;
    const o1 = c.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = 40;
    const o2 = c.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = 80.7;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    const g = c.createGain();
    g.gain.value = 0.0;
    // 柴油机的「突突」
    const am = c.createOscillator();
    am.frequency.value = 9;
    const amg = c.createGain();
    amg.gain.value = 0.32;
    const amBias = c.createGain();
    amBias.gain.value = 0.68;
    am.connect(amg).connect(amBias.gain);
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(amBias).connect(g).connect(this.eng);
    // 深水上开船：「突突」声从很远的地方回来一点（往深槽开时才有），引擎显得孤单
    const dl = c.createDelay(1);
    dl.delayTime.value = 0.31;
    const fb = c.createGain();
    fb.gain.value = 0.32;
    const dlp = c.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 420;
    this.engEcho = c.createGain();
    this.engEcho.gain.value = 0;
    g.connect(this.engEcho).connect(dl).connect(dlp).connect(this.eng);
    dlp.connect(fb).connect(dl);
    o1.start(0); o2.start(0); am.start(0);
    this.engineN = { o1, o2, lp, g, am };
    this._ambApply(0.01);
  }

  _engineLevel(snap) {
    const e = this.engineN;
    const t = this.now();
    const thr = this.st.throttle;
    const tau = snap ? 0.01 : 0.2;
    e.o1.frequency.setTargetAtTime(38 + thr * 26, t, tau);
    e.o2.frequency.setTargetAtTime(77 + thr * 52, t, tau);
    e.am.frequency.setTargetAtTime(7 + thr * 9, t, tau);
    e.lp.frequency.setTargetAtTime(160 + thr * 380, t, tau);
    e.g.gain.setTargetAtTime(this.st.engineOn ? 0.045 + thr * 0.12 : 0, t, snap ? 0.01 : 0.25);
  }

  // 引擎开/关（开局点火之后才响）
  engine(on) {
    this._r('engine', [on]);
    if (!this.ready) return;
    this.st.engineOn = on;
    this._engineLevel(false);
  }

  // 每帧：油门、吊臂转得多快（液压泵跟着吃劲）
  update(dt, s) {
    const thr = Math.round((s.throttle || 0) * 100) / 100;
    const slew = Math.round((s.slew || 0) * 20) / 20;
    if (thr === this.st.throttle && slew === (this.st.slew || 0)) return;
    this._r('update', [0, { throttle: thr, slew }]);
    this.st.throttle = thr;
    this.st.slew = slew;
    if (this.ready) { this._engineLevel(false); this._slewLevel(false); }
  }

  // 吊臂转动、伸缩时的液压泵：低低的「嗡」，转得越快越响、音越高；停了就退下去
  _slewLevel(snap) {
    const c = this.ctx;
    if (!this.slewN) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 70;
      const o2 = c.createOscillator();
      o2.type = 'square';
      o2.frequency.value = 141;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 300;
      lp.Q.value = 2.2;
      const g = c.createGain();
      g.gain.value = 0;
      const g2 = c.createGain();
      g2.gain.value = 0.35;
      o.connect(lp);
      o2.connect(g2).connect(lp);
      lp.connect(g).connect(this.sfx);
      o.start(0); o2.start(0);
      this.slewN = { o, o2, lp, g };
    }
    const N = this.slewN, t = this.now(), k = this.st.slew || 0;
    const tau = snap ? 0.01 : 0.12;
    N.o.frequency.setTargetAtTime(66 + k * 30, t, tau);
    N.o2.frequency.setTargetAtTime(133 + k * 61, t, tau);
    N.lp.frequency.setTargetAtTime(240 + k * 520, t, tau);
    N.g.gain.setTargetAtTime(k > 0.02 ? 0.012 + k * 0.05 : 0, t, snap ? 0.01 : k > 0.02 ? 0.08 : 0.22);
  }

  // —— 持续声 ——
  loop(name, on, o = {}) {
    this._r('loop', [name, on, o]);
    if (!this.ready) return;
    const c = this.ctx;
    const L = this.loops[name];
    const t = this.now();
    if (on && !L && name === 'hose') {
      // 水枪：打在厚泥上闷（低通、一下一下「噗噗」），打到硬东西上亮（高通）
      const soft = this._noise(true);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const gS = c.createGain();
      gS.gain.value = 0.0001;
      const pulse = c.createOscillator();
      pulse.type = 'sine';
      pulse.frequency.value = 6.5;
      const pg = c.createGain();
      pg.gain.value = 0.0;
      const pBias = c.createGain();
      pBias.gain.value = 1;
      pulse.connect(pg).connect(pBias.gain);
      soft.connect(lp).connect(pBias).connect(gS).connect(this.sfx);
      const hard = this._noise(true);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1700;
      const pk = c.createBiquadFilter();
      pk.type = 'peaking';
      pk.frequency.value = 3200;
      pk.gain.value = 6;
      const gH = c.createGain();
      gH.gain.value = 0.0001;
      hard.connect(hp).connect(pk).connect(gH).connect(this.sfx);
      soft.start(t); hard.start(t); pulse.start(t);
      const H = { gS, gH, lp, pulse, pg, hp };
      this.loops.hose = {
        H,
        stop: (hard2) => {
          const t2 = this.now();
          const tau = hard2 ? 0.012 : 0.08;
          gS.gain.cancelScheduledValues(t2); gH.gain.cancelScheduledValues(t2);
          gS.gain.setTargetAtTime(0.0001, t2, tau);
          gH.gain.setTargetAtTime(0.0001, t2, tau);
          soft.stop(t2 + 0.6); hard.stop(t2 + 0.6); pulse.stop(t2 + 0.6);
        },
      };
      this.st.hose = { mud: 1, fast: false };
      this._hoseApply(0.06);
    } else if (!on && L) {
      L.stop(o.cut);
      delete this.loops[name];
      if (name === 'hose') this.st.hose = null;
    }
  }

  // mud：1 = 打在厚泥上，0 = 打在干净的硬面上；fast：按住 A 加劲
  setHose(o) {
    if (!this.st.hose) return;
    const m = Math.round(o.mud * 20) / 20;
    if (m === this.st.hose.mud && !!o.fast === this.st.hose.fast) return;
    this._r('setHose', [{ mud: m, fast: !!o.fast }]);
    this.st.hose = { mud: m, fast: !!o.fast };
    if (this.ready && this.loops.hose) this._hoseApply(0.12);
  }

  _hoseApply(tau) {
    const H = this.loops.hose.H;
    const { mud, fast } = this.st.hose;
    const t = this.now();
    const k = fast ? 1.35 : 1;
    H.gS.gain.setTargetAtTime((0.11 * mud + 0.025) * k, t, tau);
    H.gH.gain.setTargetAtTime((0.07 * (1 - mud) + 0.012) * k, t, tau);
    H.pg.gain.setTargetAtTime(0.55 * mud, t, tau);
    H.pulse.frequency.setTargetAtTime(fast ? 10.5 : 6.5, t, tau);
    H.lp.frequency.setTargetAtTime(fast ? 1400 : 900, t, tau);
    H.hp.frequency.setTargetAtTime(fast ? 1300 : 1700, t, tau);
  }

  // 大轮廓：很低的、涌起又退下的声音，k = 0..1 跟着离船远近
  setDread(k) {
    k = Math.round(k * 50) / 50;
    if (k === this.st.dread) return;
    this._r('setDread', [k]);
    if (!this.ready) return;
    const c = this.ctx;
    const t = this.now();
    if (k > 0 && !this.dreadN) {
      const out = c.createGain();
      out.gain.value = 0.0001;
      // 走 hush：暂停、收工、收获单时和世界的声音一起退下去
      out.connect(this.hushG);
      const oscs = [];
      for (const [f, a] of [[36.7, 0.5], [39.2, 0.45], [55, 0.3]]) {
        const o = c.createOscillator();
        o.frequency.value = f;
        const g = c.createGain();
        g.gain.value = a;
        o.connect(g).connect(out);
        o.start(t);
        oscs.push(o);
      }
      const n = this._noise();
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 130;
      const ng = c.createGain();
      ng.gain.value = 0.9;
      n.connect(lp).connect(ng).connect(out);
      n.start(t);
      oscs.push(n);
      this.dreadN = { out, oscs };
    }
    if (this.dreadN) {
      this.dreadN.out.gain.setTargetAtTime(Math.max(0.0001, 0.3 * k), t, 1.6);
      if (k === 0) {
        const D = this.dreadN;
        this.dreadN = null;
        for (const o of D.oscs) o.stop(t + 8);
      }
    }
    this.st.dread = k;
  }

  play(name, o = {}) {
    this._r('play', [name, o]);
    // 效果页快进到效果开始前那一段：一次性的声音不出（不然一开头所有声音挤在一起）
    if (!this.ready || this.silent) return;
    const f = this['_' + name];
    if (f) f.call(this, o, this.now() + (o.at || 0));
  }

  // ======================= 单次音效 =======================

  // —— 开场 ——
  // G01 「沉债」压着锚线落下：锚链哗啦，落定一声闷的「咚」
  _titleDrop(o, t) {
    for (let i = 0; i < 16; i++) {
      const tt = t + i * 0.028 + this.R() * 0.01;
      this._hit(tt, 0.025, 0.14 * (1 - i / 22), 'bandpass', 3200 + this.R() * 1500, 2800, 4, { white: true, a: 0.001 });
    }
    this._tone('sine', 82, 38, t + 0.48, 0.5, 0.26);
    this._hit(t + 0.48, 0.4, 0.1, 'lowpass', 500, 80, 1);
    for (let i = 0; i < 4; i++) this._blip(t + 0.62 + i * 0.09, 380 + this.R() * 300, 0.03);
  }

  // G01 选项一项项亮起
  _titleOpt(o, t) {
    this._wood(t, 620 * Math.pow(2, (o.i || 0) * 4 / 12), 0.085);
  }

  // G03 标题沉进水里
  _titleSink(o, t) {
    this._hit(t, 0.9, 0.13, 'lowpass', 900, 160, 1);
    for (let i = 0; i < 10; i++) this._blip(t + 0.05 + i * 0.07 + this.R() * 0.04, 260 + this.R() * 500, 0.045 * (1 - i / 12));
  }

  // G03 点火：起动机「咔咔咔」，接着着火「突」一下，引擎稳下来
  _ignite(o, t) {
    const c = this.ctx;
    const st = c.createOscillator();
    st.type = 'sawtooth';
    st.frequency.setValueAtTime(130, t);
    st.frequency.linearRampToValueAtTime(175, t + 0.6);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 650;
    bp.Q.value = 2;
    const g = c.createGain();
    const am = c.createOscillator();
    am.frequency.value = 11;
    const amg = c.createGain();
    amg.gain.value = 0.085;
    am.connect(amg).connect(g.gain);
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.05);
    g.gain.setValueAtTime(0.1, t + 0.55);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.68);
    st.connect(bp).connect(g).connect(this.sfx);
    st.start(t); am.start(t);
    st.stop(t + 0.75); am.stop(t + 0.75);
    for (const [dt, k] of [[0.16, 0.35], [0.34, 0.5], [0.52, 0.6]]) {
      this._tone('sine', 64, 42, t + dt, 0.09, 0.26 * k);
      this._hit(t + dt, 0.07, 0.13 * k, 'lowpass', 400, 120, 1);
    }
    // 着火
    this._tone('sine', 62, 36, t + 0.7, 0.32, 0.4);
    this._hit(t + 0.7, 0.38, 0.2, 'lowpass', 700, 90, 1);
    this._hit(t + 0.72, 0.5, 0.05, 'bandpass', 500, 260, 1);
    for (let i = 0; i < 5; i++) this._tone('sine', 70, 45, t + 0.86 + i * 0.1, 0.08, 0.13 * (1 - i / 6));
  }

  // —— 开船 ——
  // A01 起步：几下「突突」，烟囱一口浓烟
  _engineUp(o, t) {
    for (let i = 0; i < 3; i++) {
      this._tone('sine', 72, 44, t + i * 0.105, 0.085, 0.1 + i * 0.03);
      this._hit(t + i * 0.105, 0.07, 0.05 + i * 0.015, 'lowpass', 420, 120, 1);
    }
    this._hit(t + 0.05, 0.35, 0.03, 'bandpass', 600, 300, 1);
  }

  // A01 松开：引擎掉下来，一声回气「噗」
  _engineDown(o, t) {
    this._tone('sawtooth', 88, 40, t, 0.36, 0.035, { lp: 380 });
    this._hit(t + 0.3, 0.06, 0.06, 'lowpass', 600, 150, 1);
    this._tone('sine', 90, 50, t + 0.3, 0.06, 0.05);
  }

  // A05 箭头转向下一块船板：木头「咔」+ 一点很轻的亮音
  _leadTurn(o, t) {
    this._wood(t, 1250, 0.05);
    this._tone('sine', 1760, 1758, t + 0.03, 0.22, 0.012);
    this._tone('sine', 2637, 2635, t + 0.06, 0.16, 0.006);
  }

  // A08 鱼群闪开：水里一声「唰」
  _fishScatter(o, t) {
    const k = o.gain ?? 1;
    this._hit(t, 0.3, 0.045 * k, 'bandpass', 500, 2200, 1.5, { white: true, pan: o.pan, a: 0.03 });
    for (let i = 0; i < 4; i++) this._blip(t + 0.05 + this.R() * 0.25, 900 + this.R() * 700, 0.01 * k, { pan: o.pan });
  }

  // C11 大轮廓来之前鱼群逃：更低、更长、一片接一片的「呼——」
  _fishFlee(o, t) {
    const k = o.gain ?? 1;
    for (let j = 0; j < 3; j++) {
      const tt = t + j * 0.28;
      this._hit(tt, 1.0, 0.055 * k, 'bandpass', 260, 900, 0.9, { pan: (o.pan || 0) * (1 - j * 0.2), a: 0.25 });
    }
    this._hit(t, 1.6, 0.06 * k, 'lowpass', 300, 90, 1, { a: 0.3 });
    for (let i = 0; i < 12; i++) this._blip(t + this.R() * 1.2, 500 + this.R() * 900, 0.009 * k, { pan: o.pan });
  }

  // A09 蟹的碎步「嗒嗒」（看得见、离镜头近才有，很轻）
  _crabStep(o, t) {
    const k = o.gain ?? 1;
    for (let i = 0; i < 3; i++) this._hit(t + i * 0.07 + this.R() * 0.015, 0.012, 0.03 * k, 'bandpass', 3200 + this.R() * 900, 3000, 7, { white: true, a: 0.001, pan: o.pan });
  }

  // A09 翻泥「沙沙」
  _crabDig(o, t) {
    const k = o.gain ?? 1;
    this._hit(t, 0.28, 0.022 * k, 'bandpass', 2400, 1800, 2.2, { white: true, pan: o.pan, a: 0.04 });
  }

  // A23 受惊：两螯往上一顶一声「咔」，顶两下（跟画面上两下对齐），接着一串碎步溜走
  _crabThreat(o, t) {
    const k = o.gain ?? 1;
    for (const dt of [0.07, 0.38]) {
      this._hit(t + dt, 0.02, 0.07 * k, 'bandpass', 2300, 2100, 5, { white: true, a: 0.001, pan: o.pan });
      this._hit(t + dt + 0.018, 0.015, 0.045 * k, 'bandpass', 3100, 2900, 6, { white: true, a: 0.001, pan: o.pan });
      this._tone('sine', 1350, 1150, t + dt, 0.03, 0.03 * k, { pan: o.pan });
    }
    for (let i = 0; i < 6; i++) this._hit(t + 0.66 + i * 0.05, 0.01, 0.026 * k, 'bandpass', 3600, 3300, 7, { white: true, a: 0.001, pan: o.pan });
  }

  // W01 / W02 低音心跳：「咚—咚」两下，很轻、很低；大轮廓那种更低更闷，混在低音里
  _heart(o, t) {
    const c = this.ctx;
    // 开着船时发动机正好在这一段频率上：按油门补一点，不然全速时听不见（停船调臂时就是原来的音量）
    const k0 = o.gain ?? 1;
    const k = k0 * (1 + 1.1 * (this.st.throttle || 0));
    const f = o.deep ? 0.78 : 1;
    const dest = o.deep ? this.mus : this.sfx;
    // 一下「咚」：低的正弦往下滑，上面叠泛音和一点三角波（小喇叭放不出 60 赫兹，靠这一层听得见，音色也和发动机分开）；
    // 三层走同一个包络，起音 8 毫秒，按时间常数自然衰减——有「身子」，不是一下掐掉的「嗒」
    const thump = (t0, a) => {
      const g = c.createGain();
      g.gain.value = 0.0001;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(a, t0 + 0.008);
      g.gain.setTargetAtTime(0.0001, t0 + 0.02, 0.055);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900 * f;
      g.connect(lp).connect(dest);
      for (const [type, f0, f1, amp] of [['sine', 64, 42, 1], ['sine', 128, 86, 0.55], ['triangle', 190, 120, 0.3]]) {
        const os = c.createOscillator();
        os.type = type;
        os.frequency.setValueAtTime(f0 * f, t0);
        os.frequency.exponentialRampToValueAtTime(f1 * f, t0 + 0.16);
        const og = c.createGain();
        og.gain.value = amp;
        os.connect(og).connect(g);
        os.start(t0);
        os.stop(t0 + 0.45);
      }
      this._hit(t0, 0.07, a * 0.9, 'lowpass', 520 * f, 160, 1.6, { dest, a: 0.002 });
    };
    thump(t, 0.2 * k);
    thump(t + 0.17, 0.13 * k);
    // 发动机和环境声跟着每一下往下沉一点再回来：心跳被让出来（开船全速时发动机比它还响），整片声音跟着一起搏动
    const p = this.duckG.gain;
    p.cancelScheduledValues(t);
    p.setTargetAtTime(1 - (o.deep ? 0.26 : 0.34) * Math.min(k0, 1), t, 0.012);
    p.setTargetAtTime(1, t + 0.2, 0.11);
  }

  // A23 钻进沙里 / 从沙里拱出来：一下软的「噗嚓」
  _crabBurrow(o, t) {
    const k = o.gain ?? 1;
    this._hit(t, 0.32, 0.03 * k, 'bandpass', 1500, 700, 1.6, { white: true, pan: o.pan, a: 0.02 });
    this._hit(t, 0.18, 0.03 * k, 'lowpass', 420, 120, 1, { pan: o.pan, a: 0.01 });
    for (let i = 0; i < 4; i++) this._hit(t + 0.05 + this.R() * 0.2, 0.01, 0.014 * k, 'bandpass', 3800, 3500, 7, { white: true, a: 0.001, pan: o.pan });
  }

  // B16 网里的蟹乱抓
  _crabNet(o, t) {
    const k = o.gain ?? 1;
    for (let i = 0; i < 9; i++) this._hit(t + this.R() * 0.55, 0.014, 0.04 * k, 'bandpass', 2500 + this.R() * 1500, 2300, 6, { white: true, a: 0.001 });
  }

  // B21 放进水槽「扑通」，冒两个泡
  _tank(o, t) {
    this._tone('sine', 560, 170, t, 0.12, 0.13);
    this._hit(t, 0.2, 0.07, 'lowpass', 1100, 200, 1);
    for (let i = 0; i < 3; i++) this._blip(t + 0.22 + i * 0.13, 650 + i * 220, 0.022);
  }

  // A11 海鸥（由游戏按地方决定叫不叫、在哪边；far：0 头顶上 → 1 远处，越远越闷、回声越多）
  _gull(o, t) {
    const c = this.ctx;
    const k = o.gain ?? 1;
    const far = o.far ?? 0;
    const n = 2 + Math.floor(this.R() * 2);
    for (let i = 0; i < n; i++) {
      const t0 = t + i * 0.32;
      const os = c.createOscillator();
      os.type = 'triangle';
      os.frequency.setValueAtTime(1500, t0);
      os.frequency.exponentialRampToValueAtTime(2300, t0 + 0.08);
      os.frequency.exponentialRampToValueAtTime(1100, t0 + 0.26);
      const g = c.createGain();
      this._env(g, t0, 0.02, 0.02 * k, 0.26);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 9000 - far * 6200;
      os.connect(lp).connect(g).connect(this._out({ pan: o.pan, rev: 0.25 + far * 0.4, dest: this.amb }));
      os.start(t0);
      os.stop(t0 + 0.32);
    }
  }

  // C01 到了新地方：远远一声钟（地方不同钟不同）
  _bell(o, t) {
    const f0 = o.f || 520;
    const parts = [[1, 1, 2.6], [2.0, 0.5, 1.6], [2.76, 0.4, 1.2], [5.4, 0.18, 0.6], [8.9, 0.08, 0.35]];
    for (const [m, a, d] of parts) this._tone('sine', f0 * m, f0 * m * 0.998, t, d, 0.14 * a * (o.gain ?? 1), { rev: 0.9, a: 0.003 });
  }

  // —— 调臂 ——
  // A14 进打捞模式（船不停，照样能开）：液压阀「咔」地一开，吊臂「嗡」地转起来；没有刹车声（船没刹）
  // A26 白圈吸到下一处打捞点：一声短的棘爪「咔哒」，跟着一声很轻的金属定音（够不着的那一处低一点、闷一点）
  _snap(o, t) {
    const far = !!o.far;
    this._hit(t, 0.018, 0.05, 'bandpass', far ? 1500 : 2300, far ? 1100 : 1700, 5, { white: true, a: 0.0005 });
    this._hit(t + 0.045, 0.022, 0.035, 'bandpass', far ? 1200 : 1800, far ? 900 : 1400, 5, { white: true, a: 0.0005 });
    this._tone('triangle', far ? 520 : 780, far ? 500 : 760, t + 0.04, 0.14, 0.018);
  }

  _armOn(o, t) {
    this._hit(t, 0.03, 0.045, 'bandpass', 1300, 1100, 4, { white: true, a: 0.001 });
    this._tone('sine', 150, 120, t, 0.06, 0.04);
    this._tone('sawtooth', 96, 142, t + 0.06, 0.42, 0.045, { lp: 650, a: 0.05 });
  }

  // A25 船还在走就按了下网：自动刹停。挂倒挡「咔—咚」，发动机反着吼一声，船尾的水被倒转的桨搅得哗哗响，船停住了声音也落下去。
  // o.dur：照眼下的速度多久刹停；o.k：速度占最快的几成（越快越响、越长）
  _castBrake(o, t) {
    const c = this.ctx;
    const k = Math.max(0.25, Math.min(1, o.k ?? 1));
    const dur = Math.max(0.5, Math.min(1.8, o.dur ?? 1));
    // 挂倒挡：齿轮一咬
    this._hit(t, 0.035, 0.07, 'bandpass', 900, 700, 3, { white: true, a: 0.001 });
    this._tone('sine', 72, 52, t + 0.02, 0.16, 0.11 * k);
    // 发动机反转吃劲：转速先往上顶一下，船慢下来跟着落
    const os = c.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(46, t + 0.05);
    os.frequency.exponentialRampToValueAtTime(70 + 18 * k, t + 0.3);
    os.frequency.exponentialRampToValueAtTime(40, t + 0.3 + dur);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.07 * k, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3 + dur);
    os.connect(lp).connect(g).connect(this._out({}));
    os.start(t + 0.05);
    os.stop(t + 0.4 + dur);
    // 船尾搅水：一团带颤的水声（桨叶一下下拍）
    const n = this._noise(true);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(520, t + 0.1);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.2 + dur);
    bp.Q.value = 0.9;
    const wg = c.createGain();
    wg.gain.setValueAtTime(0.0001, t + 0.1);
    wg.gain.exponentialRampToValueAtTime(0.12 * k, t + 0.35);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25 + dur);
    const trem = c.createGain();
    trem.gain.value = 0.7;
    const lfo = c.createOscillator();
    lfo.frequency.value = 9;
    const lg = c.createGain();
    lg.gain.value = 0.3;
    lfo.connect(lg).connect(trem.gain);
    n.connect(bp).connect(trem).connect(wg).connect(this._out({ rev: 0.2 }));
    n.start(t + 0.1);
    lfo.start(t + 0.1);
    n.stop(t + 0.35 + dur);
    lfo.stop(t + 0.35 + dur);
  }

  // 按了下网（吊臂还在路上，到了就下）：闸「咔」地扣上，低低一声
  _castLock(o, t) {
    this._hit(t, 0.03, 0.05, 'bandpass', 1500, 1300, 5, { white: true, a: 0.001 });
    this._tone('square', 196, 180, t, 0.07, 0.035, { lp: 900 });
    this._tone('sine', 98, 90, t + 0.01, 0.16, 0.08);
  }

  // A15 回去开船：吊臂收回「咔哒」
  _armOff(o, t) {
    this._hit(t, 0.025, 0.08, 'bandpass', 2800, 2600, 4, { white: true, a: 0.001 });
    this._tone('sine', 420, 300, t, 0.05, 0.06);
    this._hit(t + 0.075, 0.03, 0.06, 'bandpass', 1900, 1700, 4, { white: true, a: 0.001 });
    this._tone('sine', 300, 210, t + 0.075, 0.06, 0.06);
  }

  // A17 预告圈变金：很轻的一声「叮」
  _markGold(o, t) {
    this._tone('sine', 1568, 1566, t, 0.32, 0.024, { pan: o.pan });
    this._tone('sine', 2352, 2350, t, 0.18, 0.009, { pan: o.pan });
  }

  // A19 臂端顶到最远：软软的一下「嘣」
  _reachBump(o, t) {
    this._tone('sine', 140, 92, t, 0.12, 0.05);
    this._hit(t, 0.06, 0.025, 'lowpass', 500, 200, 1);
  }

  // A21 下不了网：被挡住 = 闷的木头「咚」；油不够 = 空油管「咕」；太深 = 测深「嘟」落下去
  _denyBlocked(o, t) {
    this._tone('sine', 190, 148, t, 0.16, 0.14);
    this._hit(t, 0.08, 0.08, 'bandpass', 520, 420, 3);
    this._tone('sine', 168, 136, t + 0.12, 0.13, 0.065);
  }

  _denyFuel(o, t) {
    const c = this.ctx;
    const os = c.createOscillator();
    os.type = 'sine';
    os.frequency.setValueAtTime(270, t);
    os.frequency.exponentialRampToValueAtTime(115, t + 0.3);
    const v = c.createOscillator();
    v.frequency.value = 17;
    const vg = c.createGain();
    vg.gain.value = 22;
    v.connect(vg).connect(os.frequency);
    const g = c.createGain();
    this._env(g, t, 0.02, 0.11, 0.3);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    os.connect(lp).connect(g).connect(this.sfx);
    os.start(t); v.start(t);
    os.stop(t + 0.4); v.stop(t + 0.4);
    this._hit(t, 0.26, 0.05, 'bandpass', 340, 300, 8);
  }

  _denyDeep(o, t) {
    this._tone('sine', 1100, 520, t, 0.36, 0.05, { rev: 0.4 });
    this._tone('sine', 1100, 520, t + 0.2, 0.3, 0.018, { rev: 0.6 });
  }

  // A22 现在不行：很轻的一声「嗒」
  _busy(o, t) {
    this._wood(t, 820, 0.04);
  }

  // —— 下网 ——
  // B01 下网：油表那一截「咔」掉，绞车松闸「嘭」，钢缆放出去的棘轮越转越快
  _netDrop(o, t) {
    this._tone('sine', 2100, 2000, t, 0.03, 0.05);
    this._hit(t, 0.02, 0.05, 'highpass', 3000, 3000, 1, { white: true, a: 0.001 });
    this._hit(t + 0.08, 0.12, 0.1, 'lowpass', 420, 120, 1);
    this._tone('sine', 120, 78, t + 0.08, 0.11, 0.1);
    let x = 0.14, iv = 0.075;
    while (x < 1.15) {
      this._hit(t + x, 0.012, 0.032, 'bandpass', 3600, 3400, 5, { white: true, a: 0.001 });
      x += iv;
      iv = Math.max(0.026, iv * 0.88);
    }
    this._tone('sawtooth', 170, 330, t + 0.15, 1.0, 0.02, { lp: 900, a: 0.1 });
  }

  // B02 网架入水：「嘭」一下砸进去，水「哗」地散开
  _splash(o, t) {
    const k = o.gain ?? 1;
    this._tone('sine', 110, 52, t, 0.25, 0.16 * k);
    this._hit(t, 0.9, 0.42 * k, 'bandpass', 2400, 300, 0.8, { white: true });
    this._hit(t + 0.05, 1.3, 0.22 * k, 'lowpass', 900, 120, 1);
    for (let i = 0; i < 7; i++) this._tone('sine', 600 + this.R() * 900, 1400 + this.R() * 600, t + 0.15 + this.R() * 0.6, 0.06, 0.035 * k);
  }

  // B03 网架沉降：闷的水压声，一串往上冒的小泡
  _sink(o, t) {
    this._hit(t, 1.3, 0.035, 'lowpass', 260, 140, 1, { a: 0.2 });
    for (let i = 0; i < 9; i++) this._blip(t + 0.1 + i * 0.13 + this.R() * 0.05, 300 + this.R() * 380, 0.016 * (1 - i / 11));
  }

  // B04 网架触底：低沉的「噗」，泥扬起来
  _touch(o, t) {
    this._tone('sine', 76, 38, t, 0.45, 0.32);
    this._hit(t, 0.6, 0.18, 'lowpass', 320, 80, 1);
    this._hit(t + 0.08, 0.9, 0.04, 'bandpass', 220, 160, 1.2, { a: 0.15 });
  }

  // B05 闭网：网裙收拢的吱呀
  _creak(o, t) {
    const c = this.ctx;
    const os = c.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(140, t);
    for (let i = 1; i < 9; i++) os.frequency.setValueAtTime(122 + this.R() * 64, t + i * 0.05);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 6;
    const g = c.createGain();
    this._env(g, t, 0.03, 0.06 * (o.gain ?? 1), 0.42);
    os.connect(bp).connect(g).connect(this._out(o));
    os.start(t);
    os.stop(t + 0.5);
  }

  // B07 起网：吃力的低音绞车，棘轮一格一格慢慢咬；越重越低越慢
  _lift(o, t) {
    const c = this.ctx;
    const dur = o.dur ?? 2.2;
    const hv = o.heavy ? 1 : 0;
    const f = 60 - hv * 12;
    const os = c.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(f * 0.8, t);
    os.frequency.linearRampToValueAtTime(f, t + 0.35);
    os.frequency.setValueAtTime(f, t + dur - 0.3);
    os.frequency.linearRampToValueAtTime(f * 0.75, t + dur);
    const wob = c.createOscillator();
    wob.frequency.value = 3.4;
    const wg = c.createGain();
    wg.gain.value = 2.5 + hv * 2;
    wob.connect(wg).connect(os.frequency);
    const sq = c.createOscillator();
    sq.type = 'square';
    sq.frequency.value = f * 2;
    const sqg = c.createGain();
    sqg.gain.value = 0.3;
    sq.connect(sqg);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 360;
    lp.Q.value = 2;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1 + hv * 0.03, t + 0.25);
    g.gain.setValueAtTime(0.1 + hv * 0.03, t + dur - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    os.connect(lp); sqg.connect(lp);
    lp.connect(g).connect(this.sfx);
    os.start(t); wob.start(t); sq.start(t);
    os.stop(t + dur + 0.1); wob.stop(t + dur + 0.1); sq.stop(t + dur + 0.1);
    const step = 0.16 + hv * 0.05;
    for (let x = 0.2; x < dur - 0.15; x += step) this._hit(t + x, 0.025, 0.028, 'bandpass', 1900, 1700, 4, { white: true, a: 0.001 });
    // 钢缆吃劲时吱一声
    for (const x of [0.6, 1.45]) if (x < dur - 0.3) this._creak({ gain: 0.6 + hv * 0.4 }, t + x);
    this._tone('sine', 150, 90, t + dur - 0.05, 0.09, 0.08);
  }

  // B08 网包出水：水哗地泻下来
  _surface(o, t) {
    this._hit(t, 1.1, 0.3, 'bandpass', 600, 2200, 0.7, { white: true });
    this._hit(t + 0.1, 1.4, 0.12, 'lowpass', 1200, 300, 1, { a: 0.1 });
    for (let i = 0; i < 10; i++) this._tone('sine', 300 + this.R() * 400, 900 + this.R() * 900, t + this.R() * 0.8, 0.08, 0.045);
  }

  // B09 网包转回甲板：一路滴泥水
  _drip(o, t) {
    const dur = o.dur ?? 1.1;
    const n = Math.round(dur * 9);
    for (let i = 0; i < n; i++) {
      const f = 1300 + this.R() * 1300;
      this._tone('sine', f, f * 0.55, t + this.R() * dur, 0.025, 0.012 + this.R() * 0.014);
    }
  }

  // B10 松闸：铁件「咔」一下，绳子「嗖」地一松（网包这才往下掉）
  _release(o, t) {
    const k = o.heavy ? 1.25 : 1;
    this._tone('square', 900, 620, t, 0.03, 0.03 * k, { lp: 3000 });
    this._hit(t, 0.03, 0.08 * k, 'bandpass', 2400, 1800, 4, { white: true, a: 0.001 });
    this._hit(t + 0.03, 0.24, 0.05 * k, 'bandpass', 1900, 480, 2, { a: 0.02 });
  }

  // B10 网包砸上甲板：「咚」（越沉越低、越长）+ 湿泥的「啪」+ 甲板木头一闷 + 船上的东西跟着一跳「咔啦」
  _land(o, t) {
    const k = o.gain ?? 1;
    const m = o.mass ?? 0.8;
    this._tone('sine', 104 - m * 18, 42 - m * 8, t, 0.3 + m * 0.18, 0.42 * k);
    this._tone('sine', 62, 30, t, 0.22 + m * 0.2, 0.26 * k * m);
    this._hit(t, 0.24, 0.24 * k, 'lowpass', 1100, 140, 1);
    this._hit(t + 0.015, 0.13, 0.17 * k, 'bandpass', 1400, 600, 1.2, { white: true });
    this._hit(t + 0.08, 0.2, 0.07 * k, 'bandpass', 700, 300, 1.5);
    this._wood(t + 0.01, 180, 0.05 * k * m);
    for (let i = 0; i < 3; i++) this._wood(t + 0.05 + i * 0.03 + this.R() * 0.02, 600 + this.R() * 500, 0.012 * k);
  }

  // C05 珍贵网包落下：低一个八度的「咚」，紧跟着甲板木头吱嘎
  _heavyLand(o, t) {
    const c = this.ctx;
    this._tone('sine', 56, 25, t, 0.95, 0.62);
    this._tone('sine', 112, 50, t, 0.3, 0.2);
    this._hit(t, 0.5, 0.3, 'lowpass', 650, 60, 1);
    this._hit(t + 0.02, 0.16, 0.14, 'bandpass', 1100, 500, 1.2, { white: true });
    const os = c.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(82, t + 0.14);
    for (let i = 1; i < 14; i++) os.frequency.setValueAtTime(70 + this.R() * 32, t + 0.14 + i * 0.06);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 430;
    bp.Q.value = 5;
    const g = c.createGain();
    this._env(g, t + 0.14, 0.08, 0.07, 0.85);
    os.connect(bp).connect(g).connect(this.sfx);
    os.start(t + 0.14);
    os.stop(t + 1.2);
  }

  // B12 冲洗：一块泥壳掉下去「噗」
  _mudChunk(o, t) {
    const k = o.gain ?? 1;
    this._hit(t, 0.14, 0.075 * k, 'lowpass', 650, 150, 1);
    this._tone('sine', 150, 80, t, 0.08, 0.05 * k);
  }

  // B12 最后一层泥滑下去「唰——啪」
  _mudSlide(o, t) {
    this._hit(t, 0.22, 0.06, 'bandpass', 1300, 420, 1, { a: 0.03 });
    this._hit(t + 0.2, 0.09, 0.13, 'bandpass', 950, 700, 1, { white: true, a: 0.002 });
    this._tone('sine', 190, 90, t + 0.2, 0.08, 0.09);
  }

  // B14 揭晓那一下：剩下的泥壳崩开，湿泥「啪」比冲洗时任何一块都响，泥块落地一串「噗噗」，水「哗」
  _burst(o, t) {
    const k = o.heavy ? 1.25 : o.empty ? 0.6 : 1;
    this._hit(t, 0.1, 0.2 * k, 'bandpass', 1600, 700, 1, { white: true, a: 0.002 });
    this._hit(t, 0.32, 0.18 * k, 'lowpass', 900, 120, 1, { a: 0.004 });
    this._tone('sine', 170, 70, t, 0.18, 0.16 * k);
    for (let i = 0; i < 6; i++) this._hit(t + 0.22 + this.R() * 0.35, 0.08, 0.04 * k, 'lowpass', 600, 150, 1);
    this._hit(t + 0.02, 0.5, 0.06 * k, 'bandpass', 3000, 1200, 0.8, { white: true, a: 0.02 });
  }

  // B14 揭晓：一记低鼓（比银币匣的底鼓轻），一个低音垫着，和弦按件数两到四音往上走；值钱的再多一层亮的
  _reveal(o, t) {
    this._tone('sine', 98, 46, t, 0.5, 0.3);
    this._hit(t, 0.05, 0.05, 'lowpass', 2000, 600, 1, { a: 0.001 });
    this._tone('triangle', 130.8, 130.8, t + 0.02, 1.4, 0.05, { dest: this.mus, rev: 0.3 });
    const notes = [523.3, 659.3, 784, 1046.5];
    const n = Math.min(4, Math.max(2, o.n || 2));
    // o.up：往上移几个半音（一甲板一起冲时一包比一包高）
    const tr = Math.pow(2, (o.up || 0) / 12);
    for (let i = 0; i < n; i++) {
      const f = notes[i] * tr;
      const tt = t + 0.06 + i * 0.085;
      this._tone('sine', f, f, tt, 1.3, 0.09, { rev: 0.25 });
      this._tone('sine', f * 4, f * 4, tt, 0.14, 0.02);
      this._tone('triangle', f * 2, f * 2, tt, 0.45, 0.028);
    }
    if ((o.best || 0) >= 140) [1568, 2093].forEach((f, i) => this._tone('sine', f, f, t + 0.06 + n * 0.085 + i * 0.07, 0.9, 0.04, { rev: 0.4 }));
  }

  // B14 价值的红绸挂上：布「唰」一下，一声小小的「叮」
  _ribbon(o, t) {
    const k = o.heavy ? 1.3 : 1;
    this._hit(t, 0.12, 0.05 * k, 'bandpass', 2200, 900, 1.5, { white: true, a: 0.01 });
    this._tone('sine', 2637, 2630, t + 0.1, 0.35, 0.04 * k, { rev: 0.3 });
    this._tone('sine', 3951, 3940, t + 0.13, 0.2, 0.015 * k);
  }

  // B14 每挂一张名牌「嗒」，一张比一张高
  _card(o, t) {
    const f = 700 * Math.pow(2, ((o.i || 0) * 3) / 12);
    this._wood(t, f, 0.06);
  }

  // B15 空网：一声低的「噗」
  _dud(o, t) {
    this._hit(t, 0.3, 0.12, 'lowpass', 420, 90, 1);
    this._tone('sine', 150, 70, t, 0.3, 0.1);
    this._tone('triangle', 330, 330, t + 0.28, 0.16, 0.022);
    this._tone('triangle', 247, 247, t + 0.44, 0.3, 0.022);
  }

  // B19 收获落进货格子「嗒」，一件比一件高
  _fly(o, t) {
    const f = 1046 * Math.pow(2, ((o.i || 0) * 2) / 12);
    this._tone('sine', f, f, t, 0.08, 0.05);
    this._tone('square', f / 2, f / 2, t, 0.02, 0.01);
    this._tone('sine', 230, 160, t, 0.06, 0.04);
  }

  // B20 搬进舱「咚」，舱口一点灰
  _stow(o, t) {
    this._tone('sine', 150, 70, t, 0.22, 0.15);
    this._hit(t, 0.25, 0.06, 'bandpass', 260, 240, 6);
    this._hit(t + 0.05, 0.3, 0.012, 'highpass', 4000, 3000, 1, { white: true });
  }

  // C09 银币匣入舱：更沉的「咚」，带一点银光的声音
  _stowHeavy(o, t) {
    this._tone('sine', 95, 42, t, 0.45, 0.3);
    this._hit(t, 0.4, 0.08, 'bandpass', 180, 160, 6);
    for (let i = 0; i < 5; i++) {
      const f = 2600 + i * 380;
      this._tone('sine', f, f, t + 0.08 + i * 0.045, 0.6, 0.016, { rev: 0.4 });
    }
  }

  // B22 旧货往两边滑开
  _slide(o, t) {
    this._hit(t, 0.3, 0.035, 'bandpass', 600, 900, 2, { a: 0.03 });
    this._tone('sine', 90, 70, t, 0.2, 0.03);
  }

  // B23 刮到埋着的硬东西：网架「当」，木头闷一下
  _clank(o, t) {
    for (const [f, a] of [[320, 0.22], [517, 0.16], [873, 0.1], [1290, 0.07]]) this._tone('sine', f, f * 0.98, t, 0.6, a);
    this._hit(t, 0.12, 0.26, 'bandpass', 1800, 800, 2, { white: true });
    this._tone('sine', 160, 110, t + 0.01, 0.15, 0.12);
  }

  // —— 一甲板一起冲·乙「一舷大水」——
  // 扳开泵闸：闸杆「咔」一下、铁闸门「哐」地弹开，泵一下吼起来
  _pumpGate(o, t) {
    this._wood(t, 210, 0.16);
    this._hit(t + 0.02, 0.08, 0.2, 'bandpass', 2400, 1200, 3, { white: true, a: 0.001 });
    for (const [f, a] of [[230, 0.2], [371, 0.14], [610, 0.08], [980, 0.05]]) this._tone('sine', f, f * 0.97, t + 0.06, 0.5, a);
    this._tone('sine', 120, 70, t + 0.06, 0.2, 0.14);
    this._hit(t + 0.1, 0.9, 0.16, 'lowpass', 300, 900, 1, { a: 0.12 });
  }

  // 一整面水扫过甲板：「轰——」由低到高涌上来，扫到头的时候最满
  _surge(o, t) {
    const d = o.dur || 1.5;
    this._hit(t, d + 0.4, 0.38, 'bandpass', 380, 1900, 0.7, { white: true, a: 0.18 });
    this._hit(t, d + 0.6, 0.3, 'lowpass', 220, 520, 1, { a: 0.25 });
    this._tone('sine', 58, 44, t, d, 0.16);
    for (let i = 0; i < 12; i++) this._tone('sine', 500 + this.R() * 1100, 1300 + this.R() * 700, t + 0.2 + this.R() * d, 0.05, 0.03);
  }

  // 水墙撞上一包：泥「啪」地被掀掉一层；o.hard：最贵那一包，水撞上去冲不动，「嘭」地高高溅起
  _surgeHit(o, t) {
    const k = o.hard ? 1.3 : 1;
    this._hit(t, 0.14, 0.2 * k, 'bandpass', 1500, 600, 1, { white: true, a: 0.002 });
    this._tone('sine', o.hard ? 95 : 150, o.hard ? 50 : 80, t, 0.18, 0.15 * k);
    if (o.hard) this._hit(t + 0.03, 0.7, 0.22, 'bandpass', 2600, 500, 0.8, { white: true });
  }

  // 水墙撞上船头栏杆碎开、翻出船外
  _surgeCrash(o, t) {
    this._tone('sine', 90, 40, t, 0.4, 0.2);
    this._hit(t, 1.3, 0.42, 'bandpass', 2800, 260, 0.8, { white: true });
    this._hit(t + 0.05, 1.6, 0.26, 'lowpass', 1100, 120, 1);
    for (let i = 0; i < 10; i++) this._tone('sine', 600 + this.R() * 900, 1400 + this.R() * 600, t + 0.2 + this.R() * 0.9, 0.06, 0.03);
  }

  // —— 一甲板一起冲·丙「连环崩」——
  // 裂纹顺着甲板一路跑过去：一串「咔咔咔」，越往后的那一串越密、越高
  _crackRun(o, t) {
    const d = Math.max(0.12, o.dur || 0.5);
    const up = o.up || 0;
    const n = Math.round(5 + d * 14);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const tt = t + d * (u * 0.7 + u * u * 0.3);
      this._wood(tt, (380 + up * 40) * (1 + u * 0.6) * (0.9 + this.R() * 0.2), 0.05 + 0.03 * u);
    }
  }

  // 裂纹跑到一包上：泥壳「咔嚓」裂开
  _crackPop(o, t) {
    const k = 1 + (o.up || 0) * 0.08;
    this._hit(t, 0.06, 0.24 * k, 'bandpass', 3200, 1500, 2, { white: true, a: 0.001 });
    this._wood(t + 0.01, 260, 0.14);
    this._tone('sine', 140, 70, t, 0.12, 0.1);
  }

  // 传到压轴那一包：整条船一顿——一声极低的闷响，船板「吱——」地一呻吟，然后静了一拍
  _shipHalt(o, t) {
    this._tone('sine', 44, 22, t, 1.4, 0.7);
    this._tone('sine', 88, 40, t, 0.4, 0.24);
    this._hit(t, 0.6, 0.32, 'lowpass', 500, 50, 1);
    const c = this.ctx;
    const os = c.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(64, t + 0.12);
    for (let i = 1; i < 16; i++) os.frequency.setValueAtTime(52 + this.R() * 26, t + 0.12 + i * 0.07);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 360;
    bp.Q.value = 6;
    const g = c.createGain();
    this._env(g, t + 0.12, 0.1, 0.06, 1.0);
    os.connect(bp).connect(g).connect(this.sfx);
    os.start(t + 0.12);
    os.stop(t + 1.4);
  }

  // —— 珍贵 ——
  // C03 第一眼看见沉船：低音弦乐一个短动机，远处木头吱嘎
  _wreckMotif(o, t) {
    const c = this.ctx;
    const voice = (f, t0, dur, peak) => {
      for (const det of [-7, 6]) {
        const os = c.createOscillator();
        os.type = 'sawtooth';
        os.frequency.value = f;
        os.detune.value = det;
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(220, t0);
        lp.frequency.exponentialRampToValueAtTime(900, t0 + dur * 0.45);
        lp.frequency.exponentialRampToValueAtTime(300, t0 + dur);
        const g = c.createGain();
        g.gain.value = 0.0001;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + 0.55);
        g.gain.setValueAtTime(peak, t0 + dur - 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        os.connect(lp).connect(g).connect(this._out({ dest: this.mus, rev: 0.5 }));
        os.start(t0);
        os.stop(t0 + dur + 0.1);
      }
    };
    voice(73.4, t, 2.0, 0.095);
    voice(110, t + 0.05, 2.0, 0.08);
    voice(87.3, t + 1.4, 2.4, 0.09);
    voice(130.8, t + 1.45, 2.4, 0.075);
    voice(146.8, t + 1.9, 1.9, 0.045);
    // 远处木头的吱嘎
    const os = c.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(95, t + 0.9);
    for (let i = 1; i < 16; i++) os.frequency.setValueAtTime(80 + this.R() * 40, t + 0.9 + i * 0.07);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 380;
    bp.Q.value = 7;
    const g = c.createGain();
    this._env(g, t + 0.9, 0.2, 0.07, 1.0);
    os.connect(bp).connect(g).connect(this._out({ rev: 0.8 }));
    os.start(t + 0.9);
    os.stop(t + 2.2);
  }

  // C12 远处深槽里冒上来一大团气：一串闷的「咕嘟」越来越密，到水面「噗」地散开
  _glugFar(o, t) {
    const k = o.gain ?? 1;
    for (let i = 0; i < 12; i++) {
      const t0 = t + 0.25 + i * (0.16 - i * 0.008) + this.R() * 0.05;
      const f = 150 + this.R() * 140;
      this._tone('sine', f, f * 2.6, t0, 0.09, 0.09 * k, { pan: o.pan, rev: 0.6, a: 0.004, lp: 800 });
    }
    this._hit(t + 1.9, 0.7, 0.07 * k, 'bandpass', 900, 420, 0.8, { white: true, pan: o.pan, rev: 0.5, a: 0.04 });
    this._hit(t + 1.9, 0.5, 0.06 * k, 'lowpass', 300, 120, 1, { pan: o.pan, a: 0.02 });
  }

  // C04 蟹翻出印章：远处很轻的「叮」
  _pingFar(o, t) {
    // 隔着水、远远的：一声干净的「叮」，过一下一点回声
    for (const [dt, k] of [[0, 1], [0.38, 0.32]]) {
      this._tone('sine', 2093, 2090, t + dt, 0.9, 0.075 * k, { rev: 0.8, pan: o.pan });
      this._tone('sine', 3140, 3136, t + dt, 0.35, 0.022 * k, { rev: 0.8, pan: o.pan });
    }
  }

  // C06 珍贵物露头：清脆的金属「叮」
  _peek(o, t) {
    this._hit(t, 0.015, 0.05, 'highpass', 5000, 5000, 1, { white: true, a: 0.001 });
    this._tone('sine', 2350, 2300, t, 0.6, 0.12);
    this._tone('sine', 3520, 3480, t, 0.35, 0.05);
    this._tone('sine', 5900, 5850, t, 0.12, 0.015);
  }

  // C07 确认 0 ms：盖子弹开「咔」
  _lidPop(o, t) {
    this._tone('sine', 1700, 1150, t, 0.05, 0.07);
    this._hit(t, 0.03, 0.06, 'bandpass', 2600, 2000, 3, { white: true, a: 0.001 });
    this._tone('sine', 600, 420, t + 0.06, 0.08, 0.04);
  }

  // C07 0—150 ms：一下很低的底鼓
  _kick(o, t) {
    this._tone('sine', 62, 30, t, 0.55, 0.55);
    this._tone('sine', 140, 60, t, 0.06, 0.15);
    this._hit(t, 0.03, 0.06, 'lowpass', 2500, 800, 1, { a: 0.001 });
  }

  // C07 250 ms：号角和弦慢慢打开 + 钟声琶音
  // o.k：整体轻一点（收获单里银币匣再响一回，是回想，不能比 C07 那一下重）
  _fanfare(o, t) {
    const c = this.ctx;
    const k = o.k ?? 1;
    this._hit(t, 1.6, 0.13 * k, 'bandpass', 300, 3000, 0.7, { white: true, a: 0.2 });
    const chord = [196, 246.9, 293.7, 392, 493.9];
    for (const f of chord) {
      for (const det of [-5, 5]) {
        const os = c.createOscillator();
        os.type = 'sawtooth';
        os.frequency.value = f;
        os.detune.value = det;
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(320, t);
        lp.frequency.exponentialRampToValueAtTime(2800, t + 0.7);
        lp.frequency.exponentialRampToValueAtTime(700, t + 3.6);
        const g = c.createGain();
        g.gain.value = 0.0001;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.03 * k, t + 0.2);
        g.gain.setValueAtTime(0.03 * k, t + 1.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);
        os.connect(lp).connect(g).connect(this._out({ dest: this.mus, rev: 0.3 }));
        os.start(t);
        os.stop(t + 4.1);
      }
    }
    const bells = [784, 987.8, 1174.7, 1568, 1975.5, 2349.3];
    bells.forEach((f, i) => {
      this._tone('sine', f, f, t + 0.1 + i * 0.075, 1.6, 0.085 * k, { dest: this.mus, rev: 0.35 });
      this._tone('sine', f * 2.01, f * 2.01, t + 0.1 + i * 0.075, 0.6, 0.025 * k, { dest: this.mus });
    });
  }

  // C07 撒币：跟着落地的硬币一枚枚响
  _coins(o, t) {
    const n = o.n || 18;
    for (let i = 0; i < n; i++) {
      const f = 2600 + this.R() * 2400;
      const tt = t + Math.pow(this.R(), 0.7) * (o.dur || 0.8);
      this._tone('sine', f, f * 0.99, tt, 0.22, 0.045);
      this._tone('sine', f * 1.5, f * 1.48, tt, 0.08, 0.012);
    }
  }

  // C07 700 ms 后：船员欢呼和口哨
  _cheer(o, t) {
    const c = this.ctx;
    const nv = o.n || 4;
    // far：隔着甲板从上面传下来（开舱清点时船员在上面叫好）——闷一点、轻一点
    let dest;
    if (o.far) {
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const fg = c.createGain();
      fg.gain.value = 0.7;
      lp.connect(fg).connect(this.sfx);
      dest = lp;
    }
    for (let i = 0; i < nv; i++) {
      const tt = t + i * 0.09 + this.R() * 0.05;
      const f0 = 170 + i * 28;
      const os = c.createOscillator();
      os.type = 'sawtooth';
      os.frequency.setValueAtTime(f0, tt);
      os.frequency.linearRampToValueAtTime(f0 * 1.35, tt + 0.12);
      os.frequency.linearRampToValueAtTime(f0 * 1.1, tt + 0.32);
      const f1 = c.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 760 + i * 40;
      f1.Q.value = 5;
      const f2 = c.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.value = 1250 + i * 60;
      f2.Q.value = 6;
      const g = c.createGain();
      this._env(g, tt, 0.03, 0.09, 0.3);
      os.connect(f1).connect(g);
      os.connect(f2).connect(g);
      g.connect(this._out({ pan: (i - 1.5) * 0.35, dest }));
      os.start(tt);
      os.stop(tt + 0.4);
    }
    // 口哨（只有一两个人叫好时不吹）
    if (nv < 4) return;
    const w = c.createOscillator();
    w.type = 'sine';
    const tw = t + 0.35;
    w.frequency.setValueAtTime(1850, tw);
    w.frequency.exponentialRampToValueAtTime(2750, tw + 0.22);
    w.frequency.exponentialRampToValueAtTime(2250, tw + 0.6);
    const vib = c.createOscillator();
    vib.frequency.value = 6;
    const vg = c.createGain();
    vg.gain.value = 30;
    vib.connect(vg).connect(w.frequency);
    const g = c.createGain();
    this._env(g, tw, 0.05, 0.035, 0.6);
    w.connect(g).connect(this._out({ pan: 0.4, dest }));
    w.start(tw); vib.start(tw);
    w.stop(tw + 0.75); vib.stop(tw + 0.75);
  }

  // C08 匣里银币一闪
  _glimmer(o, t) {
    const f = 3000 + this.R() * 1300;
    this._tone('sine', f, f, t, 0.3, 0.012, { rev: 0.4 });
  }

  // F09 同款对上：两只并在一起「叮」（五度）
  // o.k：整体轻一点（收获单里一趟可能对上好几对，每对都这么亮会盖过压轴）
  _match(o, t) {
    const k = o.k ?? 1;
    this._tone('sine', 1318.5, 1318, t, 0.9, 0.13 * k, { rev: 0.3 });
    this._tone('sine', 1975.5, 1975, t + 0.07, 0.9, 0.1 * k, { rev: 0.3 });
    this._tone('sine', 2637, 2636, t + 0.14, 0.5, 0.04 * k);
    this._wood(t, 1500, 0.05 * k);
  }

  // F02 第一次进账：货格子落定「咚」
  _tallyDrop(o, t) {
    this._tone('sine', 140, 72, t, 0.16, 0.12);
    this._wood(t, 520, 0.035);
  }

  // —— 大轮廓、心跳 ——
  // C10 大轮廓离船最近：一声很远的、像鲸又不像鲸的长音
  _levCall(o, t) {
    const c = this.ctx;
    const os = c.createOscillator();
    os.type = 'triangle';
    os.frequency.setValueAtTime(175, t);
    os.frequency.exponentialRampToValueAtTime(118, t + 2.6);
    os.frequency.exponentialRampToValueAtTime(146, t + 4.4);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 300;
    bp.Q.value = 3;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    os.connect(bp).connect(g).connect(this._out({ dest: this.mus, rev: 0.9 }));
    os.start(t);
    os.stop(t + 5.1);
  }

  // —— 收工、收获单 ——
  // C14 吊臂收回原位：液压往下「嗡」，落定一声
  _craneStow(o, t) {
    this._tone('sawtooth', 140, 88, t, 1.1, 0.09, { lp: 620, a: 0.1 });
    this._tone('sine', 160, 92, t + 1.15, 0.14, 0.24);
    this._hit(t + 1.15, 0.06, 0.13, 'bandpass', 1200, 900, 2);
  }

  // C14 这一趟到头了：两个往下落的音
  _endCadence(o, t) {
    this._tone('triangle', 392, 392, t, 1.3, 0.13, { dest: this.mus, rev: 0.45 });
    this._tone('triangle', 261.6, 261.6, t + 0.42, 2.0, 0.14, { dest: this.mus, rev: 0.45 });
    this._tone('sine', 130.8, 130.8, t + 0.42, 2.0, 0.1, { dest: this.mus });
  }

  // C15 货单滑进来：纸「唰」+ 一个暖的长和声（和揭晓的和弦不一样）
  _sheet(o, t) {
    const c = this.ctx;
    this._hit(t, 0.35, 0.06, 'bandpass', 2600, 1000, 1.2, { white: true, a: 0.04 });
    for (const f of [174.6, 220, 261.6, 349.2]) {
      const os = c.createOscillator();
      os.type = 'sawtooth';
      os.frequency.value = f;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      const g = c.createGain();
      g.gain.value = 0.0001;
      g.gain.setValueAtTime(0.0001, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.022, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      os.connect(lp).connect(g).connect(this._out({ dest: this.mus, rev: 0.3 }));
      os.start(t + 0.15);
      os.stop(t + 2.9);
    }
  }

  // C15 每写一行「沙」
  _pen(o, t) {
    const c = this.ctx;
    const n = this._noise(true);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3300 + this.R() * 600;
    bp.Q.value = 1.4;
    const g = c.createGain();
    const am = c.createOscillator();
    am.frequency.value = 22;
    const ag = c.createGain();
    ag.gain.value = 0.04;
    am.connect(ag).connect(g.gain);
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.02);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.17);
    n.connect(bp).connect(g).connect(this.sfx);
    n.start(t); am.start(t);
    n.stop(t + 0.2); am.stop(t + 0.2);
  }

  // C15 总价往上跳：算盘珠子一颗颗
  _bead(o, t) {
    const f = 1250 + ((o.i || 0) % 3) * 90;
    this._tone('sine', f, f * 0.9, t, 0.03, 0.1);
    this._hit(t, 0.012, 0.055, 'bandpass', 2600, 2600, 6, { white: true, a: 0.001 });
  }

  // C15 盖上入舱章「啪」：章砸在纸上那一下要实——低的一沉、纸面「啪」、底下木头一响；
  // 跟着一个落定的和弦（这一趟算数了）：比每一网的揭晓宽、慢、低，不抢银币匣的号角
  _stamp(o, t) {
    this._tone('sine', 150, 52, t, 0.24, 0.5);
    this._hit(t, 0.07, 0.4, 'bandpass', 1100, 700, 0.9, { white: true, a: 0.001 });
    this._hit(t + 0.005, 0.18, 0.16, 'lowpass', 900, 160, 1);
    this._wood(t + 0.01, 420, 0.12);
    this._tone('sine', 65.4, 65.4, t + 0.1, 1.9, 0.12, { dest: this.mus });
    [261.6, 329.6, 392, 523.3].forEach((f, i) => {
      const tt = t + 0.12 + i * 0.05;
      this._tone('triangle', f, f, tt, 2.2, 0.045, { dest: this.mus, rev: 0.35 });
      this._tone('sine', f * 2, f * 2, tt, 1.4, 0.03, { rev: 0.3 });
    });
  }

  // —— C14 / C15 / C16 开舱清点 ——
  // C14 往舱口扎下去：风一收，木头一声闷的「咚」，舱里的回声
  _hatchDive(o, t) {
    this._hit(t, 0.7, 0.07, 'bandpass', 2400, 380, 0.9, { white: true, a: 0.25 });
    this._tone('sine', 120, 62, t + 0.55, 0.5, 0.16, { rev: 0.5 });
    this._wood(t + 0.56, 210, 0.05, { rev: 0.4 });
  }

  // C15 进舱：闷的木头吱嘎两声，舱外的水拍着船板，底下一个暖的低音垫着
  _holdIn(o, t) {
    const c = this.ctx;
    for (const [dt, f] of [[0.1, 92], [0.9, 74]]) {
      const os = c.createOscillator();
      os.type = 'sawtooth';
      os.frequency.setValueAtTime(f, t + dt);
      for (let i = 1; i < 10; i++) os.frequency.setValueAtTime(f * (0.85 + this.R() * 0.3), t + dt + i * 0.05);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 520;
      bp.Q.value = 4;
      const g = c.createGain();
      this._env(g, t + dt, 0.06, 0.05, 0.5);
      os.connect(bp).connect(g).connect(this._out({ rev: 0.35 }));
      os.start(t + dt);
      os.stop(t + dt + 0.7);
    }
    for (let i = 0; i < 3; i++) this._hit(t + 0.35 + i * 0.7 + this.R() * 0.2, 0.35, 0.05, 'lowpass', 520, 160, 1, { a: 0.06 });
    for (const f of [98, 146.8, 196]) this._tone('triangle', f, f, t + 0.05, 3.2, 0.03, { dest: this.mus, rev: 0.4, a: 0.6 });
  }

  // C15 一件落到帆布上：一声闷的「咚」（越沉越低），叠一声往上走的木琴音——一件比一件高，越落越亮
  _tallyLand(o, t) {
    const m = o.mass ?? 0.6;
    this._tone('sine', 120 - m * 30, 48, t, 0.18 + m * 0.12, 0.3);
    this._hit(t, 0.12, 0.13, 'lowpass', 900, 160, 1, { a: 0.002 });
    this._hit(t + 0.01, 0.08, 0.05, 'bandpass', 1500, 900, 1.2, { white: true, a: 0.002 });
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const i = Math.min(scale.length - 1, o.i || 0);
    const f = 392 * Math.pow(2, scale[i] / 12);
    this._tone('triangle', f, f, t + 0.02, 0.45, 0.07, { rev: 0.25 });
    this._tone('sine', f * 2, f * 2, t + 0.02, 0.18, 0.03);
  }

  // C15 价值进了总数：铜钱落进钱匣「叮当」；压轴那一笔是一串
  _coinIn(o, t) {
    const n = o.big ? 9 : 2;
    for (let i = 0; i < n; i++) {
      const tt = t + i * (o.big ? 0.05 : 0.045) + this.R() * 0.015;
      const f = 2300 + this.R() * 1400 + (o.i || 0) * 40;
      this._tone('sine', f, f * 0.985, tt, o.big ? 0.4 : 0.25, o.big ? 0.05 : 0.06);
      this._tone('sine', f * 1.52, f * 1.5, tt, 0.08, 0.015);
    }
    this._tone('sine', 660, 640, t, 0.06, 0.03);
  }

  // C15 压轴之前：光亮起来的那一下——一阵往上走的微光，低音拖住，四下静下来
  _tallyRise(o, t) {
    const c = this.ctx;
    const k = o.heavy ? 1 : 0.6;
    this._hit(t, 0.85, 0.06 * k, 'bandpass', 600, 4200, 2.5, { white: true, a: 0.7 });
    const os = c.createOscillator();
    os.type = 'sine';
    os.frequency.setValueAtTime(220, t);
    os.frequency.exponentialRampToValueAtTime(440, t + 0.85);
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06 * k, t + 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    os.connect(g).connect(this._out({ dest: this.mus, rev: 0.4 }));
    os.start(t);
    os.stop(t + 1.0);
    this._tone('sine', 55, 55, t, 1.0, 0.12 * k, { a: 0.4, dest: this.mus });
  }

  // C15 总数落定：低的一砸 + 入舱章「啪」+ 落定的和弦（银币匣那一趟和弦更宽、多一层亮的钟）
  _tallyTotal(o, t) {
    this._tone('sine', 72, 34, t, 0.7, 0.4);
    this._stamp(o, t + 0.02);
    if (o.big) [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => this._tone('sine', f, f, t + 0.18 + i * 0.06, 1.5, 0.045, { dest: this.mus, rev: 0.4 }));
  }

  // C15 一件都没有：一声闷的空舱回声
  _tallyEmpty(o, t) {
    this._tone('sine', 110, 70, t, 0.6, 0.16, { rev: 0.6 });
    this._wood(t + 0.02, 240, 0.05, { rev: 0.5 });
    this._tone('triangle', 196, 196, t + 0.3, 1.4, 0.03, { dest: this.mus, rev: 0.5 });
  }

  // C15 这一趟做到的事一条条出来：轻的木头「嗒」，一条比一条高
  _deed(o, t) {
    const f = 880 * Math.pow(2, ((o.i || 0) * 4) / 12);
    this._wood(t, f, 0.05);
  }

  // C16 舱盖拉上：木头在槽里「嘎——」地滑过去，「咚」地合上，舱里一下闷住
  _hatchShut(o, t) {
    this._hit(t, 0.62, 0.09, 'bandpass', 380, 900, 3, { a: 0.08 });
    const c = this.ctx;
    const os = c.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(70, t);
    for (let i = 1; i < 12; i++) os.frequency.setValueAtTime(62 + this.R() * 26, t + i * 0.05);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 460;
    bp.Q.value = 5;
    const g = c.createGain();
    this._env(g, t, 0.05, 0.05, 0.6);
    os.connect(bp).connect(g).connect(this.sfx);
    os.start(t);
    os.stop(t + 0.7);
    this._tone('sine', 110, 40, t + 0.66, 0.45, 0.4);
    this._hit(t + 0.66, 0.2, 0.18, 'lowpass', 800, 120, 1, { a: 0.002 });
    this._wood(t + 0.67, 170, 0.1, { rev: 0.5 });
  }

  // C16 货单被抽走：纸往上「唰」一下
  _sheetOut(o, t) {
    this._hit(t + 0.12, 0.3, 0.1, 'bandpass', 1600, 4200, 1.1, { white: true, a: 0.14 });
    this._hit(t + 0.1, 0.08, 0.05, 'bandpass', 900, 700, 1.5, { white: true, a: 0.01 });
  }

  // C16 黑场里一道浪涌上来又退下
  _waveSwell(o, t) {
    this._hit(t, 1.7, 0.13, 'bandpass', 480, 380, 0.8, { a: 0.7 });
    this._hit(t + 0.4, 1.4, 0.05, 'highpass', 2200, 1500, 0.7, { white: true, a: 0.5 });
  }

  // —— 局外 ——
  // D01 暂停：闷的「咔」；关上反过来
  _pauseOn(o, t) {
    this._tone('sine', 300, 170, t, 0.09, 0.26);
    this._tone('triangle', 150, 95, t, 0.07, 0.1);
    this._hit(t, 0.05, 0.18, 'lowpass', 1300, 400, 1, { white: true, a: 0.001 });
  }

  _pauseOff(o, t) {
    this._tone('sine', 210, 340, t, 0.07, 0.2);
    this._hit(t, 0.035, 0.14, 'bandpass', 1800, 1500, 2, { white: true, a: 0.001 });
  }

  // D02 菜单挪一格：木头「嗒」
  _menu(o, t) {
    this._wood(t, 1000, 0.12);
  }

  // D02 菜单选中
  _menuGo(o, t) {
    this._wood(t, 900, 0.12);
    this._wood(t + 0.07, 1350, 0.12);
  }

  // D03 调音量：放一声海浪试听
  _waveTaste(o, t) {
    this._hit(t, 0.85, 0.15, 'bandpass', 600, 900, 0.8, { a: 0.18 });
    this._hit(t + 0.15, 0.6, 0.04, 'highpass', 2500, 1800, 0.7, { white: true, a: 0.2 });
  }

  // D04 接管：轻的确认
  _takeover(o, t) {
    this._tone('triangle', 523.3, 523.3, t, 0.22, 0.2);
    this._tone('triangle', 784, 784, t + 0.09, 0.38, 0.19, { rev: 0.3 });
    this._wood(t, 700, 0.08);
  }

  // D05 倒计时走满：按钮按下去
  _press(o, t) {
    this._wood(t, 760, 0.05);
    this._tone('sine', 120, 70, t, 0.1, 0.08);
  }
}

// —— 录像：把一段调用日志在离线的 AudioContext 里重放成声音 ——
export async function renderLog(log, dur, rate = 48000) {
  const off = new OfflineAudioContext(2, Math.ceil(dur * rate), rate);
  const a = new Audio();
  a.prepare(off);
  for (const e of log) {
    if (e.t > dur) break;
    a.tOff = e.t;
    if (e.m === 'restore') a.restore(e.a[0]);
    else if (PUBLIC.includes(e.m)) a[e.m](...e.a);
  }
  return off.startRendering();
}

export function toWav(buf) {
  const ch = buf.numberOfChannels, len = buf.length, rate = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  w(36, 'data'); out.setUint32(40, len * ch * 2, true);
  const data = [];
  for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v * 32767, true); o += 2; }
  return out.buffer;
}
