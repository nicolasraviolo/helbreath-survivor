// Helbreath Off, Fase Off-13C: la rejilla de objetos como pieza (la bolsa de la ventana del personaje y las dos del
// almacén). Un pozo oscuro con celdas offCell en filas; cada celda enseña un objeto o un montón (pociones y Slime
// Jelly del mismo tipo juntas, con su número en la esquina). La ventana decide qué va en cada celda, el foco, lo
// marcado y lo que no te puedes poner; la pieza solo dibuja.
import type Phaser from 'phaser';
import { setColouredTexture } from '../../hb/additiveTint';
import { itemPackTexture } from '../../config/equipment';
import type { Gender } from '../../data/appearance';
import { OFF_THEME_COLOR } from '../config/offTheme';
import { offBagItemPicture, offItemTint, type OffBagItemKey } from '../data/offItems';
import { offBox, offCell, type OffCell } from './offUi';

/** Size of a grid: cells across and down, cell side, gap between cells, well padding and the icon's room. */
export interface OffItemGridSize {
    readonly columns: number;
    readonly rows: number;
    readonly cell: number;
    readonly gap: number;
    readonly wellPad: number;
    /** Icon inside a cell, at most this big. */
    readonly iconRoom: number;
}

/** What one cell shows: an item, and how many of it (a count above 1 is written in the corner). */
export interface OffGridItem {
    key: OffBagItemKey;
    count: number;
}

export interface OffItemGrid {
    readonly cells: readonly OffCell[];
    /** The well's outer size. */
    readonly width: number;
    readonly height: number;
    readonly size: OffItemGridSize;
    /** Puts those items in the first cells, in order; the rest stay empty. Without `pictures` (still downloading) no icons. */
    show(items: readonly OffGridItem[], gender: Gender, pictures: boolean): void;
    /** The cell index one step that way inside the grid, or undefined past its edge. */
    step(index: number, dx: number, dy: number): number | undefined;
}

/** Outer size of a grid's well (for laying out the window before building it). */
export function offItemGridSize(size: OffItemGridSize): { width: number; height: number } {
    const step = size.cell + size.gap;
    return {
        width: size.columns * step - size.gap + size.wellPad * 2,
        height: size.rows * step - size.gap + size.wellPad * 2,
    };
}

/** Sets an item picture (tinted like the original) into that image, at most `room` big; undefined hides it. */
export function offSetItemIcon(image: Phaser.GameObjects.Image, key: OffBagItemKey | undefined, room: number, gender: Gender, pictures = true): void {
    const frame = key !== undefined && pictures ? offBagItemPicture(key, gender) : undefined;
    if (!frame || key === undefined) {
        image.setVisible(false);
        return;
    }
    setColouredTexture(image, itemPackTexture(frame.sheet), frame.frame, offItemTint(key));
    image.setVisible(true);
    image.setScale(Math.min(1, room / Math.max(image.frame.width, image.frame.height)));
}

/** A grid of item cells in a well, its top-left at (x, y); a click on a cell calls onClick with its index. */
export function offItemGrid(scene: Phaser.Scene, x: number, y: number, size: OffItemGridSize, onClick: (index: number) => void): OffItemGrid {
    const outer = offItemGridSize(size);
    offBox(scene, x, y, outer.width, outer.height, OFF_THEME_COLOR.well, OFF_THEME_COLOR.line);
    const step = size.cell + size.gap;
    const cells: OffCell[] = [];
    for (let i = 0; i < size.columns * size.rows; i += 1) {
        const cx = x + size.wellPad + (i % size.columns) * step;
        const cy = y + size.wellPad + Math.floor(i / size.columns) * step;
        cells.push(offCell(scene, cx, cy, size.cell, () => onClick(i)));
    }
    return {
        cells,
        width: outer.width,
        height: outer.height,
        size,
        show: (items, gender, pictures) => {
            cells.forEach((cell, i) => {
                const item = items[i];
                offSetItemIcon(cell.icon, item?.key, size.iconRoom, gender, pictures);
                cell.setCount(item && item.count > 1 ? item.count : undefined);
            });
        },
        step: (index, dx, dy) => {
            const column = (index % size.columns) + dx;
            const row = Math.floor(index / size.columns) + dy;
            if (column < 0 || column >= size.columns || row < 0 || row >= size.rows) return undefined;
            return row * size.columns + column;
        },
    };
}
