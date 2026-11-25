// 入口：标题、手动航程、自动演示（Esc 停止并接管）、设置、收获单后的“再来一次”、主循环
// 每一趟都是同一片海（固定的世界种子）；没有存档，重新开始就是海底和收获从头来过。
// 机器人（Autopilot）只产生与手柄/键盘相同的输入，经过和玩家完全一样的路径进入游戏。
import { frameTags } from './core/perf.js';
import * as THREE from 'three';
import { View } from './render/view.js';
import { HUD, guard, showWhy } from './ui/hud.js';
import { HELP, capsOf } from './ui/keys.js';
import { Audio } from './audio.js';
import { Input } from './core/input.js';
import { Game } from './game/game.js';
import { Autopilot } from './game/bot.js';
import { AimViz } from './game/aimviz.js';
import { SHARED } from './render/materials.js';
import { warmShaders } from './render/warmup.js';
import { fxTag } from './fx/tags.js';
import { playAgain } from './ui/again.js';
import { FIRSTS } from './game/firsts.js';
import { TitleFx } from './ui/title.js';
import { Opening } from './game/opening.js';
import { demoNudge as bannerNudge, demoTakeover } from './ui/demobanner.js';

const SEED = 20261014; // 归潮沙湾这一片海的固定种子：手动和演示都是它
const SETTINGS_KEY = 'chenzhai.settings';
const stage = document.getElementById('stage');
const canvas = document.getElementById('view');
const hudRoot = document.getElementById('hud');
// 固定 1920×1080：窗口拉宽缩窄、全屏与窗口来回切，只整体等比缩放、两边留黑，看得见的世界范围不变。
// 界面画布（回波、世界标记）按缩放后的屏幕像素重建，字始终是高清的。
function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `scale(${s})`;
  stage.style.left = Math.round((innerWidth - 1920 * s) / 2) + 'px';
  stage.style.top = Math.round((innerHeight - 1080 * s) / 2) + 'px';
  hud.setScale(s, window.devicePixelRatio || 1);
  smallWarn(s);
  stageScale = s;
}
let stageScale = 1;
// 窗口太小：画面按 1920×1080 整体缩小，字会跟着变小——在舞台外用正常大小的字说一句（要玩家动手的）
let warnEl = null, warnT = 0;
function smallWarn(s) {
  if (s >= 0.6) { if (warnEl) warnEl.hidden = true; return; }
  if (!warnEl) { warnEl = document.createElement('div'); warnEl.id = 'smallwarn'; document.body.appendChild(warnEl); }
  warnEl.textContent = '窗口太小，字看不清：拉大窗口或全屏';
  warnEl.hidden = false;
  clearTimeout(warnT); warnT = setTimeout(() => { warnEl.hidden = true; }, 8000);
}
addEventListener('resize', fit);
document.addEventListener('fullscreenchange', () => { fit(); refreshFullscreenButton(); });

// 只记设置（画面、音量）；游戏本身没有存档
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 存储不可用时忽略 */ } },
};
function safeJSON(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }

const settings = Object.assign({ pixel: 2, wave: 1, outline: 1, volume: 0.8, music: 1 }, safeJSON(store.get(SETTINGS_KEY)));
const view = new View(canvas, settings.pixel);
const hud = new HUD(hudRoot);
fit();
const audio = new Audio();
const input = new Input(stage);
const aimViz = new AimViz(view.overlay);
const titleFx = new TitleFx(audio); // 开场：标题亮相、上下选、按“开始航程”（第十四批 G1 G2 G3）
applySettings();

let game = null;
let mode = 'title'; // title | play
let titleEl = null;
let pilot = null;   // 自动演示的机器人：只产生输入
let fadeEl = document.createElement('div'); fadeEl.className = 'fade'; hudRoot.appendChild(fadeEl);

function applySettings() {
  if (view.pixelScale !== settings.pixel) view.setPixelScale(settings.pixel);
  view.post.uniforms.uWave.value = settings.wave;
  view.post.uniforms.uGlint.value = 0.3 * settings.wave;
  view.post.uniforms.uOutline.value = settings.outline;
  audio.setVolume(settings.volume);
  audio.setMusic(settings.music);
  if (game) game.particles.setScale(view.renderer.domElement.height, view.camera.fov);
  store.set(SETTINGS_KEY, JSON.stringify(settings));
}

// 上一趟的几何体、贴图从显存里放掉：不放的话每开一局多 160 多个几何体，效果单一口气放一百多张卡会把浏览器撑垮
// （再来一次、回标题再开、效果单换卡都走 disposeGame）。
// 共享的那些下次用到时 three.js 会自己再传上去；材质（着色器）不动，免得重新编译
const dropGpu = (root) => root.traverse((o) => {
  if (o.isInstancedMesh) o.dispose();
  if (o.geometry) o.geometry.dispose();
  for (const m of [].concat(o.material || [])) for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
});
function disposeGame() {
  if (!game) return;
  dropGpu(view.scene);
  view.scene.clear();
  view.scene.add(view.sun, view.sun.target, view.hemi);
  game = null;
}
function newGame(opts) {
  disposeGame();
  game = new Game({ view, hud, audio, ...opts });
  hud.onPauseAction = onPauseAction;
  hud.onCard = (id) => game && game.dismissCard(id);
  hud.onDrop = () => { if (pilot) demoNudge(); else if (game) game.pressDrop(); };
  // 收获单上按了一下：“再来一次”亮起来以前是跳到盖章，亮了以后才是再来一次（刚弹出来的一小会儿不算，免得下网连按的那一下把它直接按掉）
  hud.onRestart = () => { if (game && game.ended) game.settle.press(); };
  hud.resetTrip();
  hud.setCards([]);
  hud.hideHaul();
  game.piloted = !!pilot;
  window.__game = game;
  return game;
}

// —— 标题 ——
function showTitle() {
  mode = 'title';
  hudRoot.classList.add('title-mode');
  hud.setDemo(!!pilot);
  newGame({ seed: SEED });
  buildTitle();
}
// 标题的字和菜单（开场从头放一遍：G1）
function buildTitle() {
  titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.innerHTML = `<h1>沉债</h1>
    <div class="title-menu">
      <button data-a="new">开始航程</button>
      <button data-a="demo">自动演示</button>
      <button data-a="settings">设置</button>
      <button data-a="help">操作说明</button>
    </div><div class="why"></div>`;
  titleFx.build(titleEl);
  titleFx.onHover = (i) => menuSel(titleEl, i, 'mouse');
  hudRoot.appendChild(titleEl);
  titleEl.onclick = (e) => { const b = e.target.closest('button'); if (b && guard(b)) titleAction(b.dataset.a); };
  menuSel(titleEl, 0);
}
// how：标题上是键盘还是鼠标换的（箭头跟着跳，G2）
function menuSel(root, i, how) {
  const bs = [...root.querySelectorAll('button')];
  bs.forEach((b, k) => b.classList.toggle('sel', k === i));
  root.dataset.sel = i;
  if (how && root === titleEl) titleFx.select(i, how);
}
function titleAction(a) {
  if (titleFx.departing) return; // 已经按了“开始航程”，正在出发
  audio.start(); audio.setMusic(settings.music);
  if (a === 'settings') return showSettings(titleEl);
  if (a === 'help') return showHelp();
  // 开始航程（G3）：标题先演完按下去那一下（车钟、汽笛），再黑场；海面亮起来见 src/game/opening.js
  if (a === 'new' && titleEl && titleFx.depart(titleEl.querySelector('button[data-a="new"]'))) return departTransition();
  if (titleEl) { titleEl.remove(); titleEl = null; titleFx.clear(); }
  transition(() => {
    if (a === 'new') newGame({ seed: SEED });
    else if (a === 'demo') startDemoWorld();
    mode = 'play';
  });
}
// 标题里的“自动演示”：同一片海，机器人从航路起点开始操作
function startDemoWorld() {
  pilot = new Autopilot(pilotView);
  newGame({ seed: SEED, demo: true });
  hud.setDemo(true);
  mode = 'play';
}
// 黑场切换：变黑之后再建新世界；新场景的着色器在黑场下编好再淡入，淡入后的第一帧不会卡
let holdRender = false;
function transition(fn) {
  fadeEl.classList.add('on');
  setTimeout(() => {
    fn();
    if (game) game.dark = true; // 黑场还没淡开：第一次推油门（F1）等画面亮了再放
    hudRoot.classList.toggle('title-mode', mode === 'title');
    holdRender = true;
    const done = () => { holdRender = false; requestAnimationFrame(() => requestAnimationFrame(() => { fadeEl.classList.remove('on'); if (game) { game.dark = false; game.litAt = game.time; } })); };
    Promise.all([view.prepare(view.scene), view.prepare(view.overlay, true)]).then(done, done);
  }, 480);
}

// 按“开始航程”的黑场（G3）：按下去那一下先演 0.12 秒；黑场在汽笛声里过去，黑场里建好新的一趟、镜头摆在船尾后面；
// 黑场一退，海面亮起来（Opening.lightUp）
function departTransition() {
  setTimeout(() => {
    fadeEl.classList.add('on');
    setTimeout(() => {
      if (titleEl) { titleEl.remove(); titleEl = null; }
      titleFx.clear();
      newGame({ seed: SEED });
      mode = 'play';
      game.opening = new Opening(game, hudRoot);
      game.dark = true; // 黑场还没淡开：第一次推油门（F1）等画面亮了再放
      hudRoot.classList.remove('title-mode');
      holdRender = true;
      const g = game;
      const done = () => { holdRender = false; requestAnimationFrame(() => requestAnimationFrame(() => { fadeEl.classList.remove('on'); g.dark = false; g.litAt = g.time; if (g.opening) g.opening.lightUp(); })); };
      Promise.all([view.prepare(view.scene), view.prepare(view.overlay, true)]).then(done, done);
    }, 480);
  }, 120);
}

// 叠在最上面、带按钮的那张卡接键盘和手柄：设置/说明 > 暂停 > 收获单
function topModal(withHaul = true) {
  const rank = (m) => (m.classList.contains('sub') ? 5 : m.classList.contains('pausing') ? 3 : m.classList.contains('haul') ? 1 : 4);
  const ms = [...hudRoot.querySelectorAll('.modal')].filter((m) => !m.hidden && (withHaul || !m.classList.contains('haul')));
  ms.sort((a, b) => rank(a) - rank(b));
  const top = ms.pop();
  return top && top.querySelector('button') ? top : null;
}
// —— 机器人能“看到”的界面（只读）：标题菜单、弹出菜单和游戏画面上的状态 ——
const pilotView = {
  mode: () => mode,
  game: () => game,
  menu: () => {
    const root = mode === 'title' ? titleEl : topModal(false);
    if (!root || root.querySelector('.modal:not([hidden])')) return null;
    const bs = [...root.querySelectorAll('button')];
    return { actions: bs.map((b) => b.dataset.a), sel: Number(root.dataset.sel || 0) };
  },
  hasModal: () => hudRoot.querySelectorAll('.modal:not([hidden]):not(.haul) button').length > 0,
};
// 演示中按了别的键：横幅闪一下（横幅上就是接管的键）
let nudgeT = -10;
// 每按一下横幅上的 Esc 键帽都被按下去；隔 1.2 秒以上的那一下横幅再一跳、轻轻“笃笃”（G5，demobanner.js）
function demoNudge() {
  const now = performance.now() / 1000;
  if (now - nudgeT < 0.12) return; // 同一下按键（键和摇杆同时算到）只算一次
  nudgeT = now;
  bannerNudge(hud, audio);
}
// Esc：机器人停下，从当前状态交给玩家（进行中的一网自然完成）；横幅说“交给你了”往上收走（G5）
function stopPilot() {
  if (pilot) demoTakeover(hud, audio);
  pilot = null;
  hud.setDemo(false);
  if (game && mode === 'play') game.takeOver();
  else if (game) game.piloted = false;
}

function showSettings(back) {
  const m = document.createElement('div');
  m.className = 'modal sub';
  m.innerHTML = `<div class="mcard settings"><div class="mh">设置</div>
    <label>像素颗粒 <select data-k="pixel"><option value="1">1×</option><option value="2">2×</option><option value="3">3×</option></select></label>
    <label>水面晃动 <span class="ctl"><input data-k="wave" type="range" min="0" max="1" step="0.05"><span class="val" data-v="wave"></span></span></label>
    <label>描边 <select data-k="outline"><option value="1">开</option><option value="0">关</option></select></label>
    <label>音量 <span class="ctl"><input data-k="volume" type="range" min="0" max="1" step="0.05"><span class="val" data-v="volume"></span></span></label>
    <label>配乐 <span class="ctl"><input data-k="music" type="range" min="0" max="1" step="0.05"><span class="val" data-v="music"></span></span></label>
    <button data-a="fullscreen">全屏</button>
    <button data-a="close">返回</button><div class="why"></div></div>`;
  hudRoot.appendChild(m);
  const showVals = () => { for (const v of m.querySelectorAll('[data-v]')) v.textContent = Math.round(settings[v.dataset.v] * 100) + '%'; };
  // 调了立刻看得到、听得到（D3）：滑杆的槽按数值填成黄铜色；改画面的几项（像素、晃动、描边）一动，暗幕和设置卡让开，
  // 只留正在调的那一行，背后的海照常晃（暂停中也让水面动起来，见 renderFrame）；松手半秒后回来。
  // 音量：每动一下响一声轻轻的“嗒”，就是新的音量；配乐：一小段和弦；水面晃动：一小阵水声，晃得越大越响
  const SEE = { pixel: '像素颗粒', wave: '水面晃动', outline: '描边' };
  const fill = (el) => { if (el.type === 'range') el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100).toFixed(1) + '%'); };
  let held = false, unpeekT = 0, sndT = {}, tagged = '';
  const peek = (row, ms) => {
    clearTimeout(unpeekT);
    for (const r of m.querySelectorAll('label')) r.classList.toggle('on', r === row);
    m.classList.add('peek'); hudRoot.classList.add('peek'); stage.classList.add('peek');
    if (ms) unpeekT = setTimeout(unpeek, ms);
  };
  const unpeek = () => { if (held) return; m.classList.remove('peek'); hudRoot.classList.remove('peek'); stage.classList.remove('peek'); for (const r of m.querySelectorAll('label.on')) r.classList.remove('on'); };
  const react = (el) => {
    const k = el.dataset.k, row = el.closest('label'), now = performance.now();
    const v = m.querySelector(`[data-v="${k}"]`); if (v) { v.classList.remove('bump'); void v.offsetWidth; v.classList.add('bump'); }
    if (SEE[k]) { peek(row, held ? 0 : 1500); if (tagged !== k) { tagged = k; fxTag('D3', `拖“${SEE[k]}”：设置让开，背后的海面跟着变`, 'D3'); } }
    const snd = { volume: ['level', 90], music: ['taste', 450], wave: ['swash', 260] }[k];
    if (snd && now - (sndT[k] || 0) > snd[1]) { sndT[k] = now; audio.play(snd[0], { v: Number(el.value) }); if (!SEE[k] && tagged !== k) { tagged = k; fxTag('D3', k === 'volume' ? '拖音量：每一下都是新的音量' : '拖配乐：听一小段', 'D3'); } }
  };
  for (const el of m.querySelectorAll('[data-k]')) {
    el.value = settings[el.dataset.k]; fill(el);
    el.oninput = () => { settings[el.dataset.k] = Number(el.value); applySettings(); showVals(); fill(el); react(el); };
    if (el.type === 'range') el.addEventListener('pointerdown', () => { held = true; tagged = ''; if (SEE[el.dataset.k]) peek(el.closest('label'), 0); });
  }
  const up = () => { if (!held) return; held = false; clearTimeout(unpeekT); unpeekT = setTimeout(unpeek, 450); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  settingsOff = () => { removeEventListener('pointerup', up); removeEventListener('pointercancel', up); clearTimeout(unpeekT); };
  showVals();
  m.addEventListener('mousedown', (e) => e.stopPropagation());
  m.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || !guard(b)) return;
    if (b.dataset.a === 'close') m.remove();
    else if (b.dataset.a === 'fullscreen') toggleFullscreen(b);
  };
  refreshFullscreenButton();
}
// 全屏 ⇄ 窗口：画面只整体缩放，看得见的世界范围不变
function fullscreenAllowed() { return !!(document.fullscreenEnabled && document.documentElement.requestFullscreen); }
function refreshFullscreenButton() {
  const b = hudRoot.querySelector('button[data-a="fullscreen"]');
  if (!b) return;
  const on = !!document.fullscreenElement;
  b.innerHTML = on ? '退出全屏' : '全屏';
  b.classList.toggle('disabled', !fullscreenAllowed());
  b.dataset.why = '按浏览器的全屏键：F11（Mac：⌃⌘F）';
}
function toggleFullscreen(b) {
  const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  if (p && p.catch) p.catch(() => showWhy(b, '按浏览器的全屏键：F11（Mac：⌃⌘F）'));
}
// 操作说明：一张键位表（做什么 / 键鼠 / 手柄），别的不写
function showHelp() {
  const m = document.createElement('div');
  m.className = 'modal sub';
  m.innerHTML = `<div class="mcard help"><div class="mh">操作说明</div>
    <table class="keytab">${HELP.map(([t, kb, pad]) => `<tr><td>${t}</td><td>${capsOf(kb)}</td><td>${capsOf(pad)}</td></tr>`).join('')}</table>
    <button data-a="close">返回</button></div>`;
  hudRoot.appendChild(m);
  m.onclick = (e) => { if (e.target.dataset.a === 'close') m.remove(); };
}
function onPauseAction(a) {
  if (!game) return;
  if (a === 'resume') game.setPaused(false);
  else if (a === 'settings') showSettings();
  else if (a === 'help') showHelp();
  else if (a === 'end') { game.endReq = true; game.setPaused(false); }
  else if (a === 'title') { game.setPaused(false); pilot = null; transition(() => showTitle()); }
}

// —— 失焦冻结 ——
document.addEventListener('visibilitychange', () => { if (document.hidden && game && mode === 'play' && !game.paused) game.setPaused(true); });

// —— 每一帧的逻辑（实时与无头快进共用）——
const STEP = 1 / 60;
const ZERO_INPUT = () => ({ move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, zoom: 0, zoomHold: 0, A: false, B: false, C: false, Y: false, start: false, hud: false, click: null, any: false, holdA: false });
let titleT = 0, restarting = false;
function tick(dt, inp) {
  // 真实键盘的 Esc：停止机器人（不打开暂停菜单）
  if (pilot && inp.start) { stopPilot(); inp = { ...inp, start: false }; }
  if (pilot) { if (inp.A || inp.B || inp.C || inp.Y || inp.click || Math.abs(inp.move.x) + Math.abs(inp.move.y) > 0.5) demoNudge(); inp = pilot.drive(dt, inp); }
  if (mode === 'title') { titleFrame(dt, inp); return; }
  if (!game || mode !== 'play') return;
  // 收获单上按了“再来一次”（D1，ui/again.js）：黑场后同一片海从头来过，揭开时船已经在走（演示中的机器人接着开下一趟）
  if (game.restart) {
    if (!restarting) {
      restarting = true;
      playAgain({
        stage, hud: hudRoot, audio,
        build: () => {
          restarting = false;
          newGame({ seed: SEED, demo: !!pilot }); hud.setDemo(!!pilot); mode = 'play';
          game.dark = true; // 黑场里先开上一段（F1 第一次推油门等揭开以后才算）
          game.settle.arrive(1.5, { ...ZERO_INPUT(), move: { x: 0, y: 1 } });
          holdRender = true;
        },
        lit: () => { if (game) { game.dark = false; game.litAt = game.time; } },
        prepare: () => Promise.all([view.prepare(view.scene), view.prepare(view.overlay, true)]).finally(() => { holdRender = false; }),
      });
    }
    return;
  }
  // 手柄/键盘操作弹出菜单（暂停、设置、说明）
  const m = topModal();
  if (m) {
    const bs = [...m.querySelectorAll('button')];
    let i = Math.min(bs.length - 1, Number(m.dataset.sel || 0));
    const prev = inp.move.y > 0.5 || inp.move.x < -0.5, next = inp.move.y < -0.5 || inp.move.x > 0.5;
    if (prev && !m._ly) i = (i - 1 + bs.length) % bs.length;
    if (next && !m._ly) i = (i + 1) % bs.length;
    m._ly = prev || next;
    bs.forEach((b, k) => b.classList.toggle('sel', k === i)); m.dataset.sel = i;
    if (inp.A && bs[i]) { bs[i].click(); inp = { ...inp, A: false }; }
    if (inp.B && m.classList.contains('sub')) { m.remove(); inp = { ...inp, B: false }; }
  }
  // 推进：按这一帧的真实时长推进，长帧切成不超过 1/60 s 的小步（120 Hz 屏每帧一小步，不会出现“这帧不动、下帧走两步”）
  const n = Math.min(6, Math.max(1, Math.ceil(dt / STEP - 1e-3)));
  const h = dt / n;
  for (let i = 0; i < n; i++) game.update(h, i ? holdOnly(inp) : inp);
  game.world.service(game.boat.x, game.boat.z);
}
function titleFrame(dt, inp) {
  titleT += dt;
  if (titleEl && titleFx.departing) inp = ZERO_INPUT(); // 正在出发：别的键不算
  if (titleEl && (inp.any || Math.abs(inp.move.y) > 0.5)) titleFx.skip(); // 开场还没放完就按了键：剩下的加快放完
  if (titleEl) {
    const bs = [...titleEl.querySelectorAll('button')];
    let i = Number(titleEl.dataset.sel || 0);
    if (inp.move.y > 0.5 && !titleEl._ly) { i = (i - 1 + bs.length) % bs.length; menuSel(titleEl, i, 'key'); audio.play('nav'); fxTag('B22', '一声拆开·标题上下选'); }
    if (inp.move.y < -0.5 && !titleEl._ly) { i = (i + 1) % bs.length; menuSel(titleEl, i, 'key'); audio.play('nav'); fxTag('B22', '一声拆开·标题上下选'); }
    titleEl._ly = Math.abs(inp.move.y) > 0.5;
    if (inp.A && bs[i] && guard(bs[i])) titleAction(bs[i].dataset.a);
  }
  if (game) {
    // 标题背景：慢慢绕着沉船湾转（开场时镜头从贴着水面升起来，见 src/ui/title.js）
    game.time += dt;
    SHARED.uTime.value = game.time;
    const cx = 296, cz = 26;
    titleFx.frame(dt, game, view);
    game.world.update(cx, cz, 3);
    game.world.service(cx, cz);
    game.updateCreatures(dt);
    game.particles.update(dt, null);
    game.boat.updateVisual(game.time);
  }
}
function holdOnly(i) { return { ...i, A: false, B: false, C: false, Y: false, start: false, hud: false, click: null, look: { x: i.look.x, y: i.look.y }, zoom: 0 }; }

// —— 帧时间记录（无头验收读取）——
const perf = { n: 0, ring: new Float32Array(600 * 4), long: [], worst: 0, prevTags: '' };
function recordPerf(dtMs, updMs, renMs) {
  const k = (perf.n++ % 600) * 4;
  perf.ring[k] = dtMs; perf.ring[k + 1] = updMs; perf.ring[k + 2] = renMs; perf.ring[k + 3] = game ? game.time : 0;
  const tags = frameTags.join(' '); frameTags.length = 0;
  if (dtMs > 25 && perf.n > 5 && mode === 'play') { perf.long.push([+(game ? game.time : 0).toFixed(2), +dtMs.toFixed(1), +updMs.toFixed(1), +renMs.toFixed(1), perf.prevTags + ' | ' + tags]); if (perf.long.length > 200) perf.long.shift(); }
  perf.prevTags = tags;
}

// —— 主循环 ——
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
  const inp = input.poll();
  if (inp.any) audio.start();
  hud.setDevice(input.dev);
  const t0 = performance.now();
  if (window.__freeze && game && mode === 'play') { renderFrame(0); return; }
  tick(dt, inp);
  const t1 = performance.now();
  renderFrame(dt);
  recordPerf(dt * 1000, t1 - t0, performance.now() - t1);
}
// 设置开着（D3）：暂停中也让水面动起来（只动水面这一层的时间，游戏本身照样停着），拖“水面晃动”时看得见它怎么晃；
// 关上设置时慢慢停住。设置关上时把“让开”收回、声音照常挂起
let waterLead = 0, waterRate = 0, settingsWas = false, settingsOff = null;
function settingsFrame(dt) {
  const open = !!hudRoot.querySelector('.modal.sub .settings');
  if (open !== settingsWas) {
    settingsWas = open;
    audio.setAwake(open);
    if (!open) { hudRoot.classList.remove('peek'); stage.classList.remove('peek'); if (settingsOff) settingsOff(); settingsOff = null; }
  }
  waterRate += ((open && game && game.paused ? 1 : 0) - waterRate) * Math.min(1, dt * 5);
  if (waterRate < 1e-3) waterRate = 0;
  waterLead += dt * waterRate;
}
function renderFrame(dt) {
  if (!game || holdRender) return;
  settingsFrame(dt);
  if (mode === 'title') {
    view.updateWater(296, 26);
    view.render(game.time);
    hud.drawOverlay(game, true);
    audio.update(dt, game);
    return;
  }
  hud.update(dt, game);
  audio.update(dt, game);
  aimViz.update(game);
  view.updateWater(game.boat.x, game.boat.z);
  view.render(game.time, game.time + waterLead);
  hud.drawOverlay(game, false);
}

// —— 测试接口（无头自动验证用）——
window.__api = {
  startDemo: () => { if (titleEl) { titleEl.remove(); titleEl = null; } startDemoWorld(); hudRoot.classList.remove('title-mode'); return true; },
  startManual: () => { if (titleEl) { titleEl.remove(); titleEl = null; } pilot = null; newGame({ seed: SEED }); mode = 'play'; hudRoot.classList.remove('title-mode'); return true; },
  stopPilot: () => { stopPilot(); return true; },
  firsts: FIRSTS,   // 第一次（F1–F10）放过没有：reset(编号…) 重新算没放过，skipAll() 当作都放过（效果单、测试用）
  pilot: () => pilot,
  mode: () => mode,
  // 标题的开场从头再放一遍（效果单 G1、G2 用；不重建这片海）
  replayTitle: () => { if (mode !== 'title' || !titleEl) return false; titleEl.remove(); titleFx.clear(); buildTitle(); return true; },
  titleFx,
  // 快进：不渲染地推进 n 秒（固定步长，与实机同一套规则；机器人照样只产生输入）
  sim: (secs, inpFn) => { const n = Math.round(secs / STEP); for (let i = 0; i < n; i++) tick(STEP, inpFn ? { ...ZERO_INPUT(), ...inpFn(i) } : ZERO_INPUT()); if (game) hud.update(secs, game); return game ? game.time : 0; },
  render: () => { renderFrame(0.016); return true; },
  key: (k) => { input.pressed.add(k); return true; },
  perf: () => ({ n: perf.n, long: perf.long.slice(), recent: Array.from(perf.ring) }),
  resetPerf: () => { perf.long = []; perf.n = 0; return true; },
  overlay: () => ({ placed: hud.overlay.placed.map((r) => ({ ...r })), icons: hud.overlay.icons.map((r) => ({ ...r })) }),
  scale: () => stageScale,
  hud, audio, fit,
  store, settings, applySettings, view, SHARED,
};

// 点横幅也能接管（G5）
hud.el.demo.addEventListener('click', () => { if (pilot) stopPilot(); });
hud.el.demo.title = '点一下也能接管';
showTitle();
warmShaders(view, game, aimViz).then(() => { window.__warm = true; });
requestAnimationFrame(frame);
window.__ready = true;
