// 网印（B8 烙印）：网架压在泥上留下的印子，整趟不消失——“这里我捞过”。
//   网圈压出一道槽（外沿挤起一道泥埂），八个配重各砸一个方坑，八根爪收拢时往里刮出八道沟、沟头堆一小撮泥，
//   网兜底蹭过的地方坑坑洼洼；取走的东西各留一个坑（坑沿翻起一圈）。
// 不是真的改地形：一块贴着海底的圆片，片元里按一张假的高低图算明暗（迎着太阳的坡亮、背着的暗、坑底暗），再过一遍水。
// 刚翻开的泥是湿的、颜色深，半分钟里慢慢变成和周围差不多（但印子还在）。
// 触底那一刻就建好，但藏着；提网时 reveal()，泥团沉下去的这两秒里慢慢显出来。
// 之后再把网对准这里（网口罩住旧印子），印子亮一下、泥埂上一道浅色的边：这里我捞过（hi，netfx.js 给）。
import * as THREE from 'three';
import { SHARED, WATER_GLSL } from '../render/materials.js';

const NR = 18, NS = 72, PITS = 4;

export class NetImprint {
  constructor(group, x, z, R, surf, hull = false) {
    this.x = x; this.z = z; this.R = R; this.np = 0;
    this.u = {
      uC: { value: new THREE.Vector2(x, z) }, uR: { value: R }, uBorn: { value: 1e9 }, uHull: { value: hull ? 1 : 0 },
      uPits: { value: Array.from({ length: PITS }, () => new THREE.Vector4(0, 0, 0, 0)) }, uNP: { value: 0 },
      uSeed: { value: (x * 0.37 + z * 0.71) % 10 }, uHi: { value: 0 },
    };
    this.mesh = new THREE.Mesh(drape(x, z, R + 0.62, surf), imprintMaterial(this.u));
    this.mesh.renderOrder = 2; this.mesh.frustumCulled = false; this.mesh.receiveShadow = false;
    group.add(this.mesh);
  }
  covers(x, z) { return Math.hypot(x - this.x, z - this.z) < this.R + 0.1; }
  // 取走的东西留一个坑（这一网的印子里最多 4 个）
  addPit(x, z, r) {
    if (this.np >= PITS) return false;
    this.u.uPits.value[this.np++].set(x, z, Math.max(0.2, r * 0.9), Math.min(0.14, 0.06 + r * 0.07));
    this.u.uNP.value = this.np;
    return true;
  }
  // 提网：从 t 起慢慢显出来
  reveal(t) { if (this.u.uBorn.value > t) this.u.uBorn.value = t; }
  get shown() { return this.u.uBorn.value < 1e8; }
  // 对准这里时亮多少（0~1）
  set hi(v) { this.u.uHi.value = v; }
  get hi() { return this.u.uHi.value; }
}

// 预热用（标题期间编好着色器）
export function imprintWarmMesh() {
  const u = { uC: { value: new THREE.Vector2() }, uR: { value: 1.35 }, uBorn: { value: 0 }, uHull: { value: 0 }, uPits: { value: Array.from({ length: PITS }, () => new THREE.Vector4()) }, uNP: { value: 0 }, uSeed: { value: 0 }, uHi: { value: 0 } };
  return new THREE.Mesh(drape(0, 0, 2, () => -5), imprintMaterial(u));
}

// 贴着海底起伏的一块圆（极坐标网格）
function drape(cx, cz, RM, surf) {
  const pos = [cx, surf(cx, cz) + 0.03, cz], idx = [];
  for (let i = 1; i <= NR; i++) for (let j = 0; j < NS; j++) {
    const a = j / NS * Math.PI * 2, r = RM * i / NR;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    pos.push(x, surf(x, z) + 0.03, z);
  }
  for (let j = 0; j < NS; j++) idx.push(0, 1 + ((j + 1) % NS), 1 + j);
  for (let i = 1; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = 1 + (i - 1) * NS + j, b = 1 + (i - 1) * NS + (j + 1) % NS, c = 1 + i * NS + j, d = 1 + i * NS + (j + 1) % NS;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

function imprintMaterial(u) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({}, SHARED, u),
    transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW;
      uniform vec2 uC; uniform float uR; uniform float uBorn; uniform float uHull; uniform vec4 uPits[${PITS}]; uniform int uNP; uniform float uSeed; uniform float uHi;
      ${WATER_GLSL}
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
      float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
      // 假的高低（米，负的是凹下去）
      float H(vec2 p) {
        vec2 q = p - uC; float r = length(q);
        float h = -0.055 * exp(-pow((r - uR) / 0.085, 2.0)) + 0.022 * exp(-pow((r - uR - 0.21) / 0.11, 2.0));
        for (int k = 0; k < 8; k++) {
          float a = float(k) / 8.0 * 6.2831853;
          vec2 nr = vec2(cos(a), sin(a)), tg = vec2(-nr.y, nr.x), d = q - nr * uR;
          float sd = sdBox(vec2(dot(d, tg), dot(d, nr) + 0.02), vec2(0.17, 0.115));
          h += -0.075 * (1.0 - smoothstep(-0.035, 0.03, sd)) + 0.02 * exp(-pow(max(sd, 0.0) / 0.055, 2.0)) * step(0.0, sd);
          // 爪往里收：一道沟，沟头堆一小撮泥
          float b = a + 0.2; vec2 dr = vec2(cos(b), sin(b));
          float along = dot(q, dr), perp = abs(dot(q, vec2(-dr.y, dr.x)));
          float r0 = uR * 0.4, r1 = uR - 0.1;
          float seg = smoothstep(r0, r0 + 0.14, along) * (1.0 - smoothstep(r1 - 0.08, r1, along));
          h += -0.032 * exp(-pow(perp / 0.036, 2.0)) * seg + 0.022 * exp(-pow((along - r0 + 0.04) / 0.07, 2.0)) * exp(-pow(perp / 0.08, 2.0));
        }
        // 网兜蹭过：坑坑洼洼
        h += (vn(q * 5.5 + uSeed) - 0.5) * 0.026 * (1.0 - smoothstep(uR * 0.55, uR * 0.95, r));
        for (int i = 0; i < ${PITS}; i++) {
          if (i >= uNP) break;
          vec4 P = uPits[i]; float d = length(p - P.xy) / P.z;
          h += -P.w * pow(max(0.0, 1.0 - d * d), 1.4) + P.w * 0.38 * exp(-pow((d - 1.12) / 0.22, 2.0));
        }
        return h;
      }
      void main() {
        float age = uTime - uBorn;
        float show = smoothstep(0.15, 2.0, age);
        if (show <= 0.0) discard;
        vec2 p = vW.xz; float r = length(p - uC);
        float e = 0.025, h0 = H(p), hx = H(p + vec2(e, 0.0)), hz = H(p + vec2(0.0, e));
        vec3 n = normalize(vec3(-(hx - h0) / e * 3.3, 1.0, -(hz - h0) / e * 3.3));
        vec3 L = normalize(uSunDirW);
        float lit = dot(n, L) - L.y;
        float fresh = exp(-max(age, 0.0) / 30.0);
        float dark = clamp(-lit * 3.6, 0.0, 1.0) * 0.9 + clamp(-h0 * 7.5, 0.0, 1.0) * (0.36 + 0.33 * fresh);
        dark = max(dark, fresh * 0.24 * (1.0 - smoothstep(uR * 0.85, uR + 0.32, r)));
        float lite = clamp(lit * 3.2, 0.0, 1.0) * 0.7;
        float a = max(dark, lite);
        vec3 c = dark >= lite ? vec3(0.15, 0.12, 0.088) : vec3(0.86, 0.8, 0.64);
        a *= show * (uHull > 0.5 ? 0.5 : 1.0) * (1.0 - smoothstep(uR + 0.34, uR + 0.6, r)) * (1.0 + 0.6 * uHi);
        // 对准这里：泥埂上一道浅色的边
        float edge = uHi * show * exp(-pow((r - uR - 0.2) / 0.07, 2.0)) * 0.55;
        if (edge > a * 0.6) { c = vec3(0.93, 0.88, 0.72); a = max(a, edge); }
        if (a < 0.01) discard;
        c = applyWater(c, vW, vec3(0.0, 1.0, 0.0), 1.0);
        gl_FragColor = vec4(c, min(a, 0.92));
        #include <colorspace_fragment>
      }`,
  });
}
