// Partida simulada (Fase 13C, solo en desarrollo: ?debug=sim, situación `levelpace` de pnpm check).
// Juega una partida entera muy deprisa para medir el equilibrio: el jugador es invencible, corre en círculos,
// elige cartas al azar y se apunta en qué segundo llega a cada nivel, cuánto quitan los golpes de los jefes
// (comparado con su vida máxima) y cuántos golpes de cada monstruo le aciertan y cuántos esquiva (Fase 18A). El informe queda en window.__sim para que lo lea el script.
import Phaser from 'phaser';
import { HP_REGEN_INTERVAL_MS } from '../data/stats';
import { RegenTicker } from './RegenTicker';

/** Game time of each sub-step (ms): like a phone at 30 FPS. */
const SIM_STEP_MS = 33;
/** Real time spent simulating per drawn frame (ms): the higher, the faster (and the fewer frames drawn). */
const SIM_BUDGET_MS = 60;
/** Turning speed of the running circle (radians per second): about 250 px of radius at the player's speed. */
const SIM_TURN_PER_S = 0.6;
/** With a boss alive the player goes to it and circles it at about this distance (px), to fight it. */
const SIM_BOSS_DISTANCE = 40;
/** If it gets no closer to the boss in this long (stuck behind something), it runs in circles for a while (ms). */
const SIM_STUCK_MS = 3000;
const SIM_GIVE_UP_MS = 6000;
/** The run stops here even if the final boss is still alive (ms of game time). */
const SIM_MAX_MS = 20 * 60000;
/** After the final boss dies, a few seconds more so its gems arrive and the last levels count (ms). */
const SIM_AFTER_FINAL_BOSS_MS = 6000;

export interface SimBossHit {
    boss: string;
    atS: number;
    damage: number;
    maxHp: number;
}

/** Blows of one monster kind that reached the player: how many landed (the rest were dodged), and their damage. */
export interface SimBlows {
    tried: number;
    landed: number;
    /** Damage before armor: of every blow, and of those that landed. */
    damageTried: number;
    damageLanded: number;
}

export interface SimReport {
    done: boolean;
    character: string;
    /** Game second when each level was reached (index 0 = level 2). */
    levels: Array<{ level: number; atS: number }>;
    /** The biggest blow of each boss (after armor), with the player's health at that moment. */
    bossHits: Record<string, SimBossHit>;
    /** Blows that reached the player, by monster name (Fase 18A: how many it dodged). */
    blows: Record<string, SimBlows>;
    /** When each boss appeared and died (game seconds). */
    bossLife: Array<{ boss: string; fromS: number; toS?: number }>;
    /** Total XP picked up by the end of each minute (index = minute). */
    xpByMinute: number[];
    /** Most enemies alive at once during each minute (index = minute). */
    aliveByMinute: number[];
    /** Share of the normal (non-boss) monsters killed by their first hit, 0..1. An Energy Bolt is 2 hits (direct + area). */
    oneHitKillShare: number;
    finalBossDeadAtS: number | undefined;
    endLevel: number;
    endS: number;
    kills: number;
    end: string;
    /** Weapon or spell, stats and cards picked, at the end. */
    build: string;
    /** Game seconds per real second. */
    speed: number;
    /**
     * Virtual health (balance review, 22-oct-2026): the player is still invincible, but the sim keeps a health bar of
     * its own with the real armor, regen, potions and hit invulnerability, to know when a real player would have died.
     * After a virtual death it starts again full (deaths counts them).
     */
    deathAtS: number | undefined;
    deathLevel: number | undefined;
    deaths: number;
    /** Lowest health share before the first death (1 = never hurt). */
    lowestHpShare: number;
    /** Damage taken after armor during each minute (index = minute), and the health it had at the end of each minute. */
    damageByMinute: number[];
    maxHpByMinute: number[];
    /** Gold picked up by the end of each minute (index = minute). */
    goldByMinute: number[];
    /** Character profile of the run (?level= and its build), if any. */
    profile: string;
    /** Potions picked up, and the health they gave (virtual health; the real one is always full). */
    potions: number;
    /** How the bot moved: 'circle' (default) or 'stand' (?bot=stand: stands still and lets the weapon work). */
    bot: string;
}

declare global {
    interface Window {
        __sim?: SimReport;
    }
}

export class SimRun {
    readonly report: SimReport;
    private angle = 0;
    private readonly move = new Phaser.Math.Vector2();
    private elapsedMs = 0;
    /** Countdown after the final boss died; undefined while it lives. */
    private afterBossMs: number | undefined;
    private readonly startedAt = performance.now();
    /** Closest it got to the boss lately, how long ago that was, and time left ignoring the boss. */
    private bossClosest = Infinity;
    private noProgressMs = 0;
    private ignoreBossMs = 0;

    /** Virtual health (-1 until the first tick), its maximum last tick, and the time left without taking hits. */
    private hp = -1;
    private maxHp = 0;
    private invulnerableMs = 0;
    /** Its self-healing comes in batches, as the real one (Player.regenerate). */
    private readonly regenTicker = new RegenTicker(HP_REGEN_INTERVAL_MS);

    constructor(character: string, private readonly invulnerabilityMs: number, private readonly bot: 'circle' | 'stand' = 'circle') {
        this.report = {
            done: false, character, levels: [], bossHits: {}, blows: {}, bossLife: [], xpByMinute: [], aliveByMinute: [], oneHitKillShare: 0, finalBossDeadAtS: undefined,
            endLevel: 1, endS: 0, kills: 0, end: '', build: '', speed: 0,
            deathAtS: undefined, deathLevel: undefined, deaths: 0, lowestHpShare: 1, damageByMinute: [], maxHpByMinute: [], goldByMinute: [], profile: '', potions: 0, bot,
        };
        window.__sim = this.report;
    }

    /** Runs as many steps as fit in the frame's budget. `step` returns false when the run is over. */
    run(step: (delta: number) => boolean): void {
        const start = performance.now();
        while (!this.report.done && performance.now() - start < SIM_BUDGET_MS) {
            this.elapsedMs += SIM_STEP_MS;
            if (this.afterBossMs !== undefined) this.afterBossMs -= SIM_STEP_MS;
            if (!step(SIM_STEP_MS) || this.stopReason) return;
        }
    }

    /**
     * Running in a wide circle, as a player would to keep the monsters behind. With a boss alive, to the boss and
     * around it (a real player goes to fight it).
     */
    nextMove(delta: number, fromX: number, fromY: number, boss: { x: number; y: number } | undefined): Phaser.Math.Vector2 {
        // ?bot=stand: never moves, as a player who stands and lets the weapon hit everything that comes.
        if (this.bot === 'stand') return this.move.set(0, 0);
        this.angle += (SIM_TURN_PER_S * delta) / 1000;
        this.ignoreBossMs = Math.max(0, this.ignoreBossMs - delta);
        if (!boss || this.ignoreBossMs > 0) return this.move.set(Math.cos(this.angle), Math.sin(this.angle));
        const dx = boss.x - fromX;
        const dy = boss.y - fromY;
        const distance = Math.hypot(dx, dy);
        // Close: sideways (around it).
        if (distance <= SIM_BOSS_DISTANCE) {
            this.bossClosest = distance;
            this.noProgressMs = 0;
            return this.move.set(-dy, dx).normalize();
        }
        // Far: straight to it, unless that has not worked for a while.
        if (distance < this.bossClosest - 1) {
            this.bossClosest = distance;
            this.noProgressMs = 0;
        } else if ((this.noProgressMs += delta) > SIM_STUCK_MS) {
            this.ignoreBossMs = SIM_GIVE_UP_MS;
            this.bossClosest = Infinity;
            this.noProgressMs = 0;
        }
        return this.move.set(dx, dy).normalize();
    }

    /** Every step: regen (in batches) and the hit invulnerability of the virtual health; it grows with the maximum, as the real one. */
    tick(delta: number, elapsedMs: number, maxHp: number, regenPerSecond: number): void {
        if (this.hp < 0) this.hp = maxHp;
        else if (maxHp > this.maxHp) this.hp += maxHp - this.maxHp;
        this.maxHp = maxHp;
        this.invulnerableMs = Math.max(0, this.invulnerableMs - delta);
        this.hp = Math.min(maxHp, this.hp + this.regenTicker.update(delta, regenPerSecond, maxHp - this.hp));
        perMinute(this.report.maxHpByMinute, elapsedMs, () => maxHp);
    }

    /** A blow that landed, after armor. False while the virtual health is invulnerable (it would not count). */
    onHurt(taken: number, elapsedMs: number, level: number): boolean {
        if (taken <= 0 || this.invulnerableMs > 0 || this.hp < 0) return false;
        this.invulnerableMs = this.invulnerabilityMs;
        this.hp -= taken;
        perMinute(this.report.damageByMinute, elapsedMs, (old) => old + taken);
        const report = this.report;
        if (report.deathAtS === undefined) report.lowestHpShare = Math.min(report.lowestHpShare, Math.max(0, this.hp) / this.maxHp);
        if (this.hp <= 0) {
            report.deaths++;
            if (report.deathAtS === undefined) {
                report.deathAtS = Math.round(elapsedMs / 1000);
                report.deathLevel = level;
            }
            this.hp = this.maxHp;
        }
        return true;
    }

    onHeal(amount: number): void {
        this.report.potions++;
        if (this.hp >= 0) this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    onGold(amount: number, elapsedMs: number): void {
        const totals = this.report.goldByMinute;
        const minute = Math.floor(elapsedMs / 60000);
        while (totals.length <= minute) totals.push(totals.at(-1) ?? 0);
        totals[minute] = (totals[minute] ?? 0) + amount;
    }

    /** Picks one of the cards at random. */
    pick<T extends { kind: string }>(choices: readonly T[]): T | undefined {
        const choice = choices[Math.floor(Math.random() * choices.length)];
        if (choice) this.cards.set(choice.kind, (this.cards.get(choice.kind) ?? 0) + 1);
        return choice;
    }

    /** How many cards of each kind were picked. */
    readonly cards = new Map<string, number>();

    onXp(amount: number, elapsedMs: number): void {
        const minute = Math.floor(elapsedMs / 60000);
        const totals = this.report.xpByMinute;
        while (totals.length <= minute) totals.push(totals.at(-1) ?? 0);
        totals[minute] = (totals[minute] ?? 0) + amount;
    }

    onAlive(alive: number, elapsedMs: number): void {
        const minute = Math.floor(elapsedMs / 60000);
        const most = this.report.aliveByMinute;
        while (most.length <= minute) most.push(0);
        most[minute] = Math.max(most[minute] ?? 0, alive);
    }

    /** A normal monster died after `hits` hits. */
    onKill(hits: number): void {
        // 0 hits: killed all at once when the final boss died; not a weapon kill.
        if (hits === 0) return;
        this.normalKills++;
        if (hits <= 1) this.oneHitKills++;
        this.report.oneHitKillShare = Math.round((this.oneHitKills / this.normalKills) * 100) / 100;
    }

    private normalKills = 0;
    private oneHitKills = 0;

    onLevel(level: number, elapsedMs: number): void {
        this.report.levels.push({ level, atS: Math.round(elapsedMs / 1000) });
    }

    onBossHit(boss: string, damage: number, maxHp: number, elapsedMs: number): void {
        const best = this.report.bossHits[boss];
        if (!best || damage / maxHp > best.damage / best.maxHp) {
            this.report.bossHits[boss] = { boss, atS: Math.round(elapsedMs / 1000), damage, maxHp };
        }
    }

    onBlow(source: string, damage: number, landed: boolean): void {
        const blows = (this.report.blows[source] ??= { tried: 0, landed: 0, damageTried: 0, damageLanded: 0 });
        blows.tried++;
        blows.damageTried += damage;
        if (landed) {
            blows.landed++;
            blows.damageLanded += damage;
        }
    }

    onBossSpawn(boss: string, elapsedMs: number): void {
        this.report.bossLife.push({ boss, fromS: Math.round(elapsedMs / 1000) });
    }

    onBossDead(boss: string, elapsedMs: number): void {
        const life = this.report.bossLife.find((b) => b.boss === boss && b.toS === undefined);
        if (life) life.toS = Math.round(elapsedMs / 1000);
    }

    onFinalBossDead(elapsedMs: number): void {
        if (this.afterBossMs !== undefined) return;
        this.report.finalBossDeadAtS = Math.round(elapsedMs / 1000);
        this.afterBossMs = SIM_AFTER_FINAL_BOSS_MS;
    }

    finish(end: string, level: number, elapsedMs: number, kills: number, build: string): void {
        if (this.report.done) return;
        this.report.build = build;
        const realS = (performance.now() - this.startedAt) / 1000;
        Object.assign(this.report, {
            done: true, end, endLevel: level, endS: Math.round(elapsedMs / 1000), kills,
            speed: Math.round((elapsedMs / 1000 / realS) * 10) / 10,
        });
    }

    /** Why the run should stop now, or undefined to go on. */
    get stopReason(): string | undefined {
        if (this.afterBossMs !== undefined && this.afterBossMs < 0) return 'final boss killed';
        if (this.elapsedMs >= SIM_MAX_MS) return 'time limit (final boss alive)';
        return undefined;
    }
}

/** Sets the value of the current minute (index = minute), filling the minutes in between with 0. */
function perMinute(list: number[], elapsedMs: number, value: (old: number) => number): void {
    const minute = Math.floor(elapsedMs / 60000);
    while (list.length <= minute) list.push(0);
    list[minute] = value(list[minute] ?? 0);
}
