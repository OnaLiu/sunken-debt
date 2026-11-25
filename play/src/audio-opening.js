// 开场（第十四批）的声音：标题起头的低和弦（G1）、按“开始航程”的车钟和汽笛（G3）、开局浮标的钟（G4）、
// 自动演示里按了别的键的轻敲和 Esc 接管（G5）。
// 和 audio.js 里的一样全部程序生成；A 是 Audio 本身（A.T 按慢放拉长时值）。都走 A.out（不跟配乐音量走，效果单关掉配乐也听得见）。
// 名字写在 OPENING 里，audio.play(名字) 先查这里。

// 一支慢起慢收的长音：o.type 波形，接到 dest；peak 峰值，a 起音秒数，d 总长
function pad(A, dest, f, type, peak, delay, a, d, detune = 0) {
  const c = A.ctx, t = c.currentTime + A.T(delay), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = f; o.detune.value = detune;
  o.connect(g); g.connect(dest);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + A.T(a)); g.gain.exponentialRampToValueAtTime(0.0001, t + A.T(d));
  o.start(t); o.stop(t + A.T(d) + 0.05);
}
// 敲一下金属：几个不成倍数的分音一起起、各自衰减（钟、车钟、浮标的铃都用它）
function strike(A, dest, f, parts, peak, delay, dur) {
  const c = A.ctx, t = c.currentTime + A.T(delay);
  for (const [k, w, dk] of parts) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f * k;
    o.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * w, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + A.T(dur * dk));
    o.start(t); o.stop(t + A.T(dur * dk) + 0.05);
  }
}
// 一支汽笛：起头音高偏低一点、0.18 秒滑到音上（真汽笛的“呜——”），中间轻轻地颤，收尾往下掉一点
function hornVoice(A, dest, f, type, peak, delay, dur) {
  const c = A.ctx, t = c.currentTime + A.T(delay), D = A.T(dur);
  const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f * 0.93, t); o.frequency.exponentialRampToValueAtTime(f, t + A.T(0.18));
  o.frequency.setValueAtTime(f, t + D - A.T(0.3)); o.frequency.exponentialRampToValueAtTime(f * 0.96, t + D);
  lfo.frequency.value = 5.2; lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(o.frequency);
  o.connect(g); g.connect(dest);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + A.T(0.16));
  g.gain.setValueAtTime(peak, t + D - A.T(0.4)); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
  o.start(t); lfo.start(t); o.stop(t + D + 0.05); lfo.stop(t + D + 0.05);
}

export const OPENING = {
  // —— G1 打开游戏：一个故事要开始了 ——
  // D 多利亚（和配乐同一个调）：很低的 D 垫在底下，五度、八度、小三度一层层进来，整团声音过一道慢慢打开的低通（像水面一点点亮起来）；
  // 底下一阵海水涌上来又退下去；字落稳那一下（1.2 秒后）高处轻轻两声，像水面一闪。共 8 个发声体，长约 8 秒。
  opening(A) {
    const c = A.ctx, t = c.currentTime;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9; lp.connect(A.out);
    lp.frequency.setValueAtTime(240, t); lp.frequency.exponentialRampToValueAtTime(2300, t + A.T(3.6)); lp.frequency.exponentialRampToValueAtTime(900, t + A.T(8));
    pad(A, lp, 73.42, 'triangle', 0.075, 0, 1.4, 8.2);        // D2：最底下那一层
    pad(A, lp, 110.0, 'sine', 0.04, 0.25, 1.6, 8.0);           // A2
    pad(A, lp, 146.83, 'sawtooth', 0.016, 0.5, 1.9, 7.8, -4);   // D3（带一点锯齿的毛边）
    pad(A, lp, 174.61, 'sine', 0.026, 0.8, 2.0, 7.6);          // F3：小三度，让它带一点愁
    pad(A, lp, 220.0, 'sine', 0.018, 1.1, 2.2, 7.4, 3);        // A3
    // 海水涌上来又退下去
    const n = A.src(A.brown), nf = c.createBiquadFilter(), ng = c.createGain();
    nf.type = 'lowpass'; nf.frequency.value = 700; n.connect(nf); nf.connect(ng); ng.connect(A.out);
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.11, t + A.T(1.6)); ng.gain.exponentialRampToValueAtTime(0.0001, t + A.T(4.6));
    n.start(t, Math.random()); n.stop(t + A.T(4.7) + 0.05);
    // 字落稳：水面一闪（E5、A5，很轻）
    strike(A, A.out, 659.25, [[1, 1, 1], [2.0, 0.25, 0.6]], 0.016, 1.2, 2.6);
  },
  // 声音晚到（浏览器要先有一下按键才肯出声）：一样的和弦，起得快一点，没有海水那一涌
  openingLate(A) {
    const c = A.ctx, t = c.currentTime;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9; lp.connect(A.out);
    lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(2300, t + A.T(2.2)); lp.frequency.exponentialRampToValueAtTime(900, t + A.T(7));
    pad(A, lp, 73.42, 'triangle', 0.07, 0, 0.7, 7.2);
    pad(A, lp, 110.0, 'sine', 0.036, 0.1, 0.8, 7.0);
    pad(A, lp, 146.83, 'sawtooth', 0.014, 0.25, 1.0, 6.8, -4);
    pad(A, lp, 174.61, 'sine', 0.024, 0.4, 1.1, 6.6);
    pad(A, lp, 220.0, 'sine', 0.016, 0.55, 1.2, 6.4, 3);
    strike(A, A.out, 659.25, [[1, 1, 1], [2.0, 0.25, 0.6]], 0.014, 0.35, 2.4);
  },

  // —— G3 按“开始航程”：出发！ ——
  // 0 秒车钟“叮、叮”（拉到全速前进）；0.12 秒汽笛一声长鸣：两支低音成五度，起头往上一滑，底下一支更低的垫着，喷口先“噗”一口气；
  // 0.6 秒以后岸那边回来一声更远更闷的回声。黑场就在汽笛声里过去，海面亮起来时尾音还在。共 10 个发声体，约 2.6 秒。
  depart(A) {
    const c = A.ctx;
    // 车钟：铜铃两下
    const bell = c.createBiquadFilter(); bell.type = 'highpass'; bell.frequency.value = 600; bell.connect(A.out);
    strike(A, bell, 1568, [[1, 1, 1], [2.76, 0.35, 0.45]], 0.045, 0, 0.55);
    strike(A, bell, 1568, [[1, 1, 1], [2.76, 0.35, 0.45]], 0.038, 0.13, 0.7);
    // 汽笛
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820; lp.Q.value = 1.4; lp.connect(A.out);
    hornVoice(A, lp, 116.54, 'sawtooth', 0.075, 0.12, 1.75);   // B♭2
    hornVoice(A, lp, 174.61, 'sawtooth', 0.055, 0.12, 1.75);   // F3（五度）
    hornVoice(A, lp, 58.27, 'triangle', 0.09, 0.14, 1.7);      // 再低一个八度垫着
    A.noiseBurst(950, 0.8, 0.22, 0.09, 'bandpass', 0.1);       // 喷口先“噗”一口汽
    // 岸那边的回声：晚 0.6 秒、更远更闷
    const far = c.createBiquadFilter(); far.type = 'lowpass'; far.frequency.value = 380; far.connect(A.out);
    hornVoice(A, far, 116.54, 'sawtooth', 0.026, 0.72, 1.55);
    hornVoice(A, far, 174.61, 'sawtooth', 0.018, 0.72, 1.55);
  },
  // 海面亮起来那一刻（G3）：船已经在动——机器“突、突、突”咬上三下，船尾的水“哗”地翻起来（4 个发声体）
  castOff(A) {
    const c = A.ctx;
    for (let i = 0; i < 3; i++) A.toneF(44 + i * 3, 0.16, 0.07 - i * 0.012, 'sawtooth', i * 0.17, 0.82, 'lowpass', 260, 1.2);
    const f = A.noiseBurst(500, 0.7, 1.3, 0.085, 'lowpass', 0.05), t = c.currentTime + A.T(0.05);
    f.frequency.setValueAtTime(380, t); f.frequency.exponentialRampToValueAtTime(1300, t + A.T(0.35)); f.frequency.exponentialRampToValueAtTime(420, t + A.T(1.3));
  },

  // —— G4 开局 2.5 秒：往那边去 ——
  // 远处浮标上的铃“叮……当”：两下，第二下低一点；离得远，闷一点、轻一点，从它那一边传过来（o.pan −1 左 … 1 右）（4 个发声体）
  buoyBell(A, o) {
    const c = A.ctx, dest = A.pan(o.pan || 0), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(dest);
    const k = o.soft ? 0.6 : 1;
    strike(A, lp, 1046.5, [[1, 1, 1], [2.32, 0.4, 0.5]], 0.034 * k, 0, 1.7);
    strike(A, lp, 880.0, [[1, 1, 1], [2.32, 0.4, 0.5]], 0.028 * k, 0.42, 2.0);
  },

  // —— G5 自动演示中 ——
  // 按了别的键：手指在玻璃上轻轻敲两下“笃笃”（不是“不行”，是“我在这儿，按 Esc”）（3 个发声体）
  demoHint(A) {
    A.noiseBurst(1700, 4, 0.03, 0.05, 'bandpass');
    A.noiseBurst(2100, 4, 0.03, 0.045, 'bandpass', 0.11);
    A.tone(1175, 0.09, 0.012, 'triangle', 0.11);
  },
  // Esc 接管：车钟手柄“咔”一下拨过去，两个暖的音往上走——交给你了（3 个发声体）
  takeover(A) {
    A.noiseBurst(2600, 5, 0.03, 0.07, 'bandpass');
    A.tone(587.33, 0.22, 0.04, 'triangle', 0.06);
    A.tone(880.0, 0.4, 0.035, 'triangle', 0.2);
  },
};
