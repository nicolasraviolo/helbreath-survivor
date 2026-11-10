// Pantalla "Select Character" de Helbreath Off. Fase Off-13E (propietario, 10-nov-2026): rehecha con el estilo oscuro
// de la Off-12 encima de la imagen del original oscurecida (antes, las tarjetas y la tabla de madera del original).
// Medidas del boceto repasado con revisor-ui: ventana 688 × 452, cuatro tarjetas de 152 × 226, una línea de información
// del hueco marcado, cuatro botones en fila y las pistas del mando.
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import type { OffSlotCardLayout } from '../ui/offUi';

const WIDTH = 688;
const HEIGHT = 452;

export const OFF_SLOTS_LAYOUT = {
    x: (GAME_WIDTH - WIDTH) / 2,
    y: (GAME_HEIGHT - HEIGHT) / 2,
    w: WIDTH,
    h: HEIGHT,
    /** How dark the original picture behind is (its painted wooden frames must not show through). */
    shadeColor: 0x000000,
    shadeAlpha: 0.9,
    sidePad: 22,
    titleTop: 14,
    dividerTop: 52,
    cardsTop: 68,
    cardGap: 12,
    /** The three information lines under the cards (character, points or reason, mouse tip). */
    infoTop: 308,
    infoLineGap: 22,
    infoSmallGap: 18,
    buttonsTop: 372,
    buttonHeight: 30,
    buttonGap: 8,
    /** Start, Create New Character, Delete Character, Log Out (they fill the row: 644 with the gaps). */
    buttonWidths: [130, 200, 178, 112],
    dividerBottom: 416,
    hintsCentreY: 433,
    /** The character in its well: the size of Survivors' Select Character. */
    characterScale: 1,
} as const;

export const OFF_SLOT_CARD: OffSlotCardLayout = {
    width: 152,
    height: 226,
    pad: 8,
    wellHeight: 124,
    feetInWell: 106,
    nameTop: 140,
    rowsTop: 168,
    emptyLineGap: 8,
};

export const OFF_SLOTS = {
    title: 'Select Character',
    levelLabel: 'Level',
    expLabel: 'EXP',
    emptyLabel: 'Empty',
    emptyLine: 'Create a character here',
    /** Information lines of the marked slot. */
    characterInfo: (name: string, level: number, home: string) => `${name} · Level ${level} · Home: ${home}`,
    pointsInfo: (points: number) => `${points} points to assign (press C in the world)`,
    emptyInfo: 'Empty slot.',
    emptyReason: 'Create a character here. Nothing to delete.',
    fullReason: 'All four slots are in use: delete one to create another.',
    clickAgain: 'Click again to play.',
    buttons: ['Start', 'Create New Character', 'Delete Character', 'Log Out'],
    /** Pad hints. */
    hintMove: 'Move',
    hintStart: 'Start',
    hintCreate: 'Create',
    hintSelect: 'Select',
    hintDelete: 'Delete',
    hintLogOut: 'Log Out',
    hintBackToSlots: 'Back to characters',
    deleteTitle: 'Delete Character',
    deleteQuestion: (name: string) => `Delete ${name}?`,
    deleteWarning: "This can't be undone.",
} as const;
