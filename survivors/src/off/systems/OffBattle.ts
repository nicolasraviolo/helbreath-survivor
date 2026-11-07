// Helbreath Off (Fase Off-2): el combate del mundo. Lleva la vida del jugador, el monstruo marcado, los golpes de
// ida y vuelta, los pits y los monstruos, y morir y volver. La escena (OffWorldScene) solo le pasa los controles.
// - Atacar: ir hasta el monstruo marcado (a su alcance) y pegarle. Un clic o una pulsación = un golpe; con el botón
//   mantenido sigue pegando. Moverse deja de atacar.
// - Acertar y daño con las fórmulas del original (OffCombatRules). El golpe se decide al empezar y cae a mitad.
// - Morir (Off-2A): cae, y a los 3 s vuelve al inicio con la vida llena. Pierde algo de experiencia sin bajar de nivel.
// - Experiencia (Off-2B, off/data/offLevel.ts): entera al matar al monstruo. Subir de nivel llena la vida, suena la voz
//   del original, sale "Level Up!" y guarda 3 puntos. Todo se guarda al momento (OffSaveStore).
// - Maná, estamina y las tandas de recuperación (Off-3B): OffVitals. Subir de nivel y volver a la vida los llenan.
// - Equipo (Off-3C): el arma puesta da el daño, el alcance y la velocidad; la armadura suma defensa (2 × DEX + la suya).
// - Botín (Off-4A): al matar, lo que suelta el monstruo (OffLootRoller) cae en su casilla (OffGroundItems) y se recoge
//   al pisarlo: el oro al contador, lo demás a la bolsa (OffSaveStore). Morir no hace perder ni oro ni bolsa.
// Los mensajes ("Level Up!" y la lista de abajo a la izquierda) van a OffHudScene por los eventos de la escena.
import Phaser from 'phaser';
import { DEBUG_START } from '../../config/debugStart';
import { PLAYER_BODY_OFFSET_Y, TILE_SIZE } from '../../config/gameConfig';
import { ANNOUNCE_EVENT, EVENT_LIST_EVENT } from '../../config/hud';
import { GENDER_SOUNDS } from '../../data/appearance';
import { Effect } from '../../entities/Effect';
import type { TileRect } from '../../data/maps';
import { PlayerState } from '../../hb/playerAppearance';
import type { AudioSystem } from '../../systems/AudioSystem';
import { DamageNumbers } from '../../systems/DamageNumbers';
import { HitParticles } from '../../systems/HitParticles';
import { Pool } from '../../utils/Pool';
import { OFF_MONSTER_LOOK } from '../config/offMonsterLook';
import { OFF_STAT_IDS, offMaxHp, type OffStats } from '../data/offCharacter';
import { OFF_COMBAT, offAttackMs } from '../data/offCombat';
import { offArmorDefense, offBagItemName, offWeapon, type OffWeaponItem } from '../data/offItems';
import { OFF_LOOT_TEXT } from '../data/offLoot';
import type { OffGroundContent } from '../entities/OffGroundItem';
import { OFF_LEVEL, OFF_LEVEL_TEXT, offDeathExpLoss, offKillExp, offLevelForExp } from '../data/offLevel';
import type { OffCharacter } from '../entities/OffCharacter';
import type { OffMonster } from '../entities/OffMonster';
import { isFromBehind, offHitChance, rollMonsterDamage, rollWeaponDamage, tileDistance } from './OffCombatRules';
import { provokeMonster, updateMonster, type OffMonsterWorld } from './OffMonsterAI';
import { OffGroundItems } from './OffGroundItems';
import { rollKillLoot } from './OffLootRoller';
import { OffPits } from './OffPits';
import { offSaveStore } from './OffSaveStore';
import { OffVitals } from './OffVitals';
import { directionTowards, type TileMover, type TilePoint } from './TileMover';

/** The player's blow on the way: it lands on `monster` after `leftMs`. */
interface PendingBlow {
    monster: OffMonster;
    lands: boolean;
    leftMs: number;
}

export class OffBattle implements OffMonsterWorld {
    /** Mana, stamina and the self-healing batches (Off-3B). */
    public readonly vitals: OffVitals;
    public hp: number;
    /** Total experience; the level comes from it. */
    public exp: number;
    public level: number;
    /** Stat points not spent yet (Off-3 spends them). */
    public points: number;
    /** Monsters killed since the world opened. */
    public kills = 0;
    /** Monster chosen to attack (click, A, LB / RB). */
    public target: OffMonster | undefined;
    /** Monster under the mouse (its name shows). */
    public hovered: OffMonster | undefined;
    public dead = false;
    public readonly pits: OffPits;
    /** Loot lying on the ground (Off-4A). */
    public readonly ground: OffGroundItems;
    private readonly numbers: DamageNumbers;
    private readonly particles: HitParticles;
    private readonly effects: Pool<Effect>;
    /** One attack asked for (a click or a press) and not yet started. */
    private attackQueued = false;
    /** The button is held: attacks go on. */
    private attackHeld = false;
    private cooldownMs = 0;
    private blow: PendingBlow | undefined;
    private respawnLeftMs = 0;
    private readonly playerAt: TilePoint = { x: 0, y: 0 };

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly mover: TileMover,
        private readonly character: OffCharacter,
        private readonly audio: AudioSystem,
        private readonly isWalkable: (x: number, y: number) => boolean,
        private readonly respawnTile: () => TilePoint,
    ) {
        const saved = offSaveStore.character;
        this.exp = saved.exp;
        this.points = saved.points;
        this.level = offLevelForExp(this.exp);
        this.hp = this.maxHp;
        this.vitals = new OffVitals(this, (line) => this.scene.events.emit(EVENT_LIST_EVENT, line));
        this.numbers = new DamageNumbers(scene);
        this.particles = new HitParticles(scene);
        this.effects = new Pool(() => new Effect(scene));
        this.pits = new OffPits(scene, (x, y) => this.isFree(x, y));
        this.pits.fillAll();
        this.ground = new OffGroundItems(scene, (content) => this.pickUp(content), () => this.eventLine(OFF_LOOT_TEXT.bagFull));
    }

    /** Original max health, which grows with the level. */
    public get maxHp(): number {
        return offMaxHp({ ...this.stats, level: this.level });
    }

    /** The character's stats (they grow in the Character window). */
    public get stats(): Readonly<OffStats> {
        return offSaveStore.character.stats;
    }

    /** The weapon held now (Equipment screen, Off-3C). */
    public get weapon(): OffWeaponItem {
        return offWeapon(offSaveStore.character.equipment);
    }

    /** Defence against monsters: 2 × DEX and the worn armour (original). */
    public get defense(): number {
        return this.stats.dex * 2 + offArmorDefense(offSaveStore.character.equipment);
    }

    /** Character window, Ok: the points go into the stats for good. Health, mana and stamina keep their value. */
    public assignPoints(added: Readonly<OffStats>): void {
        const spent = OFF_STAT_IDS.reduce((sum, id) => sum + added[id], 0);
        if (spent <= 0 || spent > this.points) return;
        this.points -= spent;
        offSaveStore.assignPoints(added, this.points);
    }

    /** The player may start a step (not while swinging, not dead). */
    public get canMove(): boolean {
        return !this.dead && !this.character.isActing;
    }

    // ---- What the scene tells it ----

    /** Alive monster drawn under a point of the world (the one in front when several overlap), if any. */
    public monsterAt(px: number, py: number): OffMonster | undefined {
        let best: OffMonster | undefined;
        for (const monster of this.pits.monsters) {
            if (monster.isAlive && monster.contains(px, py) && (!best || monster.y > best.y)) best = monster;
        }
        return best;
    }

    /** Attack this monster (a click on it): one blow, more while `held`. */
    public engage(monster: OffMonster, held: boolean): void {
        if (this.dead) return;
        this.target = monster;
        this.attackQueued = true;
        this.attackHeld = held;
    }

    /** A or Space: attack the marked monster, or the nearest one. */
    public attackPressed(): void {
        if (this.dead) return;
        if (!this.target || !this.target.isAlive || this.distanceTo(this.target) > OFF_COMBAT.targetRangeTiles) {
            this.target = this.nearbyMonsters()[0];
        }
        if (this.target) this.attackQueued = true;
    }

    /** Whether the attack button (or the click on a monster) is still held. */
    public setHeld(held: boolean): void {
        this.attackHeld = held;
    }

    /** Moving on: no more blows (the mark stays, for the gamepad). */
    public stopAttacking(): void {
        this.attackQueued = false;
        this.attackHeld = false;
    }

    /** A click on the ground: no target. */
    public clearTarget(): void {
        this.stopAttacking();
        this.target = undefined;
    }

    /** LB / RB: the next (+1) or previous (−1) monster near, by distance. */
    public cycleTarget(step: 1 | -1): void {
        const near = this.nearbyMonsters();
        if (near.length === 0) return;
        const index = this.target ? near.indexOf(this.target) : -1;
        this.target = near[(index + step + near.length) % near.length];
    }

    /** Tile the player may step onto: walkable and nobody there. */
    public isFreeForPlayer(x: number, y: number): boolean {
        return this.isWalkable(x, y) && !this.monsterOn(x, y);
    }

    public update(deltaMs: number): void {
        if (this.dead) this.updateDead(deltaMs);
        else this.updateAttack(deltaMs);
        this.vitals.update(deltaMs);
        this.hp = Math.min(this.hp, this.maxHp);
        for (const monster of this.pits.monsters) {
            updateMonster(monster, deltaMs, this);
            monster.marked = monster.isAlive && (monster === this.target || monster === this.hovered);
            monster.sync(deltaMs);
        }
        if (this.target && !this.target.isAlive) this.clearTarget();
        if (this.hovered && !this.hovered.isAlive) this.hovered = undefined;
        this.pits.update(deltaMs);
        this.ground.update(deltaMs, this.playerTile());
        this.numbers.update(deltaMs);
        for (const effect of [...this.effects.active]) {
            if (!effect.update(deltaMs)) this.effects.release(effect);
        }
    }

    // ---- OffMonsterWorld ----

    public playerTile(): TilePoint | undefined {
        if (this.dead) return undefined;
        this.playerAt.x = this.mover.tileX;
        this.playerAt.y = this.mover.tileY;
        return this.playerAt;
    }

    public wanderArea(monster: OffMonster): TileRect {
        return this.pits.wanderArea(monster.pit);
    }

    /** Tile a monster may step onto: walkable, no monster and not the player. */
    public isFree(x: number, y: number): boolean {
        if (!this.isWalkable(x, y) || this.monsterOn(x, y)) return false;
        if (this.dead) return true;
        const mover = this.mover;
        return !((mover.tileX === x && mover.tileY === y) || (mover.nextTileX === x && mover.nextTileY === y));
    }

    public rollHitOnPlayer(monster: OffMonster): boolean {
        this.audio.play(monster.def.base.attackSound);
        return Math.random() < offHitChance(monster.def.base.hitRatio, this.defense, isFromBehind(monster.mover.facing, this.mover.facing));
    }

    public monsterStrikes(monster: OffMonster, lands: boolean): void {
        if (this.dead) return;
        const x = this.character.x;
        const y = this.character.y - PLAYER_BODY_OFFSET_Y;
        if (!lands) {
            this.numbers.showWord(x, y, 'Miss');
            return;
        }
        const damage = rollMonsterDamage(monster.def.base.damageDice, this.stats.vit);
        if (damage <= 0) return;
        this.hp = Math.max(0, this.hp - damage);
        this.numbers.showColored(x, y, damage, OFF_MONSTER_LOOK.playerDamageColor, false, this.hp === 0);
        this.spawnEffect('fx.hit', x, y);
        this.audio.play('sfx.player.hurt');
        if (this.hp === 0) {
            this.die();
            return;
        }
        if (!this.character.isActing && !this.mover.isMoving) {
            this.character.act(PlayerState.Hurt, this.mover.facing, OFF_COMBAT.playerHurtMs);
        }
    }

    // ---- The player's attacks ----

    private updateAttack(deltaMs: number): void {
        this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
        const blow = this.blow;
        if (blow) {
            blow.leftMs -= deltaMs;
            if (blow.leftMs <= 0) {
                this.blow = undefined;
                this.landBlow(blow);
            }
        }
        const target = this.target;
        if (!target || !target.isAlive || !(this.attackQueued || this.attackHeld)) return;
        const range = this.weapon.range;
        if (this.distanceTo(target) > range) {
            // Walk up to it (the mover stops when it is in reach).
            if (!this.character.isActing) this.mover.approach(target.mover.tileX, target.mover.tileY, range);
            return;
        }
        if (this.mover.isMoving) return;
        this.mover.cancel();
        if (this.cooldownMs > 0 || this.character.isActing) return;
        this.swingAt(target);
    }

    private swingAt(target: OffMonster): void {
        const mover = this.mover;
        const direction = directionTowards(mover.tileX, mover.tileY, target.mover.tileX, target.mover.tileY) ?? mover.facing;
        mover.face(direction);
        const hitRatio = OFF_COMBAT.noviceSkill + OFF_COMBAT.playerHitBonus;
        const behind = isFromBehind(direction, target.mover.facing);
        const lands = Math.random() < offHitChance(hitRatio, target.def.base.defenseRatio, behind);
        const attackMs = offAttackMs(this.weapon, this.stats.str);
        this.character.act(PlayerState.Melee, direction, attackMs);
        this.cooldownMs = attackMs;
        this.blow = { monster: target, lands, leftMs: attackMs * OFF_COMBAT.hitShare };
        this.attackQueued = false;
        this.audio.play('sfx.melee.swing');
    }

    private landBlow(blow: PendingBlow): void {
        const monster = blow.monster;
        if (!monster.isAlive) return;
        const bodyY = monster.y - monster.def.base.bodyOffsetY;
        if (!blow.lands) {
            this.numbers.showWord(monster.x, bodyY, 'Miss');
            return;
        }
        const damage = rollWeaponDamage(this.weapon, monster.def.size, this.stats.str);
        monster.hurt(damage);
        provokeMonster(monster);
        const killed = monster.hp <= 0;
        this.numbers.show(monster.x, bodyY, damage, false, killed);
        this.audio.play('sfx.melee.hit');
        if (killed) {
            monster.kill();
            this.particles.death(monster.x, monster.y, bodyY);
            this.audio.play(monster.def.base.deathSound);
            this.kills++;
            this.dropLoot(monster);
            this.gainExp(offKillExp(monster.exp, this.level), monster.x, bodyY);
        } else {
            this.particles.hit(monster.x, bodyY, this.character.x, this.character.y);
            this.audio.play(monster.def.base.hitSound);
        }
    }

    // ---- Loot (Off-4A) ----

    /** What the monster drops falls on its tile. */
    private dropLoot(monster: OffMonster): void {
        const loot = rollKillLoot(monster.id, DEBUG_START.offDrop);
        if (this.ground.dropLoot(loot, Math.floor(monster.x / TILE_SIZE), Math.floor(monster.y / TILE_SIZE))) this.audio.play('sfx.itemDrop');
    }

    /** Something picked up from the ground. False if it does not fit in the bag. */
    private pickUp(content: OffGroundContent): boolean {
        if ('gold' in content) {
            offSaveStore.addGold(content.gold);
            this.eventLine(OFF_LOOT_TEXT.gotGold(content.gold));
        } else {
            if (!offSaveStore.addToBag(content.item)) return false;
            this.eventLine(OFF_LOOT_TEXT.gotItem(offBagItemName(content.item)));
        }
        this.audio.play('sfx.pickup');
        return true;
    }

    private eventLine(line: string): void {
        this.scene.events.emit(EVENT_LIST_EVENT, line);
    }

    // ---- Experience ----

    /** A kill's experience: shown over the monster; one level or more may come with it. */
    private gainExp(amount: number, x: number, y: number): void {
        if (amount <= 0) return;
        this.exp += amount;
        this.numbers.showWord(x, y - OFF_MONSTER_LOOK.expWordRise, OFF_LEVEL_TEXT.expGained(amount));
        this.scene.events.emit(EVENT_LIST_EVENT, OFF_LEVEL_TEXT.expLine(amount));
        const level = offLevelForExp(this.exp);
        if (level > this.level) {
            this.points += (level - this.level) * OFF_LEVEL.pointsPerLevel;
            this.level = level;
            this.hp = this.maxHp;
            this.vitals.fill();
            this.audio.play(GENDER_SOUNDS[offSaveStore.character.look.gender].levelUp);
            this.scene.events.emit(ANNOUNCE_EVENT, OFF_LEVEL_TEXT.levelUp);
            this.scene.events.emit(EVENT_LIST_EVENT, OFF_LEVEL_TEXT.levelLine(level));
        }
        this.save();
    }

    private save(): void {
        offSaveStore.saveProgress(this.exp, this.points);
    }

    // ---- Dying and coming back ----

    private die(): void {
        this.dead = true;
        this.blow = undefined;
        this.clearTarget();
        this.mover.cancel();
        this.character.die(this.mover.facing);
        this.audio.play(GENDER_SOUNDS[offSaveStore.character.look.gender].death);
        this.respawnLeftMs = OFF_COMBAT.playerRespawnMs;
        const loss = offDeathExpLoss(this.exp, this.level);
        if (loss > 0) {
            this.exp -= loss;
            this.save();
            this.scene.events.emit(EVENT_LIST_EVENT, OFF_LEVEL_TEXT.expLost(loss));
        }
    }

    private updateDead(deltaMs: number): void {
        this.respawnLeftMs -= deltaMs;
        if (this.respawnLeftMs > 0) return;
        const tile = this.respawnTile();
        this.mover.place(tile.x, tile.y);
        this.hp = this.maxHp;
        this.vitals.fill();
        this.dead = false;
        this.cooldownMs = 0;
        this.character.revive();
    }

    // ---- Helpers ----

    private distanceTo(monster: OffMonster): number {
        return tileDistance(this.mover.tileX, this.mover.tileY, monster.mover.tileX, monster.mover.tileY);
    }

    /** Alive monsters within reach of the gamepad's targeting, nearest first. */
    private nearbyMonsters(): OffMonster[] {
        return this.pits.monsters
            .filter((m) => m.isAlive && this.distanceTo(m) <= OFF_COMBAT.targetRangeTiles)
            .sort((a, b) => this.distanceTo(a) - this.distanceTo(b));
    }

    /** An alive monster stands on (or steps onto) this tile. */
    private monsterOn(x: number, y: number): boolean {
        for (const monster of this.pits.monsters) {
            if (!monster.isAlive) continue;
            const mover = monster.mover;
            if ((mover.tileX === x && mover.tileY === y) || (mover.nextTileX === x && mover.nextTileY === y)) return true;
        }
        return false;
    }

    private spawnEffect(key: 'fx.hit', x: number, y: number): void {
        this.effects.acquire().play(key, x, y);
    }
}
