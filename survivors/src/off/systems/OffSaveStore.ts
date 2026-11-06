// Helbreath Off (Fase Off-2B): el personaje de Off guardado en su propia clave (`hb-off.character`): experiencia total
// (el nivel sale de ella, off/data/offLevel.ts) y puntos sin repartir (se reparten en la ventana Character, Off-3B).
// Fase Off-3A (versión 2): también nombre, aspecto y stats, y si ya se ha creado. Sin personaje creado, Play lleva a la
// pantalla de crear (OffCreateScene). Un guardado de la versión 1 se queda con su experiencia, 12 en cada stat, el
// nombre por defecto y el aspecto del novato, y cuenta como creado.
// Lleva número de versión como los guardados de Survivors. Si el navegador no deja guardar, dura hasta cerrar la página.
// Va en el código de traspaso (config/transfer.ts → TRANSFER_KEYS).
// Desarrollo: ?offreset borra el personaje (Play vuelve a crear uno); ?offlevel=N pone al personaje al principio del
// nivel N, ya creado (debugStart.ts).
import { DEBUG_START } from '../../config/debugStart';
import type { CharacterLook } from '../../data/appearance';
import { CHARACTER_NAME_MAX_LENGTH } from '../../data/characterSlots';
import { cleanName, readLook } from '../../systems/CharacterStore';
import { isRecord } from '../../systems/SaveStore';
import { OFF_CREATION, OFF_OLD_SAVE_STATS, OFF_STAT_IDS, OFF_STAT_MAX, type OffStats } from '../data/offCharacter';
import { OFF_LEVEL, offExpForLevel, offLevelForExp } from '../data/offLevel';
import { OFF_NOVICE_LOOK } from '../data/offWorld';

export const OFF_CHARACTER_STORAGE_KEY = 'hb-off.character';
/** 1 (Off-2B): experience and unspent points. 2 (Off-3A): name, look, stats and whether it was created. */
const OFF_CHARACTER_VERSION = 2;

export interface OffSavedCharacter {
    /** False until the creation screen is done (Play opens it). */
    created: boolean;
    name: string;
    look: CharacterLook;
    stats: OffStats;
    /** Total experience. */
    exp: number;
    /** Stat points not spent yet (3 per level). */
    points: number;
}

/** The character before anyone creates one (also what ?offreset leaves). */
function blankCharacter(): OffSavedCharacter {
    return { created: false, name: OFF_CREATION.defaultName, look: { ...OFF_NOVICE_LOOK }, stats: { ...OFF_OLD_SAVE_STATS }, exp: 0, points: 0 };
}

class OffSaveStoreImpl {
    private data: OffSavedCharacter = load();

    constructor() {
        if (DEBUG_START.offReset) this.data = blankCharacter();
        const level = DEBUG_START.offLevel;
        if (level !== undefined) this.data = { ...this.data, created: true, exp: offExpForLevel(level), points: (level - 1) * OFF_LEVEL.pointsPerLevel };
        if (DEBUG_START.offReset || level !== undefined) this.write();
    }

    public get character(): Readonly<OffSavedCharacter> {
        return this.data;
    }

    public get level(): number {
        return offLevelForExp(this.data.exp);
    }

    /** Creation screen done: a new character at level 1. */
    public create(name: string, look: CharacterLook, stats: OffStats): void {
        this.data = { created: true, name, look: { ...look }, stats: { ...stats }, exp: 0, points: 0 };
        this.write();
    }

    /** Character window, Ok (Off-3B): points added to the stats, and the points still unspent. */
    public assignPoints(added: Readonly<OffStats>, pointsLeft: number): void {
        const stats = { ...this.data.stats };
        for (const id of OFF_STAT_IDS) stats[id] = Math.min(OFF_STAT_MAX, stats[id] + Math.max(0, added[id]));
        this.data = { ...this.data, stats, points: Math.max(0, pointsLeft) };
        this.write();
    }

    /** Experience and unspent points after a fight (the rest stays as it is). */
    public saveProgress(exp: number, points: number): void {
        this.data = { ...this.data, exp, points };
        this.write();
    }

    private write(): void {
        try {
            localStorage.setItem(OFF_CHARACTER_STORAGE_KEY, JSON.stringify({ version: OFF_CHARACTER_VERSION, ...this.data }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function load(): OffSavedCharacter {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(OFF_CHARACTER_STORAGE_KEY) ?? 'null');
        if (!isRecord(data)) return blankCharacter();
        const blank = blankCharacter();
        // Version 1 had no creation: that character counts as created, with the blank one's name, look and stats.
        const created = data.version === 1 ? true : data.created === true;
        const name = typeof data.name === 'string' ? cleanName(data.name).slice(0, CHARACTER_NAME_MAX_LENGTH) : '';
        return {
            created,
            name: name || blank.name,
            look: readLook(data.look) ?? blank.look,
            stats: readStats(data.stats) ?? blank.stats,
            exp: nonNegative(data.exp),
            points: nonNegative(data.points),
        };
    } catch {
        return blankCharacter();
    }
}

function readStats(value: unknown): OffStats | undefined {
    if (!isRecord(value)) return undefined;
    const stats = { ...OFF_OLD_SAVE_STATS };
    for (const id of OFF_STAT_IDS) {
        const n = value[id];
        if (typeof n !== 'number' || !Number.isInteger(n) || n < OFF_CREATION.base) return undefined;
        stats[id] = n;
    }
    return stats;
}

function nonNegative(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export const offSaveStore = new OffSaveStoreImpl();
