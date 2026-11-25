// 揭宝：网包上甲板 → 船员冲洗厚泥 → 确认高光 → 展开 → 拉回大视野。
// 网包落下有分量：越重压得越扁、闷响越沉。沙湾的厚泥被水柱一片片冲散。
// 三段剥离：前段去外壳；中段每件东西还裹着实心泥团，只剩体量——水柱第一次打到实物时声音变了调，材质先从声音露出来；
// 最后几成时间才露出关键特征与完整实物。珍贵物揭晓时各有自己的那一下（宝石逐颗闪、银币哗啦洒出、船钟敲响一下）。
// 时长：普通清洗 4.2 s / 珍贵 5.4 s；展示停留 2.25 s / 3.2 s；拉回 1.25 s。A 加快清洗。
import * as THREE from 'three';
import { Builder, rod, col, M, sph } from '../core/geo.js';
import { patchMaterial, worldMat } from '../render/materials.js';
import { buildItemGeometry } from '../world/items.js';
import { BOAT } from './boat.js';
import { RNG } from '../core/rng.js';
import { Hold } from './hold.js';
import { fxTag } from '../fx/tags.js';
import { WashFx, washWarmMeshes } from './washfx.js';

export const TIMING = { washN: 4.2, washP: 5.4, showN: 2.25, showP: 3.2, pull: 1.25, land: 0.45 };

// 泥壳的颜色（外层、深处、裹着每件东西的泥团）、厚薄起伏；chip：碎屑颜色
const SHELL = { a: 0x6a5a40, b: 0x4a3e2c, core: 0x5a4a34, thick: 1.0, chip: [0.36, 0.3, 0.22] };
const MASS_W = { heavy: 1.0, mid: 0.55, light: 0.25 };

// 珍品确认（C6，标志时刻 S1 的中段，全清单最重的一处）：
//   憋住（冲洗最后约 1.5 秒）：主件还裹着一层泥壳，泥缝里透出暖光；一道声音往上走，镜头慢慢推近、四角压暗；
//         最后 0.4 秒把海声、水枪声、配乐整条抽空（抽声），只剩一滴水落在格栅上。
//   爆发（确认 0–0.3 秒）：只让它自己的签名声先出（银币倾泻、宝石叮当），主和弦晚 0.15 秒跟进、名字同时砸上来；
//         最后一层泥壳一下崩开；整个世界褪成灰，只有它留着颜色和金光（褪色只留它）；镜头往下顿一下（全清单唯一的大震）；不闪白。
//   余波（0.3–1.5 秒）：颜色从它那里一圈圈回到世界，前沿带一道金；甲板上一道金圈跟着推出去，金星往上飘；海声慢慢回来。
const BURST = { chordAt: 0.15, nameAt: 0.15, waveAt: 0.3, waveDur: 1.2, kickPx: 16 };

// 珍贵物与几件名物揭晓时各自的那一下：声音 + 光的样子
const SIGNATURE = {
  reliquary: { sound: 'gems', fx: 'gems' },     // 红玻璃一颗颗亮起来
  casket: { sound: 'coins', fx: 'coins' },       // 银币哗啦洒出（只有银币匣）
  bell: { sound: 'toll', delay: 0.45 },          // 船钟扶正时敲响一下
};

// 普通揭晓那一下物件自己亮多少（湿的硬东西反光强，布、木头、泥里的活物弱）
const GLINT = { metal: 0.2, glass: 0.2, ceramic: 0.14 }; // 普通揭晓时物件自己亮一下的峰值（轻：湿漉漉的反光，不是发白）

export const SLOTS = [[-0.35, -4.75], [0.65, -4.6], [1.65, -4.65], [-1.3, -4.8], [-1.2, -7.15], [-0.15, -7.25], [0.9, -7.3], [1.9, -7.15], [-1.35, -3.8], [1.35, -3.8]];

// 泥壳材质：按喷水方向逐片剥落；内壁更暗（看不到空腔）
function shellMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  // uHole：冲到实物那一下（B15），裹着那件东西的泥团在那一块崩掉（网包局部坐标的中心、半径）
  // uPeek / uPeekA：珍品露头（C5）时水先冲开的那一角（网包局部的球心、半径）和冲开了几成
  const u = { uCut: { value: 0 }, uSprayDir: { value: new THREE.Vector3(1, 0.3, 0).normalize() }, uScale: { value: 3.4 }, uHole: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, uPeek: { value: new THREE.Vector4(0, 0, 0, 0.1) }, uPeekA: { value: 0 } };
  m.userData.u = u;
  patchMaterial(m, {
    key: 'shell4', uniforms: u,
    fragPars: 'uniform float uCut; uniform vec3 uSprayDir; uniform float uScale; uniform vec4 uHole[3]; uniform vec4 uPeek; uniform float uPeekA;',
    frag: `{
  float n = vn3(vOPos * uScale) * 0.65 + vn3(vOPos * uScale * 2.7 + 3.0) * 0.35;
  float side = dot(normalize(vOPos + vec3(0.0001)), uSprayDir) * 0.22;
  float th = n + side - uPeekA * 1.4 * (1.0 - smoothstep(uPeek.w * 0.45, uPeek.w, length(vOPos - uPeek.xyz)));
  if (th < uCut) discard;
  for (int i = 0; i < 3; i++) if (uHole[i].w > 0.0 && length(vOPos - uHole[i].xyz) < uHole[i].w * (0.7 + 0.6 * n)) discard;
  float edge = smoothstep(uCut, uCut + 0.07, th);
  diffuseColor.rgb *= mix(0.45, 1.0, edge);
  if (!gl_FrontFacing) diffuseColor.rgb *= 0.45;
}`,
  });
  return m;
}

function lumpyGeometry(rx, ry, rz, seed, thick, detail = 2) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 5.3 + seed) * Math.cos(v.z * 4.7 - seed) * 0.13 + Math.sin(v.y * 8.1 + seed * 2) * 0.07;
    v.multiplyScalar(1 + n * thick);
    v.x *= rx; v.y *= ry; v.z *= rz;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

// 着色器预热用：与揭宝时同样的材质与几何类型（不显示，只让程序提前编好）
export function revealWarmMeshes() {
  const coreB = new Builder(); coreB.add(lumpyGeometry(0.3, 0.2, 0.3, 1, 1), (x) => col(0x5a4a34));
  const core = new THREE.Mesh(coreB.build(), shellMaterial());
  const sb = new Builder(); sb.add(lumpyGeometry(0.5, 0.33, 0.5, 2, 1, 3), (x) => col(0x6a5a40));
  const shell = new THREE.Mesh(sb.build(), shellMaterial());
  const ex = new Builder(); ex.add(sph(0.05, 5, 3), col(0x4a3e2c));
  const extra = new THREE.Mesh(ex.build(), worldMat({ key: 'shellx' }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.5, 40), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  const stain = new THREE.Mesh(new THREE.CircleGeometry(1, 20), stainMaterial(0x4a3e2c));
  for (const m of [core, shell]) m.castShadow = true;
  return [core, shell, extra, ring, stain, ...washWarmMeshes()];
}
function stainMaterial(c) { return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); }

export class RevealDirector {
  constructor(game) {
    this.g = game;
    this.active = null;
    this.rng = new RNG(4242);
    this.stains = [];
    // 货舱那一堆：船员把东西放进舱，越堆越高（纯表现）
    this.hold = new Hold(game.boat);
    game.crew.hold = this.hold;
    // 落包、冲洗、剥落、冲到实物、加快、揭幕长什么样（效果清单第四批）
    this.wfx = new WashFx(game);
    // 画面上的后期参数、环境声也是整个游戏共用的：新开一趟时清掉上一趟可能留着的褪色、暗角、抽掉的环境声
    const U = game.view.post.uniforms;
    if (U.uDesat) U.uDesat.value.w = 0;
    U.uVignette.value = 0.35;
    if (game.audio && game.audio.unhush) game.audio.unhush(0, 0.3);
  }
  get busy() { return !!this.active; }
  // 镜头跟得多紧（给 game.updateCamera 的弹簧）：普通的一网确认后要很快停稳（B18），其余照旧
  get camSmooth() { const A = this.active; return A && A.phase === 'show' && A.frame ? 0.1 : 0; }
  // 近景：揭晓（拉回以前），以及网包转回甲板上空、镜头先走过去的那一小会儿
  get closeUp() { return !!(this.active && this.active.phase !== 'pull') || !!this.pre; }
  // 网带着东西转回甲板上空（吊臂快到位、网往甲板上放）：镜头先去清洗位的近景，网包落下时镜头已经停稳（B12）
  preApproach() {
    const g = this.g, op = g.op;
    const near = op && op.load && op.load.entries.length && (op.state === 'land' || (op.state === 'swing' && g.boat.craneEta() < 0.45));
    if (this.active || !near) return this.pre && op && this.pre.load === op.load ? this.pre : null;
    if (!this.pre || this.pre.load !== op.load) {
      const sorted = sortEntries(op.load.entries);
      this.pre = { load: op.load, phase: 'pre', t: 0, R: bundleR(sorted), camSide: sideOf(g), main: sorted[0] };
      // 黑边和镜头一起进来（普通的一网是细细的两道；珍贵的落包时再加宽）；屏幕上的作业界面同时淡出
      g.hud && g.hud.setRevealMode(true, false);
      fxTag('B23', '看宝：黑边推进来，黄铜细线从正中描出去');
    }
    return this.pre;
  }

  begin(load) {
    const g = this.g, boat = g.boat;
    const entries = load.entries; // [{kind:'item', it} | {kind:'live', cr}]
    const precious = entries.some((e) => e.kind === 'item' && e.it.precious);
    const st = SHELL;
    const bundle = new THREE.Group();
    bundle.position.set(BOAT.washLocal.x, BOAT.deckY, BOAT.washLocal.z);
    boat.deck.add(bundle);
    bundle.updateMatrixWorld(true);
    // 主角：最值钱的那件（珍贵优先），其余按体积环绕
    const sorted = sortEntries(entries);
    let ringR = 0, coreTop = 0.2;
    const coreB = new Builder(), mainB = new Builder();
    const inv = new THREE.Matrix4().copy(bundle.matrixWorld).invert();
    let peek = null;
    sorted.forEach((e, i) => {
      const r = rOf(e);
      let x = 0, z = 0;
      if (i > 0) { const a = i * 2.39996; ringR = Math.max(ringR, rOf(sorted[0]) * 0.75 + r * 0.8); x = Math.cos(a) * ringR; z = Math.sin(a) * ringR; }
      e.lx = x; e.lz = z;
      const m = e.kind === 'item' ? e.it.mesh : e.cr.takeMesh();
      e.mesh = m;
      m.visible = true;
      if (m.parent) m.parent.remove(m);
      bundle.add(m);
      m.position.set(x, 0.02, z);
      m.rotation.set(0, this.rng.next() * 6.28, 0);
      m.scale.setScalar(1);
      m.updateMatrixWorld(true);
      if (e.kind === 'item') {
        const u = e.it.body.material.userData.u;
        u.uDirt.value = 1.0; e.it.attachMesh.visible = true; e.it.attachMesh.scale.setScalar(1);
        // 银器的光偏冷，不然在暖光里会白成一片
        if (u.uGlowCol) u.uGlowCol.value.set(e.it.silver ? 0xdde6ff : 0xffe2a0);
      }
      // 实心泥团：按物件包围盒（换到网包局部）裹住
      const bb = new THREE.Box3().setFromObject(m).applyMatrix4(inv);
      const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      const rx = Math.max(sz.x / 2 + 0.08, 0.13), ry = Math.max(sz.y / 2 + 0.08, 0.11), rz = Math.max(sz.z / 2 + 0.08, 0.13);
      const cc = col(st.core), cd = col(st.b);
      const cy = Math.max(c.y, ry * 0.85);
      coreTop = Math.max(coreTop, cy + ry);
      // 珍品的那一团单独一块（C5：水先冲开它的一角，别处还裹着，直到确认那一下崩开）
      const own = i === 0 && precious && e.kind === 'item';
      const shade = (px, py, pz) => cc.clone().lerp(cd, (Math.sin(px * 17 + pz * 11) * 0.5 + 0.5) * 0.6);
      if (own) {
        // 贴着它自己的形状和朝向裹（包围盒是斜的会大一圈，那一角就埋得太深，冲不出来）
        const g0 = e.it.body.geometry; if (!g0.boundingBox) g0.computeBoundingBox();
        const ls = g0.boundingBox.getSize(new THREE.Vector3());
        const ex = Math.max(ls.x / 2 * 1.3 + 0.05, 0.13), ey = Math.max(ls.y / 2 + 0.07, 0.11), ez = Math.max(ls.z / 2 * 1.3 + 0.05, 0.13);
        mainB.add(lumpyGeometry(ex, ey, ez, this.rng.next() * 40, st.thick * 0.6), shade, M(c.x, Math.max(c.y, ey * 0.85), c.z, 0, m.rotation.y, 0));
        coreTop = Math.max(coreTop, Math.max(c.y, ey * 0.85) + ey);
        peek = { e, bb: bb.clone(), c: c.clone() };
      } else coreB.add(lumpyGeometry(rx, ry, rz, this.rng.next() * 40, st.thick), shade, M(c.x, cy, c.z));
    });
    const coreMat = shellMaterial();
    coreMat.userData.u.uScale.value = 5.0;
    const coreMesh = new THREE.Mesh(coreB.build(), coreMat);
    coreMesh.castShadow = true;
    bundle.add(coreMesh);
    let coreMain = null;
    if (peek) {
      const mm = shellMaterial(); mm.userData.u.uScale.value = 5.0;
      coreMain = new THREE.Mesh(mainB.build(), mm); coreMain.castShadow = true;
      bundle.add(coreMain);
    }

    let R = 0.3;
    for (const e of sorted) R = Math.max(R, Math.hypot(e.lx, e.lz) + rOf(e) * 0.95);
    R = Math.max(0.45, R * 1.04 + 0.14);
    // 外壳：整团厚泥 + 网绳 + 碎壳
    const sb = new Builder();
    const shellGeo = lumpyGeometry(R, R * 0.66, R, this.rng.next() * 50, st.thick, 3);
    shellGeo.translate(0, R * 0.55, 0);
    const p = shellGeo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.02) p.setY(i, 0.02);
    const ca = col(st.a), cb = col(st.b);
    sb.add(shellGeo, (x, y, z) => ca.clone().lerp(cb, (Math.sin(x * 13 + z * 9) * 0.5 + 0.5) * 0.7));
    const extra = new Builder();
    for (let i = 0; i < 30; i++) {
      const a = this.rng.next() * 6.28, e2 = this.rng.next() * 1.2;
      const px = Math.cos(a) * R * Math.cos(e2) * 0.97, pz = Math.sin(a) * R * Math.cos(e2) * 0.97, py = R * 0.55 + Math.sin(e2) * R * 0.62;
      extra.add(sph(0.05 + this.rng.next() * 0.05, 5, 3), this.rng.next() < 0.3 ? col(0xd8d0c0) : col(st.b), M(px, py, pz));
    }
    for (let k = 0; k < 4; k++) {
      const a0 = k * 0.8;
      const pts = [];
      for (let j = 0; j <= 10; j++) { const t = j / 10, a = a0 + t * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * R * 1.03 * Math.sin(t * Math.PI + 0.2), R * 0.55 + Math.cos(t * Math.PI) * R * 0.66, Math.sin(a) * R * 1.03 * Math.sin(t * Math.PI + 0.2))); }
      for (let j = 0; j < pts.length - 1; j++) extra.add(rod(pts[j], pts[j + 1], 0.025, 3), col(0x2a2620));
    }
    const shell = new THREE.Mesh(sb.build(), shellMaterial());
    shell.castShadow = true;
    bundle.add(shell);
    const extraMesh = new THREE.Mesh(extra.build(), worldMat({ key: 'shellx' }));
    bundle.add(extraMesh);
    // 镜头已经先走到了哪一舷，就按那一舷摆（中途玩家转了视角也不换边）
    const camSide = this.pre && this.pre.load === load ? this.pre.camSide : sideOf(g);
    this.pre = null;
    if (peek) {
      this.peekCorner(peek, camSide, bundle);
      coreMain.material.userData.u.uPeek.value.copy(peek.lump);
      peek.e.it.body.material.userData.u.uPeek.value.copy(peek.local);
      peek.e.it.body.material.userData.u.uPeekA.value = 0;
    }
    // 船员站在镜头对面冲，泥从远侧先被冲开
    const sd = new THREE.Vector3(Math.sin(camSide + Math.PI), 0.4, Math.cos(camSide + Math.PI)).normalize();
    shell.material.userData.u.uSprayDir.value.copy(sd);
    coreMat.userData.u.uSprayDir.value.copy(sd);
    if (coreMain) coreMain.material.userData.u.uSprayDir.value.copy(sd);
    const value = entries.reduce((s, e) => s + (e.kind === 'item' ? e.it.value : e.cr.value), 0);
    // 分量：重的网包落下压得更扁、响得更沉（预兆）
    const weight = entries.reduce((s, e) => s + (e.kind === 'item' ? (MASS_W[e.it.def && e.it.def.mass] || 0.4) : 0.4), 0);
    // 水柱打到实物的那几声：主件先响，伴随物跟着，最多三声；两声之间至少隔 0.32 秒（B15，见 update）
    const strikes = sorted.slice(0, 3).map((e, i) => ({ e, k: 0.56 + i * 0.06, done: false }));
    const sig = sorted[0].kind === 'item' ? SIGNATURE[sorted[0].it.key] : null;
    this.active = {
      load, entries: sorted, bundle, shell, coreMesh, extraMesh, R, precious, st, value, camSide, coreMain, peek,
      phase: 'land', t: 0, washT: 0, washDur: precious ? TIMING.washP : TIMING.washN, showDur: precious ? TIMING.showP : TIMING.showN,
      fast: false, live: entries.some((e) => e.kind === 'live'), main: sorted[0],
      weight, wn: Math.min(1, weight / 2), strikes, landed: false, sq: 0, sqT: 0,
      sig: sig && (sorted[0].it.key !== 'casket' || sorted[0].it.silver) ? sig : null,
    };
    // 网口松开（B12）：泥包从网兜底的高度按重力掉下来（网包越大，底边越低），砸到甲板后再过 0.25 秒开水
    const net = new THREE.Vector3().copy(g.net.pos); boat.deck.worldToLocal(net);
    const drop = Math.max(0.35, Math.min(0.85, net.y - 0.25 - R * 0.5 - BOAT.deckY));
    this.active.drop = drop; this.active.fallT = Math.sqrt(2 * drop / 9.8); this.active.landDur = this.active.fallT + 0.25;
    bundle.position.y = BOAT.deckY + drop;
    this.wfx.prepare(this.active);
    this.wfx.release(this.active);
    g.crew.washR = R;
    g.crew.requestHoses(2, BOAT.washLocal, camSide);
    g.hud && g.hud.setRevealMode(true, precious);
    if (precious) fxTag('B23', '看宝：黑边加宽、细线变金（珍贵的一网）');
  }
  // 冲洗时按 A（B16）：第一下水开到最大（水泵一顶、水柱变粗、水声变急，计时数字一跳）；再按是一下小的“再催一把”
  speedUp() {
    const A = this.active, g = this.g;
    if (!A || A.phase !== 'wash') return;
    if (!A.fast) {
      A.fastFrom = this.washRemain(); A.fastAt = g.time;
      A.fast = true; g.crew.hoseFast = true;
      this.wfx.fast(A, true);
    } else if (g.time - (A.pulseAt ?? -9) > 0.3 && g.time - A.fastAt > 0.3) { A.pulseAt = g.time; this.wfx.fast(A, false); }
  }
  // 还要冲多久（落包 + 冲洗；按了加快就按加快的速度算）
  washRemain() {
    const A = this.active;
    if (!A) return 0;
    if (A.phase === 'land') return Math.max(0, A.landDur - A.t) + A.washDur;
    if (A.phase === 'wash') return Math.max(0, A.washDur - A.washT) / (A.fast ? 2.4 : 1);
    return 0;
  }

  update(dt) {
    const g = this.g;
    this.hold.update(dt, g);
    this.wfx.update(dt);
    this.updateStains(dt);
    const A = this.active;
    // 网带着东西出水：冲洗手先去清洗位等着（落包时再按镜头站好位）
    const op = g.op;
    if (!A && op && op.result && op.result.count > 0 && (op.state === 'lifting' || op.state === 'swing' || op.state === 'land') && this.preHosed !== op) {
      this.preHosed = op;
      g.crew.requestHoses(2, BOAT.washLocal, sideOf(g));
    }
    if (!A) { if (this.pre) this.hideOccluders(true); return; }
    A.t += dt;
    this.hideOccluders(true);
    this.updateSquash(dt);
    // 落包之后半拍：船壳低低“吱”一声，船边的水拍一下（和落地那一声错开）
    if (A.landed) { A.sinceLand += dt; if (!A.dipSnd && A.sinceLand >= 0.1) { A.dipSnd = true; g.audio && g.audio.play('hullDip', { k: 0.6 + A.wn * 0.8 }); } }
    if (A.phase === 'land') {
      // 网松开，泥包按重力落到清洗位上：掉的时候被自己的重量拉长一点，砸到才压扁（B12）
      if (!A.landed) {
        const t = Math.min(A.t, A.fallT), k = t / A.fallT;
        A.bundle.position.y = BOAT.deckY + Math.max(0, A.drop - 4.9 * t * t);
        A.bundle.scale.set(1 - 0.05 * k, 1 + 0.1 * k, 1 - 0.05 * k);
        if (A.t >= A.fallT) { A.bundle.scale.set(1, 1, 1); this.impact(); }
      }
      if (A.t > A.landDur) { A.phase = 'wash'; A.t = 0; g.audio && g.audio.play('hose', { on: true }); }
      return;
    }
    if (A.phase === 'wash') {
      A.washT += dt * (A.fast ? 2.4 : 1);
      const k = Math.min(1, A.washT / A.washDur);
      this.washShell(dt, k);
      // 中段（0.4–0.74）：每件裹着的泥团慢慢化开，先只见体量
      A.coreMesh.material.userData.u.uCut.value = smoothRange(k, 0.4, 0.74) * 1.15;
      A.coreMesh.visible = k < 0.76;
      // 珍品（C5）：先冲开水下见过的那一角，别处还裹着泥，憋到确认那一下
      if (A.coreMain) this.updatePeek(dt, k);
      // 物件本身：泥垢在 0.55 之后才开始掉，0.8 之后露出关键特征
      const dirt = 1.0 - 0.42 * smoothRange(k, 0.55, 0.8) - 0.58 * smoothRange(k, 0.8, 1.0);
      for (const e of A.entries) {
        if (e.kind === 'item') {
          if (e === A.main && A.precious) {
            // 憋住：珍品身上那层泥壳最后才崩（确认那一下），冲洗后段只露出一块块，关键特征还盖着
            e.it.body.material.userData.u.uDirt.value = 1.0 - 0.3 * smoothRange(k, 0.5, 0.78) - 0.12 * smoothRange(k, 0.78, 0.98);
            e.it.attachMesh.scale.setScalar(Math.max(0.001, 1 - 0.3 * smoothRange(k, 0.62, 0.95)));
          } else {
            e.it.body.material.userData.u.uDirt.value = Math.max(0, dirt + (e === A.main ? 0.03 : -0.03));
            e.it.attachMesh.scale.setScalar(Math.max(0.001, 1 - smoothRange(k, 0.62, 0.88)));
          }
        } else if (e.cr.wriggle && k > 0.5) e.cr.wriggle(e.mesh, A.t);
      }
      // 露头：水柱第一次打到实物，冲水声变了调——金属叮、陶器嗒、木头笃、玻璃脆、石头闷
      // 一件一件地冲到（B15）：轮到了，而且离上一声至少 0.32 秒（加快时也不叠在一起）
      for (const s of A.strikes) {
        if (s.done) continue;
        if (k >= s.k && g.time - (A.lastStrike ?? -9) >= 0.32) { s.done = true; A.lastStrike = g.time; this.strike(s.e, s.e === A.main); }
        break;
      }
      this.wfx.wash(dt, A, k);
      // 珍贵的一网冲开外壳的时候：旁边闲着的人就凑过来，站到冲洗位后面（镜头对侧）等着看（C7；早一点叫，确认时人已经站好，不会从镜头前面穿过去）
      if (A.precious && k >= 0.15 && !A.gathered) { A.gathered = true; g.crew.gather && g.crew.gather(BOAT.washLocal, A.camSide); fxTag('C7', '珍品：船员围到近景里'); }
      // 憋住：泥缝里透出暖光（一明一暗地憋着），一声往上走，最后 0.4 秒抽声、只剩一滴水（C6）
      if (A.precious && A.main.it) this.holdBreath(dt, k);
      if (Math.random() < dt * 30) g.particles.drips(...worldOf(g.boat, BOAT.washLocal.x, BOAT.deckY + 0.05, BOAT.washLocal.z), A.R * 1.2, 3, [0.45, 0.38, 0.28]);
      if (A.stain) { A.stain.scale.setScalar(A.R * (1.15 + 0.5 * k)); A.stain.material.opacity = 0.32 + 0.2 * k; }
      if (k >= 1) this.confirm();
      return;
    }
    if (A.phase === 'show') {
      const k = Math.min(1, A.t / 0.5);
      const m = A.main.mesh;
      m.position.y = 0.02 + (A.precious ? 0.5 : 0.28) * easeOut(k);
      this.presentMain(dt, easeOut(k));
      // 伴随物摆开：普通的一网确认后马上挨着摆好（B18，0.4 秒内都停稳）；珍品等余波过去，一件件跳到旁边（C7）
      A.entries.forEach((e) => {
        if (e === A.main) return;
        const sl = e.slotL, ci = e.ci || 0;
        if (!e.from) e.from = [e.mesh.position.x, e.mesh.position.z];
        const t0 = A.precious ? 1.25 + ci * 0.16 : 0.03 + ci * 0.05, du = A.precious ? 0.5 : 0.32, hop = A.precious ? 0.26 : 0.05;
        const u = Math.max(0, Math.min(1, (A.t - t0) / du)), q = u * u * (3 - 2 * u);
        e.mesh.position.x = e.from[0] + (sl[0] - e.from[0]) * q;
        e.mesh.position.z = e.from[1] + (sl[1] - e.from[1]) * q;
        e.mesh.position.y = 0.02 + hop * Math.sin(Math.PI * u);
        if (A.precious && u >= 1 && !e.landed) {
          e.landed = true;
          const p = new THREE.Vector3(); e.mesh.getWorldPosition(p);
          g.particles.splat(p.x, p.y + 0.05, p.z, 3);
          g.audio && g.audio.play('settle', { mat: e.kind === 'item' ? (e.it.def && e.it.def.mat) || 'metal' : 'live' });
        }
        if (e.kind === 'live' && e.cr.wriggle) e.cr.wriggle(e.mesh, A.t);
      });
      if (A.main.kind === 'live' && A.main.cr.wriggle) A.main.cr.wriggle(m, A.t);
      // 普通的一网（B17）：水停后半拍再亮、再响
      if (A.chime && A.t >= A.chime.at) this.chimeBeat();
      if (A.glint != null) this.updateGlint(dt);
      if (A.precious && A.t > BURST.waveAt + BURST.waveDur && Math.random() < dt * 10) g.particles.motes(...worldOf(g.boat, BOAT.washLocal.x, BOAT.deckY + 0.7, BOAT.washLocal.z), 0.5, 1, !A.main.it.silver);
      if (A.precious) this.burstAfter(dt);
      this.signature(dt);
      if (A.toll) this.updateToll(dt);
      g.view.post.uniforms.uFlash.value = Math.max(0, g.view.post.uniforms.uFlash.value - dt * 2.4);
      if (A.ring) { const rk = Math.min(1, (A.t - (A.ringT0 || 0)) / 0.9); A.ring.scale.setScalar(0.3 + rk * 4); A.ring.material.opacity = A.ringPk * (1 - rk); }
      this.updateHalo(dt, 1);
      if (A.t >= A.showDur) this.pullBack();
      return;
    }
    if (A.phase === 'pull') {
      // 铭牌先收、镜头先走，结果卡晚一拍（0.15 秒）再从右边滑进来，签随后从铭牌飞进卡里
      if (A.cardDue && A.t >= 0.15) this.dealCard();
      g.view.post.uniforms.uFlash.value = 0;
      this.updateHalo(dt, Math.max(0, 1 - A.t / 0.4));
      this.updateSettle();
      if (A.t >= TIMING.pull) this.finish();
    }
  }

  // 落包那一下（B12）：镜头这时已经停在近景上。闷响、压扁、泥块四溅、船身一沉、镜头一震是同一下，同一帧；
  // 船壳“吱”一声晚半拍（见 update），船员的反应按离得远近一个个跟上（见 crew.jolt）
  impact() {
    const A = this.active, g = this.g;
    A.landed = true; A.sinceLand = 0;
    // 泥包砸到甲板：越重，旁边的人缩得越狠（只是表现）
    if (g.crew.jolt) g.crew.jolt(BOAT.washLocal.x, BOAT.washLocal.z, 0.6 + A.wn * 0.8);
    A.bundle.position.y = BOAT.deckY;
    A.sq = 0.08 + 0.16 * A.wn; A.sqT = 0;
    g.audio && g.audio.play('thud', { mass: Math.min(1, 0.25 + A.wn * 0.75) + (A.precious ? 0.25 : 0) });
    g.particles.mudChunks(...worldOf(g.boat, BOAT.washLocal.x, BOAT.deckY + 0.1, BOAT.washLocal.z), A.R, A.st.chip, 12 + Math.round(A.wn * 14));
    g.shake(0.05 + A.wn * 0.12 + (A.precious ? 0.12 : 0));
    // 船身一沉：越重沉得越多，船尾那一侧往下压，再晃两下回来
    g.boat.dip && g.boat.dip(0.045 + A.wn * 0.09 + (A.precious ? 0.05 : 0), BOAT.washLocal.x, BOAT.washLocal.z);
    // 船边的水被压得溅起一点
    for (let i = 0; i < 10; i++) { const [x, , z] = worldOf(g.boat, BOAT.washLocal.x > 0 ? 2.75 : -2.75, 0, BOAT.washLocal.z + (Math.random() - 0.5) * 2.4); g.particles.water.emit(x, 0.15, z, (Math.random() - 0.5) * 0.6, 1.0 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6, 0.5 + Math.random() * 0.3, 0.1 + Math.random() * 0.06, 0.88, 0.95, 0.97, 0.85, 0, 0.3, 9.8); }
    this.wfx.impact(A);
    const stain = new THREE.Mesh(new THREE.CircleGeometry(1, 20), stainMaterial(A.st.b));
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(BOAT.washLocal.x, BOAT.deckY + 0.012, BOAT.washLocal.z);
    stain.scale.setScalar(A.R * 1.1);
    stain.material.opacity = 0.3;
    g.boat.deck.add(stain);
    A.stain = stain;
    this.stains.push({ mesh: stain, life: -1 });
  }
  // 压扁再弹回（越重压得越扁）
  updateSquash(dt) {
    const A = this.active;
    if (!A.sq) return;
    A.sqT += dt;
    const s = A.sq * Math.exp(-A.sqT * 7) * Math.cos(A.sqT * 21);
    A.bundle.scale.set(1 + s * 0.5, 1 - s, 1 + s * 0.5);
    if (A.sqT > 1.2) { A.sq = 0; A.bundle.scale.set(1, 1, 1); }
  }
  // 冲洗后留下的泥水印：揭晓后慢慢干掉
  updateStains(dt) {
    for (const s of this.stains) {
      if (s.life < 0) continue;
      s.life -= dt;
      s.mesh.material.opacity = Math.max(0, s.mesh.material.opacity - dt * 0.05);
      if (s.life <= 0 || s.mesh.material.opacity <= 0.005) { s.mesh.parent && s.mesh.parent.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); s.dead = true; }
    }
    if (this.stains.some((s) => s.dead)) this.stains = this.stains.filter((s) => !s.dead);
  }

  // 前段（0–0.42）去外壳：厚泥被冲散
  washShell(dt, k) {
    const A = this.active, g = this.g, st = A.st;
    // 外壳已经裂成泥板（B14）：一块块翻下去、网绳跟着滑下去，都在 washfx 里
    if (A.slabs) return;
    A.shell.material.userData.u.uCut.value = 0.1 * smoothRange(k, 0.0, 0.12) + smoothRange(k, 0.12, 0.42) * 1.15;
    A.shell.visible = k < 0.44;
    A.extraMesh.visible = k < 0.3;
    const th = [[0.14, 'c0', 0.8, 14], [0.32, 'c1', 0.6, 20], [0.58, 'c2', 0.25, 10]];
    for (const [kk, key, hy, n] of th) {
      if (k > kk && !A[key]) {
        A[key] = true;
        g.particles.mudChunks(...worldOf(g.boat, BOAT.washLocal.x, BOAT.deckY + (key === 'c2' ? 0.25 : A.R * hy), BOAT.washLocal.z), A.R * (key === 'c2' ? 0.6 : 0.85), st.chip, n);
      }
    }
  }
  // —— 珍品露头（C5）——
  // 水下看见过的那一角：主件顶上朝镜头的那个角（按物件自己的包围盒，转过的也算对）
  peekCorner(P, camSide, bundle) {
    const body = P.e.it.body, c = P.c;
    if (!body.geometry.boundingBox) body.geometry.computeBoundingBox();
    const lb = body.geometry.boundingBox, toB = new THREE.Matrix4().copy(bundle.matrixWorld).invert().multiply(body.matrixWorld);
    const tx = Math.sin(camSide), tz = Math.cos(camSide), ctr = lb.getCenter(new THREE.Vector3());
    let best = null, bd = -1e9;
    for (const x of [lb.min.x, lb.max.x]) for (const z of [lb.min.z, lb.max.z]) {
      const v = new THREE.Vector3(x, lb.max.y, z).applyMatrix4(toB);
      const d = (v.x - c.x) * tx + (v.z - c.z) * tz + v.y * 0.3;
      if (d > bd) { bd = d; best = new THREE.Vector3(x, lb.max.y, z); }
    }
    const L = ctr.clone().lerp(best, 0.82); L.y = lb.max.y - (lb.max.y - lb.min.y) * 0.12;
    const sz = lb.getSize(new THREE.Vector3()), w = Math.min(0.2, Math.max(0.09, 0.26 * Math.max(sz.x, sz.z)));
    P.local = new THREE.Vector4(L.x, L.y, L.z, w);
    const b = L.clone().applyMatrix4(toB);
    // 泥团上的口子：从那一角往镜头那边、往上挪一点开，镜头正好看进去
    const cam = new THREE.Vector3(tx, 0.55, tz).normalize();
    const h = b.clone().addScaledVector(cam, 0.07);
    P.lump = new THREE.Vector4(h.x, h.y, h.z, w * 1.25);
    P.deck = new THREE.Vector3(BOAT.washLocal.x + b.x, BOAT.deckY + b.y, BOAT.washLocal.z + b.z);
  }
  // 冲洗中段：主件那一团只慢慢薄一点；0.44–0.6 水先冲开那一角（泥团上开个口，物件那一块干净、湿亮），水柱对着它；
  // 最后 1 秒水声、海声收小，水枪收小（最后 0.4 秒整条抽空在 holdBreath）
  updatePeek(dt, k) {
    const A = this.active, g = this.g, P = A.peek, u = A.coreMain.material.userData.u, iu = P.e.it.body.material.userData.u;
    const remain = this.washRemain();
    u.uCut.value = 0.04 * smoothRange(k, 0.3, 0.5) + 0.07 * smoothRange(k, 0.55, 0.97);
    u.uPeekA.value = smoothRange(k, 0.44, 0.6);
    u.uPeek.value.w = P.lump.w * (0.75 + 0.3 * smoothRange(k, 0.44, 0.92));
    iu.uPeekA.value = smoothRange(k, 0.46, 0.62);
    iu.uPeek.value.w = P.local.w * (0.78 + 0.35 * smoothRange(k, 0.46, 0.92));
    g.crew.hoseAim = k >= 0.38 && k < 0.78 ? P.deck : null;
    const wp = () => { const v = P.deck.clone(); g.boat.deck.localToWorld(v); return v; };
    if (!A.peeked && k >= 0.46) {
      A.peeked = true;
      g.audio && g.audio.play('peek', { silver: !!P.e.it.silver });
      const p = wp();
      for (let i = 0; i < 10; i++) g.particles.spark.emit(p.x, p.y + 0.03, p.z, (Math.random() - 0.5) * 0.9, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 0.9, 0.35 + Math.random() * 0.25, 0.03 + Math.random() * 0.03, 1, 0.92, 0.7, 1, 0, 1.2, 2);
      fxTag('C5', '珍品露头·先冲开那一角', 'C5');
    }
    // 那一角上水光一闪一闪往下流
    if (A.peeked && Math.random() < dt * 12) { const p = wp(); const sv = !!P.e.it.silver; g.particles.spark.emit(p.x + (Math.random() - 0.5) * 0.12, p.y, p.z + (Math.random() - 0.5) * 0.12, 0, -0.3, 0, 0.3, 0.05 + Math.random() * 0.03, sv ? 0.9 : 1, sv ? 0.95 : 0.88, sv ? 1 : 0.6, 1, -0.5, 0, 1.5); }
    if (!A.quiet && remain <= 1.0) {
      A.quiet = true; g.crew.hoseSoft = true;
      g.audio && g.audio.play('quieten', { level: 0.4, fade: 0.55 });
      fxTag('C5', '珍品露头·水声收小', 'C5');
    }
    if (remain <= 0.4) g.crew.hoseOff = true;
  }
  // 水柱打到实物：按材质响一声，闪一点水光（珍贵物的那一声带着颤音）
  strike(e, isMain) {
    const A = this.active, g = this.g;
    const mat = e.kind === 'item' ? (e.it.def && e.it.def.mat) || 'metal' : 'live';
    g.audio && g.audio.play('strike', { mat, size: Math.min(1, rOf(e) / 0.6), gold: isMain && A.precious, silver: isMain && e.kind === 'item' && !!e.it.silver, quiet: !isMain });
    // 冲开一块“窗口”露出材质、按材质亮一下或崩出碎屑、水声变调（B15，washfx）；珍品自己的那一下还按原来的金星
    this.wfx.hit(A, e, isMain);
    if (!(isMain && A.precious)) return;
    const p = new THREE.Vector3(); e.mesh.getWorldPosition(p);
    p.y += Math.min(0.4, (e.kind === 'item' ? e.it.h : 0.2) * 0.8) + 0.05;
    const warm = mat === 'metal' || mat === 'glass';
    for (let i = 0; i < (isMain ? 5 : 3); i++) g.particles.spark.emit(p.x + (Math.random() - 0.5) * 0.15, p.y, p.z + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6, 0.35 + Math.random() * 0.25, 0.035 + Math.random() * 0.03, warm ? 1.0 : 0.9, warm ? 0.9 : 0.95, warm ? 0.6 : 1.0, 0.9, 0, 1.0, 2);
  }
  // 珍贵物揭晓后各自的那一下
  signature(dt) {
    const A = this.active, g = this.g, S = A.sig;
    if (!S || !A.main.mesh) return;
    const t = A.t;
    const p = new THREE.Vector3(); A.main.mesh.getWorldPosition(p);
    const em = (x, y, z, vx, vy, vz, life, size, c, grav = -0.1) => g.particles.spark.emit(x, y, z, vx, vy, vz, life, size, c[0], c[1], c[2], 1, 0, 1.2, grav);
    if (S.delay && !A.sigSound && t >= S.delay) { A.sigSound = true; g.audio && g.audio.play(S.sound); if (S.sound === 'toll') this.tollBeat(); }
    if (!S.delay && !A.sigSound && t >= 0.12) { A.sigSound = true; g.audio && g.audio.play(S.sound); }
    if (S.fx === 'gems') {
      A.gemI = A.gemI || 0;
      while (A.gemI < 4 && t >= 0.18 + A.gemI * 0.2) {
        const gx = (A.gemI - 1.5) * 0.12;
        const q = new THREE.Vector3(gx, (A.main.it ? A.main.it.h : 0.3) * 0.92, 0).applyQuaternion(A.main.mesh.quaternion).add(p);
        for (let i = 0; i < 9; i++) { const a = Math.random() * 6.28; em(q.x, q.y, q.z, Math.cos(a) * 0.9, 0.3 + Math.random() * 0.8, Math.sin(a) * 0.9, 0.5 + Math.random() * 0.3, 0.05, i % 3 ? [1.0, 0.25, 0.2] : [0.35, 0.6, 1.0]); }
        A.gemI++;
      }
    }
  }

  // —— 船钟（C9）——“当——”：钟身被敲得一晃，震下一圈水珠，甲板上一道淡圈；水面从船边推出一圈波纹，
  // 海底回响的两声（0.55、1.3 秒，声音见 audio-precious.js）水面再各推一圈，一圈比一圈淡
  tollBeat() {
    const A = this.active, g = this.g, m = A.main.mesh;
    A.toll = { t: 0, echo: 0 };
    const p = new THREE.Vector3(); m.getWorldPosition(p);
    g.ripples && g.ripples.add(p.x, p.z, { amp: 1.25, speed: 5.2, life: 6.5, r0: 3.2 });
    const h = A.main.it ? A.main.it.h : 0.3, r = rOf(A.main);
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * 6.28, rr = r * (0.7 + Math.random() * 0.4);
      g.particles.water.emit(p.x + Math.cos(a) * rr, p.y + h * (0.2 + Math.random() * 0.8), p.z + Math.sin(a) * rr, Math.cos(a) * 0.9, 0.6 + Math.random() * 0.8, Math.sin(a) * 0.9, 0.5 + Math.random() * 0.3, 0.04 + Math.random() * 0.03, 0.86, 0.93, 0.97, 0.9, 0, 0.4, 9.8);
    }
    A.tollRing = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.5, 48), new THREE.MeshBasicMaterial({ color: 0xf2e6c2, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    A.tollRing.rotation.x = -Math.PI / 2; A.tollRing.position.y = 0.05;
    A.bundle.add(A.tollRing);
    fxTag('C9', '船钟·当——', 'C9');
  }
  updateToll(dt) {
    const A = this.active, g = this.g, T = A.toll, m = A.main.mesh;
    T.t += dt;
    // 钟身晃：每秒一个来回多一点，越晃越小（绕横着镜头的那根轴，看得出左右晃）
    const cam = g.view.camera.position.clone(); A.bundle.worldToLocal(cam);
    const ax = new THREE.Vector3(cam.z - m.position.z, 0, -(cam.x - m.position.x)).normalize();
    const ang = 0.085 * Math.exp(-T.t * 0.85) * Math.sin(T.t * Math.PI * 2 * 1.15);
    m.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, ang));
    if (A.tollRing) {
      const k = Math.min(1, T.t / 1.4);
      A.tollRing.scale.setScalar(0.4 + 5.5 * (1 - Math.pow(1 - k, 2))); A.tollRing.material.opacity = 0.55 * (1 - k);
      if (k >= 1) { A.bundle.remove(A.tollRing); A.tollRing.geometry.dispose(); A.tollRing.material.dispose(); A.tollRing = null; }
    }
    const ECHO = [[0.55, 0.6], [1.3, 0.38]];
    while (T.echo < ECHO.length && T.t >= ECHO[T.echo][0]) {
      const p = new THREE.Vector3(); m.getWorldPosition(p);
      g.ripples && g.ripples.add(p.x, p.z, { amp: ECHO[T.echo][1], speed: 4.6, life: 5.5, r0: 3.0 });
      if (T.echo === 0) fxTag('C9', '船钟·海底回响', 'C9');
      T.echo++;
    }
  }

  // 展示台：主件扶正（躺着建模的器物立起来），扁平件正面转向镜头，绕自身轴慢转
  presentMain(dt, k) {
    const A = this.active, g = this.g;
    const m = A.main.mesh;
    A.spin = (A.spin || 0) + dt * (A.precious ? 0.55 : 0.35);
    const disp = A.main.kind === 'item' ? (A.main.it.def.display || {}) : {};
    const qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(disp.rx ? disp.rx * k : 0, 0, disp.rz ? disp.rz * k : 0));
    // 小件扁平物（盘、星盘）立起来朝向镜头；锚这样一两米长的大件平放着转，立起来会顶出画面
    const flat = A.main.kind === 'item' && A.main.it.r < 0.6 && (disp.face || (!disp.rz && !disp.rx && A.main.it.h < A.main.it.r * 0.7));
    const Y = new THREE.Vector3(0, 1, 0);
    if (flat) {
      // 镜头方向（网包局部）
      const cam = g.view.camera.position.clone();
      A.bundle.worldToLocal(cam);
      const dir = cam.sub(m.position).normalize();
      const face = Y.clone().lerp(dir, 0.82 * k).normalize();
      const qFace = new THREE.Quaternion().setFromUnitVectors(Y, face);
      const qSpin = new THREE.Quaternion().setFromAxisAngle(Y, A.spin * 0.6 + A.yaw0);
      m.quaternion.copy(qFace).multiply(qSpin).multiply(qUp);
      A.restYaw = A.spin * 0.6 + A.yaw0;
    } else {
      const qSpin = new THREE.Quaternion().setFromAxisAngle(Y, A.spin + A.yaw0);
      m.quaternion.copy(qSpin).multiply(qUp);
      A.restYaw = A.spin + A.yaw0;
    }
  }

  // 屏幕空间辉光：围着主件转的光芒（不受遮挡，不压住主件本身）
  updateHalo(dt, k) {
    const A = this.active, g = this.g, U = g.view.post.uniforms;
    if (!A.precious) { U.uHalo.value.w = 0; return; } // 普通的一网不放光芒（B17：“大事来了”的信号留给珍贵的）
    const p = new THREE.Vector3();
    A.main.mesh.getWorldPosition(p);
    p.y += rOf(A.main) * 0.4;
    const s = p.clone().project(g.view.camera);
    const strength = A.precious ? k * Math.min(1, Math.max(0, (A.t - BURST.waveAt) / 0.5)) : 0.38 * k * Math.min(1, A.t / 0.25 + 0.2);
    U.uHalo.value.set(s.x * 0.5 + 0.5, s.y * 0.5 + 0.5, A.precious ? 0.2 : 0.13, strength);
    U.uHaloT.value += dt;
  }

  confirm() {
    const A = this.active, g = this.g;
    A.phase = 'show'; A.t = 0;
    A.yaw0 = A.main.mesh.rotation.y;
    A.restYaw = A.yaw0;
    g.audio && g.audio.play('hose', { on: false });
    this.wfx.settle(A);
    // 摆开：伴随物摆在哪、镜头停在哪、冲洗手凑到哪儿看（B18 / C7）
    const lay = this.layout();
    // 普通的一网（B18）：冲洗手凑到展示台后面弯腰看着它，等镜头拉回大视野以后再点头；珍贵的一网：全船的人就在近景里欢呼（C7）
    g.crew.releaseHoses({ precious: A.precious, wait: A.precious ? 0.45 : A.showDur + TIMING.pull + 0.1, look: lay.look });
    if (A.precious) fxTag('C7', '珍品：近景里一起欢呼');
    else fxTag('B18', '普通揭晓·稳稳看一会儿（镜头不动、船员凑过来）');
    g.crew.washR = 0; // 泥壳没了，甲板上走得过去
    for (const e of A.entries) if (e.kind === 'item') { e.it.body.material.userData.u.uDirt.value = 0; e.it.attachMesh.visible = false; }
    A.shell.visible = false; A.extraMesh.visible = false; A.coreMesh.visible = false;
    if (A.coreMain) { A.coreMain.visible = false; A.peek.e.it.body.material.userData.u.uPeekA.value = 0; }
    // 容器在这一刻打开：匣内物来自生成时就确定的内容
    for (const e of A.entries) if (e.kind === 'item' && e.it.key === 'casket') {
      const geo = buildItemGeometry('casket', e.it.seed, { open: true, precious: e.it.silver });
      if (e.it.vs !== 1) geo.scale(e.it.vs, e.it.vs, e.it.vs);
      e.it.body.geometry.dispose(); e.it.body.geometry = geo;
      if (e.it.silver) g.particles.sparkle(...worldOf(g.boat, BOAT.washLocal.x, BOAT.deckY + 0.4, BOAT.washLocal.z), 0.3, 40, false);
    }
    // 一次性记入这一趟（之后的搬运只是表现）
    g.commitCatch(A.load);
    if (A.precious) { this.burst(); return; }
    // 普通的一网（B17）：不闪白、不震屏、不撒火花——水一停，最后几滴水从物件上落下；隔半拍再亮、再响，名字卡同时滑进来
    this.rinseDrips();
    this.addRing(0xe8f4f0, 0.4);
    const mainMat = A.main.kind === 'item' ? (A.main.it.def && A.main.it.def.mat) || 'metal' : 'live';
    A.chime = { at: 0.2, mat: mainMat };
  }
  // 展开的摆法（确认那一刻定好，展示期间不再变）：
  //   普通的一网（B18）：主件在中间，伴随物左右两边挨着摆（多的往左边放，右边是名字卡），一眼都看得清；
  //     镜头的落点按这一排的宽度算好——整排在画面左半边的中间，确认后 0.4 秒内到位，之后一动不动；
  //     冲洗手站到展示台后面（镜头对侧）弯腰凑过来看。
  //   珍贵的一网（C7）：伴随物摆在主件左侧、略靠近镜头的一排，余波过后一件件跳过去（见 update 的展示段）。
  layout() {
    const A = this.active, a = A.camSide, w = BOAT.washLocal;
    const rx = Math.cos(a), rz = -Math.sin(a);          // 镜头右方（甲板局部）
    const tx = Math.sin(a), tz = Math.cos(a);           // 指向镜头
    const comps = A.entries.filter((e) => e !== A.main);
    const put = (e, lateral, toward) => {
      let x = rx * lateral + tx * toward, z = rz * lateral + tz * toward;
      // 不出船舷、不进舱口
      x = Math.max(-2.3, Math.min(2.3, w.x + x)) - w.x; z = Math.max(-7.3, Math.min(-4.4, w.z + z)) - w.z;
      e.slotL = [x, z];
    };
    const mainR = rOf(A.main);
    let lo = -mainR, hi = mainR;
    if (A.precious) {
      comps.forEach((e, ci) => { const row = Math.floor(ci / 3), col = ci % 3; put(e, -(0.55 + col * 0.42 + row * 0.2), -0.05 + row * 0.45); e.ci = ci; });
    } else {
      // 左、右、左、左、右……挨着排开，中间留一指宽
      let L = mainR * 0.85 + 0.1, Rr = L;
      const SIDE = [-1, 1, -1, -1, 1, -1, -1, 1];
      comps.slice().sort((p, q) => rOf(q) - rOf(p)).forEach((e, ci) => {
        const r = Math.max(0.12, rOf(e) * 0.85), sd = SIDE[ci % SIDE.length];
        let lat;
        if (sd < 0) { lat = -(L + r); L += 2 * r + 0.1; } else { lat = Rr + r; Rr += 2 * r + 0.1; }
        put(e, lat, 0.12 + 0.1 * (ci >> 2));
        lo = Math.min(lo, lat - r); hi = Math.max(hi, lat + r);
        e.ci = ci;
      });
    }
    A.nComp = comps.length;
    if (A.precious) return { look: null };
    // 镜头：整排宽多少就退多远（画面左半边装得下），主件这一排的中心落在画面左边三成处
    const half = (hi - lo) / 2 + 0.15, mid = (hi + lo) / 2;
    // 后面弯腰看的冲洗手连帽子一起在画里：小件也至少退到 3.35 米，看点抬到台面以上一点
    const D = Math.max(mainR > 0.6 ? mainR * 5 + 1.6 : Math.max(3.35, mainR * 4.4 + 1.7), half / 0.34);
    const ry = 0.3 + mainR * 0.3 + 0.25;
    A.frame = { dist: D / Math.hypot(1, 0.58), hgt: D * 0.58 / Math.hypot(1, 0.58), lat: mid + 0.27 * D, ly: ry };
    // 冲洗手凑过来看：展示台后面（镜头对侧）一左一右，弯着腰
    const back = mainR + 0.8;
    const look = [mid - 0.5, mid + 0.42].map((lat) => {
      const x = Math.max(-2.2, Math.min(2.25, w.x + rx * lat - tx * back)), z = Math.max(-7.3, Math.min(-4.5, w.z + rz * lat - tz * back));
      return [x, z];
    });
    return { look };
  }
  // 甲板上推出去的一道圈：珍品金色、亮（余波里才推出去），普通的一网淡淡一圈
  addRing(color, pk = 0.8) {
    const A = this.active;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.5, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: pk, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
    A.bundle.add(ring); A.ring = ring; A.ringT0 = A.t; A.ringPk = pk;
  }

  // —— 珍品确认（C6）——
  // 憋住：冲洗最后约 1.5 秒（按 A 加快时按加快后的真实剩余时间算）
  holdBreath(dt, k) {
    const A = this.active, g = this.g, it = A.main.it;
    const remain = this.washRemain();
    A.holdK = Math.max(A.holdK || 0, smoothRange(1.5 - remain, 0, 1.5));
    // 泥缝里的光：后段慢慢亮，越接近越憋着一明一暗
    A.glowPh = (A.glowPh || 0) + dt * (2.2 + 5 * A.holdK);
    it.body.material.userData.u.uGlow.value = (it.silver ? 0.3 : 0.5) * smoothRange(k, 0.68, 1.0) * (0.82 + 0.18 * Math.sin(A.glowPh));
    g.view.post.uniforms.uVignette.value = 0.35 + 0.22 * A.holdK;
    if (!A.rose && remain <= 1.6) { A.rose = true; g.audio && g.audio.play('rise', { dur: Math.max(0.3, remain - 0.4) }); }
    if (!A.hushed && remain <= 0.4) { A.hushed = true; g.audio && g.audio.hush(0.14); fxTag('C6', '珍品确认·憋住（抽声）', 'C6'); }
    if (!A.dripped && remain <= 0.2) { A.dripped = true; g.audio && g.audio.play('drip'); }
  }
  // 爆发：确认那一帧
  burst() {
    const A = this.active, g = this.g, U = g.view.post.uniforms, it = A.main.it;
    U.uFlash.value = 0;                                   // 不闪白：让褪色说话
    A.burst = { sig: false, chord: false, name: false, wave: false };
    if (!A.hushed) { A.hushed = true; g.audio && g.audio.hush(0.05); }
    // 只让它自己的签名声先出
    if (A.sig) { A.sigSound = true; g.audio && g.audio.play(A.sig.sound); }
    g.audio && g.audio.unhush(BURST.waveAt, 1.4);
    // 最后一层泥壳一下崩开（泥块、水星四溅）
    const p = new THREE.Vector3(); A.main.mesh.getWorldPosition(p);
    const r = rOf(A.main);
    g.particles.mudChunks(p.x, p.y + 0.12, p.z, Math.max(0.25, r * 0.8), A.st.chip, 26);
    g.particles.splat(p.x, p.y + r * 0.6, p.z, 12);
    if (it) {
      it.body.material.userData.u.uGlow.value = it.silver ? 0.16 : 0.32;
      it.body.material.userData.u.uMark.value = 1;        // 世界褪成灰时只有它留着颜色
    }
    // 世界褪色（下一帧起整片灰）；镜头往下顿一下
    if (U.uDesat) { this.desatCenter(); U.uDesat.value.z = 0; U.uDesat.value.w = 0.001; }
    g.kick && g.kick(BURST.kickPx); if (!g.kick) g.shake(0.35);
    U.uVignette.value = 0.24;
    fxTag('C6', '珍品确认·爆发', 'C6');
  }
  // 爆发之后每一帧：主和弦和名字晚 0.15 秒；0.3 秒起颜色从它那里回到世界，金圈、金星跟着往外
  burstAfter(dt) {
    const A = this.active, g = this.g, U = g.view.post.uniforms, B = A.burst, t = A.t;
    if (!B) return;
    if (U.uDesat) {
      this.desatCenter();
      const D = U.uDesat.value;
      D.w = t < 0.05 ? Math.max(D.w, t / 0.05) : t < BURST.waveAt + BURST.waveDur ? 1 : Math.max(0, 1 - (t - BURST.waveAt - BURST.waveDur) / 0.2);
      D.z = t < BURST.waveAt ? 0 : 2.3 * (1 - Math.pow(1 - Math.min(1, (t - BURST.waveAt) / BURST.waveDur), 2.2));
    }
    if (!B.chord && t >= BURST.chordAt) {
      B.chord = true;
      const mainMat = A.main.kind === 'item' ? (A.main.it.def && A.main.it.def.mat) || 'metal' : 'live';
      g.audio && g.audio.play('revealBig', { mat: mainMat });
    }
    if (!B.name && t >= BURST.nameAt) { B.name = true; g.hud && g.hud.showReveal(this.describe()); }
    if (!B.wave && t >= BURST.waveAt) {
      B.wave = true;
      this.addRing(0xffd27a);
      fxTag('C6', '珍品确认·余波（颜色回来）', 'C6');
    }
    // 金星：余波里从它身上一路往上飘（约 70 颗分在 1.2 秒里，不挤在确认那一帧）
    if (B.wave && t < BURST.waveAt + BURST.waveDur) {
      A.motes = (A.motes || 0) + dt * 58;
      const n = Math.floor(A.motes); A.motes -= n;
      if (n) g.particles.motes(...worldOf(g.boat, BOAT.washLocal.x, BOAT.deckY + 0.5, BOAT.washLocal.z), 0.5, n, !(A.main.it && A.main.it.silver));
    }
    U.uVignette.value += (0.35 - U.uVignette.value) * Math.min(1, dt * 1.5);
    if (t > BURST.waveAt + BURST.waveDur + 0.3 && A.main.it) A.main.it.body.material.userData.u.uMark.value = 0;
  }
  desatCenter() {
    const A = this.active, g = this.g, D = g.view.post.uniforms.uDesat.value;
    const p = new THREE.Vector3(); A.main.mesh.getWorldPosition(p); p.y += rOf(A.main) * 0.4;
    p.project(g.view.camera);
    D.x = p.x * 0.5 + 0.5; D.y = p.y * 0.5 + 0.5;
  }
  // 收起褪色和记号（拉回、结束、换一趟时）
  clearBurst(A = this.active) {
    const U = this.g.view.post.uniforms;
    if (U.uDesat) U.uDesat.value.w = 0;
    U.uVignette.value = 0.35;
    if (A && A.main.it) A.main.it.body.material.userData.u.uMark.value = 0;
  }
  // 普通揭晓的确认（B17）：物件自己亮一下（湿漉漉的反光），一声按材质的确认音，名字卡从右边滑进来——同一帧
  chimeBeat() {
    const A = this.active, g = this.g;
    const mat = A.chime.mat; A.chime = null;
    g.audio && g.audio.play('reveal', { mat });
    g.hud && g.hud.showReveal(this.describe());
    this.wfx.sweep(A); // 一道反光从物件上扫过去（和这一声同一拍）
    const it = A.main.kind === 'item' ? A.main.it : null;
    // 整件只轻轻提一下亮（原来的三分之一），亮的那一道交给扫过去的反光：看得出形状和材质
    if (it) { it.body.material.userData.u.uGlowCol.value.set(0xeaf6ff); A.glint = 0; A.glintPk = (GLINT[mat] || 0.1) * 0.35; }
    // 硬的东西（金属、玻璃、瓷）顶上闪一颗小星
    if (mat === 'metal' || mat === 'glass' || mat === 'ceramic') {
      const p = new THREE.Vector3(); A.main.mesh.getWorldPosition(p); p.y += (it ? it.h : 0.2) * 0.85 + 0.03;
      g.particles.spark.emit(p.x, p.y, p.z, 0, 0.12, 0, 0.42, 0.15, 1.0, 0.98, 0.92, 1, -0.6, 0, 0);
      for (let i = 0; i < 3; i++) g.particles.spark.emit(p.x + (Math.random() - 0.5) * 0.2, p.y - Math.random() * 0.1, p.z + (Math.random() - 0.5) * 0.2, 0, 0.2, 0, 0.3, 0.05, 0.95, 0.98, 1.0, 0.9, -0.5, 0, 0);
    }
    fxTag('B17', '普通揭晓·确认');
  }
  updateGlint(dt) {
    const A = this.active, it = A.main.it;
    A.glint += dt;
    const u = A.glint, v = u < 0.06 ? u / 0.06 : Math.max(0, 1 - (u - 0.06) / 0.45);
    if (it) it.body.material.userData.u.uGlow.value = A.glintPk * v * v;
    if (u > 0.7) A.glint = null;
  }
  // 水停的那一刻：最后几滴水从物件上落到甲板
  rinseDrips() {
    const A = this.active, g = this.g, p = new THREE.Vector3();
    A.main.mesh.getWorldPosition(p);
    const r = rOf(A.main), h = A.main.kind === 'item' ? A.main.it.h : 0.2;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * 6.28, d = Math.random() * r * 0.8;
      g.particles.water.emit(p.x + Math.cos(a) * d, p.y + h * (0.3 + Math.random() * 0.6), p.z + Math.sin(a) * d, 0, -0.2 - Math.random() * 0.3, 0, 0.35 + Math.random() * 0.25, 0.045 + Math.random() * 0.025, 0.84, 0.92, 0.96, 0.85, 0, 0, 9.8);
    }
  }
  describe() {
    const A = this.active;
    const main = A.main;
    const nm = (e) => (e.kind === 'item' ? e.it.name : e.cr.name);
    const vl = (e) => (e.kind === 'item' ? e.it.value : e.cr.value);
    // 同名伴随物合并（例如一组碎片）
    const groups = new Map();
    for (const e of A.entries) {
      if (e === main) continue;
      const k = nm(e) + (e.kind === 'live' ? '#live' : '');
      const gr = groups.get(k) || { name: nm(e), value: 0, n: 0, live: e.kind === 'live' };
      gr.value += vl(e); gr.n++;
      groups.set(k, gr);
    }
    return {
      precious: A.precious,
      title: nm(main), value: vl(main), live: main.kind === 'live',
      companions: [...groups.values()],
      total: A.value,
    };
  }
  // 展示期间：挡在镜头和清洗位之间、或站在展示台旁边的船员暂时隐去（近景里他们只会是半截巨大的身子）
  hideOccluders(on) {
    const A = this.active || this.pre, g = this.g;
    const cam = g.view.camera.position.clone();
    g.boat.deck.worldToLocal(cam);
    const w = BOAT.washLocal;
    for (const s of g.crew.hands.concat([g.crew.captain])) {
      let hide = false;
      const spraying = s.task && s.task.type === 'hose' && s.task.phase === 'spray';
      if (on && A && A.phase !== 'pull' && !spraying) {
        const ax = cam.x, az = cam.z, bx = w.x, bz = w.z;
        const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
        let t = ((s.x - ax) * dx + (s.z - az) * dz) / L2; t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(s.x - (ax + dx * t), s.z - (az + dz * t));
        // 在画面里、又比物件离镜头近的（多半是正走过来的人）：近景里只会是半截巨大的身子，藏起来
        const L = Math.sqrt(L2), along = ((s.x - ax) * dx + (s.z - az) * dz) / L, lat = Math.abs((s.x - ax) * dz - (s.z - az) * dx) / L;
        const front = along < L - 0.7 && lat < along * 0.75 + 0.6;
        // 珍贵的一网：站在后面（镜头对侧）看的人留在画里欢呼，只藏挡在镜头前面的；普通的一网：凑过来看的冲洗手留在画里（B18）
        const peer = s.task && s.task.peer;
        hide = (d < 0.85 && t < 0.92) || Math.hypot(s.x - ax, s.z - az) < 2.2 || front || (A.phase === 'show' && !A.precious && !peer && Math.hypot(s.x - w.x, s.z - w.z) < 2.6);
      }
      s.g.visible = !hide;
    }
    // 水槽挡在镜头前时也暂时隐去
    const tm = g.boat.tankMesh;
    if (tm) {
      let hide = false;
      if (on && A && A.phase !== 'pull') {
        const T = BOAT.tankLocal;
        const ax = cam.x, az = cam.z, dx = w.x - ax, dz = w.z - az, L2 = dx * dx + dz * dz || 1;
        let t = ((T.x - ax) * dx + (T.z - az) * dz) / L2; t = Math.max(0, Math.min(1, t));
        hide = Math.hypot(T.x - (ax + dx * t), T.z - (az + dz * t)) < 1.0 && t < 0.9;
      }
      tm.visible = !hide;
      for (const t of g.tank || []) t.mesh.visible = !hide;
    }
  }
  pullBack() {
    const A = this.active, g = this.g;
    A.phase = 'pull'; A.t = 0;
    if (A.precious) this.clearBurst();
    g.hud && g.hud.hideReveal();
    g.hud && g.hud.setRevealMode(false);
    if (A.main.it) A.main.it.body.material.userData.u.uGlow.value = 0;
    this.hideOccluders(false);
    // 结果卡收到右边，等玩家点了（或按 C / Ⓑ）才收起；晚一拍再发（见 update 的拉回阶段）
    const d = this.describe();
    A.cardDue = { kind: 'catch', precious: d.precious, live: d.live, title: d.title, total: d.total };
    // 镜头往回拉的这 1.25 秒里：船长挥手、冲洗手点头都等镜头到了大视野再做（B19）
    g.crew.quietUntil = g.crew.t + TIMING.pull + 0.1;
    fxTag('B19', '拉回大视野');
    const slot = g.freeSlots(1)[0] || [0.3, -6.9];
    for (const e of A.entries) {
      const m = e.mesh;
      const lp = new THREE.Vector3(); m.getWorldPosition(lp); g.boat.deck.worldToLocal(lp);
      const q0 = m.quaternion.clone();
      A.bundle.remove(m); g.boat.deck.add(m);
      if (e === A.main) {
        // 主件从展示台上平稳放回甲板一侧（躺回它在海底时的样子），落稳之前船员不来抱
        m.position.set(slot[0], BOAT.deckY + 0.02, slot[1]);
        g.addDeckCargo(e, m);
        m.position.copy(lp); m.quaternion.copy(q0);
        m.userData.settling = true;
        A.settle = { m, p0: lp.clone(), q0, p1: new THREE.Vector3(slot[0], BOAT.deckY + 0.02, slot[1]), q1: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), A.restYaw || 0) };
      } else {
        m.position.set(lp.x, BOAT.deckY + 0.02, lp.z);
        g.addDeckCargo(e, m);
      }
    }
    g.onRevealPullBack && g.onRevealPullBack();
  }
  dealCard() {
    const A = this.active, g = this.g;
    const c = A.cardDue; A.cardDue = null;
    g.addCard && g.addCard(c);
  }
  updateSettle() {
    const A = this.active, S = A && A.settle;
    if (!S) return;
    const k = Math.min(1, A.t / 0.6), q = k * k * (3 - 2 * k);
    S.m.position.lerpVectors(S.p0, S.p1, q);
    S.m.position.y += Math.sin(k * Math.PI) * 0.15;
    S.m.quaternion.copy(S.q0).slerp(S.q1, q);
    if (k >= 1) { S.m.userData.settling = false; A.settle = null; }
  }
  finish() {
    const A = this.active, g = this.g;
    if (A.cardDue) this.dealCard();
    if (A.settle) { A.t = 1; this.updateSettle(); }
    g.boat.deck.remove(A.bundle);
    this.wfx.end(A);
    A.shell.geometry.dispose(); A.extraMesh.geometry.dispose(); A.coreMesh.geometry.dispose();
    if (A.coreMain) { A.coreMain.geometry.dispose(); A.coreMain.material.dispose(); }
    if (A.tollRing) { A.tollRing.geometry.dispose(); A.tollRing.material.dispose(); }
    for (const s of this.stains) if (s.mesh === A.stain) s.life = 14;
    this.active = null;
    g.view.post.uniforms.uFlash.value = 0;
    g.view.post.uniforms.uHalo.value.w = 0;
    if (A.precious) this.clearBurst(A);
    this.hideOccluders(false);
  }
  // 近景镜头：从船舷一侧横看清洗位（与作业镜头同侧），揭晓时推近主件，主件偏左、卡片在右
  cameraPose(out, look) {
    const A = this.active || this.pre;
    const w = BOAT.washLocal;
    const show = A && A.phase === 'show';
    const k = show ? easeOut(Math.min(1, A.t / 0.7)) : 0;
    const mainR = A ? rOf(A.main) : 0.3;
    // 网包越大退得越远：锚那样的大包整团都在画里，冲洗手的头也不被切掉
    // 珍品憋住的那 1.5 秒：镜头慢慢推近一成
    // 普通的一网：水冲开第一件东西的那一角时，镜头也轻轻凑过去一点（B13）
    const push = A && A.precious ? (A.holdK || 0) : A ? easeInOut(A.peekCam || 0) * 1.5 : 0;
    const washDist = Math.max(4.7, (A ? A.R : 0.45) * 3.3 + 2.4) * (1 - 0.1 * push), washH = 2.5 * washDist / 4.7 * (1 - 0.05 * push);
    // 大件（锚等）按实际尺寸退远一些，整件都在画面左半边
    const showDist = Math.max(1.9 + (A && A.nComp ? 1.1 + Math.min(A.nComp, 4) * 0.4 : 0), Math.min(mainR > 0.6 ? 7.2 : 3.8, mainR * (mainR > 0.6 ? 5.2 : 4.2) + 1.3)) * (A && A.precious ? 0.95 : 1);
    let a = A ? A.camSide : Math.PI / 2;
    // 普通的一网（B18）：确认后 0.4 秒内走到 layout 算好的落点（整排在画面左半边的中间；跟随的弹簧再滞后一点，约 0.6 秒停稳），之后一动不动
    if (show && A.frame) {
      const F = A.frame, q = smoothRange(A.t, 0, 0.4);
      const d = washDist + (F.dist - washDist) * q, h = washH + (F.hgt - washH) * q, lat = F.lat * q;
      out.set(w.x + Math.sin(a) * d, BOAT.deckY + h, w.z + Math.cos(a) * d);
      look.set(w.x + Math.cos(a) * lat, BOAT.deckY + 0.5 + (F.ly - 0.5) * q, w.z - Math.sin(a) * lat);
      this.g.boat.deck.localToWorld(out); this.g.boat.deck.localToWorld(look);
      return;
    }
    let dist = washDist + (showDist - washDist) * k;
    let hgt = washH + (showDist * 0.6 - washH) * k;
    // 珍品展示（C7）：确认那一下是近景；随后镜头慢慢退开、抬高，把物件后面围着欢呼的船员整个收进画里，
    // 同时绕着它慢慢转一小段（约 24°，整个 3.2 秒，起落都是缓的），往船尾那边绕（避开驾驶室、吊臂）
    const crowd = show && A.precious ? smoothRange(A.t, 0.3, 1.25) : 0; // 第一个人跳起来时就开始退，欢呼传到最后一个人时四个人都在画里
    const orb = show && A.precious ? smoothRange(A.t, 0.3, TIMING.showP) : 0;
    dist += 1.35 * crowd; hgt += 0.55 * crowd; a += Math.sign(a || 1) * 0.42 * orb;
    out.set(w.x + Math.sin(a) * dist, BOAT.deckY + hgt, w.z + Math.cos(a) * dist);
    const ly = (show && A.main.mesh ? A.main.mesh.position.y + mainR * 0.3 : 0.5) + 0.62 * crowd;
    // 主件放在画面偏左，给右侧结果卡让位
    const shift = dist * (mainR > 0.6 ? 0.4 : 0.3) * k;
    look.set(w.x + Math.cos(a) * shift, BOAT.deckY + ly - 0.12 * k, w.z - Math.sin(a) * shift);
    this.g.boat.deck.localToWorld(out); this.g.boat.deck.localToWorld(look);
  }
}

// 镜头所在的船舷：限制在左右舷 ±25° 范围内（避开驾驶室、吊臂和船尾栏杆的遮挡）
function sideOf(g) {
  const a = ((g.cam.yaw - g.boat.heading) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  const s = a >= 0 ? 1 : -1;
  const b = Math.abs(a);
  return s * Math.max(Math.PI / 2 - 0.3, Math.min(Math.PI / 2 + 0.45, b));
}
function rOf(e) { return e.kind === 'item' ? e.it.r : e.cr.r || 0.25; }
// 主角是最值钱的那件（珍贵优先），其余按体积
function sortEntries(entries) {
  const valOf = (e) => (e.kind === 'item' ? e.it.value + (e.it.precious ? 1e5 : 0) : e.cr.value);
  return entries.slice().sort((a, b) => valOf(b) - valOf(a) || rOf(b) - rOf(a));
}
// 网包外壳的半径：和 begin 里摆法一样（主件在中间，其余按黄金角绕一圈），不建网格就能算（镜头提前到位用）
function bundleR(sorted) {
  let ringR = 0, R = 0.3;
  sorted.forEach((e, i) => {
    const r = rOf(e);
    let x = 0, z = 0;
    if (i > 0) { const a = i * 2.39996; ringR = Math.max(ringR, rOf(sorted[0]) * 0.75 + r * 0.8); x = Math.cos(a) * ringR; z = Math.sin(a) * ringR; }
    R = Math.max(R, Math.hypot(x, z) + r * 0.95);
  });
  return Math.max(0.45, R * 1.04 + 0.14);
}
function smoothRange(x, a, b) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t) { return t * t * (3 - 2 * t); }
function worldOf(boat, x, y, z) { const v = new THREE.Vector3(x, y, z); boat.deck.localToWorld(v); return [v.x, v.y, v.z]; }
