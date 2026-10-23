// Ported from sp-client/src/game/spells/LightningBolt.ts (MIT, Erko Knoll)
// Rayo que cae del cielo (Lightning Bolt, Fase 26C), reciclable. Como sp-client/src/game/spells/LightningBolt.ts: una
// línea quebrada blanca con dos brillos azules, redibujada al azar unas pocas veces mientras dura.
import Phaser from 'phaser';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import { LIGHTNING_LOOK } from '../data/spells';
import type { Poolable } from '../utils/Pool';

export class LightningArc implements Poolable {
    public poolIndex = -1;
    private readonly graphics: Phaser.GameObjects.Graphics;
    private x = 0;
    private y = 0;
    private leftMs = 0;
    private redrawInMs = 0;
    /** Sideways shift of each joint, reused on every redraw. */
    private readonly jitters: number[] = [];

    constructor(scene: Phaser.Scene) {
        this.graphics = scene.add.graphics().setActive(false).setVisible(false);
    }

    /** Strikes (x, y) from far above. */
    public strike(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.leftMs = LIGHTNING_LOOK.durationMs;
        this.redrawInMs = 0;
        this.graphics.setActive(true).setVisible(true).setDepth(y + DEPTH_EFFECT_OFFSET);
        this.draw();
    }

    /** Returns false once it has faded (it must go back to the pool). */
    public update(deltaMs: number): boolean {
        this.leftMs -= deltaMs;
        if (this.leftMs <= 0) {
            this.graphics.clear().setActive(false).setVisible(false);
            return false;
        }
        this.redrawInMs -= deltaMs;
        if (this.redrawInMs <= 0) this.draw();
        return true;
    }

    private draw(): void {
        const look = LIGHTNING_LOOK;
        this.redrawInMs = look.redrawMs;
        const g = this.graphics.clear();
        const segments = look.segments;
        for (let i = 0; i <= segments; i++) {
            // The ends stay put: it leaves the sky and lands on the target.
            this.jitters[i] = i === 0 || i === segments ? 0 : Phaser.Math.Between(-look.jitterPx, look.jitterPx);
        }
        const line = (width: number, color: number, alpha: number, dx: number) => {
            g.lineStyle(width, color, alpha).beginPath();
            for (let i = 0; i <= segments; i++) {
                const px = this.x + (this.jitters[i] ?? 0) + dx;
                const py = this.y - look.fromDy * (1 - i / segments);
                if (i === 0) g.moveTo(px, py);
                else g.lineTo(px, py);
            }
            g.strokePath();
        };
        line(look.glow.width, look.glow.color, look.glow.alpha, -look.glow.offsetPx);
        line(look.glow.width, look.glow.color, look.glow.alpha, look.glow.offsetPx);
        line(look.core.width, look.core.color, look.core.alpha, 0);
    }
}
