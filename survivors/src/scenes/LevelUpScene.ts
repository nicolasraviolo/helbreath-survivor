// Pantalla de subida de nivel: la partida se pausa y se elige 1 de 3 cartas.
// Fase 5: solo cartas de stat ("+3 a un stat"); en la Fase 6 se añaden arma nueva, mejora de eslabón y armadura.
// Siempre hay una carta resaltada. Se elige con flechas/WASD, cruceta o stick + Enter/Espacio/A, o con el ratón.
import Phaser from 'phaser';
import { GAME_WIDTH, LEVEL_UP_INPUT_DELAY_MS } from '../config/gameConfig';
import { HUD_TOP } from '../config/hud';
import { px, UI_FONT, UI_FONT_SIZE } from '../config/ui';
import { STAT_INFO, type StatId } from '../data/stats';
import type { CharacterStats } from '../entities/CharacterStats';
import { Action, InputSystem } from '../systems/InputSystem';

export interface LevelUpChoice {
    stat: StatId;
    points: number;
}

export interface LevelUpSceneData {
    stats: CharacterStats;
    choices: LevelUpChoice[];
    onChoose: (choice: LevelUpChoice) => void;
}

const CARD_WIDTH = 230;
const CARD_HEIGHT = 230;
const CARD_GAP = 24;
const CARD_Y = HUD_TOP / 2 + 30;
const CARD_FILL = 0x1c140c;
const CARD_BORDER = 0x8a7038;
const CARD_HIGHLIGHT = 0xffe080;
const HIGHLIGHT_SCALE = 1.05;
const BADGE_RADIUS = 26;
const TEXT_COLOR = '#e8d9a8';

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
        const { stats, choices } = this.params;
        this.openedAt = this.time.now;
        this.add.rectangle(0, 0, GAME_WIDTH, HUD_TOP, 0x000000, 0.6).setOrigin(0);
        this.add.text(GAME_WIDTH / 2, 70, `Level ${stats.level}!`, {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.title), fontStyle: 'bold', color: '#ffe080', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.add.text(GAME_WIDTH / 2, 108, 'Choose an upgrade', { fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: TEXT_COLOR }).setOrigin(0.5);
        this.add.text(GAME_WIDTH / 2, HUD_TOP - 24, '← →  and  Enter   ·   D-pad or stick  and  A   ·   Click', {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.small), color: '#a89870',
        }).setOrigin(0.5);

        const totalWidth = choices.length * CARD_WIDTH + (choices.length - 1) * CARD_GAP;
        const firstX = (GAME_WIDTH - totalWidth) / 2 + CARD_WIDTH / 2;
        choices.forEach((choice, i) => this.cards.push(this.createCard(choice, firstX + i * (CARD_WIDTH + CARD_GAP), i)));
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
        if (input.justPressed(Action.Confirm)) this.choose(this.selected);
    }

    private ready(): boolean {
        return !this.chosen && this.time.now - this.openedAt >= LEVEL_UP_INPUT_DELAY_MS;
    }

    private createCard(choice: LevelUpChoice, x: number, index: number): Card {
        const info = STAT_INFO[choice.stat];
        const frame = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_FILL, 0.95).setStrokeStyle(2, CARD_BORDER);
        const top = -CARD_HEIGHT / 2;
        const badge = this.add.circle(0, top + 44, BADGE_RADIUS, info.color).setStrokeStyle(2, 0x000000);
        const badgeText = this.add.text(0, top + 44, info.short, {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        const title = this.add.text(0, top + 92, `+${choice.points} ${info.name}`, {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.large), fontStyle: 'bold', color: '#ffe080',
        }).setOrigin(0.5);
        const effect = this.add.text(0, top + 116, info.effect, {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: '#a89870', align: 'center', wordWrap: { width: CARD_WIDTH - 24 },
        }).setOrigin(0.5, 0);
        const changes = this.add.text(0, top + 158, describeChanges(this.params.stats, choice).join('\n'), {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: TEXT_COLOR, align: 'center', lineSpacing: 2,
        }).setOrigin(0.5, 0);

        const container = this.add.container(x, CARD_Y, [frame, badge, badgeText, title, effect, changes]);
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

/** "Before → after" lines for the stat and what it changes in play. */
function describeChanges(stats: CharacterStats, choice: LevelUpChoice): string[] {
    const after = stats.previewWith(choice.stat, choice.points);
    const s = choice.stat;
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
