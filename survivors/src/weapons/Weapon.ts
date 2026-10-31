// Arma automática base: cuenta su recarga y, cuando está lista, intenta disparar.
// Cada arma concreta (SpellWeapon, MeleeWeapon) decide cómo dispara.
import type { Enemy } from '../entities/Enemy';
import type { SpellDef } from '../data/spells';
import type { MeleeWeaponDef } from '../data/weapons';
import type { AudioSystem } from '../systems/AudioSystem';
import type { ManualAim } from '../systems/Targeting';

/** What a weapon can see and do. Given by WeaponSystem every frame. */
export interface WeaponContext {
    /** Owner's feet. */
    readonly x: number;
    readonly y: number;
    /** Enemy to attack within `maxDistance` (systems/Targeting.ts: a nearby boss first, else the nearest). */
    findTarget(maxDistance: number): Enemy | undefined;
    /** Up to `count` enemies: a nearby boss first, then the nearest (the array is reused: read it right away). */
    findTargets(maxDistance: number, count: number): readonly Enemy[];
    /** Where the player aims by hand (systems/Targeting.ts), or undefined: then use findTarget / findTargets. */
    readonly manualAim: Readonly<ManualAim> | undefined;
    /** True if some enemy is within `maxDistance` (manual aim only attacks then). */
    inReach(maxDistance: number): boolean;
    /** `target`: the only enemy it may hit (a boss: it flies through the others). */
    launchProjectile(def: SpellDef, fromX: number, fromY: number, toX: number, toY: number, maxDistance: number, target?: Enemy): void;
    /** Spells with aim 'sky' (Fase 26C): it falls on (x, y); `target` is the enemy it was aimed at, if any. */
    skyStrike(def: SpellDef, x: number, y: number, target?: Enemy): void;
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
