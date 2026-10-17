// Pantalla completa (Fase 9), sobre todo para el móvil, donde la barra del navegador quita mucho sitio. En Android
// además deja el móvil fijo en horizontal. El iPhone no permite pantalla completa en la web: allí no aparece.
// Fase 12C: es una casilla de Settings, una opción de la Pausa y un icono pequeño en una esquina del menú principal.
// En la app instalada no sale en ningún sitio: ya se abre a pantalla completa.
import Phaser from 'phaser';
import { FULLSCREEN_BUTTON } from '../config/menus';
import type { MenuItem } from './MenuList';

/**
 * Opened from the installed app's icon (pwa/manifest.webmanifest). Read once at start-up: later, entering fullscreen
 * from a browser tab also matches "display-mode: fullscreen".
 */
const INSTALLED_APP = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;

/** Whether the fullscreen option should be offered at all. */
export function fullscreenAvailable(scene: Phaser.Scene): boolean {
    return scene.scale.fullscreen.available && !INSTALLED_APP;
}

/** Menu option that toggles fullscreen (Pause), or nothing if it isn't available. */
export function fullscreenItem(scene: Phaser.Scene): MenuItem[] {
    if (!fullscreenAvailable(scene)) return [];
    return [{ label: 'Fullscreen', onConfirm: () => toggleFullscreen(scene) }];
}

/** Settings row with a checkbox, ticked while in fullscreen, or nothing if it isn't available. */
export function fullscreenCheckboxItem(scene: Phaser.Scene): MenuItem[] {
    if (!fullscreenAvailable(scene)) return [];
    const toggle = () => toggleFullscreen(scene);
    return [{ label: 'Fullscreen', checked: () => scene.scale.isFullscreen, onConfirm: toggle, onLeft: toggle, onRight: toggle }];
}

/** Small button in the top-right corner (main menu): four corner brackets, like the usual fullscreen icon. */
export function addFullscreenButton(scene: Phaser.Scene, ready: () => boolean): void {
    if (!fullscreenAvailable(scene)) return;
    const { margin, size, corner, lineWidth } = FULLSCREEN_BUTTON;
    const x = scene.scale.gameSize.width - margin;
    const y = margin;
    const g = scene.add.graphics({ x, y });
    const draw = (color: number) => {
        const h = size / 2;
        const c = size * corner;
        g.clear();
        g.fillStyle(0x000000, FULLSCREEN_BUTTON.backAlpha).fillRect(-h - lineWidth, -h - lineWidth, size + lineWidth * 2, size + lineWidth * 2);
        g.lineStyle(lineWidth, color);
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
            g.beginPath();
            g.moveTo(sx * h, sy * (h - c));
            g.lineTo(sx * h, sy * h);
            g.lineTo(sx * (h - c), sy * h);
            g.strokePath();
        }
    };
    draw(FULLSCREEN_BUTTON.color);
    // The click area is a bit bigger than the icon, for fingers.
    const zone = scene.add.zone(x, y, margin * 2, margin * 2).setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.POINTER_OVER, () => draw(FULLSCREEN_BUTTON.hoverColor));
    zone.on(Phaser.Input.Events.POINTER_OUT, () => draw(FULLSCREEN_BUTTON.color));
    zone.on(Phaser.Input.Events.POINTER_UP, () => {
        if (ready()) toggleFullscreen(scene);
    });
}

function toggleFullscreen(scene: Phaser.Scene): void {
    if (scene.scale.isFullscreen) {
        scene.scale.stopFullscreen();
        return;
    }
    scene.scale.startFullscreen();
    // Only some browsers (Android Chrome) allow locking the orientation, and only in fullscreen.
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => undefined);
}
