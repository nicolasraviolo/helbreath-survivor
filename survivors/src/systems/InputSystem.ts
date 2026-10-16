// Traduce teclado, ratón y mando a acciones. El resto del juego nunca lee teclas ni botones
// directamente: pide `getMove()` o `justPressed(Action.X)`. Añadir un dispositivo nuevo
// (táctil en la Fase 9) solo toca este archivo.
//
// El mando se lee directamente de la Gamepad API del navegador en lugar del plugin de Phaser:
// el plugin descarta el mando si su `timestamp` es anterior al momento en que lo detectó, y en
// algunos navegadores/mandos ese reloj no coincide, así que nunca se movía.
import Phaser from 'phaser';
import { GAMEPAD_DEADZONE, POINTER_DEADZONE_PX, POINTER_FULL_SPEED_PX } from '../config/gameConfig';

export enum Action {
    /** Accept / continue: Enter, Space, gamepad A or a mouse click. */
    Confirm = 'confirm',
    /** Open / close the pause menu: Esc or gamepad Start. */
    Pause = 'pause',
    /** Move the highlight in menus (level-up cards): arrows/WASD, d-pad or a flick of the left stick. */
    MenuLeft = 'menuLeft',
    MenuRight = 'menuRight',
    /** Show / hide the stats panel: C or gamepad Y. */
    ToggleStats = 'toggleStats',
    ToggleDebug = 'toggleDebug',
    OpenSpriteTest = 'openSpriteTest',
    DebugSpawnMany = 'debugSpawnMany',
    DebugKillVisible = 'debugKillVisible',
    DebugGodMode = 'debugGodMode',
    DebugGiveXp = 'debugGiveXp',
}

export type InputDevice = 'keyboard' | 'mouse' | 'gamepad' | 'none';

const KEY = Phaser.Input.Keyboard.KeyCodes;

/** Keys per action. F1 is captured so the browser does not open its help page. */
const KEYBOARD_ACTIONS: Record<Action, number[]> = {
    [Action.Confirm]: [KEY.ENTER, KEY.SPACE],
    [Action.Pause]: [KEY.ESC],
    [Action.MenuLeft]: [KEY.LEFT, KEY.A],
    [Action.MenuRight]: [KEY.RIGHT, KEY.D],
    [Action.ToggleStats]: [KEY.C],
    [Action.ToggleDebug]: [KEY.F1],
    [Action.OpenSpriteTest]: [KEY.T],
    [Action.DebugSpawnMany]: [KEY.N],
    [Action.DebugKillVisible]: [KEY.K],
    [Action.DebugGodMode]: [KEY.G],
    [Action.DebugGiveXp]: [KEY.X],
};

/** Standard Gamepad API button indices (Xbox layout). */
const GAMEPAD_BUTTON = { A: 0, Y: 3, View: 8, Start: 9, DpadUp: 12, DpadDown: 13, DpadLeft: 14, DpadRight: 15 } as const;
const GAMEPAD_AXIS = { LeftX: 0, LeftY: 1 } as const;
/** Fake button ids for "the left stick was just pushed left/right" (menus). */
const STICK_BUTTON = { Left: 100, Right: 101 } as const;
/** How far the stick must be pushed to count as a menu move. */
const STICK_MENU_THRESHOLD = 0.5;

const GAMEPAD_ACTIONS: Partial<Record<Action, number[]>> = {
    [Action.Confirm]: [GAMEPAD_BUTTON.A],
    [Action.Pause]: [GAMEPAD_BUTTON.Start],
    [Action.MenuLeft]: [GAMEPAD_BUTTON.DpadLeft, STICK_BUTTON.Left],
    [Action.MenuRight]: [GAMEPAD_BUTTON.DpadRight, STICK_BUTTON.Right],
    [Action.ToggleStats]: [GAMEPAD_BUTTON.Y],
    [Action.ToggleDebug]: [GAMEPAD_BUTTON.View],
};

/** Actions also triggered by a mouse click. */
const POINTER_ACTIONS: ReadonlySet<Action> = new Set([Action.Confirm]);

/** World position the mouse movement is measured from (the player's feet). */
export type PointerAnchor = () => { x: number; y: number };

export class InputSystem {
    private readonly move = new Phaser.Math.Vector2();
    private readonly up: Phaser.Input.Keyboard.Key[] = [];
    private readonly down: Phaser.Input.Keyboard.Key[] = [];
    private readonly left: Phaser.Input.Keyboard.Key[] = [];
    private readonly right: Phaser.Input.Keyboard.Key[] = [];
    private readonly actionKeys = new Map<Action, Phaser.Input.Keyboard.Key[]>();
    private readonly padButtonsDown = new Set<number>();
    private readonly padJustPressed = new Set<number>();
    private pad: Gamepad | undefined;
    private pointerAnchor: PointerAnchor | undefined;
    private pointerMaxY = Number.POSITIVE_INFINITY;
    private pointerWasDown = false;
    private pointerJustPressed = false;
    private lastDevice: InputDevice = 'none';

    constructor(private readonly scene: Phaser.Scene) {
        const keyboard = scene.input.keyboard;
        if (keyboard) {
            this.up.push(keyboard.addKey(KEY.W), keyboard.addKey(KEY.UP));
            this.down.push(keyboard.addKey(KEY.S), keyboard.addKey(KEY.DOWN));
            this.left.push(keyboard.addKey(KEY.A), keyboard.addKey(KEY.LEFT));
            this.right.push(keyboard.addKey(KEY.D), keyboard.addKey(KEY.RIGHT));
            for (const [action, codes] of Object.entries(KEYBOARD_ACTIONS) as [Action, number[]][]) {
                this.actionKeys.set(action, codes.map((code) => keyboard.addKey(code)));
            }
        }
    }

    /** Enables "hold the mouse button to run towards the cursor", measured from this point. */
    public setPointerAnchor(anchor: PointerAnchor): void {
        this.pointerAnchor = anchor;
    }

    /** Ignores mouse presses that start at or below this screen Y (over the HUD bar), for movement and Confirm. */
    public setPointerMaxY(y: number): void {
        this.pointerMaxY = y;
    }

    /** Call once per frame before reading actions. */
    public update(): void {
        this.pad = readGamepad();
        this.padJustPressed.clear();
        const pressedNow = new Set<number>();
        this.pad?.buttons.forEach((button, index) => {
            if (button.pressed) pressedNow.add(index);
        });
        const stickX = this.pad?.axes[GAMEPAD_AXIS.LeftX] ?? 0;
        if (stickX <= -STICK_MENU_THRESHOLD) pressedNow.add(STICK_BUTTON.Left);
        if (stickX >= STICK_MENU_THRESHOLD) pressedNow.add(STICK_BUTTON.Right);
        for (const index of pressedNow) {
            if (!this.padButtonsDown.has(index)) this.padJustPressed.add(index);
        }
        this.padButtonsDown.clear();
        pressedNow.forEach((index) => this.padButtonsDown.add(index));

        const pointer = this.scene.input.activePointer;
        const pointerDown = pointer.isDown && pointer.downY < this.pointerMaxY;
        this.pointerJustPressed = pointerDown && !this.pointerWasDown;
        this.pointerWasDown = pointerDown;

        this.updateMove();
    }

    /**
     * Movement vector with length 0..1. Keyboard and d-pad give full speed (diagonals normalised);
     * the analog stick and the mouse give intermediate angles and speeds.
     */
    public getMove(): Readonly<Phaser.Math.Vector2> {
        return this.move;
    }

    public justPressed(action: Action): boolean {
        const keys = this.actionKeys.get(action) ?? [];
        if (keys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
            this.lastDevice = 'keyboard';
            return true;
        }
        if ((GAMEPAD_ACTIONS[action] ?? []).some((button) => this.padJustPressed.has(button))) {
            this.lastDevice = 'gamepad';
            return true;
        }
        if (this.pointerJustPressed && POINTER_ACTIONS.has(action)) {
            this.lastDevice = 'mouse';
            return true;
        }
        return false;
    }

    public getLastDevice(): InputDevice {
        return this.lastDevice;
    }

    /** Name of the detected gamepad, or undefined. Browsers only expose it after a button press. */
    public getGamepadName(): string | undefined {
        return this.pad?.id;
    }

    private updateMove(): void {
        const isDown = (keys: Phaser.Input.Keyboard.Key[]) => keys.some((key) => key.isDown);
        let x = Number(isDown(this.right)) - Number(isDown(this.left));
        let y = Number(isDown(this.down)) - Number(isDown(this.up));
        if (x !== 0 || y !== 0) {
            this.lastDevice = 'keyboard';
        } else {
            const padMove = this.readPadMove();
            const mouseMove = padMove ? undefined : this.readPointerMove();
            const other = padMove ?? mouseMove;
            if (other) {
                x = other.x;
                y = other.y;
                this.lastDevice = padMove ? 'gamepad' : 'mouse';
            }
        }

        this.move.set(x, y);
        if (this.move.lengthSq() > 1) {
            this.move.normalize();
        }
    }

    /** D-pad (full speed) or left stick (analog). Undefined when the pad is idle. */
    private readPadMove(): { x: number; y: number } | undefined {
        const pad = this.pad;
        if (!pad) return undefined;
        const pressed = (index: number) => pad.buttons[index]?.pressed === true;
        const dx = Number(pressed(GAMEPAD_BUTTON.DpadRight)) - Number(pressed(GAMEPAD_BUTTON.DpadLeft));
        const dy = Number(pressed(GAMEPAD_BUTTON.DpadDown)) - Number(pressed(GAMEPAD_BUTTON.DpadUp));
        if (dx !== 0 || dy !== 0) {
            return { x: dx, y: dy };
        }
        const stick = applyRadialDeadzone(pad.axes[GAMEPAD_AXIS.LeftX] ?? 0, pad.axes[GAMEPAD_AXIS.LeftY] ?? 0, GAMEPAD_DEADZONE);
        return stick.x !== 0 || stick.y !== 0 ? stick : undefined;
    }

    /** While the left mouse button is held: towards the cursor, slower when it is close. */
    private readPointerMove(): { x: number; y: number } | undefined {
        const pointer = this.scene.input.activePointer;
        if (!this.pointerAnchor || !pointer.isDown || pointer.wasTouch || pointer.downY >= this.pointerMaxY) return undefined;
        const anchor = this.pointerAnchor();
        const target = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const dx = target.x - anchor.x;
        const dy = target.y - anchor.y;
        const distance = Math.hypot(dx, dy);
        if (distance < POINTER_DEADZONE_PX) return undefined;
        const speed = Math.min(1, distance / POINTER_FULL_SPEED_PX);
        return { x: (dx / distance) * speed, y: (dy / distance) * speed };
    }
}

/** First connected gamepad, preferring the standard (Xbox-like) mapping. */
function readGamepad(): Gamepad | undefined {
    if (typeof navigator.getGamepads !== 'function') return undefined;
    const pads = navigator.getGamepads().filter((pad): pad is Gamepad => pad !== null && pad.connected);
    return pads.find((pad) => pad.mapping === 'standard') ?? pads[0];
}

/** Ignores small stick offsets and rescales the rest so speed still grows smoothly from 0 to 1. */
function applyRadialDeadzone(x: number, y: number, deadzone: number): { x: number; y: number } {
    const length = Math.hypot(x, y);
    if (length < deadzone) {
        return { x: 0, y: 0 };
    }
    const scaled = Math.min(1, (length - deadzone) / (1 - deadzone));
    return { x: (x / length) * scaled, y: (y / length) * scaled };
}
