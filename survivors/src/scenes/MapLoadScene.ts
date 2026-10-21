// Carga de un mapa al elegirlo (Fase 22A), con la misma pantalla de carga del principio y su nombre de título.
// Fase 22B: aquí se baja todo lo que la partida necesita y los menús no:
// - el .amd, su minimapa y solo los paquetes de casillas que usa;
// - los monstruos de su primera oleada (los demás, después, en segundo plano: systems/AssetStreamer.ts);
// - los efectos de partida (RUN_SPRITES) y los propios de la clase elegida (runSprites en data/characters.ts);
// - los objetos del suelo (gemas, botín, pociones);
// - la ropa, la armadura y el arma que lleva el personaje (systems/LookLoader.ts), para que no aparezcan tarde.
// Lo ya cargado (otra partida, Restart, otro mapa que comparte cosas) no se vuelve a bajar: si no falta nada, pasa
// casi sin verse.
import Phaser from 'phaser';
import { ASSET_BASE_PATH, MAPS, MINIMAPS, RUN_SPRITES, SPRITES, type SpriteKey } from '../config/assetManifest';
import { registerEffectAnimations } from '../config/effects';
import { DEFAULT_ANIMATION_FRAME_RATE, MAP_OBJECT_MARGIN_TILES } from '../config/gameConfig';
import { DEFAULT_LOOKS } from '../data/appearance';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId, type CharacterId } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { START_EQUIPMENT } from '../data/items';
import { CHOSEN_MAP_KEY, MAPS_DATA, type MapId } from '../data/maps';
import { getMap, hasMap } from '../hb/HBMap';
import { getSheetKey, HBSpriteFile, SpriteType } from '../hb/HBSprite';
import { getTilePacksForIndices, getTileTextureKey } from '../hb/mapAssets';
import { assetStreamer, firstWaveEnemies } from '../systems/AssetStreamer';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { loadTimer } from '../systems/LoadTimer';
import { lookLoader, runSprites } from '../systems/LookLoader';
import { LoadingScreen } from '../ui/LoadingScreen';

/** Share of the bar used by the downloads (the first batch, then the tiles); the rest is preparing them. */
const FIRST_DOWNLOAD_SHARE = 0.4;
const DOWNLOAD_SHARE = 0.5;

export interface MapLoadSceneData {
    map: MapId;
}

export class MapLoadScene extends Phaser.Scene {
    private mapId: MapId = 'traveler';
    private screen!: LoadingScreen;
    /** Sprites of this run still to prepare (downloaded in preload). */
    private sprites: SpriteKey[] = [];

    constructor() {
        super('MapLoad');
    }

    init(data: MapLoadSceneData): void {
        this.mapId = data.map;
        this.registry.set(CHOSEN_MAP_KEY, data.map);
    }

    preload(): void {
        const def = MAPS_DATA[this.mapId];
        this.screen = new LoadingScreen(this, def.name, 'Loading map');
        loadTimer.start(this.timerName);
        this.load.setPath(ASSET_BASE_PATH);
        if (!hasMap(def.asset)) this.load.binary(def.asset, MAPS[def.asset].file);
        if (!this.textures.exists(def.minimap)) this.load.image(def.minimap, MINIMAPS[def.minimap].file);
        this.sprites = this.runSprites().filter((key) => !this.textures.exists(getSheetKey(key, 0)));
        for (const key of this.sprites) {
            if (!this.cache.binary.exists(key)) this.load.binary(key, SPRITES[key].file);
        }
        this.trackProgress(0, FIRST_DOWNLOAD_SHARE);
    }

    async create(): Promise<void> {
        const def = MAPS_DATA[this.mapId];
        // What the character wears downloads alongside the rest; it is waited for at the end.
        const wearing = lookLoader.ensure(this, this.wornSprites());
        const map = getMap(this, def.asset);
        const packs = getTilePacksForIndices(map.requiredTileIndices(def.playArea, MAP_OBJECT_MARGIN_TILES)).filter((pack) => !this.textures.exists(getTileTextureKey(pack.start)));
        if (packs.length > 0) {
            this.trackProgress(FIRST_DOWNLOAD_SHARE, DOWNLOAD_SHARE - FIRST_DOWNLOAD_SHARE);
            await new Promise<void>((resolve) => {
                this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
                for (const pack of packs) this.load.binary(pack.key, pack.file);
                this.load.start();
            });
        }
        loadTimer.downloaded(this.timerName);
        const jobs = [
            ...packs.map((pack) => new HBSpriteFile(pack.key, SpriteType.Tiles, DEFAULT_ANIMATION_FRAME_RATE, pack.start)),
            ...this.sprites.map((key) => new HBSpriteFile(key, SPRITES[key].type, DEFAULT_ANIMATION_FRAME_RATE)),
        ];
        for (const [i, job] of jobs.entries()) {
            await job.load(this);
            this.screen.setProgress(DOWNLOAD_SHARE + ((i + 1) / jobs.length) * (1 - DOWNLOAD_SHARE));
        }
        await wearing;
        registerEffectAnimations(this.anims, this.textures);
        // The rest of this map's monsters, in the order of its waves, while it plays.
        assetStreamer.start(this, this.mapId);
        loadTimer.end(this.timerName);
        this.scene.start('Game');
    }

    /** Class chosen for this run (GameScene uses the same fallback). */
    private get classId(): CharacterId {
        const chosen: unknown = this.registry.get(CHOSEN_CHARACTER_KEY);
        return isCharacterId(chosen) ? chosen : DEFAULT_CHARACTER;
    }

    /** Body, clothes and weapon of the character that will play (as GameScene draws it). */
    private wornSprites(): SpriteKey[] {
        const uid: unknown = this.registry.get(ACTIVE_CHARACTER_KEY);
        const saved = characterStore.byUid(typeof uid === 'string' ? uid : undefined);
        const classId = saved?.classId ?? this.classId;
        return runSprites(CHARACTERS[classId], saved?.look ?? DEFAULT_LOOKS[classId], saved?.equipment ?? START_EQUIPMENT[classId]);
    }

    /** What this run needs besides the map: first-wave monsters, run effects (common and of the class), items on the ground. */
    private runSprites(): SpriteKey[] {
        const classId = this.classId;
        return [...new Set<SpriteKey>([
            ...firstWaveEnemies(this.mapId).map((id) => ENEMIES[id].sprite),
            ...RUN_SPRITES,
            ...CHARACTERS[classId].runSprites,
        ])];
    }

    /** The loader's progress moves the bar from `from` over `share` of it. */
    private trackProgress(from: number, share: number): void {
        this.load.off(Phaser.Loader.Events.PROGRESS);
        this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => this.screen.setProgress(from + value * share));
    }

    private get timerName(): string {
        return `MapLoad:${this.mapId}`;
    }
}
