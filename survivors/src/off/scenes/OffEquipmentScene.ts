// Helbreath Off (Fase Off-3C): pantalla Equipment, sobre el mundo. Se ve como la de Survivors
// (scenes/EquipmentScene.ts, con sus medidas de config/equipment.ts), pero con el personaje y los objetos de Off:
// - Izquierda: la ventana Character original (sin Charisma) con el muñeco vestido, el nivel, la experiencia, la vida /
//   maná / estamina y los stats.
// - Derecha: los 7 huecos (el anillo apagado debajo), la lista del hueco elegido y, al marcar un objeto, el **cuadro de
//   stats** (off/ui/offItemBox.ts), comparado con lo que llevas puesto. Sin la STR, el requisito sale en rojo y no deja
//   ponérselo.
// - Off-4B: la lista es lo que llevas puesto y lo que hay en la bolsa para ese hueco. Lo que te pones sale de la bolsa
//   y lo que te quitas vuelve a ella (si está llena, no deja quitárselo).
// - Off-4B: el mundo **no se para** debajo (propietario, 7-nov-2026: solo Esc o Start pausan); al cerrar, el personaje
//   se viste con lo nuevo.
// - Lo que te pones se guarda al momento (offSaveStore.equip). Ok, Esc, B, I o X cierran.
// Teclado y mando como en Survivors: izquierda/derecha eligen hueco, abajo entra en la lista, Enter / A se lo pone.
// Es una escena aparte (no un modo de EquipmentScene) porque aquella está atada a los personajes guardados de Survivors.
import Phaser from 'phaser';
import {
    CHARACTER_INFO_BOXES,
    CHARACTER_INFO_CHR_COVER,
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
} from '../../config/characterInfo';
import {
    EQUIPMENT_DETAIL_STYLE,
    EQUIPMENT_LABEL_STYLE,
    EQUIPMENT_LIST,
    EQUIPMENT_MET_COLOR,
    EQUIPMENT_OK,
    EQUIPMENT_PANEL,
    EQUIPMENT_ROW_STYLE,
    EQUIPMENT_SLOTS,
    EQUIPMENT_TITLE_STYLE,
    EQUIPMENT_UNMET_COLOR,
    itemPackTexture,
} from '../../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { EQUIP_SLOT_NAMES, itemIcon } from '../../data/items';
import { PaperDoll } from '../../entities/PaperDoll';
import { Action, InputSystem } from '../../systems/InputSystem';
import { lookLoader } from '../../systems/LookLoader';
import { OFF_EQUIPMENT_BOX } from '../config/offEquipment';
import { OFF_LOOT_TEXT } from '../data/offLoot';
import { OFF_STAT_IDS, offMaxHp, offMaxMana, offMaxStamina } from '../data/offCharacter';
import {
    canEmptyOffSlot,
    OFF_FUTURE_SLOTS,
    OFF_GEAR_SLOT_IDS,
    OFF_ITEMS,
    offBagGearFor,
    offEquipmentLook,
    offItem,
    offNeedsText,
    offWearCheck,
    type OffItemId,
    type OffSlotId,
    type OffWearer,
} from '../data/offItems';
import { OFF_LEVEL, offExpForLevel } from '../data/offLevel';
import { OFF_NOVICE } from '../data/offWorld';
import { offSaveStore } from '../systems/OffSaveStore';
import { drawOffItemBox, offItemBoxLines } from '../ui/offItemBox';

export const OFF_EQUIPMENT_SCENE_KEY = 'OffEquipment';

export interface OffEquipmentSceneData {
    /** Health, mana and stamina now (the window shows "now/max"). */
    vitals: { hp: number; mana: number; stamina: number };
    /** After closing (the world dresses the character in the new gear). */
    onClose: () => void;
}

/** A row of the list: an item, or undefined for "Nothing" (empty the slot). */
type Row = OffItemId | undefined;

interface RowView {
    index: number;
    background: Phaser.GameObjects.Rectangle;
    objects: Phaser.GameObjects.GameObject[];
}

type Focus = { kind: 'slot' } | { kind: 'row'; index: number } | { kind: 'ok' };

export class OffEquipmentScene extends Phaser.Scene {
    private params!: OffEquipmentSceneData;
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private slot: OffSlotId = 'weapon';
    private focus: Focus = { kind: 'slot' };
    private slotBoxes = new Map<OffSlotId, { box: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image }>();
    private rows: Row[] = [];
    private views: RowView[] = [];
    private doll: PaperDoll | undefined;
    private okButton!: Phaser.GameObjects.Image;
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private helpText!: Phaser.GameObjects.Text;
    private boxObjects: Phaser.GameObjects.GameObject[] = [];
    private iconsReady = false;

    constructor() {
        super(OFF_EQUIPMENT_SCENE_KEY);
    }

    init(data: OffEquipmentSceneData): void {
        this.params = data;
        this.slotBoxes = new Map();
        this.rows = [];
        this.views = [];
        this.boxObjects = [];
        this.doll = undefined;
        this.slot = 'weapon';
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, CHARACTER_INFO_SHADE_ALPHA).setOrigin(0);
        const { x, y } = CHARACTER_INFO_POSITION.run;
        this.add.image(x, y, CHARACTER_INFO_TEXTURE, CHARACTER_INFO_FRAME).setOrigin(0).setScale(CHARACTER_INFO_SCALE);
        this.hideCharisma();
        this.fillCharacterWindow();
        this.buildDoll();
        const p = EQUIPMENT_PANEL;
        this.add.rectangle(p.x, p.y, p.width, p.height, p.background, p.alpha).setOrigin(0).setStrokeStyle(2, p.border);
        this.add.text(p.x + p.width / 2, p.y + p.padding, 'Equipment', EQUIPMENT_TITLE_STYLE).setOrigin(0.5, 0);
        this.createSlots();
        this.createOk();
        this.focusFrame = this.add.rectangle(0, 0, 1, 1).setOrigin(0).setStrokeStyle(2, EQUIPMENT_LIST.focusColor).setDepth(2);
        const bottom = y + CHARACTER_INFO_SIZE.height * CHARACTER_INFO_SCALE;
        const width = CHARACTER_INFO_SIZE.width * CHARACTER_INFO_SCALE;
        this.helpText = this.add.text(x + width / 2, bottom + CHARACTER_INFO_HELP_GAP, '', {
            ...CHARACTER_INFO_HELP_STYLE, align: 'center', wordWrap: { width },
        }).setOrigin(0.5, 0);
        this.inputSystem = new InputSystem(this);
        // Slots, rows and Ok have their own click areas: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
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
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause) || input.justPressed(Action.OffInventory)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.moveSideways(-1);
        if (input.justPressed(Action.MenuRight)) this.moveSideways(1);
        if (input.justPressed(Action.MenuUp)) this.moveVertically(-1);
        if (input.justPressed(Action.MenuDown)) this.moveVertically(1);
        if (input.justPressed(Action.Pick)) this.press();
    }

    private get equipment() {
        return offSaveStore.character.equipment;
    }

    private get str(): number {
        return offSaveStore.character.stats.str;
    }

    private get wearer(): OffWearer {
        return { str: this.str, level: offSaveStore.level };
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

    /** Off has no Charisma: covered with plain parchment from the same image (as CharacterInfoScene in Off). */
    private hideCharisma(): void {
        for (const c of CHARACTER_INFO_CHR_COVER) {
            this.add.image(this.sx(c.x - c.sourceX), this.sy(c.y - c.sourceY), CHARACTER_INFO_TEXTURE, CHARACTER_INFO_FRAME).setOrigin(0)
                .setScale(CHARACTER_INFO_SCALE).setCrop(c.sourceX, c.sourceY, c.width, c.height);
        }
    }

    /** Name, level, experience, health / mana / stamina and stats: they don't change on this screen. */
    private fillCharacterWindow(): void {
        const saved = offSaveStore.character;
        const level = offSaveStore.level;
        const b = CHARACTER_INFO_BOXES;
        const centerX = this.sx(b.name.x + b.name.width / 2);
        this.add.text(centerX, this.sy(b.name.y + b.name.height / 4), saved.name, CHARACTER_INFO_NAME_STYLE).setOrigin(0.5);
        this.add.text(centerX, this.sy(b.name.y + (b.name.height * 3) / 4), `Level ${level}`, CHARACTER_INFO_VALUE_STYLE).setOrigin(0.5);
        this.boxText(b.level, String(level));
        this.boxText(b.exp, saved.exp.toLocaleString('en-US'));
        this.boxText(b.nextExp, level >= OFF_LEVEL.max ? '—' : offExpForLevel(level + 1).toLocaleString('en-US'));
        const s = { ...saved.stats, level };
        const v = this.params.vitals;
        this.boxText(b.health, `${Math.ceil(v.hp)}/${offMaxHp(s)}`);
        this.boxText(b.mana, `${Math.ceil(v.mana)}/${offMaxMana(s)}`);
        this.boxText(b.stamina, `${Math.ceil(v.stamina)}/${offMaxStamina(s)}`);
        for (const id of OFF_STAT_IDS) this.boxText(CHARACTER_INFO_STAT_BOXES[id], String(saved.stats[id]));
    }

    /** The character dressed in what it wears now (rebuilt after every change). */
    private buildDoll(): void {
        this.doll?.destroy();
        this.doll = new PaperDoll(this, OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(this.equipment), {
            x: this.sx(0), y: this.sy(0), scale: CHARACTER_INFO_SCALE,
            standInX: this.sx(CHARACTER_INFO_DOLL.x), standInY: this.sy(CHARACTER_INFO_DOLL.y),
        });
    }

    // ---- Slots (top of the panel) ----

    private slotPosition(index: number, row: number): { x: number; y: number } {
        const s = EQUIPMENT_SLOTS;
        const count = OFF_GEAR_SLOT_IDS.length;
        const rowWidth = count * s.size + (count - 1) * s.gap;
        return {
            x: EQUIPMENT_PANEL.x + (EQUIPMENT_PANEL.width - rowWidth) / 2 + index * (s.size + s.gap),
            y: EQUIPMENT_PANEL.y + s.top + row * (s.size + s.labelHeight + s.rowGap),
        };
    }

    private createSlots(): void {
        const s = EQUIPMENT_SLOTS;
        OFF_GEAR_SLOT_IDS.forEach((slot, index) => {
            const { x, y } = this.slotPosition(index, 0);
            const box = this.add.rectangle(x, y, s.size, s.size, s.background).setOrigin(0).setStrokeStyle(2, s.border);
            const icon = this.add.image(x + s.size / 2, y + s.size / 2, '__DEFAULT').setVisible(false);
            this.slotLabel(x, y, EQUIP_SLOT_NAMES[slot]);
            box.setInteractive({ useHandCursor: true });
            box.on(Phaser.Input.Events.POINTER_UP, () => {
                if (!this.ready()) return;
                this.showSlot(slot);
                this.setFocus({ kind: 'slot' });
            });
            this.slotBoxes.set(slot, { box, icon });
        });
        // Slots still to come (the ring), greyed on a second row, centred.
        OFF_FUTURE_SLOTS.forEach((name, index) => {
            const { x, y } = this.slotPosition(index + (OFF_GEAR_SLOT_IDS.length - OFF_FUTURE_SLOTS.length) / 2, 1);
            this.add.rectangle(x, y, s.size, s.size, s.background).setOrigin(0).setStrokeStyle(2, s.border).setAlpha(s.futureAlpha);
            this.slotLabel(x, y, name).setAlpha(s.futureAlpha);
        });
        this.refreshSlotIcons();
    }

    private slotLabel(x: number, y: number, name: string): Phaser.GameObjects.Text {
        const s = EQUIPMENT_SLOTS;
        return this.add.text(x + s.size / 2, y + s.size + 1, name, { ...EQUIPMENT_LABEL_STYLE, align: 'center', wordWrap: { width: s.size + s.gap } })
            .setOrigin(0.5, 0);
    }

    private refreshSlotIcons(): void {
        for (const [slot, { icon }] of this.slotBoxes) this.setIcon(icon, this.equipment[slot], EQUIPMENT_SLOTS.iconSize);
    }

    private setIcon(image: Phaser.GameObjects.Image, id: OffItemId | undefined, size: number): void {
        const frame = id ? itemIcon(OFF_ITEMS[id].look, offSaveStore.character.look.gender) : undefined;
        if (!frame || !this.iconsReady) {
            image.setVisible(false);
            return;
        }
        image.setTexture(itemPackTexture(frame.sheet), frame.frame).setVisible(true);
        image.setScale(Math.min(1, size / Math.max(image.frame.width, image.frame.height)));
    }

    // ---- Item list ----

    private showSlot(slot: OffSlotId): void {
        this.slot = slot;
        for (const [id, { box }] of this.slotBoxes) {
            box.setStrokeStyle(2, id === slot ? EQUIPMENT_SLOTS.selectedBorder : EQUIPMENT_SLOTS.border);
        }
        // What it wears first, then the bag's gear for this slot (Off-4B).
        const worn = this.equipment[slot];
        const items: Row[] = [...(worn ? [worn] : []), ...offBagGearFor(offSaveStore.character.bag, slot).filter((id) => id !== worn)];
        this.rows = canEmptyOffSlot(slot) ? [undefined, ...items] : items;
        this.drawRows();
    }

    private drawRows(): void {
        for (const view of this.views) {
            view.background.destroy();
            view.objects.forEach((object) => object.destroy());
        }
        this.views = this.rows.map((_row, index) => this.createRow(index));
    }

    private createRow(index: number): RowView {
        const l = EQUIPMENT_LIST;
        const p = EQUIPMENT_PANEL;
        const id = this.rows[index];
        const x = p.x + p.padding;
        const y = p.y + l.top + index * l.rowHeight;
        const width = p.width - p.padding * 2;
        const background = this.add.rectangle(x, y, width, l.rowHeight - 2, l.wornColor, this.isWorn(id) ? 1 : 0).setOrigin(0);
        const middle = y + (l.rowHeight - 2) / 2;
        const icon = this.add.image(x + l.iconSize / 2 + 4, middle, '__DEFAULT');
        this.setIcon(icon, id, l.iconSize);
        const name = this.add.text(x + l.iconSize + 12, middle, id ? OFF_ITEMS[id].name : 'Nothing', EQUIPMENT_ROW_STYLE).setOrigin(0, 0.5);
        const objects: Phaser.GameObjects.GameObject[] = [icon, name];
        if (id) {
            objects.push(this.add.text(x + width - 6, middle, offNeedsText(id), {
                ...EQUIPMENT_DETAIL_STYLE, color: offWearCheck(id, this.wearer) === 'ok' ? EQUIPMENT_MET_COLOR : EQUIPMENT_UNMET_COLOR,
            }).setOrigin(1, 0.5));
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

    // ---- Stat box (Off-3C) ----

    /** The item the box describes: the marked row's, or the worn one when a slot is marked. Null: no box. */
    private boxItem(): { id: OffItemId | undefined } | null {
        if (this.focus.kind === 'row') return { id: this.rows[this.focus.index] };
        if (this.focus.kind === 'slot') {
            const worn = this.equipment[this.slot];
            return worn ? { id: worn } : null;
        }
        return null;
    }

    private drawBox(): void {
        this.boxObjects.forEach((object) => object.destroy());
        this.boxObjects = [];
        const shown = this.boxItem();
        if (!shown) return;
        const b = OFF_EQUIPMENT_BOX;
        const p = EQUIPMENT_PANEL;
        const okTop = p.y + p.height - EQUIPMENT_OK.bottom - EQUIPMENT_OK.height * EQUIPMENT_OK.scale;
        const x = p.x + p.padding;
        const y = p.y + b.top;
        const id = shown.id;
        const worn = this.equipment[this.slot];
        const title = id ? `${OFF_ITEMS[id].name}${id === worn ? '  (worn)' : ''}` : 'Nothing';
        const area = { x, y, width: p.width - p.padding * 2, height: okTop - b.bottomGap - y };
        this.boxObjects = drawOffItemBox(this, area, title, offItemBoxLines(id, id === worn ? undefined : worn, this.wearer));
    }

    // ---- Focus and actions ----

    private setFocus(focus: Focus): void {
        this.focus = focus;
        this.okButton.setFrame(EQUIPMENT_OK.frame + (focus.kind === 'ok' ? EQUIPMENT_OK.litOffset : 0));
        if (focus.kind === 'slot') {
            const box = this.slotBoxes.get(this.slot)?.box;
            if (box) this.focusFrame.setPosition(box.x - 3, box.y - 3).setSize(box.width + 6, box.height + 6).setVisible(true);
        } else if (focus.kind === 'row') {
            const view = this.views.find((v) => v.index === focus.index);
            if (view) this.focusFrame.setPosition(view.background.x - 1, view.background.y - 1).setSize(view.background.width + 2, view.background.height + 2).setVisible(true);
            else this.focusFrame.setVisible(false);
        } else {
            this.focusFrame.setVisible(false);
        }
        this.helpText.setText(this.describeFocus());
        this.drawBox();
    }

    private describeFocus(): string {
        if (this.focus.kind === 'ok') return 'Your equipment is saved as you change it.';
        if (this.focus.kind === 'slot') {
            const worn = this.equipment[this.slot];
            const more = this.rows.some((id) => id !== undefined && id !== worn) ? '' : ' Nothing else in your bag for it.';
            return `${EQUIP_SLOT_NAMES[this.slot]}: ${worn ? OFF_ITEMS[worn].name : 'nothing'}.${more}`;
        }
        const id = this.rows[this.focus.index];
        if (!id) return 'Take off what you wear in this slot.';
        if (this.isWorn(id)) return 'You wear it.';
        const check = offWearCheck(id, this.wearer);
        if (check === 'level') return `Needs Level ${offItem(id).levelToEquip ?? 0}.`;
        return check === 'ok' ? 'Enter or A puts it on.' : `Needs Str ${OFF_ITEMS[id].strToEquip}. Assign points in the Character window (C).`;
    }

    private moveSideways(dx: number): void {
        if (this.focus.kind !== 'slot') return;
        const index = OFF_GEAR_SLOT_IDS.indexOf(this.slot);
        const count = OFF_GEAR_SLOT_IDS.length;
        this.showSlot(OFF_GEAR_SLOT_IDS[(index + dx + count) % count] ?? this.slot);
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

    /** Row of the item worn now ("Nothing" when the slot is empty). */
    private wornRow(): number {
        return Math.max(0, this.rows.findIndex((id) => this.isWorn(id)));
    }

    private isWorn(id: OffItemId | undefined): boolean {
        return this.equipment[this.slot] === id;
    }

    private press(): void {
        if (this.focus.kind === 'slot') this.moveVertically(1);
        else if (this.focus.kind === 'row') this.wear(this.focus.index);
        else this.close();
    }

    /** Puts on the item of that row (or empties the slot); refused, with the reason, if the STR is short. */
    public wear(index: number): boolean {
        if (index < 0 || index >= this.rows.length) return false;
        const id = this.rows[index];
        if (this.isWorn(id)) return false;
        const result = offSaveStore.equip(this.slot, id);
        if (result !== 'ok') {
            this.helpText.setText(result === 'bagFull' ? OFF_LOOT_TEXT.bagFull : this.describeFocus());
            return false;
        }
        this.buildDoll();
        this.refreshSlotIcons();
        this.showSlot(this.slot);
        // The rows move (what is worn goes first): the mark follows the item just put on.
        this.setFocus({ kind: 'row', index: this.wornRow() });
        return true;
    }

    /** Development (`check offequipswap`): marks a slot, and a row of it (the stat box shows). */
    public debugMark(slot: OffSlotId, index?: number): void {
        this.showSlot(slot);
        this.setFocus(index === undefined ? { kind: 'slot' } : { kind: 'row', index });
    }

    /** Development: the rows of the marked slot and the stat box's text. */
    public debugState(): { slot: OffSlotId; rows: Array<string | undefined>; box: string[] } {
        const box = this.boxObjects.filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text).map((t) => t.text);
        return { slot: this.slot, rows: [...this.rows], box };
    }

    public close(): void {
        this.scene.stop();
        this.params.onClose();
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}
