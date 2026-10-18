import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// En desarrollo servimos los assets directamente desde sp-client/public para no duplicar ~290 MB.
// En el build, scripts/sync-assets.mjs copia antes solo lo necesario a survivors/public (ignorado por git),
// y Vite lo incluye en dist/.
// Los assets propios (que no están en sp-client, p. ej. los sonidos de subir de nivel) viven en survivors/custom-assets/,
// con la misma estructura de carpetas: en desarrollo los sirve el plugin de abajo y en el build los copia sync-assets.

// La app instalable (Fase 12): pwa/ tiene el manifiesto, el service worker y los iconos. En el build se copian todos; en
// desarrollo solo se sirven las imágenes (icono de la pestaña), porque el service worker estorbaría.
const PWA_DIR = fileURLToPath(new URL('./pwa', import.meta.url));

const CUSTOM_ASSETS_DIR = fileURLToPath(new URL('./custom-assets', import.meta.url));
const CONTENT_TYPES: Readonly<Record<string, string>> = { '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.png': 'image/png', '.ico': 'image/x-icon' };

/** Dev server only: /assets/<path> is served from custom-assets/<path> when that file exists, otherwise from sp-client. */
function customAssets(): Plugin {
    return {
        name: 'custom-assets',
        configureServer(server) {
            server.middlewares.use('/assets', (req, res, next) => {
                const path = normalize(decodeURIComponent((req.url ?? '').split('?')[0]));
                const file = join(CUSTOM_ASSETS_DIR, path);
                if (!file.startsWith(CUSTOM_ASSETS_DIR) || !existsSync(file) || !statSync(file).isFile()) {
                    next();
                    return;
                }
                res.setHeader('Content-Type', CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream');
                createReadStream(file).pipe(res);
            });
        },
    };
}

/** Dev server only: the tab icons (pwa/*.png, pwa/*.ico) are served at the root, as in the build. */
function devIcons(): Plugin {
    return {
        name: 'dev-icons',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const name = (req.url ?? '').split('?')[0].replace(/^\//, '');
                const type = CONTENT_TYPES[extname(name).toLowerCase()];
                const file = join(PWA_DIR, name);
                if (name.includes('/') || !type?.startsWith('image/') || !existsSync(file)) {
                    next();
                    return;
                }
                res.setHeader('Content-Type', type);
                createReadStream(file).pipe(res);
            });
        },
    };
}

/** Build only: copies pwa/* next to index.html and links the manifest from it. */
function installableApp(): Plugin {
    return {
        name: 'installable-app',
        apply: 'build',
        transformIndexHtml: () => [
            { tag: 'link', attrs: { rel: 'manifest', href: 'manifest.webmanifest' }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'apple-touch-icon', href: 'apple-touch-icon.png' }, injectTo: 'head' },
        ],
        generateBundle() {
            for (const fileName of readdirSync(PWA_DIR)) {
                this.emitFile({ type: 'asset', fileName, source: readFileSync(join(PWA_DIR, fileName)) });
            }
        },
    };
}

export default defineConfig(({ command }) => ({
    base: './',
    publicDir: command === 'build' ? 'public' : '../sp-client/public',
    plugins: [customAssets(), devIcons(), installableApp()],
    // host: true → también se puede abrir desde el móvil en la misma wifi (http://IP-del-PC:8090).
    server: { port: 8090, strictPort: true, host: true },
    build: {
        chunkSizeWarningLimit: 2000,
    },
}));
