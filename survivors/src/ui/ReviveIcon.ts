// Icono de Abaddon's Blood en la interfaz de partida (Fase 21E): el Red Ball en un círculo oscuro con borde dorado
// mientras te queda la resurrección; oscuro cuando ya se usó; oculto si no está desbloqueado. Lo usan la barra
// clásica y la compacta (cada una lo coloca a su manera, HUD_REVIVE).
// El dibujo viene de item-pack.spr, que se pide al empezar la partida: si aún no ha llegado, sale solo el círculo.
import Phaser from 'phaser';
import { itemPackTexture } from '../config/equipment';
import { HUD_REVIVE } from '../config/hud';
import { ABADDON } from '../data/abaddon';
import type { ReviveHudState } from '../systems/AbaddonRevive';

export class ReviveIcon {
    private readonly back: Phaser.GameObjects.Arc;
    private icon: Phaser.GameObjects.Image | undefined;
    private shown: ReviveHudState | null = null;

    constructor(private readonly scene: Phaser.Scene, private readonly x: number, private readonly y: number, private readonly parent?: Phaser.GameObjects.Container, private readonly depth = 0) {
        const r = HUD_REVIVE;
        this.back = scene.add.circle(x, y, r.radius, r.backColor, r.backAlpha).setDepth(depth).setVisible(false);
        parent?.add(this.back);
    }

    public update(state: ReviveHudState): void {
        if (!this.icon) this.tryCreateIcon();
        if (state === this.shown && (this.icon || state === undefined)) return;
        this.shown = state;
        const r = HUD_REVIVE;
        const ready = state === 'ready';
        this.back.setVisible(state !== undefined).setStrokeStyle(r.borderWidth, ready ? r.readyBorder : r.usedBorder);
        if (!this.icon) return;
        this.icon.setVisible(state !== undefined).setAlpha(ready ? 1 : r.usedAlpha);
        if (ready) this.icon.clearTint();
        else this.icon.setTint(r.usedTint);
    }

    public destroy(): void {
        this.back.destroy();
        this.icon?.destroy();
    }

    private tryCreateIcon(): void {
        const key = itemPackTexture(ABADDON.icon.sheet);
        if (!this.scene.textures.exists(key)) return;
        const icon = this.scene.add.image(this.x, this.y, key, String(ABADDON.icon.frame)).setDepth(this.depth);
        icon.setScale(Math.min(HUD_REVIVE.iconSize / icon.width, HUD_REVIVE.iconSize / icon.height));
        this.parent?.add(icon);
        this.icon = icon;
        // Shown with the state of the next update.
        this.shown = null;
    }
}
