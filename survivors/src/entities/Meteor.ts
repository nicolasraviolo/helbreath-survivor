// Ported from sp-client/src/game/spells/MeteorStrikeProjectile.ts (MIT, Erko Knoll)
// Meteorito del Meteor Strike (Fase 19B), reciclable: cae en diagonal desde arriba a la derecha hasta el punto elegido,
// con el meteoro y sus tres orbes animándose a la vez. Al llegar, WeaponSystem dibuja la explosión y aplica el daño.
// Diferencias con sp-client: va con pool (regla 5) y lo mueve WeaponSystem en vez de su propio evento 'update'.
import type Phaser from 'phaser';
import { DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import type { MeteorSpellDef, MeteorLook } from '../data/activeSpells';
import type { Poolable } from '../utils/Pool';
import { smoothSprite } from '../hb/XbrPipeline';

export class Meteor implements Poolable {
    public poolIndex = -1;
    public def!: MeteorSpellDef;
    /** Damage multiplier of this cast (Power), applied when it lands. */
    public powerMultiplier = 1;
    public targetX = 0;
    public targetY = 0;
    /** Where it is now. */
    public x = 0;
    public y = 0;
    /** Time until the next puff of smoke (WeaponSystem draws it). */
    public smokeWaitMs = 0;
    private fromX = 0;
    private fromY = 0;
    private distance = 1;
    private travelled = 0;
    private speed = 0;
    private readonly sprites: Phaser.GameObjects.Sprite[];

    constructor(scene: Phaser.Scene, private readonly look: MeteorLook) {
        this.sprites = look.flight.map(() => smoothSprite(scene.add.sprite(0, 0, '__DEFAULT')).setActive(false).setVisible(false));
    }

    /** Starts falling towards (x, y). */
    public launch(def: MeteorSpellDef, powerMultiplier: number, x: number, y: number): void {
        this.def = def;
        this.powerMultiplier = powerMultiplier;
        this.targetX = x;
        this.targetY = y;
        this.fromX = x + this.look.fromDx;
        this.fromY = y + this.look.fromDy;
        this.distance = Math.hypot(this.look.fromDx, this.look.fromDy) || 1;
        this.travelled = 0;
        this.smokeWaitMs = 0;
        this.speed = this.look.speed;
        this.look.flight.forEach((key, i) => this.sprites[i]?.setActive(true).setVisible(true).play(key));
        this.place(0);
    }

    /** Moves it down. Returns false once it has landed. */
    public update(deltaMs: number): boolean {
        this.travelled += (this.speed * deltaMs) / 1000;
        const progress = Math.min(1, this.travelled / this.distance);
        this.place(progress);
        return progress < 1;
    }

    public deactivate(): void {
        for (const sprite of this.sprites) sprite.stop().setActive(false).setVisible(false);
    }

    private place(progress: number): void {
        this.x = this.fromX + (this.targetX - this.fromX) * progress;
        this.y = this.fromY + (this.targetY - this.fromY) * progress;
        // Drawn above whatever stands where it lands, all the way down.
        for (const sprite of this.sprites) sprite.setPosition(this.x, this.y).setDepth(this.targetY + DEPTH_EFFECT_OFFSET);
    }
}
