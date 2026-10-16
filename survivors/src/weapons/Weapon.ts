// Arma automática base: cuenta su recarga y, cuando está lista, intenta disparar.
// Cada arma concreta (SpellWeapon, MeleeWeapon) decide cómo dispara.
import type { Enemy } from '../entities/Enemy';
import type { SpellDef } from '../data/spells';
import type { MeleeWeaponDef } from '../data/weapons';
import type { AudioSystem } from '../systems/AudioSystem';

/** What a weapon can see and do. Given by WeaponSystem every frame. */
export interface WeaponContext {
    /** Owner's feet. */
    readonly x: number;
    readonly y: number;
    findNearestEnemy(maxDistance: number): Enemy | undefined;
    /** Up to `count` enemies, nearest first (the array is reused: read it right away). */
    findNearestEnemies(maxDistance: number, count: number): readonly Enemy[];
    launchProjectile(def: SpellDef, fromX: number, fromY: number, toX: number, toY: number, maxDistance: number): void;
    /** Spells: plays the owner's cast animation and sound towards `angle` (radians). */
    castSpell(angle: number, durationMs: number): void;
    /** Melee: plays the owner's swing animation, the slash and the swing sound towards `angle` (radians). */
    swingMelee(def: MeleeWeaponDef, angle: number, durationMs: number): void;
    /** Melee: applies the damage of a swing towards `angle`. */
    hitMelee(def: MeleeWeaponDef, angle: number): void;
    readonly audio: AudioSystem;
    /** Multiplies every cooldown (class bonus and Dex). */
    readonly cooldownMultiplier: number;
}

export abstract class Weapon {
    private cooldownLeftMs = 0;

    protected constructor(private readonly cooldownMs: number) {}

    public update(deltaMs: number, context: WeaponContext): void {
        this.cooldownLeftMs -= deltaMs;
        if (this.cooldownLeftMs > 0) return;
        if (this.fire(context)) {
            this.cooldownLeftMs = this.cooldownMs * context.cooldownMultiplier;
        } else {
            // Nothing to shoot at: stay ready and try again next frame.
            this.cooldownLeftMs = 0;
        }
    }

    /** Fires if it can. Returns true when it fired (the cooldown starts). */
    protected abstract fire(context: WeaponContext): boolean;
}
