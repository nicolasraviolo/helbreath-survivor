// Métricas de una partida (Fase 14A): apunta las cartas elegidas, el nivel de cada minuto, el daño recibido de cada
// monstruo, la vida más baja, los jefes (cuándo llegan, cuándo mueren y su golpe más fuerte), los FPS y quién mató al
// jugador. Al terminar arma el resumen (config/metrics.ts) y lo manda al servidor. Si el envío falla (sin internet,
// servidor caído o bloqueado) no pasa nada: la partida nunca espera ni se entera.
// Solo se envía si el jugador lo deja activado en Settings, nunca en la partida simulada y, en `pnpm dev`, solo con
// ?metrics=send (para no mezclar nuestras pruebas con las partidas de verdad).
import type Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import {
    METRICS_DAMAGE_SOURCES, METRICS_FPS_SAMPLE_MS, METRICS_URL, type RunMetricsState, type RunReport,
} from '../config/metrics';
import type { CardAction } from '../data/rerollSkip';
import type { LevelUpChoice } from '../scenes/LevelUpScene';
import { settings } from './Settings';

/** Share of the slowest FPS samples that `fpsLow` stands for (10th percentile). */
const FPS_LOW_PERCENTILE = 0.1;
const MINUTE_MS = 60_000;

export class RunMetrics {
    /** Monster whose blow killed the player. */
    public killer = '';
    private readonly state: RunMetricsState;
    private readonly fpsSamples: number[] = [];
    private sampleInMs = METRICS_FPS_SAMPLE_MS;

    constructor(private readonly game: Phaser.Game, saved: Readonly<RunMetricsState> | undefined, public readonly resumed = false) {
        this.state = {
            cards: { ...saved?.cards },
            levelByMinute: [...(saved?.levelByMinute ?? [])],
            damageBy: { ...saved?.damageBy },
            minHpPct: saved?.minHpPct ?? 100,
            bosses: (saved?.bosses ?? []).map((boss) => ({ ...boss })),
        };
    }

    /** A copy for the saved run. */
    public snapshot(): RunMetricsState {
        return {
            cards: { ...this.state.cards },
            levelByMinute: [...this.state.levelByMinute],
            damageBy: { ...this.state.damageBy },
            minHpPct: this.state.minHpPct,
            bosses: this.state.bosses.map((boss) => ({ ...boss })),
        };
    }

    public onCard(choice: LevelUpChoice): void {
        const key = cardKey(choice);
        this.state.cards[key] = (this.state.cards[key] ?? 0) + 1;
        // Fase 21½A: Rare and Epic picks, counted apart in the same table ("rarity:rare", "rarity:epic").
        if (choice.rarity !== 'common') this.state.cards[`rarity:${choice.rarity}`] = (this.state.cards[`rarity:${choice.rarity}`] ?? 0) + 1;
    }

    /** A Reroll or Skip used (Fase 21½B): counted in the cards table too ("action:reroll", "action:skip"). */
    public onCardAction(action: CardAction): void {
        const key = `action:${action}`;
        this.state.cards[key] = (this.state.cards[key] ?? 0) + 1;
    }

    /** A blow landed on the player (`damage` after armor; `hpLeft` after it). */
    public onHurt(source: string, damage: number, hpLeft: number, maxHp: number): void {
        const name = source || '?';
        this.state.damageBy[name] = (this.state.damageBy[name] ?? 0) + damage;
        this.state.minHpPct = Math.min(this.state.minHpPct, Math.round((hpLeft / maxHp) * 100));
        const boss = this.state.bosses.find((b) => b.name === source && b.killMs < 0);
        if (boss) boss.maxHit = Math.max(boss.maxHit, damage);
        if (hpLeft <= 0) this.killer = name;
    }

    public onBossSpawn(name: string, elapsedMs: number): void {
        // After Continue the bosses that were alive come back: they keep their first arrival.
        if (this.state.bosses.some((b) => b.name === name && b.killMs < 0)) return;
        this.state.bosses.push({ name, spawnMs: Math.round(elapsedMs), killMs: -1, maxHit: 0 });
    }

    public onBossDead(name: string, elapsedMs: number): void {
        const boss = this.state.bosses.find((b) => b.name === name && b.killMs < 0);
        if (boss) boss.killMs = Math.round(elapsedMs);
    }

    /** Call every frame while the run is being played (not while paused). */
    public update(deltaMs: number, elapsedMs: number, level: number): void {
        const levels = this.state.levelByMinute;
        while ((levels.length + 1) * MINUTE_MS <= elapsedMs) levels.push(level);
        if ((this.sampleInMs -= deltaMs) > 0) return;
        this.sampleInMs = METRICS_FPS_SAMPLE_MS;
        this.fpsSamples.push(this.game.loop.actualFps);
    }

    /** The end-of-run report (everything but what this class collects comes from the game scene). */
    public report(run: Omit<RunReport, keyof RunMetricsState | 'killer' | 'fpsAvg' | 'fpsLow' | 'resumed'>): RunReport {
        const samples = [...this.fpsSamples].sort((a, b) => a - b);
        const avg = samples.length ? samples.reduce((sum, fps) => sum + fps, 0) / samples.length : 0;
        const low = samples.length ? samples[Math.floor(samples.length * FPS_LOW_PERCENTILE)] : 0;
        const damageBy = Object.fromEntries(Object.entries(this.state.damageBy)
            .sort(([, a], [, b]) => b - a)
            .slice(0, METRICS_DAMAGE_SOURCES)
            .map(([name, damage]) => [name, Math.round(damage)]));
        return {
            ...run,
            ...this.snapshot(),
            damageBy,
            killer: run.result === 'death' ? this.killer : '',
            fpsAvg: Math.round(avg * 10) / 10,
            fpsLow: Math.round(low * 10) / 10,
            resumed: this.resumed,
        };
    }
}

/** True if this run's report may be sent (Settings, and only real runs: not in dev unless asked). */
export function metricsAllowed(simulated: boolean): boolean {
    if (simulated || !settings.current.anonymousStats) return false;
    return !import.meta.env.DEV || DEBUG_START.sendMetrics;
}

/** Sends the report in the background. Plain text body: the browser sends it without asking the server first. */
export function sendRunReport(report: RunReport): void {
    try {
        fetch(METRICS_URL, { method: 'POST', body: JSON.stringify(report), headers: { 'Content-Type': 'text/plain' }, keepalive: true })
            .catch(() => undefined);
    } catch {
        // No fetch, or blocked: the stats are simply not sent.
    }
}

function cardKey(choice: LevelUpChoice): string {
    switch (choice.kind) {
        case 'stat':
            return `stat:${choice.stat}`;
        case 'passive':
            return `passive:${choice.passive}`;
    }
}
