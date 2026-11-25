// 结算（第九批）的声音：空网（C3）、三种收工（C12）、收获单一拍一拍（C11）、再来一次（D1）。
// 和 audio.js 里的一样全部程序生成；A 是 Audio 本身（A.T 按慢放拉长时值）。名字合进 audio-precious.js 的 SOUNDS 一起查。
import { duck } from './audio-precious.js';

// 一下敲击的钟声（车钟、印章后的那一下）：几支不成倍数的正弦，高的先收
function bell(A, f, pk, dur, delay = 0, dest = null) {
  for (const [m, p, d] of [[1, 1, 1], [2.76, 0.42, 0.55], [5.4, 0.18, 0.28]]) A.tone(f * m, dur * d, pk * p, 'sine', delay, 0, dest);
}

export const SOUNDS = {
  // —— C3 空网 ——
  // 网兜一松，泥水“哗”地泼在木板上（低下去的一抹），从甲板缝里嘶嘶漏掉，滴两滴；末了两个很轻的音往下走一步：有点失落，不罚人
  emptyNet(A) {
    const c = A.ctx, t = c.currentTime;
    const f = A.noiseBurst(1500, 0.8, 0.42, 0.12, 'lowpass');
    f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(260, t + A.T(0.4));
    A.fizz(0.28, 1.25, 0.018, 23, 2600);
    A.tone(1250, 0.06, 0.02, 'sine', 0.72, 0.7); A.tone(960, 0.06, 0.016, 'sine', 1.12, 0.7);
    A.tone(330, 0.5, 0.016, 'triangle', 0.5); A.tone(277, 0.7, 0.014, 'triangle', 0.78);
  },

  // —— C12 三种收工 ——
  // 捞完：汽笛一长声、烟囱“嘶”地喷一口白汽；舱口一亮时四个音往上走，最后一个音长长地留着（圆满）
  haulDone(A) {
    A.horn(0, 1.6, 0.05);
    A.sweep(5200, 2600, 0.9, 0.022, 0.02, 0.9);
    [392, 494, 587, 784].forEach((f, i) => A.tone(f, i === 3 ? 1.3 : 0.55, 0.05, 'triangle', 0.55 + i * 0.12));
    A.tone(1568, 1.1, 0.012, 'sine', 0.92);
  },
  // 没油：发动机咳两声（和冒的两团黑烟对上），一口气往下掉、熄火，最后“噗”一下；三个音往下落（狼狈，但这一趟值）
  haulFuel(A) {
    A.cough(0); A.cough(0.34);
    A.toneF(46, 0.95, 0.08, 'sawtooth', 0.5, 0.5, 'lowpass', 220);
    A.noiseBurst(320, 0.8, 0.12, 0.08, 'lowpass', 1.32);
    [440, 392, 330].forEach((f, i) => A.tone(f, 0.55, 0.045, 'triangle', 1.25 + i * 0.13));
  },
  // 中途收工：一个低低的五度长音，很平静
  haulQuit(A) { A.tone(196, 1.8, 0.035, 'sine'); A.tone(294, 1.6, 0.022, 'sine', 0.08); },

  // —— C11 收获单 ——
  // 单子升起来：纸“唰”地一抽，落位时轻轻一托；环境底压低一截，几秒后慢慢回来
  haulSheet(A) {
    A.sweep(700, 2400, 0.32, 0.03, 0, 1.2);
    A.toneF(140, 0.16, 0.035, 'triangle', 0.36, 0.8, 'lowpass', 600);
    duck(A, 0.45, 0.6, 5, 2.5);
  },
  // 一行滑进来：木头珠子“嗒”一下；越往下越高一点（憋着劲往上走）
  haulRow(A, o) {
    const i = Math.min(10, o.i || 0), k = 1 + i * 0.045;
    A.noiseBurst(2300 * k, 3.2, 0.022, 0.05, 'bandpass');
    A.tone(820 * k, 0.05, 0.022, 'triangle', 0.004, 0.86);
  },
  // 珍品那一行：同样“嗒”一下，再有一串金光“叮——”地扫过去
  haulRowGold(A, o) {
    SOUNDS.haulRow(A, o);
    [1568, 2093, 2637].forEach((f, i) => A.tone(f, 0.5 - i * 0.08, 0.02, 'sine', 0.05 + i * 0.06));
    A.fizz(0.06, 0.45, 0.008, 31, 5200);
  },
  // 总价往上滚：一串咔哒，开头密、越滚越慢（和数字一起慢下来）；o.dur 滚多久，o.n 响几下
  haulRoll(A, o) {
    const c = A.ctx, dur = o.dur || 1, n = o.n || 16;
    const s = A.src(A.noise), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = 3100; f.Q.value = 2.4;
    s.connect(f); f.connect(g); g.connect(A.out);
    const t0 = c.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    for (let k = 1; k <= n; k++) {
      // 数字按 1-(1-u)^3 滚：第 k 下在 u = 1-(1-k/n)^(1/3)
      const u = 1 - Math.cbrt(1 - k / n), t = t0 + A.T(u * dur), pk = 0.035 + 0.02 * (k / n);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + A.T(0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + A.T(0.03));
    }
    s.start(t0, Math.random()); s.stop(t0 + A.T(dur + 0.1) + 0.1);
  },
  // 盖章：沉沉一“咚”（木头桌面），印泥“噗”；捞完再敲一下小钟，没油的更闷，中途收工的轻一点
  haulStamp(A, o) {
    const why = o.why || 'done', k = why === 'quit' ? 0.6 : 1;
    A.toneF(92, 0.26, 0.13 * k, 'sine', 0, 0.55, 'lowpass', 500);
    A.noiseBurst(why === 'fuel' ? 380 : 650, 0.9, 0.11, 0.09 * k, 'lowpass');
    A.noiseBurst(1900, 2.5, 0.03, 0.04 * k, 'bandpass', 0.005);
    if (why === 'done') bell(A, 1046.5, 0.035, 1.4, 0.06);
    else if (why === 'quit') A.tone(392, 1.1, 0.016, 'sine', 0.05);
  },
  // 余波：珍品那行的金菱形再亮一次，两声很高很轻的“叮”
  haulGleam(A) { A.tone(2349, 0.9, 0.014, 'sine'); A.tone(3136, 0.7, 0.01, 'sine', 0.09); },

  // —— D1 再来一次 ——
  // 按下去：车钟手柄推到“前进”，叮叮两下
  again(A) {
    A.noiseBurst(1500, 2.5, 0.03, 0.06, 'bandpass');
    bell(A, 1318.5, 0.045, 0.7, 0.04); bell(A, 1318.5, 0.04, 0.9, 0.2);
  },
  // 黑场揭开：发动机已经在转，一口气起来；船头的水推开；环境底回到原样
  againGo(A) {
    A.toneF(40, 1.1, 0.07, 'sawtooth', 0, 1.5, 'lowpass', 260);
    A.sweep(400, 1400, 0.9, 0.035, 0.1, 0.8);
    duck(A, 1, 0.6);
  },
};
