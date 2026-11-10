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
// Fase Off-4B (Off-12B): I / X abren la ventana del personaje con la bolsa (OffBagScene), **sin parar el mundo**.
// Ella y Character tampoco paran el mundo (propietario, 7-nov-2026: solo Esc o Start pausan), pero tapan la pantalla: mientras están
// abiertas, el personaje no recibe órdenes (se queda quieto, y los monstruos le pueden pegar). C / Y abren Character.
// Cada frame se leen todas las teclas aunque haya una ventana abierta, para que una pulsación de la ventana no llegue
// al mundo al cerrarla.
// Fase Off-5A: el mundo carga el sitio que le digan (off/data/offPlaces.ts: Traveler Zone, Aresden o Elvine) y tiene
// portales. Pisar uno lleva al otro sitio con la vida, el maná y la estamina que tenías; el de una ciudad, sin bando,
// pregunta antes si quieres unirte (OffDialogScene desde la Off-13A, con el mundo en pausa). Al morir lejos de casa se reaparece en tu
// ciudad (o en Traveler Zone sin bando).
// Fase Off-7A: el teleport de la ciudad pregunta adónde ir (Traveler Zone o Promiseland; desde la Off-10C, OffMapSelectScene). En
// Promiseland se llega por la puerta de tu ciudad (Elvine arriba, Aresden abajo) y por ella se vuelve.
// Fase Off-5B: pisar la puerta de la tienda, el herrero o el almacén de tu ciudad abre su ventana (OffStoreScene /
// OffWarehouseScene) encima del mundo, que sigue; como los portales, hay que salir de la puerta para que vuelva a abrir.
// Fase Off-6A: B abre el libro de magias, que tapa el mundo como Character; la tienda tiene la pestaña Magic.
// Fase Off-12C: Character y el libro pasan a ser las pestañas Stats y Magic de la ventana del personaje (OffBagScene):
// C / Y la abren en Stats y B en Magic. RT + A/B/X/Y lanzan las magias de las teclas 1–4.
// Fase Off-6B: 1–8 preparan la magia de esa tecla (OffBattle.spells); con ella preparada o lista, el clic izquierdo
// la lanza (al monstruo o al suelo) en vez de andar o pegar, y el clic derecho, el stick o las flechas la cancelan.
// Fase Off-6C: con RT pulsado, A/B/X/Y preparan las magias del mando (no atacan ni abren ventanas); al soltar RT, en
// cuanto está lista, va al monstruo marcado o al más cercano (curar y escudos, a ti). `padCast` la sigue.
// Fase Off-8B: en la ciudad, William (junto al teleport) contrata mercenarios: al acercarse sale "Talk" y Espacio, A o
// un clic en él abren su ventana (OffMercenaryScene; lejos, el clic lleva hasta él). Heal y escudos van a tu mercenario
// con un clic sobre él, o con el mando empujando el stick derecho hacia él mientras están listas (flecha a tus pies y
// aro en él, como el apuntado de Survivors); sin stick, a ti.
// Fase Off-10C: tu Farm es tu casa: unirte, los portales de tu bando y morir llevan allí. El teleport (de la Farm o de la
// ciudad) abre una Select Map como la de Survivors (OffMapSelectScene) con el mundo en pausa debajo.
// 9-nov-2026 (propietario): al empezar una magia el personaje se para y no anda aunque sigas empujando el stick o las
// flechas, hasta soltarlos (`holdStill`). Con RT pulsado sale la cruz de las cuatro magias del mando (HUD) y la magia se
// lanza en cuanto está lista, sin soltar RT. El stick derecho pone una mirilla en el suelo (más lejos cuanto más se
// empuja, OFF_PAD_AIM) y la magia cae ahí, o en el monstruo de al lado; sin stick, al marcado o al más cercano.
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
import { OFF_MOVEMENT, OFF_NOVICE, OFF_STEP_MS, OFF_WHERE_SAVE_MS, TILES_PER_ANIMATION_CYCLE } from '../data/offWorld';
import {
    OFF_PLACE_TEXT, OFF_PLACES, offArrivalIn, offFarmOf, offGateArrival, offHomePlace, offTeleportArrival, offTeleportDestinations, type OffBuildingKind, type OffDoorDef, type OffNpcOpens, type OffFaction, type OffPlaceDef, type OffPlaceId, type OffPortalDef,
} from '../data/offPlaces';
import { OFF_STORE_SCENE_KEY, type OffStoreSceneData, type OffStoreTab } from './OffStoreScene';
import { OFF_WAREHOUSE_SCENE_KEY, type OffWarehouseSceneData } from './OffWarehouseScene';
import { EVENT_LIST_EVENT } from '../../config/hud';
import { Portal } from '../../entities/Portal';
import { openOverlay } from '../../scenes/MenuOverlayScene';
import { OFF_DIALOG_SCENE_KEY, type OffDialogSceneData } from './OffDialogScene';
import { OFF_DIALOG_TEXT } from '../config/offDialog';
import { OFF_MAP_SELECT_SCENE_KEY, type OffMapSelectSceneData } from './OffMapSelectScene';
import type { OffCarriedVitals } from '../systems/OffBattle';
import { OffCharacter } from '../entities/OffCharacter';
import { offLevelProgress } from '../data/offLevel';
import { OFF_CAST_TEXT, OFF_PAD_AIM, OFF_PAD_SPELL_COUNT, OFF_SPELLS } from '../data/offSpells';
import { OffAimReticle } from '../ui/OffAimReticle';
import type { OffMonster } from '../entities/OffMonster';
import { OffBattle } from '../systems/OffBattle';
import { OffDuel, type OffDuelKind, type OffDuelReport } from '../dev/offDuel';
import { offSaveStore } from '../systems/OffSaveStore';
import { OFF_PAUSE_SCENE_KEY, type OffPauseSceneData } from './OffPauseScene';
import { OFF_HUD_SCENE_KEY, OFF_OPEN_CHARACTER_EVENT, OFF_OPEN_PAUSE_EVENT, type OffHudSceneData, type OffHudState } from './OffHudScene';
import { isOffGoodId } from '../data/offGoods';
import { isOffGearKey, offEquipmentLook, offGearId, offGearRolls, offWeaponTint } from '../data/offItems';
import { rollKillLoot } from '../systems/OffLootRoller';
import { isOffMonsterId, OFF_MONSTERS, type OffMonsterId } from '../data/offMonsters';
import { OFF_RAIDS } from '../data/offRaiders';
import { offHitChance, offPlayerHitRatio } from '../systems/OffCombatRules';
import { offAttackMs } from '../data/offCombat';
import { OFF_BAG_SCENE_KEY, type OffBagSceneData, type OffCharacterTab } from './OffBagScene';
import { directionOffset, findFreeTile, TileMover, type TilePoint } from '../systems/TileMover';
import { OffPathfinder } from '../systems/OffPathfinder';
import { Npc } from '../../entities/Npc';
import { TOWN_NPCS, TOWN_TALK, type NpcDef } from '../../data/town';
import { AimArrow } from '../../ui/AimArrow';
import { manualAimAngle } from '../../systems/Targeting';
import { lookLoader } from '../../systems/LookLoader';
import { OFF_MERCENARIES, OFF_MERCENARY, OFF_MERCENARY_TEXT, offMercenaryGear, type OffMercenaryId } from '../data/offMercenary';
import { OFF_MERCENARY_SCENE_KEY, type OffMercenarySceneData } from './OffMercenaryScene';
import type { OffSpellAlly } from '../systems/OffSpells';

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
    /** Off-10A: the place left to come here (the Barracks' door takes you back there). */
    from?: OffPlaceId;
}

/** ?offplace / ?offat apply to the first place opened only. */
let debugPlacePending = true;

/**
 * Opens a place of Off through the map loading screen (almost unseen when it is already loaded). Without data: the
 * character's home (its Farm, or Traveler Zone without a faction).
 */
export function startOffWorld(scene: Phaser.Scene, data?: OffWorldSceneData): void {
    // Off-7E: Play puts the character back where it was (home, its Farm since Off-10C, when nothing was saved).
    let sceneData: OffWorldSceneData = data ?? savedArrival();
    if (debugPlacePending && data === undefined && DEBUG_START.offPlace !== undefined) {
        sceneData = { place: DEBUG_START.offPlace, at: DEBUG_START.offAt };
    }
    debugPlacePending = false;
    const def = OFF_PLACES[sceneData.place];
    const load: MapLoadSceneData = {
        place: {
            ...def,
            sceneKey: OFF_WORLD_SCENE_KEY,
            worn: [...runSprites(OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(offSaveStore.character.equipment)), ...mercenarySprites()],
            sounds: [def.music],
            sceneData,
        },
    };
    scene.scene.start('MapLoad', load);
}

/** Off-8B: the hired mercenary's body and gear at your level (nothing without one). */
function mercenarySprites(): ReturnType<typeof runSprites> {
    const id = offSaveStore.character.mercenary;
    return id ? mercenaryLook(id) : [];
}

/** Off-8C: that mercenary's body (Gorn's or Kaila's) and gear at your level. */
function mercenaryLook(id: OffMercenaryId): ReturnType<typeof runSprites> {
    return runSprites(OFF_NOVICE, OFF_MERCENARIES[id].body, offEquipmentLook(offMercenaryGear(id, offSaveStore.level)));
}

/** Off-7E: the saved place and tile, as an arrival; home (its Farm, Off-10C) with nothing saved. */
function savedArrival(): OffWorldSceneData {
    const where = offSaveStore.character.where;
    if (!where) return { place: offHomePlace(offSaveStore.character.faction) };
    return where.x !== undefined && where.y !== undefined ? { place: where.place, at: { x: where.x, y: where.y } } : { place: where.place };
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
    /** Off-7E: finds the way round houses and walls for a click. */
    private pathfinder!: OffPathfinder;
    private character!: OffCharacter;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private minimap!: Minimap;
    private dust!: Pool<Effect>;
    private battle!: OffBattle;
    /** The left button went down on a monster and is still held: the character keeps hitting it. */
    private mouseAttack = false;
    /**
     * Development (`check offhitrate`, Off-7C): hit chance (%) of the player's blows against every monster, from the
     * front, for each DEX (no Hitting Probability), rolled `count` times as a real blow would.
     */
    public debugHitTable(dexes: readonly number[], count: number): Record<string, Record<string, { ratio: number; percent: number }>> {
        const out: Record<string, Record<string, { ratio: number; percent: number }>> = {};
        for (const dex of dexes) {
            const ratio = offPlayerHitRatio(dex);
            const row: Record<string, { ratio: number; percent: number }> = {};
            for (const id of Object.keys(OFF_MONSTERS) as OffMonsterId[]) {
                const chance = offHitChance(ratio, OFF_MONSTERS[id].base.defenseRatio, false);
                let hits = 0;
                for (let i = 0; i < count; i++) if (Math.random() < chance) hits++;
                row[id] = { ratio, percent: Math.round((hits / count) * 100) };
            }
            out[`dex${dex}`] = row;
        }
        return out;
    }

    /** Development (`check offfight`): attacks go on as if the button were held, until a click or the stick. */
    private debugHold = false;
    /** Development (`check offduel*`, Off-9C): the test fights running, if any. */
    private duel: OffDuel | undefined;
    /** Development (`debugCast`): the kind of monster the spell goes to once ready ('' = any). */
    private debugCastAt: string | undefined;
    /** A spell started with RT + A/B/X/Y: cast at the target once it is ready and RT is let go (Off-6C). */
    private padCast = false;
    /** RT is held this frame (A/B/X/Y are spells then). */
    private castTrigger = false;
    /** Development (`debugCastTrigger`): RT counts as held. */
    private debugTrigger = false;
    /** Development (`debugStick`): the left stick held this way. */
    private debugMove: { x: number; y: number } | undefined;
    /** Development (`debugPadState`): where the last gamepad spell went, in tiles from you, and to whom. */
    private lastPadRelease: string | undefined;
    /** The left button went down on the world and is still held: the character follows the cursor. */
    private leftHeld = false;
    /** The stick or the keys were steering last frame (letting go stops the character). */
    private steering = false;
    /**
     * A spell was started while the stick or the keys were held: the character stands still until they are let go
     * (propietario, 9-nov-2026: once you cast, you stop). Pushing again afterwards walks and drops a spell still waiting.
     */
    private holdStill = false;
    /** The pace of the step under way decides the footsteps loop; it restarts when it changes. */
    private footstepsMs = 0;
    private lastTile: TilePoint = { x: 0, y: 0 };
    /** Off-7E: time since `where` was last saved while walking. */
    private whereSaveMs = 0;
    /** Window open over the world: a screen that covers it (the bag, Character, shops...). */
    private window: 'cover' | undefined;
    /**
     * Game frame in which a window closed. Phaser updates the scenes from the top one down, so the window reads a key
     * (I, Esc, C...) and closes before the world reads that same key: on that frame the world must not act on it, or I
     * would open the Inventory again right after closing it.
     */
    private windowClosedFrame = -1;
    /** NPCs you talk to: William, who hires mercenaries (Off-8B), and the Farms' sellers (Off-10A). */
    private npcs: TalkNpc[] = [];
    /** Clicked an NPC from afar: its window opens on getting near. */
    private talkPending: TalkNpc | undefined;
    /** The arrow at the feet while the right stick aims a support spell (Off-8B). */
    private aimArrow!: AimArrow;
    /** The mark on the ground where a gamepad spell aimed with the right stick will fall (9-nov-2026). */
    private reticle!: OffAimReticle;

    constructor() {
        super(OFF_WORLD_SCENE_KEY);
    }

    init(data: Partial<OffWorldSceneData> | undefined): void {
        const home = offHomePlace(offSaveStore.character.faction);
        this.placeId = data?.place ?? home;
        this.place = OFF_PLACES[this.placeId];
        // Without a tile (?offplace), by the gate of the character's faction when the place has one (Promiseland, Off-7A).
        const at = data?.at ?? offGateArrival(this.placeId, offSaveStore.character.faction);
        this.arrival = { ...data, place: this.placeId, ...(at ? { at } : {}) };
    }

    create(): void {
        const place = this.place;
        const map = getMap(this, place.asset);
        this.map = map;
        const area = place.playArea;
        this.mapView = new MapView(this, map, area, area);
        const isWalkable = (x: number, y: number) => map.isWalkableTile(x, y) && insideArea(area, x, y);
        // Off-8B: the NPCs first, so their tiles are blocked before anyone is placed.
        this.npcs = this.createNpcs(isWalkable);
        this.talkPending = undefined;
        const home = findFreeTile(isWalkable, place.spawn.x, place.spawn.y, OFF_MOVEMENT.clickSearchRadius) ?? place.spawn;
        const at = this.arrival.at;
        const spawn = (at && findFreeTile(isWalkable, at.x, at.y, OFF_MOVEMENT.clickSearchRadius)) ?? home;
        // Monsters block the way too (the battle knows where they are).
        this.mover = new TileMover((x, y) => this.battle.isFreeForPlayer(x, y), spawn.x, spawn.y);
        this.pathfinder = new OffPathfinder(map.width, map.height, isWalkable);
        this.lastTile = { x: spawn.x, y: spawn.y };
        this.character = new OffCharacter(this, OFF_NOVICE, offSaveStore.character.look, offEquipmentLook(offSaveStore.character.equipment));
        this.character.wear(offEquipmentLook(offSaveStore.character.equipment), offWeaponTint(offSaveStore.character.equipment));
        this.character.update(this.mover, false, 0);
        this.audio = new AudioSystem(this);
        // Coming back to life: here, on the place's spawn, if this is home; otherwise off to the character's Farm (Off-10C).
        const respawnTile = (): TilePoint | undefined => {
            const homePlace = offHomePlace(offSaveStore.character.faction);
            if (homePlace !== this.placeId) {
                this.travel({ place: homePlace });
                return undefined;
            }
            return findFreeTile((x, y) => this.battle.isFreeForPlayer(x, y), home.x, home.y, OFF_MOVEMENT.clickSearchRadius) ?? home;
        };
        this.battle = new OffBattle(this, this.mover, this.character, this.audio, isWalkable, respawnTile, place.pits, this.arrival.carried, place.raids === true);
        this.battle.findPath = (from, to, maxTiles) => this.pathfinder.find(from, to, maxTiles);
        this.aimArrow = new AimArrow(this);
        this.reticle = new OffAimReticle(this);
        this.leaving = false;
        this.whereSaveMs = 0;
        // Off-7E: saved on arriving, every few seconds, on leaving and when the page is hidden or closed.
        this.saveWhere();
        const onHide = () => {
            if (document.visibilityState === 'hidden') this.saveWhere();
        };
        const onPageHide = () => this.saveWhere();
        document.addEventListener('visibilitychange', onHide);
        window.addEventListener('pagehide', onPageHide);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            // The map is cached for the next visit: the NPCs' tiles are freed.
            for (const talker of this.npcs) talker.npc.destroy(map);
            this.npcs = [];
            this.saveWhere();
            document.removeEventListener('visibilitychange', onHide);
            window.removeEventListener('pagehide', onPageHide);
        });
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
        this.holdStill = false;
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
        // Off-7B: the d-pad drinks potions (left / right), so only the stick walks.
        this.inputSystem.setDpadMoves(false);
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
            for (const key of [OFF_BAG_SCENE_KEY, OFF_STORE_SCENE_KEY, OFF_WAREHOUSE_SCENE_KEY]) this.scene.stop(key);
            this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
            this.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
            this.audio.stopLoop('sfx.footsteps');
            this.scene.stop(OFF_HUD_SCENE_KEY);
        });
        const hud: OffHudSceneData = { worldSceneKey: OFF_WORLD_SCENE_KEY, getState: () => this.hudState() };
        this.scene.launch(OFF_HUD_SCENE_KEY, hud);
        const open = DEBUG_START.offOpen;
        if (open === 'bag' || open === 'stats') this.time.delayedCall(0, () => this.openBag(open));
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
            berserk: battle.berserkLeftMs > 0 ? Math.ceil(battle.berserkLeftMs / 1000) : undefined,
            kills: battle.kills,
            gold: offSaveStore.character.gold,
            critCharges: battle.critStrike.charges,
            critLaunched: battle.critStrike.launched,
            padCross: this.castTrigger && !battle.dead && this.window === undefined ? this.padCrossSlots() : undefined,
        };
    }

    /** Only the map objects near the camera are sorted and drawn (whole cities, Off-5C). */
    private cullMap(): void {
        const camera = this.cameras.main;
        this.mapView.cullAround(this.character.x, this.character.y, camera.width / camera.zoom / 2, camera.height / camera.zoom / 2);
    }

    override update(_time: number, delta: number): void {
        // Off-9C, ?offfast=N: the world runs N steps per frame (to measure long fights with `check offduel*`).
        for (let i = 0; i < DEBUG_START.offFast; i++) {
            this.tick(delta);
            if (this.duel && !this.duel.update(delta)) this.duel = undefined;
        }
    }

    private tick(delta: number): void {
        this.whereSaveMs += delta;
        if (this.whereSaveMs >= OFF_WHERE_SAVE_MS) {
            this.whereSaveMs = 0;
            this.saveWhere();
        }
        const input = this.inputSystem;
        input.update();
        // Read every frame, also under a window (a key pressed there must not act here once it closes).
        // RT held (Off-6C): A/B/X/Y are spells, not attack, pause (B), Character (Y) or Inventory (X).
        const trigger = input.isHeld(Action.OffCastTrigger) || this.debugTrigger;
        this.castTrigger = trigger;
        const padSpell = trigger ? OFF_PAD_SPELL_ACTIONS.findIndex((action) => input.justPressed(action)) : -1;
        const pause = input.justPressed(Action.Pause) || (!trigger && input.justPressed(Action.Back));
        const character = !trigger && input.justPressed(Action.ToggleStats);
        const inventory = !trigger && input.justPressed(Action.OffInventory);
        const toggleRun = input.justPressed(Action.ToggleRun);
        const spellBook = input.justPressed(Action.OffSpellBook);
        const spellKey = OFF_SPELL_KEY_ACTIONS.findIndex((action) => input.justPressed(action));
        const drinkHealth = !trigger && input.justPressed(Action.OffDrinkHealth);
        const drinkMana = !trigger && input.justPressed(Action.OffDrinkMana);
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
                this.openBag();
                return;
            }
            if (spellBook) {
                this.openSpellBook();
                return;
            }
            if (toggleRun) runMode = !runMode;
            if (spellKey >= 0) this.pressSpellKey(spellKey);
            // Off-7B: quick potions (Q / E, d-pad left / right).
            if (drinkHealth && !this.battle.dead) this.battle.drinkQuick('hp');
            if (drinkMana && !this.battle.dead) this.battle.drinkQuick('mana');
            if (padSpell >= 0) this.pressPadSpell(padSpell);
        }
        this.updateNpcs();
        this.updateCombatInput();
        this.updateDebugCast();
        this.updatePadCast();
        this.updateSupportAim();
        this.updateReticle();
        if (!this.battle.dead && this.window !== 'cover') this.steer();
        const running = runMode && this.battle.vitals.canRun;
        // A spell started halfway through a step: the step ends now, not after the cast (no slide once it is over).
        if (this.battle.canMove || (this.mover.isMoving && this.battle.spells.busy)) {
            this.mover.update(delta, running ? OFF_STEP_MS.run : OFF_STEP_MS.walk);
        } else if (this.battle.isHeld && !this.battle.dead) {
            // Off-9A, held (Hold Person / Paralyze): it finishes the tile it was stepping onto and then stands still,
            // whatever you press (the owner, 9-nov-2026: it ran on the spot).
            this.mover.cancel();
            this.mover.update(delta, this.mover.currentStepMs);
        }
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
        if (to.kind === 'teleport') {
            this.askDestination();
            return;
        }
        if (to.kind === 'barracks') {
            this.travel({ place: 'barracks', from: this.placeId, carried: this.carriedVitals() });
            return;
        }
        if (to.kind === 'back') {
            // Without where you came from (Play inside the Barracks), home.
            const back = this.arrival.from ?? offHomePlace(offSaveStore.character.faction);
            const at = OFF_PLACES[back].portals.find((p) => p.to.kind === 'barracks')?.arrival;
            this.travel({ place: back, ...(at ? { at } : {}), carried: this.carriedVitals() });
            return;
        }
        const faction = offSaveStore.character.faction;
        if (faction === to.faction) {
            this.travel({ place: offFarmOf(faction), at: offTeleportArrival(offFarmOf(faction)), carried: this.carriedVitals() });
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
        // Under Equipment or Character the character cannot walk in: nothing to ask.
        if (this.window) return;
        this.stopForWindow();
        this.mover.cancel();
        // Off-13A: the new question window; "No" marked first (joining is for ever), "Yes" in gold.
        const data: Omit<OffDialogSceneData, 'returnTo'> = {
            title: OFF_PLACE_TEXT.joinTitle(faction),
            question: OFF_PLACE_TEXT.joinQuestion(faction),
            warning: OFF_PLACE_TEXT.joinWarning,
            buttons: [
                { label: OFF_DIALOG_TEXT.no, variant: 'normal' },
                {
                    label: OFF_DIALOG_TEXT.yes,
                    variant: 'main',
                    onPress: () => {
                        offSaveStore.joinFaction(faction);
                        // Off-10C: to your new home, the Farm.
                        this.travel({ place: offFarmOf(faction), at: offTeleportArrival(offFarmOf(faction)), carried: this.carriedVitals(), message: OFF_PLACE_TEXT.joined(faction) });
                    },
                },
            ],
            focus: 0,
            cancel: 0,
        };
        openOverlay(this, OFF_DIALOG_SCENE_KEY, data);
    }

    /** A teleport (Off-7A; Off-10C the Farm's too): Select Map, over the world, which waits paused. */
    private askDestination(): void {
        if (this.window) return;
        this.stopForWindow();
        this.mover.cancel();
        const faction = offSaveStore.character.faction;
        const data: Omit<OffMapSelectSceneData, 'returnTo'> = {
            from: this.placeId,
            places: offTeleportDestinations(this.placeId, faction),
            onChoose: (place) => this.travel({ place, at: offArrivalIn(place, faction), carried: this.carriedVitals() }),
        };
        openOverlay(this, OFF_MAP_SELECT_SCENE_KEY, data);
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

    private carriedVitals(): OffCarriedVitals {
        const merc = this.battle.carriedMerc();
        return { hp: this.battle.hp, mana: this.battle.vitals.mana, stamina: this.battle.vitals.stamina, protection: this.battle.protection, berserkLeftMs: this.battle.berserkLeftMs, ...(merc ? { merc } : {}) };
    }

    // ---- William and the mercenary (Off-8B) ----

    /** Each NPC on the walkable tile nearest to its mark (not on a portal or a door). */
    private createNpcs(isWalkable: (x: number, y: number) => boolean): TalkNpc[] {
        const npcs: TalkNpc[] = [];
        for (const spot of this.place.npcs) {
            const tile = findFreeTile((x, y) => isWalkable(x, y) && !this.portalAt(x, y) && !this.doorAt(x, y), spot.near.x, spot.near.y, OFF_MOVEMENT.clickSearchRadius);
            if (!tile) continue;
            const base = TOWN_NPCS[spot.id];
            // William hires mercenaries in Off (his own name and line); the others keep Survivors' name.
            const words = spot.opens === 'mercenaries' ? { name: OFF_MERCENARY_TEXT.npcName, line: OFF_MERCENARY_TEXT.npcLine } : {};
            const def: NpcDef = { ...base, ...words, tile, direction: spot.direction, options: [] };
            npcs.push({ npc: new Npc(this, spot.id, def, this.map), opens: spot.opens });
        }
        return npcs;
    }

    /** Close enough to that NPC to talk (as the town of Survivors). */
    private isNear(talker: TalkNpc): boolean {
        return !this.battle.dead && talker.npc.distanceTo(this.character.x, this.character.y) <= TOWN_TALK.radiusPx;
    }

    /** The nearest NPC close enough to talk to. */
    private nearestNpc(): TalkNpc | undefined {
        let best: TalkNpc | undefined;
        let bestDistance = Infinity;
        for (const talker of this.npcs) {
            const distance = talker.npc.distanceTo(this.character.x, this.character.y);
            if (distance < bestDistance && this.isNear(talker)) {
                best = talker;
                bestDistance = distance;
            }
        }
        return best;
    }

    /** "Talk" over the nearest NPC; a click from afar opens its window on arriving. */
    private updateNpcs(): void {
        if (this.npcs.length === 0) return;
        const near = this.nearestNpc();
        for (const talker of this.npcs) {
            talker.npc.update();
            talker.npc.setTalkable(talker === near && this.window === undefined, this.time.now);
        }
        const pending = this.talkPending;
        if (pending && this.isNear(pending) && !this.mover.isMoving) this.talkTo(pending);
    }

    /** The NPC whose drawing is under that point. */
    private npcAt(px: number, py: number): TalkNpc | undefined {
        return this.npcs.find(({ npc }) => Math.abs(px - npc.x) <= NPC_CLICK.halfWidth && py <= npc.y + NPC_CLICK.below && py >= npc.y - NPC_CLICK.height);
    }

    /** Opens what the NPC offers: William's mercenaries, or the shop's, the blacksmith's or the warehouse's window. */
    private talkTo(talker: TalkNpc): void {
        this.talkPending = undefined;
        if (talker.opens === 'mercenaries') {
            this.openMercenaries();
            return;
        }
        this.mover.cancel();
        this.openBuilding(talker.opens);
    }

    /** William's window over the world, which waits paused. */
    public openMercenaries(): void {
        if (!this.scene.isActive() || this.leaving) return;
        if (this.window) return;
        this.stopForWindow();
        this.mover.cancel();
        this.talkPending = undefined;
        const data: Omit<OffMercenarySceneData, 'returnTo'> = {
            onHire: (id, price) => this.hire(id, price),
            onDismiss: () => this.battle.dismissMercenary(),
        };
        openOverlay(this, OFF_MERCENARY_SCENE_KEY, data);
    }

    /** Its body and gear are downloaded first (they may not be yet), then it appears at your side. */
    private hire(id: OffMercenaryId, price: number): void {
        if (offSaveStore.character.gold < price) {
            this.battle.eventLine(OFF_MERCENARY_TEXT.noGold);
            return;
        }
        const sprites = mercenaryLook(id);
        void lookLoader.ensure(this, sprites).then(() => {
            if (this.scene.isActive() && !this.leaving) this.battle.hireMercenary(id, price);
        });
    }

    /**
     * Who a support spell (Heal, shields) cast with the gamepad goes to: the mercenary while the right stick points
     * at it (within OFF_MERCENARY.aimDegrees and aimRangeTiles), else you.
     */
    private padAlly(): OffSpellAlly | undefined {
        const merc = this.battle.merc;
        const aim = this.inputSystem.getManualAim();
        if (!merc || merc.isDown || !aim) return undefined;
        const from = this.character;
        const tiles = Math.hypot(merc.x - from.x, merc.y - from.y) / TILE_SIZE;
        if (tiles > OFF_MERCENARY.aimRangeTiles) return undefined;
        const wanted = Math.atan2(merc.y - from.y, merc.x - from.x);
        const diff = Math.abs(Phaser.Math.Angle.Wrap(manualAimAngle(aim, from.x, from.y) - wanted));
        return diff <= Phaser.Math.DegToRad(OFF_MERCENARY.aimDegrees) ? this.battle.mercAlly() : undefined;
    }

    /** While a support spell waits: the arrow (stick) and the ring on the mercenary when it will go to it. */
    private updateSupportAim(): void {
        const spells = this.battle.spells;
        const merc = this.battle.merc;
        const support = spells.busy && spells.onSelf && !this.battle.dead;
        const aim = support && this.padCast ? this.inputSystem.getManualAim() : undefined;
        this.aimArrow.update(aim, this.character.x, this.character.y);
        if (!merc) return;
        let aimed = false;
        if (support && this.padCast) aimed = this.padAlly() !== undefined;
        else if (support) {
            const pointer = this.input.activePointer;
            const world = this.tileUnder(pointer);
            aimed = !pointer.wasTouch && this.battle.mercAt(world.px, world.py) !== undefined;
        }
        merc.setAimed(aimed);
    }

    /** Off to another place through its loading screen. */
    private travel(data: OffWorldSceneData): void {
        if (this.leaving) return;
        // Off-7E: the next place right away, so closing the page while it loads doesn't leave it on the portal.
        offSaveStore.setWhere(data.at ? { place: data.place, x: data.at.x, y: data.at.y } : { place: data.place });
        this.leaving = true;
        this.stopForWindow();
        startOffWorld(this, data);
    }

    /**
     * Off-7E: remembers this place and tile for Play. Dead, its home (the Farm) instead (it comes back to life there). Nothing
     * while leaving: travel() already saved the next place.
     */
    private saveWhere(): void {
        if (this.leaving || !this.battle) return;
        if (this.battle.dead) {
            offSaveStore.setWhere({ place: offHomePlace(offSaveStore.character.faction) });
            return;
        }
        offSaveStore.setWhere({ place: this.placeId, x: this.mover.nextTileX, y: this.mover.nextTileY });
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
        // Off-13B: Off's own pause (OffPauseScene), no longer Survivors' PauseScene.
        const data: OffPauseSceneData = { worldSceneKey: OFF_WORLD_SCENE_KEY, returnTo: OFF_HUD_SCENE_KEY, quitTo: 'OffHome' };
        this.scene.pause();
        this.scene.pause(OFF_HUD_SCENE_KEY);
        this.scene.launch(OFF_PAUSE_SCENE_KEY, data);
        this.scene.bringToTop(OFF_PAUSE_SCENE_KEY);
    }

    /** C / Y: the character window on its Stats tab (Off-12C; before, Survivors' Character window in its Off mode). */
    public openCharacter(): void {
        this.openBag('stats');
    }

    /** B: the character window on its Magic tab (Off-12C; before, the spell book), or Bag with no spells known. */
    public openSpellBook(): void {
        this.openBag(offSaveStore.character.spells.length > 0 ? 'magic' : 'bag');
    }

    /** The character window (Off-12B) on that tab over the world, which goes on; the HUD hides while it is open. */
    public openBag(tab: OffCharacterTab = 'bag'): void {
        if (!this.scene.isActive() || this.window) return;
        this.coverWorld();
        const data: OffBagSceneData = {
            battle: this.battle,
            tab,
            onGearChange: () => this.dressCharacter(),
            onClose: () => {
                this.uncoverWorld();
                this.dressCharacter();
            },
        };
        this.scene.launch(OFF_BAG_SCENE_KEY, data);
    }

    /** What the character wears now, on the sprite (items not downloaded yet appear when they arrive). */
    private dressCharacter(): void {
        this.character.wear(offEquipmentLook(offSaveStore.character.equipment), offWeaponTint(offSaveStore.character.equipment));
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
        this.holdStillIfCasting();
    }

    /** RT + A/B/X/Y (Off-6C): prepares the spell of key 1–4 (Off-12C); it is cast by itself once ready (updatePadCast). */
    private pressPadSpell(index: number): void {
        const id = offSaveStore.character.spellKeys[index];
        if (this.battle.dead || id === undefined) return;
        this.stopForSpell();
        this.padCast = this.battle.spells.pressSpell(id);
        this.holdStillIfCasting();
    }

    /** A spell started: the character stops where it is, and the stick or keys still held don't move it (holdStill). */
    private holdStillIfCasting(): void {
        if (!this.battle.spells.busy) return;
        this.mover.cancel();
        this.holdStill = true;
    }

    private stopForSpell(): void {
        this.leftHeld = false;
        this.mouseAttack = false;
        this.debugHold = false;
        this.battle.stopAttacking();
    }

    /** The four gamepad spells for the cross shown while RT is held (A, B, X, Y). */
    private padCrossSlots(): { name: string | undefined; usable: boolean }[] {
        const battle = this.battle;
        return [0, 1, 2, 3].map((index) => {
            const id = offSaveStore.character.spellKeys[index];
            if (id === undefined) return { name: undefined, usable: false };
            const def = OFF_SPELLS[id];
            return { name: def.name, usable: battle.vitals.mana >= battle.manaCost(def) };
        });
    }

    /**
     * Where the right stick aims a gamepad spell (9-nov-2026): that way from you, nearer or farther with how far it
     * is pushed (OFF_PAD_AIM), inside the screen; on a living monster when one is close to that spot. Undefined
     * without the stick.
     */
    private padAimPoint(): { x: number; y: number; monster: OffMonster | undefined } | undefined {
        const aim = this.inputSystem.getManualAim();
        if (!aim) return undefined;
        const from = this.character;
        const tiles = OFF_PAD_AIM.minTiles + (OFF_PAD_AIM.maxTiles - OFF_PAD_AIM.minTiles) * aim.strength;
        const view = this.cameras.main.worldView;
        const margin = OFF_PAD_AIM.screenMarginPx;
        const x = Phaser.Math.Clamp(from.x + aim.dirX * tiles * TILE_SIZE, view.left + margin, view.right - margin);
        const y = Phaser.Math.Clamp(from.y + aim.dirY * tiles * TILE_SIZE, view.top + margin, view.bottom - margin);
        let monster: OffMonster | undefined;
        let best = OFF_PAD_AIM.snapTiles * TILE_SIZE;
        for (const m of this.battle.pits.monsters) {
            if (!m.isAlive) continue;
            const distance = Math.hypot(m.x - x, m.y - y);
            if (distance <= best) {
                best = distance;
                monster = m;
            }
        }
        return { x, y, monster };
    }

    /** The mark on the ground while RT is held or a gamepad spell waits, and the right stick aims (not Heal or shields). */
    private updateReticle(): void {
        const spells = this.battle.spells;
        const waiting = this.padCast && spells.busy && !spells.onSelf;
        const choosing = this.castTrigger && !spells.busy;
        const point = (waiting || choosing) && !this.battle.dead && this.window !== 'cover' ? this.padAimPoint() : undefined;
        this.reticle.update(point && { x: point.monster?.x ?? point.x, y: point.monster?.y ?? point.y, onMonster: point.monster !== undefined });
    }

    /**
     * A gamepad spell, as soon as it is ready (9-nov-2026: RT may still be held): where the right stick aims, else at
     * the marked monster, else the nearest (Heal and shields: on you, or the mercenary the stick points at).
     */
    private updatePadCast(): void {
        const spells = this.battle.spells;
        if (!this.padCast) return;
        if (!spells.busy) {
            this.padCast = false;
            return;
        }
        if (spells.state !== 'ready') return;
        this.padCast = false;
        if (spells.onSelf) {
            spells.release(this.character.x, this.character.y, undefined, this.padAlly());
            return;
        }
        const aimed = this.padAimPoint();
        if (aimed) {
            const tiles = (v: number) => Math.round((v / TILE_SIZE) * 10) / 10;
            this.lastPadRelease = `${tiles(aimed.x - this.character.x)},${tiles(aimed.y - this.character.y)} ${aimed.monster?.id ?? 'ground'}`;
            if (aimed.monster) this.battle.target = aimed.monster;
            spells.release(aimed.x, aimed.y, aimed.monster);
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

    /** Development (`check offmerc`): the mercenary falls unconscious now; with `standInMs`, it stands up that soon. */
    public debugMercDown(standInMs?: number): void {
        const merc = this.battle.merc;
        if (!merc) return;
        merc.fall();
        if (standInMs !== undefined) merc.downLeftMs = standInMs;
    }

    /** Development (`check offmercloot`, Off-8C): some loot falls `dx`, `dy` tiles from you, as from a monster. */
    public debugDropLoot(dx: number, dy: number, gold: number, item?: string): void {
        const x = this.mover.tileX + dx;
        const y = this.mover.tileY + dy;
        if (gold > 0) this.battle.ground.drop({ gold }, x, y);
        if (item === undefined) return;
        if (isOffGearKey(item)) this.battle.ground.drop({ item }, x, y);
        else if (isOffGoodId(item)) this.battle.ground.drop({ item }, x, y);
    }

    /** Development (`check offmercdropped`, Off-8C): drops that bag cell on your tile, as the inventory's Drop. */
    public debugDropBag(index: number): void {
        this.battle.dropBagItem(index);
    }

    /** Development (`check offmercparalyze`): drinks the biggest potion of that kind (as Q / E). */
    public debugDrink(what: 'hp' | 'mana'): void {
        this.battle.drinkQuick(what);
    }

    /** Development (`check offberserk`, Off-8C): Berserk ends now (to compare blows without it). */
    public debugEndBerserk(): void {
        this.battle.berserkLeftMs = Math.min(this.battle.berserkLeftMs, 1);
    }

    /** Development (`check offberserk`, `offholdblows`): puts on that weapon from the bag ('' takes it off; spells need empty hands). */
    public debugWield(weapon: string): string {
        if (weapon !== '' && !isOffGearKey(weapon)) return 'none';
        // '' takes the weapon off (back to the bag), to cast again.
        const result = offSaveStore.equip('weapon', weapon === '' ? undefined : weapon);
        this.dressCharacter();
        return result;
    }

    /**
     * Development (`check offmercbehind`, Off-8D): Paralyze (as the spell, its own time) on the monster the mercenary
     * fights, or else the nearest one. Returns the monster's tile and where it looks.
     */
    public debugParalyze(): string | undefined {
        const merc = this.battle.merc;
        const monster = merc?.target?.isAlive ? merc.target : this.battle.pits.monsters
            .filter((m) => m.isAlive)
            .sort((a, b) => Math.hypot(a.x - this.character.x, a.y - this.character.y) - Math.hypot(b.x - this.character.x, b.y - this.character.y))[0];
        if (!monster) return undefined;
        const def = OFF_SPELLS.paralyze;
        monster.hold((def.durationSec ?? 0) * 1000, def.power ?? 0);
        return `${monster.id} at ${monster.mover.tileX},${monster.mover.tileY} facing ${monster.mover.facing}`;
    }

    /** Development (`check offmercheal`): the mercenary loses health down to `hp`. */
    public debugMercHp(hp: number): void {
        const merc = this.battle.merc;
        if (merc) merc.hp = Math.max(1, Math.min(merc.maxHp, hp));
    }

    /** Development (`check offmercaim`): the right stick points towards the mercenary (or `undefined` lets it go). */
    public debugAimAtMerc(on: boolean): void {
        const merc = this.battle.merc;
        this.inputSystem.setForcedAim(on && merc ? { x: merc.x - this.character.x, y: merc.y - this.character.y } : undefined);
    }

    /**
     * Development (`check offpadaim`): the right stick pushed towards (x, y) by `strength` (0..1), or let go with
     * undefined.
     */
    public debugPadAim(x: number | undefined, y = 0, strength = 1): void {
        this.inputSystem.setForcedAim(x === undefined ? undefined : { x, y, strength });
    }

    /** Development (`check offcastrun`): the left stick held towards (x, y), or let go with undefined. */
    public debugStick(x: number | undefined, y = 0): void {
        this.debugMove = x === undefined ? undefined : { x, y };
    }

    /** Development (`check offpadaim` / `offpadcross`): the mark, the cross and the last gamepad spell. */
    public debugPadState(): { tile: TilePoint; trigger: boolean; spell: string; reticle: string | undefined; cross: string[] | undefined; lastRelease: string | undefined } {
        const point = this.padAimPoint();
        const tiles = (v: number) => Math.round((v / TILE_SIZE) * 10) / 10;
        const cross = this.hudState().padCross;
        return {
            tile: { x: this.mover.tileX, y: this.mover.tileY },
            trigger: this.castTrigger,
            spell: `${this.battle.spells.spell ?? '-'} ${this.battle.spells.state}`,
            reticle: point ? `${tiles(point.x - this.character.x)},${tiles(point.y - this.character.y)} ${point.monster?.id ?? 'ground'}` : undefined,
            cross: cross?.map((slot) => `${slot.name ?? '-'}${slot.usable ? '' : ' (dim)'}`),
            lastRelease: this.lastPadRelease,
        };
    }

    /** Development (`check offpadcross`): RT counts as held (true) or not, as if the trigger were pressed. */
    public debugCastTrigger(on: boolean): void {
        this.debugTrigger = on;
    }

    /** Development (`check offpadcast`): RT + that button (0 A … 3 Y): cast when ready. */
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
        spell: string; casts: number; fails: number; interrupts: number; prepareMs: number; burning: number; slowed: number; wounded: number;
        held: number; poisoned: number; shield: string | undefined; padSpells: string[];
        merc: string | undefined; mercKills: number; mercDown: number; mercShield: string | undefined; onMerc: number; hirer: TilePoint | undefined; npcs: { id: string; opens: string; x: number; y: number }[];
        mercPicked: number; mercTarget: string | undefined; mercLoot: string | undefined; berserk: number; mercBerserk: number; mercMana: string | undefined; mercCasts: Record<string, number>; mercSaid: Record<string, number>; mercSaying: string | undefined; mercPotion: number; mercDrunk: number; mercFleeing: boolean; mercFlees: number; mercBatch: number; mercBehind: number; blowAvg: { plain: number; berserk: number };
        raiders: ReturnType<OffBattle['debugRaiders']>; raids: OffBattle['raidTally']; raidIn: number; heldMs: number; heldTimes: number;
    } {
        const monsters: Record<string, number> = {};
        for (const monster of this.battle.pits.monsters) {
            if (monster.isAlive) monsters[monster.id] = (monsters[monster.id] ?? 0) + 1;
        }
        const target = this.battle.target;
        const merc = this.battle.merc;
        return {
            merc: merc ? `${merc.id} lvl ${merc.level} ${merc.hp}/${merc.maxHp} at ${merc.mover.tileX},${merc.mover.tileY} ${merc.weapon.name}` : undefined,
            mercKills: merc?.kills ?? 0,
            mercDown: merc ? Math.ceil(merc.downLeftMs / 1000) : 0,
            mercShield: merc?.protection ? merc.protection.spell : undefined,
            mercPicked: merc?.picked ?? 0,
            mercTarget: merc?.target ? `${merc.target.kind === 'person' ? `raider ${merc.target.def.name}` : `${merc.target.id} ${merc.target.mode}`} at ${merc.target.mover.tileX},${merc.target.mover.tileY}` : undefined,
            mercLoot: merc?.lootTile ? `${merc.lootTile.x},${merc.lootTile.y}` : undefined,
            berserk: Math.ceil(this.battle.berserkLeftMs / 1000),
            mercBerserk: merc ? Math.ceil(merc.berserkLeftMs / 1000) : 0,
            mercMana: merc?.isCaster ? `${merc.mana}/${merc.maxMana}` : undefined,
            mercCasts: { ...(merc?.castCount ?? {}) },
            mercSaid: { ...(merc?.saidCount ?? {}) },
            mercSaying: merc?.saying,
            mercBehind: merc?.behindBlows ?? 0,
            mercPotion: merc ? Math.ceil(merc.potionLeftMs / 1000) : 0,
            mercDrunk: merc?.potionsDrunk ?? 0,
            mercFleeing: merc?.fleeing ?? false,
            mercFlees: merc?.flees ?? 0,
            mercBatch: merc?.batchGained ?? 0,
            blowAvg: {
                plain: Math.round(this.battle.debugBlows.plain.sum / Math.max(1, this.battle.debugBlows.plain.count) * 10) / 10,
                berserk: Math.round(this.battle.debugBlows.berserk.sum / Math.max(1, this.battle.debugBlows.berserk.count) * 10) / 10,
            },
            onMerc: this.battle.pits.monsters.filter((m) => m.isAlive && m.mode === 'attack' && m.victim === 'merc').length,
            hirer: hirerTile(this.npcs),
            npcs: this.npcs.map(({ npc, opens }) => ({ id: npc.id, opens, ...npc.def.tile })),
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
            target: target ? `${target.kind === 'person' ? `raider ${target.def.name}` : target.id} ${target.hp}/${target.maxHp} at ${target.mover.tileX},${target.mover.tileY}` : undefined,
            // Off-9A: the Raiders here, what raids have brought, and the seconds to the next roll.
            raiders: this.battle.debugRaiders(),
            raids: { ...this.battle.raidTally },
            raidIn: Math.ceil((OFF_RAIDS.everyMs - this.battle.raidClockMs) / 1000),
            heldMs: this.battle.heldLeftMs,
            heldTimes: this.battle.heldTimes,
            weapon: this.battle.weapon.name,
            attackMs: offAttackMs(this.battle.weapon, this.battle.stats.str),
            defense: this.battle.defense,
            gold: offSaveStore.character.gold,
            bag: [...offSaveStore.character.bag],
            spell: `${this.battle.spells.state}${this.battle.spells.spell ? ` ${this.battle.spells.spell}` : ''}`,
            casts: this.battle.spells.casts,
            fails: this.battle.spells.fails,
            interrupts: this.battle.spells.interrupts,
            prepareMs: this.battle.spells.prepareMs,
            burning: this.battle.pits.monsters.filter((m) => m.isAlive && m.isBurning).length,
            slowed: this.battle.pits.monsters.filter((m) => m.isAlive && m.isSlowed).length,
            // Off-11B: monsters alive and hurt (how many a spell reached).
            wounded: this.battle.pits.monsters.filter((m) => m.isAlive && m.hp < m.maxHp).length,
            held: this.battle.pits.monsters.filter((m) => m.isAlive && m.isHeld).length,
            poisoned: this.battle.pits.monsters.filter((m) => m.isAlive && m.isPoisoned).length,
            shield: this.battle.protection ? `${this.battle.protection.spell} ${Math.ceil(this.battle.protection.leftMs / 1000)}s` : undefined,
            padSpells: offSaveStore.character.spellKeys.slice(0, OFF_PAD_SPELL_COUNT).map((k) => k ?? '-'),
            ground: this.battle.ground.items.map((g) => `${'gold' in g.content ? `${g.content.gold} gold` : g.content.item} at ${g.tileX},${g.tileY}`),
        };
    }

    /**
     * Development (`check offlootlevel`, Off-7B): rolls `count` valuable drops of that monster and counts the items and
     * the attributes (first and second) that came out.
     */
    public debugRollLoot(monster: string, count: number): { items: Record<string, number>; first: Record<string, number>; second: Record<string, number>; withSecond: number } {
        const out = { items: {} as Record<string, number>, first: {} as Record<string, number>, second: {} as Record<string, number>, withSecond: 0 };
        if (!isOffMonsterId(monster)) return out;
        const add = (into: Record<string, number>, key: string) => { into[key] = (into[key] ?? 0) + 1; };
        for (let i = 0; i < count; i++) {
            for (const key of rollKillLoot(monster, 'valuable').items) {
                if (!isOffGearKey(key)) continue;
                add(out.items, offGearId(key));
                const rolls = offGearRolls(key);
                if (rolls.primary) add(out.first, `${rolls.primary}${rolls.primaryValue ?? ''}`);
                if (rolls.secondary) {
                    add(out.second, rolls.secondary);
                    out.withSecond++;
                }
            }
        }
        return out;
    }

    /**
     * Development (`check offfarm`, Off-7D): hunts that kind of monster for `seconds`, drinking the biggest health
     * potion carried when health falls under `drinkBelow` (share of the maximum). Stops at the first death. Gives the
     * totals and the rates per minute: kills, experience, gold and items dropped (picked up or not), damage taken.
     */
    public debugFarm(id: string, seconds: number, drinkBelow: number): Promise<Record<string, number | boolean>> {
        const battle = this.battle;
        const before = { ...battle.tally, kills: battle.kills, level: battle.level };
        const start = performance.now();
        return new Promise((resolve) => {
            const tick = window.setInterval(() => {
                const elapsed = (performance.now() - start) / 1000;
                if (!battle.dead && battle.hp < battle.maxHp * drinkBelow) battle.drinkQuick('hp');
                if (!battle.dead && !battle.target) this.debugFight(id);
                if (!battle.dead && elapsed < seconds) return;
                window.clearInterval(tick);
                const perMinute = (value: number): number => Math.round((value / elapsed) * 60);
                const t = battle.tally;
                resolve({
                    seconds: Math.round(elapsed),
                    died: battle.dead,
                    levelFrom: before.level,
                    levelTo: battle.level,
                    kills: battle.kills - before.kills,
                    killsPerMin: Math.round(((battle.kills - before.kills) / elapsed) * 600) / 10,
                    expPerMin: perMinute(t.exp - before.exp),
                    goldPerMin: perMinute(t.gold - before.gold),
                    potionsPerMin: Math.round(((t.potions - before.potions) / elapsed) * 600) / 10,
                    valuablesPerMin: Math.round(((t.valuables - before.valuables) / elapsed) * 600) / 10,
                    hurtPerMin: perMinute(t.hurt - before.hurt),
                    absorbedPerMin: perMinute(t.absorbed - before.absorbed),
                    hitsTaken: t.hits - before.hits,
                    drunk: t.drunk - before.drunk,
                    hpLeft: battle.hp,
                    maxHp: battle.maxHp,
                });
            }, 100);
        });
    }

    /**
     * Development (`check offduel*`, Off-9C): `fights` fights in a row against that raid (OffDuel), in game time; the
     * report when they are over.
     */
    public debugDuel(kind: OffDuelKind, fights: number, invisible = false, drinkBelow = 0.4, maxSeconds = 150, maxRealMs = 600_000): Promise<OffDuelReport> {
        return new Promise((resolve) => {
            const duel = new OffDuel({ battle: this.battle, fightRaider: () => this.debugFightRaider(), place: () => this.placeId }, { kind, invisible, fights, drinkBelow, maxSeconds }, resolve);
            this.duel = duel;
            // Stuck (a tab in the background, a raid with nowhere to come from): what it has so far.
            window.setTimeout(() => {
                if (this.duel !== duel) return;
                this.duel = undefined;
                resolve(duel.report());
            }, maxRealMs);
        });
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

    /** Development (`check offraid...`, Off-9A): attacks the nearest Raider, holding the button. */
    public debugFightRaider(): void {
        const near = [...this.battle.raiders]
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
        const crit = input.justPressed(Action.OffCritStrike);
        const next = input.justPressed(Action.OffNextTarget);
        const previous = input.justPressed(Action.OffPrevTarget);
        const talker = keys && attack ? this.nearestNpc() : undefined;
        if (talker) {
            this.talkTo(talker);
        } else if (keys && attack) {
            battle.spells.cancel();
            battle.attackPressed();
        }
        if (keys && crit) {
            battle.spells.cancel();
            battle.critPressed();
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
        const move = this.debugMove ?? this.inputSystem.getMove();
        const direction = directionFromVector(move.x, move.y);
        if (direction === undefined) {
            if (this.steering) this.mover.cancel();
            this.steering = false;
            this.holdStill = false;
            return;
        }
        if (this.holdStill) return;
        this.steering = true;
        this.debugHold = false;
        this.talkPending = undefined;
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
        // Off-8B: Heal and shields clicked on the mercenary go to it.
        const ally = this.battle.spells.onSelf && this.battle.mercAt(tile.px, tile.py) ? this.battle.mercAlly() : undefined;
        // A spell prepared or ready takes the click (Off-6B).
        if (this.battle.spells.release(tile.px, tile.py, monster, ally)) {
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
        // Off-8B: a click on an NPC talks to it (walking up to it first when far).
        this.talkPending = undefined;
        const clicked = this.window === undefined ? this.npcAt(tile.px, tile.py) : undefined;
        if (clicked) {
            this.leftHeld = false;
            if (this.isNear(clicked)) this.talkTo(clicked);
            else {
                this.talkPending = clicked;
                this.clickTile(clicked.npc.def.tile.x, clicked.npc.def.tile.y);
            }
            return;
        }
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

    /**
     * A click on a tile: there, or to the nearest free tile when it is blocked. Off-7E: by the way round houses and
     * walls when there is one; straight on, as the original, when there is none.
     */
    private clickTile(x: number, y: number): void {
        const free = findFreeTile((tx, ty) => this.battle.isFreeForPlayer(tx, ty), x, y, OFF_MOVEMENT.clickSearchRadius);
        if (!free) return;
        // Round portals and doors on the way, except the one clicked and the one it stands in.
        const from = { x: this.mover.nextTileX, y: this.mover.nextTileY };
        const keep = [this.portalAt(free.x, free.y), this.doorAt(free.x, free.y), this.portalAt(from.x, from.y), this.doorAt(from.x, from.y)];
        const avoid = (tx: number, ty: number) => {
            const spot = this.portalAt(tx, ty) ?? this.doorAt(tx, ty);
            return spot !== undefined && !keep.includes(spot);
        };
        const path = this.pathfinder.find(from, free, OFF_MOVEMENT.pathMaxTiles, avoid);
        if (path && path.length > 0) this.mover.goAlong(path);
        else this.mover.goTo(free.x, free.y);
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

/** Off-8B: the box around an NPC's feet that a click on it hits (px). */
const NPC_CLICK = { halfWidth: 16, height: 80, below: 6 } as const;

/** An NPC of the place and what talking to it opens (Off-10A). */
interface TalkNpc {
    npc: Npc;
    opens: OffNpcOpens;
}

/** William's tile (`check offmerchire`). */
function hirerTile(npcs: readonly TalkNpc[]): TilePoint | undefined {
    const william = npcs.find((t) => t.opens === 'mercenaries');
    return william ? { ...william.npc.def.tile } : undefined;
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

