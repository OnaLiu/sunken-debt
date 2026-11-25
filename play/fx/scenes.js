// 效果单的场面：第 9 轮（效果清单第 5 节）八批效果，每个编号怎么在真实的游戏里单独放一遍。
//   第一批「试方向」：B7、C6、W1（A7 跟着 W1 一起改）
//   第二批「量出来的毛病」：6 件，落到 14 个编号（其中 B12、B17 挪到第四批，C7 挪到第五批，B19、B20、B21 挪到第六批，W5 挪到第七批，B1 挪到第八批，C3、C12、D1 挪到第九批，接着做）
//   第三批「一网的前半」：B5、B6、B8、B9、B10、B11
//   第四批「揭晓」：B12–B17
//   第五批「珍品一串的其余」：C4、C5、C7、C9、B18
//   第六批「获得和留下」：B19、B20、B21、C8、C10、A6
//   第七批「逼近的威胁」：W2–W6（在 fx/scenes-b7.js 里，接在这个文件后面载入，替换掉第二批的 W5）
//   第八批「寻找」：B1、C1、C2、B2、B3、B4
// 同一份文件给三处用：effects.html 读名字和说明；fx-stage.html 在游戏里摆场面、放；tools/fx-clips.mjs 截“改前/改后”。
// 摆场面只用游戏本来就有的接口（__api.sim 快进、__game 的状态），改前的版本上也能跑。
// 每个场面：run(X) 先快进到效果前一点（不出声、不记标签），返回
//   { dur 放多久, at: [[第几秒, 做什么]], hold: [[键, 第几秒按下, 第几秒松开]], frame(dt, t) 放的时候每帧推一把（游戏时间，慢放跟着慢） }。
// 加一批：在 entries 里加几条（batch 写第几批），batches 里加一行。
(() => {
  const TAU = Math.PI * 2;
  const api = () => window.__api, G = () => window.__game;

  // —— 摆场面用的小工具 ——
  const S = {
    sim(secs, inp) { api().sim(secs, inp ? (i) => inp(i, G()) || {} : null); },
    // 一帧一帧快进，直到条件成立（最多 max 秒）
    until(cond, max = 40, inp) {
      const n = Math.round(max * 60);
      for (let i = 0; i < n; i++) {
        const g = G();
        if (g && cond(g)) return true;
        api().sim(1 / 60, inp ? () => inp(i, G()) || {} : null);
      }
      return !!cond(G());
    },
    // 新开一趟（同一片海），跳过开局的指向箭头和第一次的键（那些是别批的效果）
    fresh() {
      api().startManual();
      const g = G(), h = api().hud;
      g.introT = 0;
      if (h.keysSeen) { h.keysSeen.add('sail'); h.keysSeen.add('work'); }
      if (api().firsts) api().firsts.skipAll(); // 第一次（第十二批）只在它自己的场面里放
      return g;
    },
    place(x, z, heading = 0, speed = 0) {
      const g = G(), b = g.boat;
      b.x = x; b.z = z; b.heading = heading; b.speed = speed; b.turn = 0; b.grounded = 0;
      g.cam.init = false; g.cam.yaw = heading + Math.PI + 0.5;
      g.world.update(x, z, 60); g.world.service(x, z);
    },
    // 船停在落点西边 8 米，船头朝 +z（和量测时同一个摆法）
    placeFor(tx, tz) { S.place(tx - 8, tz + 0.9, 0); S.sim(0.5); },
    work() { if (G().mode !== 'work') S.sim(0.2, (i) => ({ Y: i === 1 })); },
    aim(x, z, settle = 1.5) { G().setAimWorld(x, z); S.sim(settle); return G().est; },
    drop() { S.sim(0.3, (i) => ({ A: i === 1 })); return !!G().op; },
    // 摆好一网：开到落点旁、转作业、对准、下网
    net(tx, tz, ax = tx, az = tz) { S.placeFor(tx, tz); S.work(); S.aim(ax, az); return S.drop(); },
    // 网包吊回来、离落甲板还有 lead 秒左右
    toLanding(lead = 1.3) { return S.until((g) => g.op && g.op.state === 'swing' && g.boat.craneEta() < lead, 70); },
    // 揭晓走到某一段、这一段还剩 left 秒
    toPhase(ph, left) {
      return S.until((g) => {
        const A = g.reveal.active; if (!A) return false;
        if (A.phase !== ph) return false;
        if (ph === 'wash') return (A.washDur - A.washT) / (A.fast ? 2.4 : 1) <= left;
        if (ph === 'show') return A.showDur - A.t <= left;
        return true;
      }, 80);
    },
    // 空沙地：浅滩旁边，网兜周围 3.2 米里没有东西
    bareSand() {
      const g = G();
      for (let dx = -6; dx <= 6; dx += 0.5) for (let dz = -6; dz <= 6; dz += 0.5) {
        const x = 183 + dx, z = 2 + dz;
        if (g.world.itemsNear(x, z, 3.2).length) continue;
        const t = g.world.surfaceTop(x, z); if (t < -2.5 && t > -6) return [x, z];
      }
      return [183, 2];
    },
    // 一处现场：从水深够、又不经过别的现场的方向开过去，起点在“看清”的圈外 gap 米
    approach(siteId, gap = 9) {
      const g = G();
      let s = null; const others = [];
      for (const r of g.world.regions.values()) for (const q of r.sites) (q.id === siteId ? (s = q) : others.push(q));
      if (!s) return null;
      let best = null;
      for (let k = 0; k < 48; k++) {
        const a = (k / 48) * TAU, ux = Math.sin(a), uz = Math.cos(a);
        let score = 0;
        for (let d = s.near - 6; d <= s.near + gap + 24; d += 1.5) {
          const x = s.x + ux * d, z = s.z + uz * d;
          if (g.world.surfaceTop(x, z) < -2.6) score++;
          for (const o of others) if (Math.hypot(o.x - x, o.z - z) < o.near + 8) score -= 6;
        }
        if (!best || score > best.score) best = { score, ux, uz };
      }
      const d0 = s.near + gap;
      return { s, x: s.x + best.ux * d0, z: s.z + best.uz * d0, heading: Math.atan2(-best.ux, -best.uz) };
    },
    // 搬东西的船员走到离舱口一步远
    toStow(lead = 1.1, max = 40) {
      return S.until((g) => g.crew.sailors.some((s) => s.task && s.task.type === 'carry' && s.task.phase === 'tohatch' && s.task.sx != null && Math.hypot(s.x - s.task.sx, s.z - s.task.sz) < lead), max);
    },
    // 快进时按着油门
    W: () => ({ move: { x: 0, y: 1 } }),
  };

  // 落点（同一片海、固定种子）：浅滩、沉船、下坡
  const P = {
    tube: [184.6, 6.2], anchor: [179.5, 12.4], jug: [298.2, 26.8], bag: [295.3, 27.1],
    rel: [316.08, 80.04], hazard: [316.8, 79.5], tube2: [303.5, 61],
  };
  const netTo = (k) => { S.fresh(); const p = P[k]; return S.net(p[0], p[1]); };

  // 这一趟先收工（中途收工）：收获单弹出来
  // 收获单走完、“再来一次”亮起来才能按（第九批 C11；改前的版本没有这一拍，弹出来就算）
  const quitTrip = () => { G().endReq = true; S.until((g) => !!g.ended, 6); S.until((g) => !!g.ended && g.ended.ready !== false, 12); };


  // —— 第一批（试方向）用的几处：浅滩草地（3 米深）、一片深水（15.6 米深）、沉船货舱、一片空地，都是开局这片海里真实的点 ——
  // [船 x, 船 z, 船头朝向, 落点 x, 落点 z]
  const Q = {
    shallow: [190, 12.5, 0.15, 196.5, 17.2],
    deep: [183.5, 127.3, 0.2, 190, 132],
    wreck: [286, 24.5, 0.2, 294.6, 27.05], // 沉船货舱：第一网捞上来的是银币匣（珍品）
    open: [296, 50, 0.3, 303.5, 58.5],     // 一片空地：看油表
  };
  const CAP = 60, NEAR = 0.15; // 油箱、变黄的线（和游戏里同一个数）
  // 停船、切到作业、对准落点，等吊臂转到位
  // prep(g)：新开一趟以后、开过去以前先做的事（例如把作业镜头拉近）
  const workAt = (x, z, h, ax, az, prep) => { const g = S.fresh(); if (prep) prep(g); S.place(x, z, h); S.sim(0.5); G().setMode('work'); G().setAimWorld(ax, az); S.sim(3.2); return G(); };
  // 下网，快进到网兜离底还有 h 米
  const dropTo = (spot, h, prep) => { workAt(...spot, prep); S.drop(); S.until((g) => g.op && g.op.state === 'lowering' && g.op.y - g.op.T < h, 30); };
  // 对准一网，把油调到“下完这一网还剩 reserve”。
  // 不低于别处最省油的那一网：再低游戏就判“油不够再下一网了”直接收工（红色是“够别处、不够眼前这一网”）
  const aimWithReserve = (reserve) => {
    const g = workAt(...Q.open);
    const need = g.est ? g.est.fuel : 2.7, floor = g.netsLeft().minFuel + 0.1;
    g.boat.fuel = Math.max(floor, need + reserve); S.sim(0.3);
    return { need, floor };
  };

  const batch1 = [
    {
      id: 'B7', name: '网触底', tier: '中 · 标志时刻 S2',
      when: '下网后 3.1–4.2 秒，每一网都有',
      feel: '摸到底了，手感实在（轻而准：声音和画面同一帧，从作业的大景也看得出）',
      watch: [
        '**预兆**：网兜离底 1 米，海底压上来一块网的影子，网口下的草开始往外倒',
        '**爆发**（同一帧）：一声闷响（越深越低）；网圈下一圈泥沙贴着海底翻出去，一道沙浪往外推，八个配重下各喷一股沙',
        '**余波**：鱼群一下炸开；泥团慢慢长大、顺海流飘走、变淡',
        '**余韵**：草一直趴着，网提起来以后在回收和冲洗期间慢慢立回来；网印留在泥上',
      ],
      variants: [
        { k: 'shallow', label: '浅处 3 米 · 草地', run: () => { dropTo(Q.shallow, 3.0); return { dur: 7 }; } },
        { k: 'deep', label: '深处 15.6 米 · 闷响更低', run: () => { dropTo(Q.deep, 3.0); return { dur: 7 }; } },
        { k: 'close', label: '拉近看草和鱼', run: () => { dropTo(Q.shallow, 3.0, (g) => { g.cam.distWork = 13; }); return { dur: 7 }; } },
      ],
    },
    {
      id: 'C6', name: '珍品确认', tier: '最重 · 标志时刻 S1 的中段',
      when: '珍品冲完的那一下（之前是冲洗，之后是船员在近景里欢呼——欢呼是 C7）',
      feel: '终于知道是什么了：先憋住，一下爆发，世界褪色只留它，名字砸上来',
      watch: [
        '**憋住**（最后 1.5 秒）：泥壳停住不再掉，冲洗声照旧',
        '**抽声**（最后 0.4 秒）：海、机器、绞车都抽走，只剩一滴水',
        '**爆发** 0 秒：先是它自己的声音（银币匣是一串钱币）；世界褪成灰只留它；镜头往下一顿（全程只在这里震一下）；不闪白',
        '**爆发** 0.15 秒：和弦起，名字砸上来',
        '**余波** 0.3–1.5 秒：一道金边从它往外推，推过的地方颜色回来，环境声一点点回来',
      ],
      variants: [
        { k: 'silver', label: '银币匣 · 沉船货舱', run: () => { workAt(...Q.wreck); S.drop(); S.until((g) => g.reveal.active && g.reveal.active.phase === 'wash' && g.reveal.active.washDur - g.reveal.active.washT < 2.8, 40); return { dur: 7.5 }; } },
      ],
    },
    {
      id: 'W1', name: '燃油逼近', tier: '中→重 · 渐进',
      when: '每趟后段，油越来越少',
      feel: '心里一紧，越来越急；一直能感觉到，但不吵',
      watch: [
        '**远**（下完这一网还剩 15% 以上）：油表平常色，不出声',
        '**近**（下完这一网剩不到 15%）：表发黄，边框慢慢一呼一吸；耳边很轻的心跳，约 1 秒一下，越少越快一点、越响一点',
        '**再近**（不够下这一网）：表发红，心跳每秒 2 下，每一下表跟着一跳；表上写“油不够这一网”',
        '**按下网被拒**：表一抖，“油不够这一网”闪一下，心跳停一拍；同时一声空油桶（F7）',
      ],
      variants: [
        {
          k: 'fall', label: '远 → 近 → 再近（油往下走）', note: '这里油每秒减 1.8（真实游戏里是开船烧掉的）',
          run: () => { const f = aimWithReserve(CAP * NEAR + 3.6); return { dur: 10, frame: (dt) => { const b = G().boat; b.fuel = Math.max(f.floor, f.need - 0.6, b.fuel - 1.8 * dt); } }; },
        },
        { k: 'near', label: '停在近（黄）', run: () => { aimWithReserve(CAP * NEAR * 0.45); return { dur: 6 }; } },
        { k: 'deny', label: '再近时按下网（停一拍）', run: () => { aimWithReserve(-0.4); return { dur: 6, at: [[1.6, () => G().pressDrop()], [4.1, () => G().pressDrop()]] }; } },
      ],
    },
    {
      id: 'A7', name: '油表（心里有本账）', tier: '轻 · 跟着 W1 一起改',
      when: '一直在右上角；对准落点时画出这一网要用的那段',
      feel: '一直看得见油量，和这一网要花多少',
      watch: [
        '对准落点：油条末端那截斜纹就是这一网要用的油；斜纹左边那道刻线是 15%（过了它变黄）',
        '按下网：那截斜纹在原地烧掉（0.7 秒），数字跟着滚下去',
        '颜色和呼吸跟着 W1 的三级走；不够这一网时斜纹越过油条、变红',
      ],
      variants: [
        { k: 'burn', label: '按下网：斜纹烧掉', run: () => { aimWithReserve(20); return { dur: 4, at: [[1.2, () => G().pressDrop()]] }; } },
        { k: 'short', label: '不够这一网时的样子', expect: 'W1', run: () => { aimWithReserve(-0.45); return { dur: 4 }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 1 }));

  const batch2 = [
    {
      id: 'B22', name: '界面一声拆开', fix: 3,
      when: '收起结果卡、切回航行、标题上下选',
      before: '收卡、切回航行、收工都是同一声 `ui2`（两下方波）。',
      after: '收卡是铜牌往右一滑“唰——叮”；切回航行是车钟手柄“咔”一下、机器起一口气；标题上下选是轻轻一“嗒”。收工换成收获单自己的三种声音（见 C12）。',
      variants: [
        { k: 'dismiss', label: '按 C 收起结果卡', run: () => { netTo('tube'); S.toPhase('show', 0.1); S.sim(2.5); return { dur: 2.6, at: [[0.7, () => api().key('KeyC')]] }; } },
        { k: 'sail', label: '按 Tab 切回航行', run: () => { S.fresh(); S.placeFor(...P.tube); S.work(); S.sim(1); return { dur: 2.4, at: [[0.7, () => api().key('Tab')]] }; } },
        { k: 'title', label: '标题上下选', title: true, run: () => ({ dur: 3, hold: [['ArrowDown', 0.5, 0.65], ['ArrowDown', 1.2, 1.35], ['ArrowUp', 2.0, 2.15]] }) },
      ],
    },
    {
      id: 'B23', name: '看宝的黑边', fix: 2,
      when: '落甲板到拉回，近景里上下两道黑边',
      before: '普通的一网和珍品一样，上下各 92 像素的粗黑边，一趟约 36 秒（23%）在粗黑边里。',
      after: '普通的一网只有上下各 30 像素的细边，和镜头一起提前推进来；珍品一网在落包时再加宽到 92 像素（先细后宽，像预告）。时长不变。',
      variants: [
        { k: 'normal', label: '普通的一网', run: () => { netTo('tube'); S.toLanding(1.4); return { dur: 11 }; } },
        { k: 'precious', label: '珍品的一网', run: () => { netTo('rel'); S.toLanding(1.4); return { dur: 13 }; } },
      ],
    },
    {
      id: 'C3', name: '空网', fix: 3,
      when: '网吊回来，里面只有泥水',
      before: '一声低闷的噪声（1 个发声体），和碰到硬物收回的网同一声。',
      after: '网包落回甲板：一摊泥水“噗”地摊开，再滴答两下，听得出里面是空的、不罚人。和碰硬物收回的网分开（见 W5）。',
      variants: [
        { k: 'empty', label: '浅滩旁的空沙地', run: () => { S.fresh(); const b = S.bareSand(); S.net(b[0], b[1]); S.toLanding(1.3); return { dur: 4.5 }; } },
      ],
    },
    {
      id: 'C12', name: '三种收工', fix: 3,
      when: '捞完、没油、中途收工，收获单弹出来',
      before: '三种收工只差一行副标题，声音和画面一样（都是 `ui2`）。',
      after: '捞完：一声船笛，接着四个音一路往上走；没油：引擎咳两声、低低地熄火（发动机声真的停了），三个音往下落；中途收工：一个低低的五度长音，很平静。',
      variants: [
        { k: 'done', label: '都捞过了', run: () => { S.fresh(); S.placeFor(...P.tube); for (const r of G().world.regions.values()) for (const it of r.items.values()) if (it.state === 'seabed') it.state = 'gone'; S.sim(1.2); return { dur: 4.5 }; } },
        { k: 'fuel', label: '油不够了（开着船）', run: () => { S.fresh(); S.place(40, -12, 1.69, 4); G().boat.fuel = 1.2; S.sim(1.0, S.W); return { dur: 5, hold: [['KeyW', 0, 5]] }; } },
        { k: 'quit', label: '中途收工', run: () => { S.fresh(); S.placeFor(...P.tube); return { dur: 4, at: [[0.6, () => api().key('Escape')], [1.5, () => G().hud.onPauseAction('end')]] }; } },
      ],
    },
    {
      id: 'D1', name: '再来一次', fix: 1,
      when: '收获单上按“再来一次”',
      before: '有黑场；但再来一次以后结果卡的飞币和小火花全坏了（bug-1）。',
      after: '黑场后新的一趟把结果卡的记账全清掉，第二趟的卡照样飞币、冒火花（放 B20 的“再来一次以后”看）。',
      variants: [
        { k: 'restart', label: '按 A 再来一次', run: () => { netTo('tube'); S.toPhase('show', 0.1); S.sim(3); quitTrip(); S.sim(1.2); return { dur: 3.5, at: [[0.6, () => api().key('Space')]] }; } },
      ],
    },
    {
      id: 'F7', name: '被拒（按原因四种声音）', fix: 3,
      when: '按了这时用不上的键、网还在水下又按下网、落点不行、油不够、前方浅滩',
      before: '全是 `deny` 一声（140 Hz 方波 0.18 秒）。',
      after: '按错键：一下闷闷的“嗒”（最轻）；网还在水下：绞车棘轮“咔哒、咔哒”；落点不行：吊臂顶到头“哐”、液压憋一下；油不够：空油桶敲两下、一声比一声空；前方浅滩：测深仪“嘀——嘀”往下掉。第一次再加一句短字留给第十三批。',
      variants: [
        { k: 'key', label: '按错键（没有卡时按 C）', run: () => { S.fresh(); S.placeFor(...P.tube); return { dur: 2.2, at: [[0.6, () => api().key('KeyC')]] }; } },
        { k: 'busy', label: '网还在水下又按下网', run: () => { netTo('tube'); S.sim(0.4); return { dur: 2.4, at: [[0.6, () => api().key('Space')]] }; } },
        {
          k: 'reach', label: '落点不行（压在自己船上）',
          run: () => { S.fresh(); S.placeFor(...P.tube); S.work(); const b = G().boat; S.aim(b.x + 0.3, b.z + 1.5); return { dur: 2.2, at: [[0.6, () => api().key('Space')]] }; },
        },
        {
          k: 'fuel', label: '油不够这一网',
          run: () => { S.fresh(); S.placeFor(...P.tube2); S.work(); const e = S.aim(...P.tube2); G().boat.fuel = Math.max(0.5, (e ? e.fuel : 3) - 0.3); S.sim(0.3); return { dur: 2.2, at: [[0.6, () => api().key('Space')]] }; },
        },
        {
          k: 'shoal', label: '前方浅滩（开船逼近）',
          run: () => {
            S.fresh(); S.place(20, -16, Math.PI);
            // 先快进一遍找出“看到浅水”的那一刻，再退回 1.3 秒前的位置和速度，实时开过去
            const hist = [];
            S.until((g) => { hist.push([g.boat.x, g.boat.z, g.boat.heading, g.boat.speed]); return !!g.shoal; }, 20, S.W);
            const h = hist[Math.max(0, hist.length - 1 - 78)];
            S.place(h[0], h[1], h[2], h[3]); const g = G(); g.shoal = null; g.shoalWarned = false;
            S.sim(1 / 60, S.W);
            return { dur: 3.6, hold: [['KeyW', 0, 2.6]] };
          },
        },
      ],
    },
    {
      id: 'W5', name: '网碰到埋着的硬物', fix: 3,
      when: '网口收紧时咬到埋在沙里的硬物，网自己往回收',
      before: '只有一句字“碰到埋着的硬物：网自动收回”，撞的那一下没有声音；网回到船上用的是空网那一声。',
      after: '咬到的那一刻：隔着水一声闷闷的金属“咣”，跟着缆绳绷紧的一声低吟；网架回到甲板时是铁架子“哐啷”几下，不撒泥（和空网分开）。缆绳一抖的画面留给第七批。',
      variants: [
        { k: 'snag', label: '水下咬到硬物', run: () => { netTo('hazard'); S.until((g) => g.op && g.op.state === 'closing', 30); return { dur: 4 }; } },
        { k: 'back', label: '网收回甲板', run: () => { netTo('hazard'); S.toLanding(1.3); return { dur: 4.5 }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 2 }));

  // —— 第三批（一网的前半）：入水、下沉、网印、收紧、分量、出水 ——
  // 网下去以后快进到某一刻
  const opUntil = (cond, max = 40) => S.until((g) => g.op && cond(g.op, g), max);
  // 离网圈破水还有 lead 秒（按现在往上的速度推）
  const toBreach = (lead = 1.0) => opUntil((op) => op.state === 'lifting' && -op.y / Math.max(op.v, 0.8) < lead, 50);
  const deepDrop = (prep) => { workAt(...Q.deep, prep); S.drop(); };
  const MID = [243.5, 15.3, 0.2, 250, 20]; // 一片 6.9 米深的空泥地（浅滩和沉船之间）
  const midDrop = (prep) => { workAt(...MID, prep); S.drop(); };
  const shallowDrop = (prep) => { workAt(...Q.shallow, prep); S.drop(); };
  const emptyNet = () => { S.fresh(); const [x, z] = S.bareSand(); S.net(x, z); };
  const batch3 = [
    {
      id: 'B5', name: '网入水', tier: '轻',
      when: '下网后约 1.5 秒，网圈砸进水的那一帧；每一网都有',
      feel: '网扎进了水里（从 24 米外的作业大景也看得清）',
      before: '一声 `splash`（两团噪声）加约 117 个水花粒子；镜头在 24 米外，水花只有几个像素，水面上什么也不留。',
      watch: [
        '**网兜先碰水**：网兜是网眼，碰水几乎没动静；网圈和八个配重砸下去的那一帧才是这一下',
        '**同一帧**：一圈水冠沿着网圈往上往外翻，中间一股水柱，外面一层细雾；水面一片白水',
        '**声音**：网圈拍水“啪”往下沉成闷的一团，水合上去“咕咚”，兜里的空气冒上来一阵嘶嘶，溅起的水点落回来“嗒、嗒”',
        '**余波**：白水散成一圈花边泡沫，慢慢往外扩、碎开；三道涟漪往外走，水下的海底跟着晃',
        '**余韵**：泡沫圈在水面上留六七秒，网出水的时候往往还在',
      ],
      variants: [
        { k: 'shallow', label: '浅滩 3 米', run: () => { shallowDrop(); opUntil((op) => op.y < 1.9); return { dur: 6 }; } },
        { k: 'deep', label: '深处 15.6 米', run: () => { deepDrop(); opUntil((op) => op.y < 1.9); return { dur: 6 }; } },
        { k: 'close', label: '拉近看水冠', run: () => { shallowDrop((g) => { g.cam.distWork = 13; }); opUntil((op) => op.y < 1.9); return { dur: 6 }; } },
      ],
    },
    {
      id: 'B6', name: '网下沉', tier: '轻',
      when: '入水到触底：深处约 3 秒，浅处不到 1 秒',
      feel: '等的时候有盼头：一秒一秒数着往下走',
      before: '三趟一共冒了 2300 个气泡，但散在网四周、看不出是网拖出来的；网上挂着的“5.5 秒”是整网回到甲板的时间，往下沉的这几秒没有节拍。',
      watch: [
        '**一路**：网架顶和网圈一路拖出一串泡，网往下走、泡往上走，拉成一条；刚入水那一阵兜里的空气多，泡更密',
        '**放绳**：钢缆从臂端滑轮往下走的“嗞——”，跟着网下沉的快慢变（入水后加速，离底减速）',
        '**秒结**：网每过测深绳上一个秒结（离触底还剩 3、2、1 秒），网兜吐一团大泡，测深仪“嘀”一声、海底回一声；越近音越高、回声越快',
        '**最后不到一秒**：一股低低的水压声往上顶，触底的闷响（B7）把它收掉',
        '**水面**：泡冒到水面一粒粒破开，网上方的水面一直在闪白点',
      ],
      variants: [
        { k: 'deep', label: '深处 15.6 米（两下“嘀”）', run: () => { deepDrop(); opUntil((op) => op.y < 1.2); return { dur: 5.2 }; } },
        { k: 'close', label: '深处 · 拉近看气泡串', run: () => { deepDrop((g) => { g.cam.distWork = 15; }); opUntil((op) => op.y < 1.2); return { dur: 5.2 }; } },
        { k: 'mid', label: '6.9 米（一下“嘀”）', run: () => { midDrop(); opUntil((op) => op.y < 1.2); return { dur: 4 }; } },
        { k: 'shallow', label: '浅滩 3 米（不到一秒，只有水压那一下）', run: () => { shallowDrop(); opUntil((op) => op.y < 1.2); return { dur: 3.4 }; } },
      ],
    },
    {
      id: 'B8', name: '网印', tier: '轻',
      when: '起网以后，泥团沉下去的两三秒里显出来；整趟不消失',
      feel: '这里我捞过',
      before: '一半：只在取走物件的位置留一块深色斑（一张贴图），网圈本身不留印。',
      watch: [
        '**显出来**：网提起来，翻起的泥慢慢沉下去，泥面上的印子一点点出来（刚翻开的泥湿、颜色深）',
        '**一圈槽**：网圈压出一道槽，外沿挤起一道泥埂；八个配重各砸一个方坑',
        '**八道沟**：八根爪收拢时往里刮出八道沟，沟头堆一小撮泥；网兜蹭过的地方坑坑洼洼',
        '**取走的坑**：取走的东西各留一个坑，坑沿翻起一圈',
        '**余韵**：半分钟里湿泥慢慢变成和周围差不多的颜色，但印子一直在',
        '**回头再对准这里**：网口一罩住旧印子，印子亮一下、泥埂上一道浅色的边，然后留一点亮——这里捞过了',
      ],
      variants: [
        { k: 'reveal', label: '提网那一下（6.9 米的泥地：网提走、泥沉下去）', run: () => { midDrop(); opUntil((op) => op.state === 'closing' && op.t > 0.7, 30); return { dur: 4.6 }; } },
        {
          k: 'later', label: '回头再对准这里（铜信筒那一网收完以后）',
          run: () => {
            netTo('tube'); S.until((g) => !g.op && !g.reveal.busy && !g.reveal.active, 90); S.sim(1.2);
            const g = G(); g.setMode('work'); g.setAimWorld(P.tube[0], P.tube[1] - 4.5); S.sim(3);
            return { dur: 5, at: [[1.2, () => G().setAimWorld(P.tube[0] + 0.8, P.tube[1] + 0.5)]] };
          },
        },
        {
          k: 'empty', label: '回头再对准这里（空沙地上的空网）',
          run: () => {
            emptyNet(); const op = G().op, x = op.x, z = op.z;
            S.until((g) => !g.op && !g.reveal.busy && !g.reveal.active, 90); S.sim(1.2);
            const g = G(); g.setMode('work'); g.setAimWorld(x, z - 4.5); S.sim(3);
            return { dur: 5, at: [[1.2, () => G().setAimWorld(x + 0.8, z + 0.5)]] };
          },
        },
      ],
    },
    {
      id: 'B9', name: '收紧', tier: '轻',
      when: '触底后约 1 秒，绞车开始往上拽的那一下',
      feel: '收紧了，往上拽',
      before: '`winch` 一个循环声（锯齿波从 90 升到 140 Hz）加吊机电机声；缆绳是一根直棍，触底、收紧都不动，看不出哪一下吃上了劲。',
      watch: [
        '**松**：网架搁到底，缆绳的分量交给海底，一节节松下来，往水流那边弯出一个肚子；吊臂轻了，往上弹一点',
        '**一下绷直**（同一帧）：钢缆“铮”一声绷直（越沉越低），卡爪咬住“咔”；整根缆抖两下，水面以上那段甩下一串水珠',
        '**半拍后**：网兜离开泥，隔着水一声“啵”，网底下翻起一团泥被拽着往上带',
        '**绞车**：电机声跟着提网的快慢升起来，卡爪“咔咔咔”越转越密',
      ],
      variants: [
        { k: 'shallow', label: '浅滩 3 米（铜信筒）', run: () => { netTo('tube'); opUntil((op) => op.state === 'closing'); S.sim(0.15); return { dur: 3.6 }; } },
        { k: 'deep', label: '深处 15.6 米（缆绳长，肚子大）', run: () => { deepDrop(); opUntil((op) => op.state === 'closing'); S.sim(0.15); return { dur: 3.6 }; } },
        { k: 'close', label: '拉近看缆绳', run: () => { shallowDrop((g) => { g.cam.distWork = 13; }); opUntil((op) => op.state === 'closing'); S.sim(0.15); return { dur: 3.6 }; } },
      ],
    },
    {
      id: 'B10', name: '这一网的分量', tier: '中',
      when: '起吊到出水（网口收好，往上拽的这两三秒）',
      feel: '这一网有多重、是不是不一样（预兆：还没看见是什么，先知道分量）',
      before: '只有泥包大小随内容变。绞车声和吊臂不分轻重，珍品那一网的起吊和出水与普通的完全一样。',
      watch: [
        '**吊臂**：一吃上劲，吊臂往下一沉、弹两下才稳，船身也往吊臂那边歪一点；越沉沉得越多（空网约 0.1 米，铁锚约 0.6 米）',
        '**绞车**：越沉电机越低、底下那层吃力的嗡越响、抖得越厉害，卡爪咔得越慢；吃劲那一段越长，提起来越慢',
        '**网兜**：越沉网兜坠得越长、泥包垂得越低',
        '**出水**：一兜水的分量一下吊上来，吊臂再一沉、电机往下一压；轻网被水放开往旁边一甩，摆得大，重网几乎不摆',
      ],
      variants: [
        { k: 'empty', label: '空网（空沙地）', run: () => { emptyNet(); opUntil((op) => op.state === 'closing' && op.t > 0.6); return { dur: 4.4 }; } },
        { k: 'light', label: '轻：铜信筒', run: () => { netTo('tube'); opUntil((op) => op.state === 'closing' && op.t > 0.6); return { dur: 4.4 }; } },
        { k: 'heavy', label: '很重：锻铁锚', run: () => { netTo('anchor'); opUntil((op) => op.state === 'closing' && op.t > 0.6); return { dur: 4.8 }; } },
      ],
    },
    {
      id: 'B11', name: '网出水', tier: '中',
      when: '起吊后 1.5–3 秒，网圈破开水面',
      feel: '被拽出水面了',
      before: '一声 `surface`（两团噪声）、约 40 个水花粒子、一路滴水；水面本身没有变化，24 米外只看得见几个白点。',
      watch: [
        '**预兆**（离破水不到半秒）：水面被网圈顶起一个包，包顶发白',
        '**破水**（同一帧）：网圈顶开水面，一圈水冠跟着网往上翻，一片白水；“哗”地翻上来，底下一声沉的“噗”（越沉越闷越长）',
        '**泄水**：网兜里的水哗地从网眼往下浇，带着泥色，砸在水面一片碎白；越沉浇得越久',
        '**余波**：白水散成一圈泡沫；网转回甲板的路上一路滴水',
      ],
      variants: [
        { k: 'light', label: '轻：铜信筒', run: () => { netTo('tube'); toBreach(1.0); return { dur: 3.0 }; } },
        { k: 'heavy', label: '很重：锻铁锚', run: () => { netTo('anchor'); toBreach(1.0); return { dur: 3.4 }; } },
        { k: 'deep', label: '从 15.6 米快速拽上来', run: () => { deepDrop(); toBreach(1.0); return { dur: 3.4 }; } },
        { k: 'close', label: '拉近看泄水（锻铁锚）', run: () => { netTo('anchor'); G().cam.distWork = 13; toBreach(1.0); return { dur: 3.4 }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 3 }));

  // —— 第四批（揭晓）：一网捞上来以后，从落甲板到看清是什么 ——
  // 冲洗开始（还剩 left 秒以上都算）
  const toWash = () => S.toPhase('wash', 99);
  const batch4 = [
    {
      id: 'B12', name: '网包落甲板', tier: '中 · 掉落揭示',
      when: '下网后 9–11 秒，网包吊回船上、落到甲板',
      feel: '沉甸甸砸在甲板上',
      before: '镜头先到、落地半拍船身一沉、船员按远近一个个缩（第二批修过）。但泥包是跟着网“放”下去的（0.45 秒缓落，不是掉），网口不松；泥块是粒子，一闪就没了；网架一直吊在近景里，冲洗、看清的 5 秒里大约 300 帧挡在画面中间。',
      after: '网口一松（扣环“咔”地弹开、链子一响），泥包从 0.35–0.85 米高自由落下，落的时候拉长一点，砸下去压扁再弹回；十几块泥块飞出去、弹一下、留在甲板上，冲洗时一块块被冲开流走。网架随即吊高让开，近景里不再挡。越重落得越重、泥块越多。',
      watch: ['网口松开那一下：泥包先在网里晃一下，再掉', '砸下去：压扁、泥块四溅、弹一下停在甲板上', '半拍后船身一沉、船员一个接一个缩', '网架往上收走，镜头推近时画面里只剩泥包'],
      variants: [
        { k: 'light', label: '轻：铜信筒', run: () => { netTo('tube'); S.toLanding(1.3); return { dur: 5 }; } },
        { k: 'heavy', label: '重：锻铁锚', run: () => { netTo('anchor'); S.toLanding(1.3); return { dur: 5 }; } },
        { k: 'precious', label: '珍品：镀金珐琅匣', run: () => { netTo('rel'); S.toLanding(1.3); return { dur: 5 }; } },
      ],
    },
    {
      id: 'B13', name: '慢揭晓（冲洗）', tier: '中 · 慢揭晓',
      when: '落甲板后约 0.25 秒开水；普通 4.2 秒，珍品 5.4 秒（时长按设计不动）',
      feel: '一点点看清是什么',
      before: '泥壳按外壳、内核、泥垢的顺序整体淡掉（一层层变薄），水枪是一串白点（约 2100 个粒子每网）；前段、中段、后段分不出来，“认得出那一角”没有特写。',
      after: '三段分明。前段（0–42%）：外壳一块块崩掉（B14），溅起的是浑泥水。中段（42–74%）：第一下冲到实物，泥上冲开一扇窗看见材质（B15），镜头跟着往里推近一点。后段（74–100%）：溅起的水越来越清，泥垢退净，露出关键特征。水柱是一条连续流动的水（不是一串点），打在哪里哪里溅，甲板上流开的水先黄后清。',
      watch: ['前段：泥壳一块块崩掉，水是泥色', '中段：冲开一扇窗，看见是金属还是陶，镜头推近', '后段：水变清，泥退净，看清整件东西', '计时牌上的秒数和画面三段对得上'],
      variants: [
        { k: 'tube', label: '铜信筒（普通 4.2 秒）', run: () => { netTo('tube'); S.toLanding(0.5); return { dur: 6.2 }; } },
        { k: 'jug', label: '盐釉陶壶（普通 4.2 秒）', run: () => { netTo('jug'); S.toLanding(0.5); return { dur: 6.2 }; } },
        { k: 'precious', label: '珍品：镀金珐琅匣（5.4 秒）', run: () => { netTo('rel'); S.toLanding(0.5); return { dur: 7.4 }; } },
      ],
    },
    {
      id: 'B14', name: '泥壳整块剥落', tier: '轻 · 撕碎',
      when: '冲洗前段，水枪一开就开始崩',
      feel: '泥是整块崩掉的，痛快',
      before: '没有成块剥落：泥壳是一层层淡掉的，同时有泥水飞溅（约 530 个粒子每网）。',
      after: '泥壳裂成 7–11 块有厚度、有断面的泥片，从顶上到两边、从背面到正面一块接一块崩开：先“咔”地裂一条缝、顶出来一点，再翻着滑下去，落到格栅上“噗”一声溅开泥水，摊平、化成泥水流走。按了加快崩得更快、飞得更远。',
      watch: ['每块先顶出来一点（裂缝），再掉', '掉下去翻个身、落地“噗”一声，泥水溅开', '落地后摊平、化掉，不堆在那里挡东西'],
      variants: [
        { k: 'anchor', label: '大泥包：锻铁锚', run: () => { netTo('anchor'); toWash(); return { dur: 3.2 }; } },
        { k: 'tube', label: '小泥包：铜信筒', run: () => { netTo('tube'); toWash(); return { dur: 3.2 }; } },
        { k: 'fast', label: '一开水就按加快', run: () => { netTo('anchor'); toWash(); return { dur: 3, at: [[0.25, () => api().key('Space')]] }; } },
      ],
    },
    {
      id: 'B15', name: '冲到实物·材质', tier: '轻 · 命中与击杀',
      when: '冲洗后半（56% 以后），水枪冲到网里的每一件东西',
      feel: '碰到实物了：是铁？瓷？木头？',
      before: '`strike` 一趟 8 次、分 7 种材质的声音；画面上看不出“冲到了”。两件同时冲到时两声在 0.2 秒内叠成一下。',
      after: '冲到的那一刻，泥上“噗”地冲开一扇窗，露出的那块按材质亮一下（金属暖亮、瓷白、木头和布暗），崩出按材质的东西（金属溅亮水星、瓷一点釉光、木头崩木屑、石头一撮砂、布只是湿水）；水声的音色跟着变（打在铁上尖、打在瓷上亮、打在木头和布上闷）。窗口随冲洗越冲越大。几件东西冲到时至少隔 0.32 秒，一声一声分开。',
      watch: ['冲开一扇窗：先“噗”地开一小块，再越冲越大', '窗里那一块按材质亮一下、崩出东西', '水声变了音色：金属尖、瓷亮、木头和布闷'],
      variants: [
        { k: 'metal', label: '金属：铜信筒', run: () => { netTo('tube'); S.toPhase('wash', 2.5); return { dur: 3.2 }; } },
        { k: 'ceramic', label: '陶：盐釉陶壶', run: () => { netTo('jug'); S.toPhase('wash', 2.5); return { dur: 3.2 }; } },
        { k: 'cloth', label: '布和木：封蜡货袋', run: () => { netTo('bag'); S.toPhase('wash', 2.5); return { dur: 3.2 }; } },
      ],
    },
    {
      id: 'B16', name: '冲洗时按 A 加快', tier: '轻 · 技能出手',
      when: '冲洗时按 A（键盘空格）',
      feel: '我能催一把',
      before: '只有“空格 加快”小牌；按下以后没有声音、没有画面回应，冲洗只是悄悄变快。',
      after: '按下那一下：泵“轰”地一顶，两条水柱同时变粗、变直、一阵一阵地顶，水声变急变亮、底下多一层轰鸣，打在泥上的水花一下炸开；计时牌弹一下，数字快速滚到新的剩余时间，旁边亮出“加快 ×2.4”和一圈橙色的环。再按一下，水压再顶一下（小一号的声音和弹跳）。',
      watch: ['按下：泵一声、水柱一粗、水花炸开', '计时牌：弹一下，数字滚下去，“加快 ×2.4”', '之后水声一直更急、水柱一阵阵顶'],
      variants: [
        { k: 'once', label: '按一下', run: () => { netTo('tube'); toWash(); S.sim(0.4); return { dur: 3.4, at: [[0.8, () => api().key('Space')]] }; } },
        { k: 'twice', label: '连按两下', run: () => { netTo('jug'); toWash(); S.sim(0.4); return { dur: 3.4, at: [[0.8, () => api().key('Space')], [1.4, () => api().key('Space')]] }; } },
      ],
    },
    {
      id: 'B17', name: '普通揭晓·确认', tier: '中 · 揭幕',
      when: '冲洗完，看清网里是什么的那一下',
      feel: '“哦，是这个”',
      before: '第二批已经减重：水停 0.2 秒后一声 `reveal`（3 个发声体）、物件整件亮一下、硬的东西顶上一颗小星、名字卡滑进来、水珠往下滴。整件一起亮，看不出形状，金属和陶一个样；冲洗的最后一点泥还挂在上面。',
      after: '水一停，残留的泥窗收拢、剩下的泥片一并收走；0.2 秒后一道亮光顺着物件最长的方向扫过去（0.5 秒，金属和玻璃最亮、瓷柔一些、布和木几乎没有），配一声细细的“唰”（只给金属、玻璃、瓷）。不闪白、不震屏，3 个发声体，时长不变。',
      watch: ['水停：东西干干净净地站在那里', '0.2 秒：“叮”，一道光顺着东西扫过去', '名字卡滑进来、水珠往下滴'],
      variants: [
        { k: 'metal', label: '金属：铜信筒', run: () => { netTo('tube'); S.toPhase('wash', 1.0); return { dur: 4.6 }; } },
        { k: 'ceramic', label: '陶：盐釉陶壶', run: () => { netTo('jug'); S.toPhase('wash', 1.0); return { dur: 4.6 }; } },
        { k: 'cloth', label: '布和木：封蜡货袋', run: () => { netTo('bag'); S.toPhase('wash', 1.0); return { dur: 4.6 }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 4 }));

  // —— 第五批（珍品一串的其余）：C4、C5、C7、C9、B18 ——
  // 一网要捞上来几样时的落点（同一片海、固定种子）：铜信筒 + 铜轮滑车，两只陶壶 + 锡盘；尾舱的船钟
  const P5 = { pair: [185.3, 6.65], three: [298.7, 27.6], bell: [293.8, 40] };
  const net5 = (k) => { S.fresh(); const p = P5[k] || P[k]; return S.net(p[0], p[1]); };
  // 珍品的一网：银币匣在沉船货舱（第一网就是它），镀金珐琅匣在下坡 16 米
  const preciousNet = (k) => { if (k === 'silver') { workAt(...Q.wreck); S.drop(); } else netTo('rel'); };
  // 网口收紧、绞车刚要往上拽的那一刻
  const toLift = (lead = 0.35) => S.until((g) => g.op && g.op.state === 'closing' && g.op.t > 0.9 - lead, 40);

  const batch5 = [
    {
      id: 'C4', name: '珍品那一网的预兆', tier: '重 · 标志时刻 S1 的预兆',
      when: '珍品那一网：网口收紧、起吊、出水、转回甲板、落下（约 6 秒）',
      feel: '这一网不一样：还没看见是什么，吊臂、绞车、船、水先告诉你',
      before: '和普通的一网一样：起吊、出水完全相同，吊臂不弯，绞车同一个声音；落甲板只比普通的震得多一点、船身沉得深一点，没有别的区别。',
      after: '**网离底那一下**离合“咣”地咬上，吊臂往下一沉再弹一下，之后一直弯着（每一节在套口处往下折，臂端低半米多）；船朝吊臂那一舷歪过去 2° 上下；绞车的音调被拖到 60 多赫兹慢慢往上挣，底下一阵阵低低地喘，钢架隔一会儿“吱嘎”一声。镜头往前凑、压低，转到能看见吊臂侧面的地方。**出水**时吊臂再沉一截（没了浮力）；网边上摊开一片褐色泥水，里面拖出一缕细细的金，顺着水流弯弯地拖开几米再淡掉；网底一个角上一直淌着金色的泥水、一颗颗金星往下掉，网包上一闪一闪；一串细细的亮音往下落。**落甲板**更沉：一声压到肚子里的低响、钢缆“嗡”地松开、船壳长长地呻吟；吊臂卸了劲往上一弹；船身左右晃三四下才稳住，晃到哪边哪边的水拍起来。网升多快、什么时候转回来都和普通一网一样。',
      watch: [
        '**离底**：“咣”一声，吊臂一沉一弹、一直弯着，船朝吊臂那边歪；绞车音调低、底下喘，隔一会儿吱嘎一声',
        '**起吊**：镜头凑过去，从侧面看吊臂和网',
        '**出水**：吊臂再沉一截；泥水里拖出一缕金，网底淌金水、掉金星，一串亮音',
        '**落甲板**：压得很低的一声，吊臂往上一弹，船身左右晃三四下、两舷拍水',
      ],
      variants: [
        { k: 'silver', label: '银币匣 · 沉船货舱', run: () => { preciousNet('silver'); toLift(); return { dur: 7.6 }; } },
        { k: 'rel', label: '镀金珐琅匣 · 下坡 16 米', run: () => { preciousNet('rel'); toLift(); return { dur: 9.4 }; } },
        { k: 'surface', label: '出水和转回甲板（拉近看）', run: () => { preciousNet('silver'); S.until((g) => g.op && g.op.state === 'lifting' && g.op.y - 1.05 > -1.6, 40); return { dur: 4.4 }; } },
        { k: 'normal', label: '对照：普通的一网（铜信筒）', expect: 'B12', run: () => { netTo('tube'); toLift(); return { dur: 5.4 }; } },
      ],
    },
    {
      id: 'C5', name: '珍品冲洗：露头', tier: '重 · 标志时刻 S1 的憋住',
      when: '珍品冲洗 5.4 秒（之后是 C6 确认那一下）',
      feel: '先认出水下见过的那一角，憋住',
      before: '泥一层层淡掉，冲到 85–90% 时整件已经看得清清楚楚（`demo-15`）；冲洗后段的金光在画面里看不出；水枪一直开到最后。',
      after: '外壳冲掉以后，主件那一团泥贴着它的形状裹着。冲到 0.44 起，两支水枪一起压到朝镜头的那个顶角，泥从那里开出一个口，露出水下见过的那一角（银币匣的包角，珐琅匣的鎏金和蓝珐琅），干净、湿亮，一串水光往下流，“刷——”一声，紧跟着水柱打到实物“叮”；别处一直裹着泥，那一角里透着暖光一明一暗，到确认那一下才整片崩开。**最后 1 秒**两支水枪收小，水声、海声一起压到四成；最后 0.4 秒水停、整条抽空，只剩一滴水（接 C6）。',
      watch: [
        '**前段**（0–0.42）：外壳冲掉，主件还整团裹着泥',
        '**露头**（0.44–0.6）：两支水枪压到同一角，泥上开出一个口，露出水下见过的那一角，“刷——”“叮”',
        '**憋住**：别处一直裹着泥，那一角湿亮、透着暖光',
        '**最后 1 秒**：水枪收小，水声、海声一起压下去；最后 0.4 秒只剩一滴水（C6）',
      ],
      variants: [
        { k: 'silver', label: '银币匣 · 沉船货舱', run: () => { preciousNet('silver'); S.toPhase('wash', 5.3); return { dur: 6.6 }; } },
        { k: 'rel', label: '镀金珐琅匣 · 下坡 16 米', run: () => { preciousNet('rel'); S.toPhase('wash', 5.3); return { dur: 6.6 }; } },
        { k: 'end', label: '最后 2 秒（水声收小）', run: () => { preciousNet('silver'); S.toPhase('wash', 2.1); return { dur: 3.0 }; } },
        { k: 'fast', label: '按空格加快冲洗', run: () => { preciousNet('rel'); S.toPhase('wash', 5.3); return { dur: 4.4, at: [[0.9, () => api().key('Space')]] }; } },
      ],
    },
    {
      id: 'C7', name: '珍品展开：大家都围过来', tier: '重 · 标志时刻 S1 的余波、余韵',
      when: '珍品确认后的 3.2 秒展示（确认那一下是 C6）',
      feel: '好好欣赏，大家都围过来',
      before: '第二批做过：冲洗到一半闲着的人走到物件后面站成半圈，确认后 0.5 秒起一个接一个欢呼（相隔 0.07 秒，几乎同时）；镜头退开抬高、只绕 7°。欢呼没有声音，船长不在画里，同网的东西只往左边一挪。',
      after: '镜头确认那一下是近景，随后在 3.2 秒里慢慢退开、抬高，同时绕着它往船尾那边转过二十来度（起落都是缓的），最后停稳。外壳一冲掉闲着的人就围过来，站在物件后面、画面左半边（水槽挡着就往后站一点），四个人都在画里；从镜头和物件之间走过去的人先藏起来，不会有半截巨大的身子。欢呼一个带一个起来（离它最近的先跳，相隔约 0.17 秒）：第一个跳起来时一声“嘿——！”，两手在头顶拍到一起就有掌声，跟身边的人击掌“啪”，石头吹一声口哨。同网的东西等余波过去，从 1.25 秒起一件件跳到它左边，落下时轻轻一响。',
      watch: [
        '**0.5–1.4 秒**：最近的人先跳起来，一个带一个传过去；“嘿——！”、口哨',
        '**1.4–3.2 秒**：拍手、击掌都有声音；镜头慢慢绕过二十来度，四个人和它一起在画里',
        '同网的东西一件件跳到旁边落定',
      ],
      variants: [
        { k: 'silver', label: '银币匣 · 沉船货舱', run: () => { preciousNet('silver'); S.toPhase('wash', 0.5); return { dur: 4.6 }; } },
        { k: 'rel', label: '镀金珐琅匣 · 下坡 16 米', run: () => { preciousNet('rel'); S.toPhase('wash', 0.5); return { dur: 4.6 }; } },
        { k: 'gather', label: '从冲洗开头看起（大家围过来）', run: () => { preciousNet('rel'); S.toPhase('wash', 5.1); return { dur: 9.0 }; } },
      ],
    },
    {
      id: 'C9', name: '船钟：当——', tier: '中 · 一趟 1 次',
      when: '尾舱的船钟揭晓、扶正之后 0.45 秒',
      feel: '当——，海底传来回响',
      before: '`toll` 一声（7 个发声体）：一个低哼音加几个泛音，干干地收掉；钟自己不动，水面没有任何变化。',
      after: '钟舌一敲，钟身跟着晃起来（左右来回，越晃越小），震下一圈水珠，甲板上推出一道淡圈。钟声：低哼、主音、小三度、五度、八度和两个高泛音一起响，每一层都是两支差一点点的音，拍出“嗡——嗡——”的颤，低哼拖到 7 秒多；周围的海声、机器声让到一半，3 秒后回来。**水面**从钟所在的地方推出一圈波纹（波峰亮、波谷暗），越推越慢，扩到二三十米外；0.55 秒、1.3 秒后海底传回两声越来越闷的回响（底下带一层低低的嗡），水面跟着再推出两圈淡一点的。',
      watch: [
        '**0.45 秒**：钟舌一敲，钟身晃起来，震下水珠，甲板上一道淡圈；“当——”长长地颤着收',
        '水面从船边推出一圈波纹（拉回大景看得最清楚）',
        '**+0.55、+1.3 秒**：海底两声闷闷的回响，水面再推出两圈淡的',
      ],
      variants: [
        { k: 'bell', label: '船钟 · 尾舱', run: () => { net5('bell'); S.toPhase('wash', 0.5); return { dur: 6.2 }; } },
        { k: 'wide', label: '拉回大景看波纹', run: () => { net5('bell'); S.toPhase('show', 1.9); return { dur: 5.4 }; } },
      ],
    },
    {
      id: 'B18', name: '稳稳看一会儿（普通的展示）', tier: '轻 · 每网都有',
      when: '普通揭晓确认后的 2.25 秒展示（确认那一下是 B17，之后的拉回是 B19）',
      feel: '稳稳看一会儿，同一网的东西都看得清',
      before: '确认后镜头还要推近、跟着物件抬起来再走 1 秒多才停；物件偏在画面左边，同网的东西排在更左边、常被画面边切掉；退开的冲洗手离得太近，被藏起来（展示时最多藏 2 个），画面里没有人。',
      after: '确认以后镜头用 0.6 秒滑到展示的位置，之后一动不动，直到拉回大视野。按这一网有几样来取景：主件在画面左半边（右边是名字卡）的正中，同网的东西左右挨着摆开（多的放左边），整排多宽镜头就退多远，全在画里、不被名字卡挡住。两个冲洗手放下水枪挪半步到展示台后面，两手撑着膝盖弯下腰凑过来看，一个伸手指一指、一个歪着头；谁也不藏。镜头拉回大视野以后他们照旧点头（B19）。',
      watch: [
        '镜头确认后 0.6 秒内停稳，之后不动',
        '主件在左半边正中，同网的东西挨着摆在两边，全在画里',
        '冲洗手在后面弯腰凑过来看，一个指一指',
      ],
      variants: [
        { k: 'pair', label: '两样：铜信筒 + 铜轮滑车', run: () => { net5('pair'); S.toPhase('wash', 0.6); return { dur: 3.3 }; } },
        { k: 'three', label: '三样：两只陶壶 + 锡盘', run: () => { net5('three'); S.toPhase('wash', 0.6); return { dur: 3.3 }; } },
        { k: 'anchor', label: '大件：锻铁锚', run: () => { netTo('anchor'); S.toPhase('wash', 0.6); return { dur: 3.3 }; } },
        { k: 'single', label: '一样：铜信筒', run: () => { netTo('tube'); S.toPhase('wash', 0.6); return { dur: 3.3 }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 5 }));

  // —— 第六批（获得和留下）：B19 B20 B21 C8 C10 A6 ——
  // 一网真蟹：r1:c2（沉船边的翻泥蟹）等它停下翻泥，网口罩住它
  const crabNet = () => {
    S.fresh(); const g = G();
    const find = () => { for (const r of g.world.regions.values()) for (const c of r.creatures) if (c.id === 'r1:c2') return c; return null; };
    S.place(295.4 - 8, 31.6, 0); S.sim(0.5);
    const c = find(); if (!c) return false;
    let p = c.position(); S.placeFor(p.x, p.z); S.work();
    S.until(() => !c.captured && c.mode === 'dwell' && !(c.inShelter && c.inShelter()), 40);
    p = c.position(); g.setAimWorld(p.x, p.z); S.sim(0.8);
    return S.drop();
  };
  // 一网收完：拉回、搬进舱、合计跳完（合计是界面的真实时间，等它）
  const finishNet = async (X) => {
    S.toPhase('show', 0.1); S.sim(0.3);
    S.until((g) => !g.reveal.busy && !g.deckCargo.length && !g.crew.hands.some((s) => s.task && s.task.type === 'carry'), 30);
    await X.waitFor(() => { const h = api().hud; return h.tallyLanded === G().trip.total; }, 5000);
    G().dismissCard && G().dismissCard('all');
    const h = api().hud; if (h.el && h.el.tally && h.dock) h.dock(h.el.tally, false); // 合计先收起（真玩时下一网早过了那 4 秒）
  };
  // 银币匣：沉船货舱的第一网
  const wreckNet = () => { workAt(...Q.wreck); return S.drop(); };
  const zoom = (d) => { const c = G().cam; c.distWork = d; c.distSail = Math.max(14, d); };
  // 贴近看船上一处（甲板坐标 look，镜头在它旁边 off）：每帧跟着船（船在晃）
  const deckCam = (look, off) => () => {
    const g = G(), d = g.boat.deck, L = g.cam.look.clone().set(...look), Pp = g.cam.look.clone().set(look[0] + off[0], look[1] + off[1], look[2] + off[2]);
    d.localToWorld(L); d.localToWorld(Pp); g.debugCam = { pos: Pp, look: L };
  };
  const HATCH = [0, 1.45, -3.25], TANK = [-1.15, 1.7, -6.0];
  // 结果卡不是这一条要看的：摆好场面时先收起来（不然摆场面时发的卡会在放的时候才滚数、跳币、出声）
  const noCards = () => { const g = G(); if (g.cards && g.cards.length) g.dismissCard('all'); };

  const batch6 = [
    {
      id: 'B19', name: '拉回大视野', tier: '轻 · 出场',
      when: '展示结束，镜头 1.25 秒拉回大景（每一网）',
      feel: '一口气退出来，回到船和海都在画里的地方，马上能接着干',
      watch: [
        '**拉回**：镜头不走直线（原来会从吊臂、驾驶室里穿过去），绕着船一边升起一边退出去，先抬头、后退远；一阵轻轻的风声从高往低滑过去',
        '**停在哪**：停在船、舱口和海都在画里的地方——深水的一网原来停在海底的落点上，船整个出了画；现在镜头偏向船这边，舱口在画面中间偏左，不被右边的结果卡挡住',
        '**接着干**：这时就能动；一推摇杆挪落点、一缩放、一换模式、一下网，镜头就慢慢（1 秒）让回原来的作业视角；东西都进舱了也自己让回去',
        '珍贵的一网：镜头再近一点，跟着抱它的人走（见 C8）；只捞上活蟹：看着水槽（见 C10）',
      ],
      before: '镜头直线拉回，深水时停在海底落点上，船和舱口都不在画里；浅水时船在画面上缘、半个被结果卡挡住。',
      variants: [
        { k: 'deep', label: '深水：盐釉陶壶（10 米）', run: () => { netTo('jug'); S.toPhase('show', 0.6); return { dur: 6 }; } },
        { k: 'shallow', label: '浅滩：铜信筒（3 米）', run: () => { netTo('tube'); S.toPhase('show', 0.6); return { dur: 6 }; } },
        { k: 'sail', label: '拉回时就切航行、开船', run: () => { netTo('tube'); S.toPhase('show', 0.6); return { dur: 5.5, at: [[0.9, () => api().key('Tab')]], hold: [['KeyW', 1.05, 4.5]] }; } },
        { k: 'move', label: '拉回后马上挪落点（镜头让回去）', run: () => { netTo('tube'); S.toPhase('show', 0.6); return { dur: 5.5, hold: [['KeyD', 2.4, 3.4]] }; } },
      ],
    },
    {
      id: 'B20', name: '结果卡入账', tier: '轻 · 清点',
      when: '拉回时结果卡落到右边（每一网）',
      feel: '这一网算进去了，这一趟又多了一笔',
      watch: [
        '**落卡**：结果卡从右边滑进来，一枚签从展示铭牌飞进卡里',
        '**入账**：签落进去“叮”一声，金额往上滚，滚的时候细细地“嗒”四下、越来越慢（珍贵的亮一点）',
        '**小币**：金额滚完，一枚小币从卡上跳进卡下面这一趟的合计，合计亮一下、跟着滚上去，写着这一趟几件；4 秒后合计自己收起（常驻界面只留当前要的）',
      ],
      before: '有签飞进卡、小火花，金额等签到了再滚；没有声音，也没有“总数”——那枚小币没地方飞。',
      variants: [
        { k: 'trip1', label: '这一趟第一网', run: () => { netTo('tube'); S.toPhase('show', 0.4); return { dur: 5 }; } },
        { k: 'stack', label: '第二网：合计接着往上滚', run: async (X) => { netTo('tube'); await finishNet(X); const p = P.jug; S.net(p[0], p[1]); S.toPhase('show', 0.4); return { dur: 5 }; } },
        { k: 'precious', label: '珍贵的一网', run: () => { netTo('rel'); S.toPhase('show', 0.4); return { dur: 5 }; } },
        {
          k: 'trip2', label: '再来一次以后',
          run: async (X) => {
            netTo('tube'); S.toPhase('show', 0.1); S.sim(3);
            quitTrip(); S.sim(1.2);
            const g0 = G(); S.sim(3 / 60, (i) => ({ A: i === 0 })); // 收获单上按 A：再来一次（黑场是真实时间，等它过去）
            await X.waitFor(() => G() !== g0 && !document.querySelector('.fade.on'), 6000);
            const g = G(); g.introT = 0;
            const p = P.tube; S.net(p[0], p[1]); S.toPhase('show', 0.4);
            return { dur: 5 };
          },
        },
      ],
    },
    {
      id: 'B21', name: '进舱', tier: '轻 · 吞没',
      when: '拉回后，船员把东西抱到舱口放进去（每一件）',
      feel: '收进来了，稳稳的',
      watch: [
        '**放下**：船员蹲在围板边，把东西越过围板放到舱里那一堆上',
        '**咚**（同一帧）：一声空空的木头“咚”——舱板闷一下、舱里那口空气嗡一下（越重越低），硬的再带一点碰响；舱里的灯一下亮起来（暗的方口在大景里一下变暖），围板一圈暖光，四边吐出一圈尘',
        '**余波**：重的东西船身一沉；放下的人直起身，重的拍拍手、点个头',
        '几件接连进舱，后一件晚 0.18 秒，不叠成一声',
      ],
      before: '`stow` 一声闷响（约 3 个发声体），舱口四边暖光 0.75 秒、8–16 个光点、一圈泥水；大景里舱口是暗的，看不太出放进去了。',
      variants: [
        { k: 'light', label: '轻：铜信筒', run: () => { netTo('tube'); S.toStow(); noCards(); return { dur: 4 }; } },
        { k: 'heavy', label: '重：锻铁锚', run: () => { netTo('anchor'); S.toStow(); noCards(); return { dur: 4 }; } },
        { k: 'close', label: '拉近看（14 米）', run: () => { netTo('jug'); S.toStow(1.6); noCards(); zoom(14); return { dur: 4.5 }; } },
      ],
    },
    {
      id: 'C8', name: '珍品进舱', tier: '重 · 标志时刻 S3',
      when: '珍贵的一网拉回以后，它被抱进舱里（一趟一两次）',
      feel: '这件真的归我了（S3：比 S1 珍品确认轻，比普通进舱重得多）',
      watch: [
        '**预兆**：拉回大景，镜头比平常近一点，跟着它走；它身上一直透着一点金光；抱它的人一拿起来，闲着的人让到路两边、转过来看着',
        '**憋住**：走到舱口，举到舱口上方停半拍（0.6 秒）——金光一点点涨起来，一缕很轻的亮音跟着涨，下面垫一声低低的嗡',
        '**爆发**（同一帧）：放进去，舱口一下灌满金光，一道方的光柱往上冲，一把金色火星；一声沉沉的“咚”（舱里那口空气嗡很久），金色的泛音亮起来；船身吃进这份重量一沉；让在两边的人一起点头、举手，船长挥手',
        '**余波**：舱口冒一缕金色的尘，慢慢往上散，飘着几点金光（约 2 秒）',
        '**余韵**：舱里一池金光一直留着、慢慢呼吸，一直到这一趟结束（和 A6 呼应）',
      ],
      before: '拉回很快，搬运没有声音，舱口约 4 个水花粒子；深水时镜头停在海底，船都不在画里，看不见；手动玩时欢呼在画面外。',
      variants: [
        { k: 'rel', label: '镀金珐琅匣：从拉回看到余韵', run: () => { netTo('rel'); S.toPhase('show', 0.6); return { dur: 11 }; } },
        { k: 'stow', label: '只看进舱那几秒', run: () => { netTo('rel'); S.toPhase('show', 0.1); S.toStow(1.4, 30); noCards(); return { dur: 5.5 }; } },
        { k: 'silver', label: '银币匣（沉船货舱）', run: () => { wreckNet(); S.toPhase('show', 0.1); S.toStow(1.4, 30); noCards(); return { dur: 5.5 }; } },
        { k: 'close', label: '拉近看（12 米）', run: () => { netTo('rel'); S.toPhase('show', 0.1); S.toStow(1.4, 30); noCards(); zoom(12); return { dur: 5.5 }; } },
      ],
    },
    {
      id: 'C10', name: '活蟹', tier: '中 · 救起',
      when: '捞上活蟹，拉回以后',
      feel: '活的！救上来了，好好安顿它',
      watch: [
        '**格栅上**：蟹在甲板上挣两下、横着窜一截（不出它那块地方）；有人走近，转过去对着他、举起两只螯',
        '**捏起来**：船员蹲下捏起它，“咔嗒”两下；拿在手里腿乱蹬、螯乱夹，隔一会儿“咔”一下',
        '**进水槽**：从手上抛到水槽上方，扑通掉进去——一声往上翘的水泡音、水花从槽口溅出来、水面一圈波纹往外推、一串气泡；沉到底，缓一缓',
        '**之后**：在槽里走一截、停一会儿、偶尔举螯，吐个泡（见 A6）；只捞上活蟹时，拉回的镜头看着水槽',
      ],
      before: '按普通物件揭晓（活物材质声），然后进水槽：在格栅上只原地抖，放进水槽时直接出现在槽里，没有声音也没有水花；槽里上下浮着抖。',
      variants: [
        { k: 'deck', label: '翻泥蟹：从拉回看到进水槽', run: () => { crabNet(); S.toPhase('show', 0.6); return { dur: 9 }; } },
        { k: 'tank', label: '只看进水槽', run: () => { crabNet(); S.toPhase('show', 0.1); S.until((g) => g.crew.hands.some((s) => s.task && s.task.type === 'carry' && s.task.phase === 'drop'), 20); noCards(); const f = deckCam(TANK, [2.4, 3.2, -2.2]); f(); return { dur: 4, frame: f }; } },
      ],
    },
    {
      id: 'A6', name: '舱里越攒越多', tier: '轻 · 新 · 构筑替身',
      when: '一趟里一直在：每进舱一件就多一点',
      feel: '这一趟攒了不少（不用看数字也知道）',
      watch: [
        '**货堆**：舱口看得见里面的货一件件堆高；舱里一盏暖灯照着它们，堆得越多灯池越亮（大景里方口从暗变暖）',
        '**吃水**：舱里越重，船吃水越深（一满舱约 15 厘米；重的东西沉得多）',
        '**珍品**：珍品进舱以后，舱里一池金光一直隐约亮着、慢慢呼吸，到这一趟结束',
        '**水槽**：槽里的蟹在走、停、举螯、吐泡（水面薄了一点，从大景往下看也看得见）',
      ],
      before: '舱里的东西看得见，舱里有反光（134 个粒子），货堆高不高看不出；船不吃水；槽里的蟹原地上下浮。',
      variants: [
        { k: 'pile', label: '三网以后：再放一件', run: async (X) => { netTo('tube'); await finishNet(X); for (const k of ['anchor', 'jug']) { const p = P[k]; S.net(p[0], p[1]); await finishNet(X); } const p = P.bag; S.net(p[0], p[1]); S.toPhase('show', 0.1); S.toStow(1.6, 30); noCards(); zoom(15); return { dur: 5 }; } },
        { k: 'gold', label: '珍品进舱以后（余韵）', run: () => { netTo('rel'); S.toPhase('show', 0.1); S.until((g) => g.reveal.hold.items.some((x) => x.precious), 30); S.sim(0.6); noCards(); const f = deckCam(HATCH, [2.2, 5.2, -2.8]); f(); return { dur: 5, frame: f }; } },
        { k: 'tank', label: '水槽里的蟹', run: () => { crabNet(); S.toPhase('show', 0.1); S.until((g) => g.tank && g.tank.length, 30); noCards(); const f = deckCam(TANK, [2.6, 3.6, -2.6]); f(); return { dur: 6, frame: f }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 6 }));

  // —— 第八批（寻找：地图揭示、选中注入、号令）用的几样 ——
  const F8 = {
    // 别的现场先当作已经看过（只放这一处的发现，不让旁边的现场一起亮）
    knowAllBut(...keep) { const g = G(); for (const r of g.world.regions.values()) for (const s of r.sites) if (!keep.includes(s.id)) g.known.sites[r.id + ':' + s.id] = 'near'; },
    site(id) { for (const r of G().world.regions.values()) for (const s of r.sites) if (s.id === id) return s; return null; },
    // 镜头站在船和 (tx, tz) 连线的侧面，两样并排在画面里；turn 是再往旁边转多少（转开了它就在画面外）
    look(tx, tz, turn = 0) { const g = G(), b = g.boat; g.cam.yaw = Math.atan2(b.x - tx, b.z - tz) + Math.PI / 2 + turn; g.cam.ease = null; g.cam.init = false; },
    // 离 (sx, sz) 有 dist 米、水够深、不压在沉船上的一处，船头朝它
    near(sx, sz, dist) {
      const g = G(); let best = null;
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * TAU, x = sx + Math.sin(a) * dist, z = sz + Math.cos(a) * dist;
        let score = 0;
        for (let d = -8; d <= 8; d += 2) if (g.world.surfaceTop(x + Math.sin(a) * d, z + Math.cos(a) * d) < -3) score++;
        if (Math.hypot(x - 290, z - 30) < 24) score -= 20;
        if (!best || score > best.score) best = { score, x, z, heading: Math.atan2(sx - x, sz - z) };
      }
      return best;
    },
    // 船边的近景：从臂端外侧斜着看回甲板——吊臂、臂端下面挂着的网、甲板上的船长都在画面里
    deckCam(dist = 15, turn = 0.6, up = 6.5) {
      const g = G(), b = g.boat, tip = b.tipWorld(g.cam.pos.clone()), cap = g.crew.captain.g.getWorldPosition(g.cam.pos.clone());
      const look = tip.clone().lerp(cap, 0.45); look.y = 2.2;
      const a = Math.atan2(tip.x - b.x, tip.z - b.z) + turn;
      const pos = look.clone(); pos.x += Math.sin(a) * dist; pos.z += Math.cos(a) * dist; pos.y += up;
      g.debugCam = { pos, look };
    },
    // 去翻泥的那只蟹（沉船船首外的 c1，翻的是印章）
    crab() { for (const r of G().world.regions.values()) for (const c of r.creatures) if (c.id.endsWith(':c1')) return c; return null; },
    // 船停在印章旁边 13 米，等蟹走到它那里、停下来翻了 lead 秒
    toDig(turn = 0, dist = 13, lead = 1.2) {
      S.fresh(); F8.knowAllBut();
      const seal = [295.2, 13.6], p = F8.near(seal[0], seal[1], dist);
      S.place(p.x, p.z, p.heading); F8.look(seal[0], seal[1], turn); S.sim(0.3);
      S.until((g) => { const c = F8.crab(); return c && c.mode === 'dwell' && c.leg === 0 && c.t > lead; }, 40);
      F8.look(seal[0], seal[1], turn);
    },
    // 远处的沉船：从 dist 米外开过去（船头朝它），别的现场都算看过
    toFar(turn, dist = 63.5) {
      S.fresh(); F8.knowAllBut('wreck');
      const s = F8.site('wreck'); let best = null;
      for (let k = 0; k < 48; k++) {
        const a = (k / 48) * TAU; let score = 0;
        for (let d = dist - 20; d <= dist + 6; d += 2) if (G().world.surfaceTop(s.x + Math.sin(a) * d, s.z + Math.cos(a) * d) < -3) score++;
        if (!best || score > best.score) best = { score, a };
      }
      const x = s.x + Math.sin(best.a) * dist, z = s.z + Math.cos(best.a) * dist;
      S.place(x, z, Math.atan2(s.x - x, s.z - z), 4); G().cam.yaw += turn; S.sim(0.2, S.W);
    },
    // 作业：船停在浅滩信筒旁边，转作业，落点先放在 (ax, az)
    workAt(tx, tz, ax, az, prep) { S.fresh(); F8.knowAllBut(); if (prep) prep(G()); S.placeFor(tx, tz); S.work(); S.aim(ax, az, 2.2); return G(); },
    // 落点沿一串点走（每秒 sp 米），走到头停住；返回放的时候每帧推一把的函数
    path(pts, sp, t0 = 0.5) {
      const seg = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, d]); L += d; }
      return (dt, t) => {
        const s = Math.max(0, t - t0) * sp; if (s > L + 0.01 && F8._pathDone) return;
        F8._pathDone = s > L;
        const q = seg.find((x) => s <= x[2] + x[3]) || seg[seg.length - 1];
        const u = Math.min(1, (s - q[2]) / (q[3] || 1));
        G().setAimWorld(q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u);
      };
    },
  };

  const batch8 = [
    {
      id: 'B1', name: '靠近一处线索或残骸', tier: '轻', kind: '地图揭示',
      when: '船开近一处现场或一条线索，看清它的那一下（一趟 3 次）',
      feel: '“这下面有东西”',
      before: '水面上一道细白圈（浅滩那一圈 22 米宽，大半在画面外），底部一行字；第二批接上了一声“叮”。圈和字不在一处，从大景看不出是“这里”。',
      watch: [
        '**爆发**（0 秒）：现场正中的水面冒一串气泡、推开一圈白沫，正中亮一下；水下先“咕”一声，接着轻轻“叮”往上走（现场是五度；线索是四度、低一点），声音偏向它那一边',
        '**余波**（0–1.5 秒）：三道涟漪一圈套一圈扩出去（亮的浪尖后面跟一道淡的），前两道扩过边淡掉，第三道停在这处现场的边上描出它的范围',
        '**名字**：从涟漪正中浮起来，0.9 秒升到上方、字距从宽收紧，一根细线连着水面上那一点，约 3.4 秒淡掉（现场不在画面里时才写在底部那一行）',
        '**线索**：不写字；起点两圈涟漪，虚线 1 秒里从起点一路描到它指的地方，箭头到了弹一下，之后虚线朝那边流',
        '**余韵**：那一圈慢慢呼吸、7 秒内淡掉；两处同时看清只响一声',
      ],
      variants: [
        { k: 'site', label: '现场：浅滩上的散落物', run: () => { S.fresh(); F8.knowAllBut('sandbar'); const a = S.approach('sandbar'); S.place(a.x, a.z, a.heading, 3); S.sim(0.4, S.W); return { dur: 6, hold: [['KeyW', 0, 2.2]] }; } },
        { k: 'clue', label: '线索：沙底的船板', run: () => { S.fresh(); F8.knowAllBut('trail'); const a = S.approach('trail'); S.place(a.x, a.z, a.heading, 3); S.sim(0.4, S.W); return { dur: 6, hold: [['KeyW', 0, 2.2]] }; } },
        { k: 'slope', label: '现场：顺坡散落的东西', run: () => { S.fresh(); F8.knowAllBut('downslope'); const a = S.approach('downslope'); S.place(a.x, a.z, a.heading, 3); S.sim(0.4, S.W); return { dur: 6, hold: [['KeyW', 0, 2.2]] }; } },
      ],
    },
    {
      id: 'C1', name: '远方在招手', tier: '轻', kind: '地图揭示',
      when: '一趟 1 次：离沉船 60 米，远远看见水下的大块暗影',
      feel: '远方在招手：那边还有更深、更大的东西',
      before: '水面上一个虚线小圈；不在画面里时屏幕边上一个 20 像素的小尖角，没有声音，7 秒后消失。',
      watch: [
        '**爆发**：屏幕边上一枚深色小圆牌（深海蓝，比 B1 的大一号）从 1.8 倍弹回来、外面亮一圈；一声远远的、闷一点的“叮”，底下一点低音，后面两道回声越来越远；声音从它那一边传过来',
        '**余波**：每 1.1 秒朝那边探一下（像在招手），尖角外推出两道声呐弧；在画面里时是水面上一个虚线圈弹出来（略冲过头），每 1.1 秒往外推一圈波纹',
        '**余韵**：不写字；7 秒内慢慢淡掉；开近到看清时换成 B1',
      ],
      variants: [
        { k: 'edge', label: '在画面外（屏幕边上招手）', run: () => { F8.toFar(1.75); return { dur: 6, hold: [['KeyW', 0, 1.2]] }; } },
        { k: 'ahead', label: '在正前方', run: () => { F8.toFar(0); return { dur: 6, hold: [['KeyW', 0, 1.2]] }; } },
      ],
    },
    {
      id: 'C2', name: '蟹翻泥露出埋着的东西', tier: '中', kind: '地图揭示',
      when: '沉船船首外那只蟹停下翻泥，翻出一枚埋着的印章（一趟最多 1 次）',
      feel: '意外收获：看得出新东西是蟹刨出来的',
      before: '翻出那一下只有 14 粒泥（在 24 米外几乎看不见），东西一帧之内从泥里跳出来，没有声音；只有镜头正好对着那里才会翻（`staged-17`、`demo-12`）。',
      watch: [
        '**预兆**（0–0.9 秒）：蟹刨得越来越急，泥一团比一团冒得多、冒得大，沙沙几下越来越密',
        '**爆发**（0.9 秒）：碰到硬东西闷闷一“笃”（金属的再带一点“叮”）；一股亮的细泥柱从蟹脚下冲起三四米，脚下一圈沙往外推；那件东西 0.6 秒里从泥里拱出来（不是一帧跳出来）',
        '**余波**：1.3 秒露出的硬角闪一下白光；一声暖的小三度往上；沙色的涟漪画在海底那一层，正好圈住蟹和那件东西（以前画在 9 米上方的水面，斜着看会偏开好远）；在画面外时屏幕边上的沙色指向牌弹一下，声音从那一边来、远了轻',
        '**余韵**：泥柱慢慢摊开、落回去；菱形标记挂上，可以下网了',
        '画面边上一点也算“有人看着”（以前要正好在画面里）：在画面外时指向牌和声音告诉你去哪看',
      ],
      variants: [
        { k: 'watch', label: '镜头对着它', run: () => { F8.toDig(0.18); return { dur: 7 }; } },
        { k: 'edge', label: '在画面边外（指向牌）', run: () => { F8.toDig(0.95); return { dur: 7 }; } },
        { k: 'close', label: '拉近看（18 米）', run: () => { F8.toDig(0.1, 10); G().cam.distSail = 18; return { dur: 7 }; } },
      ],
    },
    {
      id: 'B2', name: '停船、进入作业', tier: '轻', kind: '界面反馈',
      when: '按 Tab（或开船时按 Ⓐ）停船转入作业，一趟 6 次',
      feel: '船停稳了，手里有活了',
      before: '一声通用的 `ui`（两下方波“嘀嘀”），左上角的图标一下换掉、字从上面落下来，镜头转到侧面。开着船按也一样，看不出在刹车。',
      watch: [
        '**爆发**：车钟拉回“停车”：铜手柄“咔、哒”两下；开着船时机器声往下一落、船底的水“哗”地一涌，船尾翻起一团白水，船头压出一点浪',
        '**余波**：刹车的减速度把船头往前一栽，停下来以后弹两下回正（开得越快栽得越深）；左上角的徽章像一枚铜牌翻过来：带着舵轮转到侧面（亮一下）才换成吊钩，再翻回来、略冲过头',
        '**余韵**：吊臂的液压泵“嗡”地起来；镜头转到侧面，作业栏飞进来；吊臂转到落点上方那一下接上 B3 的“咔”',
      ],
      variants: [
        { k: 'cruise', label: '开着船按 Tab（刹车）', run: () => { S.fresh(); F8.knowAllBut(); const a = S.approach('sandbar', 4); S.place(a.x, a.z, a.heading, 6); S.sim(0.3, S.W); return { dur: 4, hold: [['KeyW', 0, 0.6]], at: [[0.8, () => api().key('Tab')]] }; } },
        { k: 'still', label: '停着按 Tab', run: () => { S.fresh(); F8.knowAllBut(); S.placeFor(...P.tube); return { dur: 3.2, at: [[0.6, () => api().key('Tab')]] }; } },
      ],
    },
    {
      id: 'B3', name: '移动落点', tier: '轻', kind: '选中注入',
      when: '作业时推摇杆、按 WASD 或点海底，挪网口那一圈',
      feel: '网会落在哪里一清二楚，推起来有手感',
      before: '网口在触底面画一个平圆，地不平时加一圈贴地的淡虚线；网兜不到的低处是 3 像素的红点；作业栏写深度和油。挪的时候没有声音，圈套住东西、吊臂到位都没有表示。',
      watch: [
        '**挪的时候**：贴着海底的那一圈亮起来、变实（平地上也画），看得出地的高低；触底深度每变半米，测深绳轻轻“嗒”一下（越深越低）；作业栏的深度和油跟着滚',
        '**套住东西**：一件松散物整件进了网口、网兜得到它那一层，它的菱形外面套一个角框（从外面收进来），轻轻“叮”一下（只说“在网口里”，不说“一定捞得到”）',
        '**网兜不到**：挪到船壳、坡坎上，网兜垂不到的低处出红点，红点大一号、一呼一吸，低低“咚”一声（出来的那一下才响）',
        '**吊臂到位**：停了手、吊臂也转到落点上方的那一下，网口圈一亮、放大一点再收回，液压阀“咔”一声——可以下网了（推着摇杆时吊臂一顿一顿地跟，不响）',
      ],
      variants: [
        { k: 'sweep', label: '浅滩：扫过信筒、滑车、锚', run: () => { F8.workAt(...P.tube, 183.2, 2.2); return { dur: 7, frame: F8.path([[183.2, 2.2], [185.2, 6.6], [184, 9.5], [180, 12.3]], 2.2, 0.4) }; } },
        { k: 'slope', label: '下坡：从浅处挪到深处、坡上', run: () => { F8.workAt(...P.tube2, 300.5, 57.5); return { dur: 7, frame: F8.path([[300.5, 57.5], [303.5, 61], [307, 64], [306.5, 58.5]], 2.0, 0.4) }; } },
        { k: 'hull', label: '沉船舷边：从沙底挪上船壳（出红点）', run: () => { F8.workAt(282, 30, 281, 25); return { dur: 6, frame: F8.path([[281, 25], [282, 29], [285.5, 32.5]], 1.4, 0.4) }; } },
        { k: 'reach', label: '推到头：够不着', run: () => { F8.workAt(...P.tube, 182, 9); return { dur: 4, hold: [['KeyD', 0.4, 2.6]] }; } },
      ],
    },
    {
      id: 'B4', name: '按下网', tier: '轻', kind: '号令',
      when: '对准了按 Ⓐ / 空格，每一网的第一下',
      feel: '“放！”',
      before: '一声 `drop`（一下往下滑的三角波加一点噪声）；船长每隔 7–12 秒才指一次，按下网时不一定指；吊臂和绞盘没有动静。',
      watch: [
        '**号令**（0 秒）：一声短哨“嘘—”；船长不等手上别的动作做完，立刻指向臂端，0.35 秒起手掌往下压两下（放！）',
        '**绞盘松开**（0.06 秒）：棘爪弹开“咔啷”一声；绞盘放缆，咔哒由疏到密、嗡声越转越高，算好了正好停在网入水那一刻',
        '**吊臂一沉**（0.08 秒）：网的分量一下交给缆绳，臂端往下点约 2°、船往吊臂那一舷歪一点，再弹两下回来（缆绳跟着臂端走）',
      ],
      variants: [
        { k: 'drop', label: '浅滩：信筒', run: () => { F8.workAt(...P.tube, ...P.tube); return { dur: 3.4, at: [[0.8, () => api().key('Space')]] }; } },
        { k: 'close', label: '船边近景：船长、吊臂、网', run: () => { F8.workAt(...P.tube, ...P.tube); F8.deckCam(12, -0.75, 5); return { dur: 3.4, at: [[0.8, () => api().key('Space')]] }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 8 }));

  const entries = [...batch1, ...batch2, ...batch3, ...batch4, ...batch5, ...batch6, ...batch8];
  const batches = [
    {
      n: 1, title: '第一批 · 试方向', sub: '3 个效果，3 个种类、3 种分量（A7 跟着 W1 一起改）',
      fixes: [['B7', '网触底（S2）：定下“轻而准”的标准'], ['C6', '珍品确认的憋住、爆发、余波（S1 的中段）：最高标准，也解开最挤的那一处'], ['W1', '燃油逼近：平常→黄→红，心跳加快（A7 油表跟着改）']],
    },
    {
      n: 2, title: '第二批 · 量出来的毛病', sub: '6 件，落到 14 个编号（B12、B17 挪到第四批，C7 挪到第五批，B19、B20、B21 挪到第六批，W5 挪到第七批，B1 挪到第八批，C3、C12、D1 挪到第九批，接着做）',
      fixes: [
        ['1', 'bug-1：再来一次后结果卡的飞币和小火花消失', 'B20、D1'],
        ['2', '普通揭晓减重：去闪白、去确认震屏，和弦减到 3 个发声体，黑边变细', 'B17、B23'],
        ['3', '一声多用拆开：被拒四种、ui2 分三声、空网和撞硬物、三种收工、发现线索', 'F7、B22、C3、W5、C12、B1'],
        ['4', '挤成一片的错开：落甲板、拉回各样相隔 60–150 毫秒；点头和挥手等镜头到位', 'B12、B19'],
        ['5', '落甲板的震屏挪到镜头到位之后，加船身下沉一下', 'B12'],
        ['6', '进舱有声有光；珍品欢呼放进近景', 'B21、C7'],
      ],
    },
    {
      n: 3, title: '第三批 · 一网的前半', sub: '6 个编号：入水、下沉、网印、收紧、分量、出水',
      fixes: [
        ['B5', '入水：水面上一片白水散成花边泡沫圈、三道涟漪，水冠和细雾是一颗颗硬边水珠（24 米外也看得清）'],
        ['B6', '下沉：一路拖一串泡；过每个秒结吐一团泡、测深仪“嘀”一声（越近越高）；放绳声跟着快慢'],
        ['B8', '网印：网圈的槽、配重的方坑、爪刮的沟、取走的坑，提网后慢慢显出来，整趟不消失'],
        ['B9', '收紧：缆绳触底时松下来，一吃劲“铮”地绷直、抖两下、甩水珠；网兜拔出泥“啵”'],
        ['B10', '分量：吊臂按分量往下沉、船身歪一点；绞车越沉越低越吃力；轻网出水后摆得大'],
        ['B11', '出水：水面先鼓包、破开一片白水；网眼泄水砸出一片碎白；声音分翻上来、噗、哗哗'],
      ],
    },
    {
      n: 4, title: '第四批 · 揭晓', sub: '6 个编号：掉落揭示、慢揭晓、撕碎、命中、技能出手、揭幕',
      fixes: [
        ['B12', '泥包从松开的网口自由落下、泥块留在甲板上；网架吊高让开近景'],
        ['B13', '冲洗分前、中、后三段；水柱是一条流动的水，溅起的水先浑后清；中段镜头推近'],
        ['B14', '泥壳裂成 7–11 块厚泥片，一块接一块崩开、翻落、溅泥、化掉'],
        ['B15', '冲到实物：冲开一扇窗、按材质亮一下崩出东西，水声跟着变；几件之间至少隔 0.32 秒'],
        ['B16', '按加快：泵一顶、水柱变粗、水花炸开、计时牌弹跳滚数'],
        ['B17', '确认：一道亮光顺着物件扫过去，金属、玻璃、瓷配一声“唰”'],
      ],
    },
    {
      n: 5, title: '第五批 · 珍品一串的其余', sub: '5 个编号：珍品的预兆、露头、展开，船钟，普通的展示（C7 从第二批接着做，条目挪到这一批）',
      fixes: [['C4', '珍品那一网的预兆：吊臂更弯、绞车吃力、船歪，出水带金，落甲板更沉船身晃'], ['C5', '珍品露头：先冲开水下见过的那一角，最后 1 秒水声收小'], ['C7', '珍品展开：镜头慢慢绕，四个人都在画里，欢呼一个带一个、有声音，同网的一件件摆开'], ['C9', '船钟：钟身荡起来，长长的钟声，海底回响，水面推出几圈波纹'], ['B18', '普通的展示：镜头停稳不动，同网的都在画里，冲洗手凑过来看']],
    },
    {
      n: 6, title: '第六批 · 获得和留下', sub: '6 个编号：拉回、入账、进舱、珍品进舱（S3）、活蟹、舱里越攒越多',
      fixes: [
        ['B19', '拉回走弧线，停在船和舱口都在画里的地方；之后镜头偏向舱口，一动就让回去'],
        ['B20', '签落卡“叮”、金额滚的“嗒”；一枚小币跳进这一趟的合计'],
        ['B21', '空空的木头“咚”，舱里的灯一下亮起来，围板四边吐一圈尘，重的船身一沉'],
        ['C8', '珍品进舱（S3）：镜头跟着它、旁人让开，舱口停半拍，金光灌满舱口、沉沉一声，金尘，金光一直留到收工'],
        ['C10', '活蟹在格栅上挣、捏起来咔嗒、扑通进水槽溅一下'],
        ['A6', '舱里的灯越堆越亮，船吃水越深，珍品留金光，槽里的蟹在走'],
      ],
    },
    {
      n: 8, title: '第八批 · 寻找', sub: '地图揭示、选中注入、号令：6 个编号',
      fixes: [
        ['B1', '看清一处现场：气泡、三道涟漪描出范围、名字从水里浮起来'],
        ['C1', '远方在招手：屏幕边的指向牌一下一下地探，远处传来带回声的一声“叮——”'],
        ['C2', '蟹翻泥：越刨越急、“笃”一声、泥柱冲起、硬角拱出来；画面外有指向牌'],
        ['B2', '停船进作业：车钟“咔哒”、船尾翻水、船头一点，徽章像铜牌一样翻过来'],
        ['B3', '挪落点：贴底的圈亮起来、测深“嘀”、套住东西“嗒”、吊臂到位“咔”'],
        ['B4', '按下网：船长哨子加手势、绞盘松开放缆、吊臂一沉'],
      ],
    },
  ];

  window.FX_SCENES = { round: 9, batches, S, P, entries };
})();
