// Helbreath Off (Fase Off-5A): los nombres de los bandos y los sitios, sin nada más, para que config/debugStart.ts los
// pueda leer sin arrastrar los datos de los mapas (off/data/offPlaces.ts).
export const OFF_FACTIONS = ['aresden', 'elvine'] as const;
export type OffFaction = (typeof OFF_FACTIONS)[number];

// Off-7A: Promiseland, el mapa de caza al que lleva el teleport de la ciudad.
export const OFF_PLACE_IDS = ['traveler', 'aresden', 'elvine', 'promiseland'] as const;
export type OffPlaceId = (typeof OFF_PLACE_IDS)[number];

export function isOffFaction(value: unknown): value is OffFaction {
    return typeof value === 'string' && (OFF_FACTIONS as readonly string[]).includes(value);
}

export function isOffPlaceId(value: unknown): value is OffPlaceId {
    return typeof value === 'string' && (OFF_PLACE_IDS as readonly string[]).includes(value);
}
