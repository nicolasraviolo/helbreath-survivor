// Dibujo de un personaje por capas (cuerpo, pelo, ropa, armadura, arma...). Todas las capas avanzan con
// un único reloj para que nunca se desincronicen, y se reordenan según la dirección como en el original.
// Lo usan el jugador en la partida y la vista previa de la pantalla de selección.
import Phaser from 'phaser';
import type { CharacterDef } from '../data/characters';
import { Direction } from '../hb/directions';
import {
    PLAYER_FRAMES_PER_DIRECTION,
    PlayerState,
    framesPerDirection,
    getGearRenderOrder,
    getLayerFrame,
    type GearLayer,
    type GearSlot,
} from '../hb/playerAppearance';

export class CharacterSprite {
    /** Holds only the layers; place, scale or nest it like any container. */
    public readonly container: Phaser.GameObjects.Container;
    public state = PlayerState.IdleCombat;
    public direction = Direction.South;
    /** Time in the current state, in milliseconds. */
    public stateTime = 0;
    /** Length of the current melee swing or cast (its frames are spread over it). */
    public actionDurationMs = 1;
    private readonly layers = new Map<GearSlot, { def: GearLayer; sprite: Phaser.GameObjects.Sprite }>();
    private shownFrame = -1;
    private orderKey = '';
    private tint: number | undefined;

    constructor(private readonly scene: Phaser.Scene, private readonly def: CharacterDef, x = 0, y = 0) {
        this.container = scene.add.container(x, y);
        for (const [slot, layer] of Object.entries(def.appearance) as [GearSlot, GearLayer][]) {
            this.setLayer(slot, layer, false);
        }
        this.refresh(true);
    }

    /** Puts on, swaps or (with undefined) takes off the piece drawn in a slot. */
    public setLayer(slot: GearSlot, layer: GearLayer | undefined, redraw = true): void {
        const current = this.layers.get(slot);
        if (!layer) {
            current?.sprite.destroy();
            this.layers.delete(slot);
        } else if (current) {
            current.def = layer;
            this.applyTint(current.sprite, layer);
        } else {
            const sprite = this.scene.make.sprite({ x: 0, y: 0, key: '__DEFAULT' }, false);
            this.applyTint(sprite, layer);
            this.container.add(sprite);
            this.layers.set(slot, { def: layer, sprite });
        }
        if (redraw) {
            this.orderKey = '';
            this.refresh(true);
        }
    }

    /** Changes state and direction; a new state starts its animation from the first frame. */
    public setPose(state: PlayerState, direction: Direction): void {
        const changed = state !== this.state || direction !== this.direction;
        if (state !== this.state) this.stateTime = 0;
        this.state = state;
        this.direction = direction;
        if (changed) this.refresh(true);
    }

    public update(deltaMs: number): void {
        this.stateTime += deltaMs;
        this.refresh(false);
    }

    /** Tints every layer (debug invincibility); undefined goes back to each layer's own colour. */
    public setTint(color: number | undefined): void {
        this.tint = color;
        for (const { def, sprite } of this.layers.values()) this.applyTint(sprite, def);
    }

    private applyTint(sprite: Phaser.GameObjects.Sprite, layer: GearLayer): void {
        const color = this.tint ?? layer.tint;
        if (color === undefined) sprite.clearTint();
        else sprite.setTint(color);
    }

    private currentFrame(): number {
        const lastFrame = PLAYER_FRAMES_PER_DIRECTION - 1;
        switch (this.state) {
            case PlayerState.Die:
                // Played once, then stays on the last frame.
                return Math.min(lastFrame, Math.floor((this.stateTime * this.def.dieFrameRate) / 1000));
            case PlayerState.Melee:
            case PlayerState.Cast: {
                const frames = framesPerDirection(this.state);
                return Math.min(frames - 1, Math.floor((this.stateTime / this.actionDurationMs) * frames));
            }
            case PlayerState.Run:
                return Math.floor((this.stateTime * this.def.runFrameRate) / 1000) % PLAYER_FRAMES_PER_DIRECTION;
            default:
                return Math.floor((this.stateTime * this.def.idleFrameRate) / 1000) % PLAYER_FRAMES_PER_DIRECTION;
        }
    }

    private refresh(force: boolean): void {
        const frame = this.currentFrame();
        if (!force && frame === this.shownFrame) {
            return;
        }
        this.shownFrame = frame;

        for (const [slot, { def, sprite }] of this.layers) {
            const layerFrame = getLayerFrame(slot, def, this.state, this.direction, frame);
            sprite.setVisible(layerFrame !== undefined);
            if (layerFrame) sprite.setTexture(layerFrame.texture, layerFrame.frame);
        }
        this.applyRenderOrder();
    }

    /** Re-stacks the layers when direction or state changes the drawing order. */
    private applyRenderOrder(): void {
        const isRunning = this.state === PlayerState.Run;
        const key = `${this.direction}-${isRunning}`;
        if (key === this.orderKey) {
            return;
        }
        this.orderKey = key;
        for (const slot of getGearRenderOrder(this.direction, isRunning)) {
            const layer = this.layers.get(slot);
            if (layer) this.container.bringToTop(layer.sprite);
        }
    }
}
