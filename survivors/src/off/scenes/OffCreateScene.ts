// Helbreath Off: pantalla "Create New Character". Sale al pulsar Play sin personajes, desde Select Character (con el
// hueco donde va, `slot`) o con ?off=create. Fase Off-13F (10-nov-2026): rehecha entera con el estilo oscuro de la
// Off-12 (medidas y textos en off/config/offCreate.ts; antes era la tabla de madera del original con textos encima).
// - Detrás, la imagen del original muy oscurecida; encima, una ventana con dos columnas.
// - Izquierda: el nombre (caja de texto con contador; sin nombre se llama "Novice") y Random, que pone un nombre al azar
//   (con el mando no hay teclado: botón Y). El aspecto en 5 filas ◀ valor ▶ con el valor escrito ("Female", "Blond");
//   al abrir sale al azar, como el original. Los 5 stats con − y +: empiezan en 10 y se reparten 10 puntos sin pasar
//   de 14 (off/data/offCharacter.ts).
// - Derecha: el personaje grande mirando de frente y uno pequeño girando; la vida, el maná y la estamina que tendrá en
//   el nivel 1 (fórmulas del original); Warrior y Magician reparten los puntos de golpe (✓ en el que coincide).
// - Abajo: Create (apagado con puntos sin gastar, y el motivo encima) y Cancel. Cancel con algo hecho pregunta antes.
// - Teclado y mando: ↑/↓ recorre nombre, aspecto, stats, Warrior/Magician y Create/Cancel; ←/→ cambia la fila (en un
//   stat, ← resta y → suma) o elige botón. Enter / A en una fila lleva a Create, o al primer stat si quedan puntos; en
//   un botón, lo pulsa. Y = nombre al azar. Esc / B = Cancel. En el PC las letras siempre escriben en el nombre.
import Phaser from 'phaser';
import { SELECT_BACKGROUND, SELECT_SCALE } from '../../config/characterSelect';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { HAIR_COLORS, randomLook, stepLook, type CharacterLook } from '../../data/appearance';
import { CHARACTER_NAME_MAX_LENGTH } from '../../data/characterSlots';
import { CharacterSprite } from '../../entities/CharacterSprite';
import { Direction } from '../../hb/directions';
import { PlayerState } from '../../hb/playerAppearance';
import { openOverlay } from '../../scenes/MenuOverlayScene';
import { cleanName } from '../../systems/CharacterStore';
import { Action, InputSystem } from '../../systems/InputSystem';
import { TextInput, TYPES_WITHOUT_TAPPING, type TextInputKey } from '../../ui/TextInput';
import { OFF_CREATE_LAYOUT, OFF_CREATE_TEXT } from '../config/offCreate';
import { OFF_DIALOG_TEXT } from '../config/offDialog';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE } from '../config/offTheme';
import { OFF_STATS_TEXT } from '../data/offBag';
import {
    OFF_CREATION,
    OFF_PRESETS,
    OFF_STAT_IDS,
    offBaseStats,
    offCreationPointsLeft,
    offMaxHp,
    offMaxMana,
    offMaxStamina,
    offRandomName,
    type OffPresetId,
    type OffStatId,
    type OffStats,
} from '../data/offCharacter';
import { OFF_NOVICE } from '../data/offWorld';
import { offSaveStore } from '../systems/OffSaveStore';
import {
    OFF_PAD_DPAD, offBox, offButton, offDivider, offFitText, offFrame, offLabel, offLayoutIssues, offOptionRow, offPadHints,
    offRule, offStepperRow, offText, offTextBox,
    type OffButton, type OffControl, type OffOptionRow, type OffStepperRow, type OffTextBox,
} from '../ui/offUi';
import { OFF_DIALOG_SCENE_KEY, type OffDialogSceneData } from './OffDialogScene';
import { OFF_SLOTS_SCENE_KEY } from './OffSlotsScene';
import { startOffWorld } from './OffWorldScene';

export const OFF_CREATE_SCENE_KEY = 'OffCreate';

export interface OffCreateSceneData {
    /** Slot the new character goes in (Select Character); default: the one being played. */
    slot?: number;
}

const L = OFF_CREATE_LAYOUT;
const T = OFF_CREATE_TEXT;

const LOOK_ROWS = T.lookRows.length;
/** Rows that ↑/↓ go through: the name, 5 look rows, 5 stat rows, Warrior / Magician, Create / Cancel. */
const Row = {
    Name: 0,
    FirstLook: 1,
    FirstStat: 1 + LOOK_ROWS,
    Presets: 1 + LOOK_ROWS + OFF_STAT_IDS.length,
    Buttons: 2 + LOOK_ROWS + OFF_STAT_IDS.length,
} as const;
const ROW_COUNT = Row.Buttons + 1;
const PRESET_IDS: readonly OffPresetId[] = ['warrior', 'magician'];
const ButtonColumn = { Create: 0, Cancel: 1 } as const;

const DIRECTIONS_CLOCKWISE = [
    Direction.South, Direction.SouthWest, Direction.West, Direction.NorthWest,
    Direction.North, Direction.NorthEast, Direction.East, Direction.SouthEast,
] as const;

/** The value a look row shows, written out. */
function lookValue(look: CharacterLook, key: keyof CharacterLook): string {
    switch (key) {
        case 'gender': return T.genders[look.gender];
        case 'skin': return T.skins[look.skin] ?? String(look.skin + 1);
        case 'hairStyle': return T.hairStyle(look.hairStyle);
        case 'hairColor': return HAIR_COLORS[look.hairColor]?.name ?? String(look.hairColor + 1);
        case 'underwear': return T.underwear(look.underwear);
    }
}

export class OffCreateScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private turnTime = 0;
    private look: CharacterLook = randomLook();
    private stats: OffStats = offBaseStats();
    private focusRow = 0;
    /** Which button of the row with two (Warrior / Magician, Create / Cancel) has the focus. */
    private focusColumn = 0;
    private nameBox!: OffTextBox;
    private nameInput!: TextInput;
    private randomButton!: OffButton;
    private lookRows: OffOptionRow[] = [];
    private statRows: OffStepperRow[] = [];
    private pointsText!: Phaser.GameObjects.Text;
    private valueTexts: Phaser.GameObjects.Text[] = [];
    private presetButtons: OffButton[] = [];
    private reasonText!: Phaser.GameObjects.Text;
    private actionButtons: OffButton[] = [];
    private preview: { big: CharacterSprite; small: CharacterSprite } | undefined;
    private hints: Phaser.GameObjects.Container | undefined;
    private hintsKey = '';
    private forcePadHints = false;
    private dialogOpen = false;
    /** Slot the new character goes in. */
    private slot: number | undefined;

    constructor() {
        super(OFF_CREATE_SCENE_KEY);
    }

    init(data: OffCreateSceneData): void {
        this.slot = data.slot;
        this.look = randomLook();
        this.stats = offBaseStats();
        this.focusRow = Row.Name;
        this.focusColumn = 0;
        this.lookRows = [];
        this.statRows = [];
        this.valueTexts = [];
        this.presetButtons = [];
        this.actionButtons = [];
        this.preview = undefined;
        this.hints = undefined;
        this.hintsKey = '';
        this.forcePadHints = false;
        this.dialogOpen = false;
        this.turnTime = 0;
    }

    create(): void {
        this.openedAt = this.time.now;
        this.add.image(0, 0, SELECT_BACKGROUND.texture, SELECT_BACKGROUND.frame).setOrigin(0).setScale(SELECT_SCALE);
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, L.shadeColor, L.shadeAlpha).setOrigin(0);
        offFrame(this, L.x, L.y, L.w, L.h, { fill: OFF_THEME_COLOR.window, big: true });
        const innerW = L.w - L.sidePad * 2;
        const left = L.x + L.sidePad;
        offText(this, L.x + L.w / 2, L.y + L.titleTop, T.title, 'title', { originX: 0.5, maxWidth: innerW });
        offDivider(this, left, L.y + L.dividerTop, innerW);

        this.inputSystem = new InputSystem(this);
        // Every piece has its own click zone: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);

        this.createName(left);
        this.createLook(left);
        this.createStats(left);
        this.createRightColumn(left + L.rightLeft, L.x + L.w - L.sidePad);
        this.createBottom(left, innerW);
        this.createNameInput();

        // A click on the canvas takes the typing focus away from the name: on the PC, typing goes on.
        const refocus = () => {
            if (TYPES_WITHOUT_TAPPING && !this.dialogOpen && this.scene.isActive()) this.nameInput.focus();
        };
        this.input.on(Phaser.Input.Events.POINTER_UP, refocus);
        const onResume = () => {
            this.dialogOpen = false;
            refocus();
        };
        this.events.on(Phaser.Scenes.Events.RESUME, onResume);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.events.off(Phaser.Scenes.Events.RESUME, onResume);
            this.input.off(Phaser.Input.Events.POINTER_UP, refocus);
        });

        this.rebuildPreview();
        this.refresh();
    }

    override update(time: number, delta: number): void {
        this.updatePreviews(delta);
        this.refreshName(time);
        const input = this.inputSystem;
        input.update();
        this.hints?.setVisible(this.forcePadHints || input.getLastDevice() === 'gamepad');
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuUp)) this.moveFocus(-1);
        else if (input.justPressed(Action.MenuDown)) this.moveFocus(1);
        else if (input.justPressed(Action.MenuLeft)) this.horizontal(-1);
        else if (input.justPressed(Action.MenuRight)) this.horizontal(1);
        if (input.justPressed(Action.Confirm)) this.confirm();
        // Y of the pad (Del on the keyboard, which while typing deletes letters instead).
        if (input.justPressed(Action.OffDrop)) this.randomName();
        if (input.justPressed(Action.Back)) this.cancel();
    }

    private ready(): boolean {
        return !this.dialogOpen && this.time.now - this.openedAt >= L.inputDelayMs;
    }

    /** Wraps a click handler: nothing before the input delay or while the question is open. */
    private click(action: () => void): () => void {
        return () => {
            if (this.ready()) action();
        };
    }

    // ---------------------------------------------------------------- building

    private createName(left: number): void {
        offLabel(this, left, L.y + L.nameLabelTop, T.nameLabel);
        const top = L.y + L.nameTop;
        this.nameBox = offTextBox(this, left, top, L.nameBoxWidth, this.click(() => {
            this.setFocus(Row.Name);
            this.nameInput.focus();
        }));
        this.nameBox.setOnHover(() => this.setFocus(Row.Name));
        const randomX = left + L.leftWidth - L.randomWidth;
        this.randomButton = offButton(this, randomX, top, T.random, 'normal', this.click(() => {
            this.setFocus(Row.Name);
            this.randomName();
        }), L.randomWidth, OFF_THEME_SIZE.textBoxHeight);
        this.randomButton.setOnHover(() => this.setFocus(Row.Name));
    }

    private createLook(left: number): void {
        offLabel(this, left, L.y + L.lookLabelTop, T.lookLabel);
        T.lookRows.forEach(({ key, label }, i) => {
            const row = Row.FirstLook + i;
            const change = (step: number) => this.click(() => {
                this.setFocus(row);
                this.changeLook(key, step);
            });
            const control = offOptionRow(this, left, L.y + L.lookTop + i * L.lookStep, L.leftWidth, label,
                change(-1), change(1), this.click(() => this.setFocus(row)), L.lookStep);
            control.setOnHover(() => this.setFocus(row));
            this.lookRows.push(control);
        });
    }

    private createStats(left: number): void {
        const labelY = L.y + L.statsLabelTop;
        offLabel(this, left, labelY, T.statsLabel);
        this.pointsText = offText(this, left + L.leftWidth, labelY - 3, '', 'body', { originX: 1 });
        OFF_STAT_IDS.forEach((id, i) => {
            const row = Row.FirstStat + i;
            const change = (step: number) => this.click(() => {
                this.setFocus(row);
                this.changeStat(id, step);
            });
            const top = L.y + L.statsTop + i * L.statsStep;
            const control = offStepperRow(this, left, top, L.leftWidth, OFF_STATS_TEXT.names[id],
                change(-1), change(1), this.click(() => this.setFocus(row)), true);
            control.setOnHover(() => this.setFocus(row));
            this.statRows.push(control);
        });
    }

    private createRightColumn(x: number, right: number): void {
        const width = right - x;
        offBox(this, x, L.y + L.wellTop, width, L.wellHeight, OFF_THEME_COLOR.well, OFF_THEME_COLOR.cellBorder);

        offLabel(this, x, L.y + L.valuesLabelTop, T.valuesLabel);
        T.values.forEach((label, i) => {
            const top = L.y + L.valuesTop + i * L.valuesStep;
            const mid = top + L.valuesStep / 2;
            offText(this, x + OFF_THEME_SIZE.listRowPadding, mid, label, 'body', { originY: 0.5 });
            this.valueTexts.push(offText(this, right - OFF_THEME_SIZE.listRowPadding, mid, '', 'number', { originX: 1, originY: 0.5 }));
            offRule(this, x, top + L.valuesStep - 1, width);
        });

        offLabel(this, x, L.y + L.presetsLabelTop, T.presetsLabel);
        const presetWidth = (width - L.presetsGap) / 2;
        PRESET_IDS.forEach((id, i) => {
            const button = offButton(this, x + i * (presetWidth + L.presetsGap), L.y + L.presetsTop, T.presets[id], 'normal',
                this.click(() => {
                    this.setFocus(Row.Presets, i);
                    this.applyPreset(id);
                }), presetWidth, L.presetsHeight);
            button.setOnHover(() => this.setFocus(Row.Presets, i));
            this.presetButtons.push(button);
        });
        offText(this, x + width / 2, L.y + L.presetsNoteY, T.presetsNote(OFF_CREATION.points), 'small',
            { originX: 0.5, originY: 0.5, maxWidth: width });
    }

    private createBottom(left: number, innerW: number): void {
        const cx = L.x + L.w / 2;
        this.reasonText = offText(this, cx, L.y + L.reasonY, '', 'body', { originX: 0.5, originY: 0.5, color: OFF_THEME_INK.dim });
        const total = L.createWidth + L.buttonsGap + L.cancelWidth;
        const x = cx - total / 2;
        const top = L.y + L.buttonsTop;
        const create = offButton(this, x, top, T.create, 'main', this.click(() => this.createCharacter()), L.createWidth, L.buttonsHeight);
        const cancel = offButton(this, x + L.createWidth + L.buttonsGap, top, T.cancel, 'normal', this.click(() => this.cancel()),
            L.cancelWidth, L.buttonsHeight);
        this.actionButtons = [create, cancel];
        this.actionButtons.forEach((b, i) => b.setOnHover(() => this.setFocus(Row.Buttons, i)));
        offDivider(this, left, L.y + L.dividerBottom, innerW);
    }

    // ---------------------------------------------------------------- focus

    /** Every control that can carry the ring, by row (the rows with two buttons have both). */
    private rowControls(row: number): readonly OffControl[] {
        if (row === Row.Name) return [this.nameBox];
        if (row < Row.FirstStat) return [this.lookRows[row - Row.FirstLook]].filter((c) => c !== undefined);
        if (row < Row.Presets) return [this.statRows[row - Row.FirstStat]].filter((c) => c !== undefined);
        if (row === Row.Presets) return this.presetButtons;
        return this.actionButtons;
    }

    private setFocus(row: number, column = 0): void {
        for (let r = 0; r < ROW_COUNT; r++) for (const c of this.rowControls(r)) c.setFocused(false);
        this.focusRow = row;
        this.focusColumn = column;
        // Create is off with points left: the ring goes to Cancel.
        if (row === Row.Buttons && column === ButtonColumn.Create && !this.actionButtons[ButtonColumn.Create]?.isEnabled()) {
            this.focusColumn = ButtonColumn.Cancel;
        }
        this.rowControls(row)[this.focusColumn]?.setFocused(true);
        this.refreshHints();
    }

    /** ↑ / ↓ (going round). */
    public moveFocus(step: number): void {
        const next = (((this.focusRow + step) % ROW_COUNT) + ROW_COUNT) % ROW_COUNT;
        // From Warrior / Magician down to the buttons: Create first; otherwise the same column.
        this.setFocus(next, next === Row.Buttons ? ButtonColumn.Create : next === Row.Presets ? this.focusColumn : 0);
    }

    /** ← / →: changes the look row, takes / gives a point, or moves between the two buttons of a row. */
    public horizontal(step: number): void {
        const row = this.focusRow;
        if (row === Row.Name) return;
        if (row < Row.FirstStat) {
            const key = T.lookRows[row - Row.FirstLook]?.key;
            if (key) this.changeLook(key, step);
        } else if (row < Row.Presets) {
            const id = OFF_STAT_IDS[row - Row.FirstStat];
            if (id) this.changeStat(id, step);
        } else {
            const controls = this.rowControls(row);
            const column = this.focusColumn + step;
            if (column >= 0 && column < controls.length && controls[column]?.isEnabled()) this.setFocus(row, column);
        }
    }

    /** Enter / A: presses the button with the ring; on a row, goes on to Create (or to the stats, with points left). */
    public confirm(): void {
        if (this.focusRow >= Row.Presets) {
            this.rowControls(this.focusRow)[this.focusColumn]?.press();
            return;
        }
        if (offCreationPointsLeft(this.stats) > 0) {
            const room = OFF_STAT_IDS.findIndex((id) => this.stats[id] < OFF_CREATION.max);
            this.setFocus(Row.FirstStat + Math.max(0, room));
        } else {
            this.setFocus(Row.Buttons, ButtonColumn.Create);
        }
    }

    // ---------------------------------------------------------------- changes

    private changeLook(key: keyof CharacterLook, step: number): void {
        this.look = stepLook(this.look, key, step);
        this.rebuildPreview();
        this.refresh();
    }

    public changeStat(id: OffStatId, step: number): void {
        const next = this.stats[id] + step;
        if (next < OFF_CREATION.base || next > OFF_CREATION.max) return;
        if (step > 0 && offCreationPointsLeft(this.stats) <= 0) return;
        this.stats = { ...this.stats, [id]: next };
        this.refresh();
    }

    public applyPreset(id: OffPresetId): void {
        this.stats = { ...OFF_PRESETS[id] };
        this.refresh();
    }

    /** Random (Y): a name from the list, never the one shown now. */
    public randomName(): void {
        this.nameInput.setValue(offRandomName(this.nameInput.value));
    }

    // ---------------------------------------------------------------- drawing the state

    /** Look values, stats and points, level-1 values, presets, Create and its reason, hints. */
    private refresh(): void {
        T.lookRows.forEach(({ key }, i) => this.lookRows[i]?.setValue(lookValue(this.look, key)));
        const pointsLeft = offCreationPointsLeft(this.stats);
        OFF_STAT_IDS.forEach((id, i) => {
            const row = this.statRows[i];
            const value = this.stats[id];
            row?.setValue(String(value), value > OFF_CREATION.base);
            row?.setMinusEnabled(value > OFF_CREATION.base);
            row?.setPlusEnabled(pointsLeft > 0 && value < OFF_CREATION.max);
        });
        this.pointsText.setText(pointsLeft > 0 ? T.pointsLeft(pointsLeft) : T.allSpent)
            .setColor(pointsLeft > 0 ? OFF_THEME_INK.gold : OFF_THEME_INK.good);
        const level = { level: 1, ...this.stats };
        [offMaxHp(level), offMaxMana(level), offMaxStamina(level)].forEach((value, i) => this.valueTexts[i]?.setText(String(value)));
        PRESET_IDS.forEach((id, i) => {
            const matches = OFF_STAT_IDS.every((stat) => this.stats[stat] === OFF_PRESETS[id][stat]);
            this.presetButtons[i]?.setChecked(matches);
        });
        this.reasonText.setText(pointsLeft > 0 ? T.reason(pointsLeft) : '');
        offFitText(this.reasonText, 'body', L.w - L.sidePad * 2);
        const create = this.actionButtons[ButtonColumn.Create];
        create?.setEnabled(pointsLeft === 0);
        // Create went off under the ring: it moves to Cancel (setFocus does it).
        this.setFocus(this.focusRow, this.focusColumn);
    }

    /** The pad hints row: what A and ← / → do depends on the focused row. */
    private refreshHints(): void {
        const row = this.focusRow;
        const hints: [string, string][] = [[OFF_PAD_DPAD, T.hintMove]];
        if (row >= Row.Presets) {
            const createFocused = row === Row.Buttons && this.focusColumn === ButtonColumn.Create;
            hints.push(['A', createFocused ? T.hintCreate : row === Row.Buttons ? T.hintCancel : T.hintSelect]);
        } else {
            hints.push(['A', T.hintNext]);
        }
        hints.push(['Y', T.hintRandom], ['B', T.hintCancel]);
        const key = hints.map((h) => h.join(':')).join('|');
        if (key === this.hintsKey) return;
        this.hintsKey = key;
        const visible = this.hints?.visible ?? false;
        this.hints?.destroy();
        this.hints = offPadHints(this, L.x + L.w / 2, L.y + L.hintsCentreY, hints).setVisible(visible);
    }

    // ---------------------------------------------------------------- name

    private createNameInput(): void {
        this.nameInput = new TextInput(this, this.inputSystem, {
            initial: '',
            maxLength: CHARACTER_NAME_MAX_LENGTH,
            clean: cleanName,
            onChange: () => this.refreshName(this.time.now),
            onFocusChange: () => this.refreshName(this.time.now),
            onKey: (key) => this.onNameKey(key),
        });
        if (TYPES_WITHOUT_TAPPING) this.nameInput.focus();
    }

    /** Keys the name box passes on while typing (the keyboard actions are off then). */
    private onNameKey(key: TextInputKey): void {
        if (!this.ready()) return;
        if (key === 'Enter') this.confirm();
        else if (key === 'Escape') this.cancel();
        else if (key === 'ArrowUp' || key === 'ArrowDown') this.moveFocus(key === 'ArrowUp' ? -1 : 1);
        else this.horizontal(key === 'ArrowLeft' ? -1 : 1);
    }

    /** Typed name with a blinking cursor while typing; "Novice", fainter, while empty. */
    private refreshName(time: number): void {
        if (!this.nameInput) return;
        const typed = this.nameInput.value;
        const placeholder = typed === '';
        const blinkOn = Math.floor(time / L.cursorBlinkMs) % 2 === 0;
        this.nameBox.setText(placeholder ? OFF_CREATION.defaultName : typed, placeholder, this.nameInput.focused && blinkOn);
        this.nameBox.setCounter(T.counter(typed.length, CHARACTER_NAME_MAX_LENGTH));
    }

    // ---------------------------------------------------------------- characters

    /** Big character and the small one, drawn again whenever the look changes. Pieces not downloaded yet show up a moment later. */
    private rebuildPreview(): void {
        this.preview?.big.destroy();
        this.preview?.small.destroy();
        const wellX = L.x + L.sidePad + L.rightLeft;
        const wellY = L.y + L.wellTop;
        const big = new CharacterSprite(this, OFF_NOVICE, this.look, wellX + L.bigFeet.x, wellY + L.bigFeet.y);
        big.container.setScale(L.bigScale);
        const small = new CharacterSprite(this, OFF_NOVICE, this.look, wellX + L.smallFeet.x, wellY + L.smallFeet.y);
        small.container.setScale(L.smallScale);
        this.preview = { big, small };
    }

    /** The big one faces you; the small one slowly turns around. */
    private updatePreviews(delta: number): void {
        this.turnTime += delta;
        const turn = Math.floor(this.turnTime / L.smallTurnMs) % DIRECTIONS_CLOCKWISE.length;
        const preview = this.preview;
        if (!preview) return;
        preview.big.update(delta);
        preview.small.setPose(PlayerState.IdleCombat, DIRECTIONS_CLOCKWISE[turn] ?? Direction.South);
        preview.small.update(delta);
    }

    // ---------------------------------------------------------------- Create / Cancel

    /** "Create": only with every point spent. Saves the new character and goes to Traveler Zone. */
    public createCharacter(): void {
        if (offCreationPointsLeft(this.stats) > 0) return;
        offSaveStore.create(this.nameInput.value || OFF_CREATION.defaultName, this.look, this.stats, this.slot);
        startOffWorld(this);
    }

    /** "Cancel": with a name typed or points spent, asks first (No marked). */
    public cancel(): void {
        const changed = this.nameInput.value !== '' || offCreationPointsLeft(this.stats) < OFF_CREATION.points;
        if (!changed) {
            this.leave();
            return;
        }
        this.dialogOpen = true;
        this.nameInput.blur();
        const data: Omit<OffDialogSceneData, 'returnTo'> = {
            title: T.cancelTitle,
            question: T.cancelQuestion,
            buttons: [
                { label: OFF_DIALOG_TEXT.no, variant: 'normal' },
                { label: OFF_DIALOG_TEXT.yes, variant: 'danger', onPress: () => this.leave() },
            ],
            focus: 0,
            cancel: 0,
        };
        openOverlay(this, OFF_DIALOG_SCENE_KEY, data);
    }

    /** Back to Select Character, or to Off's home screen when there is no character. */
    private leave(): void {
        this.scene.start(offSaveStore.hasAny ? OFF_SLOTS_SCENE_KEY : 'OffHome');
    }

    // ---------------------------------------------------------------- development

    /** `check`: the window as if the pad were in use. */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
        this.hints?.setVisible(true);
    }

    /** `check`: focus, name, stats, points, whether Create is on, the reason line and whether all fits. */
    public debugState(): {
        focus: string; name: string; look: string[]; stats: OffStats; pointsLeft: number; createEnabled: boolean;
        checked: string[]; reason: string; issues: string[];
    } {
        const row = this.focusRow;
        const focus = row === Row.Name ? 'name'
            : row < Row.FirstStat ? `look:${T.lookRows[row - Row.FirstLook]?.key ?? ''}`
                : row < Row.Presets ? `stat:${OFF_STAT_IDS[row - Row.FirstStat] ?? ''}`
                    : row === Row.Presets ? `preset:${PRESET_IDS[this.focusColumn] ?? ''}`
                        : this.focusColumn === ButtonColumn.Create ? 'create' : 'cancel';
        return {
            focus,
            name: this.nameInput.value,
            look: this.lookRows.map((_, i) => lookValue(this.look, T.lookRows[i]?.key ?? 'gender')),
            stats: { ...this.stats },
            pointsLeft: offCreationPointsLeft(this.stats),
            createEnabled: this.actionButtons[ButtonColumn.Create]?.isEnabled() ?? false,
            checked: PRESET_IDS.filter((id) => OFF_STAT_IDS.every((stat) => this.stats[stat] === OFF_PRESETS[id][stat])),
            reason: this.reasonText.text,
            issues: offLayoutIssues(this),
        };
    }
}
