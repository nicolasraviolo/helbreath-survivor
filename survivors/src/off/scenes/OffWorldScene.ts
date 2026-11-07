// Helbreath Off (Fase Off-1): andar por Traveler Zone, sin oleadas ni tiempo.
// Fase Off-2: pits de monstruos y combate (off/systems/OffBattle.ts). Clic en un monstruo = ir y pegarle (mantenido,
// sigue pegando); A o Espacio = pegar al marcado o al más cercano; LB / RB = cambiar de monstruo marcado.
// Se anda casilla a casilla como el original (off/systems/TileMover.ts):
// - Ratón: clic para ir a una casilla (si está bloqueada, a la libre más cercana); con el clic mantenido sigue al
//   cursor; clic derecho para (termina la casilla en la que está).
// - Teclado, cruceta y stick: va hacia donde se apunta.
// - Correr o andar: interruptor con R o R3 del mando (6-nov-2026, propietario: como el original, no mantener Shift).
// - Esc / B o Start del mando: pausa (Off-4B; Quit to Menu vuelve a la pantalla de Off).
// Fase Off-3A: el personaje lleva el aspecto que se eligió al crearlo (OffSaveStore).
// Fase Off-2B: encima va el HUD (OffHudScene) con vida, experiencia y nivel; el mundo llega hasta la barra.
// Fase Off-3B: correr gasta estamina (sin ella se anda) y C, Y o Start del mando (o el casco de la barra) abren la
// ventana Character de Survivors en su modo de Off (openCharacter), con el mundo en pausa y el HUD escondido.
// Fase Off-4A: botín en el suelo, que se recoge al pisarlo (OffBattle, OffGroundItems); el oro va en el HUD.
// Fase Off-4B: I / X abren el inventario (OffInventoryScene) a la derecha, **sin parar el mundo**: con él abierto, el
// personaje anda con el ratón (fuera del panel) y el stick; teclas y cruceta son del inventario. Equipment y Character
// tampoco paran el mundo (propietario, 7-nov-2026: solo Esc o Start pausan), pero tapan la pantalla: mientras están
// abiertas, el personaje no recibe órdenes (se queda quieto, y los monstruos le pueden pegar). C / Y abren Character.
// Cada frame se leen todas las teclas aunque haya una ventana abierta, para que una pulsación de la ventana no llegue
// al mundo al cerrarla.
// Mapa, árboles que se transparentan, cámara, pasos y minimapa, como la ciudad de Survivors (scenes/TownScene.ts).
import Phaser from 'phaser';
import { CAMERA_LERP, DEPTH_DEBUG, GAME_WIDTH, TILE_SIZE } from '../../config/gameConfig';
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
import { playAreaBottom } from '../../ui/hudLayout';
import { setGameViewport, toGame, zoomWorldCamera } from '../../ui/renderScale';
import { Pool } from '../../utils/Pool';
import type { MapLoadSceneData } from '../../scenes/MapLoadScene';
import { OFF_MOVEMENT, OFF_NOVICE, OFF_STEP_MS, OFF_WORLD, TILES_PER_ANIMATION_CYCLE } from '../data/offWorld';
import { OffCharacter } from '../entities/OffCharacter';
import { offLevelProgress } from '../data/offLevel';
import { OffBattle } from '../systems/OffBattle';
import { offSaveStore } from '../systems/OffSaveStore';
import { OFF_HUD_SCENE_KEY, OFF_OPEN_CHARACTER_EVENT, OFF_OPEN_PAUSE_EVENT, type OffHudSceneData, type OffHudState } from './OffHudScene';
import { offCharacterInfo } from './offCharacterInfo';
import { offEquipmentLook } from '../data/offItems';
import { offAttackMs } from '../data/offCombat';
import { OFF_EQUIPMENT_SCENE_KEY, type OffEquipmentSceneData } from './OffEquipmentScene';
import { OFF_INVENTORY_SCENE_KEY, type OffInventorySceneData } from './OffInventoryScene';
import type { PauseSceneData } from '../../scenes/PauseScene';
import type { MenuOverlayData } from '../../scenes/MenuOverlayScene';
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
            worn: runSprites(OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(offSaveStore.character.equipment)),
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
    private battle!: OffBattle;
    /** The left button went down on a monster and is still held: the character keeps hitting it. */
    private mouseAttack = false;
    /** Development (`check offfight`): attacks go on as if the button were held, until a click or the stick. */
    private debugHold = false;
    /** The left button went down on the world and is still held: the character follows the cursor. */
    private leftHeld = false;
    /** The stick or the keys were steering last frame (letting go stops the character). */
    private steering = false;
    /** The pace of the step under way decides the footsteps loop; it restarts when it changes. */
    private footstepsMs = 0;
    private lastTile: TilePoint = { x: 0, y: 0 };
    /** Window open over the world (Off-4B): the side Inventory, or a screen that covers it (Equipment, Character). */
    private window: 'inventory' | 'cover' | undefined;
    /**
     * Game frame in which a window closed. Phaser updates the scenes from the top one down, so the window reads a key
     * (I, Esc, C...) and closes before the world reads that same key: on that frame the world must not act on it, or I
     * would open the Inventory again right after closing it.
     */
    private windowClosedFrame = -1;

    constructor() {
        super(OFF_WORLD_SCENE_KEY);
    }

    create(): void {
        const map = getMap(this, OFF_WORLD.asset);
        this.map = map;
        const area = OFF_WORLD.playArea;
        this.mapView = new MapView(this, map, area, area);
        const isWalkable = (x: number, y: number) => map.isWalkableTile(x, y);
        const spawn = findFreeTile(isWalkable, OFF_WORLD.spawn.x, OFF_WORLD.spawn.y, OFF_MOVEMENT.clickSearchRadius) ?? OFF_WORLD.spawn;
        // Monsters block the way too (the battle knows where they are).
        this.mover = new TileMover((x, y) => this.battle.isFreeForPlayer(x, y), spawn.x, spawn.y);
        this.lastTile = { x: spawn.x, y: spawn.y };
        this.character = new OffCharacter(this, OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(offSaveStore.character.equipment));
        this.character.update(this.mover, false, 0);
        this.audio = new AudioSystem(this);
        const respawnTile = () => findFreeTile((x, y) => this.battle.isFreeForPlayer(x, y), spawn.x, spawn.y, OFF_MOVEMENT.clickSearchRadius) ?? spawn;
        this.battle = new OffBattle(this, this.mover, this.character, this.audio, isWalkable, respawnTile);
        // Each running step costs stamina (the step is chosen as a run only while there is some).
        this.mover.onStep = (stepMs) => {
            if (stepMs === OFF_STEP_MS.run) this.battle.vitals.spendRunStep();
        };
        this.leftHeld = false;
        this.mouseAttack = false;
        this.steering = false;
        this.footstepsMs = 0;
        this.window = undefined;
        this.windowClosedFrame = -1;

        const camera = this.cameras.main;
        zoomWorldCamera(camera);
        camera.setBounds(area.x * TILE_SIZE, area.y * TILE_SIZE, area.width * TILE_SIZE, area.height * TILE_SIZE);
        camera.startFollow(this.character.container, true, CAMERA_LERP, CAMERA_LERP);
        camera.centerOn(this.character.x, this.character.y);

        this.dust = new Pool(() => new Effect(this));
        new MusicSystem(this).play(OFF_WORLD.music);
        this.minimap = new Minimap(this, { key: OFF_WORLD.minimap, mapWidth: OFF_WORLD.size.width, mapHeight: OFF_WORLD.size.height, playArea: area }, DEPTH_DEBUG - 1);
        this.minimap.setVisible(settings.current.showMinimap);

        this.inputSystem = new InputSystem(this);
        this.fitPlayArea();
        this.input.mouse?.disableContextMenu();
        this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
        this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);

        this.mapView.setTreeMode(DEBUG_START.trees ?? settings.current.largeTrees);
        const onSettings = () => {
            this.fitPlayArea();
            this.mapView.setTreeMode(settings.current.largeTrees);
            this.minimap.setVisible(settings.current.showMinimap);
        };
        settings.on(SETTINGS_CHANGED, onSettings);
        this.events.on(OFF_OPEN_CHARACTER_EVENT, this.openCharacter, this);
        this.events.on(OFF_OPEN_PAUSE_EVENT, this.openPause, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            settings.off(SETTINGS_CHANGED, onSettings);
            this.events.off(OFF_OPEN_CHARACTER_EVENT, this.openCharacter, this);
            this.events.off(OFF_OPEN_PAUSE_EVENT, this.openPause, this);
            for (const key of [OFF_INVENTORY_SCENE_KEY, OFF_EQUIPMENT_SCENE_KEY]) this.scene.stop(key);
            this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
            this.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
            this.audio.stopLoop('sfx.footsteps');
            this.scene.stop(OFF_HUD_SCENE_KEY);
        });
        const hud: OffHudSceneData = { worldSceneKey: OFF_WORLD_SCENE_KEY, getState: () => this.hudState() };
        this.scene.launch(OFF_HUD_SCENE_KEY, hud);
        if (DEBUG_START.offOpen === 'bag') this.time.delayedCall(0, () => this.openInventory());
    }

    /** World down to the HUD bar, or the whole screen with the compact HUD (as GameScene.fitPlayArea). */
    private fitPlayArea(): void {
        const bottom = playAreaBottom();
        setGameViewport(this.cameras.main, 0, 0, GAME_WIDTH, bottom);
        this.inputSystem.setPointerMaxY(bottom);
    }

    /** What the HUD shows. */
    private hudState(): OffHudState {
        const battle = this.battle;
        return {
            hp: battle.hp,
            maxHp: battle.maxHp,
            mana: battle.vitals.mana,
            maxMana: battle.vitals.maxMana,
            stamina: battle.vitals.stamina,
            maxStamina: battle.vitals.maxStamina,
            level: battle.level,
            xpRatio: offLevelProgress(battle.exp, battle.level),
            kills: battle.kills,
            gold: offSaveStore.character.gold,
        };
    }

    override update(_time: number, delta: number): void {
        const input = this.inputSystem;
        input.update();
        // Read every frame, also under a window (a key pressed there must not act here once it closes).
        const pause = input.justPressed(Action.Pause) || input.justPressed(Action.Back);
        const character = input.justPressed(Action.ToggleStats);
        const inventory = input.justPressed(Action.OffInventory);
        const toggleRun = input.justPressed(Action.ToggleRun);
        if (!this.window && this.windowClosedFrame !== this.game.loop.frame) {
            if (pause) {
                this.openPause();
                return;
            }
            if (character) {
                this.openCharacter();
                return;
            }
            if (inventory) {
                this.openInventory();
                return;
            }
            if (toggleRun) runMode = !runMode;
        }
        this.updateCombatInput();
        if (!this.battle.dead && this.window !== 'cover') this.steer();
        const running = runMode && this.battle.vitals.canRun;
        if (this.battle.canMove) this.mover.update(delta, running ? OFF_STEP_MS.run : OFF_STEP_MS.walk);
        const stepRunning = this.mover.currentStepMs === OFF_STEP_MS.run;
        this.character.update(this.mover, stepRunning, delta);
        this.battle.update(delta);
        this.updateFootsteps(stepRunning);
        this.mapView.updateFading(this.character.y, this.character.getVisualBounds());
        this.minimap.update({ player: this.character, bosses: [], totems: [], loot: [] }, this.time.now);
        for (const effect of [...this.dust.active]) {
            if (!effect.update()) this.dust.release(effect);
        }
    }

    /** Pause (Esc, B, Start or the HUD's disk): world and HUD stop until Resume; Quit to Menu goes back to Off's screen. */
    public openPause(): void {
        if (!this.scene.isActive() || this.window) return;
        this.stopForWindow();
        const data: PauseSceneData & MenuOverlayData = { gameSceneKey: OFF_WORLD_SCENE_KEY, returnTo: OFF_HUD_SCENE_KEY, quitTo: 'OffHome', hideHowToPlay: true };
        this.scene.pause();
        this.scene.pause(OFF_HUD_SCENE_KEY);
        this.scene.launch('Pause', data);
        this.scene.bringToTop('Pause');
    }

    /** The Character window over the world, which goes on underneath (Off-4B); the HUD hides while it is open. */
    public openCharacter(): void {
        if (!this.scene.isActive() || this.window) return;
        this.coverWorld();
        // CharacterInfo "resumes" the world (returnTo; it was never paused). Spent points are read at once by both.
        this.scene.launch('CharacterInfo', offCharacterInfo(this.battle, OFF_WORLD_SCENE_KEY, () => this.uncoverWorld()));
    }

    /** The Equipment screen (Off-3C) over the world, which goes on; on closing, the character wears the new gear. */
    public openEquipment(): void {
        if (!this.scene.isActive() || (this.window && this.window !== 'inventory')) return;
        this.coverWorld();
        const data: OffEquipmentSceneData = {
            vitals: { hp: this.battle.hp, mana: this.battle.vitals.mana, stamina: this.battle.vitals.stamina },
            onClose: () => {
                this.uncoverWorld();
                this.dressCharacter();
            },
        };
        this.scene.launch(OFF_EQUIPMENT_SCENE_KEY, data);
    }

    /** The Inventory (Off-4B) on the right; the world goes on and the character still walks (mouse and stick). */
    public openInventory(): void {
        if (!this.scene.isActive() || this.window) return;
        this.window = 'inventory';
        this.inputSystem.setStickOnlyMove(true);
        const data: OffInventorySceneData = {
            battle: this.battle,
            onGearChange: () => this.dressCharacter(),
            openEquipment: () => {
                this.closeInventory();
                this.openEquipment();
            },
            onClose: () => this.closeInventory(),
        };
        this.scene.launch(OFF_INVENTORY_SCENE_KEY, data);
    }

    private closeInventory(): void {
        if (this.window === 'inventory') this.window = undefined;
        this.windowClosedFrame = this.game.loop.frame;
        this.inputSystem.setStickOnlyMove(false);
    }

    /** What the character wears now, on the sprite (items not downloaded yet appear when they arrive). */
    private dressCharacter(): void {
        this.character.wear(offEquipmentLook(offSaveStore.character.equipment));
    }

    /** A screen covers the world: the character stops and takes no orders; the HUD hides. */
    private coverWorld(): void {
        this.window = 'cover';
        this.stopForWindow();
        this.mover.cancel();
        this.scene.sleep(OFF_HUD_SCENE_KEY);
    }

    private uncoverWorld(): void {
        this.window = undefined;
        this.windowClosedFrame = this.game.loop.frame;
        this.scene.wake(OFF_HUD_SCENE_KEY);
    }

    /** Stops following the mouse and attacking (a window opens over the world). */
    private stopForWindow(): void {
        this.leftHeld = false;
        this.mouseAttack = false;
        this.debugHold = false;
        this.battle.stopAttacking();
        this.audio.stopLoop('sfx.footsteps');
        this.footstepsMs = 0;
    }

    /** Development (`check offwalk`): walks (or runs, `run`) to a tile as a click there would. */
    public debugWalkTo(x: number, y: number, run = runMode): void {
        runMode = run;
        this.clickTile(x, y);
    }

    /** Development: where the character is, its health and the monsters, for `check`. */
    public debugState(): {
        tile: TilePoint; moving: boolean; running: boolean; stepMs: number; spawn: TilePoint; hp: number; maxHp: number; dead: boolean;
        mana: number; maxMana: number; stamina: number; maxStamina: number; stats: Readonly<Record<string, number>>;
        level: number; exp: number; points: number; kills: number; monsters: Record<string, number>; target: string | undefined;
        weapon: string; attackMs: number; defense: number; gold: number; bag: string[]; ground: string[];
    } {
        const monsters: Record<string, number> = {};
        for (const monster of this.battle.pits.monsters) {
            if (monster.isAlive) monsters[monster.id] = (monsters[monster.id] ?? 0) + 1;
        }
        const target = this.battle.target;
        return {
            tile: { x: this.mover.tileX, y: this.mover.tileY },
            moving: this.mover.isTravelling,
            running: runMode,
            stepMs: this.mover.currentStepMs,
            spawn: { ...OFF_WORLD.spawn },
            hp: this.battle.hp,
            maxHp: this.battle.maxHp,
            dead: this.battle.dead,
            mana: this.battle.vitals.mana,
            maxMana: this.battle.vitals.maxMana,
            stamina: this.battle.vitals.stamina,
            maxStamina: this.battle.vitals.maxStamina,
            stats: this.battle.stats,
            level: this.battle.level,
            exp: this.battle.exp,
            points: this.battle.points,
            kills: this.battle.kills,
            monsters,
            target: target ? `${target.id} ${target.hp}/${target.maxHp} at ${target.mover.tileX},${target.mover.tileY}` : undefined,
            weapon: this.battle.weapon.name,
            attackMs: offAttackMs(this.battle.weapon, this.battle.stats.str),
            defense: this.battle.defense,
            gold: offSaveStore.character.gold,
            bag: [...offSaveStore.character.bag],
            ground: this.battle.ground.items.map((g) => `${'gold' in g.content ? `${g.content.gold} gold` : g.content.item} at ${g.tileX},${g.tileY}`),
        };
    }

    /** Development (`check offfight`): attacks the nearest monster of a kind (all of them, `id` undefined) and keeps on. */
    public debugFight(id?: string): void {
        const near = this.battle.pits.monsters
            .filter((m) => m.isAlive && (id === undefined || m.id === id))
            .sort((a, b) => Math.hypot(a.x - this.character.x, a.y - this.character.y) - Math.hypot(b.x - this.character.x, b.y - this.character.y));
        const first = near[0];
        if (!first) return;
        this.debugHold = true;
        this.battle.engage(first, true);
    }

    /** Attack buttons, the mouse over a monster and the gamepad's target switching. */
    private updateCombatInput(): void {
        const input = this.inputSystem;
        const battle = this.battle;
        // Under a window the buttons are the window's (A uses an item in the Inventory): read, but not acted on.
        const keys = this.window === undefined && this.windowClosedFrame !== this.game.loop.frame;
        const attack = input.justPressed(Action.OffAttack);
        const next = input.justPressed(Action.OffNextTarget);
        const previous = input.justPressed(Action.OffPrevTarget);
        if (keys && attack) battle.attackPressed();
        if (keys && next) battle.cycleTarget(1);
        if (keys && previous) battle.cycleTarget(-1);
        const pointer = this.input.activePointer;
        if (this.mouseAttack && !pointer.leftButtonDown()) this.mouseAttack = false;
        if (this.mouseAttack || this.debugHold || (keys && input.isHeld(Action.OffAttack))) battle.setHeld(true);
        else battle.setHeld(false);
        if (!pointer.wasTouch) {
            const world = this.tileUnder(pointer);
            battle.hovered = battle.monsterAt(world.px, world.py);
        }
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
        this.debugHold = false;
        this.battle.stopAttacking();
        const offset = directionOffset(direction);
        const far = OFF_MOVEMENT.stickTargetTiles;
        const target = {
            x: Phaser.Math.Clamp(this.mover.tileX + offset.x * far, 0, this.map.width - 1),
            y: Phaser.Math.Clamp(this.mover.tileY + offset.y * far, 0, this.map.height - 1),
        };
        this.mover.steer(direction, target);
    }

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        // On the HUD bar, or a screen covers the world: not the world. (On the Inventory's panel, the panel takes it.)
        if (toGame(pointer.downY) >= playAreaBottom() || this.window === 'cover') return;
        this.debugHold = false;
        if (pointer.rightButtonDown()) {
            this.leftHeld = false;
            this.mouseAttack = false;
            this.battle.clearTarget();
            this.mover.cancel();
            return;
        }
        if (!pointer.leftButtonDown() || this.battle.dead) return;
        const tile = this.tileUnder(pointer);
        const monster = this.battle.monsterAt(tile.px, tile.py);
        if (monster) {
            this.mouseAttack = true;
            this.leftHeld = false;
            this.battle.engage(monster, true);
            return;
        }
        this.battle.clearTarget();
        this.leftHeld = true;
        this.clickTile(tile.x, tile.y);
    }

    /** Letting go of the left button: the character goes on to the tile under the cursor (sp-client: pointer up). */
    private onPointerUp(pointer: Phaser.Input.Pointer): void {
        this.mouseAttack = false;
        if (!this.leftHeld || this.window === 'cover') return;
        this.leftHeld = false;
        const tile = this.tileUnder(pointer);
        this.clickTile(tile.x, tile.y);
    }

    /** A click on a tile: there, or to the nearest free tile when it is blocked. */
    private clickTile(x: number, y: number): void {
        const free = findFreeTile((tx, ty) => this.battle.isFreeForPlayer(tx, ty), x, y, OFF_MOVEMENT.clickSearchRadius);
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
