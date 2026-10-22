# Environment

What the machine must have before a film can be built on it, how to find out, how to install what is missing on macOS, Windows and Linux, and what differs between those systems in ways that break a film.

Load this when: the skill starts on a machine for the first time, a project has been copied to another machine, a tool fails to start, or a shot looks right in a capture and wrong for the owner.

Marking used in this file: **verified** means read from the official source during research on 2026-09-28. **Not verified** means commonly cited and not confirmed then. **Tried** means run on a machine: so far only macOS on Apple silicon.

## 1. Check first

```sh
node scripts/check-environment.mjs                                  # the engine route
node scripts/check-environment.mjs --route hyperframes
node scripts/check-environment.mjs --route both --with audio,video,webkit,blender
node scripts/check-environment.mjs --with audio --venv <film>/analysis/python-env
node scripts/check-environment.mjs --json
```

`scripts/` here is the skill's own folder. `<film>` is the film's folder, a copy of `assets/starter/`; the analysis environment lives inside it.

When neither Node.js nor Bun is on the machine, start it through `scripts/check-environment.sh` (macOS, Linux) or `scripts/check-environment.ps1` (Windows). They say how to install Node.js and stop.

| The checker | |
|---|---|
| Installs nothing | It prints the command. The owner, or the agent with the owner's leave, runs it |
| Reports | The system, the package managers found, each tool with its version and whether it is required, whether links can be made, the graphics backend to use for captures, and advice |
| Exit code | 0 when all that is required is there; 1 when something required is missing or too old; 2 for wrong arguments |
| Tried on | macOS 26 on Apple silicon, under Node.js 24 and under Bun 1.3. The Windows and Linux branches are written from documentation and have not been run |

Installing is a change to the owner's machine. Show what is missing and the commands, and ask before running them.

## 2. What is needed for what

| Tool | Engine route | HyperFrames route | Extra: audio analysis | Extra: video file, clips | Extra: WebKit captures |
|---|---|---|---|---|---|
| Node.js | 20 or later. 22 or later if Playwright is used for captures | 22 or later | | | |
| Bun | 1.3 or later (the starter's package manager and script runner) | | | | |
| git | Recommended. Without it a lost picture cannot be brought back | Recommended | | | |
| Python 3 | 3.9 or later, for the generator of the storyboard | | 3.12 with its own environment | | |
| Python packages | | | librosa, soundfile, numpy, scipy, matplotlib (pinned in the starter's `analysis/requirements.txt`) | | |
| A Chromium-family browser | Required for captures: Chrome, Edge, or the Chromium of Playwright | Its own pinned browser | | | |
| WebKit of Playwright | | | | | Required |
| ffmpeg, ffprobe | | Required | | Required, with the `libx264` encoder: for an export, for a second encode to a size, for the checks of an exported file, and for extracting the frames of a clip into `media/` | |
| Docker | | Only for renders in a container | | | |
| Blender | Only when models are made there | | | | |

The owner's own browser is not in this table and matters most: see section 6.

The single-file build (`bun run single` in a film folder) needs nothing beyond the engine route: Vite, which the starter already has, builds the script, and a script of the starter packs the rest. The file it writes opens in a browser with no server. Every run of ffmpeg on the owner's machine (an export, a second encode, a check of an exported file, extracting a clip) is a heavy run that needs the owner's word; `engine-architecture.md`, sections 4 and 8, has the commands.

## 3. Installing

One command per tool and system, the most standard way first.

### Node.js

| System | Command | Status |
|---|---|---|
| macOS | `brew install node` | verified |
| Windows | `winget install --id OpenJS.NodeJS.LTS -e` | verified |
| Debian, Ubuntu | `curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh && sudo -E bash nodesource_setup.sh && sudo apt install -y nodejs` | verified. The package of the distribution is too old: Ubuntu 24.04 has 18 |
| Fedora | `sudo dnf install nodejs` | not verified |
| Arch | `sudo pacman -S nodejs npm` | not verified |

### Bun

| System | Command | Status |
|---|---|---|
| macOS, Linux | `curl -fsSL https://bun.com/install \| bash` | verified. Linux needs `unzip` |
| Windows | `powershell -c "irm bun.sh/install.ps1 \| iex"` | verified |

### git

| System | Command | Status |
|---|---|---|
| macOS | `brew install git` | not verified; the system offers its own on first use |
| Windows | `winget install --id Git.Git -e --source winget` | verified |
| Linux | `sudo apt install git`, `sudo dnf install git`, `sudo pacman -S git` | not verified |

### Python

| System | Command | Status |
|---|---|---|
| macOS | `brew install python@3.12` | not verified |
| Windows | `winget install --id Python.Python.3.12` | verified |
| Ubuntu 24.04 | `sudo apt install python3.12 python3.12-venv python3-pip` | the release ships 3.12 |
| Debian 12 | Ships 3.11. Use `uv python install 3.12` | verified |
| Fedora | `sudo dnf install python3.12` | not verified |
| Arch | The system's Python is always the newest. Use `uv python install 3.12` | verified |
| Any | `uv python install 3.12`, after installing uv: `curl -LsSf https://astral.sh/uv/install.sh \| sh`, on Windows `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 \| iex"` | verified |

The environment for analysis, once Python is there, made inside the film folder:

```sh
python3.12 -m venv analysis/python-env
analysis/python-env/bin/python -m pip install -r analysis/requirements.txt
```

On Windows: `py -3.12 -m venv analysis\python-env`, and the interpreter is `analysis\python-env\Scripts\python.exe`. An environment made on one machine does not run on another: make it again. The pins were resolved on macOS; if one has no build for another system, install the unpinned set `librosa soundfile numpy scipy matplotlib` instead (not tried yet). On Windows 11 with Python 3.13 every pin installed, on 2026-09-28.

The ready-made builds of `soundfile` for Windows, macOS and Linux on x86-64 carry their sound library with them. Only where no such build fits does the system need it: `sudo apt install libsndfile1`.

### A browser for captures

| System | Command | Status |
|---|---|---|
| macOS | `brew install --cask google-chrome` | not verified |
| Windows | `winget install --id Google.Chrome -e` | not verified |
| Any | `npx playwright install chromium` | verified |

Captures must run in a browser that draws on the graphics card. Playwright's default headless browser is a "headless shell" that draws WebGL in software: too slow to judge a film, and different in its results. Start the full browser: the system's Chrome (`channel: 'chrome'`) or the full Chromium of Playwright (`channel: 'chromium'`).

### WebKit

`npx playwright install webkit`, on Linux with `--with-deps`. Verified.

On Windows and Linux this WebKit is a real build of the engine and is not a stand-in for Safari where sound and video are concerned. Playwright's own documentation says that for the closest thing to Safari, WebKit is run on a Mac.

### ffmpeg

| System | Command | `libx264` | Status |
|---|---|---|---|
| macOS | `brew install ffmpeg` | yes | verified |
| Windows | `winget install --id=Gyan.FFmpeg -e` | yes, in the full build | verified |
| Ubuntu | `sudo apt install ffmpeg` | yes | verified |
| Debian | `sudo apt install ffmpeg` | not confirmed: check with `ffmpeg -encoders` | open |
| Fedora | The default package has none. Add RPM Fusion, then `sudo dnf install ffmpeg` | yes, from RPM Fusion | not verified |
| Arch | `sudo pacman -S ffmpeg` | yes | not verified |

The AAC encoder is built into every standard ffmpeg. Only `libx264` is worth checking, and the checker does.

### Blender

`brew install --cask blender`, `winget install --id BlenderFoundation.Blender -e`, or the package of the distribution. On macOS the program is not on the path: call `/Applications/Blender.app/Contents/MacOS/Blender`. Run without a window with `blender -b file.blend -P script.py`; the arguments are executed in the order given.

## 4. What differs between systems

### Links in the public folder

The reference app served the music and the data to the page through symbolic links in its public folder, and they broke when the project was copied. The starter has no links: `vite.config.ts` serves `audio/` and `data/` itself. Keep it that way. The table below matters only for a project that links folders anyway.

| System | Behaviour | Do |
|---|---|---|
| macOS, Linux | Links work | Nothing |
| Windows | Making a symbolic link needs Developer Mode or a shell run as administrator | Switch on Developer Mode; or use a directory junction, which needs neither (`mklink /J`, or in Node.js `fs.symlinkSync(target, path, 'junction')`); or copy the folders |
| A disk formatted as exFAT or FAT | Links are lost in the copy | Make them again with the project's set-up script |
| git on Windows | When it cannot make links it writes small text files in their place, silently | Check that the links are folders after a clone |

A junction works only for folders and only on one disk. That is enough for a public folder.

### The graphics backend

Chrome draws WebGL through a layer that speaks to the system's own graphics interface. The flag `--use-angle` chooses it.

| System | Default | Flag for captures | If that fails |
|---|---|---|---|
| macOS | Metal | `--use-angle=metal` | `--use-angle=gl` |
| Windows | Direct3D 11 | `--use-angle=d3d11`, or no flag | `--use-angle=gl`, `--use-angle=vulkan` |
| Linux with a graphics card | OpenGL | `--use-angle=gl` | `--use-angle=vulkan` |
| Linux without one, containers | None | `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` | Software drawing: judge pictures, not speed |
| WSL | Not established | Treat as software drawing | Judge speed on the Windows side |

The values are verified from the source of Chromium. `metal` exists only on macOS, `d3d11` only on Windows. A capture tool that names one of them must choose by system. The starter's capture tool does: `metal` on macOS, `d3d11` on Windows, `gl` on Linux, and `--angle` overrides it.

Ask the browser what it draws with, before trusting a measurement: the unmasked renderer string of WebGL names the backend and the card. The starter's capture tool has a mode for it: `bun scripts/render.ts gpu`.

### A slow path on Windows

Uploading a 2D canvas into an sRGB texture is slow in Chrome on Windows. The cause lies in the Direct3D path and is a known issue of the browser. On macOS the same upload takes half a millisecond for a frame of 1080 by 1920 (tried).

Fix, in the engine: upload the canvas into a plain RGBA8 texture, then copy it into the sRGB texture with a small pass on the graphics card. The rest of the code still receives an sRGB texture. The starter carries this fix in `src/engine/gl.ts`. It was written from a description of the fix made on the owner's Windows machine, not from its code, and has been run on macOS only; it has not yet been compared on Windows. When checking that fix, compare a still of one moment on both systems: the copy must turn the canvas values into linear light, or every 2D layer comes out too bright.

### Windows, further

| Matter | Fact | Do |
|---|---|---|
| Running an install script | The default policy blocks scripts from the network | For one process: `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process` |
| `python` opens the Store | Windows ships stubs named `python.exe` that open the Store | Settings, "Manage app execution aliases", switch the two Python entries off |
| Which Python | The launcher `py -3.12` chooses among installed versions | Use it, or the full path of the environment's interpreter |
| Long paths | Paths over 260 characters fail unless long paths are enabled | Keep the project near the root of the disk |
| Line endings | A shell script checked out with Windows line endings fails under bash | A `.gitattributes` entry that keeps `*.sh` with Unix endings |
| After installing | A new tool is not on the path of terminals that were already open | Open a new terminal |
| Disk | Long renders can fill the system disk | Put caches on another disk |

### macOS

| Matter | Fact |
|---|---|
| Homebrew's folder | `/opt/homebrew` on Apple silicon, `/usr/local` on Intel. Ask `brew --prefix`; never write the path into a script |
| A downloaded program is blocked | Open it once through System Settings, Privacy and Security, "Open Anyway" |

### Linux

`npx playwright install-deps` installs the libraries and fonts a headless browser needs. Behind a proxy it must be given the proxy explicitly, since it drops the environment when it becomes root.

## 5. Copying a project to another machine

| Step | Why |
|---|---|
| Leave out installed packages, the Python environment and capture output | They are made again, or are scratch. They are most of the size |
| Keep the secrets file out of anything public | It travels with a copy of the folder |
| Run the checker on the new machine | Before anything else |
| Install and check the project | `bun install` and `bun run typecheck` in the film folder. A project that links folders makes its links again here |
| Make the Python environment again | It does not travel |
| Bring the assistant's memory along | It lives outside the project. Keep a copy inside the project and restore it |
| Put the project under version control | So that the two copies can be compared and joined later |
| Decide which copy is the newer | After the first fix on the new machine the two differ. Never copy engine files from the older over the newer |

From practice: a project copied from macOS to Windows ran, and was slow. The cause was the upload described above, fixed on the Windows copy only. From then on the Windows copy was the newer one.

## 6. The owner's browser

The capture browser and the owner's browser are often not the same. A shot can be right in every capture and blank on the owner's screen.

| Feature | Chrome | Safari | Do |
|---|---|---|---|
| The `filter` property of the 2D canvas | Yes | Missing in the versions met in practice. Landed in the engine's source in 2024; the stable version that has it is not established | Do not use it in shots. Engine code that patches it must check that it exists |
| `letterSpacing` of the 2D canvas | Yes | From 18.4 | Do not let a layout depend on it |
| `roundRect` | Yes | From 16.4 | Safe |
| `OffscreenCanvas` | Yes | Usable from 16.4 | Safe in current versions |
| Rendering into float textures | Yes | Half-float is the safe choice; full float depends on the hardware and is absent on phones | Use half-float targets |
| Sound that starts by itself | Needs a gesture in both | | The owner presses play: no issue for a studio. It matters only for tools that start sound unattended |

How to find a fault in the owner's browser:

1. Ask which browser they use. Or read it from the development server's log: a stack with frames of the form `name@http://...` and `[native code]` is WebKit.
2. Read the errors the page sends to the server log. Make sure the server is set to pass the browser's console on; it may do so only when started by an agent.
3. Reproduce in the WebKit of Playwright, on a Mac if the owner uses Safari.
4. Fix in the engine if the engine is at fault; in the shot otherwise.

Do not answer a report of a blank shot with a guess.

## 7. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The page loads and has no sound or no data | The file is not in `audio/` or `data/` under the name in `src/project-config.ts` (the starter answers 404); in a project with links, the links are missing | Put the file there; make links again, on Windows as junctions |
| Captures are very slow and look slightly different | The headless shell draws in software | Start the full browser |
| The capture tool fails to start the browser on Windows or Linux | It asks for a backend of another system | Choose the flag by system |
| Everything is slow on Windows and fast on the Mac | The canvas upload | The fix above |
| A shot is blank for the owner, fine in captures | A feature their browser lacks | Section 6 |
| The single-file page opens blank in one browser | Only Chrome on Windows has opened it so far. It needs inline module scripts, `Response` objects made in the page, `createImageBitmap` and blob URLs, which current browsers have | Read that browser's console; report which browser and version |
| `python` does nothing on Windows | The Store stub | Switch off the alias |
| The Python environment fails after a copy | It holds paths of the old machine | Make it again |
| A tool was installed and is "not found" | The terminal is older than the installation | Open a new one |
| Two projects answer on the same port and the capture shows the wrong film | The capture tool took whichever server answered | One port per project, and a marker in the page that names the project |
| The measured frame time is good and playback stutters | The measurement was made on another system or browser than the owner's | Measure where the film is watched |
