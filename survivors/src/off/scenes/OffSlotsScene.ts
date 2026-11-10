// Helbreath Off: pantalla "Select Character" (8-nov-2026), que sale al pulsar Play en la pantalla de Off si hay algún
// personaje. Fase Off-13E (10-nov-2026): rehecha entera con el estilo oscuro de la Off-12 (medidas y textos en
// off/config/offSlots.ts; antes era la de Survivors con el arte del original).
// - Detrás, la imagen del original muy oscurecida. Encima, una ventana con cuatro tarjetas (offSlotCard): el personaje
//   caminando en el sitio y girando, vestido con su equipo, con nombre, Level y EXP; o "Empty".
// - Bajo las tarjetas, el hueco marcado: nombre, Level y ciudad; los puntos sin repartir o por qué un botón está apagado.
// - Botones Start, Create New Character, Delete Character y Log Out. Start y Delete se apagan en un hueco vacío (ahí el
//   principal es Create, que crea en ese hueco); Create se apaga con los cuatro huecos llenos. Change Password ya no está.
// - Ratón: un clic marca el hueco y otro clic en el mismo juega (como el original); los botones, con un clic.
// - Teclado y mando: ←/→ cambia de hueco (da la vuelta), ↓ baja a los botones (a Start, o a Create en un hueco vacío),
//   ↑ o Esc / B vuelven a las tarjetas. En las tarjetas, Enter / A juega (o crea en un hueco vacío), Supr / Y borra
//   (pregunta, OffDialogScene) y Esc / B vuelve a la pantalla de Off.
import Phaser from 'phaser';
import { SLOTS_BACKGROUND, SLOTS_INPUT_DELAY_MS, SLOTS_SCALE, SLOTS_TURN_MS } from '../../config/characterSlots';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { CharacterSprite } from '../../entities/CharacterSprite';
import { Direction } from '../../hb/directions';
import { PlayerState } from '../../hb/playerAppearance';
import { openOverlay } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_DIALOG_TEXT } from '../config/offDialog';
import { OFF_SLOT_CARD, OFF_SLOTS, OFF_SLOTS_LAYOUT } from '../config/offSlots';
import { OFF_THEME_COLOR, OFF_THEME_INK } from '../config/offTheme';
import { offEquipmentLook } from '../data/offItems';
import { offLevelForExp } from '../data/offLevel';
import { OFF_PLACES, offHomePlace } from '../data/offPlaces';
import { OFF_NOVICE } from '../data/offWorld';
import { dressOffBody } from '../entities/OffCharacter';
import { OFF_CHARACTER_SLOT_COUNT, offSaveStore } from '../systems/OffSaveStore';
import {
    OFF_PAD_DPAD, offButton, offDivider, offFitText, offFocusGroup, offFrame, offLayoutIssues, offPadHints, offRule, offSlotCard, offText,
    type OffButton, type OffFocusGroup, type OffSlotCard,
} from '../ui/offUi';
import { OFF_CREATE_SCENE_KEY, type OffCreateSceneData } from './OffCreateScene';
import { OFF_DIALOG_SCENE_KEY, type OffDialogSceneData } from './OffDialogScene';
import { startOffWorld } from './OffWorldScene';

export const OFF_SLOTS_SCENE_KEY = 'OffSlots';

const L = OFF_SLOTS_LAYOUT;
const T = OFF_SLOTS;

/** The original turns the characters this way round (m_cMenuDir 1..8). */
const DIRECTIONS_CLOCKWISE = [
    Direction.South, Direction.SouthWest, Direction.West, Direction.NorthWest,
    Direction.North, Direction.NorthEast, Direction.East, Direction.SouthEast,
] as const;

/** The buttons, in their order on the row. */
const Button = { Start: 0, Create: 1, Delete: 2, LogOut: 3 } as const;

export interface OffSlotsSceneData {
    /** Slot marked when the screen opens (default: the one last played). */
    focus?: number;
}

export class OffSlotsScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private cards: OffSlotCard[] = [];
    private sprites: (CharacterSprite | undefined)[] = [];
    private buttons: OffButton[] = [];
    private buttonGroup!: OffFocusGroup;
    /** Where the keyboard / pad focus is: on the cards or on the button row. */
    private onButtons = false;
    private marked = 0;
    /** The mouse marked the slot: the third line says a second click plays. */
    private markedByClick = false;
    private infoLines: Phaser.GameObjects.Text[] = [];
    private hints: Phaser.GameObjects.Container | undefined;
    private forcePadHints = false;
    private openedAt = 0;
    private walkTime = 0;
    private initialFocus: number | undefined;

    constructor() {
        super(OFF_SLOTS_SCENE_KEY);
    }

    init(data: OffSlotsSceneData): void {
        this.initialFocus = data.focus;
        this.cards = [];
        this.sprites = [];
        this.buttons = [];
        this.onButtons = false;
        this.markedByClick = false;
        this.hints = undefined;
        this.forcePadHints = false;
        this.walkTime = 0;
    }

    create(): void {
        this.openedAt = this.time.now;
        this.add.image(0, 0, SLOTS_BACKGROUND.texture, SLOTS_BACKGROUND.frame).setOrigin(0).setScale(SLOTS_SCALE);
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, L.shadeColor, L.shadeAlpha).setOrigin(0);
        offFrame(this, L.x, L.y, L.w, L.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = L.x + L.w / 2;
        const innerW = L.w - L.sidePad * 2;
        const left = L.x + L.sidePad;
        offText(this, cx, L.y + L.titleTop, T.title, 'title', { originX: 0.5, maxWidth: innerW });
        offDivider(this, left, L.y + L.dividerTop, innerW);

        for (let i = 0; i < OFF_CHARACTER_SLOT_COUNT; i++) this.createCard(i, left + i * (OFF_SLOT_CARD.width + L.cardGap));

        const infoY = L.y + L.infoTop;
        this.infoLines = [
            offText(this, cx, infoY, '', 'body', { originX: 0.5 }),
            offText(this, cx, infoY + L.infoLineGap, '', 'small', { originX: 0.5 }),
            offText(this, cx, infoY + L.infoLineGap + L.infoSmallGap, '', 'small', { originX: 0.5 }),
        ];
        this.createButtons(left);
        offRule(this, left, L.y + L.dividerBottom, innerW, OFF_THEME_COLOR.line);

        this.inputSystem = new InputSystem(this);
        // Cards and buttons have their own click zones: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);

        // Back from the delete question: drawn again with the same slot marked.
        const onResume = () => this.scene.restart({ focus: this.marked } satisfies OffSlotsSceneData);
        this.events.on(Phaser.Scenes.Events.RESUME, onResume);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));

        this.mark(this.initialFocus ?? offSaveStore.slot);
    }

    private createCard(index: number, x: number): void {
        const saved = offSaveStore.peek(index);
        const card = offSlotCard(this, x, L.y + L.cardsTop, OFF_SLOT_CARD, {
            character: saved && {
                name: saved.name,
                level: String(offLevelForExp(saved.exp)),
                exp: saved.exp.toLocaleString('en-US'),
            },
            levelLabel: T.levelLabel,
            expLabel: T.expLabel,
            emptyLabel: T.emptyLabel,
            emptyLine: T.emptyLine,
        }, () => {
            if (this.ready()) this.onCardClicked(index);
        });
        this.cards.push(card);
        if (!saved) {
            this.sprites.push(undefined);
            return;
        }
        const sprite = new CharacterSprite(this, OFF_NOVICE, saved.look, card.feetX, card.feetY);
        sprite.container.setScale(L.characterScale * SLOTS_SCALE);
        dressOffBody(sprite, OFF_NOVICE, offEquipmentLook(saved.equipment));
        sprite.setPose(PlayerState.Walk, Direction.South);
        this.sprites.push(sprite);
    }

    private createButtons(left: number): void {
        const actions = [
            () => this.enter(this.marked),
            () => this.newCharacter(),
            () => this.deleteFocused(),
            () => this.logOut(),
        ];
        let x = left;
        L.buttonWidths.forEach((width, i) => {
            const button = offButton(this, x, L.y + L.buttonsTop, T.buttons[i] ?? '', 'normal', () => {
                if (this.ready()) actions[i]?.();
            }, width, L.buttonHeight);
            this.buttons.push(button);
            x += width + L.buttonGap;
        });
        this.buttonGroup = offFocusGroup(this.buttons);
        this.buttonGroup.blur();
        // The mouse over a button takes the focus there (never two lit pieces at once).
        this.buttons.forEach((b, i) => b.setOnHover(() => this.focusButton(i)));
    }

    override update(_time: number, delta: number): void {
        this.updateCharacters(delta);
        const input = this.inputSystem;
        input.update();
        this.hints?.setVisible(this.forcePadHints || input.getLastDevice() === 'gamepad');
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuLeft)) this.moveFocus('left');
        else if (input.justPressed(Action.MenuRight)) this.moveFocus('right');
        else if (input.justPressed(Action.MenuDown)) this.moveFocus('down');
        else if (input.justPressed(Action.MenuUp)) this.moveFocus('up');
        if (input.justPressed(Action.Confirm)) this.confirm();
        // Y / Del only on the cards: on the buttons its hint isn't shown (Delete Character is there to press).
        if (!this.onButtons && input.justPressed(Action.OffDrop)) this.deleteFocused();
        if (input.justPressed(Action.Back)) {
            if (this.onButtons) this.moveFocus('up');
            else this.logOut();
        }
    }

    /** Keyboard / pad: along the cards (going round) or the buttons; down / up between the two rows. */
    public moveFocus(direction: 'left' | 'right' | 'up' | 'down'): void {
        const step = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
        if (this.onButtons) {
            if (step !== 0) this.buttonGroup.move(step);
            else if (direction === 'up') this.focusCards();
            return;
        }
        if (step !== 0) this.mark((this.marked + step + OFF_CHARACTER_SLOT_COUNT) % OFF_CHARACTER_SLOT_COUNT);
        else if (direction === 'down') this.focusButton(this.markedSaved() ? Button.Start : Button.Create);
    }

    /** Enter / A: plays (or creates) on a card; presses the button with the focus. */
    private confirm(): void {
        if (this.onButtons) this.buttonGroup.press();
        else this.enter(this.marked);
    }

    /** As in the original: a character is marked first and plays on the second click. */
    private onCardClicked(index: number): void {
        if (index === this.marked) {
            this.enter(index);
            return;
        }
        this.onButtons = false;
        this.buttonGroup.blur();
        this.mark(index, true);
    }

    private focusCards(): void {
        this.onButtons = false;
        this.buttonGroup.blur();
        this.refresh();
    }

    private focusButton(index: number): void {
        this.onButtons = true;
        this.buttonGroup.focusAt(index);
        this.refresh();
    }

    private mark(index: number, byClick = false): void {
        this.marked = index;
        this.markedByClick = byClick;
        this.refresh();
    }

    private markedSaved(): boolean {
        return offSaveStore.peek(this.marked) !== undefined;
    }

    /** Draws the state again: marked card and focus ring, buttons on or off, information lines and pad hints. */
    private refresh(): void {
        this.cards.forEach((card, i) => {
            card.setMarked(i === this.marked);
            card.setFocused(!this.onButtons && i === this.marked);
        });
        const saved = offSaveStore.peek(this.marked);
        const full = offSaveStore.firstFree < 0;
        const [start, create, del] = [this.buttons[Button.Start], this.buttons[Button.Create], this.buttons[Button.Delete]];
        start?.setEnabled(saved !== undefined);
        start?.setVariant(saved ? 'main' : 'normal');
        create?.setEnabled(!full);
        create?.setVariant(saved ? 'normal' : 'main');
        del?.setEnabled(saved !== undefined);
        this.refreshInfo(full);
        this.refreshHints();
    }

    private refreshInfo(full: boolean): void {
        const saved = offSaveStore.peek(this.marked);
        const lines: [string, string][] = [];
        if (saved) {
            const home = OFF_PLACES[offHomePlace(saved.faction)].name;
            lines.push([T.characterInfo(saved.name, offLevelForExp(saved.exp), home), OFF_THEME_INK.text]);
            if (saved.points > 0) lines.push([T.pointsInfo(saved.points), OFF_THEME_INK.gold]);
        } else {
            lines.push([T.emptyInfo, OFF_THEME_INK.text], [T.emptyReason, OFF_THEME_INK.dim]);
        }
        if (this.markedByClick && saved) lines.push([T.clickAgain, OFF_THEME_INK.dim]);
        else if (full) lines.push([T.fullReason, OFF_THEME_INK.dim]);
        // One after another, with no empty line between them.
        const width = L.w - L.sidePad * 2;
        this.infoLines.forEach((t, i) => {
            const [text, color] = lines[i] ?? ['', OFF_THEME_INK.dim];
            t.setText(text).setColor(color);
            offFitText(t, i === 0 ? 'body' : 'small', width);
        });
    }

    /** The pad hints row: what A does depends on where the focus is. */
    private refreshHints(): void {
        const visible = this.hints?.visible ?? false;
        this.hints?.destroy();
        const saved = this.markedSaved();
        const hints: [string, string][] = [[OFF_PAD_DPAD, T.hintMove]];
        if (this.onButtons) {
            hints.push(['A', T.hintSelect], ['B', T.hintBackToSlots]);
        } else {
            hints.push(['A', saved ? T.hintStart : T.hintCreate]);
            if (saved) hints.push(['Y', T.hintDelete]);
            hints.push(['B', T.hintLogOut]);
        }
        this.hints = offPadHints(this, L.x + L.w / 2, L.y + L.hintsCentreY, hints).setVisible(visible);
    }

    /** Start (and Enter / A on a card): plays with the character in that slot; on an empty slot, creates one there. */
    public enter(index: number): void {
        if (!offSaveStore.peek(index)) {
            this.openCreate(index);
            return;
        }
        offSaveStore.select(index);
        startOffWorld(this);
    }

    /** Create New Character: on the marked slot if it's empty, else in the first empty one. */
    public newCharacter(): void {
        const slot = this.markedSaved() ? offSaveStore.firstFree : this.marked;
        if (slot >= 0) this.openCreate(slot);
    }

    private openCreate(slot: number): void {
        this.scene.start(OFF_CREATE_SCENE_KEY, { slot } satisfies OffCreateSceneData);
    }

    /** Delete Character: asks first (OffDialogScene), "No" marked. Nothing on an empty slot. */
    public deleteFocused(): void {
        const slot = this.marked;
        const saved = offSaveStore.peek(slot);
        if (!saved) return;
        const data: Omit<OffDialogSceneData, 'returnTo'> = {
            title: T.deleteTitle,
            question: T.deleteQuestion(saved.name),
            warning: T.deleteWarning,
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
        for (const sprite of this.sprites) {
            if (!sprite) continue;
            if (sprite.direction !== direction) sprite.setPose(PlayerState.Walk, direction);
            sprite.update(delta);
        }
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= SLOTS_INPUT_DELAY_MS;
    }

    // ---------------------------------------------------------------- development

    /** `check`: the window as if the pad were in use. */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
        this.hints?.setVisible(true);
    }

    /** `check`: marked slot, where the focus is, which buttons are on, the information lines and whether all fits. */
    public debugState(): { marked: number; focus: string; enabled: string[]; info: string[]; issues: string[] } {
        const focusIndex = this.buttonGroup.index();
        return {
            marked: this.marked,
            focus: this.onButtons ? T.buttons[focusIndex] ?? '' : `slot ${this.marked + 1}`,
            enabled: this.buttons.flatMap((b, i) => (b.isEnabled() ? [T.buttons[i] ?? ''] : [])),
            info: this.infoLines.map((t) => t.text).filter((t) => t !== ''),
            issues: offLayoutIssues(this),
        };
    }
}
