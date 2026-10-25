// El personaje de la ventana Character dibujado como en el original (M17): cuerpo y equipo en grande y quietos
// (piezas y posiciones en data/paperDoll.ts). Lo usan las ventanas Character y Equipment.
// Los dibujos se descargan la primera vez que hacen falta (~250-290 KB); mientras, se ve el muñeco animado de antes.
import Phaser from 'phaser';
import { HAIR_COLOR_SCALE, HAIR_COLORS, type CharacterLook } from '../data/appearance';
import type { CharacterDef } from '../data/characters';
import type { ItemAttribute } from '../data/attributes';
import type { EquipSlotId, SavedEquipment } from '../data/items';
import { PAPER_DOLL_SPRITES, paperDollPieces, type PaperDollPiece } from '../data/paperDoll';
import { colouredTexture, ensureAdditiveTexture, tintedKey } from '../hb/additiveTint';
import { Direction } from '../hb/directions';
import { getSheetKey } from '../hb/HBSprite';
import { PlayerState } from '../hb/playerAppearance';
import { lookLoader } from '../systems/LookLoader';
import { CharacterSprite } from './CharacterSprite';
import { smoothSprite } from '../hb/XbrPipeline';

export interface PaperDollPlacement {
    /** Top-left corner of the window on screen, and the window's scale. */
    x: number;
    y: number;
    scale: number;
    /** Feet of the animated stand-in, on screen. */
    standInX: number;
    standInY: number;
}

export class PaperDoll {
    private readonly container: Phaser.GameObjects.Container;
    private standIn: CharacterSprite | undefined;

    constructor(
        private readonly scene: Phaser.Scene,
        def: CharacterDef,
        look: CharacterLook,
        equipment: Readonly<SavedEquipment>,
        place: PaperDollPlacement,
        /** Attributes of the gear worn (Fase 21B): the weapon in its colour. */
        attributes: Readonly<Partial<Record<EquipSlotId, ItemAttribute>>> = {},
    ) {
        this.container = scene.add.container(place.x, place.y).setScale(place.scale);
        const key = PAPER_DOLL_SPRITES[look.gender];
        const pieces = paperDollPieces(def, look, equipment, attributes);
        if (lookLoader.isReady(scene, key)) {
            this.draw(key, pieces);
            return;
        }
        this.standIn = new CharacterSprite(scene, def, look, place.standInX, place.standInY);
        this.standIn.container.setScale(place.scale);
        this.standIn.wearEquipment(equipment, attributes);
        this.standIn.setPose(PlayerState.IdleCombat, Direction.South);
        void lookLoader.ensure(scene, [key]).then(() => {
            if (!this.container.active || !lookLoader.isReady(scene, key)) return;
            this.standIn?.destroy();
            this.standIn = undefined;
            this.draw(key, pieces);
        });
    }

    public update(deltaMs: number): void {
        this.standIn?.update(deltaMs);
    }

    public destroy(): void {
        this.standIn?.destroy();
        this.container.destroy();
    }

    private draw(spriteKey: typeof PAPER_DOLL_SPRITES[keyof typeof PAPER_DOLL_SPRITES], pieces: PaperDollPiece[]): void {
        const textures = this.scene.sys.textures;
        for (const piece of pieces) {
            const texture = this.textureOf(getSheetKey(spriteKey, piece.sheet), piece);
            if (!texture || !textures.get(texture).has(String(piece.frame))) continue;
            const image = smoothSprite(this.scene.add.image(piece.x, piece.y, texture, String(piece.frame)));
            if (piece.tint !== undefined) image.setTint(piece.tint);
            this.container.add(image);
        }
    }

    /** The sheet, or the hair's or weapon's copy with its colour added (as CharacterSprite does). */
    private textureOf(baseKey: string, piece: PaperDollPiece): string | undefined {
        const textures = this.scene.sys.textures;
        if (piece.added) return colouredTexture(textures, baseKey, piece.added);
        const color = piece.hairColor === undefined ? undefined : HAIR_COLORS[piece.hairColor];
        if (!color) return textures.exists(baseKey) ? baseKey : undefined;
        const key = tintedKey(baseKey, `hair${piece.hairColor}`);
        const add = color.add.map((value) => Math.round(value * HAIR_COLOR_SCALE)) as [number, number, number];
        return ensureAdditiveTexture(textures, baseKey, key, add) ? key : undefined;
    }
}
