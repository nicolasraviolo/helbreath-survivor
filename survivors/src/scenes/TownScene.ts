// La ciudad (Fase 23): un recorte de la granja de Elvine (data/town.ts) donde se anda libremente con teclado, mando o
// joystick táctil. No hay monstruos, ni XP, ni armas: el personaje va vestido con su equipo, nada más.
// Se llega tras elegir personaje (o "New Run") y al pulsar "Town" en la pantalla final. Pisar el teleport abre
// Select Map por encima, con la ciudad en pausa debajo: "Back" la reanuda al momento, sin volver a cargarla.
// Esc / Start abre la pausa de siempre (Settings, How to Play, Quit to menu).
// NPCs (Fase 23B): quietos en los sitios de data/town.ts. Al acercarse sale "Talk" encima del nombre; E, el botón A
// del mando, un clic en el NPC o el botón táctil "Talk" abren su panel (NpcDialogScene) con la ciudad en pausa debajo.
// Al volver de Equipment, el personaje se viste con lo que lleve ahora.
// Sin ir a Howard (24-oct-2026, propietario): I abre Equipment y C (o Y del mando) la ventana Character, para repartir
// los puntos; las dos también en la pausa. Con puntos sin repartir sale "Level Up" abajo a la derecha (ui/LevelUpNotice).
import Phaser from 'phaser';
import { zoomWorldCamera } from '../ui/renderScale';
import { DEBUG_START } from '../config/debugStart';
import { MENU_INPUT_DELAY_MS } from '../config/menus';
import { CAMERA_LERP, DEPTH_DEBUG, GAME_HEIGHT, MAP_OBJECT_MARGIN_TILES, TILE_SIZE } from '../config/gameConfig';
import { onTouchFullscreenButton, TOUCH_FULLSCREEN_BUTTON, TOUCH_JOYSTICK } from '../config/touch';
import { DEFAULT_LOOKS } from '../data/appearance';
import { FOOTSTEP_DUST_EVERY_PX, FOOTSTEPS_PER_RUN_CYCLE } from '../data/audio';
import type { Appearance } from '../hb/playerAppearance';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId, type CharacterId } from '../data/characters';
import type { ItemAttribute } from '../data/attributes';
import { isArmorPieceId, isMeleeWeaponId, START_EQUIPMENT, type SavedEquipment } from '../data/items';
import { MINIMAP } from '../data/minimap';
import { TOWN, TOWN_NPCS, TOWN_TALK, type NpcId, type TilePoint } from '../data/town';
import { CHOSEN_MAP_KEY } from '../data/maps';
import { BARRACKS_EXIT_KEY, BARRACKS_MAP, TRAINING } from '../data/training';
import { isWandId } from '../data/wands';
import { Effect } from '../entities/Effect';
import { Equipment } from '../entities/Equipment';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import { Portal } from '../entities/Portal';
import { getMap } from '../hb/HBMap';
import { MapView } from '../hb/mapRenderer';
import { PLAYER_FRAMES_PER_DIRECTION } from '../hb/playerAppearance';
import { AudioSystem } from '../systems/AudioSystem';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { lookLoader, runSprites } from '../systems/LookLoader';
import { MusicSystem } from '../systems/MusicSystem';
import { SETTINGS_CHANGED, settings } from '../systems/Settings';
import { LevelUpNotice } from '../ui/LevelUpNotice';
import { Minimap } from '../ui/Minimap';
import { TalkButton } from '../ui/TalkButton';
import { rescueStore } from '../systems/RescueStore';
import { addTouchPauseButton } from '../ui/TouchPauseButton';
import { addTouchFullscreenButton } from '../ui/fullscreen';
import { TouchJoystick } from '../ui/TouchJoystick';
import { Pool } from '../utils/Pool';
import { openOverlay } from './MenuOverlayScene';
import type { CharacterInfoSceneData } from './CharacterInfoScene';
import type { EquipmentSceneData } from './EquipmentScene';
import type { MapSelectSceneData } from './MapSelectScene';
import type { MapLoadSceneData } from './MapLoadScene';
import { NPC_DIALOG_SCENE_KEY, type NpcDialogSceneData } from './NpcDialogScene';
import { MISSIONS_SCENE_KEY, type MissionsSceneData } from './MissionsScene';
import { SHOP_SCENE_KEY, type ShopSceneData } from './ShopScene';
import { SMITH_SCENE_KEY, type SmithSceneData } from './SmithScene';
import type { PauseSceneData } from './PauseScene';

export const TOWN_SCENE_KEY = 'Town';

/** ?town=portal / ?town=<npc> only place the character the first time the town opens. */
let debugSpotUsed = false;

/** Gear slots the equipment dresses (body, hair and underwear come from the look and never change here). */
const DRESSED_SLOTS = ['hauberk', 'leggings', 'boots', 'helm', 'armor', 'weapon', 'cape', 'shield', 'accessory'] as const;

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
    private npcs: Npc[] = [];
    /** The NPC close enough to talk to, if any. */
    private near: Npc | undefined;
    private talkButton: TalkButton | undefined;
    /** Talk is ignored until then: the key or button that closed a panel must not open it again at once. */
    private talkReadyAt = 0;
    private characterUid: string | undefined;
    private classId: CharacterId = DEFAULT_CHARACTER;
    /** What the character wore when the town was dressed (to dress it again after Equipment only if it changed). */
    private dressedAs = '';
    private levelUpNotice!: LevelUpNotice;

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
        const debugSpot = debugSpotUsed ? undefined : DEBUG_START.townSpot;
        debugSpotUsed = true;
        // Back from the Barracks: in front of its door (BARRACKS_EXIT_KEY, set by the pause's Back to Town).
        const fromBarracks = this.registry.get(BARRACKS_EXIT_KEY) === true;
        this.registry.remove(BARRACKS_EXIT_KEY);
        const spawn: TilePoint = debugSpot === 'portal' ? TOWN.portal
            : debugSpot === 'barracks' || fromBarracks ? TOWN.barracksExit
            : debugSpot !== undefined ? { x: TOWN_NPCS[debugSpot].tile.x, y: TOWN_NPCS[debugSpot].tile.y + 1 } : TOWN.spawn;
        this.characterUid = saved?.uid;
        this.classId = classId;
        this.player = new Player(this, (spawn.x + 0.5) * TILE_SIZE, (spawn.y + 0.5) * TILE_SIZE, character, saved?.look ?? DEFAULT_LOOKS[classId], map, areaPx);
        this.player.setHealthBarVisible(false);
        this.dress(classId, saved?.equipment ?? START_EQUIPMENT[classId], saved?.attributes.weapon);
        this.dressedAs = this.wornKey();
        // Fase 29A: only the NPCs already rescued (and William, who is always there); ?town=<npc> brings that one too.
        const present = (Object.keys(TOWN_NPCS) as NpcId[]).filter((id) => rescueStore.isInTown(id) || id === debugSpot);
        this.npcs = present.map((id) => new Npc(this, id, TOWN_NPCS[id], map));
        for (const npc of this.npcs) {
            npc.onClick(() => {
                if (npc === this.near) this.talkTo(npc);
            });
        }
        this.near = undefined;
        this.talkReadyAt = 0;
        this.lastX = this.player.x;
        this.lastY = this.player.y;
        this.dustDistance = 0;
        this.onPortal = false;

        const camera = this.cameras.main;
        zoomWorldCamera(camera);
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
        this.talkButton = undefined;
        if (this.sys.game.device.input.touch) {
            const talkButton = new TalkButton(this, DEPTH_DEBUG - 1, () => this.talkToNear());
            this.talkButton = talkButton;
            this.joystick = new TouchJoystick(this, GAME_HEIGHT, DEPTH_DEBUG - 2, TOUCH_JOYSTICK, (x, y) => !talkButton.covers(x, y) && !onTouchFullscreenButton(x, y, TOUCH_FULLSCREEN_BUTTON.townX));
            this.inputSystem.setTouchJoystick(this.joystick);
            // No Esc on a phone: the same "II" button as in the run, with the minimap below it.
            addTouchPauseButton(this, DEPTH_DEBUG - 1, () => this.openPause());
            addTouchFullscreenButton(this, DEPTH_DEBUG - 1, TOUCH_FULLSCREEN_BUTTON.townX);
            this.minimap.setTop(MINIMAP.topUnderButtons);
        }
        this.levelUpNotice = new LevelUpNotice(this, DEPTH_DEBUG - 1, this.sys.game.device.input.touch, () => this.openCharacter());
        this.refreshLevelUp();
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
        this.events.on(Phaser.Scenes.Events.RESUME, () => {
            this.talkReadyAt = this.time.now + MENU_INPUT_DELAY_MS;
            this.redressIfChanged();
            this.refreshLevelUp();
        });
        // ?town=<npc>&talk (development only): its panel opens at once. ?town=shopKeeper&shop: the shop (Fase 24B);
        // ?town=tom&smith=buy|sell|upgrade: the blacksmith (Fase 24C; upgrade, 24D). ?town=william&missions (Fase 29B).
        if (debugSpot === 'shopKeeper' && DEBUG_START.townShop) {
            const data: Omit<ShopSceneData, 'returnTo'> = { characterUid: this.characterUid };
            this.time.delayedCall(0, () => openOverlay(this, SHOP_SCENE_KEY, data));
        } else if (debugSpot === 'tom' && DEBUG_START.townSmith) {
            const data: SmithSceneData = { characterUid: this.characterUid, tab: DEBUG_START.townSmith };
            this.time.delayedCall(0, () => openOverlay(this, SMITH_SCENE_KEY, data));
        } else if (debugSpot === 'william' && DEBUG_START.townMissions) {
            const data: Omit<MissionsSceneData, 'returnTo'> = { characterUid: this.characterUid };
            this.time.delayedCall(0, () => openOverlay(this, MISSIONS_SCENE_KEY, data));
        } else if (debugSpot !== undefined && debugSpot !== 'portal' && DEBUG_START.townTalk) {
            const npc = this.npcs.find((n) => n.id === debugSpot);
            if (npc) this.time.delayedCall(0, () => this.talkTo(npc));
        }
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
        this.minimap.update({ player, bosses: [], totems: [], loot: [], npcs: this.npcs, portals: [this.portal] }, this.time.now);
        for (const effect of [...this.dust.active]) {
            if (!effect.update()) this.dust.release(effect);
        }
        this.updateTalk();
        if (!this.scene.isActive()) return;
        if (input.justPressed(Action.OpenInventory)) {
            this.openInventory();
            return;
        }
        if (input.justPressed(Action.ToggleStats)) {
            this.openCharacter();
            return;
        }
        this.updatePortal();
        this.updateBarracksDoor();
    }

    /** The door of the Barracks building (31-oct-2026): stepping on it enters the Barracks to train. */
    private updateBarracksDoor(): void {
        if (!this.scene.isActive()) return;
        const door = TOWN.barracksDoor;
        const dx = this.player.x - (door.x + 0.5) * TILE_SIZE;
        const dy = this.player.y - (door.y + 0.5) * TILE_SIZE;
        if (Math.hypot(dx, dy) > TRAINING.doorRadiusPx) return;
        this.registry.set(CHOSEN_MAP_KEY, BARRACKS_MAP);
        this.scene.start('MapLoad', { map: BARRACKS_MAP } satisfies MapLoadSceneData);
    }

    /** The closest NPC in reach shows "Talk" (and the touch button); E / pad A talks to it. */
    private updateTalk(): void {
        const player = this.player;
        let near: Npc | undefined;
        let best: number = TOWN_TALK.radiusPx;
        for (const npc of this.npcs) {
            npc.update();
            const distance = npc.distanceTo(player.x, player.y);
            if (distance <= best) {
                best = distance;
                near = npc;
            }
        }
        this.near = near;
        for (const npc of this.npcs) npc.setTalkable(npc === near, this.time.now);
        this.talkButton?.setVisible(near !== undefined);
        if (this.inputSystem.justPressed(Action.Talk)) this.talkToNear();
    }

    /** I (Fase 24D, owner): the Equipment screen of the character walking the town, as Howard's "Equipment" does. */
    private openInventory(): void {
        if (this.characterUid === undefined || !this.panelReady()) return;
        const data: Omit<EquipmentSceneData, 'returnTo'> = { characterUid: this.characterUid };
        openOverlay(this, 'Equipment', data);
    }

    /** C / pad Y / "Level Up": the Character window, where the points are assigned (as "Level Set." does). */
    private openCharacter(): void {
        if (this.characterUid === undefined || !this.scene.isActive() || !this.panelReady()) return;
        const data: CharacterInfoSceneData = { characterUid: this.characterUid, classId: this.classId };
        openOverlay(this, 'CharacterInfo', data);
    }

    /** The key that closed a panel must not open one again at once. */
    private panelReady(): boolean {
        return this.time.now >= this.talkReadyAt;
    }

    private refreshLevelUp(): void {
        const saved = characterStore.byUid(this.characterUid);
        this.levelUpNotice.setVisible((saved?.unspentPoints ?? 0) > 0);
    }

    private talkToNear(): void {
        if (this.near) this.talkTo(this.near);
    }

    /** Opens the NPC's panel over the town, which waits paused underneath. */
    private talkTo(npc: Npc): void {
        if (!this.scene.isActive() || this.time.now < this.talkReadyAt) return;
        const data: Omit<NpcDialogSceneData, 'returnTo'> = { npc: npc.id, characterUid: this.characterUid };
        openOverlay(this, NPC_DIALOG_SCENE_KEY, data);
    }

    /** Back from a panel: if Equipment changed what the character wears, it is dressed again (downloading it first). */
    private redressIfChanged(): void {
        const key = this.wornKey();
        if (key === this.dressedAs) return;
        this.dressedAs = key;
        const saved = characterStore.byUid(this.characterUid);
        if (!saved) return;
        const classId = this.classId;
        void lookLoader.ensure(this, runSprites(CHARACTERS[classId], saved.look, saved.equipment)).then(() => {
            if (!this.sys.isActive() && !this.sys.isPaused()) return;
            // Back to the starting clothes (shirt, trousers, boots...: they are not items, so Equipment never lists
            // them), and what is equipped goes on top. Emptying the slots instead left the character in underwear.
            const start: Appearance = CHARACTERS[classId].appearance;
            for (const slot of DRESSED_SLOTS) this.player.setGear(slot, start[slot]);
            this.dress(classId, saved.equipment, saved.attributes.weapon);
        });
    }

    /** What the saved character wears now, as text (to tell whether it changed). */
    private wornKey(): string {
        const saved = characterStore.byUid(this.characterUid);
        return saved ? JSON.stringify([saved.equipment, saved.attributes]) : '';
    }

    private openPause(): void {
        if (!this.scene.isActive()) return;
        const uid = this.characterUid;
        const data: PauseSceneData = {
            gameSceneKey: this.scene.key,
            town: uid === undefined ? undefined : { characterUid: uid, classId: this.classId },
        };
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
