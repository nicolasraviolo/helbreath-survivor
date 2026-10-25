// Botón pequeño con el logo de Discord en la esquina de arriba a la derecha del menú principal (25-oct-2026).
// Abre la invitación al servidor de la comunidad en otra pestaña. Va a la izquierda del de pantalla completa,
// o en su sitio si ese no aparece (iPhone, app instalada).
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { DISCORD_BUTTON, FULLSCREEN_BUTTON } from '../config/menus';
import { fullscreenAvailable } from './fullscreen';

export function addDiscordButton(scene: Phaser.Scene, ready: () => boolean): void {
    const { margin } = FULLSCREEN_BUTTON;
    // Each corner button takes a square of side margin * 2.
    const x = GAME_WIDTH - margin - (fullscreenAvailable(scene) ? margin * 2 : 0);
    const icon = scene.add.image(x, margin, DISCORD_BUTTON.texture)
        .setDisplaySize(DISCORD_BUTTON.size, DISCORD_BUTTON.size)
        .setAlpha(DISCORD_BUTTON.alpha);
    const baseScale = icon.scaleX;
    // The click area is a bit bigger than the icon, for fingers.
    const zone = scene.add.zone(x, margin, margin * 2, margin * 2).setInteractive({ useHandCursor: true });
    const hover = (on: boolean) => {
        icon.setScale(on ? baseScale * DISCORD_BUTTON.hoverScale : baseScale).setAlpha(on ? 1 : DISCORD_BUTTON.alpha);
    };
    zone.on(Phaser.Input.Events.POINTER_OVER, () => hover(true));
    zone.on(Phaser.Input.Events.POINTER_OUT, () => hover(false));
    // On lifting the finger: browsers only open new tabs from a finished tap or click.
    zone.on(Phaser.Input.Events.POINTER_UP, () => {
        if (!ready()) return;
        hover(false);
        window.open(DISCORD_BUTTON.url, '_blank', 'noopener');
    });
}
