// Objetos que caen al suelo y buffs temporales (Fase 6, bloque 6C; plan aprobado por el propietario el 16-oct-2026).
// - Red Potion: cura. Imán (dibujado con el Crystal: no hay sprite de imán): atrae todas las gemas de XP.
// - Cofre (dibujado con la bolsa de oro): da un buff aleatorio, ofensivo o defensivo. Los cofres NO desaparecen.
//   Los buffs se combinan; coger uno que ya tienes renueva su tiempo (systems/BuffSystem.ts).
// - Hasta que haya minijefes (Fase 7), el cofre aparece cada CHEST_EVERY_KILLS bajas.
// Sprites: item-ground.spr (sp-client Items.ts). Buffs: efectos y sonido de sp-client Effects.ts (Berserk, Defense Shield).
import type { SoundKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';

export type PickupId = 'potion' | 'magnet' | 'chest';

export interface PickupDef {
    name: string;
    /** item-ground.spr sheet and frame. */
    sheet: number;
    frame: number;
    scale: number;
    /** Chance that a killed enemy drops it (0..1). 0 = never from enemies. */
    dropChance: number;
    /** Time on the ground before it disappears (ms); undefined = it stays until picked up. */
    lifeMs?: number;
    pickupSound: SoundKey;
}

export const PICKUPS = {
    // Red Potion (item-ground 5/1). Al beber: C19, el sonido de consumirla en el original.
    potion: { name: 'Red Potion', sheet: 5, frame: 1, scale: 1.5, dropChance: 0.015, lifeMs: 60000, pickupSound: 'sfx.drink' },
    // Imán: Crystal (item-ground 15/46), distinto de las gemas de XP (esmeralda, zafiro, rubí).
    magnet: { name: 'Magnet', sheet: 15, frame: 46, scale: 1.5, dropChance: 0.005, lifeMs: 60000, pickupSound: 'sfx.pickup' },
    // Cofre: Gold Pocket (item-ground 5/120). No desaparece (pedido por el propietario).
    chest: { name: 'Chest', sheet: 5, frame: 120, scale: 1.6, dropChance: 0, pickupSound: 'sfx.pickup' },
} as const satisfies Record<PickupId, PickupDef>;

/** Health healed by a potion, as a share of maximum health. */
export const POTION_HEAL_SHARE = 0.3;
/** A chest appears every this many kills (until mini-bosses drop them in Phase 7). */
export const CHEST_EVERY_KILLS = 150;
/** Picked up when the player's feet are this close (px). */
export const PICKUP_RADIUS = 22;
/** Blinks during the last part of its life, so the player knows it is about to go. */
export const PICKUP_BLINK_MS = 5000;
export const PICKUP_BLINK_PERIOD_MS = 150;
/** Sound when a chest appears on the ground (ITEM_DROPPED_SOUND). */
export const CHEST_DROP_SOUND: SoundKey = 'sfx.itemDrop';

// --- Buffs del cofre -------------------------------------------------------------------------------------

export type BuffId = 'berserk' | 'defenseShield';

export interface BuffDef {
    name: string;
    /** 'offense' or 'defense': the chest picks one kind at random, then a buff of that kind. */
    kind: 'offense' | 'defense';
    durationMs: number;
    /** Multiplies all damage dealt (1 = no change). */
    damageMultiplier: number;
    /** Multiplies damage taken (1 = no change). */
    damageTakenMultiplier: number;
    /** Effect played once at the feet when it starts. */
    castEffect: EffectKey;
    /** Effect that loops around the player while it lasts. */
    auraEffect?: EffectKey;
    /** Additive colour glow over the character while it lasts (the original Berserk red overlay). */
    overlayTint?: number;
    /** Colour of its name over the player when it starts and of its line in the HUD (sprite font). */
    color: number;
}

export const BUFFS = {
    berserk: {
        // sp-client: effect8 hoja 1 al lanzarlo; mientras dura, copia roja aditiva (0xff4444, 50%) sobre el personaje.
        name: 'Berserk', kind: 'offense', durationMs: 20000, damageMultiplier: 1.4, damageTakenMultiplier: 1,
        castEffect: 'fx.berserk.cast', overlayTint: 0xff4444, color: 0xff3828,
    },
    defenseShield: {
        // sp-client: effect8 hoja 6 al lanzarlo; aura effect9 hoja 14 mientras dura.
        name: 'Defense Shield', kind: 'defense', durationMs: 20000, damageMultiplier: 1, damageTakenMultiplier: 0.6,
        castEffect: 'fx.defenseShield.cast', auraEffect: 'fx.defenseShield.aura', color: 0x70a8ff,
    },
} as const satisfies Record<BuffId, BuffDef>;

/**
 * When a buff starts, its name rises over the player like a spell name in the original ("Berserk!"):
 * sp-client Player.createSpellNameFloatingText → 3 tiles above the feet (+20), 30 px/s up, 2 s, fading the last second.
 */
export const BUFF_NAME_FLOAT = { offsetY: -76, risePxPerSec: 30, lifeMs: 2000, fadeMs: 1000 } as const;

/** Opacity of the additive overlay (the original uses 0.5). */
export const BUFF_OVERLAY_ALPHA = 0.5;
/** Sound when a buff starts (EFFECT_CAST). */
export const BUFF_CAST_SOUND: SoundKey = 'sfx.buff';

export function getBuff(id: BuffId): BuffDef {
    return BUFFS[id];
}
