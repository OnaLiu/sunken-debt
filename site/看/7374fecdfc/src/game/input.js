// 输入：键盘、鼠标、手柄合成一份“手柄状态”。自动演示的机器人也只通过同一个虚拟手柄操作。
// 鼠标（第一段小样，全游戏以后都照这一份）：指针一直看得见，指着哪就是哪（ptr）；左键点，按住右键拖着转镜头（drag）。
// 原来那一整趟（trip=1）还是旧的：玩的时候锁在画面里（看不见指针），挪动只给位移——开船模式转镜头，打捞模式挪白圈；
// 左键进打捞模式、再按下网，右键退出。浏览器按 Esc 会自己放开锁，这一下也当成按了 Esc（和真的 Esc 键只算一次）

export class Input {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.edges = new Set();
    this.ptrX = 0; // 这一帧鼠标挪了多少（CSS 像素）
    this.ptrY = 0;
    this.wheel = 0;
    this.cx = 0; // 指针在 1920×1080 画面上的位置
    this.cy = 0;
    this.ptrOk = false; // 鼠标动过、知道它在哪了
    this.held = new Set(); // 按着的鼠标键
    this.device = 'kb'; // 'kb' | 'pad'
    this.virtual = null; // 机器人用：{lx, ly, rx, ry, zoom, a, b}
    this.botDriven = false;
    this.padPrev = {};
    this.locked = false;
    this.wantLock = false; // 游戏在玩（开船、打捞、作业）时要锁；菜单、标题、收获单不锁
    this.escAt = -1e9;
    this.lockLost = false;
    this.everLocked = false; // 锁过鼠标（原来一整趟）
    this.lockBroken = false; // 这个浏览器锁不上鼠标
    this.lockByClick = -1e9;
    this.state = { mx: 0, my: 0, lx: 0, ly: 0, px: 0, py: 0, zoom: 0, a: false, aHeld: false, click: false, rclick: false, b: false, bHeld: false, start: false, esc: false, any: false, tab: false, go: false, ptr: { x: 0, y: 0, ok: false, moved: false }, drag: false, peek: false };

    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (e.code === 'Escape') {
        // 浏览器放开鼠标锁的那一下已经算过一次 Esc 了
        if (this.everLocked && performance.now() - this.escAt < 500) return;
        this.escAt = performance.now();
      }
      if (!this.keys.has(e.code)) this.edges.add(e.code);
      this.keys.add(e.code);
      this.device = 'kb';
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.held.clear(); });
    el.addEventListener('mousedown', (e) => {
      this.device = 'kb';
      this.place(e);
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      // 玩的时候鼠标没锁住（按 Esc 放开过、浏览器没让马上再锁）：这一下只用来把鼠标收回画面，不算点了左键（不然一点就进了打捞模式）
      if (this.wantLock && !this.locked && !this.lockBroken && !this.botDriven && this.el.requestPointerLock) {
        this.lockByClick = performance.now();
        this.lock();
        return;
      }
      this.edges.add('Mouse' + e.button);
      this.held.add(e.button);
    });
    window.addEventListener('mouseup', (e) => this.held.delete(e.button));
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) this.place(e);
      let dx, dy;
      if (this.locked) { dx = e.movementX || 0; dy = e.movementY || 0; }
      else { dx = this.lastX === undefined ? 0 : e.clientX - this.lastX; dy = this.lastY === undefined ? 0 : e.clientY - this.lastY; }
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.ptrX += dx;
      this.ptrY += dy;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.device = 'kb';
    });
    el.addEventListener('wheel', (e) => {
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) this.everLocked = true;
      const was = this.locked;
      this.locked = document.pointerLockElement === el;
      if (was && !this.locked && !this.unlocking && performance.now() - this.escAt >= 500) {
        // 不是游戏自己放开的：玩家按了 Esc（浏览器先把锁收走了，键可能不再送来）
        this.escAt = performance.now();
        this.lockLost = true;
      }
      this.unlocking = false;
    });
    // 点了画面还是锁不上（浏览器不给锁）：以后就用没锁的鼠标，点一下就是点一下
    document.addEventListener('pointerlockerror', () => {
      if (performance.now() - this.lockByClick < 1000) this.lockBroken = true;
    });
  }

  // 画面在窗口里缩放了多少（鼠标的 CSS 像素换成 1920×1080 画面上的像素）
  get scale() {
    const r = this.el.getBoundingClientRect();
    return r.width > 0 ? r.width / 1920 : 1;
  }

  // 指针落在画面上哪一点（1920×1080 画面坐标）
  place(e) {
    const r = this.el.getBoundingClientRect();
    if (!(r.width > 0)) return;
    this.cx = ((e.clientX - r.left) / r.width) * 1920;
    this.cy = ((e.clientY - r.top) / r.width) * 1920;
    this.ptrOk = true;
  }

  lock() {
    if (this.botDriven || this.locked || !this.el.requestPointerLock) return;
    try {
      const p = this.el.requestPointerLock();
      if (p && p.catch) p.catch(() => { if (performance.now() - this.lockByClick < 1000) this.lockBroken = true; });
    } catch (e) { this.lockBroken = true; /* 锁不上就用没锁的鼠标位移 */ }
  }

  unlock() {
    if (!this.locked) return;
    this.unlocking = true;
    document.exitPointerLock();
  }

  _pad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  poll() {
    const s = this.state;
    const k = this.keys;
    const edge = (...codes) => codes.some((c) => this.edges.has(c));
    if (!this.wantLock && this.locked) this.unlock();
    let mx = 0, my = 0, lx = 0, ly = 0, zoom = 0;
    if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) mx += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) my += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) my -= 1;
    let px = this.ptrX, py = this.ptrY;
    zoom += this.wheel * 3.2;
    this.ptrX = this.ptrY = 0;
    this.wheel = 0;
    let a = edge('Space', 'Enter', 'KeyJ');
    let aHeld = k.has('Space') || k.has('Enter') || k.has('KeyJ') || this.held.has(0);
    let click = edge('Mouse0');
    let rclick = edge('Mouse2');
    let b = edge('KeyQ', 'KeyK', 'Backspace');
    let bHeld = k.has('KeyQ') || k.has('KeyK') || k.has('Backspace');
    let start = edge('KeyP');
    // 开冲（一甲板一起冲）：E，手柄 Y
    let go = edge('KeyE');
    // 按住左 Shift：镜头靠近指针指着的海底（peek.js）
    let peek = k.has('ShiftLeft');
    const esc = edge('Escape') || this.lockLost;
    this.lockLost = false;
    const tab = edge('Tab');
    let any = this.edges.size > 0;
    let cx = this.cx, cy = this.cy, ok = this.ptrOk, drag = this.held.has(2);

    const pad = this._pad();
    if (pad) {
      const dz = (v) => (Math.abs(v) < 0.16 ? 0 : (v - Math.sign(v) * 0.16) / 0.84);
      const ax = pad.axes;
      const pmx = dz(ax[0] || 0), pmy = -dz(ax[1] || 0);
      const plx = dz(ax[2] || 0), ply = -dz(ax[3] || 0);
      const btn = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
      const lt = pad.buttons[6] ? pad.buttons[6].value : 0;
      const rt = pad.buttons[7] ? pad.buttons[7].value : 0;
      const pressed = (i) => btn(i) && !this.padPrev[i];
      if (Math.abs(pmx) + Math.abs(pmy) + Math.abs(plx) + Math.abs(ply) > 0.1 || [0, 1, 9].some(btn)) this.device = 'pad';
      mx += pmx; my += pmy;
      lx += plx; ly += ply;
      zoom += (lt - rt) * 0.9;
      if (pressed(0)) a = true;
      if (btn(0)) aHeld = true;
      if (pressed(1)) b = true;
      if (btn(1)) bHeld = true;
      if (pressed(3)) go = true;
      if (pressed(9)) start = true;
      if (pressed(8)) start = true;
      if ([0, 1, 2, 3, 9].some(pressed)) any = true;
      for (let i = 0; i < pad.buttons.length; i++) this.padPrev[i] = btn(i);
    }

    // 机器人驾驶时，真实输入只留 Esc（接管）
    if (this.botDriven && this.virtual) {
      const v = this.virtual;
      mx = v.lx || 0; my = v.ly || 0; lx = v.rx || 0; ly = v.ry || 0; zoom = v.zoom || 0;
      px = v.px || 0; py = v.py || 0; click = !!v.click; rclick = false;
      // 机器人的鼠标：指针在哪、左键点没点、按没按着右键拖（没有指针的机器人照旧只推摇杆）
      ok = !!v.ptr; cx = v.ptr ? v.ptr.x : 0; cy = v.ptr ? v.ptr.y : 0; drag = !!v.drag; peek = !!v.peek;
      v.px = v.py = 0; v.click = false;
      a = !!v.a; aHeld = !!v.aHeld; b = !!v.b; bHeld = !!v.bHeld; start = !!v.start; go = !!v.go;
      v.a = false; v.b = false; v.start = false; v.go = false;
    }
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const ll = Math.hypot(lx, ly);
    if (ll > 1) { lx /= ll; ly /= ll; }
    const P = s.ptr;
    P.moved = ok && (!P.ok || Math.abs(P.x - cx) + Math.abs(P.y - cy) > 0.5);
    P.x = cx; P.y = cy; P.ok = ok;
    s.drag = drag; s.peek = peek;
    s.mx = mx; s.my = my; s.lx = lx; s.ly = ly; s.px = px; s.py = py; s.zoom = zoom;
    s.a = a; s.aHeld = aHeld; s.click = click; s.rclick = rclick; s.b = b; s.bHeld = bHeld; s.start = start; s.esc = esc; s.any = any; s.tab = tab && !this.botDriven; s.go = go;
    this.edges.clear();
    return s;
  }
}
