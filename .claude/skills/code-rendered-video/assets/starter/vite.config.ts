// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ./src/engine/LICENSE-pdoom-video.txt
// Changed for this project: the scene hot-swap plugin below; RENDER_NO_HMR replaces PDOOM_NO_HMR;
// audio/ and data/ are served by a small middleware instead of links in public/; the page title
// and the page marker come from src/project-config.ts; the studio port is fixed there; media/ is
// served like audio/ and data/, and module requests there (`?import`) pass to Vite; SINGLE_FILE=1
// makes the build that scripts/build-single.ts packs into one file (one script, relative paths, no
// copy of public/).
import { defineConfig, type Connect, type Plugin } from 'vite';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { PROJECT, appMarker } from './src/project-config.ts';

const APP = import.meta.dirname;
const SCENE_MODULE = /\/src\/scenes\/([\w-]+)\.ts$/;

/**
 * Hot swap of scenes in the studio. Nothing in the app accepts hot updates by itself, so without
 * this a saved scene reloads the whole page. The plugin makes every scene module (a file in
 * src/scenes/ that default-exports a class) accept its own updates: Vite then re-imports only that
 * module (and the helper files it imports, when one of those is what changed) and the new module is
 * announced to the page as a `scene-module-updated` event, which src/main.ts hands to the engine.
 * Helper files live in src/scenes/parts/ and are left alone, so a change in one reaches its scenes.
 */
function sceneHotSwap(): Plugin {
  return {
    name: 'scene-hot-swap',
    apply: 'serve',
    transform(code, id) {
      const m = SCENE_MODULE.exec(id.split('?')[0]!);
      if (!m || !/export\s+default\s+class\b/.test(code)) return;
      const announce = `window.dispatchEvent(new CustomEvent('scene-module-updated', { detail: { file: ${JSON.stringify(m[1])}, module: mod } }))`;
      return { code: `${code}\nif (import.meta.hot) import.meta.hot.accept((mod) => { if (mod) ${announce}; });\n`, map: null };
    },
  };
}

/**
 * The page title and the marker that scripts/render.ts looks for, both from project-config.ts, so
 * index.html names no film and the capture tool can tell this film's server from any other.
 */
function pageIdentity(): Plugin {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return {
    name: 'page-identity',
    transformIndexHtml() {
      return [
        { tag: 'title', children: esc(PROJECT.title), injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'render-app', content: appMarker() }, injectTo: 'head-prepend' },
      ];
    },
  };
}

/** Set by scripts/build-single.ts: build one script with relative paths, to be packed into one HTML file. */
const SINGLE_FILE = !!process.env.SINGLE_FILE;

const TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.aac': 'audio/aac', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac', '.webm': 'audio/webm',
};

/**
 * Serves the folders audio/, data/ and media/ of the app folder at /audio/, /data/ and /media/
 * (media/ holds the photos, logos, screenshots and clip frames of media.ts). Plain files, no
 * links: a copy of the film through exFAT, a zip or a Windows checkout keeps working. A missing
 * file is a 404 (never the page itself, which would make the app read HTML as its data), except
 * for a request that marks the file as optional (header `x-optional-file`): that gets an empty 204,
 * so probing for lyrics or a track that is not there logs no error in the browser. Byte ranges are
 * answered, because the audio element needs them to seek.
 *
 * Module requests are left to Vite, so a scene can also `import score from '../../data/score.json'`
 * (or `?raw`, `?url`): Vite marks those requests with a query (`?import` for JSON and assets
 * imported from code, in Vite 8 as before), and they must get a JavaScript module, not the raw file.
 */
const VITE_QUERY = /(?:^|&)(?:import|raw|url|inline|worker|sharedworker|direct)(?:[=&]|$)/;
function filmFolders(): Plugin {
  const serve: Connect.NextHandleFunction = (req, res, next) => {
    const raw = req.url ?? '', q = raw.indexOf('?');
    if (q >= 0 && VITE_QUERY.test(raw.slice(q + 1))) return next();
    const url = decodeURIComponent(q >= 0 ? raw.slice(0, q) : raw);
    const m = /^\/(audio|data|media)\/(.+)$/.exec(url);
    if (!m) return next();
    const root = path.join(APP, m[1]!);
    const file = path.resolve(root, m[2]!);
    let size = -1;
    try { if (file.startsWith(root + path.sep)) { const st = statSync(file); if (st.isFile()) size = st.size; } } catch { /* missing */ }
    if (size < 0) { res.statusCode = req.headers['x-optional-file'] ? 204 : 404; res.end(); return; }
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    let start = 0, end = size - 1;
    if (range && (range[1] || range[2])) {
      if (range[1]) { start = +range[1]; if (range[2]) end = Math.min(+range[2], size - 1); }
      else start = Math.max(0, size - +range[2]!);
      if (start > end || start >= size) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${size}`); res.end(); return; }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    }
    res.setHeader('Content-Length', String(end - start + 1));
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(file, { start, end }).pipe(res);
  };
  return {
    name: 'film-folders',
    configureServer(server) { server.middlewares.use(serve); },
    configurePreviewServer(server) { server.middlewares.use(serve); },
  };
}

export default defineConfig({
  root: '.',
  // the single-file build is opened from disk: every path relative to the page
  base: SINGLE_FILE ? './' : '/',
  // public/ holds the fonts; the music and the data are served by filmFolders()
  publicDir: 'public',
  plugins: [sceneHotSwap(), pageIdentity(), filmFolders()],
  server: {
    port: PROJECT.studioPort,
    strictPort: true,
    // RENDER_NO_HMR=1: no live reload (captures must not reload mid-run when a file changes)
    hmr: process.env.RENDER_NO_HMR ? false : undefined,
    // Errors of the owner's browser reach the terminal of the studio, also when the owner started it.
    forwardConsole: true,
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
    // for the single-file build: every scene module in the one script (no chunks to load), and
    // public/ left alone (scripts/build-single.ts packs the fonts itself)
    ...(SINGLE_FILE ? { copyPublicDir: false, modulePreload: false, chunkSizeWarningLimit: 4096, rolldownOptions: { output: { codeSplitting: false } } } : {}),
  },
});
