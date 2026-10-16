// Energy Bolt: dispara solo una bola mágica al enemigo vivo más cercano dentro de su alcance.
// Como en sp-client/src/game/spells/EnergyBolt.ts, sale por encima de la cabeza del lanzador.
import { ENERGY_BOLT_ORIGIN_OFFSET_Y } from '../config/gameConfig';
import { WEAPONS, type ProjectileWeaponDef } from '../data/weapons';
import { Weapon, type WeaponContext } from './Weapon';

export class EnergyBolt extends Weapon {
    private readonly def: ProjectileWeaponDef = WEAPONS.energyBolt;

    constructor() {
        super(WEAPONS.energyBolt.cooldownMs);
    }

    protected fire(context: WeaponContext): boolean {
        const def = this.def;
        const target = context.findNearestEnemy(def.range);
        if (!target) return false;
        const fromY = context.y - ENERGY_BOLT_ORIGIN_OFFSET_Y;
        context.launchProjectile(def, context.x, fromY, target.x, target.bodyY, def.maxDistance);
        context.audio.play(def.castSound);
        return true;
    }
}
