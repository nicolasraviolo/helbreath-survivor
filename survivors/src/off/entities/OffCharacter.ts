// Helbreath Off (Fase Off-1): el personaje que anda por el mundo. Lo mueve TileMover casilla a casilla; aquí solo se
// dibuja: las capas de cuerpo y ropa de Survivors (CharacterSprite), quieto / andando / corriendo, y la sombra sacada
// del cuerpo desnudo como el jugador de Survivors (entities/Player.ts, syncShadow).
import Phaser from 'phaser';
import { BODY_SHADOW_ALPHA, BODY_SHADOW_ROTATION, BODY_SHADOW_SCALE_Y, DEPTH_GROUND_SHADOWS, TILE_SIZE } from '../../config/gameConfig';
import type { CharacterLook } from '../../data/appearance';
import type { CharacterDef } from '../../data/characters';
import { CharacterSprite } from '../../entities/CharacterSprite';
import { PlayerState } from '../../hb/playerAppearance';
import { smoothSprite } from '../../hb/XbrPipeline';
import type { TileMover, TilePoint } from '../systems/TileMover';

/** Approximate size of the drawn character, used to fade map objects that cover it (as Player). */
const VISUAL_WIDTH = 32;
const VISUAL_HEIGHT = 80;

export class OffCharacter {
    public readonly container: Phaser.GameObjects.Container;
    public x = 0;
    public y = 0;
    private readonly body: CharacterSprite;
    private readonly shadow: Phaser.GameObjects.Sprite;
    private readonly bounds = new Phaser.Geom.Rectangle();
    private readonly tile: TilePoint = { x: 0, y: 0 };

    constructor(scene: Phaser.Scene, def: CharacterDef, look: CharacterLook) {
        this.body = new CharacterSprite(scene, def, look);
        this.container = scene.add.container(0, 0, [this.body.container]);
        this.shadow = smoothSprite(scene.add.sprite(0, 0, '__DEFAULT'))
            .setTint(0x000000)
            .setAlpha(BODY_SHADOW_ALPHA)
            .setRotation(BODY_SHADOW_ROTATION)
            .setScale(1, BODY_SHADOW_SCALE_Y)
            .setDepth(DEPTH_GROUND_SHADOWS + 1)
            .setVisible(false);
    }

    /** Places the feet where the mover is and picks the pose: standing, walking or running (`running`). */
    public update(mover: TileMover, running: boolean, deltaMs: number): void {
        mover.position(this.tile);
        this.x = this.tile.x * TILE_SIZE;
        this.y = this.tile.y * TILE_SIZE;
        const state = !mover.isMoving ? PlayerState.IdleCombat : running ? PlayerState.Run : PlayerState.Walk;
        this.body.setPose(state, mover.facing);
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
        this.shadow.setVisible(frame !== undefined);
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
