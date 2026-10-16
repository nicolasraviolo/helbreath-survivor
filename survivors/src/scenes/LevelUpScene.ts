// Pantalla de subida de nivel: la partida se pausa y se elige 1 de 3 cartas (las arma systems/UpgradePool.ts).
// Tipos: stat ("+3 a un stat"), eslabón de arma, cambio de familia de arma y armadura.
// Siempre hay una carta resaltada. Se elige con flechas/WASD, cruceta o stick + Enter/Espacio/A, o con el ratón.
import Phaser from 'phaser';
import { GAME_WIDTH, LEVEL_UP_INPUT_DELAY_MS } from '../config/gameConfig';
import { HUD_TOP } from '../config/hud';
import { px, UI_FONT, UI_FONT_SIZE } from '../config/ui';
import { ARMOR_SLOT_NAMES, getArmorPiece } from '../data/armor';
import { STAT_INFO, type StatId } from '../data/stats';
import { getPassive } from '../data/passives';
import { getSpell, SPELL_FAMILIES, type SpellDef } from '../data/spells';
import { getMeleeWeapon, MELEE_FAMILIES, type MeleeWeaponDef } from '../data/weapons';
import type { CharacterStats } from '../entities/CharacterStats';
import type { Equipment } from '../entities/Equipment';
import { Action, InputSystem } from '../systems/InputSystem';
import type { LevelUpChoice } from '../systems/UpgradePool';

export type { LevelUpChoice } from '../systems/UpgradePool';

export interface LevelUpSceneData {
    stats: CharacterStats;
    equipment: Equipment;
    choices: LevelUpChoice[];
    onChoose: (choice: LevelUpChoice) => void;
}

const CARD_WIDTH = 230;
const CARD_HEIGHT = 256;
const CARD_GAP = 24;
const CARD_Y = HUD_TOP / 2 + 30;
const CARD_FILL = 0x1c140c;
const CARD_BORDER = 0x8a7038;
const CARD_HIGHLIGHT = 0xffe080;
const HIGHLIGHT_SCALE = 1.05;
const BADGE_RADIUS = 26;
const TEXT_COLOR = '#e8d9a8';
/** Badge of the weapon and armor cards. */
const WEAPON_BADGE = { text: 'Wpn', color: 0x9a9a9a } as const;
const ARMOR_BADGE = { text: 'Arm', color: 0x6a5030 } as const;
const SPELL_BADGE = { text: 'Spl', color: 0x3858b0 } as const;
const PASSIVE_BADGE = { text: 'Pas', color: 0x508050 } as const;

/** What a card shows: badge, title, one line of effect and the "before → after" lines. */
interface CardText {
    badge: string;
    badgeColor: number;
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
        const text = describeCard(this.params.stats, this.params.equipment, choice);
        const frame = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_FILL, 0.95).setStrokeStyle(2, CARD_BORDER);
        const top = -CARD_HEIGHT / 2;
        const badge = this.add.circle(0, top + 44, BADGE_RADIUS, text.badgeColor).setStrokeStyle(2, 0x000000);
        const badgeText = this.add.text(0, top + 44, text.badge, {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        const title = this.add.text(0, top + 92, text.title, {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.large), fontStyle: 'bold', color: '#ffe080',
        }).setOrigin(0.5);
        const effect = this.add.text(0, top + 116, text.effect, {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: '#a89870', align: 'center', wordWrap: { width: CARD_WIDTH - 24 },
        }).setOrigin(0.5, 0);
        // Below the effect line, which may wrap to two lines.
        const changes = this.add.text(0, top + 116 + effect.height + 10, text.changes.join('\n'), {
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

function describeCard(stats: CharacterStats, equipment: Equipment, choice: LevelUpChoice): CardText {
    switch (choice.kind) {
        case 'stat': {
            const info = STAT_INFO[choice.stat];
            return {
                badge: info.short, badgeColor: info.color, title: `+${choice.points} ${info.name}`, effect: info.effect,
                changes: describeStatChanges(stats, choice.stat, choice.points),
            };
        }
        case 'weaponLink':
        case 'weaponSwitch': {
            const weapon = getMeleeWeapon(choice.weapon);
            const from = getMeleeWeapon(choice.from);
            const family = MELEE_FAMILIES[weapon.family].name;
            return {
                badge: WEAPON_BADGE.text, badgeColor: WEAPON_BADGE.color, title: weapon.name,
                effect: choice.kind === 'weaponLink' ? `${family} · stronger link` : `${family} · replaces ${from.name}`,
                changes: describeWeaponChanges(stats, from, weapon),
            };
        }
        case 'spellLink':
        case 'spellSwitch': {
            const spell = getSpell(choice.spell);
            const from = getSpell(choice.from);
            const family = SPELL_FAMILIES[spell.family].name;
            return {
                badge: SPELL_BADGE.text, badgeColor: SPELL_BADGE.color, title: spell.name,
                effect: choice.kind === 'spellLink' ? `${family} · stronger spell` : `${family} · replaces ${from.name}`,
                changes: describeSpellChanges(stats, from, spell),
            };
        }
        case 'passive': {
            const passive = getPassive(choice.passive);
            const pct = (rank: number) => `+${Math.round(equipment.passiveBonus(choice.passive, rank) * 100)}%`;
            return {
                badge: PASSIVE_BADGE.text, badgeColor: PASSIVE_BADGE.color, title: `${passive.name} ${choice.rank}/${passive.maxRank}`,
                effect: passive.effect,
                changes: [`${passive.statLabel} ${pct(choice.rank - 1)} → ${pct(choice.rank)}`],
            };
        }
        case 'armor': {
            const piece = getArmorPiece(choice.piece);
            const pct = (value: number) => `${Math.round(value * 100)}%`;
            const changes = [`Damage taken −${pct(equipment.defense)} → −${pct(equipment.defenseWith(choice.piece))}`];
            const magicAfter = equipment.magicDamageBonusWith(choice.piece);
            if (magicAfter !== equipment.magicDamageBonus) changes.push(`Magic damage +${pct(equipment.magicDamageBonus)} → +${pct(magicAfter)}`);
            return {
                badge: ARMOR_BADGE.text, badgeColor: ARMOR_BADGE.color, title: piece.name,
                effect: choice.from ? `${ARMOR_SLOT_NAMES[piece.slot]} · replaces ${getArmorPiece(choice.from).name}` : ARMOR_SLOT_NAMES[piece.slot],
                changes,
            };
        }
    }
}

/** Damage of one projectile on the enemy it hits (with the Mag bonus), rhythm, projectiles and area: spell in hand → new one. */
function describeSpellChanges(stats: CharacterStats, from: SpellDef, to: SpellDef): string[] {
    const damage = (spell: SpellDef) => Math.round((spell.directDamage + spell.areaDamage) * stats.damageMultiplier('magic'));
    const every = (spell: SpellDef) => `${((spell.cooldownMs * stats.cooldownMultiplier) / 1000).toFixed(2)}s`;
    const lines = [
        `Damage ${damage(from)} → ${damage(to)}`,
        `Cast every ${every(from)} → ${every(to)}`,
    ];
    if (from.shots !== to.shots) lines.push(`Projectiles ${from.shots} → ${to.shots}`);
    if (from.areaRadius !== to.areaRadius) lines.push(`Area ${from.areaRadius} → ${to.areaRadius}`);
    return lines;
}

/** Damage (with the Str bonus), attack rhythm, reach and width of the weapon in hand → the new one. */
function describeWeaponChanges(stats: CharacterStats, from: MeleeWeaponDef, to: MeleeWeaponDef): string[] {
    const damage = (weapon: MeleeWeaponDef) => Math.round(weapon.damage * stats.damageMultiplier('physical'));
    const every = (weapon: MeleeWeaponDef) => `${((weapon.cooldownMs * stats.cooldownMultiplier) / 1000).toFixed(2)}s`;
    const lines = [
        `Damage ${damage(from)} → ${damage(to)}`,
        `Attack every ${every(from)} → ${every(to)}`,
        `Reach ${from.range} → ${to.range}`,
    ];
    if (from.arcDegrees !== to.arcDegrees) lines.push(`Width ${from.arcDegrees}° → ${to.arcDegrees}°`);
    return lines;
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
