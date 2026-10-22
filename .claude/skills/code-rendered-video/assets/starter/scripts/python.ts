#!/usr/bin/env bun
// Runs a Python script with the first Python 3 this machine has, so one command works on macOS,
// Linux and Windows: `python3` (macOS, Linux), then `python`, then `py -3` (the Windows launcher).
// On Windows `python3` is often a stub of the Microsoft Store that prints a hint and fails, so every
// candidate is first asked for its version and taken only when it answers with Python 3.
//
//   bun scripts/python.ts scripts/build-shot-files.py [args...]     (package.json: bun run shots)
//
// PYTHON=/path/to/python overrides the search.
const CANDIDATES: string[][] = process.env.PYTHON ? [[process.env.PYTHON]] : [['python3'], ['python'], ['py', '-3']];

function works(cmd: string[]) {
  try {
    const r = Bun.spawnSync([...cmd, '-c', 'import sys; print(sys.version_info[0])'], { stdout: 'pipe', stderr: 'ignore' });
    return r.exitCode === 0 && r.stdout.toString().trim() === '3';
  } catch { return false; } // not on PATH
}

const python = CANDIDATES.find(works);
if (!python) {
  console.error(`no Python 3 found (tried ${CANDIDATES.map((c) => c.join(' ')).join(', ')}). Install Python 3, or set PYTHON to its path.`);
  process.exit(127);
}
const proc = Bun.spawn([...python, ...process.argv.slice(2)], { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' });
process.exit(await proc.exited);
