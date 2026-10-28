// Tiradas fallidas de objetos únicos de cada mapa (Fase 30B, data/uniques.ts), en su propia clave: el contador es del
// dispositivo (propietario, 28-oct-2026), como el baúl y los mapas ganados. Cada fallo sube la probabilidad de la
// siguiente tirada en ese mapa; al salir un único vuelve a 0.
// Lleva número de versión como los demás guardados. Si el navegador no deja guardar, dura hasta cerrar la página.
// Va en el código de traspaso (config/transfer.ts → TRANSFER_KEYS).
import { DEBUG_START } from '../config/debugStart';
import { isMapId, type MapId } from '../data/maps';
import { MAP_UNIQUES, UNIQUE_DROP } from '../data/uniques';
import type { ItemId } from '../data/items';
import { isRecord } from './SaveStore';

export const UNIQUES_STORAGE_KEY = 'hb-survivors.uniques';
/** 1 (Fase 30B): the first one. */
const UNIQUES_VERSION = 1;

class UniqueStoreImpl {
    private readonly misses = new Map<MapId, number>(load());

    constructor() {
        // ?unique=reset (development only; debugStart.ts): every counter back to 0.
        if (DEBUG_START.unique === 'reset') {
            this.misses.clear();
            this.write();
        }
    }

    /** Misses on that map since its last unique. */
    public missesOn(map: MapId): number {
        return this.misses.get(map) ?? 0;
    }

    /** Chance of the next roll on that map (0 if it has no uniques). */
    public chanceOn(map: MapId): number {
        if (!MAP_UNIQUES[map]?.length) return 0;
        return Math.min(1, UNIQUE_DROP.base + UNIQUE_DROP.perMiss * this.missesOn(map));
    }

    /**
     * The final boss of that map died: one roll. Returns the unique that falls (one of the map's at random, whatever the
     * class), or undefined, counting the miss. `forced` (debug) always gives that one, or a random one with `true`.
     */
    public roll(map: MapId, forced: ItemId | boolean = false): ItemId | undefined {
        const uniques = MAP_UNIQUES[map];
        if (!uniques?.length) return undefined;
        if (!forced && Math.random() >= this.chanceOn(map)) {
            this.misses.set(map, this.missesOn(map) + 1);
            this.write();
            return undefined;
        }
        this.misses.delete(map);
        this.write();
        if (typeof forced === 'string') return forced;
        return uniques[Math.floor(Math.random() * uniques.length)];
    }

    private write(): void {
        try {
            localStorage.setItem(UNIQUES_STORAGE_KEY, JSON.stringify({ version: UNIQUES_VERSION, misses: Object.fromEntries(this.misses) }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function load(): Array<[MapId, number]> {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(UNIQUES_STORAGE_KEY) ?? 'null');
        // A newer version (an older copy of the game cached on the phone) is read as it is: only maps we know.
        if (!isRecord(data) || !isRecord(data.misses)) return [];
        return Object.entries(data.misses).filter((entry): entry is [MapId, number] =>
            isMapId(entry[0]) && typeof entry[1] === 'number' && Number.isInteger(entry[1]) && entry[1] > 0);
    } catch {
        return [];
    }
}

export const uniqueStore = new UniqueStoreImpl();
