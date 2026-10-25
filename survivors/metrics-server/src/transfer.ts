// Código de traspaso (Fase 27½), la parte del servidor. Reglas en src/config/transfer.ts.
//   POST /transfer        → cuerpo: la partida (TransferPackage). Responde { code, expiresAt }.
//   POST /transfer/claim  → cuerpo: el código. Responde la partida y borra el código (sirve una vez); 404 si no existe o caducó.
// Cuerpos text/plain, como /run, para que el navegador no haga petición previa (CORS). No se guarda IP ni nada personal.
import {
    TRANSFER_CODE_ALPHABET,
    TRANSFER_CODE_LENGTH,
    TRANSFER_MAX_BYTES,
    TRANSFER_TTL_MS,
    normalizeTransferCode,
    readTransferPackage,
    type TransferCreated,
} from '../../src/config/transfer';

/** Codes alive at the same time before the server says "busy" (stops someone filling the database). */
const MAX_LIVE_TRANSFERS = 5000;
/** Tries to find a code nobody is using (with ~887M codes, the first one almost always works). */
const CODE_TRIES = 5;

export async function createTransfer(request: Request, db: D1Database, cors: Record<string, string>): Promise<Response> {
    const body = await request.text();
    if (body.length > TRANSFER_MAX_BYTES) return new Response('Too large', { status: 413, headers: cors });
    let ok = false;
    try {
        ok = readTransferPackage(JSON.parse(body)) !== undefined;
    } catch {
        ok = false;
    }
    if (!ok) return new Response('Bad save', { status: 400, headers: cors });

    const now = Date.now();
    const oldest = now - TRANSFER_TTL_MS;
    await db.prepare('DELETE FROM transfers WHERE created_at <= ?').bind(oldest).run();
    const live = await db.prepare('SELECT COUNT(*) AS n FROM transfers').first<{ n: number }>();
    if ((live?.n ?? 0) >= MAX_LIVE_TRANSFERS) return new Response('Busy', { status: 503, headers: cors });

    for (let i = 0; i < CODE_TRIES; i++) {
        const code = randomCode();
        const result = await db.prepare('INSERT OR IGNORE INTO transfers (code, created_at, data) VALUES (?, ?, ?)')
            .bind(code, now, body).run();
        if (result.meta.changes === 1) {
            const created: TransferCreated = { code, expiresAt: now + TRANSFER_TTL_MS };
            return Response.json(created, { headers: { ...cors, 'Cache-Control': 'no-store' } });
        }
    }
    return new Response('Busy', { status: 503, headers: cors });
}

export async function claimTransfer(request: Request, db: D1Database, cors: Record<string, string>): Promise<Response> {
    const code = normalizeTransferCode((await request.text()).slice(0, 32));
    if (!code) return new Response('Not found', { status: 404, headers: cors });
    // Deleting and reading in one step: two devices can't both get the same save.
    const row = await db.prepare('DELETE FROM transfers WHERE code = ? AND created_at > ? RETURNING data')
        .bind(code, Date.now() - TRANSFER_TTL_MS).first<{ data: string }>();
    if (!row) return new Response('Not found', { status: 404, headers: cors });
    return new Response(row.data, { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/** Random code from the alphabet. Bytes that would favour some letters are thrown away. */
function randomCode(): string {
    const n = TRANSFER_CODE_ALPHABET.length;
    const limit = 256 - (256 % n);
    let code = '';
    while (code.length < TRANSFER_CODE_LENGTH) {
        for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
            if (byte < limit && code.length < TRANSFER_CODE_LENGTH) code += TRANSFER_CODE_ALPHABET[byte % n];
        }
    }
    return code;
}
