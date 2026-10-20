// Carga de un mapa al elegirlo (Fase 22A), con la misma pantalla de carga del principio y su nombre de título:
// el .amd, su minimapa y solo los paquetes de casillas que usa; luego empieza la partida. Lo ya cargado (otra partida
// en el mismo mapa, Restart) no se vuelve a bajar, y entonces pasa casi sin verse.
// Sus monstruos pasan delante en la cola de AssetStreamer. Repartir del todo la carga por mapa es el bloque 22B.
import Phaser from 'phaser';
import { ASSET_BASE_PATH, MAPS, MINIMAPS } from '../config/assetManifest';
import { DEFAULT_ANIMATION_FRAME_RATE } from '../config/gameConfig';
import { CHOSEN_MAP_KEY, MAPS_DATA, type MapId } from '../data/maps';
import { getMap, hasMap } from '../hb/HBMap';
import { HBSpriteFile, SpriteType } from '../hb/HBSprite';
import { getTilePacksForIndices, getTileTextureKey } from '../hb/mapAssets';
import { assetStreamer } from '../systems/AssetStreamer';
import { LoadingScreen } from '../ui/LoadingScreen';

/** Share of the bar used by the downloads; the rest is turning the tiles into textures. */
const DOWNLOAD_SHARE = 0.5;

export interface MapLoadSceneData {
    map: MapId;
}

export class MapLoadScene extends Phaser.Scene {
    private mapId: MapId = 'traveler';
    private screen!: LoadingScreen;

    constructor() {
        super('MapLoad');
    }

    init(data: MapLoadSceneData): void {
        this.mapId = data.map;
        this.registry.set(CHOSEN_MAP_KEY, data.map);
        assetStreamer.prioritize(data.map);
    }

    preload(): void {
        const def = MAPS_DATA[this.mapId];
        this.screen = new LoadingScreen(this, def.name, 'Loading map');
        this.load.setPath(ASSET_BASE_PATH);
        if (!hasMap(def.asset)) this.load.binary(def.asset, MAPS[def.asset].file);
        if (!this.textures.exists(def.minimap)) this.load.image(def.minimap, MINIMAPS[def.minimap].file);
        this.trackProgress(0, DOWNLOAD_SHARE / 2);
    }

    async create(): Promise<void> {
        const def = MAPS_DATA[this.mapId];
        const map = getMap(this, def.asset);
        const packs = getTilePacksForIndices(map.requiredTileIndices()).filter((pack) => !this.textures.exists(getTileTextureKey(pack.start)));
        if (packs.length > 0) {
            this.trackProgress(DOWNLOAD_SHARE / 2, DOWNLOAD_SHARE / 2);
            await new Promise<void>((resolve) => {
                this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
                for (const pack of packs) this.load.binary(pack.key, pack.file);
                this.load.start();
            });
            for (const [i, pack] of packs.entries()) {
                await new HBSpriteFile(pack.key, SpriteType.Tiles, DEFAULT_ANIMATION_FRAME_RATE, pack.start).load(this);
                this.screen.setProgress(DOWNLOAD_SHARE + ((i + 1) / packs.length) * (1 - DOWNLOAD_SHARE));
            }
        }
        this.scene.start('Game');
    }

    /** The loader's progress moves the bar from `from` over `share` of it. */
    private trackProgress(from: number, share: number): void {
        this.load.off(Phaser.Loader.Events.PROGRESS);
        this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => this.screen.setProgress(from + value * share));
    }
}
