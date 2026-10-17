import { defineConfig } from 'vite';

// En desarrollo servimos los assets directamente desde sp-client/public para no duplicar ~290 MB.
// En producción (Fase 9) scripts/sync-assets.mjs copiará solo lo necesario a survivors/public.
export default defineConfig({
    base: './',
    publicDir: '../sp-client/public',
    // host: true → también se puede abrir desde el móvil en la misma wifi (http://IP-del-PC:8090).
    server: { port: 8090, strictPort: true, host: true },
    build: {
        // En Fase 1 no copiamos los assets al build; se resolverá en Fase 9.
        copyPublicDir: false,
        chunkSizeWarningLimit: 2000,
    },
});
