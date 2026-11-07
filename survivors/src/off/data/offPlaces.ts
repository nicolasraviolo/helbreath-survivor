// Helbreath Off (Fase Off-5A): los sitios donde se anda y sus portales.
// - Traveler Zone: el mapa entero, con sus pits (Off-2) y los dos portales del original (casillas de teleport del
//   default.amd: x80–82,y75–76 y x127–129,y78–79). El servidor decía adónde lleva cada uno en un .txt que no está en el
//   repo: cuál es Aresden y cuál Elvine lo decidimos nosotros.
// - Aresden y Elvine: la ciudad entera (Off-5C; ~17,8 MB de suelo frente a 10,8 del recorte de la Off-5A), con la
//   tienda, el herrero y el almacén (Off-5B), sus 8 pits (offPits.ts) y un portal nuestro (el efecto del teleport de
//   la ciudad de Survivors) que vuelve a Traveler Zone.
// - Al pisar el portal de una ciudad sin bando, sale "Do you want to join ...?" (OffConfirmScene); con Yes, el
//   personaje queda unido para siempre (propietario, 6-nov-2026). Ya unido, su portal lleva directo a su ciudad y el
//   del otro bando no deja pasar.
// - Al morir se vuelve a la ciudad propia; sin bando, a Traveler Zone.
import type { MapKey, MinimapKey, SoundKey, SpriteKey } from '../../config/assetManifest';
import type { TileRect } from '../../data/maps';
import type { TilePoint } from '../systems/TileMover';
import { ARESDEN_PITS, ELVINE_PITS, pitSprites, TRAVELER_PITS, type OffPitDef } from './offPits';
import type { OffFaction, OffPlaceId } from './offPlaceIds';

export { isOffFaction, isOffPlaceId, OFF_FACTIONS, OFF_PLACE_IDS, type OffFaction, type OffPlaceId } from './offPlaceIds';

/** Where a portal leads: a faction's city (asks to join the first time) or back to Traveler Zone. */
export type OffPortalTarget = { kind: 'city'; faction: OffFaction } | { kind: 'traveler' };

export interface OffPortalDef {
    /** Tiles that take you through when stepped on. */
    area: TileRect;
    to: OffPortalTarget;
    /** Our portal effect drawn on its centre (a city's own); the original's teleport tiles need none. */
    drawn: boolean;
    /** Where you appear when you come back through it from the place it leads to (a free tile near it). */
    arrival: TilePoint;
}

/** A building of a city: stepping on its door opens its window (Off-5B; the magic shop goes in one of them, Off-6). */
export type OffBuildingKind = 'shop' | 'smith' | 'warehouse';

export interface OffDoorDef {
    kind: OffBuildingKind;
    /** The original's teleport tiles of the door (.amd flag 0x40). */
    area: TileRect;
}

export interface OffPlaceDef {
    name: string;
    asset: MapKey;
    minimap: MinimapKey;
    size: { width: number; height: number };
    /** The part of the map that is loaded and walked. */
    playArea: TileRect;
    /** Starting tile, also after dying here (the nearest free one is used). */
    spawn: TilePoint;
    music: SoundKey;
    sprites: readonly SpriteKey[];
    pits: readonly OffPitDef[];
    portals: readonly OffPortalDef[];
    /** Doors of the shop, the blacksmith and the warehouse (cities only). */
    doors: readonly OffDoorDef[];
}

/**
 * Effects of every place: the dust of the steps, the blood of the blows (fx.effect), the loot on the ground (Off-4A);
 * the spells (Off-6B): the casting circle (fx.effect5) and Chill Wind's drops (fx.effect4).
 */
const WORLD_SPRITES: readonly SpriteKey[] = ['fx.effect2', 'fx.effect', 'item.ground', 'fx.effect5', 'fx.effect4'];

/** Tiles x1..x2, y1..y2 inclusive. */
function rect(x1: number, y1: number, x2: number, y2: number): TileRect {
    return { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 };
}

export const OFF_PLACES: Record<OffPlaceId, OffPlaceDef> = {
    traveler: {
        name: 'Traveler Zone',
        asset: 'map.traveler',
        minimap: 'minimap.traveler',
        size: { width: 170, height: 170 },
        // The whole map, not Survivors' crop (Off-1).
        playArea: { x: 0, y: 0, width: 170, height: 170 },
        // The centre of Survivors' Traveler Zone.
        spawn: { x: 90, y: 88 },
        // The original's general theme; loaded with the map (LATER_SOUNDS).
        music: 'music.default',
        sprites: [...WORLD_SPRITES, ...pitSprites(TRAVELER_PITS)],
        pits: TRAVELER_PITS,
        portals: [
            { area: rect(80, 75, 82, 76), to: { kind: 'city', faction: 'aresden' }, drawn: false, arrival: { x: 81, y: 79 } },
            { area: rect(127, 78, 129, 79), to: { kind: 'city', faction: 'elvine' }, drawn: false, arrival: { x: 128, y: 82 } },
        ],
        doors: [],
    },
    aresden: {
        name: 'Aresden',
        asset: 'map.aresden',
        minimap: 'minimap.aresden',
        size: { width: 300, height: 300 },
        // Zone, buildings and teleport marked by the owner on a capture (7-nov-2026), with the original's NPCs:
        // the shop is the house with crates, the warehouse the dark house with stairs, the blacksmith the one with the
        // forge. The whole city since Off-5C (the crop of Off-5A was x95,y148, 81×73).
        playArea: { x: 0, y: 0, width: 300, height: 300 },
        spawn: { x: 140, y: 210 },
        music: 'music.aresden',
        sprites: [...WORLD_SPRITES, 'fx.effect11', ...pitSprites(ARESDEN_PITS)],
        pits: ARESDEN_PITS,
        portals: [
            // On the original's round platform with red posts, by the owner's mark.
            { area: rect(140, 207, 140, 207), to: { kind: 'traveler' }, drawn: true, arrival: { x: 140, y: 210 } },
        ],
        doors: [
            { kind: 'shop', area: rect(126, 166, 127, 167) },
            { kind: 'shop', area: rect(130, 166, 131, 167) },
            { kind: 'smith', area: rect(157, 200, 158, 201) },
            { kind: 'smith', area: rect(167, 194, 169, 195) },
            { kind: 'warehouse', area: rect(102, 184, 102, 184) },
            { kind: 'warehouse', area: rect(107, 185, 107, 185) },
        ],
    },
    elvine: {
        name: 'Elvine',
        asset: 'map.elvine',
        minimap: 'minimap.elvine',
        size: { width: 300, height: 300 },
        // Marked by the owner the same way (7-nov-2026): the same buildings as Aresden's (the city is its mirror).
        // The whole city since Off-5C (the crop of Off-5A was x193,y102, 61×67).
        playArea: { x: 0, y: 0, width: 300, height: 300 },
        spawn: { x: 237, y: 142 },
        music: 'music.elvine',
        sprites: [...WORLD_SPRITES, 'fx.effect11', ...pitSprites(ELVINE_PITS)],
        pits: ELVINE_PITS,
        portals: [
            { area: rect(237, 140, 237, 140), to: { kind: 'traveler' }, drawn: true, arrival: { x: 237, y: 142 } },
        ],
        doors: [
            { kind: 'shop', area: rect(225, 151, 226, 152) },
            { kind: 'shop', area: rect(229, 151, 230, 152) },
            { kind: 'smith', area: rect(229, 112, 230, 113) },
            { kind: 'smith', area: rect(239, 106, 241, 107) },
            { kind: 'warehouse', area: rect(198, 128, 198, 128) },
            { kind: 'warehouse', area: rect(203, 129, 203, 129) },
        ],
    },
};

/** A faction's city. */
export function offCityOf(faction: OffFaction): OffPlaceId {
    return faction;
}

/** Where the character starts (Play) and comes back after dying: its city, or Traveler Zone without a faction. */
export function offHomePlace(faction: OffFaction | undefined): OffPlaceId {
    return faction === undefined ? 'traveler' : offCityOf(faction);
}

export const OFF_PLACE_TEXT = {
    joinTitle: (faction: OffFaction) => OFF_PLACES[offCityOf(faction)].name,
    joinQuestion: (faction: OffFaction) => `Do you want to join ${OFF_PLACES[offCityOf(faction)].name}?`,
    joinWarning: 'You can never change it.',
    joined: (faction: OffFaction) => `You are now a citizen of ${OFF_PLACES[offCityOf(faction)].name}.`,
    otherCity: (faction: OffFaction) => `Only citizens of ${OFF_PLACES[offCityOf(faction)].name} can enter.`,
} as const;
