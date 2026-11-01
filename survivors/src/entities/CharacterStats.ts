// Power (el nivel de la partida), experiencia y stats del personaje, y todo lo que se calcula a partir de ellos
// (vida y maná máximos, multiplicadores de daño y velocidad, crítico). Los números viven en data/stats.ts.
// Desde la Fase 20A la partida empieza con las stats permanentes del personaje (clase + puntos de Level); `level`
// es el Power de la partida, no el Level permanente (systems/CharacterStore.ts).
import { HP_PER_CHARACTER_LEVEL } from '../data/characterLevel';
import { emptyPassiveRecord, type PassiveId } from '../data/passives';
import type { CharacterDef } from '../data/characters';
import { xpToNextLevel } from '../data/leveling';
import {
    ATTACK_SPEED_PER_DEX,
    CRIT_BASE_CHANCE,
    CRIT_CHANCE_PER_CHR,
    CRIT_DAMAGE_MULTIPLIER,
    CRIT_MAX_CHANCE,
    DAMAGE_PER_POWER,
    HP_PER_LEVEL,
    HP_PER_VIT,
    HP_REGEN_PER_VIT,
    MAGIC_DAMAGE_PER_MAG,
    MANA_PER_INT,
    MANA_REGEN_BASE,
    MANA_REGEN_PER_MAG,
    MANA_PER_LEVEL,
    MANA_PER_MAG,
    MOVE_SPEED_PER_DEX,
    PHYSICAL_DAMAGE_PER_STR,
    STAT_BASELINE,
    type StatId,
    type Stats,
} from '../data/stats';

export type DamageType = 'physical' | 'magic';

export class CharacterStats {
    /** Power: the run's level (the character's permanent Level lives in CharacterStore). */
    public level = 1;
    /** XP gathered towards the next level. */
    public xp = 0;
    /** Level ups waiting for the player to pick a card. */
    public pendingLevelUps = 0;
    public readonly stats: Stats;
    /** Extra magic damage from the clothes worn (0.1 = +10%), set by the game when they change. */
    public gearMagicBonus = 0;
    /**
     * Bonus of each passive card of this run (0.2 = +20%; data/passives.ts), set by the game when a card is taken:
     * Xelima (all damage, Fase 20C) and the cards that replaced the stat Blessings (1-nov-2026).
     */
    public readonly cardBonus: Record<PassiveId, number> = emptyPassiveRecord();
    /** Extra damage of every kind from the weapon's attribute: Sharp, Ancient (Fase 21B; the Mage's wand, her spells). */
    public attributeBonus = 0;
    /** Hitting Probability of the weapon or wand (0.21 = hit ratio ×1.21; revisión del original C, data/accuracy.ts). */
    public hitBonus = 0;
    /** Multiplies every kind of damage while a buff like Berserk lasts (1 = no buff). */
    public buffDamageMultiplier = 1;

    /**
     * `startStats`: the character's permanent stats (class + Level points); the class's alone if not given.
     * `characterLevel`: its permanent Level, which adds health (HP_PER_CHARACTER_LEVEL).
     */
    constructor(public readonly def: CharacterDef, startStats: Readonly<Stats> = def.startStats, public readonly characterLevel = 1) {
        this.stats = { ...startStats };
    }

    /** All the XP gathered in this run (it goes to the character's Level when the run ends, Fase 20A). */
    public get runXp(): number {
        let total = this.xp;
        for (let level = 1; level < this.level; level++) total += xpToNextLevel(level);
        return total;
    }

    public get xpToNext(): number {
        return xpToNextLevel(this.level);
    }

    /** 0..1 progress towards the next level. */
    public get xpRatio(): number {
        return this.xp / this.xpToNext;
    }

    /** Adds XP; every level reached applies the automatic stat points and queues a card choice. */
    public addXp(amount: number): void {
        this.xp += amount;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.pendingLevelUps++;
            for (const [stat, points] of Object.entries(this.def.statsPerLevel) as [StatId, number][]) {
                this.stats[stat] += points;
            }
        }
    }

    public addStat(stat: StatId, points: number): void {
        this.stats[stat] += points;
    }

    public get maxHp(): number {
        const raw = this.def.baseHp + HP_PER_VIT * this.stats.vit + HP_PER_LEVEL * (this.level - 1)
            + HP_PER_CHARACTER_LEVEL * (this.characterLevel - 1);
        return Math.round(raw * this.def.hpMultiplier * (1 + this.cardBonus.giantsDraught));
    }

    /** Health healed by itself each second: more Vit, faster. */
    public get hpRegenPerSecond(): number {
        return HP_REGEN_PER_VIT * this.stats.vit * (1 + this.cardBonus.ginsengRoot);
    }

    public get maxMana(): number {
        const s = this.stats;
        return Math.floor((MANA_PER_MAG * s.mag + MANA_PER_LEVEL * this.level + MANA_PER_INT * s.int) * (1 + this.cardBonus.archmageSapphire));
    }

    /** Mana recovered by itself each second, before the armor's MP Recovery (Fase 26A): more Mag, faster. */
    public get manaRegenPerSecond(): number {
        return (MANA_REGEN_BASE + MANA_REGEN_PER_MAG * this.stats.mag) * (1 + this.cardBonus.wizardElixir);
    }

    public damageMultiplier(type: DamageType): number {
        const shared = (1 + this.cardBonus.xelima) * (1 + this.attributeBonus) * this.buffDamageMultiplier * (1 + DAMAGE_PER_POWER * (this.level - 1));
        if (type === 'physical') {
            return this.def.physicalDamageMultiplier * (1 + PHYSICAL_DAMAGE_PER_STR * (this.stats.str - STAT_BASELINE))
                * (1 + this.cardBonus.ogreHeart) * shared;
        }
        return this.def.magicDamageMultiplier * (1 + MAGIC_DAMAGE_PER_MAG * (this.stats.mag - STAT_BASELINE)) * (1 + this.gearMagicBonus)
            * (1 + this.cardBonus.arcaneDiamond) * shared;
    }

    public get moveSpeedMultiplier(): number {
        return (1 + MOVE_SPEED_PER_DEX * (this.stats.dex - STAT_BASELINE)) * (1 + this.cardBonus.werewolfStride);
    }

    /** Multiplies the cooldowns of blows: class bonus, Dex and Hellhound's Frenzy (higher → shorter). */
    public get cooldownMultiplier(): number {
        return this.dexCooldown / (1 + this.cardBonus.hellhoundFrenzy);
    }

    /** Multiplies the cooldowns of spells: class bonus, Dex and Orb of Quickening (higher → shorter). */
    public get castMultiplier(): number {
        return this.dexCooldown / (1 + this.cardBonus.orbOfQuickening);
    }

    private get dexCooldown(): number {
        return this.def.cooldownMultiplier / (1 + ATTACK_SPEED_PER_DEX * (this.stats.dex - STAT_BASELINE));
    }

    /** Hit ratio bonus of blows or spells: the weapon's Hitting Probability and Cyclops Eye / Eye of the Demon, multiplied. */
    public hitBonusFor(type: DamageType): number {
        const card = type === 'physical' ? this.cardBonus.cyclopsEye : this.cardBonus.demonEye;
        return (1 + this.hitBonus) * (1 + card) - 1;
    }

    /** Damage of a critical hit, × the hit (2 = double; Ruby of Wrath adds to it). */
    public get critDamageMultiplier(): number {
        return CRIT_DAMAGE_MULTIPLIER + this.cardBonus.rubyOfWrath;
    }

    /** Multiplies the Rare and Epic chances of the cards (Golden Carp), on top of the Chr bonus. */
    public get cardLuckMultiplier(): number {
        return 1 + this.cardBonus.goldenCarp;
    }

    public get critChance(): number {
        const chance = CRIT_BASE_CHANCE + CRIT_CHANCE_PER_CHR * (this.stats.chr - STAT_BASELINE) + this.cardBonus.scorpionSting;
        return Math.min(CRIT_MAX_CHANCE, Math.max(0, chance));
    }

    /** A copy with the bonus of card `id` set to `bonus` (data/passives.ts → passiveBonus), to preview a card. */
    public previewWithCard(id: PassiveId, bonus: number): CharacterStats {
        const copy = new CharacterStats(this.def, this.stats, this.characterLevel);
        copy.level = this.level;
        copy.gearMagicBonus = this.gearMagicBonus;
        Object.assign(copy.cardBonus, this.cardBonus);
        copy.cardBonus[id] = bonus;
        copy.attributeBonus = this.attributeBonus;
        copy.hitBonus = this.hitBonus;
        copy.buffDamageMultiplier = this.buffDamageMultiplier;
        return copy;
    }
}
