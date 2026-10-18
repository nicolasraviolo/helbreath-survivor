// Joystick táctil flotante (Fase 9): al poner el dedo en la zona de juego aparece una base en ese punto y el mando
// sigue al dedo. Da una dirección y una fuerza de 0 a 1, como el stick del mando. Al levantar el dedo desaparece.
// Se dibuja fijo en pantalla (no se mueve con la cámara). InputSystem lo lee con `vector`.
// También funciona en las franjas negras de los lados (fuera del dibujo del juego): allí no se puede dibujar, así que
// la base se ve pegada al borde más cercano del juego y el mando se mueve igual que el dedo.
// Phaser avisa de que el dedo se apoya también fuera del dibujo (POINTER_DOWN_OUTSIDE), pero ignora sus movimientos
// fuera de él, así que el movimiento y el levantar el dedo se leen directamente de los eventos táctiles del navegador.
// Fase 15C: la misma clase sirve para el stick de mover y el de apuntar; cada uno con su color y su zona de la
// pantalla (`accepts` decide si un dedo que se apoya en (x, y) le toca a este stick).
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import type { TouchStickStyle } from '../config/touch';

/** Whether a finger landing at (x, y) (game pixels; x can be outside 0..GAME_WIDTH on the margins) opens this stick. */
export type TouchStickZone = (x: number, y: number, maxY: number) => boolean;

/** Fake finger id for ?debug=aimstick (browsers give real fingers ids from 0 up). */
const DEBUG_TOUCH_ID = -1;

export class TouchJoystick {
    private readonly base: Phaser.GameObjects.Graphics;
    private readonly knob: Phaser.GameObjects.Graphics;
    private readonly value = new Phaser.Math.Vector2();
    /** Where the stick is centred, in game pixels (can be outside the picture, on the margins). */
    private readonly centre = new Phaser.Math.Vector2();
    /** Browser id of the finger on the joystick. */
    private touchId: number | undefined;
    /** The finger left the deadzone at least once since it landed (the stick has given a direction). */
    private wasPushed = false;

    constructor(
        private readonly scene: Phaser.Scene,
        /** The joystick only starts on touches above this screen Y (not on the HUD bar), or on the side margins. */
        private maxY: number,
        depth: number,
        private readonly style: Readonly<TouchStickStyle>,
        private readonly accepts: TouchStickZone = () => true,
    ) {
        const j = style;
        this.base = scene.add.graphics()
            .fillStyle(j.baseColor, j.baseAlpha).fillCircle(0, 0, j.radius)
            .lineStyle(j.ringWidth, j.ringColor, j.ringAlpha).strokeCircle(0, 0, j.radius)
            .setScrollFactor(0).setDepth(depth).setVisible(false);
        this.knob = scene.add.graphics()
            .fillStyle(j.knobColor, j.knobAlpha).fillCircle(0, 0, j.knobRadius)
            .setScrollFactor(0).setDepth(depth + 1).setVisible(false);

        const input = scene.input;
        input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
        input.on(Phaser.Input.Events.POINTER_DOWN_OUTSIDE, this.onDown, this);
        const onMove = (event: TouchEvent) => this.onTouchMove(event);
        const onEnd = (event: TouchEvent) => this.onTouchEnd(event);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd, { passive: true });
        window.addEventListener('touchcancel', onEnd, { passive: true });
        const release = () => this.release();
        // A paused scene misses the finger lifting: start fresh when the game comes back.
        scene.events.on(Phaser.Scenes.Events.PAUSE, release);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
            input.off(Phaser.Input.Events.POINTER_DOWN_OUTSIDE, this.onDown, this);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('touchcancel', onEnd);
            scene.events.off(Phaser.Scenes.Events.PAUSE, release);
        });
    }

    /** Direction and strength (length 0..1); zero while no finger is on it. */
    public get vector(): Readonly<Phaser.Math.Vector2> {
        return this.value;
    }

    public get active(): boolean {
        return this.touchId !== undefined;
    }

    /** A finger is on it and has pushed it out of the deadzone at least once (it may be resting in the centre now). */
    public get pushed(): boolean {
        return this.wasPushed;
    }

    /** Development (?debug=aimstick): a pretend finger at (x, y) pushed by (dx, dy); it stays until a real one replaces it. */
    public debugHold(x: number, y: number, dx: number, dy: number): void {
        this.release();
        this.touchId = DEBUG_TOUCH_ID;
        this.centre.set(x, y);
        this.base.setVisible(true);
        this.knob.setVisible(true);
        this.moveTo(x + dx, y + dy);
    }

    /** The game area grew or shrank (the HUD style changed in the settings). */
    public setMaxY(maxY: number): void {
        this.maxY = maxY;
    }
    private onDown(pointer: Phaser.Input.Pointer): void {
        const inMargin = pointer.x < 0 || pointer.x > GAME_WIDTH;
        if (!pointer.wasTouch || (this.touchId !== undefined && this.touchId !== DEBUG_TOUCH_ID) || (pointer.y >= this.maxY && !inMargin)) return;
        if (!this.accepts(pointer.x, pointer.y, this.maxY)) return;
        this.wasPushed = false;
        this.touchId = pointer.identifier;
        this.centre.set(pointer.x, pointer.y);
        this.base.setVisible(true);
        this.knob.setVisible(true);
        this.value.set(0, 0);
        this.draw(0, 0);
    }

    private onTouchMove(event: TouchEvent): void {
        const touch = this.findTouch(event);
        if (!touch || this.scene.scene.isPaused()) return;
        const scale = this.scene.scale;
        this.moveTo(scale.transformX(touch.pageX), scale.transformY(touch.pageY));
    }

    private onTouchEnd(event: TouchEvent): void {
        if (this.findTouch(event)) this.release();
    }

    private findTouch(event: TouchEvent): Touch | undefined {
        if (this.touchId === undefined) return undefined;
        return Array.from(event.changedTouches).find((touch) => touch.identifier === this.touchId);
    }

    /** Finger at (x, y) in game pixels. */
    private moveTo(x: number, y: number): void {
        const { radius, deadzone, baseFollows } = this.style;
        let dx = x - this.centre.x;
        let dy = y - this.centre.y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius && baseFollows) {
            // Drag the base along so the knob stays on its edge.
            this.centre.x += (dx / distance) * (distance - radius);
            this.centre.y += (dy / distance) * (distance - radius);
            dx = x - this.centre.x;
            dy = y - this.centre.y;
        }
        const reach = Math.hypot(dx, dy);
        const length = Math.min(1, reach / radius);
        // The knob never leaves the ring.
        const clamp = reach > radius ? radius / reach : 1;
        this.draw(dx * clamp, dy * clamp);
        if (length < deadzone) {
            this.value.set(0, 0);
        } else {
            const angle = Math.atan2(dy, dx);
            const strength = (length - deadzone) / (1 - deadzone);
            this.wasPushed = true;
            this.value.set(Math.cos(angle) * strength, Math.sin(angle) * strength);
        }
    }

    /** Places the base (kept inside the game picture) and the knob at this offset from it. */
    private draw(knobX: number, knobY: number): void {
        const { radius } = this.style;
        const x = Phaser.Math.Clamp(this.centre.x, radius, GAME_WIDTH - radius);
        const y = Phaser.Math.Clamp(this.centre.y, radius, this.maxY - radius);
        this.base.setPosition(x, y);
        this.knob.setPosition(x + knobX, y + knobY);
    }

    private release(): void {
        this.touchId = undefined;
        this.wasPushed = false;
        this.value.set(0, 0);
        this.base.setVisible(false);
        this.knob.setVisible(false);
    }
}
