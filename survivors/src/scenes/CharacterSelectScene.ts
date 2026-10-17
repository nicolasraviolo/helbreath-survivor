// Pantalla "Create New Character" del Helbreath original, usada para elegir clase antes de la partida.
// De momento solo se elige la clase (Warrior o Magician): nombre, aspecto y stats son fijos, así que
// las flechas de aspecto y los botones +/- se ven apagados. Master no se incluye.
// Controles: ←/→ o cruceta/stick cambian de clase; Enter/A crea el personaje; Esc/B = Cancel (menú principal); ratón.
import Phaser from 'phaser';
import {
    SELECT_BACKGROUND,
    SELECT_BUTTON_TEXTURE,
    SELECT_CANCEL_BUTTON,
    SELECT_CLASS_BUTTONS,
    SELECT_BUTTON_FRAME,
    SELECT_CREATE_BUTTON,
    SELECT_DESCRIPTION,
    SELECT_DISABLED_ARROWS,
    SELECT_DISABLED_STYLE,
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
} from '../config/characterSelect';
import { CHARACTERS, CHOSEN_CHARACTER_KEY, DEFAULT_CHARACTER, isCharacterId, type CharacterId } from '../data/characters';
import { STAT_IDS, STAT_INFO } from '../data/stats';
import { CharacterSprite } from '../entities/CharacterSprite';
import { CharacterStats } from '../entities/CharacterStats';
import { Direction } from '../hb/directions';
import { PlayerState } from '../hb/playerAppearance';
import { Action, InputSystem } from '../systems/InputSystem';

/** 640x480 coordinates of the original image → screen pixels. */
function s(value: number): number {
    return Math.round(value * SELECT_SCALE);
}

interface Button {
    image: Phaser.GameObjects.Image;
    frame: number;
    hovered: boolean;
}

interface Preview {
    big: CharacterSprite;
    mirror: CharacterSprite;
}

const DIRECTIONS_CLOCKWISE = [
    Direction.South, Direction.SouthWest, Direction.West, Direction.NorthWest,
    Direction.North, Direction.NorthEast, Direction.East, Direction.SouthEast,
] as const;

export class CharacterSelectScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private selected: CharacterId = DEFAULT_CHARACTER;
    private openedAt = 0;
    private mirrorTime = 0;
    private classButtons = new Map<CharacterId, Button>();
    private actionButtons: Button[] = [];
    private previews = new Map<CharacterId, Preview>();
    private nameText!: Phaser.GameObjects.Text;
    private statTexts: Phaser.GameObjects.Text[] = [];
    private valueTexts: Phaser.GameObjects.Text[] = [];
    private descriptionText!: Phaser.GameObjects.Text;

    constructor() {
        super('CharacterSelect');
    }

    create(): void {
        this.classButtons = new Map();
        this.actionButtons = [];
        this.previews = new Map();
        this.statTexts = [];
        this.valueTexts = [];
        this.mirrorTime = 0;
        this.openedAt = this.time.now;

        this.add.image(0, 0, SELECT_BACKGROUND.texture, SELECT_BACKGROUND.frame).setOrigin(0).setScale(SELECT_SCALE);
        this.createLeftPanel();
        this.createPreviews();
        this.createValues();
        this.descriptionText = this.add.text(s(SELECT_DESCRIPTION.x), s(SELECT_DESCRIPTION.y), '', {
            ...SELECT_TEXT_STYLE, align: 'center', lineSpacing: 2, wordWrap: { width: s(SELECT_DESCRIPTION.width) },
        }).setOrigin(0.5);
        this.createButtons();

        this.inputSystem = new InputSystem(this);
        // Buttons have their own click handlers: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);

        const chosen: unknown = this.registry.get(CHOSEN_CHARACTER_KEY);
        this.select(isCharacterId(chosen) ? chosen : DEFAULT_CHARACTER);
    }

    override update(_time: number, delta: number): void {
        this.updatePreviews(delta);
        const input = this.inputSystem;
        input.update();
        if (this.time.now - this.openedAt < SELECT_INPUT_DELAY_MS) return;
        if (input.justPressed(Action.MenuLeft) || input.justPressed(Action.MenuRight)) this.selectNext();
        if (input.justPressed(Action.Confirm)) this.startGame();
        if (input.justPressed(Action.Back)) this.cancel();
    }

    private createLeftPanel(): void {
        const centerX = s(SELECT_TEXT_CENTER_X);
        const labelX = s(SELECT_LABEL_X);
        const title = (y: number, text: string) => this.add.text(centerX, s(y), text, SELECT_TEXT_STYLE).setOrigin(0.5);

        title(SELECT_NAME.titleY, 'Your character name.');
        this.add.text(labelX, s(SELECT_NAME.labelY), 'Character Name', SELECT_TEXT_STYLE).setOrigin(0, 0.5);
        const box = SELECT_NAME.box;
        this.nameText = this.add.text(s(box.x + 6), s(box.y + box.height / 2), '', SELECT_NAME_STYLE).setOrigin(0, 0.5);

        // Look: fixed for now (later phases).
        title(SELECT_LOOK.titleY, 'Character look (coming soon).');
        SELECT_LOOK_ROWS.forEach((label, i) => {
            this.add.text(labelX, s(SELECT_LOOK.firstRowY + i * SELECT_LOOK.step), label, SELECT_DISABLED_STYLE).setOrigin(0, 0.5);
        });
        this.dimArrows(SELECT_LOOK.firstRowY, SELECT_LOOK_ROWS.length, SELECT_LOOK.step);

        // Stats: shown, not editable.
        title(SELECT_STATS.titleY, 'Starting stats of this class.');
        STAT_IDS.forEach((stat, i) => {
            const y = s(SELECT_STATS.firstRowY + i * SELECT_STATS.step);
            this.add.text(labelX, y, STAT_INFO[stat].name, SELECT_TEXT_STYLE).setOrigin(0, 0.5);
            this.statTexts.push(this.add.text(s(SELECT_STATS.valueX), y, '', SELECT_VALUE_STYLE).setOrigin(0.5));
        });
        this.dimArrows(SELECT_STATS.firstRowY, STAT_IDS.length, SELECT_STATS.step);
        title(SELECT_FOOTER_Y, 'Choose Warrior or Magician below.');
    }

    /** Covers the original arrow / +- buttons with a translucent shade: they don't work yet. */
    private dimArrows(firstRowY: number, rows: number, step: number): void {
        const { x, width, alpha, color } = SELECT_DISABLED_ARROWS;
        const top = firstRowY - step / 2;
        this.add.rectangle(s(x), s(top), s(width), s(rows * step), color, alpha).setOrigin(0);
    }

    private createPreviews(): void {
        for (const [id, def] of Object.entries(CHARACTERS) as [CharacterId, (typeof CHARACTERS)[CharacterId]][]) {
            const big = new CharacterSprite(this, def, s(SELECT_PREVIEW.x), s(SELECT_PREVIEW.y));
            big.container.setScale(SELECT_PREVIEW.scale * SELECT_SCALE);
            const mirror = new CharacterSprite(this, def, s(SELECT_MIRROR.x), s(SELECT_MIRROR.y));
            mirror.container.setScale(SELECT_MIRROR.scale * SELECT_SCALE);
            this.previews.set(id, { big, mirror });
        }
    }

    private createValues(): void {
        ['Hit Point', 'Mana Point', 'Critical'].forEach((label, i) => {
            const y = s(SELECT_VALUES.firstRowY + i * SELECT_VALUES.step);
            this.add.text(s(SELECT_VALUES.labelX), y, label, SELECT_TEXT_STYLE).setOrigin(1, 0.5);
            this.valueTexts.push(this.add.text(s(SELECT_VALUES.valueX), y, '', SELECT_VALUE_STYLE).setOrigin(0.5));
        });
    }

    private createButtons(): void {
        for (const { id, frame, x, y } of SELECT_CLASS_BUTTONS) {
            this.classButtons.set(id, this.addButton(x, y, frame, () => this.select(id)));
        }
        this.actionButtons.push(
            this.addButton(SELECT_CREATE_BUTTON.x, SELECT_CREATE_BUTTON.y, SELECT_BUTTON_FRAME.create, () => this.startGame()),
            this.addButton(SELECT_CANCEL_BUTTON.x, SELECT_CANCEL_BUTTON.y, SELECT_BUTTON_FRAME.cancel, () => this.cancel()),
        );
    }

    private addButton(x: number, y: number, frame: number, onClick: () => void): Button {
        const image = this.add.image(s(x), s(y), SELECT_BUTTON_TEXTURE, frame).setOrigin(0).setScale(SELECT_SCALE);
        const button: Button = { image, frame, hovered: false };
        image.setInteractive({ useHandCursor: true });
        image.on(Phaser.Input.Events.POINTER_OVER, () => {
            button.hovered = true;
            this.refreshButtons();
        });
        image.on(Phaser.Input.Events.POINTER_OUT, () => {
            button.hovered = false;
            this.refreshButtons();
        });
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.time.now - this.openedAt >= SELECT_INPUT_DELAY_MS) onClick();
        });
        return button;
    }

    /** Lit = hovered, or the class currently chosen. */
    private refreshButtons(): void {
        for (const [id, button] of this.classButtons) {
            button.image.setFrame(button.frame + (button.hovered || id === this.selected ? 1 : 0));
        }
        for (const button of this.actionButtons) {
            button.image.setFrame(button.frame + (button.hovered ? 1 : 0));
        }
    }

    private select(id: CharacterId): void {
        this.selected = id;
        const def = CHARACTERS[id];
        const stats = new CharacterStats(def);
        this.nameText.setText(def.playerName);
        STAT_IDS.forEach((stat, i) => this.statTexts[i]?.setText(String(stats.stats[stat])));
        const values = [String(stats.maxHp), String(stats.maxMana), `${Math.round(stats.critChance * 100)}%`];
        values.forEach((value, i) => this.valueTexts[i]?.setText(value));
        this.descriptionText.setText([`${def.name}`, '', ...def.description]);
        for (const [previewId, { big, mirror }] of this.previews) {
            big.container.setVisible(previewId === id);
            mirror.container.setVisible(previewId === id);
        }
        this.refreshButtons();
    }

    private selectNext(): void {
        const ids = SELECT_CLASS_BUTTONS.map((button) => button.id);
        const next = ids[(ids.indexOf(this.selected) + 1) % ids.length];
        if (next) this.select(next);
    }

    /** Big preview faces the viewer; the mirror slowly turns around. */
    private updatePreviews(delta: number): void {
        this.mirrorTime += delta;
        const turn = Math.floor(this.mirrorTime / SELECT_MIRROR.turnMs) % DIRECTIONS_CLOCKWISE.length;
        const preview = this.previews.get(this.selected);
        if (!preview) return;
        preview.big.update(delta);
        preview.mirror.setPose(PlayerState.IdleCombat, DIRECTIONS_CLOCKWISE[turn] ?? Direction.South);
        preview.mirror.update(delta);
    }

    /** "Create": starts the game with the chosen class. */
    private startGame(): void {
        this.registry.set(CHOSEN_CHARACTER_KEY, this.selected);
        this.scene.start('Game');
    }

    /** "Cancel": back to the main menu. */
    private cancel(): void {
        this.scene.start('MainMenu');
    }
}
