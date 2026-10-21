import Phaser from 'phaser';
import { ASSET_BASE_PATH, BOOT_SPRITES, LOADING_LOGO, MAPS, MINIMAPS, ON_DEMAND_SPRITES, PHONE_ONLY_SPRITES, SOUNDS, SPRITES, UI_IMAGES, type SpriteKey } from '../config/assetManifest';
import { DEBUG_START } from '../config/debugStart';
import { COMPACT_UI } from '../config/device';
import { registerEffectAnimations } from '../config/effects';
import { DEFAULT_ANIMATION_FRAME_RATE, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { px, UI_TEXT, UI_FONT_SIZE } from '../config/ui';
import { CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER } from '../data/characters';
import { DEFAULT_MAP, MAPS_DATA } from '../data/maps';
import { getMap } from '../hb/HBMap';
import { HBSpriteFile, SpriteType } from '../hb/HBSprite';
import { SpriteText } from '../hb/SpriteText';
import { getTilePacksForIndices } from '../hb/mapAssets';
import { STREAMED_SPRITES } from '../systems/AssetStreamer';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';

/** Sprites loaded here: all but the monsters that come later (systems/AssetStreamer.ts loads those in the background). */
const UPFRONT_SPRITES = (Object.keys(SPRITES) as SpriteKey[])
    .filter((key) => !BOOT_SPRITES.has(key) && !STREAMED_SPRITES.has(key) && !ON_DEMAND_SPRITES.has(key) && (COMPACT_UI || !PHONE_ONLY_SPRITES.has(key)));

const BAR_WIDTH = 400;
const BAR_HEIGHT = 16;
/** Share of the bar used by the download phase; the rest is .spr decoding. */
const DOWNLOAD_SHARE = 0.5;
/** Logo abajo a la derecha (M8): alto en pantalla, margen y un "latido" lento (aparece y desaparece). */
const LOGO_HEIGHT = 112;
const LOGO_MARGIN = 20;
const LOGO_PULSE_MS = 1500;
const LOGO_MIN_ALPHA = 0.15;
/** Título "Helbreath Survivors" encima de la barra, con la letra caligráfica de los hechizos (sprfonts.spr). */
const TITLE_TEXT = 'Helbreath Survivors';
const TITLE_SCALE = 2.4;
const TITLE_GAP = 70;
const TITLE_COLOR = 0xffd860;

/**
 * Carga en dos fases (como LoadingScreen.ts del original):
 * 1. Descarga los .spr del manifest y el mapa como binarios (los monstruos de oleadas posteriores, no: ver AssetStreamer).
 * 2. Lee el mapa, descarga solo los paquetes de casillas que usa y decodifica todo
 *    (PNG → texturas, pivotes y animaciones).
 */
export class PreloadScene extends Phaser.Scene {
    private bar!: Phaser.GameObjects.Rectangle;

    constructor() {
        super('Preload');
    }

    preload(): void {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        this.cameras.main.setBackgroundColor(0x000000);
        this.add.rectangle(cx, cy, BAR_WIDTH + 4, BAR_HEIGHT + 4).setStrokeStyle(1, 0xc8a85a);
        this.bar = this.add.rectangle(cx - BAR_WIDTH / 2, cy, 0, BAR_HEIGHT, 0xc8a85a).setOrigin(0, 0.5);
        this.add.text(cx, cy + 24, 'Loading', { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: '#c8a85a' })
            .setOrigin(0.5, 0);
        new SpriteText(this, cx, cy - TITLE_GAP, TITLE_TEXT, TITLE_COLOR, 'center').container.setScale(TITLE_SCALE);
        this.addLogo();

        this.load.setPath(ASSET_BASE_PATH);
        for (const key of UPFRONT_SPRITES) {
            this.load.binary(key, SPRITES[key].file);
        }
        for (const [key, sound] of Object.entries(SOUNDS)) {
            this.load.audio(key, sound.file);
        }
        const mapAsset = MAPS_DATA[DEFAULT_MAP].asset;
        this.load.binary(mapAsset, MAPS[mapAsset].file);
        const minimap = MAPS_DATA[DEFAULT_MAP].minimap;
        this.load.image(minimap, MINIMAPS[minimap].file);
        for (const [key, image] of Object.entries(UI_IMAGES)) this.load.image(key, image.file);
    }

    async create(): Promise<void> {
        // Paquetes de casillas: dependen del mapa, así que se descargan en una segunda pasada.
        const map = getMap(this, MAPS_DATA[DEFAULT_MAP].asset);
        const tilePacks = getTilePacksForIndices(map.requiredTileIndices());
        await this.loadBinaries(tilePacks.map((pack) => ({ key: pack.key, file: pack.file })));
        if (DEBUG_START.holdLoading) return;

        const spriteKeys = UPFRONT_SPRITES;
        const jobs = [
            ...tilePacks.map((pack) => new HBSpriteFile(pack.key, SpriteType.Tiles, DEFAULT_ANIMATION_FRAME_RATE, pack.start)),
            ...spriteKeys.map((key) => new HBSpriteFile(key, SPRITES[key].type, DEFAULT_ANIMATION_FRAME_RATE)),
        ];
        for (const [i, job] of jobs.entries()) {
            await job.load(this);
            this.setProgress(DOWNLOAD_SHARE + ((i + 1) / jobs.length) * (1 - DOWNLOAD_SHARE));
        }
        registerEffectAnimations(this.anims, this.textures);
        // ?play / ?debug= (solo en desarrollo, config/debugStart.ts): directo a la partida.
        if (DEBUG_START.character) this.registry.set(CHOSEN_CHARACTER_KEY, DEBUG_START.character);
        // With ?characters=demo the run is played by the example character of that class (to test its Level, Fase 20A).
        if (DEBUG_START.play && DEBUG_START.characters === 'demo') {
            const classId = DEBUG_START.character ?? DEFAULT_CHARACTER;
            const demo = characterStore.all.find((c) => c?.classId === classId);
            if (demo) this.registry.set(ACTIVE_CHARACTER_KEY, demo.uid);
        }
        const open = DEBUG_START.open === 'CharacterInfo' || DEBUG_START.open === 'Equipment' || DEBUG_START.open === 'Warehouse' || DEBUG_START.open === 'RunChoice' ? 'CharacterSlots' : DEBUG_START.open;
        this.scene.start(DEBUG_START.play ? 'Game' : open === 'CharacterSelect' || open === 'CharacterSlots' ? open : 'MainMenu');
    }

    /** Logo pequeño abajo a la derecha que aparece y desaparece mientras carga. */
    private addLogo(): void {
        if (!this.textures.exists(LOADING_LOGO.key)) return;
        const logo = this.add.image(GAME_WIDTH - LOGO_MARGIN, GAME_HEIGHT - LOGO_MARGIN, LOADING_LOGO.key).setOrigin(1, 1);
        logo.setScale(LOGO_HEIGHT / logo.height);
        this.tweens.add({
            targets: logo,
            alpha: { from: 1, to: LOGO_MIN_ALPHA },
            duration: LOGO_PULSE_MS,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });
    }

    private loadBinaries(files: Array<{ key: string; file: string }>): Promise<void> {
        return new Promise((resolve) => {
            this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => this.setProgress(value * DOWNLOAD_SHARE));
            this.load.once(Phaser.Loader.Events.COMPLETE, () => {
                this.load.off(Phaser.Loader.Events.PROGRESS);
                resolve();
            });
            for (const { key, file } of files) {
                this.load.binary(key, file);
            }
            this.load.start();
        });
    }

    private setProgress(value: number): void {
        this.bar.width = BAR_WIDTH * value;
    }
}
