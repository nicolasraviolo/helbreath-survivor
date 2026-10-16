// Lo que lleva puesto el personaje: el arma cuerpo a cuerpo en la mano (si la usa) y una pieza por hueco de armadura.
// Calcula la defensa total y qué capas hay que dibujar al cambiar una pieza.
import { ARMOR_PIECES, MAX_DEFENSE, type ArmorPieceId, type ArmorSlotId } from '../data/armor';
import type { CharacterDef } from '../data/characters';
import { getMeleeWeapon, type MeleeWeaponId } from '../data/weapons';
import type { GearLayer, GearSlot } from '../hb/playerAppearance';

export class Equipment {
    public weapon: MeleeWeaponId | undefined;
    public readonly armor: Partial<Record<ArmorSlotId, ArmorPieceId>> = {};

    constructor(private readonly def: CharacterDef) {
        this.weapon = def.startWeapon.kind === 'melee' ? def.startWeapon.id : undefined;
    }

    /** Share of incoming damage removed by all the armor worn (0..MAX_DEFENSE). */
    public get defense(): number {
        let total = 0;
        for (const id of Object.values(this.armor)) total += ARMOR_PIECES[id].defense;
        return Math.min(MAX_DEFENSE, total);
    }

    /** Defense if `piece` replaced what is worn in its slot (for the card preview). */
    public defenseWith(piece: ArmorPieceId): number {
        const slot = ARMOR_PIECES[piece].slot;
        const current = this.armor[slot];
        const without = this.defense - (current ? ARMOR_PIECES[current].defense : 0);
        return Math.min(MAX_DEFENSE, without + ARMOR_PIECES[piece].defense);
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
        this.armor[slot] = piece;
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
