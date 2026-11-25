// The one way the kit, the skill's scripts and every game's own tools start a test browser (Chrome / Chromium).
// A kit file: a game keeps it as the kit ships it (rounds.py puts the current one in the game's tools/ before each round).
//
// What it guarantees, however the test ends (finished, threw, timed out, Ctrl-C, its own process killed with kill -9):
// - the browser opens no audio device: no speaker, no microphone, no camera, no keychain. Pages still run their Web Audio
//   (the clock moves, nodes render, analysers see data), so a test checks sound in code: which sounds fired, the audio
//   state, or the sound rendered to data. `--mute-audio` alone still opened the speaker (2026-11-10: 746 speaker holds piled
//   up in coreaudiod, coreaudiod at 236 % CPU).
// - the browser ends with the process that started it: a pipe only that process holds; when it goes, the browser shuts down.
// - what one still left (a machine reboot mid-test, an old tool) is cleared the next time any test starts one: only browsers
//   carrying this file's mark whose starter is gone, never the user's Chrome or anyone else's.
// - Chrome's background services are off (LEAN); the GPU is used as given (--enable-webgl --ignore-gpu-blocklist): on a Mac
//   WebGL runs on Metal. Where a test's CPU goes (2026-11-11, a game drawing at 1920×1080): drawing frames, not this launcher;
//   a fast-forwarded test that draws only the frames it looks at spends about half (L2-game/flow-iterations.md, same day).
// - every start records once what the browser draws on, as the browser itself reports it (SystemInfo.getInfo over the pipe it
//   already holds: no extra process, no page touched, the test does not wait for it). One JSON line per start in the trial record:
//     a round (rounds.py sets GMP_TRIAL_LOG)           <round>/.run/渲染.jsonl  (rounds.py adds the counts to the round's record)
//     a background job (handoff/bg.py: CLAUDE_BG_JOB)  <job folder>/渲染.jsonl
//     anything else                                    <current folder>/.ai/试跑/渲染.jsonl
//   (opts.record: another file; false: none). A line: at, round, job, cwd, script, chrome (the binary), gpu (the renderer the
//   browser names), webgl, webgl2, canvas2d, raster (the page's rasterization), compositing: "gpu" | "cpu" | "off" from the
//   browser's feature status (Chrome 157 reports WebGL2 with WebGL); software: true when anything is drawn by the CPU
//   (SwiftShader, no WebGL, Canvas 2D, rasterization or compositing off the GPU), null when the browser never answered; why;
//   status (the raw feature status). How many starts drew on the CPU = lines with "software": true. A software start also says so
//   at once on stderr, with what brings it back to the GPU; the test goes on. Measured 2026-11-14 on Chrome 157, Apple M4 Pro:
//   the answer comes 0.1–0.3 s after the DevTools port, the plain Chrome here draws on Metal ("ANGLE Metal Renderer: Apple M4 Pro"),
//   --disable-gpu leaves no WebGL and Canvas 2D on the CPU, Playwright's chrome-headless-shell draws on SwiftShader (the CPU).
//
// - a real-time measurement (the walk's real clock, frame rate, feel: what a player sees on this computer) counts only when the
//   measured game itself was not held back, and it gets the computer first (2026-11-14, user: 「其他的可以按照你的建议执行」 on the
//   调试工具体检: 36 of 55 walks wrote the load spoiled their measurement). Not a cap on how many tests run, and nothing waits:
//     - every other test browser starts one class down (on a Mac the utility QoS clamp, elsewhere nice 10; Windows below normal):
//       on a free computer it runs as before, on a full one the measured game's frames go first;
//     - measureFair(fn) / `node chrome.mjs --fair -- <command>` runs at once, with a probe at the game's own priority that wants one
//       frame's work every 1/60 s; when more than LATE_SHARE of its frames could not get the CPU in time (work of the game's own
//       class took it), the try does not count and runs again at once; the last line says whether it measured true. A result it
//       says was not measured true is no conclusion. Browsers started inside run at normal priority. While it runs, a mark in
//       RT_DIR says who is measuring; nothing waits on it.
//     - port() keeps waiting while the computer is busy and the browser is still starting (up to PORT_BUSY_MAX).
//   2026-11-14 evening, the first version on this Mac (CPU at 80–100 % all day, load 35–90): it judged by the whole computer's CPU
//   and waited for it to drop under 75 % first, so every walk waited its 20 minutes and still read 「没量准」, and while one waited every
//   other test's extra browser queued behind it (the kit's own tests timed out at 240–600 s). The other browsers were at nice 10, which
//   macOS does not honour against a normal-priority thread: a probe like the one above lost 34 % of its frames to 28 nice-10 busy loops
//   as to 28 at normal priority, 2 % to 28 under the utility clamp.
//
//   import { spawnChrome } from './chrome.mjs';
//   const chrome = spawnChrome(['--headless=new', '--remote-debugging-port=0', '--window-size=1920,1080', 'about:blank']);
//   const port = await chrome.port();          // the DevTools port (also with a fixed --remote-debugging-port=N)
//   …
//   await chrome.close();                      // ends it properly, then anything of it still left, then its temp profile
//
//   const r = await measureFair(async () => { const c = spawnChrome([...]); …measure…; await c.close(); return fps; });
//   r.result, r.fair (true / false / null: too short to tell), r.note (the one line to report), r.tries, r.verdict.probe
//   node tools/chrome.mjs --fair -- node my-walk.mjs …   (any command; its browsers count as the measurement's)
//
// spawnChrome(args, { stdio, env, cwd, chrome, native, tmp, record, realtime }) returns the ChildProcess (so `chrome.kill()`, `chrome.once('exit')`
// still work). Without a --user-data-dir in args it makes a temp profile (under tmp, default the system temp folder) and
// removes it on close (a tmp folder that was empty when handed over goes too); pass --user-data-dir only for a profile that
// should stay. env CHROME: the binary.
// native (default true): on an Apple-silicon Mac the browser starts natively, even when a shell up the chain runs translated (Rosetta).
// realtime: this browser is a real-time measurement (normal priority, never waits for one; inside measureFair, --fair or with
// GMP_REALTIME=1 every browser is). Its line in the trial record says realtime: true.
// CLI: node chrome.mjs --reap   clears what earlier tests left and says what.
//      node chrome.mjs --fair -- <command> [args]   runs a real-time measurement as above; exits with the command's code.
//      node chrome.mjs --run -- <chrome args>   for a test in another language (Python…): see the --run branch below.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WIN = process.platform === 'win32', MAC = process.platform === 'darwin';
export const CHROME = process.env.CHROME || (WIN ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : MAC ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
// No audio output or input device, fake camera/microphone if a page asks, no keychain; unknown to a platform = ignored there.
export const QUIET = ['--disable-audio-output', '--disable-audio-input', '--mute-audio', '--use-fake-device-for-media-stream',
  '--use-mock-keychain', '--no-first-run', '--no-default-browser-check'];
// Chrome's own background services a test never uses (updates, sync, safe browsing lists, translate, metrics uploads):
// measured 2026-11-11 on Chrome 157, Apple M4 Pro, they cost ~1.4–1.7 CPU-s per browser start (1.1 without) and a third of
// the browser process's CPU in a long run. A test's own --disable-features is merged with LEAN_FEATURES, not overridden.
export const LEAN = ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
  '--disable-breakpad', '--disable-client-side-phishing-detection', '--disable-domain-reliability', '--metrics-recording-only'];
export const LEAN_FEATURES = ['Translate', 'OptimizationHints', 'MediaRouter', 'DialMediaRouteProvider', 'AutofillServerCommunication',
  'CertificateTransparencyComponentUpdater'];
const MARK = '--gmp-test-owner=';       // on the browser's own command line: which process started it
const PREFIX = 'gmp-chrome-';           // temp profiles: gmp-chrome-<starter pid>-XXXXXX
export const RENDER_LOG = '渲染.jsonl'; // the trial record of what each start drew on (top of this file)
const INFO_ID = 2;                      // the one question asked on the pipe besides Browser.close (id 1)
const live = new Set();
let reaped = false, nativeOk = null;

const alive = (pid) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// a longest wait that never keeps the test's process alive by itself (2026-11-14: close()'s 5 s wait held every test that ends
// on its own 5 s past its close); what it waits for (the browser) keeps the process up while there is something to wait for
const upTo = (ms) => new Promise((r) => setTimeout(r, ms).unref());
const argOf = (args, k) => { const a = args.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };

// ---- Real-time measurements (top of this file) ----
const userName = () => { try { return os.userInfo().username.replace(/[^\w.-]/g, '_'); } catch { return 'user'; } };
// one folder for every process of this user, whatever TMPDIR a session got: the marks of measurements under way (who is measuring
// now; a mark is there only while a measurement runs, and nothing waits on it)
export const RT_DIR = process.env.GMP_REALTIME_DIR || path.join(WIN ? os.tmpdir() : '/tmp', `gmp-realtime-${userName()}`);
export const BUSY_CPU = +(process.env.GMP_FAIR_BUSY || 90);    // CPU % over which the computer is busy (port(): a browser still starting is waited for)
const PORT_BUSY_MAX = 1000 * +(process.env.GMP_PORT_BUSY_MAX || 180); // how long port() waits for a browser starting on a busy computer
// The probe that says whether the measured game itself got the CPU: a thread at the game's own priority that wants one frame's worth
// of work (PROBE_WORK ms of CPU every 1/60 s, a quarter of a core) and times how long getting it takes; a frame it could not finish
// within 1/60 s is one the game would have lost to work of its own priority. Measured 2026-11-14 on this Mac (14 cores, load 35–90):
// 28 busy loops at the same priority, 34 % of the probe's frames late; the same 28 clamped to the utility class, 2 %; nice 10, as
// bad as none (macOS schedules by QoS class, not by nice).
const PROBE_WORK = +(process.env.GMP_FAIR_WORK || 4);
export const LATE_SHARE = +(process.env.GMP_FAIR_LATE || 0.05);  // a measurement is true when at most this share of the probe's frames was late
const SWEEP_NICE = 10;
let realtimeDepth = 0, rtSeq = 0;
const heldMarks = new Set();
const say = (s) => { try { process.stderr.write(s + '\n'); } catch { /* no stderr */ } };

function cpuTimes() { let idle = 0, total = 0; for (const c of os.cpus()) { const t = c.times; idle += t.idle; total += t.user + t.nice + t.sys + t.idle + t.irq; } return { idle, total }; }
const cpuSince = (a, b = cpuTimes()) => (b.total > a.total ? 100 * (1 - (b.idle - a.idle) / (b.total - a.total)) : null);

// The probe, on a worker thread (the measuring script's own work never delays it), from start until stop() → the frame times in ms.
const PROBE = `const { parentPort } = process.getBuiltinModule('node:worker_threads');
const work = +process.env.GMP_FAIR_WORK || ${PROBE_WORK}, out = [], own = typeof process.threadCpuUsage === 'function';
const cpu = () => { const u = own ? process.threadCpuUsage() : process.cpuUsage(); return (u.user + u.system) / 1000; };
let on = true;
const frame = () => { if (!on) return; const t0 = performance.now(), c0 = cpu(); while (cpu() - c0 < work) { /* the frame's work */ }
  out.push(performance.now() - t0); setTimeout(frame, Math.max(0, t0 + 1000 / 60 - performance.now())); };
setTimeout(frame, 0);
parentPort.on('message', () => { on = false; parentPort.postMessage({ frames: out, own }); });`;
let Worker = null;
export async function probeStart() {
  Worker ??= (await import('node:worker_threads')).Worker;
  const w = new Worker(PROBE, { eval: true, env: process.env, execArgv: [] }); // CommonJS or not, whatever the script was started with
  w.unref();
  return { async stop() {
    const r = await new Promise((res) => { w.once('message', res); w.once('error', () => res(null)); w.postMessage(1); });
    await w.terminate().catch(() => {});
    return r;
  } };
}
// Was the measured game itself held back? fair: null when nothing could be read.
export function judge(probe, late = LATE_SHARE) {
  const f = (probe && probe.frames || []).filter(Number.isFinite);
  if (f.length < 5) return { fair: null, probe: null, why: '量的时间太短，探针没量到几帧' };
  const sorted = [...f].sort((a, b) => a - b), share = f.filter((x) => x > 1000 / 60).length / f.length;
  const p90 = Math.round(sorted[Math.floor(sorted.length * 0.9)] * 10) / 10, fair = share <= late;
  return { fair, probe: { frames: f.length, lateShare: Math.round(share * 1000) / 1000, p90Ms: p90, threadCpu: !!probe.own },
    why: fair ? `和这一局同一档优先级的探针 ${f.length} 帧里 ${Math.round(share * 100)}% 没按时拿到 CPU（这一局没被抢）`
      : `和这一局同一档优先级的探针 ${f.length} 帧里 ${Math.round(share * 100)}% 没按时拿到 CPU（同一档的活在抢）` };
}

// The marks of measurements under way: <RT_DIR>/<start ms>-<pid>-<n>; a mark whose process is gone is dropped by whoever reads it.
function holdMark() {
  const name = `${Date.now()}-${process.pid}-${++rtSeq}`, f = path.join(RT_DIR, name);
  try { fs.mkdirSync(RT_DIR, { recursive: true }); fs.writeFileSync(f, JSON.stringify({ pid: process.pid, cwd: process.cwd(), script: process.argv[1] || null })); heldMarks.add(f); }
  catch { /* no mark: the measurement still runs */ }
  if (heldMarks.size === 1) process.once('exit', () => { for (const m of heldMarks) try { fs.rmSync(m, { force: true }); } catch { /* gone */ } });
  return { release() { heldMarks.delete(f); try { fs.rmSync(f, { force: true }); } catch { /* gone */ } } };
}
// Measurements of other processes under way.
export function measuring() {
  const out = [];
  let names = [];
  try { names = fs.readdirSync(RT_DIR); } catch { return out; }
  for (const n of names) {
    const m = n.match(/^(\d+)-(\d+)-(\d+)$/);
    if (!m || +m[2] === process.pid) continue;
    if (!alive(+m[2])) { try { fs.rmSync(path.join(RT_DIR, n), { force: true }); } catch { /* gone */ } continue; }
    out.push({ pid: +m[2], since: +m[1] });
  }
  return out;
}
const isRealtime = (opts) => !!opts.realtime || realtimeDepth > 0 || process.env.GMP_REALTIME === '1';

// One stretch of real-time measuring, for a tool that measures only part of what it runs (moment.mjs --realtime): the mark and the
// probe from here to stop(), which returns the verdict (judge).
export async function startMeasure(o = {}) {
  const mark = holdMark(), probe = await (o.probeStart || probeStart)();
  return { async stop() { const r = await probe.stop(); mark.release(); return judge(r); } };
}
export function noteOf(v, i, done) {
  return v.fair === true ? `[量真时间] 量准了：${v.why}${i ? `（第 ${i + 1} 遍）` : ''}`
    : v.fair === null ? `[量真时间] 说不清量准没有：${v.why}`
    : done ? `[量真时间] 没量准：${v.why}；重量了 ${i + 1} 遍还是这样。这一局量出来的帧率、手感、时长不拿来下结论`
    : `[量真时间] 这一遍没量准（${v.why}），不作数：马上重量`;
}

// Run fn as a real-time measurement: at once (it waits for nothing), its browsers at normal priority while every other test
// browser runs in a lower class; run again at once when the probe says it was held back. Returns
// { result, fair, tries, verdict, verdicts, note }; note is the one line to report (also written to stderr).
export async function measureFair(fn, o = {}) {
  const most = o.tries ?? 2, log = o.log || say;
  realtimeDepth++;
  const verdicts = [];
  try {
    for (let i = 0; ; i++) {
      const m = await startMeasure(o);
      let result, err = null;
      try { result = await fn(i); } catch (e) { err = e; }
      const v = await m.stop();
      verdicts.push(v);
      if (err) throw err;
      const done = v.fair !== false || i + 1 >= most, note = noteOf(v, i, done);
      log(note);
      if (done) return { result, fair: v.fair, tries: i + 1, verdict: v, verdicts, note };
    }
  } finally { realtimeDepth--; }
}

function processes() { // [{ pid, cmd }]
  try {
    if (WIN) {
      const ps = "Get-CimInstance Win32_Process -Filter \"CommandLine like '%gmp-%'\" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress";
      const out = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', timeout: 30000, windowsHide: true }).trim();
      const rows = out ? [].concat(JSON.parse(out)) : [];
      return rows.map((r) => ({ pid: r.ProcessId, cmd: r.CommandLine || '' }));
    }
    const out = execFileSync('ps', ['-A', '-ww', '-o', 'pid=', '-o', 'args='], { encoding: 'utf8', timeout: 30000, maxBuffer: 64 << 20 });
    return out.split('\n').map((l) => l.match(/^\s*(\d+)\s+(.*)$/)).filter(Boolean).map((m) => ({ pid: +m[1], cmd: m[2] }));
  } catch { return []; }
}
const usesDir = (cmd, dir) => { const i = cmd.indexOf('--user-data-dir=' + dir); if (i < 0) return false; const c = cmd[i + 16 + dir.length]; return c === undefined || c === ' ' || c === '"'; };

function killTree(pid) {
  if (WIN) { try { execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch { /* gone */ } return; }
  try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ }
}
function killDir(dir, rows = processes()) { // anything still running on this profile (helpers outlive a killed browser a moment)
  for (const r of rows) if (r.pid !== process.pid && usesDir(r.cmd, dir)) killTree(r.pid);
}
function removeDir(dir) {
  for (let i = 0; i < 10; i++) { try { fs.rmSync(dir, { recursive: true, force: true }); return; } catch { sleepSync(200); } }
}
// A tmp folder a test made just for the profile (2026-11-11: a game's tests left ~1,300 empty rigchk-/ch3fx-… shells a day);
// rmdir only takes it while empty, so a folder the test has since put something in stays.
const removeBase = (base) => { if (base) try { fs.rmdirSync(base); } catch { /* not empty, or gone */ } };

// What earlier tests left: browsers with this file's mark (or one of its temp profiles) whose starter is gone, and those profiles.
export function reapStale() {
  const done = [], dirs = new Set(), rows = processes();
  for (const r of rows) { // only browser processes (they carry a profile), never a shell or editor that merely names one
    const d = r.cmd.match(/--user-data-dir=("([^"]+)"|\S+)/);
    if (!d) continue;
    const dir = d[2] || d[1];
    const m = r.cmd.match(/--gmp-test-owner=(\d+)/) || path.basename(dir).match(new RegExp('^' + PREFIX + '(\\d+)-'));
    if (!m || +m[1] === process.pid || alive(+m[1])) continue;
    dirs.add(dir); killTree(r.pid); done.push(`process ${r.pid}`);
  }
  for (const d of dirs) killDir(d);
  try {
    for (const name of fs.readdirSync(os.tmpdir())) {
      const m = name.match(new RegExp('^' + PREFIX + '(\\d+)-'));
      if (!m || +m[1] === process.pid || alive(+m[1])) continue;
      if (name.endsWith('.where')) { // a temp profile made elsewhere (tmp option): this note says where
        try {
          const [d, base] = fs.readFileSync(path.join(os.tmpdir(), name), 'utf8').trim().split('\n');
          if (path.basename(d).startsWith(`${PREFIX}${m[1]}-`)) { removeDir(d); done.push(`profile ${d}`); if (base && path.dirname(d) === base) removeBase(base); }
        } catch { /* gone */ }
        try { fs.rmSync(path.join(os.tmpdir(), name), { force: true }); } catch { /* gone */ }
      } else { removeDir(path.join(os.tmpdir(), name)); done.push(`profile ${name}`); }
    }
  } catch { /* no temp folder listing */ }
  return done;
}

// Apple silicon: always start the browser natively. A shell running under Rosetta passes the translation down the chain even
// through a native Node (2026-11-11: the vehicle-survival game took 198 s to come up in a browser started plainly from an arm64
// Node under a Rosetta shell, 20 s started with arch -arm64), and a translated browser runs many times slower.
function useNative(bin) {
  if (!MAC || !fs.existsSync('/usr/bin/arch')) return false;
  if (nativeOk === null) {
    try { nativeOk = execFileSync('/usr/sbin/sysctl', ['-n', 'hw.optional.arm64'], { encoding: 'utf8' }).trim() === '1'
      && /\d/.test(execFileSync('/usr/bin/arch', ['-arm64', bin, '--version'], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] })); }
    catch { nativeOk = false; }
  }
  return nativeOk;
}

// Where this start's line goes (top of this file): opts.record, else the round's, else the job's, else the current folder's.
export function recordFile(opts = {}) {
  if (opts.record === false) return null;
  if (typeof opts.record === 'string' && opts.record) return path.resolve(opts.record);
  if (process.env.GMP_TRIAL_LOG) return path.resolve(process.env.GMP_TRIAL_LOG);
  if (process.env.CLAUDE_BG_JOB) return path.join(process.env.CLAUDE_BG_JOB, RENDER_LOG);
  return path.join(process.cwd(), '.ai', '试跑', RENDER_LOG);
}

// SystemInfo.getInfo's result → what each kind of drawing runs on, as the browser's feature status says.
const drawnOn = (s) => (!s ? null : /^enabled/.test(s) ? 'gpu' : /software/.test(s) ? 'cpu' : 'off');
const ZH = { webgl: 'WebGL', webgl2: 'WebGL2', canvas2d: 'Canvas 2D ', raster: '整页光栅化', compositing: '合成' };
export function renderInfo(info) {
  const g = (info && info.gpu) || {}, st = g.featureStatus || {}, aux = g.auxAttributes || {};
  const devs = g.devices || [], dev = devs.find((d) => d.active) || devs[0] || {};
  const gpu = [aux.glRenderer, dev.deviceString].find((s) => s && s !== 'Disabled') || '';
  const out = { gpu: gpu || 'none', webgl: drawnOn(st.webgl), webgl2: drawnOn(st.webgl2 || st.webgl), canvas2d: drawnOn(st['2d_canvas']),
    raster: drawnOn(st.rasterization), compositing: drawnOn(st.gpu_compositing) };
  const why = [];
  if (/swiftshader/i.test(`${gpu} ${aux.glImplementationParts || ''} ${aux.displayType || ''}`)) why.push('SwiftShader（软件画的 WebGL）');
  if (!Object.keys(st).length) why.push('浏览器没报画在哪');
  else {
    if (out.webgl !== 'gpu') why.push(out.webgl === 'cpu' ? 'WebGL 在 CPU 上' : '没有 WebGL');
    for (const k of ['canvas2d', 'raster', 'compositing']) if (out[k] !== 'gpu') why.push(`${ZH[k]}不在显卡上`);
  }
  const status = {};
  for (const k of ['webgl', 'webgl2', '2d_canvas', 'rasterization', 'gpu_compositing', 'webgpu']) if (st[k]) status[k] = st[k];
  return { ...out, software: !Object.keys(st).length ? null : why.length > 0, why, status };
}

// What brings a software start back to the GPU: the switches that turn it off, a browser that has only SwiftShader, else the machine.
const OFF_GPU = /^--(disable-gpu(-compositing|-rasterization)?|disable-accelerated-2d-canvas|disable-webgl2?|disable-3d-apis|use-(gl|angle)=\S*swiftshader\S*)(=|$)/;
export function backToGpu(bin, args) {
  const tips = [], off = args.filter((a) => OFF_GPU.test(a));
  if (off.length) tips.push(`去掉参数 ${off.join(' ')}`);
  if (/headless[-_]shell/i.test(path.basename(bin)) || (bin !== CHROME && /ms-playwright|chromium/i.test(bin)))
    tips.push(`换回本机的 Google Chrome（不设 CHROME、不传 chrome；${path.basename(bin)} 只会用 SwiftShader 画）`);
  if (!tips.length) tips.push('这台机器的浏览器拿不到显卡（虚拟机、远程桌面、没有显卡驱动）：改不了就照常跑，只画要看的那几帧');
  return tips;
}

function noteRender(c, info, err) { // once per start: the line in the trial record, and the warning when it drew on the CPU
  if (c.gmpNoted || !c.gmpRecord) return;
  c.gmpNoted = true;
  const r = info ? renderInfo(info) : { gpu: null, software: null,
    why: [err ? `浏览器答不上：${err.message || JSON.stringify(err)}` : '浏览器没答（试跑在它答以前就结束了，或者它没起来）'] };
  const line = { at: new Date().toISOString(), round: process.env.GMP_ROUND || null, job: process.env.CLAUDE_BG_JOB || null,
    cwd: process.cwd(), script: process.argv[1] ? path.basename(process.argv[1]) : null, chrome: c.gmpBin, realtime: !!c.gmpRealtime, ...r };
  try { fs.mkdirSync(path.dirname(c.gmpRecord), { recursive: true }); fs.appendFileSync(c.gmpRecord, JSON.stringify(line) + '\n'); } catch { /* a record never stops a test */ }
  if (r.software) {
    const bar = '!'.repeat(72);
    try {
      process.stderr.write(`\n${bar}\n!! 这一回试跑的浏览器在用 CPU 画画面（${r.why.join('；')}）：会慢，会把 CPU 占满。\n`
        + `!! 回到显卡上：${backToGpu(c.gmpBin, c.gmpArgs).join('；')}。试跑照常往下跑；记在 ${c.gmpRecord}\n${bar}\n\n`);
    } catch { /* no stderr */ }
  }
}

function cleanupAtExit() { // a test that exits (or throws) with its browser still open: end it now, synchronously
  for (const c of live) noteRender(c, null); // it ended before the browser answered: the start still counts
  for (const c of live) {
    if (c.exitCode === null && c.signalCode === null) {
      try { c.kill(WIN ? undefined : 'SIGTERM'); } catch { /* gone */ }
      for (let i = 0; i < 30 && alive(c.pid); i++) sleepSync(100);
      if (alive(c.pid)) killTree(c.pid);
    }
    if (c.gmpTemp) { if (!WIN) killDir(c.gmpDir); removeDir(c.gmpDir); removeBase(c.gmpBase); if (c.gmpWhere) try { fs.rmSync(c.gmpWhere, { force: true }); } catch { /* gone */ } }
  }
}

export function spawnChrome(args = [], opts = {}) {
  if (!reaped) { reaped = true; reapStale(); process.once('exit', cleanupAtExit); }
  const bin = opts.chrome || CHROME;
  let dir = argOf(args, '--user-data-dir'); const temp = !dir; let where = null, ownBase = null;
  if (temp) {
    const base = opts.tmp ? path.resolve(opts.tmp) : os.tmpdir();
    fs.mkdirSync(base, { recursive: true });
    const elsewhere = base !== path.resolve(os.tmpdir());
    if (elsewhere) try { if (fs.readdirSync(base).length === 0) ownBase = base; } catch { /* unreadable: leave it */ }
    dir = fs.mkdtempSync(path.join(base, `${PREFIX}${process.pid}-`));
    if (elsewhere) { where = path.join(os.tmpdir(), path.basename(dir) + '.where'); try { fs.writeFileSync(where, ownBase ? `${dir}\n${ownBase}` : dir); } catch { where = null; } }
  } else try { fs.rmSync(path.join(dir, 'DevToolsActivePort')); } catch { /* a kept profile: the last run's port is not this one */ }
  const extra = [...QUIET, ...LEAN].filter((q) => !args.includes(q));
  const own = args.filter((a) => a.startsWith('--disable-features=')).flatMap((a) => a.slice(19).split(',')).filter(Boolean);
  const features = `--disable-features=${[...new Set([...LEAN_FEATURES, ...own])].join(',')}`; // Chrome reads only one of these
  const all = [...extra, features, `${MARK}${process.pid}`, '--remote-debugging-pipe', ...(temp ? [`--user-data-dir=${dir}`] : []),
    ...args.filter((a) => a !== '--remote-debugging-pipe' && !a.startsWith('--disable-features='))];
  const s = opts.stdio === undefined ? 'ignore' : opts.stdio, three = Array.isArray(s) ? s.slice(0, 3) : [s, s, s];
  const native = opts.native !== false && useNative(bin);
  const realtime = isRealtime(opts);
  let cmd = native ? '/usr/bin/arch' : bin, cargs = native ? ['-arm64', bin, ...all] : all;
  // every other test browser one class down: on a Mac the utility QoS clamp (nice alone made no difference there), elsewhere nice
  if (!realtime && !WIN && fs.existsSync('/usr/bin/nice')) { cargs = ['-n', String(SWEEP_NICE), cmd, ...cargs]; cmd = '/usr/bin/nice'; }
  if (!realtime && MAC && fs.existsSync('/usr/sbin/taskpolicy')) { cargs = ['-c', 'utility', cmd, ...cargs]; cmd = '/usr/sbin/taskpolicy'; }
  const proc = spawn(cmd, cargs, { env: opts.env, cwd: opts.cwd, windowsHide: true, stdio: [...three, 'pipe', 'pipe'] });
  if (!realtime && WIN && proc.pid) try { os.setPriority(proc.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* left as is */ }
  proc.gmpRealtime = realtime;
  const [, , , toChrome, fromChrome] = proc.stdio;
  for (const p of [toChrome, fromChrome]) { p.on('error', () => {}); p.unref?.(); }
  proc.gmpDir = dir; proc.gmpTemp = temp; proc.gmpWhere = where; proc.gmpBase = ownBase;
  proc.gmpBin = bin; proc.gmpArgs = args; proc.gmpRecord = recordFile(opts);
  // The pipe carries two questions: what the browser draws on (asked once now; it answers when it is up) and, at the end, close.
  let buf = '', answered;
  const answer = new Promise((r) => { answered = r; });
  fromChrome.on('data', (d) => {
    buf += d;
    for (let i; (i = buf.indexOf('\0')) >= 0; buf = buf.slice(i + 1)) {
      try { const m = JSON.parse(buf.slice(0, i)); if (m.id === INFO_ID) { noteRender(proc, m.result || null, m.error); answered(); } } catch { /* not ours */ }
    }
  });
  fromChrome.once('close', () => { noteRender(proc, null); answered(); }); // the browser went without answering: the start still counts
  if (proc.gmpRecord) try { toChrome.write(JSON.stringify({ id: INFO_ID, method: 'SystemInfo.getInfo' }) + '\0'); } catch { /* pipe gone */ }
  else answered();
  live.add(proc);
  proc.once('exit', () => live.delete(proc) || true);
  proc.on('error', () => {}); // a missing binary shows as "did not start" in port()
  proc.port = async (ms = 20000) => {
    const f = path.join(dir, 'DevToolsActivePort'); // written for a fixed port too; asking the port could reach another browser
    const t0 = Date.now(), c0 = cpuTimes(), hard = t0 + Math.max(ms, PORT_BUSY_MAX);
    let busy = false;
    for (let end = t0 + ms; ;) {
      if (proc.exitCode !== null || proc.signalCode !== null) break;
      try { const p = +fs.readFileSync(f, 'utf8').split('\n')[0]; if (p > 0) return p; } catch { /* not yet */ }
      if (Date.now() >= end) { // still starting: on a busy computer that is slowness, not a failure (2026-11-14: load 150–247)
        const cpu = cpuSince(c0);
        if (Date.now() < hard && cpu !== null && cpu >= BUSY_CPU) {
          if (!busy) say(`[试跑] 电脑忙（CPU ${Math.round(cpu)}%），浏览器起得慢，接着等它`);
          busy = true; end = Date.now() + 5000;
        } else break;
      }
      await sleep(50);
    }
    throw new Error(`Chrome did not start (${bin})${busy ? `: the computer stayed busy for ${Math.round((Date.now() - t0) / 1000)} s` : ': set CHROME to its path'}`);
  };
  proc.close = async (ms = 5000) => {
    const gone = () => proc.exitCode !== null || proc.signalCode !== null;
    if (!gone()) {
      const ex = new Promise((r) => proc.once('exit', r));
      await Promise.race([answer, ex, upTo(1000)]); // a test shorter than the answer (0.1–0.3 s after the port) still gets its line
      try { toChrome.write(JSON.stringify({ id: 1, method: 'Browser.close' }) + '\0'); toChrome.end(); } catch { /* pipe gone */ }
      await Promise.race([ex, upTo(ms)]);
      if (!gone()) { killTree(proc.pid); await Promise.race([ex, upTo(2000)]); }
    }
    if (!WIN) { await sleep(100); killDir(dir); }
    if (temp) { removeDir(dir); removeBase(ownBase); if (where) try { fs.rmSync(where, { force: true }); } catch { /* gone */ } }
    live.delete(proc);
  };
  return proc;
}

const cli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (cli && process.argv.includes('--reap')) {
  const done = reapStale();
  console.log(done.length ? `cleared: ${done.join(', ')}` : 'nothing left by earlier tests');
} else if (cli && process.argv.includes('--run')) {
  // For a test written in another language: node chrome.mjs --run -- <chrome args>. Prints {"port", "pid"} once the browser
  // is up; keep this process's stdin open while the test runs. The browser ends when stdin closes (the test is done, or gone).
  const i = process.argv.indexOf('--');
  const c = spawnChrome(i > 0 ? process.argv.slice(i + 1) : ['--headless=new', '--remote-debugging-port=0', 'about:blank']);
  let ending = false;
  const end = async () => { if (ending) return; ending = true; await c.close(); process.exit(0); };
  c.once('exit', () => { if (!ending) end(); });
  for (const ev of ['end', 'close', 'error']) process.stdin.on(ev, end);
  for (const sg of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(sg, end);
  process.stdin.resume();
  c.port().then((port) => console.log(JSON.stringify({ port, pid: c.pid })), (e) => { console.error(e.message); end(); });
} else if (cli && process.argv.includes('--fair')) {
  // node chrome.mjs --fair -- <command> [args]: the command as a real-time measurement (top of this file). Its browsers (spawnChrome
  // in it, GMP_REALTIME=1) run at normal priority; a try the computer was busy for is run again; the last line says whether it counts.
  const i = process.argv.indexOf('--'), cmd = i > 0 ? process.argv.slice(i + 1) : [];
  if (!cmd.length) { console.error('usage: node chrome.mjs --fair -- <command> [args]'); process.exit(2); }
  let child = null;
  for (const sg of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(sg, () => { try { child?.kill(sg); } catch { /* gone */ } process.exit(130); });
  const r = await measureFair((n) => new Promise((res) => {
    if (n) say(`\n[量真时间] 第 ${n + 1} 遍（上面那一遍不作数）`);
    child = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit', env: { ...process.env, GMP_REALTIME: '1' }, shell: WIN });
    child.once('error', (e) => { say(`[量真时间] 起不了 ${cmd[0]}：${e.message}`); res(127); });
    child.once('exit', (code, sig) => res(code ?? (sig ? 128 : 1)));
  }));
  console.log(r.note);
  process.exit(r.result);
}
