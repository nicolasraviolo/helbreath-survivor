// Evento "Champion" (Fase 21½C; decidido por el propietario el 21-oct-2026, docs/PLAN-2.md "Fase 21½").
// - Una vez por partida seguro y, a veces, una segunda, en un minuto al azar entre el 2 y el 11, sin pisar los otros
//   eventos de la línea de tiempo (minijefes, "te rodean", estampidas, jefe final). Los minutos se sortean al empezar
//   la partida y se guardan con ella (Continue no los cambia).
// - Es un monstruo de los que saldrán en el tramo siguiente de la oleada, más grande, con el brillo rojo de los élites,
//   mucha vida y una barra de vida sobre la cabeza (como la del jugador). Sin barra grande arriba (propietario).
// - Al matarlo: un objeto garantizado del escalón siguiente o mejor, un chorro de gemas de XP y un 10% de Zem.
import type { LootTier } from './loot';
import type { WaveEventDef } from './waves';

export const CHAMPION = {
    /** Minutes in which a champion may appear (the first one always, the second with `secondChance`). */
    fromMinute: 2,
    toMinute: 11,
    secondChance: 0.35,
    /** Never this close (minutes) to another event of the timeline. */
    eventGapMinutes: 0.5,
    /** Two champions are at least this far apart (minutes). */
    championGapMinutes: 2,

    /** How much bigger it is drawn (and how much bigger its body is). */
    sizeFactor: 1.5,
    hpMultiplier: 20,
    damageMultiplier: 2,
    /** A bit slower than the normal ones of its kind. */
    speedFactor: 0.85,
    /** It barely moves when hit, like the bosses. */
    knockbackTaken: 0.3,

    /** Its XP is this many times that of its kind, split into `xpGems` gems around it. */
    xpMultiplier: 10,
    xpGems: 10,
    xpGemSpread: 36,
    /** The guaranteed item: only rolls of these kinds (one step above the character's own, or a big jump). */
    lootTiers: { next: 70, jump: 30 } as Readonly<Partial<Record<LootTier, number>>>,
    /** Chance of a Zemstone of Sacrifice too (owner, 21-oct-2026: 10%, as the bosses). */
    zemChance: 0.1,

    /** Health bar over its head, like the player's (entities/Player.ts) but wider. */
    bar: { width: 44, height: 5, gapAboveHead: 6, backColor: 0x200808, fillColor: 0xd83030, backAlpha: 0.8 },

    /** ?debug=champion: one comes out this long after starting. */
    debugDelayMs: 3000,
} as const;

/** Warning in the middle of the screen. */
export function championMessage(monsterName: string): string {
    return `A Champion ${monsterName} rises!`;
}

/** Name in the metrics' boss list (so whether it was killed is kept with the other bosses). */
export function championMetricsName(monsterName: string): string {
    return `Champion ${monsterName}`;
}

/** Minutes of this run's champions, in order: always one, sometimes two, away from the timeline's events. */
export function rollChampionMinutes(events: readonly WaveEventDef[], random: () => number = Math.random): number[] {
    const { fromMinute, toMinute, eventGapMinutes, championGapMinutes } = CHAMPION;
    const wanted = random() < CHAMPION.secondChance ? 2 : 1;
    const minutes: number[] = [];
    const free = (minute: number): boolean =>
        events.every((event) => Math.abs(event.atMinute - minute) >= eventGapMinutes)
        && minutes.every((other) => Math.abs(other - minute) >= championGapMinutes);
    for (let attempt = 0; attempt < 100 && minutes.length < wanted; attempt++) {
        // Rounded to a tenth of a minute (6 s): enough variety, and easy to read in the saved run.
        const minute = Math.round((fromMinute + random() * (toMinute - fromMinute)) * 10) / 10;
        if (free(minute)) minutes.push(minute);
    }
    return minutes.sort((a, b) => a - b);
}
