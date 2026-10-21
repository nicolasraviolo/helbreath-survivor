import Phaser from 'phaser';
import { ASSET_BASE_PATH, BOOT_SPRITES, ON_DEMAND_SPRITES, PHONE_ONLY_SPRITES, RUN_SPRITES, SOUNDS, SPRITES, UI_IMAGES, type SpriteKey } from '../config/assetManifest';
import { DEBUG_START } from '../config/debugStart';
import { COMPACT_UI } from '../config/device';
import { DEFAULT_ANIMATION_FRAME_RATE } from '../config/gameConfig';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER } from '../data/characters';
import { CHOSEN_MAP_KEY, DEFAULT_MAP } from '../data/maps';
import { HBSpriteFile, SpriteType } from '../hb/HBSprite';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { loadTimer } from '../systems/LoadTimer';
import { LoadingScreen } from '../ui/LoadingScreen';
import type { MapLoadSceneData } from './MapLoadScene';

/** Effects of one class only: loaded with the map, for that class (Fase 22B). */
const CLASS_RUN_SPRITES: ReadonlySet<SpriteKey> = new Set(Object.values(CHARACTERS).flatMap((def) => def.runSprites));

/**
 * Sprites loaded here: only what the menus need (interface and characters). Since Fase 22B no monster, run effect
 * or map: MapLoadScene loads those of the chosen map and class.
 */
const UPFRONT_SPRITES = (Object.keys(SPRITES) as SpriteKey[]).filter((key) =>
    SPRITES[key].type !== SpriteType.Monster && !RUN_SPRITES.has(key) && !CLASS_RUN_SPRITES.has(key)
    && !BOOT_SPRITES.has(key) && !ON_DEMAND_SPRITES.has(key) && (COMPACT_UI || !PHONE_ONLY_SPRITES.has(key)));

/** Share of the bar used by the download phase; the rest is .spr decoding. */
const DOWNLOAD_SHARE = 0.5;
const TITLE_TEXT = 'Helbreath Survivors';

/**
 * Carga en dos fases (como LoadingScreen.ts del original):
 * 1. Descarga los .spr de los menús (interfaz y personajes) y los sonidos.
 * 2. Los decodifica (PNG → texturas, pivotes y animaciones).
 * Fase 22A: los mapas ya no se cargan aquí, sino al elegirlos (MapLoadScene). Fase 22B: tampoco los monstruos ni los
 * efectos de partida; los tiempos de cada carga los mide `pnpm check loadtime` (systems/LoadTimer.ts).
 */
export class PreloadScene extends Phaser.Scene {
    private screen!: LoadingScreen;

    constructor() {
        super('Preload');
    }

    preload(): void {
        this.screen = new LoadingScreen(this, TITLE_TEXT, 'Loading');
        loadTimer.start('Preload');
        this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => this.screen.setProgress(value * DOWNLOAD_SHARE));
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this.load.off(Phaser.Loader.Events.PROGRESS);
            loadTimer.downloaded('Preload');
        });
        this.load.setPath(ASSET_BASE_PATH);
        for (const key of UPFRONT_SPRITES) {
            this.load.binary(key, SPRITES[key].file);
        }
        for (const [key, sound] of Object.entries(SOUNDS)) {
            this.load.audio(key, sound.file);
        }
        for (const [key, image] of Object.entries(UI_IMAGES)) this.load.image(key, image.file);
    }

    async create(): Promise<void> {
        if (DEBUG_START.holdLoading) return;
        const jobs = UPFRONT_SPRITES.map((key) => new HBSpriteFile(key, SPRITES[key].type, DEFAULT_ANIMATION_FRAME_RATE));
        for (const [i, job] of jobs.entries()) {
            await job.load(this);
            this.screen.setProgress(DOWNLOAD_SHARE + ((i + 1) / jobs.length) * (1 - DOWNLOAD_SHARE));
        }
        loadTimer.end('Preload');
        // ?play / ?debug= (solo en desarrollo, config/debugStart.ts): directo a la partida.
        if (DEBUG_START.character) this.registry.set(CHOSEN_CHARACTER_KEY, DEBUG_START.character);
        // With ?characters=demo the run is played by the example character of that class (to test its Level, Fase 20A).
        if (DEBUG_START.play && DEBUG_START.characters === 'demo') {
            const classId = DEBUG_START.character ?? DEFAULT_CHARACTER;
            const demo = characterStore.all.find((c) => c?.classId === classId);
            if (demo) this.registry.set(ACTIVE_CHARACTER_KEY, demo.uid);
        }
        if (DEBUG_START.play) {
            // Fase 22A: the map is loaded first (?map=, or Bleeding Isle as before).
            const map = DEBUG_START.map ?? DEFAULT_MAP;
            this.registry.set(CHOSEN_MAP_KEY, map);
            this.scene.start('MapLoad', { map } satisfies MapLoadSceneData);
            return;
        }
        const open = DEBUG_START.open === 'CharacterInfo' || DEBUG_START.open === 'Equipment' || DEBUG_START.open === 'Warehouse' || DEBUG_START.open === 'RunChoice' ? 'CharacterSlots' : DEBUG_START.open;
        if (open === 'MapSelect') this.openMapSelectForDebug();
        else this.scene.start(open === 'CharacterSelect' || open === 'CharacterSlots' ? open : 'MainMenu');
    }

    /** ?open=mapselect: Select Map with the first saved character (or none). */
    private openMapSelectForDebug(): void {
        const first = characterStore.all.find((c) => c !== undefined);
        if (first) {
            this.registry.set(CHOSEN_CHARACTER_KEY, first.classId);
            this.registry.set(ACTIVE_CHARACTER_KEY, first.uid);
        }
        this.scene.start('MapSelect');
    }
}
