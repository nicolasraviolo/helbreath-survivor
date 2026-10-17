// Logros: de momento solo un aviso de "próximamente" (pedido por el propietario para una fase futura).
import { MENU_OVERLAY } from '../config/menus';
import { ACHIEVEMENTS_LINES } from '../data/credits';
import { addPanelText } from './CreditsScene';
import { MenuOverlayScene } from './MenuOverlayScene';

export class AchievementsScene extends MenuOverlayScene {
    protected readonly title = 'Achievements';

    constructor() {
        super('Achievements');
    }

    protected build(): void {
        addPanelText(this, ACHIEVEMENTS_LINES, this.contentTop);
        this.addList([{ label: 'Back', onConfirm: () => this.close() }], this.panelBottom - this.contentTop - MENU_OVERLAY.itemSpacing);
    }
}
