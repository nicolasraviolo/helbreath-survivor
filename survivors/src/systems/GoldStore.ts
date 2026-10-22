// Oro del dispositivo (Fase 24A; data/gold.ts): uno para los 4 personajes, como el baúl y las mejoras permanentes, en su
// propia clave. Nunca se pierde al morir. La tienda (24B) y el herrero (24C) lo gastan con spend().
// Lleva número de versión como los demás guardados. Si el navegador no deja guardar, dura hasta cerrar la página.
import { DEBUG_START } from '../config/debugStart';
import { isRecord } from './SaveStore';

const STORAGE_KEY = 'hb-survivors.gold';
/** 1 (Fase 24A): the first one. */
const GOLD_VERSION = 1;

class GoldStoreImpl {
    private amount = load();

    constructor() {
        // ?gold=50000 (development only; debugStart.ts).
        if (DEBUG_START.gold !== undefined) {
            this.amount = DEBUG_START.gold;
            this.write();
        }
    }

    public get total(): number {
        return this.amount;
    }

    /** Adds what a run (or a sale) gave. */
    public add(amount: number): void {
        if (!(amount > 0)) return;
        this.amount += Math.floor(amount);
        this.write();
    }

    /** Takes `amount` away if there is enough; false (and nothing changes) if not. */
    public spend(amount: number): boolean {
        if (amount < 0 || amount > this.amount) return false;
        this.amount -= Math.floor(amount);
        this.write();
        return true;
    }

    private write(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: GOLD_VERSION, gold: this.amount }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function load(): number {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return 0;
        const data: unknown = JSON.parse(raw);
        // Any version is read as it is (a newer one comes from an older copy cached on the phone).
        if (!isRecord(data) || typeof data.gold !== 'number' || !Number.isFinite(data.gold)) return 0;
        return Math.max(0, Math.floor(data.gold));
    } catch {
        return 0;
    }
}

export const goldStore = new GoldStoreImpl();
