// Estela del tajo cuerpo a cuerpo: un arco claro que se desvanece enseguida, para que se lea el alcance del arma.
// El original no tiene este efecto (solo la animación del personaje); con cientos de enemigos ayuda a ver el golpe.
// Solo hay un arma en la mano, así que basta con una estela que se reutiliza (no hace falta pool).
// M15: varios estilos (data/slash.ts) para que el propietario elija. Se dibuja por rebanadas a lo largo del arco,
// cada una con su grosor (media luna) y su alfa (estela del barrido); el brillo va aparte con mezcla aditiva.
import Phaser from 'phaser';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import { DEFAULT_SLASH_STYLE, SLASH_SLICES, SLASH_SPARK, SLASH_STYLES, SPIN_TRAIL, type SlashStyle } from '../data/slash';

const CLASSIC_WIDTH = 5;

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    lifeMs: number;
    /** Time until it appears: with a sweep, the sparks wait for the blade to reach the tip. */
    waitMs: number;
}

export class Slash {
    private readonly graphics: Phaser.GameObjects.Graphics;
    private readonly glow: Phaser.GameObjects.Graphics;
    private readonly sparks: Spark[] = [];
    private readonly quad = [new Phaser.Math.Vector2(), new Phaser.Math.Vector2(), new Phaser.Math.Vector2(), new Phaser.Math.Vector2()];
    private styleIndex = DEFAULT_SLASH_STYLE;
    private elapsedMs = 0;
    private active = false;
    private radius = 0;
    private start = 0;
    private arc = 0;
    /** Timing of the trail shown now: the style's own, or the spin's (showSpin). */
    private sweepMs = 0;
    private lifeMs = 0;
    private trail = 1;
    /** Thickness of the band shown now, as a fraction of the radius. */
    private thicknessShare = 0;
    /** A whole circle: twice the slices so it stays round. */
    private slices = SLASH_SLICES;

    constructor(scene: Phaser.Scene) {
        this.glow = scene.add.graphics().setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
        this.graphics = scene.add.graphics().setVisible(false);
        const sparkCount = Math.max(...SLASH_STYLES.map((s) => s.sparks));
        for (let i = 0; i < sparkCount; i++) this.sparks.push({ x: 0, y: 0, vx: 0, vy: 0, lifeMs: 0, waitMs: 0 });
    }

    public get style(): SlashStyle {
        return SLASH_STYLES[this.styleIndex];
    }

    /** Development (M15): picks the style by its position in SLASH_STYLES (wraps around). */
    public setStyle(index: number): void {
        this.styleIndex = ((index % SLASH_STYLES.length) + SLASH_STYLES.length) % SLASH_STYLES.length;
    }

    public get styleNumber(): number {
        return this.styleIndex;
    }

    /** Starts the arc centred on (x, y): `angle` and `arc` in radians, `radius` in pixels. */
    public show(x: number, y: number, radius: number, angle: number, arc: number): void {
        this.radius = radius;
        // Always a downward blow (M15): from the tip higher on screen to the lower one, whichever way the player faces.
        const from = angle - arc / 2;
        const to = angle + arc / 2;
        const flip = Math.sin(to) < Math.sin(from);
        this.start = flip ? to : from;
        this.arc = flip ? -arc : arc;
        const style = this.style;
        this.sweepMs = style.sweepMs;
        this.lifeMs = style.lifeMs;
        this.trail = style.trail;
        this.thicknessShare = style.thickness;
        this.slices = SLASH_SLICES;
        this.begin(x, y);
    }

    /**
     * Axes (bloque B): a round trail centred on (x, y) whose head goes once round the circle in `durationMs`, starting
     * at `angle` (radians), clockwise on screen or not.
     */
    public showSpin(x: number, y: number, radius: number, angle: number, durationMs: number, clockwise: boolean): void {
        this.radius = radius;
        this.start = angle;
        this.arc = clockwise ? Math.PI * 2 : -Math.PI * 2;
        this.sweepMs = durationMs;
        this.trail = SPIN_TRAIL.trail;
        this.lifeMs = durationMs * (1 + SPIN_TRAIL.trail);
        this.thicknessShare = SPIN_TRAIL.thickness;
        this.slices = SLASH_SLICES * 2;
        this.begin(x, y);
    }

    private begin(x: number, y: number): void {
        this.elapsedMs = 0;
        this.active = true;
        const depth = y + DEPTH_EFFECT_OFFSET;
        this.graphics.setPosition(x, y).setDepth(depth).setAlpha(1).setVisible(true);
        this.glow.setPosition(x, y).setDepth(depth).setAlpha(1).setVisible(true);
        this.launchSparks();
        this.draw();
    }

    public update(deltaMs: number): void {
        if (!this.active) return;
        this.elapsedMs += deltaMs;
        if (this.elapsedMs >= this.lifeMs) {
            this.active = false;
            this.graphics.setVisible(false);
            this.glow.setVisible(false);
            return;
        }
        const dt = deltaMs / 1000;
        for (const spark of this.sparks) {
            if (spark.lifeMs <= 0) continue;
            if (spark.waitMs > 0) {
                spark.waitMs -= deltaMs;
                continue;
            }
            spark.lifeMs -= deltaMs;
            spark.x += spark.vx * dt;
            spark.y += spark.vy * dt;
        }
        this.draw();
    }

    private draw(): void {
        const style = this.style;
        this.graphics.clear();
        this.glow.clear();
        if (style.id === 'classic') {
            this.drawClassic(style);
            return;
        }
        const r = this.radius;
        const outer = r * style.outerRadius;
        const maxThick = r * this.thicknessShare;
        const t = this.elapsedMs;
        // With a sweep the trail fades by itself; without one the whole arc fades over its life.
        const head = this.sweepMs > 0 ? t / this.sweepMs : Number.POSITIVE_INFINITY;
        const fade = this.sweepMs > 0 ? 1 : 1 - t / this.lifeMs;
        const glowPad = maxThick * 0.5 + 4;
        const slices = this.slices;
        for (let i = 0; i < slices; i++) {
            const u0 = i / slices;
            const u1 = (i + 1) / slices;
            const mid = (u0 + u1) / 2;
            if (mid > head) break;
            const behind = head - mid;
            const trailAlpha = this.sweepMs > 0 ? 1 - behind / this.trail : 1;
            if (trailAlpha <= 0) continue;
            const alpha = style.alpha * fade * trailAlpha;
            const th0 = this.thickness(style, maxThick, u0);
            const th1 = this.thickness(style, maxThick, u1);
            const a0 = this.start + this.arc * u0;
            const a1 = this.start + this.arc * u1;
            if (style.glow > 0) {
                this.glow.fillStyle(style.color, style.glow * alpha);
                this.fillQuad(this.glow, a0, a1, outer + glowPad * 0.5, outer - th0 - glowPad, outer - th1 - glowPad);
            }
            this.graphics.fillStyle(style.color, alpha);
            this.fillQuad(this.graphics, a0, a1, outer, outer - th0, outer - th1);
            if (style.edgeWidth > 0) {
                this.graphics.lineStyle(style.edgeWidth, style.edgeColor, Math.min(1, alpha * 1.3));
                this.graphics.lineBetween(Math.cos(a0) * outer, Math.sin(a0) * outer, Math.cos(a1) * outer, Math.sin(a1) * outer);
            }
        }
        this.drawSparks();
    }

    private thickness(style: SlashStyle, maxThick: number, u: number): number {
        return maxThick * (1 - style.taper + style.taper * Math.sin(Math.PI * u));
    }

    /** One slice of the band: outer edge at `outer`, inner edge from `inner0` (angle a0) to `inner1` (angle a1). */
    private fillQuad(g: Phaser.GameObjects.Graphics, a0: number, a1: number, outer: number, inner0: number, inner1: number): void {
        const [p0, p1, p2, p3] = this.quad;
        const c0 = Math.cos(a0);
        const s0 = Math.sin(a0);
        const c1 = Math.cos(a1);
        const s1 = Math.sin(a1);
        p0.set(c0 * outer, s0 * outer);
        p1.set(c1 * outer, s1 * outer);
        p2.set(c1 * Math.max(0, inner1), s1 * Math.max(0, inner1));
        p3.set(c0 * Math.max(0, inner0), s0 * Math.max(0, inner0));
        g.fillPoints(this.quad, true);
    }

    private launchSparks(): void {
        const count = this.style.sparks;
        // From the tip where the swing ends, flying on in the direction of the blade (tangent) and slightly outwards.
        const end = this.start + this.arc;
        const tipR = this.radius * this.style.outerRadius;
        const tangent = end + (this.arc >= 0 ? Math.PI / 2 : -Math.PI / 2);
        const spread = Phaser.Math.DegToRad(SLASH_SPARK.spreadDegrees);
        for (let i = 0; i < this.sparks.length; i++) {
            const spark = this.sparks[i];
            if (i >= count) {
                spark.lifeMs = 0;
                continue;
            }
            // The first ones from the tip, the rest from along the last third of the arc.
            const at = i === 0 ? end : this.start + this.arc * Phaser.Math.FloatBetween(0.66, 1);
            const dir = (i === 0 ? tangent : at + Math.PI / 2 * Math.sign(this.arc || 1)) + Phaser.Math.FloatBetween(-spread, spread) * 0.5 - spread * 0.3;
            const speed = Phaser.Math.FloatBetween(SLASH_SPARK.minSpeed, SLASH_SPARK.maxSpeed);
            spark.x = Math.cos(at) * tipR;
            spark.y = Math.sin(at) * tipR;
            spark.vx = Math.cos(dir) * speed;
            spark.vy = Math.sin(dir) * speed;
            spark.lifeMs = SLASH_SPARK.lifeMs * Phaser.Math.FloatBetween(0.6, 1);
            spark.waitMs = this.sweepMs;
        }
    }

    private drawSparks(): void {
        for (const spark of this.sparks) {
            if (spark.lifeMs <= 0 || spark.waitMs > 0) continue;
            const alpha = Math.min(1, spark.lifeMs / (SLASH_SPARK.lifeMs * 0.5));
            const speed = Math.hypot(spark.vx, spark.vy) || 1;
            const tailX = spark.x - (spark.vx / speed) * SLASH_SPARK.length;
            const tailY = spark.y - (spark.vy / speed) * SLASH_SPARK.length;
            this.glow.lineStyle(SLASH_SPARK.width * 2.5, SLASH_SPARK.color, alpha * 0.35);
            this.glow.lineBetween(tailX, tailY, spark.x, spark.y);
            this.graphics.lineStyle(SLASH_SPARK.width, SLASH_SPARK.color, alpha);
            this.graphics.lineBetween(tailX, tailY, spark.x, spark.y);
        }
    }

    /** The first look: two plain arcs that fade together. */
    private drawClassic(style: SlashStyle): void {
        const start = this.start;
        const end = this.start + this.arc;
        const fade = 1 - this.elapsedMs / this.lifeMs;
        this.graphics
            .lineStyle(CLASSIC_WIDTH, style.color, 0.9 * fade)
            .beginPath()
            .arc(0, 0, this.radius * 0.85, start, end)
            .strokePath()
            .lineStyle(CLASSIC_WIDTH / 2, style.color, 0.5 * fade)
            .beginPath()
            .arc(0, 0, this.radius * 0.6, start + this.arc * 0.15, end - this.arc * 0.15)
            .strokePath();
    }
}
