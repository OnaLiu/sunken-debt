// 打捞物件目录：全部代码拼装（中世纪海事物件）。名称、价值、说明只在揭晓时出现。
// 每件：r 水平半径（网口包络判定），h 高度，mass 轻/中/重，carry 可被壳背生物搬动
// 揭晓时镜头贴近主件：每件都按“特写”做细节——箍纹、铆钉、刻字（细小凸块）、木纹明暗条、亮边与凹处（按几何位置逐面着色，不用随机噪点）
import * as THREE from 'three';
import { Builder, box, cyl, sph, ico, tor, cone, lathe, col, M, shade, mix, rock } from '../core/geo.js';
import { RNG } from '../core/rng.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const COPPER = 0xb4703c, BRONZE = 0xa8823f, BRASS = 0xc9a24a, IRON = 0x4a4642, PEWTER = 0x9a9c98, GOLD = 0xe2b64a, SILVER = 0xd3d6d8;
const WOOD = 0x8a6a44, DWOOD = 0x5a4430, CLAY = 0xb07a52, STONEWARE = 0xa88e6c, GLASS = 0xc8862e;

// —— 材质色阶：l[0..4] 由暗到亮（凹处/背光 → 本色 → 亮边），pat/pat2 是这一类的铜绿、锈或氧化层（浅、深） ——
function pal(lo, base, hi, pat, pat2) {
  const L = col(lo), B = col(base), H = col(hi);
  return { l: [L, mix(L, B, 0.5), B, mix(B, H, 0.5), H], lo: L, base: B, hi: H, pat: col(pat), pat2: col(pat2) };
}
const P = {
  copper: pal(0x6e3a1c, COPPER, 0xeeae78, 0x5c9a80, 0x3c6e5e),
  bronze: pal(0x5e421c, BRONZE, 0xe4c27a, 0x55977e, 0x346a58),
  brass: pal(0x7a5a22, BRASS, 0xf8e094, 0x6f9c80, 0x4c7660),
  iron: pal(0x2a2624, 0x524b45, 0x857d74, 0x6a3a24, 0x8e5230),
  pewter: pal(0x5c605c, PEWTER, 0xd6d8d2, 0x7c857e, 0x666c66),
  gold: pal(0x9a6a1c, GOLD, 0xfff2b0, 0xc08a2a, 0x7a5418),
  silver: pal(0x7a808a, 0xc4c9ce, 0xf8fafc, 0x5c606a, 0x40444e),
  lead: pal(0x42464c, 0x6c7076, 0x9ca0a6, 0xb6bab2, 0xd4d6ce),
  wood: pal(0x4e3a26, WOOD, 0xb4905e, 0x3a2c1e, 0x6a5034),
  oak: pal(0x48331f, 0x7a5a38, 0xa88252, 0x2e2216, 0x5e4630),
  dwood: pal(0x2e2216, DWOOD, 0x806446, 0x22180e, 0x46362a),
  clay: pal(0x744528, CLAY, 0xd49c72, 0x5a3a24, 0x9a5e3a),
  salt: pal(0x4a3622, STONEWARE, 0xccb48c, 0x6a4a2a, 0x3a2818),
  stone: pal(0x5e5a52, 0x948f84, 0xc2bdb0, 0x76705f, 0x4e4a42),
  canvas: pal(0x6e5a3c, 0xb09a72, 0xd8c89e, 0x5a4a30, 0x8a2a1c),
  rope: pal(0x2a2216, 0x5a4830, 0x8a7450, 0x3c3020, 0xa08a62),
  glass: pal(0x7a4210, GLASS, 0xf6c870, 0xfff0c0, 0x5a3008),
};
const WAX = col(0x9a2a1c), WAXD = col(0x5e1810), WAXH = col(0xd04a32), BLACK = col(0x1c1a18), SOOT = col(0x2a2420), CRUSTW = col(0xe2dccb);

// —— 造型与着色工具 ——
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3(), _pc = new THREE.Vector3(), _pn = new THREE.Vector3(), _v = new THREE.Vector3();
const F = { x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, k: 0, a: 0 };
// 逐面着色：fn(F) 收到变换后的面中心 (x,y,z)、面法线 (nx,ny,nz)、面序号 k，返回整面颜色（平面着色下色块边界干净）
// pair：相邻两个三角形（基础体里的一个四边形）按共同的中心取色，不然按位置分界的花纹会在四边形里裂成三角棋盘
function addF(b, geom, fn, m, pair = true) {
  const g = geom.index ? geom.toNonIndexed() : geom;
  if (m) g.applyMatrix4(m);
  const p = g.attributes.position, n = p.count, c = new Float32Array(n * 3), step = pair ? 6 : 3;
  for (let i = 0; i < n; i += step) {
    const cnt = Math.min(step, n - i);
    let sx = 0, sy = 0, sz = 0, nx = 0, ny = 0, nz = 0;
    for (let t = i; t < i + cnt; t += 3) {
      _pa.fromBufferAttribute(p, t); _pb.fromBufferAttribute(p, t + 1); _pc.fromBufferAttribute(p, t + 2);
      sx += _pa.x + _pb.x + _pc.x; sy += _pa.y + _pb.y + _pc.y; sz += _pa.z + _pb.z + _pc.z;
      _pn.crossVectors(_pb.sub(_pa), _pc.sub(_pa)).normalize(); nx += _pn.x; ny += _pn.y; nz += _pn.z;
    }
    const ln = Math.hypot(nx, ny, nz) || 1;
    F.x = sx / cnt; F.y = sy / cnt; F.z = sz / cnt; F.nx = nx / ln; F.ny = ny / ln; F.nz = nz / ln; F.k = i / 3; F.a = Math.atan2(F.z, F.x);
    const k = typeof fn === 'function' ? fn(F) : fn;
    for (let j = 0; j < cnt; j++) { const o = (i + j) * 3; c[o] = k.r; c[o + 1] = k.g; c[o + 2] = k.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  b.add(g);
}
// 金属：朝上的面亮一级、朝下暗一级；lift(F) 再加减层次（凸棱 +，凹槽 -），pat(F) 给 0~1 的铜绿/锈量（按位置算，过阈值整面换色）
function metal(Q, lift, pat) {
  return (F) => {
    const p = pat ? pat(F) : 0;
    if (p > 0.7) return Q.pat2;
    if (p > 0.4) return Q.pat;
    let l = 2 + (F.ny > 0.6 ? 1 : F.ny < -0.5 ? -1 : 0) + (lift ? lift(F) : 0);
    return Q.l[l < 0 ? 0 : l > 4 ? 4 : l];
  };
}
// 木纹：沿 ax（0=x 1=y 2=z）走的明暗条，横截纹理的坐标决定明暗、掺一点沿纹理的弯曲；端面暗一级；extra(F) 再加减层次
function grain(Q, ax = 0, freq = 70, extra) {
  return (F) => {
    const al = ax === 0 ? F.x : ax === 1 ? F.y : F.z, na = Math.abs(ax === 0 ? F.nx : ax === 1 ? F.ny : F.nz);
    const pp = ax === 0 ? F.y + F.z : ax === 1 ? F.x + F.z : F.x + F.y;
    let l = 2;
    if (na > 0.7) l = 1;
    else { const g = Math.sin(pp * freq + Math.sin(al * 7 + pp * 13) * 1.6); l = g > 0.55 ? 3 : g < -0.5 ? 1 : 2; }
    if (extra) l += extra(F);
    return Q.l[l < 0 ? 0 : l > 4 ? 4 : l];
  };
}
// 把 b 里从 n0 起新加的顶点整体变换（躺着的器物先按直立的样子拼好、着好色，再放倒）
function xf(b, n0, m) {
  const p = b.pos, e = m.elements;
  for (let i = n0; i < b.n; i++) {
    const o = i * 3, x = p[o], y = p[o + 1], z = p[o + 2];
    p[o] = e[0] * x + e[4] * y + e[8] * z + e[12]; p[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; p[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
  }
}
const mm = (a, c) => new THREE.Matrix4().multiplyMatrices(a, c);
// 让 y 轴朝向 (nx,ny,nz) 的摆放矩阵（铆钉、宝石、藤壶贴着表面放）
const _up = new THREE.Vector3(0, 1, 0), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
function ori(x, y, z, nx, ny, nz, sx = 1, sy = sx, sz = sx, spin = 0) {
  _v.set(nx, ny, nz).normalize();
  _q1.setFromUnitVectors(_up, _v);
  if (spin) _q1.multiply(_q2.setFromAxisAngle(_up, spin));
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q1, new THREE.Vector3(sx, sy, sz));
}
const cylS = (rt, rb, h, seg = 16, hs = 1, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, hs, open);
const boxS = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const oct = (r) => new THREE.OctahedronGeometry(r, 0);
// 分段较多的旋转体（pts 按从下往上排，法线朝外；倒着排则朝里，用来做杯里、钟里）
const lath = (pts, seg = 16) => lathe(pts, seg);
// 渐细的管子（壶嘴、把手、钟绳）
function ttube(pts, r0, r1 = r0, radial = 6, segs = 16) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, false);
  const p = g.attributes.position;
  for (let i = 0; i <= segs; i++) {
    const c = curve.getPointAt(i / segs), r = r0 + (r1 - r0) * i / segs;
    for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; _v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, _v.x, _v.y, _v.z); }
  }
  return g;
}
// 麻绳：三股拧成的螺旋明暗条（逐顶点上色，股与股之间有暗缝）
function ropeG(pts, r, Q, segs = 24, radial = 6, twist = 0.55, r1 = r) {
  const g = ttube(pts, r, r1, radial, segs);
  const c = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i <= segs; i++) for (let j = 0; j <= radial; j++) {
    const s = ((j / radial) * 3 + i * twist) % 1, k = (i * (radial + 1) + j) * 3;
    const q = s < 0.18 ? Q.l[0] : s < 0.6 ? Q.l[2] : Q.l[3];
    c[k] = q.r; c[k + 1] = q.g; c[k + 2] = q.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
// 凸点/铆钉：压扁的八面体，贴着法线方向
function stud(b, x, y, z, r, c, nx = 0, ny = 1, nz = 0, h = 0.6) { addF(b, oct(r), c, ori(x, y, z, nx, ny, nz, 1, h, 1, 0.785), false); }
// 宝石：压扁的八面体，上半的面亮（两面近白、两面饱和）、下半深；底下一圈金托
const GEM = { ruby: 0xd8183a, sapphire: 0x1f56e0, emerald: 0x14b46a, amber: 0xf0901a, amethyst: 0x9a3ad8 };
function gem(b, x, y, z, r, hex, nx = 0, ny = 1, nz = 0, set = P.gold) {
  const c = col(hex), T = [mix(c, col(0xffffff), 0.62), shade(c, 0.5), shade(c, 0.32), c, mix(c, col(0xffffff), 0.3), shade(c, 0.5), shade(c, 0.32), c];
  addF(b, oct(r), (F) => T[F.k % 8], ori(x, y, z, nx, ny, nz, 1, 0.8, 1, 0.3), false);
  if (set) addF(b, cylS(r * 1.15, r * 1.3, r * 0.55, 8, 1, true), metal(set, () => 1), ori(x - nx * r * 0.2, y - ny * r * 0.2, z - nz * r * 0.2, nx, ny, nz));
}
// 圆顶玻璃（红玻璃、珐琅上的圆点）：半球，顶上一面高光
function cab(b, x, y, z, r, hex, nx = 0, ny = 1, nz = 0, sq = 0.7) {
  const c = col(hex), hi = mix(c, col(0xffffff), 0.65), dk = shade(c, 0.55);
  addF(b, new THREE.SphereGeometry(r, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), (F) => (F.k < 8 ? (F.k % 4 === 1 ? hi : c) : F.k < 24 ? c : dk), ori(x, y, z, nx, ny, nz, 1, sq, 1), false);
}
// 3×5 点阵字（浮雕或刻字，mir 反字——印章面上的字是反的）：在局部平面（x 右、y 上、z 朝外）里按横向连成条拼小方块，再用 m 摆到物件表面
const FONT = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', H: '101101111101101', I: '111010010010111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', V: '101101101101010', W: '101101111111101', '+': '000010111010000', '-': '000000111000000',
};
function glyphs(b, str, m, cell, depth, c, gap = 1, mir = false) {
  let ox = -(str.length * (3 + gap) - gap) * cell / 2;
  for (const ch of str) {
    let bits = FONT[ch];
    if (bits && mir) bits = bits.replace(/.../g, (r) => r.split('').reverse().join(''));
    if (bits) for (let r = 0; r < 5; r++) for (let c0 = 0; c0 < 3;) {
      if (bits[r * 3 + c0] !== '1') { c0++; continue; }
      let e = c0; while (e < 3 && bits[r * 3 + e] === '1') e++;
      const w = (e - c0) * cell;
      addF(b, box(w, cell, depth), c, mm(m, M(ox + c0 * cell + w / 2, (2 - r) * cell, depth / 2)));
      c0 = e;
    }
    ox += (3 + gap) * cell;
  }
}
// 平面多边形挤出（盾形、船帆、陶片轮廓）：pts 在 xy 平面，沿 z 挤出 d，居中
function ext(pts, d) {
  const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return g;
}
// 直接由三角形顶点列表造几何（陶片、草叶这种自定义面）
// 贴在表面上的局部坐标（x 向右、y 向上、z 朝外）：浮雕、刻字、记号都在这里面摆
const _fx = new THREE.Vector3(), _fy = new THREE.Vector3(), _fz = new THREE.Vector3(), _fu = new THREE.Vector3();
function frame(px, py, pz, nx, ny, nz, ux = 0, uy = 1, uz = 0) {
  _fz.set(nx, ny, nz).normalize(); _fu.set(ux, uy, uz);
  _fx.crossVectors(_fu, _fz).normalize(); _fy.crossVectors(_fz, _fx);
  return new THREE.Matrix4().makeBasis(_fx, _fy, _fz).setPosition(px, py, pz);
}
// 旋转体轮廓上按 y 插值半径（脸像、铭文、花饰贴着器身走）
function radAt(pts, y) {
  for (let i = 1; i < pts.length; i++) { const [r0, y0] = pts[i - 1], [r1, y1] = pts[i]; if (y1 >= y && y0 <= y && y1 > y0) return r0 + (r1 - r0) * (y - y0) / (y1 - y0); }
  return pts[pts.length - 1][0];
}
// 沿旋转体表面一圈的波纹/藤蔓线：y = y0 + amp·sin(n·a)
function ringWave(pts, y0, amp, n, off = 0.004, N = 64) {
  const out = [];
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, y = y0 + amp * Math.sin(a * n), r = radAt(pts, y) + off; out.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  return out;
}
// 蜡封：一团压扁的红蜡 + 压印的暗圈和小十字，边上淌下两道
function waxSeal(b, m, r) {
  addF(b, sph(r, 10, 5), (F) => (F.k < 20 ? WAXH : WAX), mm(m, M(0, 0, 0, 0, 0, 0, 1, 0.38, 1)));
  addF(b, cylS(r * 0.6, r * 0.62, r * 0.12, 10), WAXD, mm(m, M(0, r * 0.38, 0)));
  addF(b, box(r * 0.7, r * 0.1, r * 0.14), WAXH, mm(m, M(0, r * 0.46, 0)));
  addF(b, box(r * 0.14, r * 0.1, r * 0.7), WAXH, mm(m, M(0, r * 0.46, 0)));
  for (const s of [-1, 1]) addF(b, sph(r * 0.32, 5, 3), WAX, mm(m, M(s * r * 0.9, -r * 0.25, r * 0.3 * s, 0, 0, s * 0.5, 0.8, 1.6, 0.8)));
}


export const CATALOG = {
  letterTube: {
    name: '铜信筒', value: 55, r: 0.3, h: 0.16, mass: 'light', mat: 'metal',
    desc: '商船书记用的封口信筒，筒身刻着三道箍纹和一枚船主记号。',
    build(b) {
      const Q = P.copper, B = P.bronze, Y = 0.075, R = 0.07, bands = [-0.12, 0, 0.12];
      // 铜绿积在箍纹两边的缝里、贴地的一侧，背面还有几道顺着筒身的绿斑；顶上一线被手摸得发亮
      const pat = (F) => {
        const dy = F.y - Y; let p = dy < -0.058 ? 0.5 : 0;
        for (const x of bands) { const d = Math.abs(F.x - x); if (d > 0.012 && d < 0.03 && dy < 0.03) p = Math.max(p, dy < -0.03 ? 0.8 : 0.5); }
        return p;
      };
      addF(b, cylS(R, R, 0.44, 16, 20), metal(Q, (F) => (F.ny > 0.9 ? 1 : 0), pat), M(0, Y, 0, 0, 0, Math.PI / 2));
      // 两头的青铜帽：带一圈凸边，端面一个小凸台；盖头那端挂提环
      const cap = (pts, x, rz) => addF(b, lath(pts, 16), metal(B, (F) => (Math.abs(F.nx) > 0.8 ? 1 : 0), (F) => (F.y - Y < -0.06 ? 0.5 : 0)), M(x, Y, 0, 0, 0, rz));
      cap([[0.072, 0], [0.082, 0.004], [0.085, 0.012], [0.083, 0.06], [0.077, 0.069], [0.058, 0.075], [0.03, 0.078], [0, 0.079]], 0.218, -Math.PI / 2);
      cap([[0.072, 0], [0.079, 0.004], [0.081, 0.01], [0.079, 0.05], [0.072, 0.058], [0.04, 0.064], [0, 0.066]], -0.218, Math.PI / 2);
      addF(b, tor(0.083, 0.005, 4, 16), metal(B, () => 1), M(0.226, Y, 0, 0, Math.PI / 2, 0));
      addF(b, cylS(0.014, 0.016, 0.016, 8), metal(B), M(0.302, Y, 0, 0, 0, Math.PI / 2));
      addF(b, tor(0.034, 0.009, 5, 12), metal(B, () => 1, (F) => (F.y < Y - 0.02 ? 0.5 : 0)), M(0.31, Y, 0, 0, Math.PI / 2, 0));
      // 三道箍纹（凸起的亮圈）
      for (const x of bands) addF(b, tor(0.072, 0.009, 4, 20), metal(Q, () => 1, (F) => (F.y < Y - 0.04 ? 0.5 : 0)), M(x, Y, 0, 0, Math.PI / 2, 0));
      // 船主记号：竖杆上挑一个“4”字旗、一道横、脚下分叉——浮在筒身斜上方，亮铜色
      const fm = frame(0.06, Y + R * 0.6, R * 0.8, 0, 0.6, 0.8, 1, 0, 0);
      const mk = metal(Q, () => 2);
      addF(b, box(0.007, 0.064, 0.004), mk, mm(fm, M(0, 0, 0.002)));
      addF(b, box(0.032, 0.007, 0.004), mk, mm(fm, M(0, 0.008, 0.002)));
      addF(b, box(0.007, 0.03, 0.004), mk, mm(fm, M(0.009, 0.022, 0.002, 0, 0, -0.62)));
      addF(b, box(0.02, 0.007, 0.004), mk, mm(fm, M(0.009, 0.014, 0.002)));
      for (const s of [-1, 1]) addF(b, box(0.006, 0.02, 0.004), mk, mm(fm, M(s * 0.006, -0.036, 0.002, 0, 0, s * 0.6)));
      addF(b, tor(0.037, 0.003, 3, 16), Q.l[1], mm(fm, M(0, 0, 0.001)));
      // 封口的红蜡压在盖缝上
      waxSeal(b, M(0.205, Y + R - 0.006, 0), 0.022);
    },
  },
  sheave: {
    name: '铜轮滑车', value: 32, r: 0.24, h: 0.22, mass: 'light', mat: 'metal',
    desc: '橡木滑车壳里嵌着一只铜滑轮，绳槽还磨得发亮。',
    build(b) {
      const W = P.oak, I = P.iron, B = P.bronze;
      // 橡木壳：两片圆头颊板，槽里那面暗一级，上沿磨亮
      const wf = grain(W, 0, 85, (F) => (Math.abs(F.z) < 0.04 ? -1 : F.ny > 0.8 ? 1 : 0));
      for (const s of [-1, 1]) {
        const z = s * 0.0725;
        addF(b, boxS(0.2, 0.16, 0.075, 1, 6, 3), wf, M(0, 0.08, z));
        for (const x of [-0.1, 0.1]) addF(b, cylS(0.08, 0.08, 0.075, 12), wf, M(x, 0.08, z, Math.PI / 2, 0, 0));
      }
      addF(b, boxS(0.3, 0.03, 0.07, 4, 1, 1), grain(W, 0, 85, () => -1), M(0, 0.015, 0));
      addF(b, box(0.04, 0.12, 0.07), grain(W, 0, 85), M(0.16, 0.07, 0));
      addF(b, box(0.07, 0.11, 0.07), grain(W, 0, 85), M(-0.14, 0.065, 0));
      // 青铜滑轮：轮缘中间一道 V 形绳槽，槽里磨得发亮；轮毂附近积铜绿
      const cx = 0.02, cy = 0.13;
      addF(b, lath([[0.03, -0.025], [0.1, -0.025], [0.118, -0.02], [0.121, -0.012], [0.098, 0], [0.121, 0.012], [0.118, 0.02], [0.1, 0.025], [0.03, 0.025]], 18),
        metal(B, (F) => { const r = Math.hypot(F.x - cx, F.y - cy); return r > 0.094 && r < 0.12 && Math.abs(F.z) < 0.014 ? 2 : 0; }, (F) => (Math.hypot(F.x - cx, F.y - cy) < 0.06 ? 0.5 : 0)), M(cx, cy, 0, Math.PI / 2, 0, 0));
      addF(b, cylS(0.034, 0.034, 0.056, 12), metal(B, () => 1), M(cx, cy, 0, Math.PI / 2, 0, 0));
      // 铁轴：穿过两片颊板，外面压着方垫片和轴头
      const rust = (F) => (F.ny < -0.3 ? 0.8 : F.y < 0.07 ? 0.5 : 0);
      addF(b, cylS(0.012, 0.012, 0.25, 8), metal(I), M(cx, cy, 0, Math.PI / 2, 0, 0));
      for (const s of [-1, 1]) {
        addF(b, box(0.044, 0.044, 0.008), metal(I, null, (F) => (F.y < cy - 0.012 ? 0.6 : 0)), M(cx, cy, s * 0.114, 0, 0, 0.785));
        addF(b, cylS(0.017, 0.019, 0.01, 8), metal(I, () => 1), M(cx, cy, s * 0.122, Math.PI / 2, 0, 0));
        // 铁箍：沿颊板外侧一条，端头包过圆头
        addF(b, box(0.15, 0.03, 0.006), metal(I, null, rust), M(-0.1, 0.085, s * 0.1125));
        for (const x of [-0.04, -0.14]) stud(b, x, 0.085, s * 0.116, 0.008, I.l[3], 0, 0, s);
      }
      addF(b, box(0.008, 0.03, 0.232), metal(I, null, rust), M(-0.183, 0.085, 0));
      addF(b, box(0.03, 0.022, 0.03), metal(I), M(-0.198, 0.085, 0));
      addF(b, tor(0.04, 0.012, 5, 14), metal(I, null, (F) => (F.y < 0.06 ? 0.75 : F.ny < 0 ? 0.5 : 0)), M(-0.222, 0.085, 0, 0, Math.PI / 2, 0));
    },
  },
  anchor: {
    name: '锻铁锚', value: 95, r: 1.05, h: 0.4, mass: 'heavy', mat: 'metal',
    desc: '一副双爪锻铁锚，锚环上还缠着断开的锚缆，木横杆烂了一半。',
    build(b) {
      const I = P.iron;
      // 锈：贴地的下侧、锚冠和横杆夹着的地方最重，杆身上一段段起锈斑；朝上的面是磨亮的铁
      const rust = (F) => {
        let p = F.ny < -0.3 ? 0.8 : F.y < 0.085 && F.ny < 0.3 ? 0.5 : 0;
        const d = Math.min(Math.abs(F.x - 0.78), Math.abs(F.x + 0.84));
        if (d < 0.12 && F.ny < 0.6) p = Math.max(p, 0.8 - d * 3);
        if (F.ny < 0.6 && Math.sin(F.x * 9 + F.z * 5) > 0.9) p = Math.max(p, 0.45);
        return p;
      };
      const iron = metal(I, null, rust);
      addF(b, cylS(0.056, 0.07, 1.74, 8, 8), iron, M(0.03, 0.12, 0, 0.39, 0, -Math.PI / 2));
      addF(b, sph(0.1, 10, 6), iron, M(-0.86, 0.12, 0, 0, 0, 0, 1.1, 0.75, 1.25));
      addF(b, sph(0.075, 8, 5), iron, M(0.9, 0.12, 0, 0, 0, 0, 0.8, 0.75, 0.9));
      // 两条弯臂和铲形锚爪（爪尖朝锚环那边），爪面中间一道筋
      for (const s of [-1, 1]) {
        addF(b, ttube([[-0.86, 0.12, 0], [-0.84, 0.12, s * 0.22], [-0.76, 0.12, s * 0.44], [-0.64, 0.12, s * 0.6]], 0.064, 0.05, 6, 10), iron);
        const pm = M(-0.6, 0.12, s * 0.66, -Math.PI / 2, s * 0.5, 0);
        addF(b, ext([[-0.13, 0], [-0.03, 0.1], [0.09, 0.075], [0.17, 0], [0.09, -0.075], [-0.03, -0.1]], 0.05), metal(I, (F) => (F.ny > 0.6 ? 0 : -1), rust), pm);
        addF(b, box(0.24, 0.016, 0.02), metal(I, () => 1, rust), mm(pm, M(0.01, 0, 0.026)));
      }
      // 锚环：贴着锚缆磨过的内圈亮一级
      addF(b, tor(0.14, 0.035, 6, 18), metal(I, (F) => (Math.hypot(F.x - 1.02, F.z) < 0.14 ? 1 : 0), (F) => (F.y < 0.1 ? 0.75 : Math.sin(Math.atan2(F.z, F.x - 1.02) * 3) > 0.7 ? 0.5 : 0)), M(1.02, 0.12, 0, Math.PI / 2, 0, 0));
      // 木横杆：靠 +z 的一半完好（铁箍、钉头），另一半烂得又细又短，断头是参差的木刺和船蛆孔
      const S = M(0.78, 0.16, 0.05, 0, 0.1, 0), W = P.oak;
      addF(b, boxS(0.14, 0.16, 0.59, 3, 4, 3), grain(W, 2, 90, (F) => (F.ny > 0.7 ? 1 : 0)), mm(S, M(0, 0, 0.255)));
      addF(b, boxS(0.11, 0.12, 0.36, 2, 3, 3), grain(P.dwood, 2, 90, (F) => (F.ny > 0.7 ? 0 : -1)), mm(S, M(0, -0.01, -0.22)));
      for (const [x, y, l, w] of [[-0.03, 0.02, 0.09, 0.03], [0.025, -0.02, 0.06, 0.035], [0.01, 0.035, 0.05, 0.025], [-0.02, -0.04, 0.035, 0.03]]) addF(b, cone(w, l, 4), P.dwood.l[1], mm(S, M(x, y - 0.01, -0.4 - l / 2, -Math.PI / 2, 0, 0)));
      for (const [x, z] of [[-0.02, -0.12], [0.03, -0.2], [-0.025, -0.28], [0.015, -0.33], [0.03, -0.09]]) addF(b, box(0.014, 0.004, 0.014), BLACK, mm(S, M(x, 0.051, z)));
      for (const z of [-0.09, 0.09]) {
        addF(b, box(0.152, 0.172, 0.03), metal(I, null, (F) => (F.ny < 0.5 ? 0.6 : 0.2)), mm(S, M(0, 0, z)));
        for (const x of [-0.045, 0.045]) stud(b, ...new THREE.Vector3(x, 0.087, z).applyMatrix4(S).toArray(), 0.01, I.l[3]);
      }
      addF(b, box(0.144, 0.164, 0.01), W.l[1], mm(S, M(0, 0, 0.548)));
      // 断开的锚缆：在锚环上缠两圈，拖出去一截，断头散成几股
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20, ph = -0.7 + t * 1.4, ps = t * Math.PI * 4;
        const cxr = 1.02 + Math.cos(ph) * 0.14, czr = Math.sin(ph) * 0.14;
        pts.push([cxr + Math.cos(ph) * Math.cos(ps) * 0.046, 0.12 + Math.sin(ps) * 0.046, czr + Math.sin(ph) * Math.cos(ps) * 0.046]);
      }
      pts.push([1.26, 0.07, 0.07], [1.5, 0.052, 0.13], [1.78, 0.05, 0.01], [2.05, 0.05, -0.12], [2.3, 0.05, -0.06], [2.48, 0.05, 0.07]);
      b.add(ropeG(pts, 0.032, P.rope, 90, 5, 0.5));
      for (const [dx, dy, dz] of [[0.14, 0.012, 0.05], [0.15, -0.012, 0.0], [0.12, 0.004, -0.06], [0.1, 0.02, 0.1]]) addF(b, ttube([[2.47, 0.05, 0.07], [2.47 + dx * 0.5, 0.05 + dy * 0.5, 0.07 + dz * 0.3], [2.47 + dx, 0.05 + dy, 0.07 + dz]], 0.014, 0.004, 4, 4), P.rope.l[3]);
    },
  },
  jug: {
    name: '盐釉陶壶', value: 38, r: 0.17, h: 0.36, mass: 'mid', mat: 'ceramic',
    desc: '灰褐色盐釉陶壶，颈部印着一张大胡子面像，壶身完好。',
    build(b) {
      const S = P.salt;
      const JP = [[0, 0], [0.068, 0], [0.074, 0.01], [0.07, 0.02], [0.1, 0.036], [0.132, 0.07], [0.148, 0.115], [0.146, 0.16], [0.134, 0.2], [0.11, 0.238], [0.082, 0.268], [0.058, 0.292], [0.051, 0.31], [0.054, 0.33], [0.058, 0.348], [0.052, 0.36], [0.042, 0.356], [0.04, 0.34]];
      // 盐釉：上半罩深褐色的铁釉，往下流成几道釉泪；下半灰褐，一圈圈拉坯纹；壶脚露胎
      const glaze = (F) => {
        if (F.y < 0.022) return S.l[3];
        const drip = 0.17 - 0.055 * Math.pow(Math.max(0, Math.cos(F.a * 6 + 0.4)), 3);
        if (F.y > drip) return F.ny > 0.55 ? S.l[1] : S.l[0];
        return F.ny > 0.5 ? S.l[3] : S.l[2];
      };
      addF(b, lath(JP, 18), glaze);
      addF(b, cylS(0.04, 0.04, 0.004, 16), BLACK, M(0, 0.338, 0));
      addF(b, tor(0.055, 0.006, 4, 18), S.l[1], M(0, 0.355, 0, Math.PI / 2, 0, 0));
      // 颈部大胡子面像（朝 -x）：浮起的面饼、眉、眼、鼻、八字胡、嘴，胡子一缕缕顺着壶肩流下来；凸起处釉薄色浅，凹处釉厚发黑
      const y0 = 0.272, rr = radAt(JP, y0), fm = frame(-rr, y0, 0, -1, 0.96, 0);
      const hi = S.l[3], mid = S.l[2], dk = S.l[0];
      addF(b, sph(0.036, 8, 6), S.l[1], mm(fm, M(0, 0, 0.002, 0, 0, 0, 1, 1.15, 0.32)));
      for (const s of [-1, 1]) {
        addF(b, box(0.026, 0.008, 0.01), hi, mm(fm, M(s * 0.012, 0.017, 0.01, 0, 0, s * 0.22)));
        addF(b, sph(0.0075, 6, 4), mid, mm(fm, M(s * 0.013, 0.008, 0.009)));
        addF(b, box(0.0045, 0.0045, 0.004), dk, mm(fm, M(s * 0.013, 0.008, 0.016)));
        addF(b, sph(0.009, 5, 4), hi, mm(fm, M(s * 0.019, -0.004, 0.006)));
        addF(b, box(0.024, 0.0065, 0.008), hi, mm(fm, M(s * 0.012, -0.016, 0.012, 0, 0, -s * 0.38)));
      }
      addF(b, box(0.011, 0.022, 0.012), hi, mm(fm, M(0, -0.002, 0.012, -0.25, 0, 0)));
      addF(b, box(0.012, 0.004, 0.006), dk, mm(fm, M(0, -0.022, 0.01)));
      for (let i = -3; i <= 3; i++) {
        const a = Math.PI + i * 0.13, pts = [];
        for (let k = 0; k <= 3; k++) { const y = 0.252 - k * (0.017 - Math.abs(i) * 0.002), r = radAt(JP, y) + 0.005, aa = a + Math.sin(k * 1.7 + i) * 0.04; pts.push([Math.cos(aa) * r, y, Math.sin(aa) * r]); }
        addF(b, ttube(pts, 0.0075, 0.0035, 4, 6), i % 2 ? hi : mid);
      }
      // 壶腹贴花：一枚圆章，中间一朵六瓣花
      const ym = 0.125, mfm = frame(-radAt(JP, ym), ym, 0, -1, 0.05, 0);
      addF(b, cylS(0.032, 0.034, 0.006, 14), S.l[1], mm(mfm, M(0, 0, 0.002, Math.PI / 2, 0, 0)));
      addF(b, tor(0.031, 0.004, 3, 14), hi, mm(mfm, M(0, 0, 0.005)));
      stud(b, ...new THREE.Vector3(0, 0, 0.007).applyMatrix4(mfm).toArray(), 0.008, hi, -1, 0, 0);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; addF(b, sph(0.007, 5, 3), mid, mm(mfm, M(Math.cos(a) * 0.016, Math.sin(a) * 0.016, 0.006, 0, 0, a, 1.5, 0.8, 0.6))); }
      // 带状把手（+x）：上端一个拇指托，下端压扁的收尾
      addF(b, ttube([[0.052, 0.302, 0], [0.105, 0.318, 0], [0.152, 0.287, 0], [0.159, 0.228, 0], [0.142, 0.178, 0], [0.126, 0.158, 0]], 0.0145, 0.012, 6, 16), (F) => (F.y > 0.2 ? (F.ny > 0.5 ? S.l[1] : S.l[0]) : S.l[2]));
      addF(b, sph(0.012, 6, 4), S.l[1], M(0.1, 0.333, 0));
      addF(b, sph(0.016, 6, 4), S.l[2], M(0.128, 0.158, 0, 0, 0, 0.6, 1.2, 0.5, 1));
    },
  },
  plates: {
    name: '锡盘一叠', value: 48, r: 0.22, h: 0.12, mass: 'mid', mat: 'metal',
    desc: '六只同款锡盘叠在一起，盘沿刻着同一个作坊记号。',
    build(b) {
      const Q = P.pewter, A = 0.5;
      // 作坊记号：盘沿外侧同一个位置的小方戳（叠起来一竖排都看得见），顶上那只的盘沿正面还打着带冠的玫瑰章
      const edgeMark = (cx, cy, cz, r) => {
        const fm = frame(cx + Math.cos(A) * r, cy, cz + Math.sin(A) * r, Math.cos(A), 0, Math.sin(A));
        addF(b, box(0.02, 0.008, 0.002), Q.l[0], fm);
        stud(b, ...new THREE.Vector3(-0.004, 0, 0.0015).applyMatrix4(fm).toArray(), 0.0026, Q.hi, Math.cos(A), 0, Math.sin(A));
        addF(b, box(0.006, 0.0025, 0.002), Q.hi, mm(fm, M(0.0045, 0, 0.001)));
      };
      for (let i = 0; i < 6; i++) {
        const y = 0.012 + i * 0.019, ox = Math.sin(i) * 0.015, oz = Math.cos(i * 1.7) * 0.015;
        const tone = i % 2 ? 0 : -1;
        if (i < 5) {
          addF(b, cylS(0.17, 0.169, 0.01, 20), metal(Q, (F) => tone + (F.ny > 0.6 ? 0 : 0)), M(ox, y + 0.003, oz));
          addF(b, cylS(0.169, 0.13, 0.008, 20, 1, true), metal(Q, () => -1), M(ox, y - 0.006, oz));
          addF(b, tor(0.164, 0.005, 3, 20), metal(Q, () => 1 + tone), M(ox, y + 0.008, oz, Math.PI / 2, 0, 0));
          edgeMark(ox, y + 0.002, oz, 0.1705);
        } else {
          // 顶上那只：平沿、斜壁、盘心；盘心靠里一圈氧化发暗，盘底几道刀划的亮痕
          const pf = metal(Q, (F) => { const r = Math.hypot(F.x - ox, F.z - oz); return r > 0.16 ? 1 : r > 0.124 ? 1 : 0; }, (F) => { const r = Math.hypot(F.x - ox, F.z - oz); return r > 0.098 && r < 0.124 ? 0.5 : r > 0.07 && r < 0.1 && Math.cos(Math.atan2(F.z - oz, F.x - ox) - 2.4) > 0.3 ? 0.45 : 0; });
          addF(b, lath([[0.172, -0.006], [0.172, 0.004], [0.166, 0.009], [0.156, 0.006], [0.125, 0.006], [0.115, 0.002], [0.104, -0.004], [0.06, -0.004], [0, -0.004]], 20), pf, M(ox, y, oz));
          addF(b, tor(0.163, 0.0045, 3, 24), Q.hi, M(ox, y + 0.008, oz, Math.PI / 2, 0, 0));
          addF(b, tor(0.135, 0.0016, 3, 28), Q.l[0], M(ox, y + 0.0062, oz, Math.PI / 2, 0, 0));
          edgeMark(ox, y - 0.001, oz, 0.1725);
          for (const [a, l, d] of [[0.3, 0.07, 0.02], [1.9, 0.05, -0.03], [2.4, 0.06, 0.01], [4.1, 0.045, 0.035]]) addF(b, box(l, 0.0024, 0.0016), Q.hi, M(ox + Math.cos(a + 1.57) * d, y - 0.0028, oz + Math.sin(a + 1.57) * d, 0, -a, 0));
          const fm = frame(ox + Math.cos(A) * 0.14, y + 0.0065, oz + Math.sin(A) * 0.14, 0, 1, 0, Math.cos(A), 0, Math.sin(A));
          addF(b, tor(0.011, 0.0016, 3, 12), Q.l[0], fm);
          stud(b, ...new THREE.Vector3(0, 0, 0.001).applyMatrix4(fm).toArray(), 0.003, Q.hi);
          for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; stud(b, ...new THREE.Vector3(Math.cos(a) * 0.0055, Math.sin(a) * 0.0055 - 0.001, 0.001).applyMatrix4(fm).toArray(), 0.0026, Q.l[3]); }
          for (const s of [-1, 0, 1]) addF(b, box(0.0025, 0.005, 0.002), Q.hi, mm(fm, M(s * 0.004, 0.015 + (s ? 0 : 0.0015), 0.001)));
          addF(b, box(0.012, 0.0022, 0.002), Q.hi, mm(fm, M(0, 0.0125, 0.001)));
        }
      }
    },
  },
  cask: {
    name: '小木桶', value: 34, r: 0.3, h: 0.36, mass: 'mid', mat: 'wood',
    desc: '橡木小桶，铁箍还在，桶塞用蜡封着，里面是凝固的焦油。',
    build(b) {
      const n0 = b.n, W = P.oak, I = P.iron;
      // 先直立着拼（桶轴 = y），最后放倒成横躺：直立时的 +x 就是躺下后的正上方
      const CP = [[0.15, -0.25], [0.172, -0.19], [0.188, -0.12], [0.197, -0.05], [0.2, 0], [0.197, 0.05], [0.188, 0.12], [0.172, 0.19], [0.15, 0.25]];
      const hoops = [-0.18, -0.07, 0.07, 0.18];
      // 桶板：16 片各自深浅，两头泡得发暗；铁箍下沿（躺下后的下半边）渗出锈水印
      const TONE = [2, 3, 1, 2, 3, 2, 1, 3, 2, 1, 3, 2, 3, 1, 2, 3];
      const Z = 16, v2 = CP.map(([r, y]) => new THREE.Vector2(r, y));
      for (let k = 0; k < Z; k++) {
        const g = new THREE.LatheGeometry(v2, 2, k / Z * Math.PI * 2 + 0.013, Math.PI * 2 / Z - 0.026);
        addF(b, g, (F) => {
          let l = TONE[k] - ((F.k >> 4) & 1);
          if (Math.abs(F.y) > 0.21) l -= 1;
          if (F.x > 0.17) l += 1;
          return W.l[Math.max(0, Math.min(4, l))];
        });
      }
      addF(b, lath(CP.map(([r, y]) => [r - 0.008, Math.max(-0.228, Math.min(0.228, y))]), 16), P.dwood.l[0]);
      for (const s of [-1, 1]) {
        // 桶口：桶板高出桶底一截（里侧一圈、端面一圈年轮色），桶底四块拼板
        addF(b, lath(s > 0 ? [[0.142, 0.25], [0.142, 0.228]] : [[0.142, -0.228], [0.142, -0.25]], 16), W.l[1]);
        addF(b, lath(s > 0 ? [[0.152, 0.25], [0.142, 0.25]] : [[0.142, -0.25], [0.152, -0.25]], 16), W.l[3]);
        addF(b, lath(s > 0 ? [[0.142, 0.226], [0.09, 0.226]] : [[0.09, -0.226], [0.142, -0.226]], 16), P.dwood.l[0]);
        for (const [zc, w] of [[-0.105, 0.068], [-0.035, 0.068], [0.035, 0.068], [0.105, 0.068]]) {
          const e = Math.abs(zc) + w / 2 - 0.012, L = 2 * Math.sqrt(Math.max(0.0001, 0.142 * 0.142 - e * e));
          addF(b, boxS(L, 0.012, w, 3, 1, 1), grain(W, 0, 90, () => (zc > 0 ? 0 : -1)), M(0, s * 0.228, zc));
        }
      }
      // 四道铁箍：带倒角的扁铁，上沿亮、下半边锈，各有一颗接口铆钉
      for (const h of hoops) {
        const r = radAt(CP.map(([r, y]) => [r, y]), h) + 0.004;
        addF(b, lath([[r - 0.004, h - 0.016], [r + 0.002, h - 0.013], [r + 0.002, h + 0.013], [r - 0.004, h + 0.016]], 16), metal(I, (F) => (F.x > 0.12 ? 1 : 0), (F) => (F.x < -0.06 ? 0.8 : F.x < 0.05 && Math.sin(F.z * 30 + h * 20) > 0.5 ? 0.5 : 0)));
        stud(b, Math.cos(2.2) * (r + 0.003), h, Math.sin(2.2) * (r + 0.003), 0.007, I.l[3], Math.cos(2.2), 0, Math.sin(2.2));
      }
      // 桶塞（桶腹正上方）：木塞外面糊着一团红蜡，焦油从缝里渗出来顺着桶板淌下一道
      addF(b, cylS(0.022, 0.026, 0.02, 10), P.dwood.l[2], M(0.204, 0, 0, 0, 0, -Math.PI / 2));
      waxSeal(b, M(0.212, 0, 0, 0, 0, -Math.PI / 2), 0.03);
      const tar = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5, a = 0.12 + t * 0.75; tar.push([Math.cos(a) * 0.203, -0.02 - t * 0.03, Math.sin(a) * 0.203]); }
      addF(b, ttube(tar, 0.011, 0.007, 5, 10), (F) => (F.x > 0.15 ? col(0x4a4036) : BLACK));
      addF(b, sph(0.013, 6, 4), BLACK, M(...tar[5], 0, 0, 0, 1, 1.3, 1));
      xf(b, n0, M(0, 0.19, 0, 0, 0, Math.PI / 2));
    },
  },
  cargoBag: {
    name: '封蜡货袋', value: 46, r: 0.28, h: 0.26, mass: 'mid', mat: 'cloth',
    desc: '涂蜡帆布扎紧的货袋，封蜡完好，里面是一包没受潮的丁香。',
    build(b, rng) {
      const C = P.canvas, ph = rng.next() * 6;
      // 袋身：鼓囊囊的一团，上半往扎口收、起一圈褶，袋底压平；褶的凸棱亮、褶沟暗，下沿受潮发暗
      const pt = (a, t, out) => {
        const tp = Math.max(0, t);
        let s = 1 + 0.06 * Math.sin(8 * a + ph) * Math.pow(tp, 0.7) + 0.035 * Math.sin(3 * a + t * 2 + ph);
        s *= 1 - 0.62 * Math.pow(Math.max(0, t - 0.35) / 0.65, 1.4);
        const rr = 0.25 * Math.sqrt(Math.max(0, 1 - t * t)) * s;
        let y = 0.12 + t * 0.13; if (y < 0.015) y = 0.015 - (0.015 - y) * 0.4;
        return out.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
      };
      const g = new THREE.SphereGeometry(1, 18, 10), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i); pt(Math.atan2(_v.z, _v.x), _v.y, _v); p.setXYZ(i, _v.x, _v.y, _v.z); }
      addF(b, g, (F) => {
        if (F.y < 0.05) return C.l[1];
        const f = Math.sin(8 * F.a + ph);
        if (F.y > 0.15 && f < -0.45) return C.l[1];
        if (f > 0.55 || F.ny > 0.75) return C.l[3];
        return C.l[2];
      });
      // 扎口：收紧的颈、上面散开的布边
      const ng = lath([[0.08, 0.24], [0.055, 0.262], [0.046, 0.28], [0.05, 0.292], [0.07, 0.306], [0.083, 0.32], [0.074, 0.33]], 14), np = ng.attributes.position;
      for (let i = 0; i < np.count; i++) { _v.fromBufferAttribute(np, i); if (_v.y > 0.3) { const s = 1 + 0.16 * Math.sin(Math.atan2(_v.z, _v.x) * 7 + ph); _v.x *= s; _v.z *= s; _v.y += 0.006 * Math.sin(Math.atan2(_v.z, _v.x) * 5); } np.setXYZ(i, _v.x, _v.y, _v.z); }
      addF(b, ng, (F) => (Math.sin(F.a * 7 + ph) > 0.3 ? C.l[3] : C.l[2]));
      // 绳子绕三圈打结，两根绳头垂到袋肩，拴着封蜡
      for (let k = 0; k < 3; k++) addF(b, tor(0.05 - k * 0.002, 0.0075, 4, 16), P.rope.l[2 + (k % 2)], M(0, 0.268 + k * 0.01, 0, Math.PI / 2, 0, 0));
      addF(b, sph(0.016, 6, 4), P.rope.l[3], M(0.05, 0.278, 0.018));
      const sa = 0.55, sp = pt(sa, 0.62, new THREE.Vector3()), sn = new THREE.Vector3(Math.cos(sa) * 0.6, 0.8, Math.sin(sa) * 0.6).normalize();
      for (const d of [-0.012, 0.012]) addF(b, ttube([[0.05, 0.276, 0.02], [0.075, 0.27, 0.04 + d], [sp.x - 0.01, sp.y + 0.012, sp.z + d]], 0.005, 0.0045, 4, 6), P.rope.l[2]);
      waxSeal(b, ori(sp.x + sn.x * 0.006, sp.y + sn.y * 0.006, sp.z + sn.z * 0.006, sn.x, sn.y, sn.z), 0.03);
      // 一侧的缝线（一排针脚），另一侧刷着黑色的货主记号（圆圈加十字）
      for (let k = 0; k < 9; k++) {
        const t = -0.45 + k * 0.11, a = 2.3, q = pt(a, t, new THREE.Vector3()), qn = new THREE.Vector3(q.x, (q.y - 0.12) * 1.6, q.z).normalize();
        addF(b, box(0.014, 0.004, 0.005), C.l[0], frame(q.x, q.y, q.z, qn.x, qn.y, qn.z));
      }
      const ma = -0.7, mq = pt(ma, -0.05, new THREE.Vector3()), fm = frame(mq.x, mq.y, mq.z, Math.cos(ma), 0.05, Math.sin(ma));
      const ink = col(0x2a241c);
      addF(b, tor(0.034, 0.004, 3, 16), ink, mm(fm, M(0, 0, 0.002)));
      addF(b, box(0.006, 0.07, 0.003), ink, mm(fm, M(0, 0, 0.003)));
      addF(b, box(0.05, 0.006, 0.003), ink, mm(fm, M(0, 0.012, 0.003)));
      addF(b, box(0.022, 0.006, 0.003), ink, mm(fm, M(0.011, 0.03, 0.003, 0, 0, -0.7)));
    },
  },
  casket: {
    name: '铁箍小匣', value: 72, r: 0.3, h: 0.3, mass: 'mid', mat: 'wood',
    desc: '铁箍木匣，锁扣锈死，匣里是一本蜡封账册和几枚铜币。',
    preciousName: '银币匣', preciousValue: 640, preciousDesc: '撬开锁扣，匣里塞满压纹银币，账册上写着这批钱要付给对岸的债主。',
    build(b, rng, opts = {}) {
      const W = P.oak, I = P.iron, open = !!opts.open, gold = !!(open && opts.precious);
      // 匣壁朝里的面暗两级；外面是横纹木板，中间一道板缝
      const inner = (F) => (Math.abs(F.x) < 0.221 && Math.abs(F.z) < 0.131 && F.y > 0.015 && (F.nx * F.x + F.nz * F.z < -0.001) ? -2 : F.ny > 0.7 ? -1 : 0);
      addF(b, boxS(0.48, 0.2, 0.02, 3, 4, 1), grain(W, 0, 75, inner), M(0, 0.1, 0.14));
      addF(b, boxS(0.48, 0.2, 0.02, 3, 4, 1), grain(W, 0, 75, inner), M(0, 0.1, -0.14));
      for (const s of [-1, 1]) addF(b, boxS(0.02, 0.2, 0.26, 1, 4, 2), grain(W, 2, 75, inner), M(s * 0.23, 0.1, 0));
      addF(b, box(0.44, 0.02, 0.26), W.l[0], M(0, 0.01, 0));
      for (const z of [-0.1505, 0.1505]) addF(b, box(0.47, 0.004, 0.002), W.l[0], M(0, 0.098, z));
      // 铁件：三道竖箍、四角包角、铆钉；锈积在下半和钉头周围，上沿磨亮
      const rust = (F) => (F.y < 0.05 ? 0.8 : F.ny < -0.3 ? 0.8 : Math.sin(F.y * 60 + F.x * 30) > 0.65 ? 0.5 : 0);
      const iron = metal(I, (F) => (F.y > 0.18 ? 1 : 0), rust);
      for (const x of [-0.17, 0, 0.17]) for (const s of [-1, 1]) {
        addF(b, box(0.04, 0.2, 0.006), iron, M(x, 0.1, s * 0.153));
        for (const y of x === 0 && s > 0 ? [0.04] : [0.04, 0.16]) stud(b, x, y, s * 0.157, 0.008, I.l[3], 0, 0, s);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        addF(b, box(0.032, 0.2, 0.005), iron, M(sx * 0.224, 0.1, sz * 0.1525));
        addF(b, box(0.005, 0.2, 0.032), iron, M(sx * 0.2425, 0.1, sz * 0.134));
        stud(b, sx * 0.245, 0.1, sz * 0.134, 0.007, I.l[3], sx, 0, 0);
      }
      // 两头的提环（垂着）
      for (const s of [-1, 1]) {
        addF(b, box(0.01, 0.03, 0.05), iron, M(s * 0.245, 0.15, 0));
        addF(b, tor(0.035, 0.0075, 4, 10, Math.PI), metal(I, null, (F) => (F.y < 0.12 ? 0.75 : 0.3)), M(s * 0.252, 0.155, 0, 0, Math.PI / 2, Math.PI));
      }
      // 锁板：锈成一片，锁孔发黑；撬开的那只留着几道亮的撬痕
      addF(b, box(0.09, 0.09, 0.01), metal(I, null, (F) => (F.y < 0.13 ? 0.8 : 0.5)), M(0, 0.14, 0.158));
      addF(b, box(0.008, 0.022, 0.003), BLACK, M(0, 0.132, 0.164));
      addF(b, sph(0.007, 6, 3), BLACK, M(0, 0.146, 0.163, 0, 0, 0, 1, 1, 0.4));
      for (const [x, y] of [[-0.036, 0.17], [0.036, 0.17], [-0.036, 0.105], [0.036, 0.105]]) stud(b, x, y, 0.163, 0.006, I.l[3], 0, 0, 1);
      // 匣盖：横纹盖板 + 两道铁箍（兼作后面的合页），前沿挂锁扣
      const lid = (T) => {
        addF(b, boxS(0.5, 0.05, 0.32, 4, 1, 4), grain(W, 0, 75, (F) => (F.ny > 0.5 ? 1 : 0)), mm(T, M(0, 0.225, 0)));
        addF(b, box(0.5, 0.012, 0.012), W.l[1], mm(T, M(0, 0.206, 0.158)));
        for (const x of [-0.17, 0.17]) {
          addF(b, box(0.042, 0.006, 0.322), metal(I, () => 1, (F) => (F.ny < 0.3 ? 0.6 : 0)), mm(T, M(x, 0.253, 0)));
          addF(b, box(0.042, 0.05, 0.006), iron, mm(T, M(x, 0.225, 0.162)));
          for (const z of [-0.11, 0, 0.11]) stud(b, ...new THREE.Vector3(x, 0.257, z).applyMatrix4(T).toArray(), 0.008, I.l[4], ...new THREE.Vector3(0, 1, 0).transformDirection(T).toArray());
          addF(b, cylS(0.012, 0.012, 0.05, 8), metal(I, null, rust), mm(T, M(x, 0.205, -0.162, 0, 0, Math.PI / 2)));
        }
        addF(b, box(0.032, 0.085, 0.007), metal(I, null, () => 0.75), mm(T, open ? M(0, 0.2, 0.17, -0.5, 0, 0.15) : M(0, 0.2, 0.166)));
        if (!open) for (let k = 0; k < 4; k++) addF(b, oct(0.008), I.pat2, mm(T, M((k % 2 - 0.5) * 0.02, 0.18 + k * 0.012, 0.17)), false);
        if (gold) {
          // 银币匣：盖里衬着红丝绒，四周压一道金边
          addF(b, box(0.44, 0.004, 0.27), (F) => (Math.sin(F.x * 40) > 0.6 ? col(0xb02a3a) : col(0x7a1424)), mm(T, M(0, 0.198, 0)));
          for (const z of [-0.138, 0.138]) addF(b, box(0.46, 0.006, 0.012), metal(P.gold, () => 1), mm(T, M(0, 0.197, z)));
          for (const x of [-0.226, 0.226]) addF(b, box(0.012, 0.006, 0.288), metal(P.gold, () => 1), mm(T, M(x, 0.197, 0)));
          gem(b, ...new THREE.Vector3(0, 0.194, 0).applyMatrix4(T).toArray(), 0.016, GEM.ruby, ...new THREE.Vector3(0, -1, 0).transformDirection(T).toArray());
        }
      };
      if (!open) { lid(new THREE.Matrix4()); addF(b, tor(0.012, 0.004, 4, 8), metal(I, null, () => 0.8), M(0, 0.175, 0.172)); return; }
      // 打开：盖子向后翻开立起，里面的东西堆得冒尖
      lid(mm(M(0, 0.33, -0.19, -1.45, 0, 0), M(0, -0.225, 0)));
      for (const [x, y, a] of [[-0.02, 0.15, 0.6], [0.015, 0.125, -0.5]]) addF(b, box(0.04, 0.0025, 0.003), I.hi, M(x, y, 0.164, 0, 0, a));
      addF(b, box(0.44, 0.17, 0.26), gold ? col(0x5a1018) : P.canvas.l[0], M(0, 0.105, 0));
      // 账册：皮面、书口一层层纸、封面压一颗蜡封、一条皮带扎着
      const book = (T) => {
        addF(b, boxS(0.22, 0.044, 0.16, 1, 4, 1), (F) => (Math.abs(F.ny) > 0.7 ? col(0xd8ccae) : (Math.floor(F.y * 600) % 2 ? col(0xd8ccae) : col(0xa89c80))), T);
        for (const s of [-1, 1]) addF(b, box(0.236, 0.008, 0.172), (F) => (F.ny > 0.6 ? col(0x7a4428) : col(0x5a2e1a)), mm(T, M(0, s * 0.026, 0)));
        addF(b, cylS(0.03, 0.03, 0.236, 8), col(0x5a2e1a), mm(T, M(0, 0, -0.084, 0, 0, Math.PI / 2, 1, 1, 0.4)));
        addF(b, box(0.03, 0.062, 0.176), col(0x4a2414), mm(T, M(0.06, 0, 0)));
        waxSeal(b, mm(T, M(-0.04, 0.03, 0.02)), 0.022);
      };
      if (gold) {
        // 银币：深浅不一（发黑的旧银、擦亮的边），面上压着十字纹；夹着几枚金币和一枚嵌红宝石的金戒指；四沿压金边、壁上衬丝绒
        for (const z of [-0.14, 0.14]) addF(b, box(0.48, 0.006, 0.024), metal(P.gold, () => 1), M(0, 0.202, z));
        for (const x of [-0.23, 0.23]) addF(b, box(0.024, 0.006, 0.26), metal(P.gold, () => 1), M(x, 0.202, 0));
        const S = P.silver, G = P.gold;
        const coin = (m, kind, stamp) => {
          const top = kind === 0 ? S.l[4] : kind === 1 ? S.l[3] : kind === 2 ? S.pat : G.l[3], side = kind === 3 ? G.l[1] : S.l[1];
          addF(b, cylS(0.042, 0.042, 0.01, 6), (F) => (Math.abs(F.ny) > 0.6 ? top : side), m);
          if (stamp) { addF(b, box(0.05, 0.003, 0.008), kind === 3 ? G.l[1] : S.l[1], mm(m, M(0, 0.0055, 0))); addF(b, box(0.008, 0.003, 0.05), kind === 3 ? G.l[1] : S.l[1], mm(m, M(0, 0.0055, 0))); }
        };
        for (let i = 0; i < 40; i++) {
          const r = Math.sqrt(rng.next()), a = rng.next() * 6.28, tn = rng.next();
          const m = M(Math.cos(a) * 0.2 * r, 0.215 + (1 - r) * 0.07 + rng.next() * 0.02, Math.sin(a) * 0.12 * r, rng.range(-0.5, 0.5), 0, rng.range(-0.5, 0.5));
          coin(m, i % 10 === 5 ? 3 : tn < 0.3 ? 2 : tn < 0.65 ? 1 : 0, i % 8 === 0);
        }
        for (let i = 0; i < 6; i++) coin(M(rng.range(-0.35, 0.35), 0.008, 0.2 + rng.range(0, 0.15), rng.range(-0.2, 0.2), 0, rng.range(-0.2, 0.2)), i === 3 ? 3 : i % 2, i % 3 === 0);
        book(M(0.1, 0.285, -0.02, 0.2, 0.3, 0, 0.9, 0.7, 0.85));
        addF(b, tor(0.02, 0.005, 4, 12), metal(G, () => 1), M(-0.08, 0.3, 0.03, 1.2, 0, 0.2));
        gem(b, -0.08, 0.305, 0.052, 0.011, GEM.ruby, 0, 0.4, 1);
      } else {
        book(M(0, 0.214, 0));
        for (let i = 0; i < 6; i++) { const t = rng.next(); addF(b, cylS(0.032, 0.032, 0.008, 8), (F) => (Math.abs(F.ny) > 0.6 ? (t < 0.35 ? P.copper.pat : t < 0.7 ? P.copper.l[3] : P.copper.l[2]) : P.copper.l[1]), M(0.12 + rng.range(-0.05, 0.05), 0.25 + i * 0.003, rng.range(-0.08, 0.08), rng.range(-0.15, 0.15), 0, rng.range(-0.15, 0.15))); }
      }
    },
  },
  bell: {
    name: '船钟', value: 160, r: 0.32, h: 0.34, mass: 'heavy', mat: 'metal', display: { rz: -(Math.PI / 2 - 0.15) },
    desc: '青铜船钟，钟肩铸着年份和一圈波浪纹，钟舌还挂在里面。',
    build(b) {
      const n0 = b.n, Q = P.bronze;
      // 先口朝下直立着拼，最后照原来的姿势侧躺（揭晓时扶正）
      const BP = [[0, 0.335], [0.1, 0.325], [0.15, 0.27], [0.18, 0.18], [0.215, 0.09], [0.238, 0.03], [0.246, 0], [0.27, 0], [0.273, 0.018], [0.264, 0.046], [0.238, 0.09], [0.208, 0.15], [0.188, 0.22], [0.176, 0.29], [0.168, 0.335], [0.152, 0.372], [0.12, 0.4], [0.07, 0.422], [0, 0.43]];
      const OUT = BP.slice(7);
      // 钟里发暗泛绿；口沿常被敲的那圈磨得发亮；钟肩顶上积水处一层铜绿，往下拖出几道绿痕
      addF(b, lath(BP, 18), (F) => {
        const rad = F.nx * F.x + F.nz * F.z;
        if (rad < -0.001 || (F.ny < -0.5 && F.y > 0.01)) return F.y > 0.2 ? Q.pat2 : Q.l[0];
        if (F.ny < -0.9) return Q.l[3];
        if (F.y < 0.06) return Q.l[F.ny > 0 ? 4 : 3];
        if (F.y > 0.36 && F.ny > 0.45) return Q.pat;
        if (F.y > 0.2 && Math.cos(F.a * 5 + 0.5) > 0.96 - (F.y - 0.2) * 0.4) return Q.pat;
        return Q.l[F.ny > 0.4 ? 3 : 2];
      });
      // 凸线：口沿上方、腰线两道、钟肩一道
      for (const y of [0.062, 0.25, 0.296, 0.36]) addF(b, tor(radAt(OUT, y) + 0.002, 0.0055, 3, 24), metal(Q, () => 1), M(0, y, 0, Math.PI / 2, 0, 0));
      // 一圈波浪纹（两道凸线之间）
      addF(b, ttube(ringWave(OUT, 0.273, 0.011, 12, 0.003, 72), 0.0055, 0.0055, 3, 96), metal(Q, () => 2));
      // 钟肩铸字：一个十字和年份，凸起的亮字
      const yt = 0.3285, rr = radAt(OUT, yt) + 0.001, txt = '+1487';
      for (let i = 0; i < txt.length; i++) {
        const a = (i - (txt.length - 1) / 2) * 0.2;
        glyphs(b, txt[i], frame(Math.cos(a) * rr, yt, Math.sin(a) * rr, Math.cos(a), 0.18, Math.sin(a)), 0.0068, 0.004, Q.l[4]);
      }
      // 钟顶：圆台和吊环
      addF(b, cylS(0.05, 0.062, 0.022, 14), metal(Q, null, (F) => (F.ny > 0.5 ? 0.5 : 0)), M(0, 0.438, 0));
      addF(b, tor(0.028, 0.011, 5, 12, Math.PI), metal(Q, () => 1), M(0, 0.448, 0));
      // 钟舌：铁杆挂着铁球，球下拴一根编结的钟绳，末端一个绳结和流苏
      addF(b, cylS(0.008, 0.008, 0.28, 6), metal(P.iron), M(0, 0.19, 0));
      addF(b, sph(0.035, 8, 6), metal(P.iron, null, () => 0.5), M(0, 0.06, 0));
      b.add(ropeG([[0, 0.03, 0], [0.006, -0.04, 0.004], [-0.004, -0.11, 0.002], [0, -0.155, 0]], 0.009, P.canvas, 14, 5, 0.7));
      addF(b, sph(0.018, 8, 5), (F) => (Math.sin(F.a * 4 + F.y * 200) > 0 ? P.canvas.l[3] : P.canvas.l[1]), M(0, -0.165, 0, 0, 0, 0, 1, 1.2, 1));
      addF(b, cone(0.02, 0.045, 8), (F) => (F.ny < -0.5 ? P.canvas.l[1] : P.canvas.l[2]), M(0, -0.198, 0));
      xf(b, n0, M(0, 0.2, 0, 0, 0, Math.PI / 2 - 0.15, 1, 1, 1, 'XYZ'));
    },
  },
  seal: {
    name: '黄铜印章', value: 44, r: 0.1, h: 0.1, mass: 'light', mat: 'metal', carry: true,
    desc: '黄铜手印，印面是一艘单桅船和两个字母，正是这条商船的货主印。',
    build(b) {
      const n0 = b.n, Q = P.brass;
      // 直立着拼：印面朝下（y=-0.01），握柄朝上；最后侧放，印面朝 +x
      addF(b, cylS(0.046, 0.05, 0.02, 18), metal(Q, (F) => (F.ny < -0.9 ? -1 : 1)), M(0, 0, 0));
      addF(b, tor(0.044, 0.0032, 3, 22), Q.l[4], M(0, -0.0105, 0, Math.PI / 2, 0, 0));
      // 印面：一艘单桅船（船身、首尾翘、桅杆、方帆、桅顶小旗、船下两道浪）和两个反刻的字母，凸起的亮铜
      const fm = frame(0, -0.0105, 0, 0, -1, 0, 1, 0, 0), hi = Q.l[4];
      const R = (x, y, w, h, a = 0) => addF(b, box(w, h, 0.004), hi, mm(fm, M(x, y, 0.002, 0, 0, a)));
      R(0, -0.015, 0.046, 0.008); R(-0.026, -0.01, 0.014, 0.006, 0.6); R(0.026, -0.01, 0.014, 0.006, -0.6);
      R(-0.02, -0.006, 0.01, 0.008); R(0.02, -0.006, 0.01, 0.008);
      R(0, 0.009, 0.0036, 0.042); R(0, 0.011, 0.026, 0.021); R(0.006, 0.031, 0.01, 0.0035, -0.25);
      for (const x of [-0.012, 0.012]) addF(b, tor(0.007, 0.0016, 3, 6, Math.PI), hi, mm(fm, M(x, -0.029, 0.0015)));
      glyphs(b, 'R', mm(fm, M(-0.03, 0.006, 0)), 0.0042, 0.004, hi, 1, true);
      glyphs(b, 'S', mm(fm, M(0.03, 0.006, 0)), 0.0042, 0.004, hi, 1, true);
      // 车出来的握柄：收腰的颈、圆鼓的肚、顶上一个穿绳孔的圆钮；颈里积铜绿，钮被手攥得发亮
      const HP = [[0.04, 0.01], [0.03, 0.016], [0.018, 0.03], [0.014, 0.045], [0.02, 0.058], [0.016, 0.07], [0.011, 0.082], [0.014, 0.09], [0.024, 0.1], [0.026, 0.11], [0.018, 0.122], [0.006, 0.128], [0, 0.129]].map(([r, y]) => [r, 0.01 + (y - 0.01) * 0.8]);
      addF(b, lath(HP, 12), metal(Q, (F) => (F.y > 0.08 ? 1 : 0), (F) => ((F.y > 0.03 && F.y < 0.045) || (F.y > 0.07 && F.y < 0.078) ? 0.5 : 0)));
      addF(b, box(0.026, 0.006, 0.006), BLACK, M(0, 0.093, 0));
      xf(b, n0, M(0, 0.04, 0, 0, 0, 1.4));
    },
  },
  reliquary: {
    name: '镀金珐琅匣', value: 1200, r: 0.3, h: 0.34, mass: 'mid', mat: 'metal', precious: true,
    desc: '屋形小匣，鎏金铜胎上嵌着蓝绿珐琅和几颗红玻璃。匣底刻着它原本该送去的修道院。',
    build(b) {
      const G = P.gold, gm = metal(G, null, (F) => (F.y < 0.022 && F.ny < 0.3 ? 0.5 : 0));
      const EN = col(0x2456c8), ENL = col(0x4a7ce6), EN2 = col(0x1fae96), ENR = col(0xc82a2a), ENW = col(0xeae2c8);
      const CU = P.copper.l[2];
      // 四只小兽足 + 底座（鎏金磨薄的下沿透出铜胎）
      for (const [x, z] of [[-0.205, 0.115], [0.205, 0.115], [-0.205, -0.115], [0.205, -0.115]]) {
        addF(b, sph(0.022, 6, 4), (F) => (F.y < 0.008 ? CU : G.l[3]), M(x, 0.014, z, 0, 0, 0, 1, 0.7, 1));
        addF(b, box(0.03, 0.012, 0.03), gm, M(x, 0.024, z));
      }
      addF(b, box(0.462, 0.02, 0.282), metal(G, (F) => (F.ny > 0.5 ? 1 : 0), (F) => (F.ny < -0.5 ? 0.45 : 0)), M(0, 0.03, 0));
      addF(b, box(0.44, 0.15, 0.26), gm, M(0, 0.115, 0));
      // 前后两面各三个拱龛：蓝珐琅底、金拱框，龛里一个金色圣像（头光、长袍），拱角点红白珐琅
      for (const s of [-1, 1]) for (const x of [-0.14, 0, 0.14]) {
        const fm = frame(x, 0.112, s * 0.13, 0, 0, s);
        addF(b, box(0.118, 0.122, 0.004), x === 0 && s > 0 ? EN2 : EN, mm(fm, M(0, 0, 0.002)));
        for (const u of [-0.053, 0.053]) addF(b, box(0.01, 0.1, 0.006), metal(G, () => 1), mm(fm, M(u, -0.012, 0.004)));
        addF(b, tor(0.053, 0.005, 3, 6, Math.PI), metal(G, () => 1), mm(fm, M(0, 0.036, 0.004)));
        addF(b, box(0.116, 0.008, 0.006), metal(G, () => 1), mm(fm, M(0, -0.058, 0.004)));
        addF(b, cylS(0.017, 0.017, 0.004, 8), G.l[4], mm(fm, M(0, 0.02, 0.005, Math.PI / 2, 0, 0)));
        addF(b, cylS(0.011, 0.011, 0.006, 8), col(0xe8c8a0), mm(fm, M(0, 0.02, 0.007, Math.PI / 2, 0, 0)));
        addF(b, ext([[-0.026, -0.05], [0.026, -0.05], [0.014, 0.005], [-0.014, 0.005]], 0.006), (F) => (Math.abs(F.ny) > 0.5 || Math.abs(F.nx) > 0.5 ? G.l[3] : G.l[4]), mm(fm, M(0, -0.002, 0.005)));
        for (const u of [-0.04, 0.04]) stud(b, ...new THREE.Vector3(u, 0.05, 0.005).applyMatrix4(fm).toArray(), 0.006, u < 0 ? ENR : ENW, 0, 0, s);
      }
      // 两端山墙：绿珐琅底、一朵金花、中间一颗红玻璃
      for (const s of [-1, 1]) {
        const fm = frame(s * 0.221, 0.112, 0, s, 0, 0);
        addF(b, box(0.24, 0.12, 0.004), EN2, mm(fm, M(0, 0, 0.002)));
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; addF(b, oct(0.012), G.l[4], mm(fm, M(Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0.005, 0, 0, a, 1.4, 0.7, 0.5)), false); }
        cab(b, ...new THREE.Vector3(0, 0, 0.005).applyMatrix4(fm).toArray(), 0.014, 0xd8203a, s, 0, 0);
        addF(b, ext([[-0.13, 0], [0.13, 0], [0, 0.092]], 0.012), (F) => (Math.abs(F.nx) > 0.8 ? EN : G.l[3]), M(s * 0.222, 0.19, 0, 0, Math.PI / 2, 0));
        cab(b, s * 0.229, 0.222, 0, 0.012, 0x18b070, s, 0, 0);
      }
      // 屋顶两坡：蓝珐琅上压金菱格，格心点红白珐琅；檐口一道金圆边
      for (const s of [-1, 1]) {
        const RM = M(0, 0.2375, s * 0.0675, s * 0.613, 0, 0);
        addF(b, box(0.47, 0.016, 0.168), gm, RM);
        addF(b, box(0.43, 0.004, 0.13), (F) => (F.ny > 0.5 ? ENL : EN), mm(RM, M(0, 0.009, 0)));
        for (let k = -2; k <= 2; k++) for (const d of [-1, 1]) addF(b, box(0.15, 0.004, 0.006), metal(G, () => 1), mm(RM, M(k * 0.07, 0.011, 0, 0, d * 0.82, 0)));
        for (let k = -3; k <= 2; k++) stud(b, ...new THREE.Vector3(k * 0.07 + 0.035, 0.012, 0).applyMatrix4(RM).toArray(), 0.007, k % 2 ? ENR : ENW, ...new THREE.Vector3(0, 1, 0).transformDirection(RM).toArray());
        addF(b, cylS(0.008, 0.008, 0.47, 8), metal(G, () => 1), mm(RM, M(0, -0.002, s * 0.084, 0, 0, Math.PI / 2)));
      }
      // 屋脊：金脊、一排镂空小花，四颗大红玻璃（揭晓时一颗颗亮起），两端金顶珠嵌绿宝石
      addF(b, box(0.46, 0.03, 0.03), metal(G, () => 1), M(0, 0.29, 0));
      for (const x of [-0.24, -0.12, 0, 0.12, 0.24].map((v) => v * 0.92)) addF(b, oct(0.016), G.l[4], M(x, 0.312, 0, 0, 0.785, 0, 0.8, 1.2, 0.35), false);
      for (const x of [-0.18, -0.06, 0.06, 0.18]) { addF(b, cylS(0.026, 0.026, 0.008, 8), metal(G, () => 1), M(x, 0.306, 0)); cab(b, x, 0.31, 0, 0.022, 0xd0182a); }
      for (const s of [-1, 1]) { addF(b, sph(0.02, 6, 4), metal(G, () => 1), M(s * 0.222, 0.312, 0)); gem(b, s * 0.222, 0.332, 0, 0.01, GEM.emerald); }
      // 匣底刻的修道院名（细小的刻字）
      glyphs(b, 'SM', frame(0, 0.0195, 0, 0, -1, 0, 0, 0, 1), 0.006, 0.002, G.l[0]);
    },
  },
};

// 生成物件的网格（几何居中，底部 y=0）
export function buildItemGeometry(key, seed, opts = {}) {
  const def = CATALOG[key];
  const b = new Builder();
  const rng = new RNG(seed);
  def.build(b, rng, opts);
  return b.build();
}

// 附着物：泥块。与水下观察对应，揭晓时剥落
// 落点按面积在物件表面抽样（细节多的地方三角形又小又密，按个数抽会全挤在铆钉和字上）；朝下的面大多跳过
const MUDC = [0x7a6648, 0x5a4a36, 0x3e3226];
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _nN = new THREE.Vector3();
export function buildAttachments(geo, seed) {
  const b = new Builder();
  const rng = new RNG(seed ^ 0x55aa);
  const p = geo.attributes.position, n = geo.attributes.normal;
  const tris = p.count / 3, cum = new Float32Array(tris);
  let tot = 0;
  for (let t = 0; t < tris; t++) {
    _pa.fromBufferAttribute(p, t * 3); _pb.fromBufferAttribute(p, t * 3 + 1); _pc.fromBufferAttribute(p, t * 3 + 2);
    tot += _pn.crossVectors(_pb.sub(_pa), _pc.sub(_pa)).length() * 0.5; cum[t] = tot;
  }
  const pick = () => { const u = rng.next() * tot; let lo = 0, hi = tris - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; } return lo * 3; };
  const count = 9;
  for (let i = 0; i < count; i++) {
    const t = pick();
    _nN.set(n.getX(t), n.getY(t), n.getZ(t)).normalize();
    if (_nN.y < -0.2 && rng.next() < 0.7) continue;
    const x = (p.getX(t) + p.getX(t + 1) + p.getX(t + 2)) / 3, y = (p.getY(t) + p.getY(t + 1) + p.getY(t + 2)) / 3, z = (p.getZ(t) + p.getZ(t + 1) + p.getZ(t + 2)) / 3;
    _t1.crossVectors(_nN, Math.abs(_nN.y) < 0.9 ? _up : V(1, 0, 0)).normalize(); _t2.crossVectors(_nN, _t1);
    const N = _nN.clone(), at = (u, v, h = 0) => [x + _t1.x * u + _t2.x * v + N.x * h, y + _t1.y * u + _t2.y * v + N.y * h, z + _t1.z * u + _t2.z * v + N.z * h];
    // 泥：两三块压扁的泥团挤成一坨（朝外的面浅、贴着物件的深）
    const nl = 2 + Math.floor(rng.next() * 2);
    for (let k = 0; k < nl; k++) {
      const rr = 0.03 + rng.next() * 0.035, a = rng.next() * 6.28, d = k ? 0.02 + rng.next() * 0.025 : 0;
      addF(b, sph(rr, 6, 4), (F) => { const up = F.nx * N.x + F.ny * N.y + F.nz * N.z; return col(up > 0.75 ? MUDC[0] : up > 0 ? MUDC[1] : MUDC[2]); }, ori(...at(Math.cos(a) * d, Math.sin(a) * d, rr * 0.15), N.x, N.y, N.z, 1, 0.5, 0.85, a));
    }
  }
  if (b.count === 0) b.add(sph(0.01, 3, 2), col(0x5a4a36), M(0, 0, 0));
  return b.build();
}
