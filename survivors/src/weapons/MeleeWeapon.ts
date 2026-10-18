// Arma cuerpo a cuerpo (Short Swords y Long Swords): cuando hay un enemigo a su alcance, el personaje da un tajo
// en arco hacia él. El daño llega un poco después de empezar la animación, como en el original (frame 2 de 8).
// Con apuntado manual (Fase 15B), el tajo va hacia donde apunta el jugador, si hay algún enemigo a su alcance.
// Los números de cada arma viven en data/weapons.ts (MELEE_WEAPONS).
import { MELEE_HIT_MOMENT, type MeleeWeaponDef, type MeleeWeaponId, MELEE_WEAPONS } from '../data/weapons';
import { MELEE_ORIGIN_OFFSET_Y } from '../config/gameConfig';
import { manualAimAngle } from '../systems/Targeting';
import { Weapon, type WeaponContext } from './Weapon';

/** Extra distance (beyond the blade) at which the swing starts, so it also catches enemies walking in. */
const TARGET_MARGIN_PX = 16;

export class MeleeWeapon extends Weapon {
    public readonly def: MeleeWeaponDef;
    /** Time until the damage of the current swing lands; negative = no swing pending. */
    private pendingHitMs = -1;
    private pendingAngle = 0;

    constructor(public readonly id: MeleeWeaponId) {
        super(MELEE_WEAPONS[id].cooldownMs);
        this.def = MELEE_WEAPONS[id];
    }

    public override update(deltaMs: number, context: WeaponContext): void {
        if (this.pendingHitMs >= 0) {
            this.pendingHitMs -= deltaMs;
            if (this.pendingHitMs < 0) context.hitMelee(this.def, this.pendingAngle);
        }
        super.update(deltaMs, context);
    }

    protected fire(context: WeaponContext): boolean {
        const def = this.def;
        const reach = def.range + TARGET_MARGIN_PX;
        const originY = context.y - MELEE_ORIGIN_OFFSET_Y;
        let angle: number;
        if (context.manualAim) {
            if (!context.inReach(reach)) return false;
            angle = manualAimAngle(context.manualAim, context.x, originY);
        } else {
            const target = context.findTarget(reach);
            if (!target) return false;
            angle = Math.atan2(target.bodyY - originY, target.x - context.x);
        }
        const durationMs = def.swingMs * context.cooldownMultiplier;
        context.swingMelee(def, angle, durationMs);
        this.pendingHitMs = durationMs * MELEE_HIT_MOMENT;
        this.pendingAngle = angle;
        return true;
    }
}
