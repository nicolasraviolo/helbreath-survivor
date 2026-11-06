// Helbreath Off (Fase Off-1): andar por Traveler Zone, sin oleadas, ni tiempo, ni monstruos.
// Se anda casilla a casilla como el original (off/systems/TileMover.ts):
// - Ratón: clic para ir a una casilla (si está bloqueada, a la libre más cercana); con el clic mantenido sigue al
//   cursor; clic derecho para (termina la casilla en la que está).
// - Teclado, cruceta y stick: va hacia donde se apunta.
// - Correr o andar: interruptor con R o R3 del mando (6-nov-2026, propietario: como el original, no mantener Shift).
// - Esc / B vuelve a la pantalla de Off.
// Mapa, árboles que se transparentan, cámara, pasos y minimapa, como la ciudad de Survivors (scenes/TownScene.ts).
import Phaser from 'phaser';
import { CAMERA_LERP, DEPTH_DEBUG, TILE_SIZE } from '../../config/gameConfig';
import { DEBUG_START } from '../../config/debugStart';
import { FOOTSTEPS_PER_RUN_CYCLE } from '../../data/audio';
import { Effect } from '../../entities/Effect';
import { getMap, type HBMap } from '../../hb/HBMap';
import { MapView } from '../../hb/mapRenderer';
import { directionFromVector } from '../../hb/directions';
import { AudioSystem } from '../../systems/AudioSystem';
import { Action, InputSystem } from '../../systems/InputSystem';
import { runSprites } from '../../systems/LookLoader';
import { MusicSystem } from '../../systems/MusicSystem';
import { SETTINGS_CHANGED, settings } from '../../systems/Settings';
import { Minimap } from '../../ui/Minimap';
import { zoomWorldCamera } from '../../ui/renderScale';
import { Pool } from '../../utils/Pool';
import type { MapLoadSceneData } from '../../scenes/MapLoadScene';
import { OFF_MOVEMENT, OFF_NOVICE, OFF_NOVICE_LOOK, OFF_STEP_MS, OFF_WORLD, TILES_PER_ANIMATION_CYCLE } from '../data/offWorld';
import { OffCharacter } from '../entities/OffCharacter';
import { directionOffset, findFreeTile, TileMover, type TilePoint } from '../systems/TileMover';

export const OFF_WORLD_SCENE_KEY = 'OffWorld';

/** Run mode (R / R3): kept while the page is open, also when leaving the world and coming back. */
let runMode: boolean = OFF_MOVEMENT.startRunning;

/** Opens Off's world through the map loading screen (almost unseen when it is already loaded). */
export function startOffWorld(scene: Phaser.Scene): void {
    const data: MapLoadSceneData = {
        place: {
            ...OFF_WORLD,
            sceneKey: OFF_WORLD_SCENE_KEY,
            worn: runSprites(OFF_NOVICE, OFF_NOVICE_LOOK),
            sounds: [OFF_WORLD.music],
        },
    };
    scene.scene.start('MapLoad', data);
}

export class OffWorldScene extends Phaser.Scene {
    private map!: HBMap;
    private mapView!: MapView;
    private mover!: TileMover;
    private character!: OffCharacter;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private minimap!: Minimap;
    private dust!: Pool<Effect>;
    /** The left button went down on the world and is still held: the character follows the cursor. */
    private leftHeld = false;
    /** The stick or the keys were steering last frame (letting go stops the character). */
    private steering = false;
    /** The pace of the step under way decides the footsteps loop; it restarts when it changes. */
    private footstepsMs = 0;
    private lastTile: TilePoint = { x: 0, y: 0 };

    constructor() {
        super(OFF_WORLD_SCENE_KEY);
    }

    create(): void {
        const map = getMap(this, OFF_WORLD.asset);
        this.map = map;
        const area = OFF_WORLD.playArea;
        this.mapView = new MapView(this, map, area, area);
        const isFree = (x: number, y: number) => map.isWalkableTile(x, y);
        const spawn = findFreeTile(isFree, OFF_WORLD.spawn.x, OFF_WORLD.spawn.y, OFF_MOVEMENT.clickSearchRadius) ?? OFF_WORLD.spawn;
        this.mover = new TileMover(isFree, spawn.x, spawn.y);
        this.lastTile = { x: spawn.x, y: spawn.y };
        this.character = new OffCharacter(this, OFF_NOVICE, OFF_NOVICE_LOOK);
        this.character.update(this.mover, false, 0);
        this.leftHeld = false;
        this.steering = false;
        this.footstepsMs = 0;

        const camera = this.cameras.main;
        zoomWorldCamera(camera);
        camera.setBounds(area.x * TILE_SIZE, area.y * TILE_SIZE, area.width * TILE_SIZE, area.height * TILE_SIZE);
        camera.startFollow(this.character.container, true, CAMERA_LERP, CAMERA_LERP);
        camera.centerOn(this.character.x, this.character.y);

        this.dust = new Pool(() => new Effect(this));
        this.audio = new AudioSystem(this);
        new MusicSystem(this).play(OFF_WORLD.music);
        this.minimap = new Minimap(this, { key: OFF_WORLD.minimap, mapWidth: OFF_WORLD.size.width, mapHeight: OFF_WORLD.size.height, playArea: area }, DEPTH_DEBUG - 1);
        this.minimap.setVisible(settings.current.showMinimap);

        this.inputSystem = new InputSystem(this);
        this.input.mouse?.disableContextMenu();
        this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
        this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);

        this.mapView.setTreeMode(DEBUG_START.trees ?? settings.current.largeTrees);
        const onSettings = () => {
            this.mapView.setTreeMode(settings.current.largeTrees);
            this.minimap.setVisible(settings.current.showMinimap);
        };
        settings.on(SETTINGS_CHANGED, onSettings);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            settings.off(SETTINGS_CHANGED, onSettings);
            this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
            this.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
            this.audio.stopLoop('sfx.footsteps');
        });
    }

    override update(_time: number, delta: number): void {
        const input = this.inputSystem;
        input.update();
        if (input.justPressed(Action.Back)) {
            this.scene.start('OffHome');
            return;
        }
        if (input.justPressed(Action.ToggleRun)) runMode = !runMode;
        this.steer();
        this.mover.update(delta, runMode ? OFF_STEP_MS.run : OFF_STEP_MS.walk);
        const stepRunning = this.mover.currentStepMs === OFF_STEP_MS.run;
        this.character.update(this.mover, stepRunning, delta);
        this.updateFootsteps(stepRunning);
        this.mapView.updateFading(this.character.y, this.character.getVisualBounds());
        this.minimap.update({ player: this.character, bosses: [], totems: [], loot: [] }, this.time.now);
        for (const effect of [...this.dust.active]) {
            if (!effect.update()) this.dust.release(effect);
        }
    }

    /** Development (`check offwalk`): walks (or runs, `run`) to a tile as a click there would. */
    public debugWalkTo(x: number, y: number, run = runMode): void {
        runMode = run;
        this.clickTile(x, y);
    }

    /** Development: where the character is, for `check`. */
    public debugState(): { tile: TilePoint; moving: boolean; running: boolean; spawn: TilePoint } {
        return {
            tile: { x: this.mover.tileX, y: this.mover.tileY },
            moving: this.mover.isTravelling,
            running: runMode,
            spawn: { ...OFF_WORLD.spawn },
        };
    }

    /** Held click, stick or keys give the next steps. */
    private steer(): void {
        const pointer = this.input.activePointer;
        if (this.leftHeld && pointer.leftButtonDown()) {
            const cursor = this.tileUnder(pointer);
            const direction = directionFromVector(cursor.px - this.character.x, cursor.py - this.character.y);
            if (cursor.x === this.mover.tileX && cursor.y === this.mover.tileY) this.mover.cancel();
            else if (direction !== undefined) this.mover.steer(direction, { x: cursor.x, y: cursor.y });
            return;
        }
        const move = this.inputSystem.getMove();
        const direction = directionFromVector(move.x, move.y);
        if (direction === undefined) {
            if (this.steering) this.mover.cancel();
            this.steering = false;
            return;
        }
        this.steering = true;
        const offset = directionOffset(direction);
        const far = OFF_MOVEMENT.stickTargetTiles;
        const target = {
            x: Phaser.Math.Clamp(this.mover.tileX + offset.x * far, 0, this.map.width - 1),
            y: Phaser.Math.Clamp(this.mover.tileY + offset.y * far, 0, this.map.height - 1),
        };
        this.mover.steer(direction, target);
    }

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        if (pointer.rightButtonDown()) {
            this.leftHeld = false;
            this.mover.cancel();
            return;
        }
        if (!pointer.leftButtonDown()) return;
        this.leftHeld = true;
        const tile = this.tileUnder(pointer);
        this.clickTile(tile.x, tile.y);
    }

    /** Letting go of the left button: the character goes on to the tile under the cursor (sp-client: pointer up). */
    private onPointerUp(pointer: Phaser.Input.Pointer): void {
        if (!this.leftHeld) return;
        this.leftHeld = false;
        const tile = this.tileUnder(pointer);
        this.clickTile(tile.x, tile.y);
    }

    /** A click on a tile: there, or to the nearest free tile when it is blocked. */
    private clickTile(x: number, y: number): void {
        const map = this.map;
        const free = findFreeTile((tx, ty) => map.isWalkableTile(tx, ty), x, y, OFF_MOVEMENT.clickSearchRadius);
        if (free) this.mover.goTo(free.x, free.y);
    }

    /** World pixel and tile under the pointer. */
    private tileUnder(pointer: Phaser.Input.Pointer): { px: number; py: number; x: number; y: number } {
        const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        return { px: world.x, py: world.y, x: Math.floor(world.x / TILE_SIZE), y: Math.floor(world.y / TILE_SIZE) };
    }

    /** Footsteps in a loop at the pace of the steps; running leaves a puff of dust on every tile (as in the town). */
    private updateFootsteps(running: boolean): void {
        const mover = this.mover;
        if (!mover.isMoving) {
            this.audio.stopLoop('sfx.footsteps');
            this.footstepsMs = 0;
            return;
        }
        const cycleMs = mover.currentStepMs * TILES_PER_ANIMATION_CYCLE;
        const intervalMs = cycleMs / FOOTSTEPS_PER_RUN_CYCLE;
        if (intervalMs !== this.footstepsMs) {
            this.audio.stopLoop('sfx.footsteps');
            this.audio.startLoop('sfx.footsteps', intervalMs);
            this.footstepsMs = intervalMs;
        }
        if (mover.tileX !== this.lastTile.x || mover.tileY !== this.lastTile.y) {
            this.lastTile = { x: mover.tileX, y: mover.tileY };
            if (running) this.dust.acquire().play('fx.footsteps', this.character.x, this.character.y);
        }
    }
}
