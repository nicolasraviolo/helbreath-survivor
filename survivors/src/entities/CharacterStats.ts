// Nivel, experiencia y stats del personaje, y todo lo que se calcula a partir de ellos
// (vida y maná máximos, multiplicadores de daño y velocidad, crítico). Los números viven en data/stats.ts.
import type { CharacterDef } from '../data/characters';
import { xpToNextLevel } from '../data/leveling';
import {
    ATTACK_SPEED_PER_DEX,
    CRIT_BASE_CHANCE,
    CRIT_CHANCE_PER_CHR,
    CRIT_MAX_CHANCE,
    HP_PER_LEVEL,
    HP_PER_VIT,
    MAGIC_DAMAGE_PER_MAG,
    MANA_PER_INT,
    MANA_PER_LEVEL,
    MANA_PER_MAG,
    MOVE_SPEED_PER_DEX,
    PHYSICAL_DAMAGE_PER_STR,
    STAT_BASELINE,
    STAT_IDS,
    type StatId,
    type Stats,
} from '../data/stats';

export type DamageType = 'physical' | 'magic';

export class CharacterStats {
    public level = 1;
    /** XP gathered towards the next level. */
    public xp = 0;
    /** Level ups waiting for the player to pick a card. */
    public pendingLevelUps = 0;
    public readonly stats: Stats;
    /** Extra magic damage from the clothes worn (0.1 = +10%), set by the game when they change. */
    public gearMagicBonus = 0;

    constructor(public readonly def: CharacterDef) {
        this.stats = { ...def.startStats };
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
        const raw = this.def.baseHp + HP_PER_VIT * this.stats.vit + HP_PER_LEVEL * (this.level - 1);
        return Math.round(raw * this.def.hpMultiplier);
    }

    public get maxMana(): number {
        const s = this.stats;
        return Math.floor(MANA_PER_MAG * s.mag + MANA_PER_LEVEL * this.level + MANA_PER_INT * s.int);
    }

    public damageMultiplier(type: DamageType): number {
        if (type === 'physical') {
            return this.def.physicalDamageMultiplier * (1 + PHYSICAL_DAMAGE_PER_STR * (this.stats.str - STAT_BASELINE));
        }
        return this.def.magicDamageMultiplier * (1 + MAGIC_DAMAGE_PER_MAG * (this.stats.mag - STAT_BASELINE)) * (1 + this.gearMagicBonus);
    }

    public get moveSpeedMultiplier(): number {
        return 1 + MOVE_SPEED_PER_DEX * (this.stats.dex - STAT_BASELINE);
    }

    /** Multiplies weapon cooldowns: class bonus and Dex (higher Dex → shorter). */
    public get cooldownMultiplier(): number {
        return this.def.cooldownMultiplier / (1 + ATTACK_SPEED_PER_DEX * (this.stats.dex - STAT_BASELINE));
    }

    public get critChance(): number {
        const chance = CRIT_BASE_CHANCE + CRIT_CHANCE_PER_CHR * (this.stats.chr - STAT_BASELINE);
        return Math.min(CRIT_MAX_CHANCE, Math.max(0, chance));
    }

    /** A copy of the stats with `points` more in `stat`, to preview a card. */
    public previewWith(stat: StatId, points: number): CharacterStats {
        const copy = new CharacterStats(this.def);
        copy.level = this.level;
        copy.gearMagicBonus = this.gearMagicBonus;
        for (const id of STAT_IDS) copy.stats[id] = this.stats[id];
        copy.stats[stat] += points;
        return copy;
    }
}
