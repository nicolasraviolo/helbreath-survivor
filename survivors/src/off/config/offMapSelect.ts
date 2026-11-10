// Helbreath Off, Fase Off-13B: medidas de Select Map (off/scenes/OffMapSelectScene.ts) como ventana de Off encima del
// mundo (propietario, 10-nov-2026), con el estilo de la Off-12. Título, "You are in ...", una fila de tarjetas (2 o 3:
// minimapa, nombre y una línea) y las pistas del mando. Sin botones Play / Back: la tarjeta es el botón. Tamaños del
// boceto repasado con revisor-ui: ventana 640 × 350 (no se estrecha con 2 tarjetas), tarjetas 180 × 212.
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { MENU_INPUT_DELAY_MS } from '../../config/menus';

const WIDTH = 640;
const HEIGHT = 350;

export const OFF_MAP_SELECT = {
    x: (GAME_WIDTH - WIDTH) / 2,
    y: (GAME_HEIGHT - HEIGHT) / 2,
    w: WIDTH,
    h: HEIGHT,
    shadeAlpha: 0.55,
    sidePad: 22,
    titleTop: 16,
    dividerTop: 54,
    hereTop: 62,
    cardsTop: 92,
    cardWidth: 180,
    cardHeight: 212,
    cardGap: 16,
    /** Inside a card, from its top: the minimap (square), the name and the line under it. */
    cardPad: 10,
    thumbnailTop: 10,
    thumbnail: 120,
    nameTop: 138,
    blurbTop: 162,
    hintsCentreY: 326,
    inputDelayMs: MENU_INPUT_DELAY_MS,
} as const;
