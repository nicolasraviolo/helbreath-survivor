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
// - Off-7A: el teleport de la ciudad deja elegir el mapa (entonces OffTeleportScene, desde la Off-10C OffMapSelectScene; propietario, 8-nov-2026, como el portal de
//   Survivors): Traveler Zone o Promiseland. Promiseland tiene las dos puertas del original (casillas de teleport del
//   2ndmiddle.amd): la de arriba lleva a Elvine y la de abajo a Aresden, y por la de tu ciudad se llega y se vuelve.
// - Off-8B: en cada ciudad, William (el funcionario del ayuntamiento del original) junto al teleport contrata
//   mercenarios (la escena lo pone en la casilla andable más cercana a `near`).
// - Off-10A: las dos Farms enteras (`arefarm.amd` / `elvfarm.amd`, 250×250), el centro de Off (propietario, 9-nov-2026),
//   con los vendedores de pie en vez de puertas: Shop Keeper (tienda y magias), Tom (herrero), Howard (almacén) y
//   William (mercenarios). Los de Elvine, donde están en la ciudad de Survivors (data/town.ts); los de Aresden, en los
//   mismos sitios de sus edificios (puertas = casillas de teleport del .amd: tienda x59–64,y69–70, almacén x35–40,y89–90,
//   herrero x63–64,y92–93).
//   El teleport es la base de piedra con estandartes del original (arefarm x44–45,y101–102; elvfarm x116–117,y157–158):
//   sin dibujo nuestro, pisarla abre la elección de mapa. La puerta de los Barracks (arefarm x53–55,y132–133; elvfarm
//   x95–97,y148–149) lleva a los Barracks de Survivors (`elvbrk11.amd`); su puerta de dentro (x67–68,y70–71) devuelve
//   a la Farm de la que vienes.
// - Off-10C: **tu Farm es tu casa** (propietario, 9-nov-2026): al unirte a un bando, al morir y sin sitio guardado
//   apareces allí (Play sigue volviendo donde lo dejaste, Off-7E). Los portales de tu bando (los de Traveler Zone y las
//   puertas de Promiseland) llevan a tu Farm. El teleport abre una Select Map como la de Survivors (OffMapSelectScene):
//   desde la Farm, tu ciudad, Traveler Zone y Promiseland; desde la ciudad, tu Farm, Traveler Zone y Promiseland.
import type { MapKey, MinimapKey, SoundKey, SpriteKey } from '../../config/assetManifest';
import type { TileRect } from '../../data/maps';
import type { NpcId } from '../../data/town';
import type { TilePoint } from '../systems/TileMover';
import { ARESDEN_FARM_PITS, ARESDEN_PITS, ELVINE_FARM_PITS, ELVINE_PITS, pitSprites, PROMISELAND_PITS, TRAVELER_PITS, type OffPitDef } from './offPits';
import type { OffFaction, OffPlaceId } from './offPlaceIds';

export { isOffFaction, isOffPlaceId, OFF_FACTIONS, OFF_PLACE_IDS, type OffFaction, type OffPlaceId } from './offPlaceIds';

/**
 * Where a portal leads: a faction's home, its Farm (asks to join the first time; Off-10C, before that its city), a
 * teleport (lets you choose the map), the Barracks (Off-10A) or back to the place you came from (the Barracks' door).
 */
export type OffPortalTarget = { kind: 'faction'; faction: OffFaction } | { kind: 'teleport' } | { kind: 'barracks' } | { kind: 'back' };

export interface OffPortalDef {
    /** Tiles that take you through when stepped on. */
    area: TileRect;
    to: OffPortalTarget;
    /** Our portal effect drawn on its centre (a city's own); the original's teleport tiles need none. */
    drawn: boolean;
    /** Where you appear when you come through it from the place it leads to (a free tile near it). */
    arrival: TilePoint;
}

/** A building of a city: stepping on its door opens its window (Off-5B; the magic shop goes in one of them, Off-6). */
export type OffBuildingKind = 'shop' | 'smith' | 'warehouse';

export interface OffDoorDef {
    kind: OffBuildingKind;
    /** The original's teleport tiles of the door (.amd flag 0x40). */
    area: TileRect;
}

/** Off-10A: what talking to an NPC opens: a building's window, or William's mercenaries (Off-8B). */
export type OffNpcOpens = OffBuildingKind | 'mercenaries';

/** An NPC standing in a place: near that tile, looking that way (0 = N … 4 = S … 6 = W). */
export interface OffNpcSpot {
    id: NpcId;
    near: TilePoint;
    direction: number;
    opens: OffNpcOpens;
}

export interface OffPlaceDef {
    name: string;
    /** One line under the name on its Select Map card (Off-10C). */
    blurb: string;
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
    /** NPCs you talk to (Off-8B William in the cities; Off-10A the sellers of the Farms). */
    npcs: readonly OffNpcSpot[];
    /** Off-9A: Raiders of the other city come here now and then (Promiseland only). */
    raids?: true;
}

/**
 * Effects of every place: the dust of the steps, the blood of the blows (fx.effect), the loot on the ground (Off-4A);
 * the spells (Off-6B): the casting circle (fx.effect5) and Chill Wind's drops (fx.effect4).
 */
// Off-6C: effect7 (Heal), effect8 (Defense Shield) and effect9 (its aura) too.
// Off-11B: effect3 (Energy Strike's explosions) and effect11 (Earth Shock Wave's torrent).
// Off-11C: crueffect1 (Meteor Strike); effect11 also has Mass Magic Missile's missile, effect7 Blizzard's shards.
const WORLD_SPRITES: readonly SpriteKey[] = [
    'fx.effect2', 'fx.effect', 'item.ground', 'fx.effect5', 'fx.effect4', 'fx.effect7', 'fx.effect8', 'fx.effect9', 'fx.effect3', 'fx.effect11',
    'fx.crueffect1',
];

/** The sellers of the Farms (Off-10A): Survivors' town NPCs. */
const FARM_NPC_SPRITES: readonly SpriteKey[] = ['npc.shopKeeper', 'npc.william', 'npc.howard', 'npc.tom'];

/** Tiles x1..x2, y1..y2 inclusive. */
function rect(x1: number, y1: number, x2: number, y2: number): TileRect {
    return { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 };
}

export const OFF_PLACES: Record<OffPlaceId, OffPlaceDef> = {
    traveler: {
        name: 'Traveler Zone',
        blurb: 'Easy monsters for beginners.',
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
            { area: rect(80, 75, 82, 76), to: { kind: 'faction', faction: 'aresden' }, drawn: false, arrival: { x: 81, y: 79 } },
            { area: rect(127, 78, 129, 79), to: { kind: 'faction', faction: 'elvine' }, drawn: false, arrival: { x: 128, y: 82 } },
        ],
        doors: [],
        npcs: [],
    },
    aresden: {
        name: 'Aresden',
        blurb: 'The city of Aresden: shops and monster pits.',
        asset: 'map.aresden',
        minimap: 'minimap.aresden',
        size: { width: 300, height: 300 },
        // Zone, buildings and teleport marked by the owner on a capture (7-nov-2026), with the original's NPCs:
        // the shop is the house with crates, the warehouse the dark house with stairs, the blacksmith the one with the
        // forge. The whole city since Off-5C (the crop of Off-5A was x95,y148, 81×73).
        playArea: { x: 0, y: 0, width: 300, height: 300 },
        spawn: { x: 140, y: 210 },
        music: 'music.aresden',
        sprites: [...WORLD_SPRITES, 'npc.william', ...pitSprites(ARESDEN_PITS)],
        pits: ARESDEN_PITS,
        portals: [
            // On the original's round platform with red posts, by the owner's mark.
            { area: rect(140, 207, 140, 207), to: { kind: 'teleport' }, drawn: true, arrival: { x: 140, y: 210 } },
        ],
        doors: [
            { kind: 'shop', area: rect(126, 166, 127, 167) },
            { kind: 'shop', area: rect(130, 166, 131, 167) },
            { kind: 'smith', area: rect(157, 200, 158, 201) },
            { kind: 'smith', area: rect(167, 194, 169, 195) },
            { kind: 'warehouse', area: rect(102, 184, 102, 184) },
            { kind: 'warehouse', area: rect(107, 185, 107, 185) },
        ],
        npcs: [{ id: 'william', near: { x: 143, y: 209 }, direction: 6, opens: 'mercenaries' }],
    },
    elvine: {
        name: 'Elvine',
        blurb: 'The city of Elvine: shops and monster pits.',
        asset: 'map.elvine',
        minimap: 'minimap.elvine',
        size: { width: 300, height: 300 },
        // Marked by the owner the same way (7-nov-2026): the same buildings as Aresden's (the city is its mirror).
        // The whole city since Off-5C (the crop of Off-5A was x193,y102, 61×67).
        playArea: { x: 0, y: 0, width: 300, height: 300 },
        spawn: { x: 237, y: 142 },
        music: 'music.elvine',
        sprites: [...WORLD_SPRITES, 'npc.william', ...pitSprites(ELVINE_PITS)],
        pits: ELVINE_PITS,
        portals: [
            { area: rect(237, 140, 237, 140), to: { kind: 'teleport' }, drawn: true, arrival: { x: 237, y: 142 } },
        ],
        doors: [
            { kind: 'shop', area: rect(225, 151, 226, 152) },
            { kind: 'shop', area: rect(229, 151, 230, 152) },
            { kind: 'smith', area: rect(229, 112, 230, 113) },
            { kind: 'smith', area: rect(239, 106, 241, 107) },
            { kind: 'warehouse', area: rect(198, 128, 198, 128) },
            { kind: 'warehouse', area: rect(203, 129, 203, 129) },
        ],
        npcs: [{ id: 'william', near: { x: 240, y: 141 }, direction: 6, opens: 'mercenaries' }],
    },
    promiseland: {
        name: 'Promiseland',
        blurb: 'Strong monsters for experienced hunters.',
        asset: 'map.promiseland',
        minimap: 'minimap.promiseland',
        size: { width: 250, height: 250 },
        playArea: { x: 0, y: 0, width: 250, height: 250 },
        // Only used without an arrival (you always come through your city's gate): Aresden's.
        spawn: { x: 140, y: 224 },
        // Middleland's theme (Survivors loads it before the menu).
        music: 'music.middleland',
        sprites: [...WORLD_SPRITES, ...pitSprites(PROMISELAND_PITS)],
        pits: PROMISELAND_PITS,
        raids: true,
        portals: [
            // The original's two gates: north to Elvine, south to Aresden. Their tiles show nothing on the map: our portal
            // effect marks them (also on the minimap).
            { area: rect(121, 21, 131, 21), to: { kind: 'faction', faction: 'elvine' }, drawn: true, arrival: { x: 126, y: 24 } },
            { area: rect(135, 228, 146, 228), to: { kind: 'faction', faction: 'aresden' }, drawn: true, arrival: { x: 140, y: 224 } },
        ],
        doors: [],
        npcs: [],
    },
    aresdenFarm: {
        name: 'Aresden Farm',
        blurb: 'Your home: shops and monster pits.',
        asset: 'map.aresdenFarm',
        minimap: 'minimap.aresdenFarm',
        size: { width: 250, height: 250 },
        playArea: { x: 0, y: 0, width: 250, height: 250 },
        // The lawn between the shop, the warehouse and the blacksmith.
        spawn: { x: 53, y: 78 },
        music: 'music.aresden',
        sprites: [...WORLD_SPRITES, ...FARM_NPC_SPRITES, ...pitSprites(ARESDEN_FARM_PITS)],
        pits: ARESDEN_FARM_PITS,
        portals: [
            // The original's stone base with banners (propietario, 9-nov-2026).
            { area: rect(44, 101, 45, 102), to: { kind: 'teleport' }, drawn: false, arrival: { x: 45, y: 104 } },
            { area: rect(53, 132, 55, 133), to: { kind: 'barracks' }, drawn: false, arrival: { x: 54, y: 135 } },
        ],
        doors: [],
        npcs: [
            { id: 'shopKeeper', near: { x: 61, y: 70 }, direction: 4, opens: 'shop' },
            // Two tiles lower than his place in Survivors' town: there the building cut him (propietario, 9-nov-2026).
            { id: 'william', near: { x: 66, y: 69 }, direction: 4, opens: 'mercenaries' },
            { id: 'howard', near: { x: 47, y: 86 }, direction: 3, opens: 'warehouse' },
            { id: 'tom', near: { x: 63, y: 92 }, direction: 5, opens: 'smith' },
        ],
    },
    elvineFarm: {
        name: 'Elvine Farm',
        blurb: 'Your home: shops and monster pits.',
        asset: 'map.elvineFarm',
        minimap: 'minimap.elvineFarm',
        size: { width: 250, height: 250 },
        playArea: { x: 0, y: 0, width: 250, height: 250 },
        // Survivors' town (data/town.ts): the same arrival.
        spawn: { x: 93, y: 186 },
        music: 'music.elvine',
        sprites: [...WORLD_SPRITES, ...FARM_NPC_SPRITES, ...pitSprites(ELVINE_FARM_PITS)],
        pits: ELVINE_FARM_PITS,
        portals: [
            { area: rect(116, 157, 117, 158), to: { kind: 'teleport' }, drawn: false, arrival: { x: 117, y: 160 } },
            // As Survivors' town: TOWN.barracksDoor / barracksExit.
            { area: rect(95, 148, 97, 149), to: { kind: 'barracks' }, drawn: false, arrival: { x: 96, y: 151 } },
        ],
        doors: [],
        npcs: [
            { id: 'shopKeeper', near: { x: 90, y: 178 }, direction: 4, opens: 'shop' },
            { id: 'william', near: { x: 95, y: 178 }, direction: 4, opens: 'mercenaries' },
            { id: 'howard', near: { x: 79, y: 193 }, direction: 3, opens: 'warehouse' },
            // Right of the anvil (110,193), looking at it, as in Survivors.
            { id: 'tom', near: { x: 111, y: 192 }, direction: 5, opens: 'smith' },
        ],
    },
    barracks: {
        name: 'Barracks',
        blurb: 'Training grounds.',
        asset: 'map.barracks',
        minimap: 'minimap.barracks',
        size: { width: 150, height: 150 },
        // Survivors' Barracks (data/maps.ts): the arena.
        playArea: { x: 18, y: 29, width: 110, height: 94 },
        // In front of its door, inside.
        spawn: { x: 67, y: 74 },
        music: 'music.middleland',
        sprites: [...WORLD_SPRITES],
        pits: [],
        portals: [
            { area: rect(67, 70, 68, 71), to: { kind: 'back' }, drawn: false, arrival: { x: 67, y: 74 } },
        ],
        doors: [],
        npcs: [],
    },
};

/** A faction's city. */
export function offCityOf(faction: OffFaction): OffPlaceId {
    return faction;
}

/** A faction's Farm (Off-10A). */
export function offFarmOf(faction: OffFaction): OffPlaceId {
    return faction === 'aresden' ? 'aresdenFarm' : 'elvineFarm';
}

/**
 * Home (Off-10C, owner: the Farm is your home): where joining a faction, dying and a character with nothing saved
 * take you. Its Farm, or Traveler Zone without a faction.
 */
export function offHomePlace(faction: OffFaction | undefined): OffPlaceId {
    return faction === undefined ? 'traveler' : offFarmOf(faction);
}

/**
 * The maps a teleport offers (Off-10C), in this order: from the Farm, your city, Traveler Zone and Promiseland; from the
 * city, your Farm instead of the city. Without a faction (only by hand, ?offplace), the two hunting maps.
 */
export function offTeleportDestinations(from: OffPlaceId, faction: OffFaction | undefined): OffPlaceId[] {
    const hunting: OffPlaceId[] = ['traveler', 'promiseland'];
    if (faction === undefined) return hunting;
    const other = from === offCityOf(faction) ? offFarmOf(faction) : offCityOf(faction);
    return [other, ...hunting];
}

/** By that place's teleport (the city and the Farm). */
export function offTeleportArrival(place: OffPlaceId): TilePoint | undefined {
    return OFF_PLACES[place].portals.find((p) => p.to.kind === 'teleport')?.arrival;
}

/** By your faction's portal or gate in that place (Traveler Zone, Promiseland); undefined where there is none. */
export function offGateArrival(place: OffPlaceId, faction: OffFaction | undefined): TilePoint | undefined {
    if (faction === undefined) return undefined;
    return OFF_PLACES[place].portals.find((p) => p.to.kind === 'faction' && p.to.faction === faction)?.arrival;
}

/** Where you appear in `place` when you come by teleport or through a gate: by its teleport, or by your gate. */
export function offArrivalIn(place: OffPlaceId, faction: OffFaction | undefined): TilePoint | undefined {
    return offTeleportArrival(place) ?? offGateArrival(place, faction);
}

export const OFF_PLACE_TEXT = {
    joinTitle: (faction: OffFaction) => OFF_PLACES[offCityOf(faction)].name,
    joinQuestion: (faction: OffFaction) => `Do you want to join ${OFF_PLACES[offCityOf(faction)].name}?`,
    joinWarning: 'You can never change it.',
    joined: (faction: OffFaction) => `You are now a citizen of ${OFF_PLACES[offCityOf(faction)].name}.`,
    otherCity: (faction: OffFaction) => `Only citizens of ${OFF_PLACES[offCityOf(faction)].name} can enter.`,
    mapSelectTitle: 'Select Map',
    mapSelectPlay: 'Play',
    mapSelectBack: 'Back',
    mapSelectHelp: (place: string) => `Press Play to go to ${place}.`,
} as const;
