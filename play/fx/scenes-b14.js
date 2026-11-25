// 效果单的场面：第十四批「开场」（效果清单第 5 节）：G1、G2、G3、G4、G5。
// 接在 fx/scenes.js（和 scenes-b7.js）后面载入，往 window.FX_SCENES 里加这一批。
// 标题上的几条（title: true）：效果单会先回到标题；摆场面只用游戏本来就有的接口，改前的版本上也能跑
// （改前没有 __api.replayTitle：把标题那一块拿下来再放回去，让它的入场动画从头放）。
(() => {
  const F = window.FX_SCENES; if (!F) return;
  const { S } = F;
  const api = () => window.__api, G = () => window.__game;
  // 标题的开场从头放
  const replay = () => {
    if (api().replayTitle) return api().replayTitle();
    const t = document.querySelector('.title'); if (!t) return false;
    const p = t.parentNode; t.remove(); p.appendChild(t); return true;
  };
  // 标题的开场直接放完（看上下选、按开始航程时用）
  const settled = () => { const f = api().titleFx; if (f && f.el) { f.T = 4.6; f.age = Math.max(f.age, 4.6); f.chord = 'done'; } };
  // 效果单里和弦照时起（不等浏览器让出声）
  const force = () => { const f = api().titleFx; if (f) f.force = true; };
  // 选中第一个（“开始航程”）：上一条放完可能停在别的按钮上
  const pick0 = () => {
    const t = document.querySelector('.title'); if (!t) return;
    t.dataset.sel = 0; t.querySelectorAll('.title-menu button').forEach((b, k) => b.classList.toggle('sel', k === 0));
    const f = api().titleFx; if (f && f.el && f.placePtr) f.placePtr(0);
  };
  const hover = (i) => { const b = document.querySelectorAll('.title-menu button')[i]; if (b) { b.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); } };
  // 自动演示开起来、跑到船在开的时候
  const demo = (secs) => { api().startDemo(); if (secs) S.sim(secs); return G(); };

  const batch14 = [
    {
      id: 'G1', name: '打开游戏', tier: '重', kind: '标题亮相', snd: 'opening',
      when: '打开游戏（也包括从暂停里回到标题）',
      feel: '一个故事要开始了',
      before: '标题字距 0.9 秒从宽收紧，按钮相隔 0.06 秒滑进来，背后的海一直在转；没有起头的声音（浏览器要先有一下按键才出声，之后也只是配乐自己的和弦）（`staged-00/01`）。',
      watch: [
        '**黑里起来**（0–1.1 秒）：镜头贴着水面，看着远处的海、岛和岬角废塔',
        '**字从水里浮上来**（0.5 秒起）：“沉”“债”一个接一个，带着水波的扭动往上浮、越浮越清楚，字距收紧；同时沉船那里的水面推出一圈波纹，一个慢慢打开的低和弦起来（D 多利亚：最低的 D 垫底，五度、八度、小三度一层层进来，底下一阵海水涌上来又退下去）',
        '**落稳**（约 1.75 秒）：一道光从左到右扫过字面，高处轻轻一声“叮”；下面一道金线画出去，“归潮沙湾”亮起来',
        '**按钮**（1.2 秒起）：一个接一个滑进来、略冲过头，铜箭头跟着第一个进来',
        '**余韵**（到 4.5 秒）：镜头慢慢升高、低下头，水下的船影从水面的反光底下浮出来',
        '浏览器还不让出声时：等第一下按键，和弦那时才起，字亮一下、光再扫一遍；开场没放完就按了键：剩下的加快放完',
      ],
      variants: [
        { k: 'open', label: '打开游戏（整套）', title: true, run: () => { replay(); force(); return { dur: 6.5 }; } },
        { k: 'late', label: '浏览器还不让出声：第一下按键时和弦才起', title: true, snd: 'openingLate', note: '3 秒时按一下 ↓（按之前当作浏览器不让出声）',
          run: () => { replay(); force(); const f = api().titleFx; if (f) f.lock = true; return { dur: 7, hold: [['ArrowDown', 3.0, 3.12]] }; } },
        { k: 'skip', label: '开场没放完就按了键', title: true, note: '0.9 秒时按一个不管用的键（X）', run: () => { replay(); force(); return { dur: 4, hold: [['KeyX', 0.9, 1.0]] }; } },
      ],
    },
    {
      id: 'G2', name: '标题上下选', tier: '轻', kind: '界面反馈',
      when: '标题上按 ↑↓（或摇杆）、鼠标滑过按钮',
      feel: '灵',
      before: '每个按钮自己左边有一枚小箭头：选中的那个淡入、别的淡出（0.2 秒），看不出“从哪跳到哪”；鼠标滑过只是变亮，和键盘选中的可以是两个；声音是 B22 拆出来的“嗒”。',
      watch: [
        '**跳**：一枚铜箭头从原来的按钮跳到新的那个（0.18 秒）：起跳拉长、半路往左让一点、落下压扁一下再弹回来',
        '**选中的按钮**：往右让 12 像素（略冲过头），一道光从左扫到右；原来那个退回去',
        '**绕回去**：从最后一个往下按，箭头从下面出去、从上面进来（不是一路倒着划回去）',
        '**鼠标**：滑到哪个按钮，箭头就跳到哪个；鼠标和键盘选中的是同一个',
        '声音还是 B22 的那一声轻“嗒”（只在按键时响，鼠标滑过不响）',
      ],
      variants: [
        { k: 'keys', label: '按 ↓↓↓ 再绕回、↑ 绕回', title: true, snd: 'nav', note: '开场先放完',
          run: () => { settled(); pick0(); return { dur: 4.2, hold: [['ArrowDown', 0.5, 0.6], ['ArrowDown', 0.95, 1.05], ['ArrowDown', 1.4, 1.5], ['ArrowDown', 2.0, 2.1], ['ArrowUp', 2.75, 2.85], ['ArrowUp', 3.3, 3.4]] }; } },
        { k: 'mouse', label: '鼠标滑过', title: true, note: '开场先放完；鼠标依次滑到 设置、操作说明、自动演示',
          run: () => { settled(); pick0(); return { dur: 3, at: [[0.5, () => hover(2)], [1.2, () => hover(3)], [1.9, () => hover(1)]] }; } },
      ],
    },
    {
      id: 'G3', name: '按“开始航程”', tier: '重', kind: '开局', snd: 'depart',
      when: '标题上按“开始航程”（空格、回车、点按钮）',
      feel: '出发！',
      before: '按下去当场黑场 0.42 秒，没有自己的声音；海面亮起来就是平常开船的镜头，船停在码头边一动不动，真实时间 825 毫秒到第一帧（`staged-02/03`）。',
      watch: [
        '**按下**（0 秒）：按钮压下去再弹起、金光从左亮过去；铜箭头像车钟手柄一样往右推出去；车钟“叮、叮”',
        '**汽笛**（0.12 秒）：一声长鸣（两支低音成五度，起头往上一滑，喷口先“噗”一口汽），0.6 秒后岸那边回来一声更远更闷的回声；海和机器的声音收下去',
        '**散开**（0–0.6 秒）：别的按钮往左落下，字往上散开、字距拉开，镜头朝水面扎下去，黑场',
        '**海面亮起**：黑场在汽笛声里过去；一层暖白的光 1.4 秒里退掉；镜头在船尾后面贴着水面，船头前面远远看得见红浮标和海蚀柱',
        '**船已在动**：船尾的水在翻（螺旋桨搅起白水往后推），身后一道刚划出来的 V 字航迹拖回码头那边，船尾推出一圈波纹，船身往下一坐；机器“突、突、突”咬上、水“哗”地翻起来，海和机器的声音跟着画面起来',
        '**交给你**（0.5–2.8 秒）：镜头从船尾后面升起来、退出去、转到平常开船的位置；接着就是 G4 的指向虚线',
        '只改表现：船不挪、不烧油（开局还是 60.0）',
      ],
      variants: [
        { k: 'start', label: '按“开始航程”（整套）', title: true, note: '开场先放完，0.6 秒时按回车',
          run: () => { settled(); pick0(); return { dur: 6.5, hold: [['Enter', 0.6, 0.7]] }; } },
      ],
    },
    {
      id: 'G4', name: '往那边去', tier: '轻', kind: '号令', snd: 'buoyBell',
      when: '自己开的一趟，进入后 2.5 秒（自动演示里没有）',
      feel: '往那边去',
      before: '水面上一道细细的白虚线（2.2 像素），从船前 12 米画到 64 米，箭头在屏幕外面、还被油表挡住一截；没有声音，7 秒后消失（`staged-04`）。',
      watch: [
        '**描出去**（0–0.85 秒）：从船头前面起，一道虚线朝红浮标描出去，描的那一头带一点亮',
        '**到头**（0.85 秒）：画面里画不下，就停在屏幕边上（不压油表）：箭头落下弹一下，前面一枚小红浮标、顶上的灯亮起；远处浮标上的铃“叮……当”，从它那一边传过来；浮标那里的水面推出一圈波纹',
        '**指着**：虚线一直朝那边流，每 1.5 秒一道亮光顺着跑过去；船头怎么转，虚线都从船头起、指着浮标',
        '**朝它开起来**：虚线亮一下、流得更快，然后从船这头往远处收走',
        '**一直不动**：9 秒时铃再轻轻响一次、箭头再弹一下；16 秒、转入作业或开到它跟前 40 米时淡掉',
      ],
      variants: [
        { k: 'idle', label: '停着不动（9 秒时再提醒一次）', run: () => { S.fresh(); G().introT = 0.5; return { dur: 11 }; } },
        { k: 'go', label: '朝它开过去', run: () => { S.fresh(); G().introT = 0.5; return { dur: 6, hold: [['KeyW', 2.6, 6]] }; } },
      ],
    },
    {
      id: 'G5', name: '演示里随时能接手', tier: '轻', kind: '界面反馈',
      when: '自动演示中：按了别的键、按 Esc（或点横幅）接管',
      feel: '知道随时能接手',
      before: '按了别的键：横幅闪一下（之后 2.5 秒里再按都没反应），没有声音；按 Esc：横幅当场消失，按键面板飞进来（`demo-21/22`）。',
      watch: [
        '**演示开始**：横幅从屏幕上沿落下来、弹一下',
        '**每按一下别的键**：横幅上的 Esc 键帽被按下去一下（告诉你该按的是它）',
        '**隔 1.2 秒以上的那一下**：横幅再一跳，键帽外面推出一圈金光，轻轻“笃笃”两声（不是“不行”的那一声）；6 秒里按了 3 下，横幅底下冒出一句“按 Esc 就能自己开”',
        '**Esc 接管**：横幅上的字换成“交给你了”、红灯变绿，0.4 秒后往上收走；车钟手柄“咔”一下、两个暖音往上走；开船的键从左边飞进来',
        '鼠标：点横幅也能接管',
      ],
      variants: [
        { k: 'nudge', label: '演示中按了别的键（连按几下）', snd: 'demoHint',
          run: () => { demo(20); return { dur: 5, hold: [['KeyW', 0.6, 0.72], ['Space', 1.0, 1.08], ['KeyD', 1.45, 1.55], ['Space', 2.3, 2.38], ['KeyW', 3.0, 3.1]] }; } },
        { k: 'esc', label: '按 Esc 接管', snd: 'takeover', run: () => { demo(20); return { dur: 3.5, hold: [['Escape', 0.8, 0.9]] }; } },
        { k: 'click', label: '点横幅接管', snd: 'takeover', run: () => { demo(20); return { dur: 3.5, at: [[0.8, () => { const b = document.querySelector('.demo-banner'); if (b) b.click(); }]] }; } },
        { k: 'start', label: '演示开始：横幅落下来', note: '演示先开起来、横幅先藏着，0.4 秒时露出来',
          run: () => { demo(1); api().hud.setDemo(false); return { dur: 2.5, at: [[0.4, () => api().hud.setDemo(true)]] }; } },
      ],
    },
  ].map((e) => ({ ...e, batch: 14 }));

  F.entries = F.entries.filter((e) => !batch14.some((b) => b.id === e.id)).concat(batch14);
  F.batches.push({
    n: 14, title: '第十四批 · 开场', sub: '5 个编号：打开游戏、标题上下选、按“开始航程”、往那边去、演示里随时能接手',
    fixes: [
      ['G1', '打开游戏：镜头贴着水面升起来，字从水里浮上来，一个慢慢打开的低和弦（不让出声就等第一下按键）'],
      ['G2', '标题上下选：一枚铜箭头在按钮之间跳（绕回时从另一头进来），鼠标滑到哪就跳到哪'],
      ['G3', '按“开始航程”：车钟、汽笛长鸣，黑场在汽笛声里过去；海面亮起时船尾的水已经在翻，镜头从船尾升起来'],
      ['G4', '往那边去：虚线从船头描向红浮标、停在屏幕边上，浮标的铃“叮……当”，朝它开了就收起'],
      ['G5', '演示里随时能接手：每按一下 Esc 键帽都被按下去，接管时横幅说“交给你了”往上收走'],
    ],
  });
  F.batches.sort((a, b) => a.n - b.n);
})();
