// Helbreath Off (Fase Off-1): el personaje que anda por el mundo. Lo mueve TileMover casilla a casilla; aquí solo se
// dibuja: las capas de cuerpo y ropa de Survivors (CharacterSprite), quieto / andando / corriendo, y la sombra sacada
// del cuerpo desnudo como el jugador de Survivors (entities/Player.ts, syncShadow).
// Fase Off-2: golpear, encogerse al recibir un golpe y caer al morir. La vida se ve en el HUD (OffHudScene, Off-2B).
// Fase Off-3C: lleva puesto su equipo (`wear`), encima de la ropa de inicio del novato.
// Fase Off-6B: prepara magias (`cast`): la animación Cast del original (16 frames, sin arma) durante la preparación;
// luego, de pie en guardia hasta el clic (el CastReady del cliente es esa misma hoja).
import Phaser from 'phaser';
import { BODY_SHADOW_ALPHA, BODY_SHADOW_ROTATION, BODY_SHADOW_SCALE_Y, DEPTH_GROUND_SHADOWS, TILE_SIZE } from '../../config/gameConfig';
import type { CharacterLook } from '../../data/appearance';
import type { CharacterDef } from '../../data/characters';
import type { WeaponAttribute } from '../../data/attributes';
import type { SavedEquipment } from '../../data/items';
import { CharacterSprite } from '../../entities/CharacterSprite';
import type { Direction } from '../../hb/directions';
import { PlayerState, type GearSlot } from '../../hb/playerAppearance';
import { smoothSprite } from '../../hb/XbrPipeline';
import type { TileMover, TilePoint } from '../systems/TileMover';

/** Approximate size of the drawn character, used to fade map objects that cover it (as Player). */
const VISUAL_WIDTH = 32;
const VISUAL_HEIGHT = 80;
/** Layers equipment can draw: taking it off goes back to the novice's starting clothes there (as TownScene). */
const DRESSED_SLOTS: readonly GearSlot[] = ['hauberk', 'leggings', 'boots', 'helm', 'armor', 'weapon', 'cape', 'shield'];
/** Held in the hands: drawn only when equipped. */
const HELD_SLOTS: ReadonlySet<GearSlot> = new Set(['weapon', 'shield']);

export class OffCharacter {
    public readonly container: Phaser.GameObjects.Container;
    public x = 0;
    public y = 0;
    private readonly body: CharacterSprite;
    private readonly shadow: Phaser.GameObjects.Sprite;
    private readonly bounds = new Phaser.Geom.Rectangle();
    private readonly tile: TilePoint = { x: 0, y: 0 };
    /** An attack or a flinch is showing for this long, ms. */
    private actionLeftMs = 0;
    private dead = false;

    constructor(scene: Phaser.Scene, private readonly def: CharacterDef, look: CharacterLook, equipment: Readonly<SavedEquipment> = {}) {
        this.body = new CharacterSprite(scene, def, look);
        this.wear(equipment);
        this.container = scene.add.container(0, 0, [this.body.container]);
        this.shadow = smoothSprite(scene.add.sprite(0, 0, '__DEFAULT'))
            .setTint(0x000000)
            .setAlpha(BODY_SHADOW_ALPHA)
            .setRotation(BODY_SHADOW_ROTATION)
            .setScale(1, BODY_SHADOW_SCALE_Y)
            .setDepth(DEPTH_GROUND_SHADOWS + 1)
            .setVisible(false);
    }

    /** Dresses it in this equipment (drawn as Survivors items; off/data/offItems.ts → offEquipmentLook). */
    public wear(equipment: Readonly<SavedEquipment>, tint: Readonly<{ weapon?: WeaponAttribute }> = {}): void {
        // Weapon and shield only from the equipment: the novice's starting look holds a Dagger (Off-6B: empty hands show empty).
        for (const slot of DRESSED_SLOTS) this.body.setLayer(slot, HELD_SLOTS.has(slot) ? undefined : this.def.appearance[slot], false);
        // Off-7B: a Sharp / Poison / Ancient weapon in its colour (offWeaponTint).
        this.body.wearEquipment(equipment, tint);
    }

    /** True while an attack or a flinch is showing. */
    public get isActing(): boolean {
        return this.actionLeftMs > 0;
    }

    /** Swings at, or flinches, looking one way, for `durationMs` (as Survivors' Player.act). */
    public act(action: PlayerState.Melee | PlayerState.Hurt, direction: Direction, durationMs: number): void {
        if (this.dead) return;
        this.actionLeftMs = durationMs;
        this.body.actionDurationMs = durationMs;
        // Restart the animation even if the previous one was still showing.
        this.body.setPose(PlayerState.IdleCombat, direction);
        this.body.setPose(action, direction);
    }

    /** Prepares a spell looking one way: the Cast animation over `durationMs` (it can't walk meanwhile). */
    public cast(direction: Direction, durationMs: number): void {
        if (this.dead) return;
        this.actionLeftMs = durationMs;
        this.body.actionDurationMs = durationMs;
        this.body.setPose(PlayerState.IdleCombat, direction);
        this.body.setPose(PlayerState.Cast, direction);
    }

    /** The spell was dropped or cast: back to standing at once. */
    public stopCasting(): void {
        if (this.dead || !this.isActing) return;
        this.actionLeftMs = 0;
        this.body.setPose(PlayerState.IdleCombat, this.body.direction);
    }

    /** Falls and stays down (the shadow goes, as Survivors' Player.die). */
    public die(direction: Direction): void {
        this.dead = true;
        this.actionLeftMs = 0;
        this.body.setPose(PlayerState.Die, direction);
    }

    /** Stands up again (coming back after dying). */
    public revive(): void {
        this.dead = false;
        this.body.setPose(PlayerState.IdleCombat, this.body.direction);
    }

    /** Places the feet where the mover is and picks the pose: standing, walking or running (`running`), or acting. */
    public update(mover: TileMover, running: boolean, deltaMs: number): void {
        mover.position(this.tile);
        this.x = this.tile.x * TILE_SIZE;
        this.y = this.tile.y * TILE_SIZE;
        this.actionLeftMs = Math.max(0, this.actionLeftMs - deltaMs);
        if (!this.dead && this.actionLeftMs <= 0) {
            const state = !mover.isMoving ? PlayerState.IdleCombat : running ? PlayerState.Run : PlayerState.Walk;
            this.body.setPose(state, mover.facing);
        }
        this.body.update(deltaMs);
        this.container.setPosition(this.x, this.y).setDepth(this.y);
        this.syncShadow();
    }

    /** Box around the drawn character (for fading the trees in front of it). */
    public getVisualBounds(): Phaser.Geom.Rectangle {
        return this.bounds.setTo(this.x - VISUAL_WIDTH / 2, this.y - VISUAL_HEIGHT, VISUAL_WIDTH, VISUAL_HEIGHT);
    }

    /** Copies the body's frame onto the shadow and pins it to the frame's bottom centre (sp-client ShadowManager). */
    private syncShadow(): void {
        const frame = this.body.bodyFrame();
        this.shadow.setVisible(frame !== undefined && !this.dead);
        if (!frame) return;
        if (this.shadow.frame !== frame) {
            this.shadow.setTexture(frame.texture.key, frame.name);
            this.shadow.setOrigin(0.5, 1);
        }
        const left = this.x - frame.pivotX * frame.width;
        const top = this.y - frame.pivotY * frame.height;
        this.shadow.setPosition(left + frame.width / 2, top + frame.height);
    }
}
