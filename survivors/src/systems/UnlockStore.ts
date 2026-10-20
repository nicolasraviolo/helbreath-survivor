// Mejoras permanentes de todo el dispositivo (Fase 21E; data/abaddon.ts), en su propia clave, aparte de los personajes:
// valen para los 4. Hoy solo Abaddon's Blood. La tienda de la Fase 24 llamará a unlock() al comprarla.
// Lleva número de versión como los demás guardados. Si el navegador no deja guardar, dura hasta cerrar la página.
import { DEBUG_START } from '../config/debugStart';
import { UNLOCK_IDS, isUnlockId, type UnlockId } from '../data/abaddon';
import { isRecord } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.unlocks';
/** 1 (Fase 21E): the first one. */
const UNLOCKS_VERSION = 1;

class UnlockStoreImpl {
    private readonly unlocked = new Set<UnlockId>(load());

    constructor() {
        // ?unlocks=abaddon / reset (development only; debugStart.ts).
        const debug = DEBUG_START.unlocks;
        if (debug === 'reset') this.unlocked.clear();
        else if (debug) for (const id of debug) this.unlocked.add(id);
        if (debug) this.write();
    }

    public has(id: UnlockId): boolean {
        return this.unlocked.has(id);
    }

    /** Fase 24: the shop sells it. False if it already was. */
    public unlock(id: UnlockId): boolean {
        if (this.unlocked.has(id)) return false;
        this.unlocked.add(id);
        this.write();
        return true;
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: UNLOCKS_VERSION, unlocked: UNLOCK_IDS.filter((id) => this.unlocked.has(id)) }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function load(): UnlockId[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data: unknown = JSON.parse(raw);
        // A newer version (an older copy of the game cached on the phone) is read as it is: only ids we know.
        if (!isRecord(data) || !Array.isArray(data.unlocked)) return [];
        return data.unlocked.filter((id): id is UnlockId => typeof id === 'string' && isUnlockId(id));
    } catch {
        return [];
    }
}

export const unlockStore = new UnlockStoreImpl();
