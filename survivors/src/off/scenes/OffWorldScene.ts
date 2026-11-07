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
// Fase Off-5A: el mundo carga el sitio que le digan (off/data/offPlaces.ts: Traveler Zone, Aresden o Elvine) y tiene
// portales. Pisar uno lleva al otro sitio con la vida, el maná y la estamina que tenías; el de una ciudad, sin bando,
// pregunta antes si quieres unirte (OffConfirmScene, con el mundo en pausa). Al morir lejos de casa se reaparece en tu
// ciudad (o en Traveler Zone sin bando).
// Fase Off-5B: pisar la puerta de la tienda, el herrero o el almacén de tu ciudad abre su ventana (OffStoreScene /
// OffWarehouseScene) encima del mundo, que sigue; como los portales, hay que salir de la puerta para que vuelva a abrir.
// Fase Off-6A: B abre el libro de magias (OffSpellBookScene), que tapa el mundo como Character; la tienda tiene la
// pestaña Magic.
// Fase Off-6B: 1–8 preparan la magia de esa tecla (OffBattle.spells); con ella preparada o lista, el clic izquierdo
// la lanza (al monstruo o al suelo) en vez de andar o pegar, y el clic derecho, el stick o las flechas la cancelan.
// Fase Off-6C: con RT pulsado, A/B/X/Y preparan las magias del mando (no atacan ni abren ventanas); al soltar RT, en
// cuanto está lista, va al monstruo marcado o al más cercano (curar y escudos, a ti). `padCast` la sigue.
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
import { Action, InputSystem, OFF_PAD_SPELL_ACTIONS, OFF_SPELL_KEY_ACTIONS } from '../../systems/InputSystem';
import { runSprites } from '../../systems/LookLoader';
import { MusicSystem } from '../../systems/MusicSystem';
import { SETTINGS_CHANGED, settings } from '../../systems/Settings';
import { Minimap } from '../../ui/Minimap';
import { playAreaBottom } from '../../ui/hudLayout';
import { setGameViewport, toGame, zoomWorldCamera } from '../../ui/renderScale';
import { Pool } from '../../utils/Pool';
import type { MapLoadSceneData } from '../../scenes/MapLoadScene';
import { OFF_MOVEMENT, OFF_NOVICE, OFF_STEP_MS, TILES_PER_ANIMATION_CYCLE } from '../data/offWorld';
import {
    OFF_PLACE_TEXT, OFF_PLACES, offCityOf, offHomePlace, type OffBuildingKind, type OffDoorDef, type OffFaction, type OffPlaceDef, type OffPlaceId, type OffPortalDef,
} from '../data/offPlaces';
import { OFF_STORE_SCENE_KEY, type OffStoreSceneData, type OffStoreTab } from './OffStoreScene';
import { OFF_SPELL_BOOK_SCENE_KEY, type OffSpellBookSceneData } from './OffSpellBookScene';
import { OFF_WAREHOUSE_SCENE_KEY, type OffWarehouseSceneData } from './OffWarehouseScene';
import { EVENT_LIST_EVENT } from '../../config/hud';
import { Portal } from '../../entities/Portal';
import { openOverlay } from '../../scenes/MenuOverlayScene';
import { OFF_CONFIRM_SCENE_KEY, type OffConfirmSceneData } from './OffConfirmScene';
import type { OffCarriedVitals } from '../systems/OffBattle';
import { OffCharacter } from '../entities/OffCharacter';
import { offLevelProgress } from '../data/offLevel';
import { OFF_CAST_TEXT, OFF_SPELLS } from '../data/offSpells';
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

/** Which place the world opens, and how the character gets there (Off-5A). */
export interface OffWorldSceneData {
    place: OffPlaceId;
    /** Tile to appear on (the nearest free one); the place's spawn without it. */
    at?: TilePoint;
    /** Health, mana and stamina brought through a portal; full without them. */
    carried?: OffCarriedVitals;
    /** A line for the bottom-left list on arriving. */
    message?: string;
}

/** ?offplace / ?offat apply to the first place opened only. */
let debugPlacePending = true;

/**
 * Opens a place of Off through the map loading screen (almost unseen when it is already loaded). Without data: the
 * character's home (its city, or Traveler Zone without a faction).
 */
export function startOffWorld(scene: Phaser.Scene, data?: OffWorldSceneData): void {
    let sceneData: OffWorldSceneData = data ?? { place: offHomePlace(offSaveStore.character.faction) };
    if (debugPlacePending && data === undefined && DEBUG_START.offPlace !== undefined) {
        sceneData = { place: DEBUG_START.offPlace, at: DEBUG_START.offAt };
    }
    debugPlacePending = false;
    const def = OFF_PLACES[sceneData.place];
    const load: MapLoadSceneData = {
        place: {
            ...def,
            sceneKey: OFF_WORLD_SCENE_KEY,
            worn: runSprites(OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(offSaveStore.character.equipment)),
            sounds: [def.music],
            sceneData,
        },
    };
    scene.scene.start('MapLoad', load);
}

export class OffWorldScene extends Phaser.Scene {
    private placeId: OffPlaceId = 'traveler';
    private place: OffPlaceDef = OFF_PLACES.traveler;
    private arrival: OffWorldSceneData = { place: 'traveler' };
    private map!: HBMap;
    /** Our portal effects (a city's way back), also shown on the minimap. */
    private portalSprites: Portal[] = [];
    /** Portal the character stands in: it takes you through on stepping in, not again until you step out. */
    private insidePortal: OffPortalDef | undefined;
    /** The door stood on (Off-5B): its window opens again only after stepping off it. */
    private insideDoor: OffDoorDef | undefined;
    /** Already on the way to another place (the loading screen opens next). */
    private leaving = false;
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
    /** Development (`debugCast`): the kind of monster the spell goes to once ready ('' = any). */
    private debugCastAt: string | undefined;
    /** A spell started with RT + A/B/X/Y: cast at the target once it is ready and RT is let go (Off-6C). */
    private padCast = false;
    /** RT is held this frame (A/B/X/Y are spells then). */
    private castTrigger = false;
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

    init(data: Partial<OffWorldSceneData> | undefined): void {
        this.placeId = data?.place ?? offHomePlace(offSaveStore.character.faction);
        this.place = OFF_PLACES[this.placeId];
        this.arrival = { ...data, place: this.placeId };
    }

    create(): void {
        const place = this.place;
        const map = getMap(this, place.asset);
        this.map = map;
        const area = place.playArea;
        this.mapView = new MapView(this, map, area, area);
        const isWalkable = (x: number, y: number) => map.isWalkableTile(x, y) && insideArea(area, x, y);
        const home = findFreeTile(isWalkable, place.spawn.x, place.spawn.y, OFF_MOVEMENT.clickSearchRadius) ?? place.spawn;
        const at = this.arrival.at;
        const spawn = (at && findFreeTile(isWalkable, at.x, at.y, OFF_MOVEMENT.clickSearchRadius)) ?? home;
        // Monsters block the way too (the battle knows where they are).
        this.mover = new TileMover((x, y) => this.battle.isFreeForPlayer(x, y), spawn.x, spawn.y);
        this.lastTile = { x: spawn.x, y: spawn.y };
        this.character = new OffCharacter(this, OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(offSaveStore.character.equipment));
        this.character.update(this.mover, false, 0);
        this.audio = new AudioSystem(this);
        // Coming back to life: here, on the place's spawn, if this is home; otherwise off to the character's city.
        const respawnTile = (): TilePoint | undefined => {
            const homePlace = offHomePlace(offSaveStore.character.faction);
            if (homePlace !== this.placeId) {
                this.travel({ place: homePlace });
                return undefined;
            }
            return findFreeTile((x, y) => this.battle.isFreeForPlayer(x, y), home.x, home.y, OFF_MOVEMENT.clickSearchRadius) ?? home;
        };
        this.battle = new OffBattle(this, this.mover, this.character, this.audio, isWalkable, respawnTile, place.pits, this.arrival.carried);
        this.leaving = false;
        this.portalSprites = place.portals.filter((p) => p.drawn).map((p) => {
            const centre = portalCentre(p);
            return new Portal(this, centre.x * TILE_SIZE, centre.y * TILE_SIZE, Number.POSITIVE_INFINITY);
        });
        this.insidePortal = this.portalAt(spawn.x, spawn.y);
        this.insideDoor = this.doorAt(spawn.x, spawn.y);
        // Each running step costs stamina (the step is chosen as a run only while there is some).
        this.mover.onStep = (stepMs) => {
            if (stepMs === OFF_STEP_MS.run) this.battle.vitals.spendRunStep();
        };
        this.leftHeld = false;
        this.mouseAttack = false;
        this.debugCastAt = undefined;
        this.padCast = false;
        this.castTrigger = false;
        this.steering = false;
        this.footstepsMs = 0;
        this.window = undefined;
        this.windowClosedFrame = -1;

        const camera = this.cameras.main;
        zoomWorldCamera(camera);
        camera.setBounds(area.x * TILE_SIZE, area.y * TILE_SIZE, area.width * TILE_SIZE, area.height * TILE_SIZE);
        camera.startFollow(this.character.container, true, CAMERA_LERP, CAMERA_LERP);
        camera.centerOn(this.character.x, this.character.y);
        this.cullMap();

        this.dust = new Pool(() => new Effect(this));
        new MusicSystem(this).play(place.music);
        this.minimap = new Minimap(this, { key: place.minimap, mapWidth: place.size.width, mapHeight: place.size.height, playArea: area }, DEPTH_DEBUG - 1);
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
            for (const key of [OFF_INVENTORY_SCENE_KEY, OFF_EQUIPMENT_SCENE_KEY, OFF_STORE_SCENE_KEY, OFF_WAREHOUSE_SCENE_KEY]) this.scene.stop(key);
            this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
            this.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
            this.audio.stopLoop('sfx.footsteps');
            this.scene.stop(OFF_HUD_SCENE_KEY);
        });
        const hud: OffHudSceneData = { worldSceneKey: OFF_WORLD_SCENE_KEY, getState: () => this.hudState() };
        this.scene.launch(OFF_HUD_SCENE_KEY, hud);
        const open = DEBUG_START.offOpen;
        if (open === 'bag') this.time.delayedCall(0, () => this.openInventory());
        else if (open === 'book') this.time.delayedCall(0, () => this.openSpellBook());
        else if (open === 'magic') this.time.delayedCall(0, () => this.openBuilding('shop', 'magic'));
        else if (open !== undefined) this.time.delayedCall(0, () => this.openBuilding(open));
        const message = this.arrival.message;
        // After the HUD has opened and listens.
        if (message !== undefined) this.time.delayedCall(ARRIVAL_MESSAGE_DELAY_MS, () => this.events.emit(EVENT_LIST_EVENT, message));
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
            spell: battle.spells.spell ? { name: OFF_SPELLS[battle.spells.spell].name, ready: battle.spells.state === 'ready' } : undefined,
            shield: battle.protection ? { name: OFF_SPELLS[battle.protection.spell].name, secondsLeft: Math.ceil(battle.protection.leftMs / 1000) } : undefined,
            kills: battle.kills,
            gold: offSaveStore.character.gold,
        };
    }

    /** Only the map objects near the camera are sorted and drawn (whole cities, Off-5C). */
    private cullMap(): void {
        const camera = this.cameras.main;
        this.mapView.cullAround(this.character.x, this.character.y, camera.width / camera.zoom / 2, camera.height / camera.zoom / 2);
    }

    override update(_time: number, delta: number): void {
        const input = this.inputSystem;
        input.update();
        // Read every frame, also under a window (a key pressed there must not act here once it closes).
        // RT held (Off-6C): A/B/X/Y are spells, not attack, pause (B), Character (Y) or Inventory (X).
        const trigger = input.isHeld(Action.OffCastTrigger);
        this.castTrigger = trigger;
        const padSpell = trigger ? OFF_PAD_SPELL_ACTIONS.findIndex((action) => input.justPressed(action)) : -1;
        const pause = input.justPressed(Action.Pause) || (!trigger && input.justPressed(Action.Back));
        const character = !trigger && input.justPressed(Action.ToggleStats);
        const inventory = !trigger && input.justPressed(Action.OffInventory);
        const toggleRun = input.justPressed(Action.ToggleRun);
        const spellBook = input.justPressed(Action.OffSpellBook);
        const spellKey = OFF_SPELL_KEY_ACTIONS.findIndex((action) => input.justPressed(action));
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
            if (spellBook) {
                this.openSpellBook();
                return;
            }
            if (toggleRun) runMode = !runMode;
            if (spellKey >= 0) this.pressSpellKey(spellKey);
            if (padSpell >= 0) this.pressPadSpell(padSpell);
        }
        this.updateCombatInput();
        this.updateDebugCast();
        this.updatePadCast();
        if (!this.battle.dead && this.window !== 'cover') this.steer();
        const running = runMode && this.battle.vitals.canRun;
        if (this.battle.canMove) this.mover.update(delta, running ? OFF_STEP_MS.run : OFF_STEP_MS.walk);
        const stepRunning = this.mover.currentStepMs === OFF_STEP_MS.run;
        this.character.update(this.mover, stepRunning, delta);
        this.battle.update(delta);
        this.updateFootsteps(stepRunning);
        this.updatePortals();
        this.updateDoors();
        this.mapView.updateFading(this.character.y, this.character.getVisualBounds());
        this.cullMap();
        this.minimap.update({ player: this.character, bosses: [], totems: [], loot: [], portals: this.portalSprites }, this.time.now);
        for (const effect of [...this.dust.active]) {
            if (!effect.update()) this.dust.release(effect);
        }
    }

    // ---- Portals (Off-5A) ----

    /** The portal whose tiles include that one. */
    private portalAt(x: number, y: number): OffPortalDef | undefined {
        return this.place.portals.find((p) => insideArea(p.area, x, y));
    }

    /** Stepping into a portal takes you through (once: you step out before it works again). */
    private updatePortals(): void {
        if (this.leaving || this.battle.dead) return;
        const portal = this.portalAt(this.mover.tileX, this.mover.tileY);
        if (portal && portal !== this.insidePortal) this.enterPortal(portal);
        this.insidePortal = portal;
    }

    private enterPortal(portal: OffPortalDef): void {
        const to = portal.to;
        if (to.kind === 'traveler') {
            this.travel({ place: 'traveler', at: this.travelerArrivalFor(this.placeId), carried: this.carriedVitals() });
            return;
        }
        const faction = offSaveStore.character.faction;
        if (faction === to.faction) {
            this.travel({ place: offCityOf(faction), at: cityArrival(faction), carried: this.carriedVitals() });
            return;
        }
        if (faction !== undefined) {
            this.events.emit(EVENT_LIST_EVENT, OFF_PLACE_TEXT.otherCity(to.faction));
            return;
        }
        this.askToJoin(to.faction);
    }

    /** "Do you want to join ...?" over the world, which waits paused; Yes joins for ever and goes there. */
    private askToJoin(faction: OffFaction): void {
        if (this.window === 'inventory') {
            this.scene.stop(OFF_INVENTORY_SCENE_KEY);
            this.closeInventory();
        }
        // Under Equipment or Character the character cannot walk in: nothing to ask.
        if (this.window) return;
        this.stopForWindow();
        this.mover.cancel();
        const data: Omit<OffConfirmSceneData, 'returnTo'> = {
            faction,
            onYes: () => {
                offSaveStore.joinFaction(faction);
                this.travel({ place: offCityOf(faction), at: cityArrival(faction), carried: this.carriedVitals(), message: OFF_PLACE_TEXT.joined(faction) });
            },
        };
        openOverlay(this, OFF_CONFIRM_SCENE_KEY, data);
    }

    // ---- Doors (Off-5B) ----

    private doorAt(x: number, y: number): OffDoorDef | undefined {
        return this.place.doors.find((d) => insideArea(d.area, x, y));
    }

    /** Stepping on a door opens its window (once: step off before it works again). */
    private updateDoors(): void {
        if (this.leaving || this.battle.dead) return;
        const door = this.doorAt(this.mover.tileX, this.mover.tileY);
        if (door && door !== this.insideDoor) this.openBuilding(door.kind);
        this.insideDoor = door;
    }

    /** The shop's, the blacksmith's or the warehouse's window over the world (the Inventory closes first). */
    public openBuilding(kind: OffBuildingKind, tab?: OffStoreTab): void {
        if (!this.scene.isActive()) return;
        if (this.window === 'inventory') {
            this.scene.stop(OFF_INVENTORY_SCENE_KEY);
            this.closeInventory();
        }
        if (this.window) return;
        this.coverWorld();
        const onClose = () => {
            this.uncoverWorld();
            this.dressCharacter();
        };
        if (kind === 'warehouse') {
            const data: OffWarehouseSceneData = { onClose };
            this.scene.launch(OFF_WAREHOUSE_SCENE_KEY, data);
            return;
        }
        const data: OffStoreSceneData = { kind, onChange: () => undefined, onClose, ...(tab ? { tab } : {}) };
        this.scene.launch(OFF_STORE_SCENE_KEY, data);
    }

    /** In Traveler Zone, by the portal of the city you come from. */
    private travelerArrivalFor(from: OffPlaceId): TilePoint | undefined {
        return OFF_PLACES.traveler.portals.find((p) => p.to.kind === 'city' && offCityOf(p.to.faction) === from)?.arrival;
    }

    private carriedVitals(): OffCarriedVitals {
        return { hp: this.battle.hp, mana: this.battle.vitals.mana, stamina: this.battle.vitals.stamina, protection: this.battle.protection };
    }

    /** Off to another place through its loading screen. */
    private travel(data: OffWorldSceneData): void {
        if (this.leaving) return;
        this.leaving = true;
        this.stopForWindow();
        startOffWorld(this, data);
    }

    /** Development (`check offportal`): goes through a place's portal at once, as stepping on it would. */
    public debugPortal(index: number): void {
        const portal = this.place.portals[index];
        if (portal) this.enterPortal(portal);
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

    /** The spell book (Off-6A) over the world, which goes on; the HUD hides while it is open. */
    public openSpellBook(): void {
        if (!this.scene.isActive() || this.window) return;
        this.coverWorld();
        const data: OffSpellBookSceneData = { onClose: () => this.uncoverWorld() };
        this.scene.launch(OFF_SPELL_BOOK_SCENE_KEY, data);
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
        // The minimap is drawn on top of everything (DEPTH_DEBUG) and would show through a centred window (Off-5B).
        this.minimap.setVisible(false);
    }

    private uncoverWorld(): void {
        this.window = undefined;
        this.windowClosedFrame = this.game.loop.frame;
        this.scene.wake(OFF_HUD_SCENE_KEY);
        this.minimap.setVisible(settings.current.showMinimap);
    }

    /** Stops following the mouse and attacking (a window opens over the world). */
    private stopForWindow(): void {
        this.battle.spells.cancel();
        this.leftHeld = false;
        this.mouseAttack = false;
        this.debugHold = false;
        this.battle.stopAttacking();
        this.audio.stopLoop('sfx.footsteps');
        this.footstepsMs = 0;
    }

    // ---- Spells (Off-6B) ----

    /** 1–8: stops attacking and walking, and prepares that key's spell. */
    private pressSpellKey(index: number): void {
        if (this.battle.dead) return;
        this.stopForSpell();
        this.padCast = false;
        this.battle.spells.press(index);
    }

    /** RT + A/B/X/Y (Off-6C): prepares that button's spell; it is cast by itself once RT is let go (updatePadCast). */
    private pressPadSpell(index: number): void {
        const id = offSaveStore.character.padSpells[index];
        if (this.battle.dead || id === undefined) return;
        this.stopForSpell();
        this.padCast = this.battle.spells.pressSpell(id);
    }

    private stopForSpell(): void {
        this.leftHeld = false;
        this.mouseAttack = false;
        this.debugHold = false;
        this.battle.stopAttacking();
    }

    /** A gamepad spell: once ready and RT is up, at the marked monster, else the nearest (Heal and shields: on you). */
    private updatePadCast(): void {
        const spells = this.battle.spells;
        if (!this.padCast) return;
        if (!spells.busy) {
            this.padCast = false;
            return;
        }
        if (spells.state !== 'ready' || this.castTrigger) return;
        this.padCast = false;
        if (spells.onSelf) {
            spells.release(this.character.x, this.character.y, undefined);
            return;
        }
        const target = this.battle.spellTarget();
        if (target) {
            this.battle.target = target;
            spells.release(target.x, target.y, target);
        } else {
            spells.cancel();
            this.battle.eventLine(OFF_CAST_TEXT.noMonster);
        }
    }

    /** Development (`check offpadcast`): RT + that button (0 A … 3 Y), let go at once: cast when ready. */
    public debugPadCast(index: number): void {
        this.pressPadSpell(index);
    }

    /** Development (`check offcast`): casts the spell on key `index` at the nearest monster of a kind (any, `id` undefined). */
    public debugCast(index: number, id?: string): void {
        this.debugCastAt = id ?? '';
        this.pressSpellKey(index);
    }

    /** `debugCast`: once the spell is ready, it is released on the nearest monster of that kind. */
    private updateDebugCast(): void {
        const id = this.debugCastAt;
        const spells = this.battle.spells;
        if (id === undefined) return;
        if (!spells.busy) {
            this.debugCastAt = undefined;
            return;
        }
        if (spells.state !== 'ready') return;
        this.debugCastAt = undefined;
        const near = this.battle.pits.monsters
            .filter((m) => m.isAlive && (id === '' || m.id === id))
            .sort((a, b) => Math.hypot(a.x - this.character.x, a.y - this.character.y) - Math.hypot(b.x - this.character.x, b.y - this.character.y));
        const first = near[0];
        if (first) spells.release(first.x, first.y, first);
        else spells.cancel();
    }

    /** Development (`check offwalk`): walks (or runs, `run`) to a tile as a click there would. */
    public debugWalkTo(x: number, y: number, run = runMode): void {
        runMode = run;
        this.clickTile(x, y);
    }

    /** Development: where the character is, its health and the monsters, for `check`. */
    public debugState(): {
        tile: TilePoint; moving: boolean; running: boolean; stepMs: number; spawn: TilePoint; place: OffPlaceId; faction: string; hp: number; maxHp: number; dead: boolean;
        mana: number; maxMana: number; stamina: number; maxStamina: number; stats: Readonly<Record<string, number>>;
        level: number; exp: number; points: number; kills: number; monsters: Record<string, number>; target: string | undefined;
        weapon: string; attackMs: number; defense: number; gold: number; bag: string[]; ground: string[];
        spell: string; casts: number; fails: number; prepareMs: number; burning: number; slowed: number;
        held: number; shield: string | undefined; padSpells: string[];
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
            spawn: { ...this.place.spawn },
            place: this.placeId,
            faction: offSaveStore.character.faction ?? 'none',
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
            spell: `${this.battle.spells.state}${this.battle.spells.spell ? ` ${this.battle.spells.spell}` : ''}`,
            casts: this.battle.spells.casts,
            fails: this.battle.spells.fails,
            prepareMs: this.battle.spells.prepareMs,
            burning: this.battle.pits.monsters.filter((m) => m.isAlive && m.isBurning).length,
            slowed: this.battle.pits.monsters.filter((m) => m.isAlive && m.isSlowed).length,
            held: this.battle.pits.monsters.filter((m) => m.isAlive && m.isHeld).length,
            shield: this.battle.protection ? `${this.battle.protection.spell} ${Math.ceil(this.battle.protection.leftMs / 1000)}s` : undefined,
            padSpells: offSaveStore.character.padSpells.map((k) => k ?? '-'),
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
        const attack = !this.castTrigger && input.justPressed(Action.OffAttack);
        const next = input.justPressed(Action.OffNextTarget);
        const previous = input.justPressed(Action.OffPrevTarget);
        if (keys && attack) {
            battle.spells.cancel();
            battle.attackPressed();
        }
        if (keys && next) battle.cycleTarget(1);
        if (keys && previous) battle.cycleTarget(-1);
        const pointer = this.input.activePointer;
        if (this.mouseAttack && !pointer.leftButtonDown()) this.mouseAttack = false;
        if (this.mouseAttack || this.debugHold || (keys && !this.castTrigger && input.isHeld(Action.OffAttack))) battle.setHeld(true);
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
        this.battle.spells.cancel();
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
            this.battle.spells.cancel();
            this.leftHeld = false;
            this.mouseAttack = false;
            this.battle.clearTarget();
            this.mover.cancel();
            return;
        }
        if (!pointer.leftButtonDown() || this.battle.dead) return;
        const tile = this.tileUnder(pointer);
        const monster = this.battle.monsterAt(tile.px, tile.py);
        // A spell prepared or ready takes the click (Off-6B).
        if (this.battle.spells.release(tile.px, tile.py, monster)) {
            this.leftHeld = false;
            this.mouseAttack = false;
            this.battle.stopAttacking();
            return;
        }
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

/** Time for the HUD to open before the arrival line is sent. */
const ARRIVAL_MESSAGE_DELAY_MS = 300;

function insideArea(area: { x: number; y: number; width: number; height: number }, x: number, y: number): boolean {
    return x >= area.x && y >= area.y && x < area.x + area.width && y < area.y + area.height;
}

/** Middle of a portal's tiles, in tiles (its effect is drawn there). */
function portalCentre(portal: OffPortalDef): { x: number; y: number } {
    return { x: portal.area.x + portal.area.width / 2, y: portal.area.y + portal.area.height / 2 };
}

/** In a city, by its portal back to Traveler Zone. */
function cityArrival(faction: OffFaction): TilePoint | undefined {
    return OFF_PLACES[offCityOf(faction)].portals.find((p) => p.to.kind === 'traveler')?.arrival;
}
