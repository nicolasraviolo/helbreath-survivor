// Hechizo de la Maga: cuando hay un enemigo a su alcance, ella hace la animación de lanzar y, al soltar el hechizo,
// salen uno o varios proyectiles (data/spells.ts → shots, shotIntervalMs, aim):
// - 'targets': cada proyectil va a un enemigo distinto, el más cercano primero (Triple Energy Bolt: 3 enemigos).
// - 'scatter': caen alrededor del enemigo más cercano, uno cada `shotIntervalMs` (Energy Strike).
import Phaser from 'phaser';
import { CAST_ANIMATION_MS, CAST_RELEASE_MOMENT, SPELLS, type SpellDef, type SpellId } from '../data/spells';
import { Weapon, type WeaponContext } from './Weapon';

/** Spells look a bit further than their range when they leave the hands (the target may have stepped back). */
const RELEASE_RANGE_FACTOR = 1.5;

export class SpellWeapon extends Weapon {
    public readonly def: SpellDef;
    /** Time until the spell leaves the hands; negative = not casting. */
    private releaseInMs = -1;
    private shotsLeft = 0;
    private nextShotInMs = 0;
    /** Point the scattered shots fall around (the nearest enemy when the spell left). */
    private aimX = 0;
    private aimY = 0;

    constructor(public readonly id: SpellId) {
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
        const target = context.findNearestEnemy(this.def.range);
        if (!target) return false;
        const durationMs = CAST_ANIMATION_MS * context.cooldownMultiplier;
        context.castSpell(Math.atan2(target.bodyY - context.y, target.x - context.x), durationMs);
        this.releaseInMs = durationMs * CAST_RELEASE_MOMENT;
        return true;
    }

    /** The spell leaves the hands: aimed shots go now, scattered ones start their rhythm. */
    private release(context: WeaponContext): void {
        const def = this.def;
        const range = def.range * RELEASE_RANGE_FACTOR;
        if (def.aim === 'scatter') {
            const target = context.findNearestEnemy(range);
            if (!target) return;
            this.aimX = target.x;
            this.aimY = target.bodyY;
            this.shotsLeft = def.shots;
            this.nextShotInMs = 0;
            return;
        }
        const targets = context.findNearestEnemies(range, def.shots);
        if (targets.length === 0) return;
        const fromY = context.y - def.originOffsetY;
        for (let i = 0; i < def.shots; i++) {
            // Fewer enemies than shots: the extra ones go to the nearest again.
            const target = targets[i % targets.length];
            if (!target) continue;
            context.launchProjectile(def, context.x, fromY, target.x, target.bodyY, def.maxDistance);
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
        context.launchProjectile(def, context.x, fromY, toX, toY, flight);
        if (def.castSound) context.audio.play(def.castSound);
    }
}
