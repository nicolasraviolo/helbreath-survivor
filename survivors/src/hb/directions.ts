// Ported from sp-client/src/utils/CoordinateUtils.ts (MIT, Erko Knoll)
//
// Solo el enum de direcciones; añadimos `directionFromVector` para el movimiento libre en píxeles.

/** Helbreath direction order. Sprite sheets are laid out as `stateBase + direction`. */
export enum Direction {
    North = 0,
    NorthEast = 1,
    East = 2,
    SouthEast = 3,
    South = 4,
    SouthWest = 5,
    West = 6,
    NorthWest = 7,
}

export const DIRECTION_COUNT = 8;

export const DIRECTION_NAMES: Record<Direction, string> = {
    [Direction.North]: 'N',
    [Direction.NorthEast]: 'NE',
    [Direction.East]: 'E',
    [Direction.SouthEast]: 'SE',
    [Direction.South]: 'S',
    [Direction.SouthWest]: 'SW',
    [Direction.West]: 'W',
    [Direction.NorthWest]: 'NW',
};

/**
 * Nearest of the 8 directions for a screen-space vector (y grows downwards).
 * Returns undefined for a zero vector so callers keep the previous facing.
 */
export function directionFromVector(dx: number, dy: number): Direction | undefined {
    if (dx === 0 && dy === 0) {
        return undefined;
    }
    // Angle measured clockwise from North, in eighths of a turn.
    const angle = Math.atan2(dx, -dy);
    const sector = Math.round(angle / (Math.PI / 4));
    return ((sector + DIRECTION_COUNT) % DIRECTION_COUNT) as Direction;
}

/** Screen angle (radians, 0 = East, y down) the given direction points to. */
export function angleFromDirection(direction: Direction): number {
    return -Math.PI / 2 + direction * (Math.PI / 4);
}
