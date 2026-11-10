// Helbreath Off (Fase Off-8B): qué hace el mercenario cada frame (la misma cabeza servirá a los Raiders, Off-9).
// - Inconsciente: cuenta atrás y se levanta.
// - Muy lejos de ti (o tras cambiar de mapa): aparece a tu lado.
// - Pelea: primero con el monstruo que os ataca a ti o a él, luego con el que tú atacas, y si no, con el más cercano
//   que no sea neutral, siempre cerca de ti (OFF_MERCENARY.leashTiles). Va hasta él y le pega a su ritmo (el golpe se
//   decide al empezar y cae a mitad, como los tuyos).
// - Sin nada que pelear: si te alejas, te sigue (buscando camino como tu clic) y corre si va lejos. Quieto, se cura poco
//   a poco. Si en OFF_MERCENARY.stallMs no se acerca (tú estás en su casilla, una valla en medio), se para y lo vuelve
//   a pensar; al monstruo al que no llega lo deja un rato (ignoreMs). Nunca se queda en tu casilla.
// Off-8C, recoger: sin pelea, va a por lo que lleva OFF_MERCENARY.lootWaitMs en el suelo cerca de ti y te lo da (no lo
//   que tiraste tú). Va antes que atacar a un monstruo que solo pasea, pero después de los que os atacan y del tuyo.
// Off-8D, por la espalda: contra un monstruo paralizado (Paralyze no se rompe al pegarle; Hold Person sí), el Guerrero
//   va a la casilla de detrás (la contraria a donde mira) y le pega desde ahí, con su defensa a la mitad como el
//   original. Si esa casilla está ocupada o no se acerca en OFF_MERCENARY.flankStallMs, le pega desde donde esté.
// Fase Off-8C, la maga (`merc.isCaster`): no pega. Con una magia a medias espera quieta y, lista, la suelta. Si no,
// por orden: te cura si te queda poca vida (OFF_MERCENARY_CASTER.healBelow), se cura ella, y en pelea te pone Defense
// Shield (Protection From Magic si en el pit hay monstruos que lanzan magia), Berserk, Paralyze al monstruo que atacas
// si aguanta muchos golpes tuyos y Hold Person a otro si te atacan varios. Después, magias de daño desde lejos
// (castTiles), guardando maná para un Heal. Nunca a un monstruo quieto por Hold o Paralyze (la magia lo soltaría), y
// mientras haya uno cerca, solo al que vaya a por ella; si uno que va a por ella se acerca (keepAwayTiles), retrocede.
// Fase Off-8E, aguantar:
// - Una tanda de vida de jugador cada 15 s (offHpRegen de su VIT × su hpFactor), también peleando, con número verde.
// - Bajo OFF_MERCENARY_POTION.drinkBelow se bebe su poción (dice "I drank my potion!"); vuelve a tenerla a los refillMs.
// - Sin poción (y Kaila sin maná para curarse), bajo OFF_MERCENARY_FLEE.below huye: deja de pegar, dice "Heal me!" y
//   corre a la casilla más lejos de los monstruos que le persiguen y más cerca de ti. Vuelve a pelear al pasar de
//   backAbove, si Kaila ya puede curarse, o tras safeMs sin que nadie le persiga (entonces no vuelve a huir hasta
//   que le hieran más).
// Fase Off-9A, Raiders: también pelea contra ellos (OffFoe: un monstruo o un Raider) y van primero, antes que cualquier
// monstruo. Los Raiders que van a por él cuentan como perseguidores (huir, alejarse la maga). Los propios Raiders
// usan piezas de esta cabeza (OffRaiderAI: tandas de vida, poción, magias que sabe, atascarse).
import { OFF_COMBAT, offAttackMs } from '../data/offCombat';
import { OFF_MERCENARY, OFF_MERCENARY_CASTER, OFF_MERCENARY_FLEE, OFF_MERCENARY_POTION, offMercenarySpells } from '../data/offMercenary';
import { OFF_REGEN, offHpRegen } from '../data/offCharacter';
import { DIRECTION_COUNT, type Direction } from '../../hb/directions';
import { OFF_SPELLS, type OffSpellId } from '../data/offSpells';
import type { OffSpellAlly } from './OffSpells';
import { OFF_STEP_MS } from '../data/offWorld';
import type { OffMercenary } from '../entities/OffMercenary';
import type { OffMonster } from '../entities/OffMonster';
import { foeAttacking, foeDefense, type OffFoe } from './OffFoe';
import { PlayerState } from '../../hb/playerAppearance';
import { isFromBehind, offHitChance, tileDistance } from './OffCombatRules';
import { directionOffset, directionTowards, type TilePoint } from './TileMover';

/** Off-8C: what the Mage looks at about you before casting on you. */
export interface OffOwnerNeeds {
    /** Health / maximum, 0..1. */
    hpShare: number;
    shielded: boolean;
    berserk: boolean;
    /** A monster that casts spells is near you (Protection From Magic beats Defense Shield then). */
    casterNear: boolean;
    /** Your normal blow's average damage (Paralyze is only worth it on a monster with health for many of them). */
    blowDamage: number;
}

/** What the mercenary needs to know about the world. */
export interface OffMercenaryWorld {
    /** Off-8C: your health, shield and Berserk, or undefined while you are dead. */
    ownerNeeds(): OffOwnerNeeds | undefined;
    /** Off-8C: you, as the target of the Mage's Heal, shields and Berserk. */
    ownerAlly(): OffSpellAlly | undefined;
    /** Off-8C: the tile of the loot it should pick up for you now, if any. */
    lootFor(merc: OffMercenary): TilePoint | undefined;
    /** Off-8C: it takes what lies on that tile for you. */
    mercPicksUp(merc: OffMercenary, x: number, y: number): void;
    /** Off-8C: it could not get to that loot: left alone. */
    mercGivesUpLoot(x: number, y: number): void;
    /** Your tile, or undefined while you are dead. */
    ownerTile(): TilePoint | undefined;
    /** The monster (or Raider) you are attacking, if any. */
    ownerTarget(): OffFoe | undefined;
    readonly monsters: readonly OffMonster[];
    /** Off-9A: the Raiders alive here now. */
    readonly raiders: readonly OffMercenary[];
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
    /** Off-8E: it gets health back (a batch, or its potion: `drink`), with a green number. Returns what it got. */
    mercHeals(merc: OffMercenary, amount: number, drink: boolean): number;
}

/** Advances it one frame. Returns whether its step is a run (for its pose). */
export function updateMercenary(merc: OffMercenary, deltaMs: number, world: OffMercenaryWorld): boolean {
    merc.potionLeftMs = Math.max(0, merc.potionLeftMs - deltaMs);
    if (merc.isDown) {
        merc.downLeftMs = Math.max(0, merc.downLeftMs - deltaMs);
        if (merc.downLeftMs === 0) {
            merc.standUp();
            world.mercStandsUp(merc);
        }
        return false;
    }
    merc.cooldownMs = Math.max(0, merc.cooldownMs - deltaMs);
    // Off-9A: held by a Raider Mage's Hold Person / Paralyze: it only finishes the step it was taking.
    if (merc.isHeld) {
        merc.mover.update(deltaMs, OFF_STEP_MS.walk);
        return false;
    }
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
    // Off-8E: health back, its potion, and running away.
    regenBatch(merc, deltaMs, world);
    drinkPotion(merc, world);
    if (keepsFleeing(merc, world, deltaMs)) {
        flee(merc, owner, world, deltaMs);
        if (!merc.character.isActing) mover.update(deltaMs, OFF_STEP_MS.run);
        return true;
    }
    // Off-8C: the Mage with a spell on the way only waits for it (and lets it go when ready).
    if (merc.isCaster && castInProgress(merc, world)) return false;
    let target = owner ? pickTarget(merc, owner, world) : undefined;
    // Off-8C: a monster that is only walking about (not going for anyone, not yours) waits while there is loot to take.
    if (target && !foeAttacking(target) && target !== world.ownerTarget() && world.lootFor(merc)) target = undefined;
    if (target !== merc.target) resetChase(merc);
    merc.target = target;
    if (merc.isCaster && owner && support(merc, owner, target !== undefined, world)) return false;
    if (target) {
        merc.regenMs = 0;
        if (!merc.isCaster) fight(merc, target, world, deltaMs);
        else if (owner) castFight(merc, target, world, owner, deltaMs);
    } else {
        // Off-8C: nothing to fight: first the loot left on the ground, then back to you.
        if (!collectLoot(merc, owner, world, deltaMs)) follow(merc, owner, world, deltaMs);
        regen(merc, deltaMs);
    }
    const running = away > OFF_MERCENARY.runTiles || (target !== undefined && tileDistance(mover.tileX, mover.tileY, target.mover.tileX, target.mover.tileY) > OFF_MERCENARY.runTiles);
    if (!merc.character.isActing) mover.update(deltaMs, running ? OFF_STEP_MS.run : OFF_STEP_MS.walk);
    return mover.currentStepMs === OFF_STEP_MS.run;
}

/**
 * The one to fight: a Raider first (Off-9A), then the monster going for you or it, the one you attack, or the nearest
 * one; all near you.
 */
function pickTarget(merc: OffMercenary, owner: TilePoint, world: OffMercenaryWorld): OffFoe | undefined {
    const mover = merc.mover;
    const nearOwner = (m: OffFoe) => m.isAlive && m !== merc.ignored && tileDistance(m.mover.tileX, m.mover.tileY, owner.x, owner.y) <= OFF_MERCENARY.leashTiles;
    const fromMerc = (m: OffFoe) => tileDistance(m.mover.tileX, m.mover.tileY, mover.tileX, mover.tileY);
    const current = merc.target;
    if (current?.kind === 'person' && nearOwner(current)) return current;
    let raider: OffMercenary | undefined;
    for (const r of world.raiders) {
        if (nearOwner(r) && (!raider || fromMerc(r) < fromMerc(raider))) raider = r;
    }
    if (raider) return raider;
    if (current && nearOwner(current) && foeAttacking(current)) return current;
    let best: OffFoe | undefined;
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

function fight(merc: OffMercenary, target: OffFoe, world: OffMercenaryWorld, deltaMs: number): void {
    const mover = merc.mover;
    const range = merc.weapon.range;
    if (flank(merc, target, world, deltaMs)) return;
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
    const behind = isFromBehind(direction, target.mover.facing);
    if (behind) merc.behindBlows++;
    const lands = Math.random() < offHitChance(merc.hitRatio, foeDefense(target), behind);
    const attackMs = offAttackMs(merc.weapon, merc.stats.str);
    merc.character.act(PlayerState.Melee, direction, attackMs);
    merc.cooldownMs = attackMs;
    merc.blow = { monster: target, lands, leftMs: attackMs * OFF_COMBAT.hitShare };
    world.mercSwings();
}

/**
 * Off-8D: a paralysed monster: walks to the tile behind it. True while on the way (fight waits); false once there, or
 * when the tile is taken or it gave up on this monster (then it hits from where it is).
 */
function flank(merc: OffMercenary, target: OffFoe, world: OffMercenaryWorld, deltaMs: number): boolean {
    const mover = merc.mover;
    if (!target.isParalyzed) {
        if (merc.flankGaveUp === target) merc.flankGaveUp = undefined;
        return false;
    }
    if (merc.flankGaveUp === target) return false;
    const facing = directionOffset(target.mover.facing);
    const back = { x: target.mover.tileX - facing.x, y: target.mover.tileY - facing.y };
    if (mover.tileX === back.x && mover.tileY === back.y) {
        if (mover.isTravelling) mover.cancel();
        return false;
    }
    if (!world.mercCanStand(back.x, back.y)) return false;
    const goal = mover.goal;
    if (!mover.isTravelling || !goal || goal.x !== back.x || goal.y !== back.y) {
        resetChase(merc);
        if (merc.character.isActing || merc.blow) return true;
        const path = world.findPath({ x: mover.tileX, y: mover.tileY }, back, OFF_MERCENARY.pathMaxTiles);
        if (path && path.length > 0) mover.goAlong(path);
        else mover.goTo(back.x, back.y);
        return true;
    }
    if (stalled(merc, tileDistance(mover.tileX, mover.tileY, back.x, back.y), deltaMs, OFF_MERCENARY.flankStallMs)) {
        merc.flankGaveUp = target;
        mover.cancel();
        resetChase(merc);
        return false;
    }
    return true;
}

// ---- The Mage (Off-8C) ----

/**
 * Preparing: waits. Ready: casts it on who it was for. A dead monster, a far owner, or a damage spell whose monster
 * got held meanwhile (it would break the hold) drop it. True while busy.
 */
function castInProgress(merc: OffMercenary, world: OffMercenaryWorld): boolean {
    const spells = merc.spells;
    if (!spells?.busy) return false;
    if (spells.state === 'preparing') return true;
    const goal = merc.castFor;
    const id = spells.spell;
    merc.castFor = undefined;
    if (!goal || id === undefined) {
        spells.cancel();
        return false;
    }
    const before = spells.casts;
    if (goal.on === 'owner') {
        const ally = world.ownerAlly();
        if (ally) spells.release(ally.x, ally.y, undefined, ally);
        else spells.cancel();
    } else if (goal.on === 'self') {
        spells.release(merc.x, merc.y, undefined);
    } else if (goal.monster.isAlive && !(OFF_SPELLS[id].kind === 'damage' && breaksAHold(id, goal.monster, world))) {
        spells.release(goal.monster.x, goal.monster.y, goal.monster);
    } else {
        spells.cancel();
    }
    if (spells.casts > before) merc.castCount[id] = (merc.castCount[id] ?? 0) + 1;
    return false;
}

/**
 * In order: heals you or itself; fighting, a shield and Berserk on you, Paralyze on the monster you attack (when it
 * has health for many of your blows) and Hold Person on another one when several go for you. True when it started one.
 */
function support(merc: OffMercenary, owner: TilePoint, fighting: boolean, world: OffMercenaryWorld): boolean {
    const needs = world.ownerNeeds();
    const caster = OFF_MERCENARY_CASTER;
    const near = tileDistance(merc.mover.tileX, merc.mover.tileY, owner.x, owner.y) <= caster.supportTiles;
    const heal = bestHeal(merc);
    if (heal && needs && near && needs.hpShare < caster.healBelow) return startCast(merc, heal, { on: 'owner' }, owner);
    if (heal && merc.hp / Math.max(1, merc.maxHp) < caster.healBelow) return startCast(merc, heal, { on: 'self' }, undefined);
    if (!fighting || !needs || !near) return false;
    if (!needs.shielded) {
        // Off-11B (owner): Absolute Magic Protection instead of Protection From Magic once she knows it.
        const magicShield: OffSpellId = canCast(merc, 'absoluteMagicProtection') ? 'absoluteMagicProtection' : 'protectionFromMagic';
        const shield: OffSpellId = needs.casterNear ? magicShield : 'defenseShield';
        if (canCast(merc, shield)) return startCast(merc, shield, { on: 'owner' }, owner);
    }
    if (!needs.berserk && canCast(merc, 'berserk')) return startCast(merc, 'berserk', { on: 'owner' }, owner);
    // Holds are extras: only with mana left for a Heal afterwards.
    const yours = world.ownerTarget();
    if (yours && !yours.isHeld && inCastRange(merc, yours) && canCastKeeping(merc, 'paralyze')
        && yours.hp >= needs.blowDamage * caster.paralyzeMinBlows) {
        return startCast(merc, 'paralyze', { on: 'monster', monster: yours }, tileOf(yours));
    }
    const attackers = world.monsters.filter((m) => m.isAlive && m.mode === 'attack' && m.victim === 'player' && !m.isHeld
        && tileDistance(m.mover.tileX, m.mover.tileY, owner.x, owner.y) <= caster.attackersTiles);
    if (attackers.length >= caster.holdWhenAttackers && canCastKeeping(merc, 'holdPerson')) {
        const other = attackers.find((m) => m !== yours && inCastRange(merc, m));
        if (other) return startCast(merc, 'holdPerson', { on: 'monster', monster: other }, tileOf(other));
    }
    return false;
}

/**
 * From afar: walks closer until in range, steps back when one going for it gets close, and casts damage spells. Never
 * at a held monster (spells break holds), and while one is held near you, only at the ones going for it: the rest of
 * the time it waits, ready for its support spells.
 */
function castFight(merc: OffMercenary, target: OffFoe, world: OffMercenaryWorld, owner: TilePoint, deltaMs: number): void {
    const mover = merc.mover;
    const caster = OFF_MERCENARY_CASTER;
    const distance = tileDistance(mover.tileX, mover.tileY, target.mover.tileX, target.mover.tileY);
    if (distance > caster.castTiles) {
        if (stalled(merc, distance, deltaMs)) {
            merc.ignored = target;
            merc.ignoredLeftMs = OFF_MERCENARY.ignoreMs;
            merc.target = undefined;
            mover.cancel();
            resetChase(merc);
            return;
        }
        if (!merc.character.isActing) mover.approach(target.mover.tileX, target.mover.tileY, caster.castTiles);
        return;
    }
    resetChase(merc);
    if (mover.isMoving) return;
    mover.cancel();
    const chaser: OffFoe | undefined = world.monsters.find((m) => m.isAlive && m.mode === 'attack' && m.victim === 'merc' && !m.isHeld && inCastRange(merc, m))
        ?? world.raiders.find((r) => r.isAlive && r.victim === 'merc' && !r.isHeld && inCastRange(merc, r));
    if (chaser && tileDistance(mover.tileX, mover.tileY, chaser.mover.tileX, chaser.mover.tileY) <= caster.keepAwayTiles
        && mover.stepAwayFrom(chaser.mover.tileX, chaser.mover.tileY, OFF_STEP_MS.run)) return;
    const holding = world.monsters.some((m) => m.isAlive && m.isHeld
        && tileDistance(m.mover.tileX, m.mover.tileY, owner.x, owner.y) <= OFF_MERCENARY.leashTiles);
    const aim = holding ? chaser : target.isHeld ? chaser : target;
    if (!aim) return;
    const spell = bestDamage(merc, aim, world);
    if (spell) startCast(merc, spell, { on: 'monster', monster: aim }, tileOf(aim));
}

/** Starts preparing that spell, looking at who it is for (Off-9A: a Raider passes no `goal`, it keeps its own). */
export function startCast(merc: OffMercenary, id: OffSpellId, goal: NonNullable<OffMercenary['castFor']> | undefined, at: TilePoint | undefined): boolean {
    const spells = merc.spells;
    if (!spells || merc.character.isActing) return false;
    merc.mover.cancel();
    if (merc.mover.isMoving) return false;
    if (at) {
        const direction = directionTowards(merc.mover.tileX, merc.mover.tileY, at.x, at.y);
        if (direction !== undefined) merc.mover.face(direction);
    }
    if (!spells.pressSpell(id)) return false;
    if (goal) merc.castFor = goal;
    return true;
}

function knows(merc: OffMercenary, id: OffSpellId): boolean {
    return offMercenarySpells(merc.stats.int).includes(id);
}

/** It knows the spell (its INT) and has the mana. */
export function canCast(merc: OffMercenary, id: OffSpellId): boolean {
    return knows(merc, id) && merc.mana >= OFF_SPELLS[id].mana;
}

/** As canCast, and mana for a Heal stays afterwards (OFF_MERCENARY_CASTER.healReserve). */
export function canCastKeeping(merc: OffMercenary, id: OffSpellId): boolean {
    return knows(merc, id) && merc.mana - OFF_SPELLS[id].mana >= healReserve(merc);
}

function healReserve(merc: OffMercenary): number {
    const heal = knows(merc, 'greatHeal') ? OFF_SPELLS.greatHeal : OFF_SPELLS.heal;
    return heal.mana * OFF_MERCENARY_CASTER.healReserve;
}

/** Great Heal if it knows it and has the mana, else Heal. */
export function bestHeal(merc: OffMercenary): OffSpellId | undefined {
    if (canCast(merc, 'greatHeal')) return 'greatHeal';
    return canCast(merc, 'heal') ? 'heal' : undefined;
}

/** Its strongest damage spell that keeps mana for a Heal and whose area would not break a hold near that monster. */
function bestDamage(merc: OffMercenary, monster: OffFoe, world: OffMercenaryWorld): OffSpellId | undefined {
    let best: OffSpellId | undefined;
    for (const id of offMercenarySpells(merc.stats.int)) {
        const def = OFF_SPELLS[id];
        if (def.kind !== 'damage' || !canCastKeeping(merc, id) || breaksAHold(id, monster, world)) continue;
        if (!best || def.circle > OFF_SPELLS[best].circle) best = id;
    }
    return best;
}

/** That spell on that monster would hit a held one (itself, or another in its area). */
function breaksAHold(id: OffSpellId, monster: OffFoe, world: OffMercenaryWorld): boolean {
    if (monster.isHeld) return true;
    const range = OFF_SPELLS[id].area ? OFF_SPELLS[id].areaRange ?? 0 : -1;
    if (range < 0) return false;
    return world.monsters.some((m) => m.isAlive && m.isHeld
        && Math.abs(m.mover.tileX - monster.mover.tileX) <= range && Math.abs(m.mover.tileY - monster.mover.tileY) <= range);
}

function inCastRange(merc: OffMercenary, monster: OffFoe): boolean {
    return tileDistance(merc.mover.tileX, merc.mover.tileY, monster.mover.tileX, monster.mover.tileY) <= OFF_MERCENARY_CASTER.castTiles;
}

function tileOf(monster: OffFoe): TilePoint {
    return { x: monster.mover.tileX, y: monster.mover.tileY };
}

/**
 * Off-8C: walks to the loot that has lain a while near you (OffMercenaryWorld.lootFor) and takes it for you on its
 * tile. Not getting closer (OFF_MERCENARY.stallMs), it gives up on that one. True while it is busy with loot.
 */
function collectLoot(merc: OffMercenary, owner: TilePoint | undefined, world: OffMercenaryWorld, deltaMs: number): boolean {
    const mover = merc.mover;
    const loot = owner ? world.lootFor(merc) : undefined;
    if (!loot) {
        if (merc.lootTile) {
            merc.lootTile = undefined;
            mover.cancel();
            resetChase(merc);
        }
        return false;
    }
    if (mover.tileX === loot.x && mover.tileY === loot.y) {
        if (!mover.isMoving) {
            world.mercPicksUp(merc, loot.x, loot.y);
            merc.lootTile = undefined;
            resetChase(merc);
        }
        return true;
    }
    const goal = merc.lootTile;
    if (!goal || goal.x !== loot.x || goal.y !== loot.y) {
        merc.lootTile = { x: loot.x, y: loot.y };
        resetChase(merc);
        const path = world.findPath({ x: mover.tileX, y: mover.tileY }, loot, OFF_MERCENARY.pathMaxTiles);
        if (path && path.length > 0) mover.goAlong(path);
        else mover.goTo(loot.x, loot.y);
        return true;
    }
    if (stalled(merc, tileDistance(mover.tileX, mover.tileY, loot.x, loot.y), deltaMs)) {
        world.mercGivesUpLoot(loot.x, loot.y);
        merc.lootTile = undefined;
        mover.cancel();
        resetChase(merc);
        return false;
    }
    if (!mover.isTravelling) mover.goTo(loot.x, loot.y);
    return true;
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

/** True once it has gone `limitMs` (OFF_MERCENARY.stallMs) without getting a tile closer to where it is going. */
export function stalled(merc: OffMercenary, gap: number, deltaMs: number, limitMs: number = OFF_MERCENARY.stallMs): boolean {
    if (gap < merc.chaseBest) {
        merc.chaseBest = gap;
        merc.chaseStallMs = 0;
        return false;
    }
    merc.chaseStallMs += deltaMs;
    return merc.chaseStallMs >= limitMs;
}

export function resetChase(merc: OffMercenary): void {
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

// ---- Holding on (Off-8E) ----

/** A player's batch of health every OFF_REGEN.hpIntervalMs, fighting or not (times its hpFactor). */
export function regenBatch(merc: OffMercenary, deltaMs: number, world: Pick<OffMercenaryWorld, 'mercHeals'>): void {
    merc.hpBatchMs += deltaMs;
    if (merc.hpBatchMs < OFF_REGEN.hpIntervalMs) return;
    merc.hpBatchMs %= OFF_REGEN.hpIntervalMs;
    if (merc.hp >= merc.maxHp) return;
    const batch = Math.max(1, Math.round(offHpRegen(merc.stats.vit) * merc.def.hpFactor));
    merc.batchGained += world.mercHeals(merc, batch, false);
}

/** Under OFF_MERCENARY_POTION.drinkBelow with its potion: drinks it ("I drank my potion!"). */
export function drinkPotion(merc: OffMercenary, world: Pick<OffMercenaryWorld, 'mercHeals'>): void {
    const potion = OFF_MERCENARY_POTION;
    if (!merc.hasPotion || merc.hp / Math.max(1, merc.maxHp) >= potion.drinkBelow) return;
    world.mercHeals(merc, Math.round(merc.maxHp * potion.healShare), true);
    merc.potionLeftMs = potion.refillMs;
    merc.potionsDrunk++;
    // Off-9A: a Raider drinks without saying so (the owner, 8-nov-2026).
    if (!merc.isRaider) merc.say('drankPotion', true);
}

/** The Mage has the mana and the spell for a Heal on herself. */
function canHealItself(merc: OffMercenary): boolean {
    return merc.isCaster && bestHeal(merc) !== undefined;
}

/** Starts, keeps or ends running away (OFF_MERCENARY_FLEE). True while it runs. */
function keepsFleeing(merc: OffMercenary, world: OffMercenaryWorld, deltaMs: number): boolean {
    const flee = OFF_MERCENARY_FLEE;
    const share = merc.hp / Math.max(1, merc.maxHp);
    if (share >= flee.below) merc.calmHp = Number.POSITIVE_INFINITY;
    if (!merc.fleeing) {
        if (share >= flee.below || merc.hasPotion || merc.hp >= merc.calmHp || canHealItself(merc)) return false;
        merc.fleeing = true;
        merc.flees++;
        merc.fleeSafeMs = 0;
        merc.fleeReplanMs = 0;
        merc.target = undefined;
        merc.lootTile = undefined;
        merc.castFor = undefined;
        merc.spells?.cancel();
        merc.mover.cancel();
        resetChase(merc);
        merc.say('healMe', true);
        return true;
    }
    if (share > flee.backAbove || canHealItself(merc)) {
        merc.stopFleeing();
        return false;
    }
    const mover = merc.mover;
    const near = (m: OffFoe) => tileDistance(m.mover.tileX, m.mover.tileY, mover.tileX, mover.tileY) <= flee.chaserTiles;
    const chased = world.monsters.some((m) => m.isAlive && m.mode === 'attack' && m.victim === 'merc' && !m.isHeld && near(m))
        || world.raiders.some((r) => r.isAlive && r.victim === 'merc' && !r.isHeld && near(r));
    merc.fleeSafeMs = chased ? 0 : merc.fleeSafeMs + deltaMs;
    if (merc.fleeSafeMs >= flee.safeMs) {
        merc.stopFleeing(true);
        return false;
    }
    return true;
}

/**
 * Runs `stepTiles` at a time to the tile farthest from the monsters attacking near it and nearest to you (farness
 * counts `awayWeight` more); with none near, back to you. Picks again every `replanMs` or when it stops.
 */
function flee(merc: OffMercenary, owner: TilePoint | undefined, world: OffMercenaryWorld, deltaMs: number): void {
    const flee = OFF_MERCENARY_FLEE;
    const mover = merc.mover;
    merc.fleeReplanMs -= deltaMs;
    if ((mover.isTravelling && merc.fleeReplanMs > 0) || merc.character.isActing) return;
    merc.fleeReplanMs = flee.replanMs;
    const here = { x: mover.tileX, y: mover.tileY };
    const chasers: OffFoe[] = [...world.monsters, ...world.raiders].filter((m) => m.isAlive && foeAttacking(m) && !m.isHeld
        && tileDistance(m.mover.tileX, m.mover.tileY, here.x, here.y) <= flee.chaserTiles * 2);
    const score = (t: TilePoint): number => {
        let nearest = flee.chaserTiles * 2;
        for (const m of chasers) nearest = Math.min(nearest, tileDistance(t.x, t.y, m.mover.tileX, m.mover.tileY));
        return nearest * flee.awayWeight - (owner ? tileDistance(t.x, t.y, owner.x, owner.y) : 0);
    };
    const candidates: TilePoint[] = [];
    for (let d = 0; d < DIRECTION_COUNT; d++) {
        const step = directionOffset(d as Direction);
        candidates.push({ x: here.x + step.x * flee.stepTiles, y: here.y + step.y * flee.stepTiles });
    }
    const byYou = owner ? world.freeTileNear(owner.x, owner.y) : undefined;
    if (byYou) candidates.push(byYou);
    let best: TilePoint | undefined;
    let bestScore = score(here);
    for (const t of candidates) {
        if (!world.mercCanStand(t.x, t.y)) continue;
        const value = score(t);
        if (value > bestScore) {
            best = t;
            bestScore = value;
        }
    }
    if (!best) return;
    const path = world.findPath(here, best, OFF_MERCENARY.pathMaxTiles);
    if (path && path.length > 0) mover.goAlong(path);
    else mover.goTo(best.x, best.y);
}
