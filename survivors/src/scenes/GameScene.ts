import Phaser from 'phaser';
import { CAMERA_LERP, MAP_OBJECT_MARGIN_TILES, TILE_SIZE } from '../config/gameConfig';
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters';
import { DEFAULT_MAP, MAPS_DATA } from '../data/maps';
import { Player } from '../entities/Player';
import { getMap, type HBMap } from '../hb/HBMap';
import { MapView } from '../hb/mapRenderer';
import { DebugSystem } from '../systems/DebugSystem';
import { Action, InputSystem } from '../systems/InputSystem';

/**
 * Escena de partida. Fase 2: mapa + jugador que camina con teclado o mando.
 * Mover: WASD/flechas, stick/cruceta o mantener clic. F1 / View: depuración · T: prueba del Orc.
 */
export class GameScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private player!: Player;
    private mapView!: MapView;
    private debug!: DebugSystem;

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
        this.player = new Player(this, (spawn.x + 0.5) * TILE_SIZE, (spawn.y + 0.5) * TILE_SIZE,
            CHARACTERS[DEFAULT_CHARACTER], map, areaPx);

        const camera = this.cameras.main;
        camera.setBounds(areaPx.x, areaPx.y, areaPx.width, areaPx.height);
        camera.startFollow(this.player.container, true, CAMERA_LERP, CAMERA_LERP);

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerAnchor(() => this.player);
        this.debug = new DebugSystem(this, map, this.player, this.inputSystem);
    }

    override update(_time: number, delta: number): void {
        this.inputSystem.update();
        if (this.inputSystem.justPressed(Action.ToggleDebug)) {
            this.debug.toggle();
        }
        if (this.inputSystem.justPressed(Action.OpenSpriteTest)) {
            this.scene.start('SpriteTest');
            return;
        }

        this.player.update(this.inputSystem.getMove(), delta);
        this.mapView.updateFading(this.player.y, this.player.getVisualBounds());
        this.debug.update();
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
