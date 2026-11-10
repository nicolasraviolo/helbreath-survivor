// Helbreath Off, Fase Off-12C: la pestaña Magic de la ventana del personaje (sustituye al libro de magias de la
// Off-6A). Medidas en off/config/offBag.ts (OFF_MAGIC_PAGE), textos en off/data/offBag.ts (OFF_MAGIC_TEXT).
// - Izquierda: las magias que sabes por círculos, con su tecla y su maná (con la varita, el que gasta de verdad).
// - Derecha: la ficha de la magia marcada (maná, daño o efecto, elemento, Int que pide y la probabilidad de que salga
//   con tu MAG, INT y nivel).
// - Abajo: las teclas 1–8 en dos columnas. **1–4 son también RT + A/B/X/Y** (Off-12C: el mando ya no tiene huecos
//   aparte), y lo dicen con el circulito del botón.
// - Poner una magia en una tecla: marcarla y pulsar 1–8, o RT + A/B/X/Y, o A sobre la tecla, o clic en la tecla. Si
//   ya estaba en otra tecla, se mueve. Quitarla: Supr / Y, o A o clic en la tecla que ya la tiene.
// - Teclado y mando: ↑ ↓ por la lista (se desplaza sola; desde arriba sube a las pestañas); A sobre una magia baja a
//   su tecla (o a la 1); desde la última magia ↓ baja a las teclas; en las teclas ↑ ↓ ← →, y ↑ desde arriba vuelve a
//   la lista. Rueda del ratón: desplaza la lista.
import Phaser from 'phaser';
import { OFF_BAG_WINDOW, OFF_MAGIC_PAGE } from '../config/offBag';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE, type OffPadButton } from '../config/offTheme';
import { OFF_MAGIC_TEXT } from '../data/offBag';
import {
    OFF_PAD_SPELL_COUNT, OFF_SPELL_IDS, OFF_SPELL_KEY_COUNT, OFF_SPELLS, offPadSpellName, offSpellKeyName, type OffSpellId,
} from '../data/offSpells';
import type { OffBattle } from '../systems/OffBattle';
import { offSaveStore } from '../systems/OffSaveStore';
import { offCastChance } from '../systems/OffSpellRules';
import { Action, OFF_PAD_SPELL_ACTIONS, OFF_SPELL_KEY_ACTIONS, type InputSystem } from '../../systems/InputSystem';
import { offSpellBoxLines } from './offItemBox';
import {
    offDivider, offFitText, offFrame, offKeyRow, offLabel, offListRow, offStatRow, offText,
    type OffKeyRow, type OffListRow, type OffStatRow,
} from './offUi';
import type { OffWindowPage } from './offWindowPage';

const S = OFF_THEME_SIZE;
const C = OFF_THEME_COLOR;
const INK = OFF_THEME_INK;
const W = OFF_BAG_WINDOW;
const P = OFF_MAGIC_PAGE;
const PAD_BUTTONS: readonly OffPadButton[] = ['A', 'B', 'X', 'Y'];
const KEYS_PER_COLUMN = OFF_SPELL_KEY_COUNT / 2;

type Row = { kind: 'section'; circle: number } | { kind: 'spell'; id: OffSpellId };
type Focus = { kind: 'spell'; row: number } | { kind: 'key'; i: number };

export class OffMagicPage implements OffWindowPage {
    private readonly rows: Row[];
    private readonly keyRows: OffKeyRow[] = [];
    private listObjects: { destroy(): void }[] = [];
    private listRows = new Map<number, OffListRow>();
    private cardRows: OffStatRow[] = [];
    private readonly cardName: Phaser.GameObjects.Text;
    private readonly cardCircle: Phaser.GameObjects.Text;
    private readonly list = { x: 0, y: 0, w: 0, visible: 0 };
    private readonly card = { x: 0, y: 0, w: 0 };
    private scroll = 0;
    /** The row of the spell shown in the card (stays while the focus is on the keys). */
    private marked: number;
    private focus: Focus | undefined;
    private drawnKeys: readonly (OffSpellId | undefined)[] | undefined;
    private cardTexts: string[] = [];

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly battle: OffBattle,
        private readonly say: (line: string) => void,
    ) {
        this.rows = buildRows();
        this.marked = this.rows.findIndex((r) => r.kind === 'spell');
        const top = W.top;
        const right = W.x + W.w - W.pad;
        const keysH = S.padding * 2 + P.labelGap + KEYS_PER_COLUMN * S.keyRowHeight + (KEYS_PER_COLUMN - 1) * S.keyRowGap;
        const keysY = W.bottom - keysH;
        const upperH = keysY - P.keysGap - top;

        // The list.
        offFrame(scene, P.x, top, P.listW, upperH);
        const inX = P.x + S.padding;
        const inW = P.listW - S.padding * 2;
        offLabel(scene, inX, top + S.padding, OFF_MAGIC_TEXT.spellsLabel);
        offLabel(scene, inX + inW - S.listRowPadding, top + S.padding, OFF_MAGIC_TEXT.manaLabel).setOrigin(1, 0);
        const listY = top + S.padding + P.labelGap;
        // Room under the rows for the "more below" arrow, clear of the focus ring.
        const visible = Math.max(1, Math.floor((top + upperH - S.padding - P.moreArrowRoom - listY) / S.listRowHeight));
        Object.assign(this.list, { x: inX, y: listY, w: inW, visible });
        scene.input.on(Phaser.Input.Events.POINTER_WHEEL, (pointer: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
            const inside = pointer.x >= P.x && pointer.x <= P.x + P.listW && pointer.y >= top && pointer.y <= top + upperH;
            if (inside && dy !== 0) this.scrollBy(Math.sign(dy) * P.wheelRows);
        });

        // The card.
        const cx = P.x + P.listW + P.gap;
        const cw = right - cx;
        offFrame(scene, cx, top, cw, upperH);
        const cInX = cx + S.cardPadding;
        const cInW = cw - S.cardPadding * 2;
        this.cardName = offText(scene, cInX, top + S.padding, '', 'name', { maxWidth: cInW });
        this.cardCircle = offLabel(scene, cInX, top + S.padding + this.cardName.height + S.textInset, '');
        const dividerY = this.cardCircle.y + this.cardCircle.height + S.padding;
        offDivider(scene, cInX, dividerY, cInW);
        Object.assign(this.card, { x: cInX, y: dividerY + S.padding, w: cInW });

        // The keys: 1–4 (also RT + A/B/X/Y) on the left, 5–8 on the right.
        offFrame(scene, P.x, keysY, right - P.x, keysH);
        const kInX = P.x + S.padding;
        const kInW = right - P.x - S.padding * 2;
        offLabel(scene, kInX, keysY + S.padding, OFF_MAGIC_TEXT.keysLabel);
        const colW = (kInW - P.keyColumnsGap) / 2;
        const rowsY = keysY + S.padding + P.labelGap;
        for (let i = 0; i < OFF_SPELL_KEY_COUNT; i += 1) {
            const col = Math.floor(i / KEYS_PER_COLUMN);
            const x = kInX + col * (colW + P.keyColumnsGap);
            const y = rowsY + (i % KEYS_PER_COLUMN) * (S.keyRowHeight + S.keyRowGap);
            this.keyRows.push(offKeyRow(scene, x, y, colW, i + 1, i < OFF_PAD_SPELL_COUNT ? PAD_BUTTONS[i] : undefined, () => this.clickKey(i)));
        }
        this.keepMarkVisible();
        this.drawList();
        this.drawCard();
        this.update();
    }

    private get markedSpell(): OffSpellId | undefined {
        const row = this.rows[this.marked];
        return row?.kind === 'spell' ? row.id : undefined;
    }

    // ---------------------------------------------------------------- drawing

    private drawList(): void {
        this.listObjects.forEach((o) => o.destroy());
        this.listObjects = [];
        this.listRows.clear();
        const a = this.list;
        const keys = offSaveStore.character.spellKeys;
        const end = Math.min(this.rows.length, this.scroll + a.visible);
        for (let index = this.scroll; index < end; index += 1) {
            const row = this.rows[index];
            if (!row) continue;
            const y = a.y + (index - this.scroll) * S.listRowHeight;
            if (row.kind === 'section') {
                this.listObjects.push(offText(this.scene, a.x + S.listRowPadding, y + S.listRowHeight / 2, OFF_MAGIC_TEXT.circle(row.circle).toUpperCase(), 'label', {
                    color: INK.bronze, originY: 0.5,
                }));
                continue;
            }
            const spell = OFF_SPELLS[row.id];
            const key = keys.indexOf(row.id);
            const r = offListRow(this.scene, a.x, y, a.w, [
                { text: spell.name },
                { text: key >= 0 ? offSpellKeyName(key) : '', width: P.keyColumn, align: 'right', color: INK.gold, kind: 'keyNumber' },
                { text: String(this.battle.manaCost(spell)), width: P.manaColumn, align: 'right' },
            ], () => this.clickSpell(index));
            r.setMarked(index === this.marked);
            if (this.focus?.kind === 'spell' && this.focus.row === index) r.setFocused(true);
            this.listRows.set(index, r);
            this.listObjects.push(r);
        }
        // More above or below: a small drawn arrow at that edge (Alegreya Sans has no ▲ / ▼).
        const more = this.scene.add.graphics().fillStyle(C.bronze, 1);
        const ax = a.x + a.w / 2;
        const r = S.arrow;
        const gap = S.focusGap + S.focusRing + 1;
        if (this.scroll > 0) more.fillTriangle(ax - r, a.y - gap, ax + r, a.y - gap, ax, a.y - gap - r);
        const bottom = a.y + a.visible * S.listRowHeight + gap;
        if (end < this.rows.length) more.fillTriangle(ax - r, bottom, ax + r, bottom, ax, bottom + r);
        this.listObjects.push(more);
    }

    private drawCard(): void {
        this.cardRows.forEach((r) => r.destroy());
        this.cardRows = [];
        const id = this.markedSpell;
        if (id === undefined) {
            this.cardName.setText('');
            this.cardCircle.setText('');
            this.cardTexts = [];
            return;
        }
        const spell = OFF_SPELLS[id];
        const saved = offSaveStore.character;
        this.cardName.setText(spell.name);
        offFitText(this.cardName, 'name', this.card.w);
        this.cardCircle.setText(OFF_MAGIC_TEXT.circle(spell.circle).toUpperCase());
        const lines = offSpellBoxLines(id, saved.stats.int, saved.equipment).map((l) => {
            const color = l.met === undefined ? undefined : l.met ? INK.good : INK.bad;
            return { label: l.label, value: l.value, color, note: l.now?.text.replace(/^\(|\)$/g, '') };
        });
        const chance = offCastChance(spell.circle, { level: this.battle.level, int: saved.stats.int, mag: saved.stats.mag });
        lines.push({ label: OFF_MAGIC_TEXT.castChance, value: `${Phaser.Math.Clamp(chance, 0, 100)}%`, color: undefined, note: undefined });
        this.cardTexts = [spell.name, this.cardCircle.text];
        lines.forEach((l, i) => {
            this.cardRows.push(offStatRow(this.scene, this.card.x, this.card.y + i * S.rowHeight, this.card.w, l.label, l.value, l.color, l.note));
            this.cardTexts.push([l.label, l.value, l.note ? `(${l.note})` : ''].filter(Boolean).join(' '));
        });
    }

    /** The keys follow the save (changed here or anywhere). */
    public update(): void {
        const keys = offSaveStore.character.spellKeys;
        if (keys === this.drawnKeys) return;
        this.drawnKeys = keys;
        const marked = this.markedSpell;
        this.keyRows.forEach((row, i) => {
            const id = keys[i];
            row.setName(id === undefined ? undefined : OFF_SPELLS[id].name);
            row.setMarked(id !== undefined && id === marked);
        });
        this.drawList();
    }

    private redrawMarks(): void {
        this.drawnKeys = undefined;
        this.update();
        this.drawCard();
    }

    // ---------------------------------------------------------------- keys

    /** The marked spell on key index + 1 (1–8, RT + A/B/X/Y for 1–4, A or a click on a key). */
    public putOnKey(index: number): void {
        const id = this.markedSpell;
        if (id === undefined) return;
        offSaveStore.setSpellKey(index, id);
        this.say(OFF_MAGIC_TEXT.onKey(OFF_SPELLS[id].name, keyLabel(index)));
        this.redrawMarks();
    }

    /** Takes the marked spell off its key (Delete / Y, or A or a click on the key that holds it). */
    public takeOffKey(): void {
        const id = this.markedSpell;
        const index = id === undefined ? -1 : offSaveStore.character.spellKeys.indexOf(id);
        if (id === undefined || index < 0) return;
        offSaveStore.setSpellKey(index, undefined);
        this.say(OFF_MAGIC_TEXT.offKey(OFF_SPELLS[id].name));
        this.redrawMarks();
    }

    /** A key pressed or clicked: the marked spell goes there, or off it when that key already holds it. */
    private toggleKey(index: number): void {
        const id = this.markedSpell;
        if (id !== undefined && offSaveStore.character.spellKeys[index] === id) this.takeOffKey();
        else this.putOnKey(index);
    }

    // ---------------------------------------------------------------- focus

    private setFocus(focus: Focus | undefined): void {
        const old = this.focus;
        if (old?.kind === 'key') this.keyRows[old.i]?.setFocused(false);
        if (old?.kind === 'spell') this.listRows.get(old.row)?.setFocused(false);
        this.focus = focus;
        if (focus?.kind === 'spell' && focus.row !== this.marked) {
            this.marked = focus.row;
            this.keepMarkVisible();
            this.drawList();
            this.redrawMarks();
        } else if (focus?.kind === 'spell') {
            if (this.keepMarkVisible()) this.drawList();
        }
        if (focus?.kind === 'key') this.keyRows[focus.i]?.setFocused(true);
        if (focus?.kind === 'spell') this.listRows.get(focus.row)?.setFocused(true);
    }

    public focusFirst(): void {
        if (this.marked >= 0) this.setFocus({ kind: 'spell', row: this.marked });
        else this.setFocus({ kind: 'key', i: 0 });
    }

    public blur(): void {
        this.setFocus(undefined);
    }

    public move(dx: number, dy: number): boolean {
        const f = this.focus;
        if (!f) {
            this.focusFirst();
            return true;
        }
        if (f.kind === 'spell') {
            if (dy === 0) return true;
            const next = this.nextSpell(f.row, dy);
            if (next !== undefined) this.setFocus({ kind: 'spell', row: next });
            else if (dy < 0) return false;
            else this.setFocus({ kind: 'key', i: 0 });
            return true;
        }
        const col = Math.floor(f.i / KEYS_PER_COLUMN);
        const row = f.i % KEYS_PER_COLUMN;
        if (dx !== 0) {
            const c = col + dx;
            if (c >= 0 && c < 2) this.setFocus({ kind: 'key', i: c * KEYS_PER_COLUMN + row });
        } else if (dy < 0 && row === 0) {
            if (this.marked >= 0) this.setFocus({ kind: 'spell', row: this.marked });
            else return false;
        } else if (dy > 0 && row < KEYS_PER_COLUMN - 1) this.setFocus({ kind: 'key', i: f.i + 1 });
        else if (dy < 0) this.setFocus({ kind: 'key', i: f.i - 1 });
        return true;
    }

    private nextSpell(from: number, step: number): number | undefined {
        for (let i = from + step; i >= 0 && i < this.rows.length; i += step) {
            if (this.rows[i]?.kind === 'spell') return i;
        }
        return undefined;
    }

    /** A on a spell goes down to its key (or key 1); on a key, puts the marked spell there or takes it off. */
    public pressFocused(): void {
        const f = this.focus;
        if (f?.kind === 'key') this.toggleKey(f.i);
        else if (f?.kind === 'spell') {
            const id = this.markedSpell;
            const key = id === undefined ? -1 : offSaveStore.character.spellKeys.indexOf(id);
            this.setFocus({ kind: 'key', i: Math.max(0, key) });
        }
    }

    public handleInput(input: InputSystem): boolean {
        // RT held: A/B/X/Y put the marked spell on keys 1–4 (B does not close then).
        if (input.isHeld(Action.OffCastTrigger)) {
            OFF_PAD_SPELL_ACTIONS.forEach((action, i) => {
                if (input.justPressed(action)) this.toggleKey(i);
            });
            return true;
        }
        let used = false;
        OFF_SPELL_KEY_ACTIONS.forEach((action, i) => {
            if (!input.justPressed(action)) return;
            this.putOnKey(i);
            used = true;
        });
        if (input.justPressed(Action.OffDrop)) {
            this.takeOffKey();
            used = true;
        }
        return used;
    }

    // ---------------------------------------------------------------- mouse and scroll

    private clickSpell(row: number): void {
        this.setFocus({ kind: 'spell', row });
    }

    private clickKey(i: number): void {
        this.setFocus({ kind: 'key', i });
        this.toggleKey(i);
    }

    private scrollBy(rows: number): void {
        const max = Math.max(0, this.rows.length - this.list.visible);
        const next = Phaser.Math.Clamp(this.scroll + rows, 0, max);
        if (next === this.scroll) return;
        this.scroll = next;
        this.drawList();
    }

    /** Scrolls so the marked spell (and its circle's title right above it) shows; true = it scrolled. */
    private keepMarkVisible(): boolean {
        if (this.marked < 0) return false;
        const before = this.scroll;
        const first = this.rows[this.marked - 1]?.kind === 'section' ? this.marked - 1 : this.marked;
        if (first < this.scroll) this.scroll = first;
        else if (this.marked >= this.scroll + this.list.visible) this.scroll = this.marked - this.list.visible + 1;
        return this.scroll !== before;
    }

    // ---------------------------------------------------------------- development

    /** Marks that spell (`check offmagic`). */
    public debugMark(id: OffSpellId): void {
        const row = this.rows.findIndex((r) => r.kind === 'spell' && r.id === id);
        if (row >= 0) this.setFocus({ kind: 'spell', row });
    }

    /** RT + A/B/X/Y on the marked spell (`check offbookpad`): index 0–3. */
    public debugPad(index: number): void {
        this.toggleKey(index);
    }

    public focusName(): string {
        const f = this.focus;
        if (!f) return '';
        if (f.kind === 'key') return `key ${f.i + 1}`;
        const row = this.rows[f.row];
        return `spell ${row?.kind === 'spell' ? row.id : ''}`;
    }

    public debugState(): Record<string, unknown> {
        return {
            rows: this.rows.map((r) => (r.kind === 'section' ? `[Circle ${r.circle}]` : r.id)),
            marked: this.markedSpell,
            scroll: this.scroll,
            keys: offSaveStore.character.spellKeys.map((k, i) => `${keyLabel(i)}: ${k ?? '-'}`),
            card: [...this.cardTexts],
        };
    }
}

/** "2 (RT + B)" for key index 1; "6" for index 5. */
function keyLabel(index: number): string {
    return OFF_MAGIC_TEXT.keyName(offSpellKeyName(index), index < OFF_PAD_SPELL_COUNT ? offPadSpellName(index) : undefined);
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
            rows.push({ kind: 'section', circle });
        }
        rows.push({ kind: 'spell', id });
    }
    return rows;
}
