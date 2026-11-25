// 第一次揭晓（F5）：冲洗计时牌下面多一行“按 空格 冲得更快”（手柄是 Ⓐ）。
//   从牌子底下滑出来、略弹一下；键帽是立体的，一下一下按下去（每 0.9 秒）；外框跟着轻轻呼吸。
//   按了：键帽按到底、整行亮橙 0.3 秒，再往上收进牌子里（牌子上换成“加快 ×2.4”）。
//   一直不按：挂到冲洗结束，跟着淡掉。以后的揭晓只有原来那枚小键帽。
// T 是 FirstFx.teach：{ on, t, pressT, outT }；lr 是计时牌这一帧画在哪里。
const ORANGE = '#ffb45a', TEAL = '#8fe8dc';

export function drawTeach(ov, lr, T, dev) {
  if (!T.on) return; // 网包刚落甲板、还没开始冲：牌子上先什么都不挂
  const x = ov.ctx, key = dev === 'pad' ? 'Ⓐ' : '空格';
  const inK = Math.min(1, T.t / 0.32), pop = 1 - Math.pow(1 - inK, 3) + Math.sin(inK * Math.PI) * 0.12;
  const pressed = T.pressT >= 0, pk = pressed ? Math.min(1, T.pressT / 0.3) : 0;
  const fold = pressed ? Math.max(0, (T.pressT - 0.3) / 0.6) : 0;           // 收进牌子里
  const fade = T.outT >= 0 ? Math.max(0, 1 - T.outT / 0.35) : 1;
  const a = Math.min(1, T.t / 0.2) * fade * (1 - fold);
  if (a <= 0.01) return;
  const px = 20;
  ov.font(px, 700);
  const w1 = x.measureText('按').width, wk = x.measureText(key).width + 18, w2 = x.measureText('冲得更快').width;
  const gap = 8, W = Math.ceil(w1 + gap + wk + gap + w2 + 30), Hh = 40;
  const cx = lr.x + lr.w / 2, top = lr.y + lr.h + 9 - 12 * (1 - pop) - 18 * fold;
  const X = Math.round(cx - W / 2), Y = Math.round(top), sy = 1 - fold * 0.7;
  x.save();
  x.globalAlpha = a;
  x.translate(cx, Y); x.scale(1, sy); x.translate(-cx, -Y);
  // 外框：深青底、一圈会呼吸的青光（按了变橙、亮一下）
  const breath = 0.55 + 0.45 * Math.sin(T.t * 4.2);
  const edge = pressed ? ORANGE : TEAL;
  x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, X + 1, Y + 3, W, Hh, 4); x.fill();
  const bg = x.createLinearGradient(0, Y, 0, Y + Hh);
  bg.addColorStop(0, pressed ? `rgba(${Math.round(70 + 90 * (1 - pk))},${Math.round(52 + 40 * (1 - pk))},28,0.95)` : 'rgba(22,52,58,0.95)');
  bg.addColorStop(1, pressed ? 'rgba(40,24,10,0.95)' : 'rgba(6,18,21,0.95)');
  x.fillStyle = bg; rr(x, X, Y, W, Hh, 4); x.fill();
  x.shadowColor = edge; x.shadowBlur = pressed ? 18 * (1 - pk) + 6 : 6 + 8 * breath;
  x.strokeStyle = edge; x.lineWidth = 2; rr(x, X + 1, Y + 1, W - 2, Hh - 2, 4); x.stroke();
  x.shadowBlur = 0;
  // 朝上的小尖：指着计时牌
  x.fillStyle = edge; x.beginPath(); x.moveTo(cx - 7, Y + 1); x.lineTo(cx, Y - 6); x.lineTo(cx + 7, Y + 1); x.closePath(); x.fill();
  // 字和键帽
  let tx = X + 15;
  const ty = Y + Hh / 2;
  x.textBaseline = 'middle';
  x.fillStyle = '#eef4f0'; x.fillText('按', tx, ty + 1); tx += w1 + gap;
  // 键帽：一下一下按下去（按了就按到底）
  const cyc = (T.t % 0.9) / 0.9, dn = pressed ? 1 : cyc < 0.16 ? Math.sin(cyc / 0.16 * Math.PI) : 0;
  const depth = 4 - 3 * dn, kh = 28, ky = ty - kh / 2 - 2 + (4 - depth);
  x.fillStyle = '#0a1214'; rr(x, tx, ky + depth, wk, kh, 4); x.fill();
  const kg = x.createLinearGradient(0, ky, 0, ky + kh);
  if (pressed || dn > 0.5) { kg.addColorStop(0, '#ffd9a0'); kg.addColorStop(1, '#e89a3c'); }
  else { kg.addColorStop(0, '#f6ead0'); kg.addColorStop(1, '#cdbf9e'); }
  x.fillStyle = kg; rr(x, tx, ky, wk, kh, 4); x.fill();
  x.strokeStyle = 'rgba(40,30,16,0.75)'; x.lineWidth = 1; rr(x, tx + 0.5, ky + 0.5, wk - 1, kh - 1, 4); x.stroke();
  x.fillStyle = '#2a2014'; ov.font(px - 3, 800); x.fillText(key, tx + 9, ky + kh / 2 + 1);
  ov.font(px, 700); tx += wk + gap;
  x.fillStyle = pressed ? '#ffe2bc' : '#eafff9'; x.fillText('冲得更快', tx, ty + 1);
  x.restore();
  x.textBaseline = 'top';
  ov.placed.push({ x: X, y: Y - 6, w: W, h: Hh + 6, text: `按 ${key} 冲得更快`, kind: 'teach', pressed });
}

function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
