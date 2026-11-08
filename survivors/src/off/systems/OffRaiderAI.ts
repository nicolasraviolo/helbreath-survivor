// Helbreath Off (Fase Off-9A): qué hace un Raider cada frame. Es la cabeza del mercenario (OffMercenaryAI) puesta del
// otro lado: usa sus mismas piezas (tandas de vida, su poción, las magias que sabe con su INT, atascarse) y sus números
// (OFF_MERCENARY_CASTER, _POTION, _FLEE), pero en vez de seguirte, viene a por ti.
// - Su víctima (`victim`): tú o tu mercenario. Se queda con la que tiene mientras siga en pie; si cae, pasa a la otra.
//   Los monstruos que le pegan no le distraen (propietario, 8-nov-2026). Que tu mercenario le pegue puede hacer que se
//   vuelva contra él (OffBattle, OFF_RAIDER.switchChance), como el "tanque" con los monstruos.
// - Guerrero: va hasta ella (buscando camino si está lejos) y le pega a su ritmo; el golpe se decide al empezar y cae
//   a mitad, como los tuyos.
// - Mago (propietario, 8-nov-2026: no se queda quieto mientras le pegan): si te acercas a OFF_RAIDER_MAGE.keepAwayTiles
//   corre retreatTiles lejos (mientras tenga estamina; si estaba preparando, la deja) y luego lanza desde castTiles,
//   sin acercarse más; se cura con poca vida y lanza su magia de daño más fuerte guardando maná para curarse (sin
//   Defense Shield, propietario 9-nov-2026: los magos no pierden el tiempo) (OffSpells.releaseAt: la batalla pone el daño). Si le
//   pegan mientras prepara, la pierde (OffSpells.interrupt). Huye antes que el Guerrero (fleeBelow), aunque tenga maná.
// - Sin poción (y el Mago sin maná para curarse), con poca vida huye lejos de ti y de tu mercenario; vuelve a pelear
//   curado o tras un rato sin que nadie le persiga.
// - Mago, parálisis (propietario, 9-nov-2026: "paralizan y atacan de lejos o se curan"): si sabe Paralyze o Hold
//   Person, te la lanza primero en cuanto te tiene a tiro; mientras estás quieto se aleja, se cura con más ganas
//   (heldHealBelow) y te lanza magias de daño (en una persona no la quitan). Otra parálisis, holdEveryMs después.
// - Guerrero, Critical Strike (propietario: esencial): cargas como las tuyas (OffCritStrike); con una, el golpe es
//   crítico OFF_RAIDER_CRIT.chance de las veces, y siempre si a su víctima le queda poca vida.
// - Quieto por Hold Person / Paralyze: no hace nada.
// - Estamina como la tuya (propietario, 8-nov-2026): correr gasta 1 por casilla y sin ella anda. Solo empieza a huir con
//   OFF_RAIDER.fleeMinStamina, y si se queda sin aire o lleva fleeMaxMs huyendo, se da la vuelta y pelea (y no vuelve
//   a huir en fleeAgainMs).
import { DIRECTION_COUNT, type Direction } from '../../hb/directions';
import { PlayerState } from '../../hb/playerAppearance';
import { OFF_COMBAT, OFF_CRIT_STRIKE, offAttackMs } from '../data/offCombat';
import { OFF_MERCENARY_CASTER, OFF_MERCENARY_FLEE, offMercenarySpells } from '../data/offMercenary';
import { OFF_RAIDER, OFF_RAIDER_CRIT, OFF_RAIDER_MAGE } from '../data/offRaiders';
import { OFF_SPELLS, type OffSpellDef, type OffSpellId } from '../data/offSpells';
import { OFF_STEP_MS } from '../data/offWorld';
import { OFF_REGEN, offStaminaRegen } from '../data/offCharacter';
import type { OffMercenary, OffRaidVictim } from '../entities/OffMercenary';
import { isFromBehind, offHitChance, tileDistance } from './OffCombatRules';
import { bestHeal, canCast, canCastKeeping, drinkPotion, regenBatch, resetChase, startCast, type OffMercenaryWorld } from './OffMercenaryAI';
import { directionOffset, directionTowards, type TilePoint } from './TileMover';

const VICTIMS: readonly OffRaidVictim[] = ['player', 'merc'];

/** What a Raider needs to know about the world. */
export interface OffRaiderWorld extends Pick<OffMercenaryWorld, 'findPath' | 'mercSwings' | 'mercHeals'> {
    /** Where that victim stands, or undefined while dead, down or not there. */
    raidVictimTile(victim: OffRaidVictim): TilePoint | undefined;
    /** Where its body is drawn (a spell flies there). */
    raidVictimBody(victim: OffRaidVictim): { x: number; y: number } | undefined;
    /** Where it looks (a blow from behind) and its defence. */
    raidVictimFacing(victim: OffRaidVictim): Direction;
    raidVictimDefense(victim: OffRaidVictim): number;
    /** It may stand there (walkable, nobody on it). */
    raiderCanStand(raider: OffMercenary, x: number, y: number): boolean;
    /** Its spell arrives, aimed at that tile (who is on or near it gets hurt; a hold takes its victim). */
    raiderSpellLands(raider: OffMercenary, def: OffSpellDef, hit: number, at: TilePoint, victim: OffRaidVictim): void;
    /** How long that victim stays held (0: free), and its share of health. */
    raidVictimHeldMs(victim: OffRaidVictim): number;
    raidVictimHpShare(victim: OffRaidVictim): number;
    /** A Warrior launches a Critical Strike (its shout and sparks). */
    raiderCrits(raider: OffMercenary): void;
}

/** Advances it one frame. Returns whether its step is a run (for its pose). */
export function updateRaider(raider: OffMercenary, deltaMs: number, world: OffRaiderWorld): boolean {
    raider.potionLeftMs = Math.max(0, raider.potionLeftMs - deltaMs);
    const mover = raider.mover;
    if (!raider.isAlive) return false;
    raider.cooldownMs = Math.max(0, raider.cooldownMs - deltaMs);
    if (raider.isHeld) {
        // Held: it only finishes the step it was taking.
        mover.update(deltaMs, OFF_STEP_MS.walk);
        return false;
    }
    regenBatch(raider, deltaMs, world);
    regenStamina(raider, deltaMs);
    drinkPotion(raider, world);
    const victim = pickVictim(raider, world);
    const at = victim ? world.raidVictimTile(victim) : undefined;
    if (!victim || !at) {
        mover.update(deltaMs, OFF_STEP_MS.walk);
        return false;
    }
    if (keepsFleeing(raider, world, deltaMs)) {
        flee(raider, world, deltaMs);
        if (!raider.character.isActing) mover.update(deltaMs, pace(raider, true));
        return mover.currentStepMs === OFF_STEP_MS.run;
    }
    if (raider.isCaster) castFight(raider, victim, at, world, deltaMs);
    else fight(raider, victim, at, world, deltaMs);
    const running = raider.retreating || tileDistance(mover.tileX, mover.tileY, at.x, at.y) > OFF_RAIDER.runTiles;
    if (!raider.character.isActing) mover.update(deltaMs, pace(raider, running));
    return mover.currentStepMs === OFF_STEP_MS.run;
}

/** A run only while it has stamina for it (each running step costs it, OffMercenary.mover.onStep). */
function pace(raider: OffMercenary, run: boolean): number {
    return run && raider.canRun ? OFF_STEP_MS.run : OFF_STEP_MS.walk;
}

/** A player's batch of stamina every OFF_REGEN.staminaIntervalMs (1d(VIT/3) and the low-level bonus). */
function regenStamina(raider: OffMercenary, deltaMs: number): void {
    raider.staminaWaitMs += deltaMs;
    if (raider.staminaWaitMs < OFF_REGEN.staminaIntervalMs) return;
    raider.staminaWaitMs %= OFF_REGEN.staminaIntervalMs;
    raider.stamina = Math.min(raider.maxStamina, raider.stamina + offStaminaRegen(raider.stats.vit, raider.level));
}

/** Its victim while it stands; the other one when it falls. */
function pickVictim(raider: OffMercenary, world: OffRaiderWorld): OffRaidVictim | undefined {
    if (world.raidVictimTile(raider.victim)) return raider.victim;
    const other = VICTIMS.find((v) => v !== raider.victim && world.raidVictimTile(v));
    if (other) {
        raider.victim = other;
        raider.raidBlow = undefined;
        resetChase(raider);
    }
    return other;
}

/** Walks to `range` tiles of the victim: a way round walls when far, straight on when close. */
function chase(raider: OffMercenary, at: TilePoint, range: number, world: OffRaiderWorld, deltaMs: number): void {
    const mover = raider.mover;
    if (raider.character.isActing) return;
    raider.repathMs -= deltaMs;
    const distance = tileDistance(mover.tileX, mover.tileY, at.x, at.y);
    if (distance <= OFF_RAIDER.runTiles + range) {
        mover.approach(at.x, at.y, range);
        return;
    }
    if (mover.isTravelling && raider.repathMs > 0) return;
    raider.repathMs = OFF_RAIDER.repathMs;
    const path = world.findPath({ x: mover.tileX, y: mover.tileY }, at, OFF_RAIDER.pathMaxTiles);
    if (path && path.length > 0) mover.goAlong(path.slice(0, Math.max(1, path.length - range)));
    else mover.approach(at.x, at.y, range);
}

function fight(raider: OffMercenary, victim: OffRaidVictim, at: TilePoint, world: OffRaiderWorld, deltaMs: number): void {
    const mover = raider.mover;
    const range = raider.weapon.range;
    const distance = tileDistance(mover.tileX, mover.tileY, at.x, at.y);
    if (distance > range) {
        chase(raider, at, range, world, deltaMs);
        return;
    }
    if (mover.isMoving) return;
    mover.cancel();
    if (raider.cooldownMs > 0 || raider.character.isActing || raider.raidBlow) return;
    const direction = directionTowards(mover.tileX, mover.tileY, at.x, at.y) ?? mover.facing;
    mover.face(direction);
    const behind = isFromBehind(direction, world.raidVictimFacing(victim));
    // A Critical Strike (the owner, 8-nov-2026: essential): now and then with a charge, always to finish its victim off.
    const crits = OFF_RAIDER_CRIT;
    const crit = (raider.crit?.charges ?? 0) > 0
        && (Math.random() < crits.chance || world.raidVictimHpShare(victim) < crits.finishBelow) && (raider.crit?.spend() ?? false);
    const hitRatio = raider.hitRatio + (crit ? OFF_CRIT_STRIKE.hitBonus : 0);
    const lands = Math.random() < offHitChance(hitRatio, world.raidVictimDefense(victim), behind);
    const attackMs = offAttackMs(raider.weapon, raider.stats.str);
    raider.character.act(PlayerState.Melee, direction, attackMs);
    raider.cooldownMs = attackMs;
    raider.raidBlow = { victim, lands, leftMs: attackMs * OFF_COMBAT.hitShare, crit };
    // Off-9B: its first blow shows it, if it came invisible.
    raider.reveal();
    world.mercSwings();
    if (crit) {
        raider.crits++;
        world.raiderCrits(raider);
    }
}

// ---- The Mage ----

function castFight(raider: OffMercenary, victim: OffRaidVictim, at: TilePoint, world: OffRaiderWorld, deltaMs: number): void {
    const mover = raider.mover;
    const caster = OFF_MERCENARY_CASTER;
    const mage = OFF_RAIDER_MAGE;
    const distance = tileDistance(mover.tileX, mover.tileY, at.x, at.y);
    raider.retreatWaitMs = Math.max(0, raider.retreatWaitMs - deltaMs);
    raider.holdWaitMs = Math.max(0, raider.holdWaitMs - deltaMs);
    const held = world.raidVictimHeldMs(victim) > 0;
    // You come up to it while it prepares a spell: it drops the spell and gets away (the owner, 9-nov-2026: a mage
    // never stands there to be hit), while it has stamina to run.
    const spells = raider.spells;
    if (spells?.state === 'preparing' && !held && distance <= mage.keepAwayTiles && raider.retreatWaitMs === 0 && raider.canRun) {
        spells.cancel();
        raider.raidCast = undefined;
    }
    if (castInProgress(raider, world)) return;
    if (raider.retreating) {
        if (mover.isTravelling) return;
        raider.retreating = false;
    }
    // You too close: first away (running, while it has stamina; at once if you are held), then the spell. Without
    // stamina it stands and casts.
    if (distance <= mage.keepAwayTiles && (raider.retreatWaitMs === 0 || held) && raider.canRun && !raider.character.isActing
        && runAway(raider, world, mage.retreatTiles)) {
        raider.retreating = true;
        raider.retreats++;
        raider.retreatWaitMs = mage.retreatEveryMs;
        return;
    }
    // While you are held it heals more readily: it uses the time.
    const heal = bestHeal(raider);
    if (heal && raider.hp / Math.max(1, raider.maxHp) < (held ? mage.heldHealBelow : caster.healBelow)) {
        if (raiderCast(raider, heal, undefined)) raider.raidCast = 'self';
        return;
    }
    // Paralyze (or Hold Person) first, as mages do (the owner, 8-nov-2026), when it knows one and you are in reach.
    const hold = held || raider.holdWaitMs > 0 ? undefined : bestHold(raider);
    if (hold && distance <= mage.castTiles && !mover.isMoving) {
        mover.cancel();
        if (raiderCast(raider, hold, at)) raider.raidCast = victim;
        return;
    }
    // From afar, never at your side (it only comes as close as castTiles); no Defense Shield: it doesn't waste the time.
    if (distance > mage.castTiles) {
        chase(raider, at, mage.castTiles, world, deltaMs);
        return;
    }
    if (mover.isMoving) return;
    mover.cancel();
    // While you are held it attacks from afar (spells don't free a person, OFF_HOLD.personMs).
    const spell = bestDamage(raider);
    if (spell && raiderCast(raider, spell, at)) raider.raidCast = victim;
}

/** Starts a spell (on `at`, or itself); Off-9B: a spell shows it, if it came invisible. */
function raiderCast(raider: OffMercenary, spell: OffSpellId, at: TilePoint | undefined): boolean {
    if (!startCast(raider, spell, undefined, at)) return false;
    raider.reveal();
    return true;
}

/** Paralyze if it knows it and has the mana, else Hold Person (none: undefined). */
function bestHold(raider: OffMercenary): OffSpellId | undefined {
    if (canCast(raider, 'paralyze')) return 'paralyze';
    return canCast(raider, 'holdPerson') ? 'holdPerson' : undefined;
}

/** Preparing: waits. Ready: casts it on itself or at its victim. True while busy. */
function castInProgress(raider: OffMercenary, world: OffRaiderWorld): boolean {
    const spells = raider.spells;
    if (!spells?.busy) return false;
    if (spells.state === 'preparing') return true;
    const goal = raider.raidCast;
    raider.raidCast = undefined;
    const id = spells.spell;
    const before = spells.casts;
    if (goal === 'self') {
        spells.release(raider.x, raider.y, undefined);
    } else {
        const body = goal ? world.raidVictimBody(goal) : undefined;
        const tile = goal ? world.raidVictimTile(goal) : undefined;
        if (goal && body && tile) {
            const at = { x: tile.x, y: tile.y };
            spells.releaseAt(body.x, body.y, (def, hit) => world.raiderSpellLands(raider, def, hit, at, goal));
        } else {
            spells.cancel();
        }
    }
    if (id !== undefined && spells.casts > before) raider.castCount[id] = (raider.castCount[id] ?? 0) + 1;
    return false;
}

/** Its strongest damage spell that keeps mana for a Heal. */
function bestDamage(raider: OffMercenary): OffSpellId | undefined {
    let best: OffSpellId | undefined;
    for (const id of offMercenarySpells(raider.stats.int)) {
        const def = OFF_SPELLS[id];
        if (def.kind !== 'damage' || !canCastKeeping(raider, id)) continue;
        if (!best || def.circle > OFF_SPELLS[best].circle) best = id;
    }
    return best;
}

// ---- Running away (as the mercenary, OFF_MERCENARY_FLEE) ----

/** You and your mercenary, where you stand (the ones it runs from). */
function chasers(world: OffRaiderWorld): TilePoint[] {
    const out: TilePoint[] = [];
    for (const v of VICTIMS) {
        const tile = world.raidVictimTile(v);
        if (tile) out.push({ x: tile.x, y: tile.y });
    }
    return out;
}

function keepsFleeing(raider: OffMercenary, world: OffRaiderWorld, deltaMs: number): boolean {
    const flee = OFF_MERCENARY_FLEE;
    const share = raider.hp / Math.max(1, raider.maxHp);
    // A Mage runs sooner, with or without mana to heal (it heals once away); a Warrior has no spells.
    const below = raider.isCaster ? OFF_RAIDER_MAGE.fleeBelow : flee.below;
    raider.noFleeMs = Math.max(0, raider.noFleeMs - deltaMs);
    if (share >= below) raider.calmHp = Number.POSITIVE_INFINITY;
    if (!raider.fleeing) {
        if (share >= below || raider.hasPotion || raider.hp >= raider.calmHp || raider.stamina < OFF_RAIDER.fleeMinStamina || raider.noFleeMs > 0) return false;
        raider.fleeing = true;
        raider.fleeTimeMs = 0;
        raider.flees++;
        raider.fleeSafeMs = 0;
        raider.fleeReplanMs = 0;
        raider.raidBlow = undefined;
        raider.raidCast = undefined;
        raider.spells?.cancel();
        raider.mover.cancel();
        resetChase(raider);
        return true;
    }
    if (share > flee.backAbove) {
        raider.stopFleeing();
        return false;
    }
    // Out of breath, or running long enough: it turns and fights.
    raider.fleeTimeMs += deltaMs;
    if (!raider.canRun || raider.fleeTimeMs >= OFF_RAIDER.fleeMaxMs) {
        raider.stopFleeing();
        raider.cornered++;
        raider.noFleeMs = OFF_RAIDER.fleeAgainMs;
        raider.mover.cancel();
        return false;
    }
    const mover = raider.mover;
    const chased = chasers(world).some((t) => tileDistance(t.x, t.y, mover.tileX, mover.tileY) <= flee.chaserTiles);
    raider.fleeSafeMs = chased ? 0 : raider.fleeSafeMs + deltaMs;
    if (raider.fleeSafeMs >= flee.safeMs) {
        raider.stopFleeing(true);
        return false;
    }
    return true;
}

/** Runs `stepTiles` at a time to the tile farthest from you and your mercenary. */
function flee(raider: OffMercenary, world: OffRaiderWorld, deltaMs: number): void {
    const mover = raider.mover;
    raider.fleeReplanMs -= deltaMs;
    if ((mover.isTravelling && raider.fleeReplanMs > 0) || raider.character.isActing) return;
    raider.fleeReplanMs = OFF_MERCENARY_FLEE.replanMs;
    runAway(raider, world, OFF_MERCENARY_FLEE.stepTiles);
}

/** Sets off `tiles` away, to the tile (of 8 directions) farthest from you and your mercenary. False when none is better. */
function runAway(raider: OffMercenary, world: OffRaiderWorld, tiles: number): boolean {
    const mover = raider.mover;
    const here = { x: mover.tileX, y: mover.tileY };
    const from = chasers(world);
    const score = (t: TilePoint): number => {
        let nearest = Number.POSITIVE_INFINITY;
        for (const c of from) nearest = Math.min(nearest, tileDistance(t.x, t.y, c.x, c.y));
        return nearest;
    };
    let best: TilePoint | undefined;
    let bestScore = score(here);
    for (let d = 0; d < DIRECTION_COUNT; d++) {
        const step = directionOffset(d as Direction);
        const t = { x: here.x + step.x * tiles, y: here.y + step.y * tiles };
        if (!world.raiderCanStand(raider, t.x, t.y)) continue;
        const value = score(t);
        if (value > bestScore) {
            best = t;
            bestScore = value;
        }
    }
    if (!best) return false;
    const path = world.findPath(here, best, OFF_RAIDER.pathMaxTiles);
    if (path && path.length > 0) mover.goAlong(path);
    else mover.goTo(best.x, best.y);
    return true;
}

/** Off-9A: a Mage Raider's spells are the mercenary Mage's (OFF_MERCENARY_SPELLS, by its INT). */
export function raiderKnows(raider: OffMercenary, id: OffSpellId): boolean {
    return offMercenarySpells(raider.stats.int).includes(id);
}
