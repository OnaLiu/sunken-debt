// 打捞船：船体、驾驶室、伸缩吊臂、舱口、清洗位、活体水槽；航行与燃油
import * as THREE from 'three';
import { basicWaterMat } from '../render/materials.js';
import { buildLook, craneGeos, tankGeo, tankWater, attachCraneLook, animateLook, flexAngles } from './boatlook.js';
import { heightAt } from '../world/layout.js';
import { clamp, angDiff, lerp } from '../core/noise.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const BOAT = {
  maxSpeed: 9.5, revSpeed: 3.2, accel: 2.6, turnRate: 0.62,
  // 油箱：认真捞完这一处（机器人全清约用 36：作业约 23、开船约 13）还略有余，不用来卡人
  fuelPerMeter: 0.042, fuelCap: 60,
  reachMin: 4.2, reachMax: 12.6,
  craneLocal: V(0, 1.55, -0.9),
  deckY: 1.32,
  washLocal: V(0.9, 1.32, -6.0),
  hatchLocal: V(0, 1.32, -3.25),
  tankLocal: V(-1.15, 1.32, -6.0),
  hullHalfL: 7.6, hullHalfW: 2.9,
};

export function opFuelFor(depth) { return 1.6 + 0.085 * Math.max(0, depth); }

export class Boat {
  constructor() {
    this.root = new THREE.Group(); this.root.name = 'boat';
    this.bob = new THREE.Group(); this.root.add(this.bob);
    this.deck = new THREE.Group(); this.bob.add(this.deck); // 甲板局部（船员、货物挂在这里）
    this.x = 0; this.z = 0; this.heading = 0; this.speed = 0; this.turn = 0;
    this.fuel = BOAT.fuelCap;
    this.throttle = 0; this.steer = 0;
    this.locked = false;
    this.buildModel();
    // 吊臂状态
    this.craneYaw = Math.PI * 0.75; this.craneReach = 5.0;
    this.targetYaw = this.craneYaw; this.targetReach = this.craneReach;
    this.parkYaw = Math.PI; this.parkReach = 4.6;
    this.tmp = new THREE.Vector3();
    // 吊着的分量（B10）：0 空钩 … 1 一只铁锚出了水。吊臂按它往下弯、船身往吊臂那边歪；
    // 实际的弯跟着一根有点弹的弹簧走（一吃上劲先沉过头、弹两下才稳），droopY / droopOut 是臂端因此往下、往外走了多少米
    this.loadWant = 0.08; this.loadVis = 0.08; this.loadV = 0;
    this.droopY = 0; this.droopOut = 0;
    // 吊着重东西（珍品那一网，C4，见 omen.js）：吊臂弯多少、船往哪边歪、整体沉多少；臂端因此偏了多少（dx、dz 世界水平，ty 竖直）
    this.strain = { bend: 0, roll: 0, pitch: 0, sink: 0, dx: 0, dz: 0, ty: 0, drop: 0, on: false };
  }
  buildModel() {
    const P = { L: 15.2, B: 5.8, D: 2.55, sternLen: 0.12, transom: 0.82, bowStart: 0.56, bowExp: 1.6, forefoot: 0.45, sheerAft: 0.15, sheerFore: 1.0, keelW: 0.16, bilge: 0.36, secExp: 0.6, tumble: 0.02, deckFrac: 0.97,
      wood: 0x2c4850, wood2: 0x325660, dark: 0x1b2629, deckWood: 0xa68c62, masts: [], wales: [0.6, 0.93], rudder: true, NV: 10, seed: 1 };
    // 船壳＋平甲板（板缝、走道、水线、锈迹都在着色里）、甲板上一件件的东西、驾驶室；造型都在 boatlook.js
    const L = this.look = buildLook(P, BOAT);
    this.bob.add(L.hull, L.deckMesh, ...L.extras);
    this.washing = false; // 外部可设：正在冲洗（水管卷转起来）；也可以每帧从 updateVisual 的第二个参数传进来
    // 活体水槽（单独的网格：揭宝近景时挡镜头可以暂时隐去）
    this.tankMesh = new THREE.Mesh(tankGeo(BOAT.tankLocal), L.mat);
    this.tankMesh.castShadow = true; this.tankMesh.receiveShadow = true;
    this.tankMesh.add(tankWater(BOAT.tankLocal)); // 挂在水槽上：揭宝近景暂时隐去水槽时，水一起隐去
    this.bob.add(this.tankMesh);

    // 吊臂：转台 → 俯仰 → 三节伸缩
    const cz = BOAT.craneLocal, cg = craneGeos(), mat = L.mat;
    this.craneYawNode = new THREE.Group(); this.craneYawNode.position.copy(cz); this.bob.add(this.craneYawNode);
    const turret = new THREE.Mesh(cg.turret, mat); turret.castShadow = true; turret.receiveShadow = true;
    this.craneYawNode.add(turret);
    this.boomNode = new THREE.Group(); this.boomNode.position.set(0, 1.5, 0.3); this.craneYawNode.add(this.boomNode);
    this.boomNode.rotation.x = -0.14;
    this.luff = 0.6; this.luffTarget = 0.6; this.parked = false;
    this.luffFx = 0; // 表现用：吊臂在仰角之外再往下点一下（弧度；下网那一下“一沉”），缆绳和网跟着臂端走
    this.sec0 = new THREE.Mesh(cg.sec0, mat); this.sec1 = new THREE.Mesh(cg.sec1, mat); this.sec2 = new THREE.Mesh(cg.sec2, mat);
    for (const s of [this.sec0, this.sec1, this.sec2]) { s.castShadow = true; s.receiveShadow = true; this.boomNode.add(s); }
    // 工作灯
    this.lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), basicWaterMat(0xfff0b0, { key: 'lamp' }));
    this.boomNode.add(this.lamp);
    this.tipNode = new THREE.Group(); this.boomNode.add(this.tipNode);
    attachCraneLook(L, this); // 液压油缸、钢缆、吊钩滑轮（逐帧在 animateLook 里摆）
  }

  // 臂端在世界中的水平位置（按现在的转角和臂长时，算上吊臂被压弯往外走的那一点）
  tipWorld(out = new THREE.Vector3(), yaw = this.craneYaw, reach = this.craneReach) {
    const cz = BOAT.craneLocal;
    if (yaw === this.craneYaw && reach === this.craneReach) reach += this.droopOut;
    const lx = cz.x + Math.sin(yaw) * reach, lz = cz.z + Math.cos(yaw) * reach;
    const c = Math.cos(this.heading), s = Math.sin(this.heading);
    out.set(this.x + lx * c + lz * s, 0, this.z - lx * s + lz * c);
    // 现在的臂端（没指定转角、臂长）：吊着重东西船歪了、臂弯了，臂端跟着偏
    if (arguments.length < 2 && this.strain.on) { out.x += this.strain.dx; out.z += this.strain.dz; }
    return out;
  }
  localToWorld2(lx, lz) {
    const c = Math.cos(this.heading), s = Math.sin(this.heading);
    return [this.x + lx * c + lz * s, this.z - lx * s + lz * c];
  }
  worldToLocal2(x, z) {
    const dx = x - this.x, dz = z - this.z;
    const c = Math.cos(this.heading), s = Math.sin(this.heading);
    return [dx * c - dz * s, dx * s + dz * c];
  }
  // 世界目标 → 吊臂(yaw, reach)，返回限制信息
  solveTarget(x, z) {
    const [lx, lz] = this.worldToLocal2(x, z);
    const cz = BOAT.craneLocal;
    const dx = lx - cz.x, dz = lz - cz.z;
    let reach = Math.hypot(dx, dz);
    let yaw = Math.atan2(dx, dz);
    let limit = null;
    if (reach > BOAT.reachMax) { reach = BOAT.reachMax; limit = 'max'; }
    if (reach < BOAT.reachMin) { reach = BOAT.reachMin; limit = 'min'; }
    // 驾驶室扇区（船首方向 ±38°）不能越过
    const fwd = angDiff(0, yaw);
    if (Math.abs(fwd) < 0.66) { yaw = Math.sign(fwd || 1) * 0.66; limit = limit || 'cabin'; }
    return { yaw, reach, limit };
  }
  // 臂端是否在自己船体上方（不能把网落在甲板上）
  overOwnHull(x, z) {
    const [lx, lz] = this.worldToLocal2(x, z);
    const w = lz > 3 ? BOAT.hullHalfW * Math.max(0.3, 1 - (lz - 3) / 5) : BOAT.hullHalfW;
    return Math.abs(lx) < w + 1.0 && lz > -BOAT.hullHalfL - 1.0 && lz < BOAT.hullHalfL + 0.5;
  }
  update(dt, ctl) {
    // 操船
    if (!this.locked) {
      // 燃油见底：发动机停了，船只能滑停（这一趟随之结束）
      const vmax = this.fuel > 0 ? BOAT.maxSpeed : 0;
      const tgt = ctl.throttle >= 0 ? ctl.throttle * vmax : ctl.throttle * Math.min(BOAT.revSpeed, vmax);
      const a = BOAT.accel * (Math.abs(tgt) > Math.abs(this.speed) ? 1 : 1.4);
      this.speed += clamp(tgt - this.speed, -a * dt, a * dt);
      const tr = BOAT.turnRate * (0.35 + 0.65 * Math.min(1, Math.abs(this.speed) / 4)) * Math.sign(this.speed >= -0.1 ? 1 : -1);
      this.turn = lerp(this.turn, ctl.steer * tr, 1 - Math.exp(-dt * 4));
    } else {
      this.speed *= Math.exp(-dt * 1.6);
      if (Math.abs(this.speed) < 0.02) this.speed = 0;
      this.turn *= Math.exp(-dt * 4);
    }
    if (ctl.brake) { this.speed *= Math.exp(-dt * 2.5); if (Math.abs(this.speed) < 0.05) this.speed = 0; }
    this.heading += this.turn * dt;
    const nx = this.x + Math.sin(this.heading) * this.speed * dt;
    const nz = this.z + Math.cos(this.heading) * this.speed * dt;
    // 搁浅检查：前缘水深不足 1.7 m 则停
    const px = nx + Math.sin(this.heading) * Math.sign(this.speed) * 7.5, pz = nz + Math.cos(this.heading) * Math.sign(this.speed) * 7.5;
    const top = this.surfaceAt || heightAt;
    // 撞上去那一刻的船速记在 impact 里（主控读走后清零，做 W3 的那一下）
    if (top(px, pz) > -1.7 || top(nx, nz) > -1.7) { if (!this.impact) this.impact = this.speed; this.speed *= -0.15; this.grounded = 1.2; }
    else {
      const d = Math.hypot(nx - this.x, nz - this.z);
      this.x = nx; this.z = nz;
      if (d > 0) this.fuel = Math.max(0, this.fuel - d * BOAT.fuelPerMeter);
    }
    if (this.grounded) this.grounded = Math.max(0, this.grounded - dt);
    // 吊臂随目标转动、伸缩（机械速度）
    const yr = 1.1, er = 3.4;
    // 转台不能扫过驾驶室：换到另一舷时从船尾绕过去
    let dy = angDiff(this.craneYaw, this.targetYaw);
    const c0 = angDiff(0, this.craneYaw), c1 = angDiff(0, this.targetYaw);
    if (Math.sign(c0) !== Math.sign(c1) && Math.abs(c0) < Math.PI - 0.01 && Math.abs(c1) < Math.PI - 0.01 && Math.sign(dy) === Math.sign(c1) && Math.abs(c0) + Math.abs(c1) < Math.PI) dy -= Math.sign(dy) * Math.PI * 2;
    this.craneYaw += clamp(dy, -yr * dt, yr * dt);
    this.craneReach += clamp(this.targetReach - this.craneReach, -er * dt, er * dt);
    // 俯仰：臂越短仰得越高；收起航行时整根臂高高仰起，网悬在船员头顶以上
    const want = this.luffWant();
    this.luff += clamp(want - this.luff, -0.5 * dt, 0.5 * dt);
    this.craneMoving = !this.craneSettled();
    // 吊臂上的分量：有点弹的弹簧（约 1.3 次每秒、两下就稳）
    if (dt > 0) { this.loadV += (70 * (this.loadWant - this.loadVis) - 7 * this.loadV) * dt; this.loadVis += this.loadV * dt; }
  }
  // luffHi：揭晓近景里网包放下以后，吊臂整根仰起来，网高高地从镜头上方转回去（B12：不从近景前面扫过）
  luffWant(reach = this.craneReach) { const w = this.parked ? 0.8 : 0.6 - 0.46 * clamp((reach - BOAT.reachMin) / (BOAT.reachMax - BOAT.reachMin), 0, 1); return this.luffHi ? Math.max(w, this.luffHi) : w; }
  // 到位：按“现在的”目标实时判断（以前用上一帧算出的结果，目标刚换的那一帧会被当成到位，网落在旧位置上）。
  // 转台和伸缩都按机械速度正好停在目标上，所以容差可以很小：1 毫弧度、1 毫米
  craneSettled() { return Math.abs(angDiff(this.craneYaw, this.targetYaw)) <= 1e-3 && Math.abs(this.targetReach - this.craneReach) <= 1e-3 && Math.abs(this.luffWant() - this.luff) <= 0.01; }
  // 臂伸到 reach 时臂端的高度（不含船身起伏）：用来预先算网悬在哪、沉到底要几秒
  tipHeightAt(reach) { return BOAT.craneLocal.y + 1.5 + Math.tan(this.luffWant(reach)) * reach - 0.2; }
  // 吊臂转到、伸到目标还要几秒（按同样的机械速度；换舷时从船尾绕过去）
  craneEta(tYaw = this.targetYaw, tReach = this.targetReach) {
    let dy = angDiff(this.craneYaw, tYaw);
    const c0 = angDiff(0, this.craneYaw), c1 = angDiff(0, tYaw);
    if (Math.sign(c0) !== Math.sign(c1) && Math.abs(c0) < Math.PI - 0.01 && Math.abs(c1) < Math.PI - 0.01 && Math.sign(dy) === Math.sign(c1) && Math.abs(c0) + Math.abs(c1) < Math.PI) dy -= Math.sign(dy) * Math.PI * 2;
    const want = this.luffWant(tReach);
    return Math.max(Math.abs(dy) / 1.1, Math.abs(tReach - this.craneReach) / 3.4, Math.abs(want - this.luff) / 0.5);
  }
  // 重东西砸到甲板上：船身一沉（a 米），压在哪一侧就往哪一侧歪一点，再晃两下回来（只是表现）
  dip(a, lx = 0, lz = 0) { this.dipFx = { a, lx, lz, t0: null }; }
  // 船底冲上沙（W3）：撞的那一头往上一抬（a 弧度，dir 1 船头 / −1 船尾），身子往上一拱、往一边歪一点，再落回去晃两下（只是表现）
  lurch(a, dir = 1) { this.lurchFx = { a, dir, roll: (Math.random() < 0.5 ? -1 : 1) * a * 0.35, t0: null }; }
  // 吊索被底下猛地一拽（W5）：吊臂臂端往下一点头（a 弧度），弹回来再颤两下（只是表现；臂端高度跟着走，缆不脱节）
  yank(a) { this.yankFx = { a, t0: null }; }
  // vis（可选）：{ washing } 正在冲洗，水管卷转起来；不传就看 this.washing
  updateVisual(t, vis) {
    this.root.position.set(this.x, 0, this.z);
    this.root.rotation.set(0, this.heading, 0);
    const sp = Math.abs(this.speed);
    let dy = 0, dpx = 0, dpz = 0;
    const D = this.dipFx;
    if (D) {
      if (D.t0 == null) D.t0 = t;
      const u = t - D.t0;
      // 一下压下去（约 0.07 秒到底），弹回来再晃两下，1.5 秒左右稳住
      const e = (1 - Math.exp(-u / 0.045)) * Math.exp(-u * 2.4) * Math.cos(u * 6.8);
      dy = -D.a * e; dpx = -D.a * 0.12 * e * Math.sign(-D.lz || 1); dpz = -D.a * 0.1 * e * Math.sign(D.lx || 1);
      if (u > 2.2) this.dipFx = null;
    }
    const Lf = this.lurchFx;
    if (Lf) {
      if (Lf.t0 == null) Lf.t0 = t;
      const u = t - Lf.t0;
      // 0.14 秒抬到顶（冲上沙脊），然后落回、晃两下，约 1.8 秒稳住
      const e = u < 0.14 ? Math.sin(u / 0.14 * Math.PI / 2) : Math.exp(-(u - 0.14) * 2.6) * Math.cos((u - 0.14) * 7.5);
      dpx -= Lf.dir * Lf.a * e; dpz += Lf.roll * e; dy += Lf.a * 1.6 * Math.max(0, e);
      if (u > 2.4) this.lurchFx = null;
    }
    // 吊着东西（B10）：船身往吊臂那一侧歪、整条船往下吃一点水（越沉越多）
    const lv = Math.max(0, this.loadVis), hr = Math.min(1, this.craneReach / BOAT.reachMax);
    dy -= 0.05 * lv; dpz -= 0.034 * lv * Math.sin(this.craneYaw) * hr; dpx += 0.014 * lv * Math.cos(this.craneYaw) * hr;
    const S = this.strain; // 珍品那一网（C4）：再往吊臂那边歪、沉一点
    // loadSink：舱里越满吃水越深（A6，keep.js）
    this.bob.position.y = Math.sin(t * 1.3) * 0.06 + Math.sin(t * 0.7 + 1) * 0.04 + dy + S.sink - (this.loadSink || 0);
    // trimFx：船推水（A1，wake.js）——推油门船头抬、船头压浪往下一点；只转不升降，臂端高度不受影响
    this.bob.rotation.set(Math.sin(t * 0.9) * 0.012 - sp * 0.004 + dpx + S.pitch + (this.trimFx || 0), 0, Math.sin(t * 1.1 + 0.5) * 0.018 - this.turn * sp * 0.02 + dpz + S.roll);
    this.craneYawNode.rotation.y = this.craneYaw;
    // 臂长：沿俯仰后的轴线
    const pitch = this.luff - this.luffFx; // luffFx：下网那一下吊臂往下点一下（B4）
    // 吊索被底下猛地一拽（W5）：臂根往下点一下头，弹回来再颤两下
    let yk = 0;
    const Y = this.yankFx;
    if (Y) {
      if (Y.t0 == null) Y.t0 = t;
      const u = t - Y.t0;
      yk = Y.a * (1 - Math.exp(-u / 0.03)) * Math.exp(-u * 3.2) * Math.cos(u * 15);
      if (u > 1.6) { this.yankFx = null; yk = 0; }
    }
    this.yankDy = -Math.sin(yk) * this.craneReach;
    // 压弯（B10）：臂根往下沉一点，第二、三节在套接处再各往下折一点
    const lw = Math.max(0, this.loadVis), d0 = 0.04 * lw, d1 = 0.016 * lw, d2 = 0.02 * lw;
    const L = this.craneReach / Math.cos(pitch) - 0.3;
    const ext = Math.max(0, L - 4.3);
    const e1 = Math.min(ext, 4.0), e2 = Math.max(0, ext - 4.0);
    const z1 = 4.3 + e1, z2 = 4.3 + e1 + e2 + 0.3;
    // 吊着珍品（C4，omen.js 给 S.bend）：整根臂在根部再多垂一点，每一节在套口处再往下折一点；
    // 几样加在一起，每一节的折角不超过“里面套着的那截不顶穿外面那节”的限度
    const [c0, c1, c2] = flexAngles(e1, e2, S.bend);
    const m1 = 0.055 / Math.max(0.4, 4.4 - e1), m2 = 0.05 / Math.max(0.4, 4.5 - e2);
    const D0 = d0 + c0, D1 = clamp(d1 + c1, -m1, Math.max(m1, d1)), D2 = clamp(d2 + c2, -m2, Math.max(m2, d2));
    this.boomNode.rotation.x = -pitch + D0 + yk;
    // 臂端在臂坐标里（臂根再垂 r、第一节折 b1、第二节再折 b2）→ 转台坐标里的高度和水平伸出
    const tipAt = (r, b1, b2) => {
      const y1 = -Math.sin(b1) * (z1 - 4.3), zz1 = 4.3 + Math.cos(b1) * (z1 - 4.3);
      const a2 = b1 + b2, y2 = y1 - Math.sin(a2) * (z2 - z1), zz2 = zz1 + Math.cos(a2) * (z2 - z1);
      const ty = y2 - 0.2 * Math.cos(a2), tz = zz2 - 0.2 * Math.sin(a2), ph = -pitch + r;
      return { y1, zz1, a2, y2, zz2, ty, tz, wy: ty * Math.cos(ph) - tz * Math.sin(ph), wz: ty * Math.sin(ph) + tz * Math.cos(ph) };
    };
    const f = tipAt(D0, D1, D2);
    this.sec1.position.set(0, f.y1, f.zz1); this.sec1.rotation.x = D1;
    this.sec2.position.set(0, f.y2, f.zz2); this.sec2.rotation.x = f.a2;
    this.tipNode.position.set(0, f.ty, f.tz);
    this.lamp.position.set(0, f.y2 - 0.35 * Math.cos(f.a2) + 0.2 * Math.sin(f.a2), f.zz2 - 0.2 * Math.cos(f.a2) - 0.35 * Math.sin(f.a2));
    // 臂端因此往下、往外走了多少（没压弯时 vs 压弯后）：分量压的那一份（B10）算进臂端高度和位置，网跟着走；
    // 珍品多弯的那一份（C4）记在 strain.drop，只算进看得见的臂端（tipHeightVis），网升多高、什么时候转回来不变
    const n = tipAt(0, 0, 0), w = tipAt(d0, d1, d2);
    this.droopY = n.wy - w.wy; this.droopOut = w.wz - n.wz;
    S.drop = w.wy - f.wy;
    this.boomBend = D0 + f.a2;
    animateLook(this.look, this, t, vis); // 雷达、小旗、舷灯、水管卷、吊钩、马灯、油缸、钢缆、尾部热气（吊钩、油缸、钢缆跟着压弯后的臂端、臂根走）
  }
  // 臂端高度（规则用：网升到哪儿停、什么时候转回来）——算上分量压弯的那一点（B10）、被底下一拽的点头（W5）和下网那一下的一沉（B4），缆绳和网跟着臂端走；
  // 不算珍品那一网额外的弯和歪（C4：珍品那一网和普通一网一样快），也不算舱里越满吃得越深（A6，只是表现）
  tipHeight() { return BOAT.craneLocal.y + 1.5 + Math.tan(this.luff - this.luffFx) * this.craneReach + this.bob.position.y - this.strain.sink + (this.loadSink || 0) - 0.2 - this.droopY + (this.yankDy || 0); }
  // 看得见的臂端高度：算上弯、歪（钢缆、网挂在这儿）
  tipHeightVis() { return this.tipHeight() + (this.strain.on ? this.strain.ty : 0); }
}
