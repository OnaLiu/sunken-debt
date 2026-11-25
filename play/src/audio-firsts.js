// 「第一次」的声音：上半是第十二批（F1–F5），下半是第十三批（F6、F9、F10）。两批各自建了这个文件，合在一起。
// 第一次（第十二批 F1–F5）的声音。和 audio.js 里的一样全部程序生成；A 是 Audio 本身（A.T 按慢放拉长时值）。
// 名字并进 audio-precious.js 的 SOUNDS（audio.play(名字) 先查那里），audio.js 只多一行 import。
import { SOUNDS } from './audio-precious.js';

Object.assign(SOUNDS, {
  // F1 第一次推油门：机器“轰”地吃上劲（一口一口地突突上去）、烟囱“噗”一口、船尾翻水，汽笛短短一声
  firstThrottle(A) {
    const c = A.ctx, t = c.currentTime, lp = A.filt('lowpass', 300, 0.9);
    const o = c.createOscillator(), g = c.createGain(), am = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(30, t); o.frequency.exponentialRampToValueAtTime(64, t + A.T(0.55)); o.frequency.exponentialRampToValueAtTime(52, t + A.T(1.4));
    lfo.frequency.setValueAtTime(7, t); lfo.frequency.exponentialRampToValueAtTime(15, t + A.T(0.6));
    lg.gain.value = 0.5; am.gain.value = 0.5;
    lfo.connect(lg); lg.connect(am.gain); o.connect(am); am.connect(g); g.connect(lp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + A.T(0.08)); g.gain.setValueAtTime(0.2, t + A.T(0.5)); g.gain.exponentialRampToValueAtTime(0.0001, t + A.T(1.5));
    const end = t + A.T(1.55) + 0.1; o.start(t); lfo.start(t); o.stop(end); lfo.stop(end);
    // 烟囱“噗”：一口低低的气
    const f = A.noiseBurst(320, 0.8, 0.32, 0.16, 'lowpass', 0.02);
    f.frequency.setValueAtTime(520, t); f.frequency.exponentialRampToValueAtTime(180, t + A.T(0.34));
    // 船尾翻水
    A.sweep(1100, 480, 0.9, 0.05, 0.08, 0.9);
    // 汽笛短短一声
    A.horn(0.3, 0.62, 0.05);
  },
  // F2 第一次发现：find 那一声底下再敲一口低钟（八度下面，带一点不谐的泛音），后面一串细的亮音慢慢散开，水面一阵涌
  firstFind(A, o) {
    const P = A.pan(o.pan), base = o.kind === 'clue' ? 440 : 523.25;
    A.tone(base, 1.9, 0.05, 'sine', 0.06, 0, P);
    A.tone(base * 2.76, 0.9, 0.012, 'sine', 0.06, 0, P);
    A.tone(base * 0.5, 1.4, 0.03, 'sine', 0.05, 0.98, P);
    [3, 4, 6].forEach((m, i) => A.tone(base * m, 1.2, 0.011, 'sine', 0.42 + i * 0.13, 0, P));
    A.noiseBurst(420, 0.7, 1.2, 0.025, 'lowpass', 0.1, P);
  },
  // F3 第一次进入作业：面板滑进来“唰”一下，“新”字盖下去“嗒”，一声小“叮”
  firstKeys(A) {
    A.sweep(1400, 2600, 0.18, 0.02, 0, 1.2);
    A.noiseBurst(2300, 3, 0.03, 0.05, 'bandpass', 0.3);
    A.tone(1318.5, 0.5, 0.022, 'sine', 0.31);
    A.tone(1975.5, 0.4, 0.01, 'sine', 0.36);
  },
  // F3 用过的键打勾：很轻的一下“嗒”
  keyTick(A) { A.tone(1568, 0.12, 0.016, 'sine'); A.noiseBurst(3200, 4, 0.02, 0.018, 'bandpass'); },
  // F4 第一次触底：平常的闷响底下多一层更低更长的“轰”，沙往外铺开的沙沙声也更宽（越深越闷）
  firstTouch(A, o) {
    const c = A.ctx, d = Math.min(1, (o.depth || 10) / 25);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520 - d * 220; lp.Q.value = 0.7; lp.connect(A.out);
    A.tone(46 - d * 10, 1.3, 0.24, 'sine', 0, 0.62, lp);
    A.tone(96 - d * 24, 0.55, 0.12, 'sine', 0.01, 0.55, lp);
    A.noiseBurst(700 - d * 200, 0.6, 1.4, 0.035, 'bandpass', 0.08, lp);
  },
  // F5 第一次揭晓：教加快那一行冒出来时轻轻一声（“看这里”），按了以后亮一下
  teachHint(A) {
    A.tone(784, 0.16, 0.026, 'triangle', 0);
    A.tone(1046.5, 0.32, 0.026, 'triangle', 0.11);
  },
  teachAck(A) {
    A.tone(2093, 0.28, 0.02, 'sine', 0.02);
    A.tone(2637, 0.22, 0.012, 'sine', 0.07);
  },
});

// 第十三批「第一次（下）」的声音：第一件珍品的金色空位（F6）、第一次空网船员“嗯”一声（F9）、第一次看清沉船（F10 / S5）。
// 和 audio.js、audio-precious.js 一样全部程序生成；A 是 Audio 本身（A.T 按慢放拉长时值）。

// 一支正弦（或别的波形）按 起音 a、总长 d、峰值 pk 走，接到 dest；f1 给了就在这一段里滑到 f1
function voice(A, dest, f, d, pk, { type = 'sine', delay = 0, a = 0.01, f1 = 0, det = 0 } = {}) {
  const c = A.ctx, t = c.currentTime + A.T(delay), D = A.T(d), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = f; if (det) o.detune.value = det;
  if (f1) { o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f1, t + D); }
  o.connect(g); g.connect(dest);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + A.T(a)); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
  o.start(t); o.stop(t + D + 0.05);
  return o;
}
function lowpass(A, f, dest, q = 0.7) { const n = A.ctx.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = f; n.Q.value = q; n.connect(dest || A.out); return n; }
function panner(A, p, dest) { const c = A.ctx; if (!c.createStereoPanner) return dest; const n = c.createStereoPanner(); n.pan.value = Math.max(-1, Math.min(1, p)); n.connect(dest); return n; }

Object.assign(SOUNDS, {
  // —— F6 第一件珍品：收获单上亮出一格金色空位 ——
  // 空位亮起来：很轻的两声玻璃似的高音，一点颤（不抢 C6 的和弦，只是“那边有个位置在等它”）
  slotOpen(A) {
    const L = lowpass(A, 5200);
    voice(A, L, 1567.98, 1.3, 0.016, { a: 0.06 });
    voice(A, L, 2093.0, 1.1, 0.011, { a: 0.08, delay: 0.09, det: 6 });
    voice(A, L, 3135.96, 0.6, 0.004, { a: 0.05, delay: 0.16 });
  },
  // 金签落进空位：一声暖的“叮当”——金属的亮头 + 一个中音托底 + 一点点落定的木响
  slotGold(A) {
    const L = lowpass(A, 7000);
    voice(A, L, 2637.02, 0.5, 0.03, { a: 0.003 });
    voice(A, L, 3951.07, 0.32, 0.012, { a: 0.003, delay: 0.004 });
    voice(A, L, 1318.51, 1.4, 0.03, { a: 0.006, delay: 0.02 });
    voice(A, L, 659.25, 1.8, 0.026, { a: 0.012, delay: 0.03, type: 'triangle' });
    A.noiseBurst(1800, 3, 0.06, 0.018, 'bandpass', 0, L);
  },

  // —— F9 第一次空网：耸肩的那个人“嗯——”一声（嘴闭着，往上挑一下再落，听着是“没事”） ——
  shrugHum(A, o) {
    const c = A.ctx, t = c.currentTime + A.T(o.delay || 0), D = A.T(0.52), f0 = o.f0 || 128;
    const oc = c.createOscillator(), g = c.createGain(); oc.type = 'sawtooth';
    oc.frequency.setValueAtTime(f0 * 0.94, t); oc.frequency.exponentialRampToValueAtTime(f0 * 1.16, t + D * 0.42); oc.frequency.exponentialRampToValueAtTime(f0 * 0.88, t + D);
    // 闭着嘴的鼻音：低共振峰压得很低，上面只透一点
    const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), mix = c.createGain();
    f1.type = 'bandpass'; f1.frequency.value = 290; f1.Q.value = 5; f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 9;
    const P = panner(A, o.pan || 0, A.out);
    oc.connect(g); g.connect(f1); g.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(P); mix.gain.value = 0.55;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + A.T(0.06)); g.gain.setValueAtTime(0.08, t + D * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
    oc.start(t); oc.stop(t + D + 0.05);
  },

  // —— F10 / S5 第一次看清沉船 ——
  // 预兆：测深仪“嘀”一下，后面跟一下闷闷的回波（底下有个大东西）；k 越大（越近）回波来得越快、越响
  sonarEcho(A, o) {
    const k = Math.max(0, Math.min(1, o.k || 0)), L = lowpass(A, 3000, panner(A, o.pan || 0, A.out));
    voice(A, L, 1480, 0.09, 0.014, { a: 0.004 });
    const d = 0.34 - 0.2 * k;
    voice(A, L, 740, 0.38, 0.012 + 0.016 * k, { a: 0.01, delay: d, f1: 690 });
    voice(A, L, 98, 0.5, 0.02 + 0.03 * k, { a: 0.02, delay: d, type: 'triangle' });
  },
  // 憋住：船驶过坡顶、水暗下去——底下一层很低的音慢慢涨上来，像屏住气。dur 秒涨到顶，顶上最多再撑 hold 秒；
  // 爆发那一下（或船开走了）由 deepSwellCut 掐掉，等不到就自己慢慢落下去。两下都走 play()，录像离线重放也照样一涨一掐
  deepSwell(A, o) {
    const c = A.ctx, t = c.currentTime, D = A.T(o.dur || 1.8), Hd = A.T(o.hold || 0), R = A.T(0.6);
    SOUNDS.deepSwellCut(A, { fade: 0.3 });
    const out = A._swell = c.createGain(); out.gain.value = 1; out.connect(A.out);
    const env = (g, pk) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + D); g.gain.setValueAtTime(pk, t + D + Hd); g.gain.linearRampToValueAtTime(0, t + D + Hd + R); };
    for (const [f, pk, ty] of [[55, 0.07, 'sine'], [82.41, 0.035, 'sine'], [110, 0.014, 'triangle']]) {
      const oc = c.createOscillator(), g = c.createGain(); oc.type = ty; oc.frequency.value = f;
      // 一点点慢颤：气憋着，不是死的长音
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.9 + f / 200; lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(oc.frequency);
      oc.connect(g); g.connect(out); env(g, pk);
      oc.start(t); lfo.start(t); oc.stop(t + D + Hd + R + 0.1); lfo.stop(t + D + Hd + R + 0.1);
    }
    // 水压：褐噪过很低的低通，跟着一起涨
    const n = A.src(A.brown, true), f = lowpass(A, 170, out), g = c.createGain();
    n.connect(g); g.connect(f); env(g, 0.2);
    n.start(t, Math.random()); n.stop(t + D + Hd + R + 0.1);
  },
  // 憋住时环境底（海浪、发动机、配乐）一路压下去：像屏住气，底下那层低音才浮得出来；看清以后慢慢放回来。
  // 只压到 to（不是 C6 的整条抽空，那一下留给珍品确认）。delay 秒后用 fade 秒走到 to
  bedDuck(A, o) {
    const g = A.bed && A.bed.gain; if (!g) return;
    const now = A.ctx.currentTime, t = now + A.T(o.delay || 0), v = Math.max(0.0001, g.value);
    g.cancelScheduledValues(now); g.setValueAtTime(v, now); g.setValueAtTime(v, t);
    g.exponentialRampToValueAtTime(Math.max(0.02, o.to == null ? 1 : o.to), t + A.T(o.fade || 0.5));
  },
  deepSwellCut(A, o) {
    const g = A._swell; A._swell = null; if (!g) return;
    const t = A.ctx.currentTime, f = A.T(o.fade || 0.08);
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.exponentialRampToValueAtTime(0.0001, t + f);
    setTimeout(() => g.disconnect(), (f + 0.3) * 1000);
  },
  // 爆发：`find` 底下再垫一层——一下很沉的“咚”往下沉，接着低低的五度长长地铺开，水底的隆隆声
  findDeep(A, o) {
    const P = panner(A, (o.pan || 0) * 0.5, A.out), L = lowpass(A, 900, P);
    voice(A, L, 62, 0.9, 0.12, { a: 0.006, f1: 36 });
    voice(A, L, 73.42, 3.6, 0.05, { a: 0.08, delay: 0.05, type: 'triangle' });
    voice(A, L, 110, 3.2, 0.03, { a: 0.12, delay: 0.08 });
    voice(A, L, 146.83, 2.6, 0.016, { a: 0.2, delay: 0.12, det: 5 });
    A.noiseBurst(140, 0.8, 1.6, 0.05, 'lowpass', 0.02, L);
    A.noiseBurst(420, 1.2, 0.5, 0.02, 'bandpass', 0, L);
  },
  // 余韵：配乐的下一个和弦换成一个更低、更宽的（只这一次）——低 D 到高处的 B 摊开三个八度，左右分开，长起长收。
  // 走配乐那条总线：配乐关了就听不到（和配乐本身一样）
  wideChord(A) {
    const c = A.ctx, bus = A.music && A.music.bus; if (!bus) return;
    const t0 = c.currentTime;
    const notes = [[73.42, 0.05, 'triangle', 0], [110.0, 0.028, 'sine', -0.35], [164.81, 0.022, 'sine', 0.35], [220.0, 0.018, 'sine', -0.6], [293.66, 0.013, 'sine', 0.6], [493.88, 0.006, 'sine', 0]];
    for (const [f, pk, ty, pn] of notes) {
      const dest = panner(A, pn, bus);
      for (const det of [-4, 4]) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = ty; o.frequency.value = f; o.detune.value = det;
        o.connect(g); g.connect(dest);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(pk * 0.6, t0 + A.T(2.6)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + A.T(12));
        o.start(t0); o.stop(t0 + A.T(12) + 0.1);
      }
    }
  },
});
