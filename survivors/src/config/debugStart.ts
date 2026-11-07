// Atajos de prueba en la dirección (solo en desarrollo): saltan los menús y dejan la partida en la situación a revisar,
// sin tener que jugar hasta llegar ahí. Se usan desde scripts/check.mjs y a mano en el navegador.
//   ?play            → empieza la partida directamente (con la clase por defecto)
//   ?play=warrior    → con esa clase
//   ?debug=boss,god  → acciones al empezar, separadas por comas (se pueden repetir: minute,minute)
//                      onehp = el jugador se queda con 1 de vida (tecla U en partida), para probar morir y Abaddon's Blood
//                      finalboss = saltar directamente al jefe final (con sus esbirros)
//                      bosskill = saltar al jefe final y matarlo en cuanto salga (para ver el portal, Fase 13)
//                      totems = los 4 tótems en fila debajo del jugador (Fase 16B)
//                      charge = un corro de monstruos que embisten (Bunny, Ant, Dire Boar, Minotaur; los ya
//                               descargados en ese mapa) alrededor del jugador (Fase 27B)
//                      movement = un corro con todas las formas de moverse: deambular, rodear, embestir y guardar
//                                 distancia (Slime, Cat, Bunny, Mage-Orc; los ya descargados en ese mapa, Fase 27C)
//                      orcs = un corro de Orcs cerca del jugador (para mirar sprites de cerca, Fase 28¾)
//                      casters = un corro de los monstruos normales que lanzan magia (Hellhound, Cyclops, Cannibal Plant,
//                                Lich, Gargoyle, Hellclaw, Tigerworm), a distancia para que lancen (1-nov-2026)
//                      nosmooth = sin el filtro xBR de los sprites que se mueven (Fase 28¾B; para comparar con y sin)
//                      stampede =lanzar ya una estampida (la primera de data/waves.ts, Fase 13B)
//                      resume = guardar y volver a cargar la partida, como con Continue (Fase 12)
//                      aim = apuntar a mano hacia la derecha todo el rato (sin ratón ni mando, Fase 15B)
//                      dodge = la mejor armadura de la clase en cada hueco: esquiva y resistencia (Fases 18A y 18B; sin logros esa partida)
//                      crits = Critical Strikes sin gastar cargas y Meteor Strike del Mago sin recarga (Fases 19A y 19B; tecla H en partida)
//                      stats = el panel de stats (C) abierto desde el principio
//                      aimstick = un dedo de mentira en el stick de apuntar, empujado a la derecha (con --mobile, Fase 15C)
//                      charexp = la XP de la partida cuenta ×50 para el Level del personaje al terminarla (Fase 20A;
//                                juega el personaje fijo de esa clase: Gorn o Kaila)
//                      epic = todas las cartas de Power salen Epic (Fase 21½A)
//                      champion = sale un Champion a los 3 segundos (Fase 21½C)
//                      aura = la partida empieza con el Eye of the Storm (aura que frena) en rango 3 (Fase 28A); repetido, un rango más
//                      daggers = lo mismo con las Spinning Daggers (Fase 28B)
//                      angels = lo mismo con los Tutelary Angels (Fase 28C)
//                      stones = las cartas ofrecen siempre las pasivas (Xelima, Merien, Magnet) y magias (Fase 28) que no estén al máximo (Fase 20C)
//                      maxcards = todas las pasivas al máximo con cartas Epic, y las magias que quepan (cartas de poder, 1-nov-2026); antes de levelup, las cartas son de oro y vida
//                      elites = todos los monstruos (menos los jefes) salen élite, con el brillo rojo (M2)
//                      loot = cae un objeto de botín junto al jugador ahora y cada pocos segundos (Fase 21A)
//                      zem = cada jefe suelta también un Zem (Fase 21D)
//                      xelima = la Stone of Xelima cae del 5% de los monstruos (Fase 24C)
//                      bluebook = cae junto al jugador el Libro Azul de Bloody Shock Wave (Fase 26E); al cogerlo se
//                                 aprende para siempre (con ?characters=demo, Kaila; ?characters=reset lo olvida)
//                      nomana = la Maga empieza con el maná a 0, para ver cómo se rellena (Fase 26A)
//                      spelldrag = un dedo de mentira arrastra a la derecha el botón del hechizo de la Maga: se ve el anillo
//                                  donde caerá el Spell 2 (con --mobile o ?ui=compact, Fase 26B)
//                      sim = partida simulada muy deprisa para medir el equilibrio (systems/SimRun.ts, Fase 13C)
//   ?spells=fireBall,meteorStrike → hechizos del Mago en esta partida (uno automático y/o uno activo, en cualquier
//                      orden; los ids de data/spells.ts y data/activeSpells.ts), sin mirar requisitos (Fase 20D)
//   ?attr=sharp      → el arma de salida y todo el botín (que siempre es un arma) con ese atributo: sharp, poison o
//                      ancient (Fase 21B; las varitas nunca son poison)
//   ?attr=hpRecovery:7 → con valor (1–7; revisión del original C). ?attr2=gold:5 → además ese segundo atributo
//                      (hittingProbability, gold, experience, defenseRatio2, magicResistance2, hpRecovery2, mpRecovery2,
//                      physicalAbsorption, magicAbsorption) en todo el botín y en el arma de salida si puede llevarlo
//   ?weapon=lightAxe → el Guerrero empieza la partida con esa arma en la mano (id de data/weapons.ts), sin mirar
//                      requisitos ni lo que lleve puesto (bloque B, hachas: lightAxe, tomahawk, doubleAxe, warAxe, battleAxe;
//                      bloque C, martillos: hammer, battleHammer)
//   ?upgrade=3       → el arma (o varita) de salida a +3 en las partidas de prueba sin personaje (1–3; Fase 24D)
//   ?level=25        → partida de prueba como un personaje de ese Level: puntos repartidos y el mejor equipo que ya puede
//                      ponerse (config/simProfile.ts; revisión de la dificultad, 22-oct-2026). Con &build=str:2,vit:1,dex:1
//                      otro reparto (en partes); con &kit=start, solo el equipo de salida.
//   ?bot=stand       → la partida simulada se queda quieta (por defecto corre en círculos)
//   ?slash=2         → estilo de la estela del tajo (número en data/slash.ts; tecla Y para pasar al siguiente; M15)
//   ?loading=hold    → la pantalla de carga se queda a medias, para verla con calma (M8)
//   ?trees=off       → árboles grandes en ese modo solo en esta partida (on, off), sin guardarlo
//   ?open=howtoplay  → abre esa pantalla de los menús (howtoplay, settings, controls = Settings → Controls, credits, releasenotes = novedades, achievements,
//                     missions = Missions de William, Fase 29B)
//   ?open=transfer   → la ventana Transfer Save (código de traspaso, Fase 27½B) sobre el menú principal
//   ?tab=gameplay    → con ?open=settings, abre esa pestaña de Settings (audio, gameplay; M13)
//   ?open=slots      → abre la pantalla de los 4 personajes guardados (Fase 17A)
//   ?open=charinfo   → Select Character con la ventana Character abierta (Fase 20A), del primer personaje con puntos
//   ?open=equipment  → Select Character con la pantalla Equipment abierta (Fase 20B), del Guerrero (o el primero;
//                      con &class=mage, de la Maga); con &slot=spell1, con ese hueco elegido (Fase 26C)
//                      sin repartir (o del primero); con ?characters=demo, Gorn tiene puntos
//   ?gear=hpRecovery.7.gold.5:robe → al inventario con valores y segundo atributo (revisión del original C)
//   ?gear=plateMail,helmet → con ?characters=demo, los dos de ejemplo llevan esos objetos (los que su clase pueda
//                      ponerse, sin mirar requisitos; ids de data/weapons.ts y data/armor.ts). Para ver el equipo
//                      dibujado en la ventana Character (M17). "sharp:longSword" lo mete en el inventario con ese
//                      atributo (Fase 21B), para verlo en Equipment; "inv:plateMail", sin atributo (Fase 21D).
//                      "zemstone" les pone un Zem (Fase 21D). "up2:longSword" la mete en el inventario a +2 (Fase 24D).
//                      "learn:bloodyShockWave": Kaila ya ha aprendido ese hechizo de libro (Fase 26E).
//                      "dye3:cape": la llevan puesta, teñida del color 3 (1–15, data/dyes.ts; revisión del original D).
//   ?xelima=5        → cada personaje guardado tiene justo 5 Stone of Xelima en el inventario (Fase 24D)
//   ?open=warehouse  → Select Character con el baúl compartido abierto (Fase 21D), del personaje marcado
//   ?open=runchoice  → Select Character con la ventana Continue / New Run del personaje marcado (21-oct-2026), tenga
//                      partida guardada o no
//   ?characters=reset → Gorn y Kaila nuevos a Level 1, sin partidas (demo = Gorn con puntos y Kaila a Level 25; Fase 17A)
//   ?map=traveler    → con ?play/?debug, la partida en ese mapa (traveler, bisle, elvineGarden, middleland, icebound, barracks; Fase 22A). Sin él, Bleeding Isle
//   ?maps=all        → todos los mapas abiertos en Select Map (reset = olvida los mapas ganados; Fase 22A)
//   ?open=mapselect  → abre Select Map con el primer personaje guardado (o sin personaje)
//   ?open=town       → la ciudad (Fase 23) con el primer personaje guardado (o sin personaje); con &class=warrior, el
//                      primero de esa clase (Fase 24D)
//   ?town=portal     → con ?open=town, el personaje aparece sobre el teleport: se abre Select Map encima de la ciudad
//   ?town=barracks   → con ?open=town, aparece delante de la puerta de los Barracks (31-oct-2026)
//   ?town=william    → con ?open=town, aparece junto a ese NPC (howard, shopKeeper, william, tom; Fase 23B);
//                      con &talk, además se abre su panel
//   ?town=shopKeeper&shop → con ?open=town, se abre la tienda directamente (Fase 24B)
//   ?town=shopKeeper&dye → con ?open=town, se abren los tintes directamente (revisión del original D)
//   ?town=william&missions → con ?open=town, se abren las Missions de William directamente (Fase 29B)
//   ?town=tom&smith=buy → con ?open=town, se abre el herrero en Buy (o sell, o upgrade: Fase 24D) directamente (Fase 24C)
//   ?rescued=howard,tom → da esos NPCs por rescatados en este dispositivo (all = todos; reset = ninguno; Fase 29A).
//                      ?town=<npc> también pone a ese NPC en la ciudad, sin guardarlo
//   ?debug=rescue    → en una partida, el NPC secuestrado y su Guard aparecen cerca del jugador (Fase 29A)
//   ?unlocks=abaddon  → desbloquea Abaddon's Blood en este dispositivo (Fase 21E; reset = quita los desbloqueos)
//                      dice3,wine2 → 3 dados (Reroll) y 2 vinos (Skip) comprados (Fase 21½B; "dice" solo = 1, "dice0" = 0)
//   ?achievements=reset → borra los logros conseguidos al cargar (all = los da todos, para ver la pantalla llena; Fase 14B)
//                      (reset también pone a 0 los contadores de bajas de la Fase 29C)
//   ?unique=reset → olvida las tiradas fallidas de objetos únicos (Fase 30B); ?unique=iceStorm → el jefe final de un
//   mapa con únicos suelta siempre ese (con ?debug=unique, uno de los del mapa al azar).
//   ?kills=slime:2995,orc:1500 → pone esos contadores de bajas de todas las partidas (logros que se acumulan, Fase 29C)
//   ?offlevel=12 → Helbreath Off: el personaje empieza al principio de ese nivel, con sus puntos (Fase Off-2B)
//   ?offreset    → Helbreath Off: el personaje vuelve a nivel 1 sin experiencia (Fase Off-2B)
//   ?offgear=longSword,leatherArmor → Helbreath Off: se pone esos objetos (off/data/offItems.ts; Fase Off-3C); noweapon = sin arma, para lanzar magias (Off-6B)
//   ?offstats=str:30,dex:20 → Helbreath Off: pone esos stats (Fase Off-3C)
//   ?offgold=500 → Helbreath Off: el personaje tiene ese oro (Fase Off-4A)
//   ?offbag=shortSword,redPotion → Helbreath Off: la bolsa lleva eso (off/data/offItems.ts y offGoods.ts; Fase Off-4A)
//   ?offopen=bag → Helbreath Off: el inventario abierto al entrar en el mundo (Fase Off-4B); shop, smith, warehouse (Off-5B); magic = la tienda en la pestaña Magic, book = el libro de magias (Off-6A)
//   ?offfaction=aresden → Helbreath Off: el personaje es de ese bando (aresden, elvine; none = sin bando) (Fase Off-5A)
//   ?offplace=aresden&offat=120,160 → Helbreath Off: empieza en ese sitio (traveler, aresden, elvine), en esa casilla (Off-5A)
//   ?offspells=all → Helbreath Off: el personaje sabe todas las magias (o ?offspells=magicMissile,heal), en 1–8 por orden (Off-6A)
//   ?offhp=5 → Helbreath Off: el personaje empieza con esa vida (para probar Heal; Off-6C)
//   ?offdrop=all → Helbreath Off: todos los monstruos sueltan algo; ?offdrop=valuable, siempre un arma o escudo (Off-4A)
//   ?metrics=send    → enviar las métricas de esta partida al servidor de verdad (en desarrollo no se envían; Fase 14A)
//   Se combina con ?ui=compact (interfaz de móvil).
// En el build publicado no hace nada.
// Aparte (también en el build publicado; off/offAccess.ts, Fase Off-0): ?off → pantalla de elegir juego (Survivors u
// Off); ?off=game → directo a la escena de Helbreath Off. Sin ?off, Off no se ve.
import { isActiveSpellId, type ActiveSpellId } from '../data/activeSpells';
import { ATTRIBUTE_VALUE_MAX, isItemAttribute, isSecondaryAttribute, type ItemAttribute, type SecondaryAttribute } from '../data/attributes';
import { isUnlockId, type UnlockId } from '../data/abaddon';
import { isMapId, type MapId } from '../data/maps';
import { isStackableUnlockId, type StackableUnlockId } from '../data/rerollSkip';
import { isCharacterId, type CharacterId } from '../data/characters';
import { EQUIP_SLOT_IDS, isMeleeWeaponId, type EquipSlotId, type ItemId } from '../data/items';
import { UNIQUE_ITEM_IDS } from '../data/uniques';
import { SMITH_TABS, type SmithTab } from '../data/smith';
import { isAutoSpellId, type AutoSpellId } from '../data/spells';
import { UPGRADE_MAX } from '../data/upgrades';
import { isNpcId, type NpcId } from '../data/town';
import { TREE_MODES, type TreeMode } from './settings';
import { isOffFaction, isOffPlaceId, type OffFaction, type OffPlaceId } from '../off/data/offPlaceIds';
import { CHARACTER_LEVEL_MAX } from '../data/characterLevel';
import { STAT_IDS, type Stats } from '../data/stats';
import type { MeleeWeaponId } from '../data/weapons';
import type { SimKit } from './simProfile';

/** Menu screens that ?open= shows straight away, and the scene of each one. */
/** ?xelima= gives at most this many stones (a typo like 5000 would fill the inventory). */
const DEBUG_XELIMA_MAX = 30;

const DEBUG_SCREENS = { howtoplay: 'HowToPlay', settings: 'Settings', controls: 'Controls', credits: 'Credits', releasenotes: 'ReleaseNotes', achievements: 'Achievements', missions: 'Missions', slots: 'CharacterSlots', mapselect: 'MapSelect', town: 'Town', charinfo: 'CharacterInfo', equipment: 'Equipment', warehouse: 'Warehouse', runchoice: 'RunChoice', transfer: 'Transfer' } as const;
type DebugScreen = keyof typeof DEBUG_SCREENS;

function isDebugScreen(value: string | null): value is DebugScreen {
    return value !== null && Object.prototype.hasOwnProperty.call(DEBUG_SCREENS, value);
}

/** Actions that ?debug= can run at the start of a run (the same ones as the debug keys of GameScene). */
export const DEBUG_ACTIONS = ['horde', 'kill', 'levelup', 'levels', 'str', 'magic', 'pickups', 'totems', 'minute', 'boss', 'finalboss', 'bosskill', 'stampede', 'dodge', 'stats', 'god', 'crits', 'aim', 'aimstick', 'resume', 'sim', 'charexp', 'stones', 'elites', 'loot', 'zem', 'onehp', 'epic', 'champion', 'xelima', 'nomana', 'spelldrag', 'bluebook', 'charge', 'movement', 'aura', 'daggers', 'angels', 'orcs', 'casters', 'nosmooth', 'rescue', 'unique', 'maxcards'] as const;
export type DebugAction = (typeof DEBUG_ACTIONS)[number];

function isDebugAction(value: string): value is DebugAction {
    return (DEBUG_ACTIONS as readonly string[]).includes(value);
}

interface DebugStart {
    /** Skip the menus and start a run. */
    play: boolean;
    /** Class for that run, if one was given. */
    character: CharacterId | undefined;
    /** Actions run once the run has started, in order. */
    actions: DebugAction[];
    /** Large-tree mode for this run only (Settings is not changed). */
    trees: TreeMode | undefined;
    /** Scene key of the menu screen to open (an overlay over the main menu or CharacterSlots). */
    open: (typeof DEBUG_SCREENS)[DebugScreen] | undefined;
    /** Clear every unlocked achievement, or unlock them all, when the page loads. */
    achievements: 'reset' | 'all' | undefined;
    /** Clear the saved characters, or replace them with two examples, when the page loads. */
    characters: 'reset' | 'demo' | undefined;
    /** Send this run's anonymous stats even in development. */
    sendMetrics: boolean;
    /** The Mage's spells for the run, instead of the equipped ones. */
    spells: { auto: AutoSpellId | undefined; active: ActiveSpellId | undefined };
    /** Class whose Equipment screen ?open=equipment shows (?class=mage; the Warrior if none). */
    openClass: CharacterId | undefined;
    /** Slot the Equipment screen opens on (?slot=spell1), if one was given. */
    openSlot: EquipSlotId | undefined;
    /** Melee slash style to compare (its number in data/slash.ts), if one was given. */
    slash: number | undefined;
    /** ?loading=hold: the loading screen stops halfway (to look at it). */
    holdLoading: boolean;
    /** Items the ?characters=demo examples wear (checked in CharacterStore). */
    gear: string[];
    /** Settings tab to open first: the start of its name, in lower case (?tab=gameplay; M13). */
    settingsTab: string | undefined;
    /** ?unlocks=: permanent upgrades to unlock when the page loads, or 'reset' to clear them (Fase 21E). */
    unlocks: UnlockId[] | 'reset' | undefined;
    /** ?unlocks=dice3,wine2: how many of each upgrade bought several times (Fase 21½B). */
    unlockCounts: Partial<Record<StackableUnlockId, number>>;
    /** ?attr=: the starting weapon and every drop (always a weapon) get that attribute (Fase 21B). */
    attribute: ItemAttribute | undefined;
    /** ?attr=hpRecovery:13: that value for the attribute (Revisión del original C). */
    attributeValue: number | undefined;
    /** ?attr2=gold:5: every drop (and the starting weapon, if it can) gets that second attribute and value. */
    secondary: SecondaryAttribute | undefined;
    secondaryValue: number | undefined;
    /** ?map=: the map of a debug run (Fase 22A). */
    map: MapId | undefined;
    /** ?maps=all opens every map in Select Map; reset forgets the maps won (Fase 22A). */
    maps: 'all' | 'reset' | undefined;
    /** ?rescued=howard,tom marks those NPCs as rescued; all / reset (Fase 29A). */
    rescued: NpcId[] | 'all' | 'reset' | undefined;
    /** ?kills=slime:2995,orc:1500 sets those all-runs kill counters (Fase 29C); monster ids are checked by AchievementStore. */
    kills: Record<string, number>;
    /** ?unique=reset forgets the missed unique rolls; ?unique=<item id> makes the final boss always drop that unique (Fase 30B). */
    unique: ItemId | 'reset' | undefined;
    /** ?offlevel=N: Helbreath Off's character starts at the beginning of level N (Fase Off-2B). */
    offLevel: number | undefined;
    /** ?offreset: Helbreath Off's character back to level 1 (Fase Off-2B). */
    offReset: boolean;
    /** ?offgear=a,b: Helbreath Off's character wears those items (Fase Off-3C). */
    offGear: string[];
    /** ?offstats=str:30,dex:20: Helbreath Off's character gets those stats (Fase Off-3C). */
    offStats: Record<string, number>;
    /** ?offhp=N: Helbreath Off's character starts with that health (Off-6C, to test Heal). */
    offHp: number | undefined;
    /** ?offgold=N: Helbreath Off's character has that gold (Fase Off-4A). */
    offGold: number | undefined;
    /** ?offbag=a,b: Helbreath Off's bag holds those items (Fase Off-4A). */
    offBag: string[];
    /** Helbreath Off: ?offwarehouse=cape,redPotion fills the warehouse (Off-5B). */
    offWarehouse: string[];
    /** ?offopen=bag|shop|smith|warehouse|magic|book: that Helbreath Off window open on entering the world (Off-4B / 5B / 6A; magic = the shop on its Magic tab). */
    offOpen: 'bag' | 'shop' | 'smith' | 'warehouse' | 'magic' | 'book' | undefined;
    /** ?offspells=all|a,b: Helbreath Off's character knows those spells (Off-6A). */
    offSpells: 'all' | string[];
    /** ?offfaction=aresden|elvine|none: Helbreath Off's character has that faction, or none (Fase Off-5A). */
    offFaction: OffFaction | 'none' | undefined;
    /** ?offplace=aresden: Helbreath Off starts in that place (Fase Off-5A). */
    offPlace: OffPlaceId | undefined;
    /** ?offat=x,y: on that tile (Fase Off-5A). */
    offAt: { x: number; y: number } | undefined;
    /** ?offdrop=all|valuable: every monster drops something / a weapon or shield (Fase Off-4A). */
    offDrop: 'normal' | 'all' | 'valuable';
    /**
     * ?town=portal: the character appears on the town's teleport, so Select Map opens over the town (Fase 23).
     * ?town=<npc>: next to that NPC (Fase 23B); with &talk, its panel opens too.
     */
    townSpot: 'portal' | 'barracks' | NpcId | undefined;
    townTalk: boolean;
    /** ?town=shopKeeper&shop: the shop opens at once (Fase 24B). */
    townShop: boolean;
    /** ?town=shopKeeper&dye: the dyes open at once (Revisión del original D). */
    townDye: boolean;
    /** ?town=william&missions: William's Missions open at once (Fase 29B). */
    townMissions: boolean;
    /** ?town=tom&smith=buy|sell|upgrade: the blacksmith opens at once on that tab (Fase 24C; upgrade, 24D). */
    townSmith: SmithTab | undefined;
    /** ?weapon=lightAxe: the Warrior's weapon in hand for the run, whatever he wears (bloque B, axes). */
    weapon: MeleeWeaponId | undefined;
    /** ?upgrade=3: the starting weapon or wand of a run without a character at that "+" (Fase 24D). */
    upgrade: number | undefined;
    /** ?xelima=5: every saved character keeps exactly that many Stones of Xelima (Fase 24D). */
    xelima: number | undefined;
    /** ?gold=50000: the device's gold is set to that when the page loads (Fase 24A). */
    gold: number | undefined;
    /** ?level=25: debug runs play as a character of that Level, with ?build= and ?kit= (config/simProfile.ts). */
    level: number | undefined;
    build: Partial<Stats> | undefined;
    kit: SimKit;
    /** ?bot=stand: the simulated run stands still instead of running in circles. */
    simBot: 'circle' | 'stand';
}

/** "slime:2995,orc:1500" → { slime: 2995, orc: 1500 } (Fase 29C). */
function parseKills(text: string | null): Record<string, number> {
    const kills: Record<string, number> = {};
    for (const part of (text ?? '').split(',')) {
        const [enemy, count] = part.split(':').map((p) => p.trim());
        if (enemy && count && /^\d+$/.test(count)) kills[enemy] = Number(count);
    }
    return kills;
}

function readDebugStart(): DebugStart {
    const none: DebugStart = {
        play: false, character: undefined, actions: [], trees: undefined, open: undefined, achievements: undefined, characters: undefined,
        sendMetrics: false, spells: { auto: undefined, active: undefined }, openClass: undefined, openSlot: undefined, slash: undefined,
        holdLoading: false, gear: [], settingsTab: undefined, attribute: undefined, attributeValue: undefined, secondary: undefined, secondaryValue: undefined, unlocks: undefined, unlockCounts: {}, map: undefined, maps: undefined, rescued: undefined, kills: {}, unique: undefined, offLevel: undefined, offReset: false, offGear: [], offStats: {}, offGold: undefined, offHp: undefined, offBag: [], offWarehouse: [], offOpen: undefined, offSpells: [], offDrop: 'normal', offFaction: undefined, offPlace: undefined, offAt: undefined, townSpot: undefined, townTalk: false, townShop: false, townDye: false, townMissions: false, townSmith: undefined,
        gold: undefined, weapon: undefined, upgrade: undefined, xelima: undefined, level: undefined, build: undefined, kit: 'best', simBot: 'circle',
    };
    if (!import.meta.env.DEV) return none;
    const params = new URLSearchParams(window.location.search);
    const play = params.get('play');
    const open = params.get('open');
    const achievements = params.get('achievements');
    const characters = params.get('characters');
    const trees = TREE_MODES.find((mode) => mode === params.get('trees'));
    const actions = (params.get('debug') ?? '').split(',').map((a) => a.trim()).filter(isDebugAction);
    const spells = (params.get('spells') ?? '').split(',').map((s) => s.trim());
    const openClass = params.get('class');
    const openSlot = params.get('slot');
    const slash = params.get('slash');
    const [attribute, attributeValue] = (params.get('attr') ?? '').split(':');
    const [secondary, secondaryValue] = (params.get('attr2') ?? '').split(':');
    const unlocks = params.get('unlocks');
    const map = params.get('map');
    const maps = params.get('maps');
    const rescued = params.get('rescued');
    const gold = params.get('gold');
    const upgrade = params.get('upgrade');
    const weapon = params.get('weapon');
    const xelima = params.get('xelima');
    const level = params.get('level');
    return {
        play: play !== null || actions.length > 0 || trees !== undefined || slash !== null || isMapId(map),
        character: isCharacterId(play) ? play : undefined,
        actions,
        trees,
        open: isDebugScreen(open) ? DEBUG_SCREENS[open] : undefined,
        achievements: achievements === 'reset' || achievements === 'all' ? achievements : undefined,
        characters: characters === 'reset' || characters === 'demo' ? characters : undefined,
        sendMetrics: params.get('metrics') === 'send',
        spells: { auto: spells.find(isAutoSpellId), active: spells.find(isActiveSpellId) },
        openClass: isCharacterId(openClass) ? openClass : undefined,
        openSlot: EQUIP_SLOT_IDS.find((id) => id === openSlot),
        slash: slash !== null && /^\d+$/.test(slash) ? Number(slash) : undefined,
        holdLoading: params.get('loading') === 'hold',
        gear: (params.get('gear') ?? '').split(',').map((g) => g.trim()).filter((g) => g.length > 0),
        settingsTab: params.get('tab')?.toLowerCase() ?? undefined,
        attribute: isItemAttribute(attribute) ? attribute : undefined,
        attributeValue: debugAttributeValue(attributeValue),
        secondary: isSecondaryAttribute(secondary) ? secondary : undefined,
        secondaryValue: isSecondaryAttribute(secondary) ? debugAttributeValue(secondaryValue) ?? 1 : undefined,
        unlocks: unlocks === 'reset' ? 'reset' : unlocks ? unlocks.split(',').map((u) => u.trim()).filter(isUnlockId) : undefined,
        map: isMapId(map) ? map : undefined,
        maps: maps === 'all' || maps === 'reset' ? maps : undefined,
        rescued: rescued === 'all' || rescued === 'reset' ? rescued : rescued ? rescued.split(',').map((r) => r.trim()).filter(isNpcId) : undefined,
        kills: parseKills(params.get('kills')),
        unique: parseUnique(params.get('unique')),
        offLevel: parseOffLevel(params.get('offlevel')),
        offReset: params.has('offreset'),
        offGear: (params.get('offgear') ?? '').split(',').map((g) => g.trim()).filter((g) => g.length > 0),
        offStats: parseOffStats(params.get('offstats')),
        offGold: parseOffGold(params.get('offgold')),
        offHp: parseOffGold(params.get('offhp')),
        offBag: (params.get('offbag') ?? '').split(',').map((g) => g.trim()).filter((g) => g.length > 0),
        offWarehouse: (params.get('offwarehouse') ?? '').split(',').map((g) => g.trim()).filter((g) => g.length > 0),
        offOpen: parseOffOpen(params.get('offopen')),
        offSpells: params.get('offspells') === 'all' ? 'all' : (params.get('offspells') ?? '').split(',').map((g) => g.trim()).filter((g) => g.length > 0),
        offFaction: parseOffFaction(params.get('offfaction')),
        offPlace: parseOffPlace(params.get('offplace')),
        offAt: parseOffAt(params.get('offat')),
        offDrop: params.get('offdrop') === 'all' ? 'all' : params.get('offdrop') === 'valuable' ? 'valuable' : 'normal',
        townSpot: parseTownSpot(params.get('town')),
        townTalk: params.has('talk'),
        townShop: params.has('shop'),
        townDye: params.has('dye'),
        townMissions: params.has('missions'),
        townSmith: SMITH_TABS.find((tab) => tab === params.get('smith')),
        weapon: weapon !== null && isMeleeWeaponId(weapon) ? weapon : undefined,
        upgrade: upgrade !== null && /^[1-9]$/.test(upgrade) ? Math.min(UPGRADE_MAX, Number(upgrade)) : undefined,
        xelima: xelima !== null && /^\d+$/.test(xelima) ? Math.min(DEBUG_XELIMA_MAX, Number(xelima)) : undefined,
        unlockCounts: readUnlockCounts(unlocks),
        gold: gold !== null && /^\d+$/.test(gold) ? Number(gold) : undefined,
        level: level !== null && /^\d+$/.test(level) ? Math.min(CHARACTER_LEVEL_MAX, Math.max(1, Number(level))) : undefined,
        build: readBuild(params.get('build')),
        kit: params.get('kit') === 'start' ? 'start' : 'best',
        simBot: params.get('bot') === 'stand' ? 'stand' : 'circle',
    };
}

/** "str:2,vit:1" → { str: 2, vit: 1 } (?build=, config/simProfile.ts). */
function readBuild(value: string | null): Partial<Stats> | undefined {
    if (!value) return undefined;
    const build: Partial<Stats> = {};
    for (const part of value.split(',')) {
        const [id, amount] = part.split(':');
        const stat = STAT_IDS.find((s) => s === id?.trim());
        if (stat && amount !== undefined && /^\d+$/.test(amount.trim())) build[stat] = Number(amount);
    }
    return Object.keys(build).length > 0 ? build : undefined;
}

/** ?offfaction=aresden|elvine|none → that faction, 'none', or undefined (anything else). */
function parseOffOpen(value: string | null): DebugStart['offOpen'] {
    return value === 'bag' || value === 'shop' || value === 'smith' || value === 'warehouse' || value === 'magic' || value === 'book' ? value : undefined;
}

function parseOffFaction(value: string | null): OffFaction | 'none' | undefined {
    if (value === 'none') return 'none';
    return isOffFaction(value) ? value : undefined;
}

/** ?offplace=aresden → that place, or undefined. */
function parseOffPlace(value: string | null): OffPlaceId | undefined {
    return isOffPlaceId(value) ? value : undefined;
}

/** ?offat=x,y → that tile (whole numbers, 0 or more). */
function parseOffAt(value: string | null): { x: number; y: number } | undefined {
    const parts = (value ?? '').split(',').map((n) => Number(n));
    const [x, y] = parts;
    if (parts.length !== 2 || x === undefined || y === undefined || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) return undefined;
    return { x, y };
}

/** ?offgold=N → N (a whole number, 0 or more). */
function parseOffGold(value: string | null): number | undefined {
    if (value === null) return undefined;
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : undefined;
}

/** ?offstats=str:30,dex:20 → { str: 30, dex: 20 } (whole numbers above 0). */
function parseOffStats(value: string | null): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const part of (value ?? '').split(',')) {
        const [id, n] = part.split(':');
        const number = Number(n);
        if (id && Number.isInteger(number) && number > 0) stats[id.trim()] = number;
    }
    return stats;
}

/** ?offlevel=N → N, between 1 and Off's top level (140, the same as Survivors' Level). */
function parseOffLevel(value: string | null): number | undefined {
    const level = Number(value);
    return value !== null && Number.isInteger(level) ? Math.max(1, Math.min(CHARACTER_LEVEL_MAX, level)) : undefined;
}

function parseUnique(value: string | null): DebugStart['unique'] {
    if (value === 'reset') return 'reset';
    return [...UNIQUE_ITEM_IDS].find((id) => id === value);
}

/** "dice3,wine" → { dice: 3, wine: 1 } (Fase 21½B). */
function parseTownSpot(value: string | null): DebugStart['townSpot'] {
    if (value === 'portal' || value === 'barracks') return value;
    return value !== null && isNpcId(value) ? value : undefined;
}

function readUnlockCounts(unlocks: string | null): Partial<Record<StackableUnlockId, number>> {
    const counts: Partial<Record<StackableUnlockId, number>> = {};
    for (const token of (unlocks ?? '').split(',')) {
        const match = /^([a-z]+)(\d*)$/.exec(token.trim());
        if (match?.[1] && isStackableUnlockId(match[1])) counts[match[1]] = match[2] ? Number(match[2]) : 1;
    }
    return counts;
}

export const DEBUG_START = readDebugStart();

/** "7" → 7 (1..ATTRIBUTE_VALUE_MAX); anything else → undefined. */
function debugAttributeValue(text: string | undefined): number | undefined {
    const value = Number(text);
    return Number.isInteger(value) && value >= 1 && value <= ATTRIBUTE_VALUE_MAX ? value : undefined;
}
