// Dado dibujado con código para el botón Reroll (Fase 21½B): el Helbreath original no tiene ningún dado.
// Colores y proporciones en data/rerollSkip.ts (DICE_LOOK).
import Phaser from 'phaser';
import { DICE_LOOK } from '../data/rerollSkip';

/** Where the pips of each face go, in thirds of the die's side (-1, 0, 1). */
const PIPS: Record<number, ReadonlyArray<readonly [number, number]>> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

/** A die of `size` pixels centred on (x, y), showing `face` (1–6). Redraw it with drawDice to change the face. */
export function createDice(scene: Phaser.Scene, x: number, y: number, size: number, face: number): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics({ x, y });
    drawDice(graphics, size, face);
    return graphics;
}

export function drawDice(graphics: Phaser.GameObjects.Graphics, size: number, face: number): void {
    const { fill, border, pip, cornerRadius, pipRadius } = DICE_LOOK;
    const half = size / 2;
    graphics.clear();
    graphics.fillStyle(fill, 1).fillRoundedRect(-half, -half, size, size, size * cornerRadius);
    graphics.lineStyle(2, border, 1).strokeRoundedRect(-half, -half, size, size, size * cornerRadius);
    graphics.fillStyle(pip, 1);
    const step = size * 0.28;
    for (const [px, py] of PIPS[face] ?? PIPS[5] ?? []) graphics.fillCircle(px * step, py * step, size * pipRadius);
}
