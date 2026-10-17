// Créditos con el aviso legal (docs/DESIGN.md). Se abre desde el menú principal.
import { MENU_OVERLAY, MENU_TEXT_STYLE } from '../config/menus';
import { CREDITS_LINES } from '../data/credits';
import { MenuOverlayScene } from './MenuOverlayScene';

export class CreditsScene extends MenuOverlayScene {
    protected readonly title = 'Credits';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;

    constructor() {
        super('Credits');
    }

    protected build(): void {
        addPanelText(this, CREDITS_LINES, this.contentTop - MENU_OVERLAY.itemSpacing / 2);
        this.addList([{ label: 'Back', onConfirm: () => this.close() }], this.panelBottom - this.contentTop - MENU_OVERLAY.itemSpacing);
    }
}

/** Centred lines of plain text, from `top` down. */
export function addPanelText(scene: Phaser.Scene, lines: readonly string[], top: number): void {
    scene.add.text(MENU_OVERLAY.panelX, top, [...lines], MENU_TEXT_STYLE).setOrigin(0.5, 0);
}
