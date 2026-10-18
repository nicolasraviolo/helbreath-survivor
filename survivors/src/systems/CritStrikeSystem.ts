// Critical Strike del Guerrero (Fase 19A): cargas, recarga y lanzamiento. Lo pide el jugador (Espacio, R2 del mando o el
// botón táctil); cada uno gasta una carga y da un golpe de área inmediato según el arma (WeaponSystem.criticalStrike),
// con la espiral del Earthworm Strike alrededor del jugador, el grito del original (C23 / C24) y un pequeño temblor.
// Cargas: máximo 1 + Power/10; +1 cada 20 s y +1 cada 15 golpes recibidos (números en data/critStrike.ts).
// Con `infinite` (truco ?debug=crits o la tecla H) no se gastan: para probarlo sin esperar.
import {
    CRIT_SHAPES,
    CRIT_SHOUT,
    CRIT_STRIKE,
    critDamageMultiplier,
    maxCritCharges,
} from '../data/critStrike';
import type { Gender } from '../data/appearance';
import type { MeleeWeaponDef } from '../data/weapons';
import type { AudioSystem } from './AudioSystem';
import type { ScreenShake } from './ScreenShake';
import type { WeaponSystem } from './WeaponSystem';

export class CritStrikeSystem {
    private chargesHeld = 1;
    private rechargeMs = 0;
    private hitsTaken = 0;
    private launchedCount = 0;
    /** Debug: charges are never spent. */
    public infinite = false;

    constructor(
        private readonly weapons: WeaponSystem,
        private readonly audio: AudioSystem,
        private readonly screenShake: ScreenShake,
    ) {}

    public get charges(): number {
        return this.chargesHeld;
    }

    /** Critical Strikes launched this run: the HUD shows the icon pressed when it changes. */
    public get launched(): number {
        return this.launchedCount;
    }

    /** Continue (saved run): the charges it had, within the maximum of its Power. */
    public restore(charges: number, level: number): void {
        this.chargesHeld = Math.max(0, Math.min(maxCritCharges(level), Math.floor(charges)));
    }

    /** Recharges over time up to the maximum of this Power. The clock stops while full. */
    public update(deltaMs: number, level: number): void {
        const max = maxCritCharges(level);
        if (this.chargesHeld >= max) {
            this.rechargeMs = 0;
            return;
        }
        this.rechargeMs += deltaMs;
        if (this.rechargeMs >= CRIT_STRIKE.rechargeMs) {
            this.rechargeMs -= CRIT_STRIKE.rechargeMs;
            this.chargesHeld++;
        }
    }

    /** A blow landed on the player: every few of them give a charge, as in the original. */
    public onHurt(level: number): void {
        if (++this.hitsTaken < CRIT_STRIKE.hitsPerCharge) return;
        this.hitsTaken = 0;
        this.chargesHeld = Math.min(maxCritCharges(level), this.chargesHeld + 1);
    }

    /**
     * Launches a Critical Strike with the weapon in hand, if there is a charge. `facing` is the angle the player looks
     * to (used when nothing is aimed at). Returns true if it went off.
     */
    public launch(weapon: MeleeWeaponDef, level: number, gender: Gender, x: number, y: number, facing: number): boolean {
        if (this.chargesHeld <= 0 && !this.infinite) return false;
        if (!this.infinite) this.chargesHeld--;
        const shape = CRIT_SHAPES[weapon.family];
        const damage = weapon.damage * critDamageMultiplier(level) * (1 + shape.damageBonus);
        this.weapons.criticalStrike(weapon, shape, damage, facing);
        this.audio.play(CRIT_SHOUT[gender]);
        this.screenShake.shake(CRIT_STRIKE.shakePx, CRIT_STRIKE.shakeMs);
        this.weapons.spawnEffect('fx.crit.strike', x, y - CRIT_STRIKE.effectOffsetY);
        this.launchedCount++;
        return true;
    }
}
