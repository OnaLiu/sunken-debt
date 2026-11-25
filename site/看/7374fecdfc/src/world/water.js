import * as THREE from 'three';
import { U } from '../render/materials.js';
import { COMMON } from '../render/shaders.js';

// 水面的波：JS 和 GLSL 用同一套参数，船的起伏和水面对得上
const WAVES = [
  // dirX, dirZ, 波长, 振幅, 速度
  [0.9, 0.42, 23, 0.11, 1.0],
  [-0.3, 0.95, 15, 0.07, 1.25],
  [0.6, -0.8, 9, 0.035, 1.6],
];

export function waveHeight(x, z, t) {
  let h = 0;
  for (const [dx, dz, L, A, S] of WAVES) {
    const k = (Math.PI * 2) / L;
    const len = Math.hypot(dx, dz);
    h += A * Math.sin((x * dx + z * dz) / len * k + t * S * Math.sqrt(9.8 * k));
  }
  return h;
}

const WAVE_GLSL = WAVES.map(([dx, dz, L, A, S]) => {
  const len = Math.hypot(dx, dz);
  const k = (Math.PI * 2) / L;
  const w = S * Math.sqrt(9.8 * k);
  return `{ vec2 d = vec2(${(dx / len).toFixed(5)}, ${(dz / len).toFixed(5)}); float ph = dot(p, d) * ${k.toFixed(5)} + t * ${w.toFixed(5)};
    h += ${A.toFixed(4)} * sin(ph); g += d * ${(A * k).toFixed(5)} * cos(ph); }`;
}).join('\n');

export function buildWater() {
  const geo = new THREE.PlaneGeometry(1400, 1400, 180, 180);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...U,
      uSkyTop: { value: new THREE.Color(0.5, 0.66, 0.74) },
      uSkyHor: { value: new THREE.Color(0.93, 0.86, 0.74) },
      uWake: { value: Array.from({ length: 24 }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uBoat: { value: new THREE.Vector4(0, 0, 0, 0) },
      uDist: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: /* glsl */ `
      ${COMMON}
      varying vec3 vWorld;
      void waves(vec2 p, float t, out float h, out vec2 g){
        h = 0.0; g = vec2(0.0);
        ${WAVE_GLSL}
      }
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float h; vec2 g;
        waves(wp.xz, uTime, h, g);
        wp.y += h;
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHor;
      uniform vec4 uWake[24];
      uniform vec4 uBoat;
      varying vec3 vWorld;
      void waves(vec2 p, float t, out float h, out vec2 g){
        h = 0.0; g = vec2(0.0);
        ${WAVE_GLSL}
      }
      void main(){
        float h; vec2 g;
        waves(vWorld.xz, uTime, h, g);
        // 细碎的波纹
        vec2 rp = vWorld.xz * 0.9;
        float r1 = vnoise(rp + vec2(uTime * 0.35, uTime * 0.2));
        float r2 = vnoise(rp * 1.9 - vec2(uTime * 0.3, -uTime * 0.25));
        vec2 rg = vec2(r1 - 0.5, r2 - 0.5) * 0.22 * uWobble + vec2(0.0);
        vec3 N = normalize(vec3(-g.x - rg.x, 1.0, -g.y - rg.y));
        vec3 V = normalize(cameraPosition - vWorld);
        float dist = length(cameraPosition - vWorld);
        float ndv = max(dot(N, V), 0.0);
        float F = 0.025 + 0.975 * pow(1.0 - ndv, 5.0);
        vec3 R = reflect(-V, N);
        float sky = clamp(R.y, 0.0, 1.0);
        vec3 refl = mix(uSkyHor, uSkyTop, pow(sky, 0.6));
        // 太阳在水面的碎光：一粒一粒地闪
        float sp = pow(max(dot(R, uSunDir), 0.0), 60.0);
        // 一格一格的小亮点，各自错开时间闪：越靠近太阳倒影越密
        vec2 cell = floor(vWorld.xz * 10.0);
        float ph = hash12(cell * 1.37);
        float hh = hash12(cell + floor(uTime * 2.2 + ph * 5.0) * 17.31);
        float spark = step(1.0 - 0.055 * smoothstep(0.06, 0.6, sp), hh) * step(0.02, sp);
        // 零星的波光
        float tw = step(0.93, vnoise(vWorld.xz * 3.4 + vec2(uTime * 0.9, uTime * 0.6))) * step(0.6, vnoise(vWorld.xz * 0.25 - uTime * 0.12));
        float ln = tw;
        float lineFade = 1.0 - smoothstep(25.0, 70.0, dist);
        // 船尾白浪
        float foam = 0.0;
        for (int i = 0; i < 24; i++) {
          vec4 w = uWake[i];
          if (w.w <= 0.0) continue;
          float d = length(vWorld.xz - w.xy);
          float rr = w.z;
          // 一圈细碎的白沫：中间散开，边上留一道
          float ring = smoothstep(rr * 0.55, rr * 0.85, d) * (1.0 - smoothstep(rr * 0.85, rr, d));
          float core = 1.0 - smoothstep(0.0, rr * 0.6, d);
          float n = vnoise(vWorld.xz * 4.2 + float(i) * 7.0 + uTime * 0.6);
          float m = max(ring, core * 0.6) * w.w;
          foam = max(foam, step(0.62, n * 0.55 + m * 0.75) * m);
        }
        // 船身贴水处的一圈白沫
        {
          vec2 bp = vWorld.xz - uBoat.xy;
          float c = cos(uBoat.z), s = sin(uBoat.z);
          vec2 lp = vec2(c * bp.x - s * bp.y, s * bp.x + c * bp.y);
          // 船身水线的形状：船头收尖、船尾略收
          float hb = lp.x > 0.5 ? 2.12 * sqrt(max(0.0, 1.0 - pow(min(1.0, (lp.x - 0.5) / 5.75), 2.2))) : 2.12 - 0.3 * clamp((-lp.x - 2.0) / 4.0, 0.0, 1.0);
          float bd = max(abs(lp.y) - hb, max(lp.x - 6.2, -lp.x - 6.0));
          float edge = (1.0 - smoothstep(0.0, 0.35 + uBoat.w * 0.5, bd)) * step(-0.05, bd);
          float n = vnoise(vWorld.xz * 3.0 + uTime * 1.3);
          foam = max(foam, edge * step(0.45, n + edge * 0.3) * (0.55 + uBoat.w * 0.45));
        }
        float alpha = clamp(F * 1.1 + 0.02, 0.0, 0.97);
        vec3 col = refl;
        col += uSunCol * spark * 0.9;
        alpha = max(alpha, spark * 0.65);
        col = mix(col, vec3(0.92, 0.97, 0.98), ln * lineFade * 0.7);
        alpha = max(alpha, ln * lineFade * 0.22);
        col = mix(col, vec3(0.96, 0.98, 0.98), foam);
        alpha = max(alpha, foam * 0.92);
        // 远处的海面与天际雾融在一起
        float far = smoothstep(150.0, 600.0, dist);
        col = mix(col, uFogCol, far * 0.7);
        alpha = mix(alpha, 1.0, far);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'water';
  mesh.renderOrder = 10;
  mesh.frustumCulled = false;
  return mesh;
}

export function followWater(mesh, cx, cz) {
  const step = 1400 / 180;
  mesh.position.x = Math.round(cx / step) * step;
  mesh.position.z = Math.round(cz / step) * step;
}
