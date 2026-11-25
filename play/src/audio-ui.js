// 界面（第十批）的声音：收卡（B22）、暂停和继续（D2）、设置里拖滑杆（D3）、F1 收起和放出界面（D4）。
// 和 audio.js 里的一样全部程序生成；A 是 Audio 本身（A.T 按慢放拉长时值）。
// 暂停、继续、设置里的几声走 A.dry（不过暂停时那道闷住世界的低通），其余走 A.out。
// always：暂停中也要响的（设置多半是从暂停菜单里打开的，拖音量时要听得见新的音量）。
// 名字写在 SOUNDS 里，audio.play(名字) 先查这里。

const dry = (A) => A.dry || A.out;

export const SOUNDS = {
  // 收起结果卡（B22）：铜牌往右一甩——“唰——叮”，声音偏在右边（卡在右边）；2 个发声体
  dismiss(A) {
    const p = A.pan(0.5);
    const f = A.noiseBurst(1300, 1.6, 0.17, 0.05, 'bandpass', 0, p);
    const t = A.ctx.currentTime;
    f.frequency.setValueAtTime(1300, t); f.frequency.exponentialRampToValueAtTime(5600, t + A.T(0.17));
    A.tone(2350, 0.03, 0.014, 'sine', 0.13, 0, p);
  },
  // 暂停（D2）：黄铜表盖“嗒”地合上，底下一声往下沉的低音——世界跟着闷下去（闷的那一下在 audio.muffle）；2 个发声体
  pause(A) {
    A.noiseBurst(1900, 4, 0.035, 0.05, 'bandpass', 0, dry(A));
    A.tone(180, 0.36, 0.05, 'sine', 0.01, 0.6, dry(A));
  },
  // 继续（D2）：表盖弹开“嗒”，低音往上一提——世界的声音从闷着的地方回来；2 个发声体
  resume(A) {
    A.noiseBurst(2300, 4, 0.03, 0.045, 'bandpass', 0, dry(A));
    A.tone(112, 0.3, 0.045, 'sine', 0.01, 1.55, dry(A));
  },
  // 设置里拖音量（D3）：一下轻轻的铜“嗒”，响度就是新的音量；1 个发声体
  level: Object.assign((A) => { A.tone(1180, 0.05, 0.05, 'triangle', 0, 0.92, dry(A)); }, { always: true }),
  // 拖配乐（D3）：一小段配乐里的和弦（过配乐那条总线，配乐调到 0 就听不见）；2 个发声体
  taste: Object.assign((A) => {
    const c = A.ctx, bus = A.music ? A.music.bus : dry(A), t = c.currentTime;
    for (const [f, pk] of [[146.83, 0.05], [220.0, 0.03]]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(bus);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + A.T(0.06)); g.gain.exponentialRampToValueAtTime(0.0001, t + A.T(0.9));
      o.start(t); o.stop(t + A.T(0.95) + 0.05);
    }
  }, { always: true }),
  // 拖“水面晃动”（D3）：一小阵水声，晃得越大越响越亮；拖到 0 几乎听不见；1 个发声体
  swash: Object.assign((A, o) => {
    const v = Math.max(0, Math.min(1, o.v ?? 1));
    if (v < 0.02) return;
    A.noiseBurst(500 + 900 * v, 0.8, 0.32, 0.012 + 0.03 * v, 'lowpass', 0, dry(A));
  }, { always: true }),
  // F1 收起界面（D4）：很轻的一口气往下落；1 个发声体
  hudOff(A) {
    const f = A.noiseBurst(3200, 1.2, 0.22, 0.016, 'bandpass', 0, dry(A));
    const t = A.ctx.currentTime; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(800, t + A.T(0.22));
  },
  // 再按 F1 放出来（D4）：一口气往上提，末了一下细细的“嗒”；2 个发声体
  hudOn(A) {
    const f = A.noiseBurst(900, 1.2, 0.2, 0.016, 'bandpass', 0, dry(A));
    const t = A.ctx.currentTime; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(3400, t + A.T(0.2));
    A.tone(2600, 0.025, 0.01, 'sine', 0.2, 0, dry(A));
  },
};
