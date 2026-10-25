// Dibujo de un personaje por capas (cuerpo, pelo, ropa, armadura, arma...). Todas las capas avanzan con
// un único reloj para que nunca se desincronicen, y se reordenan según la dirección como en el original.
// Lo usan el jugador en la partida y la vista previa de la pantalla de selección.
// Fase 17B: el aspecto (sexo, piel, pelo, ropa interior) llega aparte de la clase. Cada pieza se cambia por la de su
// sexo (gearForGender), las piezas que aún no se han descargado no se ven hasta que llegan (LookLoader), el pelo se
// tiñe sumando color como en el original y se oculta con casco (como el original).
import Phaser from 'phaser';
import type { ItemAttribute } from '../data/attributes';
import { equipmentLook, type EquipSlotId, type SavedEquipment } from '../data/items';
import { gearForGender, HAIR_COLOR_SCALE, HAIR_COLORS, lookLayers, type CharacterLook } from '../data/appearance';
import type { CharacterDef } from '../data/characters';
import { colouredTexture, ensureAdditiveTexture, tintedKey } from '../hb/additiveTint';
import { Direction } from '../hb/directions';
import {
    PLAYER_FRAMES_PER_DIRECTION,
    PlayerState,
    framesPerDirection,
    getGearRenderOrder,
    getLayerFrame,
    type Appearance,
    type GearLayer,
    type GearSlot,
} from '../hb/playerAppearance';
import { lookLoader } from '../systems/LookLoader';
import { smoothSprite } from '../hb/XbrPipeline';

/** Slots that come from the look, not from the class or the armor. */
const LOOK_SLOTS: ReadonlySet<GearSlot> = new Set<GearSlot>(['human', 'hair', 'underwear']);

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
    /** Additive copies of every layer (Berserk glow), drawn above them; empty while there is no glow. */
    private readonly overlays = new Map<GearSlot, Phaser.GameObjects.Sprite>();
    private overlayTint: number | undefined;
    private overlayAlpha = 1;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly def: CharacterDef,
        private readonly look: CharacterLook,
        x = 0,
        y = 0,
    ) {
        this.container = scene.add.container(x, y);
        // The class's clothes, with body, hair (none when bald) and underwear from the look.
        const appearance: Appearance = { ...def.appearance };
        delete appearance.hair;
        Object.assign(appearance, lookLayers(look));
        for (const [slot, layer] of Object.entries(appearance) as [GearSlot, GearLayer][]) {
            this.setLayer(slot, layer, false);
        }
        this.refresh(true);
    }

    /** Puts on, swaps or (with undefined) takes off the piece drawn in a slot (as drawn for the look's gender). */
    public setLayer(slot: GearSlot, piece: GearLayer | undefined, redraw = true): void {
        const layer = piece && !LOOK_SLOTS.has(slot) ? { ...piece, sprite: gearForGender(piece.sprite, this.look.gender) } : piece;
        if (layer && !lookLoader.isReady(this.scene, layer.sprite)) {
            // Not downloaded yet: hidden until it arrives, then redrawn (if the character is still on screen).
            void lookLoader.ensure(this.scene, [layer.sprite]).then(() => {
                if (this.container.active) {
                    this.orderKey = '';
                    this.refresh(true);
                }
            });
        }
        const current = this.layers.get(slot);
        if (!layer) {
            current?.sprite.destroy();
            this.layers.delete(slot);
            this.overlays.get(slot)?.destroy();
            this.overlays.delete(slot);
        } else if (current) {
            current.def = layer;
            this.applyTint(current.sprite, layer);
        } else {
            const sprite = smoothSprite(this.scene.make.sprite({ x: 0, y: 0, key: '__DEFAULT' }, false));
            this.applyTint(sprite, layer);
            this.container.add(sprite);
            this.layers.set(slot, { def: layer, sprite });
        }
        if (redraw) {
            this.orderKey = '';
            this.refresh(true);
        }
    }

    /** Draws a saved character's equipment over the class's clothes (Fase 20B), the weapon in its attribute's colour (21B). */
    public wearEquipment(equipment: Readonly<SavedEquipment>, attributes: Readonly<Partial<Record<EquipSlotId, ItemAttribute>>> = {}): void {
        for (const [slot, layer] of equipmentLook(equipment, attributes)) this.setLayer(slot, layer, false);
        this.orderKey = '';
        this.refresh(true);
    }

    /** Removes every layer (the preview of Create New Character is rebuilt when the look changes). */
    public destroy(): void {
        this.container.destroy();
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

    /** Frame of the naked body layer now on screen (the shadow is drawn from it), or undefined while not loaded. */
    public bodyFrame(): Phaser.Textures.Frame | undefined {
        const body = this.layers.get('human')?.sprite;
        return body?.visible ? body.frame : undefined;
    }

    /** Tints every layer (debug invincibility); undefined goes back to each layer's own colour. */
    public setTint(color: number | undefined): void {
        this.tint = color;
        for (const { def, sprite } of this.layers.values()) this.applyTint(sprite, def);
    }

    /**
     * Additive colour glow over the whole character (the original Berserk overlay: a copy of each layer in ADD mode);
     * undefined removes it.
     */
    public setGlow(color: number | undefined, alpha = 1): void {
        this.overlayTint = color;
        this.overlayAlpha = alpha;
        if (color === undefined) {
            for (const overlay of this.overlays.values()) overlay.destroy();
            this.overlays.clear();
            return;
        }
        this.orderKey = '';
        this.refresh(true);
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
            case PlayerState.Cast:
            case PlayerState.Hurt: {
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

        // As in the original, a helmet hides the hair.
        const helmed = this.layers.has('helm');
        for (const [slot, { def, sprite }] of this.layers) {
            const layerFrame = slot === 'hair' && helmed ? undefined : getLayerFrame(slot, def, this.state, this.direction, frame);
            const texture = layerFrame ? this.textureOf(def, layerFrame.texture) : undefined;
            sprite.setVisible(texture !== undefined);
            if (layerFrame && texture) sprite.setTexture(texture, layerFrame.frame);
            if (this.overlayTint !== undefined) this.syncOverlay(slot, sprite);
        }
        this.applyRenderOrder();
    }

    /** Texture to draw (the hair's or the weapon's tinted copy), or undefined while it isn't loaded. */
    private textureOf(layer: GearLayer, baseKey: string): string | undefined {
        const textures = this.scene.sys.textures;
        if (layer.added) return colouredTexture(textures, baseKey, layer.added);
        const color = layer.hairColor === undefined ? undefined : HAIR_COLORS[layer.hairColor];
        if (!color) return textures.exists(baseKey) ? baseKey : undefined;
        const key = tintedKey(baseKey, `hair${layer.hairColor}`);
        const add = color.add.map((value) => Math.round(value * HAIR_COLOR_SCALE)) as [number, number, number];
        return ensureAdditiveTexture(textures, baseKey, key, add) ? key : undefined;
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
        // The glow goes over every layer, in the same order.
        for (const slot of getGearRenderOrder(this.direction, isRunning)) {
            const overlay = this.overlays.get(slot);
            if (overlay) this.container.bringToTop(overlay);
        }
    }

    /** Copies a layer's frame onto its glow sprite (created the first time). */
    private syncOverlay(slot: GearSlot, sprite: Phaser.GameObjects.Sprite): void {
        let overlay = this.overlays.get(slot);
        if (!overlay) {
            overlay = smoothSprite(this.scene.make.sprite({ x: 0, y: 0, key: '__DEFAULT' }, false)).setBlendMode(Phaser.BlendModes.ADD);
            this.container.add(overlay);
            this.overlays.set(slot, overlay);
        }
        overlay.setTint(this.overlayTint ?? 0xffffff).setAlpha(this.overlayAlpha).setVisible(sprite.visible);
        if (sprite.visible) overlay.setTexture(sprite.texture.key, sprite.frame.name);
    }
}
