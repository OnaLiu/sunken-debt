// F10 / 标志时刻 S5：第一次看清沉船。只第一次；以后看清别处、或者再来一趟，都还是平常的 B1。
//   预兆（离沉船 78 米起，开着船）：测深仪自己弹出来，海底线上鼓起一个琥珀色的包，一下一下“嘀——咚”，越近包越高、回声越快；
//                                  附近的鱼群掉头，都往沉船那边游
//   憋住（48 米起）：船驶过坡顶，水往下暗——沉船那一片又暗又浑，只剩一团说不清的暗影；画面四角压暗一点；
//                   底下一层很低的音慢慢涨上来；镜头往前探、往下看一点
//   爆发（看清的那一下，34 米）：`find` 照响，底下垫一声沉沉的“咚”和低低的五度；从沉船中间往外推开一圈清水（亮边扫过去，
//                   圈里反光收掉、水下更清楚），深色的船壳就在里面；沿着船壳一串串气泡冒上来；名字从水里浮上来（两行）；
//                   镜头拉高、往下看，把船和沉船一起框进来（玩家一动视角就让回去）
//   余波（0.55 秒）：船长指过去，船员都走到靠沉船那一边的船舷，扶着栏杆往下看
//   余韵：配乐的下一个和弦换成一个更低更宽的（只这一次），之后照常
// 画面上的水由 post.js 的 uSight / uSightB 画；测深仪由 hud.js 问 sounderOn()、在每个采样上加 echo。
import { fxTag } from '../fx/tags.js';
import { stageOf } from '../ui/notes.js';
import { heightAt } from '../world/layout.js';

const OMEN_D = 78, HOLD_D = 48;
const B = { win: 1.5, winR: 30, zone: 40, name: 0.6, crew: 0.55, camIn: 1.2, camHold: 5.4, camOut: 1.6, clear: 6.0, clearOut: 2.4 };
const DIRTY = { on: false };
const ss = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const ease = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);

export class WreckSight {
  constructor(g, L) {
    this.g = g; this.L = L;
    this.site = null; this.key = null; this.prev = null;
    this.phase = 'wait';
    this.omenK = 0; this.holdK = 0; this.d = 1e9;
    this.bt = 0; this.echoT = 0; this.fishT = 0; this.tagged = {};
    this.swell = null; this.touched = false;
    // 上一局在半中间被重开了：水面、画面的调子先放回原样（post 的几样是全局共用的）
    if (DIRTY.on) { DIRTY.on = false; this.touched = true; this.restore(); }
  }
  findSite() {
    for (const r of this.g.world.regions.values()) for (const s of r.sites) if (s.id === 'wreck') { this.site = s; this.key = r.id + ':' + s.id; this.prev = this.g.known.sites[this.key]; return; }
  }
  update(dt) {
    const g = this.g;
    if (this.phase === 'done') return;
    if (!this.site) { this.findSite(); if (!this.site) return; }
    const s = this.site, b = g.boat, c = g.cam.look;
    this.d = Math.min(Math.hypot(s.x - b.x, s.z - b.z), Math.hypot(s.x - c.x, s.z - c.z) + 6);
    const k = g.known.sites[this.key];
    if (this.phase === 'wait') {
      // 看清的那一下（game.updateDiscovery 这一帧刚把它记成 near，B1 已经照常响过、画过圈）
      if (k === 'near' && this.prev !== 'near') { this.prev = k; if (this.L.first('F10')) this.burst(); else this.finish(); return; }
      this.prev = k;
      if (k === 'near' || this.L.has('F10')) { this.finish(); return; }
      this.before(dt);
      return;
    }
    this.after(dt);
  }

  // —— 预兆、憋住 ——
  before(dt) {
    const g = this.g, s = this.site, b = g.boat;
    const sailing = g.mode === 'sail' && !g.op && !g.reveal.busy && !g.ended && Math.abs(b.speed) > 0.8;
    const omenT = sailing && this.d < OMEN_D ? 1 : 0;
    const holdT = sailing ? ss(HOLD_D, s.near + 7, this.d) : 0;
    this.omenK += (omenT - this.omenK) * Math.min(1, dt * 2.2);
    this.holdK += (holdT - this.holdK) * Math.min(1, dt * 3);
    if (this.omenK < 0.01 && this.holdK < 0.01) { if (this.touched) this.restore(); this.stopSwell(1.2); this.tagged = {}; return; }
    this.touched = true; DIRTY.on = true;
    const pan = g.screenOf ? g.screenOf(s.x, s.z).pan : 0;
    if (omenT && !this.tagged.omen) { this.tagged.omen = true; this.echoT = 0.25; this.fishT = 0; fxTag('F10', '第一次看清沉船·预兆（测深仪鼓包、鱼群往一边游）', 'F10'); }
    // 测深仪一下一下“嘀——咚”，越近回声越快
    if (omenT) {
      this.echoT -= dt;
      if (this.echoT <= 0) { const e = this.closeness(); this.echoT = 1.25 - 0.45 * e; g.audio && g.audio.play('sonarEcho', { k: e, pan }); }
      this.fishT -= dt;
      if (this.fishT <= 0) { this.fishT = 2; this.fish(); }
    }
    if (holdT > 0.05 && !this.tagged.hold) { this.tagged.hold = true; fxTag('F10', '第一次看清沉船·憋住（过坡顶、水变暗）', 'F10'); this.startSwell(); }
    if (holdT < 0.02 && this.holdK < 0.05 && this.tagged.hold) { this.tagged.hold = false; this.stopSwell(1.0); }
    const U = g.view.post.uniforms;
    U.uSight.value.set(s.x, s.z, 0, B.zone);
    U.uSightB.value.set(this.holdK, 0, 0, 0);
    U.uGrade.value.set(1 - 0.13 * this.holdK, 1 - 0.11 * this.holdK, 1 - 0.08 * this.holdK, -0.12 * this.holdK);
    U.uVignette.value = 0.35 + 0.2 * this.holdK;
  }
  closeness() { return 1 - Math.max(0, Math.min(1, (this.d - this.site.near) / (OMEN_D - this.site.near))); }
  // 附近的鱼群掉头往沉船那边游（受惊那一套：游得快、挤得紧）
  fish() {
    const g = this.g, s = this.site, b = g.boat;
    for (const r of g.world.regions.values()) for (const c of r.creatures) {
      if (c.kind !== 'school') continue;
      const [cx, cz] = c.center(), dw = Math.hypot(s.x - cx, s.z - cz);
      if (Math.hypot(cx - b.x, cz - b.z) > 62 || dw < 10) continue;
      c.flee = Math.max(c.flee, 2.3); c.fx = (s.x - cx) / dw; c.fz = (s.z - cz) / dw; c.feed = null;
    }
  }
  startSwell() {
    const A = this.g.audio, b = this.g.boat;
    if (!A || !A.ctx || A.paused || this.swell) return;
    // 照现在的船速，涨到顶正好赶上看清的那一下
    const eta = Math.max(1.2, Math.min(3.2, (this.d - this.site.near) / Math.max(2, Math.abs(b.speed))));
    A.play('deepSwell', { dur: +eta.toFixed(2), hold: 5 });
    // 同时海浪、发动机、配乐一路压下去（屏住气），低音才听得出来
    A.play('bedDuck', { to: 0.32, fade: +eta.toFixed(2) });
    this.swell = true;
  }
  // 低音掐掉、环境底放回来：back = [隔几秒, 用几秒]（爆发以后慢慢回来；船开走了就跟着低音一起回）
  stopSwell(fade = 0.08, back = null) {
    const A = this.g.audio, on = this.swell; this.swell = null;
    if (!on || !A) return;
    A.play('deepSwellCut', { fade });
    A.play('bedDuck', { to: 1, delay: back ? back[0] : 0, fade: back ? back[1] : fade + 0.4 });
  }
  restore() {
    const U = this.g.view.post.uniforms;
    U.uSight.value.set(0, 0, 0, 0); U.uSightB.value.set(0, 0, 0, 0);
    if (!this.g.reveal.busy) { U.uGrade.value.set(1, 1, 1, 0); U.uVignette.value = 0.35; }
    this.touched = false; DIRTY.on = false;
  }
  finish() { if (this.touched) this.restore(); this.stopSwell(1.0); this.phase = 'done'; }

  // —— 爆发 ——
  burst() {
    const g = this.g, s = this.site, A = g.audio;
    this.phase = 'burst'; this.bt = 0; this.hold0 = this.holdK; this.touched = true; DIRTY.on = true;
    this.stopSwell(0.06, [0.7, 2.2]);
    const pan = g.screenOf ? g.screenOf(s.x, s.z).pan : 0;
    A && A.play('findDeep', { pan });
    // 这一次不画 B1 的圈和小名字（清水的亮边、气泡、大名字顶替它们；B1 的“咕—叮”照响）
    g.pings = g.pings.filter((p) => !(p.x === s.x && p.z === s.z && p.stage === 'near'));
    // 船壳上哪几处冒泡：沉船那一片里比海底高出一截的地方（就是船壳），按离中间多远排先后（清水的边扫到时冒）
    this.bubbles = [];
    for (let i = 0; i < 90 && this.bubbles.length < 30; i++) {
      const a = i * 2.39996, rr = s.r * Math.sqrt((i + 0.5) / 90);
      const x = s.x + Math.cos(a) * rr, z = s.z + Math.sin(a) * rr, top = g.world.surfaceTop(x, z);
      if (top - heightAt(x, z) > 1.2) this.bubbles.push({ x, z, top, at: B.win * Math.min(1, rr / B.winR) * 1.15 + 0.05, n: 0 });
    }
    // 余韵：配乐的下一个和弦等到这里来放（太近就晚一点，太远就早一点）
    const M = A && A.music;
    this.coda = { at: Math.max(2.6, Math.min(6, M ? M.next : 3.2)), done: false };
    // 这一段里不放平常的和弦（万一这一局半中间被重开，过了这一刻配乐照常往下走）
    if (M) M.next = this.coda.at + 0.6;
    this.crew = null; this.cam = { w: 0, cancel: false };
    fxTag('F10', '第一次看清沉船·爆发（船壳浮现、名字浮上来）', 'F10');
  }
  after(dt) {
    const g = this.g, s = this.site, U = g.view.post.uniforms;
    this.bt += dt;
    const t = this.bt;
    // 清水推开：窗口 0 → 30 米，边上一道亮线扫过去；圈里清一阵再慢慢回到平常
    const r = B.winR * ease(t / B.win);
    U.uSight.value.set(s.x, s.z, r, B.zone);
    const murk = this.hold0 * (1 - ss(0, 1.3, t));
    const rim = t < B.win + 0.7 ? 1.15 * Math.pow(1 - t / (B.win + 0.7), 1.3) : 0;
    const clear = t < B.clear ? Math.min(1, t / 0.25) : Math.max(0, 1 - (t - B.clear) / B.clearOut);
    U.uSightB.value.set(murk, rim, clear, 0);
    // 画面：暗下去的那一层在 0.5 秒里提回来、略亮一点，再落回原样
    const lift = ss(0, 0.5, t) * (1 - ss(0.8, 2.6, t));
    const dk = this.hold0 * (1 - ss(0, 0.5, t));
    if (!g.reveal.busy) {
      U.uGrade.value.set(1 - 0.13 * dk + 0.05 * lift, 1 - 0.11 * dk + 0.06 * lift, 1 - 0.08 * dk + 0.05 * lift, -0.12 * dk + 0.08 * lift);
      U.uVignette.value = 0.35 + 0.2 * this.hold0 * (1 - ss(0, 1.0, t));
    }
    // 气泡：清水的边扫到哪里，哪里的船壳冒一串，接着再冒两三下
    const P = g.particles;
    for (const q of this.bubbles) {
      if (t < q.at || q.n >= 4 || t < q.at + q.n * 0.45) continue;
      q.n++;
      for (let i = 0; i < (q.n === 1 ? 9 : 4); i++) P.water.emit(q.x + (Math.random() - 0.5) * 1.6, q.top + 0.3, q.z + (Math.random() - 0.5) * 1.6, 0, 1.5 + Math.random() * 1.4, 0, 2.6 + Math.random() * 1.6, 0.08 + Math.random() * 0.08, 0.82, 0.96, 1.0, 0.75, 0, 0, -0.35);
      if (q.n === 2) for (let i = 0; i < 6; i++) { const a = Math.random() * 6.283, v = 0.6 + Math.random() * 0.8; P.water.emit(q.x, 0.06, q.z, Math.cos(a) * v, 0, Math.sin(a) * v, 1.4, 0.2 + Math.random() * 0.12, 0.92, 0.98, 1.0, 0.55, 1.4, 0.9, 0, 0); }
    }
    // 名字从水里浮上来
    if (t >= B.name && !this.named) { this.named = true; this.nameCard(); }
    // 余波：船长指过去，船员都走到靠沉船那一边的船舷边往下看
    if (t >= B.crew && !this.crew) this.toRail();
    if (this.crew) this.keepLooking();
    // 余韵
    if (!this.coda.done && t >= this.coda.at) {
      this.coda.done = true;
      const A = g.audio;
      if (A && A.music && A.music.bus) { A.play('wideChord'); A.music.next = 11; }
      else if (A && A.music) A.music.next = 2;
      fxTag('F10', '第一次看清沉船·余韵（换成一个更低更宽的和弦）', 'F10');
    }
    if (t > B.clear + B.clearOut && this.coda.done && t > B.camIn + B.camHold + B.camOut) { this.restore(); this.phase = 'done'; }
  }
  nameCard() {
    const g = this.g, s = this.site, L = this.L;
    if (!L.notes) return;
    const sub = String(s.note || '').replace(/，/g, ' · ');
    // 挂在沉船背着船的那一头（船就停在旁边时不压住船）
    const b = g.boat, dx = s.x - b.x, dz = s.z - b.z, D = Math.hypot(dx, dz) || 1, ax = s.x + dx / D * 7, az = s.z + dz / D * 7;
    L.notes.add({
      cls: 'wreckname', html: `<div class="wn1">${s.label}</div>${sub ? `<div class="wn2">${sub}</div>` : ''}`,
      at: () => stageOf(g.view.camera, ax, 0.4, az, 0.3), place: 'above', life: 5.6, gap: 36, from: 1, minY: 150,
      // 从水里浮上来：往上漂 22 像素，糊的地方一点点变清楚；第二行晚 0.35 秒
      tick: (n) => {
        const u = ease(n.t / 1.1), u2 = ease((n.t - 0.35) / 1.0);
        n.el.style.setProperty('--rise', ((1 - u) * 22).toFixed(1) + 'px');
        n.el.style.setProperty('--blur', ((1 - u) * 5).toFixed(2) + 'px');
        n.el.style.setProperty('--sub', u2.toFixed(3));
      },
    });
  }
  // 沉船在甲板坐标里在哪（船还在走，每帧重算）
  deckOf() { const b = this.g.boat; return b.worldToLocal2(this.site.x, this.site.z); }
  toRail() {
    const g = this.g, C = g.crew, [lx, lz] = this.deckOf(), side = Math.sign(lx) || 1;
    C.captain.gesture('point', { x: lx, z: lz });
    const spots = [[side * 2.1, 1.35], [side * 2.15, -0.8], [side * 1.85, 4.2], [side * 2.15, -4.4]];
    const free = C.hands.filter((s) => s.g.visible && !s.hold && !(s.task && (s.task.type === 'carry' || s.task.type === 'hose' || s.task.type === 'admire')));
    this.crew = [];
    for (const sp of spots) {
      if (!free.length) break;
      free.sort((p, q) => Math.hypot(p.x - sp[0], p.z - sp[1]) - Math.hypot(q.x - sp[0], q.z - sp[1]));
      const s = free.shift();
      s.task = { type: 'lean', idle: true, phase: 'go', x: sp[0], z: sp[1], face: [lx, lz], dur: 6.5, t: 0, f10: true };
      s.walkTo(sp[0], sp[1]);
      this.crew.push(s);
    }
    fxTag('F10', '第一次看清沉船·余波（船员走到船舷边）', 'F10');
  }
  keepLooking() {
    const [lx, lz] = this.deckOf();
    for (const s of this.crew) if (s.task && s.task.f10) s.task.face = [lx, lz];
  }

  // —— 镜头：憋住时往前探、往下看一点；爆发时拉高往下看，把船和沉船一起框进来 ——
  frame(want, look, dt, inp) {
    if (this.phase === 'done' || !this.site) return;
    const g = this.g, s = this.site, b = g.boat;
    const dx = s.x - b.x, dz = s.z - b.z, D = Math.hypot(dx, dz) || 1, ux = dx / D, uz = dz / D;
    if (this.phase === 'wait') {
      const h = this.holdK; if (h < 0.01) return;
      look.x += ux * 6 * h; look.z += uz * 6 * h; want.x += ux * 6 * h; want.z += uz * 6 * h; want.y += 3.5 * h;
      return;
    }
    const C = this.cam, t = this.bt;
    if (Math.abs(inp.look.x) + Math.abs(inp.look.y) > 0.05) C.cancel = true;
    const tw = C.cancel ? 0 : t < B.camIn + B.camHold ? ease(t / B.camIn) : 1 - ss(B.camIn + B.camHold, B.camIn + B.camHold + B.camOut, t);
    C.w += (tw - C.w) * Math.min(1, dt * (C.cancel ? 3 : 6));
    if (C.w < 0.002) return;
    // 看船和沉船中间偏沉船一点、水下 3 米；从现在镜头的方向拉高到 56°、退到装得下两样
    const tx = b.x + dx * 0.55, tz = b.z + dz * 0.55, ty = -3;
    let vx = want.x - look.x, vz = want.z - look.z; const vl = Math.hypot(vx, vz) || 1; vx /= vl; vz /= vl;
    const dist = Math.max(46, D * 1.05 + 18), pitch = 0.98;
    const px = tx + vx * Math.cos(pitch) * dist, pz = tz + vz * Math.cos(pitch) * dist, py = ty + Math.sin(pitch) * dist;
    const w = C.w;
    want.x += (px - want.x) * w; want.y += (py - want.y) * w; want.z += (pz - want.z) * w;
    look.x += (tx - look.x) * w; look.y += (ty - look.y) * w; look.z += (tz - look.z) * w;
  }

  // —— 测深仪 ——
  sounderOn() { return (this.phase === 'wait' && this.omenK > 0.3) || (this.phase === 'burst' && this.bt < 3); }
  sounderRange() { return this.sounderOn() ? 14 : 0; }
  // 每个采样：预兆时海底线上鼓起一个包，越近越高，看清前几乎顶到水面；爆发后一秒内还留着
  echo(smp) {
    if (!this.site) return;
    const k = this.phase === 'wait' ? this.omenK : this.phase === 'burst' && this.bt < 1 ? 1 : 0;
    if (k < 0.2) return;
    const e = this.closeness(), deep = -smp.top, rise = 1.2 + Math.max(0, deep - 2.4) * Math.pow(e, 1.1);
    smp.echo = smp.top + rise * (0.86 + 0.14 * Math.sin(this.g.time * 9)); smp.echoK = k;
  }
}
