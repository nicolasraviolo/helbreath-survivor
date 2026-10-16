import Phaser from 'phaser';

/** Primera escena: ajustes globales y salto a la carga. */
export class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        this.scene.start('Preload');
    }
}
