// Pantalla de subida de nivel: la partida se pausa y se elige 1 de 3 cartas (las arma systems/UpgradePool.ts).
// Tipos (Fase 20C): stat ("+3 a un stat") y pasiva (Stone of Xelima, Stone of Merien, Magnet Amulet). Las pasivas
// llevan su dibujo (icono original de la piedra o imagen propia) en lugar del círculo de color.
// Siempre hay una carta resaltada. Se elige con flechas/WASD, cruceta o stick + Enter/Espacio/A, o con el ratón.
import Phaser from 'phaser';
import { byDevice } from '../config/device';
import { GAME_WIDTH, LEVEL_UP_INPUT_DELAY_MS } from '../config/gameConfig';
import { HUD_TOP } from '../config/hud';
import { px, UI_TEXT, UI_FONT_SIZE } from '../config/ui';
import { itemPackTexture } from '../config/equipment';
import { STAT_INFO, type StatId } from '../data/stats';
import { getPassive, type PassiveIcon } from '../data/passives';
import type { CharacterStats } from '../entities/CharacterStats';
import type { Equipment } from '../entities/Equipment';
import { Action, InputSystem } from '../systems/InputSystem';
import type { LevelUpChoice } from '../systems/UpgradePool';
import { overlayBottom, playAreaBottom } from '../ui/hudLayout';

export type { LevelUpChoice } from '../systems/UpgradePool';

export interface LevelUpSceneData {
    stats: CharacterStats;
    equipment: Equipment;
    choices: LevelUpChoice[];
    onChoose: (choice: LevelUpChoice) => void;
    /** Title over the cards; default "Power N!" (a chest's cards say something else, Fase 16B). */
    title?: string;
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

export class LevelUpScene extends Phaser.Scene {
    private params!: LevelUpSceneData;
    private inputSystem!: InputSystem;
    private cards: Card[] = [];
    private selected = 0;
    private openedAt = 0;
    private chosen = false;
    /** Card where the current click started; a click only counts if it starts and ends on the same card. */
    private pressedCard = -1;

    constructor() {
        super('LevelUp');
    }

    init(data: LevelUpSceneData): void {
        this.params = data;
        this.cards = [];
        this.selected = 0;
        this.chosen = false;
        this.pressedCard = -1;
    }

    create(): void {
        const { stats, choices, title } = this.params;
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
        const cardY = byDevice(HUD_TOP / 2 + 30, (SUBTITLE_Y + cardsBottom) / 2);
        const totalWidth = choices.length * CARD_WIDTH + (choices.length - 1) * CARD_GAP;
        const firstX = (GAME_WIDTH - totalWidth) / 2 + CARD_WIDTH / 2;
        choices.forEach((choice, i) => this.cards.push(this.createCard(choice, firstX + i * (CARD_WIDTH + CARD_GAP), cardY, i)));
        this.highlight(0);

        this.inputSystem = new InputSystem(this);
        // Cards are picked with their own click handlers, not with "click anywhere".
        this.inputSystem.setPointerMaxY(-1);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuLeft)) this.highlight(this.selected - 1);
        if (input.justPressed(Action.MenuRight)) this.highlight(this.selected + 1);
        if (input.justPressed(Action.Pick)) this.choose(this.selected);
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
        const title = this.add.text(0, top + CARD_TITLE_Y, text.title, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.large), fontStyle: 'bold', color: '#ffe080',
        }).setOrigin(0.5);
        const effect = this.add.text(0, top + CARD_EFFECT_Y, text.effect, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: '#a89870', align: 'center', wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0);
        // Below the effect line, which may wrap to two lines.
        const changes = this.add.text(0, top + CARD_EFFECT_Y + effect.height + 10, text.changes.join('\n'), {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), color: TEXT_COLOR, align: 'center', lineSpacing: 2, wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0);

        const container = this.add.container(x, y, [frame, badge, badgeText, title, effect, changes]);
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

    /** A passive's picture fitted in ICON_SIZE, or undefined while its texture is not loaded. */
    private picture(icon: PassiveIcon, y: number): Phaser.GameObjects.Image | undefined {
        const texture = icon.kind === 'item' ? itemPackTexture(icon.sheet) : icon.key;
        const frame = icon.kind === 'item' ? icon.frame : undefined;
        if (!this.textures.exists(texture) || (frame !== undefined && !this.textures.get(texture).has(String(frame)))) return undefined;
        const image = this.add.image(0, y, texture, frame);
        const size = ICON_SIZE * (icon.kind === 'image' ? icon.size ?? 1 : 1);
        return image.setScale(Math.min(ICON_MAX_SCALE, size / Math.max(image.width, image.height)));
    }

    private highlight(index: number): void {
        const count = this.cards.length;
        this.selected = ((index % count) + count) % count;
        this.cards.forEach((card, i) => {
            const on = i === this.selected;
            card.frame.setStrokeStyle(on ? 4 : 2, on ? CARD_HIGHLIGHT : CARD_BORDER);
            card.container.setScale(on ? HIGHLIGHT_SCALE : 1);
        });
    }

    private choose(index: number): void {
        const choice = this.params.choices[index];
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
                badge: info.short, badgeColor: info.color, title: `+${choice.points} ${info.name}`, effect: info.effect,
                changes: describeStatChanges(stats, choice.stat, choice.points),
            };
        }
        case 'passive': {
            const passive = getPassive(choice.passive);
            const pct = (rank: number) => `${passive.sign}${Math.round(equipment.passiveBonus(choice.passive, rank) * 100)}%`;
            return {
                badge: PASSIVE_BADGE.text, badgeColor: PASSIVE_BADGE.color, icon: passive.icon, title: `${passive.name} ${choice.rank}/${passive.maxRank}`,
                effect: passive.effect,
                changes: [`${passive.statLabel} ${pct(choice.rank - 1)} → ${pct(choice.rank)}`],
            };
        }
    }
}

/** "Before → after" lines for the stat and what it changes in play. */
function describeStatChanges(stats: CharacterStats, s: StatId, points: number): string[] {
    const after = stats.previewWith(s, points);
    const lines = [`${STAT_INFO[s].short} ${stats.stats[s]} → ${after.stats[s]}`];
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
