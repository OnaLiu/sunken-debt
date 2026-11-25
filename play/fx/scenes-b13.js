// 效果单的场面：第十三批「第一次（下）」（效果清单第 5 节）：F6、F7、F8、F9、F10（标志时刻 S5）。
// 接在 fx/scenes.js、fx/scenes-b7.js 后面载入，往 window.FX_SCENES 里加这一批（F7 原来在第二批只做了“按原因四种声音”，这一批接着做，替换掉原来那一条）。
// “第一次”只放一次（游戏里记在 lessons.seen）：别的条目摆场面时先把这几样记成看过了，放的是平常的样子；
// 这一批的条目再清掉自己那一条，放的就是第一次。改前的版本没有 lessons，这几行什么也不做，场面照样能跑。
(() => {
  const F = window.FX_SCENES; if (!F) return;
  const { S, P } = F;
  const api = () => window.__api, G = () => window.__game;

  const FIRSTS = ['F6', 'F7:key', 'F7:busy', 'F7:reach', 'F7:fuel', 'F8', 'F9', 'F10'];
  const seen = () => { const g = G(); return g && g.lessons ? g.lessons.seen : null; };
  const fresh0 = S.fresh;
  S.fresh = function (...a) { const g = fresh0.apply(this, a); const s = seen(); if (s) for (const k of FIRSTS) s.add(k); return g; };
  // 这几样当作还没见过（演示里、玩家手里两本账都清掉：F1–F10 记在同一本 __api.firsts 里）
  const firstOf = (...keys) => { const f = api().firsts; if (f) { f.reset(...keys); return; } const s = seen(); if (s) for (const k of keys) s.delete(k); };

  // 沉船货舱（和第一批 C6 同一处）：停船、切到作业、对准落点、等吊臂到位；不新开一趟
  const WRECK = [286, 24.5, 0.2, 294.6, 27.05];
  const toWreckNet = () => { const g = G(); S.place(WRECK[0], WRECK[1], WRECK[2]); S.sim(0.5); g.setMode('work'); g.setAimWorld(WRECK[3], WRECK[4]); S.sim(3.2); return S.drop(); };
  // 冲洗快完（离确认还有 left 秒）
  const toConfirm = (left = 2.8) => S.until((g) => g.reveal.active && g.reveal.active.phase === 'wash' && g.reveal.active.washDur - g.reveal.active.washT < left, 60);
  // 先捞一网普通的（铁管那一处）收完：收获单上前面就有东西了
  const oneNet = () => {
    S.net(...P.tube);
    S.until((g) => !g.op && !g.reveal.busy && g.trip.items.length > 0, 90, (i, g) => ({ A: !!(g.reveal.active && g.reveal.active.phase === 'wash' && i % 15 === 0) }));
    S.sim(0.6);
  };
  // 空沙地下一网、等它落回甲板：作业镜头拉近一档、转到船尾这一边（玩家用滚轮和 Q/E 都做得到），倒泥、耸肩的人在画面里
  const sternNet = () => {
    const b = S.bareSand(); S.net(b[0], b[1]);
    const c = G().cam; c.distWork = 19; c.yaw = -2.6; c.pitch = 0.55; c.ease = null;
    S.toLanding(1.3);
  };
  // 码头北边的岸（和第七批 W3 同一处）：离撞上还有 sec 秒的地方，船头朝岸、v 米/秒
  const SHORE = { x: 20, z: -40.3, h: Math.PI };
  const toShore = (sec, v = 9.5) => { S.fresh(); S.place(SHORE.x, SHORE.z + v * sec, SHORE.h, v); return G(); };
  // 往沉船开：别处的现场都算看过了（沿路的不先抢），沉船还没看见；从西边 x0 处朝东开
  const toWreck = (x0, v = 8.5) => {
    const g = G();
    S.place(x0, 26.5, Math.PI / 2, v);
    for (const r of g.world.regions.values()) for (const s of r.sites) if (s.id !== 'wreck') g.known.sites[r.id + ':' + s.id] = 'near';
    S.sim(1 / 60, S.W);
    return g;
  };
  // 配乐打开（效果单平时把配乐关了，只听效果本身）：开头先放一个平常的和弦，后面那个和弦被换掉才听得出来
  const musicOn = (next = 0.6) => () => { const a = G().audio; if (!a) return; a.setMusic(api().settings.music || 1); if (a.music) a.music.next = next; };

  const batch13 = [
    {
      id: 'F6', name: '第一件珍品：收获单上亮出金色空位', tier: '最重 · 砸脸横幅（S1 全套 + 这一条）',
      when: '这一趟第一次捞上珍品（约 101 秒）：S1 的余波快走完时',
      feel: '就是这个！——这一趟的账上，有一个金色的位置是留给它的',
      watch: [
        '**S1 全套照旧**：憋住、抽声、爆发（褪色只留它、名字砸上来、镜头往下一顿）、余波（金边推开、颜色回来）、船员一起欢呼（C4–C9 都不动）',
        '**1.45 秒**：下面那条宽黑边里升起一条“收获单”——这一趟以前捞上来的几样暗暗地排着，最后一格是空着的金色虚框',
        '**1.7 秒**：金框一亮一亮地等着，很轻的两声玻璃似的高音',
        '**2.3 秒**：名字牌上落下一枚金签，划一道弧掉进去',
        '**2.95 秒**：这一格亮成金色、写上名字和价钱、往外一胀，火星溅开，“叮当”一声',
        '**拉回**：黑边收起时它跟着沉下去；第一件才有这一条（展示多停 0.9 秒给它），以后的珍品照常',
      ],
      variants: [
        { k: 'first', label: '第一件（前面已经捞过一网）', run: () => { S.fresh(); oneNet(); toWreckNet(); firstOf('F6'); toConfirm(2.8); return { dur: 9.5 }; } },
        { k: 'again', label: '对照：第二件起（平常的珍品）', expect: 'C6', run: () => { S.fresh(); oneNet(); toWreckNet(); toConfirm(2.8); return { dur: 8.5 }; } },
      ],
    },
    {
      id: 'F7', name: '第一次被拒：按原因不同的一声 + 一句为什么', tier: '轻 · 界面反馈',
      when: '每种原因的第一次：按了这时用不上的键、网还在水下又按下网、落点不行、油不够这一网',
      feel: '知道为什么不行（下次自己就明白了）',
      watch: [
        '**声音（第二批做的，照旧）**：按错键一下闷闷的“嗒”；网还在水下是绞车棘轮“咔哒”；落点不行是吊臂顶到头“哐”；油不够是空油桶敲两下；前方浅滩是测深仪“嘀——嘀”往下掉',
        '**第一次再加一句短字**：深红小牌和那一声同一帧冒出来、跟着抖一下，尾巴指着出问题的那样东西，2.8 秒后淡掉',
        '**网还在水下**：牌子挂在水面上网下去的那一点：“网还在水下 · 等它上来”',
        '**落点不行**：挂在落点圈上，说为什么、往哪挪：“这里太浅 · 往深处挪”“超过 28 米 · 往浅处挪”“压着自己的船 · 挪远一点”',
        '**油不够**：挂在油表下面，写出两个数：“这一网要 4.4 · 只剩 4.1”',
        '**按错键**：看现在在干什么——冲洗中“正在冲洗 · 空格 冲快点”、看收获时指着进度条“看完自动回到大景”、收工后等“再来一次”亮了指着按钮“这一趟收工了 · 空格 再来一次”、没有卡时按 C“没有要收的结果卡”',
        '**每种原因只写一次**：第二次起只响那一声（看“对照”）；前方浅滩不写字（W2 船员已经喊“浅了！”）',
      ],
      variants: [
        { k: 'key', label: '按错键（没有卡时按 C）', run: () => { S.fresh(); firstOf('F7:key'); S.placeFor(...P.tube); return { dur: 3.2, at: [[0.6, () => api().key('KeyC')]] }; } },
        { k: 'busy', label: '网还在水下又按下网', run: () => { S.fresh(); firstOf('F7:busy'); S.net(...P.tube); S.sim(0.4); return { dur: 3.4, at: [[0.6, () => api().key('Space')]] }; } },
        {
          k: 'reach', label: '落点不行（压在自己船上）',
          run: () => { S.fresh(); firstOf('F7:reach'); S.placeFor(...P.tube); S.work(); const b = G().boat; S.aim(b.x + 0.3, b.z + 1.5); return { dur: 3.4, at: [[0.6, () => api().key('Space')]] }; },
        },
        {
          k: 'fuel', label: '油不够这一网',
          run: () => { S.fresh(); firstOf('F7:fuel'); S.placeFor(...P.tube2); S.work(); const e = S.aim(...P.tube2); G().boat.fuel = Math.max(0.5, (e ? e.fuel : 3) - 0.3); S.sim(0.3); return { dur: 3.4, at: [[0.6, () => api().key('Space')]] }; },
        },
        {
          k: 'wash', label: '按错键（冲洗中按 Tab 换模式）',
          run: () => { S.fresh(); firstOf('F7:key'); S.net(...P.tube); S.until((g) => g.reveal.active && g.reveal.active.phase === 'wash' && g.reveal.active.washT > 1.2, 60); return { dur: 3.2, at: [[0.6, () => api().key('Tab')]] }; },
        },
        {
          k: 'end', label: '按错键（收工以后按 C）',
          // 收获单一拍一拍出来（第九批 C11）：等“再来一次”亮了再按（改前的版本没有这一拍，等满 1.2 秒就按）
          run: () => { S.fresh(); S.placeFor(...P.tube); G().endReq = true; S.until((g) => !!g.ended, 8); S.sim(1.2); S.until((g) => !g.settle || !!(g.hud && g.hud.el.haul && g.hud.el.haul.classList.contains('lit')), 20); firstOf('F7:key'); return { dur: 3.2, at: [[0.6, () => api().key('KeyC')]] }; },
        },
        {
          k: 'again', label: '对照：同一种原因按第二次（只响那一声）',
          run: () => { S.fresh(); firstOf('F7:reach'); S.placeFor(...P.tube); S.work(); const b = G().boat; S.aim(b.x + 0.3, b.z + 1.5); return { dur: 5.6, at: [[0.6, () => api().key('Space')], [3.6, () => api().key('Space')]] }; },
        },
        {
          k: 'shoal', label: '前方浅滩（开船逼近，不写字）',
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
      id: 'F8', name: '第一次搁浅：“船底刮到沙了”', tier: '重 · 撞飞',
      when: '这一页里第一次冲上浅滩',
      feel: '记住了（这里不能开）',
      watch: [
        '**W3 全套照旧**：闷撞、刮沙长声、船头一抬、镜头往前一冲、沙雾和水花、船员摔倒趔趄',
        '**0.28 秒**（镜头顿完、沙雾腾起来以后）：船头上方砸下一块沙色的厚牌子“船底刮到沙了”——从 1.5 倍大落到原大、回弹一下，落定时抖一下；尾巴指着船头刮到的地方，跟着船走',
        '**3.4 秒**后淡掉；底下照旧是“搁浅：倒车或转向”',
        '**只第一次**：以后再撞只有 W3（看“对照”）',
      ],
      variants: [
        { k: 'full', label: '第一次全速撞上', run: () => { toShore(1.3); firstOf('F8'); return { dur: 5.2, hold: [['KeyW', 0, 1.6]] }; } },
        { k: 'again', label: '对照：以后再撞（只有 W3）', expect: 'W3', run: () => { toShore(1.3); return { dur: 4.6, hold: [['KeyW', 0, 1.6]] }; } },
      ],
    },
    {
      id: 'F9', name: '第一次空网：船员耸肩，一句宽慰', tier: '轻 · 抹杀',
      when: '这一页里第一次收上来一张空网（不算碰了硬物收回来的那种）',
      feel: '不慌（空网是常事，再来一网）',
      watch: [
        '**空网照旧**：网倒出一摊泥水、结果卡写为什么空（C3）',
        '**0.35 秒**：离那摊泥最近、手上没活的船员站住，转过去看一眼，肩膀一耸、两只手往外一摊、头一歪',
        '**0.62 秒**（耸到顶）：鼻子里“嗯——”一声（往上挑再落），头上冒一句气泡：网口里没东西“没事，下一网！”；埋得太深“埋太深了，换一处”；压在边上“差一点，挪挪再来”',
        '**气泡**和“浅了！”同一种，边是海水的青（不是警告的红），2.5 秒后淡掉',
        '**只第一次**：以后的空网只有 C3（看“对照”）',
      ],
      variants: [
        { k: 'none', label: '第一次空网（浅滩旁的空沙地）', run: () => { S.fresh(); firstOf('F9'); sternNet(); return { dur: 5.4 }; } },
        { k: 'again', label: '对照：以后的空网', expect: 'C3', run: () => { S.fresh(); sternNet(); return { dur: 4.5 }; } },
      ],
    },
    {
      id: 'F10', name: '第一次看清沉船（S5）', tier: '重 · 标志时刻 S5',
      when: '这一页里第一次开到沉船跟前、看清它的那一刻（前面 6 秒是预兆和憋住，后面 6 秒是余波和余韵）',
      feel: '原来下面有这么大一个东西',
      watch: [
        '**预兆**（离它 78 米起，开着船）：测深仪自己弹出来，海底线上鼓起一个琥珀色的包，“嘀——咚”一下一下，越近包越高、回声越快；附近的鱼群掉头，都往沉船那边游',
        '**憋住**（48 米起）：船驶过坡顶，水往下暗——沉船那一片又暗又浑，只剩一团说不清的暗影，画面四角压暗；底下一层很低的音慢慢涨上来；镜头往前探、往下看一点',
        '**爆发**（34 米，看清）：`find` 照响，底下垫一声沉沉的“咚”和低低的五度；从沉船中间往外推开一圈清水，亮边扫过去，圈里反光收掉，深色的船壳就在里面；沿着船壳一串串气泡冒上来',
        '**爆发 0.35 秒**：名字从水里浮上来——“侧卧的木帆商船”，下面一行“船首朝岸 · 低舷向下坡”；镜头拉高往下看，把船和沉船一起框进来（一动视角就让回去）',
        '**余波 0.55 秒**：船长指过去，船员都走到靠沉船那一边的船舷，扶着栏杆往下看（船还在走，他们一直看着它）',
        '**余韵**：配乐的下一个和弦换成一个更低、更宽的（低 D 到高处摊开三个八度，左右分开），只这一次（效果单里这一条把配乐打开了）',
        '**只第一次**：以后看清它只有 B1（看“对照”）',
      ],
      variants: [
        { k: 'approach', label: '从远处开过去（全程）', run: () => { S.fresh(); firstOf('F10'); toWreck(206); return { dur: 15.5, hold: [['KeyW', 0, 6.4]], at: [[0.02, musicOn(0.6)]] }; } },
        { k: 'near', label: '从憋住开始（短）', run: () => { S.fresh(); firstOf('F10'); toWreck(232, 8); return { dur: 11, hold: [['KeyW', 0, 2.6]], at: [[0.02, musicOn(9)]] }; } },
        { k: 'again', label: '对照：以后看清（只有 B1）', expect: 'B1', run: () => { S.fresh(); toWreck(232, 8); return { dur: 7, hold: [['KeyW', 0, 2.6]] }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 13 }));

  // F7 原来在第二批（按原因四种声音），这一批接着做：换成这一条
  F.entries = F.entries.filter((e) => !batch13.some((b) => b.id === e.id)).concat(batch13);
  F.batches.push({
    n: 13, title: '第十三批 · 第一次（下）', sub: '5 个编号：第一件珍品、第一次被拒、第一次搁浅、第一次空网、第一次看清沉船（S5）——都只放一次，比平常高一档',
    fixes: [
      ['F6', '第一件珍品：S1 全套之后，黑边里升起收获单，金签落进一格金色空位'],
      ['F7', '第一次被拒：每种原因第一次在出问题的地方写一句为什么（声音照旧按原因分开）'],
      ['F8', '第一次搁浅：W3 全套之后，船头上方砸下一块沙色牌子“船底刮到沙了”'],
      ['F9', '第一次空网：最近的船员耸肩“嗯——”，头上一句宽慰'],
      ['F10', '第一次看清沉船（S5）：测深仪鼓包、鱼群往一边游 → 水变暗 → 清水推开、船壳浮现、名字浮上来 → 船员走到船舷 → 一个更低更宽的和弦'],
    ],
  });
  F.batches.sort((a, b) => a.n - b.n);
})();
