import * as THREE from 'three';
import { BOAT_MAX_SPEED, BOAT_ACCEL, FUEL_SAIL_RATE } from '../config.js';
import { wrapAngle, clamp, damp, lerp } from '../util/math.js';
import { waveHeight } from '../world/water.js';
import { LANE_BUOYS, SHOAL_MARK } from '../world/layout.js';

// 船的运动：往前往后照载具求生开车（它 js/drive.js 的 D.Car，地上那一段，没有氮气、飞、撞路边）：
// W 油门、S 刹车（停住接着按是倒船）；松了油门一路滑着慢下来。
// 转向不照真船真车：按 D 船头就往右转、按 A 就往左转，往前开、倒着开、停着都一样；按下去马上转，
// 水的阻力只让起转、停转柔和。停船时船位稳定，不漂。整个游戏一份。
// 车的数（载具求生旅行车开局那一辆：加速 6.6、刹车 9.5、滑行 1.1 + 0.0016v²、最快 80 公里每小时）按船快慢折过来：
// 船一秒加速 3.2 米（原来的数），其余几样照它和加速的比例；开足了稳在原来的最快 7.2 米每秒
const VM = BOAT_MAX_SPEED / 0.91; // 油门踩满、风阻吃掉以后正好 BOAT_MAX_SPEED
const KA = BOAT_ACCEL / 6.6;
const KV = 80 / 3.6 / VM; // 车的米每秒 : 船的米每秒
const BRAKE = 9.5 * KA;
const REV = VM * 0.45; // 倒船最快（照载具求生院子里倒车的比例：顶到的快慢本来就小）
const TURN = 0.95, TURN_FAST = 0.52; // 船头一秒转多少弧度：停着、慢慢走的时候，开足的时候
const STEER_K = 16; // 舵跟手（按下、松手都是）
const TURN_IN = 8, TURN_OUT = 6, TURN_REV = 11; // 船头起转、松手后滑停、反打的快慢：越小水的阻力越绵
const coastDec = (v, thr) => KA * ((thr < 0.05 ? 1.1 : 0.55) + 0.0016 * (v * KV) ** 2);
// 船走一步（速度、舵、船头朝向；不含位置）：c 上的 speed、thr、brk、steer、turnRate、heading。
// 玩家开、机器人预演（momentbot 的 plan）同一份
export function stepMotion(c, thrIn, brkIn, steerIn, braking, dt) {
  const v0 = c.speed;
  // 踏板跟手
  c.thr = damp(c.thr, thrIn, 14, dt);
  c.brk = damp(c.brk, brkIn, 16, dt);
  c.steer = damp(c.steer, steerIn, STEER_K, dt);
  // 往前、往后
  let acc = 0;
  if (c.thr > 0.02) {
    if (v0 < -0.16) acc += BRAKE * c.thr;
    else acc += BOAT_ACCEL * c.thr * (1 - Math.pow(clamp(v0 / VM, 0, 1), 2.4));
  }
  if (c.brk > 0.02) {
    if (v0 > 0.2) acc -= BRAKE * c.brk;
    else if (-v0 < REV) acc -= BOAT_ACCEL * 0.6 * c.brk * (1 - clamp(-v0 / REV, 0, 1));
  }
  if (braking) acc = -Math.sign(v0) * BOAT_ACCEL * 1.6; // 按了下网：自己很短地刹住
  else acc -= Math.sign(v0) * coastDec(v0, c.thr);
  const idle = c.thr < 0.05 && c.brk < 0.05;
  const v1 = v0 + acc * dt;
  // 滑到头、刹到头就停住，不来回跳
  const v = (idle || braking) && (v0 === 0 || v0 * v1 <= 0 || Math.abs(v1) < 0.02) ? 0 : v1;
  c.speed = v;
  // 船头往哪边转只看舵，不看船往前还是往后、走没走
  const w = -c.steer * lerp(TURN, TURN_FAST, clamp(Math.abs(v) / BOAT_MAX_SPEED, 0, 1));
  const out = Math.abs(w) < Math.abs(c.turnRate) && w * c.turnRate >= 0;
  c.turnRate = damp(c.turnRate, w, w * c.turnRate < 0 ? TURN_REV : out ? TURN_OUT : TURN_IN, dt);
  if (!steerIn && Math.abs(c.turnRate) < 0.004) c.turnRate = 0;
  c.heading = wrapAngle(c.heading + c.turnRate * dt);
}

export class BoatController {
  constructor(boat) {
    this.boat = boat;
    this.pos = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.throttle = 0; // 引擎（声音、烟、船尾下压、油）：缓缓跟上
    this.thr = 0; // 踏板：跟手
    this.brk = 0;
    this.steer = 0; // 舵：右正
    this.turnRate = 0;
    this.roll = 0;
    this.pitch = 0;
    this.heave = 0;
    this.brake = false;
    this.fuelUsed = 0;
    // 重东西砸上甲板：整条船往下一沉再浮起（弹簧）
    this.dip = 0;
    this.dipV = 0;
    this.obstacles = [
      ...LANE_BUOYS.map((b) => ({ x: b.x, z: b.z, r: 2.6 })),
      { x: SHOAL_MARK.x, z: SHOAL_MARK.z, r: 3.0 },
    ];
  }

  reset(x, z, heading) {
    this.pos.set(x, 0, z);
    this.heading = heading;
    this.speed = 0;
    this.throttle = 0;
    this.thr = this.brk = this.steer = 0;
    this.turnRate = 0;
    this.dip = 0;
    this.dipV = 0;
  }

  kick(depth) {
    this.dipV -= depth * 9;
  }

  get forward() {
    return new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));
  }

  // 开足了稳在多快
  get cruise() { return BOAT_MAX_SPEED; }

  // 松了油门（或者按了下网、自动刹车）还要滑多远
  stopDist() {
    const v = Math.max(0, this.speed);
    if (this.brake) return (v * v) / (2 * BOAT_ACCEL * 1.6);
    const a = KA * 1.1, b = KA * 0.0016 * KV * KV;
    return Math.log(1 + (b * v * v) / a) / (2 * b);
  }

  // inp：throttle 0..1，brake 0..1，steer -1..1（右正）；fuel：剩余油
  update(dt, inp, fuel, t) {
    let burn = 0;
    const able = !this.brake && fuel > 0;
    const thrIn = able ? clamp(inp.throttle || 0, 0, 1) : 0, brkIn = able ? clamp(inp.brake || 0, 0, 1) : 0;
    const steerIn = this.brake ? 0 : clamp(inp.steer || 0, -1, 1);
    // 油：引擎出力就烧（给油、倒船）；往前滑着踩刹车不算出力
    const push = Math.max(thrIn, this.speed < 0.2 ? brkIn : 0);
    if (push > 0.12) {
      this.throttle = damp(this.throttle, push, 3, dt);
      burn = FUEL_SAIL_RATE * this.throttle * dt;
    } else {
      // 只转不走：引擎轻轻地出力（听得见、看得见桨在搅），不烧油
      const t0 = able && steerIn ? 0.3 : 0;
      this.throttle = damp(this.throttle, t0, t0 > this.throttle ? 5 : 4, dt);
    }
    stepMotion(this, thrIn, brkIn, steerIn, this.brake, dt);
    const f = this.forward;
    this.pos.addScaledVector(f, this.speed * dt);
    // 绕开浮标和标杆
    for (const o of this.obstacles) {
      const dx = this.pos.x - o.x, dz = this.pos.z - o.z;
      const d = Math.hypot(dx, dz);
      if (d < o.r && d > 0.001) {
        this.pos.x = o.x + (dx / d) * o.r;
        this.pos.z = o.z + (dz / d) * o.r;
        this.speed *= 0.97;
      }
    }
    this.pos.x = clamp(this.pos.x, -225, 105);
    this.pos.z = clamp(this.pos.z, -105, 95);

    // 浪：船头、船尾、两舷取样
    const hx = Math.cos(this.heading), hz = -Math.sin(this.heading);
    const bowH = waveHeight(this.pos.x + hx * 4.5, this.pos.z + hz * 4.5, t);
    const sternH = waveHeight(this.pos.x - hx * 4.5, this.pos.z - hz * 4.5, t);
    const portH = waveHeight(this.pos.x + hz * 1.8, this.pos.z - hx * 1.8, t);
    const stbdH = waveHeight(this.pos.x - hz * 1.8, this.pos.z + hx * 1.8, t);
    const heave = (bowH + sternH + portH + stbdH) / 4;
    this.heave = damp(this.heave, heave, 5, dt);
    // 起步那一下船尾压低（squat 由起步时给一下，慢慢回）
    this.squat = damp(this.squat || 0, 0, 2.2, dt);
    this.pitch = damp(this.pitch, Math.atan2(bowH - sternH, 9) * 0.8 + this.throttle * 0.035 + this.squat, 4, dt);
    this.roll = damp(this.roll, Math.atan2(stbdH - portH, 3.6) * 0.8 - this.turnRate * this.speed * 0.025, 4, dt);

    const root = this.boat.root;
    root.position.set(this.pos.x, 0, this.pos.z);
    root.rotation.set(0, this.heading, 0);
    this.dipV += (-60 * this.dip - 5.5 * this.dipV) * dt;
    this.dip += this.dipV * dt;
    this.boat.body.position.y = this.heave - 0.02 * this.throttle + this.dip;
    // 沉下去那一下船尾（甲板货区那头）多沉一点
    this.boat.body.rotation.set(this.roll, 0, this.pitch - this.dip * 0.06, 'XYZ');
    this.fuelUsed += burn;
    return burn;
  }

  // 船局部 → 世界（不含起伏）
  localToWorld(v, out = new THREE.Vector3()) {
    const c = Math.cos(this.heading), s = Math.sin(this.heading);
    out.set(this.pos.x + v.x * c + v.z * s, v.y, this.pos.z - v.x * s + v.z * c);
    return out;
  }
  worldToLocal(v, out = new THREE.Vector3()) {
    const c = Math.cos(this.heading), s = Math.sin(this.heading);
    const dx = v.x - this.pos.x, dz = v.z - this.pos.z;
    out.set(dx * c - dz * s, v.y, dx * s + dz * c);
    return out;
  }
}
