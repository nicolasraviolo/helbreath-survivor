// Oro (Fase 24A; plan aprobado por el propietario el 21-oct-2026, docs/DECISIONES.md).
// - Sale de monedas que sueltan los monstruos (pocas, el imán las atrae), de montones que sueltan los jefes y el
//   Champion, y (24C) de vender objetos al herrero. Los mapas difíciles dan más (GOLD_MAP_MULTIPLIER).
// - Se guarda para todo el dispositivo (los 4 personajes, como el baúl): systems/GoldStore.ts. Nunca se pierde, tampoco
//   al morir sin Zem.
// - Objetivo: una partida de Bleeding Isle de 15 minutos (~3.000 bajas, 2 minijefes, Champion y jefe final) da
//   ~250 de oro, unos 1.000 por hora. Los precios (24B tienda, 24C herrero) están pensados para eso: "challenging",
//   nada importante en las primeras horas.
import type { MapId } from './maps';

export const GOLD = {
    /** Chance that a normal monster drops a coin when it dies (elites: eliteCoinChance). */
    // Revisión de la dificultad (E, propietario 22-oct-2026): 2% → 4%. Las partidas daban ~550 de oro por hora, la mitad
    // de lo previsto, porque casi todas acaban hacia el minuto 8.
    coinChance: 0.04,
    eliteCoinChance: 0.25,
    /** Gold of one coin (before the map's multiplier). */
    coinValue: 2,
    /** Gold of one pile (bosses and the Champion drop several). */
    pileValue: 10,
    /** Piles dropped by each kind of boss. */
    piles: { miniBoss: 3, champion: 2, finalBoss: 6 },
    /** How far apart the piles of one boss fall (px). */
    pileSpread: 34,
} as const;

/** Gold multiplier of each map: the harder ones give more. */
export const GOLD_MAP_MULTIPLIER: Readonly<Record<MapId, number>> = {
    traveler: 0.7,
    bisle: 1,
    elvineGarden: 1.4,
    middleland: 1.8,
};

/** Gold of a coin or a pile on that map (never less than 1). */
export function goldValue(base: number, map: MapId): number {
    return Math.max(1, Math.round(base * (GOLD_MAP_MULTIPLIER[map] ?? 1)));
}

/** "1,250" as the game writes amounts of gold. */
export function formatGold(amount: number): string {
    return Math.floor(amount).toLocaleString('en-US');
}
