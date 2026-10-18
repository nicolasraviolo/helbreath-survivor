// Hechizo activo del Mago (Fase 19B): recarga y lanzamiento. Lo pide el jugador con el mismo botón que el Critical
// Strike del Guerrero (Espacio, X del mando o el botón táctil). Cae donde apunta, o sobre el objetivo automático; sin
// nada a su alcance no sale y no gasta la recarga. La recarga baja con la Mag (data/activeSpells.ts).
// Su dibujo se descarga al empezar la partida (ON_DEMAND_SPRITES): hasta que llega no se puede lanzar.
// Con `infinite` (truco ?debug=crits o la tecla H) no hay recarga: para probarlo sin esperar.
import {
    ACTIVE_SPELLS,
    activeSpellCooldownMs,
    activeSpellPowerMultiplier,
    type ActiveSpellDef,
    type ActiveSpellId,
} from '../data/activeSpells';
import type { WeaponSystem } from './WeaponSystem';

export class ActiveSpellSystem {
    public readonly def: ActiveSpellDef;
    /** Time left until it can be cast again (ms); 0 = ready. */
    private waitMs = 0;
    private castCount = 0;
    /** Debug: no recharge. */
    public infinite = false;
    /** False until its sprite is downloaded. */
    public loaded = false;

    constructor(private readonly weapons: WeaponSystem, id: ActiveSpellId) {
        this.def = ACTIVE_SPELLS[id];
    }

    public get ready(): boolean {
        return this.loaded && this.waitMs <= 0;
    }

    /** Recharge time left (ms), for the HUD and the saved run. */
    public get cooldownLeftMs(): number {
        return this.waitMs;
    }

    /** Casts so far this run: the HUD shows the icon pressed when it changes. */
    public get casts(): number {
        return this.castCount;
    }

    /** Recharge time at this Mag (stats panel). */
    public cooldownMs(mag: number): number {
        return activeSpellCooldownMs(this.def, mag);
    }

    /** Continue (saved run): the recharge it had left, within the full time at this Mag. */
    public restore(cooldownLeftMs: number, mag: number): void {
        this.waitMs = Math.max(0, Math.min(this.cooldownMs(mag), cooldownLeftMs));
    }

    public update(deltaMs: number): void {
        this.waitMs = Math.max(0, this.waitMs - deltaMs);
    }

    /** Casts it now if it is ready and has somewhere to land. Returns true if it went off. */
    public cast(level: number, mag: number): boolean {
        if (!this.loaded || (this.waitMs > 0 && !this.infinite)) return false;
        const target = this.weapons.activeSpellTarget(this.def.range, this.def.stickShare);
        if (!target) return false;
        this.weapons.castMeteor(this.def, activeSpellPowerMultiplier(level), target.x, target.y);
        if (!this.infinite) this.waitMs = this.cooldownMs(mag);
        this.castCount++;
        return true;
    }
}
