// Helbreath Off, Fase Off-12A: muestrario del estilo nuevo de las ventanas (solo para desarrollo: ?off=uikit).
// Enseña todas las piezas de off/ui/offUi.ts al tamaño real del juego, con los textos más largos que saldrán
// (Absolute Magic Protection, requisitos que no llegas, oro grande), para ver de un vistazo que nada se sale ni se
// solapa. Abajo dice si algún texto no cabe (offLayoutIssues); el check `offuikit` lo devuelve en texto.
// Las pestañas, los botones y las casillas responden al ratón (sin teclado: eso llega con las ventanas de verdad).
import Phaser from 'phaser';
import { setColouredTexture } from '../../hb/additiveTint';
import { itemPackTexture } from '../../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { lookLoader } from '../../systems/LookLoader';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE, OFF_THEME_TEXT } from '../config/offTheme';
import { offBagItemPicture, offItemTint, type OffBagItemKey } from '../data/offItems';
import { offSaveStore } from '../systems/OffSaveStore';
import {
    OFF_BAR_HEIGHT, offBar, offBox, offButton, offCell, offDivider, offFrame, offLabel, offLayoutIssues, offPadBadge,
    offRule, offStatRow, offTab, offText, type OffButton, type OffCell, type OffCellState, type OffTab,
} from '../ui/offUi';

export const OFF_UI_KIT_SCENE_KEY = 'OffUiKit';

const S = OFF_THEME_SIZE;

/** Where things go: the window like the real one (12, 10, 776 × 530), three columns inside. */
const KIT = {
    window: { x: 12, y: 10, w: 776, h: 530 },
    pad: 16,
    headerH: 44,
    columns: [
        { x: 28, w: 212 },
        { x: 256, w: 250 },
        { x: 522, w: 250 },
    ],
    top: 70,
    sceneBack: 0x2d3a1f,
} as const;

/** The sample cells: item, state and count. */
const SAMPLE_CELLS: readonly { item?: OffBagItemKey; state: OffCellState; count?: number }[] = [
    { item: 'longSword', state: 'marked' },
    { item: 'shortSword', state: 'item' },
    { item: 'helmet', state: 'unmet' },
    { item: 'chainMail', state: 'item' },
    { item: 'redPotion', state: 'item', count: 5 },
    { item: 'bluePotion', state: 'item', count: 12 },
    { state: 'empty' },
];

export class OffUiKitScene extends Phaser.Scene {
    private cells: OffCell[] = [];
    private issuesText!: Phaser.GameObjects.Text;

    constructor() {
        super(OFF_UI_KIT_SCENE_KEY);
    }

    create(): void {
        this.cameras.main.setBackgroundColor(KIT.sceneBack);
        const w = KIT.window;
        offFrame(this, w.x, w.y, w.w, w.h, { fill: OFF_THEME_COLOR.window, big: true });
        this.drawHeader();
        this.drawEquipmentColumn();
        this.drawPiecesColumn();
        this.drawCardColumn();
        this.issuesText = offText(this, GAME_WIDTH / 2, w.y + w.h - 8, '', 'small', { originX: 0.5, originY: 1 });
        this.add.rectangle(0, GAME_HEIGHT - 52, GAME_WIDTH, 52, 0x3b3020).setOrigin(0, 0);
        offText(this, GAME_WIDTH / 2, GAME_HEIGHT - 26, 'game HUD', 'small', { originX: 0.5, originY: 0.5 });
        void lookLoader.ensure(this, ['item.pack']).then(() => this.showIcons());
        this.refreshIssues();
    }

    /** For `check offuikit`: texts that don't fit (empty = fine). */
    debugState(): { issues: string[]; fonts: boolean } {
        const fonts = [OFF_THEME_TEXT.name.font, OFF_THEME_TEXT.body.font].every((f) => document.fonts.check(`14px ${f}`));
        return { issues: offLayoutIssues(this), fonts };
    }

    private refreshIssues(): void {
        const issues = offLayoutIssues(this);
        this.issuesText.setText(issues.length ? `${issues.length} texts don't fit: ${issues[0]}` : 'All texts fit their boxes')
            .setColor(issues.length ? OFF_THEME_INK.bad : OFF_THEME_INK.dim);
    }

    private drawHeader(): void {
        const x = KIT.window.x + KIT.pad;
        const right = KIT.window.x + KIT.window.w - KIT.pad;
        const top = KIT.window.y + 12;
        offText(this, x, top, 'Novice', 'title');
        offText(this, x, top + 28, 'Aresden · Level 30', 'small');
        offRule(this, x, top + KIT.headerH, right - x, OFF_THEME_COLOR.line);
        const names = ['Bag', 'Stats', 'Magic'];
        const close = 30;
        const gap = 6;
        const tabW = (330 - close - gap * names.length) / names.length;
        const tabY = top + (KIT.headerH - S.tabHeight) / 2;
        const tabs: OffTab[] = [];
        let tx = right - 330;
        names.forEach((name, i) => {
            tabs.push(offTab(this, tx, tabY, tabW, name, () => tabs.forEach((t, j) => t.setOn(j === i))));
            tx += tabW + gap;
        });
        offTab(this, right - close, tabY, close, '✕', () => undefined);
        tabs[2]?.setOn(true);
    }

    private drawEquipmentColumn(): void {
        const col = KIT.columns[0];
        if (!col) return;
        const y = KIT.top;
        const h = 432;
        offFrame(this, col.x, y, col.w, h);
        const inX = col.x + S.padding;
        const inW = col.w - S.padding * 2;
        offLabel(this, inX, y + S.padding, 'Equipment');
        offText(this, col.x + col.w - S.padding, y + S.padding, 'Def 32', 'small', { originX: 1 });
        // Two slots as a sample: the real column (doll and 8 slots) is block B.
        const slotY = y + 32;
        ['Weapon', 'Shield'].forEach((name, i) => {
            const sx = i === 0 ? inX : col.x + col.w - S.padding - S.slot;
            offBox(this, sx, slotY, S.slot, S.slot, OFF_THEME_COLOR.cell, OFF_THEME_COLOR.line);
            offText(this, sx + S.slot / 2, slotY + S.slot - 4, name, 'small', { originX: 0.5, originY: 1, maxWidth: S.slot - 4 });
        });
        offText(this, col.x + col.w / 2, slotY + S.slot / 2, 'doll', 'small', { color: OFF_THEME_INK.faint, originX: 0.5, originY: 0.5 });
        const bars: readonly [string, number, string, number][] = [
            ['Health', OFF_THEME_COLOR.health, '140 / 140', 1],
            ['Mana', OFF_THEME_COLOR.mana, '96 / 150', 0.64],
            ['Stamina', OFF_THEME_COLOR.stamina, '80 / 80', 1],
            ['Exp', OFF_THEME_COLOR.exp, '1,234,567 to lv 31', 0.4],
        ];
        let by = y + h - S.padding - bars.length * (OFF_BAR_HEIGHT + 8) + 8;
        for (const [label, color, value, ratio] of bars) {
            offBar(this, inX, by, inW, label, color).setValue(value, ratio);
            by += OFF_BAR_HEIGHT + 8;
        }
    }

    private drawPiecesColumn(): void {
        const col = KIT.columns[1];
        if (!col) return;
        let y = KIT.top;
        offLabel(this, col.x, y, 'Buttons');
        y += 18;
        const buttons: OffButton[] = [];
        const gap = (col.w - S.buttonWidth * 2) / 1;
        buttons.push(offButton(this, col.x, y, 'Drop', 'danger', () => undefined));
        buttons.push(offButton(this, col.x + S.buttonWidth + gap, y, 'Equip', 'main', () => undefined));
        y += S.buttonHeight + 10;
        buttons.push(offButton(this, col.x, y, 'Cancel', 'normal', () => undefined));
        const focused = offButton(this, col.x + S.buttonWidth + gap, y, 'Sell at shop', 'normal', () => undefined);
        focused.setFocused(true);
        y += S.buttonHeight + 22;

        offLabel(this, col.x, y, 'Cells');
        offText(this, col.x + col.w, y, 'Gold 1,234,567', 'small', { originX: 1 });
        y += 18;
        const step = S.cell + S.cellGap;
        offBox(this, col.x, y, step * SAMPLE_CELLS.length + S.cellGap + 2, S.cell + 2 * S.cellGap + 2, OFF_THEME_COLOR.well, OFF_THEME_COLOR.line);
        this.cells = SAMPLE_CELLS.map((c, i) => {
            const cell = offCell(this, col.x + 2 + S.cellGap + i * step, y + 1 + S.cellGap, S.cell, () => this.markCell(i));
            cell.setState(c.state);
            cell.setCount(c.count);
            return cell;
        });
        y += S.cell + 2 * S.cellGap + 22;

        offLabel(this, col.x, y, 'Divider');
        y += 22;
        offDivider(this, col.x, y, col.w);
        y += 22;

        offLabel(this, col.x, y, 'Keys and pad');
        y += 18;
        (['A', 'B', 'X', 'Y'] as const).forEach((button, i) => {
            const ky = y + i * (25 + 3);
            offBox(this, col.x, ky, col.w, 25, OFF_THEME_COLOR.cell, OFF_THEME_COLOR.cellLine);
            offText(this, col.x + 14, ky + 12.5, String(i + 1), 'number', { color: OFF_THEME_INK.gold, originX: 0.5, originY: 0.5 }).setFontSize(14);
            const names = ['Magic Missile', 'Heal', 'Absolute Magic Protection', 'Empty'];
            offText(this, col.x + 28, ky + 12.5, names[i] ?? '', 'body', { color: i === 3 ? OFF_THEME_INK.faint : OFF_THEME_INK.text, originY: 0.5, maxWidth: col.w - 28 - 30 });
            offPadBadge(this, col.x + col.w - 8 - S.badge / 2, ky + 12.5, button);
        });
    }

    private drawCardColumn(): void {
        const col = KIT.columns[2];
        if (!col) return;
        const y = KIT.top;
        const pad = 12;
        const inX = col.x + pad;
        const inW = col.w - pad * 2;
        // Item card: icon tile, name, kind, divider, rows in the original order.
        offFrame(this, col.x, y, col.w, 196);
        offBox(this, inX, y + 10, 40, 40, OFF_THEME_COLOR.cell, OFF_THEME_COLOR.bronze);
        this.cells.push(this.iconOnly(inX + 20, y + 30));
        offText(this, inX + 50, y + 11, 'Critical Chain Mail', 'name', { color: OFF_THEME_INK.good, maxWidth: inW - 50 });
        offLabel(this, inX + 50, y + 33, 'Body armor', { maxWidth: inW - 50 });
        offDivider(this, inX, y + 60, inW);
        const rows: readonly [string, string, string?, string?][] = [
            ['Crit Increase Chance', '5'],
            ['Magic Absorption', '+6%', OFF_THEME_INK.good],
            ['Defense Ratio', '30', undefined, 'now 10'],
            ['Physical Absorption', '32%'],
            ['Level', '20'],
            ['Required Str', '52 (you have 14)', OFF_THEME_INK.bad],
        ];
        rows.forEach(([label, value, color, note], i) => offStatRow(this, inX, y + 68 + i * S.rowHeight, inW, label, value, color, note));

        // Spell card with the longest name.
        const sy = y + 214;
        offFrame(this, col.x, sy, col.w, 150);
        offBox(this, inX, sy + 10, 38, 38, OFF_THEME_COLOR.cell, OFF_THEME_COLOR.bronze);
        offText(this, inX + 48, sy + 12, 'Absolute Magic Protection', 'name', { maxWidth: inW - 48 });
        offLabel(this, inX + 48, sy + 33, 'Circle 10 · Key 7', { maxWidth: inW - 48 });
        offDivider(this, inX, sy + 58, inW);
        const spellRows: readonly [string, string, string?][] = [
            ['Mana', '90'],
            ['Effect', 'Immune to monster spells'],
            ['Element', '—'],
            ['Required Int', '98 (you have 100)', OFF_THEME_INK.good],
        ];
        spellRows.forEach(([label, value, color], i) => offStatRow(this, inX, sy + 64 + i * S.rowHeight, inW, label, value, color));

        // Stat tiles, as the Stats tab will have.
        const ty = sy + 168;
        const tileW = (col.w - 2 * 6) / 3;
        [['Hit ratio', '71%'], ['Defense', '32'], ['Enemy kills', '1,204']].forEach(([label, value], i) => {
            const tx = col.x + i * (tileW + 6);
            offBox(this, tx, ty, tileW, 44);
            offText(this, tx + 8, ty + 6, label ?? '', 'small', { maxWidth: tileW - 16 });
            offText(this, tx + 8, ty + 21, value ?? '', 'number', { maxWidth: tileW - 16 });
        });
    }

    /** A picture without a cell (the card's icon tile), kept with the cells so it gets its texture too. */
    private iconOnly(cx: number, cy: number): OffCell {
        const icon = this.add.image(cx, cy, '__DEFAULT').setVisible(false);
        return { x: cx, y: cy, size: 36, icon, setState: () => undefined, setCount: () => undefined };
    }

    private markCell(index: number): void {
        this.cells.forEach((cell, i) => {
            const sample = SAMPLE_CELLS[i];
            if (sample) cell.setState(i === index && sample.item ? 'marked' : sample.state === 'marked' ? 'item' : sample.state);
        });
    }

    private showIcons(): void {
        const gender = offSaveStore.character.look.gender;
        const items: (OffBagItemKey | undefined)[] = [...SAMPLE_CELLS.map((c) => c.item), 'chainMail'];
        this.cells.forEach((cell, i) => {
            const item = items[i];
            const frame = item !== undefined ? offBagItemPicture(item, gender) : undefined;
            if (item === undefined || !frame) return;
            setColouredTexture(cell.icon, itemPackTexture(frame.sheet), frame.frame, offItemTint(item));
            cell.icon.setVisible(true);
            const room = cell.size - 4;
            cell.icon.setScale(Math.min(1, room / Math.max(cell.icon.frame.width, cell.icon.frame.height)));
        });
    }
}
