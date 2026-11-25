// 虚拟时钟（效果单的播放台、截“改前/改后”片段用；正式的 index.html 不加载它）。
// 游戏的每一帧、界面上的动画（CSS 动画、过渡、元素动画）、定时器、数字滚动都按它走：
//   setRate(r)  慢放（0.25× 就是四分之一速度，界面动画一起慢）
//   setManual(true) + advance(ms)  一帧一帧地推（截片段：每推一帧截一张，和真实时间无关）
// 声音是 Web Audio 按真实时间响的，慢放时每一声仍在它该响的那一刻响起，只是本身不变慢。
(() => {
  if (window.__vclock) return;
  const realNow = performance.now.bind(performance);
  const rAF = window.requestAnimationFrame.bind(window);
  const sT = window.setTimeout.bind(window), cT = window.clearTimeout.bind(window);
  const V = window.__vclock = { rate: 1, manual: false, base: realNow(), vbase: realNow(), timers: new Map(), seq: 1e6, starts: new WeakMap(), done: new WeakSet() };
  V.now = () => (V.manual ? V.vbase : V.vbase + (realNow() - V.base) * V.rate);
  performance.now = V.now;
  const fire = (id) => { const T = V.timers.get(id); if (!T) return; V.timers.delete(id); T.fn(...T.a); };
  const arm = (id, T) => {
    if (T.h) cT(T.h);
    T.h = null;
    if (V.manual) return;
    T.h = sT(() => fire(id), Math.max(0, (T.due - V.now()) / Math.max(1e-3, V.rate)));
  };
  window.setTimeout = (fn, ms = 0, ...a) => {
    if (typeof fn !== 'function') return sT(fn, ms);
    const id = ++V.seq, T = { fn, a, due: V.now() + (+ms || 0), h: null };
    V.timers.set(id, T); arm(id, T);
    return id;
  };
  window.clearTimeout = (id) => { const T = V.timers.get(id); if (T) { if (T.h) cT(T.h); V.timers.delete(id); } else cT(id); };
  // 界面动画：慢放时改播放速度；逐帧时停住（速度 0）、按虚拟时间摆到该在的位置（走到头照样触发结束事件）
  const syncAnims = () => {
    for (const a of document.getAnimations()) {
      if (V.done.has(a)) continue;
      if (V.manual) {
        let s = V.starts.get(a);
        if (s == null) { s = V.now() - (a.currentTime || 0); V.starts.set(a, s); }
        if (a.playbackRate !== 0) a.playbackRate = 0;
        a.currentTime = V.now() - s;
        // 走到头：速度是 0 的动画不会自己“结束”（没有 fill 的会跳回原样、结束事件也不来，例如收卡留下的影子会原地亮回来）——
        // 照真实时间那样把它结束掉
        const end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
        // （留半毫秒：33.33 毫秒一帧累加出来常常是 299.99999，浏览器已经当它到头、下一帧就不再列出来了）
        if (Number.isFinite(end) && a.currentTime >= end - 0.5) {
          a.playbackRate = 1; a.finish(); V.done.add(a);
          // 一帧一帧截图时结束事件不一定派发得到：有 onfinish 的当场调一次（调过就摘掉，事件后来再来也不会调第二次）
          const f = a.onfinish;
          if (f) { a.onfinish = null; try { f.call(a, new AnimationPlaybackEvent('finish', { currentTime: a.currentTime })); } catch (e) { /* 照常往下 */ } }
        }
      } else if (a.playbackRate !== V.rate) a.playbackRate = V.rate;
    }
  };
  window.requestAnimationFrame = (cb) => rAF(() => { syncAnims(); cb(V.now()); });
  V.setRate = (r) => { V.vbase = V.now(); V.base = realNow(); V.rate = r; for (const [id, T] of V.timers) arm(id, T); syncAnims(); };
  V.setManual = (m) => {
    V.vbase = V.now(); V.base = realNow(); V.manual = !!m;
    if (!m) for (const a of document.getAnimations()) a.playbackRate = V.rate;
    for (const [id, T] of V.timers) arm(id, T);
  };
  // 逐帧：往前推 ms 毫秒，到点的定时器按先后触发，界面动画摆到新的时刻
  V.advance = (ms) => {
    const end = V.vbase + ms;
    for (let guard = 0; guard < 500; guard++) {
      let nid = null, nd = Infinity;
      for (const [id, T] of V.timers) if (T.due <= end && T.due < nd) { nd = T.due; nid = id; }
      if (nid == null) break;
      V.vbase = Math.max(V.vbase, nd);
      fire(nid);
    }
    V.vbase = end;
    syncAnims();
  };
  V.sync = syncAnims;
})();
