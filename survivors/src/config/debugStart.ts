// Atajos de prueba en la dirección (solo en desarrollo): saltan los menús y dejan la partida en la situación a revisar,
// sin tener que jugar hasta llegar ahí. Se usan desde scripts/check.mjs y a mano en el navegador.
//   ?play            → empieza la partida directamente (con la clase por defecto)
//   ?play=warrior    → con esa clase
//   ?debug=boss,god  → acciones al empezar, separadas por comas (se pueden repetir: minute,minute)
//                      onehp = el jugador se queda con 1 de vida (tecla U en partida), para probar morir y Abaddon's Blood
//                      finalboss = saltar directamente al jefe final (con sus esbirros)
//                      bosskill = saltar al jefe final y matarlo en cuanto salga (para ver el portal, Fase 13)
//                      totems = los 4 tótems en fila debajo del jugador (Fase 16B)
//                      stampede =lanzar ya una estampida (la primera de data/waves.ts, Fase 13B)
//                      resume = guardar y volver a cargar la partida, como con Continue (Fase 12)
//                      aim = apuntar a mano hacia la derecha todo el rato (sin ratón ni mando, Fase 15B)
//                      dodge = la mejor armadura de la clase en cada hueco: esquiva y resistencia (Fases 18A y 18B; sin logros esa partida)
//                      crits = Critical Strikes sin gastar cargas y Meteor Strike del Mago sin recarga (Fases 19A y 19B; tecla H en partida)
//                      stats = el panel de stats (C) abierto desde el principio
//                      aimstick = un dedo de mentira en el stick de apuntar, empujado a la derecha (con --mobile, Fase 15C)
//                      charexp = la XP de la partida cuenta ×50 para el Level del personaje al terminarla (Fase 20A;
//                                con ?characters=demo juega el personaje de ejemplo de esa clase)
//                      stones = las cartas ofrecen siempre las pasivas (Xelima, Merien, Magnet) que no estén al máximo (Fase 20C)
//                      elites = todos los monstruos (menos los jefes) salen élite, con el brillo rojo (M2)
//                      loot = cae un objeto de botín junto al jugador ahora y cada pocos segundos (Fase 21A)
//                      zem = cada jefe suelta también un Zem (Fase 21D)
//                      sim = partida simulada muy deprisa para medir el equilibrio (systems/SimRun.ts, Fase 13C)
//   ?spells=fireBall,meteorStrike → hechizos del Mago en esta partida (uno automático y/o uno activo, en cualquier
//                      orden; los ids de data/spells.ts y data/activeSpells.ts), sin mirar requisitos (Fase 20D)
//   ?attr=sharp      → el arma de salida y todo el botín (que siempre es un arma) con ese atributo: sharp, poison o
//                      ancient (Fase 21B; las varitas nunca son poison)
//   ?slash=2         → estilo de la estela del tajo (número en data/slash.ts; tecla Y para pasar al siguiente; M15)
//   ?loading=hold    → la pantalla de carga se queda a medias, para verla con calma (M8)
//   ?trees=off       → árboles grandes en ese modo solo en esta partida (on, off), sin guardarlo
//   ?open=howtoplay  → abre esa pantalla de los menús (howtoplay, settings, controls = Settings → Controls, credits, releasenotes = novedades, achievements, select = selección de personaje)
//   ?tab=gameplay    → con ?open=settings, abre esa pestaña de Settings (audio, gameplay; M13)
//   ?open=slots      → abre la pantalla de los 4 personajes guardados (Fase 17A)
//   ?open=charinfo   → Select Character con la ventana Character abierta (Fase 20A), del primer personaje con puntos
//   ?open=equipment  → Select Character con la pantalla Equipment abierta (Fase 20B), del Guerrero (o el primero;
//                      con &class=mage, de la Maga)
//                      sin repartir (o del primero); con ?characters=demo, Gorn tiene puntos
//   ?gear=plateMail,helmet → con ?characters=demo, los dos de ejemplo llevan esos objetos (los que su clase pueda
//                      ponerse, sin mirar requisitos; ids de data/weapons.ts y data/armor.ts). Para ver el equipo
//                      dibujado en la ventana Character (M17). "sharp:longSword" lo mete en el inventario con ese
//                      atributo (Fase 21B), para verlo en Equipment; "inv:plateMail", sin atributo (Fase 21D).
//                      "zemstone" les pone un Zem (Fase 21D).
//   ?open=warehouse  → Select Character con el baúl compartido abierto (Fase 21D), del personaje marcado
//   ?open=runchoice  → Select Character con la ventana Continue / New Run del personaje marcado (21-oct-2026), tenga
//                      partida guardada o no
//   ?characters=reset → borra los personajes guardados al cargar (demo = deja dos de ejemplo; Fase 17A)
//   ?unlocks=abaddon  → desbloquea Abaddon's Blood en este dispositivo (Fase 21E; reset = quita los desbloqueos)
//   ?achievements=reset → borra los logros conseguidos al cargar (all = los da todos, para ver la pantalla llena; Fase 14B)
//   ?metrics=send    → enviar las métricas de esta partida al servidor de verdad (en desarrollo no se envían; Fase 14A)
//   Se combina con ?ui=compact (interfaz de móvil).
// En el build publicado no hace nada.
import { isActiveSpellId, type ActiveSpellId } from '../data/activeSpells';
import { isItemAttribute, type ItemAttribute } from '../data/attributes';
import { isUnlockId, type UnlockId } from '../data/abaddon';
import { isCharacterId, type CharacterId } from '../data/characters';
import { isAutoSpellId, type AutoSpellId } from '../data/spells';
import { TREE_MODES, type TreeMode } from './settings';

/** Menu screens that ?open= shows straight away, and the scene of each one. */
const DEBUG_SCREENS = { howtoplay: 'HowToPlay', settings: 'Settings', controls: 'Controls', credits: 'Credits', releasenotes: 'ReleaseNotes', achievements: 'Achievements', select: 'CharacterSelect', slots: 'CharacterSlots', charinfo: 'CharacterInfo', equipment: 'Equipment', warehouse: 'Warehouse', runchoice: 'RunChoice' } as const;
type DebugScreen = keyof typeof DEBUG_SCREENS;

function isDebugScreen(value: string | null): value is DebugScreen {
    return value !== null && Object.prototype.hasOwnProperty.call(DEBUG_SCREENS, value);
}

/** Actions that ?debug= can run at the start of a run (the same ones as the debug keys of GameScene). */
export const DEBUG_ACTIONS = ['horde', 'kill', 'levelup', 'levels', 'str', 'magic', 'pickups', 'totems', 'minute', 'boss', 'finalboss', 'bosskill', 'stampede', 'dodge', 'stats', 'god', 'crits', 'aim', 'aimstick', 'resume', 'sim', 'charexp', 'stones', 'elites', 'loot', 'zem', 'onehp'] as const;
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
    /** Scene key of the menu screen to open (an overlay over the main menu, CharacterSelect or CharacterSlots). */
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
    /** ?attr=: the starting weapon and every drop (always a weapon) get that attribute (Fase 21B). */
    attribute: ItemAttribute | undefined;
}

function readDebugStart(): DebugStart {
    const none: DebugStart = {
        play: false, character: undefined, actions: [], trees: undefined, open: undefined, achievements: undefined, characters: undefined,
        sendMetrics: false, spells: { auto: undefined, active: undefined }, openClass: undefined, slash: undefined,
        holdLoading: false, gear: [], settingsTab: undefined, attribute: undefined, unlocks: undefined,
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
    const slash = params.get('slash');
    const attribute = params.get('attr');
    const unlocks = params.get('unlocks');
    return {
        play: play !== null || actions.length > 0 || trees !== undefined || slash !== null,
        character: isCharacterId(play) ? play : undefined,
        actions,
        trees,
        open: isDebugScreen(open) ? DEBUG_SCREENS[open] : undefined,
        achievements: achievements === 'reset' || achievements === 'all' ? achievements : undefined,
        characters: characters === 'reset' || characters === 'demo' ? characters : undefined,
        sendMetrics: params.get('metrics') === 'send',
        spells: { auto: spells.find(isAutoSpellId), active: spells.find(isActiveSpellId) },
        openClass: isCharacterId(openClass) ? openClass : undefined,
        slash: slash !== null && /^\d+$/.test(slash) ? Number(slash) : undefined,
        holdLoading: params.get('loading') === 'hold',
        gear: (params.get('gear') ?? '').split(',').map((g) => g.trim()).filter((g) => g.length > 0),
        settingsTab: params.get('tab')?.toLowerCase() ?? undefined,
        attribute: isItemAttribute(attribute) ? attribute : undefined,
        unlocks: unlocks === 'reset' ? 'reset' : unlocks ? unlocks.split(',').map((u) => u.trim()).filter(isUnlockId) : undefined,
    };
}

export const DEBUG_START = readDebugStart();
