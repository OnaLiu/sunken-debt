// 效果单的场面：第十批「界面」（效果清单第 5 节）：A8、B22、B23、D2、D3、D4。
// 接在 fx/scenes.js、fx/scenes-b7.js 后面载入，往 window.FX_SCENES 里加这一批（B22、B23 原来在第二批，这一批接着做，替换掉原来那两条）。
// 摆场面只用游戏本来就有的接口（__api.sim 快进、__api.key 按键、__game 的状态、界面上的按钮），改前的版本上也能跑。
(() => {
  const F = window.FX_SCENES; if (!F) return;
  const { S, P } = F;
  const api = () => window.__api, G = () => window.__game;
  const hudRoot = () => document.getElementById('hud');
  const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };

  // 上一条放完可能停在暂停、设置开着、F1 收着界面：新开一趟前先收拾干净（不出声、不记标签），设置改过的放回去
  let savedSettings = null;
  const tidy = () => {
    const g = G(), h = api().hud, a = api().audio;
    for (const m of document.querySelectorAll('#hud .modal.sub')) m.remove();
    if (g && g.paused) { g.paused = false; if (h.hidePause) h.hidePause(true); }
    if (a) { clearTimeout(a.holdT); if (a.muffle) a.muffle(false, true); a.awake = false; }
    hudRoot().classList.remove('hidden-hud', 'hud-back', 'peek', 'paused');
    document.getElementById('stage').classList.remove('held', 'peek');
    if (savedSettings) { Object.assign(api().settings, savedSettings); savedSettings = null; api().applySettings(); }
  };
  // 关掉效果单时设置还是场面里改过的样子：放回去（设置存在本地，正式的游戏也读它）
  addEventListener('pagehide', () => { if (savedSettings) { Object.assign(api().settings, savedSettings); savedSettings = null; api().applySettings(); } });
  const fresh0 = S.fresh;
  S.fresh = () => { tidy(); return fresh0(); };

  // 结果卡：几张捞上来过的（名字和价钱都是这片海里有的东西）
  const LOOT = [['铜信筒', 55], ['锻铁锚', 95], ['盐釉陶壶', 38], ['青瓷碗', 24], ['封蜡罐', 61]];
  const deal = async (X, n) => {
    S.fresh(); S.placeFor(...P.tube); S.sim(0.6);
    for (let i = 0; i < n; i++) G().addCard({ kind: 'catch', title: LOOT[i][0], total: LOOT[i][1] });
    await X.waitFor(() => false, 2200); // 卡片发完（真实时间）
    // 这几张是摆出来的、没有真的进舱：这一趟的合计平时几秒后自己收起，这里先收起来
    const h = api().hud; clearTimeout(h.tallyT); h.el.tally.classList.add('tuck');
  };
  const card = (i) => document.querySelectorAll('#hud .rcard')[i];

  // 设置：从暂停菜单里打开；拖一根滑杆（每帧推一点，像手指在拖）
  const openSettings = () => { const b = document.querySelector('#hud .mcard.pause button[data-a="settings"]'); if (b) b.click(); };
  const slider = (k) => document.querySelector(`#hud .settings [data-k="${k}"]`);
  const setVal = (el, v) => {
    const st = Number(el.step) || 0.05;
    const q = Math.round(v / st) * st;
    if (Math.abs(Number(el.value) - q) < 1e-6) return;
    el.value = q; el.dispatchEvent(new Event('input', { bubbles: true }));
    // 效果单的声音开关关着：拖音量不把声音拧回来
    const stg = window.__stage; if (stg && !stg.st.sound && api().audio) api().audio.setVolume(0);
  };
  // path：[[第几秒, 数值], …]，在两点之间平滑地拖过去。暂停中游戏时间不走（场面的 frame 不推），
  // 所以拖动自己按（虚拟）时钟一帧一帧走：返回放进 at 的一项，到第一个点的时候按下，最后一个点松开
  const drag = (k, path) => {
    const t0 = path[0][0], t1 = path[path.length - 1][0];
    return [t0, () => {
      const el = slider(k); if (!el) return;
      const stg = window.__stage, seq = stg ? stg.st.seq : 0, s0 = performance.now() / 1000 - t0;
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const step = () => {
        if (!el.isConnected || (stg && stg.st.seq !== seq)) return;
        const t = Math.min(t1, performance.now() / 1000 - s0);
        let v = path[0][1];
        for (let i = 1; i < path.length; i++) if (t >= path[i - 1][0]) { const [a, va] = path[i - 1], [b, vb] = path[i]; v = va + (vb - va) * smooth((t - a) / (b - a)); }
        setVal(el, v);
        if (t >= t1) { dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }];
  };
  // 一场设置：开船、暂停、打开设置，记下原来的设置（放完、下一条开始前放回去）
  const settingsScene = (k, v0) => {
    S.fresh(); S.place(214, 4, 0.9); S.sim(0.6);
    savedSettings = { ...api().settings };
    if (k) { api().settings[k] = v0; api().applySettings(); }
  };

  // 回波：开过一段约 9 米深的水（从码头往浅滩去的路上）：7.6 米 → 9–9.7 米（约 30 米长）→ 再浅回 5 米
  const SAIL9 = [67.5, -6.9, Math.atan2(0.991, 0.137)];
  const school = (id) => { for (const r of G().world.regions.values()) for (const c of r.creatures) if (c.id === id) return c; return null; };

  const batch10 = [
    {
      id: 'A8', name: '测深面板', tier: '轻 · 界面反馈', kind: '界面反馈',
      when: '靠近残骸、作业时：左下的回波屏和下面中间的作业栏',
      feel: '知道下面多深、有没有东西在动（面板稳稳停着，只有曲线在走）',
      before: '测深面板一趟进、出各 12 次，作业栏各 9 次（演示三趟量的，`tools/fx-summary.txt`）：开船时深一点浅一点就进出一次，每下一网作业栏收起又弹回，屏幕边上一直在动。曲线一格一格地跳，34 米一屏，3 米的浅滩只是顶上一条线。',
      watch: [
        '**进作业**：回波屏从左边飞进来以后，像老式荧光屏开机——先亮一道横线，再上下张开，闪一下',
        '**一直在**：屏上面一排读数“水深 **8.4** m”，数字跟着平滑地滚；硬底（礁石、沉船）时数字变成金色',
        '**曲线**：不再一格一格跳，平平地往左走；最新的一列一直接到右边那道正在写的亮线上',
        '**自动量程**：刻度跟着脚下的水深放大缩小（10–34 米，慢慢换过去）：3 米的浅滩占满半屏，网下去再上来是一道清楚的“U”；作业极限的红线在量程里才画',
        '**有东西在动**：像真的测深仪，声波是往下张开的锥，锥里每条鱼回一个斜着量的距离——一条鱼游过正下方是一道拱，一群鱼是一团闪着的点（有的回来、有的没回来）',
        '**下网**：作业栏**不收起**——这一网的深度和油淡下去，“下网”键换成“网在水下 · 6 秒”和一根进度条；回波屏上网是一条白线和一个点往下走',
        '**网回甲板**：“下网”键弹回来；回波屏、作业栏都没动过',
        '**开船**：深过 9 米才出来，浅过 7 米、再过 5 秒才走（两个门槛错开，深浅来回晃也不会一会儿进一会儿出）',
        '**一趟下来**：回波屏进、出各 3 次，作业栏各 5 次（原来 12 次、9 次；剩下的都是换作业、换航行那一下）',
      ],
      variants: [
        { k: 'drop', label: '进作业、下一网（从头到网回甲板）', run: () => {
          S.fresh(); S.placeFor(...P.tube); S.sim(0.6);
          return { dur: 15, at: [[0.5, () => api().key('Tab')], [0.62, () => G().setAimWorld(...P.tube)], [2.6, () => api().key('Space')]] };
        } },
        { k: 'sail', label: '开过一段 9 米上下的水', run: () => {
          S.fresh(); S.place(SAIL9[0], SAIL9[1], SAIL9[2], 6); S.sim(0.3, S.W);
          return { dur: 13, hold: [['KeyW', 0, 13]] };
        } },
        { k: 'fish', label: '鱼群从网口下面游过（一团闪着的点）', run: () => {
          S.fresh();
          const c = school('r1:f2'); let [cx, cz] = c ? c.center() : [283.9, 33.1];
          S.placeFor(cx, cz); S.sim(0.5);
          // 开着船停在鱼群旁边（这里 9.8 米，开船时回波屏也亮）；对准鱼群 4 秒以后会到的地方（量一下它往哪儿游），
          // 放的 8 秒里它从网口下面整个游过去
          if (c) { const [x0, z0] = c.center(); S.sim(0.5); const [x1, z1] = c.center(); cx = x1 + (x1 - x0) * 9; cz = z1 + (z1 - z0) * 9; }
          // 摆场面的这一秒里回波屏已经先亮了（那时不记标签）：先收起来、清掉这一秒的曲线，放的时候从刚开进深水、屏亮起来那一下开始
          const h = G().hud; h.el.sounderWrap.classList.add('tuck'); h.sounderData = []; h.depthShow = null; h.deepSail = false;
          return { dur: 8.5, at: [[0.4, () => api().key('Tab')], [0.55, () => G().setAimWorld(cx, cz)]] };
        } },
      ],
    },
    {
      id: 'B22', name: '点掉卡片', tier: '轻 · 界面反馈', kind: '界面反馈',
      when: '按 C（或点卡片上的 ×）收起右边的结果卡',
      feel: '清爽：一下就没了，下面的自己补上来',
      before: '卡片原地往右淡出去，下面的卡一下跳上来（没有过渡）；收卡的声音已经拆成自己的一声（一趟 5 次）。',
      watch: [
        '**点下去**：卡片先往左一缩（像手指按住铜牌往回带了一下），亮一下',
        '**甩出去**：再往右一弹，越走越快、微微转一点，一道亮光从左到右扫过牌面，0.36 秒没了；声音“唰——叮”偏在右边',
        '**补上来**：下面的卡、“+N”、这一趟的合计从原来的位置滑上去补空位，到位时稍微过一点再回来',
        '**叠着的**：收掉一张，“+N”里折着的那张从上面落下来补进第三张的位置，“+N”的数跳一下',
        '**全收**：点“+N”，几张一张接一张往右甩出去（相隔 45 毫秒）',
        '**另两声**（原来这一条拆出来的）：切回航行是车钟手柄“咔”一下；标题上下选是轻轻一“嗒”',
      ],
      variants: [
        { k: 'stack', label: '四张叠着，一张一张收', run: async (X) => {
          await deal(X, 4);
          return { dur: 4.2, at: [[0.6, () => api().key('KeyC')], [1.8, () => { const c = card(1); if (c) c.click(); }], [3.0, () => api().key('KeyC')]] };
        } },
        { k: 'all', label: '点“+N”一次全收', run: async (X) => {
          await deal(X, 5);
          return { dur: 2.6, at: [[0.7, () => { const m = document.querySelector('#hud .more'); if (m) m.click(); }]] };
        } },
        { k: 'dismiss', label: '揭晓完按 C 收起这一网的卡', run: () => { S.fresh(); S.net(...P.tube); S.toPhase('show', 0.1); S.sim(2.5); return { dur: 2.6, at: [[0.7, () => api().key('KeyC')]] }; } },
        { k: 'sail', label: '按 Tab 切回航行（拆出来的一声）', run: () => { S.fresh(); S.placeFor(...P.tube); S.work(); S.sim(1); return { dur: 2.4, at: [[0.7, () => api().key('Tab')]] }; } },
        { k: 'title', label: '标题上下选（拆出来的一声）', title: true, run: () => ({ dur: 3, hold: [['ArrowDown', 0.5, 0.65], ['ArrowDown', 1.2, 1.35], ['ArrowUp', 2.0, 2.15]] }) },
      ],
    },
    {
      id: 'B23', name: '看宝的黑边', tier: '轻 · 进场', kind: '进场',
      when: '网包落甲板前约 1 秒到拉回：近景里上下两道黑边',
      feel: '进入“看宝”的时间：像幕布拉开，这一段是专门用来看的',
      before: '普通的一网上下各 30 像素的细边、珍品 92 像素；黑边就是两块黑条一下长出来、一下缩回去，边上一道死的暗金线，和画面之间是硬边。',
      watch: [
        '**推进来**：和镜头一起，0.55 秒慢下来停稳（不是匀速），黑边往画面里投一层淡淡的影子，硬边没了',
        '**细线**：黑边里侧一条黄铜细线从正中往两边描出去（晚 0.2 秒开始，0.75 秒描完），两头渐隐',
        '**珍品**：落包时黑边再慢慢加宽到 92 像素（0.85 秒），细线变成金的、粗一倍、发光——先细后宽，像预告',
        '**拉回**：细线先收回正中、淡掉，黑边 0.36 秒加速退出去（比进来快），界面回来',
      ],
      variants: [
        { k: 'normal', label: '普通的一网', run: () => { S.fresh(); S.net(...P.tube); S.toLanding(1.4); return { dur: 11 }; } },
        { k: 'precious', label: '珍品的一网', run: () => { S.fresh(); S.net(...P.rel); S.toLanding(1.4); return { dur: 13 }; } },
        { k: 'exit', label: '拉回（黑边退出去）', run: () => { S.fresh(); S.net(...P.tube); S.toPhase('show', 1.8); return { dur: 4.2 }; } },
      ],
    },
    {
      id: 'D2', name: '暂停', tier: '轻 · 界面反馈', kind: '界面反馈',
      when: '按 Esc（或 P）暂停，再按一下继续',
      feel: '世界停住了：画面和声音一起停下来，菜单浮在上面',
      before: '一层暗幕一下盖上（0.18 秒淡入），暂停卡直接出现；声音一下断掉；继续时卡片往下掉一下，暗幕一下没了。',
      watch: [
        '**停住**：海面、船、船员当场停住；画面 0.45 秒里压暗、褪掉大半颜色（只褪画面，界面上的字不褪）',
        '**声音**：黄铜表盖“嗒”地合上、一声往下沉的低音；正在响的绞车、水管、风浪 0.3 秒里闷下去（像隔了一层水）再停',
        '**卡片升起**：暗幕比原来轻，卡片从下面 48 像素升上来、稍微过一点再停稳；标题和四个按钮一个接一个从左边滑进来',
        '**继续**：表盖弹开“嗒”、低音往上一提；卡片往下滑走，暗幕 0.26 秒淡开，颜色回来，闷住的声音打开，世界接着动',
      ],
      variants: [
        { k: 'op', label: '网正往上绞的时候暂停', run: () => {
          S.fresh(); S.net(...P.tube); S.until((g) => g.op && g.op.state === 'lifting', 30); S.sim(0.4);
          return { dur: 5.4, at: [[0.8, () => api().key('Escape')], [3.6, () => api().key('Escape')]] };
        } },
        { k: 'sail', label: '开着船暂停', run: () => {
          S.fresh(); S.place(214, 4, 0.9, 7); S.sim(0.5, S.W);
          return { dur: 5.2, hold: [['KeyW', 0, 5.2]], at: [[0.9, () => api().key('Escape')], [3.5, () => api().key('Escape')]] };
        } },
        { k: 'wash', label: '冲洗的时候暂停（水管声闷下去）', run: () => {
          S.fresh(); S.net(...P.tube); S.toPhase('wash', 3.2);
          return { dur: 5, at: [[0.7, () => api().key('Escape')], [3.2, () => api().key('Escape')]] };
        } },
      ],
    },
    {
      id: 'D3', name: '设置里拖滑杆', tier: '轻 · 界面反馈', kind: '界面反馈',
      when: '暂停 → 设置，拖“水面晃动”、换“像素颗粒”、拖音量和配乐',
      feel: '调了立刻看得到、听得到',
      before: '设置卡和暗幕一直挡在海面前面；暂停时海面是停着的，拖“水面晃动”看不出变化；拖音量、配乐听不到（暂停时声音挂着）。滑杆的槽不分已填和未填。',
      watch: [
        '**按下滑杆**：暗幕、设置卡、背后的暂停卡一起让开，只留正在调的那一行（变成一块小铭牌）；画面颜色回来',
        '**水面晃动**：暂停中只有水面这一层接着动——拖小，水面慢慢平下去；拖大，晃起来、亮点多起来；一边拖一边有一小阵水声，越晃越响',
        '**像素颗粒、描边**：换一下，设置让开 1.5 秒给你看清楚，再回来',
        '**音量**：每动一下一声轻轻的铜“嗒”，响度就是新的音量；**配乐**：一小段和弦（配乐拖到 0 就听不见）',
        '**滑杆**：槽里已填的一段是黄铜色；数值每变一下跳一跳；松手半秒后设置回来',
      ],
      variants: [
        { k: 'wave', label: '拖“水面晃动”', run: () => {
          settingsScene('wave', 0.6);
          return { dur: 7.5, at: [[0.3, () => api().key('Escape')], [1.0, openSettings], drag('wave', [[2.0, 0.6], [3.4, 0], [5.4, 1], [6.2, 0.75]])] };
        } },
        { k: 'pixel', label: '换“像素颗粒”', run: () => {
          settingsScene('pixel', 1);
          const pick = (v) => () => { const el = slider('pixel'); if (el) { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); } };
          return { dur: 7, at: [[0.3, () => api().key('Escape')], [1.0, openSettings], [2.0, pick(3)], [3.8, pick(2)], [5.6, pick(1)]] };
        } },
        { k: 'volume', label: '拖音量、配乐', run: () => {
          settingsScene();
          const v = api().settings.volume ?? 0.8, m = api().settings.music ?? 0.5;
          return { dur: 8.4, at: [[0.3, () => api().key('Escape')], [1.0, openSettings], drag('volume', [[2.0, v], [3.2, 0.15], [4.4, 1], [5.0, v]]), drag('music', [[5.8, m], [6.6, 1], [7.6, 0.2]])] };
        } },
      ],
    },
    {
      id: 'D4', name: 'F1 隐藏界面', tier: '轻 · 界面反馈', kind: '界面反馈',
      when: '按 F1 收起界面，再按一下放出来',
      feel: '干净地看海；放回来时知道它们回到哪里',
      before: '面板、世界标记、揭宝铭牌的透明度一下变 0（面板 0.35 秒渐变，世界标记和瞄准圈一下就没了）；收起以后没有任何提示怎么放回来；新的一趟要按两下才出来。',
      watch: [
        '**收起**：四边的面板各自往自己那条边退 26 像素、淡掉；世界上的标记、网口的瞄准圈、揭宝铭牌一起 0.3 秒淡掉；很轻的一口气往下落',
        '**干净**：左下角一枚很淡的小牌“F1 显示界面”，两秒后自己淡掉',
        '**放出来**：面板从各自那条边滑回来，左、右、下错开 50 毫秒，到位时稍微过一点；一口气往上提，末了一下细细的“嗒”',
        '**新的一趟**：收着界面开始新的一趟，界面自己回来（原来要按两下）',
      ],
      variants: [
        { k: 'work', label: '作业中（瞄准圈、作业栏、回波屏）', run: () => { S.fresh(); S.placeFor(...P.tube); S.work(); S.aim(...P.tube, 2); return { dur: 5.6, at: [[0.7, () => api().key('F1')], [3.6, () => api().key('F1')]] }; } },
        { k: 'sail', label: '开船（世界上的标记）', run: () => {
          S.fresh(); S.place(262, 14, 0.75, 6); S.sim(0.5, S.W);
          return { dur: 5.6, hold: [['KeyW', 0, 5.6]], at: [[0.8, () => api().key('F1')], [3.8, () => api().key('F1')]] };
        } },
        { k: 'reveal', label: '揭宝铭牌亮着的时候', run: () => { S.fresh(); S.net(...P.tube); S.toPhase('show', 9); return { dur: 4, at: [[0.5, () => api().key('F1')], [2.3, () => api().key('F1')]] }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 10 }));

  // B22、B23 原来在第二批（界面一声拆开、黑边变细），这一批接着做，替换成新的那两条
  F.entries = F.entries.filter((e) => !batch10.some((b) => b.id === e.id)).concat(batch10);
  const b2 = F.batches.find((b) => b.n === 2);
  if (b2 && !/B22、B23 挪到第十批/.test(b2.sub)) b2.sub = b2.sub.replace(/接着做）$/, '接着做；B22、B23 挪到第十批）');
  F.batches.push({
    n: 10, title: '第十批 · 界面', sub: '6 个编号：测深面板和作业栏稳住、点掉卡片、看宝的黑边、暂停、设置里拖滑杆、F1 隐藏界面',
    fixes: [
      ['A8', '测深面板和作业栏一趟里稳稳停着（下网不收作业栏，换成“网在水下”的进度）；曲线平滑地走，鱼群是一串小拱，上面一排读数'],
      ['B22', '点掉卡片：往回一缩、往右一弹带一道亮光，下面的滑上来补空位，全收一张接一张'],
      ['B23', '看宝的黑边：慢下来停稳、投一层淡影，黄铜细线从正中描出去；珍品变金加宽；拉回时线先收、黑边快退'],
      ['D2', '暂停：画面压暗褪色、声音闷下去再停，卡片升起、按钮一个接一个；继续时反过来'],
      ['D3', '设置里拖滑杆：设置让开只留那一行，暂停中水面照样动，音量和配乐拖的时候听得见'],
      ['D4', 'F1：面板往各自的边退、标记和瞄准圈淡掉、角上一枚淡淡的提示；放回来错开滑回'],
    ],
  });
  F.batches.sort((a, b) => a.n - b.n);
})();
