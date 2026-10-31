// Barracks (31-oct-2026): los muñecos de entrenamiento (data/training.ts) y el medidor de daño.
// - Dummies quietos: les rellena la vida antes de que mueran; si un golpe enorme mata a alguno, lo levanta otra vez.
// - Attack-Dummies: guardan su sitio, persiguen y pegan; si mueren, otro se levanta en su sitio al poco rato.
// - Medidor: todo el daño que hace el jugador (CombatSystem.onDamage) → DPS de los últimos segundos, DPS medio desde
//   el primer golpe, total, golpe más fuerte, golpes y % de críticos. R lo pone a cero.
import { TILE_SIZE } from '../config/gameConfig';
import type { EnemyId } from '../data/enemies';
import { NO_DIFFICULTY } from '../data/maps';
import { TRAINING } from '../data/training';
import type { TilePoint } from '../data/town';
import type { Enemy } from '../entities/Enemy';
import type { EnemySystem } from './EnemySystem';

interface DummySpot {
    id: EnemyId;
    x: number;
    y: number;
    /** Quiet Dummies are filled again before they die; Attack-Dummies can be killed. */
    refills: boolean;
    respawnMs: number;
    enemy: Enemy | undefined;
    /** Time until it stands up again after dying (ms); 0 while it stands. */
    respawnInMs: number;
}

/** What the damage panel shows. */
export interface TrainingMeter {
    /** Damage per second over the last TRAINING.dpsWindowMs. */
    dpsNow: number;
    /** Damage per second since the first blow after the last reset. */
    dpsAverage: number;
    total: number;
    biggest: number;
    hits: number;
    crits: number;
    /** Seconds since the first blow (0 before it). */
    seconds: number;
}

export class TrainingGround {
    private readonly spots: DummySpot[];
    /** Recent blows (time, damage), oldest first, for the "DPS now". */
    private readonly recent: Array<{ at: number; damage: number }> = [];
    private total = 0;
    private biggest = 0;
    private hits = 0;
    private crits = 0;
    private firstAt = -1;
    private nowMs = 0;

    constructor(private readonly enemies: EnemySystem) {
        const spot = (id: EnemyId, tile: TilePoint, refills: boolean, respawnMs: number): DummySpot => ({
            id, x: (tile.x + 0.5) * TILE_SIZE, y: (tile.y + 0.5) * TILE_SIZE, refills, respawnMs, enemy: undefined, respawnInMs: 0,
        });
        this.spots = [
            ...TRAINING.dummies.map((tile) => spot(TRAINING.dummy, tile, true, TRAINING.respawnMs)),
            ...TRAINING.attackDummies.map((tile) => spot(TRAINING.attackDummy, tile, false, TRAINING.attackRespawnMs)),
        ];
        for (const s of this.spots) this.stand(s);
    }

    public update(deltaMs: number): void {
        this.nowMs += deltaMs;
        for (const spot of this.spots) {
            const enemy = spot.enemy;
            if (enemy?.isAlive) {
                if (spot.refills && enemy.hp < enemy.maxHp * TRAINING.refillBelow) enemy.hp = enemy.maxHp;
                continue;
            }
            // Dead: its body fades as usual, and a new one stands up at the spot.
            if (spot.respawnInMs <= 0) spot.respawnInMs = spot.respawnMs;
            spot.respawnInMs -= deltaMs;
            if (spot.respawnInMs <= 0) this.stand(spot);
        }
        const oldest = this.nowMs - TRAINING.dpsWindowMs;
        while (this.recent.length > 0 && (this.recent[0]?.at ?? 0) < oldest) this.recent.shift();
    }

    /** One blow of the player landed (any weapon, spell, magic or poison). */
    public record(damage: number, critical: boolean): void {
        if (this.firstAt < 0) this.firstAt = this.nowMs;
        this.recent.push({ at: this.nowMs, damage });
        this.total += damage;
        this.hits++;
        if (critical) this.crits++;
        this.biggest = Math.max(this.biggest, damage);
    }

    /** R: the panel back to zero. */
    public resetMeter(): void {
        this.recent.length = 0;
        this.total = 0;
        this.biggest = 0;
        this.hits = 0;
        this.crits = 0;
        this.firstAt = -1;
    }

    public get meter(): TrainingMeter {
        const seconds = this.firstAt < 0 ? 0 : (this.nowMs - this.firstAt) / 1000;
        const windowSeconds = Math.min(TRAINING.dpsWindowMs / 1000, Math.max(1, seconds));
        const recentDamage = this.recent.reduce((sum, blow) => sum + blow.damage, 0);
        return {
            dpsNow: this.firstAt < 0 ? 0 : recentDamage / windowSeconds,
            dpsAverage: this.firstAt < 0 ? 0 : this.total / Math.max(1, seconds),
            total: this.total,
            biggest: this.biggest,
            hits: this.hits,
            crits: this.crits,
            seconds,
        };
    }

    private stand(spot: DummySpot): void {
        spot.enemy = this.enemies.spawnGuard(spot.id, spot.x, spot.y, NO_DIFFICULTY);
        spot.respawnInMs = 0;
    }
}
