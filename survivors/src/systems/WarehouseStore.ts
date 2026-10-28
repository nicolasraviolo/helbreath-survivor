// Baúl compartido en el navegador (Fase 21D; data/warehouse.ts), en su propia clave, aparte de los personajes.
// Lleva número de versión como los demás guardados. Si el navegador no deja guardar, dura hasta cerrar la página.
// Mover un objeto pasa por CharacterStore (takeFromInventory / addToInventory) para que nunca se duplique ni se pierda.
import { DEBUG_START } from '../config/debugStart';
import type { OwnedItem } from '../data/loot';
import { WAREHOUSE_CAPACITY, WAREHOUSE_DEMO_ITEMS } from '../data/warehouse';
import { characterStore } from './CharacterStore';
import { isRecord, readOwnedItems } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.warehouse';
/** 1 (Fase 21D): the first one. */
const WAREHOUSE_VERSION = 1;

class WarehouseStoreImpl {
    private items: OwnedItem[] = load();

    constructor() {
        // ?characters=reset / demo (development only): the warehouse starts again too (demo: with a few items).
        if (DEBUG_START.characters) {
            this.items = DEBUG_START.characters === 'demo' ? WAREHOUSE_DEMO_ITEMS.map((item) => ({ ...item })) : [];
            this.write();
        }
    }

    public get all(): readonly Readonly<OwnedItem>[] {
        return this.items;
    }

    public get isFull(): boolean {
        return this.items.length >= WAREHOUSE_CAPACITY;
    }

    /** From the character's inventory (the item at that place) into the warehouse. False if full or missing. */
    public deposit(uid: string | undefined, inventoryIndex: number): boolean {
        if (this.isFull) return false;
        const item = characterStore.takeFromInventory(uid, inventoryIndex);
        if (!item) return false;
        this.items.push(item);
        this.write();
        return true;
    }

    /** Straight into the warehouse (Fase 30B: another class's unique, picked up in a run). False if full. */
    public add(item: Readonly<OwnedItem>): boolean {
        if (this.isFull) return false;
        this.items.push({ ...item });
        this.write();
        return true;
    }

    /** From the warehouse (the item at that place) into the character's inventory. False without that character. */
    public withdraw(uid: string | undefined, index: number): boolean {
        const item = this.items[index];
        if (!item || !characterStore.addToInventory(uid, item)) return false;
        this.items.splice(index, 1);
        this.write();
        return true;
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: WAREHOUSE_VERSION, items: this.items }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function load(): OwnedItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data: unknown = JSON.parse(raw);
        // A newer version (an older copy of the game cached on the phone) is read as it is: items are only { id, attribute }.
        if (!isRecord(data)) return [];
        return readOwnedItems(data.items);
    } catch {
        return [];
    }
}

export const warehouseStore = new WarehouseStoreImpl();
