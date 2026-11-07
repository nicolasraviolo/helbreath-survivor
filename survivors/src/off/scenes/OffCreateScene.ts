// Helbreath Off (Fase Off-3A): pantalla "Create New Character" del original. Sale al pulsar Play sin personaje creado
// (o con ?off=create). Es la que tuvo Survivors hasta el 22-oct-2026 (scenes/CharacterSelectScene.ts en git), adaptada:
// - Nombre en la caja del original (ui/TextInput.ts). Sin nombre se llama "Novice".
// - Aspecto: sexo, piel, peinado, color de pelo y ropa interior con las flechas; al abrir salen al azar, como el original.
// - Stats: los 5 de Off empiezan en 10 y con + (izquierda) y − (derecha) se reparten 10 puntos, sin pasar de 14 (off/data/offCharacter.ts).
//   La fila de Charisma del dibujo se tapa. Warrior y Magician reparten los puntos de golpe, como en el original.
// - A la derecha, la vida, el maná y la estamina que tendrá en el nivel 1 (fórmulas del original).
// - Create guarda el personaje (OffSaveStore) y lleva a Traveler Zone; con puntos sin gastar no deja y lo avisa.
//   Cancel vuelve a la pantalla de Off.
// Teclado y mando: ↑/↓ eligen fila (5 de aspecto, 5 de stats y la de Warrior / Magician), ←/→ la cambian (en un stat,
// → suma y ← resta), Enter / A crea, Esc / B cancela. Ratón: flechas, + y − y botones.
import Phaser from 'phaser';
import {
    SELECT_ARROW_HIT_PAD,
    SELECT_BACKGROUND,
    SELECT_BUTTON_FRAME,
    SELECT_BUTTON_HIT_PAD,
    SELECT_BUTTON_TEXTURE,
    SELECT_CANCEL_BUTTON,
    SELECT_CLASS_BUTTONS,
    SELECT_CREATE_BUTTON,
    SELECT_DESCRIPTION,
    SELECT_DESCRIPTION_STYLE,
    SELECT_FOCUS_STYLE,
    SELECT_FOOTER_Y,
    SELECT_INPUT_DELAY_MS,
    SELECT_LABEL_X,
    SELECT_LOOK,
    SELECT_LOOK_ROWS,
    SELECT_MIRROR,
    SELECT_NAME,
    SELECT_NAME_STYLE,
    SELECT_PREVIEW,
    SELECT_SCALE,
    SELECT_STATS,
    SELECT_TEXT_CENTER_X,
    SELECT_TEXT_STYLE,
    SELECT_VALUE_STYLE,
    SELECT_VALUES,
} from '../../config/characterSelect';
import { randomLook, stepLook, type CharacterLook } from '../../data/appearance';
import { CHARACTER_NAME_MAX_LENGTH } from '../../data/characterSlots';
import { STAT_INFO } from '../../data/stats';
import { CharacterSprite } from '../../entities/CharacterSprite';
import { Direction } from '../../hb/directions';
import { PlayerState } from '../../hb/playerAppearance';
import { cleanName } from '../../systems/CharacterStore';
import { Action, InputSystem } from '../../systems/InputSystem';
import { TextInput, TYPES_WITHOUT_TAPPING, type TextInputKey } from '../../ui/TextInput';
import { OFF_CREATE } from '../config/offCreate';
import {
    OFF_CREATE_TEXT,
    OFF_CREATION,
    OFF_PRESETS,
    OFF_STAT_IDS,
    offBaseStats,
    offCreationPointsLeft,
    offMaxHp,
    offMaxMana,
    offMaxStamina,
    type OffPresetId,
    type OffStatId,
    type OffStats,
} from '../data/offCharacter';
import { OFF_NOVICE } from '../data/offWorld';
import { offSaveStore } from '../systems/OffSaveStore';
import { startOffWorld } from './OffWorldScene';

export const OFF_CREATE_SCENE_KEY = 'OffCreate';

const NAME_CURSOR = '_';
const NAME_CURSOR_BLINK_MS = 500;

/** The original's two bottom buttons: Warrior and Magician spend the points in one go. */
const PRESET_BUTTONS: ReadonlyArray<{ id: OffPresetId; frame: number; x: number; y: number }> = SELECT_CLASS_BUTTONS.map((button) => ({
    id: button.id === 'warrior' ? 'warrior' : 'magician',
    frame: button.frame,
    x: button.x,
    y: button.y,
}));

/** Rows that ↑/↓ go through: 5 look rows, 5 stat rows, then the Warrior / Magician buttons. */
const LOOK_ROWS = SELECT_LOOK_ROWS.length;
const PRESET_ROW = LOOK_ROWS + OFF_STAT_IDS.length;

const DIRECTIONS_CLOCKWISE = [
    Direction.South, Direction.SouthWest, Direction.West, Direction.NorthWest,
    Direction.North, Direction.NorthEast, Direction.East, Direction.SouthEast,
] as const;

/** 640x480 coordinates of the original image → screen pixels. */
function s(value: number): number {
    return Math.round(value * SELECT_SCALE);
}

interface Button {
    image: Phaser.GameObjects.Image;
    frame: number;
    hovered: boolean;
}

export class OffCreateScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private openedAt = 0;
    private mirrorTime = 0;
    private look: CharacterLook = randomLook();
    private stats: OffStats = offBaseStats();
    private focusRow = 0;
    private rowLabels: Phaser.GameObjects.Text[] = [];
    private statTexts: Phaser.GameObjects.Text[] = [];
    private valueTexts: Phaser.GameObjects.Text[] = [];
    private presetButtons = new Map<OffPresetId, Button>();
    private actionButtons: Button[] = [];
    private preview: { big: CharacterSprite; mirror: CharacterSprite } | undefined;
    private statsTitle!: Phaser.GameObjects.Text;
    private footerText!: Phaser.GameObjects.Text;
    private nameText!: Phaser.GameObjects.Text;
    private nameInput!: TextInput;
    /** "Spend N more points first" shows until this time. */
    private warningUntil = 0;

    constructor() {
        super(OFF_CREATE_SCENE_KEY);
    }

    create(): void {
        this.openedAt = this.time.now;
        this.mirrorTime = 0;
        this.look = randomLook();
        this.stats = offBaseStats();
        this.focusRow = 0;
        this.rowLabels = [];
        this.statTexts = [];
        this.valueTexts = [];
        this.presetButtons = new Map();
        this.actionButtons = [];
        this.preview = undefined;
        this.warningUntil = 0;

        this.add.image(0, 0, SELECT_BACKGROUND.texture, SELECT_BACKGROUND.frame).setOrigin(0).setScale(SELECT_SCALE);
        this.createLeftPanel();
        this.createValues();
        this.add.text(s(SELECT_DESCRIPTION.x), s(SELECT_DESCRIPTION.y), [...OFF_CREATE_TEXT.description], {
            ...SELECT_DESCRIPTION_STYLE, align: 'center', lineSpacing: 2, wordWrap: { width: s(SELECT_DESCRIPTION.width) },
        }).setOrigin(0.5);
        this.createButtons();

        this.inputSystem = new InputSystem(this);
        // Buttons and arrows have their own click handlers: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
        this.createNameInput();
        this.rebuildPreview();
        this.refresh();
    }

    override update(time: number, delta: number): void {
        this.updatePreviews(delta);
        this.refreshName(time);
        if (this.warningUntil > 0 && time >= this.warningUntil) {
            this.warningUntil = 0;
            this.refresh();
        }
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuUp)) this.moveFocus(-1);
        if (input.justPressed(Action.MenuDown)) this.moveFocus(1);
        if (input.justPressed(Action.MenuLeft)) this.changeFocused(-1);
        if (input.justPressed(Action.MenuRight)) this.changeFocused(1);
        if (input.justPressed(Action.Confirm)) this.createCharacter();
        if (input.justPressed(Action.Back)) this.cancel();
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= SELECT_INPUT_DELAY_MS;
    }

    // ---- Left panel: name, look and stats ----

    private createLeftPanel(): void {
        const centerX = s(SELECT_TEXT_CENTER_X);
        const labelX = s(SELECT_LABEL_X);
        const title = (y: number, text: string) => this.add.text(centerX, s(y), text, SELECT_TEXT_STYLE).setOrigin(0.5);

        title(SELECT_NAME.titleY, 'Your character name.');
        this.add.text(labelX, s(SELECT_NAME.labelY), 'Character Name', SELECT_TEXT_STYLE).setOrigin(0, 0.5);
        const box = SELECT_NAME.box;
        this.nameText = this.add.text(s(box.x + 6), s(box.y + box.height / 2), '', SELECT_NAME_STYLE).setOrigin(0, 0.5);
        // Clicking / tapping the box starts typing (on phones it opens the keyboard).
        const pad = SELECT_BUTTON_HIT_PAD;
        this.add.zone(s(box.x - pad.x), s(box.y - pad.y), s(box.width + pad.x * 2), s(box.height + pad.y * 2)).setOrigin(0)
            .setInteractive({ useHandCursor: true })
            .on(Phaser.Input.Events.POINTER_UP, () => this.nameInput.focus());

        title(SELECT_LOOK.titleY, 'Choose your look.');
        SELECT_LOOK_ROWS.forEach(({ label }, i) => {
            const y = SELECT_LOOK.firstRowY + i * SELECT_LOOK.step;
            this.rowLabels.push(this.add.text(labelX, s(y), label, SELECT_TEXT_STYLE).setOrigin(0, 0.5));
            this.addRowButton(i, y, -1);
            this.addRowButton(i, y, 1);
        });

        this.statsTitle = title(SELECT_STATS.titleY, '');
        OFF_STAT_IDS.forEach((stat, i) => {
            const y = SELECT_STATS.firstRowY + i * SELECT_STATS.step;
            this.rowLabels.push(this.add.text(labelX, s(y), STAT_INFO[stat].name, SELECT_TEXT_STYLE).setOrigin(0, 0.5));
            this.statTexts.push(this.add.text(s(SELECT_STATS.valueX), s(y), '', SELECT_VALUE_STYLE).setOrigin(0.5));
            this.addRowButton(LOOK_ROWS + i, y, 1);
            this.addRowButton(LOOK_ROWS + i, y, -1);
        });
        // The background's 6th stat row is Charisma: a piece of plain wood from lower down the panel covers it.
        const row = OFF_CREATE.hiddenRow;
        const top = row.y - row.height / 2;
        this.add.image(0, -s(row.woodBelow), SELECT_BACKGROUND.texture, SELECT_BACKGROUND.frame).setOrigin(0).setScale(SELECT_SCALE)
            .setCrop(row.fromX, top + row.woodBelow, row.toX - row.fromX, row.height);
        this.footerText = title(SELECT_FOOTER_Y, 'Warrior or Magician spend them for you.');
    }

    /**
     * Touch / click area over an arrow (look rows: ← left, → right) or a + / − (stat rows: + left, − right) drawn in
     * the background. It grows outwards on phones.
     */
    private addRowButton(row: number, centerY: number, step: number): void {
        const onLeft = row < LOOK_ROWS ? step < 0 : step > 0;
        const button = onLeft ? OFF_CREATE.plus : OFF_CREATE.minus;
        const pad = SELECT_ARROW_HIT_PAD;
        const x = onLeft ? button.x - pad.x : button.x;
        const height = SELECT_LOOK.arrowHeight + pad.y * 2;
        this.add.zone(s(x), s(centerY - height / 2), s(button.width + pad.x), s(height)).setOrigin(0)
            .setInteractive({ useHandCursor: true })
            .on(Phaser.Input.Events.POINTER_UP, () => {
                if (!this.ready()) return;
                this.focusRow = row;
                this.changeFocused(step);
                if (TYPES_WITHOUT_TAPPING) this.nameInput.focus();
            });
    }

    private moveFocus(step: number): void {
        const rows = PRESET_ROW + 1;
        this.focusRow = (((this.focusRow + step) % rows) + rows) % rows;
        this.refresh();
    }

    /** ←/→: changes the focused look row, takes a point from / gives a point to the focused stat, or picks a preset. */
    private changeFocused(step: number): void {
        if (this.focusRow < LOOK_ROWS) this.changeLook(this.focusRow, step);
        else if (this.focusRow < PRESET_ROW) this.changeStat(OFF_STAT_IDS[this.focusRow - LOOK_ROWS], step);
        else this.applyPreset(step < 0 ? 'warrior' : 'magician');
    }

    private changeLook(row: number, step: number): void {
        const key = SELECT_LOOK_ROWS[row]?.key;
        if (!key) return;
        this.look = stepLook(this.look, key, step);
        this.rebuildPreview();
        this.refresh();
    }

    private changeStat(id: OffStatId | undefined, step: number): void {
        if (!id) return;
        const next = this.stats[id] + step;
        if (next < OFF_CREATION.base || next > OFF_CREATION.max) return;
        if (step > 0 && offCreationPointsLeft(this.stats) <= 0) return;
        this.stats = { ...this.stats, [id]: next };
        this.refresh();
    }

    private applyPreset(id: OffPresetId): void {
        this.stats = { ...OFF_PRESETS[id] };
        this.refresh();
    }

    /** Stat values, points left, level-1 values, highlighted row and lit buttons. */
    private refresh(): void {
        const pointsLeft = offCreationPointsLeft(this.stats);
        const warning = this.warningUntil > 0;
        this.statsTitle.setText(warning ? OFF_CREATE_TEXT.spendFirst(pointsLeft) : OFF_CREATE_TEXT.pointsLeft(pointsLeft));
        this.statsTitle.setStyle(warning ? SELECT_FOCUS_STYLE : SELECT_TEXT_STYLE);
        OFF_STAT_IDS.forEach((id, i) => this.statTexts[i]?.setText(String(this.stats[id])));
        const level = { level: 1, ...this.stats };
        [offMaxHp(level), offMaxMana(level), offMaxStamina(level)].forEach((value, i) => this.valueTexts[i]?.setText(String(value)));
        this.rowLabels.forEach((label, i) => label.setStyle(i === this.focusRow ? SELECT_FOCUS_STYLE : SELECT_TEXT_STYLE));
        this.footerText.setStyle(this.focusRow === PRESET_ROW ? SELECT_FOCUS_STYLE : SELECT_TEXT_STYLE);
        this.refreshButtons();
    }

    // ---- Name ----

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

    private onNameKey(key: TextInputKey): void {
        if (!this.ready()) return;
        if (key === 'Enter') this.createCharacter();
        else if (key === 'Escape') this.cancel();
        else if (key === 'ArrowUp' || key === 'ArrowDown') this.moveFocus(key === 'ArrowUp' ? -1 : 1);
        else this.changeFocused(key === 'ArrowLeft' ? -1 : 1);
    }

    /** Typed name with a blinking cursor while typing; the default name, greyed out, while empty. */
    private refreshName(time: number): void {
        if (!this.nameInput) return;
        const typed = this.nameInput.value;
        const placeholder = typed === '' && !this.nameInput.focused;
        const cursor = this.nameInput.focused && Math.floor(time / NAME_CURSOR_BLINK_MS) % 2 === 0 ? NAME_CURSOR : '';
        const text = placeholder ? OFF_CREATION.defaultName : typed + cursor;
        if (this.nameText.text !== text) this.nameText.setText(text);
        this.nameText.setAlpha(placeholder ? 0.6 : 1);
    }

    // ---- Right panel: preview and level-1 values ----

    /** Big preview and mirror, drawn again whenever the look changes. Pieces not downloaded yet show up a moment later. */
    private rebuildPreview(): void {
        this.preview?.big.destroy();
        this.preview?.mirror.destroy();
        const big = new CharacterSprite(this, OFF_NOVICE, this.look, s(SELECT_PREVIEW.x), s(SELECT_PREVIEW.y));
        big.container.setScale(SELECT_PREVIEW.scale * SELECT_SCALE);
        const mirror = new CharacterSprite(this, OFF_NOVICE, this.look, s(SELECT_MIRROR.x), s(SELECT_MIRROR.y));
        mirror.container.setScale(SELECT_MIRROR.scale * SELECT_SCALE);
        this.preview = { big, mirror };
    }

    private createValues(): void {
        OFF_CREATE_TEXT.values.forEach((label, i) => {
            const y = s(SELECT_VALUES.firstRowY + i * SELECT_VALUES.step);
            this.add.text(s(SELECT_VALUES.labelX), y, label, SELECT_TEXT_STYLE).setOrigin(1, 0.5);
            this.valueTexts.push(this.add.text(s(SELECT_VALUES.valueX), y, '', SELECT_VALUE_STYLE).setOrigin(0.5));
        });
    }

    /** Big preview faces the viewer; the mirror slowly turns around. */
    private updatePreviews(delta: number): void {
        this.mirrorTime += delta;
        const turn = Math.floor(this.mirrorTime / SELECT_MIRROR.turnMs) % DIRECTIONS_CLOCKWISE.length;
        const preview = this.preview;
        if (!preview) return;
        preview.big.update(delta);
        preview.mirror.setPose(PlayerState.IdleCombat, DIRECTIONS_CLOCKWISE[turn] ?? Direction.South);
        preview.mirror.update(delta);
    }

    // ---- Buttons ----

    private createButtons(): void {
        for (const { id, frame, x, y } of PRESET_BUTTONS) {
            this.presetButtons.set(id, this.addButton(x, y, frame, () => {
                this.focusRow = PRESET_ROW;
                this.applyPreset(id);
            }));
        }
        this.actionButtons.push(
            this.addButton(SELECT_CREATE_BUTTON.x, SELECT_CREATE_BUTTON.y, SELECT_BUTTON_FRAME.create, () => this.createCharacter()),
            this.addButton(SELECT_CANCEL_BUTTON.x, SELECT_CANCEL_BUTTON.y, SELECT_BUTTON_FRAME.cancel, () => this.cancel()),
        );
    }

    private addButton(x: number, y: number, frame: number, onClick: () => void): Button {
        const image = this.add.image(s(x), s(y), SELECT_BUTTON_TEXTURE, frame).setOrigin(0).setScale(SELECT_SCALE);
        const button: Button = { image, frame, hovered: false };
        // Phones: a touch area bigger than the image (the button keeps its original size).
        const pad = SELECT_BUTTON_HIT_PAD;
        const hitArea = new Phaser.Geom.Rectangle(-pad.x, -pad.y, image.width + pad.x * 2, image.height + pad.y * 2);
        image.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
        image.on(Phaser.Input.Events.POINTER_OVER, () => {
            button.hovered = true;
            this.refreshButtons();
        });
        image.on(Phaser.Input.Events.POINTER_OUT, () => {
            button.hovered = false;
            this.refreshButtons();
        });
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) onClick();
            // A click on the canvas takes the focus away from the name: on the PC, typing goes on.
            if (TYPES_WITHOUT_TAPPING && this.scene.isActive()) this.nameInput.focus();
        });
        return button;
    }

    /** Lit = hovered, or the preset the stats match right now. */
    private refreshButtons(): void {
        for (const [id, button] of this.presetButtons) {
            const matches = OFF_STAT_IDS.every((stat) => this.stats[stat] === OFF_PRESETS[id][stat]);
            button.image.setFrame(button.frame + (button.hovered || matches ? 1 : 0));
        }
        for (const button of this.actionButtons) button.image.setFrame(button.frame + (button.hovered ? 1 : 0));
    }

    // ---- Create / Cancel ----

    /** "Create": only with every point spent. Saves the new character and goes to Traveler Zone. */
    private createCharacter(): void {
        if (offCreationPointsLeft(this.stats) > 0) {
            this.warningUntil = this.time.now + OFF_CREATE.warningMs;
            this.refresh();
            return;
        }
        offSaveStore.create(this.nameInput.value || OFF_CREATION.defaultName, this.look, this.stats);
        startOffWorld(this);
    }

    /** "Cancel": back to Off's home screen. */
    private cancel(): void {
        this.scene.start('OffHome');
    }
}
