// Helbreath Off (Fase Off-8B): el mercenario en el mundo. Se dibuja como tu personaje (OffCharacter, con su equipo según
// tu nivel), con su nombre en azul y una barra de vida encima. Anda casilla a casilla con su TileMover. Si cae, se queda
// tumbado con "Down N" encima hasta levantarse. Qué hace lo decide OffMercenaryAI; el daño, OffBattle.
// Fase Off-8C: la maga lleva maná (fórmula del original con sus stats) y su propio OffSpells (`spells`, lo pone
// OffBattle). Cualquiera de los dos puede estar en Berserk (`berserkLeftMs`): brillo rojo como el buff de Survivors.
// Fase Off-8D: dice frases encima del nombre (`say`, texto blanco OFF_MERCENARY_TALK.showMs); cuándo, OffMercenaryTalk.
// Al caer dice "Ugh..." y al levantarse "I'm back!" sin esperar turno.
// Fase Off-8E: lleva una poción propia (`potionLeftMs` = 0 la tiene) y puede estar huyendo
// (`fleeing`); qué hace con ellas, OffMercenaryAI.
// Fase Off-9A: la misma clase hace de **Raider** (`raider`: su ficha, su bando): nombre en rojo, barra roja, capa y botas
// del color de su ciudad. No cae inconsciente: a 0 de vida muere y se va (`gone`). Puede quedarse quieto por Hold Person
// o Paralyze (`hold`, como un monstruo). Qué hace lo decide OffRaiderAI.
import Phaser from 'phaser';
import { DEPTH_DAMAGE_NUMBERS, DEPTH_GROUND_SHADOWS } from '../../config/gameConfig';
import { EFFECTS, type EffectDef, type EffectKey } from '../../config/effects';
import { lookLoader, runSprites } from '../../systems/LookLoader';
import { smoothSprite } from '../../hb/XbrPipeline';
import { OFF_WORN_ALPHA } from '../config/offSpellLook';
import { OFF_MONSTER_LOOK } from '../config/offMonsterLook';
import { OFF_RUN_STEP_STAMINA, offMaxHp, offMaxMana, offMaxStamina, type OffStats } from '../data/offCharacter';
import { OFF_STEP_MS } from '../data/offWorld';
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
import type { OffFoe } from '../systems/OffFoe';
import { OFF_HOLD } from '../data/offSpells';
import { OffCritStrike } from '../systems/OffCritStrike';
import { maxCritCharges } from '../../data/critStrike';
import { OFF_RAIDER_LOOK, offRaiderColors } from '../data/offRaiders';
import type { OffFaction } from '../data/offPlaceIds';

/** Its blow on the way: it lands on `monster` (a monster or, Off-9A, a Raider) after `leftMs`. */
export interface OffMercenaryBlow {
    monster: OffFoe;
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
    /** Off-8E: time until its potion is back (0 = it has it). */
    potionLeftMs?: number;
}

/** Off-8C: who the spell the Mage is preparing goes to. */
export type OffMercenaryCastTarget = { on: 'owner' } | { on: 'self' } | { on: 'monster'; monster: OffFoe };

/** Off-9A: who a Raider goes for: you or your mercenary. */
export type OffRaidVictim = 'player' | 'merc';

/** Off-9A: what makes it a Raider: its own def (name, body, factors) and its city. */
export interface OffRaiderSetup {
    def: OffMercenaryDef;
    faction: OffFaction;
}

export class OffMercenary {
    /** Off-9A: a person (OffFoe tells it from a monster). */
    public readonly kind = 'person' as const;
    public readonly def: OffMercenaryDef;
    /** Off-9A: a Raider's city (undefined: your mercenary). */
    public readonly raiderOf: OffFaction | undefined;
    /** Off-9A, a Raider: who it goes for, its blow on its way to that one, its spell for that one, its time to look for a way again. */
    public victim: OffRaidVictim = 'player';
    public raidBlow: { victim: OffRaidVictim; lands: boolean; leftMs: number; crit: boolean } | undefined;
    /** Off-9A, a Mage Raider: holds it cast at you or your mercenary, and the ones that took (checks). */
    public holdTries = 0;
    public holdsLanded = 0;
    /** Time before it may cast another hold. */
    public holdWaitMs = 0;
    public raidCast: OffRaidVictim | 'self' | undefined;
    public repathMs = 0;
    /** Off-9A, a Mage Raider: getting away from you before casting again, and how many times it did (checks). */
    public retreating = false;
    public retreats = 0;
    public retreatWaitMs = 0;
    /**
     * Off-9A, a Raider: its stamina, as yours (STR×2 + Level×2; 1 per running tile, batches every 12 s): without it,
     * it walks (the owner, 8-nov-2026: one ran away forever).
     */
    public stamina = 0;
    public staminaWaitMs = 0;
    /** Times it ran out of stamina (or time) running away and turned to fight (checks); how long this run has lasted; time before it may run again. */
    public cornered = 0;
    public fleeTimeMs = 0;
    public noFleeMs = 0;
    /** Off-9A, a Raider: dead and gone (it never falls unconscious). */
    public gone = false;
    /** Off-9A: Hold Person / Paralyze on it (a Raider): stopped for `holdLeftMs`; `holdPower` 1 Hold Person, 2 Paralyze. */
    public holdLeftMs = 0;
    private holdPower = 0;
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
    /** The tint on now (Berserk's red, or a hold's blue, Off-9A), only reset when it changes. */
    private glowing: number | undefined;
    /** Off-9A, a Warrior Raider: its Critical Strike charges (your rules), and strikes it launched (checks). */
    public crit: OffCritStrike | undefined;
    public crits = 0;
    /** Monster (or, Off-9A, Raider) it fights. */
    public target: OffFoe | undefined;
    public cooldownMs = 0;
    public blow: OffMercenaryBlow | undefined;
    /** Time towards its next bit of health out of a fight. */
    public regenMs = 0;
    /** Off-8E: time towards its next batch of health (a player's, also fighting), and what those batches gave (checks). */
    public hpBatchMs = 0;
    public batchGained = 0;
    /** Off-8E: time until its potion is back (0 = it has it), and potions drunk (checks). */
    public potionLeftMs = 0;
    public potionsDrunk = 0;
    /**
     * Off-8E: running away: the time nobody has chased it, the time to its next choice of tile, and times it ran
     * (checks). After a run that ended with nobody chasing it, it runs again only once it is hurt under `calmHp`.
     */
    public fleeing = false;
    public fleeSafeMs = 0;
    public fleeReplanMs = 0;
    public flees = 0;
    public calmHp = Number.POSITIVE_INFINITY;
    /** Following you or chasing a monster: the fewest tiles it has been from there, and for how long it has not got closer. */
    public chaseBest = Number.POSITIVE_INFINITY;
    public chaseStallMs = 0;
    /** A monster it could not reach: left alone until `ignoredLeftMs` runs out. */
    public ignored: OffFoe | undefined;
    public ignoredLeftMs = 0;
    /** Monsters it has killed (for `check offmerc`). */
    public kills = 0;
    /** Off-8D: blows it started from behind a monster (for `check offmercbehind`), and the paralysed monster it gave up flanking. */
    public behindBlows = 0;
    public flankGaveUp: OffFoe | undefined;
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

    constructor(
        private readonly scene: Phaser.Scene, public readonly id: OffMercenaryId, isFree: (x: number, y: number) => boolean, x: number, y: number, level: number,
        raider?: OffRaiderSetup,
    ) {
        this.def = raider?.def ?? OFF_MERCENARIES[id];
        this.raiderOf = raider?.faction;
        this.mover = new TileMover(isFree, x, y);
        this.stats = offMercenaryStats(id, level);
        this.character = new OffCharacter(scene, OFF_NOVICE, this.def.body);
        const look = OFF_MERCENARY_LOOK;
        const nameColor = raider ? OFF_RAIDER_LOOK.nameColor : look.nameColor;
        this.nameText = scene.add.text(0, 0, this.def.name, { ...OFF_MONSTER_LOOK.nameStyle, color: nameColor }).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS - 1);
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
        this.stamina = this.maxStamina;
        // Off-9A: a Warrior Raider starts with its charges full.
        if (raider && id === 'warrior') this.crit = new OffCritStrike(maxCritCharges(level), () => undefined);
        // Off-9A: a Raider's running steps cost stamina, as yours (your mercenary runs freely).
        if (raider) {
            this.mover.onStep = (stepMs) => {
                if (stepMs === OFF_STEP_MS.run) this.stamina = Math.max(0, this.stamina - OFF_RUN_STEP_STAMINA);
            };
        }
        this.character.update(this.mover, false, 0);
    }

    public get maxHp(): number {
        return Math.floor(offMaxHp({ ...this.stats, level: this.level }) * this.def.hpFactor);
    }

    /** The original's mana for its stats (only the Mage uses it). */
    public get maxMana(): number {
        return offMaxMana({ ...this.stats, level: this.level });
    }

    /** Off-9A: the original's stamina for its stats (only Raiders spend it). */
    public get maxStamina(): number {
        return offMaxStamina({ ...this.stats, level: this.level });
    }

    /** Off-9A: stamina left for a running step. */
    public get canRun(): boolean {
        return this.stamina >= OFF_RUN_STEP_STAMINA;
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

    /** Off-8E: its own potion is ready. */
    public get hasPotion(): boolean {
        return this.potionLeftMs <= 0;
    }

    public get isDown(): boolean {
        return this.downLeftMs > 0;
    }

    /** Off-9A: a Raider (not your mercenary). */
    public get isRaider(): boolean {
        return this.raiderOf !== undefined;
    }

    /** Up and there: not unconscious (your mercenary) and not dead and gone (a Raider). */
    public get isAlive(): boolean {
        return !this.isDown && !this.gone;
    }

    /** Off-9A: stopped by Hold Person or Paralyze. */
    public get isHeld(): boolean {
        return this.holdLeftMs > 0;
    }

    /** Off-9A: held by Paralyze (a blow doesn't break it). */
    public get isParalyzed(): boolean {
        return this.holdLeftMs > 0 && this.holdPower > OFF_HOLD.breaksOnBlow;
    }

    /** Off-9A: Hold Person / Paralyze on it (false: already held, no effect, as the server). */
    public hold(ms: number, power: number): boolean {
        if (!this.isAlive || this.isHeld) return false;
        this.holdLeftMs = ms;
        this.holdPower = power;
        this.blow = undefined;
        this.raidBlow = undefined;
        this.raidCast = undefined;
        this.spells?.cancel();
        this.mover.cancel();
        return true;
    }

    /** Off-9A: a blow ends Hold Person; spell damage ends no hold on a person (OFF_HOLD.personMs). */
    public hitBreaksHold(magic: boolean): void {
        if (this.isHeld && !magic && this.holdPower <= OFF_HOLD.breaksOnBlow) this.holdLeftMs = 0;
    }

    /** Off-9A: a Raider dies for good: falls and stays down until the battle takes it away. */
    public die(): void {
        this.hp = 0;
        this.gone = true;
        this.target = undefined;
        this.blow = undefined;
        this.raidBlow = undefined;
        this.raidCast = undefined;
        this.holdLeftMs = 0;
        this.protection = undefined;
        this.berserkLeftMs = 0;
        this.castFor = undefined;
        this.stopFleeing();
        this.spells?.cancel();
        this.mover.cancel();
        this.character.die(this.mover.facing);
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
        // Off-9A: a Raider's cape and boots are its city's colour.
        const colors = this.raiderOf ? offRaiderColors(this.raiderOf) : OFF_MERCENARY_COLORS;
        // Its pieces may not be downloaded yet (you wear others): dressed again once they are.
        this.character.wear(look, {}, colors);
        void lookLoader.ensure(this.scene, runSprites(OFF_NOVICE, this.def.body, look)).then(() => {
            if (this.character.container.active) this.character.wear(look, {}, colors);
        });
    }

    /** Carried from the place before (Off-5A's portals). */
    public carry(carried: OffCarriedMercenary): void {
        this.downLeftMs = Math.max(0, carried.downLeftMs);
        this.hp = this.isDown ? 0 : Math.min(this.maxHp, Math.max(1, carried.hp));
        this.protection = carried.protection ? { ...carried.protection } : undefined;
        if (carried.mana !== undefined) this.mana = Math.min(this.maxMana, Math.max(0, carried.mana));
        this.berserkLeftMs = this.isDown ? 0 : Math.max(0, carried.berserkLeftMs ?? 0);
        this.potionLeftMs = Math.max(0, carried.potionLeftMs ?? 0);
        if (this.isDown) this.character.die(this.mover.facing);
    }

    public carried(): OffCarriedMercenary {
        return {
            hp: this.hp, downLeftMs: this.downLeftMs, mana: this.mana, berserkLeftMs: this.berserkLeftMs, potionLeftMs: this.potionLeftMs,
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
        this.stopFleeing();
        this.spells?.cancel();
        this.mover.cancel();
        this.character.die(this.mover.facing);
        this.say('down', true);
    }

    /** Off-8E: it stops running away (`calm`: nobody chased it for a while, so it runs again only once hurt more). */
    public stopFleeing(calm = false): void {
        this.fleeing = false;
        this.fleeSafeMs = 0;
        this.fleeReplanMs = 0;
        this.calmHp = calm ? this.hp : Number.POSITIVE_INFINITY;
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
        // Off-9A: a Raider shows only its red name, no health bar (the owner, 9-nov-2026).
        if (this.isAlive && !this.isRaider) {
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
        // Off-9A: Hold Person / Paralyze run out on a Raider.
        this.holdLeftMs = Math.max(0, this.holdLeftMs - deltaMs);
        this.ring.setVisible(this.aimed && this.isAlive).setPosition(this.x, this.y).setDepth(DEPTH_GROUND_SHADOWS + 2);
        this.syncWornLook();
        // Off-8C: Berserk's red glow; Off-9A: a hold's blue over it (only set when it changes: setGlow redraws every layer).
        const glow = this.isHeld ? OFF_HOLD.personTint : this.isBerserk ? BUFFS.berserk.overlayTint : undefined;
        if (glow !== this.glowing) {
            this.glowing = glow;
            this.character.setGlow(glow, BUFF_OVERLAY_ALPHA);
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
