// Lo que lleva puesto el personaje: el arma cuerpo a cuerpo o el hechizo "en la mano" y una pieza por hueco de armadura.
// Calcula la defensa total, el bonus de daño mágico de la ropa y qué capas hay que dibujar al cambiar una pieza.
import { ARMOR_BY_SET, ARMOR_PIECES, ARMOR_SLOT_IDS, getArmorPiece, MAX_DEFENSE, type ArmorPieceId, type ArmorSlotId } from '../data/armor';
import type { CharacterDef } from '../data/characters';
import { getPassive, type PassiveId } from '../data/passives';
import type { SpellId } from '../data/spells';
import { getMeleeWeapon, type MeleeWeaponId } from '../data/weapons';
import type { GearLayer, GearSlot } from '../hb/playerAppearance';

/** Armor values that add up over the pieces worn. */
export type ArmorTotal = 'defense' | 'defenseRatio' | 'magicResistance' | 'magicDamageBonus';

function pieceValue(piece: ArmorPieceId, key: ArmorTotal): number {
    return getArmorPiece(piece)[key] ?? 0;
}

export class Equipment {
    public weapon: MeleeWeaponId | undefined;
    public spell: SpellId | undefined;
    /** One piece per armor slot; changed only through wear(), which keeps `totals` up to date. */
    private readonly worn: Partial<Record<ArmorSlotId, ArmorPieceId>> = {};
    /** Rank of each passive (0 = not taken). */
    public readonly passives: Record<PassiveId, number> = { boots: 0, magnetAmulet: 0 };
    /** Sum of each armor value over the pieces worn; recomputed only in wear() (read every frame). */
    private readonly totals: Record<ArmorTotal, number> = { defense: 0, defenseRatio: 0, magicResistance: 0, magicDamageBonus: 0 };

    public get armor(): Readonly<Partial<Record<ArmorSlotId, ArmorPieceId>>> {
        return this.worn;
    }

    constructor(private readonly def: CharacterDef) {
        const start = def.startWeapon;
        this.weapon = start.kind === 'melee' ? start.id : undefined;
        this.spell = start.kind === 'spell' ? start.id : undefined;
    }

    /** Total bonus of a passive at its current rank (or at `rank`), e.g. 0.16 = +16%. */
    public passiveBonus(id: PassiveId, rank = this.passives[id]): number {
        return getPassive(id).perRank * rank;
    }

    /** A piece in every armor slot the class can wear (achievement "Fully Armored"). */
    public get fullArmor(): boolean {
        const slots = ARMOR_BY_SET[this.def.armorSet];
        return ARMOR_SLOT_IDS.every((slot) => slots[slot] === undefined || this.armor[slot] !== undefined);
    }

    /** Share of incoming damage removed by all the armor worn (0..MAX_DEFENSE). */
    public get defense(): number {
        return Math.min(MAX_DEFENSE, this.totals.defense);
    }

    /** Original defense ratio of all the armor worn: makes blows miss (data/defense.ts). */
    public get defenseRatio(): number {
        return this.totals.defenseRatio;
    }

    /** Magic resistance of all the armor worn: makes spells fail (data/defense.ts). */
    public get magicResistance(): number {
        return this.totals.magicResistance;
    }

    /** Extra magic damage from the clothes worn (0.1 = +10%). */
    public get magicDamageBonus(): number {
        return this.totals.magicDamageBonus;
    }

    /**
     * What a total would be if `piece` replaced what is worn in its slot (for the card preview). Defense is not
     * capped here: use defenseWith.
     */
    public totalWith(piece: ArmorPieceId, key: ArmorTotal): number {
        const current = this.armor[ARMOR_PIECES[piece].slot];
        return this.totals[key] - (current ? pieceValue(current, key) : 0) + pieceValue(piece, key);
    }

    /** Defense if `piece` replaced what is worn in its slot (for the card preview). */
    public defenseWith(piece: ArmorPieceId): number {
        return Math.min(MAX_DEFENSE, this.totalWith(piece, 'defense'));
    }

    /** Layer drawn for the weapon in hand (undefined if the weapon has no sprite). */
    public weaponLayer(): GearLayer | undefined {
        const sprite = this.weapon ? getMeleeWeapon(this.weapon).sprite : undefined;
        return sprite ? { sprite: sprite.key, startSheet: sprite.startSheet } : undefined;
    }

    /**
     * Wears a piece and returns the layers to redraw: the new piece's layers, plus the slots the old piece
     * covered going back to the starting look (e.g. Plate Mail sleeves → shirt again).
     */
    public wear(piece: ArmorPieceId): Array<[GearSlot, GearLayer | undefined]> {
        const slot = ARMOR_PIECES[piece].slot;
        const old = this.armor[slot];
        this.worn[slot] = piece;
        for (const key of Object.keys(this.totals) as ArmorTotal[]) {
            let total = 0;
            for (const id of Object.values(this.worn)) total += pieceValue(id, key);
            this.totals[key] = total;
        }
        const changes = new Map<GearSlot, GearLayer | undefined>();
        if (old) {
            for (const gearSlot of Object.keys(ARMOR_PIECES[old].look) as GearSlot[]) {
                changes.set(gearSlot, this.def.appearance[gearSlot]);
            }
        }
        for (const [gearSlot, layer] of Object.entries(ARMOR_PIECES[piece].look) as [GearSlot, GearLayer][]) {
            changes.set(gearSlot, layer);
        }
        return [...changes];
    }
}
