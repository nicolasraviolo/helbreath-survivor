// Opción "Fullscreen" de los menús (Fase 9): pantalla completa, sobre todo para el móvil, donde la barra del navegador
// quita mucho sitio. En Android además deja el móvil fijo en horizontal. El iPhone no permite pantalla completa en
// la web: allí la opción no aparece.
import type Phaser from 'phaser';
import type { MenuItem } from './MenuList';

/** Menu option that toggles fullscreen, or nothing if the browser can't do it. */
export function fullscreenItem(scene: Phaser.Scene): MenuItem[] {
    if (!scene.scale.fullscreen.available) return [];
    return [{ label: 'Fullscreen', onConfirm: () => toggleFullscreen(scene) }];
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
