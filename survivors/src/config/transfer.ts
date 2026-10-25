// Código de traspaso (Fase 27½): pasar la partida de un dispositivo a otro sin cuentas.
// El dispositivo viejo sube su partida al servidor (metrics-server/, el mismo de las métricas) y recibe un código corto;
// en el nuevo se escribe el código y la partida baja y sustituye a la que hubiera. El código caduca y sirve una sola vez.
// El servidor importa este archivo, así que el juego y el servidor usan siempre las mismas reglas.

/** Address of the transfer endpoints (same Cloudflare Worker as the metrics). */
export const TRANSFER_URL = 'https://helbreath-survivors-metrics.nicolasraviolo.workers.dev/transfer';

/** Characters a code can use: no O/0, I/1/L, so it reads and types without mistakes. */
export const TRANSFER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Letters in a code (31^6 ≈ 887 million codes), shown as two halves: "K7P-29X". */
export const TRANSFER_CODE_LENGTH = 6;
/** A code stops working this long after it was made. */
export const TRANSFER_TTL_MS = 24 * 60 * 60 * 1000;
/** Biggest save the server accepts. A real save is a few KB; this leaves plenty of room. */
export const TRANSFER_MAX_BYTES = 256 * 1024;
/** Version of the package below. Change it if its shape changes. */
export const TRANSFER_FORMAT = 1;

/**
 * Browser storage keys that travel with the save: characters, runs, gold, warehouse, maps, unlocks and achievements.
 * Settings (volume, controls) stay on each device.
 */
export const TRANSFER_KEYS = [
    'hb-survivors.characters',
    'hb-survivors.runs',
    'hb-survivors.gold',
    'hb-survivors.warehouse',
    'hb-survivors.maps',
    'hb-survivors.unlocks',
    'hb-survivors.achievements',
] as const;
export type TransferKey = (typeof TRANSFER_KEYS)[number];

/** What travels: the raw stored text of each key the device has. */
export interface TransferPackage {
    format: number;
    /** GAME_VERSION of the device that made the code (only informative). */
    game: string;
    data: Partial<Record<TransferKey, string>>;
}

/** Answer of POST /transfer. */
export interface TransferCreated {
    code: string;
    expiresAt: number;
}

/** "k7p 29x", "K7P-29X"… → "K7P29X", or undefined if it can't be a code. */
export function normalizeTransferCode(input: string): string | undefined {
    const code = input.toUpperCase().replace(/[\s-]/g, '');
    if (code.length !== TRANSFER_CODE_LENGTH) return undefined;
    return [...code].every((c) => TRANSFER_CODE_ALPHABET.includes(c)) ? code : undefined;
}

/** "K7P29X" → "K7P-29X". */
export function formatTransferCode(code: string): string {
    const half = Math.ceil(code.length / 2);
    return `${code.slice(0, half)}-${code.slice(half)}`;
}

/** The package checked piece by piece (anyone can call the server), or undefined if something does not fit. */
export function readTransferPackage(value: unknown): TransferPackage | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const p = value as Record<string, unknown>;
    if (p.format !== TRANSFER_FORMAT || typeof p.game !== 'string' || p.game.length > 40) return undefined;
    if (typeof p.data !== 'object' || p.data === null || Array.isArray(p.data)) return undefined;
    const data: Partial<Record<TransferKey, string>> = {};
    for (const [key, text] of Object.entries(p.data as Record<string, unknown>)) {
        if (!(TRANSFER_KEYS as readonly string[]).includes(key) || typeof text !== 'string') return undefined;
        data[key as TransferKey] = text;
    }
    if (Object.keys(data).length === 0) return undefined;
    return { format: p.format, game: p.game, data };
}

// --- Solo el juego (27½B) ---

/** The game gives up on the server after this long and says it can't reach it. */
export const TRANSFER_TIMEOUT_MS = 10000;
/** Before a code replaces the save, the old one is kept here (not under TRANSFER_KEYS, so it never travels). */
export const TRANSFER_BACKUP_KEY = 'hb-survivors.transfer-backup';
/** After loading a save, the page reloads this long after "Done!" so the player can read it. */
export const TRANSFER_RELOAD_DELAY_MS = 1200;
/** URL parameters kept when the page reloads after loading a save (?app=1 = installed app); debug ones are dropped. */
export const TRANSFER_RELOAD_KEEP_PARAMS = ['app'] as const;
