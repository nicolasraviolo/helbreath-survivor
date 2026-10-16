// Texto con la fuente dibujada del Helbreath original (sprfonts.spr, hoja 0): la letra caligráfica del libro de
// hechizos y de los avisos en pantalla. Cada carácter es un frame (código ASCII − 33, de '!' a 'z').
// Como CGame::PutString_SprFont2 del cliente original (reference/Client.cpp ~7880): cada letra se pinta en negro
// desplazada 1 px (a la derecha y abajo) y encima la letra de color, con el ancho propio de cada carácter.
// Las imágenes se reutilizan al cambiar el texto (sin crear objetos nuevos cada vez).
import Phaser from 'phaser';
import { getSheetKey } from './HBSprite';

const FONT_TEXTURE = getSheetKey('ui.font', 0);
const FIRST_CHAR = 33;
const LAST_CHAR = 122;
/** Advance of a space or of a character the font doesn't have. */
const SPACE_ADVANCE = 5;
/** Shadow copies, drawn under the coloured letter (PutString_SprFont2). */
const SHADOW_OFFSETS: ReadonlyArray<readonly [number, number]> = [[1, 0], [1, 1]];
const SHADOW_COLOR = 0x000000;

/** Advance in pixels of each character from '!' (reference/Client.cpp, __cSpace). */
const ADVANCE: readonly number[] = [
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 8, 7, 8, 8, 9, 10, 9, 7, 8, 8, 8, 8, 8, 8, 8,
    15, 16, 12, 17, 14, 15, 14, 16, 10, 13, 19, 10, 17, 17, 15, 14, 15, 16, 13, 17, 16, 16, 20, 17, 16, 14,
    8, 8, 8, 8, 8, 8, 8, 6, 7, 8, 7, 7, 7, 7, 4, 7, 7, 4, 11, 7, 8, 8, 7, 8, 6, 5, 8, 9, 14, 8, 9, 8, 8, 8, 8, 8,
    8, 8, 8, 8, 8, 8, 8,
];

export type SpriteTextAlign = 'left' | 'center' | 'right';

export class SpriteText {
    /** Place, scale, fade or nest it like any container. */
    public readonly container: Phaser.GameObjects.Container;
    private readonly glyphs: Phaser.GameObjects.Image[] = [];
    private readonly shadows: Phaser.GameObjects.Image[] = [];
    private text = '';
    private color: number;
    private textWidth = 0;

    constructor(
        private readonly scene: Phaser.Scene,
        x: number,
        y: number,
        text: string,
        color: number,
        private readonly align: SpriteTextAlign = 'left',
    ) {
        this.container = scene.add.container(x, y);
        this.color = color;
        this.setText(text);
    }

    public get width(): number {
        return this.textWidth;
    }

    public setText(text: string): this {
        if (text === this.text && this.glyphs.length > 0) return this;
        this.text = text;
        const frames: Array<{ frame: number; x: number }> = [];
        let x = 0;
        for (const char of text) {
            const code = char.charCodeAt(0);
            if (code >= FIRST_CHAR && code <= LAST_CHAR) {
                frames.push({ frame: code - FIRST_CHAR, x });
                x += ADVANCE[code - FIRST_CHAR] ?? SPACE_ADVANCE;
            } else {
                x += SPACE_ADVANCE;
            }
        }
        this.textWidth = x;
        const startX = this.align === 'left' ? 0 : this.align === 'center' ? -x / 2 : -x;
        frames.forEach(({ frame, x: glyphX }, i) => {
            SHADOW_OFFSETS.forEach(([dx, dy], s) => {
                const shadow = this.image(this.shadows, i * SHADOW_OFFSETS.length + s, SHADOW_COLOR);
                shadow.setFrame(frame).setPosition(startX + glyphX + dx, dy).setVisible(true);
            });
            this.image(this.glyphs, i, this.color).setFrame(frame).setPosition(startX + glyphX, 0).setVisible(true);
        });
        for (let i = frames.length; i < this.glyphs.length; i++) this.glyphs[i]?.setVisible(false);
        for (let i = frames.length * SHADOW_OFFSETS.length; i < this.shadows.length; i++) this.shadows[i]?.setVisible(false);
        return this;
    }

    public setColor(color: number): this {
        if (color === this.color) return this;
        this.color = color;
        for (const glyph of this.glyphs) glyph.setTintFill(color);
        return this;
    }

    /** Image number `index` of a list, created the first time. The letters are drawn as a flat colour (tintFill). */
    private image(list: Phaser.GameObjects.Image[], index: number, color: number): Phaser.GameObjects.Image {
        let image = list[index];
        if (!image) {
            image = this.scene.make.image({ x: 0, y: 0, key: FONT_TEXTURE, frame: 0 }, false).setOrigin(0, 0).setTintFill(color);
            list.push(image);
            // Shadows are added before the coloured letters, so they always stay under them.
            if (list === this.shadows) this.container.addAt(image, 0);
            else this.container.add(image);
        }
        return image;
    }
}
