import Phaser from 'phaser';
import {
    CAMERA_LERP,
    DEPTH_DEBUG,
    ENEMY_WALL_HALF_SIZE,
    GAME_OVER_DELAY_MS,
    GAME_WIDTH,
    MAP_OBJECT_MARGIN_TILES,
    PLAYER_BODY_OFFSET_Y,
    PLAYER_BODY_RADIUS,
    PLAYER_HURT_MS,
    PLAYER_HURT_STUN_MS,
    TILE_SIZE,
} from '../config/gameConfig';
import { TOUCH_AIM_STICK, TOUCH_AIM_ZONE_START, TOUCH_JOYSTICK, TOUCH_RESERVED_CORNER } from '../config/touch';
import { ANNOUNCE_EVENT, QUIT_RUN_EVENT } from '../config/hud';
import { getArmorPiece } from '../data/armor';
import { MUSIC } from '../data/audio';
import { PORTAL, type WaveEventDef } from '../data/waves';
import type { Enemy } from '../entities/Enemy';
import { Portal } from '../entities/Portal';
import { BossSystem } from '../systems/BossSystem';
import { EnemyProjectileSystem } from '../systems/EnemyProjectileSystem';
import { MusicSystem } from '../systems/MusicSystem';
import type { GameOverSceneData } from './GameOverScene';
import { DEFAULT_LOOKS, GENDER_SOUNDS } from '../data/appearance';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId, type CharacterId } from '../data/characters';
import { DEFAULT_MAP, MAPS_DATA, type MapId } from '../data/maps';
import { AUTOSAVE_EVERY_MS, RESUME_CALM_MS } from '../data/saves';
import { STAT_IDS } from '../data/stats';
import type { MeleeWeaponId } from '../data/weapons';
import type { SpellId } from '../data/spells';
import { RESUME_SLOT_KEY, saveStore, type RunSnapshot } from '../systems/SaveStore';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { lookLoader, runSprites } from '../systems/LookLoader';
import { MIN_DAMAGE_TAKEN } from '../data/armor';
import { MELEE_ROOT_MOMENT } from '../data/weapons';
import { CAST_RELEASE_MOMENT } from '../data/spells';
import { FOOTSTEP_DUST_EVERY_PX, FOOTSTEPS_PER_RUN_CYCLE } from '../data/audio';
import { PLAYER_FRAMES_PER_DIRECTION } from '../hb/playerAppearance';
import { CharacterStats } from '../entities/CharacterStats';
import { BuffSystem } from '../systems/BuffSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { CHEST_CARDS_TITLE, POTION_HEAL_SHARE, type PickupId } from '../data/pickups';
import { getTotem, TOTEM_IDS, type TotemId } from '../data/totems';
import { TotemSystem } from '../systems/TotemSystem';
import { playerDefenseRatio, playerMagicResistance, RESIST_TEXT } from '../data/defense';
import { ARMOR_BY_SET } from '../data/armor';
import { Equipment } from '../entities/Equipment';
import type { EnemyWorld } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { getMap, type HBMap } from '../hb/HBMap';
import { MapView } from '../hb/mapRenderer';
import { AudioSystem } from '../systems/AudioSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { DamageNumbers } from '../systems/DamageNumbers';
import { HitParticles } from '../systems/HitParticles';
import { ScreenShake } from '../systems/ScreenShake';
import { DebugSystem } from '../systems/DebugSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { assetStreamer } from '../systems/AssetStreamer';
import { Action, InputSystem } from '../systems/InputSystem';
import { SETTINGS_CHANGED, settings } from '../systems/Settings';
import { AimArrow } from '../ui/AimArrow';
import { playAreaBottom } from '../ui/hudLayout';
import { TouchJoystick } from '../ui/TouchJoystick';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XpSystem } from '../systems/XpSystem';
import { canStandAt } from '../utils/collision';
import { formatTime } from '../utils/format';
import { SpellWeapon } from '../weapons/SpellWeapon';
import { PlayerState } from '../hb/playerAppearance';
import { MeleeWeapon } from '../weapons/MeleeWeapon';
import { directionFromVector } from '../hb/directions';
import { buildLevelUpChoices } from '../systems/UpgradePool';
import type { HudSceneData, HudState } from './HudScene';
import type { LevelUpChoice, LevelUpSceneData } from './LevelUpScene';
import { DEBUG_START, type DebugAction } from '../config/debugStart';
import { SimRun } from '../systems/SimRun';
import { ACHIEVEMENT_EVENT, ACHIEVEMENT_SOUND } from '../data/achievements';
import { AchievementTracker } from '../systems/AchievementTracker';
import { GAME_VERSION } from '../config/version';
import { COMPACT_UI } from '../config/device';
import { PASSIVE_IDS, getPassive } from '../data/passives';
import { RunMetrics, metricsAllowed, sendRunReport } from '../systems/RunMetrics';
import type { RunResult } from '../config/metrics';

/** Enemies created by the debug "spawn many" key. */
const DEBUG_SPAWN_COUNT = 100;
/** Points added by the debug keys V (Str) and B (Int and Mag), to see links and armor show up quickly. */
const DEBUG_STR_POINTS = 10;
/** Distance from the player of the pickups dropped by the debug key P. */
const DEBUG_PICKUP_SPACING = 48;
/** ?debug=totems: gap between the totems, and how far below the player they stand (wider than their pickup zone). */
const DEBUG_TOTEM_SPACING = 120;
/** Time skipped by the debug key J. */
const DEBUG_SKIP_MS = 60000;
/** Levels given by the debug key L (one card per level). */
const DEBUG_LEVELS = 5;
/** Wait after the run starts before the ?debug= actions (debugStart.ts). */
const DEBUG_START_DELAY_MS = 500;

/**
 * Escena de partida con la clase elegida en CharacterSelectScene: mapa, jugador, oleadas de enemigos con minijefes y jefe
 * final (Fase 7), arma o hechizo automático, gemas de XP, cartas al subir de nivel, objetos y buffs. Al final, GameOverScene.
 * Fase 12: la partida se guarda (SaveStore) cada pocos segundos, al minimizar y al salir al menú; con Continue
 * (registry RESUME_SLOT_KEY) se reconstruye desde esa foto. Al ganar o morir, su ranura se libera.
 * Fase 13: al matar al jefe final mueren todos los monstruos y cae su cofre; al abrirlo se abre un portal, y la partida
 * se gana al entrar en él o cuando se acaba su cuenta atrás. La XP que quede en el suelo se pierde.
 * Fase 14B: AchievementTracker desbloquea los logros durante la partida; el aviso lo pinta HudScene (ACHIEVEMENT_EVENT).
 * Mover: WASD/flechas, stick/cruceta o mantener clic. Esc / Start: pausa. F1 / View: depuración · T: prueba del Orc.
 * Solo en desarrollo: N 100 enemigos · K matar los visibles · G invencible · X subir un nivel · V +10 Str · B +10 Int y Mag · P poción, imán y cofre · J +1 minuto · M siguiente jefe · L +5 niveles.
 */
export class GameScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    /** Only on touch screens. */
    private joystick: TouchJoystick | undefined;
    private aimStick: TouchJoystick | undefined;
    private player!: Player;
    private mapView!: MapView;
    private enemies!: EnemySystem;
    private spawner!: SpawnSystem;
    private damageNumbers!: DamageNumbers;
    private audio!: AudioSystem;
    private combat!: CombatSystem;
    private particles!: HitParticles;
    private screenShake!: ScreenShake;
    private weapons!: WeaponSystem;
    private aimArrow!: AimArrow;
    private debug!: DebugSystem;
    /** ?debug=aim / debug key: aiming to the right by itself (reset at the start of each run). */
    private debugAimForced = false;
    /** The ?debug= actions still have to run (only on the first run after loading the page). */
    private debugStartPending = DEBUG_START.actions.length > 0;
    /** Run time left before those actions (counted with the frames: the scene clock is not ready in create()). */
    private debugStartWaitMs = DEBUG_START_DELAY_MS;
    private world!: EnemyWorld;
    private bosses!: BossSystem;
    private enemyShots!: EnemyProjectileSystem;
    private music!: MusicSystem;
    /** The final boss is dead: no more monsters; its chest opens the portal. */
    private finalBossDead = false;
    /** Counts down to the portal opening once the final chest is picked up; negative = not yet, or already open. */
    private portalInMs = -1;
    /** Where the portal will open (beside the final chest). */
    private portalX = 0;
    private portalY = 0;
    /** Open after the final boss's death: stepping in (or waiting) wins the run. */
    private portal: Portal | undefined;
    /** Debug ?debug=bosskill: kill the final boss as soon as it is out. */
    private killFinalBossPending = false;
    /** The end screen is open (victory or defeat). */
    private runOver = false;
    private godModeLabel!: Phaser.GameObjects.Text;
    private stats!: CharacterStats;
    private xp!: XpSystem;
    private pickups!: PickupSystem;
    private buffs!: BuffSystem;
    private totems!: TotemSystem;
    /** Free cards from chests not chosen yet (Fase 16B): they show after any level-up cards. */
    private chestCards = 0;
    private equipment!: Equipment;
    /** Melee weapon in hand (Warrior); undefined for spell casters. */
    private meleeWeapon: MeleeWeapon | undefined;
    /** Spell in hand (Mage); undefined for melee classes. */
    private spellWeapon: SpellWeapon | undefined;
    private levelUpOpen = false;
    /** Simulated run to measure the balance (?debug=sim, development only). */
    private sim: SimRun | undefined;
    /** Anonymous stats of this run (Fase 14A), sent when it ends. */
    private metrics!: RunMetrics;
    private achievements!: AchievementTracker;
    /** Names of the achievements unlocked this run, for the end screen. */
    private achievementsThisRun: string[] = [];
    /** Pixels run since the last puff of footstep dust, and where the player was last frame. */
    private dustDistance = 0;
    private mapId: MapId = DEFAULT_MAP;
    private characterId: CharacterId = DEFAULT_CHARACTER;
    /** Saved character playing this run (Fase 17A), to keep its best level; undefined in old saves and debug runs. */
    private characterUid: string | undefined;
    /** Save slot of this run (SaveStore). */
    private saveSlot = 0;
    private autosaveInMs = AUTOSAVE_EVERY_MS;
    private lastX = 0;
    private lastY = 0;

    constructor() {
        super('Game');
    }

    create(): void {
        // Continue: the slot chosen in CharacterSlotsScene. Read once, so Restart (game over) starts a new run.
        const resumeSlot: unknown = this.registry.get(RESUME_SLOT_KEY);
        this.registry.remove(RESUME_SLOT_KEY);
        const resume = typeof resumeSlot === 'number' ? saveStore.get(resumeSlot) : undefined;
        const activeUid: unknown = this.registry.get(ACTIVE_CHARACTER_KEY);
        this.characterUid = resume ? resume.characterUid : typeof activeUid === 'string' ? activeUid : undefined;
        // One run per character, in its slot (Fase 17A). Without a character (debug ?play): a slot with no character,
        // so the run becomes a new character when the game loads again; with none free, it isn't saved (-1).
        const characterSlot = characterStore.slotOf(this.characterUid);
        this.saveSlot = resume && typeof resumeSlot === 'number' ? resumeSlot : characterSlot >= 0 ? characterSlot : characterStore.firstFree;
        this.autosaveInMs = AUTOSAVE_EVERY_MS;
        this.mapId = resume?.map ?? DEFAULT_MAP;
        const mapDef = MAPS_DATA[this.mapId];
        const map = getMap(this, mapDef.asset);
        const area = mapDef.playArea;
        const margin = MAP_OBJECT_MARGIN_TILES;
        this.mapView = new MapView(this, map, area, {
            x: area.x - margin,
            y: area.y - margin,
            width: area.width + margin * 2,
            height: area.height + margin * 2,
        });

        const areaPx = new Phaser.Geom.Rectangle(area.x * TILE_SIZE, area.y * TILE_SIZE, area.width * TILE_SIZE, area.height * TILE_SIZE);
        const spawn = findSpawnTile(map, area.x + Math.floor(area.width / 2), area.y + Math.floor(area.height / 2));
        // Class chosen on the selection screen (the debug sprite test returns here without choosing).
        const chosen: unknown = this.registry.get(CHOSEN_CHARACTER_KEY);
        this.characterId = resume?.character ?? (isCharacterId(chosen) ? chosen : DEFAULT_CHARACTER);
        const character = CHARACTERS[this.characterId];
        // Look of the saved character (Fase 17B); debug runs without one look as the class did before.
        const look = characterStore.byUid(this.characterUid)?.look ?? DEFAULT_LOOKS[this.characterId];
        // Everything this character may wear during the run (armor from the cards), so new pieces show at once.
        void lookLoader.ensure(this, runSprites(character, look));
        this.player = new Player(this, (spawn.x + 0.5) * TILE_SIZE, (spawn.y + 0.5) * TILE_SIZE, character, look, map, areaPx);
        this.stats = new CharacterStats(character);
        this.levelUpOpen = false;
        this.sim = undefined;
        this.debugAimForced = false;
        this.metrics = new RunMetrics(this.game, resume?.metrics, resume !== undefined);
        // Quit to menu: the run stays saved, but the stats count it as left (if it is continued, it sends again).
        const onQuit = () => {
            if (!this.runOver && !this.player.isDead) this.sendMetrics('quit');
        };
        this.events.on(QUIT_RUN_EVENT, onQuit);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(QUIT_RUN_EVENT, onQuit));
        this.dustDistance = 0;
        this.lastX = this.player.x;
        this.lastY = this.player.y;

        // The classic bottom bar covers the last rows of the screen: the camera only draws above it, so the player stays
        // centred in what is visible (with the compact HUD of phones it draws down to the bottom; see fitPlayArea).
        const camera = this.cameras.main;
        camera.setBounds(areaPx.x, areaPx.y, areaPx.width, areaPx.height);
        camera.startFollow(this.player.container, true, CAMERA_LERP, CAMERA_LERP);

        this.audio = new AudioSystem(this);
        this.enemies = new EnemySystem(this, this.audio);
        this.spawner = new SpawnSystem(
            camera, this.enemies, map, areaPx, (event, spawned) => this.onWaveEvent(event, spawned),
            (id) => assetStreamer.isReady(id), (id) => assetStreamer.hurry(id),
        );
        // Normally already running since the main menu; this covers starting a run any other way.
        assetStreamer.start(this);
        this.damageNumbers = new DamageNumbers(this);
        this.xp = new XpSystem(this, this.audio);
        this.pickups = new PickupSystem(this, this.audio, (id) => this.collectPickup(id));
        this.particles = new HitParticles(this);
        this.screenShake = new ScreenShake(camera);
        this.combat = new CombatSystem(this.enemies, this.damageNumbers, this.audio, this.particles, this.stats, (enemy) => {
            this.xp.drop(enemy.x, enemy.y, enemy.def.xp);
            this.pickups.onKill(enemy.x, enemy.y);
            this.onEnemyKilled(enemy);
        });
        this.weapons = new WeaponSystem(this, this.enemies, this.combat, this.audio, this.screenShake);
        this.aimArrow = new AimArrow(this);
        this.buffs = new BuffSystem(this, this.player, this.audio, (key, x, y) => this.weapons.spawnEffect(key, x, y));
        this.totems = new TotemSystem(this, map, areaPx, this.audio, (id) => this.collectTotem(id));
        this.chestCards = 0;
        this.enemyShots = new EnemyProjectileSystem(this, this.audio, (key, x, y) => this.weapons.spawnEffect(key, x, y),
            (x, y) => this.damageNumbers.showWord(x, y, RESIST_TEXT));
        this.bosses = new BossSystem(this.enemyShots, (minions, x, y) => this.spawner.spawnRing(minions.enemies, minions.count, x, y, minions.radius));
        // Archers (Dark Elf) shoot arrows at the player's body instead of hitting directly.
        this.enemies.setShootHandler((enemy, damage) => {
            const ranged = enemy.def.attackProjectile;
            if (ranged) this.enemyShots.throwAt(ranged, enemy.def.name, enemy.x, enemy.bodyY, this.player.x, this.player.y - PLAYER_BODY_OFFSET_Y, damage, false, enemy.def.hitRatio);
        });
        this.music = new MusicSystem(this);
        this.music.play(MUSIC.normal);
        this.finalBossDead = false;
        this.portalInMs = -1;
        this.portal = undefined;
        this.killFinalBossPending = false;
        this.runOver = false;
        this.equipment = new Equipment(character);
        this.achievementsThisRun = [];
        this.achievements = new AchievementTracker(this.characterId, this.mapId, () => ({
            elapsedMs: this.spawner.elapsed,
            level: this.stats.level,
            kills: this.combat.kills,
            fullArmor: this.equipment.fullArmor,
        }), (def) => {
            this.achievementsThisRun.push(def.name);
            this.audio.play(ACHIEVEMENT_SOUND);
            this.events.emit(ACHIEVEMENT_EVENT, def.name);
        });
        this.meleeWeapon = undefined;
        this.spellWeapon = undefined;
        if (character.startWeapon.kind === 'melee') {
            this.meleeWeapon = new MeleeWeapon(character.startWeapon.id);
            this.weapons.add(this.meleeWeapon);
            this.player.setGear('weapon', this.equipment.weaponLayer());
        } else {
            this.spellWeapon = new SpellWeapon(character.startWeapon.id);
            this.weapons.add(this.spellWeapon);
        }
        this.weapons.setOwnerActionHandler((action, angle, durationMs) => {
            // Stands still until the blow lands or the spell leaves (as in the original), then can run again.
            const direction = directionFromVector(Math.cos(angle), Math.sin(angle)) ?? this.player.direction;
            if (action === 'melee') this.player.act(PlayerState.Melee, direction, durationMs, durationMs * MELEE_ROOT_MOMENT);
            else this.player.act(PlayerState.Cast, direction, durationMs, durationMs * CAST_RELEASE_MOMENT);
        });
        this.player.setMaxHp(this.stats.maxHp, true);
        this.applyStats();
        this.world = { map, area: areaPx, targetX: 0, targetY: 0, targetRadius: character.hitboxHalfSize, defenseRatio: 0 };
        if (resume) this.restore(resume);
        this.watchForSaving();

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerAnchor(() => this.player);
        if (this.sys.game.device.input.touch) {
            // With the aim stick on (Fase 15C) the left half moves and the right half aims; off, anywhere moves.
            const aimSide = (x: number): boolean => settings.current.aimStick && x >= GAME_WIDTH * TOUCH_AIM_ZONE_START;
            const critCorner = (x: number, y: number, maxY: number): boolean =>
                x >= GAME_WIDTH - TOUCH_RESERVED_CORNER.width && y >= maxY - TOUCH_RESERVED_CORNER.height;
            this.joystick = new TouchJoystick(this, playAreaBottom(), DEPTH_DEBUG - 2, TOUCH_JOYSTICK,
                (x, y, maxY) => !aimSide(x) && !critCorner(x, y, maxY));
            this.aimStick = new TouchJoystick(this, playAreaBottom(), DEPTH_DEBUG - 2, TOUCH_AIM_STICK,
                (x, y, maxY) => aimSide(x) && !critCorner(x, y, maxY));
            this.inputSystem.setTouchJoystick(this.joystick);
            this.inputSystem.setTouchAimStick(this.aimStick);
        }
        this.fitPlayArea();
        this.mapView.setTreeMode(DEBUG_START.trees ?? settings.current.largeTrees);
        const onSettings = () => {
            this.fitPlayArea();
            this.mapView.setTreeMode(settings.current.largeTrees);
        };
        settings.on(SETTINGS_CHANGED, onSettings);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => settings.off(SETTINGS_CHANGED, onSettings));
        this.debug = new DebugSystem(this, map, this.player, this.inputSystem, () => [
            `Enemies: ${this.enemies.alive} alive · ${this.enemies.pooled} pooled`,
            `Health: ${this.player.hp}/${this.player.maxHp}${this.player.godMode ? '  [INVINCIBLE]' : ''}`,
            `Level ${this.stats.level} · XP ${this.stats.xp}/${this.stats.xpToNext} · gems ${this.xp.active}`,
            `Time: ${formatTime(this.spawner.elapsed)}  wave ${this.spawner.waveNumber}  spawn every ${this.spawner.currentInterval().toFixed(2)} s`,
            `Kills: ${this.combat.kills} · projectiles ${this.weapons.activeProjectiles} · numbers ${this.damageNumbers.active} · pickups ${this.pickups.active} · particles ${this.particles.active}`,
            `Sounds: ${this.audio.playingCount} playing · ${this.audio.skippedCount} skipped`,
        ]);
        this.godModeLabel = this.add.text(GAME_WIDTH - 10, 10, 'INVINCIBLE (G)', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffd860', backgroundColor: '#000000a0', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_DEBUG).setVisible(false);
        this.launchHud();
    }

    /** Applies the values that come from the stats to the player and the weapons (after a level up or a card). */
    private applyStats(): void {
        const stats = this.stats;
        this.player.setMaxHp(stats.maxHp);
        this.player.regenPerSecond = stats.hpRegenPerSecond;
        this.player.speedMultiplier = stats.moveSpeedMultiplier * (1 + this.equipment.passiveBonus('boots'));
        this.xp.magnetMultiplier = 1 + this.equipment.passiveBonus('magnetAmulet');
        this.weapons.setCooldownMultiplier(stats.cooldownMultiplier);
        stats.gearMagicBonus = this.equipment.magicDamageBonus;
    }

    /** The player touched a pickup on the ground. */
    private collectPickup(id: PickupId): void {
        switch (id) {
            case 'potion':
                this.player.heal(Math.round(this.player.maxHp * POTION_HEAL_SHARE));
                this.achievements.potionsDrunk++;
                break;
            case 'magnet':
                this.xp.attractAll();
                break;
            case 'chest':
                this.chestCards++;
                break;
            case 'finalChest':
                this.chestCards++;
                this.openPortalBeside(this.player.x, this.player.y);
                break;
        }
    }

    /** The player stepped on a totem (Fase 16B). */
    private collectTotem(id: TotemId): void {
        const def = getTotem(id);
        const effect = def.effect;
        switch (effect.kind) {
            case 'buff':
                this.buffs.start(effect.buff);
                return;
            case 'fullHeal':
                this.player.heal(this.player.maxHp);
                break;
            case 'freeze': {
                const view = this.cameras.main.worldView;
                this.enemies.forEachAlive((enemy) => {
                    if (view.contains(enemy.x, enemy.y)) enemy.freeze(effect.durationMs);
                });
                break;
            }
        }
        if (def.castEffect) this.weapons.spawnEffect(def.castEffect, this.player.x, this.player.y);
        if (def.castSound) this.audio.play(def.castSound);
        this.buffs.announce(def.name, def.color);
    }

    /** Pauses the game and shows the cards (of a level up, or of a chest). Picking one applies it and resumes. */
    private openLevelUp(fromChest: boolean): void {
        this.levelUpOpen = true;
        if (!fromChest) this.audio.play(GENDER_SOUNDS[this.player.look.gender].levelUp);
        const stats = this.stats;
        const data: LevelUpSceneData = {
            stats,
            equipment: this.equipment,
            choices: buildLevelUpChoices(stats, this.equipment),
            title: fromChest ? CHEST_CARDS_TITLE : undefined,
            onChoose: (choice) => {
                this.chooseCard(choice, fromChest);
                this.levelUpOpen = false;
                this.scene.stop('LevelUp');
                this.scene.resume();
            },
        };
        this.scene.pause();
        this.scene.launch('LevelUp', data);
    }

    /** After the final boss (Fase 13C): the levels still count (and their automatic points), but no cards come out. */
    private levelUpWithoutCards(): void {
        this.audio.play(GENDER_SOUNDS[this.player.look.gender].levelUp);
        while (this.stats.pendingLevelUps > 0) this.chooseCard(undefined);
    }

    /** A card was picked (by the player, or at random in the simulated run). */
    private chooseCard(choice: LevelUpChoice | undefined, fromChest = false): void {
        if (choice) {
            this.applyChoice(choice);
            this.metrics.onCard(choice);
        }
        if (fromChest) this.chestCards--;
        else this.stats.pendingLevelUps--;
        this.applyStats();
        this.saveRun();
    }

    private applyChoice(choice: LevelUpChoice): void {
        switch (choice.kind) {
            case 'stat':
                this.stats.addStat(choice.stat, choice.points);
                break;
            case 'weaponLink':
            case 'weaponSwitch':
                this.equipMelee(choice.weapon);
                break;
            case 'spellLink':
            case 'spellSwitch':
                this.equipSpell(choice.spell);
                break;
            case 'passive':
                this.equipment.passives[choice.passive] = choice.rank;
                break;
            case 'armor':
                for (const [slot, layer] of this.equipment.wear(choice.piece)) this.player.setGear(slot, layer);
                break;
        }
    }

    /** One weapon in hand: the new one takes the old one's place. */
    private equipMelee(id: MeleeWeaponId): void {
        const weapon = new MeleeWeapon(id);
        if (this.meleeWeapon) this.weapons.replace(this.meleeWeapon, weapon);
        else this.weapons.add(weapon);
        this.meleeWeapon = weapon;
        this.equipment.weapon = id;
        this.player.setGear('weapon', this.equipment.weaponLayer());
    }

    /** One spell in hand, like the Warrior's weapon. The wand stays: it is only for looks. */
    private equipSpell(id: SpellId): void {
        const spell = new SpellWeapon(id);
        if (this.spellWeapon) this.weapons.replace(this.spellWeapon, spell);
        else this.weapons.add(spell);
        this.spellWeapon = spell;
        this.equipment.spell = id;
    }

    /** Continue: puts back what the saved run had. The monsters start again with the wave of that minute. */
    private restore(run: Readonly<RunSnapshot>): void {
        const stats = this.stats;
        stats.level = run.level;
        stats.xp = run.xp;
        stats.pendingLevelUps = run.pendingLevelUps;
        this.chestCards = run.chestCards;
        for (const id of STAT_IDS) stats.stats[id] = run.stats[id];
        if (run.weapon && run.weapon !== this.equipment.weapon) this.equipMelee(run.weapon);
        if (run.spell && run.spell !== this.equipment.spell) this.equipSpell(run.spell);
        for (const piece of Object.values(run.armor)) {
            for (const [slot, layer] of this.equipment.wear(piece)) this.player.setGear(slot, layer);
        }
        Object.assign(this.equipment.passives, run.passives);
        this.player.setMaxHp(stats.maxHp, true);
        this.applyStats();
        this.player.restoreHp(run.hp);
        this.combat.restoreKills(run.kills);
        this.achievements.potionsDrunk = run.potionsDrunk;
        this.buffs.restore(run.buffs);
        this.spawner.resumeAt(run.elapsedMs, RESUME_CALM_MS, run.bosses);
        // Saved after the final boss: the player starts somewhere else, so its chest (or the portal) appears next to them.
        if (run.finalBossDead) {
            this.finalBossDead = true;
            const x = this.player.x + PORTAL.resumeOffsetX;
            if (run.portalMsLeft !== undefined) this.portal = new Portal(this, x, this.player.y, run.portalMsLeft);
            else this.pickups.drop('finalChest', x, this.player.y);
        }
    }

    /** What SaveStore keeps of this run. */
    private snapshot(): RunSnapshot {
        const { stats, equipment } = this;
        return {
            savedAt: Date.now(),
            map: this.mapId,
            character: this.characterId,
            characterUid: this.characterUid,
            elapsedMs: this.spawner.elapsed,
            level: stats.level,
            xp: stats.xp,
            pendingLevelUps: stats.pendingLevelUps,
            chestCards: this.chestCards,
            stats: { ...stats.stats },
            hp: this.player.hp,
            kills: this.combat.kills,
            weapon: equipment.weapon,
            spell: equipment.spell,
            armor: { ...equipment.armor },
            passives: { ...equipment.passives },
            buffs: this.buffs.remaining,
            bosses: [...this.bosses.aliveIds, ...this.spawner.bossesWaiting],
            finalBossDead: this.finalBossDead,
            portalMsLeft: this.portal?.timeLeft ?? (this.portalInMs >= 0 ? PORTAL.durationMs : undefined),
            potionsDrunk: this.achievements.potionsDrunk,
            metrics: this.metrics.snapshot(),
        };
    }

    /** Saves the run, unless it is already decided (dead, or over). With the portal open, its countdown is kept. */
    private saveRun(): void {
        if (this.runOver || this.player.isDead || this.saveSlot < 0) return;
        saveStore.save(this.saveSlot, this.snapshot());
    }

    /** Saves when the tab goes to the background (the phone may close it there) and when leaving the run. */
    private watchForSaving(): void {
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') this.saveRun();
        };
        const onPageHide = () => this.saveRun();
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', onPageHide);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.saveRun();
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', onPageHide);
        });
    }

    /** Bottom bar in its own scene on top. It is stopped with this scene (restart, sprite test). */
    private launchHud(): void {
        const mapDef = MAPS_DATA[this.mapId];
        const map = getMap(this, mapDef.asset);
        const data: HudSceneData = {
            gameSceneKey: this.scene.key,
            minimap: { key: mapDef.minimap, mapWidth: map.width, mapHeight: map.height, playArea: mapDef.playArea },
            getState: () => ({
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                // Todavía no se gasta maná: siempre lleno.
                mana: this.stats.maxMana,
                maxMana: this.stats.maxMana,
                xpRatio: this.stats.xpRatio,
                level: this.stats.level,
                elapsedMs: this.spawner.elapsed,
                kills: this.combat.kills,
                pauseLocked: this.player.isDead || this.levelUpOpen || this.runOver,
                boss: this.bossInfo(),
                portalSecondsLeft: this.portal ? Math.ceil(this.portal.timeLeft / 1000) : undefined,
                stats: this.stats,
                weaponName: this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name,
                defense: this.equipment.defense,
                defenseRatio: this.defenseRatio,
                magicResistance: this.magicResistance,
                passiveRanks: this.equipment.passives,
                buffs: this.buffs.active.map(({ def, secondsLeft }) => ({ name: def.name, secondsLeft, color: def.color })),
                minimap: { player: this.player, bosses: this.bosses.tracked.filter((boss) => boss.isAlive), totems: this.totems.active },
            }),
        };
        this.scene.launch('Hud', data);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.stop('Hud');
            this.scene.stop('LevelUp');
            this.scene.stop('GameOver');
            this.scene.stop('Pause');
            this.scene.stop('Settings');
        });
    }

    /** Game area down to the HUD bar, or the whole screen with the compact HUD (it can change from the pause menu). */
    private fitPlayArea(): void {
        const bottom = playAreaBottom();
        this.cameras.main.setViewport(0, 0, GAME_WIDTH, bottom);
        this.inputSystem.setPointerMaxY(bottom);
        this.joystick?.setMaxY(bottom);
        this.aimStick?.setMaxY(bottom);
    }

    override update(_time: number, delta: number): void {
        const sim = this.sim;
        if (!sim) {
            this.step(delta);
            // The character's best level (shown on the select screen); cheap when it isn't a new best.
            characterStore.recordLevel(this.characterUid, this.stats.level);
            return;
        }
        // Simulated run: many short steps per drawn frame.
        sim.run((d) => this.step(d));
        const stopReason = sim.stopReason;
        if (stopReason && !this.runOver) {
            sim.finish(stopReason, this.stats.level, this.spawner.elapsed, this.combat.kills, this.simBuild());
            this.endRun(true);
        }
    }

    /** One moment of the run; false when it has ended (or the scene changed). */
    private step(delta: number): boolean {
        const input = this.inputSystem;
        input.update();
        if (input.justPressed(Action.ToggleDebug)) {
            this.debug.toggle();
        }
        // The sprite test shows the Orc, which arrives with a later wave: only once it has loaded.
        if (input.justPressed(Action.OpenSpriteTest) && assetStreamer.isReady('orc')) {
            this.scene.start('SpriteTest');
            return false;
        }
        if (import.meta.env.DEV) {
            this.handleDebugKeys(delta);
        }

        const player = this.player;
        const move = this.sim ? this.sim.nextMove(delta, player.x, player.y, this.bosses.shown) : input.getMove();
        player.update(player.isDead ? Phaser.Math.Vector2.ZERO : move, delta);
        // No steps while standing still for a swing.
        this.updateFootsteps(!player.isDead && !player.isRooted && move.lengthSq() > 0);
        this.world.targetX = player.x;
        this.world.targetY = player.y;
        this.world.defenseRatio = this.defenseRatio;
        this.world.onBlow = this.sim ? this.onSimBlow : undefined;
        this.enemies.update(delta, this.world);
        // Manual aim (right click / right stick) wins over the automatic one; the simulated run always aims on its own.
        const manualAim = this.sim || player.isDead ? undefined : input.getManualAim();
        this.weapons.setManualAim(manualAim);
        this.weapons.update(delta, player.x, player.y, !player.isDead);
        this.aimArrow.update(manualAim, player.x, player.y);
        this.damageNumbers.update(delta);
        this.screenShake.update(delta);
        if (!player.isDead) {
            this.gainXp(this.xp.update(delta, player.x, player.y));
        }
        this.pickups.update(delta, player.x, player.y, !player.isDead);
        this.totems.enabled = !player.isDead && !this.finalBossDead;
        this.totems.update(delta, player.x, player.y, !player.isDead);
        this.buffs.update(delta);
        this.stats.buffDamageMultiplier = this.buffs.damageMultiplier;
        this.spawner.enabled = !player.isDead && !this.finalBossDead;
        this.spawner.update(delta);
        this.sim?.onAlive(this.enemies.alive, this.spawner.elapsed);
        const bodyY = player.y - PLAYER_BODY_OFFSET_Y;
        this.bosses.update(delta, player.x, bodyY, !player.isDead);
        const shotDamage = this.enemyShots.update(delta, player.x, bodyY, PLAYER_BODY_RADIUS,
            { defenseRatio: this.defenseRatio, magicResistance: this.magicResistance }, this.world.onBlow);
        this.updateMusic();
        if (!player.isDead) this.achievements.update(delta);
        if (!player.isDead && !this.sim) this.metrics.update(delta, this.spawner.elapsed, this.stats.level);

        const bossBlow = this.enemies.landedBossDamage + (this.enemyShots.hitFromBoss ? shotDamage : 0);
        if (this.sim && bossBlow > 0) {
            this.sim.onBossHit(this.bosses.shown?.def.name ?? 'Boss', this.reduceByArmor(bossBlow), player.maxHp, this.spawner.elapsed);
        }
        if (!player.isDead) {
            const by = this.enemies.landedDamage >= shotDamage ? this.enemies.landedBy : this.enemyShots.hitBy;
            this.hurtPlayer(this.enemies.landedDamage + shotDamage, this.enemies.landedFromBoss || this.enemyShots.hitFromBoss, by);
        } else if (player.deadForMs > GAME_OVER_DELAY_MS) {
            this.endRun(false);
            return false;
        }
        if (this.updatePortal(delta)) {
            this.endRun(true);
            return false;
        }

        this.mapView.updateFading(player.y, player.getVisualBounds());
        this.debug.update();
        if ((this.autosaveInMs -= delta) <= 0) {
            this.autosaveInMs = AUTOSAVE_EVERY_MS;
            this.saveRun();
        }

        if (this.stats.pendingLevelUps > 0 && !this.levelUpOpen && !player.isDead) {
            if (this.finalBossDead) this.levelUpWithoutCards();
            else if (this.sim) this.chooseCard(this.sim.pick(buildLevelUpChoices(this.stats, this.equipment)));
            else this.openLevelUp(false);
        } else if (this.chestCards > 0 && !this.levelUpOpen && !player.isDead) {
            // A chest's card, even after the final boss (its chest gives one too).
            if (this.sim) this.chooseCard(this.sim.pick(buildLevelUpChoices(this.stats, this.equipment)), true);
            else this.openLevelUp(true);
        }
        return true;
    }

    /** Opens the portal a moment after the final chest is picked up; true when the run is won (stepped in or time up). */
    private updatePortal(delta: number): boolean {
        if (this.portalInMs >= 0 && (this.portalInMs -= delta) < 0) {
            this.portal = new Portal(this, this.portalX, this.portalY, PORTAL.durationMs);
            this.events.emit(ANNOUNCE_EVENT, PORTAL.message);
        }
        const portal = this.portal;
        if (!portal || this.player.isDead) return false;
        return !portal.update(delta) || portal.contains(this.player.x, this.player.y);
    }

    /** Running: footstep sound in a loop at the pace of the run animation, and a puff of dust every tile. */
    private updateFootsteps(running: boolean): void {
        const player = this.player;
        const moved = Math.hypot(player.x - this.lastX, player.y - this.lastY);
        this.lastX = player.x;
        this.lastY = player.y;
        if (!running) {
            this.audio.stopLoop('sfx.footsteps');
            return;
        }
        const runCycleMs = (PLAYER_FRAMES_PER_DIRECTION / player.def.runFrameRate) * 1000;
        this.audio.startLoop('sfx.footsteps', runCycleMs / FOOTSTEPS_PER_RUN_CYCLE);
        this.dustDistance += moved;
        if (this.dustDistance >= FOOTSTEP_DUST_EVERY_PX) {
            this.dustDistance = 0;
            this.weapons.spawnEffect('fx.footsteps', player.x, player.y);
        }
    }

    /** A monster blow or a fireball: armor reduces it; if it lands, the original hit spark, cry and animation, and a shake. */
    private hurtPlayer(damage: number, byBoss: boolean, source: string): void {
        const player = this.player;
        const taken = this.reduceByArmor(damage);
        if (!player.takeDamage(taken)) return;
        this.metrics.onHurt(source, taken, player.hp, player.maxHp);
        this.screenShake.hurt(byBoss);
        if (player.isDead) {
            this.audio.play(GENDER_SOUNDS[player.look.gender].death);
            return;
        }
        this.weapons.spawnEffect('fx.hit', player.x, player.y - PLAYER_BODY_OFFSET_Y);
        this.audio.play('sfx.player.hurt');
        player.act(PlayerState.Hurt, player.direction, PLAYER_HURT_MS, PLAYER_HURT_STUN_MS);
    }

    /** Defense against monster blows: Dex plus the armor worn (data/defense.ts). */
    private get defenseRatio(): number {
        return playerDefenseRatio(this.stats.stats.dex, this.equipment.defenseRatio);
    }

    /** Resistance against spells: Magic plus the armor worn (data/defense.ts). */
    private get magicResistance(): number {
        return playerMagicResistance(this.stats.stats.mag, this.equipment.magicResistance);
    }

    /** The simulated run counts every blow, landed or dodged (it is told only while ?debug=sim runs). */
    private readonly onSimBlow = (source: string, damage: number, landed: boolean): void => {
        this.sim?.onBlow(source, damage, landed);
    };

    /** Armor and a Defense Shield remove part of each hit (0 stays 0: no enemy touching). */
    private reduceByArmor(damage: number): number {
        if (damage <= 0) return 0;
        return Math.max(MIN_DAMAGE_TAKEN, Math.round(damage * (1 - this.equipment.defense) * this.buffs.damageTakenMultiplier));
    }

    private gainXp(amount: number): void {
        if (amount <= 0) return;
        const level = this.stats.level;
        this.sim?.onXp(amount, this.spawner.elapsed);
        this.stats.addXp(amount);
        for (let reached = level + 1; this.sim && reached <= this.stats.level; reached++) this.sim.onLevel(reached, this.spawner.elapsed);
        // Automatic points per level (e.g. +1 Str +1 Vit) change health and speed right away.
        if (this.stats.level !== level) this.applyStats();
    }

    /** Debug keys (development only). The same actions can run at the start from the address: ?debug= (debugStart.ts). */
    private handleDebugKeys(delta: number): void {
        const input = this.inputSystem;
        const keys: Array<[Action, DebugAction]> = [
            [Action.DebugSpawnMany, 'horde'],
            [Action.DebugKillVisible, 'kill'],
            [Action.DebugGiveXp, 'levelup'],
            [Action.DebugGiveLevels, 'levels'],
            [Action.DebugAddStr, 'str'],
            [Action.DebugAddMagic, 'magic'],
            [Action.DebugDropPickups, 'pickups'],
            [Action.DebugSkipMinute, 'minute'],
            [Action.DebugNextBoss, 'boss'],
            [Action.DebugGodMode, 'god'],
        ];
        const finalBoss = this.killFinalBossPending ? this.bosses.finalBoss : undefined;
        if (finalBoss) {
            this.killFinalBossPending = false;
            this.combat.slay(finalBoss);
        }
        for (const [action, debugAction] of keys) {
            if (input.justPressed(action)) this.runDebugAction(debugAction);
        }
        // Not on the first frame: the camera has not placed its view yet and the horde would find no room around it.
        if (this.debugStartPending && (this.debugStartWaitMs -= delta) <= 0) {
            this.debugStartPending = false;
            for (const action of DEBUG_START.actions) this.runDebugAction(action);
        }
    }

    private runDebugAction(action: DebugAction): void {
        switch (action) {
            case 'horde':
                this.spawner.spawnMany(DEBUG_SPAWN_COUNT);
                break;
            case 'kill':
                this.combat.killAll(undefined, this.cameras.main.worldView);
                break;
            case 'levelup':
                this.gainXp(this.stats.xpToNext - this.stats.xp);
                break;
            case 'levels':
                for (let i = 0; i < DEBUG_LEVELS; i++) this.gainXp(this.stats.xpToNext - this.stats.xp);
                break;
            case 'str':
                this.stats.addStat('str', DEBUG_STR_POINTS);
                this.applyStats();
                break;
            case 'magic':
                this.stats.addStat('int', DEBUG_STR_POINTS);
                this.stats.addStat('mag', DEBUG_STR_POINTS);
                this.applyStats();
                break;
            case 'pickups': {
                const { x, y } = this.player;
                this.pickups.drop('potion', x - DEBUG_PICKUP_SPACING, y + DEBUG_PICKUP_SPACING);
                this.pickups.drop('magnet', x, y + DEBUG_PICKUP_SPACING * 1.5);
                this.pickups.drop('chest', x + DEBUG_PICKUP_SPACING, y + DEBUG_PICKUP_SPACING);
                break;
            }
            case 'totems':
                // The 4 totems in a row under the player (Fase 16B).
                TOTEM_IDS.forEach((id, i) => this.totems.place(id,
                    this.player.x + (i - (TOTEM_IDS.length - 1) / 2) * DEBUG_TOTEM_SPACING, this.player.y + DEBUG_TOTEM_SPACING));
                break;
            case 'minute':
                this.spawner.skip(DEBUG_SKIP_MS);
                break;
            case 'boss':
                this.spawner.skipToNextBoss();
                break;
            case 'finalboss':
                this.spawner.skipToNextBoss(true);
                break;
            case 'bosskill':
                this.spawner.skipToNextBoss(true);
                this.killFinalBossPending = true;
                break;
            case 'stampede':
                this.spawner.runFirstEvent('stampede');
                break;
            case 'god':
                this.player.setGodMode(!this.player.godMode);
                this.godModeLabel.setVisible(this.player.godMode);
                break;
            case 'aim':
                // Aims to the right until pressed again (manual aim without a mouse or gamepad, Fase 15B).
                this.debugAimForced = !this.debugAimForced;
                this.inputSystem.setForcedAim(this.debugAimForced ? { x: 1, y: 0 } : undefined);
                break;
            case 'aimstick':
                // A pretend finger on the aim stick, pushed to the right (touch screens only, Fase 15C).
                this.aimStick?.debugHold(GAME_WIDTH * 0.75, playAreaBottom() / 2, TOUCH_AIM_STICK.radius, 0);
                break;
            case 'dodge':
                // The best armor of the class in every slot, to see blows miss and spells resisted (Fases 18A and 18B). No achievements: they would be free.
                this.achievements.enabled = false;
                for (const pieces of Object.values(ARMOR_BY_SET[this.stats.def.armorSet])) {
                    const best = pieces[pieces.length - 1];
                    if (best) for (const [slot, layer] of this.equipment.wear(best)) this.player.setGear(slot, layer);
                }
                break;
            case 'stats':
                // Opened by the Hud scene itself.
                break;
            case 'sim':
                this.sim = new SimRun(this.stats.def.name);
                this.achievements.enabled = false;
                if (!this.player.godMode) this.runDebugAction('god');
                break;
            case 'resume':
                // As if the phone had closed the tab and the player chose Continue.
                this.saveRun();
                this.registry.set(RESUME_SLOT_KEY, this.saveSlot);
                this.scene.restart();
                break;
        }
    }

    /** A moment of the timeline: shows its warning and remembers the bosses. */
    private onWaveEvent(event: WaveEventDef, spawned: readonly Enemy[]): void {
        this.events.emit(ANNOUNCE_EVENT, event.message);
        for (const enemy of spawned) {
            this.bosses.track(enemy, event.enemy);
            if (!enemy.def.boss) continue;
            this.sim?.onBossSpawn(enemy.def.name, this.spawner.elapsed);
            this.metrics.onBossSpawn(enemy.def.name, this.spawner.elapsed);
        }
    }

    /**
     * Bosses drop a chest. The final boss drops its own chest (which opens the portal) and kills every other monster;
     * all the XP on the ground flies to the player by itself, and the levels it gives come without cards.
     */
    private onEnemyKilled(enemy: Enemy): void {
        const boss = enemy.def.boss;
        if (!boss) {
            this.sim?.onKill(enemy.hitsTaken);
            return;
        }
        this.sim?.onBossDead(enemy.def.name, this.spawner.elapsed);
        this.metrics.onBossDead(enemy.def.name, this.spawner.elapsed);
        this.achievements.onBossKilled(enemy.def);
        if (!boss.final) {
            if (boss.dropsChest) this.pickups.drop('chest', enemy.x, enemy.y);
            return;
        }
        if (this.finalBossDead) return;
        this.finalBossDead = true;
        this.sim?.onFinalBossDead(this.spawner.elapsed);
        this.pickups.drop('finalChest', enemy.x, enemy.y);
        this.events.emit(ANNOUNCE_EVENT, PORTAL.bossDeadMessage);
        this.combat.killAll((other) => {
            this.xp.drop(other.x, other.y, other.def.xp);
            this.onEnemyKilled(other);
        });
        this.xp.attractAll();
    }

    /** The final chest was opened at (x, y): the portal opens to one side (to the right, or left if there is a wall). */
    private openPortalBeside(x: number, y: number): void {
        if (this.portal || this.portalInMs >= 0) return;
        const { map, area } = this.world;
        const side = [PORTAL.besideChestX, -PORTAL.besideChestX].find((dx) => canStandAt(map, area, x + dx, y, ENEMY_WALL_HALF_SIZE)) ?? PORTAL.besideChestX;
        this.portalX = x + side;
        this.portalY = y;
        this.portalInMs = PORTAL.openDelayMs;
    }

    private updateMusic(): void {
        const moment = this.bosses.music;
        this.music.play(moment === 'finalBoss' ? MUSIC.finalBoss : moment === 'miniBoss' ? MUSIC.miniBoss : MUSIC.normal);
    }

    /** Boss for the big health bar at the top, if any. */
    private bossInfo(): HudState['boss'] {
        const boss = this.bosses.shown;
        return boss?.def.boss ? { name: boss.def.boss.title, hp: Math.max(0, boss.hp), maxHp: boss.def.maxHp } : undefined;
    }

    /** Weapon, stats and cards of the simulated run, for its report. */
    private simBuild(): string {
        const weapon = this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name ?? '';
        const stats = STAT_IDS.map((id) => `${id} ${this.stats.stats[id]}`).join(', ');
        const cards = [...(this.sim?.cards ?? [])].map(([kind, count]) => `${kind} ×${count}`).join(', ');
        return `${weapon} · ${stats} · cards: ${cards}`;
    }

    /** Anonymous summary of the run for the metrics server (Fase 14A), if the player allows it. */
    private sendMetrics(result: RunResult): void {
        if (!metricsAllowed(this.sim !== undefined)) return;
        const { equipment } = this;
        const armor = Object.values(equipment.armor).map((id) => getArmorPiece(id).name);
        const passives = PASSIVE_IDS.filter((id) => equipment.passives[id] > 0)
            .map((id) => `${getPassive(id).name} ${equipment.passives[id]}`);
        const gear = [this.meleeWeapon?.def.name, this.spellWeapon?.def.name, ...armor, ...passives]
            .filter((name): name is string => !!name);
        sendRunReport(this.metrics.report({
            version: GAME_VERSION,
            map: this.mapId,
            character: this.characterId,
            device: COMPACT_UI ? 'mobile' : 'desktop',
            result,
            durationMs: Math.round(this.spawner.elapsed),
            level: this.stats.level,
            kills: this.combat.kills,
            potions: this.achievements.potionsDrunk,
            gear,
            zemUsed: 0,
            crits: 0,
        }));
    }

    /** Opens the end screen over the paused game. */
    private endRun(victory: boolean): void {
        if (this.runOver) return;
        this.runOver = true;
        if (victory) this.achievements.onWin();
        this.sim?.finish(victory ? 'portal' : 'died', this.stats.level, this.spawner.elapsed, this.combat.kills, this.simBuild());
        saveStore.clear(this.saveSlot);
        const armor = Object.values(this.equipment.armor).map((id) => getArmorPiece(id).name);
        this.sendMetrics(victory ? 'win' : 'death');
        const data: GameOverSceneData = {
            victory,
            elapsedMs: this.spawner.elapsed,
            level: this.stats.level,
            kills: this.combat.kills,
            className: this.stats.def.name,
            weaponName: this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name ?? '',
            armorNames: armor,
            achievementNames: this.achievementsThisRun,
            onRestart: () => {
                this.scene.stop('GameOver');
                this.scene.restart();
            },
            onChangeClass: () => {
                this.scene.stop('GameOver');
                this.scene.start('CharacterSlots');
            },
            onMainMenu: () => {
                this.scene.stop('GameOver');
                this.scene.start('MainMenu');
            },
        };
        this.audio.stopLoop('sfx.footsteps');
        this.scene.pause();
        this.scene.launch('GameOver', data);
    }
}


/** The walkable tile closest to (tx, ty), searching in growing squares. */
function findSpawnTile(map: HBMap, tx: number, ty: number): { x: number; y: number } {
    const maxRadius = Math.max(map.width, map.height);
    for (let r = 0; r < maxRadius; r++) {
        for (let y = ty - r; y <= ty + r; y++) {
            for (let x = tx - r; x <= tx + r; x++) {
                const onRing = Math.abs(x - tx) === r || Math.abs(y - ty) === r;
                if (onRing && map.isWalkableTile(x, y)) {
                    return { x, y };
                }
            }
        }
    }
    throw new Error('The map has no walkable tile');
}
