// Mapas jugables (Fase 22A): qué .amd usar, qué recorte es la zona de juego (en casillas), sus monstruos y jefes, cómo
// se desbloquea y lo difícil que es. El orden de MAPS_DATA es el de la pantalla Select Map y el del desbloqueo:
// un mapa se abre al ganar el anterior o al llegar a su Level recomendado (lo que pase antes; decidido el 20-oct-2026).
// Sus oleadas están en data/waves.ts (TIMELINES), una línea de tiempo por mapa.
// Zonas de juego medidas con un script sobre los .amd (20-oct-2026; NOTES.md, "Mapas").
import type { MapKey, MinimapKey, SoundKey, SpriteKey } from '../config/assetManifest';
import { MUSIC } from './audio';
import type { EnemyId } from './enemies';

export interface TileRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Multipliers for the normal monsters of a map (bosses are tuned one by one in enemies.ts). */
export interface MapDifficulty {
    /** Health, and the XP of their gems (weaker monsters give less, so an easy map is not the best place to farm). */
    hp: number;
    /** Damage of their blows and projectiles. */
    damage: number;
}

/** Monsters exactly as in enemies.ts. */
export const NO_DIFFICULTY: MapDifficulty = { hp: 1, damage: 1 };

export interface MapDef {
    name: string;
    asset: MapKey;
    /** Size of the whole .amd in tiles (to cut the play area out of the minimap picture before the map is loaded). */
    size: { width: number; height: number };
    /** Picture of the whole map for the minimap (Fase 16A) and the Select Map card. */
    minimap: MinimapKey;
    /** Region of the map where the game happens. Camera and player stay inside it. */
    playArea: TileRect;
    /** Monsters of this map besides the essential ones (ESSENTIAL_ENEMIES): stronger, and fewer of them. */
    localEnemies: readonly EnemyId[];
    /** Mini-bosses and final boss of this map. */
    bosses: readonly EnemyId[];
    /** Character Level shown on Select Map; reaching it also unlocks the map. */
    recommendedLevel: number;
    difficulty: MapDifficulty;
    /** Music while no boss is out. */
    music: SoundKey;
    /** One line on the Select Map card. */
    description: string;
    /** Effect sprites its bosses' spells need besides RUN_SPRITES (Icebound's ice: fx.effect4, otherwise only the Mage's). */
    runSprites?: readonly SpriteKey[];
    /** Not playable yet: shown as "Coming soon" (its waves come in a later block). */
    comingSoon?: boolean;
    /** Training map (the Barracks, data/training.ts): always open, no waves, no rewards, no saving, no dying. */
    training?: boolean;
}

export const MAPS_DATA = {
    // Mapa de introducción (20-oct-2026): muchos monstruos muy flojos, 8 minutos, Stone Golem y Dummy de jefes.
    // Ventana de 100×100 con un 84% libre (el mapa entero es pequeño, 170×170).
    traveler: {
        name: 'Traveler Zone', asset: 'map.traveler', size: { width: 170, height: 170 }, minimap: 'minimap.traveler', playArea: { x: 40, y: 38, width: 100, height: 100 },
        // Dificultad subida en el 22C (antes 0,5 / 0,4): el propietario la vio demasiado fácil.
        localEnemies: ['bunny', 'cat'], bosses: ['stoneGolemBoss', 'dummy'], recommendedLevel: 1, difficulty: { hp: 0.7, damage: 0.6 },
        music: MUSIC.normal, description: 'Where every adventure begins.',
    },
    // Ventana de 150×150 casillas con un 95% libre, todo conectado (medido el 18-oct-2026; NOTES.md).
    bisle: {
        name: 'Bleeding Isle', asset: 'map.bisle', size: { width: 274, height: 250 }, minimap: 'minimap.bisle', playArea: { x: 66, y: 52, width: 150, height: 150 },
        localEnemies: ['cyclops', 'mountainGiant', 'ogre', 'cannibalPlant'], bosses: ['ettin', 'demon', 'fireWyvern'],
        recommendedLevel: 10, difficulty: { hp: 1, damage: 1 }, music: MUSIC.normal, description: 'An island soaked in blood.',
    },
    // Bloque 22D (21-oct-2026). Ventana de 150×150 con un 86% libre. Más difícil que Bleeding Isle (×1,3, propietario).
    elvineGarden: {
        name: 'Elvine Garden', asset: 'map.elvineGarden', size: { width: 200, height: 200 }, minimap: 'minimap.elvineGarden', playArea: { x: 24, y: 26, width: 150, height: 150 },
        localEnemies: ['troll', 'werewolf', 'giantTree', 'cannibalPlant'], bosses: ['hellhoundBoss', 'stalkerBoss', 'cyclopsBoss'],
        recommendedLevel: 25, difficulty: { hp: 1.3, damage: 1.3 }, music: MUSIC.normal, description: 'The gardens outside Elvine.',
    },
    // Bloque 22E (21-oct-2026). Ventana de 150×150 con un 94% libre (el mapa entero es enorme, 524×524). Más difícil
    // que Elvine Garden (×1,6, propietario) y más larga: 15 minutos.
    middleland: {
        name: 'Middleland', asset: 'map.middleland', size: { width: 524, height: 524 }, minimap: 'minimap.middleland', playArea: { x: 36, y: 274, width: 150, height: 150 },
        localEnemies: ['werewolf', 'troll', 'ogre', 'cyclops', 'stalker', 'ettinRegular'],
        bosses: ['mountainGiantBoss', 'giantLizard', 'ettinBerserk', 'unicorn'],
        recommendedLevel: 40, difficulty: { hp: 1.6, damage: 1.6 }, music: MUSIC.normal,
        description: 'The battlefield between the two cities.',
    },
    // Bloque 30A (27-oct-2026). Campo nevado (300×300). Ventana de 150×150 con un 79% libre y un 78% en una sola pieza
    // (la mejor conectada; a 200×200 bajaba al 75%). Después de Middleland, Level 55, ×1,9 (propietario). 15 minutos.
    // Música: default.mp3, el tema general del original (no tenía uno propio).
    icebound: {
        name: 'Icebound', asset: 'map.icebound', size: { width: 300, height: 300 }, minimap: 'minimap.icebound', playArea: { x: 126, y: 126, width: 150, height: 150 },
        localEnemies: ['rudolph', 'iceGolem', 'beholder', 'clawTurtle'],
        bosses: ['frostBoss', 'nizieBoss', 'tigerwormBoss'],
        recommendedLevel: 55, difficulty: { hp: 1.9, damage: 1.9 }, music: 'music.default', runSprites: ['fx.effect4'],
        description: 'A frozen field where the cold bites.',
    },
    // Barracks (31-oct-2026, propietario): entrenamiento con muñecos (data/training.ts). Los Barracks de Elvine
    // (elvbrk11.amd, 150×150, 225 KB): la zona de juego es la arena entera (un rombo de ~105×90, 5.739 casillas libres).
    // No sale en Select Map (HUNT_MAP_IDS): se entra por su puerta en la ciudad (TOWN.barracksDoor). Siempre abierto
    // en MapUnlockStore; va el último para no contar en el orden de desbloqueo.
    barracks: {
        name: 'Barracks', asset: 'map.barracks', size: { width: 150, height: 150 }, minimap: 'minimap.barracks', playArea: { x: 18, y: 29, width: 110, height: 94 },
        localEnemies: ['trainingDummy', 'attackDummy'], bosses: [], recommendedLevel: 1, difficulty: { hp: 1, damage: 1 }, music: MUSIC.normal,
        description: 'Hit the Dummies to test your damage.', training: true,
    },
} as const satisfies Record<string, MapDef>;

export type MapId = keyof typeof MAPS_DATA;

/** In Select Map order. */
export const MAP_IDS = Object.keys(MAPS_DATA) as MapId[];

/** Saved runs from before Fase 22 (no map, or one that is gone) go on here. */
export const DEFAULT_MAP: MapId = 'bisle';

/** The first map: always open. */
export const FIRST_MAP: MapId = 'traveler';

/** Registry key: the map chosen in Select Map (GameScene reads it). */
export const CHOSEN_MAP_KEY = 'chosenMap';

export function getMapDef(id: MapId): MapDef {
    return MAPS_DATA[id];
}

/** The Barracks (training): no waves, no rewards, no saving, no dying. */
export function isTrainingMap(id: MapId): boolean {
    const def: MapDef = MAPS_DATA[id];
    return def.training === true;
}

/** The hunting maps, in Select Map order (the Barracks is entered through its door in the town). */
export const HUNT_MAP_IDS: readonly MapId[] = MAP_IDS.filter((id) => !isTrainingMap(id));

export function isMapId(value: unknown): value is MapId {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MAPS_DATA, value);
}

/** The map before this one in the order (undefined for the first). */
export function previousMap(id: MapId): MapId | undefined {
    return MAP_IDS[MAP_IDS.indexOf(id) - 1];
}
