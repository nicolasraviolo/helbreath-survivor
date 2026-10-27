// Logros conseguidos (Fase 14B), guardados en el navegador en su propia clave, aparte de las partidas guardadas.
// Se guarda el id de cada logro con la fecha en que se consiguió; los ids que ya no existan se ignoran al leer.
// Lleva número de versión, como SaveStore: si un día cambia la forma de guardar, se sube y migrate() convierte lo viejo.
// Si el navegador no deja guardar (modo privado), los logros valen solo hasta cerrar la página.
import { DEBUG_START } from '../config/debugStart';
import { ACHIEVEMENT_IDS, ACHIEVEMENTS, getAchievement, type AchievementGoal, type AchievementId } from '../data/achievements';
import { RESCUABLE_NPCS } from '../data/rescues';
import { rescueStore } from './RescueStore';
import { isKeyOf, isRecord, readNumber } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.achievements';
/** Raise it (and teach migrate() the old shape) whenever the stored shape changes. */
const ACHIEVEMENTS_VERSION = 1;

/** When each one was unlocked (Date.now()). */
type Unlocked = Partial<Record<AchievementId, number>>;

class AchievementStoreImpl {
    private unlocked: Unlocked = load();

    constructor() {
        // Debug ?achievements=reset / all (debugStart.ts, development only).
        if (DEBUG_START.achievements === 'reset') this.unlocked = {};
        if (DEBUG_START.achievements === 'all') for (const id of ACHIEVEMENT_IDS) this.unlocked[id] ??= Date.now();
        if (DEBUG_START.achievements) this.write();
        // Fase 29B: rescues saved before their achievement existed (or before it was unlocked) count at once, quietly.
        for (const id of ACHIEVEMENT_IDS) if (!this.has(id) && rescueGoalMet(getAchievement(id).goal)) this.unlock(id);
    }

    public has(id: AchievementId): boolean {
        return this.unlocked[id] !== undefined;
    }

    /** When it was unlocked, or undefined if it wasn't. */
    public unlockedAt(id: AchievementId): number | undefined {
        return this.unlocked[id];
    }

    public get count(): number {
        return ACHIEVEMENT_IDS.filter((id) => this.has(id)).length;
    }

    /** Marks it as unlocked; false if it already was. */
    public unlock(id: AchievementId): boolean {
        if (this.has(id)) return false;
        this.unlocked[id] = Date.now();
        this.write();
        return true;
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: ACHIEVEMENTS_VERSION, unlocked: this.unlocked }));
        } catch {
            // Storage blocked or full: they last until the page is closed.
        }
    }
}

/** A rescue goal (Fase 29B) already met on this device: its captive (or every captive) is back in town. */
export function rescueGoalMet(goal: AchievementGoal): boolean {
    if (goal.kind !== 'rescue') return false;
    return goal.npc === undefined ? RESCUABLE_NPCS.every((npc) => rescueStore.isInTown(npc)) : rescueStore.isInTown(goal.npc);
}

function load(): Unlocked {
    const unlocked: Unlocked = {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return unlocked;
        for (const [id, at] of Object.entries(migrate(JSON.parse(raw)))) {
            const when = readNumber(at);
            if (isKeyOf(ACHIEVEMENTS, id) && when !== undefined) unlocked[id] = when;
        }
    } catch {
        // Unreadable: as if none were unlocked.
    }
    return unlocked;
}

/** Old shapes → today's id → date table. Version 1 is the first one: nothing to convert yet. */
function migrate(data: unknown): Record<string, unknown> {
    if (!isRecord(data) || !isRecord(data.unlocked)) return {};
    if (data.version === ACHIEVEMENTS_VERSION) return data.unlocked;
    // Saved by a newer version of the game (an older copy cached on the phone): leave it alone.
    return {};
}

export const achievementStore = new AchievementStoreImpl();
