// 合成：场景（低分辨率）→ 环境光遮蔽（物件落地、缝里发暗）→ 水面（折射、菲涅尔天空反射、日光碎闪、网进出水的泡沫和涟漪）→ 描边
//       → 泛光（亮处晕开一点）→ 输出（高光柔肩、冷暖分调、暗角、揭宝光芒、抖动色阶）→ 像素放大
import * as THREE from 'three';
import { SHARED, WATER_GLSL } from './materials.js';

const QUAD_VS = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
// 从深度还原视空间坐标（几个通道共用）
const VIEWPOS = /* glsl */`
  vec3 viewPos(vec2 uv, float d) {
    vec4 p = uInvProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
    return p.xyz / p.w;
  }`;

export function createPost(renderer, W, H) {
  const rt = new THREE.WebGLRenderTarget(W, H, {
    type: THREE.HalfFloatType,
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType),
  });
  rt.depthTexture.minFilter = THREE.NearestFilter; rt.depthTexture.magFilter = THREE.NearestFilter;
  // 遮蔽（原始，4×4 交错采样）、合成后的画面、泛光（四分之一分辨率，来回两张）
  const aoRT = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const compRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const bw = Math.max(1, Math.round(W / 4)), bh = Math.max(1, Math.round(H / 4));
  const bloomA = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const bloomB = bloomA.clone();

  const uniforms = Object.assign({
    tColor: { value: rt.texture },
    tDepth: { value: rt.depthTexture },
    tAO: { value: aoRT.texture },
    tComp: { value: compRT.texture },
    tBloom: { value: bloomA.texture },
    uInvProj: { value: new THREE.Matrix4() },
    uProjY: { value: 1 },
    uCamWorld: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uNear: { value: 0.5 }, uFar: { value: 1500 },
    uRes: { value: new THREE.Vector2(W, H) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.4).normalize() },
    uSunCol: { value: new THREE.Color(1.0, 0.92, 0.78) },
    uWave: { value: 1.0 },
    uOutline: { value: 1.0 },
    uFlash: { value: 0 },
    uGlint: { value: 0.45 },
    uVignette: { value: 0.35 },
    uGrade: { value: new THREE.Vector4(1, 1, 1, 0) }, // rgb 乘数 + 饱和度偏移
    uLevels: { value: 44 },
    uHalo: { value: new THREE.Vector4(0.5, 0.5, 0.2, 0) },
    // 珍品确认：x, y（它在画面上的位置）、颜色已经回来的半径（按画面高度算）、褪色几成
    uDesat: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
    // 水面上推出去的一圈圈波纹（船钟 C9 的“当——”）：圆心 x、z，半径，高低（0 = 没有）。由 src/render/ripples.js 按游戏时间推
    uRipple: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    // 珍品那一网出水（C4）：泥水里拖着的一缕金色——起点 x、z，长度，浓淡（0 = 没有）；uSheenDir：往哪边拖（单位向量）
    uSheen: { value: new THREE.Vector4(0, 0, 0, 0) }, uSheenDir: { value: new THREE.Vector2(1, 0) },
    // 第一次看清沉船（F10）：uSight = 圆心 x、z，清水窗口推到多大，变暗的那一片多大；uSightB = 暗几成、窗口边亮一线、窗口里清几成（0 = 没有）。由 src/game/wrecksight.js 推
    uSight: { value: new THREE.Vector4(0, 0, 0, 0) }, uSightB: { value: new THREE.Vector4(0, 0, 0, 0) },
    uHaloT: { value: 0 },
    uAO: { value: 1.0 },
    uBloom: { value: 0.32 },
    uDir: { value: new THREE.Vector2(1, 0) },
    tSrc: { value: null },
    // 水面上的事（网入水、网下沉时冒上来的泡、网出水、泄水）：每格 x, z, 过了几秒（负的是还有几秒）, 种类（0 空、1 入水、2 冒泡、3 出水）
    // 和 强度、半径、花纹种子、泄水强度（种类 3）。src/game/netfx.js 每帧写
    uSurf: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uSurfB: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 1, 0, 0)) },
    // 船推水（A1）：航迹每格 x, z, 记下的时刻, 当时船速（第 0 格是现在的船尾）和 船尾翻水几成；记了几格；包围盒（x0, z0, x1, z1）；
    // 船 x, z, 航向, 船速；翻水、船头压浪、吃力；转速、走过的路、桨叶转过的圈。src/game/wake.js 每帧写
    uWakeA: { value: Array.from({ length: 36 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uWakeB: { value: Array.from({ length: 36 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uWakeN: { value: 0 }, uWakeBox: { value: new THREE.Vector4(0, 0, 0, 0) },
    uWakeBoat: { value: new THREE.Vector4(0, 0, 0, 0) }, uWakeK: { value: new THREE.Vector4(0, 0, 0, 0) }, uWakeE: { value: new THREE.Vector4(0, 0, 0, 0) },
    // 风吹过（A3）：风往哪吹 x, z，风头离起风点多远，强弱；起风点 x, z。src/game/breeze.js 每帧写
    uGust: { value: new THREE.Vector4(1, 0, 0, 0) }, uGustC: { value: new THREE.Vector2(0, 0) },
  }, SHARED);

  // —— 环境光遮蔽：按深度还原位置和法线，在法线一侧的半球里找挡住它的东西（近处、半米以内）——
  const aoMat = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, vertexShader: QUAD_VS,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tDepth; uniform mat4 uInvProj; uniform vec2 uRes; uniform float uProjY;
      ${VIEWPOS}
      void main() {
        float d = texture2D(tDepth, vUv).x;
        if (d >= 0.999999) { gl_FragColor = vec4(1.0); return; }
        vec2 px = 1.0 / uRes;
        vec3 P = viewPos(vUv, d);
        vec3 Pr = viewPos(vUv + vec2(px.x, 0.0), texture2D(tDepth, vUv + vec2(px.x, 0.0)).x);
        vec3 Pl = viewPos(vUv - vec2(px.x, 0.0), texture2D(tDepth, vUv - vec2(px.x, 0.0)).x);
        vec3 Pu = viewPos(vUv + vec2(0.0, px.y), texture2D(tDepth, vUv + vec2(0.0, px.y)).x);
        vec3 Pd = viewPos(vUv - vec2(0.0, px.y), texture2D(tDepth, vUv - vec2(0.0, px.y)).x);
        vec3 dx = abs(Pr.z - P.z) < abs(Pl.z - P.z) ? Pr - P : P - Pl;
        vec3 dy = abs(Pu.z - P.z) < abs(Pd.z - P.z) ? Pu - P : P - Pd;
        vec3 N = normalize(cross(dx, dy));
        if (dot(N, P) > 0.0) N = -N;
        float R = 0.6;
        float rpx = clamp(R * uProjY * 0.5 * uRes.y / max(-P.z, 0.1), 1.5, 36.0);
        // 4×4 交错的旋转角（输出时按 4×4 一块平均，花纹正好抵消）
        vec2 cell = mod(floor(gl_FragCoord.xy), 4.0);
        float rot = (cell.x * 4.0 + cell.y) / 16.0 * 6.2831853 + (cell.y * 0.37);
        float occ = 0.0;
        for (int i = 0; i < 8; i++) {
          float t = (float(i) + 0.5) / 8.0;
          float a = rot + float(i) * 2.3999632;
          vec2 su = vUv + vec2(cos(a), sin(a)) * rpx * sqrt(t) * px;
          float sd = texture2D(tDepth, su).x;
          if (sd >= 0.999999) continue;
          vec3 v = viewPos(su, sd) - P;
          float vv = dot(v, v);
          float fall = 1.0 - smoothstep(R * R, 4.0 * R * R, vv);
          occ += max(0.0, dot(v, N) - 0.015 * (-P.z) * 0.05) / (vv + 0.03) * fall;
        }
        float ao = clamp(1.0 - occ / 8.0 * R * 1.0, 0.0, 1.0);
        gl_FragColor = vec4(ao, ao, ao, 1.0);
      }`,
  });

  // —— 合成：水面、描边、遮蔽、远处的雾 ——
  const mat = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false, depthWrite: false,
    vertexShader: QUAD_VS,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tAO;
      uniform mat4 uInvProj; uniform mat4 uCamWorld; uniform vec3 uCamPos;
      uniform float uNear; uniform float uFar; uniform vec2 uRes;
      uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uWave; uniform float uOutline;
      uniform float uGlint; uniform float uAO; uniform vec4 uRipple[4]; uniform vec4 uSheen; uniform vec2 uSheenDir;
      uniform vec4 uSurf[4]; uniform vec4 uSurfB[4];
      uniform vec4 uWakeA[36]; uniform vec4 uWakeB[36]; uniform float uWakeN; uniform vec4 uWakeBox; uniform vec4 uWakeBoat; uniform vec4 uWakeK; uniform vec4 uWakeE;
      uniform vec4 uGust; uniform vec2 uGustC;
      uniform vec4 uSight; uniform vec4 uSightB;
      ${WATER_GLSL.replace('uniform float uTime;', 'uniform float uTime;')}
      ${VIEWPOS}
      vec3 worldPos(vec2 uv, float d) { return (uCamWorld * vec4(viewPos(uv, d), 1.0)).xyz; }
      float linDepth(vec2 uv) { float d = texture2D(tDepth, uv).x; return -viewPos(uv, d).z; }

      float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vnoise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y); }

      // 网进出水在水面上留下的：涟漪（改水面的斜率，海底跟着晃、波峰亮一线）和白沫（返回几成白）
      //   1 入水（B5）：一下砸开的白水，散成一圈花边泡沫，慢慢往外扩、碎开、淡掉
      //   2 冒泡（B6）：网往下沉时一路冒上来的泡在这里破，一粒粒白点闪
      //   3 出水（B11）：先鼓起一个包，网圈顶破水面一片白水和一圈泡沫；网兜泄水时底下一片碎白（泄水强度）
      float surfFx(vec2 p, inout vec2 grad, inout float crest) {
        float foam = 0.0;
        for (int i = 0; i < 4; i++) {
          vec4 S = uSurf[i]; vec4 B = uSurfB[i];
          if (S.w < 0.5) continue;
          vec2 q = p - S.xy; float r = length(q);
          float R = B.y, st = B.x, a = S.z;
          if (r > R + 2.6 * max(a, 0.0) + 3.0) continue;
          vec2 rd = q / max(r, 0.001);
          // 涟漪：几道波往外走（越走越平）
          if (a > 0.0) {
            for (int k = 0; k < 3; k++) {
              float ak = a - float(k) * 0.24;
              if (ak <= 0.0) continue;
              float d = r - (R * 0.85 + ak * 2.4);
              float env = exp(-d * d * 1.8) * exp(-ak * 0.9) * st / (1.0 + max(0.0, r - R) * 0.3);
              grad += rd * cos(d * 8.0) * env * 0.36;
              crest += max(0.0, sin(d * 8.0)) * env;
            }
          }
          float n1 = vnoise(p * 2.7 + B.z), n2 = vnoise(p * 6.3 - uTime * 0.3 + B.z * 1.7);
          float n = n1 * 0.55 + n2 * 0.45;
          if (S.w < 1.5) {
            float burst = (1.0 - smoothstep(R * 0.45, R * 1.3, r)) * exp(-a * 2.4) * smoothstep(0.0, 0.04, a);
            float rr = R * (0.95 + 0.6 * (1.0 - exp(-a * 0.45)));
            float ring = exp(-pow((r - rr) / (0.2 + 0.09 * a), 2.0));
            float lace = smoothstep(0.4 + 0.035 * a, 0.6 + 0.03 * a, n);
            float inner = (1.0 - smoothstep(0.0, R, r)) * smoothstep(0.55, 0.78, n2) * exp(-a * 0.5);
            float fade = 1.0 - smoothstep(3.5, 8.5, a);
            foam += max(burst * (0.78 + 0.22 * n), (ring * lace + inner * 0.6) * fade) * st;
          } else if (S.w < 2.5) {
            vec2 gp = p * 6.5, gi = floor(gp), gf = fract(gp) - 0.5;
            float h = hash12(gi + floor(uTime * 4.0 + hash12(gi + 3.1) * 9.0) * 1.37);
            float disc = 1.0 - smoothstep(R * 0.35, R, r);
            foam += step(0.83, h) * (1.0 - smoothstep(0.18, 0.42, length(gf))) * disc * st * 0.95;
            foam += disc * st * 0.22 * smoothstep(0.52, 0.8, vnoise(p * 4.5 + uTime * 1.3));
          } else {
            if (a < 0.0) {
              // 还没破：水面被网顶起来一个包（斜率往外），包顶发白
              float k = smoothstep(-0.5, 0.0, a);
              float dome = exp(-pow(r / (R * 1.05), 2.0)) * k;
              grad += rd * (r / (R * R)) * dome * 1.1;
              crest += dome * 0.5;
              foam += dome * k * smoothstep(0.55, 0.85, n2) * 0.45;
            } else {
              float boil = (1.0 - smoothstep(R * 0.55, R * 1.45, r)) * exp(-a * 1.5);
              float rr = R * (1.05 + 0.5 * (1.0 - exp(-a * 0.5)));
              float ring = exp(-pow((r - rr) / (0.22 + 0.08 * a), 2.0)) * smoothstep(0.42 + 0.04 * a, 0.62 + 0.035 * a, n);
              float fade = 1.0 - smoothstep(2.5, 6.5, a);
              foam += max(boil * (0.7 + 0.3 * n), ring * fade) * st;
            }
            // 泄水：网兜底下一片砸碎的水
            float pr = B.w * (1.0 - smoothstep(R * 0.25, R * 1.05, r));
            foam += pr * smoothstep(0.48, 0.7, vnoise(p * 7.0 + vec2(uTime * 9.0, -uTime * 7.0)));
            grad += rd * sin(r * 14.0 - uTime * 22.0) * pr * 0.12;
          }
        }
        return clamp(foam, 0.0, 1.0);
      }

      // 船推水（A1）：返回白沫几成；grad 加上水面坡度，scar 是尾流把浪压平了几成，aer 是翻起来的气泡水（发青发亮）几成
      //   航迹（世界里不动、慢慢散开淡掉）：两道开尔文波（臂从船头起 19.5° 往外斜，越老越往外、越宽越碎）、臂里面一排排斜的细浪、
      //   中间翻滚的白水带（推油门那一刻翻得最凶，留在原地慢慢散）、被压平的一条“镜面”水道
      //   跟着船（这一刻）：船头切开的浪、船头前一堆白水（压浪那一下更大）、两舷往后刷的水、船尾桨叶往后喷的一股白水
      float wakeFx(vec2 p, inout vec2 grad, out float scar, out float aer) {
        scar = 0.0; aer = 0.0;
        if (uWakeN < 0.5 || p.x < uWakeBox.x || p.y < uWakeBox.y || p.x > uWakeBox.z || p.y > uWakeBox.w) return 0.0;
        float foam = 0.0;
        // 船上的坐标：lx 往右舷，lz 往船头
        vec2 bq = p - uWakeBoat.xy; float hs = sin(uWakeBoat.z), hc = cos(uWakeBoat.z);
        float lx = bq.x * hc - bq.y * hs, lz = bq.x * hs + bq.y * hc, ax = abs(lx);
        float spd = max(uWakeBoat.w, 0.0), kb = smoothstep(1.0, 8.0, spd);
        float churn = uWakeK.x, dip = uWakeK.y, rpm = uWakeE.x;
        // —— 航迹：找最近的一段 ——
        float bd = 1e9, bt = uTime, bv = 0.0, bc = 0.0; vec2 bp = uWakeA[0].xy;
        for (int i = 0; i < 35; i++) {
          if (float(i) + 1.5 > uWakeN) break;
          vec4 A0 = uWakeA[i], A1 = uWakeA[i + 1];
          vec2 ab = A1.xy - A0.xy; float L2 = max(dot(ab, ab), 1e-4);
          float u = clamp(dot(p - A0.xy, ab) / L2, 0.0, 1.0);
          vec2 c = A0.xy + ab * u; vec2 q = p - c; float dd = dot(q, q);
          if (dd < bd) { bd = dd; bp = c; bt = mix(A0.z, A1.z, u); bv = mix(A0.w, A1.w, u); bc = mix(uWakeB[i].x, uWakeB[i + 1].x, u); }
        }
        if (uWakeN < 1.5) { vec2 q = p - uWakeA[0].xy; bd = dot(q, q); bv = uWakeA[0].w; bc = uWakeB[0].x; }
        float h = sqrt(bd), age = max(uTime - bt, 0.0);
        float tmax = uTime - uWakeA[int(max(uWakeN - 1.0, 0.0))].z;
        float fadeEnd = 1.0 - smoothstep(tmax - 1.6, tmax + 0.01, age);
        // 船身底下、船头前面不画航迹（那里归“跟着船”的那一份）
        float front = smoothstep(-8.0, -6.0, lz) * (1.0 - smoothstep(9.0, 13.0, ax));
        vec2 nrm = (p - bp) / max(h, 1e-3);
        float n1 = vnoise(p * 1.7 + vec2(age * 0.55, -age * 0.35)), n2 = vnoise(p * 4.3 - vec2(age * 0.8, age * 0.25));
        float nn = n1 * 0.6 + n2 * 0.4;
        // 开尔文波的两条臂：船速越快越白、拖得越长；离船越远越往外、越宽、越碎
        float kv = smoothstep(1.2, 6.5, bv);
        float ka = kv * exp(-age / (1.2 + 0.42 * bv)) * fadeEnd * (1.0 - front);
        float harm = mix(3.4, 6.3, kv) + 0.354 * bv * age;
        float wd = 0.3 + 0.07 * age;
        float xa = (h - harm) / wd, ea = exp(-xa * xa);
        // 臂不是一条实线：是一节节斜着的短浪头连成的（沿航迹一节一节），碎成花边，白只在新的那一段，老了只剩一道亮脊
        float sAl = bv * age;
        float feather = smoothstep(-0.15, 0.75, sin(sAl * 0.8 - (h - harm) * 1.3 + n1 * 2.4));
        float lace = smoothstep(0.26 + 0.06 * age, 0.58 + 0.04 * age, nn);
        foam += ea * ka * mix(feather, 1.0, 0.25) * mix(1.0, lace, 0.35 + 0.65 * smoothstep(0.0, 1.2, age)) * (0.3 + 0.7 * exp(-age / 1.4));
        grad += nrm * (-2.0 * xa / wd) * ea * ka * (0.1 + 0.08 * feather);
        // 臂里面一排排斜着的细浪（开尔文波的“羽毛”）：越靠臂越清楚
        float inner = smoothstep(harm - 6.0 - 0.4 * age, harm - 0.5, h) * (1.0 - smoothstep(harm - 0.4, harm + 0.3, h));
        float ph = (harm - h) * 2.3 + bv * age * 0.9;
        grad += nrm * cos(ph) * inner * ka * 0.22;
        foam += max(0.0, sin(ph) - 0.72) * 2.4 * inner * ka * smoothstep(0.45, 0.7, n2) * 0.55;
        // 中间翻滚的白水：越新越宽越白，留在原地慢慢散开、碎成一块块
        float wc = 1.3 + 0.32 * age;
        float kc = (0.32 * kv + bc) * exp(-age / (1.5 + 0.2 * bv)) * fadeEnd * (1.0 - smoothstep(-7.4, -6.2, lz) * (1.0 - smoothstep(4.0, 6.0, ax)));
        float core = exp(-(h * h) / (wc * wc)) * kc;
        float thr = 0.72 - 0.5 * min(core, 1.0);
        foam += smoothstep(thr, thr + 0.16, nn) * min(core * 1.7, 1.0);
        aer = max(aer, min(core * 1.2, 1.0) + ea * ka * (0.25 + 0.3 * feather));
        // 被压平的一条水道（比白水留得久）
        scar = exp(-(h * h) / pow(wc * 1.5 + 1.2, 2.0)) * kv * exp(-age / (4.5 + 0.5 * bv)) * fadeEnd;
        // —— 跟着船（这一刻）——
        if (lz > -26.0 && lz < 10.5 && ax < 13.0) {
          float hw = lz > 3.0 ? 2.9 * max(0.3, 1.0 - (lz - 3.0) / 5.0) : 2.9;
          if (kb > 0.0) {
            // 船头切开的浪：贴着船头翻起来，往后斜着离开船身，到船尾接上航迹的臂
            float hb = max(hw + 0.3, mix(3.4, 0.354 * (7.6 - lz) + 1.15, kb));
            float bw = 0.22 + 0.022 * max(7.6 - lz, 0.0);
            float xb = (ax - hb) / bw, eb = exp(-xb * xb) * smoothstep(8.3, 7.0, lz) * smoothstep(-8.6, -6.6, lz);
            float nb = vnoise(p * 2.6 + uTime * vec2(0.7, -0.5)) * 0.6 + vnoise(p * 6.1 - uTime * 0.9) * 0.4;
            // 船头那一段翻得满（实白），往后越来越碎
            float solid = smoothstep(1.0, 5.5, lz);
            foam += eb * kb * mix(smoothstep(0.38, 0.62, nb + 0.1 * xb), 0.6 + 0.4 * smoothstep(0.25, 0.6, nb), solid) * (0.8 + 0.4 * dip);
            vec2 sideN = vec2(hc, -hs) * sign(lx);
            grad += sideN * (-2.0 * xb / bw) * eb * kb * 0.2;
            // 船头前一堆白水（压进浪那一下更大）
            float stem = exp(-pow((lz - 7.2) / (0.8 + 0.6 * dip), 2.0)) * (1.0 - smoothstep(hw + 0.1, hw + 1.2 + 1.0 * dip, ax));
            foam += stem * kb * (0.5 + 0.9 * dip) * smoothstep(0.2, 0.55, nb + 0.2 * dip);
            // 两舷往后刷的水：顺着船身拉长的一道道白
            float side = exp(-pow((ax - hw - 0.25) / 0.38, 2.0)) * smoothstep(-7.4, -5.0, lz) * smoothstep(8.0, 6.0, lz);
            float st = vnoise(vec2(lx * 3.0, (lz + uWakeE.y) * 0.45)) * 0.7 + vnoise(vec2(lx * 7.0, (lz + uWakeE.y) * 1.1)) * 0.3;
            foam += side * kb * smoothstep(0.5, 0.74, st) * 0.75;
            aer = max(aer, (eb * 0.35 + stem * 0.8 + side * 0.5) * kb);
          }
          // 船尾桨叶往后喷的一股白水：推油门那一刻最猛（船还没动，水先翻起来），越往后越散
          float qb = -7.1 - lz;
          if (churn > 0.02 && qb > -1.2) {
            float jl = 3.5 + 13.0 * churn + spd * 0.9, jw = 0.9 + 0.2 * max(qb, 0.0);
            float jet = exp(-lx * lx / (jw * jw)) * smoothstep(-1.2, 0.4, qb) * (1.0 - smoothstep(jl * 0.35, jl, qb)) * churn;
            float nj = vnoise(vec2(lx * 1.7, qb * 0.6 - uWakeE.z * 0.55)) * 0.55 + vnoise(vec2(lx * 4.1, qb * 1.4 - uWakeE.z * 1.1)) * 0.45;
            float boil = exp(-(pow(qb - 0.9, 2.0) + lx * lx) / (2.2 + 3.0 * churn)) * uWakeK.z;
            foam += smoothstep(0.62 - 0.45 * jet, 0.78 - 0.3 * jet, nj) * min(jet * 1.8, 1.0) + boil * smoothstep(0.3, 0.55, nj) * 0.9;
            aer = max(aer, min(jet * 1.5 + boil, 1.0));
            grad += vec2(hs, hc) * sin(qb * 2.2 - uWakeE.z * 1.6) * jet * 0.12 + normalize(bq + 1e-3) * boil * 0.18 * sin(uTime * 7.0 + qb * 3.0);
          }
        }
        return clamp(foam, 0.0, 1.0);
      }

      // 遮蔽：4×4 一块按深度加权平均（交错的花纹抵消，边缘不糊到前后的东西上）
      float aoAt(vec2 uv, float dc) {
        vec2 px = 1.0 / uRes;
        vec2 base = (floor(uv * uRes) - mod(floor(uv * uRes), 4.0) + 0.5) * px;
        float s = 0.0, w = 0.0;
        for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
          vec2 q = base + vec2(float(i), float(j)) * px;
          float dq = linDepth(q);
          float k = exp(-abs(dq - dc) / max(dc * 0.04, 0.05));
          s += texture2D(tAO, q).r * k; w += k;
        }
        return w > 0.0 ? s / w : 1.0;
      }

      vec3 skyColor(vec3 d) {
        float y = max(d.y, 0.0);
        vec3 hor = vec3(0.62, 0.69, 0.66);
        vec3 zen = vec3(0.19, 0.35, 0.46);
        vec3 c = mix(hor, zen, pow(y, 0.55));
        float s = max(dot(d, uSunDir), 0.0);
        c += uSunCol * (pow(s, 900.0) * 6.0 + pow(s, 12.0) * 0.2);
        // 低云带
        vec2 cp = d.xz / max(d.y + 0.08, 0.04) * 0.6 + vec2(uTime * 0.004, 0.0);
        float cl = smoothstep(0.55, 0.85, vnoise(cp * 1.3) * 0.65 + vnoise(cp * 3.1) * 0.35);
        vec3 cloud = mix(vec3(0.62, 0.66, 0.66), vec3(0.95, 0.92, 0.84), smoothstep(0.6, 0.95, vnoise(cp * 2.2 + 4.0)));
        c = mix(c, cloud, cl * 0.6 * smoothstep(0.0, 0.25, y));
        return c;
      }
      // 水面法线：几道方向波 + 细碎噪声
      vec3 waveNormal(vec2 p, float t, float dist) {
        vec2 g = vec2(0.0);
        float lod = 1.0 - smoothstep(25.0, 160.0, dist);
        vec2 dirs[4]; dirs[0] = normalize(vec2(1.0, 0.35)); dirs[1] = normalize(vec2(-0.4, 1.0)); dirs[2] = normalize(vec2(0.7, -0.8)); dirs[3] = normalize(vec2(-1.0, -0.2));
        float fr[4]; fr[0] = 0.31; fr[1] = 0.53; fr[2] = 0.97; fr[3] = 1.71;
        float am[4]; am[0] = 0.16; am[1] = 0.10; am[2] = 0.055; am[3] = 0.03;
        for (int i = 0; i < 4; i++) {
          float ph = dot(dirs[i], p) * fr[i] + t * (1.2 + float(i) * 0.45);
          g += dirs[i] * cos(ph) * am[i] * fr[i] * 3.0 * (i < 2 ? 1.0 : lod);
        }
        float e = 0.35;
        float n0 = vnoise(p * 1.7 + t * 0.6);
        g += vec2(vnoise(p * 1.7 + vec2(e, 0.0) + t * 0.6) - n0, vnoise(p * 1.7 + vec2(0.0, e) + t * 0.6) - n0) * 0.7 * lod;
        g *= uWave * (0.35 + 0.65 * lod);
        return normalize(vec3(-g.x, 1.0, -g.y));
      }

      // 一圈圈波纹：前沿两三道细波（越往外越宽越淡）；返回水面坡度 xy 和波峰亮几成 z
      vec3 rippleAt(vec2 p) {
        vec3 o = vec3(0.0);
        for (int i = 0; i < 4; i++) {
          if (uRipple[i].w <= 0.0) continue;
          vec2 dv = p - uRipple[i].xy; float dd = length(dv) + 1e-4;
          float wdt = 0.7 + uRipple[i].z * 0.05, x = (dd - uRipple[i].z) / wdt;
          if (abs(x) > 3.2) continue;
          float env = exp(-x * x * 0.7) * uRipple[i].w;
          o.xy += dv / dd * cos(x * 3.6) * env * 0.7;
          o.z += sin(x * 3.6 + 1.2) * env;
        }
        return o;
      }

      void main() {
        vec2 uv = vUv;
        float d = texture2D(tDepth, uv).x;
        bool sky = d >= 0.999999;
        vec3 wp = worldPos(uv, d);
        vec3 farP = worldPos(uv, 1.0);
        vec3 dir = normalize(farP - uCamPos);
        float sceneDist = sky ? 1e9 : length(wp - uCamPos);
        float dc = sky ? 1e9 : linDepth(uv);
        // 遮蔽：水面以上的东西整份，水下越深越淡（散射把缝里的暗冲淡）
        float ao = 1.0;
        if (!sky && uAO > 0.0) {
          float raw = aoAt(uv, dc);
          float under = clamp(-wp.y, 0.0, 40.0);
          ao = mix(1.0, raw, uAO * exp(-under * 0.07) * (1.0 - smoothstep(60.0, 160.0, dc)));
        }
        vec3 col = texture2D(tColor, uv).rgb * ao;
        vec3 haze = vec3(0.58, 0.66, 0.65);
        float underPath = 0.0;

        if (dir.y < 0.0 && uCamPos.y > 0.0) {
          float ts = uCamPos.y / -dir.y;
          if (ts < sceneDist - 0.02) {
            vec3 sp = uCamPos + dir * ts;
            vec3 N = waveNormal(sp.xz, uTime, ts);
            vec2 sg = vec2(0.0); float screst = 0.0;
            float sfoam = surfFx(sp.xz, sg, screst);
            float wscar = 0.0, waer = 0.0;
            float wfoam = wakeFx(sp.xz, sg, wscar, waer);
            N = normalize(mix(N, vec3(0.0, 1.0, 0.0), wscar * 0.55));
            // 一阵风扫过（A3）：风头底下一片片起细纹（顺着风跑），颜色沉一点——“猫爪风”
            float gst = 0.0;
            if (uGust.w > 0.001) {
              vec2 gq = sp.xz - uGustC;
              float gx = (dot(gq, uGust.xy) - uGust.z) / 30.0;
              vec2 gp = sp.xz * 0.065 - uGust.xy * uTime * 0.32;
              float gpatch = smoothstep(0.3, 0.62, vnoise(gp) * 0.65 + vnoise(gp * 2.3 + 5.0) * 0.35);
              gst = exp(-gx * gx) * gpatch * uGust.w * (1.0 - wscar);
              vec2 rp = sp.xz * 2.6 - uGust.xy * uTime * 3.6;
              float r0 = vnoise(rp);
              vec2 rg = vec2(vnoise(rp + vec2(0.25, 0.0)) - r0, vnoise(rp + vec2(0.0, 0.25)) - r0) * 4.0;
              N = normalize(N + vec3(-rg.x, 0.0, -rg.y) * gst * 0.45 * uWave);
            }
            N = normalize(N + vec3(-sg.x, 0.0, -sg.y) * uWave);
            vec3 rip = rippleAt(sp.xz);
            if (rip.z != 0.0 || rip.x != 0.0) N = normalize(N + vec3(-rip.x, 0.0, -rip.y));
            float depthBelow = sky ? 30.0 : clamp(-wp.y, 0.0, 30.0);
            vec2 off = N.xz * uWave * clamp(depthBelow / 6.0, 0.0, 1.0) * 0.012 * clamp(30.0 / ts, 0.3, 1.5);
            off -= sg * uWave * 0.01 * clamp(depthBelow / 2.0, 0.0, 1.0) * clamp(30.0 / ts, 0.3, 1.5);
            vec2 uv2 = uv + off;
            float d2 = texture2D(tDepth, uv2).x;
            if (d2 < 0.999999) { vec3 w2 = worldPos(uv2, d2); if (w2.y > -0.15) uv2 = uv; }
            vec3 ext; vec4 wcol; waterParams(sp.xz, ext, wcol);
            vec3 under;
            if (sky) under = wcol.rgb * (0.3 + 0.7 * exp(-30.0 * 0.055));
            else under = texture2D(tColor, uv2).rgb * ao;
            // F10：沉船那一片水先暗下去、浑起来（船壳只剩一团暗影）；看清的那一下从它中间往外推开一圈清水，圈里的反光收掉、水下的东西更清楚
            float sightK = 0.0, sightD = length(sp.xz - uSight.xy);
            if (uSightB.x + uSightB.z > 0.0) {
              float inW = 1.0 - smoothstep(uSight.z - 5.0, uSight.z, sightD);
              float murk = uSightB.x * (1.0 - smoothstep(uSight.w * 0.55, uSight.w, sightD)) * (1.0 - inW * step(0.01, uSight.z));
              under = mix(under, wcol.rgb * 0.3, murk * 0.9);
              sightK = uSightB.z * inW;
              float ml = dot(under, vec3(0.3333));
              under = mix(under, (vec3(ml) + (under - vec3(ml)) * 1.35) * 1.12, sightK * 0.85);
            }
            float cosi = clamp(dot(-dir, N), 0.0, 1.0);
            float F = (0.02 + 0.98 * pow(1.0 - cosi, 5.0)) * (1.0 - 0.7 * sightK);
            vec3 R = reflect(dir, N);
            R.y = abs(R.y);
            vec3 sk = skyColor(R);
            float s = max(dot(R, uSunDir), 0.0);
            float glint = (pow(s, 1800.0) * 3.0 + pow(s, 140.0) * 0.12) * (0.25 + 0.75 * smoothstep(260.0, 40.0, ts)) * uGlint * (1.0 - 0.75 * smoothstep(0.55, 0.9, -dir.y));
            float clar = clamp(wcol.a, 0.3, 1.2);
            col = mix(under, sk, clamp(F * (0.55 + 0.3 * clar), 0.0, 1.0)) + uSunCol * glint * uWave * (0.25 + 0.6 * clar);
            // 波峰亮一道、波谷暗一道（远了淡掉）
            float rf = 1.0 - smoothstep(40.0, 140.0, ts);
            col = col * (1.0 - 0.14 * clamp(-rip.z, 0.0, 1.0) * rf) + vec3(0.85, 0.94, 0.96) * clamp(rip.z, 0.0, 1.0) * 0.3 * rf;
            // 网进出水：涟漪的波峰亮一线，白沫盖在最上面（受一点日光）
            col += vec3(0.8, 0.92, 0.95) * min(screst, 1.0) * 0.16 * uWave;
            if (uSightB.y > 0.0) { float rr = sightD - uSight.z; col += vec3(0.5, 0.92, 0.84) * exp(-rr * rr * 0.8) * uSightB.y * (0.6 + 0.4 * vnoise(sp.xz * 0.9 + uTime * 0.6)); }
            col = mix(col, vec3(0.94, 0.97, 0.95) * (0.92 + 0.08 * uSunCol.r), sfoam * 0.92);
            col = mix(col, vec3(0.08, 0.24, 0.31), gst * 0.34 * (1.0 - smoothstep(150.0, 400.0, ts)));
            // 船推水（A1）：翻起来的气泡水发青发亮，白沫盖在上面（远了淡一点，不闪）
            float wfar = 1.0 - 0.35 * smoothstep(80.0, 220.0, ts);
            col = mix(col, vec3(0.6, 0.82, 0.8) * (0.86 + 0.14 * uSunCol.r), clamp(waer, 0.0, 1.0) * 0.38 * wfar);
            col = mix(col, vec3(0.95, 0.98, 0.97) * (0.9 + 0.1 * uSunCol.r), wfoam * 0.9 * wfar);
            if (uSheen.w > 0.0) {
              // 网带上来的一摊泥水（褐、慢慢摊开），里面拖出一缕金：细细的一条顺着水流弯弯地拖开，越往后越宽越淡，断断续续
              vec2 q = sp.xz - uSheen.xy;
              float md = length(q), mr = 1.0 + 0.18 * uSheen.z;
              float mud = exp(-md * md / (mr * mr)) * (0.55 + 0.6 * vnoise(q * 1.3 + uTime * 0.15));
              col = mix(col, vec3(0.4, 0.34, 0.22), clamp(mud * uSheen.w * 0.42, 0.0, 0.5));
              float al = dot(q, uSheenDir), ac = dot(q, vec2(-uSheenDir.y, uSheenDir.x));
              ac -= 0.4 * sin(al * 0.55 + uTime * 0.45) * smoothstep(0.0, 3.0, al);
              float wd = 0.1 + 0.075 * max(al, 0.0);
              float shn = exp(-ac * ac / (wd * wd)) * smoothstep(-0.3, 0.6, al) * (1.0 - smoothstep(uSheen.z * 0.45, uSheen.z, al));
              shn *= (0.2 + 1.1 * vnoise(vec2(al * 0.9 - uTime * 0.35, ac / wd * 1.4 + 7.0))) * (1.0 - 0.5 * clamp(al / max(uSheen.z, 0.1), 0.0, 1.0));
              float sa = clamp(shn * uSheen.w, 0.0, 1.0);
              col = mix(col, vec3(1.0, 0.72, 0.24) * (0.62 + 0.5 * F), sa * 0.7) + vec3(1.0, 0.88, 0.55) * pow(sa, 4.0) * 0.3;
            }
            // 水线白沫：船壳、码头桩、礁石、岸边刚没入水的地方起一圈碎沫（随波流动、断断续续）
            if (!sky) {
              float path = sceneDist - ts;
              float near = (1.0 - smoothstep(0.05, 0.55, path)) * (1.0 - smoothstep(-0.9, -0.2, -wp.y - 0.9));
              if (near > 0.0) {
                vec2 fp = sp.xz * 2.3 + vec2(uTime * 0.35, uTime * 0.21);
                float fn = vnoise(fp) * 0.6 + vnoise(fp * 2.7 - uTime * 0.4) * 0.4;
                float foam = near * smoothstep(0.38, 0.62, fn + near * 0.25) * (1.0 - smoothstep(60.0, 160.0, ts));
                col = mix(col, vec3(0.9, 0.95, 0.93), foam * 0.75);
              }
            }
            col = mix(col, haze, smoothstep(220.0, 1100.0, ts) * 0.85);
            underPath = sky ? 100.0 : (sceneDist - ts);
          } else if (!sky) {
            col = mix(col, haze, smoothstep(180.0, 1000.0, sceneDist) * 0.8);
          }
        } else {
          if (sky) col = skyColor(dir);
          else col = mix(col, haze, smoothstep(180.0, 1000.0, sceneDist) * 0.8);
        }

        // 描边：近处物体轮廓压暗（水下随路径减弱）
        if (!sky && uOutline > 0.0) {
          vec2 px = 1.0 / uRes;
          float dmax = max(max(linDepth(uv + vec2(px.x, 0.0)), linDepth(uv - vec2(px.x, 0.0))), max(linDepth(uv + vec2(0.0, px.y)), linDepth(uv - vec2(0.0, px.y))));
          float e = smoothstep(0.06, 0.16, (dmax - dc) / max(dc, 0.1));
          float att = exp(-underPath * 0.07);
          col *= 1.0 - e * 0.5 * uOutline * att;
        }
        // 透明度通道带出“这是珍品”的记号（它的材质在场景缓冲的透明度上加了 1），给输出那一遍用
        gl_FragColor = vec4(col, clamp(texture2D(tColor, uv).a - 1.0, 0.0, 1.0));
      }`,
  });

  // —— 泛光：亮处（日光碎闪、灯、珍贵物的光）取出来，降到四分之一，横竖各模糊一遍 ——
  const brightMat = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, vertexShader: QUAD_VS,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tComp; uniform vec2 uRes;
      void main() {
        vec2 px = 1.0 / uRes;
        vec3 c = vec3(0.0);
        for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
          vec3 s = texture2D(tComp, vUv + (vec2(float(i), float(j)) - 0.5) * px * 2.0).rgb;
          float l = max(max(s.r, s.g), s.b);
          c += s * smoothstep(0.82, 1.35, l);
        }
        gl_FragColor = vec4(c * 0.25, 1.0);
      }`,
  });
  const blurMat = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, vertexShader: QUAD_VS,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tSrc; uniform vec2 uDir;
      void main() {
        float w[5]; w[0] = 0.227; w[1] = 0.194; w[2] = 0.122; w[3] = 0.054; w[4] = 0.016;
        vec3 c = texture2D(tSrc, vUv).rgb * w[0];
        for (int i = 1; i < 5; i++) { vec2 o = uDir * float(i) * 1.6; c += (texture2D(tSrc, vUv + o).rgb + texture2D(tSrc, vUv - o).rgb) * w[i]; }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });

  // —— 输出：泛光叠上去，高光柔肩（亮米色甲板不再一片白）、冷暖分调、暗角、揭宝光芒、闪白、抖动色阶 ——
  const outMat = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, vertexShader: QUAD_VS,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tComp; uniform sampler2D tBloom; uniform vec2 uRes;
      uniform float uFlash; uniform float uVignette; uniform vec4 uGrade; uniform float uLevels; uniform vec4 uHalo; uniform float uHaloT; uniform float uBloom; uniform vec4 uDesat;
      void main() {
        vec2 uv = vUv;
        vec4 cc = texture2D(tComp, uv);
        vec3 col = cc.rgb;
        // 珍品确认：整个世界褪成灰，只有它留着颜色；颜色从它那里一圈圈回到世界，前沿带一道金（泛光在这之后叠，它的金光不褪）
        if (uDesat.w > 0.0005) {
          float keep = clamp(cc.a, 0.0, 1.0);
          vec2 dd = (uv - uDesat.xy) * vec2(uRes.x / uRes.y, 1.0);
          float r = length(dd);
          float outside = smoothstep(uDesat.z - 0.06, uDesat.z + 0.02, r);
          float gk = uDesat.w * outside * (1.0 - keep);
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(col, vec3(lum) * vec3(0.9, 0.93, 0.97) * 0.8, gk);
          float band = exp(-pow((r - uDesat.z) / 0.05, 2.0)) * step(0.02, uDesat.z) * uDesat.w * (1.0 - keep);
          col += vec3(1.0, 0.74, 0.32) * band * 0.42;
        }
        col += texture2D(tBloom, uv).rgb * uBloom;
        // 高光柔肩：最亮的那个通道过了 0.78 就慢慢收住，色相不变
        float L = max(max(col.r, col.g), col.b);
        if (L > 0.78) { float L2 = 0.78 + (L - 0.78) / (1.0 + (L - 0.78) * 2.2); col *= L2 / L; }
        // 冷暖分调：暗部偏一点海青，亮部偏一点暖阳
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col *= mix(vec3(0.95, 1.0, 1.03), vec3(1.035, 1.0, 0.95), smoothstep(0.15, 0.75, lum));
        // 调色、暗角
        lum = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(lum), col, 1.0 + uGrade.w) * uGrade.rgb;
        vec2 q = uv - 0.5;
        col *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(q, q) * 2.2);
        // 揭宝辉光：主件周围的旋转光芒与暖晕（中心留空，不洗掉实物）
        if (uHalo.w > 0.001) {
          vec2 dd = (uv - uHalo.xy) * vec2(uRes.x / uRes.y, 1.0);
          float r = length(dd);
          float ang = atan(dd.y, dd.x);
          float rays = pow(max(0.0, 0.5 + 0.5 * sin(ang * 9.0 + uHaloT * 0.5) * sin(ang * 5.0 - uHaloT * 0.33 + 1.3)), 2.5);
          float fall = exp(-r / uHalo.z);
          float ring = smoothstep(uHalo.z * 0.22, uHalo.z * 0.55, r);
          vec3 hc = vec3(1.0, 0.8, 0.48);
          col += hc * uHalo.w * ring * (rays * fall * 0.75 + exp(-pow(r / (uHalo.z * 0.9), 2.0)) * 0.22);
        }
        col = mix(col, vec3(1.0, 0.97, 0.9), uFlash);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
        // 有序抖动 + 色阶（像素画质感）
        vec2 pp = floor(gl_FragCoord.xy);
        int bx = int(mod(pp.x, 4.0)); int by = int(mod(pp.y, 4.0));
        float bay[16]; bay[0]=0.;bay[1]=8.;bay[2]=2.;bay[3]=10.;bay[4]=12.;bay[5]=4.;bay[6]=14.;bay[7]=6.;bay[8]=3.;bay[9]=11.;bay[10]=1.;bay[11]=9.;bay[12]=15.;bay[13]=7.;bay[14]=13.;bay[15]=5.;
        float th = 0.0;
        for (int k = 0; k < 16; k++) { if (k == by * 4 + bx) th = bay[k]; }
        th = th / 16.0 - 0.5;
        gl_FragColor.rgb = floor(gl_FragColor.rgb * uLevels + 0.5 + th * 0.9) / uLevels;
      }`,
  });

  const quad = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  quad.geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  quad.geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  quad.frustumCulled = false;
  const pscene = new THREE.Scene();
  pscene.add(quad);
  const pcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const pass = (material, target) => { quad.material = material; renderer.setRenderTarget(target); renderer.render(pscene, pcam); };

  return {
    rt, uniforms,
    setSize(w, h) {
      rt.setSize(w, h); aoRT.setSize(w, h); compRT.setSize(w, h);
      const qw = Math.max(1, Math.round(w / 4)), qh = Math.max(1, Math.round(h / 4));
      bloomA.setSize(qw, qh); bloomB.setSize(qw, qh);
      uniforms.uRes.value.set(w, h);
    },
    render(scene, camera, overlayScene) {
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, camera);
      uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
      uniforms.uProjY.value = camera.projectionMatrix.elements[5];
      uniforms.uCamWorld.value.copy(camera.matrixWorld);
      uniforms.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
      if (uniforms.uAO.value > 0) pass(aoMat, aoRT);
      pass(mat, compRT);
      if (uniforms.uBloom.value > 0) {
        pass(brightMat, bloomA);
        uniforms.tSrc.value = bloomA.texture; uniforms.uDir.value.set(1 / bloomA.width, 0); pass(blurMat, bloomB);
        uniforms.tSrc.value = bloomB.texture; uniforms.uDir.value.set(0, 1 / bloomA.height); pass(blurMat, bloomA);
      }
      quad.material = outMat;
      renderer.setRenderTarget(null);
      renderer.autoClear = false;
      renderer.clear();
      renderer.render(pscene, pcam);
      if (overlayScene) renderer.render(overlayScene, camera);
      renderer.autoClear = true;
      quad.material = mat;
    },
  };
}
