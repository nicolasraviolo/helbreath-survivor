// El jugador: posición libre en píxeles (sus pies), movimiento con choque contra el mapa y
// dibujo por capas. Todas las capas avanzan con un único reloj para que nunca se desincronicen.
import Phaser from 'phaser';
import type { CharacterDef } from '../data/characters';
import type { HBMap } from '../hb/HBMap';
import { Direction, directionFromVector } from '../hb/directions';
import {
    PLAYER_FRAMES_PER_DIRECTION,
    PlayerState,
    getGearRenderOrder,
    getLayerFrame,
    type GearLayer,
    type GearSlot,
} from '../hb/playerAppearance';

/** Approximate size of the drawn character, used to fade map objects that cover it. */
const VISUAL_WIDTH = 32;
const VISUAL_HEIGHT = 80;

export class Player {
    public readonly container: Phaser.GameObjects.Container;
    public state = PlayerState.IdleCombat;
    public direction = Direction.South;
    private readonly layers = new Map<GearSlot, { def: GearLayer; sprite: Phaser.GameObjects.Sprite }>();
    private readonly bounds = new Phaser.Geom.Rectangle();
    private animTime = 0;
    private shownFrame = -1;
    private orderKey = '';

    constructor(
        scene: Phaser.Scene,
        public x: number,
        public y: number,
        public readonly def: CharacterDef,
        private readonly map: HBMap,
        /** Playable rectangle in pixels; the feet never leave it. */
        private readonly area: Phaser.Geom.Rectangle,
    ) {
        this.container = scene.add.container(x, y);
        for (const [slot, layer] of Object.entries(def.appearance) as [GearSlot, GearLayer][]) {
            const sprite = scene.make.sprite({ x: 0, y: 0, key: '__DEFAULT' }, false);
            this.container.add(sprite);
            this.layers.set(slot, { def: layer, sprite });
        }
        this.refresh(true);
    }

    /** Moves with a 0..1 input vector, then updates animation, layer order and depth. */
    public update(move: Readonly<Phaser.Math.Vector2>, deltaMs: number): void {
        const moving = move.lengthSq() > 0;
        const newState = moving ? PlayerState.Run : PlayerState.IdleCombat;
        const newDirection = directionFromVector(move.x, move.y) ?? this.direction;
        const changed = newState !== this.state || newDirection !== this.direction;
        if (newState !== this.state) {
            this.animTime = 0;
        }
        this.state = newState;
        this.direction = newDirection;

        if (moving) {
            const distance = (this.def.speed * deltaMs) / 1000;
            this.tryMove(move.x * distance, 0);
            this.tryMove(0, move.y * distance);
        }

        this.animTime += deltaMs;
        this.container.setPosition(this.x, this.y).setDepth(this.y);
        this.refresh(changed);
    }

    /** True when the whole hitbox (a square around the feet) is on walkable tiles inside the play area. */
    public canStandAt(x: number, y: number): boolean {
        const h = this.def.hitboxHalfSize;
        const { area, map } = this;
        if (x - h < area.left || x + h >= area.right || y - h < area.top || y + h >= area.bottom) {
            return false;
        }
        return map.isWalkableAtPixel(x - h, y - h) && map.isWalkableAtPixel(x + h, y - h)
            && map.isWalkableAtPixel(x - h, y + h) && map.isWalkableAtPixel(x + h, y + h);
    }

    public getHitbox(out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
        const h = this.def.hitboxHalfSize;
        return out.setTo(this.x - h, this.y - h, h * 2, h * 2);
    }

    /** Rough screen area covered by the character (for fading trees in front of it). */
    public getVisualBounds(): Phaser.Geom.Rectangle {
        return this.bounds.setTo(this.x - VISUAL_WIDTH / 2, this.y - VISUAL_HEIGHT, VISUAL_WIDTH, VISUAL_HEIGHT);
    }

    /**
     * Moves along one axis. When blocked, steps as far as possible so the player ends up touching
     * the wall; moving the axes separately makes diagonal movement slide along walls.
     */
    private tryMove(dx: number, dy: number): void {
        if (this.canStandAt(this.x + dx, this.y + dy)) {
            this.x += dx;
            this.y += dy;
            return;
        }
        const steps = Math.ceil(Math.abs(dx + dy));
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);
        for (let i = 0; i < steps && this.canStandAt(this.x + stepX, this.y + stepY); i++) {
            this.x += stepX;
            this.y += stepY;
        }
    }

    private refresh(force: boolean): void {
        const frameRate = this.state === PlayerState.Run ? this.def.runFrameRate : this.def.idleFrameRate;
        const frame = Math.floor((this.animTime * frameRate) / 1000) % PLAYER_FRAMES_PER_DIRECTION;
        if (!force && frame === this.shownFrame) {
            return;
        }
        this.shownFrame = frame;

        for (const [slot, { def, sprite }] of this.layers) {
            const { texture, frame: frameName } = getLayerFrame(slot, def, this.state, this.direction, frame);
            sprite.setTexture(texture, frameName);
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
        const order = getGearRenderOrder(this.direction, isRunning);
        for (const slot of order) {
            const layer = this.layers.get(slot);
            if (layer) this.container.bringToTop(layer.sprite);
        }
    }
}
