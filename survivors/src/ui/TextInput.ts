// Casilla de texto para escribir el nombre del personaje (Fase 17A). Phaser no tiene casillas de texto, así que se usa
// un <input> del navegador invisible: el dibujo lo hace la escena (en la caja del original) y el <input> solo recoge
// las letras. Así en el móvil, al tocar la caja, sale el teclado del teléfono.
// Mientras se escribe: Phaser deja de "capturar" teclas (si no, W, A, S, D o el espacio no llegarían al <input>) y el
// InputSystem de la escena ignora el teclado, para que las letras no muevan menús.
import Phaser from 'phaser';
import type { InputSystem } from '../systems/InputSystem';

/** Keys that the scene handles even while typing (create, cancel, move through the rows and change them). */
export type TextInputKey = 'Enter' | 'Escape' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';
const SCENE_KEYS: ReadonlySet<string> = new Set<TextInputKey>(['Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

/** Mouse (not a finger): typing can start straight away, there is no on-screen keyboard to open. */
export const TYPES_WITHOUT_TAPPING = !window.matchMedia('(pointer: coarse)').matches;

export interface TextInputOptions {
    initial: string;
    maxLength: number;
    /** Cleans what was typed (e.g. drops symbols). */
    clean: (value: string) => string;
    onChange: (value: string) => void;
    onKey: (key: TextInputKey) => void;
    /** Typing started or ended (to show or hide the cursor). */
    onFocusChange: (focused: boolean) => void;
}

export class TextInput {
    private readonly element: HTMLInputElement;
    private isFocused = false;
    private destroyed = false;

    constructor(private readonly scene: Phaser.Scene, private readonly inputSystem: InputSystem, private readonly options: TextInputOptions) {
        const el = document.createElement('input');
        el.type = 'text';
        el.maxLength = options.maxLength;
        el.value = options.initial;
        el.autocomplete = 'off';
        el.spellcheck = false;
        el.setAttribute('autocapitalize', 'off');
        el.setAttribute('aria-label', 'Character name');
        // Invisible but focusable. 16px stops iPhones from zooming in when it gets the focus.
        Object.assign(el.style, { position: 'fixed', left: '0', top: '0', width: '1px', height: '1px', opacity: '0', fontSize: '16px', border: '0', padding: '0' });
        el.addEventListener('input', () => {
            const cleaned = options.clean(el.value);
            if (cleaned !== el.value) el.value = cleaned;
            options.onChange(cleaned);
        });
        el.addEventListener('keydown', (event) => {
            if (!SCENE_KEYS.has(event.key)) return;
            event.preventDefault();
            options.onKey(event.key as TextInputKey);
        });
        el.addEventListener('focus', () => this.setFocused(true));
        el.addEventListener('blur', () => this.setFocused(false));
        document.body.appendChild(el);
        this.element = el;
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    }

    public get value(): string {
        return this.element.value;
    }

    public get focused(): boolean {
        return this.isFocused;
    }

    /** Call it from a click / tap handler: phones only open their keyboard then. */
    public focus(): void {
        this.element.focus();
        // Cursor at the end, not where the (invisible) click happened.
        const end = this.element.value.length;
        this.element.setSelectionRange(end, end);
    }

    public blur(): void {
        this.element.blur();
    }

    private setFocused(focused: boolean): void {
        if (focused === this.isFocused) return;
        this.isFocused = focused;
        const keyboard = this.scene.input.keyboard;
        if (focused) keyboard?.disableGlobalCapture();
        else keyboard?.enableGlobalCapture();
        this.inputSystem.setKeyboardEnabled(!focused);
        // While the scene shuts down its texts may already be gone: nothing to redraw then.
        if (!this.destroyed) this.options.onFocusChange(focused);
    }

    private destroy(): void {
        this.destroyed = true;
        this.blur();
        this.element.remove();
    }
}
