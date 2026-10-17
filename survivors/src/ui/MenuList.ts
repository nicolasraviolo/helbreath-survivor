// Lista de opciones de un menú, con la fuente dibujada del original. Se maneja igual con teclado, mando o ratón:
// ↑/↓ (cruceta o stick) cambian de opción, ←/→ cambian su valor (volumen, sí/no), Enter/A la elige.
// Con el ratón: pasar por encima la ilumina; clic la elige. En las de valor ("< 80% >"), clic en la flecha < baja y en
// la flecha > sube.
import Phaser from 'phaser';
import { MENU_ARROW, MENU_ITEM } from '../config/menus';
import { SpriteText } from '../hb/SpriteText';
import { Action, type InputSystem } from '../systems/InputSystem';

export interface MenuItem {
    label: string;
    /** Shown at the right of the row (Settings values). Rows with a value are laid out in two columns. */
    value?: () => string;
    onConfirm?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
}

export interface MenuListLayout {
    x: number;
    /** Centre of the first row. */
    y: number;
    spacing: number;
    /** Rows with a value: label starts at x − this and the ">" arrow ends at x + this. */
    valueHalfWidth?: number;
    /** Width of "◄ value ►" for longer values (default MENU_ITEM.valueBoxWidth). */
    valueBoxWidth?: number;
}

interface Row {
    item: MenuItem;
    label: SpriteText;
    value: SpriteText | undefined;
    arrows: Phaser.GameObjects.Image[];
}

export class MenuList {
    private readonly rows: Row[] = [];
    /** Click areas, kept to remove them in destroy() (texts and arrows are in `rows`). */
    private readonly zones: Phaser.GameObjects.Zone[] = [];
    private selected = 0;
    /** Mouse clicks are ignored until this returns true (see MENU_INPUT_DELAY_MS). */
    private ready: () => boolean = () => true;

    constructor(private readonly scene: Phaser.Scene, items: readonly MenuItem[], layout: MenuListLayout) {
        const half = layout.valueHalfWidth ?? 0;
        items.forEach((item, index) => {
            const y = layout.y + index * layout.spacing;
            const twoColumns = item.value !== undefined && half > 0;
            const label = this.addText(twoColumns ? layout.x - half : layout.x, y, item.label, twoColumns ? 'left' : 'center');
            const row: Row = { item, label, value: undefined, arrows: [] };
            this.rows.push(row);

            // The whole row lights up on hover; a click on it confirms (rows with a value change only on the arrows).
            const width = twoColumns ? half * 2 : Math.max(label.width * MENU_ITEM.scale, MENU_ITEM.hitHeight * 4);
            this.addZone(layout.x, y, width, index, item.onConfirm);

            if (twoColumns) {
                // "◄  value  ►": the value centred between the original's arrow buttons, each with its own click area on top.
                const arrowHalf = (MENU_ARROW.size * MENU_ARROW.scale) / 2;
                const rightX = layout.x + half - arrowHalf;
                const leftX = rightX - (layout.valueBoxWidth ?? MENU_ITEM.valueBoxWidth) + arrowHalf * 2;
                row.value = this.addText((leftX + rightX) / 2, y, '', 'center');
                row.value.container.y = label.container.y;
                row.arrows.push(this.addArrow(leftX, y, false), this.addArrow(rightX, y, true));
                this.addZone(leftX, y, MENU_ITEM.arrowHitWidth, index, item.onLeft);
                this.addZone(rightX, y, MENU_ITEM.arrowHitWidth, index, item.onRight);
            }
        });
        this.refresh();
    }

    public setReadyCheck(ready: () => boolean): void {
        this.ready = ready;
    }

    /** Reads the menu actions. Call once per frame, after `input.update()`. */
    public handleInput(input: InputSystem): void {
        if (input.justPressed(Action.MenuUp)) this.select((this.selected - 1 + this.rows.length) % this.rows.length);
        if (input.justPressed(Action.MenuDown)) this.select((this.selected + 1) % this.rows.length);
        const item = this.rows[this.selected]?.item;
        if (!item) return;
        if (input.justPressed(Action.MenuLeft)) item.onLeft?.();
        if (input.justPressed(Action.MenuRight)) item.onRight?.();
        if (input.justPressed(Action.Confirm)) (item.onConfirm ?? item.onRight)?.();
        this.refresh();
    }

    /** Redraws the values (after a setting changed). */
    public refresh(): void {
        this.rows.forEach((row, i) => {
            const color = i === this.selected ? MENU_ITEM.selectedColor : MENU_ITEM.color;
            row.label.setColor(color);
            row.value?.setText(row.item.value?.() ?? '').setColor(color);
            for (const arrow of row.arrows) arrow.setAlpha(i === this.selected ? 1 : MENU_ARROW.idleAlpha);
        });
    }

    /** Removes the whole list from the scene (to build it again with other options). */
    public destroy(): void {
        for (const row of this.rows) {
            row.label.container.destroy();
            row.value?.container.destroy();
            for (const arrow of row.arrows) arrow.destroy();
        }
        for (const zone of this.zones) zone.destroy();
        this.rows.length = 0;
        this.zones.length = 0;
    }

    private select(index: number): void {
        if (index === this.selected) return;
        this.selected = index;
        this.refresh();
    }

    /** Clickable area centred on (x, y): hover selects row `index`, a click runs `onClick`. */
    private addZone(x: number, y: number, width: number, index: number, onClick: (() => void) | undefined): void {
        const zone = this.scene.add.zone(x, y, width, MENU_ITEM.hitHeight).setInteractive({ useHandCursor: onClick !== undefined });
        this.zones.push(zone);
        zone.on(Phaser.Input.Events.POINTER_OVER, () => this.select(index));
        zone.on(Phaser.Input.Events.POINTER_UP, () => {
            if (!this.ready()) return;
            this.select(index);
            onClick?.();
            this.refresh();
        });
    }

    /** Orange arrow button of the original, pointing right when flipped. */
    private addArrow(x: number, y: number, pointsRight: boolean): Phaser.GameObjects.Image {
        return this.scene.add.image(x, y, MENU_ARROW.texture, MENU_ARROW.frame).setOrigin(0.5).setScale(MENU_ARROW.scale).setFlipX(pointsRight);
    }

    /** Sprite-font text with its vertical centre on y. */
    private addText(x: number, y: number, text: string, align: 'left' | 'center' | 'right'): SpriteText {
        const sprite = new SpriteText(this.scene, x, y, text, MENU_ITEM.color, align);
        sprite.container.setScale(MENU_ITEM.scale);
        sprite.container.y = y - (sprite.container.getBounds().height || 0) / 2;
        return sprite;
    }
}
