// Números de daño flotantes, reciclados con un pool (regla 5).
// Estilo inspirado en sp-client/src/game/objects/GameObject.ts (addDamageText): "-N" rojo en Georgia
// negrita, sube y se desvanece la segunda mitad de su vida. Añadimos un borde negro para que se lea sobre la hierba.
// Los críticos salen en amarillo y más grandes. El "!" solo va al final del golpe que mata, como en el original
// (decidido por el propietario el 18-oct-2026: "20" si sobrevive, "20!" si muere).
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
/** Words instead of numbers ("Resist", Fase 18B): light blue, a bit smaller. */
const WORD_COLOR = '#80c8ff';
const WORD_SCALE = 0.85;
/** Words shown at almost the same time (the Wyvern's 3 fireballs) stack upwards instead of overlapping. */
const WORD_STACK_MS = 400;
const WORD_STACK_PX = 14;
import { POISON } from '../data/attributes';
import { ELEMENT_MODIFIER, type ElementMatch } from '../data/elements';
import { Pool, type Poolable } from '../utils/Pool';

class DamageNumber implements Poolable {
    public poolIndex = -1;
    public ageMs = 0;
    /** Shows a word, not a number. */
    public isWord = false;
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

    /**
     * Shows "-amount" at (x, y), with "!" if the blow killed. Skipped when too many are on screen. A spell against a
     * monster's weak element shows pink, against its own element grey (data/elements.ts); a critical one stays big.
     */
    public show(x: number, y: number, amount: number, critical = false, lethal = false, element: ElementMatch = 'neutral'): void {
        const color = element === 'bonus' ? ELEMENT_MODIFIER.bonusColor
            : element === 'penalty' ? ELEMENT_MODIFIER.penaltyColor
            : critical ? CRITICAL_COLOR : NORMAL_COLOR;
        this.showColored(x, y, amount, color, critical, lethal);
    }

    /** Poison damage (Fase 21B): green, with "!" if it killed. */
    public showPoison(x: number, y: number, amount: number, lethal = false): void {
        this.showColored(x, y, amount, POISON.numberColor, false, lethal);
    }

    /** "-amount" in `color` (poison green, burn orange…), big as a critical hit if `big`. */
    public showColored(x: number, y: number, amount: number, color: string, big = false, lethal = false): void {
        if (this.pool.active.length >= DAMAGE_NUMBER_MAX) return;
        const number = this.pool.acquire();
        number.ageMs = 0;
        number.isWord = false;
        const spread = (Math.random() - 0.5) * DAMAGE_NUMBER_SPREAD_PX;
        number.text.setText(lethal ? `-${amount}!` : `-${amount}`).setColor(color).setScale(big ? CRITICAL_SCALE : 1)
            .setPosition(x + spread, y).setAlpha(1).setActive(true).setVisible(true);
    }

    /** Shows a word (e.g. "Resist") at (x, y), rising like a number. Skipped when too many are on screen. */
    public showWord(x: number, y: number, word: string): void {
        if (this.pool.active.length >= DAMAGE_NUMBER_MAX) return;
        let recent = 0;
        for (const other of this.pool.active) if (other.isWord && other.ageMs < WORD_STACK_MS) recent++;
        const number = this.pool.acquire();
        number.ageMs = 0;
        number.isWord = true;
        number.text.setText(word).setColor(WORD_COLOR).setScale(WORD_SCALE)
            .setPosition(x, y - recent * WORD_STACK_PX).setAlpha(1).setActive(true).setVisible(true);
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
