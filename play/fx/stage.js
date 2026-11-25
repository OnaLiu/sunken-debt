// 效果单的播放台（fx-stage.html，放在 effects.html 的框里）：收到“放哪一条”就新开一趟、快进摆好场面，然后实时放。
// 外面的页面发：{ type:'play', id, k, rate, sound }、{ type:'rate', rate }、{ type:'sound', on }、{ type:'pause', on }、{ type:'stop' }、
// { type:'unlock' }（用户点了页面 / “开声音”：把声音接上）
// 这里回：ready、staging（正在摆）、playing（开始放，dur 秒）、audio（声音出不出得来：state 是 AudioContext 的状态，
// locked = 放着、没暂停、声音却被浏览器挂着——没点过页面就自动放时会这样，外面提示点一下）、tick（放到第几秒）、snd（响了哪一声，游戏时间）、done、error；
// 效果标签由 src/fx/tags.js 直接发 fxtag。
// 慢放：游戏、界面动画、定时器跟着虚拟时钟慢；一下一下的声音按同一个倍数拉长（音高不变）。暂停：虚拟时钟停住，声音挂起。
// 无头里也能直接调：window.__stage.play(id, k, { rate, sound }) → 放完 resolve。
(() => {
  const V = window.__vclock, SC = window.FX_SCENES;
  const host = window.parent !== window ? window.parent : null;
  const send = (m) => { if (host) { try { host.postMessage({ from: 'fxstage', ...m }, '*'); } catch (e) { /* 外面的页面不收就算了 */ } } (window.__stageLog = window.__stageLog || []).push(m); };
  const api = () => window.__api, G = () => window.__game;
  const PEND = 'fxstage.pending';
  const st = { seq: 0, timers: [], held: new Set(), rate: 1, sound: true, paused: false, cur: null, t0: 0, dur: 0, resolve: null, frame: null, g0: 0, gLast: 0 };

  const audio = () => G() && G().audio;
  const applySound = () => {
    const a = audio(); if (!a) return;
    a.start();
    a.setVolume(st.sound ? (api().settings.volume ?? 0.8) : 0);
    a.setMusic(st.music ? (api().settings.music ?? 1) : 0); // 配乐一般关掉，只听效果本身；场面说要配乐的（A3 风吹过的和弦）开着
    if (a.setRate) a.setRate(st.rate);
  };
  // 暂停：虚拟时钟停住（游戏、界面动画、定时器一起停），声音挂起
  const applyPause = () => {
    V.setRate(st.paused ? 0 : st.rate);
    const a = audio();
    if (a && a.ctx) { if (st.paused) a.ctx.suspend(); else if (st.cur) a.ctx.resume(); }
  };
  const later = (sec, fn) => { st.timers.push(setTimeout(fn, sec * 1000)); };
  // 声音现在出不出得来（浏览器的自动播放限制：页面被点过以前 AudioContext 是 suspended）
  const reportAudio = () => {
    const c = audio(), s = c && c.ctx ? c.ctx.state : 'none';
    send({ type: 'audio', state: s, locked: !!(st.cur && st.sound && !st.paused && c && c.ctx && s !== 'running') });
  };
  const tellAudio = (ms = 350) => setTimeout(reportAudio, ms);
  const unlock = () => {
    const a = audio(); if (!a) return;
    a.start();
    if (a.ctx && a.ctx.state !== 'running') a.ctx.resume().then(reportAudio, () => {});
    else reportAudio();
  };
  // 循环声（绞车、放缆、水管、珍品的吊臂吃劲）都收住
  const loopsOff = (a) => { a.play('hose', { on: false }); a.play('winch', { on: false }); a.play('payout', { on: false }); a.play('omenStrain', { on: false }); };
  const keyEv = (type, code) => dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  const release = () => { for (const c of st.held) keyEv('keyup', c); st.held.clear(); };
  const cancel = () => { for (const h of st.timers) clearTimeout(h); st.timers = []; release(); if (st.resolve) { const r = st.resolve; st.resolve = null; r(false); } };
  const clearTags = () => { const b = document.getElementById('fxtags'); if (b) b.textContent = ''; };
  // 摆场面时快进跳过了的循环声（绞车、水管）按现在的状态接上
  const resumeLoops = () => {
    const g = G(), a = audio(); if (!g || !a) return;
    if (g.netFx && g.netFx.resumeSound) g.netFx.resumeSound();
    else if (g.op && g.op.state === 'lifting') a.play('winch', { on: true });
    const R = g.reveal.active;
    if (R && R.phase === 'wash') { a.play('hose', { on: true }); if (R.hoseMat) a.play('hoseTone', { mat: R.hoseMat }); if (R.fast) a.play('hoseTone', { fast: 1 }); }
  };
  const X = {
    // 摆场面时要等真实时间里的事（例如“再来一次”的黑场）
    waitFor: (cond, ms = 5000) => new Promise((res) => {
      const t0 = performance.now();
      const poll = () => { let ok = false; try { ok = cond(); } catch (e) { /* 还没好 */ } if (ok || performance.now() - t0 > ms) res(ok); else setTimeout(poll, 50); };
      poll();
    }),
  };

  async function play(id, k, opt = {}) {
    if (opt.rate != null) st.rate = opt.rate;
    if (opt.sound != null) st.sound = opt.sound;
    cancel();
    st.paused = false; st.frame = null;
    const token = ++st.seq;
    const E = SC.entries.find((e) => e.id === id); if (!E) { send({ type: 'error', msg: '没有这一条：' + id }); return false; }
    const Vt = E.variants.find((v) => v.k === k) || E.variants[0];
    // 标题上的效果：要回到标题，整页重来一次再放
    if (Vt.title && api().mode() !== 'title') {
      try { sessionStorage.setItem(PEND, JSON.stringify({ id, k: Vt.k, rate: st.rate, sound: st.sound })); } catch (e) { /* 存不了就直接在当前画面放 */ }
      send({ type: 'staging', id, k: Vt.k, reload: true });
      location.reload();
      return new Promise(() => {});
    }
    send({ type: 'staging', id, k: Vt.k });
    window.__fxTagMute = true; window.__freeze = true; clearTags();
    const a = audio();
    if (a) { a.start(); a.paused = false; loopsOff(a); a.paused = true; }
    V.setRate(st.rate);
    let spec;
    try { spec = await Vt.run(X); } catch (e) { send({ type: 'error', msg: String(e && e.stack || e) }); window.__fxTagMute = false; return false; }
    if (token !== st.seq) return false;
    st.music = !!(spec.music || Vt.music);
    const b = audio();
    if (b) { b.paused = false; if (b.ctx && b.ctx.state === 'suspended') b.ctx.resume(); applySound(); resumeLoops(); }
    st.chordN = b && b.music ? b.music.chordN : null;
    clearTags();
    window.__fxTagMute = false; window.__freeze = false;
    st.cur = { id, k: Vt.k }; st.t0 = performance.now(); st.dur = spec.dur;
    st.frame = spec.frame || null; st.g0 = st.gLast = G() ? G().time : 0;
    for (const [sec, fn] of spec.at || []) later(sec, () => { try { fn(); } catch (e) { send({ type: 'error', msg: String(e) }); } });
    for (const [code, t0, t1] of spec.hold || []) {
      later(t0, () => { keyEv('keydown', code); st.held.add(code); });
      later(t1, () => { keyEv('keyup', code); st.held.delete(code); });
    }
    send({ type: 'playing', id, k: Vt.k, dur: spec.dur, t0: G() ? G().time : 0, audio: b && b.ctx ? b.ctx.state : 'none' });
    // 声音有没有真的开起来：现在说一次，过一会儿（resume 要一点时间）再说一次
    reportAudio(); tellAudio(400);
    return new Promise((res) => {
      st.resolve = res;
      later(spec.dur, () => {
        release();
        // 放完：画面停在最后一帧，声音收住
        if (api().mode() === 'play') window.__freeze = true;
        st.cur = null; st.frame = null;
        const c = audio(); if (c) { loopsOff(c); c.setVolume(0); }
        send({ type: 'done', id, k: Vt.k });
        if (st.resolve) { const r = st.resolve; st.resolve = null; r(true); }
      });
    });
  }

  const setRate = (r) => { st.rate = r; if (!st.paused) V.setRate(r); const a = audio(); if (a && a.setRate) a.setRate(r); send({ type: 'rate', rate: r }); };
  const setSound = (on) => { st.sound = !!on; if (st.cur) { applySound(); tellAudio(250); } };
  const setPause = (on) => { st.paused = !!on; applyPause(); send({ type: 'pause', on: st.paused }); };
  const stop = () => { cancel(); st.paused = false; V.setRate(st.rate); if (api().mode() === 'play') window.__freeze = true; const c = audio(); if (c) c.setVolume(0); st.cur = null; st.frame = null; };

  // 放的过程中每帧推一把（场面给的 frame，游戏时间）；放的进度（给外面的进度条）
  const tick = () => {
    requestAnimationFrame(tick);
    if (st.cur && st.frame && G()) {
      const gt = G().time, dt = gt - st.gLast; st.gLast = gt;
      if (dt > 0) { try { st.frame(dt, gt - st.g0); } catch (e) { send({ type: 'error', msg: String(e) }); st.frame = null; } }
    }
    // 和弦（A3）不走 play：按 audio 数的和弦数记一笔
    const a = audio();
    if (st.cur && a && a.music && st.chordN != null && a.music.chordN > st.chordN) { st.chordN = a.music.chordN; if (st.sound && st.music) send({ type: 'snd', name: 'chord', t: G() ? +G().time.toFixed(2) : 0 }); }
    if (!st.cur || !host) return;
    const now = performance.now();
    if (now - (st.lastTick || 0) < 100 * st.rate) return;
    st.lastTick = now;
    send({ type: 'tick', t: Math.min(st.dur, (now - st.t0) / 1000), dur: st.dur });
  };

  addEventListener('message', (e) => {
    const m = e.data; if (!m || m.to !== 'fxstage') return;
    if (m.type === 'play') play(m.id, m.k, { rate: m.rate, sound: m.sound });
    else if (m.type === 'rate') setRate(m.rate);
    else if (m.type === 'sound') setSound(m.on);
    else if (m.type === 'pause') setPause(m.on);
    else if (m.type === 'stop') stop();
    else if (m.type === 'unlock') unlock();
  });
  // 直接打开（没点过页面）时声音是挂着的：在画面上点一下也接上
  addEventListener('pointerdown', () => { const c = audio(); if (c && c.ctx && c.ctx.state === 'suspended' && st.cur && !st.paused) c.ctx.resume().then(reportAudio, () => {}); });
  addEventListener('error', (e) => send({ type: 'error', msg: String(e.message) }));

  window.__stage = { play, setRate, setSound, setPause, stop, st };
  // 每一声记一笔（放的时候才记；摆场面时声音是关着的）：名字、游戏时间
  const hookAudio = () => {
    const A = api().audio; if (!A || A.__fxHooked) return;
    A.__fxHooked = true;
    const play0 = A.play.bind(A);
    A.play = (n, o) => {
      const r = play0(n, o);
      // 暂停中设置开着（D3）时声音醒着：拖音量、配乐、晃动那几声照样记
      if (st.cur && (!A.paused || A.awake) && A.ctx) {
        const nm = o && o.on != null ? n + (o.on ? ' 开' : ' 关') : n;
        send({ type: 'snd', name: nm, t: G() ? +G().time.toFixed(2) : 0 });
      }
      return r;
    };
  };
  const boot = () => {
    if (!window.__ready || !window.__warm || !api()) { setTimeout(boot, 60); return; }
    hookAudio();
    requestAnimationFrame(tick);
    let pend = null;
    try { pend = JSON.parse(sessionStorage.getItem(PEND) || 'null'); sessionStorage.removeItem(PEND); } catch (e) { pend = null; }
    send({ type: 'ready', resumed: !!pend });
    if (pend) play(pend.id, pend.k, { rate: pend.rate, sound: pend.sound });
  };
  boot();
})();
