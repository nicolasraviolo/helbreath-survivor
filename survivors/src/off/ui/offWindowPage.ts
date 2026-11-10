// Helbreath Off, Fase Off-12C: lo que la ventana del personaje (off/scenes/OffBagScene.ts) espera de una pestaña que
// vive en su propio archivo (Stats, Magic). La ventana dibuja la cabecera (pestañas y ✕) y la columna del personaje;
// la pestaña, la parte derecha. Cada pestaña lleva su foco: la ventana le pasa las flechas y, cuando la pestaña dice
// que se sale por arriba, el foco sube a la cabecera.
import type { InputSystem } from '../../systems/InputSystem';

export interface OffWindowPage {
    /** Arrows / d-pad. false = the move leaves the page at its top (the header takes the focus). */
    move(dx: number, dy: number): boolean;
    /** The focus comes in from the header. */
    focusFirst(): void;
    /** The focus goes to the header. */
    blur(): void;
    /** A / Enter on what has the focus. */
    pressFocused(): void;
    /** The page's own keys this frame (1–8, RT + A/B/X/Y, Delete...); true = it used them (the window then ignores B). */
    handleInput(input: InputSystem): boolean;
    /** Called every frame (values that change while the window is open). */
    update(): void;
    focusName(): string;
    debugState(): Record<string, unknown>;
}
