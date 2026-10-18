// Atajos de prueba en la dirección (solo en desarrollo): saltan los menús y dejan la partida en la situación a revisar,
// sin tener que jugar hasta llegar ahí. Se usan desde scripts/check.mjs y a mano en el navegador.
//   ?play            → empieza la partida directamente (con la clase por defecto)
//   ?play=warrior    → con esa clase
//   ?debug=boss,god  → acciones al empezar, separadas por comas (se pueden repetir: minute,minute)
//                      finalboss = saltar directamente al jefe final (con sus esbirros)
//                      bosskill = saltar al jefe final y matarlo en cuanto salga (para ver el portal, Fase 13)
//                      totems = los 4 tótems en fila debajo del jugador (Fase 16B)
//                      stampede =lanzar ya una estampida (la primera de data/waves.ts, Fase 13B)
//                      resume = guardar y volver a cargar la partida, como con Continue (Fase 12)
//                      aim = apuntar a mano hacia la derecha todo el rato (sin ratón ni mando, Fase 15B)
//                      dodge = la mejor armadura de la clase en cada hueco: esquiva y resistencia (Fases 18A y 18B; sin logros esa partida)
//                      crits = Critical Strikes sin gastar cargas, para lanzar muchos seguidos (Fase 19A; tecla H en partida)
//                      stats = el panel de stats (C) abierto desde el principio
//                      aimstick = un dedo de mentira en el stick de apuntar, empujado a la derecha (con --mobile, Fase 15C)
//                      sim = partida simulada muy deprisa para medir el equilibrio (systems/SimRun.ts, Fase 13C)
//   ?trees=off       → árboles grandes en ese modo solo en esta partida (on, off), sin guardarlo
//   ?open=howtoplay  → abre esa pantalla de los menús (howtoplay, settings, credits, achievements, select = selección de personaje)
//   ?open=slots      → abre la pantalla de los 4 personajes guardados (Fase 17A)
//   ?characters=reset → borra los personajes guardados al cargar (demo = deja dos de ejemplo; Fase 17A)
//   ?achievements=reset → borra los logros conseguidos al cargar (all = los da todos, para ver la pantalla llena; Fase 14B)
//   ?metrics=send    → enviar las métricas de esta partida al servidor de verdad (en desarrollo no se envían; Fase 14A)
//   Se combina con ?ui=compact (interfaz de móvil).
// En el build publicado no hace nada.
import { isCharacterId, type CharacterId } from '../data/characters';
import { TREE_MODES, type TreeMode } from './settings';

/** Menu screens that ?open= shows straight away, and the scene of each one. */
const DEBUG_SCREENS = { howtoplay: 'HowToPlay', settings: 'Settings', credits: 'Credits', achievements: 'Achievements', select: 'CharacterSelect', slots: 'CharacterSlots' } as const;
type DebugScreen = keyof typeof DEBUG_SCREENS;

function isDebugScreen(value: string | null): value is DebugScreen {
    return value !== null && Object.prototype.hasOwnProperty.call(DEBUG_SCREENS, value);
}

/** Actions that ?debug= can run at the start of a run (the same ones as the debug keys of GameScene). */
export const DEBUG_ACTIONS = ['horde', 'kill', 'levelup', 'levels', 'str', 'magic', 'pickups', 'totems', 'minute', 'boss', 'finalboss', 'bosskill', 'stampede', 'dodge', 'stats', 'god', 'crits', 'aim', 'aimstick', 'resume', 'sim'] as const;
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
}

function readDebugStart(): DebugStart {
    const none: DebugStart = { play: false, character: undefined, actions: [], trees: undefined, open: undefined, achievements: undefined, characters: undefined, sendMetrics: false };
    if (!import.meta.env.DEV) return none;
    const params = new URLSearchParams(window.location.search);
    const play = params.get('play');
    const open = params.get('open');
    const achievements = params.get('achievements');
    const characters = params.get('characters');
    const trees = TREE_MODES.find((mode) => mode === params.get('trees'));
    const actions = (params.get('debug') ?? '').split(',').map((a) => a.trim()).filter(isDebugAction);
    return {
        play: play !== null || actions.length > 0 || trees !== undefined,
        character: isCharacterId(play) ? play : undefined,
        actions,
        trees,
        open: isDebugScreen(open) ? DEBUG_SCREENS[open] : undefined,
        achievements: achievements === 'reset' || achievements === 'all' ? achievements : undefined,
        characters: characters === 'reset' || characters === 'demo' ? characters : undefined,
        sendMetrics: params.get('metrics') === 'send',
    };
}

export const DEBUG_START = readDebugStart();
