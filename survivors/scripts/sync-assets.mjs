// Copia a survivors/public/assets/ solo los archivos que usa el juego (los listados en src/config/assetManifest.ts),
// sacándolos de sp-client/public/assets/. Así la versión publicada no arrastra los ~290 MB del cliente original.
// Se ejecuta solo en `pnpm build`. En desarrollo Vite sirve directamente sp-client/public (ver vite.config.ts).
//
// El manifest es TypeScript: en vez de importarlo, se leen sus rutas `file: '...'` con una expresión regular.
// Si alguna no existe en sp-client, el script falla (mejor enterarse en el build que con el juego publicado).
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = join(root, 'src/config/assetManifest.ts');
const source = resolve(root, '../sp-client/public/assets');
const target = join(root, 'public/assets');

const files = [...new Set([...readFileSync(manifest, 'utf8').matchAll(/file: '([^']+)'/g)].map((match) => match[1]))];
if (files.length === 0) throw new Error(`No asset paths found in ${manifest}`);

const missing = files.filter((file) => !existsSync(join(source, file)));
if (missing.length > 0) throw new Error(`Assets listed in the manifest but missing in sp-client:\n  ${missing.join('\n  ')}`);

// Start clean so assets removed from the manifest don't linger in the build.
rmSync(target, { recursive: true, force: true });
let bytes = 0;
for (const file of files) {
    const to = join(target, file);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(join(source, file), to);
    bytes += statSync(to).size;
}
console.log(`sync-assets: ${files.length} files, ${(bytes / 1e6).toFixed(1)} MB → public/assets`);
