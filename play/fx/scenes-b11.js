// 效果单的场面：第十一批「站着看也好看」（效果清单第 5 节）：A1、A2、A3、A4、A5。
// 接在 fx/scenes.js、fx/scenes-b7.js 后面载入，往 window.FX_SCENES 里加这一批。
// 这几样一直都在（每一秒都有），所以每条放得长一点（8–14 秒），摆好场面后先让它自己转几秒再放。
// 摆场面只用游戏本来就有的接口（__api.sim 快进、__game 的状态、setMode、setAimWorld、debugCam、audio.music.next），改前的版本上也能跑。
(() => {
  const F = window.FX_SCENES; if (!F) return;
  const { S } = F;
  const api = () => window.__api, G = () => window.__game;
  const E = Math.PI / 2; // 船头朝东（出发港口外面一片 6–10 米深的开阔水）

  // 开阔水面：出发港口东边，x 40–130、z −20–0 都是 6–10 米深，全速开 7 秒也碰不到浅滩
  const OPEN = [40, -10];
  const sailFrom = (speed, dist = 38, pitch = null) => {
    S.fresh();
    S.place(OPEN[0], OPEN[1], E, speed);
    const c = G().cam; c.distSail = dist; if (pitch != null) c.pitch = pitch;
    S.sim(0.6, speed > 0 ? S.W : null);
  };
  // 浅滩草地：鱼群 f1 在这一片（3 米深，草、沙、光斑）；船停在西边，转作业、落点放在草地上，镜头拉近
  const MEADOW = { boat: [189.5, 13.5, 0.55], aim: [198.5, 20.5] };
  // 作业镜头：转到“船—落点”连线的侧面（和游戏里进作业时一样），远近、俯仰按这一条要看的
  const workCam = (dist, pitch) => { const g = G(), c = g.cam; g.frameWork(); c.yaw = c.ease.yaw; c.ease = null; c.distWork = dist; c.pitch = pitch; c.init = false; };
  const school = (id) => { for (const r of G().world.regions.values()) for (const c of r.creatures) if (c.id.endsWith(':' + id)) return c; return null; };
  // onFish：落点放在鱼群那里（镜头对着鱼群）；否则放在草地中间
  const meadow = (dist = 16, pitch = 0.78, onFish = false) => {
    S.fresh();
    const [x, z, h] = MEADOW.boat;
    S.place(x, z, h); S.sim(0.4);
    G().setMode('work', true); G().setAimWorld(...MEADOW.aim);
    S.sim(3.5);
    const f = onFish && school('f1');
    if (f) G().setAimWorld(f.cx + 1, f.cz + 0.5);
    workCam(dist, pitch);
    S.sim(0.3);
  };
  // 停着的船（航行模式、不推油门），镜头拉近一点看甲板
  const parked = (dist = 22, pitch = 0.62, yawOff = 0.5) => {
    S.fresh();
    S.place(OPEN[0], OPEN[1], E, 0);
    const c = G().cam; c.distSail = dist; c.pitch = pitch; c.yaw = G().boat.heading + Math.PI + yawOff; c.init = false;
    S.sim(5); // 让船员先各自干上几样
  };
  // 甲板近景：镜头在船外侧斜上方看整条甲板（每帧跟着船，船在晃）
  const deckView = (off = [9.5, 7.5, -3], look = [0, 1.4, -1.2]) => () => {
    const g = G(), d = g.boat.deck, L = g.cam.look.clone().set(...look), P = g.cam.look.clone().set(look[0] + off[0], look[1] + off[1], look[2] + off[2]);
    d.localToWorld(L); d.localToWorld(P); g.debugCam = { pos: P, look: L };
  };
  // 配乐的下一个和弦在第几秒起（改前、改后都有 audio.music.next；放的时候才数秒）
  const chordAt = (sec) => () => { const a = G().audio; if (a && a.music) a.music.next = sec; };

  const batch11 = [
    {
      id: 'A1', name: '船在推水', tier: '轻 · 新', kind: '新',
      when: '开船的每一秒',
      feel: '船在推水，有分量；推油门时浪先翻起来，越快浪拖得越长',
      before: '船尾两串一粒粒的白点（粒子），船头偶尔几粒水花；没有船头切开的浪、没有斜着分开的两道浪；推油门时水面没有变化，烟囱匀速冒淡烟',
      after: '水面上画出船推开的水：船头切浪、两道开尔文浪斜着分开（越快拖得越长）、中间翻白、镜面水道；机器有转速和“吃力”——推油门时船尾先翻白、烟囱冒一大团深色烟、船头抬一点；开快了船头一下下压浪、两舷扑水花。代码：src/game/wake.js、post.js 的 wakeFx。',
      watch: ['船尾两道白浪斜着往外分开（开尔文波的两条臂，19.5°），一节节的浪头连成线，越远越宽越碎；中间一条翻滚的白水带、一条被压平的镜面水道', '船头切开的浪贴着船身翻起来、往后斜着离开船身；开快了船头一下下压进浪里，两舷扑起水花', '推油门那一刻：船还没动，船尾先翻起一大团白水，烟囱一口一口冒深色的烟、船头抬一点；松开油门白水留在原地慢慢散', '越快浪拖得越长；打满舵时航迹跟着弯；停下以后两道浪还在往外扩、慢慢淡掉'],
      variants: [
        { k: 'cruise', label: '全速直行', run: () => { sailFrom(9.5); return { dur: 7, hold: [['KeyW', 0, 7]] }; } },
        { k: 'throttle', label: '从停着推满油门，再松开', run: () => { sailFrom(0); return { dur: 10, hold: [['KeyW', 0.6, 5.6]] }; } },
        { k: 'turn', label: '全速打满舵', run: () => { sailFrom(9.5); return { dur: 7, hold: [['KeyW', 0, 7], ['KeyD', 1.2, 5.2]] }; } }, // 往右（南边）转：左转会转进北边浅滩的警报里
        { k: 'close', label: '贴近船尾看（18 米）', run: () => { sailFrom(9.5, 18, 0.42); G().cam.yaw = G().boat.heading + Math.PI + 0.85; return { dur: 6, hold: [['KeyW', 0, 6]] }; } },
      ],
    },
    {
      id: 'A2', name: '机声、海声、电机声', tier: '轻 · 新', kind: '新',
      when: '一直在（开声音听）',
      feel: '人在海上：机器低低地喘，跟着油门起伏；海浪垫在底下；吊机一动就有电机声',
      before: '引擎是一个锯齿波加方波，音高、音量直接跟船速（不跟油门，松了油门还是一样响）；海浪一层褐噪声；吊机电机一个三角波，动就响、不动就停',
      after: '机器跟着油门（有惯性的转速），一下下的点火节拍从怠速“突、突”到全速连成一片，吃力时变粗；海声分涌、碎浪、拍船身、刷水四层；吊机电机有起转、收转和继电器“咔哒”。代码：src/audio-ambient.js。',
      watch: ['推油门：机器先“突突突”地加快、变粗变亮（吃力，多一层闷吼），船速再慢慢跟上；跑稳了声音松下来', '松油门：转速先掉下来，船还在往前滑', '海声垫在底下：长长的涌、碎浪沙沙；停着时浪一下下拍船身（左右不定）；开快了船身刷水的嘶声、船头压浪“哗”', '吊臂一动：继电器“咔哒”，电机呜地转起来（音高跟着往上走）；停时呜地落下去、再“咔哒”'],
      variants: [
        { k: 'throttle', label: '推油门、松油门（听机器）', run: () => { sailFrom(0); return { dur: 11, hold: [['KeyW', 0.8, 4.2], ['KeyW', 6.4, 8.4]] }; } },
        { k: 'crane', label: '作业时挪吊臂（听电机）', run: () => { meadow(24, 0.62); const g = G(); return { dur: 9, at: [[0.8, () => g.setAimWorld(194, 24.5)], [3.6, () => g.setAimWorld(200.5, 17)], [6.4, () => g.setAimWorld(197, 22)]] }; } },
        { k: 'still', label: '停着、什么也不做（听海）', run: () => { parked(30, 0.5); return { dur: 10 }; } },
      ],
    },
    {
      id: 'A3', name: '风吹过的和弦', tier: '轻 · 新', kind: '新',
      when: '每 7–9 秒一个和弦（这一条开着配乐）',
      feel: '开阔、从容：一个慢慢打开又合上的和弦，像一阵风吹过',
      before: '每 7–9 秒一个正弦和弦（真实时间 46 秒里 6 次），声音固定不变；画面上没有对应的东西；揭晓时照常响，不让路',
      after: '和弦换成锯齿过低通，滤波器 3.6 秒打开再合上，带一阵从左到右的风声；同一刻海面上扫过一阵猫爪风、小旗抖急；揭晓时压到两成让路。代码：src/audio-ambient.js、src/game/breeze.js。',
      watch: ['和弦像一阵风吹过：锯齿过低通，滤波器慢慢打开（3.6 秒最亮）再合上；底下一阵风声从左吹到右', '画面上同一阵风：海面上一片片起细纹、颜色沉下去（猫爪风）扫过来，扫到船时桅顶小旗抖得更急', '揭晓开始：音乐压到两成给揭晓让路，揭晓完慢慢回来；揭晓、收工时不起新的和弦'],
      variants: [
        { k: 'chord', label: '开船时的两个和弦', music: true, run: () => { sailFrom(5); chordAt(0.4)(); return { dur: 13, hold: [['KeyW', 0, 13]], music: true }; } },
        { k: 'still', label: '停船看海时', music: true, run: () => { parked(34, 0.42, -0.9); chordAt(0.4)(); return { dur: 12, music: true }; } }, // 开阔深水、大片海面和桅顶小旗都在画里：风从画面左下扫过来
        {
          k: 'duck', label: '和弦里揭晓：给揭晓让路', music: true,
          run: () => {
            // 和弦刚起，网包就要落甲板：落下去揭晓一开始，音乐压到两成
            S.fresh(); const p = F.P.tube; S.net(p[0], p[1]);
            S.toLanding(2.6); chordAt(0.15)();
            return { dur: 10, music: true };
          },
        },
      ],
    },
    {
      id: 'A4', name: '海底是活的', tier: '轻 · 新', kind: '新',
      when: '停船、不操作时（一直在）',
      feel: '海底是活的，看着就舒服；站着不动也一直有东西在动',
      before: '有折射光斑、草摆、鱼群、蟹；但鱼群像一整块在平移（群停下时鱼头齐刷刷转回同一个方向），蟹匀速走，草只随水流细细地摆；量到“什么也没发生”最长 9.5 秒',
      after: '鱼群每条按自己看到的群头朝向游：转向一道波、侧身一闪、分两股再合拢、惊散后一条条回来；蟹走走停停（画出来的身子落后规则位置不到半米）；一道道涌让草一齐倒、光斑一亮。代码：src/eco/schoolmove.js、crabgait.js、materials.js 的 surgeAt。',
      watch: ['鱼群隔几秒换个方向冲一小段：转向从群头传到群尾，转身那一下侧面一闪（一道亮光扫过去）', '鱼群隔一阵分成两股绕开、再合拢；平时一松一紧地“呼吸”', '一道道涌从头顶经过（约 8 秒一道）：整片草顺着它倒一下再回来、梢头抖一阵，沙上的光斑跟着亮一下、晃一下', '网惊开鱼群：一条条往外炸开，过一会儿一条条慢慢游回来，有几条落在后面', '蟹走走停停：停下来张望、有时用螯挑一下泥，再一阵小跑'],
      variants: [
        { k: 'meadow', label: '浅滩草地上的鱼群（停船、拉近）', run: () => { meadow(13, 0.86, true); return { dur: 12 }; } },
        { k: 'wide', label: '平常的作业大景（24 米）', run: () => { meadow(24, 0.66); return { dur: 12 }; } },
        {
          k: 'scare', label: '网惊开鱼群，再慢慢回来', run: () => {
            meadow(20, 0.74); F.S.drop();
            F.S.until((g) => g.op && g.op.state !== 'lowering', 20);
            return { dur: 14 };
          },
        },
        {
          k: 'crab', label: '沉船船首外的蟹（走走停停、翻泥）', run: () => {
            S.fresh();
            let c = null; for (const r of G().world.regions.values()) for (const q of r.creatures) if (q.id.endsWith(':c1')) c = q;
            S.place(286.5, 12.5, 0.4); S.sim(0.4);
            G().setMode('work', true); G().setAimWorld(292.5, 16.5); workCam(15, 0.82);
            // 等它从躲的地方出来、开始走
            S.until(() => c && c.mode === 'walk', 30); S.sim(0.6);
            return { dur: 12 };
          },
        },
      ],
    },
    {
      id: 'A5', name: '船上有人在干活', tier: '轻 · 新', kind: '新',
      when: '开船、停船时（一直在）',
      feel: '船上有人在干活，各做各的，不站着发呆',
      before: '值守、盘缆、蹲查、巡视轮流做；几个人常挤在一处，远看多半是站着、靠着；手势只有开船挥手、下网时指',
      after: '闲下来多了三样看得出在干什么的活：擦甲板（长柄刷、溅水）、蹲着敲锤检修（火星、“叮”）、舷边倒手收缆（缆绳垂到水里滴水）；挑活时离别人远的优先；停船时船长搭凉棚看海。代码：src/game/chores.js。',
      watch: ['擦甲板：弓步推长柄刷，一推一拉，刷头那里溅水', '蹲着检修：一只手扶着设备，一只手抡小锤敲，敲上去迸火星、“叮”一声；敲三下凑近看看', '倒手收缆：站在舷边两手一上一下往下拉，身子一下下往后坐；缆绳从栏杆外垂到水里、滴水', '挑活时离别人远的优先：四个人分散在甲板各处，各做各的', '停船时船长隔一会儿搭凉棚往外看'],
      variants: [
        { k: 'still', label: '停着（22 米看甲板）', run: () => { parked(22, 0.62); return { dur: 14 }; } },
        { k: 'close', label: '停着，甲板近景', run: () => { parked(22, 0.62); const f = deckView(); f(); return { dur: 14, frame: f }; } },
        { k: 'sail', label: '开着船', run: () => { sailFrom(9.5, 26, 0.55); S.sim(3, S.W); return { dur: 12, hold: [['KeyW', 0, 12]] }; } },
        { k: 'wide', label: '平常的航行大景（38 米）', run: () => { parked(38, 0.62); return { dur: 12 }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 11 }));

  F.entries = F.entries.filter((e) => !batch11.some((b) => b.id === e.id)).concat(batch11);
  F.batches.push({
    n: 11, title: '第十一批 · 站着看也好看', sub: '5 个编号：船推水、机声海声电机声、风吹过的和弦、海底是活的、船员干活',
    fixes: [
      ['A1', '船在推水'],
      ['A2', '机声随油门起伏，海浪垫底，吊机电机'],
      ['A3', '慢慢打开的和弦，给揭晓让路'],
      ['A4', '海底是活的'],
      ['A5', '船员各做各的'],
    ],
  });
  F.batches.sort((a, b) => a.n - b.n);
})();
