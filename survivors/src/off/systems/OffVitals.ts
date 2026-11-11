// Helbreath Off (Fase Off-3B): maná y estamina del personaje y las tandas de recuperación de vida, maná y estamina,
// como el servidor original (fórmulas en off/data/offCharacter.ts). La vida la lleva OffBattle (los golpes); aquí solo
// se le suma la tanda. Off-7B: los atributos HP / MP / SP Recovery del equipo agrandan cada tanda. Cada reloj corre siempre; si al llegar la tanda no falta nada, no pasa nada.
// El maná aún no se gasta: las magias llegan en la Off-6.
import {
    OFF_REGEN,
    OFF_REGEN_TEXT,
    OFF_PLAYER_INFINITE_STAMINA,
    OFF_RUN_STEP_STAMINA,
    offHpRegen,
    offManaRegen,
    offMaxMana,
    offMaxStamina,
    offStaminaRegen,
    type OffStats,
} from '../data/offCharacter';
import type { OffAttributeEffects } from '../data/offAttributes';

/** What the vitals need from the fight: the health they top up, the level and whether the character is dead. */
export interface OffVitalsOwner {
    hp: number;
    readonly maxHp: number;
    readonly level: number;
    readonly dead: boolean;
    readonly stats: Readonly<OffStats>;
    /** What the worn gear's attributes add (Off-7B: HP / MP / SP Recovery make each batch bigger). */
    readonly gearEffects: Readonly<OffAttributeEffects>;
}

export class OffVitals {
    public mana = 0;
    public stamina = 0;
    private hpWaitMs = 0;
    private manaWaitMs = 0;
    private staminaWaitMs = 0;

    constructor(
        private readonly owner: OffVitalsOwner,
        /** A line for the bottom-left list ("HP has been increased by +N points."). */
        private readonly announce: (line: string) => void,
    ) {
        this.fill();
    }

    public get maxMana(): number {
        return offMaxMana({ ...this.owner.stats, level: this.owner.level });
    }

    public get maxStamina(): number {
        return offMaxStamina({ ...this.owner.stats, level: this.owner.level });
    }

    /** Level up and coming back to life: mana and stamina full (the fight fills the health). */
    public fill(): void {
        this.mana = this.maxMana;
        this.stamina = this.maxStamina;
    }

    /** A running step: false (and nothing spent) when there is no stamina left, so the step is walked. */
    public spendRunStep(): boolean {
        if (OFF_PLAYER_INFINITE_STAMINA) return true;
        if (this.stamina < OFF_RUN_STEP_STAMINA) return false;
        this.stamina -= OFF_RUN_STEP_STAMINA;
        return true;
    }

    public get canRun(): boolean {
        return OFF_PLAYER_INFINITE_STAMINA || this.stamina >= OFF_RUN_STEP_STAMINA;
    }

    public update(deltaMs: number): void {
        const owner = this.owner;
        // Stats may grow in the Character window: never above the new maximum, never below it either.
        this.mana = Math.min(this.mana, this.maxMana);
        this.stamina = OFF_PLAYER_INFINITE_STAMINA ? this.maxStamina : Math.min(this.stamina, this.maxStamina);
        if (owner.dead) return;
        const stats = owner.stats;
        this.hpWaitMs += deltaMs;
        if (this.hpWaitMs >= OFF_REGEN.hpIntervalMs) {
            this.hpWaitMs %= OFF_REGEN.hpIntervalMs;
            const gained = topUp(owner.hp, owner.maxHp, boosted(offHpRegen(stats.vit), owner.gearEffects.hpRecovery));
            if (gained > 0) {
                owner.hp += gained;
                this.announce(OFF_REGEN_TEXT.hpUp(gained));
            }
        }
        this.manaWaitMs += deltaMs;
        if (this.manaWaitMs >= OFF_REGEN.manaIntervalMs) {
            this.manaWaitMs %= OFF_REGEN.manaIntervalMs;
            const gained = topUp(this.mana, this.maxMana, boosted(offManaRegen(stats.mag), owner.gearEffects.mpRecovery));
            if (gained > 0) {
                this.mana += gained;
                this.announce(OFF_REGEN_TEXT.mpUp(gained));
            }
        }
        this.staminaWaitMs += deltaMs;
        if (this.staminaWaitMs >= OFF_REGEN.staminaIntervalMs) {
            this.staminaWaitMs %= OFF_REGEN.staminaIntervalMs;
            const gained = topUp(this.stamina, this.maxStamina, boosted(offStaminaRegen(stats.vit, owner.level), owner.gearEffects.spRecovery));
            if (gained > 0) {
                this.stamina += gained;
                this.announce(OFF_REGEN_TEXT.spUp(gained));
            }
        }
    }
}

/** A batch with a Recovery attribute's share on top (Off-7B). */
function boosted(batch: number, share: number | undefined): number {
    return Math.floor(batch * (1 + (share ?? 0)));
}

/** What a batch really adds: never past the maximum. */
function topUp(value: number, max: number, batch: number): number {
    return Math.max(0, Math.min(batch, max - value));
}
