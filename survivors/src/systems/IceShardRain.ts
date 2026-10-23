// Ice Strike y Mass Ice Strike (Fase 26D): lluvia de trozos de hielo, hechizo activo del Mago (data/activeSpells.ts,
// kind 'iceShards'). Como en sp-client (IceStrike.ts, IceStrikeShard.ts), todos los trozos empiezan a caer a la vez,
// cada uno desde una altura y con una duración al azar, y al tocar el suelo se rompen con el sonido E46. El daño son
// uno o dos golpes de área en momentos fijos, y cada monstruo tocado queda **ralentizado** (Enemy.slow, ICE_SLOW).
// Todo con pool (regla 5): los trozos y los golpes pendientes se reutilizan.
import Phaser from 'phaser';
import type { EffectKey } from '../config/effects';
import { ICE_SHARD_LOOK, ICE_SLOW, type IceShardSpellDef } from '../data/activeSpells';
import type { Enemy } from '../entities/Enemy';
import { Pool, type Poolable } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';
import type { CombatSystem } from './CombatSystem';
import type { ScreenShake } from './ScreenShake';

/** One shard: waits for the cast to release it, falls, and breaks on (x, y). */
class PendingShard implements Poolable {
    public poolIndex = -1;
    public key: EffectKey = ICE_SHARD_LOOK.largeShard;
    public x = 0;
    public y = 0;
    /** Until it starts falling, then until it lands. */
    public waitMs = 0;
    public falling = false;
    public fallPx = 0;
    public fallMs = 0;
}

/** One area hit of a cast, waiting for its moment. */
class PendingIceHit implements Poolable {
    public poolIndex = -1;
    public def!: IceShardSpellDef;
    public power = 1;
    public x = 0;
    public y = 0;
    public waitMs = 0;
    /** The cast's first hit: shakes the screen and may vibrate the gamepad. */
    public first = false;
}

export class IceShardRain {
    private readonly shards = new Pool(() => new PendingShard());
    private readonly hits = new Pool(() => new PendingIceHit());
    private readonly doneShards: PendingShard[] = [];
    private readonly doneHits: PendingIceHit[] = [];

    constructor(
        private readonly playEffect: (key: EffectKey, x: number, y: number, fallPx?: number, fallMs?: number) => void,
        private readonly combat: CombatSystem,
        private readonly audio: AudioSystem,
        private readonly screenShake: ScreenShake,
        /** The cast touched at least one monster (once per cast). */
        private readonly onLanded: () => void,
    ) {}

    /** Starts a rain on (x, y): the shards leave after `releaseMs` (the cast animation); `power` multiplies the damage. */
    public cast(def: IceShardSpellDef, power: number, x: number, y: number, releaseMs: number): void {
        const total = def.largeShards + def.smallShards;
        for (let i = 0; i < total; i++) {
            const shard = this.shards.acquire();
            shard.key = i < def.largeShards ? ICE_SHARD_LOOK.largeShard : ICE_SHARD_LOOK.smallShard;
            // The first big one on the centre; the rest anywhere inside the spread circle.
            const angle = Math.random() * Math.PI * 2;
            const distance = i === 0 ? 0 : Math.sqrt(Math.random()) * def.spreadRadius;
            shard.x = x + Math.cos(angle) * distance;
            shard.y = y + Math.sin(angle) * distance;
            shard.waitMs = releaseMs;
            shard.falling = false;
            shard.fallPx = Phaser.Math.Between(ICE_SHARD_LOOK.fallPx[0], ICE_SHARD_LOOK.fallPx[1]);
            shard.fallMs = Phaser.Math.Between(ICE_SHARD_LOOK.fallMs[0], ICE_SHARD_LOOK.fallMs[1]);
        }
        def.hitDelaysMs.forEach((delayMs, index) => {
            const hit = this.hits.acquire();
            hit.def = def;
            hit.power = power;
            hit.x = x;
            hit.y = y;
            hit.waitMs = releaseMs + delayMs;
            hit.first = index === 0;
        });
    }

    public update(deltaMs: number): void {
        for (const shard of this.shards.active) {
            shard.waitMs -= deltaMs;
            if (shard.waitMs > 0) continue;
            if (!shard.falling) {
                shard.falling = true;
                shard.waitMs += shard.fallMs;
                this.playEffect(shard.key, shard.x, shard.y, shard.fallPx, shard.fallMs);
                continue;
            }
            this.playEffect(ICE_SHARD_LOOK.impact, shard.x, shard.y);
            this.audio.play(ICE_SHARD_LOOK.impactSound);
            this.doneShards.push(shard);
        }
        for (const hit of this.hits.active) {
            hit.waitMs -= deltaMs;
            if (hit.waitMs <= 0) {
                this.land(hit);
                this.doneHits.push(hit);
            }
        }
        // Released after the loops: releasing reorders `active` while we iterate it.
        for (const shard of this.doneShards) this.shards.release(shard);
        for (const hit of this.doneHits) this.hits.release(hit);
        this.doneShards.length = 0;
        this.doneHits.length = 0;
    }

    /** One area hit: damage to everyone in the circle, every number big, and the survivors slowed. */
    private land(hit: PendingIceHit): void {
        const { def, x, y } = hit;
        let touched = false;
        this.combat.hitArea({
            damageType: 'magic',
            x,
            y,
            radius: def.radius,
            areaDamage: def.damage * hit.power,
            direct: undefined,
            directDamage: 0,
            knockback: def.knockback,
            bigNumbers: true,
        }, (enemy) => {
            touched = true;
            this.chill(enemy);
        });
        if (!hit.first) return;
        this.screenShake.shake(def.shakePx, def.shakeMs);
        if (touched) this.onLanded();
    }

    private chill(enemy: Enemy): void {
        const slow = enemy.def.boss || enemy.champion ? ICE_SLOW.boss : ICE_SLOW.normal;
        enemy.slow(slow.factor, slow.ms);
    }
}
