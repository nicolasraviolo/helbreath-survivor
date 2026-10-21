// La ciudad (Fase 23): un recorte de la granja de Elvine (data/town.ts) donde se anda libremente con teclado, mando o
// joystick táctil. No hay monstruos, ni XP, ni armas: el personaje va vestido con su equipo, nada más.
// Se llega tras elegir personaje (o "New Run") y al pulsar "Town" en la pantalla final. Pisar el teleport abre
// Select Map por encima, con la ciudad en pausa debajo: "Back" la reanuda al momento, sin volver a cargarla.
// Esc / Start abre la pausa de siempre (Settings, How to Play, Quit to menu).
// Los NPCs, hablar y el Cofre llegan en el bloque 23B.
import Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import { CAMERA_LERP, DEPTH_DEBUG, GAME_HEIGHT, MAP_OBJECT_MARGIN_TILES, TILE_SIZE } from '../config/gameConfig';
import { TOUCH_JOYSTICK } from '../config/touch';
import { DEFAULT_LOOKS } from '../data/appearance';
import { FOOTSTEP_DUST_EVERY_PX, FOOTSTEPS_PER_RUN_CYCLE } from '../data/audio';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId, type CharacterId } from '../data/characters';
import type { ItemAttribute } from '../data/attributes';
import { isArmorPieceId, isMeleeWeaponId, START_EQUIPMENT, type SavedEquipment } from '../data/items';
import { MINIMAP } from '../data/minimap';
import { TOWN } from '../data/town';
import { isWandId } from '../data/wands';
import { Effect } from '../entities/Effect';
import { Equipment } from '../entities/Equipment';
import { Player } from '../entities/Player';
import { Portal } from '../entities/Portal';
import { getMap } from '../hb/HBMap';
import { MapView } from '../hb/mapRenderer';
import { PLAYER_FRAMES_PER_DIRECTION } from '../hb/playerAppearance';
import { AudioSystem } from '../systems/AudioSystem';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { SETTINGS_CHANGED, settings } from '../systems/Settings';
import { Minimap } from '../ui/Minimap';
import { addTouchPauseButton } from '../ui/TouchPauseButton';
import { TouchJoystick } from '../ui/TouchJoystick';
import { Pool } from '../utils/Pool';
import { openOverlay } from './MenuOverlayScene';
import type { MapSelectSceneData } from './MapSelectScene';
import type { PauseSceneData } from './PauseScene';

export const TOWN_SCENE_KEY = 'Town';

/** ?town=portal only places the character on the teleport the first time the town opens. */
let debugPortalUsed = false;

export class TownScene extends Phaser.Scene {
    private player!: Player;
    private mapView!: MapView;
    private inputSystem!: InputSystem;
    private joystick: TouchJoystick | undefined;
    private audio!: AudioSystem;
    private portal!: Portal;
    private minimap!: Minimap;
    private dust!: Pool<Effect>;
    /** The player is standing on the teleport: it opens Select Map once, until they step off. */
    private onPortal = false;
    private lastX = 0;
    private lastY = 0;
    private dustDistance = 0;

    constructor() {
        super(TOWN_SCENE_KEY);
    }

    create(): void {
        const map = getMap(this, TOWN.asset);
        const area = TOWN.playArea;
        const margin = MAP_OBJECT_MARGIN_TILES;
        this.mapView = new MapView(this, map, area, {
            x: area.x - margin, y: area.y - margin, width: area.width + margin * 2, height: area.height + margin * 2,
        });
        const areaPx = new Phaser.Geom.Rectangle(area.x * TILE_SIZE, area.y * TILE_SIZE, area.width * TILE_SIZE, area.height * TILE_SIZE);

        // The character chosen in Select Character (debug ?open=town: the first saved one, or the class's look).
        const uid: unknown = this.registry.get(ACTIVE_CHARACTER_KEY);
        const saved = characterStore.byUid(typeof uid === 'string' ? uid : undefined);
        const chosen: unknown = this.registry.get(CHOSEN_CHARACTER_KEY);
        const classId: CharacterId = saved?.classId ?? (isCharacterId(chosen) ? chosen : DEFAULT_CHARACTER);
        const character = CHARACTERS[classId];
        const spawn = DEBUG_START.townPortal && !debugPortalUsed ? TOWN.portal : TOWN.spawn;
        debugPortalUsed = true;
        this.player = new Player(this, (spawn.x + 0.5) * TILE_SIZE, (spawn.y + 0.5) * TILE_SIZE, character, saved?.look ?? DEFAULT_LOOKS[classId], map, areaPx);
        this.player.setHealthBarVisible(false);
        this.dress(classId, saved?.equipment ?? START_EQUIPMENT[classId], saved?.attributes.weapon);
        this.lastX = this.player.x;
        this.lastY = this.player.y;
        this.dustDistance = 0;
        this.onPortal = false;

        const camera = this.cameras.main;
        camera.setBounds(areaPx.x, areaPx.y, areaPx.width, areaPx.height);
        camera.startFollow(this.player.container, true, CAMERA_LERP, CAMERA_LERP);
        camera.centerOn(this.player.x, this.player.y);

        this.portal = new Portal(this, (TOWN.portal.x + 0.5) * TILE_SIZE, (TOWN.portal.y + 0.5) * TILE_SIZE, Number.POSITIVE_INFINITY);
        this.dust = new Pool(() => new Effect(this));
        this.audio = new AudioSystem(this);
        new MusicSystem(this).play(TOWN.music);

        this.minimap = new Minimap(this, { key: TOWN.minimap, mapWidth: TOWN.size.width, mapHeight: TOWN.size.height, playArea: area }, DEPTH_DEBUG - 1);
        this.minimap.setVisible(settings.current.showMinimap);

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerAnchor(() => this.player);
        this.joystick = undefined;
        if (this.sys.game.device.input.touch) {
            this.joystick = new TouchJoystick(this, GAME_HEIGHT, DEPTH_DEBUG - 2, TOUCH_JOYSTICK);
            this.inputSystem.setTouchJoystick(this.joystick);
            // No Esc on a phone: the same "II" button as in the run, with the minimap below it.
            addTouchPauseButton(this, DEPTH_DEBUG - 1, () => this.openPause());
            this.minimap.setTop(MINIMAP.topUnderButtons);
        }
        this.mapView.setTreeMode(DEBUG_START.trees ?? settings.current.largeTrees);
        const onSettings = () => {
            this.mapView.setTreeMode(settings.current.largeTrees);
            this.minimap.setVisible(settings.current.showMinimap);
        };
        settings.on(SETTINGS_CHANGED, onSettings);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            settings.off(SETTINGS_CHANGED, onSettings);
            this.audio.stopLoop('sfx.footsteps');
        });
        // Coming back from Select Map or the pause: no footsteps left running from before.
        this.events.on(Phaser.Scenes.Events.PAUSE, () => this.audio.stopLoop('sfx.footsteps'));
    }

    override update(_time: number, delta: number): void {
        const input = this.inputSystem;
        input.update();
        if (input.justPressed(Action.Pause)) {
            this.openPause();
            return;
        }
        const player = this.player;
        const move = input.getMove();
        player.update(move, delta);
        this.updateFootsteps(move.lengthSq() > 0);
        this.mapView.updateFading(player.y, player.getVisualBounds());
        this.minimap.update({ player, bosses: [], totems: [], loot: [] }, this.time.now);
        for (const effect of [...this.dust.active]) {
            if (!effect.update()) this.dust.release(effect);
        }
        this.updatePortal();
    }

    private openPause(): void {
        if (!this.scene.isActive()) return;
        const data: PauseSceneData = { gameSceneKey: this.scene.key };
        openOverlay(this, 'Pause', data);
    }

    /** What the character wears, as in the run (GameScene): armour, and the weapon or wand in hand. */
    private dress(classId: CharacterId, equipment: Readonly<SavedEquipment>, attribute: ItemAttribute | undefined): void {
        const character = CHARACTERS[classId];
        const worn = new Equipment(character);
        const weapon = equipment.weapon;
        if (character.startWeapon.kind === 'melee') worn.weapon = weapon !== undefined && isMeleeWeaponId(weapon) ? weapon : character.startWeapon.id;
        else if (weapon !== undefined && isWandId(weapon)) worn.wand = weapon;
        worn.weaponAttribute = attribute;
        this.player.setGear('weapon', worn.weaponLayer());
        for (const id of Object.values(equipment)) {
            if (id !== undefined && isArmorPieceId(id)) for (const [slot, layer] of worn.wear(id)) this.player.setGear(slot, layer);
        }
    }

    /** Stepping on the teleport opens Select Map over the town (which waits underneath, paused). */
    private updatePortal(): void {
        const inside = this.portal.contains(this.player.x, this.player.y);
        if (inside && !this.onPortal) {
            const data: MapSelectSceneData = { fromTown: true };
            this.scene.pause();
            this.scene.launch('MapSelect', data);
            this.scene.bringToTop('MapSelect');
        }
        this.onPortal = inside;
    }

    /** Running: footsteps in a loop at the pace of the run animation, and a puff of dust every tile (as in the run). */
    private updateFootsteps(running: boolean): void {
        const player = this.player;
        const moved = Math.hypot(player.x - this.lastX, player.y - this.lastY);
        this.lastX = player.x;
        this.lastY = player.y;
        if (!running || moved === 0) {
            this.audio.stopLoop('sfx.footsteps');
            return;
        }
        const runCycleMs = (PLAYER_FRAMES_PER_DIRECTION / player.def.runFrameRate) * 1000;
        this.audio.startLoop('sfx.footsteps', runCycleMs / FOOTSTEPS_PER_RUN_CYCLE);
        this.dustDistance += moved;
        if (this.dustDistance >= FOOTSTEP_DUST_EVERY_PX) {
            this.dustDistance = 0;
            this.dust.acquire().play('fx.footsteps', player.x, player.y);
        }
    }
}
