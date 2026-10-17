import Phaser from 'phaser';
// Fuente de la interfaz (Comic Neue, licencia OFL): va incluida en el juego, así se ve igual en todos los dispositivos.
import '@fontsource/comic-neue/latin-400.css';
import '@fontsource/comic-neue/latin-700.css';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { TOUCH_POINTERS } from './config/touch';
import { loadUiFont } from './config/ui';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { CreditsScene } from './scenes/CreditsScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { SpriteTestScene } from './scenes/SpriteTestScene';
import { initInstall } from './ui/install';

function startGame(): void {
    const game = new Phaser.Game({
        // WebGL: las texturas se crean desde ImageBitmap y se liberan tras subirlas a la GPU.
        type: Phaser.WEBGL,
        parent: 'game',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: BACKGROUND_COLOR,
        pixelArt: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: 'game' },
        // Móvil: un dedo en el joystick y otro para la pausa o las cartas.
        input: { activePointers: TOUCH_POINTERS },
        // HudScene, LevelUpScene y los menús que se abren encima (pausa, ajustes...) van después para dibujarse encima.
        scene: [
            BootScene, PreloadScene, MainMenuScene, CharacterSelectScene, GameScene, HudScene, LevelUpScene, GameOverScene,
            PauseScene, SettingsScene, CreditsScene, AchievementsScene, HowToPlayScene, SpriteTestScene,
        ],
    });

    // Solo en desarrollo: acceso desde la consola del navegador para depurar (p. ej. __game.scene.getScene('Game')).
    if (import.meta.env.DEV) {
        (window as unknown as { __game: Phaser.Game }).__game = game;
    }
}

// App instalable (Fase 12): hay que escuchar el aviso de Chrome desde el principio.
initInstall();

// Phaser draws text once into a canvas: if the font isn't loaded yet it keeps the fallback, so wait for it first.
void loadUiFont().finally(startGame);
