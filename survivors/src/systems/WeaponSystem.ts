// Armas del jugador: les da el contexto cada frame, mueve los proyectiles de los hechizos (con pool), detecta impactos
// y lanza las explosiones (algunas con retraso, como Fire Strike), cuyo daño aplica CombatSystem una sola vez.
// También los tajos cuerpo a cuerpo (animación, estela y daño) y el Critical Strike del Guerrero (Fase 19A): un golpe de
// área inmediato cuya forma depende de la familia del arma (data/critStrike.ts); lo pide systems/CritStrikeSystem.ts.
// Y los hechizos activos del Mago (Fase 19B y 20D, data/activeSpells.ts): el meteorito o una ráfaga de proyectiles;
// los pide systems/ActiveSpellSystem.ts.
import Phaser from 'phaser';
import { MELEE_ORIGIN_OFFSET_Y } from '../config/gameConfig';
import { SWING_SOUND_MS } from '../data/audio';
import type { EffectKey } from '../config/effects';
import { CAST_RELEASE_MOMENT, CAST_SOUND, SPELLS, type SpellBurst, type SpellDef } from '../data/spells';
import { critReach, type CritShape } from '../data/critStrike';
import { METEOR_LOOK, type BarrageSpellDef, type MeteorSpellDef } from '../data/activeSpells';
import { MELEE_HIT_MOMENT, MELEE_HIT_SOUND, MELEE_SWING_SOUND, type MeleeWeaponDef } from '../data/weapons';
import { Effect } from '../entities/Effect';
import type { Enemy } from '../entities/Enemy';
import { LightningArc } from '../entities/LightningArc';
import { Meteor } from '../entities/Meteor';
import { Projectile } from '../entities/Projectile';
import { Slash } from '../entities/Slash';
import { Pool, type Poolable } from '../utils/Pool';
import type { Weapon, WeaponContext } from '../weapons/Weapon';
import type { AudioSystem } from './AudioSystem';
import type { CombatSystem } from './CombatSystem';
import type { EnemySystem } from './EnemySystem';
import type { ScreenShake } from './ScreenShake';
import { type ManualAim, manualAimAngle, Targeting } from './Targeting';

/** Owner animation asked by a weapon: a melee swing or a cast. */
export type OwnerAction = 'melee' | 'cast';

/** An explosion waiting to be drawn (Fire Strike: 4 explosions 0–140 ms apart). */
class PendingBurst implements Poolable {
    public poolIndex = -1;
    public burst!: SpellBurst;
    public x = 0;
    public y = 0;
    public waitMs = 0;
}

/** A spell falling from the sky (Fase 26C): its damage lands after `waitMs` (Chill Wind's drops take a moment). */
class PendingSkyHit implements Poolable {
    public poolIndex = -1;
    public def!: SpellDef;
    public target: Enemy | undefined;
    public x = 0;
    public y = 0;
    public waitMs = 0;
}

export class WeaponSystem {
    private readonly weapons: Weapon[] = [];
    private readonly projectiles: Pool<Projectile>;
    private readonly effects: Pool<Effect>;
    private readonly finishedProjectiles: Projectile[] = [];
    private readonly meteors: Pool<Meteor>;
    private readonly finishedMeteors: Meteor[] = [];
    private readonly finishedEffects: Effect[] = [];
    private readonly context: WeaponContext & { x: number; y: number; cooldownMultiplier: number };
    private readonly slash: Slash;
    private readonly bursts = new Pool(() => new PendingBurst());
    private readonly finishedBursts: PendingBurst[] = [];
    private readonly skyHits = new Pool(() => new PendingSkyHit());
    private readonly finishedSkyHits: PendingSkyHit[] = [];
    private readonly lightnings: Pool<LightningArc>;
    private readonly finishedLightnings: LightningArc[] = [];
    private readonly targeting: Targeting;
    /** Critical Strike under way: blows still to land (axes spin twice) and when the next one lands. */
    /** Fase 19C: the Critical Strike or the Mage's active spell hit at least one monster (once per launch; the gamepad vibrates). */
    public onSkillHit: ((skill: 'critStrike' | 'activeSpell') => void) | undefined;
    private readonly strike = { hitsLeft: 0, landed: false, waitMs: 0, angle: 0, radius: 0, arc: 0, damage: 0, knockback: 0, repeatMs: 0, swingMs: 0 };
    /** Active spell barrage under way (Fase 20D): shots still to throw around (x, y), and when the next one goes. */
    private readonly barrage = { def: undefined as BarrageSpellDef | undefined, shotsLeft: 0, waitMs: 0, x: 0, y: 0, damageScale: 1, landed: false };
    /** Plays the owner's swing or cast animation (set by the game scene). */
    private onOwnerAction: (action: OwnerAction, angle: number, durationMs: number) => void = () => undefined;

    constructor(
        scene: Phaser.Scene,
        private readonly enemies: EnemySystem,
        private readonly combat: CombatSystem,
        private readonly audio: AudioSystem,
        private readonly screenShake: ScreenShake,
    ) {
        this.projectiles = new Pool(() => new Projectile(scene));
        this.meteors = new Pool(() => new Meteor(scene, METEOR_LOOK));
        this.effects = new Pool(() => new Effect(scene));
        this.lightnings = new Pool(() => new LightningArc(scene));
        this.slash = new Slash(scene);
        const targeting = new Targeting(enemies);
        this.targeting = targeting;
        this.context = {
            x: 0,
            y: 0,
            cooldownMultiplier: 1,
            audio,
            findTarget: (maxDistance) => this.targeting.findTarget(this.context.x, this.context.y, maxDistance),
            findTargets: (maxDistance, count) => this.targeting.findTargets(this.context.x, this.context.y, maxDistance, count),
            get manualAim() {
                return targeting.manual;
            },
            inReach: (maxDistance) => this.targeting.inReach(this.context.x, this.context.y, maxDistance),
            launchProjectile: (def, fromX, fromY, toX, toY, maxDistance, target) => {
                this.projectiles.acquire().launch(def, fromX, fromY, toX, toY, maxDistance, target);
            },
            skyStrike: (def, x, y, target) => this.skyStrike(def, x, y, target),
            castSpell: (angle, durationMs) => {
                this.onOwnerAction('cast', angle, durationMs);
                audio.play(CAST_SOUND, durationMs);
            },
            swingMelee: (def, angle, durationMs) => {
                this.onOwnerAction('melee', angle, durationMs);
                this.slash.show(this.context.x, this.context.y - MELEE_ORIGIN_OFFSET_Y, def.range, angle, Phaser.Math.DegToRad(def.arcDegrees));
            },
            hitMelee: (def, angle) => {
                // As in the original: the swing sound plays when the blow lands (frame 2), squeezed to the attack length.
                audio.play(MELEE_SWING_SOUND, SWING_SOUND_MS);
                const hits = combat.hitArc({
                    damageType: 'physical',
                    x: this.context.x,
                    y: this.context.y - MELEE_ORIGIN_OFFSET_Y,
                    radius: def.range,
                    angle,
                    arc: Phaser.Math.DegToRad(def.arcDegrees),
                    damage: def.damage,
                    knockback: def.knockback,
                }, (enemy) => this.spawnEffect('fx.hit', enemy.x, enemy.bodyY));
                if (hits > 0) audio.play(MELEE_HIT_SOUND);
            },
        };
    }

    public get activeProjectiles(): number {
        return this.projectiles.active.length;
    }

    public add(weapon: Weapon): void {
        this.weapons.push(weapon);
    }

    /** Swaps a weapon for another one in the same place (the melee weapon in hand). */
    public replace(oldWeapon: Weapon, newWeapon: Weapon): void {
        const index = this.weapons.indexOf(oldWeapon);
        if (index >= 0) this.weapons[index] = newWeapon;
        else this.weapons.push(newWeapon);
    }

    /** Plays a one-shot effect (also used for the footstep dust, so it shares the effect pool). */
    public spawnEffect(key: EffectKey, x: number, y: number): void {
        this.effects.acquire().play(key, x, y);
    }

    public setOwnerActionHandler(handler: (action: OwnerAction, angle: number, durationMs: number) => void): void {
        this.onOwnerAction = handler;
    }

    /** Manual aim of this frame (InputSystem.getManualAim), or undefined for the automatic one. */
    public setManualAim(aim: Readonly<ManualAim> | undefined): void {
        this.targeting.manual = aim;
    }

    /**
     * Critical Strike (Fase 19A): a swing right now, wider and further than the weapon's own, towards the manual aim, else
     * the nearest enemy in reach, else `fallbackAngle` (where the player faces). `damage` is the base damage of each blow.
     */
    public criticalStrike(def: MeleeWeaponDef, shape: CritShape, damage: number, fallbackAngle: number): void {
        const { x, y } = this.context;
        const originY = y - MELEE_ORIGIN_OFFSET_Y;
        const radius = critReach(def.range, shape);
        let angle = fallbackAngle;
        const manual = this.targeting.manual;
        if (manual) {
            angle = manualAimAngle(manual, x, originY);
        } else {
            const target = this.targeting.findTarget(x, y, radius);
            if (target) angle = Math.atan2(target.bodyY - originY, target.x - x);
        }
        const swingMs = def.swingMs * this.context.cooldownMultiplier;
        const strike = this.strike;
        strike.hitsLeft = shape.hits;
        strike.landed = false;
        strike.waitMs = swingMs * MELEE_HIT_MOMENT;
        strike.angle = angle;
        strike.radius = radius;
        strike.arc = Phaser.Math.DegToRad(shape.arcDegrees);
        strike.damage = damage;
        strike.knockback = shape.knockback;
        strike.repeatMs = shape.repeatMs;
        strike.swingMs = swingMs;
        this.onOwnerAction('melee', angle, swingMs);
    }

    /**
     * Where the Mage's active spell should land (Fase 19B): at the cursor (within `range`), `range` × `stickShare` along
     * the aim stick, else on the target of the automatic aim (a near boss first). Undefined with nothing in range.
     */
    public activeSpellTarget(range: number, stickShare: number): { x: number; y: number } | undefined {
        const { x, y } = this.context;
        const manual = this.targeting.manual;
        if (manual) {
            const point = manual.point;
            const angle = manualAimAngle(manual, x, y);
            const distance = point ? Math.min(range, Math.hypot(point.x - x, point.y - y)) : range * stickShare;
            return { x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance };
        }
        const target = this.targeting.findTarget(x, y, range);
        return target ? { x: target.x, y: target.y } : undefined;
    }

    /** Meteor Strike (Fase 19B): a meteor starts falling on (x, y); it explodes in update() when it lands. */
    public castMeteor(def: MeteorSpellDef, powerMultiplier: number, x: number, y: number): void {
        this.onOwnerAction('cast', Math.atan2(y - this.context.y, x - this.context.x), def.castMs);
        if (def.castSound) this.audio.play(def.castSound);
        this.meteors.acquire().launch(def, powerMultiplier, x, y);
    }

    /**
     * Barrage (Fase 20D, Energy Strike / Mass Fire Strike): the cast animation, then `shots` projectiles of its spell to
     * random points around (x, y), each one's damage × `damageScale` × `powerMultiplier`, every number big.
     */
    public castBarrage(def: BarrageSpellDef, powerMultiplier: number, x: number, y: number): void {
        this.onOwnerAction('cast', Math.atan2(y - this.context.y, x - this.context.x), def.castMs);
        this.audio.play(CAST_SOUND, def.castMs);
        const barrage = this.barrage;
        barrage.def = def;
        barrage.shotsLeft = def.shots;
        barrage.waitMs = def.castMs * CAST_RELEASE_MOMENT;
        barrage.x = x;
        barrage.y = y;
        barrage.damageScale = def.damageScale * powerMultiplier;
        barrage.landed = false;
    }

    public setCooldownMultiplier(value: number): void {
        this.context.cooldownMultiplier = value;
    }

    /** Fires the weapons from the owner's feet at (x, y), unless `firing` is false (the owner is dead). */
    /** Development (M15): the melee slash style being compared, by its number in data/slash.ts. */
    public get slashEffect(): Slash {
        return this.slash;
    }

    public update(deltaMs: number, x: number, y: number, firing: boolean): void {
        this.context.x = x;
        this.context.y = y;
        if (firing) {
            for (const weapon of this.weapons) weapon.update(deltaMs, this.context);
        }

        for (const projectile of this.projectiles.active) {
            const stillFlying = projectile.update(deltaMs);
            const trail = projectile.def.trail;
            if (trail && (projectile.trailWaitMs -= deltaMs) <= 0) {
                projectile.trailWaitMs += trail.everyMs;
                const spread = trail.spread;
                this.spawnEffect(trail.effect, projectile.x + Phaser.Math.Between(-spread, spread), projectile.y + Phaser.Math.Between(-spread, spread));
            }
            if (projectile.target && !projectile.target.isAlive) projectile.target = undefined;
            const radius = projectile.def.projectileRadius;
            const hit = projectile.target
                ? (this.enemies.isTouching(projectile.target, projectile.x, projectile.y, radius) ? projectile.target : undefined)
                : this.enemies.findTouching(projectile.x, projectile.y, radius);
            if (hit || !stillFlying) {
                this.explode(projectile, hit);
                projectile.deactivate();
                this.finishedProjectiles.push(projectile);
            }
        }
        for (const meteor of this.meteors.active) {
            if (meteor.update(deltaMs)) {
                if ((meteor.smokeWaitMs -= deltaMs) <= 0) {
                    meteor.smokeWaitMs += METEOR_LOOK.smokeEveryMs;
                    this.spawnEffect(METEOR_LOOK.smoke, meteor.x, meteor.y);
                }
                continue;
            }
            this.landMeteor(meteor);
            meteor.deactivate();
            this.finishedMeteors.push(meteor);
        }
        for (const meteor of this.finishedMeteors) this.meteors.release(meteor);
        this.finishedMeteors.length = 0;
        this.updateStrike(deltaMs);
        this.updateBarrage(deltaMs);
        this.slash.update(deltaMs);
        for (const pending of this.bursts.active) {
            pending.waitMs -= deltaMs;
            if (pending.waitMs <= 0) {
                this.drawBurst(pending.burst, pending.x, pending.y);
                this.finishedBursts.push(pending);
            }
        }
        for (const pending of this.finishedBursts) this.bursts.release(pending);
        this.finishedBursts.length = 0;
        for (const pending of this.skyHits.active) {
            pending.waitMs -= deltaMs;
            if (pending.waitMs <= 0) {
                this.landSkyHit(pending);
                this.finishedSkyHits.push(pending);
            }
        }
        for (const pending of this.finishedSkyHits) this.skyHits.release(pending);
        this.finishedSkyHits.length = 0;
        for (const arc of this.lightnings.active) {
            if (!arc.update(deltaMs)) this.finishedLightnings.push(arc);
        }
        for (const arc of this.finishedLightnings) this.lightnings.release(arc);
        this.finishedLightnings.length = 0;
        for (const effect of this.effects.active) {
            if (!effect.update(deltaMs)) this.finishedEffects.push(effect);
        }
        // Released after the loops: releasing reorders `active` while we iterate it.
        for (const projectile of this.finishedProjectiles) this.projectiles.release(projectile);
        for (const effect of this.finishedEffects) this.effects.release(effect);
        this.finishedProjectiles.length = 0;
        this.finishedEffects.length = 0;
    }

    /** Lands the blows of the Critical Strike when their time comes (the second spin of an axe swings again). */
    private updateStrike(deltaMs: number): void {
        const strike = this.strike;
        if (strike.hitsLeft <= 0 || (strike.waitMs -= deltaMs) > 0) return;
        strike.hitsLeft--;
        const x = this.context.x;
        const y = this.context.y - MELEE_ORIGIN_OFFSET_Y;
        this.audio.play(MELEE_SWING_SOUND, SWING_SOUND_MS);
        this.slash.show(x, y, strike.radius, strike.angle, strike.arc);
        const hits = this.combat.hitArc({
            damageType: 'physical',
            x,
            y,
            radius: strike.radius,
            angle: strike.angle,
            arc: strike.arc,
            damage: strike.damage,
            knockback: strike.knockback,
            bigNumbers: true,
        }, (enemy) => this.spawnEffect('fx.hit', enemy.x, enemy.bodyY));
        if (hits > 0) this.audio.play(MELEE_HIT_SOUND);
        // Only the first blow that touches a monster (an axe spins twice): the gamepad vibrates once per strike.
        if (hits > 0 && !strike.landed) {
            strike.landed = true;
            this.onSkillHit?.('critStrike');
        }
        if (strike.hitsLeft > 0) {
            strike.waitMs = strike.repeatMs;
            this.onOwnerAction('melee', strike.angle, strike.swingMs);
        }
    }

    /** Throws the shots of the barrage when their time comes, from the Mage's hands to around the chosen point. */
    private updateBarrage(deltaMs: number): void {
        const barrage = this.barrage;
        const def = barrage.def;
        if (!def || barrage.shotsLeft <= 0) return;
        barrage.waitMs -= deltaMs;
        while (barrage.shotsLeft > 0 && barrage.waitMs <= 0) {
            barrage.shotsLeft--;
            barrage.waitMs += def.shotIntervalMs;
            const shot: SpellDef = SPELLS[def.shot];
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.sqrt(Math.random()) * def.scatterRadius;
            const toX = barrage.x + Math.cos(angle) * distance;
            const toY = barrage.y + Math.sin(angle) * distance;
            const { x } = this.context;
            const fromY = this.context.y - shot.originOffsetY;
            const projectile = this.projectiles.acquire();
            projectile.launch(shot, x, fromY, toX, toY, Phaser.Math.Distance.Between(x, fromY, toX, toY));
            projectile.damageScale = barrage.damageScale;
            projectile.fromSkill = true;
            if (shot.castSound) this.audio.play(shot.castSound);
        }
    }

    /** The meteor landed: its three explosions at once, a big shake and the damage, every number big. */
    private landMeteor(meteor: Meteor): void {
        const { def, targetX: x, targetY: y } = meteor;
        for (const key of METEOR_LOOK.impact) this.spawnEffect(key, x, y);
        const spread = METEOR_LOOK.burstSpread;
        for (let i = 0; i < METEOR_LOOK.burstCount; i++) {
            this.spawnEffect(METEOR_LOOK.burst, x + Phaser.Math.Between(-spread, spread), y + Phaser.Math.Between(-spread, spread));
        }
        this.audio.play(def.impactSound);
        this.screenShake.shake(def.shakePx, def.shakeMs);
        if (this.touchesAny(x, y, def.areaRadius)) this.onSkillHit?.('activeSpell');
        this.combat.hitArea({
            damageType: 'magic',
            x,
            y,
            radius: def.areaRadius,
            areaDamage: def.areaDamage * meteor.powerMultiplier,
            direct: this.enemies.findTouching(x, y, def.directRadius),
            directDamage: def.directDamage * meteor.powerMultiplier,
            knockback: def.knockback,
            bigNumbers: true,
        });
    }

    /** A spell with aim 'sky' falls on (x, y): its drops or lightning now, the damage after `skyImpactMs`. */
    private skyStrike(def: SpellDef, x: number, y: number, target: Enemy | undefined): void {
        if (def.skyLightning) this.lightnings.acquire().strike(x, y);
        this.drawBursts(def, x, y);
        const pending = this.skyHits.acquire();
        pending.def = def;
        pending.target = target;
        pending.x = x;
        pending.y = y;
        pending.waitMs = def.skyImpactMs ?? 0;
        // A lightning hits at once (this frame), not one frame late.
        if (pending.waitMs <= 0) {
            this.landSkyHit(pending);
            this.skyHits.release(pending);
        }
    }

    /** The sky spell lands: the enemy it was aimed at takes the direct damage if it is still there. */
    private landSkyHit(pending: PendingSkyHit): void {
        const { def, x, y } = pending;
        const aimed = pending.target?.isAlive && this.enemies.isTouching(pending.target, x, y, def.projectileRadius) ? pending.target : undefined;
        const direct = def.directDamage > 0 ? aimed ?? this.enemies.findTouching(x, y, def.projectileRadius) : undefined;
        pending.target = undefined;
        this.hitSpell(def, x, y, direct, 1, false);
    }

    /** Draws the explosions of a spell at (x, y), now or after their delay. */
    private drawBursts(def: SpellDef, x: number, y: number): void {
        for (const burst of def.bursts) {
            if (burst.delayMs <= 0) {
                this.drawBurst(burst, x, y);
                continue;
            }
            const pending = this.bursts.acquire();
            pending.burst = burst;
            pending.x = x;
            pending.y = y;
            pending.waitMs = burst.delayMs;
        }
    }

    /** Impact: the damage lands once; the explosions are drawn now or after their delay. */
    private explode(projectile: Projectile, direct: Enemy | undefined): void {
        const { def, x, y, damageScale, fromSkill } = projectile;
        this.drawBursts(def, x, y);
        this.hitSpell(def, x, y, direct, damageScale, fromSkill);
    }

    /** The damage of a spell's impact at (x, y), once, with the hit spark on the enemy it hit directly. */
    private hitSpell(def: SpellDef, x: number, y: number, direct: Enemy | undefined, damageScale: number, fromSkill: boolean): void {
        // The original hit spark on the enemy the spell hits, as with the melee blows.
        if (direct?.isAlive) this.spawnEffect('fx.hit', direct.x, direct.bodyY);
        const critical = this.combat.hitArea({
            damageType: 'magic',
            x,
            y,
            radius: def.areaRadius,
            areaDamage: def.areaDamage * damageScale,
            direct,
            directDamage: def.directDamage * damageScale,
            knockback: def.knockback,
            bigNumbers: fromSkill,
        });
        // The first shot of a barrage that touches a monster: the gamepad vibrates once per cast.
        if (fromSkill && !this.barrage.landed && this.touchesAny(x, y, def.areaRadius)) {
            this.barrage.landed = true;
            this.onSkillHit?.('activeSpell');
        }
        if (critical && def.impactShakePx) this.screenShake.criticalExplosion(def.impactShakePx);
    }

    private touchesAny(x: number, y: number, radius: number): boolean {
        let touched = false;
        this.enemies.forEachInRadius(x, y, radius, () => {
            touched = true;
        });
        return touched;
    }

    private drawBurst(burst: SpellBurst, x: number, y: number): void {
        this.effects.acquire().play(burst.effect, x + burst.dx, y + burst.dy, burst.fallPx, burst.fallMs);
        if (burst.sound) this.audio.play(burst.sound);
    }
}
