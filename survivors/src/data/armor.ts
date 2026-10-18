// Armaduras y ropa (Fase 6, bloques 6A y 6B). Cada clase tiene su juego de piezas:
// - Guerrero: Cuerpo, Casco y Escudo; piden Str y quitan una parte del daño recibido.
// - Maga: túnica y gorro; piden Mag (como en el original), quitan algo de daño y suben el daño mágico.
// La carta de armadura ofrece la mejor pieza que el stat permite en un hueco; se equipa sola y cambia el aspecto.
// Requisitos, defensa y bonus son números PROPIOS (progresión gradual desde los stats iniciales).
// Defensa = parte del daño recibido que se quita (0.06 = −6%); se suman las piezas, con tope en MAX_DEFENSE.
// Defensa contra golpes (Fase 18A) = defenseRatio, el valor ORIGINAL de cada pieza: hace que los golpes fallen.
// Sprites: sp-client/src/constants/Items.ts.
import type { GearLayer, GearSlot } from '../hb/playerAppearance';

export type ArmorSlotId = 'body' | 'helm' | 'shield';
/** Which class wears a piece (CharacterDef.armorSet). */
export type ArmorSetId = 'warrior' | 'mage';

export interface ArmorPieceDef {
    name: string;
    slot: ArmorSlotId;
    set: ArmorSetId;
    /** Stat checked for the card to appear, and the value needed. */
    stat: 'str' | 'mag';
    required: number;
    /** Share of incoming damage removed (0..1). */
    defense: number;
    /**
     * Original base defense ratio (docs/hb-wiki/armaduras.md): makes monster blows miss (data/defense.ts).
     * Knight Shield is not in the wiki: the Kite Shield's (30), between Iron and Tower.
     */
    defenseRatio: number;
    /** Extra magic damage while worn (0.05 = +5%). */
    magicDamageBonus?: number;
    /** Layers this piece draws (body armor may also bring sleeves and leggings). */
    look: Partial<Record<GearSlot, GearLayer>>;
}

export const ARMOR_SLOT_NAMES: Record<ArmorSlotId, string> = {
    body: 'Body armor',
    helm: 'Helmet',
    shield: 'Shield',
};

/** Defense never goes above this, however much armor is worn. */
export const MAX_DEFENSE = 0.6;
/** A hit always does at least this much damage. */
export const MIN_DAMAGE_TAKEN = 1;

/**
 * Wizard Robe = the same sprite as the Robe in another colour: item colour 11 "Tan" in the original
 * (reference/Client.cpp:702-729, +5 −10 −30 on each pixel). Phaser multiplies instead of adding, so this is close.
 */
const WIZARD_ROBE_TINT = 0xe8d0a0;

export const ARMOR_PIECES = {
    // Guerrero · Cuerpo
    leatherArmor: { name: 'Leather Armor', slot: 'body', set: 'warrior', stat: 'str', required: 15, defense: 0.06, defenseRatio: 11, look: { armor: { sprite: 'gear.armor.leather.m' } } },
    scaleMail: { name: 'Scale Mail', slot: 'body', set: 'warrior', stat: 'str', required: 21, defense: 0.1, defenseRatio: 16, look: { armor: { sprite: 'gear.armor.scale.m' } } },
    chainMail: {
        name: 'Chain Mail', slot: 'body', set: 'warrior', stat: 'str', required: 28, defense: 0.14, defenseRatio: 31,
        look: { armor: { sprite: 'gear.armor.chain.m' }, leggings: { sprite: 'gear.leggings.chain.m' } },
    },
    plateMail: {
        name: 'Plate Mail', slot: 'body', set: 'warrior', stat: 'str', required: 38, defense: 0.2, defenseRatio: 37,
        look: { armor: { sprite: 'gear.armor.plate.m' }, hauberk: { sprite: 'gear.hauberk.m' }, leggings: { sprite: 'gear.leggings.plate.m' } },
    },
    // Guerrero · Casco
    helmet: { name: 'Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 18, defense: 0.04, defenseRatio: 8, look: { helm: { sprite: 'gear.helm.basic.m' } } },
    fullHelmet: { name: 'Full Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 27, defense: 0.07, defenseRatio: 10, look: { helm: { sprite: 'gear.helm.full.m' } } },
    wingedHelmet: { name: 'Winged Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 37, defense: 0.1, defenseRatio: 15, look: { helm: { sprite: 'gear.helm.winged.m' } } },
    hornedHelmet: { name: 'Horned Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 48, defense: 0.13, defenseRatio: 19, look: { helm: { sprite: 'gear.helm.horned.m' } } },
    // Guerrero · Escudo (msh.spr: 7 hojas por escudo, empieza en startSheet)
    leatherShield: { name: 'Leather Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 16, defense: 0.04, defenseRatio: 10, look: { shield: { sprite: 'gear.shields.m', startSheet: 7 } } },
    targeShield: { name: 'Targe Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 22, defense: 0.06, defenseRatio: 13, look: { shield: { sprite: 'gear.shields.m', startSheet: 14 } } },
    ironShield: { name: 'Iron Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 30, defense: 0.08, defenseRatio: 22, look: { shield: { sprite: 'gear.shields.m', startSheet: 35 } } },
    knightShield: { name: 'Knight Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 39, defense: 0.1, defenseRatio: 30, look: { shield: { sprite: 'gear.shields.m', startSheet: 49 } } },
    towerShield: { name: 'Tower Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 50, defense: 0.13, defenseRatio: 35, look: { shield: { sprite: 'gear.shields.m', startSheet: 56 } } },
    // Maga · Túnica (la Maga empieza con 14 de Mag y gana +2 por nivel)
    robe: { name: 'Robe', slot: 'body', set: 'mage', stat: 'mag', required: 18, defense: 0.04, defenseRatio: 12, magicDamageBonus: 0.06, look: { armor: { sprite: 'gear.armor.robe.w' } } },
    wizardRobe: {
        name: 'Wizard Robe', slot: 'body', set: 'mage', stat: 'mag', required: 30, defense: 0.07, defenseRatio: 14, magicDamageBonus: 0.14,
        look: { armor: { sprite: 'gear.armor.robe.w', tint: WIZARD_ROBE_TINT } },
    },
    // Maga · Gorro
    wizardCap: { name: 'Wizard Cap', slot: 'helm', set: 'mage', stat: 'mag', required: 22, defense: 0.03, defenseRatio: 8, magicDamageBonus: 0.05, look: { helm: { sprite: 'gear.helm.wizardCap.w' } } },
    wizardHat: { name: 'Wizard Hat', slot: 'helm', set: 'mage', stat: 'mag', required: 34, defense: 0.05, defenseRatio: 10, magicDamageBonus: 0.1, look: { helm: { sprite: 'gear.helm.wizardHat.w' } } },
} as const satisfies Record<string, ArmorPieceDef>;

export type ArmorPieceId = keyof typeof ARMOR_PIECES;

/** Pieces of each slot for each class, from weakest to strongest. */
export const ARMOR_BY_SET: Record<ArmorSetId, Partial<Record<ArmorSlotId, readonly ArmorPieceId[]>>> = {
    warrior: {
        body: ['leatherArmor', 'scaleMail', 'chainMail', 'plateMail'],
        helm: ['helmet', 'fullHelmet', 'wingedHelmet', 'hornedHelmet'],
        shield: ['leatherShield', 'targeShield', 'ironShield', 'knightShield', 'towerShield'],
    },
    mage: {
        body: ['robe', 'wizardRobe'],
        helm: ['wizardCap', 'wizardHat'],
    },
};

export const ARMOR_SLOT_IDS = ['body', 'helm', 'shield'] as const satisfies readonly ArmorSlotId[];

export function getArmorPiece(id: ArmorPieceId): ArmorPieceDef {
    return ARMOR_PIECES[id];
}
