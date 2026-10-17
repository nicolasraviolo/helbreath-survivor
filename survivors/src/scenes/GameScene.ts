import Phaser from 'phaser';
import {
    CAMERA_LERP,
    DEPTH_DEBUG,
    GAME_OVER_DELAY_MS,
    GAME_WIDTH,
    MAP_OBJECT_MARGIN_TILES,
    PLAYER_BODY_OFFSET_Y,
    PLAYER_BODY_RADIUS,
    PLAYER_HURT_MS,
    PLAYER_HURT_STUN_MS,
    TILE_SIZE,
    VICTORY_DELAY_MS,
} from '../config/gameConfig';
import { ANNOUNCE_EVENT } from '../config/hud';
import { getArmorPiece } from '../data/armor';
import { MUSIC } from '../data/audio';
import type { WaveEventDef } from '../data/waves';
import type { Enemy } from '../entities/Enemy';
import { BossSystem } from '../systems/BossSystem';
import { EnemyProjectileSystem } from '../systems/EnemyProjectileSystem';
import { MusicSystem } from '../systems/MusicSystem';
import type { GameOverSceneData } from './GameOverScene';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId } from '../data/characters';
import { DEFAULT_MAP, MAPS_DATA } from '../data/maps';
import { MIN_DAMAGE_TAKEN } from '../data/armor';
import { MELEE_ROOT_MOMENT } from '../data/weapons';
import { CAST_RELEASE_MOMENT } from '../data/spells';
import { FOOTSTEP_DUST_EVERY_PX, FOOTSTEPS_PER_RUN_CYCLE } from '../data/audio';
import { PLAYER_FRAMES_PER_DIRECTION } from '../hb/playerAppearance';
import { CharacterStats } from '../entities/CharacterStats';
import { BuffSystem } from '../systems/BuffSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { POTION_HEAL_SHARE, type PickupId } from '../data/pickups';
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
import { playAreaBottom } from '../ui/hudLayout';
import { TouchJoystick } from '../ui/TouchJoystick';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XpSystem } from '../systems/XpSystem';
import { formatTime } from '../utils/format';
import { SpellWeapon } from '../weapons/SpellWeapon';
import { PlayerState } from '../hb/playerAppearance';
import { MeleeWeapon } from '../weapons/MeleeWeapon';
import { directionFromVector } from '../hb/directions';
import { buildLevelUpChoices } from '../systems/UpgradePool';
import type { HudSceneData, HudState } from './HudScene';
import type { LevelUpChoice, LevelUpSceneData } from './LevelUpScene';
import { DEBUG_START, type DebugAction } from '../config/debugStart';

/** Enemies created by the debug "spawn many" key. */
const DEBUG_SPAWN_COUNT = 100;
/** Points added by the debug keys V (Str) and B (Int and Mag), to see links and armor show up quickly. */
const DEBUG_STR_POINTS = 10;
/** Distance from the player of the pickups dropped by the debug key P. */
const DEBUG_PICKUP_SPACING = 48;
/** Time skipped by the debug key J. */
const DEBUG_SKIP_MS = 60000;
/** Levels given by the debug key L (one card per level). */
const DEBUG_LEVELS = 5;
/** Wait after the run starts before the ?debug= actions (debugStart.ts). */
const DEBUG_START_DELAY_MS = 500;

/**
 * Escena de partida con la clase elegida en CharacterSelectScene: mapa, jugador, oleadas de enemigos con minijefes y jefe
 * final (Fase 7), arma o hechizo automático, gemas de XP, cartas al subir de nivel, objetos y buffs. Al final, GameOverScene.
 * Mover: WASD/flechas, stick/cruceta o mantener clic. Esc / Start: pausa. F1 / View: depuración · T: prueba del Orc.
 * Solo en desarrollo: N 100 enemigos · K matar los visibles · G invencible · X subir un nivel · V +10 Str · B +10 Int y Mag · P poción, imán y cofre · J +1 minuto · M siguiente jefe · L +5 niveles.
 */
export class GameScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    /** Only on touch screens. */
    private joystick: TouchJoystick | undefined;
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
    private debug!: DebugSystem;
    /** The ?debug= actions still have to run (only on the first run after loading the page). */
    private debugStartPending = DEBUG_START.actions.length > 0;
    /** Run time left before those actions (counted with the frames: the scene clock is not ready in create()). */
    private debugStartWaitMs = DEBUG_START_DELAY_MS;
    private world!: EnemyWorld;
    private bosses!: BossSystem;
    private enemyShots!: EnemyProjectileSystem;
    private music!: MusicSystem;
    /** Counts down to the victory screen once the final boss is dead; negative = not won yet. */
    private victoryInMs = -1;
    /** The end screen is open (victory or defeat). */
    private runOver = false;
    private godModeLabel!: Phaser.GameObjects.Text;
    private stats!: CharacterStats;
    private xp!: XpSystem;
    private pickups!: PickupSystem;
    private buffs!: BuffSystem;
    private equipment!: Equipment;
    /** Melee weapon in hand (Warrior); undefined for spell casters. */
    private meleeWeapon: MeleeWeapon | undefined;
    /** Spell in hand (Mage); undefined for melee classes. */
    private spellWeapon: SpellWeapon | undefined;
    private levelUpOpen = false;
    /** Pixels run since the last puff of footstep dust, and where the player was last frame. */
    private dustDistance = 0;
    private lastX = 0;
    private lastY = 0;

    constructor() {
        super('Game');
    }

    create(): void {
        const mapDef = MAPS_DATA[DEFAULT_MAP];
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
        const character = CHARACTERS[isCharacterId(chosen) ? chosen : DEFAULT_CHARACTER];
        this.player = new Player(this, (spawn.x + 0.5) * TILE_SIZE, (spawn.y + 0.5) * TILE_SIZE, character, map, areaPx);
        this.stats = new CharacterStats(character);
        this.levelUpOpen = false;
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
        this.buffs = new BuffSystem(this, this.player, this.audio, (key, x, y) => this.weapons.spawnEffect(key, x, y));
        this.enemyShots = new EnemyProjectileSystem(this, this.audio, (key, x, y) => this.weapons.spawnEffect(key, x, y));
        this.bosses = new BossSystem(this.enemyShots);
        // Archers (Dark Elf) shoot arrows at the player's body instead of hitting directly.
        this.enemies.setShootHandler((enemy, damage) => {
            const ranged = enemy.def.attackProjectile;
            if (ranged) this.enemyShots.throwAt(ranged, enemy.x, enemy.bodyY, this.player.x, this.player.y - PLAYER_BODY_OFFSET_Y, damage);
        });
        this.music = new MusicSystem(this);
        this.music.play(MUSIC.normal);
        this.victoryInMs = -1;
        this.runOver = false;
        this.equipment = new Equipment(character);
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
        this.world = { map, area: areaPx, targetX: 0, targetY: 0, targetRadius: character.hitboxHalfSize };

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerAnchor(() => this.player);
        this.joystick = this.sys.game.device.input.touch ? new TouchJoystick(this, playAreaBottom(), DEPTH_DEBUG - 2) : undefined;
        if (this.joystick) this.inputSystem.setTouchJoystick(this.joystick);
        this.fitPlayArea();
        const onSettings = () => this.fitPlayArea();
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
                break;
            case 'magnet':
                this.xp.attractAll();
                break;
            case 'chest':
                this.buffs.startRandom();
                break;
        }
    }

    /** Pauses the game and shows the cards. Picking one applies it and resumes. */
    private openLevelUp(): void {
        this.levelUpOpen = true;
        this.audio.play('sfx.levelUp');
        const stats = this.stats;
        const data: LevelUpSceneData = {
            stats,
            equipment: this.equipment,
            choices: buildLevelUpChoices(stats, this.equipment),
            onChoose: (choice) => {
                this.applyChoice(choice);
                stats.pendingLevelUps--;
                this.applyStats();
                this.levelUpOpen = false;
                this.scene.stop('LevelUp');
                this.scene.resume();
            },
        };
        this.scene.pause();
        this.scene.launch('LevelUp', data);
    }

    private applyChoice(choice: LevelUpChoice): void {
        switch (choice.kind) {
            case 'stat':
                this.stats.addStat(choice.stat, choice.points);
                break;
            case 'weaponLink':
            case 'weaponSwitch': {
                // One weapon in hand: the new one takes the old one's place.
                const weapon = new MeleeWeapon(choice.weapon);
                if (this.meleeWeapon) this.weapons.replace(this.meleeWeapon, weapon);
                else this.weapons.add(weapon);
                this.meleeWeapon = weapon;
                this.equipment.weapon = choice.weapon;
                this.player.setGear('weapon', this.equipment.weaponLayer());
                break;
            }
            case 'spellLink':
            case 'spellSwitch': {
                // One spell in hand, like the Warrior's weapon. The wand stays: it is only for looks.
                const spell = new SpellWeapon(choice.spell);
                if (this.spellWeapon) this.weapons.replace(this.spellWeapon, spell);
                else this.weapons.add(spell);
                this.spellWeapon = spell;
                this.equipment.spell = choice.spell;
                break;
            }
            case 'passive':
                this.equipment.passives[choice.passive] = choice.rank;
                break;
            case 'armor':
                for (const [slot, layer] of this.equipment.wear(choice.piece)) this.player.setGear(slot, layer);
                break;
        }
    }

    /** Bottom bar in its own scene on top. It is stopped with this scene (restart, sprite test). */
    private launchHud(): void {
        const data: HudSceneData = {
            gameSceneKey: this.scene.key,
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
                stats: this.stats,
                weaponName: this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name,
                defense: this.equipment.defense,
                passiveRanks: this.equipment.passives,
                buffs: this.buffs.active.map(({ def, secondsLeft }) => ({ name: def.name, secondsLeft, color: def.color })),
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
    }

    override update(_time: number, delta: number): void {
        const input = this.inputSystem;
        input.update();
        if (input.justPressed(Action.ToggleDebug)) {
            this.debug.toggle();
        }
        // The sprite test shows the Orc, which arrives with a later wave: only once it has loaded.
        if (input.justPressed(Action.OpenSpriteTest) && assetStreamer.isReady('orc')) {
            this.scene.start('SpriteTest');
            return;
        }
        if (import.meta.env.DEV) {
            this.handleDebugKeys(delta);
        }

        const player = this.player;
        player.update(player.isDead ? Phaser.Math.Vector2.ZERO : input.getMove(), delta);
        // No steps while standing still for a swing.
        this.updateFootsteps(!player.isDead && !player.isRooted && input.getMove().lengthSq() > 0);
        this.world.targetX = player.x;
        this.world.targetY = player.y;
        this.enemies.update(delta, this.world);
        this.weapons.update(delta, player.x, player.y, !player.isDead);
        this.damageNumbers.update(delta);
        this.screenShake.update(delta);
        if (!player.isDead) {
            this.gainXp(this.xp.update(delta, player.x, player.y));
        }
        this.pickups.update(delta, player.x, player.y, !player.isDead);
        this.buffs.update(delta);
        this.stats.buffDamageMultiplier = this.buffs.damageMultiplier;
        this.spawner.enabled = !player.isDead && this.victoryInMs < 0;
        this.spawner.update(delta);
        const bodyY = player.y - PLAYER_BODY_OFFSET_Y;
        this.bosses.update(delta, player.x, bodyY, !player.isDead);
        const shotDamage = this.enemyShots.update(delta, player.x, bodyY, PLAYER_BODY_RADIUS);
        this.updateMusic();

        if (!player.isDead) {
            this.hurtPlayer(this.enemies.landedDamage + shotDamage, this.enemies.landedFromBoss || this.enemyShots.hitFromBoss);
        } else if (player.deadForMs > GAME_OVER_DELAY_MS) {
            this.endRun(false);
            return;
        }
        if (this.victoryInMs >= 0) {
            this.victoryInMs -= delta;
            if (this.victoryInMs < 0) {
                this.endRun(true);
                return;
            }
        }

        this.mapView.updateFading(player.y, player.getVisualBounds());
        this.debug.update();

        if (this.stats.pendingLevelUps > 0 && !this.levelUpOpen && !player.isDead) {
            this.openLevelUp();
        }
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
    private hurtPlayer(damage: number, byBoss: boolean): void {
        const player = this.player;
        if (!player.takeDamage(this.reduceByArmor(damage))) return;
        this.screenShake.hurt(byBoss);
        if (player.isDead) {
            this.audio.play(player.def.deathSound);
            return;
        }
        this.weapons.spawnEffect('fx.hit', player.x, player.y - PLAYER_BODY_OFFSET_Y);
        this.audio.play('sfx.player.hurt');
        player.act(PlayerState.Hurt, player.direction, PLAYER_HURT_MS, PLAYER_HURT_STUN_MS);
    }

    /** Armor and a Defense Shield remove part of each hit (0 stays 0: no enemy touching). */
    private reduceByArmor(damage: number): number {
        if (damage <= 0) return 0;
        return Math.max(MIN_DAMAGE_TAKEN, Math.round(damage * (1 - this.equipment.defense) * this.buffs.damageTakenMultiplier));
    }

    private gainXp(amount: number): void {
        if (amount <= 0) return;
        const level = this.stats.level;
        this.stats.addXp(amount);
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
                this.enemies.killInside(this.cameras.main.worldView);
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
            case 'minute':
                this.spawner.skip(DEBUG_SKIP_MS);
                break;
            case 'boss':
                this.spawner.skipToNextBoss();
                break;
            case 'god':
                this.player.setGodMode(!this.player.godMode);
                this.godModeLabel.setVisible(this.player.godMode);
                break;
        }
    }

    /** A moment of the timeline: shows its warning and remembers the bosses. */
    private onWaveEvent(event: WaveEventDef, spawned: readonly Enemy[]): void {
        this.events.emit(ANNOUNCE_EVENT, event.message);
        for (const enemy of spawned) this.bosses.track(enemy);
    }

    /** Mini-bosses drop a chest; the final boss wins the game once its death animation has played. */
    private onEnemyKilled(enemy: Enemy): void {
        const boss = enemy.def.boss;
        if (!boss) return;
        if (boss.dropsChest) this.pickups.drop('chest', enemy.x, enemy.y);
        if (boss.final && this.victoryInMs < 0) this.victoryInMs = VICTORY_DELAY_MS;
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

    /** Opens the end screen over the paused game. */
    private endRun(victory: boolean): void {
        if (this.runOver) return;
        this.runOver = true;
        const armor = Object.values(this.equipment.armor).map((id) => getArmorPiece(id).name);
        const data: GameOverSceneData = {
            victory,
            elapsedMs: this.spawner.elapsed,
            level: this.stats.level,
            kills: this.combat.kills,
            className: this.stats.def.name,
            weaponName: this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name ?? '',
            armorNames: armor,
            onRestart: () => {
                this.scene.stop('GameOver');
                this.scene.restart();
            },
            onChangeClass: () => {
                this.scene.stop('GameOver');
                this.scene.start('CharacterSelect');
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
