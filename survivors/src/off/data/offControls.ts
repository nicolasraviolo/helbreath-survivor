// Helbreath Off, Fase Off-13B: los controles que enseña la ventana Controls de la pausa (Off esconde How to Play de
// Survivors). Una fila por acción: teclado y ratón en texto; el mando en piezas (circulito A/B/X/Y, pastilla LB/RB/LT/
// RT/R3/Start o palabra). Si cambia un control en systems/InputSystem.ts u OffWorldScene, se cambia aquí.
import type { OffPadButton } from '../config/offTheme';

/** A piece of the gamepad cell: a round badge, a pill or plain words. */
export type OffPadPiece = { badge: OffPadButton } | { pill: string } | { text: string };

export interface OffControlRow {
    action: string;
    keyboard: string;
    pad: readonly OffPadPiece[];
}

const badge = (b: OffPadButton): OffPadPiece => ({ badge: b });
const pill = (p: string): OffPadPiece => ({ pill: p });
const text = (t: string): OffPadPiece => ({ text: t });

export const OFF_CONTROL_ROWS: readonly OffControlRow[] = [
    { action: 'Move', keyboard: 'Arrows / WASD · Click', pad: [text('Left stick')] },
    { action: 'Attack / Talk', keyboard: 'Space · Click', pad: [badge('A')] },
    { action: 'Change target', keyboard: 'Click a monster', pad: [pill('LB'), pill('RB')] },
    { action: 'Critical Strike', keyboard: 'Alt', pad: [pill('LT')] },
    { action: 'Cast spell', keyboard: '1–8, then click', pad: [pill('RT'), text('+'), badge('A'), badge('B'), badge('X'), badge('Y')] },
    { action: 'Aim spell', keyboard: 'Mouse', pad: [text('Right stick')] },
    { action: 'Cancel spell', keyboard: 'Right click', pad: [text('Move (left stick)')] },
    { action: 'Run / Walk', keyboard: 'R', pad: [pill('R3')] },
    { action: 'Potions', keyboard: 'Q health · E mana', pad: [text('D-pad ← health · → mana')] },
    { action: 'Bag', keyboard: 'I', pad: [badge('X')] },
    { action: 'Stats', keyboard: 'C', pad: [badge('Y')] },
    { action: 'Magic', keyboard: 'B', pad: [pill('LB'), pill('RB'), text('in the window')] },
    { action: 'Pause', keyboard: 'Esc', pad: [pill('Start'), badge('B')] },
];
