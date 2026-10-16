// Volumen y límites de sonidos simultáneos, para que 50 muertes a la vez no suenen como un estruendo.

export const AUDIO = {
    /** Master volume of sound effects (0..1). */
    sfxVolume: 0.5,
    /** Copies of the same sound playing at once; extra ones are skipped. */
    maxPerSound: 3,
    /** Minimum time between two starts of the same sound, in milliseconds. */
    minIntervalMs: 70,
    /** Sounds of any kind playing at once. */
    maxTotal: 14,
} as const;
