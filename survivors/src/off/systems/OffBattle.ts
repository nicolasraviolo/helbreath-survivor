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
// - Inventario (Off-4B): usar un objeto de la bolsa (ponérselo o beberlo) y tirarlo a tus pies (useBagItem, dropBagItem).
// - Magias (Off-6B): las lanza OffSpells (`spells`); aquí su daño cae en el monstruo (spellHit) y pasa por lo mismo que
//   un golpe (hurtMonster: número, muerte, botín, experiencia). El fuego deja quemadura y el hielo frena, como en
//   Survivors. Un monstruo frenado o aturdido vive a su ritmo (OffMonster.timeScale).
// Los mensajes ("Level Up!" y la lista de abajo a la izquierda) van a OffHudScene por los eventos de la escena.
import Phaser from 'phaser';
import { DEBUG_START } from '../../config/debugStart';
import { PLAYER_BODY_OFFSET_Y, TILE_SIZE } from '../../config/gameConfig';
import { ANNOUNCE_EVENT, EVENT_LIST_EVENT } from '../../config/hud';
import { GENDER_SOUNDS } from '../../data/appearance';
import { BURN, ELEMENT_NUMBER_COLOR, type SpellElement } from '../../data/elements';
import { Effect } from '../../entities/Effect';
import type { TileRect } from '../../data/maps';
import { PlayerState } from '../../hb/playerAppearance';
import type { AudioSystem } from '../../systems/AudioSystem';
import { DamageNumbers } from '../../systems/DamageNumbers';
import { HitParticles } from '../../systems/HitParticles';
import { Pool } from '../../utils/Pool';
import { OFF_MONSTER_LOOK } from '../config/offMonsterLook';
import { OFF_REGEN_TEXT, OFF_STAT_IDS, offMaxHp, type OffStats } from '../data/offCharacter';
import { OFF_COMBAT, offAttackMs, type OffWeaponDef } from '../data/offCombat';
import { isOffItemId, OFF_ITEMS, offArmorDefense, offBagItemName, offItem, offWeapon } from '../data/offItems';
import { OFF_GOODS, offGood, type OffPotionRestores } from '../data/offGoods';
import { OFF_BAG_TEXT } from '../data/offBag';
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
import type { OffPitDef } from '../data/offPits';
import { offSaveStore, type OffEquipResult } from './OffSaveStore';
import { OffVitals } from './OffVitals';
import { OffSpells, type OffSpellHost } from './OffSpells';
import { OFF_CAST_WORDS, OFF_CASTING } from '../data/offSpells';
import { directionTowards, type TileMover, type TilePoint } from './TileMover';

/** What using or dropping a bag item did, and the line that says so (also when it was refused). */
/** Health, mana and stamina carried through a portal (Off-5A). */
export interface OffCarriedVitals {
    hp: number;
    mana: number;
    stamina: number;
}

export interface OffUseResult {
    done: boolean;
    line?: string;
    /** Gear changed: the character is dressed again. */
    gear?: boolean;
}

/** The player's blow on the way: it lands on `monster` after `leftMs`. */
interface PendingBlow {
    monster: OffMonster;
    lands: boolean;
    leftMs: number;
}

export class OffBattle implements OffMonsterWorld, OffSpellHost {
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
    /** Spells: preparing, casting and their effects (Off-6B). */
    public readonly spells: OffSpells;
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
        /** Where to come back to life here; undefined when it is somewhere else (the scene travels there). */
        private readonly respawnTile: () => TilePoint | undefined,
        pits: readonly OffPitDef[],
        /** Health, mana and stamina brought from the place before (Off-5A: a portal does not heal); full without it. */
        carried?: OffCarriedVitals,
    ) {
        const saved = offSaveStore.character;
        this.exp = saved.exp;
        this.points = saved.points;
        this.level = offLevelForExp(this.exp);
        this.hp = this.maxHp;
        this.vitals = new OffVitals(this, (line) => this.scene.events.emit(EVENT_LIST_EVENT, line));
        if (carried) {
            this.hp = Math.min(this.maxHp, Math.max(1, carried.hp));
            this.vitals.mana = Math.min(this.vitals.maxMana, carried.mana);
            this.vitals.stamina = Math.min(this.vitals.maxStamina, carried.stamina);
        }
        this.numbers = new DamageNumbers(scene);
        this.particles = new HitParticles(scene);
        this.effects = new Pool(() => new Effect(scene));
        this.pits = new OffPits(scene, pits, (x, y) => this.isFree(x, y));
        this.pits.fillAll();
        this.spells = new OffSpells(scene, this, mover, character, audio);
        this.ground = new OffGroundItems(scene, (content) => this.pickUp(content), (reason) => this.eventLine(reason === 'potionLimit' ? OFF_LOOT_TEXT.potionLimit : OFF_LOOT_TEXT.bagFull));
    }

    /** Original max health, which grows with the level. */
    public get maxHp(): number {
        return offMaxHp({ ...this.stats, level: this.level });
    }

    /** The character's stats (they grow in the Character window). */
    public get stats(): Readonly<OffStats> {
        return offSaveStore.character.stats;
    }

    /** The weapon held now (Equipment screen, Off-3C), or bare hands (Off-6A). */
    public get weapon(): OffWeaponDef {
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

    /** The player may start a step (not while swinging or preparing a spell, not dead). */
    public get canMove(): boolean {
        return !this.dead && !this.character.isActing;
    }

    // ---- OffSpellHost (Off-6B) ----

    public get mana(): number {
        return this.vitals.mana;
    }

    public spendMana(amount: number): void {
        this.vitals.mana = Math.max(0, this.vitals.mana - amount);
    }

    public monstersAround(tileX: number, tileY: number, range: number): OffMonster[] {
        return this.pits.monsters.filter((m) => m.isAlive
            && Math.abs(m.mover.tileX - tileX) <= range && Math.abs(m.mover.tileY - tileY) <= range);
    }

    public spellHit(monster: OffMonster, damage: number, element: SpellElement | undefined): void {
        const killed = this.hurtMonster(monster, damage, element);
        this.audio.play(killed ? monster.def.base.deathSound : monster.def.base.hitSound);
        if (killed) return;
        if (element === 'fire') monster.burn(damage * BURN.shareOfHit);
        if (element === 'ice') monster.slow();
    }

    public spellResisted(monster: OffMonster): void {
        provokeMonster(monster);
        this.numbers.showWord(monster.x, monster.y - monster.def.base.bodyOffsetY, OFF_CAST_WORDS.resisted);
    }

    public castFailed(): void {
        this.numbers.showWord(this.character.x, this.character.y - PLAYER_BODY_OFFSET_Y, OFF_CAST_WORDS.failed);
        this.character.act(PlayerState.Hurt, this.mover.facing, OFF_CASTING.failFlinchMs);
    }

    public eventLine(line: string): void {
        this.scene.events.emit(EVENT_LIST_EVENT, line);
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
        this.spells.update(deltaMs);
        this.vitals.update(deltaMs);
        this.hp = Math.min(this.hp, this.maxHp);
        for (const monster of this.pits.monsters) {
            this.updateBurn(monster, deltaMs);
            // Slowed by ice or stunned by a burn: its clock runs slower (Off-6B).
            updateMonster(monster, deltaMs * monster.timeScale, this);
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
        this.audio.play('sfx.melee.hit');
        const killed = this.hurtMonster(monster, damage, undefined);
        this.audio.play(killed ? monster.def.base.deathSound : monster.def.base.hitSound);
    }

    /**
     * Damage on a monster, from a blow or a spell (`element`: its number's colour): the number, and the death with its
     * loot and experience. Returns whether it died.
     */
    private hurtMonster(monster: OffMonster, damage: number, element: SpellElement | undefined): boolean {
        const bodyY = monster.y - monster.def.base.bodyOffsetY;
        monster.hurt(damage);
        provokeMonster(monster);
        const killed = monster.hp <= 0;
        this.numbers.show(monster.x, bodyY, damage, false, killed, element);
        if (killed) this.killMonster(monster);
        else this.particles.hit(monster.x, bodyY, this.character.x, this.character.y);
        return killed;
    }

    /** It dies: falls, drops its loot and gives its experience. */
    private killMonster(monster: OffMonster): void {
        const bodyY = monster.y - monster.def.base.bodyOffsetY;
        monster.kill();
        this.particles.death(monster.x, monster.y, bodyY);
        this.kills++;
        this.dropLoot(monster);
        this.gainExp(offKillExp(monster.exp, this.level), monster.x, bodyY);
    }

    /** The fire of a burning monster (Off-6B, as Survivors' CombatSystem.updateBurn): fire-coloured numbers, may stun or kill. */
    private updateBurn(monster: OffMonster, deltaMs: number): void {
        if (!monster.isAlive || !monster.isBurning) return;
        const damage = monster.tickBurn(deltaMs);
        if (damage <= 0) return;
        const killed = monster.hp <= 0;
        this.numbers.showColored(monster.x, monster.y - monster.def.base.bodyOffsetY, damage, ELEMENT_NUMBER_COLOR.fire, false, killed);
        if (killed) {
            this.killMonster(monster);
            this.audio.play(monster.def.base.deathSound);
        } else if (Math.random() < BURN.stunChance) {
            monster.stun(BURN.stunMs);
        }
    }

    // ---- Loot (Off-4A) ----

    /** What the monster drops falls on its tile. */
    private dropLoot(monster: OffMonster): void {
        const loot = rollKillLoot(monster.id, DEBUG_START.offDrop);
        if (this.ground.dropLoot(loot, Math.floor(monster.x / TILE_SIZE), Math.floor(monster.y / TILE_SIZE))) this.audio.play('sfx.itemDrop');
    }

    /** Something picked up from the ground; anything but 'ok' means it stays there (bag full, potion limit). */
    private pickUp(content: OffGroundContent): OffEquipResult {
        if ('gold' in content) {
            offSaveStore.addGold(content.gold);
            this.eventLine(OFF_LOOT_TEXT.gotGold(content.gold));
        } else {
            const result = offSaveStore.addToBag(content.item);
            if (result !== 'ok') return result;
            this.eventLine(OFF_LOOT_TEXT.gotItem(offBagItemName(content.item)));
        }
        this.audio.play('sfx.pickup');
        return 'ok';
    }

    // ---- Inventory (Off-4B) ----

    /**
     * Uses the item in that bag cell: gear goes on (if the STR is enough; the worn one goes back to the cell), a potion
     * is drunk (not when that bar is already full). The line for the bottom-left list says what happened.
     */
    public useBagItem(index: number): OffUseResult {
        const id = offSaveStore.character.bag[index];
        if (id === undefined) return { done: false };
        if (isOffItemId(id)) {
            const result = offSaveStore.equipFromBag(index);
            if (result === 'str') return { done: false, line: OFF_BAG_TEXT.needsStr(OFF_ITEMS[id].strToEquip) };
            if (result === 'level') return { done: false, line: OFF_BAG_TEXT.needsLevel(offItem(id).levelToEquip ?? 0) };
            if (result !== 'ok') return { done: false };
            this.audio.play('sfx.itemEquip');
            return { done: true, line: OFF_BAG_TEXT.equipped(OFF_ITEMS[id].name), gear: true };
        }
        const restores = offGood(id).restores;
        if (!restores) return { done: false, line: OFF_BAG_TEXT.cantUse(OFF_GOODS[id].name) };
        if (this.dead) return { done: false };
        const [now, max] = this.barOf(restores.what);
        if (now >= max) return { done: false, line: OFF_BAG_TEXT.alreadyFull(restores.what) };
        const [count, sides, bonus] = restores.dice;
        let roll = bonus;
        for (let i = 0; i < count; i++) roll += Phaser.Math.Between(1, sides);
        const gained = Math.min(roll, max - now);
        if (restores.what === 'hp') this.hp += gained;
        else if (restores.what === 'mana') this.vitals.mana += gained;
        else this.vitals.stamina += gained;
        offSaveStore.takeFromBag(index);
        this.audio.play('sfx.drink');
        const line = restores.what === 'hp' ? OFF_REGEN_TEXT.hpUp(gained) : restores.what === 'mana' ? OFF_REGEN_TEXT.mpUp(gained) : OFF_REGEN_TEXT.spUp(gained);
        this.eventLine(line);
        return { done: true, line };
    }

    /** Drops the item in that bag cell on the player's tile (not picked up again until the player comes back to it). */
    public dropBagItem(index: number): OffUseResult {
        const tile = this.playerTile();
        if (!tile) return { done: false };
        const id = offSaveStore.takeFromBag(index);
        if (id === undefined) return { done: false };
        this.ground.drop({ item: id }, tile.x, tile.y);
        this.audio.play('sfx.itemDrop');
        const line = OFF_BAG_TEXT.dropped(offBagItemName(id));
        this.eventLine(line);
        return { done: true, line };
    }

    /** Value and maximum of the bar a potion fills. */
    private barOf(what: OffPotionRestores): [number, number] {
        if (what === 'hp') return [this.hp, this.maxHp];
        if (what === 'mana') return [this.vitals.mana, this.vitals.maxMana];
        return [this.vitals.stamina, this.vitals.maxStamina];
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
        this.spells.cancel();
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
        // Off-5A: dying away from home, the scene takes the character to its city (it comes back to life there).
        if (!tile) return;
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
