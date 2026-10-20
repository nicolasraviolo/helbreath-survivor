// Traduce teclado, ratón y mando a acciones. El resto del juego nunca lee teclas ni botones
// directamente: pide `getMove()` o `justPressed(Action.X)`. El táctil (Fase 9) llega por el joystick flotante
// (ui/TouchJoystick.ts), que la partida conecta con `setTouchJoystick`.
// Apuntado manual (Fase 15B): mantener el clic derecho apunta al cursor y el stick derecho del mando apunta hacia
// donde se empuja (`getManualAim()`). El clic izquierdo sigue moviendo.
// Fase 15C: en el táctil, el segundo stick (mitad derecha, `setTouchAimStick`) apunta igual que el stick derecho.
//
// Fase 19C: el Critical Strike y el panel de stats usan la tecla y el botón elegidos en Settings → Controls
// (config/controls.ts); se leen de los ajustes en cada pulsación, así que un cambio vale al momento.
//
// El mando se lee directamente de la Gamepad API del navegador en lugar del plugin de Phaser:
// el plugin descarta el mando si su `timestamp` es anterior al momento en que lo detectó, y en
// algunos navegadores/mandos ese reloj no coincide, así que nunca se movía.
import Phaser from 'phaser';
import { DEFAULT_CONTROLS, GAMEPAD_BUTTON, type RemappableControl } from '../config/controls';
import { GAMEPAD_DEADZONE, POINTER_DEADZONE_PX, POINTER_FULL_SPEED_PX } from '../config/gameConfig';
import { MANUAL_AIM } from '../data/targeting';
import { settings } from './Settings';
import type { ManualAim } from './Targeting';
import type { TouchJoystick } from '../ui/TouchJoystick';

export enum Action {
    /** Accept / continue: Enter, Space, gamepad A or a mouse click. */
    Confirm = 'confirm',
    /**
     * Pick a level-up card or a Game Over option: like Confirm but without Space, which launches the Critical Strike
     * during the run (a Space mashed as the cards open must not pick one).
     */
    Pick = 'pick',
    /**
     * Critical Strike of the Warrior (Fase 19A) / Meteor Strike of the Mage: Space or gamepad R2 by default, changeable in
     * Settings → Controls (the touch button calls the game directly).
     */
    CritStrike = 'critStrike',
    /** Open / close the pause menu: Esc or gamepad Start. */
    Pause = 'pause',
    /** Go back / close a menu: Esc, Backspace or gamepad B. */
    Back = 'back',
    /** Move the highlight in menus (level-up cards): arrows/WASD, d-pad or a flick of the left stick. */
    MenuLeft = 'menuLeft',
    MenuRight = 'menuRight',
    MenuUp = 'menuUp',
    MenuDown = 'menuDown',
    /** Take back a point in the Character window (Fase 20A). */
    Decrease = 'decrease',
    /** Open the Equipment screen from Select Character (Fase 20B): I or gamepad X. */
    OpenEquipment = 'openEquipment',
    /** Open the shared warehouse from Select Character (Fase 21D): O or gamepad R1. */
    OpenWarehouse = 'openWarehouse',
    /** Show / hide the stats panel: C or gamepad Y by default, changeable in Settings → Controls. */
    ToggleStats = 'toggleStats',
    ToggleDebug = 'toggleDebug',
    OpenSpriteTest = 'openSpriteTest',
    DebugSpawnMany = 'debugSpawnMany',
    DebugKillVisible = 'debugKillVisible',
    DebugGodMode = 'debugGodMode',
    DebugGiveXp = 'debugGiveXp',
    DebugAddStr = 'debugAddStr',
    DebugAddMagic = 'debugAddMagic',
    DebugDropPickups = 'debugDropPickups',
    DebugSkipMinute = 'debugSkipMinute',
    DebugGiveLevels = 'debugGiveLevels',
    DebugNextBoss = 'debugNextBoss',
    DebugInfiniteCrits = 'debugInfiniteCrits',
    DebugSlashStyle = 'debugSlashStyle',
}

export type InputDevice = 'keyboard' | 'mouse' | 'gamepad' | 'touch' | 'none';

const KEY = Phaser.Input.Keyboard.KeyCodes;

/** Actions whose key and button come from Settings → Controls (the lists below hold the defaults). */
const REMAPPABLE_ACTIONS: Partial<Record<Action, RemappableControl>> = {
    [Action.CritStrike]: 'critStrike',
    [Action.ToggleStats]: 'toggleStats',
};

/** Keys per action. F1 is captured so the browser does not open its help page. */
const KEYBOARD_ACTIONS: Record<Action, number[]> = {
    [Action.Confirm]: [KEY.ENTER, KEY.SPACE],
    [Action.Pick]: [KEY.ENTER],
    [Action.CritStrike]: [DEFAULT_CONTROLS.keyboard.critStrike],
    [Action.Pause]: [KEY.ESC],
    [Action.Back]: [KEY.ESC, KEY.BACKSPACE],
    [Action.MenuLeft]: [KEY.LEFT, KEY.A],
    [Action.MenuRight]: [KEY.RIGHT, KEY.D],
    [Action.MenuUp]: [KEY.UP, KEY.W],
    [Action.MenuDown]: [KEY.DOWN, KEY.S],
    [Action.Decrease]: [KEY.MINUS, KEY.NUMPAD_SUBTRACT],
    [Action.OpenEquipment]: [KEY.I],
    [Action.OpenWarehouse]: [KEY.O],
    [Action.ToggleStats]: [DEFAULT_CONTROLS.keyboard.toggleStats],
    [Action.ToggleDebug]: [KEY.F1],
    [Action.OpenSpriteTest]: [KEY.T],
    [Action.DebugSpawnMany]: [KEY.N],
    [Action.DebugKillVisible]: [KEY.K],
    [Action.DebugGodMode]: [KEY.G],
    [Action.DebugGiveXp]: [KEY.X],
    [Action.DebugAddStr]: [KEY.V],
    [Action.DebugAddMagic]: [KEY.B],
    [Action.DebugDropPickups]: [KEY.P],
    [Action.DebugSkipMinute]: [KEY.J],
    [Action.DebugGiveLevels]: [KEY.L],
    [Action.DebugNextBoss]: [KEY.M],
    [Action.DebugInfiniteCrits]: [KEY.H],
    [Action.DebugSlashStyle]: [KEY.Y],
};

const GAMEPAD_AXIS = { LeftX: 0, LeftY: 1, RightX: 2, RightY: 3 } as const;
/** Fake button ids for "the left stick was just pushed left/right/up/down" (menus). */
const STICK_BUTTON = { Left: 100, Right: 101, Up: 102, Down: 103 } as const;
/** How far the stick must be pushed to count as a menu move. */
const STICK_MENU_THRESHOLD = 0.5;

const GAMEPAD_ACTIONS: Partial<Record<Action, number[]>> = {
    [Action.Confirm]: [GAMEPAD_BUTTON.A],
    [Action.Pick]: [GAMEPAD_BUTTON.A],
    // R2 = right trigger (standard mapping): `pressed` once pushed past the browser's threshold.
    [Action.CritStrike]: [DEFAULT_CONTROLS.gamepad.critStrike],
    [Action.Pause]: [GAMEPAD_BUTTON.Start],
    [Action.Back]: [GAMEPAD_BUTTON.B],
    [Action.MenuLeft]: [GAMEPAD_BUTTON.DpadLeft, STICK_BUTTON.Left],
    [Action.MenuRight]: [GAMEPAD_BUTTON.DpadRight, STICK_BUTTON.Right],
    [Action.MenuUp]: [GAMEPAD_BUTTON.DpadUp, STICK_BUTTON.Up],
    [Action.MenuDown]: [GAMEPAD_BUTTON.DpadDown, STICK_BUTTON.Down],
    [Action.Decrease]: [GAMEPAD_BUTTON.X],
    [Action.OpenEquipment]: [GAMEPAD_BUTTON.X],
    [Action.OpenWarehouse]: [GAMEPAD_BUTTON.R1],
    [Action.ToggleStats]: [DEFAULT_CONTROLS.gamepad.toggleStats],
    [Action.ToggleDebug]: [GAMEPAD_BUTTON.View],
};

/** Actions also triggered by a mouse click. */
const POINTER_ACTIONS: ReadonlySet<Action> = new Set([Action.Confirm, Action.Pick]);

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
    private joystick: TouchJoystick | undefined;
    private aimStick: TouchJoystick | undefined;
    private pointerMaxY = Number.POSITIVE_INFINITY;
    private pointerWasDown = false;
    private pointerJustPressed = false;
    private lastDevice: InputDevice = 'none';
    private readonly manualAim: ManualAim = { dirX: 0, dirY: 0, point: undefined };
    private readonly aimPoint = { x: 0, y: 0 };
    private aiming = false;
    /** Development: aim this way all the time (?debug=aim), to check it without a mouse. */
    private forcedAim: { x: number; y: number } | undefined;
    /**
     * The next update only records what is held, without "just pressed": a button still held from the previous
     * screen, or pressed while this scene was paused (it doesn't update then), must not trigger anything here.
     */
    private syncHeldOnly = true;
    /** False while a text box is being typed in (Fase 17A): the letters must not move menus or confirm. */
    private keyboardEnabled = true;

    constructor(private readonly scene: Phaser.Scene) {
        const sync = () => {
            this.syncHeldOnly = true;
        };
        scene.events.on(Phaser.Scenes.Events.RESUME, sync);
        scene.events.on(Phaser.Scenes.Events.WAKE, sync);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            scene.events.off(Phaser.Scenes.Events.RESUME, sync);
            scene.events.off(Phaser.Scenes.Events.WAKE, sync);
        });
        const keyboard = scene.input.keyboard;
        if (keyboard) {
            this.up.push(keyboard.addKey(KEY.W), keyboard.addKey(KEY.UP));
            this.down.push(keyboard.addKey(KEY.S), keyboard.addKey(KEY.DOWN));
            this.left.push(keyboard.addKey(KEY.A), keyboard.addKey(KEY.LEFT));
            this.right.push(keyboard.addKey(KEY.D), keyboard.addKey(KEY.RIGHT));
            for (const [action, codes] of Object.entries(KEYBOARD_ACTIONS) as [Action, number[]][]) {
                this.actionKeys.set(action, codes.map((code) => keyboard.addKey(code)));
            }
            // The keys picked in Settings → Controls, added now so their first press is not missed.
            for (const action of Object.keys(REMAPPABLE_ACTIONS) as Action[]) this.keysFor(action);
        }
    }

    /** Enables "hold the mouse button to run towards the cursor", measured from this point. */
    public setPointerAnchor(anchor: PointerAnchor): void {
        this.pointerAnchor = anchor;
    }

    /** Movement from the on-screen touch joystick. */
    public setTouchJoystick(joystick: TouchJoystick): void {
        this.joystick = joystick;
    }

    /** Aim from the second touch stick (Fase 15C). */
    public setTouchAimStick(stick: TouchJoystick): void {
        this.aimStick = stick;
    }

    /** Ignores mouse presses that start at or below this screen Y (over the HUD bar), for movement and Confirm. */
    public setPointerMaxY(y: number): void {
        this.pointerMaxY = y;
    }

    /** Turns the keyboard actions off while typing a name; the gamepad and the pointer keep working. */
    public setKeyboardEnabled(enabled: boolean): void {
        this.keyboardEnabled = enabled;
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
        const stickY = this.pad?.axes[GAMEPAD_AXIS.LeftY] ?? 0;
        if (stickY <= -STICK_MENU_THRESHOLD) pressedNow.add(STICK_BUTTON.Up);
        if (stickY >= STICK_MENU_THRESHOLD) pressedNow.add(STICK_BUTTON.Down);
        for (const index of pressedNow) {
            if (!this.padButtonsDown.has(index) && !this.syncHeldOnly) this.padJustPressed.add(index);
        }
        this.padButtonsDown.clear();
        pressedNow.forEach((index) => this.padButtonsDown.add(index));

        const pointer = this.scene.input.activePointer;
        // A finger on a stick is not a click / tap. Only the left button (or a finger): the right one aims.
        const onStick = this.joystick?.active === true || this.aimStick?.active === true;
        const pointerDown = pointer.leftButtonDown() && pointer.downY < this.pointerMaxY && !(pointer.wasTouch && onStick);
        this.pointerJustPressed = pointerDown && !this.pointerWasDown && !this.syncHeldOnly;
        this.pointerWasDown = pointerDown;
        this.syncHeldOnly = false;

        this.updateMove();
        this.updateAim();
    }

    /** Where the player aims by hand this frame, or undefined (the weapons aim on their own). Reused: read it right away. */
    public getManualAim(): Readonly<ManualAim> | undefined {
        return this.aiming ? this.manualAim : undefined;
    }

    /** Development (?debug=aim): aim towards (x, y) all the time; undefined = stop. */
    public setForcedAim(direction: { x: number; y: number } | undefined): void {
        this.forcedAim = direction;
    }

    /**
     * Movement vector with length 0..1. Keyboard and d-pad give full speed (diagonals normalised);
     * the analog stick and the mouse give intermediate angles and speeds.
     */
    public getMove(): Readonly<Phaser.Math.Vector2> {
        return this.move;
    }

    public justPressed(action: Action): boolean {
        const keys = this.keysFor(action);
        // JustDown is read even when disabled, so a key typed into a text box doesn't fire once typing ends.
        const keyPressed = keys.map((key) => Phaser.Input.Keyboard.JustDown(key)).some(Boolean);
        if (keyPressed && this.keyboardEnabled) {
            this.lastDevice = 'keyboard';
            return true;
        }
        if (this.buttonsFor(action).some((button) => this.padJustPressed.has(button))) {
            this.lastDevice = 'gamepad';
            return true;
        }
        if (this.pointerJustPressed && POINTER_ACTIONS.has(action)) {
            this.lastDevice = 'mouse';
            return true;
        }
        return false;
    }

    /** Settings → Controls (Fase 19C): the first real gamepad button pressed this frame, or undefined. */
    public justPressedButton(): number | undefined {
        for (const index of this.padJustPressed) {
            if (index < STICK_BUTTON.Left) return index;
        }
        return undefined;
    }

    /** Keys of an action: the one picked in Settings → Controls for the remappable ones. */
    private keysFor(action: Action): Phaser.Input.Keyboard.Key[] {
        const control = REMAPPABLE_ACTIONS[action];
        const keyboard = this.scene.input.keyboard;
        if (!control || !keyboard) return this.actionKeys.get(action) ?? [];
        // addKey hands back the key already added for that code.
        return [keyboard.addKey(settings.current.controls.keyboard[control])];
    }

    private buttonsFor(action: Action): readonly number[] {
        const control = REMAPPABLE_ACTIONS[action];
        return control ? [settings.current.controls.gamepad[control]] : GAMEPAD_ACTIONS[action] ?? [];
    }

    /** True while a gamepad is connected (browsers only report it after a button press). */
    public get hasGamepad(): boolean {
        return this.pad !== undefined;
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
        } else if (this.joystick?.active) {
            x = this.joystick.vector.x;
            y = this.joystick.vector.y;
            this.lastDevice = 'touch';
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
        if (!this.pointerAnchor || !pointer.leftButtonDown() || pointer.wasTouch || pointer.downY >= this.pointerMaxY) return undefined;
        const anchor = this.pointerAnchor();
        const target = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
        const dx = target.x - anchor.x;
        const dy = target.y - anchor.y;
        const distance = Math.hypot(dx, dy);
        if (distance < POINTER_DEADZONE_PX) return undefined;
        const speed = Math.min(1, distance / POINTER_FULL_SPEED_PX);
        return { x: (dx / distance) * speed, y: (dy / distance) * speed };
    }

    /** Right stick first (it is being pushed on purpose), then the right mouse button held, then ?debug=aim. */
    private updateAim(): void {
        const pad = this.pad;
        const stick = pad
            ? applyRadialDeadzone(pad.axes[GAMEPAD_AXIS.RightX] ?? 0, pad.axes[GAMEPAD_AXIS.RightY] ?? 0, MANUAL_AIM.stickDeadzone)
            : { x: 0, y: 0 };
        const aim = this.manualAim;
        aim.point = undefined;
        this.aiming = true;
        if (stick.x !== 0 || stick.y !== 0) {
            this.setAimDirection(stick.x, stick.y);
            this.lastDevice = 'gamepad';
            return;
        }
        const touch = this.aimStick;
        if (touch?.pushed) {
            // Resting back in the centre keeps the last direction until the finger is lifted.
            if (touch.vector.x !== 0 || touch.vector.y !== 0) this.setAimDirection(touch.vector.x, touch.vector.y);
            this.lastDevice = 'touch';
            return;
        }
        const mouse = this.scene.input.mousePointer;
        if (mouse && this.pointerAnchor && mouse.rightButtonDown() && !mouse.wasTouch) {
            const anchor = this.pointerAnchor();
            const cursor = mouse.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
            this.aimPoint.x = cursor.x;
            this.aimPoint.y = cursor.y;
            // The cursor right on the feet gives no direction: keep the last one.
            if (Math.hypot(cursor.x - anchor.x, cursor.y - anchor.y) > 0) this.setAimDirection(cursor.x - anchor.x, cursor.y - anchor.y);
            aim.point = this.aimPoint;
            this.lastDevice = 'mouse';
            return;
        }
        if (this.forcedAim) {
            this.setAimDirection(this.forcedAim.x, this.forcedAim.y);
            return;
        }
        this.aiming = false;
    }

    private setAimDirection(x: number, y: number): void {
        const length = Math.hypot(x, y);
        this.manualAim.dirX = x / length;
        this.manualAim.dirY = y / length;
    }
}

/** First connected gamepad, preferring the standard (Xbox-like) mapping. */
export function readGamepad(): Gamepad | undefined {
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
