// Ported from sp-client/src/game/spells/IceStorm.ts (MIT, Erko Knoll)
// Ice Storm (Fase 30B, único de Icebound; data/activeSpells.ts, kind 'storm'): una tormenta de hielo que se queda
// `durationMs` en el punto. Como en sp-client, se ve con el remolino de effect3 (hoja 0); aquí van saliendo remolinos
// por toda la zona, uno cada `whirlEveryMs`, y caen trozos pequeños de hielo (los de Ice Strike, IceShardRain). Cada
// `tickMs`, todo lo que esté dentro recibe daño y queda ralentizado (chillEnemy, ICE_SLOW).
// Con pool (regla 5): varias tormentas a la vez si la Maga tiene maná.
import Phaser from 'phaser';
import type { EffectKey } from '../config/effects';
import { ICE_SHARD_LOOK, ICE_STORM_LOOK, type StormSpellDef } from '../data/activeSpells';
import { Pool, type Poolable } from '../utils/Pool';
import type { CombatSystem } from './CombatSystem';
import { chillEnemy, type IceShardRain } from './IceShardRain';

/** One storm on the ground: waits for the cast to release it, then lasts its duration. */
class Storm implements Poolable {
    public poolIndex = -1;
    public def!: StormSpellDef;
    public power = 1;
    public x = 0;
    public y = 0;
    /** Until the cast releases it (then the storm starts). */
    public waitMs = 0;
    public leftMs = 0;
    public tickInMs = 0;
    public whirlInMs = 0;
    /** It touched a monster (once per cast: the gamepad vibrates). */
    public landed = false;
}

export class IceStormField {
    private readonly storms = new Pool(() => new Storm());
    private readonly done: Storm[] = [];

    constructor(
        private readonly playEffect: (key: EffectKey, x: number, y: number) => void,
        private readonly iceRain: IceShardRain,
        private readonly combat: CombatSystem,
        /** The cast touched at least one monster (once per cast). */
        private readonly onLanded: () => void,
    ) {}

    /** A storm on (x, y) that starts after `releaseMs` (the cast animation); `power` multiplies the damage. */
    public cast(def: StormSpellDef, power: number, x: number, y: number, releaseMs: number): void {
        const storm = this.storms.acquire();
        storm.def = def;
        storm.power = power;
        storm.x = x;
        storm.y = y;
        storm.waitMs = releaseMs;
        storm.leftMs = def.durationMs;
        storm.tickInMs = 0;
        storm.whirlInMs = 0;
        storm.landed = false;
    }

    public update(deltaMs: number): void {
        for (const storm of this.storms.active) {
            if (storm.waitMs > 0) {
                storm.waitMs -= deltaMs;
                continue;
            }
            const def = storm.def;
            storm.leftMs -= deltaMs;
            storm.whirlInMs -= deltaMs;
            while (storm.whirlInMs <= 0) {
                storm.whirlInMs += def.whirlEveryMs;
                const [wx, wy] = randomPointIn(storm.x, storm.y, def.radius * def.whirlShare);
                this.playEffect(ICE_STORM_LOOK.whirlwind, wx, wy);
            }
            storm.tickInMs -= deltaMs;
            while (storm.tickInMs <= 0 && storm.leftMs > 0) {
                storm.tickInMs += def.tickMs;
                this.tick(storm);
            }
            if (storm.leftMs <= 0) this.done.push(storm);
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const storm of this.done) this.storms.release(storm);
        this.done.length = 0;
    }

    /** One tick: damage and slow to everyone inside, and a few shards falling. */
    private tick(storm: Storm): void {
        const def = storm.def;
        let touched = false;
        this.combat.hitArea({
            damageType: 'magic',
            x: storm.x,
            y: storm.y,
            radius: def.radius,
            areaDamage: def.damage * storm.power,
            direct: undefined,
            directDamage: 0,
            knockback: def.knockback,
            bigNumbers: false,
        }, (enemy) => {
            touched = true;
            chillEnemy(enemy);
        });
        for (let i = 0; i < def.shardsPerTick; i++) {
            const [sx, sy] = randomPointIn(storm.x, storm.y, def.radius);
            this.iceRain.dropShard(
                ICE_SHARD_LOOK.smallShard, ICE_SHARD_LOOK.impact, ICE_SHARD_LOOK.impactSound, sx, sy, 0,
                Phaser.Math.Between(ICE_SHARD_LOOK.fallPx[0], ICE_SHARD_LOOK.fallPx[1]),
                Phaser.Math.Between(ICE_SHARD_LOOK.fallMs[0], ICE_SHARD_LOOK.fallMs[1]),
            );
        }
        if (touched && !storm.landed) {
            storm.landed = true;
            this.onLanded();
        }
    }
}

/** A random point inside the circle of `radius` around (x, y), spread evenly. */
function randomPointIn(x: number, y: number, radius: number): [number, number] {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * radius;
    return [x + Math.cos(angle) * distance, y + Math.sin(angle) * distance];
}
