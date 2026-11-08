// Helbreath Off (Fase Off-8B): qué hace el mercenario cada frame (la misma cabeza servirá a los Raiders, Off-9).
// - Inconsciente: cuenta atrás y se levanta.
// - Muy lejos de ti (o tras cambiar de mapa): aparece a tu lado.
// - Pelea: primero con el monstruo que os ataca a ti o a él, luego con el que tú atacas, y si no, con el más cercano
//   que no sea neutral, siempre cerca de ti (OFF_MERCENARY.leashTiles). Va hasta él y le pega a su ritmo (el golpe se
//   decide al empezar y cae a mitad, como los tuyos).
// - Sin nada que pelear: si te alejas, te sigue (buscando camino como tu clic) y corre si va lejos. Quieto, se cura poco
//   a poco. Si en OFF_MERCENARY.stallMs no se acerca (tú estás en su casilla, una valla en medio), se para y lo vuelve
//   a pensar; al monstruo al que no llega lo deja un rato (ignoreMs). Nunca se queda en tu casilla.
import { OFF_COMBAT, offAttackMs } from '../data/offCombat';
import { OFF_MERCENARY } from '../data/offMercenary';
import { OFF_STEP_MS } from '../data/offWorld';
import type { OffMercenary } from '../entities/OffMercenary';
import type { OffMonster } from '../entities/OffMonster';
import { PlayerState } from '../../hb/playerAppearance';
import { isFromBehind, offHitChance, tileDistance } from './OffCombatRules';
import { directionTowards, type TilePoint } from './TileMover';

/** What the mercenary needs to know about the world. */
export interface OffMercenaryWorld {
    /** Your tile, or undefined while you are dead. */
    ownerTile(): TilePoint | undefined;
    /** The monster you are attacking, if any. */
    ownerTarget(): OffMonster | undefined;
    readonly monsters: readonly OffMonster[];
    /** A way there round houses and walls (undefined: none found). */
    findPath(from: TilePoint, to: TilePoint, maxTiles: number): TilePoint[] | undefined;
    /** It may stand there (walkable, nobody on it, not you). */
    mercCanStand(x: number, y: number): boolean;
    /** A free tile for it near that one. */
    freeTileNear(x: number, y: number): TilePoint | undefined;
    /** Its blow starts (sound). */
    mercSwings(): void;
    /** It stood up again. */
    mercStandsUp(merc: OffMercenary): void;
}

/** Advances it one frame. Returns whether its step is a run (for its pose). */
export function updateMercenary(merc: OffMercenary, deltaMs: number, world: OffMercenaryWorld): boolean {
    if (merc.isDown) {
        merc.downLeftMs = Math.max(0, merc.downLeftMs - deltaMs);
        if (merc.downLeftMs === 0) {
            merc.standUp();
            world.mercStandsUp(merc);
        }
        return false;
    }
    merc.cooldownMs = Math.max(0, merc.cooldownMs - deltaMs);
    merc.ignoredLeftMs = Math.max(0, merc.ignoredLeftMs - deltaMs);
    if (merc.ignoredLeftMs === 0) merc.ignored = undefined;
    const owner = world.ownerTile();
    const mover = merc.mover;
    const away = owner ? tileDistance(mover.tileX, mover.tileY, owner.x, owner.y) : 0;
    if (owner && away > OFF_MERCENARY.teleportTiles) {
        const tile = world.freeTileNear(owner.x, owner.y);
        if (tile) {
            mover.place(tile.x, tile.y);
            merc.target = undefined;
        }
    }
    const target = owner ? pickTarget(merc, owner, world) : undefined;
    if (target !== merc.target) resetChase(merc);
    merc.target = target;
    if (target) {
        merc.regenMs = 0;
        fight(merc, target, world, deltaMs);
    } else {
        follow(merc, owner, world, deltaMs);
        regen(merc, deltaMs);
    }
    const running = away > OFF_MERCENARY.runTiles || (target !== undefined && tileDistance(mover.tileX, mover.tileY, target.mover.tileX, target.mover.tileY) > OFF_MERCENARY.runTiles);
    if (!merc.character.isActing) mover.update(deltaMs, running ? OFF_STEP_MS.run : OFF_STEP_MS.walk);
    return mover.currentStepMs === OFF_STEP_MS.run;
}

/** The monster to fight: the one going for you or it, the one you attack, or the nearest one; all near you. */
function pickTarget(merc: OffMercenary, owner: TilePoint, world: OffMercenaryWorld): OffMonster | undefined {
    const mover = merc.mover;
    const nearOwner = (m: OffMonster) => m.isAlive && m !== merc.ignored && tileDistance(m.mover.tileX, m.mover.tileY, owner.x, owner.y) <= OFF_MERCENARY.leashTiles;
    const fromMerc = (m: OffMonster) => tileDistance(m.mover.tileX, m.mover.tileY, mover.tileX, mover.tileY);
    const current = merc.target;
    if (current && nearOwner(current) && current.mode === 'attack') return current;
    let best: OffMonster | undefined;
    for (const m of world.monsters) {
        if (nearOwner(m) && m.mode === 'attack' && (!best || fromMerc(m) < fromMerc(best))) best = m;
    }
    if (best) return best;
    const yours = world.ownerTarget();
    if (yours && nearOwner(yours)) return yours;
    if (current && nearOwner(current)) return current;
    for (const m of world.monsters) {
        if (nearOwner(m) && !m.def.neutral && fromMerc(m) <= OFF_MERCENARY.guardTiles && (!best || fromMerc(m) < fromMerc(best))) best = m;
    }
    return best;
}

function fight(merc: OffMercenary, target: OffMonster, world: OffMercenaryWorld, deltaMs: number): void {
    const mover = merc.mover;
    const range = merc.weapon.range;
    const distance = tileDistance(mover.tileX, mover.tileY, target.mover.tileX, target.mover.tileY);
    if (distance > range) {
        if (stalled(merc, distance, deltaMs)) {
            // Can't get to it (a fence, others in the way): left alone for a while.
            merc.ignored = target;
            merc.ignoredLeftMs = OFF_MERCENARY.ignoreMs;
            merc.target = undefined;
            mover.cancel();
            resetChase(merc);
            return;
        }
        if (!merc.character.isActing) mover.approach(target.mover.tileX, target.mover.tileY, range);
        return;
    }
    resetChase(merc);
    if (mover.isMoving) return;
    mover.cancel();
    if (merc.cooldownMs > 0 || merc.character.isActing || merc.blow) return;
    const direction = directionTowards(mover.tileX, mover.tileY, target.mover.tileX, target.mover.tileY) ?? mover.facing;
    mover.face(direction);
    const lands = Math.random() < offHitChance(merc.hitRatio, target.def.base.defenseRatio, isFromBehind(direction, target.mover.facing));
    const attackMs = offAttackMs(merc.weapon, merc.stats.str);
    merc.character.act(PlayerState.Melee, direction, attackMs);
    merc.cooldownMs = attackMs;
    merc.blow = { monster: target, lands, leftMs: attackMs * OFF_COMBAT.hitShare };
    world.mercSwings();
}

/** Back to you when you are far; it stops a couple of tiles away. */
function follow(merc: OffMercenary, owner: TilePoint | undefined, world: OffMercenaryWorld, deltaMs: number): void {
    const mover = merc.mover;
    if (!owner) return;
    const gap = tileDistance(mover.tileX, mover.tileY, owner.x, owner.y);
    if (mover.isTravelling) {
        // Arrived next to you, its tile taken (you stopped on it) or not getting closer: it stops and thinks again.
        const goal = mover.goal;
        const taken = goal !== undefined && !world.mercCanStand(goal.x, goal.y) && (goal.x !== mover.tileX || goal.y !== mover.tileY);
        if ((gap <= OFF_MERCENARY.followStopTiles && gap > 0) || taken || stalled(merc, gap, deltaMs)) {
            mover.cancel();
            resetChase(merc);
        }
        return;
    }
    resetChase(merc);
    if (gap === 0) {
        // On your tile (you walked onto it): one step aside.
        const aside = world.freeTileNear(owner.x, owner.y);
        if (aside) mover.goTo(aside.x, aside.y);
        return;
    }
    if (gap <= OFF_MERCENARY.followTiles) return;
    const goal = world.freeTileNear(owner.x, owner.y);
    if (!goal) return;
    const path = world.findPath({ x: mover.tileX, y: mover.tileY }, goal, OFF_MERCENARY.pathMaxTiles);
    if (path && path.length > 0) mover.goAlong(path.slice(0, Math.max(1, path.length - OFF_MERCENARY.followStopTiles + 1)));
    else mover.approach(owner.x, owner.y, OFF_MERCENARY.followStopTiles);
}

/** True once it has gone OFF_MERCENARY.stallMs without getting a tile closer to where it is going. */
function stalled(merc: OffMercenary, gap: number, deltaMs: number): boolean {
    if (gap < merc.chaseBest) {
        merc.chaseBest = gap;
        merc.chaseStallMs = 0;
        return false;
    }
    merc.chaseStallMs += deltaMs;
    return merc.chaseStallMs >= OFF_MERCENARY.stallMs;
}

function resetChase(merc: OffMercenary): void {
    merc.chaseBest = Number.POSITIVE_INFINITY;
    merc.chaseStallMs = 0;
}

/** Out of a fight, a little health every OFF_MERCENARY.regenMs. */
function regen(merc: OffMercenary, deltaMs: number): void {
    if (merc.hp >= merc.maxHp) {
        merc.regenMs = 0;
        return;
    }
    merc.regenMs += deltaMs;
    if (merc.regenMs < OFF_MERCENARY.regenMs) return;
    merc.regenMs = 0;
    merc.hp = Math.min(merc.maxHp, merc.hp + Math.max(1, Math.round(merc.maxHp * OFF_MERCENARY.regenShare)));
}
