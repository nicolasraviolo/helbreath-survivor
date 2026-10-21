// La ciudad (Fase 23): el sitio al que se llega tras elegir personaje y al terminar una partida. Se anda libremente,
// sin monstruos, XP ni armas, y un teleport abre Select Map.
// Es un recorte de la granja de Elvine (`elvfarm.amd`, 250×250) elegido por el propietario el 21-oct-2026 sobre una
// captura: la casa oscura (Howard y el Cofre), la casa-tienda, el edificio de Tom y el césped del teleport.
// Medido con un script sobre el .amd: 82% del suelo se pisa; baja ~3,8 MB de casillas que no usan los mapas de caza
// (lo que más pesa, 2,3 MB, es el suelo del edificio de la derecha). Empieza en la fila 161 y no en la 160: esa fila
// tiene 4 casillas de campo de cultivo que por sí solas añadían 2,5 MB.
import type { MapKey, MinimapKey, SoundKey } from '../config/assetManifest';
import type { TileRect } from './maps';

export interface TilePoint {
    x: number;
    y: number;
}

export interface TownDef {
    /** Title of its loading screen. */
    name: string;
    asset: MapKey;
    /** Size of the whole .amd in tiles (to cut the play area out of the minimap picture). */
    size: { width: number; height: number };
    minimap: MinimapKey;
    /** The part of the map that is the town. Camera and player stay inside it. */
    playArea: TileRect;
    music: SoundKey;
    /** Where the character appears (on arriving from Select Character or from a run). */
    spawn: TilePoint;
    /** The teleport: stepping on it opens Select Map. */
    portal: TilePoint;
}

export const TOWN: TownDef = {
    name: 'Elvine Farm',
    asset: 'map.elvineFarm',
    size: { width: 250, height: 250 },
    minimap: 'minimap.elvineFarm',
    playArea: { x: 62, y: 161, width: 62, height: 52 },
    music: 'music.elvine',
    spawn: { x: 93, y: 186 },
    portal: { x: 96, y: 202 },
};
