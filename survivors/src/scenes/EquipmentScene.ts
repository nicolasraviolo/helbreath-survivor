// Pantalla Equipment (Fase 20B; medidas en config/equipment.ts). Se abre desde Select Character (botón "Equipment",
// tecla I o X del mando) con el personaje marcado:
// - Izquierda: la ventana Character original con el muñeco vestido con su equipo, su Level y sus stats permanentes.
// - Derecha: los huecos (arma, escudo, casco, armadura, pantalones, botas y capa; debajo, los 2 hechizos del Mago,
//   Fase 20D, el Zem, Fase 21D, y apagados los que llegarán: anillo, collar y ángel) y la lista del hueco
//   elegido (data/items.ts). Cada objeto enseña su requisito; en rojo lo que el personaje no cumple, y entonces no se
//   puede poner. Los hechizos aún no tienen dibujo: su casilla lleva el nombre.
// - Ponerse o quitarse algo se guarda al momento (characterStore.equip). Ok, Esc o B cierran.
// - Fase 21B: la Maga elige varita en el hueco Weapon. Las armas con atributo llevan el nombre en su color.
// - Fase 21D, "solo lo que tienes": la lista enseña el equipo de salida, lo que lleva puesto y lo que tiene en el
//   inventario ("×N"); los hechizos, todos los que se saben con la Int. Ponerse algo lo saca del inventario y lo que se
//   quita vuelve a él. Si no caben, las filas se estrechan y, si aún no caben, la lista se desplaza (rueda o flechas).
// Teclado y mando: izquierda/derecha eligen hueco, abajo entra en la lista, Enter / A se pone el objeto marcado.
import Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import {
    CHARACTER_INFO_BOXES,
    CHARACTER_INFO_DOLL,
    CHARACTER_INFO_FRAME,
    CHARACTER_INFO_HELP_GAP,
    CHARACTER_INFO_HELP_STYLE,
    CHARACTER_INFO_INPUT_DELAY_MS,
    CHARACTER_INFO_NAME_STYLE,
    CHARACTER_INFO_POSITION,
    CHARACTER_INFO_SCALE,
    CHARACTER_INFO_SHADE_ALPHA,
    CHARACTER_INFO_SIZE,
    CHARACTER_INFO_STAT_BOXES,
    CHARACTER_INFO_TEXTURE,
    CHARACTER_INFO_VALUE_STYLE,
    type InfoBox,
} from '../config/characterInfo';
import {
    EQUIPMENT_DETAIL_STYLE,
    EQUIPMENT_LABEL_STYLE,
    EQUIPMENT_LIST,
    EQUIPMENT_MET_COLOR,
    EQUIPMENT_OK,
    EQUIPMENT_OWNED_COLOR,
    EQUIPMENT_PANEL,
    EQUIPMENT_ROW_STYLE,
    EQUIPMENT_SLOTS,
    EQUIPMENT_SPELL_NAME_STYLE,
    EQUIPMENT_TITLE_STYLE,
    EQUIPMENT_UNMET_COLOR,
    itemPackTexture,
} from '../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { totalExpForLevel, CHARACTER_LEVEL_MAX } from '../data/characterLevel';
import { CHARACTERS } from '../data/characters';
import { attributeColor, ATTRIBUTES, ITEM_ATTRIBUTES, type ItemAttribute } from '../data/attributes';
import { setColouredTexture } from '../hb/additiveTint';
import { sameOwnedItem, type OwnedItem } from '../data/loot';
import { upgradeDescription, upgradeOf } from '../data/upgrades';
import {
    canChangeSlot,
    canEmptySlot,
    catalog,
    describeItem,
    EQUIP_SLOT_IDS,
    EQUIP_SLOT_NAMES,
    GEAR_SLOT_IDS,
    isFreeItem,
    isSpellItemId,
    SECOND_ROW_SLOTS,
    itemIcon,
    itemInfo,
    ownedItemName,
    requirementChecks,
    type EquipSlotId,
    type ItemId,
} from '../data/items';
import { STAT_IDS } from '../data/stats';
import { PaperDoll } from '../entities/PaperDoll';
import { CharacterStats } from '../entities/CharacterStats';
import { characterStore, permanentStats, wornItem, type SavedCharacter } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { lookLoader } from '../systems/LookLoader';
import type { MenuOverlayData } from './MenuOverlayScene';

export interface EquipmentSceneData {
    characterUid: string;
}

/** A row of the list: an item, or undefined for "Nothing" (empty the slot). */
interface Row {
    /** With its attribute (Fase 21B) and "+" (Fase 24D). */
    item: OwnedItem | undefined;
}

/** What is drawn of a row inside the visible part of the list. */
interface RowView {
    index: number;
    background: Phaser.GameObjects.Rectangle;
    objects: Phaser.GameObjects.GameObject[];
}

/** Help of the Zem slot (Fase 21D). */
const ZEM_HELP = 'If you die wearing it, you keep the items found in that run (it is used up). Bosses drop it sometimes.';

type Focus = { kind: 'slot' } | { kind: 'row'; index: number } | { kind: 'ok' };

export class EquipmentScene extends Phaser.Scene {
    private uid = '';
    private returnTo = '';
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private slot: EquipSlotId = 'weapon';
    private focus: Focus = { kind: 'slot' };
    private slotBoxes = new Map<EquipSlotId, { box: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text }>();
    private rows: Row[] = [];
    private views: RowView[] = [];
    /** First row shown, and how many fit (Fase 21D: the list scrolls when they don't). */
    private firstRow = 0;
    private visibleRows = 0;
    private scrollMarks: Phaser.GameObjects.Text[] = [];
    /** Height of each row of the list: smaller when the items don't fit (Fase 21B). */
    private rowHeight: number = EQUIPMENT_LIST.rowHeight;
    private doll: PaperDoll | undefined;
    private okButton!: Phaser.GameObjects.Image;
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private helpText!: Phaser.GameObjects.Text;
    /** item-pack.spr is downloaded the first time the screen opens: pictures appear when it arrives. */
    private iconsReady = false;

    constructor() {
        super('Equipment');
    }

    init(data: EquipmentSceneData & MenuOverlayData): void {
        this.uid = data.characterUid;
        this.returnTo = data.returnTo;
        this.slotBoxes = new Map();
        this.rows = [];
        this.views = [];
        this.scrollMarks = [];
        this.doll = undefined;
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        const character = this.character;
        if (!character) {
            this.close();
            return;
        }
        this.openedAt = this.time.now;
        this.slot = canChangeSlot(character.classId, 'weapon') ? 'weapon' : 'body';
        const debugSlot = DEBUG_START.openSlot;
        if (debugSlot && canChangeSlot(character.classId, debugSlot)) this.slot = debugSlot;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, CHARACTER_INFO_SHADE_ALPHA).setOrigin(0);
        const { x, y } = CHARACTER_INFO_POSITION.run;
        this.add.image(x, y, CHARACTER_INFO_TEXTURE, CHARACTER_INFO_FRAME).setOrigin(0).setScale(CHARACTER_INFO_SCALE);
        this.fillCharacterWindow(character);
        this.buildDoll();

        const p = EQUIPMENT_PANEL;
        this.add.rectangle(p.x, p.y, p.width, p.height, p.background, p.alpha).setOrigin(0).setStrokeStyle(2, p.border);
        this.add.text(p.x + p.width / 2, p.y + p.padding, 'Equipment', EQUIPMENT_TITLE_STYLE).setOrigin(0.5, 0);
        this.createSlots();
        this.createOk();
        this.focusFrame = this.add.rectangle(0, 0, 1, 1).setOrigin(0).setStrokeStyle(2, EQUIPMENT_LIST.focusColor).setDepth(2);
        const bottom = y + CHARACTER_INFO_SIZE.height * CHARACTER_INFO_SCALE;
        this.helpText = this.add.text(x + (CHARACTER_INFO_SIZE.width * CHARACTER_INFO_SCALE) / 2, bottom + CHARACTER_INFO_HELP_GAP, '', {
            ...CHARACTER_INFO_HELP_STYLE, align: 'center', wordWrap: { width: CHARACTER_INFO_SIZE.width * CHARACTER_INFO_SCALE },
        }).setOrigin(0.5, 0);

        this.inputSystem = new InputSystem(this);
        // Slots, rows and Ok have their own click areas: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
        this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => this.scrollBy(Math.sign(dy)));
        this.showSlot(this.slot);
        this.setFocus({ kind: 'slot' });
        if (!this.iconsReady) {
            void lookLoader.ensure(this, ['item.pack']).then(() => {
                if (!this.sys.isActive()) return;
                this.iconsReady = true;
                this.refreshSlotIcons();
                this.showSlot(this.slot);
                this.setFocus(this.focus);
            });
        }
    }

    override update(_time: number, delta: number): void {
        this.doll?.update(delta);
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.moveSideways(-1);
        if (input.justPressed(Action.MenuRight)) this.moveSideways(1);
        if (input.justPressed(Action.MenuUp)) this.moveVertically(-1);
        if (input.justPressed(Action.MenuDown)) this.moveVertically(1);
        if (input.justPressed(Action.Pick)) this.press();
    }

    private get character(): Readonly<SavedCharacter> | undefined {
        return characterStore.byUid(this.uid);
    }

    // ---- Character window (left) ----

    private sx(x: number): number {
        return CHARACTER_INFO_POSITION.run.x + x * CHARACTER_INFO_SCALE;
    }

    private sy(y: number): number {
        return CHARACTER_INFO_POSITION.run.y + y * CHARACTER_INFO_SCALE;
    }

    private boxText(box: InfoBox, text: string): void {
        this.add.text(this.sx(box.x + box.width / 2), this.sy(box.y + box.height / 2), text, CHARACTER_INFO_VALUE_STYLE).setOrigin(0.5);
    }

    /** Name, Level, EXP and permanent stats: they don't change on this screen. */
    private fillCharacterWindow(character: Readonly<SavedCharacter>): void {
        const def = CHARACTERS[character.classId];
        const b = CHARACTER_INFO_BOXES;
        this.add.text(this.sx(b.name.x + b.name.width / 2), this.sy(b.name.y + b.name.height / 4), character.name, CHARACTER_INFO_NAME_STYLE).setOrigin(0.5);
        this.add.text(this.sx(b.name.x + b.name.width / 2), this.sy(b.name.y + (b.name.height * 3) / 4), def.name, CHARACTER_INFO_VALUE_STYLE).setOrigin(0.5);
        this.boxText(b.level, String(character.level));
        this.boxText(b.exp, (totalExpForLevel(character.level) + character.exp).toLocaleString('en-US'));
        this.boxText(b.nextExp, character.level >= CHARACTER_LEVEL_MAX ? '—' : totalExpForLevel(character.level + 1).toLocaleString('en-US'));
        const stats = permanentStats(character);
        const start = new CharacterStats(def, stats, character.level);
        this.boxText(b.health, String(start.maxHp));
        this.boxText(b.mana, String(start.maxMana));
        for (const id of STAT_IDS) this.boxText(CHARACTER_INFO_STAT_BOXES[id], String(stats[id]));
    }

    /** The character dressed in what it wears now (rebuilt after every change). */
    private buildDoll(): void {
        const character = this.character;
        if (!character) return;
        this.doll?.destroy();
        this.doll = new PaperDoll(this, CHARACTERS[character.classId], character.look, character.equipment, {
            x: this.sx(0), y: this.sy(0), scale: CHARACTER_INFO_SCALE,
            standInX: this.sx(CHARACTER_INFO_DOLL.x), standInY: this.sy(CHARACTER_INFO_DOLL.y),
        }, character.attributes);
    }

    // ---- Slots (top of the panel) ----

    private slotPosition(index: number, row: number): { x: number; y: number } {
        const s = EQUIPMENT_SLOTS;
        const count = GEAR_SLOT_IDS.length;
        const rowWidth = count * s.size + (count - 1) * s.gap;
        return {
            x: EQUIPMENT_PANEL.x + (EQUIPMENT_PANEL.width - rowWidth) / 2 + index * (s.size + s.gap),
            y: EQUIPMENT_PANEL.y + s.top + row * (s.size + s.labelHeight + s.rowGap),
        };
    }

    private createSlots(): void {
        const s = EQUIPMENT_SLOTS;
        const character = this.character;
        // Gear on the first row; the second one has the spells, the Zem and the slots still to come (SECOND_ROW_SLOTS).
        const places: Array<[EquipSlotId, number, number]> = GEAR_SLOT_IDS.map((slot, i): [EquipSlotId, number, number] => [slot, i, 0]);
        SECOND_ROW_SLOTS.forEach((slot, i) => {
            if (typeof slot === 'string') {
                places.push([slot, i, 1]);
                return;
            }
            const { x, y } = this.slotPosition(i, 1);
            this.add.rectangle(x, y, s.size, s.size, s.background).setOrigin(0).setStrokeStyle(2, s.border).setAlpha(s.futureAlpha);
            this.slotLabel(x, y, slot.future).setAlpha(s.futureAlpha);
        });
        for (const [slot, index, row] of places) {
            const { x, y } = this.slotPosition(index, row);
            const box = this.add.rectangle(x, y, s.size, s.size, s.background).setOrigin(0).setStrokeStyle(2, s.border);
            const icon = this.add.image(x + s.size / 2, y + s.size / 2, '__DEFAULT').setVisible(false);
            const name = this.add.text(x + s.size / 2, y + s.size / 2, '', { ...EQUIPMENT_SPELL_NAME_STYLE, wordWrap: { width: s.size - 4 } })
                .setOrigin(0.5);
            const label = this.slotLabel(x, y, EQUIP_SLOT_NAMES[slot]);
            if (character && !canChangeSlot(character.classId, slot)) {
                box.setAlpha(s.futureAlpha);
                label.setAlpha(s.futureAlpha);
            }
            box.setInteractive({ useHandCursor: true });
            box.on(Phaser.Input.Events.POINTER_UP, () => {
                if (!this.ready()) return;
                this.showSlot(slot);
                this.setFocus({ kind: 'slot' });
            });
            this.slotBoxes.set(slot, { box, icon, name });
        }
        this.refreshSlotIcons();
    }

    /** Name under a slot box; long ones take two lines. */
    private slotLabel(x: number, y: number, name: string): Phaser.GameObjects.Text {
        const s = EQUIPMENT_SLOTS;
        return this.add.text(x + s.size / 2, y + s.size + 1, name, { ...EQUIPMENT_LABEL_STYLE, align: 'center', wordWrap: { width: s.size + s.gap } })
            .setOrigin(0.5, 0);
    }

    private refreshSlotIcons(): void {
        const character = this.character;
        if (!character) return;
        for (const [slot, { icon, name }] of this.slotBoxes) {
            const id = character.equipment[slot];
            this.setIcon(icon, id, EQUIPMENT_SLOTS.iconSize, character.attributes[slot]);
            name.setText(id && isSpellItemId(id) ? (itemInfo(id)?.name ?? '') : '');
        }
    }

    /** Shows an item's picture fitted inside `size` (hidden while item-pack.spr is downloading, or without an item). */
    private setIcon(image: Phaser.GameObjects.Image, id: ItemId | undefined, size: number, attribute?: ItemAttribute): void {
        const character = this.character;
        const frame = id && character ? itemIcon(id, character.look.gender) : undefined;
        // Fase 21B: a weapon with an attribute in its colour.
        if (!frame || !this.iconsReady || !setColouredTexture(image, itemPackTexture(frame.sheet), frame.frame, attributeColor(attribute))) {
            image.setVisible(false);
            return;
        }
        image.setVisible(true);
        image.setScale(Math.min(1, size / Math.max(image.frame.width, image.frame.height)));
    }

    // ---- Item list (rest of the panel) ----

    /** Chooses a slot: its box is outlined and the list shows what can go in it. */
    private showSlot(slot: EquipSlotId): void {
        this.slot = slot;
        for (const [id, { box }] of this.slotBoxes) {
            box.setStrokeStyle(2, id === slot ? EQUIPMENT_SLOTS.selectedBorder : EQUIPMENT_SLOTS.border);
        }
        const character = this.character;
        if (!character) return;
        this.rows = this.listFor(character, slot);
        const okTop = EQUIPMENT_PANEL.y + EQUIPMENT_PANEL.height - EQUIPMENT_OK.bottom - EQUIPMENT_OK.height * EQUIPMENT_OK.scale;
        const room = okTop - (EQUIPMENT_PANEL.y + EQUIPMENT_LIST.top) - EQUIPMENT_LIST.bottomGap;
        this.rowHeight = Math.max(EQUIPMENT_LIST.minRowHeight, Math.min(EQUIPMENT_LIST.rowHeight, Math.floor(room / Math.max(1, this.rows.length))));
        this.visibleRows = Math.max(1, Math.floor(room / this.rowHeight));
        this.firstRow = 0;
        this.drawRows();
    }

    /**
     * What can go in the slot (Fase 21D, "only what you have"): "Nothing" if it can be emptied, then the free items
     * (starting gear, spells known with the Int), what it wears and what it keeps in its inventory, one row per kind,
     * from the easiest requirement to the hardest.
     */
    private listFor(character: Readonly<SavedCharacter>, slot: EquipSlotId): Row[] {
        const ladder = catalog(character.classId, slot);
        const items: OwnedItem[] = ladder.filter((id) => isFreeItem(character.classId, id, character.learnedSpells)).map((id) => ({ id }));
        const has = (item: OwnedItem) => items.some((other) => sameOwnedItem(other, item));
        const worn = characterStore.worn(this.uid, slot);
        if (worn && !has(worn)) items.push(worn);
        for (const { item } of characterStore.ownedFor(this.uid, slot)) if (!has(item)) items.push(item);
        const order = (item: OwnedItem) => (ladder.indexOf(item.id) * 10 + (item.attribute ? ITEM_ATTRIBUTES.indexOf(item.attribute) + 1 : 0)) * 10 + upgradeOf(item);
        items.sort((a, b) => order(a) - order(b));
        const rows: Row[] = items.map((item) => ({ item }));
        if (rows.length > 0 && canEmptySlot(slot)) rows.unshift({ item: undefined });
        return rows;
    }

    /** Draws the rows from firstRow on that fit, with ▲ / ▼ when there are more above or below. */
    private drawRows(): void {
        for (const view of this.views) {
            view.background.destroy();
            view.objects.forEach((object) => object.destroy());
        }
        this.scrollMarks.forEach((mark) => mark.destroy());
        this.scrollMarks = [];
        const character = this.character;
        if (!character) return;
        const last = Math.min(this.rows.length, this.firstRow + this.visibleRows);
        this.views = [];
        for (let index = this.firstRow; index < last; index++) this.views.push(this.createRow(character, index));
        const p = EQUIPMENT_PANEL;
        const markX = p.x + p.width - p.padding / 2;
        if (this.firstRow > 0) {
            this.scrollMarks.push(this.add.text(markX, p.y + EQUIPMENT_LIST.top, '▲', EQUIPMENT_DETAIL_STYLE).setOrigin(1, 1));
        }
        if (last < this.rows.length) {
            this.scrollMarks.push(this.add.text(markX, p.y + EQUIPMENT_LIST.top + this.visibleRows * this.rowHeight, '▼', EQUIPMENT_DETAIL_STYLE).setOrigin(1, 0));
        }
    }

    /** Mouse wheel: moves the list one row (Fase 21D). */
    private scrollBy(rows: number): void {
        const max = Math.max(0, this.rows.length - this.visibleRows);
        const first = Math.min(max, Math.max(0, this.firstRow + rows));
        if (first === this.firstRow) return;
        this.firstRow = first;
        this.drawRows();
        this.setFocus(this.focus);
    }

    /** Scrolls so that row is visible. */
    private reveal(index: number): void {
        if (index < this.firstRow) this.scrollBy(index - this.firstRow);
        else if (index >= this.firstRow + this.visibleRows) this.scrollBy(index - this.firstRow - this.visibleRows + 1);
    }

    private createRow(character: Readonly<SavedCharacter>, index: number): RowView {
        const l = EQUIPMENT_LIST;
        const p = EQUIPMENT_PANEL;
        const item = this.rows[index]?.item;
        const id = item?.id;
        const attribute = item?.attribute;
        const rowHeight = this.rowHeight;
        const iconSize = Math.min(l.iconSize, rowHeight - 4);
        const x = p.x + p.padding;
        const y = p.y + l.top + (index - this.firstRow) * rowHeight;
        const width = p.width - p.padding * 2;
        const worn = this.isWorn(item);
        const background = this.add.rectangle(x, y, width, rowHeight - 2, l.wornColor, worn ? 1 : 0).setOrigin(0);
        const objects: Phaser.GameObjects.GameObject[] = [];
        const middle = y + (rowHeight - 2) / 2;
        const icon = this.add.image(x + iconSize / 2 + 4, middle, '__DEFAULT');
        this.setIcon(icon, id, iconSize, attribute);
        objects.push(icon);
        const name = item ? ownedItemName(item) : 'Nothing';
        const color = attribute ? `#${ATTRIBUTES[attribute].color.toString(16).padStart(6, '0')}` : EQUIPMENT_ROW_STYLE.color;
        const nameText = this.add.text(x + l.iconSize + 12, middle, name, { ...EQUIPMENT_ROW_STYLE, color }).setOrigin(0, 0.5);
        objects.push(nameText);
        // Fase 21A: how many the character keeps in its inventory.
        const owned = item ? characterStore.ownedCount(this.uid, item) : 0;
        if (owned > 0) {
            objects.push(this.add.text(nameText.x + nameText.width + 6, middle, `×${owned}`, { ...EQUIPMENT_DETAIL_STYLE, color: EQUIPMENT_OWNED_COLOR })
                .setOrigin(0, 0.5));
        }
        if (id) {
            // Requirements on the right: green if met, red if not.
            let right = x + width - 6;
            for (const check of requirementChecks(id, permanentStats(character), character.level).reverse()) {
                const text = this.add.text(right, middle, check.label, { ...EQUIPMENT_DETAIL_STYLE, color: check.met ? EQUIPMENT_MET_COLOR : EQUIPMENT_UNMET_COLOR })
                    .setOrigin(1, 0.5);
                right -= text.width + 8;
                objects.push(text);
            }
        }
        background.setInteractive({ useHandCursor: true });
        background.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus({ kind: 'row', index }));
        background.on(Phaser.Input.Events.POINTER_UP, () => {
            if (!this.ready()) return;
            this.setFocus({ kind: 'row', index });
            this.wear(index);
        });
        return { index, background, objects };
    }

    private createOk(): void {
        const o = EQUIPMENT_OK;
        const p = EQUIPMENT_PANEL;
        const x = p.x + (p.width - o.width * o.scale) / 2;
        const y = p.y + p.height - o.bottom - o.height * o.scale;
        this.okButton = this.add.image(x, y, o.texture, o.frame).setOrigin(0).setScale(o.scale);
        this.okButton.setInteractive({ useHandCursor: true });
        this.okButton.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus({ kind: 'ok' }));
        this.okButton.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.close();
        });
    }

    // ---- Focus and actions ----

    private setFocus(focus: Focus): void {
        this.focus = focus;
        this.okButton.setFrame(EQUIPMENT_OK.frame + (focus.kind === 'ok' ? EQUIPMENT_OK.litOffset : 0));
        if (focus.kind === 'slot') {
            const box = this.slotBoxes.get(this.slot)?.box;
            if (box) this.focusFrame.setPosition(box.x - 3, box.y - 3).setSize(box.width + 6, box.height + 6).setVisible(true);
        } else if (focus.kind === 'row') {
            this.reveal(focus.index);
            const view = this.views.find((v) => v.index === focus.index);
            if (view) this.focusFrame.setPosition(view.background.x - 1, view.background.y - 1).setSize(view.background.width + 2, view.background.height + 2).setVisible(true);
            else this.focusFrame.setVisible(false);
        } else {
            this.focusFrame.setVisible(false);
        }
        this.helpText.setText(this.describeFocus());
    }

    private describeFocus(): string {
        const character = this.character;
        if (!character) return '';
        if (this.focus.kind === 'ok') return 'Your equipment is saved as you change it.';
        if (this.focus.kind === 'slot') {
            if (!canChangeSlot(character.classId, this.slot)) return 'Only the Mage casts spells.';
            const worn = characterStore.worn(this.uid, this.slot);
            // Fase 21D: what the Zem does, and where it comes from.
            const zem = this.slot === 'zem' ? ` ${ZEM_HELP}` : '';
            return `${EQUIP_SLOT_NAMES[this.slot]}: ${worn ? ownedItemName(worn) : 'nothing'}.${zem}`;
        }
        const item = this.rows[this.focus.index]?.item;
        const id = item?.id;
        if (!item || !id) return `Take off what you wear in this slot.`;
        const unmet = requirementChecks(id, permanentStats(character), character.level).filter((check) => !check.met);
        const needs = unmet.length > 0 ? ` Needs ${unmet.map((check) => check.label).join(', ')}.` : '';
        const owned = characterStore.ownedCount(this.uid, item);
        const kept = owned > 0 ? ` You keep ${owned} in your inventory.` : isFreeItem(character.classId, id, character.learnedSpells) && !item.attribute && !item.upgrade ? '' : ' The one you wear.';
        const attribute = item.attribute ? ` ${ATTRIBUTES[item.attribute].description}.` : '';
        const upgrade = item.upgrade ? ` ${upgradeDescription(item.upgrade)}.` : '';
        return `${ownedItemName(item)}: ${describeItem(id)}.${attribute}${upgrade}${needs}${kept}`;
    }

    private moveSideways(dx: number): void {
        if (this.focus.kind !== 'slot') return;
        const index = EQUIP_SLOT_IDS.indexOf(this.slot);
        const count = EQUIP_SLOT_IDS.length;
        const next = EQUIP_SLOT_IDS[(index + dx + count) % count] ?? this.slot;
        this.showSlot(next);
        this.setFocus({ kind: 'slot' });
    }

    private moveVertically(dy: number): void {
        const last = this.rows.length - 1;
        const focus = this.focus;
        if (focus.kind === 'slot') {
            if (dy > 0) this.setFocus(last >= 0 ? { kind: 'row', index: this.wornRow() } : { kind: 'ok' });
        } else if (focus.kind === 'row') {
            const next = focus.index + dy;
            if (next < 0) this.setFocus({ kind: 'slot' });
            else if (next > last) this.setFocus({ kind: 'ok' });
            else this.setFocus({ kind: 'row', index: next });
        } else if (dy < 0) {
            this.setFocus(last >= 0 ? { kind: 'row', index: last } : { kind: 'slot' });
        }
    }

    /** Row of the item worn now (the first one if the slot holds nothing listed). */
    private wornRow(): number {
        return Math.max(0, this.rows.findIndex((row) => this.isWorn(row.item)));
    }

    /** That item is the one worn in the slot (same attribute and "+"). */
    private isWorn(item: Readonly<OwnedItem> | undefined): boolean {
        const character = this.character;
        const worn = character ? wornItem(character, this.slot) : undefined;
        return item !== undefined && worn !== undefined && sameOwnedItem(worn, item);
    }

    private press(): void {
        if (this.focus.kind === 'slot') this.moveVertically(1);
        else if (this.focus.kind === 'row') this.wear(this.focus.index);
        else this.close();
    }

    /** Puts on the item of that row (or empties the slot); refused, with the reason, if a requirement is not met. */
    private wear(index: number): void {
        const row = this.rows[index];
        if (!row) return;
        // Already worn (an item with an attribute can't be put on again: it is no longer in the inventory).
        if (this.isWorn(row.item)) return;
        if (!characterStore.equip(this.uid, this.slot, row.item)) {
            this.helpText.setText(`${this.describeFocus()} Assign points with Level Set.`);
            return;
        }
        this.buildDoll();
        this.refreshSlotIcons();
        this.showSlot(this.slot);
        this.setFocus({ kind: 'row', index });
    }

    private close(): void {
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}
