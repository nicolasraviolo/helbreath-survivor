// Vigila una partida y desbloquea los logros (data/achievements.ts) en cuanto se cumple su meta (Fase 14B).
// Lo que crece (tiempo, nivel, bajas, armadura) se mira cada poco; lo que pasa de golpe (jefe muerto, ganar) lo avisa
// GameScene. Los ya conseguidos no se vuelven a mirar. En la partida simulada (?debug=sim) está apagado.
// Fase 29C: también cuenta cada monstruo muerto por tipo; los manda a AchievementStore (que los suma a los de todas las
// partidas) cada medio segundo y al salir o terminar, no a cada baja, para no escribir en el navegador a cada golpe.
import type { CharacterId } from '../data/characters';
import { ENEMIES, type EnemyDef, type EnemyId } from '../data/enemies';
import type { MapId } from '../data/maps';
import { ACHIEVEMENT_CHECK_EVERY_MS, ACHIEVEMENT_IDS, getAchievement, type AchievementDef, type AchievementGoal } from '../data/achievements';
import { achievementStore, rescueGoalMet } from './AchievementStore';

/** What the goals that grow need to know about the run. */
export interface RunProgress {
    elapsedMs: number;
    level: number;
    kills: number;
    fullArmor: boolean;
}

export class AchievementTracker {
    /** Off in the simulated run, so measuring the balance doesn't hand them out. */
    public enabled = true;
    /** Potions drunk this run (kept in the save, for "win without a potion"). */
    public potionsDrunk = 0;
    private checkInMs = 0;
    /** Kills by kind not yet sent to AchievementStore. */
    private pendingKills: Partial<Record<EnemyId, number>> = {};
    private anyPendingKill = false;

    constructor(
        private readonly character: CharacterId,
        private readonly map: MapId,
        private readonly progress: () => RunProgress,
        private readonly onUnlock: (def: AchievementDef) => void,
    ) {}

    public update(delta: number): void {
        if ((this.checkInMs -= delta) > 0) return;
        this.checkInMs = ACHIEVEMENT_CHECK_EVERY_MS;
        this.saveKills();
        const run = this.progress();
        this.unlockWhere((goal) => {
            switch (goal.kind) {
                case 'survive':
                    return run.elapsedMs >= goal.minutes * 60000;
                case 'level':
                    return run.level >= goal.level;
                case 'kills':
                    return run.kills >= goal.count;
                case 'fullArmor':
                    return run.fullArmor;
                default:
                    return false;
            }
        });
    }

    /** A monster (not a boss) died: one more of its kind for the counters that add up every run (Fase 29C). */
    public onKill(def: EnemyDef): void {
        if (!this.enabled) return;
        const id = ENEMY_ID_BY_DEF.get(def);
        if (id === undefined) return;
        this.pendingKills[id] = (this.pendingKills[id] ?? 0) + 1;
        this.anyPendingKill = true;
    }

    /** Sends the kills counted since the last time to AchievementStore, and unlocks the goals they reach. */
    public saveKills(): void {
        if (!this.anyPendingKill) return;
        achievementStore.addKills(this.pendingKills);
        this.pendingKills = {};
        this.anyPendingKill = false;
        this.unlockWhere((goal) => achievementStore.killGoalMet(goal));
    }

    /** A boss died (by its definition: every monster of a kind shares the one in ENEMIES). */
    public onBossKilled(def: EnemyDef): void {
        this.unlockWhere((goal) => goal.kind === 'killBoss' && ENEMIES[goal.enemy] === def);
    }

    /** Got up again with Abaddon's Blood (Fase 21E). */
    public onRevive(): void {
        this.unlockWhere((goal) => goal.kind === 'revive');
    }

    /** Died for good (no Abaddon's Blood left; Fase 22A). */
    public onDeath(): void {
        this.unlockWhere((goal) => goal.kind === 'die' && (goal.map === undefined || goal.map === this.map));
    }

    /** A captive was freed (Fase 29B): its achievement, and "rescue everyone" if it was the last one. */
    public onRescue(): void {
        this.unlockWhere(rescueGoalMet);
    }

    /** Escaped through the portal. */
    public onWin(): void {
        this.unlockWhere((goal) => goal.kind === 'win'
            && (goal.map === undefined || goal.map === this.map)
            && (goal.character === undefined || goal.character === this.character)
            && (!goal.noPotions || this.potionsDrunk === 0));
    }

    private unlockWhere(met: (goal: AchievementGoal) => boolean): void {
        if (!this.enabled) return;
        for (const id of ACHIEVEMENT_IDS) {
            const def = getAchievement(id);
            if (!achievementStore.has(id) && met(def.goal) && achievementStore.unlock(id)) this.onUnlock(def);
        }
    }
}

/** Every monster of a kind shares its definition in ENEMIES (Champions and elites too): definition → its id. */
const ENEMY_ID_BY_DEF = new Map<EnemyDef, EnemyId>((Object.keys(ENEMIES) as EnemyId[]).map((id) => [ENEMIES[id], id]));
