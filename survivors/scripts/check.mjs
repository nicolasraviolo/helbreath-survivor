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
/** Off-4B: the bag of the inventory checks (index 1 = Long Sword, 2 = Helmet, 4 = Red Potion, then Blue Potion). */
const OFF_TEST_BAG = 'shortSword,longSword,helmet,targeShield,redPotion,bluePotion,bigRedPotion,greenPotion,slimeJelly';

const PRESETS = {
    menu: '',
    // Fase Off-0: Helbreath Off oculto tras ?off. Pantalla de elegir juego y escena (vacía) de Off.
    gameselect: 'off',
    off: 'off=game',
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
    // Fase Off-3B: ventana Character. offchar la abre en el nivel 5 (12 puntos); offassign reparte 3 en Str y 2 en Vit
    // con los + y Ok (en eval: stats, puntos y máximos antes y después, y lo guardado). offstamina corre con 5 de
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
    offbag: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offbagequip: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offbagdrink: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offbagdrop: `off=world&offreset&offlevel=5&offstats=str:14&offopen=bag&offbag=${OFF_TEST_BAG}`,
    offpotionlimit: `off=world&offreset&offlevel=5&offbag=${Array(10).fill('redPotion').concat(Array(10).fill('bluePotion')).join(',')},shortSword`,
    offpause: 'off=world&offreset&offlevel=5',
    // Fase Off-4A: botín. offlootview mata Slimes 14 s con ?offdrop=all y se para (captura con el botín en el suelo);
    // offloot, lo mismo y luego pisa las casillas con botín (en eval: suelo antes, oro y bolsa después). offbagfull
    // empieza con la bolsa llena (50 Red Potion) y ?offdrop=valuable: lo que pisa se queda en el suelo.
    offlootview: 'off=world&offreset&offlevel=3&offdrop=all',
    offloot: 'off=world&offreset&offlevel=3&offdrop=all',
    offbagfull: `off=world&offreset&offlevel=3&offdrop=valuable&offbag=${Array(50).fill('redPotion').join(',')}`,
    // Fase Off-5A: bandos. offportal pisa el portal de Aresden sin bando (sale "Do you want to join Aresden?");
    // offjoin contesta Yes (en eval: sitio, bando y lo guardado; captura en Aresden). offaresden / offelvine abren la
    // ciudad de cada bando (Play lleva a la tuya). offcityback, de Elvine: su portal lleva a Traveler Zone y el portal
    // de Elvine de allí vuelve sin preguntar. offotherportal: siendo de Elvine, el portal de Aresden no deja pasar.
    // offdeathhome: de Aresden, muere en Traveler Zone y reaparece en Aresden.
    offportal: 'off=world&offreset&offlevel=5&offplace=traveler&offat=81,79',
    offjoin: 'off=world&offreset&offlevel=5&offplace=traveler&offat=81,79',
    offaresden: 'off=world&offlevel=5&offfaction=aresden',
    offelvine: 'off=world&offlevel=5&offfaction=elvine',
    offcityback: 'off=world&offlevel=5&offfaction=elvine',
    offotherportal: 'off=world&offlevel=5&offfaction=elvine&offplace=traveler&offat=81,79',
    offdeathhome: 'off=world&offlevel=5&offfaction=aresden&offplace=traveler',
    // Fase Off-5B: tienda, herrero y almacén. offshop / offsmith / offwarehouse los abren (captura); en eval offshop
    // compra una Red Potion, offsmith compra la Long Sword e intenta la Plate Mail (sin oro) y mira la Battle Hammer
    // (Level 110), offsell vende la Long Sword y la Slime Jelly a mitad de precio, offwarehouse guarda la Cape y saca la
    // Long Sword, offdoor pisa la puerta de la tienda de Aresden (se abre) y offelvinedoor la del herrero de Elvine.
    offshop: 'off=world&offlevel=5&offfaction=aresden&offgold=500&offopen=shop&offbag=redPotion',
    offsmith: 'off=world&offlevel=5&offstats=str:14&offfaction=aresden&offgold=2000&offopen=smith&offbag=redPotion',
    offsell: 'off=world&offlevel=5&offfaction=aresden&offgold=100&offopen=shop&offbag=longSword,slimeJelly,redPotion',
    offwarehouse: 'off=world&offlevel=5&offfaction=elvine&offopen=warehouse&offbag=cape,redPotion&offwarehouse=longSword,bluePotion',
    offdoor: 'off=world&offlevel=5&offfaction=aresden&offgold=300&offplace=aresden&offat=128,172',
    offelvinedoor: 'off=world&offlevel=5&offfaction=elvine&offgold=300',
    // Fase Off-6A: magias. offmagic abre la pestaña Magic de la tienda (Int 26, 600 de oro); en eval aprende Magic
    // Missile y Fire Ball, e intenta Energy Bolt (sin oro) y Great Heal (sin Int). offbook abre el libro con cuatro magias;
    // en eval pone Fire Ball en F1 (Magic Missile se queda sin tecla) y quita Lightning de su tecla. offbookempty, sin magias.
    offmagic: 'off=world&offlevel=10&offstats=int:26&offfaction=aresden&offgold=600&offopen=magic',
    offbook: 'off=world&offlevel=10&offstats=int:50&offfaction=aresden&offspells=magicMissile,heal,fireBall,lightning&offopen=book',
    offbookempty: 'off=world&offreset&offlevel=3&offfaction=aresden&offopen=book',
    // Fase Off-6B: lanzar magias (sin arma, todas aprendidas: F1 Magic Missile, F3 Energy Bolt, F5 Fire Ball, F8 Fire
    // Strike). offcast lanza Energy Bolt al Slime más cercano y en eval sale el maná, los lanzamientos y el Slime;
    // offcastfire, Fire Ball a un Giant Scorpion de Aresden (quemadura); offcastice, Chill Wind (frenado); offcastfail, MAG 10 y nivel 9 con Lightning
    // (círculo 5): falla sin gastar maná; offcastshield, con escudo no deja.
    offcast: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=all',
    offcastfire: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=all&offfaction=aresden&offplace=aresden&offat=101,52',
    offcastice: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=chillWind&offfaction=aresden&offplace=aresden&offat=101,52',
    offcastfail: 'off=world&offlevel=9&offstats=int:20,mag:10&offgear=noweapon&offspells=lightning',
    offcastshield: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon,targeShield&offspells=all',
    // Fase Off-6C: offheal empieza con 5 de vida y lanza Heal (tecla 1); offshield pone Defense Shield (2) y luego
    // intenta Protection From Magic (6): no hace nada (comparten hueco); offhold, Hold Person (3) a un Slime;
    // offpadcast, RT + B (Defense Shield) y RT + X (Hold Person) como el mando; offbookpad, el libro con los huecos del mando.
    offheal: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offhp=5&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offshield: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    // offprotect: Protection From Magic (6): el círculo blanco bajo los pies mientras dura.
    // offdefenseaura: Defense Shield (2) y su aura bajo los pies.
    offdefenseaura: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offprotect: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offhold: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offpadcast: 'off=world&offlevel=30&offstats=int:50,mag:50&offgear=noweapon&offspells=heal,defenseShield,holdPerson,paralyze,greatHeal,protectionFromMagic',
    offbookpad: 'off=world&offlevel=30&offstats=int:50&offfaction=aresden&offspells=heal,defenseShield,holdPerson,fireBall,lightning&offopen=book',
    // Fase Off-5C: la ciudad entera. offcitypits / offelvinepits dan los monstruos vivos de cada tipo en Aresden / Elvine
    // (8 pits: 1 Slime, 2 Giant Ant, 2 Snake, 2 Orc, 1 Giant Scorpion); offorc pelea 20 s junto al pit de Orcs del
    // este de Aresden (Level 20, Long Sword); offscorpion, lo mismo con el Giant Scorpion del norte.
    offcitypits: 'off=world&offlevel=5&offfaction=aresden',
    offelvinepits: 'off=world&offlevel=5&offfaction=elvine',
    offorc: 'off=world&offlevel=20&offstats=str:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=243,201',
    offscorpion: 'off=world&offlevel=20&offstats=str:30&offgear=longSword&offfaction=aresden&offplace=aresden&offat=101,52',
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
    offportal: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => r({ confirm: game.scene.isActive('OffConfirm'), worldPaused: game.scene.isPaused('OffWorld'), state: o.debugState().place }), 3000))",
    offjoin: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => { const asked = game.scene.isActive('OffConfirm'); game.scene.getScene('OffConfirm').answer(true); setTimeout(() => { const s = o.debugState(); r({ asked, place: s.place, faction: s.faction, tile: s.tile, hp: s.hp, saved: JSON.parse(localStorage.getItem('hb-off.character')).faction }); }, 4000); }, 3000))",
    offcityback: "new Promise((r) => { const start = o.debugState().place; o.debugWalkTo(237, 140); setTimeout(() => { const s = o.debugState(); const mid = [s.place, s.tile]; o.debugWalkTo(128, 79); setTimeout(() => { const e = o.debugState(); r({ start, mid, end: [e.place, e.tile], asked: game.scene.isActive('OffConfirm') }); }, 6000); }, 5000); })",
    offotherportal: "o.debugWalkTo(81, 76), new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, faction: s.faction, tile: s.tile, asked: game.scene.isActive('OffConfirm') }); }, 3500))",
    offdeathhome: "new Promise((r) => { const start = o.debugState().place; o.battle.hp = 0; o.battle.die(); setTimeout(() => { const s = o.debugState(); r({ start, end: s.place, tile: s.tile, dead: s.dead, hp: [s.hp, s.maxHp] }); }, 6000); })",
    offshop: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const before = st.debugState(); st.mark(0); st.act(); setTimeout(() => r({ open: game.scene.isActive('OffStore'), hud: game.scene.isActive('OffHud'), before: { rows: before.rows, gold: before.gold }, after: st.debugState(), saved: (({ gold, bag }) => ({ gold, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }), 300); }, 1000))",
    offsmith: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const rows = st.debugState().rows; st.mark(rows.indexOf('longSword')); st.act(); const sword = st.debugState(); st.mark(rows.indexOf('plateMail')); st.act(); const plate = st.debugState(); st.mark(rows.indexOf('battleHammer')); const hammer = st.debugState(); st.mark(rows.indexOf('longSword')); r({ rows, sword: [sword.message, sword.gold], plate: plate.message, hammerBox: hammer.box, bag: JSON.parse(localStorage.getItem('hb-off.character')).bag }); }, 1000))",
    offsell: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); st.showTab('sell'); const before = st.debugState(); st.mark(0); st.act(); const one = st.debugState(); st.act(); const two = st.debugState(); r({ before: before.rows, one: [one.message, one.gold, one.rows], two: [two.message, two.gold, two.rows], saved: (({ gold, bag }) => ({ gold, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offwarehouse: "new Promise((r) => setTimeout(() => { const w = game.scene.getScene('OffWarehouse'); const before = w.debugState(); const store = w.moveItem('bag', 0); const take = w.moveItem('warehouse', 0); const after = w.debugState(); r({ before, store, take, after, saved: (({ bag, warehouse }) => ({ bag, warehouse }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offdoor: "o.debugWalkTo(126, 166, true), new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const open = game.scene.isActive('OffStore'); const state = open ? st.debugState() : undefined; r({ open, tile: o.debugState().tile, rows: state && state.rows.length, title: state && state.tab }); }, 14000))",
    offelvinedoor: "o.debugWalkTo(229, 112), new Promise((r) => setTimeout(() => { const open = game.scene.isActive('OffStore'); r({ open, tile: o.debugState().tile, rows: open ? game.scene.getScene('OffStore').debugState().rows.slice(0, 4) : undefined }); }, 9000))",
    offmagic: "new Promise((r) => setTimeout(() => { const st = game.scene.getScene('OffStore'); const learn = (id) => { st.mark(st.debugState().rows.indexOf(id)); st.act(); return st.debugState().message; }; const tab = st.debugState().tab; const mm = learn('magicMissile'); const fb = learn('fireBall'); const eb = learn('energyBolt'); const gh = learn('greatHeal'); st.mark(st.debugState().rows.indexOf('fireBall (learned)')); const after = st.debugState(); r({ tab, mm, fb, eb, gh, rows: after.rows, gold: after.gold, box: after.box, saved: (({ gold, spells, spellKeys }) => ({ gold, spells, spellKeys }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offbook: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffSpellBook'); const before = b.debugState(); b.mark(before.rows.indexOf('fireBall')); b.putOnKey(0); const fb = b.debugState(); b.mark(before.rows.indexOf('lightning')); b.takeOffKey(); const after = b.debugState(); r({ open: game.scene.isActive('OffSpellBook'), hud: game.scene.isActive('OffHud'), before, fb: { keys: fb.keys, message: fb.message }, after: { keys: after.keys, message: after.message }, saved: JSON.parse(localStorage.getItem('hb-off.character')).spellKeys }); }, 1000))",
    offcast: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }) => ({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }))(st); const before = pick(o.debugState()); o.debugCast(2, 'slime'); const preparing = pick(o.debugState()); setTimeout(() => r({ before, preparing, after: pick(o.debugState()) }), 2600); }, 1500))",
    offcastfire: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }) => ({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }))(st); const before = pick(o.debugState()); o.debugCast(4, 'giantScorpion'); const preparing = pick(o.debugState()); setTimeout(() => r({ before, preparing, after: pick(o.debugState()) }), 1800); }, 1500))",
    offcastice: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }) => ({ mana, maxMana, spell, casts, fails, prepareMs, burning, slowed, kills, target }))(st); const before = pick(o.debugState()); o.debugCast(0, 'giantScorpion'); const preparing = pick(o.debugState()); setTimeout(() => r({ before, preparing, after: pick(o.debugState()) }), 1500); }, 1500))",
    offcastfail: "new Promise((r) => setTimeout(() => { const pick = (st) => (({ mana, spell, casts, fails, prepareMs, level }) => ({ mana, spell, casts, fails, prepareMs, level }))(st); const before = pick(o.debugState()); let n = 0; const t = setInterval(() => { if (o.debugState().spell === 'idle') { n++; o.debugCast(0, 'slime'); } }, 500); setTimeout(() => { clearInterval(t); r({ before, after: pick(o.debugState()) }); }, 11000); }, 1500))",
    offcastshield: "new Promise((r) => setTimeout(() => { const before = o.debugState().mana; o.debugCast(2, 'slime'); setTimeout(() => r({ before, after: (({ mana, spell, casts, fails }) => ({ mana, spell, casts, fails }))(o.debugState()) }), 500); }, 1500))",
    offbookempty: "new Promise((r) => setTimeout(() => r(game.scene.getScene('OffSpellBook').debugState()), 1000))",
    offheal: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugCast(0); setTimeout(() => r({ before, after: pick() }), 2600); }, 1500))",
    offshield: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugCast(1); setTimeout(() => { const shield = pick(); o.debugCast(5); setTimeout(() => r({ before, shield, second: pick() }), 2600); }, 2600); }, 1500))",
    offdefenseaura: "new Promise((r) => setTimeout(() => { o.debugCast(1); setTimeout(() => r((({ mana, casts, fails, shield, defense }) => ({ mana, casts, fails, shield, defense }))(o.debugState())), 2000); }, 1500))",
    offprotect: "new Promise((r) => setTimeout(() => { o.debugCast(5); setTimeout(() => r((({ mana, casts, fails, shield }) => ({ mana, casts, fails, shield }))(o.debugState())), 2000); }, 1500))",
    offhold: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugCast(2, 'slime'); setTimeout(() => r({ before, after: pick() }), 2600); }, 1500))",
    offpadcast: "new Promise((r) => setTimeout(() => { const pick = () => (({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }) => ({ hp, maxHp, mana, spell, casts, fails, defense, shield, held, target }))(o.debugState()); const before = pick(); o.debugPadCast(1); setTimeout(() => { const shield = pick(); o.debugPadCast(2); setTimeout(() => r({ before, shield, hold: pick(), pad: o.debugState().padSpells }), 2600); }, 2600); }, 1500))",
    offbookpad: "new Promise((r) => setTimeout(() => { const b = game.scene.getScene('OffSpellBook'); const before = b.debugState(); b.mark(before.rows.indexOf('fireBall')); b.togglePad(3); const put = b.debugState(); b.togglePad(3); const off = b.debugState(); b.togglePad(0); r({ before: before.pad, put: { pad: put.pad, message: put.message }, off: { pad: off.pad, message: off.message }, end: b.debugState().pad, saved: JSON.parse(localStorage.getItem('hb-off.character')).padSpells }); }, 1000))",
    offcitypits: "new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, monsters: s.monsters }); }, 1500))",
    offelvinepits: "new Promise((r) => setTimeout(() => { const s = o.debugState(); r({ place: s.place, tile: s.tile, monsters: s.monsters }); }, 1500))",
    offorc: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('orc'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); const pick = (s) => s && ({ tile: s.tile, hp: [s.hp, s.maxHp], level: s.level, exp: s.exp, kills: s.kills, target: s.target, monsters: s.monsters, gold: s.gold, dead: s.dead }); r({ start: pick(log[0]), mid: pick(log[10]), end: pick(log[log.length - 1]) }); }, 20000); })",
    offscorpion: "new Promise((r) => { const log = []; const t = setInterval(() => { if (!o.debugState().target) o.debugFight('giantScorpion'); log.push(o.debugState()); }, 1000); setTimeout(() => { clearInterval(t); const pick = (s) => s && ({ tile: s.tile, hp: [s.hp, s.maxHp], level: s.level, exp: s.exp, kills: s.kills, target: s.target, monsters: s.monsters, gold: s.gold, dead: s.dead }); r({ start: pick(log[0]), mid: pick(log[10]), end: pick(log[log.length - 1]) }); }, 20000); })",
    offdeath: "new Promise((r) => { o.battle.exp += 200; const start = o.debugState(); o.battle.hp = 0; o.battle.die(); setTimeout(() => r({ start, end: o.debugState() }), 4000); })",
    offcreated: "new Promise((r) => { const c = game.scene.getScene('OffCreate'); c.changeStat('str', 1); const one = c.stats.str; c.createCharacter(); const blocked = game.scene.isActive('OffCreate'); c.applyPreset('warrior'); c.createCharacter(); setTimeout(() => r({ oneStr: one, blockedWithPointsLeft: blocked, saved: JSON.parse(localStorage.getItem('hb-off.character')), world: game.scene.isActive('OffWorld') }), 4000); })",
    offchar: "o.openCharacter(), new Promise((r) => setTimeout(() => r({ open: game.scene.isActive('CharacterInfo'), worldPaused: game.scene.isPaused('OffWorld'), state: o.debugState() }), 800))",
    offassign: "new Promise((r) => { const before = o.debugState(); o.openCharacter(); setTimeout(() => { const c = game.scene.getScene('CharacterInfo'); for (let i = 0; i < 3; i++) c.change('str', 1); c.change('vit', 1); c.change('vit', 1); c.change('chr', 1); c.confirm(); setTimeout(() => r({ before, after: o.debugState(), worldRunning: game.scene.isActive('OffWorld'), saved: JSON.parse(localStorage.getItem('hb-off.character')) }), 500); }, 500); })",
    offstamina: "new Promise((r) => { o.battle.vitals.stamina = 5; o.debugWalkTo(90, 100, true); const log = []; const t = setInterval(() => { const s = o.debugState(); log.push(`${s.stamina} ${s.stepMs}`); }, 250); setTimeout(() => { clearInterval(t); r({ log, end: o.debugState() }); }, 4500); })",
    offlootview: "(async () => { const fight = (ms) => new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 1000); setTimeout(() => { clearInterval(t); o.debugHold = false; o.battle.stopAttacking(); r(); }, ms); }); await fight(14000); return o.debugState(); })()",
    offloot: "(async () => { const fight = (ms) => new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 1000); setTimeout(() => { clearInterval(t); o.debugHold = false; o.battle.stopAttacking(); r(); }, ms); }); const walkAll = async () => { for (let i = 0; i < 4; i++) { const g = o.battle.ground.items[0]; if (!g) break; o.debugWalkTo(g.tileX, g.tileY, true); await new Promise((r) => setTimeout(r, 3500)); } }; await fight(14000); const before = o.debugState(); await walkAll(); const after = o.debugState(); return { kills: before.kills, groundBefore: before.ground, goldAfter: after.gold, bagAfter: after.bag, groundAfter: after.ground, saved: (({ gold, bag }) => ({ gold, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }; })()",
    offbagfull: "(async () => { const fight = (ms) => new Promise((r) => { const t = setInterval(() => { if (!o.debugState().target) o.debugFight('slime'); }, 1000); setTimeout(() => { clearInterval(t); o.debugHold = false; o.battle.stopAttacking(); r(); }, ms); }); await fight(8000); const before = o.debugState(); const g = o.battle.ground.items[0]; if (g) o.debugWalkTo(g.tileX, g.tileY, true); await new Promise((r) => setTimeout(r, 3500)); const after = o.debugState(); return { groundBefore: before.ground, tile: after.tile, bagSize: after.bag.length, groundAfter: after.ground }; })()",
    offequip: "o.openEquipment(), new Promise((r) => setTimeout(() => { const e = game.scene.getScene('OffEquipment'); e.debugMark('weapon', 4); r({ open: game.scene.isActive('OffEquipment'), worldPaused: game.scene.isPaused('OffWorld'), state: e.debugState() }); }, 1500))",
    offbag: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffInventory'); inv.debugMark(1); const m = () => o.battle.pits.monsters.filter((x) => x.isAlive).map((x) => `${x.mover.tileX},${x.mover.tileY}`).join(' '); const before = m(); setTimeout(() => r({ open: game.scene.isActive('OffInventory'), worldPaused: game.scene.isPaused('OffWorld'), monstersMoved: before !== m(), state: inv.debugState() }), 3000); }, 1000))",
    offbagequip: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffInventory'); const helmet = inv.use(2); const sword = inv.use(1); r({ helmet, sword, weapon: o.debugState().weapon, bag: inv.debugState().bag, saved: (({ equipment, bag }) => ({ equipment, bag }))(JSON.parse(localStorage.getItem('hb-off.character'))) }); }, 1000))",
    offbagdrink: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffInventory'); o.battle.hp = 5; const red = inv.use(4); const hp = o.battle.hp; const blue = inv.use(4); r({ red, hp, maxHp: o.battle.maxHp, blue, potions: inv.debugState().info, bag: inv.debugState().bag }); }, 1000))",
    offbagdrop: "new Promise((r) => setTimeout(() => { const inv = game.scene.getScene('OffInventory'); const drop = inv.drop(0); setTimeout(() => { const s = o.debugState(); r({ drop, tile: s.tile, ground: s.ground, bag: s.bag }); }, 1500); }, 1000))",
    offpotionlimit: "new Promise((r) => { const t = o.debugState().tile; o.battle.ground.drop({ item: 'bigRedPotion' }, t.x + 2, t.y); o.battle.ground.drop({ item: 'cape' }, t.x + 2, t.y); o.debugWalkTo(t.x + 2, t.y, false); setTimeout(() => { const s = o.debugState(); r({ tile: s.tile, ground: s.ground, bagSize: s.bag.length, potions: s.bag.filter((id) => id.includes('Potion')).length, hasCape: s.bag.includes('cape') }); }, 3000); })",
    offpause: "o.openPause(), new Promise((r) => setTimeout(() => r({ pause: game.scene.isActive('Pause'), worldPaused: game.scene.isPaused('OffWorld'), hudPaused: game.scene.isPaused('OffHud') }), 800))",
    offweaponoff: "new Promise((r) => { const before = o.debugState(); o.openEquipment(); setTimeout(() => { const e = game.scene.getScene('OffEquipment'); e.debugMark('weapon', 0); const box = e.debugState().box; const off = e.wear(0); e.close(); setTimeout(() => { const after = o.debugState(); const saved = JSON.parse(localStorage.getItem('hb-off.character')); r({ off, box, before: [before.weapon, before.attackMs], after: [after.weapon, after.attackMs], saved: { equipment: saved.equipment, bag: saved.bag } }); }, 1500); }, 1000); })",
    offequipswap: "new Promise((r) => { const before = o.debugState(); o.openEquipment(); setTimeout(() => { const e = game.scene.getScene('OffEquipment'); e.debugMark('helm'); const helmet = e.wear(1); e.debugMark('weapon'); const sword = e.wear(3); e.debugMark('legs'); const hose = e.wear(1); const hoseOff = e.wear(0); const hoseAgain = e.wear(1); e.debugMark('body', 1); const box = e.debugState().box; e.close(); setTimeout(() => { const after = o.debugState(); const saved = JSON.parse(localStorage.getItem('hb-off.character')); r({ helmet, sword, hose, hoseOff, hoseAgain, leatherBox: box, before: [before.weapon, before.attackMs, before.defense], after: [after.weapon, after.attackMs, after.defense], worldRunning: game.scene.isActive('OffWorld'), saved: { equipment: saved.equipment, bag: saved.bag } }); }, 1500); }, 1000); })",
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

    // ?open= (debugStart.ts) shows a menu screen: wait for it instead of the game.
    const openKey = { howtoplay: 'HowToPlay', settings: 'Settings', controls: 'Controls', credits: 'Credits', releasenotes: 'ReleaseNotes', achievements: 'Achievements', missions: 'Missions', slots: 'CharacterSlots', mapselect: 'MapSelect', town: 'Town', charinfo: 'CharacterInfo', equipment: 'Equipment', warehouse: 'Warehouse', runchoice: 'RunChoice', transfer: 'Transfer' }[params.get('open') ?? ''];
    const target = params.has('loading') ? 'Preload' : params.get('town') === 'portal' ? 'MapSelect' : params.has('shop') ? 'Shop' : params.has('smith') ? 'Smith' : params.has('talk') ? 'NpcDialog' : params.get('off') === 'game' ? 'OffHome' : params.get('off') === 'world' ? 'OffWorld' : params.get('off') === 'create' ? 'OffCreate' : params.has('off') && !openKey ? 'GameSelect' : openKey ?? (query ? 'Game' : 'MainMenu');
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
    const code = evalArg ?? PRESET_EVAL[name];
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
