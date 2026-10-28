// Carta de botín (Fase 21A): al coger un objeto del suelo la partida se pausa y se compara con lo que se lleva en ese
// hueco: a la izquierda lo equipado, a la derecha lo encontrado (con la diferencia de daño o defensa en verde o rojo).
// Dos botones: "Equip" (se lo pone ya; lo encontrado que llevaba antes va a la bolsa) y "Keep in bag".
// Si las stats permanentes o el Level no llegan al requisito, sale en rojo y solo se puede guardar.
// Fase 21B: el nombre lleva el atributo delante y en su color, con una línea que dice qué hace; las varitas enseñan en
// gris su Mana Save, que funcionará cuando los hechizos gasten maná.
// Se elige con ←/→, cruceta o stick + Enter/A, o con el ratón o el dedo (en el móvil, todo más grande).
import Phaser from 'phaser';
import { itemPackTexture } from '../config/equipment';
import { byDevice } from '../config/device';
import { GAME_WIDTH, LEVEL_UP_INPUT_DELAY_MS } from '../config/gameConfig';
import { px, UI_FONT_SIZE, UI_TEXT } from '../config/ui';
import type { Gender } from '../data/appearance';
import { ATTRIBUTES } from '../data/attributes';
import { isUniqueItem, UNIQUE_LOOK } from '../data/uniques';
import { setColouredTexture } from '../hb/additiveTint';
import { describeItem, EQUIP_SLOT_NAMES, itemInfo, itemPicture, ownedItemColor, ownedItemName, ownedItemNameColor, ownedItemPower, requirementChecks, wandManaSave } from '../data/items';
import type { OwnedItem } from '../data/loot';
import type { Stats } from '../data/stats';
import { SpriteText } from '../hb/SpriteText';
import { Action, InputSystem } from '../systems/InputSystem';
import { overlayBottom, playAreaBottom } from '../ui/hudLayout';

export interface LootSceneData {
    item: OwnedItem;
    /** What the player wears in that slot now (undefined = nothing). */
    current: OwnedItem | undefined;
    gender: Gender;
    /** Permanent stats and Level: the requirement is checked against them, as in the Equipment screen. */
    stats: Readonly<Stats>;
    level: number;
    onEquip: () => void;
    onKeep: () => void;
}

const L = {
    titleY: byDevice(70, 60),
    subtitleY: byDevice(106, 98),
    cardWidth: byDevice(230, 262),
    cardHeight: byDevice(250, 272),
    cardGap: byDevice(40, 24),
    /** From the card's top: the "Equipped" / "Found" label, the picture's centre, the name, the rest of the text. */
    labelY: 16,
    pictureY: byDevice(66, 62),
    pictureSize: byDevice(56, 56),
    nameY: byDevice(112, 106),
    textY: byDevice(132, 124),
    textMargin: 12,
    nameScale: byDevice(1.4, 1.6),
    nameLetterHeight: 13,
    nameColor: 0xffe080,
    cardFill: 0x1c140c,
    cardBorder: 0x8a7038,
    foundBorder: 0xffe080,
    buttonWidth: byDevice(170, 210),
    buttonHeight: byDevice(40, 54),
    buttonGap: byDevice(30, 24),
    /** Gap between the cards and the buttons. */
    buttonsGap: byDevice(22, 14),
    buttonFill: 0x2e2216,
    buttonBorder: 0x8a7038,
    buttonHighlight: 0xffe080,
    disabledAlpha: 0.35,
    textColor: '#e8d9a8',
    dimColor: '#a89870',
    metColor: '#9ccf7a',
    unmetColor: '#ff6050',
    betterColor: '#70e070',
    worseColor: '#ff6050',
} as const;

interface Button {
    frame: Phaser.GameObjects.Rectangle;
    enabled: boolean;
    action: () => void;
}

export class LootScene extends Phaser.Scene {
    private params!: LootSceneData;
    private inputSystem!: InputSystem;
    private buttons: Button[] = [];
    private selected = 0;
    private openedAt = 0;
    private chosen = false;

    constructor() {
        super('Loot');
    }

    init(data: LootSceneData): void {
        this.params = data;
        this.buttons = [];
        this.selected = 0;
        this.chosen = false;
    }

    create(): void {
        const p = this.params;
        this.openedAt = this.time.now;
        this.add.rectangle(0, 0, GAME_WIDTH, playAreaBottom(), 0x000000, 0.6).setOrigin(0);
        this.add.text(GAME_WIDTH / 2, L.titleY, 'Loot!', {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.title), fontStyle: 'bold', color: '#ffe080', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5);
        const canWear = requirementChecks(p.item.id, p.stats, p.level).every((check) => check.met);
        this.add.text(GAME_WIDTH / 2, L.subtitleY, canWear ? 'Equip it now or keep it in your bag' : 'You can\'t wear it yet: keep it in your bag', {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: canWear ? L.textColor : L.unmetColor,
        }).setOrigin(0.5);

        // Cards and buttons centred together between the subtitle and the bottom of the overlay.
        const blockHeight = L.cardHeight + L.buttonsGap + L.buttonHeight;
        const top = Math.max(L.subtitleY + 24, (L.subtitleY + 20 + overlayBottom() - blockHeight) / 2);
        const cardY = top + L.cardHeight / 2;
        const offset = (L.cardWidth + L.cardGap) / 2;
        this.createCard(GAME_WIDTH / 2 - offset, cardY, 'Equipped', p.current, false);
        this.createCard(GAME_WIDTH / 2 + offset, cardY, 'Found', p.item, true);

        const buttonsY = top + L.cardHeight + L.buttonsGap + L.buttonHeight / 2;
        const buttonOffset = (L.buttonWidth + L.buttonGap) / 2;
        this.addButton(GAME_WIDTH / 2 - buttonOffset, buttonsY, 'Equip', canWear, p.onEquip);
        this.addButton(GAME_WIDTH / 2 + buttonOffset, buttonsY, 'Keep in bag', true, p.onKeep);
        this.highlight(canWear ? 0 : 1);

        this.inputSystem = new InputSystem(this);
        // Buttons are pressed with their own click handlers, not with "click anywhere".
        this.inputSystem.setPointerMaxY(-1);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuLeft)) this.move(-1);
        if (input.justPressed(Action.MenuRight)) this.move(1);
        if (input.justPressed(Action.Pick)) this.choose(this.selected);
    }

    private ready(): boolean {
        return !this.chosen && this.time.now - this.openedAt >= LEVEL_UP_INPUT_DELAY_MS;
    }

    private createCard(x: number, y: number, label: string, item: OwnedItem | undefined, found: boolean): void {
        const p = this.params;
        const id = item?.id;
        const attribute = item?.attribute ? ATTRIBUTES[item.attribute] : undefined;
        const top = -L.cardHeight / 2;
        const textWidth = L.cardWidth - L.textMargin * 2;
        const objects: Phaser.GameObjects.GameObject[] = [
            this.add.rectangle(0, 0, L.cardWidth, L.cardHeight, L.cardFill, 0.95).setStrokeStyle(found ? 3 : 2, found ? L.foundBorder : L.cardBorder),
            this.add.text(0, top + L.labelY, label, {
                ...UI_TEXT, fontSize: px(UI_FONT_SIZE.small), fontStyle: 'bold', color: found ? '#ffe080' : L.dimColor,
            }).setOrigin(0.5, 0),
        ];
        if (id) {
            const picture = this.picture(item, top + L.pictureY);
            if (picture) objects.push(picture);
        }
        const name = new SpriteText(this, 0, 0, item ? ownedItemName(item) : 'Nothing', (item ? ownedItemNameColor(item) : undefined) ?? L.nameColor, 'center', 'title');
        const nameScale = Math.min(L.nameScale, textWidth / Math.max(1, name.width));
        name.container.setScale(nameScale).setY(top + L.nameY - (L.nameLetterHeight * nameScale) / 2);
        objects.push(name.container);

        const lines: Array<{ text: string; color: string }> = [];
        if (id) {
            const slot = itemInfo(id)?.slot;
            // A wand's Mana Save goes with the slot, in grey (since Fase 26A it makes the Spell 2 cheaper).
            const manaSave = wandManaSave(id);
            const mana = manaSave ? ` · Mana save ${Math.round(manaSave * 100)}%` : '';
            if (slot) lines.push({ text: `${EQUIP_SLOT_NAMES[slot]}${mana}`, color: L.dimColor });
            lines.push({ text: describeItem(id), color: L.textColor });
            if (attribute) lines.push({ text: attribute.description, color: colorString(attribute.color) });
            if (isUniqueItem(id)) lines.push({ text: 'Unique', color: colorString(UNIQUE_LOOK.color) });
            const checks = requirementChecks(id, p.stats, p.level);
            if (checks.length > 0) {
                const unmet = checks.some((check) => !check.met);
                lines.push({ text: `Needs ${checks.map((check) => check.label).join(', ')}`, color: unmet ? L.unmetColor : L.metColor });
            }
            if (found && item) {
                const compare = this.comparison(item);
                if (compare) lines.push(compare);
            }
        }
        let lineY = top + L.textY;
        for (const line of lines) {
            const text = this.add.text(0, lineY, line.text, {
                ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: line.color, align: 'center', wordWrap: { width: textWidth },
            }).setOrigin(0.5, 0);
            lineY += text.height + 4;
            objects.push(text);
        }
        this.add.container(x, y, objects);
    }

    /** "Damage 9 → 20" in green if better, red if worse (against what is worn now), counting the attributes. */
    private comparison(item: OwnedItem): { text: string; color: string } | undefined {
        const after = ownedItemPower(item);
        const current = this.params.current;
        const before = current ? ownedItemPower(current) : undefined;
        const beforeValue = before && before.label === after.label ? before.value : 0;
        const diff = after.value - beforeValue;
        const color = diff > 0 ? L.betterColor : diff < 0 ? L.worseColor : L.dimColor;
        const sign = after.prefix ?? '';
        return { text: `${after.label} ${sign}${beforeValue}${after.unit} → ${sign}${after.value}${after.unit}`, color };
    }

    /** The item's picture (in its attribute's colour) fitted in pictureSize, or undefined while its texture is not loaded. */
    private picture(item: OwnedItem, y: number): Phaser.GameObjects.Image | undefined {
        const frame = itemPicture(item.id, this.params.gender);
        if (!frame) return undefined;
        const image = this.add.image(0, y, '__DEFAULT');
        if (!setColouredTexture(image, itemPackTexture(frame.sheet), frame.frame, ownedItemColor(item))) {
            image.destroy();
            return undefined;
        }
        return image.setScale(Math.min(2, L.pictureSize / Math.max(image.width, image.height)));
    }

    private addButton(x: number, y: number, label: string, enabled: boolean, action: () => void): void {
        const index = this.buttons.length;
        const frame = this.add.rectangle(x, y, L.buttonWidth, L.buttonHeight, L.buttonFill).setStrokeStyle(2, L.buttonBorder);
        const text = this.add.text(x, y, label, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.large), fontStyle: 'bold', color: L.textColor,
        }).setOrigin(0.5);
        if (!enabled) {
            frame.setAlpha(L.disabledAlpha);
            text.setAlpha(L.disabledAlpha);
        } else {
            frame.setInteractive({ useHandCursor: true });
            frame.on(Phaser.Input.Events.POINTER_OVER, () => this.highlight(index));
            frame.on(Phaser.Input.Events.POINTER_UP, () => {
                if (this.ready()) this.choose(index);
            });
        }
        this.buttons.push({ frame, enabled, action });
    }

    /** Next enabled button that way (stays put if there is none). */
    private move(step: number): void {
        const count = this.buttons.length;
        for (let i = 1; i < count; i++) {
            const index = (((this.selected + step * i) % count) + count) % count;
            if (this.buttons[index]?.enabled) {
                this.highlight(index);
                return;
            }
        }
    }

    private highlight(index: number): void {
        this.selected = index;
        this.buttons.forEach((button, i) => {
            const on = i === index;
            button.frame.setStrokeStyle(on ? 4 : 2, on ? L.buttonHighlight : L.buttonBorder);
        });
    }

    private choose(index: number): void {
        const button = this.buttons[index];
        if (!button || !button.enabled || this.chosen) return;
        this.chosen = true;
        button.action();
    }
}

/** 0xff8040 → '#ff8040'. */
function colorString(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
}
