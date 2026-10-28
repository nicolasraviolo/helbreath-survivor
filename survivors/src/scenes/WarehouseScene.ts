// Pantalla Warehouse (Fase 21D; medidas en config/warehouse.ts). Se abre desde Select Character (botón "Warehouse",
// tecla O o R1 del mando) con el personaje marcado:
// - Izquierda: el inventario de ese personaje. Derecha: el baúl compartido por los 4 personajes (data/warehouse.ts).
// - Una fila por tipo de objeto ("Sharp Long Sword ×2"). Pulsar una fila pasa UNO al otro lado; se guarda al momento.
//   Lo que lleva puesto no sale aquí: primero hay que quitárselo en Equipment.
// - Si la clase del personaje no puede usar un objeto (una varita para el Guerrero), se avisa en la fila, pero se puede
//   mover igual: así un personaje guarda cosas para otro.
// - Si no caben, la lista se desplaza (rueda del ratón, flechas o mando). Ok, Esc o B cierran.
import Phaser from 'phaser';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../config/characterInfo';
import { EQUIPMENT_DETAIL_STYLE, EQUIPMENT_OK, EQUIPMENT_OWNED_COLOR, EQUIPMENT_ROW_STYLE, EQUIPMENT_TITLE_STYLE, itemPackTexture } from '../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import {
    WAREHOUSE_FULL_COLOR, WAREHOUSE_HEADING_STYLE, WAREHOUSE_HELP_STYLE, WAREHOUSE_HELP_Y, WAREHOUSE_LIST, WAREHOUSE_OK_Y, WAREHOUSE_OTHER_CLASS_COLOR,
    WAREHOUSE_PANELS, WAREHOUSE_SHADE_ALPHA, WAREHOUSE_TITLE_Y,
} from '../config/warehouse';
import { ATTRIBUTES } from '../data/attributes';
import { CHARACTERS, type CharacterId } from '../data/characters';
import { classCanWear, describeItem, EQUIP_SLOT_IDS, EQUIP_SLOT_NAMES, itemInfo, itemPicture, ownedItemColor, ownedItemName, ownedItemNameColor } from '../data/items';
import { sameOwnedItem, type OwnedItem } from '../data/loot';
import { upgradeDescription } from '../data/upgrades';
import { WAREHOUSE_CAPACITY } from '../data/warehouse';
import { setColouredTexture } from '../hb/additiveTint';
import { characterStore, type SavedCharacter } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { lookLoader } from '../systems/LookLoader';
import { warehouseStore } from '../systems/WarehouseStore';
import type { MenuOverlayData } from './MenuOverlayScene';
import { toGame } from '../ui/renderScale';

export interface WarehouseSceneData {
    characterUid: string;
}

type Side = 'inventory' | 'warehouse';

/** One kind of item (same item, attribute and "+") and where its copies are in the source list. */
interface Kind {
    item: OwnedItem;
    indices: number[];
}

interface Column {
    side: Side;
    x: number;
    width: number;
    kinds: Kind[];
    first: number;
    heading: Phaser.GameObjects.Text;
    objects: Phaser.GameObjects.GameObject[];
    /** Row backgrounds drawn now, by kind index. */
    rows: Map<number, Phaser.GameObjects.Rectangle>;
}

type Focus = { kind: 'row'; side: Side; index: number } | { kind: 'ok' };

export class WarehouseScene extends Phaser.Scene {
    private uid = '';
    private returnTo = '';
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private columns!: Record<Side, Column>;
    private focus: Focus = { kind: 'row', side: 'inventory', index: 0 };
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private helpText!: Phaser.GameObjects.Text;
    private okButton!: Phaser.GameObjects.Image;
    /** A message that replaces the help until the focus moves ("The warehouse is full"). */
    private notice: string | undefined;
    private iconsReady = false;

    constructor() {
        super('Warehouse');
    }

    init(data: WarehouseSceneData & MenuOverlayData): void {
        this.uid = data.characterUid;
        this.returnTo = data.returnTo;
        this.notice = undefined;
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        if (!this.character) {
            this.close();
            return;
        }
        this.openedAt = this.time.now;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, WAREHOUSE_SHADE_ALPHA).setOrigin(0);
        this.add.text(GAME_WIDTH / 2, WAREHOUSE_TITLE_Y, 'Warehouse', EQUIPMENT_TITLE_STYLE).setOrigin(0.5, 0);
        const p = WAREHOUSE_PANELS;
        const width = (GAME_WIDTH - p.x * 2 - p.gap) / 2;
        this.columns = {
            inventory: this.createColumn('inventory', p.x, width),
            warehouse: this.createColumn('warehouse', p.x + width + p.gap, width),
        };
        this.helpText = this.add.text(GAME_WIDTH / 2, WAREHOUSE_HELP_Y, '', { ...WAREHOUSE_HELP_STYLE, wordWrap: { width: GAME_WIDTH - p.x * 4 } }).setOrigin(0.5, 0);
        this.createOk();
        this.focusFrame = this.add.rectangle(0, 0, 1, 1).setOrigin(0).setStrokeStyle(2, WAREHOUSE_LIST.focusColor).setDepth(2);

        this.inputSystem = new InputSystem(this);
        // Rows and Ok have their own click areas: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
        this.input.on(Phaser.Input.Events.POINTER_WHEEL, (pointer: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
            const side: Side = toGame(pointer.x) < this.columns.warehouse.x ? 'inventory' : 'warehouse';
            this.scroll(side, Math.sign(dy));
        });
        this.refresh();
        const start: Side = this.columns.inventory.kinds.length > 0 || this.columns.warehouse.kinds.length === 0 ? 'inventory' : 'warehouse';
        this.setFocus({ kind: 'row', side: start, index: 0 });
        if (!this.iconsReady) {
            void lookLoader.ensure(this, ['item.pack']).then(() => {
                if (!this.sys.isActive()) return;
                this.iconsReady = true;
                this.refresh();
                this.setFocus(this.focus);
            });
        }
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.moveSideways('inventory');
        if (input.justPressed(Action.MenuRight)) this.moveSideways('warehouse');
        if (input.justPressed(Action.MenuUp)) this.moveVertically(-1);
        if (input.justPressed(Action.MenuDown)) this.moveVertically(1);
        if (input.justPressed(Action.Pick)) this.press();
    }

    private get character(): Readonly<SavedCharacter> | undefined {
        return characterStore.byUid(this.uid);
    }

    // ---- Columns ----

    private createColumn(side: Side, x: number, width: number): Column {
        const p = WAREHOUSE_PANELS;
        this.add.rectangle(x, p.y, width, p.height, p.background).setOrigin(0).setStrokeStyle(2, p.border);
        const heading = this.add.text(x + width / 2, p.y + p.padding, '', WAREHOUSE_HEADING_STYLE).setOrigin(0.5, 0);
        return { side, x, width, kinds: [], first: 0, heading, objects: [], rows: new Map() };
    }

    /** Items of that side, from the saved data. */
    private source(side: Side): readonly Readonly<OwnedItem>[] {
        return side === 'inventory' ? (this.character?.inventory ?? []) : warehouseStore.all;
    }

    /** Rereads both lists and redraws them (after every move). */
    private refresh(): void {
        const character = this.character;
        if (!character) return;
        this.columns.inventory.heading.setText(`${character.name}'s inventory (${character.inventory.length})`);
        const full = warehouseStore.isFull;
        this.columns.warehouse.heading.setText(`Shared warehouse ${warehouseStore.all.length}/${WAREHOUSE_CAPACITY}`)
            .setColor(full ? WAREHOUSE_FULL_COLOR : WAREHOUSE_HEADING_STYLE.color);
        for (const column of Object.values(this.columns)) {
            column.kinds = groupKinds(this.source(column.side));
            column.first = Math.min(column.first, Math.max(0, column.kinds.length - this.visibleRows));
            this.drawColumn(column, character.classId);
        }
    }

    private get visibleRows(): number {
        return Math.floor((WAREHOUSE_PANELS.height - WAREHOUSE_LIST.top - WAREHOUSE_PANELS.padding) / WAREHOUSE_LIST.rowHeight);
    }

    private rowY(column: Column, index: number): number {
        return WAREHOUSE_PANELS.y + WAREHOUSE_LIST.top + (index - column.first) * WAREHOUSE_LIST.rowHeight;
    }

    private drawColumn(column: Column, classId: CharacterId): void {
        column.objects.forEach((object) => object.destroy());
        column.objects = [];
        column.rows.clear();
        const p = WAREHOUSE_PANELS;
        const l = WAREHOUSE_LIST;
        const x = column.x + p.padding;
        const width = column.width - p.padding * 2;
        if (column.kinds.length === 0) {
            const empty = column.side === 'inventory' ? 'Nothing kept. Items found in your runs come here.' : 'Empty.';
            column.objects.push(this.add.text(column.x + column.width / 2, p.y + l.top + l.rowHeight, empty, {
                ...EQUIPMENT_DETAIL_STYLE, align: 'center', wordWrap: { width: width - 20 },
            }).setOrigin(0.5, 0));
            return;
        }
        const last = Math.min(column.kinds.length, column.first + this.visibleRows);
        for (let index = column.first; index < last; index++) {
            const kind = column.kinds[index];
            if (!kind) continue;
            const y = this.rowY(column, index);
            const middle = y + (l.rowHeight - 2) / 2;
            const background = this.add.rectangle(x, y, width, l.rowHeight - 2, l.hoverColor, 0).setOrigin(0);
            column.rows.set(index, background);
            column.objects.push(background);
            const icon = this.add.image(x + l.iconSize / 2 + 4, middle, '__DEFAULT');
            this.setIcon(icon, kind.item);
            column.objects.push(icon);
            const nameColor = ownedItemNameColor(kind.item);
            const color = nameColor !== undefined ? `#${nameColor.toString(16).padStart(6, '0')}` : EQUIPMENT_ROW_STYLE.color;
            const name = this.add.text(x + l.iconSize + 12, middle, ownedItemName(kind.item), { ...EQUIPMENT_ROW_STYLE, color }).setOrigin(0, 0.5);
            column.objects.push(name);
            if (kind.indices.length > 1) {
                column.objects.push(this.add.text(name.x + name.width + 6, middle, `×${kind.indices.length}`, { ...EQUIPMENT_DETAIL_STYLE, color: EQUIPMENT_OWNED_COLOR })
                    .setOrigin(0, 0.5));
            }
            // On the right: the slot, or which class uses it if the marked character can't.
            const other = otherClass(classId, kind.item);
            // Items never put on (the Xelima stone, Fase 24C) say what they are for.
            const slot = itemInfo(kind.item.id)?.slot;
            const note = other ? `${CHARACTERS[other].name} only` : slot ? EQUIP_SLOT_NAMES[slot] : 'Blacksmith';
            column.objects.push(this.add.text(x + width - 6, middle, note, { ...EQUIPMENT_DETAIL_STYLE, color: other ? WAREHOUSE_OTHER_CLASS_COLOR : EQUIPMENT_DETAIL_STYLE.color })
                .setOrigin(1, 0.5));
            background.setInteractive({ useHandCursor: true });
            background.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus({ kind: 'row', side: column.side, index }));
            background.on(Phaser.Input.Events.POINTER_UP, () => {
                if (!this.ready()) return;
                this.setFocus({ kind: 'row', side: column.side, index });
                this.move(column.side, index);
            });
        }
        const markX = column.x + column.width - p.padding / 2;
        if (column.first > 0) column.objects.push(this.add.text(markX, p.y + l.top, '▲', EQUIPMENT_DETAIL_STYLE).setOrigin(1, 1));
        if (last < column.kinds.length) column.objects.push(this.add.text(markX, this.rowY(column, last), '▼', EQUIPMENT_DETAIL_STYLE).setOrigin(1, 0));
    }

    private setIcon(image: Phaser.GameObjects.Image, item: OwnedItem): void {
        const frame = itemPicture(item.id, this.character?.look.gender ?? 'male');
        if (!frame || !this.iconsReady || !setColouredTexture(image, itemPackTexture(frame.sheet), frame.frame, ownedItemColor(item))) {
            image.setVisible(false);
            return;
        }
        image.setScale(Math.min(1, WAREHOUSE_LIST.iconSize / Math.max(image.frame.width, image.frame.height)));
    }

    private scroll(side: Side, rows: number): void {
        const column = this.columns[side];
        const max = Math.max(0, column.kinds.length - this.visibleRows);
        const first = Math.min(max, Math.max(0, column.first + rows));
        if (first === column.first) return;
        column.first = first;
        const character = this.character;
        if (character) this.drawColumn(column, character.classId);
        this.setFocus(this.focus);
    }

    private createOk(): void {
        const o = EQUIPMENT_OK;
        this.okButton = this.add.image(GAME_WIDTH / 2, WAREHOUSE_OK_Y, o.texture, o.frame).setScale(o.scale);
        this.okButton.setInteractive({ useHandCursor: true });
        this.okButton.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus({ kind: 'ok' }));
        this.okButton.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.close();
        });
    }

    // ---- Focus and actions ----

    private setFocus(focus: Focus, keepNotice = false): void {
        // A row that no longer exists (the last one moved away): the one above, or Ok if the list is empty.
        if (focus.kind === 'row') {
            const count = this.columns[focus.side].kinds.length;
            focus = count > 0 ? { ...focus, index: Math.min(focus.index, count - 1) } : focus;
        }
        const changed = JSON.stringify(focus) !== JSON.stringify(this.focus);
        this.focus = focus;
        if (changed && !keepNotice) this.notice = undefined;
        this.okButton.setFrame(EQUIPMENT_OK.frame + (focus.kind === 'ok' ? EQUIPMENT_OK.litOffset : 0));
        this.focusFrame.setVisible(false);
        if (focus.kind === 'row') {
            const column = this.columns[focus.side];
            if (focus.index < column.first) this.scroll(focus.side, focus.index - column.first);
            else if (focus.index >= column.first + this.visibleRows) this.scroll(focus.side, focus.index - column.first - this.visibleRows + 1);
            const row = column.rows.get(focus.index);
            if (row) this.focusFrame.setPosition(row.x - 1, row.y - 1).setSize(row.width + 2, row.height + 2).setVisible(true);
            else if (column.kinds.length === 0) {
                const p = WAREHOUSE_PANELS;
                this.focusFrame.setPosition(column.x + 3, p.y + 3).setSize(column.width - 6, p.height - 6).setVisible(true);
            }
        }
        this.helpText.setText(this.notice ?? this.describeFocus());
    }

    private describeFocus(): string {
        const focus = this.focus;
        if (focus.kind === 'ok') return 'Everything is saved as you move it. The warehouse is shared by all your characters.';
        const kind = this.columns[focus.side].kinds[focus.index];
        if (!kind) return focus.side === 'inventory' ? 'Your inventory is empty.' : 'The warehouse is empty.';
        const attribute = kind.item.attribute ? ` ${ATTRIBUTES[kind.item.attribute].description}.` : '';
        const upgrade = kind.item.upgrade ? ` ${upgradeDescription(kind.item.upgrade)}.` : '';
        const where = focus.side === 'inventory' ? 'to the warehouse' : 'to your inventory';
        return `${ownedItemName(kind.item)}: ${describeItem(kind.item.id)}.${attribute}${upgrade} Click or press Enter to move one ${where}.`;
    }

    private moveSideways(side: Side): void {
        const index = this.focus.kind === 'row' ? this.focus.index : 0;
        this.setFocus({ kind: 'row', side, index });
    }

    private moveVertically(dy: number): void {
        const focus = this.focus;
        if (focus.kind === 'ok') {
            if (dy < 0) {
                const side: Side = 'inventory';
                this.setFocus({ kind: 'row', side, index: Math.max(0, this.columns[side].kinds.length - 1) });
            }
            return;
        }
        const next = focus.index + dy;
        if (next < 0) return;
        if (next >= this.columns[focus.side].kinds.length) this.setFocus({ kind: 'ok' });
        else this.setFocus({ ...focus, index: next });
    }

    private press(): void {
        if (this.focus.kind === 'ok') this.close();
        else this.move(this.focus.side, this.focus.index);
    }

    /** Moves one item of that row to the other side. */
    private move(side: Side, index: number): void {
        const kind = this.columns[side].kinds[index];
        const at = kind?.indices[kind.indices.length - 1];
        if (!kind || at === undefined) return;
        if (side === 'inventory' && warehouseStore.isFull) {
            this.notice = `The warehouse is full (${WAREHOUSE_CAPACITY} items). Take something out first.`;
            this.helpText.setText(this.notice);
            return;
        }
        const moved = side === 'inventory' ? warehouseStore.deposit(this.uid, at) : warehouseStore.withdraw(this.uid, at);
        if (!moved) return;
        this.notice = `${ownedItemName(kind.item)} moved ${side === 'inventory' ? 'to the warehouse' : 'to your inventory'}.`;
        this.refresh();
        this.setFocus(this.focus, true);
    }

    private close(): void {
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}

/** One entry per kind (item, attribute and "+"), ordered by slot and then by name. */
function groupKinds(items: readonly Readonly<OwnedItem>[]): Kind[] {
    const kinds: Kind[] = [];
    items.forEach((item, index) => {
        const kind = kinds.find((k) => sameOwnedItem(k.item, item));
        if (kind) kind.indices.push(index);
        else kinds.push({ item: { ...item }, indices: [index] });
    });
    // Items with no slot (the Xelima stone) go last.
    const slotOrder = (kind: Kind) => {
        const slot = itemInfo(kind.item.id)?.slot;
        return slot ? EQUIP_SLOT_IDS.indexOf(slot) : EQUIP_SLOT_IDS.length;
    };
    return kinds.sort((a, b) => slotOrder(a) - slotOrder(b) || ownedItemName(a.item).localeCompare(ownedItemName(b.item)));
}

/** The class that uses the item, if the marked character's can't (a wand for the Warrior). */
function otherClass(classId: CharacterId, item: OwnedItem): CharacterId | undefined {
    if (classCanWear(classId, item.id)) return undefined;
    const other: CharacterId = classId === 'warrior' ? 'mage' : 'warrior';
    return classCanWear(other, item.id) ? other : undefined;
}
