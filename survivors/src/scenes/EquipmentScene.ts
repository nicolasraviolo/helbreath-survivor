// Pantalla Equipment (Fase 20B; medidas en config/equipment.ts). Se abre desde Select Character (botón "Equipment",
// tecla I o X del mando) con el personaje marcado:
// - Izquierda: la ventana Character original con el muñeco vestido con su equipo, su Level y sus stats permanentes.
// - Derecha: los huecos (arma, escudo, casco, armadura, pantalones, botas y capa; debajo, apagados, los que llegarán:
//   hechizos, anillo, collar, ángel, Zem y Abaddon's Blood) y la lista de objetos del hueco elegido (data/items.ts).
//   Cada objeto enseña su requisito; en rojo lo que el personaje no cumple, y entonces no se puede poner.
// - Ponerse o quitarse algo se guarda al momento (characterStore.equip). Ok, Esc o B cierran.
// Teclado y mando: izquierda/derecha eligen hueco, abajo entra en la lista, Enter / A se pone el objeto marcado.
import Phaser from 'phaser';
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
    EQUIPMENT_PANEL,
    EQUIPMENT_ROW_STYLE,
    EQUIPMENT_SLOTS,
    EQUIPMENT_TITLE_STYLE,
    EQUIPMENT_UNMET_COLOR,
    itemPackTexture,
} from '../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { ARMOR_PIECES } from '../data/armor';
import { totalExpForLevel, CHARACTER_LEVEL_MAX } from '../data/characterLevel';
import { CHARACTERS } from '../data/characters';
import {
    canChangeSlot,
    canEmptySlot,
    catalog,
    EQUIP_SLOT_IDS,
    EQUIP_SLOT_NAMES,
    FUTURE_SLOT_NAMES,
    isMeleeWeaponId,
    itemIcon,
    itemInfo,
    requirementChecks,
    type EquipSlotId,
    type ItemId,
} from '../data/items';
import { STAT_IDS } from '../data/stats';
import { getMeleeWeapon } from '../data/weapons';
import { CharacterSprite } from '../entities/CharacterSprite';
import { CharacterStats } from '../entities/CharacterStats';
import { Direction } from '../hb/directions';
import { PlayerState } from '../hb/playerAppearance';
import { characterStore, permanentStats, type SavedCharacter } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { lookLoader } from '../systems/LookLoader';
import type { MenuOverlayData } from './MenuOverlayScene';

export interface EquipmentSceneData {
    characterUid: string;
}

/** A row of the list: an item, or undefined for "Nothing" (empty the slot). */
interface Row {
    id: ItemId | undefined;
    background: Phaser.GameObjects.Rectangle;
    objects: Phaser.GameObjects.GameObject[];
}

type Focus = { kind: 'slot' } | { kind: 'row'; index: number } | { kind: 'ok' };

export class EquipmentScene extends Phaser.Scene {
    private uid = '';
    private returnTo = '';
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private slot: EquipSlotId = 'weapon';
    private focus: Focus = { kind: 'slot' };
    private slotBoxes = new Map<EquipSlotId, { box: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image }>();
    private rows: Row[] = [];
    private doll: CharacterSprite | undefined;
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
            ...CHARACTER_INFO_HELP_STYLE, wordWrap: { width: GAME_WIDTH - 24 },
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
        const start = new CharacterStats(def, stats);
        this.boxText(b.health, String(start.maxHp));
        this.boxText(b.mana, String(start.maxMana));
        for (const id of STAT_IDS) this.boxText(CHARACTER_INFO_STAT_BOXES[id], String(stats[id]));
    }

    /** The character dressed in what it wears now (rebuilt after every change). */
    private buildDoll(): void {
        const character = this.character;
        if (!character) return;
        this.doll?.destroy();
        this.doll = new CharacterSprite(this, CHARACTERS[character.classId], character.look, this.sx(CHARACTER_INFO_DOLL.x), this.sy(CHARACTER_INFO_DOLL.y));
        this.doll.container.setScale(CHARACTER_INFO_SCALE);
        this.doll.wearEquipment(character.equipment);
        this.doll.setPose(PlayerState.IdleCombat, Direction.South);
    }

    // ---- Slots (top of the panel) ----

    private slotPosition(index: number, row: number): { x: number; y: number } {
        const s = EQUIPMENT_SLOTS;
        const count = EQUIP_SLOT_IDS.length;
        const rowWidth = count * s.size + (count - 1) * s.gap;
        return {
            x: EQUIPMENT_PANEL.x + (EQUIPMENT_PANEL.width - rowWidth) / 2 + index * (s.size + s.gap),
            y: EQUIPMENT_PANEL.y + s.top + row * (s.size + s.labelHeight + s.rowGap),
        };
    }

    private createSlots(): void {
        const s = EQUIPMENT_SLOTS;
        const character = this.character;
        EQUIP_SLOT_IDS.forEach((slot, i) => {
            const { x, y } = this.slotPosition(i, 0);
            const box = this.add.rectangle(x, y, s.size, s.size, s.background).setOrigin(0).setStrokeStyle(2, s.border);
            const icon = this.add.image(x + s.size / 2, y + s.size / 2, '__DEFAULT').setVisible(false);
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
            this.slotBoxes.set(slot, { box, icon });
        });
        FUTURE_SLOT_NAMES.forEach((name, i) => {
            const { x, y } = this.slotPosition(i, 1);
            this.add.rectangle(x, y, s.size, s.size, s.background).setOrigin(0).setStrokeStyle(2, s.border).setAlpha(s.futureAlpha);
            this.slotLabel(x, y, name).setAlpha(s.futureAlpha);
        });
        this.refreshSlotIcons();
    }

    /** Name under a slot box; long ones ("Abaddon's Blood") take two lines. */
    private slotLabel(x: number, y: number, name: string): Phaser.GameObjects.Text {
        const s = EQUIPMENT_SLOTS;
        return this.add.text(x + s.size / 2, y + s.size + 1, name, { ...EQUIPMENT_LABEL_STYLE, align: 'center', wordWrap: { width: s.size + s.gap } })
            .setOrigin(0.5, 0);
    }

    private refreshSlotIcons(): void {
        const character = this.character;
        if (!character) return;
        for (const [slot, { icon }] of this.slotBoxes) {
            const id = character.equipment[slot];
            this.setIcon(icon, id, EQUIPMENT_SLOTS.iconSize);
        }
    }

    /** Shows an item's picture fitted inside `size` (hidden while item-pack.spr is downloading, or without an item). */
    private setIcon(image: Phaser.GameObjects.Image, id: ItemId | undefined, size: number): void {
        const character = this.character;
        const frame = id && character ? itemIcon(id, character.look.gender) : undefined;
        const texture = frame ? itemPackTexture(frame.sheet) : '';
        if (!frame || !this.iconsReady || !this.textures.exists(texture)) {
            image.setVisible(false);
            return;
        }
        image.setTexture(texture, frame.frame).setVisible(true);
        image.setScale(Math.min(1, size / Math.max(image.frame.width, image.frame.height)));
    }

    // ---- Item list (rest of the panel) ----

    /** Chooses a slot: its box is outlined and the list shows what can go in it. */
    private showSlot(slot: EquipSlotId): void {
        this.slot = slot;
        for (const [id, { box }] of this.slotBoxes) {
            box.setStrokeStyle(2, id === slot ? EQUIPMENT_SLOTS.selectedBorder : EQUIPMENT_SLOTS.border);
        }
        for (const row of this.rows) {
            row.background.destroy();
            row.objects.forEach((object) => object.destroy());
        }
        const character = this.character;
        if (!character) return;
        const ids: Array<ItemId | undefined> = catalog(character.classId, slot);
        if (ids.length > 0 && canEmptySlot(slot)) ids.unshift(undefined);
        this.rows = ids.map((id, index) => this.createRow(character, id, index));
    }

    private createRow(character: Readonly<SavedCharacter>, id: ItemId | undefined, index: number): Row {
        const l = EQUIPMENT_LIST;
        const p = EQUIPMENT_PANEL;
        const x = p.x + p.padding;
        const y = p.y + l.top + index * l.rowHeight;
        const width = p.width - p.padding * 2;
        const worn = character.equipment[this.slot] === id;
        const background = this.add.rectangle(x, y, width, l.rowHeight - 2, l.wornColor, worn ? 1 : 0).setOrigin(0);
        const objects: Phaser.GameObjects.GameObject[] = [];
        const middle = y + (l.rowHeight - 2) / 2;
        const icon = this.add.image(x + l.iconSize / 2 + 4, middle, '__DEFAULT');
        this.setIcon(icon, id, l.iconSize);
        objects.push(icon);
        const name = id ? (itemInfo(id)?.name ?? id) : 'Nothing';
        objects.push(this.add.text(x + l.iconSize + 12, middle, name, EQUIPMENT_ROW_STYLE).setOrigin(0, 0.5));
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
        return { id, background, objects };
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
            const row = this.rows[focus.index];
            if (row) this.focusFrame.setPosition(row.background.x - 1, row.background.y - 1).setSize(row.background.width + 2, row.background.height + 2).setVisible(true);
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
            if (!canChangeSlot(character.classId, this.slot)) return 'The Mage fights with spells: the wand stays in hand.';
            const id = character.equipment[this.slot];
            return `${EQUIP_SLOT_NAMES[this.slot]}: ${id ? (itemInfo(id)?.name ?? id) : 'nothing'}.`;
        }
        const id = this.rows[this.focus.index]?.id;
        if (!id) return `Take off what you wear in this slot.`;
        const info = itemInfo(id);
        const unmet = requirementChecks(id, permanentStats(character), character.level).filter((check) => !check.met);
        const needs = unmet.length > 0 ? ` Needs ${unmet.map((check) => check.label).join(', ')}.` : '';
        return `${info?.name ?? id}: ${describeItem(id)}.${needs}`;
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
        const worn = this.character?.equipment[this.slot];
        return Math.max(0, this.rows.findIndex((row) => row.id === worn));
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
        if (!characterStore.equip(this.uid, this.slot, row.id)) {
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

/** What an item gives, in a few words ("Damage 35", "Defense 14%, Magic resistance 8"). */
function describeItem(id: ItemId): string {
    if (isMeleeWeaponId(id)) return `Damage ${getMeleeWeapon(id).damage}`;
    const piece = ARMOR_PIECES[id];
    const parts = [`Defense ${Math.round(piece.defense * 100)}%`];
    if ('magicResistance' in piece) parts.push(`Magic resistance ${piece.magicResistance}`);
    if ('magicDamageBonus' in piece) parts.push(`Magic damage +${Math.round(piece.magicDamageBonus * 100)}%`);
    return parts.join(', ');
}
