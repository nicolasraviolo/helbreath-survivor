// Portal del final de la partida (Fase 13): se abre donde murió el jefe final, gira en bucle sobre el suelo y
// cuenta los segundos que quedan. Solo hay uno a la vez, así que no va en un pool.
import Phaser from 'phaser';
import { EFFECTS } from '../config/effects';
import { PORTAL } from '../data/waves';

const PORTAL_EFFECT = 'fx.portal';

export class Portal {
    private readonly sprite: Phaser.GameObjects.Sprite;
    private msLeft: number;

    constructor(scene: Phaser.Scene, public readonly x: number, public readonly y: number, msLeft: number) {
        this.msLeft = msLeft;
        const def = EFFECTS[PORTAL_EFFECT];
        this.sprite = scene.add.sprite(x + def.offsetX, y + def.offsetY, '__DEFAULT').setDepth(y + def.depthOffset).play(PORTAL_EFFECT);
    }

    /** Milliseconds before the run ends on its own. */
    public get timeLeft(): number {
        return Math.max(0, this.msLeft);
    }

    /** Counts down; returns false once the time is up. */
    public update(deltaMs: number): boolean {
        this.msLeft -= deltaMs;
        return this.msLeft > 0;
    }

    /** The feet at (x, y) are inside the portal. */
    public contains(x: number, y: number): boolean {
        return Phaser.Math.Distance.Between(x, y, this.x, this.y) <= PORTAL.enterRadius;
    }

    public destroy(): void {
        this.sprite.destroy();
    }
}
