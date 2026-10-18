// Partidas guardadas en el navegador (Fase 12, bloque 12B): hasta SAVE_SLOT_COUNT "fotos" de partidas sin terminar.
// Cada foto guarda nombres (clase, arma, piezas de armadura, jefes vivos), nunca posiciones en una lista, para que
// añadir armas, mapas o niveles no estropee las partidas viejas. Lo que ya no existe se ignora al leer.
// El conjunto lleva número de versión: si un día cambia la forma de guardar, se sube la versión y migrate() convierte
// lo viejo, sin borrar el progreso de nadie. Logros, récords y baúl (Fases 14, 20 y 22) irán en otras claves.
// Si el navegador no deja guardar (modo privado, almacenamiento bloqueado), el juego funciona igual, sin Continue.
import type { BossReport, RunMetricsState } from '../config/metrics';
import { ARMOR_PIECES, type ArmorPieceId, type ArmorSlotId } from '../data/armor';
import { isCharacterId, type CharacterId } from '../data/characters';
import { ENEMIES, type EnemyId } from '../data/enemies';
import { DEFAULT_MAP, MAPS_DATA, type MapId } from '../data/maps';
import { PASSIVE_IDS, PASSIVES, type PassiveId } from '../data/passives';
import { BUFFS, type BuffId } from '../data/pickups';
import { SAVE_SLOT_COUNT } from '../data/saves';
import { SPELLS, type SpellId } from '../data/spells';
import { STAT_IDS, type Stats } from '../data/stats';
import { MELEE_WEAPONS, type MeleeWeaponId } from '../data/weapons';

const STORAGE_KEY = 'hb-survivors.runs';
/** Raise it (and teach migrate() the old shape) whenever RunSnapshot changes in a way old saves can't be read as. */
const SAVE_VERSION = 1;

/** Registry key (game.registry) with the slot that GameScene must load instead of starting a new run. */
export const RESUME_SLOT_KEY = 'resumeSlot';

/** Everything needed to rebuild a run (not the monsters, gems or pickups on the ground). */
export interface RunSnapshot {
    /** When it was saved (Date.now()), to show and to pick the oldest. */
    savedAt: number;
    map: MapId;
    character: CharacterId;
    elapsedMs: number;
    level: number;
    xp: number;
    /** Level-up cards not chosen yet (they show again on Continue). */
    pendingLevelUps: number;
    /** Free cards from chests not chosen yet (Fase 16B). Saves from before have none. */
    chestCards: number;
    stats: Stats;
    hp: number;
    kills: number;
    weapon: MeleeWeaponId | undefined;
    spell: SpellId | undefined;
    armor: Partial<Record<ArmorSlotId, ArmorPieceId>>;
    passives: Partial<Record<PassiveId, number>>;
    /** Milliseconds left of each active buff. */
    buffs: Partial<Record<BuffId, number>>;
    /** Bosses that were alive: they come back after the calm. */
    bosses: EnemyId[];
    /** The final boss was dead (Fase 13): its chest comes back, or the portal if it was open. */
    finalBossDead: boolean;
    /** The portal was open: milliseconds left of its countdown. */
    portalMsLeft: number | undefined;
    /** Potions drunk so far (Fase 14B, achievement "Iron Will"). Saves from before count as none. */
    potionsDrunk: number;
    /** What the anonymous stats collected so far (Fase 14A). Saves from before have none. */
    metrics: RunMetricsState | undefined;
}

type Slots = Array<RunSnapshot | undefined>;

class SaveStoreImpl {
    private slots: Slots = load();

    /** One entry per slot (undefined = free). */
    public get all(): ReadonlyArray<Readonly<RunSnapshot> | undefined> {
        return this.slots;
    }

    public get hasAny(): boolean {
        return this.slots.some((slot) => slot !== undefined);
    }

    public get hasFree(): boolean {
        return this.slots.some((slot) => slot === undefined);
    }

    public get(slot: number): Readonly<RunSnapshot> | undefined {
        return this.slots[slot];
    }

    /** Slot for a new run: the first free one or, if they are all in use, the oldest one. */
    public slotForNewRun(): number {
        const free = this.slots.indexOf(undefined);
        if (free >= 0) return free;
        let oldest = 0;
        this.slots.forEach((slot, i) => {
            if (slot && slot.savedAt < (this.slots[oldest]?.savedAt ?? Infinity)) oldest = i;
        });
        return oldest;
    }

    public save(slot: number, snapshot: RunSnapshot): void {
        this.slots[slot] = snapshot;
        this.write();
    }

    public clear(slot: number): void {
        if (this.slots[slot] === undefined) return;
        this.slots[slot] = undefined;
        this.write();
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, slots: this.slots.map((slot) => slot ?? null) }));
        } catch {
            // Storage blocked or full: the run goes on, it just can't be continued later.
        }
    }
}

function emptySlots(): Slots {
    return Array.from({ length: SAVE_SLOT_COUNT }, () => undefined);
}

function load(): Slots {
    const slots = emptySlots();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return slots;
        const data = migrate(JSON.parse(raw));
        data.forEach((entry, i) => {
            if (i < SAVE_SLOT_COUNT) slots[i] = readSnapshot(entry);
        });
    } catch {
        // Unreadable: as if there were no saves.
    }
    return slots;
}

/** Old shapes → today's list of slots. Version 1 is the first one: nothing to convert yet. */
function migrate(data: unknown): unknown[] {
    if (!isRecord(data) || !Array.isArray(data.slots)) return [];
    if (data.version === SAVE_VERSION) return data.slots;
    // Saved by a newer version of the game (an older copy cached on the phone): leave it alone.
    return [];
}

/** A slot as read from storage, or undefined if it isn't a usable run. Unknown names are dropped, not fatal. */
function readSnapshot(entry: unknown): RunSnapshot | undefined {
    if (!isRecord(entry) || !isCharacterId(entry.character)) return undefined;
    const elapsedMs = readNumber(entry.elapsedMs);
    const level = readNumber(entry.level);
    if (elapsedMs === undefined || level === undefined || level < 1) return undefined;
    const stats = isRecord(entry.stats) ? entry.stats : {};
    const statValues = {} as Stats;
    for (const id of STAT_IDS) {
        const value = readNumber(stats[id]);
        if (value === undefined) return undefined;
        statValues[id] = value;
    }
    const armor: Partial<Record<ArmorSlotId, ArmorPieceId>> = {};
    for (const piece of Object.values(isRecord(entry.armor) ? entry.armor : {})) {
        if (isKeyOf(ARMOR_PIECES, piece)) armor[ARMOR_PIECES[piece].slot] = piece;
    }
    const passivesIn = isRecord(entry.passives) ? entry.passives : {};
    const passives: Partial<Record<PassiveId, number>> = {};
    for (const id of PASSIVE_IDS) {
        const rank = readNumber(passivesIn[id]);
        if (rank !== undefined) passives[id] = Math.min(rank, PASSIVES[id].maxRank);
    }
    const buffsIn = isRecord(entry.buffs) ? entry.buffs : {};
    const buffs: Partial<Record<BuffId, number>> = {};
    for (const [id, ms] of Object.entries(buffsIn)) {
        const left = readNumber(ms);
        if (isKeyOf(BUFFS, id) && left !== undefined && left > 0) buffs[id] = left;
    }
    return {
        savedAt: readNumber(entry.savedAt) ?? 0,
        map: isKeyOf(MAPS_DATA, entry.map) ? entry.map : DEFAULT_MAP,
        character: entry.character,
        elapsedMs,
        level,
        xp: readNumber(entry.xp) ?? 0,
        pendingLevelUps: readNumber(entry.pendingLevelUps) ?? 0,
        chestCards: readNumber(entry.chestCards) ?? 0,
        stats: statValues,
        hp: readNumber(entry.hp) ?? 1,
        kills: readNumber(entry.kills) ?? 0,
        weapon: isKeyOf(MELEE_WEAPONS, entry.weapon) ? entry.weapon : undefined,
        spell: isKeyOf(SPELLS, entry.spell) ? entry.spell : undefined,
        armor,
        passives,
        buffs,
        bosses: Array.isArray(entry.bosses) ? entry.bosses.filter((id): id is EnemyId => isKeyOf(ENEMIES, id)) : [],
        finalBossDead: entry.finalBossDead === true,
        portalMsLeft: readNumber(entry.portalMsLeft),
        potionsDrunk: readNumber(entry.potionsDrunk) ?? 0,
        metrics: readMetrics(entry.metrics),
    };
}

function readMetrics(value: unknown): RunMetricsState | undefined {
    if (!isRecord(value)) return undefined;
    const bosses: BossReport[] = [];
    for (const boss of Array.isArray(value.bosses) ? value.bosses : []) {
        if (!isRecord(boss) || typeof boss.name !== 'string') continue;
        bosses.push({ name: boss.name, spawnMs: readNumber(boss.spawnMs) ?? 0, killMs: readNumber(boss.killMs) ?? -1, maxHit: readNumber(boss.maxHit) ?? 0 });
    }
    return {
        cards: readCounts(value.cards),
        levelByMinute: Array.isArray(value.levelByMinute) ? value.levelByMinute.filter((n): n is number => readNumber(n) !== undefined) : [],
        damageBy: readCounts(value.damageBy),
        minHpPct: readNumber(value.minHpPct) ?? 100,
        bosses,
    };
}

/** { name: number } with only the entries that are numbers. */
function readCounts(value: unknown): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [key, count] of Object.entries(isRecord(value) ? value : {})) {
        const n = readNumber(count);
        if (n !== undefined) counts[key] = n;
    }
    return counts;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function isKeyOf<T extends object>(table: T, value: unknown): value is keyof T & string {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(table, value);
}

export function readNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export const saveStore = new SaveStoreImpl();
