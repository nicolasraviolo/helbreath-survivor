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
import { onTouchFullscreenButton, TOUCH_AIM_STICK, TOUCH_AIM_ZONE_START, TOUCH_JOYSTICK, TOUCH_RESERVED_CORNER } from '../config/touch';
import { ANNOUNCE_EVENT, QUIT_RUN_EVENT } from '../config/hud';
import { getArmorPiece } from '../data/armor';
import { canHaveAttribute, classCanWear, isArmorPieceId, isMeleeWeaponId, isSpellItemId, itemInfo, MANUAL_SPELL_IDS, START_EQUIPMENT, type EquipSlotId, type SavedEquipment } from '../data/items';
import type { ItemAttribute } from '../data/attributes';
import { isWandId, type WandId } from '../data/wands';
import { upgradeOf } from '../data/upgrades';
import { LOOT_DEBUG, LOOT_SOUNDS, MANUAL_LEARNED, type OwnedItem } from '../data/loot';
import { LootSystem } from '../systems/LootSystem';
import { RunLoot } from '../systems/RunLoot';
import type { LootSceneData } from './LootScene';
import { MUSIC } from '../data/audio';
import type { SoundKey } from '../config/assetManifest';
import { PORTAL, finalBossMinute, type WaveEventDef } from '../data/waves';
import { CHAMPION, championMessage, championMetricsName, rollChampionMinutes } from '../data/champion';
import type { Enemy } from '../entities/Enemy';
import { Portal } from '../entities/Portal';
import { BossSystem } from '../systems/BossSystem';
import { EnemyProjectileSystem } from '../systems/EnemyProjectileSystem';
import { MusicSystem } from '../systems/MusicSystem';
import type { GameOverSceneData } from './GameOverScene';
import { startTown } from './MapLoadScene';
import { DEFAULT_LOOKS, GENDER_SOUNDS } from '../data/appearance';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId, type CharacterId } from '../data/characters';
import { CHOSEN_MAP_KEY, DEFAULT_MAP, isMapId, MAPS_DATA, type MapId } from '../data/maps';
import { getTimeline } from '../data/waves';
import { AUTOSAVE_EVERY_MS, RESUME_CALM_MS } from '../data/saves';
import { STAT_IDS, type Stats } from '../data/stats';
import type { MeleeWeaponId } from '../data/weapons';
import { isAutoSpellId, type AutoSpellId } from '../data/spells';
import { RESUME_SLOT_KEY, saveStore, type RunSnapshot } from '../systems/SaveStore';
import { ACTIVE_CHARACTER_KEY, characterStore, permanentStats } from '../systems/CharacterStore';
import { lookLoader, runSprites } from '../systems/LookLoader';
import { MIN_DAMAGE_TAKEN } from '../data/armor';
import { MELEE_ROOT_MOMENT } from '../data/weapons';
import { CAST_RELEASE_MOMENT } from '../data/spells';
import { FOOTSTEP_DUST_EVERY_PX, FOOTSTEPS_PER_RUN_CYCLE } from '../data/audio';
import { PLAYER_FRAMES_PER_DIRECTION } from '../hb/playerAppearance';
import { CharacterStats } from '../entities/CharacterStats';
import { BuffSystem } from '../systems/BuffSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { EPIC_CARD_SOUND } from '../data/cardRarity';
import { CARD_ACTION, SKIP_HEAL_SHARE, type CardAction } from '../data/rerollSkip';
import { unlockStore } from '../systems/UnlockStore';
import { GOLD, goldValue } from '../data/gold';
import { BLUE_POTION_MANA_SHARE, CHEST_CARDS_TITLE, POTION_HEAL_SHARE, type PickupId } from '../data/pickups';
import { getTotem, TOTEM_IDS, type TotemId } from '../data/totems';
import { TotemSystem } from '../systems/TotemSystem';
import { playerDefenseRatio, playerMagicResistance, RESIST_TEXT, type PlayerDefense } from '../data/defense';
import { ARMOR_BY_SET } from '../data/armor';
import { Equipment } from '../entities/Equipment';
import type { EnemyWorld } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { getMap, type HBMap } from '../hb/HBMap';
import { MapView } from '../hb/mapRenderer';
import { ABADDON } from '../data/abaddon';
import { AbaddonRevive } from '../systems/AbaddonRevive';
import { AudioSystem } from '../systems/AudioSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { DamageNumbers } from '../systems/DamageNumbers';
import { HitParticles } from '../systems/HitParticles';
import { ScreenShake } from '../systems/ScreenShake';
import { Rumble } from '../systems/Rumble';
import { GAMEPAD_RUMBLE } from '../data/feedback';
import { DebugSystem } from '../systems/DebugSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { assetStreamer } from '../systems/AssetStreamer';
import { mapUnlockStore } from '../systems/MapUnlockStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { SETTINGS_CHANGED, settings } from '../systems/Settings';
import { AimArrow } from '../ui/AimArrow';
import type { DragDirection } from '../ui/CritButton';
import { SpellAimMarker } from '../ui/SpellAimMarker';
import type { ManualAim } from '../systems/Targeting';
import { overlayBottom, playAreaBottom } from '../ui/hudLayout';
import { TouchJoystick } from '../ui/TouchJoystick';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { CritStrikeSystem } from '../systems/CritStrikeSystem';
import { maxCritCharges } from '../data/critStrike';
import { ActiveSpellSystem } from '../systems/ActiveSpellSystem';
import { activeSpellAreaRadius, activeSpellSprite, DEFAULT_ACTIVE_SPELL, isActiveSpellId, type ActiveSpellId } from '../data/activeSpells';
import { registerEffectAnimations } from '../config/effects';
import type { SkillOrb } from '../ui/hudLayout';
import { XpSystem } from '../systems/XpSystem';
import { canStandAt } from '../utils/collision';
import { formatTime } from '../utils/format';
import { SpellWeapon } from '../weapons/SpellWeapon';
import { PlayerState } from '../hb/playerAppearance';
import { MeleeWeapon } from '../weapons/MeleeWeapon';
import { angleFromDirection, directionFromVector } from '../hb/directions';
import { buildLevelUpChoices } from '../systems/UpgradePool';
import type { HudSceneData, HudState } from './HudScene';
import type { LevelUpChoice, LevelUpSceneData } from './LevelUpScene';
import { DEBUG_START, type DebugAction } from '../config/debugStart';
import { simProfile } from '../config/simProfile';
import { SimRun } from '../systems/SimRun';
import { ACHIEVEMENT_EVENT, ACHIEVEMENT_SOUND } from '../data/achievements';
import { AchievementTracker } from '../systems/AchievementTracker';
import { GAME_VERSION } from '../config/version';
import { COMPACT_UI } from '../config/device';
import { PASSIVE_IDS, getPassive } from '../data/passives';
import { goldStore } from '../systems/GoldStore';
import { RunMetrics, metricsAllowed, sendRunReport } from '../systems/RunMetrics';
import type { RunResult } from '../config/metrics';
import { ScreenLayer, setGameViewport } from '../ui/renderScale';

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
const MS_PER_MINUTE = 60000;
/** Levels given by the debug key L (one card per level). */
const DEBUG_LEVELS = 5;
/** ?debug=charexp: the run's XP counts this many times for the character's Level (to test the Level up quickly). */
const DEBUG_CHAR_EXP_MULTIPLIER = 50;
/** Wait after the run starts before the ?debug= actions (debugStart.ts). */
const DEBUG_START_DELAY_MS = 500;

/**
 * Escena de partida con el personaje elegido en CharacterSlotsScene: mapa, jugador, oleadas de enemigos con minijefes y jefe
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
    /** Defense and magic resistance, refreshed once per frame and reused (no new object each frame). */
    private readonly playerDefense: PlayerDefense = { defenseRatio: 0, magicResistance: 0 };
    private audio!: AudioSystem;
    private combat!: CombatSystem;
    private particles!: HitParticles;
    private screenShake!: ScreenShake;
    private readonly rumble = new Rumble();
    private weapons!: WeaponSystem;
    /** Critical Strike of the Warrior (Fase 19A); the Mage has none until 19B. */
    private critStrike!: CritStrikeSystem;
    /** The Mage's active spell (Fase 19B); undefined for the Warrior. */
    private activeSpell: ActiveSpellSystem | undefined;
    /** Fase 26B: ring where the Spell 2 will land, and the direction the Mage drags its touch button now (if any). */
    private spellAimMarker!: SpellAimMarker;
    private spellDrag: DragDirection;
    /** The drag as a manual aim, for the arrow at the feet (reused every frame). */
    private readonly spellDragAim: ManualAim = { dirX: 1, dirY: 0, point: undefined };
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
    /** The champion on the map (Fase 21½C), while it lives: it comes back on Continue if it was alive. */
    private champion: Enemy | undefined;
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
    /** Development (M15): which slash style is on, shown once one is picked with ?slash= or Y. */
    private slashLabel!: Phaser.GameObjects.Text;
    private stats!: CharacterStats;
    private xp!: XpSystem;
    private pickups!: PickupSystem;
    /** Items on the ground (Fase 21A). */
    private loot!: LootSystem;
    /** Items found, in the bag and put on this run (Fase 21A). */
    private runLoot!: RunLoot;
    /** Gold picked up this run (Fase 24A): goes to the device's gold when the run ends, won or lost. */
    private runGold = 0;
    /** ?debug=loot: an item falls by the player every few seconds (counted down here; negative = off). */
    private lootDebugInMs = -1;
    private buffs!: BuffSystem;
    /** Abaddon's Blood (Fase 21E): gets up once per run after dying, if unlocked. */
    private abaddon!: AbaddonRevive;
    private totems!: TotemSystem;
    /** Free cards from chests not chosen yet (Fase 16B): they show after any level-up cards. */
    private chestCards = 0;
    /** Rerolls and Skips left in this run (Fase 21½B): one per Dice / Wine bought (UnlockStore). */
    private cardActionsLeft: Record<CardAction, number> = { reroll: 0, skip: 0 };
    private equipment!: Equipment;
    /** Melee weapon in hand (Warrior); undefined for spell casters. */
    private meleeWeapon: MeleeWeapon | undefined;
    /** Spell in hand (Mage); undefined for melee classes. */
    private spellWeapon: SpellWeapon | undefined;
    /** A card is showing (level up, chest or loot): the run is paused under it. */
    private levelUpOpen = false;
    /** Simulated run to measure the balance (?debug=sim, development only). */
    private sim: SimRun | undefined;
    /** The ?level= profile of this debug run, for the simulated run's report ('' without one). */
    private simProfileLabel = '';
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
    /** The character's permanent stats when this run started (class + Level points, Fase 20A). */
    private permanentAtStart!: Stats;
    /** The character's Level (1 in debug runs without one): loot requirements are checked against it (Fase 21A). */
    private characterLevel = 1;
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
        // One run per character, in its slot (Fase 17A). Without a character the run isn't saved (-1).
        const characterSlot = characterStore.slotOf(this.characterUid);
        this.saveSlot = resume && typeof resumeSlot === 'number' ? resumeSlot : characterSlot;
        this.autosaveInMs = AUTOSAVE_EVERY_MS;
        // Fase 22A: the map of the saved run, or the one chosen in Select Map (it stays for Restart); debug runs: ?map= or Bleeding Isle.
        const chosenMap: unknown = this.registry.get(CHOSEN_MAP_KEY);
        this.mapId = resume?.map ?? (isMapId(chosenMap) ? chosenMap : DEFAULT_MAP);
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
        const savedCharacter = characterStore.byUid(this.characterUid);
        const look = savedCharacter?.look ?? DEFAULT_LOOKS[this.characterId];
        // Debug runs may play as a character of some Level instead (?level=, config/simProfile.ts).
        const profile = DEBUG_START.level !== undefined
            ? simProfile(this.characterId, DEBUG_START.level, DEBUG_START.build, DEBUG_START.kit) : undefined;
        // What the saved character wears (Fase 20B), and the item icons for the Xelima and Merien cards (Fase 20C).
        const startEquipment = profile?.equipment ?? savedCharacter?.equipment ?? START_EQUIPMENT[this.characterId];
        // Fase 21B: the attribute of the weapon or wand worn (?attr= gives one to any starting weapon that can have it).
        const startAttribute = (profile ? undefined : savedCharacter?.attributes.weapon) ?? DEBUG_START.attribute;
        // Fase 24D: its "+" from the blacksmith (?upgrade= gives one in runs without a character, or with ?level=).
        const startUpgrade = savedCharacter && !profile ? savedCharacter.upgrades.weapon ?? 0 : DEBUG_START.upgrade ?? 0;
        // Fase 24A: the attributes of the armor it wears (HP Recovery, Defense Ratio...).
        const wornAttributes = (profile ? undefined : savedCharacter?.attributes) ?? {};
        void lookLoader.ensure(this, [...runSprites(character, look, startEquipment), 'item.pack']);
        this.player = new Player(this, (spawn.x + 0.5) * TILE_SIZE, (spawn.y + 0.5) * TILE_SIZE, character, look, map, areaPx);
        // Permanent stats (Fase 20A); debug runs without a character start with the class's.
        this.permanentAtStart = profile ? { ...profile.stats } : savedCharacter ? permanentStats(savedCharacter) : { ...character.startStats };
        this.simProfileLabel = profile?.label ?? '';
        this.characterLevel = profile?.level ?? savedCharacter?.level ?? 1;
        this.stats = new CharacterStats(character, this.permanentAtStart, this.characterLevel);
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
        this.enemies.setPlayerHealthShare(() => this.player.hp / this.player.maxHp);
        this.enemies.difficulty = mapDef.difficulty;
        this.spawner = new SpawnSystem(
            camera, this.enemies, map, areaPx, getTimeline(this.mapId), (event, spawned) => this.onWaveEvent(event, spawned),
            (id) => assetStreamer.isReady(id), (id) => assetStreamer.hurry(id), (champion) => this.onChampion(champion),
        );
        this.champion = undefined;
        this.spawner.setChampions(this.rollChampions(), 0);
        // Normally already started by the map's loading screen (Fase 22B); this covers starting a run any other way.
        assetStreamer.start(this, this.mapId);
        this.damageNumbers = new DamageNumbers(this);
        this.xp = new XpSystem(this, this.audio);
        // Fase 26A: the Blue Potion only drops for a character with a Spell 2 (the Mage).
        this.pickups = new PickupSystem(this, this.audio, (id) => this.collectPickup(id), CHARACTERS[this.characterId].startWeapon.kind === 'spell');
        this.runLoot = new RunLoot();
        this.runGold = 0;
        this.lootDebugInMs = -1;
        const learned = characterStore.learnedSpells(this.characterUid);
        this.loot = new LootSystem(this, this.audio, {
            classId: this.characterId, gender: look.gender, stats: this.permanentAtStart, level: this.characterLevel,
            manuals: [...MANUAL_SPELL_IDS].filter((id) => classCanWear(this.characterId, id) && !learned.includes(id)),
        }, (item) => this.onLootPickup(item));
        this.particles = new HitParticles(this);
        this.screenShake = new ScreenShake(camera);
        this.combat = new CombatSystem(this.enemies, this.damageNumbers, this.audio, this.particles, this.stats, (enemy) => {
            this.dropXp(enemy);
            this.pickups.onKill(enemy.x, enemy.y);
            this.onEnemyKilled(enemy);
        });
        this.weapons = new WeaponSystem(this, this.enemies, this.combat, this.audio, this.screenShake);
        // Fase 19C: the gamepad vibrates when the Critical / Meteor Strike hits (not when it is launched), once per launch.
        this.weapons.onSkillHit = (skill) => {
            if (!this.sim) this.rumble.play(GAMEPAD_RUMBLE[skill]);
        };
        this.critStrike = new CritStrikeSystem(this.weapons, this.audio, this.screenShake);
        this.activeSpell = this.createActiveSpell(startSpells(startEquipment).active);
        this.aimArrow = new AimArrow(this);
        this.spellAimMarker = new SpellAimMarker(this);
        this.spellDrag = undefined;
        this.buffs = new BuffSystem(this, this.player, this.audio, (key, x, y) => this.weapons.spawnEffect(key, x, y));
        this.abaddon = new AbaddonRevive(this, this.audio, this.enemies, (key, x, y) => this.weapons.spawnEffect(key, x, y));
        // Its effect is a big file (5,6 MB): only when it is unlocked, while the run plays.
        if (this.abaddon.isUnlocked) {
            void lookLoader.ensure(this, [ABADDON.effectSprite]).then(() => {
                registerEffectAnimations(this.anims, this.textures);
                this.abaddon.effectLoaded = lookLoader.isReady(this, ABADDON.effectSprite);
            });
        }
        this.totems = new TotemSystem(this, map, areaPx, this.audio, (id) => this.collectTotem(id));
        this.chestCards = 0;
        this.cardActionsLeft = { reroll: unlockStore.count(CARD_ACTION.reroll.unlock), skip: unlockStore.count(CARD_ACTION.skip.unlock) };
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
            // Fase 20B: the weapon of the saved character's equipment (the class's one in debug runs).
            const weaponId = startEquipment.weapon !== undefined && isMeleeWeaponId(startEquipment.weapon) ? startEquipment.weapon : character.startWeapon.id;
            this.meleeWeapon = new MeleeWeapon(weaponId);
            this.equipment.weapon = weaponId;
            this.equipment.weaponAttribute = startAttribute && canHaveAttribute(weaponId, startAttribute) ? startAttribute : undefined;
            this.equipment.weaponUpgrade = startUpgrade;
            this.weapons.add(this.meleeWeapon);
            this.player.setGear('weapon', this.equipment.weaponLayer());
        } else {
            // Fase 21B: the Mage's wand (the starting one in debug runs).
            const wand = startEquipment.weapon !== undefined && isWandId(startEquipment.weapon) ? startEquipment.weapon : START_EQUIPMENT.mage.weapon;
            if (wand !== undefined && isWandId(wand)) this.equipWand(wand, startAttribute && canHaveAttribute(wand, startAttribute) ? startAttribute : undefined, startUpgrade);
            // Fase 20D: the spell of the Spell 1 slot (debug ?spells= may change it).
            this.spellWeapon = new SpellWeapon(startSpells(startEquipment).auto ?? character.startWeapon.id);
            this.equipment.spell = this.spellWeapon.id;
            this.weapons.add(this.spellWeapon);
        }
        for (const id of Object.values(startEquipment)) {
            if (isArmorPieceId(id)) for (const [slot, layer] of this.equipment.wear(id, wornAttributes[getArmorPiece(id).slot])) this.player.setGear(slot, layer);
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
            // The Critical Strike button (Fase 19A) sits there, over the compact gauges if they run along the bottom.
            const critCorner = (x: number, y: number): boolean =>
                x >= GAME_WIDTH - TOUCH_RESERVED_CORNER.width && y >= overlayBottom() - TOUCH_RESERVED_CORNER.height;
            this.joystick = new TouchJoystick(this, playAreaBottom(), DEPTH_DEBUG - 2, TOUCH_JOYSTICK,
                (x, y) => !aimSide(x) && !critCorner(x, y) && !onTouchFullscreenButton(x, y));
            this.aimStick = new TouchJoystick(this, playAreaBottom(), DEPTH_DEBUG - 2, TOUCH_AIM_STICK,
                (x, y) => aimSide(x) && !critCorner(x, y) && !onTouchFullscreenButton(x, y));
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
        }).setOrigin(1, 0).setVisible(false);
        this.slashLabel = this.add.text(GAME_WIDTH - 10, 36, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffd860', backgroundColor: '#000000a0', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setVisible(false);
        new ScreenLayer(this, DEPTH_DEBUG).addFixed(this.godModeLabel, this.slashLabel);
        if (DEBUG_START.slash !== undefined) this.setSlashStyle(DEBUG_START.slash);
        this.launchHud();
    }

    /** Applies the values that come from the stats to the player and the weapons (after a level up or a card). */
    private applyStats(): void {
        const stats = this.stats;
        this.player.setMaxHp(stats.maxHp);
        this.player.regenPerSecond = stats.hpRegenPerSecond * (1 + this.equipment.hpRecovery);
        this.player.speedMultiplier = stats.moveSpeedMultiplier;
        this.xp.magnetMultiplier = 1 + this.equipment.passiveBonus('magnetAmulet');
        this.weapons.setCooldownMultiplier(stats.cooldownMultiplier);
        stats.gearMagicBonus = this.equipment.magicDamageBonus;
        stats.xelimaBonus = this.equipment.passiveBonus('xelima');
        stats.attributeBonus = this.equipment.weaponDamageBonus;
        this.combat.poisonOnHit = this.equipment.poisons;
    }

    /** The player touched a pickup on the ground. */
    private collectPickup(id: PickupId): void {
        switch (id) {
            case 'potion':
                this.player.heal(Math.round(this.player.maxHp * POTION_HEAL_SHARE));
                this.sim?.onHeal(this.player.maxHp * POTION_HEAL_SHARE);
                this.achievements.potionsDrunk++;
                break;
            case 'bluePotion':
                // Fase 26A: only drops for the Mage (PickupSystem); refills a share of the mana.
                this.activeSpell?.addMana(this.stats.maxMana * BLUE_POTION_MANA_SHARE);
                this.achievements.potionsDrunk++;
                break;
            case 'magnet':
                this.xp.attractAll();
                this.pickups.attract();
                break;
            case 'chest':
                this.chestCards++;
                break;
            case 'finalChest':
                this.chestCards++;
                this.openPortalBeside(this.player.x, this.player.y);
                break;
            case 'coin':
                this.runGold += goldValue(GOLD.coinValue, this.mapId);
                this.sim?.onGold(goldValue(GOLD.coinValue, this.mapId), this.spawner.elapsed);
                break;
            case 'goldPile':
                this.runGold += goldValue(GOLD.pileValue, this.mapId);
                this.sim?.onGold(goldValue(GOLD.pileValue, this.mapId), this.spawner.elapsed);
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
                // The visible screen grown `rangeScreens` times around its centre (bosses included).
                const view = this.cameras.main.worldView;
                const area = new Phaser.Geom.Rectangle(0, 0, view.width * effect.rangeScreens, view.height * effect.rangeScreens);
                Phaser.Geom.Rectangle.CenterOn(area, view.centerX, view.centerY);
                this.enemies.forEachAlive((enemy) => {
                    if (area.contains(enemy.x, enemy.y)) enemy.freeze(effect.durationMs);
                });
                break;
            }
        }
        if (def.castEffect) this.weapons.spawnEffect(def.castEffect, this.player.x, this.player.y);
        if (def.castSound) this.audio.play(def.castSound);
        this.buffs.announce(def.name, def.color);
    }

    /** Three cards for a level up or a chest, with their rarity drawn with the run's Chr (Fase 21½A). */
    private levelUpChoices(fromChest: boolean): LevelUpChoice[] {
        return buildLevelUpChoices(this.equipment, this.stats.stats.chr, {
            chest: fromChest,
            onlyPassives: DEBUG_START.actions.includes('stones'),
            allEpic: DEBUG_START.actions.includes('epic'),
        });
    }

    /** Pauses the game and shows the cards (of a level up, or of a chest). Picking one applies it and resumes. */
    private openLevelUp(fromChest: boolean): void {
        this.levelUpOpen = true;
        if (!fromChest) this.audio.play(GENDER_SOUNDS[this.player.look.gender].levelUp);
        const stats = this.stats;
        const choices = this.levelUpChoices(fromChest);
        if (choices.some((c) => c.rarity === 'epic')) this.audio.play(EPIC_CARD_SOUND);
        // A card picked, or none (Skip).
        const close = (choice: LevelUpChoice | undefined) => {
            this.chooseCard(choice, fromChest);
            this.levelUpOpen = false;
            this.scene.stop('LevelUp');
            this.scene.resume();
        };
        const data: LevelUpSceneData = {
            stats,
            equipment: this.equipment,
            choices,
            title: fromChest ? CHEST_CARDS_TITLE : undefined,
            actionsLeft: this.cardActionsLeft,
            onChoose: close,
            // Fase 21½B: three new cards (their rarity drawn again).
            onReroll: () => {
                this.spendCardAction('reroll');
                const fresh = this.levelUpChoices(fromChest);
                if (fresh.some((c) => c.rarity === 'epic')) this.audio.play(EPIC_CARD_SOUND);
                this.saveRun();
                return fresh;
            },
            // No card; heals a little instead.
            onSkip: () => {
                this.spendCardAction('skip');
                this.player.heal(Math.round(this.player.maxHp * SKIP_HEAL_SHARE));
                close(undefined);
            },
        };
        this.scene.pause();
        this.scene.launch('LevelUp', data);
    }

    /** Uses one Reroll or Skip (Fase 21½B): sound, counter and metrics. */
    private spendCardAction(action: CardAction): void {
        this.cardActionsLeft[action] = Math.max(0, this.cardActionsLeft[action] - 1);
        this.audio.play(CARD_ACTION[action].sound);
        this.metrics.onCardAction(action);
    }

    /** What the player wears now in that slot (Fase 21A, for the loot card), with its attribute (Fase 21B). */
    private wornIn(slot: EquipSlotId): OwnedItem | undefined {
        const id = (() => {
            switch (slot) {
                case 'weapon':
                    return this.equipment.weapon ?? this.equipment.wand;
                case 'spell1':
                    return this.equipment.spell;
                case 'spell2':
                    return this.activeSpell?.id;
                case 'zem':
                    return undefined;
                default:
                    return this.equipment.armor[slot];
            }
        })();
        if (id === undefined) return undefined;
        const attribute = slot === 'weapon' ? this.equipment.weaponAttribute : undefined;
        const upgrade = slot === 'weapon' ? this.equipment.weaponUpgrade : 0;
        return { id, ...(attribute ? { attribute } : {}), ...(upgrade > 0 ? { upgrade } : {}) };
    }

    /** Pauses the game and shows the card of the next item picked up (Fase 21A): Equip or Keep in bag. */
    private openLoot(): void {
        const item = this.runLoot.nextPending();
        const slot = item ? itemInfo(item.id)?.slot : undefined;
        // Fase 21D: a Zem found goes straight to the bag (it is put on before a run, never during one); so does a Xelima
        // stone (Fase 24C), which is never put on.
        if (!item || !slot || slot === 'zem') {
            if (item) {
                this.runLoot.keep(item);
                this.audio.play(LOOT_SOUNDS.bag);
                this.saveRun();
            }
            return;
        }
        this.levelUpOpen = true;
        const close = (sound: SoundKey) => {
            this.audio.play(sound);
            this.levelUpOpen = false;
            this.scene.stop('Loot');
            this.scene.resume();
            this.saveRun();
        };
        const data: LootSceneData = {
            item,
            current: this.wornIn(slot),
            gender: this.player.look.gender,
            stats: this.permanentAtStart,
            level: this.characterLevel,
            onEquip: () => {
                this.runLoot.equip(item, slot);
                this.wearLoot(item);
                close(LOOT_SOUNDS.equip);
            },
            onKeep: () => {
                this.runLoot.keep(item);
                close(LOOT_SOUNDS.bag);
            },
        };
        this.scene.pause();
        this.scene.launch('Loot', data);
    }

    /** Puts a found item on in this run: weapon, spell or armor piece (Fase 21A). */
    private wearLoot(item: OwnedItem): void {
        const id = item.id;
        if (isMeleeWeaponId(id)) {
            if (this.meleeWeapon) {
                this.equipment.weaponAttribute = item.attribute;
                this.equipment.weaponUpgrade = upgradeOf(item);
                this.equipMelee(id);
            }
        } else if (isWandId(id)) {
            if (this.spellWeapon) this.equipWand(id, item.attribute, upgradeOf(item));
        } else if (isAutoSpellId(id)) {
            if (this.spellWeapon) this.equipSpell(id);
        } else if (isActiveSpellId(id)) {
            const old = this.activeSpell;
            if (!old || old.id === id) return;
            const spell = this.createActiveSpell(id);
            spell?.restore(old.mana);
            if (spell) spell.infinite = old.infinite;
            this.activeSpell = spell;
        } else if (isArmorPieceId(id)) {
            for (const [slot, layer] of this.equipment.wear(id, item.attribute)) this.player.setGear(slot, layer);
        }
        this.applyStats();
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
            case 'passive':
                this.equipment.passives[choice.passive] = choice.rank;
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

    /** The Mage's wand (Fase 21B): its look, its extra magic damage (Berserk, Kloness), its attribute and "+" (24D). */
    private equipWand(id: WandId, attribute: ItemAttribute | undefined, upgrade: number): void {
        this.equipment.wand = id;
        this.equipment.weaponAttribute = attribute;
        this.equipment.weaponUpgrade = upgrade;
        this.player.setGear('weapon', this.equipment.weaponLayer());
    }

    /** One spell in hand, like the Warrior's weapon. */
    private equipSpell(id: AutoSpellId): void {
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
        // Points assigned in the Character window while the run waited are added on top (Fase 20A).
        const permanentThen = run.permanentStats ?? stats.def.startStats;
        for (const id of STAT_IDS) stats.stats[id] = run.stats[id] + this.permanentAtStart[id] - permanentThen[id];
        // With a saved character, the weapon and spells are the ones it wears NOW: changes made in Equipment while the run
        // waited count (owner, 19-oct-2026). Runs without a character (debug) keep the ones they were saved with.
        if (!this.characterUid) {
            if (run.weapon && run.weapon !== this.equipment.weapon) this.equipMelee(run.weapon);
            if (run.spell && run.spell !== this.equipment.spell) this.equipSpell(run.spell);
            if (run.activeSpell && this.activeSpell && run.activeSpell !== this.activeSpell.id) this.activeSpell = this.createActiveSpell(run.activeSpell);
        }
        // Fase 24A: a piece the character still wears keeps its attribute.
        const owner = this.characterUid ? characterStore.byUid(this.characterUid) : undefined;
        for (const piece of Object.values(run.armor)) {
            const slot = getArmorPiece(piece).slot;
            const attribute = owner?.equipment[slot] === piece ? owner.attributes[slot] : undefined;
            for (const [gearSlot, layer] of this.equipment.wear(piece, attribute)) this.player.setGear(gearSlot, layer);
        }
        Object.assign(this.equipment.passives, run.passives);
        this.player.setMaxHp(stats.maxHp, true);
        this.applyStats();
        this.player.restoreHp(run.hp);
        this.combat.restoreKills(run.kills);
        this.runGold = run.gold ?? 0;
        // Fase 21A: the bag, and the found items put on (over what the character wears now).
        if (run.loot) {
            this.runLoot.restore(run.loot);
            for (const item of Object.values(this.runLoot.equipped)) this.wearLoot(item);
        }
        this.achievements.potionsDrunk = run.potionsDrunk;
        this.abaddon.restore(run.abaddonUsed);
        // Never more than bought now (a Continue doesn't refill what was used).
        if (run.rerollsLeft !== undefined) this.cardActionsLeft.reroll = Math.min(run.rerollsLeft, this.cardActionsLeft.reroll);
        if (run.skipsLeft !== undefined) this.cardActionsLeft.skip = Math.min(run.skipsLeft, this.cardActionsLeft.skip);
        this.buffs.restore(run.buffs);
        if (run.critCharges !== undefined) this.critStrike.restore(run.critCharges, stats.level);
        else this.critStrike.restore(maxCritCharges(stats.level), stats.level);
        this.activeSpell?.restore(run.mana);
        this.spawner.resumeAt(run.elapsedMs, RESUME_CALM_MS, run.bosses);
        // Fase 21½C: the same champions as before (saves from before roll new ones, only those still to come).
        if (run.champions) this.spawner.setChampions(run.champions, run.championsOut ?? 0);
        else this.spawner.setChampions(this.rollChampions().filter((m) => m * MS_PER_MINUTE > run.elapsedMs), 0);
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
            permanentStats: { ...this.permanentAtStart },
            hp: this.player.hp,
            kills: this.combat.kills,
            weapon: equipment.weapon,
            spell: equipment.spell,
            activeSpell: this.activeSpell?.id,
            armor: { ...equipment.armor },
            passives: { ...equipment.passives },
            buffs: this.buffs.remaining,
            bosses: [...this.bosses.aliveIds, ...this.spawner.bossesWaiting],
            finalBossDead: this.finalBossDead,
            portalMsLeft: this.portal?.timeLeft ?? (this.portalInMs >= 0 ? PORTAL.durationMs : undefined),
            potionsDrunk: this.achievements.potionsDrunk,
            critCharges: this.critStrike.charges,
            mana: this.activeSpell?.mana,
            metrics: this.metrics.snapshot(),
            loot: this.runLoot.snapshot(),
            gold: this.runGold,
            abaddonUsed: this.abaddon.spent,
            rerollsLeft: this.cardActionsLeft.reroll,
            skipsLeft: this.cardActionsLeft.skip,
            champions: [...this.spawner.champions],
            // A champion still alive comes back after the calm on Continue.
            championsOut: this.spawner.championsAppeared - (this.champion?.isAlive ? 1 : 0),
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
            launchCritStrike: () => this.launchCritStrike(),
            // Fase 26B: the Mage's button is dragged to aim (the HUD only needs to know it is a Mage).
            spellDrag: CHARACTERS[this.characterId].startWeapon.kind === 'spell' ? {
                preview: (direction) => {
                    this.spellDrag = direction && { ...direction };
                },
                release: (direction) => {
                    this.spellDrag = undefined;
                    this.castActiveSpell(direction);
                },
            } : undefined,
            characterUid: this.characterUid,
            classId: this.characterId,
            getState: () => ({
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                // Fase 26A: the Mage's mana (spent by the Spell 2); the Warrior has no use for it and keeps it full.
                mana: this.activeSpell?.mana ?? this.stats.maxMana,
                maxMana: this.stats.maxMana,
                xpRatio: this.stats.xpRatio,
                level: this.stats.level,
                elapsedMs: this.spawner.elapsed,
                kills: this.combat.kills,
                gold: this.runGold,
                skillOrb: this.skillOrb(),
                skillUses: this.critStrike.launched + (this.activeSpell?.casts ?? 0),
                revive: this.abaddon.hudState,
                pauseLocked: this.player.isDead || this.levelUpOpen || this.runOver,
                bosses: this.bossInfo(),
                portalSecondsLeft: this.portal ? Math.ceil(this.portal.timeLeft / 1000) : undefined,
                stats: this.stats,
                weaponName: this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name,
                skillRow: this.skillRow(),
                // Armor and Merien together: the share of each blow that never reaches the player.
                defense: 1 - (1 - this.equipment.defense) * (1 - this.equipment.passiveBonus('merien')),
                defenseRatio: this.defenseRatio,
                magicResistance: this.magicResistance,
                passiveRanks: this.equipment.passives,
                buffs: this.buffs.active.map(({ def, secondsLeft }) => ({ name: def.name, secondsLeft, color: def.color })),
                minimap: { player: this.player, bosses: this.bosses.tracked.filter((boss) => boss.isAlive), totems: this.totems.active, loot: this.loot.active },
            }),
        };
        this.scene.launch('Hud', data);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.stop('Hud');
            this.scene.stop('LevelUp');
            this.scene.stop('Loot');
            this.scene.stop('GameOver');
            this.scene.stop('Pause');
            this.scene.stop('CharacterInfo');
            this.scene.stop('Settings');
        });
    }

    /** Game area down to the HUD bar, or the whole screen with the compact HUD (it can change from the pause menu). */
    private fitPlayArea(): void {
        const bottom = playAreaBottom();
        setGameViewport(this.cameras.main, 0, 0, GAME_WIDTH, bottom);
        this.inputSystem.setPointerMaxY(bottom);
        this.joystick?.setMaxY(bottom);
        this.aimStick?.setMaxY(bottom);
    }

    override update(_time: number, delta: number): void {
        const sim = this.sim;
        if (!sim) {
            this.step(delta);
            // The character's best Power (shown on the select screen); cheap when it isn't a new best.
            characterStore.recordPower(this.characterUid, this.stats.level);
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
        this.playerDefense.defenseRatio = this.defenseRatio;
        this.playerDefense.magicResistance = this.magicResistance;
        this.world.defenseRatio = this.playerDefense.defenseRatio;
        this.world.onBlow = this.sim ? this.onSimBlow : undefined;
        this.enemies.update(delta, this.world);
        // Manual aim (right click / right stick) wins over the automatic one; the simulated run always aims on its own.
        const manualAim = this.sim || player.isDead ? undefined : input.getManualAim();
        this.weapons.setManualAim(manualAim);
        this.updateCritStrike(delta);
        this.updateActiveSpell(delta);
        this.weapons.update(delta, player.x, player.y, !player.isDead);
        this.combat.updatePoison(delta);
        // Fase 26B: dragging the Mage's touch button shows the same arrow as aiming by hand (Spell 1), that way.
        const spellDrag = this.spellDrag;
        if (spellDrag) {
            this.spellDragAim.dirX = spellDrag.x;
            this.spellDragAim.dirY = spellDrag.y;
        }
        this.aimArrow.update(spellDrag && !player.isDead ? this.spellDragAim : manualAim, player.x, player.y);
        this.updateSpellAimMarker();
        this.damageNumbers.update(delta);
        this.abaddon.update(delta);
        this.screenShake.update(delta);
        if (!player.isDead) {
            this.gainXp(this.xp.update(delta, player.x, player.y));
        }
        this.pickups.update(delta, player.x, player.y, !player.isDead);
        this.loot.update(delta, player.x, player.y, !player.isDead);
        this.totems.enabled = !player.isDead && !this.finalBossDead;
        this.totems.update(delta, player.x, player.y, !player.isDead);
        this.buffs.update(delta);
        this.stats.buffDamageMultiplier = this.buffs.damageMultiplier;
        this.spawner.enabled = !player.isDead && !this.finalBossDead;
        this.spawner.update(delta);
        this.sim?.onAlive(this.enemies.alive, this.spawner.elapsed);
        this.sim?.tick(delta, this.spawner.elapsed, player.maxHp, player.regenPerSecond);
        const bodyY = player.y - PLAYER_BODY_OFFSET_Y;
        this.bosses.update(delta, player.x, bodyY, !player.isDead);
        const shotDamage = this.enemyShots.update(delta, player.x, bodyY, PLAYER_BODY_RADIUS, this.playerDefense, this.world.onBlow);
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
        } else if (this.abaddon.tryRevive(player)) {
            // Abaddon's Blood: lies on the ground for a moment, then gets up (Fase 21E).
            if (!player.isDead) this.achievements.onRevive();
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

        if (this.runLoot.hasPending && !this.levelUpOpen && !player.isDead && !this.sim) {
            // An item just picked up: its card first (Fase 21A).
            this.openLoot();
        } else if (this.stats.pendingLevelUps > 0 && !this.levelUpOpen && !player.isDead) {
            if (this.finalBossDead) this.levelUpWithoutCards();
            else if (this.sim) this.chooseCard(this.sim.pick(this.levelUpChoices(false)));
            else this.openLevelUp(false);
        } else if (this.chestCards > 0 && !this.levelUpOpen && !player.isDead) {
            // A chest's card, even after the final boss (its chest gives one too).
            if (this.sim) this.chooseCard(this.sim.pick(this.levelUpChoices(true)), true);
            else this.openLevelUp(true);
        }
        return true;
    }

    /**
     * Critical Strike (Fase 19A): recharges, and goes off with Space / gamepad R2 (the touch button calls
     * launchCritStrike from the HUD). The simulated run launches one as soon as it has a charge, to measure the balance.
     */
    private updateCritStrike(delta: number): void {
        if (!this.meleeWeapon || this.player.isDead) return;
        this.critStrike.update(delta, this.stats.level);
        if (this.sim ? this.critStrike.charges > 0 && this.enemies.alive > 0 : this.inputSystem.justPressed(Action.CritStrike)) {
            this.launchCritStrike();
        }
    }

    /** Development (pnpm check loot): picks up every item on the ground, as if the player had stepped on them. */
    public debugPickUpLoot(): void {
        if (import.meta.env.DEV) this.loot.pickUpAll();
    }

    /**
     * Development (check spelldrag): lets go of the pretend drag of ?debug=spelldrag, which casts the Spell 2 that way.
     * Returns where it was aimed and the casts so far, to read in the check.
     */
    public debugReleaseSpellDrag(): { direction: DragDirection; casts: number } | undefined {
        if (!import.meta.env.DEV || !this.activeSpell) return undefined;
        const direction = this.spellDrag;
        this.spellDrag = undefined;
        this.castActiveSpell(direction);
        return { direction, casts: this.activeSpell.casts };
    }

    /** Development (check deathzem): every item waiting for its card goes to the bag, without showing it. */
    public debugKeepLoot(): void {
        if (!import.meta.env.DEV) return;
        for (let item = this.runLoot.nextPending(); item; item = this.runLoot.nextPending()) this.runLoot.keep(item);
    }

    /** Launches a Critical Strike now, if the Warrior has a charge and is free to act. */
    public launchCritStrike(): void {
        if (this.activeSpell) {
            this.castActiveSpell();
            return;
        }
        const weapon = this.meleeWeapon;
        const player = this.player;
        if (!weapon || player.isDead || this.levelUpOpen || this.runOver) return;
        this.critStrike.launch(weapon.def, this.stats.level, player.look.gender, player.x, player.y, angleFromDirection(player.direction));
    }

    /** The HUD orb: the Warrior's Critical Strike charges, or the mana the Mage still lacks for the spell (blank when ready). */
    private skillOrb(): SkillOrb | undefined {
        const spell = this.activeSpell;
        if (spell) return { text: spell.ready ? '' : String(spell.manaMissing || ''), ready: spell.ready };
        if (!this.meleeWeapon) return undefined;
        const charges = this.critStrike.charges;
        return { text: String(charges), ready: charges > 0 };
    }

    /** Stats panel: the Mage's spell with its mana cost, or the Warrior's maximum Critical Strike charges. */
    private skillRow(): [string, string] | undefined {
        const spell = this.activeSpell;
        if (spell) return [spell.def.name, `${spell.cost} mana`];
        if (!this.meleeWeapon) return undefined;
        return ['Critical Strikes', `${maxCritCharges(this.stats.level)} max`];
    }

    /**
     * Mage only: their active spell (Fase 19B; since 20D, the one in the Spell 2 slot). Meteor Strike's and Blizzard's
     * sprites are downloaded now (they are big; ON_DEMAND_SPRITES).
     */
    private createActiveSpell(id: ActiveSpellId | undefined): ActiveSpellSystem | undefined {
        if (CHARACTERS[this.characterId].startWeapon.kind !== 'spell') return undefined;
        const spell = new ActiveSpellSystem(this.weapons, id ?? DEFAULT_ACTIVE_SPELL);
        const sprite = activeSpellSprite(spell.def);
        if (sprite) {
            void lookLoader.ensure(this, [sprite]).then(() => {
                registerEffectAnimations(this.anims, this.textures);
                spell.loaded = lookLoader.isReady(this, sprite);
            });
        }
        return spell;
    }

    /**
     * The Mage's active spell (Fase 19B): refills its mana (Fase 26A), and goes off with the Critical Strike button (Space / gamepad R2 /
     * the touch button, which calls launchCritStrike). The simulated run casts it as soon as it has the mana.
     */
    private updateActiveSpell(delta: number): void {
        const spell = this.activeSpell;
        if (!spell || this.player.isDead) return;
        spell.manaSave = this.equipment.manaSave;
        spell.update(delta, this.stats.maxMana, this.stats.manaRegenPerSecond * (1 + this.equipment.mpRecovery));
        if (this.sim ? spell.ready : this.inputSystem.justPressed(Action.CritStrike)) this.castActiveSpell();
    }

    /**
     * Casts the Mage's active spell now, if there is mana enough and the Mage is free to act: towards `direction` (dragging
     * the touch button, Fase 26B) or, without one, where the player aims or the automatic target.
     */
    private castActiveSpell(direction?: DragDirection): void {
        const spell = this.activeSpell;
        const player = this.player;
        if (!spell || player.isDead || this.levelUpOpen || this.runOver) return;
        spell.cast(this.stats.level, direction && { x: player.x, y: player.y, direction });
    }

    /** Fase 26B: while the Mage drags the touch button, a ring where the spell will land (dimmed without mana enough). */
    private updateSpellAimMarker(): void {
        const spell = this.activeSpell;
        const direction = this.spellDrag;
        const player = this.player;
        if (!spell || !direction || player.isDead) {
            this.spellAimMarker.update(undefined, 0, false);
            return;
        }
        this.spellAimMarker.update(spell.aimedPoint(player.x, player.y, direction), activeSpellAreaRadius(spell.def), spell.ready);
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
        // Simulated run: invincible, but its virtual health takes the blow (and the Warrior's crit charges as for real).
        if (this.sim) {
            if (this.sim.onHurt(taken, this.spawner.elapsed, this.stats.level)) this.critStrike.onHurt(this.stats.level);
            return;
        }
        if (!player.takeDamage(taken)) return;
        this.metrics.onHurt(source, taken, player.hp, player.maxHp);
        this.screenShake.hurt(byBoss);
        if (!this.sim) {
            const big = byBoss || taken >= player.maxHp * GAMEPAD_RUMBLE.bigHitShare;
            this.rumble.play(big ? GAMEPAD_RUMBLE.bigHit : GAMEPAD_RUMBLE.hurt);
        }
        this.critStrike.onHurt(this.stats.level);
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

    /** Armor and the Merien cards remove part of each hit; a Defense Shield blocks it all (0 stays 0: no enemy touching). */
    private reduceByArmor(damage: number): number {
        if (damage <= 0 || this.buffs.damageTakenMultiplier <= 0) return 0;
        const merien = 1 - this.equipment.passiveBonus('merien');
        return Math.max(MIN_DAMAGE_TAKEN, Math.round(damage * (1 - this.equipment.defense) * merien * this.buffs.damageTakenMultiplier));
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
            [Action.DebugInfiniteCrits, 'crits'],
            [Action.DebugOneHp, 'onehp'],
        ];
        const finalBoss = this.killFinalBossPending ? this.bosses.finalBoss : undefined;
        if (finalBoss) {
            this.killFinalBossPending = false;
            this.combat.slay(finalBoss);
        }
        for (const [action, debugAction] of keys) {
            if (input.justPressed(action)) this.runDebugAction(debugAction);
        }
        if (this.lootDebugInMs >= 0 && (this.lootDebugInMs -= delta) < 0) {
            this.dropDebugLoot();
            this.lootDebugInMs = LOOT_DEBUG.everyMs;
        }
        if (input.justPressed(Action.DebugSlashStyle)) this.setSlashStyle(this.weapons.slashEffect.styleNumber + 1);
        // Not on the first frame: the camera has not placed its view yet and the horde would find no room around it.
        if (this.debugStartPending && (this.debugStartWaitMs -= delta) <= 0) {
            this.debugStartPending = false;
            for (const action of DEBUG_START.actions) this.runDebugAction(action);
        }
    }

    /**
     * An item picked up: to its card (Equip / Keep in bag), except the book of a Manual spell (Fase 26E), which is
     * learned for ever right now (saved at once: dying doesn't lose it) and never goes to the bag.
     */
    private onLootPickup(item: OwnedItem): void {
        const id = item.id;
        if (!isSpellItemId(id) || !MANUAL_SPELL_IDS.has(id)) {
            this.runLoot.pickUp(item);
            return;
        }
        characterStore.learnSpell(this.characterUid, id);
        this.buffs.announce(MANUAL_LEARNED.text(itemInfo(id)?.name ?? id), MANUAL_LEARNED.color);
        this.audio.play(MANUAL_LEARNED.sound);
    }

    /** ?debug=loot: a rolled item a little to the right of the player. */
    private dropDebugLoot(): void {
        if (!this.player.isDead) this.loot.dropRolled(this.player.x + LOOT_DEBUG.distance, this.player.y);
    }

    /** Development (M15): changes the melee slash style and says which one it is. */
    private setSlashStyle(index: number): void {
        const slash = this.weapons.slashEffect;
        slash.setStyle(index);
        this.slashLabel.setText(`SLASH ${slash.styleNumber}: ${slash.style.name} (Y)`).setVisible(true);
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
                this.pickups.drop(this.activeSpell ? 'bluePotion' : 'potion', x - DEBUG_PICKUP_SPACING, y + DEBUG_PICKUP_SPACING);
                this.pickups.drop('magnet', x, y + DEBUG_PICKUP_SPACING * 1.5);
                this.pickups.drop('chest', x + DEBUG_PICKUP_SPACING, y + DEBUG_PICKUP_SPACING);
                // Fase 24A: a coin and a pile of gold above the player.
                this.pickups.drop('coin', x - DEBUG_PICKUP_SPACING / 2, y - DEBUG_PICKUP_SPACING);
                this.pickups.drop('goldPile', x + DEBUG_PICKUP_SPACING / 2, y - DEBUG_PICKUP_SPACING);
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
            case 'champion':
                // A champion a few seconds from now (Fase 21½C).
                this.spawner.addChampionIn(CHAMPION.debugDelayMs);
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
            case 'spelldrag':
                // Done by the HUD, which owns the touch button (HudScene.create).
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
            case 'nomana':
                // Fase 26A: the Mage starts with no mana, to watch it refill.
                this.activeSpell?.empty();
                break;
            case 'crits':
                // Critical Strikes without spending charges and the Mage's spell without spending mana, until pressed again (Fases 19A and 19B).
                this.critStrike.infinite = !this.critStrike.infinite;
                if (this.activeSpell) this.activeSpell.infinite = this.critStrike.infinite;
                break;
            case 'stats':
                // Opened by the Hud scene itself.
                break;
            case 'stones':
                // Read when the cards are built (openLevelUp).
                break;
            case 'bluebook': {
                // The Blue Book of Bloody Shock Wave by the player (Fase 26E), even if it was learned already.
                const x = this.player.x + LOOT_DEBUG.distance;
                const [first] = MANUAL_SPELL_IDS;
                if (!this.loot.dropManual(x, this.player.y) && first) this.loot.drop({ id: first }, x, this.player.y);
                break;
            }
            case 'loot':
                // An item by the player now and every few seconds (Fase 21A).
                this.dropDebugLoot();
                this.lootDebugInMs = LOOT_DEBUG.everyMs;
                break;
            case 'elites':
                // Every monster that is not a boss comes out elite (M2).
                this.enemies.allElite = true;
                break;
            case 'charexp':
                // Applied when the run ends (endRun).
                break;
            case 'onehp':
                // 1 health left, to test dying (Abaddon's Blood) without waiting for the horde to get through potions.
                this.player.restoreHp(1);
                break;
            case 'sim':
                this.sim = new SimRun(this.stats.def.name, this.stats.def.invulnerabilityMs, DEBUG_START.simBot);
                this.sim.report.profile = this.simProfileLabel;
                this.loot.enabled = false;
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

    /** The XP of a dead monster: one gem, or a champion's shower of them in a ring around it (Fase 21½C). */
    private dropXp(enemy: Enemy): void {
        if (!enemy.champion) {
            this.xp.drop(enemy.x, enemy.y, enemy.xp);
            return;
        }
        const { xpGems, xpGemSpread } = CHAMPION;
        const each = Math.max(1, Math.round(enemy.xp / xpGems));
        for (let i = 0; i < xpGems; i++) {
            const angle = (i / xpGems) * Math.PI * 2;
            this.xp.drop(enemy.x + Math.cos(angle) * xpGemSpread, enemy.y + Math.sin(angle) * xpGemSpread, each);
        }
    }

    /** This run's champion minutes (Fase 21½C), away from this map's events and before its final boss (Fase 22). */
    private rollChampions(): number[] {
        const bossMinute = finalBossMinute(this.mapId) ?? Infinity;
        return rollChampionMinutes(getTimeline(this.mapId).events).filter((minute) => minute < bossMinute);
    }

    /** A champion appeared (Fase 21½C): its warning, its own roar, and the metrics. */
    private onChampion(champion: Enemy): void {
        this.champion = champion;
        this.events.emit(ANNOUNCE_EVENT, championMessage(champion.def.name));
        this.audio.play(champion.def.attackSound);
        this.metrics.onBossSpawn(championMetricsName(champion.def.name), this.spawner.elapsed);
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
        if (enemy.champion) {
            // Fase 21½C: its guaranteed item (and maybe a Zem); its gems already fell (dropXp).
            this.loot.onChampionKill(enemy.x, enemy.y);
            this.dropGoldPiles(enemy.x, enemy.y, GOLD.piles.champion);
            this.metrics.onBossDead(championMetricsName(enemy.def.name), this.spawner.elapsed);
            if (this.champion === enemy) this.champion = undefined;
            return;
        }
        if (!boss) {
            this.sim?.onKill(enemy.hitsTaken);
            this.loot.onKill(enemy.x, enemy.y, enemy.elite);
            // Fase 24A: sometimes a coin (elites, more often).
            if (Math.random() < (enemy.elite ? GOLD.eliteCoinChance : GOLD.coinChance)) this.pickups.drop('coin', enemy.x, enemy.y);
            return;
        }
        // Bosses drop loot (Fase 21A; Fase 24A: mini-bosses sometimes, the final one always) and piles of gold.
        this.loot.onBossKill(enemy.x, enemy.y, boss.final);
        this.dropGoldPiles(enemy.x, enemy.y, boss.final ? GOLD.piles.finalBoss : GOLD.piles.miniBoss);
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
            this.dropXp(other);
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
        this.music.play(moment === 'finalBoss' ? MUSIC.finalBoss : moment === 'miniBoss' ? MUSIC.miniBoss : MAPS_DATA[this.mapId].music);
    }

    /** Boss for the big health bar at the top, if any. */
    private bossInfo(): HudState['bosses'] {
        return this.bosses.shownList.flatMap((boss) =>
            boss.def.boss ? [{ name: boss.def.boss.title, hp: Math.max(0, boss.hp), maxHp: boss.maxHp }] : []);
    }

    /** Weapon, stats and cards of the simulated run, for its report. */
    private simBuild(): string {
        const weapon = [this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name, this.activeSpell?.def.name].filter(Boolean).join(' + ');
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
        const gear = [this.meleeWeapon?.def.name, this.spellWeapon?.def.name, this.activeSpell?.def.name, ...armor, ...passives]
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

    /** Piles of gold around (x, y), a boss or the Champion (Fase 24A). */
    private dropGoldPiles(x: number, y: number, count: number): void {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.PI / count;
            this.pickups.drop('goldPile', x + Math.cos(angle) * GOLD.pileSpread, y + Math.sin(angle) * GOLD.pileSpread);
        }
    }

    /** Opens the end screen over the paused game. */
    private endRun(victory: boolean): void {
        if (this.runOver) return;
        this.runOver = true;
        if (victory) this.achievements.onWin();
        else this.achievements.onDeath();
        // Fase 22A: a win opens the next map in Select Map (for every character of the device).
        const levelBefore = characterStore.byUid(this.characterUid)?.level ?? 1;
        const newMaps = victory && !this.sim ? mapUnlockStore.openedBy(this.mapId, levelBefore).map((id) => MAPS_DATA[id].name) : [];
        if (victory && !this.sim) mapUnlockStore.recordWin(this.mapId);
        this.sim?.finish(victory ? 'portal' : 'died', this.stats.level, this.spawner.elapsed, this.combat.kills, this.simBuild());
        saveStore.clear(this.saveSlot);
        // All the run's XP goes to the character's permanent Level, won or lost (Fase 20A). Not for simulated runs.
        const runXp = this.stats.runXp * (DEBUG_START.actions.includes('charexp') ? DEBUG_CHAR_EXP_MULTIPLIER : 1);
        const exp = this.sim ? undefined : characterStore.addExp(this.characterUid, runXp);
        // Fase 21A: what was found goes to the character; Fase 21D: only if the run is won or a Zem saves it.
        const lootResult = this.sim ? undefined : characterStore.finishRun(this.characterUid, this.runLoot.snapshot(), victory);
        // Fase 24A: the run's gold is always kept, won or lost.
        if (!this.sim) goldStore.add(this.runGold);
        this.sendMetrics(victory ? 'win' : 'death');
        const data: GameOverSceneData = {
            victory,
            elapsedMs: this.spawner.elapsed,
            level: this.stats.level,
            kills: this.combat.kills,
            className: this.stats.def.name,
            achievementNames: this.achievementsThisRun,
            newMaps,
            exp,
            loot: [...this.runLoot.found],
            lootResult,
            gold: { gained: this.runGold, total: goldStore.total },
            gender: this.player.look.gender,
            onRestart: () => {
                this.scene.stop('GameOver');
                this.scene.restart();
            },
            onTown: () => {
                this.scene.stop('GameOver');
                startTown(this);
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

/** The Mage's spells for this run (Fase 20D): the saved character's two slots, or the debug ?spells= ones. */
function startSpells(equipment: Readonly<SavedEquipment>): { auto: AutoSpellId | undefined; active: ActiveSpellId | undefined } {
    const auto = equipment.spell1 !== undefined && isAutoSpellId(equipment.spell1) ? equipment.spell1 : undefined;
    const active = equipment.spell2 !== undefined && isActiveSpellId(equipment.spell2) ? equipment.spell2 : undefined;
    return { auto: DEBUG_START.spells.auto ?? auto, active: DEBUG_START.spells.active ?? active };
}
