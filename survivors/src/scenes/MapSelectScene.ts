// Pantalla "Select Map" (Fase 22A): desde la Fase 23 se abre al pisar el teleport de la ciudad, por encima de ella
// (la ciudad queda en pausa debajo; "Back" la reanuda sin recargarla). Cuatro tarjetas en fila, en el orden de data/maps.ts: el trozo del minimapa que se juega, el nombre, lo que
// dura, el Level recomendado (en rojo si el personaje no lo tiene, pero se puede entrar) y si está ganado o cerrado.
// Un mapa se abre al ganar el anterior o al llegar a su Level recomendado (systems/MapUnlockStore.ts).
// Como en Select Character: un clic marca la tarjeta y otro clic en la misma juega (con el dedo, igual).
// Teclado: ←/→ cambia de mapa, Enter juega, Esc vuelve. Mando: cruceta/stick, A y B.
import Phaser from 'phaser';
import { ASSET_BASE_PATH, MINIMAPS, type MinimapKey } from '../config/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { MAP_SELECT, MAP_SELECT_STYLES } from '../config/mapSelect';
import { MENU_BACKGROUND, MENU_BACKGROUND_SCALE, MENU_INPUT_DELAY_MS } from '../config/menus';
import { CHOSEN_MAP_KEY, isMapId, MAP_IDS, MAPS_DATA, type MapDef, type MapId } from '../data/maps';
import { finalBossMinute } from '../data/waves';
import { SpriteText } from '../hb/SpriteText';
import { ACTIVE_CHARACTER_KEY, characterStore } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { mapUnlockStore, type MapLock } from '../systems/MapUnlockStore';
import { startTown, type MapLoadSceneData } from './MapLoadScene';
import { TOWN_SCENE_KEY } from './TownScene';

export interface MapSelectSceneData {
    /** Opened from the town's teleport, with the town paused underneath. */
    fromTown?: boolean;
}

interface Card {
    id: MapId;
    frame: Phaser.GameObjects.Rectangle;
}

export class MapSelectScene extends Phaser.Scene {
    private inputSystem!: InputSystem;
    private cards: Card[] = [];
    private focused = 0;
    private characterLevel = 1;
    private helpText!: Phaser.GameObjects.Text;
    private openedAt = 0;
    private fromTown = false;

    constructor() {
        super('MapSelect');
    }

    init(data: MapSelectSceneData | undefined): void {
        this.fromTown = data?.fromTown === true;
    }

    preload(): void {
        // The cards' pictures: the minimaps, loaded here the first time (they are not part of the first load).
        this.load.setPath(ASSET_BASE_PATH);
        for (const id of MAP_IDS) {
            const key = MAPS_DATA[id].minimap;
            if (!this.textures.exists(key)) this.load.image(key, MINIMAPS[key].file);
        }
    }

    create(): void {
        this.cards = [];
        this.openedAt = this.time.now;
        const uid: unknown = this.registry.get(ACTIVE_CHARACTER_KEY);
        this.characterLevel = characterStore.byUid(typeof uid === 'string' ? uid : undefined)?.level ?? 1;

        this.add.image(0, 0, MENU_BACKGROUND.texture, MENU_BACKGROUND.frame).setOrigin(0).setScale(MENU_BACKGROUND_SCALE);
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, MAP_SELECT.veil.color, MAP_SELECT.veil.alpha).setOrigin(0);
        const { title } = MAP_SELECT;
        new SpriteText(this, GAME_WIDTH / 2, title.y, 'Select Map', title.color, 'center').container.setScale(title.scale);

        MAP_IDS.forEach((id, i) => this.cards.push(this.createCard(id, i)));
        this.createButtons();
        this.helpText = this.add.text(GAME_WIDTH / 2, MAP_SELECT.help.y, '', {
            ...MAP_SELECT_STYLES.help, wordWrap: { width: MAP_SELECT.help.width },
        }).setOrigin(0.5, 0);

        this.inputSystem = new InputSystem(this);
        // Cards and buttons have their own click handlers: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);

        // Start on the last map played, or else on the last open one (the newest challenge).
        const last: unknown = this.registry.get(CHOSEN_MAP_KEY);
        const lastOpen = [...MAP_IDS].reverse().find((id) => this.lockOf(id) === undefined) ?? MAP_IDS[0];
        const start = isMapId(last) && this.lockOf(last) === undefined ? last : lastOpen;
        this.focus(Math.max(0, MAP_IDS.indexOf(start ?? 'traveler')));
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.MenuLeft)) this.focus((this.focused + MAP_IDS.length - 1) % MAP_IDS.length);
        if (input.justPressed(Action.MenuRight)) this.focus((this.focused + 1) % MAP_IDS.length);
        if (input.justPressed(Action.Confirm)) this.play();
        if (input.justPressed(Action.Back)) this.back();
    }

    /** Ignores the key or click that opened the screen. */
    private ready(): boolean {
        return this.time.now - this.openedAt >= MENU_INPUT_DELAY_MS;
    }

    private lockOf(id: MapId): MapLock | undefined {
        return mapUnlockStore.lockOf(id, this.characterLevel);
    }

    private createCard(id: MapId, index: number): Card {
        const def: MapDef = MAPS_DATA[id];
        const { card } = MAP_SELECT;
        const left = (GAME_WIDTH - (card.width * MAP_IDS.length + card.gap * (MAP_IDS.length - 1))) / 2;
        const x = left + index * (card.width + card.gap);
        const cx = x + card.width / 2;
        const frame = this.add.rectangle(x, card.top, card.width, card.height, card.color, card.alpha).setOrigin(0);
        frame.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_UP, () => {
            if (!this.ready()) return;
            if (this.focused === index) this.play();
            else this.focus(index);
        });
        const lock = this.lockOf(id);
        const dim = lock === undefined ? 1 : card.lockedAlpha;
        this.addThumbnail(def, cx, card.top + card.thumbnail.top).setAlpha(dim);

        const lines: Array<[string, Phaser.Types.GameObjects.Text.TextStyle]> = [[def.name, MAP_SELECT_STYLES.name]];
        const minute = finalBossMinute(id);
        if (minute !== undefined) lines.push([`About ${minute + 1} minutes`, MAP_SELECT_STYLES.line]);
        const lowLevel = this.characterLevel < def.recommendedLevel;
        lines.push([`Recommended Level ${def.recommendedLevel}`, lowLevel ? MAP_SELECT_STYLES.lowLevel : MAP_SELECT_STYLES.line]);
        if (card.showDescription) lines.push([def.description, MAP_SELECT_STYLES.description]);
        lines.push([statusLine(id, lock), lock === undefined ? MAP_SELECT_STYLES.won : MAP_SELECT_STYLES.lock]);
        let y = card.top + card.textTop;
        for (const [text, style] of lines) {
            if (text === '') continue;
            const label = this.add.text(cx, y, text, { ...style, wordWrap: { width: card.textWidth } }).setOrigin(0.5, 0);
            if (style === MAP_SELECT_STYLES.name) label.setAlpha(dim);
            y += label.height + 4;
        }
        return { id, frame };
    }

    /** The play area cut out of the map's minimap, as a square picture. */
    private addThumbnail(def: MapDef, cx: number, top: number): Phaser.GameObjects.Image {
        const key: MinimapKey = def.minimap;
        const texture = this.textures.get(key);
        const frameName = 'playArea';
        if (!texture.has(frameName)) {
            const source = texture.getSourceImage();
            const sx = source.width / def.size.width;
            const sy = source.height / def.size.height;
            const area = def.playArea;
            texture.add(frameName, 0, area.x * sx, area.y * sy, area.width * sx, area.height * sy);
        }
        const size = MAP_SELECT.card.thumbnail.size;
        return this.add.image(cx, top, key, frameName).setOrigin(0.5, 0).setDisplaySize(size, size);
    }

    private createButtons(): void {
        const { buttons } = MAP_SELECT;
        const total = buttons.width * 2 + buttons.gap;
        const left = (GAME_WIDTH - total) / 2;
        this.addButton(left, 'Play', () => this.play());
        this.addButton(left + buttons.width + buttons.gap, 'Back', () => this.back());
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
        const id = MAP_IDS[index];
        if (!id) return;
        const lock = this.lockOf(id);
        const def = MAPS_DATA[id];
        if (lock?.kind === 'comingSoon') this.helpText.setText(`${def.name} is coming soon.`);
        else if (lock) this.helpText.setText(`${statusLine(id, lock).replace('\n', ' ')} to play ${def.name}.`);
        else if (this.characterLevel < def.recommendedLevel) this.helpText.setText(`${def.name} is hard at your Level. Good luck!`);
        else this.helpText.setText(`Press Play to enter ${def.name}.`);
    }

    private play(): void {
        const id = MAP_IDS[this.focused];
        if (!id || this.lockOf(id) !== undefined) return;
        this.registry.set(CHOSEN_MAP_KEY, id);
        if (this.fromTown) this.scene.stop(TOWN_SCENE_KEY);
        this.scene.start('MapLoad', { map: id } satisfies MapLoadSceneData);
    }

    /** Back to the town: the one waiting underneath, or a new one (debug ?open=mapselect). */
    private back(): void {
        if (this.fromTown && this.scene.isPaused(TOWN_SCENE_KEY)) {
            this.scene.stop();
            this.scene.resume(TOWN_SCENE_KEY);
            return;
        }
        startTown(this);
    }
}

/** Last line of a card: won, open, locked (and how to open it) or coming soon. */
function statusLine(id: MapId, lock: MapLock | undefined): string {
    if (lock?.kind === 'comingSoon') return 'Coming soon';
    if (lock) return `Win ${MAPS_DATA[lock.previous].name}\nor reach Level ${lock.level}`;
    return mapUnlockStore.hasWon(id) ? 'Cleared' : '';
}
