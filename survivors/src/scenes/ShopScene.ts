// Tienda de la Shop Keeper (Fase 24B; lista y precios en data/shop.ts, medidas en config/shop.ts). Se abre desde su
// panel en la ciudad, que espera en pausa debajo.
// - Como la ventana "Item for Sale" del original: pergamino, letrero arriba y columnas ITEM / PRICE, con secciones.
// - Cada fila lleva la miniatura del objeto (item-pack.spr; el dado, dibujado con código).
// - Lo de una sola compra (Abaddon's Blood) y el dado y el vino al tener los 3 salen "Sold out", con el texto más claro.
// - Elegir una fila (clic, flechas o mando) muestra debajo qué hace; "Purchase" la compra. Así un clic sin querer no
//   gasta el oro. Un precio que no puedes pagar sale en rojo.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { itemPackTexture } from '../config/equipment';
import { MENU_INPUT_DELAY_MS } from '../config/menus';
import {
    SHOP_BANNER, SHOP_BUTTONS, SHOP_COLORS, SHOP_DETAIL_STYLE, SHOP_GOLD_STYLE, SHOP_HEADER_STYLE, SHOP_LAYOUT, SHOP_PANEL,
    SHOP_ROW_STYLE, SHOP_SECTION_STYLE,
} from '../config/shop';
import { formatGold } from '../data/gold';
import { DICE_FACE, STACKABLE_UNLOCKS } from '../data/rerollSkip';
import { SHOP_SECTIONS, SHOP_TEXT, type ShopEntry } from '../data/shop';
import { AudioSystem } from '../systems/AudioSystem';
import { characterStore } from '../systems/CharacterStore';
import { goldStore } from '../systems/GoldStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { lookLoader } from '../systems/LookLoader';
import { unlockStore } from '../systems/UnlockStore';
import { createDice } from '../ui/DiceIcon';
import type { MenuOverlayData } from './MenuOverlayScene';

export const SHOP_SCENE_KEY = 'Shop';

export interface ShopSceneData {
    /** The character walking the town: a Zemstone goes to its inventory. Undefined with no saved character. */
    characterUid: string | undefined;
}

/** Where an entry stands now. */
interface EntryState {
    soldOut: boolean;
    /** Price of the next purchase. */
    price: number;
    affordable: boolean;
    /** Name with how many you have, for the ones bought a few times ("Dice (1/3)"). */
    label: string;
}

interface Row {
    entry: ShopEntry;
    background: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
    name: Phaser.GameObjects.Text;
    price: Phaser.GameObjects.Text;
}

type Focus = { kind: 'row'; index: number } | { kind: 'purchase' } | { kind: 'cancel' };

export class ShopScene extends Phaser.Scene {
    private uid: string | undefined;
    private returnTo = '';
    private openedAt = 0;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private rows: Row[] = [];
    /** The row whose item Purchase buys (stays chosen while the focus is on the buttons). */
    private selected = 0;
    private focus: Focus = { kind: 'row', index: 0 };
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private detail!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private purchase!: Phaser.GameObjects.Image;
    private cancel!: Phaser.GameObjects.Image;
    /** A message that replaces the description until the choice changes ("Not enough gold."). */
    private notice: string | undefined;
    private iconsReady = false;

    constructor() {
        super(SHOP_SCENE_KEY);
    }

    init(data: ShopSceneData & MenuOverlayData): void {
        this.uid = data.characterUid;
        this.returnTo = data.returnTo;
        this.rows = [];
        this.selected = 0;
        this.focus = { kind: 'row', index: 0 };
        this.notice = undefined;
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.audio = new AudioSystem(this);
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, SHOP_PANEL.shadeAlpha).setOrigin(0);
        const s = SHOP_PANEL.scale;
        this.add.image(this.left, this.top, SHOP_PANEL.texture, SHOP_PANEL.frame).setOrigin(0).setScale(s);
        this.add.image(this.left, this.top, SHOP_BANNER.texture, SHOP_BANNER.frame).setOrigin(0).setScale(s);

        const l = SHOP_LAYOUT;
        this.add.text(this.x(l.nameX), this.y(l.headerY), 'ITEM', SHOP_HEADER_STYLE).setOrigin(0, 0.5);
        this.add.text(this.x(l.priceX), this.y(l.headerY), 'PRICE', SHOP_HEADER_STYLE).setOrigin(1, 0.5);
        // The chosen row's band, drawn before the rows so their text stays on top.
        this.focusFrame = this.add.rectangle(0, 0, 1, 1, SHOP_COLORS.selectedFill, SHOP_COLORS.selectedAlpha)
            .setOrigin(0).setStrokeStyle(2, SHOP_COLORS.selectedBorder);
        this.buildList();
        this.detail = this.add.text(this.x(SHOP_PANEL.width / 2), this.y(l.detailY), '', {
            ...SHOP_DETAIL_STYLE, align: 'center', wordWrap: { width: l.detailWidth * s },
        }).setOrigin(0.5, 0);
        this.goldText = this.add.text(this.x(SHOP_PANEL.width / 2), this.y(l.goldY), '', SHOP_GOLD_STYLE).setOrigin(0.5);
        this.purchase = this.createButton(-l.buttonGap, SHOP_BUTTONS.purchase, { kind: 'purchase' }, () => this.buy());
        this.cancel = this.createButton(l.buttonGap, SHOP_BUTTONS.cancel, { kind: 'cancel' }, () => this.close());

        this.inputSystem = new InputSystem(this);
        // Rows and buttons have their own click areas: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
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
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.MenuUp)) this.moveVertically(-1);
        if (input.justPressed(Action.MenuDown)) this.moveVertically(1);
        if (input.justPressed(Action.MenuLeft) && this.focus.kind === 'cancel') this.setFocus({ kind: 'purchase' });
        if (input.justPressed(Action.MenuRight) && this.focus.kind === 'purchase') this.setFocus({ kind: 'cancel' });
        if (input.justPressed(Action.Pick)) this.press();
    }

    // ---- Layout ----

    private get left(): number {
        return Math.round(GAME_WIDTH / 2 - (SHOP_PANEL.width * SHOP_PANEL.scale) / 2);
    }

    private get top(): number {
        return Math.round(GAME_HEIGHT / 2 - (SHOP_PANEL.height * SHOP_PANEL.scale) / 2);
    }

    /** Screen position of a point of the original panel. */
    private x(panelX: number): number {
        return this.left + panelX * SHOP_PANEL.scale;
    }

    private y(panelY: number): number {
        return this.top + panelY * SHOP_PANEL.scale;
    }

    // ---- List ----

    private buildList(): void {
        const l = SHOP_LAYOUT;
        const s = SHOP_PANEL.scale;
        let panelY = l.listTop;
        for (const section of SHOP_SECTIONS) {
            this.add.text(this.x(SHOP_PANEL.width / 2), this.y(panelY + l.sectionHeight / 2), section.title, SHOP_SECTION_STYLE).setOrigin(0.5);
            panelY += l.sectionHeight;
            for (const entry of section.entries) {
                const index = this.rows.length;
                const middle = this.y(panelY + l.rowHeight / 2);
                const background = this.add.rectangle(this.x(l.left), this.y(panelY), (l.right - l.left) * s, l.rowHeight * s - 2, SHOP_COLORS.hoverFill, 0)
                    .setOrigin(0);
                const icon = entry.picture.kind === 'dice'
                    ? createDice(this, this.x(l.iconX), middle, l.iconSize * s * 0.8, DICE_FACE)
                    : this.add.image(this.x(l.iconX), middle, '__DEFAULT').setVisible(false);
                const name = this.add.text(this.x(l.nameX), middle, entry.name, SHOP_ROW_STYLE).setOrigin(0, 0.5);
                const price = this.add.text(this.x(l.priceX), middle, '', SHOP_ROW_STYLE).setOrigin(1, 0.5);
                background.setInteractive({ useHandCursor: true });
                background.on(Phaser.Input.Events.POINTER_OVER, () => {
                    if (this.selected !== index) background.setFillStyle(SHOP_COLORS.hoverFill, SHOP_COLORS.hoverAlpha);
                });
                background.on(Phaser.Input.Events.POINTER_OUT, () => background.setFillStyle(SHOP_COLORS.hoverFill, 0));
                background.on(Phaser.Input.Events.POINTER_UP, () => {
                    if (this.ready()) this.setFocus({ kind: 'row', index });
                });
                this.rows.push({ entry, background, icon, name, price });
                panelY += l.rowHeight;
            }
        }
    }

    private createButton(offset: number, frame: number, focus: Focus, onPress: () => void): Phaser.GameObjects.Image {
        // The button frames carry a top-left pivot: centred by hand so Purchase and Cancel sit evenly.
        const button = this.add.image(this.x(SHOP_PANEL.width / 2 + offset), this.y(SHOP_LAYOUT.buttonsY), SHOP_BUTTONS.texture, frame)
            .setOrigin(0.5).setScale(SHOP_PANEL.scale);
        button.setInteractive({ useHandCursor: true });
        button.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus(focus, true));
        button.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) onPress();
        });
        return button;
    }

    /** Rereads gold and purchases and redraws prices, colours and the text under the list. */
    private refresh(): void {
        for (const row of this.rows) this.drawRow(row);
        this.goldText.setText(SHOP_TEXT.gold(formatGold(goldStore.total)));
        this.setFocus(this.focus, true);
    }

    private drawRow(row: Row): void {
        const state = this.stateOf(row.entry);
        row.name.setText(state.label).setColor(state.soldOut ? SHOP_COLORS.soldOut : SHOP_COLORS.text);
        const priceColor = state.soldOut ? SHOP_COLORS.soldOut : state.affordable ? SHOP_COLORS.text : SHOP_COLORS.tooExpensive;
        row.price.setText(state.soldOut ? SHOP_TEXT.soldOut : formatGold(state.price)).setColor(priceColor);
        row.icon.setAlpha(state.soldOut ? SHOP_COLORS.soldOutIconAlpha : 1);
        const picture = row.entry.picture;
        if (picture.kind !== 'item' || !(row.icon instanceof Phaser.GameObjects.Image) || !this.iconsReady) return;
        const icon = row.icon;
        icon.setTexture(itemPackTexture(picture.frame.sheet), picture.frame.frame).setOrigin(0.5).setVisible(true);
        const size = SHOP_LAYOUT.iconSize * SHOP_PANEL.scale;
        icon.setScale(Math.min(SHOP_PANEL.scale, size / Math.max(icon.frame.width, icon.frame.height)));
    }

    private stateOf(entry: ShopEntry): EntryState {
        const good = entry.good;
        const lastPrice = entry.prices[entry.prices.length - 1] ?? 0;
        let soldOut = false;
        let bought = 0;
        let label = entry.name;
        if (good.kind === 'unlock') {
            soldOut = unlockStore.has(good.id);
        } else if (good.kind === 'stackable') {
            bought = unlockStore.count(good.id);
            const max = STACKABLE_UNLOCKS[good.id].maxCount;
            soldOut = bought >= max;
            label = `${entry.name} (${bought}/${max})`;
        }
        const price = entry.prices[bought] ?? lastPrice;
        return { soldOut, price, affordable: goldStore.total >= price, label };
    }

    // ---- Focus and buying ----

    private setFocus(focus: Focus, keepNotice = false): void {
        if (focus.kind === 'row') {
            const index = Phaser.Math.Clamp(focus.index, 0, this.rows.length - 1);
            focus = { kind: 'row', index };
            if (index !== this.selected && !keepNotice) this.notice = undefined;
            this.selected = index;
        }
        this.focus = focus;
        const row = this.rows[this.selected];
        if (row) {
            const b = row.background;
            b.setFillStyle(SHOP_COLORS.hoverFill, 0);
            this.focusFrame.setPosition(b.x, b.y).setSize(b.width, b.height);
            // Frame only while the focus is on the row; on the buttons the band stays to show what Purchase buys.
            this.focusFrame.setStrokeStyle(focus.kind === 'row' ? 2 : 0, SHOP_COLORS.selectedBorder);
        }
        const state = row ? this.stateOf(row.entry) : undefined;
        const canBuy = state !== undefined && !state.soldOut && state.affordable;
        // updateOrigin = false: keep them centred (the frames' pivot would put the origin back at the top-left corner).
        this.purchase.setFrame(SHOP_BUTTONS.purchase + (focus.kind === 'purchase' ? SHOP_BUTTONS.litOffset : 0), true, false)
            .setAlpha(canBuy ? 1 : SHOP_BUTTONS.disabledAlpha);
        this.cancel.setFrame(SHOP_BUTTONS.cancel + (focus.kind === 'cancel' ? SHOP_BUTTONS.litOffset : 0), true, false);
        this.detail.setText(this.notice ?? (row && state ? this.describe(row.entry, state) : ''));
    }

    private describe(entry: ShopEntry, state: EntryState): string {
        if (state.soldOut) return `${entry.description}\n${SHOP_TEXT.soldOut}.`;
        const good = entry.good;
        const owned = good.kind === 'item' && this.uid !== undefined ? ` You have ${characterStore.ownedCount(this.uid, { id: good.id })}.` : '';
        return `${entry.description}${owned}`;
    }

    private moveVertically(dy: number): void {
        const focus = this.focus;
        if (focus.kind === 'row') {
            const next = focus.index + dy;
            if (next >= this.rows.length) this.setFocus({ kind: 'purchase' });
            else if (next >= 0) this.setFocus({ kind: 'row', index: next });
        } else if (dy < 0) {
            this.setFocus({ kind: 'row', index: this.selected }, true);
        }
    }

    private press(): void {
        switch (this.focus.kind) {
            case 'row':
                this.setFocus({ kind: 'purchase' }, true);
                return;
            case 'purchase':
                this.buy();
                return;
            case 'cancel':
                this.close();
        }
    }

    /** Buys one of the chosen row's item, if it can. */
    private buy(): void {
        const row = this.rows[this.selected];
        if (!row) return;
        const entry = row.entry;
        const state = this.stateOf(entry);
        if (state.soldOut) return this.say(`${entry.name}: ${SHOP_TEXT.soldOut.toLowerCase()}.`);
        if (entry.good.kind === 'item' && this.uid === undefined) return this.say(SHOP_TEXT.noCharacter);
        if (!goldStore.spend(state.price)) return this.say(SHOP_TEXT.notEnoughGold);
        if (!this.give(entry)) {
            // It could not be given (no character, or already bought): the gold comes back.
            goldStore.add(state.price);
            return this.say(entry.good.kind === 'item' ? SHOP_TEXT.noCharacter : SHOP_TEXT.soldOut);
        }
        this.audio.play('sfx.pickup');
        this.notice = SHOP_TEXT.bought(entry.name);
        this.refresh();
    }

    private give(entry: ShopEntry): boolean {
        const good = entry.good;
        switch (good.kind) {
            case 'item':
                return characterStore.addToInventory(this.uid, { id: good.id });
            case 'unlock':
                return unlockStore.unlock(good.id);
            case 'stackable':
                return unlockStore.buy(good.id);
        }
    }

    private say(message: string): void {
        this.notice = message;
        this.detail.setText(message);
    }

    private close(): void {
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }
}
