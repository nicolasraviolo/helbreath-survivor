// Helbreath Off, Fase Off-13C: medidas del almacén con el estilo nuevo (off/scenes/OffWarehouseScene.ts).
// Colores, letras y medidas comunes en off/config/offTheme.ts. Todo en píxeles del juego (800 × 600).
//   ┌ Warehouse / compartido por las dos ciudades ──────────────── [✕] ┐
//   │ BAG 12 / 50                     │ WAREHOUSE 3 / 120              │
//   │ bolsa 10 × 5                    │ almacén 10 × 12                │
//   │ ficha del objeto marcado        │                                │
//   │   [Store → / ← Take], motivo    │                                │
//   └──────────── mensaje o ayuda ────────────────────────────────────┘
// La ventana se centra en vertical: su alto sale de la rejilla del almacén.
import type { OffItemGridSize } from '../ui/offItemGrid';

/** The window: its width and the rows of its header; the height comes from the warehouse grid. */
export const OFF_WAREHOUSE_WINDOW = {
    x: 12,
    w: 776,
    pad: 16,
    titleTop: 12,
    subtitleGap: 28,
    headerH: 44,
    /** Content top, from the window top (as the character window). */
    top: 70,
    /** Room for the BAG / WAREHOUSE label over each grid. */
    labelH: 18,
    /** Gap between the two columns. */
    columnGap: 16,
    /** The message (or help) line's centre under the columns, and the room left under it. */
    messageGap: 16,
    bottomPad: 12,
    shadeAlpha: 0.55,
    doubleClickMs: 400,
} as const;

/** Both grids share the cell: 10 across, 34 px (10 × 34 + gaps fits two side by side in the window). */
const CELLS = { columns: 10, cell: 34, gap: 2, wellPad: 3, iconRoom: 28 } as const;

export const OFF_WAREHOUSE_BAG_GRID: OffItemGridSize = { ...CELLS, rows: 5 };
export const OFF_WAREHOUSE_GRID: OffItemGridSize = { ...CELLS, rows: 12 };

/** The item card under the bag: same order as the Bag tab's card, its height fills down to the warehouse grid's end. */
export const OFF_WAREHOUSE_CARD = {
    /** Gap between the bag grid and the card. */
    gap: 12,
    kindGap: 23,
    dividerGap: 10,
    rowsGap: 6,
} as const;
