// Catálogo para el visor de sonidos (sounds.html, solo en desarrollo).
//
// Lista todos los .mp3 que hay (sonidos y música de sp-client, más los propios de custom-assets) y, para cada uno,
// los nombres que les da el cliente original: las constantes de SoundFileNames.ts (p. ej. ITEM_ADDED_SOUND) y los
// estados de cada monstruo en Monsters.ts (p. ej. "Orc attack"). Así se puede buscar también entre los que no usamos.
// Lo usa vite.config.ts, que lo sirve en /sound-catalog.json.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SoundFile {
    /** Path under assets/, e.g. "sounds/M11.mp3" or "music/dungeon.mp3". */
    file: string;
    /** Names the original client gives this file, e.g. ["Orc take damage", "ITEM_ADDED_SOUND"]. */
    originalNames: string[];
    /** True when the file comes from survivors/custom-assets (added by the owner, not in sp-client). */
    custom: boolean;
}

export interface SoundCatalog {
    files: SoundFile[];
    /** For each sound key ("sfx.orc.hit"), the source files under src/ that mention it (assetManifest.ts aside). */
    usedIn: Record<string, string[]>;
}

const STATE_NAMES: Readonly<Record<string, string>> = { takeDamage: 'take damage' };

function listMp3(dir: string): string[] {
    return existsSync(dir) ? readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.mp3')) : [];
}

/** "C10.mp3" → ["PLAYER_RUNNING"], "M11.mp3" → ["Orc take damage"], from sp-client's own constants. */
function originalNames(spClient: string): Map<string, string[]> {
    const names = new Map<string, string[]>();
    const add = (file: string, name: string): void => {
        const list = names.get(file) ?? [];
        if (!list.includes(name)) list.push(name);
        names.set(file, list);
    };
    const constants = readFileSync(join(spClient, 'src/constants/SoundFileNames.ts'), 'utf8');
    for (const match of constants.matchAll(/export const (\w+) = '([^']+)'/g)) add(match[2], match[1]);

    // Monsters.ts: "name: 'Orc'" seguido de sus estados "attack: { sound: 'M10.mp3' }".
    const monsters = readFileSync(join(spClient, 'src/constants/Monsters.ts'), 'utf8');
    let monster = '';
    for (const line of monsters.split('\n')) {
        const name = /^\s*name: '([^']+)'/.exec(line);
        if (name) monster = name[1];
        const state = /(\w+): \{ sound: '([^']+)'/.exec(line);
        if (state && monster) add(state[2], `${monster} ${STATE_NAMES[state[1]] ?? state[1]}`);
    }
    return names;
}

/** Every .ts file under dir, as paths relative to dir with forward slashes. */
function listTs(dir: string, prefix = ''): string[] {
    return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((entry) => {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) return listTs(dir, path);
        return entry.name.endsWith('.ts') ? [path] : [];
    });
}

/** Where each sound key is written in our code, e.g. "sfx.orc.hit" → ["data/enemies.ts"]. */
function keyUsage(srcDir: string): Record<string, string[]> {
    const usedIn: Record<string, string[]> = {};
    for (const path of listTs(srcDir)) {
        if (path === 'config/assetManifest.ts') continue;
        const text = readFileSync(join(srcDir, path), 'utf8');
        for (const match of text.matchAll(/'((?:sfx|music)\.[\w.]+)'/g)) {
            const list = (usedIn[match[1]] ??= []);
            if (!list.includes(path)) list.push(path);
        }
    }
    return usedIn;
}

export function buildSoundCatalog(spClient: string, customAssets: string, srcDir: string): SoundCatalog {
    const names = originalNames(spClient);
    const files: SoundFile[] = [];
    for (const folder of ['sounds', 'music']) {
        const custom = new Set(listMp3(join(customAssets, folder)));
        const all = new Set([...listMp3(join(spClient, 'public/assets', folder)), ...custom]);
        for (const name of all) {
            files.push({ file: `${folder}/${name}`, originalNames: names.get(name) ?? [], custom: custom.has(name) });
        }
    }
    // Orden natural: C2 antes que C10.
    files.sort((a, b) => a.file.localeCompare(b.file, 'en', { numeric: true }));
    return { files, usedIn: keyUsage(srcDir) };
}
