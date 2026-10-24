// Servidor de métricas (Fase 14A), un Cloudflare Worker con una base de datos D1.
//   POST /run          → el juego manda el resumen de una partida (config/metrics.ts); se comprueba y se guarda.
//   GET  /             → la página de gráficas (dashboard.html). Pide la clave y luego llama a /api/summary.
//   GET  /api/summary  → los datos de las gráficas, solo con la clave (secreto DASHBOARD_KEY, nunca en git).
//   POST /transfer, /transfer/claim → código de traspaso de partida (Fase 27½, transfer.ts).
// No se guarda la IP ni nada que identifique a quien juega.
import { MAX_PAYLOAD_BYTES, type BossReport, type RunReport } from '../../src/config/metrics';
import dashboardHtml from './dashboard.html';
import { claimTransfer, createTransfer } from './transfer';

interface MetricsEnv extends Env {
    DASHBOARD_KEY: string;
}

/** Pages allowed to send runs: the published game and the dev server. */
const ALLOWED_ORIGINS = ['https://nicolasraviolo.github.io', 'http://localhost:8090', 'http://localhost:4173', 'http://localhost:8091'];
/** Text fields are cut to this length; lists to this many entries. */
const MAX_TEXT = 40;
const MAX_LIST = 40;
/** Longest believable run (the portal closes the run long before). */
const MAX_DURATION_MS = 3 * 60 * 60 * 1000;
/** Longest level-by-minute list accepted. */
const MAX_MINUTES = 180;
/** Runs shown in the table of the dashboard. */
const RECENT_RUNS = 50;

export default {
    async fetch(request: Request, env: MetricsEnv): Promise<Response> {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin') ?? '';
        const cors = ALLOWED_ORIGINS.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : undefined;

        if (url.pathname === '/run') {
            if (request.method === 'OPTIONS') {
                return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
            }
            if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
            if (!cors) return new Response('Forbidden', { status: 403 });
            return saveRun(request, env, cors);
        }
        if (url.pathname === '/transfer' || url.pathname === '/transfer/claim') {
            if (request.method === 'OPTIONS') {
                return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
            }
            if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
            if (!cors) return new Response('Forbidden', { status: 403 });
            return url.pathname === '/transfer' ? createTransfer(request, env.DB, cors) : claimTransfer(request, env.DB, cors);
        }
        if (url.pathname === '/api/summary' && request.method === 'GET') {
            if (!env.DASHBOARD_KEY || request.headers.get('Authorization') !== `Bearer ${env.DASHBOARD_KEY}`) {
                return new Response('Unauthorized', { status: 401 });
            }
            return Response.json(await summary(env, url.searchParams.get('version') ?? ''), { headers: { 'Cache-Control': 'no-store' } });
        }
        if (url.pathname === '/' && request.method === 'GET') {
            return new Response(dashboardHtml, {
                headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
            });
        }
        return new Response('Not found', { status: 404 });
    },
} satisfies ExportedHandler<MetricsEnv>;

async function saveRun(request: Request, env: MetricsEnv, cors: Record<string, string>): Promise<Response> {
    const body = await request.text();
    if (body.length > MAX_PAYLOAD_BYTES) return new Response('Too large', { status: 413, headers: cors });
    let report: RunReport | undefined;
    try {
        report = readReport(JSON.parse(body));
    } catch {
        report = undefined;
    }
    if (!report) return new Response('Bad report', { status: 400, headers: cors });
    await env.DB.prepare(
        `INSERT INTO runs (version, map, character, device, result, duration_ms, level, kills, killer, gear, cards,
            zem_used, crits, fps_avg, fps_low, resumed, level_by_minute, damage_by, min_hp_pct, bosses, potions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
        report.version, report.map, report.character, report.device, report.result, report.durationMs, report.level,
        report.kills, report.killer, JSON.stringify(report.gear), JSON.stringify(report.cards), report.zemUsed, report.crits,
        report.fpsAvg, report.fpsLow, report.resumed ? 1 : 0, JSON.stringify(report.levelByMinute),
        JSON.stringify(report.damageBy), report.minHpPct, JSON.stringify(report.bosses), report.potions,
    ).run();
    return new Response(null, { status: 204, headers: cors });
}

/** The report, checked field by field (anyone can call /run), or undefined if something does not fit. */
function readReport(data: unknown): RunReport | undefined {
    if (typeof data !== 'object' || data === null) return undefined;
    const d = data as Record<string, unknown>;
    const device = d.device === 'mobile' || d.device === 'desktop' ? d.device : undefined;
    const result = d.result === 'win' || d.result === 'death' || d.result === 'quit' ? d.result : undefined;
    const version = text(d.version);
    const map = text(d.map);
    const character = text(d.character);
    const killer = text(d.killer);
    const durationMs = int(d.durationMs, MAX_DURATION_MS);
    const level = int(d.level, 1000);
    const kills = int(d.kills, 1_000_000);
    const zemUsed = int(d.zemUsed, 100);
    const crits = int(d.crits, 1_000_000);
    const fpsAvg = num(d.fpsAvg, 1000);
    const fpsLow = num(d.fpsLow, 1000);
    const minHpPct = int(d.minHpPct, 100);
    const potions = int(d.potions, 10_000);
    const cards = counts(d.cards, 1000);
    const damageBy = counts(d.damageBy, 100_000_000);
    if (minHpPct === undefined || potions === undefined || !cards || !damageBy) return undefined;
    if (!Array.isArray(d.levelByMinute) || d.levelByMinute.length > MAX_MINUTES) return undefined;
    const levelByMinute = d.levelByMinute.map((n) => int(n, 1000));
    if (levelByMinute.some((n) => n === undefined)) return undefined;
    if (!Array.isArray(d.bosses) || d.bosses.length > MAX_LIST) return undefined;
    const bosses = d.bosses.map(readBoss);
    if (bosses.some((b) => !b)) return undefined;
    if (!device || !result || !version || !map || !character || killer === undefined || durationMs === undefined
        || level === undefined || kills === undefined || zemUsed === undefined || crits === undefined
        || fpsAvg === undefined || fpsLow === undefined || typeof d.resumed !== 'boolean') return undefined;
    if (!Array.isArray(d.gear) || d.gear.length > MAX_LIST) return undefined;
    const gear = d.gear.map(text);
    if (gear.some((g) => !g)) return undefined;
    return {
        version, map, character, device, result, durationMs, level, kills, killer, gear: gear as string[], cards,
        levelByMinute: levelByMinute as number[], damageBy, minHpPct, bosses: bosses as BossReport[], potions,
        zemUsed, crits, fpsAvg, fpsLow, resumed: d.resumed,
    };
}

/** { name: count } with valid names and whole numbers up to `max`, or undefined. */
function counts(value: unknown, max: number): Record<string, number> | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > MAX_LIST) return undefined;
    const out: Record<string, number> = {};
    for (const [key, count] of entries) {
        const k = text(key);
        const n = int(count, max);
        if (!k || n === undefined) return undefined;
        out[k] = n;
    }
    return out;
}

function readBoss(value: unknown): BossReport | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const b = value as Record<string, unknown>;
    const name = text(b.name);
    const spawnMs = int(b.spawnMs, MAX_DURATION_MS);
    const killMs = b.killMs === -1 ? -1 : int(b.killMs, MAX_DURATION_MS);
    const maxHit = int(b.maxHit, 1_000_000);
    if (!name || spawnMs === undefined || killMs === undefined || maxHit === undefined) return undefined;
    return { name, spawnMs, killMs, maxHit };
}

function text(value: unknown): string | undefined {
    return typeof value === 'string' && value.length <= MAX_TEXT && /^[\w .:'-]*$/.test(value) ? value : undefined;
}

function int(value: unknown, max: number): number | undefined {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max ? value : undefined;
}

function num(value: unknown, max: number): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value * 10) / 10 : undefined;
}

/** Everything the dashboard draws, optionally for one game version. */
async function summary(env: MetricsEnv, version: string) {
    const where = version ? 'WHERE version = ?1' : '';
    const q = (sql: string) => (version ? env.DB.prepare(sql).bind(version) : env.DB.prepare(sql));
    const and = where ? `${where} AND` : 'WHERE';
    const [versions, totals, byClass, deathMinutes, killers, devices, cardRows, recent, levelCurve, damage, bossRows, hpRows] = await env.DB.batch([
        env.DB.prepare('SELECT version, COUNT(*) AS runs FROM runs GROUP BY version ORDER BY MAX(id) DESC'),
        q(`SELECT COUNT(*) AS runs, SUM(result = 'win') AS wins, SUM(result = 'quit') AS quits, AVG(duration_ms) AS avgMs,
            AVG(level) AS avgLevel, AVG(kills) AS avgKills, AVG(potions) AS avgPotions, AVG(min_hp_pct) AS avgMinHp FROM runs ${where}`),
        q(`SELECT character, COUNT(*) AS runs, SUM(result = 'win') AS wins, AVG(duration_ms) AS avgMs, AVG(level) AS avgLevel
            FROM runs ${where} GROUP BY character ORDER BY runs DESC`),
        q(`SELECT duration_ms / 60000 AS minute, COUNT(*) AS deaths FROM runs ${and} result = 'death'
            GROUP BY minute ORDER BY minute`),
        q(`SELECT killer, COUNT(*) AS deaths FROM runs ${and} result = 'death'
            GROUP BY killer ORDER BY deaths DESC LIMIT 12`),
        q(`SELECT device, COUNT(*) AS runs, AVG(fps_avg) AS fpsAvg, AVG(fps_low) AS fpsLow FROM runs ${where} GROUP BY device`),
        q(`SELECT key AS card, SUM(value) AS picks FROM runs, json_each(runs.cards) ${where} GROUP BY key ORDER BY picks DESC LIMIT 20`),
        q(`SELECT created_at AS at, version, character, device, result, duration_ms AS ms, level, kills, killer, fps_avg AS fps,
            min_hp_pct AS minHp, potions FROM runs ${where} ORDER BY id DESC LIMIT ${RECENT_RUNS}`),
        q(`SELECT character, CAST(m.key AS INTEGER) + 1 AS minute, AVG(m.value) AS level, COUNT(*) AS runs
            FROM runs, json_each(runs.level_by_minute) AS m ${where} GROUP BY character, minute ORDER BY character, minute`),
        q(`SELECT d.key AS monster, SUM(d.value) AS damage FROM runs, json_each(runs.damage_by) AS d ${where}
            GROUP BY monster ORDER BY damage DESC LIMIT 12`),
        q(`SELECT json_extract(b.value, '$.name') AS boss, COUNT(*) AS seen,
            SUM(json_extract(b.value, '$.killMs') >= 0) AS killed,
            AVG(CASE WHEN json_extract(b.value, '$.killMs') >= 0
                THEN json_extract(b.value, '$.killMs') - json_extract(b.value, '$.spawnMs') END) AS avgLifeMs,
            AVG(json_extract(b.value, '$.maxHit')) AS avgMaxHit, MAX(json_extract(b.value, '$.maxHit')) AS maxHit
            FROM runs, json_each(runs.bosses) AS b ${where} GROUP BY boss ORDER BY MIN(json_extract(b.value, '$.spawnMs'))`),
        q(`SELECT result, (min_hp_pct / 10) * 10 AS bucket, COUNT(*) AS runs FROM runs ${and} result != 'quit'
            GROUP BY result, bucket ORDER BY result, bucket`),
    ]);
    return {
        versions: versions.results,
        totals: totals.results[0],
        byClass: byClass.results,
        deathMinutes: deathMinutes.results,
        killers: killers.results,
        devices: devices.results,
        cards: cardRows.results,
        recent: recent.results,
        levelCurve: levelCurve.results,
        damage: damage.results,
        bosses: bossRows.results,
        lowestHp: hpRows.results,
    };
}
