// Tintes de la Shop Keeper (revisión del original, bloque D; colores y precio en data/dyes.ts, medidas en
// config/shop.ts, DYE_LAYOUT). Se abre desde su panel en la ciudad, que espera en pausa debajo.
// - El mismo pergamino que la tienda. Arriba, la ropa PUESTA que se puede teñir (capa, botas, túnica), cada una con su
//   color de ahora; debajo, 16 muestras: el color propio de la prenda y los 15 tintes del original.
// - Elegir una muestra pinta ya el dibujo de la prenda elegida con ese color (vista previa); "Purchase" la tiñe al
//   momento por DYE_PRICE de oro. Volver al color propio es gratis.
// - Ratón, flechas o mando: filas arriba, muestras en medio (izquierda/derecha), botones abajo.
import Phaser from 'phaser';
import { itemPackTexture } from '../config/equipment';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { MENU_INPUT_DELAY_MS } from '../config/menus';
import {
    DYE_LAYOUT, SHOP_BANNER, SHOP_BUTTONS, SHOP_COLORS, SHOP_DETAIL_STYLE, SHOP_GOLD_STYLE, SHOP_HEADER_STYLE, SHOP_LAYOUT, SHOP_PANEL,
    SHOP_ROW_STYLE, SHOP_SECTION_STYLE,
} from '../config/shop';
import { canDye, DYE_COLORS, DYE_PRICE, DYE_TEXT, dyeAdded, dyeColor, dyeSwatch, UNDYE_PRICE, type DyeColorId } from '../data/dyes';
import { formatGold } from '../data/gold';
import { EQUIP_SLOT_IDS, itemIcon, itemInfo, type EquipSlotId, type ItemId } from '../data/items';
import { SHOP_TEXT } from '../data/shop';
import { setColouredTexture } from '../hb/additiveTint';
import { AudioSystem } from '../systems/AudioSystem';
import { characterStore } from '../systems/CharacterStore';
import { goldStore } from '../systems/GoldStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { lookLoader } from '../systems/LookLoader';
import type { MenuOverlayData } from './MenuOverlayScene';

export const DYE_SCENE_KEY = 'Dye';

export interface DyeSceneData {
    /** The character walking the town: its clothes are dyed. Undefined with no saved character. */
    characterUid: string | undefined;
}

/** A piece of clothing worn that takes a dye. */
interface Row {
    slot: EquipSlotId;
    id: ItemId;
    background: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
    color: Phaser.GameObjects.Text;
}

/** Swatch 0 = the item's own colour; 1..15 = the dyes. */
type SwatchIndex = number;

type Focus = { kind: 'row'; index: number } | { kind: 'swatch'; index: SwatchIndex } | { kind: 'purchase' } | { kind: 'cancel' };

const SWATCH_COUNT = DYE_COLORS.length + 1;

export class DyeScene extends Phaser.Scene {
    private uid: string | undefined;
    private returnTo = '';
    private openedAt = 0;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private rows: Row[] = [];
    private swatches: Phaser.GameObjects.Rectangle[] = [];
    /** The piece that Purchase dyes, and the colour it would get. */
    private selectedRow = 0;
    private selectedSwatch: SwatchIndex = 0;
    private focus: Focus = { kind: 'row', index: 0 };
    private rowFrame!: Phaser.GameObjects.Rectangle;
    private swatchFrame!: Phaser.GameObjects.Rectangle;
    private detail!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private purchase!: Phaser.GameObjects.Image;
    private cancel!: Phaser.GameObjects.Image;
    /** A message that replaces the description until the choice changes ("Not enough gold."). */
    private notice: string | undefined;
    private iconsReady = false;

    constructor() {
        super(DYE_SCENE_KEY);
    }

    init(data: DyeSceneData & MenuOverlayData): void {
        this.uid = data.characterUid;
        this.returnTo = data.returnTo;
        this.rows = [];
        this.swatches = [];
        this.selectedRow = 0;
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

        const l = DYE_LAYOUT;
        const middle = this.x(SHOP_PANEL.width / 2);
        this.add.text(this.x(SHOP_LAYOUT.nameX), this.y(l.headerY), 'ITEM', SHOP_HEADER_STYLE).setOrigin(0, 0.5);
        this.add.text(this.x(SHOP_LAYOUT.priceX), this.y(l.headerY), 'COLOR', SHOP_HEADER_STYLE).setOrigin(1, 0.5);
        this.rowFrame = this.add.rectangle(0, 0, 1, 1, SHOP_COLORS.selectedFill, SHOP_COLORS.selectedAlpha)
            .setOrigin(0).setStrokeStyle(2, SHOP_COLORS.selectedBorder);
        this.buildRows();
        this.add.text(middle, this.y(l.paletteTitleY), DYE_TEXT.paletteTitle, SHOP_SECTION_STYLE).setOrigin(0.5);
        this.buildPalette();
        this.detail = this.add.text(middle, this.y(l.detailY), '', {
            ...SHOP_DETAIL_STYLE, align: 'center', wordWrap: { width: SHOP_LAYOUT.detailWidth * s },
        }).setOrigin(0.5, 0);
        this.goldText = this.add.text(middle, this.y(SHOP_LAYOUT.goldY), '', SHOP_GOLD_STYLE).setOrigin(0.5);
        this.purchase = this.createButton(-SHOP_LAYOUT.buttonGap, SHOP_BUTTONS.purchase, { kind: 'purchase' }, () => this.buy());
        this.cancel = this.createButton(SHOP_LAYOUT.buttonGap, SHOP_BUTTONS.cancel, { kind: 'cancel' }, () => this.close());

        this.inputSystem = new InputSystem(this);
        // Rows, swatches and buttons have their own click areas: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
        this.selectRow(0);
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
        if (input.justPressed(Action.MenuLeft)) this.moveHorizontally(-1);
        if (input.justPressed(Action.MenuRight)) this.moveHorizontally(1);
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

    // ---- Clothes worn and swatches ----

    private buildRows(): void {
        const character = characterStore.byUid(this.uid);
        if (!character) return;
        const s = SHOP_PANEL.scale;
        const l = SHOP_LAYOUT;
        for (const slot of EQUIP_SLOT_IDS) {
            const id = character.equipment[slot];
            if (id === undefined || !canDye(id)) continue;
            const index = this.rows.length;
            const panelY = DYE_LAYOUT.listTop + index * DYE_LAYOUT.rowHeight;
            const middle = this.y(panelY + DYE_LAYOUT.rowHeight / 2);
            const background = this.add.rectangle(this.x(l.left), this.y(panelY), (l.right - l.left) * s, DYE_LAYOUT.rowHeight * s - 2, SHOP_COLORS.hoverFill, 0)
                .setOrigin(0);
            const icon = this.add.image(this.x(l.iconX), middle, '__DEFAULT').setVisible(false);
            this.add.text(this.x(l.nameX), middle, itemInfo(id)?.name ?? id, SHOP_ROW_STYLE).setOrigin(0, 0.5);
            const color = this.add.text(this.x(l.priceX), middle, '', SHOP_ROW_STYLE).setOrigin(1, 0.5);
            background.setInteractive({ useHandCursor: true });
            background.on(Phaser.Input.Events.POINTER_OVER, () => {
                if (this.selectedRow !== index) background.setFillStyle(SHOP_COLORS.hoverFill, SHOP_COLORS.hoverAlpha);
            });
            background.on(Phaser.Input.Events.POINTER_OUT, () => background.setFillStyle(SHOP_COLORS.hoverFill, 0));
            background.on(Phaser.Input.Events.POINTER_UP, () => {
                if (this.ready()) this.selectRow(index);
            });
            this.rows.push({ slot, id, background, icon, color });
        }
    }

    private buildPalette(): void {
        const l = DYE_LAYOUT;
        const s = SHOP_PANEL.scale;
        const width = (l.paletteColumns - 1) * l.swatchStep + l.swatchSize;
        const firstX = SHOP_PANEL.width / 2 - width / 2 + l.swatchSize / 2;
        for (let index = 0; index < SWATCH_COUNT; index++) {
            const cx = this.x(firstX + (index % l.paletteColumns) * l.swatchStep);
            const cy = this.y(l.paletteTop + l.swatchSize / 2 + Math.floor(index / l.paletteColumns) * l.swatchStep);
            const size = l.swatchSize * s;
            const swatch = this.add.rectangle(cx, cy, size, size, index === 0 ? l.ownFill : dyeSwatch(index)).setStrokeStyle(1, l.swatchBorder);
            if (index === 0) {
                // Own colour: a red stroke across, "no dye".
                const half = size / 2 - 2;
                this.add.line(0, 0, cx - half, cy + half, cx + half, cy - half, l.ownStroke).setOrigin(0).setLineWidth(2);
            }
            swatch.setInteractive({ useHandCursor: true });
            swatch.on(Phaser.Input.Events.POINTER_UP, () => {
                if (this.ready()) this.setFocus({ kind: 'swatch', index });
            });
            this.swatches.push(swatch);
        }
        this.swatchFrame = this.add.rectangle(0, 0, 1, 1).setStrokeStyle(3, l.selectedBorder).setFillStyle(0, 0);
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

    /** The colour the piece wears now (undefined = its own). */
    private currentColor(row: Row): DyeColorId | undefined {
        const character = characterStore.byUid(this.uid);
        return character?.equipment[row.slot] === row.id ? character.colors[row.slot] : undefined;
    }

    /** Chooses a piece; the swatch goes to the colour it wears, so nothing changes until another one is picked. */
    private selectRow(index: number): void {
        this.selectedRow = index;
        const row = this.rows[index];
        this.selectedSwatch = row ? this.currentColor(row) ?? 0 : 0;
        this.notice = undefined;
        this.setFocus({ kind: 'row', index });
    }

    /** Redraws the rows (each piece in its colour; the chosen one in the colour picked, as a preview) and the gold. */
    private refresh(): void {
        const character = characterStore.byUid(this.uid);
        this.rows.forEach((row, index) => {
            const current = this.currentColor(row);
            const shown = index === this.selectedRow ? swatchColor(this.selectedSwatch) : current;
            row.color.setText(dyeColor(current)?.name ?? DYE_TEXT.own);
            const frame = character ? itemIcon(row.id, character.look.gender) : undefined;
            if (!frame || !this.iconsReady || !setColouredTexture(row.icon, itemPackTexture(frame.sheet), frame.frame, dyeAdded(shown))) {
                row.icon.setVisible(false);
                return;
            }
            const size = SHOP_LAYOUT.iconSize * SHOP_PANEL.scale;
            row.icon.setOrigin(0.5).setVisible(true).setScale(Math.min(SHOP_PANEL.scale, size / Math.max(row.icon.frame.width, row.icon.frame.height)));
        });
        this.goldText.setText(SHOP_TEXT.gold(formatGold(goldStore.total)));
    }

    // ---- Focus and buying ----

    private setFocus(focus: Focus, keepNotice = false): void {
        if (focus.kind === 'row') {
            if (this.rows.length === 0) focus = { kind: 'cancel' };
            else focus = { kind: 'row', index: Phaser.Math.Clamp(focus.index, 0, this.rows.length - 1) };
        }
        if (focus.kind === 'swatch') {
            if (this.rows.length === 0) focus = { kind: 'cancel' };
            else {
                if (focus.index !== this.selectedSwatch && !keepNotice) this.notice = undefined;
                this.selectedSwatch = focus.index;
            }
        }
        this.focus = focus;
        const row = this.rows[this.selectedRow];
        this.rowFrame.setVisible(row !== undefined);
        if (row) {
            const b = row.background;
            b.setFillStyle(SHOP_COLORS.hoverFill, 0);
            this.rowFrame.setPosition(b.x, b.y).setSize(b.width, b.height);
            this.rowFrame.setStrokeStyle(focus.kind === 'row' ? 2 : 0, SHOP_COLORS.selectedBorder);
        }
        const swatch = this.swatches[this.selectedSwatch];
        this.swatchFrame.setVisible(swatch !== undefined && row !== undefined);
        if (swatch) {
            const grow = focus.kind === 'swatch' ? 6 : 3;
            this.swatchFrame.setPosition(swatch.x, swatch.y).setSize(swatch.width + grow, swatch.height + grow).setOrigin(0.5)
                .setStrokeStyle(focus.kind === 'swatch' ? 3 : 2, DYE_LAYOUT.selectedBorder);
        }
        this.purchase.setFrame(SHOP_BUTTONS.purchase + (focus.kind === 'purchase' ? SHOP_BUTTONS.litOffset : 0), true, false)
            .setAlpha(this.canBuy() ? 1 : SHOP_BUTTONS.disabledAlpha);
        this.cancel.setFrame(SHOP_BUTTONS.cancel + (focus.kind === 'cancel' ? SHOP_BUTTONS.litOffset : 0), true, false);
        this.detail.setText(this.notice ?? this.describe());
        this.refresh();
    }

    private price(): number {
        return this.selectedSwatch === 0 ? UNDYE_PRICE : DYE_PRICE;
    }

    /** The chosen piece would change colour and the gold is there. */
    private canBuy(): boolean {
        const row = this.rows[this.selectedRow];
        return row !== undefined && swatchColor(this.selectedSwatch) !== this.currentColor(row) && goldStore.total >= this.price();
    }

    private describe(): string {
        if (this.uid === undefined || !characterStore.byUid(this.uid)) return DYE_TEXT.noCharacter;
        const row = this.rows[this.selectedRow];
        if (!row) return DYE_TEXT.nothingToDye;
        const piece = itemInfo(row.id)?.name ?? row.id;
        const color = swatchColor(this.selectedSwatch);
        if (color === this.currentColor(row)) return DYE_TEXT.alreadyThat;
        const name = dyeColor(color)?.name;
        return name ? DYE_TEXT.describe(piece, name, formatGold(DYE_PRICE)) : DYE_TEXT.describeOwn(piece);
    }

    private moveVertically(dy: number): void {
        const focus = this.focus;
        const columns = DYE_LAYOUT.paletteColumns;
        if (focus.kind === 'row') {
            const next = focus.index + dy;
            if (next >= this.rows.length) this.setFocus({ kind: 'swatch', index: this.selectedSwatch });
            else if (next >= 0) this.selectRow(next);
        } else if (focus.kind === 'swatch') {
            const next = focus.index + dy * columns;
            if (next >= SWATCH_COUNT) this.setFocus({ kind: 'purchase' });
            else if (next < 0) this.setFocus({ kind: 'row', index: this.selectedRow });
            else this.setFocus({ kind: 'swatch', index: next });
        } else if (dy < 0) {
            this.setFocus(this.rows.length > 0 ? { kind: 'swatch', index: this.selectedSwatch } : { kind: 'cancel' }, true);
        }
    }

    private moveHorizontally(dx: number): void {
        const focus = this.focus;
        if (focus.kind === 'swatch') {
            const next = focus.index + dx;
            const columns = DYE_LAYOUT.paletteColumns;
            // Stays on its line of swatches.
            if (next >= 0 && next < SWATCH_COUNT && Math.floor(next / columns) === Math.floor(focus.index / columns)) this.setFocus({ kind: 'swatch', index: next });
        } else if (focus.kind === 'cancel' && dx < 0) {
            this.setFocus({ kind: 'purchase' });
        } else if (focus.kind === 'purchase' && dx > 0) {
            this.setFocus({ kind: 'cancel' });
        }
    }

    private press(): void {
        switch (this.focus.kind) {
            case 'row':
                this.setFocus({ kind: 'swatch', index: this.selectedSwatch });
                return;
            case 'swatch':
                this.setFocus({ kind: 'purchase' }, true);
                return;
            case 'purchase':
                this.buy();
                return;
            case 'cancel':
                this.close();
        }
    }

    /** Dyes the chosen piece in the chosen colour, if it can. */
    private buy(): void {
        const row = this.rows[this.selectedRow];
        if (!row) return;
        const color = swatchColor(this.selectedSwatch);
        if (color === this.currentColor(row)) return this.say(DYE_TEXT.alreadyThat);
        const price = this.price();
        if (!goldStore.spend(price)) return this.say(SHOP_TEXT.notEnoughGold);
        if (!characterStore.dye(this.uid, row.slot, color)) {
            // It could not be dyed (the piece is gone): the gold comes back.
            goldStore.add(price);
            return this.say(DYE_TEXT.nothingToDye);
        }
        this.audio.play('sfx.pickup');
        const piece = itemInfo(row.id)?.name ?? row.id;
        const name = dyeColor(color)?.name;
        this.notice = name ? DYE_TEXT.done(piece, name) : DYE_TEXT.doneOwn(piece);
        this.setFocus(this.focus, true);
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

/** Swatch → dye colour (swatch 0 = the item's own colour). */
function swatchColor(index: SwatchIndex): DyeColorId | undefined {
    return index === 0 ? undefined : index;
}
