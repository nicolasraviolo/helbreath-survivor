// Helbreath Off, Fase Off-12A: muestrario del estilo nuevo de las ventanas (solo para desarrollo: ?off=uikit).
// Enseña todas las piezas de off/ui/offUi.ts al tamaño real del juego y en todos sus estados (foco del mando, marcado,
// apagado, sin STR, mejor / peor), con los textos más largos que saldrán (Absolute Magic Protection, requisitos que no
// llegas, oro grande, 120 pociones), para ver de un vistazo que nada se sale ni se solapa. Abajo dice si algún texto no
// cabe (offLayoutIssues); el check `offuikit` lo devuelve en texto.
// Las piezas responden al ratón (sin teclado: eso llega con las ventanas de verdad).
import Phaser from 'phaser';
import { setColouredTexture } from '../../hb/additiveTint';
import { itemPackTexture } from '../../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { lookLoader } from '../../systems/LookLoader';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE, OFF_THEME_TEXT, type OffPadButton } from '../config/offTheme';
import { offBagItemPicture, offItemTint, type OffBagItemKey } from '../data/offItems';
import { offSaveStore } from '../systems/OffSaveStore';
import {
    offBar, offBarHeight, offBox, offButton, offCell, offCloseButton, offDivider, offFrame, offKeyRow, offLabel,
    offLayoutIssues, offListRow, offPadPill, offRule, offStatRow, offTab, offText, type OffCell, type OffTab, type OffTrend,
} from '../ui/offUi';

export const OFF_UI_KIT_SCENE_KEY = 'OffUiKit';

const S = OFF_THEME_SIZE;
const INK = OFF_THEME_INK;

/** Where things go: the window like the real one (12, 10, 776 × 530), three columns inside. */
const KIT = {
    window: { x: 12, y: 10, w: 776, h: 530 },
    pad: 16,
    headerH: 44,
    tabsW: 330,
    tabGap: 6,
    columns: [
        { x: 28, w: 212 },
        { x: 256, w: 250 },
        { x: 522, w: 250 },
    ],
    top: 70,
    columnH: 432,
    /** Gap after a section label, and between sections. */
    labelGap: 18,
    sectionGap: 22,
    hudH: 52,
    sceneBack: 0x2d3a1f,
    hudBack: 0x3b3020,
} as const;

/** The sample cells: item, marked / focused / unmet, count. */
const SAMPLE_CELLS: readonly { item?: OffBagItemKey; marked?: boolean; focused?: boolean; unmet?: boolean; count?: number }[] = [
    { item: 'longSword', marked: true },
    { item: 'shortSword', focused: true },
    { item: 'helmet', unmet: true },
    { item: 'chainMail' },
    { item: 'redPotion', count: 5 },
    { item: 'bluePotion', count: 120 },
    {},
];

/** Sample spell list: name, mana, key, and its state (the list here is narrower than the Magic tab's: the longest name is checked there). */
const SAMPLE_LIST: readonly { name: string; mana: string; key: string; state?: 'marked' | 'focused' | 'disabled' }[] = [
    { name: 'Magic Missile', mana: '8', key: '1' },
    { name: 'Fire Ball', mana: '20', key: '3', state: 'marked' },
    { name: 'Mass Magic Missile', mana: '45', key: '6', state: 'focused' },
    { name: 'Meteor Strike', mana: '80', key: '', state: 'disabled' },
];

/** Sample keys: spell (undefined = empty), pad button for 1–4, state. */
const SAMPLE_KEYS: readonly { spell?: string; pad?: OffPadButton; marked?: boolean; focused?: boolean }[] = [
    { spell: 'Magic Missile', pad: 'A' },
    { spell: 'Heal', pad: 'B', focused: true },
    { spell: 'Absolute Magic Protection', pad: 'X', marked: true },
    { pad: 'Y' },
    { spell: 'Defense Shield' },
];

/** Item card rows: label, value, colour, "(now …)", better / worse. */
const SAMPLE_ITEM_ROWS: readonly [string, string, string?, string?, OffTrend?][] = [
    ['Crit Increase Chance', '5'],
    ['Magic Absorption', '+6%', INK.good],
    ['Defense Ratio', '30', undefined, 'now 10', 'better'],
    ['Physical Absorption', '32%', undefined, 'now 40%', 'worse'],
    ['Level', '20'],
    ['Required Str', '52 (you have 14)', INK.bad],
];

export class OffUiKitScene extends Phaser.Scene {
    private cells: OffCell[] = [];
    private cardIcon!: Phaser.GameObjects.Image;
    private issuesText!: Phaser.GameObjects.Text;

    constructor() {
        super(OFF_UI_KIT_SCENE_KEY);
    }

    create(): void {
        this.cells = [];
        this.cameras.main.setBackgroundColor(KIT.sceneBack);
        const w = KIT.window;
        offFrame(this, w.x, w.y, w.w, w.h, { fill: OFF_THEME_COLOR.window, big: true });
        this.drawHeader();
        this.drawEquipmentColumn();
        this.drawPiecesColumn();
        this.drawCardColumn();
        this.issuesText = offText(this, GAME_WIDTH / 2, w.y + w.h - 8, '', 'small', { originX: 0.5, originY: 1 });
        this.add.rectangle(0, GAME_HEIGHT - KIT.hudH, GAME_WIDTH, KIT.hudH, KIT.hudBack).setOrigin(0, 0);
        offText(this, GAME_WIDTH / 2, GAME_HEIGHT - KIT.hudH / 2, 'game HUD', 'small', { originX: 0.5, originY: 0.5 });
        void lookLoader.ensure(this, ['item.pack']).then(() => this.showIcons());
        this.refreshIssues();
    }

    /** For `check offuikit`: texts that don't fit (empty = fine) and whether the fonts loaded. */
    debugState(): { issues: string[]; fonts: boolean } {
        const fonts = [OFF_THEME_TEXT.name.font, OFF_THEME_TEXT.body.font].every((f) => document.fonts.check(`14px ${f}`));
        return { issues: offLayoutIssues(this), fonts };
    }

    private refreshIssues(): void {
        const issues = offLayoutIssues(this);
        this.issuesText.setText(issues.length ? `${issues.length} texts don't fit: ${issues[0]}` : 'All texts fit their boxes')
            .setColor(issues.length ? INK.bad : INK.dim);
    }

    private drawHeader(): void {
        const x = KIT.window.x + KIT.pad;
        const right = KIT.window.x + KIT.window.w - KIT.pad;
        const top = KIT.window.y + 12;
        offText(this, x, top, 'Novice', 'title');
        offText(this, x, top + 28, 'Aresden · Level 30', 'small');
        offRule(this, x, top + KIT.headerH, right - x, OFF_THEME_COLOR.line);
        const names = ['Bag', 'Stats', 'Magic'];
        const close = S.tabHeight;
        const tabW = (KIT.tabsW - close - KIT.tabGap * names.length) / names.length;
        const tabY = top + (KIT.headerH - S.tabHeight) / 2;
        const tabs: OffTab[] = [];
        let tx = right - KIT.tabsW;
        names.forEach((name, i) => {
            tabs.push(offTab(this, tx, tabY, tabW, name, () => tabs.forEach((t, j) => t.setOn(j === i))));
            tx += tabW + KIT.tabGap;
        });
        offCloseButton(this, right - close, tabY, close, () => undefined);
        tabs[2]?.setOn(true);
        tabs[1]?.setFocused(true);
    }

    private drawEquipmentColumn(): void {
        const col = KIT.columns[0];
        if (!col) return;
        const y = KIT.top;
        offFrame(this, col.x, y, col.w, KIT.columnH);
        const inX = col.x + S.padding;
        const inW = col.w - S.padding * 2;
        offLabel(this, inX, y + S.padding, 'Equipment');
        offText(this, col.x + col.w - S.padding, y + S.padding, 'Def 32', 'small', { originX: 1 });
        // Two slots as a sample: the real column (doll and 8 slots) is block B.
        const slotY = y + S.padding + KIT.labelGap + 4;
        ['Weapon', 'Shield'].forEach((name, i) => {
            const sx = i === 0 ? inX : col.x + col.w - S.padding - S.slot;
            offBox(this, sx, slotY, S.slot, S.slot, OFF_THEME_COLOR.cell, OFF_THEME_COLOR.cellBorder);
            offText(this, sx + S.slot / 2, slotY + S.slot - S.textInset, name, 'small', { originX: 0.5, originY: 1, maxWidth: S.slot - S.textInset });
        });
        offText(this, col.x + col.w / 2, slotY + S.slot / 2, 'doll', 'small', { color: INK.faint, originX: 0.5, originY: 0.5 });

        // A list (spells): normal, marked, focused (ring) and disabled.
        let ly = slotY + S.slot + KIT.sectionGap;
        offLabel(this, inX, ly, 'List rows');
        ly += KIT.labelGap;
        SAMPLE_LIST.forEach((row, i) => {
            const r = offListRow(this, inX, ly + i * S.listRowHeight, inW, [
                { text: row.name },
                { text: row.mana, width: 34, align: 'right', color: INK.dim },
                { text: row.key, width: 26, align: 'right', color: INK.gold },
            ], () => undefined);
            if (row.state === 'marked') r.setMarked(true);
            if (row.state === 'focused') r.setFocused(true);
            if (row.state === 'disabled') r.setEnabled(false);
        });

        const bars: readonly [string, number, string, number][] = [
            ['Health', OFF_THEME_COLOR.health, '140 / 140', 1],
            ['Mana', OFF_THEME_COLOR.mana, '96 / 150', 0.64],
            ['Stamina', OFF_THEME_COLOR.stamina, '80 / 80', 1],
            ['Exp', OFF_THEME_COLOR.exp, '9,999,999 to lv 140', 0.4],
        ];
        const barH = offBarHeight(this);
        const barStep = barH + 8;
        let by = y + KIT.columnH - S.padding - bars.length * barStep + 8;
        for (const [label, color, value, ratio] of bars) {
            offBar(this, inX, by, inW, label, color).setValue(value, ratio);
            by += barStep;
        }
    }

    private drawPiecesColumn(): void {
        const col = KIT.columns[1];
        if (!col) return;
        let y = KIT.top;
        offLabel(this, col.x, y, 'Buttons');
        y += KIT.labelGap;
        const rightX = col.x + col.w - S.buttonWidth;
        offButton(this, col.x, y, 'Drop', 'danger', () => undefined);
        offButton(this, rightX, y, 'Equip', 'main', () => undefined);
        y += S.buttonHeight + 10;
        offButton(this, col.x, y, 'Cancel', 'normal', () => undefined);
        offButton(this, rightX, y, 'Sell at shop', 'normal', () => undefined).setFocused(true);
        y += S.buttonHeight + 10;
        offButton(this, col.x, y, 'Buy', 'main', () => undefined).setEnabled(false);
        // Pad hints: LB / RB change tabs.
        let px = rightX;
        const mid = y + S.buttonHeight / 2;
        for (const label of ['LB', 'RB']) {
            px += offPadPill(this, px, mid, label).width + S.textInset;
        }
        offText(this, px, mid, 'tabs', 'small', { originY: 0.5 });
        y += S.buttonHeight + KIT.sectionGap;

        offLabel(this, col.x, y, 'Cells');
        offText(this, col.x + col.w, y, 'Gold 9,999,999', 'small', { originX: 1 });
        y += KIT.labelGap;
        const step = S.cell + S.cellGap;
        const wellPad = S.cellGap + 1;
        offBox(this, col.x, y, step * SAMPLE_CELLS.length - S.cellGap + wellPad * 2, S.cell + wellPad * 2, OFF_THEME_COLOR.well, OFF_THEME_COLOR.line);
        this.cells = SAMPLE_CELLS.map((c, i) => {
            const cell = offCell(this, col.x + wellPad + i * step, y + wellPad);
            cell.setMarked(c.marked === true);
            cell.setUnmet(c.unmet === true);
            cell.setFocused(c.focused === true);
            cell.setCount(c.count);
            return cell;
        });
        y += S.cell + wellPad * 2 + KIT.sectionGap;

        offLabel(this, col.x, y, 'Divider');
        y += KIT.labelGap + 4;
        offDivider(this, col.x, y, col.w);
        y += KIT.sectionGap - 4;

        offLabel(this, col.x, y, 'Keys');
        offText(this, col.x + col.w, y, '1–4 also RT + pad', 'small', { originX: 1 });
        y += KIT.labelGap;
        SAMPLE_KEYS.forEach((k, i) => {
            const row = offKeyRow(this, col.x, y + i * (S.keyRowHeight + S.keyRowGap), col.w, i + 1, k.pad, () => undefined);
            row.setName(k.spell);
            row.setMarked(k.marked === true);
            row.setFocused(k.focused === true);
        });
    }

    private drawCardColumn(): void {
        const col = KIT.columns[2];
        if (!col) return;
        const y = KIT.top;
        const pad = S.cardPadding;
        const inX = col.x + pad;
        const inW = col.w - pad * 2;
        const tile = S.iconTile;
        const nameX = inX + tile + S.padding;
        // Item card: icon tile, name, kind, divider, rows in the original order.
        offFrame(this, col.x, y, col.w, 200);
        offBox(this, inX, y + S.padding, tile, tile, OFF_THEME_COLOR.cell, OFF_THEME_COLOR.bronze);
        this.cardIcon = this.add.image(inX + tile / 2, y + S.padding + tile / 2, '__DEFAULT').setVisible(false);
        offText(this, nameX, y + S.padding + 1, 'Critical Chain Mail', 'name', { color: INK.good, maxWidth: inX + inW - nameX });
        offLabel(this, nameX, y + S.padding + 23, 'Body armor', { maxWidth: inX + inW - nameX });
        const dividerY = y + S.padding + tile + 10;
        offDivider(this, inX, dividerY, inW);
        SAMPLE_ITEM_ROWS.forEach(([label, value, color, note, trend], i) => {
            offStatRow(this, inX, dividerY + 6 + i * S.rowHeight, inW, label, value, color, note, trend);
        });

        // Spell card with the longest name.
        const sy = y + 216;
        offFrame(this, col.x, sy, col.w, 150);
        offBox(this, inX, sy + S.padding, tile, tile, OFF_THEME_COLOR.cell, OFF_THEME_COLOR.bronze);
        offText(this, nameX, sy + S.padding + 1, 'Absolute Magic Protection', 'name', { maxWidth: inX + inW - nameX });
        offLabel(this, nameX, sy + S.padding + 23, 'Circle 10 · Key 7', { maxWidth: inX + inW - nameX });
        const spellDivider = sy + S.padding + tile + 10;
        offDivider(this, inX, spellDivider, inW);
        const spellRows: readonly [string, string, string?][] = [
            ['Mana', '90'],
            ['Effect', 'Immune to monster spells'],
            ['Element', '—'],
            ['Required Int', '98 (you have 100)', INK.good],
        ];
        spellRows.forEach(([label, value, color], i) => offStatRow(this, inX, spellDivider + 6 + i * S.rowHeight, inW, label, value, color));

        // Stat tiles, as the Stats tab will have.
        const ty = sy + 166;
        const tileGap = 6;
        const tileW = (col.w - 2 * tileGap) / 3;
        [['Hit ratio', '71%'], ['Defense', '32'], ['Enemy kills', '1,204']].forEach(([label, value], i) => {
            const tx = col.x + i * (tileW + tileGap);
            offBox(this, tx, ty, tileW, 46);
            offText(this, tx + 8, ty + 5, label ?? '', 'small', { maxWidth: tileW - 16 });
            offText(this, tx + 8, ty + 21, value ?? '', 'number', { maxWidth: tileW - 16 });
        });
    }

    private showIcons(): void {
        const gender = offSaveStore.character.look.gender;
        const place = (image: Phaser.GameObjects.Image, item: OffBagItemKey, room: number): void => {
            const frame = offBagItemPicture(item, gender);
            if (!frame) return;
            setColouredTexture(image, itemPackTexture(frame.sheet), frame.frame, offItemTint(item));
            image.setVisible(true);
            image.setScale(Math.min(1, room / Math.max(image.frame.width, image.frame.height)));
        };
        this.cells.forEach((cell, i) => {
            const item = SAMPLE_CELLS[i]?.item;
            if (item !== undefined) place(cell.icon, item, cell.size - S.countInset * 2);
        });
        place(this.cardIcon, 'chainMail', S.iconTile - 4);
    }
}
