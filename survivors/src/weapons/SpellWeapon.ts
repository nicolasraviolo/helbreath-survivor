// Hechizo de la Maga: cuando hay un enemigo a su alcance, ella hace la animación de lanzar y, al soltar el hechizo,
// salen uno o varios proyectiles (data/spells.ts → shots, shotIntervalMs, aim):
// - 'targets': cada proyectil va a un enemigo distinto, el más cercano primero (Triple Energy Bolt: 3 enemigos).
// - 'scatter': caen alrededor del enemigo elegido, uno cada `shotIntervalMs` (Energy Strike).
// A quién apuntan lo decide systems/Targeting.ts: un jefe cercano va antes que los demás (Fase 15A).
// Con apuntado manual (15B), si hay algún enemigo al alcance: los proyectiles salen hacia donde apunta el jugador (en
// abanico si son varios) y los que caen en zona caen en el cursor (sin pasar del alcance) o, con el stick, a una
// distancia fija en esa dirección (data/targeting.ts → MANUAL_AIM).
import Phaser from 'phaser';
import { CAST_ANIMATION_MS, CAST_RELEASE_MOMENT, SPELLS, type AutoSpellId, type SpellDef } from '../data/spells';
import { MANUAL_AIM } from '../data/targeting';
import type { Enemy } from '../entities/Enemy';
import { type ManualAim, manualAimAngle } from '../systems/Targeting';
import { Weapon, type WeaponContext } from './Weapon';

/** Spells look a bit further than their range when they leave the hands (the target may have stepped back). */
const RELEASE_RANGE_FACTOR = 1.5;

export class SpellWeapon extends Weapon {
    public readonly def: SpellDef;
    /** Time until the spell leaves the hands; negative = not casting. */
    private releaseInMs = -1;
    private shotsLeft = 0;
    private nextShotInMs = 0;
    /** Point the scattered shots fall around (the target when the spell left). */
    private aimX = 0;
    private aimY = 0;
    /** The boss they were aimed at, if it was one: the shots fly through the other monsters. */
    private aimBoss: Enemy | undefined;

    constructor(public readonly id: AutoSpellId) {
        super(SPELLS[id].cooldownMs);
        this.def = SPELLS[id];
    }

    public override update(deltaMs: number, context: WeaponContext): void {
        if (this.releaseInMs >= 0) {
            this.releaseInMs -= deltaMs;
            if (this.releaseInMs < 0) this.release(context);
        }
        if (this.shotsLeft > 0) {
            this.nextShotInMs -= deltaMs;
            while (this.shotsLeft > 0 && this.nextShotInMs <= 0) {
                this.scatterShot(context);
                this.nextShotInMs += this.def.shotIntervalMs;
            }
        }
        super.update(deltaMs, context);
    }

    protected fire(context: WeaponContext): boolean {
        let angle: number;
        if (context.manualAim) {
            if (!context.inReach(this.def.range)) return false;
            angle = manualAimAngle(context.manualAim, context.x, context.y);
        } else {
            const target = context.findTarget(this.def.range);
            if (!target) return false;
            angle = Math.atan2(target.bodyY - context.y, target.x - context.x);
        }
        const durationMs = CAST_ANIMATION_MS * context.cooldownMultiplier;
        context.castSpell(angle, durationMs);
        this.releaseInMs = durationMs * CAST_RELEASE_MOMENT;
        return true;
    }

    /** The spell leaves the hands: aimed shots go now, scattered ones start their rhythm. */
    private release(context: WeaponContext): void {
        const def = this.def;
        const range = def.range * RELEASE_RANGE_FACTOR;
        if (context.manualAim) {
            this.releaseManual(context, context.manualAim);
            return;
        }
        if (def.aim === 'scatter') {
            const target = context.findTarget(range);
            if (!target) return;
            this.aimX = target.x;
            this.aimY = target.bodyY;
            this.aimBoss = bossOrUndefined(target);
            this.shotsLeft = def.shots;
            this.nextShotInMs = 0;
            return;
        }
        const targets = context.findTargets(range, def.shots);
        if (targets.length === 0) return;
        const fromY = context.y - def.originOffsetY;
        for (let i = 0; i < def.shots; i++) {
            // Fewer enemies than shots: the extra ones go to the nearest again.
            const target = targets[i % targets.length];
            if (!target) continue;
            context.launchProjectile(def, context.x, fromY, target.x, target.bodyY, def.maxDistance, bossOrUndefined(target));
            if (def.castSound) context.audio.play(def.castSound);
        }
    }

    /** Released while the player aims by hand: towards the aim, even if the enemy has gone (the cast already started). */
    private releaseManual(context: WeaponContext, aim: Readonly<ManualAim>): void {
        const def = this.def;
        const fromY = context.y - def.originOffsetY;
        if (def.aim === 'scatter') {
            const point = aim.point;
            let distance = def.range * MANUAL_AIM.stickAreaDistance;
            if (point) distance = Math.min(def.range, Phaser.Math.Distance.Between(context.x, context.y, point.x, point.y));
            const angle = manualAimAngle(aim, context.x, context.y);
            this.aimX = context.x + Math.cos(angle) * distance;
            this.aimY = context.y + Math.sin(angle) * distance;
            this.aimBoss = undefined;
            this.shotsLeft = def.shots;
            this.nextShotInMs = 0;
            return;
        }
        const angle = manualAimAngle(aim, context.x, fromY);
        const fan = Phaser.Math.DegToRad(MANUAL_AIM.fanDegrees);
        for (let i = 0; i < def.shots; i++) {
            // Centred on the aim: 1 shot straight, 3 shots at -fan, 0, +fan.
            const shotAngle = angle + (i - (def.shots - 1) / 2) * fan;
            const toX = context.x + Math.cos(shotAngle) * def.maxDistance;
            const toY = fromY + Math.sin(shotAngle) * def.maxDistance;
            context.launchProjectile(def, context.x, fromY, toX, toY, def.maxDistance);
            if (def.castSound) context.audio.play(def.castSound);
        }
    }

    /** One projectile to a random point around the aim, exploding there. */
    private scatterShot(context: WeaponContext): void {
        const def = this.def;
        this.shotsLeft--;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * (def.scatterRadius ?? 0);
        const toX = this.aimX + Math.cos(angle) * distance;
        const toY = this.aimY + Math.sin(angle) * distance;
        const fromY = context.y - def.originOffsetY;
        const flight = Phaser.Math.Distance.Between(context.x, fromY, toX, toY);
        context.launchProjectile(def, context.x, fromY, toX, toY, flight, this.aimBoss);
        if (def.castSound) context.audio.play(def.castSound);
    }
}

function bossOrUndefined(enemy: Enemy): Enemy | undefined {
    return enemy.def.boss ? enemy : undefined;
}
