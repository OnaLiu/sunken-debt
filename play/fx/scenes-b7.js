// 效果单的场面：第七批「逼近的威胁」（效果清单第 5 节）：W2、W3、W4、W5、W6。
// 接在 fx/scenes.js 后面载入，往 window.FX_SCENES 里加这一批（W5 原来在第二批，这一批重做，替换掉原来那一条）。
// 摆场面只用游戏本来就有的接口（__api.sim 快进、__game 的状态、setAimWorld、debugCam），改前的版本上也能跑。
(() => {
  const F = window.FX_SCENES; if (!F) return;
  const { S, P } = F;
  const api = () => window.__api, G = () => window.__game;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = (u) => u * u * (3 - 2 * u);

  // 码头北边的岸：船头朝 −z 开过去，船中心到 z ≈ −40.3 时船头撞上浅滩（全速 9.5 米/秒）
  const SHORE = { x: 20, z: -40.3, h: Math.PI };
  // 离撞上还有 sec 秒（按 v 米/秒匀速算）的位置开始
  const toShore = (sec, v = 9.5) => { S.fresh(); S.place(SHORE.x, SHORE.z + v * sec, SHORE.h, v); return G(); };
  // 埋着的硬物（落点 P.hazard 旁边那一件）
  const hazardObj = () => { const o = G().world.obstaclesNear(P.hazard[0], P.hazard[1], 4); return o && o[0]; };
  // 摆好作业：落点从镜头这一边离硬物 gap 米（网口边到它）的地方开始，返回朝硬物挪的起点、终点
  const hazardAim = (gap, over = 0.35) => {
    S.fresh(); S.placeFor(...P.hazard); S.work();
    const g = G(), o = hazardObj();
    S.aim(P.hazard[0], P.hazard[1], 0.3);
    // 镜头朝向（水平）：落点从镜头这一边往里挪，三角在网口圈的上方、不被底下的作业栏挡住
    const cam = g.view.camera, f = cam.position.clone(); cam.getWorldDirection(f); f.y = 0; f.normalize();
    const R = 1.35 + o.r * 0.4;
    const a = [o.x - f.x * (R + gap), o.z - f.z * (R + gap)], b = [o.x - f.x * (R - over), o.z - f.z * (R - over)];
    S.aim(a[0], a[1], 2.2);
    return { a, b, o };
  };

  const batch7 = [
    {
      id: 'W2', name: '浅滩逼近', tier: '中 · 倒计时冲锋',
      when: '开船冲向岸边浅水：按现在的船速还有约 3 秒、1.5 秒撞上',
      feel: '别再往前了（一级比一级急，退回去它也跟着退）',
      watch: [
        '**远**（3 秒以外）：不提示',
        '**近**（约 3.2 秒）：测深仪先“嘀——嘀”往下掉一声（F7 拆出来的那一声），船头前方水面一道细的**黄色**虚线弧；之后一下一下地“嘀”，越近越急越亮；船员从船头往后一个接一个扭头看过去；镜头往船头前面多带几米，把弧和岸放进画面',
        '**再近**（约 1.5 秒）：弧变**红**、变粗、两道，前后抖（约 7 下/秒），刚变红那一下张开一点；“嘀”连成一串，耳边心跳加快（每秒约 2.6 下）；离船头最近的人探身一手拢在嘴边、一手指着前面喊，头上一句“浅了！”',
        '**退回去**：倒车、减速时按新的船速重算，红退回黄、黄退掉（从红退回黄要多退 0.3 秒，不在边上来回跳）',
        '**改前**：一道红色虚线弧加“浅水”标签，从出现到撞上一直一个颜色；只在第一次出现时响一声；约 2.6 秒前出现',
      ],
      variants: [
        { k: 'rush', label: '一路冲上去（全速）', run: () => { toShore(4.7); return { dur: 6.4, hold: [['KeyW', 0, 4.8]] }; } },
        { k: 'reverse', label: '冲到一半倒车', run: () => { toShore(4.7); return { dur: 6.5, hold: [['KeyW', 0, 2.5], ['KeyS', 2.5, 6.5]] }; } },
      ],
    },
    {
      id: 'W3', name: '撞上浅滩', tier: '重 · 撞飞',
      when: '船头冲上浅滩的那一刻',
      feel: '结结实实撞了一下',
      watch: [
        '**同一帧**：船底一声闷撞，紧跟着刮沙长长的“嘎——”（一顿一顿地越刮越慢、越刮越低，船身木头吱一声），船头的水“哗”地涌起来',
        '**船**：撞的那一头往上一抬（0.14 秒到顶），往一边歪一点，再落回去晃两下，约 2 秒稳住；船员两个摔倒、其余趔趄、扶栏杆（原来就有）',
        '**镜头**：顺着船撞上去的方向往前一冲、弹回（最多 15 像素，不往下沉——全清单唯一往下沉的大震留给珍品确认 C6）',
        '**沙**：船头底下翻出一团浓的，船底两侧一路腾起发浑的泥沙往外摊，水面上几大片浑水，十秒左右慢慢散掉；船头扑起一片白水花',
        '**慢慢蹭上去**：声音小一些、短一些，船只抬一点，镜头不冲；撞过又顶上去只再刮一小声',
        '**改前**：船员 2 个摔倒、3 个趔趄，船停住；没有声音，没有震屏，没有沙雾',
      ],
      variants: [
        { k: 'full', label: '全速撞上', run: () => { toShore(1.3); return { dur: 4.6, hold: [['KeyW', 0, 1.6]] }; } },
        {
          k: 'slow', label: '半速蹭上去', run: () => {
            // 像推着半个油门：撞上以前一直 4.3 米/秒，撞上以后放手
            toShore(2.3, 4.3); let hit = false;
            return { dur: 5, frame: () => { const b = G().boat; if (hit || b.grounded || b.speed < 0.5) hit = true; else b.speed = 4.3; } };
          },
        },
      ],
    },
    {
      id: 'W4', name: '落点下有埋着的硬物', tier: '轻 · 界面反馈',
      when: '作业瞄准时，网口挪近、压上埋着的硬物',
      feel: '这里有风险（三角先醒过来，压上那一下跳起来）',
      watch: [
        '**靠近**（网口边离它不到 2.2 米）：硬物上那枚红三角醒过来，变大一点、轻轻跳一下，很轻的一声“嗒”',
        '**压上**（网口罩到它，和闭网时咬不咬得到同一个判定）：三角猛地跳起来、放大再落回，外面一圈红光；网口圈朝它的那一段从中间往两边变红，圈边上也挂一枚红三角（硬物三角被面板挡住也看得见）；“嗒”加一声低音',
        '**压着不动**：三角慢慢一胀一缩、红光跟着呼吸；挪开就退回去（不响）',
        '**改前**：有红三角，移近时没有变化',
      ],
      variants: [
        {
          k: 'approach', label: '落点慢慢挪过去', run: () => {
            const { a, b } = hazardAim(3.2);
            return { dur: 5.5, frame: (dt, t) => { const u = ease(clamp((t - 0.4) / 3.0, 0, 1)); G().setAimWorld(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); } };
          },
        },
        {
          k: 'jump', label: '一下点到硬物上', run: () => {
            const { b } = hazardAim(3.2);
            return { dur: 3.5, at: [[0.8, () => G().setAimWorld(b[0], b[1])]] };
          },
        },
      ],
    },
    {
      id: 'W5', name: '网碰到埋着的硬物', tier: '中 · 撞飞',
      when: '网触底、网口收紧时咬到埋在沙里的硬物，网自己往回收',
      feel: '糟，卡住了',
      watch: [
        '**咬住**（网口收到一半，触底后 0.42 秒）：隔着水一声闷闷的金属“咣”加缆绳一紧（`snag`），跟着缆绳嗡地一颤（`twang`，低低地抖着弱下去）；底部一行字“碰到埋着的硬物：网自动收回”',
        '**缆绳一抖**：整根缆像被拨了的弦横着抖（基频加一点二次谐波），约 1.3 秒抖停；抖下一串气泡',
        '**同时**：网口卡在半张、抖两下；网架往上一蹿、朝硬物那边一歪，又被拽回去晃几下；吊臂臂端被拽得一点头、船往吊臂那边一沉；硬物那里翻出一股黑泥和一串气泡',
        '**往回收**：卡 0.4 秒后绞车一下子把网拽回来（不再憋劲慢提），网口半张着；网架回到甲板是铁架子“哐啷”几下（`netBack`），不撒泥',
        '**改前**：咬到时 `snag` 一声加那行字，网照常慢慢提起；缆绳一抖的画面没有',
      ],
      variants: [
        {
          k: 'snag', label: '水下咬到硬物', run: () => {
            S.fresh(); S.net(...P.hazard);
            // 镜头拉近、往下看：网架在画面中间，缆从上面垂下来
            const g = G(); g.cam.ease = null; g.cam.pitch = 0.95; g.cam.distWork = 14;
            S.until((g) => g.op && g.op.state === 'lowering' && g.op.y - (g.op.T + 1.05) < 0.9, 30);
            return { dur: 4.2 };
          },
        },
        { k: 'back', label: '网收回甲板', run: () => { S.fresh(); S.net(...P.hazard); S.toLanding(1.3); return { dur: 4.5 }; } },
      ],
    },
    {
      id: 'W6', name: '蟹要走了', tier: '轻 · 新',
      when: '蟹停在封蜡罐上翻泥，快要走了（停 11 秒的最后几秒）',
      feel: '抓紧，它要走了（不加界面，只在海底看得见）',
      watch: [
        '**还剩 4.4 秒**：翻泥冒的泥团开始变少、变小，两螯铲得越来越没劲，还剩 1.4 秒时停下',
        '**还剩 3.4 秒**：两根触角开始一下一下地抖（隔 0.07–0.2 秒猛地一弹，末节像鞭梢甩），越抖越急；眼柄四下张望，转得越来越快',
        '**还剩 1.1 秒**：身子抬起来、两螯收到身前，慢慢转向下一处，然后才横着走开',
        '**改前**：蟹的走、停、躲之间没有前兆，铲着泥直接走',
      ],
      variants: [
        {
          k: 'leave', label: '停在封蜡罐上的蟹（近看）', run: () => {
            S.fresh(); const g = G();
            let c = null; for (const r of g.world.regions.values()) for (const q of r.creatures) if (q.id === 'r1:c1') c = q;
            const p = c.route[0];
            S.place(p.x - 9, p.z + 1, 0.2); S.sim(0.3);
            // 斜着朝镜头（四分之三侧面，看得见触角和眼柄），最后转身朝下一处走开
            c.mode = 'dwell'; c.leg = 0; c.x = p.x; c.z = p.z; c.yaw = Math.atan2(-1.6, 1.9) + 0.95; c.t = p.dwell - 5.4; c.tuck = 0; p.dug = true;
            const y = g.world.surfaceTop(p.x, p.z);
            g.debugCam = { pos: g.cam.pos.clone().set(p.x - 1.6, y + 1.35, p.z + 1.9), look: g.cam.pos.clone().set(p.x + 0.15, y + 0.12, p.z) };
            S.sim(0.4);
            return { dur: 7.5 };
          },
        },
      ],
    },
  ].map((e) => ({ ...e, batch: 7 }));

  // W5 原来在第二批（一声多用拆开）；这一批重做，替换成新的那一条
  F.entries = F.entries.filter((e) => !batch7.some((b) => b.id === e.id)).concat(batch7);
  F.batches.push({
    n: 7, title: '第七批 · 逼近的威胁', sub: '5 个编号：浅滩逼近和撞上、落点下的硬物、网咬到硬物、蟹要走',
    fixes: [
      ['W2', '浅滩逼近：远不提示 → 近（黄弧、嘀声、船员扭头）→ 再近（红、粗、抖，心跳加快，“浅了！”）'],
      ['W3', '撞上浅滩：刮沙长声、船头一抬、镜头往前一冲（不和 C6 抢）、沙雾和水花'],
      ['W4', '落点下的硬物：靠近时三角醒过来，压上时跳起来、网口圈那一段变红'],
      ['W5', '网咬到硬物：缆绳像弦一样抖、吊臂被拽、网自己猛地拽回来'],
      ['W6', '蟹要走了：泥团变少、触角越抖越急、抬身转向，然后才走'],
    ],
  });
  // 批次按编号排好（第八批在 scenes.js 里，比这一批先载入）
  F.batches.sort((a, b) => a.n - b.n);
})();
