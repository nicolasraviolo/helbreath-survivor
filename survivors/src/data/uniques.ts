// Objetos únicos (Fase 30B; decidido por el propietario el 27 y el 28-oct-2026, docs/DECISIONES.md):
// - Solo armas y hechizos. Cada mapa da los suyos y solo los suelta su **jefe final**.
// - Una tirada cada vez que muere el jefe final de ese mapa: 2 % de base y +1 % por cada tirada fallida en ese mapa
//   (protección contra la mala suerte, ~1 de cada 20 de media). Al salir, el contador de ese mapa vuelve a 0.
// - Si sale, es **uno de los del mapa al azar**, aunque no sea de la clase que juega: entonces va directo al baúl
//   (para el otro personaje). El contador es del **dispositivo** (systems/UniqueStore.ts), no de cada personaje.
// - Caen **desde siempre**, pero ponérselos pide Level 100 (UNIQUE_LEVEL) además de su Str o Int.
// - Nunca los vende Tom, nunca salen en el botín normal ni en la partida simulada.
// - Icebound: Sword of Ice Elemental (espada larga que ralentiza lo que golpea) e Ice Storm (tormenta de hielo).
import type { SoundKey } from '../config/assetManifest';
import type { ItemId } from './items';
import type { MapId } from './maps';

/** Level every unique asks for, besides its own Str or Int (owner, 27-oct-2026: "Level ~100+"). */
export const UNIQUE_LEVEL = 100;

/** Chance of the roll: `base`, plus `perMiss` for each miss on that map since the last unique (never above 1). */
export const UNIQUE_DROP = { base: 0.02, perMiss: 0.01 } as const;

/** Uniques of each map (dropped by its final boss), from the first one added. */
export const MAP_UNIQUES: Readonly<Partial<Record<MapId, readonly ItemId[]>>> = {
    icebound: ['iceElementalSword', 'iceStorm'],
};

/** Every unique, from all the maps. */
export const UNIQUE_ITEM_IDS: ReadonlySet<ItemId> = new Set(Object.values(MAP_UNIQUES).flat());

export function isUniqueItem(id: ItemId): boolean {
    return UNIQUE_ITEM_IDS.has(id);
}

/** Look of a unique: its name in this colour, a purple glow on the ground, and a sign over the player when picked up. */
export const UNIQUE_LOOK = {
    /** Name colour on the loot card, the Equipment screen and the end screen. */
    color: 0xc890ff,
    /** Glow under it on the ground (instead of the gold one), a bit bigger. */
    glowColor: 0xa060ff,
    glowScale: 1.6,
    /** Sign over the player when it falls (so it isn't missed among the boss's other loot). */
    dropText: 'Unique item!',
    /** Sign when another class's unique is picked up: it goes straight to the warehouse. */
    warehouseText: (name: string) => `${name} sent to the Warehouse`,
    /** Played when it falls (the Epic cards' chime). */
    sound: 'sfx.cardEpic',
} as const satisfies { color: number; glowColor: number; glowScale: number; dropText: string; warehouseText: (name: string) => string; sound: SoundKey };
