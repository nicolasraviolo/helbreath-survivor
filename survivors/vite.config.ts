import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// En desarrollo servimos los assets directamente desde sp-client/public para no duplicar ~290 MB.
// En el build, scripts/sync-assets.mjs copia antes solo lo necesario a survivors/public (ignorado por git),
// y Vite lo incluye en dist/.
// Los assets propios (que no están en sp-client, p. ej. los sonidos de subir de nivel) viven en survivors/custom-assets/,
// con la misma estructura de carpetas: en desarrollo los sirve el plugin de abajo y en el build los copia sync-assets.

const CUSTOM_ASSETS_DIR = fileURLToPath(new URL('./custom-assets', import.meta.url));
const CONTENT_TYPES: Readonly<Record<string, string>> = { '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.png': 'image/png' };

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

export default defineConfig(({ command }) => ({
    base: './',
    publicDir: command === 'build' ? 'public' : '../sp-client/public',
    plugins: [customAssets()],
    // host: true → también se puede abrir desde el móvil en la misma wifi (http://IP-del-PC:8090).
    server: { port: 8090, strictPort: true, host: true },
    build: {
        chunkSizeWarningLimit: 2000,
    },
}));
