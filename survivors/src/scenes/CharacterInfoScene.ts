// Ventana "Character Info" del original (Fase 20A; medidas en config/characterInfo.ts). Dos usos:
// - Desde Select Character: el personaje guardado, con su Level, su EXP y sus stats permanentes. Si tiene puntos sin
//   repartir, sale "Points left" y un + junto a cada stat. Cada + sube 1 (el número se pone rojo hasta confirmar) y
//   aparece un − para deshacerlo. Ok confirma para siempre (los puntos no se pueden reasignar); Cancel o Esc no gasta nada.
// - En partida (tecla C o el botón de la barra): la partida queda en pausa y la ventana enseña los stats de esta
//   partida, con un panel al lado con lo que dan (daño, esquiva, pasivas...). Solo se mira: sin + ni −.
// Teclado y mando: flechas / cruceta eligen stat o botón, Enter / A pulsa (+ en un stat), − o X del mando resta.
import Phaser from 'phaser';
import {
    CHARACTER_INFO_BOXES,
    CHARACTER_INFO_BUTTONS,
    CHARACTER_INFO_DETAILS,
    CHARACTER_INFO_DOLL,
    CHARACTER_INFO_FOCUS,
    CHARACTER_INFO_FRAME,
    CHARACTER_INFO_HELP_GAP,
    CHARACTER_INFO_HELP_STYLE,
    CHARACTER_INFO_INPUT_DELAY_MS,
    CHARACTER_INFO_NAME_STYLE,
    CHARACTER_INFO_PENDING_COLOR,
    CHARACTER_INFO_PLUS_MINUS,
    CHARACTER_INFO_POINTS_COLOR,
    CHARACTER_INFO_POINTS_STYLE,
    CHARACTER_INFO_POINTS_Y,
    CHARACTER_INFO_POSITION,
    CHARACTER_INFO_SCALE,
    CHARACTER_INFO_SHADE_ALPHA,
    CHARACTER_INFO_SIZE,
    CHARACTER_INFO_STAT_BOXES,
    CHARACTER_INFO_STAT_GRID,
    CHARACTER_INFO_TEXTURE,
    CHARACTER_INFO_VALUE_STYLE,
    type InfoBox,
} from '../config/characterInfo';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { STAT_POINT_CAP, totalExpForLevel, CHARACTER_LEVEL_MAX } from '../data/characterLevel';
import { CHARACTERS, type CharacterId } from '../data/characters';
import { DEFAULT_LOOKS } from '../data/appearance';
import { STAT_IDS, STAT_INFO, type StatId, type Stats } from '../data/stats';
import { CharacterSprite } from '../entities/CharacterSprite';
import { CharacterStats } from '../entities/CharacterStats';
import { Direction } from '../hb/directions';
import { PlayerState } from '../hb/playerAppearance';
import { characterStore, permanentStats } from '../systems/CharacterStore';
import { Action, InputSystem } from '../systems/InputSystem';
import type { MenuOverlayData } from './MenuOverlayScene';

/** What a run shows (the game is paused underneath). */
export interface CharacterInfoRun {
    /** Game scene paused under the HUD: resumed when the window closes. */
    gameSceneKey: string;
    power: number;
    stats: Readonly<Stats>;
    hp: number;
    maxHp: number;
    maxMana: number;
    kills: number;
    /** Label / value rows of the details panel (HudScene.describeDerived). */
    details: ReadonlyArray<readonly [string, string]>;
}

export interface CharacterInfoSceneData {
    /** Saved character (Level, EXP, points). Debug runs without one show the class alone. */
    characterUid: string | undefined;
    classId: CharacterId;
    /** Set in a run: view only. */
    run?: CharacterInfoRun;
}

interface StatRow {
    value: Phaser.GameObjects.Text;
    plus: Phaser.GameObjects.Image;
    minus: Phaser.GameObjects.Image;
}

interface Button {
    image: Phaser.GameObjects.Image;
    frame: number;
    action: () => void;
}

/** Focus: a stat, or one of the bottom buttons (by index). */
type Focus = { kind: 'stat'; id: StatId } | { kind: 'button'; index: number };

export class CharacterInfoScene extends Phaser.Scene {
    private params!: CharacterInfoSceneData;
    private returnTo = '';
    private inputSystem!: InputSystem;
    private originX = 0;
    private originY = 0;
    /** Points added in this window, not confirmed yet. */
    private pending: Stats = emptyStats();
    private rows = new Map<StatId, StatRow>();
    private buttons: Button[] = [];
    private focus: Focus = { kind: 'stat', id: 'str' };
    private focusFrame!: Phaser.GameObjects.Rectangle;
    private pointsText: Phaser.GameObjects.Text | undefined;
    private helpText!: Phaser.GameObjects.Text;
    private doll: CharacterSprite | undefined;
    /** Menu: health and mana a new run would start with (they change with Vit, Int and Mag). */
    private startTexts: { health: Phaser.GameObjects.Text; mana: Phaser.GameObjects.Text } | undefined;
    private openedAt = 0;

    constructor() {
        super('CharacterInfo');
    }

    init(data: CharacterInfoSceneData & MenuOverlayData): void {
        this.params = data;
        this.returnTo = data.returnTo;
        this.pending = emptyStats();
        this.rows = new Map();
        this.buttons = [];
        this.focus = { kind: 'stat', id: 'str' };
        this.pointsText = undefined;
        this.doll = undefined;
        this.startTexts = undefined;
    }

    create(): void {
        const { run } = this.params;
        this.openedAt = this.time.now;
        const position = run ? CHARACTER_INFO_POSITION.run : CHARACTER_INFO_POSITION.menu;
        this.originX = position.x;
        this.originY = position.y;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, CHARACTER_INFO_SHADE_ALPHA).setOrigin(0);
        this.add.image(this.originX, this.originY, CHARACTER_INFO_TEXTURE, CHARACTER_INFO_FRAME).setOrigin(0).setScale(CHARACTER_INFO_SCALE);

        this.addDoll();
        this.fillBoxes();
        for (const id of STAT_IDS) this.rows.set(id, this.createStatRow(id));
        this.focusFrame = this.add.rectangle(0, 0, 1, 1).setOrigin(0).setStrokeStyle(CHARACTER_INFO_FOCUS.width, CHARACTER_INFO_FOCUS.color);
        if (this.canAssign) {
            this.pointsText = this.add.text(this.sx(CHARACTER_INFO_SIZE.width / 2), this.sy(CHARACTER_INFO_POINTS_Y), '', CHARACTER_INFO_POINTS_STYLE)
                .setOrigin(0.5);
            this.addButton(CHARACTER_INFO_BUTTONS.cancel, () => this.close());
        }
        this.addButton(CHARACTER_INFO_BUTTONS.ok, () => this.confirm());
        const bottom = this.originY + CHARACTER_INFO_SIZE.height * CHARACTER_INFO_SCALE;
        this.helpText = this.add.text(this.sx(CHARACTER_INFO_SIZE.width / 2), bottom + CHARACTER_INFO_HELP_GAP, '', {
            ...CHARACTER_INFO_HELP_STYLE, wordWrap: { width: CHARACTER_INFO_SIZE.width * CHARACTER_INFO_SCALE + 80 },
        }).setOrigin(0.5, 0);
        if (run) this.addDetails(run);

        this.inputSystem = new InputSystem(this);
        // Stats and buttons have their own click areas: a click elsewhere does nothing.
        this.inputSystem.setPointerMaxY(-1);
        this.refresh();
        this.setFocus(this.canAssign ? { kind: 'stat', id: 'str' } : { kind: 'button', index: this.buttons.length - 1 });
    }

    override update(_time: number, delta: number): void {
        this.doll?.update(delta);
        const input = this.inputSystem;
        input.update();
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause) || input.justPressed(Action.ToggleStats)) {
            this.close();
            return;
        }
        if (input.justPressed(Action.MenuLeft)) this.moveFocus(-1, 0);
        if (input.justPressed(Action.MenuRight)) this.moveFocus(1, 0);
        if (input.justPressed(Action.MenuUp)) this.moveFocus(0, -1);
        if (input.justPressed(Action.MenuDown)) this.moveFocus(0, 1);
        if (input.justPressed(Action.Decrease) && this.focus.kind === 'stat') this.change(this.focus.id, -1);
        if (input.justPressed(Action.Pick)) {
            if (this.focus.kind === 'stat') this.change(this.focus.id, 1);
            else this.buttons[this.focus.index]?.action();
        }
    }

    private get saved() {
        return characterStore.byUid(this.params.characterUid);
    }

    /** Points can be assigned only from the menu, to a saved character that has some. */
    private get canAssign(): boolean {
        return !this.params.run && (this.saved?.unspentPoints ?? 0) > 0;
    }

    private get pointsLeft(): number {
        return (this.saved?.unspentPoints ?? 0) - STAT_IDS.reduce((sum, id) => sum + this.pending[id], 0);
    }

    /** Stats shown: the run's, or the permanent ones plus what was added here. */
    private get shownStats(): Stats {
        if (this.params.run) return { ...this.params.run.stats };
        const saved = this.saved;
        const base = saved ? permanentStats(saved) : { ...CHARACTERS[this.params.classId].startStats };
        for (const id of STAT_IDS) base[id] += this.pending[id];
        return base;
    }

    /** Image pixel → screen pixel. */
    private sx(x: number): number {
        return this.originX + x * CHARACTER_INFO_SCALE;
    }

    private sy(y: number): number {
        return this.originY + y * CHARACTER_INFO_SCALE;
    }

    private addDoll(): void {
        const def = CHARACTERS[this.params.classId];
        const look = this.saved?.look ?? DEFAULT_LOOKS[this.params.classId];
        this.doll = new CharacterSprite(this, def, look, this.sx(CHARACTER_INFO_DOLL.x), this.sy(CHARACTER_INFO_DOLL.y));
        this.doll.container.setScale(CHARACTER_INFO_SCALE);
        // Fase 20B: dressed in its equipment (in a run too: it is what the run started with).
        const equipment = this.saved?.equipment;
        if (equipment) this.doll.wearEquipment(equipment);
        this.doll.setPose(PlayerState.IdleCombat, Direction.South);
    }

    /** Name, Level, EXP and the other boxes on the right. They don't change while the window is open. */
    private fillBoxes(): void {
        const { run } = this.params;
        const saved = this.saved;
        const def = CHARACTERS[this.params.classId];
        const b = CHARACTER_INFO_BOXES;
        const nameTop = b.name.y + b.name.height / 4;
        const nameBottom = b.name.y + (b.name.height * 3) / 4;
        this.add.text(this.sx(b.name.x + b.name.width / 2), this.sy(nameTop), saved?.name ?? def.name, CHARACTER_INFO_NAME_STYLE).setOrigin(0.5);
        this.add.text(this.sx(b.name.x + b.name.width / 2), this.sy(nameBottom), run ? `${def.name}  ·  Power ${run.power}` : def.name,
            CHARACTER_INFO_VALUE_STYLE).setOrigin(0.5);
        const level = saved?.level ?? 1;
        // Total EXP, as the original showed it: what the character has and what the next Level needs.
        const exp = totalExpForLevel(level) + (saved?.exp ?? 0);
        this.boxText(b.level, String(level));
        this.boxText(b.exp, exp.toLocaleString('en-US'));
        this.boxText(b.nextExp, level >= CHARACTER_LEVEL_MAX ? '—' : totalExpForLevel(level + 1).toLocaleString('en-US'));
        if (run) {
            this.boxText(b.health, `${Math.ceil(run.hp)}/${run.maxHp}`);
            this.boxText(b.mana, String(run.maxMana));
            this.boxText(b.kills, String(run.kills));
        } else {
            // What a new run starts with at Power 1 (filled in refresh()).
            this.startTexts = { health: this.boxText(b.health, ''), mana: this.boxText(b.mana, '') };
        }
    }

    private boxText(box: InfoBox, text: string): Phaser.GameObjects.Text {
        return this.add.text(this.sx(box.x + box.width / 2), this.sy(box.y + box.height / 2), text, CHARACTER_INFO_VALUE_STYLE).setOrigin(0.5);
    }

    private createStatRow(id: StatId): StatRow {
        const box = CHARACTER_INFO_STAT_BOXES[id];
        const pm = CHARACTER_INFO_PLUS_MINUS;
        const centerY = this.sy(box.y + box.height / 2);
        const value = this.add.text(this.sx(box.x + box.width / 2), centerY, '', CHARACTER_INFO_VALUE_STYLE).setOrigin(0.5);
        // Whole image pixels, so both line up exactly with the box.
        const top = box.y + Math.round((box.height - pm.size) / 2);
        const right = box.x + box.width;
        const plus = this.smallButton(pm.plusFrame, right + pm.plusGap, top, 1, () => this.change(id, 1));
        const minus = this.smallButton(pm.minusFrame, right - pm.size, top, -1, () => this.change(id, -1));
        // The whole box chooses the stat (keys and gamepad then act on it), and shows what it does.
        const zone = this.add.zone(this.sx(box.x), this.sy(box.y), box.width * CHARACTER_INFO_SCALE, box.height * CHARACTER_INFO_SCALE)
            .setOrigin(0).setInteractive();
        zone.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus({ kind: 'stat', id }));
        zone.on(Phaser.Input.Events.POINTER_UP, () => this.setFocus({ kind: 'stat', id }));
        return { value, plus, minus };
    }

    /**
     * A 12x12 + or − with its top-left corner at (x, y) in image pixels. The touch area is bigger, growing away from
     * the other button of the pair (`outwards` −1 = to the left, +1 = to the right) so the two never overlap.
     */
    private smallButton(frame: number, x: number, y: number, outwards: 1 | -1, onClick: () => void): Phaser.GameObjects.Image {
        const pm = CHARACTER_INFO_PLUS_MINUS;
        const image = this.add.image(this.sx(x), this.sy(y), pm.texture, frame).setOrigin(0).setScale(CHARACTER_INFO_SCALE).setDepth(1);
        const left = outwards < 0 ? -pm.hitPadOut : 0;
        const hitArea = new Phaser.Geom.Rectangle(left, -pm.hitPadY, pm.size + pm.hitPadOut, pm.size + pm.hitPadY * 2);
        image.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready() && image.visible) onClick();
        });
        return image;
    }

    private addButton(place: { x: number; frame: number }, action: () => void): void {
        const b = CHARACTER_INFO_BUTTONS;
        const index = this.buttons.length;
        const image = this.add.image(this.sx(place.x), this.sy(b.y), b.texture, place.frame).setOrigin(0).setScale(CHARACTER_INFO_SCALE);
        image.setInteractive({ useHandCursor: true });
        image.on(Phaser.Input.Events.POINTER_OVER, () => this.setFocus({ kind: 'button', index }));
        image.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) action();
        });
        this.buttons.push({ image, frame: place.frame, action });
    }

    /** In a run: the panel with what the stats and the gear give, to the right of the window. */
    private addDetails(run: CharacterInfoRun): void {
        const d = CHARACTER_INFO_DETAILS;
        const x = this.originX + CHARACTER_INFO_SIZE.width * CHARACTER_INFO_SCALE + d.gap;
        const labels = this.add.text(x + d.padding, this.originY + d.padding, run.details.map(([label]) => label), d.style);
        const values = this.add.text(x + d.width - d.padding, this.originY + d.padding, run.details.map(([, value]) => value), { ...d.style, align: 'right' })
            .setOrigin(1, 0);
        const height = labels.height + d.padding * 2;
        this.add.rectangle(x, this.originY, d.width, height, d.background, d.alpha).setOrigin(0).setStrokeStyle(2, d.border);
        labels.setDepth(1);
        values.setDepth(1);
    }

    /** Adds (+1) or takes back (−1) a point not confirmed yet. */
    private change(id: StatId, amount: 1 | -1): void {
        if (!this.canAssign) return;
        if (amount > 0 && (this.pointsLeft <= 0 || this.shownStats[id] >= STAT_POINT_CAP)) return;
        if (amount < 0 && this.pending[id] <= 0) return;
        this.pending[id] += amount;
        this.refresh();
    }

    private refresh(): void {
        const stats = this.shownStats;
        const canAssign = this.canAssign;
        const pointsLeft = this.pointsLeft;
        for (const id of STAT_IDS) {
            const row = this.rows.get(id);
            if (!row) continue;
            const changed = this.pending[id] > 0;
            const box = CHARACTER_INFO_STAT_BOXES[id];
            // While points can be assigned, the value stays in the part of the box the − leaves free (it doesn't jump).
            const valueX = canAssign ? box.x + (box.width - CHARACTER_INFO_PLUS_MINUS.size) / 2 : box.x + box.width / 2;
            row.value.setText(String(stats[id])).setColor(changed ? CHARACTER_INFO_PENDING_COLOR : CHARACTER_INFO_VALUE_STYLE.color);
            row.value.x = this.sx(valueX);
            row.plus.setVisible(canAssign && pointsLeft > 0 && stats[id] < STAT_POINT_CAP);
            row.minus.setVisible(canAssign && changed);
        }
        if (this.startTexts) {
            const start = new CharacterStats(CHARACTERS[this.params.classId], stats);
            this.startTexts.health.setText(String(start.maxHp));
            this.startTexts.mana.setText(String(start.maxMana));
        }
        this.pointsText?.setText(`Points left: ${pointsLeft}`).setColor(pointsLeft > 0 ? CHARACTER_INFO_POINTS_COLOR : CHARACTER_INFO_POINTS_STYLE.color);
    }

    private setFocus(focus: Focus): void {
        this.focus = focus;
        this.buttons.forEach((button, i) => {
            const lit = focus.kind === 'button' && focus.index === i;
            button.image.setFrame(button.frame + (lit ? CHARACTER_INFO_BUTTONS.litOffset : 0));
        });
        if (focus.kind === 'stat') {
            const box = CHARACTER_INFO_STAT_BOXES[focus.id];
            const s = CHARACTER_INFO_SCALE;
            this.focusFrame.setPosition(this.sx(box.x) - 1, this.sy(box.y) - 1).setSize(box.width * s + 2, box.height * s + 2).setVisible(true);
            const info = STAT_INFO[focus.id];
            this.helpText.setText(`${info.name}: ${info.effect}.`);
        } else {
            this.focusFrame.setVisible(false);
            this.helpText.setText(this.canAssign ? 'Points can never be moved once confirmed.' : '');
        }
    }

    /** Arrows: move around the 3x2 grid of stats; down from the bottom row goes to the buttons. */
    private moveFocus(dx: number, dy: number): void {
        const grid = CHARACTER_INFO_STAT_GRID;
        const buttonCount = this.buttons.length;
        if (this.focus.kind === 'button') {
            if (dx !== 0) this.setFocus({ kind: 'button', index: (this.focus.index + dx + buttonCount) % buttonCount });
            else if (dy < 0) this.setFocus({ kind: 'stat', id: grid[grid.length - 1]?.[0] ?? 'str' });
            return;
        }
        const id = this.focus.id;
        const row = grid.findIndex((r) => r.includes(id));
        const col = grid[row]?.indexOf(id) ?? 0;
        if (dx !== 0) {
            const cols = grid[row]?.length ?? 1;
            this.setFocus({ kind: 'stat', id: grid[row]?.[(col + dx + cols) % cols] ?? id });
            return;
        }
        const next = row + dy;
        if (next < 0) return;
        if (next >= grid.length) this.setFocus({ kind: 'button', index: buttonCount - 1 });
        else this.setFocus({ kind: 'stat', id: grid[next]?.[col] ?? id });
    }

    /** Ok: assigns the points for good (if any were added) and closes. */
    private confirm(): void {
        const added = STAT_IDS.some((id) => this.pending[id] > 0);
        if (added) characterStore.assignPoints(this.params.characterUid, this.pending);
        this.close();
    }

    /** Back to the screen underneath; in a run, the game goes on. */
    private close(): void {
        this.scene.stop();
        this.scene.resume(this.returnTo);
        if (this.params.run) this.scene.resume(this.params.run.gameSceneKey);
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}

function emptyStats(): Stats {
    return { str: 0, vit: 0, dex: 0, int: 0, mag: 0, chr: 0 };
}
