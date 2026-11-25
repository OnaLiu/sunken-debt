import * as THREE from 'three';
import { toon, cloneMud } from '../render/materials.js';
import { GeoBuilder } from '../util/builder.js';
import { mulberry32, clamp } from '../util/math.js';
import { setItemMud } from '../world/items.js';

// 一网上来的“泥团”：厚泥壳 + 旧网绳 + 海草 + 碎壳，里面是真正兜到的东西（保持在水下时的朝向）。
let BID = 0;
export class Bundle {
  constructor(items, opts = {}) {
    this.id = ++BID;
    this.items = items;
    this.crab = opts.crab || null;
    this.group = new THREE.Group();
    this.group.name = 'bundle';
    const rnd = mulberry32(this.id * 97 + 13);
    this.rnd = rnd;

    // —— 摆放：大的在中间，其余绕一圈 ——
    const sorted = [...items].sort((a, b) => b.r - a.r);
    let R = 0.35;
    const placed = [];
    sorted.forEach((it, k) => {
      let x = 0, z = 0;
      if (k > 0) {
        const a = k * 2.4 + rnd() * 0.5;
        const d = Math.min(0.75, (sorted[0].r * 0.6 + it.r * 0.6));
        x = Math.cos(a) * d;
        z = Math.sin(a) * d;
      }
      placed.push({ it, x, z });
      R = Math.max(R, Math.hypot(x, z) + it.r * 0.85);
    });
    if (this.crab) R = Math.max(R, 0.45);
    R = Math.min(R + 0.12, 1.15);
    // 珍贵物那一网：泥团大一圈（预兆）
    if (items.some((i) => i.def.precious)) R *= 1.2;
    this.R = R;

    this.inner = new THREE.Group();
    this.group.add(this.inner);
    for (const p of placed) {
      const g = p.it.model.group;
      // 保留在海底时的姿态（只去掉位置）
      const q = g.quaternion.clone();
      g.position.set(p.x, 0, p.z);
      g.quaternion.copy(q);
      this.inner.add(g);
      // 躺着的东西：最低点贴到网底
      this.inner.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(g);
      g.position.y = 0.01 - bb.min.y;
      setItemMud(p.it.model, 1.0, 0.045);
      p.it.state = 'bundle';
    }
    if (this.crab) {
      this.inner.add(this.crab.group);
      this.crab.group.position.set(R * 0.45, 0.08, -R * 0.2);
      this.crab.group.rotation.set(0.3, rnd() * 6, 0.2);
    }

    // —— 泥壳 ——
    const geo = new THREE.IcosahedronGeometry(1, 3);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    const lumpSeed = rnd() * 100;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 3.1 + lumpSeed) * Math.sin(v.y * 2.7 + lumpSeed * 0.7) * Math.sin(v.z * 3.3 - lumpSeed);
      const n2 = Math.sin(v.x * 7.3 + lumpSeed * 1.3) * Math.sin(v.z * 6.1 + v.y * 5.2);
      const s = 1 + n * 0.16 + n2 * 0.06;
      v.multiplyScalar(s);
      v.y = v.y < 0 ? v.y * 0.35 : v.y * 0.82;
      pos.setXYZ(i, v.x * R, v.y * R + R * 0.28, v.z * R);
    }
    geo.computeVertexNormals();
    this.shellMat = toon({ color: 0xffffff, dissolve: true, side: THREE.DoubleSide, spec: 0.3, shin: 14, mud: { amount: 1.0, inflate: 0.0, seed: rnd() * 30, scale: 3.0, color: 0x4b3f2e, crust: 1.0 } });
    // 泥壳是十几块有厚度的壳拼成的：冲洗前段一块块崩下来、顺着网包滑到甲板上摊开
    this.shell = new THREE.Group();
    this.group.add(this.shell);
    this.plates = this.buildPlates(geo, R, rnd);

    // —— 外面挂着的旧网绳、海草、壳 ——
    const db = new GeoBuilder();
    const ropeC = new THREE.Color(0.25, 0.27, 0.22);
    for (let k = 0; k < 7; k++) {
      const a0 = rnd() * Math.PI * 2, a1 = a0 + 1.2 + rnd() * 1.6;
      let prev = null;
      for (let i = 0; i <= 8; i++) {
        const a = a0 + (a1 - a0) * (i / 8);
        const el = 0.25 + Math.sin((i / 8) * Math.PI) * 0.5 + (k % 3) * 0.12;
        const p = new THREE.Vector3(Math.cos(a) * Math.cos(el) * R * 1.03, Math.sin(el) * R * 0.86 + R * 0.28, Math.sin(a) * Math.cos(el) * R * 1.03);
        if (prev) db.beam(prev, p, new THREE.Vector3(0, 1, 0), 0.035, 0.035, ropeC);
        prev = p;
      }
    }
    const weedC = new THREE.Color(0.36, 0.48, 0.24);
    for (let k = 0; k < 6; k++) {
      const a = rnd() * Math.PI * 2;
      const base = new THREE.Vector3(Math.cos(a) * R * 0.95, R * 0.4 + rnd() * R * 0.3, Math.sin(a) * R * 0.95);
      const dir = new THREE.Vector3(Math.cos(a) * 0.5, -0.8, Math.sin(a) * 0.5).normalize();
      let prev = base;
      for (let i = 1; i <= 4; i++) {
        const p = base.clone().addScaledVector(dir, i * 0.12).add(new THREE.Vector3(Math.sin(i + k) * 0.04, 0, Math.cos(i * 1.3 + k) * 0.04));
        db.beam(prev, p, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), 0.07, 0.015, weedC.clone().multiplyScalar(0.9 + rnd() * 0.25));
        prev = p;
      }
    }
    for (let k = 0; k < 10; k++) {
      const a = rnd() * Math.PI * 2, el = rnd() * 1.1;
      const p = new THREE.Vector3(Math.cos(a) * Math.cos(el) * R * 1.0, Math.sin(el) * R * 0.82 + R * 0.28, Math.sin(a) * Math.cos(el) * R * 1.0);
      db.box(p, new THREE.Vector3(0.05, 0, 0.02), new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(-0.02, 0, 0.05), new THREE.Color(0.86, 0.82, 0.72));
    }
    this.debrisMat = toon({ vertexColors: true, dissolve: true });
    this.debrisMat.uniforms.uDissolveSeed.value = this.shellMat.uniforms.uDissolveSeed.value;
    this.debris = new THREE.Mesh(db.build(), this.debrisMat);
    this.debris.castShadow = true;
    this.group.add(this.debris);

    this.heavy = items.some((i) => i.def.heavy);
    this.precious = items.some((i) => i.def.precious);
    this.empty = items.length === 0 && !this.crab;
    this.wiggle = 0;
  }

  buildPlates(geo, R, rnd) {
    const pos = geo.attributes.position, nor = geo.attributes.normal;
    const C = new THREE.Vector3(0, R * 0.28, 0);
    const K = Math.round(7 + R * 6);
    const seeds = [];
    for (let i = 0; i < K; i++) {
      const y = 1 - ((i + 0.5) / K) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996 + rnd() * 0.7;
      seeds.push(new THREE.Vector3(Math.cos(a) * r, y + (rnd() - 0.5) * 0.2, Math.sin(a) * r).normalize());
    }
    const tris = seeds.map(() => []);
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
    for (let t = 0; t < pos.count / 3; t++) {
      va.fromBufferAttribute(pos, t * 3).add(vb.fromBufferAttribute(pos, t * 3 + 1)).add(vc.fromBufferAttribute(pos, t * 3 + 2)).divideScalar(3).sub(C);
      // 块的边界抖一抖，不是规整的多边形
      va.x += Math.sin(va.y * 9 + va.z * 5) * 0.08 * R;
      va.normalize();
      let best = 0, bd = -2;
      for (let k = 0; k < K; k++) { const d = va.dot(seeds[k]); if (d > bd) { bd = d; best = k; } }
      tris[best].push(t);
    }
    const thick = 0.1 + R * 0.12;
    const key = (v) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    const inward = (v) => v.clone().sub(C).normalize().multiplyScalar(-thick).add(v);
    const plates = [];
    for (const list of tris) {
      if (!list.length) continue;
      const P = [], N = [];
      const tri = (a, b, c, n) => {
        P.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
        if (n) N.push(...n);
        else {
          const fn = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
          for (let i = 0; i < 3; i++) N.push(fn.x, fn.y, fn.z);
        }
      };
      const edges = new Map();
      const cen = new THREE.Vector3();
      let lowest = 1e9;
      for (const t of list) {
        const v = [0, 1, 2].map((i) => new THREE.Vector3().fromBufferAttribute(pos, t * 3 + i));
        const n = [0, 1, 2].map((i) => new THREE.Vector3().fromBufferAttribute(nor, t * 3 + i));
        tri(v[0], v[1], v[2], [n[0].x, n[0].y, n[0].z, n[1].x, n[1].y, n[1].z, n[2].x, n[2].y, n[2].z]);
        const w = v.map(inward);
        tri(w[0], w[2], w[1]);
        for (let i = 0; i < 3; i++) {
          const a = v[i], b = v[(i + 1) % 3];
          const ka = key(a), kb = key(b);
          const k = ka < kb ? ka + '|' + kb : kb + '|' + ka;
          const e = edges.get(k);
          if (e) e.n++;
          else edges.set(k, { n: 1, a, b, wa: w[i], wb: w[(i + 1) % 3] });
        }
        cen.add(v[0]).add(v[1]).add(v[2]);
        lowest = Math.min(lowest, v[0].y, v[1].y, v[2].y);
      }
      // 块的断面：只在块的边上补
      for (const e of edges.values()) {
        if (e.n !== 1) continue;
        tri(e.b, e.a, e.wa);
        tri(e.b, e.wa, e.wb);
      }
      cen.divideScalar(list.length * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      const mat = cloneMud(this.shellMat);
      const mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = true;
      // 绕块自己的中心转：外面套一层，网格本身不动（泥纹用的局部坐标不变，块和块之间对得上）
      const pivot = new THREE.Group();
      pivot.position.copy(cen);
      mesh.position.copy(cen).negate();
      pivot.add(mesh);
      this.shell.add(pivot);
      const out = cen.clone().sub(C);
      out.y *= 0.4;
      out.normalize();
      plates.push({ pivot, mesh, mat, cen: cen.clone(), out, low: lowest, h: cen.y, state: 'on', v: new THREE.Vector3(), av: new THREE.Vector3(), t: 0, k: 1 });
    }
    // 先上面后下面，带一点乱（冲洗开始时 schedule() 再按近景镜头看过去挡住多少重排）
    const order = plates.map((p) => ({ p, s: -p.h / R + rnd() * 0.55 })).sort((a, b) => a.s - b.s).map((o) => o.p);
    order.forEach((p, i) => { p.at = 0.035 + (i / Math.max(1, order.length - 1)) * 0.36 + (rnd() - 0.5) * 0.02; });
    return order;
  }

  // 冲洗的排法（用户：「冲开外面的泥是期待；形状已经确定了还要等冲干净，就是惩罚」）：
  // 从近景镜头看过去，先崩挡得少的（背面、边上），再一块块崩挡着东西的，挡得最多的留到最后；
  // 东西露出来够看清形状的那一块一崩，就揭晓（剩下的壳一下崩飞），不再等冲干净。
  // 每件东西取朝着镜头的一些表面点，看每一点被哪几块壳挡着；那几块都崩了，这一点就露出来了。
  // cam：近景镜头（世界坐标）。from、to：排到的块在冲洗进度的哪一段崩
  schedule(cam, from = 0.04, to = 0.84) {
    this.group.updateMatrixWorld(true);
    const things = this.items.map((it) => ({ g: it.model.group, precious: !!it.def.precious }));
    if (this.crab) things.push({ g: this.crab.group, precious: false });
    const pts = [];
    const tmp = new THREE.Vector3(), nrm = new THREE.Vector3(), toCam = new THREE.Vector3();
    things.forEach((th, ti) => {
      const raw = [];
      th.g.traverse((o) => {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || o.visible === false) return;
        const pa = o.geometry.attributes.position, na = o.geometry.attributes.normal;
        const nm = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
        const step = Math.max(1, Math.floor(pa.count / 90));
        for (let i = 0; i < pa.count; i += step) {
          tmp.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
          if (na) {
            nrm.fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
            if (nrm.dot(toCam.subVectors(cam, tmp)) <= 0) continue;
          }
          raw.push(tmp.clone());
        }
      });
      // 每件最多 70 个点，均匀地取
      const k = Math.max(1, Math.ceil(raw.length / 70));
      for (let i = 0; i < raw.length; i += k) pts.push({ p: raw[i], ti, by: [] });
    });
    // 空网：看的是网包底下那一摊（看见里面只有泥，就知道是空的）
    if (!things.length) {
      for (let i = 0; i < 24; i++) {
        const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 24) * this.R * 0.55;
        pts.push({ p: this.group.localToWorld(new THREE.Vector3(Math.cos(a) * r, 0.05, Math.sin(a) * r)), ti: 0, by: [] });
      }
      things.push({ g: null, precious: false });
    }
    // 一点被哪几块挡着：从镜头往这一点打一条线
    const ray = new THREE.Raycaster();
    const meshes = this.plates.map((p) => p.mesh);
    for (const P of pts) {
      const d = toCam.subVectors(P.p, cam);
      const len = d.length();
      ray.set(cam, d.divideScalar(len));
      ray.far = len - 0.005;
      const seen = new Set();
      for (const h of ray.intersectObjects(meshes, false)) seen.add(h.object);
      P.by = this.plates.filter((p) => seen.has(p.mesh));
    }
    this.expPts = pts;
    this.expN = things.map((_, ti) => pts.filter((P) => P.ti === ti).length || 1);
    this.expMain = things.findIndex((t) => t.precious);
    // 一拍一拍地排：每一拍崩一块（或者挨着的两块一起崩——很多地方是前后两块一起挡着，单崩一块什么也看不见），
    // 每一拍都要让玩家看见点新的：一线金属、一段弧面；挑镜头看得见的那面、多露得少一点的，
    // 不让哪一件先露过一半（一件先看清了，等别的就是干等）；最后一拍才让人看清是什么。
    // 什么也露不出来的块不排，揭晓时跟着剩下的壳一起崩飞
    const left = new Set(this.plates);
    const camL = this.group.worldToLocal(cam.clone());
    const facing = (p) => p.cen.clone().sub(new THREE.Vector3(0, this.R * 0.28, 0)).normalize().dot(camL.clone().sub(p.cen).normalize());
    const expo = (gone) => things.map((_, ti) => {
      let n = 0, m = 0;
      for (const P of pts) if (P.ti === ti) { m++; if (P.by.every((b) => gone.has(b))) n++; }
      return m ? n / m : 1;
    });
    const sum = (e) => e.reduce((a, b) => a + b, 0);
    const gone = new Set();
    this.revealAt = null;
    let cur = expo(gone);
    const beats = [];
    const tryset = (set) => {
      for (const p of set) gone.add(p);
      const e = expo(gone);
      for (const p of set) gone.delete(p);
      const d = sum(e) - sum(cur);
      const over = e.reduce((a, x) => a + Math.max(0, x - 0.45), 0);
      const vis = set.reduce((a, p) => a + facing(p), 0) / set.length;
      return { set, e, d, det: this.determined(e), s: d + over * 2 - vis * 0.2 - set.length * 0.01 };
    };
    // 一拍至少多露出四成里的一成（合起来平均多 4%）：看得出「又露出来一块」
    const minGain = 0.04 * things.length;
    while (left.size) {
      const L = [...left];
      let pick = null;
      // 一块就能露出点新的、又还看不清：挑露得最少的
      for (const p of L) { const r = tryset([p]); if (!r.det && r.d >= minGain && (!pick || r.s < pick.s)) pick = r; }
      // 单崩哪块都露不出来：两块一起崩
      if (!pick) for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const r = tryset([L[i], L[j]]); if (!r.det && r.d >= minGain && (!pick || r.s < pick.s)) pick = r; }
      // 再崩哪儿都会让人看清了：这就是最后一拍（挑露得最多的那一下，看得最清楚）
      if (!pick) {
        let fin = null;
        for (const p of L) { const r = tryset([p]); if (r.det && (!fin || r.d > fin.d)) fin = r; }
        if (!fin) for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const r = tryset([L[i], L[j]]); if (r.det && (!fin || r.d > fin.d)) fin = r; }
        if (!fin) fin = tryset(L);
        pick = fin;
      }
      for (const p of pick.set) { left.delete(p); gone.add(p); }
      // 一拍里先崩看得见的那块
      beats.push(pick.set.sort((x, y) => facing(y) - facing(x)));
      cur = pick.e;
      if (pick.det) break;
    }
    // 珍贵物：冲到约三分之一时，先露出匣子顶上那一角（露头）——把第一拍让匣子多露出来一块的挪到那儿
    this.peekBeat = null;
    if (this.expMain >= 0) {
      const e0 = expo(new Set())[this.expMain];
      const g2 = new Set();
      let first = -1;
      for (let i = 0; i < beats.length; i++) {
        for (const p of beats[i]) g2.add(p);
        if (expo(g2)[this.expMain] > e0 + 0.04) { first = i; break; }
      }
      const want = Math.max(1, Math.round(beats.length * 0.36));
      if (first > want && first < beats.length - 1) { beats.splice(want, 0, beats.splice(first, 1)[0]); first = want; }
      if (first >= 0 && first < beats.length - 1) this.peekBeat = beats[first];
    }
    // 拍子在 from—to 里均匀摆开；一拍里两块隔 0.03（零点一秒左右）
    const nb = beats.length;
    const order = [];
    beats.forEach((bt, i) => bt.forEach((p, j) => { p.at = from + (nb > 1 ? i / (nb - 1) : 1) * (to - from) - (bt.length - 1 - j) * 0.03; order.push(p); }));
    const n = order.length;
    for (const p of this.plates) if (!order.includes(p)) p.at = Infinity;
    this.beats = beats;
    this.peekAt = this.peekBeat ? Math.max(...this.peekBeat.map((p) => p.at)) : null;
    this.lastPlate = order[n - 1];
    this.revealAt = to;
    this.schedOrder = order;
    return order;
  }

  // 看得清是什么了：每件东西都露出一半以上、合起来六成以上（空网：网包底下那一摊露出一半）
  determined(e) {
    if (!this.items.length && !this.crab) return e[0] >= 0.5;
    return e.every((x) => x >= 0.5) && e.reduce((a, b) => a + b, 0) / e.length >= 0.6;
  }

  // 现在每件东西露出来几成（从排冲洗时的近景镜头看）
  exposure() {
    if (!this.expPts) return [];
    const n = this.expN.map(() => 0);
    for (const P of this.expPts) if (P.by.every((b) => b.state !== 'on')) n[P.ti]++;
    return n.map((v, i) => v / this.expN[i]);
  }

  // 揭晓那一下：还挂着的泥壳一下崩飞（往外、往上，打着转），甩在甲板上
  burst() {
    for (const p of this.plates) {
      // 还挂着的、正往下掉的、刚摔在甲板上的，一起崩飞碎掉（看清的那一刻，东西四周什么都不挡）
      if (p.state === 'gone') continue;
      if (p.state === 'rest') p.pivot.scale.set(1, 1, 1);
      p.state = 'fall';
      p.t = 0;
      // 往外、贴着甲板低低地飞（不往上扑到镜头前挡住东西），边飞边碎成泥块
      const sp = 2.2 + this.rnd() * 1.4;
      p.v.copy(p.out).setY(0).normalize().multiplyScalar(sp);
      p.v.y = 0.4 + this.rnd() * 0.7;
      const ax = new THREE.Vector3(0, 1, 0).cross(p.out).normalize();
      p.av.copy(ax).multiplyScalar(-(4 + this.rnd() * 5));
      p.burst = true;
    }
    this.cracked = true;
  }

  // 冲洗进度 w（0..1）推着泥壳：到点的块先抖一下，崩开，顺着网包滑下去，摔在甲板上摊开、慢慢化掉。
  // onBreak(plate, worldPos)：每崩一块回调一次（声音、碎泥）
  washPlates(w, dt, onBreak) {
    this.shT = (this.shT || 0) + dt;
    let next = null;
    for (const p of this.plates) {
      if (p.state === 'on') {
        if (w >= p.at) {
          p.state = 'fall';
          this.cracked = true;
          p.t = 0;
          const sp = 0.35 + this.rnd() * 0.35;
          p.v.copy(p.out).multiplyScalar(sp);
          p.v.y = p.h > this.R * 0.5 ? 0.35 : 0.05;
          // 绕切线往外翻（像一块泥皮从上往下剥开）
          const ax = new THREE.Vector3(0, 1, 0).cross(p.out).normalize();
          p.av.copy(ax).multiplyScalar(-(1.6 + this.rnd() * 1.6));
          if (onBreak) onBreak(p, p.pivot.getWorldPosition(new THREE.Vector3()));
        } else {
          if (!next || p.at < next.at) next = p;
          // 快崩的那一块先抖：水正打在它上面
          const pre = clamp((w - (p.at - 0.03)) / 0.03, 0, 1);
          p.pivot.position.copy(p.cen).addScaledVector(p.out, Math.sin(this.shT * 47) * 0.014 * pre + pre * 0.025);
        }
      } else if (p.state === 'fall') {
        p.t += dt;
        // 揭晓时崩飞的：一出手就碎，0.3 秒缩没（碎块、泥点由 reveal 那边撒）
        if (p.burst) {
          const k = Math.max(0, 1 - p.t / 0.26);
          p.pivot.scale.setScalar(Math.max(0.01, k * k * (3 - 2 * k)));
          if (k <= 0) { p.state = 'gone'; p.pivot.visible = false; continue; }
        }
        p.v.y -= 9.8 * dt;
        p.pivot.position.addScaledVector(p.v, dt);
        p.pivot.rotation.x += p.av.x * dt;
        p.pivot.rotation.y += p.av.y * dt;
        p.pivot.rotation.z += p.av.z * dt;
        // 贴着网包往下滑：别穿进网包里面（揭晓时崩飞的不贴，直接飞出去）
        const rel = p.pivot.position.clone().sub(new THREE.Vector3(0, this.R * 0.28, 0));
        const rr = Math.hypot(rel.x, rel.z);
        const minR = this.R * 0.95 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, rel.y) / (this.R * 0.82), 2)));
        if (!p.burst && rr < minR && rr > 0.001) { p.pivot.position.x *= minR / rr; p.pivot.position.z *= minR / rr; }
        const bottom = p.pivot.position.y - (p.cen.y - p.low) * 0.6;
        // 崩飞的碰到甲板：贴着甲板擦出去、接着碎，不躺下来
        if (p.burst && bottom <= 0.0) {
          p.pivot.position.y -= bottom;
          p.v.y = Math.abs(p.v.y) * 0.2;
          p.v.x *= 0.75;
          p.v.z *= 0.75;
        } else if (bottom <= 0.0) {
          p.pivot.position.y -= bottom;
          p.state = 'rest';
          p.t = 0;
          p.impact = Math.abs(p.v.y);
          p.v.set(0, 0, 0);
          if (onBreak) onBreak(p, p.pivot.getWorldPosition(new THREE.Vector3()), true);
        }
      } else if (p.state === 'rest') {
        // 摔扁、摊开、被水冲着慢慢化掉
        p.t += dt;
        const sq = Math.min(1, p.t / 0.1);
        p.pivot.scale.set(1 + sq * 0.3, Math.max(0.15, 1 - sq * 0.5 - p.t * 0.6), 1 + sq * 0.3);
        p.mat.uniforms.uDissolve.value = clamp((p.t - 0.08) / 0.55, 0, 1);
        if (p.t > 0.7) { p.state = 'gone'; p.pivot.visible = false; }
      }
    }
    return next;
  }

  setDissolve(d) {
    this.shellMat.uniforms.uDissolve.value = d;
    this.debrisMat.uniforms.uDissolve.value = Math.min(1, d * 1.6);
    for (const p of this.plates) if (p.state === 'on') p.mat.uniforms.uDissolve.value = d;
    this.shell.visible = d < 0.99;
    this.debris.visible = d < 0.62;
  }

  // 网绳一根根松开：冲洗前段按进度化掉
  setDebris(d) {
    this.debrisMat.uniforms.uDissolve.value = d;
    this.debris.visible = d < 0.99;
  }

  update(dt, t) {
    if (this.crab) {
      // 网里挣动；第一只活物（loud）挣得更狠：隔一会儿猛顶一下，泥壳朝一边鼓、整团一跳
      this.wiggle += dt;
      let j = Math.max(0, Math.sin(this.wiggle * 9) * Math.sin(this.wiggle * 2.3)) * (this.loud ? 0.05 : 0.035);
      let e = 0;
      if (this.loud) {
        this.jabT = (this.jabT ?? 0.35) - dt;
        if (this.jabT <= 0) {
          this.jabT = 0.7 + this.rnd() * 0.55;
          this.jab = 1;
          this.jabA = this.rnd() * Math.PI * 2;
          if (this.onJab && !this.cracked) this.onJab(this.jabA);
        }
        this.jab = Math.max(0, (this.jab || 0) - dt * 3.4);
        e = Math.sin(Math.min(1, (1 - this.jab) * 5) * Math.PI / 2) * this.jab;
      }
      // 泥壳开始裂了就不再整团晃（碎片自己往下掉）
      if (this.cracked) { j = 0; e = 0; }
      const ca = Math.cos(this.jabA || 0), sa = Math.sin(this.jabA || 0), R = this.R;
      this.shell.scale.set(1 + j + e * 0.07, 1 - j * 0.6 - e * 0.06, 1 + j * 0.5 + e * 0.07);
      this.shell.position.set(ca * e * 0.08 * R, e * 0.06 * R, sa * e * 0.08 * R);
      this.shell.rotation.set(sa * e * 0.24, 0, -ca * e * 0.24);
      this.crab.animateStruggle(dt, t);
    }
  }
}
