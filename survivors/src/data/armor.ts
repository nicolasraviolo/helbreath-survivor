// Armaduras del Guerrero (Fase 6, bloque 6A). Tres huecos: Cuerpo, Casco y Escudo.
// La carta de armadura ofrece la mejor pieza que el Str permite en un hueco; se equipa sola y cambia el aspecto.
// Requisitos y defensa son números PROPIOS (como las armas): progresión gradual para un Guerrero que empieza con Str 14.
// Defensa = parte del daño recibido que se quita (0.06 = −6%); se suman las tres piezas, con tope en MAX_DEFENSE.
// Sprites: sp-client/src/constants/Items.ts (versión de hombre).
import type { GearLayer, GearSlot } from '../hb/playerAppearance';

export type ArmorSlotId = 'body' | 'helm' | 'shield';

export interface ArmorPieceDef {
    name: string;
    slot: ArmorSlotId;
    /** Str needed for the card to appear. */
    strRequired: number;
    /** Share of incoming damage removed (0..1). */
    defense: number;
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

export const ARMOR_PIECES = {
    // Cuerpo
    leatherArmor: { name: 'Leather Armor', slot: 'body', strRequired: 15, defense: 0.06, look: { armor: { sprite: 'gear.armor.leather.m' } } },
    scaleMail: { name: 'Scale Mail', slot: 'body', strRequired: 21, defense: 0.1, look: { armor: { sprite: 'gear.armor.scale.m' } } },
    chainMail: {
        name: 'Chain Mail', slot: 'body', strRequired: 28, defense: 0.14,
        look: { armor: { sprite: 'gear.armor.chain.m' }, leggings: { sprite: 'gear.leggings.chain.m' } },
    },
    plateMail: {
        name: 'Plate Mail', slot: 'body', strRequired: 38, defense: 0.2,
        look: { armor: { sprite: 'gear.armor.plate.m' }, hauberk: { sprite: 'gear.hauberk.m' }, leggings: { sprite: 'gear.leggings.plate.m' } },
    },
    // Casco
    helmet: { name: 'Helmet', slot: 'helm', strRequired: 18, defense: 0.04, look: { helm: { sprite: 'gear.helm.basic.m' } } },
    fullHelmet: { name: 'Full Helmet', slot: 'helm', strRequired: 27, defense: 0.07, look: { helm: { sprite: 'gear.helm.full.m' } } },
    wingedHelmet: { name: 'Winged Helmet', slot: 'helm', strRequired: 37, defense: 0.1, look: { helm: { sprite: 'gear.helm.winged.m' } } },
    hornedHelmet: { name: 'Horned Helmet', slot: 'helm', strRequired: 48, defense: 0.13, look: { helm: { sprite: 'gear.helm.horned.m' } } },
    // Escudo (msh.spr: 7 hojas por escudo, empieza en startSheet)
    leatherShield: { name: 'Leather Shield', slot: 'shield', strRequired: 16, defense: 0.04, look: { shield: { sprite: 'gear.shields.m', startSheet: 7 } } },
    targeShield: { name: 'Targe Shield', slot: 'shield', strRequired: 22, defense: 0.06, look: { shield: { sprite: 'gear.shields.m', startSheet: 14 } } },
    ironShield: { name: 'Iron Shield', slot: 'shield', strRequired: 30, defense: 0.08, look: { shield: { sprite: 'gear.shields.m', startSheet: 35 } } },
    knightShield: { name: 'Knight Shield', slot: 'shield', strRequired: 39, defense: 0.1, look: { shield: { sprite: 'gear.shields.m', startSheet: 49 } } },
    towerShield: { name: 'Tower Shield', slot: 'shield', strRequired: 50, defense: 0.13, look: { shield: { sprite: 'gear.shields.m', startSheet: 56 } } },
} as const satisfies Record<string, ArmorPieceDef>;

export type ArmorPieceId = keyof typeof ARMOR_PIECES;

/** Pieces of each slot, from weakest to strongest. */
export const ARMOR_BY_SLOT: Record<ArmorSlotId, readonly ArmorPieceId[]> = {
    body: ['leatherArmor', 'scaleMail', 'chainMail', 'plateMail'],
    helm: ['helmet', 'fullHelmet', 'wingedHelmet', 'hornedHelmet'],
    shield: ['leatherShield', 'targeShield', 'ironShield', 'knightShield', 'towerShield'],
};

export const ARMOR_SLOT_IDS = ['body', 'helm', 'shield'] as const satisfies readonly ArmorSlotId[];

export function getArmorPiece(id: ArmorPieceId): ArmorPieceDef {
    return ARMOR_PIECES[id];
}
