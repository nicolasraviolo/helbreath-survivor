// Helbreath Off (Fase Off-9A): las magias de un Raider Mago. Usa el mismo OffSpells que tú y que Kaila, con este "host"
// que mira los datos del Raider: su nivel, sus stats, su maná y las magias que sabe con su INT. Las que se lanza a sí
// mismo (Heal, Defense Shield) caen en él; las de daño van a una persona con OffSpells.releaseAt y su daño lo pone la
// batalla (OffRaiderWorld.raiderSpellLands), así que aquí no golpean a nadie. Sus avisos no van a tu lista.
import type { SpellElement } from '../../data/elements';
import type { OffStats } from '../data/offCharacter';
import type { OffSpellDef, OffSpellId } from '../data/offSpells';
import type { OffMercenary } from '../entities/OffMercenary';
import type { OffFoe } from './OffFoe';
import { raiderKnows } from './OffRaiderAI';
import type { OffSpellHost } from './OffSpells';

/** What a Raider's spells need from the battle. */
export interface OffRaiderCastWorld {
    healRaider(raider: OffMercenary, amount: number): void;
    protectRaider(raider: OffMercenary, spell: OffSpellId): boolean;
    /** "Failed!" over it, and its flinch (as the Mage's). */
    mercCastFailed(merc: OffMercenary): void;
}

const NO_STATS: Readonly<OffStats> = { str: 0, vit: 0, dex: 0, int: 0, mag: 0 };

export class OffRaiderSpells implements OffSpellHost {
    /** The Raider casting now (the battle moves this host to each new Mage Raider of its slot). */
    public raider: OffMercenary | undefined;

    constructor(private readonly world: OffRaiderCastWorld) {}

    public get dead(): boolean {
        return !this.raider?.isAlive;
    }

    public get level(): number {
        return this.raider?.level ?? 1;
    }

    public get stats(): Readonly<OffStats> {
        return this.raider?.stats ?? NO_STATS;
    }

    public get mana(): number {
        return this.raider?.mana ?? 0;
    }

    public knows(id: OffSpellId): boolean {
        return this.raider ? raiderKnows(this.raider, id) : false;
    }

    /** A Mage carries no weapon or shield. */
    public handsRefusal(): string | undefined {
        return undefined;
    }

    /** Off-11A: Raiders carry no wand (as the mercenaries): full cost, plain damage. */
    public manaCost(def: OffSpellDef): number {
        return def.mana;
    }

    public wandDamage(damage: number): number {
        return damage;
    }

    public spendMana(amount: number): void {
        if (this.raider) this.raider.mana = Math.max(0, this.raider.mana - amount);
    }

    /** Its damage spells never go through `release` (releaseAt): nobody in their area here. */
    public monstersAround(): OffFoe[] {
        return [];
    }

    public spellHit(_monster: OffFoe, _damage: number, _element: SpellElement | undefined): void {
        // Nothing: see monstersAround.
    }

    public spellResisted(): void {
        // Nothing: see monstersAround.
    }

    public healPlayer(amount: number): void {
        if (this.raider) this.world.healRaider(this.raider, amount);
    }

    public protect(spell: OffSpellId): boolean {
        return this.raider ? this.world.protectRaider(this.raider, spell) : false;
    }

    /** It never casts Berserk (it doesn't hit). */
    public enrage(): boolean {
        return false;
    }

    public spellHeld(): void {
        // Nothing: it casts no holds.
    }

    public castFailed(): void {
        if (this.raider) this.world.mercCastFailed(this.raider);
    }

    public eventLine(): void {
        // Nothing: the player's list is only for what happens to the player.
    }
}
