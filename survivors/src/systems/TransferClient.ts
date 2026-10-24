// Código de traspaso (Fase 27½B), la parte del juego que habla con el servidor: junta la partida de este dispositivo,
// la sube y recibe un código; o canjea un código y escribe la partida que baja (guardando antes la vieja por si acaso).
// Sin pantallas: la ventana está en scenes/TransferScene.ts. Reglas compartidas con el servidor en config/transfer.ts.
import { GAME_VERSION } from '../config/version';
import {
    TRANSFER_BACKUP_KEY,
    TRANSFER_FORMAT,
    TRANSFER_KEYS,
    TRANSFER_RELOAD_KEEP_PARAMS,
    TRANSFER_TIMEOUT_MS,
    TRANSFER_URL,
    readTransferPackage,
    type TransferCreated,
    type TransferPackage,
} from '../config/transfer';

/** Why something went wrong, so the screen can say it plainly. */
export type TransferError = 'offline' | 'notFound' | 'tooBig' | 'busy' | 'failed';

export type TransferResult<T> = { ok: true; value: T } | { ok: false; error: TransferError };

/** This device's save, or undefined if there is nothing saved yet. */
export function collectSave(): TransferPackage | undefined {
    const data: TransferPackage['data'] = {};
    for (const key of TRANSFER_KEYS) {
        const text = readKey(key);
        if (text !== null) data[key] = text;
    }
    return Object.keys(data).length > 0 ? { format: TRANSFER_FORMAT, game: GAME_VERSION, data } : undefined;
}

/** Uploads the save and gets a code back. */
export async function createCode(save: TransferPackage): Promise<TransferResult<TransferCreated>> {
    const response = await post(TRANSFER_URL, JSON.stringify(save));
    if (!response.ok) return response;
    try {
        const created: unknown = await response.value.json();
        if (isCreated(created)) return { ok: true, value: created };
    } catch {
        // Falls through: an answer that is not what we expect.
    }
    return { ok: false, error: 'failed' };
}

/** Claims a code (already normalized): the server hands the save back once and forgets it. */
export async function claimCode(code: string): Promise<TransferResult<TransferPackage>> {
    const response = await post(`${TRANSFER_URL}/claim`, code);
    if (!response.ok) return response;
    try {
        const save = readTransferPackage(await response.value.json());
        if (save) return { ok: true, value: save };
    } catch {
        // Falls through.
    }
    return { ok: false, error: 'failed' };
}

/**
 * Replaces this device's save with `save`: first keeps the current one under TRANSFER_BACKUP_KEY, then writes every key
 * (keys the package doesn't have are removed, so nothing from the old save mixes in). False if the browser refused.
 */
export function applySave(save: TransferPackage): boolean {
    try {
        const old = collectSave();
        if (old) localStorage.setItem(TRANSFER_BACKUP_KEY, JSON.stringify(old));
        for (const key of TRANSFER_KEYS) {
            const text = save.data[key];
            if (text === undefined) localStorage.removeItem(key);
            else localStorage.setItem(key, text);
        }
        return true;
    } catch {
        return false;
    }
}

/** Reloads the page so every store reads the new save, dropping debug parameters (they could reset it again). */
export function reloadWithNewSave(): void {
    const params = new URLSearchParams(window.location.search);
    const kept = new URLSearchParams();
    for (const name of TRANSFER_RELOAD_KEEP_PARAMS) {
        const value = params.get(name);
        if (value !== null) kept.set(name, value);
    }
    const query = kept.toString();
    window.location.replace(`${window.location.pathname}${query ? `?${query}` : ''}`);
}

function readKey(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** POST with a plain-text body (no CORS preflight, like /run) and a time limit. */
async function post(url: string, body: string): Promise<TransferResult<Response>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TRANSFER_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, signal: controller.signal, cache: 'no-store',
        });
        if (response.ok) return { ok: true, value: response };
        return { ok: false, error: errorForStatus(response.status) };
    } catch {
        // No network, blocked by the network (Cloudflare blocked) or too slow.
        return { ok: false, error: 'offline' };
    } finally {
        clearTimeout(timer);
    }
}

function errorForStatus(status: number): TransferError {
    if (status === 404) return 'notFound';
    if (status === 413) return 'tooBig';
    if (status === 503) return 'busy';
    return 'failed';
}

function isCreated(value: unknown): value is TransferCreated {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return typeof v.code === 'string' && typeof v.expiresAt === 'number';
}
