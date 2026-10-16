// Arma las cartas de subida de nivel (ver la skill anadir-mejora y docs/DESIGN.md → "Cartas al subir de nivel").
// - Stat: +3 a un stat. Siempre disponible.
// - Eslabón: el arma más fuerte de TU familia que el Str permite.
// - Cambio de familia: la mejor arma de otra familia activa que el Str permite; sustituye a la de la mano.
// - Armadura: la mejor pieza que el Str permite en cada hueco, si es mejor que la que llevas.
// Como mucho MAX_ITEM_CARDS cartas de objeto; el resto son de stat, sin repetir.
import Phaser from 'phaser';
import { ARMOR_BY_SLOT, ARMOR_PIECES, ARMOR_SLOT_IDS, type ArmorPieceId } from '../data/armor';
import { LEVEL_UP_CHOICES, MAX_ITEM_CARDS, STAT_CARD_POINTS, STAT_IDS, type StatId } from '../data/stats';
import { getMeleeWeapon, MELEE_FAMILIES, type MeleeFamilyDef, type MeleeFamilyId, type MeleeWeaponId } from '../data/weapons';
import type { CharacterStats } from '../entities/CharacterStats';
import type { Equipment } from '../entities/Equipment';

export type LevelUpChoice =
    | { kind: 'stat'; stat: StatId; points: number }
    /** Next weapon of the family in hand. */
    | { kind: 'weaponLink'; weapon: MeleeWeaponId; from: MeleeWeaponId }
    /** Weapon of another family, replacing the one in hand. */
    | { kind: 'weaponSwitch'; weapon: MeleeWeaponId; from: MeleeWeaponId }
    | { kind: 'armor'; piece: ArmorPieceId; from: ArmorPieceId | undefined };

export function buildLevelUpChoices(stats: CharacterStats, equipment: Equipment): LevelUpChoice[] {
    const items = Phaser.Utils.Array.Shuffle(itemChoices(stats, equipment)).slice(0, MAX_ITEM_CARDS);
    const statIds = Phaser.Utils.Array.Shuffle([...STAT_IDS]).slice(0, LEVEL_UP_CHOICES - items.length);
    const choices: LevelUpChoice[] = [...items, ...statIds.map((stat): LevelUpChoice => ({ kind: 'stat', stat, points: STAT_CARD_POINTS }))];
    return Phaser.Utils.Array.Shuffle(choices);
}

function itemChoices(stats: CharacterStats, equipment: Equipment): LevelUpChoice[] {
    const str = stats.stats.str;
    const choices: LevelUpChoice[] = [];

    const inHand = equipment.weapon;
    if (inHand) {
        const ownFamily = getMeleeWeapon(inHand).family;
        for (const [familyId, family] of Object.entries(MELEE_FAMILIES) as [MeleeFamilyId, MeleeFamilyDef][]) {
            if (!family.enabled) continue;
            const links = family.links;
            const best = bestAllowed(links, (id) => getMeleeWeapon(id).strRequired <= str);
            if (!best || best === inHand) continue;
            if (familyId === ownFamily) {
                // Only forward: a link stronger than the one in hand.
                if (links.indexOf(best) > links.indexOf(inHand)) choices.push({ kind: 'weaponLink', weapon: best, from: inHand });
            } else {
                choices.push({ kind: 'weaponSwitch', weapon: best, from: inHand });
            }
        }
    }

    if (stats.def.canWearArmor) {
        for (const slot of ARMOR_SLOT_IDS) {
            const pieces = ARMOR_BY_SLOT[slot];
            const best = bestAllowed(pieces, (id) => ARMOR_PIECES[id].strRequired <= str);
            const worn = equipment.armor[slot];
            if (best && (worn === undefined || pieces.indexOf(best) > pieces.indexOf(worn))) {
                choices.push({ kind: 'armor', piece: best, from: worn });
            }
        }
    }
    return choices;
}

/** Last (strongest) entry of an ordered list that passes the test. */
function bestAllowed<T>(ordered: readonly T[], allowed: (id: T) => boolean): T | undefined {
    for (let i = ordered.length - 1; i >= 0; i--) {
        const id = ordered[i];
        if (id !== undefined && allowed(id)) return id;
    }
    return undefined;
}
