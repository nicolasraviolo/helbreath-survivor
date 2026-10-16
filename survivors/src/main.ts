import Phaser from 'phaser';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';
import { SpriteTestScene } from './scenes/SpriteTestScene';

const game = new Phaser.Game({
    // WebGL: las texturas se crean desde ImageBitmap y se liberan tras subirlas a la GPU.
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, PreloadScene, GameScene, SpriteTestScene],
});

// Solo en desarrollo: acceso desde la consola del navegador para depurar (p. ej. __game.scene.getScene('Game')).
if (import.meta.env.DEV) {
    (window as unknown as { __game: Phaser.Game }).__game = game;
}
