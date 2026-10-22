// Nitidez (ver RENDER_SCALE en config/device.ts): el lienzo mide 800x600 por RENDER_SCALE, pero todo el juego sigue
// pensando en 800x600. Este plugin pone cada cámara principal con zoom RENDER_SCALE mirando a 800x600, así que las
// escenas no tienen que saber nada. Además hay ayudas para lo que no encaja solo:
// - Los toques y clics (`pointer.x`) llegan en píxeles del lienzo: `toGame` los pasa a 800x600.
// - Lo que va fijo en pantalla (scrollFactor 0) Phaser lo descoloca con zoom: se mete en una `ScreenLayer`.
import Phaser from 'phaser';
import { RENDER_SCALE } from '../config/device';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';

/** Canvas size in real pixels. */
export const CANVAS_WIDTH = GAME_WIDTH * RENDER_SCALE;
export const CANVAS_HEIGHT = GAME_HEIGHT * RENDER_SCALE;

/** A canvas pixel coordinate (pointer.x, pointer.downY, scale.transformX…) in game pixels (800x600). */
export function toGame(canvasPx: number): number {
    return canvasPx / RENDER_SCALE;
}

/** Camera viewport given in game pixels. */
export function setGameViewport(camera: Phaser.Cameras.Scene2D.Camera, x: number, y: number, width: number, height: number): void {
    camera.setViewport(x * RENDER_SCALE, y * RENDER_SCALE, width * RENDER_SCALE, height * RENDER_SCALE);
}

/** Zooms the main camera of every scene as it starts (before its create(), which may still move or follow). */
export class RenderScalePlugin extends Phaser.Plugins.ScenePlugin {
    public override boot(): void {
        this.systems?.events.on(Phaser.Scenes.Events.READY, this.applyZoom, this);
    }

    private applyZoom(): void {
        if (RENDER_SCALE === 1) return;
        this.scene?.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }
}

/**
 * Things fixed on screen (minimap, touch sticks and buttons, debug texts). With zoom, Phaser scales scrollFactor-0
 * objects around the camera centre, so they drift; this container (positioned in game pixels from the top-left of
 * the camera's view) moves itself to cancel that every frame. Add children with `addFixed`.
 */
export class ScreenLayer extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, depth: number, private readonly camera = scene.cameras.main) {
        super(scene);
        scene.add.existing(this);
        this.setScrollFactor(0).setDepth(depth);
        this.place();
        scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.place, this);
        this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.place, this));
    }

    /** Adds fixed objects, placed in game pixels (their own scrollFactor goes to 0 so taps hit them where they show). */
    public addFixed(...objects: Phaser.GameObjects.GameObject[]): this {
        for (const object of objects) {
            (object as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor?.(0, 0);
            this.add(object);
        }
        return this;
    }

    /** The camera draws scrollFactor-0 points at origin + zoom * (p - origin): shift so p lands at zoom * p. */
    private place(): void {
        const cam = this.camera;
        const zoom = cam.zoom;
        this.setPosition(cam.width * cam.originX * (1 - 1 / zoom), cam.height * cam.originY * (1 - 1 / zoom));
    }
}
