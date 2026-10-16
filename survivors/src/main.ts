import Phaser from 'phaser';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { SpriteTestScene } from './scenes/SpriteTestScene';

new Phaser.Game({
    // WebGL: las texturas se crean desde ImageBitmap y se liberan tras subirlas a la GPU.
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, PreloadScene, SpriteTestScene],
});
