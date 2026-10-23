// Botón táctil del Critical Strike (Fase 19A): el icono rojo del original, más grande, con el número de cargas encima;
// se vuelve violeta un momento al lanzar. Con el Mago (Fase 19B) lanza su hechizo activo y enseña los segundos de recarga
// (el Mago tendrá su propio icono más adelante).
// Va en la esquina de abajo a la derecha de la zona de juego, que no abre ningún stick (TOUCH_RESERVED_CORNER), así que
// se puede pulsar mientras un dedo mueve y otro apunta. Apagado sin cargas; oculto si el personaje no tiene crit.
// Fase 26B: con la Maga (`drag`) es un stick: mantener, arrastrar y soltar lanza el Spell 2 hacia donde se arrastró; si el
// dedo apenas se mueve, al soltar apunta solo. Como el stick de apuntar (ui/TouchJoystick.ts), el centro sigue al dedo
// cuando se aleja: para girar basta con mover el dedo un poco hacia el otro lado, también junto al borde de la pantalla.
// Por eso el dedo se lee de los eventos táctiles del navegador: Phaser deja de verlo en cuanto sale del dibujo del juego
// (pasa enseguida al arrastrar hacia abajo). Con ratón (?ui=compact en un PC), de los de Phaser.
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { HUD_CRIT, HUD_CRIT_BUTTON, HUD_DEPTH_TEXT, HUD_TEXTURE } from '../config/hud';
import { TOUCH_RESERVED_CORNER, TOUCH_SPELL_DRAG } from '../config/touch';
import { toGame } from './renderScale';
import { CritIconState, sameOrb, type SkillOrb } from './hudLayout';

/** A unit direction, or undefined = automatic aim. */
export type DragDirection = { x: number; y: number } | undefined;

/** The Mage's drag-to-aim (Fase 26B): `preview` while the finger drags (undefined = back in the middle), `release` on letting go. */
export interface CritButtonDrag {
    preview: (direction: DragDirection) => void;
    release: (direction: DragDirection) => void;
}

/** Fake finger id for ?debug=spelldrag (browsers give real fingers ids from 0 up). */
const DEBUG_TOUCH_ID = -1;

export class CritButton {
    private readonly container: Phaser.GameObjects.Container;
    private readonly icon: Phaser.GameObjects.Image;
    private readonly number: Phaser.GameObjects.Text;
    private shown: SkillOrb | undefined | null = null;
    private readonly iconState = new CritIconState();
    /** Finger holding the button in drag mode, the centre it drags from (follows it) and the direction it drags now. */
    private touchId: number | undefined;
    private readonly centre = { x: 0, y: 0 };
    private readonly direction = { x: 0, y: 0 };
    private dragging = false;

    constructor(private readonly scene: Phaser.Scene, onPress: () => void, private readonly drag?: CritButtonDrag) {
        const b = HUD_CRIT_BUTTON;
        const base = scene.add.graphics()
            .fillStyle(b.color, b.alpha).fillCircle(0, 0, b.radius)
            .lineStyle(2, b.ringColor, b.ringAlpha).strokeCircle(0, 0, b.radius);
        // Its frame carries the original's pivot (top left): centred by hand.
        this.icon = scene.add.image(0, 0, HUD_TEXTURE, HUD_CRIT.frame).setOrigin(0.5).setScale(b.iconScale);
        this.number = scene.add.text(b.numberOffset.x, b.numberOffset.y, '', b.style).setOrigin(0.5);
        this.container = scene.add.container(0, 0, [base, this.icon, this.number]).setDepth(HUD_DEPTH_TEXT)
            .setSize(TOUCH_RESERVED_CORNER.width, TOUCH_RESERVED_CORNER.height)
            .setInteractive();
        if (!drag) {
            this.container.on(Phaser.Input.Events.POINTER_DOWN, onPress);
            return;
        }
        this.container.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => this.onDown(pointer));
        // Mouse: Phaser's own events. Fingers: the browser's (they keep coming outside the game picture).
        scene.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
            if (!pointer.wasTouch && pointer.identifier === this.touchId) this.dragTo(toGame(pointer.x), toGame(pointer.y));
        });
        const onUp = (pointer: Phaser.Input.Pointer) => {
            if (!pointer.wasTouch && pointer.identifier === this.touchId) this.release(true);
        };
        scene.input.on(Phaser.Input.Events.POINTER_UP, onUp);
        scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, onUp);
        const onTouchMove = (event: TouchEvent) => {
            const touch = this.findTouch(event);
            if (touch) this.dragTo(toGame(scene.scale.transformX(touch.pageX)), toGame(scene.scale.transformY(touch.pageY)));
        };
        const onTouchEnd = (event: TouchEvent) => {
            if (this.findTouch(event)) this.release(true);
        };
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('touchcancel', onTouchEnd, { passive: true });
        // Paused mid-drag (pause menu, level-up cards): the finger's lifting may never arrive, so drop it, without casting.
        const drop = () => this.release(false);
        scene.events.on(Phaser.Scenes.Events.PAUSE, drop);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
            scene.events.off(Phaser.Scenes.Events.PAUSE, drop);
        });
    }

    private findTouch(event: TouchEvent): Touch | undefined {
        if (this.touchId === undefined || this.scene.scene.isPaused()) return undefined;
        return Array.from(event.changedTouches).find((touch) => touch.identifier === this.touchId);
    }

    /** Development (?debug=spelldrag): a pretend finger holds the button dragged by (dx, dy), until a real one touches it. */
    public debugDrag(dx: number, dy: number): void {
        if (!this.drag) return;
        this.touchId = DEBUG_TOUCH_ID;
        this.centre.x = this.container.x;
        this.centre.y = this.container.y;
        this.dragTo(this.centre.x + dx, this.centre.y + dy);
    }

    private onDown(pointer: Phaser.Input.Pointer): void {
        if (this.touchId !== undefined && this.touchId !== DEBUG_TOUCH_ID) return;
        this.touchId = pointer.identifier;
        this.centre.x = toGame(pointer.x);
        this.centre.y = toGame(pointer.y);
        this.dragging = false;
        this.drag?.preview(undefined);
    }

    /**
     * Finger at (x, y), game pixels. Past `followRadius` the centre is dragged along behind it; once out of the deadzone
     * it stays aimed (resting the finger keeps the last direction), as the aim stick does.
     */
    private dragTo(x: number, y: number): void {
        const { deadzone, followRadius } = TOUCH_SPELL_DRAG;
        let dx = x - this.centre.x;
        let dy = y - this.centre.y;
        const length = Math.hypot(dx, dy);
        if (length > followRadius) {
            this.centre.x += (dx / length) * (length - followRadius);
            this.centre.y += (dy / length) * (length - followRadius);
            dx = x - this.centre.x;
            dy = y - this.centre.y;
        }
        if (length >= deadzone) {
            this.dragging = true;
            this.direction.x = dx / Math.hypot(dx, dy);
            this.direction.y = dy / Math.hypot(dx, dy);
        }
        // The icon follows the finger, up to the edge of its ring.
        this.icon.setPosition(dx, dy);
        this.drag?.preview(this.dragging ? this.direction : undefined);
    }

    /** The finger lifted (cast: aimed if it dragged, on its own if not) or the scene paused (no cast). */
    private release(cast: boolean): void {
        if (this.touchId === undefined) return;
        this.touchId = undefined;
        this.icon.setPosition(0, 0);
        const direction = this.dragging ? { ...this.direction } : undefined;
        this.dragging = false;
        this.drag?.preview(undefined);
        if (cast) this.drag?.release(direction);
    }

    /** Centres the button in the reserved corner above `bottom` (overlayBottom: over the compact gauges, if any). */
    public place(bottom: number): void {
        const corner = TOUCH_RESERVED_CORNER;
        this.container.setPosition(GAME_WIDTH - corner.width / 2, bottom - corner.height / 2);
    }

    public update(orb: SkillOrb | undefined, launches: number): void {
        // Keeps the centred origin (the frames carry the original's pivot).
        this.icon.setFrame(this.iconState.frame(launches, this.scene.time.now, HUD_CRIT), false, false);
        if (sameOrb(orb, this.shown)) return;
        this.shown = orb && { ...orb };
        this.container.setVisible(orb !== undefined);
        this.icon.setAlpha(orb?.ready ? 1 : HUD_CRIT.emptyAlpha);
        this.number.setText(orb?.text ?? '');
    }
}
