import { defineConfig } from 'vite';

// En desarrollo servimos los assets directamente desde sp-client/public para no duplicar ~290 MB.
// En el build, scripts/sync-assets.mjs copia antes solo lo necesario a survivors/public (ignorado por git),
// y Vite lo incluye en dist/.
export default defineConfig(({ command }) => ({
    base: './',
    publicDir: command === 'build' ? 'public' : '../sp-client/public',
    // host: true → también se puede abrir desde el móvil en la misma wifi (http://IP-del-PC:8090).
    server: { port: 8090, strictPort: true, host: true },
    build: {
        chunkSizeWarningLimit: 2000,
    },
}));
