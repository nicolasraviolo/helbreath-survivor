// Logros (Fase 14B): cuántos llevas, y la lista en dos columnas, primero los conseguidos (en dorado) y luego los
// pendientes (en gris), cada uno con su descripción. Si no caben, se pasan páginas con ◄ ► en la fila "Page".
// Los que se acumulan entre partidas (Fase 29C), mientras no se consiguen, llevan detrás lo que llevas: "(312 / 3,000)".
// La lista está en data/achievements.ts; lo conseguido, en systems/AchievementStore.ts.
import Phaser from 'phaser';
import { ACHIEVEMENTS_SCREEN, MENU_OVERLAY, MENU_TEXT_STYLE } from '../config/menus';
import { UI_FONT_SIZE, UI_TEXT, px } from '../config/ui';
import { ACHIEVEMENT_IDS, getAchievement, type AchievementId } from '../data/achievements';
import { achievementStore } from '../systems/AchievementStore';
import type { MenuItem } from '../ui/MenuList';
import { MenuOverlayScene } from './MenuOverlayScene';

export class AchievementsScene extends MenuOverlayScene {
    protected readonly title = 'Achievements';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    private page = 0;
    private content: Phaser.GameObjects.Container | undefined;
    /** Unlocked first (in list order), then the rest. */
    private ordered: AchievementId[] = [];

    constructor() {
        super('Achievements');
    }

    protected build(): void {
        this.page = 0;
        this.ordered = [...ACHIEVEMENT_IDS.filter((id) => achievementStore.has(id)), ...ACHIEVEMENT_IDS.filter((id) => !achievementStore.has(id))];
        const pages = this.pageCount;
        const turn = (direction: number) => {
            this.page = (this.page + direction + pages) % pages;
            this.showPage();
        };
        // Page selector (only if there is more than one) and Back at the bottom of the panel; the list fills the space above.
        const items: MenuItem[] = [{ label: 'Back', onConfirm: () => this.close() }];
        if (pages > 1) items.unshift({ label: 'Page', value: () => `${this.page + 1} / ${pages}`, onLeft: () => turn(-1), onRight: () => turn(1) });
        this.addList(items, this.panelBottom - this.contentTop - MENU_OVERLAY.itemSpacing * items.length, ACHIEVEMENTS_SCREEN.pageBoxWidth);
        const count = `${achievementStore.count} / ${ACHIEVEMENT_IDS.length} unlocked`;
        this.add.text(MENU_OVERLAY.panelX, this.contentTop - MENU_OVERLAY.itemSpacing / 2, count, {
            ...MENU_TEXT_STYLE, color: ACHIEVEMENTS_SCREEN.countColor,
        }).setOrigin(0.5, 0);
        this.showPage();
    }

    private get perPage(): number {
        return ACHIEVEMENTS_SCREEN.columns * ACHIEVEMENTS_SCREEN.rowsPerPage;
    }

    private get pageCount(): number {
        return Math.max(1, Math.ceil(this.ordered.length / this.perPage));
    }

    /** The page's achievements, filling the left column first, then the right one. */
    private showPage(): void {
        this.content?.destroy();
        const top = this.contentTop - MENU_OVERLAY.itemSpacing / 2 + ACHIEVEMENTS_SCREEN.countGap;
        const content = this.add.container(MENU_OVERLAY.panelX, top);
        this.content = content;
        const { rowsPerPage, columnX, rowHeight } = ACHIEVEMENTS_SCREEN;
        this.ordered.slice(this.page * this.perPage, (this.page + 1) * this.perPage).forEach((id, i) => {
            const column = Math.floor(i / rowsPerPage);
            const x = column === 0 ? -columnX : columnX;
            this.addRow(content, id, x, (i % rowsPerPage) * rowHeight);
        });
    }

    /** Name over its description, centred in its column. */
    private addRow(content: Phaser.GameObjects.Container, id: AchievementId, x: number, y: number): void {
        const def = getAchievement(id);
        const unlocked = achievementStore.has(id);
        const screen = ACHIEVEMENTS_SCREEN;
        const base = { ...UI_TEXT, stroke: '#000000', strokeThickness: 3, align: 'center', wordWrap: { width: screen.columnWidth } };
        const name = this.add.text(x, y, def.name, {
            ...base, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: unlocked ? screen.nameColor : screen.lockedNameColor,
        }).setOrigin(0.5, 0);
        const goal = def.goal;
        const progress = !unlocked && goal.kind === 'killTotal'
            ? ` (${formatCount(achievementStore.killCount(goal.enemy))} / ${formatCount(goal.count)})` : '';
        const description = this.add.text(x, y + name.height, def.description + progress, {
            ...base, fontSize: px(UI_FONT_SIZE.small), color: unlocked ? screen.descriptionColor : screen.lockedDescriptionColor,
        }).setOrigin(0.5, 0);
        content.add([name, description]);
    }
}

/** 3000 → "3,000", like the descriptions. */
function formatCount(n: number): string {
    return n.toLocaleString('en-US');
}
