import Phaser from 'phaser';
// Fuente de la interfaz (Comic Neue, licencia OFL): va incluida en el juego, así se ve igual en todos los dispositivos.
import '@fontsource/comic-neue/latin-400.css';
import '@fontsource/comic-neue/latin-700.css';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { TOUCH_POINTERS } from './config/touch';
import { loadUiFont } from './config/ui';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MapLoadScene } from './scenes/MapLoadScene';
import { MapSelectScene } from './scenes/MapSelectScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { CharacterSlotsScene } from './scenes/CharacterSlotsScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { LootScene } from './scenes/LootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PauseScene } from './scenes/PauseScene';
import { CharacterInfoScene } from './scenes/CharacterInfoScene';
import { EquipmentScene } from './scenes/EquipmentScene';
import { WarehouseScene } from './scenes/WarehouseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ControlsScene } from './scenes/ControlsScene';
import { CreditsScene } from './scenes/CreditsScene';
import { RunChoiceScene } from './scenes/RunChoiceScene';
import { ReleaseNotesScene } from './scenes/ReleaseNotesScene';
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
        // Móvil: un dedo para moverse, otro para apuntar (Fase 15C) y otro para la pausa o las cartas.
        input: { activePointers: TOUCH_POINTERS },
        // El clic derecho apunta (Fase 15B): sin el menú del navegador encima del juego.
        disableContextMenu: true,
        // HudScene, LevelUpScene y los menús que se abren encima (pausa, ajustes...) van después para dibujarse encima.
        scene: [
            BootScene, PreloadScene, MainMenuScene, CharacterSlotsScene, CharacterSelectScene, MapSelectScene, MapLoadScene, GameScene, HudScene, LevelUpScene, LootScene, GameOverScene,
            PauseScene, CharacterInfoScene, EquipmentScene, WarehouseScene, SettingsScene, ControlsScene, CreditsScene, RunChoiceScene, ReleaseNotesScene, AchievementsScene, HowToPlayScene, SpriteTestScene,
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
