// Dibujo de un personaje por capas (cuerpo, pelo, ropa, armadura, arma...). Todas las capas avanzan con
// un único reloj para que nunca se desincronicen, y se reordenan según la dirección como en el original.
// Lo usan el jugador en la partida y la vista previa de la pantalla de selección.
import Phaser from 'phaser';
import type { CharacterDef } from '../data/characters';
import { Direction } from '../hb/directions';
import {
    PLAYER_FRAMES_PER_DIRECTION,
    PlayerState,
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
    private readonly layers = new Map<GearSlot, { def: GearLayer; sprite: Phaser.GameObjects.Sprite }>();
    private shownFrame = -1;
    private orderKey = '';

    constructor(scene: Phaser.Scene, private readonly def: CharacterDef, x = 0, y = 0) {
        this.container = scene.add.container(x, y);
        for (const [slot, layer] of Object.entries(def.appearance) as [GearSlot, GearLayer][]) {
            const sprite = scene.make.sprite({ x: 0, y: 0, key: '__DEFAULT' }, false);
            this.container.add(sprite);
            this.layers.set(slot, { def: layer, sprite });
        }
        this.refresh(true);
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

    public setTint(color: number | undefined): void {
        for (const { sprite } of this.layers.values()) {
            if (color === undefined) sprite.clearTint();
            else sprite.setTint(color);
        }
    }

    private currentFrame(): number {
        const lastFrame = PLAYER_FRAMES_PER_DIRECTION - 1;
        switch (this.state) {
            case PlayerState.Die:
                // Played once, then stays on the last frame.
                return Math.min(lastFrame, Math.floor((this.stateTime * this.def.dieFrameRate) / 1000));
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
