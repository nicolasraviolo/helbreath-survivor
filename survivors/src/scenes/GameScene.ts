import Phaser from 'phaser';
import {
    CAMERA_LERP,
    DEPTH_DEBUG,
    GAME_OVER_DELAY_MS,
    GAME_WIDTH,
    MAP_OBJECT_MARGIN_TILES,
    TILE_SIZE,
} from '../config/gameConfig';
import { HUD_TOP } from '../config/hud';
import { px, UI_FONT, UI_FONT_SIZE } from '../config/ui';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId } from '../data/characters';
import { DEFAULT_MAP, MAPS_DATA } from '../data/maps';
import { MIN_DAMAGE_TAKEN } from '../data/armor';
import { MELEE_ROOT_MOMENT } from '../data/weapons';
import { CAST_RELEASE_MOMENT } from '../data/spells';
import { FOOTSTEP_DUST_EVERY_PX, FOOTSTEPS_PER_RUN_CYCLE } from '../data/audio';
import { PLAYER_FRAMES_PER_DIRECTION } from '../hb/playerAppearance';
import { CharacterStats } from '../entities/CharacterStats';
import { Equipment } from '../entities/Equipment';
import type { EnemyWorld } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { getMap, type HBMap } from '../hb/HBMap';
import { MapView } from '../hb/mapRenderer';
import { AudioSystem } from '../systems/AudioSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { DamageNumbers } from '../systems/DamageNumbers';
import { DebugSystem } from '../systems/DebugSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { Action, InputSystem } from '../systems/InputSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XpSystem } from '../systems/XpSystem';
import { formatTime } from '../utils/format';
import { SpellWeapon } from '../weapons/SpellWeapon';
import { PlayerState } from '../hb/playerAppearance';
import { MeleeWeapon } from '../weapons/MeleeWeapon';
import { directionFromVector } from '../hb/directions';
import { buildLevelUpChoices } from '../systems/UpgradePool';
import type { HudSceneData } from './HudScene';
import type { LevelUpChoice, LevelUpSceneData } from './LevelUpScene';

/** Enemies created by the debug "spawn many" key. */
const DEBUG_SPAWN_COUNT = 100;
/** Points added by the debug keys V (Str) and B (Int and Mag), to see links and armor show up quickly. */
const DEBUG_STR_POINTS = 10;

/**
 * Escena de partida con la clase elegida en CharacterSelectScene: mapa, jugador, enemigos que lo persiguen, un arma automática (Energy Bolt),
 * gemas de XP y subida de nivel con cartas (Fase 5).
 * Mover: WASD/flechas, stick/cruceta o mantener clic. Esc / Start: pausa. F1 / View: depuración · T: prueba del Orc.
 * Solo en desarrollo: N 100 enemigos · K matar los visibles · G invencible · X subir un nivel · V +10 Str · B +10 Int y Mag.
 */
export class GameScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private player!: Player;
    private mapView!: MapView;
    private enemies!: EnemySystem;
    private spawner!: SpawnSystem;
    private damageNumbers!: DamageNumbers;
    private audio!: AudioSystem;
    private combat!: CombatSystem;
    private weapons!: WeaponSystem;
    private debug!: DebugSystem;
    private world!: EnemyWorld;
    private gameOver!: Phaser.GameObjects.Container;
    private gameOverText!: Phaser.GameObjects.Text;
    private godModeLabel!: Phaser.GameObjects.Text;
    private stats!: CharacterStats;
    private xp!: XpSystem;
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

        // The bottom bar covers the last rows of the screen: the camera only draws above it, so the player stays centred in what is visible.
        const camera = this.cameras.main;
        camera.setViewport(0, 0, GAME_WIDTH, HUD_TOP);
        camera.setBounds(areaPx.x, areaPx.y, areaPx.width, areaPx.height);
        camera.startFollow(this.player.container, true, CAMERA_LERP, CAMERA_LERP);

        this.enemies = new EnemySystem(this);
        this.spawner = new SpawnSystem(camera, this.enemies, map, areaPx);
        this.damageNumbers = new DamageNumbers(this);
        this.audio = new AudioSystem(this);
        this.xp = new XpSystem(this, this.audio);
        this.combat = new CombatSystem(this.enemies, this.damageNumbers, this.audio, this.stats, (enemy) => {
            this.xp.drop(enemy.x, enemy.y, enemy.def.xp);
        });
        this.weapons = new WeaponSystem(this, this.enemies, this.combat, this.audio);
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
        this.inputSystem.setPointerMaxY(HUD_TOP);
        this.debug = new DebugSystem(this, map, this.player, this.inputSystem, () => [
            `Enemies: ${this.enemies.alive} alive · ${this.enemies.pooled} pooled`,
            `Health: ${this.player.hp}/${this.player.maxHp}${this.player.godMode ? '  [INVINCIBLE]' : ''}`,
            `Level ${this.stats.level} · XP ${this.stats.xp}/${this.stats.xpToNext} · gems ${this.xp.active}`,
            `Time: ${formatTime(this.spawner.elapsed)}  spawn every ${this.spawner.currentInterval().toFixed(2)} s`,
            `Kills: ${this.combat.kills} · projectiles ${this.weapons.activeProjectiles} · numbers ${this.damageNumbers.active}`,
            `Sounds: ${this.audio.playingCount} playing · ${this.audio.skippedCount} skipped`,
        ]);
        this.createGameOver();
        this.godModeLabel = this.add.text(GAME_WIDTH - 10, 10, 'INVINCIBLE (G)', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffd860', backgroundColor: '#000000a0', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_DEBUG).setVisible(false);
        this.launchHud();
    }

    /** Applies the values that come from the stats to the player and the weapons (after a level up or a card). */
    private applyStats(): void {
        const stats = this.stats;
        this.player.setMaxHp(stats.maxHp);
        this.player.speedMultiplier = stats.moveSpeedMultiplier;
        this.weapons.setCooldownMultiplier(stats.cooldownMultiplier);
        stats.gearMagicBonus = this.equipment.magicDamageBonus;
    }

    /** Pauses the game and shows the cards. Picking one applies it and resumes. */
    private openLevelUp(): void {
        this.levelUpOpen = true;
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
                pauseLocked: this.player.isDead || this.levelUpOpen,
                stats: this.stats,
                weaponName: this.meleeWeapon?.def.name ?? this.spellWeapon?.def.name,
                defense: this.equipment.defense,
            }),
        };
        this.scene.launch('Hud', data);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.stop('Hud');
            this.scene.stop('LevelUp');
        });
    }

    override update(_time: number, delta: number): void {
        const input = this.inputSystem;
        input.update();
        if (input.justPressed(Action.ToggleDebug)) {
            this.debug.toggle();
        }
        if (input.justPressed(Action.OpenSpriteTest)) {
            this.scene.start('SpriteTest');
            return;
        }
        if (import.meta.env.DEV) {
            this.handleDebugKeys();
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
        if (!player.isDead) {
            this.gainXp(this.xp.update(delta, player.x, player.y));
        }
        this.spawner.enabled = !player.isDead;
        this.spawner.update(delta);

        if (!player.isDead) {
            player.takeDamage(this.reduceByArmor(this.enemies.getContactDamage(player.x, player.y, player.def.hitboxHalfSize)));
        } else if (player.deadForMs > GAME_OVER_DELAY_MS) {
            this.showGameOver();
            if (input.justPressed(Action.Confirm)) {
                this.scene.restart();
                return;
            }
            if (input.justPressed(Action.Pause)) {
                this.scene.start('CharacterSelect');
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

    /** Armor removes part of each hit (0 stays 0: no enemy touching). */
    private reduceByArmor(damage: number): number {
        if (damage <= 0) return 0;
        return Math.max(MIN_DAMAGE_TAKEN, Math.round(damage * (1 - this.equipment.defense)));
    }

    private gainXp(amount: number): void {
        if (amount <= 0) return;
        const level = this.stats.level;
        this.stats.addXp(amount);
        // Automatic points per level (e.g. +1 Str +1 Vit) change health and speed right away.
        if (this.stats.level !== level) this.applyStats();
    }

    private handleDebugKeys(): void {
        const input = this.inputSystem;
        if (input.justPressed(Action.DebugSpawnMany)) {
            this.spawner.spawnMany(DEBUG_SPAWN_COUNT);
        }
        if (input.justPressed(Action.DebugKillVisible)) {
            this.enemies.killInside(this.cameras.main.worldView);
        }
        if (input.justPressed(Action.DebugGiveXp)) {
            this.gainXp(this.stats.xpToNext - this.stats.xp);
        }
        if (input.justPressed(Action.DebugAddStr)) {
            this.stats.addStat('str', DEBUG_STR_POINTS);
            this.applyStats();
        }
        if (input.justPressed(Action.DebugAddMagic)) {
            this.stats.addStat('int', DEBUG_STR_POINTS);
            this.stats.addStat('mag', DEBUG_STR_POINTS);
            this.applyStats();
        }
        if (input.justPressed(Action.DebugGodMode)) {
            this.player.setGodMode(!this.player.godMode);
            this.godModeLabel.setVisible(this.player.godMode);
        }
    }

    /** Provisional Game Over (Phase 8 replaces it with a proper GameOverScene). */
    private createGameOver(): void {
        const shade = this.add.rectangle(0, 0, GAME_WIDTH, HUD_TOP, 0x000000, 0.6).setOrigin(0);
        const title = this.add.text(GAME_WIDTH / 2, HUD_TOP / 2 - 40, 'YOU HAVE FALLEN', {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.title), fontStyle: 'bold', color: '#d83030', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.gameOverText = this.add.text(GAME_WIDTH / 2, HUD_TOP / 2 + 30, '', {
            fontFamily: UI_FONT, fontSize: px(UI_FONT_SIZE.normal), color: '#e0d090', align: 'center',
        }).setOrigin(0.5);
        this.gameOver = this.add.container(0, 0, [shade, title, this.gameOverText])
            .setScrollFactor(0)
            .setDepth(DEPTH_DEBUG - 1)
            .setVisible(false);
    }

    private showGameOver(): void {
        if (this.gameOver.visible) return;
        this.gameOverText.setText([
            `You survived ${formatTime(this.spawner.elapsed)}`,
            '',
            'Enter, A or click to try again',
            'Esc or Start to choose another class',
        ]);
        this.gameOver.setVisible(true);
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
