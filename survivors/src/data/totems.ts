// Tótems (Fase 16B; plan aprobado por el propietario el 18-oct-2026).
// Mana Stones que aparecen cada cierto tiempo en un sitio al azar de la zona de juego, con un sonido. Al pisarlas dan su
// efecto y se gastan; si nadie las coge, parpadean al final y desaparecen. Son 4: Berserk y Defense Shield (los buffs que
// antes daban los cofres), Full HP (cura entera al instante) y Freeze (los monstruos que se ven en pantalla, jefes
// incluidos, se quedan quietos unos segundos). Los cofres pasan a dar una carta de mejora (GameScene).
// Dibujo: manastone.spr (una sola imagen, repetida en sus 40 hojas) con el Casting Circle de sp-client a sus pies
// (effect5 hoja 7) teñido del color de su efecto. Se recogen pisando cualquier casilla que tape el dibujo (como mínimo
// 2×2; pedido por el propietario). Lo maneja systems/TotemSystem.ts y el minimapa los marca con su color.
import type { SoundKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';
import type { BuffId } from './pickups';

export type TotemId = 'berserk' | 'defenseShield' | 'fullHp' | 'freeze';

/** What a totem does when stepped on. */
export type TotemEffect =
    /** Starts a timed buff (data/pickups.ts → BUFFS): it brings its own effect, sound and name over the player. */
    | { kind: 'buff'; buff: BuffId }
    /** Heals the player to full health. */
    | { kind: 'fullHeal' }
    /** Freezes every living monster on screen for `durationMs`. */
    | { kind: 'freeze'; durationMs: number };

export interface TotemDef {
    /** Rises over the player when taken (the buffs show their own name). */
    name: string;
    /** Glow under the stone, minimap dot and rising name. */
    color: number;
    effect: TotemEffect;
    /** Effect at the player's feet and sound when taken (the buffs bring their own). */
    castEffect?: EffectKey;
    castSound?: SoundKey;
    /** Relative chance of being the next one to appear. */
    weight: number;
}

export const TOTEMS = {
    berserk: { name: 'Berserk', color: 0xff3828, effect: { kind: 'buff', buff: 'berserk' }, weight: 1 },
    defenseShield: { name: 'Defense Shield', color: 0x70a8ff, effect: { kind: 'buff', buff: 'defenseShield' }, weight: 1 },
    // Efecto de Resurrection del original (effect11 hoja 10).
    fullHp: {
        name: 'Full HP', color: 0x50e060, effect: { kind: 'fullHeal' },
        castEffect: 'fx.fullHp.cast', castSound: 'sfx.buff', weight: 1,
    },
    // Círculo de Mass Illusion Movement (effect8 hoja 5) y el sonido de los fragmentos de hielo (EFFECT_ICE_SHARD, E46).
    freeze: {
        name: 'Freeze', color: 0x9ce8ff, effect: { kind: 'freeze', durationMs: 5000 },
        castEffect: 'fx.freeze.cast', castSound: 'sfx.freeze', weight: 1,
    },
} as const satisfies Record<TotemId, TotemDef>;

export const TOTEM_IDS = Object.keys(TOTEMS) as TotemId[];

export function getTotem(id: TotemId): TotemDef {
    return TOTEMS[id];
}

/** When and where they appear. */
export const TOTEM_SPAWN = {
    /** The first one, counted from the start of the run (or from Continue). */
    firstAtMs: 60000,
    /** Then one every this long, while there is room. */
    everyMs: 75000,
    /** At most this many on the map at once. */
    maxAlive: 2,
    /** Time on the ground before it disappears (it blinks at the end, like the potions). */
    lifeMs: 60000,
    /** Distance from the player (px): not right under their feet, not on the other side of the map. */
    minDistance: 320,
    maxDistance: 900,
    /** Random places tried in one go; if none is free, it tries again after `retryMs`. */
    tries: 40,
    retryMs: 1000,
} as const;

/** Drawing: one image of manastone.spr and its glow (config/effects.ts → 'fx.totem.glow'). */
export const TOTEM_LOOK = {
    sheet: 0,
    glowEffect: 'fx.totem.glow',
    glowScale: 1.6,
    glowAlpha: 0.9,
} as const satisfies { sheet: number; glowEffect: EffectKey; glowScale: number; glowAlpha: number };

/**
 * Where it is picked up: every tile the stone's picture covers by at least `minOverlapPx` on both axes (so a few
 * stray pixels do not count), and never less than `minTiles` × `minTiles` around its base.
 */
export const TOTEM_PICKUP = { minOverlapPx: 8, minTiles: 2 } as const;

/** Sound when one appears: the original's "item manufacture success" chime (E23). */
export const TOTEM_APPEAR_SOUND: SoundKey = 'sfx.totemAppear';

/** Freeze: cold blue tint over the frozen monsters (multiplied over the sprite). */
export const FREEZE_TINT = 0x80c8ff;
