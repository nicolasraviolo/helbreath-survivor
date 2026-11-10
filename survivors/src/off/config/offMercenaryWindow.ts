// Helbreath Off, Fase Off-13B: medidas y textos de la ventana de William (off/scenes/OffMercenaryScene.ts) con el estilo
// de la Off-12: título, frase de William, dos tarjetas (Gorn y Kaila) con nivel, precio, estado y su botón, y abajo tu
// oro y Close. Tamaños del boceto repasado con revisor-ui (10-nov-2026): ventana 560 × 370, tarjetas 250 × 180.
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { MENU_INPUT_DELAY_MS } from '../../config/menus';

const WIDTH = 560;
const HEIGHT = 370;

export const OFF_MERCENARY_WINDOW = {
    x: (GAME_WIDTH - WIDTH) / 2,
    y: (GAME_HEIGHT - HEIGHT) / 2,
    w: WIDTH,
    h: HEIGHT,
    shadeAlpha: 0.55,
    sidePad: 22,
    titleTop: 16,
    dividerTop: 54,
    /** William's line, centred. */
    lineTop: 64,
    /** The two cards, side by side and centred. */
    cardsTop: 94,
    cardWidth: 250,
    cardHeight: 180,
    cardGap: 16,
    /** Inside a card, from its top: name and kind, role, rule, level and price, status, button. */
    cardPad: 12,
    nameTop: 10,
    /** The class word ("Warrior") is smaller than the name: this much lower, so both sit on one line. */
    kindShift: 4,
    roleTop: 36,
    ruleTop: 60,
    priceCentre: 82,
    /** Most of the card's inner width the price may take ("Level 140" keeps the rest). */
    priceShare: 0.6,
    statusTop: 104,
    buttonTop: 140,
    /** Your gold (left) and Close (right), under the cards. */
    footerTop: 290,
    closeWidth: 100,
    hintsCentreY: 346,
    inputDelayMs: MENU_INPUT_DELAY_MS,
} as const;

/** Thousands with a comma, as the original's prices ("2,000"). */
export function offGoldText(gold: number): string {
    return Math.round(gold).toLocaleString('en-US');
}

export const OFF_MERCENARY_WINDOW_TEXT = {
    level: (level: number) => `Level ${level}`,
    price: (price: number) => `${offGoldText(price)} gold`,
    yourGold: (gold: number) => `Your gold: ${offGoldText(gold)}`,
    hire: 'Hire',
    dismiss: 'Dismiss',
    close: 'Close',
    select: 'Select',
    atYourSide: 'At your side',
    needGold: (missing: number) => `Need ${offGoldText(missing)} more gold`,
    replaces: (name: string) => `Replaces ${name}`,
    /** Dismiss asks first (revisor-ui, 10-nov-2026): No marked, Yes in red. */
    dismissTitle: (name: string) => `Dismiss ${name}`,
    dismissQuestion: (name: string) => `Send ${name} away?`,
    dismissWarning: 'Hiring again costs the full price.',
} as const;
