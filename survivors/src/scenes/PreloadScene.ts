import Phaser from 'phaser';
import { ASSET_BASE_PATH, MAPS, SOUNDS, SPRITES, type SpriteKey } from '../config/assetManifest';
import { registerEffectAnimations } from '../config/effects';
import { DEFAULT_ANIMATION_FRAME_RATE, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { px, UI_FONT, UI_FONT_SIZE } from '../config/ui';
import { DEFAULT_MAP, MAPS_DATA } from '../data/maps';
import { getMap } from '../hb/HBMap';
import { HBSpriteFile, SpriteType } from '../hb/HBSprite';
import { getTilePacksForIndices } from '../hb/mapAssets';
import { STREAMED_SPRITES } from '../systems/AssetStreamer';

/** Sprites loaded here: all but the monsters that come later (systems/AssetStreamer.ts loads those in the background). */
const UPFRONT_SPRITES = (Object.keys(SPRITES) as SpriteKey[]).filter((key) => !STREAMED_SPRITES.has(key));

const BAR_WIDTH = 400;
const BAR_HEIGHT = 16;
/** Share of the bar used by the download phase; the rest is .spr decoding. */
const DOWNLOAD_SHARE = 0.5;

/**
 * Carga en dos fases (como LoadingScreen.ts del original):
 * 1. Descarga los .spr del manifest y el mapa como binarios (los monstruos de oleadas posteriores, no: ver AssetStreamer).
 * 2. Lee el mapa, descarga solo los paquetes de casillas que usa y decodifica todo
 *    (PNG → texturas, pivotes y animaciones).
 */
export class PreloadScene extends Phaser.Scene {
    private bar!: Phaser.GameObjects.Rectangle;
    private label!: Phaser.GameObjects.Text;

    constructor() {
        super('Preload');
    }

    preload(): void {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        this.add.rectangle(cx, cy, BAR_WIDTH + 4, BAR_HEIGHT + 4).setStrokeStyle(1, 0xc8a85a);
        this.bar = this.add.rectangle(cx - BAR_WIDTH / 2, cy, 0, BAR_HEIGHT, 0xc8a85a).setOrigin(0, 0.5);
        this.label = this.add.text(cx, cy + 24, 'Loading…', { fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: '#c8a85a' })
            .setOrigin(0.5, 0);

        this.load.setPath(ASSET_BASE_PATH);
        for (const key of UPFRONT_SPRITES) {
            this.load.binary(key, SPRITES[key].file);
        }
        for (const [key, sound] of Object.entries(SOUNDS)) {
            this.load.audio(key, sound.file);
        }
        const mapAsset = MAPS_DATA[DEFAULT_MAP].asset;
        this.load.binary(mapAsset, MAPS[mapAsset].file);
    }

    async create(): Promise<void> {
        // Paquetes de casillas: dependen del mapa, así que se descargan en una segunda pasada.
        const map = getMap(this, MAPS_DATA[DEFAULT_MAP].asset);
        const tilePacks = getTilePacksForIndices(map.requiredTileIndices());
        this.label.setText('Loading map…');
        await this.loadBinaries(tilePacks.map((pack) => ({ key: pack.key, file: pack.file })));

        const spriteKeys = UPFRONT_SPRITES;
        const jobs = [
            ...tilePacks.map((pack) => new HBSpriteFile(pack.key, SpriteType.Tiles, DEFAULT_ANIMATION_FRAME_RATE, pack.start)),
            ...spriteKeys.map((key) => new HBSpriteFile(key, SPRITES[key].type, DEFAULT_ANIMATION_FRAME_RATE)),
        ];
        for (const [i, job] of jobs.entries()) {
            this.label.setText(`Preparing ${job.spriteKey}…`);
            await job.load(this);
            this.setProgress(DOWNLOAD_SHARE + ((i + 1) / jobs.length) * (1 - DOWNLOAD_SHARE));
        }
        registerEffectAnimations(this.anims, this.textures);
        this.scene.start('MainMenu');
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
