// 输入：键盘 + 鼠标 + 手柄，归一成同一组动作。A=下网/确认，B=返回，Y=切换航行/作业，Start=暂停
// 键盘：WASD 船/臂，Q/E 转视角，R/F 俯仰，滚轮缩放，空格=A，Tab=切换，C 收起结果卡，Esc 暂停/接管，F1 隐藏界面
export class Input {
  constructor(el) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { dx: 0, dy: 0, wheel: 0, down: [false, false, false], x: 0, y: 0, click: null, dragged: 0 };
    this.padPrev = {};
    this.el = el;
    this.enabled = true;
    this.dev = 'kb';   // 最近用的是键鼠还是手柄：屏幕上的键帽只写这一种
    addEventListener('keydown', (e) => {
      if (e.repeat) { if (['Space', 'Tab'].includes(e.code)) e.preventDefault(); return; }
      this.keys.add(e.code); this.pressed.add(e.code);
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.down = [false, false, false]; });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    // 点在界面上（面板、按钮、卡片）的不算点海面，也不拖镜头
    const onUI = (e) => !!(e.target && e.target.closest && e.target.closest('#hud') && e.target.id !== 'hud');
    el.addEventListener('mousedown', (e) => { if (onUI(e)) return; this.mouse.down[e.button] = true; this.mouse.dragged = 0; this.mouse.sx = e.clientX; this.mouse.sy = e.clientY; });
    addEventListener('mouseup', (e) => {
      if (this.mouse.down[e.button] && e.button === 0 && this.mouse.dragged < 6) this.mouse.click = this.toStage(e.clientX, e.clientY);
      this.mouse.down[e.button] = false;
    });
    addEventListener('mousemove', (e) => {
      if (this.mouse.down[0] || this.mouse.down[2]) { this.mouse.dx += e.movementX; this.mouse.dy += e.movementY; this.mouse.dragged += Math.abs(e.movementX) + Math.abs(e.movementY); }
      const p = this.toStage(e.clientX, e.clientY); this.mouse.x = p.x; this.mouse.y = p.y;
    });
    el.addEventListener('wheel', (e) => { if (onUI(e)) return; this.mouse.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    this.stageRect = () => el.getBoundingClientRect();
  }
  toStage(cx, cy) { const r = this.stageRect(); return { x: (cx - r.left) / r.width, y: (cy - r.top) / r.height }; }
  // 每帧采样
  poll() {
    const k = (c) => this.keys.has(c);
    const p = (c) => this.pressed.has(c);
    const out = {
      move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, zoom: 0, zoomHold: 0,
      A: p('Space') || p('Enter'), B: p('Backspace'), C: p('KeyC'), Y: p('Tab'), start: p('Escape') || p('KeyP'),
      hud: p('F1'), demo: false, holdA: k('Space'),
      click: this.mouse.click, mouse: { x: this.mouse.x, y: this.mouse.y },
      any: this.pressed.size > 0 || this.mouse.click != null,
    };
    if (this.pressed.size > 0 || this.mouse.click != null) this.dev = 'kb';
    if (k('KeyW') || k('ArrowUp')) out.move.y += 1;
    if (k('KeyS') || k('ArrowDown')) out.move.y -= 1;
    if (k('KeyA') || k('ArrowLeft')) out.move.x -= 1;
    if (k('KeyD') || k('ArrowRight')) out.move.x += 1;
    if (k('KeyQ')) out.look.x -= 1;
    if (k('KeyE')) out.look.x += 1;
    if (k('KeyR')) out.look.y -= 1;
    if (k('KeyF')) out.look.y += 1;
    if (k('Equal') || k('NumpadAdd')) out.zoomHold -= 1;
    if (k('Minus') || k('NumpadSubtract')) out.zoomHold += 1;
    out.look.x += this.mouse.dx * 0.12; out.look.y += this.mouse.dy * 0.12;
    out.zoom += this.mouse.wheel * 3;
    this.mouse.dx = 0; this.mouse.dy = 0; this.mouse.wheel = 0; this.mouse.click = null;
    // 手柄（标准布局）
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of pads) {
      if (!g) continue;
      const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
      out.move.x += dz(g.axes[0] || 0); out.move.y -= dz(g.axes[1] || 0);
      out.look.x += dz(g.axes[2] || 0) * 2.2; out.look.y += dz(g.axes[3] || 0) * 2.2;
      const b = (i) => g.buttons[i] && g.buttons[i].pressed;
      const edge = (i) => { const now = b(i); const was = this.padPrev[g.index + ':' + i]; this.padPrev[g.index + ':' + i] = now; return now && !was; };
      if (edge(0)) out.A = true; if (b(0)) out.holdA = true;
      if (edge(1)) out.B = true; if (edge(3)) out.Y = true;
      if (edge(9)) out.start = true;
      if (b(4)) out.zoomHold += 1; if (b(5)) out.zoomHold -= 1;
      if (b(6)) out.move.y -= (g.buttons[6].value || 1) * 0; // 预留
      const padUsed = g.buttons.some((x) => x.pressed) || g.axes.some((a) => Math.abs(a) > 0.5);
      if (padUsed) this.dev = 'pad';
      out.any = out.any || padUsed;
    }
    out.move.x = Math.max(-1, Math.min(1, out.move.x)); out.move.y = Math.max(-1, Math.min(1, out.move.y));
    this.pressed.clear();
    return out;
  }
}
