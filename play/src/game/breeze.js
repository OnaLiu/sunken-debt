// 风吹过（A3 画面上的那一半）：配乐每起一个和弦（audio-ambient.js 按 7–9 秒排），海面上就有一阵风从上风头扫过来——
// 水面一片一片起细纹、颜色沉下去（“猫爪风”），扫过船时桅顶小旗抖得更急。和弦的滤波器 3.6 秒开到最亮，风头也在那时正好扫过船。
// 只是表现，不碰船、不碰网。
const WIND = [0.861, 0.508]; // 和 boatlook.js 里小旗的真风同一个方向（2.2, 1.3）
const DUR = 9.5, PEAK = 3.6, SPEED = 15;

export class Breeze {
  constructor(game) {
    this.g = game; this.U = game.view.post.uniforms;
    this.on = false; this.t = 0; this.n = 0;
    if (game.audio) game.audio.onChord = () => this.gust();
  }
  gust() { this.on = true; this.t = 0; this.n++; const b = this.g.boat; this.cx = b.x; this.cz = b.z; }
  update(dt) {
    const U = this.U, b = this.g.boat;
    if (!this.on) { U.uGust.value.w = 0; b.gustFx = 0; return; }
    this.t += dt;
    const T = this.t;
    if (T > DUR) { this.on = false; U.uGust.value.w = 0; b.gustFx = 0; return; }
    // 强弱跟和弦一样：2.6 秒起来，3.8 秒以后慢慢落
    const up = Math.min(1, T / 2.8), k = (up * up * (3 - 2 * up)) * (T < 3.8 ? 1 : Math.pow(Math.max(0, 1 - (T - 3.8) / (DUR - 3.8)), 1.4));
    // 风头：PEAK 秒时正好扫过船（以起风时船的位置为准）
    U.uGust.value.set(WIND[0], WIND[1], (T - PEAK) * SPEED, k);
    U.uGustC.value.set(this.cx, this.cz);
    // 小旗：风头到船那一阵最急
    const d = (T - PEAK) * SPEED, near = Math.exp(-(d * d) / (30 * 30));
    b.gustFx = k * (0.4 + 0.6 * near);
  }
}
