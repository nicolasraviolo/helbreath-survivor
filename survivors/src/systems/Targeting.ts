// El único sitio que decide a quién atacan las armas (Fase 15). Todas las armas le preguntan a él:
// tajos, proyectiles y hechizos. Regla (data/targeting.ts): un jefe a media distancia y al alcance del arma va
// primero; si no hay ninguno, el enemigo más cercano. En el bloque 15B se añade aquí el apuntado manual.
import type { Enemy } from '../entities/Enemy';
import { AUTO_AIM } from '../data/targeting';
import type { EnemySystem } from './EnemySystem';

export class Targeting {
    private readonly several: Enemy[] = [];

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

    private priorityBoss(x: number, y: number, maxDistance: number): Enemy | undefined {
        return this.enemies.findNearestBoss(x, y, Math.min(maxDistance, AUTO_AIM.bossPriorityRadius));
    }
}
