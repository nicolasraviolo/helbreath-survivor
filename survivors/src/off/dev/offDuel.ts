// Helbreath Off (Fase Off-9C): peleas de prueba contra Raiders. Solo desarrollo: la usa `pnpm check offduel*`; el
// juego no. Un jugador "de mentira" pelea varias veces seguidas contra la misma clase de incursión y se mide cada
// pelea: si gana o muere, cuánto tarda, la vida más baja, pociones bebidas, críticos y parálisis que recibe.
// Juega como una persona normal: pega al Raider más cercano que ve, usa Critical Strike cuando tiene carga y bebe la
// poción de vida más grande por debajo de `drinkBelow`, como mucho una cada DUEL_DRINK_EVERY_MS (una persona pulsando). Entre peleas vuelve a estar entero, con sus pociones.
// Va en tiempo de juego (también con ?offfast), no en tiempo real.
import { isOffGoodId } from '../data/offGoods';
import type { OffBagItemKey } from '../data/offItems';
import type { OffBattle } from '../systems/OffBattle';
import { offSaveStore } from '../systems/OffSaveStore';

export type OffDuelKind = 'warrior' | 'mage' | 'pair';

export interface OffDuelSetup {
    kind: OffDuelKind;
    invisible: boolean;
    fights: number;
    /** Drinks under this share of its health. */
    drinkBelow: number;
    /** A fight that lasts longer than this (s, game time) counts as a draw. */
    maxSeconds: number;
}

export interface OffDuelFight {
    result: 'won' | 'died' | 'draw';
    seconds: number;
    minHpPct: number;
    drunk: number;
    critsTaken: number;
    held: number;
    raiderFlees: number;
    /** Health you took off them, and they off you, per second. */
    dealtPerS: number;
    takenPerS: number;
    /** The most monsters after you at once (they should stay out of it). */
    monsters: number;
}

export interface OffDuelReport {
    kind: string;
    level: number;
    fights: number;
    died: number;
    draws: number;
    avgSeconds: number;
    avgMinHpPct: number;
    avgDrunk: number;
    avgCritsTaken: number;
    avgHeld: number;
    avgDealtPerS: number;
    avgTakenPerS: number;
    list: string[];
    /** Where it went if it left the place (and the test ended there). */
    left?: string;
}

/** What the duel needs from the world scene. */
export interface OffDuelHost {
    readonly battle: OffBattle;
    fightRaider(): void;
    /** Where it is: leaving the place (a gate) ends the test. */
    place(): string;
}

/** A person presses the potion key at most this often (ms); the game itself has no wait between potions. */
const DUEL_DRINK_EVERY_MS = 400;
/** Between fights (ms): a little pause so the last one's leftovers are gone. */
const DUEL_PAUSE_MS = 1500;

export class OffDuel {
    private readonly results: OffDuelFight[] = [];
    private readonly bag: OffBagItemKey[];
    private fight: { ms: number; minHp: number; drunk: number; crits: number; held: number; heldNow: boolean; flees: number; dealt: number; taken: number; lastHp: number; raiderHp: Map<object, number>; drinkWaitMs: number; monsters: number } | undefined;
    private pauseMs = DUEL_PAUSE_MS;

    constructor(
        private readonly host: OffDuelHost,
        private readonly setup: OffDuelSetup,
        private readonly done: (report: OffDuelReport) => void,
    ) {
        this.bag = [...offSaveStore.character.bag];
        this.startPlace = host.place();
        this.startTile = host.battle.playerTile();
        this.start = { exp: host.battle.exp, level: host.battle.level, points: host.battle.points };
    }

    /** Experience and level as it began: every fight at the same level (killing Raiders gives experience). */
    private readonly start: { exp: number; level: number; points: number };

    private readonly startPlace: string;
    /** Every fight starts here (chasing one that ran can take you far). */
    private readonly startTile: { x: number; y: number } | undefined;

    /** One step of game time; false once every fight is over (and the report sent). */
    public update(deltaMs: number): boolean {
        const battle = this.host.battle;
        if (this.host.place() !== this.startPlace) {
            this.done({ ...this.report(), left: this.host.place() });
            return false;
        }
        if (!this.fight) {
            this.pauseMs -= deltaMs;
            if (this.pauseMs > 0) return true;
            if (this.results.length >= this.setup.fights) {
                this.done(this.report());
                return false;
            }
            this.begin();
            return true;
        }
        const fight = this.fight;
        fight.ms += deltaMs;
        if (!battle.dead) {
            fight.minHp = Math.min(fight.minHp, battle.hp / battle.maxHp);
            fight.drinkWaitMs -= deltaMs;
            if (fight.drinkWaitMs <= 0 && battle.hp < battle.maxHp * this.setup.drinkBelow && battle.drinkQuick('hp').done) {
                fight.drunk++;
                fight.drinkWaitMs = DUEL_DRINK_EVERY_MS;
            }
            const raider = battle.raiders[0];
            if (raider && !battle.target) this.host.fightRaider();
            if (raider && battle.critStrike.charges > 0) battle.critPressed();
            if (battle.isHeld && !fight.heldNow) fight.held++;
            fight.heldNow = battle.isHeld;
            fight.monsters = Math.max(fight.monsters, battle.pits.monsters.filter((m) => m.isAlive && m.mode === 'attack' && m.victim === 'player').length);
            for (const r of battle.debugRaiderList()) {
                fight.crits = Math.max(fight.crits, r.crits);
                fight.flees = Math.max(fight.flees, r.flees);
            }
        }
        fight.taken += Math.max(0, fight.lastHp - (battle.dead ? 0 : battle.hp));
        fight.lastHp = battle.dead ? 0 : battle.hp;
        for (const r of battle.debugRaiderList()) {
            const before = fight.raiderHp.get(r) ?? r.hp;
            const now = r.isAlive ? r.hp : 0;
            fight.dealt += Math.max(0, before - now);
            fight.raiderHp.set(r, now);
        }
        const gone = battle.debugRaiderList().every((r) => !r.isAlive);
        const result = battle.dead ? 'died' : gone ? 'won' : fight.ms / 1000 >= this.setup.maxSeconds ? 'draw' : undefined;
        if (!result) return true;
        this.results.push({ result, seconds: Math.round(fight.ms / 1000), minHpPct: battle.dead ? 0 : Math.round(fight.minHp * 100), drunk: fight.drunk, critsTaken: fight.crits, held: fight.held, raiderFlees: fight.flees, dealtPerS: Math.round(fight.dealt / Math.max(1, fight.ms / 1000)), takenPerS: Math.round(fight.taken / Math.max(1, fight.ms / 1000)), monsters: fight.monsters });
        this.fight = undefined;
        this.pauseMs = DUEL_PAUSE_MS;
        battle.debugEndRaid();
        return true;
    }

    private begin(): void {
        const battle = this.host.battle;
        battle.exp = this.start.exp;
        battle.level = this.start.level;
        battle.points = this.start.points;
        battle.debugFreshStart(this.startTile);
        this.refillBag();
        if (!battle.startRaid(this.setup.kind, this.setup.invisible)) {
            this.pauseMs = DUEL_PAUSE_MS;
            return;
        }
        this.fight = { ms: 0, minHp: 1, drunk: 0, crits: 0, held: 0, heldNow: false, flees: 0, dealt: 0, taken: 0, lastHp: battle.hp, raiderHp: new Map(), drinkWaitMs: 0, monsters: 0 };
    }

    /** The potions drunk come back (the bag as it started). */
    private refillBag(): void {
        const now = [...offSaveStore.character.bag];
        for (const key of this.bag) {
            const at = now.indexOf(key);
            if (at >= 0) now.splice(at, 1);
            else if (isOffGoodId(key)) offSaveStore.addToBag(key);
        }
    }

    public report(): OffDuelReport {
        const list = this.results;
        const avg = (pick: (f: OffDuelFight) => number): number => (list.length ? Math.round((list.reduce((sum, f) => sum + pick(f), 0) / list.length) * 10) / 10 : 0);
        const lived = list.filter((f) => f.result !== 'died');
        return {
            kind: `${this.setup.kind}${this.setup.invisible ? ' invisible' : ''}`,
            level: this.host.battle.level,
            fights: list.length,
            died: list.filter((f) => f.result === 'died').length,
            draws: list.filter((f) => f.result === 'draw').length,
            avgSeconds: avg((f) => f.seconds),
            avgMinHpPct: lived.length ? Math.round(lived.reduce((sum, f) => sum + f.minHpPct, 0) / lived.length) : 0,
            avgDrunk: avg((f) => f.drunk),
            avgCritsTaken: avg((f) => f.critsTaken),
            avgHeld: avg((f) => f.held),
            avgDealtPerS: avg((f) => f.dealtPerS),
            avgTakenPerS: avg((f) => f.takenPerS),
            list: list.map((f) => `${f.result} ${f.seconds}s min ${f.minHpPct}% drank ${f.drunk} crits ${f.critsTaken} held ${f.held} flees ${f.raiderFlees} dealt/s ${f.dealtPerS} taken/s ${f.takenPerS}${f.monsters ? ` MONSTERS ${f.monsters}` : ''}`),
        };
    }
}
