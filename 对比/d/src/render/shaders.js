// 全部材质共用的 GLSL：卡通光照、水下衰减、焦散、阴影、草叶摆动、泥壳。

export const COMMON = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uAmbSky;
uniform vec3 uAmbGround;
uniform vec3 uWaterShallow;
uniform vec3 uWaterDeep;
uniform float uKView;
uniform float uKDown;
uniform vec3 uFogCol;
uniform float uFogNear;
uniform float uFogFar;
uniform float uWobble;
uniform vec2 uCurrent;
uniform float uCaustic;
// 镜头此刻在画面上走得多快（0 静止 … 1 很快）：焦散细线、海雪细点按它淡成平均亮度，快转快推时不一格一格地闪
uniform float uMotion;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3){
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float vnoise3(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i), n100 = hash13(i + vec3(1,0,0));
  float n010 = hash13(i + vec3(0,1,0)), n110 = hash13(i + vec3(1,1,0));
  float n001 = hash13(i + vec3(0,0,1)), n101 = hash13(i + vec3(1,0,1));
  float n011 = hash13(i + vec3(0,1,1)), n111 = hash13(i + vec3(1,1,1));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
             mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
float fbm2(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return s / 0.9375;
}

// 焦散：两层会动的 Voronoi 边，交出一张细亮网
vec2 hash22(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
// w：一个像素在这一层网上占多宽（片元里用 fwidth 算好传进来；这段也进顶点着色器，那里没有 fwidth）
float causticLayer(vec2 p, float t, float w){
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = hash22(i + g);
    o = 0.5 + 0.42 * sin(t * 0.8 + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  float e = sqrt(d2) - sqrt(d1);
  // 一个像素在网上占多宽（贴着水面斜看、离得远时很宽）：线至少一个像素宽，亮度按变宽的比例压下去；
  // 网眼细到一两个像素的地方不再画线，换成网的平均亮度——不会一格一格地闪
  float lw = 0.16 + w * 0.7;
  float line = (1.0 - smoothstep(0.0, lw, e)) * (0.16 / lw);
  // 镜头转得、推得快时也一样换成平均亮度（像动态模糊）：细线在画面上一帧跳几格时最闪
  return mix(line, 0.19, max(smoothstep(0.12, 0.4, w), uMotion));
}
float caustics(vec2 xz, float t, float fw){
  float a = causticLayer(xz * 0.55, t, fw * 0.55);
  float b = causticLayer(xz * 0.43 + vec2(3.7, 1.3) + vec2(t * 0.05, -t * 0.04), t * 1.2 + 4.0, fw * 0.43);
  return clamp(a * 0.7 + b * 0.55 + a * b * 0.8, 0.0, 1.6);
}

// 水下：视线在水里走过的路程 + 光下到这个深度的路程，决定能看清多少
vec3 waterTint(vec3 col, vec3 P, out float trans){
  trans = 1.0;
  if (P.y >= 0.0) {
    float d = length(P - cameraPosition);
    float f = smoothstep(uFogNear, uFogFar, d);
    return mix(col, uFogCol, f * 0.85);
  }
  float depth = -P.y;
  vec3 C = cameraPosition;
  float total = length(P - C);
  float frac = C.y > 0.0 ? depth / max(C.y - P.y, 0.001) : 1.0;
  float path = total * frac;
#ifdef SEE
  // 大轮廓：少吃一点水色，露出自己的深色——读起来是一条比海底更暗的长影
  trans = exp(-(path * uKView + depth * uKDown) * SEE);
#elif defined(CLEAR)
  // 深处的铜件：少吃一点水色、少褪一点红，十几米水下还透得出铜的黄
  trans = exp(-(path * uKView + depth * uKDown) * CLEAR);
#else
  trans = exp(-(path * uKView + depth * uKDown));
#endif
#ifdef CLEAR
  vec3 absorb = exp(-vec3(0.034, 0.032, 0.020) * (path * 0.55 + depth) * CLEAR);
#else
  vec3 absorb = exp(-vec3(0.105, 0.032, 0.020) * (path * 0.55 + depth));
#endif
#ifdef SEE
  // 大轮廓浮到深槽上沿时，四周的水色也按深槽底那么深算：读起来是一条比深槽更暗的影子，不是一条被浅水色冲亮的灰影
  float deepness = 1.0 - exp(-((depth + 14.0) * 0.065 + path * 0.018));
#else
  float deepness = 1.0 - exp(-(depth * 0.065 + path * 0.018));
#endif
  vec3 waterCol = mix(uWaterShallow, uWaterDeep, deepness);
  return mix(waterCol, col * absorb, trans);
}

vec3 hemiAmb(vec3 N){
  return mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);
}
`;

export const SHADOW_PARS = /* glsl */ `
uniform sampler2D uShadowMap;
uniform mat4 uShadowMat;
uniform float uShadowTexel;
uniform float uShadowSpan;
float shadowAt(vec3 wp, vec3 N){
  // 偏移跟着阴影贴图一格的大小走：近景时影子贴着东西，不浮开
  vec4 sc = uShadowMat * vec4(wp + N * (0.015 + uShadowSpan * 0.0011), 1.0);
  vec3 s = sc.xyz / sc.w;
  if (s.x <= 0.002 || s.x >= 0.998 || s.y <= 0.002 || s.y >= 0.998 || s.z >= 1.0) return 1.0;
  float b = (0.02 + uShadowSpan * 0.0024) / 259.0;
  float o = uShadowTexel * 0.75;
  float sum = 0.0;
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2(-o, -o)).r);
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2( o, -o)).r);
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2(-o,  o)).r);
  sum += step(s.z - b, texture2D(uShadowMap, s.xy + vec2( o,  o)).r);
  return sum * 0.25;
}
`;

// 顶点变换：实例化、草叶摆动、鱼尾摆、泥壳鼓起、水下折射抖动
export const VERT_TRANSFORM = /* glsl */ `
#ifdef SWAY
uniform vec4 uPress[8];
#endif
#ifdef MUD
uniform float uMud;
uniform float uMudInflate;
uniform float uMudSeed;
uniform float uMudScale;
#endif
#ifdef FISH
uniform float uFishSpeed;
#endif
#ifdef CLOTH
uniform float uClothAmp;
attribute float aCloth;
#endif

vec4 transformWorld(vec3 p, inout vec3 n, out vec3 localP){
  localP = p;
#ifdef MUD
  float mf = vnoise3(p * uMudScale + uMudSeed) * 0.65 + vnoise3(p * uMudScale * 2.7 + uMudSeed * 1.7) * 0.35;
  float lump = smoothstep(0.25, 0.85, mf);
  p += n * uMudInflate * uMud * (0.35 + lump * 0.9);
#endif
#ifdef FISH
  float fph = 0.0;
  #ifdef USE_INSTANCING
  fph = hash12(instanceMatrix[3].xz * 3.1) * 6.283;
  #endif
  float tailK = clamp(-p.x * 2.2, 0.0, 1.5);
  p.z += sin(uTime * (9.0 + uFishSpeed * 8.0) + fph + p.x * 5.0) * tailK * 0.11;
#endif
#ifdef CLOTH
  {
    float w = aCloth * uClothAmp;
    float ph = uTime * 1.25 + p.x * 0.55 + p.z * 0.45;
    p += vec3(uCurrent.x * 0.8, 1.0, uCurrent.y * 0.8) * (sin(ph) * 0.55 + sin(ph * 1.9 + 1.3) * 0.25 + 0.4) * w;
  }
#endif
  vec4 wp;
#ifdef USE_INSTANCING
  wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  n = mat3(modelMatrix) * mat3(instanceMatrix) * n;
#else
  wp = modelMatrix * vec4(p, 1.0);
  n = mat3(modelMatrix) * n;
#endif
#ifdef SWAY
  {
    vec3 base;
    float sy;
    #ifdef USE_INSTANCING
    base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    sy = length(instanceMatrix[1].xyz);
    #else
    base = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    sy = 1.0;
    #endif
    float hn = clamp(p.y, 0.0, 1.0);
    float ph = hash12(base.xz) * 6.283;
    float k = hn * hn;
    vec2 sway = uCurrent * (0.55 + 0.25 * sin(uTime * 0.7 + base.x * 0.13));
    sway += vec2(sin(uTime * 1.25 + ph + base.x * 0.21), cos(uTime * 1.05 + ph * 1.3 + base.z * 0.19)) * 0.22 * SWAY_AMP;
    float flatK = 0.0;
    for (int i = 0; i < 8; i++) {
      vec4 pr = uPress[i];
      if (pr.w <= 0.0) continue;
      vec2 d = base.xz - pr.xy;
      float r = length(d);
      float f = pr.w * (1.0 - smoothstep(pr.z * 0.55, pr.z, r));
      sway += (d / max(r, 0.05)) * f * 1.4;
      flatK = max(flatK, f);
    }
    wp.xz += sway * k * sy;
    wp.y -= flatK * k * sy * 0.55;
  }
#endif
  if (wp.y < 0.0 && uWobble > 0.0) {
    float d = clamp(-wp.y / 10.0, 0.0, 1.0);
    float w = uWobble * 0.055 * d;
    wp.x += sin(uTime * 1.7 + wp.z * 0.55 + wp.x * 0.21) * w;
    wp.z += cos(uTime * 1.45 + wp.x * 0.5 - wp.z * 0.17) * w;
  }
  return wp;
}
`;

export const TOON_VERT = /* glsl */ `
${COMMON}
${VERT_TRANSFORM}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
#if defined(USE_COLOR) || defined(USE_INSTANCING_COLOR)
varying vec3 vColor;
#endif
#ifdef SWAY
varying float vH;
#endif
#ifdef SEABED
attribute float aRipple;
varying float vRipple;
#endif
#ifdef NET
varying vec2 vUv;
#endif
void main(){
  vec3 n = normal;
  vec3 lp;
  vec4 wp = transformWorld(position, n, lp);
  vWorld = wp.xyz;
  vNormal = normalize(n);
  vLocal = lp;
#if defined(USE_COLOR) || defined(USE_INSTANCING_COLOR)
  vColor = vec3(1.0);
  #ifdef USE_COLOR
  vColor *= color;
  #endif
  #ifdef USE_INSTANCING_COLOR
  vColor *= instanceColor;
  #endif
#endif
#ifdef SWAY
  vH = clamp(position.y, 0.0, 1.0);
#endif
#ifdef SEABED
  vRipple = aRipple;
#endif
#ifdef NET
  vUv = uv;
#endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const TOON_FRAG = /* glsl */ `
${COMMON}
${SHADOW_PARS}
uniform vec3 uColor;
uniform float uSpec;
uniform float uShin;
uniform vec3 uEmissive;
uniform float uOpacity;
#ifdef ITEM
uniform float uItemMark;
#endif
#ifdef MUD
uniform float uMud;
uniform float uMudSeed;
uniform float uMudScale;
uniform vec3 uMudCol;
uniform float uCrust;
uniform vec3 uWashDir;
uniform float uWashBias;
#endif
#ifdef SEABED
uniform vec2 uRippleDir;
#endif
#ifdef GLINT
uniform float uGlint;
#endif
#ifdef WOOD
uniform vec4 uWood;
#endif
#ifdef MOSS
uniform vec4 uMoss;
#endif
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
#ifdef USE_COLOR
varying vec3 vColor;
#endif
#ifdef SWAY
varying float vH;
#endif
#ifdef SEABED
varying float vRipple;
#endif
#ifdef NET
varying vec2 vUv;
uniform vec2 uNetGrid;
#endif
#ifdef DISSOLVE
uniform float uDissolve;
uniform float uDissolveSeed;
#endif

void main(){
#ifdef DISSOLVE
  float dn = vnoise3(vLocal * 3.1 + uDissolveSeed) * 0.6 + vnoise3(vLocal * 7.3 + uDissolveSeed) * 0.4;
  // 从上往下被冲开
  float dh = dn - vLocal.y * 0.3 + 0.5;
  float dth = uDissolve * 1.62 - 0.1;
  if (dh < dth) discard;
  float rim = 1.0 - smoothstep(0.0, 0.07, dh - dth);
#endif
#ifdef NET
  {
    vec2 g = fract(vUv * uNetGrid);
    if (g.x > 0.2 && g.y > 0.2) discard;
  }
#endif
  vec3 albedo = uColor;
#ifdef USE_COLOR
  albedo *= vColor;
#endif
#ifdef SWAY
  albedo *= mix(0.74, 1.2, vH);
#endif
#ifdef FLAT
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
#else
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
#endif
  float spec = uSpec;
  float shin = uShin;

#ifdef SEABED
  // 沙纹：垂直于水流的细纹，远处淡出
  float camD = length(vWorld - cameraPosition);
  float rfade = 1.0 - smoothstep(26.0, 60.0, camD);
  vec2 rd = uRippleDir;
  float warp = vnoise(vWorld.xz * 0.35) * 3.0;
  float rp = sin(dot(vWorld.xz, rd) * 7.5 + warp * 2.0);
  float flatness = smoothstep(0.82, 0.97, N.y);
  vec2 perp = vec2(rd.x, rd.y);
  N = normalize(N + vec3(perp.x, 0.0, perp.y) * rp * 0.22 * rfade * flatness * vRipple);
  float speck = hash12(floor(vWorld.xz * 6.0));
  albedo *= 0.94 + speck * 0.1;
  albedo *= 0.9 + 0.2 * vnoise(vWorld.xz * 0.18);
#endif

#ifdef WOOD
  {
    // 木板：沿局部 x 一条条铺开，板缝、错开的接头、木纹和钉眼。
    // 板窄到两三个像素时缝淡下去，远看是一片木色，不闪
    float u = vLocal.z / uWood.x;
    float row = floor(u);
    float fu = fract(u);
    float off = hash12(vec2(row, 3.7)) * uWood.y;
    float v = (vLocal.x + off) / uWood.y;
    float seg = floor(v);
    float fv = fract(v);
    float fwU = fwidth(u);
    float fwV = fwidth(v);
    float vis = 1.0 - smoothstep(0.2, 0.38, fwU);
    float seamU = 1.0 - smoothstep(0.0, max(fwU * 1.1, 0.035), min(fu, 1.0 - fu));
    float seamV = 1.0 - smoothstep(0.0, max(fwV * 1.1, 0.004), min(fv, 1.0 - fv));
    float tone = hash12(vec2(row, seg) + 0.5);
    float gr = vnoise(vec2(vLocal.x * 2.4 + tone * 9.0, u * 5.0));
    float streak = vnoise(vec2(vLocal.x * 0.6 + row * 1.7, u * 1.5));
    albedo *= 0.9 + tone * 0.15 + ((gr - 0.5) * 0.16 * uWood.w + (streak - 0.5) * 0.1) * mix(0.4, 1.0, vis);
    albedo *= 1.0 - max(seamU, seamV * 0.85) * 0.45 * vis * uWood.z;
    // 钉眼：每块板两头各一对
    vec2 nl = vec2(min(fv, 1.0 - fv) * uWood.y - 0.06, abs(abs(fu - 0.5) - 0.25) * uWood.x);
    float nd = length(nl);
    float fwN = fwidth(vLocal.x) * 1.2;
    albedo *= 1.0 - (1.0 - smoothstep(0.012, 0.012 + max(fwN, 0.006), nd)) * 0.4 * (1.0 - smoothstep(0.12, 0.25, fwU));
  }
#endif

#ifdef MOSS
  {
    // 水下的木头和石头：朝上的面长一层斑驳的藻，零星几点白色的藤壶
    float up = clamp(N.y, 0.0, 1.0);
    float m = vnoise(vWorld.xz * 1.3 + vWorld.y * 0.8) * 0.62 + vnoise(vWorld.xz * 4.1 - vWorld.y * 1.9) * 0.38;
    float k = smoothstep(0.42, 0.7, m * (0.45 + up * 0.85)) * uMoss.w;
    albedo = mix(albedo, uMoss.rgb * (0.8 + m * 0.4), k);
    vec2 bc = vWorld.xz * 9.0 + vec2(vWorld.y * 5.0);
    float bk = step(0.94, hash12(floor(bc))) * (1.0 - smoothstep(0.25, 0.5, fwidth(bc.x)));
    albedo = mix(albedo, vec3(0.8, 0.78, 0.7), bk * 0.55 * uMoss.w * (1.0 - k * 0.6));
  }
#endif

#ifdef MUD
  float mf = vnoise3(vLocal * uMudScale + uMudSeed) * 0.65 + vnoise3(vLocal * uMudScale * 2.7 + uMudSeed * 1.7) * 0.35;
  float thresh = 1.08 - uMud * 1.25;
  thresh += dot(normalize(vLocal + vec3(0.0001)), uWashDir) * uWashBias;
  float cover = smoothstep(thresh - 0.05, thresh + 0.05, mf);
  float grain = vnoise3(vLocal * 22.0 + uMudSeed);
  vec3 mudc = uMudCol * (0.78 + grain * 0.4);
  float crustM = step(0.78, vnoise3(vLocal * 15.0 + uMudSeed * 3.1)) * uCrust * smoothstep(0.15, 0.6, uMud);
  mudc = mix(mudc, vec3(0.62, 0.6, 0.52), crustM);
  float wetEdge = smoothstep(thresh + 0.02, thresh + 0.10, mf) - smoothstep(thresh + 0.10, thresh + 0.2, mf);
  albedo = mix(albedo, mudc, cover);
  albedo *= 1.0 - wetEdge * 0.25 * uMud;
  spec = mix(spec, 0.35, cover * 0.6);
  shin = mix(shin, 18.0, cover);
#endif

  float sh = shadowAt(vWorld, N);
  // 深水里阴影被散射光冲淡
  float under = clamp(-vWorld.y, 0.0, 60.0);
  float shadowFade = exp(-under * 0.05);
  float ndl = dot(N, uSunDir);
  float lit = clamp(ndl, 0.0, 1.0) * mix(1.0, sh, shadowFade);
  float band = lit > 0.5 ? 1.0 : (lit > 0.14 ? 0.62 : (lit > 0.02 ? 0.3 : 0.0));
  vec3 amb = hemiAmb(N);
  vec3 col = albedo * (amb + uSunCol * band);

  vec3 V = normalize(cameraPosition - vWorld);
  if (spec > 0.0) {
    vec3 H = normalize(uSunDir + V);
    float s = pow(max(dot(N, H), 0.0), shin) * lit;
#ifdef CLEAR
    // 深处的铜件：在水下时高光带着铜自己的颜色（金属的反光是有颜色的），少吃水色以后不烧成一条白；捞上船以后和别的铜件一样
    vec3 sc = mix(uSunCol, uSunCol * albedo / max(max(albedo.r, albedo.g), 0.05) * 0.3, smoothstep(0.0, 2.0, -vWorld.y));
#else
    vec3 sc = uSunCol;
#endif
    col += sc * step(0.5, s) * spec;
    col += sc * step(0.2, s) * spec * 0.35;
  }
#ifdef GLINT
  // 金属在网口下偶尔闪一下（真实的反光，不是提示）
  // uGlint 超过 1：阳光正扫过的那一下，整块金属亮起一片碎光（不超过 1 时和平常一样）
  float fl = clamp(uGlint - 1.0, 0.0, 1.0);
  float gl = step(mix(0.985, 0.5, fl), hash12(floor(vLocal.xz * 9.0) + floor(uTime * 2.5))) * min(uGlint, 1.0 + fl * 0.5);
  col += vec3(1.0, 0.95, 0.8) * gl * band;
#endif

  if (vWorld.y < 0.0) {
    float cz = exp(-under * 0.075) * uCaustic;
    vec2 cxz = vWorld.xz + uSunDir.xz * vWorld.y * 0.8;
    float c = caustics(cxz, uTime, fwidth(cxz.x) + fwidth(cxz.y));
    col += albedo * uSunCol * c * cz * clamp(N.y, 0.0, 1.0) * sh * 0.85;
  }
#ifdef DISSOLVE
  col *= 1.0 - rim * 0.35;
  col += rim * vec3(0.05, 0.04, 0.02);
#endif
  col += uEmissive;
#ifdef CLEAR
  // 少吃了水色就比周围亮一截：压回来一点，铜色不被描边的亮边推到发白
  col *= mix(1.0, 0.74, smoothstep(0.0, 2.0, -vWorld.y));
#endif
#ifdef SEE
  // 大轮廓浮到离海底两三米时身上被照亮，会比底下的海底还亮：在水下压暗一截，始终是一条暗影
  col *= mix(1.0, 0.6, smoothstep(0.0, 2.0, -vWorld.y));
#endif
  float tr;
  col = waterTint(col, vWorld, tr);
#ifdef ITEM
  gl_FragColor = vec4(col, uItemMark > 0.5 ? 0.0 : uOpacity);
#else
  gl_FragColor = vec4(col, uOpacity);
#endif
}
`;

export const SHADOW_VERT = /* glsl */ `
${COMMON}
${VERT_TRANSFORM}
#ifdef NET
varying vec2 vUv;
#endif
#ifdef DISSOLVE
varying vec3 vLocal;
#endif
void main(){
  vec3 n = normal;
  vec3 lp;
  vec4 wp = transformWorld(position, n, lp);
#ifdef NET
  vUv = uv;
#endif
#ifdef DISSOLVE
  vLocal = lp;
#endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const SHADOW_FRAG = /* glsl */ `
#ifdef NET
varying vec2 vUv;
uniform vec2 uNetGrid;
#endif
#ifdef DISSOLVE
${COMMON}
varying vec3 vLocal;
uniform float uDissolve;
uniform float uDissolveSeed;
#endif
void main(){
#ifdef DISSOLVE
  float dn = vnoise3(vLocal * 3.1 + uDissolveSeed) * 0.6 + vnoise3(vLocal * 7.3 + uDissolveSeed) * 0.4;
  if (dn - vLocal.y * 0.3 + 0.5 < uDissolve * 1.62 - 0.1) discard;
#endif
#ifdef NET
  vec2 g = fract(vUv * uNetGrid);
  if (g.x > 0.2 && g.y > 0.2) discard;
#endif
  gl_FragColor = vec4(1.0);
}
`;
