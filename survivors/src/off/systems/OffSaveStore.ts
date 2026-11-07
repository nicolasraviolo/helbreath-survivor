// Helbreath Off (Fase Off-2B): el personaje de Off guardado en su propia clave (`hb-off.character`): experiencia total
// (el nivel sale de ella, off/data/offLevel.ts) y puntos sin repartir (se reparten en la ventana Character, Off-3B).
// Fase Off-3A (versión 2): también nombre, aspecto y stats, y si ya se ha creado. Sin personaje creado, Play lleva a la
// pantalla de crear (OffCreateScene). Un guardado de la versión 1 se queda con su experiencia, 12 en cada stat, el
// nombre por defecto y el aspecto del novato, y cuenta como creado.
// Fase Off-3C (versión 3): también lo que lleva puesto (`equipment`, off/data/offItems.ts). Los guardados anteriores
// empiezan con la Dagger y nada más.
// Fase Off-4A (versión 4): también el oro y la bolsa (`bag`, hasta 50 objetos: equipo, pociones, Slime Jelly). Los
// guardados anteriores empiezan sin oro y con la bolsa vacía.
// Fase Off-4B (misma versión): equipar sale de la bolsa y lo que te quitas vuelve a ella (en la misma casilla si es un
// cambio); beber y tirar sacan el objeto de la bolsa; como mucho OFF_LOOT.potionLimit pociones al recoger.
// Fase Off-5A (versión 5): también el bando (`faction`), elegido una vez y para siempre en un portal de Traveler Zone.
// Los guardados anteriores empiezan sin bando.
// Lleva número de versión como los guardados de Survivors. Si el navegador no deja guardar, dura hasta cerrar la página.
// Va en el código de traspaso (config/transfer.ts → TRANSFER_KEYS).
// Desarrollo: ?offreset borra el personaje (Play vuelve a crear uno); ?offlevel=N pone al personaje al principio del
// nivel N, ya creado; ?offgear=longSword,leatherArmor le pone esos objetos; ?offgold=N le da ese oro;
// ?offbag=shortSword,redPotion le llena la bolsa con eso; ?offfaction=aresden|elvine|none le pone ese bando (debugStart.ts).
import { DEBUG_START } from '../../config/debugStart';
import type { CharacterLook } from '../../data/appearance';
import { CHARACTER_NAME_MAX_LENGTH } from '../../data/characterSlots';
import { cleanName, readLook } from '../../systems/CharacterStore';
import { isRecord } from '../../systems/SaveStore';
import { OFF_CREATION, OFF_OLD_SAVE_STATS, OFF_STAT_IDS, OFF_STAT_MAX, type OffStats } from '../data/offCharacter';
import {
    isOffBagItemId, isOffItemId, OFF_ITEMS, OFF_START_EQUIPMENT, readOffEquipment, type OffBagItemId, type OffEquipment, type OffItemId, type OffSlotId,
} from '../data/offItems';
import { isOffPotion } from '../data/offGoods';
import { OFF_LOOT } from '../data/offLoot';
import { OFF_LEVEL, offExpForLevel, offLevelForExp } from '../data/offLevel';
import { OFF_NOVICE_LOOK } from '../data/offWorld';
import { isOffFaction, type OffFaction } from '../data/offPlaces';

export const OFF_CHARACTER_STORAGE_KEY = 'hb-off.character';
/** 1 (Off-2B): experience and unspent points. 2 (Off-3A): name, look, stats and whether it was created. 3 (Off-3C): equipment. 4 (Off-4A): gold and bag. 5 (Off-5A): faction. */
const OFF_CHARACTER_VERSION = 5;

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
    /** What it wears (Off-3C). */
    equipment: OffEquipment;
    /** Gold carried (Off-4A). */
    gold: number;
    /** What the bag holds, in the order it came in (Off-4A; at most OFF_LOOT.bagSize). */
    bag: OffBagItemId[];
    /** Aresden or Elvine, for ever (Off-5A); undefined until a portal of Traveler Zone is taken. */
    faction: OffFaction | undefined;
}

/** What a bag or equipment change gave: done, nothing to do, short of STR, no room, too many potions. */
export type OffEquipResult = 'ok' | 'none' | 'str' | 'bagFull' | 'potionLimit';

/** The character before anyone creates one (also what ?offreset leaves). */
function blankCharacter(): OffSavedCharacter {
    return { created: false, name: OFF_CREATION.defaultName, look: { ...OFF_NOVICE_LOOK }, stats: { ...OFF_OLD_SAVE_STATS }, exp: 0, points: 0, equipment: { ...OFF_START_EQUIPMENT }, gold: 0, bag: [], faction: undefined };
}

class OffSaveStoreImpl {
    private data: OffSavedCharacter = load();

    constructor() {
        if (DEBUG_START.offReset) this.data = blankCharacter();
        const level = DEBUG_START.offLevel;
        if (level !== undefined) this.data = { ...this.data, created: true, exp: offExpForLevel(level), points: (level - 1) * OFF_LEVEL.pointsPerLevel };
        const debugStats = { ...this.data.stats };
        let statsChanged = false;
        for (const id of OFF_STAT_IDS) {
            const n = DEBUG_START.offStats[id];
            if (n !== undefined) {
                debugStats[id] = Math.min(OFF_STAT_MAX, n);
                statsChanged = true;
            }
        }
        if (statsChanged) this.data = { ...this.data, stats: debugStats };
        const gear = DEBUG_START.offGear.filter(isOffItemId);
        if (gear.length > 0) {
            const equipment = { ...this.data.equipment };
            for (const id of gear) equipment[OFF_ITEMS[id].slot] = id;
            this.data = { ...this.data, equipment };
        }
        if (DEBUG_START.offGold !== undefined) this.data = { ...this.data, gold: DEBUG_START.offGold };
        const bag = DEBUG_START.offBag.filter(isOffBagItemId).slice(0, OFF_LOOT.bagSize);
        if (bag.length > 0) this.data = { ...this.data, bag };
        const faction = DEBUG_START.offFaction;
        if (faction !== undefined) this.data = { ...this.data, faction: faction === 'none' ? undefined : faction };
        if (DEBUG_START.offReset || level !== undefined || gear.length > 0 || statsChanged || DEBUG_START.offGold !== undefined || bag.length > 0 || faction !== undefined) this.write();
    }

    public get character(): Readonly<OffSavedCharacter> {
        return this.data;
    }

    public get level(): number {
        return offLevelForExp(this.data.exp);
    }

    /** Creation screen done: a new character at level 1. */
    public create(name: string, look: CharacterLook, stats: OffStats): void {
        this.data = { created: true, name, look: { ...look }, stats: { ...stats }, exp: 0, points: 0, equipment: { ...OFF_START_EQUIPMENT }, gold: 0, bag: [], faction: undefined };
        this.write();
    }

    /** Character window, Ok (Off-3B): points added to the stats, and the points still unspent. */
    public assignPoints(added: Readonly<OffStats>, pointsLeft: number): void {
        const stats = { ...this.data.stats };
        for (const id of OFF_STAT_IDS) stats[id] = Math.min(OFF_STAT_MAX, stats[id] + Math.max(0, added[id]));
        this.data = { ...this.data, stats, points: Math.max(0, pointsLeft) };
        this.write();
    }

    /**
     * Puts on the gear in that bag cell (Off-4B). What was worn in its slot takes the cell; with nothing worn, the cell
     * empties. 'str' (nothing changes) if the STR is short.
     */
    public equipFromBag(index: number): OffEquipResult {
        const id = this.data.bag[index];
        if (id === undefined || !isOffItemId(id)) return 'none';
        const item = OFF_ITEMS[id];
        if (item.strToEquip > this.data.stats.str) return 'str';
        const worn = this.data.equipment[item.slot];
        const bag = [...this.data.bag];
        if (worn) bag[index] = worn;
        else bag.splice(index, 1);
        this.data = { ...this.data, equipment: { ...this.data.equipment, [item.slot]: id }, bag };
        this.write();
        return 'ok';
    }

    /** Takes off what that slot holds, into the bag (Off-4B). Never the weapon; 'bagFull' if there is no room. */
    public unequip(slot: OffSlotId): OffEquipResult {
        const worn = this.data.equipment[slot];
        if (!worn || slot === 'weapon') return 'none';
        if (this.data.bag.length >= OFF_LOOT.bagSize) return 'bagFull';
        const equipment = { ...this.data.equipment };
        delete equipment[slot];
        this.data = { ...this.data, equipment, bag: [...this.data.bag, worn] };
        this.write();
        return 'ok';
    }

    /**
     * Equipment screen: puts on that item from the bag, or empties the slot (undefined). Same results as above; an item
     * that is not in the bag gives 'none'.
     */
    public equip(slot: OffSlotId, id: OffItemId | undefined): OffEquipResult {
        if (id === undefined) return this.unequip(slot);
        if (OFF_ITEMS[id].slot !== slot) return 'none';
        return this.equipFromBag(this.data.bag.indexOf(id));
    }

    /** Takes an item out of the bag (drunk or dropped, Off-4B). Undefined if the cell is empty. */
    public takeFromBag(index: number): OffBagItemId | undefined {
        const id = this.data.bag[index];
        if (id === undefined) return undefined;
        const bag = [...this.data.bag];
        bag.splice(index, 1);
        this.data = { ...this.data, bag };
        this.write();
        return id;
    }

    /** Potions carried now (of any kind). */
    public get potionCount(): number {
        return this.data.bag.filter(isOffPotion).length;
    }

    /** Experience and unspent points after a fight (the rest stays as it is). */
    public saveProgress(exp: number, points: number): void {
        this.data = { ...this.data, exp, points };
        this.write();
    }

    /** Gold picked up (Off-4A). */
    public addGold(amount: number): void {
        if (amount <= 0) return;
        this.data = { ...this.data, gold: this.data.gold + Math.floor(amount) };
        this.write();
    }

    /**
     * An item into the bag (Off-4A). Nothing changes if the bag is full ('bagFull') or it is a potion and the potion
     * limit is reached ('potionLimit', Off-4B).
     */
    public addToBag(id: OffBagItemId): OffEquipResult {
        if (this.data.bag.length >= OFF_LOOT.bagSize) return 'bagFull';
        if (isOffPotion(id) && this.potionCount >= OFF_LOOT.potionLimit) return 'potionLimit';
        this.data = { ...this.data, bag: [...this.data.bag, id] };
        this.write();
        return 'ok';
    }

    /** Joins a city for ever (Off-5A). Nothing changes once the character has one. */
    public joinFaction(faction: OffFaction): void {
        if (this.data.faction !== undefined) return;
        this.data = { ...this.data, faction };
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
            equipment: readOffEquipment(data.equipment),
            gold: nonNegative(data.gold),
            bag: readBag(data.bag),
            faction: isOffFaction(data.faction) ? data.faction : undefined,
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

/** The bag read back from a save: unknown items are dropped. */
function readBag(value: unknown): OffBagItemId[] {
    if (!Array.isArray(value)) return [];
    return value.filter((id): id is OffBagItemId => typeof id === 'string' && isOffBagItemId(id)).slice(0, OFF_LOOT.bagSize);
}

function nonNegative(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export const offSaveStore = new OffSaveStoreImpl();
