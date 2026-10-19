// Pantalla "Select Character" del Helbreath original (Fase 17A): sale al pulsar Play o Continue en el menú principal.
// Una partida guardada por personaje (SaveStore, mismo número de hueco): elegir un personaje con partida a medias la
// continúa, también desde Play. En Continue solo se pueden elegir esos; los demás se ven apagados.
// Cuatro huecos en fila; en cada uno, el personaje guardado (CharacterStore) caminando en el sitio y girando, con su
// nombre, su Level y su EXP debajo (Fase 20A), y "+N" en verde si tiene puntos sin repartir. Un hueco vacío lleva a
// Create Character (CharacterSelectScene).
// Como en el original: un clic marca el hueco y otro clic en el mismo empieza la partida (con el dedo, igual).
// A la derecha, los botones del original: Start, Create New Character, Delete Character (pide pulsarlo otra vez para
// confirmar) y Log Out, que aquí vuelve al menú principal. Change Password no tiene sentido sin cuentas: se ve apagado,
// y encima va "Level Set." (Fase 20A), que abre la ventana Character del personaje marcado para repartir sus puntos.
// Teclado: ←/→ cambia de hueco, Enter juega (o crea si está vacío), C abre la ventana Character, Supr borra, Esc vuelve.
// Mando: cruceta/stick, A, Y (Character) y B.
import Phaser from 'phaser';
import {
    SLOTS_BACKGROUND,
    SLOTS_BUTTON_HIT_PAD,
    SLOTS_BUTTON_LIT_OFFSET,
    SLOTS_BUTTONS,
    SLOTS_CHARACTER_SCALE,
    SLOTS_DIM_ALPHA,
    SLOTS_DISABLED_SHADE,
    SLOTS_EQUIPMENT_LIT_COLOR,
    SLOTS_EQUIPMENT_STYLE,
    SLOTS_HELP,
    SLOTS_HELP_STYLE,
    SLOTS_INPUT_DELAY_MS,
    SLOTS_LAYOUT,
    SLOTS_NAME_STYLE,
    SLOTS_SCALE,
    SLOTS_TEXT_STYLE,
    SLOTS_TEXTURE,
    SLOTS_TURN_MS,
} from '../config/characterSlots';
import { DEBUG_START } from '../config/debugStart';
import { CHARACTER_SLOT_COUNT } from '../data/characterSlots';
import { CHARACTERS, CHOSEN_CHARACTER_KEY } from '../data/characters';
import { CharacterSprite } from '../entities/CharacterSprite';
import { Direction } from '../hb/directions';
import { PlayerState } from '../hb/playerAppearance';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { RESUME_SLOT_KEY, saveStore } from '../systems/SaveStore';
import { formatTime } from '../utils/format';
import { totalExpForLevel } from '../data/characterLevel';
import type { CharacterInfoSceneData } from './CharacterInfoScene';
import type { EquipmentSceneData } from './EquipmentScene';
import type { CharacterSelectSceneData } from './CharacterSelectScene';
import { openOverlay } from './MenuOverlayScene';

/** 640x480 coordinates of the original image → screen pixels. */
function s(value: number): number {
    return Math.round(value * SLOTS_SCALE);
}

/** ?open=charinfo opens the window only the first time the screen shows. */
let debugInfoOpened = false;
/** ?open=equipment opens the Equipment screen only the first time. */
let debugEquipmentOpened = false;

/** The original turns the characters this way round (m_cMenuDir 1..8). */
const DIRECTIONS_CLOCKWISE = [
    Direction.South, Direction.SouthWest, Direction.West, Direction.NorthWest,
    Direction.North, Direction.NorthEast, Direction.East, Direction.SouthEast,
] as const;

interface Slot {
    frame: Phaser.GameObjects.Image;
    sprite: CharacterSprite | undefined;
}

interface Button {
    image: Phaser.GameObjects.Image;
    frame: number;
}

/** Play: every slot can be chosen. Continue: only the characters with a run in progress. */
export interface CharacterSlotsSceneData {
    mode?: 'play' | 'continue';
    /** Slot marked when the screen opens (back from the Character window). */
    focus?: number;
}

export class CharacterSlotsScene extends Phaser.Scene {
    private mode: NonNullable<CharacterSlotsSceneData['mode']> = 'play';
    private inputSystem!: InputSystem;
    private deleteKey: Phaser.Input.Keyboard.Key | undefined;
    private slots: Slot[] = [];
    private focused = 0;
    /** Delete was pressed once on this slot: the next press deletes it. */
    private deleteArmed: number | undefined;
    private helpText!: Phaser.GameObjects.Text;
    private openedAt = 0;
    private walkTime = 0;
    private initialFocus: number | undefined;

    constructor() {
        super('CharacterSlots');
    }

    init(data: CharacterSlotsSceneData): void {
        this.mode = data.mode ?? 'play';
        this.initialFocus = data.focus;
    }

    create(): void {
        this.slots = [];
        this.deleteArmed = undefined;
        this.walkTime = 0;
        this.openedAt = this.time.now;
        this.add.image(0, 0, SLOTS_BACKGROUND.texture, SLOTS_BACKGROUND.frame).setOrigin(0).setScale(SLOTS_SCALE);
        for (let i = 0; i < CHARACTER_SLOT_COUNT; i++) this.slots.push(this.createSlot(i));
        this.createButtons();
        this.helpText = this.add.text(s(SLOTS_HELP.x), s(SLOTS_HELP.y), '', {
            ...SLOTS_HELP_STYLE, lineSpacing: 2, wordWrap: { width: s(SLOTS_HELP.width) },
        }).setOrigin(0.5);

        this.inputSystem = new InputSystem(this);
        // Slots and buttons have their own click handlers: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
        this.deleteKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);

        // Back from the Character window: drawn again (Level, points) with the same slot marked.
        const onResume = () => this.scene.restart({ mode: this.mode, focus: this.focused });
        this.events.on(Phaser.Scenes.Events.RESUME, onResume);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));

        // Start on the latest run in Continue; otherwise on the first character (or the first slot if there is none).
        const first = this.initialFocus ?? (this.mode === 'continue' ? saveStore.newest : characterStore.all.findIndex((c) => c !== undefined));
        this.focus(Math.max(0, first));

        // ?open=charinfo (development only): the Character window of the first character with points, once.
        if (DEBUG_START.open === 'CharacterInfo' && !debugInfoOpened) {
            debugInfoOpened = true;
            const withPoints = characterStore.all.findIndex((c) => (c?.unspentPoints ?? 0) > 0);
            this.focus(withPoints >= 0 ? withPoints : Math.max(0, first));
            this.time.delayedCall(0, () => this.openCharacterInfo());
        }
        // ?open=equipment (development only): the Equipment screen of the warrior (&class=mage: the mage; or the first
        // character), once.
        if (DEBUG_START.open === 'Equipment' && !debugEquipmentOpened) {
            debugEquipmentOpened = true;
            const wanted = DEBUG_START.openClass ?? 'warrior';
            const index = characterStore.all.findIndex((c) => c?.classId === wanted);
            this.focus(index >= 0 ? index : Math.max(0, first));
            this.time.delayedCall(0, () => this.openEquipment());
        }
    }

    /** In Continue, characters without a run in progress (and empty slots) are greyed out and can't be chosen. */
    private canChoose(index: number): boolean {
        return this.mode === 'play' || (characterStore.get(index) !== undefined && saveStore.get(index) !== undefined);
    }

    /** Next slot that can be chosen in that direction (the same one if there is none). */
    private step(direction: number): number {
        for (let n = 1; n <= CHARACTER_SLOT_COUNT; n++) {
            const index = (this.focused + direction * n + CHARACTER_SLOT_COUNT * n) % CHARACTER_SLOT_COUNT;
            if (this.canChoose(index)) return index;
        }
        return this.focused;
    }

    override update(_time: number, delta: number): void {
        this.updateCharacters(delta);
        const input = this.inputSystem;
        input.update();
        const deletePressed = this.deleteKey !== undefined && Phaser.Input.Keyboard.JustDown(this.deleteKey);
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuLeft)) this.focus(this.step(-1));
        if (input.justPressed(Action.MenuRight)) this.focus(this.step(1));
        if (input.justPressed(Action.Confirm)) this.enter(this.focused);
        if (input.justPressed(Action.Back)) this.scene.start('MainMenu');
        if (input.justPressed(Action.ToggleStats)) this.openCharacterInfo();
        if (input.justPressed(Action.OpenEquipment)) this.openEquipment();
        if (deletePressed) this.deleteFocused();
    }

    private createSlot(index: number): Slot {
        const { step, frame: f, character: c, textX, textY } = SLOTS_LAYOUT;
        const dx = index * step;
        const frame = this.add.image(s(f.x + dx), s(f.y), SLOTS_TEXTURE, f.normal).setOrigin(0).setScale(SLOTS_SCALE);
        frame.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.onSlotClicked(index);
        });
        const saved = characterStore.get(index);
        if (!saved) {
            this.add.text(s(textX + dx), s(textY[0] ?? 0), 'Empty', SLOTS_TEXT_STYLE).setOrigin(0.5).setAlpha(SLOTS_DIM_ALPHA);
            return { frame, sprite: undefined };
        }
        const def = CHARACTERS[saved.classId];
        const sprite = new CharacterSprite(this, def, saved.look, s(c.x + dx), s(c.y));
        sprite.container.setScale(SLOTS_CHARACTER_SCALE * SLOTS_SCALE);
        sprite.wearEquipment(saved.equipment);
        sprite.setPose(PlayerState.Walk, Direction.South);
        const lines: Array<[string, Phaser.Types.GameObjects.Text.TextStyle]> = [
            [saved.name, SLOTS_NAME_STYLE],
            [String(saved.level), SLOTS_TEXT_STYLE],
            [(totalExpForLevel(saved.level) + saved.exp).toLocaleString('en-US'), SLOTS_TEXT_STYLE],
        ];
        const texts = lines.map(([text, style], i) => this.add.text(s(textX + dx), s(textY[i] ?? 0), text, style).setOrigin(0.5));
        if (!this.canChoose(index)) {
            sprite.container.setAlpha(SLOTS_DIM_ALPHA);
            texts.forEach((text) => text.setAlpha(SLOTS_DIM_ALPHA));
        }
        return { frame, sprite };
    }

    private createButtons(): void {
        const { x, play, newCharacter, delete: del, unused, back } = SLOTS_BUTTONS;
        this.addButton(x, play.y, play.frame, () => this.enter(this.focused));
        this.addButton(x, newCharacter.y, newCharacter.frame, () => this.newCharacter());
        this.addButton(x, del.y, del.frame, () => this.deleteFocused());
        this.addButton(x, back.y, back.frame, () => this.scene.start('MainMenu'));
        this.add.rectangle(s(x), s(unused.y), s(unused.width), s(unused.height), SLOTS_DISABLED_SHADE.color, SLOTS_DISABLED_SHADE.alpha)
            .setOrigin(0).setStrokeStyle(1, SLOTS_DISABLED_SHADE.border);
        const { levelSet } = SLOTS_BUTTONS;
        const image = this.add.image(s(levelSet.x), s(levelSet.y), SLOTS_TEXTURE, levelSet.frame).setOrigin(0).setScale(SLOTS_SCALE);
        image.setInteractive({ useHandCursor: true });
        image.on(Phaser.Input.Events.POINTER_OVER, () => image.setFrame(levelSet.litFrame, false, false));
        image.on(Phaser.Input.Events.POINTER_OUT, () => image.setFrame(levelSet.frame, false, false));
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.openCharacterInfo();
        });
        const { equipment } = SLOTS_BUTTONS;
        const frame = this.add.rectangle(s(equipment.x), s(equipment.y), s(equipment.width), s(equipment.height), SLOTS_DISABLED_SHADE.color)
            .setOrigin(0).setStrokeStyle(1, SLOTS_DISABLED_SHADE.border);
        const label = this.add.text(s(equipment.x + equipment.width / 2), s(equipment.y + equipment.height / 2), 'Equipment', SLOTS_EQUIPMENT_STYLE)
            .setOrigin(0.5);
        const pad = SLOTS_BUTTON_HIT_PAD;
        frame.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-pad.x, -pad.y, frame.width + pad.x * 2, frame.height + pad.y * 2),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
        });
        frame.on(Phaser.Input.Events.POINTER_OVER, () => label.setColor(SLOTS_EQUIPMENT_LIT_COLOR));
        frame.on(Phaser.Input.Events.POINTER_OUT, () => label.setColor(SLOTS_EQUIPMENT_STYLE.color));
        frame.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.openEquipment();
        });
    }

    /** The Equipment screen of the marked character (Fase 20B). */
    private openEquipment(): void {
        const saved = characterStore.get(this.focused);
        if (!saved) {
            this.setHelp('This slot is empty.');
            return;
        }
        const data: EquipmentSceneData = { characterUid: saved.uid };
        openOverlay(this, 'Equipment', data);
    }

    /** The original Character window of the marked character: its Level, stats and the points to assign (Fase 20A). */
    private openCharacterInfo(): void {
        const saved = characterStore.get(this.focused);
        if (!saved) {
            this.setHelp('This slot is empty.');
            return;
        }
        const data: CharacterInfoSceneData = { characterUid: saved.uid, classId: saved.classId };
        openOverlay(this, 'CharacterInfo', data);
    }

    private addButton(x: number, y: number, frame: number, onClick: () => void): Button {
        const image = this.add.image(s(x), s(y), SLOTS_TEXTURE, frame).setOrigin(0).setScale(SLOTS_SCALE);
        const button: Button = { image, frame };
        const pad = SLOTS_BUTTON_HIT_PAD;
        const hitArea = new Phaser.Geom.Rectangle(-pad.x, -pad.y, image.width + pad.x * 2, image.height + pad.y * 2);
        image.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
        // setFrame(…, false, false): keeps size and origin. By default the lit frame's pivot would move the origin, and with
        // it the click area, away from the button (only the first click worked; bug list of 19-oct-2026, M7).
        image.on(Phaser.Input.Events.POINTER_OVER, () => image.setFrame(frame + SLOTS_BUTTON_LIT_OFFSET, false, false));
        image.on(Phaser.Input.Events.POINTER_OUT, () => image.setFrame(frame, false, false));
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) onClick();
        });
        return button;
    }

    /** As in the original: an empty slot opens Create Character; a character is marked first and plays on the second click. */
    private onSlotClicked(index: number): void {
        if (!this.canChoose(index)) {
            this.setHelp(characterStore.get(index) ? 'No saved run.' : 'Empty slot.');
            return;
        }
        if (!characterStore.get(index) || index === this.focused) this.enter(index);
        else this.focus(index);
    }

    private focus(index: number): void {
        this.focused = index;
        this.deleteArmed = undefined;
        this.slots.forEach((slot, i) => slot.frame.setFrame(i === index ? SLOTS_LAYOUT.frame.focused : SLOTS_LAYOUT.frame.normal));
        const saved = characterStore.get(index);
        const run = saveStore.get(index);
        const lines = saved
            ? [`${saved.name}, ${CHARACTERS[saved.classId].name}, Level ${saved.level}.`, `Best Power: ${saved.bestPower}.`]
            : ['Empty slot.'];
        if (saved && saved.unspentPoints > 0) lines.push(`${saved.unspentPoints} points to assign: Level Set.`);
        if (saved && run) lines.push(`Saved run: Power ${run.level}, ${formatTime(run.elapsedMs)}.`);
        else if (saved && this.mode === 'continue') lines.push('No saved run.');
        this.setHelp(lines.join('\n'));
    }

    /**
     * Plays with the character in that slot: its run in progress goes on (in Play too, decided 18-oct-2026), otherwise
     * a new run starts. An empty slot opens Create Character.
     */
    private enter(index: number): void {
        if (!this.canChoose(index)) return;
        const saved = characterStore.get(index);
        if (!saved) {
            this.scene.start('CharacterSelect', { slot: index } satisfies CharacterSelectSceneData);
            return;
        }
        this.registry.set(CHOSEN_CHARACTER_KEY, saved.classId);
        this.registry.set(ACTIVE_CHARACTER_KEY, saved.uid);
        if (saveStore.get(index)) this.registry.set(RESUME_SLOT_KEY, index);
        this.scene.start('Game');
    }

    private newCharacter(): void {
        const free = characterStore.firstFree;
        if (free < 0) {
            this.setHelp('All four slots are in use.\nDelete a character first.');
            return;
        }
        this.enter(free);
    }

    private deleteFocused(): void {
        const saved = characterStore.get(this.focused);
        if (!saved) {
            this.setHelp('This slot is empty.');
            return;
        }
        if (this.deleteArmed !== this.focused) {
            this.deleteArmed = this.focused;
            const run = saveStore.get(this.focused) ? ' and its saved run' : '';
            this.setHelp(`Delete ${saved.name}${run}?\nPress Delete again to confirm.`);
            return;
        }
        characterStore.delete(this.focused);
        // Rebuilt from scratch: the slot is drawn empty now.
        this.scene.restart();
    }

    private setHelp(text: string): void {
        this.helpText.setText(text);
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
