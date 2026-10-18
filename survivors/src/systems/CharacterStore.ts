// Personajes guardados en el navegador (Fase 17A): los 4 huecos de "Select Character", en su propia clave,
// aparte de las partidas guardadas (SaveStore) y de los logros. Cada personaje tiene un id que no cambia (uid):
// las partidas guardadas lo recuerdan, y así un hueco borrado y vuelto a llenar no hereda el récord de otro.
// Lleva número de versión, como SaveStore: si un día cambia la forma de guardar, se sube y migrate() convierte lo viejo.
// Si el navegador no deja guardar (modo privado), los personajes duran hasta cerrar la página.
import { DEBUG_START } from '../config/debugStart';
import { CHARACTER_NAME_ALLOWED, CHARACTER_NAME_MAX_LENGTH, CHARACTER_SLOT_COUNT } from '../data/characterSlots';
import { CHARACTERS, isCharacterId, type CharacterId } from '../data/characters';
import { isRecord, readNumber, saveStore, type RunSnapshot } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.characters';
/** Raise it (and teach migrate() the old shape) whenever SavedCharacter changes in a way old data can't be read as. */
const CHARACTERS_VERSION = 1;

/** Registry key (game.registry) with the uid of the character that plays the next run. */
export const ACTIVE_CHARACTER_KEY = 'activeCharacter';

export interface SavedCharacter {
    /** Never changes, never reused (see the header). */
    uid: string;
    name: string;
    classId: CharacterId;
    /** Highest level reached in any run. */
    bestLevel: number;
    createdAt: number;
}

type Slots = Array<SavedCharacter | undefined>;

class CharacterStoreImpl {
    private slots: Slots = load();

    constructor() {
        // Debug ?characters=reset / demo (debugStart.ts, development only). Their runs go too.
        if (DEBUG_START.characters) saveStore.replaceAll([]);
        if (DEBUG_START.characters === 'reset') this.slots = emptySlots();
        if (DEBUG_START.characters === 'demo') {
            this.slots = emptySlots();
            this.create(0, 'Kaila', 'mage');
            this.create(1, 'Gorn', 'warrior');
            this.recordLevel(this.slots[1]?.uid, 17);
        }
        if (DEBUG_START.characters) this.write();
    }

    /** One entry per slot (undefined = free). */
    public get all(): ReadonlyArray<Readonly<SavedCharacter> | undefined> {
        return this.slots;
    }

    public get(slot: number): Readonly<SavedCharacter> | undefined {
        return this.slots[slot];
    }

    public byUid(uid: string | undefined): Readonly<SavedCharacter> | undefined {
        return uid === undefined ? undefined : this.slots.find((c) => c?.uid === uid);
    }

    /** First free slot, or -1 if all are in use. */
    public get firstFree(): number {
        return this.slots.indexOf(undefined);
    }

    /** Slot of that character, or -1. */
    public slotOf(uid: string | undefined): number {
        return uid === undefined ? -1 : this.slots.findIndex((c) => c?.uid === uid);
    }

    /** New character in that slot (any old run left there is dropped: it belonged to nobody). */
    public create(slot: number, name: string, classId: CharacterId, bestLevel = 1): SavedCharacter {
        const now = Date.now();
        const character: SavedCharacter = {
            uid: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            name: cleanName(name) || CHARACTERS[classId].name,
            classId,
            bestLevel,
            createdAt: now,
        };
        this.slots[slot] = character;
        this.write();
        saveStore.clear(slot);
        return character;
    }

    /** Deletes the character and its run in progress. */
    public delete(slot: number): void {
        if (this.slots[slot] === undefined) return;
        this.slots[slot] = undefined;
        this.write();
        saveStore.clear(slot);
    }

    /**
     * Puts every saved run in its character's slot (one run per character, Fase 17A). Runs of nobody (saved before
     * Fase 17A, or debug runs without a character) become a new character named after the class, in a free slot;
     * if there is no free slot left, they are dropped. Called once when the game loads.
     */
    public linkRuns(): void {
        const placed: Array<RunSnapshot | undefined> = Array.from({ length: CHARACTER_SLOT_COUNT }, () => undefined);
        const orphans: RunSnapshot[] = [];
        // Newest first: if a character somehow has two runs, the newest one stays.
        const runs = saveStore.all.filter((run): run is RunSnapshot => run !== undefined).sort((a, b) => b.savedAt - a.savedAt);
        for (const run of runs) {
            const slot = this.slotOf(run.characterUid);
            if (slot >= 0 && !placed[slot]) placed[slot] = run;
            else if (slot < 0) orphans.push(run);
        }
        for (const run of orphans) {
            const free = this.slots.findIndex((c, i) => c === undefined && !placed[i]);
            if (free < 0) break;
            const character = this.create(free, '', run.character, run.level);
            placed[free] = { ...run, characterUid: character.uid };
        }
        const unchanged = placed.every((run, i) => run === saveStore.get(i));
        if (!unchanged) saveStore.replaceAll(placed);
    }

    /** Keeps the level if it is the character's best. Cheap when it isn't: it can be called every frame. */
    public recordLevel(uid: string | undefined, level: number): void {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character || level <= character.bestLevel) return;
        character.bestLevel = level;
        this.write();
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CHARACTERS_VERSION, slots: this.slots.map((c) => c ?? null) }));
        } catch {
            // Storage blocked or full: they last until the page is closed.
        }
    }
}

/** Only allowed characters, cut to the maximum length. */
export function cleanName(name: string): string {
    return [...name].filter((ch) => CHARACTER_NAME_ALLOWED.test(ch)).join('').slice(0, CHARACTER_NAME_MAX_LENGTH);
}

function emptySlots(): Slots {
    return Array.from({ length: CHARACTER_SLOT_COUNT }, () => undefined);
}

function load(): Slots {
    const slots = emptySlots();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return slots;
        migrate(JSON.parse(raw)).forEach((entry, i) => {
            if (i < CHARACTER_SLOT_COUNT) slots[i] = readCharacter(entry);
        });
    } catch {
        // Unreadable: as if there were no characters.
    }
    return slots;
}

/** Old shapes → today's list of slots. Version 1 is the first one: nothing to convert yet. */
function migrate(data: unknown): unknown[] {
    if (!isRecord(data) || !Array.isArray(data.slots)) return [];
    if (data.version === CHARACTERS_VERSION) return data.slots;
    // Saved by a newer version of the game (an older copy cached on the phone): leave it alone.
    return [];
}

function readCharacter(entry: unknown): SavedCharacter | undefined {
    if (!isRecord(entry) || typeof entry.uid !== 'string' || typeof entry.name !== 'string' || !isCharacterId(entry.classId)) return undefined;
    return {
        uid: entry.uid,
        name: cleanName(entry.name) || CHARACTERS[entry.classId].name,
        classId: entry.classId,
        bestLevel: Math.max(1, Math.floor(readNumber(entry.bestLevel) ?? 1)),
        createdAt: readNumber(entry.createdAt) ?? 0,
    };
}

export const characterStore = new CharacterStoreImpl();
characterStore.linkRuns();
