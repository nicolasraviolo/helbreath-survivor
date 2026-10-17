// "How to play" (Fase 11): cómo se juega y los controles de teclado y ratón, mando (con iconos de Xbox) y táctil.
// Se abre desde el menú principal y desde la pausa. Las páginas se cambian con ◄ ► en la fila "Page".
// Es el único sitio que explica los controles; los textos están en data/howToPlay.ts.
import Phaser from 'phaser';
import { HOW_TO_PLAY, MENU_OVERLAY, MENU_TEXT_STYLE, PAD_ICON } from '../config/menus';
import { UI_FONT_SIZE, UI_TEXT, px } from '../config/ui';
import { HOW_TO_PLAY_PAGES, type ControlRow, type PadIcon } from '../data/howToPlay';
import { MenuOverlayScene } from './MenuOverlayScene';

export class HowToPlayScene extends MenuOverlayScene {
    protected readonly title = 'How to Play';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    private page = 0;
    private content: Phaser.GameObjects.Container | undefined;

    constructor() {
        super('HowToPlay');
    }

    protected build(): void {
        this.page = 0;
        const turn = (direction: number) => {
            this.page = (this.page + direction + HOW_TO_PLAY_PAGES.length) % HOW_TO_PLAY_PAGES.length;
            this.showPage();
        };
        // Page selector and Back at the bottom of the panel; the page fills the space above.
        this.addList([
            { label: 'Page', value: () => HOW_TO_PLAY_PAGES[this.page].name, onLeft: () => turn(-1), onRight: () => turn(1) },
            { label: 'Back', onConfirm: () => this.close() },
        ], this.panelBottom - this.contentTop - MENU_OVERLAY.itemSpacing * 2, HOW_TO_PLAY.pageBoxWidth);
        this.showPage();
    }

    private showPage(): void {
        this.content?.destroy();
        const content = this.add.container(MENU_OVERLAY.panelX, this.contentTop - MENU_OVERLAY.itemSpacing / 2);
        this.content = content;
        const page = HOW_TO_PLAY_PAGES[this.page];
        if (page.lines) {
            content.add(this.add.text(0, 0, [...page.lines], {
                ...MENU_TEXT_STYLE,
                lineSpacing: HOW_TO_PLAY.lineSpacing - UI_FONT_SIZE.normal,
                wordWrap: { width: HOW_TO_PLAY.wrapWidth },
            }).setOrigin(0.5, 0));
        }
        page.rows?.forEach((row, i) => this.addRow(content, row, i * HOW_TO_PLAY.lineSpacing));
    }

    private addRow(content: Phaser.GameObjects.Container, row: ControlRow, y: number): void {
        const centreY = y + HOW_TO_PLAY.lineSpacing / 2;
        const style = { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), stroke: '#000000', strokeThickness: 3 };
        if (row.control) {
            content.add(this.add.text(HOW_TO_PLAY.controlX, centreY, row.control, { ...style, color: HOW_TO_PLAY.controlColor })
                .setOrigin(0, 0.5));
        }
        let x = HOW_TO_PLAY.controlX + PAD_ICON.radius;
        for (const icon of row.pad ?? []) {
            content.add(this.addPadIcon(x, centreY, icon));
            x += PAD_ICON.radius * 2 + PAD_ICON.gap;
        }
        content.add(this.add.text(HOW_TO_PLAY.actionX, centreY, row.action, { ...style, color: HOW_TO_PLAY.actionColor })
            .setOrigin(0, 0.5));
    }

    /** One Xbox-style button: a dark disc with the letter in its colour, or the shape of Start, the stick or the d-pad. */
    private addPadIcon(x: number, y: number, icon: PadIcon): Phaser.GameObjects.Container {
        const r = PAD_ICON.radius;
        const g = this.add.graphics();
        g.fillStyle(PAD_ICON.fill).lineStyle(2, PAD_ICON.outline);
        const parts: Phaser.GameObjects.GameObject[] = [g];
        if (icon === 'A' || icon === 'B' || icon === 'Y') {
            g.fillCircle(0, 0, r).strokeCircle(0, 0, r);
            parts.push(this.add.text(0, 0, icon, {
                ...UI_TEXT, fontSize: px(Math.round(r * 1.3)), fontStyle: 'bold', color: PAD_ICON.letterColor[icon],
            }).setOrigin(0.5));
        } else if (icon === 'Start') {
            // Small round button with the three "menu" lines.
            g.fillCircle(0, 0, r).strokeCircle(0, 0, r);
            g.lineStyle(2, PAD_ICON.shapeColor);
            for (const dy of [-r * 0.35, 0, r * 0.35]) g.lineBetween(-r * 0.45, dy, r * 0.45, dy);
        } else if (icon === 'LeftStick') {
            // Stick seen from above: a ring with the "L" of the left stick.
            g.fillCircle(0, 0, r).strokeCircle(0, 0, r);
            g.lineStyle(2, PAD_ICON.shapeColor).strokeCircle(0, 0, r * 0.6);
            parts.push(this.add.text(0, 0, 'L', {
                ...UI_TEXT, fontSize: px(Math.round(r * 0.9)), fontStyle: 'bold', color: '#e8dcc0',
            }).setOrigin(0.5));
        } else {
            // D-pad: a plus sign.
            const arm = r * 0.38;
            g.fillStyle(PAD_ICON.shapeColor);
            g.fillRect(-r, -arm, r * 2, arm * 2).fillRect(-arm, -r, arm * 2, r * 2);
            g.lineStyle(2, PAD_ICON.fill).strokeCircle(0, 0, arm * 0.6);
        }
        return this.add.container(x, y, parts);
    }
}
