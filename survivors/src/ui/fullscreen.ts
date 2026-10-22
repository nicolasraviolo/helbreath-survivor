// Pantalla completa (Fase 9), sobre todo para el móvil, donde la barra del navegador quita mucho sitio. En Android
// además deja el móvil fijo en horizontal. El iPhone no permite pantalla completa en la web: allí no aparece.
// Fase 12C: es una casilla de Settings, una opción de la Pausa y un icono pequeño en una esquina del menú principal.
// En la app instalada no sale en ningún sitio: ya se abre a pantalla completa.
import Phaser from 'phaser';
import { FULLSCREEN_BUTTON } from '../config/menus';
import { TOUCH_FULLSCREEN_BUTTON } from '../config/touch';
import { ScreenLayer } from './renderScale';
import type { MenuItem } from './MenuList';

/**
 * Opened from the installed app's icon: its manifest opens "./?app=1" (pwa/manifest.webmanifest). Fase 25: "display-mode:
 * fullscreen" no longer counts, because Chrome put in fullscreen by hand (F11, or by Steam on a Steam Deck) matches it too
 * and the button vanished everywhere. "standalone" still counts, for apps installed before the "?app=1" marker.
 */
const INSTALLED_APP = new URLSearchParams(window.location.search).get('app') === '1'
    || window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;

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
        g.clear();
        g.fillStyle(0x000000, FULLSCREEN_BUTTON.backAlpha).fillRect(-h - lineWidth, -h - lineWidth, size + lineWidth * 2, size + lineWidth * 2);
        drawBrackets(g, size, corner, lineWidth, color);
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

/**
 * Fase 25: round button for touch screens (run and town), left of the "II" pause one (and of the stats one in a run). Fixed on screen while the camera
 * moves. Nothing where fullscreen isn't available (iPhone, installed app).
 */
export function addTouchFullscreenButton(scene: Phaser.Scene, depth: number, x: number = TOUCH_FULLSCREEN_BUTTON.x): void {
    if (!fullscreenAvailable(scene)) return;
    const b = TOUCH_FULLSCREEN_BUTTON;
    const button = scene.add.graphics({ x, y: b.y })
        .fillStyle(b.color, b.alpha).fillCircle(0, 0, b.radius)
        .lineStyle(2, b.ringColor, 0.6).strokeCircle(0, 0, b.radius);
    drawBrackets(button, b.iconSize, b.iconCorner, b.iconLineWidth, b.iconColor);
    const zone = scene.add.zone(x, b.y, b.hitRadius * 2, b.hitRadius * 2)
        .setInteractive(new Phaser.Geom.Circle(b.hitRadius, b.hitRadius, b.hitRadius), Phaser.Geom.Circle.Contains);
    new ScreenLayer(scene, depth).addFixed(button, zone);
    // On lifting the finger: browsers only allow fullscreen from a finished tap or click.
    zone.on(Phaser.Input.Events.POINTER_UP, () => toggleFullscreen(scene));
}

/** The usual fullscreen icon: four corner brackets around (0, 0). */
function drawBrackets(g: Phaser.GameObjects.Graphics, size: number, corner: number, lineWidth: number, color: number): void {
    const h = size / 2;
    const c = size * corner;
    g.lineStyle(lineWidth, color);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        g.beginPath();
        g.moveTo(sx * h, sy * (h - c));
        g.lineTo(sx * h, sy * h);
        g.lineTo(sx * (h - c), sy * h);
        g.strokePath();
    }
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
