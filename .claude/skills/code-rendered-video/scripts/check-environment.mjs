#!/usr/bin/env node
// Checks the operating system and the tools the code-rendered-video skill needs, and prints the
// command that installs whatever is missing. It never installs anything itself.
//
//   node check-environment.mjs                      the engine route: build a film and watch it in the studio
//   node check-environment.mjs --route hyperframes  the HyperFrames route
//   node check-environment.mjs --route both
//   node check-environment.mjs --with audio,video,webkit,blender
//                                                   audio   analysis of a music track (Python packages)
//                                                   video   export of a video file (ffmpeg with libx264 and aac)
//                                                   webkit  captures in WebKit, the engine of Safari
//                                                   blender models made in Blender
//   node check-environment.mjs --venv DIR           look for the Python packages inside this environment
//   node check-environment.mjs --online             also run the checks that download (npx hyperframes)
//   node check-environment.mjs --json               the same findings as JSON
//
// Exit code: 0 when everything required is there, 1 when something required is missing or too old,
// 2 when the arguments are wrong.
//
// No dependencies. Runs on Node.js 18 or later, and on Bun.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ------------------------------------------------------------------ arguments
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const ROUTES = ['engine', 'hyperframes', 'both'];
const EXTRAS = ['audio', 'video', 'webkit', 'blender'];
const route = opt('route', 'engine');
const extras = (opt('with', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
if (flag('help') || flag('h')) {
  // the comment at the head of this file, up to the first line of code
  const lines = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1);
  const head = lines.slice(0, lines.findIndex((l) => !l.startsWith('//')));
  console.log(head.map((l) => l.slice(3)).join('\n'));
  process.exit(0);
}
if (!ROUTES.includes(route)) { console.error(`--route must be one of: ${ROUTES.join(', ')}`); process.exit(2); }
for (const e of extras) if (!EXTRAS.includes(e)) { console.error(`--with takes: ${EXTRAS.join(', ')} (got "${e}")`); process.exit(2); }
const wantEngine = route === 'engine' || route === 'both';
const wantHyperframes = route === 'hyperframes' || route === 'both';
const want = (e) => extras.includes(e);

// ------------------------------------------------------------------ the machine
const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';
const IS_LINUX = process.platform === 'linux';
const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
const IS_WSL = IS_LINUX && /microsoft/i.test(read('/proc/version'));

/** Full path of a program on PATH, or null. Does not start a process. */
function which(bin) {
  const dirs = (process.env.PATH || process.env.Path || '').split(path.delimiter).filter(Boolean);
  const exts = IS_WIN ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const d of dirs) {
    for (const e of exts) {
      const f = path.join(d, IS_WIN && path.extname(bin) ? bin : bin + e);
      try { if (fs.statSync(f).isFile()) return f; } catch {
        // (on Windows, winget and the Store's python stubs are app aliases in WindowsApps: links
        // that stat cannot follow but that run; lstat still sees them)
        try { if (IS_WIN && fs.lstatSync(f).isSymbolicLink()) return f; } catch { /* not here */ }
      }
    }
  }
  return null;
}

/** Runs a program and returns what it printed (both streams), or null when it could not be run. */
function run(file, args = [], timeout = 20000) {
  // (a .cmd or .bat file on Windows is only started through the shell)
  const viaShell = IS_WIN && /\.(cmd|bat)$/i.test(file);
  const r = viaShell
    ? spawnSync(`"${file}" ${args.join(' ')}`, { encoding: 'utf8', timeout, shell: true, windowsHide: true })
    : spawnSync(file, args, { encoding: 'utf8', timeout, windowsHide: true });
  if (r.error || r.status === null) return null;
  return { code: r.status, text: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

const parseVersion = (s) => { const m = /(\d+)\.(\d+)(?:\.(\d+))?/.exec(s || ''); return m ? [+m[1], +m[2], +(m[3] || 0)] : null; };
const atLeast = (v, min) => { for (let i = 0; i < 3; i++) { if ((v[i] || 0) !== (min[i] || 0)) return (v[i] || 0) > (min[i] || 0); } return true; };
const show = (v) => (v ? v.join('.') : '');

const osName = () => {
  if (IS_MAC) { const r = which('sw_vers') && run('sw_vers', ['-productVersion']); return `macOS ${r ? r.text : os.release()}`; }
  if (IS_WIN) return `Windows ${os.release()}`;
  const m = /^PRETTY_NAME="?([^"\n]+)/m.exec(read('/etc/os-release'));
  return `${m ? m[1] : `Linux ${os.release()}`}${IS_WSL ? ' (WSL)' : ''}`;
};

/** On Windows: the launcher's flag for the newest installed Python from 3.10 to 3.13 (`-3.13`), else `-3`. */
function pySafeFlag() {
  const py = IS_WIN && which('py');
  const r = py && run(py, ['-0']);
  const minors = [...((r && r.text) || '').matchAll(/-V:3\.(\d+)/g)].map((m) => +m[1]).filter((n) => n >= 10 && n <= 13);
  return minors.length ? `-3.${Math.max(...minors)}` : '-3';
}

const MANAGERS = [['brew', 'brew'], ['winget', 'winget'], ['scoop', 'scoop'], ['choco', 'choco'], ['apt', 'apt-get'], ['dnf', 'dnf'], ['pacman', 'pacman']];
const managers = MANAGERS.filter(([, bin]) => which(bin)).map(([name]) => name);

// ------------------------------------------------------------------ how to install
// For each tool: the ways to install it, best first. `on` names a package manager that must be
// present, or an operating system ('mac', 'win', 'linux', 'posix', 'any').
const INSTALL = {
  node: [
    { on: 'brew', cmd: 'brew install node' },
    { on: 'winget', cmd: 'winget install --id OpenJS.NodeJS.LTS -e' },
    { on: 'scoop', cmd: 'scoop install nodejs-lts' },
    { on: 'choco', cmd: 'choco install nodejs-lts' },
    { on: 'apt', cmd: 'curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh && sudo -E bash nodesource_setup.sh && sudo apt install -y nodejs', note: 'the package of the distribution is too old' },
    { on: 'dnf', cmd: 'sudo dnf install nodejs' },
    { on: 'pacman', cmd: 'sudo pacman -S nodejs npm' },
    { on: 'any', cmd: 'https://nodejs.org/en/download' },
  ],
  bun: [
    { on: 'posix', cmd: 'curl -fsSL https://bun.com/install | bash' },
    { on: 'win', cmd: 'powershell -c "irm bun.sh/install.ps1 | iex"' },
  ],
  git: [
    { on: 'brew', cmd: 'brew install git' },
    { on: 'winget', cmd: 'winget install --id Git.Git -e --source winget' },
    { on: 'scoop', cmd: 'scoop install git' },
    { on: 'choco', cmd: 'choco install git -y' },
    { on: 'apt', cmd: 'sudo apt install -y git' },
    { on: 'dnf', cmd: 'sudo dnf install git' },
    { on: 'pacman', cmd: 'sudo pacman -S git' },
  ],
  python: [
    { on: 'brew', cmd: 'brew install python@3.12' },
    { on: 'winget', cmd: 'winget install --id Python.Python.3.12' },
    { on: 'apt', cmd: 'sudo apt install -y python3 python3-venv python3-pip' },
    { on: 'dnf', cmd: 'sudo dnf install python3.12' },
    { on: 'pacman', cmd: 'sudo pacman -S python' },
    { on: 'any', cmd: 'uv python install 3.12', note: 'needs uv' },
  ],
  uv: [
    { on: 'posix', cmd: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
    { on: 'win', cmd: 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"' },
  ],
  browser: [
    { on: 'brew', cmd: 'brew install --cask google-chrome' },
    { on: 'winget', cmd: 'winget install --id Google.Chrome -e' },
    { on: 'any', cmd: 'npx playwright install chromium', note: 'the Chromium of Playwright, inside the project' },
  ],
  webkit: [
    { on: 'linux', cmd: 'npx playwright install --with-deps webkit' },
    { on: 'any', cmd: 'npx playwright install webkit' },
  ],
  ffmpeg: [
    { on: 'brew', cmd: 'brew install ffmpeg' },
    { on: 'winget', cmd: 'winget install --id=Gyan.FFmpeg -e' },
    { on: 'scoop', cmd: 'scoop install ffmpeg' },
    { on: 'choco', cmd: 'choco install ffmpeg-full' },
    { on: 'apt', cmd: 'sudo apt install -y ffmpeg' },
    { on: 'dnf', cmd: 'sudo dnf install https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm && sudo dnf install ffmpeg', note: 'the default package has no libx264' },
    { on: 'pacman', cmd: 'sudo pacman -S ffmpeg' },
  ],
  blender: [
    { on: 'brew', cmd: 'brew install --cask blender' },
    { on: 'winget', cmd: 'winget install --id BlenderFoundation.Blender -e' },
    { on: 'apt', cmd: 'sudo apt install -y blender' },
    { on: 'dnf', cmd: 'sudo dnf install blender' },
    { on: 'pacman', cmd: 'sudo pacman -S blender' },
  ],
  hyperframes: [{ on: 'any', cmd: 'npx hyperframes doctor', note: 'nothing to install: npx fetches it; doctor checks its own needs' }],
  packages: [
    { on: 'win', cmd: `py ${IS_WIN ? pySafeFlag() : '-3'} -m venv analysis\\python-env; analysis\\python-env\\Scripts\\python.exe -m pip install -r analysis\\requirements.txt`, note: 'in the film folder; if a pinned version fails, install librosa soundfile numpy scipy matplotlib instead' },
    { on: 'posix', cmd: 'python3 -m venv analysis/python-env && analysis/python-env/bin/python -m pip install -r analysis/requirements.txt', note: 'in the film folder; if a pinned version fails, install librosa soundfile numpy scipy matplotlib instead' },
  ],
};
function howToInstall(tool) {
  const ok = (on) => on === 'any' || managers.includes(on) || (on === 'mac' && IS_MAC) || (on === 'win' && IS_WIN) || (on === 'linux' && IS_LINUX) || (on === 'posix' && !IS_WIN);
  const way = (INSTALL[tool] || []).find((w) => ok(w.on));
  return way ? { command: way.cmd, note: way.note || '' } : null;
}

// ------------------------------------------------------------------ the checks
const tools = [];
/** Records one finding. `level`: 'required', 'recommended' or 'optional'. */
function record({ id, name, level, found, version, needs, note, install }) {
  const min = needs ? parseVersion(needs) : null;
  const old = !!(found && min && version && !atLeast(version, min));
  const status = !found ? 'missing' : old ? 'old' : 'ok';
  const t = { id, name, level, status, version: show(version), needs: needs || '', path: typeof found === 'string' ? found : '', note: note || '' };
  if (status !== 'ok') t.install = howToInstall(install || id);
  tools.push(t);
  return t;
}
const versionOf = (file, args = ['--version']) => { const r = file && run(file, args); return r ? parseVersion(r.text) : null; };

function checkNode(needs, level) {
  const f = which('node');
  const v = versionOf(f);
  const t = record({ id: 'node', name: 'Node.js', level, found: f, version: v, needs });
  if (t.status === 'ok' && v && v[0] < 22) t.note = 'Playwright and HyperFrames ask for 22 or later';
}
function checkPython(level) {
  const tries = IS_WIN ? [['py', ['-3', '--version']], ['python', ['--version']], ['python3', ['--version']]] : [['python3', ['--version']], ['python', ['--version']]];
  for (const [bin, args] of tries) {
    const f = which(bin);
    if (!f) continue;
    const r = run(f, args);
    const v = r && r.code === 0 ? parseVersion(r.text) : null;
    if (!v) {
      // (on Windows a file of this name may be the stub that opens the Store instead of running)
      if (IS_WIN && /WindowsApps/i.test(f)) continue;
      continue;
    }
    const venv = run(f, [...args.slice(0, -1), '-c', 'import venv, ensurepip']);
    const t = record({ id: 'python', name: 'Python 3', level, found: f, version: v, needs: '3.9' });
    t.command = [bin, ...args.slice(0, -1)].join(' ');
    if (venv && venv.code !== 0) t.note = 'the venv module is missing (Debian and Ubuntu: sudo apt install python3-venv)';
    else if (v[0] === 3 && v[1] >= 14) t.note = 'newer than 3.13: some audio packages may have no ready-made build yet; a 3.12 or 3.13 environment is the safe choice';
    return t;
  }
  const stub = IS_WIN && which('python') && /WindowsApps/i.test(which('python'));
  return record({ id: 'python', name: 'Python 3', level, found: null, needs: '3.9', note: stub ? 'only the Store stub was found: switch it off under "Manage app execution aliases"' : '' });
}
function findBrowser() {
  const home = os.homedir();
  const env = process.env;
  const list = IS_MAC
    ? [['Google Chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'], ['Google Chrome', `${home}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`], ['Chromium', '/Applications/Chromium.app/Contents/MacOS/Chromium'], ['Microsoft Edge', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']]
    : IS_WIN
      ? [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean).flatMap((d) => [['Google Chrome', path.join(d, 'Google', 'Chrome', 'Application', 'chrome.exe')], ['Microsoft Edge', path.join(d, 'Microsoft', 'Edge', 'Application', 'msedge.exe')]])
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'].map((b) => [b, which(b)]);
  for (const [name, f] of list) {
    if (!f || !fs.existsSync(f)) continue;
    let v = null;
    if (IS_WIN) {
      // (chrome.exe prints no version on Windows: the folder next to it is named after the version)
      const dirs = fs.readdirSync(path.dirname(f)).map(parseVersion).filter(Boolean);
      v = dirs.sort((a, b) => (atLeast(a, b) ? -1 : 1))[0] || null;
    } else v = versionOf(f);
    return { name, file: f, version: v };
  }
  return null;
}
function playwrightBrowsers() {
  const dir = process.env.PLAYWRIGHT_BROWSERS_PATH && process.env.PLAYWRIGHT_BROWSERS_PATH !== '0'
    ? process.env.PLAYWRIGHT_BROWSERS_PATH
    : IS_MAC ? path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
      : IS_WIN ? path.join(process.env.LOCALAPPDATA || os.homedir(), 'ms-playwright')
        : path.join(os.homedir(), '.cache', 'ms-playwright');
  let names = [];
  try { names = fs.readdirSync(dir); } catch { /* none installed */ }
  const has = (p) => names.some((n) => n.startsWith(p));
  return { dir, chromium: has('chromium-'), headlessShell: has('chromium_headless_shell-'), webkit: has('webkit-') };
}
function checkFfmpeg(level) {
  const f = which('ffmpeg');
  const t = record({ id: 'ffmpeg', name: 'ffmpeg', level, found: f, version: versionOf(f, ['-version']), needs: '5.0' });
  record({ id: 'ffprobe', name: 'ffprobe', level, found: which('ffprobe'), version: versionOf(which('ffprobe'), ['-version']), install: 'ffmpeg' });
  if (f) {
    const enc = run(f, ['-hide_banner', '-encoders']);
    const has = (n) => !!enc && new RegExp(`\\s${n}\\s`).test(enc.text);
    t.encoders = { libx264: has('libx264'), aac: has('aac') };
    if (!t.encoders.libx264) { t.status = 'old'; t.note = 'this build has no libx264 encoder'; t.install = howToInstall('ffmpeg'); }
  }
}
function checkPackages(venvDir) {
  const py = venvDir ? path.join(venvDir, IS_WIN ? 'Scripts' : 'bin', IS_WIN ? 'python.exe' : 'python') : null;
  if (!py || !fs.existsSync(py)) {
    record({ id: 'packages', name: 'Python packages for audio analysis', level: 'required', found: null, note: venvDir ? `no Python environment at ${venvDir}` : 'pass --venv DIR to look inside an environment' });
    return;
  }
  const mods = ['librosa', 'soundfile', 'numpy', 'scipy', 'matplotlib'];
  const r = run(py, ['-c', `import importlib.util as u, json; print(json.dumps({m: bool(u.find_spec(m)) for m in ${JSON.stringify(mods)}}))`], 60000);
  let missing = mods;
  try { const j = JSON.parse(r.text.split('\n').pop()); missing = mods.filter((m) => !j[m]); } catch { /* could not ask */ }
  record({ id: 'packages', name: 'Python packages for audio analysis', level: 'required', found: missing.length ? null : py, note: missing.length ? `missing: ${missing.join(', ')}` : '' });
}

const coreLevel = wantEngine ? 'required' : 'optional';
checkNode(wantHyperframes ? '22.0' : '20.0', 'required');
record({ id: 'bun', name: 'Bun', level: coreLevel, found: which('bun'), version: versionOf(which('bun')), needs: '1.3' });
record({ id: 'git', name: 'git', level: 'recommended', found: which('git'), version: versionOf(which('git')) });
checkPython(wantEngine || want('audio') ? 'required' : 'optional');

const browser = findBrowser();
const pw = playwrightBrowsers();
record({
  id: 'browser', name: 'Chromium-family browser for captures', level: coreLevel,
  found: browser ? browser.file : pw.chromium ? pw.dir : null, version: browser ? browser.version : null,
  note: browser ? browser.name : pw.chromium ? 'the Chromium of Playwright' : pw.headlessShell ? 'only the headless shell of Playwright is installed: it draws WebGL in software, too slow for judging a film' : '',
});
if (want('webkit')) record({ id: 'webkit', name: 'WebKit of Playwright', level: 'required', found: pw.webkit ? pw.dir : null, note: IS_MAC ? '' : 'on this system it is not a stand-in for Safari where audio and video are concerned' });
if (want('video') || wantHyperframes) checkFfmpeg('required');
if (want('audio')) { checkPackages(opt('venv', '')); record({ id: 'uv', name: 'uv', level: 'optional', found: which('uv'), version: versionOf(which('uv')) }); }
if (want('blender')) {
  const b = which('blender') || (IS_MAC && fs.existsSync('/Applications/Blender.app/Contents/MacOS/Blender') ? '/Applications/Blender.app/Contents/MacOS/Blender' : null);
  record({ id: 'blender', name: 'Blender', level: 'required', found: b, version: versionOf(b), note: b && !which('blender') ? 'not on PATH: call it by its full path' : '' });
}
if (wantHyperframes) {
  const npx = which('npx');
  let v = null, note = 'not run: pass --online to let npx fetch it';
  if (npx && flag('online')) {
    const r = run(npx, ['--yes', 'hyperframes', '--version'], 120000);
    v = r && r.code === 0 ? parseVersion(r.text) : null;
    note = v ? 'run "npx hyperframes doctor" for its own checks' : 'npx could not run it';
  }
  record({ id: 'hyperframes', name: 'HyperFrames CLI', level: flag('online') ? 'required' : 'optional', found: flag('online') ? (v ? npx : null) : npx, version: v, note });
  record({ id: 'docker', name: 'Docker', level: 'optional', found: which('docker'), version: versionOf(which('docker')), note: 'only for reproducible renders in a container' });
}

// ------------------------------------------------------------------ what the machine can do
function canLink() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'crv-link-'));
  const target = path.join(base, 'target');
  fs.mkdirSync(target);
  const out = { symlink: false, junction: null };
  try { fs.symlinkSync(target, path.join(base, 'link'), 'dir'); out.symlink = true; } catch { /* not allowed */ }
  if (IS_WIN) { try { fs.symlinkSync(target, path.join(base, 'junction'), 'junction'); out.junction = true; } catch { out.junction = false; } }
  try { fs.rmSync(base, { recursive: true, force: true }); } catch { /* leave it to the system */ }
  return out;
}
let freeGb = null;
try { const s = fs.statfsSync(process.cwd()); freeGb = Math.round((s.bavail * s.bsize) / 2 ** 30); } catch { /* not available on this runtime */ }
const links = canLink();
const capabilities = {
  symlink: links.symlink,
  junction: links.junction,
  cpuCores: os.cpus().length,
  memoryGb: Math.round(os.totalmem() / 2 ** 30),
  freeDiskGb: freeGb,
  // the graphics backend Chrome should be started with for captures
  angle: IS_MAC ? 'metal' : IS_WIN ? 'd3d11' : 'gl',
  angleFallback: IS_MAC ? 'gl' : IS_WIN ? 'gl' : 'swiftshader',
};
const advice = [];
if (!links.symlink) advice.push(IS_WIN
  ? `Symbolic links cannot be made here. The starter does not need them; this matters only for a project that links folders. Switch on Developer Mode, or run the shell as administrator${links.junction ? ', or use directory junctions, which work on this machine' : ''}.`
  : 'Symbolic links cannot be made in the temporary folder. The starter does not need them; this matters only for a project that links folders.');
if (IS_WSL) advice.push('This is WSL. Expect Chrome to draw WebGL in software there; judge frame rates on the Windows side.');
if (IS_WIN) advice.push('On Windows, Chrome draws WebGL through Direct3D 11. Uploading a canvas into an sRGB texture is slow on that path: upload into a plain RGBA8 texture and convert on the GPU. The starter does this in src/engine/gl.ts.');
if (IS_LINUX && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) advice.push('No display was found. Headless Chrome needs --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader to draw WebGL without a GPU.');
if (freeGb !== null && freeGb < 5) advice.push(`Only ${freeGb} GB of disk are free. Captures and a video export need room.`);
if (!managers.length) advice.push(IS_MAC ? 'No package manager was found. Homebrew: https://brew.sh' : IS_WIN ? 'No package manager was found. winget comes with "App Installer" from the Microsoft Store.' : 'No known package manager was found.');

// ------------------------------------------------------------------ the report
const blocking = tools.filter((t) => t.level === 'required' && t.status !== 'ok');
const result = {
  ok: blocking.length === 0,
  route, extras,
  os: { name: osName(), platform: process.platform, arch: process.arch, wsl: IS_WSL },
  packageManagers: managers,
  tools, capabilities, advice,
};
if (flag('json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`${result.os.name}, ${result.os.arch}   package managers: ${managers.join(', ') || 'none found'}`);
  console.log(`${capabilities.cpuCores} cores, ${capabilities.memoryGb} GB memory${freeGb !== null ? `, ${freeGb} GB free disk` : ''}   route: ${route}${extras.length ? `, with ${extras.join(', ')}` : ''}\n`);
  const mark = { ok: 'ok     ', old: 'OLD    ', missing: 'MISSING' };
  for (const t of tools) {
    const needs = t.needs ? `needs ${t.needs}` : '';
    console.log(`${mark[t.status]}  ${pad(t.name, 38)} ${pad(t.version || (t.status === 'ok' ? 'found' : ''), 12)} ${pad(t.level, 12)} ${[needs, t.note].filter(Boolean).join('; ')}`);
  }
  const todo = tools.filter((t) => t.status !== 'ok' && t.install);
  if (todo.length) {
    console.log('\nTo install:');
    for (const t of todo) console.log(`  ${pad(`${t.name} (${t.level})`, 50)} ${t.install.command}${t.install.note ? `   (${t.install.note})` : ''}`);
  }
  console.log(`\nGraphics backend for captures: --use-angle=${capabilities.angle} (if that fails: ${capabilities.angleFallback})`);
  console.log(`Links: symbolic ${links.symlink ? 'yes' : 'NO'}${IS_WIN ? `, junction ${links.junction ? 'yes' : 'NO'}` : ''}`);
  for (const a of advice) console.log(`Note: ${a}`);
  console.log(result.ok ? '\nEverything required is there.' : `\n${blocking.length} required tool${blocking.length > 1 ? 's are' : ' is'} missing or too old: ${blocking.map((t) => t.name).join(', ')}.`);
}
process.exit(result.ok ? 0 : 1);
