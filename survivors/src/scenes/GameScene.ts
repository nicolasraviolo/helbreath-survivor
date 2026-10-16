import Phaser from 'phaser';
import {
    CAMERA_LERP,
    DEPTH_DEBUG,
    GAME_HEIGHT,
    GAME_OVER_DELAY_MS,
    GAME_WIDTH,
    MAP_OBJECT_MARGIN_TILES,
    TILE_SIZE,
} from '../config/gameConfig';
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters';
import { DEFAULT_MAP, MAPS_DATA } from '../data/maps';
import type { EnemyWorld } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { getMap, type HBMap } from '../hb/HBMap';
import { MapView } from '../hb/mapRenderer';
import { DebugSystem } from '../systems/DebugSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { Action, InputSystem } from '../systems/InputSystem';
import { SpawnSystem } from '../systems/SpawnSystem';

/** Enemies created by the debug "spawn many" key. */
const DEBUG_SPAWN_COUNT = 100;

/**
 * Escena de partida. Fase 3: mapa, jugador y enemigos que lo persiguen.
 * Mover: WASD/flechas, stick/cruceta o mantener clic. F1 / View: depuración · T: prueba del Orc.
 * Solo en desarrollo: N 100 enemigos · K matar los visibles · G invencible.
 */
export class GameScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private player!: Player;
    private mapView!: MapView;
    private enemies!: EnemySystem;
    private spawner!: SpawnSystem;
    private debug!: DebugSystem;
    private world!: EnemyWorld;
    private gameOver!: Phaser.GameObjects.Container;
    private gameOverText!: Phaser.GameObjects.Text;
    private godModeLabel!: Phaser.GameObjects.Text;

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
        const character = CHARACTERS[DEFAULT_CHARACTER];
        this.player = new Player(this, (spawn.x + 0.5) * TILE_SIZE, (spawn.y + 0.5) * TILE_SIZE, character, map, areaPx);

        const camera = this.cameras.main;
        camera.setBounds(areaPx.x, areaPx.y, areaPx.width, areaPx.height);
        camera.startFollow(this.player.container, true, CAMERA_LERP, CAMERA_LERP);

        this.enemies = new EnemySystem(this);
        this.spawner = new SpawnSystem(camera, this.enemies, map, areaPx);
        this.world = { map, area: areaPx, targetX: 0, targetY: 0, targetRadius: character.hitboxHalfSize };

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerAnchor(() => this.player);
        this.debug = new DebugSystem(this, map, this.player, this.inputSystem, () => [
            `Enemigos: ${this.enemies.alive} vivos · ${this.enemies.pooled} en pool`,
            `Vida: ${this.player.hp}/${character.maxHp}${this.player.godMode ? '  [INVENCIBLE]' : ''}`,
            `Tiempo: ${formatTime(this.spawner.elapsed)}  aparición cada ${this.spawner.currentInterval().toFixed(2)} s`,
        ]);
        this.createGameOver();
        this.godModeLabel = this.add.text(GAME_WIDTH - 10, 10, 'INVENCIBLE (G)', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffd860', backgroundColor: '#000000a0', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_DEBUG).setVisible(false);
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
        }

        this.mapView.updateFading(player.y, player.getVisualBounds());
        this.debug.update();
    }

    private handleDebugKeys(): void {
        const input = this.inputSystem;
        if (input.justPressed(Action.DebugSpawnMany)) {
            this.spawner.spawnMany(DEBUG_SPAWN_COUNT);
        }
        if (input.justPressed(Action.DebugKillVisible)) {
            this.enemies.killInside(this.cameras.main.worldView);
        }
        if (input.justPressed(Action.DebugGodMode)) {
            this.player.setGodMode(!this.player.godMode);
            this.godModeLabel.setVisible(this.player.godMode);
        }
    }

    /** Provisional Game Over (Phase 8 replaces it with a proper GameOverScene). */
    private createGameOver(): void {
        const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0);
        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'HAS CAÍDO', {
            fontFamily: 'Georgia, serif', fontSize: '48px', color: '#d83030',
        }).setOrigin(0.5);
        this.gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, '', {
            fontFamily: 'Georgia, serif', fontSize: '18px', color: '#e0d090', align: 'center',
        }).setOrigin(0.5);
        this.gameOver = this.add.container(0, 0, [shade, title, this.gameOverText])
            .setScrollFactor(0)
            .setDepth(DEPTH_DEBUG - 1)
            .setVisible(false);
    }

    private showGameOver(): void {
        if (this.gameOver.visible) return;
        this.gameOverText.setText([
            `Has sobrevivido ${formatTime(this.spawner.elapsed)}`,
            '',
            'Enter, A o clic para reintentar',
        ]);
        this.gameOver.setVisible(true);
    }
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
