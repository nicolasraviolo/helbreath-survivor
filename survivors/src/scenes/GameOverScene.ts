// Pantalla de final de partida (Fase 7): victoria al matar al jefe final o derrota al morir. Se abre encima de la
// partida, que queda pausada. Muestra tiempo, Power, bajas, la EXP que ha ganado el personaje y su Level (Fase 20A; los
// puntos nuevos se reparten en la ventana Character, desde Select Character), el arma o hechizo y la armadura que llevabas, y los logros
// conseguidos en esta partida (Fase 14B; el aviso del HUD queda tapado por esta pantalla).
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
    /** What the run's EXP did to the character's Level (undefined for runs without a saved character). */
    exp: ExpResult | undefined;
    onRestart: () => void;
    onChangeClass: () => void;
    onMainMenu: () => void;
}

interface Button {
    image: Phaser.GameObjects.Image;
    frame: number;
    action: () => void;
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

        if (p.achievementNames.length > 0) {
            this.add.text(GAME_WIDTH / 2, GAME_OVER.achievementsY, `Achievements: ${p.achievementNames.join(', ')}`, {
                ...UI_TEXT, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: GAME_OVER.achievementsColor,
                stroke: '#000000', strokeThickness: 3, align: 'center', wordWrap: { width: GAME_OVER.achievementsWrap },
            }).setOrigin(0.5);
        }

        if (p.exp) this.addExpBlock(p.exp);

        this.addButton(GAME_OVER.restartFrame, -1, p.onRestart);
        this.addButton(GAME_OVER.changeFrame, 0, p.onChangeClass);
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

    /** The highlighted button shows its lit frame (the next one). */
    private highlight(index: number): void {
        this.selected = index;
        this.buttons.forEach((button, i) => button.image.setFrame(button.frame + (i === index ? 1 : 0)).setOrigin(0.5));
    }

    private choose(index: number): void {
        const button = this.buttons[index];
        if (!button || this.chosen) return;
        this.chosen = true;
        button.action();
    }
}
