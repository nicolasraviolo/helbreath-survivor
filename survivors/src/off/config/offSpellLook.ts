// Helbreath Off (Fase Off-6B): el nombre de la magia sobre la cabeza al empezar a prepararla, como el cliente original
// (reference/Client.cpp: mensaje de tipo 41 "Nombre!", dibujado con PutString_SprFont3 tipo 0 = la letra de las cartas
// de Survivors, SpriteText 'title'): rojo (RGB 75,10,10 × 4), 65 px sobre los pies, sube 1 px cada 32 ms hasta 10 px
// y se quita a los 2 s (DEF_CHATTIMEOUT_C; el valor no está en el repo, de memoria).
export const OFF_SPELL_NAME_LOOK = {
    color: 0xff2828,
    /** After the name (the original writes "Berserk!"). */
    suffix: '!',
    startAboveFeetPx: 65,
    msPerRisePx: 32,
    maxRisePx: 10,
    durationMs: 2000,
} as const;

/** Off-6C: the health Heal gives, over the player (green, as the potions' colour in Survivors). */
export const OFF_HEAL_NUMBER_COLOR = '#5cff6a';

/**
 * Off-6C: bottom right of the HUD, in the same place and letters as Survivors' buffs (HUD_BUFF): the shield on with its
 * seconds (lowest line) and, above it, the spell being prepared or ready.
 */
export const OFF_SPELL_HUD = {
    shieldColor: 0x8ad8ff,
    preparingColor: 0xb0a080,
    readyColor: 0xffd860,
    preparing: (name: string) => `${name}...`,
    ready: (name: string) => `${name} ready`,
    shield: (name: string, seconds: number) => `${name} ${seconds}s`,
} as const;
