// Volumen y límites de sonidos simultáneos, para que 50 muertes a la vez no suenen como un estruendo.
// También el ritmo de los sonidos que, como en el original, se ajustan a la duración de una animación
// (sp-client SoundManager.calculatePlaybackRate: velocidad = duración del sonido / duración de la animación).
import type { SoundKey } from '../config/assetManifest';

export const AUDIO = {
    /** Master volume of sound effects (0..1). */
    sfxVolume: 0.5,
    /** Copies of the same sound playing at once; extra ones are skipped. */
    maxPerSound: 3,
    /** Minimum time between two starts of the same sound, in milliseconds. */
    minIntervalMs: 70,
    /** Sounds of any kind playing at once. */
    maxTotal: 14,
    /** Playback speed never goes outside this range, so very fast or slow animations don't distort the sound. */
    minRate: 0.5,
    maxRate: 2,
} as const;

/**
 * Melee swing sound (C18, 0.93 s) is squeezed into the original default attack: 8 frames at 12.5 fps = 640 ms.
 * The original speeds it up further with faster weapons; we keep this one length so short swords don't squeak.
 */
export const SWING_SOUND_MS = 640;

/** Footsteps (C10) repeat twice per run cycle, as in sp-client Player.getMovementConfig (run mode). */
export const FOOTSTEPS_PER_RUN_CYCLE = 2;
/** A puff of dust under the feet every this many pixels run (the original: one per tile reached). */
export const FOOTSTEP_DUST_EVERY_PX = 32;

/**
 * Music by moment of the run (docs/DESIGN.md → Audio): default in the main menu, middleland while playing, dungeon while a mini-boss is alive,
 * abaddon for the final boss. Volume 0..1 and cross-fade length.
 */
export const MUSIC = {
    normal: 'music.middleland',
    menu: 'music.menu',
    miniBoss: 'music.dungeon',
    finalBoss: 'music.abaddon',
    volume: 0.35,
    fadeMs: 1500,
} as const satisfies { normal: SoundKey; menu: SoundKey; miniBoss: SoundKey; finalBoss: SoundKey; volume: number; fadeMs: number };
