// Atajos de prueba en la dirección (solo en desarrollo): saltan los menús y dejan la partida en la situación a revisar,
// sin tener que jugar hasta llegar ahí. Se usan desde scripts/check.mjs y a mano en el navegador.
//   ?play            → empieza la partida directamente (con la clase por defecto)
//   ?play=warrior    → con esa clase
//   ?debug=boss,god  → acciones al empezar, separadas por comas (se pueden repetir: minute,minute)
//   Se combina con ?ui=compact (interfaz de móvil).
// En el build publicado no hace nada.
import { isCharacterId, type CharacterId } from '../data/characters';

/** Actions that ?debug= can run at the start of a run (the same ones as the debug keys of GameScene). */
export const DEBUG_ACTIONS = ['horde', 'kill', 'levelup', 'levels', 'str', 'magic', 'pickups', 'minute', 'boss', 'god'] as const;
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
}

function readDebugStart(): DebugStart {
    const none: DebugStart = { play: false, character: undefined, actions: [] };
    if (!import.meta.env.DEV) return none;
    const params = new URLSearchParams(window.location.search);
    const play = params.get('play');
    const actions = (params.get('debug') ?? '').split(',').map((a) => a.trim()).filter(isDebugAction);
    return {
        play: play !== null || actions.length > 0,
        character: isCharacterId(play) ? play : undefined,
        actions,
    };
}

export const DEBUG_START = readDebugStart();
