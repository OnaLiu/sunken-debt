import * as THREE from 'three';
import { LOW_W, LOW_H, LOW_PAD, VIEW_W, VIEW_H } from '../config.js';
import { U } from './materials.js';

THREE.ColorManagement.enabled = false;

// 像素管线：阴影 → 低分辨率场景（带深度）→ 描边/量化/亚像素平移 → 放大到 1920×1080
export class Pipeline {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(VIEW_W, VIEW_H, false);
    this.renderer.autoClear = true;
    this.renderer.sortObjects = true;

    this.lowW = LOW_W + LOW_PAD * 2;
    this.lowH = LOW_H + LOW_PAD * 2;
    // 深度带一个模板位：自己的船画上去时记一下，网口白圈遇到这些像素就不画（白圈别的时候不做遮挡，隔着沉船也看得见）
    const depth = new THREE.DepthTexture(this.lowW, this.lowH);
    depth.format = THREE.DepthStencilFormat;
    depth.type = THREE.UnsignedInt248Type;
    depth.minFilter = depth.magFilter = THREE.NearestFilter;
    this.low = new THREE.WebGLRenderTarget(this.lowW, this.lowH, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      stencilBuffer: true,
      depthTexture: depth,
      type: THREE.UnsignedByteType,
    });

    // 阴影
    this.shadowSize = 2048;
    const sd = new THREE.DepthTexture(this.shadowSize, this.shadowSize);
    sd.type = THREE.UnsignedIntType;
    sd.minFilter = sd.magFilter = THREE.NearestFilter;
    this.shadowRT = new THREE.WebGLRenderTarget(this.shadowSize, this.shadowSize, {
      depthBuffer: true,
      depthTexture: sd,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    // 阴影覆盖的半径（米）：跟着镜头远近变。近景冲洗时只罩甲板一小块，阴影的格子比画面的像素还细，边上不出台阶
    this.shadowSpan = 46;
    this.shadowCam = new THREE.OrthographicCamera(-this.shadowSpan, this.shadowSpan, this.shadowSpan, -this.shadowSpan, 1, 260);
    U.uShadowMap.value = sd;
    U.uShadowTexel.value = 1 / this.shadowSize;
    this._bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);

    this.offset = new THREE.Vector2();
    this.quad = this._makeComposite();
    this.renderCam = new THREE.PerspectiveCamera(35, this.lowW / this.lowH, 0.5, 900);
    this.snap = true;
    this._swap = [];
  }

  _makeComposite() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.low.texture },
        tDepth: { value: this.low.depthTexture },
        uLowSize: { value: new THREE.Vector2(this.lowW, this.lowH) },
        uPad: { value: LOW_PAD },
        uOff: { value: this.offset },
        uNear: { value: 0.5 },
        uFar: { value: 900 },
        uInvVP: { value: new THREE.Matrix4() },
        uCam: { value: new THREE.Vector3() },
        uKView: U.uKView,
        uKDown: U.uKDown,
        uVignette: { value: 0.22 },
        uFlash: { value: 0 },
        uDim: { value: 0 },
        // 压暗时留一圈亮的（揭晓时东西在的地方）：xy = 画面上的中心（0..1），z = 半径（按画面高算），w = 过渡宽度；z = 0 时整屏一样压
        uFocus: { value: new THREE.Vector4(0.5, 0.5, 0, 0.2) },
        uGrade: { value: 0 },
        uTime: U.uTime,
        uSunDir: U.uSunDir,
        uShafts: { value: 1 },
        uMurk: { value: 0 },
        // 一道扫过去的光（第一眼看见沉船）：xy = 中心，z = 光带离中心走到哪了，w = 强度；uBeamDir = 走的方向
        uBeam: { value: new THREE.Vector4(0, 0, 0, 0) },
        uBeamDir: { value: new THREE.Vector2(1, 0) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tColor; uniform sampler2D tDepth;
        uniform vec2 uLowSize; uniform float uPad; uniform vec2 uOff;
        uniform float uNear; uniform float uFar;
        uniform mat4 uInvVP; uniform vec3 uCam;
        uniform float uKView; uniform float uKDown;
        uniform float uVignette; uniform float uFlash; uniform float uDim; uniform float uGrade; uniform vec4 uFocus;
        uniform float uTime; uniform vec3 uSunDir; uniform float uShafts; uniform float uMurk;
        uniform vec4 uBeam; uniform vec2 uBeamDir;
        varying vec2 vUv;
        float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        float vn(vec2 p){
          vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        // 水下的光柱：顺着视线在水里走过的一段取几个点，每点沿折射后的阳光方向追回水面，
        // 水面那里亮的地方往下就是一道光。越深越淡，离眼睛越远越被水吃掉
        float shaftAt(vec3 Q, vec3 Ld){
          vec2 s = Q.xz + Ld.xz * (-Q.y / Ld.y);
          float big = vn(s * 0.15 + vec2(uTime * 0.035, uTime * 0.021));
          float fine = vn(s * 0.5 - vec2(uTime * 0.09, -uTime * 0.05));
          return smoothstep(0.46, 0.8, big) * (0.45 + 0.55 * fine);
        }
        // 扫光：水面上一条宽光带（按光线进水的那一点算），横着从船尾走到船头
        float beamAt(vec2 s){
          vec2 r = s - uBeam.xy;
          float u = dot(r, uBeamDir) - uBeam.z;
          float v = dot(r, vec2(-uBeamDir.y, uBeamDir.x));
          return exp(-u * u / 7.0) * smoothstep(11.0, 4.0, abs(v));
        }
        float lin(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }
        float bayer4(vec2 p){
          vec2 q = mod(floor(p), 4.0);
          float i = q.x + q.y * 4.0;
          // 4x4 Bayer 表
          float m[16];
          m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0; m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
          m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0; m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
          for (int k = 0; k < 16; k++) if (float(k) == i) return m[k] / 16.0;
          return 0.0;
        }
        vec3 worldAt(vec2 uv, float d){
          vec4 p = uInvVP * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
          return p.xyz / p.w;
        }
        void main(){
          vec2 inner = uLowSize - 2.0 * uPad;
          vec2 lp = vUv * inner + uPad + uOff;
          vec2 texel = floor(lp) + 0.5;
          vec2 px = 1.0 / uLowSize;
          vec2 uv = texel * px;
          vec4 c0 = texture2D(tColor, uv);
          vec3 col = c0.rgb;
          float d = texture2D(tDepth, uv).r;
          float zc = lin(d);
          float zl = lin(texture2D(tDepth, uv - vec2(px.x, 0.0)).r);
          float zr = lin(texture2D(tDepth, uv + vec2(px.x, 0.0)).r);
          float zu = lin(texture2D(tDepth, uv + vec2(0.0, px.y)).r);
          float zd = lin(texture2D(tDepth, uv - vec2(0.0, px.y)).r);
          float th = max(0.12, zc * 0.045);
          float vis = 1.0;
          if (d < 0.99999) {
            vec3 P = worldAt(uv, d);
            if (P.y < 0.0) {
              float depth = -P.y;
              float frac = uCam.y > 0.0 ? depth / max(uCam.y - P.y, 0.001) : 1.0;
              float path = length(P - uCam) * frac;
              vis = exp(-(path * uKView + depth * uKDown) * 1.15);
              // 水下的细碎东西（草叶、碎壳）不描边：只给大轮廓描，海底不起黑渣
              th *= 1.0 + 0.7 * smoothstep(0.5, 3.0, depth);
            }
          }
          float edge = 0.0;
          edge += step(th, zl - zc); edge += step(th, zr - zc);
          edge += step(th, zu - zc); edge += step(th, zd - zc);
          edge = min(edge, 1.0);
          col = mix(col, col * 0.5, edge * vis);
          // 能捞的东西（海底的散货、在外面的蟹，alpha 记成 0）：外面一圈暗边、贴边一圈亮边，小件在亮沙上、深水里都和背景分得开。
          // 跟着水的能见度淡出，和「看得见」的判断（sight.js 里 0.085）对齐：判断说看得见的，画面上认得出；说看不见的，轮廓也没了
          {
            float mc = step(c0.a, 0.5);
            float ml = step(texture2D(tColor, uv - vec2(px.x, 0.0)).a, 0.5);
            float mr = step(texture2D(tColor, uv + vec2(px.x, 0.0)).a, 0.5);
            float mu = step(texture2D(tColor, uv + vec2(0.0, px.y)).a, 0.5);
            float md = step(texture2D(tColor, uv - vec2(0.0, px.y)).a, 0.5);
            // 暗边只画在东西后面的背景上，挡在它前面的不画
            float ring = max(max(ml * step(zl - 0.3, zc), mr * step(zr - 0.3, zc)), max(mu * step(zu - 0.3, zc), md * step(zd - 0.3, zc))) * (1.0 - mc);
            float rim = mc * (1.0 - min(min(ml, mr), min(mu, md)));
            float sv = smoothstep(0.06, 0.1, vis);
            col = mix(col, col * 0.32, ring * sv * 0.9);
            col = mix(col, col * 1.3 + vec3(0.035, 0.04, 0.035), rim * sv * 0.75);
          }
          // 大轮廓经过最近那几秒：水下的颜色往暗蓝压一点（越深压得越多，船和水面不动）
          if (uMurk > 0.0 && uCam.y > 0.0) {
            vec3 Pm = d < 0.99999 ? worldAt(uv, d) : worldAt(uv, 0.99999);
            col *= mix(vec3(1.0), vec3(0.6, 0.68, 0.8), uMurk * smoothstep(0.3, 5.0, -Pm.y));
          }
          // 光柱
          if (uShafts > 0.0 && uCam.y > 0.0) {
            vec3 P = d < 0.99999 ? worldAt(uv, d) : worldAt(uv, 0.99999);
            if (P.y < 0.0) {
              vec3 rd = P - uCam;
              float tS = uCam.y / max(-rd.y, 1e-4);
              vec3 S = uCam + rd * tS;
              float L = length(P - S);
              vec3 Ld = normalize(vec3(uSunDir.x * 0.7, uSunDir.y, uSunDir.z * 0.7));
              float acc = 0.0;
              float j = bayer4(texel + 2.0);
              for (int i = 0; i < 7; i++) {
                float f = (float(i) + j) / 7.0;
                vec3 Q = mix(S, P, f * f);
                float dl = L * f * f;
                float sh = shaftAt(Q, Ld);
                if (uBeam.w > 0.0) sh += uBeam.w * 1.6 * beamAt(Q.xz + Ld.xz * (-Q.y / Ld.y));
                acc += sh * exp(-(-Q.y) * 0.05 - dl * 0.045) * (0.6 + 0.4 * f);
              }
              acc = acc / 7.0 * min(1.0, L / 14.0);
              col += vec3(0.45, 0.72, 0.74) * acc * 0.6 * uShafts;
              // 扫光落在东西上：船身、海底被照亮一条，随光带走过去
              if (uBeam.w > 0.0) col += vec3(0.62, 0.86, 0.8) * uBeam.w * 0.55 * beamAt(P.xz + Ld.xz * (-P.y / Ld.y)) * exp(-L * 0.035) * smoothstep(0.2, 2.0, -P.y);
            }
          }
          // 调色：轻微压暗边缘
          vec2 c = vUv - 0.5;
          float vg = 1.0 - dot(c, c) * uVignette * 2.2;
          col *= vg;
          float dimK = uDim;
          if (uFocus.z > 0.0) dimK *= smoothstep(uFocus.z, uFocus.z + uFocus.w, length((vUv - uFocus.xy) * vec2(1.7778, 1.0)));
          col = mix(col, col * vec3(0.55, 0.62, 0.78), dimK);
          col += uFlash * vec3(1.0, 0.92, 0.75);
          // 量化 + 抖动，给渐变一点像素颗粒。档位细一些：暗处的水不再是一片"+"字花
          float L = 60.0;
          float b = bayer4(texel) - 0.5;
          col = floor(col * L + 0.5 + b * 0.62) / L;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { mat, scene, cam };
  }

  get compositeUniforms() {
    return this.quad.mat.uniforms;
  }

  // 把理想镜头复制到渲染镜头，并按低分辨率像素网格对齐，余数交给放大时平移
  setCamera(ideal, focusDist) {
    const rc = this.renderCam;
    const padScale = this.lowH / LOW_H;
    const t = Math.tan(THREE.MathUtils.degToRad(ideal.fov / 2)) * padScale;
    rc.fov = THREE.MathUtils.radToDeg(Math.atan(t)) * 2;
    rc.aspect = this.lowW / this.lowH;
    rc.near = ideal.near;
    rc.far = ideal.far;
    rc.position.copy(ideal.position);
    rc.quaternion.copy(ideal.quaternion);
    rc.updateProjectionMatrix();
    this.offset.set(0, 0);
    if (this.snap) {
      const wpp = (2 * focusDist * Math.tan(THREE.MathUtils.degToRad(ideal.fov / 2))) / LOW_H;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rc.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rc.quaternion);
      const pr = rc.position.dot(right);
      const pu = rc.position.dot(up);
      const sr = Math.round(pr / wpp) * wpp;
      const su = Math.round(pu / wpp) * wpp;
      rc.position.addScaledVector(right, sr - pr).addScaledVector(up, su - pu);
      this.offset.set((pr - sr) / wpp, (pu - su) / wpp);
    }
    rc.updateMatrixWorld(true);
    const u = this.quad.mat.uniforms;
    u.uNear.value = rc.near;
    u.uFar.value = rc.far;
    u.uCam.value.copy(rc.position);
    u.uInvVP.value.multiplyMatrices(rc.projectionMatrix, rc.matrixWorldInverse).invert();
  }

  updateShadow(focus, focusDist = 30) {
    const sc = this.shadowCam;
    const L = U.uSunDir.value;
    // 半径按 0.5 米一档变：镜头慢慢推近时阴影不会每帧跟着抖
    const span = Math.min(46, Math.max(5, Math.round(focusDist * 1.35 * 2) / 2));
    if (span !== this.shadowSpan) {
      this.shadowSpan = span;
      sc.left = sc.bottom = -span;
      sc.right = sc.top = span;
    }
    U.uShadowSpan.value = span;
    // 让阴影贴图按纹素对齐，避免移动时阴影边缘闪
    const texelWorld = (this.shadowSpan * 2) / this.shadowSize;
    sc.position.set(0, 0, 0);
    sc.up.set(0, 1, 0);
    sc.lookAt(-L.x, -L.y, -L.z);
    sc.updateMatrixWorld(true);
    const inv = sc.matrixWorldInverse;
    const f = focus.clone().applyMatrix4(inv);
    f.x = Math.round(f.x / texelWorld) * texelWorld;
    f.y = Math.round(f.y / texelWorld) * texelWorld;
    const back = f.applyMatrix4(sc.matrixWorld);
    sc.position.copy(back).addScaledVector(L, 120);
    sc.updateMatrixWorld(true);
    sc.updateProjectionMatrix();
    U.uShadowMat.value.multiplyMatrices(this._bias, sc.projectionMatrix).multiply(sc.matrixWorldInverse);
  }

  renderShadow(scene) {
    const r = this.renderer;
    const swap = this._swap;
    swap.length = 0;
    scene.traverseVisible((o) => {
      if (!o.isMesh && !o.isPoints && !o.isLine) return;
      if (o.castShadow && o.material && o.material.userData && o.material.userData.shadowMat) {
        swap.push(o, o.material);
        o.material = o.material.userData.shadowMat;
      } else {
        swap.push(o, null);
        o.visible = false;
      }
    });
    const bg = scene.background;
    scene.background = null;
    r.setRenderTarget(this.shadowRT);
    r.setClearColor(0xffffff, 1);
    r.clear(true, true, false);
    U.uShadowMap.value = null; // 避免读写同一张贴图
    r.render(scene, this.shadowCam);
    U.uShadowMap.value = this.shadowRT.depthTexture;
    for (let i = 0; i < swap.length; i += 2) {
      const o = swap[i];
      if (swap[i + 1]) o.material = swap[i + 1];
      else o.visible = true;
    }
    scene.background = bg;
  }

  // 能捞的东西在低分辨率画面的 alpha 里记成 0（toon 的 item），合成时据此描轮廓。
  // 透明的东西（水面、水槽、光圈、线）只改颜色、不动 alpha；泥雾和沙子照常叠 alpha，盖得厚的地方轮廓跟着没了
  _keepAlpha(scene) {
    const fix = (m) => {
      const k = m.userData.keepAlpha;
      if (!m.transparent) { if (k !== undefined) { m.blending = k; delete m.userData.keepAlpha; } return; }
      if (k !== undefined) return;
      if (m.blending !== THREE.NormalBlending && m.blending !== THREE.AdditiveBlending) return;
      m.userData.keepAlpha = m.blending;
      const add = m.blending === THREE.AdditiveBlending;
      m.blending = THREE.CustomBlending;
      m.blendEquation = m.blendEquationAlpha = THREE.AddEquation;
      m.blendSrc = THREE.SrcAlphaFactor;
      m.blendDst = add ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor;
      m.blendSrcAlpha = m.userData.coverItems ? THREE.OneFactor : THREE.ZeroFactor;
      m.blendDstAlpha = m.userData.coverItems ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor;
    };
    scene.traverse((o) => {
      const m = o.material;
      if (!m) return;
      if (Array.isArray(m)) m.forEach(fix);
      else fix(m);
    });
  }

  render(scene) {
    this._keepAlpha(scene);
    const r = this.renderer;
    r.setRenderTarget(this.low);
    r.setClearColor(0x000000, 1);
    r.clear(true, true, true);
    r.render(scene, this.renderCam);
    r.setRenderTarget(null);
    r.render(this.quad.scene, this.quad.cam);
  }
}
