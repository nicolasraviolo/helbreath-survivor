// Pool genérico (regla 5 de CLAUDE.md): los objetos se reciclan en lugar de crearse y destruirse.
// `active` es un array denso para recorrerlo rápido; liberar es O(1) (se intercambia con el último).

export interface Poolable {
    /** Index inside the pool's active list, managed by the pool. -1 while free. */
    poolIndex: number;
}

export class Pool<T extends Poolable> {
    public readonly active: T[] = [];
    private readonly free: T[] = [];

    constructor(private readonly factory: () => T) {}

    public acquire(): T {
        const item = this.free.pop() ?? this.factory();
        item.poolIndex = this.active.length;
        this.active.push(item);
        return item;
    }

    public release(item: T): void {
        const index = item.poolIndex;
        if (index < 0 || this.active[index] !== item) {
            return;
        }
        const last = this.active.pop();
        if (last && last !== item) {
            this.active[index] = last;
            last.poolIndex = index;
        }
        item.poolIndex = -1;
        this.free.push(item);
    }

    /** Total objects ever created (active + free). Useful for debugging leaks. */
    public get size(): number {
        return this.active.length + this.free.length;
    }
}
