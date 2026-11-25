import * as THREE from 'three';
import { GeoBuilder } from '../util/builder.js';
import { toon } from '../render/materials.js';
import { seabedY } from './terrain.js';
import { WRECK, wreckToWorld, HATCH_COVER } from './layout.js';
import { deckY } from './wreck.js';
import { mulberry32 } from '../util/math.js';
import { TAG } from './collide.js';

// 断下来躺在海底的主桅、横桁、残帆、索具，以及蟹藏身的那块斜靠的舱盖
export function buildWreckExtras(wreck) {
  const rnd = mulberry32(99);
  const group = new THREE.Group();
  group.name = 'wreck-extras';
  const b = new GeoBuilder();
  const rope = new GeoBuilder();
  const wood = new THREE.Color(0.5, 0.41, 0.31);
  const dark = new THREE.Color(0.36, 0.3, 0.24);
  const ropeC = new THREE.Color(0.52, 0.46, 0.34);

  // 主桅残桩顶在世界里的位置
  const stumpTop = new THREE.Vector3(0.5, deckY(0.5) + 2.3, 0).applyMatrix4(wreck.ship.matrixWorld);
  // 断桅倒向甲板一侧，顺坡躺下
  const base = wreckToWorld(0.9, 9.0);
  const dir = new THREE.Vector3(Math.sin(WRECK.yaw) * 0.86 - Math.cos(WRECK.yaw) * 0.0, 0, Math.cos(WRECK.yaw) * 0.86);
  // 往右舷外、稍朝船尾
  const sdir = new THREE.Vector3(Math.sin(WRECK.yaw), 0, Math.cos(WRECK.yaw));
  const bdir = new THREE.Vector3(Math.cos(WRECK.yaw), 0, -Math.sin(WRECK.yaw));
  dir.copy(sdir).multiplyScalar(0.8).addScaledVector(bdir, -0.6).normalize();
  const mastLen = 12.5;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = base.x + dir.x * mastLen * t, z = base.z + dir.z * mastLen * t;
    pts.push(new THREE.Vector3(x, seabedY(x, z) + 0.28 - 0.12 * t, z));
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const r0 = 0.3 - 0.012 * i, r1 = 0.3 - 0.012 * (i + 1);
    b.cylinder(pts[i], pts[i + 1], r0, r1, 8, wood.clone().multiplyScalar(0.92 + rnd() * 0.12), false);
  }
  // 断口那一头参差
  b.cylinder(pts[0].clone().addScaledVector(dir, -0.01), pts[0].clone().addScaledVector(dir, -0.45), 0.3, 0.26, 8, dark, true, (i) => (i % 2 ? 0.25 : -0.15));
  // 桅顶的瞭望台（圆筐），侧翻着
  {
    const c = pts[8];
    const up = new THREE.Vector3(0, 1, 0);
    const axis = dir.clone().cross(up).normalize();
    const ringC = c.clone().add(new THREE.Vector3(0, 0.55, 0));
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
      const p0 = ringC.clone().addScaledVector(dir, Math.cos(a0) * 0.85).addScaledVector(up, Math.sin(a0) * 0.85);
      const p1 = ringC.clone().addScaledVector(dir, Math.cos(a1) * 0.85).addScaledVector(up, Math.sin(a1) * 0.85);
      b.beam(p0, p1, axis, 0.5, 0.08, i % 3 === 0 ? dark : wood);
    }
  }
  // 横桁：斜压在桅上
  const yardC = pts[5].clone().add(new THREE.Vector3(0, 0.3, 0));
  const ydir = new THREE.Vector3(-dir.z, 0, dir.x).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.35);
  const y0 = yardC.clone().addScaledVector(ydir, -4.6), y1 = yardC.clone().addScaledVector(ydir, 3.8);
  y0.y = seabedY(y0.x, y0.z) + 0.15;
  y1.y = seabedY(y1.x, y1.z) + 0.2;
  b.cylinder(y0, yardC, 0.12, 0.16, 6, wood, false);
  b.cylinder(yardC, y1, 0.16, 0.11, 6, wood, true);

  const mastMesh = new THREE.Mesh(b.build(), toon({ vertexColors: true, moss: { color: 0x56683a, amount: 0.9 } }));
  mastMesh.castShadow = true;
  mastMesh.userData.tag = TAG.MAST;
  group.add(mastMesh);

  // 残帆：贴着海底铺开，一端压在横桁下，离横桁越远越被水流托起、慢慢飘
  {
    const sx = 16, sy = 10;
    const W = 7.0, H = 4.2;
    const along = ydir.clone();
    const away = new THREE.Vector3(-ydir.z, 0, ydir.x);
    if (away.dot(sdir) < 0) away.negate();
    const pos = [], cloth = [], col = [], idx = [];
    const vid = [];
    const base = new THREE.Color(0.62, 0.57, 0.47);
    for (let j = 0; j <= sy; j++) {
      vid.push([]);
      for (let i = 0; i <= sx; i++) {
        const u = i / sx - 0.5, v = j / sy;
        const p = yardC.clone().addScaledVector(along, u * W).addScaledVector(away, v * H * 0.8);
        const fold = Math.sin(u * 7.0 + v * 2.0) * 0.12 + Math.sin(v * 5.0) * 0.1;
        p.y = seabedY(p.x, p.z) + 0.12 + fold + v * v * 1.0;
        pos.push(p.x, p.y, p.z);
        cloth.push(v * v * (0.7 + 0.3 * Math.abs(Math.sin(u * 4))));
        const stain = 0.82 + 0.18 * Math.sin(u * 11 + v * 6) * Math.sin(v * 9 - u * 3);
        const c = base.clone().multiplyScalar(stain);
        // 商号的红十字纹
        if (Math.abs(u + 0.12) < 0.05 || Math.abs(v - 0.45) < 0.05) c.lerp(new THREE.Color(0.55, 0.26, 0.2), 0.8);
        col.push(c.r, c.g, c.b);
        vid[j].push(pos.length / 3 - 1);
      }
    }
    for (let j = 0; j < sy; j++) {
      for (let i = 0; i < sx; i++) {
        const u = i / sx - 0.5, v = j / sy;
        const hole = (u > 0.12 && u < 0.3 && v > 0.35 && v < 0.62) || (u < -0.32 && v > 0.55);
        const tear = v > 0.65 && rnd() < (v - 0.65) * 2.4;
        if (hole || tear) continue;
        const a0 = vid[j][i], a1 = vid[j][i + 1], b0 = vid[j + 1][i], b1 = vid[j + 1][i + 1];
        idx.push(a0, b0, a1, a1, b0, b1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aCloth', new THREE.Float32BufferAttribute(cloth, 1));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const sail = new THREE.Mesh(geo, toon({ vertexColors: true, cloth: 0.5, side: THREE.DoubleSide }));
    sail.castShadow = true;
    group.add(sail);
  }

  // 索具：从船舷拉到断桅，带一点垂度
  const shipPts = [
    new THREE.Vector3(0.0, 4.1, 3.5), new THREE.Vector3(1.4, 4.15, 3.5), new THREE.Vector3(-1.2, 4.1, 3.5),
    new THREE.Vector3(0.6, 4.1, -3.45), new THREE.Vector3(2.0, 4.15, -3.4),
  ].map((p) => p.applyMatrix4(wreck.ship.matrixWorld));
  const mastPts = [pts[3], pts[5], pts[7], pts[6], pts[9]];
  for (let i = 0; i < shipPts.length; i++) {
    const a = shipPts[i], c = mastPts[i].clone().add(new THREE.Vector3(0, 0.25, 0));
    const N = 10;
    let prev = a;
    for (let k = 1; k <= N; k++) {
      const t = k / N;
      const p = a.clone().lerp(c, t);
      p.y -= Math.sin(t * Math.PI) * (0.6 + i * 0.15);
      const floor = seabedY(p.x, p.z) + 0.05;
      if (p.y < floor) p.y = floor;
      rope.beam(prev, p, new THREE.Vector3(0, 1, 0), 0.05, 0.05, ropeC);
      prev = p;
    }
  }
  // 几根松掉的绳头，往上漂

  for (let i = 0; i < 4; i++) {
    const s = pts[2 + i * 2].clone().add(new THREE.Vector3(0, 0.2, 0));
    let prev = s;
    for (let k = 1; k <= 6; k++) {
      const p = s.clone().add(new THREE.Vector3(Math.sin(k * 0.9 + i) * 0.25, k * 0.38, Math.cos(k * 0.7 + i) * 0.25));
      rope.beam(prev, p, new THREE.Vector3(1, 0, 0), 0.045, 0.045, ropeC);
      prev = p;
    }
  }
  const ropeMesh = new THREE.Mesh(rope.build(), toon({ vertexColors: true }));
  ropeMesh.castShadow = true;
  group.add(ropeMesh);

  // 斜靠的舱盖：格栅板，一边搭在桅杆残段上，底下是蟹窝的暗缝
  {
    const hb = new GeoBuilder();
    const p = wreckToWorld(HATCH_COVER.along, HATCH_COVER.side);
    const y = seabedY(p.x, p.z);
    const g = new THREE.Group();
    const W = 1.9, D = 1.6;
    for (let i = 0; i < 6; i++) {
      const z = -D / 2 + (i + 0.5) * (D / 6);
      hb.box(new THREE.Vector3(0, 0, z), new THREE.Vector3(W / 2, 0, 0), new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0, 0.09), wood.clone().multiplyScalar(0.85 + (i % 2) * 0.1));
    }
    for (const x of [-W / 2 + 0.1, 0, W / 2 - 0.1]) {
      hb.box(new THREE.Vector3(x, 0.07, 0), new THREE.Vector3(0.07, 0, 0), new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0, D / 2), dark);
    }
    // 垫着它的一截碎木
    hb.box(new THREE.Vector3(0.0, -0.32, D / 2 - 0.25), new THREE.Vector3(0.9, 0, 0), new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(0, 0, 0.18), dark);
    const mesh = new THREE.Mesh(hb.build(), toon({ vertexColors: true, moss: { color: 0x56683a, amount: 0.8 } }));
    mesh.castShadow = true;
    g.add(mesh);
    g.position.set(p.x, y + 0.45, p.z);
    g.rotation.set(0.42, WRECK.yaw + HATCH_COVER.rot, 0, 'YXZ');
    group.add(g);
  }

  return { group, mastMesh, mastBase: pts[0], mastDir: dir };
}
