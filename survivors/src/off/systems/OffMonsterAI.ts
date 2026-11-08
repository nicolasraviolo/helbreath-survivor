// Helbreath Off (Fase Off-2): qué hace cada monstruo, una acción cada vez, como el servidor original
// (reference/Server.cpp: NpcProcess, NpcBehavior_Move, NpcBehavior_Attack, TargetSearch):
// - Una acción = un paso o un ataque. Paseando, cada acción dura su ATime; persiguiendo, ATime menos 0–700 ms al azar
//   (nunca menos de 600 ms), con los "vistazos" del servidor cada 300 ms (originalAttackIntervalMs, de Survivors).
// - Paseando: si ve al jugador a su alcance de búsqueda (cuadrado), pasa a atacar. Los que tienen ATime < 1000 solo
//   1 vez de cada 3. Los neutrales (Rabbit) no buscan: solo atacan a quien les pega.
// - Atacando: si está al lado, pega (el golpe se decide al empezar); si no, da un paso hacia él. A los 20 turnos lo deja.
// - Con poca vida y poca valentía huye 10 acciones (MONSTER_AI, ya portado en Survivors).
// - Off-7A: los que tienen magia (el Cyclops) la lanzan a veces cuando aún no te alcanzan (OFF_MONSTER_CAST).
// - Off-8B: también van a por tu mercenario (`victim`). Paseando, se fijan en el más cercano de los dos que vean; si
//   el suyo cae o se va, pasan al otro si lo ven, o vuelven a pasear. Quien les pega pasa a ser su objetivo si paseaban.
// - Off-9A: también van a por los Raiders que pasan cerca (`raider0`, `raider1`: uno por cada Raider a la vez, como
//   mucho dos), igual que a por tu mercenario. Los Raiders no les devuelven el golpe.
// Paseo entre puntos al azar de su pit: el original andaba entre waypoints del mapa; el pit nos sirve de zona.
import Phaser from 'phaser';
import type { TileRect } from '../../data/maps';
import { MONSTER_AI } from '../../data/enemies';
import { originalAttackIntervalMs } from '../../entities/Enemy';
import { OFF_COMBAT } from '../data/offCombat';
import { OFF_MONSTER_CAST } from '../data/offMonsters';
import type { OffMonster } from '../entities/OffMonster';
import { rollDice, tileDistance } from './OffCombatRules';
import { directionTowards, type TilePoint } from './TileMover';

/** Monsters with a shorter ATime only notice the player 1 time in 3 (server NpcBehavior_Move). */
const QUICK_MONSTER_ACTION_MS = 1000;
const QUICK_MONSTER_NOTICE_DIE = 3;

/** Who a monster goes for (Off-8B): the player or the player's mercenary; Off-9A: or a Raider (by its slot). */
export type OffVictim = 'player' | 'merc' | OffRaiderSlot;

/** Off-9A: one per Raider here at once (at most two, OFF_RAIDS). */
export type OffRaiderSlot = 'raider0' | 'raider1';
export const OFF_RAIDER_SLOTS: readonly OffRaiderSlot[] = ['raider0', 'raider1'];

const VICTIMS: readonly OffVictim[] = ['player', 'merc', ...OFF_RAIDER_SLOTS];

/** What a monster needs to know about the world. */
export interface OffMonsterWorld {
    /** Where that victim stands, or undefined while dead, down or not there. */
    victimTile(victim: OffVictim): TilePoint | undefined;
    /** Zone where it wanders (its pit plus a margin). */
    wanderArea(monster: OffMonster): TileRect;
    /** A tile it may walk onto. */
    isFree(x: number, y: number): boolean;
    /** Rolls whether its blow will land on its victim (decided when the attack starts). */
    rollHitOnVictim(monster: OffMonster): boolean;
    /** Its blow lands now on its victim (`lands` false: a miss). */
    monsterStrikes(monster: OffMonster, lands: boolean): void;
    /** It casts its spell at its victim's tile (Off-7A). */
    monsterCasts(monster: OffMonster, at: TilePoint): void;
}

/** Advances one monster: its step, its blow on the way, and a new action when the last one is over. */
export function updateMonster(monster: OffMonster, deltaMs: number, world: OffMonsterWorld): void {
    if (!monster.isAlive) return;
    monster.mover.update(deltaMs, monster.actionTimeMs);
    if (monster.pendingHitMs !== undefined) {
        monster.pendingHitMs -= deltaMs;
        if (monster.pendingHitMs <= 0) {
            monster.pendingHitMs = undefined;
            world.monsterStrikes(monster, monster.pendingHitLands);
        }
    }
    if (monster.mover.isMoving) return;
    monster.waitMs -= deltaMs;
    if (monster.waitMs > 0) return;
    if (monster.mode === 'wander') wander(monster, world);
    else if (monster.mode === 'attack') attack(monster, world);
    else if (monster.mode === 'flee') flee(monster, world);
}

/** It was hit (by `by`): it goes after the attacker, even if neutral (server: the attacker becomes its target). */
export function provokeMonster(monster: OffMonster, by: OffVictim = 'player'): void {
    if (monster.mode !== 'wander') return;
    monster.mode = 'attack';
    monster.victim = by;
    monster.turns = 0;
}

/** The nearest victim it can see within its search range, if any. */
function seenVictim(monster: OffMonster, world: OffMonsterWorld): OffVictim | undefined {
    const mover = monster.mover;
    let best: OffVictim | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const victim of VICTIMS) {
        const tile = world.victimTile(victim);
        if (!tile) continue;
        const distance = tileDistance(mover.tileX, mover.tileY, tile.x, tile.y);
        if (distance <= monster.def.searchRange && distance < bestDistance) {
            best = victim;
            bestDistance = distance;
        }
    }
    return best;
}

function wander(monster: OffMonster, world: OffMonsterWorld): void {
    const def = monster.def;
    if (!def.neutral && def.searchRange > 0) {
        const seen = seenVictim(monster, world);
        const notices = monster.actionTimeMs >= QUICK_MONSTER_ACTION_MS || rollDice(1, QUICK_MONSTER_NOTICE_DIE) === 1;
        if (seen && notices) {
            monster.mode = 'attack';
            monster.victim = seen;
            monster.turns = 0;
            monster.waitMs = 0;
            return;
        }
    }
    monster.waitMs = monster.actionTimeMs;
    if (Math.random() < OFF_COMBAT.wanderIdleChance) return;
    const mover = monster.mover;
    if (!monster.waypoint || (monster.waypoint.x === mover.tileX && monster.waypoint.y === mover.tileY)) {
        monster.waypoint = pickWaypoint(world.wanderArea(monster), world);
    }
    const waypoint = monster.waypoint;
    if (!waypoint) return;
    if (mover.stepToward(waypoint.x, waypoint.y, monster.actionTimeMs)) monster.waitMs = 0;
    else monster.waypoint = undefined;
}

function attack(monster: OffMonster, world: OffMonsterWorld): void {
    let player = world.victimTile(monster.victim);
    if (!player) {
        // Its victim fell or left: the other one, if it can see it.
        const other = seenVictim(monster, world);
        if (other) {
            monster.victim = other;
            player = world.victimTile(other);
        }
    }
    monster.turns++;
    if (!player || monster.turns > OFF_COMBAT.giveUpTurns) {
        monster.mode = 'wander';
        monster.waitMs = monster.actionTimeMs;
        return;
    }
    if (monster.hp <= MONSTER_AI.lowHealthHp && rollDice(1, monster.bravery) <= MONSTER_AI.braveryRoll) {
        monster.mode = 'flee';
        monster.fleeLeft = MONSTER_AI.lowHealthFleeActions;
        monster.waitMs = 0;
        return;
    }
    const interval = originalAttackIntervalMs(monster.actionTimeMs);
    const mover = monster.mover;
    if (tileDistance(mover.tileX, mover.tileY, player.x, player.y) <= monster.def.base.attackRange) {
        const towards = directionTowards(mover.tileX, mover.tileY, player.x, player.y) ?? mover.facing;
        monster.startAttack(towards, world.rollHitOnVictim(monster));
        monster.waitMs = interval;
        return;
    }
    if (monster.def.spell && Math.random() < OFF_MONSTER_CAST.chance
        && Math.abs(mover.tileX - player.x) <= OFF_MONSTER_CAST.rangeX && Math.abs(mover.tileY - player.y) <= OFF_MONSTER_CAST.rangeY) {
        monster.startCast(directionTowards(mover.tileX, mover.tileY, player.x, player.y) ?? mover.facing);
        world.monsterCasts(monster, { x: player.x, y: player.y });
        monster.waitMs = OFF_MONSTER_CAST.waitMs;
        return;
    }
    monster.waitMs = mover.stepToward(player.x, player.y, interval) ? 0 : interval;
}

function flee(monster: OffMonster, world: OffMonsterWorld): void {
    const player = world.victimTile(monster.victim);
    monster.fleeLeft--;
    if (!player || monster.fleeLeft <= 0) {
        monster.mode = player ? 'attack' : 'wander';
        monster.turns = 0;
        monster.waitMs = monster.actionTimeMs;
        return;
    }
    const moved = monster.mover.stepAwayFrom(player.x, player.y, monster.actionTimeMs);
    monster.waitMs = moved ? 0 : monster.actionTimeMs;
}

/** A free tile at random in the zone (a few tries). */
function pickWaypoint(area: TileRect, world: OffMonsterWorld): TilePoint | undefined {
    for (let i = 0; i < 8; i++) {
        const x = Phaser.Math.Between(area.x, area.x + area.width - 1);
        const y = Phaser.Math.Between(area.y, area.y + area.height - 1);
        if (world.isFree(x, y)) return { x, y };
    }
    return undefined;
}
