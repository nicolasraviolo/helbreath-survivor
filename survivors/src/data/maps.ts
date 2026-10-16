// Mapas jugables: qué .amd usar y qué recorte es la zona de juego (en casillas).
import type { MapKey } from '../config/assetManifest';

export interface TileRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface MapDef {
    name: string;
    asset: MapKey;
    /** Region of the map where the game happens. Camera and player stay inside it. */
    playArea: TileRect;
}

export const MAPS_DATA = {
    // Ventana de 100×100 casillas con un 80% libre: santuario central con el anillo de río (NOTES.md).
    huntzone2: { name: 'Hunt Zone 2', asset: 'map.huntzone2', playArea: { x: 72, y: 70, width: 100, height: 100 } },
} as const satisfies Record<string, MapDef>;

export type MapId = keyof typeof MAPS_DATA;

export const DEFAULT_MAP: MapId = 'huntzone2';
