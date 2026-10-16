// Inspired by sp-client/src/utils/SpatialGrid.ts (MIT, Erko Knoll)
//
// Rejilla uniforme para encontrar vecinos rápido. Pensada para reconstruirse cada frame:
// `clear()` + `insert()` de todos los objetos móviles, luego consultas por zona.

export interface Positioned {
    x: number;
    y: number;
}

export class SpatialGrid<T extends Positioned> {
    private readonly cells = new Map<number, T[]>();
    /** Arrays reused between frames to avoid garbage. */
    private readonly spare: T[][] = [];

    constructor(private readonly cellSize: number) {}

    public clear(): void {
        for (const list of this.cells.values()) {
            list.length = 0;
            this.spare.push(list);
        }
        this.cells.clear();
    }

    public insert(item: T): void {
        const key = this.key(Math.floor(item.x / this.cellSize), Math.floor(item.y / this.cellSize));
        let list = this.cells.get(key);
        if (!list) {
            list = this.spare.pop() ?? [];
            this.cells.set(key, list);
        }
        list.push(item);
    }

    /** Calls `visit` for every item in cells overlapping the circle (x, y, radius). Items may be farther than radius. */
    public forEachNear(x: number, y: number, radius: number, visit: (item: T) => void): void {
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);
        for (let cy = minY; cy <= maxY; cy++) {
            for (let cx = minX; cx <= maxX; cx++) {
                const list = this.cells.get(this.key(cx, cy));
                if (list) {
                    for (const item of list) visit(item);
                }
            }
        }
    }

    private key(cx: number, cy: number): number {
        // Cell coordinates stay well below 2^15 for our maps, so this packs them into one number.
        return (cy + 32768) * 65536 + (cx + 32768);
    }
}
