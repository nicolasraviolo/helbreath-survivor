// Ported from sp-client/src/utils/MapAssets.ts (MIT, Erko Knoll)
//
// Decide qué paquetes de casillas (.spr) hay que cargar para un mapa. Sin registry:
// devuelve la lista y la escena de carga se encarga.
import { TILE_PACKS, type TilePack } from '../config/assetManifest';

/** The pack covering a tile index: the one with the largest start that is <= index. */
export function getTilePackForIndex(index: number): TilePack | undefined {
    let found: TilePack | undefined;
    for (const pack of TILE_PACKS) {
        if (pack.start <= index && (!found || pack.start > found.start)) {
            found = pack;
        }
    }
    return found;
}

export function getTilePacksForIndices(indices: Iterable<number>): TilePack[] {
    const packs = new Set<TilePack>();
    for (const index of indices) {
        const pack = getTilePackForIndex(index);
        if (pack) {
            packs.add(pack);
        }
    }
    return [...packs];
}

export function getTileTextureKey(index: number): string {
    return `map-tile-${index}`;
}
