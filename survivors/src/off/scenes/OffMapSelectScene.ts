// Helbreath Off (Fase Off-10C): el teleport de la Farm o de la ciudad abre esta pantalla "Select Map". Sustituye a la
// ventanita de la Off-7A (OffTeleportScene). El mundo espera en pausa debajo (openOverlay): Esc o B lo reanudan y sigues
// sobre el teleport (no vuelve a abrirse hasta salir de él y volver a pisarlo).
// Fase Off-13B: rehecha como ventana de Off encima del mundo (propietario, 10-nov-2026), con el estilo de la Off-12 y
// medidas en off/config/offMapSelect.ts (antes era la pantalla completa de Survivors, con media tarjeta vacía):
// - "You are in ..." bajo el título (el sitio donde estás nunca es una tarjeta).
// - Una tarjeta por destino (minimapa, nombre y una línea, OffPlaceDef.blurb). La tarjeta es el botón: el ratón la
//   marca al pasar y un clic viaja (sin Play / Back). ←/→ cambian, Enter / A viajan, Esc / B cierran.
import Phaser from 'phaser';
import { ASSET_BASE_PATH, MINIMAPS } from '../../config/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import type { MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_MAP_SELECT } from '../config/offMapSelect';
import { OFF_THEME_COLOR, OFF_THEME_INK } from '../config/offTheme';
import { OFF_PLACE_TEXT, OFF_PLACES, type OffPlaceId } from '../data/offPlaces';
import {
    offCardControl, offDivider, offFocusGroup, offFrame, offLayoutIssues, offPadHints, offText, type OffControl, type OffFocusGroup,
} from '../ui/offUi';

export const OFF_MAP_SELECT_SCENE_KEY = 'OffMapSelect';

const MS = OFF_MAP_SELECT;

export interface OffMapSelectSceneData extends MenuOverlayData {
    /** Where you stand now ("You are in ..."). */
    from: OffPlaceId;
    /** The cards, in this order (offTeleportDestinations). */
    places: readonly OffPlaceId[];
    /** A destination: called once this screen has closed and the world is running again. */
    onChoose: (place: OffPlaceId) => void;
}

export class OffMapSelectScene extends Phaser.Scene {
    private params!: OffMapSelectSceneData;
    private inputSystem!: InputSystem;
    private cards: OffControl[] = [];
    private group!: OffFocusGroup;
    private hints!: Phaser.GameObjects.Container;
    private openedAt = 0;
    private closed = false;
    private forcePadHints = false;
    private blurbIssues: string[] = [];

    constructor() {
        super(OFF_MAP_SELECT_SCENE_KEY);
    }

    init(data: OffMapSelectSceneData): void {
        this.params = data;
        this.cards = [];
        this.closed = false;
        this.forcePadHints = false;
        this.blurbIssues = [];
    }

    preload(): void {
        // The cards' pictures: the minimaps of the places offered, loaded here the first time.
        this.load.setPath(ASSET_BASE_PATH);
        for (const place of this.params.places) {
            const key = OFF_PLACES[place].minimap;
            if (!this.textures.exists(key)) this.load.image(key, MINIMAPS[key].file);
        }
    }

    create(): void {
        this.openedAt = this.game.loop.time;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, MS.shadeAlpha).setOrigin(0).setInteractive();
        offFrame(this, MS.x, MS.y, MS.w, MS.h, { fill: OFF_THEME_COLOR.window, big: true });
        const cx = MS.x + MS.w / 2;
        const innerW = MS.w - MS.sidePad * 2;
        offText(this, cx, MS.y + MS.titleTop, OFF_PLACE_TEXT.mapSelectTitle, 'title', { originX: 0.5, maxWidth: innerW });
        offDivider(this, MS.x + MS.sidePad, MS.y + MS.dividerTop, innerW);
        offText(this, cx, MS.y + MS.hereTop, OFF_PLACE_TEXT.mapSelectHere(OFF_PLACES[this.params.from].name), 'body', {
            originX: 0.5, color: OFF_THEME_INK.dim, maxWidth: innerW,
        });

        const count = this.params.places.length;
        const rowW = count * MS.cardWidth + (count - 1) * MS.cardGap;
        this.params.places.forEach((place, i) => {
            this.cards.push(this.createCard(place, cx - rowW / 2 + i * (MS.cardWidth + MS.cardGap), MS.y + MS.cardsTop));
        });
        this.group = offFocusGroup(this.cards, 0);
        this.hints = offPadHints(this, cx, MS.y + MS.hintsCentreY, [['A', OFF_PLACE_TEXT.mapSelectTravel], ['B', OFF_PLACE_TEXT.mapSelectBack]]);

        this.inputSystem = new InputSystem(this);
        // Cards have their own click zones: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
    }

    private createCard(place: OffPlaceId, x: number, y: number): OffControl {
        const def = OFF_PLACES[place];
        const card = offCardControl(this, x, y, MS.cardWidth, MS.cardHeight, () => {
            if (this.ready()) this.choose(place);
        });
        const cx = x + MS.cardWidth / 2;
        const textW = MS.cardWidth - MS.cardPad * 2;
        this.addThumbnail(place, cx, y + MS.thumbnailTop);
        offText(this, cx, y + MS.nameTop, def.name, 'name', { originX: 0.5, color: OFF_THEME_INK.gold, maxWidth: textW });
        const blurb = offText(this, cx, y + MS.blurbTop, def.blurb, 'small', { originX: 0.5 });
        blurb.setAlign('center').setWordWrapWidth(textW);
        const room = MS.cardHeight - MS.blurbTop - MS.cardPad;
        if (blurb.height > room) this.blurbIssues.push(`${def.name}: the line is ${Math.ceil(blurb.height)} px tall, room for ${room}`);
        return card;
    }

    /** The place's play area cut out of its minimap, as a square picture (as Survivors' cards). */
    private addThumbnail(place: OffPlaceId, cx: number, top: number): void {
        const def = OFF_PLACES[place];
        const texture = this.textures.get(def.minimap);
        const frameName = 'playArea';
        if (!texture.has(frameName)) {
            const source = texture.getSourceImage();
            const sx = source.width / def.size.width;
            const sy = source.height / def.size.height;
            const area = def.playArea;
            texture.add(frameName, 0, area.x * sx, area.y * sy, area.width * sx, area.height * sy);
        }
        this.add.image(cx, top, def.minimap, frameName).setOrigin(0.5, 0).setDisplaySize(MS.thumbnail, MS.thumbnail);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        this.hints.setVisible(this.forcePadHints || input.getLastDevice() === 'gamepad');
        const back = input.justPressed(Action.Back) || input.justPressed(Action.Pause);
        const step = input.justPressed(Action.MenuLeft) || input.justPressed(Action.MenuUp) ? -1
            : input.justPressed(Action.MenuRight) || input.justPressed(Action.MenuDown) ? 1 : 0;
        const confirm = input.justPressed(Action.Confirm);
        if (!this.ready()) return;
        if (back) {
            this.close();
            return;
        }
        if (step !== 0) this.group.move(step);
        if (confirm) this.group.press();
    }

    /** Ignores the key or click that opened the screen. */
    private ready(): boolean {
        return this.game.loop.time - this.openedAt >= MS.inputDelayMs;
    }

    /** Goes to that place (a card's click, A / Enter; `check offteleport`). */
    public choose(place: OffPlaceId): void {
        if (this.closed) return;
        this.close();
        this.params.onChoose(place);
    }

    /** Back to the world, on the teleport. */
    private close(): void {
        if (this.closed) return;
        this.closed = true;
        this.scene.stop();
        this.scene.resume(this.params.returnTo);
    }

    // ---------------------------------------------------------------- development

    /** Development: the places on the cards, in order. */
    public debugPlaces(): readonly OffPlaceId[] {
        return this.params.places;
    }

    /** `check`: the window as if the pad were in use. */
    public debugShowPadHints(): void {
        this.forcePadHints = true;
    }

    /** `check`: cards, the marked one and whether everything fits. */
    public debugState(): { from: OffPlaceId; places: readonly OffPlaceId[]; focus: string; issues: string[] } {
        return {
            from: this.params.from,
            places: this.params.places,
            focus: this.params.places[this.group.index()] ?? '',
            issues: [...offLayoutIssues(this), ...this.blurbIssues],
        };
    }
}
