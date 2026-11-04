// Visor de sonidos (sounds.html): herramienta de desarrollo para escuchar todos los sonidos y músicas.
// Pestaña "In the game": las claves de SOUNDS (assetManifest.ts), con su archivo y quién las usa.
// Pestaña "All files": todos los .mp3 que existen, con sus nombres en el cliente original y si los usamos o no.
// Sin Phaser: un único <audio> que se reutiliza. Los datos de archivos salen de /sound-catalog.json (vite.config.ts).
// Teclado: ↑/↓ para moverse, espacio o Enter para escuchar (otra vez = parar), Esc para parar.
import type { SoundCatalog, SoundFile } from '../../scripts/soundCatalog';
import { SOUNDS, type SoundKey } from '../config/assetManifest';
import { ENEMIES } from '../data/enemies';

type Tab = 'game' | 'files';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
    { id: 'game', label: 'In the game' },
    { id: 'files', label: 'All files' },
];

const ENEMY_SOUND_FIELDS = ['hitSound', 'deathSound', 'attackSound'] as const;
const MONSTER_KEY = /^sfx\.(\w+)\.(hit|death|attack)$/;

const main = document.getElementById('main') as HTMLElement;
const tabsBox = document.getElementById('tabs') as HTMLElement;
const search = document.getElementById('search') as HTMLInputElement;
const volume = document.getElementById('volume') as HTMLInputElement;

let catalog: SoundCatalog = { files: [], usedIn: {} };
let tab: Tab = location.hash === '#files' ? 'files' : 'game';

// ---------------------------------------------------------------------------------------------------------------
// Who uses what

/** "sfx.stoneGolem.hit" → ["Stone Golem", "Ice Golem"]: monsters whose hit/death/attack sound is that key. */
const enemiesByKey = new Map<string, string[]>();
for (const def of Object.values(ENEMIES)) {
    const fields = def as Readonly<Record<string, unknown>>;
    for (const field of ENEMY_SOUND_FIELDS) {
        const key = fields[field];
        if (typeof key !== 'string') continue;
        const list = enemiesByKey.get(key) ?? [];
        if (!list.includes(def.name)) list.push(def.name);
        enemiesByKey.set(key, list);
    }
}

const SOUND_KEYS = Object.keys(SOUNDS) as SoundKey[];
const fileOf = (key: SoundKey): string => SOUNDS[key].file;

/** "sounds/M11.mp3" → the keys that play it. */
const keysByFile = new Map<string, SoundKey[]>();
for (const key of SOUND_KEYS) keysByFile.set(fileOf(key), [...(keysByFile.get(fileOf(key)) ?? []), key]);

const fileInfo = (file: string): SoundFile | undefined => catalog.files.find((f) => f.file === file);

// ---------------------------------------------------------------------------------------------------------------
// Playback

const audio = new Audio();
let playingRow: HTMLElement | undefined;
const durations = new Map<string, number>();

function stop(): void {
    audio.pause();
    playingRow?.classList.remove('playing');
    playingRow = undefined;
}

function toggle(row: HTMLElement): void {
    const file = row.dataset.file ?? '';
    if (playingRow === row) {
        stop();
        return;
    }
    stop();
    audio.src = `assets/${file}`;
    audio.volume = Number(volume.value);
    audio.currentTime = 0;
    void audio.play().catch(() => stop());
    playingRow = row;
    row.classList.add('playing');
}

audio.addEventListener('ended', stop);
volume.addEventListener('input', () => { audio.volume = Number(volume.value); });

/** Fills in "0.9 s" next to each file name, reading only the file's header. */
function showDuration(row: HTMLElement): void {
    const file = row.dataset.file ?? '';
    const label = row.querySelector('.len');
    if (!label) return;
    const known = durations.get(file);
    if (known !== undefined) {
        label.textContent = formatSeconds(known);
        return;
    }
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', () => {
        durations.set(file, probe.duration);
        label.textContent = formatSeconds(probe.duration);
    }, { once: true });
    probe.src = `assets/${file}`;
}

const formatSeconds = (seconds: number): string =>
    seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}` : `${seconds.toFixed(1)} s`;

// ---------------------------------------------------------------------------------------------------------------
// Rows

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

function fileCell(file: string, custom: boolean): HTMLElement {
    const cell = el('div', 'file', file.replace(/^sounds\//, ''));
    cell.append(el('span', 'len'));
    if (custom) cell.prepend(el('span', 'tag custom', 'custom'));
    return cell;
}

function infoLine(label: string, values: readonly string[]): HTMLElement | undefined {
    if (values.length === 0) return undefined;
    const line = el('div', '');
    line.append(`${label}: `, el('b', '', values.join(', ')));
    return line;
}

function makeRow(file: string, searchText: string, cells: HTMLElement[]): HTMLElement {
    const row = el('div', 'row');
    row.dataset.file = file;
    row.dataset.search = searchText.toLowerCase();
    const play = el('button', 'play', '▶');
    play.title = 'Play / stop';
    row.append(play, ...cells);
    row.addEventListener('click', () => {
        select(row);
        toggle(row);
    });
    return row;
}

function gameRow(key: SoundKey): HTMLElement {
    const file = fileOf(key);
    const info = fileInfo(file);
    const monsters = enemiesByKey.get(key) ?? [];
    const sharedWith = (keysByFile.get(file) ?? []).filter((other) => other !== key);
    const details = el('div', 'info');
    for (const line of [
        infoLine('Monsters', monsters),
        infoLine('Code', catalog.usedIn[key] ?? []),
        infoLine('Same file as', sharedWith),
        infoLine('Original', info?.originalNames ?? []),
    ]) if (line) details.append(line);
    const text = [key, file, ...monsters, ...(info?.originalNames ?? [])].join(' ');
    return makeRow(file, text, [el('div', 'key', key), fileCell(file, info?.custom ?? false), details]);
}

function fileRow(info: SoundFile): HTMLElement {
    const keys = keysByFile.get(info.file) ?? [];
    const details = el('div', 'info');
    if (keys.length === 0) details.append(el('span', 'tag unused', 'unused'));
    const original = infoLine('Original', info.originalNames);
    if (original) details.append(original);
    const keyCell = el('div', 'key', keys.join(', '));
    const text = [info.file, ...keys, ...info.originalNames, keys.length === 0 ? 'unused' : ''].join(' ');
    return makeRow(info.file, text, [fileCell(info.file, info.custom), keyCell, details]);
}

/** Heading for a group of keys in the "In the game" tab. */
function groupOf(key: SoundKey): string {
    if (key.startsWith('music.')) return 'Music';
    if (MONSTER_KEY.test(key)) return 'Monsters (hit / death / attack)';
    return 'Player, weapons, spells & menus';
}

// ---------------------------------------------------------------------------------------------------------------
// Pages

function render(): void {
    stop();
    tabsBox.replaceChildren(...TABS.map(({ id, label }) => {
        const button = el('button', id === tab ? 'on' : '', label);
        button.addEventListener('click', () => {
            tab = id;
            history.replaceState(null, '', `#${id}`);
            render();
        });
        return button;
    }));

    const hint = el('p', 'hint', tab === 'game'
        ? 'Every sound the game plays, by its name in the code. To change one, tell Claude: "change sfx.orc.hit to M27".'
        : 'Every sound and music file available. "unused" = not in the game yet. Original = its name in the Helbreath client.');
    hint.append(el('br', ''), '↑/↓ move · Space or Enter play/stop · Esc stop · click a row to play it.');
    const nodes: HTMLElement[] = [hint];

    if (tab === 'game') {
        const groups = new Map<string, SoundKey[]>();
        // Los monstruos, ordenados por nombre para que golpe/muerte/ataque de cada uno queden juntos.
        const sorted = [...SOUND_KEYS].sort((a, b) => a.localeCompare(b));
        for (const key of sorted) groups.set(groupOf(key), [...(groups.get(groupOf(key)) ?? []), key]);
        for (const name of ['Player, weapons, spells & menus', 'Monsters (hit / death / attack)', 'Music']) {
            const keys = groups.get(name) ?? [];
            const section = el('section', '');
            section.append(el('h3', '', `${name} · ${keys.length}`), ...keys.map(gameRow));
            nodes.push(section);
        }
    } else {
        for (const folder of ['sounds', 'music']) {
            const files = catalog.files.filter((f) => f.file.startsWith(`${folder}/`));
            const unused = files.filter((f) => !keysByFile.has(f.file)).length;
            const section = el('section', '');
            section.append(el('h3', '', `${folder === 'sounds' ? 'Sounds' : 'Music'} · ${files.length} (${unused} unused)`), ...files.map(fileRow));
            nodes.push(section);
        }
    }
    main.replaceChildren(...nodes);
    applySearch();
}

function applySearch(): void {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    for (const section of main.querySelectorAll('section')) {
        let shown = 0;
        for (const row of section.querySelectorAll<HTMLElement>('.row')) {
            const match = words.every((word) => (row.dataset.search ?? '').includes(word));
            row.hidden = !match;
            if (match) {
                shown++;
                showDuration(row);
            }
        }
        section.hidden = shown === 0;
    }
}

search.addEventListener('input', applySearch);

// ---------------------------------------------------------------------------------------------------------------
// Keyboard

let selected: HTMLElement | undefined;

function select(row: HTMLElement): void {
    selected?.classList.remove('selected');
    selected = row;
    row.classList.add('selected');
    row.scrollIntoView({ block: 'nearest' });
}

document.addEventListener('keydown', (event) => {
    const typing = document.activeElement === search;
    if (event.key === 'Escape') {
        stop();
        return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const rows = [...main.querySelectorAll<HTMLElement>('.row')].filter((row) => !row.hidden && !row.closest('section')?.hidden);
        if (rows.length === 0) return;
        const index = selected ? rows.indexOf(selected) : -1;
        const next = event.key === 'ArrowDown' ? Math.min(index + 1, rows.length - 1) : Math.max(index - 1, 0);
        select(rows[next]);
        if (typing) search.blur();
        event.preventDefault();
        return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && !typing && selected) {
        toggle(selected);
        event.preventDefault();
    }
});

// ---------------------------------------------------------------------------------------------------------------

fetch('/sound-catalog.json')
    .then((response) => response.json() as Promise<SoundCatalog>)
    .then((data) => { catalog = data; })
    .catch(() => { /* Sin catálogo (no es `pnpm dev`): la pestaña del juego sigue funcionando. */ })
    .finally(render);
