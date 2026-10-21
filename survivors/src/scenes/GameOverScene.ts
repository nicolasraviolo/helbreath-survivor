// Pantalla de final de partida (Fase 7): victoria al matar al jefe final o derrota al morir. Se abre encima de la
// partida, que queda pausada. Muestra tiempo, Power, bajas, la EXP que ha ganado el personaje y su Level (Fase 20A; los
// puntos nuevos se reparten en la ventana Character, desde Select Character), el arma o hechizo y la armadura que llevabas, y los logros
// conseguidos en esta partida (Fase 14B; el aviso del HUD queda tapado por esta pantalla) y las miniaturas del botín
// encontrado (Fase 21A, petición del propietario del 20-oct-2026).
// Botones originales (dialogtext.spr): Restart = otra partida con la misma clase; Change = volver a elegir clase;
// Log Out = volver al menú principal.
// Se maneja con ←/→ o cruceta + Enter/A, o con el ratón.
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { GAME_OVER } from '../config/hud';
import { px, UI_TEXT, UI_FONT_SIZE } from '../config/ui';
import { SpriteText } from '../hb/SpriteText';
import type { ExpResult } from '../systems/CharacterStore';
import { STAT_POINTS_PER_LEVEL } from '../data/characterLevel';
import { itemPackTexture } from '../config/equipment';
import type { Gender } from '../data/appearance';
import { itemInfo, itemPicture } from '../data/items';
import type { OwnedItem } from '../data/loot';
import { attributeColor, ATTRIBUTES } from '../data/attributes';
import { setColouredTexture } from '../hb/additiveTint';
import type { RunLootResult } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import { formatTime } from '../utils/format';

export interface GameOverSceneData {
    victory: boolean;
    elapsedMs: number;
    level: number;
    kills: number;
    className: string;
    /** Weapon or spell in hand. */
    weaponName: string;
    /** Armor pieces worn, by name. */
    armorNames: readonly string[];
    /** Achievements unlocked during this run, by name. */
    achievementNames: readonly string[];
    /** Maps this win opened in Select Map (Fase 22A), by name. */
    newMaps: readonly string[];
    /** What the run's EXP did to the character's Level (undefined for runs without a saved character). */
    exp: ExpResult | undefined;
    /** Every item picked up this run (Fase 21A), and the gender its pictures are drawn for. */
    loot: readonly OwnedItem[];
    /** What happened to it (Fase 21D): lost (died without a Zem) or saved by a Zem. Undefined: kept as usual. */
    lootResult: RunLootResult | undefined;
    gender: Gender;
    onRestart: () => void;
    /** Back to the town (Fase 23; it was Select Character before). */
    onTown: () => void;
    onMainMenu: () => void;
}

interface Button {
    image: Phaser.GameObjects.Image;
    frame: number;
    action: () => void;
    /** A button with our own word over the original wood (the town's, Fase 23). */
    word?: { strips: Array<{ image: Phaser.GameObjects.Image; cropWidth: number | undefined }>; text: Phaser.GameObjects.Text };
}

export class GameOverScene extends Phaser.Scene {
    private params!: GameOverSceneData;
    private inputSystem!: InputSystem;
    private buttons: Button[] = [];
    private selected = 0;
    private openedAt = 0;
    private chosen = false;

    constructor() {
        super('GameOver');
    }

    init(data: GameOverSceneData): void {
        this.params = data;
        this.buttons = [];
        this.selected = 0;
        this.chosen = false;
    }

    create(): void {
        const p = this.params;
        this.openedAt = this.time.now;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, GAME_OVER.shadeAlpha).setOrigin(0);
        const title = new SpriteText(this, GAME_WIDTH / 2, GAME_OVER.titleY, p.victory ? 'Victory!' : 'You have fallen',
            p.victory ? GAME_OVER.victoryColor : GAME_OVER.defeatColor, 'center');
        title.container.setScale(GAME_OVER.titleScale);

        const lines = [
            `${p.className}  ·  Power ${p.level}`,
            `Time ${formatTime(p.elapsedMs)}  ·  ${p.kills} kills`,
            '',
            p.weaponName,
            p.armorNames.length > 0 ? p.armorNames.join(', ') : 'No armor',
        ];
        this.add.text(GAME_WIDTH / 2, GAME_OVER.statsY, lines, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.large), color: '#e8d9a8', align: 'center', lineSpacing: 6,
        }).setOrigin(0.5, 0);

        const news = [
            ...(p.achievementNames.length > 0 ? [`Achievements: ${p.achievementNames.join(', ')}`] : []),
            ...(p.newMaps.length > 0 ? [`New map: ${p.newMaps.join(', ')}`] : []),
        ];
        if (news.length > 0) {
            this.add.text(GAME_WIDTH / 2, GAME_OVER.achievementsY, news.join(' · '), {
                ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: GAME_OVER.achievementsColor,
                stroke: '#000000', strokeThickness: 3, align: 'center', wordWrap: { width: GAME_OVER.achievementsWrap },
            }).setOrigin(0.5);
        }

        if (p.exp) this.addExpBlock(p.exp);
        this.addLootRow(p.loot);
        this.addLootNote(p.lootResult);

        this.addButton(GAME_OVER.restartFrame, -1, p.onRestart);
        this.addWordButton(0, p.onTown);
        this.addButton(GAME_OVER.logOutFrame, 1, p.onMainMenu);
        this.highlight(0);

        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        const count = this.buttons.length;
        if (input.justPressed(Action.MenuLeft)) this.highlight((this.selected - 1 + count) % count);
        if (input.justPressed(Action.MenuRight)) this.highlight((this.selected + 1) % count);
        if (input.justPressed(Action.Pick)) this.choose(this.selected);
    }

    /** "+N EXP · Level N", the bar towards the next Level, and "Level up! +3 points" or what is left to the next one. */
    private addExpBlock(exp: ExpResult): void {
        const g = GAME_OVER;
        const x = GAME_WIDTH / 2;
        this.add.text(x, g.expY, `+${exp.gained.toLocaleString('en-US')} EXP  ·  Level ${exp.level}`, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.large), color: '#e8d9a8', align: 'center',
        }).setOrigin(0.5, 0);
        const ratio = exp.expToNext > 0 ? exp.exp / exp.expToNext : 1;
        const left = x - g.expBarWidth / 2;
        this.add.rectangle(left, g.expBarY, g.expBarWidth, g.expBarHeight, g.expBarBack).setOrigin(0).setStrokeStyle(1, g.expBarBorder);
        this.add.rectangle(left, g.expBarY, g.expBarWidth * ratio, g.expBarHeight, g.expBarFill).setOrigin(0);
        const levelsUp = exp.level - exp.levelBefore;
        const note = levelsUp > 0
            ? `Level up! +${levelsUp * STAT_POINTS_PER_LEVEL} points`
            : exp.expToNext > 0 ? `${(exp.expToNext - exp.exp).toLocaleString('en-US')} EXP to Level ${exp.level + 1}` : 'Max Level';
        this.add.text(x, g.expNoteY, note, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: levelsUp > 0 ? 'bold' : 'normal',
            color: levelsUp > 0 ? g.expLevelUpColor : g.expNoteColor, stroke: '#000000', strokeThickness: 3, align: 'center',
        }).setOrigin(0.5, 0);
    }

    /** Fase 21D: "Lost: N items (no Zem)" or "Your Zem saved N items", under the pictures. */
    private addLootNote(result: RunLootResult | undefined): void {
        if (!result || (!result.lost && !result.zemUsed)) return;
        const g = GAME_OVER;
        const items = `${result.found} item${result.found === 1 ? '' : 's'}`;
        const text = result.lost ? `Lost: ${items} (no Zem equipped)` : `Your Zem saved ${items}`;
        this.add.text(GAME_WIDTH / 2, g.lootNoteY, text, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
            color: result.lost ? g.lootLostColor : g.lootSavedColor,
        }).setOrigin(0.5);
    }

    /** "Loot" and the pictures of the items found, centred; "+N" if there are more than fit. Dimmed if they were lost. */
    private addLootRow(loot: readonly OwnedItem[]): void {
        const g = GAME_OVER;
        const style = { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 };
        if (loot.length === 0) {
            this.add.text(GAME_WIDTH / 2, g.lootY, 'No loot this run', { ...style, fontStyle: 'normal', color: g.lootNoneColor }).setOrigin(0.5);
            return;
        }
        const shown = loot.slice(0, g.lootMax);
        const label = this.add.text(0, g.lootY, 'Loot', { ...style, color: g.lootLabelColor }).setOrigin(0, 0.5);
        const more = loot.length > shown.length
            ? this.add.text(0, g.lootY, `+${loot.length - shown.length}`, { ...style, color: g.lootLabelColor }).setOrigin(0, 0.5)
            : undefined;
        const step = g.lootIconSize + g.lootGap;
        const width = label.width + g.lootGap * 2 + shown.length * step - g.lootGap + (more ? g.lootGap + more.width : 0);
        let x = (GAME_WIDTH - width) / 2;
        label.setX(x);
        x += label.width + g.lootGap * 2;
        const lost = this.params.lootResult?.lost === true;
        for (const item of shown) {
            const first = this.children.length;
            const centre = x + g.lootIconSize / 2;
            // Fase 21B: an item with an attribute gets a frame of its colour.
            const border = item.attribute ? ATTRIBUTES[item.attribute].color : g.lootSlotBorder;
            this.add.rectangle(centre, g.lootY, g.lootIconSize, g.lootIconSize, g.lootSlotFill).setStrokeStyle(item.attribute ? 2 : 1, border);
            const frame = itemPicture(item.id, this.params.gender);
            const image = this.add.image(centre, g.lootY, '__DEFAULT');
            if (frame && setColouredTexture(image, itemPackTexture(frame.sheet), frame.frame, attributeColor(item.attribute))) {
                image.setScale(Math.min(1, (g.lootIconSize - 4) / Math.max(image.width, image.height)));
            } else {
                image.destroy();
                // Picture not loaded: the first letters of its name.
                this.add.text(centre, g.lootY, (itemInfo(item.id)?.name ?? '?').slice(0, 3), { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.small), color: '#e8d9a8' }).setOrigin(0.5);
            }
            if (lost) {
                for (const object of this.children.list.slice(first)) {
                    if (object instanceof Phaser.GameObjects.Image || object instanceof Phaser.GameObjects.Rectangle || object instanceof Phaser.GameObjects.Text) object.setAlpha(g.lootLostAlpha);
                }
            }
            x += step;
        }
        more?.setX(x);
    }

    private ready(): boolean {
        return !this.chosen && this.time.now - this.openedAt >= GAME_OVER.inputDelayMs;
    }

    /** `side` −1 = left, 0 = centre, +1 = right. */
    private addButton(frame: number, side: number, action: () => void): void {
        const index = this.buttons.length;
        const x = GAME_WIDTH / 2 + side * GAME_OVER.buttonGap;
        const image = this.add.image(x, GAME_OVER.buttonsY, GAME_OVER.buttonTexture, frame).setScale(GAME_OVER.buttonScale);
        // The frames' pivot is their top-left corner: centre them by hand.
        image.setOrigin(0.5);
        image.setInteractive({ useHandCursor: true });
        image.on(Phaser.Input.Events.POINTER_OVER, () => this.highlight(index));
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.choose(index);
        });
        this.buttons.push({ image, frame, action });
    }

    /** The "Town" button: the "Ok" frame with its word covered by its own wood, and our word on top. */
    private addWordButton(side: number, action: () => void): void {
        const b = GAME_OVER.townButton;
        this.addButton(b.frame, side, action);
        const button = this.buttons[this.buttons.length - 1];
        if (!button) return;
        const { image } = button;
        const scale = GAME_OVER.buttonScale;
        const texture = this.textures.get(GAME_OVER.buttonTexture);
        const source = texture.get(b.frame);
        const height = source.cutHeight - b.strip.y * 2;
        // One strip per frame (off and lit), added to the texture once.
        for (const frame of [b.frame, b.frame + 1]) {
            const name = `${frame}-blank`;
            const from = texture.get(frame);
            if (!texture.has(name)) texture.add(name, from.sourceIndex, from.cutX + b.strip.x, from.cutY + b.strip.y, b.strip.width, height);
        }
        const left = image.x - (source.cutWidth * scale) / 2 + b.cover.x * scale;
        const top = image.y - (source.cutHeight * scale) / 2 + b.strip.y * scale;
        // Copies of the strip side by side (the last one cut to fit).
        const strips: NonNullable<Button['word']>['strips'] = [];
        for (let x = 0; x < b.cover.width; x += b.strip.width) {
            const image = this.add.image(left + x * scale, top, GAME_OVER.buttonTexture, `${b.frame}-blank`).setOrigin(0).setScale(scale);
            const cropWidth = x + b.strip.width > b.cover.width ? b.cover.width - x : undefined;
            if (cropWidth !== undefined) image.setCrop(0, 0, cropWidth, height);
            strips.push({ image, cropWidth });
        }
        const text = this.add.text(image.x, image.y, b.word, {
            fontFamily: b.fontFamily, fontSize: px(b.fontSize * scale), fontStyle: 'bold', color: b.color,
            shadow: { offsetX: 1, offsetY: 1, color: b.shadow, fill: true },
        }).setOrigin(0.5);
        button.word = { strips, text };
    }

    /** The highlighted button shows its lit frame (the next one). */
    private highlight(index: number): void {
        this.selected = index;
        this.buttons.forEach((button, i) => {
            const lit = i === index ? 1 : 0;
            button.image.setFrame(button.frame + lit).setOrigin(0.5);
            for (const { image, cropWidth } of button.word?.strips ?? []) {
                image.setFrame(`${button.frame + lit}-blank`);
                if (cropWidth !== undefined) image.setCrop(0, 0, cropWidth, image.height);
            }
            button.word?.text.setColor(lit ? GAME_OVER.townButton.litColor : GAME_OVER.townButton.color);
        });
    }

    private choose(index: number): void {
        const button = this.buttons[index];
        if (!button || this.chosen) return;
        this.chosen = true;
        button.action();
    }
}
