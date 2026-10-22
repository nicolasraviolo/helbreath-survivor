// Tabla de partidas simuladas para revisar la dificultad (22-oct-2026).
// Cada caso es una partida simulada (?debug=sim) de una clase, en un mapa, como un personaje de cierto Level con su
// mejor equipo (config/simProfile.ts) y el arma a +N. Se repite cada caso varias veces (el bot es irregular) y se
// guarda todo en survivors/.check/balance.json; en pantalla, la mediana de cada caso.
//
// Uso:  pnpm balance                         → la tabla por defecto (DEFAULT_CASES)
//       pnpm balance warrior:bisle:10:0       → solo esos casos: clase:mapa:Level:+N[:build][:kit]
//                                               (build = str2-vit1-dex1; kit = best o start; lo que vaya tras "@" se añade a la dirección)
//       --repeat=3   veces cada caso (por defecto 3)      --jobs=4   partidas a la vez (por defecto 4)
//       --out=name   guarda en .check/<name>.json
// Si el servidor de desarrollo (puerto 8090) no está en marcha, lo arranca y lo para al terminar.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'http://localhost:8090/';
const OUT_DIR = join(ROOT, '.check');
const SIM_TIMEOUT_MS = 15 * 60000;

/** Map and the Levels a player may have there: about when it opens, and later. */
const GRID = {
    traveler: [1, 5],
    bisle: [3, 10, 20],
    elvineGarden: [10, 25, 35],
    middleland: [25, 40, 55],
};

const DEFAULT_CASES = [];
for (const cls of ['warrior', 'mage']) {
    for (const [map, levels] of Object.entries(GRID)) {
        for (const level of levels) DEFAULT_CASES.push(`${cls}:${map}:${level}:0`);
        // The weapon at +3 at the middle Level of each map (what the blacksmith adds).
        DEFAULT_CASES.push(`${cls}:${map}:${levels[Math.floor(levels.length / 2)]}:3`);
    }
}

const args = process.argv.slice(2);
const flag = (name, fallback) => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.slice(name.length + 3) : fallback;
};
const repeat = Number(flag('repeat', '3'));
const jobs = Number(flag('jobs', '4'));
const outName = flag('out', 'balance');
const cases = args.filter((a) => !a.startsWith('--'));
if (cases.length === 0) cases.push(...DEFAULT_CASES);

function caseQuery(spec) {
    // Anything after "@" is added to the address as it is (e.g. warrior:bisle:5:0@spells=fireBall).
    const [main, extra] = spec.split('@');
    const [cls, map, level, upgrade = '0', build, kit] = main.split(':');
    const params = [`play=${cls}`, `map=${map}`, `level=${level}`, 'debug=sim'];
    if (upgrade !== '0') params.push(`upgrade=${upgrade}`);
    if (build) params.push(`build=${build.replace(/([a-z]+)(\d+)/g, '$1:$2').replace(/-/g, ',')}`);
    if (kit) params.push(`kit=${kit}`);
    if (extra) params.push(extra);
    return params.join('&');
}

async function serverUp() {
    try {
        return (await fetch(BASE_URL)).ok;
    } catch {
        return false;
    }
}

async function ensureServer() {
    if (await serverUp()) return undefined;
    const child = spawn('pnpm', ['exec', 'vite'], { cwd: ROOT, shell: true, stdio: 'ignore' });
    for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await serverUp()) return child;
    }
    child.kill();
    throw new Error('The dev server did not start on port 8090');
}

async function runOne(browser, spec) {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    const errors = [];
    // A page error stops the run at once (the game usually freezes after one) instead of waiting for the timeout.
    let failNow;
    const failed = new Promise((_, reject) => (failNow = reject));
    failed.catch(() => {});
    page.on('console', (msg) => {
        if (msg.type() === 'warning' && msg.text().startsWith('HBAsset')) errors.push(msg.text());
    });
    page.on('pageerror', (err) => {
        errors.push(err.stack?.split('\n').slice(0, 14).join(' | ') ?? `${err.name}: ${err.message}`);
        failNow(new Error(`page error: ${err.message}`));
    });
    try {
        await page.goto(`${BASE_URL}?${caseQuery(spec)}`);
        const sim = await Promise.race([failed, page
            .waitForFunction(() => window.__sim?.done && window.__sim, undefined, { timeout: SIM_TIMEOUT_MS, polling: 2000 })
            .then((h) => h.jsonValue())]);
        return { spec, ...sim, errors };
    } catch (err) {
        return { spec, failed: err.message.split('\n')[0], errors };
    } finally {
        await context.close();
    }
}

const median = (values) => {
    const list = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
    if (list.length === 0) return undefined;
    const mid = Math.floor(list.length / 2);
    return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
};
const mmss = (s) => (s === undefined ? '  -  ' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);

function summary(spec, runs) {
    const ok = runs.filter((r) => !r.failed);
    const finalBoss = (r) => r.finalBossDeadAtS;
    return {
        spec,
        runs: ok.length,
        deathS: median(ok.map((r) => r.deathAtS ?? r.endS + 1)),
        survived: ok.filter((r) => r.deathAtS === undefined).length,
        deaths: median(ok.map((r) => r.deaths)),
        lowestHp: median(ok.map((r) => r.lowestHpShare)),
        finalBossS: median(ok.map(finalBoss)),
        endLevel: median(ok.map((r) => r.endLevel)),
        xp: median(ok.map((r) => r.xpByMinute.at(-1))),
        gold: median(ok.map((r) => r.goldByMinute.at(-1) ?? 0)),
    };
}

const server = await ensureServer();
const browser = await chromium.launch({ channel: 'chrome', args: ['--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
const queue = cases.flatMap((spec) => Array.from({ length: repeat }, () => spec));
const results = [];
const started = Date.now();
try {
    await Promise.all(Array.from({ length: jobs }, async () => {
        for (let spec = queue.shift(); spec !== undefined; spec = queue.shift()) {
            const result = await runOne(browser, spec);
            results.push(result);
            const done = results.length;
            const total = done + queue.length + 0;
            console.log(`[${done}/${cases.length * repeat}] ${spec} → ${result.failed ? `FAILED ${result.failed}` : `death ${mmss(result.deathAtS)} · deaths ${result.deaths} · final boss ${mmss(result.finalBossDeadAtS)} · Power ${result.endLevel} · ${result.speed}×`}${total < 0 ? '' : ''}`);
        }
    }));
} finally {
    await browser.close();
    if (server) server.kill();
}

mkdirSync(OUT_DIR, { recursive: true });
const summaries = cases.map((spec) => summary(spec, results.filter((r) => r.spec === spec)));
writeFileSync(join(OUT_DIR, `${outName}.json`), JSON.stringify({ at: new Date().toISOString(), repeat, summaries, results }, null, 1));
console.log(`\ncase                              runs  death  alive  deaths  lowHP  finalBoss  Power   XP      gold`);
for (const s of summaries) {
    console.log(`${s.spec.padEnd(34)}${String(s.runs).padStart(4)}  ${mmss(s.deathS)}  ${String(s.survived).padStart(4)}   ${String(s.deaths ?? '-').padStart(5)}  ${String(s.lowestHp ?? '-').slice(0, 4).padStart(5)}  ${mmss(s.finalBossS).padStart(8)}  ${String(s.endLevel ?? '-').padStart(5)}  ${String(s.xp ?? '-').padStart(6)}  ${String(s.gold ?? '-').padStart(5)}`);
}
console.log(`\n${results.length} runs in ${Math.round((Date.now() - started) / 1000)} s → .check/${outName}.json`);
