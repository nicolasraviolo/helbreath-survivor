// Visor de sprites (sprites.html): herramienta de desarrollo para ver todos los .spr de sp-client con sus nombres.
// No usa Phaser: lee los .spr con readSprFile y los dibuja en <canvas>. Los nombres salen de /sprite-catalog.json,
// que genera vite.config.ts a partir de los datos del cliente original (scripts/spriteCatalog.ts).
// Navegación por el hash de la URL: #weapons (una categoría) o #file/msw/56 (un archivo en una hoja concreta).
import type { CatalogItem, SpriteCatalog } from '../../scripts/spriteCatalog';
import { DIRECTION_COUNT, DIRECTION_NAMES, Direction } from '../hb/directions';
import { readSprFile, type SprFrameRect } from '../hb/HBSprite';

// ---------------------------------------------------------------------------------------------------------------
// Loading and drawing .spr sheets

interface Sheet {
    frames: SprFrameRect[];
    /** Undefined when the sheet has no picture (some files have empty placeholder sheets). */
    image?: ImageBitmap;
}

const sprCache = new Map<string, Promise<Sheet[]>>();

function loadSpr(file: string): Promise<Sheet[]> {
    let pending = sprCache.get(file);
    if (!pending) {
        pending = fetch(`assets/sprites/${file}.spr`)
            .then((response) => {
                if (!response.ok) throw new Error(`${file}.spr: HTTP ${response.status}`);
                return response.arrayBuffer();
            })
            .then((buffer) => Promise.all(readSprFile(buffer).map(async (sheet): Promise<Sheet> => {
                try {
                    return { frames: sheet.frames, image: await createImageBitmap(new Blob([sheet.imageData.slice()], { type: 'image/png' })) };
                } catch {
                    return { frames: sheet.frames };
                }
            })));
        sprCache.set(file, pending);
    }
    return pending;
}

const isVisible = (frame: SprFrameRect): boolean => frame.width > 0 && frame.height > 0;

interface Bounds { minX: number; minY: number; width: number; height: number }

/** Box that holds every frame around the shared pivot, so an animation does not jump around. */
function boundsOf(frames: SprFrameRect[]): Bounds | undefined {
    const visible = frames.filter(isVisible);
    if (visible.length === 0) return undefined;
    const minX = Math.min(...visible.map((f) => f.pivotX));
    const minY = Math.min(...visible.map((f) => f.pivotY));
    const maxX = Math.max(...visible.map((f) => f.pivotX + f.width));
    const maxY = Math.max(...visible.map((f) => f.pivotY + f.height));
    return { minX, minY, width: maxX - minX, height: maxY - minY };
}

function drawFrame(ctx: CanvasRenderingContext2D, sheet: Sheet, frame: SprFrameRect, originX: number, originY: number, scale: number): void {
    if (!sheet.image || !isVisible(frame)) return;
    ctx.drawImage(sheet.image, frame.x, frame.y, frame.width, frame.height,
        originX + frame.pivotX * scale, originY + frame.pivotY * scale, frame.width * scale, frame.height * scale);
}

/** Draws one frame centred and scaled to fit a thumbnail canvas. */
function drawThumb(canvas: HTMLCanvasElement, sheet: Sheet | undefined, frameIndex: number): void {
    const ctx = canvas.getContext('2d');
    const frame = sheet?.frames[frameIndex] ?? sheet?.frames.find(isVisible);
    if (!ctx || !sheet?.image || !frame || !isVisible(frame)) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(3, canvas.width / frame.width, canvas.height / frame.height);
    const x = (canvas.width - frame.width * scale) / 2;
    const y = (canvas.height - frame.height * scale) / 2;
    ctx.drawImage(sheet.image, frame.x, frame.y, frame.width, frame.height, x, y, frame.width * scale, frame.height * scale);
}

// ---------------------------------------------------------------------------------------------------------------
// Sheet layouts: which pose and direction each sheet number is (same tables as the original client).

interface Layout {
    poses: readonly string[];
    /** Sheets per complete set (one sword, one monster, one hair style…). */
    blockSize: number;
    /** True when the 8 directions are frame slices inside one sheet instead of 8 separate sheets. */
    directionInFrames: boolean;
    /** For gear: the body pose (index in PLAYER_POSES) drawn under each pose, to see the item worn. */
    bodyPoses?: readonly number[];
}

const PLAYER_POSES = ['Idle', 'Idle (combat)', 'Walk', 'Walk (combat)', 'Run', 'Bow stance', 'Attack', 'Bow attack', 'Cast', 'Pick up', 'Hurt', 'Die'] as const;
const ARMAMENT_POSES = ['Idle', 'Idle (combat)', 'Walk', 'Walk (combat)', 'Attack', 'Hurt', 'Run'];
/** Weapon/shield pose → body pose: Idle, Idle (combat), Walk, Walk (combat), Attack, Hurt, Run. */
const ARMAMENT_BODY_POSES = [0, 1, 2, 3, 6, 10, 4];
const LAYOUTS = {
    human: { poses: PLAYER_POSES, blockSize: PLAYER_POSES.length * DIRECTION_COUNT, directionInFrames: false },
    armour: { poses: PLAYER_POSES, blockSize: PLAYER_POSES.length, directionInFrames: true, bodyPoses: PLAYER_POSES.map((_, index) => index) },
    weapon: { poses: ARMAMENT_POSES, blockSize: 56, directionInFrames: false, bodyPoses: ARMAMENT_BODY_POSES },
    shield: { poses: ARMAMENT_POSES, blockSize: 7, directionInFrames: true, bodyPoses: ARMAMENT_BODY_POSES },
    monster: { poses: ['Idle', 'Move', 'Attack', 'Hurt', 'Dead'], blockSize: 40, directionInFrames: false },
} satisfies Record<string, Layout>;
type LayoutName = keyof typeof LAYOUTS;

/** Pose and direction of a sheet. In "direction in frames" layouts the direction is chosen separately. */
function poseOf(layout: Layout, sheet: number): { block: number; pose: number; direction: number } {
    const block = Math.floor(sheet / layout.blockSize);
    const inBlock = sheet % layout.blockSize;
    return layout.directionInFrames
        ? { block, pose: inBlock, direction: -1 }
        : { block, pose: Math.floor(inBlock / DIRECTION_COUNT), direction: inBlock % DIRECTION_COUNT };
}

function sheetFor(layout: Layout, block: number, pose: number, direction: number): number {
    return block * layout.blockSize + (layout.directionInFrames ? pose : pose * DIRECTION_COUNT + direction);
}

function sheetLabel(layout: Layout | undefined, sheet: number): string {
    if (!layout) return `#${sheet}`;
    const { pose, direction } = poseOf(layout, sheet);
    const name = layout.poses[pose] ?? `Pose ${pose}`;
    return direction >= 0 ? `${name} ${DIRECTION_NAMES[direction as Direction]}` : name;
}

// ---------------------------------------------------------------------------------------------------------------
// Catalog → categories of cards

interface Card {
    title: string;
    sub: string;
    draw: (canvas: HTMLCanvasElement) => Promise<void>;
    href: string;
}

interface OpenTarget {
    title: string;
    /** `body`: player body file drawn underneath (gear only). */
    files: Array<{ label: string; file: string; body?: string }>;
    layout?: LayoutName;
    startSheet: number;
    icon?: [number, number];
    /** Opened from an item card, so its sheet range is highlighted. */
    fromItem?: boolean;
}

const HUMAN_FILES: Record<string, string> = { wm: 'Man (white)', ym: 'Man (yellow)', bm: 'Man (black)', ww: 'Woman (white)', yw: 'Woman (yellow)', bw: 'Woman (black)' };
const BODY_EXTRA_FILES: Record<string, string> = { mhr: 'Hair (male)', whr: 'Hair (female)', mpt: 'Underwear (male)', wpt: 'Underwear (female)' };
const ARMOUR_TYPES = new Set(['armor', 'hauberk', 'leggings', 'helmet', 'cape', 'boots']);
/** Idle-facing-South sheet: a nice first picture for characters and monsters. */
const SOUTH_IDLE_SHEET = Direction.South;

function itemLayout(item: CatalogItem): LayoutName | undefined {
    if (item.type === 'weapon') return 'weapon';
    if (item.type === 'shield') return 'shield';
    if (ARMOUR_TYPES.has(item.type)) return 'armour';
    return undefined;
}

const iconDraw = (icon: [number, number] | undefined) => async (canvas: HTMLCanvasElement): Promise<void> => {
    if (!icon) return;
    const sheets = await loadSpr('item-pack');
    drawThumb(canvas, sheets[icon[0]], icon[1]);
};

const sheetDraw = (file: string, sheet: number, frame = 0) => async (canvas: HTMLCanvasElement): Promise<void> => {
    const sheets = await loadSpr(file);
    const chosen = sheets[sheet] ?? sheets.find((s) => s.image);
    drawThumb(canvas, chosen, chosen === sheets[sheet] ? frame : 0);
};

let catalog: SpriteCatalog;
/** What each file is, so opening a raw file still gets pose names. */
const fileLayouts = new Map<string, LayoutName>();
const fileNames = new Map<string, string>();
const itemsByName = new Map<string, CatalogItem>();

function indexCatalog(): void {
    for (const file of Object.keys(HUMAN_FILES)) fileLayouts.set(file, 'human');
    for (const file of Object.keys(BODY_EXTRA_FILES)) fileLayouts.set(file, 'armour');
    for (const { file, name } of [...catalog.monsters, ...catalog.npcs]) {
        fileLayouts.set(file, 'monster');
        fileNames.set(file, name);
    }
    for (const item of catalog.items) {
        itemsByName.set(item.name, item);
        const layout = itemLayout(item);
        for (const file of [item.male, item.female]) {
            if (!file) continue;
            if (layout) fileLayouts.set(file, layout);
            // Shared files (msw.spr holds a dozen swords) keep the first name only as a hint.
            if (!fileNames.has(file)) fileNames.set(file, item.startSheet === undefined ? item.name : `${item.name}, …`);
        }
    }
    for (const effect of catalog.effects) {
        if (!fileNames.has(effect.file)) fileNames.set(effect.file, 'Spell / effect');
    }
    Object.entries({ ...HUMAN_FILES, ...BODY_EXTRA_FILES }).forEach(([file, name]) => fileNames.set(file, name));
}

const itemHref = (item: CatalogItem): string => `#item/${encodeURIComponent(item.name)}`;
/** `title` overrides the file's name (an effect is one sheet of a shared file). */
const fileHref = (file: string, sheet = 0, title?: string): string =>
    `#file/${encodeURIComponent(file)}/${sheet}${title ? `/${encodeURIComponent(title)}` : ''}`;

function itemCards(filter: (item: CatalogItem) => boolean): Card[] {
    return catalog.items.filter(filter).map((item) => ({
        title: item.name,
        sub: item.male ? `${item.type} · ${item.male}.spr` : item.type,
        draw: iconDraw(item.icon),
        href: itemHref(item),
    }));
}

interface Category { id: string; label: string; hint: string; cards: () => Card[] }

const CATEGORIES: Category[] = [
    {
        id: 'weapons', label: 'Weapons & shields',
        hint: 'Inventory icon of every weapon and shield. Click one to see it animated in the hand (all poses and directions).',
        cards: () => itemCards((item) => item.type === 'weapon' || item.type === 'shield'),
    },
    {
        id: 'armour', label: 'Armour & clothes',
        hint: 'Armour, hauberks, leggings, helmets, capes and boots. Click one to see how it looks worn.',
        cards: () => itemCards((item) => ARMOUR_TYPES.has(item.type)),
    },
    {
        id: 'items', label: 'Other items',
        hint: 'Rings, necklaces, potions and everything else (inventory icons only).',
        cards: () => itemCards((item) => item.type !== 'weapon' && item.type !== 'shield' && !ARMOUR_TYPES.has(item.type)),
    },
    {
        id: 'spells', label: 'Spells & effects',
        hint: 'Every named effect of the original client (spells, explosions, auras…).',
        cards: () => catalog.effects.map((effect) => ({
            title: effect.name,
            sub: `${effect.file}.spr · sheet ${effect.sheet}`,
            draw: sheetDraw(effect.file, effect.sheet, 2),
            href: fileHref(effect.file, effect.sheet, effect.name),
        })),
    },
    {
        id: 'monsters', label: 'Monsters',
        hint: 'Every monster of the original client.',
        cards: () => catalog.monsters.map(({ name, file }) => ({ title: name, sub: `${file}.spr`, draw: sheetDraw(file, SOUTH_IDLE_SHEET), href: fileHref(file, SOUTH_IDLE_SHEET) })),
    },
    {
        id: 'characters', label: 'Characters & NPCs',
        hint: 'Player bodies, hair, underwear and town NPCs.',
        cards: () => [
            ...Object.entries({ ...HUMAN_FILES, ...BODY_EXTRA_FILES }).map(([file, name]) => ({
                title: name, sub: `${file}.spr`, draw: sheetDraw(file, file in HUMAN_FILES ? SOUTH_IDLE_SHEET : 0), href: fileHref(file, file in HUMAN_FILES ? SOUTH_IDLE_SHEET : 0),
            })),
            ...catalog.npcs.map(({ name, file }) => ({ title: name, sub: `${file}.spr`, draw: sheetDraw(file, SOUTH_IDLE_SHEET), href: fileHref(file, SOUTH_IDLE_SHEET) })),
        ],
    },
    {
        id: 'files', label: 'All files',
        hint: 'Every .spr file, including map tiles and interface. Shows the first picture of each file.',
        cards: () => catalog.files.map((file) => ({ title: file, sub: fileNames.get(file) ?? '', draw: sheetDraw(file, 0), href: fileHref(file) })),
    },
];

// ---------------------------------------------------------------------------------------------------------------
// Page

const main = document.getElementById('main') as HTMLElement;
const search = document.getElementById('search') as HTMLInputElement;
const tabs = document.getElementById('tabs') as HTMLElement;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, children: Array<Node | string> = []): HTMLElementTagNameMap[K] {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
}

/** Thumbnails load only when scrolled into view (some categories have hundreds). */
const lazyDraw = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        lazyDraw.unobserve(entry.target);
        const draw = pendingDraws.get(entry.target);
        pendingDraws.delete(entry.target);
        draw?.().catch((error: unknown) => console.warn(error));
    }
}, { rootMargin: '200px' });
const pendingDraws = new WeakMap<Element, () => Promise<void>>();

function cardElement(title: string, sub: string, draw: (canvas: HTMLCanvasElement) => Promise<void>, size: number): HTMLElement {
    const canvas = el('canvas', { width: size, height: size });
    const card = el('div', { className: 'card' }, [canvas, el('div', { className: 'title', textContent: title }), el('div', { className: 'sub', textContent: sub })]);
    pendingDraws.set(card, () => draw(canvas));
    lazyDraw.observe(card);
    return card;
}

let stopAnimation: (() => void) | undefined;
let currentCategory = CATEGORIES[0].id;

function renderTabs(): void {
    tabs.replaceChildren(...CATEGORIES.map((category) => el('button', {
        textContent: category.label,
        className: category.id === currentCategory ? 'on' : '',
        onclick: () => { location.hash = category.id; },
    })));
}

function showCategory(id: string): void {
    const category = CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
    currentCategory = category.id;
    renderTabs();
    const query = search.value.trim().toLowerCase();
    const cards = category.cards().filter((card) => !query || `${card.title} ${card.sub}`.toLowerCase().includes(query));
    const grid = el('div', { className: 'grid' }, cards.map((card) => {
        const node = cardElement(card.title, card.sub, card.draw, 96);
        node.onclick = () => { location.hash = card.href; };
        return node;
    }));
    main.replaceChildren(el('p', { className: 'hint', textContent: `${category.hint} (${cards.length})` }), grid);
}

function targetFromItem(item: CatalogItem): OpenTarget {
    const files: OpenTarget['files'] = [];
    if (item.male) files.push({ label: 'Male', file: item.male, body: 'wm' });
    if (item.female && item.female !== item.male) files.push({ label: 'Female', file: item.female, body: 'ww' });
    return { title: item.name, files, layout: itemLayout(item), startSheet: item.startSheet ?? 0, icon: item.icon, fromItem: true };
}

function targetFromFile(file: string, sheet: number, title?: string): OpenTarget {
    return { title: title ?? fileNames.get(file) ?? file, files: [{ label: file, file }], layout: fileLayouts.get(file), startSheet: sheet };
}

const BACKGROUNDS = ['dark', 'light', 'grass', 'checker'] as const;
const viewPrefs = { zoom: 2, fps: 10, background: 'dark' as (typeof BACKGROUNDS)[number] };

async function showTarget(target: OpenTarget): Promise<void> {
    renderTabs();
    const back = el('button', { textContent: '← Back', onclick: () => { location.hash = currentCategory; } });
    const header = el('div', { className: 'toolbar' }, [back, el('h2', { textContent: target.title })]);
    if (target.files.length === 0) {
        const canvas = el('canvas', { width: 128, height: 128 });
        main.replaceChildren(header, el('p', { className: 'hint', textContent: 'This item has no worn/held sprite: only its inventory icon.' }), el('div', { className: 'stage bg-dark' }, [canvas]));
        await iconDraw(target.icon)(canvas);
        return;
    }

    let fileIndex = 0;
    let sheets = await loadSpr(target.files[0].file);
    const layout: Layout | undefined = target.layout ? LAYOUTS[target.layout] : undefined;
    let bodySheets = target.files[0].body ? await loadSpr(target.files[0].body) : undefined;
    /** Items open in "Idle (combat)" facing South, like the player in the game. */
    const firstSheet = layout && target.fromItem
        ? sheetFor(layout, Math.floor(target.startSheet / layout.blockSize), 1, Direction.South)
        : target.startSheet;
    const state = { sheet: Math.min(firstSheet, sheets.length - 1), direction: Direction.South as number, playing: true, frame: 0, showBody: true };

    const stage = el('canvas');
    const stageBox = el('div', { className: 'stage' }, [stage]);
    const info = el('span', { className: 'hint' });
    const sheetInput = el('input', { type: 'number', min: '0', className: 'num' });
    const poseSelect = el('select');
    const directionButtons = el('span');
    const sheetGrid = el('div', { className: 'grid sheet-grid' });
    const playButton = el('button');
    const fileButtons = el('span');

    const directionFrames = (sheet: Sheet): SprFrameRect[] => {
        if (!layout?.directionInFrames || sheet.frames.length < DIRECTION_COUNT || sheet.frames.length % DIRECTION_COUNT !== 0) return sheet.frames;
        const perDirection = sheet.frames.length / DIRECTION_COUNT;
        return sheet.frames.slice(state.direction * perDirection, (state.direction + 1) * perDirection);
    };

    /** Sheets of the chosen item inside a shared file (e.g. the Long Sword inside msw.spr). */
    const itemRange = (): [number, number] | undefined => {
        if (!layout || !target.fromItem) return undefined;
        const first = target.startSheet - (target.startSheet % layout.blockSize);
        return [first, first + layout.blockSize];
    };

    const selectSheet = (sheet: number): void => {
        state.sheet = Math.max(0, Math.min(sheets.length - 1, sheet));
        state.frame = 0;
        if (layout && !layout.directionInFrames) state.direction = poseOf(layout, state.sheet).direction;
        refreshControls();
    };

    const refreshControls = (): void => {
        sheetInput.max = String(sheets.length - 1);
        sheetInput.value = String(state.sheet);
        playButton.textContent = state.playing ? 'Pause' : 'Play';
        if (layout) {
            const { pose } = poseOf(layout, state.sheet);
            poseSelect.value = String(pose);
            for (const [index, button] of [...directionButtons.children].entries()) {
                button.className = index === state.direction ? 'on' : '';
            }
        }
        for (const [index, card] of [...sheetGrid.children].entries()) {
            card.classList.toggle('current', index === state.sheet);
        }
        const range = itemRange();
        stageBox.className = `stage bg-${viewPrefs.background}`;
        info.textContent = `${target.files[fileIndex].file}.spr · sheet ${state.sheet} of ${sheets.length - 1}`
            + (layout ? ` · ${sheetLabel(layout, state.sheet)}` : '')
            + (range ? ` · this item uses sheets ${range[0]}–${range[1] - 1}` : '');
    };

    if (layout) {
        poseSelect.replaceChildren(...layout.poses.map((name, index) => el('option', { value: String(index), textContent: name })));
        poseSelect.onchange = () => {
            const { block } = poseOf(layout, state.sheet);
            selectSheet(sheetFor(layout, block, Number(poseSelect.value), state.direction));
        };
        directionButtons.replaceChildren(...Array.from({ length: DIRECTION_COUNT }, (_, direction) => el('button', {
            textContent: DIRECTION_NAMES[direction as Direction],
            onclick: () => {
                state.direction = direction;
                const { block, pose } = poseOf(layout, state.sheet);
                selectSheet(sheetFor(layout, block, pose, direction));
            },
        })));
    }
    sheetInput.onchange = () => selectSheet(Number(sheetInput.value));
    playButton.onclick = () => { state.playing = !state.playing; refreshControls(); };

    const buildSheetGrid = (): void => {
        const range = itemRange();
        sheetGrid.replaceChildren(...sheets.map((sheet, index) => {
            const card = cardElement(`${index}`, layout ? sheetLabel(layout, index) : `${sheet.frames.length} frames`, async (canvas) => drawThumb(canvas, sheet, 0), 64);
            if (range && (index < range[0] || index >= range[1])) card.classList.add('dim');
            card.onclick = () => selectSheet(index);
            return card;
        }));
    };

    const switchFile = async (index: number): Promise<void> => {
        fileIndex = index;
        sheets = await loadSpr(target.files[index].file);
        const body = target.files[index].body;
        bodySheets = body ? await loadSpr(body) : undefined;
        state.sheet = Math.min(state.sheet, sheets.length - 1);
        [...fileButtons.children].forEach((button, i) => { button.className = i === index ? 'on' : ''; });
        buildSheetGrid();
        refreshControls();
    };
    if (target.files.length > 1) {
        fileButtons.replaceChildren(...target.files.map((entry, index) => el('button', { textContent: entry.label, className: index === 0 ? 'on' : '', onclick: () => void switchFile(index) })));
    }

    const zoomSelect = el('select', { onchange: () => { viewPrefs.zoom = Number(zoomSelect.value); } }, [1, 2, 3, 4].map((zoom) => el('option', { value: String(zoom), textContent: `${zoom}×` })));
    zoomSelect.value = String(viewPrefs.zoom);
    const fpsInput = el('input', { type: 'range', min: '1', max: '30', value: String(viewPrefs.fps), oninput: () => { viewPrefs.fps = Number(fpsInput.value); } });
    const backgroundSelect = el('select', { onchange: () => { viewPrefs.background = backgroundSelect.value as typeof viewPrefs.background; refreshControls(); } },
        BACKGROUNDS.map((name) => el('option', { value: name, textContent: name })));
    backgroundSelect.value = viewPrefs.background;

    const iconCanvas = el('canvas', { width: 48, height: 48, className: 'icon' });
    if (target.icon) void iconDraw(target.icon)(iconCanvas);

    main.replaceChildren(
        header,
        el('div', { className: 'toolbar' }, [...(target.icon ? [iconCanvas] : []), fileButtons, info]),
        el('div', { className: 'toolbar' }, [
            el('button', { textContent: '◀', onclick: () => selectSheet(state.sheet - 1) }), sheetInput, el('button', { textContent: '▶', onclick: () => selectSheet(state.sheet + 1) }),
            ...(layout ? [el('label', { textContent: 'Pose' }), poseSelect, el('label', { textContent: 'Facing' }), directionButtons] : []),
        ]),
        el('div', { className: 'toolbar' }, [
            playButton,
            ...(layout?.bodyPoses && target.files[0].body ? [el('label', {}, [el('input', { type: 'checkbox', checked: true, onchange: () => { state.showBody = !state.showBody; } }), ' On body'])] : []),
            el('label', { textContent: 'Speed' }), fpsInput, el('label', { textContent: 'Zoom' }), zoomSelect, el('label', { textContent: 'Background' }), backgroundSelect,
        ]),
        stageBox,
        el('h3', { textContent: 'All pictures in this file (click one)' }),
        sheetGrid,
    );
    buildSheetGrid();
    refreshControls();

    /** Body picture under gear: same pose and facing as the item (one body sheet per direction). */
    const bodyLayer = (): { sheet: Sheet; frames: SprFrameRect[] } | undefined => {
        if (!state.showBody || !bodySheets || !layout?.bodyPoses) return undefined;
        const bodyPose = layout.bodyPoses[poseOf(layout, state.sheet).pose];
        const sheet = bodyPose === undefined ? undefined : bodySheets[bodyPose * DIRECTION_COUNT + state.direction];
        return sheet ? { sheet, frames: sheet.frames } : undefined;
    };

    // Animation loop: draws the current sheet (or its direction slice) around a fixed pivot.
    let lastStep = performance.now();
    let rafId = 0;
    const tick = (now: number): void => {
        rafId = requestAnimationFrame(tick);
        const sheet = sheets[state.sheet];
        if (!sheet) return;
        const frames = directionFrames(sheet);
        const body = bodyLayer();
        const frameCount = Math.max(1, frames.length, body?.frames.length ?? 0);
        if (state.playing && now - lastStep >= 1000 / viewPrefs.fps) {
            lastStep = now;
            state.frame = (state.frame + 1) % frameCount;
        }
        const bounds = boundsOf([...frames, ...(body?.frames ?? [])]);
        const zoom = viewPrefs.zoom;
        const padding = 16;
        const width = Math.max(160, ((bounds?.width ?? 0) * zoom) + padding * 2);
        const height = Math.max(160, ((bounds?.height ?? 0) * zoom) + padding * 2);
        if (stage.width !== width || stage.height !== height) {
            stage.width = width;
            stage.height = height;
        }
        const ctx = stage.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);
        if (!bounds) return;
        const originX = (width - bounds.width * zoom) / 2 - bounds.minX * zoom;
        const originY = (height - bounds.height * zoom) / 2 - bounds.minY * zoom;
        const bodyFrame = body?.frames[state.frame % body.frames.length];
        if (body && bodyFrame) drawFrame(ctx, body.sheet, bodyFrame, originX, originY, zoom);
        const frame = frames[state.frame % Math.max(1, frames.length)];
        if (frame) drawFrame(ctx, sheet, frame, originX, originY, zoom);
        ctx.fillStyle = viewPrefs.background === 'light' ? '#000' : '#fff';
        ctx.fillText(`frame ${state.frame + 1}/${frameCount}`, 6, height - 6);
    };
    rafId = requestAnimationFrame(tick);
    stopAnimation = () => cancelAnimationFrame(rafId);
}

function route(): void {
    stopAnimation?.();
    stopAnimation = undefined;
    const [kind, ...rest] = location.hash.slice(1).split('/').map(decodeURIComponent);
    window.scrollTo(0, 0);
    if (kind === 'item') {
        const item = itemsByName.get(rest[0] ?? '');
        if (item) {
            void showTarget(targetFromItem(item));
            return;
        }
    }
    if (kind === 'file' && rest[0]) {
        void showTarget(targetFromFile(rest[0], Number(rest[1] ?? 0) || 0, rest[2]));
        return;
    }
    showCategory(kind || currentCategory);
}

async function start(): Promise<void> {
    main.textContent = 'Loading catalog…';
    const response = await fetch('sprite-catalog.json');
    if (!response.ok) {
        main.textContent = 'Could not load the sprite catalog. The viewer only works with `pnpm dev`.';
        return;
    }
    catalog = await response.json() as SpriteCatalog;
    indexCatalog();
    search.oninput = () => {
        if (location.hash.startsWith('#item/') || location.hash.startsWith('#file/')) location.hash = currentCategory;
        else showCategory(currentCategory);
    };
    window.addEventListener('hashchange', route);
    route();
}

void start();
