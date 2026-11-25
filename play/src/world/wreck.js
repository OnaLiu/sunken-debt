// 中世纪西方木船造船器：弯曲船壳（逐列木板）、龙骨与首尾柱、外露肋骨、甲板与舱口、首尾楼、断桅与残索。
// 船体局部坐标：x 右舷，y 上，z 船首。所有破口来自参数化遮罩，之后整体摆放沉没姿态。
import * as THREE from 'three';
import { Builder, rod, box, cyl, col, M, shade } from '../core/geo.js';
import { noise2, smooth, clamp, lerp } from '../core/noise.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function hullFrame(P) {
  const L = P.L, B = P.B, D = P.D;
  const plan = (s) => {
    let w = 1;
    if (s < P.sternLen) { const t = s / P.sternLen; w = P.transom + (1 - P.transom) * (1 - (1 - t) * (1 - t)); }
    if (s > P.bowStart) { const t = (s - P.bowStart) / (1 - P.bowStart); w *= Math.pow(Math.max(0, 1 - Math.pow(t, P.bowExp)), 0.62); }
    return Math.max(w, 0.0);
  };
  const keelY = (s) => D * P.forefoot * Math.pow(smooth(P.bowStart + 0.1, 1.0, s), 2) + D * 0.1 * (1 - smooth(0, 0.12, s));
  const topY = (s) => D + P.sheerAft * Math.pow(1 - smooth(0, 0.45, s), 1.6) + P.sheerFore * Math.pow(smooth(0.6, 1.0, s), 1.6);
  const sec = (v) => {
    const a = P.keelW + (1 - P.keelW) * Math.pow(Math.sin(Math.min(v / P.bilge, 1) * Math.PI / 2), P.secExp);
    const t = v > 0.7 ? Math.pow((v - 0.7) / 0.3, 2) : 0;
    return a * (1 - P.tumble * t);
  };
  // v 可 >1（首尾楼向上延伸，按 tumble 继续收窄）
  const pt = (s, v, side) => {
    const ky = keelY(s), ty = topY(s);
    const y = ky + v * (ty - ky);
    let w;
    if (v <= 1) w = sec(v);
    else w = sec(1) * (1 - 0.3 * (v - 1));
    const hw = (B / 2) * plan(s) * w;
    return V(side * hw, y, (s - 0.5) * L);
  };
  return { plan, keelY, topY, sec, pt };
}

// 主函数：返回 { geo: BufferGeometry, meta }
export function buildShip(P, rng) {
  const F = hullFrame(P);
  const b = new Builder();
  const L = P.L, B = P.B;
  const [s0, s1] = P.sRange || [0, 1];
  const NS = Math.max(8, Math.round(L * 2.2 * (s1 - s0)));
  const NV = P.NV || 12;
  const wood = col(P.wood || 0x6b5236), wood2 = col(P.wood2 || 0x7d6342), dark = col(P.dark || 0x3a2c1d);
  const plankShade = (row, seg) => {
    const n = noise2(row * 3.7 + P.seed, seg * 1.3);
    return shade(wood.clone().lerp(wood2, 0.5 + n * 0.5), 0.86 + 0.14 * ((row & 1) ? 1 : 0.88));
  };
  const holeAt = (s, v, side) => {
    for (const h of P.breaches || []) {
      if (h.side && h.side !== side) continue;
      const cs = (h.s0 + h.s1) / 2, cv = (h.v0 + h.v1) / 2;
      const rs = (h.s1 - h.s0) / 2, rv = (h.v1 - h.v0) / 2;
      const jag = noise2(s * 40 + side * 3, v * 9 + P.seed) * (h.ragged ?? 0.35);
      const d = Math.pow((s - cs) / rs, 2) + Math.pow((v - cv) / rv, 2);
      if (d < 1 + jag) return true;
    }
    // 断成两截：断口附近参差
    if (P.sRange) {
      const jag = (noise2(v * 7 + side, P.seed) * 0.5 + 0.5) * 0.06;
      if (P.sRange[0] > 0 && s < P.sRange[0] + jag) return true;
      if (P.sRange[1] < 1 && s > P.sRange[1] - jag) return true;
    }
    // 零星缺板（成段）
    if (P.missing) {
      const n = noise2(Math.floor(s * L / 1.6) * 1.7 + side * 11, Math.floor(v * NV) * 2.3 + P.seed * 0.1);
      if (n > 1 - P.missing * 2.2 && v > 0.15) return true;
    }
    if (P.oarPorts) {
      const op = P.oarPorts;
      if (Math.abs(v - op.v) < op.h && s > op.s0 && s < op.s1) {
        const k = ((s * L) / op.spacing) % 1;
        if (k > 0.35 && k < 0.65) return true;
      }
    }
    return false;
  };

  // —— 船壳木板 ——
  const vTop = (s) => {
    let v = 1;
    if (P.aft && s < P.aft.len) v = 1 + P.aft.h / P.D * (1 - smooth(P.aft.len - 0.03, P.aft.len, s));
    if (P.fore && s > 1 - P.fore.len) v = Math.max(v, 1 + P.fore.h / P.D * smooth(1 - P.fore.len, 1 - P.fore.len + 0.03, s));
    return v;
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < NS; i++) {
      const sa = s0 + (s1 - s0) * (i / NS), sb = s0 + (s1 - s0) * ((i + 1) / NS);
      const vta = vTop(sa), vtb = vTop(sb);
      const nv = Math.round(NV * Math.max(vta, vtb));
      for (let j = 0; j < nv; j++) {
        const va0 = (j / nv) * vta, va1 = ((j + 1) / nv) * vta;
        const vb0 = (j / nv) * vtb, vb1 = ((j + 1) / nv) * vtb;
        const sm = (sa + sb) / 2, vm = (va0 + va1) / 2;
        if (holeAt(sm, vm, side)) continue;
        const a = F.pt(sa, va0, side), bb = F.pt(sb, vb0, side), c = F.pt(sb, vb1, side), d = F.pt(sa, va1, side);
        let cc = plankShade(j, Math.floor(sm * L / 2.4));
        if (vm > 1.0 && P.castleCol) cc = shade(col(P.castleCol), 0.85 + 0.15 * (j & 1));
        if (side > 0) b.quad(a, bb, c, d, cc); else b.quad(a, d, c, bb, cc);
      }
    }
  }
  // 护舷木（外侧粗木条，中世纪船的典型横向线条）
  for (const wv of P.wales || [0.52, 0.8]) for (const side of [-1, 1]) {
    let prev = null;
    for (let i = 0; i <= NS; i++) {
      const s = s0 + (s1 - s0) * (i / NS);
      if (s > 0.985 || holeAt(s, wv, side)) { prev = null; continue; }
      const p = F.pt(s, wv, side); p.x += side * 0.08;
      if (prev) b.add(rod(prev, p, 0.14, 4), dark);
      prev = p;
    }
  }
  // 首尾楼与船身交界的压条
  for (const side of [-1, 1]) {
    let prev = null;
    for (let i = 0; i <= NS; i++) {
      const s = s0 + (s1 - s0) * (i / NS);
      const vt = vTop(s);
      if (s > 0.985 || holeAt(s, Math.min(vt, 1.0) - 0.02, side)) { prev = null; continue; }
      const p = F.pt(s, vt, side); p.x += side * 0.05; p.y += 0.05;
      if (prev) b.add(rod(prev, p, 0.1, 4), wood2);
      prev = p;
    }
  }
  // 方尾板 + 尾窗
  if (s0 <= 0.001 && P.transom > 0) {
    const nv = 10, vt = vTop(0);
    for (let j = 0; j < nv; j++) {
      const v0 = (j / nv) * vt, v1 = ((j + 1) / nv) * vt;
      if (v1 < 0.25) continue;
      const pl = F.pt(0, v0, -1), pr = F.pt(0, v0, 1), ql = F.pt(0, v1, -1), qr = F.pt(0, v1, 1);
      const cc = plankShade(j + 3, 99);
      b.quad(pl, ql, qr, pr, cc);
    }
    // 窗
    if (P.aft) {
      const y = F.topY(0) + P.aft.h * 0.45, z = -L / 2 - 0.04;
      for (const x of [-0.9, 0, 0.9]) b.add(box(0.55, 0.6, 0.08), dark, M(x, y, z));
      b.add(box(B * 0.55, 0.12, 0.25), wood2, M(0, y + 0.55, z - 0.05));
    }
  }

  // —— 龙骨、首尾柱 ——
  const keelPts = [];
  for (let i = 0; i <= 20; i++) {
    const s = lerp(Math.max(s0, 0.02), Math.min(s1, 0.97), i / 20);
    keelPts.push(V(0, F.keelY(s) - 0.18, (s - 0.5) * L));
  }
  for (let i = 0; i < keelPts.length - 1; i++) b.add(rod(keelPts[i], keelPts[i + 1], 0.2, 4), dark);
  if (s1 >= 0.99) {
    const stem = [];
    for (let i = 0; i <= 8; i++) { const s = lerp(0.9, 1.0, i / 8); stem.push(V(0, lerp(F.keelY(s), F.topY(s) + (P.fore ? P.fore.h : 0) + 0.6, Math.pow(i / 8, 1.3)), (s - 0.5) * L + Math.sin(i / 8 * 1.4) * 0.6)); }
    for (let i = 0; i < stem.length - 1; i++) b.add(rod(stem[i], stem[i + 1], 0.17, 4), dark);
    if (P.bowsprit) { const bl = P.bowspritLen || 4.2; const a = stem[stem.length - 2]; b.add(rod(a, V(0, a.y + bl * 0.33, a.z + bl), 0.13, 5), wood2); }
  }
  if (s0 <= 0.01) {
    b.add(rod(V(0, F.keelY(0) - 0.1, -L / 2), V(0, F.topY(0) + (P.aft ? P.aft.h : 0) + 0.3, -L / 2 - 0.5), 0.18, 4), dark);
    // 舵（残）
    if (P.rudder !== false) b.add(box(0.18, F.topY(0) * 0.8, 1.1), dark, M(0, F.topY(0) * 0.4, -L / 2 - 0.85, 0, 0, P.rudderTilt || 0.15));
  }

  // —— 肋骨（内侧，破口处伸出断头）——
  const frameStep = P.frameStep || 0.95;
  const ribCol = shade(wood, 0.8);
  for (let z = -L / 2 + 1.2; z < L / 2 - 0.6; z += frameStep) {
    const s = z / L + 0.5;
    if (s < s0 + 0.01 || s > s1 - 0.01) continue;
    for (const side of [-1, 1]) {
      let vEnd = Math.min(vTop(s), 1.0);
      // 破口处肋骨断头外露
      let brokenTop = false;
      for (const h of P.breaches || []) if ((!h.side || h.side === side) && s > h.s0 && s < h.s1 && h.v1 > 0.8) brokenTop = true;
      if (brokenTop) vEnd = 1.0 + 0.12 + (noise2(z * 3, side) * 0.5 + 0.5) * 0.25;
      const nseg = 7;
      let prev = null;
      for (let k = 0; k <= nseg; k++) {
        const v = (k / nseg) * vEnd;
        const p = F.pt(s, v, side);
        const inward = V(-Math.sign(p.x) * 0.14, 0.05, 0);
        p.add(inward);
        if (prev) b.add(rod(prev, p, 0.11, 4), ribCol);
        prev = p;
      }
    }
  }

  // —— 甲板 ——
  const meta = { hatches: [], deckY: 0, openings: [] };
  if (P.deck !== false) {
    const vd = P.deckFrac;
    const nx = 8;
    const deckHole = (s, x01) => {
      for (const h of P.deckHoles || []) {
        const jag = noise2(s * 30, x01 * 6 + P.seed) * (h.ragged ?? 0.3);
        const ds = (s - (h.s0 + h.s1) / 2) / ((h.s1 - h.s0) / 2), dx = (x01 - (h.x0 + h.x1) / 2) / ((h.x1 - h.x0) / 2);
        if (ds * ds + dx * dx < 1 + jag) return true;
      }
      for (const h of P.hatches || []) {
        if (Math.abs((s - h.s) * L) < h.l / 2 && Math.abs((x01 - 0.5) * 2 * F.pt(h.s, vd, 1).x) < h.w / 2) return true;
      }
      if (P.sRange) {
        if (P.sRange[0] > 0 && s < P.sRange[0] + 0.05) return true;
        if (P.sRange[1] < 1 && s > P.sRange[1] - 0.05) return true;
      }
      return false;
    };
    const dWood = col(P.deckWood || 0x8a7150);
    for (let i = 0; i < NS; i++) {
      const sa = s0 + (s1 - s0) * (i / NS), sb = s0 + (s1 - s0) * ((i + 1) / NS);
      if (P.aft && sb < P.aft.len) continue; // 尾楼下另有楼板
      const pa = F.pt(sa, vd, 1), pb = F.pt(sb, vd, 1);
      if (pa.x < 0.05 && pb.x < 0.05) continue;
      for (let k = 0; k < nx; k++) {
        const u0 = k / nx, u1 = (k + 1) / nx;
        if (deckHole((sa + sb) / 2, (u0 + u1) / 2)) continue;
        const A = V(lerp(-pa.x, pa.x, u0), pa.y, pa.z), Bv = V(lerp(-pb.x, pb.x, u0), pb.y, pb.z);
        const C = V(lerp(-pb.x, pb.x, u1), pb.y, pb.z), D2 = V(lerp(-pa.x, pa.x, u1), pa.y, pa.z);
        const cc = shade(dWood, 0.85 + 0.2 * (noise2(k * 5.1, Math.floor(sa * L / 3) + P.seed) * 0.5 + 0.5));
        b.quad(A, D2, C, Bv, cc);
      }
      // 横梁（每隔几格）
      if (i % 4 === 0) b.add(box(pa.x * 2 * 0.98, 0.22, 0.24), dark, M(0, pa.y - 0.2, pa.z));
    }
    // 舱口围板与翻开的舱盖
    for (const h of P.hatches || []) {
      const p = F.pt(h.s, vd, 1);
      const y = p.y + 0.15, z = p.z;
      b.add(box(h.w + 0.3, 0.32, 0.18), wood2, M(0, y, z - h.l / 2));
      b.add(box(h.w + 0.3, 0.32, 0.18), wood2, M(0, y, z + h.l / 2));
      b.add(box(0.18, 0.32, h.l), wood2, M(-h.w / 2, y, z));
      b.add(box(0.18, 0.32, h.l), wood2, M(h.w / 2, y, z));
      if (h.open) {
        // 舱盖朝外翻开，挂在一侧
        const side = h.open;
        const cover = new Builder();
        for (let k = 0; k < 5; k++) cover.add(box(h.w / 5 - 0.03, 0.1, h.l), shade(dWood, 0.9 + k * 0.03), M(-h.w / 2 + (k + 0.5) * h.w / 5, 0, 0));
        cover.add(box(h.w, 0.12, 0.16), dark, M(0, -0.08, -h.l * 0.3));
        cover.add(box(h.w, 0.12, 0.16), dark, M(0, -0.08, h.l * 0.3));
        const cg = cover.build();
        b.add(cg, null, M(side * (h.w / 2 + h.w / 2 * Math.cos(2.4)), y + h.w / 2 * Math.sin(2.4), z, 0, 0, side * 2.4));
      }
      meta.hatches.push({ s: h.s, x: 0, y: p.y, z, w: h.w, l: h.l });
    }
    meta.deckY = F.pt(0.5, vd, 1).y;
  }

  // —— 首尾楼的楼板与栏杆 ——
  const castleDeck = (sa, sb, v, roof) => {
    const n = 6, nu = 4;
    for (let i = 0; i < n; i++) {
      const s_a = lerp(sa, sb, i / n), s_b = lerp(sa, sb, (i + 1) / n);
      if (s_a < s0 || s_b > s1) continue;
      const pa = F.pt(s_a, v, 1), pb = F.pt(s_b, v, 1);
      if (pa.x < 0.05 && pb.x < 0.05) continue;
      for (let k = 0; k < nu; k++) {
        const u0 = k / nu, u1 = (k + 1) / nu;
        let hole = false;
        if (roof) for (const h of P.roofHoles || []) {
          const sm = (s_a + s_b) / 2, um = (u0 + u1) / 2;
          if (sm > h.s0 && sm < h.s1 && um > h.u0 && um < h.u1) hole = true;
        }
        if (hole) continue;
        const cc = shade(col(P.deckWood || 0x8a7150), 0.9 + ((i + k) % 2) * 0.08);
        b.quad(V(lerp(-pa.x, pa.x, u0), pa.y, pa.z), V(lerp(-pa.x, pa.x, u1), pa.y, pa.z), V(lerp(-pb.x, pb.x, u1), pb.y, pb.z), V(lerp(-pb.x, pb.x, u0), pb.y, pb.z), cc);
      }
    }
    // 栏杆柱
    for (let i = 0; i <= 6; i++) {
      const s = lerp(sa, sb, i / 6);
      if (s < s0 || s > s1) continue;
      for (const side of [-1, 1]) {
        const p = F.pt(s, v, side);
        if (Math.abs(p.x) < 0.1) continue;
        if (noise2(s * 50, side + P.seed) > 0.45) continue; // 部分栏杆已断
        b.add(box(0.12, 0.8, 0.12), wood2, M(p.x * 0.96, p.y + 0.4, p.z));
      }
    }
  };
  if (P.aft) {
    const v = vTop(0.001);
    castleDeck(0, P.aft.len, v, true);
    // 尾楼前壁与门洞
    const s = P.aft.len;
    if (s > s0 && s < s1) {
      const pd = F.pt(s, P.deckFrac, 1), pt = F.pt(s, v, 1);
      const hgt = pt.y - pd.y;
      b.add(box(pd.x * 0.75, hgt, 0.16), wood2, M(-pd.x * 0.6, pd.y + hgt / 2, pd.z));
      b.add(box(pd.x * 0.75, hgt, 0.16), wood2, M(pd.x * 0.6, pd.y + hgt / 2, pd.z));
      b.add(box(pd.x * 0.5, hgt * 0.3, 0.16), wood2, M(0, pt.y - hgt * 0.15, pd.z));
      // 楼内地板
      castleDeck(0.02, P.aft.len, P.deckFrac);
    }
    if (P.aft.gallery && s0 <= 0.01) {
      const y = F.topY(0) + P.aft.h * 0.2;
      b.add(box(B * 0.62, 0.14, 0.8), wood2, M(0, y, -L / 2 - 0.45));
      for (let x = -B * 0.28; x <= B * 0.28; x += 0.45) b.add(box(0.08, 0.7, 0.08), wood2, M(x, y + 0.4, -L / 2 - 0.8));
    }
  }
  if (P.fore) {
    const v = vTop(0.999);
    castleDeck(1 - P.fore.len, 0.985, v, true);
    const s = 1 - P.fore.len;
    if (s > s0 && s < s1) {
      const pd = F.pt(s, P.deckFrac, 1), pt = F.pt(s, v, 1);
      b.add(box(pd.x * 2, pt.y - pd.y, 0.16), wood2, M(0, (pd.y + pt.y) / 2, pd.z));
    }
  }

  // —— 桅杆（断）与残索 ——
  meta.masts = [];
  for (const m of P.masts || []) {
    if (m.s < s0 || m.s > s1) continue;
    const z = (m.s - 0.5) * L;
    const base = F.keelY(m.s) + 0.2, top = F.pt(m.s, P.deckFrac, 1).y + m.h;
    const r = m.r || 0.3;
    b.add(cyl(r * 0.9, r, top - base, 7), col(0x5e4a33), M(0, (top + base) / 2, z));
    // 断口：参差的尖
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2 + P.seed;
      const hh = 0.3 + (noise2(k * 3.1, P.seed) * 0.5 + 0.5) * 0.9;
      b.add(box(r * 0.6, hh, r * 0.5), col(0x6f5a40), M(Math.cos(a) * r * 0.5, top + hh / 2, z + Math.sin(a) * r * 0.5, 0, -a, 0.15));
    }
    // 桅箍与残索（索具向两舷）
    b.add(cyl(r * 1.25, r * 1.25, 0.2, 7), col(0x3b2e22), M(0, top - 0.6, z));
    for (const side of [-1, 1]) {
      for (let k = 0; k < (m.shrouds ?? 3); k++) {
        const sz = z - 0.6 + k * 0.6;
        const rail = F.pt(clamp(sz / L + 0.5, 0, 1), 1, side);
        const from = V(0, top - 0.5, z);
        if (noise2(k * 7.7 + side, P.seed) > 0.25) {
          // 断索：从桅顶垂下
          const dl = 2.5 + (noise2(k, side * 3) * 0.5 + 0.5) * 2.5;
          b.add(rod(from, V(side * 0.6, top - 0.5 - dl, z + (k - 1) * 0.3), 0.035, 3), col(0x2d261c));
        } else b.add(rod(from, rail, 0.035, 3), col(0x2d261c));
      }
    }
    meta.masts.push({ z, top, base });
  }

  const geo = b.build();
  return { geo, meta, frame: F };
}

// 生物附着、泥渍、结壳：按摆放后的世界法线着色
export function weatherGeometry(geo, opts, rng) {
  const p = geo.attributes.position, c = geo.attributes.color, n = geo.attributes.normal;
  const growth = col(opts.growth || 0x4f6a3a), crust = col(opts.crust || 0xe8e4d6), mud = col(opts.mud || 0x2f2a22), sand = col(opts.sandCol || 0xcbb98d);
  const tmp = new THREE.Color();
  for (let i = 0; i < p.count; i += 3) {
    const ny = (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3;
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    tmp.setRGB(c.getX(i), c.getY(i), c.getZ(i));
    const nz = noise2(x * 0.7 + 3, z * 0.7 - y * 0.5);
    if (opts.growthAmt) tmp.lerp(growth, clamp(opts.growthAmt * (ny * 0.8 + 0.2) * (0.6 + nz * 0.6), 0, 0.85));
    if (opts.crustAmt) tmp.lerp(crust, clamp(opts.crustAmt * smooth(0.1, 0.5, nz + ny * 0.3), 0, 0.8));
    if (opts.mudAmt) tmp.lerp(mud, clamp(opts.mudAmt * (1 - smooth(opts.mudLine - 1.5, opts.mudLine + 0.8, y)) + opts.mudAmt * 0.25, 0, 0.9));
    if (opts.sandAmt && ny > 0.55) tmp.lerp(sand, clamp(opts.sandAmt * (ny - 0.55) * 2.2 * (0.5 + nz), 0, 0.7));
    if (opts.siltAmt && Math.abs(ny) > 0.35) tmp.lerp(col(opts.silt || 0x3a352c), clamp(opts.siltAmt * (Math.abs(ny) - 0.35) * 1.8 * (0.65 + nz * 0.5), 0, 0.92));
    for (let k = 0; k < 3; k++) c.setXYZ(i + k, tmp.r, tmp.g, tmp.b);
  }
  c.needsUpdate = true;
}

// 顶面栅格：把三角形光栅化为 xz 网格上的最高面（网口触底判定用）
export class TopGrid {
  constructor(minX, minZ, maxX, maxZ, cell = 0.25) {
    this.cell = cell; this.minX = minX; this.minZ = minZ;
    this.nx = Math.ceil((maxX - minX) / cell) + 1; this.nz = Math.ceil((maxZ - minZ) / cell) + 1;
    this.top = new Float32Array(this.nx * this.nz).fill(-1e9);
  }
  addGeometry(geo, matrix) { for (const _ of this.addGeometrySteps(geo, matrix)); }
  // 可分帧的光栅化：每处理一批三角形 yield 一次
  *addGeometrySteps(geo, matrix, batch = 1500) {
    const p = geo.attributes.position;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      if (matrix) { a.applyMatrix4(matrix); b.applyMatrix4(matrix); c.applyMatrix4(matrix); }
      this.rasterTri(a, b, c);
      if ((i / 3) % batch === batch - 1) yield;
    }
  }
  rasterTri(a, b, c) {
    const cs = this.cell;
    const x0 = Math.floor((Math.min(a.x, b.x, c.x) - this.minX) / cs), x1 = Math.ceil((Math.max(a.x, b.x, c.x) - this.minX) / cs);
    const z0 = Math.floor((Math.min(a.z, b.z, c.z) - this.minZ) / cs), z1 = Math.ceil((Math.max(a.z, b.z, c.z) - this.minZ) / cs);
    const det = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    const degenerate = Math.abs(det) < 1e-6;
    for (let iz = Math.max(0, z0); iz <= Math.min(this.nz - 1, z1); iz++) for (let ix = Math.max(0, x0); ix <= Math.min(this.nx - 1, x1); ix++) {
      const px = this.minX + ix * cs, pz = this.minZ + iz * cs;
      let y;
      if (degenerate) {
        // 竖直/细长面：投影到最近边上插值高度
        const r = nearestOnEdges(px, pz, a, b, c);
        if (r.d > cs * 0.75) continue;
        y = r.y;
      } else {
        const l1 = ((b.z - c.z) * (px - c.x) + (c.x - b.x) * (pz - c.z)) / det;
        const l2 = ((c.z - a.z) * (px - c.x) + (a.x - c.x) * (pz - c.z)) / det;
        const l3 = 1 - l1 - l2;
        const e = -0.04;
        if (l1 < e || l2 < e || l3 < e) {
          const r = nearestOnEdges(px, pz, a, b, c);
          if (r.d > cs * 0.6) continue;
          y = r.y;
        } else y = l1 * a.y + l2 * b.y + l3 * c.y;
      }
      const k = iz * this.nx + ix;
      if (y > this.top[k]) this.top[k] = y;
    }
  }
  at(x, z) {
    const ix = Math.round((x - this.minX) / this.cell), iz = Math.round((z - this.minZ) / this.cell);
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return -1e9;
    return this.top[iz * this.nx + ix];
  }
}
// 竖直射线索引：把船体三角形按水平 1 m 格子分桶，竖直向下的“落点”查询只测所在格子的三角形
// （与对整条船做射线检测结果相同，但快两个数量级；生成沉船内落点时要查几千次）
export class VRayIndex {
  constructor(geo, cell = 1) {
    this.p = geo.attributes.position.array;
    this.cell = cell;
    const bb = geo.boundingBox || (geo.computeBoundingBox(), geo.boundingBox);
    this.minX = bb.min.x - cell; this.minZ = bb.min.z - cell;
    this.nx = Math.ceil((bb.max.x - this.minX) / cell) + 2; this.nz = Math.ceil((bb.max.z - this.minZ) / cell) + 2;
    this.done = false;
  }
  // 三角形覆盖的格子范围（竖直面返回 null：竖直射线擦过不算命中）
  span(t) {
    const p = this.p, o = t * 9, cs = this.cell;
    const ax = p[o], az = p[o + 2], bx = p[o + 3], bz = p[o + 5], cx = p[o + 6], cz = p[o + 8];
    const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (Math.abs(det) < 1e-12) return null;
    return [Math.floor((Math.min(ax, bx, cx) - this.minX) / cs), Math.floor((Math.max(ax, bx, cx) - this.minX) / cs), Math.floor((Math.min(az, bz, cz) - this.minZ) / cs), Math.floor((Math.max(az, bz, cz) - this.minZ) / cs)];
  }
  // 两遍分桶，结果是紧凑的整数数组（start[k]..start[k+1] 是格子 k 里的三角形）；可分帧
  *build(batch = 6000) {
    const n = this.p.length / 9, cells = this.nx * this.nz;
    const count = new Int32Array(cells + 1);
    for (let t = 0; t < n; t++) {
      const sp = this.span(t);
      if (sp) for (let iz = sp[2]; iz <= sp[3]; iz++) for (let ix = sp[0]; ix <= sp[1]; ix++) count[iz * this.nx + ix + 1]++;
      if (t % batch === batch - 1) yield;
    }
    for (let k = 0; k < cells; k++) count[k + 1] += count[k];
    const fill = count.slice(0, cells);
    const tris = new Int32Array(count[cells]);
    for (let t = 0; t < n; t++) {
      const sp = this.span(t);
      if (sp) for (let iz = sp[2]; iz <= sp[3]; iz++) for (let ix = sp[0]; ix <= sp[1]; ix++) tris[fill[iz * this.nx + ix]++] = t;
      if (t % batch === batch - 1) yield;
    }
    this.start = count; this.tris = tris;
    this.done = true;
  }
  // (x, z) 处竖直线与船体的全部交点高度，限定在 [yLo, yHi]，从高到低
  hits(x, z, yLo, yHi) {
    const ix = Math.floor((x - this.minX) / this.cell), iz = Math.floor((z - this.minZ) / this.cell);
    const out = [];
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return out;
    const k = iz * this.nx + ix, p = this.p;
    for (let j = this.start[k], e = this.start[k + 1]; j < e; j++) {
      const o = this.tris[j] * 9;
      const ax = p[o], ay = p[o + 1], az = p[o + 2], bx = p[o + 3], by = p[o + 4], bz = p[o + 5], cx = p[o + 6], cy = p[o + 7], cz = p[o + 8];
      const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det;
      if (l1 < 0 || l1 > 1) continue;
      const l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det;
      if (l2 < 0 || l1 + l2 > 1) continue;
      const y = l1 * ay + l2 * by + (1 - l1 - l2) * cy;
      if (y >= yLo && y <= yHi) out.push(y);
    }
    return out.sort((a, b) => b - a);
  }
}
function nearestOnEdges(px, pz, a, b, c) {
  let best = { d: 1e9, y: -1e9 };
  for (const [p, q] of [[a, b], [b, c], [c, a]]) {
    const dx = q.x - p.x, dz = q.z - p.z, L2 = dx * dx + dz * dz;
    let t = L2 < 1e-9 ? 0 : ((px - p.x) * dx + (pz - p.z) * dz) / L2; t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (p.x + dx * t), pz - (p.z + dz * t));
    // 竖直边：取上端（网从上往下碰到的是高处）
    const y = L2 < 1e-6 ? Math.max(p.y, q.y) : p.y + (q.y - p.y) * t;
    if (d < best.d - 1e-6 || (Math.abs(d - best.d) < 1e-6 && y > best.y)) best = { d, y };
  }
  return best;
}
function distToSeg2(px, pz, a, b, c) {
  const d = (p, q) => {
    const dx = q.x - p.x, dz = q.z - p.z, L2 = dx * dx + dz * dz || 1e-9;
    let t = ((px - p.x) * dx + (pz - p.z) * dz) / L2; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (p.x + dx * t), pz - (p.z + dz * t));
  };
  return Math.min(d(a, b), d(b, c), d(c, a));
}
