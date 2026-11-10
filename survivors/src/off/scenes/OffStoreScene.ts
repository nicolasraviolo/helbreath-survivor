// Helbreath Off: la tienda y el herrero de las ciudades y las Farms. Se abre al pisar su puerta o al hablar con su
// vendedor; el mundo sigue debajo y el HUD se esconde.
// Fase Off-5B: pestañas Buy (lo que vende ese sitio, off/data/offStore.ts) y Sell (lo de tu bolsa, a mitad de precio;
// lo que llevas puesto no se vende). Off-6A: la tienda tiene además la pestaña Magic (aprender magias).
// Fase Off-13D, rehecha con el estilo de la Off-12 (boceto aprobado por el propietario, 10-nov-2026):
// - Lista con offListRow (dibujo, nombre, lo que pide y precio), secciones y flechas de "hay más" con cuántas quedan,
//   más una barrita de desplazamiento. El herrero ordena las armas por tipo (Short Swords, Long Swords, Axes, Hammers).
// - En las filas, el rojo solo dice "no cumples el requisito"; el precio que no puedes pagar sale en gris.
// - A la derecha, la ficha del objeto (offItemCard, como la Bag y el almacén) o de la magia; abajo, precio, botón y un
//   único hueco de avisos: lo que acaba de pasar (verde) o por qué el botón está apagado (rojo), y en gris si no
//   podrías ponértelo aún (en Off se puede comprar igual).
// - Sell es una lista con los montones juntos ("Red Potion ×6"): se vende uno por pulsación. Vender un arma o una
//   armadura pregunta antes con la ventana de la Off-13A (propietario, 10-nov-2026).
// - Clic marca; doble clic, Enter, A o el botón actúan. ↑ ↓ (mantener repite) saltan las secciones; rueda desplaza.
//   Tab o LB / RB cambian de pestaña; Esc, B o ✕ cierran. Abajo, ayuda de ratón o pistas del mando.
import Phaser from 'phaser';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../../config/characterInfo';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { openOverlay } from '../../scenes/MenuOverlayScene';
import { AudioSystem } from '../../systems/AudioSystem';
import { Action, InputSystem } from '../../systems/InputSystem';
import { lookLoader } from '../../systems/LookLoader';
import { OFF_DIALOG_TEXT } from '../config/offDialog';
import { OFF_STORE_CARD, OFF_STORE_LIST, OFF_STORE_WINDOW } from '../config/offStore';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE } from '../config/offTheme';
import {
    isOffGearKey, isOffSpecial, offBagItemName, offBagKeyId, offGearDef, offNeedsText, offStacks, offWearCheck,
    type OffBagItemKey, type OffItemStack, type OffWearer,
} from '../data/offItems';
import { OFF_LOOT } from '../data/offLoot';
import { OFF_SPELL_IDS, OFF_SPELLS, offCircleTitle, type OffSpellId } from '../data/offSpells';
import { OFF_STORE_STOCK, OFF_STORE_TEXT, offPrice, offSellPrice, type OffStoreKind } from '../data/offStore';
import { offSaveStore } from '../systems/OffSaveStore';
import { offItemNameColor, offSpellBoxLines } from '../ui/offItemBox';
import { offItemCard, offStackKind, type OffCardRow } from '../ui/offItemCard';
import { offSetItemIcon } from '../ui/offItemGrid';
import {
    offBox, offButton, offCloseButton, offDivider, offFitText, offFrame, offLabel, offLayoutIssues, offListRow, offPadHints,
    offPadPill, offRule, offStatRow, offTab, offText, type OffButton, type OffTab,
} from '../ui/offUi';
import { OFF_DIALOG_SCENE_KEY, type OffDialogSceneData } from './OffDialogScene';

export const OFF_STORE_SCENE_KEY = 'OffStore';

export interface OffStoreSceneData {
    kind: OffStoreKind;
    /** Something bought or sold: the world dresses the character again if needed. */
    onChange: () => void;
    onClose: () => void;
    /** Tab open at first (Off-6A: 'magic' for the magic shop). */
    tab?: OffStoreTab;
}

export type OffStoreTab = 'buy' | 'sell' | 'magic';

/** A line of the list: a section title, an item (to buy, or a stack of the bag to sell) or a spell (Off-6A). */
type Row =
    | { kind: 'section'; title: string }
    | { kind: 'item'; id: OffBagItemKey; stack?: OffItemStack }
    | { kind: 'spell'; id: OffSpellId };

/** The tabs of each store: only the shop has the magic shop (owner, 7-nov-2026). */
const STORE_TABS: Record<OffStoreKind, readonly OffStoreTab[]> = { shop: ['buy', 'sell', 'magic'], smith: ['buy', 'sell'] };

const S = OFF_THEME_SIZE;
const C = OFF_THEME_COLOR;
const INK = OFF_THEME_INK;
const W = OFF_STORE_WINDOW;
const L = OFF_STORE_LIST;
const CARD = OFF_STORE_CARD;
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

/** The window's height and top: the list's rows set it, and it sits in the middle of the screen. */
function windowBox(): { y: number; h: number; labelsY: number; listTop: number; listBottom: number; helpY: number } {
    const labelsRel = W.tabsTop + S.tabHeight + W.columnsGap;
    const listRel = labelsRel + W.labelsH;
    const listBottomRel = listRel + L.rows * S.listRowHeight + L.inset * 2;
    const helpRel = listBottomRel + W.moreH + W.helpGap;
    const h = helpRel + W.bottomPad + W.helpGap / 2;
    const y = Math.round((GAME_HEIGHT - h) / 2);
    return { y, h, labelsY: y + labelsRel, listTop: y + listRel, listBottom: y + listBottomRel, helpY: y + helpRel };
}

/** What happened last (green) or went wrong (red); it goes when the mark moves. */
interface Notice {
    text: string;
    color: string;
}

export class OffStoreScene extends Phaser.Scene {
    private params!: OffStoreSceneData;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private openedAt = 0;
    private tab: OffStoreTab = 'buy';
    private rows: Row[] = [];
    /** Index in `rows` of the marked item (never a section), or -1 with nothing to mark. */
    private marked = -1;
    /** First row shown. */
    private scroll = 0;
    private list = { x: 0, y: 0, w: 0 };
    private listObjects: { destroy(): void }[] = [];
    private moreAbove!: { arrow: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text };
    private moreBelow!: { arrow: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text };
    private columnLabels!: { name: Phaser.GameObjects.Text; needs: Phaser.GameObjects.Text; price: Phaser.GameObjects.Text };
    private tabViews = new Map<OffStoreTab, OffTab>();
    private pills: Phaser.GameObjects.Container[] = [];
    private goldText!: Phaser.GameObjects.Text;
    private card!: {
        x: number; w: number; nameRoom: number; rowsY: number; rowsBottom: number;
        icon: Phaser.GameObjects.Image; glyph: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text; kind: Phaser.GameObjects.Text;
        hint: Phaser.GameObjects.Text; hintNote: Phaser.GameObjects.Text; priceLabel: Phaser.GameObjects.Text; price: Phaser.GameObjects.Text;
        notices: Phaser.GameObjects.Text[]; bottomParts: { setVisible(v: boolean): unknown }[]; topParts: { setVisible(v: boolean): unknown }[];
    };
    private cardRows: { destroy(): void }[] = [];
    private cardTexts: string[] = [];
    private actButton!: OffButton;
    private notice: Notice | undefined;
    private helpText!: Phaser.GameObjects.Text;
    private padHints: Phaser.GameObjects.Container | undefined;
    private helpY = 0;
    private drawn: { bag?: readonly OffBagItemKey[]; gold?: number; spells?: readonly OffSpellId[] } = {};
    private iconsReady = false;
    private lastClick = { row: -1, at: 0 };
    private held = { dir: 0, since: 0, last: 0 };
    private forcePadHints = false;
    private padShown: boolean | undefined;
    private helpKey: string | undefined;

    constructor() {
        super(OFF_STORE_SCENE_KEY);
    }

    init(data: OffStoreSceneData): void {
        this.params = data;
        this.tab = 'buy';
        this.rows = [];
        this.marked = -1;
        this.scroll = 0;
        this.listObjects = [];
        this.tabViews = new Map();
        this.pills = [];
        this.cardRows = [];
        this.cardTexts = [];
        this.notice = undefined;
        this.padHints = undefined;
        this.drawn = {};
        this.lastClick = { row: -1, at: 0 };
        this.held = { dir: 0, since: 0, last: 0 };
        this.forcePadHints = false;
        this.padShown = undefined;
        this.helpKey = undefined;
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
        this.createTabs(box.y + W.tabsTop);
        this.createList(box);
        const cardX = this.list.x + L.w + CARD.columnGap;
        this.createCard(cardX, box.labelsY, W.x + W.w - W.pad - cardX, box.listBottom - box.labelsY);

        this.helpY = box.helpY;
        this.helpText = offText(this, W.x + W.w / 2, box.helpY, '', 'small', { originX: 0.5, originY: 0.5, maxWidth: W.w - W.pad * 2 });

        this.input.on(Phaser.Input.Events.POINTER_WHEEL, (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
            const inside = p.x >= this.list.x && p.x <= this.list.x + this.list.w && p.y >= this.list.y && p.y <= box.listBottom;
            if (inside && dy !== 0) this.scrollBy(Math.sign(dy) * L.wheelRows);
        });
        this.inputSystem = new InputSystem(this);
        // Every piece has its own click zone: the input system's own pointer moves nothing here.
        this.inputSystem.setPointerMaxY(-1);
        this.inputSystem.setStickMenus(true);
        const tabs = STORE_TABS[this.params.kind];
        this.showTab(this.params.tab !== undefined && tabs.includes(this.params.tab) ? this.params.tab : 'buy');
        if (!this.iconsReady) {
            void lookLoader.ensure(this, ['item.pack']).then(() => {
                if (!this.sys.isActive()) return;
                this.iconsReady = true;
                this.redraw();
            });
        }
    }

    // ---------------------------------------------------------------- building

    private createHeader(y: number): void {
        const x = W.x + W.pad;
        const right = W.x + W.w - W.pad;
        const top = y + W.titleTop;
        const close = S.tabHeight;
        const closeX = right - close;
        const goldRight = closeX - W.goldGap;
        offLabel(this, goldRight, top, OFF_STORE_TEXT.goldLabel.toUpperCase(), { originX: 1 });
        this.goldText = offText(this, goldRight, top + W.goldNumberGap, '', 'number', { color: INK.gold, originX: 1 });
        const room = goldRight - x - S.padding * 4;
        offText(this, x, top, OFF_STORE_TEXT.title[this.params.kind], 'title', { maxWidth: room });
        offText(this, x, top + W.subtitleGap, OFF_STORE_TEXT.subtitle[this.params.kind], 'small', { maxWidth: room });
        offRule(this, x, top + W.headerH, right - x, C.line);
        offCloseButton(this, closeX, top + (W.headerH - close) / 2, close, () => {
            if (this.ready()) this.close();
        });
    }

    /** The tabs, with room for the LB / RB pills on both sides kept always (so the tabs never move). */
    private createTabs(y: number): void {
        const left = W.x + W.pad;
        const tabs = STORE_TABS[this.params.kind];
        const cy = y + S.tabHeight / 2;
        this.pills.push(offPadPill(this, left, cy, 'LB').pill);
        tabs.forEach((tab, i) => {
            const view = offTab(this, left + W.pillRoom + i * (W.tabW + W.tabGap), y, W.tabW, OFF_STORE_TEXT.tabs[tab], () => {
                if (this.ready()) this.showTab(tab);
            });
            this.tabViews.set(tab, view);
        });
        this.pills.push(offPadPill(this, left + W.pillRoom + tabs.length * (W.tabW + W.tabGap) + W.tabGap, cy, 'RB').pill);
    }

    private createList(box: ReturnType<typeof windowBox>): void {
        const x = W.x + W.pad;
        this.list = { x: x + L.inset, y: box.listTop + L.inset, w: L.w - L.inset * 2 };
        offBox(this, x, box.listTop, L.w, box.listBottom - box.listTop, C.well, C.cellBorder);
        const right = x + L.w - S.listRowPadding;
        const labelY = box.labelsY + W.labelsH / 2;
        this.columnLabels = {
            name: offLabel(this, x + S.listRowPadding, labelY, '', { originY: 0.5 }),
            needs: offLabel(this, right - L.priceW, labelY, '', { originX: 1, originY: 0.5 }),
            price: offLabel(this, right, labelY, '', { originX: 1, originY: 0.5 }),
        };
        const cx = x + L.w / 2;
        this.moreAbove = this.moreMark(cx, labelY, true);
        this.moreBelow = this.moreMark(cx, box.listBottom + W.moreH / 2 + 1, false);
    }

    /** "▲ 13 more": a drawn arrow (Alegreya Sans has no ▲ / ▼) and how many rows are hidden that way. */
    private moreMark(cx: number, cy: number, up: boolean): { arrow: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text } {
        const r = S.arrow;
        const arrow = this.add.graphics().fillStyle(C.gold, 1);
        if (up) arrow.fillTriangle(-r, r / 2, r, r / 2, 0, -r / 2 - 1);
        else arrow.fillTriangle(-r, -r / 2, r, -r / 2, 0, r / 2 + 1);
        const text = offText(this, cx, cy, '', 'small', { color: INK.gold, originY: 0.5 });
        arrow.setPosition(cx, cy);
        return { arrow, text };
    }

    /** The card: picture tile, name and kind, its rows; at the bottom the price, the button and the notice lines. */
    private createCard(x: number, y: number, w: number, h: number): void {
        offFrame(this, x, y, w, h);
        const pad = S.cardPadding;
        const inX = x + pad;
        const inW = w - pad * 2;
        const tile = S.iconTile;
        const tileY = y + S.padding;
        const tileBox = offBox(this, inX, tileY, tile, tile, C.cell, C.bronze);
        const icon = this.add.image(inX + tile / 2, tileY + tile / 2, '__DEFAULT').setVisible(false);
        const glyph = offText(this, inX + tile / 2, tileY + tile / 2, '', 'number', { color: INK.gold, originX: 0.5, originY: 0.5 });
        const nameX = inX + tile + S.padding;
        const nameRoom = x + w - pad - nameX;
        const name = offText(this, nameX, tileY + 1, '', 'name', { maxWidth: nameRoom });
        const kind = offLabel(this, nameX, tileY + CARD.kindGap, '', { maxWidth: nameRoom });
        const dividerY = tileY + tile + CARD.dividerGap;
        const divider = offDivider(this, inX, dividerY, inW);
        const rowsY = dividerY + CARD.rowsGap;

        // Bottom block, from the bottom up: notice lines, the button, the price row and a line over it.
        const noticesTop = y + h - S.padding - CARD.noticeLines * CARD.noticeLineH;
        const buttonY = noticesTop - CARD.noticeGap - CARD.buttonH;
        const priceY = buttonY - S.padding - CARD.priceRowH;
        const rule = offRule(this, inX, priceY, inW, C.rowLine);
        const priceLabel = offText(this, inX, priceY + CARD.priceRowH / 2, '', 'body', { color: INK.dim, originY: 0.5, maxWidth: inW / 2 });
        const price = offText(this, inX + inW, priceY + CARD.priceRowH / 2, '', 'number', { color: INK.gold, originX: 1, originY: 0.5, maxWidth: inW / 2 });
        this.actButton = offButton(this, inX, buttonY, '', 'main', () => {
            if (this.ready()) this.act();
        }, inW, CARD.buttonH);
        const notices = Array.from({ length: CARD.noticeLines }, (_, i) =>
            offText(this, inX + inW / 2, noticesTop + (i + 0.5) * CARD.noticeLineH, '', 'small', { originX: 0.5, originY: 0.5, maxWidth: inW }));
        const middle = (rowsY + priceY) / 2;
        const hint = offText(this, inX + inW / 2, middle, '', 'body', { color: INK.dim, originX: 0.5, originY: 0.5, maxWidth: inW });
        const hintNote = offText(this, inX + inW / 2, middle + S.rowHeight, '', 'small', { originX: 0.5, originY: 0.5, maxWidth: inW });
        this.card = {
            x: inX, w: inW, nameRoom, rowsY, rowsBottom: priceY, icon, glyph, name, kind, hint, hintNote, priceLabel, price, notices,
            bottomParts: [rule, priceLabel, price], topParts: [tileBox, divider],
        };
    }

    // ---------------------------------------------------------------- update

    override update(): void {
        const input = this.inputSystem;
        input.update();
        const saved = offSaveStore.character;
        // Drunk, picked up or paid meanwhile (the world goes on): draw it all again.
        if (saved.bag !== this.drawn.bag || saved.gold !== this.drawn.gold || saved.spells !== this.drawn.spells) this.refresh();
        this.showHelp(this.forcePadHints || input.getLastDevice() === 'gamepad');
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        const tabStep = input.justPressed(Action.OffPrevTarget) ? -1 : input.justPressed(Action.OffSwitchTab) || input.justPressed(Action.OffNextTarget) ? 1 : 0;
        if (tabStep !== 0) {
            const tabs = STORE_TABS[this.params.kind];
            this.showTab(tabs[(tabs.indexOf(this.tab) + tabStep + tabs.length) % tabs.length] ?? 'buy');
            return;
        }
        this.updateUpDown();
        if (input.justPressed(Action.Pick)) this.act();
    }

    /** ↑ / ↓ move the mark; held, they repeat after a moment. */
    private updateUpDown(): void {
        const input = this.inputSystem;
        const now = this.game.loop.time;
        const pressed = input.justPressed(Action.MenuUp) ? -1 : input.justPressed(Action.MenuDown) ? 1 : 0;
        if (pressed !== 0) {
            this.held = { dir: pressed, since: now, last: now };
            this.moveMark(pressed);
            return;
        }
        const dir = input.isHeld(Action.MenuUp) ? -1 : input.isHeld(Action.MenuDown) ? 1 : 0;
        if (dir === 0 || dir !== this.held.dir) {
            this.held.dir = 0;
            return;
        }
        if (now - this.held.since >= L.repeatDelayMs && now - this.held.last >= L.repeatMs) {
            this.held.last = now;
            this.moveMark(dir);
        }
    }

    /** The help words of this tab; without the action when the marked row can't take it (or there is none). */
    private setHelp(canAct: boolean): void {
        const verb = canAct ? OFF_STORE_TEXT.actButton[this.tab] : undefined;
        const key = verb ?? '';
        if (this.helpKey === key) return;
        this.helpKey = key;
        this.helpText.setText(OFF_STORE_TEXT.helpMouse(verb?.toLowerCase()));
        offFitText(this.helpText, 'small', W.w - W.pad * 2);
        this.padHints?.destroy();
        this.padHints = offPadHints(this, W.x + W.w / 2, this.helpY, OFF_STORE_TEXT.helpPad(verb));
        this.padShown = undefined;
    }

    /** The help line: mouse words, or the pad hints of this tab. */
    private showHelp(pad: boolean): void {
        if (pad === this.padShown) return;
        this.padShown = pad;
        this.helpText.setVisible(!pad);
        this.padHints?.setVisible(pad);
        this.pills.forEach((p) => p.setVisible(pad));
        this.actButton.setLabel(this.buttonLabel());
    }

    // ---------------------------------------------------------------- tabs and rows

    private get wearer(): OffWearer {
        return { str: offSaveStore.character.stats.str, level: offSaveStore.level };
    }

    /** The rows of a tab: what the place sells, the bag's stacks, or the spells by circle. */
    private rowsFor(tab: OffStoreTab): Row[] {
        const rows: Row[] = [];
        if (tab === 'magic') {
            let circle = 0;
            for (const id of OFF_SPELL_IDS) {
                if (OFF_SPELLS[id].circle !== circle) {
                    circle = OFF_SPELLS[id].circle;
                    rows.push({ kind: 'section', title: offCircleTitle(circle) });
                }
                rows.push({ kind: 'spell', id });
            }
            return rows;
        }
        if (tab === 'sell') return offStacks(offSaveStore.character.bag).map((stack) => ({ kind: 'item', id: stack.key, stack }));
        for (const section of OFF_STORE_STOCK[this.params.kind]) {
            rows.push({ kind: 'section', title: section.title });
            for (const id of section.items) rows.push({ kind: 'item', id });
        }
        return rows;
    }

    public showTab(tab: OffStoreTab): void {
        this.tab = tab;
        this.rows = this.rowsFor(tab);
        this.scroll = 0;
        this.marked = this.rows.findIndex((r) => r.kind !== 'section');
        this.notice = undefined;
        this.tabViews.forEach((view, id) => view.setOn(id === tab));
        const T = OFF_STORE_TEXT.columns;
        this.columnLabels.name.setText((tab === 'magic' ? T.spell : T.item).toUpperCase());
        this.columnLabels.name.setX(this.list.x + S.listRowPadding - L.inset + (tab === 'magic' ? 0 : L.tile + L.tileGap));
        this.columnLabels.needs.setText(tab === 'sell' ? '' : T.needs.toUpperCase());
        this.columnLabels.price.setText((tab === 'sell' ? T.youGet : T.price).toUpperCase());
        this.redraw();
    }

    /** The save changed (here or in the world): rows again, keeping the mark near where it was. */
    private refresh(): void {
        const marked = this.marked;
        this.rows = this.rowsFor(this.tab);
        this.marked = this.nearestItem(Math.min(marked, this.rows.length - 1));
        this.redraw();
    }

    private nearestItem(index: number): number {
        for (let i = Math.max(0, index); i < this.rows.length; i += 1) if (this.rows[i]?.kind !== 'section') return i;
        for (let i = Math.min(index, this.rows.length - 1); i >= 0; i -= 1) if (this.rows[i]?.kind !== 'section') return i;
        return -1;
    }

    // ---------------------------------------------------------------- drawing

    private redraw(): void {
        const saved = offSaveStore.character;
        this.drawn = { bag: saved.bag, gold: saved.gold, spells: saved.spells };
        this.goldText.setText(saved.gold.toLocaleString('en-US'));
        this.keepMarkVisible();
        this.drawList();
        this.drawCard();
        this.setHelp(this.actButton.isEnabled());
    }

    private drawList(): void {
        this.listObjects.forEach((o) => o.destroy());
        this.listObjects = [];
        const a = this.list;
        const h = S.listRowHeight;
        const end = Math.min(this.rows.length, this.scroll + L.rows);
        if (this.rows.length === 0) {
            const cy = a.y + (L.rows * h) / 2;
            this.listObjects.push(offText(this, a.x + a.w / 2, cy, OFF_STORE_TEXT.nothingToSell, 'body', { color: INK.dim, originX: 0.5, originY: 0.5, maxWidth: a.w }));
            this.listObjects.push(offText(this, a.x + a.w / 2, cy + S.rowHeight, OFF_STORE_TEXT.nothingToSellNote, 'small', { originX: 0.5, originY: 0.5, maxWidth: a.w }));
        }
        for (let index = this.scroll; index < end; index += 1) {
            const row = this.rows[index];
            if (!row) continue;
            const y = a.y + (index - this.scroll) * h;
            if (row.kind === 'section') {
                this.listObjects.push(offText(this, a.x + S.listRowPadding, y + h / 2, row.title.toUpperCase(), 'label', { color: INK.bronze, originY: 0.5 }));
                continue;
            }
            const r = row.kind === 'spell' ? this.spellRow(row.id, index, y) : this.itemRow(row, index, y);
            this.listObjects.push(...r);
        }
        // How many rows are hidden above and below, and the scroll thumb.
        const above = this.scroll;
        const below = Math.max(0, this.rows.length - end);
        this.setMore(this.moreAbove, above);
        this.setMore(this.moreBelow, below);
        if (this.rows.length > L.rows) {
            const trackH = L.rows * h;
            const thumbH = Math.max(L.thumbMin, (trackH * L.rows) / this.rows.length);
            const thumbY = a.y + ((trackH - thumbH) * this.scroll) / (this.rows.length - L.rows);
            const thumb = this.add.graphics().fillStyle(C.bronze, 1).fillRect(a.x + a.w - L.thumbInset - L.thumbW, thumbY, L.thumbW, thumbH);
            this.listObjects.push(thumb);
        }
    }

    private setMore(mark: { arrow: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }, hidden: number): void {
        mark.arrow.setVisible(hidden > 0);
        mark.text.setVisible(hidden > 0).setText(OFF_STORE_TEXT.more(hidden));
        // The arrow and the words, centred together.
        const total = S.arrow * 2 + S.noteGap + mark.text.width;
        const cx = this.list.x + this.list.w / 2;
        mark.arrow.setX(cx - total / 2 + S.arrow);
        mark.text.setX(cx - total / 2 + S.arrow * 2 + S.noteGap);
    }

    /** An item row: picture tile, name (×count for a stack), what it needs and the price. */
    private itemRow(row: Extract<Row, { kind: 'item' }>, index: number, y: number): { destroy(): void }[] {
        const a = this.list;
        const id = row.id;
        const gold = offSaveStore.character.gold;
        const plain = offBagKeyId(id);
        const price = this.tab === 'buy' ? offPrice(plain) : offSellPrice(plain);
        const unmet = isOffGearKey(id) && offWearCheck(id, this.wearer) !== 'ok';
        const count = row.stack && row.stack.count > 1 ? ` ×${row.stack.count}` : '';
        const needs = this.tab === 'buy' && isOffGearKey(id) ? offNeedsText(id) : '';
        const r = offListRow(this, a.x, y, a.w, [
            { text: offBagItemName(id) + count, color: offItemNameColor(id) },
            { text: needs, width: L.needsW, align: 'right', color: unmet ? INK.bad : INK.note },
            { text: price.toLocaleString('en-US'), width: L.priceW, align: 'right', color: this.tab === 'buy' && price > gold ? INK.dim : INK.text },
        ], () => this.clickRow(index), L.tile + L.tileGap);
        r.setMarked(index === this.marked);
        const tx = a.x + S.listRowPadding;
        const ty = y + (S.listRowHeight - 1 - L.tile) / 2;
        const tile = offBox(this, tx, ty, L.tile, L.tile, unmet ? C.unmet : C.cell, C.cellBorder);
        const icon = this.add.image(tx + L.tile / 2, ty + L.tile / 2, '__DEFAULT');
        offSetItemIcon(icon, id, L.tile - 2, offSaveStore.character.look.gender, this.iconsReady);
        return [r, tile, icon];
    }

    /** A spell row: name, "Int N" (red if your INT is short) and the price, or "Learned". */
    private spellRow(id: OffSpellId, index: number, y: number): { destroy(): void }[] {
        const spell = OFF_SPELLS[id];
        const character = offSaveStore.character;
        const known = offSaveStore.knowsSpell(id);
        const r = offListRow(this, this.list.x, y, this.list.w, [
            { text: spell.name },
            { text: known ? '' : `Int ${spell.reqInt}`, width: L.needsW, align: 'right', color: character.stats.int >= spell.reqInt ? INK.note : INK.bad },
            {
                text: known ? OFF_STORE_TEXT.learned : spell.price.toLocaleString('en-US'), width: L.priceW, align: 'right',
                color: known || spell.price > character.gold ? INK.dim : INK.text,
            },
        ], () => this.clickRow(index));
        r.setMarked(index === this.marked);
        return [r];
    }

    /** The card of the marked row, its price, the button and the notice lines. */
    private drawCard(): void {
        this.cardRows.forEach((r) => r.destroy());
        this.cardRows = [];
        const c = this.card;
        const row = this.rows[this.marked];
        c.icon.setVisible(false);
        c.glyph.setText('');
        c.hint.setText('');
        c.hintNote.setText('');
        if (row === undefined || row.kind === 'section') {
            this.showEmptyCard();
            return;
        }
        const view = row.kind === 'spell' ? this.spellCard(row.id) : this.itemCard(row);
        c.name.setText(view.name).setColor(view.nameColor ?? INK.text);
        offFitText(c.name, 'name', c.nameRoom);
        c.kind.setText(view.kind.toUpperCase());
        offFitText(c.kind, 'label', c.nameRoom);
        this.cardTexts = [view.name, view.kind];
        const fit = Math.floor((c.rowsBottom - c.rowsY) / S.rowHeight);
        view.rows.slice(0, fit).forEach((r, i) => {
            const y = c.rowsY + i * S.rowHeight;
            this.cardTexts.push([r.label, r.value, r.note ? `(${r.note})` : ''].filter(Boolean).join(' '));
            if (r.value === '') {
                this.cardRows.push(offText(this, c.x, y + S.rowHeight / 2, r.label, 'body', { color: INK.dim, originY: 0.5, maxWidth: c.w }));
                return;
            }
            this.cardRows.push(offStatRow(this, c.x, y, c.w, r.label, r.value, r.color, r.note, r.trend));
        });
        c.bottomParts.forEach((p) => p.setVisible(true));
        c.topParts.forEach((p) => p.setVisible(true));
        c.priceLabel.setText(view.priceLabel);
        c.price.setText(view.price).setColor(view.priceShort ? INK.bad : INK.gold);
        this.actButton.setVisible(true);
        this.actButton.setEnabled(view.block === undefined);
        this.actButton.setLabel(this.buttonLabel());
        // One place for notices: what just happened, else why the button is off; then the grey warning.
        const lines: Notice[] = [];
        if (this.notice) lines.push(this.notice);
        // Just learned: "already known" would only repeat it.
        if (view.block && !(this.notice && view.block === OFF_STORE_TEXT.known)) lines.push({ text: view.block, color: view.blockColor ?? INK.bad });
        if (view.warning) lines.push({ text: view.warning, color: INK.dim });
        c.notices.forEach((t, i) => {
            const line = lines[i];
            t.setText(line?.text ?? '').setColor(line?.color ?? INK.text);
            offFitText(t, 'small', c.w);
        });
        this.cardTexts.push(`${view.priceLabel} ${view.price}`, ...lines.slice(0, c.notices.length).map((l) => l.text));
    }

    private showEmptyCard(): void {
        const c = this.card;
        c.name.setText('');
        c.kind.setText('');
        c.bottomParts.forEach((p) => p.setVisible(false));
        c.topParts.forEach((p) => p.setVisible(false));
        this.actButton.setVisible(false);
        c.notices.forEach((t) => t.setText(''));
        const empty = this.tab === 'sell' && this.rows.length === 0;
        // The list already says why it is empty.
        c.hint.setText(empty ? OFF_STORE_TEXT.nothingToSellCard : OFF_STORE_TEXT.pickHint);
        c.hintNote.setText('');
        offFitText(c.hint, 'body', c.w);
        offFitText(c.hintNote, 'small', c.w);
        this.cardTexts = [c.hint.text, c.hintNote.text].filter(Boolean);
    }

    /** What the card shows for an item, on Buy or Sell. */
    private itemCard(row: Extract<Row, { kind: 'item' }>): CardView {
        const id = row.id;
        const saved = offSaveStore.character;
        const who = this.wearer;
        const worn = isOffGearKey(id) ? saved.equipment[offGearDef(id).slot] : undefined;
        const card = offItemCard(id, worn === id ? undefined : worn, who);
        this.card.icon.setVisible(true);
        offSetItemIcon(this.card.icon, id, S.iconTile - 4, saved.look.gender, this.iconsReady);
        const T = OFF_STORE_TEXT;
        const plain = offBagKeyId(id);
        if (this.tab === 'sell') {
            const count = row.stack?.count ?? 1;
            const one = offSellPrice(plain);
            const rows: OffCardRow[] = [...card.rows];
            if (count > 1) rows.push({ label: T.inYourBag, value: String(count) }, { label: T.sellAll(count), value: (one * count).toLocaleString('en-US') });
            return {
                name: card.name, nameColor: card.nameColor, kind: offStackKind(card.kind, count), rows,
                priceLabel: count > 1 ? T.priceLabelOne : T.priceLabel.sell, price: one.toLocaleString('en-US'),
            };
        }
        const price = offPrice(plain);
        const rows: OffCardRow[] = [...card.rows];
        if (!isOffGearKey(id)) rows.push({ label: T.potionsCarried, value: `${offSaveStore.potionCount} / ${OFF_LOOT.potionLimit}` });
        const room = offSaveStore.roomFor(id);
        const block = saved.gold < price ? T.noGold(saved.gold) : room === 'bagFull' ? T.bagFull : room === 'potionLimit' ? T.potionLimit : undefined;
        const warning = isOffGearKey(id) && offWearCheck(id, who) !== 'ok' ? T.cantWearYet(offNeedsText(id)) : undefined;
        return {
            name: card.name, nameColor: card.nameColor, kind: card.kind, rows, priceLabel: T.priceLabel.buy,
            price: price.toLocaleString('en-US'), priceShort: saved.gold < price, block, warning,
        };
    }

    /** What the card shows for a spell (its lines as in the Magic tab of the character window). */
    private spellCard(id: OffSpellId): CardView {
        const spell = OFF_SPELLS[id];
        const saved = offSaveStore.character;
        const T = OFF_STORE_TEXT;
        this.card.glyph.setText(ROMAN[spell.circle] ?? String(spell.circle));
        offFitText(this.card.glyph, 'number', S.iconTile - 4);
        const rows: OffCardRow[] = offSpellBoxLines(id, saved.stats.int, saved.equipment).map((l) => ({
            label: l.label, value: l.value, color: l.met === undefined ? undefined : l.met ? INK.good : INK.bad,
            // The "(you have …)" of Needs is said once, under the button.
            note: l.met === undefined ? l.now?.text.replace(/^\(|\)$/g, '') : undefined,
        }));
        const known = offSaveStore.knowsSpell(id);
        const intShort = saved.stats.int < spell.reqInt;
        const block = known ? T.known : intShort ? T.intShort(spell.reqInt, saved.stats.int) : saved.gold < spell.price ? T.noGold(saved.gold) : undefined;
        return {
            name: spell.name, kind: `${offCircleTitle(spell.circle)} spell`, rows, priceLabel: T.priceLabel.magic,
            price: known ? T.learned : spell.price.toLocaleString('en-US'), priceShort: !known && saved.gold < spell.price,
            block, blockColor: known ? INK.dim : undefined,
        };
    }

    /** The card button's word: Sell one for a stack. */
    private buttonLabel(): string {
        const row = this.rows[this.marked];
        if (this.tab === 'sell' && row?.kind === 'item' && (row.stack?.count ?? 1) > 1) return OFF_STORE_TEXT.sellOne;
        return OFF_STORE_TEXT.actButton[this.tab];
    }

    // ---------------------------------------------------------------- moving

    private clickRow(index: number): void {
        if (!this.ready()) return;
        const now = this.game.loop.time;
        const twice = this.lastClick.row === index && now - this.lastClick.at <= W.doubleClickMs;
        this.lastClick = twice ? { row: -1, at: 0 } : { row: index, at: now };
        this.mark(index);
        if (twice) this.act();
    }

    /** Development and clicks: marks that row (sections are skipped). The last notice goes with the old mark. */
    public mark(index: number): void {
        const kind = this.rows[index]?.kind;
        if (kind === undefined || kind === 'section') return;
        if (index !== this.marked) this.notice = undefined;
        this.marked = index;
        this.redraw();
    }

    /** Up / down to the next item row, past the sections; at the ends, the list just scrolls. */
    private moveMark(step: number): void {
        let index = this.marked;
        do index += step;
        while (index >= 0 && index < this.rows.length && this.rows[index]?.kind === 'section');
        if (index >= 0 && index < this.rows.length) this.mark(index);
        else this.scrollBy(step);
    }

    private scrollBy(rows: number): void {
        const max = Math.max(0, this.rows.length - L.rows);
        const next = Phaser.Math.Clamp(this.scroll + rows, 0, max);
        if (next === this.scroll) return;
        this.scroll = next;
        this.drawList();
    }

    /** The marked row in sight (its section title too, when it is the first of a section). */
    private keepMarkVisible(): void {
        const max = Math.max(0, this.rows.length - L.rows);
        if (this.marked >= 0) {
            const first = this.rows[this.marked - 1]?.kind === 'section' ? this.marked - 1 : this.marked;
            if (first < this.scroll) this.scroll = first;
            else if (this.marked >= this.scroll + L.rows) this.scroll = this.marked - L.rows + 1;
        }
        this.scroll = Phaser.Math.Clamp(this.scroll, 0, max);
    }

    // ---------------------------------------------------------------- buying, selling, learning

    /** Buys, sells or learns the marked row (button, double click, Enter, A). Weapons and armour ask before selling. */
    public act(): void {
        const row = this.rows[this.marked];
        if (row?.kind === 'spell') {
            this.learn(row.id);
            return;
        }
        if (row?.kind !== 'item') return;
        if (this.tab === 'buy') {
            this.buy(row.id);
            return;
        }
        if (isOffGearKey(row.id)) this.askSell(row.id);
        else this.sellMarked();
    }

    private buy(id: OffBagItemKey): void {
        const plain = offBagKeyId(id);
        const result = offSaveStore.buy(plain);
        if (result === 'ok') {
            this.audio.play('sfx.pickup');
            this.notice = { text: OFF_STORE_TEXT.bought(offBagItemName(id), offPrice(plain)), color: INK.good };
            this.params.onChange();
        } else {
            // The card says why already (the button was off).
            this.notice = undefined;
        }
        this.redraw();
    }

    private askSell(id: OffBagItemKey): void {
        const T = OFF_STORE_TEXT;
        const special = isOffSpecial(id);
        const data: Omit<OffDialogSceneData, 'returnTo'> = {
            title: T.sellTitle,
            question: T.sellQuestion(offBagItemName(id), offSellPrice(offBagKeyId(id))),
            warning: special ? T.sellSpecial : T.sellCalm,
            calmWarning: !special,
            buttons: [
                { label: OFF_DIALOG_TEXT.no, variant: 'normal' },
                { label: OFF_DIALOG_TEXT.yes, variant: 'main', onPress: () => this.sellMarked() },
            ],
            focus: 0,
            cancel: 0,
        };
        openOverlay(this, OFF_DIALOG_SCENE_KEY, data);
    }

    /** Sells one of the marked stack, without asking (Yes in the question, and `check`). */
    public sellMarked(): void {
        const row = this.rows[this.marked];
        if (row?.kind !== 'item' || row.stack === undefined) return;
        const id = offSaveStore.character.bag[row.stack.last];
        const gold = offSaveStore.sell(row.stack.last);
        if (id === undefined || gold === undefined) return;
        this.audio.play('sfx.pickup');
        this.params.onChange();
        this.notice = { text: OFF_STORE_TEXT.sold(offBagItemName(id), gold), color: INK.good };
        this.refresh();
    }

    private learn(id: OffSpellId): void {
        const spell = OFF_SPELLS[id];
        const result = offSaveStore.learnSpell(id);
        if (result === 'ok') {
            this.audio.play('sfx.pickup');
            this.notice = { text: OFF_STORE_TEXT.learnt(spell.name, spell.price), color: INK.good };
        } else {
            this.notice = undefined;
        }
        this.redraw();
    }

    // ---------------------------------------------------------------- development

    /** `check`: the window as if the pad were in use. */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
    }

    /** Development: ↑ / ↓ as the keys do (`check offsmithpad`). */
    public debugMove(step: number): void {
        this.moveMark(step);
    }

    /** Development: what the window shows. */
    public debugState(): {
        tab: OffStoreTab; rows: string[]; marked: string | undefined; gold: string; message: string; box: string[]; button: string;
        buttonOn: boolean; scroll: number; more: [string, string]; issues: string[]; window: { y: number; h: number }; help: string;
    } {
        const rows = this.rows.map((r) => {
            if (r.kind === 'section') return `[${r.title}]`;
            if (r.kind === 'spell') return offSaveStore.knowsSpell(r.id) ? `${r.id} (learned)` : r.id;
            return r.stack && r.stack.count > 1 ? `${r.id}×${r.stack.count}` : r.id;
        });
        const row = this.rows[this.marked];
        const box = windowBox();
        const notices = this.card.notices.map((t) => t.text).filter(Boolean);
        return {
            tab: this.tab, rows, marked: row?.kind === 'section' ? undefined : row?.id, gold: this.goldText.text,
            message: notices.join(' | '), box: [...this.cardTexts], button: this.buttonLabel(), buttonOn: this.actButton.isEnabled(),
            scroll: this.scroll,
            more: [this.moreAbove.text.visible ? this.moreAbove.text.text : '', this.moreBelow.text.visible ? this.moreBelow.text.text : ''],
            issues: offLayoutIssues(this), window: { y: box.y, h: box.h },
            help: this.padHints?.visible ? 'pad' : 'mouse',
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

/** What the card shows: name, kind, rows, the price and, when the button is off, why. */
interface CardView {
    name: string;
    nameColor?: string;
    kind: string;
    rows: OffCardRow[];
    priceLabel: string;
    price: string;
    priceShort?: boolean;
    /** Why the button is off (red; grey for "already known"). */
    block?: string;
    blockColor?: string;
    /** Grey, under: you may buy it but not wear it yet. */
    warning?: string;
}
