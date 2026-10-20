// Abaddon's Blood (Fase 21E): mejora permanente de todo el dispositivo (propietario, 20-oct-2026, como el "Revival" de
// Vampire Survivors). Una vez desbloqueada, en cada partida revives una vez al morir: media vida, 3 s invulnerable y
// una onda que aparta a los monstruos sin hacerles daño. No es un objeto: no se equipa ni se gasta.
// Hasta la Fase 24 solo se desbloquea con el atajo ?unlocks=abaddon; en la 24 la venderá la tienda (UnlockStore).
// Icono: Red Ball (objeto 652 del original, Item3.cfg:33, Spr 6 → hoja 5 de item-pack, frame 124).
// Efecto: "Abaddon Spirit 10" de yseffect3.spr hoja 11 (elegido por el propietario en el visor, 20-oct-2026; 5,6 MB,
// bajo demanda). Mientras no ha llegado, el Resurrection de effect11 hoja 10 (el del tótem Full HP).
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';
import type { ItemIconFrame } from './itemTypes';

export interface AbaddonDef {
    name: string;
    description: string;
    icon: ItemIconFrame;
    /** Share of the maximum health it comes back with. */
    reviveHpShare: number;
    /** Invulnerable (blinking) this long after getting up. */
    invulnerableMs: number;
    /** Lies on the ground this long before getting up (the death animation plays first). */
    reviveDelayMs: number;
    /** Monsters within this distance are pushed away (world pixels); bosses barely move (their knockbackTaken). */
    waveRadius: number;
    /** Push speed in px/s; it fades like a knockback (ENEMY_KNOCKBACK_DECAY), so ~speed / 12 pixels in all. */
    wavePush: number;
    /** The red ring that grows to waveRadius. */
    waveColor: number;
    waveWidth: number;
    waveMs: number;
    /** Effect when it gets up (big file: downloaded at the start of the run, only if unlocked). */
    effect: EffectKey;
    effectSprite: SpriteKey;
    /** Used instead while that file is still downloading. */
    fallbackEffect: EffectKey;
    /** Played with the voice (GENDER_SOUNDS.revive, C21/C22). */
    sound: SoundKey;
    /** Words over the character when it gets up. */
    banner: string;
    bannerColor: string;
    bannerRiseY: number;
    bannerMs: number;
}

export const ABADDON: AbaddonDef = {
    name: "Abaddon's Blood",
    description: "Abaddon's Blood — a drop from the strongest demon. Once per run, you rise again when you die.",
    icon: { sheet: 5, frame: 124 },
    reviveHpShare: 0.5,
    invulnerableMs: 3000,
    reviveDelayMs: 800,
    waveRadius: 170,
    wavePush: 1500,
    waveColor: 0xff3030,
    waveWidth: 6,
    waveMs: 450,
    effect: 'fx.abaddon.spirit',
    effectSprite: 'fx.yseffect3',
    fallbackEffect: 'fx.resurrection',
    sound: 'sfx.buff',
    banner: "Abaddon's Blood!",
    bannerColor: '#ff5050',
    bannerRiseY: 40,
    bannerMs: 1600,
};

/** Permanent upgrades of the device (UnlockStore). Fase 24 (shop) will add more and their prices. */
export const UNLOCK_IDS = ['abaddon'] as const;
export type UnlockId = (typeof UNLOCK_IDS)[number];

export function isUnlockId(value: string): value is UnlockId {
    return (UNLOCK_IDS as readonly string[]).includes(value);
}
