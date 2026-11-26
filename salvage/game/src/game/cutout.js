import * as THREE from 'three';
import { NET_R } from '../config.js';
import { N } from './tables.js';

// 自己的船挡住视线就挖开挡住的那一块，看得见后面的网和海底；没挡着就没有口子，船的其余部分照样实。
// 网：下到水里被船挡住就有，网走到哪口子跟到哪。鼠标指着的海底、白圈要落的那一处：按住左 Shift 看海底时才有，
// 不按就没有跟着鼠标的口子。手柄没有左 Shift，白圈要落的那一处一直有。多大在 配表.md「镂空放大」。
// 挖得开的是船身、甲板、甲板上的泥包和船员里挡在前面的那些像素；吊臂和网照样实，不挖。怎么画见 pipeline.js 的 holes。
// 全游戏一份。
const PTR_R = 1.7; // 鼠标的口子在海底那儿多大（米）
const PTR_PEEK = 0.9; // 靠近到底时再大多少
// 网口大小跟着设备变：每次现取
const ringR = () => NET_R + 0.35, netHoleR = () => NET_R + 0.55;
const NET_Y = 1.2; // 网低到离水面这么近才会被船挡住；挂在臂端、提在半空时比船高，不挖
const IN = 0.1, OUT = 0.12; // 口子张开、合上（秒）
const MAX = 8;
const BOX = [];
for (const x of [-7, 7]) for (const y of [-1, 6.5]) for (const z of [-4.2, 4.2]) BOX.push(new THREE.Vector3(x, y, z));
const _v = new THREE.Vector3();

export class Cutout {
  constructor(g) {
    this.g = g;
    this.list = new Map(); // 每个口子：在哪、多大、张开了几成
    this.out = [];
  }

  reset() {
    this.list.clear();
    this.out = [];
  }

  // 要挖开的那些：船身上除了吊机以外的每一样
  *parts() {
    const B = this.g.boat;
    for (const c of B.body.children) if (c !== B.crane.root) yield c;
  }

  // 画没有船的那一幅时，船身贴水那一圈白沫也不画（不然口子里海底上横着两道白）
  bare(on) {
    const b = this.g.world.water.material.uniforms.uBoat.value;
    if (on) { this.bx = b.x; b.x = 1e5; } else b.x = this.bx;
  }

  // 这一刻要看得见的：[名字, 位置, 半径, 挡在它前面多少米以内不挖]
  *spots() {
    const g = this.g, S = g.snap, no = g.netop;
    const kb = g.input.device === 'kb';
    if (g.moment.on ? kb && !g.peek.on : kb) {
      // 用鼠标、没按左 Shift：只有网的那一处
    } else if (g.moment.on) {
      // 镜头靠近的那一点（鼠标挪到别处时它慢慢跟过去）
      if (g.peek.on) yield ['ptr', g.peek.p, PTR_R + PTR_PEEK * g.peek.k, 0.2];
      const at = (s) => ['s:' + s.key, _v.set(s.x, s.y, s.z), ringR(), 0.2];
      if (g.mode === 'arm' && !g.castQ) {
        const s = S.mouse ? S.hov : S.cur;
        if (s && !s.far) yield at(s);
      } else {
        if (S.cast && !(no.busy && no.surfaced)) yield at(S.cast);
        if (S.mouse && S.hov && !S.hov.far && S.hov !== S.cast) yield at(S.hov);
      }
    } else if (g.mode === 'arm') {
      const A = g.arm, e = A.eval;
      if (e && e.restY > -100) yield ['aim', _v.set(A.aim.x, e.restY, A.aim.z), ringR(), 0.2];
    }
    // 网在水里；往甲板上转、放下时在船的上面，不挖
    if (no.netPos.y < NET_Y && !['swing', 'set', 'release'].includes(no.phase)) yield ['net', _v.copy(no.netPos).setY(no.netPos.y - 0.5), netHoleR(), netHoleR()];
  }

  update(dt) {
    const g = this.g, L = this.list, big = N('镂空放大'); // 表的 id，不是玩家看的
    for (const h of L.values()) h.on = false;
    if ((g.mode === 'arm' || g.mode === 'net') && g.cam.alt.w < 0.01) {
      for (const [key, p, r, near] of this.spots()) {
        let h = L.get(key);
        if (!h) L.set(key, (h = { key, p: new THREE.Vector3(), a: 0 }));
        h.p.copy(p);
        h.r = r * big;
        h.near = near;
        h.on = true;
      }
    }
    for (const h of L.values()) {
      h.a = h.on ? Math.min(1, h.a + dt / IN) : h.a - dt / OUT;
      if (h.a <= 0) L.delete(h.key);
    }
  }

  // 画之前：口子在低分辨率画面上的哪里（x、y、半径：像素；z：挖到多深为止）。船不在口子那儿就一个也不给
  holes(pipe) {
    const out = (this.out = []);
    if (!this.list.size) return null;
    const cam = pipe.renderCam, W = pipe.lowW, H = pipe.lowH;
    const ppm = H / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const px = (v) => {
      const d = -_v.copy(v).applyMatrix4(cam.matrixWorldInverse).z;
      _v.copy(v).project(cam);
      return { x: (_v.x * 0.5 + 0.5) * W, y: (_v.y * 0.5 + 0.5) * H, d };
    };
    // 船在画面上占的方框
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, behind = false;
    for (const c of BOX) {
      const q = px(this.g.boat.body.localToWorld(_v.copy(c)).clone());
      if (q.d < 0.5) { behind = true; break; }
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
    }
    if (behind) { x0 = y0 = -1e9; x1 = y1 = 1e9; }
    for (const h of this.list.values()) {
      const q = px(h.p);
      if (q.d < 0.5) continue;
      const u = Math.max(0, Math.min(1, h.a));
      const r = ((h.r * ppm) / q.d) * u * (2 - u);
      if (r < 0.5 || q.x + r < Math.max(0, x0) || q.x - r > Math.min(W, x1) || q.y + r < Math.max(0, y0) || q.y - r > Math.min(H, y1)) continue;
      out.push({ x: q.x, y: q.y, r, z: q.d - h.near });
      if (out.length >= MAX) break;
    }
    return out.length ? out : null;
  }

  // 这一点是不是正从口子里看得见（「看得见」的判断用：和画面上一样）
  opens(p) {
    if (!this.out.length) return false;
    const pipe = this.g.pipe, cam = pipe.renderCam;
    const d = -_v.copy(p).applyMatrix4(cam.matrixWorldInverse).z;
    _v.copy(p).project(cam);
    const x = (_v.x * 0.5 + 0.5) * pipe.lowW, y = (_v.y * 0.5 + 0.5) * pipe.lowH;
    return this.out.some((h) => d > h.z - 1 && (x - h.x) ** 2 + (y - h.y) ** 2 < h.r * h.r);
  }
}
