// Helbreath Off (Fase Off-5B): el almacén de las ciudades (el mismo en Aresden y Elvine: es del personaje). Se abre al
// pisar su puerta; el mundo sigue debajo y el HUD se esconde.
// - Dos rejillas: a la izquierda tu bolsa (10 × 5) y a la derecha el almacén (10 × 12 = 120, como el banco del
//   original). Un clic (o Enter / A) pasa el objeto al otro lado, al final. El oro va siempre contigo.
// - Flechas o cruceta para moverse (de una rejilla se pasa a la otra por el borde); Tab o LB / RB cambian de lado.
// - Al sacar algo cuentan la bolsa llena y el máximo de pociones, como al recogerlas del suelo.
import { setColouredTexture } from '../../hb/additiveTint';
import Phaser from 'phaser';
import { itemPackTexture } from '../../config/equipment';
import { GAME_WIDTH } from '../../config/gameConfig';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../../config/characterInfo';
import { AudioSystem } from '../../systems/AudioSystem';
import { Action, InputSystem } from '../../systems/InputSystem';
import { lookLoader } from '../../systems/LookLoader';
import { playAreaBottom } from '../../ui/hudLayout';
import {
    OFF_STORE_BUTTON_STYLE, OFF_STORE_HEADER_STYLE, OFF_STORE_MESSAGE_STYLE, OFF_STORE_PANEL, OFF_STORE_ROW_STYLE, OFF_STORE_SIDE, OFF_STORE_SMALL_STYLE,
    OFF_STORE_TITLE_STYLE, OFF_WAREHOUSE_GRID,
} from '../config/offStore';
import { offBagItemName, offBagItemPicture, offItemTint, type OffBagItemKey } from '../data/offItems';
import { offItemNameColor } from '../ui/offItemBox';
import { OFF_LOOT } from '../data/offLoot';
import { OFF_STORE, OFF_STORE_TEXT } from '../data/offStore';
import { offSaveStore, type OffTradeResult } from '../systems/OffSaveStore';

export const OFF_WAREHOUSE_SCENE_KEY = 'OffWarehouse';

export interface OffWarehouseSceneData {
    onClose: () => void;
}

export type OffWarehouseSide = 'bag' | 'warehouse';

interface CellView {
    box: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
}

export class OffWarehouseScene extends Phaser.Scene {
    private params!: OffWarehouseSceneData;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private openedAt = 0;
    private focus: { side: OffWarehouseSide; index: number } = { side: 'bag', index: 0 };
    private cells: Record<OffWarehouseSide, CellView[]> = { bag: [], warehouse: [] };
    private labels!: Record<OffWarehouseSide, Phaser.GameObjects.Text>;
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private nameText!: Phaser.GameObjects.Text;
    private messageText!: Phaser.GameObjects.Text;
    private helpText!: Phaser.GameObjects.Text;
    private iconsReady = false;

    constructor() {
        super(OFF_WAREHOUSE_SCENE_KEY);
    }

    init(data: OffWarehouseSceneData): void {
        this.params = data;
        this.focus = { side: 'bag', index: 0 };
        this.cells = { bag: [], warehouse: [] };
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.audio = new AudioSystem(this);
        const p = OFF_STORE_PANEL;
        const g = OFF_WAREHOUSE_GRID;
        const gridWidth = g.columns * g.cell + (g.columns - 1) * g.gap;
        const width = gridWidth * 2 + p.columnGap + p.padding * 2;
        const x = Math.round((GAME_WIDTH - width) / 2);
        const y = p.top;
        const height = playAreaBottom() - p.bottomGap - y;
        this.add.rectangle(x, y, width, height, p.background, p.alpha).setOrigin(0).setStrokeStyle(2, p.border).setInteractive();
        this.add.text(x + width / 2, y + p.padding, OFF_STORE_TEXT.warehouseTitle, OFF_STORE_TITLE_STYLE).setOrigin(0.5, 0);

        const labelY = y + p.titleHeight + p.padding;
        const gridY = labelY + g.labelHeight;
        const bagX = x + p.padding;
        const warehouseX = bagX + gridWidth + p.columnGap;
        this.labels = {
            bag: this.add.text(bagX, labelY, '', OFF_STORE_HEADER_STYLE),
            warehouse: this.add.text(warehouseX, labelY, '', OFF_STORE_HEADER_STYLE),
        };
        this.createGrid('bag', bagX, gridY, OFF_LOOT.bagSize);
        this.createGrid('warehouse', warehouseX, gridY, OFF_STORE.warehouseSize);

        // Under the bag: the marked item's name, the last result, Close and the help.
        const side = OFF_STORE_SIDE;
        let infoY = gridY + g.bagRows * (g.cell + g.gap) + side.gap;
        this.nameText = this.add.text(bagX, infoY, '', OFF_STORE_ROW_STYLE);
        infoY += side.goldHeight;
        this.messageText = this.add.text(bagX, infoY, '', { ...OFF_STORE_MESSAGE_STYLE, wordWrap: { width: gridWidth } });
        infoY += side.messageHeight;
        const close = this.add.rectangle(bagX, infoY, gridWidth, side.buttonHeight, side.buttonBackground).setOrigin(0).setStrokeStyle(1, side.buttonBorder);
        this.add.text(bagX + gridWidth / 2, infoY + side.buttonHeight / 2, OFF_STORE_TEXT.closeButton, OFF_STORE_BUTTON_STYLE).setOrigin(0.5);
        close.setInteractive({ useHandCursor: true });
        close.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.close();
        });
        this.helpText = this.add.text(bagX, infoY + side.buttonHeight + side.gap, '', { ...OFF_STORE_SMALL_STYLE, wordWrap: { width: gridWidth } });

        this.focusFrame = this.add.rectangle(0, 0, 1, 1).setOrigin(0).setStrokeStyle(2, g.focusColor).setDepth(2);
        this.inputSystem = new InputSystem(this);
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

    override update(): void {
        const input = this.inputSystem;
        input.update();
        const help = input.getLastDevice() === 'gamepad' ? OFF_STORE_TEXT.warehouseHelpPad : OFF_STORE_TEXT.warehouseHelpMouse;
        if (this.helpText.text !== help) this.helpText.setText(help);
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.OffSwitchTab) || input.justPressed(Action.OffNextTarget) || input.justPressed(Action.OffPrevTarget)) {
            const side = this.focus.side === 'bag' ? 'warehouse' : 'bag';
            this.setFocus({ side, index: Math.min(this.focus.index, this.cells[side].length - 1) });
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.move(-1, 0);
        if (input.justPressed(Action.MenuRight)) this.move(1, 0);
        if (input.justPressed(Action.MenuUp)) this.move(0, -1);
        if (input.justPressed(Action.MenuDown)) this.move(0, 1);
        if (input.justPressed(Action.Pick)) this.moveItem(this.focus.side, this.focus.index);
    }

    private createGrid(side: OffWarehouseSide, x: number, y: number, size: number): void {
        const g = OFF_WAREHOUSE_GRID;
        for (let index = 0; index < size; index++) {
            const cx = x + (index % g.columns) * (g.cell + g.gap);
            const cy = y + Math.floor(index / g.columns) * (g.cell + g.gap);
            const box = this.add.rectangle(cx, cy, g.cell, g.cell, g.background).setOrigin(0).setStrokeStyle(1, g.border);
            const icon = this.add.image(cx + g.cell / 2, cy + g.cell / 2, '__DEFAULT').setVisible(false);
            box.setInteractive({ useHandCursor: true });
            box.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus({ side, index }));
            box.on(Phaser.Input.Events.POINTER_UP, () => {
                if (!this.ready()) return;
                this.setFocus({ side, index });
                this.moveItem(side, index);
            });
            this.cells[side].push({ box, icon });
        }
    }

    private items(side: OffWarehouseSide): readonly OffBagItemKey[] {
        return side === 'bag' ? offSaveStore.character.bag : offSaveStore.character.warehouse;
    }

    private refresh(): void {
        const gender = offSaveStore.character.look.gender;
        const g = OFF_WAREHOUSE_GRID;
        for (const side of ['bag', 'warehouse'] as const) {
            const items = this.items(side);
            this.cells[side].forEach(({ icon }, index) => {
                const id = items[index];
                const frame = id !== undefined && this.iconsReady ? offBagItemPicture(id, gender) : undefined;
                if (!frame) {
                    icon.setVisible(false);
                    return;
                }
                setColouredTexture(icon, itemPackTexture(frame.sheet), frame.frame, offItemTint(id));
                icon.setVisible(true);
                icon.setScale(Math.min(1, g.iconSize / Math.max(icon.frame.width, icon.frame.height)));
            });
        }
        this.labels.bag.setText(OFF_STORE_TEXT.bagLabel(offSaveStore.character.bag.length, OFF_LOOT.bagSize));
        this.labels.warehouse.setText(OFF_STORE_TEXT.warehouseLabel(offSaveStore.character.warehouse.length, OFF_STORE.warehouseSize));
        this.setFocus(this.focus);
    }

    private setFocus(focus: { side: OffWarehouseSide; index: number }): void {
        this.focus = focus;
        const box = this.cells[focus.side][focus.index]?.box;
        if (box) this.focusFrame.setPosition(box.x - 2, box.y - 2).setSize(box.width + 4, box.height + 4);
        const id = this.items(focus.side)[focus.index];
        this.nameText.setText(id === undefined ? '' : offBagItemName(id));
        this.nameText.setColor(offItemNameColor(id) ?? OFF_STORE_ROW_STYLE.color);
    }

    /** Arrows / d-pad around a grid; past the inner edge, into the other grid. */
    private move(dx: number, dy: number): void {
        const g = OFF_WAREHOUSE_GRID;
        const { side, index } = this.focus;
        const rows = side === 'bag' ? g.bagRows : g.warehouseRows;
        const column = index % g.columns;
        const row = Math.floor(index / g.columns);
        if (dx !== 0) {
            const next = column + dx;
            if (side === 'bag' && next >= g.columns) this.setFocus({ side: 'warehouse', index: row * g.columns });
            else if (side === 'warehouse' && next < 0) this.setFocus({ side: 'bag', index: Math.min(row, g.bagRows - 1) * g.columns + g.columns - 1 });
            else if (next >= 0 && next < g.columns) this.setFocus({ side, index: row * g.columns + next });
            return;
        }
        const nextRow = row + dy;
        if (nextRow >= 0 && nextRow < rows) this.setFocus({ side, index: nextRow * g.columns + column });
    }

    /** Development and clicks: the item in that cell to the other side. */
    public moveItem(side: OffWarehouseSide, index: number): OffTradeResult {
        const id = this.items(side)[index];
        if (id === undefined) return 'none';
        const result = side === 'bag' ? offSaveStore.store(index) : offSaveStore.takeFromWarehouse(index);
        const name = offBagItemName(id);
        if (result === 'ok') this.audio.play('sfx.pickup');
        this.messageText.setText(result === 'ok'
            ? (side === 'bag' ? OFF_STORE_TEXT.stored(name) : OFF_STORE_TEXT.taken(name))
            : this.failure(result));
        this.refresh();
        return result;
    }

    private failure(result: OffTradeResult): string {
        if (result === 'bagFull') return OFF_STORE_TEXT.bagFull;
        if (result === 'potionLimit') return OFF_STORE_TEXT.potionLimit;
        if (result === 'warehouseFull') return OFF_STORE_TEXT.warehouseFull;
        return '';
    }

    /** Development: both sides and the last message. */
    public debugState(): { bag: string[]; warehouse: string[]; message: string; labels: string[] } {
        return {
            bag: [...offSaveStore.character.bag],
            warehouse: [...offSaveStore.character.warehouse],
            message: this.messageText.text,
            labels: [this.labels.bag.text, this.labels.warehouse.text],
        };
    }

    public close(): void {
        this.scene.stop();
        this.params.onClose();
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}
