// Helbreath Off (Fase Off-6A): el libro de magias. Se abre con B (y se cierra con B, Esc o el botón Close). Como las
// demás ventanas de Off, el mundo sigue debajo (propietario, 7-nov-2026: solo Esc o Start pausan) pero el personaje no
// recibe órdenes mientras está abierto.
// - A la izquierda, las magias que sabes, por círculos, con su maná y la tecla que las lanza.
// - A la derecha, el cuadro de la magia marcada (off/ui/offItemBox.ts, el mismo de la tienda) y las ocho teclas 1–8
//   (desde la Off-6C en dos columnas, 1–4 y 5–8, para que quepan los huecos del mando).
// - Para poner la magia marcada en una tecla: pulsar esa tecla (1–8) o hacer clic en su fila. Si ya estaba en otra
//   tecla, se mueve. Supr (o un clic en la tecla que ya la tiene) la quita. Al aprender una magia en la tienda va sola a
//   la primera tecla libre (OffSaveStore.learnSpell).
// - Fase Off-6C: debajo de las teclas, los 4 huecos del mando (RT + A/B/X/Y, en dos filas de dos). Con el mando se pone
//   la magia marcada manteniendo RT y pulsando el botón (otra vez, la quita); con el ratón, clic en el hueco. Una magia
//   puede estar a la vez en una tecla y en un botón del mando.
import Phaser from 'phaser';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../../config/characterInfo';
import { GAME_WIDTH } from '../../config/gameConfig';
import { Action, InputSystem, OFF_PAD_SPELL_ACTIONS, OFF_SPELL_KEY_ACTIONS } from '../../systems/InputSystem';
import { playAreaBottom } from '../../ui/hudLayout';
import { OFF_SPELL_BOOK_KEYS, OFF_SPELL_BOOK_PANEL } from '../config/offSpellBook';
import {
    OFF_STORE_BUTTON_STYLE, OFF_STORE_HEADER_STYLE, OFF_STORE_LIST, OFF_STORE_MESSAGE_STYLE, OFF_STORE_PANEL, OFF_STORE_ROW_STYLE,
    OFF_STORE_SIDE, OFF_STORE_SMALL_STYLE, OFF_STORE_TITLE_STYLE,
} from '../config/offStore';
import { OFF_PAD_SPELL_COUNT, OFF_SPELL_IDS, OFF_SPELL_KEY_COUNT, OFF_SPELLS, offCircleTitle, offPadSpellName, offSpellKeyName, type OffSpellId } from '../data/offSpells';
import { offManaCost } from '../data/offItems';
import { offSaveStore } from '../systems/OffSaveStore';
import { drawOffItemBox, offSpellBoxLines } from '../ui/offItemBox';

export const OFF_SPELL_BOOK_SCENE_KEY = 'OffSpellBook';

export interface OffSpellBookSceneData {
    onClose: () => void;
}

export const OFF_SPELL_BOOK_TEXT = {
    title: 'Spell Book',
    spellHeader: 'SPELL',
    manaHeader: 'MANA',
    keysHeader: 'KEYS',
    closeButton: 'Close',
    empty: "You don't know any spells yet. Learn them in the Magic tab of your city's shop.",
    noKey: '—',
    padHeader: 'GAMEPAD',
    onKey: (name: string, key: string) => `${name} is on ${key}.`,
    offKey: (name: string) => `${name} is on no key now.`,
    offPad: (name: string, button: string) => `${name} is off ${button}.`,
    helpMouse: 'Click: mark · 1–8 or click a key: put it there · Delete: take it off · B / Esc: close',
    helpPad: 'Up / down: choose · RT + A/B/X/Y: put it there · B: close',
} as const;

type Row = { kind: 'section'; title: string } | { kind: 'spell'; id: OffSpellId };

export class OffSpellBookScene extends Phaser.Scene {
    private params!: OffSpellBookSceneData;
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private rows: Row[] = [];
    private marked = -1;
    private scroll = 0;
    private visibleRows = 0;
    private listArea = { x: 0, y: 0, width: 0, height: 0 };
    private boxArea = { x: 0, y: 0, width: 0, height: 0 };
    private keysTop = 0;
    private padTop = 0;
    private listObjects: Phaser.GameObjects.GameObject[] = [];
    private sideObjects: Phaser.GameObjects.GameObject[] = [];
    private messageText!: Phaser.GameObjects.Text;
    private helpText!: Phaser.GameObjects.Text;

    constructor() {
        super(OFF_SPELL_BOOK_SCENE_KEY);
    }

    init(data: OffSpellBookSceneData): void {
        this.params = data;
        this.marked = -1;
        this.scroll = 0;
        this.listObjects = [];
        this.sideObjects = [];
    }

    create(): void {
        this.openedAt = this.time.now;
        const p = OFF_STORE_PANEL;
        const l = OFF_STORE_LIST;
        const side = OFF_STORE_SIDE;
        const k = OFF_SPELL_BOOK_KEYS;
        const width = OFF_SPELL_BOOK_PANEL.width;
        const x = Math.round((GAME_WIDTH - width) / 2);
        const y = p.top;
        const height = playAreaBottom() - p.bottomGap - y;
        this.add.rectangle(x, y, width, height, p.background, p.alpha).setOrigin(0).setStrokeStyle(2, p.border).setInteractive();
        this.add.text(x + width / 2, y + p.padding, OFF_SPELL_BOOK_TEXT.title, OFF_STORE_TITLE_STYLE).setOrigin(0.5, 0);

        // The list of spells.
        const left = x + p.padding;
        const listWidth = OFF_SPELL_BOOK_PANEL.listWidth;
        const headerY = y + p.titleHeight + p.padding;
        this.add.text(left + 12, headerY, OFF_SPELL_BOOK_TEXT.spellHeader, OFF_STORE_HEADER_STYLE);
        this.add.text(left + listWidth - 8, headerY, OFF_SPELL_BOOK_TEXT.manaHeader, OFF_STORE_HEADER_STYLE).setOrigin(1, 0);
        const listY = headerY + l.headerHeight;
        this.visibleRows = Math.max(1, Math.floor((y + height - p.padding - listY) / l.rowHeight));
        this.listArea = { x: left, y: listY, width: listWidth, height: this.visibleRows * l.rowHeight };
        this.add.rectangle(left, listY, listWidth, this.listArea.height, l.background).setOrigin(0).setStrokeStyle(1, l.border);

        // Right-hand column: the spell's box, the keys, a message, Close and the help.
        const sideX = left + listWidth + p.columnGap;
        const sideWidth = x + width - p.padding - sideX;
        this.boxArea = { x: sideX, y: headerY, width: sideWidth, height: side.boxHeight };
        const keysHeaderY = headerY + side.boxHeight + side.gap;
        this.add.text(sideX, keysHeaderY, OFF_SPELL_BOOK_TEXT.keysHeader, OFF_STORE_HEADER_STYLE);
        this.keysTop = keysHeaderY + l.headerHeight;
        const keyRows = Math.ceil(OFF_SPELL_KEY_COUNT / 2);
        this.add.rectangle(sideX, this.keysTop, sideWidth, keyRows * k.rowHeight, k.background).setOrigin(0).setStrokeStyle(1, k.border);
        const padHeaderY = this.keysTop + keyRows * k.rowHeight + side.gap;
        this.add.text(sideX, padHeaderY, OFF_SPELL_BOOK_TEXT.padHeader, OFF_STORE_HEADER_STYLE);
        this.padTop = padHeaderY + l.headerHeight;
        const padRows = Math.ceil(OFF_PAD_SPELL_COUNT / 2);
        this.add.rectangle(sideX, this.padTop, sideWidth, padRows * k.rowHeight, k.background).setOrigin(0).setStrokeStyle(1, k.border);
        const messageY = this.padTop + padRows * k.rowHeight + side.gap;
        this.messageText = this.add.text(sideX, messageY, '', { ...OFF_STORE_MESSAGE_STYLE, wordWrap: { width: sideWidth } });
        const buttonY = messageY + side.goldHeight + side.gap;
        const buttonWidth = (sideWidth - side.gap) / 2;
        const close = this.add.rectangle(sideX, buttonY, buttonWidth, side.buttonHeight, side.buttonBackground).setOrigin(0).setStrokeStyle(1, side.buttonBorder);
        this.add.text(sideX + buttonWidth / 2, buttonY + side.buttonHeight / 2, OFF_SPELL_BOOK_TEXT.closeButton, OFF_STORE_BUTTON_STYLE).setOrigin(0.5);
        close.setInteractive({ useHandCursor: true });
        close.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.close();
        });
        this.helpText = this.add.text(sideX + buttonWidth + side.gap, buttonY, '', { ...OFF_STORE_SMALL_STYLE, wordWrap: { width: buttonWidth } });

        this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
            this.scrollBy(Math.sign(dy) * l.wheelRows);
        });
        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
        this.inputSystem.setStickMenus(true);
        this.rows = buildRows();
        this.marked = this.rows.findIndex((r) => r.kind === 'spell');
        if (this.marked < 0) this.messageText.setText(OFF_SPELL_BOOK_TEXT.empty);
        this.redraw();
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        const help = input.getLastDevice() === 'gamepad' ? OFF_SPELL_BOOK_TEXT.helpPad : OFF_SPELL_BOOK_TEXT.helpMouse;
        if (this.helpText.text !== help) this.helpText.setText(help);
        if (!this.ready()) return;
        // RT held: A/B/X/Y put the marked spell on that gamepad button (B does not close then).
        const trigger = input.isHeld(Action.OffCastTrigger);
        if ((!trigger && input.justPressed(Action.Back)) || input.justPressed(Action.Pause) || input.justPressed(Action.OffSpellBook)) {
            this.close();
            return;
        }
        if (trigger) {
            OFF_PAD_SPELL_ACTIONS.forEach((action, index) => {
                if (input.justPressed(action)) this.togglePad(index);
            });
            return;
        }
        if (input.justPressed(Action.MenuUp)) this.moveMark(-1);
        if (input.justPressed(Action.MenuDown)) this.moveMark(1);
        OFF_SPELL_KEY_ACTIONS.forEach((action, index) => {
            if (input.justPressed(action)) this.putOnKey(index);
        });
        if (input.justPressed(Action.OffDrop)) this.takeOffKey();
    }

    // ---- Drawing ----

    private redraw(): void {
        this.keepMarkVisible();
        this.drawList();
        this.drawSide();
    }

    private drawList(): void {
        this.listObjects.forEach((o) => o.destroy());
        this.listObjects = [];
        const l = OFF_STORE_LIST;
        const a = this.listArea;
        const keys = offSaveStore.character.spellKeys;
        const end = Math.min(this.rows.length, this.scroll + this.visibleRows);
        for (let index = this.scroll; index < end; index++) {
            const row = this.rows[index];
            if (!row) continue;
            const top = a.y + (index - this.scroll) * l.rowHeight;
            const middle = top + l.rowHeight / 2;
            if (row.kind === 'section') {
                this.listObjects.push(this.add.text(a.x + a.width / 2, middle, row.title, { ...OFF_STORE_HEADER_STYLE, color: l.sectionColor }).setOrigin(0.5));
                continue;
            }
            const background = this.add.rectangle(a.x + 1, top + 1, a.width - 2, l.rowHeight - 2, l.focusFill, index === this.marked ? 1 : 0).setOrigin(0);
            background.setInteractive({ useHandCursor: true });
            background.on(Phaser.Input.Events.POINTER_UP, () => {
                if (this.ready()) this.mark(index);
            });
            const spell = OFF_SPELLS[row.id];
            const mana = this.add.text(a.x + a.width - 8, middle, `${offManaCost(spell.mana, offSaveStore.character.equipment)}`, OFF_STORE_ROW_STYLE).setOrigin(1, 0.5);
            const key = keys.indexOf(row.id);
            this.listObjects.push(
                background,
                this.add.text(a.x + 12, middle, spell.name, OFF_STORE_ROW_STYLE).setOrigin(0, 0.5),
                mana,
                this.add.text(mana.x - 44, middle, key >= 0 ? offSpellKeyName(key) : '', { ...OFF_STORE_SMALL_STYLE, color: l.sectionColor }).setOrigin(1, 0.5),
            );
        }
    }

    private drawSide(): void {
        this.sideObjects.forEach((o) => o.destroy());
        this.sideObjects = [];
        const id = this.markedSpell;
        if (id !== undefined) this.sideObjects = drawOffItemBox(this, this.boxArea, OFF_SPELLS[id].name, offSpellBoxLines(id, offSaveStore.character.stats.int, offSaveStore.character.equipment));
        const k = OFF_SPELL_BOOK_KEYS;
        const x = this.boxArea.x;
        const width = this.boxArea.width;
        // Two columns: 1–4 on the left, 5–8 on the right.
        const cellWidth = width / 2;
        const keyRows = Math.ceil(OFF_SPELL_KEY_COUNT / 2);
        offSaveStore.character.spellKeys.forEach((spell, index) => {
            const cellX = x + Math.floor(index / keyRows) * cellWidth;
            const top = this.keysTop + (index % keyRows) * k.rowHeight;
            const middle = top + k.rowHeight / 2;
            const background = this.add.rectangle(cellX + 1, top + 1, cellWidth - 2, k.rowHeight - 2, k.markedFill, spell !== undefined && spell === id ? 1 : 0).setOrigin(0);
            background.setInteractive({ useHandCursor: true });
            background.on(Phaser.Input.Events.POINTER_UP, () => {
                if (!this.ready()) return;
                if (spell !== undefined && spell === this.markedSpell) this.takeOffKey();
                else this.putOnKey(index);
            });
            this.sideObjects.push(
                background,
                this.add.text(cellX + 8, middle, offSpellKeyName(index), { ...OFF_STORE_HEADER_STYLE, color: OFF_STORE_LIST.sectionColor }).setOrigin(0, 0.5),
                this.add.text(cellX + 8 + k.labelWidth, middle, spell ? OFF_SPELLS[spell].name : OFF_SPELL_BOOK_TEXT.noKey, {
                    ...OFF_STORE_SMALL_STYLE, ...(spell ? {} : { color: k.emptyColor }),
                    fixedWidth: cellWidth - 12 - k.labelWidth,
                }).setOrigin(0, 0.5),
            );
        });
        // The gamepad's four, in two rows of two (RT + A | RT + B, RT + X | RT + Y).
        offSaveStore.character.padSpells.forEach((spell, index) => {
            const cellX = x + (index % 2) * cellWidth;
            const top = this.padTop + Math.floor(index / 2) * k.rowHeight;
            const middle = top + k.rowHeight / 2;
            const background = this.add.rectangle(cellX + 1, top + 1, cellWidth - 2, k.rowHeight - 2, k.markedFill, spell !== undefined && spell === id ? 1 : 0).setOrigin(0);
            background.setInteractive({ useHandCursor: true });
            background.on(Phaser.Input.Events.POINTER_UP, () => {
                if (this.ready()) this.togglePad(index);
            });
            this.sideObjects.push(
                background,
                this.add.text(cellX + 6, middle, offPadSpellName(index), { ...OFF_STORE_SMALL_STYLE, color: OFF_STORE_LIST.sectionColor }).setOrigin(0, 0.5),
                this.add.text(cellX + 6 + k.padLabelWidth, middle, spell ? OFF_SPELLS[spell].name : OFF_SPELL_BOOK_TEXT.noKey, {
                    ...OFF_STORE_SMALL_STYLE, ...(spell ? {} : { color: k.emptyColor }),
                    fixedWidth: cellWidth - 10 - k.padLabelWidth,
                }).setOrigin(0, 0.5),
            );
        });
    }

    private get markedSpell(): OffSpellId | undefined {
        const row = this.rows[this.marked];
        return row?.kind === 'spell' ? row.id : undefined;
    }

    // ---- Moving ----

    /** Development and clicks: marks that row (sections are skipped). */
    public mark(index: number): void {
        if (this.rows[index]?.kind !== 'spell') return;
        this.marked = index;
        this.redraw();
    }

    private moveMark(step: number): void {
        let index = this.marked;
        do index += step;
        while (index >= 0 && index < this.rows.length && this.rows[index]?.kind !== 'spell');
        if (index >= 0 && index < this.rows.length) this.mark(index);
        else this.scrollBy(step);
    }

    private scrollBy(rows: number): void {
        const max = Math.max(0, this.rows.length - this.visibleRows);
        const next = Phaser.Math.Clamp(this.scroll + rows, 0, max);
        if (next === this.scroll) return;
        this.scroll = next;
        this.drawList();
    }

    private keepMarkVisible(): void {
        if (this.marked < 0) return;
        const first = this.rows[this.marked - 1]?.kind === 'section' ? this.marked - 1 : this.marked;
        if (first < this.scroll) this.scroll = first;
        else if (this.marked >= this.scroll + this.visibleRows) this.scroll = this.marked - this.visibleRows + 1;
    }

    // ---- Keys ----

    /** The marked spell on key index + 1 (1–8 or a click on that key). */
    public putOnKey(index: number): void {
        const id = this.markedSpell;
        if (id === undefined) return;
        offSaveStore.setSpellKey(index, id);
        this.messageText.setText(OFF_SPELL_BOOK_TEXT.onKey(OFF_SPELLS[id].name, offSpellKeyName(index)));
        this.redraw();
    }

    /** The marked spell on that gamepad button, or off it when it already holds it (Off-6C). */
    public togglePad(index: number): void {
        const id = this.markedSpell;
        if (id === undefined) return;
        const button = offPadSpellName(index);
        if (offSaveStore.character.padSpells[index] === id) {
            offSaveStore.setPadSpell(index, undefined);
            this.messageText.setText(OFF_SPELL_BOOK_TEXT.offPad(OFF_SPELLS[id].name, button));
        } else {
            offSaveStore.setPadSpell(index, id);
            this.messageText.setText(OFF_SPELL_BOOK_TEXT.onKey(OFF_SPELLS[id].name, button));
        }
        this.redraw();
    }

    /** Takes the marked spell off its key (Delete, or a click on the key that holds it). */
    public takeOffKey(): void {
        const id = this.markedSpell;
        const index = id === undefined ? -1 : offSaveStore.character.spellKeys.indexOf(id);
        if (id === undefined || index < 0) return;
        offSaveStore.setSpellKey(index, undefined);
        this.messageText.setText(OFF_SPELL_BOOK_TEXT.offKey(OFF_SPELLS[id].name));
        this.redraw();
    }

    /** Development: what the book shows. */
    public debugState(): { rows: string[]; marked: string | undefined; keys: string[]; pad: string[]; message: string; box: string[] } {
        const box = this.sideObjects.filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text).map((t) => t.text);
        return {
            rows: this.rows.map((r) => (r.kind === 'section' ? `[${r.title}]` : r.id)),
            marked: this.markedSpell,
            keys: offSaveStore.character.spellKeys.map((k, i) => `${offSpellKeyName(i)}: ${k ?? '-'}`),
            pad: offSaveStore.character.padSpells.map((k, i) => `${offPadSpellName(i)}: ${k ?? '-'}`),
            message: this.messageText.text,
            box,
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

/** The spells known, by circle (a title before each circle). */
function buildRows(): Row[] {
    const rows: Row[] = [];
    let circle = 0;
    for (const id of OFF_SPELL_IDS) {
        if (!offSaveStore.knowsSpell(id)) continue;
        const spell = OFF_SPELLS[id];
        if (spell.circle !== circle) {
            circle = spell.circle;
            rows.push({ kind: 'section', title: offCircleTitle(circle) });
        }
        rows.push({ kind: 'spell', id });
    }
    return rows;
}
