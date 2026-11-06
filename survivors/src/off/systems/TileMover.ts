// Ported from sp-client/src/game/objects/GameObject.ts and sp-client/src/utils/CoordinateUtils.ts (MIT, Erko Knoll)
//
// Helbreath Off (Fase Off-1): andar casilla a casilla como el original, en 8 direcciones.
// - Con un destino (clic), cada paso va en línea recta hacia él (getNextDirection). Si esa casilla está bloqueada
//   prueba girando una y dos direcciones hacia un lado (el lado cambia cada vez que se atasca). Si no puede, se para.
// - En modo directo (clic mantenido o stick) el paso va hacia donde se apunta; si está bloqueado, hace lo mismo que
//   con un clic hacia la casilla a la que se apunta.
// - Cancelar termina la casilla que está cruzando y se para (como el clic derecho del original).
// No hay búsqueda de caminos: igual que el original, detrás de una pared larga se puede quedar parado.
import { Direction } from '../../hb/directions';

export interface TilePoint {
    x: number;
    y: number;
}

/** Tile offsets for Direction (North = 0, clockwise). */
const DIR_OFFSET_X = [0, 1, 1, 1, 0, -1, -1, -1] as const;
const DIR_OFFSET_Y = [-1, -1, 0, 1, 1, 1, 0, -1] as const;

/** Offset of one step in a direction. */
export function directionOffset(direction: Direction): TilePoint {
    return { x: DIR_OFFSET_X[direction], y: DIR_OFFSET_Y[direction] };
}

/** Straight direction from one tile to another (sp-client getNextDirection); undefined when they are the same. */
export function directionTowards(fromX: number, fromY: number, toX: number, toY: number): Direction | undefined {
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    if (dx === 0 && dy === 0) return undefined;
    for (let dir = 0; dir < 8; dir++) {
        if (DIR_OFFSET_X[dir] === dx && DIR_OFFSET_Y[dir] === dy) return dir as Direction;
    }
    return undefined;
}

/**
 * The tile itself if free, else the first free tile on growing squares around it (sp-client findMovableLocation).
 * Undefined if there is none within `maxRadius`.
 */
export function findFreeTile(isFree: (x: number, y: number) => boolean, x: number, y: number, maxRadius: number): TilePoint | undefined {
    if (isFree(x, y)) return { x, y };
    for (let r = 1; r <= maxRadius; r++) {
        for (let tx = x - r; tx <= x + r; tx++) if (isFree(tx, y - r)) return { x: tx, y: y - r };
        for (let ty = y - r + 1; ty <= y + r; ty++) if (isFree(x + r, ty)) return { x: x + r, y: ty };
        for (let tx = x + r - 1; tx >= x - r; tx--) if (isFree(tx, y + r)) return { x: tx, y: y + r };
        for (let ty = y + r - 1; ty >= y - r + 1; ty--) if (isFree(x - r, ty)) return { x: x - r, y: ty };
    }
    return undefined;
}

export class TileMover {
    /** Tile the character stands on, or is leaving while it steps. */
    public tileX: number;
    public tileY: number;
    /** Where it looks (and steps). */
    public facing = Direction.South;
    /** Tile being stepped onto, while moving. */
    private toX = 0;
    private toY = 0;
    private moving = false;
    private elapsedMs = 0;
    private stepMs = 1;
    private destination: TilePoint | undefined;
    /** Direct mode: the next step goes this way if it can (held click, stick). */
    private directDirection: Direction | undefined;
    /** Which side to try first when blocked: 0 = clockwise, 1 = anticlockwise; it swaps on every full stop. */
    private turn: 0 | 1 = 0;
    /** The tile that blocked the last stop: skipped once on the next try (sp-client isPrevMoveBlocked). */
    private blockedFrom: TilePoint | undefined;

    constructor(
        private readonly isFree: (x: number, y: number) => boolean,
        x: number,
        y: number,
    ) {
        this.tileX = x;
        this.tileY = y;
    }

    /** True while crossing a tile. */
    public get isMoving(): boolean {
        return this.moving;
    }

    /** True while there is somewhere to go (a step under way or a destination left). */
    public get isTravelling(): boolean {
        return this.moving || this.destination !== undefined;
    }

    /** Time the step under way (or the last one) takes, in milliseconds. */
    public get currentStepMs(): number {
        return this.stepMs;
    }

    /** 0..1 of the current step (0 when standing). */
    public get stepProgress(): number {
        return this.moving ? Math.min(1, this.elapsedMs / this.stepMs) : 0;
    }

    /** Position in tiles (fractional while stepping), the centre of a tile being x + 0.5. */
    public position(out: TilePoint): TilePoint {
        const t = this.stepProgress;
        out.x = this.tileX + (this.toX - this.tileX) * (this.moving ? t : 0) + 0.5;
        out.y = this.tileY + (this.toY - this.tileY) * (this.moving ? t : 0) + 0.5;
        return out;
    }

    /** A click: go there, stepping round what is in the way. */
    public goTo(x: number, y: number): void {
        this.destination = { x, y };
        this.directDirection = undefined;
    }

    /** Held click or stick: step `direction` while it is free, else head for `target` as a click would. */
    public steer(direction: Direction, target: TilePoint): void {
        this.destination = { x: target.x, y: target.y };
        this.directDirection = direction;
    }

    /** Stops after the tile being crossed (right click, stick let go). */
    public cancel(): void {
        this.destination = undefined;
        this.directDirection = undefined;
    }

    /** Advances the step under way; at each tile, picks the next one. `stepMs` is the time a new step takes. */
    public update(deltaMs: number, stepMs: number): void {
        if (!this.moving) {
            this.startNextStep(stepMs);
            return;
        }
        this.elapsedMs += deltaMs;
        while (this.moving && this.elapsedMs >= this.stepMs) {
            const left = this.elapsedMs - this.stepMs;
            this.tileX = this.toX;
            this.tileY = this.toY;
            this.moving = false;
            this.startNextStep(stepMs);
            if (this.moving) this.elapsedMs = left;
        }
    }

    /** sp-client processMovement: the next step towards the destination, or a stop. */
    private startNextStep(stepMs: number): void {
        const destination = this.destination;
        if (!destination) return;
        if (this.tileX === destination.x && this.tileY === destination.y) {
            this.cancel();
            return;
        }
        if (this.directDirection !== undefined) {
            if (this.canStep(this.directDirection)) {
                this.step(this.directDirection, stepMs);
                return;
            }
            this.directDirection = undefined;
        }
        const wanted = directionTowards(this.tileX, this.tileY, destination.x, destination.y);
        if (wanted === undefined) return;
        const free = this.nextFreeDirection(wanted);
        if (free === undefined) {
            // Blocked every way: stop, and next time try the other side first.
            this.blockedFrom = { x: this.tileX, y: this.tileY };
            this.turn = this.turn === 0 ? 1 : 0;
            this.facing = wanted;
            this.cancel();
            return;
        }
        this.blockedFrom = undefined;
        this.step(free, stepMs);
    }

    /** sp-client findNextMovableDirection: the wanted direction, then one and two more towards the current side. */
    private nextFreeDirection(wanted: Direction): Direction | undefined {
        const sign = this.turn === 0 ? 1 : -1;
        for (let i = 0; i <= 2; i++) {
            const dir = (((wanted + sign * i) % 8) + 8) % 8 as Direction;
            const offset = directionOffset(dir);
            const blocked = this.blockedFrom;
            if (blocked && this.tileX + offset.x === blocked.x && this.tileY + offset.y === blocked.y) {
                this.blockedFrom = undefined;
                continue;
            }
            if (this.canStep(dir)) return dir;
        }
        return undefined;
    }

    private canStep(direction: Direction): boolean {
        const offset = directionOffset(direction);
        return this.isFree(this.tileX + offset.x, this.tileY + offset.y);
    }

    private step(direction: Direction, stepMs: number): void {
        const offset = directionOffset(direction);
        this.facing = direction;
        this.toX = this.tileX + offset.x;
        this.toY = this.tileY + offset.y;
        this.stepMs = stepMs;
        this.elapsedMs = 0;
        this.moving = true;
    }
}
