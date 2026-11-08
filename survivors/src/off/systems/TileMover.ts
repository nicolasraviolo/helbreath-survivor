// Ported from sp-client/src/game/objects/GameObject.ts and sp-client/src/utils/CoordinateUtils.ts (MIT, Erko Knoll)
//
// Helbreath Off (Fase Off-1): andar casilla a casilla como el original, en 8 direcciones.
// - Con un destino (clic), cada paso va en línea recta hacia él (getNextDirection). Si esa casilla está bloqueada
//   prueba girando una y dos direcciones hacia un lado (el lado cambia cada vez que se atasca). Si no puede, se para.
// - En modo directo (clic mantenido o stick) el paso va hacia donde se apunta; si está bloqueado, hace lo mismo que
//   con un clic hacia la casilla a la que se apunta.
// - Cancelar termina la casilla que está cruzando y se para (como el clic derecho del original).
// Fase Off-7E: un clic puede traer además un camino (OffPathfinder) y entonces va de casilla en casilla por él,
// rodeando como siempre lo que se cruce (monstruos). Sin camino, como el original: detrás de una pared larga se puede
// quedar parado. Los monstruos nunca llevan camino.
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

/** Off-7E: how many path tiles ahead it looks for the one it stands on. */
const PATH_LOOKAHEAD = 6;

export class TileMover {
    /** Tile the character stands on, or is leaving while it steps. */
    public tileX: number;
    public tileY: number;
    /** Where it looks (and steps). */
    public facing = Direction.South;
    /** Called as each step starts, with its time (Off-3B: a running step costs stamina). */
    public onStep: ((stepMs: number) => void) | undefined;
    /** Tile being stepped onto, while moving. */
    private toX = 0;
    private toY = 0;
    private moving = false;
    private elapsedMs = 0;
    private stepMs = 1;
    private destination: TilePoint | undefined;
    /** Off-7E: tiles to go through on the way to `destination` (from a click), and the next one to head for. */
    private path: readonly TilePoint[] = [];
    private pathIndex = 0;
    /** Stop this many tiles from the destination (0 = on it): to walk up to a monster and hit it (Fase Off-2). */
    private stopRange = 0;
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

    /** Where it is heading (undefined: nowhere). */
    public get goal(): Readonly<TilePoint> | undefined {
        return this.destination;
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

    /** Tile it stands on, or the one it is stepping onto (nobody else may enter either). */
    public get nextTileX(): number {
        return this.moving ? this.toX : this.tileX;
    }

    public get nextTileY(): number {
        return this.moving ? this.toY : this.tileY;
    }

    /** A click: go there, stepping round what is in the way. */
    public goTo(x: number, y: number): void {
        this.destination = { x, y };
        this.directDirection = undefined;
        this.stopRange = 0;
        this.path = [];
        this.pathIndex = 0;
    }

    /** Off-7E: a click with a way found round the walls (OffPathfinder): its last tile is the destination. */
    public goAlong(path: readonly TilePoint[]): void {
        const last = path[path.length - 1];
        if (!last) return;
        this.goTo(last.x, last.y);
        this.path = path;
    }

    /** Walks until it is `range` tiles from a tile or nearer (counting diagonals as one), then stops (Fase Off-2). */
    public approach(x: number, y: number, range: number): void {
        this.goTo(x, y);
        this.stopRange = range;
    }

    /** One step towards a tile, stepping round what is in the way like a click; false if it can't move (Fase Off-2). */
    public stepToward(x: number, y: number, stepMs: number): boolean {
        if (this.moving) return false;
        this.goTo(x, y);
        this.startNextStep(stepMs);
        this.cancel();
        return this.moving;
    }

    /** One step away from a tile (fleeing); false if it can't move (Fase Off-2). */
    public stepAwayFrom(x: number, y: number, stepMs: number): boolean {
        return this.stepToward(2 * this.tileX - x, 2 * this.tileY - y, stepMs);
    }

    /** Turns to look one way (standing still). */
    public face(direction: Direction): void {
        if (!this.moving) this.facing = direction;
    }

    /** Puts it on a tile at once, standing (appearing, coming back after dying). */
    public place(x: number, y: number): void {
        this.cancel();
        this.moving = false;
        this.tileX = x;
        this.tileY = y;
        this.blockedFrom = undefined;
    }

    /** Held click or stick: step `direction` while it is free, else head for `target` as a click would. */
    public steer(direction: Direction, target: TilePoint): void {
        this.destination = { x: target.x, y: target.y };
        this.directDirection = direction;
        this.path = [];
    }

    /** Stops after the tile being crossed (right click, stick let go). */
    public cancel(): void {
        this.destination = undefined;
        this.directDirection = undefined;
        this.stopRange = 0;
        this.path = [];
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
        const away = Math.max(Math.abs(this.tileX - destination.x), Math.abs(this.tileY - destination.y));
        if (away <= this.stopRange) {
            if (away > 0) this.facing = directionTowards(this.tileX, this.tileY, destination.x, destination.y) ?? this.facing;
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
        const waypoint = this.nextWaypoint() ?? destination;
        const wanted = directionTowards(this.tileX, this.tileY, waypoint.x, waypoint.y);
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

    /**
     * Off-7E: the path tile to head for. Standing on one of the next few (a monster may have pushed it a little off
     * the way) moves on past it.
     */
    private nextWaypoint(): TilePoint | undefined {
        const path = this.path;
        if (path.length === 0) return undefined;
        const end = Math.min(path.length, this.pathIndex + PATH_LOOKAHEAD);
        for (let i = this.pathIndex; i < end; i++) {
            const p = path[i];
            if (p && p.x === this.tileX && p.y === this.tileY) this.pathIndex = i + 1;
        }
        return path[this.pathIndex];
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
        this.onStep?.(stepMs);
    }
}
