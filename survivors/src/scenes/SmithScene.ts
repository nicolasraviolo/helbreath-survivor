// Herrero Tom (Fase 24C; lista y precios en data/smith.ts, medidas en config/smith.ts). Se abre desde su panel en la
// ciudad, que espera en pausa debajo. Misma forma que la tienda (ShopScene), sobre el panel del martillo:
// - Buy: armas (o varitas) y armaduras básicas de la clase, por huecos. Lo que el personaje no puede ponerse aún sale
//   con el requisito en rojo y Purchase apagado. Lo comprado va al inventario.
// - Sell: el inventario del personaje (no lo puesto ni el baúl), agrupado ("×3"). Hay que pulsar Sell dos veces.
// - Upgrade (Fase 24D): el arma o varita puesta y las del inventario, con el oro del siguiente "+" (o "Max"). Pide
//   1 Stone of Xelima del inventario; hay que pulsar Upgrade dos veces. Siempre sale bien.
// - La lista se desplaza: rueda, flechas o mando (la elección siempre a la vista), ▲/▼ o arrastrando el dedo.
// - Izquierda/derecha sobre la lista cambia de pestaña; también un clic en "Buy" / "Sell" / "Upgrade".
import Phaser from 'phaser';
import { itemPackTexture } from '../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { MENU_INPUT_DELAY_MS } from '../config/menus';
import { SHOP_COLORS, SHOP_DETAIL_STYLE, SHOP_GOLD_STYLE, SHOP_HEADER_STYLE, SHOP_ROW_STYLE, SHOP_SECTION_STYLE } from '../config/shop';
import { SMITH_BANNERS, SMITH_BUTTONS, SMITH_LAYOUT, SMITH_COLORS, SMITH_PANEL, SMITH_UPGRADE_SOUND } from '../config/smith';
import { ATTRIBUTES } from '../data/attributes';
import { XELIMA_STONE_ID } from '../data/consumables';
import { formatGold } from '../data/gold';
import { canEquip, describeItem, EQUIP_SLOT_NAMES, itemDamageBonus, itemInfo, itemPicture, ownedItemName, requirementChecks, type EquipSlotId, type ItemId } from '../data/items';
import { sameOwnedItem, type OwnedItem } from '../data/loot';
import {
    smithBuyPrice, smithBuysFromYou, smithSellPrice, smithStock, smithUpgradePrice, SMITH_TABS, SMITH_TEXT, type SmithTab,
} from '../data/smith';
import { canUpgrade, upgradeOf, UPGRADE_MAX, UPGRADE_STONES_PER_LEVEL } from '../data/upgrades';
import { AudioSystem } from '../systems/AudioSystem';
import { characterStore, permanentStats, wornItem, type SavedCharacter } from '../systems/CharacterStore';
import { goldStore } from '../systems/GoldStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { lookLoader } from '../systems/LookLoader';
import type { MenuOverlayData } from './MenuOverlayScene';
import { toGame } from '../ui/renderScale';

export const SMITH_SCENE_KEY = 'Smith';

export interface SmithSceneData {
    /** The character walking the town: it buys and sells. Undefined with no saved character. */
    characterUid: string | undefined;
    /** The tab it opens on (Buy by default). */
    tab?: SmithTab;
}

/** One line of the list: a section title, or something to buy, sell or upgrade (worn in `slot`, or in the inventory). */
type Line =
    | { kind: 'section'; title: string }
    | { kind: 'buy'; id: ItemId }
    | { kind: 'sell'; item: OwnedItem; count: number }
    | { kind: 'upgrade'; item: OwnedItem; count: number; slot: EquipSlotId | undefined };

const TAB_LABELS: Readonly<Record<SmithTab, string>> = { buy: 'Buy', sell: 'Sell', upgrade: 'Upgrade' };

type ItemLine = Exclude<Line, { kind: 'section' }>;

/** The objects of one visible row, reused while scrolling. */
interface RowSlot {
    background: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
    name: Phaser.GameObjects.Text;
    price: Phaser.GameObjects.Text;
    section: Phaser.GameObjects.Text;
}

type Focus = { kind: 'row' } | { kind: 'action' } | { kind: 'cancel' };

export class SmithScene extends Phaser.Scene {
    private uid: string | undefined;
    private returnTo = '';
    private openedAt = 0;
    private tab: SmithTab = 'buy';
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private lines: Line[] = [];
    /** Index in `lines` of the chosen item (-1 with nothing to choose). */
    private selected = -1;
    /** First line shown. */
    private scroll = 0;
    private focus: Focus = { kind: 'row' };
    private slots: RowSlot[] = [];
    private banner!: Phaser.GameObjects.Image;
    private tabTexts = new Map<SmithTab, Phaser.GameObjects.Text>();
    private tabLine!: Phaser.GameObjects.Rectangle;
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private arrowUp!: Phaser.GameObjects.Text;
    private arrowDown!: Phaser.GameObjects.Text;
    private detail!: Phaser.GameObjects.Text;
    private requirements!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private action!: Phaser.GameObjects.Image;
    private cancel!: Phaser.GameObjects.Image;
    /** A message that replaces the description until the choice changes. */
    private notice: string | undefined;
    /** The line waiting for its second press (a sale or an upgrade is confirmed by pressing the button again). */
    private confirming: number | undefined;
    private iconsReady = false;
    /** Finger drag over the list: where it started and whether it scrolled (then it chooses nothing). */
    private dragY: number | undefined;
    private dragged = false;

    constructor() {
        super(SMITH_SCENE_KEY);
    }

    init(data: SmithSceneData & MenuOverlayData): void {
        this.uid = data.characterUid;
        this.returnTo = data.returnTo;
        this.tab = data.tab ?? 'buy';
        this.lines = [];
        this.slots = [];
        this.tabTexts = new Map();
        this.selected = -1;
        this.scroll = 0;
        this.focus = { kind: 'row' };
        this.notice = undefined;
        this.confirming = undefined;
        this.dragY = undefined;
        this.dragged = false;
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.audio = new AudioSystem(this);
        const s = SMITH_PANEL.scale;
        const l = SMITH_LAYOUT;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, SMITH_PANEL.shadeAlpha).setOrigin(0);
        this.add.image(this.left, this.top, SMITH_PANEL.texture, SMITH_PANEL.frame).setOrigin(0).setScale(s);
        this.banner = this.add.image(this.x(SMITH_PANEL.width / 2), this.top, SMITH_BANNERS.texture, SMITH_BANNERS.buy.frame)
            .setOrigin(0.5, 0).setScale(s);

        for (const tab of SMITH_TABS) {
            const text = this.add.text(this.x(l.tabX[tab]), this.y(l.tabsY), TAB_LABELS[tab], SHOP_SECTION_STYLE)
                .setOrigin(0.5).setInteractive({ useHandCursor: true });
            text.on(Phaser.Input.Events.POINTER_UP, () => {
                if (this.ready()) this.setTab(tab);
            });
            this.tabTexts.set(tab, text);
        }
        this.tabLine = this.add.rectangle(0, this.y(l.tabsY + 8), 1, 2, SHOP_COLORS.selectedBorder).setOrigin(0.5);
        this.add.text(this.x(l.nameX), this.y(l.headerY), 'ITEM', SHOP_HEADER_STYLE).setOrigin(0, 0.5);
        this.add.text(this.x(l.priceX), this.y(l.headerY), 'PRICE', SHOP_HEADER_STYLE).setOrigin(1, 0.5);
        this.focusFrame = this.add.rectangle(0, 0, 1, 1, SHOP_COLORS.selectedFill, SHOP_COLORS.selectedAlpha).setOrigin(0);
        this.buildSlots();
        this.arrowUp = this.createArrow('▲', l.listTop + 6, -1);
        this.arrowDown = this.createArrow('▼', l.listTop + l.visibleRows * l.rowHeight - 6, 1);

        this.detail = this.add.text(this.x(SMITH_PANEL.width / 2), this.y(l.detailY), '', {
            ...SHOP_DETAIL_STYLE, align: 'center', wordWrap: { width: l.detailWidth * s },
        }).setOrigin(0.5, 0);
        this.requirements = this.add.text(this.x(SMITH_PANEL.width / 2), 0, '', { ...SHOP_DETAIL_STYLE, fontStyle: 'bold', align: 'center' })
            .setOrigin(0.5, 0);
        this.goldText = this.add.text(this.x(SMITH_PANEL.width / 2), this.y(l.goldY), '', SHOP_GOLD_STYLE).setOrigin(0.5);
        this.action = this.createButton(-l.buttonGap, { kind: 'action' }, () => this.act());
        this.cancel = this.createButton(l.buttonGap, { kind: 'cancel' }, () => this.close());
        this.setupDrag();

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
        this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => this.scrollBy(Math.sign(dy)));
        this.setTab(this.tab);
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
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.MenuUp)) this.moveVertically(-1);
        if (input.justPressed(Action.MenuDown)) this.moveVertically(1);
        if (input.justPressed(Action.MenuLeft)) this.moveSideways(-1);
        if (input.justPressed(Action.MenuRight)) this.moveSideways(1);
        if (input.justPressed(Action.Pick)) this.press();
    }

    // ---- Layout ----

    private get left(): number {
        return Math.round(GAME_WIDTH / 2 - (SMITH_PANEL.width * SMITH_PANEL.scale) / 2);
    }

    private get top(): number {
        return Math.round(GAME_HEIGHT / 2 - (SMITH_PANEL.height * SMITH_PANEL.scale) / 2);
    }

    private x(panelX: number): number {
        return this.left + panelX * SMITH_PANEL.scale;
    }

    private y(panelY: number): number {
        return this.top + panelY * SMITH_PANEL.scale;
    }

    private get character(): Readonly<SavedCharacter> | undefined {
        return characterStore.byUid(this.uid);
    }

    // ---- Building ----

    /** The visible rows: always the same objects, filled with the lines in view. */
    private buildSlots(): void {
        const l = SMITH_LAYOUT;
        const s = SMITH_PANEL.scale;
        for (let i = 0; i < l.visibleRows; i++) {
            const rowTop = l.listTop + i * l.rowHeight;
            const middle = this.y(rowTop + l.rowHeight / 2);
            const background = this.add.rectangle(this.x(l.left), this.y(rowTop), (l.right - l.left) * s, l.rowHeight * s - 2, SHOP_COLORS.hoverFill, 0)
                .setOrigin(0).setInteractive({ useHandCursor: true });
            const slot: RowSlot = {
                background,
                icon: this.add.image(this.x(l.iconX), middle, '__DEFAULT').setVisible(false),
                name: this.add.text(this.x(l.nameX), middle, '', SHOP_ROW_STYLE).setOrigin(0, 0.5),
                price: this.add.text(this.x(l.priceX), middle, '', SHOP_ROW_STYLE).setOrigin(1, 0.5),
                section: this.add.text(this.x(SMITH_PANEL.width / 2), middle, '', SHOP_SECTION_STYLE).setOrigin(0.5),
            };
            background.on(Phaser.Input.Events.POINTER_OVER, () => {
                if (this.lineAt(i)?.kind !== 'section' && this.scroll + i !== this.selected) background.setFillStyle(SHOP_COLORS.hoverFill, SHOP_COLORS.hoverAlpha);
            });
            background.on(Phaser.Input.Events.POINTER_OUT, () => background.setFillStyle(SHOP_COLORS.hoverFill, 0));
            background.on(Phaser.Input.Events.POINTER_UP, () => {
                if (!this.ready() || this.dragged) return;
                const index = this.scroll + i;
                if (this.lines[index] && this.lines[index].kind !== 'section') this.choose(index);
            });
            this.slots.push(slot);
        }
    }

    private createArrow(label: string, panelY: number, direction: number): Phaser.GameObjects.Text {
        const arrow = this.add.text(this.x(SMITH_LAYOUT.arrowX), this.y(panelY), label, SHOP_HEADER_STYLE)
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        arrow.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.scrollBy(direction);
        });
        return arrow;
    }

    private createButton(offset: number, focus: Focus, onPress: () => void): Phaser.GameObjects.Image {
        const frame = focus.kind === 'cancel' ? SMITH_BUTTONS.cancel : SMITH_BUTTONS.purchase;
        const button = this.add.image(this.x(SMITH_PANEL.width / 2 + offset), this.y(SMITH_LAYOUT.buttonsY), SMITH_BUTTONS.texture, frame)
            .setOrigin(0.5).setScale(SMITH_PANEL.scale);
        button.setInteractive({ useHandCursor: true });
        button.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus(focus));
        button.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) onPress();
        });
        return button;
    }

    /** A finger moving up or down over the list scrolls it (one row every dragRowPx). */
    private setupDrag(): void {
        const l = SMITH_LAYOUT;
        const top = this.y(l.listTop);
        const bottom = this.y(l.listTop + l.visibleRows * l.rowHeight);
        const step = l.dragRowPx * SMITH_PANEL.scale;
        this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
            this.dragged = false;
            const y = toGame(pointer.y);
            this.dragY = y >= top && y <= bottom ? y : undefined;
        });
        this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
            if (this.dragY === undefined || !pointer.isDown) return;
            const rows = Math.trunc((this.dragY - toGame(pointer.y)) / step);
            if (rows === 0) return;
            this.dragged = true;
            this.dragY -= rows * step;
            this.scrollBy(rows);
        });
        this.input.on(Phaser.Input.Events.POINTER_UP, () => {
            this.dragY = undefined;
            // Cleared after the rows' own POINTER_UP has read it.
            this.time.delayedCall(0, () => (this.dragged = false));
        });
    }

    // ---- Lines ----

    private buildLines(): Line[] {
        const character = this.character;
        if (!character) return [];
        const lines: Line[] = [];
        if (this.tab === 'buy') {
            for (const section of smithStock(character.classId)) {
                lines.push({ kind: 'section', title: EQUIP_SLOT_NAMES[section.slot] });
                for (const id of section.items) lines.push({ kind: 'buy', id });
            }
            return lines;
        }
        if (this.tab === 'upgrade') {
            // The weapon or wand worn, then those of the inventory.
            const worn = wornItem(character, 'weapon');
            if (worn && canUpgrade(worn.id)) {
                lines.push({ kind: 'section', title: SMITH_TEXT.worn });
                lines.push({ kind: 'upgrade', item: worn, count: 1, slot: 'weapon' });
            }
            const owned = groupInventory(character, (item) => canUpgrade(item.id));
            if (owned.length > 0) lines.push({ kind: 'section', title: SMITH_TEXT.inventory });
            for (const entry of owned) lines.push({ kind: 'upgrade', ...entry, slot: undefined });
            return lines;
        }
        // Sell: the inventory, the same item with the same attribute and "+" counted once.
        for (const entry of groupInventory(character, (item) => smithBuysFromYou(item.id))) lines.push({ kind: 'sell', ...entry });
        return lines;
    }

    private lineAt(row: number): Line | undefined {
        return this.lines[this.scroll + row];
    }

    private itemIndexes(): number[] {
        return this.lines.flatMap((line, index) => (line.kind === 'section' ? [] : [index]));
    }

    private setTab(tab: SmithTab): void {
        this.tab = tab;
        this.notice = undefined;
        this.confirming = undefined;
        this.lines = this.buildLines();
        this.selected = this.itemIndexes()[0] ?? -1;
        this.scroll = 0;
        this.focus = { kind: 'row' };
        const banner = SMITH_BANNERS[tab];
        this.banner.setFrame(banner.frame, true, false).setOrigin(0.5, 0);
        for (const [key, text] of this.tabTexts) text.setColor(key === tab ? SHOP_COLORS.heading : SMITH_COLORS.tabOff);
        this.tabLine.setX(this.x(SMITH_LAYOUT.tabX[tab])).setSize(this.tabTexts.get(tab)?.width ?? 1, 2);
        // Same size for Purchase, Sell and Upgrade: the button keeps its place.
        this.refresh();
    }

    /**
     * After buying, selling or upgrading: the lines again, keeping the choice as close as it was (or on the line `follow`
     * picks, e.g. the sword just upgraded).
     */
    private rebuild(follow?: (line: Line) => boolean): void {
        const before = this.selected;
        this.lines = this.buildLines();
        const items = this.itemIndexes();
        const followed = follow ? this.lines.findIndex(follow) : -1;
        this.selected = followed >= 0 ? followed : items.find((index) => index >= before) ?? items[items.length - 1] ?? -1;
        this.keepVisible();
        this.refresh();
    }

    // ---- Drawing ----

    private refresh(): void {
        const l = SMITH_LAYOUT;
        const maxScroll = Math.max(0, this.lines.length - l.visibleRows);
        this.scroll = Phaser.Math.Clamp(this.scroll, 0, maxScroll);
        this.slots.forEach((slot, row) => this.drawSlot(slot, this.lineAt(row)));
        this.arrowUp.setVisible(this.scroll > 0);
        this.arrowDown.setVisible(this.scroll < maxScroll);
        this.goldText.setText(SMITH_TEXT.gold(formatGold(goldStore.total)));
        this.drawFocus();
    }

    private drawSlot(slot: RowSlot, line: Line | undefined): void {
        slot.background.setFillStyle(SHOP_COLORS.hoverFill, 0);
        const isItem = line !== undefined && line.kind !== 'section';
        slot.background.setVisible(isItem);
        slot.section.setText(line?.kind === 'section' ? line.title : '').setVisible(line?.kind === 'section');
        slot.name.setVisible(isItem);
        slot.price.setVisible(isItem);
        slot.icon.setVisible(false);
        if (!isItem) return;
        const item = lineItem(line);
        const state = this.stateOf(line);
        const cantWear = line.kind === 'buy' && state.blocked === SMITH_TEXT.cantWear;
        slot.name.setText(this.label(line)).setColor(cantWear ? SMITH_COLORS.cantWear : SHOP_COLORS.text);
        const maxed = line.kind === 'upgrade' && upgradeOf(line.item) >= UPGRADE_MAX;
        slot.price.setText(maxed ? SMITH_TEXT.max : formatGold(state.price))
            .setColor(line.kind !== 'sell' && !state.affordable && !maxed ? SHOP_COLORS.tooExpensive : SHOP_COLORS.text);
        const gender = this.character?.look.gender ?? 'male';
        const picture = itemPicture(item.id, gender);
        if (!picture || !this.iconsReady) return;
        const icon = slot.icon.setTexture(itemPackTexture(picture.sheet), picture.frame).setOrigin(0.5).setVisible(true);
        const size = SMITH_LAYOUT.iconSize * SMITH_PANEL.scale;
        icon.setScale(Math.min(SMITH_PANEL.scale, size / Math.max(icon.frame.width, icon.frame.height)));
        icon.setAlpha(cantWear ? SMITH_COLORS.cantWearIconAlpha : 1);
    }

    /**
     * The row's name: with the attribute and "+" ("Sharp Long Sword +2", "Plate Mail (HP Recovery)") and how many ("×3").
     */
    private label(line: ItemLine): string {
        const item = lineItem(line);
        const attribute = item.attribute ? ATTRIBUTES[item.attribute] : undefined;
        const named = attribute?.kind === 'armor' ? `${ownedItemName(item)} (${attribute.name})` : ownedItemName(item);
        return line.kind !== 'buy' && line.count > 1 ? `${named} ×${line.count}` : named;
    }

    /** Price, and why it can't be bought or sold now (undefined when it can). */
    private stateOf(line: ItemLine): { price: number; affordable: boolean; blocked: string | undefined } {
        if (line.kind === 'sell') return { price: smithSellPrice(line.item), affordable: true, blocked: undefined };
        if (line.kind === 'upgrade') {
            const level = upgradeOf(line.item);
            if (level >= UPGRADE_MAX) return { price: 0, affordable: true, blocked: SMITH_TEXT.maxed };
            const price = smithUpgradePrice(line.item.id, level + 1);
            const affordable = goldStore.total >= price;
            const stones = this.stones() >= UPGRADE_STONES_PER_LEVEL;
            return { price, affordable, blocked: !stones ? SMITH_TEXT.noStone : !affordable ? SMITH_TEXT.notEnoughGold : undefined };
        }
        const price = smithBuyPrice(line.id);
        const character = this.character;
        const wearable = character !== undefined && canEquip(line.id, permanentStats(character), character.level);
        const affordable = goldStore.total >= price;
        return { price, affordable, blocked: !wearable ? SMITH_TEXT.cantWear : !affordable ? SMITH_TEXT.notEnoughGold : undefined };
    }

    private drawFocus(): void {
        const row = this.selected - this.scroll;
        const slot = this.slots[row];
        const line = this.lines[this.selected];
        if (slot && line && line.kind !== 'section') {
            const b = slot.background;
            this.focusFrame.setVisible(true).setPosition(b.x, b.y).setSize(b.width, b.height);
            this.focusFrame.setStrokeStyle(this.focus.kind === 'row' ? 2 : 0, SHOP_COLORS.selectedBorder);
        } else {
            this.focusFrame.setVisible(false);
        }
        const state = line && line.kind !== 'section' ? this.stateOf(line) : undefined;
        const canAct = state !== undefined && state.blocked === undefined;
        const actionFrame = this.tab === 'buy' ? SMITH_BUTTONS.purchase : SMITH_BUTTONS[this.tab];
        this.action.setFrame(actionFrame + (this.focus.kind === 'action' ? SMITH_BUTTONS.litOffset : 0), true, false)
            .setAlpha(canAct ? 1 : SMITH_BUTTONS.disabledAlpha);
        this.cancel.setFrame(SMITH_BUTTONS.cancel + (this.focus.kind === 'cancel' ? SMITH_BUTTONS.litOffset : 0), true, false);
        this.drawDetail(line);
    }

    private drawDetail(line: Line | undefined): void {
        this.requirements.setText('');
        if (this.notice !== undefined) {
            this.detail.setText(this.notice);
            return;
        }
        if (!this.character) {
            this.detail.setText(SMITH_TEXT.noCharacter);
            return;
        }
        if (!line || line.kind === 'section') {
            this.detail.setText(this.tab === 'sell' ? SMITH_TEXT.nothingToSell : this.tab === 'upgrade' ? SMITH_TEXT.nothingToUpgrade : '');
            return;
        }
        const item = lineItem(line);
        const slot = itemInfo(item.id)?.slot;
        const attribute = item.attribute ? ` ${ATTRIBUTES[item.attribute].description}.` : '';
        const what = slot ? `${EQUIP_SLOT_NAMES[slot]}: ${describeItem(item.id)}.` : `${describeItem(item.id)}.`;
        if (line.kind === 'upgrade') return this.drawUpgradeDetail(line);
        this.detail.setText(`${what}${attribute}`);
        if (line.kind !== 'buy') return;
        const character = this.character;
        const checks = requirementChecks(line.id, permanentStats(character), character.level);
        if (checks.length === 0) return;
        const met = checks.every((check) => check.met);
        this.requirements.setText(`Needs ${checks.map((check) => check.label).join(', ')}`)
            .setColor(met ? SMITH_COLORS.met : SMITH_COLORS.unmet)
            .setY(this.detail.y + this.detail.height + 2);
    }

    /** Upgrade: what the next "+" gives, and what it costs (green with a stone, red without). */
    private drawUpgradeDetail(line: Extract<Line, { kind: 'upgrade' }>): void {
        const level = upgradeOf(line.item);
        if (level >= UPGRADE_MAX) {
            this.detail.setText(SMITH_TEXT.maxed);
            return;
        }
        const next = { ...line.item, upgrade: level + 1 };
        const bonus = `+${Math.round(itemDamageBonus(next) * 100)}%`;
        this.detail.setText(SMITH_TEXT.upgradeInfo(level, level + 1, bonus));
        const stones = this.stones();
        this.requirements.setText(SMITH_TEXT.upgradeCost(stones))
            .setColor(stones >= UPGRADE_STONES_PER_LEVEL ? SMITH_COLORS.met : SMITH_COLORS.unmet)
            .setY(this.detail.y + this.detail.height + 2);
    }

    /** Stones of Xelima in the character's inventory (the warehouse doesn't count). */
    private stones(): number {
        return this.character?.inventory.filter((item) => item.id === XELIMA_STONE_ID).length ?? 0;
    }

    // ---- Moving ----

    private choose(index: number): void {
        if (index !== this.selected) {
            this.notice = undefined;
            this.confirming = undefined;
        }
        this.selected = index;
        this.focus = { kind: 'row' };
        this.keepVisible();
        this.refresh();
    }

    private setFocus(focus: Focus): void {
        this.focus = focus;
        this.drawFocus();
    }

    private moveVertically(dy: number): void {
        if (this.focus.kind !== 'row') {
            if (dy < 0 && this.selected >= 0) this.setFocus({ kind: 'row' });
            return;
        }
        const items = this.itemIndexes();
        const at = items.indexOf(this.selected);
        const next = items[at + dy];
        if (next !== undefined) this.choose(next);
        else if (dy > 0) this.setFocus({ kind: 'action' });
        else if (this.scroll > 0) this.scrollBy(-1);
    }

    private moveSideways(dx: number): void {
        if (this.focus.kind === 'row') {
            const next = SMITH_TABS[SMITH_TABS.indexOf(this.tab) + dx];
            if (next) this.setTab(next);
            return;
        }
        this.setFocus({ kind: dx < 0 ? 'action' : 'cancel' });
    }

    /** Scrolls the list; the choice follows if it would leave the view. */
    private scrollBy(rows: number): void {
        const visible = SMITH_LAYOUT.visibleRows;
        const maxScroll = Math.max(0, this.lines.length - visible);
        const next = Phaser.Math.Clamp(this.scroll + rows, 0, maxScroll);
        if (next === this.scroll) return;
        this.scroll = next;
        const items = this.itemIndexes();
        if (this.selected < next) this.selected = items.find((index) => index >= next) ?? this.selected;
        if (this.selected >= next + visible) this.selected = [...items].reverse().find((index) => index < next + visible) ?? this.selected;
        this.refresh();
    }

    /** Moves the view so the chosen line shows (and its section title, when it is the first of the section). */
    private keepVisible(): void {
        const visible = SMITH_LAYOUT.visibleRows;
        if (this.selected < 0) return;
        const withTitle = this.lines[this.selected - 1]?.kind === 'section' ? this.selected - 1 : this.selected;
        if (withTitle < this.scroll) this.scroll = withTitle;
        if (this.selected >= this.scroll + visible) this.scroll = this.selected - visible + 1;
    }

    private press(): void {
        switch (this.focus.kind) {
            case 'row':
                if (this.selected >= 0) this.setFocus({ kind: 'action' });
                return;
            case 'action':
                this.act();
                return;
            case 'cancel':
                this.close();
        }
    }

    // ---- Buying and selling ----

    private act(): void {
        const line = this.lines[this.selected];
        if (!line || line.kind === 'section') return;
        if (line.kind === 'buy') this.buy(line.id);
        else if (line.kind === 'sell') this.sell(line);
        else this.upgrade(line);
    }

    private buy(id: ItemId): void {
        const name = itemInfo(id)?.name ?? id;
        const state = this.stateOf({ kind: 'buy', id });
        if (!this.character) return this.say(SMITH_TEXT.noCharacter);
        if (state.blocked !== undefined) return this.say(state.blocked);
        if (!goldStore.spend(state.price)) return this.say(SMITH_TEXT.notEnoughGold);
        if (!characterStore.addToInventory(this.uid, { id })) {
            goldStore.add(state.price);
            return this.say(SMITH_TEXT.noCharacter);
        }
        this.audio.play('sfx.pickup');
        this.notice = SMITH_TEXT.bought(name);
        this.refresh();
    }

    private sell(line: Extract<Line, { kind: 'sell' }>): void {
        const price = smithSellPrice(line.item);
        const name = this.label({ ...line, count: 1 });
        // First press: ask. Second: sell one.
        if (this.confirming !== this.selected) {
            this.confirming = this.selected;
            return this.say(SMITH_TEXT.confirmSell(name, formatGold(price)));
        }
        const index = this.character?.inventory.findIndex((item) => sameOwnedItem(item, line.item)) ?? -1;
        if (index < 0 || !characterStore.takeFromInventory(this.uid, index)) return;
        goldStore.add(price);
        this.audio.play('sfx.pickup');
        this.confirming = undefined;
        this.notice = SMITH_TEXT.sold(name, formatGold(price));
        this.rebuild();
        // The list may have become empty: the focus goes back to the (empty) list.
        if (this.selected < 0) this.focus = { kind: 'row' };
        this.drawFocus();
    }

    /** Upgrade one: first press asks, second pays the gold and the stone and raises the "+" (Fase 24D). */
    private upgrade(line: Extract<Line, { kind: 'upgrade' }>): void {
        if (!this.character) return this.say(SMITH_TEXT.noCharacter);
        const state = this.stateOf(line);
        if (state.blocked !== undefined) return this.say(state.blocked);
        const to = upgradeOf(line.item) + 1;
        if (this.confirming !== this.selected) {
            this.confirming = this.selected;
            return this.say(SMITH_TEXT.confirmUpgrade(ownedItemName(line.item), to, formatGold(state.price)));
        }
        if (!goldStore.spend(state.price)) return this.say(SMITH_TEXT.notEnoughGold);
        const target = line.slot ? { slot: line.slot } : { item: line.item };
        if (!characterStore.upgrade(this.uid, target)) {
            goldStore.add(state.price);
            return this.say(SMITH_TEXT.noStone);
        }
        const upgraded: OwnedItem = { ...line.item, upgrade: to };
        this.audio.play(SMITH_UPGRADE_SOUND);
        this.confirming = undefined;
        this.notice = SMITH_TEXT.upgraded(ownedItemName(upgraded));
        // The choice follows the item just upgraded (worn, or its new line in the inventory).
        this.rebuild((other) => other.kind === 'upgrade' && other.slot === line.slot && sameOwnedItem(other.item, upgraded));
        this.drawFocus();
    }

    private say(message: string): void {
        this.notice = message;
        this.drawDetail(this.lines[this.selected]);
    }

    private close(): void {
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}

/** The item a line is about. */
function lineItem(line: ItemLine): OwnedItem {
    return line.kind === 'buy' ? { id: line.id } : line.item;
}

/** The inventory items that pass `keep`, the same kind (attribute and "+") counted once. */
function groupInventory(character: Readonly<SavedCharacter>, keep: (item: OwnedItem) => boolean): Array<{ item: OwnedItem; count: number }> {
    const entries: Array<{ item: OwnedItem; count: number }> = [];
    for (const item of character.inventory) {
        if (!keep(item)) continue;
        const entry = entries.find((e) => sameOwnedItem(e.item, item));
        if (entry) entry.count++;
        else entries.push({ item: { ...item }, count: 1 });
    }
    return entries;
}
