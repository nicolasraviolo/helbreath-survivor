// Helbreath Off (Fase Off-7E): buscar camino al hacer clic, para que el personaje rodee casas y muros en vez de
// quedarse parado (el original no lo hacía; el propietario lo pidió el 7-nov-2026). Es un A* en las 8 direcciones
// sobre las casillas por las que se puede andar del mapa (sin contar los monstruos, que se mueven: a esos los rodea
// TileMover al llegar). Rodea también los portales y las puertas que no sean el destino, para no abrir sus ventanas
// por el camino. Si no hay camino dentro de OFF_MOVEMENT.pathMaxTiles casillas exploradas, no devuelve nada y
// el personaje anda en línea recta como antes.
import type { TilePoint } from './TileMover';

/** Straight step costs 1; a diagonal a hair more, so that among equally fast ways the straighter one wins. */
const DIAGONAL_COST = 1.001;
const DX = [0, 1, 1, 1, 0, -1, -1, -1] as const;
const DY = [-1, -1, 0, 1, 1, 1, 0, -1] as const;

export class OffPathfinder {
    private readonly size: number;
    /** Best cost found so far to each tile (valid only where `seen` holds the current search's stamp). */
    private readonly cost: Float32Array;
    private readonly from: Int32Array;
    private readonly seen: Uint16Array;
    private readonly closed: Uint16Array;
    private stamp = 0;
    /** Open list as a binary heap of tile indices, ordered by `score`. */
    private heap: number[] = [];
    private readonly score: Float32Array;

    constructor(
        private readonly width: number,
        private readonly height: number,
        private readonly isWalkable: (x: number, y: number) => boolean,
    ) {
        this.size = width * height;
        this.cost = new Float32Array(this.size);
        this.from = new Int32Array(this.size);
        this.seen = new Uint16Array(this.size);
        this.closed = new Uint16Array(this.size);
        this.score = new Float32Array(this.size);
    }

    /**
     * The tiles to step on from `start` to `goal` (start left out, goal included), or undefined if there is no way
     * within `maxTiles` explored tiles. An empty list when start and goal are the same tile. `avoid` keeps it off
     * tiles it could walk on but should not cross (portals and doors that are not the goal).
     */
    public find(start: TilePoint, goal: TilePoint, maxTiles: number, avoid?: (x: number, y: number) => boolean): TilePoint[] | undefined {
        if (!this.inside(start.x, start.y) || !this.inside(goal.x, goal.y) || !this.isWalkable(goal.x, goal.y)) return undefined;
        if (start.x === goal.x && start.y === goal.y) return [];
        this.nextStamp();
        const w = this.width;
        const startIndex = start.y * w + start.x;
        const goalIndex = goal.y * w + goal.x;
        this.heap = [];
        this.open(startIndex, 0, -1, goal);
        let explored = 0;
        while (this.heap.length > 0) {
            const index = this.pop();
            if (this.closed[index] === this.stamp) continue;
            if (index === goalIndex) return this.walkBack(goalIndex);
            this.closed[index] = this.stamp;
            if (++explored > maxTiles) return undefined;
            const x = index % w;
            const y = (index - x) / w;
            const here = this.cost[index] ?? 0;
            for (let dir = 0; dir < 8; dir++) {
                const nx = x + (DX[dir] ?? 0);
                const ny = y + (DY[dir] ?? 0);
                if (!this.inside(nx, ny)) continue;
                const next = ny * w + nx;
                if (this.closed[next] === this.stamp || !this.isWalkable(nx, ny) || (next !== goalIndex && avoid?.(nx, ny))) continue;
                const step = dir % 2 === 0 ? 1 : DIAGONAL_COST;
                const cost = here + step;
                if (this.seen[next] === this.stamp && (this.cost[next] ?? 0) <= cost) continue;
                this.open(next, cost, index, goal);
            }
        }
        return undefined;
    }

    private inside(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    private nextStamp(): void {
        this.stamp++;
        if (this.stamp > 0xfffe) {
            this.seen.fill(0);
            this.closed.fill(0);
            this.stamp = 1;
        }
    }

    private open(index: number, cost: number, from: number, goal: TilePoint): void {
        const x = index % this.width;
        const y = (index - x) / this.width;
        // Steps left if nothing were in the way (each step, straight or diagonal, takes the same time).
        const left = Math.max(Math.abs(goal.x - x), Math.abs(goal.y - y));
        this.seen[index] = this.stamp;
        this.cost[index] = cost;
        this.from[index] = from;
        this.score[index] = cost + left;
        this.push(index);
    }

    private walkBack(goalIndex: number): TilePoint[] {
        const path: TilePoint[] = [];
        const w = this.width;
        let index = goalIndex;
        while ((this.from[index] ?? -1) >= 0) {
            const x = index % w;
            path.push({ x, y: (index - x) / w });
            index = this.from[index] ?? -1;
        }
        return path.reverse();
    }

    private push(index: number): void {
        const heap = this.heap;
        heap.push(index);
        let i = heap.length - 1;
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.scoreAt(parent) <= this.scoreAt(i)) break;
            this.swap(i, parent);
            i = parent;
        }
    }

    private pop(): number {
        const heap = this.heap;
        const top = heap[0] ?? 0;
        const last = heap.pop() ?? 0;
        if (heap.length === 0) return top;
        heap[0] = last;
        let i = 0;
        for (;;) {
            const left = i * 2 + 1;
            const right = left + 1;
            let best = i;
            if (left < heap.length && this.scoreAt(left) < this.scoreAt(best)) best = left;
            if (right < heap.length && this.scoreAt(right) < this.scoreAt(best)) best = right;
            if (best === i) break;
            this.swap(i, best);
            i = best;
        }
        return top;
    }

    private scoreAt(heapIndex: number): number {
        return this.score[this.heap[heapIndex] ?? 0] ?? 0;
    }

    private swap(a: number, b: number): void {
        const heap = this.heap;
        const t = heap[a] ?? 0;
        heap[a] = heap[b] ?? 0;
        heap[b] = t;
    }
}
