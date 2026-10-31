// Regeneración por tandas, como el servidor original (CGame::TimeHitPointsUp / TimeManaPointsUp, reference/Server.cpp):
// la vida y el maná no suben poco a poco, sino de golpe cada cierto tiempo (vida 15 s, maná 20 s; data/stats.ts).
// El reloj corre siempre, también con la barra llena; si al llegar la tanda no falta nada, no se suma nada.
// Cada tanda trae lo que se habría recuperado en ese rato (puntos/segundo × intervalo), en puntos enteros: la parte
// con decimales se guarda para la siguiente, así que la media es la misma que la de antes.

export class RegenTicker {
    /** Time since the last batch. */
    private waitedMs = 0;
    /** Fraction of a point left over from the last batches. */
    private carry = 0;

    constructor(private readonly intervalMs: number) {}

    /**
     * Advances the clock. Returns the whole points of the batch when one is due and something is `missing`, else 0.
     * The caller caps it at the maximum.
     */
    public update(deltaMs: number, perSecond: number, missing: number): number {
        this.waitedMs += deltaMs;
        if (this.waitedMs < this.intervalMs) return 0;
        this.waitedMs %= this.intervalMs;
        if (missing <= 0) {
            this.carry = 0;
            return 0;
        }
        this.carry += (perSecond * this.intervalMs) / 1000;
        const whole = Math.floor(this.carry);
        this.carry -= whole;
        return whole;
    }
}
