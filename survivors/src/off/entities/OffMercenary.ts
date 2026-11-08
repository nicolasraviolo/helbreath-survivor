// Helbreath Off (Fase Off-8B): el mercenario en el mundo. Se dibuja como tu personaje (OffCharacter, con su equipo según
// tu nivel), con su nombre en azul y una barra de vida encima. Anda casilla a casilla con su TileMover. Si cae, se queda
// tumbado con "Down N" encima hasta levantarse. Qué hace lo decide OffMercenaryAI; el daño, OffBattle.
// Fase Off-8C: la maga lleva maná (fórmula del original con sus stats) y su propio OffSpells (`spells`, lo pone
// OffBattle). Cualquiera de los dos puede estar en Berserk (`berserkLeftMs`): brillo rojo como el buff de Survivors.
// Fase Off-8D: dice frases encima del nombre (`say`, texto blanco OFF_MERCENARY_TALK.showMs); cuándo, OffMercenaryTalk.
// Al caer dice "Ugh..." y al levantarse "I'm back!" sin esperar turno.
import Phaser from 'phaser';
import { DEPTH_DAMAGE_NUMBERS, DEPTH_GROUND_SHADOWS } from '../../config/gameConfig';
import { EFFECTS, type EffectDef, type EffectKey } from '../../config/effects';
import { lookLoader, runSprites } from '../../systems/LookLoader';
import { smoothSprite } from '../../hb/XbrPipeline';
import { OFF_WORN_ALPHA } from '../config/offSpellLook';
import { OFF_MONSTER_LOOK } from '../config/offMonsterLook';
import { offMaxHp, offMaxMana, type OffStats } from '../data/offCharacter';
import { BUFFS, BUFF_OVERLAY_ALPHA } from '../../data/pickups';
import {
    OFF_MERCENARIES, OFF_MERCENARY, OFF_MERCENARY_COLORS, OFF_MERCENARY_LINES, OFF_MERCENARY_TALK, OFF_MERCENARY_LOOK, OFF_MERCENARY_TEXT, offMercenaryGear, offMercenaryStats, type OffMercenaryDef, type OffMercenaryId, type OffMercenaryLineId,
} from '../data/offMercenary';
import { offArmorDefense, offEquipmentLook, offWeapon, type OffEquipment } from '../data/offItems';
import type { OffWeaponDef } from '../data/offCombat';
import { OFF_PROTECT, OFF_SPELLS, type OffSpellId } from '../data/offSpells';
import type { OffSpells } from '../systems/OffSpells';
import { OFF_NOVICE } from '../data/offWorld';
import { offPlayerHitRatio } from '../systems/OffCombatRules';
import type { OffProtection } from '../systems/OffBattle';
import { TileMover, type TilePoint } from '../systems/TileMover';
import { OffCharacter } from './OffCharacter';
import type { OffMonster } from './OffMonster';

/** Its blow on the way: it lands on `monster` after `leftMs`. */
export interface OffMercenaryBlow {
    monster: OffMonster;
    lands: boolean;
    leftMs: number;
}

/** Health and time down carried through a portal (as the player's, OffCarriedVitals). */
export interface OffCarriedMercenary {
    hp: number;
    downLeftMs: number;
    protection?: OffProtection;
    /** Off-8C: its mana and Berserk's time left. */
    mana?: number;
    berserkLeftMs?: number;
}

/** Off-8C: who the spell the Mage is preparing goes to. */
export type OffMercenaryCastTarget = { on: 'owner' } | { on: 'self' } | { on: 'monster'; monster: OffMonster };

export class OffMercenary {
    public readonly def: OffMercenaryDef;
    public readonly mover: TileMover;
    public readonly character: OffCharacter;
    public hp = 1;
    public level = 1;
    public stats: OffStats;
    public equipment: Readonly<OffEquipment> = {};
    /** Unconscious for this long (0 = up). */
    public downLeftMs = 0;
    /** Defense Shield or Protection From Magic you cast on it. */
    public protection: OffProtection | undefined;
    /** Off-8C: Berserk on it for this long (0 = none). */
    public berserkLeftMs = 0;
    /** Off-8C, the Mage: its mana, its time towards the next bit of it, its spells and who the one it prepares is for. */
    public mana = 0;
    public manaRegenMs = 0;
    public spells: OffSpells | undefined;
    public castFor: OffMercenaryCastTarget | undefined;
    /** Off-8C: the loot it is walking to, and what it has picked up for you (for `check offmercloot`). */
    public lootTile: TilePoint | undefined;
    public picked = 0;
    /** Spells it cast, by id (for `check offmercmage`). */
    public readonly castCount: Partial<Record<OffSpellId, number>> = {};
    private glowing = false;
    /** Monster it fights. */
    public target: OffMonster | undefined;
    public cooldownMs = 0;
    public blow: OffMercenaryBlow | undefined;
    /** Time towards its next bit of health out of a fight. */
    public regenMs = 0;
    /** Following you or chasing a monster: the fewest tiles it has been from there, and for how long it has not got closer. */
    public chaseBest = Number.POSITIVE_INFINITY;
    public chaseStallMs = 0;
    /** A monster it could not reach: left alone until `ignoredLeftMs` runs out. */
    public ignored: OffMonster | undefined;
    public ignoredLeftMs = 0;
    /** Monsters it has killed (for `check offmerc`). */
    public kills = 0;
    /** Off-8D: blows it started from behind a monster (for `check offmercbehind`), and the paralysed monster it gave up flanking. */
    public behindBlows = 0;
    public flankGaveUp: OffMonster | undefined;
    /** Off-8D: its talk: a clock, when each line was last said, the time since the last one and how long the shown one stays. */
    public talkClockMs = 0;
    public talkSinceMs: number = OFF_MERCENARY_TALK.gapMs;
    private readonly saidAt: Partial<Record<OffMercenaryLineId, number>> = {};
    /** Times each line was said (for `check offmercsay`). */
    public readonly saidCount: Partial<Record<OffMercenaryLineId, number>> = {};
    private sayLeftMs = 0;
    private readonly sayText: Phaser.GameObjects.Text;
    private readonly nameText: Phaser.GameObjects.Text;
    private readonly downText: Phaser.GameObjects.Text;
    private readonly bar: Phaser.GameObjects.Graphics;
    private readonly ring: Phaser.GameObjects.Graphics;
    private readonly wornLook: Phaser.GameObjects.Sprite;
    private wornLookKey: EffectKey | undefined;
    private aimed = false;

    constructor(private readonly scene: Phaser.Scene, public readonly id: OffMercenaryId, isFree: (x: number, y: number) => boolean, x: number, y: number, level: number) {
        this.def = OFF_MERCENARIES[id];
        this.mover = new TileMover(isFree, x, y);
        this.stats = offMercenaryStats(id, level);
        this.character = new OffCharacter(scene, OFF_NOVICE, this.def.body);
        const look = OFF_MERCENARY_LOOK;
        this.nameText = scene.add.text(0, 0, this.def.name, { ...OFF_MONSTER_LOOK.nameStyle, color: look.nameColor }).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS - 1);
        this.downText = scene.add.text(0, 0, '', { ...OFF_MONSTER_LOOK.nameStyle, color: look.downColor }).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS - 1).setVisible(false);
        this.bar = scene.add.graphics().setDepth(DEPTH_DAMAGE_NUMBERS - 1);
        const talk = OFF_MERCENARY_TALK;
        this.sayText = scene.add.text(0, 0, '', { ...OFF_MONSTER_LOOK.nameStyle, color: talk.color, stroke: talk.stroke, strokeThickness: talk.strokeThickness })
            .setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS - 1).setVisible(false);
        this.ring = scene.add.graphics().setVisible(false);
        const ring = look.ring;
        this.ring.lineStyle(ring.lineWidth, ring.color, ring.alpha).strokeEllipse(0, 0, ring.radiusX * 2, ring.radiusY * 2);
        this.wornLook = smoothSprite(scene.add.sprite(0, 0, '__DEFAULT')).setVisible(false).setDepth(DEPTH_GROUND_SHADOWS + 1);
        this.setLevel(level);
        this.hp = this.maxHp;
        this.mana = this.maxMana;
        this.character.update(this.mover, false, 0);
    }

    public get maxHp(): number {
        return Math.floor(offMaxHp({ ...this.stats, level: this.level }) * this.def.hpFactor);
    }

    /** The original's mana for its stats (only the Mage uses it). */
    public get maxMana(): number {
        return offMaxMana({ ...this.stats, level: this.level });
    }

    public get isCaster(): boolean {
        return this.def.role === 'caster';
    }

    public get isBerserk(): boolean {
        return this.berserkLeftMs > 0;
    }

    public get weapon(): OffWeaponDef {
        return offWeapon(this.equipment);
    }

    public get hitRatio(): number {
        return offPlayerHitRatio(this.stats.dex);
    }

    /** 2 × DEX, its armour, its own bonus and a Defense Shield you cast on it. */
    public get defense(): number {
        const power = this.protection ? OFF_SPELLS[this.protection.spell].power ?? 0 : 0;
        return this.stats.dex * 2 + offArmorDefense(this.equipment) + this.def.defenseBonus + (OFF_PROTECT.defenseByPower[power] ?? 0);
    }

    public get isDown(): boolean {
        return this.downLeftMs > 0;
    }

    /** Feet on screen. */
    public get x(): number {
        return this.character.x;
    }

    public get y(): number {
        return this.character.y;
    }

    /** Your level changed: its stats and gear follow (its health keeps its share). */
    public setLevel(level: number): void {
        const share = this.maxHp > 0 ? this.hp / this.maxHp : 1;
        this.level = level;
        this.stats = offMercenaryStats(this.id, level);
        this.hp = Math.max(this.isDown ? 0 : 1, Math.round(this.maxHp * share));
        this.mana = Math.min(this.mana, this.maxMana);
        const gear = offMercenaryGear(this.id, level);
        if (gear === this.equipment) return;
        this.equipment = gear;
        const look = offEquipmentLook(gear);
        // Its pieces may not be downloaded yet (you wear others): dressed again once they are.
        this.character.wear(look, {}, OFF_MERCENARY_COLORS);
        void lookLoader.ensure(this.scene, runSprites(OFF_NOVICE, this.def.body, look)).then(() => {
            if (this.character.container.active) this.character.wear(look, {}, OFF_MERCENARY_COLORS);
        });
    }

    /** Carried from the place before (Off-5A's portals). */
    public carry(carried: OffCarriedMercenary): void {
        this.downLeftMs = Math.max(0, carried.downLeftMs);
        this.hp = this.isDown ? 0 : Math.min(this.maxHp, Math.max(1, carried.hp));
        this.protection = carried.protection ? { ...carried.protection } : undefined;
        if (carried.mana !== undefined) this.mana = Math.min(this.maxMana, Math.max(0, carried.mana));
        this.berserkLeftMs = this.isDown ? 0 : Math.max(0, carried.berserkLeftMs ?? 0);
        if (this.isDown) this.character.die(this.mover.facing);
    }

    public carried(): OffCarriedMercenary {
        return {
            hp: this.hp, downLeftMs: this.downLeftMs, mana: this.mana, berserkLeftMs: this.berserkLeftMs,
            ...(this.protection ? { protection: { ...this.protection } } : {}),
        };
    }

    /**
     * Off-8D: says that line over its head, unless it is not one of its own, it said it within OFF_MERCENARY_TALK.repeatMs,
     * or (without `now`) another one within gapMs. True when it said it.
     */
    public say(line: OffMercenaryLineId, now = false): boolean {
        const text = OFF_MERCENARY_LINES[this.id][line];
        if (text === undefined) return false;
        const talk = OFF_MERCENARY_TALK;
        const last = this.saidAt[line];
        if (!now && (this.talkSinceMs < talk.gapMs || (last !== undefined && this.talkClockMs - last < talk.repeatMs))) return false;
        this.saidAt[line] = this.talkClockMs;
        this.saidCount[line] = (this.saidCount[line] ?? 0) + 1;
        this.talkSinceMs = 0;
        this.sayLeftMs = talk.showMs;
        this.sayText.setText(text);
        return true;
    }

    /** The line shown now, if any (for checks). */
    public get saying(): string | undefined {
        return this.sayLeftMs > 0 ? this.sayText.text : undefined;
    }

    /** It (or, for the Mage, one of its spells) killed a monster. */
    public addKill(): void {
        this.kills++;
    }

    /** Falls unconscious for OFF_MERCENARY.downMs. */
    public fall(): void {
        this.hp = 0;
        this.downLeftMs = OFF_MERCENARY.downMs;
        this.target = undefined;
        this.blow = undefined;
        this.protection = undefined;
        this.berserkLeftMs = 0;
        this.castFor = undefined;
        this.spells?.cancel();
        this.mover.cancel();
        this.character.die(this.mover.facing);
        this.say('down', true);
    }

    /** Stands up with part of its health. */
    public standUp(): void {
        this.downLeftMs = 0;
        this.hp = Math.max(1, Math.round(this.maxHp * OFF_MERCENARY.standUpHpShare));
        this.character.revive();
        this.say('up', true);
    }

    /** The point is on its drawn body (a click on it). */
    public contains(px: number, py: number): boolean {
        return this.character.getVisualBounds().contains(px, py);
    }

    /** A support spell will go to it: the ring at its feet. */
    public setAimed(aimed: boolean): void {
        this.aimed = aimed;
    }

    /** Body, name, bar, "Down N", ring and shield aura where the mover is. */
    public sync(deltaMs: number, running: boolean): void {
        this.character.update(this.mover, running, deltaMs);
        const look = OFF_MERCENARY_LOOK;
        const top = this.y - look.headHeight;
        const bar = look.bar;
        const barY = top - bar.gapAboveHead - bar.height;
        this.bar.clear();
        if (!this.isDown) {
            this.bar.fillStyle(bar.backColor, bar.backAlpha).fillRect(this.x - bar.width / 2, barY, bar.width, bar.height);
            this.bar.fillStyle(bar.fillColor, 1).fillRect(this.x - bar.width / 2, barY, Math.round(bar.width * (this.hp / Math.max(1, this.maxHp))), bar.height);
        }
        this.nameText.setPosition(this.x, barY - look.nameGap);
        this.downText.setVisible(this.isDown);
        if (this.isDown) {
            this.downText.setText(OFF_MERCENARY_TEXT.downLabel(Math.ceil(this.downLeftMs / 1000)));
            this.downText.setPosition(this.x, barY - look.nameGap - this.nameText.height);
        }
        this.talkClockMs += deltaMs;
        this.talkSinceMs += deltaMs;
        this.sayLeftMs = Math.max(0, this.sayLeftMs - deltaMs);
        this.sayText.setVisible(this.sayLeftMs > 0);
        if (this.sayLeftMs > 0) {
            const above = this.isDown ? this.downText.height : 0;
            this.sayText.setPosition(this.x, barY - look.nameGap - this.nameText.height - above - OFF_MERCENARY_TALK.gap);
        }
        this.ring.setVisible(this.aimed && !this.isDown).setPosition(this.x, this.y).setDepth(DEPTH_GROUND_SHADOWS + 2);
        this.syncWornLook();
        // Off-8C: Berserk's red glow (only set when it changes: setGlow redraws every layer).
        if (this.isBerserk !== this.glowing) {
            this.glowing = this.isBerserk;
            this.character.setGlow(this.glowing ? BUFFS.berserk.overlayTint : undefined, BUFF_OVERLAY_ALPHA);
        }
    }

    private syncWornLook(): void {
        const key = this.protection ? OFF_SPELLS[this.protection.spell].wornEffect : undefined;
        if (key !== this.wornLookKey) {
            this.wornLookKey = key;
            if (key && this.scene.anims.exists(key)) this.wornLook.setVisible(true).setAlpha(OFF_WORN_ALPHA[key] ?? 1).play(key);
            else this.wornLook.setVisible(false).stop();
        }
        if (this.wornLook.visible && key) {
            const def: EffectDef = EFFECTS[key];
            this.wornLook.setPosition(this.x + (def.offsetX ?? 0), this.y + (def.offsetY ?? 0));
        }
    }

    /** Gone (dismissed, or the world closes). */
    public destroy(): void {
        this.character.container.destroy();
        this.character.destroyShadow();
        this.nameText.destroy();
        this.downText.destroy();
        this.sayText.destroy();
        this.bar.destroy();
        this.ring.destroy();
        this.wornLook.destroy();
    }
}
