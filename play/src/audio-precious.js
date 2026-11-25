// 珍品一串（第五批）的声音：起吊吃力（C4）、露头时水声收小（C5）、围过来欢呼（C7）、船钟和海底回响（C9）。
// 和 audio.js 里的一样全部程序生成；A 是 Audio 本身（A.T 按慢放拉长时值）。走 A.bed 的会被抽声一起抽走，走 A.out 的不会。
// 名字写在 SOUNDS 里，audio.play(名字) 先查这里。

// 环境底压低一截再放回来（不抽空）：level 压到几成，fade 秒压下去，hold 秒后用 back 秒回到原样
export function duck(A, level, fade = 0.12, hold = 0, back = 0) {
  if (!A.ctx) return;
  const g = A.bed.gain, t = A.ctx.currentTime, v = Math.max(0.0001, g.value);
  g.cancelScheduledValues(t); g.setValueAtTime(v, t);
  g.exponentialRampToValueAtTime(Math.max(0.0001, level), t + A.T(fade));
  if (back > 0) { g.setValueAtTime(Math.max(0.0001, level), t + A.T(fade + hold)); g.exponentialRampToValueAtTime(1, t + A.T(fade + hold + back)); }
}

// 一个分音：两支差一点点的正弦拍出“嗡——嗡——”的颤，长长地收
function partial(A, dest, f, dur, pk, beat, delay = 0, attack = 0.004) {
  const c = A.ctx, t = c.currentTime + A.T(delay), D = A.T(dur);
  for (const s of [-1, 1]) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f + s * beat * 0.5;
    o.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk * 0.5, t + A.T(attack)); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
    o.start(t); o.stop(t + D + 0.05);
  }
}

// 起吊吃力那一阵（C4，走环境底）：低低的锯齿喘着气 + 钢缆绷紧的嘶声；返回停的办法
function strainLoop(A) {
  const c = A.ctx, t = c.currentTime;
  const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.value = 47; o2.type = 'square'; o2.frequency.value = 23.4;
  f.type = 'lowpass'; f.frequency.value = 240; f.Q.value = 2.2;
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 2.7; lg.gain.value = 0.018; lfo.connect(lg); lg.connect(g.gain);
  const n = A.src(A.noise, true), nf = c.createBiquadFilter(), ng = c.createGain();
  nf.type = 'bandpass'; nf.frequency.value = 1150; nf.Q.value = 7; ng.gain.value = 0;
  const lfo2 = c.createOscillator(), lg2 = c.createGain(); lfo2.frequency.value = 0.8; lg2.gain.value = 0.006; lfo2.connect(lg2); lg2.connect(ng.gain);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(A.bed); n.connect(nf); nf.connect(ng); ng.connect(A.bed);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + A.T(0.35));
  ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.012, t + A.T(0.6));
  for (const x of [o, o2, lfo, lfo2, n]) x.start(t);
  return {
    // 越吃力（k 0–1）喘得越低越快
    load(k) { const tt = c.currentTime; o.frequency.setTargetAtTime(52 - 9 * k, tt, 0.3); o2.frequency.setTargetAtTime(26 - 4.5 * k, tt, 0.3); lfo.frequency.setTargetAtTime(2.2 + 1.6 * k, tt, 0.3); },
    stop(fade = 0.25) {
      const tt = c.currentTime;
      for (const gg of [g, ng]) { gg.gain.cancelScheduledValues(tt); gg.gain.setTargetAtTime(0.0001, tt, A.T(fade) / 3); }
      for (const x of [o, o2, lfo, lfo2, n]) x.stop(tt + A.T(fade) + 0.3);
    },
  };
}

// 鼓掌的一下：手心拍出来的短噪声（k：谁拍的，高低略不同）
function clap(A, k = 0.5, pk = 0.07, delay = 0) {
  A.noiseBurst(1100 + k * 700, 1.1, 0.035, pk, 'bandpass', delay);
  A.noiseBurst(2600 + k * 900, 2.2, 0.018, pk * 0.5, 'bandpass', delay + 0.004);
}

export const SOUNDS = {
  // —— C4 起吊吃力 ——
  // 网离底那一下：离合“咣”地咬上、卷筒一沉，钢缆“嘣”地绷直
  omenClutch(A) {
    A.tone(74, 0.5, 0.16, 'sine', 0, 0.6);
    A.noiseBurst(380, 0.8, 0.28, 0.14, 'lowpass');
    A.noiseBurst(1900, 7, 0.12, 0.05, 'bandpass', 0.02);
    A.toneF(118, 0.6, 0.05, 'sawtooth', 0.06, 0.82, 'bandpass', 520, 6);  // 钢缆绷直，嗡一声往下掉
    A.toneF(57, 0.9, 0.06, 'sawtooth', 0.18, 0.86, 'lowpass', 260);      // 船身吃上劲
  },
  // 吃力的循环：on/off；load 0–1 越吃力越低
  // 绞盘本身也被拖低：电机（第三批的绞车，跟着提网快慢和分量走）整体往下压到六七成，再慢慢挣上去一点
  omenStrain(A, o) {
    const w = A.loops.winch, t = A.ctx.currentTime;
    if (w && w.motor && (o.on || o.load != null)) {
      const k = o.load ?? 0.6;
      for (const n of w.motor) {
        const d = n.detune;
        d.cancelScheduledValues(t); d.setValueAtTime(d.value, t); d.linearRampToValueAtTime(-(500 + 300 * k), t + A.T(0.5)); d.linearRampToValueAtTime(-(250 + 300 * k), t + A.T(3.5));
      }
    }
    if (o.on) { if (!A.loops.omen) A.loops.omen = strainLoop(A); A.loops.omen.load(o.load ?? 0.6); }
    else if (o.load != null) { if (A.loops.omen) A.loops.omen.load(o.load); }
    else if (A.loops.omen) { A.loops.omen.stop(o.fade ?? 0.25); A.loops.omen = null; }
  },
  // 吊臂吱嘎一声（钢板受力，一下一下的）
  omenCreak(A, o) {
    const k = o.k ?? 0.5, c = A.ctx, t = c.currentTime;
    const oc = c.createOscillator(), g = c.createGain(), f = A.filt('bandpass', 620 + k * 380, 9);
    oc.type = 'sawtooth'; oc.frequency.setValueAtTime(170 + k * 60, t); oc.frequency.exponentialRampToValueAtTime(120 + k * 40, t + A.T(0.32));
    const tr = c.createOscillator(), tg = c.createGain(); tr.frequency.value = 31; tg.gain.value = 0.02; tr.connect(tg); tg.connect(g.gain);
    oc.connect(g); g.connect(f);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + A.T(0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + A.T(0.36));
    oc.start(t); tr.start(t); oc.stop(t + A.T(0.4) + 0.05); tr.stop(t + A.T(0.4) + 0.05);
  },
  // 出水带金：泥水哗地落回海里的同时，一串细细的亮声往下落（只这一网有）
  omenGlint(A) {
    [3520, 2960, 2637, 2349, 1976].forEach((f, i) => { A.tone(f, 0.9 - i * 0.08, 0.022 - i * 0.002, 'sine', 0.05 + i * 0.11); A.tone(f * 2.003, 0.25, 0.006, 'sine', 0.05 + i * 0.11); });
    A.toneF(880, 1.6, 0.012, 'triangle', 0.1, 0.5, 'lowpass', 1600);
  },
  // 落甲板更沉：极低的一下压到肚子里，船壳长长地呻吟，钢缆“嗡”地松开
  omenLand(A) {
    A.tone(38, 1.3, 0.34, 'sine', 0, 0.7);
    A.noiseBurst(170, 0.7, 0.6, 0.2, 'lowpass');
    A.toneF(96, 0.8, 0.06, 'sawtooth', 0.28, 0.6, 'bandpass', 380, 5);   // 钢缆松开
    A.toneF(61, 1.5, 0.05, 'sawtooth', 0.42, 0.78, 'bandpass', 300, 4);  // 船壳呻吟
    A.noiseBurst(520, 0.6, 0.9, 0.06, 'lowpass', 0.55);                   // 船边的水哗一下
  },

  // —— C5 露头 ——
  // 水流冲开那一角：水声里冒出一下亮亮的“刷——”，像冲在硬东西上
  peek(A, o) {
    A.sweep(2400, 5200, 0.32, 0.045, 0, 2.4);
    A.tone(o.silver ? 2794 : 2349, 0.7, 0.018, 'sine', 0.06); A.tone(o.silver ? 4186 : 3520, 0.45, 0.008, 'sine', 0.1);
  },
  // 最后 1 秒：水声、海声收小（还没抽空，抽空在最后 0.4 秒）
  quieten(A, o) { duck(A, o.level ?? 0.4, o.fade ?? 0.5); },

  // —— C7 欢呼 ——
  clap(A, o) { clap(A, o.k ?? 0.5, 0.06 * (o.v ?? 1)); },
  // 击掌：比鼓掌响、亮
  slap(A, o) { clap(A, 0.9, 0.11 * (o.v ?? 1)); A.noiseBurst(4200, 1.5, 0.02, 0.04, 'highpass'); },
  // 伴随物跳到旁边落稳：轻轻一下，按材质带一点音色
  settle(A, o) {
    A.tone(150, 0.12, 0.045, 'sine', 0, 0.7);
    A.noiseBurst(520, 1, 0.07, 0.035, 'lowpass');
    if (o.mat === 'metal') A.tone(1900, 0.18, 0.012, 'sine', 0.005);
    else if (o.mat === 'ceramic' || o.mat === 'glass') A.tone(2300, 0.06, 0.012, 'sine', 0.005);
  },
  // 一声口哨：往上挑，再一个往下的拐弯
  whistle(A) {
    const c = A.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
    o.type = 'sine'; v.frequency.value = 6; vg.gain.value = 18; v.connect(vg); vg.connect(o.frequency);
    o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(2700, t + A.T(0.22));
    o.frequency.setValueAtTime(2700, t + A.T(0.34)); o.frequency.exponentialRampToValueAtTime(3000, t + A.T(0.46)); o.frequency.exponentialRampToValueAtTime(1700, t + A.T(0.85));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + A.T(0.05));
    g.gain.setValueAtTime(0.03, t + A.T(0.2)); g.gain.exponentialRampToValueAtTime(0.004, t + A.T(0.3));
    g.gain.exponentialRampToValueAtTime(0.032, t + A.T(0.4)); g.gain.exponentialRampToValueAtTime(0.0001, t + A.T(0.9));
    o.connect(g); g.connect(A.out); o.start(t); v.start(t); o.stop(t + A.T(0.95) + 0.05); v.stop(t + A.T(0.95) + 0.05);
  },
  // 一群人“嘿——！”：几个嗓子（锯齿过两道共振峰），高低错开一点、前后错开一点
  hey(A, o) {
    const n = o.n ?? 4;
    for (let i = 0; i < n; i++) {
      const c = A.ctx, d = A.T(i * 0.05 + Math.random() * 0.04), t = c.currentTime + d;
      const f0 = 165 + i * 37 + Math.random() * 20, D = A.T(0.42 + Math.random() * 0.12);
      const oc = c.createOscillator(), g = c.createGain(); oc.type = 'sawtooth';
      oc.frequency.setValueAtTime(f0 * 0.92, t); oc.frequency.exponentialRampToValueAtTime(f0 * 1.12, t + D * 0.35); oc.frequency.exponentialRampToValueAtTime(f0 * 0.86, t + D);
      const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), mix = c.createGain();
      f1.type = 'bandpass'; f1.frequency.value = 640 + i * 30; f1.Q.value = 6; f2.type = 'bandpass'; f2.frequency.value = 1700 + i * 60; f2.Q.value = 8;
      oc.connect(g); g.connect(f1); g.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(A.out); mix.gain.value = 0.6;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + A.T(0.04)); g.gain.setValueAtTime(0.09, t + D * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
      oc.start(t); oc.stop(t + D + 0.05);
    }
  },

  // —— C9 船钟 ——
  // “当——”：一下敲击，接着低哼、主音、小三度、五度、八度、高泛音一层层长长地荡开（每层两支拍出颤）；
  // 同一声隔着海水往下走，海底回响两次：晚 0.55 秒、1.3 秒，一次比一次闷、轻；环境底让一让
  toll(A) {
    const c = A.ctx;
    const bus = c.createGain(); bus.gain.value = 1; bus.connect(A.out);
    A.noiseBurst(2600, 1.2, 0.04, 0.08, 'bandpass', 0, bus);           // 钟舌砸上去
    A.noiseBurst(900, 1, 0.09, 0.05, 'lowpass', 0, bus);
    const f = 392;
    [[0.5, 7.5, 0.06, 0.7], [1, 6.2, 0.085, 1.2], [1.19, 4.6, 0.04, 1.6], [1.5, 3.6, 0.03, 2.1], [2, 3.0, 0.045, 1.4], [2.51, 1.7, 0.018, 3.2], [2.99, 1.2, 0.012, 2.6], [4.2, 0.55, 0.008, 4]]
      .forEach(([r, d, pk, b]) => partial(A, bus, f * r, d, pk, b));
    // 海底回响：一份送进两段延迟，越晚越闷越轻
    const mk = (delay, cut, gain) => {
      const dl = c.createDelay(Math.max(1, A.T(delay) + 0.2)), lp = c.createBiquadFilter(), g = c.createGain();
      dl.delayTime.value = A.T(delay); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 0.5; g.gain.value = gain;
      bus.connect(dl); dl.connect(lp); lp.connect(g); g.connect(A.out);
    };
    mk(0.55, 900, 0.42); mk(1.3, 480, 0.3);
    // 回响底下更低的一层：像整片海底跟着嗡了一下
    A.toneF(98, 3.2, 0.03, 'sine', 0.6, 0.98, 'lowpass', 300);
    A.toneF(98, 2.6, 0.02, 'sine', 1.35, 0.98, 'lowpass', 220);
    duck(A, 0.5, 0.06, 1.0, 3.0);
  },
};
