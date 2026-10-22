// Mapas ganados en este dispositivo (Fase 22A), en su propia clave: valen para los 4 personajes, como el baúl.
// Un mapa se abre al ganar el anterior O al llegar a su Level recomendado con el personaje que juega (lo que pase antes;
// decidido el 20-oct-2026). El primero (Traveler Zone) siempre está abierto; los "Coming soon" nunca.
// Lleva número de versión como los demás guardados. Si el navegador no deja guardar, dura hasta cerrar la página.
import { DEBUG_START } from '../config/debugStart';
import { FIRST_MAP, isMapId, MAP_IDS, MAPS_DATA, previousMap, type MapId } from '../data/maps';
import { isRecord } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.maps';
/** 1 (Fase 22A): the first one. */
const MAPS_VERSION = 1;

/** Why a map can't be played yet, or undefined if it can. */
export type MapLock = { kind: 'comingSoon' } | { kind: 'locked'; previous: MapId; level: number };

class MapUnlockStoreImpl {
    private readonly won = new Set<MapId>(load());
    /** ?maps=all: every map open (the "Coming soon" ones still can't be played). */
    private readonly allOpen = DEBUG_START.maps === 'all';

    constructor() {
        // ?maps=reset (development only; debugStart.ts): forget the wins.
        if (DEBUG_START.maps === 'reset') this.won.clear();
        // Written at once, so what came from the older saves (fromOlderVersions) is only worked out on the first load.
        this.write();
    }

    public hasWon(id: MapId): boolean {
        return this.won.has(id);
    }

    /** Escaped through the portal. True the first time (a new win). */
    public recordWin(id: MapId): boolean {
        if (this.won.has(id)) return false;
        this.won.add(id);
        this.write();
        return true;
    }

    /** Why this character (of that Level) can't play the map, or undefined if it can. */
    public lockOf(id: MapId, characterLevel: number): MapLock | undefined {
        const def = MAPS_DATA[id];
        if ('comingSoon' in def && def.comingSoon) return { kind: 'comingSoon' };
        const previous = previousMap(id);
        if (id === FIRST_MAP || previous === undefined || this.allOpen) return undefined;
        if (this.won.has(previous) || characterLevel >= def.recommendedLevel) return undefined;
        return { kind: 'locked', previous, level: def.recommendedLevel };
    }

    public isOpen(id: MapId, characterLevel: number): boolean {
        return this.lockOf(id, characterLevel) === undefined;
    }

    /** Maps a win opened that were closed before it (for the Game Over screen). */
    public openedBy(id: MapId, characterLevel: number): MapId[] {
        if (this.won.has(id)) return [];
        return MAP_IDS.filter((other) => previousMap(other) === id && !this.isOpen(other, characterLevel) && !this.isComingSoon(other));
    }

    private isComingSoon(id: MapId): boolean {
        return this.lockOf(id, Number.MAX_SAFE_INTEGER)?.kind === 'comingSoon';
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: MAPS_VERSION, won: MAP_IDS.filter((id) => this.won.has(id)) }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function load(): MapId[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return fromOlderVersions();
        const data: unknown = JSON.parse(raw);
        // A newer version (an older copy of the game cached on the phone) is read as it is: only ids we know.
        if (!isRecord(data) || !Array.isArray(data.won)) return [];
        return data.won.filter(isMapId);
    } catch {
        return [];
    }
}

/**
 * First load after Fase 22: whoever already played keeps Bleeding Isle open (Traveler Zone counts as won), and a
 * Bleeding Isle won before (its achievement) counts too. Read from the other saves' raw data, as they were written.
 */
function fromOlderVersions(): MapId[] {
    const playedBefore = localStorage.getItem('hb-survivors.characters') !== null || localStorage.getItem('hb-survivors.runs') !== null;
    if (!playedBefore) return [];
    const won: MapId[] = [FIRST_MAP];
    const achievements: unknown = JSON.parse(localStorage.getItem('hb-survivors.achievements') ?? 'null');
    // AchievementStore writes { version, unlocked: { [id]: time } }.
    if (isRecord(achievements) && isRecord(achievements.unlocked) && achievements.unlocked[WIN_BISLE_ACHIEVEMENT] !== undefined) {
        won.push('bisle');
    }
    return won;
}

/** Id of "Island Conqueror" in data/achievements.ts. */
const WIN_BISLE_ACHIEVEMENT = 'winBisle';

export const mapUnlockStore = new MapUnlockStoreImpl();
