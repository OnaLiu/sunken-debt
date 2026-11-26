import * as THREE from 'three';
import { buildTerrain, buildLaneBuoys, seabedY } from './terrain.js';
import { buildWater } from './water.js';
import { buildSky, buildCoast } from './sky.js';
import { buildWreck, buildWreckCollider, buildWreckExtras, buildDecor, buildMarks, DECOR_AVOID } from '../sea/index.js';
import { toon } from '../render/materials.js';
import { TAG } from './collide.js';

// 静态世界：地形、装饰、水、天、沉船。天、水、远岸、航路浮标的样子、地形怎么铺是全游戏一份；
// 海底的形状和装饰、沉船、标杆是这片海的（sea/index.js）。每趟重来时只重置会变的东西（道具、生物、痕迹）。
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

    this.decor = buildDecor(DECOR_AVOID);
    this.scene.add(this.decor.group);

    const lane = buildLaneBuoys();
    this.scene.add(lane.group);
    this.lane = lane.group;
    this.buoys = lane.buoys;

    this.mark = buildMarks();
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
