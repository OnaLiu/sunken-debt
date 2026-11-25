import * as THREE from 'three';
import { Pipeline } from './render/pipeline.js';
import { U, toon } from './render/materials.js';
import { World } from './world/world.js';
import { followWater } from './world/water.js';
import { buildItemModel, setItemMud, setItemGlint } from './world/items.js';
import { ITEM_DEFS } from './world/layout.js';
import { Sailor } from './life/crew.js';
import { Crab } from './life/crab.js';
import { LeviathanBody } from './life/leviathan.js';
import { Bundle } from './game/bundle.js';
import { buildRays, poseRays } from './game/reveal.js';
import { Particles, projScaleFor } from './fx/particles.js';
import { buildBoat } from './world/boat.js';
import { VIEW_W, VIEW_H, WASH_PRECIOUS } from './config.js';
import { smoothstep, clamp, easeOut, easeOutBack } from './util/math.js';
import { key } from './ui/hud.js';
import { installArt } from './ui/pixelart.js';
import { loadAssets } from './assets/assets.js';

// 效果页：和游戏、自动演示同一套模型和特效，一页看完。1-6 切换，拖动转视角。
// 画面上只有标签页（键 + 名字）和每样东西头上的名字：物件挂游戏里同一种货签，动作只写一行字。
const canvas = document.getElementById('view');
const stage = document.getElementById('stage');
function fit() {
  const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  stage.style.transform = `translate(${(window.innerWidth - VIEW_W * s) / 2}px, ${(window.innerHeight - VIEW_H * s) / 2}px) scale(${s})`;
}
window.addEventListener('resize', fit);
fit();

// 素材先解码，再建场景
loadAssets().catch((e) => console.error('素材', e)).then(start);

function start() {
  const pipe = new Pipeline(canvas);
  const world = new World();
  const scene = world.scene;
  // 展台附近不要航路浮标和浅滩标杆
  world.lane.visible = false;
  world.mark.visible = false;
  const fx = new Particles(3000);
  scene.add(fx.points, fx.above);
  const cam = new THREE.PerspectiveCamera(32, VIEW_W / VIEW_H, 0.3, 900);
  const ui = document.getElementById('ui');
  // 面板、货签、键帽的像素画（和游戏里同一套）
  installArt();

  // 一块浮在浅滩边上的木排，当展台
  const O = new THREE.Vector3(-118, 0, -52);
  const raft = new THREE.Group();
  raft.position.copy(O);
  scene.add(raft);
  {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 7.5), toon({ color: 0x9a7a52 }));
    deck.position.y = 0.35;
    deck.castShadow = true;
    raft.add(deck);
    for (let i = -7; i <= 7; i += 1) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 7.5), toon({ color: 0x6e5436 }));
      plank.position.set(i + 0.5, 0.61, 0);
      raft.add(plank);
    }
  }
  const TOP = 0.61;

  const tabs = [
    { k: 'items', t: '物件' },
    { k: 'crew', t: '船员' },
    { k: 'crab', t: '蟹' },
    { k: 'reveal', t: '珍贵揭晓' },
    { k: 'boat', t: '打捞船' },
    { k: 'deep', t: '大轮廓' },
  ];
  let tab = 0;
  const groups = {};
  const labels = [];

  // —— 1. 物件 ——
  groups.items = new THREE.Group();
  raft.add(groups.items);
  const itemModels = [];
  {
    const kinds = Object.keys(ITEM_DEFS).filter((k) => k !== 'crab');
    const cols = 6;
    kinds.forEach((k, i) => {
      const m = buildItemModel(k, { seed: 0.3 + i * 0.07, mud: 1, inflate: 0.04 });
      const r = i % cols, row = Math.floor(i / cols);
      const x = -5.0 + r * 2.0, z = -2.6 + row * 1.9;
      m.group.position.set(x, TOP, z);
      groups.items.add(m.group);
      itemModels.push({ m, k, x, z, ph: i * 0.35 });
      // 签子贴着东西顶上挂：挂高了会落到后一排的东西上，分不清是谁的
      labels.push({ tab: 'items', obj: m.group, text: ITEM_DEFS[k].name, h: ((m.info && m.info.h) || 0.3) + 0.2, tag: ITEM_DEFS[k].precious ? 'p' : '' });
    });
  }

  // —— 2. 船员 ——
  groups.crew = new THREE.Group();
  raft.add(groups.crew);
  const poses = [['stand', '待机'], ['walk', '走路'], ['carryWalk', '搬货'], ['hose', '冲洗'], ['coil', '理缆'], ['lookout', '瞭望'], ['cheer', '欢呼'], ['lever', '操纵吊机'], ['crouch', '弯腰拿起'], ['watch', '看热闹'], ['rail', '趴舷边'], ['flinch', '吓一跳']];
  const sailors = poses.map(([p, n], i) => {
    const s = new Sailor(i % 4, [-6.2 + i * 1.13, 0.6]);
    s.pose = p;
    s.face = s.faceT = -Math.PI / 2;
    groups.crew.add(s.root);
    labels.push({ tab: 'crew', obj: s.root, text: n, h: 2.3 });
    if (p === 'carryWalk' || p === 'crouch') {
      const box = buildItemModel(p === 'carryWalk' ? 'jar' : 'sack', { mud: 0 });
      if (p === 'carryWalk') { s.hold.add(box.group); box.group.position.set(0, -0.05, 0); }
    }
    return s;
  });

  // —— 3. 蟹 ——
  groups.crab = new THREE.Group();
  raft.add(groups.crab);
  const crabs = [
    { c: new Crab({ scale: 2.4, color: 0xc85a2c }), n: '横着走', mode: 'walk' },
    { c: new Crab({ scale: 2.4, color: 0xc85a2c }), n: '翻泥', mode: 'dig' },
    { c: new Crab({ scale: 2.4, color: 0xb4602e }), n: '网里挣动', mode: 'struggle' },
    { c: new Crab({ scale: 2.4, color: 0xc85a2c }), n: '受惊举螯', mode: 'threat' },
  ];
  crabs.forEach((o, i) => {
    o.c.group.position.set(-3.9 + i * 2.6, TOP, 0);
    groups.crab.add(o.c.group);
    labels.push({ tab: 'crab', obj: o.c.group, text: o.n, h: 0.9 });
  });

  // —— 4. 珍贵揭晓：泥团 → 一拍一拍崩开 → 看清就揭晓 → 确认高光 ——
  // 和游戏里同一套冲法（bundle.schedule / washPlates / burst）：按这个镜头看过去排好哪块先崩，泥壳一块块剥落，
  // 每一拍多露出一角；看得清是什么的那一块一崩，剩下的壳一下崩飞、东西身上的泥甩掉，就揭晓
  groups.reveal = new THREE.Group();
  raft.add(groups.reveal);
  let rv = null;
  function makeReveal() {
    if (rv) groups.reveal.remove(rv.b.group);
    const model = buildItemModel('chest', { seed: 0.5, mud: 1, inflate: 0.045 });
    const it = { kind: 'chest', def: ITEM_DEFS.chest, model, r: ITEM_DEFS.chest.r, h: model.info.h, tilt: 0, bury: 0 };
    const sack = buildItemModel('sack', { seed: 0.2, mud: 1, inflate: 0.045 });
    const it2 = { kind: 'sack', def: ITEM_DEFS.sack, model: sack, r: ITEM_DEFS.sack.r, h: sack.info.h, tilt: 0.2, bury: 0 };
    const b = new Bundle([it, it2]);
    b.group.position.set(0, TOP, 0);
    groups.reveal.add(b.group);
    rv = { b, it, it2, t: 0, w: 0, T: WASH_PRECIOUS, sched: false, rt: null };
  }
  // 崩下来的一块：掉下去时撒几块碎泥，摔在筏子上碎开（游戏里 reveal.onPlate 的同一套粒子）
  function onPlate(p, wp, landed) {
    if (!landed && p.burst) return;
    const fy = TOP + 0.02;
    if (!landed) {
      for (let i = 0; i < 4; i++) fx.emit('chunk', wp.x + (Math.random() - 0.5) * 0.15, wp.y, wp.z + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 1.2, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2, { floorY: fy, size: 0.12 + Math.random() * 0.12 });
      return;
    }
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.2;
      fx.emit(i < 4 ? 'chunk' : 'mudsplat', wp.x, fy + 0.06, wp.z, Math.cos(a) * sp, 0.6 + Math.random() * 0.9, Math.sin(a) * sp, { floorY: fy, size: i < 4 ? 0.1 + Math.random() * 0.1 : 0.05 + Math.random() * 0.05 });
    }
  }
  makeReveal();
  const rays = buildRays();
  rays.visible = true;
  scene.add(rays);

  // —— 5. 船 ——
  groups.boat = new THREE.Group();
  scene.add(groups.boat);
  const boat = buildBoat();
  boat.root.position.set(O.x + 2, 0, O.z + 14);
  groups.boat.add(boat.root);

  // —— 6. 深处的大轮廓：拉到水面上、缩小了看全身 ——
  groups.deep = new THREE.Group();
  scene.add(groups.deep);
  const levi = new LeviathanBody();
  groups.deep.add(levi.group);
  const LEVI_O = new THREE.Vector3(O.x, 1.6, O.z + 40);
  const LEVI_S = 0.4;
  function poseLevi(t) {
    // 原地游：一条从头到尾越来越大的横摆
    levi.pose((u, out) => out.set(LEVI_O.x + (6 - u * 26) * LEVI_S * 1.0, LEVI_O.y + Math.sin(t * 0.6 - u * 4.8) * 0.12, LEVI_O.z + Math.sin(t * 0.9 - u * 6.7) * (0.25 + u * 1.5) * LEVI_S), t, LEVI_S);
  }
  poseLevi(0);

  // —— 界面 ——
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;left:50%;top:36px;transform:translateX(-50%);display:flex;gap:0;pointer-events:auto';
  tabs.forEach((t, i) => {
    const e = document.createElement('div');
    e.className = 'panel';
    e.style.cssText = 'padding:8px 18px 10px 8px;font-size:22px;letter-spacing:1px;cursor:pointer;margin-right:-3px;white-space:nowrap';
    e.innerHTML = `${key(i + 1)}${t.t}`;
    e.addEventListener('pointerdown', () => setTab(i));
    t.el = e;
    bar.append(e);
  });
  ui.append(bar);
  for (const l of labels) {
    l.el = document.createElement('div');
    if (l.tab === 'items') {
      // 物件：游戏里揭晓时挂的同一种牛皮纸货签（珍贵的是金签）
      l.el.className = 'card small on' + (l.tag ? ' ' + l.tag : '');
      l.el.innerHTML = `<i class="eye"></i><span class="nm">${l.text}</span>`;
    } else {
      // 动作：一行字
      l.el.className = 'sh';
      l.el.style.cssText = 'position:absolute;left:0;top:0;font-size:22px;font-weight:700;color:#f3ead8;white-space:nowrap';
      l.el.textContent = l.text;
    }
    ui.append(l.el);
  }
  function setTab(i) {
    tab = i;
    tabs.forEach((t, k) => {
      t.el.style.background = k === i ? '#e8b04a' : '';
      t.el.style.color = k === i ? '#10181b' : '';
    });
    for (const k in groups) groups[k].visible = k === tabs[i].k || (k === 'boat' && tabs[i].k === 'boat');
    if (tabs[i].k === 'reveal') makeReveal();
  }
  setTab(0);
  window.addEventListener('keydown', (e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= tabs.length) setTab(n - 1);
  });
  let yawOff = 0, drag = false, lx = 0;
  stage.addEventListener('mousedown', (e) => { drag = true; lx = e.clientX; });
  window.addEventListener('mouseup', () => (drag = false));
  window.addEventListener('mousemove', (e) => { if (drag) { yawOff += (e.clientX - lx) * 0.005; lx = e.clientX; } });

  const VIEWS = {
    items: { look: [0, 0.6, -0.4], dist: 11.5, h: 8.5 },
    crew: { look: [0, 1.2, 0.6], dist: 13, h: 5 },
    crab: { look: [0, 0.6, 0], dist: 10, h: 5.5 },
    reveal: { look: [0, 0.6, 0], dist: 3.4, h: 5.4 },
    boat: { look: [2, 2, 14], dist: 22, h: 11 },
    deep: { look: [-1.5, 1.4, 40], dist: 12, h: 6.5 },
  };

  let last = performance.now(), T = 0, frames = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    T += dt;
    U.uTime.value += dt;
    const k = tabs[tab].k;
    // 物件：泥一层层退去，再盖回来
    if (k === 'items') {
      for (const o of itemModels) {
        const c = (T * 0.16 + o.ph * 0.08) % 1;
        const mud = c < 0.15 ? 1 : c < 0.55 ? 1 - smoothstep(0.15, 0.55, c) : c < 0.85 ? 0 : smoothstep(0.85, 1, c);
        setItemMud(o.m, mud, 0.04 * mud);
        setItemGlint(o.m, mud < 0.05 ? 0.6 : 0);
        o.m.group.rotation.y = T * 0.35 + o.ph;
      }
    }
    if (k === 'crew') {
      for (const s of sailors) {
        if (s.pose === 'walk' || s.pose === 'carryWalk') s.inPlace = 1.4; // 原地走：腿和胳膊照常摆
        if (s.pose === 'flinch' && s.flinch <= 0 && s.t > (s.nextFl || 0)) { s.startle(1, 1); s.nextFl = s.t + 2.2; }
        s.update(dt);
        s.root.position.y = TOP;
      }
    }
    if (k === 'deep') poseLevi(T);
    if (k === 'crab') {
      const [w, d, st, th] = crabs;
      w.c.legPh += dt * 12;
      w.c.animLegs(1, dt, false);
      w.c.group.position.x = -3.9 + Math.sin(T * 0.6) * 0.6;
      w.c.group.rotation.y = 0;
      d.c.dig = 1;
      for (const c of d.c.model.claws) c.g.rotation.z = -(0.35 + Math.max(0, Math.sin(T * 6 + (c.s > 0 ? 0 : Math.PI))) * 0.6);
      d.c.model.body.rotation.z = -0.18;
      if (Math.random() < dt * 4) {
        const p = d.c.group.getWorldPosition(new THREE.Vector3());
        fx.emit('sand', p.x + 0.4, p.y + 0.05, p.z, (Math.random() - 0.5) * 0.8, 1.2, (Math.random() - 0.5) * 0.8);
      }
      st.c.animateStruggle(dt, T);
      st.c.group.rotation.z = Math.sin(T * 7) * 0.15;
      // 隔一会儿吓它一下
      if ((th.c.threat || 0) <= 0 && T > (th.nextT || 0)) { th.c.threat = 1; th.nextT = T + 2.2; }
      th.c.model.body.rotation.z = 0;
      th.c.model.body.position.y = 0;
      for (const c of th.c.model.claws) c.g.rotation.z = Math.sin(T * 1.3 + c.s) * 0.08;
      th.c.animThreat(dt, T);
    }
    if (k === 'reveal' && rv) {
      rv.t += dt;
      const t = rv.t;
      const b = rv.b;
      // 冲洗开始：按这一刻的镜头排拍子；拍子少就冲得短（两拍之间不超过 0.7 秒），和游戏里一样
      if (!rv.sched && t >= 0.6) {
        rv.sched = true;
        b.schedule(cam.position.clone(), 0.04, 0.86);
        const nb = b.beats ? b.beats.length : 6;
        if (nb > 1) rv.T = Math.min(WASH_PRECIOUS, Math.max(3.4, (0.7 * (nb - 1)) / 0.82));
      }
      if (rv.sched && rv.rt == null) {
        rv.w = Math.min(1, rv.w + dt / rv.T);
        const w = rv.w;
        b.washPlates(w, dt, onPlate);
        b.setDebris(smoothstep(0.04, 0.5, w));
        // 东西身上一直糊着泥（看得出轮廓、看不清是什么）；正对水管（镜头这边上方）的一面淡一点，匣子顶角先露
        const infl = 0.045 * (1 - smoothstep(0.0, 0.12, w));
        for (const it of [rv.it, rv.it2]) {
          setItemMud(it.model, 1, infl);
          const gp = it.model.group.getWorldPosition(new THREE.Vector3());
          const toHose = cam.position.clone().sub(gp).normalize();
          toHose.y += it.def.precious ? 1.4 : 0.5;
          toHose.normalize().applyQuaternion(it.model.group.getWorldQuaternion(new THREE.Quaternion()).invert());
          for (const m of it.model.mats) {
            if (!m.uniforms.uWashDir) continue;
            m.uniforms.uWashDir.value.copy(toHose);
            m.uniforms.uWashBias.value = it.def.precious && w < 0.4 ? 0.45 * smoothstep(0.1, 0.36, w) : 0.3 * smoothstep(0.3, 0.8, w);
          }
        }
        // 露头：匣子顶上那一角先露出来，一线银光
        if (!rv.peeked && ((b.peekAt != null && w >= b.peekAt + 0.02) || (b.peekAt == null && w > 0.4))) { rv.peeked = true; setItemGlint(rv.it.model, 0.9); }
        // 看得清是什么了（排好的最后一块崩开了）：揭晓，剩下的壳一下崩飞
        const lp = b.lastPlate;
        if ((lp && lp.state !== 'on' && lp.t >= 0.08) || w >= 1) {
          rv.rt = t;
          b.burst();
          b.setDebris(1);
          for (const it of [rv.it, rv.it2]) for (const m of it.model.mats) if (m.uniforms.uWashBias) m.uniforms.uWashBias.value = 0;
          const p = b.group.getWorldPosition(new THREE.Vector3());
          for (let i = 0; i < 26; i++) {
            const a = Math.random() * Math.PI * 2, sp = 1.4 + Math.random() * 2.2;
            fx.emit(i < 16 ? 'chunk' : 'mudsplat', p.x + Math.cos(a) * 0.3, p.y + 0.25 + Math.random() * 0.3, p.z + Math.sin(a) * 0.3, Math.cos(a) * sp, 0.5 + Math.random() * 1.0, Math.sin(a) * sp, { floorY: TOP + 0.02, size: i < 16 ? 0.08 + Math.random() * 0.12 : 0.05 + Math.random() * 0.05 });
          }
        }
      } else if (rv.rt != null) {
        // 崩飞的壳接着飞、碎；东西身上的泥 0.14 秒甩掉
        b.washPlates(1, dt, onPlate);
        const mk = clamp((t - rv.rt) / 0.14, 0, 1);
        setItemMud(rv.it.model, 1 - easeOut(mk), 0);
        setItemMud(rv.it2.model, 1 - easeOut(mk), 0);
      }
      b.update(dt, T);
      const ct = rv.rt != null ? t - rv.rt : -1;
      const pc = pipe.compositeUniforms;
      if (ct > 0) {
        if (rv.it.model.lid) rv.it.model.lid.rotation.x = -easeOutBack(clamp((ct - 0.15) / 0.75, 0, 1)) * 1.95;
        setItemGlint(rv.it.model, 1);
        if (!rv.burst) {
          rv.burst = true;
          const p = rv.it.model.group.getWorldPosition(new THREE.Vector3());
          fx.burst('spark', p.x, p.y + 0.4, p.z, 46, 3.2, 0.3, { up: 1.4 });
          rays.position.copy(p).add(new THREE.Vector3(0, 0.35, 0));
        }
        poseRays(rays, ct, T, cam);
        pc.uFlash.value = ct < 0.35 ? 0.55 * (1 - ct / 0.35) : 0;
        pc.uDim.value = 0.32 * smoothstep(0.1, 0.5, ct) * (1 - smoothstep(2.4, 3.6, ct));
        for (const m of rv.it.model.mats) m.uniforms.uEmissive.value.setRGB(0.32, 0.24, 0.1).multiplyScalar(Math.max(0, 1 - ct / 2.8));
        if (Math.random() < 0.5) {
          const p = rv.it.model.group.getWorldPosition(new THREE.Vector3());
          fx.emit('spark', p.x + (Math.random() - 0.5) * 0.5, p.y + 0.4, p.z + (Math.random() - 0.5) * 0.4, 0, 0.6 + Math.random() * 0.6, 0);
        }
      } else {
        rays.material.opacity = 0;
        pc.uFlash.value = 0;
        pc.uDim.value = 0;
      }
      if (ct > 5) makeReveal();
    } else {
      rays.material.opacity = 0;
    }
    // 镜头
    const V = VIEWS[k];
    const look = new THREE.Vector3(...V.look).add(O);
    const a = Math.PI * 0.5 + yawOff + Math.sin(T * 0.15) * 0.18;
    cam.position.set(look.x + Math.cos(a) * 0.35 * V.dist, look.y + V.h, look.z + Math.sin(a) * V.dist);
    cam.lookAt(look);
    cam.updateMatrixWorld(true);
    world.sky.position.copy(cam.position);
    followWater(world.water, cam.position.x, cam.position.z);
    fx.update(dt);
    fx.setScale(projScaleFor(cam.fov));
    pipe.setCamera(cam, cam.position.distanceTo(look));
    pipe.updateShadow(look, cam.position.distanceTo(look));
    pipe.renderShadow(scene);
    pipe.render(scene);
    // 名牌：从近处往远处摆，远处的签碰到近处的就往上让，字不压字
    const shown = [];
    for (const l of labels) {
      const on = l.tab === k;
      l.el.style.display = on ? '' : 'none';
      if (!on) continue;
      const p = l.obj.getWorldPosition(new THREE.Vector3());
      p.y += l.h;
      p.project(cam);
      if (!l.w) { l.w = l.el.offsetWidth; l.hh = l.el.offsetHeight; }
      shown.push({ l, x: ((p.x + 1) / 2) * VIEW_W, y: ((1 - p.y) / 2) * VIEW_H, z: p.z });
    }
    shown.sort((a, b) => a.z - b.z);
    const placed = [];
    for (const o of shown) {
      const { l } = o;
      let x0 = o.x - l.w / 2, y1 = o.y;
      for (let moved = true, n = 0; moved && n < 8; n++) {
        moved = false;
        for (const q of placed) {
          if (x0 + l.w + 6 <= q.x0 || x0 >= q.x0 + q.w + 6 || y1 + 4 <= q.y1 - q.h || y1 - l.hh >= q.y1 + 4) continue;
          y1 = q.y1 - q.h - 4;
          moved = true;
        }
      }
      placed.push({ x0, y1, w: l.w, h: l.hh });
      // 用 translate 属性摆（和游戏里的名牌一样）：挂上去那一摆绕签孔转，不绕画面左上角
      l.el.style.translate = `${Math.round(x0)}px ${Math.round(y1 - l.hh)}px`;
    }
    frames++;
    if (frames === 3) window.__ready = true;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__setTab = setTab;
}
