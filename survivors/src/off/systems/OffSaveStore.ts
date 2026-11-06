// Helbreath Off (Fase Off-2B): el personaje de Off guardado en su propia clave (`hb-off.character`): experiencia total
// (el nivel sale de ella, off/data/offLevel.ts) y puntos sin repartir (se reparten en la Off-3).
// Lleva número de versión como los guardados de Survivors. Si el navegador no deja guardar, dura hasta cerrar la página.
// Va en el código de traspaso (config/transfer.ts → TRANSFER_KEYS).
// Desarrollo: ?offreset empieza de cero; ?offlevel=N pone al personaje al principio del nivel N (debugStart.ts).
import { DEBUG_START } from '../../config/debugStart';
import { isRecord } from '../../systems/SaveStore';
import { OFF_LEVEL, offExpForLevel, offLevelForExp } from '../data/offLevel';

export const OFF_CHARACTER_STORAGE_KEY = 'hb-off.character';
/** 1 (Off-2B): experience and unspent points. */
const OFF_CHARACTER_VERSION = 1;

export interface OffSavedCharacter {
    /** Total experience. */
    exp: number;
    /** Stat points not spent yet (3 per level). */
    points: number;
}

class OffSaveStoreImpl {
    private data: OffSavedCharacter = load();

    constructor() {
        if (DEBUG_START.offReset) this.data = { exp: 0, points: 0 };
        const level = DEBUG_START.offLevel;
        if (level !== undefined) this.data = { exp: offExpForLevel(level), points: (level - 1) * OFF_LEVEL.pointsPerLevel };
        if (DEBUG_START.offReset || level !== undefined) this.write();
    }

    public get character(): Readonly<OffSavedCharacter> {
        return this.data;
    }

    public get level(): number {
        return offLevelForExp(this.data.exp);
    }

    public save(character: OffSavedCharacter): void {
        this.data = { ...character };
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
        if (!isRecord(data)) return { exp: 0, points: 0 };
        return { exp: nonNegative(data.exp), points: nonNegative(data.points) };
    } catch {
        return { exp: 0, points: 0 };
    }
}

function nonNegative(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export const offSaveStore = new OffSaveStoreImpl();
