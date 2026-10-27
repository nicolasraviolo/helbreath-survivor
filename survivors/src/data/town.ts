// La ciudad (Fase 23): el sitio al que se llega tras elegir personaje y al terminar una partida. Se anda libremente,
// sin monstruos, XP ni armas, y un teleport abre Select Map.
// Es un recorte de la granja de Elvine (`elvfarm.amd`, 250×250) elegido por el propietario el 21-oct-2026 sobre una
// captura: la casa oscura (Howard), la casa-tienda, el edificio de Tom y el césped del teleport.
// Medido con un script sobre el .amd: 82% del suelo se pisa; baja ~3,8 MB de casillas que no usan los mapas de caza
// (lo que más pesa, 2,3 MB, es el suelo del edificio de la derecha). Empieza en la fila 161 y no en la 160: esa fila
// tiene 4 casillas de campo de cultivo que por sí solas añadían 2,5 MB.
import type { MapKey, MinimapKey, SoundKey, SpriteKey } from '../config/assetManifest';
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

// ── NPCs (Fase 23B) ──────────────────────────────────────────────────────────────────────────────────────────────
// Quietos, con su animación de respirar y el nombre encima. Al acercarse sale "Talk"; hablar abre un panel con su frase
// y sus opciones (scenes/NpcDialogScene.ts). Sitios elegidos por el propietario sobre una captura (21-oct-2026).
// Howard abre Equipment y Warehouse (el propietario quitó el Cofre del suelo el 21-oct-2026: con Howard basta).

export type NpcId = 'howard' | 'shopKeeper' | 'william' | 'tom';

/** What an option of the panel does. `soon` = not made yet: the panel says "Coming soon". */
export type NpcAction = 'equipment' | 'warehouse' | 'achievements' | 'shop' | 'smithBuy' | 'smithSell' | 'smithUpgrade' | 'soon';

export interface NpcOption {
    label: string;
    action: NpcAction;
}

export interface NpcDef {
    name: string;
    /** Its idle sprite: 8 sheets (one per direction) of 8 frames. */
    sprite: SpriteKey;
    /** The tile it stands on (blocked: the player walks around it). */
    tile: TilePoint;
    /** Where it looks (0 = N ... 4 = S ... 7 = NW, hb/directions.ts). */
    direction: number;
    /** What it says when you talk to it. */
    line: string;
    options: readonly NpcOption[];
}

export const TOWN_NPCS: Readonly<Record<NpcId, NpcDef>> = {
    howard: {
        name: 'Howard',
        sprite: 'npc.howard',
        tile: { x: 79, y: 193 },
        direction: 3,
        line: 'Welcome, traveler. I keep the warehouse:\nyour gear and the shared chest are safe with me.',
        options: [{ label: 'Equipment', action: 'equipment' }, { label: 'Warehouse', action: 'warehouse' }],
    },
    shopKeeper: {
        name: 'Shop Keeper',
        sprite: 'npc.shopKeeper',
        tile: { x: 90, y: 178 },
        direction: 4,
        line: 'Welcome! Rare goods for brave travelers.\nPay in gold, no refunds.',
        options: [{ label: 'Shop', action: 'shop' }],
    },
    william: {
        name: 'William',
        sprite: 'npc.william',
        tile: { x: 95, y: 176 },
        direction: 4,
        line: 'I keep the records of this town.\nEvery deed of yours is written here.',
        options: [{ label: 'Achievements', action: 'achievements' }, { label: 'Missions', action: 'soon' }],
    },
    tom: {
        name: 'Tom',
        sprite: 'npc.tom',
        // A la derecha del yunque (en 110,193), mirándolo: parece que lo golpea.
        tile: { x: 111, y: 192 },
        direction: 5,
        line: 'Weapons and armor, plain and honest.\nI also buy what you don\'t need.',
        // Fase 24C: Buy and Sell (SmithScene); Upgrade, Fase 24D.
        options: [{ label: 'Buy', action: 'smithBuy' }, { label: 'Sell', action: 'smithSell' }, { label: 'Upgrade', action: 'smithUpgrade' }],
    },
};

/**
 * Fase 29A: while Howard is still held captive (data/rescues.ts), William also opens Equipment, so a phone (with no
 * I key) can still change gear. The warehouse stays closed until Howard is back.
 */
export const EQUIPMENT_STAND_IN = { keeper: 'howard', standIn: 'william', option: { label: 'Equipment', action: 'equipment' } } as const satisfies {
    keeper: NpcId; standIn: NpcId; option: NpcOption;
};

export function isNpcId(value: string): value is NpcId {
    return Object.prototype.hasOwnProperty.call(TOWN_NPCS, value);
}


export const TOWN_TALK = {
    /** "Talk" shows when the player's feet are this close to an NPC's tile centre (px). */
    radiusPx: 56,
    /** What the panel says for an option not made yet. */
    comingSoon: 'Coming soon.',
    /** The panel with no character (?open=town on a new device): Equipment and Warehouse need one. */
    noCharacter: 'Choose a character first.',
} as const;
