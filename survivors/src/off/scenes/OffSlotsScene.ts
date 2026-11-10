// Helbreath Off (8-nov-2026): pantalla "Select Character" del original, copiada de la de Survivors
// (scenes/CharacterSlotsScene.ts; mismas medidas, fondo y botones, config/characterSlots.ts) con crear y borrar
// personajes como la de la Fase 17A. Sale al pulsar Play en la pantalla de Off si hay algún personaje.
// - Cuatro huecos (OffSaveStore): en cada uno el personaje caminando en el sitio y girando, vestido con su equipo, y
//   debajo su nombre, Level y EXP. Abajo, la ayuda del marcado: nombre, Level y su ciudad.
// - Start juega con el marcado (en un hueco vacío, abre Create New Character ahí). Create New Character abre la pantalla
//   de crear en el primer hueco libre. Delete Character pregunta (OffDialogScene, Off-13A) y borra. Log Out vuelve a la pantalla
//   de Off. Change Password se ve apagado, como en Survivors.
// - Como en el original: un clic marca el hueco y otro clic en el mismo juega.
// Teclado: ←/→ cambia de hueco, Enter juega, Supr borra, Esc vuelve. Mando: cruceta/stick, A, Y (borrar) y B.
import Phaser from 'phaser';
import {
    SLOTS_BACKGROUND,
    SLOTS_BUTTON_HIT_PAD,
    SLOTS_BUTTON_LIT_OFFSET,
    SLOTS_BUTTONS,
    SLOTS_CHARACTER_SCALE,
    SLOTS_DIM_ALPHA,
    SLOTS_DISABLED_SHADE,
    SLOTS_HELP,
    SLOTS_HELP_STYLE,
    SLOTS_INPUT_DELAY_MS,
    SLOTS_LAYOUT,
    SLOTS_NAME_STYLE,
    SLOTS_SCALE,
    SLOTS_TEXT_STYLE,
    SLOTS_TEXTURE,
    SLOTS_TURN_MS,
} from '../../config/characterSlots';
import { CharacterSprite } from '../../entities/CharacterSprite';
import { Direction } from '../../hb/directions';
import { PlayerState } from '../../hb/playerAppearance';
import { openOverlay } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_SLOTS } from '../config/offSlots';
import { offEquipmentLook } from '../data/offItems';
import { offLevelForExp } from '../data/offLevel';
import { OFF_PLACES, offHomePlace } from '../data/offPlaces';
import { OFF_NOVICE } from '../data/offWorld';
import { dressOffBody } from '../entities/OffCharacter';
import { OFF_CHARACTER_SLOT_COUNT, offSaveStore } from '../systems/OffSaveStore';
import { OFF_CREATE_SCENE_KEY, type OffCreateSceneData } from './OffCreateScene';
import { OFF_DIALOG_SCENE_KEY, type OffDialogSceneData } from './OffDialogScene';
import { OFF_DIALOG_TEXT } from '../config/offDialog';
import { startOffWorld } from './OffWorldScene';

export const OFF_SLOTS_SCENE_KEY = 'OffSlots';

/** 640x480 coordinates of the original image → screen pixels. */
function s(value: number): number {
    return Math.round(value * SLOTS_SCALE);
}

/** The original turns the characters this way round (m_cMenuDir 1..8). */
const DIRECTIONS_CLOCKWISE = [
    Direction.South, Direction.SouthWest, Direction.West, Direction.NorthWest,
    Direction.North, Direction.NorthEast, Direction.East, Direction.SouthEast,
] as const;

interface Slot {
    frame: Phaser.GameObjects.Image;
    sprite: CharacterSprite | undefined;
}

export interface OffSlotsSceneData {
    /** Slot marked when the screen opens (default: the one last played). */
    focus?: number;
}

export class OffSlotsScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private slots: Slot[] = [];
    private focused = 0;
    private helpText!: Phaser.GameObjects.Text;
    private openedAt = 0;
    private walkTime = 0;
    private initialFocus: number | undefined;

    constructor() {
        super(OFF_SLOTS_SCENE_KEY);
    }

    init(data: OffSlotsSceneData): void {
        this.initialFocus = data.focus;
    }

    create(): void {
        this.slots = [];
        this.walkTime = 0;
        this.openedAt = this.time.now;
        this.add.image(0, 0, SLOTS_BACKGROUND.texture, SLOTS_BACKGROUND.frame).setOrigin(0).setScale(SLOTS_SCALE);
        for (let i = 0; i < OFF_CHARACTER_SLOT_COUNT; i++) this.slots.push(this.createSlot(i));
        this.createButtons();
        this.helpText = this.add.text(s(SLOTS_HELP.x), s(SLOTS_HELP.y), '', {
            ...SLOTS_HELP_STYLE, lineSpacing: 2, wordWrap: { width: s(SLOTS_HELP.width) },
        }).setOrigin(0.5);

        this.inputSystem = new InputSystem(this);
        // Slots and buttons have their own click handlers: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);

        // Back from the delete question: drawn again with the same slot marked.
        const onResume = () => this.scene.restart({ focus: this.focused } satisfies OffSlotsSceneData);
        this.events.on(Phaser.Scenes.Events.RESUME, onResume);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));

        this.focus(this.initialFocus ?? offSaveStore.slot);
    }

    override update(_time: number, delta: number): void {
        this.updateCharacters(delta);
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuLeft)) this.focus(this.step(-1));
        if (input.justPressed(Action.MenuRight)) this.focus(this.step(1));
        if (input.justPressed(Action.Confirm)) this.enter(this.focused);
        if (input.justPressed(Action.OffDrop)) this.deleteFocused();
        if (input.justPressed(Action.Back)) this.logOut();
    }

    /** Next slot in that direction, going round. */
    private step(direction: number): number {
        return (this.focused + direction + OFF_CHARACTER_SLOT_COUNT) % OFF_CHARACTER_SLOT_COUNT;
    }

    private createSlot(index: number): Slot {
        const { step, frame: f, character: c, textX, textY } = SLOTS_LAYOUT;
        const dx = index * step;
        const frame = this.add.image(s(f.x + dx), s(f.y), SLOTS_TEXTURE, f.normal).setOrigin(0).setScale(SLOTS_SCALE);
        frame.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.onSlotClicked(index);
        });
        const saved = offSaveStore.peek(index);
        if (!saved) {
            this.add.text(s(textX + dx), s(textY[0] ?? 0), OFF_SLOTS.emptyLabel, SLOTS_TEXT_STYLE).setOrigin(0.5).setAlpha(SLOTS_DIM_ALPHA);
            return { frame, sprite: undefined };
        }
        const sprite = new CharacterSprite(this, OFF_NOVICE, saved.look, s(c.x + dx), s(c.y));
        sprite.container.setScale(SLOTS_CHARACTER_SCALE * SLOTS_SCALE);
        dressOffBody(sprite, OFF_NOVICE, offEquipmentLook(saved.equipment));
        sprite.setPose(PlayerState.Walk, Direction.South);
        const lines: Array<[string, Phaser.Types.GameObjects.Text.TextStyle]> = [
            [saved.name, SLOTS_NAME_STYLE],
            [String(offLevelForExp(saved.exp)), SLOTS_TEXT_STYLE],
            [saved.exp.toLocaleString('en-US'), SLOTS_TEXT_STYLE],
        ];
        lines.forEach(([text, style], i) => this.add.text(s(textX + dx), s(textY[i] ?? 0), text, style).setOrigin(0.5));
        return { frame, sprite };
    }

    private createButtons(): void {
        const { x, play, newCharacter, delete: del, unused, back } = SLOTS_BUTTONS;
        this.addButton(x, play.y, play.frame, () => this.enter(this.focused));
        this.addButton(x, newCharacter.y, newCharacter.frame, () => this.newCharacter());
        this.addButton(x, del.y, del.frame, () => this.deleteFocused());
        this.addButton(x, back.y, back.frame, () => this.logOut());
        // Change Password: not used, as in Survivors.
        this.add.rectangle(s(x), s(unused.y), s(unused.width), s(unused.height), SLOTS_DISABLED_SHADE.color, SLOTS_DISABLED_SHADE.alpha)
            .setOrigin(0).setStrokeStyle(1, SLOTS_DISABLED_SHADE.border);
    }

    private addButton(x: number, y: number, frame: number, onClick: () => void): void {
        const image = this.add.image(s(x), s(y), SLOTS_TEXTURE, frame).setOrigin(0).setScale(SLOTS_SCALE);
        const pad = SLOTS_BUTTON_HIT_PAD;
        const hitArea = new Phaser.Geom.Rectangle(-pad.x, -pad.y, image.width + pad.x * 2, image.height + pad.y * 2);
        image.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
        // setFrame(…, false, false): keeps size and origin, so the click area stays on the button (as Survivors).
        image.on(Phaser.Input.Events.POINTER_OVER, () => image.setFrame(frame + SLOTS_BUTTON_LIT_OFFSET, false, false));
        image.on(Phaser.Input.Events.POINTER_OUT, () => image.setFrame(frame, false, false));
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) onClick();
        });
    }

    /** As in the original: a character is marked first and plays on the second click. */
    private onSlotClicked(index: number): void {
        if (index === this.focused) this.enter(index);
        else this.focus(index);
    }

    private focus(index: number): void {
        this.focused = index;
        this.slots.forEach((slot, i) => slot.frame.setFrame(i === index ? SLOTS_LAYOUT.frame.focused : SLOTS_LAYOUT.frame.normal));
        const saved = offSaveStore.peek(index);
        if (!saved) {
            this.helpText.setText(OFF_SLOTS.emptyHelp);
            return;
        }
        const home = OFF_PLACES[offHomePlace(saved.faction)].name;
        const lines: string[] = [OFF_SLOTS.characterHelp(saved.name, offLevelForExp(saved.exp), home)];
        if (saved.points > 0) lines.push(OFF_SLOTS.pointsHelp(saved.points));
        lines.push(OFF_SLOTS.controlsHelp);
        this.helpText.setText(lines.join('\n'));
    }

    /** Start: plays with the character in that slot; on an empty slot, creates one there. */
    public enter(index: number): void {
        if (!offSaveStore.peek(index)) {
            this.openCreate(index);
            return;
        }
        offSaveStore.select(index);
        startOffWorld(this);
    }

    /** Create New Character: in the first empty slot. */
    public newCharacter(): void {
        const free = offSaveStore.firstFree;
        if (free < 0) {
            this.helpText.setText(OFF_SLOTS.fullHelp);
            return;
        }
        this.openCreate(free);
    }

    private openCreate(slot: number): void {
        this.scene.start(OFF_CREATE_SCENE_KEY, { slot } satisfies OffCreateSceneData);
    }

    /** Delete Character: asks first (OffDialogScene). */
    public deleteFocused(): void {
        if (!offSaveStore.peek(this.focused)) {
            this.helpText.setText(OFF_SLOTS.deleteEmptyHelp);
            return;
        }
        // Off-13A: the new question window; "No" marked first, so nobody is deleted by mistake.
        const slot = this.focused;
        const data: Omit<OffDialogSceneData, 'returnTo'> = {
            title: OFF_SLOTS.deleteTitle,
            question: OFF_SLOTS.deleteQuestion(offSaveStore.peek(slot)?.name ?? ''),
            warning: OFF_SLOTS.deleteWarning,
            buttons: [
                { label: OFF_DIALOG_TEXT.no, variant: 'normal' },
                // Select Character restarts when it resumes; the delete runs first, so it's drawn without the character.
                { label: OFF_DIALOG_TEXT.yes, variant: 'danger', onPress: () => offSaveStore.remove(slot) },
            ],
            focus: 0,
            cancel: 0,
        };
        openOverlay(this, OFF_DIALOG_SCENE_KEY, data);
    }

    private logOut(): void {
        this.scene.start('OffHome');
    }

    /** Every character walks in place; they all turn to the next direction together, as in the original. */
    private updateCharacters(delta: number): void {
        this.walkTime += delta;
        const turn = Math.floor(this.walkTime / SLOTS_TURN_MS) % DIRECTIONS_CLOCKWISE.length;
        const direction = DIRECTIONS_CLOCKWISE[turn] ?? Direction.South;
        for (const { sprite } of this.slots) {
            if (!sprite) continue;
            if (sprite.direction !== direction) sprite.setPose(PlayerState.Walk, direction);
            sprite.update(delta);
        }
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= SLOTS_INPUT_DELAY_MS;
    }
}
