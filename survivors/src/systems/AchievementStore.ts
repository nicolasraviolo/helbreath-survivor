// Logros conseguidos (Fase 14B), guardados en el navegador en su propia clave, aparte de las partidas guardadas.
// Se guarda el id de cada logro con la fecha en que se consiguió; los ids que ya no existan se ignoran al leer.
// Desde la Fase 29C (versión 2) guarda también cuántos monstruos de cada tipo se han matado en total (todas las
// partidas, los dos personajes juntos), para los logros que se acumulan. Se cuentan todos los tipos, no solo los que
// tienen logro: así un logro nuevo de otro monstruo ya sale con lo matado hasta entonces.
// Lleva número de versión, como SaveStore: si un día cambia la forma de guardar, se sube y migrate() convierte lo viejo.
// Si el navegador no deja guardar (modo privado), los logros valen solo hasta cerrar la página.
import { DEBUG_START } from '../config/debugStart';
import { ACHIEVEMENT_IDS, ACHIEVEMENTS, getAchievement, type AchievementGoal, type AchievementId } from '../data/achievements';
import { ENEMIES, type EnemyId } from '../data/enemies';
import { RESCUABLE_NPCS } from '../data/rescues';
import { rescueStore } from './RescueStore';
import { isKeyOf, isRecord, readNumber } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.achievements';
/** Raise it (and teach migrate() the old shape) whenever the stored shape changes. */
const ACHIEVEMENTS_VERSION = 2;

/** When each one was unlocked (Date.now()). */
type Unlocked = Partial<Record<AchievementId, number>>;
/** Monsters of each kind killed so far, every run added up (Fase 29C). */
type KillCounts = Partial<Record<EnemyId, number>>;

interface Stored {
    unlocked: Unlocked;
    kills: KillCounts;
}

class AchievementStoreImpl {
    private unlocked: Unlocked;
    private kills: KillCounts;

    constructor() {
        ({ unlocked: this.unlocked, kills: this.kills } = load());
        // Debug ?achievements=reset / all and ?kills=slime:2995 (debugStart.ts, development only).
        if (DEBUG_START.achievements === 'reset') {
            this.unlocked = {};
            this.kills = {};
        }
        if (DEBUG_START.achievements === 'all') for (const id of ACHIEVEMENT_IDS) this.unlocked[id] ??= Date.now();
        for (const [enemy, count] of Object.entries(DEBUG_START.kills)) if (isKeyOf(ENEMIES, enemy)) this.kills[enemy] = count;
        if (DEBUG_START.achievements || Object.keys(DEBUG_START.kills).length > 0) this.write();
        // Fase 29B: rescues saved before their achievement existed (or before it was unlocked) count at once, quietly;
        // Fase 29C: the same for kill counters already past a new goal.
        for (const id of ACHIEVEMENT_IDS) {
            const goal = getAchievement(id).goal;
            if (!this.has(id) && (rescueGoalMet(goal) || this.killGoalMet(goal))) this.unlock(id);
        }
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

    /** Monsters of that kind killed so far, every run added up (Fase 29C). */
    public killCount(enemy: EnemyId): number {
        return this.kills[enemy] ?? 0;
    }

    /** A 'killTotal' goal (Fase 29C) already reached on this device. */
    public killGoalMet(goal: AchievementGoal): boolean {
        return goal.kind === 'killTotal' && this.killCount(goal.enemy) >= goal.count;
    }

    /** Adds a batch of kills (one save for all of them: AchievementTracker sends them every half second). */
    public addKills(kills: KillCounts): void {
        let any = false;
        for (const [enemy, count] of Object.entries(kills)) {
            if (!isKeyOf(ENEMIES, enemy) || !count) continue;
            this.kills[enemy] = (this.kills[enemy] ?? 0) + count;
            any = true;
        }
        if (any) this.write();
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: ACHIEVEMENTS_VERSION, unlocked: this.unlocked, kills: this.kills }));
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

function load(): Stored {
    const stored: Stored = { unlocked: {}, kills: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return stored;
        const data = migrate(JSON.parse(raw));
        for (const [id, at] of Object.entries(data.unlocked)) {
            const when = readNumber(at);
            if (isKeyOf(ACHIEVEMENTS, id) && when !== undefined) stored.unlocked[id] = when;
        }
        for (const [enemy, count] of Object.entries(data.kills)) {
            const n = readNumber(count);
            if (isKeyOf(ENEMIES, enemy) && n !== undefined && n > 0) stored.kills[enemy] = Math.floor(n);
        }
    } catch {
        // Unreadable: as if none were unlocked.
    }
    return stored;
}

/**
 * Old shapes → today's: the id → date table and the kill counters.
 * - Version 1 (Fase 14B–29B): only the table; the counters start at 0 (nothing was counted before the Fase 29C).
 */
function migrate(data: unknown): { unlocked: Record<string, unknown>; kills: Record<string, unknown> } {
    const none = { unlocked: {}, kills: {} };
    if (!isRecord(data) || !isRecord(data.unlocked)) return none;
    if (data.version === 1) return { unlocked: data.unlocked, kills: {} };
    if (data.version === ACHIEVEMENTS_VERSION) return { unlocked: data.unlocked, kills: isRecord(data.kills) ? data.kills : {} };
    // Saved by a newer version of the game (an older copy cached on the phone): leave it alone.
    return none;
}

export const achievementStore = new AchievementStoreImpl();
