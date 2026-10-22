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
// Fase 24D: el "+" (+1/+2/+3) del arma o varita puesta, en `upgrades`; los del inventario lo llevan en el objeto.
// Personajes fijos (22-oct-2026): los huecos llevan siempre los de FIXED_CHARACTERS (Gorn y Kaila) y los demás quedan
// vacíos (bloqueados). Ya no se crean ni se borran personajes. Lo guardado antes de la versión 9 se tira (empezar de cero).
import { DEBUG_START } from '../config/debugStart';
import { CHARACTER_NAME_ALLOWED, CHARACTER_NAME_MAX_LENGTH, CHARACTER_SLOT_COUNT, FIXED_CHARACTERS } from '../data/characterSlots';
import { BODY_SPRITES, DEFAULT_LOOKS, GENDERS, HAIR_COLORS, HAIR_STYLE_COUNT, UNDERWEAR_COUNT, type CharacterLook } from '../data/appearance';
import { CHARACTER_LEVEL_MAX, expToNextCharacterLevel, STAT_POINT_CAP, STAT_POINTS_PER_LEVEL, totalExpForLevel } from '../data/characterLevel';
import { CHARACTERS, isCharacterId, type CharacterId } from '../data/characters';
import { isItemAttribute, type ItemAttribute } from '../data/attributes';
import {
    canChangeSlot, canHaveAttribute, canEmptySlot, canEquip, classCanWear, EQUIP_SLOT_IDS, isFreeItem, isItemId, itemInfo, readEquipment, START_EQUIPMENT,
    type EquipSlotId, type SavedEquipment,
} from '../data/items';
import { STAT_IDS, type StatId, type Stats } from '../data/stats';
import { XELIMA_STONE_ID } from '../data/consumables';
import { sameOwnedItem, type OwnedItem } from '../data/loot';
import { canUpgrade, readUpgrade, UPGRADE_MAX, UPGRADE_STONES_PER_LEVEL, upgradeOf } from '../data/upgrades';
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
/** 8 (Fase 24D): the "+" of the gear worn. Older characters wear everything at +0. */
/** 9 (22-oct-2026): fixed characters. Older saves are dropped, runs included: every account starts again with Gorn and Kaila. */
const CHARACTERS_VERSION = 9;

/** Registry key (game.registry) with the uid of the character that plays the next run. */
export const ACTIVE_CHARACTER_KEY = 'activeCharacter';

export interface SavedCharacter {
    /** Never changes, never reused (see the header). */
    uid: string;
    name: string;
    classId: CharacterId;
    /** Gender, skin, hair and underwear (Fase 17B; fixed for each character since 22-oct-2026). */
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
    /** "+" of the item worn in each slot, if it has one (Fase 24D; only weapons and wands). */
    upgrades: Partial<Record<EquipSlotId, number>>;
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
    private slots: Slots;

    constructor() {
        const loaded = load();
        this.slots = loaded.slots;
        // Saves older than the fixed characters: their runs go with them.
        if (loaded.dropped) saveStore.replaceAll([]);
        // Debug ?characters=reset / demo (debugStart.ts, development only). Their runs go too.
        if (DEBUG_START.characters) {
            saveStore.replaceAll([]);
            this.slots = emptySlots();
        }
        this.fillFixedCharacters();
        if (DEBUG_START.characters === 'demo') {
            const gorn = this.slots[0]?.uid;
            this.recordPower(gorn, 17);
            this.addExp(gorn, 60000);
            // Kaila (Fase 20D): Level 25 with every point in Int (86), enough for Mass Fire Strike but not Meteor Strike.
            const kaila = this.slots[1]?.uid;
            this.addExp(kaila, totalExpForLevel(DEMO_MAGE_LEVEL));
            this.assignPoints(kaila, { int: this.byUid(kaila)?.unspentPoints ?? 0 });
            this.wearDebugGear();
        }
        if (DEBUG_START.xelima !== undefined) this.setDebugStones(DEBUG_START.xelima);
        if (DEBUG_START.characters || DEBUG_START.xelima !== undefined) this.write();
    }

    /**
     * Every account has the fixed characters (data/characterSlots.ts) in their slots, with their names; the other slots
     * stay empty (locked). A missing one is created at Level 1. Writes only if something changed.
     */
    private fillFixedCharacters(): void {
        let changed = false;
        this.slots.forEach((character, slot) => {
            const fixed = FIXED_CHARACTERS[slot];
            if (!fixed) {
                if (character) this.slots[slot] = undefined;
                changed ||= character !== undefined;
            } else if (!character || character.classId !== fixed.classId) {
                this.slots[slot] = newCharacter(fixed.name, fixed.classId, fixed.look);
                saveStore.clear(slot);
                changed = true;
            } else if (character.name !== fixed.name) {
                character.name = fixed.name;
                changed = true;
            }
        });
        if (changed) this.write();
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
                    const upgrade = /^up([1-9])$/.exec(attribute ?? '')?.[1];
                    if (attribute === 'inv') character.inventory.push({ id: owned });
                    // "up3:longSword": into the inventory at +3 (Fase 24D).
                    else if (upgrade !== undefined && canUpgrade(owned)) character.inventory.push({ id: owned, upgrade: Math.min(UPGRADE_MAX, Number(upgrade)) });
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

    /** Slot of that character, or -1. */
    public slotOf(uid: string | undefined): number {
        return uid === undefined ? -1 : this.slots.findIndex((c) => c?.uid === uid);
    }

    /**
     * Puts every saved run in its character's slot (one run per character, Fase 17A). Runs of nobody are dropped (since
     * the fixed characters, 22-oct-2026, no character is made for them). Called once when the game loads.
     */
    public linkRuns(): void {
        const placed: Array<RunSnapshot | undefined> = Array.from({ length: CHARACTER_SLOT_COUNT }, () => undefined);
        // Newest first: if a character somehow has two runs, the newest one stays.
        const runs = saveStore.all.filter((run): run is RunSnapshot => run !== undefined).sort((a, b) => b.savedAt - a.savedAt);
        for (const run of runs) {
            const slot = this.slotOf(run.characterUid);
            if (slot >= 0 && !placed[slot]) placed[slot] = run;
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
    public equip(uid: string | undefined, slot: EquipSlotId, item: Readonly<OwnedItem> | undefined): boolean {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character || !canChangeSlot(character.classId, slot)) return false;
        if (item === undefined) {
            if (!canEmptySlot(slot)) return false;
            this.takeOff(character, slot);
            delete character.equipment[slot];
        } else {
            const id = item.id;
            if (itemInfo(id)?.slot !== slot || !classCanWear(character.classId, id) || !canEquip(id, permanentStats(character), character.level)) return false;
            const worn = wornItem(character, slot);
            if (worn && sameOwnedItem(worn, item)) return true;
            const free = isPlainFreeItem(character.classId, item);
            const owned = free ? -1 : character.inventory.findIndex((other) => sameOwnedItem(other, item));
            if (!free && owned < 0) return false;
            this.takeOff(character, slot);
            if (owned >= 0) character.inventory.splice(owned, 1);
            this.putOn(character, slot, item);
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
            const entry = entries.find((e) => sameOwnedItem(e.item, item));
            if (entry) entry.count++;
            else entries.push({ item: { ...item }, count: 1 });
        }
        return entries;
    }

    /**
     * Before something else goes in the slot: what it wore goes back to the inventory (free items just vanish, unless
     * they have an attribute or a "+": then they are a real item, Fase 24D).
     */
    private takeOff(character: SavedCharacter, slot: EquipSlotId): void {
        const worn = wornItem(character, slot);
        if (worn && !isPlainFreeItem(character.classId, worn)) character.inventory.push(worn);
        delete character.attributes[slot];
        delete character.upgrades[slot];
    }

    /** Wears that item in the slot, with its attribute and "+" (the slot must be empty: takeOff first). */
    private putOn(character: SavedCharacter, slot: EquipSlotId, item: Readonly<OwnedItem>): void {
        character.equipment[slot] = item.id;
        if (item.attribute) character.attributes[slot] = item.attribute;
        if (item.upgrade) character.upgrades[slot] = item.upgrade;
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
            this.putOn(character, slot, item);
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

    /** How many of that item (same attribute and "+") the character keeps in its inventory. */
    public ownedCount(uid: string | undefined, item: Readonly<OwnedItem>): number {
        return this.byUid(uid)?.inventory.filter((other) => sameOwnedItem(other, item)).length ?? 0;
    }

    /**
     * Raises the "+" of a weapon or wand by one (Fase 24D): the one worn in `target.slot`, or one of the inventory equal
     * to `target.item`. Takes the Stones of Xelima from the inventory; the gold is the caller's (GoldStore). Refused
     * (false, nothing changes) if the item isn't there, can't be upgraded, is at the top or the stones are missing.
     */
    public upgrade(uid: string | undefined, target: { slot: EquipSlotId } | { item: Readonly<OwnedItem> }): boolean {
        const character = this.slots.find((c) => c !== undefined && c.uid === uid);
        if (!character) return false;
        const stones = character.inventory.filter((item) => item.id === XELIMA_STONE_ID).length;
        if (stones < UPGRADE_STONES_PER_LEVEL) return false;
        if ('slot' in target) {
            const worn = wornItem(character, target.slot);
            if (!worn || !canUpgrade(worn.id) || upgradeOf(worn) >= UPGRADE_MAX) return false;
            character.upgrades[target.slot] = upgradeOf(worn) + 1;
        } else {
            const owned = character.inventory.find((item) => sameOwnedItem(item, target.item));
            if (!owned || !canUpgrade(owned.id) || upgradeOf(owned) >= UPGRADE_MAX) return false;
            owned.upgrade = upgradeOf(owned) + 1;
        }
        for (let i = 0; i < UPGRADE_STONES_PER_LEVEL; i++) {
            character.inventory.splice(character.inventory.findIndex((item) => item.id === XELIMA_STONE_ID), 1);
        }
        this.write();
        return true;
    }

    /** ?xelima=N (debugStart.ts, development only): every character keeps exactly N Stones of Xelima (Fase 24D). */
    private setDebugStones(count: number): void {
        for (const character of this.slots) {
            if (!character) continue;
            character.inventory = character.inventory.filter((item) => item.id !== XELIMA_STONE_ID);
            for (let i = 0; i < count; i++) character.inventory.push({ id: XELIMA_STONE_ID });
        }
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

/** A new character at Level 1 with the starting equipment of its class. */
function newCharacter(name: string, classId: CharacterId, look: CharacterLook): SavedCharacter {
    const now = Date.now();
    return {
        uid: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name: cleanName(name) || CHARACTERS[classId].name,
        classId,
        look: { ...look },
        bestPower: 1,
        level: 1,
        exp: 0,
        unspentPoints: 0,
        statPoints: noStatPoints(),
        equipment: { ...START_EQUIPMENT[classId] },
        attributes: {},
        upgrades: {},
        inventory: [],
        createdAt: now,
    };
}

/** The saved slots; `dropped` = there were characters from before the fixed ones (version < 9), now thrown away. */
function load(): { slots: Slots; dropped: boolean } {
    const slots = emptySlots();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { slots, dropped: false };
        const data: unknown = JSON.parse(raw);
        if (isRecord(data) && typeof data.version === 'number' && data.version < FIXED_CHARACTERS_VERSION) return { slots, dropped: true };
        migrate(data).forEach((entry, i) => {
            if (i < CHARACTER_SLOT_COUNT) slots[i] = readCharacter(entry);
        });
    } catch {
        // Unreadable: as if there were no characters.
    }
    return { slots, dropped: false };
}

/**
 * Old shapes → today's list of slots. readCharacter() fills what old versions lack: the class's look (version 1),
 * Level 1 without points, bestLevel read as bestPower (versions 1 and 2), the starting equipment (versions 1–3), an
 * empty inventory (versions 1–4), gear without attributes (versions 1–5), no Zem (versions 1–6) and gear at +0
 * (versions 1–7).
 */
/** First version with fixed characters: anything older is dropped (owner, 22-oct-2026: everyone starts again). */
const FIXED_CHARACTERS_VERSION = 9;

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
        upgrades: readWornUpgrades(entry.upgrades, equipment),
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

/** What a character wears in that slot, with its attribute and "+". */
export function wornItem(character: Readonly<SavedCharacter>, slot: EquipSlotId): OwnedItem | undefined {
    const id = character.equipment[slot];
    if (id === undefined) return undefined;
    const attribute = character.attributes[slot];
    const upgrade = character.upgrades[slot];
    return { id, ...(attribute ? { attribute } : {}), ...(upgrade ? { upgrade } : {}) };
}

/** A free item (starting gear, spells known with the Int) with no attribute and no "+": it never goes to the inventory. */
function isPlainFreeItem(classId: CharacterId, item: Readonly<OwnedItem>): boolean {
    return !item.attribute && !item.upgrade && isFreeItem(classId, item.id);
}

/** "+" of the gear worn, only where that item can have it (Fase 24D). */
function readWornUpgrades(value: unknown, equipment: Readonly<SavedEquipment>): Partial<Record<EquipSlotId, number>> {
    const upgrades: Partial<Record<EquipSlotId, number>> = {};
    if (!isRecord(value)) return upgrades;
    for (const slot of EQUIP_SLOT_IDS) {
        const id = equipment[slot];
        const upgrade = id === undefined ? undefined : readUpgrade(id, value[slot]);
        if (upgrade) upgrades[slot] = upgrade;
    }
    return upgrades;
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
