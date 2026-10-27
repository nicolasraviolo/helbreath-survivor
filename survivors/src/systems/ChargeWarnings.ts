// El "!" encima de los monstruos que van a embestir (Fase 27B, decidido por el propietario el 23-oct-2026).
// Textos reciclados con un pool (regla 5): uno por monstruo mientras se prepara; se suelta al cargar o al morir.
import Phaser from 'phaser';
import { DEPTH_DAMAGE_NUMBERS } from '../config/gameConfig';
import { CHARGE_WARNING } from '../data/movement';
import type { Enemy } from '../entities/Enemy';
import { Pool, type Poolable } from '../utils/Pool';

class ChargeWarning implements Poolable {
    public poolIndex = -1;
    public enemy: Enemy | undefined;
    public readonly text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.text = scene.add.text(0, 0, CHARGE_WARNING.text, {
            fontFamily: 'Georgia, serif',
            fontStyle: 'bold',
            fontSize: `${CHARGE_WARNING.fontSizePx}px`,
            color: CHARGE_WARNING.color,
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS - 1).setActive(false).setVisible(false);
    }
}

export class ChargeWarnings {
    private readonly pool: Pool<ChargeWarning>;
    private readonly finished: ChargeWarning[] = [];

    constructor(scene: Phaser.Scene) {
        this.pool = new Pool(() => new ChargeWarning(scene));
    }

    public get active(): number {
        return this.pool.active.length;
    }

    /** Puts a "!" over this monster (it is winding up a charge). Skipped when too many are on screen. */
    public show(enemy: Enemy): void {
        if (!CHARGE_WARNING.shown || enemy.hasChargeWarning || this.pool.active.length >= CHARGE_WARNING.maxShown) return;
        const warning = this.pool.acquire();
        warning.enemy = enemy;
        enemy.hasChargeWarning = true;
        warning.text.setActive(true).setVisible(true);
        this.place(warning, enemy);
    }

    /** Follows each monster's head; drops the "!" once it charges, dies or is frozen. */
    public update(): void {
        for (const warning of this.pool.active) {
            const enemy = warning.enemy;
            if (enemy && enemy.isWindingUp) {
                this.place(warning, enemy);
            } else {
                this.finished.push(warning);
            }
        }
        for (const warning of this.finished) {
            if (warning.enemy) warning.enemy.hasChargeWarning = false;
            warning.enemy = undefined;
            warning.text.setActive(false).setVisible(false);
            this.pool.release(warning);
        }
        this.finished.length = 0;
    }

    private place(warning: ChargeWarning, enemy: Enemy): void {
        warning.text.setPosition(enemy.x, enemy.headTopY() - CHARGE_WARNING.gapAboveHeadPx);
    }
}
