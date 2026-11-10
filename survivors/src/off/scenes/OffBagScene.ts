// Helbreath Off, Fase Off-12B: la ventana del personaje con la pestaña Bag. Sustituye a Inventory y Equipment.
// Estilo nuevo (off/config/offTheme.ts, piezas de off/ui/offUi.ts); medidas en off/config/offBag.ts.
// - Izquierda, siempre: el personaje (muñeco vestido) con sus 8 huecos, 4 a cada lado (el anillo apagado), y las barras
//   de vida, maná, estamina y experiencia, al momento.
// - Derecha: la bolsa (10 × 5), los filtros All / Weapons / Armor / Potions a su lado, el oro y las pociones debajo, y
//   la ficha del objeto marcado (off/ui/offItemCard.ts) con Drop a la izquierda y Equip / Drink / Remove a la derecha.
// - Marcar un hueco enseña lo que llevas puesto y apaga en la bolsa lo que no vale para ese hueco.
// - **El mundo no se para** (propietario, 7-nov-2026 y 10-nov-2026): los monstruos siguen y te pueden pegar; el
//   personaje se queda quieto mientras está abierta y el HUD se esconde (las barras de aquí van al momento).
// - Ratón: clic marca, doble clic usa (equipa, bebe o quita). Teclado y mando: flechas / cruceta mueven el foco por
//   toda la ventana sin atascos (bolsa ↔ huecos a la izquierda, ↔ filtros a la derecha, ↓ botones, ↑ ✕);
//   Enter / A pulsa lo enfocado, Supr / Y tira, Esc / B / I / X cierran. Los controles no se escriben en pantalla.
// Fase Off-12C: pestañas Stats (off/ui/offStatsPage.ts) y Magic (off/ui/offMagicPage.ts, solo si sabes alguna magia)
// en la cabecera, junto al ✕. Cambiar de pestaña vuelve a montar la escena con la pestaña nueva (scene.restart): la
// columna del personaje es la misma y los puntos repartidos sin confirmar pasan de una a otra (se pierden al cerrar).
// Desde arriba de cada pestaña, ↑ sube a la cabecera; ← → recorren pestañas y ✕, y ↓ vuelve a bajar.
// LB / RB y las teclas de cada pestaña llegan en la 12D.
import Phaser from 'phaser';
import { setColouredTexture } from '../../hb/additiveTint';
import { itemPackTexture } from '../../config/equipment';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../../config/characterInfo';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { EQUIP_SLOT_NAMES } from '../../data/items';
import { PaperDoll } from '../../entities/PaperDoll';
import { Action, InputSystem } from '../../systems/InputSystem';
import { lookLoader } from '../../systems/LookLoader';
import { OFF_BAG_CARD, OFF_BAG_CHARACTER, OFF_BAG_GRID, OFF_BAG_WINDOW } from '../config/offBag';
import { OFF_STAT_IDS, type OffStats } from '../data/offCharacter';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE } from '../config/offTheme';
import { OFF_BAG_TEXT } from '../data/offBag';
import { offGood } from '../data/offGoods';
import {
    isOffGearKey, offBagItemPicture, offEquipmentLook, offGearDef, offItemTint, offWearCheck,
    type OffBagItemKey, type OffEquipment, type OffSlotId, type OffWearer,
} from '../data/offItems';
import { OFF_LEVEL, offExpForLevel } from '../data/offLevel';
import { OFF_LOOT } from '../data/offLoot';
import { OFF_NOVICE } from '../data/offWorld';
import type { OffBattle, OffUseResult } from '../systems/OffBattle';
import { offSaveStore } from '../systems/OffSaveStore';
import { offEmptySlotCard, offItemCard, type OffItemCard } from '../ui/offItemCard';
import { OffMagicPage } from '../ui/offMagicPage';
import { OffStatsPage } from '../ui/offStatsPage';
import type { OffWindowPage } from '../ui/offWindowPage';
import {
    offBar, offBarHeight, offBox, offButton, offCell, offCloseButton, offDivider, offFitText, offFrame, offLabel,
    offLayoutIssues, offRule, offStatRow, offTab, offText, type OffBar, type OffButton, type OffCell, type OffControl, type OffTab,
} from '../ui/offUi';

export const OFF_BAG_SCENE_KEY = 'OffBag';

/** The window's tabs (Off-12C). */
export type OffCharacterTab = 'bag' | 'stats' | 'magic';

export interface OffBagSceneData {
    battle: OffBattle;
    /** The tab it opens on (Bag if left out; Magic needs a spell learned). */
    tab?: OffCharacterTab;
    /** Internal (tab change): points spread and not confirmed, kept from the other tab. */
    pending?: OffStats;
    /** Internal (tab change): no input delay, and the focus starts on the tab. */
    fromTab?: boolean;
    /** Gear changed: the world dresses the character again. */
    onGearChange: () => void;
    /** After closing. */
    onClose: () => void;
}

const S = OFF_THEME_SIZE;
const C = OFF_THEME_COLOR;
const INK = OFF_THEME_INK;
const W = OFF_BAG_WINDOW;
const CH = OFF_BAG_CHARACTER;
const G = OFF_BAG_GRID;
const CARD = OFF_BAG_CARD;

export type OffBagFilter = 'all' | 'weapon' | 'armor' | 'potion';
const FILTERS: readonly OffBagFilter[] = ['all', 'weapon', 'armor', 'potion'];

/** The 8 slots: left column top to bottom, then the right one (next to the bag); undefined = the ring, still to come. */
const SLOTS: readonly (OffSlotId | undefined)[] = ['helm', 'body', 'legs', 'boots', 'weapon', 'shield', 'cape', undefined];
const SLOTS_PER_SIDE = 4;

type ButtonId = 'drop' | 'main';
type Focus =
    | { kind: 'cell'; i: number }
    | { kind: 'slot'; i: number }
    | { kind: 'filter'; i: number }
    | { kind: 'button'; id: ButtonId }
    | { kind: 'tab'; i: number }
    | { kind: 'close' };

/** What the card shows: an item of the bag (its index in the bag), or a slot. */
type Selected = { kind: 'bag'; index: number } | { kind: 'slot'; slot: OffSlotId } | undefined;

type MainAction = 'equip' | 'drink' | 'use' | 'remove';

export class OffBagScene extends Phaser.Scene {
    private params!: OffBagSceneData;
    private tab: OffCharacterTab = 'bag';
    private tabs: OffCharacterTab[] = [];
    private tabButtons: OffTab[] = [];
    /** Stats or Magic (undefined on Bag, which the scene draws itself). */
    private page: OffWindowPage | undefined;
    private added: OffStats = noPoints();
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private focus: Focus = { kind: 'cell', i: 0 };
    private selected: Selected;
    private filter: OffBagFilter = 'all';
    /** Bag index shown in each cell (by filter). */
    private shown: number[] = [];
    private cells: OffCell[] = [];
    private slotCells: OffCell[] = [];
    private slotLabels: Phaser.GameObjects.Text[] = [];
    private filterTabs: OffTab[] = [];
    private closeButton!: OffControl;
    private dropButton!: OffButton;
    private mainButton!: OffButton;
    private mainAction: MainAction | undefined;
    private bars!: { hp: OffBar; mana: OffBar; stamina: OffBar; exp: OffBar };
    private barTexts = { hp: '', mana: '', stamina: '', exp: '' };
    private doll: PaperDoll | undefined;
    private goldText!: Phaser.GameObjects.Text;
    private potionsText!: Phaser.GameObjects.Text;
    private countText!: Phaser.GameObjects.Text;
    private messageText!: Phaser.GameObjects.Text;
    private card!: { icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text; kind: Phaser.GameObjects.Text; hint: Phaser.GameObjects.Text };
    private cardRows: { destroy(): void }[] = [];
    private cardTexts: string[] = [];
    private cardArea = { x: 0, y: 0, w: 0, h: 0, nameRoom: 0, rowsY: 0 };
    /** The bag and equipment drawn last (the save replaces them on every change: a new one means redraw). */
    private drawnBag: readonly OffBagItemKey[] | undefined;
    private drawnEquipment: Readonly<OffEquipment> | undefined;
    private drawnGold = -1;
    private iconsReady = false;
    private lastClick = { key: '', at: 0 };

    constructor() {
        super(OFF_BAG_SCENE_KEY);
    }

    init(data: OffBagSceneData): void {
        this.params = data;
        this.tabs = offSaveStore.character.spells.length > 0 ? ['bag', 'stats', 'magic'] : ['bag', 'stats'];
        this.tab = data.tab !== undefined && this.tabs.includes(data.tab) ? data.tab : 'bag';
        this.tabButtons = [];
        this.page = undefined;
        this.added = data.pending ?? noPoints();
        this.cells = [];
        this.slotCells = [];
        this.slotLabels = [];
        this.filterTabs = [];
        this.cardRows = [];
        this.cardTexts = [];
        this.shown = [];
        this.filter = 'all';
        this.focus = { kind: 'cell', i: 0 };
        this.selected = undefined;
        this.drawnBag = undefined;
        this.drawnEquipment = undefined;
        this.drawnGold = -1;
        this.doll = undefined;
        this.barTexts = { hp: '', mana: '', stamina: '', exp: '' };
        this.lastClick = { key: '', at: 0 };
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.params.fromTab ? -CHARACTER_INFO_INPUT_DELAY_MS : this.time.now;
        // The world shows dimmed round the window; clicks stop here (the world takes no orders while it is open).
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0).setInteractive();
        offFrame(this, W.x, W.y, W.w, W.h, { fill: C.window, big: true });
        this.createHeader();
        this.createCharacter();
        this.messageText = offText(this, GAME_WIDTH / 2, W.messageY, '', 'small', { originX: 0.5, originY: 0.5 });
        const say = (line: string): void => this.say(line);
        if (this.tab === 'bag') {
            this.createBag();
            this.createCard();
        } else if (this.tab === 'stats') {
            this.page = new OffStatsPage(this, this.params.battle, this.added, say);
        } else {
            this.page = new OffMagicPage(this, this.params.battle, say);
        }
        this.inputSystem = new InputSystem(this);
        // Every piece has its own click zone: the input system's own pointer moves nothing here.
        this.inputSystem.setPointerMaxY(-1);
        this.selected = this.bag.length > 0 ? { kind: 'bag', index: 0 } : undefined;
        if (this.page) this.page.focusFirst();
        else this.focus = { kind: 'cell', i: 0 };
        if (this.params.fromTab) {
            this.page?.blur();
            this.focus = { kind: 'tab', i: this.tabs.indexOf(this.tab) };
        }
        this.refresh();
        this.updateBars();
        if (!this.iconsReady) {
            void lookLoader.ensure(this, ['item.pack']).then(() => {
                if (!this.sys.isActive()) return;
                this.iconsReady = true;
                this.drawnBag = undefined;
                this.refresh();
            });
        }
    }

    override update(_time: number, delta: number): void {
        this.doll?.update(delta);
        this.updateBars();
        const input = this.inputSystem;
        input.update();
        // Picked up, drunk or worn meanwhile (the world goes on): draw it all again.
        const saved = offSaveStore.character;
        if (this.drawnBag !== saved.bag || this.drawnEquipment !== saved.equipment || this.drawnGold !== saved.gold) this.refresh();
        this.page?.update();
        if (!this.ready()) return;
        // A page may use B or X itself (Magic: RT + B / RT + X put a spell on a key).
        const pageUsed = this.page?.handleInput(input) ?? false;
        if (!pageUsed && (input.justPressed(Action.Back) || input.justPressed(Action.Pause) || input.justPressed(Action.OffInventory) || input.justPressed(Action.OffSpellBook))) {
            this.close();
            return;
        }
        if (pageUsed) return;
        if (input.justPressed(Action.MenuLeft)) this.move(-1, 0);
        else if (input.justPressed(Action.MenuRight)) this.move(1, 0);
        else if (input.justPressed(Action.MenuUp)) this.move(0, -1);
        else if (input.justPressed(Action.MenuDown)) this.move(0, 1);
        if (this.tab === 'bag' && input.justPressed(Action.OffDrop)) this.dropButton.press();
        if (input.justPressed(Action.Pick)) this.pressFocused();
    }

    private get bag(): readonly OffBagItemKey[] {
        return offSaveStore.character.bag;
    }

    private get equipment(): Readonly<OffEquipment> {
        return offSaveStore.character.equipment;
    }

    private get wearer(): OffWearer {
        return { str: offSaveStore.character.stats.str, level: offSaveStore.level };
    }

    // ---------------------------------------------------------------- building

    private createHeader(): void {
        const x = W.x + W.pad;
        const right = W.x + W.w - W.pad;
        const top = W.y + W.titleTop;
        const saved = offSaveStore.character;
        const city = saved.faction ? saved.faction.charAt(0).toUpperCase() + saved.faction.slice(1) : undefined;
        const close = S.tabHeight;
        const tabY = top + (W.headerH - S.tabHeight) / 2;
        const count = this.tabs.length;
        const tabX = right - close - S.textInset * 2 - count * W.tabW - (count - 1) * W.tabGap;
        offText(this, x, top, saved.name, 'title', { maxWidth: tabX - x - S.padding });
        offText(this, x, top + W.subtitleGap, OFF_BAG_TEXT.subtitle(city, offSaveStore.level), 'small', { maxWidth: tabX - x - S.padding });
        offRule(this, x, top + W.headerH, right - x, C.line);
        this.tabs.forEach((tab, i) => {
            const button = offTab(this, tabX + i * (W.tabW + W.tabGap), tabY, W.tabW, OFF_BAG_TEXT.tabs[tab], () => this.showTab(tab));
            button.setOn(tab === this.tab);
            this.tabButtons.push(button);
        });
        this.closeButton = offCloseButton(this, right - close, tabY, close, () => this.close());
    }

    private createCharacter(): void {
        const top = W.top;
        const h = W.bottom - top;
        offFrame(this, CH.x, top, CH.w, h);
        const inX = CH.x + S.padding;
        const inW = CH.w - S.padding * 2;
        offLabel(this, inX, top + S.padding, OFF_BAG_TEXT.equipmentLabel);
        const slotsTop = top + S.padding + CH.labelGap;
        SLOTS.forEach((slot, i) => {
            const side = Math.floor(i / SLOTS_PER_SIDE);
            const row = i % SLOTS_PER_SIDE;
            const x = side === 0 ? inX : CH.x + CH.w - S.padding - CH.slot;
            const y = slotsTop + row * (CH.slot + CH.slotGap);
            const cell = offCell(this, x, y, CH.slot, () => this.clickSlot(i));
            const name = OFF_BAG_TEXT.slotNames[slot ?? 'ring'];
            const label = offText(this, x + CH.slot / 2, y + CH.slot / 2, name, 'small', {
                color: INK.faint, originX: 0.5, originY: 0.5, maxWidth: CH.slot - S.textInset,
            });
            if (!slot) cell.setEnabled(false);
            this.slotCells.push(cell);
            this.slotLabels.push(label);
        });
        // Bars at the bottom of the column.
        const barH = offBarHeight(this);
        const step = barH + CH.barGap;
        let by = W.bottom - S.padding - 4 * step + CH.barGap;
        const bar = (label: string, color: number): OffBar => {
            const b = offBar(this, inX, by, inW, label, color);
            by += step;
            return b;
        };
        this.bars = { hp: bar('Health', C.health), mana: bar('Mana', C.mana), stamina: bar('Stamina', C.stamina), exp: bar('Exp', C.exp) };
    }

    private buildDoll(): void {
        this.doll?.destroy();
        this.doll = new PaperDoll(this, OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(this.equipment), {
            x: CH.x + CH.doll.x, y: W.top + CH.doll.y, scale: CH.doll.scale,
            standInX: CH.x + CH.standIn.x, standInY: W.top + CH.standIn.y,
        });
    }

    private createBag(): void {
        const step = G.cell + G.gap;
        const wellW = G.columns * step - G.gap + G.wellPad * 2;
        const wellH = G.rows * step - G.gap + G.wellPad * 2;
        const top = W.top;
        offBox(this, G.x, top, wellW, wellH, C.well, C.line);
        for (let i = 0; i < G.columns * G.rows; i += 1) {
            const x = G.x + G.wellPad + (i % G.columns) * step;
            const y = top + G.wellPad + Math.floor(i / G.columns) * step;
            this.cells.push(offCell(this, x, y, G.cell, () => this.clickCell(i)));
        }
        // Filters: vertical tabs right of the well; the item count under them.
        const fx = G.x + wellW + G.filterGap;
        const fw = W.x + W.w - W.pad - fx;
        FILTERS.forEach((f, i) => {
            this.filterTabs.push(offTab(this, fx, top + i * G.filterStep, fw, OFF_BAG_TEXT.filters[f], () => this.setFilter(f, i), G.filterH));
        });
        this.countText = offText(this, fx + fw / 2, top + wellH, '', 'small', { originX: 0.5, originY: 1, maxWidth: fw });
        // Gold on the left under the bag, potions on the right.
        const gy = top + wellH + G.goldGap;
        const goldLabel = offText(this, G.x, gy, OFF_BAG_TEXT.goldLabel, 'body', { color: INK.dim });
        this.goldText = offText(this, G.x + goldLabel.width + S.rowGap, gy, '', 'body', { color: INK.gold });
        this.potionsText = offText(this, G.x + wellW, gy, '', 'body', { color: INK.dim, originX: 1 });
    }

    private createCard(): void {
        const step = G.cell + G.gap;
        const wellH = G.rows * step - G.gap + G.wellPad * 2;
        const goldLineH = this.goldText.height;
        const x = G.x;
        const y = W.top + wellH + G.goldGap + goldLineH + CARD.gap;
        const w = W.x + W.w - W.pad - x;
        const h = W.bottom - y;
        offFrame(this, x, y, w, h);
        const pad = S.cardPadding;
        const tile = S.iconTile;
        const inX = x + pad;
        const tileY = y + S.padding;
        offBox(this, inX, tileY, tile, tile, C.cell, C.bronze);
        const icon = this.add.image(inX + tile / 2, tileY + tile / 2, '__DEFAULT').setVisible(false);
        // Buttons on the right of the header: Equip at the far right, Drop apart on its left.
        const by = tileY + (tile - S.buttonHeight) / 2;
        const mainX = x + w - pad - S.buttonWidth;
        const dropX = mainX - CARD.buttonsGap - S.buttonWidth;
        this.dropButton = offButton(this, dropX, by, OFF_BAG_TEXT.dropButton, 'danger', () => this.pressDrop());
        this.mainButton = offButton(this, mainX, by, OFF_BAG_TEXT.equipButton, 'main', () => this.pressMain());
        const nameX = inX + tile + S.padding;
        const nameRoom = dropX - S.padding - nameX;
        const name = offText(this, nameX, tileY + 1, '', 'name', { maxWidth: nameRoom });
        const kind = offLabel(this, nameX, tileY + CARD.kindGap, '', { maxWidth: nameRoom });
        const dividerY = tileY + tile + CARD.dividerGap;
        offDivider(this, inX, dividerY, w - pad * 2);
        const rowsY = dividerY + CARD.rowsGap;
        const hint = offText(this, x + w / 2, (rowsY + y + h) / 2, '', 'body', { color: INK.dim, originX: 0.5, originY: 0.5 });
        this.card = { icon, name, kind, hint };
        this.cardArea = { x: inX, y, w: w - pad * 2, h, nameRoom, rowsY };
    }

    // ---------------------------------------------------------------- drawing

    /** Cells, slots, gold, the marks and the card. */
    private refresh(): void {
        const saved = offSaveStore.character;
        const gearChanged = this.drawnEquipment !== saved.equipment;
        this.drawnBag = saved.bag;
        this.drawnEquipment = saved.equipment;
        this.drawnGold = saved.gold;
        if (gearChanged || !this.doll) this.buildDoll();
        if (this.tab !== 'bag') {
            this.setFocus(this.focus);
            return;
        }
        this.shown = this.bag.map((_id, index) => index).filter((index) => this.passes(this.bag[index]));
        // The selected item left the bag (used, dropped, worn): select what is now in that cell.
        if (this.selected?.kind === 'bag' && this.selected.index >= this.bag.length) {
            this.selected = this.focus.kind === 'cell' && this.shown[this.focus.i] !== undefined
                ? { kind: 'bag', index: this.shown[this.focus.i] ?? 0 }
                : undefined;
        }
        this.drawCells();
        this.drawSlots();
        this.filterTabs.forEach((t, i) => t.setOn(FILTERS[i] === this.filter));
        this.goldText.setText(OFF_BAG_TEXT.gold(saved.gold));
        this.potionsText.setText(OFF_BAG_TEXT.potions(offSaveStore.potionCount, OFF_LOOT.potionLimit));
        this.countText.setText(OFF_BAG_TEXT.items(this.bag.length, OFF_LOOT.bagSize));
        this.setFocus(this.focus);
    }

    private passes(id: OffBagItemKey | undefined): boolean {
        if (id === undefined) return false;
        if (this.filter === 'all') return true;
        if (!isOffGearKey(id)) return this.filter === 'potion' && offGood(id).restores !== undefined;
        const slot = offGearDef(id).slot;
        return this.filter === 'weapon' ? slot === 'weapon' : this.filter === 'armor' && slot !== 'weapon';
    }

    private drawCells(): void {
        const who = this.wearer;
        const forSlot = this.selected?.kind === 'slot' ? this.selected.slot : undefined;
        const marked = this.selected?.kind === 'bag' ? this.selected.index : undefined;
        this.cells.forEach((cell, i) => {
            const index = this.shown[i];
            const id = index === undefined ? undefined : this.bag[index];
            cell.setMarked(index !== undefined && index === marked);
            cell.setUnmet(id !== undefined && isOffGearKey(id) && offWearCheck(id, who) !== 'ok');
            this.setIcon(cell.icon, id, G.iconRoom);
            // A slot is marked: what doesn't go in it is dimmed.
            const fits = forSlot === undefined || (id !== undefined && isOffGearKey(id) && offGearDef(id).slot === forSlot);
            cell.icon.setAlpha(fits ? 1 : G.dimAlpha);
        });
    }

    private drawSlots(): void {
        const marked = this.selected?.kind === 'slot' ? this.selected.slot : undefined;
        SLOTS.forEach((slot, i) => {
            const cell = this.slotCells[i];
            if (!cell) return;
            const id = slot ? this.equipment[slot] : undefined;
            cell.setMarked(slot !== undefined && slot === marked);
            this.setIcon(cell.icon, id, CH.iconRoom);
            this.slotLabels[i]?.setVisible(id === undefined);
        });
    }

    private setIcon(image: Phaser.GameObjects.Image, id: OffBagItemKey | undefined, room: number): void {
        const frame = id !== undefined && this.iconsReady ? offBagItemPicture(id, offSaveStore.character.look.gender) : undefined;
        if (!frame || id === undefined) {
            image.setVisible(false);
            return;
        }
        setColouredTexture(image, itemPackTexture(frame.sheet), frame.frame, offItemTint(id));
        image.setVisible(true);
        image.setScale(Math.min(1, room / Math.max(image.frame.width, image.frame.height)));
    }

    /** Health, mana, stamina and experience, now (the world goes on underneath). */
    private updateBars(): void {
        const battle = this.params.battle;
        const v = battle.vitals;
        const level = offSaveStore.level;
        const set = (key: keyof OffBagScene['barTexts'], text: string, ratio: number): void => {
            if (this.barTexts[key] === text) return;
            this.barTexts[key] = text;
            this.bars[key].setValue(text, ratio);
        };
        set('hp', `${Math.ceil(battle.hp)} / ${battle.maxHp}`, battle.hp / battle.maxHp);
        set('mana', `${Math.ceil(v.mana)} / ${v.maxMana}`, v.maxMana > 0 ? v.mana / v.maxMana : 0);
        set('stamina', `${Math.ceil(v.stamina)} / ${v.maxStamina}`, v.maxStamina > 0 ? v.stamina / v.maxStamina : 0);
        if (level >= OFF_LEVEL.max) {
            set('exp', OFF_BAG_TEXT.expMax, 1);
        } else {
            const exp = offSaveStore.character.exp;
            const from = offExpForLevel(level);
            const to = offExpForLevel(level + 1);
            set('exp', OFF_BAG_TEXT.expToNext(Math.max(0, to - exp), level + 1), to > from ? (exp - from) / (to - from) : 0);
        }
    }

    /** The card of what is selected, and what its buttons do. */
    private drawCard(): void {
        this.cardRows.forEach((r) => r.destroy());
        this.cardRows = [];
        const sel = this.selected;
        let card: OffItemCard | undefined;
        let pictureOf: OffBagItemKey | undefined;
        let main: MainAction | undefined;
        let canDrop = false;
        let wearable = true;
        const who = this.wearer;
        if (sel?.kind === 'bag') {
            const id = this.bag[sel.index];
            if (id !== undefined) {
                const worn = isOffGearKey(id) ? this.equipment[offGearDef(id).slot] : undefined;
                card = offItemCard(id, worn, who);
                pictureOf = id;
                canDrop = true;
                if (isOffGearKey(id)) {
                    main = 'equip';
                    wearable = offWearCheck(id, who) === 'ok';
                } else main = offGood(id).restores ? 'drink' : 'use';
            }
        } else if (sel?.kind === 'slot') {
            const worn = this.equipment[sel.slot];
            if (worn) {
                card = offItemCard(worn, worn, who, true);
                pictureOf = worn;
                main = 'remove';
            } else {
                card = offEmptySlotCard(sel.slot, EQUIP_SLOT_NAMES[sel.slot], who);
            }
        }
        this.mainAction = main;
        const label = main === 'drink' ? OFF_BAG_TEXT.drinkButton : main === 'use' ? OFF_BAG_TEXT.useButton : main === 'remove' ? OFF_BAG_TEXT.removeButton : OFF_BAG_TEXT.equipButton;
        this.mainButton.setLabel(label);
        this.mainButton.setEnabled(main !== undefined && main !== 'use' && wearable);
        this.dropButton.setEnabled(canDrop);
        this.setIcon(this.card.icon, pictureOf, S.iconTile - 4);
        const a = this.cardArea;
        this.card.name.setText(card?.name ?? '').setColor(card?.nameColor ?? INK.text);
        offFitText(this.card.name, 'name', a.nameRoom);
        this.card.kind.setText((card?.kind ?? '').toUpperCase());
        offFitText(this.card.kind, 'label', a.nameRoom);
        this.card.hint.setText(card ? '' : this.bag.length === 0 ? OFF_BAG_TEXT.empty : OFF_BAG_TEXT.pickHint);
        offFitText(this.card.hint, 'body', a.w);
        this.cardTexts = card ? [card.name, card.kind] : [this.card.hint.text];
        (card?.rows ?? []).forEach((row, i) => {
            const y = a.rowsY + i * S.rowHeight;
            this.cardTexts.push([row.label, row.value, row.note ? `(${row.note})` : ''].filter(Boolean).join(' '));
            if (row.value === '') {
                const t = offText(this, a.x, y + S.rowHeight / 2, row.label, 'body', { color: INK.dim, originY: 0.5, maxWidth: a.w });
                this.cardRows.push(t);
                return;
            }
            this.cardRows.push(offStatRow(this, a.x, y, a.w, row.label, row.value, row.color, row.note, row.trend));
        });
    }

    // ---------------------------------------------------------------- focus

    private control(focus: Focus): OffControl | undefined {
        switch (focus.kind) {
            case 'cell': return this.cells[focus.i];
            case 'slot': return this.slotCells[focus.i];
            case 'filter': return this.filterTabs[focus.i];
            case 'button': return focus.id === 'drop' ? this.dropButton : this.mainButton;
            case 'tab': return this.tabButtons[focus.i];
            case 'close': return this.closeButton;
        }
    }

    /** Moves the ring; a cell or a slot also becomes what the card shows. */
    private setFocus(focus: Focus): void {
        this.control(this.focus)?.setFocused(false);
        this.focus = focus;
        if (focus.kind === 'cell') {
            const index = this.shown[focus.i];
            this.selected = index === undefined ? undefined : { kind: 'bag', index };
        } else if (focus.kind === 'slot') {
            const slot = SLOTS[focus.i];
            if (slot) this.selected = { kind: 'slot', slot };
        }
        this.control(focus)?.setFocused(true);
        if (this.tab !== 'bag') return;
        this.drawCells();
        this.drawSlots();
        this.drawCard();
    }

    /** Arrows / d-pad round the whole window: every piece can be reached and left (the edges stop). */
    private move(dx: number, dy: number): void {
        const f = this.focus;
        if (f.kind === 'tab' || f.kind === 'close') {
            this.moveInHeader(dx, dy);
            return;
        }
        if (this.page) {
            if (!this.page.move(dx, dy)) this.toHeader();
            return;
        }
        const lastRow = G.rows - 1;
        const lastCol = G.columns - 1;
        switch (f.kind) {
            case 'cell': {
                const col = f.i % G.columns;
                const row = Math.floor(f.i / G.columns);
                if (dx < 0 && col === 0) this.setFocus({ kind: 'slot', i: this.activeSlot(1, row) });
                else if (dx > 0 && col === lastCol) this.setFocus({ kind: 'filter', i: Math.min(row, FILTERS.length - 1) });
                else if (dx !== 0) this.setFocus({ kind: 'cell', i: f.i + dx });
                else if (dy < 0 && row === 0) this.toHeader();
                else if (dy > 0 && row === lastRow) this.setFocus({ kind: 'button', id: col < G.columns / 2 ? 'drop' : 'main' });
                else this.setFocus({ kind: 'cell', i: f.i + dy * G.columns });
                return;
            }
            case 'slot': {
                const side = Math.floor(f.i / SLOTS_PER_SIDE);
                const row = f.i % SLOTS_PER_SIDE;
                if (dx > 0 && side === 1) this.setFocus({ kind: 'cell', i: row * G.columns });
                else if (dx > 0) this.setFocus({ kind: 'slot', i: this.activeSlot(1, row) });
                else if (dx < 0 && side === 1) this.setFocus({ kind: 'slot', i: row });
                else if (dy < 0 && row === 0) this.toHeader();
                else if (dy !== 0) {
                    const next = row + dy;
                    // The ring is still to come: skip it.
                    if (next >= 0 && next < SLOTS_PER_SIDE && SLOTS[side * SLOTS_PER_SIDE + next] !== undefined) this.setFocus({ kind: 'slot', i: side * SLOTS_PER_SIDE + next });
                }
                return;
            }
            case 'filter': {
                if (dx < 0) this.setFocus({ kind: 'cell', i: Math.min(f.i, lastRow) * G.columns + lastCol });
                else if (dy < 0 && f.i === 0) this.setFocus({ kind: 'close' });
                else if (dy > 0 && f.i === FILTERS.length - 1) this.setFocus({ kind: 'button', id: 'main' });
                else if (dy !== 0) this.setFocus({ kind: 'filter', i: f.i + dy });
                return;
            }
            case 'button': {
                if (dx > 0 && f.id === 'drop') this.setFocus({ kind: 'button', id: 'main' });
                else if (dx < 0 && f.id === 'main') this.setFocus({ kind: 'button', id: 'drop' });
                else if (dx < 0) this.setFocus({ kind: 'slot', i: SLOTS_PER_SIDE * 2 - 2 });
                else if (dx > 0) this.setFocus({ kind: 'filter', i: FILTERS.length - 1 });
                else if (dy < 0) this.setFocus({ kind: 'cell', i: lastRow * G.columns + (f.id === 'drop' ? 2 : lastCol - 2) });
                return;
            }
        }
    }

    /** The focus goes up to the open tab (the page lets go of its own). */
    private toHeader(): void {
        this.page?.blur();
        this.setFocus({ kind: 'tab', i: this.tabs.indexOf(this.tab) });
    }

    /** Header: ← → along the tabs and ✕; ↓ back into the page (from ✕ on Bag: the filters under it). */
    private moveInHeader(dx: number, dy: number): void {
        const f = this.focus;
        const at = f.kind === 'tab' ? f.i : this.tabs.length;
        if (dx !== 0) {
            const next = Phaser.Math.Clamp(at + dx, 0, this.tabs.length);
            this.setFocus(next === this.tabs.length ? { kind: 'close' } : { kind: 'tab', i: next });
            return;
        }
        if (dy <= 0) return;
        if (this.page) this.enterPage(this.page); else if (f.kind === 'close') this.setFocus({ kind: 'filter', i: 0 });
        else this.setFocus({ kind: 'cell', i: G.columns - 1 });
    }

    /** The focus leaves the header for the page's own (the scene keeps a non-header focus it never draws). */
    private enterPage(page: OffWindowPage): void {
        this.control(this.focus)?.setFocused(false);
        this.focus = { kind: 'cell', i: 0 };
        page.focusFirst();
    }

    /** Opens another tab: the window is built again on it, the unconfirmed points kept. */
    public showTab(tab: OffCharacterTab): void {
        if (!this.ready() || !this.tabs.includes(tab)) return;
        if (tab === this.tab) {
            this.setFocus({ kind: 'tab', i: this.tabs.indexOf(tab) });
            return;
        }
        this.scene.restart({ ...this.params, tab, pending: this.added, fromTab: true });
    }

    /** The slot at that side and row, or the lowest working one above it (the ring is still to come). */
    private activeSlot(side: number, row: number): number {
        for (let r = Math.min(row, SLOTS_PER_SIDE - 1); r > 0; r -= 1) {
            if (SLOTS[side * SLOTS_PER_SIDE + r] !== undefined) return side * SLOTS_PER_SIDE + r;
        }
        return side * SLOTS_PER_SIDE;
    }

    /** A / Enter: a cell or slot uses what it holds (equip, drink, remove); the rest press themselves. */
    private pressFocused(): void {
        const f = this.focus;
        if (f.kind === 'slot' && SLOTS[f.i] === undefined) return;
        if (this.page && f.kind !== 'tab' && f.kind !== 'close') this.page.pressFocused();
        else if (f.kind === 'cell' || f.kind === 'slot') this.mainButton.press();
        else this.control(f)?.press();
    }

    // ---------------------------------------------------------------- mouse

    private clickCell(i: number): void {
        if (!this.ready()) return;
        if (this.isDoubleClick(`cell${i}`)) {
            this.setFocus({ kind: 'cell', i });
            this.mainButton.press();
            return;
        }
        this.setFocus({ kind: 'cell', i });
    }

    private clickSlot(i: number): void {
        if (!this.ready()) return;
        this.setFocus({ kind: 'slot', i });
        if (this.isDoubleClick(`slot${i}`)) this.mainButton.press();
    }

    private isDoubleClick(key: string): boolean {
        const now = this.time.now;
        const twice = this.lastClick.key === key && now - this.lastClick.at <= G.doubleClickMs;
        this.lastClick = twice ? { key: '', at: 0 } : { key, at: now };
        return twice;
    }

    // ---------------------------------------------------------------- actions

    private pressMain(): void {
        if (!this.ready()) return;
        const sel = this.selected;
        if (sel?.kind === 'bag') this.showResult(this.use(sel.index));
        else if (sel?.kind === 'slot') this.showResult(this.remove(sel.slot));
    }

    private pressDrop(): void {
        if (!this.ready()) return;
        if (this.selected?.kind === 'bag') this.showResult(this.drop(this.selected.index));
    }

    /** Filter tab: the bag shows only that kind; the focus stays on the tab. */
    public setFilter(filter: OffBagFilter, tabIndex = FILTERS.indexOf(filter)): void {
        this.filter = filter;
        if (this.selected?.kind === 'bag' && !this.passes(this.bag[this.selected.index])) this.selected = undefined;
        this.control(this.focus)?.setFocused(false);
        this.focus = { kind: 'filter', i: tabIndex };
        this.refresh();
    }

    /** Development (`check offbag...`) and Equip / Drink: uses the item in that bag index. */
    public use(index: number): OffUseResult {
        const result = this.params.battle.useBagItem(index);
        if (result.gear) this.params.onGearChange();
        return result;
    }

    /** Development and Drop: drops the item in that bag index at the player's feet. */
    public drop(index: number): OffUseResult {
        return this.params.battle.dropBagItem(index);
    }

    /** Development and Remove: takes off what that slot wears (back to the bag). */
    public remove(slot: OffSlotId): OffUseResult {
        const worn = this.equipment[slot];
        if (!worn) return { done: false };
        const result = offSaveStore.unequip(slot);
        if (result === 'bagFull') return { done: false, line: OFF_BAG_TEXT.bagFull };
        if (result !== 'ok') return { done: false };
        this.params.onGearChange();
        return { done: true, gear: true, line: OFF_BAG_TEXT.removed(offItemCard(worn, worn, this.wearer, true).name) };
    }

    private showResult(result: OffUseResult): void {
        this.say(result.line ?? '');
        this.refresh();
    }

    /** The message line under the columns. */
    private say(line: string): void {
        this.messageText.setText(line);
        offFitText(this.messageText, 'small', W.w - W.pad * 2);
    }

    public close(): void {
        this.scene.stop();
        this.params.onClose();
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }

    // ---------------------------------------------------------------- development

    /** Marks the cell holding that bag index (filter All). */
    public debugMark(index: number): void {
        if (this.filter !== 'all') this.setFilter('all');
        this.setFocus({ kind: 'cell', i: index });
    }

    /** Marks a slot (the card shows what it wears). */
    public debugMarkSlot(slot: OffSlotId): void {
        this.setFocus({ kind: 'slot', i: SLOTS.indexOf(slot) });
    }

    /** The Stats or Magic page, for `check offstats` / `offmagic`. */
    public get debugPage(): OffWindowPage | undefined {
        return this.page;
    }

    /** Pad / arrows, for `check offbagpad`: 'left' | 'right' | 'up' | 'down' | 'a'. */
    public debugInput(key: 'left' | 'right' | 'up' | 'down' | 'a'): string {
        if (key === 'a') this.pressFocused();
        else this.move(key === 'left' ? -1 : key === 'right' ? 1 : 0, key === 'up' ? -1 : key === 'down' ? 1 : 0);
        return this.focusName();
    }

    private focusName(): string {
        const f = this.focus;
        if (f.kind === 'tab') return `tab ${this.tabs[f.i] ?? ''}`;
        if (this.page && f.kind !== 'close') return this.page.focusName();
        if (f.kind === 'cell') return `cell ${f.i}`;
        if (f.kind === 'slot') return `slot ${SLOTS[f.i] ?? 'ring'}`;
        if (f.kind === 'filter') return `filter ${FILTERS[f.i]}`;
        if (f.kind === 'button') return `button ${f.id}`;
        return 'close';
    }

    /** What the window shows, in text. */
    public debugState(): {
        tab: OffCharacterTab; tabs: OffCharacterTab[]; page: Record<string, unknown> | undefined;
        bag: string[]; info: string; message: string; box: string[]; filter: OffBagFilter; focus: string; main: string; issues: string[];
    } {
        return {
            tab: this.tab,
            tabs: [...this.tabs],
            page: this.page?.debugState(),
            bag: [...this.bag],
            info: this.tab === 'bag' ? `Gold ${this.goldText.text} · ${this.potionsText.text} · ${this.countText.text}` : '',
            message: this.messageText.text,
            box: [...this.cardTexts],
            filter: this.filter,
            focus: this.focusName(),
            main: this.mainAction ?? '',
            issues: offLayoutIssues(this),
        };
    }
}

function noPoints(): OffStats {
    const out = {} as OffStats;
    for (const id of OFF_STAT_IDS) out[id] = 0;
    return out;
}
