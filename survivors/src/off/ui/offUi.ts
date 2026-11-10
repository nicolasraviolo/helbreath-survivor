// Helbreath Off, Fase Off-12A: las piezas del estilo nuevo de las ventanas (colores y medidas en off/config/offTheme.ts).
// Marco, pestaña, botón (principal dorado, normal, rojo), cierre ✕, casilla de objeto, fila de lista, fila de tecla,
// fila de stat con − / + (Off-12C),
// separador con rombo, fila de dato con comparación (▲ / ▼ además del color), barra, circulito A/B/X/Y y pastilla
// LB / RB / Start.
// - **Nada se sale de su caja**: los textos con ancho máximo se encogen hasta `minSize` (offTheme) y, si aun así no
//   caben, se apuntan en los avisos de la escena (offLayoutIssues), que el `check` muestra (situación offuikit). El aviso
//   se borra solo si el texto vuelve a caber.
// - **Mando y teclado**: las piezas no leen controles. La ventana mueve el foco (setFocused: anillo dorado por fuera,
//   igual en todas) y llama a press() con A / Enter. setEnabled(false) apaga (gris, sin clic) y setVisible(false)
//   esconde también la zona de clic (para las pestañas que se cambian).
import Phaser from 'phaser';
import {
    OFF_THEME_COLOR, OFF_THEME_INK, OFF_THEME_PAD, OFF_THEME_SIZE, OFF_THEME_TEXT, OFF_THEME_TEXT_RESOLUTION,
    type OffPadButton, type OffTextKind,
} from '../config/offTheme';

const S = OFF_THEME_SIZE;
const C = OFF_THEME_COLOR;
const INK = OFF_THEME_INK;

// ---------------------------------------------------------------- avisos de maquetación

const layoutIssues = new WeakMap<Phaser.Scene, Map<Phaser.GameObjects.Text, string>>();

/** Texts that don't fit their box even at their smallest size (empty = all fine). */
export function offLayoutIssues(scene: Phaser.Scene): string[] {
    return [...(layoutIssues.get(scene)?.values() ?? [])];
}

function setIssue(t: Phaser.GameObjects.Text, issue: string | undefined): void {
    const scene = t.scene;
    let map = layoutIssues.get(scene);
    if (!issue) {
        map?.delete(t);
        return;
    }
    if (!map) {
        map = new Map();
        layoutIssues.set(scene, map);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => layoutIssues.delete(scene));
    }
    map.set(t, issue);
    t.once(Phaser.GameObjects.Events.DESTROY, () => layoutIssues.get(scene)?.delete(t));
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
        fontStyle: k.weight,
        fontSize: `${k.size}px`,
        color: options.color ?? k.color,
        resolution: OFF_THEME_TEXT_RESOLUTION,
    });
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
    setIssue(t, t.width > maxWidth + 0.5 ? `"${t.text}" is ${Math.ceil(t.width)} px wide, room for ${Math.floor(maxWidth)}` : undefined);
}

/** A section label in capitals (EQUIPMENT, KEYS). */
export function offLabel(scene: Phaser.Scene, x: number, y: number, text: string, options: OffTextOptions = {}): Phaser.GameObjects.Text {
    return offText(scene, x, y, text.toUpperCase(), 'label', options);
}

// ---------------------------------------------------------------- marco y líneas

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

/** A plain box: fill and a 1 px border (the bag's well, a stat tile, an icon tile). */
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
export function offRule(scene: Phaser.Scene, x: number, y: number, w: number, color: number = C.rowLine): Phaser.GameObjects.Rectangle {
    return scene.add.rectangle(x, y, w, 1, color).setOrigin(0, 0);
}

/** The focus ring every piece uses: gold, outside the piece's box. */
function drawFocusRing(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    const out = S.focusGap + S.focusRing / 2;
    g.lineStyle(S.focusRing, C.gold, 1).strokeRect(x - out, y - out, w + out * 2, h + out * 2);
}

// ---------------------------------------------------------------- piezas que se pulsan

/** What every clickable piece offers to the window that drives it with the keyboard or the pad. */
export interface OffControl {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    /** Keyboard / pad focus: the gold ring. */
    setFocused(focused: boolean): void;
    /** Off: greyed, no hover, clicks and press() do nothing. */
    setEnabled(enabled: boolean): void;
    /** Hidden pieces don't take clicks either. */
    setVisible(visible: boolean): void;
    /** What a click does (A / Enter call it). Nothing while disabled or hidden. */
    press(): void;
    destroy(): void;
}

/** The shared part of a clickable piece: its click zone, hover, focus, enabled and visible states. */
interface ControlState {
    hover: boolean;
    focused: boolean;
    enabled: boolean;
    visible: boolean;
}

/**
 * Builds a control around `draw`: a click zone with the hand cursor, hover, and the OffControl methods. `parts` are
 * the objects to hide with it; `draw` repaints from the state.
 */
function makeControl(
    scene: Phaser.Scene, x: number, y: number, w: number, h: number, onClick: () => void,
    pieceParts: readonly Phaser.GameObjects.GameObject[], draw: (state: Readonly<ControlState>) => void,
): OffControl & { readonly state: Readonly<ControlState>; redraw(): void } {
    const state: ControlState = { hover: false, focused: false, enabled: true, visible: true };
    const zone = scene.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    // The focus ring goes on its own layer above everything: the cell next door would cover it otherwise.
    const ring = scene.add.graphics().setDepth(S.focusDepth);
    const parts = [...pieceParts, ring];
    const redraw = (): void => {
        draw(state);
        ring.clear();
        if (state.focused && state.visible) drawFocusRing(ring, x, y, w, h);
    };
    const press = (): void => {
        if (state.enabled && state.visible) onClick();
    };
    zone.on(Phaser.Input.Events.POINTER_UP, press);
    zone.on(Phaser.Input.Events.POINTER_OVER, () => {
        state.hover = true;
        redraw();
    });
    zone.on(Phaser.Input.Events.POINTER_OUT, () => {
        state.hover = false;
        redraw();
    });
    redraw();
    return {
        x, y, width: w, height: h, state, redraw, press,
        setFocused: (f) => {
            state.focused = f;
            redraw();
        },
        setEnabled: (e) => {
            state.enabled = e;
            if (zone.input) zone.input.cursor = e ? 'pointer' : 'default';
            redraw();
        },
        setVisible: (v) => {
            state.visible = v;
            if (!v) state.hover = false;
            for (const p of parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(v);
            if (zone.input) zone.input.enabled = v;
            redraw();
        },
        destroy: () => {
            for (const p of parts) p.destroy();
            zone.destroy();
        },
    };
}

/** Is the hover look on (only for enabled pieces)? */
const hovering = (s: Readonly<ControlState>): boolean => s.hover && s.enabled;

export type OffButtonVariant = 'main' | 'normal' | 'danger';

export interface OffButton extends OffControl {
    setLabel(label: string): void;
    setVariant(variant: OffButtonVariant): void;
}

export function offButton(
    scene: Phaser.Scene, x: number, y: number, label: string, variant: OffButtonVariant, onClick: () => void,
    width: number = S.buttonWidth, height: number = S.buttonHeight,
): OffButton {
    const g = scene.add.graphics();
    const text = offText(scene, x + width / 2, y + height / 2, label, 'body', { originX: 0.5, originY: 0.5 });
    let current = variant;
    const control = makeControl(scene, x, y, width, height, onClick, [g, text], (s) => {
        g.clear();
        const main = current === 'main' && s.enabled;
        const fill = main ? (hovering(s) ? C.goldLight : C.gold) : hovering(s) ? C.hover : C.button;
        g.fillStyle(fill, 1).fillRect(x, y, width, height);
        g.lineStyle(1, main ? C.goldLight : s.enabled ? C.bronze : C.line, 1).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        text.setColor(!s.enabled ? INK.faint : main ? INK.onGold : current === 'danger' ? INK.bad : INK.text);
        offFitText(text, 'body', width - S.textInset * 2);
    });
    return {
        ...control,
        setLabel: (l) => {
            text.setText(l);
            control.redraw();
        },
        setVariant: (v) => {
            current = v;
            control.redraw();
        },
    };
}

export interface OffTab extends OffControl {
    setOn(on: boolean): void;
    setLabel(label: string): void;
}

/** A tab: plain border when closed; filled, with a gold bar on its left, when open. */
export function offTab(scene: Phaser.Scene, x: number, y: number, width: number, label: string, onClick: () => void, height: number = S.tabHeight): OffTab {
    const g = scene.add.graphics();
    const text = offText(scene, x + width / 2, y + height / 2, label, 'body', { originX: 0.5, originY: 0.5 });
    let on = false;
    const control = makeControl(scene, x, y, width, height, onClick, [g, text], (s) => {
        g.clear();
        if (on || hovering(s)) g.fillStyle(on ? C.tabOn : C.hover, 1).fillRect(x, y, width, height);
        g.lineStyle(1, C.line, 1).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        if (on) g.fillStyle(C.gold, 1).fillRect(x, y, S.markBar, height);
        text.setColor(s.enabled ? INK.text : INK.faint);
        offFitText(text, 'body', width - S.textInset * 2);
    });
    return {
        ...control,
        setOn: (o) => {
            on = o;
            control.redraw();
        },
        setLabel: (l) => {
            text.setText(l);
            control.redraw();
        },
    };
}

/** The window's close button: a square like a tab with a drawn ✕ (the letter isn't in Alegreya Sans). */
export function offCloseButton(scene: Phaser.Scene, x: number, y: number, size: number, onClick: () => void): OffControl {
    const g = scene.add.graphics();
    return makeControl(scene, x, y, size, size, onClick, [g], (s) => {
        g.clear();
        if (hovering(s)) g.fillStyle(C.hover, 1).fillRect(x, y, size, size);
        g.lineStyle(1, C.line, 1).strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        const cx = x + size / 2;
        const cy = y + size / 2;
        const r = S.closeCross;
        g.lineStyle(2, Phaser.Display.Color.HexStringToColor(INK.text).color, 1);
        g.lineBetween(cx - r, cy - r, cx + r, cy + r).lineBetween(cx - r, cy + r, cx + r, cy - r);
    });
}

export interface OffCell extends OffControl {
    readonly size: number;
    /** The item picture: the window sets its texture and scale (centred in the cell). */
    readonly icon: Phaser.GameObjects.Image;
    /** Marked = the item whose card is shown (gold border, darker gold fill). */
    setMarked(marked: boolean): void;
    /** You can't wear it yet: reddish fill, kept while marked or focused. */
    setUnmet(unmet: boolean): void;
    /** Small number in the bottom-right corner (how many potions); undefined hides it. */
    setCount(count: number | undefined): void;
}

/** An item cell: empty, with an item, marked, unmet, focused (ring) and hovered. */
export function offCell(scene: Phaser.Scene, x: number, y: number, size: number = S.cell, onClick: () => void = () => undefined): OffCell {
    const g = scene.add.graphics();
    const icon = scene.add.image(x + size / 2, y + size / 2, '__DEFAULT').setVisible(false);
    const count = offText(scene, x + size - S.countInset, y + size - S.countInset, '', 'small', { color: INK.text, originX: 1, originY: 1 })
        .setStroke(INK.dark, S.countOutline)
        .setVisible(false);
    let marked = false;
    let unmet = false;
    let counted = false;
    const control = makeControl(scene, x, y, size, size, onClick, [g, count], (s) => {
        g.clear();
        g.fillStyle(unmet ? C.unmet : marked ? C.marked : hovering(s) ? C.hover : C.cell, 1).fillRect(x, y, size, size);
        g.lineStyle(1, marked ? C.gold : hovering(s) ? C.bronze : C.cellBorder, 1).strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        count.setVisible(counted && s.visible);
    });
    return {
        ...control,
        size,
        icon,
        setVisible: (v) => {
            control.setVisible(v);
            if (!v) icon.setVisible(false);
        },
        setMarked: (m) => {
            marked = m;
            control.redraw();
        },
        setUnmet: (u) => {
            unmet = u;
            control.redraw();
        },
        setCount: (n) => {
            counted = n !== undefined;
            if (n !== undefined) count.setText(String(n));
            control.redraw();
        },
    };
}

/** One column of a list row: its text, width (the first column takes what's left) and alignment. */
export interface OffListColumn {
    text: string;
    width?: number;
    align?: 'left' | 'right';
    color?: string;
    kind?: OffTextKind;
}

export interface OffListRow extends OffControl {
    setMarked(marked: boolean): void;
    setTexts(texts: readonly string[]): void;
}

/**
 * A selectable list row (spells, items): columns of text, a line under it; marked = gold bar on the left and darker
 * gold fill. The first column is the name: it takes the room the others leave and shrinks if needed.
 */
export function offListRow(scene: Phaser.Scene, x: number, y: number, width: number, columns: readonly OffListColumn[], onClick: () => void): OffListRow {
    const h = S.listRowHeight;
    const pad = S.listRowPadding;
    const g = scene.add.graphics();
    const fixed = columns.slice(1).reduce((sum, c) => sum + (c.width ?? 0), 0);
    const placed = columns.map((col, i) => ({ col, w: i === 0 ? width - pad * 2 - fixed : col.width ?? 0, left: x + pad }));
    // The other columns sit side by side from the right edge, the last one at the far right.
    let cursor = x + width - pad;
    for (let i = placed.length - 1; i > 0; i -= 1) {
        const p = placed[i];
        if (!p) continue;
        p.left = cursor - p.w;
        cursor = p.left;
    }
    const texts = placed.map(({ col, w, left }) => {
        const kind = col.kind ?? 'body';
        const t = offText(scene, col.align === 'right' ? left + w : left, y + h / 2, col.text, kind, {
            color: col.color, originX: col.align === 'right' ? 1 : 0, originY: 0.5, maxWidth: w,
        });
        return { t, kind, w };
    });
    let marked = false;
    const control = makeControl(scene, x, y, width, h, onClick, [g, ...texts.map((t) => t.t)], (s) => {
        g.clear();
        if (marked || hovering(s)) g.fillStyle(marked ? C.marked : C.hover, 1).fillRect(x, y, width, h - 1);
        if (marked) g.fillStyle(C.gold, 1).fillRect(x, y, S.markBar, h - 1);
        g.fillStyle(C.rowLine, 1).fillRect(x, y + h - 1, width, 1);
        texts[0]?.t.setColor(s.enabled ? columns[0]?.color ?? INK.text : INK.faint);
    });
    return {
        ...control,
        setMarked: (m) => {
            marked = m;
            control.redraw();
        },
        setTexts: (values) => {
            values.forEach((v, i) => {
                const entry = texts[i];
                if (!entry) return;
                entry.t.setText(v);
                offFitText(entry.t, entry.kind, entry.w);
            });
        },
    };
}

export interface OffKeyRow extends OffControl {
    /** The spell on this key; undefined = empty ("Empty" in the faint colour). */
    setName(name: string | undefined): void;
    setMarked(marked: boolean): void;
}

/** A key row: the key's number, the spell on it and, for keys 1–4, the pad button that casts it too (RT + A/B/X/Y). */
export function offKeyRow(scene: Phaser.Scene, x: number, y: number, width: number, key: number, pad: OffPadButton | undefined, onClick: () => void): OffKeyRow {
    const h = S.keyRowHeight;
    const g = scene.add.graphics();
    const mid = y + h / 2;
    const number = offText(scene, x + S.textInset + S.keyNumberWidth / 2, mid, String(key), 'keyNumber', { originX: 0.5, originY: 0.5 });
    const nameX = x + S.textInset * 2 + S.keyNumberWidth;
    const nameRoom = width - (nameX - x) - (pad ? S.badge + S.textInset * 2 : S.textInset * 2);
    const name = offText(scene, nameX, mid, '', 'body', { originY: 0.5 });
    const parts: Phaser.GameObjects.GameObject[] = [g, number, name];
    if (pad) parts.push(offPadBadge(scene, x + width - S.textInset * 2 - S.badge / 2, mid, pad));
    let marked = false;
    let empty = true;
    const control = makeControl(scene, x, y, width, h, onClick, parts, (s) => {
        g.clear();
        g.fillStyle(marked ? C.marked : hovering(s) ? C.hover : C.cell, 1).fillRect(x, y, width, h);
        g.lineStyle(1, marked ? C.gold : C.cellBorder, 1).strokeRect(x + 0.5, y + 0.5, width - 1, h - 1);
        name.setColor(empty || !s.enabled ? INK.faint : INK.text);
    });
    const setName = (n: string | undefined): void => {
        empty = n === undefined;
        name.setText(n ?? 'Empty');
        offFitText(name, 'body', nameRoom);
        control.redraw();
    };
    setName(undefined);
    return {
        ...control,
        setName,
        setMarked: (m) => {
            marked = m;
            control.redraw();
        },
    };
}

export interface OffStepperRow extends OffControl {
    /** The value (and whether it went up with points not confirmed yet: green with ▲). */
    setValue(value: string, raised: boolean): void;
    setMinusEnabled(enabled: boolean): void;
    setPlusEnabled(enabled: boolean): void;
}

/**
 * Off-12C: a stat row to spend points: name on the left, the value, then − and + buttons. The row itself takes the
 * focus (the window turns ← / → into − / +); the buttons only take clicks. A raised value is green with ▲ (never colour
 * alone).
 */
export function offStepperRow(
    scene: Phaser.Scene, x: number, y: number, width: number, label: string,
    onMinus: () => void, onPlus: () => void, onClick: () => void,
): OffStepperRow {
    const h = S.stepperRowHeight;
    const b = S.stepperButton;
    const mid = y + h / 2;
    const pad = S.listRowPadding;
    const plusX = x + width - pad - b;
    const minusX = plusX - S.rowGap - b;
    const valueRight = minusX - S.rowGap * 2;
    const g = scene.add.graphics();
    const name = offText(scene, x + pad, mid, label, 'body', { originY: 0.5, maxWidth: valueRight - S.stepperValueWidth - S.rowGap - x - pad });
    const value = offText(scene, valueRight, mid, '', 'number', { originX: 1, originY: 0.5 });
    const arrow = scene.add.graphics();
    let raised = false;
    const row = makeControl(scene, x, y, width, h, onClick, [g, name, value, arrow], (s) => {
        g.clear();
        if (hovering(s)) g.fillStyle(C.hover, 1).fillRect(x, y, width, h - 1);
        g.fillStyle(C.rowLine, 1).fillRect(x, y + h - 1, width, 1);
    });
    const sign = (bx: number, plus: boolean) => {
        const sg = scene.add.graphics();
        const control = makeControl(scene, bx, mid - b / 2, b, b, plus ? onPlus : onMinus, [sg], (s) => {
            sg.clear();
            sg.fillStyle(hovering(s) ? C.hover : C.button, 1).fillRect(bx, mid - b / 2, b, b);
            sg.lineStyle(1, s.enabled ? C.bronze : C.line, 1).strokeRect(bx + 0.5, mid - b / 2 + 0.5, b - 1, b - 1);
            const ink = Phaser.Display.Color.HexStringToColor(s.enabled ? INK.text : INK.faint).color;
            const cx = bx + b / 2;
            const r = S.stepperSign;
            sg.lineStyle(2, ink, 1).lineBetween(cx - r, mid, cx + r, mid);
            if (plus) sg.lineBetween(cx, mid - r, cx, mid + r);
        });
        return control;
    };
    const minus = sign(minusX, false);
    const plus = sign(plusX, true);
    return {
        ...row,
        setVisible: (v) => {
            row.setVisible(v);
            minus.setVisible(v);
            plus.setVisible(v);
        },
        destroy: () => {
            row.destroy();
            minus.destroy();
            plus.destroy();
        },
        setValue: (v, up) => {
            raised = up;
            value.setText(v).setColor(raised ? INK.good : INK.text);
            offFitText(value, 'number', S.stepperValueWidth);
            arrow.clear();
            if (raised) {
                const a = S.arrow;
                const ax = valueRight - value.width - S.noteGap - a;
                arrow.fillStyle(C.better, 1).fillTriangle(ax - a, mid + a / 2, ax + a, mid + a / 2, ax, mid - a);
            }
        },
        setMinusEnabled: (e) => minus.setEnabled(e),
        setPlusEnabled: (e) => plus.setEnabled(e),
    };
}

// ---------------------------------------------------------------- datos

/** How a value compares with what you wear: better (green ▲), worse (red ▼), the same. */
export type OffTrend = 'better' | 'worse' | 'same';

export interface OffStatRow {
    /** `note` = what you wear now ("now 10"); `trend` colours the value and adds an arrow (never colour alone). */
    setValue(value: string, color?: string, note?: string, trend?: OffTrend): void;
    setVisible(visible: boolean): void;
    destroy(): void;
}

/**
 * A data row: label on the left (dim), value on the right, an optional "(now …)" note after the value and a thin line
 * under it. The label keeps `rowLabelShare` of the row at most; the value gets the rest, shrinking if needed.
 */
export function offStatRow(
    scene: Phaser.Scene, x: number, y: number, width: number, label: string, value: string,
    color?: string, note?: string, trend?: OffTrend,
): OffStatRow {
    const h = S.rowHeight;
    const mid = y + h / 2;
    const labelText = offText(scene, x, mid, label, 'body', { color: INK.dim, originY: 0.5, maxWidth: width * S.rowLabelShare });
    const noteText = offText(scene, x + width, mid, '', 'small', { color: INK.note, originX: 1, originY: 0.5 });
    const valueText = offText(scene, x + width, mid, '', 'body', { originX: 1, originY: 0.5 });
    const arrow = scene.add.graphics();
    const rule = offRule(scene, x, y + h - 1, width);
    const set = (v: string, c?: string, n?: string, t?: OffTrend): void => {
        noteText.setText(n ? `(${n})` : '');
        const noteWidth = n ? noteText.width + S.noteGap : 0;
        const arrowWidth = t && t !== 'same' ? S.arrow * 2 + S.noteGap : 0;
        const trendColor = t === 'better' ? INK.good : t === 'worse' ? INK.bad : undefined;
        valueText.setText(v).setColor(c ?? trendColor ?? INK.text);
        valueText.setX(x + width - noteWidth);
        offFitText(valueText, 'body', width - labelText.width - S.rowGap - noteWidth - arrowWidth);
        arrow.clear();
        if (arrowWidth) {
            const ax = valueText.x - valueText.width - S.noteGap - S.arrow;
            const a = S.arrow;
            arrow.fillStyle(t === 'better' ? C.better : C.worse, 1);
            if (t === 'better') arrow.fillTriangle(ax - a, mid + a / 2, ax + a, mid + a / 2, ax, mid - a);
            else arrow.fillTriangle(ax - a, mid - a / 2, ax + a, mid - a / 2, ax, mid + a);
        }
    };
    set(value, color, note, trend);
    const parts = [labelText, noteText, valueText, arrow, rule];
    return {
        setValue: set,
        setVisible: (vis) => parts.forEach((p) => p.setVisible(vis)),
        destroy: () => parts.forEach((p) => p.destroy()),
    };
}

export interface OffBar {
    setValue(text: string, ratio: number): void;
    setVisible(visible: boolean): void;
}

/** A bar with its label on the left and value on the right above it (health, mana, stamina, experience). */
export function offBar(scene: Phaser.Scene, x: number, y: number, width: number, label: string, color: number): OffBar {
    const labelText = offText(scene, x, y, label, 'small', { maxWidth: width / 2 });
    const value = offText(scene, x + width, y, '', 'small', { color: INK.text, originX: 1 });
    const barY = y + labelText.height + S.barGap;
    const back = scene.add.rectangle(x, barY, width, S.barHeight, C.barBack).setOrigin(0, 0);
    const fill = scene.add.rectangle(x, barY, width, S.barHeight, color).setOrigin(0, 0);
    return {
        setValue: (text, ratio) => {
            value.setText(text);
            offFitText(value, 'small', width - labelText.width - S.rowGap);
            fill.width = Math.round(width * Math.max(0, Math.min(1, ratio)));
        },
        setVisible: (v) => [labelText, value, back, fill].forEach((p) => p.setVisible(v)),
    };
}

/** Height a bar takes (label line + gap + bar), for stacking them. */
export function offBarHeight(scene: Phaser.Scene): number {
    const probe = offText(scene, 0, 0, 'Mg', 'small');
    const h = probe.height;
    probe.destroy();
    return h + S.barGap + S.barHeight;
}

// ---------------------------------------------------------------- mando

/** A round gamepad badge (A green, B red, X blue, Y yellow) centred on (cx, cy). */
export function offPadBadge(scene: Phaser.Scene, cx: number, cy: number, button: OffPadButton): Phaser.GameObjects.Container {
    const circle = scene.add.circle(0, 0, S.badge / 2, OFF_THEME_PAD[button]);
    const letter = offText(scene, 0, 0, button, 'badge', { originX: 0.5, originY: 0.5 });
    return scene.add.container(cx, cy, [circle, letter]);
}

/** A pill for the other pad buttons (LB, RB, LT, RT, Start), its left edge at x, centred on cy. Returns it and its width. */
export function offPadPill(scene: Phaser.Scene, x: number, cy: number, label: string): { pill: Phaser.GameObjects.Container; width: number } {
    const letters = offText(scene, 0, 0, label, 'badge', { color: INK.text, originX: 0.5, originY: 0.5 });
    const width = Math.ceil(letters.width) + S.pillPadding * 2;
    const g = scene.add.graphics();
    g.fillStyle(C.padPill, 1).fillRoundedRect(-width / 2, -S.pillHeight / 2, width, S.pillHeight, S.pillHeight / 2);
    return { pill: scene.add.container(x + width / 2, cy, [g, letters]), width };
}
