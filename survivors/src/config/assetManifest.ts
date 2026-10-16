// Registro único de assets. Toda carga pasa por aquí con claves propias (regla 3 de CLAUDE.md).
// Las rutas son relativas a `assets/` (en dev, Vite sirve sp-client/public).
import { SpriteType } from '../hb/HBSprite';

export interface SpriteAsset {
    file: string;
    type: SpriteType;
}

export const SPRITES = {
    'enemy.orc': { file: 'sprites/orc.spr', type: SpriteType.Monster },

    // Capas del jugador (hombre). Ver hb/playerAppearance.ts para cómo se indexan las hojas.
    'player.body.wm': { file: 'sprites/wm.spr', type: SpriteType.Human },
    'player.hair.mhr': { file: 'sprites/mhr.spr', type: SpriteType.HairAndUndies },
    'player.underwear.mpt': { file: 'sprites/mpt.spr', type: SpriteType.HairAndUndies },
    'gear.hauberk.m': { file: 'sprites/mhauberk.spr', type: SpriteType.EquipmentPack },
    'gear.leggings.plate.m': { file: 'sprites/mleggings.spr', type: SpriteType.EquipmentPack },
    'gear.boots.long.m': { file: 'sprites/mlboots.spr', type: SpriteType.EquipmentPack },
    'gear.helm.full.m': { file: 'sprites/mhelm1.spr', type: SpriteType.EquipmentPack },
    'gear.armor.plate.m': { file: 'sprites/mpmail.spr', type: SpriteType.EquipmentPack },
    'gear.swords.m': { file: 'sprites/msw.spr', type: SpriteType.Weapons },
    'gear.shields.m': { file: 'sprites/msh.spr', type: SpriteType.Shields },
} as const satisfies Record<string, SpriteAsset>;

export type SpriteKey = keyof typeof SPRITES;

export const MAPS = {
    'map.huntzone2': { file: 'maps/huntzone2.amd' },
} as const satisfies Record<string, { file: string }>;

export type MapKey = keyof typeof MAPS;

/**
 * Paquetes de casillas de mapa (sp-client/src/constants/Assets.ts). Cada hoja del paquete es la
 * textura `map-tile-{start + hoja}`. Solo se cargan los que use el mapa (ver hb/mapAssets.ts).
 */
export const TILE_PACKS = [
    { key: 'tiles.maptiles1', file: 'sprites/maptiles1.spr', start: 0 },
    { key: 'tiles.structures1', file: 'sprites/structures1.spr', start: 50 },
    { key: 'tiles.sinside1', file: 'sprites/sinside1.spr', start: 70 },
    { key: 'tiles.trees1', file: 'sprites/trees1.spr', start: 100 },
    { key: 'tiles.treeshadows', file: 'sprites/treeshadows.spr', start: 150 },
    { key: 'tiles.objects1', file: 'sprites/objects1.spr', start: 200 },
    { key: 'tiles.objects2', file: 'sprites/objects2.spr', start: 211 },
    { key: 'tiles.objects3', file: 'sprites/objects3.spr', start: 216 },
    { key: 'tiles.objects4', file: 'sprites/objects4.spr', start: 220 },
    { key: 'tiles.tile223-225', file: 'sprites/tile223-225.spr', start: 223 },
    { key: 'tiles.tile226-229', file: 'sprites/tile226-229.spr', start: 226 },
    { key: 'tiles.objects5', file: 'sprites/objects5.spr', start: 230 },
    { key: 'tiles.objects6', file: 'sprites/objects6.spr', start: 238 },
    { key: 'tiles.objects7', file: 'sprites/objects7.spr', start: 242 },
    { key: 'tiles.maptiles2', file: 'sprites/maptiles2.spr', start: 300 },
    { key: 'tiles.maptiles4', file: 'sprites/maptiles4.spr', start: 320 },
    { key: 'tiles.maptiles5', file: 'sprites/maptiles5.spr', start: 330 },
    { key: 'tiles.maptiles6', file: 'sprites/maptiles6.spr', start: 349 },
    { key: 'tiles.maptiles353-361', file: 'sprites/maptiles353-361.spr', start: 353 },
    { key: 'tiles.tile363-366', file: 'sprites/tile363-366.spr', start: 363 },
    { key: 'tiles.tile367-367', file: 'sprites/tile367-367.spr', start: 367 },
    { key: 'tiles.tile370-381', file: 'sprites/tile370-381.spr', start: 370 },
    { key: 'tiles.tile382-387', file: 'sprites/tile382-387.spr', start: 382 },
    { key: 'tiles.tile388-402', file: 'sprites/tile388-402.spr', start: 388 },
    { key: 'tiles.tile403-405', file: 'sprites/tile403-405.spr', start: 403 },
    { key: 'tiles.tile406-421', file: 'sprites/tile406-421.spr', start: 406 },
    { key: 'tiles.tile422-429', file: 'sprites/tile422-429.spr', start: 422 },
    { key: 'tiles.tile430-443', file: 'sprites/tile430-443.spr', start: 430 },
    { key: 'tiles.tile444-444', file: 'sprites/tile444-444.spr', start: 444 },
    { key: 'tiles.tile445-461', file: 'sprites/tile445-461.spr', start: 445 },
    { key: 'tiles.tile462-473', file: 'sprites/tile462-473.spr', start: 462 },
    { key: 'tiles.tile474-478', file: 'sprites/tile474-478.spr', start: 474 },
    { key: 'tiles.tile479-488', file: 'sprites/tile479-488.spr', start: 479 },
    { key: 'tiles.tile489-522', file: 'sprites/tile489-522.spr', start: 489 },
    { key: 'tiles.tile523-530', file: 'sprites/tile523-530.spr', start: 523 },
    { key: 'tiles.tile531-540', file: 'sprites/tile531-540.spr', start: 531 },
    { key: 'tiles.tile541-545', file: 'sprites/tile541-545.spr', start: 541 },
] as const satisfies ReadonlyArray<{ key: string; file: string; start: number }>;

export type TilePack = (typeof TILE_PACKS)[number];

export const ASSET_BASE_PATH = 'assets/';
