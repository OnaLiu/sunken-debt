// 效果单的场面：第九批「结算」（效果清单第 5 节）：C11（S4）、C12、C3、D1。
// 接在 fx/scenes.js、fx/scenes-b7.js 后面载入，往 window.FX_SCENES 里加这一批（C3、C12、D1 原来在第二批，这一批重做，替换掉原来那几条）。
// 摆场面只用游戏本来就有的接口（__api.sim 快进、__game 的状态、debugCam），改前的版本上也能跑。
(() => {
  const F = window.FX_SCENES; if (!F) return;
  const { S, P } = F;
  const api = () => window.__api, G = () => window.__game;

  // 这一趟的收获：从这片海里真实的东西里挑 n 件记进这一趟（同名的会合并成“×n”；prec：带上珍品）
  const stock = (n, prec = true) => {
    const g = G(), all = [];
    for (const r of g.world.regions.values()) for (const it of r.items.values()) all.push(it);
    all.sort((a, b) => (a.precious ? 1 : 0) - (b.precious ? 1 : 0) || String(a.id).localeCompare(String(b.id)));
    const pick = all.filter((it) => !it.precious).slice(0, n - (prec ? 1 : 0));
    const p = all.find((it) => it.precious);
    if (prec && p) pick.splice(Math.min(2, pick.length), 0, p);
    for (const it of pick) {
      if (g.trip.committed[it.id]) continue;
      g.trip.committed[it.id] = 1;
      g.trip.items.push({ id: it.id, key: it.key, name: it.name, value: it.value, precious: it.precious, live: false });
      g.trip.total += it.value;
    }
    return g;
  };
  // 收工：中途收工（暂停里选“结束这一趟”那一步）；放的第一帧就收工
  const quitNow = () => { G().endReq = true; };
  // 一处看得见海湾的地方：码头外，船头朝东北
  const bay = () => { S.place(40, -12, 0.9, 0); S.sim(0.6); };
  // 等到“再来一次”亮起来（改前的版本没有这一拍，弹出来就算）
  const ready = (max = 12) => S.until((g) => !!g.ended && g.ended.ready !== false, max);
  // 都捞过了：把海底剩下的东西都算捞走，等收工（2.2 秒）还差 lead 秒
  const allTaken = (lead) => {
    for (const r of G().world.regions.values()) for (const it of r.items.values()) if (it.state === 'seabed') it.state = 'gone';
    S.until((g) => !!g.ended || (g.endT || 0) > 2.2 - lead, 8);
  };
  // 近看甲板上的一处（甲板坐标）：镜头跟着船，从 (dx, dy, dz) 外看过去
  const deckCam = (lx, lz, dx, dy, dz, ly = 1.6) => () => {
    const g = G(), d = g.boat.deck, v = g.view.camera.position;
    g.debugCam = { pos: d.localToWorld(v.clone().set(lx + dx, ly + dy, lz + dz)), look: d.localToWorld(v.clone().set(lx, ly, lz)) };
  };
  const W = [0.9, -6.0]; // 清洗位（网落回甲板的地方）

  const batch9 = [
    {
      id: 'C11', name: '收获单', tier: '重 · 清点（S4）',
      when: '网下完或油见底，一趟收工，出收获单（列出每一件和总价值）',
      feel: '这一趟值了',
      watch: [
        '**预兆**：暗幕落下以前，手上没活的人停下来，一个接一个转身对着镜头（约 0.1 秒一个），船长挥挥手；镜头慢慢退到一个斜角，船放在画面右边三分之一，左边留给单子',
        '**暗幕**：从上往下落（0.5 秒），左边暗、右边淡，船和船员还看得见',
        '**憋住**：单子升起（纸“唰”一声，环境声压低一截）；一行一行滑进来，每行“嗒”一下、一声比一声高；**珍品那一行前停半拍**，进来时一道金光扫过、叮一串',
        '**爆发**：总价从 0 滚上去（咔哒越来越慢），滚到头**盖一个朱红的章**：“满载”（都捞过了）/“油尽”（没油，墨不匀、印歪了）/“收工”（中途收工，盖得轻）；单子往下一顿，溅几点印泥，一声沉沉的“咚”',
        '**余波**：珍品那行的金菱形再亮一次，两声很轻的“叮”',
        '**余韵**：“再来一次”在 1.2 秒里慢慢亮起来，箭头不晃、不催；亮了以后按 Ⓐ 才是再来一次，**亮以前按 = 直接跳到盖章**',
        '整张单子按游戏时间走：慢放跟着慢，暂停时停住',
      ],
      before: '暗幕 0.3 秒、单子 0.42 秒升起、每行错开 0.05 秒滑入（没有声音），总价在 1.5 秒“啪”地出现（数字在藏着的时候滚完了，看不见滚），珍品那行有金色菱形；一进来就能按“再来一次”。',
      after: '五拍都有了：船员转身看镜头、镜头退到告别的位置（预兆）→ 暗幕落下、单子升起、一行一声“嗒”、珍品停半拍金光扫过（憋住）→ 总价从 0 滚上去、盖章（爆发）→ 珍品菱形再亮（余波）→ “再来一次”慢慢亮起（余韵）。',
      variants: [
        { k: 'full', label: '一趟的收获（七件，有一件珍品）', run: () => { S.fresh(); bay(); stock(7); quitNow(); return { dur: 9 }; } },
        { k: 'many', label: '捞得多（十二件，最后一行“+N”）', run: () => { S.fresh(); bay(); stock(12); quitNow(); return { dur: 9.5 }; } },
        { k: 'plain', label: '没有珍品（四件）', run: () => { S.fresh(); bay(); stock(4, false); quitNow(); return { dur: 8 }; } },
        { k: 'none', label: '什么也没捞上', run: () => { S.fresh(); bay(); quitNow(); return { dur: 6 }; } },
        { k: 'skip', label: '一弹出来就按 Ⓐ（跳到盖章，再按才再来一次）', note: '按第一下：直接到盖章（章照样砸下来、有声）；“再来一次”亮得快一点；按第二下才再来一次',
          run: () => { S.fresh(); bay(); stock(7); quitNow(); return { dur: 6.5, at: [[2.1, () => api().key('Space')], [4.2, () => api().key('Space')]] }; } },
      ],
    },
    {
      id: 'C12', name: '三种收工', tier: '中 · 胜利抵达',
      when: '捞完、没油、中途收工，一趟结束',
      feel: '捞完是圆满，没油是狼狈但值，中途收工很平静',
      watch: [
        '**捞完**：汽笛一长声，烟囱旁“嘶”地喷一股白汽；舱口里的灯满满一亮（暖色，不是珍品那道金光柱），围板吐一圈尘，舱里的东西一件接一件反一下光；船员转过来对着镜头举手欢呼；四个音往上走',
        '**没油**：发动机咳两声，烟囱**跟着冒两团黑烟**，船身两抖；然后熄火（发动机声停了、不再冒烟），船慢慢滑停；大家先抬头看烟囱，再转过来，有两个人耸耸肩；三个音往下落',
        '**中途收工**：只有一个低低的五度长音；船员转过来点点头；暗幕很快落下（0.7 秒）',
        '三种之后都接收获单（C11），章上的字也不同：满载 / 油尽 / 收工',
      ],
      before: '声音三种分开了（船笛四个音往上 / 咳两声熄火三个音往下 / 一个低五度），画面三种一样：收获单直接盖上来。',
      after: '船上先有一下再出单子：捞完——白汽、舱口满满一亮、东西一件件反光、大家举手；没油——两团黑烟和咳声对上、船身两抖、熄火滑停、有人耸肩；中途收工——转过来点点头。单子按收工方式晚 1.35 / 1.5 / 0.7 秒落下。',
      variants: [
        { k: 'done', label: '都捞过了（舱里有东西）', run: () => { S.fresh(); const p = P.tube; S.net(p[0], p[1]); S.toPhase('show', 0.1); S.until((g) => !g.reveal.busy && !g.crew.pendingCarry(), 30); S.sim(1.5); allTaken(0.6); return { dur: 5.5 }; } },
        { k: 'fuel', label: '油不够了（开着船）', run: () => { S.fresh(); S.place(40, -12, 1.69, 4); G().boat.fuel = 1.2; S.sim(1.0, S.W); return { dur: 5.5, hold: [['KeyW', 0, 5.5]] }; } },
        { k: 'quit', label: '中途收工', run: () => { S.fresh(); S.placeFor(...P.tube); return { dur: 4.5, at: [[0.6, () => api().key('Escape')], [1.5, () => G().hud.onPauseAction('end')]] }; } },
        { k: 'doneNear', label: '都捞过了·近看舱口和船员', run: () => { S.fresh(); const p = P.tube; S.net(p[0], p[1]); S.toPhase('show', 0.1); S.until((g) => !g.reveal.busy && !g.crew.pendingCarry(), 30); S.sim(1.5); allTaken(0.6); const f = deckCam(0, -3.0, -3.6, 3.6, -5.2, 1.0); f(); return { dur: 4, frame: f }; } },
        { k: 'fuelNear', label: '油不够了·近看烟囱', run: () => { S.fresh(); S.place(40, -12, 1.69, 4); G().boat.fuel = 1.2; S.sim(1.0, S.W); const f = deckCam(-0.6, 1.0, 9.6, 1.6, -5.8, 4.2); f(); return { dur: 4, hold: [['KeyW', 0, 4]], frame: f }; } },
      ],
    },
    {
      id: 'C3', name: '空网', tier: '轻 · 抹杀',
      when: '网吊回来，里面什么也没有',
      feel: '有点失落，但不罚人',
      watch: [
        '网兜落回甲板：兜底往下**浇一股泥水**，砸在甲板上溅开，摊成一摊（约 0.5 秒摊到 1.4 米上下）',
        '几粒泥块蹦开，一两缕水草跟着掉下来躺在那摊里',
        '那一摊停一会儿，约 3 秒里从甲板缝漏掉（边缩边淡），湿印子再留一会儿',
        '离得最近、手上没活的人停下来转身看，**耸耸肩**（肩一抬、两手一摊、头一歪）；再远一点的那个摇摇头',
        '声音：泥水“哗”地泼在木板上，从甲板缝嘶嘶漏下去，滴两滴；末了两个很轻的音往下走一步（不是“错了”的那种声音）',
        '结果卡照旧写为什么空；不进近景；和碰了硬物收回来的空网架（W5）分开',
      ],
      before: '空网落回甲板：甩出十几粒泥点（0.7 秒就没了），一声“噗”加两滴（3 个发声体）；船员没反应。',
      after: '倒出来只有泥水：一股泥水浇下来、摊成一摊、几秒里漏掉，水草和泥块留在里面；最近的船员转身耸耸肩。声音多了漏水的嘶嘶和往下走的两个轻音（6 个发声体）。',
      variants: [
        { k: 'empty', label: '浅滩旁的空沙地', run: () => { S.fresh(); const b = S.bareSand(); S.net(b[0], b[1]); S.toLanding(1.3); return { dur: 5.5 }; } },
        { k: 'near', label: '近看清洗位', run: () => { S.fresh(); const b = S.bareSand(); S.net(b[0], b[1]); S.toLanding(1.3); const f = deckCam(W[0] - 0.4, W[1] + 2.6, 4.4, 6.6, -6.6, 0.5); f(); return { dur: 5.5, frame: f }; } },
      ],
    },
    {
      id: 'D1', name: '再来一次', tier: '中 · 开局',
      when: '收获单上“再来一次”亮了以后按 Ⓐ',
      feel: '再来！',
      watch: [
        '按下去：车钟“叮叮”两下，单子往下滑走',
        '黑场至少 0.4 秒；新的一趟在黑场里建好，船已经开起来了（油、开场提示照新的一趟算）',
        '揭开：黑幕带着软边**从下往上抹开**，海面先亮；船带着速度、航迹和烟；发动机一口气起来，环境声回来',
        '界面晚半拍才淡进来',
        '新的一趟把收获、海底、结果卡的记账都清掉（第二趟的签和小火花照样有，见 B20）',
      ],
      before: '整屏黑场 0.42 秒淡入淡出，新的一趟船停在码头边不动；没有声音。',
      after: '车钟叮叮、单子滑走 → 黑场 → 从下往上抹开，船已经在走（约 4 米/秒，航迹和烟都有），发动机起来，界面晚半拍出来。',
      variants: [
        { k: 'restart', label: '按 Ⓐ 再来一次', run: () => { S.fresh(); bay(); stock(5); G().endReq = true; S.until((g) => !!g.ended, 6); ready(); S.sim(0.5); return { dur: 4.5, at: [[0.6, () => api().key('Space')]] }; } },
      ],
    },
  ];
  batch9.forEach((e) => (e.batch = 9));
  const ids = new Set(batch9.map((e) => e.id));
  F.entries = F.entries.filter((e) => !ids.has(e.id)).concat(batch9);
  F.batches.push({
    n: 9, title: '第九批 · 结算', sub: '4 个编号：收获单（S4）、三种收工、空网、再来一次（C3、C12、D1 原来在第二批，这一批重做）',
    fixes: [
      ['C11', '收获单（S4）：船员转身看镜头 → 暗幕、单子升起、一行一声“嗒”、珍品停半拍 → 总价滚上去盖章 → 珍品再亮 → “再来一次”慢慢亮起'],
      ['C12', '三种收工船上先有一下：白汽和舱口满满一亮 / 两团黑烟、熄火滑停 / 转过来点点头'],
      ['C3', '空网：一股泥水浇下来摊成一摊、几秒里漏掉，水草和泥块，最近的人耸耸肩'],
      ['D1', '再来一次：车钟叮叮、黑场、从下往上抹开，船已经在走'],
    ],
  });
  F.batches.sort((a, b) => a.n - b.n);
})();
