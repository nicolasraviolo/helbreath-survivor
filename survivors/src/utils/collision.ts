// Choque contra el mapa compartido por jugador y enemigos: un cuadrado alrededor de los pies
// que debe quedar entero sobre casillas transitables y dentro de la zona de juego.
import type Phaser from 'phaser';
import type { HBMap } from '../hb/HBMap';

export interface MovingBody {
    x: number;
    y: number;
}

export function canStandAt(map: HBMap, area: Phaser.Geom.Rectangle, x: number, y: number, halfSize: number): boolean {
    const h = halfSize;
    if (x - h < area.left || x + h >= area.right || y - h < area.top || y + h >= area.bottom) {
        return false;
    }
    return map.isWalkableAtPixel(x - h, y - h) && map.isWalkableAtPixel(x + h, y - h)
        && map.isWalkableAtPixel(x - h, y + h) && map.isWalkableAtPixel(x + h, y + h);
}

/**
 * Moves along one axis (pass dx or dy as 0). When blocked and `touchWalls` is set, steps pixel by
 * pixel so the body ends up touching the wall. Returns false if the full move was blocked.
 * Moving the two axes separately makes diagonal movement slide along walls.
 */
export function moveAxis(
    body: MovingBody,
    dx: number,
    dy: number,
    map: HBMap,
    area: Phaser.Geom.Rectangle,
    halfSize: number,
    touchWalls: boolean,
): boolean {
    if (canStandAt(map, area, body.x + dx, body.y + dy, halfSize)) {
        body.x += dx;
        body.y += dy;
        return true;
    }
    if (touchWalls) {
        const steps = Math.ceil(Math.abs(dx + dy));
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);
        for (let i = 0; i < steps && canStandAt(map, area, body.x + stepX, body.y + stepY, halfSize); i++) {
            body.x += stepX;
            body.y += stepY;
        }
    }
    return false;
}
