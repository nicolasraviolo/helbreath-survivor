import Phaser from 'phaser';
import { ASSET_BASE_PATH, SPRITES, type SpriteKey } from '../config/assetManifest';
import { DEFAULT_ANIMATION_FRAME_RATE, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { HBSpriteFile } from '../hb/HBSprite';

const BAR_WIDTH = 400;
const BAR_HEIGHT = 16;
/** Share of the bar used by the download phase; the rest is .spr decoding. */
const DOWNLOAD_SHARE = 0.5;

/**
 * Carga en dos fases (como LoadingScreen.ts del original):
 * 1. Descarga los .spr del manifest como binarios.
 * 2. Los decodifica (PNG → texturas, pivotes y animaciones).
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
        this.label = this.add.text(cx, cy + 24, 'Cargando…', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8a85a' })
            .setOrigin(0.5, 0);

        this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => this.setProgress(value * DOWNLOAD_SHARE));

        this.load.setPath(ASSET_BASE_PATH);
        for (const [key, asset] of Object.entries(SPRITES)) {
            this.load.binary(key, asset.file);
        }
    }

    async create(): Promise<void> {
        const keys = Object.keys(SPRITES) as SpriteKey[];
        for (const [i, key] of keys.entries()) {
            this.label.setText(`Preparando ${key}…`);
            await new HBSpriteFile(key, SPRITES[key].type, DEFAULT_ANIMATION_FRAME_RATE).load(this);
            this.setProgress(DOWNLOAD_SHARE + ((i + 1) / keys.length) * (1 - DOWNLOAD_SHARE));
        }
        this.scene.start('SpriteTest');
    }

    private setProgress(value: number): void {
        this.bar.width = BAR_WIDTH * value;
    }
}
