// Pantalla "Create New Character" de Helbreath Off. Fase Off-13F (propietario, 10-nov-2026): rehecha con el estilo
// oscuro de la Off-12, como Select Character en la 13E (antes, la tabla de madera del original con textos encima).
// Medidas del boceto repasado con revisor-ui: ventana 720 × 552; a la izquierda nombre, aspecto (5 filas ◀ ▶) y stats
// (5 filas − +); a la derecha el personaje, sus valores al nivel 1 y Warrior / Magician; abajo el motivo de Create
// apagado, Create y Cancel, y las pistas del mando. Todas las medidas van desde la esquina de la ventana.
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { BALD_HAIR_STYLE } from '../../data/appearance';

const WIDTH = 720;
const HEIGHT = 552;

export const OFF_CREATE_LAYOUT = {
    x: (GAME_WIDTH - WIDTH) / 2,
    y: (GAME_HEIGHT - HEIGHT) / 2,
    w: WIDTH,
    h: HEIGHT,
    /** How dark the original picture behind is (as Select Character's). */
    shadeColor: 0x000000,
    shadeAlpha: 0.9,
    sidePad: 22,
    titleTop: 14,
    dividerTop: 50,
    /** Left column: name, look and stats. */
    leftWidth: 378,
    nameLabelTop: 62,
    nameTop: 78,
    nameBoxWidth: 262,
    randomWidth: 106,
    lookLabelTop: 121,
    lookTop: 136,
    lookStep: 26,
    statsLabelTop: 276,
    statsTop: 290,
    statsStep: 28,
    /** Right column: from the left column's left edge. */
    rightLeft: 404,
    wellTop: 62,
    wellHeight: 206,
    /** The big character (faces you) and the small one turning: feet from the well's corner, scale. */
    bigFeet: { x: 110, y: 178 },
    bigScale: 2,
    smallFeet: { x: 236, y: 190 },
    smallScale: 1.25,
    smallTurnMs: 900,
    valuesLabelTop: 276,
    valuesTop: 290,
    valuesStep: 24,
    presetsLabelTop: 372,
    presetsTop: 388,
    presetsHeight: 30,
    presetsGap: 8,
    presetsNoteY: 430,
    /** Bottom: reason line (centre), Create and Cancel, divider, pad hints (centre). */
    reasonY: 450,
    buttonsTop: 466,
    buttonsHeight: 30,
    /** Create, the main button, is wider than Cancel on purpose. */
    createWidth: 150,
    cancelWidth: 120,
    buttonsGap: 10,
    dividerBottom: 510,
    hintsCentreY: 530,
    /** Clicks and keys wait this long after opening (the press that opened it doesn't count). */
    inputDelayMs: 250,
    /** The name's cursor blinks this fast, ms. */
    cursorBlinkMs: 500,
} as const;

export const OFF_CREATE_TEXT = {
    title: 'Create New Character',
    nameLabel: 'Name',
    random: 'Random',
    counter: (length: number, max: number) => `${length}/${max}`,
    lookLabel: 'Look',
    lookRows: [
        { key: 'gender', label: 'Gender' },
        { key: 'skin', label: 'Skin' },
        { key: 'hairStyle', label: 'Hair Style' },
        { key: 'hairColor', label: 'Hair Color' },
        { key: 'underwear', label: 'Underwear' },
    ] as const,
    genders: { male: 'Male', female: 'Female' },
    /** Light, tanned, dark (data/appearance.ts). */
    skins: ['Light', 'Tanned', 'Dark'],
    hairStyle: (index: number) => (index === BALD_HAIR_STYLE ? 'Bald' : `Style ${index + 1}`),
    underwear: (index: number) => `Color ${index + 1}`,
    statsLabel: 'Stats',
    pointsLeft: (points: number) => `Points left: ${points}`,
    allSpent: '✓ All points spent',
    valuesLabel: 'At Level 1',
    values: ['Health', 'Mana', 'Stamina'] as const,
    presetsLabel: 'Quick Pick',
    presets: { warrior: 'Warrior', magician: 'Magician' },
    presetsNote: (points: number) => `Spends all ${points} points for you.`,
    reason: (points: number) => `Spend all your stat points to create (${points} left).`,
    create: 'Create',
    cancel: 'Cancel',
    /** Pad hints. */
    hintMove: 'Move',
    hintChange: 'Change',
    hintNext: 'Next',
    hintSelect: 'Select',
    hintCreate: 'Create',
    hintRandom: 'Random name',
    hintCancel: 'Cancel',
    /** Cancel with a name typed or points spent asks first. */
    cancelTitle: 'Cancel',
    cancelQuestion: 'Leave without creating this character?',
} as const;
