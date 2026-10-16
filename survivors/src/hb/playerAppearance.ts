// Ported from sp-client/src/utils/PlayerAppearanceManager.ts (MIT, Erko Knoll)
//
// Solo lo necesario para dibujar un personaje fijo por capas: tablas estado → hoja,
// orden de capas según la dirección (getGearRenderOrder, copiado tal cual) y qué frame
// mostrar en cada capa. Sin género variable, sin tintes y sin inventario.
import type { SpriteKey } from '../config/assetManifest';
import { Direction } from './directions';

/** Subset of the original PlayerState that the survivors player uses. */
export enum PlayerState {
    IdleCombat = 'idleCombat',
    Run = 'run',
    /** Melee swing (MeleeAttack in the original). */
    Melee = 'melee',
    Die = 'die',
}

export type GearSlot = 'human' | 'hair' | 'underwear' | 'hauberk' | 'leggings' | 'boots' | 'helm' | 'armor' | 'weapon' | 'cape' | 'shield' | 'accessory';

/** Body sheet = base + direction (one sheet per direction). */
const HUMAN_SPRITESHEET_BASE: Record<PlayerState, number> = {
    [PlayerState.IdleCombat]: 8,
    [PlayerState.Run]: 32,
    [PlayerState.Melee]: 48,
    [PlayerState.Die]: 88,
};

/** Hair, underwear and equipment: one sheet per state with 8 frames per direction inside. */
const ARMOUR_SPRITESHEET_BASE: Record<PlayerState, number> = {
    [PlayerState.IdleCombat]: 1,
    [PlayerState.Run]: 4,
    [PlayerState.Melee]: 6,
    [PlayerState.Die]: 11,
};

/**
 * Weapons: sheet = start + index * 8 + direction. Shields: sheet = start + index.
 * Undefined = the original hides weapon and shield in that state (Die, Cast…).
 */
const ARMAMENT_STATE_INDEX: Record<PlayerState, number | undefined> = {
    [PlayerState.IdleCombat]: 1,
    [PlayerState.Run]: 6,
    [PlayerState.Melee]: 4,
    [PlayerState.Die]: undefined,
};

/** Hair and underwear files hold 12 sheets per style / colour. */
const SHEETS_PER_STYLE = 12;
export const PLAYER_FRAMES_PER_DIRECTION = 8;

const MANTLE_DRAWING_ORDER = [1, 1, 1, 0, 0, 0, 2, 2] as const;
const MANTLE_DRAWING_ORDER_ON_RUN = [1, 1, 1, 1, 1, 1, 1, 1] as const;

export function getGearRenderOrder(direction: Direction, isRunning: boolean): readonly GearSlot[] {
    const dirIndex = Math.max(0, Math.min(7, direction));
    let mantleOrder = (isRunning ? MANTLE_DRAWING_ORDER_ON_RUN : MANTLE_DRAWING_ORDER)[dirIndex];
    if (!isRunning && direction === 7) {
        mantleOrder = 1;
    }
    if (isRunning && direction === 6) {
        mantleOrder = 2;
    }
    const shieldBeforeWeapon = (!isRunning && (direction === 1 || direction === 2 || direction === 3 || direction === 4)) || (isRunning && (direction === 2 || direction === 3));
    const weaponShield = shieldBeforeWeapon ? (['shield', 'weapon'] as const) : (['weapon', 'shield'] as const);
    const accessorySuffix = ['accessory'] as const;
    if (!isRunning && direction === 2) {
        return ['human', 'hair', 'underwear', 'hauberk', 'leggings', 'boots', 'helm', 'armor', 'shield', 'cape', 'weapon', ...accessorySuffix];
    }
    if (isRunning && direction === 6) {
        return ['human', 'hair', 'underwear', 'hauberk', 'leggings', 'boots', 'helm', 'armor', 'weapon', 'cape', 'shield', ...accessorySuffix];
    }
    switch (mantleOrder) {
        case 0:
            return ['human', 'hair', 'underwear', 'cape', 'hauberk', 'leggings', 'boots', 'helm', 'armor', ...weaponShield, ...accessorySuffix];
        case 1:
            return ['human', 'hair', 'underwear', 'hauberk', 'leggings', 'boots', 'helm', 'armor', ...weaponShield, 'cape', ...accessorySuffix];
        case 2:
            return ['human', 'hair', 'underwear', 'hauberk', 'leggings', 'boots', 'helm', 'armor', 'cape', ...weaponShield, ...accessorySuffix];
        default:
            return ['human', 'hair', 'underwear', 'hauberk', 'leggings', 'boots', 'helm', 'armor', ...weaponShield, 'cape', ...accessorySuffix];
    }
}

/** One drawn layer of a character. `variant` = hair style / underwear colour; `startSheet` = weapon or shield start. */
export interface GearLayer {
    sprite: SpriteKey;
    variant?: number;
    startSheet?: number;
}

export type Appearance = Partial<Record<GearSlot, GearLayer>>;

export interface LayerFrame {
    /** Texture key (`{spriteKey}-{sheet}`) and frame name inside it. */
    texture: string;
    frame: string;
}

/**
 * Which texture/frame a layer shows for a state, direction and animation frame (0..7).
 * Undefined when the layer is hidden in that state.
 */
export function getLayerFrame(slot: GearSlot, layer: GearLayer, state: PlayerState, direction: Direction, frameIndex: number): LayerFrame | undefined {
    const armament = ARMAMENT_STATE_INDEX[state];
    switch (slot) {
        case 'human':
            return fullFrame(layer.sprite, HUMAN_SPRITESHEET_BASE[state] + direction, frameIndex);
        case 'weapon':
            return armament === undefined ? undefined
                : fullFrame(layer.sprite, (layer.startSheet ?? 0) + armament * 8 + direction, frameIndex);
        case 'shield':
            return armament === undefined ? undefined
                : subFrame(layer.sprite, (layer.startSheet ?? 0) + armament, direction, frameIndex);
        case 'hair':
        case 'underwear': {
            // Hair style 2 renders as style 0 in the original.
            const variant = slot === 'hair' && layer.variant === 2 ? 0 : (layer.variant ?? 0);
            return subFrame(layer.sprite, variant * SHEETS_PER_STYLE + ARMOUR_SPRITESHEET_BASE[state], direction, frameIndex);
        }
        default:
            return subFrame(layer.sprite, ARMOUR_SPRITESHEET_BASE[state], direction, frameIndex);
    }
}

function fullFrame(sprite: SpriteKey, sheet: number, frameIndex: number): LayerFrame {
    return { texture: `${sprite}-${sheet}`, frame: String(frameIndex) };
}

function subFrame(sprite: SpriteKey, sheet: number, direction: Direction, frameIndex: number): LayerFrame {
    return { texture: `${sprite}-${sheet}`, frame: String(direction * PLAYER_FRAMES_PER_DIRECTION + frameIndex) };
}
