// Dibujo de la pantalla de carga (M8), común a la carga inicial (PreloadScene) y a la de cada mapa (MapLoadScene,
// Fase 22A): fondo negro, título caligráfico, barra dorada con un texto debajo y el logo latiendo abajo a la derecha.
import type Phaser from 'phaser';
import { LOADING_LOGO } from '../config/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { px, UI_FONT_SIZE, UI_TEXT } from '../config/ui';
import { SpriteText } from '../hb/SpriteText';

const BAR_WIDTH = 400;
const BAR_HEIGHT = 16;
const BAR_COLOR = 0xc8a85a;
/** Logo abajo a la derecha (M8): alto en pantalla, margen y un "latido" lento (aparece y desaparece). */
const LOGO_HEIGHT = 112;
const LOGO_MARGIN = 20;
const LOGO_PULSE_MS = 1500;
const LOGO_MIN_ALPHA = 0.15;
/** Título encima de la barra, con la letra caligráfica de los hechizos (sprfonts.spr). */
const TITLE_SCALE = 2.4;
const TITLE_GAP = 70;
const TITLE_COLOR = 0xffd860;

export class LoadingScreen {
    private readonly bar: Phaser.GameObjects.Rectangle;

    /** `title` in the calligraphic font over the bar; `label` under it. */
    constructor(scene: Phaser.Scene, title: string, label: string) {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        scene.cameras.main.setBackgroundColor(0x000000);
        scene.add.rectangle(cx, cy, BAR_WIDTH + 4, BAR_HEIGHT + 4).setStrokeStyle(1, BAR_COLOR);
        this.bar = scene.add.rectangle(cx - BAR_WIDTH / 2, cy, 0, BAR_HEIGHT, BAR_COLOR).setOrigin(0, 0.5);
        scene.add.text(cx, cy + 24, label, { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: '#c8a85a' }).setOrigin(0.5, 0);
        new SpriteText(scene, cx, cy - TITLE_GAP, title, TITLE_COLOR, 'center').container.setScale(TITLE_SCALE);
        addLogo(scene);
    }

    /** 0..1. */
    public setProgress(value: number): void {
        this.bar.width = BAR_WIDTH * value;
    }
}

/** Logo pequeño abajo a la derecha que aparece y desaparece mientras carga. */
function addLogo(scene: Phaser.Scene): void {
    if (!scene.textures.exists(LOADING_LOGO.key)) return;
    const logo = scene.add.image(GAME_WIDTH - LOGO_MARGIN, GAME_HEIGHT - LOGO_MARGIN, LOADING_LOGO.key).setOrigin(1, 1);
    logo.setScale(LOGO_HEIGHT / logo.height);
    scene.tweens.add({
        targets: logo,
        alpha: { from: 1, to: LOGO_MIN_ALPHA },
        duration: LOGO_PULSE_MS,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });
}
