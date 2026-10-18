// Mapas jugables: qué .amd usar y qué recorte es la zona de juego (en casillas).
import type { MapKey, MinimapKey } from '../config/assetManifest';
import type { EnemyId } from './enemies';

export interface TileRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface MapDef {
    name: string;
    asset: MapKey;
    /** Picture of the whole map for the minimap (Fase 16A). */
    minimap: MinimapKey;
    /** Region of the map where the game happens. Camera and player stay inside it. */
    playArea: TileRect;
    /** Monsters of this map besides the essential ones (ESSENTIAL_ENEMIES): stronger, and fewer of them. */
    localEnemies: readonly EnemyId[];
    /** Mini-bosses and final boss of this map. */
    bosses: readonly EnemyId[];
}

// De momento solo se juega un mapa: PreloadScene carga únicamente las casillas de DEFAULT_MAP.
// Las partidas guardadas con un mapa que ya no está aquí siguen en DEFAULT_MAP (ver SaveStore).
export const MAPS_DATA = {
    // Ventana de 150×150 casillas con un 95% libre, todo conectado (medido el 18-oct-2026; NOTES.md).
    bisle: { name: 'Bleeding Isle', asset: 'map.bisle', minimap: 'minimap.bisle', playArea: { x: 66, y: 52, width: 150, height: 150 },
        localEnemies: ['cyclops', 'mountainGiant', 'ogre', 'cannibalPlant'], bosses: ['ettin', 'demon', 'fireWyvern'] },
    // Mapa anterior (hasta el 18-oct-2026), guardado para la Fase 20 (varios mapas):
    // huntzone2: { name: 'Hunt Zone 2', asset: 'map.huntzone2', playArea: { x: 72, y: 70, width: 100, height: 100 } },
} as const satisfies Record<string, MapDef>;

export type MapId = keyof typeof MAPS_DATA;

export const DEFAULT_MAP: MapId = 'bisle';
