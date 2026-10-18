// El único sitio que decide a quién atacan las armas (Fase 15). Todas las armas le preguntan a él:
// tajos, proyectiles y hechizos. Regla (data/targeting.ts): un jefe a media distancia y al alcance del arma va
// primero; si no hay ninguno, el enemigo más cercano.
// Apuntado manual (15B): mientras el jugador apunta (clic derecho o stick derecho), `manual` dice hacia dónde y las
// armas atacan en esa dirección, por encima de todo lo anterior (jefes incluidos). Solo atacan si hay algún enemigo al
// alcance (`inReach`), para no dar tajos al aire.
import type { Enemy } from '../entities/Enemy';
import { AUTO_AIM } from '../data/targeting';
import type { EnemySystem } from './EnemySystem';

/** Where the player aims by hand: a direction (length 1) and, with the mouse, the world point under the cursor. */
export interface ManualAim {
    dirX: number;
    dirY: number;
    point: { x: number; y: number } | undefined;
}

/** Angle (radians) of a manual aim seen from (fromX, fromY): towards the cursor if there is one, else its direction. */
export function manualAimAngle(aim: Readonly<ManualAim>, fromX: number, fromY: number): number {
    const point = aim.point;
    if (point && (point.x !== fromX || point.y !== fromY)) return Math.atan2(point.y - fromY, point.x - fromX);
    return Math.atan2(aim.dirY, aim.dirX);
}

export class Targeting {
    private readonly several: Enemy[] = [];
    /** Set every frame by the game; undefined = automatic aim. */
    public manual: Readonly<ManualAim> | undefined;

    constructor(private readonly enemies: EnemySystem) {}

    /** Enemy to attack from (x, y) with a weapon that reaches `maxDistance`, or undefined if none is in reach. */
    public findTarget(x: number, y: number, maxDistance: number): Enemy | undefined {
        return this.priorityBoss(x, y, maxDistance) ?? this.enemies.findNearest(x, y, maxDistance);
    }

    /**
     * Up to `count` enemies for a spell with several shots: the priority boss takes the first AUTO_AIM.bossShots
     * of them, the rest go to the nearest others. The array is reused: read it right away.
     */
    public findTargets(x: number, y: number, maxDistance: number, count: number): readonly Enemy[] {
        const out = this.enemies.findNearestSeveral(x, y, maxDistance, count, this.several);
        const boss = this.priorityBoss(x, y, maxDistance);
        if (!boss) return out;
        const index = out.indexOf(boss);
        if (index >= 0) out.splice(index, 1);
        for (let i = 0; i < Math.min(AUTO_AIM.bossShots, count); i++) out.unshift(boss);
        if (out.length > count) out.length = count;
        return out;
    }

    /** True if some enemy is within `maxDistance` of (x, y). */
    public inReach(x: number, y: number, maxDistance: number): boolean {
        return this.enemies.findNearest(x, y, maxDistance) !== undefined;
    }

    private priorityBoss(x: number, y: number, maxDistance: number): Enemy | undefined {
        return this.enemies.findNearestBoss(x, y, Math.min(maxDistance, AUTO_AIM.bossPriorityRadius));
    }
}
