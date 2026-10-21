// Mejoras permanentes de todo el dispositivo (Fase 21E; data/abaddon.ts), en su propia clave, aparte de los personajes:
// valen para los 4. Abaddon's Blood (sí o no) y, desde la Fase 21½B, el dado y el vino (se compran hasta 3 veces:
// data/rerollSkip.ts). La tienda de la Fase 24 llamará a unlock() / buy() al comprarlos.
// Lleva número de versión como los demás guardados. Si el navegador no deja guardar, dura hasta cerrar la página.
import { DEBUG_START } from '../config/debugStart';
import { UNLOCK_IDS, isUnlockId, type UnlockId } from '../data/abaddon';
import { STACKABLE_UNLOCKS, STACKABLE_UNLOCK_IDS, type StackableUnlockId } from '../data/rerollSkip';
import { isRecord } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.unlocks';
/** 1 (Fase 21E): the first one. 2 (Fase 21½B): adds `counts`; a version 1 is read as having none. */
const UNLOCKS_VERSION = 2;

type Counts = Partial<Record<StackableUnlockId, number>>;

class UnlockStoreImpl {
    private readonly unlocked: Set<UnlockId>;
    private readonly counts: Counts;

    constructor() {
        const saved = load();
        this.unlocked = new Set(saved.unlocked);
        this.counts = saved.counts;
        // ?unlocks=abaddon,dice3 / reset (development only; debugStart.ts).
        const debug = DEBUG_START.unlocks;
        const debugCounts = DEBUG_START.unlockCounts;
        if (debug === 'reset') {
            this.unlocked.clear();
            for (const id of STACKABLE_UNLOCK_IDS) delete this.counts[id];
        } else if (debug) for (const id of debug) this.unlocked.add(id);
        for (const id of STACKABLE_UNLOCK_IDS) {
            const count = debugCounts[id];
            if (count !== undefined) this.counts[id] = clampCount(id, count);
        }
        if (debug || Object.keys(debugCounts).length > 0) this.write();
    }

    /** Times an upgrade bought several times was bought (0 to its maxCount). */
    public count(id: StackableUnlockId): number {
        return this.counts[id] ?? 0;
    }

    /** Fase 24: the shop sells one more. False if it already has the most. */
    public buy(id: StackableUnlockId): boolean {
        const now = this.count(id);
        if (now >= STACKABLE_UNLOCKS[id].maxCount) return false;
        this.counts[id] = now + 1;
        this.write();
        return true;
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: UNLOCKS_VERSION,
                unlocked: UNLOCK_IDS.filter((id) => this.unlocked.has(id)),
                counts: this.counts,
            }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function clampCount(id: StackableUnlockId, count: number): number {
    return Math.max(0, Math.min(STACKABLE_UNLOCKS[id].maxCount, Math.floor(count)));
}

function load(): { unlocked: UnlockId[]; counts: Counts } {
    const empty = { unlocked: [], counts: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return empty;
        const data: unknown = JSON.parse(raw);
        // Any version is read as it is (a newer one comes from an older copy cached on the phone): only ids we know.
        if (!isRecord(data)) return empty;
        const unlocked = Array.isArray(data.unlocked)
            ? data.unlocked.filter((id): id is UnlockId => typeof id === 'string' && isUnlockId(id))
            : [];
        const countsIn = isRecord(data.counts) ? data.counts : {};
        const counts: Counts = {};
        for (const id of STACKABLE_UNLOCK_IDS) {
            const value = countsIn[id];
            if (typeof value === 'number' && Number.isFinite(value)) counts[id] = clampCount(id, value);
        }
        return { unlocked, counts };
    } catch {
        return empty;
    }
}

export const unlockStore = new UnlockStoreImpl();
