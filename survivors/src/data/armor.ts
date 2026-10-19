// Armaduras y ropa (Fase 6, bloques 6A y 6B). Cada clase tiene su juego de piezas:
// - Guerrero: Cuerpo, Casco y Escudo; piden Str y quitan una parte del daño recibido.
// - Maga: túnica y gorro; piden Mag (como en el original), quitan algo de daño y suben el daño mágico.
// La carta de armadura ofrece la mejor pieza que el stat permite en un hueco; se equipa sola y cambia el aspecto.
// Requisitos, defensa y bonus son números PROPIOS (progresión gradual desde los stats iniciales).
// Defensa = parte del daño recibido que se quita (0.06 = −6%); se suman las piezas, con tope en MAX_DEFENSE.
// Defensa contra golpes (Fase 18A) = defenseRatio, el valor ORIGINAL de cada pieza: hace que los golpes fallen.
// Resistencia mágica (Fase 18B) = magicResistance, número PROPIO (la wiki no lo da por pieza): ropa de mago y
// escudos y cascos grandes del guerrero. Hace que los hechizos no entren (data/defense.ts).
// Sprites: sp-client/src/constants/Items.ts.
// Fase 20B: huecos nuevos de pantalones, botas y capa (solo en la pantalla de equipo, no en las cartas), y en cada pieza
// `equip` = requisito ORIGINAL (Str = peso/100, Level y Mag de reference/Item*.cfg) e `icon` (item-pack.spr).
// `set`, `stat` y `required` son solo para las cartas de armadura (se van en el 20C).
import type { GearLayer, GearSlot } from '../hb/playerAppearance';
import type { EquipRequirement, ItemIcon } from './itemTypes';

export type ArmorSlotId = 'body' | 'helm' | 'shield' | 'legs' | 'boots' | 'cape';
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
    /** Magic resistance it adds: spells may not affect the player (data/defense.ts). Our own number. */
    magicResistance?: number;
    /** Extra magic damage while worn (0.05 = +5%). */
    magicDamageBonus?: number;
    /** Layers this piece draws (body armor may also bring sleeves). */
    look: Partial<Record<GearSlot, GearLayer>>;
    /** What the Equipment screen asks of the permanent stats (Fase 20B). */
    equip: EquipRequirement;
    /** Picture in item-pack.spr (Equipment screen). */
    icon: ItemIcon;
}

export const ARMOR_SLOT_NAMES: Record<ArmorSlotId, string> = {
    body: 'Body armor',
    helm: 'Helmet',
    shield: 'Shield',
    legs: 'Leggings',
    boots: 'Boots',
    cape: 'Cape',
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
    leatherArmor: { name: 'Leather Armor', slot: 'body', set: 'warrior', stat: 'str', required: 15, defense: 0.06, defenseRatio: 11, look: { armor: { sprite: 'gear.armor.leather.m' } }, equip: { str: 15 }, icon: { sheet: 8, frame: 0, female: { sheet: 12, frame: 2 } } },
    scaleMail: { name: 'Scale Mail', slot: 'body', set: 'warrior', stat: 'str', required: 21, defense: 0.1, defenseRatio: 16, look: { armor: { sprite: 'gear.armor.scale.m' } }, equip: { str: 20 }, icon: { sheet: 8, frame: 2, female: { sheet: 12, frame: 4 } } },
    chainMail: {
        name: 'Chain Mail', slot: 'body', set: 'warrior', stat: 'str', required: 28, defense: 0.14, defenseRatio: 31,
        look: { armor: { sprite: 'gear.armor.chain.m' } },
        equip: { str: 30 }, icon: { sheet: 8, frame: 1, female: { sheet: 12, frame: 3 } },
    },
    plateMail: {
        name: 'Plate Mail', slot: 'body', set: 'warrior', stat: 'str', required: 38, defense: 0.2, defenseRatio: 37,
        look: { armor: { sprite: 'gear.armor.plate.m' }, hauberk: { sprite: 'gear.hauberk.m' } },
        equip: { str: 100 }, icon: { sheet: 8, frame: 3, female: { sheet: 12, frame: 5 } },
    },
    // Guerrero · Casco
    helmet: { name: 'Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 18, defense: 0.04, defenseRatio: 8, look: { helm: { sprite: 'gear.helm.basic.m' } }, equip: { str: 52 }, icon: { sheet: 18, frame: 0 } },
    fullHelmet: { name: 'Full Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 27, defense: 0.07, defenseRatio: 10, look: { helm: { sprite: 'gear.helm.full.m' } }, equip: { str: 85 }, icon: { sheet: 18, frame: 1 } },
    wingedHelmet: { name: 'Winged Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 37, defense: 0.1, defenseRatio: 15, magicResistance: 4, look: { helm: { sprite: 'gear.helm.winged.m' } }, equip: { str: 130, level: 100 }, icon: { sheet: 18, frame: 3 } },
    hornedHelmet: { name: 'Horned Helmet', slot: 'helm', set: 'warrior', stat: 'str', required: 48, defense: 0.13, defenseRatio: 19, magicResistance: 8, look: { helm: { sprite: 'gear.helm.horned.m' } }, equip: { str: 160, level: 120 }, icon: { sheet: 18, frame: 2 } },
    // Guerrero · Escudo (msh.spr: 7 hojas por escudo, empieza en startSheet)
    woodShield: { name: 'Wood Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 0, defense: 0.03, defenseRatio: 8, look: { shield: { sprite: 'gear.shields.m', startSheet: 0 } }, equip: { str: 8 }, icon: { sheet: 2, frame: 0 } },
    leatherShield: { name: 'Leather Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 16, defense: 0.04, defenseRatio: 10, look: { shield: { sprite: 'gear.shields.m', startSheet: 7 } }, equip: { str: 10 }, icon: { sheet: 2, frame: 1 } },
    targeShield: { name: 'Targe Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 22, defense: 0.06, defenseRatio: 13, look: { shield: { sprite: 'gear.shields.m', startSheet: 14 } }, equip: { str: 18 }, icon: { sheet: 2, frame: 2 } },
    ironShield: { name: 'Iron Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 30, defense: 0.08, defenseRatio: 22, look: { shield: { sprite: 'gear.shields.m', startSheet: 35 } }, equip: { str: 25 }, icon: { sheet: 2, frame: 5 } },
    knightShield: { name: 'Knight Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 39, defense: 0.1, defenseRatio: 30, magicResistance: 6, look: { shield: { sprite: 'gear.shields.m', startSheet: 49 } }, equip: { str: 32 }, icon: { sheet: 2, frame: 7 } },
    towerShield: { name: 'Tower Shield', slot: 'shield', set: 'warrior', stat: 'str', required: 50, defense: 0.13, defenseRatio: 35, magicResistance: 12, look: { shield: { sprite: 'gear.shields.m', startSheet: 56 } }, equip: { str: 40 }, icon: { sheet: 2, frame: 8 } },
    // Maga · Túnica (la Maga empieza con 14 de Mag y gana +2 por nivel)
    robe: { name: 'Robe', slot: 'body', set: 'mage', stat: 'mag', required: 18, defense: 0.04, defenseRatio: 12, magicResistance: 8, magicDamageBonus: 0.06, look: { armor: { sprite: 'gear.armor.robe.w' } }, equip: { str: 10, mag: 100 }, icon: { sheet: 8, frame: 5, female: { sheet: 12, frame: 6 } } },
    wizardRobe: {
        name: 'Wizard Robe', slot: 'body', set: 'mage', stat: 'mag', required: 30, defense: 0.07, defenseRatio: 14, magicResistance: 15, magicDamageBonus: 0.14,
        look: { armor: { sprite: 'gear.armor.robe.w', tint: WIZARD_ROBE_TINT } },
        equip: { str: 10, mag: 100, level: 80 }, icon: { sheet: 8, frame: 5, female: { sheet: 12, frame: 6 } },
    },
    // Maga · Gorro
    wizardCap: { name: 'Wizard Cap', slot: 'helm', set: 'mage', stat: 'mag', required: 22, defense: 0.03, defenseRatio: 8, magicResistance: 5, magicDamageBonus: 0.05, look: { helm: { sprite: 'gear.helm.wizardCap.w' } }, equip: { str: 15, mag: 110 }, icon: { sheet: 18, frame: 4 } },
    wizardHat: { name: 'Wizard Hat', slot: 'helm', set: 'mage', stat: 'mag', required: 34, defense: 0.05, defenseRatio: 10, magicResistance: 10, magicDamageBonus: 0.1, look: { helm: { sprite: 'gear.helm.wizardHat.w' } }, equip: { str: 15, mag: 130 }, icon: { sheet: 18, frame: 5 } },
    // Fase 20B: pantalones, botas y capa, solo en la pantalla de equipo (no salen en las cartas). Defensa propia, pequeña.
    chainHose: {
        name: 'Chain Hose', slot: 'legs', set: 'warrior', stat: 'str', required: 0, defense: 0.05, defenseRatio: 8,
        look: { leggings: { sprite: 'gear.leggings.chain.m' } }, equip: { str: 10 }, icon: { sheet: 7, frame: 2, female: { sheet: 11, frame: 3 } },
    },
    plateLeggings: {
        name: 'Plate Leggings', slot: 'legs', set: 'warrior', stat: 'str', required: 0, defense: 0.08, defenseRatio: 12,
        look: { leggings: { sprite: 'gear.leggings.plate.m' } }, equip: { str: 20 }, icon: { sheet: 7, frame: 3, female: { sheet: 11, frame: 4 } },
    },
    shoes: { name: 'Shoes', slot: 'boots', set: 'warrior', stat: 'str', required: 0, defense: 0.01, defenseRatio: 1, look: { boots: { sprite: 'gear.shoes.m' } }, equip: { str: 2 }, icon: { sheet: 4, frame: 0 } },
    longBoots: { name: 'Long Boots', slot: 'boots', set: 'warrior', stat: 'str', required: 0, defense: 0.02, defenseRatio: 1, look: { boots: { sprite: 'gear.boots.long.m' } }, equip: { str: 5 }, icon: { sheet: 4, frame: 1 } },
    cape: { name: 'Cape', slot: 'cape', set: 'warrior', stat: 'str', required: 0, defense: 0.02, defenseRatio: 2, look: { cape: { sprite: 'gear.cape.m' } }, equip: { str: 2 }, icon: { sheet: 17, frame: 2 } },
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
