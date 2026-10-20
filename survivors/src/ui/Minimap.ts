// Minimapa (Fase 16A): el trozo de la imagen del mapa que corresponde a la zona de juego, con un punto por cosa
// que interesa (jugador, jefes y tótems, del color de su efecto). Las posiciones llegan en píxeles del mundo y se pasan a casillas.
import Phaser from 'phaser';
import type { MinimapKey } from '../config/assetManifest';
import { GAME_WIDTH, TILE_SIZE } from '../config/gameConfig';
import { MINIMAP, MINIMAP_DOTS, type MinimapDotStyle } from '../data/minimap';
import type { TileRect } from '../data/maps';

/** What does not change during a run: the picture, the size of the whole map and the play area (in tiles). */
export interface MinimapInfo {
    key: MinimapKey;
    mapWidth: number;
    mapHeight: number;
    playArea: TileRect;
}

/** Positions in world pixels. */
export interface MinimapMarkers {
    player: Phaser.Types.Math.Vector2Like;
    bosses: readonly Phaser.Types.Math.Vector2Like[];
    /** Totems on the ground (Fase 16B), all with the same dot. */
    totems: readonly Phaser.Types.Math.Vector2Like[];
    /** Loot on the ground (Fase 21A). */
    loot: readonly Phaser.Types.Math.Vector2Like[];
}

/** Name of the texture frame cut out of the map picture. */
const PLAY_AREA_FRAME = 'playArea';

export class Minimap {
    private readonly container: Phaser.GameObjects.Container;
    private readonly dots: Phaser.GameObjects.Graphics;
    private readonly area: TileRect;

    constructor(scene: Phaser.Scene, info: MinimapInfo, depth: number) {
        this.area = info.playArea;
        const size = MINIMAP.size;
        const texture = scene.textures.get(info.key);
        if (!texture.has(PLAY_AREA_FRAME)) {
            const source = texture.getSourceImage();
            const pxPerTileX = source.width / info.mapWidth;
            const pxPerTileY = source.height / info.mapHeight;
            texture.add(PLAY_AREA_FRAME, 0, info.playArea.x * pxPerTileX, info.playArea.y * pxPerTileY,
                info.playArea.width * pxPerTileX, info.playArea.height * pxPerTileY);
        }
        const border = MINIMAP.borderWidth;
        const back = scene.add.rectangle(-border, -border, size + border * 2, size + border * 2, MINIMAP.backColor)
            .setOrigin(0).setStrokeStyle(border, MINIMAP.borderColor);
        const picture = scene.add.image(0, 0, info.key, PLAY_AREA_FRAME).setOrigin(0).setDisplaySize(size, size)
            .setAlpha(MINIMAP.alpha);
        this.dots = scene.add.graphics();
        this.container = scene.add.container(GAME_WIDTH - MINIMAP.margin - size, MINIMAP.margin, [back, picture, this.dots])
            .setDepth(depth);
    }

    public setTop(y: number): void {
        this.container.setY(y);
    }

    public setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    public update(markers: MinimapMarkers, timeMs: number): void {
        if (!this.container.visible) return;
        this.dots.clear();
        for (const item of markers.loot) this.drawDot(item, MINIMAP_DOTS.loot, timeMs);
        for (const totem of markers.totems) this.drawDot(totem, MINIMAP_DOTS.totem, timeMs);
        for (const boss of markers.bosses) this.drawDot(boss, MINIMAP_DOTS.boss, timeMs);
        // The player last, so it is never hidden under a boss.
        this.drawDot(markers.player, MINIMAP_DOTS.player, timeMs);
    }

    private drawDot(at: Phaser.Types.Math.Vector2Like, style: MinimapDotStyle, timeMs: number): void {
        if (style.blinkMs > 0 && Math.floor(timeMs / style.blinkMs) % 2 === 1) return;
        const size = MINIMAP.size;
        const x = Phaser.Math.Clamp(((at.x ?? 0) / TILE_SIZE - this.area.x) / this.area.width, 0, 1) * size;
        const y = Phaser.Math.Clamp(((at.y ?? 0) / TILE_SIZE - this.area.y) / this.area.height, 0, 1) * size;
        this.dots.fillStyle(style.outline).fillCircle(x, y, style.radius + 1);
        this.dots.fillStyle(style.color).fillCircle(x, y, style.radius);
    }
}
