// Comprobación automática del juego con Chrome sin ventana (Playwright).
// Abre una o varias situaciones, espera, y por cada una dice en pocas líneas: escenas activas, FPS, estado de la partida
// y errores de consola. Guarda una captura pequeña en survivors/.check/ (solo hay que mirarla si hace falta).
//
// Uso:  pnpm check                     → menú principal en PC
//       pnpm check game levelup boss   → varias situaciones seguidas (portal = matar al jefe final y ver el portal)
//       pnpm check achievements --cards → logros desde cero: aviso al llegar a nivel 21 (achievementlist = la pantalla con todos)
//       pnpm check levelpace           → partida simulada muy deprisa (?debug=sim): minuto de cada nivel y golpes de jefe
//                                        (Mago: "play=mage&debug=sim"; tarda 1–3 min)
//       pnpm check boss --mobile       → simulando un móvil en horizontal (táctil, ?ui=compact)
//       pnpm check "play=warrior&debug=str,levels"   → cualquier combinación de atajos (ver src/config/debugStart.ts)
//       --cards                        → elige solo la primera carta de cada subida de nivel (para que la partida siga)
//       --wait=5000                    → milisegundos que se deja correr la partida antes de medir (por defecto 3000)
//       --eval="g.enemies.alive"       → además, evalúa esa expresión en la página y escribe el resultado (si es una promesa, la espera)
//                                        (g = escena Game, game = window.__game)
// Si el servidor de desarrollo (puerto 8090) no está en marcha, lo arranca y lo para al terminar.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'http://localhost:8090/';
const OUT_DIR = join(ROOT, '.check');
const LOAD_TIMEOUT_MS = 90000;
const PHONE = { width: 844, height: 390 };
const DESKTOP = { width: 1000, height: 750 };
/** Console messages that are known and harmless. */
const IGNORED_ERRORS = [/favicon\.ico/];

/** Named situations; anything else is used as the address query as it is. */
const PRESETS = {
    menu: '',
    game: 'play',
    levelup: 'debug=levelup',
    boss: 'debug=god,boss',
    // Minimapa (Fase 16A): con un jefe vivo, para ver su punto rojo junto al del jugador.
    minimap: 'debug=god,boss',
    horde: 'debug=god,horde,horde,horde',
    pickups: 'debug=god,pickups',
    // Tótems (Fase 16B): los 4 en fila debajo del jugador, con unos monstruos alrededor.
    totems: 'debug=god,horde,totems',
    finalboss: 'debug=god,finalboss',
    portal: 'debug=god,bosskill',
    stampede: 'debug=god,stampede',
    levelpace: 'debug=sim',
    // Critical Strike (Fase 19A): Guerrero con una horda alrededor y cargas infinitas. Para lanzarlo:
    // --eval="g.launchCritStrike()"; con --mobile se ve el botón de la espada roja.
    crit: 'play=warrior&debug=god,horde,crits',
    // Meteor Strike del Mago (Fase 19B): horda alrededor y sin recarga. Para lanzarlo: --eval="g.launchCritStrike()"
    // (el mismo botón que el crit); con --wait da tiempo a que caiga y explote.
    meteor: 'play=mage&debug=god,horde,crits',
    // Logros (Fase 14B): empezar sin ninguno y subir a nivel 21 → aviso de "Rising Star" (y "Survivor" con +5 minutos).
    // Usar con --cards: si no, la partida se queda en las cartas.
    achievements: 'achievements=reset&debug=god,levels,levels,levels,levels,minute,minute,minute,minute,minute',
    // Pantalla Achievements con todos conseguidos.
    achievementlist: 'achievements=all&open=achievements',
    // Select Character (Fase 17A): los 4 huecos con dos personajes de ejemplo (slotsempty = sin ninguno).
    slots: 'characters=demo&open=slots',
    // Ventana Character (Fase 20A): Gorn (ejemplo) con puntos sin repartir, desde Select Character.
    charinfo: 'characters=demo&open=charinfo',
    // La misma ventana en partida (tecla C): pausa y panel de detalles al lado.
    charinfogame: 'play=warrior&characters=demo&debug=god,stats',
    // Fin de partida con el Level del personaje (Fase 20A): Gorn con unos Power de más y su XP ×50. Para terminarla:
    // --eval="g.endRun(false)" (pantalla de derrota).
    charexp: 'play=warrior&characters=demo&debug=god,levels,charexp',
    // Pantalla Equipment (Fase 20B): la de Gorn (ejemplo, Guerrero) desde Select Character.
    equipment: 'characters=demo&open=equipment',
    slotsempty: 'characters=reset&open=slots',
    // Pantalla "What's new" (novedades de cada fase), la que abre el link del pie del menú.
    news: 'open=releasenotes',
    // Settings → Controls (Fase 19C): cambiar la tecla / el botón del crit y del panel de stats.
    controls: 'open=controls',
    settings: 'open=settings',
};
/** Most real time a simulated run may take (ms). */
const SIM_TIMEOUT_MS = 8 * 60000;

const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const waitArg = args.find((a) => a.startsWith('--wait='));
const waitMs = waitArg ? Number(waitArg.slice('--wait='.length)) : 3000;
const autoCards = args.includes('--cards');
const evalArg = args.find((a) => a.startsWith('--eval='))?.slice('--eval='.length);
const scenarios = args.filter((a) => !a.startsWith('--'));
if (scenarios.length === 0) scenarios.push('menu');

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

function stopServer(child) {
    if (!child) return;
    // En Windows hay que matar el árbol entero (pnpm → node → vite).
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill();
}

/** Reads the state of the game from the page (window.__game exists only in development). */
function readState() {
    const game = window.__game;
    if (!game) return { error: 'window.__game not found' };
    const scenes = game.scene.getScenes(true).map((s) => s.scene.key);
    const state = { scenes, fps: Math.round(game.loop.actualFps) };
    const g = game.scene.getScene('Game');
    if (g && (game.scene.isActive('Game') || game.scene.isPaused('Game')) && g.player) {
        state.run = {
            hp: `${g.player.hp}/${g.player.maxHp}`,
            level: g.stats.level,
            time: Math.round(g.spawner.elapsed / 1000) + 's',
            enemies: g.enemies.alive,
            kills: g.combat.kills,
            boss: g.bossInfo?.()?.name ?? null,
        };
    }
    return state;
}

async function runScenario(browser, name) {
    const query = PRESETS[name] ?? name;
    const params = new URLSearchParams(query);
    if (mobile) params.set('ui', 'compact');
    const url = BASE_URL + (params.toString() ? `?${params.toString().replace(/=(&|$)/g, '$1').replace(/%2C/g, ',')}` : '');
    const context = await browser.newContext({
        viewport: mobile ? PHONE : DESKTOP,
        hasTouch: mobile,
        isMobile: mobile,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !IGNORED_ERRORS.some((re) => re.test(msg.text()))) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(`${err.name}: ${err.message}`));

    // ?open= (debugStart.ts) shows a menu screen: wait for it instead of the game.
    const openKey = { howtoplay: 'HowToPlay', settings: 'Settings', controls: 'Controls', credits: 'Credits', releasenotes: 'ReleaseNotes', achievements: 'Achievements', select: 'CharacterSelect', slots: 'CharacterSlots', charinfo: 'CharacterInfo', equipment: 'Equipment' }[params.get('open') ?? ''];
    const target = openKey ?? (query ? 'Game' : 'MainMenu');
    await page.goto(url);
    const t0 = Date.now();
    await page.waitForFunction((key) => window.__game?.scene.isActive(key), target, { timeout: LOAD_TIMEOUT_MS });
    const loadS = ((Date.now() - t0) / 1000).toFixed(1);
    // --cards: the level-up cards are answered by themselves (always the first one), so the run goes on.
    if (autoCards) {
        await page.evaluate(() => setInterval(() => {
            const levelUp = window.__game?.scene.getScene('LevelUp');
            if (levelUp?.sys.isActive()) levelUp.sys.settings.data.onChoose(levelUp.sys.settings.data.choices[0]);
        }, 150));
    }
    await page.waitForTimeout(waitMs);
    const state = await page.evaluate(readState);
    // Not awaited yet: with a simulated run, the expression watches it while it plays.
    const evalPromise = evalArg === undefined ? undefined : page.evaluate(async (code) => {
        const game = window.__game;
        const g = game?.scene.getScene('Game');
        try {
            // A promise is awaited, so an expression can watch the game for a while (e.g. the most particles in 3 s).
            return JSON.stringify(await new Function('game', 'g', `return (${code});`)(game, g));
        } catch (err) {
            return `error: ${err.message}`;
        }
    }, evalArg);
    const sim = params.get('debug')?.split(',').includes('sim')
        ? await page.waitForFunction(() => window.__sim?.done && window.__sim, undefined, { timeout: SIM_TIMEOUT_MS, polling: 1000 }).then((h) => h.jsonValue())
        : undefined;
    const evalResult = await evalPromise;

    mkdirSync(OUT_DIR, { recursive: true });
    const file = join(OUT_DIR, `${name.replace(/[^a-z0-9]+/gi, '_')}${mobile ? '-mobile' : ''}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 60 });
    await context.close();

    console.log(`\n■ ${name}${mobile ? ' (mobile)' : ''}  →  ${url}`);
    console.log(`  loaded in ${loadS}s · scenes: ${state.scenes?.join(', ')} · ${state.fps} FPS`);
    if (state.run) console.log(`  run: ${Object.entries(state.run).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    if (state.error) console.log(`  ${state.error}`);
    if (evalResult !== undefined) console.log(`  eval: ${evalResult}`);
    if (sim) {
        printSim(sim);
        writeFileSync(file.replace(/\.jpg$/, '.json'), JSON.stringify(sim, null, 1));
    }
    console.log(errors.length ? `  ✗ ${errors.length} console error(s):\n    ${errors.slice(0, 10).join('\n    ')}` : '  ✓ no console errors');
    console.log(`  screenshot: ${file}`);
    return errors.length === 0 && !state.error;
}

/** The simulated run (src/systems/SimRun.ts): levels per minute, the biggest blow of each boss and the blows dodged. */
function printSim(sim) {
    const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    console.log(`  simulated ${sim.character}: level ${sim.endLevel} at ${mmss(sim.endS)} (${sim.end}) · ${sim.kills} kills · ×${sim.speed} speed`);
    console.log(`  build: ${sim.build}`);
    if (sim.finalBossDeadAtS !== undefined) console.log(`  final boss killed at ${mmss(sim.finalBossDeadAtS)}`);
    const byMinute = new Map();
    for (const { level, atS } of sim.levels) byMinute.set(Math.floor(atS / 60), [...(byMinute.get(Math.floor(atS / 60)) ?? []), level]);
    for (const [minute, xp] of sim.xpByMinute.entries()) {
        const levels = byMinute.get(minute) ?? [];
        console.log(`    min ${String(minute).padStart(2)}: ${levels.length} level(s) → ${levels.at(-1) ?? '-'} · ${xp} XP so far`);
    }
    for (const life of sim.bossLife) console.log(`  ${life.boss}: from ${mmss(life.fromS)} to ${life.toS === undefined ? 'the end' : mmss(life.toS)}`);
    for (const hit of Object.values(sim.bossHits)) {
        const share = Math.round((hit.damage / hit.maxHp) * 100);
        console.log(`  biggest ${hit.boss} blow: ${hit.damage} of ${hit.maxHp} health (${share}%, ~${Math.ceil(100 / share)} hits to die) at ${mmss(hit.atS)}`);
    }
    // Fases 18A and 18B: share of each monster's blows and spells that landed (the rest were dodged or resisted), most damage first.
    const blows = Object.entries(sim.blows ?? {}).sort((a, b) => b[1].damageTried - a[1].damageTried);
    const total = blows.reduce((sum, [, b]) => ({ tried: sum.tried + b.damageTried, landed: sum.landed + b.damageLanded }), { tried: 0, landed: 0 });
    if (total.tried > 0) console.log(`  damage taken (before armor): ${total.landed} of ${total.tried} (${Math.round((total.landed / total.tried) * 100)}%; the rest dodged or resisted)`);
    for (const [name, b] of blows) {
        console.log(`    ${name}: ${b.landed}/${b.tried} blows landed (${Math.round((b.landed / b.tried) * 100)}%) · ${b.damageLanded} of ${b.damageTried} damage`);
    }
}

const server = await ensureServer();
let ok = true;
const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
try {
    for (const name of scenarios) {
        try {
            ok = (await runScenario(browser, name)) && ok;
        } catch (err) {
            ok = false;
            console.log(`\n■ ${name}: ✗ ${err.message.split('\n')[0]}`);
        }
    }
} finally {
    await browser.close();
    stopServer(server);
}
console.log(ok ? '\nALL OK' : '\nPROBLEMS FOUND');
process.exit(ok ? 0 : 1);
