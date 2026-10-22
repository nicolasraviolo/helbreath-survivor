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
//       pnpm check loadtime [--mobile] → tiempos de carga (descarga y preparación) con red simulada; informe en .check/
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
    // Fase 21½A: todas las cartas Epic (marco morado, cinta, brillo y sonido).
    epic: 'debug=epic,levelup',
    // Fase 21½B: 3 Reroll y 3 Skip comprados, con las cartas abiertas.
    rerollskip: 'unlocks=dice3,wine3&debug=levelup',
    // Fase 21½C: un Champion a los 3 segundos (usar --wait=6000 para verlo en la captura).
    champion: 'debug=god,champion',
    boss: 'debug=god,boss',
    // Minimapa (Fase 16A): con un jefe vivo, para ver su punto rojo junto al del jugador.
    minimap: 'debug=god,boss',
    horde: 'debug=god,horde,horde,horde',
    // Monstruos élite (M2): todos salen élite (brillo rojo del Berserk), con una horda alrededor.
    elites: 'debug=god,elites,horde',
    pickups: 'debug=god,pickups',
    // Tótems (Fase 16B): los 4 en fila debajo del jugador, con unos monstruos alrededor.
    totems: 'debug=god,horde,totems',
    finalboss: 'debug=god,finalboss',
    portal: 'debug=god,bosskill',
    stampede: 'debug=god,stampede',
    levelpace: 'debug=sim',
    // Lo mismo en Elvine Garden (Fase 22D).
    levelpaceelvine: 'debug=sim&map=elvineGarden',
    levelpacemiddleland: 'debug=sim&map=middleland',
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
    // Pantalla Equipment de la Maga (Fase 20D): Kaila (ejemplo, Int 86) con sus 2 huecos de hechizo.
    equipmentmage: 'characters=demo&open=equipment&class=mage',
    // Hechizo activo del Mago (Fase 20D) con horda y sin recarga: Energy Strike, el de salida. Para lanzarlo:
    // --eval="g.launchCritStrike()"; otro hechizo con atajo a mano: "play=mage&debug=god,horde,crits&spells=massFireStrike".
    activespell: 'play=mage&debug=god,horde,crits',
    // Botín (Fase 21A): Gorn (ejemplo) con un objeto cayendo a su derecha cada pocos segundos. Al pisarlo sale la carta
    // Equip / Keep in bag. Para cogerlo: --eval="g.debugPickUpLoot()".
    loot: 'play=warrior&characters=demo&debug=god,loot',
    lootmage: 'play=mage&characters=demo&debug=god,loot',
    // Atributos (Fase 21B): botín que siempre es arma con ese atributo (Sharp el Guerrero, Ancient la Maga).
    lootsharp: 'play=warrior&characters=demo&debug=god,loot&attr=sharp',
    lootancient: 'play=mage&characters=demo&debug=god,loot&attr=ancient',
    // Baúl compartido (Fase 21D): Kaila (ejemplo) con dos piezas en su inventario y el baúl de ejemplo.
    warehouse: 'characters=demo&open=warehouse&gear=inv:plateMail,inv:helmet',
    // Equipment "solo lo que tienes" (Fase 21D): Gorn con un Plate Mail y un Helmet en el inventario.
    equipmentowned: 'characters=demo&open=equipment&gear=inv:plateMail,inv:helmet,inv:zemstone',
    // Reglas al morir (Fase 21D): Gorn sin Zem / con Zem. Coger el botín y morir:
    // --wait=7000 --eval="(g.debugPickUpLoot(), g.debugKeepLoot(), g.endRun(false))".
    deathnozem: 'play=warrior&characters=demo&debug=god,loot',
    deathzem: 'play=warrior&characters=demo&debug=god,loot&gear=zemstone',
    // Fase 24A: oro (moneda y montón junto al jugador, recogidos por el imán) y armaduras con atributo.
    gold: 'play=warrior&characters=demo&debug=god,pickups&gold=0',
    lootarmor: 'play=warrior&characters=demo&debug=god,loot&attr=hpRecovery',
    // Abaddon's Blood (Fase 21E): Guerrero desbloqueado con una horda. Para morir y ver si revive (y el icono apagado):
    // --eval="new Promise((r) => { g.hurtPlayer(99999, true, 'test'); setTimeout(() => r({ hp: g.player.hp, dead: g.player.isDead }), 1500); })"
    revive: 'play=warrior&unlocks=abaddon&debug=horde',
    // Veneno (Fase 21B): Gorn con su arma Poison en una horda; números verdes que nunca matan.
    poison: 'play=warrior&characters=demo&debug=god,horde&attr=poison',
    slotsempty: 'characters=reset&open=slots',
    // Continue / New Run al elegir un personaje con partida guardada (21-oct-2026).
    runchoice: 'characters=demo&open=runchoice',
    // Select Map (Fase 22A): con los personajes de ejemplo (mapsall: todos abiertos; mapsnew: dispositivo sin ganar nada).
    mapselect: 'characters=demo&open=mapselect',
    mapsall: 'characters=demo&open=mapselect&maps=all',
    mapsnew: 'characters=reset&open=mapselect&maps=reset',
    // La ciudad (Fase 23): andar por la granja de Elvine; townportal = aparecer sobre el teleport (Select Map encima).
    town: 'characters=demo&open=town',
    townportal: 'characters=demo&open=town&town=portal',
    // Fase 23B: junto a William ("Talk" encima); towntalk, con su panel abierto.
    townnpc: 'characters=demo&open=town&town=william',
    towntalk: 'characters=demo&open=town&town=william&talk',
    // Fase 24B: la tienda de la Shop Keeper. shop = nada comprado y oro de sobra; shopsold = Abaddon's Blood y 3 dados
    // comprados ("Sold out", más claros) y poco oro (precios en rojo).
    shop: 'characters=demo&open=town&town=shopKeeper&shop&gold=50000&unlocks=reset',
    shopsold: 'characters=demo&open=town&town=shopKeeper&shop&gold=3000&unlocks=abaddon,dice3,wine1',
    // Traveler Zone (Fase 22A): el mapa de introducción. travelerboss: el Dummy (jefe final) con sus bichos.
    traveler: 'play=warrior&map=traveler',
    travelerboss: 'play=warrior&map=traveler&debug=god,finalboss',
    // Elvine Garden (Fase 22D). elvineboss: el Cyclops (jefe final) con sus esbirros.
    elvine: 'play=warrior&map=elvineGarden',
    elvineboss: 'play=warrior&map=elvineGarden&debug=god,finalboss',
    // Middleland (Fase 22E). middlelandboss: el Unicorn (jefe final) con sus rayos y esbirros.
    middleland: 'play=warrior&map=middleland',
    middlelandboss: 'play=warrior&map=middleland&debug=god,finalboss',
    // Tiempos de carga (Fase 22B): carga inicial y la del mapa, con la red (y en --mobile el procesador) más lentos.
    // loadtime = Guerrero en Bleeding Isle; loadtimetraveler y loadtimemage, las otras dos combinaciones.
    loadtime: 'play=warrior',
    loadtimetraveler: 'play=warrior&map=traveler',
    loadtimeelvine: 'play=warrior&map=elvineGarden',
    loadtimemiddleland: 'play=warrior&map=middleland',
    loadtimemage: 'play=mage',
    loadtimetown: 'characters=demo&open=town',
    // Pantalla de carga (M8), parada a medias para verla: barra, "Loading" y el logo que late.
    loading: 'loading=hold',
    // Pantalla "What's new" (novedades de cada fase), la que abre el link del pie del menú.
    news: 'open=releasenotes',
    // Settings → Controls (Fase 19C): cambiar la tecla / el botón del crit y del panel de stats.
    controls: 'open=controls',
    settings: 'open=settings',
};
/**
 * Simulated connection for the load times (Chrome DevTools numbers): a home connection for the computer and a "fast 4G"
 * phone, whose processor is also slowed down (4× is what Chrome suggests for a mid-range phone).
 */
const LOAD_PROFILES = {
    desktop: { downloadMbps: 50, latencyMs: 20, cpuSlowdown: 1 },
    mobile: { downloadMbps: 9, latencyMs: 60, cpuSlowdown: 4 },
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
            boss: (g.bossInfo?.() ?? []).map((b) => b.name).join(', ') || null,
        };
    }
    const town = game.scene.getScene('Town');
    if (town && (game.scene.isActive('Town') || game.scene.isPaused('Town')) && town.player) {
        state.town = { tile: `${Math.floor(town.player.x / 32)},${Math.floor(town.player.y / 32)}`, paused: game.scene.isPaused('Town') };
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
    const measureLoad = name.startsWith('loadtime');
    const profile = LOAD_PROFILES[mobile ? 'mobile' : 'desktop'];
    if (measureLoad) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
            offline: false, latency: profile.latencyMs, downloadThroughput: (profile.downloadMbps * 1e6) / 8, uploadThroughput: 1e6,
        });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuSlowdown });
        // The browser keeps only 250 downloads by default, and in development the code alone is hundreds of files.
        await page.addInitScript(() => performance.setResourceTimingBufferSize(100000));
    }

    // ?open= (debugStart.ts) shows a menu screen: wait for it instead of the game.
    const openKey = { howtoplay: 'HowToPlay', settings: 'Settings', controls: 'Controls', credits: 'Credits', releasenotes: 'ReleaseNotes', achievements: 'Achievements', select: 'CharacterSelect', slots: 'CharacterSlots', mapselect: 'MapSelect', town: 'Town', charinfo: 'CharacterInfo', equipment: 'Equipment', warehouse: 'Warehouse', runchoice: 'RunChoice' }[params.get('open') ?? ''];
    const target = params.has('loading') ? 'Preload' : params.get('town') === 'portal' ? 'MapSelect' : params.has('shop') ? 'Shop' : params.has('talk') ? 'NpcDialog' : openKey ?? (query ? 'Game' : 'MainMenu');
    await page.goto(url);
    const t0 = Date.now();
    await page.waitForFunction((key) => window.__game?.scene.isActive(key), target, { timeout: LOAD_TIMEOUT_MS });
    const loadS = ((Date.now() - t0) / 1000).toFixed(1);
    const loadTimes = measureLoad ? await page.evaluate(readLoadTimes) : undefined;
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
    if (loadTimes) {
        printLoadTimes(loadTimes, profile);
        writeFileSync(file.replace(/\.jpg$/, '.json'), JSON.stringify({ profile, ...loadTimes }, null, 1));
    }
    if (sim) {
        printSim(sim);
        writeFileSync(file.replace(/\.jpg$/, '.json'), JSON.stringify(sim, null, 1));
    }
    console.log(errors.length ? `  ✗ ${errors.length} console error(s):\n    ${errors.slice(0, 10).join('\n    ')}` : '  ✓ no console errors');
    console.log(`  screenshot: ${file}`);
    return errors.length === 0 && !state.error;
}

/** Load phases (src/systems/LoadTimer.ts) with the MB the browser received during each download. */
function readLoadTimes() {
    const resources = performance.getEntriesByType('resource');
    const phases = (window.__loadTimes ?? []).map((phase) => {
        const downloadedMs = phase.downloadedMs ?? phase.endMs ?? phase.startMs;
        const files = resources.filter((r) => r.startTime >= phase.startMs && r.startTime <= downloadedMs);
        return {
            name: phase.name,
            downloadS: (downloadedMs - phase.startMs) / 1000,
            prepareS: ((phase.endMs ?? downloadedMs) - downloadedMs) / 1000,
            files: files.length,
            mb: files.reduce((sum, r) => sum + (r.encodedBodySize || r.transferSize || 0), 0) / 1048576,
        };
    });
    return { phases };
}

function printLoadTimes({ phases }, profile) {
    console.log(`  network ${profile.downloadMbps} Mbps · ${profile.latencyMs} ms · CPU ×${profile.cpuSlowdown} slower`);
    for (const p of phases) {
        console.log(`    ${p.name.padEnd(20)} ${p.mb.toFixed(1).padStart(5)} MB in ${String(p.files).padStart(3)} files · download ${p.downloadS.toFixed(1)}s · prepare ${p.prepareS.toFixed(1)}s · total ${(p.downloadS + p.prepareS).toFixed(1)}s`);
    }
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
