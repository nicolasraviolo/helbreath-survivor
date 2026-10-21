// NPC de la ciudad (Fase 23B): quieto, mirando a un lado, con su animación de respirar (la hoja de su dirección, 8
// frames, como sp-client/src/game/objects/NPC.ts), su sombra y el nombre encima. Su casilla queda bloqueada: el
// jugador lo rodea.
import Phaser from 'phaser';
import {
    BODY_SHADOW_ALPHA, BODY_SHADOW_ROTATION, BODY_SHADOW_SCALE_Y, DEFAULT_ANIMATION_FRAME_RATE, DEPTH_DAMAGE_NUMBERS, DEPTH_GROUND_SHADOWS, TILE_SIZE,
} from '../config/gameConfig';
import { TOWN_NPC_LOOK } from '../config/town';
import type { NpcDef, NpcId } from '../data/town';
import { HBAsset } from '../hb/HBAsset';
import type { HBMap } from '../hb/HBMap';
import { getSheetKey } from '../hb/HBSprite';
import type { Direction } from '../hb/directions';

export class Npc {
    /** Its feet: the centre of its tile. */
    public readonly x: number;
    public readonly y: number;
    private readonly body: HBAsset;
    private readonly shadow: Phaser.GameObjects.Sprite;
    private readonly name: Phaser.GameObjects.Text;
    private readonly talk: Phaser.GameObjects.Text;
    /** Height of its drawing above the feet (the tallest frame), for the name. */
    private readonly headHeight: number;

    constructor(scene: Phaser.Scene, public readonly id: NpcId, public readonly def: NpcDef, map: HBMap) {
        this.x = (def.tile.x + 0.5) * TILE_SIZE;
        this.y = (def.tile.y + 0.5) * TILE_SIZE;
        map.blockTile(def.tile.x, def.tile.y);
        const sprite = scene.add.existing(new HBAsset(scene, this.x, this.y, def.sprite));
        sprite.playDirectional({ baseSheet: 0, direction: def.direction as Direction, frameRate: DEFAULT_ANIMATION_FRAME_RATE, loop: true });
        sprite.setDepth(this.y);
        this.body = sprite;
        this.headHeight = tallestFrame(scene, getSheetKey(def.sprite, def.direction));
        this.shadow = scene.add.sprite(0, 0, getSheetKey(def.sprite, def.direction), '0')
            .setTint(0x000000)
            .setAlpha(BODY_SHADOW_ALPHA)
            .setRotation(BODY_SHADOW_ROTATION)
            .setScale(1, BODY_SHADOW_SCALE_Y)
            .setDepth(DEPTH_GROUND_SHADOWS + 1);
        const look = TOWN_NPC_LOOK;
        const nameY = this.y - this.headHeight - look.nameGap;
        // Over the map's objects, as names are in the original.
        this.name = scene.add.text(this.x, nameY, def.name, look.nameStyle).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS);
        this.talk = scene.add.text(this.x, nameY - this.name.height - look.talkGap, 'Talk', look.talkStyle)
            .setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS).setVisible(false);
    }

    /** Clicking (or tapping) the NPC itself also talks to it. */
    public onClick(action: () => void): void {
        this.body.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_UP, action);
        this.talk.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_UP, action);
    }

    /** Shows or hides "Talk" over its name (it pulses while shown). */
    public setTalkable(talkable: boolean, timeMs: number): void {
        this.talk.setVisible(talkable);
        if (!talkable) return;
        const look = TOWN_NPC_LOOK;
        const wave = (Math.sin((timeMs / look.talkPulseMs) * Math.PI) + 1) / 2;
        this.talk.setAlpha(look.talkPulseAlpha + (1 - look.talkPulseAlpha) * wave);
    }

    /** The shadow copies the current frame, pivoted on its bottom centre (as Enemy.syncDisplay). */
    public update(): void {
        const shadow = this.shadow;
        const frame = this.body.frame;
        if (shadow.frame !== frame) {
            shadow.setTexture(frame.texture.key, frame.name);
            shadow.setOrigin(0.5, 1);
        }
        const left = this.x - frame.pivotX * frame.width;
        const top = this.y - frame.pivotY * frame.height;
        shadow.setPosition(left + frame.width / 2, top + frame.height);
    }

    public distanceTo(x: number, y: number): number {
        return Math.hypot(x - this.x, y - this.y);
    }
}

/** Highest point above the feet among the frames of a sheet (the frames carry the original's pivot). */
function tallestFrame(scene: Phaser.Scene, textureKey: string): number {
    const texture = scene.textures.get(textureKey);
    let tallest = 0;
    for (const name of texture.getFrameNames()) {
        const frame = texture.get(name);
        tallest = Math.max(tallest, frame.pivotY * frame.height);
    }
    return tallest;
}
