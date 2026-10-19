// Novedades ("What's new"): lo que trajo cada fase, de la más nueva a la más vieja. Se abre con el link del pie del
// menú principal. Si no cabe todo, se pasan páginas con ◄ ► en la fila "Page" (como en Logros).
// Los textos están en data/releaseNotes.ts.
import Phaser from 'phaser';
import { MENU_OVERLAY, MENU_TEXT_STYLE, RELEASE_NOTES_SCREEN } from '../config/menus';
import { UI_FONT_SIZE, UI_TEXT, px } from '../config/ui';
import { RELEASE_NOTES, type ReleaseNote } from '../data/releaseNotes';
import type { MenuItem } from '../ui/MenuList';
import { MenuOverlayScene } from './MenuOverlayScene';

export class ReleaseNotesScene extends MenuOverlayScene {
    protected readonly title = "What's New";
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    private page = 0;
    /** Notes of each page, worked out from how tall they are once drawn. */
    private pages: ReleaseNote[][] = [];
    private content: Phaser.GameObjects.Container | undefined;

    constructor() {
        super('ReleaseNotes');
    }

    protected build(): void {
        this.page = 0;
        // Page selector and Back at the bottom of the panel; the notes fill the space above.
        const rows = 2;
        const listOffset = this.panelBottom - this.contentTop - MENU_OVERLAY.itemSpacing * rows;
        this.pages = this.splitPages(listOffset);
        const turn = (direction: number) => {
            this.page = (this.page + direction + this.pages.length) % this.pages.length;
            this.showPage();
        };
        const items: MenuItem[] = [
            { label: 'Page', value: () => `${this.page + 1} / ${this.pages.length}`, onLeft: () => turn(-1), onRight: () => turn(1) },
            { label: 'Back', onConfirm: () => this.close() },
        ];
        // With a single page the selector is not needed: Back alone, in the bottom row.
        if (this.pages.length === 1) items.shift();
        this.addList(items, listOffset + MENU_OVERLAY.itemSpacing * (rows - items.length), RELEASE_NOTES_SCREEN.pageBoxWidth);
        this.showPage();
    }

    private get notesTop(): number {
        return this.contentTop + RELEASE_NOTES_SCREEN.notesOffsetY;
    }

    /** Fills each page with whole phases until the next one would reach the page selector. */
    private splitPages(listOffset: number): ReleaseNote[][] {
        // From the top of the notes down to half a row above the page selector.
        const available = listOffset - RELEASE_NOTES_SCREEN.notesOffsetY - MENU_OVERLAY.itemSpacing / 2;
        const pages: ReleaseNote[][] = [[]];
        let used = 0;
        for (const note of RELEASE_NOTES) {
            const probe = this.drawNote(note, 0);
            const height = probe.getBounds().height;
            probe.destroy();
            const current = pages[pages.length - 1];
            if (current.length > 0 && used + height > available) {
                pages.push([note]);
                used = height + RELEASE_NOTES_SCREEN.entryGap;
            } else {
                current.push(note);
                used += height + RELEASE_NOTES_SCREEN.entryGap;
            }
        }
        return pages;
    }

    private showPage(): void {
        this.content?.destroy();
        const content = this.add.container(0, this.notesTop);
        this.content = content;
        let y = 0;
        for (const note of this.pages[this.page]) {
            const block = this.drawNote(note, y);
            content.add(block);
            y += block.getBounds().height + RELEASE_NOTES_SCREEN.entryGap;
        }
    }

    /** "Phase 19 · Oct 18, 2026" over its changes, left-aligned in a column centred on the panel. */
    private drawNote(note: ReleaseNote, y: number): Phaser.GameObjects.Container {
        const screen = RELEASE_NOTES_SCREEN;
        const left = MENU_OVERLAY.panelX - screen.wrapWidth / 2;
        const block = this.add.container(left, y);
        const base = { ...UI_TEXT, stroke: MENU_TEXT_STYLE.stroke, strokeThickness: MENU_TEXT_STYLE.strokeThickness };
        const title = this.add.text(0, 0, note.version, {
            ...base, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: screen.titleColor,
        });
        const date = this.add.text(title.width, 0, `  ·  ${note.date}`, {
            ...base, fontSize: px(UI_FONT_SIZE.small), color: screen.dateColor,
        });
        date.y = title.height - date.height;
        block.add([title, date]);
        let lineY = title.height + screen.lineGap;
        for (const change of note.changes) {
            const line = this.add.text(0, lineY, `•  ${change}`, {
                ...base, fontSize: px(UI_FONT_SIZE.small), color: screen.changeColor, wordWrap: { width: screen.wrapWidth },
            });
            block.add(line);
            lineY += line.height + screen.lineGap;
        }
        return block;
    }
}
