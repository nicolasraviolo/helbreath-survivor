// Personajes guardados en el navegador (Fase 17A): los 4 huecos de "Select Character", en su propia clave,
// aparte de las partidas guardadas (SaveStore) y de los logros. Cada personaje tiene un id que no cambia (uid):
// las partidas guardadas lo recuerdan, y así un hueco borrado y vuelto a llenar no hereda el récord de otro.
// Lleva número de versión, como SaveStore: si un día cambia la forma de guardar, se sube y migrate() convierte lo viejo.
// Si el navegador no deja guardar (modo privado), los personajes duran hasta cerrar la página.
// Desde la Fase 20A cada personaje tiene Level permanente, EXP y los puntos de stat que ha repartido (data/characterLevel.ts).
// Desde la Fase 20B, además, su equipo (data/items.ts), que se pone en la pantalla Equipment y lleva a cada partida.
// Desde la Fase 21A, su inventario: lo que trae de la bolsa de cada partida y lo que el botín equipado le quitó.
// Desde la Fase 21B, el atributo (Sharp, Poison, Ancient) de lo que lleva puesto.
// Fase 21D, "solo lo que tienes": todo se pone sacándolo del inventario y vuelve a él al quitárselo, salvo el equipo de
// salida y los hechizos que se saben con la Int (isFreeItem). Al terminar una partida, finishRun aplica las reglas al
// morir (sin Zem se pierde lo encontrado). El baúl compartido (WarehouseStore) mueve objetos del inventario y al revés.
import { DEBUG_START } from '../config/debugStart';
import { CHARACTER_NAME_ALLOWED, CHARACTER_NAME_MAX_LENGTH, CHARACTER_SLOT_COUNT } from '../data/characterSlots';
import { BODY_SPRITES, DEFAULT_LOOKS, GENDERS, HAIR_COLORS, HAIR_STYLE_COUNT, UNDERWEAR_COUNT, type CharacterLook } from '../data/appearance';
import { CHARACTER_LEVEL_MAX, expToNextCharacterLevel, STAT_POINT_CAP, STAT_POINTS_PER_LEVEL, totalExpForLevel } from '../data/characterLevel';
import { CHARACTERS, isCharacterId, type CharacterId } from '../data/characters';
import { isItemAttribute, type ItemAttribute } from '../data/attributes';
import {
    canChangeSlot, canHaveAttribute, canEmptySlot, canEquip, classCanWear, EQUIP_SLOT_IDS, isFreeItem, isItemId, itemInfo, readEquipment, START_EQUIPMENT,
    type EquipSlotId, type ItemId, type SavedEquipment,
} from '../data/items';
import { STAT_IDS, type StatId, type Stats } from '../data/stats';
import type { OwnedItem } from '../data/loot';
import type { RunLootState } from './RunLoot';
import { isRecord, readAttribute, readNumber, readOwnedItems, saveStore, type RunSnapshot } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.characters';
/** Raise it (and teach migrate() the old shape) whenever SavedCharacter changes in a way old data can't be read as. */
/** 2 (Fase 17B): every character has a look. Version 1 characters get the look of their class until then. */
/** 3 (Fase 20A): Level, EXP and stat points; bestLevel renamed bestPower. Older characters start at Level 1. */
/** 4 (Fase 20B): equipment. Older characters get their class's starting equipment. */
/** 5 (Fase 21A): inventory. Older characters start with it empty. */
/** 6 (Fase 21B): attributes of the gear worn. Older characters wear everything without one. */
/** 7 (Fase 21D): the Zem slot. Older characters have it empty; what they wear stays theirs. */
const CHARACTERS_VERSION = 7;

/** Registry key (game.registry) with the uid of the character that plays the next run. */
export const ACTIVE_CHARACTER_KEY = 'activeCharacter';

export interface SavedCharacter {
    /** Never changes, never reused (see the header). */
    uid: string;
    name: string;
    classId: CharacterId;
    /** Gender, skin, hair and underwear chosen in Create New Character (Fase 17B). */
    look: CharacterLook;
    /** Highest Power reached in any run (it was called bestLevel before Fase 20A). */
    bestPower: number;
    /** Permanent Level (Fase 20A), 1 to CHARACTER_LEVEL_MAX. */
    level: number;
    /** EXP gathered towards the next Level. */
    exp: number;
    /** Points earned and not assigned yet. */
    unspentPoints: number;
    /** Points assigned to each stat, on top of the class's start stats. They can never be taken back. */
    statPoints: Stats;
    /** What the character wears into every run (Fase 20B). */
    equipment: SavedEquipment;
    /** Attribute of the item worn in each slot, if it has one (Fase 21B; only weapons and wands). */
    attributes: Partial<Record<EquipSlotId, ItemAttribute>>;
    /** Items kept from the runs (Fase 21A): the bag, and the gear that found items replaced. */
    inventory: OwnedItem[];
    createdAt: number;
}

/** What one run's EXP did to the character (shown on the end screen). */
export interface ExpResult {
    gained: number;
    levelBefore: number;
    level: number;
    /** EXP gathered towards the next Level, and how much that Level needs (0 at the maximum). */
    exp: number;
    expToNext: number;
    unspentPoints: number;
}

/** What happened to a finished run's loot (Fase 21D, end screen). */
export interface RunLootResult {
    /** Items found in the run (bag, put on, card not chosen). */
    found: number;
    /**
     * Died without a Zem (Fase 24A): the items lost, half of them rounded up (the same objects as in the run's loot,
     * so the end screen can dim them). Empty otherwise.
     */
    lost: OwnedItem[];
    /** Died with a Zem, which saved everything and was used up. */
    zemUsed: boolean;
}

/** Items lost when dying without a Zem (Fase 24A, owner 21-oct-2026): half, always against the player (3 → 2, 5 → 3). */
export function itemsLostOnDeath(found: number): number {
    return Math.ceil(found / 2);
}

type Slots = Array<SavedCharacter | undefined>;

/** A copy of `items` in random order. */
function shuffled<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
}

/** Level of the example Mage of ?characters=demo (development only). */
const DEMO_MAGE_LEVEL = 25;

class CharacterStoreImpl {
    private slots: Slots = load();

    constructor() {
        // Debug ?characters=reset / demo (debugStart.ts, development only). Their runs go too.
        if (DEBUG_START.characters) saveStore.replaceAll([]);
        if (DEBUG_START.characters === 'reset') this.slots = emptySlots();
        if (DEBUG_START.characters === 'demo') {
            this.slots = emptySlots();
            this.create(0, 'Kaila', 'mage', { gender: 'female', skin: 1, hairStyle: 4, hairColor: 2, underwear: 3 });
            this.create(1, 'Gorn', 'warrior', { gender: 'male', skin: 2, hairStyle: 2, hairColor: 0, underwear: 5 });
            this.recordPower(this.slots[1]?.uid, 17);
            this.addExp(this.slots[1]?.uid, 60000);
            // Kaila (Fase 20D): Level 25 with every point in Int (86), enough for Mass Fire Strike but not Meteor Strike.
            const kaila = this.slots[0]?.uid;
            this.addExp(kaila, totalExpForLevel(DEMO_MAGE_LEVEL));
            this.assignPoints(kaila, { int: this.byUid(kaila)?.unspentPoints ?? 0 });
            this.wearDebugGear();
        }
        if (DEBUG_START.characters) this.write();
    }

    /** ?gear=... (debugStart.ts): the examples wear those items, whatever they ask for (M17); "sharp:id" goes to the inventory. */
    private wearDebugGear(): void {
        for (const character of this.slots) {
            if (!character) continue;
            for (const entry of DEBUG_START.gear) {
                // "sharp:longSword": into the inventory with that attribute (Fase 21B); "inv:plateMail", without (21D).
                const [attribute, owned] = entry.split(':');
                if (owned !== undefined) {
                    // Items with no slot (the Xelima stone, Fase 24C) go in whatever the class.
                    if (!isItemId(owned) || (itemInfo(owned)?.slot !== undefined && !classCanWear(character.classId, owned))) continue;
                    if (attribute === 'inv') character.inventory.push({ id: owned });
                    else if (isItemAttribute(attribute) && canHaveAttribute(owned, attribute)) character.inventory.push({ id: owned, attribute });
                    continue;
                }
                const id = entry;
                if (!isItemId(id) || !classCanWear(character.classId, id)) continue;
                const slot = itemInfo(id)?.slot;
                if (slot) character.equipment[slot] = id;
            }
        }
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
    public create(slot: number, name: string, classId: CharacterId, look: CharacterLook = DEFAULT_LOOKS[classId], bestPower = 1): SavedCharacter {
        const now = Date.now();
        const character: SavedCharacter = {
            uid: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            name: cleanName(name) || CHARACTERS[classId].name,
            classId,
            look: { ...look },
            bestPower,
            level: 1,
            exp: 0,
            unspentPoints: 0,
            statPoints: noStatPoints(),
            equipment: { ...START_EQUIPMENT[classId] },
            attributes: {},
            inventory: [],
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
            const character = this.create(free, '', run.character, undefined, run.level);
            placed[free] = { ...run, characterUid: character.uid };
        }
        const unchanged = placed.every((run, i) => run === saveStore.get(i));
        if (!unchanged) saveStore.replaceAll(placed);
    }

    /** Keeps the Power if it is the character's best. Cheap when it isn't: it can be called every frame. */
    public recordPower(uid: string | undefined, power: number): void {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character || power <= character.bestPower) return;
        character.bestPower = power;
        this.write();
    }

    /** Adds a run's EXP: every Level reached gives STAT_POINTS_PER_LEVEL points. Undefined without that character. */
    public addExp(uid: string | undefined, amount: number): ExpResult | undefined {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character) return undefined;
        const levelBefore = character.level;
        const gained = Math.max(0, Math.floor(amount));
        character.exp += gained;
        while (character.level < CHARACTER_LEVEL_MAX && character.exp >= expToNextCharacterLevel(character.level)) {
            character.exp -= expToNextCharacterLevel(character.level);
            character.level++;
            character.unspentPoints += STAT_POINTS_PER_LEVEL;
        }
        if (character.level >= CHARACTER_LEVEL_MAX) character.exp = 0;
        this.write();
        return {
            gained,
            levelBefore,
            level: character.level,
            exp: character.exp,
            expToNext: expToNextCharacterLevel(character.level),
            unspentPoints: character.unspentPoints,
        };
    }

    /**
     * Assigns points for good (Confirm in the Character window). Refused (false, nothing changes) if they are more
     * than the unspent ones or any stat would pass STAT_POINT_CAP.
     */
    public assignPoints(uid: string | undefined, points: Partial<Stats>): boolean {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character) return false;
        const entries = STAT_IDS.map((id): [StatId, number] => [id, Math.max(0, Math.floor(points[id] ?? 0))]);
        const total = entries.reduce((sum, [, n]) => sum + n, 0);
        if (total === 0 || total > character.unspentPoints) return false;
        const start = CHARACTERS[character.classId].startStats;
        if (entries.some(([id, n]) => start[id] + character.statPoints[id] + n > STAT_POINT_CAP)) return false;
        for (const [id, n] of entries) character.statPoints[id] += n;
        character.unspentPoints -= total;
        this.write();
        return true;
    }

    /**
     * Puts an item on (or empties the slot with undefined). Refused (false, nothing changes) if the class can't change
     * that slot, the item doesn't go there, the permanent stats and Level don't meet its requirement or (Fase 21D) the
     * character doesn't have it: it comes out of the inventory, unless it is a free item (isFreeItem).
     */
    public equip(uid: string | undefined, slot: EquipSlotId, id: ItemId | undefined, attribute?: ItemAttribute): boolean {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character || !canChangeSlot(character.classId, slot)) return false;
        if (id === undefined) {
            if (!canEmptySlot(slot)) return false;
            this.takeOff(character, slot);
            delete character.equipment[slot];
        } else {
            if (itemInfo(id)?.slot !== slot || !classCanWear(character.classId, id) || !canEquip(id, permanentStats(character), character.level)) return false;
            if (character.equipment[slot] === id && character.attributes[slot] === attribute) return true;
            const free = !attribute && isFreeItem(character.classId, id);
            const owned = free ? -1 : character.inventory.findIndex((item) => item.id === id && item.attribute === attribute);
            if (!free && owned < 0) return false;
            this.takeOff(character, slot);
            if (owned >= 0) character.inventory.splice(owned, 1);
            character.equipment[slot] = id;
            if (attribute) character.attributes[slot] = attribute;
        }
        this.write();
        return true;
    }

    /** What the character wears in that slot, with its attribute. */
    public worn(uid: string | undefined, slot: EquipSlotId): OwnedItem | undefined {
        const character = this.byUid(uid);
        return character ? wornItem(character, slot) : undefined;
    }

    /** The items of the inventory the character could put in that slot, one entry per kind, with how many (Fase 21D). */
    public ownedFor(uid: string | undefined, slot: EquipSlotId): Array<{ item: OwnedItem; count: number }> {
        const character = this.byUid(uid);
        const entries: Array<{ item: OwnedItem; count: number }> = [];
        if (!character) return entries;
        for (const item of character.inventory) {
            if (itemInfo(item.id)?.slot !== slot || !classCanWear(character.classId, item.id)) continue;
            const entry = entries.find((e) => e.item.id === item.id && e.item.attribute === item.attribute);
            if (entry) entry.count++;
            else entries.push({ item: { ...item }, count: 1 });
        }
        return entries;
    }

    /** Before something else goes in the slot: what it wore goes back to the inventory (free items just vanish). */
    private takeOff(character: SavedCharacter, slot: EquipSlotId): void {
        const worn = wornItem(character, slot);
        if (worn && (worn.attribute || !isFreeItem(character.classId, worn.id))) character.inventory.push(worn);
        delete character.attributes[slot];
    }

    /**
     * A finished run's loot (Fase 21A; rules at death, Fase 21D and 24A). Won, or died with a Zem (used up only if
     * something was found): everything is kept. Died without a Zem: half of what was found (rounded up) is lost, at
     * random; the gear it set out with never is. What is kept: the found items put on replace what the character wears in
     * that slot (which goes to the inventory), and the rest goes to the inventory.
     */
    public finishRun(uid: string | undefined, loot: Readonly<RunLootState>, won: boolean): RunLootResult | undefined {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character) return undefined;
        let equipped = Object.entries(loot.equipped) as Array<[EquipSlotId, OwnedItem]>;
        let rest = [...loot.bag, ...loot.pending];
        const found = equipped.length + rest.length;
        const result: RunLootResult = { found, lost: [], zemUsed: false };
        if (found === 0) return result;
        if (!won) {
            if (character.equipment.zem === undefined) {
                const all = [...equipped.map(([, item]) => item), ...rest];
                result.lost = shuffled(all).slice(0, itemsLostOnDeath(found));
                equipped = equipped.filter(([, item]) => !result.lost.includes(item));
                rest = rest.filter((item) => !result.lost.includes(item));
            } else {
                delete character.equipment.zem;
                result.zemUsed = true;
            }
        }
        for (const [slot, item] of equipped) {
            if (!classCanWear(character.classId, item.id) || itemInfo(item.id)?.slot !== slot) {
                character.inventory.push(item);
                continue;
            }
            this.takeOff(character, slot);
            character.equipment[slot] = item.id;
            if (item.attribute) character.attributes[slot] = item.attribute;
        }
        character.inventory.push(...rest);
        this.write();
        return result;
    }

    /** Takes the item at that place of the inventory out of it (to the warehouse, Fase 21D). */
    public takeFromInventory(uid: string | undefined, index: number): OwnedItem | undefined {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        const item = character?.inventory[index];
        if (!character || !item) return undefined;
        character.inventory.splice(index, 1);
        this.write();
        return item;
    }

    /** Puts an item in the inventory (from the warehouse, Fase 21D). False without that character. */
    public addToInventory(uid: string | undefined, item: OwnedItem): boolean {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character) return false;
        character.inventory.push({ ...item });
        this.write();
        return true;
    }

    /** How many of that item the character keeps in its inventory (without an attribute, unless one is given). */
    public ownedCount(uid: string | undefined, id: ItemId, attribute?: ItemAttribute): number {
        return this.byUid(uid)?.inventory.filter((item) => item.id === id && item.attribute === attribute).length ?? 0;
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

/**
 * Old shapes → today's list of slots. readCharacter() fills what old versions lack: the class's look (version 1),
 * Level 1 without points, bestLevel read as bestPower (versions 1 and 2), the starting equipment (versions 1–3), an
 * empty inventory (versions 1–4), gear without attributes (versions 1–5) and no Zem (versions 1–6).
 */
function migrate(data: unknown): unknown[] {
    if (!isRecord(data) || !Array.isArray(data.slots)) return [];
    if (data.version === CHARACTERS_VERSION || (typeof data.version === 'number' && data.version >= 1 && data.version < CHARACTERS_VERSION)) return data.slots;
    // Saved by a newer version of the game (an older copy cached on the phone): leave it alone.
    return [];
}

function readCharacter(entry: unknown): SavedCharacter | undefined {
    if (!isRecord(entry) || typeof entry.uid !== 'string' || typeof entry.name !== 'string' || !isCharacterId(entry.classId)) return undefined;
    const equipment = readEquipment(entry.equipment, entry.classId);
    return {
        uid: entry.uid,
        name: cleanName(entry.name) || CHARACTERS[entry.classId].name,
        classId: entry.classId,
        look: readLook(entry.look) ?? { ...DEFAULT_LOOKS[entry.classId] },
        bestPower: Math.max(1, Math.floor(readNumber(entry.bestPower) ?? readNumber(entry.bestLevel) ?? 1)),
        level: Math.min(CHARACTER_LEVEL_MAX, Math.max(1, Math.floor(readNumber(entry.level) ?? 1))),
        exp: Math.max(0, Math.floor(readNumber(entry.exp) ?? 0)),
        unspentPoints: Math.max(0, Math.floor(readNumber(entry.unspentPoints) ?? 0)),
        statPoints: readStatPoints(entry.statPoints),
        equipment,
        attributes: readWornAttributes(entry.attributes, equipment),
        inventory: readOwnedItems(entry.inventory),
        createdAt: readNumber(entry.createdAt) ?? 0,
    };
}

function noStatPoints(): Stats {
    return { str: 0, vit: 0, dex: 0, int: 0, mag: 0, chr: 0 };
}

/** Saved points per stat; anything missing or wrong counts as 0. */
function readStatPoints(value: unknown): Stats {
    const points = noStatPoints();
    if (!isRecord(value)) return points;
    for (const id of STAT_IDS) points[id] = Math.max(0, Math.floor(readNumber(value[id]) ?? 0));
    return points;
}

/** The character's permanent stats: the class's start stats plus the assigned points. */
export function permanentStats(character: Readonly<SavedCharacter>): Stats {
    const start = CHARACTERS[character.classId].startStats;
    const stats = noStatPoints();
    for (const id of STAT_IDS) stats[id] = start[id] + character.statPoints[id];
    return stats;
}

/** A saved look, or undefined if missing or out of range (then the class's look is used). */
function readLook(value: unknown): CharacterLook | undefined {
    if (!isRecord(value)) return undefined;
    const gender = GENDERS.find((g) => g === value.gender);
    const index = (raw: unknown, count: number) => {
        const n = readNumber(raw);
        return n !== undefined && Number.isInteger(n) && n >= 0 && n < count ? n : undefined;
    };
    const skin = index(value.skin, BODY_SPRITES.male.length);
    const hairStyle = index(value.hairStyle, HAIR_STYLE_COUNT);
    const hairColor = index(value.hairColor, HAIR_COLORS.length);
    const underwear = index(value.underwear, UNDERWEAR_COUNT);
    if (!gender || skin === undefined || hairStyle === undefined || hairColor === undefined || underwear === undefined) return undefined;
    return { gender, skin, hairStyle, hairColor, underwear };
}

export const characterStore = new CharacterStoreImpl();
characterStore.linkRuns();

/** What a character wears in that slot, with its attribute. */
export function wornItem(character: Readonly<SavedCharacter>, slot: EquipSlotId): OwnedItem | undefined {
    const id = character.equipment[slot];
    if (id === undefined) return undefined;
    const attribute = character.attributes[slot];
    return attribute ? { id, attribute } : { id };
}

/** Attributes of the gear worn, only where that item can have them. */
function readWornAttributes(value: unknown, equipment: Readonly<SavedEquipment>): Partial<Record<EquipSlotId, ItemAttribute>> {
    const attributes: Partial<Record<EquipSlotId, ItemAttribute>> = {};
    if (!isRecord(value)) return attributes;
    for (const slot of EQUIP_SLOT_IDS) {
        const id = equipment[slot];
        const attribute = id === undefined ? undefined : readAttribute(id, value[slot]);
        if (attribute) attributes[slot] = attribute;
    }
    return attributes;
}
