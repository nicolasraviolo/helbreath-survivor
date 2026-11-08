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
// Fase Off-5B (versión 6): también el almacén (`warehouse`, hasta OFF_STORE.warehouseSize objetos) y comprar y vender
// en la tienda y el herrero. Los guardados anteriores empiezan con el almacén vacío.
// Fase Off-6A (versión 7): también las magias aprendidas (`spells`, en la pestaña Magic de la tienda) y qué tecla
// 1–8 lanza cada una (`spellKeys`). Al aprender una magia va sola a la primera tecla libre. Los guardados anteriores
// empiezan sin magias.
// Fase Off-6C (versión 8): también las 4 magias del mando (`padSpells`, RT + A/B/X/Y), elegidas en el libro. Al aprender
// una va también al primer botón libre. Los guardados anteriores ponen ahí las de las teclas 1–4.
// Fase Off-7E (versión 10): también dónde está (`where`: mapa y casilla), para volver a aparecer ahí al darle a Play,
// como el original al reconectar. Se guarda al llegar a un mapa, cada OFF_WHERE_SAVE_MS andando, al salir y al
// esconder la página; muerto, se guarda su ciudad. Los guardados anteriores aparecen en su ciudad, como antes.
// Fase Off-8A (versión 11): también las cargas del Critical Strike (`critCharges`); sin ellas (personaje nuevo o
// guardado anterior), llenas.
// Fase Off-8B (versión 12): también el mercenario contratado (`mercenary`); sin él, ninguno.
// Select Character (8-nov-2026): hasta OFF_CHARACTER_SLOT_COUNT personajes, uno por hueco y cada uno en su clave: el hueco
// 1 sigue en `hb-off.character` (el personaje de antes no se pierde) y los demás en `hb-off.character.2` … `.4`. El
// hueco con el que se juega va en `hb-off.slot`; `character` y todo lo demás trabajan siempre con ese.
// Lleva número de versión como los guardados de Survivors. Si el navegador no deja guardar, dura hasta cerrar la página.
// Va en el código de traspaso (config/transfer.ts → TRANSFER_KEYS).
// Desarrollo: ?offreset borra los personajes de todos los huecos (Play vuelve a crear uno); ?offlevel=N pone al personaje al principio del
// nivel N, ya creado; ?offgear=longSword,leatherArmor le pone esos objetos; ?offgold=N le da ese oro;
// ?offbag=shortSword,redPotion le llena la bolsa con eso; ?offwarehouse=cape,redPotion llena el almacén; ?offfaction=aresden|elvine|none le pone ese bando; ?offspells=all|magicMissile,heal le enseña esas magias (en las teclas 1–8 y en RT + A/B/X/Y, por orden) (debugStart.ts).
import { DEBUG_START } from '../../config/debugStart';
import type { CharacterLook } from '../../data/appearance';
import { CHARACTER_NAME_MAX_LENGTH } from '../../data/characterSlots';
import { cleanName, readLook } from '../../systems/CharacterStore';
import { isRecord } from '../../systems/SaveStore';
import { OFF_CREATION, OFF_OLD_SAVE_STATS, OFF_STAT_IDS, OFF_STAT_MAX, type OffStats } from '../data/offCharacter';
import {
    isOffGearKey, OFF_START_EQUIPMENT, readOffBagKey, readOffGearKey, offBagKeyId, offGearDef, offHandsClash, offTwoHanded, offWearCheck, readOffEquipment, type OffBagItemId, type OffBagItemKey, type OffEquipment,
    type OffGearKey, type OffSlotId,
} from '../data/offItems';
import { isOffPotion } from '../data/offGoods';
import { OFF_LOOT } from '../data/offLoot';
import { OFF_STORE, offPrice, offSellPrice } from '../data/offStore';
import { OFF_LEVEL, offExpForLevel, offLevelForExp } from '../data/offLevel';
import { OFF_NOVICE_LOOK } from '../data/offWorld';
import { isOffMercenaryId, type OffMercenaryId } from '../data/offMercenary';
import { isOffFaction, isOffPlaceId, type OffFaction, type OffPlaceId } from '../data/offPlaces';
import {
    isOffSpellId, OFF_PAD_SPELL_COUNT, OFF_SPELL_IDS, OFF_SPELL_KEY_COUNT, OFF_SPELLS, type OffLearnResult, type OffPadSpells, type OffSpellId, type OffSpellKeys,
} from '../data/offSpells';

export const OFF_CHARACTER_STORAGE_KEY = 'hb-off.character';
/** Which slot is played (Select Character, 8-nov-2026). */
export const OFF_SLOT_STORAGE_KEY = 'hb-off.slot';
/** Four slots, as the original's Select Character. */
export const OFF_CHARACTER_SLOT_COUNT = 4;

/** Storage key of each slot: the first one keeps the key of the single character there was before. */
export function offCharacterStorageKey(slot: number): string {
    return slot === 0 ? OFF_CHARACTER_STORAGE_KEY : `${OFF_CHARACTER_STORAGE_KEY}.${slot + 1}`;
}

/** Every key the slots use (for the transfer code). */
export const OFF_SLOT_STORAGE_KEYS = Array.from({ length: OFF_CHARACTER_SLOT_COUNT }, (_, i) => offCharacterStorageKey(i));
/** 1 (Off-2B): experience and unspent points. 2 (Off-3A): name, look, stats and whether it was created. 3 (Off-3C): equipment. 4 (Off-4A): gold and bag. 5 (Off-5A): faction. 6 (Off-5B): warehouse. 7 (Off-6A): spells and spell keys. 8 (Off-6C): gamepad spells. 9 (Off-7B): gear may carry its attributes ("longSword:sharp"; plain ids read as before). 10 (Off-7E): where it is. 11 (Off-8A): Critical Strike charges. */
const OFF_CHARACTER_VERSION = 12;

/** Off-7E: where the character was last seen; no tile = the place's usual arrival. */
export interface OffWhere {
    place: OffPlaceId;
    x?: number;
    y?: number;
}

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
    bag: OffBagItemKey[];
    /** Aresden or Elvine, for ever (Off-5A); undefined until a portal of Traveler Zone is taken. */
    faction: OffFaction | undefined;
    /** What the city's warehouse keeps (Off-5B; at most OFF_STORE.warehouseSize), shared by both cities. */
    warehouse: OffBagItemKey[];
    /** Spells learned, in the order they were learned (Off-6A). */
    spells: OffSpellId[];
    /** Which spell each key 1–8 casts (Off-6A; always OFF_SPELL_KEY_COUNT long, undefined = none). */
    spellKeys: OffSpellKeys;
    /** Which spell RT + A, B, X, Y casts (Off-6C; always OFF_PAD_SPELL_COUNT long, undefined = none). */
    padSpells: OffPadSpells;
    /** Off-7E: where Play puts it back; undefined = its city (or Traveler Zone with no faction). */
    where: OffWhere | undefined;
    /** Off-8A: Critical Strike charges left; undefined = full (a new character, or a save from before). */
    critCharges: number | undefined;
    /** Off-8B: the mercenary hired (one at a time); undefined = none. */
    mercenary: OffMercenaryId | undefined;
}

/** What a bag or equipment change gave: done, nothing to do, short of STR or level, no room, too many potions. */
export type OffEquipResult = 'ok' | 'none' | 'str' | 'level' | 'bagFull' | 'potionLimit';

/** What buying, selling or using the warehouse gave (Off-5B). */
export type OffTradeResult = 'ok' | 'none' | 'gold' | 'bagFull' | 'potionLimit' | 'warehouseFull';

/** The character before anyone creates one (also what ?offreset leaves). */
function blankCharacter(): OffSavedCharacter {
    return { created: false, name: OFF_CREATION.defaultName, look: { ...OFF_NOVICE_LOOK }, stats: { ...OFF_OLD_SAVE_STATS }, exp: 0, points: 0, equipment: { ...OFF_START_EQUIPMENT }, gold: 0, bag: [], faction: undefined, warehouse: [], spells: [], spellKeys: noSpellKeys(), padSpells: noPadSpells(), where: undefined, critCharges: undefined, mercenary: undefined };
}

function noSpellKeys(): OffSpellKeys {
    return Array.from({ length: OFF_SPELL_KEY_COUNT }, () => undefined);
}

function noPadSpells(): OffPadSpells {
    return Array.from({ length: OFF_PAD_SPELL_COUNT }, () => undefined);
}

class OffSaveStoreImpl {
    private slotIndex = loadSlot();
    private data: OffSavedCharacter = load(this.slotIndex);

    constructor() {
        if (DEBUG_START.offReset) {
            for (let i = 0; i < OFF_CHARACTER_SLOT_COUNT; i++) removeKey(offCharacterStorageKey(i));
            this.slotIndex = 0;
            writeSlot(0);
            this.data = blankCharacter();
        }
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
        const gear = DEBUG_START.offGear.map(readOffGearKey).filter((key) => key !== undefined);
        // Off-6B: `noweapon` leaves the hands empty (spells need them).
        const noWeapon = DEBUG_START.offGear.includes('noweapon');
        if (gear.length > 0 || noWeapon) {
            const equipment = { ...this.data.equipment };
            for (const key of gear) {
                // Off-7E: the later one wins when a two-handed weapon and a shield clash.
                const clash = offHandsClash(equipment, key);
                if (clash) delete equipment[clash];
                equipment[offGearDef(key).slot] = key;
            }
            if (noWeapon) delete equipment.weapon;
            this.data = { ...this.data, equipment };
        }
        if (DEBUG_START.offGold !== undefined) this.data = { ...this.data, gold: DEBUG_START.offGold };
        const bag = DEBUG_START.offBag.map(readOffBagKey).filter((key) => key !== undefined).slice(0, OFF_LOOT.bagSize);
        if (bag.length > 0) this.data = { ...this.data, bag };
        const faction = DEBUG_START.offFaction;
        // Off-7E: a faction given by hand starts at home, not where the last test left it.
        if (faction !== undefined) this.data = { ...this.data, faction: faction === 'none' ? undefined : faction, where: undefined };
        const warehouse = DEBUG_START.offWarehouse.map(readOffBagKey).filter((key) => key !== undefined).slice(0, OFF_STORE.warehouseSize);
        if (warehouse.length > 0) this.data = { ...this.data, warehouse };
        const spells = DEBUG_START.offSpells === 'all' ? [...OFF_SPELL_IDS] : DEBUG_START.offSpells.filter(isOffSpellId);
        if (spells.length > 0) {
            const spellKeys = noSpellKeys().map((_, i) => spells[i]);
            const padSpells = noPadSpells().map((_, i) => spells[i]);
            this.data = { ...this.data, spells, spellKeys, padSpells };
        }
        // Off-8B: ?offmerc starts with the Warrior hired.
        if (DEBUG_START.offMerc) this.data = { ...this.data, mercenary: 'warrior' };
        if (DEBUG_START.offMerc || spells.length > 0 || DEBUG_START.offReset || level !== undefined || gear.length > 0 || statsChanged || DEBUG_START.offGold !== undefined || bag.length > 0 || faction !== undefined || warehouse.length > 0) this.write();
    }

    public get character(): Readonly<OffSavedCharacter> {
        return this.data;
    }

    public get level(): number {
        return offLevelForExp(this.data.exp);
    }

    /** The slot being played. */
    public get slot(): number {
        return this.slotIndex;
    }

    /** The character created in that slot (undefined = empty), for Select Character. */
    public peek(slot: number): Readonly<OffSavedCharacter> | undefined {
        const c = slot === this.slotIndex ? this.data : load(slot);
        return c.created ? c : undefined;
    }

    /** True when any slot has a character. */
    public get hasAny(): boolean {
        return Array.from({ length: OFF_CHARACTER_SLOT_COUNT }, (_, i) => i).some((i) => this.peek(i) !== undefined);
    }

    /** First empty slot, or -1 when all four are in use. */
    public get firstFree(): number {
        for (let i = 0; i < OFF_CHARACTER_SLOT_COUNT; i++) if (!this.peek(i)) return i;
        return -1;
    }

    /** Plays with the character in that slot from now on (Select Character). */
    public select(slot: number): void {
        if (slot < 0 || slot >= OFF_CHARACTER_SLOT_COUNT || slot === this.slotIndex) return;
        this.slotIndex = slot;
        this.data = load(slot);
        writeSlot(slot);
    }

    /** Deletes the character in that slot for ever (Select Character, after Yes). */
    public remove(slot: number): void {
        if (slot < 0 || slot >= OFF_CHARACTER_SLOT_COUNT) return;
        removeKey(offCharacterStorageKey(slot));
        if (slot === this.slotIndex) this.data = blankCharacter();
    }

    /** Creation screen done: a new character at level 1, in that slot (default: the one being played), which becomes the one played. */
    public create(name: string, look: CharacterLook, stats: OffStats, slot: number = this.slotIndex): void {
        this.select(slot);
        this.data = { created: true, name, look: { ...look }, stats: { ...stats }, exp: 0, points: 0, equipment: { ...OFF_START_EQUIPMENT }, gold: 0, bag: [], faction: undefined, warehouse: [], spells: [], spellKeys: noSpellKeys(), padSpells: noPadSpells(), where: undefined, critCharges: undefined, mercenary: undefined };
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
        return this.equipFromBagTaking(index).result;
    }

    /** Same as equipFromBag, also saying which gear came off the other hand (Off-7E: two hands and a shield). */
    public equipFromBagTaking(index: number): { result: OffEquipResult; tookOff?: OffGearKey } {
        const id = this.data.bag[index];
        const clash = id !== undefined && isOffGearKey(id) ? offHandsClash(this.data.equipment, id) : undefined;
        const tookOff = clash ? this.data.equipment[clash] : undefined;
        const result = this.equipFromBagRaw(index);
        return result === 'ok' && tookOff ? { result, tookOff } : { result };
    }

    private equipFromBagRaw(index: number): OffEquipResult {
        const id = this.data.bag[index];
        if (id === undefined || !isOffGearKey(id)) return 'none';
        const item = offGearDef(id);
        const check = offWearCheck(id, { str: this.data.stats.str, level: this.level });
        if (check !== 'ok') return check;
        const worn = this.data.equipment[item.slot];
        // Off-7E: a two-handed weapon and a shield don't go together: the other one goes back to the bag, if it fits.
        const clash = offHandsClash(this.data.equipment, id);
        const clashing = clash ? this.data.equipment[clash] : undefined;
        if (clashing && worn && this.data.bag.length >= OFF_LOOT.bagSize) return 'bagFull';
        const bag = [...this.data.bag];
        if (worn) bag[index] = worn;
        else bag.splice(index, 1);
        const equipment = { ...this.data.equipment, [item.slot]: id };
        if (clash && clashing) {
            delete equipment[clash];
            bag.push(clashing);
        }
        this.data = { ...this.data, equipment, bag };
        this.write();
        return 'ok';
    }

    /** Takes off what that slot holds, into the bag (Off-4B; the weapon too since Off-6A). 'bagFull' if there is no room. */
    public unequip(slot: OffSlotId): OffEquipResult {
        const worn = this.data.equipment[slot];
        if (!worn) return 'none';
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
    public equip(slot: OffSlotId, id: OffGearKey | undefined): OffEquipResult {
        if (id === undefined) return this.unequip(slot);
        if (offGearDef(id).slot !== slot) return 'none';
        return this.equipFromBag(this.data.bag.indexOf(id));
    }

    /** Takes an item out of the bag (drunk or dropped, Off-4B). Undefined if the cell is empty. */
    public takeFromBag(index: number): OffBagItemKey | undefined {
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
    public addToBag(id: OffBagItemKey): OffEquipResult {
        const room = this.roomFor(id);
        if (room === 'bagFull' || room === 'potionLimit') return room;
        this.data = { ...this.data, bag: [...this.data.bag, id] };
        this.write();
        return 'ok';
    }

    /** Whether one more of that fits in the bag: 'ok', 'bagFull' or 'potionLimit'. */
    public roomFor(id: OffBagItemKey): OffTradeResult {
        if (this.data.bag.length >= OFF_LOOT.bagSize) return 'bagFull';
        if (isOffPotion(id) && this.potionCount >= OFF_LOOT.potionLimit) return 'potionLimit';
        return 'ok';
    }

    /** Buys one at its Item.cfg price, into the bag (Off-5B). Nothing changes without the gold or the room. */
    public buy(id: OffBagItemId): OffTradeResult {
        const price = offPrice(id);
        if (this.data.gold < price) return 'gold';
        const room = this.roomFor(id);
        if (room !== 'ok') return room;
        this.data = { ...this.data, gold: this.data.gold - price, bag: [...this.data.bag, id] };
        this.write();
        return 'ok';
    }

    /** Sells what that bag cell holds for half its price (Off-5B). The gold it gave, or undefined if the cell is empty. */
    public sell(index: number): number | undefined {
        const id = this.data.bag[index];
        if (id === undefined) return undefined;
        const price = offSellPrice(offBagKeyId(id));
        const bag = [...this.data.bag];
        bag.splice(index, 1);
        this.data = { ...this.data, gold: this.data.gold + price, bag };
        this.write();
        return price;
    }

    /** That bag cell into the warehouse, at its end (Off-5B). */
    public store(index: number): OffTradeResult {
        const id = this.data.bag[index];
        if (id === undefined) return 'none';
        if (this.data.warehouse.length >= OFF_STORE.warehouseSize) return 'warehouseFull';
        const bag = [...this.data.bag];
        bag.splice(index, 1);
        this.data = { ...this.data, bag, warehouse: [...this.data.warehouse, id] };
        this.write();
        return 'ok';
    }

    /** That warehouse cell back into the bag (Off-5B); the potion limit counts, as when picking one up. */
    public takeFromWarehouse(index: number): OffTradeResult {
        const id = this.data.warehouse[index];
        if (id === undefined) return 'none';
        const room = this.roomFor(id);
        if (room !== 'ok') return room;
        const warehouse = [...this.data.warehouse];
        warehouse.splice(index, 1);
        this.data = { ...this.data, warehouse, bag: [...this.data.bag, id] };
        this.write();
        return 'ok';
    }

    public knowsSpell(id: OffSpellId): boolean {
        return this.data.spells.includes(id);
    }

    /** Whether that spell can be learned now: 'ok', or why not (already known, INT short, gold short). */
    public canLearn(id: OffSpellId): OffLearnResult {
        const spell = OFF_SPELLS[id];
        if (this.knowsSpell(id)) return 'known';
        if (this.data.stats.int < spell.reqInt) return 'int';
        if (this.data.gold < spell.price) return 'gold';
        return 'ok';
    }

    /** Learns a spell at the magic shop (Off-6A): pays its price and puts it on the first free key 1–8, if any. */
    public learnSpell(id: OffSpellId): OffLearnResult {
        const check = this.canLearn(id);
        if (check !== 'ok') return check;
        const spellKeys = [...this.data.spellKeys];
        const free = spellKeys.indexOf(undefined);
        if (free >= 0) spellKeys[free] = id;
        const padSpells = [...this.data.padSpells];
        const freeButton = padSpells.indexOf(undefined);
        if (freeButton >= 0) padSpells[freeButton] = id;
        this.data = { ...this.data, gold: this.data.gold - OFF_SPELLS[id].price, spells: [...this.data.spells, id], spellKeys, padSpells };
        this.write();
        return 'ok';
    }

    /**
     * Puts a known spell on a key 1–8 (spell book, Off-6A); undefined empties the key. A spell is on one key at most:
     * if it was on another one, that key empties.
     */
    public setSpellKey(index: number, id: OffSpellId | undefined): void {
        if (index < 0 || index >= OFF_SPELL_KEY_COUNT || (id !== undefined && !this.knowsSpell(id))) return;
        const spellKeys = this.data.spellKeys.map((k) => (k === id ? undefined : k));
        spellKeys[index] = id;
        this.data = { ...this.data, spellKeys };
        this.write();
    }

    /** Puts a known spell on RT + A/B/X/Y (spell book, Off-6C); undefined empties it. One button per spell at most. */
    public setPadSpell(index: number, id: OffSpellId | undefined): void {
        if (index < 0 || index >= OFF_PAD_SPELL_COUNT || (id !== undefined && !this.knowsSpell(id))) return;
        const padSpells = this.data.padSpells.map((k) => (k === id ? undefined : k));
        padSpells[index] = id;
        this.data = { ...this.data, padSpells };
        this.write();
    }

    /**
     * Off-7E: remembers where it is (written only when it changed). A tile out of the map's numbers is not
     * checked here: the world puts it on the nearest free tile when it comes back.
     */
    public setWhere(where: OffWhere): void {
        const old = this.data.where;
        if (old && old.place === where.place && old.x === where.x && old.y === where.y) return;
        this.data = { ...this.data, where: { ...where } };
        this.write();
    }

    /** Off-8A: the Critical Strike charges left (written only when they changed). */
    public setCritCharges(charges: number): void {
        if (this.data.critCharges === charges) return;
        this.data = { ...this.data, critCharges: charges };
        this.write();
    }

    /** Off-8B: hires a mercenary for `price` gold (it replaces the one there was). False without the gold. */
    public hireMercenary(id: OffMercenaryId, price: number): boolean {
        if (this.data.gold < price) return false;
        this.data = { ...this.data, gold: this.data.gold - price, mercenary: id };
        this.write();
        return true;
    }

    /** Off-8B: the mercenary leaves (nothing is paid back). */
    public dismissMercenary(): void {
        if (this.data.mercenary === undefined) return;
        this.data = { ...this.data, mercenary: undefined };
        this.write();
    }

    /** Joins a city for ever (Off-5A). Nothing changes once the character has one. */
    public joinFaction(faction: OffFaction): void {
        if (this.data.faction !== undefined) return;
        this.data = { ...this.data, faction };
        this.write();
    }

    private write(): void {
        try {
            localStorage.setItem(offCharacterStorageKey(this.slotIndex), JSON.stringify({ version: OFF_CHARACTER_VERSION, ...this.data }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function loadSlot(): number {
    try {
        const n = Number(localStorage.getItem(OFF_SLOT_STORAGE_KEY));
        return Number.isInteger(n) && n >= 0 && n < OFF_CHARACTER_SLOT_COUNT ? n : 0;
    } catch {
        return 0;
    }
}

function writeSlot(slot: number): void {
    try {
        localStorage.setItem(OFF_SLOT_STORAGE_KEY, String(slot));
    } catch {
        // Storage blocked: it lasts until the page is closed.
    }
}

function removeKey(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // Storage blocked: nothing was kept anyway.
    }
}

function load(slot: number): OffSavedCharacter {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(offCharacterStorageKey(slot)) ?? 'null');
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
            ...tidyHands(readOffEquipment(data.equipment), readBag(data.bag), readBag(data.warehouse, OFF_STORE.warehouseSize)),
            gold: nonNegative(data.gold),
            faction: isOffFaction(data.faction) ? data.faction : undefined,
            ...readSpells(data.spells, data.spellKeys, data.padSpells),
            where: readWhere(data.where),
            critCharges: typeof data.critCharges === 'number' ? nonNegative(data.critCharges) : undefined,
            mercenary: isOffMercenaryId(data.mercenary) ? data.mercenary : undefined,
        };
    } catch {
        return blankCharacter();
    }
}

/**
 * Off-7E: saves from before the two-hands rule may hold a two-handed weapon and a shield. The shield goes to the bag
 * (or, if full, to the warehouse); with no room anywhere it stays on.
 */
function tidyHands(equipment: OffEquipment, bag: OffBagItemKey[], warehouse: OffBagItemKey[]): { equipment: OffEquipment; bag: OffBagItemKey[]; warehouse: OffBagItemKey[] } {
    const shield = equipment.shield;
    if (!shield || !equipment.weapon || !offTwoHanded(equipment.weapon)) return { equipment, bag, warehouse };
    const rest = { ...equipment };
    delete rest.shield;
    if (bag.length < OFF_LOOT.bagSize) return { equipment: rest, bag: [...bag, shield], warehouse };
    if (warehouse.length < OFF_STORE.warehouseSize) return { equipment: rest, bag, warehouse: [...warehouse, shield] };
    return { equipment, bag, warehouse };
}

/** Off-7E: where it was, read back; anything odd = undefined (its city). */
function readWhere(value: unknown): OffWhere | undefined {
    if (!isRecord(value) || !isOffPlaceId(value.place)) return undefined;
    const { x, y } = value;
    if (typeof x === 'number' && typeof y === 'number' && Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0) return { place: value.place, x, y };
    return { place: value.place };
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

/** The bag (or the warehouse) read back from a save: unknown items are dropped. */
function readBag(value: unknown, size: number = OFF_LOOT.bagSize): OffBagItemKey[] {
    if (!Array.isArray(value)) return [];
    const keys: OffBagItemKey[] = [];
    for (const text of value) {
        const key = typeof text === 'string' ? readOffBagKey(text) : undefined;
        if (key) keys.push(key);
    }
    return keys.slice(0, size);
}

/** Spells and keys read back from a save: unknown spells, repeats and keys of spells not learned are dropped. */
function readSpells(spellsValue: unknown, keysValue: unknown, padValue: unknown): { spells: OffSpellId[]; spellKeys: OffSpellKeys; padSpells: OffPadSpells } {
    const spells = Array.isArray(spellsValue) ? [...new Set(spellsValue.filter(isOffSpellId))] : [];
    const spellKeys = noSpellKeys();
    if (Array.isArray(keysValue)) {
        for (let i = 0; i < OFF_SPELL_KEY_COUNT; i++) {
            const id: unknown = keysValue[i];
            if (isOffSpellId(id) && spells.includes(id) && !spellKeys.includes(id)) spellKeys[i] = id;
        }
    }
    // Before version 8 there were no gamepad spells: those of keys 1–4.
    const padSource: unknown[] = Array.isArray(padValue) ? padValue : spellKeys.slice(0, OFF_PAD_SPELL_COUNT);
    const padSpells = noPadSpells();
    for (let i = 0; i < OFF_PAD_SPELL_COUNT; i++) {
        const id = padSource[i];
        if (isOffSpellId(id) && spells.includes(id) && !padSpells.includes(id)) padSpells[i] = id;
    }
    return { spells, spellKeys, padSpells };
}

function nonNegative(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export const offSaveStore = new OffSaveStoreImpl();
