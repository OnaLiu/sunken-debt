import * as THREE from 'three';
import { buildTerrain, buildDecor, buildLaneBuoys, seabedY } from './terrain.js';
import { buildWater } from './water.js';
import { buildSky, buildCoast } from './sky.js';
import { buildWreck, buildWreckCollider } from './wreck.js';
import { buildWreckExtras } from './wreckExtras.js';
import { WRECK, LOOSE_ITEMS, OUTER_ITEMS, SHOAL_MARK, wreckToWorld } from './layout.js';
import { toon } from '../render/materials.js';
import { TAG } from './collide.js';

// 静态世界：地形、装饰、水、天、沉船。每趟重来时只重置会变的东西（道具、生物、痕迹）。
export class World {
  constructor() {
    this.scene = new THREE.Scene();
    this.sky = buildSky();
    this.scene.add(this.sky);
    const coast = buildCoast();
    this.scene.add(coast.group);
    this.lighthouse = coast.lighthouse;

    this.terrain = buildTerrain();
    this.scene.add(this.terrain);
    // 地形之外：一大片更深的海底，远处看过去只是深水，不会从水下透出天空
    const abyss = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), toon({ color: 0x26332f, flat: true }));
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.set(-55, -62, 0);
    abyss.name = 'abyss';
    this.scene.add(abyss);

    this.wreck = buildWreck();
    this.scene.add(this.wreck.group);
    this.wreckZ = buildWreckCollider(this.wreck);
    this.extras = buildWreckExtras(this.wreck);
    this.scene.add(this.extras.group);
    this.wreckZ.addMesh(this.extras.mastMesh, TAG.MAST);

    const avoid = [
      ...LOOSE_ITEMS.map((i) => ({ x: i.x, z: i.z, r: 1.4 })),
      ...OUTER_ITEMS.map((i) => ({ ...wreckToWorld(i.along, i.side), r: 1.3 })),
      { x: WRECK.x + 1.5, z: WRECK.z, r: 9.5 },
      { x: SHOAL_MARK.x, z: SHOAL_MARK.z, r: 1 },
    ];
    this.decor = buildDecor(avoid);
    this.scene.add(this.decor.group);

    const lane = buildLaneBuoys();
    this.scene.add(lane.group);
    this.lane = lane.group;
    this.buoys = lane.buoys;

    this.mark = buildShoalMark();
    this.scene.add(this.mark);

    this.water = buildWater();
    this.scene.add(this.water);
  }

  // 网能落到的面：海底或沉船舱里的淤泥面；返回 {y, tag}
  surfaceAt(x, z) {
    const sb = seabedY(x, z);
    const w = this.wreckZ.sample(x, z);
    if (w && w.y > sb) return { y: w.y, tag: w.tag };
    return { y: sb, tag: 0 };
  }
}

// 浅滩标杆：一根插在浅滩上的木杆，顶上一个十字和一面旧旗
function buildShoalMark() {
  const g = new THREE.Group();
  const wood = toon({ color: 0x6a5440 });
  const paint = toon({ color: 0xd9c9a0 });
  const flag = toon({ color: 0xb84a36, cloth: 0.25, side: THREE.DoubleSide });
  const y0 = seabedY(SHOAL_MARK.x, SHOAL_MARK.z);
  const h = -y0 + 4.2;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, h, 6), wood);
  pole.position.y = y0 + h / 2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.6, 6), paint);
  band.position.y = 1.4;
  const cross = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.1), wood);
  cross.position.y = 3.6;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6, 6, 2), flag);
  f.geometry.translate(0.5, 0, 0);
  f.position.set(0.1, 3.85, 0);
  g.add(pole, band, cross, f);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(SHOAL_MARK.x, 0, SHOAL_MARK.z);
  g.rotation.y = 0.4;
  return g;
}
