// Helbreath Off, Fase Off-12B: medidas de la ventana del personaje con la pestaña Bag (off/scenes/OffBagScene.ts).
// Colores, letras y medidas comunes en off/config/offTheme.ts. Todo en píxeles del juego (800 × 600).
// La ventana tapa el mundo (que sigue: los monstruos te pueden pegar) y el HUD se esconde mientras está abierta.
//   ┌ nombre / ciudad · nivel ──────────────────────────── [Bag] [✕] ┐
//   │ EQUIPMENT        │ bolsa 10 × 5                     │ All      │
//   │ huecos · muñeco  │                                  │ Weapons  │
//   │ · huecos         │                                  │ Armor    │
//   │                  │ Gold …                Potions …  │ Potions  │
//   │ barras           │ ficha del objeto: [Drop]   [Equip]          │
//   └──────────────── mensaje ──────────────────────────────────────┘

/** The window and its header. */
export const OFF_BAG_WINDOW = {
    x: 12,
    y: 11,
    w: 776,
    h: 578,
    /** Side padding inside the window. */
    pad: 16,
    /** Title line from the window top; subtitle under it; line under the header. */
    titleTop: 12,
    subtitleGap: 28,
    headerH: 44,
    tabW: 90,
    /** Gap between the header's tabs (Bag / Stats / Magic, Off-12C). */
    tabGap: 6,
    /** Content (columns) top. */
    top: 81,
    /** Bottom of the columns; the message line goes centred under them. */
    bottom: 563,
    messageY: 577,
} as const;

/** Left column: the character with its gear and bars. */
export const OFF_BAG_CHARACTER = {
    x: 28,
    w: 212,
    /** Room under the EQUIPMENT label before the slots. */
    labelGap: 22,
    slot: 44,
    /** Vertical gap between slots (4 per side). */
    slotGap: 18,
    /** Icon inside a slot, at most this big. */
    iconRoom: 40,
    /** The paper doll: its scale and where the original window's (0, 0) goes, from the column's top-left. */
    doll: { scale: 1.2, x: 21, y: -85 },
    /** Stand-in (animated character) feet while the doll's pictures download, from the column's top-left. */
    standIn: { x: 106, y: 232 },
    /** Gap between the bars. */
    barGap: 8,
} as const;

/** The bag: 10 × 5 cells in a well, the filters on its right, gold and potions under it. */
export const OFF_BAG_GRID = {
    x: 256,
    columns: 10,
    rows: 5,
    cell: 40,
    gap: 2,
    wellPad: 3,
    /** Icon inside a cell, at most this big. */
    iconRoom: 36,
    /** Cells that don't fit the marked equipment slot are dimmed this much. */
    dimAlpha: 0.3,
    doubleClickMs: 400,
    /** Filters (vertical tabs) right of the well. */
    filterGap: 12,
    filterH: 26,
    filterStep: 32,
    /** Gold and potions line, under the well. */
    goldGap: 8,
} as const;

/** The item card, under the bag: icon tile, name and kind, the buttons on the right, then the rows. */
export const OFF_BAG_CARD = {
    /** Gap between the gold line and the card. */
    gap: 10,
    /** Space between the Drop and Equip buttons (kept apart, owner's mock-up). */
    buttonsGap: 24,
    /** Gap between the name and the kind line. */
    kindGap: 23,
    /** Gap between the icon tile and the divider, and after the divider. */
    dividerGap: 10,
    rowsGap: 6,
} as const;

/**
 * Off-12C, Stats tab, right of the character: attributes with − / + on the left (points, the five stats, the help of
 * the focused one, Reset and Confirm), details on the right (maxima and hit ratio with what you have now, level...).
 */
export const OFF_STATS_PAGE = {
    x: 256,
    /** Attributes panel width; the details panel takes the rest after the gap. */
    attributesW: 268,
    gap: 12,
    /** Under the panel label, before the first row. */
    labelGap: 26,
    rowGap: 4,
    /** Gap between the rows and the help, and between the help and the buttons. */
    helpGap: 14,
    /** Rows of the details panel: gap before the divider and after it. */
    dividerGap: 10,
} as const;

/**
 * Off-12C, Magic tab: the list of spells (by circle) on the left, the marked spell's card on the right and the keys
 * 1–8 under both, in two columns (1–4, which are also RT + A/B/X/Y, and 5–8).
 */
export const OFF_MAGIC_PAGE = {
    x: 256,
    /** List panel width (a row fits "Absolute Magic Protection" with its key and mana); the card takes the rest. */
    listW: 266,
    gap: 12,
    labelGap: 24,
    /** Columns of a list row after the name. */
    keyColumn: 22,
    manaColumn: 34,
    /** Gap between the list / card and the keys panel at the bottom (its height comes from its 4 rows). */
    keysGap: 12,
    keyColumnsGap: 16,
    /** Mouse wheel: rows per notch. */
    wheelRows: 2,
    /** Room kept under the list rows for the "more below" arrow. */
    moreArrowRoom: 8,
} as const;

