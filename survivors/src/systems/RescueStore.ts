// NPCs rescatados en este dispositivo (Fase 29A), en su propia clave: valen para los 4 personajes, como el baúl y los
// mapas ganados. Todas las cuentas empiezan sin nadie rescatado (propietario, 27-oct-2026), también las antiguas.
// Lleva número de versión como los demás guardados. Si el navegador no deja guardar, dura hasta cerrar la página.
// Va en el código de traspaso (config/transfer.ts → TRANSFER_KEYS).
import { DEBUG_START } from '../config/debugStart';
import { RESCUABLE_NPCS } from '../data/rescues';
import { isNpcId, type NpcId } from '../data/town';
import { isRecord } from './SaveStore';

export const RESCUES_STORAGE_KEY = 'hb-survivors.rescues';
/** 1 (Fase 29A): the first one. */
const RESCUES_VERSION = 1;

class RescueStoreImpl {
    private readonly rescued = new Set<NpcId>(load());

    constructor() {
        // ?rescued=all|reset|howard,tom (development only; debugStart.ts).
        const debug = DEBUG_START.rescued;
        if (debug === 'reset') this.rescued.clear();
        else if (debug === 'all') for (const id of RESCUABLE_NPCS) this.rescued.add(id);
        else if (debug) for (const id of debug) this.rescued.add(id);
        if (debug) this.write();
    }

    /** True if this NPC is in town: rescued, or one that never needs it (William). */
    public isInTown(id: NpcId): boolean {
        return !RESCUABLE_NPCS.includes(id) || this.rescued.has(id);
    }

    /** Freed from its Guard. True the first time. */
    public rescue(id: NpcId): boolean {
        if (this.rescued.has(id)) return false;
        this.rescued.add(id);
        this.write();
        return true;
    }

    private write(): void {
        try {
            localStorage.setItem(RESCUES_STORAGE_KEY, JSON.stringify({ version: RESCUES_VERSION, rescued: [...this.rescued] }));
        } catch {
            // Storage blocked or full: it lasts until the page is closed.
        }
    }
}

function load(): NpcId[] {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(RESCUES_STORAGE_KEY) ?? 'null');
        // A newer version (an older copy of the game cached on the phone) is read as it is: only ids we know.
        if (!isRecord(data) || !Array.isArray(data.rescued)) return [];
        return data.rescued.filter((id): id is NpcId => typeof id === 'string' && isNpcId(id));
    } catch {
        return [];
    }
}

export const rescueStore = new RescueStoreImpl();
