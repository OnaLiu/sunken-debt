import * as THREE from 'three';
import { BOAT_MAX_SPEED, BOAT_ACCEL, BOAT_TURN, FUEL_SAIL_RATE } from '../config.js';
import { wrapAngle, clamp, damp } from '../util/math.js';
import { waveHeight } from '../world/water.js';
import { LANE_BUOYS, SHOAL_MARK } from '../world/layout.js';

// 船的运动：摇杆方向（相对镜头）决定往哪开；停船时船位稳定，不漂。
export class BoatController {
  constructor(boat) {
    this.boat = boat;
    this.pos = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.throttle = 0;
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

  // dir: 世界水平方向向量（长度=推杆力度），fuel: 剩余油
  update(dt, dir, fuel, t) {
    let burn = 0;
    const mag = Math.min(1, Math.hypot(dir.x, dir.z));
    let targetSpeed = 0;
    let desiredTurn = 0;
    if (!this.brake && mag > 0.12 && fuel > 0) {
      const want = Math.atan2(-dir.z, dir.x);
      const err = wrapAngle(want - this.heading);
      // 照眼下转得多快往前看一点再定舵：转到位时船头稳稳停住，不冲过头再摆回来
      desiredTurn = clamp((err - this.turnRate * 0.12) * 2.2, -1, 1) * BOAT_TURN;
      const align = Math.max(0, Math.cos(err));
      targetSpeed = BOAT_MAX_SPEED * mag * Math.pow(align, 1.5);
      this.throttle = damp(this.throttle, mag, 3, dt);
      burn = FUEL_SAIL_RATE * this.throttle * dt;
    } else {
      this.throttle = damp(this.throttle, 0, 4, dt);
    }
    // 转向：慢速时用侧推，也转得动但慢
    const turnScale = 0.45 + 0.55 * Math.min(1, Math.abs(this.speed) / 3);
    this.turnRate = damp(this.turnRate, desiredTurn * turnScale, 4, dt);
    this.heading = wrapAngle(this.heading + this.turnRate * dt);
    const acc = targetSpeed > this.speed ? BOAT_ACCEL : (this.brake ? BOAT_ACCEL * 1.6 : BOAT_ACCEL * 0.75);
    if (this.speed < targetSpeed) this.speed = Math.min(targetSpeed, this.speed + acc * dt);
    else this.speed = Math.max(targetSpeed, this.speed - acc * dt);
    if (Math.abs(this.speed) < 0.02 && targetSpeed === 0) this.speed = 0;
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
