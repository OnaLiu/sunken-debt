import { N } from './tables.js';
import { FUEL_MAX, netFuelCost } from '../config.js';

// 小小的事件总线
export class Events {
  constructor() {
    this.h = {};
  }
  on(name, fn) {
    (this.h[name] = this.h[name] || []).push(fn);
  }
  emit(name, data) {
    const l = this.h[name];
    if (l) for (const fn of l) fn(data);
  }
}

// 这一趟：油、网数、收获（揭晓那一刻一次记入）
// 这片海里最省的一网（配表「小样的数」一网最少的油）：剩的油比它少就是不够一网
export const MIN_NET_COST = N('一网最少的油');

export class Trip {
  constructor() {
    this.reset();
  }
  reset() {
    this.fuel = FUEL_MAX;
    this.nets = 0;
    this.haul = [];
    this.stowed = 0;
    this.netFuel = 0;
    this.sailFuel = 0;
    this.time = 0;
    this.ended = false;
    this.endReason = '';
    // 这一趟做到的事（收获单底下那一行）：看见过沉船、看见过深槽里那个东西
    this.sawWreck = false;
    this.sawLev = false;
  }
  spendFuel(c) {
    this.fuel = Math.max(0, this.fuel - c);
    this.netFuel += c;
  }
  burn(c) {
    this.fuel = Math.max(0, this.fuel - c);
    this.sailFuel += c;
  }
  record(entries) {
    for (const e of entries) {
      this.haul.push({ kind: e.kind, name: e.def.name, value: e.def.value, precious: !!e.def.precious, desc: e.def.desc, net: this.nets, from: e.from || '' });
    }
    return { count: this.haul.length, total: this.total };
  }
  get total() {
    return this.haul.reduce((s, h) => s + h.value, 0);
  }
}
