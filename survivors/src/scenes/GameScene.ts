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
import { LEVEL_UP_CHOICES, STAT_CARD_POINTS, STAT_IDS } from '../data/stats';
import { CharacterStats } from '../entities/CharacterStats';
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
import { EnergyBolt } from '../weapons/EnergyBolt';
import type { HudSceneData } from './HudScene';
import type { LevelUpChoice, LevelUpSceneData } from './LevelUpScene';

/** Enemies created by the debug "spawn many" key. */
const DEBUG_SPAWN_COUNT = 100;

/**
 * Escena de partida con la clase elegida en CharacterSelectScene: mapa, jugador, enemigos que lo persiguen, un arma automática (Energy Bolt),
 * gemas de XP y subida de nivel con cartas (Fase 5).
 * Mover: WASD/flechas, stick/cruceta o mantener clic. Esc / Start: pausa. F1 / View: depuración · T: prueba del Orc.
 * Solo en desarrollo: N 100 enemigos · K matar los visibles · G invencible · X subir un nivel.
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
    private levelUpOpen = false;

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
        this.weapons.add(new EnergyBolt());
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
    }

    /** Pauses the game and shows the cards. Picking one applies it and resumes. */
    private openLevelUp(): void {
        this.levelUpOpen = true;
        const stats = this.stats;
        const ids = Phaser.Utils.Array.Shuffle([...STAT_IDS]).slice(0, LEVEL_UP_CHOICES);
        const data: LevelUpSceneData = {
            stats,
            choices: ids.map((stat): LevelUpChoice => ({ stat, points: STAT_CARD_POINTS })),
            onChoose: (choice) => {
                stats.addStat(choice.stat, choice.points);
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
            player.takeDamage(this.enemies.getContactDamage(player.x, player.y, player.def.hitboxHalfSize));
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
