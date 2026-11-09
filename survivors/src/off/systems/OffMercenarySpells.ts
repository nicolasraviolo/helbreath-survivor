// Helbreath Off (Fase Off-8C): las magias de la maga mercenaria. Usa el mismo OffSpells que tú (preparar, el nombre
// encima, el vuelo, el daño y si falla), con este "host" que en vez de tus datos mira los de la maga: su nivel, sus
// stats, su maná y las magias que sabe con su INT (OFF_MERCENARY_SPELLS). Lo que mata da la mitad de experiencia, como
// los golpes de Gorn. Sus avisos no van a tu lista de abajo a la izquierda (salvo los de los escudos y Berserk que te
// pone a ti, que los dice la batalla).
import type { SpellElement } from '../../data/elements';
import { offMercenarySpells } from '../data/offMercenary';
import type { OffStats } from '../data/offCharacter';
import type { OffSpellDef, OffSpellId } from '../data/offSpells';
import type { OffMercenary } from '../entities/OffMercenary';
import type { OffMonster } from '../entities/OffMonster';
import type { OffSpellHost } from './OffSpells';

/** What the Mage's spells need from the battle. */
export interface OffMercenaryCastWorld {
    /** The mercenary hired now (the Mage, while this host is in use). */
    readonly merc: OffMercenary | undefined;
    monstersAround(tileX: number, tileY: number, range: number): OffMonster[];
    /** Her spell's damage lands (as yours, but the kill is hers). */
    mercSpellHit(monster: OffMonster, damage: number, element: SpellElement | undefined, freezeMs?: number): void;
    spellResisted(monster: OffMonster): void;
    spellHeld(monster: OffMonster): void;
    healMerc(merc: OffMercenary, amount: number): void;
    protectMerc(merc: OffMercenary, spell: OffSpellId): boolean;
    enrageMerc(merc: OffMercenary, durationMs: number): boolean;
    /** "Failed!" over her, and her flinch. */
    mercCastFailed(merc: OffMercenary): void;
}

const NO_STATS: Readonly<OffStats> = { str: 0, vit: 0, dex: 0, int: 0, mag: 0 };

export class OffMercenarySpells implements OffSpellHost {
    constructor(private readonly world: OffMercenaryCastWorld) {}

    public get dead(): boolean {
        const merc = this.world.merc;
        return !merc || merc.isDown;
    }

    public get level(): number {
        return this.world.merc?.level ?? 1;
    }

    public get stats(): Readonly<OffStats> {
        return this.world.merc?.stats ?? NO_STATS;
    }

    public get mana(): number {
        return this.world.merc?.mana ?? 0;
    }

    public knows(id: OffSpellId): boolean {
        return offMercenarySpells(this.stats.int).includes(id);
    }

    /** She never holds a weapon or a shield. */
    public handsRefusal(): string | undefined {
        return undefined;
    }

    /** She holds no wand: the spell's own mana and damage. */
    public manaCost(def: OffSpellDef): number {
        return def.mana;
    }

    public wandDamage(damage: number): number {
        return damage;
    }

    public spendMana(amount: number): void {
        const merc = this.world.merc;
        if (merc) merc.mana = Math.max(0, merc.mana - amount);
    }

    public monstersAround(tileX: number, tileY: number, range: number): OffMonster[] {
        return this.world.monstersAround(tileX, tileY, range);
    }

    public spellHit(monster: OffMonster, damage: number, element: SpellElement | undefined, freezeMs?: number): void {
        this.world.mercSpellHit(monster, damage, element, freezeMs);
    }

    public spellResisted(monster: OffMonster): void {
        this.world.spellResisted(monster);
    }

    /** Heal on herself (on you it goes through the ally). */
    public healPlayer(amount: number): void {
        const merc = this.world.merc;
        if (merc) this.world.healMerc(merc, amount);
    }

    public protect(spell: OffSpellId): boolean {
        const merc = this.world.merc;
        return merc ? this.world.protectMerc(merc, spell) : false;
    }

    public enrage(durationMs: number): boolean {
        const merc = this.world.merc;
        return merc ? this.world.enrageMerc(merc, durationMs) : false;
    }

    public spellHeld(monster: OffMonster): void {
        this.world.spellHeld(monster);
    }

    public castFailed(): void {
        const merc = this.world.merc;
        if (merc) this.world.mercCastFailed(merc);
    }

    /** Her lines ("Not enough mana", "no effect") stay quiet. */
    public eventLine(): void {
        // Nothing: the player's list is only for what happens to the player.
    }
}
