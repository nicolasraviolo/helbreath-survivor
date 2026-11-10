// Helbreath Off (Fase Off-8B): la ventana de William, junto al teleport de la ciudad (y de pie en la Farm, Off-10A).
// Off-8C: dos ofertas, Gorn el Guerrero y Kaila la Maga. Uno a la vez: contratar a uno despide al otro.
// Fase Off-13B: rehecha entera con el estilo de la Off-12 (medidas y textos en off/config/offMercenaryWindow.ts):
// - Una tarjeta por mercenario: nombre y clase, qué hace, nivel (el tuyo) y precio con separador ("3,700 gold"),
//   una línea de estado y su botón. Precio = pago único según tu nivel (offMercenaryPrice).
// - Sin oro bastante, Hire sale apagado y la tarjeta dice cuánto falta, en rojo (antes la ventana se cerraba y el
//   aviso salía fuera). El que ya tienes dice "At your side" y su botón es Dismiss, que pregunta antes (No marcado).
//   Si tienes al otro, "Replaces ...".
// - Abajo, tu oro y Close. ←/→ entre las tarjetas, ↓ a Close, ↑ vuelve a la última tarjeta; los botones apagados se
//   saltan. Esc / B cierran. El mundo espera en pausa debajo (openOverlay).
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { openOverlay, type MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_DIALOG_TEXT } from '../config/offDialog';
import { OFF_MERCENARY_WINDOW, OFF_MERCENARY_WINDOW_TEXT } from '../config/offMercenaryWindow';
import { OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_SIZE } from '../config/offTheme';
import { OFF_MERCENARIES, OFF_MERCENARY_IDS, OFF_MERCENARY_TEXT, offMercenaryPrice, type OffMercenaryId } from '../data/offMercenary';
import { offSaveStore } from '../systems/OffSaveStore';
import {
    offButton, offDivider, offFocusGroup, offFrame, offLayoutIssues, offPadHints, offRule, offText, type OffButton, type OffFocusGroup,
} from '../ui/offUi';
import { OFF_DIALOG_SCENE_KEY, type OffDialogSceneData } from './OffDialogScene';

export const OFF_MERCENARY_SCENE_KEY = 'OffMercenary';

const M = OFF_MERCENARY_WINDOW;
const T = OFF_MERCENARY_WINDOW_TEXT;

export interface OffMercenarySceneData extends MenuOverlayData {
    /** Hire: called once this window has closed and the world is running again. */
    onHire: (id: OffMercenaryId, price: number) => void;
    onDismiss: () => void;
}

interface Offer {
    id: OffMercenaryId;
    price: number;
    hired: boolean;
    affordable: boolean;
    status: string;
}

export class OffMercenaryScene extends Phaser.Scene {
    private params!: OffMercenarySceneData;
    private inputSystem!: InputSystem;
    private offers: Offer[] = [];
    private buttons: OffButton[] = [];
    private group!: OffFocusGroup;
    /** The card button the focus came from, for ↑ from Close. */
    private lastCard = 0;
    private hints!: Phaser.GameObjects.Container;
    private openedAt = 0;
    private closed = false;
    private forcePadHints = false;

    constructor() {
        super(OFF_MERCENARY_SCENE_KEY);
    }

    init(data: OffMercenarySceneData): void {
        this.params = data;
        this.offers = [];
        this.buttons = [];
        this.lastCard = 0;
        this.closed = false;
        this.forcePadHints = false;
    }

    create(): void {
        this.openedAt = this.game.loop.time;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, M.shadeAlpha).setOrigin(0).setInteractive();
        offFrame(this, M.x, M.y, M.w, M.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = M.x + M.w / 2;
        const innerW = M.w - M.sidePad * 2;
        offText(this, cx, M.y + M.titleTop, OFF_MERCENARY_TEXT.title, 'title', { originX: 0.5, maxWidth: innerW });
        offDivider(this, M.x + M.sidePad, M.y + M.dividerTop, innerW);
        offText(this, cx, M.y + M.lineTop, OFF_MERCENARY_TEXT.npcShortLine, 'body', { originX: 0.5, color: OFF_THEME_INK.dim, maxWidth: innerW });

        const level = offSaveStore.level;
        const gold = offSaveStore.character.gold;
        const hired = offSaveStore.character.mercenary;
        const rowW = OFF_MERCENARY_IDS.length * M.cardWidth + (OFF_MERCENARY_IDS.length - 1) * M.cardGap;
        OFF_MERCENARY_IDS.forEach((id, i) => {
            const price = offMercenaryPrice(id, level);
            const offer: Offer = { id, price, hired: id === hired, affordable: gold >= price, status: '' };
            offer.status = offer.hired ? T.atYourSide
                : !offer.affordable ? T.needGold(price - gold)
                    : hired ? T.replaces(OFF_MERCENARIES[hired].name) : '';
            this.offers.push(offer);
            this.createCard(offer, cx - rowW / 2 + i * (M.cardWidth + M.cardGap), M.y + M.cardsTop, level);
        });

        const footerY = M.y + M.footerTop;
        const closeX = M.x + M.w - M.sidePad - M.closeWidth;
        offText(this, M.x + M.sidePad, footerY + OFF_THEME_SIZE.buttonHeight / 2, T.yourGold(gold), 'body', {
            originY: 0.5, color: OFF_THEME_INK.gold, maxWidth: closeX - M.x - M.sidePad * 2,
        });
        this.buttons.push(offButton(this, closeX, footerY, T.close, 'normal', () => this.ifReady(() => this.close()), M.closeWidth));
        this.group = offFocusGroup(this.buttons, 0);
        this.hints = offPadHints(this, cx, M.y + M.hintsCentreY, [['A', T.select], ['B', T.close]]);

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
        // Back from the Dismiss question: the press that answered it doesn't reach this window.
        const onResume = (): void => {
            this.openedAt = this.game.loop.time;
        };
        this.events.on(Phaser.Scenes.Events.RESUME, onResume);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));
    }

    private createCard(offer: Offer, x: number, y: number, level: number): void {
        const def = OFF_MERCENARIES[offer.id];
        const pad = M.cardPad;
        const innerW = M.cardWidth - pad * 2;
        const right = x + M.cardWidth - pad;
        offFrame(this, x, y, M.cardWidth, M.cardHeight, { fill: OFF_THEME_COLOR.card });
        const kind = offText(this, right, y + M.nameTop + M.kindShift, def.kind, 'small', { originX: 1 });
        offText(this, x + pad, y + M.nameTop, def.name, 'name', { color: OFF_THEME_INK.gold, maxWidth: innerW - kind.width - pad });
        offText(this, x + pad, y + M.roleTop, OFF_MERCENARY_TEXT.roleLine[offer.id], 'small', { maxWidth: innerW });
        offRule(this, x + pad, y + M.ruleTop, innerW);
        offText(this, x + pad, y + M.priceCentre, T.level(level), 'body', { originY: 0.5, color: OFF_THEME_INK.dim });
        offText(this, right, y + M.priceCentre, T.price(offer.price), 'number', { originX: 1, originY: 0.5, color: OFF_THEME_INK.gold, maxWidth: innerW * M.priceShare });
        if (offer.status) {
            const ink = offer.hired ? OFF_THEME_INK.good : !offer.affordable ? OFF_THEME_INK.bad : OFF_THEME_INK.note;
            offText(this, x + M.cardWidth / 2, y + M.statusTop, offer.status, 'body', { originX: 0.5, color: ink, maxWidth: innerW });
        }
        const button = offer.hired
            ? offButton(this, x + pad, y + M.buttonTop, T.dismiss, 'danger', () => this.ifReady(() => this.askDismiss()), innerW)
            : offButton(this, x + pad, y + M.buttonTop, T.hire, 'main', () => this.ifReady(() => this.hire(offer.id)), innerW);
        button.setEnabled(offer.hired || offer.affordable);
        this.buttons.push(button);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        this.hints.setVisible(this.forcePadHints || input.getLastDevice() === 'gamepad');
        const back = input.justPressed(Action.Back) || input.justPressed(Action.Pause);
        const dx = input.justPressed(Action.MenuLeft) ? -1 : input.justPressed(Action.MenuRight) ? 1 : 0;
        const dy = input.justPressed(Action.MenuUp) ? -1 : input.justPressed(Action.MenuDown) ? 1 : 0;
        const confirm = input.justPressed(Action.Confirm);
        if (!this.ready()) return;
        if (back) {
            this.close();
            return;
        }
        if (dx !== 0 || dy !== 0) this.move(dx, dy);
        if (confirm) this.group.press();
    }

    /** Cards are buttons 0..n-1, Close is the last one. */
    private move(dx: number, dy: number): void {
        const closeIndex = this.buttons.length - 1;
        const at = this.group.index();
        if (at >= 0 && at < closeIndex) this.lastCard = at;
        if (dy > 0 && at !== closeIndex) {
            this.group.focusAt(closeIndex);
            return;
        }
        if (dy < 0 && at === closeIndex) {
            this.focusCard(this.lastCard);
            return;
        }
        if (dx !== 0 && at !== closeIndex) {
            const next = at + dx;
            if (next >= 0 && next < closeIndex && this.buttons[next]?.isEnabled()) this.group.focusAt(next);
        }
    }

    /** That card's button, or the other card's if it is off; Close if both are. */
    private focusCard(i: number): void {
        const closeIndex = this.buttons.length - 1;
        const order = [i, ...this.buttons.slice(0, closeIndex).map((_, j) => j).filter((j) => j !== i)];
        const target = order.find((j) => this.buttons[j]?.isEnabled());
        this.group.focusAt(target ?? closeIndex);
    }

    private ready(): boolean {
        return this.game.loop.time - this.openedAt >= M.inputDelayMs;
    }

    private ifReady(action: () => void): void {
        if (this.ready()) action();
    }

    public askDismiss(): void {
        const hired = this.offers.find((o) => o.hired);
        if (!hired) return;
        const name = OFF_MERCENARIES[hired.id].name;
        const data: Omit<OffDialogSceneData, 'returnTo'> = {
            title: T.dismissTitle(name),
            question: T.dismissQuestion(name),
            warning: T.dismissWarning,
            buttons: [
                { label: OFF_DIALOG_TEXT.no, variant: 'normal' },
                { label: OFF_DIALOG_TEXT.yes, variant: 'danger', onPress: () => this.dismiss() },
            ],
            focus: 0,
            cancel: 0,
        };
        openOverlay(this, OFF_DIALOG_SCENE_KEY, data);
    }

    /** Development (`check offmerchire`): hires as the button would (only with gold enough). */
    public hire(id: OffMercenaryId = 'warrior'): void {
        const offer = this.offers.find((o) => o.id === id);
        if (!offer || offer.hired || !offer.affordable) return;
        this.close();
        this.params.onHire(id, offer.price);
    }

    public dismiss(): void {
        this.close();
        this.params.onDismiss();
    }

    private close(): void {
        if (this.closed) return;
        this.closed = true;
        this.scene.stop();
        this.scene.resume(this.params.returnTo);
    }

    // ---------------------------------------------------------------- development

    /** `check`: the window as if the pad were in use. */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
    }

    /** `check`: the offers, the focus and whether everything fits. */
    public debugState(): { offers: Offer[]; focus: string; issues: string[] } {
        const at = this.group.index();
        const closeIndex = this.buttons.length - 1;
        const focus = at === closeIndex ? T.close : at >= 0 ? `${this.offers[at]?.hired ? T.dismiss : T.hire} ${this.offers[at]?.id ?? ''}` : '';
        return { offers: this.offers, focus, issues: offLayoutIssues(this) };
    }
}
