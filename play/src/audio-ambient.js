// 环境底（第十一批「站着看也好看」）：一直在响的几样，全部程序生成，全走 A.bed（珍品确认前跟着一起抽空）。
//   A2 机声：柴油机一下一下地“突、突、突”（点火的节拍跟着转速走：怠速慢、全速密），转速跟着油门、有惯性（src/game/wake.js 的 rpm），
//           推油门那一下机器吃力（load）——声音变粗、变亮、多一层闷吼；松了油门转速先掉下来，船还在往前滑
//      海声：底下一层长长的涌（两条很慢的起伏叠着，不是一个节拍），上面一层碎浪的沙沙；停着时浪一下下拍船身，开起来船身刷水的嘶声跟着船速；
//           船头压进浪里那一下“哗”（wake.js 数着）
//      电机：吊臂一动，继电器“咔哒”一声，电机呜地转起来（音高跟着转速往上走），停时呜地落下去、再“咔哒”
//   A3 和弦：每 7–9 秒一个，锯齿过低通，滤波器慢慢打开又合上（3.6 秒开到最亮），底下一阵风声从左吹到右；
//           揭晓的时候给揭晓让路（压到两成，揭晓完慢慢回来），揭晓、收工时不起新的和弦
// 状态快照：每帧的 update 先把游戏里要用的几样（船速、转速、吃力、吊臂转得多快、要不要让路、第几个和弦、第几下船头压浪）记成一个小对象，
//   再按它发声。效果单离线配声音时记下每帧的快照、原样重放——和弦、压浪、电机“咔哒”落在同一帧上。
import { fxTag } from './fx/tags.js';

const CHORDS = [[146.83, 220.0, 261.63, 349.23], [130.81, 196.0, 261.63, 329.63], [116.54, 174.61, 233.08, 293.66], [130.81, 196.0, 246.94, 329.63], [146.83, 220.0, 277.18, 329.63]];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// 一下一下的点火脉冲（窄脉冲的前几个谐波）
function pulseWave(c) {
  const n = 10, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) re[k] = Math.pow(0.82, k);
  return c.createPeriodicWave(re, im);
}

export function buildAmbient(A) {
  const c = A.ctx, bed = A.bed;
  const loopNoise = (buf) => { const s = A.src(buf, true); s.start(0, Math.random() * 1.5); return s; };
  const lfo = (f, depth, param) => { const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); g.gain.value = depth; o.connect(g); g.connect(param); o.start(); return o; };
  // —— 海 ——
  // 涌：褐噪过低通，两条很慢的起伏（11 秒、32 秒）叠着
  const swell = loopNoise(A.brown), swf = c.createBiquadFilter(); swf.type = 'lowpass'; swf.frequency.value = 380;
  const swg = c.createGain(); swg.gain.value = 0.23; swell.connect(swf); swf.connect(swg); swg.connect(bed);
  lfo(0.09, 0.085, swg.gain); lfo(0.031, 0.055, swg.gain);
  lfo(0.053, 90, swf.frequency); // 涌上来时亮一点
  // 碎浪的沙沙
  const fizz = loopNoise(A.noise), fzf = c.createBiquadFilter(); fzf.type = 'bandpass'; fzf.frequency.value = 1250; fzf.Q.value = 0.55;
  const fzg = c.createGain(); fzg.gain.value = 0.011; fizz.connect(fzf); fzf.connect(fzg); fzg.connect(bed);
  lfo(0.13, 0.007, fzg.gain);
  // 船身刷水（跟船速）
  const rush = loopNoise(A.noise), ruf = c.createBiquadFilter(); ruf.type = 'bandpass'; ruf.frequency.value = 900; ruf.Q.value = 0.4;
  const rug = c.createGain(); rug.gain.value = 0; rush.connect(ruf); ruf.connect(rug); rug.connect(bed);
  // —— 机器 ——
  const eo = c.createOscillator(); eo.type = 'sawtooth'; eo.frequency.value = 32;
  const eo2 = c.createOscillator(); eo2.type = 'square'; eo2.frequency.value = 16;
  const ef = c.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 170; ef.Q.value = 1.1;
  const knock = loopNoise(A.brown), kf = c.createBiquadFilter(); kf.type = 'bandpass'; kf.frequency.value = 85; kf.Q.value = 1.2;
  const kg = c.createGain(); kg.gain.value = 0.55;
  const amp = c.createGain(); amp.gain.value = 0.5;               // 点火脉冲在这里一下下地开合
  const fire = c.createOscillator(); fire.setPeriodicWave(pulseWave(c)); fire.frequency.value = 5.5;
  const fd = c.createGain(); fd.gain.value = 0.48; fire.connect(fd); fd.connect(amp.gain);
  const eg = c.createGain(); eg.gain.value = 0;
  eo.connect(ef); eo2.connect(ef); knock.connect(kf); kf.connect(kg); kg.connect(ef); ef.connect(amp); amp.connect(eg); eg.connect(bed);
  // 吃力时多一层闷吼
  const growl = loopNoise(A.brown), gf = c.createBiquadFilter(); gf.type = 'lowpass'; gf.frequency.value = 230;
  const gg = c.createGain(); gg.gain.value = 0; growl.connect(gf); gf.connect(gg); gg.connect(amp);
  eo.start(); eo2.start(); fire.start();
  A.engine = { eo, eo2, ef, eg, fire, fd, kg, gg };
  // —— 吊臂电机 ——
  const mo = c.createOscillator(); mo.type = 'sawtooth'; mo.frequency.value = 50;
  const mo2 = c.createOscillator(); mo2.type = 'sine'; mo2.frequency.value = 100;
  const mw = c.createOscillator(); mw.type = 'sine'; mw.frequency.value = 550;   // 齿轮的细啸
  const mf = c.createBiquadFilter(); mf.type = 'lowpass'; mf.frequency.value = 900;
  const mg = c.createGain(); mg.gain.value = 0; const mwg = c.createGain(); mwg.gain.value = 0;
  const brush = loopNoise(A.noise), bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 2600; bf.Q.value = 1.5;
  const bg = c.createGain(); bg.gain.value = 0;
  mo.connect(mf); mo2.connect(mf); mf.connect(mg); mg.connect(bed); mw.connect(mwg); mwg.connect(bed); brush.connect(bf); bf.connect(bg); bg.connect(bed);
  mo.start(); mo2.start(); mw.start();
  A.crane = { mo, mo2, mw, mg, mwg, bg, level: 0, on: false };
  A.sea = { rug, lapT: 1.2 };
  // —— 配乐：总线（设置里的“配乐”）→ 让路 → 一道很宽的低通 → 环境底 ——
  const M = A.music;
  M.bus = c.createGain(); M.bus.gain.value = 0.55 * (A.musicVol ?? 1);
  M.duck = c.createGain(); M.duck.gain.value = 1;
  const top = c.createBiquadFilter(); top.type = 'lowpass'; top.frequency.value = 3200;
  M.bus.connect(M.duck); M.duck.connect(top); top.connect(bed);
}

// 这一帧要用的几样（在线时从游戏里读；离线重放时就是记下来的这个对象）
export function snapAmbient(A, dt, g) {
  const b = g.boat, E = g.engine || null, M = A.music;
  const sp = Math.abs(b.speed);
  const run = b.fuel > 0 && !(g.ended && g.ended.why === 'fuel');
  // 吊臂臂端走得多快（米/秒）：转、伸缩、仰俯都算
  const P = A._cp || (A._cp = { yaw: b.craneYaw, reach: b.craneReach, luff: b.luff });
  let rate = 0;
  if (dt > 0) {
    let dy = b.craneYaw - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    rate = (Math.abs(dy) * Math.max(2, b.craneReach) + Math.abs(b.craneReach - P.reach) + Math.abs((b.luff || 0) - (P.luff || 0)) * 6) / dt;
  }
  P.yaw = b.craneYaw; P.reach = b.craneReach; P.luff = b.luff;
  // 标签（只在游戏里，离线重放不走这里）：推油门、吊机电机起转、停着听海
  const now = g.time || 0;
  // 摆场面时不记；游戏时钟从头来过（再来一次、效果单换一张卡）也从头计
  if (window.__fxTagMute || now < (A._tagT ?? -99)) A._tagT = -99;
  if (!window.__fxTagMute) {
    const thr = E ? Math.abs(E.throttle) : 0;
    if (thr > 0.3 && !(A._thr > 0.3)) { fxTag('A2', '机声·推油门：机器先吃力、突突加快', 'A2'); A._tagT = now; }
    else if (b.craneMoving && !A._cmv) { fxTag('A2', '吊机电机：咔哒一声，呜——转起来', 'A2'); A._tagT = now; }
    else if (sp < 0.5 && !b.craneMoving && now - (A._tagT ?? -99) > 8) { fxTag('A2', '海声：涌、碎浪、浪拍船身', 'A2'); A._tagT = now; }
    A._thr = thr; A._cmv = !!b.craneMoving;
  }
  // 揭晓（冲洗、看、拉回）、收工：音乐让路，也不起新的和弦
  const quiet = !!(g.reveal && g.reveal.busy) || !!g.ended;
  M.next -= dt;
  if (M.next < 0) {
    if (quiet) M.next = 1.5;
    else {
      M.chordI = M.i++; M.chordN = (M.chordN || 0) + 1; M.next = 7 + Math.random() * 2;
      fxTag('A3', '风吹过的和弦', 'A3');
      if (A.onChord) { try { A.onChord(M.chordI); } catch (e) { console.error(e); } }
    }
  }
  return {
    __snap: 1, sp, run, rpm: E ? E.rpm : Math.min(1, sp / 9.5), load: E ? E.load : 0,
    crane: !!b.craneMoving, rate: Math.min(rate, 9), quiet: quiet ? 1 : 0,
    chordN: M.chordN || 0, chordI: M.chordI || 0, slapN: E ? E.slapN || 0 : 0, slapK: E ? E.slapK || 0 : 0,
  };
}

export function updateAmbient(A, dt, s) {
  const c = A.ctx, t = c.currentTime;
  // —— 机器 ——
  const en = A.engine, r = s.run ? s.rpm : 0, L = s.run ? s.load : 0;
  en.eg.gain.setTargetAtTime(s.run ? 0.045 + r * 0.095 + L * 0.04 : 0, t, s.run ? 0.15 : 0.35);
  en.eo.frequency.setTargetAtTime(30 + r * 24 + L * 4, t, 0.12);
  en.eo2.frequency.setTargetAtTime(15 + r * 12 + L * 2, t, 0.12);
  en.fire.frequency.setTargetAtTime(5.2 + r * 10.5 + L * 1.5, t, 0.12);
  en.fd.gain.setTargetAtTime(0.48 - r * 0.12 + L * 0.04, t, 0.2);
  en.ef.frequency.setTargetAtTime(150 + r * 380 + L * 420, t, 0.15);
  en.kg.gain.setTargetAtTime(0.5 + L * 0.9, t, 0.15);
  en.gg.gain.setTargetAtTime(L * 0.55, t, 0.12);
  // —— 海 ——
  const v = Math.min(1, s.sp / 9.5);
  A.sea.rug.gain.setTargetAtTime(0.002 + Math.pow(v, 1.4) * 0.055, t, 0.3);
  // 停着、慢的时候，浪一下下拍船身（左右不定）
  if ((A.sea.lapT -= dt) < 0) {
    A.sea.lapT = 1.2 + Math.random() * 2.4;
    if (s.sp < 3) lap(A, 0.6 + Math.random() * 0.4);
  }
  // 船头压进浪里那一下“哗”
  if (A._slapN == null) A._slapN = s.slapN;
  else if (s.slapN > A._slapN) { A._slapN = s.slapN; bowSlap(A, s.slapK); }
  // —— 吊臂电机：转起来、落下去都有个过程 ——
  const C = A.crane, want = s.crane ? clamp(0.35 + s.rate / 1.6, 0, 1) : 0;
  C.level += (want - C.level) * (1 - Math.exp(-dt / (want > C.level ? 0.16 : 0.28)));
  if (!C.on && want > 0.3) { C.on = true; relay(A, 1); }
  else if (C.on && want === 0 && C.level < 0.25) { C.on = false; relay(A, 0.7); }
  const lv = C.level;
  C.mo.frequency.setTargetAtTime(46 + lv * 92, t, 0.05); C.mo2.frequency.setTargetAtTime(92 + lv * 184, t, 0.05);
  C.mw.frequency.setTargetAtTime(500 + lv * 1010, t, 0.05);
  C.mg.gain.setTargetAtTime(lv * 0.042, t, 0.05); C.mwg.gain.setTargetAtTime(lv * lv * 0.0055, t, 0.05); C.bg.gain.setTargetAtTime(lv * 0.007, t, 0.05);
  // —— 配乐：让路、新和弦 ——
  A.music.duck.gain.setTargetAtTime(s.quiet ? 0.2 : 1, t, s.quiet ? 0.25 : 0.9);
  if (A._chordN == null) A._chordN = s.chordN;
  else if (s.chordN > A._chordN) { A._chordN = s.chordN; chord(A, s.chordI); }
}

// 浪拍船身：一下闷闷的“啪嗒”，有时跟一声小小的“咕”
function lap(A, k) {
  const c = A.ctx, t = c.currentTime;
  const pn = c.createStereoPanner ? c.createStereoPanner() : c.createGain();
  if (pn.pan) pn.pan.value = (Math.random() - 0.5) * 1.2;
  pn.connect(A.bed);
  A.noiseBurst(360 + Math.random() * 300, 1.8, 0.22 + Math.random() * 0.12, 0.022 * k, 'bandpass', 0, pn);
  A.noiseBurst(1400 + Math.random() * 600, 1.2, 0.09, 0.006 * k, 'bandpass', 0.03, pn);
  if (Math.random() < 0.5) A.tone(120 + Math.random() * 50, 0.14, 0.012 * k, 'sine', 0.02, 0.7, pn);
}
// 船头压浪：“哗——”，底下一记闷的
function bowSlap(A, k) {
  const f = A.noiseBurst(700, 0.8, 0.5, 0.05 * k + 0.012, 'bandpass', 0, A.bed);
  const t = A.ctx.currentTime; f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(420, t + A.T(0.5));
  A.tone(64, 0.2, 0.03 * k, 'sine', 0, 0.75, A.bed);
}
// 继电器“咔哒”（电机起、停）
function relay(A, k) {
  A.noiseBurst(1900, 3, 0.022, 0.03 * k, 'bandpass', 0, A.bed);
  A.tone(96, 0.08, 0.022 * k, 'triangle', 0.005, 0.8, A.bed);
}

// 船员干活（A5）的小声音：刷子“唰”、小锤“叮”（走环境底，很轻）
export const AMBIENT = {
  scrub(A, o) { const v = o.v || 1; A.sweep(2600, 1500, 0.22, 0.012 * v, 0, 1.1); },
  tink(A, o) { const v = o.v || 1; A.tone(2350 + Math.random() * 300, 0.16, 0.014 * v, 'triangle', 0, 0.98, A.bed); A.tone(5100, 0.05, 0.005 * v, 'sine', 0, 1, A.bed); A.noiseBurst(3800, 4, 0.02, 0.008 * v, 'bandpass', 0, A.bed); },
};

// 风吹过的和弦（A3）：锯齿过低通，滤波器 3.6 秒慢慢打开、再慢慢合上；一阵风声从左吹到右
export function chord(A, i) {
  const c = A.ctx, t0 = c.currentTime, T = (s) => t0 + A.T(s);
  const ch = CHORDS[i % CHORDS.length];
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.6;
  lp.frequency.setValueAtTime(170, t0); lp.frequency.exponentialRampToValueAtTime(1750, T(3.6)); lp.frequency.exponentialRampToValueAtTime(240, T(9.3));
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1, T(2.6)); g.gain.setValueAtTime(1, T(3.8)); g.gain.exponentialRampToValueAtTime(0.0001, T(9.6));
  lp.connect(g); g.connect(A.music.bus);
  for (const [k, f] of ch.entries()) {
    for (const d of k === 0 ? [0] : [-1, 1]) {
      const o = c.createOscillator(); o.type = k === 0 ? 'triangle' : 'sawtooth';
      o.frequency.value = f * (1 + d * 0.0023 + (Math.random() - 0.5) * 0.002);
      const vg = c.createGain(); vg.gain.value = k === 0 ? 0.045 : 0.0105;
      o.connect(vg); vg.connect(lp); o.start(t0); o.stop(T(9.8));
    }
  }
  // 风：噪声过带通，跟着滤波器一起亮起来，从左走到右
  const s = A.src(A.noise, true), bf = c.createBiquadFilter(), wg = c.createGain();
  bf.type = 'bandpass'; bf.Q.value = 0.9;
  bf.frequency.setValueAtTime(320, t0); bf.frequency.exponentialRampToValueAtTime(1500, T(3.4)); bf.frequency.exponentialRampToValueAtTime(380, T(9));
  wg.gain.setValueAtTime(0.0001, t0); wg.gain.exponentialRampToValueAtTime(0.022, T(3.2)); wg.gain.exponentialRampToValueAtTime(0.0001, T(9.2));
  s.connect(bf); bf.connect(wg);
  if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.setValueAtTime(-0.65, t0); pn.pan.linearRampToValueAtTime(0.65, T(9)); wg.connect(pn); pn.connect(A.music.bus); }
  else wg.connect(A.music.bus);
  s.start(t0, Math.random()); s.stop(T(9.4));
  // 偶尔一声高处的单音
  if (Math.random() < 0.45) A.tone(ch[3] * 2, 2.6, 0.01, 'sine', 2.2 + Math.random() * 2.5, 0, A.music.bus);
}
