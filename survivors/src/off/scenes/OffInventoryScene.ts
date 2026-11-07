// Helbreath Off (Fase Off-4B): la ventana Inventory. Un panel a la derecha con la bolsa en una rejilla de 10 × 5
// casillas (50 objetos, como el original), el oro, las pociones que llevas (máx. OFF_LOOT.potionLimit), el cuadro de
// stats del objeto marcado (off/ui/offItemBox.ts) y los botones Use, Drop y Equipment.
// - **El mundo no se para** (propietario, 7-nov-2026: solo Esc o Start pausan): los monstruos siguen y te pueden pegar.
//   Con el ratón, un clic fuera del panel sigue sirviendo para andar y atacar; con el mando, el stick te mueve.
// - Ratón: clic marca, doble clic usa. Teclado: flechas para moverse, Enter usa, Supr tira, E abre Equipment.
//   Mando: cruceta para moverse, A usa, Y tira. I / X, Esc / B o Start cierran.
// - Usar: la ropa y las armas se ponen (si tienes la STR; lo que llevabas vuelve a esa casilla), las pociones se beben
//   (no si esa barra ya está llena). Tirar: cae a tus pies (OffBattle.useBagItem / dropBagItem).
// - Lo que recoges mientras está abierta aparece al momento (la bolsa se vuelve a dibujar cuando cambia).
import Phaser from 'phaser';
import { itemPackTexture } from '../../config/equipment';
import { GAME_WIDTH } from '../../config/gameConfig';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../../config/characterInfo';
import { Action, InputSystem } from '../../systems/InputSystem';
import { lookLoader } from '../../systems/LookLoader';
import { playAreaBottom } from '../../ui/hudLayout';
import {
    OFF_INVENTORY_BOX,
    OFF_INVENTORY_BUTTON_STYLE,
    OFF_INVENTORY_BUTTONS,
    OFF_INVENTORY_GRID,
    OFF_INVENTORY_HELP_STYLE,
    OFF_INVENTORY_INFO,
    OFF_INVENTORY_INFO_STYLE,
    OFF_INVENTORY_MESSAGE_STYLE,
    OFF_INVENTORY_PANEL,
    OFF_INVENTORY_TITLE_STYLE,
} from '../config/offInventory';
import { OFF_BAG_TEXT } from '../data/offBag';
import { isOffItemId, OFF_ITEMS, offBagItemName, offWearCheck, offBagItemPicture, type OffBagItemId } from '../data/offItems';
import { OFF_LOOT } from '../data/offLoot';
import type { OffBattle, OffUseResult } from '../systems/OffBattle';
import { offSaveStore } from '../systems/OffSaveStore';
import { drawOffItemBox, offItemBoxLines } from '../ui/offItemBox';

export const OFF_INVENTORY_SCENE_KEY = 'OffInventory';

export interface OffInventorySceneData {
    battle: OffBattle;
    /** Gear changed: the world dresses the character again. */
    onGearChange: () => void;
    /** The Equipment button (E): the world closes this and opens Equipment. */
    openEquipment: () => void;
    /** After closing. */
    onClose: () => void;
}

type ButtonId = 'use' | 'drop' | 'equipment';
const BUTTON_IDS: readonly ButtonId[] = ['use', 'drop', 'equipment'];

type Focus = { kind: 'cell'; index: number } | { kind: 'button'; id: ButtonId };

interface CellView {
    box: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
}

interface ButtonView {
    box: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
}

export class OffInventoryScene extends Phaser.Scene {
    private params!: OffInventorySceneData;
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private focus: Focus = { kind: 'cell', index: 0 };
    private cells: CellView[] = [];
    private buttons = new Map<ButtonId, ButtonView>();
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private infoText!: Phaser.GameObjects.Text;
    private messageText!: Phaser.GameObjects.Text;
    private helpText!: Phaser.GameObjects.Text;
    private boxObjects: Phaser.GameObjects.GameObject[] = [];
    private boxArea = { x: 0, y: 0, width: 0, height: 0 };
    /** The bag drawn last (the save replaces the array on every change: a new one means redraw). */
    private drawnBag: readonly OffBagItemId[] | undefined;
    private drawnGold = -1;
    private iconsReady = false;
    private lastClick = { index: -1, at: 0 };

    constructor() {
        super(OFF_INVENTORY_SCENE_KEY);
    }

    init(data: OffInventorySceneData): void {
        this.params = data;
        this.cells = [];
        this.buttons = new Map();
        this.boxObjects = [];
        this.drawnBag = undefined;
        this.drawnGold = -1;
        this.focus = { kind: 'cell', index: 0 };
        this.lastClick = { index: -1, at: 0 };
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.time.now;
        const p = OFF_INVENTORY_PANEL;
        const g = OFF_INVENTORY_GRID;
        const gridWidth = g.columns * g.cell + (g.columns - 1) * g.gap;
        const width = gridWidth + p.padding * 2;
        const x = GAME_WIDTH - p.right - width;
        const y = p.top;
        // As tall as its content (grid, info, box, buttons, message, help), never over the HUD bar.
        const b = OFF_INVENTORY_BUTTONS;
        const content = p.titleHeight + p.padding + g.rows * g.cell + (g.rows - 1) * g.gap + OFF_INVENTORY_INFO.gap + OFF_INVENTORY_INFO.height
            + OFF_INVENTORY_BOX.gap + OFF_INVENTORY_BOX.height + b.gap + b.height + p.messageHeight + p.helpHeight + p.padding;
        const height = Math.min(content, playAreaBottom() - p.bottomGap - y);
        // The panel swallows clicks (they don't reach the world underneath); outside it, the world gets them.
        const panel = this.add.rectangle(x, y, width, height, p.background, p.alpha).setOrigin(0).setStrokeStyle(2, p.border);
        panel.setInteractive();
        this.add.text(x + width / 2, y + p.padding, OFF_BAG_TEXT.title, OFF_INVENTORY_TITLE_STYLE).setOrigin(0.5, 0);

        const gridX = x + p.padding;
        const gridY = y + p.titleHeight + p.padding;
        for (let index = 0; index < OFF_LOOT.bagSize; index++) {
            const cx = gridX + (index % g.columns) * (g.cell + g.gap);
            const cy = gridY + Math.floor(index / g.columns) * (g.cell + g.gap);
            const box = this.add.rectangle(cx, cy, g.cell, g.cell, g.background).setOrigin(0).setStrokeStyle(1, g.border);
            const icon = this.add.image(cx + g.cell / 2, cy + g.cell / 2, '__DEFAULT').setVisible(false);
            box.setInteractive({ useHandCursor: true });
            box.on(Phaser.Input.Events.POINTER_UP, () => this.clickCell(index));
            this.cells.push({ box, icon });
        }
        const gridBottom = gridY + g.rows * g.cell + (g.rows - 1) * g.gap;

        const infoY = gridBottom + OFF_INVENTORY_INFO.gap;
        this.infoText = this.add.text(gridX, infoY, '', OFF_INVENTORY_INFO_STYLE);
        const boxY = infoY + OFF_INVENTORY_INFO.height + OFF_INVENTORY_BOX.gap;
        this.boxArea = { x: gridX, y: boxY, width: gridWidth, height: OFF_INVENTORY_BOX.height };

        // Buttons, then the message and the help line at the bottom.
        const help = this.helpText = this.add.text(x + width / 2, y + height - p.padding, this.helpLine(), {
            ...OFF_INVENTORY_HELP_STYLE, align: 'center', wordWrap: { width: gridWidth },
        }).setOrigin(0.5, 1);
        const buttonsY = boxY + OFF_INVENTORY_BOX.height + b.gap;
        const buttonWidth = (gridWidth - b.gap * (BUTTON_IDS.length - 1)) / BUTTON_IDS.length;
        BUTTON_IDS.forEach((id, i) => this.createButton(id, gridX + i * (buttonWidth + b.gap), buttonsY, buttonWidth));
        this.messageText = this.add.text(x + width / 2, (buttonsY + b.height + help.getTopCenter().y) / 2, '', {
            ...OFF_INVENTORY_MESSAGE_STYLE, align: 'center', wordWrap: { width: gridWidth },
        }).setOrigin(0.5);

        this.focusFrame = this.add.rectangle(0, 0, 1, 1).setOrigin(0).setStrokeStyle(2, g.focusColor).setDepth(2);
        this.inputSystem = new InputSystem(this);
        // Cells and buttons have their own click areas; the stick walks the world (not these cells).
        this.inputSystem.setPointerMaxY(-1);
        this.inputSystem.setStickMenus(false);
        this.refresh();
        if (!this.iconsReady) {
            void lookLoader.ensure(this, ['item.pack']).then(() => {
                if (!this.sys.isActive()) return;
                this.iconsReady = true;
                this.drawnBag = undefined;
                this.refresh();
            });
        }
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        const help = this.helpLine();
        if (this.helpText.text !== help) this.helpText.setText(help);
        // Picked up, drunk or worn meanwhile (the world goes on): draw the bag again.
        if (this.drawnBag !== offSaveStore.character.bag || this.drawnGold !== offSaveStore.character.gold) this.refresh();
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause) || input.justPressed(Action.OffInventory)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.OffOpenEquipment)) {
            this.press('equipment');
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.move(-1, 0);
        if (input.justPressed(Action.MenuRight)) this.move(1, 0);
        if (input.justPressed(Action.MenuUp)) this.move(0, -1);
        if (input.justPressed(Action.MenuDown)) this.move(0, 1);
        if (input.justPressed(Action.OffDrop)) this.press('drop');
        if (input.justPressed(Action.Pick)) this.press(this.focus.kind === 'button' ? this.focus.id : 'use');
    }

    private get bag(): readonly OffBagItemId[] {
        return offSaveStore.character.bag;
    }

    /** The bag cell marked, if it holds something. */
    private get markedIndex(): number | undefined {
        if (this.focus.kind !== 'cell') return undefined;
        return this.focus.index < this.bag.length ? this.focus.index : undefined;
    }

    private helpLine(): string {
        return this.inputSystem?.getLastDevice() === 'gamepad' ? OFF_BAG_TEXT.helpPad : OFF_BAG_TEXT.helpMouse;
    }

    private createButton(id: ButtonId, x: number, y: number, width: number): void {
        const b = OFF_INVENTORY_BUTTONS;
        const box = this.add.rectangle(x, y, width, b.height, b.background).setOrigin(0).setStrokeStyle(1, b.border);
        const text = id === 'use' ? 'Use' : id === 'drop' ? OFF_BAG_TEXT.dropButton : OFF_BAG_TEXT.equipmentButton;
        const label = this.add.text(x + width / 2, y + b.height / 2, text, OFF_INVENTORY_BUTTON_STYLE).setOrigin(0.5);
        box.setInteractive({ useHandCursor: true });
        box.on(Phaser.Input.Events.POINTER_UP, () => {
            if (!this.ready()) return;
            this.press(id);
        });
        this.buttons.set(id, { box, label });
    }

    // ---- Drawing ----

    /** Cells, gold and potions, the focus and the stat box. */
    private refresh(): void {
        const bag = this.bag;
        this.drawnBag = bag;
        this.drawnGold = offSaveStore.character.gold;
        const who = { str: offSaveStore.character.stats.str, level: offSaveStore.level };
        const g = OFF_INVENTORY_GRID;
        this.cells.forEach(({ box, icon }, index) => {
            const id = bag[index];
            const short = id !== undefined && isOffItemId(id) && offWearCheck(id, who) !== 'ok';
            box.setFillStyle(short ? g.unmetColor : g.background);
            const frame = id !== undefined && this.iconsReady ? offBagItemPicture(id, offSaveStore.character.look.gender) : undefined;
            if (!frame) {
                icon.setVisible(false);
                return;
            }
            icon.setTexture(itemPackTexture(frame.sheet), frame.frame).setVisible(true);
            icon.setScale(Math.min(1, g.iconSize / Math.max(icon.frame.width, icon.frame.height)));
        });
        this.infoText.setText(`${OFF_BAG_TEXT.gold(offSaveStore.character.gold)}     ${OFF_BAG_TEXT.potions(offSaveStore.potionCount, OFF_LOOT.potionLimit)}`);
        // The marked cell emptied (used or dropped the last one): mark the new last item.
        if (this.focus.kind === 'cell' && this.focus.index >= bag.length && bag.length > 0) this.focus = { kind: 'cell', index: bag.length - 1 };
        this.setFocus(this.focus);
    }

    private setFocus(focus: Focus): void {
        this.focus = focus;
        const target = focus.kind === 'cell' ? this.cells[focus.index]?.box : this.buttons.get(focus.id)?.box;
        if (target) this.focusFrame.setPosition(target.x - 2, target.y - 2).setSize(target.width + 4, target.height + 4).setVisible(true);
        else this.focusFrame.setVisible(false);
        const marked = this.markedIndex;
        const hasItem = marked !== undefined;
        this.buttons.get('use')?.box.setAlpha(hasItem ? 1 : OFF_INVENTORY_BUTTONS.disabledAlpha);
        this.buttons.get('use')?.label.setAlpha(hasItem ? 1 : OFF_INVENTORY_BUTTONS.disabledAlpha);
        this.buttons.get('drop')?.box.setAlpha(hasItem ? 1 : OFF_INVENTORY_BUTTONS.disabledAlpha);
        this.buttons.get('drop')?.label.setAlpha(hasItem ? 1 : OFF_INVENTORY_BUTTONS.disabledAlpha);
        this.drawBox();
    }

    private drawBox(): void {
        this.boxObjects.forEach((object) => object.destroy());
        this.boxObjects = [];
        const marked = this.markedIndex;
        const id = marked === undefined ? undefined : this.bag[marked];
        if (id === undefined) {
            if (this.bag.length === 0) {
                const a = this.boxArea;
                this.boxObjects.push(this.add.text(a.x + a.width / 2, a.y + a.height / 2, OFF_BAG_TEXT.empty, {
                    ...OFF_INVENTORY_HELP_STYLE, align: 'center', wordWrap: { width: a.width - 16 },
                }).setOrigin(0.5));
            }
            return;
        }
        const worn = isOffItemId(id) ? offSaveStore.character.equipment[OFF_ITEMS[id].slot] : undefined;
        const lines = offItemBoxLines(id, worn === id ? undefined : worn, { str: offSaveStore.character.stats.str, level: offSaveStore.level });
        this.boxObjects = drawOffItemBox(this, this.boxArea, offBagItemName(id), lines);
    }

    // ---- Moving and acting ----

    private clickCell(index: number): void {
        if (!this.ready()) return;
        const now = this.time.now;
        const twice = this.lastClick.index === index && now - this.lastClick.at <= OFF_INVENTORY_GRID.doubleClickMs;
        this.lastClick = twice ? { index: -1, at: 0 } : { index, at: now };
        this.setFocus({ kind: 'cell', index });
        if (twice) this.press('use');
    }

    /** Arrows / d-pad: around the grid; down from the last row goes to the buttons. */
    private move(dx: number, dy: number): void {
        const g = OFF_INVENTORY_GRID;
        const focus = this.focus;
        if (focus.kind === 'cell') {
            const column = focus.index % g.columns;
            const row = Math.floor(focus.index / g.columns);
            if (dx !== 0) this.setFocus({ kind: 'cell', index: row * g.columns + ((column + dx + g.columns) % g.columns) });
            else if (row + dy >= g.rows) this.setFocus({ kind: 'button', id: BUTTON_IDS[Math.min(BUTTON_IDS.length - 1, Math.floor((column * BUTTON_IDS.length) / g.columns))] ?? 'use' });
            else if (row + dy >= 0) this.setFocus({ kind: 'cell', index: (row + dy) * g.columns + column });
            return;
        }
        const at = BUTTON_IDS.indexOf(focus.id);
        if (dx !== 0) this.setFocus({ kind: 'button', id: BUTTON_IDS[(at + dx + BUTTON_IDS.length) % BUTTON_IDS.length] ?? focus.id });
        else if (dy < 0) this.setFocus({ kind: 'cell', index: (g.rows - 1) * g.columns + Math.floor(((at + 0.5) * g.columns) / BUTTON_IDS.length) });
    }

    private press(id: ButtonId): void {
        if (id === 'equipment') {
            this.scene.stop();
            this.params.openEquipment();
            return;
        }
        const marked = this.markedIndex;
        if (marked === undefined) return;
        this.showResult(id === 'use' ? this.use(marked) : this.drop(marked));
    }

    /** Development (`check offbag...`) and the Use button: uses the item in that cell. */
    public use(index: number): OffUseResult {
        const result = this.params.battle.useBagItem(index);
        if (result.gear) this.params.onGearChange();
        return result;
    }

    /** Development and the Drop button: drops the item in that cell at the player's feet. */
    public drop(index: number): OffUseResult {
        return this.params.battle.dropBagItem(index);
    }

    private showResult(result: OffUseResult): void {
        this.messageText.setText(result.line ?? '');
        this.refresh();
    }

    /** Development: marks a cell (the stat box shows). */
    public debugMark(index: number): void {
        this.setFocus({ kind: 'cell', index });
    }

    /** Development: what the bag and the box show. */
    public debugState(): { bag: string[]; info: string; message: string; box: string[] } {
        const box = this.boxObjects.filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text).map((t) => t.text);
        return { bag: [...this.bag], info: this.infoText.text, message: this.messageText.text, box };
    }

    public close(): void {
        this.scene.stop();
        this.params.onClose();
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}
