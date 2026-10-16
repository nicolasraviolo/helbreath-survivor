// Números de daño flotantes, reciclados con un pool (regla 5).
// Estilo inspirado en sp-client/src/game/objects/GameObject.ts (addDamageText): "-N" rojo en Georgia
// negrita, sube y se desvanece la segunda mitad de su vida. Añadimos un borde negro para que se lea sobre la hierba.
// Los críticos salen en amarillo, más grandes y con "!" (como "-90Pts!" en el original).
import Phaser from 'phaser';
import {
    DAMAGE_NUMBER_FONT_SIZE,
    DAMAGE_NUMBER_LIFE_MS,
    DAMAGE_NUMBER_MAX,
    DAMAGE_NUMBER_RISE_PX_PER_S,
    DAMAGE_NUMBER_SPREAD_PX,
    DEPTH_DAMAGE_NUMBERS,
} from '../config/gameConfig';

const NORMAL_COLOR = '#ff2020';
const CRITICAL_COLOR = '#ffe040';
const CRITICAL_SCALE = 1.3;
import { Pool, type Poolable } from '../utils/Pool';

class DamageNumber implements Poolable {
    public poolIndex = -1;
    public ageMs = 0;
    public readonly text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.text = scene.add.text(0, 0, '', {
            fontFamily: 'Georgia, serif',
            fontStyle: 'bold',
            fontSize: `${DAMAGE_NUMBER_FONT_SIZE}px`,
            color: NORMAL_COLOR,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS).setActive(false).setVisible(false);
    }
}

export class DamageNumbers {
    private readonly pool: Pool<DamageNumber>;
    private readonly finished: DamageNumber[] = [];

    constructor(scene: Phaser.Scene) {
        this.pool = new Pool(() => new DamageNumber(scene));
    }

    public get active(): number {
        return this.pool.active.length;
    }

    /** Shows "-amount" at (x, y). Skipped when too many are on screen. */
    public show(x: number, y: number, amount: number, critical = false): void {
        if (this.pool.active.length >= DAMAGE_NUMBER_MAX) return;
        const number = this.pool.acquire();
        number.ageMs = 0;
        const spread = (Math.random() - 0.5) * DAMAGE_NUMBER_SPREAD_PX;
        number.text.setText(critical ? `-${amount}!` : `-${amount}`)
            .setColor(critical ? CRITICAL_COLOR : NORMAL_COLOR)
            .setScale(critical ? CRITICAL_SCALE : 1)
            .setPosition(x + spread, y).setAlpha(1).setActive(true).setVisible(true);
    }

    public update(deltaMs: number): void {
        const fadeStart = DAMAGE_NUMBER_LIFE_MS / 2;
        const rise = (DAMAGE_NUMBER_RISE_PX_PER_S * deltaMs) / 1000;
        for (const number of this.pool.active) {
            number.ageMs += deltaMs;
            const text = number.text;
            text.y -= rise;
            if (number.ageMs >= DAMAGE_NUMBER_LIFE_MS) {
                text.setActive(false).setVisible(false);
                this.finished.push(number);
            } else if (number.ageMs > fadeStart) {
                text.setAlpha(1 - (number.ageMs - fadeStart) / (DAMAGE_NUMBER_LIFE_MS - fadeStart));
            }
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const number of this.finished) this.pool.release(number);
        this.finished.length = 0;
    }
}
