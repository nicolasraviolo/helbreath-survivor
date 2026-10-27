// Misiones de rescate (Fase 29A, decididas por el propietario el 27-oct-2026; docs/PLAN-2.md, "Fase 29").
// - Los NPCs de la ciudad se rescatan en los mapas: Traveler Zone → Howard (baúl), Bleeding Isle → Tom (herrero),
//   Elvine Garden → Shop Keeper. William está siempre (es quien da las misiones). Middleland, de momento, sin rescate.
// - Todas las cuentas empiezan sin nadie rescatado (también las que ya jugaban). Lo del baúl sigue guardado.
// - En la partida, el NPC está desde el principio en un punto marcado en el minimapa, con un Guard de minijefe al lado
//   (data/enemies.ts → guard). Al matar al Guard queda rescatado al momento, aunque luego mueras.
// - Sin recompensa aparte del aviso (los logros de rescate son el bloque 29B).
import type { SoundKey } from '../config/assetManifest';
import type { MapDifficulty, MapId } from './maps';
import type { NpcId } from './town';

export interface RescueDef {
    npc: NpcId;
    /** The Guard's health and blows × these (it is the same Guard on every map, tougher on the later ones). */
    guard: MapDifficulty;
}

export const RESCUES: Partial<Record<MapId, RescueDef>> = {
    traveler: { npc: 'howard', guard: { hp: 1, damage: 1 } },
    bisle: { npc: 'tom', guard: { hp: 1.4, damage: 1.4 } },
    elvineGarden: { npc: 'shopKeeper', guard: { hp: 1.9, damage: 1.8 } },
};

/** NPCs that can be rescued somewhere (the rest of the town is always there). */
export const RESCUABLE_NPCS: readonly NpcId[] = Object.values(RESCUES).map((rescue) => rescue.npc);

export const RESCUE = {
    /** Where the captive stands: this far from the player's start (px), on open ground inside the play area. */
    minDistance: 16 * 32,
    maxDistance: 26 * 32,
    tries: 80,
    /** The Guard stands this far beside the captive (px). */
    guardOffsetX: 40,
    /** Rescued, the NPC stays this long (ms), then fades away (it goes back to town) over `fadeMs`. */
    leaveAfterMs: 2500,
    fadeMs: 600,
    /** Said at the start of a run with a captive (this long after it begins, so the HUD is up), and when it is freed. */
    startMessageDelayMs: 1500,
    startMessage: (name: string) => `${name} is held captive! Find the Guard.`,
    rescuedMessage: (name: string) => `${name} rescued!`,
    rescuedSound: 'sfx.buff' as SoundKey,
} as const;
