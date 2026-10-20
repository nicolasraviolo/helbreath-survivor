import Phaser from 'phaser';
import { ASSET_BASE_PATH, BOOT_SPRITES, LOADING_LOGO, SPRITES } from '../config/assetManifest';
import { DEFAULT_ANIMATION_FRAME_RATE } from '../config/gameConfig';
import { HBSpriteFile } from '../hb/HBSprite';

/** Primera escena: descarga solo lo que necesita la pantalla de carga (logo y letra del título) y salta a ella. */
export class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload(): void {
        this.load.setPath(ASSET_BASE_PATH);
        this.load.image(LOADING_LOGO.key, LOADING_LOGO.file);
        for (const key of BOOT_SPRITES) this.load.binary(key, SPRITES[key].file);
    }

    async create(): Promise<void> {
        for (const key of BOOT_SPRITES) {
            await new HBSpriteFile(key, SPRITES[key].type, DEFAULT_ANIMATION_FRAME_RATE).load(this);
        }
        this.scene.start('Preload');
    }
}
