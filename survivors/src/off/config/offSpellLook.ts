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
