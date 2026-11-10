// Helbreath Off, Fase Off-12A: las piezas del estilo nuevo de las ventanas (colores y medidas en off/config/offTheme.ts).
// Marco con borde de bronce y esquinas doradas, pestaña, botón (principal dorado, normal y rojo), casilla de objeto,
// separador con rombo, fila de dato (nombre a la izquierda, valor a la derecha), barra y circulito del mando.
// - **Nada se sale de su caja**: los textos con ancho máximo se encogen hasta `minSize` (offTheme) y, si aun así no
//   caben, se apuntan en una lista de avisos de la escena (offLayoutIssues), que el `check` muestra (situación offuikit).
// - Las piezas no saben de teclado ni de mando: la ventana que las usa decide el foco y llama a setFocused / setOn.
import Phaser from 'phaser';
import {
    OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_PAD, OFF_THEME_SIZE, OFF_THEME_TEXT, OFF_THEME_TEXT_RESOLUTION,
    type OffPadButton, type OffTextKind,
} from '../config/offTheme';

const S = OFF_THEME_SIZE;
const C = OFF_THEME_COLOR;

// ---------------------------------------------------------------- avisos de maquetación

const layoutIssues = new WeakMap<Phaser.Scene, Set<string>>();

/** Texts that didn't fit their box even at their smallest size (empty = all fine). */
export function offLayoutIssues(scene: Phaser.Scene): string[] {
    return [...(layoutIssues.get(scene) ?? [])];
}

function reportIssue(scene: Phaser.Scene, issue: string): void {
    let set = layoutIssues.get(scene);
    if (!set) {
        set = new Set();
        layoutIssues.set(scene, set);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => layoutIssues.delete(scene));
    }
    set.add(issue);
}

// ---------------------------------------------------------------- texto

export interface OffTextOptions {
    color?: string;
    /** Widest the text may be: it shrinks (down to its kind's minSize) to fit, and is reported if it still doesn't. */
    maxWidth?: number;
    originX?: number;
    originY?: number;
}

/** A text in one of the theme's kinds. */
export function offText(scene: Phaser.Scene, x: number, y: number, text: string, kind: OffTextKind, options: OffTextOptions = {}): Phaser.GameObjects.Text {
    const k = OFF_THEME_TEXT[kind];
    const t = scene.add.text(x, y, text, {
        fontFamily: k.font,
        fontSize: `${k.size}px`,
        color: options.color ?? k.color,
        resolution: OFF_THEME_TEXT_RESOLUTION,
    });
    if (kind === 'name' || kind === 'title' || kind === 'number') t.setFontStyle('500');
    if (k.spacing) t.setLetterSpacing(k.spacing);
    t.setOrigin(options.originX ?? 0, options.originY ?? 0);
    if (options.maxWidth !== undefined) offFitText(t, kind, options.maxWidth);
    return t;
}

/** Back to the kind's size, then shrinks until the text fits `maxWidth` (call it again after setText). */
export function offFitText(t: Phaser.GameObjects.Text, kind: OffTextKind, maxWidth: number): void {
    const k = OFF_THEME_TEXT[kind];
    let size = k.size;
    t.setFontSize(size);
    while (t.width > maxWidth && size > k.minSize) {
        size -= 1;
        t.setFontSize(size);
    }
    if (t.width > maxWidth + 0.5) reportIssue(t.scene, `"${t.text}" is ${Math.ceil(t.width)} px wide, room for ${Math.floor(maxWidth)}`);
}

/** A section label in capitals (EQUIPMENT, KEYS). */
export function offLabel(scene: Phaser.Scene, x: number, y: number, text: string, options: OffTextOptions = {}): Phaser.GameObjects.Text {
    return offText(scene, x, y, text.toUpperCase(), 'label', options);
}

// ---------------------------------------------------------------- marco

export interface OffFrameOptions {
    fill?: number;
    /** The window's own frame: longer corners. */
    big?: boolean;
}

/** Draws a frame into `g`: dark outer line, fill, bronze border and gold corners. */
export function offDrawFrame(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, options: OffFrameOptions = {}): void {
    const gap = S.outlineGap;
    g.lineStyle(1, C.outline, 1);
    g.strokeRect(x - gap + 0.5, y - gap + 0.5, w + gap * 2 - 1, h + gap * 2 - 1);
    g.fillStyle(options.fill ?? C.card, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(S.border, C.bronze, 1);
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const c = options.big ? S.cornerBig : S.corner;
    const t = S.cornerThickness;
    g.fillStyle(C.gold, 1);
    // Each corner: one horizontal and one vertical bar, flush with the border's outer edge.
    g.fillRect(x, y, c, t).fillRect(x, y, t, c);
    g.fillRect(x + w - c, y, c, t).fillRect(x + w - t, y, t, c);
    g.fillRect(x, y + h - t, c, t).fillRect(x, y + h - c, t, c);
    g.fillRect(x + w - c, y + h - t, c, t).fillRect(x + w - t, y + h - c, t, c);
}

/** A framed panel as its own Graphics. */
export function offFrame(scene: Phaser.Scene, x: number, y: number, w: number, h: number, options: OffFrameOptions = {}): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    offDrawFrame(g, x, y, w, h, options);
    return g;
}

/** A plain box: fill and a 1 px border (the bag's well, a stat tile). */
export function offBox(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill: number = C.card, border: number = C.line): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    g.fillStyle(fill, 1).fillRect(x, y, w, h);
    g.lineStyle(1, border, 1).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    return g;
}

/** Divider: a line with a small diamond in the middle. */
export function offDivider(scene: Phaser.Scene, x: number, y: number, w: number): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    const mid = Math.round(x + w / 2);
    const d = S.diamond;
    g.fillStyle(C.line, 1);
    g.fillRect(x, y, mid - S.diamondGap - x, 1);
    g.fillRect(mid + S.diamondGap, y, x + w - mid - S.diamondGap, 1);
    g.fillStyle(C.bronze, 1);
    g.fillTriangle(mid - d, y + 0.5, mid, y + 0.5 - d, mid + d, y + 0.5);
    g.fillTriangle(mid - d, y + 0.5, mid, y + 0.5 + d, mid + d, y + 0.5);
    return g;
}

/** A thin horizontal line (under rows and headers). */
export function offRule(scene: Phaser.Scene, x: number, y: number, w: number, color: number = C.cellLine): Phaser.GameObjects.Rectangle {
    return scene.add.rectangle(x, y, w, 1, color).setOrigin(0, 0);
}

// ---------------------------------------------------------------- piezas que se pulsan

/** Makes a rectangle area clickable with the hand cursor; `onHover` gets true / false. */
function clickArea(scene: Phaser.Scene, x: number, y: number, w: number, h: number, onClick: () => void, onHover?: (over: boolean) => void): Phaser.GameObjects.Zone {
    const zone = scene.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.POINTER_UP, onClick);
    if (onHover) {
        zone.on(Phaser.Input.Events.POINTER_OVER, () => onHover(true));
        zone.on(Phaser.Input.Events.POINTER_OUT, () => onHover(false));
    }
    return zone;
}

export type OffButtonVariant = 'main' | 'normal' | 'danger';

export interface OffButton {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    setLabel(label: string): void;
    setVariant(variant: OffButtonVariant): void;
    /** Keyboard / gamepad focus: a gold border. */
    setFocused(focused: boolean): void;
    setVisible(visible: boolean): void;
    destroy(): void;
}

export function offButton(
    scene: Phaser.Scene, x: number, y: number, label: string, variant: OffButtonVariant, onClick: () => void,
    width: number = S.buttonWidth, height: number = S.buttonHeight,
): OffButton {
    const g = scene.add.graphics();
    const text = offText(scene, x + width / 2, y + height / 2, label, 'body', { originX: 0.5, originY: 0.5 });
    let current = variant;
    let hover = false;
    let focused = false;
    const draw = (): void => {
        g.clear();
        const main = current === 'main';
        g.fillStyle(main ? (hover ? C.goldLight : C.gold) : hover ? C.buttonHover : C.button, 1).fillRect(x, y, width, height);
        g.lineStyle(1, main ? C.goldLight : focused ? C.gold : C.bronze, 1).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        if (focused) g.lineStyle(1, C.gold, 1).strokeRect(x - 1.5, y - 1.5, width + 3, height + 3);
        text.setColor(main ? OFF_THEME_INK.onGold : current === 'danger' ? OFF_THEME_INK.bad : OFF_THEME_INK.text);
        offFitText(text, 'body', width - 8);
    };
    const zone = clickArea(scene, x, y, width, height, onClick, (over) => {
        hover = over;
        draw();
    });
    draw();
    return {
        x, y, width, height,
        setLabel: (l) => {
            text.setText(l);
            draw();
        },
        setVariant: (v) => {
            current = v;
            draw();
        },
        setFocused: (f) => {
            focused = f;
            draw();
        },
        setVisible: (v) => {
            g.setVisible(v);
            text.setVisible(v);
            if (zone.input) zone.input.enabled = v;
        },
        destroy: () => {
            g.destroy();
            text.destroy();
            zone.destroy();
        },
    };
}

export interface OffTab {
    readonly x: number;
    readonly width: number;
    setOn(on: boolean): void;
    setLabel(label: string): void;
    setFocused(focused: boolean): void;
}

/** A tab: plain border when closed; filled, with a gold bar on its left, when open. */
export function offTab(scene: Phaser.Scene, x: number, y: number, width: number, label: string, onClick: () => void, height: number = S.tabHeight): OffTab {
    const g = scene.add.graphics();
    const text = offText(scene, x + width / 2, y + height / 2, label, 'body', { originX: 0.5, originY: 0.5 });
    let on = false;
    let hover = false;
    let focused = false;
    const draw = (): void => {
        g.clear();
        if (on || hover) g.fillStyle(on ? C.tabOn : C.buttonHover, 1).fillRect(x, y, width, height);
        g.lineStyle(1, focused ? C.gold : C.line, 1).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        if (on) g.fillStyle(C.gold, 1).fillRect(x, y, S.markBar, height);
        offFitText(text, 'body', width - 8);
    };
    clickArea(scene, x, y, width, height, onClick, (over) => {
        hover = over;
        draw();
    });
    draw();
    return {
        x, width,
        setOn: (o) => {
            on = o;
            draw();
        },
        setLabel: (l) => {
            text.setText(l);
            draw();
        },
        setFocused: (f) => {
            focused = f;
            draw();
        },
    };
}

export type OffCellState = 'empty' | 'item' | 'marked' | 'unmet';

export interface OffCell {
    readonly x: number;
    readonly y: number;
    readonly size: number;
    /** The item picture: the window sets its texture and scale (centred in the cell). */
    readonly icon: Phaser.GameObjects.Image;
    setState(state: OffCellState): void;
    /** Small number in the bottom-right corner (how many potions); undefined hides it. */
    setCount(count: number | undefined): void;
}

/** An item cell. `unmet` = you can't wear it yet (reddish, as the old inventory). */
export function offCell(scene: Phaser.Scene, x: number, y: number, size: number = S.cell, onClick?: () => void): OffCell {
    const g = scene.add.graphics();
    const icon = scene.add.image(x + size / 2, y + size / 2, '__DEFAULT').setVisible(false);
    const count = offText(scene, x + size - 2, y + size + 1, '', 'small', { color: OFF_THEME_INK.text, originX: 1, originY: 1 }).setVisible(false);
    const draw = (state: OffCellState): void => {
        g.clear();
        const fill = state === 'marked' ? C.marked : state === 'unmet' ? C.unmet : C.cell;
        g.fillStyle(fill, 1).fillRect(x, y, size, size);
        g.lineStyle(1, state === 'marked' ? C.gold : C.cellLine, 1).strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    };
    if (onClick) clickArea(scene, x, y, size, size, onClick);
    draw('empty');
    return {
        x, y, size, icon,
        setState: draw,
        setCount: (n) => {
            count.setVisible(n !== undefined);
            if (n !== undefined) count.setText(String(n));
        },
    };
}

// ---------------------------------------------------------------- datos

export interface OffStatRow {
    setValue(value: string, color?: string, note?: string): void;
}

/**
 * A data row: label on the left (dim), value on the right, an optional "(now …)" note after the value, and a thin line
 * under it. If label and value don't fit together, the value side shrinks and the clash is reported.
 */
export function offStatRow(scene: Phaser.Scene, x: number, y: number, width: number, label: string, value: string, color?: string, note?: string): OffStatRow {
    const h = S.rowHeight;
    const mid = y + h / 2;
    const labelText = offText(scene, x, mid, label, 'body', { color: OFF_THEME_INK.dim, originY: 0.5 });
    const noteText = offText(scene, x + width, mid, '', 'small', { color: OFF_THEME_INK.note, originX: 1, originY: 0.5 });
    const valueText = offText(scene, x + width, mid, '', 'body', { originX: 1, originY: 0.5 });
    offRule(scene, x, y + h - 1, width);
    const set = (v: string, c?: string, n?: string): void => {
        noteText.setText(n ? `(${n})` : '');
        const noteWidth = n ? noteText.width + 5 : 0;
        valueText.setText(v).setColor(c ?? OFF_THEME_INK.text);
        valueText.setX(x + width - noteWidth);
        const room = width - labelText.width - S.rowGap - noteWidth;
        offFitText(valueText, 'body', room);
    };
    set(value, color, note);
    return { setValue: set };
}

export interface OffBar {
    setValue(text: string, ratio: number): void;
}

/** A bar with its label on the left and value on the right above it (health, mana, stamina, experience). */
export function offBar(scene: Phaser.Scene, x: number, y: number, width: number, label: string, color: number): OffBar {
    offText(scene, x, y, label, 'small', { color: OFF_THEME_INK.dim });
    const value = offText(scene, x + width, y, '', 'small', { color: OFF_THEME_INK.text, originX: 1 });
    const barY = y + OFF_THEME_TEXT.small.size + S.barGap + 2;
    scene.add.rectangle(x, barY, width, S.barHeight, C.barBack).setOrigin(0, 0);
    const fill = scene.add.rectangle(x, barY, width, S.barHeight, color).setOrigin(0, 0);
    return {
        setValue: (text, ratio) => {
            value.setText(text);
            fill.width = Math.round(width * Math.max(0, Math.min(1, ratio)));
        },
    };
}

/** Height a bar takes (label line + gap + bar), for stacking them. */
export const OFF_BAR_HEIGHT = OFF_THEME_TEXT.small.size + S.barGap + 2 + S.barHeight;

/** A round gamepad badge (A green, B red, X blue, Y yellow) centred on (cx, cy). */
export function offPadBadge(scene: Phaser.Scene, cx: number, cy: number, button: OffPadButton): Phaser.GameObjects.Container {
    const circle = scene.add.circle(0, 0, S.badge / 2, OFF_THEME_PAD[button]);
    const letter = offText(scene, 0, 0, button, 'badge', { originX: 0.5, originY: 0.5 }).setFontStyle('500');
    return scene.add.container(cx, cy, [circle, letter]);
}
