// Arma automática base: cuenta su recarga y, cuando está lista, intenta disparar.
// Cada arma concreta (EnergyBolt, y la Espada y las familias en la Fase 6) decide cómo dispara.
import type { Enemy } from '../entities/Enemy';
import type { ProjectileWeaponDef } from '../data/weapons';
import type { AudioSystem } from '../systems/AudioSystem';

/** What a weapon can see and do. Given by WeaponSystem every frame. */
export interface WeaponContext {
    /** Owner's feet. */
    readonly x: number;
    readonly y: number;
    findNearestEnemy(maxDistance: number): Enemy | undefined;
    launchProjectile(def: ProjectileWeaponDef, fromX: number, fromY: number, toX: number, toY: number, maxDistance: number): void;
    readonly audio: AudioSystem;
}

export abstract class Weapon {
    private cooldownLeftMs = 0;

    protected constructor(private readonly cooldownMs: number) {}

    public update(deltaMs: number, context: WeaponContext): void {
        this.cooldownLeftMs -= deltaMs;
        if (this.cooldownLeftMs > 0) return;
        if (this.fire(context)) {
            this.cooldownLeftMs = this.cooldownMs;
        } else {
            // Nothing to shoot at: stay ready and try again next frame.
            this.cooldownLeftMs = 0;
        }
    }

    /** Fires if it can. Returns true when it fired (the cooldown starts). */
    protected abstract fire(context: WeaponContext): boolean;
}
