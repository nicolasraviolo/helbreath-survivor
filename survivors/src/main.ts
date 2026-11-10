import Phaser from 'phaser';
// Fuente de la interfaz (Comic Neue, licencia OFL): va incluida en el juego, así se ve igual en todos los dispositivos.
import '@fontsource/comic-neue/latin-400.css';
import '@fontsource/comic-neue/latin-700.css';
// Letra pixel art de los números de daño (Micro 5, licencia OFL; elegida por el propietario el 4-nov-2026).
import '@fontsource/micro-5/latin-400.css';
// Letras del nuevo estilo de ventanas de Helbreath Off (Fase Off-12, licencia OFL): Alegreya para títulos y nombres,
// Alegreya Sans para el texto (off/config/offTheme.ts).
import '@fontsource/alegreya/latin-500.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-500.css';
import { BACKGROUND_COLOR } from './config/gameConfig';
import { TOUCH_POINTERS } from './config/touch';
import { loadUiFont } from './config/ui';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MapLoadScene } from './scenes/MapLoadScene';
import { MapSelectScene } from './scenes/MapSelectScene';
import { TownScene } from './scenes/TownScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameSelectScene } from './scenes/GameSelectScene';
import { OffCreateScene } from './off/scenes/OffCreateScene';
import { OffBagScene } from './off/scenes/OffBagScene';
import { OffDialogScene } from './off/scenes/OffDialogScene';
import { OffMapSelectScene } from './off/scenes/OffMapSelectScene';
import { OffMercenaryScene } from './off/scenes/OffMercenaryScene';
import { OffStoreScene } from './off/scenes/OffStoreScene';
import { OffUiKitScene } from './off/scenes/OffUiKitScene';
import { OffWarehouseScene } from './off/scenes/OffWarehouseScene';
import { OffHomeScene } from './off/scenes/OffHomeScene';
import { OffSlotsScene } from './off/scenes/OffSlotsScene';
import { OffHudScene } from './off/scenes/OffHudScene';
import { OffWorldScene } from './off/scenes/OffWorldScene';
import { CharacterSlotsScene } from './scenes/CharacterSlotsScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { LootScene } from './scenes/LootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PauseScene } from './scenes/PauseScene';
import { CharacterInfoScene } from './scenes/CharacterInfoScene';
import { EquipmentScene } from './scenes/EquipmentScene';
import { ShopScene } from './scenes/ShopScene';
import { DyeScene } from './scenes/DyeScene';
import { SmithScene } from './scenes/SmithScene';
import { WarehouseScene } from './scenes/WarehouseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ControlsScene } from './scenes/ControlsScene';
import { CreditsScene } from './scenes/CreditsScene';
import { RunChoiceScene } from './scenes/RunChoiceScene';
import { TransferScene } from './scenes/TransferScene';
import { NpcDialogScene } from './scenes/NpcDialogScene';
import { ReleaseNotesScene } from './scenes/ReleaseNotesScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { MissionsScene } from './scenes/MissionsScene';
import { SpriteTestScene } from './scenes/SpriteTestScene';
import { initInstall } from './ui/install';
import { registerXbrPipeline } from './hb/XbrPipeline';
import { CANVAS_HEIGHT, CANVAS_WIDTH, RenderScalePlugin } from './ui/renderScale';

function startGame(): void {
    const game = new Phaser.Game({
        // WebGL: las texturas se crean desde ImageBitmap y se liberan tras subirlas a la GPU.
        type: Phaser.WEBGL,
        parent: 'game',
        // Nitidez: el lienzo es 800x600 por RENDER_SCALE y cada cámara hace zoom (ui/renderScale.ts).
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: BACKGROUND_COLOR,
        pixelArt: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: 'game' },
        // Móvil: un dedo para moverse, otro para apuntar (Fase 15C) y otro para la pausa o las cartas.
        input: { activePointers: TOUCH_POINTERS },
        // El clic derecho apunta (Fase 15B): sin el menú del navegador encima del juego.
        disableContextMenu: true,
        // Filtro xBR para los sprites ampliados (Fase 28¾): cada sprite lo activa con setPipeline(XBR_PIPELINE).
        callbacks: { postBoot: registerXbrPipeline },
        plugins: { scene: [{ key: 'RenderScale', plugin: RenderScalePlugin, mapping: 'renderScale' }] },
        // HudScene, LevelUpScene y los menús que se abren encima (pausa, ajustes...) van después para dibujarse encima.
        scene: [
            BootScene, PreloadScene, GameSelectScene, OffHomeScene, OffSlotsScene, OffCreateScene, OffWorldScene, OffHudScene, OffBagScene, OffDialogScene, OffMapSelectScene, OffMercenaryScene, OffStoreScene, OffWarehouseScene, OffUiKitScene, MainMenuScene, CharacterSlotsScene, TownScene, MapSelectScene, MapLoadScene, GameScene, HudScene, LevelUpScene, LootScene, GameOverScene,
            PauseScene, CharacterInfoScene, EquipmentScene, WarehouseScene, SettingsScene, ControlsScene, CreditsScene, RunChoiceScene, TransferScene, NpcDialogScene, ShopScene, DyeScene, SmithScene, ReleaseNotesScene, AchievementsScene, MissionsScene, HowToPlayScene, SpriteTestScene,
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
