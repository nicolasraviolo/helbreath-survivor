// Arma las cartas de subida de nivel (ver la skill anadir-mejora y docs/DESIGN.md → "Cartas al subir de nivel").
// - Stat: +3 a un stat. Siempre disponible.
// - Eslabón: el arma (Guerrero) o el hechizo (Maga) más fuerte de TU familia que el Str / Int permite.
// - Cambio de familia: lo mejor de otra familia activa que el stat permite; sustituye a lo que llevas en la mano.
// - Armadura / ropa: la mejor pieza de tu clase que el stat permite en cada hueco, si es mejor que la que llevas.
// - Pasiva (Boots, Magnet Amulet): sube un rango, hasta el máximo. Para las dos clases.
// Como mucho MAX_ITEM_CARDS cartas de objeto; el resto son de stat, sin repetir.
import Phaser from 'phaser';
import { ARMOR_BY_SET, ARMOR_SLOT_IDS, getArmorPiece, type ArmorPieceId } from '../data/armor';
import { getPassive, PASSIVE_IDS, type PassiveId } from '../data/passives';
import { getSpell, SPELL_FAMILIES, type SpellFamilyDef, type SpellId } from '../data/spells';
import { LEVEL_UP_CHOICES, MAX_ITEM_CARDS, STAT_CARD_POINTS, STAT_IDS, type StatId } from '../data/stats';
import { getMeleeWeapon, MELEE_FAMILIES, type MeleeFamilyDef, type MeleeWeaponId } from '../data/weapons';
import type { CharacterStats } from '../entities/CharacterStats';
import type { Equipment } from '../entities/Equipment';

export type LevelUpChoice =
    | { kind: 'stat'; stat: StatId; points: number }
    /** Next weapon of the family in hand. */
    | { kind: 'weaponLink'; weapon: MeleeWeaponId; from: MeleeWeaponId }
    /** Weapon of another family, replacing the one in hand. */
    | { kind: 'weaponSwitch'; weapon: MeleeWeaponId; from: MeleeWeaponId }
    /** Next spell of the family in hand. */
    | { kind: 'spellLink'; spell: SpellId; from: SpellId }
    /** Spell of another family, replacing the one in hand. */
    | { kind: 'spellSwitch'; spell: SpellId; from: SpellId }
    | { kind: 'armor'; piece: ArmorPieceId; from: ArmorPieceId | undefined }
    /** One more rank of a passive. */
    | { kind: 'passive'; passive: PassiveId; rank: number };

export function buildLevelUpChoices(stats: CharacterStats, equipment: Equipment): LevelUpChoice[] {
    const items = Phaser.Utils.Array.Shuffle(itemChoices(stats, equipment)).slice(0, MAX_ITEM_CARDS);
    const statIds = Phaser.Utils.Array.Shuffle([...STAT_IDS]).slice(0, LEVEL_UP_CHOICES - items.length);
    const choices: LevelUpChoice[] = [...items, ...statIds.map((stat): LevelUpChoice => ({ kind: 'stat', stat, points: STAT_CARD_POINTS }))];
    return Phaser.Utils.Array.Shuffle(choices);
}

function itemChoices(stats: CharacterStats, equipment: Equipment): LevelUpChoice[] {
    const choices: LevelUpChoice[] = [];
    const { str, int } = stats.stats;

    const weapon = equipment.weapon;
    if (weapon) {
        const families = Object.values(MELEE_FAMILIES) as MeleeFamilyDef[];
        for (const offer of handOffers(families, weapon, getMeleeWeapon(weapon).family, (id) => getMeleeWeapon(id).family,
            (id) => getMeleeWeapon(id).strRequired <= str)) {
            choices.push(offer.link ? { kind: 'weaponLink', weapon: offer.id, from: weapon } : { kind: 'weaponSwitch', weapon: offer.id, from: weapon });
        }
    }

    const spell = equipment.spell;
    if (spell) {
        const families = Object.values(SPELL_FAMILIES) as SpellFamilyDef[];
        for (const offer of handOffers(families, spell, getSpell(spell).family, (id) => getSpell(id).family,
            (id) => getSpell(id).intRequired <= int)) {
            choices.push(offer.link ? { kind: 'spellLink', spell: offer.id, from: spell } : { kind: 'spellSwitch', spell: offer.id, from: spell });
        }
    }

    const pieces = ARMOR_BY_SET[stats.def.armorSet];
    for (const slot of ARMOR_SLOT_IDS) {
        const ordered = pieces[slot];
        if (!ordered) continue;
        const best = bestAllowed(ordered, (id) => {
            const piece = getArmorPiece(id);
            return piece.required <= stats.stats[piece.stat];
        });
        const worn = equipment.armor[slot];
        if (best && (worn === undefined || ordered.indexOf(best) > ordered.indexOf(worn))) {
            choices.push({ kind: 'armor', piece: best, from: worn });
        }
    }
    for (const passive of PASSIVE_IDS) {
        const rank = equipment.passives[passive];
        if (rank < getPassive(passive).maxRank) choices.push({ kind: 'passive', passive, rank: rank + 1 });
    }
    return choices;
}

/**
 * Offers for the thing in hand (weapon or spell): in its own family only a stronger link; in every other
 * enabled family, the best one allowed.
 */
function handOffers<Id, Family>(
    families: ReadonlyArray<{ enabled: boolean; links: readonly Id[] }>,
    inHand: Id,
    ownFamily: Family,
    familyOf: (id: Id) => Family,
    allowed: (id: Id) => boolean,
): Array<{ id: Id; link: boolean }> {
    const offers: Array<{ id: Id; link: boolean }> = [];
    for (const family of families) {
        if (!family.enabled) continue;
        const best = bestAllowed(family.links, allowed);
        if (best === undefined || best === inHand) continue;
        const isOwn = familyOf(best) === ownFamily;
        if (isOwn && family.links.indexOf(best) <= family.links.indexOf(inHand)) continue;
        offers.push({ id: best, link: isOwn });
    }
    return offers;
}

/** Last (strongest) entry of an ordered list that passes the test. */
function bestAllowed<T>(ordered: readonly T[], allowed: (id: T) => boolean): T | undefined {
    for (let i = ordered.length - 1; i >= 0; i--) {
        const id = ordered[i];
        if (id !== undefined && allowed(id)) return id;
    }
    return undefined;
}
