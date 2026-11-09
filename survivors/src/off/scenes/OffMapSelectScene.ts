// Helbreath Off (Fase Off-10C): el teleport de la Farm o de la ciudad abre esta pantalla "Select Map", hecha con la
// misma estructura que la de Survivors (scenes/MapSelectScene.ts; propietario, 9-nov-2026): el fondo del menú,
// tarjetas en fila con el minimapa, el nombre y una línea del sitio (OffPlaceDef.blurb), y Play / Back debajo.
// Mismas medidas y colores (config/mapSelect.ts). El mundo espera en pausa debajo (openOverlay): Back, Esc o B lo
// reanudan y sigues sobre el teleport (no vuelve a abrirse hasta salir de él y volver a pisarlo).
// Como en Survivors: un clic marca la tarjeta y otro clic en la misma entra; ←/→ cambia, Enter entra; mando: cruceta o
// stick, A y B.
// Sustituye a la ventanita de la Off-7A (OffTeleportScene), que tenía una lista de botones.
import Phaser from 'phaser';
import { ASSET_BASE_PATH, MINIMAPS } from '../../config/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { MAP_SELECT, MAP_SELECT_STYLES } from '../../config/mapSelect';
import { MAP_SELECT_BACKGROUND_ROWS, MENU_BACKGROUND, MENU_BACKGROUND_SCALE, MENU_INPUT_DELAY_MS } from '../../config/menus';
import { SpriteText } from '../../hb/SpriteText';
import type { MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { Action, InputSystem } from '../../systems/InputSystem';
import { OFF_PLACE_TEXT, OFF_PLACES, type OffPlaceId } from '../data/offPlaces';

export const OFF_MAP_SELECT_SCENE_KEY = 'OffMapSelect';

export interface OffMapSelectSceneData extends MenuOverlayData {
    /** The cards, in this order (offTeleportDestinations). */
    places: readonly OffPlaceId[];
    /** A destination: called once this screen has closed and the world is running again. */
    onChoose: (place: OffPlaceId) => void;
}

interface Card {
    place: OffPlaceId;
    frame: Phaser.GameObjects.Rectangle;
}

export class OffMapSelectScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private places: readonly OffPlaceId[] = [];
    private onChoose: (place: OffPlaceId) => void = () => undefined;
    private returnTo = '';
    private cards: Card[] = [];
    private focused = 0;
    private helpText!: Phaser.GameObjects.Text;
    private openedAt = 0;

    constructor() {
        super(OFF_MAP_SELECT_SCENE_KEY);
    }

    init(data: OffMapSelectSceneData): void {
        this.places = data.places;
        this.onChoose = data.onChoose;
        this.returnTo = data.returnTo;
    }

    preload(): void {
        // The cards' pictures: the minimaps of the places offered, loaded here the first time.
        this.load.setPath(ASSET_BASE_PATH);
        for (const place of this.places) {
            const key = OFF_PLACES[place].minimap;
            if (!this.textures.exists(key)) this.load.image(key, MINIMAPS[key].file);
        }
    }

    create(): void {
        this.cards = [];
        this.openedAt = this.time.now;
        this.add.image(0, 0, MENU_BACKGROUND.texture, MENU_BACKGROUND.frame).setOrigin(0)
            .setCrop(0, 0, MENU_BACKGROUND.width, MAP_SELECT_BACKGROUND_ROWS)
            .setScale(MENU_BACKGROUND_SCALE, GAME_HEIGHT / MAP_SELECT_BACKGROUND_ROWS);
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, MAP_SELECT.veil.color, MAP_SELECT.veil.alpha).setOrigin(0);
        const { title } = MAP_SELECT;
        new SpriteText(this, GAME_WIDTH / 2, title.y, OFF_PLACE_TEXT.mapSelectTitle, title.color, 'center').container.setScale(title.scale);

        const left = this.rowLeft();
        this.places.forEach((place, i) => this.cards.push(this.createCard(place, i, left)));
        this.createButtons();
        this.helpText = this.add.text(GAME_WIDTH / 2, MAP_SELECT.help.y, '', {
            ...MAP_SELECT_STYLES.help, wordWrap: { width: MAP_SELECT.help.width },
        }).setOrigin(0.5, 0);

        this.inputSystem = new InputSystem(this);
        // Cards and buttons have their own click handlers: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
        this.focus(0);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        const count = this.places.length;
        if (input.justPressed(Action.MenuLeft)) this.focus((this.focused + count - 1) % count);
        if (input.justPressed(Action.MenuRight)) this.focus((this.focused + 1) % count);
        if (input.justPressed(Action.Confirm)) this.play();
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) this.back();
    }

    /** Development (`check offteleport`): goes to that place, as Play on its card would. */
    public choose(place: OffPlaceId): void {
        this.close();
        this.onChoose(place);
    }

    /** Development: the places on the cards, in order. */
    public debugPlaces(): readonly OffPlaceId[] {
        return this.places;
    }

    /** Ignores the key or click that opened the screen. */
    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }

    /** Left edge of the row of cards, centred on the screen (they always fit: three at most). */
    private rowLeft(): number {
        const { card } = MAP_SELECT;
        const count = this.places.length;
        return (GAME_WIDTH - (card.width * count + card.gap * (count - 1))) / 2;
    }

    private createCard(place: OffPlaceId, index: number, left: number): Card {
        const def = OFF_PLACES[place];
        const { card } = MAP_SELECT;
        const x = left + index * (card.width + card.gap);
        const cx = x + card.width / 2;
        const frame = this.add.rectangle(x, card.top, card.width, card.height, card.color, card.alpha).setOrigin(0);
        frame.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_UP, () => {
            if (!this.ready()) return;
            if (this.focused === index) this.play();
            else this.focus(index);
        });
        this.addThumbnail(place, cx, card.top + card.thumbnail.top);
        let y = card.top + card.textTop;
        for (const [text, style] of [[def.name, MAP_SELECT_STYLES.name], [def.blurb, MAP_SELECT_STYLES.line]] as const) {
            const label = this.add.text(cx, y, text, { ...style, wordWrap: { width: card.textWidth } }).setOrigin(0.5, 0);
            y += label.height + 4;
        }
        return { place, frame };
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
        const size = MAP_SELECT.card.thumbnail.size;
        this.add.image(cx, top, def.minimap, frameName).setOrigin(0.5, 0).setDisplaySize(size, size);
    }

    private createButtons(): void {
        const { buttons } = MAP_SELECT;
        const total = buttons.width * 2 + buttons.gap;
        const left = (GAME_WIDTH - total) / 2;
        this.addButton(left, OFF_PLACE_TEXT.mapSelectPlay, () => this.play());
        this.addButton(left + buttons.width + buttons.gap, OFF_PLACE_TEXT.mapSelectBack, () => this.back());
    }

    private addButton(x: number, text: string, action: () => void): void {
        const { buttons } = MAP_SELECT;
        const frame = this.add.rectangle(x, buttons.y, buttons.width, buttons.height, buttons.color)
            .setOrigin(0).setStrokeStyle(1, buttons.border);
        this.add.text(x + buttons.width / 2, buttons.y + buttons.height / 2, text, MAP_SELECT_STYLES.button).setOrigin(0.5);
        frame.setInteractive({ useHandCursor: true });
        frame.on(Phaser.Input.Events.POINTER_OVER, () => frame.setStrokeStyle(1, buttons.litBorder));
        frame.on(Phaser.Input.Events.POINTER_OUT, () => frame.setStrokeStyle(1, buttons.border));
        frame.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) action();
        });
    }

    private focus(index: number): void {
        this.focused = index;
        const { card } = MAP_SELECT;
        this.cards.forEach((c, i) => c.frame.setStrokeStyle(
            i === index ? card.focusedBorderWidth : card.borderWidth,
            i === index ? card.focusedBorder : card.border,
        ));
        const place = this.places[index];
        if (place) this.helpText.setText(OFF_PLACE_TEXT.mapSelectHelp(OFF_PLACES[place].name));
    }

    private play(): void {
        const place = this.places[this.focused];
        if (place) this.choose(place);
    }

    /** Back to the world, on the teleport. */
    private back(): void {
        this.close();
    }

    private close(): void {
        this.scene.stop();
        this.scene.resume(this.returnTo);
    }
}
