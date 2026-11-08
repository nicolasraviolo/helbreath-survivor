// Helbreath Off (Fase Off-8A): las cargas del Critical Strike, como en Survivors (data/critStrike.ts): máximo
// 1 + nivel/10, +1 cada CRIT_STRIKE.rechargeMs y +1 cada CRIT_STRIKE.hitsPerCharge golpes recibidos. El reloj se para
// con las cargas llenas. Solo cuenta: el golpe lo da OffBattle. Las cargas se guardan (OffSaveStore.setCritCharges).
import { CRIT_STRIKE, maxCritCharges } from '../../data/critStrike';

export class OffCritStrike {
    private held: number;
    private rechargeMs = 0;
    private hitsTaken = 0;
    /** Strikes launched since the world opened (the HUD shows the orb pressed when it changes). */
    public launched = 0;

    constructor(
        charges: number,
        /** Called when the charges change, to save them. */
        private readonly onChange: (charges: number) => void,
    ) {
        this.held = Math.max(0, Math.floor(charges));
    }

    public get charges(): number {
        return this.held;
    }

    /** Recharges over time up to the maximum of this level. */
    public update(deltaMs: number, level: number): void {
        if (this.held >= maxCritCharges(level)) {
            this.rechargeMs = 0;
            return;
        }
        this.rechargeMs += deltaMs;
        if (this.rechargeMs < CRIT_STRIKE.rechargeMs) return;
        this.rechargeMs -= CRIT_STRIKE.rechargeMs;
        this.set(this.held + 1);
    }

    /** A blow landed on the player: every few of them give a charge, as in the original. */
    public onHurt(level: number): void {
        if (++this.hitsTaken < CRIT_STRIKE.hitsPerCharge) return;
        this.hitsTaken = 0;
        if (this.held < maxCritCharges(level)) this.set(this.held + 1);
    }

    /** Spends one charge; false when there is none. */
    public spend(): boolean {
        if (this.held <= 0) return false;
        this.launched++;
        this.set(this.held - 1);
        return true;
    }

    private set(charges: number): void {
        this.held = charges;
        this.onChange(charges);
    }
}
