// Pantalla de subida de nivel: la partida se pausa y se elige 1 de 3 cartas (las arma systems/UpgradePool.ts).
// Tipos (Fase 20C): stat ("+3 a un stat") y pasiva (Stone of Xelima, Stone of Merien, Magnet Amulet). Las pasivas
// llevan su dibujo (icono original de la piedra o imagen propia) en lugar del círculo de color.
// Fase 21½A: rareza (data/cardRarity.ts). Las Rare y Epic llevan un marco interior y una cinta de su color arriba;
// las Epic, además, un brillo que late detrás (su sonido lo pone GameScene.openLevelUp). Las Common se ven como siempre.
// Fase 21½B: bajo las cartas, botones Reroll (dado) y Skip (vino) con lo que queda en la partida; solo salen si se ha
// comprado alguno (UnlockStore) y se ven apagados al gastarlos. Con flechas abajo/arriba se pasa de las cartas a ellos.
// Siempre hay algo resaltado (una carta o un botón). Se elige con flechas/WASD, cruceta o stick + Enter/Espacio/A, o con
// el ratón o el dedo.
import Phaser from 'phaser';
import { SpriteText } from '../hb/SpriteText';
import { byDevice } from '../config/device';
import { GAME_WIDTH, LEVEL_UP_INPUT_DELAY_MS } from '../config/gameConfig';
import { HUD_TOP } from '../config/hud';
import { px, UI_TEXT, UI_FONT_SIZE } from '../config/ui';
import { itemPackTexture } from '../config/equipment';
import { STAT_INFO, type StatId } from '../data/stats';
import { getPassive, type PassiveIcon } from '../data/passives';
import { CARD_RARITY, EPIC_CARD_GLOW, type CardRarity } from '../data/cardRarity';
import { CARD_ACTION, CARD_ACTIONS, DICE_FACE, WINE_ICON, type CardAction } from '../data/rerollSkip';
import type { CharacterStats } from '../entities/CharacterStats';
import type { Equipment } from '../entities/Equipment';
import { Action, InputSystem } from '../systems/InputSystem';
import { unlockStore } from '../systems/UnlockStore';
import { createDice } from '../ui/DiceIcon';
import type { LevelUpChoice } from '../systems/UpgradePool';
import { overlayBottom, playAreaBottom } from '../ui/hudLayout';

export type { LevelUpChoice } from '../systems/UpgradePool';

export interface LevelUpSceneData {
    stats: CharacterStats;
    equipment: Equipment;
    choices: LevelUpChoice[];
    /** A card picked, or undefined for a Skip. */
    onChoose: (choice: LevelUpChoice | undefined) => void;
    /** Title over the cards; default "Power N!" (a chest's cards say something else, Fase 16B). */
    title?: string;
    /** Rerolls and Skips left in this run (Fase 21½B); read again after each use. */
    actionsLeft: Readonly<Record<CardAction, number>>;
    /** Spends a Reroll and returns the three new cards. */
    onReroll: () => LevelUpChoice[];
    /** Spends a Skip (heals) and closes the cards. */
    onSkip: () => void;
}

// Phones (config/device.ts): bigger cards for the bigger text, nearly as wide as the screen.
const CARD_WIDTH = byDevice(230, 252);
const CARD_HEIGHT = byDevice(256, 335);
const CARD_GAP = byDevice(24, 12);
/** From the card's top edge: centre of the badge and of the title, and top of the effect line. */
const CARD_BADGE_Y = byDevice(44, 46);
const CARD_TITLE_Y = byDevice(92, 102);
const CARD_EFFECT_Y = byDevice(116, 128);
/** Space left free at each side of the card's text. */
const CARD_TEXT_MARGIN = byDevice(12, 10);
/** Title in the original's drawn font (hb/SpriteText.ts, 'title'; 13 px letters): its scale, smaller if it doesn't fit. */
const CARD_TITLE_SCALE = byDevice(1.5, 1.7);
const CARD_TITLE_LETTER_HEIGHT = 13;
const CARD_TITLE_COLOR = 0xffe080;
// Phones: below the boss bar (a boss can be alive while choosing).
const TITLE_Y = byDevice(70, 80);
const SUBTITLE_Y = byDevice(108, 120);
/** From the bottom of the game area (the HUD bar's top, or the bottom of the screen). */
/** Phones: space kept free under the cards, above the bottom of the overlay. */
const CARDS_BOTTOM_GAP = 24;
const CARD_FILL = 0x1c140c;
const CARD_BORDER = 0x8a7038;
const CARD_HIGHLIGHT = 0xffe080;
const HIGHLIGHT_SCALE = 1.05;
const BADGE_RADIUS = byDevice(26, 30);
/** Largest side of a passive's picture, drawn where the badge goes (small item icons grow up to ICON_MAX_SCALE). */
const ICON_SIZE = byDevice(64, 72);
const ICON_MAX_SCALE = 2;
const TEXT_COLOR = '#e8d9a8';
/** Badge of a passive card while its picture is not loaded yet (item-pack.spr downloads when the run starts). */
const PASSIVE_BADGE = { text: 'Pas', color: 0x508050 } as const;
/** Rare and Epic cards: inner frame (inset from the edge) and the ribbon with the rarity's name on the top edge. */
const RARITY_FRAME_INSET = 6;
const RARITY_FRAME_WIDTH = 3;
const RARITY_RIBBON = { width: byDevice(84, 96), height: byDevice(22, 26) } as const;
/** Reroll / Skip buttons (Fase 21½B): size, gap between them, and space between the cards and them. */
const ACTION_BUTTON = { width: byDevice(150, 190), height: byDevice(38, 48), gap: byDevice(24, 28), marginTop: byDevice(26, 14) } as const;
const ACTION_ICON_SIZE = byDevice(24, 30);
const ACTION_FILL = 0x1c140c;
const ACTION_USED_ALPHA = 0.35;
/** Phones with the buttons: the cards shrink a little to leave room under them. */
const CARD_SCALE_WITH_ACTIONS = byDevice(1, 0.88);
/** New cards after a Reroll fade in this fast. */
const REROLL_FADE_MS = 160;

/** What a card shows: badge (or picture), title, one line of effect and the "before → after" lines. */
interface CardText {
    badge: string;
    badgeColor: number;
    icon?: PassiveIcon;
    title: string;
    effect: string;
    changes: string[];
}

interface Card {
    container: Phaser.GameObjects.Container;
    frame: Phaser.GameObjects.Rectangle;
}

interface ActionButton {
    action: CardAction;
    container: Phaser.GameObjects.Container;
    frame: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    dice: Phaser.GameObjects.Graphics | undefined;
}

export class LevelUpScene extends Phaser.Scene {
    private params!: LevelUpSceneData;
    private inputSystem!: InputSystem;
    private cards: Card[] = [];
    private choices: LevelUpChoice[] = [];
    private selected = 0;
    /** Reroll / Skip buttons shown (only those bought), and the one highlighted (-1 = a card is). */
    private buttons: ActionButton[] = [];
    private selectedButton = -1;
    private cardScale = 1;
    private cardsX: number[] = [];
    private cardY = 0;
    private openedAt = 0;
    private chosen = false;
    /** Card where the current click started; a click only counts if it starts and ends on the same card. */
    private pressedCard = -1;
    private pressedButton = -1;

    constructor() {
        super('LevelUp');
    }

    init(data: LevelUpSceneData): void {
        this.params = data;
        this.cards = [];
        this.choices = data.choices;
        this.buttons = [];
        this.selected = 0;
        this.selectedButton = -1;
        this.chosen = false;
        this.pressedCard = -1;
        this.pressedButton = -1;
    }

    create(): void {
        const { stats, title } = this.params;
        const choices = this.choices;
        this.openedAt = this.time.now;
        const bottom = playAreaBottom();
        // Above the compact gauges when they run along the bottom.
        const cardsBottom = overlayBottom() - CARDS_BOTTOM_GAP;
        this.add.rectangle(0, 0, GAME_WIDTH, bottom, 0x000000, 0.6).setOrigin(0);
        this.add.text(GAME_WIDTH / 2, TITLE_Y, title ?? `Power ${stats.level}!`, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.title), fontStyle: 'bold', color: '#ffe080', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.add.text(GAME_WIDTH / 2, SUBTITLE_Y, 'Choose an upgrade', { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: TEXT_COLOR }).setOrigin(0.5);

        // PC: as always. Phones: centred between the subtitle and the bottom, which moves down with the compact HUD.
        // (Fase 11: no controls text here; they are explained in How to play.)
        // Fase 21½B: with Reroll / Skip, their row goes under the cards (phones: the cards shrink and move up for it).
        const actions = CARD_ACTIONS.filter((action) => unlockStore.count(CARD_ACTION[action].unlock) > 0);
        this.cardScale = actions.length > 0 ? CARD_SCALE_WITH_ACTIONS : 1;
        const rowSpace = actions.length > 0 ? ACTION_BUTTON.marginTop + ACTION_BUTTON.height : 0;
        const cardHeight = CARD_HEIGHT * this.cardScale;
        const cardWidth = CARD_WIDTH * this.cardScale;
        this.cardY = byDevice(HUD_TOP / 2 + 30, (SUBTITLE_Y + cardsBottom - rowSpace) / 2);
        const totalWidth = choices.length * cardWidth + (choices.length - 1) * CARD_GAP;
        const firstX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
        this.cardsX = choices.map((_, i) => firstX + i * (cardWidth + CARD_GAP));
        this.buildCards();
        if (actions.length > 0) this.createButtons(actions, this.cardY + cardHeight / 2 + ACTION_BUTTON.marginTop + ACTION_BUTTON.height / 2);
        this.highlight(0);

        this.inputSystem = new InputSystem(this);
        // Cards are picked with their own click handlers, not with "click anywhere".
        this.inputSystem.setPointerMaxY(-1);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (this.selectedButton >= 0) {
            if (input.justPressed(Action.MenuLeft)) this.highlightButton(this.selectedButton - 1);
            if (input.justPressed(Action.MenuRight)) this.highlightButton(this.selectedButton + 1);
            if (input.justPressed(Action.MenuUp)) this.highlight(this.selected);
            if (input.justPressed(Action.Pick)) this.useButton(this.selectedButton);
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.highlight(this.selected - 1);
        if (input.justPressed(Action.MenuRight)) this.highlight(this.selected + 1);
        if (input.justPressed(Action.MenuDown) && this.buttons.length > 0) this.highlightButton(this.firstUsableButton());
        if (input.justPressed(Action.Pick)) this.choose(this.selected);
    }

    /** The cards of `this.choices`, replacing any shown (a Reroll). */
    private buildCards(): void {
        for (const card of this.cards) card.container.destroy();
        this.cards = this.choices.map((choice, i) => this.createCard(choice, this.cardsX[i] ?? GAME_WIDTH / 2, this.cardY, i));
    }

    /** The Reroll / Skip row, centred at `y`. */
    private createButtons(actions: readonly CardAction[], y: number): void {
        const { width, height, gap } = ACTION_BUTTON;
        const totalWidth = actions.length * width + (actions.length - 1) * gap;
        actions.forEach((action, i) => {
            const x = (GAME_WIDTH - totalWidth) / 2 + width / 2 + i * (width + gap);
            const frame = this.add.rectangle(0, 0, width, height, ACTION_FILL, 0.95).setStrokeStyle(2, CARD_ACTION[action].color);
            const iconX = -width / 2 + ACTION_ICON_SIZE / 2 + 12;
            const dice = action === 'reroll' ? createDice(this, iconX, 0, ACTION_ICON_SIZE, DICE_FACE) : undefined;
            const wine = action === 'skip' ? this.itemIcon(WINE_ICON.sheet, WINE_ICON.frame, iconX, ACTION_ICON_SIZE * 1.3) : undefined;
            const label = this.add.text(iconX + ACTION_ICON_SIZE / 2 + 10, 0, '', {
                ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: TEXT_COLOR, stroke: '#000000', strokeThickness: 3,
            }).setOrigin(0, 0.5);
            const parts: Phaser.GameObjects.GameObject[] = [frame, label];
            if (dice) parts.push(dice);
            if (wine) parts.push(wine);
            const container = this.add.container(x, y, parts);
            const index = i;
            frame.setInteractive({ useHandCursor: true });
            frame.on(Phaser.Input.Events.POINTER_OVER, () => {
                if (this.usable(index)) this.highlightButton(index);
            });
            frame.on(Phaser.Input.Events.POINTER_DOWN, () => {
                this.pressedButton = this.ready() ? index : -1;
            });
            frame.on(Phaser.Input.Events.POINTER_UP, () => {
                if (this.ready() && this.pressedButton === index) this.useButton(index);
                this.pressedButton = -1;
            });
            this.buttons.push({ action, container, frame, label, dice });
        });
        this.refreshButtons();
    }

    /** Uses left on each button ("Reroll ×2"); a used-up one goes dim. */
    private refreshButtons(): void {
        for (const button of this.buttons) {
            const left = this.params.actionsLeft[button.action];
            button.label.setText(`${CARD_ACTION[button.action].label} ×${left}`);
            button.container.setAlpha(left > 0 ? 1 : ACTION_USED_ALPHA);
        }
    }

    private usable(index: number): boolean {
        const button = this.buttons[index];
        return button !== undefined && this.params.actionsLeft[button.action] > 0;
    }

    /** The first button with uses left, or the first one (dim) if none has. */
    private firstUsableButton(): number {
        const index = this.buttons.findIndex((_, i) => this.usable(i));
        return index >= 0 ? index : 0;
    }

    /** Highlights a button (wraps around) and no card. */
    private highlightButton(index: number): void {
        const count = this.buttons.length;
        if (count === 0) return;
        this.selectedButton = ((index % count) + count) % count;
        this.paintHighlight();
    }

    private useButton(index: number): void {
        const button = this.buttons[index];
        if (!button || this.chosen || !this.usable(index)) return;
        if (button.action === 'skip') {
            this.chosen = true;
            this.params.onSkip();
            return;
        }
        this.choices = this.params.onReroll();
        this.buildCards();
        for (const card of this.cards) {
            card.container.setAlpha(0);
            this.tweens.add({ targets: card.container, alpha: 1, duration: REROLL_FADE_MS });
        }
        this.refreshButtons();
        // Used up: back to the cards.
        if (this.usable(index)) this.paintHighlight();
        else this.highlight(this.selected);
    }

    private ready(): boolean {
        return !this.chosen && this.time.now - this.openedAt >= LEVEL_UP_INPUT_DELAY_MS;
    }

    private createCard(choice: LevelUpChoice, x: number, y: number, index: number): Card {
        const text = describeCard(this.params.stats, this.params.equipment, choice);
        const frame = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_FILL, 0.95).setStrokeStyle(2, CARD_BORDER);
        const top = -CARD_HEIGHT / 2;
        const textWidth = CARD_WIDTH - CARD_TEXT_MARGIN * 2;
        const picture = text.icon ? this.picture(text.icon, top + CARD_BADGE_Y) : undefined;
        const badge = picture ?? this.add.circle(0, top + CARD_BADGE_Y, BADGE_RADIUS, text.badgeColor).setStrokeStyle(2, 0x000000);
        const badgeText = this.add.text(0, top + CARD_BADGE_Y, picture ? '' : text.badge, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        const title = new SpriteText(this, 0, 0, text.title, CARD_TITLE_COLOR, 'center', 'title');
        const titleScale = Math.min(CARD_TITLE_SCALE, textWidth / Math.max(1, title.width));
        title.container.setScale(titleScale).setY(top + CARD_TITLE_Y - (CARD_TITLE_LETTER_HEIGHT * titleScale) / 2);
        const effect = this.add.text(0, top + CARD_EFFECT_Y, text.effect, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: '#a89870', align: 'center', wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0);
        // Below the effect line, which may wrap to two lines.
        const changes = this.add.text(0, top + CARD_EFFECT_Y + effect.height + 10, text.changes.join('\n'), {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: TEXT_COLOR, align: 'center', lineSpacing: 2, wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0);

        const container = this.add.container(x, y, [...this.rarityParts(choice.rarity, frame), badge, badgeText, title.container, effect, changes]);
        frame.setInteractive({ useHandCursor: true });
        frame.on(Phaser.Input.Events.POINTER_OVER, () => this.highlight(index));
        frame.on(Phaser.Input.Events.POINTER_DOWN, () => {
            this.pressedCard = this.ready() ? index : -1;
        });
        // A button held since before the cards appeared (running with the mouse) must not pick one when released.
        frame.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready() && this.pressedCard === index) this.choose(index);
            this.pressedCard = -1;
        });
        return { container, frame };
    }

    /** The card's frame with what its rarity adds: Epic glow behind it, inner frame and ribbon on top (Common: only the frame). */
    private rarityParts(rarity: CardRarity, frame: Phaser.GameObjects.Rectangle): Phaser.GameObjects.GameObject[] {
        if (rarity === 'common') return [frame];
        const { color, label } = CARD_RARITY[rarity];
        const top = -CARD_HEIGHT / 2;
        const inner = this.add.rectangle(0, 0, CARD_WIDTH - RARITY_FRAME_INSET * 2, CARD_HEIGHT - RARITY_FRAME_INSET * 2)
            .setStrokeStyle(RARITY_FRAME_WIDTH, color);
        const ribbon = this.add.rectangle(0, top, RARITY_RIBBON.width, RARITY_RIBBON.height, color).setStrokeStyle(2, 0x000000);
        const ribbonText = this.add.text(0, top, label, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        if (rarity !== 'epic') return [frame, inner, ribbon, ribbonText];
        const { pad, alpha, pulseMs } = EPIC_CARD_GLOW;
        const glow = this.add.rectangle(0, 0, CARD_WIDTH + pad * 2, CARD_HEIGHT + pad * 2, color, alpha.min);
        this.tweens.add({ targets: glow, alpha: alpha.max, duration: pulseMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return [glow, frame, inner, ribbon, ribbonText];
    }

    /** An item-pack icon fitted in `size`, or undefined while its sheet is not loaded (it downloads when the run starts). */
    private itemIcon(sheet: number, frame: number, x: number, size: number): Phaser.GameObjects.Image | undefined {
        const texture = itemPackTexture(sheet);
        if (!this.textures.exists(texture) || !this.textures.get(texture).has(String(frame))) return undefined;
        const image = this.add.image(x, 0, texture, frame);
        return image.setScale(Math.min(ICON_MAX_SCALE, size / Math.max(image.width, image.height)));
    }

    /** A passive's picture fitted in ICON_SIZE, or undefined while its texture is not loaded. */
    private picture(icon: PassiveIcon, y: number): Phaser.GameObjects.Image | undefined {
        const texture = icon.kind === 'item' ? itemPackTexture(icon.sheet) : icon.key;
        const frame = icon.kind === 'item' ? icon.frame : undefined;
        if (!this.textures.exists(texture) || (frame !== undefined && !this.textures.get(texture).has(String(frame)))) return undefined;
        const image = this.add.image(0, y, texture, frame);
        const size = ICON_SIZE * (icon.kind === 'image' ? icon.size ?? 1 : 1);
        return image.setScale(Math.min(ICON_MAX_SCALE, size / Math.max(image.width, image.height)));
    }

    /** Highlights a card (wraps around) and no button. */
    private highlight(index: number): void {
        const count = this.cards.length;
        this.selected = ((index % count) + count) % count;
        this.selectedButton = -1;
        this.paintHighlight();
    }

    private paintHighlight(): void {
        this.cards.forEach((card, i) => {
            const on = this.selectedButton < 0 && i === this.selected;
            card.frame.setStrokeStyle(on ? 4 : 2, on ? CARD_HIGHLIGHT : CARD_BORDER);
            card.container.setScale(this.cardScale * (on ? HIGHLIGHT_SCALE : 1));
        });
        this.buttons.forEach((button, i) => {
            const on = i === this.selectedButton;
            button.frame.setStrokeStyle(on ? 4 : 2, on ? CARD_HIGHLIGHT : CARD_ACTION[button.action].color);
            button.container.setScale(on ? HIGHLIGHT_SCALE : 1);
        });
    }

    private choose(index: number): void {
        const choice = this.choices[index];
        if (!choice || this.chosen) return;
        this.chosen = true;
        this.params.onChoose(choice);
    }
}

function describeCard(stats: CharacterStats, equipment: Equipment, choice: LevelUpChoice): CardText {
    switch (choice.kind) {
        case 'stat': {
            const info = STAT_INFO[choice.stat];
            return {
                badge: info.short, badgeColor: info.color, // "Blessing of Str": tells them apart from the permanent stat points of the Level (bug list of 19-oct-2026, M16).
                title: `Blessing of ${info.short}`, effect: info.effect,
                changes: describeStatChanges(stats, choice.stat, choice.points),
            };
        }
        case 'passive': {
            const passive = getPassive(choice.passive);
            const pct = (rank: number) => `${passive.sign}${Math.round(equipment.passiveBonus(choice.passive, rank) * 100)}%`;
            // Rare and Epic cards add several ranks at once (Fase 21½A): "before" is the rank the player has now.
            return {
                badge: PASSIVE_BADGE.text, badgeColor: PASSIVE_BADGE.color, icon: passive.icon, title: `${passive.name} ${choice.rank}/${passive.maxRank}`,
                effect: passive.effect,
                changes: [`${passive.statLabel} ${pct(equipment.passives[choice.passive])} → ${pct(choice.rank)}`],
            };
        }
    }
}

/** "Before → after" lines for the stat and what it changes in play. */
function describeStatChanges(stats: CharacterStats, s: StatId, points: number): string[] {
    const after = stats.previewWith(s, points);
    const lines = [`${STAT_INFO[s].short} ${stats.stats[s]} → ${after.stats[s]} (+${points})`];
    const pct = (value: number) => `${Math.round(value * 100)}%`;
    const bonus = (multiplier: number) => `${multiplier >= 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`;
    switch (s) {
        case 'str':
            lines.push(`Physical damage ${bonus(stats.damageMultiplier('physical'))} → ${bonus(after.damageMultiplier('physical'))}`);
            break;
        case 'vit':
            lines.push(`Health ${stats.maxHp} → ${after.maxHp}`);
            break;
        case 'dex':
            lines.push(`Speed ${bonus(stats.moveSpeedMultiplier)} → ${bonus(after.moveSpeedMultiplier)}`);
            lines.push(`Cooldown ${pct(stats.cooldownMultiplier)} → ${pct(after.cooldownMultiplier)}`);
            break;
        case 'int':
            lines.push(`Mana ${stats.maxMana} → ${after.maxMana}`);
            break;
        case 'mag':
            lines.push(`Magic damage ${bonus(stats.damageMultiplier('magic'))} → ${bonus(after.damageMultiplier('magic'))}`);
            lines.push(`Mana ${stats.maxMana} → ${after.maxMana}`);
            break;
        case 'chr':
            lines.push(`Critical ${pct(stats.critChance)} → ${pct(after.critChance)}`);
            break;
    }
    return lines;
}
