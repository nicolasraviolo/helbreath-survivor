// Tintes (Revisión del original, bloque D; decidido por el propietario el 1-nov-2026, docs/DECISIONES.md).
// - Los 15 colores del original (`m_wR/G/B`, reference/Client.cpp:713-729). Se SUMAN a cada píxel de la prenda, como
//   hace PutSpriteRGB: color − RGB(100,100,100), el mismo criterio que el color de las armas con atributo.
// - Solo ropa: capa, zapatos y botas, túnicas (en el original, categorías 11 y 12; las armaduras de metal no).
// - Se tiñe en la Shop Keeper (scenes/DyeScene.ts): la prenda puesta, al momento, por DYE_PRICE de oro. Volver al
//   color de la prenda es gratis.
// - El color va en cada objeto (`OwnedItem.color`) y en lo que se lleva puesto (`SavedCharacter.colors`).
import type { AddedColor, GearLayer } from '../hb/playerAppearance';
import type { EquipSlotId, ItemId } from './items';

/** Number of a dye colour: 1..15, as `m_cItemColor` in the original (0 = the item's own colour, never saved). */
export type DyeColorId = number;

export interface DyeColor {
    name: string;
    /** Added to red, green and blue (0..255 scale, may be negative). */
    add: readonly [number, number, number];
}

/**
 * Index = colour number − 1. The original's names, except colour 2: the item list calls it "Crimson-Red" but it paints an
 * olive grey, so it is named after what it shows.
 */
export const DYE_COLORS: readonly DyeColor[] = [
    { name: 'Indigo', add: [-60, -60, -4] }, // RGB(40, 40, 96)
    { name: 'Olive', add: [-21, -21, -38] }, // RGB(79, 79, 62)
    { name: 'Gold', add: [35, 4, -70] }, // RGB(135, 104, 30)
    { name: 'Crimson', add: [27, -82, -100] }, // RGB(127, 18, 0)
    { name: 'Green', add: [-90, -40, -90] }, // RGB(10, 60, 10)
    { name: 'Gray', add: [-60, -60, -60] }, // RGB(40, 40, 40)
    { name: 'Aqua', add: [-53, -21, -20] }, // RGB(47, 79, 80)
    { name: 'Pink', add: [27, -48, -10] }, // RGB(127, 52, 90)
    { name: 'Violet', add: [-10, -40, -10] }, // RGB(90, 60, 90)
    { name: 'Blue', add: [-100, -65, -40] }, // RGB(0, 35, 60)
    { name: 'Tan', add: [5, -10, -30] }, // RGB(105, 90, 70)
    { name: 'Khaki', add: [-6, -9, -47] }, // RGB(94, 91, 53)
    { name: 'Yellow', add: [-15, -15, -92] }, // RGB(85, 85, 8)
    { name: 'Red', add: [-25, -90, -90] }, // RGB(75, 10, 10)
    { name: 'Black', add: [-52, -52, -52] }, // RGB(48, 48, 48)
];

/** Dye colour of the clothes worn in each slot. */
export type WornColors = Partial<Record<EquipSlotId, DyeColorId>>;

/** Gold for each dye (owner, 1-nov-2026: ~30 minutes of play; it only changes the look). */
export const DYE_PRICE = 500;
/** Back to the item's own colour (owner: free, in case you regret it). */
export const UNDYE_PRICE = 0;

/** The clothes that take a dye: cape, shoes and boots, robes. */
const DYEABLE: ReadonlySet<ItemId> = new Set<ItemId>(['cape', 'shoes', 'longBoots', 'robe', 'wizardRobe']);

export function canDye(id: ItemId): boolean {
    return DYEABLE.has(id);
}

export function dyeColor(color: DyeColorId | undefined): DyeColor | undefined {
    return color === undefined ? undefined : DYE_COLORS[color - 1];
}

export function isDyeColorId(value: unknown): value is DyeColorId {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= DYE_COLORS.length;
}

/** A saved colour read back, only if that item can be dyed. */
export function readDyeColor(id: ItemId, value: unknown): DyeColorId | undefined {
    return canDye(id) && isDyeColorId(value) ? value : undefined;
}

/** The colour added to the item's pictures (on the body and its icon), or undefined for its own colour. */
export function dyeAdded(color: DyeColorId | undefined): AddedColor | undefined {
    const dye = dyeColor(color);
    return dye && color !== undefined ? { id: `dye${color}`, add: dye.add } : undefined;
}

/** A layer of a dyed piece: the dye replaces the piece's own colour (the Wizard Robe's tan). */
export function dyedLayer(layer: GearLayer, color: DyeColorId | undefined): GearLayer {
    const added = dyeAdded(color);
    if (!added) return layer;
    const { tint: _ownColour, ...rest } = layer;
    return { ...rest, added };
}

/** Swatch of a colour in the shop: the dye over a mid-tone cloth, so dark dyes still read. */
export function dyeSwatch(color: DyeColorId): number {
    const add = dyeColor(color)?.add ?? [0, 0, 0];
    const channel = (value: number) => Math.max(0, Math.min(255, DYE_SWATCH_BASE + value));
    return (channel(add[0]) << 16) | (channel(add[1]) << 8) | channel(add[2]);
}

/** Grey the swatches start from (a cloth pixel of average brightness). */
const DYE_SWATCH_BASE = 150;

export const DYE_TEXT = {
    own: 'Own color',
    paletteTitle: 'Choose a color',
    nothingToDye: 'Wear a cape, boots or a robe to dye them.\nYou get them from Tom or from your runs.',
    noCharacter: 'Choose a character first.',
    alreadyThat: 'It is already that color.',
    describe: (piece: string, color: string, price: string) => `Dye your ${piece} ${color}: ${price} gold.`,
    describeOwn: (piece: string) => `Your ${piece} back to its own color: free.`,
    done: (piece: string, color: string) => `Done: ${piece}, now ${color}.`,
    doneOwn: (piece: string) => `Done: ${piece}, back to its own color.`,
} as const;
