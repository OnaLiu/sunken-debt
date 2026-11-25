// 效果单的场面：第十二批「第一次（上）」（效果清单第 5 节）：F1、F2、F3、F4、F5。
// 接在 fx/scenes.js 后面载入，往 window.FX_SCENES 里加这一批。
// 别的场面（S.fresh）都当作第一次已经放过；这一批的场面快进完以后才把自己那一个记成“没放过”（__api.firsts.reset），
// 放的时候才是第一次。摆场面只用游戏本来就有的接口（__api.sim 快进、__game 的状态、键），改前的版本上也能跑（没有 firsts 就照常放）。
(() => {
  const F = window.FX_SCENES; if (!F) return;
  const { S, P } = F;
  const api = () => window.__api, G = () => window.__game;
  // 这一个记成没放过（改前的版本没有这个接口，照常放）
  const fresh1 = (id) => { const f = api().firsts; if (f) f.reset(id); };
  // 别的现场先当作已经看过（只放这一处的发现，不让旁边的现场一起亮）
  const knowAllBut = (...keep) => { const g = G(); for (const r of g.world.regions.values()) for (const s of r.sites) if (!keep.includes(s.id)) g.known.sites[r.id + ':' + s.id] = 'near'; };
  // 浅滩草地（3 米深）、一片深水（15.6 米深）：[船 x, 船 z, 船头朝向, 落点 x, 落点 z]（和第一批 B7 同一处）
  const Q = { shallow: [190, 12.5, 0.15, 196.5, 17.2], deep: [183.5, 127.3, 0.2, 190, 132] };
  const workAt = (x, z, h, ax, az) => { S.fresh(); S.place(x, z, h); S.sim(0.5); G().setMode('work'); G().setAimWorld(ax, az); S.sim(3.2); return G(); };
  // 开局的码头边：船停着，船头朝外（就是一趟开始时的样子）
  const atDock = () => { const g = S.fresh(); knowAllBut(); S.sim(0.6); return g; };
  // 侧面的镜头：站在船的左舷外 26 米、和船差不多高，跟着船走（看得出船头抬、船尾坐、烟往上翻）
  const sideCam = () => {
    const g = G(), b = g.boat, hx = Math.sin(b.heading), hz = Math.cos(b.heading);
    const pos = g.cam.pos.clone(), look = g.cam.pos.clone();
    pos.set(b.x - hz * 26 - hx * 2, 5.5, b.z + hx * 26 - hz * 2); look.set(b.x + hx * 1.5, 3.2, b.z + hz * 1.5);
    g.debugCam = { pos, look };
  };
  // 开过去看清一处现场（和第八批 B1 同一个开法）
  const findSite = (id) => { S.fresh(); knowAllBut(id); const a = S.approach(id); S.place(a.x, a.z, a.heading, 3); S.sim(0.4, S.W); };
  // 冲洗到 1.4 秒按一下空格（不管有没有第一次那一行，按的时候一样）
  const pressInWash = () => { let done = false; return () => { const R = G().reveal.active; if (!done && R && R.phase === 'wash' && R.washT > 1.4) { done = true; api().key('Space'); } }; };
  // 一网吊回来、离落甲板还有 1 秒（看得到网包落下、计时牌冒出来）
  const toLand = (k) => { S.fresh(); const p = P[k]; S.net(p[0], p[1]); S.toLanding(1.0); };

  const batch12 = [
    {
      id: 'F1', name: '第一次推油门', tier: '中', kind: '进场',
      when: '一趟开始，船停在码头边，第一次往前推油门（W / 左摇杆往前）',
      feel: '船听我的',
      before: '和以后每次推油门一样：船慢慢加速，烟囱照常冒淡烟（一直在冒，第一次没有不同），没有别的回应。',
      after: '推下去的那一下：烟囱“噗”地喷一大口黑烟，一口接一口、越来越淡，接上平常的淡烟；船头一抬、船尾往下一坐（0.4 秒抬到顶，1.6 秒里落回、略过头一点）；船尾翻起一大团白水，水面推开一圈浪；机器“突突突”地一口口吃上劲，汽笛短短一声。只有第一次，第二次推和平常一样。',
      watch: [
        '**爆发**（0 秒）：烟囱一大口黑烟，第一口最大最黑，后面三口越来越淡、越来越小',
        '**同时**：机器“突突”声从低往上挣、烟囱“噗”一口、船尾翻水的“哗”',
        '**余波**（0–0.4 秒）：船头抬起来、船尾坐下去；船尾一团白水往后喷，水面一圈浪推开',
        '**余韵**（0.3 秒）：汽笛短短一声；船头落回、略过头一点，接着平常地开',
      ],
      variants: [
        { k: 'start', label: '码头边，停着推油门', run: () => { atDock(); fresh1('F1'); return { dur: 5, hold: [['KeyW', 0.5, 4.2]] }; } },
        { k: 'side', label: '从侧面看船头抬、船尾坐', run: () => { atDock(); sideCam(); S.sim(0.2); fresh1('F1'); return { dur: 5, hold: [['KeyW', 0.5, 4.2]], frame: sideCam }; } },
        { k: 'twice', label: '推两次：第二次和平常一样', run: () => { atDock(); fresh1('F1'); return { dur: 9.5, hold: [['KeyW', 0.5, 2.3], ['KeyS', 2.6, 4.4], ['KeyW', 5.6, 8.6]] }; } },
      ],
    },
    {
      id: 'F2', name: '第一次发现线索', tier: '中', kind: '地图揭示',
      when: '一趟里第一次看清一处现场或线索（演示里约 17.6 秒，是沙底的船板那条线索）；沉船那一处是第十三批 F10',
      feel: '“哦，就是找这个”',
      before: '和以后每次一样（第八批 B1）：三道涟漪、名字浮起来 3.4 秒淡掉，find 一声；线索不写字。',
      after: '涟漪大一号（1.35 倍）、多一道，浪尖的光更宽，正中亮得更大；水面上真推出去一圈浪、翻起一圈白沫；名字字大一号、带一圈光，挂 5.6 秒（线索第一次也写出它指的方向：“船板一路往……”），那一圈挂 9.5 秒；船员一个接一个扭头看过去，船长伸手一指；find 那一声底下多敲一口低钟，后面一串细的亮音慢慢散开。',
      watch: [
        '**爆发**：气泡、正中一大团亮光；find 加一口低钟',
        '**余波**：四道涟漪，前三道扩过边，最后一道停在边上（线索：起点三圈、虚线描过去）；水面一圈浪推开',
        '**名字**：大一号、带光，浮起来挂 5.6 秒；线索写出方向',
        '**船上**：大家扭头看、船长一指',
      ],
      variants: [
        { k: 'clue', label: '线索：沙底的船板（演示里的第一次）', run: () => { findSite('trail'); fresh1('F2'); return { dur: 8.5, hold: [['KeyW', 0, 2.2]] }; } },
        { k: 'site', label: '现场：浅滩上的散落物', run: () => { findSite('sandbar'); fresh1('F2'); return { dur: 8.5, hold: [['KeyW', 0, 2.2]] }; } },
        { k: 'again', label: '对照：以后每次（B1）', expect: 'B1', run: () => { findSite('sandbar'); return { dur: 8.5, hold: [['KeyW', 0, 2.2]] }; } },
      ],
    },
    {
      id: 'F3', name: '第一次进入作业', tier: '轻', kind: '界面反馈',
      when: '玩家第一次停船进作业（演示里机器人在开，不出；接管以后第一次进作业才出）',
      feel: '知道怎么操作',
      before: '按键面板从左边滑进来几行键，7 秒后收走；和第一次到航行时一个样子。',
      after: '面板照常滑进来，这一次几行一行一行进来、每行的键帽挨个亮一下；右上角一枚红色“新”字章从大到小砸下来，外面推开一圈光，随后再闪两下；“唰、嗒、叮”轻轻三声。用过的键当场打勾、键帽变绿、那一行字淡一点（挪一下臂，“移臂”那一行就勾上）。',
      watch: ['面板滑进来，几行一行一行进来', '“新”字章砸下来、一圈光、再闪两下', '键帽挨个亮一下', '挪臂：那一行打勾、键帽变绿'],
      variants: [
        { k: 'enter', label: '停船进作业，再挪一下臂', run: () => { S.fresh(); knowAllBut(); S.placeFor(...P.tube); const h = api().hud; if (h.keysSeen) h.keysSeen.delete('work'); fresh1('F3'); return { dur: 6.5, at: [[0.6, () => api().key('Tab')]], hold: [['KeyD', 3.0, 3.6]] }; } },
      ],
    },
    {
      id: 'F4', name: '第一次触底', tier: '中', kind: '命中与击杀',
      when: '一趟里第一网触底（按下网那一下镜头就开始凑过去）',
      feel: '第一下就有手感',
      before: '和以后每一网一样（第一批 B7）：镜头在 24 米外的作业大景，泥环推到 4 米。',
      after: '按下网，镜头就朝网口那一块海底凑过去（24 米 → 约 14 米，离得近也不钻到水下），看着网落下去、触底；泥环大一号（推到约 5.7 米），泥沙多一些、大一些、甩得远一些，沙脊亮一点；闷响底下多一层更低更长的“轰”，沙沙声更宽；触底后在近处多看 1.6 秒，再慢慢退回作业大景。只有第一网。',
      watch: ['按下网：镜头往网那边凑近', '触底：泥环大一号、泥沙多一圈', '声音：闷响底下多一层低“轰”', '看完：镜头慢慢退回 24 米'],
      variants: [
        { k: 'shallow', label: '浅处 3 米 · 草地', run: () => { workAt(...Q.shallow); fresh1('F4'); return { dur: 9, at: [[0.5, () => api().key('Space')]] }; } },
        { k: 'deep', label: '深处 15.6 米', run: () => { workAt(...Q.deep); fresh1('F4'); return { dur: 10, at: [[0.5, () => api().key('Space')]] }; } },
        { k: 'again', label: '对照：以后每一网（B7）', expect: 'B7', run: () => { workAt(...Q.shallow); return { dur: 9, at: [[0.5, () => api().key('Space')]] }; } },
      ],
    },
    {
      id: 'F5', name: '第一次揭晓', tier: '中', kind: '揭幕',
      when: '一趟里第一网吊回甲板、开始冲洗（演示里约 38.5 秒）',
      feel: '原来是这样玩的',
      before: '和以后每次一样：计时牌上一枚小小的“空格 加快”，每次都一样重。',
      after: '第一次冲洗，计时牌下面从牌子底下滑出一行“按 空格 冲得更快”（手柄是 Ⓐ）：字大、键帽是立体的、一下一下按下去，外框一呼一吸，冒出来时轻轻“叮咚”一声。按了：键帽按到底、整行亮橙，一声细的“叮”，再往上收进牌子里（牌子上换成“加快 ×2.4”）。一直不按就挂到冲洗完。以后的揭晓只有原来那枚小键帽。',
      watch: ['网包落下、冲洗开始：牌子下面滑出一行字', '键帽一下一下按下去', '按了：亮橙、“叮”、收进牌子里', '以后：只有小键帽'],
      variants: [
        { k: 'press', label: '按了加快', run: () => { toLand('tube'); fresh1('F5'); return { dur: 6, frame: pressInWash() }; } },
        { k: 'wait', label: '一直不按', run: () => { toLand('tube'); fresh1('F5'); return { dur: 7.5 }; } },
        { k: 'later', label: '对照：以后的揭晓（小键帽）', expect: 'B17', run: () => { toLand('tube'); return { dur: 7.5 }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 12 }));

  F.entries = F.entries.concat(batch12);
  F.batches.push({
    n: 12, title: '第十二批 · 第一次（上）', sub: '5 个编号：第一次推油门、发现、进作业、触底、揭晓——只有第一次多给一点，以后照常',
    fixes: [
      ['F1', '第一次推油门：一大口黑烟、船头一抬船尾一坐、船尾翻白水、机器吃劲、汽笛短短一声'],
      ['F2', '第一次发现：涟漪大一号多一道、水面推开一圈浪、名字带光多挂两秒、船员扭头船长一指、多一口低钟'],
      ['F3', '第一次进作业：“新”字章砸下来再闪两下，键帽挨个亮，用过的键打勾'],
      ['F4', '第一次触底：镜头凑到约 14 米看它落底，泥环大一号，闷响底下多一层'],
      ['F5', '第一次揭晓：计时牌下多一行“按 空格 冲得更快”，键帽一下下按，按了亮橙收进牌子'],
    ],
  });
  F.batches.sort((a, b) => a.n - b.n);
})();
