import * as THREE from 'three';
import { U, toon } from '../render/materials.js';
import { mulberry32, fbm } from '../util/math.js';

// 天空、远岸和灯塔。只在低角度镜头里看得见，但给“港外航路”一个方向感。
export function buildSky() {
  const geo = new THREE.SphereGeometry(800, 32, 16);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: U.uSunDir,
      uTime: U.uTime,
      uTop: { value: new THREE.Color(0.44, 0.6, 0.7) },
      uHor: { value: new THREE.Color(0.95, 0.86, 0.72) },
      uLow: { value: new THREE.Color(0.78, 0.78, 0.76) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir; uniform float uTime;
      uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uLow;
      varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vDir);
        float y = d.y;
        vec3 col = mix(uHor, uTop, smoothstep(0.0, 0.55, y));
        col = mix(col, uLow, smoothstep(0.0, -0.08, y));
        float sd = max(dot(d, normalize(uSunDir)), 0.0);
        col += vec3(1.0, 0.82, 0.55) * pow(sd, 18.0) * 0.45;
        col += vec3(1.0, 0.95, 0.8) * step(0.9985, sd);
        // 层云
        vec2 cp = d.xz / max(y + 0.08, 0.04) * 1.6 + vec2(uTime * 0.01, 0.0);
        float c = n(cp * 0.8) * 0.6 + n(cp * 2.1) * 0.4;
        float cl = smoothstep(0.58, 0.72, c) * smoothstep(0.02, 0.2, y) * (1.0 - smoothstep(0.5, 0.8, y));
        vec3 cc = mix(vec3(0.98, 0.92, 0.84), vec3(1.0, 0.8, 0.62), pow(sd, 4.0));
        col = mix(col, cc, cl * 0.75);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  mesh.name = 'sky';
  return mesh;
}

// 北边远岸：一圈低矮的山和岬角，西北岬角上一座灯塔（港口方向）
export function buildCoast() {
  const group = new THREE.Group();
  const rnd = mulberry32(77);
  const pos = [], col = [], idx = [];
  const segs = 120;
  const a0 = -Math.PI * 0.98, a1 = -Math.PI * 0.02; // 北半圈
  for (let i = 0; i <= segs; i++) {
    const a = a0 + (a1 - a0) * (i / segs);
    const r = 520 + fbm(i * 0.08, 3, 3, 4) * 60;
    const x = Math.cos(a) * r - 60, z = Math.sin(a) * r * 0.75 - 120;
    let hgt = 18 + (fbm(i * 0.05, 1, 4, 8) * 0.5 + 0.5) * 70;
    // 西北岬角
    const head = Math.exp(-Math.pow((i - 28) / 7, 2));
    hgt = hgt * (1 - head * 0.6) + head * 26;
    pos.push(x, -2, z, x, hgt, z);
    const shade = 0.55 + rnd() * 0.05;
    col.push(shade * 0.8, shade * 0.85, shade * 0.9, shade * 0.86, shade * 0.88, shade * 0.88);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, toon({ vertexColors: true, color: 0x9aa3a6, side: THREE.DoubleSide }));
  group.add(land);

  // 灯塔
  const a = a0 + (a1 - a0) * (28 / segs);
  const r = 505;
  const lx = Math.cos(a) * r - 60, lz = Math.sin(a) * r * 0.75 - 120;
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 22, 8), toon({ color: 0xe8e2d6 }));
  tower.position.set(lx, 37, lz);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 4, 8), toon({ color: 0xb4443a }));
  band.position.set(lx, 34, lz);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 3, 8), toon({ color: 0xfff2c0, emissive: 0x806020 }));
  lamp.position.set(lx, 49.5, lz);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 8), toon({ color: 0x3a3a3a }));
  cap.position.set(lx, 52.5, lz);
  group.add(tower, band, lamp, cap);
  group.name = 'coast';
  return { group, lighthouse: new THREE.Vector3(lx, 40, lz) };
}
