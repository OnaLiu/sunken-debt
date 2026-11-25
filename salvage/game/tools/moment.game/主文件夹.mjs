// 沉债的这一份（主文件夹这条线）：怎么直接到第一段·归潮沙湾小样的每一刻。
// 页面带 manual=1 时画面不自己走，由 __advance 一帧一帧推（固定 1/60 秒），不画的帧 game.noDraw 跳过画面（状态照样算，跳不跳截出来的一样）。
export default {
  owns: ['这一刻', '演示', '一整趟', '码满', '码满·没去舱里', '触屏'],
  reaches: [
    '这一刻：一打开就停在沉船旁边（小样），自己玩（没有机器人）。',
    '自己玩的手（每一段都有，发的是真的鼠标键盘事件，走玩家那条路）：__hand.move(x,y) 指针挪到画面上一点（1920×1080）、__hand.at(\'jar\') 指到含这件东西的那一处打捞点、',
    '  __hand.click()、__hand.down(键号)/up(键号)（0 左 2 右）、__hand.wheel(±1)、__hand.key(\'KeyW\',true|false)、__hand.tap(\'KeyE\')；__hand.spots() 列出打捞点和它们在画面上的位置；__adv(秒) 快进。',
    '演示：同一刻，自动演示（机器人照玩家的样子挑一处、下网、码满、开冲，结算后按左键再来一次）。',
    '码满：甲板直接码好五包（外侧陶罐那一组、铜锅、箍桶、铜印、舱里银币匣那一组；油照五网扣），自动演示接着按开冲——开冲、齐冲、压轴（银币匣）、结算都从这儿直接到。',
    '码满·没去舱里：同上，第五包换成蟹翻泥那一处（压轴是铜印），看不去舱里的结果。',
    '触屏：当成手机、平板打开（只有手指，没有鼠标）：应当一打开就放演示，kit/hengping.js 接管点按。',
    '一整趟：原来那一整趟（标题、出港、收获单），trip=1&autostart=demo。',
    '几刻用 --until 到：码满 `__game.deck.full`；开冲 `__game.mode===\'batch\'`；压轴 `__game.batch.phase===\'finale\'`；',
    '  压轴揭晓 `__game.reveal.cur&&__game.reveal.cur.phase===\'show\'`；结算 `__game.mode===\'result\'`；再来一次 `__game.moment.runs.length>=1&&__game.mode===\'arm\'`。',
    '开船（从「这一刻」）：`--pre "__hand.key(\'KeyW\',true);__adv(3)"` 开着走，`__hand.key(\'KeyD\',true)` 转向（停着、倒船也按哪边转哪边）；松 W 按 KeyS 是刹车、倒船；看 `__game.boatCtl.speed`、`.turnRate`、`__game.cam.dist`；跟船的镜头在 `__game.chase`（打捞一屏从头到尾都在跟）。',
    '船挡住就挖开一个口子（从「这一刻」）：用鼠标时不按左 Shift 只有网下到水里被挡住才有；`--pre "__adv(1);__hand.move(960,690);__adv(1)"` 没有，再 `__hand.key(\'ShiftLeft\',true);__adv(1)` 就有，`__game.cutout.out` 列出这一刻开着的口子。网被挡住：`--pre "__adv(1);__hand.at(\'jar\');__adv(.5);__hand.click();__adv(.3);__game.chase.offYawT=Math.PI/2;__game.chase.offPitchT=-0.2;__adv(1)"`（镜头偏到右舷那一侧）。',
    '开船的油：--probe @开船的油（十五种按法各跑一遍：按着多久、扣了多少、走了多远；没按键的每一帧都不该扣；油用完、开着下网；约两分钟）；左 Shift 指着的那一处走到正中、到了停、挪鼠标：--probe @看海底·正中。',
    '按住左 Shift 看海底（从「这一刻」，停着、开着、网在水里都行）：`--pre "__adv(1);__hand.at(\'jar\');__hand.key(\'ShiftLeft\',true);__adv(1.5)"`，`__game.peek.k` 到 1，松开（`false`）回 0；换处用 `__hand.move`。',
    '演示放完一遍：`--until window.__demoEnd`（约 90 秒）。',
    '素材对照（换素材前后比）：--probe @素材对照·捞获 / @素材对照·场地，用法见文件里这两条探针上面的注释；截图对的是 素材/基准/ 里同名的图。@素材对照·近看：舱里的杂货、礁石、沉船散件（断桅横桁、舱盖、埋着的船材、尾楼）推近（基准里没有，比上一版同机位）。',
  ].join('\n'),
  page: 'index.html',
  query: (seg = '') => (seg = seg || '', seg === '触屏' ? 'manual=1&touch=1' : seg.startsWith('演示') || seg.startsWith('码满') ? 'manual=1&demo=1' : seg === '一整趟' ? 'manual=1&trip=1&autostart=demo' : 'manual=1'),
  // 触屏：在页面自己的脚本之前把「指针」改成只有手指（kit/hengping.js 照这个判断）
  pre: `if (location.search.includes('touch=1')) { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => (/pointer: coarse/.test(q) ? { matches: true, media: q, addEventListener() {}, addListener() {} } : /pointer: fine/.test(q) ? { matches: false, media: q, addEventListener() {}, addListener() {} } : mm(q)); }
window.__adv = (t) => { const g = window.__game; g.noDraw = true; window.__advance(Math.max(1, Math.round(t * 60)) - 1); g.noDraw = false; window.__advance(1); };
window.__hand = (() => {
  const st = () => document.getElementById('stage');
  const P = { x: 960, y: 540 };
  const ev = (type, o = {}) => { const r = st().getBoundingClientRect(), k = r.width / 1920; (type.startsWith('mouse') && type !== 'mousedown' ? window : st()).dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: r.left + P.x * k, clientY: r.top + P.y * k, ...o })); };
  const H = {
    move(x, y) { P.x = x; P.y = y; ev('mousemove'); return H; },
    spots() { const g = window.__game; return g.snap.spots.map((s) => { const p = g.project(new g.cam.pivot.constructor(s.x, s.y, s.z)); return { key: s.key, far: !!s.far, n: s.n, x: Math.round(p.x), y: Math.round(p.y) }; }); },
    at(id) { const s = H.spots().find((q) => q.key.split('+').includes(id)); if (s) H.move(s.x, s.y); return s || null; },
    down(b = 0) { ev('mousedown', { button: b }); return H; },
    up(b = 0) { ev('mouseup', { button: b }); return H; },
    click(b = 0) { H.down(b); H.up(b); return H; },
    wheel(d) { const r = st().getBoundingClientRect(); st().dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: d * 100, clientX: r.left + 10, clientY: r.top + 10 })); return H; },
    key(code, on) { window.dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code, bubbles: true })); return H; },
    tap(code) { H.key(code, true); H.key(code, false); return H; },
  };
  return H;
})();`,
  ready: 'window.__pageReady === true && !!window.__game',
  start: (seg = '') => (seg = seg || '', seg.startsWith('码满·没去舱里') ? `__game.moment.prefill([['jar','jar2','rope'],['copperset'],['barrel'],['seal'],[]])`
    : seg.startsWith('码满') ? `__game.moment.prefill([['jar','jar2','rope'],['copperset'],['barrel'],['seal'],['chest','sack']])` : 'true'),
  clock: {
    advance: (frames, draw) => `(() => { const g = window.__game; const n = ${frames}; g.noDraw = true; if (n > 1) window.__advance(n - 1); g.noDraw = !${draw}; window.__advance(1); g.noDraw = false; return true; })()`,
    now: 'window.__game.clock',
    real: 'window.__manual = false',
  },
  probes: {
    状态: `return (() => { const g = window.__game; return { mode: g.mode, fuel: +g.trip.fuel.toFixed(1), deck: g.deck.filled + '/' + g.deck.slots.length, spots: g.snap.spots.length, cur: g.snap.cur && g.snap.cur.key, far: g.snap.cur && g.snap.cur.far, batch: g.batch.phase, total: g.batch.total, bot: g.bot && g.bot.stage, haul: g.trip.haul.map((h) => h.name), demoEnd: !!window.__demoEnd }; })()`,
    // 素材对照：把这一刻海底的几件捞获洗干净摆在水面上一件件推近（每一刻拍上一件：第 2 刻起依次是陶罐、缆绳卷、铜锅、箍桶、货袋、银币匣、铜印、信筒、铜灯），
    // 给做素材、换素材的轮次对照现在的样子：node tools/moment.mjs 这一刻 0.5,1,1.5,2,2.5,3,3.5,4,4.5,5 --probe @素材对照·捞获
    '素材对照·捞获': `return (() => {
  const g = __game;
  const kinds = 'jar,rope,copperset,barrel,sack,chest,seal,tube2,lantern'.split(',');
  if (!window.__studio) {
    document.getElementById('ui').style.display = 'none';
    const scene = g.world.scene;
    const G = g.boat.root.constructor;
    const holder = new G();
    scene.add(holder);
    const base = g.boat.root.position.clone();
    // 船右舷外 12 米、水面上 1.2 米，一字排开，每件隔 3 米
    holder.position.set(base.x + 14, 1.2, base.z - 6);
    const placed = [];
    kinds.forEach((k, i) => {
      const it = g.items.items.find((x) => x.kind === k);
      if (!it) return;
      const c = it.model.group.clone(true);
      c.position.set(i * 3, 0, 0);
      c.rotation.set(0, 0.5, 0);
      c.scale.set(1, 1, 1);
      if (it.model.lid) { const lid = c.children[c.children.length - 1]; lid.rotation.x = -1.9; }
      holder.add(c);
      for (const m of it.model.mats) { m.uniforms.uMud.value = 0; if (m.uniforms.uMudInflate) m.uniforms.uMudInflate.value = 0; }
      // 地台：一块 1.4 米见方的木板，给东西一个落脚
      placed.push({ k, c, h: it.model.info.h || 0.4, r: it.r || 0.4 });
    });
    const Mesh = g.world.terrain.constructor;
    const box = g.world.scene.getObjectByName('abyss');
    window.__studio = { holder, placed, n: 0 };
    const orig = g.cam.update.bind(g.cam);
    g.cam.update = (dt) => {
      const S = window.__studio, p = S.placed[Math.max(0, Math.min(S.n - 1, S.placed.length - 1))];
      const w = p.c.getWorldPosition(new p.c.position.constructor());
      const d = 1.3 + p.r * 3.2;
      g.cam.alt.pos.set(w.x + d * 0.75, w.y + p.h * 0.5 + d * 0.95, w.z + d * 0.75);
      g.cam.alt.look.set(w.x, w.y + p.h * 0.4, w.z);
      g.cam.alt.fov = 30;
      g.cam.alt.w = 1; g.cam.altFrom = 1; g.cam.altTo = 1;
      return orig(dt);
    };
  }
  const S = window.__studio;
  const r = S.placed[Math.min(S.n, S.placed.length - 1)].k;
  S.n++;
  return r;
})()`,
    // 素材对照：沉船和场地几个固定机位（第 2 刻起：沉船俯视、东侧、西侧、南侧，场地俯视全部、只有地）。node tools/moment.mjs 这一刻 0.5,1,1.5,2,2.5,3,3.5 --probe @素材对照·场地
    '素材对照·场地': `return (() => {
  const g = __game;
  const V = (x, y, z) => new g.boat.root.position.constructor(x, y, z);
  const views = [
    { n: '沉船-俯视', pos: [2.5, 42, 8.6], look: [2, -10, 8], fov: 45, hide: ['boat', 'water'] },
    { n: '沉船-东边甲板那侧', pos: [24, 9, 2], look: [3, -9, 9], fov: 45, hide: ['boat'] },
    { n: '沉船-西边破口那侧', pos: [-19, 9, 0], look: [2, -9, 9], fov: 45, hide: ['boat'] },
    { n: '沉船-南边船尾和坡下', pos: [14, 11, 44], look: [6, -12, 18], fov: 45, hide: ['boat'] },
    { n: '场地-俯视-全部', pos: [10, 64, 16.6], look: [10, -12, 16], fov: 45, hide: ['boat', 'water'] },
    { n: '场地-俯视-只有地', pos: [10, 64, 16.6], look: [10, -12, 16], fov: 45, hide: ['boat', 'water', 'wreck', 'extras', 'decor', 'items'] },
  ];
  if (!window.__views) {
    document.getElementById('ui').style.display = 'none';
    window.__views = { n: 0 };
    const objs = { boat: g.boat.root, water: g.world.water, wreck: g.world.wreck.group, extras: g.world.extras.group, decor: g.world.decor.group, items: g.items.group };
    const orig = g.cam.update.bind(g.cam);
    g.cam.update = (dt) => {
      const v = views[Math.max(0, Math.min(window.__views.n - 1, views.length - 1))];
      for (const [k, o] of Object.entries(objs)) if (o) o.visible = !v.hide.includes(k);
      for (const s of g.crew.sailors || []) if (s.root) s.root.visible = !v.hide.includes('boat');
      g.cam.alt.pos.copy(V(...v.pos));
      g.cam.alt.look.copy(V(...v.look));
      g.cam.alt.fov = v.fov;
      g.cam.alt.w = 1; g.cam.altFrom = 1; g.cam.altTo = 1;
      return orig(dt);
    };
  }
  // 截图是这一刻已经画好的那一帧：这一次换的机位下一张才看得到。返回这一张截图里是哪个机位（第一张还是游戏画面）
  const shown = window.__views.n === 0 ? '游戏画面' : views[Math.min(window.__views.n - 1, views.length - 1)].n;
  window.__views.n++;
  return shown;
})()`,
    // 素材对照·近看：换素材前后近处比（舱里的杂货、礁石，第 2 块起加了沉船散件）。node tools/moment.mjs 这一刻 0.5,1,1.5,2,2.5,3,3.5,4,4.5 --probe @素材对照·近看
    // 舱里从塌掉的甲板上方、从左舷破口外看进去；礁石挑离沉船东南最近的一块推到 7 米。截图比这一刻在上一版的同一张（git stash 或旧 build）
    '素材对照·近看': `return (() => {
  const g = __game;
  const P = g.boat.root.position.constructor;
  const ship = g.world.wreck.ship;
  const L = (x, y, z) => ship.localToWorld(new P(x, y, z));
  // 礁石：实例里离 (16, 18) 最近、缩放超过 0.6 的一块（世界位置照实例矩阵取，y 就是它在海底的高度）
  let rock = null;
  g.world.decor.group.traverse((o) => { if (!o.isInstancedMesh || !o.material.uniforms || !o.material.uniforms.uMoss) return; const M = new o.matrixWorld.constructor(), T = new P(), S = new P(), Q = new g.cam.cam.quaternion.constructor(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); M.decompose(T, Q, S); const d = Math.hypot(T.x - 16, T.z - 18); if (S.x > 0.6 && (!rock || d < rock.d)) rock = { x: T.x, y: T.y, z: T.z, s: S.x, d }; } });
  const X = g.world.extras;
  const mid = X.mastBase.clone().addScaledVector(X.mastDir, 6.25);
  let hatch = new P(0, -12, 0);
  for (const c of X.group.children) if (c.isGroup) hatch = c.position.clone();
  const timber = g.timberMesh ? g.timberMesh.position.clone() : new P(13.2, -16, 22.2);
  const views = [
    { n: '舱里-塌口上方', pos: L(2.6, 12, 3), look: L(2.6, 0.5, 0), fov: 40, hide: ['boat', 'water'] },
    { n: '舱里-左舷破口外', pos: L(2.4, 3.2, -8.5), look: L(2.4, 1.2, 0), fov: 45, hide: ['boat', 'water'] },
    { n: '舱里-船头那段', pos: L(5.0, 10, 3.5), look: L(5.0, 0.6, 0), fov: 38, hide: ['boat', 'water'] },
    { n: '礁石-近', pos: rock ? new P(rock.x + 3.5 * rock.s, rock.y + 4 * rock.s, rock.z + 4.5 * rock.s) : new P(20, -6, 23), look: rock ? new P(rock.x, rock.y + 0.4 * rock.s, rock.z) : new P(16, -12, 18), fov: 40, hide: ['boat', 'water'] },
    // 沉船的散件（第 2 块接素材加的，第 6 刻起）：断桅和横桁、蟹窝的舱盖、坡下埋着的船材（刚露一角）、尾楼
    { n: '断桅横桁-近', pos: mid.clone().add(new P(-3, 7, 6)), look: mid, fov: 50, hide: ['boat', 'water'] },
    { n: '舱盖-近', pos: hatch.clone().add(new P(2.5, 3.2, 2.5)), look: hatch, fov: 40, hide: ['boat', 'water'] },
    { n: '船材-近', pos: timber.clone().add(new P(2.2, 2.6, 2.2)), look: timber, fov: 40, hide: ['boat', 'water'] },
    { n: '尾楼-近', pos: L(-7.6, 9, -7), look: L(-7.6, 5, 0), fov: 42, hide: ['boat', 'water'] },
  ];
  if (!window.__nviews) {
    document.getElementById('ui').style.display = 'none';
    window.__nviews = { n: 0 };
    const objs = { boat: g.boat.root, water: g.world.water };
    const orig = g.cam.update.bind(g.cam);
    g.cam.update = (dt) => {
      const v = views[Math.max(0, Math.min(window.__nviews.n - 1, views.length - 1))];
      for (const [k, o] of Object.entries(objs)) if (o) o.visible = !v.hide.includes(k);
      for (const s of g.crew.sailors || []) if (s.root) s.root.visible = !v.hide.includes('boat');
      g.cam.alt.pos.copy(v.pos);
      g.cam.alt.look.copy(v.look);
      g.cam.alt.fov = v.fov;
      g.cam.alt.w = 1; g.cam.altFrom = 1; g.cam.altTo = 1;
      return orig(dt);
    };
  }
  const v = views[Math.min(window.__nviews.n, views.length - 1)];
  window.__nviews.n++;
  return v.n + (v.n.startsWith('礁石') && rock ? ' ' + rock.x.toFixed(1) + ',' + rock.z.toFixed(1) : '');
})()`,
    // 素材·地块：一块海底现在的底色、深浅、沉船占地、断桅、礁石、捞获在哪（世界坐标，米），给 tools/素材摆位图.py 画「底色」「摆位图」。
    // 范围默认 x −14…34、z −8…40（沉船场地），别的地块：--pre "window.__region=[x0,x1,z0,z1]"。
    '素材·地块': `return (() => {
  const g = __game, W = g.world;
  const geo = W.terrain.geometry, P = geo.attributes.position, C = geo.attributes.color;
  const R = window.__region || [-14, 34, -8, 40]; const inR = (x, z) => x >= R[0] && x <= R[1] && z >= R[2] && z <= R[3];
  const out = { region: R, grid: [], wreck: [], mast: [], items: [], rocks: [] };
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i);
    if (inR(x, z)) out.grid.push([x, z, +P.getY(i).toFixed(2), +C.getX(i).toFixed(3), +C.getY(i).toFixed(3), +C.getZ(i).toFixed(3)]);
  }
  const V = new g.boat.root.position.constructor();
  const grab = (obj, arr, step) => obj.traverse((o) => { if (o.isMesh && o.geometry) { o.updateMatrixWorld(true); const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += step) { V.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); arr.push([+V.x.toFixed(2), +V.z.toFixed(2), +V.y.toFixed(2)]); } } });
  grab(W.wreck.group, out.wreck, 23);
  if (W.extras.mastMesh) grab(W.extras.mastMesh, out.mast, 5);
  for (const it of g.items.items) { const w = it.model.group.getWorldPosition(V.clone()); out.items.push([it.kind, +w.x.toFixed(2), +w.z.toFixed(2), +w.y.toFixed(2)]); }
  W.decor.group.traverse((o) => { if (o.isInstancedMesh) { const M = new o.matrixWorld.constructor(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); V.setFromMatrixPosition(M); if (inR(V.x, V.z)) out.rocks.push([o.name || o.geometry.type, +V.x.toFixed(2), +V.z.toFixed(2)]); } } });
  return out;
})()`,
    '开船的油': `return (() => { const g = __game, out = {}, R = g.moment.constructor && 0.62;
const K = (c, on) => __hand.key(c, on), all = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
// 真的按键；扣了多少、按着（没互相抵掉）多久、走了多远、转了多少度、松手以后还滑了多远；rule 是按着的秒数 × 一秒的数
const run = (name, steps, o = {}) => { for (const c of all) K(c,false); g.moment.begin(); __adv(1); g.trip.fuel = 100; const bc = g.boatCtl; let dist=0, ang=0, f0=100, held=0, glide=0, h0=bc.heading;
  g.noDraw = true;
  const go = (T, on) => { for (let i=0;i<Math.round(T*60);i++){ const b=g.trip.fuel; window.__advance(1); dist+=Math.abs(bc.speed)/60; ang+=Math.abs(bc.turnRate)/60; if(on) held+=1/60; else { glide+=Math.abs(bc.speed)/60; if (g.trip.fuel!==b) out[name+'·没按也扣了']=true; } } };
  for (const [keys, T] of steps) { const pads = o.arrow ? {W:'ArrowUp',A:'ArrowLeft',S:'ArrowDown',D:'ArrowRight'} : null; for (const c of 'WASD') K(pads ? pads[c] : 'Key'+c, keys.includes(c)); const m = (keys.includes('W')!==keys.includes('S')) || (keys.includes('A')!==keys.includes('D')); go(T, m); }
  for (const c of all) K(c,false); let w=0; while((Math.abs(bc.speed)>0||Math.abs(bc.turnRate)>0)&&w<1800){ go(1/60,false); w++; }
  g.noDraw=false; const used=f0-g.trip.fuel; out[name]={held:+held.toFixed(2), used:+used.toFixed(3), rule:+(0.62*held).toFixed(3), dist:+dist.toFixed(1), glide:+glide.toFixed(1), deg:+(ang*57.2958).toFixed(0)}; };
const rep=(a,b,n)=>Array.from({length:n},()=>[a,b]).flat();
run('停着不动',[['',3]]); run('AD一起',[['AD',2]]); run('WS一起',[['WS',2]]); run('只前进4秒',[['W',4]]); run('只转4秒',[['D',4]]); run('边走边转4秒',[['WD',4]]); run('边走边转左4秒',[['WA',4]]);
run('方向键边走边转4秒',[['WD',4]],{arrow:true}); run('倒船4秒',[['S',4]]); run('倒着转4秒',[['SD',4]]); run('走着转3秒松W转2秒',[['W',3],['D',2]]); run('前进3秒踩S停',[['W',3],['S',3]]);
run('按W3秒滑着',[['W',3]]); run('点按W 8下',rep(['W',0.3],['',0.7],8)); run('点按D 10下',rep(['D',0.1],['',0.3],10));
// 油用完：按 D、按 W 都不动；剩一点油先按完
for (const c of all) K(c,false); g.moment.begin(); __adv(1); g.trip.fuel=0.3; let h0=g.boatCtl.heading; K('KeyD',true); __adv(2); out.油用完=+((g.boatCtl.heading-h0)*57.3).toFixed(1)+' 度，剩 '+g.trip.fuel; K('KeyD',false); __adv(3); h0=g.boatCtl.heading; const p0=g.boatCtl.pos.x; K('KeyD',true); __adv(1); out.油空了按D=+((g.boatCtl.heading-h0)*57.3).toFixed(2)+' 度'; K('KeyD',false); K('KeyW',true); __adv(1); out.油空了按W=+(g.boatCtl.speed).toFixed(3)+' 米/秒'; K('KeyW',false);
// 按了下网、船还在刹：开着按下网，刹停那几米不扣（扣的只有这一网自己）
g.moment.begin(); __adv(1); K('KeyW',true); __adv(2); const v0=g.boatCtl.speed; __hand.at('jar'); __adv(0.4); K('KeyW',false); const f1=g.trip.fuel; __hand.click(); __adv(2); out.开着下网={speed0:+v0.toFixed(1), speed1:+g.boatCtl.speed.toFixed(2), 刹停那几秒扣:+(f1-g.trip.fuel).toFixed(2), mode:g.mode}; return out; })()`,
    '看海底·正中': `// 按住左 Shift：指着的那一处到没到正中、到了停没停、挪鼠标指针跟着走、松开指着的还是不是同一处。用真的鼠标键盘事件（不锁鼠标的那一条路）
return (() => { const g=__game, S=g.peek, out={}; const sc=()=>({x:Math.round(g.input.state.ptr.sx),y:Math.round(g.input.state.ptr.sy)});
 const pt=()=>{ const p=new (g.boat.root.position.constructor)().copy(S.p); return p; };
 for (const [n,x,y] of [['左',420,430],['右上',1500,260],['右下',1450,900],['中',960,560]]) { __hand.key('ShiftLeft',false); __adv(2); __hand.move(x,y); __adv(0.6);
  __hand.key('ShiftLeft',true); const tr=[]; let last=null, pk=0, tt=null, over=0, jump=0; g.noDraw=true;
  for (let i=0;i<240;i++){ window.__advance(1); const p=g.project(pt()); const e=Math.hypot(p.x-960,p.y-540); if(last){ const v=Math.hypot(p.x-last.x,p.y-last.y); pk=Math.max(pk,v*60); } last={x:p.x,y:p.y}; if (tt===null && e<8 && S.w>0.99) tt=+((i+1)/60).toFixed(2); if (e>over && i>60) over=e; }
  g.noDraw=false; const a=sc(); const b0={x:S.b.x,y:S.b.y}, f0=S.base.position.clone(); window.__advance(1); const ptr0=g.input.state.ptr;
  out[n]={到正中秒:tt, 指针:a, 视野:+(Math.tan(S.base.fov*Math.PI/360)/Math.tan(g.cam.cam.fov*Math.PI/360)).toFixed(2), 那一点最快像素每秒:Math.round(pk), w:+S.w.toFixed(3)}; }
 // 到了正中就停：鼠标不动四秒，镜头一动不动
 const c=g.cam.cam; const q0=c.quaternion.clone(), p0=c.position.clone(); __adv(4); out.停住={转了度:+(q0.angleTo(c.quaternion)*57.3).toFixed(4), 走了米:+p0.distanceTo(c.position).toFixed(4)};
 // 鼠标挪 200：指针当场挪 200，然后回到正中
 __hand.move(960,540); __adv(1.2); const a0=sc(); __hand.move(1160,540); window.__advance(1); const a1=sc(); __adv(2); out.挪200={起:a0, 当下:a1, 两秒后:sc()};
 __hand.move(660,420); __adv(2.5); const b1={...S.b}; out.再挪={指针:sc(), 指着没拉近的画面:{x:Math.round(b1.x),y:Math.round(b1.y)}};
 __hand.key('ShiftLeft',false); __adv(2); out.松开={指针:sc(), 差:{x:Math.round(S.off.x),y:Math.round(S.off.y)}, k:+S.k.toFixed(3)};
 return out; })()`,
    打捞点: `window.__game.snap.spots.map((s) => ({ key: s.key, far: s.far, hold: s.hold, n: s.n, x: +s.x.toFixed(1), z: +s.z.toFixed(1) }))`,
  },
};
