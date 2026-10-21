// Reroll y Skip en las cartas de Power (Fase 21½B; decidido por el propietario el 21-oct-2026, como Vampire Survivors).
// No son gratis: son mejoras permanentes de todo el dispositivo (UnlockStore) que se compran hasta 3 veces cada una
// al mismo vendedor que el Zem (ciudad, Fase 24). Dado = +1 Reroll por partida; vino = +1 Skip por partida.
// Reroll saca 3 cartas nuevas (con su rareza otra vez); Skip no coge ninguna y cura un poco (propietario, 21-oct-2026).
// Iconos: el dado se dibuja con código (el original no tiene dado; ui/DiceIcon.ts); el vino es el Wine del original
// (objeto 284, Items.ts: hoja 5 de item-pack, frame 117).
import type { SoundKey } from '../config/assetManifest';
import type { ItemIconFrame } from './itemTypes';

/** Permanent upgrades bought several times (UnlockStore keeps how many). */
export const STACKABLE_UNLOCK_IDS = ['dice', 'wine'] as const;
export type StackableUnlockId = (typeof STACKABLE_UNLOCK_IDS)[number];

export function isStackableUnlockId(value: string): value is StackableUnlockId {
    return (STACKABLE_UNLOCK_IDS as readonly string[]).includes(value);
}

export interface StackableUnlockDef {
    name: string;
    /** Times it can be bought: also the most uses per run. */
    maxCount: number;
}

export const STACKABLE_UNLOCKS: Record<StackableUnlockId, StackableUnlockDef> = {
    dice: { name: 'Dice', maxCount: 3 },
    wine: { name: 'Wine', maxCount: 3 },
};

export const CARD_ACTIONS = ['reroll', 'skip'] as const;
export type CardAction = (typeof CARD_ACTIONS)[number];

export interface CardActionDef {
    label: string;
    /** The permanent upgrade that gives one use per run. */
    unlock: StackableUnlockId;
    color: number;
    sound: SoundKey;
}

export const CARD_ACTION: Record<CardAction, CardActionDef> = {
    reroll: { label: 'Reroll', unlock: 'dice', color: 0x4a78c0, sound: 'sfx.pickup' },
    skip: { label: 'Skip', unlock: 'wine', color: 0x8a3048, sound: 'sfx.drink' },
};

/** Skip heals this share of the maximum health. */
export const SKIP_HEAL_SHARE = 0.2;

/** The Wine bottle of the original, on the Skip button. */
export const WINE_ICON: ItemIconFrame = { sheet: 5, frame: 117 };

/** Face of the die on the Reroll button: three pips in a diagonal (owner, 21-oct-2026). */
export const DICE_FACE = 3;

/** The die drawn on the Reroll button (ui/DiceIcon.ts). */
export const DICE_LOOK = { fill: 0xf4f0e6, border: 0x302820, pip: 0x302820, cornerRadius: 0.18, pipRadius: 0.09 } as const;
