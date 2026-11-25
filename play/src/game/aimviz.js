// 网口足迹：在网架会停住的那一层（触底面）画一个平圆 + 臂端垂直引线；贴地的虚线圈只作补充。
// 看得见的部分是实线（参与遮挡），被沉船等挡住的部分只剩淡虚线。表达物理覆盖，不显示“必中”。
// 引线上的小方块是测深绳的秒结：离触底还剩几秒就有几块，网下去以后一秒过一块。
// 网架搁在高处时，网兜垂不到的低处在海底画红点（和闭网判定用的是同一批采样点）。
// 吊臂推到头（臂长、驾驶室扇区）时，水面上画出臂够得着的边。
// 网口压到埋着的硬物（W4）时，圈上朝它的那一段变红。
// 移动落点时（B3）：贴地的虚线圈亮起来、变实（平地上也画）；红点一呼一吸；吊臂转到位那一下网口圈一亮、放大一点再收回。
import * as THREE from 'three';
import { NET_R } from './net.js';
import { BOAT } from './boat.js';

const N = 56, MAXK = 24, MAXLOW = 200, NARC = 40, NHZ = 24;
const RED = new THREE.Color(0xff5a3a), WHITE = new THREE.Color(0xffffff);
function loop(n) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; }
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function pts(n) { const g = loop(n); g.setDrawRange(0, 0); return g; }

export class AimViz {
  constructor(overlay, scene) {
    this.group = new THREE.Group(); overlay.add(this.group);
    this.sgroup = new THREE.Group(); (scene || overlay).add(this.sgroup);
    // 触底层平圆：场景内（被遮挡）实线
    this.flatMat = new THREE.LineBasicMaterial({ color: 0xdff4ee, transparent: true, opacity: 0.95, depthWrite: false });
    this.flat = new THREE.LineLoop(loop(N), this.flatMat); this.flat.frustumCulled = false; this.flat.renderOrder = 6;
    this.sgroup.add(this.flat);
    // 同一圈的“透视”淡虚线（被挡住时仍知道在哪）
    this.ghostMat = new THREE.LineDashedMaterial({ color: 0xdff4ee, dashSize: 0.22, gapSize: 0.22, depthTest: false, transparent: true, opacity: 0.32 });
    this.ghost = new THREE.LineLoop(loop(N), this.ghostMat); this.ghost.frustumCulled = false;
    this.group.add(this.ghost);
    // 贴着实际表面的虚线（看出高低不平）；网兜垂不到的那几段是红的
    this.surfMat = new THREE.LineDashedMaterial({ color: 0xffffff, vertexColors: true, dashSize: 0.12, gapSize: 0.16, transparent: true, opacity: 0.6, depthWrite: false });
    const sg = loop(N); sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.surf = new THREE.LineLoop(sg, this.surfMat); this.surf.frustumCulled = false;
    this.sgroup.add(this.surf);
    // 网兜垂不到的低处：海底红点
    this.lowMat = new THREE.PointsMaterial({ color: RED, size: 3, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false });
    this.low = new THREE.Points(pts(MAXLOW), this.lowMat); this.low.frustumCulled = false; this.low.renderOrder = 7;
    this.sgroup.add(this.low);
    // 垂直引线：水面以上实线、以下虚线
    this.lineMat = new THREE.LineDashedMaterial({ color: 0xdff4ee, dashSize: 0.5, gapSize: 0.35, depthTest: false, transparent: true, opacity: 0.5 });
    this.line = new THREE.Line(loop(2), this.lineMat); this.line.frustumCulled = false;
    this.group.add(this.line);
    // 秒结：深色底 + 亮色小方块（亮沙地上也看得见）
    this.knotBack = new THREE.Points(pts(MAXK), new THREE.PointsMaterial({ color: 0x061012, size: 7, sizeAttenuation: false, depthTest: false, transparent: true, opacity: 0.85 }));
    this.knotMat = new THREE.PointsMaterial({ color: 0xdff4ee, size: 4, sizeAttenuation: false, depthTest: false, transparent: true });
    this.knots = new THREE.Points(this.knotBack.geometry, this.knotMat);
    for (const k of [this.knotBack, this.knots]) { k.frustumCulled = false; this.group.add(k); }
    this.knotBack.renderOrder = 8; this.knots.renderOrder = 9;
    this.cross = new THREE.LineSegments(loop(4), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }));
    this.cross.frustumCulled = false;
    this.sgroup.add(this.cross);
    // 吊臂够得着的边（推到头时出现）：水面上的虚线弧，或驾驶室扇区的两条边
    this.arcMat = new THREE.LineDashedMaterial({ color: 0xffc65a, dashSize: 0.4, gapSize: 0.3, depthTest: false, transparent: true, opacity: 0.85 });
    this.arc = new THREE.Line(pts(NARC), this.arcMat); this.arc.frustumCulled = false;
    this.group.add(this.arc);
    // 网口压到埋着的硬物（W4）：圈上朝它的那一段变红（两道，看着粗一点）
    this.hzMat = new THREE.LineBasicMaterial({ color: RED, depthTest: false, transparent: true, opacity: 0.95 });
    this.hz = [0, 1].map(() => { const l = new THREE.Line(pts(NHZ), this.hzMat); l.frustumCulled = false; l.renderOrder = 10; this.group.add(l); return l; });
    this.group.visible = false; this.sgroup.visible = false;
    this.arcA = 0;
  }
  // F1 隐藏界面（D4）：网口圈、引线、红点和别的界面一起在 0.3 秒里淡掉，再按淡回来（以前一下子没了）
  update(game) {
    const now = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, now - (this.hudT ?? now))); this.hudT = now;
    this.hudK = Math.max(0, Math.min(1, (this.hudK ?? 1) + (game.hudHidden ? -dt : dt) / 0.3));
    this.paint(game);
    if (this.group.visible) this.fadeAll(this.hudK);
  }
  // 每种材质的透明度乘上 k（这一帧 paint 改过的按新值算，没改过的按原来的算）
  fadeAll(k) {
    if (!this.mats) { const set = new Set(); for (const g of [this.group, this.sgroup]) g.traverse((o) => { if (o.material) set.add(o.material); }); this.mats = [...set]; }
    for (const m of this.mats) {
      const u = m.userData;
      if (u.fo === undefined || m.opacity !== u.fo) u.fb = m.opacity;
      m.opacity = u.fb * k; u.fo = m.opacity;
    }
  }
  paint(game) {
    if (this.sgroup.parent !== game.view.scene) game.view.scene.add(this.sgroup);
    const op = game.op;
    // 网在下放、闭网时：还画着网口圈和剩下的秒结（看着它一秒一秒落下去，活物照常在动）
    const sinking = !!op && (op.state === 'lowering' || op.state === 'closing');
    const show = game.mode === 'work' && (!op || sinking) && !(game.reveal.busy && game.reveal.active.phase !== 'pull') && !game.ended && this.hudK > 0.01;
    this.group.visible = show; this.sgroup.visible = show;
    if (!show || !game.est) return;
    const boat = game.boat;
    const cx = sinking ? op.x : game.aim.x, cz = sinking ? op.z : game.aim.z;
    const est = sinking ? op.est : game.est;
    const T = sinking ? op.T : est.T;
    const colr = sinking ? 0xdff4ee : !est.ok ? 0xff6a4a : est.issues.length ? 0xffc65a : 0xdff4ee;
    for (const m of [this.flatMat, this.ghostMat, this.lineMat, this.knotMat]) m.color.setHex(colr);
    const base = this.flatMat.color;
    // 移动落点：停手 0.6 秒内算“在动”；吊臂到位：0.35 秒里网口圈一亮、放大一点再收回
    const A = game.findFx && !sinking ? game.findFx.aim : null;
    const active = !!A && A.still < 0.6;
    const lk = A ? clamp01((game.time - A.lockT) / 0.35) : 1, flash = (1 - lk) * (1 - lk);
    const RR = NET_R * (1 + 0.08 * flash);
    const fp = this.flat.geometry.attributes.position, gp = this.ghost.geometry.attributes.position, sp = this.surf.geometry.attributes.position, sc = this.surf.geometry.attributes.color;
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2;
      const x = cx + Math.cos(a) * RR, z = cz + Math.sin(a) * RR;
      fp.setXYZ(i, x, T + 0.06, z);
      gp.setXYZ(i, x, T + 0.06, z);
      const h = game.world.surfaceTop(cx + Math.cos(a) * NET_R, cz + Math.sin(a) * NET_R);
      sp.setXYZ(i, cx + Math.cos(a) * NET_R, h + 0.05, cz + Math.sin(a) * NET_R);
      const c = h < T - 1.3 ? RED : base;
      sc.setXYZ(i, c.r, c.g, c.b);
    }
    fp.needsUpdate = true; gp.needsUpdate = true; sp.needsUpdate = true; sc.needsUpdate = true;
    this.ghost.computeLineDistances(); this.surf.computeLineDistances();
    this.surf.visible = !sinking && (est.unevenness > 0.25 || active);
    this.surfMat.opacity = active ? 0.95 : 0.6; this.surfMat.gapSize = active ? 0.08 : 0.16;
    if (flash > 0.001) this.flatMat.color.lerp(WHITE, 0.7 * flash);
    this.ghostMat.opacity = 0.32 + 0.4 * flash;
    // 红点一呼一吸（大一点，远处也看得见）
    this.lowMat.size = 4 + 1.6 * Math.sin(game.time * 6.5) ** 2; this.lowMat.opacity = 0.75 + 0.25 * Math.sin(game.time * 6.5) ** 2;
    // 网兜垂不到的低处
    const lp0 = this.low.geometry.attributes.position, L = sinking ? [] : est.low || [];
    const nl = Math.min(MAXLOW, L.length / 3);
    for (let i = 0; i < nl; i++) lp0.setXYZ(i, L[i * 3], L[i * 3 + 1] + 0.06, L[i * 3 + 2]);
    lp0.needsUpdate = true; this.low.geometry.setDrawRange(0, nl);
    // 引线：作业时从臂端到触底面；网下去以后从网兜底到触底面
    const top = sinking ? op.y - 1.05 : boat.tipHeight();
    const lp = this.line.geometry.attributes.position;
    lp.setXYZ(0, cx, top, cz); lp.setXYZ(1, cx, T, cz); lp.needsUpdate = true;
    this.line.computeLineDistances();
    this.line.visible = top > T + 0.05;
    // 秒结
    const ks = (game.sink && game.sink.knots) || [];
    const kp = this.knots.geometry.attributes.position;
    let nk = 0;
    for (let i = 0; i < ks.length && nk < MAXK; i++) if (ks[i] < top - 0.05) kp.setXYZ(nk++, cx, ks[i], cz);
    kp.needsUpdate = true; this.knots.geometry.setDrawRange(0, nk);
    // 压到硬物：朝它的那一段（±55°）变红；刚压上那一下红段从中间往两边张开
    const H = !sinking && game.hazAim && game.hazAim.level === 2 && game.hazAim.o ? game.hazAim : null;
    for (const l of this.hz) l.visible = !!H;
    if (H) {
      const a0 = Math.atan2(H.o.z - cz, H.o.x - cx), open = Math.min(1, (game.time - H.t) / 0.18) * 0.96;
      this.hz.forEach((l, j) => {
        const hp = l.geometry.attributes.position, r = NET_R - j * 0.07;
        for (let i = 0; i < NHZ; i++) { const a = a0 + (i / (NHZ - 1) - 0.5) * 2 * open; hp.setXYZ(i, cx + Math.cos(a) * r, T + 0.08, cz + Math.sin(a) * r); }
        hp.needsUpdate = true; l.geometry.setDrawRange(0, NHZ);
      });
    }
    const s = 0.35, y = T + 0.07;
    const cp = this.cross.geometry.attributes.position;
    cp.setXYZ(0, cx - s, y, cz); cp.setXYZ(1, cx + s, y, cz); cp.setXYZ(2, cx, y, cz - s); cp.setXYZ(3, cx, y, cz + s);
    cp.needsUpdate = true;
    // 吊臂推到头：臂长的弧，或驾驶室扇区的两条边（推的时候出现，停手一会儿淡去）
    const lim = !sinking && game.limitPush && game.time - game.limitPush.t < 1.6 ? game.limitPush.kind : null;
    this.arc.visible = !!lim;
    if (lim) {
      const ap = this.arc.geometry.attributes.position, c0 = BOAT.craneLocal;
      let n = 0;
      const put = (lx, lz) => { const [wx, wz] = boat.localToWorld2(lx, lz); ap.setXYZ(n++, wx, 0.12, wz); };
      if (lim === 'cabin') {
        // 驾驶室前方 ±38° 转不过去：画出扇区的两条边（从转台向外）
        for (const sgn of [-1, 1]) for (let i = 0; i < NARC / 2; i++) { const r = sgn < 0 ? BOAT.reachMax * (1 - i / (NARC / 2 - 1)) : BOAT.reachMax * i / (NARC / 2 - 1); put(c0.x + Math.sin(sgn * 0.66) * r, c0.z + Math.cos(sgn * 0.66) * r); }
      } else {
        const R = lim === 'max' ? BOAT.reachMax : BOAT.reachMin;
        const [lx, lz] = boat.worldToLocal2(cx, cz);
        const a0 = Math.atan2(lx - c0.x, lz - c0.z);
        for (let i = 0; i < NARC; i++) { const a = a0 + (i / (NARC - 1) - 0.5) * (lim === 'max' ? 0.9 : 1.6); put(c0.x + Math.sin(a) * R, c0.z + Math.cos(a) * R); }
      }
      ap.needsUpdate = true; this.arc.geometry.setDrawRange(0, n);
      this.arc.computeLineDistances();
    }
  }
}
