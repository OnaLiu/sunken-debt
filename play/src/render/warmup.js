// 着色器预热：标题画面期间，把游戏中途才第一次出现的材质（作业圈、网包、揭宝泥壳与光环……）在后台并行编译好。
// 否则第一次进入作业、第一次揭宝时，浏览器要当场编译着色器，画面会停顿半秒到一秒多。
import * as THREE from 'three';
import { Builder, col, M } from '../core/geo.js';
import { worldMat } from './materials.js';
import { revealWarmMeshes } from '../game/reveal.js';
import { imprintWarmMesh } from '../world/imprint.js';
import { keepWarmMeshes } from '../game/keep.js';

export async function warmShaders(view, game, aimViz) {
  if (!view.renderer.compileAsync) return;
  const extra = new THREE.Group();
  for (const m of revealWarmMeshes()) extra.add(m);
  extra.add(imprintWarmMesh()); // 网印（B8）：第一网提起来时才第一次出现
  for (const m of keepWarmMeshes()) extra.add(m);
  const b = new Builder();
  b.add(new THREE.IcosahedronGeometry(0.5, 1), col(0x5a4a34), M(0, 0, 0, 0, 0, 0, 1, 0.7, 1));
  extra.add(new THREE.Mesh(b.build(), worldMat({ key: 'netload' })));
  try {
    await view.prepare(view.scene);
    await view.prepare(view.overlay, true);
    if (aimViz && aimViz.sgroup) await view.prepare(aimViz.sgroup);
    await view.prepare(extra);
  } catch (e) { /* 预热失败不影响游戏，只是第一次出现时可能慢一点 */ }
  view.warmKeep = extra; // 留住材质：程序不会因为材质被回收而释放
}
