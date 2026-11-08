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
// - Atributos del equipo (Off-7B, off/data/offAttributes.ts; `gearEffects`): Sharp / Ancient suben el daño, Poison
//   envenena (updatePoison, números verdes), Hitting Probability acierta más, Defense Ratio sube la defensa, Magic
//   Resistance da la probabilidad de librarse de la magia de un monstruo, las absorciones quitan parte del golpe y
//   Gold / Experience dan más. Critical da su % de golpe doble (Off-7C). Las Recovery, en OffVitals.
// - Pociones rápidas (Off-7B): drinkQuick bebe la poción más grande de vida o de maná que lleves (Q / E, cruceta).
// - Magias (Off-6B): las lanza OffSpells (`spells`); aquí su daño cae en el monstruo (spellHit) y pasa por lo mismo que
//   un golpe (hurtMonster: número, muerte, botín, experiencia). El fuego deja quemadura y el hielo frena, como en
//   Survivors. Un monstruo frenado o aturdido vive a su ritmo (OffMonster.timeScale).
// Magias (Off-6C): Heal suma vida (healPlayer); Defense Shield y Protection From Magic quedan en `protection` con su
//   tiempo (OFF_PROTECT: +40 de defensa, o el daño mágico a la mitad cuando haya monstruos que lancen magia); pasan de un
//   sitio a otro por los portales (OffCarriedVitals). Mientras duran, cada uno deja su aura bajo los pies (`wornEffect`,
//   propietario): Defense Shield la de Survivors (effect9) y Protection From Magic el círculo blanco del aura de viento. Hold Person y Paralyze los pone OffMonster.hold.
// Critical Strike (Off-8A): Alt / LT pide el golpe especial al monstruo bajo el ratón, al marcado o al más cercano
//   (critPressed). Gasta una carga al empezar el golpe (como el servidor), casi no falla (+100 al acierto), grita,
//   echa las chispas de Survivors y tiembla; el daño × (2 + nivel/30) sale en naranja y no tira el crítico al azar.
//   Las cargas, en OffCritStrike.
// Mercenario (Off-8B, OffMercenary + OffMercenaryAI): uno a la vez. Los monstruos van a por ti o a por él (`victim`);
//   sus golpes pasan por su defensa y su armadura como los tuyos. Su golpe hace que el monstruo vaya a por él a veces
//   (tanque). Lo que mata te da la mitad de experiencia (OFF_MERCENARY.killExpShare) y su botín entero. A 0 de vida cae
//   inconsciente 45 s. Tus Heal y escudos le llegan por `mercAlly`. Pasa por los portales contigo (OffCarriedVitals).
// Berserk (Off-8C): `berserkLeftMs` en ti y en el mercenario; los golpes normales hacen OFF_BERSERK.damageFactor (×2,
//   como el servidor) y el Critical Strike no. Brillo rojo mientras dura. La maga mercenaria lanza con su propio
//   OffSpells (OffMercenarySpells, `mercSpells`, uno por batalla que pasa de una maga a la siguiente); su maná se
//   recarga poco a poco (OFF_MERCENARY_CASTER) y lo que matan sus magias da la mitad de experiencia, como Gorn.
// Off-8D: tras su cabeza, sus frases (OffMercenaryTalk); al contratarlo dice "At your service!".
// Raiders (Off-9A, OffRaiderAI): solo donde el sitio los tiene (Promiseland, `raids`). Cada OFF_RAIDS.everyMs, si no
//   hay ninguno, una tirada trae 1 o 2 de la otra ciudad, fuera de la pantalla. Se les pega como a un monstruo (OffFoe:
//   clic, mando, magias, Critical Strike) y tu mercenario va primero a por ellos. Ellos van a por ti o a por él. Los
//   monstruos también les atacan (`raider0` / `raider1` en su `victim`), pero ellos no se distraen. Al morir sueltan
//   oro (nivel × OFF_RAIDS.goldPerLevel), sin experiencia. Si mueres, se van.
// Los mensajes ("Level Up!" y la lista de abajo a la izquierda) van a OffHudScene por los eventos de la escena.
import Phaser from 'phaser';
import { DEBUG_START } from '../../config/debugStart';
import { DEPTH_DAMAGE_NUMBERS, DEPTH_GROUND_SHADOWS, PLAYER_BODY_OFFSET_Y, TILE_SIZE } from '../../config/gameConfig';
import { smoothSprite } from '../../hb/XbrPipeline';
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
import { OFF_REGEN_TEXT, OFF_STAT_IDS, offManaRegen, offMaxHp, type OffStats } from '../data/offCharacter';
import { OFF_COMBAT, OFF_CRIT_STRIKE, offAttackMs, type OffWeaponDef } from '../data/offCombat';
import { CRIT_SHOUT, critDamageMultiplier, maxCritCharges } from '../../data/critStrike';
import { ScreenShake } from '../../systems/ScreenShake';
import { OffCritStrike } from './OffCritStrike';
import {
    isOffGearKey, offArmorDefense, offBagItemName, offPartAbsorb, offShieldAbsorb, offEquipmentEffects, offGearDef, offStrToEquip, offWeapon, type OffBagItemKey,
} from '../data/offItems';
import { OFF_ATTRIBUTES, type OffAttributeEffects } from '../data/offAttributes';
import { isOffGoodId, OFF_GOODS, offGood, offRollRestore, type OffPotionRestores } from '../data/offGoods';
import { OFF_BAG_TEXT } from '../data/offBag';
import { OFF_LOOT_TEXT } from '../data/offLoot';
import type { OffGroundContent } from '../entities/OffGroundItem';
import { OFF_LEVEL, OFF_LEVEL_TEXT, offDeathExpLoss, offKillExp, offLevelForExp } from '../data/offLevel';
import type { OffCharacter } from '../entities/OffCharacter';
import type { OffMonster } from '../entities/OffMonster';
import { isFromBehind, offArmorAbsorbed, offBlowPart, offHitChance, offPlayerHitRatio, offShieldSkill, rollMonsterDamage, rollWeaponDamage, tileDistance, weaponDamageRange } from './OffCombatRules';
import { rollSpellDamage } from './OffSpellRules';
import { provokeMonster, updateMonster, type OffMonsterWorld } from './OffMonsterAI';
import { OffGroundItems } from './OffGroundItems';
import { rollKillLoot } from './OffLootRoller';
import { OffPits } from './OffPits';
import type { OffPitDef } from '../data/offPits';
import { offSaveStore, type OffEquipResult } from './OffSaveStore';
import { OffVitals } from './OffVitals';
import { OffSpells, type OffSpellHost } from './OffSpells';
import { OFF_BERSERK, OFF_CAST_TEXT, OFF_CAST_WORDS, OFF_CASTING, OFF_HOLD, OFF_PROTECT, OFF_SPELLS, offPersonHoldMs, type OffSpellId } from '../data/offSpells';
import { BUFFS, BUFF_OVERLAY_ALPHA } from '../../data/pickups';
import { OffMercenarySpells, type OffMercenaryCastWorld } from './OffMercenarySpells';
import { OFF_HEAL_NUMBER_COLOR, OFF_WORN_ALPHA } from '../config/offSpellLook';
import { EFFECTS, type EffectDef, type EffectKey } from '../../config/effects';
import { directionTowards, findFreeTile, type TileMover, type TilePoint } from './TileMover';
import { OffMercenary, type OffCarriedMercenary } from '../entities/OffMercenary';
import { OFF_MERCENARIES, OFF_MERCENARY, OFF_MERCENARY_CASTER, OFF_MERCENARY_LOOK, OFF_MERCENARY_TEXT, type OffMercenaryId } from '../data/offMercenary';
import { updateMercenary, type OffMercenaryWorld, type OffOwnerNeeds } from './OffMercenaryAI';
import { updateMercenaryTalk } from './OffMercenaryTalk';
import { OFF_RAIDER_SLOTS, type OffRaiderSlot, type OffVictim } from './OffMonsterAI';
import type { OffSpellAlly } from './OffSpells';
import { foeBodyY, foeDefense, foeSize, isRaider, type OffFoe } from './OffFoe';
import { updateRaider, type OffRaiderWorld } from './OffRaiderAI';
import { OffRaiderSpells, type OffRaiderCastWorld } from './OffRaiderSpells';
import { OFF_RAIDER, OFF_RAIDER_BODIES, OFF_RAIDER_CRIT, OFF_RAIDER_LOOK, OFF_RAIDER_MAGE, OFF_RAIDER_NAMES, OFF_RAIDER_TEXT, OFF_RAIDS, offRaiderDef } from '../data/offRaiders';
import type { OffRaidVictim } from '../entities/OffMercenary';
import type { OffSpellDef } from '../data/offSpells';
import type { Direction } from '../../hb/directions';
import { rollResisted } from './OffSpellRules';
import type { OffFaction } from '../data/offPlaceIds';

/** Off-9A, ?offraid: the first raid comes this long after arriving. */
const OFF_RAID_DEBUG_MS = 3000;

/** Health, mana and stamina carried through a portal (Off-5A). */
export interface OffCarriedVitals {
    hp: number;
    mana: number;
    stamina: number;
    /** A shield spell still on (Off-6C). */
    protection?: OffProtection;
    /** The mercenary's health and time down (Off-8B). */
    merc?: OffCarriedMercenary;
    /** Berserk's time left (Off-8C). */
    berserkLeftMs?: number;
}

/** Defense Shield or Protection From Magic on the player, and the time it has left. */
export interface OffProtection {
    spell: OffSpellId;
    leftMs: number;
}

export interface OffUseResult {
    done: boolean;
    line?: string;
    /** Gear changed: the character is dressed again. */
    gear?: boolean;
}

/** The player's blow on the way: it lands on `monster` after `leftMs`. */
interface PendingBlow {
    monster: OffFoe;
    lands: boolean;
    leftMs: number;
    /** A Critical Strike (Off-8A). */
    crit: boolean;
}

/** Off-9A: a Raider slot: the one there (alive, or fallen until `goneLeftMs`), its spells (made once, reused) and its tile. */
interface RaiderSlot {
    raider: OffMercenary | undefined;
    goneLeftMs: number;
    spells: OffSpells | undefined;
    host: OffRaiderSpells | undefined;
    readonly tile: TilePoint;
}

export class OffBattle implements OffMonsterWorld, OffSpellHost, OffMercenaryWorld, OffMercenaryCastWorld, OffRaiderWorld, OffRaiderCastWorld {
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
    /** Critical blows so far (Off-7C; for `check offcrit`). */
    public criticalBlows = 0;
    /** Critical Strikes landed so far (Off-8A; for `check offcritstrike`). */
    public critStrikeBlows = 0;
    /** Development (`check offfarm`, Off-7D): what the hunt has given and cost since the world opened. */
    /** Development (`check offberserk`, Off-8C): normal blows' damage, with and without Berserk. */
    public readonly debugBlows = { plain: { sum: 0, count: 0 }, berserk: { sum: 0, count: 0 } };
    public readonly tally = { exp: 0, gold: 0, potions: 0, valuables: 0, hurt: 0, hits: 0, drunk: 0, absorbed: 0 };
    /** Monster (or Raider, Off-9A) chosen to attack (click, A, LB / RB). */
    public target: OffFoe | undefined;
    /** Monster (or Raider) under the mouse (its name shows). */
    public hovered: OffFoe | undefined;
    /** Off-9A: the Raider slots (OFF_RAIDER_SLOTS), the Raiders alive now, the time towards the next roll, and counts (checks). */
    private readonly raidSlots: RaiderSlot[] = OFF_RAIDER_SLOTS.map(() => ({ raider: undefined, goneLeftMs: 0, spells: undefined, host: undefined, tile: { x: 0, y: 0 } }));
    private readonly raiderList: OffMercenary[] = [];
    public raidClockMs = 0;
    private debugRaidPending = false;
    public readonly raidTally = { raids: 0, raiders: 0, killed: 0, byMonsters: 0, gold: 0 };
    public dead = false;
    /** Defense Shield or Protection From Magic (Off-6C; one at a time, as the server). */
    public protection: OffProtection | undefined;
    /** Off-8C: Berserk on you for this long (0 = none), and the glow showing (Off-9A: a hold's blue, or Berserk's red). */
    public berserkLeftMs = 0;
    private glowing: number | undefined;
    /** Off-9A: held by a Raider Mage's Hold Person / Paralyze for this long; its power (1 / 2), and holds you got (checks). */
    public heldLeftMs = 0;
    private heldPower = 0;
    public heldTimes = 0;
    /** Off-8C: the Mage's spells (made with the first Mage hired, then moved to each new one). */
    private mercSpells: OffSpells | undefined;
    private readonly ownerNeedsNow: OffOwnerNeeds = { hpShare: 1, shielded: false, berserk: false, casterNear: false, blowDamage: 1 };
    public readonly pits: OffPits;
    /** Loot lying on the ground (Off-4A). */
    public readonly ground: OffGroundItems;
    /** Spells: preparing, casting and their effects (Off-6B). */
    public readonly spells: OffSpells;
    /** Critical Strike charges (Off-8A). */
    public readonly critStrike: OffCritStrike;
    private readonly numbers: DamageNumbers;
    private readonly particles: HitParticles;
    private readonly effects: Pool<Effect>;
    /** A shield's look under the feet while it lasts (Protection From Magic's ring). */
    private readonly wornLook: Phaser.GameObjects.Sprite;
    private wornLookKey: EffectKey | undefined;
    /** One attack asked for (a click or a press) and not yet started. */
    private attackQueued = false;
    /** The button is held: attacks go on. */
    private attackHeld = false;
    /** The next blow is a Critical Strike (Alt / LT, Off-8A). */
    private critQueued = false;
    private readonly screenShake: ScreenShake;
    private cooldownMs = 0;
    private blow: PendingBlow | undefined;
    private respawnLeftMs = 0;
    private readonly playerAt: TilePoint = { x: 0, y: 0 };
    private readonly mercTileAt: TilePoint = { x: 0, y: 0 };
    /** Your mercenary (Off-8B), if one is hired. */
    public merc: OffMercenary | undefined;
    /** A way round houses and walls (the scene's pathfinder), for the mercenary. */
    public findPath: OffMercenaryWorld['findPath'] = () => undefined;
    /** The mercenary's pose: running this frame. */
    private mercRunning = false;

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
        /** Off-9A: Raiders come here (Promiseland). */
        private readonly raidsHere = false,
    ) {
        const saved = offSaveStore.character;
        this.exp = saved.exp;
        this.points = saved.points;
        this.level = offLevelForExp(this.exp);
        this.hp = this.maxHp;
        const charges = DEBUG_START.offCrit ?? saved.critCharges ?? maxCritCharges(this.level);
        this.critStrike = new OffCritStrike(charges, (n) => offSaveStore.setCritCharges(n));
        this.screenShake = new ScreenShake(scene.cameras.main);
        this.vitals = new OffVitals(this, (line) => this.scene.events.emit(EVENT_LIST_EVENT, line));
        if (carried) {
            this.hp = Math.min(this.maxHp, Math.max(1, carried.hp));
            this.vitals.mana = Math.min(this.vitals.maxMana, carried.mana);
            this.vitals.stamina = Math.min(this.vitals.maxStamina, carried.stamina);
            this.protection = carried.protection ? { ...carried.protection } : undefined;
            this.berserkLeftMs = Math.max(0, carried.berserkLeftMs ?? 0);
        } else if (DEBUG_START.offHp !== undefined) {
            this.hp = Math.min(this.maxHp, Math.max(1, DEBUG_START.offHp));
        }
        this.numbers = new DamageNumbers(scene);
        this.particles = new HitParticles(scene);
        this.effects = new Pool(() => new Effect(scene));
        this.wornLook = smoothSprite(scene.add.sprite(0, 0, '__DEFAULT')).setVisible(false).setDepth(DEPTH_GROUND_SHADOWS + 1);
        this.pits = new OffPits(scene, pits, (x, y) => this.isFree(x, y));
        this.pits.fillAll();
        this.spells = new OffSpells(scene, this, mover, character, audio);
        this.ground = new OffGroundItems(scene, (content) => this.pickUp(content), (reason) => this.eventLine(reason === 'potionLimit' ? OFF_LOOT_TEXT.potionLimit : OFF_LOOT_TEXT.bagFull));
        if (saved.mercenary) this.addMercenary(saved.mercenary, carried?.merc);
        // Off-9A, ?offraid: the first raid comes a few seconds after arriving (and surely).
        if (DEBUG_START.offRaid && raidsHere) {
            this.raidClockMs = OFF_RAIDS.everyMs - OFF_RAID_DEBUG_MS;
            this.debugRaidPending = true;
        }
    }

    // ---- The mercenary (Off-8B) ----

    /** Hires one (it replaces the one there was) for its price; false without the gold. */
    public hireMercenary(id: OffMercenaryId, price: number): boolean {
        if (!offSaveStore.hireMercenary(id, price)) {
            this.eventLine(OFF_MERCENARY_TEXT.noGold);
            return false;
        }
        this.removeMercenary();
        this.addMercenary(id);
        this.merc?.say('hired', true);
        this.eventLine(OFF_MERCENARY_TEXT.hired(OFF_MERCENARIES[id].name));
        return true;
    }

    public dismissMercenary(): void {
        const merc = this.merc;
        if (!merc) return;
        offSaveStore.dismissMercenary();
        this.removeMercenary();
        this.eventLine(OFF_MERCENARY_TEXT.dismissed(merc.def.name));
    }

    /** It appears at your side (with what it brought through a portal). */
    private addMercenary(id: OffMercenaryId, carried?: OffCarriedMercenary): void {
        const tile = this.freeTileNear(this.mover.tileX, this.mover.tileY) ?? { x: this.mover.tileX, y: this.mover.tileY };
        const merc = new OffMercenary(this.scene, id, (x, y) => this.isFreeForMerc(x, y), tile.x, tile.y, this.level);
        if (carried) merc.carry(carried);
        if (merc.isCaster) {
            if (this.mercSpells) this.mercSpells.attach(merc.mover, merc.character);
            else this.mercSpells = new OffSpells(this.scene, new OffMercenarySpells(this), merc.mover, merc.character, this.audio);
            merc.spells = this.mercSpells;
        }
        this.merc = merc;
    }

    private removeMercenary(): void {
        this.merc?.spells?.cancel();
        this.merc?.destroy();
        this.merc = undefined;
        for (const monster of this.pits.monsters) {
            if (monster.victim === 'merc') monster.victim = 'player';
        }
        for (const raider of this.raiderList) raider.victim = 'player';
    }

    /** What the mercenary takes through a portal. */
    public carriedMerc(): OffCarriedMercenary | undefined {
        return this.merc?.carried();
    }

    /** The mercenary standing (drawn) under a point of the world, if it is up. */
    public mercAt(px: number, py: number): OffMercenary | undefined {
        const merc = this.merc;
        return merc && !merc.isDown && merc.contains(px, py) ? merc : undefined;
    }

    /** Your Heal and shields on the mercenary (Off-8B). */
    public mercAlly(): OffSpellAlly | undefined {
        const merc = this.merc;
        if (!merc || merc.isDown) return undefined;
        return {
            x: merc.x,
            y: merc.y,
            heal: (amount) => this.healMerc(merc, amount),
            protect: (spell) => this.protectMerc(merc, spell),
            enrage: (ms) => this.enrageMerc(merc, ms),
        };
    }

    public protectMerc(merc: OffMercenary, spell: OffSpellId): boolean {
        if (merc.protection || merc.isDown) return false;
        merc.protection = { spell, leftMs: (OFF_SPELLS[spell].durationSec ?? 0) * 1000 };
        this.eventLine(OFF_MERCENARY_TEXT.shieldOn(OFF_SPELLS[spell].name, merc.def.name));
        return true;
    }

    public enrageMerc(merc: OffMercenary, durationMs: number): boolean {
        if (merc.isBerserk || merc.isDown) return false;
        merc.berserkLeftMs = durationMs;
        this.eventLine(OFF_MERCENARY_TEXT.berserkOn(merc.def.name));
        return true;
    }

    // ---- OffMercenaryCastWorld (Off-8C, the Mage's spells) ----

    public mercSpellHit(monster: OffFoe, damage: number, element: SpellElement | undefined): void {
        if (this.spellLands(monster, damage, element, 'merc')) this.merc?.addKill();
    }

    public mercCastFailed(merc: OffMercenary): void {
        this.numbers.showWord(merc.x, merc.y - PLAYER_BODY_OFFSET_Y, OFF_CAST_WORDS.failed);
        merc.character.act(PlayerState.Hurt, merc.mover.facing, OFF_CASTING.failFlinchMs);
    }

    /** Off-8C: what the Mage looks at before casting on you (the same object every frame). */
    public ownerNeeds(): OffOwnerNeeds | undefined {
        if (this.dead) return undefined;
        const needs = this.ownerNeedsNow;
        needs.hpShare = this.hp / Math.max(1, this.maxHp);
        needs.shielded = this.protection !== undefined;
        needs.berserk = this.berserkLeftMs > 0;
        // A monster that casts in the pit of any monster near you (the owner: by pit, so the shield is on before it comes).
        const range = OFF_MERCENARY_CASTER.casterNearTiles;
        const monsters = this.pits.monsters;
        needs.casterNear = monsters.some((c) => c.isAlive && c.def.spell !== undefined
            && monsters.some((m) => m.isAlive && m.pit === c.pit && this.distanceTo(m) <= range));
        const { min, max } = weaponDamageRange(this.weapon, this.stats.str, 1 + (this.gearEffects.damage ?? 0));
        needs.blowDamage = (min + max) / 2;
        return needs;
    }

    /** Off-8C: loot near you that has lain on the ground a while, for the mercenary to pick up. */
    public lootFor(merc: OffMercenary): TilePoint | undefined {
        const owner = this.playerTile();
        if (!owner) return undefined;
        const item = this.ground.forMerc(merc.mover.tileX, merc.mover.tileY, owner, OFF_MERCENARY.lootWaitMs, OFF_MERCENARY.lootTiles);
        return item ? { x: item.tileX, y: item.tileY } : undefined;
    }

    /** Off-8C: the mercenary takes what lies there for you (your bag and gold, with its line). */
    public mercPicksUp(merc: OffMercenary, x: number, y: number): void {
        this.ground.pickUpByMerc(x, y, (content) => this.pickUp(content, merc.def.name));
    }

    public mercGivesUpLoot(x: number, y: number): void {
        this.ground.mercGivesUp(x, y);
    }

    /** Off-8C: you, as the target of the Mage's Heal, shields and Berserk. */
    public ownerAlly(): OffSpellAlly | undefined {
        if (this.dead) return undefined;
        return {
            x: this.character.x,
            y: this.character.y,
            heal: (amount) => this.healPlayer(amount),
            protect: (spell) => this.protect(spell),
            enrage: (ms) => this.enrage(ms),
        };
    }

    public healMerc(merc: OffMercenary, amount: number): number {
        if (merc.isDown) return 0;
        const gained = Math.min(amount, merc.maxHp - merc.hp);
        if (gained <= 0) return 0;
        merc.hp += gained;
        this.numbers.showColored(merc.x, merc.y - PLAYER_BODY_OFFSET_Y, gained, OFF_HEAL_NUMBER_COLOR);
        return gained;
    }

    /** Off-8E: its batch of health or its own potion (with the drinking sound). */
    public mercHeals(merc: OffMercenary, amount: number, drink: boolean): number {
        if (drink) this.audio.play('sfx.drink');
        return this.healMerc(merc, amount);
    }

    /** Tile the mercenary may step onto: walkable, no monster, no Raider and not you. */
    private isFreeForMerc(x: number, y: number): boolean {
        if (!this.isWalkable(x, y) || this.monsterOn(x, y) || this.raiderOn(x, y)) return false;
        const mover = this.mover;
        return !((mover.tileX === x && mover.tileY === y) || (mover.nextTileX === x && mover.nextTileY === y));
    }

    // ---- OffMercenaryWorld ----

    public ownerTile(): TilePoint | undefined {
        return this.playerTile();
    }

    public ownerTarget(): OffFoe | undefined {
        return this.target?.isAlive ? this.target : undefined;
    }

    public get monsters(): readonly OffMonster[] {
        return this.pits.monsters;
    }

    /** Off-9A: the Raiders alive here now. */
    public get raiders(): readonly OffMercenary[] {
        return this.raiderList;
    }

    public mercCanStand(x: number, y: number): boolean {
        return this.isFreeForMerc(x, y);
    }

    public freeTileNear(x: number, y: number): TilePoint | undefined {
        return findFreeTile((tx, ty) => this.isFreeForMerc(tx, ty) && (tx !== x || ty !== y), x, y, OFF_MERCENARY.followStopTiles + 2);
    }

    public mercSwings(): void {
        this.audio.play('sfx.melee.swing');
    }

    public mercStandsUp(merc: OffMercenary): void {
        this.eventLine(OFF_MERCENARY_TEXT.up(merc.def.name));
    }

    /** Its brain, its blow on the way, its shield's time and its look. */
    private updateMerc(deltaMs: number): void {
        const merc = this.merc;
        if (!merc) return;
        if (merc.level !== this.level) merc.setLevel(this.level);
        this.mercRunning = updateMercenary(merc, deltaMs, this);
        // Off-8D: its lines ("Heal me!", "Zerk me!"...).
        updateMercenaryTalk(merc, this);
        const blow = merc.blow;
        if (blow) {
            blow.leftMs -= deltaMs;
            if (blow.leftMs <= 0) {
                merc.blow = undefined;
                this.mercLandsBlow(merc, blow.monster, blow.lands);
            }
        }
        const protection = merc.protection;
        if (protection) {
            protection.leftMs -= deltaMs;
            if (protection.leftMs <= 0) merc.protection = undefined;
        }
        merc.berserkLeftMs = Math.max(0, merc.berserkLeftMs - deltaMs);
        if (merc.isCaster && !merc.isDown) this.regenMercMana(merc, deltaMs);
        merc.sync(deltaMs, this.mercRunning);
    }

    /** The Mage's mana comes back in batches of 1d(MAG), as a player's, but twice as often, also fighting (OFF_MERCENARY_CASTER). */
    private regenMercMana(merc: OffMercenary, deltaMs: number): void {
        if (merc.mana >= merc.maxMana) {
            merc.manaRegenMs = 0;
            return;
        }
        merc.manaRegenMs += deltaMs;
        if (merc.manaRegenMs < OFF_MERCENARY_CASTER.manaRegenMs) return;
        merc.manaRegenMs = 0;
        merc.mana = Math.min(merc.maxMana, merc.mana + offManaRegen(merc.stats.mag));
    }

    /** Its blow lands: medium damage; the monster may turn on it (it tanks). */
    private mercLandsBlow(merc: OffMercenary, monster: OffFoe, lands: boolean): void {
        if (!monster.isAlive || merc.isDown) return;
        if (!lands) {
            this.numbers.showWord(monster.x, foeBodyY(monster), 'Miss');
            return;
        }
        // Off-8C: Berserk doubles its blows too.
        const factor = merc.def.damageFactor * (merc.isBerserk ? OFF_BERSERK.damageFactor : 1);
        const damage = rollWeaponDamage(merc.weapon, foeSize(monster), merc.stats.str, factor);
        this.audio.play('sfx.melee.hit');
        // Off-9A: on a Raider (it may turn on Gorn, OFF_RAIDER.switchChance).
        if (isRaider(monster)) {
            if (this.hurtRaider(monster, damage, 'merc', false)) merc.addKill();
            return;
        }
        const killed = this.hurtMonster(monster, damage, undefined, false, 'merc', false);
        this.audio.play(killed ? monster.def.base.deathSound : monster.def.base.hitSound);
        if (killed) {
            merc.addKill();
            return;
        }
        if (monster.victim === 'player' && Math.random() < OFF_MERCENARY.tauntChance) monster.victim = 'merc';
    }

    /** Health off the mercenary; at 0 it falls unconscious. */
    private hurtMerc(merc: OffMercenary, damage: number, magic = false): void {
        if (damage <= 0 || merc.isDown) return;
        merc.hitBreaksHold(magic);
        merc.hp = Math.max(0, merc.hp - damage);
        // Off-9A: hurt while casting (Kaila), the spell is lost.
        if (merc.spells?.interrupt()) merc.castFor = undefined;
        const y = merc.y - PLAYER_BODY_OFFSET_Y;
        this.numbers.showColored(merc.x, y, damage, OFF_MERCENARY_LOOK.damageColor, false, merc.hp === 0);
        this.spawnEffect('fx.hit', merc.x, y);
        if (merc.hp === 0) {
            merc.fall();
            this.eventLine(OFF_MERCENARY_TEXT.down(merc.def.name));
            return;
        }
        if (!merc.character.isActing && !merc.mover.isMoving) merc.character.act(PlayerState.Hurt, merc.mover.facing, OFF_COMBAT.playerHurtMs);
    }

    /** What is left of a monster's blow after the mercenary's armour and shield (as armorAbsorbed). */
    private mercArmorAbsorbed(merc: OffMercenary, damage: number): number {
        const slot = offBlowPart(Math.random());
        const part = slot ? offPartAbsorb(merc.equipment, slot) : 0;
        const shield = Phaser.Math.Between(1, 100) <= offShieldSkill(merc.stats.dex) ? offShieldAbsorb(merc.equipment) : 0;
        return offArmorAbsorbed(damage, part, shield);
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

    /** What the worn gear's attributes add (Off-7B). */
    public get gearEffects(): OffAttributeEffects {
        return offEquipmentEffects(offSaveStore.character.equipment);
    }

    /** Hit ratio of the player's blows (Off-7C): DEX's weapon skill and bonus, times Hitting Probability. */
    public get hitRatio(): number {
        return offPlayerHitRatio(this.stats.dex, this.gearEffects.hitting ?? 0);
    }

    /**
     * Defence against monsters: 2 × DEX and the worn armour (original), and Defense Shield's (Off-6C); all of it times
     * a Defense Ratio attribute (Off-7B).
     */
    public get defense(): number {
        const power = this.protection ? OFF_SPELLS[this.protection.spell].power ?? 0 : 0;
        const base = this.stats.dex * 2 + offArmorDefense(offSaveStore.character.equipment) + (OFF_PROTECT.defenseByPower[power] ?? 0);
        return Math.floor(base * (1 + (this.gearEffects.defenseRatio ?? 0)));
    }

    /**
     * Off-7D: what is left of a monster's blow after the armour on the body part it falls on (with the Physical
     * Absorption attribute, Off-7B, added to it) and, when the shield skill roll works, the shield (OFF_ARMOR).
     */
    private armorAbsorbed(damage: number): number {
        const equipment = offSaveStore.character.equipment;
        const slot = offBlowPart(Math.random());
        const attribute = Math.min(OFF_ATTRIBUTES.maxAbsorption, this.gearEffects.physicalAbsorption ?? 0) * 100;
        const part = (slot ? offPartAbsorb(equipment, slot) : 0) + attribute;
        const shield = Phaser.Math.Between(1, 100) <= offShieldSkill(this.stats.dex) ? offShieldAbsorb(equipment) : 0;
        const left = offArmorAbsorbed(damage, part, shield);
        this.tally.absorbed += damage - left;
        return left;
    }

    /** Share of a monster's spell the gear's Magic Absorption takes away (Off-7B), never above the cap. */
    private absorbed(damage: number, share: number | undefined): number {
        if (damage <= 0 || !share) return damage;
        return Math.max(1, Math.round(damage * (1 - Math.min(OFF_ATTRIBUTES.maxAbsorption, share))));
    }

    /** What magic damage on the player is multiplied by: half with Protection From Magic (server; the Cyclops, Off-7A). */
    public get magicDamageFactor(): number {
        const power = this.protection ? OFF_SPELLS[this.protection.spell].power ?? 0 : 0;
        return OFF_PROTECT.magicHalvedPowers.includes(power) ? OFF_PROTECT.magicDamageFactor : 1;
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
        return !this.dead && !this.character.isActing && !this.isHeld;
    }

    /** Off-9A: held by Hold Person / Paralyze: no walking, no blows (potions and spells still go). */
    public get isHeld(): boolean {
        return this.heldLeftMs > 0;
    }

    /**
     * Off-9A: a Raider Mage's hold on you (`power` 1 Hold Person, 2 Paralyze), for OFF_HOLD.personMs. You may shrug it
     * off (OFF_HOLD.personResist against its hit, and a Magic Resistance attribute). False when it had no effect.
     */
    private holdPlayer(spell: OffSpellDef, hit: number): boolean {
        if (this.dead || this.isHeld) return false;
        const effects = this.gearEffects;
        if (rollResisted(hit, OFF_HOLD.personResist) || (effects.magicResistance && Math.random() < effects.magicResistance)) {
            this.numbers.showWord(this.character.x, this.character.y - PLAYER_BODY_OFFSET_Y, 'Resist');
            this.eventLine(OFF_CAST_TEXT.resistedHold(spell.name));
            return false;
        }
        this.heldLeftMs = offPersonHoldMs(spell.power ?? 0);
        this.heldPower = spell.power ?? 0;
        this.heldTimes++;
        this.blow = undefined;
        this.stopAttacking();
        this.mover.cancel();
        this.numbers.showWord(this.character.x, this.character.y - PLAYER_BODY_OFFSET_Y, OFF_CAST_WORDS.held);
        this.eventLine(OFF_CAST_TEXT.held(spell.name));
        return true;
    }

    /** Off-9A: a hold on you ends early only with a blow, and only Hold Person (spells don't end it on a person, OFF_HOLD). */
    private breakPlayerHold(magic: boolean): void {
        if (this.isHeld && !magic && this.heldPower <= OFF_HOLD.breaksOnBlow) this.freePlayer();
    }

    private freePlayer(): void {
        this.heldLeftMs = 0;
        this.eventLine(OFF_CAST_TEXT.heldOff);
    }

    // ---- OffSpellHost (Off-6B) ----

    public knows(id: OffSpellId): boolean {
        return offSaveStore.character.spells.includes(id);
    }

    /** The server only lets a wand be held while casting (Off has none): empty hands. */
    public handsRefusal(): string | undefined {
        const equipment = offSaveStore.character.equipment;
        if (equipment.weapon !== undefined) return OFF_CAST_TEXT.weapon;
        if (equipment.shield !== undefined) return OFF_CAST_TEXT.shield;
        return undefined;
    }

    /** Off-8C: Berserk on you (no effect while it is on). */
    public enrage(durationMs: number): boolean {
        if (this.dead || this.berserkLeftMs > 0) return false;
        this.berserkLeftMs = durationMs;
        this.eventLine(OFF_CAST_TEXT.berserkOn);
        return true;
    }

    public get mana(): number {
        return this.vitals.mana;
    }

    public spendMana(amount: number): void {
        this.vitals.mana = Math.max(0, this.vitals.mana - amount);
    }

    /** Monsters and (Off-9A) Raiders in a spell's area. */
    public monstersAround(tileX: number, tileY: number, range: number): OffFoe[] {
        const near = (m: OffFoe) => m.isAlive && Math.abs(m.mover.tileX - tileX) <= range && Math.abs(m.mover.tileY - tileY) <= range;
        return [...this.pits.monsters.filter(near), ...this.raiderList.filter(near)];
    }

    public spellHit(monster: OffFoe, damage: number, element: SpellElement | undefined): void {
        this.spellLands(monster, damage, element, 'player');
    }

    /** A spell's damage, yours or the Mage's (`by`): sound, burn, ice. Returns whether it killed. */
    private spellLands(monster: OffFoe, damage: number, element: SpellElement | undefined, by: OffVictim): boolean {
        // Off-9A: a Raider only takes the damage (no burn or ice on people for now).
        if (isRaider(monster)) return this.hurtRaider(monster, damage, by === 'merc' ? 'merc' : 'player', true, element);
        const killed = this.hurtMonster(monster, damage, element, false, by, true);
        this.audio.play(killed ? monster.def.base.deathSound : monster.def.base.hitSound);
        if (killed) return true;
        if (element === 'fire') monster.burn(damage * BURN.shareOfHit);
        if (element === 'ice') monster.slow();
        return false;
    }

    public spellResisted(monster: OffFoe): void {
        if (!isRaider(monster)) provokeMonster(monster);
        this.numbers.showWord(monster.x, foeBodyY(monster), OFF_CAST_WORDS.resisted);
    }

    public healPlayer(amount: number): void {
        if (this.dead) return;
        const gained = Math.min(amount, this.maxHp - this.hp);
        if (gained <= 0) return;
        this.hp += gained;
        this.numbers.showColored(this.character.x, this.character.y - PLAYER_BODY_OFFSET_Y, gained, OFF_HEAL_NUMBER_COLOR);
        this.eventLine(OFF_REGEN_TEXT.hpUp(gained));
    }

    public protect(spell: OffSpellId): boolean {
        if (this.protection) return false;
        this.protection = { spell, leftMs: (OFF_SPELLS[spell].durationSec ?? 0) * 1000 };
        this.eventLine(OFF_CAST_TEXT.shieldOn(OFF_SPELLS[spell].name));
        return true;
    }

    public spellHeld(monster: OffFoe): void {
        if (!isRaider(monster)) provokeMonster(monster);
        this.numbers.showWord(monster.x, foeBodyY(monster), OFF_CAST_WORDS.held);
    }

    public castFailed(): void {
        this.numbers.showWord(this.character.x, this.character.y - PLAYER_BODY_OFFSET_Y, OFF_CAST_WORDS.failed);
        this.character.act(PlayerState.Hurt, this.mover.facing, OFF_CASTING.failFlinchMs);
    }

    public eventLine(line: string): void {
        this.scene.events.emit(EVENT_LIST_EVENT, line);
    }

    // ---- What the scene tells it ----

    /** Alive monster (or Raider, Off-9A) drawn under a point of the world (the one in front when several overlap), if any. */
    public monsterAt(px: number, py: number): OffFoe | undefined {
        let best: OffFoe | undefined;
        for (const monster of this.pits.monsters) {
            if (monster.isAlive && monster.contains(px, py) && (!best || monster.y > best.y)) best = monster;
        }
        for (const raider of this.raiderList) {
            if (raider.contains(px, py) && (!best || raider.y > best.y)) best = raider;
        }
        return best;
    }

    /** Attack this monster (a click on it): one blow, more while `held`. */
    public engage(monster: OffFoe, held: boolean): void {
        if (this.dead) return;
        // Another monster: a Critical Strike asked for goes with the mark.
        if (monster !== this.target) this.critQueued = false;
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

    /**
     * Alt / LT (Off-8A): the next blow is a Critical Strike, on the monster under the mouse, the marked one or the
     * nearest. Nothing happens with no charge or no monster near.
     */
    public critPressed(): void {
        if (this.dead || this.critStrike.charges <= 0) return;
        const hovered = this.hovered?.isAlive ? this.hovered : undefined;
        const marked = this.target?.isAlive && this.distanceTo(this.target) <= OFF_COMBAT.targetRangeTiles ? this.target : undefined;
        const monster = hovered ?? marked ?? this.nearbyMonsters()[0];
        if (!monster) return;
        this.target = monster;
        this.attackQueued = true;
        this.critQueued = true;
    }

    /** Whether the attack button (or the click on a monster) is still held. */
    public setHeld(held: boolean): void {
        this.attackHeld = held;
    }

    /** Moving on: no more blows (the mark stays, for the gamepad). */
    public stopAttacking(): void {
        this.attackQueued = false;
        this.attackHeld = false;
        this.critQueued = false;
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

    /** A gamepad spell's monster (Off-6C): the marked one if it is alive, else the nearest within reach. */
    public spellTarget(): OffFoe | undefined {
        if (this.target?.isAlive) return this.target;
        return this.nearbyMonsters()[0];
    }

    /** Tile the player may step onto: walkable and nobody there. */
    public isFreeForPlayer(x: number, y: number): boolean {
        return this.isWalkable(x, y) && !this.monsterOn(x, y) && !this.raiderOn(x, y);
    }

    public update(deltaMs: number): void {
        if (this.dead) this.updateDead(deltaMs);
        else this.updateAttack(deltaMs);
        this.spells.update(deltaMs);
        this.mercSpells?.update(deltaMs);
        this.updateMerc(deltaMs);
        this.updateRaids(deltaMs);
        this.vitals.update(deltaMs);
        this.critStrike.update(deltaMs, this.level);
        this.updateProtection(deltaMs);
        this.updateBerserk(deltaMs);
        this.hp = Math.min(this.hp, this.maxHp);
        for (const monster of this.pits.monsters) {
            this.updateBurn(monster, deltaMs);
            this.updatePoison(monster, deltaMs);
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

    /** The shield's time runs out; its look follows the feet meanwhile. */
    private updateProtection(deltaMs: number): void {
        const protection = this.protection;
        if (protection) {
            protection.leftMs -= deltaMs;
            if (protection.leftMs <= 0) {
                this.protection = undefined;
                this.eventLine(OFF_CAST_TEXT.shieldOff(OFF_SPELLS[protection.spell].name));
            }
        }
        this.updateWornLook();
    }

    /** Berserk's time runs out (with its line); the red glow shows while it lasts (Off-8C). */
    private updateBerserk(deltaMs: number): void {
        if (this.berserkLeftMs > 0) {
            this.berserkLeftMs = Math.max(0, this.berserkLeftMs - deltaMs);
            if (this.berserkLeftMs === 0) this.eventLine(OFF_CAST_TEXT.berserkOff);
        }
        // Off-9A: a hold on you runs out too.
        if (this.heldLeftMs > 0) {
            this.heldLeftMs = Math.max(0, this.heldLeftMs - deltaMs);
            if (this.heldLeftMs === 0) this.freePlayer();
        }
        const glow = this.isHeld ? OFF_HOLD.personTint : this.berserkLeftMs > 0 ? BUFFS.berserk.overlayTint : undefined;
        if (glow !== this.glowing) {
            this.glowing = glow;
            this.character.setGlow(glow, BUFF_OVERLAY_ALPHA);
        }
    }

    private updateWornLook(): void {
        const key = this.protection ? OFF_SPELLS[this.protection.spell].wornEffect : undefined;
        if (key !== this.wornLookKey) {
            this.wornLookKey = key;
            if (key && this.scene.anims.exists(key)) this.wornLook.setVisible(true).setAlpha(OFF_WORN_ALPHA[key] ?? 1).play(key);
            else this.wornLook.setVisible(false).stop();
        }
        if (this.wornLook.visible && key) {
            const def: EffectDef = EFFECTS[key];
            this.wornLook.setPosition(this.character.x + (def.offsetX ?? 0), this.character.y + (def.offsetY ?? 0));
        }
    }

    // ---- OffMonsterWorld ----

    public victimTile(victim: OffVictim): TilePoint | undefined {
        if (victim === 'player') return this.playerTile();
        if (victim !== 'merc') {
            // Off-9A: a Raider, by its slot.
            const slot = this.raidSlots[OFF_RAIDER_SLOTS.indexOf(victim)];
            const raider = slot?.raider;
            if (!slot || !raider?.isAlive) return undefined;
            slot.tile.x = raider.mover.tileX;
            slot.tile.y = raider.mover.tileY;
            return slot.tile;
        }
        const merc = this.merc;
        if (!merc || merc.isDown) return undefined;
        this.mercTileAt.x = merc.mover.tileX;
        this.mercTileAt.y = merc.mover.tileY;
        return this.mercTileAt;
    }

    public playerTile(): TilePoint | undefined {
        if (this.dead) return undefined;
        this.playerAt.x = this.mover.tileX;
        this.playerAt.y = this.mover.tileY;
        return this.playerAt;
    }

    public wanderArea(monster: OffMonster): TileRect {
        return this.pits.wanderArea(monster.pit);
    }

    /** Tile a monster may step onto: walkable, no monster, no Raider, not the player and not the mercenary. */
    public isFree(x: number, y: number): boolean {
        if (!this.isWalkable(x, y) || this.monsterOn(x, y) || this.raiderOn(x, y)) return false;
        const merc = this.merc?.mover;
        if (merc && ((merc.tileX === x && merc.tileY === y) || (merc.nextTileX === x && merc.nextTileY === y))) return false;
        if (this.dead) return true;
        const mover = this.mover;
        return !((mover.tileX === x && mover.tileY === y) || (mover.nextTileX === x && mover.nextTileY === y));
    }

    public rollHitOnVictim(monster: OffMonster): boolean {
        this.audio.play(monster.def.base.attackSound);
        const raider = this.raiderOfVictim(monster.victim);
        if (raider) return Math.random() < offHitChance(monster.def.base.hitRatio, raider.defense, isFromBehind(monster.mover.facing, raider.mover.facing));
        const merc = this.merc;
        if (monster.victim === 'merc' && merc) return Math.random() < offHitChance(monster.def.base.hitRatio, merc.defense, isFromBehind(monster.mover.facing, merc.mover.facing));
        return Math.random() < offHitChance(monster.def.base.hitRatio, this.defense, isFromBehind(monster.mover.facing, this.mover.facing));
    }

    public monsterStrikes(monster: OffMonster, lands: boolean): void {
        if (monster.victim !== 'player' && monster.victim !== 'merc') {
            // Off-9A: on a Raider (through its armour, as on your mercenary).
            const raider = this.raiderOfVictim(monster.victim);
            if (!raider) return;
            if (!lands) this.numbers.showWord(raider.x, raider.y - PLAYER_BODY_OFFSET_Y, 'Miss');
            else this.hurtRaider(raider, this.mercArmorAbsorbed(raider, rollMonsterDamage(monster.def.base.damageDice, raider.stats.vit)), 'monster', false);
            return;
        }
        const merc = this.merc;
        if (monster.victim === 'merc') {
            if (!merc || merc.isDown) return;
            if (!lands) this.numbers.showWord(merc.x, merc.y - PLAYER_BODY_OFFSET_Y, 'Miss');
            else this.hurtMerc(merc, this.mercArmorAbsorbed(merc, rollMonsterDamage(monster.def.base.damageDice, merc.stats.vit)));
            return;
        }
        if (this.dead) return;
        const x = this.character.x;
        const y = this.character.y - PLAYER_BODY_OFFSET_Y;
        if (!lands) {
            this.numbers.showWord(x, y, 'Miss');
            return;
        }
        this.hurtPlayer(this.armorAbsorbed(rollMonsterDamage(monster.def.base.damageDice, this.stats.vit)));
    }

    /**
     * A monster's spell (Off-7A, the Cyclops): it flies to where the player was. On arrival, the direct roll if the
     * player is still on that tile and the area roll within its range (like the player's spells on monsters), each
     * halved by Protection From Magic. Off-7B: a Magic Resistance attribute is the chance it misses ("Resist"); Magic
     * Absorption takes a share off.
     */
    public monsterCasts(monster: OffMonster, at: TilePoint): void {
        const id = monster.def.spell;
        if (!id) return;
        const def = OFF_SPELLS[id];
        const merc = this.merc;
        if (monster.victim !== 'player' && monster.victim !== 'merc') {
            // Off-9A: at a Raider (the Cyclops), as at your mercenary.
            const raider = this.raiderOfVictim(monster.victim);
            if (!raider) return;
            this.spells.monsterCast(def, monster.x, monster.y, raider.x, raider.y - PLAYER_BODY_OFFSET_Y, () => {
                if (!raider.isAlive) return;
                const distance = tileDistance(raider.mover.tileX, raider.mover.tileY, at.x, at.y);
                let damage = 0;
                if (def.direct && distance === 0) damage += rollSpellDamage(def.direct, 0, 'neutral');
                if (def.area && def.areaRange !== undefined && distance <= def.areaRange) damage += rollSpellDamage(def.area, 0, 'neutral');
                if (damage > 0) this.hurtRaider(raider, Math.max(1, Math.round(damage * this.personMagicFactor(raider))), 'monster', true);
            });
            return;
        }
        if (monster.victim === 'merc') {
            if (!merc || merc.isDown) return;
            this.spells.monsterCast(def, monster.x, monster.y, merc.x, merc.y - PLAYER_BODY_OFFSET_Y, () => {
                if (merc.isDown || this.merc !== merc) return;
                const distance = tileDistance(merc.mover.tileX, merc.mover.tileY, at.x, at.y);
                let damage = 0;
                if (def.direct && distance === 0) damage += rollSpellDamage(def.direct, 0, 'neutral');
                if (def.area && def.areaRange !== undefined && distance <= def.areaRange) damage += rollSpellDamage(def.area, 0, 'neutral');
                const power = merc.protection ? OFF_SPELLS[merc.protection.spell].power ?? 0 : 0;
                const factor = OFF_PROTECT.magicHalvedPowers.includes(power) ? OFF_PROTECT.magicDamageFactor : 1;
                if (damage > 0) this.hurtMerc(merc, Math.max(1, Math.round(damage * factor)), true);
            });
            return;
        }
        if (this.dead) return;
        const toX = this.character.x;
        const toY = this.character.y - PLAYER_BODY_OFFSET_Y;
        this.spells.monsterCast(def, monster.x, monster.y, toX, toY, () => {
            if (this.dead) return;
            const effects = this.gearEffects;
            if (effects.magicResistance && Math.random() < effects.magicResistance) {
                this.numbers.showWord(this.character.x, this.character.y - PLAYER_BODY_OFFSET_Y, 'Resist');
                return;
            }
            const distance = tileDistance(this.mover.tileX, this.mover.tileY, at.x, at.y);
            let damage = 0;
            if (def.direct && distance === 0) damage += rollSpellDamage(def.direct, 0, 'neutral');
            if (def.area && def.areaRange !== undefined && distance <= def.areaRange) damage += rollSpellDamage(def.area, 0, 'neutral');
            if (damage > 0) this.hurtPlayer(this.absorbed(Math.max(1, Math.round(damage * this.magicDamageFactor)), effects.magicAbsorption), true);
        });
    }

    /** Health off the player, with its number, blood and cry; it dies at 0. */
    private hurtPlayer(damage: number, magic = false): void {
        if (damage <= 0 || this.dead) return;
        this.breakPlayerHold(magic);
        this.tally.hurt += Math.min(damage, this.hp);
        this.tally.hits++;
        const x = this.character.x;
        const y = this.character.y - PLAYER_BODY_OFFSET_Y;
        this.hp = Math.max(0, this.hp - damage);
        // Off-9A: hurt while casting, the spell is lost.
        if (this.hp > 0 && this.spells.interrupt()) this.eventLine(OFF_CAST_TEXT.interrupted);
        this.numbers.showColored(x, y, damage, OFF_MONSTER_LOOK.playerDamageColor, false, this.hp === 0);
        this.spawnEffect('fx.hit', x, y);
        this.audio.play('sfx.player.hurt');
        this.critStrike.onHurt(this.level);
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
        if (!target || !target.isAlive || !(this.attackQueued || this.attackHeld) || this.isHeld) return;
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

    private swingAt(target: OffFoe): void {
        const mover = this.mover;
        const direction = directionTowards(mover.tileX, mover.tileY, target.mover.tileX, target.mover.tileY) ?? mover.facing;
        mover.face(direction);
        const crit = this.critQueued && this.critStrike.spend();
        this.critQueued = false;
        const hitRatio = this.hitRatio + (crit ? OFF_CRIT_STRIKE.hitBonus : 0);
        const behind = isFromBehind(direction, target.mover.facing);
        const lands = Math.random() < offHitChance(hitRatio, foeDefense(target), behind);
        const attackMs = offAttackMs(this.weapon, this.stats.str);
        this.character.act(PlayerState.Melee, direction, attackMs);
        this.cooldownMs = attackMs;
        this.blow = { monster: target, lands, leftMs: attackMs * OFF_COMBAT.hitShare, crit };
        this.attackQueued = false;
        this.audio.play('sfx.melee.swing');
        if (crit) this.launchCritLook();
    }

    /** The Critical Strike's shout, sparks and shake (Off-8A, as Survivors' CritStrikeSystem.launch). */
    private launchCritLook(): void {
        this.audio.play(CRIT_SHOUT[offSaveStore.character.look.gender]);
        this.screenShake.shake(OFF_CRIT_STRIKE.shakePx, OFF_CRIT_STRIKE.shakeMs);
        this.spawnEffect('fx.crit.strike', this.character.x, this.character.y - OFF_CRIT_STRIKE.effectOffsetY);
    }

    private landBlow(blow: PendingBlow): void {
        const monster = blow.monster;
        if (!monster.isAlive) return;
        const bodyY = foeBodyY(monster);
        if (!blow.lands) {
            this.numbers.showWord(monster.x, bodyY, 'Miss');
            return;
        }
        const effects = this.gearEffects;
        // Off-8A: a Critical Strike multiplies by its own factor and never rolls the random critical too.
        // Off-7C (owner): a Critical weapon has its value in % of doing double damage (orange number, as Survivors).
        const critical = blow.crit || Math.random() < (effects.critical ?? 0);
        const multiplier = blow.crit ? critDamageMultiplier(this.level) : critical ? OFF_COMBAT.criticalDamage : 1;
        // Off-8C: Berserk doubles normal blows, never the Critical Strike (server: iAttackMode < 20).
        const berserk = !blow.crit && this.berserkLeftMs > 0 ? OFF_BERSERK.damageFactor : 1;
        const factor = (1 + (effects.damage ?? 0)) * multiplier * berserk;
        const damage = rollWeaponDamage(this.weapon, foeSize(monster), this.stats.str, factor);
        if (!critical) {
            const tally = berserk > 1 ? this.debugBlows.berserk : this.debugBlows.plain;
            tally.sum += damage;
            tally.count++;
        }
        this.audio.play('sfx.melee.hit');
        if (critical && !blow.crit) this.criticalBlows++;
        if (blow.crit) this.critStrikeBlows++;
        // Off-9A: on a Raider (no poison on people for now; its own cry is in hurtRaider).
        if (isRaider(monster)) {
            this.hurtRaider(monster, damage, 'player', false, undefined, critical);
            return;
        }
        const killed = this.hurtMonster(monster, damage, undefined, critical, 'player', false);
        // Off-7B: a Poison weapon poisons what it hits (if it wasn't already), at a share of the blow (as Survivors).
        if (!killed && effects.poison) monster.poison(damage * effects.poison);
        this.audio.play(killed ? monster.def.base.deathSound : monster.def.base.hitSound);
    }

    /**
     * Damage on a monster, from a blow or a spell (`element`: its number's colour): the number, and the death with its
     * loot and experience. Returns whether it died.
     */
    private hurtMonster(monster: OffMonster, damage: number, element: SpellElement | undefined, critical: boolean, by: OffVictim, magic: boolean): boolean {
        const bodyY = monster.y - monster.def.base.bodyOffsetY;
        monster.hurt(damage, magic);
        provokeMonster(monster, by);
        const killed = monster.hp <= 0;
        this.numbers.show(monster.x, bodyY, damage, critical, killed, element);
        const from = by === 'merc' && this.merc ? this.merc : this.character;
        if (killed) this.killMonster(monster, by);
        else this.particles.hit(monster.x, bodyY, from.x, from.y);
        return killed;
    }

    /** It dies: falls, drops its loot and gives its experience (half when the mercenary killed it, Off-8B). */
    private killMonster(monster: OffMonster, by: OffVictim = 'player'): void {
        const bodyY = monster.y - monster.def.base.bodyOffsetY;
        monster.kill();
        this.particles.death(monster.x, monster.y, bodyY);
        this.kills++;
        this.dropLoot(monster);
        const share = by === 'merc' ? OFF_MERCENARY.killExpShare : 1;
        this.gainExp(Math.floor(offKillExp(monster.exp, this.level) * (1 + (this.gearEffects.experience ?? 0)) * share), monster.x, bodyY);
    }

    /** A poisoned monster's tick (Off-7B): green numbers; it may kill. */
    private updatePoison(monster: OffMonster, deltaMs: number): void {
        if (!monster.isAlive || !monster.isPoisoned) return;
        const damage = monster.tickPoison(deltaMs);
        if (damage <= 0) return;
        const killed = monster.hp <= 0;
        this.numbers.showColored(monster.x, monster.y - monster.def.base.bodyOffsetY, damage, OFF_ATTRIBUTES.poisonNumberColor, false, killed);
        if (killed) {
            this.killMonster(monster);
            this.audio.play(monster.def.base.deathSound);
        }
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
        // Off-7B: a Gold attribute gives more of every gold drop.
        if (loot.gold > 0) loot.gold = Math.floor(loot.gold * (1 + (this.gearEffects.gold ?? 0)));
        this.tally.gold += loot.gold;
        for (const item of loot.items) {
            if (isOffGoodId(item)) this.tally.potions++;
            else this.tally.valuables++;
        }
        if (this.ground.dropLoot(loot, Math.floor(monster.x / TILE_SIZE), Math.floor(monster.y / TILE_SIZE))) this.audio.play('sfx.itemDrop');
    }

    /** Something picked up from the ground; anything but 'ok' means it stays there (bag full, potion limit). */
    private pickUp(content: OffGroundContent, mercName?: string): OffEquipResult {
        if ('gold' in content) {
            offSaveStore.addGold(content.gold);
            this.eventLine(mercName ? OFF_MERCENARY_TEXT.pickedGold(mercName, content.gold) : OFF_LOOT_TEXT.gotGold(content.gold));
        } else {
            const result = offSaveStore.addToBag(content.item);
            if (result !== 'ok') return result;
            const name = offBagItemName(content.item);
            this.eventLine(mercName ? OFF_MERCENARY_TEXT.pickedItem(mercName, name) : OFF_LOOT_TEXT.gotItem(name));
        }
        if (mercName && this.merc) this.merc.picked++;
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
        if (isOffGearKey(id)) {
            const { result, tookOff } = offSaveStore.equipFromBagTaking(index);
            if (result === 'str') return { done: false, line: OFF_BAG_TEXT.needsStr(offStrToEquip(id)) };
            if (result === 'level') return { done: false, line: OFF_BAG_TEXT.needsLevel(offGearDef(id).levelToEquip ?? 0) };
            if (result === 'bagFull') return { done: false, line: OFF_BAG_TEXT.bagFull };
            if (result !== 'ok') return { done: false };
            this.audio.play('sfx.itemEquip');
            const line = tookOff ? OFF_BAG_TEXT.equippedTakingOff(offBagItemName(id), offBagItemName(tookOff)) : OFF_BAG_TEXT.equipped(offBagItemName(id));
            return { done: true, line, gear: true };
        }
        const restores = offGood(id).restores;
        if (!restores) return { done: false, line: OFF_BAG_TEXT.cantUse(OFF_GOODS[id].name) };
        if (this.dead) return { done: false };
        const [now, max] = this.barOf(restores.what);
        if (now >= max) return { done: false, line: OFF_BAG_TEXT.alreadyFull(restores.what) };
        const gained = Math.min(offRollRestore(restores.dice), max - now);
        if (restores.what === 'hp') this.hp += gained;
        else if (restores.what === 'mana') this.vitals.mana += gained;
        else this.vitals.stamina += gained;
        offSaveStore.takeFromBag(index);
        if (restores.what === 'hp') this.tally.drunk++;
        this.audio.play('sfx.drink');
        const line = restores.what === 'hp' ? OFF_REGEN_TEXT.hpUp(gained) : restores.what === 'mana' ? OFF_REGEN_TEXT.mpUp(gained) : OFF_REGEN_TEXT.spUp(gained);
        this.eventLine(line);
        return { done: true, line };
    }

    /**
     * Quick potion (Off-7B, Q / E or the d-pad): drinks the biggest potion carried that fills that bar (health or
     * mana), as if used from the bag. Nothing to drink gives its line.
     */
    public drinkQuick(what: 'hp' | 'mana'): OffUseResult {
        const bag = offSaveStore.character.bag;
        let best = -1;
        let bestPrice = -1;
        bag.forEach((key: OffBagItemKey, index) => {
            if (!isOffGoodId(key)) return;
            const good = offGood(key);
            if (good.restores?.what === what && good.price > bestPrice) {
                best = index;
                bestPrice = good.price;
            }
        });
        if (best < 0) {
            const line = OFF_BAG_TEXT.noPotion(what);
            this.eventLine(line);
            return { done: false, line };
        }
        const result = this.useBagItem(best);
        if (!result.done && result.line) this.eventLine(result.line);
        return result;
    }

    /** Drops the item in that bag cell on the player's tile (not picked up again until the player comes back to it). */
    public dropBagItem(index: number): OffUseResult {
        const tile = this.playerTile();
        if (!tile) return { done: false };
        const id = offSaveStore.takeFromBag(index);
        if (id === undefined) return { done: false };
        this.ground.drop({ item: id }, tile.x, tile.y, true);
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
        this.tally.exp += amount;
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
        // Dying takes the shield and Berserk off.
        this.protection = undefined;
        this.berserkLeftMs = 0;
        this.heldLeftMs = 0;
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

    // ---- Raiders (Off-9A) ----

    /** Their brains, blows, shields, mana and looks; the fallen go away; with none here, the clock towards the next raid. */
    private updateRaids(deltaMs: number): void {
        if (!this.raidsHere) return;
        for (const slot of this.raidSlots) {
            const raider = slot.raider;
            slot.spells?.update(deltaMs);
            if (!raider) continue;
            if (!raider.isAlive) {
                slot.goneLeftMs -= deltaMs;
                raider.sync(deltaMs, false);
                if (slot.goneLeftMs <= 0) this.removeRaider(slot);
                continue;
            }
            // You died: they go away.
            if (this.dead) {
                this.removeRaider(slot);
                continue;
            }
            const running = updateRaider(raider, deltaMs, this);
            const blow = raider.raidBlow;
            if (blow) {
                blow.leftMs -= deltaMs;
                if (blow.leftMs <= 0) {
                    raider.raidBlow = undefined;
                    this.landRaidBlow(raider, blow.victim, blow.lands, blow.crit);
                }
            }
            const protection = raider.protection;
            if (protection) {
                protection.leftMs -= deltaMs;
                if (protection.leftMs <= 0) raider.protection = undefined;
            }
            raider.berserkLeftMs = Math.max(0, raider.berserkLeftMs - deltaMs);
            raider.crit?.update(deltaMs, raider.level);
            if (raider.isCaster) this.regenMercMana(raider, deltaMs);
            raider.sync(deltaMs, running);
        }
        this.refreshRaiders();
        if (this.dead || this.raidSlots.some((slot) => slot.raider)) return;
        this.raidClockMs += deltaMs;
        if (this.raidClockMs < OFF_RAIDS.everyMs) return;
        this.raidClockMs = 0;
        const forced = this.debugRaidPending;
        if (!forced && Math.random() >= OFF_RAIDS.chance) return;
        // No tile for them now (walls all round you): another try soon.
        if (this.startRaid(forced ? DEBUG_START.offRaid : undefined)) this.debugRaidPending = false;
        else this.raidClockMs = OFF_RAIDS.everyMs - OFF_RAIDS.retryMs;
    }

    /** The Raiders alive now, in their slots' order. */
    private refreshRaiders(): void {
        this.raiderList.length = 0;
        for (const slot of this.raidSlots) if (slot.raider?.isAlive) this.raiderList.push(slot.raider);
    }

    /**
     * 1 or 2 Raiders of the other city (`forced`, ?offraid: that kind, or two), out of sight, coming for you. False when
     * no tile was found for them.
     */
    public startRaid(forced?: 'any' | 'warrior' | 'mage' | 'pair'): boolean {
        if (this.dead || !this.raidsHere) return false;
        const raids = OFF_RAIDS;
        const pair = forced === 'pair' || (forced === undefined && Math.random() < raids.pairChance);
        const near = this.raidSpawnTile();
        if (!near) return false;
        const faction = this.enemyFaction();
        const names = Phaser.Utils.Array.Shuffle([...OFF_RAIDER_NAMES[faction]]);
        const count = pair ? 2 : 1;
        const spawned: OffMercenary[] = [];
        for (let i = 0; i < count; i++) {
            const kind: OffMercenaryId = forced === 'warrior' || forced === 'mage' ? forced : Math.random() < raids.warriorChance ? 'warrior' : 'mage';
            const level = pair ? Math.max(1, this.level - raids.pairLevelsUnder) : Math.max(1, this.level + Phaser.Math.Between(-raids.levelSpread, raids.levelSpread));
            const tile = i === 0 ? near : findFreeTile((x, y) => this.isFreeForRaider(undefined, x, y), near.x, near.y, raids.pairGapTiles + 2);
            const slot = this.raidSlots[i];
            if (!tile || !slot) continue;
            spawned.push(this.spawnRaider(slot, kind, level, faction, names[i] ?? names[0] ?? 'Raider', tile));
        }
        this.refreshRaiders();
        const first = spawned[0];
        if (!first) return false;
        this.raidTally.raids++;
        this.raidTally.raiders += spawned.length;
        // No warning that they come (the owner, 8-nov-2026): you see them arrive.
        return true;
    }

    private spawnRaider(slot: RaiderSlot, kind: OffMercenaryId, level: number, faction: OffFaction, name: string, tile: TilePoint): OffMercenary {
        if (slot.raider) this.removeRaider(slot);
        const body = Phaser.Utils.Array.GetRandom([...OFF_RAIDER_BODIES]);
        const holder: { raider?: OffMercenary } = {};
        const raider = new OffMercenary(this.scene, kind, (x, y) => this.isFreeForRaider(holder.raider, x, y), tile.x, tile.y, level, { def: offRaiderDef(kind, name, body), faction });
        holder.raider = raider;
        raider.victim = 'player';
        if (raider.isCaster) {
            const host = slot.host ?? new OffRaiderSpells(this);
            slot.host = host;
            host.raider = raider;
            if (slot.spells) slot.spells.attach(raider.mover, raider.character);
            else slot.spells = new OffSpells(this.scene, host, raider.mover, raider.character, this.audio);
            raider.spells = slot.spells;
        }
        slot.raider = raider;
        slot.goneLeftMs = 0;
        return raider;
    }

    private removeRaider(slot: RaiderSlot): void {
        const raider = slot.raider;
        if (!raider) return;
        raider.spells?.cancel();
        if (slot.host) slot.host.raider = undefined;
        if (this.target === raider) this.clearTarget();
        if (this.hovered === raider) this.hovered = undefined;
        raider.destroy();
        slot.raider = undefined;
        this.refreshRaiders();
    }

    /** The other city (any one when you have none yet). */
    private enemyFaction(): OffFaction {
        const mine = offSaveStore.character.faction;
        if (mine === 'aresden') return 'elvine';
        if (mine === 'elvine') return 'aresden';
        return Math.random() < 0.5 ? 'aresden' : 'elvine';
    }

    /** A free tile OFF_RAIDS.spawnTiles from you (out of sight) with a way to you, trying a few directions. */
    private raidSpawnTile(): TilePoint | undefined {
        const raids = OFF_RAIDS;
        const from = { x: this.mover.tileX, y: this.mover.tileY };
        const start = Math.random() * Math.PI * 2;
        const tries = 8;
        for (let i = 0; i < tries; i++) {
            const angle = start + (i * Math.PI * 2) / tries;
            const x = Math.round(from.x + Math.cos(angle) * raids.spawnTiles);
            const y = Math.round(from.y + Math.sin(angle) * raids.spawnTiles);
            const tile = findFreeTile((tx, ty) => this.isFreeForRaider(undefined, tx, ty), x, y, raids.spawnSearchTiles);
            if (tile && this.findPath(tile, from, OFF_RAIDER.pathMaxTiles)) return tile;
        }
        return undefined;
    }

    /** Tile a Raider may step onto: walkable, no monster, no other Raider, not you and not your mercenary. */
    private isFreeForRaider(raider: OffMercenary | undefined, x: number, y: number): boolean {
        if (!this.isWalkable(x, y) || this.monsterOn(x, y) || this.raiderOn(x, y, raider)) return false;
        const merc = this.merc?.mover;
        if (merc && ((merc.tileX === x && merc.tileY === y) || (merc.nextTileX === x && merc.nextTileY === y))) return false;
        const mover = this.mover;
        return !((mover.tileX === x && mover.tileY === y) || (mover.nextTileX === x && mover.nextTileY === y));
    }

    /** The Raider a monster's victim slot points at, if it is alive. */
    private raiderOfVictim(victim: OffVictim): OffMercenary | undefined {
        if (victim === 'player' || victim === 'merc') return undefined;
        const raider = this.raidSlots[OFF_RAIDER_SLOTS.indexOf(victim as OffRaiderSlot)]?.raider;
        return raider?.isAlive ? raider : undefined;
    }

    /** What magic damage on a person is multiplied by: half with Protection From Magic (as yours). */
    private personMagicFactor(person: OffMercenary): number {
        const power = person.protection ? OFF_SPELLS[person.protection.spell].power ?? 0 : 0;
        return OFF_PROTECT.magicHalvedPowers.includes(power) ? OFF_PROTECT.magicDamageFactor : 1;
    }

    /**
     * Damage on a Raider (`by`: you, your mercenary or a monster): its number, a hold broken, and its death. Hit by the
     * one it isn't after, it may turn on that one (OFF_RAIDER.switchChance). Returns whether it died.
     */
    private hurtRaider(raider: OffMercenary, damage: number, by: OffRaidVictim | 'monster', magic: boolean, element?: SpellElement, critical = false): boolean {
        if (!raider.isAlive || damage <= 0) return false;
        raider.hp = Math.max(0, raider.hp - damage);
        raider.hitBreaksHold(magic);
        // Hurt while casting (a Mage), the spell is lost; a Warrior's blows taken give it charges (as yours).
        if (raider.spells?.interrupt()) raider.raidCast = undefined;
        if (!magic) raider.crit?.onHurt(raider.level);
        const y = raider.y - PLAYER_BODY_OFFSET_Y;
        const killed = raider.hp === 0;
        this.numbers.show(raider.x, y, damage, critical, killed, element);
        if (killed) {
            this.killRaider(raider, by);
            return true;
        }
        const from = by === 'merc' ? this.merc : by === 'player' ? this.character : undefined;
        if (from) this.particles.hit(raider.x, y, from.x, from.y);
        else this.spawnEffect('fx.hit', raider.x, y);
        if (by !== 'monster' && by !== raider.victim && this.raidVictimTile(by) && Math.random() < OFF_RAIDER.switchChance) {
            raider.victim = by;
            raider.raidBlow = undefined;
        }
        if (!raider.character.isActing && !raider.mover.isMoving && !raider.isHeld) raider.character.act(PlayerState.Hurt, raider.mover.facing, OFF_COMBAT.playerHurtMs);
        return false;
    }

    /** "Enemy Kill!!" rising over a fallen Raider: big yellow letters with a black edge, as the original. */
    private showEnemyKill(x: number, y: number): void {
        const look = OFF_RAIDER_LOOK.killWord;
        const text = this.scene.add.text(x, y, OFF_RAIDER_TEXT.enemyKill, {
            fontFamily: look.fontFamily, fontSize: `${look.fontSize}px`, fontStyle: 'bold', color: look.color, stroke: look.stroke, strokeThickness: look.strokeThickness,
        }).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS);
        this.scene.tweens.add({ targets: text, y: y - look.risePx, duration: look.showMs, ease: 'Quad.easeOut' });
        this.scene.tweens.add({ targets: text, alpha: 0, delay: look.showMs - look.fadeMs, duration: look.fadeMs, onComplete: () => text.destroy() });
    }

    /** It dies: falls, cries, drops its gold (Off-9A: only gold, no experience) and its slot empties a little later. */
    private killRaider(raider: OffMercenary, by: OffRaidVictim | 'monster'): void {
        raider.die();
        this.audio.play(GENDER_SOUNDS[raider.def.body.gender].death);
        this.particles.death(raider.x, raider.y, raider.y - PLAYER_BODY_OFFSET_Y);
        const gold = Math.floor(raider.level * OFF_RAIDS.goldPerLevel * (1 + (this.gearEffects.gold ?? 0)));
        if (this.ground.dropLoot({ gold, items: [] }, raider.mover.tileX, raider.mover.tileY)) this.audio.play('sfx.itemDrop');
        this.tally.gold += gold;
        this.raidTally.gold += gold;
        this.raidTally.killed++;
        if (by === 'monster') this.raidTally.byMonsters++;
        // You or your mercenary killed it: "Enemy Kill!!" over it, as the original (the owner's capture, 8-nov-2026).
        if (by === 'monster') this.eventLine(OFF_RAIDER_TEXT.fell(raider.def.name));
        else this.showEnemyKill(raider.x, raider.y - OFF_RAIDER_LOOK.killWord.aboveFeetPx);
        const slot = this.raidSlots.find((s) => s.raider === raider);
        if (slot) slot.goneLeftMs = OFF_COMBAT.corpseMs;
        if (this.target === raider) this.clearTarget();
        this.refreshRaiders();
    }

    /** A Raider's blow lands on you or your mercenary (through the armour, as a monster's). */
    private landRaidBlow(raider: OffMercenary, victim: OffRaidVictim, lands: boolean, crit: boolean): void {
        if (!raider.isAlive) return;
        const merc = this.merc;
        if (victim === 'merc' && (!merc || merc.isDown)) return;
        if (victim === 'player' && this.dead) return;
        const body = this.raidVictimBody(victim);
        if (!lands) {
            if (body) this.numbers.showWord(body.x, body.y, 'Miss');
            return;
        }
        // A Critical Strike: × (2 + level/30), never with Berserk (as yours).
        const factor = raider.def.damageFactor * (crit ? critDamageMultiplier(raider.level) : raider.isBerserk ? OFF_BERSERK.damageFactor : 1);
        const damage = rollWeaponDamage(raider.weapon, 'small', raider.stats.str, factor);
        this.audio.play('sfx.melee.hit');
        if (victim === 'merc' && merc) this.hurtMerc(merc, this.mercArmorAbsorbed(merc, damage));
        else this.hurtPlayer(this.armorAbsorbed(damage));
    }

    // ---- OffRaiderWorld / OffRaiderCastWorld (Off-9A) ----

    public raidVictimTile(victim: OffRaidVictim): TilePoint | undefined {
        return this.victimTile(victim);
    }

    public raidVictimBody(victim: OffRaidVictim): { x: number; y: number } | undefined {
        if (victim === 'player') return this.dead ? undefined : { x: this.character.x, y: this.character.y - PLAYER_BODY_OFFSET_Y };
        const merc = this.merc;
        return merc && !merc.isDown ? { x: merc.x, y: merc.y - PLAYER_BODY_OFFSET_Y } : undefined;
    }

    public raidVictimFacing(victim: OffRaidVictim): Direction {
        return victim === 'merc' && this.merc ? this.merc.mover.facing : this.mover.facing;
    }

    public raidVictimDefense(victim: OffRaidVictim): number {
        return victim === 'merc' && this.merc ? this.merc.defense : this.defense;
    }

    public raidVictimHeldMs(victim: OffRaidVictim): number {
        return victim === 'merc' ? this.merc?.holdLeftMs ?? 0 : this.heldLeftMs;
    }

    public raidVictimHpShare(victim: OffRaidVictim): number {
        const merc = this.merc;
        if (victim === 'merc') return merc ? merc.hp / Math.max(1, merc.maxHp) : 1;
        return this.hp / Math.max(1, this.maxHp);
    }

    /** A Warrior Raider launches a Critical Strike: its shout, "Crit!" over it, the sparks and a shake (as yours). */
    public raiderCrits(raider: OffMercenary): void {
        this.audio.play(CRIT_SHOUT[raider.def.body.gender]);
        this.numbers.showWord(raider.x, raider.y - PLAYER_BODY_OFFSET_Y - OFF_CRIT_STRIKE.effectOffsetY, OFF_RAIDER_CRIT.word);
        this.spawnEffect('fx.crit.strike', raider.x, raider.y - OFF_CRIT_STRIKE.effectOffsetY);
        this.screenShake.shake(OFF_CRIT_STRIKE.shakePx, OFF_CRIT_STRIKE.shakeMs);
    }

    public raiderCanStand(raider: OffMercenary, x: number, y: number): boolean {
        return this.isFreeForRaider(raider, x, y);
    }

    /**
     * A Mage Raider's damage spell arrives at `at`: the direct roll on whoever still stands there and the area roll on
     * you and your mercenary within its range (its MAG adds, as yours). Each may shrug it off (OFF_RAIDER.magicResist;
     * you, also with a Magic Resistance attribute) and Protection From Magic halves it.
     */
    public raiderSpellLands(raider: OffMercenary, def: OffSpellDef, hit: number, at: TilePoint, victim: OffRaidVictim): void {
        // Hold Person / Paralyze: on its victim, for a few seconds (OFF_HOLD.personMs).
        if (def.kind === 'hold') {
            raider.holdTries++;
            const merc = this.merc;
            // Another hold only OFF_RAIDER_MAGE.holdEveryMs later (it attacks or heals in between).
            raider.holdWaitMs = OFF_RAIDER_MAGE.holdEveryMs;
            if (victim === 'player') {
                if (this.holdPlayer(def, hit)) raider.holdsLanded++;
            } else if (merc && !merc.isDown) {
                if (rollResisted(hit, OFF_HOLD.personResist)) this.numbers.showWord(merc.x, merc.y - PLAYER_BODY_OFFSET_Y, 'Resist');
                else if (merc.hold(offPersonHoldMs(def.power ?? 0), def.power ?? 0)) {
                    raider.holdsLanded++;
                    this.numbers.showWord(merc.x, merc.y - PLAYER_BODY_OFFSET_Y, OFF_CAST_WORDS.held);
                }
            }
            return;
        }
        const roll = (tile: TilePoint | undefined): number => {
            if (!tile) return 0;
            const distance = tileDistance(tile.x, tile.y, at.x, at.y);
            let damage = 0;
            if (def.direct && distance === 0) damage += rollSpellDamage(def.direct, raider.stats.mag, 'neutral');
            if (def.area && def.areaRange !== undefined && distance <= def.areaRange) damage += rollSpellDamage(def.area, raider.stats.mag, 'neutral');
            return damage;
        };
        const playerDamage = roll(this.playerTile());
        if (playerDamage > 0) {
            const effects = this.gearEffects;
            if (rollResisted(hit, OFF_RAIDER.magicResist) || (effects.magicResistance && Math.random() < effects.magicResistance)) {
                this.numbers.showWord(this.character.x, this.character.y - PLAYER_BODY_OFFSET_Y, 'Resist');
            } else {
                this.hurtPlayer(this.absorbed(Math.max(1, Math.round(playerDamage * this.magicDamageFactor)), effects.magicAbsorption), true);
            }
        }
        const merc = this.merc;
        const mercDamage = merc && !merc.isDown ? roll(this.victimTile('merc')) : 0;
        if (merc && mercDamage > 0) {
            if (rollResisted(hit, OFF_RAIDER.magicResist)) this.numbers.showWord(merc.x, merc.y - PLAYER_BODY_OFFSET_Y, 'Resist');
            else this.hurtMerc(merc, Math.max(1, Math.round(mercDamage * this.personMagicFactor(merc))), true);
        }
    }

    public healRaider(raider: OffMercenary, amount: number): void {
        if (!raider.isAlive) return;
        const gained = Math.min(amount, raider.maxHp - raider.hp);
        if (gained <= 0) return;
        raider.hp += gained;
        this.numbers.showColored(raider.x, raider.y - PLAYER_BODY_OFFSET_Y, gained, OFF_HEAL_NUMBER_COLOR);
    }

    public protectRaider(raider: OffMercenary, spell: OffSpellId): boolean {
        if (raider.protection || !raider.isAlive) return false;
        raider.protection = { spell, leftMs: (OFF_SPELLS[spell].durationSec ?? 0) * 1000 };
        return true;
    }

    /** Development (`check offraid...`): the Raiders now, in short. */
    public debugRaiders(): { name: string; kind: string; level: number; hp: number; maxHp: number; stamina: string; victim: OffRaidVictim; tile: string; casts: number; fleeing: boolean; flees: number; cornered: number; retreats: number; interrupts: number; held: boolean; crits: number; critCharges: number; holdTries: number; holdsLanded: number }[] {
        return this.raiderList.map((r) => ({
            name: r.def.name, kind: r.def.kind, level: r.level, hp: r.hp, maxHp: r.maxHp, stamina: `${r.stamina}/${r.maxStamina}`, victim: r.victim, flees: r.flees, cornered: r.cornered, retreats: r.retreats, interrupts: r.spells?.interrupts ?? 0, crits: r.crits, critCharges: r.crit?.charges ?? 0, holdTries: r.holdTries, holdsLanded: r.holdsLanded,
            tile: `${r.mover.tileX},${r.mover.tileY}`, casts: Object.values(r.castCount).reduce((a, b) => a + (b ?? 0), 0), fleeing: r.fleeing, held: r.isHeld,
        }));
    }

    // ---- Helpers ----

    private distanceTo(monster: OffFoe): number {
        return tileDistance(this.mover.tileX, this.mover.tileY, monster.mover.tileX, monster.mover.tileY);
    }

    /** Alive monsters and (Off-9A) Raiders within reach of the gamepad's targeting, nearest first. */
    private nearbyMonsters(): OffFoe[] {
        const near = (m: OffFoe) => m.isAlive && this.distanceTo(m) <= OFF_COMBAT.targetRangeTiles;
        return [...this.pits.monsters.filter(near), ...this.raiderList.filter(near)]
            .sort((a, b) => this.distanceTo(a) - this.distanceTo(b));
    }

    /** Off-9A: a Raider (alive) stands on (or steps onto) this tile; `except` doesn't count (itself). */
    private raiderOn(x: number, y: number, except?: OffMercenary): boolean {
        for (const raider of this.raiderList) {
            if (raider === except) continue;
            const mover = raider.mover;
            if ((mover.tileX === x && mover.tileY === y) || (mover.nextTileX === x && mover.nextTileY === y)) return true;
        }
        return false;
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

    private spawnEffect(key: 'fx.hit' | 'fx.crit.strike', x: number, y: number): void {
        this.effects.acquire().play(key, x, y);
    }
}
