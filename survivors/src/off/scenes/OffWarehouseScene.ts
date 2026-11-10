// Helbreath Off: el almacén de las ciudades y las Farms (el mismo en todas: es del personaje). Se abre al pisar su
// puerta o al hablar con Howard; el mundo sigue debajo y el HUD se esconde.
// Fase Off-5B: dos rejillas, la bolsa (10 × 5) y el almacén (10 × 12 = 120, como el banco del original). El oro va
// siempre contigo; al sacar algo cuentan la bolsa llena y el máximo de pociones, como al recogerlas del suelo.
// Fase Off-13C, rehecha con el estilo de la Off-12 (maqueta aprobada por el propietario, 10-nov-2026):
// - Rejillas con la pieza offItemGrid; pociones y Slime Jelly del mismo tipo van en una celda con su número.
// - Clic marca el objeto y enseña su ficha bajo la bolsa (como la pestaña Bag); doble clic, Enter, A o el botón de la
//   ficha pasan UNO al otro lado (propietario: una poción por pulsación). Si no cabe, el botón se apaga y la ficha dice
//   por qué.
// - Flechas o cruceta por la rejilla; por el borde interior se pasa a la otra. Tab, LB o RB cambian de lado. El
//   mensaje de lo que pasó se borra al moverte; sin mensaje, esa línea explica los controles.
import Phaser from 'phaser';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../../config/characterInfo';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { AudioSystem } from '../../systems/AudioSystem';
import { Action, InputSystem } from '../../systems/InputSystem';
import { lookLoader } from '../../systems/LookLoader';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE } from '../config/offTheme';
import {
    OFF_WAREHOUSE_BAG_GRID, OFF_WAREHOUSE_CARD, OFF_WAREHOUSE_GRID, OFF_WAREHOUSE_WINDOW,
} from '../config/offWarehouse';
import {
    isOffGearKey, offBagItemName, offGearDef, offStacks, offWearCheck, type OffBagItemKey, type OffItemStack, type OffWearer,
} from '../data/offItems';
import { OFF_LOOT } from '../data/offLoot';
import { OFF_STORE, OFF_STORE_TEXT, OFF_WAREHOUSE_TEXT } from '../data/offStore';
import { offSaveStore, type OffTradeResult } from '../systems/OffSaveStore';
import { offItemCard, offStackKind } from '../ui/offItemCard';
import { offItemGrid, offItemGridSize, offSetItemIcon, type OffItemGrid } from '../ui/offItemGrid';
import {
    offBox, offButton, offCloseButton, offDivider, offFitText, offFrame, offLabel, offLayoutIssues, offPadHints, offRule,
    offStatRow, offText, type OffButton,
} from '../ui/offUi';

export const OFF_WAREHOUSE_SCENE_KEY = 'OffWarehouse';

export interface OffWarehouseSceneData {
    onClose: () => void;
}

export type OffWarehouseSide = 'bag' | 'warehouse';

const S = OFF_THEME_SIZE;
const C = OFF_THEME_COLOR;
const INK = OFF_THEME_INK;
const W = OFF_WAREHOUSE_WINDOW;
const CARD = OFF_WAREHOUSE_CARD;
const CELLS: Record<OffWarehouseSide, number> = { bag: OFF_LOOT.bagSize, warehouse: OFF_STORE.warehouseSize };

/** The window's height and top: the warehouse grid sets it, and it sits in the middle of the screen. */
function windowBox(): { y: number; h: number; gridsTop: number; gridsBottom: number; messageY: number } {
    const h = W.top + W.labelH + offItemGridSize(OFF_WAREHOUSE_GRID).height + W.messageGap + W.bottomPad;
    const y = Math.round((GAME_HEIGHT - h) / 2);
    const gridsTop = y + W.top + W.labelH;
    const gridsBottom = gridsTop + offItemGridSize(OFF_WAREHOUSE_GRID).height;
    return { y, h, gridsTop, gridsBottom, messageY: gridsBottom + W.messageGap };
}

export class OffWarehouseScene extends Phaser.Scene {
    private params!: OffWarehouseSceneData;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private openedAt = 0;
    private focus: { side: OffWarehouseSide; index: number } = { side: 'bag', index: 0 };
    private grids!: Record<OffWarehouseSide, OffItemGrid>;
    private stacks: Record<OffWarehouseSide, OffItemStack[]> = { bag: [], warehouse: [] };
    private labels!: Record<OffWarehouseSide, Phaser.GameObjects.Text>;
    private card!: {
        icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text; kind: Phaser.GameObjects.Text;
        hint: Phaser.GameObjects.Text; reason: Phaser.GameObjects.Text;
    };
    private cardArea = { x: 0, w: 0, nameRoom: 0, rowsY: 0 };
    private cardRows: { destroy(): void }[] = [];
    private cardTexts: string[] = [];
    private moveButton!: OffButton;
    private messageText!: Phaser.GameObjects.Text;
    private helpText!: Phaser.GameObjects.Text;
    private padHints!: Phaser.GameObjects.Container;
    private drawnBag: readonly OffBagItemKey[] | undefined;
    private drawnWarehouse: readonly OffBagItemKey[] | undefined;
    private iconsReady = false;
    private lastClick = { key: '', at: 0 };
    /** Development: the pad hints shown without a pad (for the capture). */
    private forcePadHints = false;

    constructor() {
        super(OFF_WAREHOUSE_SCENE_KEY);
    }

    init(data: OffWarehouseSceneData): void {
        this.params = data;
        this.focus = { side: 'bag', index: 0 };
        this.stacks = { bag: [], warehouse: [] };
        this.cardRows = [];
        this.cardTexts = [];
        this.drawnBag = undefined;
        this.drawnWarehouse = undefined;
        this.lastClick = { key: '', at: 0 };
        this.forcePadHints = false;
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.game.loop.time;
        this.audio = new AudioSystem(this);
        const box = windowBox();
        // The world shows dimmed round the window; clicks stop here.
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, W.shadeAlpha).setOrigin(0).setInteractive();
        offFrame(this, W.x, box.y, W.w, box.h, { fill: C.window, big: true });
        this.createHeader(box.y);

        const columnW = offItemGridSize(OFF_WAREHOUSE_GRID).width;
        const bagX = W.x + W.pad;
        const warehouseX = bagX + columnW + W.columnGap;
        const labelY = box.y + W.top;
        this.labels = {
            bag: offLabel(this, bagX, labelY, '', { maxWidth: columnW }),
            warehouse: offLabel(this, warehouseX, labelY, '', { maxWidth: columnW }),
        };
        this.grids = {
            bag: offItemGrid(this, bagX, box.gridsTop, OFF_WAREHOUSE_BAG_GRID, (i) => this.clickCell('bag', i)),
            warehouse: offItemGrid(this, warehouseX, box.gridsTop, OFF_WAREHOUSE_GRID, (i) => this.clickCell('warehouse', i)),
        };
        const cardY = box.gridsTop + this.grids.bag.height + CARD.gap;
        this.createCard(bagX, cardY, columnW, box.gridsBottom - cardY);

        const cx = W.x + W.w / 2;
        const lineW = W.w - W.pad * 2;
        this.messageText = offText(this, cx, box.messageY, '', 'small', { originX: 0.5, originY: 0.5, maxWidth: lineW });
        this.helpText = offText(this, cx, box.messageY, OFF_WAREHOUSE_TEXT.helpMouse, 'small', { originX: 0.5, originY: 0.5, maxWidth: lineW });
        this.padHints = offPadHints(this, cx, box.messageY, OFF_WAREHOUSE_TEXT.helpPad);

        this.inputSystem = new InputSystem(this);
        // Every piece has its own click zone: the input system's own pointer moves nothing here.
        this.inputSystem.setPointerMaxY(-1);
        this.inputSystem.setStickMenus(true);
        this.refresh();
        if (!this.iconsReady) {
            void lookLoader.ensure(this, ['item.pack']).then(() => {
                if (!this.sys.isActive()) return;
                this.iconsReady = true;
                this.refresh();
            });
        }
    }

    private createHeader(y: number): void {
        const x = W.x + W.pad;
        const right = W.x + W.w - W.pad;
        const top = y + W.titleTop;
        const close = S.tabHeight;
        const closeY = top + (W.headerH - close) / 2;
        const room = right - close - S.padding - x;
        offText(this, x, top, OFF_STORE_TEXT.warehouseTitle, 'title', { maxWidth: room });
        offText(this, x, top + W.subtitleGap, OFF_WAREHOUSE_TEXT.subtitle, 'small', { maxWidth: room });
        offRule(this, x, top + W.headerH, right - x, C.line);
        offCloseButton(this, right - close, closeY, close, () => {
            if (this.ready()) this.close();
        });
    }

    /** The marked item's card: icon tile, name and kind, the move button on the right, then its rows; the reason at the bottom. */
    private createCard(x: number, y: number, w: number, h: number): void {
        offFrame(this, x, y, w, h);
        const pad = S.cardPadding;
        const tile = S.iconTile;
        const inX = x + pad;
        const tileY = y + S.padding;
        offBox(this, inX, tileY, tile, tile, C.cell, C.bronze);
        const icon = this.add.image(inX + tile / 2, tileY + tile / 2, '__DEFAULT').setVisible(false);
        const buttonX = x + w - pad - S.buttonWidth;
        this.moveButton = offButton(this, buttonX, tileY + (tile - S.buttonHeight) / 2, OFF_WAREHOUSE_TEXT.storeButton, 'main', () => {
            if (this.ready()) this.moveItem(this.focus.side, this.focus.index);
        });
        const nameX = inX + tile + S.padding;
        const nameRoom = buttonX - S.padding - nameX;
        const name = offText(this, nameX, tileY + 1, '', 'name', { maxWidth: nameRoom });
        const kind = offLabel(this, nameX, tileY + CARD.kindGap, '', { maxWidth: nameRoom });
        const dividerY = tileY + tile + CARD.dividerGap;
        offDivider(this, inX, dividerY, w - pad * 2);
        const rowsY = dividerY + CARD.rowsGap;
        const hint = offText(this, x + w / 2, (rowsY + y + h) / 2, '', 'body', { color: INK.dim, originX: 0.5, originY: 0.5 });
        const reason = offText(this, inX, y + h - S.padding, '', 'small', { color: INK.bad, originY: 1, maxWidth: w - pad * 2 });
        this.card = { icon, name, kind, hint, reason };
        this.cardArea = { x: inX, w: w - pad * 2, nameRoom, rowsY };
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        const saved = offSaveStore.character;
        // Picked up or drunk meanwhile (the world goes on): draw it all again.
        if (saved.bag !== this.drawnBag || saved.warehouse !== this.drawnWarehouse) this.refresh();
        this.showHelp(this.forcePadHints || input.getLastDevice() === 'gamepad');
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.OffSwitchTab) || input.justPressed(Action.OffNextTarget) || input.justPressed(Action.OffPrevTarget)) {
            const side = this.other(this.focus.side);
            this.setFocus({ side, index: Math.min(this.focus.index, this.grids[side].cells.length - 1) });
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.move(-1, 0);
        if (input.justPressed(Action.MenuRight)) this.move(1, 0);
        if (input.justPressed(Action.MenuUp)) this.move(0, -1);
        if (input.justPressed(Action.MenuDown)) this.move(0, 1);
        if (input.justPressed(Action.Pick)) this.moveItem(this.focus.side, this.focus.index);
    }

    private other(side: OffWarehouseSide): OffWarehouseSide {
        return side === 'bag' ? 'warehouse' : 'bag';
    }

    private items(side: OffWarehouseSide): readonly OffBagItemKey[] {
        return side === 'bag' ? offSaveStore.character.bag : offSaveStore.character.warehouse;
    }

    private get wearer(): OffWearer {
        return { str: offSaveStore.character.stats.str, level: offSaveStore.level };
    }

    /** Both grids, their labels and the card, from the save. */
    private refresh(): void {
        const saved = offSaveStore.character;
        this.drawnBag = saved.bag;
        this.drawnWarehouse = saved.warehouse;
        const who = this.wearer;
        for (const side of ['bag', 'warehouse'] as const) {
            this.stacks[side] = offStacks(this.items(side));
            this.grids[side].show(this.stacks[side], saved.look.gender, this.iconsReady);
            this.grids[side].cells.forEach((cell, i) => {
                const id = this.stacks[side][i]?.key;
                cell.setUnmet(id !== undefined && isOffGearKey(id) && offWearCheck(id, who) !== 'ok');
            });
        }
        this.labels.bag.setText(OFF_WAREHOUSE_TEXT.bagLabel(this.stacks.bag.length, CELLS.bag).toUpperCase());
        this.labels.warehouse.setText(OFF_WAREHOUSE_TEXT.warehouseLabel(this.stacks.warehouse.length, CELLS.warehouse).toUpperCase());
        // The marked stack left (its last one moved): the focus goes to the last item left on that side.
        const { side, index } = this.focus;
        const filled = this.stacks[side].length;
        this.showFocus({ side, index: index >= filled && filled > 0 ? filled - 1 : index });
    }

    /** Moves the ring and the mark; the last message goes (it was about the cell left). A failure is told by the card. */
    private setFocus(focus: { side: OffWarehouseSide; index: number }): void {
        if (focus.side !== this.focus.side || focus.index !== this.focus.index) this.say('');
        this.showFocus(focus);
    }

    private showFocus(focus: { side: OffWarehouseSide; index: number }): void {
        this.grids[this.focus.side].cells[this.focus.index]?.setFocused(false);
        this.focus = focus;
        for (const side of ['bag', 'warehouse'] as const) {
            this.grids[side].cells.forEach((cell, i) => cell.setMarked(side === focus.side && i === focus.index && this.stacks[side][i] !== undefined));
        }
        this.grids[focus.side].cells[focus.index]?.setFocused(true);
        this.drawCard();
    }

    /** The card of the marked stack, the move button and why it can't move, if so. */
    private drawCard(): void {
        this.cardRows.forEach((r) => r.destroy());
        this.cardRows = [];
        const { side, index } = this.focus;
        const stack = this.stacks[side][index];
        const id = stack?.key;
        const who = this.wearer;
        const card = id === undefined ? undefined : offItemCard(id, isOffGearKey(id) ? offSaveStore.character.equipment[offGearDef(id).slot] : undefined, who);
        if (card && stack) card.kind = offStackKind(card.kind, stack.count);
        const a = this.cardArea;
        offSetItemIcon(this.card.icon, id, S.iconTile - 4, offSaveStore.character.look.gender, this.iconsReady);
        this.card.name.setText(card?.name ?? '').setColor(card?.nameColor ?? INK.text);
        offFitText(this.card.name, 'name', a.nameRoom);
        this.card.kind.setText((card?.kind ?? '').toUpperCase());
        offFitText(this.card.kind, 'label', a.nameRoom);
        const empty = this.stacks[side].length === 0;
        const hint = side === 'bag' ? OFF_WAREHOUSE_TEXT.bagEmpty : OFF_WAREHOUSE_TEXT.warehouseEmpty;
        this.card.hint.setText(card ? '' : empty ? hint : OFF_WAREHOUSE_TEXT.pickHint);
        offFitText(this.card.hint, 'body', a.w);
        this.cardTexts = card ? [card.name, card.kind] : [this.card.hint.text];
        (card?.rows ?? []).forEach((row, i) => {
            const y = a.rowsY + i * S.rowHeight;
            this.cardTexts.push([row.label, row.value, row.note ? `(${row.note})` : ''].filter(Boolean).join(' '));
            if (row.value === '') {
                this.cardRows.push(offText(this, a.x, y + S.rowHeight / 2, row.label, 'body', { color: INK.dim, originY: 0.5, maxWidth: a.w }));
                return;
            }
            this.cardRows.push(offStatRow(this, a.x, y, a.w, row.label, row.value, row.color, row.note, row.trend));
        });
        // The button: Store from the bag, Take from the warehouse; off when it doesn't fit, with the reason.
        const room = id === undefined ? 'none' : side === 'bag' ? offSaveStore.warehouseRoomFor(id) : offSaveStore.roomFor(id);
        this.moveButton.setLabel(side === 'bag' ? OFF_WAREHOUSE_TEXT.storeButton : OFF_WAREHOUSE_TEXT.takeButton);
        this.moveButton.setEnabled(room === 'ok');
        // An empty cell marked: no button at all (an off one with no reason is noise).
        this.moveButton.setVisible(id !== undefined);
        this.card.reason.setText(room === 'ok' || room === 'none' ? '' : this.failure(room));
        offFitText(this.card.reason, 'small', a.w);
        if (this.card.reason.text) this.cardTexts.push(this.card.reason.text);
    }

    /** The message line, or (with nothing to say) the controls of the device in use. */
    private showHelp(pad: boolean): void {
        const quiet = this.messageText.text === '';
        this.helpText.setVisible(quiet && !pad);
        this.padHints.setVisible(quiet && pad);
    }

    private say(line: string, color: string = INK.text): void {
        this.messageText.setText(line).setColor(color);
        offFitText(this.messageText, 'small', W.w - W.pad * 2);
    }

    /** Arrows / d-pad round a grid; past the inner edge, into the other grid (same row, or its last one). */
    private move(dx: number, dy: number): void {
        const { side, index } = this.focus;
        const grid = this.grids[side];
        const next = grid.step(index, dx, dy);
        if (next !== undefined) {
            this.setFocus({ side, index: next });
            return;
        }
        const columns = grid.size.columns;
        const row = Math.floor(index / columns);
        if (side === 'bag' && dx > 0) this.setFocus({ side: 'warehouse', index: row * columns });
        else if (side === 'warehouse' && dx < 0) {
            const bagRows = this.grids.bag.size.rows;
            this.setFocus({ side: 'bag', index: Math.min(row, bagRows - 1) * columns + columns - 1 });
        }
    }

    private clickCell(side: OffWarehouseSide, index: number): void {
        if (!this.ready()) return;
        const key = `${side}${index}`;
        const now = this.game.loop.time;
        const twice = this.lastClick.key === key && now - this.lastClick.at <= W.doubleClickMs;
        this.lastClick = twice ? { key: '', at: 0 } : { key, at: now };
        this.setFocus({ side, index });
        if (twice) this.moveItem(side, index);
    }

    /** Development, clicks and keys: one item of the stack in that cell to the other side. */
    public moveItem(side: OffWarehouseSide, index: number): OffTradeResult {
        const stack = this.stacks[side][index];
        if (stack === undefined) return 'none';
        const result = side === 'bag' ? offSaveStore.store(stack.last) : offSaveStore.takeFromWarehouse(stack.last);
        const name = offBagItemName(stack.key);
        if (result === 'ok') {
            this.audio.play('sfx.pickup');
            this.say(side === 'bag' ? OFF_STORE_TEXT.stored(name) : OFF_STORE_TEXT.taken(name), INK.good);
        } else {
            // The card already says why (in red at its foot): the message line stays quiet.
            this.say('');
        }
        this.refresh();
        return result;
    }

    private failure(result: OffTradeResult): string {
        if (result === 'bagFull') return OFF_STORE_TEXT.bagFull;
        if (result === 'potionLimit') return OFF_STORE_TEXT.potionLimit;
        if (result === 'warehouseFull') return OFF_STORE_TEXT.warehouseFull;
        return '';
    }

    /** Development: arrows / pad, for `check offwarehousepad`. */
    public debugInput(key: 'left' | 'right' | 'up' | 'down' | 'a' | 'lb'): string {
        if (key === 'a') this.moveItem(this.focus.side, this.focus.index);
        else if (key === 'lb') this.setFocus({ side: this.other(this.focus.side), index: Math.min(this.focus.index, this.grids[this.other(this.focus.side)].cells.length - 1) });
        else this.move(key === 'left' ? -1 : key === 'right' ? 1 : 0, key === 'up' ? -1 : key === 'down' ? 1 : 0);
        return `${this.focus.side} ${this.focus.index}`;
    }

    /** Development: the pad hints as if a pad were in use (for the capture). */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
    }

    /** Development: marks that cell (as a click), for the capture. */
    public debugMark(side: OffWarehouseSide, index: number): void {
        this.setFocus({ side, index });
    }

    /** Development: both sides, their cells, the card and the last message. */
    public debugState(): {
        bag: string[]; warehouse: string[]; cells: { bag: string[]; warehouse: string[] }; message: string; labels: string[];
        focus: string; card: string[]; button: string; buttonOn: boolean; issues: string[]; window: { y: number; h: number }; help: string;
    } {
        const cellsOf = (side: OffWarehouseSide): string[] => this.stacks[side].map((s) => (s.count > 1 ? `${s.key}×${s.count}` : s.key));
        const box = windowBox();
        return {
            bag: [...offSaveStore.character.bag],
            warehouse: [...offSaveStore.character.warehouse],
            cells: { bag: cellsOf('bag'), warehouse: cellsOf('warehouse') },
            message: this.messageText.text,
            labels: [this.labels.bag.text, this.labels.warehouse.text],
            focus: `${this.focus.side} ${this.focus.index}`,
            card: [...this.cardTexts],
            button: this.moveButton.isEnabled() ? 'on' : 'off',
            buttonOn: this.moveButton.isEnabled(),
            issues: offLayoutIssues(this),
            window: { y: box.y, h: box.h },
            help: this.padHints.visible ? 'pad' : this.helpText.visible ? 'mouse' : 'message',
        };
    }

    public close(): void {
        this.scene.stop();
        this.params.onClose();
    }

    private ready(): boolean {
        return this.game.loop.time - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}
