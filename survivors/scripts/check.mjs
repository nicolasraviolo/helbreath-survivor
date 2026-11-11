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
// CHECK_PORT=8091 pnpm check … usa otro puerto (para probar otra copia del repo mientras la principal ocupa el 8090).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.CHECK_PORT ?? 8090);
const BASE_URL = `http://localhost:${PORT}/`;
const OUT_DIR = join(ROOT, '.check');
const LOAD_TIMEOUT_MS = 90000;
const PHONE = { width: 844, height: 390 };
const DESKTOP = { width: 1000, height: 750 };
/** Console messages that are known and harmless. */
const IGNORED_ERRORS = [/favicon\.ico/];

/** Named situations; anything else is used as the address query as it is. */
/** Off-4B: the bag of the inventory checks (index 1 = Long Sword, 2 = Helmet, 4 = Red Potion, then Blue Potion). */
const OFF_TEST_BAG = 'shortSword,longSword,helmet,targeShield,redPotion,bluePotion,bigRedPotion,greenPotion,slimeJelly';
// Fase Off-7D: medir la caza. Cada offfarm* es un guerrero típico de ese nivel (puntos: 3 por nivel sobre 10 de base en
// STR / DEX / VIT), con el equipo que podría llevar y pociones, al lado de su pit. Caza 60 s (OFF_FARM_SECONDS) y bebe la
// poción de vida más grande por debajo del 50 %; se para si muere. En eval: muertes, experiencia, oro y objetos que caen
// por minuto, daño recibido y pociones bebidas (OffWorldScene.debugFarm). Ver scripts/off-balance.mjs.
const OFF_FARM_SECONDS = 60;
const potions = (id, n) => Array(n).fill(id).join(',');
const OFF_FARM = {
    offfarm1: { level: 1, stats: 'str:10,dex:10,vit:10', gear: 'dagger', bag: potions('redPotion', 5), place: 'traveler', at: '98,83', monster: 'slime' },
    offfarm5: { level: 5, stats: 'str:14,dex:12,vit:16', gear: 'shortSword,woodShield', bag: potions('redPotion', 10), place: 'aresden', at: '128,243', monster: 'slime' },
    offfarm10: { level: 10, stats: 'str:22,dex:18,vit:17', gear: 'longSword,woodShield,leatherArmor', bag: potions('redPotion', 10), place: 'aresden', at: '179,241', monster: 'giantAnt' },
    offfarm15: { level: 15, stats: 'str:26,dex:24,vit:22', gear: 'falchion,targeShield,leatherArmor,chainHose', bag: potions('redPotion', 15), place: 'aresden', at: '214,241', monster: 'snake' },
    offfarm20: { level: 20, stats: 'str:34,dex:30,vit:23', gear: 'broadSword,targeShield,chainMail,chainHose', bag: potions('bigRedPotion', 10), place: 'aresden', at: '243,201', monster: 'orc' },
    offfarm30: { level: 30, stats: 'str:44,dex:40,vit:33', gear: 'claymore,ironShield,chainMail,plateLeggings', bag: potions('bigRedPotion', 15), place: 'promiseland', at: '45,92', monster: 'giantScorpion' },
    offfarm40: { level: 40, stats: 'str:55,dex:50,vit:42', gear: 'greatSword,knightShield,chainMail,plateLeggings,helmet', bag: potions('bigRedPotion', 20), place: 'promiseland', at: '84,204', monster: 'skeleton' },
    offfarm40z: { level: 40, stats: 'str:55,dex:50,vit:42', gear: 'greatSword,knightShield,chainMail,plateLeggings,helmet', bag: potions('bigRedPotion', 20), place: 'promiseland', at: '133,206', monster: 'zombie' },
    offfarm60: { level: 60, stats: 'str:90,dex:60,vit:57', gear: 'flamberge,towerShield,chainMail,plateLeggings,fullHelmet', bag: potions('bigRedPotion', 20), place: 'promiseland', at: '84,204', monster: 'skeleton' },
    offfarm60clay: { level: 60, stats: 'str:90,dex:60,vit:57', gear: 'flamberge,towerShield,chainMail,plateLeggings,fullHelmet', bag: potions('bigRedPotion', 20), place: 'promiseland', at: '197,114', monster: 'clayGolem' },
    offfarm60troll: { level: 60, stats: 'str:90,dex:60,vit:57', gear: 'flamberge,towerShield,chainMail,plateLeggings,fullHelmet', bag: potions('bigRedPotion', 20), place: 'promiseland', at: '106,123', monster: 'troll' },
    offfarm60cyclops: { level: 60, stats: 'str:90,dex:60,vit:57', gear: 'flamberge,towerShield,chainMail,plateLeggings,fullHelmet', bag: potions('bigRedPotion', 20), place: 'promiseland', at: '123,123', monster: 'cyclops' },
    // Sin armadura ni pociones, como la medida de la 7A (para comparar).
    offfarm60naked: { level: 60, stats: 'str:90,dex:60,vit:57', gear: 'flamberge', bag: '', place: 'promiseland', at: '84,204', monster: 'skeleton' },
};
const offFarmUrl = (f) => `off=world&offreset&offfaction=aresden&offlevel=${f.level}&offstats=${f.stats}&offgear=${f.gear}${f.bag ? `&offbag=${f.bag}` : ''}&offplace=${f.place}&offat=${f.at}`;
const offFarmEval = (f) => `o.debugFarm('${f.monster}', ${OFF_FARM_SECONDS}, 0.5)`;
// Fase Off-9C: medir los Raiders. offduel<nivel><clase> pelea OFF_DUEL_FIGHTS veces seguidas (OffDuel, con ?offfast
// para ir más rápido) un guerrero típico de ese nivel (los de offfarm; el 50, entre el 40 y el 60) contra: w Guerrero,
// m Mago, p pareja (con Gorn), i Guerrero invisible. Bebe la poción más grande por debajo del 40 % y usa Critical
// Strike cuando tiene carga. En eval: muertes, empates (más de 150 s), segundos, vida más baja, pociones, críticos y
// parálisis recibidos, y la lista de peleas. Objetivo (propietario, 9-nov-2026): mueres 3 o 4 de cada 10.
const OFF_DUEL_FIGHTS = 10;
const OFF_DUEL_FAST = 8;
// Lejos de pits y de las salidas: junto a la llegada (140,224), el Raider que huía te llevaba por la salida a Aresden.
const OFF_DUEL_AT = '90,80';
// Ojo: las espadas de dos manos no dejan llevar escudo (Off-7E), y con las dos el juego no pone el arma: offfarm30 y
// offfarm40 pelean con los puños. Aquí, sin escudo.
const OFF_DUEL_BUILDS = {
    10: OFF_FARM.offfarm10,
    30: { level: 30, stats: 'str:44,dex:40,vit:33', gear: 'claymore,chainMail,plateLeggings', bag: potions('bigRedPotion', 15) },
    50: { level: 50, stats: 'str:72,dex:55,vit:50', gear: 'greatSword,chainMail,plateLeggings,helmet', bag: potions('bigRedPotion', 20) },
};
const OFF_DUEL_KINDS = { w: ['warrior', false, ''], m: ['mage', false, ''], p: ['pair', false, '&offmerc'], i: ['warrior', true, ''] };
const OFF_DUEL = Object.fromEntries(Object.entries(OFF_DUEL_BUILDS).flatMap(([level, b]) => Object.entries(OFF_DUEL_KINDS).map(([k, [kind, invisible, extra]]) => [
    `offduel${level}${k}`,
    {
        url: `off=world&offreset&offfaction=aresden&offlevel=${b.level}&offstats=${b.stats}&offgear=${b.gear}&offbag=${b.bag}&offplace=promiseland&offat=${OFF_DUEL_AT}&offfast=${OFF_DUEL_FAST}${extra}`,
        eval: `o.debugDuel('${kind}', ${OFF_DUEL_FIGHTS}, ${invisible})`,
    },
])));
// Cada offfarm* guarda su resultado en .check/offfarm.json; offbalance lo lee y lo pasa a la calculadora
// (src/off/dev/offBalance.ts): minutos por nivel, oro frente a precios y magias. Informe en .check/offbalance.json.
const OFF_FARM_FILE = 'offfarm.json';
const readOffFarm = () => (existsSync(join(OUT_DIR, OFF_FARM_FILE)) ? JSON.parse(readFileSync(join(OUT_DIR, OFF_FARM_FILE), 'utf8')) : {});
const offBalanceEval = () => `import('/src/off/dev/offBalance.ts').then((m) => m.offBalanceReport(${JSON.stringify(readOffFarm())}))`;

const PRESETS = {
    menu: '',
    // Fase Off-0: Helbreath Off oculto tras ?off. Pantalla de elegir juego y escena (vacía) de Off.
    gameselect: 'off',
    off: 'off=game',
    // Off-12A: muestrario del estilo nuevo de las ventanas; en eval, los textos que no caben (issues debe salir vacío).
    offuikit: 'off=uikit',
    // Off-13A: el muestrario con la ventana de pregunta abierta (botón Dialog; captura y issues de las dos escenas).
    offuikitdialog: 'off=uikit',
    // Fase Off-1: andar por Traveler Zone. offwalk lo hace correr con clics de mentira hasta detrás de un edificio y en
    // eval sale dónde acaba (PRESET_EVAL; o = escena OffWorld). Otro destino: --eval="o.debugWalkTo(x, y, run)".
    offworld: 'off=world',
    offwalk: 'off=world',
    // Fase Off-2: pits y combate. offpits da los monstruos vivos al entrar; offfight ataca al Slime más cercano (y a
    // los siguientes) y en eval sale la vida del jugador y los monstruos tras 25 s. offrabbit, lo mismo con Rabbits.
    offpits: 'off=world',
    offfight: 'off=world',
    offrabbit: 'off=world',
    // Fase Off-2B: experiencia y niveles. offlevel empieza de cero y mata Slimes 20 s (nivel, experiencia y puntos en
    // eval); offdeath empieza en el nivel 10, muere y en eval sale cuánta experiencia perdió (sin bajar de nivel).
    offlevel: 'off=world&offreset',
    offdeath: 'off=world&offlevel=10',
    // Fase Off-3A: crear personaje. offcreate abre la pantalla sin personaje; offcreated pulsa Warrior y Create y en
    // eval sale lo guardado y la escena a la que llega.
    offcreate: 'off=create&offreset',
    offcreated: 'off=create&offreset',
    // Off-13F (pantalla rehecha). offcreatepad: pistas del mando, nombre al azar, ↓↓ y → (cambia el aspecto) y A (va al
    // primer stat con puntos). offcreatefull: nombre de 10 W, Warrior y A (foco en Create encendido). offcreatecancel:
    // reparte un punto y Cancel pregunta; No se queda en la pantalla.
    offcreatepad: 'off=create&offreset',
    offcreatefull: 'off=create&offreset',
    offcreatecancel: 'off=create&offreset',
    // Select Character de Off (8-nov-2026). offslots: la pantalla con un personaje de nivel 5 en el hueco 1.
    // offslotsnew: Create New Character, crea un Warrior en el hueco 2 y vuelve (en eval: los huecos guardados).
    // offslotsdelete: borra el del hueco 1 con Yes (en eval: lo que queda). offslotsold: un guardado de antes (un solo
    // personaje en hb-off.character) sale en el hueco 1.
    offslots: 'off=slots&offlevel=5&offgear=longSword,leatherArmor',
    offslotsnew: 'off=slots&offlevel=5',
    offslotsdelete: 'off=slots&offlevel=5',
    offslotsold: 'off=slots',
    // Off-13E. offslotsfull: los cuatro huecos llenos (nombre de 10 W y EXP enorme; Create apagado). offslotspad: pistas
    // del mando, hueco 2 (vacío) marcado y foco bajado a los botones (cae en Create; Start y Delete apagados).
    offslotsfull: 'off=slots',
    offslotspad: 'off=slots&offlevel=5',
    offhome: 'off=game',
    // Fase Off-3B (Off-12C: pestaña Stats de la ventana del personaje): offchar la abre en el nivel 5 (12 puntos);
    // offassign reparte 3 en Str y 2 en Vit con los + y Confirm (en eval: stats, puntos y máximos antes y después, y lo
    // guardado). offstamina corre con 5 de
    // estamina (en eval: la estamina y el tiempo de cada paso por el camino). offregen deja vida, maná y estamina a 1
    // y espera 25 s a las tandas.
    offchar: 'off=world&offlevel=5',
    offassign: 'off=world&offlevel=5',
    offstamina: 'off=world&offlevel=5',
    offregen: 'off=world&offlevel=5',
    // Fase Off-3C: pantalla Equipment. offequip la abre con Str 10 y marca la Long Sword (cuadro de stats comparado con
    // la Dagger, Str en rojo). offequipswap, con Str 14: intenta el Helmet (Str 52, no deja), se pone la Long Sword y la
    // Chain Hose, cierra, y en eval salen arma, tiempo de golpe y defensa antes y después, y lo guardado.
    // Off-4B: Equipment solo con lo de la bolsa (lo que te quitas vuelve a ella).
    offequip: 'off=world&offreset&offlevel=5&offstats=str:10&offbag=shortSword,lightAxe,longSword,redPotion',
    // Off-6A: offweaponoff se quita la Dagger (vuelve a la bolsa) y pega con las manos.
    offweaponoff: 'off=world&offreset&offlevel=5',
    offequipswap: 'off=world&offreset&offlevel=5&offstats=str:14&offbag=helmet,shortSword,longSword,chainHose,leatherArmor',
    // Fase Off-4B: inventario. offbag lo abre con 9 objetos y marca la Long Sword (captura; en eval, que el mundo sigue).
    // offbagequip intenta el Helmet (Str 52, no deja) y se pone la Long Sword (la Dagger vuelve a su casilla).
    // offbagdrink bebe una Red Potion con 5 de vida e intenta una Blue Potion con el maná lleno (no la gasta).
    // offbagdrop tira la Short Sword a sus pies. offpotionlimit lleva 20 pociones y pisa una más (se queda en el
    // suelo). offpause abre la pausa (mundo y HUD parados).
    // Fase Off-12B: la ventana del personaje con la bolsa. offbagworst: el peor caso (bolsa llena de 50, nombres con
    // atributos, 9.999.999 de oro, Level 139, poca STR; marca la Critical Claymore). offbagpad recorre toda la ventana
    // con la cruceta (sin callejones) y la cierra con A sobre la ✕.
    offbagworst: 'off=world&offreset&offlevel=139&offstats=str:20&offgold=9999999&offfaction=aresden&offplace=aresden&offopen=bag&offbag=claymore:critical7:hittingProbability7,chainMail:light5:magicResistance3,rapier:poison6:physicalAbsorption5,warAxe:ancient,greatSword:sharp:hittingProbability7,plateMail,helmet,longSword:sharp,targeShield:gold2,slimeJelly,claymore:critical7:hittingProbability7,chainMail:light5:magicResistance3,rapier:poison6:physicalAbsorption5,warAxe:ancient,greatSword:sharp:hittingProbability7,plateMail,helmet,longSword:sharp,targeShield:gold2,slimeJelly,claymore:critical7:hittingProbability7,chainMail:light5:magicResistance3,rapier:poison6:physicalAbsorption5,warAxe:ancient,greatSword:sharp:hittingProbability7,plateMail,helmet,longSword:sharp,targeShield:gold2,slimeJelly,claymore:critical7:hittingProbability7,chainMail:light5:magicResistance3,rapier:poison6:physicalAbsorption5,warAxe:ancient,greatSword:sharp:hittingProbability7,plateMail,helmet,longSword:sharp,targeShield:gold2,slimeJelly,redPotion,redPotion,redPotion,redPotion,redPotion,bigBluePotion,bigBluePotion,bigBluePotion,bigBluePotion,bigBluePotion',
    offbagpad: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offbag: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offbagequip: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offbagdrink: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offbagdrop: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offpotionlimit: `off=world&offreset&offlevel=5&offbag=${Array(10).fill('redPotion').concat(Array(10).fill('bluePotion')).join(',')},shortSword`,
    offpause: 'off=world&offreset&offlevel=5',
    // Off-13B: la pausa propia de Off. offpausequit deja abierta la pregunta de salir (No marcado); offpausequityes
    // contesta Yes (en eval: en OffHome, sin mundo ni HUD); offcontrols abre la ventana Controls (en eval: issues = []).
    offpausequit: 'off=world&offreset&offlevel=5',
    offpausequityes: 'off=world&offreset&offlevel=5',
    offcontrols: 'off=world&offreset&offlevel=5',
    // Fase Off-7B: pociones rápidas y botín con atributos. offquickdrink pulsa Q con 5 de vida (bebe la Big Red Potion
    // primero) y E con 1 de maná; luego Q otra vez y sin pociones rojas ("You have no Health potions."). offspecial abre
    // el inventario con objetos especiales y marca la Sharp Long Sword (captura: nombre verde y atributos). offpoison
    // pega a Slimes con una Rapier Poison y cuenta los envenenados. offlootlevel tira 3000 botines valiosos de Slime,
    // Orc, Clay Golem y Cyclops (qué cae y con qué atributos).
    offquickdrink: 'off=world&offreset&offlevel=5&offbag=redPotion,bigRedPotion,bluePotion,greenPotion',
    offspecial: 'off=world&offreset&offlevel=20&offstats=str:40&offopen=bag&offbag=longSword:sharp:hittingProbability4,chainMail:light5:hpRecovery3,rapier:poison6,targeShield:gold2,warAxe:critical7:experience,redPotion',
    offspecialequip: 'off=world&offreset&offlevel=20&offstats=str:40&offbag=rapier:poison6:physicalAbsorption5,chainMail:light5:magicResistance3,warAxe:critical7:hittingProbability7',
    // offrapier: la Rapier en la mano (Off-7B: antes no se veía). offtintbag: el inventario con armas Sharp / Poison /
    // Ancient (iconos teñidos) y una Sharp Long Sword en la mano. offpoisoncloud: se para en cuanto un Slime está
    // envenenado (captura: la nube verde encima).
    offrapier: 'off=world&offreset&offlevel=20&offstats=str:40&offgear=rapier',
    offtintbag: 'off=world&offreset&offlevel=20&offstats=str:40&offgear=longSword:sharp&offopen=bag&offbag=longSword:sharp,rapier:poison6,warAxe:ancient,scimitar:critical5,longSword',
    offpoisoncloud: 'off=world&offreset&offlevel=5&offstats=str:10&offgear=dagger:poison7',
    offpoison: 'off=world&offreset&offlevel=10&offstats=str:30&offgear=rapier:poison7',
    offlootlevel: 'off=world&offreset',
    // Fase Off-7C: acierto y crítico. offhitrate tira 2000 golpes contra cada monstruo con DEX 20 / 40 / 60 (habilidad
    // DEX × 2 + 50 + DEX sobre 50, ÷ defensa × 50). offhitorc pelea 20 s con Orcs con DEX 40 (en eval: golpes, Miss y
    // acierto real). offcrit pega a Slimes con una Long Sword Critical 7 (en eval: golpes y críticos; captura con
    // números naranjas).
    offhitrate: 'off=world&offreset',
    offbalance: 'off=world&offreset',
    // Off-8A: Critical Strike. offcritstrike (Level 30, máximo 4 cargas, empieza con 5) lanza 3 seguidos contra Slimes
    // y luego espera la recarga (en eval: daño medio normal y del golpe especial, cargas antes / después / guardadas;
    // captura con la esfera roja). offcritnone, sin cargas: Alt no hace nada.
    offcritstrike: 'off=world&offreset&offlevel=30&offstats=str:40,dex:40&offgear=longSword&offcrit=5',
    offcritnone: 'off=world&offreset&offlevel=30&offstats=str:40,dex:40&offgear=longSword&offcrit=0',
    // Off-8B: Guerrero mercenario. offmerchire habla con William junto al teleport de Aresden y lo contrata (en eval:
    // William, oro antes / después y el mercenario; captura con él al lado). offmerc pelea 25 s con Orcs con el Guerrero
    // (en eval: muertes tuyas y suyas, su vida, monstruos que van a por él) y luego lo tumba 3 s (sale "Down" y se
    // levanta). offmercaim: con Heal en RT + A, el stick derecho hacia él lo cura a él; sin stick, a ti.
    offmerchire: 'off=world&offreset&offlevel=20&offfaction=aresden&offplace=aresden&offgold=5000',
    offmerc: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc',
    // offmercportal: con el Guerrero a medio vida, cruza el teleport a Promiseland (en eval: llega contigo, con esa vida).
    offmercportal: 'off=world&offreset&offlevel=40&offfaction=aresden&offplace=aresden&offmerc',
    offmercaim: 'off=world&offreset&offlevel=30&offstats=int:40,mag:40&offgear=noweapon&offspells=heal&offhp=20&offfaction=aresden&offplace=aresden&offmerc',
    // Off-8C: maga mercenaria y Berserk. offmercmage pelea 25 s con Orcs con Kaila (Level 20) empezando con poca vida
    // (en eval: tu vida antes / después, sus magias por tipo, su maná, sus muertes). offmercmagezerk, igual a Level 30
    // durante 15 s: te pone Defense Shield y Berserk (en eval: tu Berserk y escudo; captura con el brillo rojo).
    // offberserk: te lanzas Berserk con las manos vacías (RT + A), coges la Long Sword y pegas a Orcs 12 s; luego sin
    // Berserk otros 12 s (en eval: daño medio de los golpes normales con y sin él, ×2).
    offmercmage: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc=mage&offhp=30',
    offmercmagezerk: 'off=world&offreset&offlevel=30&offstats=str:35,vit:35,dex:35&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc=mage',
    // offmercwindow: abre la ventana de William (captura con las dos ofertas, Gorn y Kaila).
    offmercwindow: 'off=world&offreset&offlevel=20&offfaction=aresden&offplace=aresden&offgold=5000',
    // Off-13B: William rehecho. offmercpoor: Level 40 con 3.000 de oro (Gorn cuesta 4.000 y Kaila 6.000: los dos Hire
    // apagados, foco en Close, "Need ... more gold"). offmerchired: con Gorn contratado (Dismiss y "Replaces Gorn" en
    // Kaila). offmercdismiss: Dismiss pregunta y Yes lo despide (en eval: merc y saved vacíos).
    offmercpoor: 'off=world&offreset&offlevel=40&offfaction=aresden&offplace=aresden&offgold=3000',
    offmerchired: 'off=world&offreset&offlevel=140&offfaction=aresden&offplace=aresden&offgold=9999999&offmerc',
    offmercdismiss: 'off=world&offreset&offlevel=20&offfaction=aresden&offplace=aresden&offgold=5000&offmerc',
    // offholdblows (arreglo de Paralyze): Hold Person a un Clay Golem y le pegas con la Long Sword (en eval: se suelta);
    // luego Paralyze y le pegas 6 s (en eval: sigue quieto y su vida baja).
    offholdblows: 'off=world&offreset&offlevel=60&offstats=str:60,dex:60,int:60,mag:60&offgear=noweapon&offspells=holdPerson,paralyze&offbag=longSword&offfaction=aresden&offplace=promiseland&offat=197,114',
    // offmercparalyze: Kaila (Level 40) con Clay Golems 25 s (en eval: sus magias, incluida Paralyze; no tira daño a uno quieto).
    offmercparalyze: 'off=world&offreset&offlevel=40&offstats=str:60,vit:50,dex:50&offgear=longSword,chainMail&offbag=bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offat=197,114&offmerc=mage',
    // offmercslime: Kaila (Level 20) con Slimes y Ants 20 s (en eval: no gasta Paralyze en ellos).
    offmercslime: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offmerc=mage',
    // Off-8C, el mercenario recoge el botín. offmercloot: junto al teleport, caen 250 de oro, una Long Sword y una Red
    // Potion a unas casillas de ti y te quedas quieto (en eval: a los 3 s siguen en el suelo; a los 15 s Gorn te los ha
    // dado: oro, bolsa, suelo vacío). offmercloot2, lo mismo con Kaila. En un pit con monstruos atacando, pelea primero.
    // offmercdropped: tiras una poción junto al teleport y esperas 10 s (en eval: sigue en el suelo, Gorn no la coge).
    offmercloot: 'off=world&offreset&offlevel=20&offfaction=aresden&offplace=aresden&offmerc',
    offmercloot2: 'off=world&offreset&offlevel=20&offfaction=aresden&offplace=aresden&offmerc=mage',
    offmercdropped: 'off=world&offreset&offlevel=20&offfaction=aresden&offplace=aresden&offbag=redPotion&offmerc',
    // Off-8D, frases y por la espalda. offmercsay: Gorn con Orcs, tú sabes Berserk; pelea 8 s, se queda con poca vida y
    // a los 14 s cae y se levanta (en eval: lo que dijo y cuándo, en segundos, y cuántas veces cada frase; captura con "I'm back!").
    // offmercsaymage: lo mismo con Kaila sin maná ("I'm out of mana!", "Heal me!"). offmercbehind: Gorn; al
    // monstruo con el que pelea se le pone Paralyze (en eval: golpes por la espalda antes / después, su casilla y la del
    // monstruo, adónde mira; a los 4 s, su casilla y la de detrás). Con Clay Golems (aguantan muchos golpes). Si la de
    // detrás está ocupada, pega de frente (behindBlows sigue en 0).
    // offmerczerk: Gorn con Clay Golems y tú sabes Berserk (en eval: dice "Zerk me!").
    // Off-8E, aguantar. offmercregen: Gorn con Orcs a media vida, pelea 32 s (en eval: lo que le dieron las tandas de
    // 15 s, su vida). offmercpotion: a los 3 s se queda al 5 % y se bebe su poción (en eval: pociones, segundos para la
    // siguiente, lo que dice; captura con "I drank my potion!"). offmercflee: sin poción y al 5 %, huye de los Orcs (en
    // eval: huyendo, distancia al monstruo más cerca antes / después, lo que dice) y vuelve a pelear al curarlo al 60 %.
    // offmercfleesafe: lo mismo junto al teleport, sin monstruos: deja de huir a los 8 s y no vuelve a huir.
    // offmercfleemage: Kaila sin maná ni poción al 5 %, huye; con maná otra vez, deja de huir y se cura.
    // Off-9A, Raiders en Promiseland (?offraid: llegan a los 3 s). offraid: un Guerrero Raider viene a por ti; a los
    // 6 s se mira dónde está y luego le pegas 25 s bebiendo si hace falta (en eval: los Raiders, lo que dejan las
    // incursiones, tu vida; captura con el Raider de nombre rojo). offraidmage: lo mismo con un Mago (lanza magias).
    // offraidpair: dos, y Gorn pelea con ellos. offraidmobs: en cuanto llega, el Raider se pone junto a los Trolls,
    // lejos de ti: los monstruos le atacan y él sigue a por ti (en eval: los monstruos que van a por él, su vida y a
    // por quién va, cada segundo).
    offraid: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=warrior',
    offraidmage: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=mage',
    offraidpair: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=pair&offmerc',
    // offraidflee: el Raider se queda al 20 % sin poción y huye; le persigues 30 s (en eval, cada 2 s: su vida, su
    // estamina, si huye y su casilla; al final si se dio la vuelta sin aire, `cornered`, y si murió).
    offraidflee: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=warrior',
    // offraidcast: tú, Mago sin arma, preparas Energy Bolt cada 2 s sin soltarla mientras un Guerrero Raider te pega
    // (en eval: magias perdidas por golpe, `interrupts`). offraidmagehit: le pegas a un Mago Raider (en eval: veces que
    // se aleja, magias que pierde por tus golpes, cuánto tardas en matarlo).
    offraidcast: 'off=world&offreset&offlevel=20&offstats=str:20,vit:30,dex:30,int:30,mag:30&offgear=noweapon&offspells=energyBolt&offbag=bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=warrior',
    offraidmagehit: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=mage',
    // offraidhold: un Mago Raider de nivel 25 (sabe Paralyze) y tú le persigues con espada 30 s (en eval, cada 2 s: si
    // estás paralizado, su distancia, sus parálisis lanzadas / que entraron, sus huidas y vidas). offraidcrit: un
    // Guerrero Raider te pega 25 s sin que le respondas (en eval: sus Critical Strikes y cargas; captura con "Crit!").
    offraidhold: 'off=world&offreset&offlevel=25&offstats=str:35,vit:35,dex:35&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=mage',
    offraidcrit: 'off=world&offreset&offlevel=30&offstats=str:30,vit:60,dex:30&offgear=longSword,chainMail&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=warrior',
    // Off-9B. offraidinvis: llega un Guerrero invisible; mientras no se ve, ¿se le oyen los pasos, se le puede hacer
    // clic, te pega? Al verse, la pelea; al matarlo, +1 Enemy Kill guardado. offraidinvismage: una Maga invisible con
    // Gorn, que no la persigue hasta que se ve. A los 3 s de verse se le deja con 1 de vida para matarlo. offek: la ventana Character con 12 Enemy Kills.
    offraidinvis: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=warrior&offinvis',
    offraidinvismage: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword,leatherArmor&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offraid=mage&offinvis&offmerc',
    offek: 'off=world&offreset&offek=12',
    offraidmobs: 'off=world&offreset&offlevel=40&offstats=str:60,vit:60,dex:50&offgear=longSword,chainMail&offfaction=aresden&offplace=promiseland&offraid=warrior',
    offmercregen: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc',
    offmercpotion: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc',
    offmercflee: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc',
    offmercfleesafe: 'off=world&offreset&offlevel=20&offfaction=aresden&offplace=aresden&offmerc',
    // offmerchard: Gorn (Level 25) con Trolls en Promiseland, para verle beber y huir de verdad (en eval: su vida mínima, pociones, huidas).
    offmerchard: 'off=world&offreset&offlevel=25&offstats=str:60,vit:60,dex:50&offgear=longSword,chainMail&offbag=bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offat=106,123&offmerc',
    offmercfleemage: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc=mage',
    offmercsay: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offspells=berserk&offfaction=aresden&offplace=aresden&offat=243,201&offmerc',
    offmercsaymage: 'off=world&offreset&offlevel=20&offstats=str:30,vit:30,dex:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201&offmerc=mage',
    offmercbehind: 'off=world&offreset&offlevel=40&offstats=str:60,vit:50,dex:50&offgear=longSword,chainMail&offbag=bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offat=197,114&offmerc',
    offmerczerk: 'off=world&offreset&offlevel=40&offstats=str:60,vit:50,dex:50&offgear=longSword,chainMail&offbag=bigRedPotion,bigRedPotion,bigRedPotion&offfaction=aresden&offplace=promiseland&offat=197,114&offspells=berserk&offmerc',
    offberserk: 'off=world&offreset&offlevel=60&offstats=str:40,dex:40,int:60,mag:60&offgear=noweapon&offspells=berserk&offbag=longSword&offfaction=aresden&offplace=aresden&offat=243,201',
    // Off-7D: offarmor abre el inventario con Chain Mail, Tower Shield, Full Helmet y Plate Leggings y marca cada uno
    // (en eval: los cuadros con "Absorb N%"; captura con el de la Chain Mail).
    offarmor: 'off=world&offreset&offlevel=60&offstats=str:90,dex:60&offopen=bag&offbag=towerShield,fullHelmet,plateLeggings,chainMail',
    ...Object.fromEntries(Object.entries(OFF_FARM).map(([k, f]) => [k, offFarmUrl(f)])),
    ...Object.fromEntries(Object.entries(OFF_DUEL).map(([k, d]) => [k, d.url])),
    offhitorc: 'off=world&offlevel=20&offstats=str:30,dex:40&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201',
    offcrit: 'off=world&offreset&offlevel=20&offstats=str:40,dex:40&offgear=longSword:critical7',
    // Fase Off-4A: botín. offlootview mata Slimes 14 s con ?offdrop=all y se para (captura con el botín en el suelo);
    // offloot, lo mismo y luego pisa las casillas con botín (en eval: suelo antes, oro y bolsa después). offbagfull
    // empieza con la bolsa llena (50 Red Potion) y ?offdrop=valuable: lo que pisa se queda en el suelo.
    offlootview: 'off=world&offreset&offlevel=3&offdrop=all',
    // Fase Off-7E: offpath sale del teleport de Aresden y hace un solo clic en la puerta de la tienda (antes se atascaba
    // entre casas); en eval, si llega y se abre la tienda. offtwohand: con un Targe Shield puesto se pone la Claymore
    // (el escudo vuelve a la bolsa) y luego el escudo (la Claymore vuelve). offresume anda un poco por Promiseland junto a la puerta de Aresden (lejos de los pits: si muere, se guarda su ciudad), sale a la
    // pantalla de Off, le da a Play y entra con el personaje del hueco 1: vuelve a la misma casilla. Los objetos del suelo grandes: offlootview.
    offpath: 'off=world&offreset&offlevel=5&offfaction=aresden&offplace=aresden',
    offtwohand: 'off=world&offreset&offlevel=30&offstats=str:60&offgear=targeShield&offopen=bag&offbag=claymore,redPotion',
    offresume: 'off=world&offreset&offlevel=60&offfaction=aresden&offplace=promiseland',
    offloot: 'off=world&offreset&offlevel=3&offdrop=all',
    offbagfull: `off=world&offreset&offlevel=3&offdrop=valuable&offbag=${Array(50).fill('redPotion').join(',')}`,
    // Fase Off-5A: bandos. offportal pisa el portal de Aresden sin bando (sale "Do you want to join Aresden?");
    // offjoin contesta Yes (en eval: sitio, bando y lo guardado; captura en Aresden Farm desde la Off-10C). offaresden / offelvine abren la
    // ciudad de cada bando (Play lleva a la tuya). offcityback, de Elvine: su teleport (eligiendo Traveler Zone, Off-7A) lleva allí y el portal
    // de Elvine de allí vuelve sin preguntar (a la Farm de Elvine desde la Off-10C). offotherportal: siendo de Elvine, el portal de Aresden no deja pasar.
    // offdeathhome: de Aresden, muere en Traveler Zone y reaparece en Aresden Farm (Off-10C).
    offportal: 'off=world&offreset&offlevel=5&offplace=traveler&offat=81,79',
    offjoin: 'off=world&offreset&offlevel=5&offplace=traveler&offat=81,79',
    offaresden: 'off=world&offlevel=5&offfaction=aresden&offplace=aresden',
    offelvine: 'off=world&offlevel=5&offfaction=elvine&offplace=elvine',
    offcityback: 'off=world&offlevel=5&offfaction=elvine&offplace=elvine',
    // Off-13A: la ventana de pregunta nueva (OffDialogScene). offjoinask la deja abierta con las pistas del mando (captura;
    // en eval: foco = No, issues = []). offjoinkeys: Enter nada más abrir no contesta, luego Esc cierra sin unirse.
    // offdeleteask: la de borrar abierta (captura); offdeletelong: con un nombre de 10 W en el hueco 2, Esc no borra.
    offjoinask: 'off=world&offreset&offlevel=5&offplace=traveler&offat=81,79',
    offjoinkeys: 'off=world&offreset&offlevel=5&offplace=traveler&offat=81,79',
    offdeleteask: 'off=slots&offlevel=5',
    offdeletelong: 'off=slots&offlevel=5',
    offotherportal: 'off=world&offlevel=5&offfaction=elvine&offplace=traveler&offat=81,79',
    offdeathhome: 'off=world&offlevel=5&offfaction=aresden&offplace=traveler',
    // Fase Off-10A: las Farms enteras con sus vendedores. offaresdenfarm va hasta el Shop Keeper y habla (se abre la
    // tienda); offelvinefarm, hasta Howard (el almacén). En eval: sitio, vendedores (id, qué abren, casilla) y ventana.
    offaresdenfarm: 'off=world&offlevel=5&offfaction=aresden&offplace=aresdenFarm',
    offelvinefarm: 'off=world&offlevel=5&offfaction=elvine&offplace=elvineFarm',
    // offbase: pisa la base con estandartes de la Farm de Aresden (sale la elección de mapa). offbarracks: en la Farm de
    // Elvine entra por la puerta de los Barracks y sale por la de dentro (vuelve delante de la puerta).
    // Fase Off-10B: los pits de cada Farm, junto a su pit de Slimes. En eval: monstruos vivos de cada tipo al entrar y a los 8 s (se van llenando).
    offaresdenfarmpits: 'off=world&offlevel=5&offfaction=aresden&offplace=aresdenFarm&offat=127,86',
    offelvinefarmpits: 'off=world&offlevel=5&offfaction=elvine&offplace=elvineFarm&offat=138,125',
    // Fase Off-10C: la Farm como casa. offfarmteleport pisa la base de la Farm de Aresden (Select Map con Aresden,
    // Traveler Zone y Promiseland) y elige la ciudad (llega junto a su teleport). offtravelerhome: de Aresden, en Traveler
    // Zone, pisa el portal de Aresden y llega a su Farm. offmapselect: captura de la Select Map abierta desde la Farm.
    offfarmteleport: 'off=world&offlevel=5&offfaction=aresden&offplace=aresdenFarm&offat=45,105',
    offtravelerhome: 'off=world&offlevel=5&offfaction=aresden&offplace=traveler&offat=81,79',
    offmapselect: 'off=world&offlevel=5&offfaction=aresden&offplace=aresdenFarm&offat=45,105',
    offbase: 'off=world&offlevel=5&offfaction=aresden&offplace=aresdenFarm&offat=45,105',
    offbarracks: 'off=world&offlevel=5&offfaction=elvine&offplace=elvineFarm&offat=96,152',
    // Fase Off-5B: tienda, herrero y almacén. offshop / offsmith / offwarehouse los abren (captura); en eval offshop
    // compra una Red Potion, offsmith compra la Long Sword e intenta la Plate Mail (sin oro) y mira la Battle Hammer
    // (Level 110), offsell vende la Long Sword y la Slime Jelly a mitad de precio, offwarehouse guarda la Cape y saca la
    // Long Sword, offdoor pisa la puerta de la tienda de Aresden (se abre) y offelvinedoor la del herrero de Elvine.
    offshop: 'off=world&offlevel=5&offfaction=aresden&offplace=aresden&offgold=500&offopen=shop&offbag=redPotion',
    offsmith: 'off=world&offlevel=5&offstats=str:14&offfaction=aresden&offplace=aresden&offgold=2000&offopen=smith&offbag=redPotion',
    offsell: 'off=world&offlevel=5&offfaction=aresden&offplace=aresden&offgold=100&offopen=shop&offbag=longSword,slimeJelly,redPotion',
    // Off-13D: tienda y herrero con el estilo nuevo. offsmithpad = pistas del mando, lista bajada y la Battle Hammer
    // marcada (no llegas a Str/Level ni al oro); offsellstacks = Sell con montones, vende una Red Potion;
    // offsellask = vender la Long Sword pregunta antes; offsmithempty = Sell con la bolsa vacía; offsmithworst = la
    // ficha más larga (espada con dos atributos) en Sell. En eval, `issues` = [].
    offsmithpad: 'off=world&offlevel=5&offstats=str:14&offfaction=aresden&offplace=aresden&offgold=1820&offopen=smith',
    offsellstacks: `off=world&offlevel=5&offfaction=aresden&offplace=aresden&offgold=1820&offopen=shop&offbag=longSword,${Array(7).fill('redPotion').join(',')},bluePotion,bluePotion,bluePotion,bigRedPotion,bigRedPotion,greenPotion,woodShield`,
    offsellask: 'off=world&offlevel=5&offfaction=aresden&offplace=aresden&offgold=100&offopen=smith&offbag=longSword,redPotion',
    offsmithempty: 'off=world&offlevel=5&offfaction=aresden&offplace=aresden&offgold=100&offopen=smith',
    offsmithworst: 'off=world&offlevel=5&offstats=str:14&offfaction=aresden&offplace=aresden&offgold=9999999&offopen=smith&offbag=claymore:critical7:hittingProbability7,redPotion',
    offwarehouse: 'off=world&offlevel=5&offfaction=elvine&offplace=elvine&offopen=warehouse&offbag=cape,redPotion,redPotion,redPotion,longSword&offwarehouse=longSword:sharp,bluePotion,bluePotion,slimeJelly',
    // Off-13C: almacén con montones. offwarehousepotions = 20 pociones encima (el límite) y una en el almacén: Take sale
    // apagado con el motivo. offwarehousepad = las pistas del mando y el paso de una rejilla a otra. offwarehouseworst =
    // la ficha más larga (dos atributos, Level que no llegas) marcada en el almacén.
    offwarehousepotions: `off=world&offlevel=5&offfaction=elvine&offplace=elvine&offopen=warehouse&offbag=${Array(20).fill('redPotion').join(',')}&offwarehouse=redPotion`,
    offwarehousepad: 'off=world&offlevel=5&offfaction=elvine&offplace=elvine&offopen=warehouse&offbag=cape,redPotion,redPotion&offwarehouse=longSword,bluePotion',
    offwarehouseworst: 'off=world&offlevel=5&offstats=str:14&offfaction=elvine&offplace=elvine&offopen=warehouse&offbag=redPotion,redPotion,slimeJelly&offwarehouse=greatSword:sharp:hittingProbability7,claymore:critical7:hittingProbability7',
    offdoor: 'off=world&offlevel=5&offfaction=aresden&offgold=300&offplace=aresden&offat=128,172',
    offelvinedoor: 'off=world&offlevel=5&offfaction=elvine&offplace=elvine&offgold=300',
    // Fase Off-6A: magias. offmagic abre la pestaña Magic de la tienda (Int 26, 600 de oro); en eval aprende Magic
    // Missile y Fire Ball, e intenta Energy Bolt (sin oro) y Great Heal (sin Int). offbook abre el libro con cuatro magias;
    // en eval pone Fire Ball en F1 (Magic Missile se queda sin tecla) y quita Lightning de su tecla. offbookempty, sin magias.
    offmagic: 'off=world&offlevel=10&offstats=int:26&offfaction=aresden&offplace=aresden&offgold=600&offopen=magic',
    offbook: 'off=world&offlevel=10&offstats=int:50&offfaction=aresden&offplace=aresden&offspells=magicMissile,heal,fireBall,lightning&offopen=book',
    offbookempty: 'off=world&offreset&offlevel=3&offfaction=aresden&offplace=aresden&offopen=book',
    // Fase Off-12C: pestañas Stats y Magic de la ventana del personaje. offstatstab: Stats con 9 puntos y 4 repartidos sin
    // confirmar (captura); offstatsworst: nivel máximo, stats a 200 y muchos Enemy Kills. offspelltab: Magic con cinco
    // magias y Fire Ball marcada; offspellworst: todas las magias, Absolute Magic Protection marcada y en la tecla 4, la
    // lista bajada hasta el final. offtabspad: recorrido con el mando por las pestañas (cabecera, Stats, Magic).
    offstatstab: 'off=world&offreset&offlevel=4&offopen=stats',
    offstatsworst: 'off=world&offreset&offlevel=180&offstats=str:200,vit:200,dex:200,int:200,mag:200&offek=9999999&offopen=stats',
    offspelltab: 'off=world&offreset&offlevel=30&offstats=int:50,mag:30&offspells=magicMissile,heal,energyBolt,fireBall,lightning&offopen=book',
    offspellworst: 'off=world&offreset&offlevel=180&offstats=int:200,mag:200&offspells=all&offopen=book',
    offtabspad: 'off=world&offreset&offlevel=10&offstats=int:50&offspells=magicMissile,heal,fireBall&offopen=bag',
    // Fase Off-12D: LB / RB por las pestañas dando la vuelta, la bolsa recuerda filtro y objeto, y cerrar con puntos
    // sin confirmar avisa una vez (offtabsclose). Captura con las pistas LB / RB a la vista.
    offtabslbrb: 'off=world&offreset&offlevel=10&offstats=int:50&offspells=magicMissile,heal,fireBall&offgear=longSword&offopen=bag',
    offtabsclose: 'off=world&offreset&offlevel=4&offopen=stats',
    // Fase Off-6B: lanzar magias (sin arma, todas aprendidas: F1 Magic Missile, F3 Energy Bolt, F5 Fire Ball, F8 Fire
    // Strike). offcast lanza Energy Bolt al Slime más cercano y en eval sale el maná, los lanzamientos y el Slime;
    // offcastfire, Fire Ball a un Giant Scorpion de Aresden (quemadura); offcastice, Chill Wind (frenado); offcastfail, MAG 10 y nivel 9 con Lightning
    // (círculo 5): falla sin gastar maná; offcastshield, con escudo no deja.
    offcast: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=all',
    offcastfire: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=all&offfaction=aresden&offplace=aresden&offat=101,52',
    offcastice: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=chillWind&offfaction=aresden&offplace=aresden&offat=101,52',
    offcastfail: 'off=world&offlevel=9&offstats=int:20,mag:10&offgear=noweapon&offspells=lightning',
    // Fase Off-11B: las 8 magias nuevas en las teclas 1–8, con INT y MAG 200, junto a los Giant Scorpion de Aresden.
    // Cada una se lanza al monstruo más cercano; en eval, maná, lanzamientos, muertos, heridos (`wounded`) y frenados.
    // offamp pone Absolute Magic Protection (tecla 1) y luego intenta Protection From Magic: comparten hueco.
    offboltline: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=lightningBolt,massLightningArrow,iceStrike,energyStrike,massChillWind,absoluteMagicProtection,lightningStrike,earthShockWave&offfaction=aresden&offplace=aresden&offat=101,52',
    offmassarrow: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=lightningBolt,massLightningArrow,iceStrike,energyStrike,massChillWind,absoluteMagicProtection,lightningStrike,earthShockWave&offfaction=aresden&offplace=aresden&offat=101,52',
    officestrike: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=lightningBolt,massLightningArrow,iceStrike,energyStrike,massChillWind,absoluteMagicProtection,lightningStrike,earthShockWave&offfaction=aresden&offplace=aresden&offat=101,52',
    offenergystrike: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=lightningBolt,massLightningArrow,iceStrike,energyStrike,massChillWind,absoluteMagicProtection,lightningStrike,earthShockWave&offfaction=aresden&offplace=aresden&offat=101,52',
    offmasschill: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=lightningBolt,massLightningArrow,iceStrike,energyStrike,massChillWind,absoluteMagicProtection,lightningStrike,earthShockWave&offfaction=aresden&offplace=aresden&offat=101,52',
    offlightningstrike: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=lightningBolt,massLightningArrow,iceStrike,energyStrike,massChillWind,absoluteMagicProtection,lightningStrike,earthShockWave&offfaction=aresden&offplace=aresden&offat=101,52',
    offearthshock: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=lightningBolt,massLightningArrow,iceStrike,energyStrike,massChillWind,absoluteMagicProtection,lightningStrike,earthShockWave&offfaction=aresden&offplace=aresden&offat=101,52',
    // Fase Off-11C: las 4 magias de los círculos 8–10 en las teclas 1–4, con INT y MAG 200, junto a los Giant Scorpion
    // de Aresden (como las de la 11B). En eval: maná, lanzamientos, muertos, heridos y frenados.
    // offmercmagehigh: Kaila a Level 140 pelea 20 s con los Giant Scorpion (en eval: sus magias por nombre).
    offmassicestrike: 'off=world&offlevel=140&offstats=int:200,mag:200&offgear=noweapon&offspells=massIceStrike,meteorStrike,massMagicMissile,blizzard&offfaction=aresden&offplace=aresden&offat=101,52',
    offmeteor: 'off=world&offlevel=140&offstats=int:200,mag:200&offgear=noweapon&offspells=massIceStrike,meteorStrike,massMagicMissile,blizzard&offfaction=aresden&offplace=aresden&offat=101,52',
    offmassmissile: 'off=world&offlevel=140&offstats=int:200,mag:200&offgear=noweapon&offspells=massIceStrike,meteorStrike,massMagicMissile,blizzard&offfaction=aresden&offplace=aresden&offat=101,52',
    offblizzard: 'off=world&offlevel=140&offstats=int:200,mag:200&offgear=noweapon&offspells=massIceStrike,meteorStrike,massMagicMissile,blizzard&offfaction=aresden&offplace=aresden&offat=101,52',
    offmercmagehigh: 'off=world&offreset&offlevel=140&offstats=str:100,vit:100,dex:100&offgear=longSword&offfaction=aresden&offplace=aresden&offat=101,52&offmerc=mage',
    offamp: 'off=world&offlevel=180&offstats=int:200,mag:200&offgear=noweapon&offspells=absoluteMagicProtection,protectionFromMagic',
    offcastshield: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon,targeShield&offspells=all',
    // Fase Off-11A: varitas. offwandcast lanza Energy Bolt (15 de maná) con la Magic Wand (MS20) en la mano: gasta 12;
    // offwandsword, con Long Sword no deja; offwandsmith abre Tom con la sección Wands; offwandbook, el libro con la
    // Berserk Wand (MS20): cada magia cuesta un 20 % menos y 20 más.
    offwandcast: 'off=world&offlevel=60&offstats=int:50,mag:50&offgear=magicWandMS20&offspells=all',
    offwandsword: 'off=world&offlevel=60&offstats=int:50,mag:50,str:20&offgear=longSword&offspells=all',
    offwandsmith: 'off=world&offlevel=40&offstats=str:14&offfaction=aresden&offplace=aresden&offgold=3000&offopen=smith',
    offwandbook: 'off=world&offlevel=100&offstats=int:60&offfaction=aresden&offplace=aresden&offgear=berserkWandMS20&offspells=magicMissile,heal,fireBall,lightning,berserk&offopen=book',
    // Fase Off-6C: offheal empieza con 5 de vida y lanza Heal (tecla 1); offshield pone Defense Shield (2) y luego
    // intenta Protection From Magic (6): no hace nada (comparten hueco); offhold, Hold Person (3) a un Slime;
    // offpadcast, RT + B (Defense Shield) y RT + X (Hold Person) como el mando; offbookpad (Off-12C), RT + Y pone Fire Ball
    // en la tecla 4, otra vez la quita, y RT + A la pone en la 1.
    offheal: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offhp=5&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offshield: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    // offprotect: Protection From Magic (6): el círculo blanco bajo los pies mientras dura.
    // offdefenseaura: Defense Shield (2) y su aura bajo los pies.
    offdefenseaura: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offprotect: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offhold: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offpadcast: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    // 9-nov-2026 (propietario): offcastrun anda con el stick, lanza RT + A sin soltarlo (se queda quieto) y luego lo
    // suelta y lo vuelve a empujar (anda); offpadaim mueve el stick derecho poco y del todo (mirilla cerca y lejos) y
    // lanza hacia la derecha; offpadcross mantiene RT: sale la cruz y la magia se lanza sin soltar RT.
    offcastrun: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=magicMissile,fireBall,heal,lightning',
    offpadaim: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=magicMissile,fireBall,heal,lightning',
    // 11-nov-2026: elegir monstruo con el stick derecho (ver la evaluación de offpadtarget).
    offpadtarget: 'off=world&offlevel=30',
    offpadcross: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=magicMissile,fireBall,heal,lightning',
    offbookpad: 'off=world&offlevel=30&offstats=int:50&offfaction=aresden&offplace=aresden&offspells=heal,defenseShield,holdPerson,fireBall,lightning&offopen=book',
    // Fase Off-5C: la ciudad entera. offcitypits / offelvinepits dan los monstruos vivos de cada tipo en Aresden / Elvine
    // (8 pits: 1 Slime, 2 Giant Ant, 2 Snake, 2 Orc, 1 Giant Scorpion); offorc pelea 20 s junto al pit de Orcs del
    // este de Aresden (Level 20, Long Sword); offscorpion, lo mismo con el Giant Scorpion del norte.
    offcitypits: 'off=world&offlevel=5&offfaction=aresden&offplace=aresden',
    offelvinepits: 'off=world&offlevel=5&offfaction=elvine&offplace=elvine',
    offorc: 'off=world&offlevel=20&offstats=str:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201',
    offscorpion: 'off=world&offlevel=20&offstats=str:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=101,52',
    // Fase Off-7A: Promiseland. offteleport pisa el teleport de Aresden (sale Select Map: Aresden Farm, Traveler Zone, Promiseland; Off-10C) y elige
    // Promiseland (en eval: sitio y casilla, abajo). offpromiseland / offpromiselandelvine abren Promiseland siendo de
    // Aresden (abajo) o de Elvine (arriba) y dan los monstruos vivos. offpromiselandback pisa la puerta de Aresden y
    // vuelve a la Farm (Off-10C); offpromiselandother pisa la de Elvine siendo de Aresden (no deja pasar). offskeleton y
    // offtroll pelean 20 s junto a su pit (Level 40 y 80, Long Sword).
    offteleport: 'off=world&offlevel=40&offfaction=aresden&offplace=aresden',
    // Off-13B: Select Map como ventana de Off. offmapselect la deja abierta desde Aresden (3 tarjetas; pistas del mando;
    // en eval: from, places, focus e issues = []); offmapselectfarm desde Aresden Farm y offmapselectnone sin bando (2).
    offmapselect: 'off=world&offlevel=40&offfaction=aresden&offplace=aresden',
    offmapselectfarm: 'off=world&offlevel=40&offfaction=elvine&offplace=elvineFarm',
    offmapselectnone: 'off=world&offlevel=40&offfaction=none&offplace=traveler',
    offpromiseland: 'off=world&offlevel=40&offfaction=aresden&offplace=promiseland',
    offpromiselandelvine: 'off=world&offlevel=40&offfaction=elvine&offplace=promiseland',
    offpromiselandback: 'off=world&offlevel=40&offfaction=aresden&offplace=promiseland',
    offpromiselandother: 'off=world&offlevel=40&offfaction=aresden&offplace=promiseland&offat=126,24',
    offskeleton: 'off=world&offlevel=40&offstats=str:60&offgear=longSword&offfaction=aresden&offplace=promiseland&offat=96,204',
    // offcyclops: Level 100 quieto a 2 casillas del pit del Cyclops; en eval, la vida cada segundo (le lanza Fire Strike).
    offcyclops: 'off=world&offlevel=100&offstats=vit:150&offfaction=aresden&offplace=promiseland&offat=135,140',
    offtroll: 'off=world&offlevel=80&offstats=str:100,vit:80&offgear=longSword&offfaction=aresden&offplace=promiseland&offat=115,140',
    game: 'play',
    levelup: 'debug=levelup',
    // Fase 21½A: todas las cartas Epic (marco morado, cinta, brillo y sonido).
    epic: 'debug=epic,levelup',
    // Cartas de poder (1-nov-2026): todo al máximo (Epic) → solo cartas de oro y vida; y la Maga con todo al máximo y horda (FPS).
    maxcards: 'play=warrior&debug=maxcards,levelup',
    maxcardsmage: 'play=mage&debug=maxcards,horde', // con --cards --wait=10000: la horda sin pausas
    epicstones: 'play=warrior&debug=epic,stones,levelup', // Fase 28½A: Epic Stone cards that go up 1/5 and say +0% → +20%
    // Fase 21½B: 3 Reroll y 3 Skip comprados, con las cartas abiertas.
    rerollskip: 'unlocks=dice3,wine3&debug=levelup',
    // Fase 21½C: un Champion a los 3 segundos (usar --wait=6000 para verlo en la captura).
    champion: 'debug=god,champion',
    boss: 'debug=god,boss',
    // Fase 29A: Howard secuestrado y su Guard junto al jugador en Traveler Zone (sin god: el Guard tiene que pegar).
    rescue: 'play=warrior&map=traveler&rescued=reset&debug=rescue',
    // Fase 29A: la ciudad sin nadie rescatado (solo William) y con todos.
    townnobody: 'characters=demo&open=town&rescued=reset',
    townall: 'characters=demo&open=town&rescued=all',
    // Fase 29B: Missions de William sin nadie rescatado, con Howard, y con todos (Gorn de ejemplo, Level 25 o así).
    missions: 'characters=demo&open=town&town=william&rescued=reset&maps=reset&missions',
    missionsone: 'characters=demo&open=town&town=william&rescued=howard&missions',
    missionsall: 'characters=demo&open=town&town=william&rescued=all&missions',
    // Fase 29C: logros que se acumulan, con contadores a medias (sin achievements=reset, el resto se queda como esté).
    achievementprogress: 'achievements=reset&kills=slime:312,snake:4999,orc:1999,cyclops:12&open=achievements',
    // Fase 29C: Traveler Zone con 2,999 Slimes y 4,999 Snakes ya contados y una horda: a los pocos segundos, "Slime Squasher".
    killcount: 'achievements=reset&kills=slime:2999,snake:4999,cat:7&play=warrior&map=traveler&debug=god,horde',
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
    // Fase 27B: Bunnies y Ants de Traveler Zone alrededor, que se paran con un "!" y embisten (--wait=3000 para verlos cargar).
    charge: 'map=traveler&debug=god,charge',
    // Fase 27C: una mezcla de todas las formas de moverse alrededor (deambular, rodear, embestir y los que guardan distancia).
    movement: 'map=traveler&debug=god,movement',
    // Fase 28¾: Orcs de cerca con y sin el filtro xBR (comparar las dos capturas y los FPS).
    orcs: 'map=traveler&debug=god,orcs,orcs,orcs,orcs,orcs',
    casters: 'map=traveler&debug=god,casters',
    // Magias de monstruos (1-nov-2026): casters = corro de normales que lanzan; los jefes con su hechizo nuevo.
    demonspell: 'map=bisle&debug=god,boss,boss',
    hellhoundspell: 'map=elvineGarden&debug=god,boss',
    cyclopsspell: 'map=elvineGarden&debug=god,finalboss',
    lizardspell: 'map=middleland&debug=god,boss,boss',
    orcsnosmooth: 'map=traveler&debug=god,orcs,orcs,orcs,orcs,orcs,nosmooth',
    // Fase 28¾B: partida con horda, élites, dagas y angelitos con y sin el filtro xBR en todo lo que se mueve.
    smooth: 'play=warrior&debug=god,horde,horde,elites,daggers,angels,pickups',
    nosmooth: 'play=warrior&debug=god,horde,horde,elites,daggers,angels,pickups,nosmooth',
    // Fase 28A: el Eye of the Storm (frena) en rango 3 con una horda alrededor.
    aura: 'debug=god,aura,horde',
    daggers: 'play=warrior&debug=god,daggers,horde',
    // Fase 28C: los Tutelary Angels en rango 3 disparando a una horda.
    angels: 'play=warrior&debug=god,angels,horde',
    levelpace: 'debug=sim',
    // Lo mismo en Elvine Garden (Fase 22D).
    levelpaceelvine: 'debug=sim&map=elvineGarden',
    levelpacemiddleland: 'debug=sim&map=middleland',
    levelpaceicebound: 'debug=sim&map=icebound',
    // Critical Strike (Fase 19A): Guerrero con una horda alrededor y cargas infinitas. Para lanzarlo:
    // --eval="g.launchCritStrike()"; con --mobile se ve el botón de la espada roja.
    crit: 'play=warrior&debug=god,horde,crits',
    // Hachas (bloque B): Guerrero con una Light Axe girando en una horda. Crit de dos giros: --eval="g.launchCritStrike()".
    axe: 'play=warrior&weapon=lightAxe&debug=god,horde,crits',
    // La Battle Axe (Str 80), la más grande, para ver el dibujo en la mano y el círculo más ancho.
    battleaxe: 'play=warrior&weapon=battleAxe&debug=god,horde',
    // Ritmo de partida con un hacha (comparar con levelpace, que lleva la daga de salida).
    levelpaceaxe: 'debug=sim&weapon=lightAxe',
    // Martillos (bloque C): golpe al suelo con onda y grieta en una horda. Crit con grieta larga: --eval="g.launchCritStrike()".
    hammer: 'play=warrior&weapon=hammer&debug=god,horde,crits',
    // El Battle Hammer (Str 95), para ver el dibujo en la mano.
    battlehammer: 'play=warrior&weapon=battleHammer&debug=god,horde',
    // Ritmo de partida con un martillo.
    levelpacehammer: 'debug=sim&weapon=hammer',
    // Meteor Strike del Mago (Fase 19B): horda alrededor y sin recarga. Para lanzarlo: --eval="g.launchCritStrike()"
    // (el mismo botón que el crit); con --wait da tiempo a que caiga y explote.
    meteor: 'play=mage&debug=god,horde,crits',
    // Logros (Fase 14B): empezar sin ninguno y subir a nivel 21 → aviso de "Rising Star" (y "Survivor" con +5 minutos).
    // Usar con --cards: si no, la partida se queda en las cartas.
    achievements: 'achievements=reset&debug=god,levels,levels,levels,levels,minute,minute,minute,minute,minute',
    // Pantalla Achievements con todos conseguidos.
    achievementlist: 'achievements=all&open=achievements',
    // Select Character (Fase 17A): Gorn y Kaila de ejemplo y dos huecos bloqueados (slotsempty = Gorn y Kaila nuevos).
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
    // Fase 26D: Ice Strike / Mass Ice Strike con horda (--eval="g.launchCritStrike()" lo lanza; ralentiza y tiñe de azul).
    icestrike: 'play=mage&debug=god,horde,crits&spells=iceStrike',
    // Elementos y quemadura (4-nov-2026): Fire Ball + Meteor Strike con horda; --eval="g.launchCritStrike()" lanza el
    // meteoro (números rosas/grises según el elemento, naranjas y llamita en los que arden).
    meteor: 'play=mage&debug=god,horde,crits&spells=fireBall,meteorStrike',
    massicestrike: 'play=mage&debug=god,horde,crits&spells=massIceStrike',
    // Fase 26E: hechizos en línea (con --eval="g.launchCritStrike()" se lanzan).
    bloodyshock: 'play=mage&debug=god,horde,crits&spells=bloodyShockWave',
    earthshock: 'play=mage&debug=god,horde,crits&spells=earthShockWave',
    blizzard: 'play=mage&debug=god,horde,crits&spells=blizzard',
    // El Libro Azul junto a Kaila (con --eval="g.debugPickUpLoot()" se coge y se aprende).
    bluebook: 'play=mage&characters=demo&debug=god,bluebook',
    // Equipment de Kaila con Bloody Shock Wave aprendido (sale en rojo: le falta Int).
    equipmentlearned: 'characters=demo&open=equipment&class=mage&gear=learn:bloodyShockWave',
    // Fase 26A: la Maga con horda (lanza con --eval) y con el maná a 0 para verlo rellenarse.
    mana: 'play=mage&debug=god,horde',
    nomana: 'play=mage&debug=god,nomana',
    // Regeneración por tandas: vida a 1 y maná a 0; con --wait=21000 se ven los dos mensajes abajo a la izquierda.
    regen: 'play=mage&debug=god,onehp,nomana',
    // Fase 26B (con --mobile): un dedo de mentira arrastra a la derecha el botón del hechizo; sale el anillo donde caerá.
    // Para soltarlo y lanzarlo hacia allí: --eval="g.debugReleaseSpellDrag()".
    spelldrag: 'play=mage&debug=god,horde,spelldrag',
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
    // Revisión del original C: botín con valor y segundo atributo. lootvalues = armadura HP Recovery 7 + Physical
    // Absorption 5 (la carta con dos líneas); lootweapon = Poison 7 + Gold 6; valuesinv = inventario y herrero con valores.
    lootvalues: 'play=warrior&characters=demo&debug=god,loot&attr=hpRecovery:7&attr2=physicalAbsorption:5',
    lootweapon: 'play=warrior&characters=demo&debug=god,loot&attr=poison:7&attr2=gold:6',
    valuesinv: 'characters=demo&open=town&town=tom&smith=sell&gold=100&gear=hpRecovery.7.physicalAbsorption.5:plateMail,defenseRatio.3:helmet,sharp.0.hittingProbability.4:longSword,inv:plateMail',
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
    // Delante de la puerta de los Barracks (31-oct-2026); pisarla entra a entrenar.
    townbarracks: 'characters=demo&open=town&town=barracks',
    // Fase 23B: junto a William ("Talk" encima); towntalk, con su panel abierto.
    townnpc: 'characters=demo&open=town&town=william',
    towntalk: 'characters=demo&open=town&town=william&talk',
    // Fase 24B: la tienda de la Shop Keeper. shop = nada comprado y oro de sobra; shopsold = Abaddon's Blood y 3 dados
    // comprados ("Sold out", más claros) y poco oro (precios en rojo).
    shop: 'characters=demo&open=town&town=shopKeeper&shop&gold=50000&unlocks=reset',
    shopsold: 'characters=demo&open=town&town=shopKeeper&shop&gold=3000&unlocks=abaddon,dice3,wine1',
    // Revisión del original D: los tintes. dye = Gorn con capa teñida (Indigo) y botas, oro de sobra; dyemage = Kaila con
    // túnica roja; dyenone = sin ropa que teñir; dyetown = la ciudad con Gorn teñido; dyecharinfo = su ventana Character.
    dye: 'characters=demo&gear=dye1:cape,longBoots&open=town&town=shopKeeper&dye&gold=50000',
    dyemage: 'characters=demo&gear=dye14:robe&open=town&class=mage&town=shopKeeper&dye&gold=50000',
    dyenone: 'characters=demo&open=town&town=shopKeeper&dye&gold=50000',
    dyetown: 'characters=demo&gear=dye14:cape,dye10:longBoots&open=town&town=shopKeeper',
    dyecharinfo: 'characters=demo&gear=dye14:cape,dye10:longBoots&open=charinfo',
    // Fase 24C: el herrero Tom. smith = Buy con 5.000 de oro (Gorn: lo que no puede llevar, en rojo); smithsell = Sell
    // con objetos en el inventario (con atributo, sin él y dos Stone of Xelima).
    smith: 'characters=demo&open=town&town=tom&smith=buy&gold=5000',
    smithsell: 'characters=demo&open=town&town=tom&smith=sell&gold=100&gear=sharp:longSword,inv:plateMail,inv:xelimaStone,inv:xelimaStone',
    // Fase 24D: Upgrade de Tom (Gorn, el Guerrero) con 20.000 de oro y 5 piedras; en el inventario, una Long Sword +2 y una Sharp Long Sword.
    // Para mejorar a mano: --eval="(s => (s.choose(1), s.act(), s.act(), s.notice))(game.scene.getScene('Smith'))".
    smithupgrade: 'characters=demo&class=warrior&open=town&town=tom&smith=upgrade&gold=20000&xelima=5&gear=up2:longSword,sharp:longSword',
    // Fase 24D: partida con la daga a +3 (+30% de daño). --eval="g.stats.attributeBonus" debe dar 0.3.
    upgradedmg: 'play=warrior&upgrade=3',
    // Fase 24C: la Stone of Xelima cae del 5% de los monstruos (horda para que salga pronto).
    xelima: 'play=warrior&characters=demo&debug=god,horde,xelima',
    // Traveler Zone (Fase 22A): el mapa de introducción. travelerboss: el Dummy (jefe final) con sus bichos.
    traveler: 'play=warrior&map=traveler',
    travelerboss: 'play=warrior&map=traveler&debug=god,finalboss',
    // Elvine Garden (Fase 22D). elvineboss: el Cyclops (jefe final) con sus esbirros.
    elvine: 'play=warrior&map=elvineGarden',
    elvineboss: 'play=warrior&map=elvineGarden&debug=god,finalboss',
    // Middleland (Fase 22E). middlelandboss: el Unicorn (jefe final) con sus rayos y esbirros.
    middleland: 'play=warrior&map=middleland',
    middlelandboss: 'play=warrior&map=middleland&debug=god,finalboss',
    // Icebound (Fase 30A). iceboundfrost: el Frost (Ice Strike); iceboundnizie: el Nizie (Chill Wind en fila);
    // iceboundboss: el Tigerworm (cadena de rayos) con sus esbirros. Las marcas: --eval="g.enemyShots.strikes.active.length".
    icebound: 'play=warrior&map=icebound',
    // Barracks (31-oct-2026): entrenamiento con muñecos (data/training.ts). barracksmage: con la Maga.
    barracks: 'play=warrior&map=barracks',
    barracksmage: 'play=mage&map=barracks',
    iceboundnosmooth: 'play=warrior&map=icebound&debug=nosmooth',
    iceboundfrost: 'play=warrior&map=icebound&debug=god,boss',
    iceboundnizie: 'play=warrior&map=icebound&debug=god,boss,boss',
    iceboundboss: 'play=warrior&map=icebound&debug=god,finalboss',
    // Objetos únicos (Fase 30B). unique: Gorn mata al Tigerworm y cae la Sword of Ice Elemental (brillo morado y cartel);
    // con --eval="g.debugPickUpLoot()" sale su carta. uniquewarehouse: lo mismo con Kaila (la espada va al baúl).
    // uniquesword: Gorn con la espada en una horda (ralentiza lo que golpea). icestorm: la Maga con Ice Storm y horda
    // (--eval="g.launchCritStrike()" lo lanza).
    unique: 'play=warrior&characters=demo&map=icebound&debug=god,finalboss,bosskill&unique=iceElementalSword',
    uniquewarehouse: 'play=mage&characters=demo&map=icebound&debug=god,finalboss,bosskill&unique=iceElementalSword',
    uniquesword: 'play=warrior&debug=god,horde&weapon=iceElementalSword',
    icestorm: 'play=mage&debug=god,horde,crits&spells=iceStorm',
    // Tiempos de carga (Fase 22B): carga inicial y la del mapa, con la red (y en --mobile el procesador) más lentos.
    // loadtime = Guerrero en Bleeding Isle; loadtimetraveler y loadtimemage, las otras dos combinaciones.
    loadtime: 'play=warrior',
    loadtimetraveler: 'play=warrior&map=traveler',
    loadtimeelvine: 'play=warrior&map=elvineGarden',
    loadtimemiddleland: 'play=warrior&map=middleland',
    loadtimeicebound: 'play=warrior&map=icebound',
    loadtimemage: 'play=mage',
    loadtimetown: 'characters=demo&open=town',
    // Pantalla de carga (M8), parada a medias para verla: barra, "Loading" y el logo que late.
    loading: 'loading=hold',
    // Pantalla "What's new" (novedades de cada fase), la que abre el link del pie del menú.
    news: 'open=releasenotes',
    // Settings → Controls (Fase 19C): cambiar la tecla / el botón del crit y del panel de stats.
    controls: 'open=controls',
    settings: 'open=settings',
    transfer: 'open=transfer',
    settingsgameplay: 'open=settings&tab=gameplay',
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
/** Situations that run an expression of their own when no --eval is given. */
// Off-8D: what the mercenary says: 8 s of fight, then low health (its potion spent, Off-8E), then down and up again at 14 s (offmercsay, offmercsaymage).
const OFF_MERC_SAY_EVAL = "new Promise((r) => { const t0 = Date.now(); const heard = []; let last; const w = setInterval(() => { const s = o.debugState().mercSaying; if (s && s !== last) heard.push(`${Math.round((Date.now() - t0) / 100) / 10}s ${s}`); last = s; }, 200); const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); setTimeout(() => { o.battle.merc.potionLeftMs = 60000; o.debugMercHp(5); }, 8000); setTimeout(() => { clearInterval(t); o.debugMercDown(2000); setTimeout(() => { clearInterval(w); const s = o.debugState(); r({ heard, said: s.mercSaid, saying: s.mercSaying, merc: s.merc }); }, 2600); }, 14000); })";

const PRESET_EVAL = {
    // Fase Off-1: runs to (112,100), then to (137,100), on the far side of a building (x 122–134): it must go round.
    offwalk: 'o.debugWalkTo(112, 100, true), new Promise((r) => setTimeout(() => { o.debugWalkTo(137, 100, true); setTimeout(() => r(o.debugState()), 9000); }, 5000))',
    // Fase Off-2: the monsters of the pits when the world opens.
    offpits: 'o.debugState()',
    // Fase Off-2: fights the nearest Slime (a new one each time the last dies) for 25 s; the states on the way.
    offfight: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); r({ start: log[0], mid: log[12], end: log[log.length - 1] }); }, 25000); })",
    // Fase Off-2B: kills Slimes for 20 s from level 1; level, experience and points before and after.
    offlevel: "new Promise((r) => { const start = o.debugState(); const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 1000); setTimeout(() => { clearInterval(t); r({ start, end: o.debugState() }); }, 20000); })",
    // Fase Off-2B: 200 experience into level 10, dies (as a monster's last blow would); the experience before and after coming back.
    offpath: "new Promise((r) => { const start = o.debugState().tile; o.debugWalkTo(126, 166, true); const t0 = Date.now(); const t = setInterval(() => { const open = game.scene.isActive('OffStore'); const s = o.debugState(); if (open || Date.now() - t0 > 45000) { clearInterval(t); r({ start, open, tile: s.tile, moving: s.moving, seconds: Math.round((Date.now() - t0) / 1000) }); } }, 500); })",
    offtwohand: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffBag'); const claymore = inv.use(0); const one = (({ equipment, bag }) => ({ equipment, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))); const shield = inv.use(inv.debugState().bag.indexOf('targeShield')); const two = (({ equipment, bag }) => ({ equipment, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))); r({ claymore, one, shield, two }); }, 1000))",
    offresume: "new Promise((r) => { o.debugWalkTo(136, 216, true); setTimeout(() => { const before = o.debugState().tile; o.scene.start('OffHome'); setTimeout(() => { const saved = JSON.parse(localStorage.getItem('hb-off.character')).where; game.scene.getScene('OffHome').play(); setTimeout(() => game.scene.getScene('OffSlots').enter(0), 1000); setTimeout(() => { const s = game.scene.getScene('OffWorld').debugState(); r({ before, saved, after: { place: s.place, tile: s.tile } }); }, 6000); }, 1000); }, 7000); })",
    offportal: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => r({ confirm: game.scene.isActive('OffDialog'), worldPaused: game.scene.isPaused('OffWorld'), state: o.debugState().place }), 3000))",
    offjoin: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => { const asked = game.scene.isActive('OffDialog'); game.scene.getScene('OffDialog').answer(1); setTimeout(() => { const s = o.debugState(); r({ asked, place: s.place, faction: s.faction, tile: s.tile, hp: s.hp, saved: JSON.parse(localStorage.getItem('hb-off.character')).faction }); }, 4000); }, 3000))",
    offcityback: "new Promise((r) => { const start = o.debugState().place; o.debugWalkTo(237, 140); setTimeout(() => { game.scene.getScene('OffMapSelect').choose('traveler'); }, 2500); setTimeout(() => { const s = o.debugState(); const mid = [s.place, s.tile]; o.debugWalkTo(128, 79); setTimeout(() => { const e = o.debugState(); r({ start, mid, end: [e.place, e.tile], asked: game.scene.isActive('OffDialog') }); }, 6000); }, 5000); })",
    offjoinask: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => { const d = game.scene.getScene('OffDialog'); d.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffDialog'), worldPaused: game.scene.isPaused('OffWorld'), ...d.debugState() }), 300); }, 3000))",
    offjoinkeys: "o.debugWalkTo(81, 76), new Promise((r) => { const key = (k, c) => { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k, keyCode: c, bubbles: true })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: k, code: k, keyCode: c, bubbles: true })), 50); }; const t = setInterval(() => { if (!game.scene.isActive('OffDialog')) return; clearInterval(t); key('Enter', 13); setTimeout(() => { const afterEnter = game.scene.isActive('OffDialog'); const focus = game.scene.getScene('OffDialog').debugState().focus; key('Escape', 27); setTimeout(() => { const s = o.debugState(); r({ afterEnter, focus, open: game.scene.isActive('OffDialog'), worldPaused: game.scene.isPaused('OffWorld'), faction: s.faction, place: s.place }); }, 600); }, 400); }, 16); })",
    offdeleteask: "new Promise((r) => { game.scene.getScene('OffSlots').deleteFocused(); setTimeout(() => { const d = game.scene.getScene('OffDialog'); d.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffDialog'), ...d.debugState() }), 300); }, 600); })",
    offdeletelong: "new Promise((r) => { const key = (k, c) => { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k, keyCode: c, bubbles: true })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: k, code: k, keyCode: c, bubbles: true })), 50); }; const c = JSON.parse(localStorage.getItem('hb-off.character')); c.name = 'WWWWWWWWWW'; localStorage.setItem('hb-off.character.2', JSON.stringify(c)); const sl = game.scene.getScene('OffSlots'); sl.scene.restart({ focus: 1 }); setTimeout(() => { game.scene.getScene('OffSlots').deleteFocused(); setTimeout(() => { const d = game.scene.getScene('OffDialog'); const state = d.debugState(); key('Escape', 27); setTimeout(() => r({ state, open: game.scene.isActive('OffDialog'), kept: JSON.parse(localStorage.getItem('hb-off.character.2') ?? 'null')?.name ?? null }), 600); }, 600); }, 800); })",
    offotherportal: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, faction: s.faction, tile: s.tile, asked: game.scene.isActive('OffDialog') }); }, 3500))",
    offdeathhome: "new Promise((r) => { const start = o.debugState().place; o.battle.hp = 0; o.battle.die(); setTimeout(() => { const s = o.debugState(); r({ start, end: s.place, tile: s.tile, dead: s.dead, hp: [s.hp, s.maxHp] }); }, 6000); })",
    offshop: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const before = st.debugState(); st.mark(0); st.act(); setTimeout(() => r({ open: game.scene.isActive('OffStore'), hud: game.scene.isActive('OffHud'), before: { rows: before.rows, gold: before.gold }, after: st.debugState(), saved: (({ gold, bag }) => ({ gold, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }), 300); }, 1000))",
    offsmith: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const rows = st.debugState().rows; st.mark(rows.indexOf('longSword')); st.act(); const sword = st.debugState(); st.mark(rows.indexOf('plateMail')); st.act(); const plate = st.debugState(); st.mark(rows.indexOf('battleHammer')); const hammer = st.debugState(); st.mark(rows.indexOf('longSword')); r({ rows, sword: [sword.message, sword.gold], plate: plate.message, hammerBox: hammer.box, bag: JSON.parse(localStorage.getItem('hb-off.character')).bag }); }, 1000))",
    offsell: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); st.showTab('sell'); const before = st.debugState(); st.mark(0); st.sellMarked(); const one = st.debugState(); st.act(); const two = st.debugState(); r({ before: before.rows, one: [one.message, one.gold, one.rows], two: [two.message, two.gold, two.rows], saved: (({ gold, bag }) => ({ gold, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offsmithpad: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); st.debugShowPadHints(); const down = []; for (let i = 0; i < 3; i++) { st.debugMove(1); down.push(st.debugState().marked); } st.mark(st.debugState().rows.indexOf('battleHammer')); setTimeout(() => { const s = st.debugState(); r({ down, marked: s.marked, scroll: s.scroll, more: s.more, message: s.message, button: [s.button, s.buttonOn], box: s.box, help: s.help, issues: s.issues, window: s.window, sections: s.rows.filter((x) => x.startsWith('[')) }); }, 200); }, 1000))",
    offsellstacks: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); st.showTab('sell'); st.mark(1); st.act(); const s = st.debugState(); r({ rows: s.rows, marked: s.marked, message: s.message, button: s.button, gold: s.gold, box: s.box, issues: s.issues, dialog: game.scene.isActive('OffDialog') }); }, 1000))",
    offsellask: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); st.showTab('sell'); st.mark(0); st.act(); setTimeout(() => { const d = game.scene.getScene('OffDialog'); r({ dialog: game.scene.isActive('OffDialog'), store: game.scene.isPaused('OffStore'), texts: d && d.debugState ? d.debugState() : undefined }); }, 300); }, 1000))",
    offsmithempty: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); st.showTab('sell'); const s = st.debugState(); r({ rows: s.rows, box: s.box, button: s.buttonOn, issues: s.issues }); }, 1000))",
    offsmithworst: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); st.showTab('sell'); st.mark(0); const s = st.debugState(); r({ rows: s.rows, box: s.box, message: s.message, issues: s.issues }); }, 1000))",
    // Off-13C: guarda una Red Potion del montón (celda 1) y saca una Blue Potion (celda 1 del almacén); el foco se queda.
    offwarehouse: "new Promise((r) => setTimeout(() => { const w = game.scene.getScene('OffWarehouse'); const before = w.debugState(); w.debugMark('bag', 1); const store = w.moveItem('bag', 1); const mid = w.debugState(); const take = w.moveItem('warehouse', 1); const after = w.debugState(); r({ before, store, mid: { cells: mid.cells, message: mid.message, focus: mid.focus, card: mid.card }, take, after, saved: (({ bag, warehouse }) => ({ bag, warehouse }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offwarehousepotions: "new Promise((r) => setTimeout(() => { const w = game.scene.getScene('OffWarehouse'); w.debugMark('warehouse', 0); const s = w.debugState(); const take = w.moveItem('warehouse', 0); r({ cells: s.cells, card: s.card, button: s.button, take, message: w.debugState().message, issues: s.issues }); }, 1000))",
    offwarehousepad: "new Promise((r) => setTimeout(() => { const w = game.scene.getScene('OffWarehouse'); w.debugShowPadHints(); const steps = ['a','right','right','right','right','right','right','right','right','right','right','down','down','down','down','down','down','down','left','lb','right'].map((k) => [k, w.debugInput(k)]); setTimeout(() => r({ steps, state: w.debugState() }), 200); }, 1000))",
    offwarehouseworst: "new Promise((r) => setTimeout(() => { const w = game.scene.getScene('OffWarehouse'); w.debugMark('warehouse', 1); r(w.debugState()); }, 1000))",
    offdoor: "o.debugWalkTo(126, 166, true), new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const open = game.scene.isActive('OffStore'); const state = open ? st.debugState() : undefined; r({ open, tile: o.debugState().tile, rows: state && state.rows.length, title: state && state.tab }); }, 14000))",
    offelvinedoor: "o.debugWalkTo(229, 112), new Promise((r) => setTimeout(() => { const open = game.scene.isActive('OffStore'); r({ open, tile: o.debugState().tile, rows: open ? game.scene.getScene('OffStore').debugState().rows.slice(0, 4) : undefined }); }, 9000))",
    offmagic: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const learn = (id) => { st.mark(st.debugState().rows.indexOf(id)); st.act(); return st.debugState().message; }; const tab = st.debugState().tab; const mm = learn('magicMissile'); const fb = learn('fireBall'); const eb = learn('energyBolt'); const gh = learn('greatHeal'); st.mark(st.debugState().rows.indexOf('fireBall (learned)')); const after = st.debugState(); r({ tab, mm, fb, eb, gh, rows: after.rows, gold: after.gold, box: after.box, saved: (({ gold, spells, spellKeys }) => ({ gold, spells, spellKeys }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offuikitdialog: "new Promise((r) => setTimeout(() => { game.scene.getScene('OffUiKit').openDialog(); setTimeout(() => { const d = game.scene.getScene('OffDialog'); r({ kitPaused: game.scene.isPaused('OffUiKit'), kit: game.scene.getScene('OffUiKit').debugState().issues, dialog: d.debugState() }); }, 500); }, 1500))",
    offuikit: "new Promise((r) => setTimeout(() => r(game.scene.getScene('OffUiKit').debugState()), 1500))",
    offbook: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); const p = b.debugPage; const before = b.debugState(); p.debugMark('fireBall'); p.putOnKey(0); const fb = b.debugState(); p.debugMark('lightning'); p.takeOffKey(); const after = b.debugState(); r({ open: game.scene.isActive('OffBag'), tab: before.tab, hud: game.scene.isActive('OffHud'), before: before.page, fb: { keys: fb.page.keys, message: fb.message }, after: { keys: after.page.keys, message: after.message }, saved: JSON.parse(localStorage.getItem('hb-off.character')).spellKeys, issues: after.issues }); }, 1000))",
    offcast: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }) => ({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }))(st); const before = pick(o.debugState()); o.debugCast(2, 'slime'); const preparing = pick(o.debugState()); setTimeout(() => r({ before, preparing, after: pick(o.debugState()) }), 2600); }, 1500))",
    offcastfire: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }) => ({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }))(st); const before = pick(o.debugState()); o.debugCast(4, 'giantScorpion'); const preparing = pick(o.debugState()); setTimeout(() => r({ before, preparing, after: pick(o.debugState()) }), 1800); }, 1500))",
    offcastice: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }) => ({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }))(st); const before = pick(o.debugState()); o.debugCast(0, 'giantScorpion'); const preparing = pick(o.debugState()); setTimeout(() => r({ before, preparing, after: pick(o.debugState()) }), 1500); }, 1500))",
    offcastfail: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, spell, casts, fails, prepareMs, level }) => ({ mana, spell, casts, fails, prepareMs, level }))(st); const before = pick(o.debugState()); let n = 0; const t = setInterval(() => { if (o.debugState().spell === 'idle') { n++; o.debugCast(0, 'slime'); } }, 500); setTimeout(() => { clearInterval(t); r({ before, after: pick(o.debugState()) }); }, 11000); }, 1500))",
    offwandcast: "new Promise((r) => setTimeout(() => { const before = o.debugState().mana; o.debugCast(2, 'slime'); setTimeout(() => r({ before, after: (({ mana, spell, casts, fails }) => ({ mana, spell, casts, fails }))(o.debugState()) }), 2600); }, 1500))",
    offwandsword: "new Promise((r) => setTimeout(() => { const before = o.debugState().mana; o.debugCast(2, 'slime'); setTimeout(() => r({ before, after: (({ mana, spell, casts, fails }) => ({ mana, spell, casts, fails }))(o.debugState()) }), 500); }, 1500))",
    offwandsmith: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const rows = st.debugState().rows; st.mark(rows.indexOf('magicWandMS10')); st.act(); const bought = st.debugState(); st.mark(rows.indexOf('magicWandMS20')); r({ rows, bought: [bought.message, bought.gold], ms20Box: st.debugState().box, bag: JSON.parse(localStorage.getItem('hb-off.character')).bag }); }, 1000))",
    offboltline: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(0, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offmassarrow: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(1, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    officestrike: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(2, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offenergystrike: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(3, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offmasschill: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(4, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offlightningstrike: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(6, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offearthshock: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(7, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offmassicestrike: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(0, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offmeteor: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(1, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offmassmissile: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(2, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offblizzard: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }) => ({ mana, maxMana, spell, casts, fails, kills, wounded, slowed, target }))(o.debugState()); const before = pick(); o.debugCast(3, ''); setTimeout(() => r({ before, after: pick() }), 2500); }, 1500))",
    offmercmagehigh: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight(); }, 500); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ hp: s.hp, dead: s.dead, merc: s.merc, mercCasts: s.mercCasts, mercMana: s.mercMana, mercKills: s.mercKills, kills: s.kills }); }, 20000); })",
    offamp: "new Promise((r) => setTimeout(() => { const pick = () => (({ mana, casts, fails, shield }) => ({ mana, casts, fails, shield }))(o.debugState()); const before = pick(); o.debugCast(0); setTimeout(() => { const amp = pick(); o.debugCast(1); setTimeout(() => r({ before, amp, second: pick() }), 2600); }, 2600); }, 1500))",
    offcastshield: "new Promise((r) => setTimeout(() => { const before = o.debugState().mana; o.debugCast(2, 'slime'); setTimeout(() => r({ before, after: (({ mana, spell, casts, fails }) => ({ mana, spell, casts, fails }))(o.debugState()) }), 500); }, 1500))",
    offbookempty: "new Promise((r) => setTimeout(() => { const s = game.scene.getScene('OffBag').debugState(); r({ tab: s.tab, tabs: s.tabs }); }, 1000))",
    offstatstab: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); const p = b.debugPage; p.change('str', 1); p.change('str', 1); p.change('vit', 1); p.change('mag', 1); b.debugInput('down'); b.debugInput('down'); const s = b.debugState(); r({ tab: s.tab, tabs: s.tabs, focus: s.focus, page: s.page, issues: s.issues }); }, 1500))",
    offstatsworst: "new Promise((r) => setTimeout(() => { const s = game.scene.getScene('OffBag').debugState(); r({ page: s.page, issues: s.issues }); }, 1500))",
    offspelltab: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); b.debugPage.debugMark('fireBall'); const s = b.debugState(); r({ tab: s.tab, focus: s.focus, page: s.page, issues: s.issues }); }, 1500))",
    offspellworst: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); const p = b.debugPage; p.debugMark('absoluteMagicProtection'); p.putOnKey(3); const s = b.debugState(); r({ focus: s.focus, marked: s.page.marked, scroll: s.page.scroll, keys: s.page.keys, card: s.page.card, message: s.message, issues: s.issues }); }, 1500))",
    offtabspad: "new Promise((r) => setTimeout(() => { const b = () => game.scene.getScene('OffBag'); const path = []; const go = (k, n = 1) => { for (let i = 0; i < n; i++) path.push(k + ':' + b().debugInput(k)); }; go('right', 9); go('up'); go('right'); go('a'); setTimeout(() => { path.push('now:' + b().debugState().tab + ' ' + b().debugState().focus); go('down'); go('right'); go('down', 5); go('right'); go('a'); go('up'); go('up', 6); go('right'); go('a'); setTimeout(() => { path.push('now:' + b().debugState().tab + ' ' + b().debugState().focus); go('down'); go('down', 3); go('a'); go('right'); go('up'); go('up', 4); go('right'); go('a'); setTimeout(() => r({ path, closed: !game.scene.isActive('OffBag'), keys: JSON.parse(localStorage.getItem('hb-off.character')).spellKeys, issues: game.scene.isActive('OffBag') ? b().debugState().issues : [] }), 300); }, 300); }, 300); }, 1500))",
    offtabslbrb: "new Promise((r) => setTimeout(() => { const b = () => game.scene.getScene('OffBag'); const path = []; const at = () => b().debugState().tab + ' ' + b().debugState().filter + ' ' + b().debugState().focus; b().setFilter('potion'); b().debugInput('down'); path.push('bag:' + at()); const step = (k, then) => { b().debugInput(k); setTimeout(() => { path.push(k + ':' + at()); then(); }, 300); }; step('rb', () => step('rb', () => step('rb', () => { b().debugInput('down'); path.push('down:' + at()); step('lb', () => { b().debugShowPadHints(); setTimeout(() => { const s = b().debugState(); r({ path, padHints: s.padHints, issues: s.issues }); }, 300); }); }))); }, 1500))",
    offtabsclose: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); b.debugPage.change('str', 1); b.close(); const first = { open: game.scene.isActive('OffBag'), message: b.debugState().message }; b.close(); setTimeout(() => r({ first, closedSecond: !game.scene.isActive('OffBag'), str: JSON.parse(localStorage.getItem('hb-off.character')).stats.str }), 300); }, 1500))",
    offheal: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugCast(0); setTimeout(() => r({ before, after: pick() }), 2600); }, 1500))",
    offshield: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugCast(1); setTimeout(() => { const shield = pick(); o.debugCast(5); setTimeout(() => r({ before, shield, second: pick() }), 2600); }, 2600); }, 1500))",
    offdefenseaura: "new Promise((r) => setTimeout(() => { o.debugCast(1); setTimeout(() => r((({ mana, casts, fails, shield, defense }) => ({ mana, casts, fails, shield, defense }))(o.debugState())), 2000); }, 1500))",
    offprotect: "new Promise((r) => setTimeout(() => { o.debugCast(5); setTimeout(() => r((({ mana, casts, fails, shield }) => ({ mana, casts, fails, shield }))(o.debugState())), 2000); }, 1500))",
    offhold: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugCast(2, 'slime'); setTimeout(() => r({ before, after: pick() }), 2600); }, 1500))",
    offpadcast: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugPadCast(1); setTimeout(() => { const shield = pick(); o.debugPadCast(2); setTimeout(() => r({ before, shield, hold: pick(), pad: o.debugState().padSpells }), 2600); }, 2600); }, 1500))",
    offcastrun: "new Promise((r) => { o.debugStick(1, 0); setTimeout(() => { const before = o.debugPadState().tile; o.debugPadCast(0); setTimeout(() => { const cast = o.debugPadState().tile; setTimeout(() => { const after = o.debugPadState(); o.debugStick(undefined); setTimeout(() => { o.debugStick(1, 0); setTimeout(() => { const again = o.debugPadState().tile; o.debugStick(undefined); r({ before, cast, afterCast: after.tile, stillAfterCast: cast.x === after.tile.x && cast.y === after.tile.y, casts: o.debugState().casts, walksAgain: again.x !== after.tile.x || again.y !== after.tile.y, again }); }, 1500); }, 300); }, 3000); }, 400); }, 1500); })",
    offpadaim: "new Promise((r) => setTimeout(() => { o.debugCastTrigger(true); o.debugPadAim(1, 0, 0); setTimeout(() => { const near = o.debugPadState().reticle; o.debugPadAim(1, 0, 1); setTimeout(() => { const far = o.debugPadState().reticle; o.debugPadAim(0, 1, 1); setTimeout(() => { const down = o.debugPadState().reticle; o.debugPadAim(1, 0, 1); o.debugPadCast(0); setTimeout(() => { const s = o.debugPadState(); r({ near, far, downClamped: down, lastRelease: s.lastRelease, casts: o.debugState().casts }); }, 2600); }, 200); }, 200); }, 200); }, 1500))",
    // 11-nov-2026: walks into the Slimes, stops hitting, pushes the right stick four ways (target each), lets it go
    // (the mark stays), then with no mark A picks the nearest, the one in front first.
    offpadtarget: "new Promise((r) => { o.debugFight('slime'); setTimeout(() => { o.debugHold = false; o.battle.stopAttacking(); const before = o.debugNearFoes(); const dirs = before.near.slice(0, 5).map((n) => n.split(' ')[1].split(',').map(Number)); const aimed = []; let i = 0; const step = () => { if (i < dirs.length) { o.debugPadAim(dirs[i][0], dirs[i][1], 1); setTimeout(() => { aimed.push('aim ' + dirs[i].join(',') + ' -> ' + o.debugState().target + ' (me ' + o.debugState().tile.x + ',' + o.debugState().tile.y + ')'); i++; step(); }, 120); return; } o.debugPadAim(undefined); setTimeout(() => { const kept = o.debugState().target; o.battle.clearTarget(); o.battle.attackPressed(); r({ before, aimed, keptAfterRelease: kept, aPicks: o.debugState().target, after: o.debugNearFoes() }); }, 150); }; step(); }, 4000); })",
    offpadcross: "new Promise((r) => setTimeout(() => { o.debugCastTrigger(true); setTimeout(() => { const held = o.debugPadState(); o.debugPadCast(1); setTimeout(() => { const s = o.debugPadState(); r({ cross: held.cross, triggerStillHeld: s.trigger, spell: s.spell, casts: o.debugState().casts }); o.debugPadAim(1, -0.3, 0.7); }, 2600); }, 300); }, 1500))",
    offbookpad: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); const p = b.debugPage; const before = b.debugState().page.keys; p.debugMark('fireBall'); p.debugPad(3); const put = b.debugState(); p.debugPad(3); const off = b.debugState(); p.debugPad(0); r({ before, put: { keys: put.page.keys, message: put.message }, off: { keys: off.page.keys, message: off.message }, end: b.debugState().page.keys, saved: JSON.parse(localStorage.getItem('hb-off.character')).spellKeys }); }, 1000))",
    offfarmteleport: "o.debugWalkTo(45, 102, false), new Promise((r) => setTimeout(() => { const ms = game.scene.getScene('OffMapSelect'); const places = game.scene.isActive('OffMapSelect') && ms.debugPlaces(); ms.choose('aresden'); setTimeout(() => { const s = o.debugState(); r({ places, place: s.place, tile: s.tile }); }, 6000); }, 4000))",
    offtravelerhome: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ asked: game.scene.isActive('OffDialog'), place: s.place, tile: s.tile }); }, 6000))",
    offmapselect: "o.debugWalkTo(45, 102, false), new Promise((r) => setTimeout(() => r({ open: game.scene.isActive('OffMapSelect'), places: game.scene.getScene('OffMapSelect').debugPlaces() }), 4000))",
    offbase: "o.debugWalkTo(45, 102, false), new Promise((r) => setTimeout(() => r({ place: o.debugState().place, tile: o.debugState().tile, teleport: game.scene.isActive('OffMapSelect'), places: game.scene.isActive('OffMapSelect') && game.scene.getScene('OffMapSelect').debugPlaces() }), 4000))",
    offbarracks: "o.debugWalkTo(96, 149, false), new Promise((r) => setTimeout(() => { const w = game.scene.getScene('OffWorld'); const inside = { place: w.debugState().place, tile: w.debugState().tile }; w.debugWalkTo(67, 71, false); setTimeout(() => { const s = game.scene.getScene('OffWorld').debugState(); r({ inside, back: { place: s.place, tile: s.tile } }); }, 6000); }, 6000))",
    offaresdenfarm: "new Promise((r) => setTimeout(() => { const s = o.debugState(); const n = s.npcs.find((t) => t.id === 'shopKeeper'); o.debugWalkTo(n.x, n.y + 1, true); setTimeout(() => { const near = o.nearestNpc(); if (near) o.talkTo(near); setTimeout(() => r({ place: s.place, start: s.tile, npcs: s.npcs, tile: o.debugState().tile, near: near && near.npc.id, store: game.scene.isActive('OffStore'), warehouse: game.scene.isActive('OffWarehouse') }), 1200); }, 8000); }, 1500))",
    offelvinefarm: "new Promise((r) => setTimeout(() => { const s = o.debugState(); const n = s.npcs.find((t) => t.id === 'howard'); o.debugWalkTo(n.x, n.y + 1, true); setTimeout(() => { const near = o.nearestNpc(); if (near) o.talkTo(near); setTimeout(() => r({ place: s.place, start: s.tile, npcs: s.npcs, tile: o.debugState().tile, near: near && near.npc.id, store: game.scene.isActive('OffStore'), warehouse: game.scene.isActive('OffWarehouse') }), 1200); }, 8000); }, 1500))",
    offaresdenfarmpits: "new Promise((r) => setTimeout(() => { const first = o.debugState().monsters; setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, first, monsters: s.monsters }); }, 8000); }, 1500))",
    offelvinefarmpits: "new Promise((r) => setTimeout(() => { const first = o.debugState().monsters; setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, first, monsters: s.monsters }); }, 8000); }, 1500))",
    offcitypits: "new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, monsters: s.monsters }); }, 1500))",
    offelvinepits: "new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, monsters: s.monsters }); }, 1500))",
    offorc: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); const pick = (s) => s && ({ tile: s.tile, hp: [s.hp, s.maxHp], level: s.level, exp: s.exp, kills: s.kills, target: s.target, monsters: s.monsters, gold: s.gold, dead: s.dead }); r({ start: pick(log[0]), mid: pick(log[10]), end: pick(log[log.length - 1]) }); }, 20000); })",
    offscorpion: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('giantScorpion'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); const pick = (s) => s && ({ tile: s.tile, hp: [s.hp, s.maxHp], level: s.level, exp: s.exp, kills: s.kills, target: s.target, monsters: s.monsters, gold: s.gold, dead: s.dead }); r({ start: pick(log[0]), mid: pick(log[10]), end: pick(log[log.length - 1]) }); }, 20000); })",
    offmapselect: "new Promise((r) => { o.askDestination(); setTimeout(() => { const m = game.scene.getScene('OffMapSelect'); m.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffMapSelect'), worldPaused: game.scene.isPaused('OffWorld'), ...m.debugState() }), 300); }, 1200); })",
    offmapselectfarm: "new Promise((r) => { o.askDestination(); setTimeout(() => { const m = game.scene.getScene('OffMapSelect'); m.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffMapSelect'), worldPaused: game.scene.isPaused('OffWorld'), ...m.debugState() }), 300); }, 1200); })",
    offmapselectnone: "new Promise((r) => { o.askDestination(); setTimeout(() => { const m = game.scene.getScene('OffMapSelect'); m.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffMapSelect'), worldPaused: game.scene.isPaused('OffWorld'), ...m.debugState() }), 300); }, 1200); })",
    offteleport: "o.debugWalkTo(140, 207), new Promise((r) => setTimeout(() => { const asked = game.scene.isActive('OffMapSelect'); const places = game.scene.getScene('OffMapSelect').debugPlaces(); const paused = game.scene.isPaused('OffWorld'); game.scene.getScene('OffMapSelect').choose('promiseland'); setTimeout(() => { const s = o.debugState(); r({ asked, places, paused, place: s.place, tile: s.tile }); }, 6000); }, 4000))",
    offpromiseland: "new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, monsters: s.monsters }); }, 2500))",
    offpromiselandelvine: "new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, monsters: s.monsters }); }, 2500))",
    offpromiselandback: "o.debugWalkTo(140, 228), new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile }); }, 6000))",
    offpromiselandother: "o.debugWalkTo(126, 21), new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile }); }, 4000))",
    offskeleton: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('skeleton'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); const pick = (s) => s && ({ tile: s.tile, hp: [s.hp, s.maxHp], level: s.level, exp: s.exp, kills: s.kills, target: s.target, gold: s.gold, dead: s.dead }); r({ start: pick(log[0]), mid: pick(log[10]), end: pick(log[log.length - 1]) }); }, 20000); })",
    offcyclops: "new Promise((r) => { const log = []; const t = setInterval(() => { const s = o.debugState(); log.push(s.hp); }, 1000); setTimeout(() => { clearInterval(t); r(log); }, 15000); })",
    offtroll: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('troll'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); const pick = (s) => s && ({ tile: s.tile, hp: [s.hp, s.maxHp], level: s.level, exp: s.exp, kills: s.kills, target: s.target, gold: s.gold, dead: s.dead }); r({ start: pick(log[0]), mid: pick(log[10]), end: pick(log[log.length - 1]) }); }, 20000); })",
    offdeath: "new Promise((r) => { o.battle.exp += 200; const start = o.debugState(); o.battle.hp = 0; o.battle.die(); setTimeout(() => r({ start, end: o.debugState() }), 4000); })",
    offslotsfull: "(game.scene.getScene('OffSlots').debugShowPadHints(), game.scene.getScene('OffSlots').debugState())",
    offslotspad: "(() => { const s = game.scene.getScene('OffSlots'); s.debugShowPadHints(); s.moveFocus('right'); const card = s.debugState(); s.moveFocus('down'); return { card, buttons: s.debugState() }; })()",
    offhome: "(game.scene.getScene('OffHome').debugShowPadHints(), game.scene.getScene('OffHome').debugState())",
    offslotsnew: "new Promise((r) => { game.scene.getScene('OffSlots').newCharacter(); setTimeout(() => { const c = game.scene.getScene('OffCreate'); c.applyPreset('warrior'); c.createCharacter(); setTimeout(() => r({ world: game.scene.isActive('OffWorld'), slot: localStorage.getItem('hb-off.slot'), one: JSON.parse(localStorage.getItem('hb-off.character'))?.name, two: JSON.parse(localStorage.getItem('hb-off.character.2'))?.created }), 4000); }, 600); })",
    offslotsdelete: "new Promise((r) => { const sl = game.scene.getScene('OffSlots'); sl.deleteFocused(); setTimeout(() => { const asked = game.scene.isActive('OffDialog'); game.scene.getScene('OffDialog').answer(1); setTimeout(() => r({ asked, left: localStorage.getItem('hb-off.character'), slotsActive: game.scene.isActive('OffSlots') }), 800); }, 600); })",
    offcreate: "game.scene.getScene('OffCreate').debugState()",
    offcreatepad: "(() => { const c = game.scene.getScene('OffCreate'); c.debugShowPadHints(); c.randomName(); const first = c.debugState().name; c.randomName(); const second = c.debugState().name; c.moveFocus(1); c.moveFocus(1); const before = c.debugState().look[1]; c.horizontal(1); const after = c.debugState(); c.confirm(); return { first, second, skinBefore: before, skinAfter: after.look[1], focusAfterChange: after.focus, focusAfterA: c.debugState().focus, state: c.debugState() }; })()",
    offcreatefull: "(() => { const c = game.scene.getScene('OffCreate'); c.debugShowPadHints(); c.nameInput.setValue('WWWWWWWWWW'); c.applyPreset('warrior'); c.confirm(); return c.debugState(); })()",
    offcreatecancel: "new Promise((r) => { const c = game.scene.getScene('OffCreate'); c.changeStat('str', 1); c.cancel(); setTimeout(() => { const asked = game.scene.isActive('OffDialog'); game.scene.getScene('OffDialog').answer(0); setTimeout(() => r({ asked, stillCreating: game.scene.isActive('OffCreate'), stats: c.debugState().stats }), 800); }, 600); })",
    offcreated: "new Promise((r) => { const c = game.scene.getScene('OffCreate'); c.changeStat('str', 1); const one = c.stats.str; c.createCharacter(); const blocked = game.scene.isActive('OffCreate'); c.applyPreset('warrior'); c.createCharacter(); setTimeout(() => r({ oneStr: one, blockedWithPointsLeft: blocked, saved: JSON.parse(localStorage.getItem('hb-off.character')), world: game.scene.isActive('OffWorld') }), 4000); })",
    offchar: "o.openCharacter(), new Promise((r) => setTimeout(() => r({ open: game.scene.isActive('OffBag'), tab: game.scene.getScene('OffBag').debugState().tab, worldPaused: game.scene.isPaused('OffWorld'), state: o.debugState() }), 800))",
    offassign: "new Promise((r) => { const before = o.debugState(); o.openCharacter(); setTimeout(() => { const c = game.scene.getScene('OffBag').debugPage; for (let i = 0; i < 3; i++) c.change('str', 1); c.change('vit', 1); c.change('vit', 1); c.confirm(); setTimeout(() => r({ before, after: o.debugState(), worldRunning: game.scene.isActive('OffWorld'), saved: JSON.parse(localStorage.getItem('hb-off.character')) }), 500); }, 500); })",
    offstamina: "new Promise((r) => { o.battle.vitals.stamina = 5; o.debugWalkTo(90, 100, true); const log = []; const t = setInterval(() => { const s = o.debugState(); log.push(`${s.stamina} ${s.stepMs}`); }, 250); setTimeout(() => { clearInterval(t); r({ log, end: o.debugState() }); }, 4500); })",
    offlootview: "(async () => { const fight = (ms) => new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 1000); setTimeout(() => { clearInterval(t); o.debugHold = false; o.battle.stopAttacking(); r(); }, ms); }); await fight(14000); return o.debugState(); })()",
    offloot: "(async () => { const fight = (ms) => new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 1000); setTimeout(() => { clearInterval(t); o.debugHold = false; o.battle.stopAttacking(); r(); }, ms); }); const walkAll = async () => { for (let i = 0; i < 4; i++) { const g = o.battle.ground.items[0]; if (!g) break; o.debugWalkTo(g.tileX, g.tileY, true); await new Promise((r) => setTimeout(r, 3500)); } }; await fight(14000); const before = o.debugState(); await walkAll(); const after = o.debugState(); return { kills: before.kills, groundBefore: before.ground, goldAfter: after.gold, bagAfter: after.bag, groundAfter: after.ground, saved: (({ gold, bag }) => ({ gold, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }; })()",
    offbagfull: "(async () => { const fight = (ms) => new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 1000); setTimeout(() => { clearInterval(t); o.debugHold = false; o.battle.stopAttacking(); r(); }, ms); }); await fight(8000); const before = o.debugState(); const g = o.battle.ground.items[0]; if (g) o.debugWalkTo(g.tileX, g.tileY, true); await new Promise((r) => setTimeout(r, 3500)); const after = o.debugState(); return { groundBefore: before.ground, tile: after.tile, bagSize: after.bag.length, groundAfter: after.ground }; })()",
    offequip: "o.openBag(), new Promise((r) => setTimeout(() => { const e = game.scene.getScene('OffBag'); e.debugMark(2); r({ open: game.scene.isActive('OffBag'), worldPaused: game.scene.isPaused('OffWorld'), state: e.debugState() }); }, 1500))",
    offbagworst: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); b.debugMark(0); const s = b.debugState(); r({ issues: s.issues, info: s.info, box: s.box, main: s.main, count: s.bag.length }); }, 1500))",
    offbagpad: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffBag'); const path = []; const go = (k, n = 1) => { for (let i = 0; i < n; i++) path.push(k + ':' + b.debugInput(k)); }; go('right', 9); go('right'); go('down', 4); go('left'); go('left'); go('up'); go('left', 2); go('down', 4); go('right'); b.debugMark(40); go('left'); go('down'); const bag = b.debugState().bag.join(); go('a'); const ringSafe = b.debugState().bag.join() === bag; go('up', 3); go('up'); go('right', 2); go('a'); setTimeout(() => r({ path, ringSafe, closed: !game.scene.isActive('OffBag'), worldBack: !game.scene.isSleeping('OffHud') }), 300); }, 1500))",
    offbag: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffBag'); inv.debugMark(1); const m = () => o.battle.pits.monsters.filter((x) => x.isAlive).map((x) => `${x.mover.tileX},${x.mover.tileY}`).join(' '); const before = m(); setTimeout(() => r({ open: game.scene.isActive('OffBag'), worldPaused: game.scene.isPaused('OffWorld'), monstersMoved: before !== m(), state: inv.debugState() }), 3000); }, 1000))",
    offbagequip: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffBag'); const helmet = inv.use(2); const sword = inv.use(1); r({ helmet, sword, weapon: o.debugState().weapon, bag: inv.debugState().bag, saved: (({ equipment, bag }) => ({ equipment, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offbagdrink: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffBag'); o.battle.hp = 5; const red = inv.use(4); const hp = o.battle.hp; const blue = inv.use(4); r({ red, hp, maxHp: o.battle.maxHp, blue, potions: inv.debugState().info, bag: inv.debugState().bag }); }, 1000))",
    offbagdrop: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffBag'); const drop = inv.drop(0); setTimeout(() => { const s = o.debugState(); r({ drop, tile: s.tile, ground: s.ground, bag: s.bag }); }, 1500); }, 1000))",
    offpotionlimit: "new Promise((r) => { const t = o.debugState().tile; o.battle.ground.drop({ item: 'bigRedPotion' }, t.x + 2, t.y); o.battle.ground.drop({ item: 'cape' }, t.x + 2, t.y); o.debugWalkTo(t.x + 2, t.y, false); setTimeout(() => { const s = o.debugState(); r({ tile: s.tile, ground: s.ground, bagSize: s.bag.length, potions: s.bag.filter((id) => id.includes('Potion')).length, hasCape: s.bag.includes('cape') }); }, 3000); })",
    offquickdrink: "new Promise((r) => { const key = (k, c) => { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: 'Key' + k.toUpperCase(), keyCode: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: k, code: 'Key' + k.toUpperCase(), keyCode: c })), 100); }; o.battle.hp = 5; o.battle.vitals.mana = 1; key('q', 81); setTimeout(() => { const afterQ = { hp: o.battle.hp, bag: [...o.debugState().bag] }; key('e', 69); setTimeout(() => { const afterE = { mana: o.battle.vitals.mana, bag: [...o.debugState().bag] }; o.battle.hp = 5; key('q', 81); setTimeout(() => { const afterQ2 = { hp: o.battle.hp, bag: [...o.debugState().bag] }; o.battle.hp = 5; const none = o.battle.drinkQuick('hp'); r({ afterQ, afterE, afterQ2, none }); }, 500); }, 500); }, 500); })",
    offspecial: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffBag'); const boxes = []; for (const i of [4, 3, 2, 1]) { inv.debugMark(i); boxes.push(inv.debugState().box); } inv.debugMark(0); boxes.push(inv.debugState().box); r({ bag: inv.debugState().bag, boxes }); }, 1500))",
    offspecialequip: "new Promise((r) => { o.openBag(); setTimeout(() => { const e = game.scene.getScene('OffBag'); e.debugMark(2); r({ box: e.debugState().box }); }, 1500); })",
    offpoisoncloud: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); const m = o.battle.pits.monsters.find((x) => x.isAlive && x.isPoisoned); if (m) { clearInterval(t); o.battle.stopAttacking(); r({ poisoned: o.debugState().poisoned, cloud: m.poisonCloud?.visible, anim: m.poisonCloud?.anims.currentAnim?.key }); } }, 200); setTimeout(() => { clearInterval(t); r({ poisoned: 0 }); }, 20000); })",
    offhitrate: "o.debugHitTable([20, 40, 60], 2000)",
    offarmor: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffBag'); const boxes = []; for (const i of [0, 1, 2, 3]) { inv.debugMark(i); boxes.push(inv.debugState().box); } r(boxes); }, 1500))",
    ...Object.fromEntries(Object.entries(OFF_FARM).map(([k, f]) => [k, offFarmEval(f)])),
    ...Object.fromEntries(Object.entries(OFF_DUEL).map(([k, d]) => [k, d.eval])),
    offhitorc: "new Promise((r) => { const b = o.battle; const st = { swings: 0, misses: 0 }; const land = b.landBlow.bind(b); b.landBlow = (blow) => { st.swings++; if (!blow.lands) st.misses++; land(blow); }; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); setTimeout(() => { clearInterval(t); r({ hitRatio: b.hitRatio, ...st, hitPercent: Math.round((1 - st.misses / Math.max(1, st.swings)) * 100), kills: b.kills, dead: o.debugState().dead }); }, 20000); })",
    offcritstrike: "new Promise((r) => { const b = o.battle; const st = { normal: [], strike: [], misses: 0 }; let cur = false; const land = b.landBlow.bind(b); b.landBlow = (blow) => { cur = blow.crit; if (!blow.lands) st.misses++; land(blow); }; const hurt = b.hurtMonster.bind(b); b.hurtMonster = (m, d, e, c) => { if (e === undefined) (cur ? st.strike : st.normal).push(d); return hurt(m, d, e, c); }; const avg = (a) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0; const start = b.critStrike.charges; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 300); let n = 0; const c = setInterval(() => { if (n++ < 3) b.critPressed(); }, 1500); setTimeout(() => { const afterStrikes = b.critStrike.charges; setTimeout(() => { clearInterval(t); clearInterval(c); const saved = JSON.parse(localStorage.getItem('hb-off.character')).critCharges; r({ level: b.level, start, afterStrikes, afterWait: b.critStrike.charges, saved, launched: b.critStrike.launched, strikesLanded: b.critStrikeBlows, misses: st.misses, normalAvg: avg(st.normal), strikeAvg: avg(st.strike), normalBlows: st.normal.length }); }, 16000); }, 6000); })",
    offmerchire: "new Promise((r) => { const h = o.debugState().hirer; const before = o.debugState().gold; o.debugWalkTo(h.x - 1, h.y + 1, false); setTimeout(() => { o.openMercenaries(); setTimeout(() => { const asked = game.scene.isActive('OffMercenary'); game.scene.getScene('OffMercenary').hire('warrior'); setTimeout(() => { const s = o.debugState(); r({ hirer: h, tile: s.tile, asked, goldBefore: before, goldAfter: s.gold, merc: s.merc, saved: JSON.parse(localStorage.getItem('hb-off.character')).mercenary }); }, 3000); }, 800); }, 4000); })",
    offmerc: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); let maxOnMerc = 0; const w = setInterval(() => { maxOnMerc = Math.max(maxOnMerc, o.debugState().onMerc); }, 500); setTimeout(() => { clearInterval(t); clearInterval(w); const fought = o.debugState(); o.debugMercDown(3000); setTimeout(() => { const down = o.debugState(); setTimeout(() => { const up = o.debugState(); r({ kills: fought.kills, mercKills: fought.mercKills, merc: fought.merc, hp: fought.hp, dead: fought.dead, maxOnMerc, downSeconds: down.mercDown, mercAfterDown: up.merc, upAgain: up.mercDown === 0 }); }, 3500); }, 800); }, 25000); })",
    offmercportal: "new Promise((r) => { o.debugMercHp(100); o.debugWalkTo(140, 207); setTimeout(() => { game.scene.getScene('OffMapSelect').choose('promiseland'); setTimeout(() => { const w = game.scene.getScene('OffWorld'); const s = w.debugState(); r({ place: s.place, tile: s.tile, merc: s.merc }); }, 6000); }, 4000); })",
    offmercaim: "new Promise((r) => { o.debugMercHp(5); const m0 = o.debugState(); o.debugAimAtMerc(true); o.debugPadCast(0); setTimeout(() => { const m1 = o.debugState(); o.debugAimAtMerc(false); setTimeout(() => { o.debugPadCast(0); setTimeout(() => { const m2 = o.debugState(); r({ before: { hp: m0.hp, merc: m0.merc }, aimed: { hp: m1.hp, merc: m1.merc, casts: m1.casts, fails: m1.fails }, notAimed: { hp: m2.hp, merc: m2.merc, casts: m2.casts, fails: m2.fails } }); }, 4000); }, 1500); }, 4000); })",
    offmercsay: OFF_MERC_SAY_EVAL,
    offraid: "new Promise((r) => { setTimeout(() => { const s0 = o.debugState(); const at6s = { raiders: s0.raiders, raids: s0.raids, tile: s0.tile }; const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); }, 500); let minHp = s0.hp; const w = setInterval(() => { minHp = Math.min(minHp, o.debugState().hp); }, 300); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ at6s, after: { raiders: s.raiders, raids: s.raids, gold: s.gold, hp: s.hp, maxHp: s.maxHp, minHp, dead: s.dead, merc: s.merc, mercTarget: s.mercTarget, ground: s.ground.length } }); }, 25000); }, 6000); })",
    offraidmage: "new Promise((r) => { setTimeout(() => { const s0 = o.debugState(); const at6s = { raiders: s0.raiders, raids: s0.raids, tile: s0.tile }; const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); }, 500); let minHp = s0.hp; const w = setInterval(() => { minHp = Math.min(minHp, o.debugState().hp); }, 300); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ at6s, after: { raiders: s.raiders, raids: s.raids, gold: s.gold, hp: s.hp, maxHp: s.maxHp, minHp, dead: s.dead, merc: s.merc, mercTarget: s.mercTarget, ground: s.ground.length } }); }, 25000); }, 6000); })",
    offraidpair: "new Promise((r) => { setTimeout(() => { const s0 = o.debugState(); const at6s = { raiders: s0.raiders, raids: s0.raids, tile: s0.tile }; const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); }, 500); let minHp = s0.hp; const w = setInterval(() => { minHp = Math.min(minHp, o.debugState().hp); }, 300); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ at6s, after: { raiders: s.raiders, raids: s.raids, gold: s.gold, hp: s.hp, maxHp: s.maxHp, minHp, dead: s.dead, merc: s.merc, mercTarget: s.mercTarget, ground: s.ground.length } }); }, 25000); }, 6000); })",
    offraidflee: "new Promise((r) => { const go = setInterval(() => { const rd = o.battle.raiders[0]; if (!rd) return; clearInterval(go); setTimeout(() => { rd.hp = Math.round(rd.maxHp * 0.2); rd.potionLeftMs = 120000; const log = []; let n = 0; const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); if (n++ % 4 === 0) { const x = s.raiders[0]; log.push(x ? x.hp + 'hp sp ' + x.stamina + (x.fleeing ? ' FLEEING' : '') + ' at ' + x.tile + ' me ' + s.tile.x + ',' + s.tile.y + ' ' + s.stamina + 'sp' : 'gone'); } }, 500); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ log, cornered: rd.cornered, flees: rd.flees, alive: rd.isAlive, raids: s.raids, gold: s.gold }); }, 30000); }, 2000); }, 300); })",
    offraidcast: "new Promise((r) => { const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (s.raiders.length && !o.battle.spells.busy) o.battle.spells.pressSpell('energyBolt'); }, 2000); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ interrupts: s.interrupts, casts: s.casts, raiders: s.raiders, hp: s.hp, dead: s.dead }); }, 20000); })",
    offraidmagehit: "new Promise((r) => { const t0 = Date.now(); let killedAt; const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); if (!killedAt && s.raids.killed) killedAt = Math.round((Date.now() - t0) / 1000); }, 500); const peek = []; const w = setInterval(() => { const x = o.debugState().raiders[0]; if (x) peek.push({ hp: x.hp + '/' + x.maxHp, sp: x.stamina, retreats: x.retreats, lost: x.interrupts, casts: x.casts, fleeing: x.fleeing }); }, 5000); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ peek, killedAtSeconds: killedAt, raids: s.raids, hp: s.hp, dead: s.dead }); }, 45000); })",
    offraidhold: "new Promise((r) => { const log = []; let n = 0; let heldSeen = 0; const t = setInterval(() => { const s = o.debugState(); heldSeen = Math.max(heldSeen, s.heldMs); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); if (n++ % 4 === 0) { const x = s.raiders[0]; log.push((s.heldMs ? 'HELD ' + s.heldMs + 'ms ' : '') + 'me ' + s.hp + 'hp ' + (x ? x.hp + '/' + x.maxHp + ' at ' + x.tile + ' holds ' + x.holdsLanded + '/' + x.holdTries + ' retreats ' + x.retreats + ' casts ' + x.casts : 'gone')); } }, 500); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ log, heldTimes: s.heldTimes, longestHeldMs: heldSeen, raids: s.raids, dead: s.dead }); }, 30000); })",
    offraidcrit: "new Promise((r) => { let shot = false; const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); }, 400); const w = setInterval(() => { const x = o.battle.raiders[0]; if (!shot && x && x.crits > 0) { shot = true; clearInterval(w); clearInterval(t); setTimeout(() => { const s = o.debugState(); r({ firstCritAt: s.raiders[0], hp: s.hp, maxHp: s.maxHp }); }, 250); } }, 100); setTimeout(() => { clearInterval(t); clearInterval(w); if (!shot) r({ noCrit: o.debugState().raiders }); }, 25000); })",
    offraidinvis: "new Promise((r) => { const all = () => o.battle['raiderList']; let heardHidden = 0, hiddenSamples = 0, clickable = 0, mercOnHidden = 0, monstersOnHidden = 0, hurtHidden = 0, firstSeen; const hp0 = o.debugState().hp; let lastHp = hp0; const w = setInterval(() => { const s = o.debugState(); const x = s.raiders[0]; const rd = all()[0]; if (!x || !rd) return; if (!x.seen) { hiddenSamples++; if (x.heard) heardHidden++; if (o.battle.monsterAt(rd.x, rd.y - 40)) clickable++; if (o.battle.merc && o.battle.merc.target === rd) mercOnHidden++; if (o.battle.pits.monsters.some((m) => m.isAlive && m.mode === 'attack' && String(m.victim).startsWith('raider'))) monstersOnHidden++; if (s.hp < lastHp) hurtHidden++; } else if (!firstSeen) { firstSeen = { tiles: Math.round(Math.hypot(rd.x - o.character.x, rd.y - o.character.y) / 32), hpLost: hp0 - s.hp, alpha: rd.character.container.alpha }; setTimeout(() => { rd.hp = 1; rd.potionLeftMs = 1e9; }, 3000); } lastHp = s.hp; if (firstSeen) { if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); } }, 200); setTimeout(() => { clearInterval(w); const s = o.debugState(); let saved; try { saved = JSON.parse(localStorage.getItem('hb-off.character')).enemyKills; } catch (e) { saved = 'n/a'; } r({ hiddenSamples, heardHidden, clickable, mercOnHidden, monstersOnHidden, hurtWhileHidden: hurtHidden, firstSeen, tally: o.battle.raidTally, savedEnemyKills: saved, raiders: s.raiders, hp: s.hp, dead: s.dead }); }, 40000); })",
    offraidinvismage: "new Promise((r) => { const all = () => o.battle['raiderList']; let heardHidden = 0, hiddenSamples = 0, clickable = 0, mercOnHidden = 0, monstersOnHidden = 0, hurtHidden = 0, firstSeen; const hp0 = o.debugState().hp; let lastHp = hp0; const w = setInterval(() => { const s = o.debugState(); const x = s.raiders[0]; const rd = all()[0]; if (!x || !rd) return; if (!x.seen) { hiddenSamples++; if (x.heard) heardHidden++; if (o.battle.monsterAt(rd.x, rd.y - 40)) clickable++; if (o.battle.merc && o.battle.merc.target === rd) mercOnHidden++; if (o.battle.pits.monsters.some((m) => m.isAlive && m.mode === 'attack' && String(m.victim).startsWith('raider'))) monstersOnHidden++; if (s.hp < lastHp) hurtHidden++; } else if (!firstSeen) { firstSeen = { tiles: Math.round(Math.hypot(rd.x - o.character.x, rd.y - o.character.y) / 32), hpLost: hp0 - s.hp, alpha: rd.character.container.alpha }; setTimeout(() => { rd.hp = 1; rd.potionLeftMs = 1e9; }, 3000); } lastHp = s.hp; if (firstSeen) { if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target && s.raiders.length) o.debugFightRaider(); } }, 200); setTimeout(() => { clearInterval(w); const s = o.debugState(); let saved; try { saved = JSON.parse(localStorage.getItem('hb-off.character')).enemyKills; } catch (e) { saved = 'n/a'; } r({ hiddenSamples, heardHidden, clickable, mercOnHidden, monstersOnHidden, hurtWhileHidden: hurtHidden, firstSeen, tally: o.battle.raidTally, savedEnemyKills: saved, raiders: s.raiders, hp: s.hp, dead: s.dead }); }, 40000); })",
    offek: "new Promise((r) => { o.openCharacter(); setTimeout(() => r({ open: o.scene.isActive('OffBag'), page: game.scene.getScene('OffBag').debugState().page }), 800); })",
    offraidmobs: "new Promise((r) => { const go = setInterval(() => { const rd = o.battle.raiders[0]; if (!rd) return; clearInterval(go); const troll = o.battle.pits.monsters.find((m) => m.isAlive && m.id === 'troll'); const tile = o.battle.freeTileNear(troll.mover.tileX + 2, troll.mover.tileY + 2); rd.mover.place(tile.x, tile.y); const log = []; let most = 0; const w = setInterval(() => { const n = o.battle.pits.monsters.filter((m) => m.isAlive && m.mode === 'attack' && String(m.victim).startsWith('raider')).length; most = Math.max(most, n); const s = o.debugState(); log.push(n + ' on it, ' + (s.raiders[0] ? s.raiders[0].hp + ' hp, after ' + s.raiders[0].victim + ' at ' + s.raiders[0].tile : 'gone')); }, 1000); setTimeout(() => { clearInterval(w); const s = o.debugState(); r({ mostMonstersOnRaider: most, log, raids: s.raids, hp: s.hp }); }, 12000); }, 300); })",
    offmerchard: "new Promise((r) => { const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target) o.debugFight('troll'); }, 500); let min = 1; const w = setInterval(() => { const m = o.battle.merc; min = Math.min(min, m.hp / m.maxHp); }, 300); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ minShare: Math.round(min * 100) / 100, drunk: s.mercDrunk, flees: s.mercFlees, said: s.mercSaid, merc: s.merc, mercDown: s.mercDown, hp: s.hp, dead: s.dead }); }, 40000); })",
    offmercregen: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); const m = o.battle.merc; m.hp = Math.round(m.maxHp * 0.6); const hp0 = m.hp; let fighting = 0; const w = setInterval(() => { if (o.battle.merc.target) fighting++; }, 500); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ hp0, batch: s.mercBatch, fightingSamples: fighting, merc: s.merc, drunk: s.mercDrunk, flees: s.mercFlees }); }, 32000); })",
    offmercpotion: "new Promise((r) => { const pick = (s) => ({ merc: s.merc, potion: s.mercPotion, drunk: s.mercDrunk, fleeing: s.mercFleeing, flees: s.mercFlees, saying: s.mercSaying, said: s.mercSaid }); const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); setTimeout(() => { const m = o.battle.merc; const before = pick(o.debugState()); m.hp = Math.max(1, Math.floor(m.maxHp * 0.05)); setTimeout(() => { clearInterval(t); r({ before, after: pick(o.debugState()) }); }, 1000); }, 3000); })",
    offmercflee: "new Promise((r) => { const pick = (s) => ({ merc: s.merc, potion: s.mercPotion, drunk: s.mercDrunk, fleeing: s.mercFleeing, flees: s.mercFlees, saying: s.mercSaying, said: s.mercSaid }); const near = () => { const m = o.battle.merc; let d = 99; for (const x of o.battle.pits.monsters) if (x.isAlive && x.mode === 'attack') d = Math.min(d, Math.max(Math.abs(x.mover.tileX - m.mover.tileX), Math.abs(x.mover.tileY - m.mover.tileY))); return d; }; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); setTimeout(() => { const m = o.battle.merc; m.potionLeftMs = 60000; m.hp = Math.max(1, Math.floor(m.maxHp * 0.05)); const d0 = near(); setTimeout(() => { clearInterval(t); const s1 = { ...pick(o.debugState()), nearest: near(), nearestAtStart: d0, target: o.debugState().mercTarget }; o.battle.merc.hp = Math.round(o.battle.merc.maxHp * 0.6); setTimeout(() => { const s2 = o.debugState(); r({ fleeing: s1, healed: { fleeing: s2.mercFleeing, target: s2.mercTarget, merc: s2.merc } }); }, 1500); }, 5000); }, 9000); })",
    offmercfleesafe: "new Promise((r) => { const pick = (s) => ({ merc: s.merc, potion: s.mercPotion, drunk: s.mercDrunk, fleeing: s.mercFleeing, flees: s.mercFlees, saying: s.mercSaying, said: s.mercSaid }); const m = o.battle.merc; m.potionLeftMs = 60000; m.hp = Math.max(1, Math.floor(m.maxHp * 0.05)); setTimeout(() => { const a = pick(o.debugState()); setTimeout(() => { const b = pick(o.debugState()); setTimeout(() => r({ at1s: a, at9s: b, at12s: pick(o.debugState()) }), 3000); }, 8000); }, 1000); })",
    offmercfleemage: "new Promise((r) => { const pick = (s) => ({ merc: s.merc, potion: s.mercPotion, drunk: s.mercDrunk, fleeing: s.mercFleeing, flees: s.mercFlees, saying: s.mercSaying, said: s.mercSaid }); const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); setTimeout(() => { const m = o.battle.merc; m.mana = 0; m.potionLeftMs = 60000; m.hp = Math.max(1, Math.floor(m.maxHp * 0.05)); setTimeout(() => { const a = { ...pick(o.debugState()), mana: o.debugState().mercMana }; o.battle.merc.mana = o.battle.merc.maxMana; setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ fled: a, withMana: { ...pick(s), mana: s.mercMana, casts: s.mercCasts } }); }, 4000); }, 3000); }, 3000); })",
    offmercsaymage: OFF_MERC_SAY_EVAL.replace('o.debugMercHp(5);', 'o.battle.merc.mana = 0; o.debugMercHp(5);'),
    offmercbehind: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('clayGolem'); }, 500); let paralyzed; const p = setInterval(() => { const m = o.battle.merc; if (m && m.target && m.target.isAlive && m.target.mode === 'attack') { clearInterval(p); const before = o.debugState().mercBehind; paralyzed = { before, monster: o.debugParalyze() }; const mon = m.target; setTimeout(() => { const f = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]][mon.mover.facing] || [0, 0]; paralyzed.at4s = { merc: `${m.mover.tileX},${m.mover.tileY}`, back: `${mon.mover.tileX - f[0]},${mon.mover.tileY - f[1]}`, behindBlows: o.debugState().mercBehind }; }, 4000); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ ...paralyzed, after: s.mercBehind, stillParalyzed: mon.isParalyzed, monsterNow: `${mon.mover.tileX},${mon.mover.tileY} facing ${mon.mover.facing} alive ${mon.isAlive}`, merc: s.merc, gaveUp: m.flankGaveUp === mon }); }, 7000); } }, 250); setTimeout(() => { clearInterval(p); clearInterval(t); if (!paralyzed) r({ error: 'no fight' }); }, 20000); })",
    offmerczerk: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('clayGolem'); }, 500); const heard = []; let last; const w = setInterval(() => { const s = o.debugState().mercSaying; if (s && s !== last) heard.push(s); last = s; }, 200); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ heard, said: s.mercSaid, mercBerserk: s.mercBerserk, merc: s.merc, hp: s.hp }); }, 10000); })",
    offmercmage: "new Promise((r) => { const s0 = o.debugState(); const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); let minHp = s0.hp; const w = setInterval(() => { minHp = Math.min(minHp, o.debugState().hp); }, 300); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ hpBefore: s0.hp, minHp, hpAfter: s.hp, maxHp: s.maxHp, dead: s.dead, merc: s.merc, mercCasts: s.mercCasts, mercMana: s.mercMana, mercKills: s.mercKills, kills: s.kills, onMerc: s.onMerc }); }, 25000); })",
    offmercmagezerk: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ berserk: s.berserk, shield: s.shield, mercCasts: s.mercCasts, mercMana: s.mercMana, merc: s.merc, hp: s.hp, blowAvg: s.blowAvg }); }, 15000); })",
    offmercwindow: "new Promise((r) => { const h = o.debugState().hirer; o.debugWalkTo(h.x - 1, h.y + 1, false); setTimeout(() => { o.openMercenaries(); setTimeout(() => { const m = game.scene.getScene('OffMercenary'); m.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffMercenary'), ...m.debugState() }), 300); }, 1200); }, 4000); })",
    offmercpoor: "new Promise((r) => { o.openMercenaries(); setTimeout(() => { const m = game.scene.getScene('OffMercenary'); m.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffMercenary'), ...m.debugState() }), 300); }, 900); })",
    offmerchired: "new Promise((r) => { o.openMercenaries(); setTimeout(() => { const m = game.scene.getScene('OffMercenary'); m.debugShowPadHints(); setTimeout(() => r({ open: game.scene.isActive('OffMercenary'), ...m.debugState() }), 300); }, 900); })",
    offmercdismiss: "new Promise((r) => { o.openMercenaries(); setTimeout(() => { const m = game.scene.getScene('OffMercenary'); m.debugShowPadHints(); m.askDismiss(); setTimeout(() => { const d = game.scene.getScene('OffDialog'); const ask = d.debugState(); d.answer(1); setTimeout(() => r({ ask, open: game.scene.isActive('OffMercenary'), merc: o.debugState().merc, saved: JSON.parse(localStorage.getItem('hb-off.character')).mercenary ?? null }), 800); }, 600); }, 900); })",
    offholdblows: "new Promise((r) => { const held = () => o.debugState().held; o.debugCast(0, 'clayGolem'); setTimeout(() => { const h1 = held(); o.debugWield('longSword'); o.debugFight('clayGolem'); setTimeout(() => { const h2 = { held: held(), target: o.debugState().target }; o.debugWield(''); o.debugCast(1, 'clayGolem'); setTimeout(() => { const p1 = held(); o.debugWield('longSword'); o.debugFight('clayGolem'); setTimeout(() => { r({ holdCast: h1, holdAfterBlows: h2, paralyzeCast: p1, paralyzeAfterBlows: { held: held(), target: o.debugState().target }, casts: o.debugState().casts, fails: o.debugState().fails }); }, 6000); }, 3500); }, 3000); }, 3500); })",
    offmercparalyze: "new Promise((r) => { const t = setInterval(() => { const s = o.debugState(); if (s.hp < s.maxHp * 0.4) o.debugDrink('hp'); if (!s.target) o.debugFight('clayGolem'); }, 500); let heldSeen = 0; const w = setInterval(() => { heldSeen = Math.max(heldSeen, o.debugState().held); }, 300); setTimeout(() => { clearInterval(t); clearInterval(w); const s = o.debugState(); r({ mercCasts: s.mercCasts, mercMana: s.mercMana, merc: s.merc, heldSeen, hp: s.hp, dead: s.dead, kills: s.kills }); }, 25000); })",
    offmercslime: "new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight(); }, 500); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ mercCasts: s.mercCasts, mercMana: s.mercMana, merc: s.merc, kills: s.kills, monsters: s.monsters }); }, 20000); })",
    offmercloot: "new Promise((r) => { const g0 = o.debugState().gold; o.debugDropLoot(3, 2, 250); o.debugDropLoot(-2, 3, 0, 'longSword'); o.debugDropLoot(4, -2, 0, 'redPotion'); setTimeout(() => { const s1 = o.debugState(); setTimeout(() => { const s2 = o.debugState(); r({ gold0: g0, at3s: { ground: s1.ground.length, picked: s1.mercPicked }, at15s: { gold: s2.gold, bag: s2.bag, ground: s2.ground, picked: s2.mercPicked, tile: s2.tile, merc: s2.merc, mercLoot: s2.mercLoot } }); }, 12000); }, 3000); })",
    offmercloot2: "new Promise((r) => { const g0 = o.debugState().gold; o.debugDropLoot(3, 2, 250); o.debugDropLoot(-2, 3, 0, 'longSword'); o.debugDropLoot(4, -2, 0, 'redPotion'); setTimeout(() => { const s1 = o.debugState(); setTimeout(() => { const s2 = o.debugState(); r({ gold0: g0, at3s: { ground: s1.ground.length, picked: s1.mercPicked }, at15s: { gold: s2.gold, bag: s2.bag, ground: s2.ground, picked: s2.mercPicked, tile: s2.tile, merc: s2.merc, mercLoot: s2.mercLoot } }); }, 12000); }, 3000); })",
    offmercdropped: "new Promise((r) => { const b0 = o.debugState().bag; o.debugDropBag(0); setTimeout(() => { const s = o.debugState(); r({ bagBefore: b0, bagAfter: s.bag, ground: s.ground, picked: s.mercPicked, merc: s.merc }); }, 10000); })",
    offberserk: "new Promise((r) => { let tries = 0; const cast = () => { tries++; o.debugPadCast(0); setTimeout(() => { const s1 = o.debugState(); if (s1.berserk === 0 && tries < 4) { cast(); return; } const wield = o.debugWield('longSword'); const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); }, 500); setTimeout(() => { const s2 = o.debugState(); o.debugEndBerserk(); setTimeout(() => { clearInterval(t); const s3 = o.debugState(); r({ tries, berserkAfterCast: s1.berserk, casts: s1.casts, fails: s1.fails, wield, weapon: s2.weapon, berserkWhileHitting: s2.berserk, avgWithBerserk: s2.blowAvg.berserk, avgWithout: s3.blowAvg.plain, berserkAtEnd: s3.berserk }); }, 12000); }, 12000); }, 4000); }; cast(); })",
    offcritnone: "new Promise((r) => { const b = o.battle; o.debugFight('slime'); setTimeout(() => { b.critPressed(); setTimeout(() => r({ charges: b.critStrike.charges, launched: b.critStrike.launched, strikes: b.critStrikeBlows }), 2000); }, 500); })",
    offcrit: "new Promise((r) => { const b = o.battle; let swings = 0; const land = b.landBlow.bind(b); b.landBlow = (blow) => { if (blow.lands) swings++; land(blow); }; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 500); setTimeout(() => { clearInterval(t); r({ landed: swings, critical: b.criticalBlows, percent: Math.round((b.criticalBlows / Math.max(1, swings)) * 100), effects: b.gearEffects }); }, 25000); })",
    offpoison: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); const s = o.debugState(); log.push(s.poisoned); }, 1000); setTimeout(() => { clearInterval(t); const s = o.debugState(); r({ weapon: s.weapon, kills: s.kills, poisonedEachSecond: log.join(' ') }); }, 15000); })",
    offlootlevel: "Object.fromEntries(['slime', 'orc', 'clayGolem', 'cyclops'].map((m) => [m, o.debugRollLoot(m, 3000)]))",
    offpause: "o.openPause(), new Promise((r) => setTimeout(() => r({ pause: game.scene.isActive('OffPause'), worldPaused: game.scene.isPaused('OffWorld'), hudPaused: game.scene.isPaused('OffHud'), ...game.scene.getScene('OffPause').debugState() }), 800))",
    offpausequit: "o.openPause(), new Promise((r) => setTimeout(() => { game.scene.getScene('OffPause').askQuit(); setTimeout(() => { const d = game.scene.getScene('OffDialog'); d.debugShowPadHints(); setTimeout(() => r({ dialog: game.scene.isActive('OffDialog'), pausePaused: game.scene.isPaused('OffPause'), ...d.debugState() }), 300); }, 500); }, 800))",
    offpausequityes: "o.openPause(), new Promise((r) => setTimeout(() => { game.scene.getScene('OffPause').askQuit(); setTimeout(() => { game.scene.getScene('OffDialog').answer(1); setTimeout(() => r({ home: game.scene.isActive('OffHome'), world: game.scene.isActive('OffWorld'), hud: game.scene.isActive('OffHud'), pause: game.scene.isActive('OffPause') }), 1500); }, 600); }, 800))",
    offcontrols: "o.openPause(), new Promise((r) => setTimeout(() => { game.scene.getScene('OffPause').openControls(); setTimeout(() => r({ controls: game.scene.isActive('OffControls'), ...game.scene.getScene('OffControls').debugState() }), 600); }, 800))",
    offweaponoff: "new Promise((r) => { const before = o.debugState(); o.openBag(); setTimeout(() => { const e = game.scene.getScene('OffBag'); e.debugMarkSlot('weapon'); const box = e.debugState().box; const off = e.remove('weapon'); e.close(); setTimeout(() => { const after = o.debugState(); const saved = JSON.parse(localStorage.getItem('hb-off.character')); r({ off, box, before: [before.weapon, before.attackMs], after: [after.weapon, after.attackMs], saved: { equipment: saved.equipment, bag: saved.bag } }); }, 1500); }, 1000); })",
    offequipswap: "new Promise((r) => { const before = o.debugState(); o.openBag(); setTimeout(() => { const e = game.scene.getScene('OffBag'); const at = (id) => e.debugState().bag.indexOf(id); const helmet = e.use(at('helmet')); const sword = e.use(at('longSword')); const hose = e.use(at('chainHose')); const hoseOff = e.remove('legs'); const hoseAgain = e.use(at('chainHose')); e.debugMark(at('leatherArmor')); const box = e.debugState().box; e.close(); setTimeout(() => { const after = o.debugState(); const saved = JSON.parse(localStorage.getItem('hb-off.character')); r({ helmet, sword, hose, hoseOff, hoseAgain, leatherBox: box, before: [before.weapon, before.attackMs, before.defense], after: [after.weapon, after.attackMs, after.defense], worldRunning: game.scene.isActive('OffWorld'), saved: { equipment: saved.equipment, bag: saved.bag } }); }, 1500); }, 1000); })",
    offregen: "new Promise((r) => { o.battle.hp = 1; o.battle.vitals.mana = 1; o.battle.vitals.stamina = 1; const start = o.debugState(); setTimeout(() => r({ start, end: o.debugState() }), 25000); })",
    offrabbit: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('rabbit'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); r({ start: log[0], mid: log[12], end: log[log.length - 1] }); }, 25000); })",
};
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
    const child = spawn('pnpm', ['exec', 'vite', '--port', String(PORT)], { cwd: ROOT, shell: true, stdio: 'ignore' });
    for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await serverUp()) return child;
    }
    child.kill();
    throw new Error(`The dev server did not start on port ${PORT}`);
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
    const off = game.scene.getScene('OffWorld');
    if (off && game.scene.isActive('OffWorld')) {
        const s = off.debugState();
        state.off = { tile: `${s.tile.x},${s.tile.y}`, moving: s.moving };
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

    // offslotsfull: four characters, one of them with the longest name and a huge EXP.
    if (name === 'offslotsfull') {
        await page.addInitScript(() => {
            const names = ['WWWWWWWWWW', 'Gorn', 'Kaila', 'Wolfbane'];
            names.forEach((n, i) => localStorage.setItem(i === 0 ? 'hb-off.character' : `hb-off.character.${i + 1}`, JSON.stringify({ version: 8, created: true, name: n, look: { gender: i % 2 ? 'female' : 'male', skin: i % 3, hairStyle: 1, hairColor: 2, underwear: 0 }, stats: { str: 14, vit: 12, dex: 14, int: 10, mag: 10 }, exp: i === 0 ? 99999999999 : 1000 * (i + 1), points: 0, equipment: {}, gold: 0, bag: [], warehouse: [], spells: [], spellKeys: [], padSpells: [] })));
            localStorage.setItem('hb-off.slot', '0');
        });
    }
    // offslotsold: a save from before Select Character (one character, no hb-off.slot).
    if (name === 'offslotsold') {
        await page.addInitScript(() => localStorage.setItem('hb-off.character', JSON.stringify({ version: 8, created: true, name: 'Oldie', look: { gender: 'female', skin: 0, hairStyle: 1, hairColor: 2, underwear: 0 }, stats: { str: 14, vit: 12, dex: 14, int: 10, mag: 10 }, exp: 500, points: 0, equipment: {}, gold: 0, bag: [], warehouse: [], spells: [], spellKeys: [], padSpells: [] })));
    }
    // ?open= (debugStart.ts) shows a menu screen: wait for it instead of the game.
    const openKey = { howtoplay: 'HowToPlay', settings: 'Settings', controls: 'Controls', credits: 'Credits', releasenotes: 'ReleaseNotes', achievements: 'Achievements', missions: 'Missions', slots: 'CharacterSlots', mapselect: 'MapSelect', town: 'Town', charinfo: 'CharacterInfo', equipment: 'Equipment', warehouse: 'Warehouse', runchoice: 'RunChoice', transfer: 'Transfer' }[params.get('open') ?? ''];
    const target = params.has('loading') ? 'Preload' : params.get('town') === 'portal' ? 'MapSelect' : params.has('shop') ? 'Shop' : params.has('smith') ? 'Smith' : params.has('talk') ? 'NpcDialog' : params.get('off') === 'game' ? 'OffHome' : params.get('off') === 'world' ? 'OffWorld' : params.get('off') === 'create' ? 'OffCreate' : params.get('off') === 'slots' ? 'OffSlots' : params.get('off') === 'uikit' ? 'OffUiKit' : params.has('off') && !openKey ? 'GameSelect' : openKey ?? (query ? 'Game' : 'MainMenu');
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
    const code = evalArg ?? (name === 'offbalance' ? offBalanceEval() : PRESET_EVAL[name]);
    const evalPromise = code === undefined ? undefined : page.evaluate(async (code) => {
        const game = window.__game;
        const g = game?.scene.getScene('Game');
        const o = game?.scene.getScene('OffWorld');
        try {
            // A promise is awaited, so an expression can watch the game for a while (e.g. the most particles in 3 s).
            return JSON.stringify(await new Function('game', 'g', 'o', `return (${code});`)(game, g, o));
        } catch (err) {
            return `error: ${err.message}`;
        }
    }, code);
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
    if (state.off) console.log(`  off: tile ${state.off.tile} · ${state.off.moving ? 'moving' : 'standing'}`);
    if (state.run) console.log(`  run: ${Object.entries(state.run).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    if (state.error) console.log(`  ${state.error}`);
    if (evalResult !== undefined && name === 'offbalance') {
        writeFileSync(join(OUT_DIR, 'offbalance.json'), JSON.stringify(JSON.parse(evalResult), null, 1));
        console.log(`  eval: report in .check/offbalance.json`);
    } else if (evalResult !== undefined) console.log(`  eval: ${evalResult}`);
    if (evalResult !== undefined && OFF_FARM[name] && !evalResult.startsWith('error')) {
        const { level, monster, gear } = OFF_FARM[name];
        writeFileSync(join(OUT_DIR, OFF_FARM_FILE), JSON.stringify({ ...readOffFarm(), [name]: { level, monster, gear, ...JSON.parse(evalResult) } }, null, 1));
    }
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
