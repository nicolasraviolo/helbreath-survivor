// Helbreath Off, Fase Off-13D: medidas de la tienda y el herrero con el estilo nuevo (off/scenes/OffStoreScene.ts).
// Colores, letras y medidas comunes en off/config/offTheme.ts. Todo en píxeles del juego (800 × 600).
//   ┌ Blacksmith / subtítulo ──────────────────────── GOLD 1,820 [✕] ┐
//   │ (LB) [Buy][Sell][Magic] (RB)                                    │
//   │ ITEM        ▲ 13 more         NEEDS  PRICE │ ficha del objeto   │
//   │ ┌ lista de 14 filas, secciones ─────────┐ │ …                  │
//   │ │                                     ▐ │ │ Price         180  │
//   │ └───────────────────────────────────────┘ │ [ Buy ]            │
//   │            ▼ 22 more                      │ aviso / motivo     │
//   └──────────── ayuda de ratón o pistas del mando ──────────────────┘
// La ventana se centra en vertical: su alto sale de las filas de la lista.

/** The window and its header (as the warehouse's). */
export const OFF_STORE_WINDOW = {
    x: 12,
    w: 776,
    pad: 16,
    titleTop: 12,
    subtitleGap: 28,
    headerH: 44,
    /** Gold, right of the header, before the close button: its label and number. */
    goldGap: 12,
    goldNumberGap: 14,
    /** Tabs top, from the window top; room kept for the LB / RB pills on both sides (shown with the pad only). */
    tabsTop: 68,
    tabW: 96,
    tabGap: 4,
    pillRoom: 30,
    /** Column labels top (from the tabs' bottom) and the list's top under them. */
    columnsGap: 12,
    labelsH: 18,
    /** Room under the list for the "more below" arrow, then the help line's centre and the room left under it. */
    moreH: 16,
    helpGap: 18,
    bottomPad: 14,
    shadeAlpha: 0.55,
    doubleClickMs: 400,
} as const;

/** The list: its width, rows shown, columns and scroll. */
export const OFF_STORE_LIST = {
    w: 440,
    rows: 14,
    /** Inner frame round the rows. */
    inset: 1,
    /** Picture tile before the name, inside the row. */
    tile: 22,
    tileGap: 8,
    /** Right columns: what it needs (Str / Level / Int) and the price. */
    needsW: 132,
    priceW: 64,
    /** "Red Potion ×6": the stack count after the name. */
    countGap: 6,
    /** Scroll thumb on the right edge of the list, and its shortest length. */
    thumbW: 3,
    thumbMin: 20,
    thumbInset: 2,
    /** Rows moved by one turn of the mouse wheel. */
    wheelRows: 3,
    /** Holding ↑ / ↓: first repeat after this, then one row every `repeatMs`. */
    repeatDelayMs: 350,
    repeatMs: 70,
} as const;

/** The card on the right: same top as the column labels, same bottom as the list. */
export const OFF_STORE_CARD = {
    columnGap: 16,
    kindGap: 23,
    dividerGap: 10,
    rowsGap: 6,
    /** Bottom block: line, price row, button and the notice lines under it. */
    buttonH: 32,
    priceRowH: 30,
    noticeLineH: 17,
    noticeLines: 2,
    noticeGap: 6,
} as const;
