// Ported from sp-client/src/game/spells/BloodyShockWave.ts, EarthShockWave.ts, Blizzard.ts and BlizzardShard.ts (MIT, Erko Knoll)
// Hechizos activos en línea (Fase 26E): Bloody Shock Wave, Earth Shock Wave y Blizzard (data/activeSpells.ts, kind
// 'line'). Como en sp-client (BloodyShockWave.ts, EarthShockWave.ts, Blizzard.ts), un punto invisible va en línea
// recta de la Maga al sitio elegido y, cada `stepEveryMs`, deja sus dibujos (nudos rojos, chorros de roca o trozos de
// hielo) y golpea a los monstruos que hay cerca de ese punto. Cada monstruo recibe el golpe del camino `pathHits` veces
// como mucho por lanzamiento; al llegar, uno o dos golpes de área en el punto. Blizzard ralentiza (chillEnemy).
// Bloque C (26-oct-2026): la grieta de los martillos usa lo mismo (HAMMER_CRACK, daño físico y números normales).
// Todo con pool (regla 5): los lanzamientos se reutilizan; los trozos de hielo caen con IceShardRain.dropShard.
import Phaser from 'phaser';
import type { EffectKey } from '../config/effects';
import { LINE_SPELL_LOOKS, type LinePathDef } from '../data/activeSpells';
import type { Enemy } from '../entities/Enemy';
import { Pool, type Poolable } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';
import type { CombatSystem } from './CombatSystem';
import type { EnemySystem } from './EnemySystem';
import { chillEnemy, type IceShardRain } from './IceShardRain';
import type { ScreenShake } from './ScreenShake';

/** One cast on its way: from (fromX, fromY) to (toX, toY), `elapsedMs` since it left (negative while the Mage casts). */
class LineCast implements Poolable {
    public poolIndex = -1;
    public def!: LinePathDef;
    public power = 1;
    public fromX = 0;
    public fromY = 0;
    public toX = 0;
    public toY = 0;
    public elapsedMs = 0;
    public travelMs = 0;
    public travelSteps = 1;
    public holdSteps = 0;
    /** Steps already drawn, steps whose path hit landed, and target hits done. */
    public drawn = 0;
    public pathHitsDone = 0;
    public targetHitsDone = 0;
    public arrived = false;
    public touched = false;
    /** How many times this cast's path has hit each monster. */
    public readonly hitCount = new Map<Enemy, number>();

    public get totalSteps(): number {
        return this.travelSteps + this.holdSteps;
    }

    /** When step `index` happens (ms after leaving). */
    public stepMs(index: number): number {
        if (index < this.travelSteps) return (index + 1) * this.travelMs / this.travelSteps;
        return this.travelMs + (index - this.travelSteps + 1) * this.def.holdStepMs;
    }

    /** Share of the way step `index` is at (1 on the point and while it holds there). */
    public stepShare(index: number): number {
        return Math.min(1, (index + 1) / this.travelSteps);
    }

    public get done(): boolean {
        return this.drawn >= this.totalSteps && this.pathHitsDone >= this.totalSteps
            && this.targetHitsDone >= this.def.targetHitDelaysMs.length;
    }
}

export class LineSpell {
    private readonly casts = new Pool(() => new LineCast());
    private readonly finished: LineCast[] = [];

    constructor(
        private readonly playEffect: (key: EffectKey, x: number, y: number) => void,
        private readonly iceRain: IceShardRain,
        private readonly enemies: EnemySystem,
        private readonly combat: CombatSystem,
        private readonly audio: AudioSystem,
        private readonly screenShake: ScreenShake,
        /** The cast touched at least one monster (once per cast). */
        private readonly onLanded: () => void,
    ) {}

    /** Starts one from (fromX, fromY) to (toX, toY), leaving after `releaseMs` (the cast animation). */
    public cast(def: LinePathDef, power: number, fromX: number, fromY: number, toX: number, toY: number, releaseMs: number): void {
        const cast = this.casts.acquire();
        cast.def = def;
        cast.power = power;
        cast.fromX = fromX;
        cast.fromY = fromY + (def.look === 'bloodyShock' ? LINE_SPELL_LOOKS.bloodyShock.startDy : 0);
        cast.toX = toX;
        cast.toY = toY;
        cast.elapsedMs = -releaseMs;
        const distance = Math.hypot(toX - cast.fromX, toY - cast.fromY);
        cast.travelMs = def.speed ? distance / def.speed * 1000 : def.travelMs;
        cast.travelSteps = Math.max(1, Math.round(cast.travelMs / def.stepEveryMs));
        cast.holdSteps = def.holdStepMs > 0 ? Math.floor(def.holdMs / def.holdStepMs) : 0;
        cast.drawn = 0;
        cast.pathHitsDone = 0;
        cast.targetHitsDone = 0;
        cast.arrived = false;
        cast.touched = false;
        cast.hitCount.clear();
    }

    public update(deltaMs: number): void {
        for (const cast of this.casts.active) {
            cast.elapsedMs += deltaMs;
            if (cast.elapsedMs < 0) continue;
            const pathDelay = cast.def.pathHitDelayMs;
            while (cast.drawn < cast.totalSteps && cast.stepMs(cast.drawn) <= cast.elapsedMs) this.draw(cast, cast.drawn++);
            while (cast.pathHitsDone < cast.totalSteps && cast.stepMs(cast.pathHitsDone) + pathDelay <= cast.elapsedMs) {
                this.hitPath(cast, cast.pathHitsDone++);
            }
            if (!cast.arrived && cast.elapsedMs >= cast.travelMs) {
                cast.arrived = true;
                this.screenShake.shake(cast.def.shakePx, cast.def.shakeMs);
            }
            const delays = cast.def.targetHitDelaysMs;
            while (cast.targetHitsDone < delays.length && cast.travelMs + (delays[cast.targetHitsDone] ?? 0) <= cast.elapsedMs) {
                cast.targetHitsDone++;
                this.hitTarget(cast);
            }
            if (cast.done) this.finished.push(cast);
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const cast of this.finished) {
            cast.hitCount.clear();
            this.casts.release(cast);
        }
        this.finished.length = 0;
    }

    /** Where step `index` is on the line. */
    private point(cast: LineCast, index: number): { x: number; y: number } {
        const share = cast.stepShare(index);
        return { x: cast.fromX + (cast.toX - cast.fromX) * share, y: cast.fromY + (cast.toY - cast.fromY) * share };
    }

    /** The pictures (and sounds) of one step. */
    private draw(cast: LineCast, index: number): void {
        const { x, y } = this.point(cast, index);
        switch (cast.def.look) {
            case 'bloodyShock': {
                const look = LINE_SPELL_LOOKS.bloodyShock;
                this.playEffect(look.node, x + Phaser.Math.Between(-look.jitter, look.jitter), y + Phaser.Math.Between(-look.jitter, look.jitter));
                this.audio.play(look.sound);
                break;
            }
            case 'earthShock': {
                const look = LINE_SPELL_LOOKS.earthShock;
                this.playEffect(look.torrent, x, y);
                this.playEffect(look.dust, x, y);
                this.audio.play(look.sound);
                break;
            }
            case 'blizzard': {
                const look = LINE_SPELL_LOOKS.blizzard;
                const share = cast.stepShare(index);
                const count = Math.round(share * look.maxShards);
                const spread = look.minSpread + (look.maxSpread - look.minSpread) * share;
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.sqrt(Math.random()) * spread;
                    const key = look.shards[Phaser.Math.Between(0, look.shards.length - 1)] ?? look.shards[0];
                    this.iceRain.dropShard(
                        key, look.impact, look.impactSound, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 0,
                        Phaser.Math.Between(look.fallPx[0], look.fallPx[1]), Phaser.Math.Between(look.fallMs[0], look.fallMs[1]),
                    );
                }
                break;
            }
        }
    }

    /** The monsters near step `index` that this cast has not hit `pathHits` times yet take the path damage. */
    private hitPath(cast: LineCast, index: number): void {
        const { def } = cast;
        const { x, y } = this.point(cast, index);
        this.enemies.forEachInRadius(x, y, def.pathRadius, (enemy) => {
            const count = cast.hitCount.get(enemy) ?? 0;
            if (count >= def.pathHits) return;
            cast.hitCount.set(enemy, count + 1);
            // Radius 0 and no area damage: only this enemy takes it.
            this.combat.hitArea({
                damageType: def.damageType ?? 'magic', x, y, radius: 0, areaDamage: 0, direct: enemy, directDamage: def.pathDamage * cast.power,
                knockback: def.knockback, bigNumbers: def.bigNumbers ?? true,
            });
            this.touch(cast, enemy);
        });
    }

    /** One area hit on the point. */
    private hitTarget(cast: LineCast): void {
        const { def } = cast;
        this.combat.hitArea({
            damageType: def.damageType ?? 'magic', x: cast.toX, y: cast.toY, radius: def.targetRadius, areaDamage: def.targetDamage * cast.power,
            direct: undefined, directDamage: 0, knockback: def.knockback, bigNumbers: def.bigNumbers ?? true,
        }, (enemy) => this.touch(cast, enemy));
    }

    private touch(cast: LineCast, enemy: Enemy): void {
        if (cast.def.slows && enemy.isAlive) chillEnemy(enemy);
        if (cast.touched) return;
        cast.touched = true;
        this.onLanded();
    }
}
